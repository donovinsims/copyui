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
    local: null,
    referenceOnly: true,
    note: "The reference has a component-detail template; copyui does not yet. Reference-only captures document the next unit of work.",
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

const DETAIL_NEXT_STEP =
  "No local component-detail route/template. The components index currently substitutes full specimens below the gallery. The reference detail uses a 32px/44px/600 title, a breadcrumb, a Preview/Code switch, a control bar and a large preview stage inside the same 1176px panel.";

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
    return {
      panel: "main.panel",
      title: "h1.doc__title",
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

function checksFor(reference, local) {
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
    if (surface.referenceOnly) {
      const entry = metrics.surfaces[surface.id]?.["1440x900"]?.light;
      lines.push(`Local capture is unavailable: ${DETAIL_NEXT_STEP}`);
      if (entry?.reference?.title) {
        lines.push(`Reference detail title at 1440 light: ${entry.reference.title.font.size}/${entry.reference.title.font.lineHeight} weight ${entry.reference.title.font.weight}; panel ${entry.reference.panel?.rect.width}px.`);
      }
      lines.push("");
    }
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
          const reference = await captureSite(browser, "reference", surface, viewport, theme);
          const entry = { reference: reference.metrics, checks: [] };
          let local = null;
          if (!surface.referenceOnly) {
            local = await captureSite(browser, "local", surface, viewport, theme);
            entry.local = local.metrics;
            entry.errors = { reference: reference.errors, local: local.errors };
            if (reference.errors.length || local.errors.length) {
              console.log(`[compare] console errors: reference=${reference.errors.length} local=${local.errors.length}`);
            }
            entry.checks = surface.checks ? checksFor(reference.metrics, local.metrics) : [];

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
              reason: DETAIL_NEXT_STEP,
            };
            entry.checks = [];
          }
          metrics.surfaces[surface.id][viewport.id][theme] = entry;
        }
      }
    }
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
