import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { cacheKey, createCache, createCachingFetch } from "../core/cache.mjs";

async function tempDir(t) {
  const dir = await mkdtemp(path.join(tmpdir(), "copyui-cache-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test("cache keys are stable across header order and sensitive to values", () => {
  assert.equal(cacheKey("https://x.test/y", { B: "2", a: "1" }), cacheKey("https://x.test/y", { a: "1", B: "2" }));
  assert.notEqual(cacheKey("https://x.test/y", { a: "1" }), cacheKey("https://x.test/y", { a: "2" }));
});

test("the cache stores, serves and expires responses", async (t) => {
  const dir = await tempDir(t);
  let clock = 1000;
  const cache = createCache({ dir, ttlMs: 100, now: () => clock });

  assert.equal(await cache.get("k"), null);
  await cache.set("k", { status: 200, body: "hi", headers: { "content-type": "text/plain" } });
  const hit = await cache.get("k");
  assert.equal(hit.body, "hi");
  assert.equal(cache.stats().hits, 1);
  assert.equal(cache.stats().misses, 1);

  clock += 101;
  assert.equal(await cache.get("k"), null);
});

test("caching fetch serves the stored body without a second network call", async (t) => {
  const dir = await tempDir(t);
  let calls = 0;
  const fake = async () => {
    calls += 1;
    return new Response("User-agent: *\nAllow: /\n", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  };
  const cache = createCache({ dir, ttlMs: 60_000 });
  const cachedFetch = createCachingFetch(cache, fake);

  const first = await cachedFetch("https://example.test/robots.txt");
  assert.equal(first.status, 200);
  assert.match(await first.text(), /User-agent/);

  const second = await cachedFetch("https://example.test/robots.txt");
  assert.equal(second.status, 200);
  assert.match(await second.text(), /User-agent/);
  assert.equal(calls, 1);
  assert.equal(cache.stats().hits, 1);
});

test("a disabled cache neither reads nor writes", async () => {
  const cache = createCache({ dir: "/nonexistent", enabled: false });
  await cache.set("k", { body: "x" });
  assert.equal(await cache.get("k"), null);
  assert.equal(createCachingFetch(cache, async () => new Response("x")) instanceof Function, true);
});
