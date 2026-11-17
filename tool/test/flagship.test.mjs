import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import config, { COMPONENTS_ASSERTIONS, DETAIL_ASSERTIONS } from "../../examples/affectui/compare.config.mjs";
import { assertionCount } from "../core/assertions.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("the flagship port keeps the legacy assertion inventory", () => {
  assert.equal(DETAIL_ASSERTIONS.length, 135);
  assert.equal(COMPONENTS_ASSERTIONS.length, 31);

  const withBorder = assertionCount(COMPONENTS_ASSERTIONS, {
    reference: { panel: { border: { width: 1 } } },
    local: {},
  });
  const withoutBorder = assertionCount(COMPONENTS_ASSERTIONS, {
    reference: { panel: { border: { width: 0 } } },
    local: {},
  });
  assert.equal(withBorder, 31);
  assert.equal(withoutBorder, 30);
});

test("the full matrix is exactly 1000 frame checks", () => {
  const detail = config.surfaces.find((surface) => surface.id === "detail-chat-composer");
  const components = config.surfaces.find((surface) => surface.id === "components");
  const themes = config.themes.length;
  const detailCaptures = 3 * themes; // three viewports
  const detailChecks = DETAIL_ASSERTIONS.length + 1; // + content.uniqueBodies
  const desktopIndexCaptures = 2 * themes; // 1440 + 1024 have a panel border
  const mobileIndexCaptures = 1 * themes; // 390 has no border, so 30 checks

  const total =
    detailChecks * detailCaptures +
    31 * desktopIndexCaptures +
    30 * mobileIndexCaptures;

  // 6 detail captures × 136, plus 4 desktop × 31 and 2 mobile × 30 index captures.
  assert.equal(total, 816 + 124 + 60);
  assert.equal(total, 1000);
  assert.equal(detail.assertions.length, 135);
  assert.equal(components.assertions.length, 31);
});

test("no affectui selector, URL or constant leaks into the engine", async () => {
  const files = [];
  const walk = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith(".mjs")) files.push(full);
    }
  };
  await walk(path.join(ROOT, "tool", "core"));
  files.push(path.join(ROOT, "tool", "cli.mjs"), path.join(ROOT, "tool", "config.mjs"));

  for (const file of files) {
    const text = await readFile(file, "utf8");
    assert.equal(/affectui/i.test(text), false, `${path.relative(ROOT, file)} mentions affectui`);
  }
});

test("every surface declares slots, requirements and assertions where it gates", () => {
  for (const surface of config.surfaces) {
    assert.ok(surface.slots.reference && surface.slots.local, `${surface.id} has both slot maps`);
    if (surface.checks) {
      assert.ok(surface.assertions.length > 0, `${surface.id} has assertions`);
      assert.ok(surface.require.reference.length > 0, `${surface.id} has required reference slots`);
      assert.ok(surface.require.local.length > 0, `${surface.id} has required local slots`);
    }
  }
});
