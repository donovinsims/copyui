#!/usr/bin/env node
/**
 * Deterministic, offline fixture run. It is the gate CI uses: no live site,
 * no network, fixed pages, and a mutated page to prove failures are detected.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeConfig } from "../config.mjs";
import { runCompare } from "../core/capture.mjs";
import { createLogger } from "../log.mjs";
import { startFixtureServer } from "./helpers/server.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FIXTURE = path.join(ROOT, "tool", "fixtures", "site");
const logger = createLogger();

const slots = {
  reference: { title: ".title", card: "article.card", body: "body" },
  local: { title: ".title", card: "article.card", body: "body" },
};
const derived = { reference: { cards: "article.card" }, local: { cards: "article.card" } };
const assertions = [
  { name: "title.fontSize", a: "ref:title.font.size", b: "loc:title.font.size", tolerance: 0.01 },
  { name: "title.width", a: "ref:title.rect.width", b: "loc:title.rect.width", tolerance: 1 },
  { name: "cards.count", a: "ref:cards.count", b: "loc:cards.count", tolerance: 0, unit: "count" },
  { name: "body.background", a: "ref:body.background", b: "loc:body.background", mode: "exact" },
];

function configFor(url, localPath, output) {
  return normalizeConfig({
    target: url,
    local: url,
    output,
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
        slots,
        derived,
        require: { reference: ["title", "card"], local: ["title", "card"] },
        assertions,
      },
    ],
  });
}

const server = await startFixtureServer(FIXTURE);
let exitCode = 0;
try {
  const identical = await runCompare(configFor(server.url, "/", "out/fixtures/identical"), { root: ROOT, logger });
  logger.info("identical fixture", {
    checks: identical.metrics.summary.checks,
    failed: identical.metrics.summary.failed,
    exitCode: identical.exitCode,
  });
  if (identical.exitCode !== 0) exitCode = 1;

  // The same inputs must produce the same bytes: that is what makes a score
  // comparable across runs. Only metrics.json is gated; manifest.json carries
  // timestamps on purpose.
  const repeat = await runCompare(configFor(server.url, "/", "out/fixtures/identical-repeat"), { root: ROOT, logger });
  const firstMetrics = await readFile(path.join(ROOT, "out/fixtures/identical/metrics.json"), "utf8");
  const repeatMetrics = await readFile(path.join(ROOT, "out/fixtures/identical-repeat/metrics.json"), "utf8");
  if (firstMetrics !== repeatMetrics) {
    logger.error("metrics.json is not deterministic between identical runs");
    exitCode = 1;
  } else {
    logger.info("metrics.json is byte-identical across runs");
  }
  if (repeat.exitCode !== 0) exitCode = 1;

  const mutated = await runCompare(configFor(server.url, "/mutated.html", "out/fixtures/mutated"), { root: ROOT, logger });
  logger.info("mutated fixture", {
    checks: mutated.metrics.summary.checks,
    failed: mutated.metrics.summary.failed,
    exitCode: mutated.exitCode,
  });
  if (mutated.metrics.summary.failed === 0) {
    logger.error("mutated fixture passed unexpectedly; assertions are not proving anything");
    exitCode = 1;
  }
} finally {
  await server.close();
}

process.exitCode = exitCode;
