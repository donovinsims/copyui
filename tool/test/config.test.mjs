import test from "node:test";
import assert from "node:assert/strict";
import {
  ConfigError,
  configHash,
  deepMerge,
  normalizeConfig,
  normalizeThemes,
  normalizeViewports,
  redactConfig,
  stableStringify,
} from "../config.mjs";

test("viewports accept objects and WxH strings", () => {
  assert.deepEqual(normalizeViewports("390x844, 1440x900"), [
    { id: "390x844", width: 390, height: 844 },
    { id: "1440x900", width: 1440, height: 900 },
  ]);
  assert.deepEqual(normalizeViewports([{ width: 800, height: 600 }]), [
    { id: "800x600", width: 800, height: 600 },
  ]);
  assert.throws(() => normalizeViewports("wide"), ConfigError);
});

test("themes are validated", () => {
  assert.deepEqual(normalizeThemes("light,dark,light"), ["light", "dark"]);
  assert.throws(() => normalizeThemes("sepia"), ConfigError);
});

test("normalisation fills defaults and validates targets", () => {
  const config = normalizeConfig({ target: "https://example.com" });
  assert.equal(config.target, "https://example.com/");
  assert.deepEqual(config.themes, ["light"]);
  assert.equal(config.routes.maxPages, 25);
  assert.equal(config.capture.retries, 2);
  assert.throws(() => normalizeConfig({ target: "ftp://example.com" }), ConfigError);
  assert.throws(() => normalizeConfig({ target: "https://example.com", routes: { maxPages: 0 } }), ConfigError);
});

test("deepMerge replaces arrays and merges objects", () => {
  const merged = deepMerge({ a: { b: 1, c: [1, 2] }, d: 1 }, { a: { c: [3] }, e: 2 });
  assert.deepEqual(merged, { a: { b: 1, c: [3] }, d: 1, e: 2 });
});

test("config hash is stable across key order and changes with behaviour", () => {
  const one = normalizeConfig({ target: "https://example.com", viewports: ["390x844"] });
  const two = normalizeConfig({ viewports: ["390x844"], target: "https://example.com" });
  assert.equal(configHash(one), configHash(two));
  const three = normalizeConfig({ target: "https://example.com", viewports: ["1440x900"] });
  assert.notEqual(configHash(one), configHash(three));
  assert.equal(stableStringify({ b: 2, a: 1 }), stableStringify({ a: 1, b: 2 }));
});

test("redacted config never exposes header values", () => {
  const config = normalizeConfig({
    target: "https://example.com",
    auth: { headers: { authorization: "Bearer secret-value" }, storageState: "/tmp/state.json" },
  });
  const redacted = redactConfig(config);
  assert.equal(redacted.auth.headers.authorization, "<redacted>");
  assert.equal(redacted.auth.storageState, "state.json");
  assert.equal(JSON.stringify(redacted).includes("secret-value"), false);
});
