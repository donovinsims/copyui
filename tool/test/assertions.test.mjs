import test from "node:test";
import assert from "node:assert/strict";
import {
  coverageFor,
  evaluateAssertions,
  gateResult,
  resolveValue,
  summarizeChecks,
} from "../core/assertions.mjs";

const reference = {
  slots: { title: { font: { size: 32 }, rect: { x: 10, width: 200 } }, card: { background: "#fff" } },
  derived: { cards: { count: 3 }, sections: { titles: ["A", "B"] } },
  capture: { fullPage: true, coversDocument: true },
  page: { documentHeight: 1200 },
};
const local = {
  slots: { title: { font: { size: 32.005 }, rect: { x: 10.6, width: 200 } }, card: { background: "#fff" } },
  derived: { cards: { count: 3 }, sections: { titles: ["A", "B"] } },
  capture: { fullPage: true, coversDocument: true },
  page: { documentHeight: 1204 },
};

test("expressions resolve from slots, derived, capture and constants", () => {
  const scope = { reference, local };
  assert.equal(resolveValue("ref:title.font.size", scope), 32);
  assert.equal(resolveValue("loc:title.font.size", scope), 32.005);
  assert.equal(resolveValue("ref:cards.count", scope), 3);
  assert.equal(resolveValue("ref:sections.titles", scope), reference.derived.sections.titles);
  assert.equal(resolveValue("const:86.58", scope), 86.58);
  assert.equal(resolveValue("14px 16px", scope), "14px 16px");
  assert.equal(resolveValue("ref:documentHeight", scope), 1200);
});

test("near, exact and same assertions behave like the legacy check kinds", () => {
  const checks = evaluateAssertions(
    [
      { name: "near.pass", a: "ref:title.font.size", b: "loc:title.font.size", tolerance: 0.01 },
      { name: "near.fail", a: "ref:title.font.size", b: "loc:title.font.size", tolerance: 0 },
      { name: "exact.pass", a: "ref:card.background", b: "loc:card.background", mode: "exact" },
      { name: "same.pass", a: "ref:sections.titles", b: "loc:sections.titles", mode: "same" },
      { name: "missing", a: "ref:does.not.exist", b: "loc:does.not.exist", tolerance: 1 },
    ],
    { reference, local },
  );
  assert.equal(checks[0].pass, true);
  assert.equal(checks[1].pass, false);
  assert.equal(checks[1].delta, 0.005);
  assert.equal(checks[2].pass, true);
  assert.equal(checks[3].pass, true);
  assert.equal(checks[4].pass, false);
  assert.equal(checks[4].note, "missing value");
});

test("conditional assertions are skipped unless the condition holds", () => {
  const spec = {
    name: "panel.borderColor",
    a: "ref:panel.border.color",
    b: "loc:panel.border.color",
    mode: "exact",
    when: { path: "ref:panel.border.width", gt: 0 },
  };
  assert.equal(evaluateAssertions([spec], { reference: { slots: { panel: { border: { width: 0 } } } }, local: {} }).length, 0);
  assert.equal(evaluateAssertions([spec], { reference: { slots: { panel: { border: { width: 1 } } } }, local: {} }).length, 1);
});

test("coverage accounts for missing slots, matching and assertion ratio", () => {
  const checks = evaluateAssertions(
    [
      { name: "title", a: "ref:title.font.size", b: "loc:title.font.size", tolerance: 0.01 },
      { name: "missing", a: "ref:nope", b: "loc:nope", tolerance: 0 },
    ],
    { reference, local },
  );
  const coverage = coverageFor({
    reference,
    local,
    required: ["title", "card", "missingSlot"],
    matching: { stats: { coverage: 0.95 } },
    checks,
  });
  assert.equal(coverage.slots.present, 2);
  assert.equal(coverage.slots.ratio, 0.667);
  assert.equal(coverage.assertions.passed, 1);
  assert.equal(coverage.assertions.total, 2);
  assert.equal(coverage.ratio, 0.667);

  const gate = gateResult({ checks, coverage, gates: { assertions: 1, coverage: 0.9 } });
  assert.equal(gate.pass, false);
  assert.equal(gate.assertions.pass, false);
  assert.equal(gate.coverage.pass, false);
});

test("summaries list each failure", () => {
  const summary = summarizeChecks([
    { name: "a", pass: true },
    { name: "b", pass: false, reference: 1, local: 2, delta: 1 },
  ]);
  assert.equal(summary.total, 2);
  assert.equal(summary.failed, 1);
  assert.equal(summary.failures[0].name, "b");
});
