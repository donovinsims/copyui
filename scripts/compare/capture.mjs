#!/usr/bin/env node
/**
 * Reproducible two-site comparison rig.
 *
 * Captures https://www.affectui.com and the local copyui dev server under the
 * same viewport, theme, scroll, font and animation conditions, then emits
 * reference/local screenshots, a labeled pair, a 50% overlay, metrics.json and
 * a readable report.
 *
 * Usage:
 *   npm run compare
 *
 * Env:
 *   COMPARE_LOCAL_URL       default http://127.0.0.1:3000
 *   COMPARE_REFERENCE_URL   default https://www.affectui.com
 */

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = path.join(ROOT, "artifacts", "compare");
const LOCAL_URL = (process.env.COMPARE_LOCAL_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const REFERENCE_URL = (process.env.COMPARE_REFERENCE_URL ?? "https://www.affectui.com").replace(/\/$/, "");

const VIEWPORTS = [
  { id: "1440x900", width: 1440, height: 900 },
  { id: "1024x768", width: 1024, height: 768 },
  { id: "390x844", width: 390, height: 844 },
];

const THEMES = ["light", "dark"];

const SURFACES = [
  {
    id: "home",
    refPath: "/",
    local: { path: "/", nav: null },
    checks: false,
    note: "Marketing home. The local display scale is intentionally larger than the docs scale and is captured for regression, not frame alignment.",
  },
  {
    id: "components",
    refPath: "/components",
    local: { path: "/", nav: "Components" },
    checks: true,
    note: "Library index: the primary 1v1 frame.",
  },
  {
    id: "detail-chat-composer",
    refPath: "/components/chat-composer",
    local: { path: "/components/chat-composer", nav: null },
    checks: true,
    note: "Component detail: article width, detail-only top bar, title/lead type, preview bar, stage inset and tab chrome are all measured from the reference template.",
  },
];

const FREEZE_CSS = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
  html { scroll-behavior: auto !important; }
`;

function selectorsFor(site, surface) {
  const local = site === "local";
  if (surface.id === "components") {
    return {
      panel: local ? ".ds__panel" : "main.panel",
      sidebar: local ? ".ds__side" : ".sidebar",
      content: local ? ".library" : ".hero",
      topbar: local ? ".ds__top" : ".topbar",
      title: local ? ".library .page-title" : "h1",
      body: "body",
      card: local ? ".library-card" : "article.card",
      cardTitle: local ? ".library-card__title" : ".card__title",
      cardDesc: local ? ".library-card__desc" : ".card__desc",
      cardStage: local ? ".library-card__stage" : ".card__stage",
    };
  }
  if (surface.id === "detail-chat-composer") {
    const section = (nth) =>
      local
        ? `.doc__section:nth-of-type(${nth})`
        : `.doc__article > .doc__section:nth-of-type(${nth})`;
    return {
      panel: local ? ".ds__panel" : "main.panel",
      sidebar: local ? ".ds__side" : ".sidebar",
      topbar: local ? ".ds__top" : ".topbar",
      content: ".doc",
      breadcrumb: ".breadcrumb",
      header: ".doc__header",
      title: local ? ".doc__title" : "h1.doc__title",
      lead: ".doc__lead",
      section: ".doc__section--preview",
      bar: ".preview-bar",
      stage: ".stage",
      stageLook: ".stage__look",
      composer: local ? ".ui-cc" : ".ui-ccc",
      tab: local ? ".preview-tab[aria-selected=\"true\"]" : ".preview-bar button",
      contentSection: section(2),
      contentH2: `${section(2)} .doc__h2`,
      contentList: `${section(2)} .doc__list`,
      installSection: section(4),
      install: ".install",
      installHead: ".install__head",
      installCmd: ".install__cmd",
      installTabs: ".underline-tabs",
      pmTabs: ".pm-tabs",
      usageSection: section(5),
      code: ".code",
      codeHead: ".code__head",
      codeBody: ".code__body",
      examplesSection: section(6),
      apiSection: section(7),
      apiH2: `${section(7)} .doc__h2`,
      apiH3: ".doc__h3--code",
      tableWrap: ".table-wrap",
      table: ".table",
      tableHead: "thead",
      tableTh: "th",
      tableTd: "td",
      keyboardSection: section(8),
      relatedSection: section(12),
      related: ".related",
      relatedCard: ".related > *",
      footer: ".doc__footer",
      activeNav: local ? ".ds__nav-item--sub[aria-current=\"page\"]" : ".sidebar .nav-link[aria-current=\"page\"]",
      toc: "[aria-label=\"On this page\"], [class*=\"toc\"]",
      body: "body",
    };
  }
  return {
    body: "body",
    title: "h1",
  };
}

async function reachable(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureLocalServer() {
  if (await reachable(LOCAL_URL)) {
    console.log(`[compare] reusing local server at ${LOCAL_URL}`);
    return null;
  }

  const viteBin = path.join(ROOT, "node_modules", "vite", "bin", "vite.js");
  console.log(`[compare] starting local server at ${LOCAL_URL}`);
  const child = spawn(process.execPath, [viteBin, "--host", "127.0.0.1", "--port", "3000"], {
    cwd: ROOT,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout?.on("data", (chunk) => { output += String(chunk); });
  child.stderr?.on("data", (chunk) => { output += String(chunk); });

  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (await reachable(LOCAL_URL)) return child;
    if (child.exitCode !== null) break;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  child.kill("SIGTERM");
  throw new Error(`Local server did not start at ${LOCAL_URL}.\n${output}`);
}

function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  setTimeout(() => {
    if (child.exitCode === null) child.kill("SIGKILL");
  }, 2500).unref();
}

async function collectMetrics(page, selectors) {
  return page.evaluate(({ selectors }) => {
    const styleSnapshot = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        cls: typeof el.className === "string" ? el.className.slice(0, 120) : "",
        rect: {
          x: Number(r.x.toFixed(2)),
          y: Number(r.y.toFixed(2)),
          width: Number(r.width.toFixed(2)),
          height: Number(r.height.toFixed(2)),
        },
        font: {
          family: s.fontFamily,
          size: Number.parseFloat(s.fontSize),
          weight: s.fontWeight,
          lineHeight: Number.parseFloat(s.lineHeight),
          letterSpacing: s.letterSpacing,
        },
        color: s.color,
        background: s.backgroundColor,
        border: {
          width: Number.parseFloat(s.borderTopWidth),
          color: s.borderTopColor,
        },
        radius: Number.parseFloat(s.borderRadius),
        boxShadow: s.boxShadow,
        display: s.display,
        padding: s.padding,
      };
    };
    const result = {};
    for (const [key, selector] of Object.entries(selectors)) {
      const el = document.querySelector(selector);
      result[key] = el ? styleSnapshot(el) : null;
    }
    const cards = selectors.card ? [...document.querySelectorAll(selectors.card)] : [];
    const grid = cards[0]?.parentElement ?? null;
    result.grid = grid ? styleSnapshot(grid) : null;
    if (result.grid) {
      const gs = getComputedStyle(grid);
      result.grid.columns = gs.gridTemplateColumns.split(/\s+/).filter(Boolean).length;
      result.grid.gap = gs.gap;
    }
    result.cardCount = cards.length;
    result.cards = cards.slice(0, 24).map((card) => {
      const r = card.getBoundingClientRect();
      return {
        x: Number(r.x.toFixed(2)),
        y: Number(r.y.toFixed(2)),
        width: Number(r.width.toFixed(2)),
        height: Number(r.height.toFixed(2)),
      };
    });

    const contentSections = selectors.contentSection
      ? [...document.querySelectorAll(".doc__section:not(.doc__section--preview)")]
      : [];
    result.sectionTitles = contentSections.map((section) =>
      (section.querySelector(".doc__h2")?.textContent ?? "").trim(),
    );
    result.sectionPaddings = contentSections.map(
      (section) => getComputedStyle(section).paddingTop,
    );
    result.sectionRects = contentSections.map((section) => {
      const r = section.getBoundingClientRect();
      return {
        x: Number(r.x.toFixed(2)),
        y: Number(r.y.toFixed(2)),
        width: Number(r.width.toFixed(2)),
      };
    });
    const activeNav = selectors.activeNav ? document.querySelector(selectors.activeNav) : null;
    result.activeNavText = activeNav?.textContent?.trim() ?? null;
    result.activeNavCurrent = activeNav?.getAttribute("aria-current") ?? null;
    result.tocCount = selectors.toc ? document.querySelectorAll(selectors.toc).length : 0;
    result.apiRows = selectors.table ? document.querySelectorAll(`${selectors.table} tbody tr`).length : 0;
    result.apiColumns = selectors.table ? document.querySelectorAll(`${selectors.table} thead th`).length : 0;
    const related = selectors.related ? document.querySelector(selectors.related) : null;
    result.relatedColumns = related
      ? getComputedStyle(related).gridTemplateColumns.split(/\s+/).filter(Boolean).length
      : null;
    return result;
  }, { selectors });
}

async function waitForSurface(page, surface) {
  if (surface.id === "components") {
    await page.locator("article.card, .library-card").first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
  }
  if (surface.id === "detail-chat-composer") {
    await page.locator("h1").first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
  }
}

async function applyTheme(page, theme) {
  const themeButton = page.getByRole("button", {
    name: theme === "light" ? "Light theme" : "Dark theme",
    exact: true,
  });
  if (await themeButton.count()) {
    await themeButton.first().click({ timeout: 2500 }).catch(() => {});
    await page.waitForTimeout(350);
  }

  // Make the state explicit even if the marketing site did not expose a button on this viewport.
  await page.evaluate((next) => {
    const root = document.documentElement;
    if (next === "dark") {
      root.setAttribute("data-theme", "dark");
      root.classList.add("dark");
    } else {
      root.removeAttribute("data-theme");
      root.classList.remove("dark");
      root.dataset.theme = "light";
    }
    try {
      localStorage.setItem("theme", next);
      localStorage.setItem("copyui-theme", next);
    } catch {
      /* storage can be unavailable in a strict context */
    }
  }, theme);
  await page.waitForTimeout(300);
}

async function settle(page) {
  await page.evaluate(async () => { await document.fonts.ready; return true; }).catch(() => {});
  await page.waitForFunction(() => document.fonts.status === "loaded", null, { timeout: 5000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
}

async function captureSite(browser, site, surface, viewport, theme) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    colorScheme: theme,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.addInitScript(({ next, origin }) => {
    if (location.origin !== origin) return;
    try {
      localStorage.setItem("copyui-theme", next);
      document.documentElement.dataset.theme = next;
      if (next === "dark") document.documentElement.classList.add("dark");
    } catch {
      /* no-op */
    }
  }, { next: theme, origin: LOCAL_URL });

  const pathToUse = site === "reference" ? surface.refPath : surface.local.path;
  const url = (site === "reference" ? REFERENCE_URL : LOCAL_URL) + pathToUse;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1000);

  if (site === "local" && surface.local.nav) {
    const menu = page.locator(".ds__menu");
    if (await menu.isVisible().catch(() => false)) {
      await menu.click();
      await page.waitForTimeout(250);
    }
    await page.locator(".ds__nav-item").filter({ hasText: surface.local.nav }).first().click({ timeout: 5000 });
    await page.waitForTimeout(600);
  }

  if (site === "reference") {
    const decline = page.getByRole("button", { name: "Decline", exact: true });
    if (await decline.isVisible().catch(() => false)) {
      await decline.click({ timeout: 2500 }).catch(() => {});
      await page.waitForTimeout(250);
    }
  }

  await applyTheme(page, theme);
  await waitForSurface(page, surface);

  // The same freeze and settle strategy for both sites.
  await page.addStyleTag({ content: FREEZE_CSS });
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      try {
        animation.pause();
      } catch {
        /* ignore non-pausable animations */
      }
    }
  });
  await settle(page);

  const metrics = await collectMetrics(page, selectorsFor(site, surface));
  const dir = path.join(OUT_DIR, surface.id, viewport.id, theme);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${site}.png`);
  await page.screenshot({ path: file, animations: "disabled", caret: "hide" });
  await context.close();
  return { metrics, errors, file };
}

function missingRequired(surface, metrics, site) {
  const detailRequired = [
    "panel",
    "content",
    "title",
    "bar",
    "stage",
    "stageLook",
    "composer",
    "contentSection",
    "contentH2",
    "contentList",
    "apiSection",
    "apiH3",
    "tableWrap",
    "table",
    "related",
    "relatedCard",
    "footer",
    "activeNav",
  ];
  if (site === "local") {
    detailRequired.push("installSection", "install", "installHead", "installCmd", "code", "codeHead", "codeBody");
  }
  const required =
    surface.id === "components"
      ? ["panel", "sidebar", "content", "topbar", "title", "card"]
      : surface.id === "detail-chat-composer"
        ? detailRequired
        : ["title", "body"];
  return required.filter((key) => !metrics[key]);
}

async function captureSiteStable(browser, site, surface, viewport, theme) {
  let last = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    last = await captureSite(browser, site, surface, viewport, theme);
    const missing = missingRequired(surface, last.metrics, site);
    if (!missing.length) return last;
    console.log(`[compare] ${site} retry ${attempt}/3 · ${surface.id} · ${viewport.id} · ${theme} · missing ${missing.join(", ")}`);
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
  return last;
}

async function imageData(file) {
  return `data:image/png;base64,${(await readFile(file)).toString("base64")}`;
}

async function composePair(page, surface, viewport, theme, referenceFile, localFile, outFile) {
  const ref = await imageData(referenceFile);
  const local = await imageData(localFile);
  await page.setViewportSize({
    width: viewport.width * 2 + 48,
    height: viewport.height + 100,
  });
  const html = `<!doctype html>
  <style>
    * { box-sizing: border-box; margin: 0; }
    body { background: #ededed; color: #111; font: 12px/1.4 Inter, ui-sans-serif, system-ui, sans-serif; }
    .wrap { padding: 16px; }
    .row { display: grid; grid-template-columns: ${viewport.width}px ${viewport.width}px; gap: 16px; align-items: start; }
    figure { background: #fff; border: 1px solid #d8d8d8; border-radius: 10px; overflow: hidden; }
    figcaption { display: flex; justify-content: space-between; gap: 12px; padding: 7px 10px; border-bottom: 1px solid #eee; color: #777; }
    figcaption b { color: #111; font-weight: 500; }
    img { display: block; width: ${viewport.width}px; height: ${viewport.height}px; }
    .note { padding-top: 10px; color: #777; }
  </style>
  <div class="wrap">
    <div class="row">
      <figure><figcaption><b>Reference · affectui.com</b><span>${surface.id} · ${viewport.id} · ${theme}</span></figcaption><img src="${ref}" alt=""></figure>
      <figure><figcaption><b>Recreation · copyui</b><span>${surface.id} · ${viewport.id} · ${theme}</span></figcaption><img src="${local}" alt=""></figure>
    </div>
    <div class="note">Same viewport, theme, font wait, reduced-motion + frozen animation state, caret hidden, scrollY 0.</div>
  </div>`;
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode().catch(() => {}))));
  await page.screenshot({ path: outFile, fullPage: true, animations: "disabled", caret: "hide" });
}

async function composeOverlay(page, viewport, referenceFile, localFile, outFile) {
  const ref = await imageData(referenceFile);
  const local = await imageData(localFile);
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  const html = `<!doctype html>
  <style>
    * { box-sizing: border-box; }
    html, body { width: ${viewport.width}px; height: ${viewport.height}px; margin: 0; overflow: hidden; background: #fff; }
    .stack { position: relative; width: ${viewport.width}px; height: ${viewport.height}px; }
    img { position: absolute; inset: 0; display: block; width: ${viewport.width}px; height: ${viewport.height}px; }
    img:last-child { opacity: .5; }
  </style>
  <div class="stack"><img src="${ref}" alt=""><img src="${local}" alt=""></div>`;
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode().catch(() => {}))));
  await page.screenshot({ path: outFile, animations: "disabled", caret: "hide" });
}

function checksFor(surface, reference, local) {
  const checks = [];
  const add = (name, a, b, tolerance, unit = "px") => {
    if (a === null || a === undefined || b === null || b === undefined) {
      checks.push({ name, reference: a ?? null, local: b ?? null, unit, pass: false, delta: null, note: "missing value" });
      return;
    }
    const delta = Math.abs(a - b);
    checks.push({
      name,
      reference: a,
      local: b,
      unit,
      delta: Number(delta.toFixed(3)),
      pass: delta <= tolerance,
    });
  };
  const exact = (name, a, b) => {
    checks.push({ name, reference: a ?? null, local: b ?? null, unit: "", delta: null, pass: a === b });
  };
  const value = (node, pathname) => pathname.split(".").reduce((current, key) => current?.[key], node) ?? null;
  const same = (name, a, b) => {
    checks.push({
      name,
      reference: a ?? null,
      local: b ?? null,
      unit: "",
      delta: null,
      pass: JSON.stringify(a) === JSON.stringify(b),
    });
  };

  if (surface.id === "detail-chat-composer") {
    add("panel.x", value(reference.panel, "rect.x"), value(local.panel, "rect.x"), 1);
    add("panel.y", value(reference.panel, "rect.y"), value(local.panel, "rect.y"), 1);
    add("panel.width", value(reference.panel, "rect.width"), value(local.panel, "rect.width"), 1);
    add("panel.radius", value(reference.panel, "radius"), value(local.panel, "radius"), 0.5);
    exact("panel.background", value(reference.panel, "background"), value(local.panel, "background"));
    exact("panel.borderColor", value(reference.panel, "border.color"), value(local.panel, "border.color"));
    add("sidebar.width", value(reference.sidebar, "rect.width"), value(local.sidebar, "rect.width"), 1);
    add("topbar.height", value(reference.topbar, "rect.height"), value(local.topbar, "rect.height"), 1);
    add("content.x", value(reference.content, "rect.x"), value(local.content, "rect.x"), 1);
    add("content.y", value(reference.content, "rect.y"), value(local.content, "rect.y"), 1);
    add("content.width", value(reference.content, "rect.width"), value(local.content, "rect.width"), 1);
    add("breadcrumb.height", value(reference.breadcrumb, "rect.height"), value(local.breadcrumb, "rect.height"), 1);
    exact("breadcrumb.color", value(reference.breadcrumb, "color"), value(local.breadcrumb, "color"));
    add("header.y", value(reference.header, "rect.y"), value(local.header, "rect.y"), 1);
    add("header.height", value(reference.header, "rect.height"), value(local.header, "rect.height"), 1);
    add("title.x", value(reference.title, "rect.x"), value(local.title, "rect.x"), 1);
    add("title.y", value(reference.title, "rect.y"), value(local.title, "rect.y"), 1);
    add("title.width", value(reference.title, "rect.width"), value(local.title, "rect.width"), 1);
    add("title.height", value(reference.title, "rect.height"), value(local.title, "rect.height"), 1);
    add("title.fontSize", value(reference.title, "font.size"), value(local.title, "font.size"), 0.01);
    add("title.lineHeight", value(reference.title, "font.lineHeight"), value(local.title, "font.lineHeight"), 0.05);
    exact("title.fontWeight", value(reference.title, "font.weight"), value(local.title, "font.weight"));
    exact("title.letterSpacing", value(reference.title, "font.letterSpacing"), value(local.title, "font.letterSpacing"));
    exact("title.color", value(reference.title, "color"), value(local.title, "color"));
    add("lead.y", value(reference.lead, "rect.y"), value(local.lead, "rect.y"), 1);
    add("lead.width", value(reference.lead, "rect.width"), value(local.lead, "rect.width"), 1);
    add("lead.height", value(reference.lead, "rect.height"), value(local.lead, "rect.height"), 1);
    add("lead.fontSize", value(reference.lead, "font.size"), value(local.lead, "font.size"), 0.01);
    add("lead.lineHeight", value(reference.lead, "font.lineHeight"), value(local.lead, "font.lineHeight"), 0.05);
    exact("lead.color", value(reference.lead, "color"), value(local.lead, "color"));
    add("section.y", value(reference.section, "rect.y"), value(local.section, "rect.y"), 1);
    add("section.width", value(reference.section, "rect.width"), value(local.section, "rect.width"), 1);
    add("section.height", value(reference.section, "rect.height"), value(local.section, "rect.height"), 1);
    add("bar.y", value(reference.bar, "rect.y"), value(local.bar, "rect.y"), 1);
    add("bar.width", value(reference.bar, "rect.width"), value(local.bar, "rect.width"), 1);
    add("bar.height", value(reference.bar, "rect.height"), value(local.bar, "rect.height"), 1);
    add("stage.y", value(reference.stage, "rect.y"), value(local.stage, "rect.y"), 1);
    add("stage.width", value(reference.stage, "rect.width"), value(local.stage, "rect.width"), 1);
    add("stage.height", value(reference.stage, "rect.height"), value(local.stage, "rect.height"), 1);
    add("stage.radius", value(reference.stage, "radius"), value(local.stage, "radius"), 0.5);
    exact("stage.background", value(reference.stage, "background"), value(local.stage, "background"));
    exact("stage.padding", value(reference.stage, "padding"), value(local.stage, "padding"));
    add("stageLook.x", value(reference.stageLook, "rect.x"), value(local.stageLook, "rect.x"), 1);
    add("stageLook.y", value(reference.stageLook, "rect.y"), value(local.stageLook, "rect.y"), 1);
    add("stageLook.width", value(reference.stageLook, "rect.width"), value(local.stageLook, "rect.width"), 1);
    add("stageLook.height", value(reference.stageLook, "rect.height"), value(local.stageLook, "rect.height"), 1);
    add("composer.x", value(reference.composer, "rect.x"), value(local.composer, "rect.x"), 1);
    add("composer.y", value(reference.composer, "rect.y"), value(local.composer, "rect.y"), 1);
    add("composer.width", value(reference.composer, "rect.width"), value(local.composer, "rect.width"), 1);
    add("composer.height", value(reference.composer, "rect.height"), value(local.composer, "rect.height"), 1);
    add("tab.height", value(reference.tab, "rect.height"), value(local.tab, "rect.height"), 1);
    add("tab.fontSize", value(reference.tab, "font.size"), value(local.tab, "font.size"), 0.01);
    exact("tab.weight", value(reference.tab, "font.weight"), value(local.tab, "font.weight"));
    add("body.fontSize", value(reference.body, "font.size"), value(local.body, "font.size"), 0.01);
    exact("body.background", value(reference.body, "background"), value(local.body, "background"));

    // Documentation body: section order and spacing measured from the live
    // button, switch and chat-composer pages at all three viewports.
    exact("sections.count", reference.sectionTitles?.length ?? null, local.sectionTitles?.length ?? null);
    same("sections.titles", reference.sectionTitles, local.sectionTitles);
    same("sections.paddings", reference.sectionPaddings, local.sectionPaddings);
    add("contentSection.x", value(reference.contentSection, "rect.x"), value(local.contentSection, "rect.x"), 1);
    add("contentSection.y", value(reference.contentSection, "rect.y"), value(local.contentSection, "rect.y"), 1);
    add("contentSection.width", value(reference.contentSection, "rect.width"), value(local.contentSection, "rect.width"), 1);
    exact("contentSection.padding", value(reference.contentSection, "padding"), value(local.contentSection, "padding"));
    add("contentH2.y", value(reference.contentH2, "rect.y"), value(local.contentH2, "rect.y"), 1);
    add("contentH2.width", value(reference.contentH2, "rect.width"), value(local.contentH2, "rect.width"), 1);
    add("contentH2.height", value(reference.contentH2, "rect.height"), value(local.contentH2, "rect.height"), 1);
    add("contentH2.fontSize", value(reference.contentH2, "font.size"), value(local.contentH2, "font.size"), 0.01);
    add("contentH2.lineHeight", value(reference.contentH2, "font.lineHeight"), value(local.contentH2, "font.lineHeight"), 0.05);
    exact("contentH2.weight", value(reference.contentH2, "font.weight"), value(local.contentH2, "font.weight"));
    exact("contentH2.letterSpacing", value(reference.contentH2, "font.letterSpacing"), value(local.contentH2, "font.letterSpacing"));
    exact("contentH2.padding", value(reference.contentH2, "padding"), value(local.contentH2, "padding"));
    exact("contentH2.color", value(reference.contentH2, "color"), value(local.contentH2, "color"));
    add("contentList.y", value(reference.contentList, "rect.y"), value(local.contentList, "rect.y"), 1);
    add("contentList.height", value(reference.contentList, "rect.height"), value(local.contentList, "rect.height"), 1);
    add("contentList.fontSize", value(reference.contentList, "font.size"), value(local.contentList, "font.size"), 0.01);
    add("contentList.lineHeight", value(reference.contentList, "font.lineHeight"), value(local.contentList, "font.lineHeight"), 0.05);
    exact("contentList.padding", value(reference.contentList, "padding"), value(local.contentList, "padding"));
    exact("contentList.margin", value(reference.contentList, "margin"), value(local.contentList, "margin"));
    exact("contentList.gap", value(reference.contentList, "gap"), value(local.contentList, "gap"));
    exact("contentList.color", value(reference.contentList, "color"), value(local.contentList, "color"));
    exact("installSection.padding", value(reference.installSection, "padding"), value(local.installSection, "padding"));
    add("installSection.y", value(reference.installSection, "rect.y"), value(local.installSection, "rect.y"), 1);
    add("installSection.width", value(reference.installSection, "rect.width"), value(local.installSection, "rect.width"), 1);
    add("apiSection.x", value(reference.apiSection, "rect.x"), value(local.apiSection, "rect.x"), 1);
    add("apiSection.width", value(reference.apiSection, "rect.width"), value(local.apiSection, "rect.width"), 1);
    exact("apiSection.padding", value(reference.apiSection, "padding"), value(local.apiSection, "padding"));
    add("apiH3.height", value(reference.apiH3, "rect.height"), value(local.apiH3, "rect.height"), 1);
    add("apiH3.fontSize", value(reference.apiH3, "font.size"), value(local.apiH3, "font.size"), 0.01);
    add("apiH3.lineHeight", value(reference.apiH3, "font.lineHeight"), value(local.apiH3, "font.lineHeight"), 0.05);
    exact("apiH3.weight", value(reference.apiH3, "font.weight"), value(local.apiH3, "font.weight"));
    exact("apiH3.padding", value(reference.apiH3, "padding"), value(local.apiH3, "padding"));
    add("tableWrap.width", value(reference.tableWrap, "rect.width"), value(local.tableWrap, "rect.width"), 1);
    add("tableWrap.radius", value(reference.tableWrap, "radius"), value(local.tableWrap, "radius"), 0.5);
    add("tableTh.height", value(reference.tableTh, "rect.height"), value(local.tableTh, "rect.height"), 1);
    add("tableTh.fontSize", value(reference.tableTh, "font.size"), value(local.tableTh, "font.size"), 0.01);
    exact("tableTh.weight", value(reference.tableTh, "font.weight"), value(local.tableTh, "font.weight"));
    add("tableTh.lineHeight", value(reference.tableTh, "font.lineHeight"), value(local.tableTh, "font.lineHeight"), 0.05);
    exact("tableTh.padding", value(reference.tableTh, "padding"), value(local.tableTh, "padding"));
    exact("tableTh.background", value(reference.tableTh, "background"), value(local.tableTh, "background"));
    exact("tableTh.color", value(reference.tableTh, "color"), value(local.tableTh, "color"));
    exact("tableTd.padding", value(reference.tableTd, "padding"), value(local.tableTd, "padding"));
    add("tableTd.fontSize", value(reference.tableTd, "font.size"), value(local.tableTd, "font.size"), 0.01);
    add("tableTd.lineHeight", value(reference.tableTd, "font.lineHeight"), value(local.tableTd, "font.lineHeight"), 0.05);
    exact("tableColumns", reference.apiColumns, local.apiColumns);
    add("related.x", value(reference.related, "rect.x"), value(local.related, "rect.x"), 1);
    add("related.width", value(reference.related, "rect.width"), value(local.related, "rect.width"), 1);
    exact("related.padding", value(reference.related, "padding"), value(local.related, "padding"));
    exact("related.gap", value(reference.related, "gap"), value(local.related, "gap"));
    exact("related.columns", reference.relatedColumns, local.relatedColumns);
    add("relatedCard.width", value(reference.relatedCard, "rect.width"), value(local.relatedCard, "rect.width"), 1);
    add("relatedCard.height", value(reference.relatedCard, "rect.height"), value(local.relatedCard, "rect.height"), 1);
    exact("relatedCard.radius", value(reference.relatedCard, "radius"), value(local.relatedCard, "radius"));
    exact("footer.padding", value(reference.footer, "padding"), value(local.footer, "padding"));
    exact("footer.margin", value(reference.footer, "margin"), value(local.footer, "margin"));
    add("footer.fontSize", value(reference.footer, "font.size"), value(local.footer, "font.size"), 0.01);
    add("footer.borderWidth", value(reference.footer, "border.width"), value(local.footer, "border.width"), 0.1);
    exact("toc.count", reference.tocCount, local.tocCount);
    exact("activeNav.current", reference.activeNavCurrent, local.activeNavCurrent);
    exact("activeNav.text", reference.activeNavText, local.activeNavText);

    // The live Pro page hides its install/code blocks behind a lock. These
    // expected values are the measured rows from the unlocked reference pages
    // (button and switch) and keep the local implementation honest at all six
    // captures while the paired section/table checks cover the shared chrome.
    add("install.width", value(local.contentSection, "rect.width"), value(local.install, "rect.width"), 1);
    add("install.height", 86.58, value(local.install, "rect.height"), 1);
    add("installHead.height", 40, value(local.installHead, "rect.height"), 1);
    add("installCmd.height", 46.58, value(local.installCmd, "rect.height"), 1);
    exact("installCmd.padding", "14px 16px", value(local.installCmd, "padding"));
    add("installCmd.fontSize", 12.5, value(local.installCmd, "font.size"), 0.01);
    add("installTabs.height", 34, value(local.installTabs, "rect.height"), 1);
    add("pmTabs.width", 200, value(local.pmTabs, "rect.width"), 1);
    add("pmTabs.height", 30, value(local.pmTabs, "rect.height"), 1);
    add("code.width", value(local.contentSection, "rect.width"), value(local.code, "rect.width"), 1);
    add("codeHead.height", 40, value(local.codeHead, "rect.height"), 1);
    add("codeBody.fontSize", 12.5, value(local.codeBody, "font.size"), 0.01);
    add("codeBody.lineHeight", 21, value(local.codeBody, "font.lineHeight"), 0.05);
    exact("codeBody.padding", "14px 16px", value(local.codeBody, "padding"));
    add("code.radius", 12, value(local.code, "radius"), 0.5);
    return checks;
  }

  add("panel.x", value(reference.panel, "rect.x"), value(local.panel, "rect.x"), 1);
  add("panel.y", value(reference.panel, "rect.y"), value(local.panel, "rect.y"), 1);
  add("panel.width", value(reference.panel, "rect.width"), value(local.panel, "rect.width"), 1);
  add("panel.radius", value(reference.panel, "radius"), value(local.panel, "radius"), 0.5);
  add("panel.borderWidth", value(reference.panel, "border.width"), value(local.panel, "border.width"), 0.1);
  exact("panel.background", value(reference.panel, "background"), value(local.panel, "background"));
  if ((reference.panel?.border.width ?? 0) > 0) {
    exact("panel.borderColor", value(reference.panel, "border.color"), value(local.panel, "border.color"));
  }
  add("sidebar.width", value(reference.sidebar, "rect.width"), value(local.sidebar, "rect.width"), 1);
  add("content.x", value(reference.content, "rect.x"), value(local.content, "rect.x"), 1);
  add("content.width", value(reference.content, "rect.width"), value(local.content, "rect.width"), 1);
  add("topbar.height", value(reference.topbar, "rect.height"), value(local.topbar, "rect.height"), 1);
  add("grid.y", value(reference.grid, "rect.y"), value(local.grid, "rect.y"), 1);
  add("card.y", value(reference.card, "rect.y"), value(local.card, "rect.y"), 1);
  add("cardStage.y", value(reference.cardStage, "rect.y"), value(local.cardStage, "rect.y"), 1);
  add("cardTitle.y", value(reference.cardTitle, "rect.y"), value(local.cardTitle, "rect.y"), 1);
  exact("card.stageBackground", value(reference.cardStage, "background"), value(local.cardStage, "background"));
  add("title.fontSize", value(reference.title, "font.size"), value(local.title, "font.size"), 0.01);
  add("title.lineHeight", value(reference.title, "font.lineHeight"), value(local.title, "font.lineHeight"), 0.05);
  exact("title.letterSpacing", value(reference.title, "font.letterSpacing"), value(local.title, "font.letterSpacing"));
  exact("title.weight", value(reference.title, "font.weight"), value(local.title, "font.weight"));
  add("body.fontSize", value(reference.body, "font.size"), value(local.body, "font.size"), 0.01);
  add("body.lineHeight", value(reference.body, "font.lineHeight"), value(local.body, "font.lineHeight"), 0.05);
  exact("body.background", value(reference.body, "background"), value(local.body, "background"));
  exact("body.letterSpacing", value(reference.body, "font.letterSpacing"), value(local.body, "font.letterSpacing"));
  add("card.width", value(reference.card, "rect.width"), value(local.card, "rect.width"), 1);
  add("card.height", value(reference.card, "rect.height"), value(local.card, "rect.height"), 1);
  add("card.radius", value(reference.card, "radius"), value(local.card, "radius"), 0.5);
  exact("card.borderColor", value(reference.card, "border.color"), value(local.card, "border.color"));
  add("grid.gap", Number.parseFloat(reference.grid?.gap ?? "NaN"), Number.parseFloat(local.grid?.gap ?? "NaN"), 1);
  add("grid.columns", reference.grid?.columns ?? null, local.grid?.columns ?? null, 0, "count");
  exact("card.background", value(reference.card, "background"), value(local.card, "background"));
  return checks;
}

async function measureContentDiversity(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  const page = await context.newPage();
  try {
    await page.goto(`${LOCAL_URL}/components`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForSelector(".library-card__link", { timeout: 15_000 });
    const slugs = await page.evaluate(() =>
      [...document.querySelectorAll(".library-card__link")]
        .map((link) => new URL(link.href).pathname.replace(/^\/components\//, ""))
        .filter(Boolean),
    );
    const signatures = {};
    for (const slug of slugs) {
      await page.goto(`${LOCAL_URL}/components/${slug}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await page.waitForSelector(".doc__section:not(.doc__section--preview)", { timeout: 15_000 });
      const content = await page.evaluate(() => ({
        sections: [...document.querySelectorAll(".doc__section:not(.doc__section--preview)")].map(
          (section) => (section.innerText || "").replace(/\s+/g, " ").trim(),
        ),
        variants: [...document.querySelectorAll(".doc-variants span")].map((node) =>
          (node.textContent || "").trim(),
        ),
        code: [...document.querySelectorAll(".code__body")].map((node) =>
          (node.textContent || "").trim(),
        ),
        props: [...document.querySelectorAll(".table--api tbody tr td:first-child")].map((node) =>
          (node.textContent || "").trim(),
        ),
      }));
      signatures[slug] = createHash("sha256")
        .update(JSON.stringify(content))
        .digest("hex")
        .slice(0, 16);
    }
    const unique = new Set(Object.values(signatures)).size;
    return {
      components: slugs.length,
      unique,
      pass: slugs.length === 17 && unique === 17,
      signatures,
    };
  } finally {
    await context.close();
  }
}

function makeReport(metrics) {
  const lines = [
    "# Two-site comparison report",
    "",
    "Generated by `npm run compare` (`scripts/compare/capture.mjs`). The rig captures both sites at the same viewport, theme, scroll, font and frozen-animation conditions. It does not claim behavioural parity.",
    "",
    "## Conditions",
    "",
    `- Reference: ${metrics.conditions.reference}`,
    `- Local: ${metrics.conditions.local}`,
    `- Viewports: ${metrics.conditions.viewports.join(", ")}`,
    `- Themes: ${metrics.conditions.themes.join(", ")}`,
    "- Reference cookie banner: declined when visible.",
    "- Both contexts: `prefers-reduced-motion: reduce`, CSS animations/transitions frozen, caret hidden, scrollY 0.",
    "",
    "## Frame checks",
    "",
    "| Surface | Viewport | Theme | Checks | Failures |",
    "| --- | --- | --- | ---: | --- |",
  ];
  const failures = [];
  for (const [surfaceId, byViewport] of Object.entries(metrics.surfaces)) {
    for (const [viewportId, byTheme] of Object.entries(byViewport)) {
      for (const [theme, entry] of Object.entries(byTheme)) {
        const checks = entry.checks ?? [];
        const failed = checks.filter((check) => !check.pass);
        lines.push(`| ${surfaceId} | ${viewportId} | ${theme} | ${checks.length} | ${failed.length ? failed.map((check) => check.name).join(", ") : "—"} |`);
        for (const check of failed) {
          failures.push(`${surfaceId} · ${viewportId} · ${theme} · ${check.name}: reference ${JSON.stringify(check.reference)}, local ${JSON.stringify(check.local)}`);
        }
      }
    }
  }
  if (failures.length) {
    lines.push("", "### Failed checks", "");
    for (const failure of failures) lines.push(`- ${failure}`);
  }
  lines.push("", "## Surfaces", "");
  for (const surface of SURFACES) {
    lines.push(`### ${surface.id}`);
    lines.push("");
    lines.push(surface.note);
    lines.push("");
    const detail = metrics.surfaces[surface.id]?.["1440x900"]?.light;
    if (surface.id === "components" && detail?.reference && detail?.local) {
      lines.push(`At 1440 light the panel is ${detail.local.panel.rect.width}px wide at x${detail.local.panel.rect.x}; the index title is ${detail.local.title.font.size}/${detail.local.title.font.lineHeight} at ${detail.local.title.font.letterSpacing}; the first card is ${detail.local.card.rect.width}×${detail.local.card.rect.height} with a ${detail.local.grid.gap} gap.`);
      lines.push("");
    }
    if (surface.id === "detail-chat-composer" && detail?.reference && detail?.local) {
      lines.push(`At 1440 light the article is ${detail.local.content.rect.width}px wide at x${detail.local.content.rect.x}; the detail top bar is ${detail.local.topbar.rect.height}px; the title is ${detail.local.title.font.size}/${detail.local.title.font.lineHeight} at weight ${detail.local.title.font.weight}; the preview bar is ${detail.local.bar.rect.height}px and the stage is ${detail.local.stage.rect.width}×${detail.local.stage.rect.height} with a ${detail.local.stage.padding} inset.`,
      );
      lines.push("");
      lines.push("Measured detail values from this run:");
      lines.push("");
      lines.push("| Viewport | Article | Top bar | Title | Lead | Preview bar | Stage | Composer |");
      lines.push("| --- | --- | ---: | --- | --- | ---: | --- | --- |");
      for (const [viewportId, byTheme] of Object.entries(metrics.surfaces[surface.id])) {
        const measured = byTheme.light?.local;
        if (!measured) continue;
        lines.push(
          `| ${viewportId} | ${measured.content.rect.width}px @ x${measured.content.rect.x} | ${measured.topbar.rect.height}px | ${measured.title.font.size}/${measured.title.font.lineHeight} · ${measured.title.font.weight} | ${measured.lead.rect.width}×${measured.lead.rect.height} | ${measured.bar.rect.height}px | ${measured.stage.rect.width}×${measured.stage.rect.height} · ${measured.stage.padding} | ${measured.composer.rect.width}×${measured.composer.rect.height} |`,
        );
      }
      lines.push("");
      lines.push("Measured documentation body from this run:");
      lines.push("");
      lines.push("| Viewport | Sections | First H2 | Install | Code | API table | Related | Footer | In-page nav |");
      lines.push("| --- | ---: | --- | --- | --- | --- | --- | --- | --- |");
      for (const [viewportId, byTheme] of Object.entries(metrics.surfaces[surface.id])) {
        const measured = byTheme.light?.local;
        if (!measured) continue;
        lines.push(
          `| ${viewportId} | ${measured.sectionTitles.length} | ${measured.contentH2.font.size}/${measured.contentH2.font.lineHeight} · ${measured.contentH2.font.weight} · ${measured.contentH2.font.letterSpacing} | ${measured.install.rect.width}×${measured.install.rect.height} | ${measured.code.rect.width}×${measured.codeHead.rect.height} head · ${measured.codeBody.font.size}/${measured.codeBody.font.lineHeight} | ${measured.tableWrap.rect.width} · ${measured.apiColumns} cols | ${measured.relatedColumns} cols · ${measured.relatedCard.rect.width}×${measured.relatedCard.rect.height} | ${measured.footer.padding} · ${measured.footer.font.size} | ${measured.tocCount} TOC · ${measured.activeNavText} |`,
        );
      }
      lines.push("");
      lines.push(`Section order: ${metrics.surfaces[surface.id]["1440x900"].light.local.sectionTitles.join(" → ")}.`);
      lines.push("");
    }
  }
  if (metrics.contentDiversity) {
    lines.push("## Per-component content", "");
    lines.push(
      `Unique body signatures: ${metrics.contentDiversity.unique}/${metrics.contentDiversity.components}. The probe hashes below-the-stage section text, variant chips, code samples and API prop names for every component, so a shared template body cannot pass.`,
    );
    lines.push("");
  }
  lines.push("## Reproduce", "");
  lines.push("```bash");
  lines.push("npm install");
  lines.push("npx playwright install chromium");
  lines.push("npm run compare");
  lines.push("```");
  lines.push("");
  lines.push("`metrics.json` is deterministic for unchanged inputs. It intentionally contains no timestamps.");
  return lines.join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const server = await ensureLocalServer();
  const browser = await chromium.launch({ headless: true });
  const metrics = {
    conditions: {
      reference: REFERENCE_URL,
      local: LOCAL_URL,
      viewports: VIEWPORTS.map((viewport) => viewport.id),
      themes: THEMES,
      reducedMotion: "reduce",
      animations: "frozen",
      caret: "hidden",
      scrollY: 0,
    },
    surfaces: {},
  };

  try {
    for (const surface of SURFACES) {
      metrics.surfaces[surface.id] = {};
      for (const viewport of VIEWPORTS) {
        metrics.surfaces[surface.id][viewport.id] = {};
        for (const theme of THEMES) {
          console.log(`[compare] ${surface.id} · ${viewport.id} · ${theme}`);
          const reference = await captureSiteStable(browser, "reference", surface, viewport, theme);
          const entry = { reference: reference.metrics, checks: [] };
          let local = null;
          if (!surface.referenceOnly) {
            local = await captureSiteStable(browser, "local", surface, viewport, theme);
            entry.local = local.metrics;
            entry.errors = { reference: reference.errors, local: local.errors };
            if (reference.errors.length || local.errors.length) {
              console.log(`[compare] console errors: reference=${reference.errors.length} local=${local.errors.length}`);
            }
            entry.checks = surface.checks ? checksFor(surface, reference.metrics, local.metrics) : [];

            const dir = path.join(OUT_DIR, surface.id, viewport.id, theme);
            const pairPage = await browser.newPage();
            try {
              await composePair(pairPage, surface, viewport, theme, reference.file, local.file, path.join(dir, "pair.png"));
              await composeOverlay(pairPage, viewport, reference.file, local.file, path.join(dir, "overlay.png"));
            } finally {
              await pairPage.close();
            }
          } else {
            entry.local = {
              available: false,
              reason: "reference-only capture",
            };
            entry.checks = [];
          }
          metrics.surfaces[surface.id][viewport.id][theme] = entry;
        }
      }
    }

    // Every detail page must render distinct per-component documentation. The
    // signature intentionally omits the title and description so a shared body
    // cannot pass just because the heading above it changed.
    metrics.contentDiversity = await measureContentDiversity(browser);
    const detailSurface = metrics.surfaces["detail-chat-composer"] ?? {};
    for (const byTheme of Object.values(detailSurface)) {
      for (const entry of Object.values(byTheme)) {
        entry.checks.push({
          name: "content.uniqueBodies",
          reference: 17,
          local: metrics.contentDiversity.unique,
          unit: "unique",
          delta: 17 - metrics.contentDiversity.unique,
          pass: metrics.contentDiversity.pass,
        });
      }
    }
    console.log(
      `[compare] content diversity: ${metrics.contentDiversity.unique}/${metrics.contentDiversity.components} unique component bodies`,
    );
  } finally {
    await browser.close();
    stopServer(server);
  }

  await writeFile(path.join(OUT_DIR, "metrics.json"), `${JSON.stringify(metrics, null, 2)}\n`);
  await writeFile(path.join(OUT_DIR, "report.md"), makeReport(metrics));

  let checks = 0;
  let failed = 0;
  for (const surface of Object.values(metrics.surfaces)) {
    for (const viewport of Object.values(surface)) {
      for (const entry of Object.values(viewport)) {
        for (const check of entry.checks ?? []) {
          checks += 1;
          if (!check.pass) failed += 1;
        }
      }
    }
  }
  console.log(`[compare] ${checks - failed}/${checks} frame checks passed`);
  console.log(`[compare] artifacts: ${path.relative(ROOT, OUT_DIR)}`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error("[compare] failed:", error);
  process.exitCode = 1;
});
