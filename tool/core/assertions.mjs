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

/**
 * Inventory accounting for pages whose two sides deliberately hold different
 * amounts of the same content. The class tokens come from configuration; the
 * tool only counts them and attributes unpaired reference nodes to the empty
 * shells that hold them.
 */
export function inventoryFor({ reference, local, matching, spec }) {
  if (!spec) return null;
  const refNodes = reference?.nodes ?? [];
  const locNodes = local?.nodes ?? [];
  const pairs = matching?.pairs ?? [];
  const matchedReference = new Set(pairs.map((pair) => pair.reference));
  const matchedLocal = new Set(pairs.map((pair) => pair.local));
  const significant = (node) => Boolean(node?.visible) && (node?.rect?.width ?? 0) * (node?.rect?.height ?? 0) > 4;
  const tokens = (node) => new Set(String(node?.classes ?? "").split(/\s+/).filter(Boolean));
  const has = (node, token) => Boolean(token) && tokens(node).has(token);
  const indices = (nodes) => nodes.map((node, index) => index);
  const pairToLocal = new Map(pairs.map((pair) => [pair.reference, pair.local]));
  const pairToReference = new Map(pairs.map((pair) => [pair.local, pair.reference]));

  // Locate the paired repeated group first, so the card counts describe that
  // grid rather than every card on the page. Without a paired group the first
  // matching container still gives the real inventory numbers.
  const groupOf = (nodes, token, minimum) =>
    indices(nodes)
      .filter((index) => has(nodes[index], token) && (nodes[index].children?.length ?? 0) >= minimum)
      .sort((a, b) => nodes[b].children.length - nodes[a].children.length)[0];

  let refGroup = indices(refNodes).find(
    (index) => has(refNodes[index], spec.referenceGroup) && pairToLocal.has(index) && has(locNodes[pairToLocal.get(index)], spec.localGroup),
  );
  let locGroup = refGroup !== undefined ? pairToLocal.get(refGroup) : undefined;
  if (refGroup === undefined) refGroup = groupOf(refNodes, spec.referenceGroup, 6);
  if (locGroup === undefined) locGroup = groupOf(locNodes, spec.localGroup, 6);

  const cardChildren = (nodes, group, token) =>
    group === undefined ? [] : (nodes[group].children ?? []).filter((index) => has(nodes[index], token));
  const refCards = cardChildren(refNodes, refGroup, spec.referenceCards);
  const locCards = cardChildren(locNodes, locGroup, spec.localCards);

  const unpaired = indices(refNodes).filter((index) => significant(refNodes[index]) && !matchedReference.has(index));

  const shellNodes = new Set();
  const walk = (index) => {
    if (shellNodes.has(index)) return;
    shellNodes.add(index);
    for (const child of refNodes[index].children ?? []) walk(child);
  };
  for (const index of indices(refNodes)) {
    if (significant(refNodes[index]) && has(refNodes[index], spec.emptyShell)) walk(index);
  }

  return {
    referenceCards: refCards.length,
    localCards: locCards.length,
    pairedCards: pairs.filter((pair) => refCards.includes(pair.reference) && locCards.includes(pair.local)).length,
    pairedReferenceCards: refCards.filter((index) => matchedReference.has(index)).length,
    pairedLocalCards: locCards.filter((index) => matchedLocal.has(index)).length,
    unpairedReferenceNodes: unpaired.length,
    unpairedReferenceCardNodes: unpaired.filter((index) => refCards.includes(index)).length,
    emptyShells: {
      count: indices(refNodes).filter((index) => significant(refNodes[index]) && has(refNodes[index], spec.emptyShell)).length,
      unpairedNodes: unpaired.filter((index) => shellNodes.has(index)).length,
    },
  };
}

export function coverageFor({ reference, local, required = [], matching = null, checks = [], inventory = null }) {
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
    inventory: inventory ?? null,
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
