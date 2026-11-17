function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function resolvePath(root, pathname) {
  if (!pathname) return root;
  return String(pathname)
    .split(".")
    .reduce((current, key) => {
      if (current === null || current === undefined) return undefined;
      return current[/^\d+$/.test(key) ? Number(key) : key];
    }, root);
}

/**
 * Resolve a model path against the places a page model exposes values:
 * page metadata, capture metadata, derived collections, then slots. A bare
 * `panel.rect.x` therefore works without knowing which bag it lives in.
 */
export function resolveModelPath(model, pathname) {
  if (!model) return undefined;
  const [root, ...rest] = String(pathname).split(".");
  const tail = rest.join(".");
  const candidates = [model[root], model.page?.[root], model.derived?.[root], model.slots?.[root]];
  for (const candidate of candidates) {
    if (candidate === undefined) continue;
    const value = tail ? resolvePath(candidate, tail) : candidate;
    if (value !== undefined) return value;
  }
  return resolvePath(model, pathname);
}

export function resolveValue(expression, { reference, local }) {
  if (expression === null || expression === undefined) return expression;
  if (typeof expression === "number" || typeof expression === "boolean") return expression;
  if (Array.isArray(expression)) return expression;
  if (typeof expression !== "string") return expression;
  const match = /^(ref|loc|const):(.*)$/s.exec(expression);
  if (!match) return expression;
  const [, kind, rest] = match;
  if (kind === "const") {
    try {
      return JSON.parse(rest);
    } catch {
      return rest;
    }
  }
  return resolveModelPath(kind === "ref" ? reference : local, rest);
}

function testWhen(when, scope) {
  if (!when) return true;
  if (when.all) return when.all.every((entry) => testWhen(entry, scope));
  if (when.any) return when.any.some((entry) => testWhen(entry, scope));
  if (!when.path) return true;
  const value = resolveValue(when.path, scope);
  if ("exists" in when) return when.exists ? value !== undefined && value !== null : value === undefined || value === null;
  if ("equals" in when) return value === when.equals;
  if ("notEquals" in when) return value !== when.notEquals;
  if ("gt" in when) return Number(value) > when.gt;
  if ("gte" in when) return Number(value) >= when.gte;
  if ("lt" in when) return Number(value) < when.lt;
  if ("lte" in when) return Number(value) <= when.lte;
  return true;
}

function normalizeValue(value) {
  return value === undefined ? null : value;
}

function checkPass(spec, a, b) {
  const mode = spec.mode ?? (spec.tolerance !== undefined ? "near" : "exact");
  if (mode === "same") {
    return {
      pass: JSON.stringify(normalizeValue(a)) === JSON.stringify(normalizeValue(b)),
      delta: null,
    };
  }
  if (mode === "exact") {
    return { pass: normalizeValue(a) === normalizeValue(b), delta: null };
  }
  const left = Number(a);
  const right = Number(b);
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return { pass: false, delta: null, note: "missing value" };
  }
  const delta = Math.abs(left - right);
  return { pass: delta <= (spec.tolerance ?? 0), delta: Math.round(delta * 1000) / 1000 };
}

export function evaluateAssertions(specs, scope) {
  const checks = [];
  for (const spec of specs ?? []) {
    if (!testWhen(spec.when, scope)) continue;
    const a = resolveValue(spec.a, scope);
    const b = resolveValue(spec.b, scope);
    const result = checkPass(spec, a, b);
    const check = {
      name: spec.name,
      reference: normalizeValue(a),
      local: normalizeValue(b),
      unit: spec.unit ?? (spec.mode === "exact" || spec.mode === "same" ? "" : "px"),
      delta: result.delta ?? null,
      pass: result.pass,
    };
    if (result.note) check.note = result.note;
    checks.push(check);
  }
  return checks;
}

export function assertionCount(specs, scope) {
  const checks = evaluateAssertions(specs, scope);
  return checks.length;
}

export function coverageFor({ reference, local, required = [], matching = null, checks = [] }) {
  const slotRows = required.map((name) => ({
    name,
    reference: Boolean(reference?.slots?.[name]),
    local: Boolean(local?.slots?.[name]),
  }));
  const present = slotRows.filter((row) => row.reference && row.local).length;
  const slotRatio = required.length ? present / required.length : 1;
  const total = checks.length;
  const passed = checks.filter((check) => check.pass).length;
  const assertionRatio = total ? passed / total : 1;
  const matchCoverage = matching?.stats?.coverage ?? 1;
  const ratio = Math.round(Math.min(slotRatio, matchCoverage) * 1000) / 1000;

  return {
    ratio,
    slots: {
      required: required.length,
      present,
      ratio: Math.round(slotRatio * 1000) / 1000,
      missing: slotRows.filter((row) => !row.reference || !row.local),
    },
    matching: matching?.stats ?? null,
    assertions: {
      total,
      passed,
      failed: total - passed,
      ratio: Math.round(assertionRatio * 1000) / 1000,
    },
  };
}

export function summarizeChecks(checks) {
  const failed = checks.filter((check) => !check.pass);
  return {
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    failures: failed.map((check) => ({
      name: check.name,
      reference: check.reference,
      local: check.local,
      delta: check.delta,
      note: check.note,
    })),
  };
}

export function gateResult({ checks = [], coverage = null, gates = {} }) {
  const summary = summarizeChecks(checks);
  const assertionThreshold = gates.assertions ?? 0.95;
  const coverageThreshold = gates.coverage ?? 0.9;
  const assertionRatio = summary.total ? summary.passed / summary.total : 1;
  return {
    assertions: {
      threshold: assertionThreshold,
      ratio: Math.round(assertionRatio * 1000) / 1000,
      pass: assertionRatio >= assertionThreshold,
    },
    coverage: {
      threshold: coverageThreshold,
      ratio: coverage?.ratio ?? 1,
      pass: (coverage?.ratio ?? 1) >= coverageThreshold,
    },
    pass: assertionRatio >= assertionThreshold && (coverage?.ratio ?? 1) >= coverageThreshold,
  };
}

export { isPlainObject, testWhen };
