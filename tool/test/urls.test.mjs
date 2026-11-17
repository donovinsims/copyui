import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalRoutePath,
  canonicalizeUrl,
  filterRoutePaths,
  isAssetUrl,
  matchesRoute,
  routeSlug,
  slugForUrl,
} from "../core/urls.mjs";

test("canonical route paths drop tracking, trailing slashes and unstable query order", () => {
  assert.equal(canonicalRoutePath("/components/"), "/components");
  assert.equal(canonicalRoutePath("/"), "/");
  assert.equal(canonicalRoutePath("//docs//page//"), "/docs/page");
  assert.equal(canonicalRoutePath("/search", "?utm_source=ad&q=one&b=2&a=1"), "/search?a=1&b=2&q=one");
  assert.equal(canonicalRoutePath("/a", "?fbclid=abc"), "/a");
  assert.equal(canonicalizeUrl("https://example.com/x/?utm_campaign=z#hash").href, "https://example.com/x/");
});

test("route slugs are stable, readable and bounded", () => {
  assert.equal(routeSlug("/"), "__home__");
  assert.equal(routeSlug("/components/chat-composer"), "components-chat-composer");
  assert.equal(routeSlug("/a b/c?x=1"), "a-b-c-x-1");
  assert.ok(routeSlug(`/${"x".repeat(200)}`).length <= 96);
  assert.equal(slugForUrl("https://www.example.com/"), "example.com");
  assert.equal(slugForUrl("https://www.example.com/docs/start"), "example.com-docs-start");
});

test("glob route filters support segments, globstars and choices", () => {
  assert.equal(matchesRoute("/**", "/"), true);
  assert.equal(matchesRoute("/**", "/a/b"), true);
  assert.equal(matchesRoute("/docs/**", "/docs"), true);
  assert.equal(matchesRoute("/docs/*", "/docs/a"), true);
  assert.equal(matchesRoute("/docs/*", "/docs/a/b"), false);
  assert.equal(matchesRoute("/{a,b}/x", "/b/x"), true);
  assert.equal(matchesRoute("/legal/**", "/legal/terms"), true);
  assert.equal(matchesRoute("/legal/**", "/law/terms"), false);
});

test("filterRoutePaths applies include and exclude together", () => {
  const paths = ["/", "/docs", "/docs/intro", "/legal/terms", "/about"];
  assert.deepEqual(
    filterRoutePaths(paths, { include: ["/**"], exclude: ["/legal/**"] }),
    ["/", "/docs", "/docs/intro", "/about"],
  );
  assert.deepEqual(filterRoutePaths(paths, { include: ["/docs/**"], exclude: [] }), ["/docs", "/docs/intro"]);
  assert.deepEqual(filterRoutePaths(paths, { include: [], exclude: ["/legal/**"] }), paths.filter((p) => p !== "/legal/terms"));
});

test("asset URLs are recognised so crawls do not treat them as pages", () => {
  assert.equal(isAssetUrl("https://example.com/app.js"), true);
  assert.equal(isAssetUrl("https://example.com/font.woff2"), true);
  assert.equal(isAssetUrl("https://example.com/photo.webp"), true);
  assert.equal(isAssetUrl("https://example.com/docs"), false);
});
