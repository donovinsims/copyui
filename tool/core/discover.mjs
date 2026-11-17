import path from "node:path";
import { createCache, createCachingFetch } from "./cache.mjs";
import { createCaptureContext, preparePage } from "./browser.mjs";
import { isAllowed, loadRobots, rulesFor } from "./robots.mjs";
import {
  canonicalRoutePath,
  canonicalizeUrl,
  isAssetUrl,
  routeSlug,
  sameOrigin,
  uniqueBy,
  matchesAny,
} from "./urls.mjs";

const SITEMAP_LIMIT = 5;
const SITEMAP_URL_LIMIT = 500;
const CRAWL_LIMIT_FACTOR = 2;

export async function fetchText(url, { headers = {}, timeoutMs = 8000, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(url, {
    headers,
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} for ${url}`);
    error.status = response.status;
    throw error;
  }
  return response.text();
}

export function parseSitemap(xml) {
  const text = String(xml ?? "");
  const urls = [...text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) =>
    match[1].replace(/&amp;/g, "&"),
  );
  return {
    isIndex: /<sitemapindex[\s>]/i.test(text),
    urls: [...new Set(urls)],
  };
}

async function probeStart(url, { headers = {}, fetchImpl = fetch, timeoutMs = 8000 } = {}) {
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    response.body?.cancel?.().catch?.(() => {});
    return { status: response.status };
  } catch (error) {
    const message = String(error?.message ?? error);
    const status = /timeout|timed out/i.test(message)
      ? "timeout"
      : /ENOTFOUND|EAI_AGAIN|getaddrinfo|ERR_NAME/i.test(message)
        ? "dns"
        : "unreachable";
    return { status, reason: message };
  }
}

async function collectSitemapUrls(origin, robots, config, { fetchImpl, logger }) {
  const urls = [];
  const warnings = [];
  if (!config.routes?.sitemap) return { urls, warnings };
  const candidates = [...(robots?.robots?.sitemaps ?? [])];
  candidates.push(new URL("/sitemap.xml", origin).href);
  const seen = new Set();
  const queue = candidates.map((url) => ({ url, depth: 0 }));
  let fetched = 0;

  while (queue.length && fetched < SITEMAP_LIMIT) {
    const { url, depth } = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    fetched += 1;
    try {
      const xml = await fetchText(url, {
        headers: config.auth?.headers ?? {},
        timeoutMs: 8000,
        fetchImpl,
      });
      const sitemap = parseSitemap(xml);
      if (sitemap.isIndex && depth < 1) {
        for (const child of sitemap.urls.slice(0, 8)) queue.push({ url: child, depth: depth + 1 });
      } else {
        for (const entry of sitemap.urls) {
          if (urls.length >= SITEMAP_URL_LIMIT) break;
          urls.push(entry);
        }
      }
    } catch (error) {
      if (seen.size <= 2) warnings.push(`sitemap unavailable: ${url} (${error.status ?? error.message})`);
    }
  }

  return { urls, warnings };
}

async function crawlLinks({ startUrl, origin, config, browser, robots, logger }) {
  const warnings = [];
  if (!config.routes?.crawl || !browser) return { pages: [], warnings };
  const context = await createCaptureContext(browser, config, {
    viewport: { width: 1280, height: 900 },
    theme: "light",
    side: "reference",
  });
  const page = await context.newPage();
  const visited = new Set();
  const pages = [];
  const queue = [{ url: startUrl, depth: 0 }];
  const limit = Math.max(1, config.routes.maxPages) * CRAWL_LIMIT_FACTOR;
  const rules = rulesFor(robots?.robots, config.userAgent);

  try {
    await preparePage(page, config, { theme: "light", side: "reference" });
    while (queue.length && visited.size < limit) {
      const { url, depth } = queue.shift();
      const canonical = canonicalizeUrl(url).href;
      if (visited.has(canonical)) continue;
      visited.add(canonical);
      let response;
      try {
        response = await page.goto(canonical, {
          waitUntil: "domcontentloaded",
          timeout: Math.min(config.capture?.timeoutMs ?? 60000, 30000),
        });
      } catch (error) {
        warnings.push(`crawl failed: ${canonical} (${error.message})`);
        continue;
      }
      if (!response || response.status() >= 400) {
        if (response) warnings.push(`crawl skipped ${canonical}: HTTP ${response.status()}`);
        continue;
      }
      pages.push({ url: canonical, depth });
      if (depth >= config.routes.depth) continue;

      const hrefs = await page
        .evaluate(() => {
          const out = [];
          const collect = (root) => {
            for (const anchor of root.querySelectorAll?.("a[href], area[href]") ?? []) {
              out.push(anchor.href);
            }
            for (const element of root.querySelectorAll?.("*") ?? []) {
              if (element.shadowRoot) collect(element.shadowRoot);
            }
          };
          collect(document);
          return out;
        })
        .catch(() => []);

      for (const href of hrefs) {
        let next;
        try {
          next = canonicalizeUrl(href);
        } catch {
          continue;
        }
        if (!/^https?:$/.test(next.protocol)) continue;
        if (next.origin !== origin) continue;
        if (isAssetUrl(next.href)) continue;
        const routePath = canonicalRoutePath(next.pathname, next.search);
        if (!config.routes.ignoreRobots && !isAllowed(routePath, rules)) continue;
        if (config.routes.exclude.length && matchesAny(config.routes.exclude, routePath)) continue;
        if (visited.has(next.href)) continue;
        queue.push({ url: next.href, depth: depth + 1 });
      }
    }
  } finally {
    await context.close().catch(() => {});
  }

  return { pages, warnings };
}

/**
 * Route discovery: robots, sitemaps and a bounded same-origin crawl, merged into
 * one canonical, include/exclude-filtered route list.
 */
export async function discoverRoutes({
  url,
  config,
  browser = null,
  fetchImpl = fetch,
  logger = null,
}) {
  const start = canonicalizeUrl(url);
  const origin = start.origin;
  const warnings = [];
  const cache = createCache({
    dir: path.resolve(config.cache?.dir ?? ".copyui-cache"),
    ttlMs: config.cache?.ttlMs,
    enabled: config.cache?.enabled !== false,
  });
  const discoveryFetch = createCachingFetch(cache, fetchImpl);
  const robots = await loadRobots(origin, {
    headers: config.auth?.headers ?? {},
    fetchImpl: discoveryFetch,
    logger,
  });
  const rules = rulesFor(robots.robots, config.userAgent);
  const startPath = canonicalRoutePath(start.pathname, start.search);

  if (!config.routes.ignoreRobots && !isAllowed(startPath, rules)) {
    return {
      status: "blocked",
      reason: `robots.txt disallows ${startPath}`,
      origin,
      routes: [],
      warnings,
      robots: { url: robots.url, status: robots.status },
      counts: { sitemap: 0, crawl: 0 },
    };
  }

  if (robots.status === 403 || robots.status === 429 || robots.status === 503) {
    warnings.push(`robots.txt returned HTTP ${robots.status}`);
  }

  // A route list for an unreachable or forbidden start URL is a lie. Probe the
  // entry point uncached and report an environment failure before discovery.
  const probe = await probeStart(start.href, {
    headers: config.auth?.headers ?? {},
    fetchImpl,
    timeoutMs: Math.min(8000, config.capture?.timeoutMs ?? 8000),
  });
  if (typeof probe.status !== "number" || probe.status >= 400) {
    const status =
      typeof probe.status !== "number"
        ? probe.status
        : probe.status === 401
          ? "unauthorized"
          : probe.status === 403
            ? "forbidden"
            : probe.status === 429
              ? "rate-limited"
              : "http-error";
    return {
      status,
      reason:
        typeof probe.status === "number"
          ? `start URL returned HTTP ${probe.status}`
          : `start URL unreachable: ${probe.reason}`,
      origin,
      routes: [],
      warnings,
      robots: { url: robots.url, status: robots.status },
      counts: { sitemap: 0, crawl: 0 },
    };
  }

  const sitemap = await collectSitemapUrls(origin, robots, config, { fetchImpl: discoveryFetch, logger });
  warnings.push(...sitemap.warnings);
  const crawled = await crawlLinks({ startUrl: start.href, origin, config, browser, robots, logger });
  warnings.push(...crawled.warnings);

  const cacheStats = cache.stats();
  if (cache.enabled && cacheStats.hits) logger?.debug("discovery cache", cacheStats);

  const candidates = [];
  const push = (href, depth, source) => {
    let canonical;
    try {
      canonical = canonicalizeUrl(href);
    } catch {
      return;
    }
    if (canonical.origin !== origin) return;
    if (!/^https?:$/.test(canonical.protocol)) return;
    if (isAssetUrl(canonical.href)) return;
    const routePath = canonicalRoutePath(canonical.pathname, canonical.search);
    if (!config.routes.ignoreRobots && !isAllowed(routePath, rules)) return;
    if (config.routes.include.length && !matchesAny(config.routes.include, routePath)) return;
    if (config.routes.exclude.length && matchesAny(config.routes.exclude, routePath)) return;
    candidates.push({ path: routePath, url: canonical.href, depth, source });
  };

  push(start.href, 0, "start");
  for (const page of crawled.pages) push(page.url, page.depth, "crawl");
  for (const href of sitemap.urls) push(href, 0, "sitemap");

  const deduped = uniqueBy(
    candidates.sort((a, b) => a.depth - b.depth || a.path.localeCompare(b.path)),
    (route) => route.path,
  );

  const limited = deduped.slice(0, config.routes.maxPages);
  if (deduped.length > limited.length) {
    warnings.push(`route cap reached: kept ${limited.length} of ${deduped.length} discovered routes`);
  }

  const usedIds = new Set();
  const routes = limited.map((route) => {
    let id = routeSlug(route.path);
    let suffix = 2;
    while (usedIds.has(id)) id = `${routeSlug(route.path)}-${suffix++}`;
    usedIds.add(id);
    return { id, ...route };
  });

  return {
    status: routes.length ? "ok" : "empty",
    reason: routes.length ? null : "no routes matched the include/exclude filters",
    origin,
    routes,
    warnings,
    robots: { url: robots.url, status: robots.status },
    counts: {
      sitemap: sitemap.urls.length,
      crawl: crawled.pages.length,
    },
  };
}

export { sameOrigin };
