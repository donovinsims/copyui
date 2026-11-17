import test from "node:test";
import assert from "node:assert/strict";
import { alignSequences, matchPages, nodeSimilarity } from "../core/match.mjs";

function build(definition, parent = -1, nodes = []) {
  for (const item of definition) {
    const index = nodes.length;
    const node = {
      i: index,
      parent,
      tag: item.tag,
      role: item.role ?? null,
      name: item.name ?? "",
      classes: item.classes ?? "",
      text: item.text ?? "",
      visible: item.visible ?? true,
      rect: item.rect ?? { x: 0, y: 0, width: 200, height: 40 },
      children: [],
      styles: {},
    };
    nodes.push(node);
    if (parent >= 0) nodes[parent].children.push(index);
    build(item.children ?? [], index, nodes);
  }
  return nodes;
}

const page = (bodyChildren) => ({
  nodes: build([{ tag: "html", children: [{ tag: "body", children: bodyChildren }] }]),
  slots: {},
  derived: {},
});

const originalTree = () => [
  {
    tag: "header",
    role: "banner",
    name: "Site",
    children: [{ tag: "a", role: "link", name: "Home" }],
  },
  {
    tag: "main",
    role: "main",
    children: [
      { tag: "h1", role: "heading", name: "Fixture home" },
      {
        tag: "div",
        classes: "cards",
        children: [
          { tag: "article", classes: "card", name: "First", children: [{ tag: "h2", role: "heading", name: "First" }] },
          { tag: "article", classes: "card", name: "Second", children: [{ tag: "h2", role: "heading", name: "Second" }] },
          { tag: "article", classes: "card", name: "Third", children: [{ tag: "h2", role: "heading", name: "Third" }] },
        ],
      },
    ],
  },
];

test("identical trees match completely with high confidence", () => {
  const result = matchPages(page(originalTree()), page(originalTree()));
  assert.equal(result.stats.coverage, 1);
  assert.equal(result.stats.localCoverage, 1);
  assert.ok(result.stats.meanConfidence > 0.7);
  assert.equal(result.stats.lowConfidence, 0);
  assert.equal(result.unmatched.reference.length, 0);
});

test("removed subtrees reduce coverage and are reported", () => {
  const changed = originalTree();
  changed[1].children[1].children.pop();
  changed[1].children[0].name = "Different heading";
  const result = matchPages(page(originalTree()), page(changed));
  assert.ok(result.stats.coverage < 1);
  assert.ok(result.stats.coverage > 0.6);
  assert.ok(result.unmatched.reference.length > 0);
  assert.ok(result.pairs.some((pair) => pair.tag === "article"));
});

test("repeated cards pair in order even when their content differs", () => {
  const changed = originalTree();
  for (const [index, card] of changed[1].children[1].children.entries()) {
    card.name = `Renamed ${index}`;
    card.children[0].name = `Renamed ${index}`;
  }
  const result = matchPages(page(originalTree()), page(changed));
  const cardPairs = result.pairs.filter((pair) => pair.tag === "article");
  assert.equal(cardPairs.length, 3);
  for (const pair of cardPairs) assert.ok(pair.confidence >= 0.5);
});

test("a single presentational wrapper does not strand a subtree", () => {
  const reference = page([
    {
      tag: "div",
      classes: "shell",
      children: [
        { tag: "aside", role: "complementary", name: "Side" },
        {
          tag: "div",
          classes: "main-col",
          children: [
            {
              tag: "main",
              role: "main",
              name: "Docs",
              children: [
                { tag: "h1", role: "heading", name: "Title" },
                { tag: "p", name: "Body copy" },
              ],
            },
          ],
        },
      ],
    },
  ]);
  const local = page([
    {
      tag: "div",
      classes: "app",
      children: [
        { tag: "aside", role: "complementary", name: "Side" },
        {
          tag: "main",
          role: "main",
          name: "Docs",
          children: [
            { tag: "h1", role: "heading", name: "Title" },
            { tag: "p", name: "Body copy" },
          ],
        },
      ],
    },
  ]);

  const result = matchPages(reference, local);
  assert.ok(result.pairs.some((pair) => pair.tag === "main"), "main is paired through the wrapper");
  assert.ok(result.stats.coverage >= 0.85, JSON.stringify(result.stats));
});

test("identical content is recovered when the shell diverged", () => {
  const reference = page([
    {
      tag: "div",
      classes: "shell-a",
      children: [
        {
          tag: "main",
          role: "main",
          children: [
            { tag: "h1", role: "heading", name: "Chat Composer" },
            { tag: "p", name: "A composer for agents." },
          ],
        },
      ],
    },
  ]);
  const local = page([
    {
      tag: "section",
      classes: "shell-b",
      children: [
        {
          tag: "div",
          children: [
            { tag: "h1", role: "heading", name: "Chat Composer" },
            { tag: "p", name: "A composer for agents." },
          ],
        },
      ],
    },
  ]);

  const result = matchPages(reference, local);
  assert.ok(result.pairs.some((pair) => pair.name === "Chat Composer"), "heading is recovered by text");
  assert.ok(result.stats.coverage >= 0.5, JSON.stringify(result.stats));
});

test("a repeated card grid pairs container and cards despite new class names and order", () => {
  const card = (title, tag = "article") => ({
    tag,
    classes: tag === "article" ? "card" : "library-card",
    children: [
      {
        tag: "div",
        classes: "stage",
        children: [{ tag: "div", classes: "preview" }],
      },
      {
        tag: "div",
        classes: "footer",
        children: [{ tag: "h3", role: "heading", name: title }],
      },
    ],
  });
  const reference = page([
    {
      tag: "div",
      classes: "grid",
      children: [card("Alpha"), card("Beta"), card("Gamma")],
    },
  ]);
  // Same cards, different wrapper, different class names and reversed order.
  const localCards = ["Gamma", "Alpha", "Beta"].map((title) => ({
      tag: "article",
      classes: "library-card",
      children: [
        {
          tag: "a",
          role: "link",
          classes: "library-card__link",
          children: [
            { tag: "div", classes: "stage", children: [{ tag: "div", classes: "preview" }] },
            {
              tag: "div",
              classes: "meta",
              children: [{ tag: "h3", role: "heading", name: title }],
            },
          ],
        },
      ],
  }));
  const local = page([{ tag: "div", classes: "library-grid", children: localCards }]);

  const result = matchPages(reference, local);
  const cardPairs = result.pairs.filter((pair) => pair.tag === "article");
  assert.equal(cardPairs.length, 3, "every card pairs despite the order and wrapper");
  for (const pair of cardPairs) {
    const refTitle = reference.nodes[pair.reference].children
      .flatMap((index) => reference.nodes[index].children)
      .map((index) => reference.nodes[index].name)
      .find(Boolean);
    const locTitle = local.nodes[pair.local].children
      .flatMap((index) => local.nodes[index].children)
      .flatMap((index) => local.nodes[index].children)
      .map((index) => local.nodes[index].name)
      .find(Boolean);
    assert.equal(locTitle, refTitle, "cards pair by title, not by position");
  }
  assert.ok(result.stats.coverage >= 0.6, JSON.stringify(result.stats));
});

test("similarity rewards matching tag, role, name and classes", () => {
  const [html] = build([{ tag: "article", classes: "card", name: "First" }]);
  const [same] = build([{ tag: "article", classes: "card", name: "First" }]);
  const [other] = build([{ tag: "footer", classes: "legal", name: "Legal" }]);
  assert.ok(nodeSimilarity(html, same) > 0.75);
  assert.ok(nodeSimilarity(html, other) < 0.25);
});

test("sequence alignment leaves unrelated siblings unmatched", () => {
  const left = [0, 1, 2].map((index) => ({ tag: "div", name: `Left ${index}` }));
  const right = [0, 1].map((index) => ({ tag: "p", name: `Right ${index}` }));
  const pairs = alignSequences(left, right, (a, b) => nodeSimilarity(a, b));
  assert.equal(pairs.length, 0);
});
