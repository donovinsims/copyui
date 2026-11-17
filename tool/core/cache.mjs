import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * A small on-disk cache for discovery traffic (robots.txt and sitemaps). It is
 * deliberately separate from captures: page state must be fresh, but the rules
 * and route index change rarely and refetching them on every run is rude.
 */
export function cacheKey(url, headers = {}) {
  const sorted = Object.keys(headers ?? {})
    .sort()
    .map((name) => `${name.toLowerCase()}:${headers[name]}`)
    .join("\n");
  return createHash("sha256").update(`${url}\n${sorted}`).digest("hex").slice(0, 32);
}

export function createCache({ dir, ttlMs = 15 * 60 * 1000, enabled = true, now = Date.now } = {}) {
  const active = Boolean(enabled) && Boolean(dir);
  let hits = 0;
  let misses = 0;

  const fileFor = (key) => path.join(dir, `${key}.json`);

  return {
    enabled: active,
    async get(key) {
      if (!active) return null;
      try {
        const record = JSON.parse(await readFile(fileFor(key), "utf8"));
        if (!record || typeof record.storedAt !== "number" || now() - record.storedAt > ttlMs) {
          misses += 1;
          return null;
        }
        hits += 1;
        return record;
      } catch {
        misses += 1;
        return null;
      }
    },
    async set(key, value) {
      if (!active) return;
      await mkdir(dir, { recursive: true });
      await writeFile(fileFor(key), `${JSON.stringify({ ...value, storedAt: now() })}\n`);
    },
    stats() {
      return { hits, misses };
    },
  };
}

/**
 * Wrap a fetch implementation so repeated discovery requests are served from
 * the cache. Non-2xx responses are cached too: a 404 sitemap is an answer.
 */
export function createCachingFetch(cache, fetchImpl = fetch) {
  if (!cache?.enabled) return fetchImpl;
  return async (url, init = {}) => {
    const key = cacheKey(String(url), init.headers ?? {});
    const hit = await cache.get(key);
    if (hit) {
      return new Response(hit.body ?? "", {
        status: hit.status ?? 200,
        headers: hit.headers ?? {},
      });
    }
    const response = await fetchImpl(url, init);
    const body = await response.clone().text();
    await cache.set(key, {
      status: response.status,
      body,
      headers: Object.fromEntries(response.headers),
    });
    return response;
  };
}
