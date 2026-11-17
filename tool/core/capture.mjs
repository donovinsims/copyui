import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  applyTheme,
  classifyError,
  createCaptureContext,
  detectChallenge,
  dismissConsent,
  freezePage,
  gotoPage,
  isRetryable,
  launchBrowser,
  preparePage,
  runNavigation,
  settlePage,
  waitForSlots,
} from "./browser.mjs";
import { coverageFor, evaluateAssertions, gateResult, summarizeChecks } from "./assertions.mjs";
import { discoverRoutes } from "./discover.mjs";
import { matchPages, matchingSummary } from "./match.mjs";
import { extractPageModel } from "./page-model.mjs";
import { ensureDevServer, stopServer } from "./server.mjs";
import { ConfigError, TOOL_VERSION, configHash, outputDirFor, redactConfig } from "../config.mjs";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function normalizeSurface(surface = {}, index = 0) {
  const id = surface.id ?? `surface-${index + 1}`;
  const hasSlots = surface.slots && typeof surface.slots === "object" && !Array.isArray(surface.slots);
  const slots = hasSlots && ("reference" in surface.slots || "local" in surface.slots)
    ? { reference: surface.slots.reference ?? {}, local: surface.slots.local ?? surface.slots.reference ?? {} }
    : { reference: surface.slots ?? {}, local: surface.slots ?? {} };
  const hasDerived = surface.derived && typeof surface.derived === "object" && !Array.isArray(surface.derived);
  const derived = hasDerived && ("reference" in surface.derived || "local" in surface.derived)
    ? { reference: surface.derived.reference ?? {}, local: surface.derived.local ?? surface.derived.reference ?? {} }
    : { reference: surface.derived ?? {}, local: surface.derived ?? {} };
  return {
    id,
    refPath: surface.refPath ?? surface.referencePath ?? "/",
    localPath: surface.localPath ?? surface.refPath ?? surface.referencePath ?? "/",
    fullPage: surface.fullPage ?? false,
    checks: surface.checks !== false,
    slots,
    derived,
    navigation: surface.navigation ?? [],
    assertions: surface.assertions ?? [],
    require: surface.require ?? {},
    uniqueBodies: surface.uniqueBodies ?? null,
    note: surface.note ?? null,
  };
}

function slotsFor(config, surface, side) {
  const surfaceSlots = surface.slots?.[side] ?? {};
  if (Object.keys(surfaceSlots).length) return surfaceSlots;
  return config.slots?.[side] ?? {};
}

function derivedFor(config, surface, side) {
  const surfaceDerived = surface.derived?.[side] ?? {};
  if (Object.keys(surfaceDerived).length) return surfaceDerived;
  return config.derived?.[side] ?? {};
}

function requiredFor(surface, side, slots) {
  return surface.require?.[side] ?? Object.keys(slots);
}

export async function pngSize(file) {
  const buffer = await readFile(file);
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`Screenshot is not a PNG: ${file}`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function metricView(result) {
  return {
    status: result.status,
    httpStatus: result.httpStatus ?? null,
    missing: result.missing ?? [],
    reason: result.reason ?? null,
    errors: result.errors ?? [],
    capture: result.capture ?? null,
    slots: result.model?.slots ?? {},
    derived: result.model?.derived ?? {},
    page: result.model?.page ?? null,
  };
}

async function captureAttempt({ browser, config, surface, side, viewport, theme, outDir, logger }) {
  const base = side === "reference" ? config.target : config.local;
  const routePath = side === "reference" ? surface.refPath : surface.localPath;
  if (!base) return { status: "no-target", reason: `no ${side} URL configured`, errors: [] };
  let url;
  try {
    url = new URL(routePath, base).href;
  } catch {
    return { status: "invalid-route", reason: `Invalid ${side} path: ${routePath}`, errors: [] };
  }

  const slots = slotsFor(config, surface, side);
  const derived = derivedFor(config, surface, side);
  const context = await createCaptureContext(browser, config, { viewport, theme, side });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text().slice(0, 300));
  });
  page.on("pageerror", (error) => errors.push(String(error.message).slice(0, 300)));

  try {
    await preparePage(page, config, { theme, side });
    const response = await gotoPage(page, url, config);
    const httpStatus = response?.status() ?? 0;
    if (httpStatus >= 400) {
      const status =
        httpStatus === 401 ? "unauthorized" : httpStatus === 403 ? "forbidden" : httpStatus === 429 ? "rate-limited" : "http-error";
      logger?.warn("capture refused by target", { side, url, httpStatus });
      return { status, httpStatus, url, errors };
    }

    await dismissConsent(page, config);
    await runNavigation(page, config, { side, surface, viewport });
    await applyTheme(page, config, theme);

    // Wait only for slots this side actually requires. A slot that is measured
    // when present but legitimately absent (a Pro-locked panel, a page with no
    // in-page TOC) must not turn into a false "missing" and consume retries.
    const requiredSlots = requiredFor(surface, side, slots);
    const waited = Object.fromEntries(
      requiredSlots.filter((name) => slots[name]).map((name) => [name, slots[name]]),
    );
    const missing = await waitForSlots(page, waited, {
      timeoutMs: Math.min(15000, config.capture.timeoutMs),
    });
    if (missing.length) {
      logger?.warn("required slots missing", { side, url, missing });
      return { status: "missing", missing, httpStatus, url, errors };
    }

    const challenge = await detectChallenge(page);
    if (challenge) return { status: "blocked", reason: challenge, httpStatus, url, errors };

    await freezePage(page);
    await settlePage(page, config);

    const model = await extractPageModel(page, {
      slots,
      derived,
      maxNodes: config.capture.maxNodes,
    });
    const presentMissing = requiredSlots.filter((name) => !model.slots?.[name]);
    if (presentMissing.length) {
      return { status: "missing", missing: presentMissing, httpStatus, url, errors };
    }
    if (model.page.counts.truncated) {
      logger?.warn("node cap reached", { side, url, nodes: model.page.counts.nodes, total: model.page.counts.elements });
    }

    let capture = null;
    if (config.capture.screenshot !== false) {
      const dir = path.join(outDir, "capture", surface.id, viewport.id, theme);
      await mkdir(dir, { recursive: true });
      const file = path.join(dir, `${side}.png`);
      const fullPage = surface.fullPage ?? config.capture.fullPage;
      await page.screenshot({ path: file, fullPage, animations: "disabled", caret: "hide" });
      const image = await pngSize(file);
      capture = {
        fullPage,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        width: image.width,
        height: image.height,
        documentHeight: model.page.documentHeight,
        coversDocument: fullPage && image.height >= model.page.documentHeight - 1,
      };
      if (side === "local" || !config.local) {
        await writeFile(
          path.join(dir, "snapshot.json"),
          `${JSON.stringify({ page: model.page, slots: model.slots, derived: model.derived }, null, 2)}\n`,
        );
      }
    }

    return { status: "ok", httpStatus, url, errors, model, capture };
  } catch (error) {
    logger?.warn("capture attempt failed", { side, url, error: String(error?.message ?? error) });
    return { ...classifyError(error), httpStatus: 0, url, errors };
  } finally {
    await context.close().catch(() => {});
  }
}

export async function captureSide({ browser, config, surface, side, viewport, theme, outDir, logger }) {
  const attempts = Math.max(1, (config.capture.retries ?? 0) + 1);
  let last = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    last = await captureAttempt({ browser, config, surface, side, viewport, theme, outDir, logger });
    if (last.status === "ok" || !isRetryable(last.status)) return last;
    if (attempt < attempts) {
      logger?.info("retrying capture", { side, surface: surface.id, attempt, status: last.status });
      await sleep(400 * attempt);
    }
  }
  return last;
}

async function measureUniqueBodies({ browser, config, surface, viewport, logger }) {
  const spec = surface.uniqueBodies;
  if (!spec || !config.local) return null;
  const context = await createCaptureContext(browser, config, { viewport, theme: "light", side: "local" });
  const page = await context.newPage();
  try {
    await preparePage(page, config, { theme: "light", side: "local" });
    // The links live on the index, not on the detail route being compared.
    await gotoPage(page, new URL(spec.listPath ?? surface.localPath, config.local).href, config);
    await page.waitForSelector(spec.linkSelector, { timeout: 15000 });
    const hrefs = await page.evaluate(
      ({ selector, prefix }) =>
        [...document.querySelectorAll(selector)]
          .map((anchor) => {
            try {
              return new URL(anchor.href).pathname;
            } catch {
              return null;
            }
          })
          .filter((href) => Boolean(href) && href.startsWith(prefix)),
      { selector: spec.linkSelector, prefix: spec.pathPrefix ?? "/" },
    );
    const uniqueHrefs = [...new Set(hrefs)].slice(0, spec.maxRoutes ?? 60);
    const signatures = {};
    for (const href of uniqueHrefs) {
      await page.goto(new URL(href, config.local).href, {
        waitUntil: "domcontentloaded",
        timeout: Math.min(config.capture.timeoutMs, 30000),
      });
      await page.waitForTimeout(350);
      const content = await page.evaluate(
        (selectors) =>
          selectors.map((selector) => [
            ...document.querySelectorAll(selector),
          ].map((node) => (node.innerText || node.textContent || "").replace(/\s+/g, " ").trim())),
        spec.hashSelectors ?? [],
      );
      signatures[href] = createHash("sha256").update(JSON.stringify(content)).digest("hex").slice(0, 16);
    }
    const unique = new Set(Object.values(signatures)).size;
    const expect = spec.expect ?? uniqueHrefs.length;
    return {
      expected: expect,
      routes: uniqueHrefs.length,
      unique,
      pass: uniqueHrefs.length === expect && unique === expect,
      signatures,
    };
  } catch (error) {
    logger?.warn("unique-body probe failed", { error: String(error?.message ?? error) });
    return { expected: spec.expect ?? null, routes: 0, unique: 0, pass: false, error: String(error?.message ?? error) };
  } finally {
    await context.close().catch(() => {});
  }
}

function uniqueBodyCheck(surface, result) {
  const expect = surface.uniqueBodies?.expect ?? null;
  return {
    name: "content.uniqueBodies",
    reference: expect,
    local: result?.unique ?? 0,
    unit: "unique",
    delta: expect === null ? null : expect - (result?.unique ?? 0),
    pass: Boolean(result?.pass),
  };
}

function recomputeGates(entry, config) {
  entry.checks = entry.checks ?? [];
  entry.coverage = entry.coverage ?? coverageFor({
    reference: entry.reference,
    local: entry.local,
    required: [],
    checks: entry.checks,
  });
  entry.gates = gateResult({ checks: entry.checks, coverage: entry.coverage, gates: config.gates });
}

function addUniqueBodies(metrics, surface, result) {
  metrics.uniqueBodies = metrics.uniqueBodies ?? {};
  metrics.uniqueBodies[surface.id] = result;
  for (const byViewport of Object.values(metrics.surfaces[surface.id] ?? {})) {
    for (const entry of Object.values(byViewport)) {
      entry.checks.push(uniqueBodyCheck(surface, result));
    }
  }
}

function makeReport(metrics) {
  const lines = [
    "# copyui comparison report",
    "",
    "Generated by `copyui compare`. Both sides were captured under the same viewport, theme, font wait, reduced-motion, frozen-animation and scroll conditions.",
    "",
    "## Conditions",
    "",
    `- Reference: ${metrics.conditions.reference}`,
    `- Local: ${metrics.conditions.local}`,
    `- Viewports: ${metrics.conditions.viewports.join(", ")}`,
    `- Themes: ${metrics.conditions.themes.join(", ")}`,
    `- Config hash: ${metrics.conditions.configHash}`,
    "",
    "## Results",
    "",
    "| Surface | Viewport | Theme | Checks | Failed | Coverage | Status |",
    "| --- | --- | --- | ---: | ---: | ---: | --- |",
  ];
  const failures = [];
  for (const [surfaceId, byViewport] of Object.entries(metrics.surfaces)) {
    for (const [viewportId, byTheme] of Object.entries(byViewport)) {
      for (const [theme, entry] of Object.entries(byTheme)) {
        const failed = (entry.checks ?? []).filter((check) => !check.pass);
        const coverage = entry.coverage?.ratio ?? null;
        const status = entry.gates ? (entry.gates.pass ? "pass" : "fail") : entry.reference.status;
        lines.push(
          `| ${surfaceId} | ${viewportId} | ${theme} | ${entry.checks.length} | ${failed.length || "—"} | ${coverage === null ? "—" : coverage} | ${status} |`,
        );
        for (const check of failed) {
          failures.push(
            `${surfaceId} · ${viewportId} · ${theme} · ${check.name}: reference ${JSON.stringify(check.reference)}, local ${JSON.stringify(check.local)}`,
          );
        }
      }
    }
  }
  if (failures.length) {
    lines.push("", "### Failed checks", "");
    for (const failure of failures) lines.push(`- ${failure}`);
  }
  lines.push("", "## Matching", "");
  for (const [surfaceId, byViewport] of Object.entries(metrics.surfaces)) {
    const entry = Object.values(Object.values(byViewport)[0] ?? {})[0];
    if (!entry?.matching?.stats) continue;
    const stats = entry.matching.stats;
    lines.push(
      `- **${surfaceId}**: ${stats.matched}/${stats.referenceNodes} reference nodes matched (${Math.round(stats.coverage * 100)}%), mean confidence ${stats.meanConfidence}, ${stats.lowConfidence} low-confidence pairs.`,
    );
  }
  if (metrics.summary?.failures?.length) {
    lines.push("", "## Coverage gaps", "");
    for (const gap of metrics.summary.failures) lines.push(`- ${gap}`);
  }
  lines.push("", "`metrics.json` is deterministic for unchanged inputs; it contains no timestamps or absolute paths.", "");
  return lines.join("\n");
}

async function discoverSurfaces(config, browser, logger) {
  const discovery = await discoverRoutes({ url: config.target, config, browser, logger });
  if (discovery.status === "blocked") {
    const error = new Error(discovery.reason ?? "Target blocked route discovery");
    error.exitCode = 3;
    throw error;
  }
  if (!discovery.routes.length) {
    const error = new Error(discovery.reason ?? "No routes discovered");
    error.exitCode = 3;
    throw error;
  }
  return discovery.routes.map((route, index) =>
    normalizeSurface({ id: route.id, refPath: route.path, localPath: route.path, checks: false }, index),
  );
}

function collectSummary(metrics) {
  let captures = 0;
  let checks = 0;
  let failed = 0;
  let coverageFailures = 0;
  const failures = [];
  for (const [surfaceId, byViewport] of Object.entries(metrics.surfaces)) {
    for (const [viewportId, byTheme] of Object.entries(byViewport)) {
      for (const [theme, entry] of Object.entries(byTheme)) {
        captures += 1;
        const entryFailed = (entry.checks ?? []).filter((check) => !check.pass);
        checks += (entry.checks ?? []).length;
        failed += entryFailed.length;
        if (entry.coverage && entry.gates && !entry.gates.coverage.pass) {
          coverageFailures += 1;
          failures.push(`${surfaceId} · ${viewportId} · ${theme}: coverage ${entry.coverage.ratio} below ${entry.gates.coverage.threshold}`);
        }
        for (const check of entryFailed.slice(0, 5)) {
          failures.push(`${surfaceId} · ${viewportId} · ${theme} · ${check.name}`);
        }
      }
    }
  }
  return { captures, checks, failed, coverageFailures, failures: failures.slice(0, 60) };
}

export async function runCompare(config, { logger, root = process.cwd() } = {}) {
  if (!config.target) throw new ConfigError("No target URL configured.");
  if (!config.local) throw new ConfigError("compare needs a local URL (pass one or set `local`).");
  const outDir = outputDirFor(config, root);
  await mkdir(outDir, { recursive: true });
  const startedAt = new Date().toISOString();
  const server = await ensureDevServer(config, { logger, root });
  const browser = await launchBrowser({
    executablePath: process.env.COPYUI_CHROMIUM_EXECUTABLE ?? process.env.COMPARE_CHROMIUM_EXECUTABLE,
  });

  try {
    const surfaces = config.surfaces?.length
      ? config.surfaces.map((surface, index) => normalizeSurface(surface, index))
      : await discoverSurfaces(config, browser, logger);

    const metrics = {
      conditions: {
        reference: config.target,
        local: config.local,
        viewports: config.viewports.map((viewport) => viewport.id),
        themes: config.themes,
        reducedMotion: config.capture.reducedMotion,
        animations: "frozen",
        caret: "hidden",
        scrollY: 0,
        configHash: configHash(config),
      },
      surfaces: {},
      gates: config.gates,
    };

    for (const surface of surfaces) {
      metrics.surfaces[surface.id] = {};
      for (const viewport of config.viewports) {
        metrics.surfaces[surface.id][viewport.id] = {};
        for (const theme of config.themes) {
          logger?.info(`${surface.id} · ${viewport.id} · ${theme}`);
          const reference = await captureSide({
            browser, config, surface, side: "reference", viewport, theme, outDir, logger,
          });
          const local = await captureSide({
            browser, config, surface, side: "local", viewport, theme, outDir, logger,
          });
          const entry = {
            reference: metricView(reference),
            local: metricView(local),
            checks: [],
            coverage: null,
            matching: null,
            gates: null,
          };

          if (surface.checks) {
            const required = requiredFor(surface, "reference", slotsFor(config, surface, "reference"));
            if (reference.model && local.model) {
              const matching = matchPages(reference.model, local.model, {
                minConfidence: config.gates.minConfidence,
              });
              entry.matching = matchingSummary(matching, config.gates.minConfidence);
              entry.checks = evaluateAssertions(surface.assertions, { reference: entry.reference, local: entry.local });
              entry.coverage = coverageFor({
                reference: entry.reference,
                local: entry.local,
                required,
                matching,
                checks: entry.checks,
              });
            } else {
              entry.checks = evaluateAssertions(surface.assertions, { reference: entry.reference, local: entry.local });
              entry.coverage = coverageFor({
                reference: entry.reference,
                local: entry.local,
                required,
                checks: entry.checks,
              });
            }
            recomputeGates(entry, config);
          }

          metrics.surfaces[surface.id][viewport.id][theme] = entry;
        }
      }

      if (surface.uniqueBodies) {
        const result = await measureUniqueBodies({
          browser, config, surface, viewport: config.viewports[0], logger,
        });
        addUniqueBodies(metrics, surface, result);
        for (const byViewport of Object.values(metrics.surfaces[surface.id])) {
          for (const entry of Object.values(byViewport)) recomputeGates(entry, config);
        }
      }
    }

    metrics.summary = collectSummary(metrics);
    const entries = Object.values(metrics.surfaces).flatMap((byViewport) =>
      Object.values(byViewport).flatMap((byTheme) => Object.values(byTheme)),
    );
    const fatal = new Set([
      "unreachable", "timeout", "dns", "tls", "blocked", "forbidden", "unauthorized",
      "rate-limited", "http-error", "no-target", "invalid-route", "aborted", "error",
    ]);
    // An unreachable or blocked reference is an environment failure (exit 3),
    // not a failed clone (exit 1): otherwise a typo in a URL reads as bad code.
    metrics.summary.targetFailed =
      entries.length > 0 && entries.every((entry) => fatal.has(entry.reference?.status));
    const finishedAt = new Date().toISOString();

    await writeFile(path.join(outDir, "metrics.json"), `${JSON.stringify(metrics, null, 2)}\n`);
    await writeFile(path.join(outDir, "report.md"), makeReport(metrics));

    const manifest = {
      tool: TOOL_VERSION,
      configHash: metrics.conditions.configHash,
      startedAt,
      finishedAt,
      durationMs: new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
      target: config.target,
      local: config.local,
      config: redactConfig(config),
      surfaces: surfaces.map((surface) => ({
        id: surface.id,
        refPath: surface.refPath,
        localPath: surface.localPath,
        checks: surface.checks,
        assertions: surface.assertions.length,
        fullPage: surface.fullPage,
      })),
      summary: metrics.summary,
      artifacts: {
        metrics: "metrics.json",
        report: "report.md",
        capture: "capture/",
      },
    };
    await writeFile(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

    // `--fail-on` selects which axis can fail the run: the default is either,
    // with exit 1 for failed assertions and 4 for uncovered routes.
    const failOn = config.gates.failOn ?? "any";
    const assertionFailed = metrics.summary.failed > 0;
    const coverageFailed = metrics.summary.coverageFailures > 0;
    let exitCode = 0;
    if (metrics.summary.targetFailed || metrics.summary.captures === 0) exitCode = 3;
    else if (failOn === "coverage") exitCode = coverageFailed ? 4 : 0;
    else if (failOn === "assertions") exitCode = assertionFailed ? 1 : 0;
    else exitCode = assertionFailed ? 1 : coverageFailed ? 4 : 0;

    return { metrics, manifest, outDir, exitCode, startedAt, finishedAt };
  } finally {
    await browser.close().catch(() => {});
    stopServer(server);
  }
}

export async function captureSite(config, { logger, root = process.cwd() } = {}) {
  if (!config.target) throw new ConfigError("No target URL configured.");
  const outDir = outputDirFor(config, root);
  await mkdir(outDir, { recursive: true });
  const startedAt = new Date().toISOString();
  const server = await ensureDevServer(config, { logger, root });
  const browser = await launchBrowser({
    executablePath: process.env.COPYUI_CHROMIUM_EXECUTABLE ?? process.env.COMPARE_CHROMIUM_EXECUTABLE,
  });

  try {
    const discovery = await discoverRoutes({ url: config.target, config, browser, logger });
    if (discovery.status === "blocked") {
      const error = new Error(discovery.reason ?? "Target blocked discovery");
      error.exitCode = 3;
      throw error;
    }
    const surfaces = discovery.routes.map((route, index) =>
      normalizeSurface({ id: route.id, refPath: route.path, localPath: route.path, checks: false }, index),
    );
    const metrics = {
      conditions: {
        reference: config.target,
        viewports: config.viewports.map((viewport) => viewport.id),
        themes: config.themes,
        reducedMotion: config.capture.reducedMotion,
        configHash: configHash(config),
      },
      routes: {},
      discovery: {
        status: discovery.status,
        routes: discovery.routes.length,
        warnings: discovery.warnings,
      },
    };

    for (const surface of surfaces) {
      metrics.routes[surface.id] = {};
      for (const viewport of config.viewports) {
        metrics.routes[surface.id][viewport.id] = {};
        for (const theme of config.themes) {
          logger?.info(`${surface.id} · ${viewport.id} · ${theme}`);
          const result = await captureSide({
            browser, config, surface, side: "reference", viewport, theme, outDir, logger,
          });
          metrics.routes[surface.id][viewport.id][theme] = metricView(result);
        }
      }
    }

    const captures = Object.values(metrics.routes).flatMap((byViewport) =>
      Object.values(byViewport).flatMap((byTheme) => Object.values(byTheme)),
    );
    metrics.summary = {
      routes: surfaces.length,
      captures: captures.length,
      ok: captures.filter((entry) => entry.status === "ok").length,
      statuses: captures.reduce((acc, entry) => {
        acc[entry.status] = (acc[entry.status] ?? 0) + 1;
        return acc;
      }, {}),
    };
    const finishedAt = new Date().toISOString();
    await writeFile(path.join(outDir, "metrics.json"), `${JSON.stringify(metrics, null, 2)}\n`);
    await writeFile(
      path.join(outDir, "manifest.json"),
      `${JSON.stringify(
        {
          tool: TOOL_VERSION,
          configHash: metrics.conditions.configHash,
          startedAt,
          finishedAt,
          target: config.target,
          config: redactConfig(config),
          summary: metrics.summary,
          artifacts: { metrics: "metrics.json", capture: "capture/" },
        },
        null,
        2,
      )}\n`,
    );
    const exitCode = metrics.summary.ok === captures.length ? 0 : metrics.summary.ok === 0 ? 3 : 4;
    return { metrics, outDir, exitCode, finishedAt };
  } finally {
    await browser.close().catch(() => {});
    stopServer(server);
  }
}

export { summarizeChecks };
