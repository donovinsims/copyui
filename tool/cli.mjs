#!/usr/bin/env node
import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import { createLogger } from "./log.mjs";
import { ConfigError, TOOL_VERSION, resolveConfig } from "./config.mjs";
import { launchBrowser } from "./core/browser.mjs";
import { captureSite, runCompare } from "./core/capture.mjs";
import { discoverRoutes } from "./core/discover.mjs";

class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageError";
    this.exitCode = 2;
  }
}

const HELP = `copyui — capture, compare and clone websites

Usage:
  copyui scan    <url>                          discover routes, capture nothing
  copyui capture <url>                          capture snapshots, assets and a page model
  copyui compare <reference> <local>             capture both sides and run declarative gates
  copyui init                                    write copyui.config.mjs

Options:
  -c, --config <file>        config module or JSON file
  -o, --output <dir>         artifact directory (default out/<host>)
      --viewport <WxH>       repeatable viewport
      --themes <list>        comma-separated: light,dark
      --route <glob>         repeatable include route
      --exclude <glob>       repeatable exclude route
      --max-pages <n>        route cap (default 25)
      --depth <n>            crawl depth (default 2)
      --full-page            capture the whole document
      --storage-state <file> Playwright storage state for authenticated targets
      --header "K: V"        repeatable extra HTTP header
      --ignore-robots        allow routes robots.txt disallows (explicit, warns)
      --no-crawl             sitemap/start URL only
      --no-sitemap           skip sitemap discovery
      --no-cache             refetch robots.txt and sitemaps
      --cache-dir <dir>      discovery cache directory (default .copyui-cache)
      --json                 machine-readable progress and scan output
      --dry-run              scan only; write nothing
      --fail-on <axis>       any (default), assertions or coverage
  -h, --help                 show this help
  -v, --version              print the tool version

Exit codes: 0 pass · 1 gate failure · 2 usage/config · 3 target unreachable or blocked · 4 partial coverage
`;

function parseArgs(argv) {
  const options = {
    positionals: [],
    viewports: [],
    themes: [],
    routes: [],
    exclude: [],
    headers: {},
    flags: {},
  };

  const readValue = (index, inline, key) => {
    if (inline !== null && inline !== undefined) return inline;
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) throw new UsageError(`--${key} needs a value.`);
    return next;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (raw === "--") {
      options.positionals.push(...argv.slice(index + 1));
      break;
    }
    if (!raw.startsWith("-")) {
      options.positionals.push(raw);
      continue;
    }
    let key = raw.replace(/^--?/, "");
    let inline = null;
    const equals = key.indexOf("=");
    if (equals >= 0) {
      inline = key.slice(equals + 1);
      key = key.slice(0, equals);
    }
    if (key === "c") key = "config";
    if (key === "o") key = "output";
    if (key === "h") key = "help";
    if (key === "v") key = "version";

    switch (key) {
      case "config":
        options.config = readValue(index, inline, key);
        index += inline === null ? 1 : 0;
        break;
      case "output":
        options.output = readValue(index, inline, key);
        index += inline === null ? 1 : 0;
        break;
      case "viewport":
        options.viewports.push(readValue(index, inline, key));
        index += inline === null ? 1 : 0;
        break;
      case "themes":
        options.themes.push(...readValue(index, inline, key).split(","));
        index += inline === null ? 1 : 0;
        break;
      case "route":
        options.routes.push(readValue(index, inline, key));
        index += inline === null ? 1 : 0;
        break;
      case "exclude":
        options.exclude.push(readValue(index, inline, key));
        index += inline === null ? 1 : 0;
        break;
      case "max-pages":
        options.maxPages = Number(readValue(index, inline, key));
        index += inline === null ? 1 : 0;
        break;
      case "depth":
        options.depth = Number(readValue(index, inline, key));
        index += inline === null ? 1 : 0;
        break;
      case "storage-state":
        options.storageState = readValue(index, inline, key);
        index += inline === null ? 1 : 0;
        break;
      case "fail-on":
        options.failOn = readValue(index, inline, key);
        index += inline === null ? 1 : 0;
        break;
      case "header": {
        const header = readValue(index, inline, key);
        const separator = header.indexOf(":");
        if (separator < 0) throw new UsageError('--header needs "Name: value".');
        options.headers[header.slice(0, separator).trim()] = header.slice(separator + 1).trim();
        index += inline === null ? 1 : 0;
        break;
      }
      case "full-page":
        options.fullPage = true;
        break;
      case "ignore-robots":
        options.ignoreRobots = true;
        break;
      case "no-crawl":
        options.crawl = false;
        break;
      case "no-sitemap":
        options.sitemap = false;
        break;
      case "no-cache":
        options.cache = false;
        break;
      case "cache-dir":
        options.cacheDir = readValue(index, inline, key);
        index += inline === null ? 1 : 0;
        break;
      case "json":
        options.json = true;
        break;
      case "dry-run":
        options.dryRun = true;
        break;
      case "help":
        options.help = true;
        break;
      case "version":
        options.version = true;
        break;
      default:
        throw new UsageError(`Unknown option --${key}.`);
    }
  }

  if (options.ignoreRobots) {
    options.flags.ignoreRobots = true;
  }
  return options;
}

async function buildConfig(options, { requireLocal = false } = {}) {
  const config = await resolveConfig({
    file: options.config,
    cli: {
      target: options.positionals[0],
      local: requireLocal ? options.positionals[1] : undefined,
      viewports: options.viewports,
      themes: options.themes,
      output: options.output,
      routes: options.routes,
      exclude: options.exclude,
      maxPages: options.maxPages,
      depth: options.depth,
      fullPage: options.fullPage,
      storageState: options.storageState,
      headers: options.headers,
      failOn: options.failOn,
      ignoreRobots: options.ignoreRobots === true ? true : undefined,
      cache: options.cache,
      cacheDir: options.cacheDir,
    },
  });

  if (options.crawl === false) config.routes.crawl = false;
  if (options.sitemap === false) config.routes.sitemap = false;
  if (options.ignoreRobots) config.routes.ignoreRobots = true;
  if (requireLocal && !config.local) {
    throw new ConfigError("compare needs a local URL: copyui compare <reference> <local>");
  }
  return config;
}

async function commandScan(options, logger) {
  const config = await buildConfig(options);
  // Sitemap/robots discovery needs no browser; only the link crawl does.
  const browser = config.routes.crawl
    ? await launchBrowser({
        executablePath: process.env.COPYUI_CHROMIUM_EXECUTABLE ?? process.env.COMPARE_CHROMIUM_EXECUTABLE,
      })
    : null;
  try {
    const discovery = await discoverRoutes({ url: config.target, config, browser, logger });
    if (options.json) {
      process.stdout.write(`${JSON.stringify(discovery, null, 2)}\n`);
    } else {
      process.stdout.write(`Target   ${config.target}\n`);
      process.stdout.write(`Status   ${discovery.status}\n`);
      process.stdout.write(`Robots   ${discovery.robots.status === 200 ? "found" : `HTTP ${discovery.robots.status}`}\n`);
      process.stdout.write(`Found    ${discovery.routes.length} route(s) · ${discovery.counts.sitemap} sitemap · ${discovery.counts.crawl} crawled\n`);
      for (const route of discovery.routes) {
        process.stdout.write(`  ${route.path}  [${route.source}${route.depth ? `, depth ${route.depth}` : ""}]\n`);
      }
      for (const warning of discovery.warnings) process.stdout.write(`  ! ${warning}\n`);
    }
    return discovery.status === "ok" ? 0 : discovery.status === "empty" ? 4 : 3;
  } finally {
    await browser?.close().catch(() => {});
  }
}

async function commandCapture(options, logger) {
  const config = await buildConfig(options);
  if (options.dryRun) return commandScan(options, logger);
  const result = await captureSite(config, { logger });
  process.stdout.write(
    `Captured ${result.metrics.summary.ok}/${result.metrics.summary.captures} · ${result.outDir}\n`,
  );
  return result.exitCode;
}

async function commandCompare(options, logger) {
  const config = await buildConfig(options, { requireLocal: true });
  if (options.dryRun) return commandScan(options, logger);
  const result = await runCompare(config, { logger });
  const { summary } = result.metrics;
  process.stdout.write(
    `Checks ${summary.checks} total · ${summary.checks - summary.failed} passed · ${summary.failed} failed · captures ${summary.captures} · coverage failures ${summary.coverageFailures}\n`,
  );
  process.stdout.write(`Artifacts ${result.outDir}\n`);
  return result.exitCode;
}

async function commandInit(logger) {
  const file = path.resolve("copyui.config.mjs");
  try {
    await access(file);
    logger.warn("config already exists", { file });
    return 0;
  } catch {
    /* write it */
  }
  const template = `export default {
  target: "https://example.com",
  viewports: "derive",
  themes: ["light", "dark"],
  routes: { include: ["/**"], exclude: [], maxPages: 25, depth: 2 },
  capture: { fullPage: false },
  gates: { assertions: 0.95, coverage: 0.9 },
  output: "out/example-com",
};
`;
  await writeFile(file, template);
  logger.info("wrote config", { file });
  return 0;
}

async function main(argv) {
  const options = parseArgs(argv);
  const logger = createLogger({ json: Boolean(options.json) });
  if (options.help || options.positionals.length === 0) {
    process.stdout.write(HELP);
    return options.help ? 0 : 2;
  }
  if (options.version) {
    process.stdout.write(`${TOOL_VERSION}\n`);
    return 0;
  }
  const command = options.positionals.shift();
  logger.info("copyui", { version: TOOL_VERSION, command });

  switch (command) {
    case "scan":
      return commandScan(options, logger);
    case "capture":
      return commandCapture(options, logger);
    case "compare":
      return commandCompare(options, logger);
    case "init":
      return commandInit(logger);
    case "help":
      process.stdout.write(HELP);
      return 0;
    default:
      throw new UsageError(`Unknown command "${command}". Run copyui --help.`);
  }
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = Number.isInteger(code) ? code : 0;
  })
  .catch((error) => {
    if (error instanceof UsageError || error instanceof ConfigError) {
      process.stderr.write(`copyui: ${error.message}\n`);
      process.exitCode = error.exitCode ?? 2;
      return;
    }
    process.stderr.write(`copyui: ${error?.stack ?? error}\n`);
    process.exitCode = error?.exitCode ?? 3;
  });
