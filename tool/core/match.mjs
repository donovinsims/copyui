const LANDMARK_TAGS = new Set(["header", "nav", "main", "aside", "footer", "h1", "h2", "h3"]);
const MAX_ALIGN_CHILDREN = 120;
const MAX_DEPTH = 80;

function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function tokens(value) {
  return new Set(normalizeName(value).split(/[^a-z0-9]+/).filter((token) => token.length > 1));
}

function tokenSimilarity(a, b) {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return (2 * shared) / (left.size + right.size);
}

function classJaccard(a, b) {
  const left = new Set(String(a ?? "").split(/\s+/).filter(Boolean));
  const right = new Set(String(b ?? "").split(/\s+/).filter(Boolean));
  if (!left.size && !right.size) return 1;
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / (left.size + right.size - shared);
}

function geometrySimilarity(a, b) {
  const left = a?.rect ?? {};
  const right = b?.rect ?? {};
  const maxArea = Math.max(left.width * left.height, right.width * right.height, 1);
  const minArea = Math.min(left.width * left.height, right.width * right.height);
  const areaScore = minArea / maxArea;
  const aspect = (rect) => (rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 1);
  const aspectScore = 1 - Math.min(1, Math.abs(aspect(left) - aspect(right)) / Math.max(aspect(left), aspect(right), 1));
  return 0.6 * areaScore + 0.4 * aspectScore;
}

/**
 * Similarity of two nodes in [0, 1]. Content, role and structure dominate;
 * geometry only breaks ties, because the whole point is to find the same
 * element even when its box has drifted.
 */
export function nodeSimilarity(a, b) {
  if (!a || !b) return 0;
  let score = 0;
  if (a.tag === b.tag) score += 0.27;
  else if (a.role && a.role === b.role) score += 0.06;
  if (a.role && a.role === b.role) score += 0.2;
  if (a.name && b.name) {
    if (normalizeName(a.name) === normalizeName(b.name)) score += 0.23;
    else score += 0.23 * tokenSimilarity(a.name, b.name);
  }
  score += 0.12 * classJaccard(a.classes, b.classes);
  const childDelta = Math.abs((a.children?.length ?? 0) - (b.children?.length ?? 0));
  score += 0.08 * (1 - Math.min(1, childDelta / 4));
  score += 0.1 * geometrySimilarity(a, b);
  return Math.max(0, Math.min(1, score));
}

function isSignificant(node) {
  return Boolean(node?.visible) && (node.rect?.width ?? 0) * (node.rect?.height ?? 0) > 4;
}

function landmarkScore(a, b) {
  if (!LANDMARK_TAGS.has(a.tag) && !LANDMARK_TAGS.has(a.role)) return 0;
  if (a.tag !== b.tag) return 0;
  const left = normalizeName(a.name);
  const right = normalizeName(b.name);
  if (left && right) return left === right ? 1 : tokenSimilarity(left, right) * 0.6;
  return 0.4;
}

/**
 * Needleman-Wunsch alignment over two child lists. Matching a low-similarity
 * pair costs more than leaving both unmatched, which keeps unrelated siblings
 * from being paired just because they are adjacent.
 */
export function alignSequences(left, right, scoreFn) {
  const n = Math.min(left.length, MAX_ALIGN_CHILDREN);
  const m = Math.min(right.length, MAX_ALIGN_CHILDREN);
  const gap = -0.32;
  const scores = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  const moves = Array.from({ length: n + 1 }, () => new Array(m + 1).fill("none"));

  for (let i = 1; i <= n; i += 1) {
    scores[i][0] = scores[i - 1][0] + gap;
    moves[i][0] = "up";
  }
  for (let j = 1; j <= m; j += 1) {
    scores[0][j] = scores[0][j - 1] + gap;
    moves[0][j] = "left";
  }

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const similarity = scoreFn(left[i - 1], right[j - 1]);
      const match = similarity >= 0.28 ? similarity - 0.12 : -1;
      const diagonal = scores[i - 1][j - 1] + match;
      const up = scores[i - 1][j] + gap;
      const leftMove = scores[i][j - 1] + gap;
      if (diagonal >= up && diagonal >= leftMove) {
        scores[i][j] = diagonal;
        moves[i][j] = "diagonal";
      } else if (up >= leftMove) {
        scores[i][j] = up;
        moves[i][j] = "up";
      } else {
        scores[i][j] = leftMove;
        moves[i][j] = "left";
      }
    }
  }

  const pairs = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const move = moves[i][j];
    if (move === "diagonal") {
      pairs.push({ left: left[i - 1], right: right[j - 1] });
      i -= 1;
      j -= 1;
    } else if (move === "up") {
      i -= 1;
    } else if (move === "left") {
      j -= 1;
    } else {
      break;
    }
  }
  return pairs.reverse();
}

function signature(node) {
  return `${node.tag}|${node.classes}|${node.role ?? ""}`;
}

/**
 * The short chain of single-element wrappers under a node. Sites routinely add
 * a presentational div (`div.main-col > main.panel`) that the recreation does
 * not have; matching through it prevents one wrapper from stranding a subtree.
 */
function soleChildChain(index, nodes, maxDepth = 2) {
  const chain = [];
  let cursor = index;
  for (let step = 0; step < maxDepth; step += 1) {
    const children = nodes[cursor]?.children ?? [];
    if (children.length !== 1) break;
    const child = children[0];
    if (!nodes[child]) break;
    chain.push(child);
    cursor = child;
  }
  return chain;
}

function pathOf(model, index) {
  const parts = [];
  let cursor = index;
  let guard = 0;
  while (cursor >= 0 && guard < 40) {
    const node = model.nodes[cursor];
    if (!node) break;
    const position = node.parent >= 0 ? model.nodes[node.parent]?.children?.indexOf(cursor) ?? 0 : 0;
    parts.unshift(`${node.tag}${position ? `:nth(${position})` : ""}`);
    cursor = node.parent;
    guard += 1;
  }
  return parts.join(" > ");
}

export function matchPages(reference, local, { minConfidence = 0.5 } = {}) {
  const refNodes = reference?.nodes ?? [];
  const locNodes = local?.nodes ?? [];
  const matchedRef = new Map();
  const matchedLocal = new Map();
  const pairs = [];

  const addPair = (refIndex, locIndex, confidence) => {
    if (refIndex < 0 || locIndex < 0) return false;
    if (matchedRef.has(refIndex) || matchedLocal.has(locIndex)) return false;
    const pair = {
      reference: refIndex,
      local: locIndex,
      confidence: Math.round(confidence * 1000) / 1000,
      tag: refNodes[refIndex]?.tag ?? null,
      name: refNodes[refIndex]?.name ?? null,
    };
    matchedRef.set(refIndex, pair);
    matchedLocal.set(locIndex, pair);
    pairs.push(pair);
    return true;
  };

  const alignChildren = (refParent, locParent, depth) => {
    if (depth > MAX_DEPTH) return;
    const refKids = (refNodes[refParent]?.children ?? []).filter((index) => !matchedRef.has(index));
    const locKids = (locNodes[locParent]?.children ?? []).filter((index) => !matchedLocal.has(index));
    if (!refKids.length || !locKids.length) return;

    // 1. Landmarks anchor the tree before anything else.
    const refLandmarks = refKids.filter((index) => LANDMARK_TAGS.has(refNodes[index].tag) || LANDMARK_TAGS.has(refNodes[index].role));
    const locLandmarks = locKids.filter((index) => LANDMARK_TAGS.has(locNodes[index].tag) || LANDMARK_TAGS.has(locNodes[index].role));
    for (const refIndex of refLandmarks) {
      let best = null;
      for (const locIndex of locLandmarks) {
        if (matchedLocal.has(locIndex)) continue;
        const score = landmarkScore(refNodes[refIndex], locNodes[locIndex]);
        if (score < 0.35) continue;
        if (!best || score > best.score) best = { locIndex, score };
      }
      if (best && addPair(refIndex, best.locIndex, Math.min(0.98, 0.55 + best.score * 0.4))) {
        alignChildren(refIndex, best.locIndex, depth + 1);
      }
    }

    // 2. Wrapper transparency. Compare through a short single-child chain on
    // either side before sequence alignment can pair the wrapper with the real
    // element and leave the content beneath it unmatched.
    const wrapperRef = refKids.filter((index) => !matchedRef.has(index));
    const wrapperLocal = locKids.filter((index) => !matchedLocal.has(index));
    // A one-child wrapper opposite a candidate with several children is
    // structurally transparent: descend even when the boxes look alike, because
    // the candidate is the wrapper's content, not its peer. When both sides are
    // wrappers, or the wrapper has a plausible same-shape peer, leave it to the
    // sequence pass below.
    const descendChain = (index, model, candidates, matchedCandidates, otherModel) => {
      const chain = soleChildChain(index, model);
      if (!chain.length) return [];
      const open = candidates.filter((candidate) => !matchedCandidates.has(candidate));
      if (!open.length) return [];
      const anyMultiChild = open.some((candidate) => (otherModel[candidate]?.children?.length ?? 0) > 1);
      const anyPeer = open.some(
        (candidate) => nodeSimilarity(model[index], otherModel[candidate]) >= 0.34,
      );
      return anyMultiChild || !anyPeer ? chain : [];
    };
    for (const refIndex of wrapperRef) {
      if (matchedRef.has(refIndex)) continue;
      const chain = descendChain(refIndex, refNodes, wrapperLocal, matchedLocal, locNodes);
      if (!chain.length) continue;
      for (const refChild of chain) {
        if (matchedRef.has(refChild)) continue;
        let best = null;
        for (const locIndex of wrapperLocal) {
          if (matchedLocal.has(locIndex)) continue;
          const score = nodeSimilarity(refNodes[refChild], locNodes[locIndex]);
          if (score >= 0.45 && (!best || score > best.score)) best = { locIndex, score };
        }
        if (best && addPair(refChild, best.locIndex, Math.min(0.97, best.score))) {
          alignChildren(refChild, best.locIndex, depth + 1);
          break;
        }
      }
    }
    for (const locIndex of wrapperLocal) {
      if (matchedLocal.has(locIndex)) continue;
      const chain = descendChain(locIndex, locNodes, wrapperRef, matchedRef, refNodes);
      if (!chain.length) continue;
      for (const locChild of chain) {
        if (matchedLocal.has(locChild)) continue;
        let best = null;
        for (const refIndex of wrapperRef) {
          if (matchedRef.has(refIndex)) continue;
          const score = nodeSimilarity(refNodes[refIndex], locNodes[locChild]);
          if (score >= 0.45 && (!best || score > best.score)) best = { refIndex, score };
        }
        if (best && addPair(best.refIndex, locChild, Math.min(0.97, best.score))) {
          alignChildren(best.refIndex, locChild, depth + 1);
          break;
        }
      }
    }

    // 3. Sequence alignment for the rest.
    const remainingRef = refKids.filter((index) => !matchedRef.has(index));
    const remainingLocal = locKids.filter((index) => !matchedLocal.has(index));
    const aligned = alignSequences(remainingRef, remainingLocal, (a, b) =>
      nodeSimilarity(refNodes[a], locNodes[b]),
    );
    for (const { left, right } of aligned) {
      const score = nodeSimilarity(refNodes[left], locNodes[right]);
      if (score < 0.32) continue;
      if (addPair(left, right, score)) alignChildren(left, right, depth + 1);
    }

    // 3. Repeated groups (cards, list rows) pair in order even when content differs.
    const groups = (indices, model) => {
      const map = new Map();
      for (const index of indices) {
        if (model === refNodes ? matchedRef.has(index) : matchedLocal.has(index)) continue;
        const key = signature(model[index]);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(index);
      }
      return map;
    };
    const refGroups = groups(remainingRef, refNodes);
    const locGroups = groups(remainingLocal, locNodes);
    for (const [key, group] of refGroups) {
      const counterpart = locGroups.get(key);
      if (!counterpart || group.length < 2) continue;
      for (let index = 0; index < Math.min(group.length, counterpart.length); index += 1) {
        if (addPair(group[index], counterpart[index], 0.6)) {
          alignChildren(group[index], counterpart[index], depth + 1);
        }
      }
    }
  };

  const refHtml = refNodes.findIndex((node) => node.tag === "html");
  const locHtml = locNodes.findIndex((node) => node.tag === "html");
  const refBody = refNodes.findIndex((node) => node.tag === "body");
  const locBody = locNodes.findIndex((node) => node.tag === "body");
  // Pair the document root, not just body: html is a real node in the model and
  // leaving it unmatched would cap identical pages below full coverage.
  const refRoot = refHtml >= 0 ? refHtml : refBody >= 0 ? refBody : 0;
  const locRoot = locHtml >= 0 ? locHtml : locBody >= 0 ? locBody : 0;
  if (refNodes.length && locNodes.length && addPair(refRoot, locRoot, 1)) {
    alignChildren(refRoot, locRoot, 0);
  }

  // 4. Global fallback: mutual best matches for leftovers, by exact accessible
  // name and tag. This recovers portals and nodes whose parent structure moved.
  const unmatchedRef = refNodes
    .map((node, index) => index)
    .filter((index) => !matchedRef.has(index) && isSignificant(refNodes[index]));
  const unmatchedLocal = locNodes
    .map((node, index) => index)
    .filter((index) => !matchedLocal.has(index) && isSignificant(locNodes[index]));

  for (const refIndex of unmatchedRef.slice(0, 400)) {
    const refNode = refNodes[refIndex];
    if (!refNode.name) continue;
    let best = null;
    for (const locIndex of unmatchedLocal) {
      if (matchedLocal.has(locIndex)) continue;
      const locNode = locNodes[locIndex];
      if (locNode.tag !== refNode.tag) continue;
      if (normalizeName(locNode.name) !== normalizeName(refNode.name)) continue;
      const score = nodeSimilarity(refNode, locNode);
      if (!best || score > best.score) best = { locIndex, score };
    }
          if (best && best.score >= 0.5 && addPair(refIndex, best.locIndex, best.score)) {
        // A fallback match can still own a real subtree (portals, moved panels).
        alignChildren(refIndex, best.locIndex, 0);
      }
  }

  // 5. Content anchors. The same visible string identifies the same element
  // even when its parent chain diverged (a rebuilt article, a moved panel).
  // This is what keeps a page comparable when the shell is structurally
  // different, which is the normal case for a recreation.
  const localByName = new Map();
  for (let index = 0; index < locNodes.length; index += 1) {
    const node = locNodes[index];
    if (matchedLocal.has(index) || !isSignificant(node)) continue;
    const key = normalizeName(node.name);
    if (key.length < 4) continue;
    if (!localByName.has(key)) localByName.set(key, []);
    localByName.get(key).push(index);
  }
  for (const refIndex of unmatchedRef) {
    if (matchedRef.has(refIndex)) continue;
    const refNode = refNodes[refIndex];
    const key = normalizeName(refNode.name);
    if (key.length < 4) continue;
    let best = null;
    for (const locIndex of localByName.get(key) ?? []) {
      if (matchedLocal.has(locIndex)) continue;
      const locNode = locNodes[locIndex];
      if (refNode.tag !== locNode.tag && refNode.role !== locNode.role) continue;
      const score = nodeSimilarity(refNode, locNode) + 0.1;
      if (!best || score > best.score) best = { locIndex, score };
    }
    if (best && best.score >= 0.5 && addPair(refIndex, best.locIndex, Math.min(0.95, best.score))) {
      alignChildren(refIndex, best.locIndex, 0);
    }
  }

  const referenceNodes = refNodes.filter(isSignificant);
  const localNodes = locNodes.filter(isSignificant);
  const matchedReference = pairs.filter((pair) => isSignificant(refNodes[pair.reference]));
  const matchedLocalNodes = pairs.filter((pair) => isSignificant(locNodes[pair.local]));
  const confidenceValues = matchedReference.map((pair) => pair.confidence);
  const meanConfidence = confidenceValues.length
    ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
    : 0;

  const summary = {
    referenceNodes: referenceNodes.length,
    localNodes: localNodes.length,
    matched: matchedReference.length,
    coverage: referenceNodes.length ? Math.round((matchedReference.length / referenceNodes.length) * 1000) / 1000 : 1,
    localCoverage: localNodes.length ? Math.round((matchedLocalNodes.length / localNodes.length) * 1000) / 1000 : 1,
    meanConfidence: Math.round(meanConfidence * 1000) / 1000,
    highConfidence: pairs.filter((pair) => pair.confidence >= 0.7).length,
    lowConfidence: pairs.filter((pair) => pair.confidence < minConfidence).length,
  };

  return {
    pairs: pairs.sort((a, b) => a.reference - b.reference),
    unmatched: {
      reference: unmatchedRef
        .filter((index) => !matchedRef.has(index))
        .slice(0, 25)
        .map((index) => ({ tag: refNodes[index].tag, name: refNodes[index].name, path: pathOf(reference, index) })),
      local: unmatchedLocal
        .filter((index) => !matchedLocal.has(index))
        .slice(0, 25)
        .map((index) => ({ tag: locNodes[index].tag, name: locNodes[index].name, path: pathOf(local, index) })),
    },
    stats: summary,
    lowConfidencePairs: pairs
      .filter((pair) => pair.confidence < minConfidence)
      .slice(0, 20)
      .map((pair) => ({ ...pair, referencePath: pathOf(reference, pair.reference) })),
  };
}

export function matchingSummary(matching, confidenceFloor = 0.5) {
  if (!matching) return null;
  return {
    stats: matching.stats,
    unmatched: matching.unmatched,
    lowConfidencePairs: matching.lowConfidencePairs,
    confidenceFloor,
  };
}
