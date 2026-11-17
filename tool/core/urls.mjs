const TRACKING_PARAMS = [
  /^utm_/i,
  /^ga_/i,
  /^mc_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^msclkid$/i,
  /^dclid$/i,
  /^igshid$/i,
  /^ref_src$/i,
  /^ref_url$/i,
  /^spm$/i,
  /^yclid$/i,
];

const ASSET_EXTENSION = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|pdf|zip|rar|7z|mp4|m4v|webm|mov|mp3|wav|ogg|woff2?|ttf|otf|eot|css|js|mjs|map|xml|txt|json)$/i;

export class UrlError extends Error {
  constructor(message) {
    super(message);
    this.name = "UrlError";
  }
}

export function parseUrl(input, base) {
  try {
    return base ? new URL(input, base) : new URL(input);
  } catch {
    throw new UrlError(`Not a valid URL: ${input}`);
  }
}

export function isHttpUrl(input) {
  try {
    const { protocol } = new URL(input);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function isAssetUrl(input) {
  try {
    return ASSET_EXTENSION.test(new URL(input).pathname);
  } catch {
    return false;
  }
}

export function sameOrigin(a, b) {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
}

export function stripTracking(search) {
  const params = new URLSearchParams(search);
  for (const key of [...params.keys()]) {
    if (TRACKING_PARAMS.some((pattern) => pattern.test(key))) params.delete(key);
  }
  return params;
}

/**
 * Route identity: pathname without a trailing slash (except the root), plus a
 * stable, tracking-free query string. Two links that differ only by `utm_*`
 * resolve to the same route.
 */
export function canonicalRoutePath(pathname, search = "") {
  let path = pathname || "/";
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1) path = path.replace(/\/+$/, "") || "/";
  const params = stripTracking(search);
  const entries = [...params.entries()].sort(([a, av], [b, bv]) => (a === b ? (av < bv ? -1 : av > bv ? 1 : 0) : a < b ? -1 : 1));
  const query = new URLSearchParams(entries).toString();
  return query ? `${path}?${query}` : path;
}

export function canonicalizeUrl(input, base) {
  const url = parseUrl(input, base);
  url.hash = "";
  const params = stripTracking(url.search);
  url.search = params.toString();
  return url;
}

export function routePathFor(url) {
  return canonicalRoutePath(url.pathname, url.search);
}

export function routeSlug(routePath) {
  const path = routePath.split("?")[0] ?? "/";
  if (path === "/" || path === "") return "__home__";
  const slug = path
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const query = routePath.includes("?") ? `-${routePath.split("?")[1]}` : "";
  const combined = `${slug || "route"}${query}`
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return combined.slice(0, 96) || "route";
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Minimal glob for route filters: `**` spans path segments, `*` spans one
 * segment, `?` is one character and `{a,b}` is a choice.
 */
export function globToRegExp(pattern) {
  let out = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === "*") {
      if (pattern[index + 1] === "*") {
        out += ".*";
        index += 1;
        if (pattern[index + 1] === "/") index += 1;
      } else {
        out += "[^/]*";
      }
    } else if (char === "?") {
      out += "[^/]";
    } else if (char === "{") {
      const end = pattern.indexOf("}", index);
      if (end === -1) {
        out += "\\{";
      } else {
        const choices = pattern.slice(index + 1, end).split(",").map(escapeRegExp);
        out += `(?:${choices.join("|")})`;
        index = end;
      }
    } else {
      out += escapeRegExp(char);
    }
  }
  return new RegExp(`${out}$`);
}

export function matchesRoute(pattern, routePath) {
  if (!pattern) return false;
  let normalized = pattern;
  if (normalized.length > 1 && normalized.endsWith("/") && !normalized.endsWith("**/")) {
    normalized = normalized.slice(0, -1);
  }
  if (normalized === routePath) return true;
  if (normalized.endsWith("/**")) {
    const prefix = normalized.slice(0, -3) || "/";
    if (routePath === prefix) return true;
  }
  return globToRegExp(normalized).test(routePath);
}

export function matchesAny(patterns, routePath) {
  return (patterns ?? []).some((pattern) => matchesRoute(pattern, routePath));
}

export function filterRoutePaths(paths, { include = ["/**"], exclude = [] } = {}) {
  return paths.filter(
    (routePath) =>
      (include.length === 0 || matchesAny(include, routePath)) &&
      (exclude.length === 0 || !matchesAny(exclude, routePath)),
  );
}

export function slugForUrl(input) {
  const url = parseUrl(input);
  const host = url.hostname.replace(/^www\./, "").replace(/[^a-zA-Z0-9.-]+/g, "-");
  const path = routeSlug(routePathFor(url));
  return `${host}${path === "__home__" ? "" : `-${path}`}`.toLowerCase().slice(0, 120);
}

export function uniqueBy(items, key) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const value = key(item);
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(item);
  }
  return out;
}
