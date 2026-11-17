import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseUrl } from "./core/urls.mjs";

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigError";
    this.exitCode = 2;
  }
}

export const TOOL_VERSION = "0.1.0";
export const USER_AGENT = "copyui/0.1 (+https://github.com/donovinsims/copyui)";

export const DEFAULT_VIEWPORTS = [
  { id: "1440x900", width: 1440, height: 900 },
  { id: "1024x768", width: 1024, height: 768 },
  { id: "390x844", width: 390, height: 844 },
];

export const DEFAULTS = {
  target: null,
  local: null,
  viewports: DEFAULT_VIEWPORTS,
  themes: ["light"],
  routes: {
    include: ["/**"],
    exclude: [],
    maxPages: 25,
    depth: 2,
    crawl: true,
    sitemap: true,
    ignoreRobots: false,
  },
  capture: {
    fullPage: false,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    timeoutMs: 60000,
    retries: 2,
    settleMs: 250,
    maxNodes: 12000,
    freezeClock: true,
    seedRandom: true,
    blockHosts: [
      "*google-analytics.com",
      "*googletagmanager.com",
      "*doubleclick.net",
      "*segment.com",
      "*segment.io",
      "*mixpanel.com",
      "*hotjar.com",
      "*fullstory.com",
      "*clarity.ms",
      "*sentry.io",
      "*intercom.io",
      "*intercomcdn.com",
      "*drift.com",
      "*crisp.chat",
    ],
    locale: "en-US",
    timezoneId: "UTC",
    screenshot: true,
  },
  auth: {
    storageState: null,
    headers: {},
  },
  consent: { dismiss: [] },
  cache: { enabled: true, dir: ".copyui-cache", ttlMs: 15 * 60 * 1000 },
  theme: {
    toggle: { light: null, dark: null },
    attribute: "data-theme",
    class: "dark",
    storageKeys: [],
  },
  navigation: [],
  slots: { reference: {}, local: {} },
  derived: { reference: {}, local: {} },
  surfaces: null,
  uniqueBodies: null,
  gates: {
    assertions: 0.95,
    coverage: 0.9,
    minConfidence: 0.5,
    failOn: "any",
  },
  devServer: null,
  output: null,
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function deepMerge(base, override) {
  if (Array.isArray(override)) return [...override];
  if (!isPlainObject(override)) return override === undefined ? base : override;
  const out = { ...(isPlainObject(base) ? base : {}) };
  for (const [key, value] of Object.entries(override)) {
    out[key] = key in out ? deepMerge(out[key], value) : value;
  }
  return out;
}

export function parseViewport(value) {
  if (isPlainObject(value)) {
    const width = Number(value.width);
    const height = Number(value.height);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new ConfigError(`Invalid viewport: ${JSON.stringify(value)}`);
    }
    return { id: value.id ?? `${width}x${height}`, width: Math.round(width), height: Math.round(height) };
  }
  const match = /^(\d+)\s*[x×]\s*(\d+)$/i.exec(String(value).trim());
  if (!match) throw new ConfigError(`Invalid viewport "${value}". Use WIDTHxHEIGHT, e.g. 1440x900.`);
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width <= 0 || height <= 0) throw new ConfigError(`Invalid viewport "${value}".`);
  return { id: `${width}x${height}`, width, height };
}

export function normalizeViewports(value) {
  if (value === "derive" || value === undefined || value === null) {
    return DEFAULT_VIEWPORTS.map((viewport) => ({ ...viewport }));
  }
  const list = Array.isArray(value) ? value : String(value).split(",").map((entry) => entry.trim()).filter(Boolean);
  const viewports = list.map(parseViewport);
  if (!viewports.length) throw new ConfigError("At least one viewport is required.");
  return viewports;
}

export function normalizeThemes(value) {
  if (value === undefined || value === null) return ["light"];
  const themes = (Array.isArray(value) ? value : String(value).split(",")).map((entry) => String(entry).trim().toLowerCase()).filter(Boolean);
  const invalid = themes.filter((theme) => theme !== "light" && theme !== "dark");
  if (invalid.length) throw new ConfigError(`Unsupported theme(s): ${invalid.join(", ")}. Use light or dark.`);
  return [...new Set(themes.length ? themes : ["light"])];
}

function normalizeUrl(value, label) {
  if (value === null || value === undefined || value === "") return null;
  const url = parseUrl(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ConfigError(`${label} must be an http(s) URL.`);
  }
  return url.href;
}

export function normalizeConfig(input = {}) {
  const merged = deepMerge(structuredClone(DEFAULTS), input ?? {});
  merged.target = normalizeUrl(merged.target, "target");
  merged.local = normalizeUrl(merged.local, "local");
  merged.viewports = normalizeViewports(merged.viewports);
  merged.themes = normalizeThemes(merged.themes);

  merged.routes = {
    ...DEFAULTS.routes,
    ...(merged.routes ?? {}),
  };
  merged.routes.include = Array.isArray(merged.routes.include) ? merged.routes.include : [merged.routes.include].filter(Boolean);
  merged.routes.exclude = Array.isArray(merged.routes.exclude) ? merged.routes.exclude : [merged.routes.exclude].filter(Boolean);
  for (const key of ["maxPages", "depth"]) {
    const value = Number(merged.routes[key]);
    if (!Number.isFinite(value) || value < 0) throw new ConfigError(`routes.${key} must be a non-negative number.`);
    merged.routes[key] = Math.round(value);
  }
  if (merged.routes.maxPages === 0) throw new ConfigError("routes.maxPages must be at least 1.");

  merged.capture = { ...DEFAULTS.capture, ...(merged.capture ?? {}) };
  for (const key of ["timeoutMs", "retries", "settleMs", "maxNodes"]) {
    const value = Number(merged.capture[key]);
    if (!Number.isFinite(value) || value < 0) throw new ConfigError(`capture.${key} must be a non-negative number.`);
    merged.capture[key] = Math.round(value);
  }
  merged.capture.blockHosts = Array.isArray(merged.capture.blockHosts) ? merged.capture.blockHosts : [];

  merged.auth = { ...DEFAULTS.auth, ...(merged.auth ?? {}) };
  merged.auth.headers = merged.auth.headers && typeof merged.auth.headers === "object" ? merged.auth.headers : {};

  merged.cache = { ...DEFAULTS.cache, ...(merged.cache ?? {}) };
  merged.cache.enabled = merged.cache.enabled !== false;
  if (typeof merged.cache.dir !== "string" || !merged.cache.dir.trim()) {
    throw new ConfigError("cache.dir must be a directory path.");
  }
  const cacheTtl = Number(merged.cache.ttlMs);
  if (!Number.isFinite(cacheTtl) || cacheTtl < 0) throw new ConfigError("cache.ttlMs must be a non-negative number.");
  merged.cache.ttlMs = Math.round(cacheTtl);

  merged.consent = { ...DEFAULTS.consent, ...(merged.consent ?? {}) };
  merged.consent.dismiss = Array.isArray(merged.consent.dismiss) ? merged.consent.dismiss : [merged.consent.dismiss].filter(Boolean);

  merged.theme = { ...DEFAULTS.theme, ...(merged.theme ?? {}) };
  merged.theme.toggle = { ...DEFAULTS.theme.toggle, ...(merged.theme.toggle ?? {}) };
  merged.theme.storageKeys = Array.isArray(merged.theme.storageKeys) ? merged.theme.storageKeys : [];
  merged.theme.attribute = merged.theme.attribute === false ? null : merged.theme.attribute ?? "data-theme";
  merged.theme.class = merged.theme.class === false ? null : merged.theme.class ?? "dark";

  merged.navigation = Array.isArray(merged.navigation) ? merged.navigation : [];
  merged.slots = { reference: {}, local: {}, ...(merged.slots ?? {}) };
  merged.derived = { reference: {}, local: {}, ...(merged.derived ?? {}) };
  merged.gates = { ...DEFAULTS.gates, ...(merged.gates ?? {}) };
  if (!["any", "assertions", "coverage"].includes(merged.gates.failOn)) {
    throw new ConfigError('gates.failOn must be "any", "assertions" or "coverage".');
  }
  merged.surfaces = Array.isArray(merged.surfaces) ? merged.surfaces : null;

  for (const surface of merged.surfaces ?? []) {
    if (!surface.id) throw new ConfigError("Every surface needs an id.");
    if (merged.surfaces.filter((entry) => entry.id === surface.id).length > 1) {
      throw new ConfigError(`Duplicate surface id: ${surface.id}`);
    }
  }

  if (merged.output !== null && typeof merged.output !== "string") {
    throw new ConfigError("output must be a directory path.");
  }
  return merged;
}

export async function loadConfigFile(file) {
  if (!file) return {};
  const absolute = path.resolve(file);
  const text = await readFile(absolute, "utf8");
  if (absolute.endsWith(".json")) {
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new ConfigError(`Invalid JSON config ${absolute}: ${error.message}`);
    }
  }
  const module = await import(`${pathToFileURL(absolute).href}?v=${Date.now()}`);
  const exported = module.default ?? module.config;
  if (typeof exported === "function") return await exported();
  if (!exported || typeof exported !== "object") {
    throw new ConfigError(`Config ${absolute} must export a default object.`);
  }
  return exported;
}

function cliToConfig(cli) {
  const out = {};
  if (cli.target) out.target = cli.target;
  if (cli.local) out.local = cli.local;
  if (cli.viewports?.length) out.viewports = cli.viewports;
  if (cli.themes?.length) out.themes = cli.themes;
  if (cli.output) out.output = cli.output;
  if (cli.maxPages !== undefined) out.routes = { ...(out.routes ?? {}), maxPages: cli.maxPages };
  if (cli.depth !== undefined) out.routes = { ...(out.routes ?? {}), depth: cli.depth };
  if (cli.routes?.length) out.routes = { ...(out.routes ?? {}), include: cli.routes };
  if (cli.exclude?.length) out.routes = { ...(out.routes ?? {}), exclude: cli.exclude };
  if (cli.ignoreRobots !== undefined) out.routes = { ...(out.routes ?? {}), ignoreRobots: cli.ignoreRobots };
  if (cli.fullPage !== undefined) out.capture = { ...(out.capture ?? {}), fullPage: cli.fullPage };
  if (cli.concurrency !== undefined) out.capture = { ...(out.capture ?? {}), concurrency: cli.concurrency };
  if (cli.storageState) out.auth = { ...(out.auth ?? {}), storageState: cli.storageState };
  if (cli.headers) out.auth = { ...(out.auth ?? {}), headers: { ...(out.auth?.headers ?? {}), ...cli.headers } };
  if (cli.failOn) out.gates = { ...(out.gates ?? {}), failOn: cli.failOn };
  if (cli.cache === false) out.cache = { ...(out.cache ?? {}), enabled: false };
  if (cli.cacheDir) out.cache = { ...(out.cache ?? {}), dir: cli.cacheDir };
  return out;
}

export async function resolveConfig({ file, cli = {}, requireTarget = true } = {}) {
  let base = {};
  if (file) {
    try {
      base = await loadConfigFile(file);
    } catch (error) {
      if (error instanceof ConfigError) throw error;
      throw new ConfigError(`Could not load config ${file}: ${error.message}`);
    }
  }
  const config = normalizeConfig(deepMerge(base, cliToConfig(cli)));
  if (requireTarget && !config.target) {
    throw new ConfigError("No target URL. Pass a URL or set `target` in the config file.");
  }
  return config;
}

export function redactConfig(config) {
  return {
    ...config,
    auth: {
      ...config.auth,
      storageState: config.auth?.storageState ? path.basename(config.auth.storageState) : null,
      headers: Object.fromEntries(Object.keys(config.auth?.headers ?? {}).map((key) => [key, "<redacted>"])),
    },
  };
}

function stableValue(value) {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableValue(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

export function stableStringify(value) {
  return stableValue(value);
}

export function configHash(config) {
  const relevant = {
    target: config.target,
    local: config.local,
    viewports: config.viewports,
    themes: config.themes,
    routes: config.routes,
    capture: config.capture,
    theme: config.theme,
    slots: config.slots,
    derived: config.derived,
    surfaces: config.surfaces,
    uniqueBodies: config.uniqueBodies,
    gates: config.gates,
  };
  return createHash("sha256").update(stableStringify(relevant)).digest("hex").slice(0, 16);
}

export function outputDirFor(config, root = process.cwd()) {
  if (config.output) return path.resolve(root, config.output);
  const host = config.target ? parseUrl(config.target).hostname.replace(/^www\./, "") : "site";
  return path.resolve(root, "out", host.replace(/[^a-zA-Z0-9.-]+/g, "-"));
}
