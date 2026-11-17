import test from "node:test";
import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeConfig } from "../config.mjs";
import { launchBrowser } from "../core/browser.mjs";
import { runCompare } from "../core/capture.mjs";
import { discoverRoutes } from "../core/discover.mjs";
import { extractPageModel } from "../core/page-model.mjs";
import { nullLogger } from "../log.mjs";
import { startFixtureServer } from "./helpers/server.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FIXTURE = path.join(ROOT, "tool", "fixtures", "site");
const OUT = "out/test-fixture";

async function browserAvailable() {
  try {
    const browser = await launchBrowser();
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

const AVAILABLE = await browserAvailable();

const SLOTS = {
  reference: { title: ".title", card: "article.card", body: "body" },
  local: { title: ".title", card: "article.card", body: "body" },
};
const DERIVED = {
  reference: { cards: "article.card" },
  local: { cards: "article.card" },
};
const ASSERTIONS = [
  { name: "title.fontSize", a: "ref:title.font.size", b: "loc:title.font.size", tolerance: 0.01 },
  { name: "title.width", a: "ref:title.rect.width", b: "loc:title.rect.width", tolerance: 1 },
  { name: "cards.count", a: "ref:cards.count", b: "loc:cards.count", tolerance: 0, unit: "count" },
  { name: "body.background", a: "ref:body.background", b: "loc:body.background", mode: "exact" },
];

function fixtureConfig(url, localPath) {
  return normalizeConfig({
    target: url,
    local: url,
    output: OUT,
    viewports: [{ id: "900x700", width: 900, height: 700 }],
    themes: ["light"],
    routes: { crawl: false, sitemap: false, maxPages: 1 },
    capture: { retries: 0, settleMs: 120 },
    gates: { assertions: 1, coverage: 0.8, minConfidence: 0.4 },
    surfaces: [
      {
        id: "home",
        refPath: "/",
        localPath,
        checks: true,
        slots: SLOTS,
        derived: DERIVED,
        require: { reference: ["title", "card"], local: ["title", "card"] },
        assertions: ASSERTIONS,
      },
    ],
  });
}

test("robots-aware discovery finds linked routes and skips disallowed ones", { skip: !AVAILABLE }, async () => {
  const server = await startFixtureServer(FIXTURE);
  const browser = await launchBrowser();
  try {
    const config = normalizeConfig({
      target: server.url,
      routes: { maxPages: 10, depth: 2, crawl: true, sitemap: false },
    });
    const discovery = await discoverRoutes({ url: `${server.url}/`, config, browser, logger: nullLogger });
    const paths = discovery.routes.map((route) => route.path);
    assert.equal(discovery.status, "ok");
    assert.ok(paths.includes("/"));
    assert.ok(paths.includes("/about.html"));
    assert.ok(paths.includes("/docs.html"));
    assert.equal(paths.includes("/private.html"), false);
  } finally {
    await browser.close();
    await server.close();
  }
});

test("the page model captures slots, cards, shadow DOM and iframes", { skip: !AVAILABLE }, async () => {
  const server = await startFixtureServer(FIXTURE);
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({ viewport: { width: 900, height: 700 } });
    const page = await context.newPage();
    await page.goto(`${server.url}/`, { waitUntil: "load" });
    await page.waitForTimeout(250);
    const model = await extractPageModel(page, { slots: SLOTS.reference, derived: DERIVED.reference });
    assert.equal(model.derived.cards.count, 3);
    assert.equal(model.slots.title.font.size, 32);
    assert.ok(model.page.counts.shadowHosts >= 1);
    assert.ok(model.nodes.some((node) => node.shadow));
    assert.ok(model.nodes.some((node) => node.tag === "iframe"));
    assert.ok(model.nodes.some((node) => String(node.frame ?? "").includes("iframe")));
    assert.ok(model.page.counts.nodes > 0);
    await context.close();
  } finally {
    await browser.close();
    await server.close();
  }
});

test("an identical fixture passes every assertion and writes artifacts", { skip: !AVAILABLE }, async () => {
  const server = await startFixtureServer(FIXTURE);
  try {
    await rm(path.join(ROOT, OUT), { recursive: true, force: true });
    const result = await runCompare(fixtureConfig(server.url, "/"), { root: ROOT, logger: nullLogger });
    const entry = result.metrics.surfaces.home["900x700"].light;
    assert.equal(result.exitCode, 0);
    assert.equal(entry.checks.length, 4);
    assert.equal(entry.checks.every((check) => check.pass), true);
    assert.ok(entry.matching.stats.coverage >= 0.8);
    assert.equal(entry.gates.pass, true);

    const metrics = JSON.parse(await readFile(path.join(ROOT, OUT, "metrics.json"), "utf8"));
    assert.equal(metrics.summary.failed, 0);
    assert.equal(JSON.stringify(metrics).includes(ROOT), false);

    const snapshot = JSON.parse(
      await readFile(path.join(ROOT, OUT, "capture", "home", "900x700", "light", "snapshot.json"), "utf8"),
    );
    assert.equal(snapshot.derived.cards.count, 3);
  } finally {
    await server.close();
  }
});

test("a mutated fixture fails the changed assertions", { skip: !AVAILABLE }, async () => {
  const server = await startFixtureServer(FIXTURE);
  try {
    const result = await runCompare(fixtureConfig(server.url, "/mutated.html"), { root: ROOT, logger: nullLogger });
    const entry = result.metrics.surfaces.home["900x700"].light;
    const failed = entry.checks.filter((check) => !check.pass).map((check) => check.name);
    assert.equal(result.exitCode, 1);
    assert.ok(failed.includes("title.fontSize"));
    assert.ok(failed.includes("cards.count"));
    assert.ok(failed.includes("body.background"));
    assert.equal(entry.gates.pass, false);
  } finally {
    await server.close();
  }
});
