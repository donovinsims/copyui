import test from "node:test";
import assert from "node:assert/strict";
import { isAllowed, parseRobots, rulesFor } from "../core/robots.mjs";

const SAMPLE = `
# comment
User-agent: *
Disallow: /private
Disallow: /*.json$
Allow: /private/public
Sitemap: https://example.com/sitemap.xml

User-agent: BadBot
Disallow: /
`;

test("robots groups, rules and sitemaps are parsed", () => {
  const robots = parseRobots(SAMPLE);
  assert.equal(robots.groups.length, 2);
  assert.deepEqual(robots.sitemaps, ["https://example.com/sitemap.xml"]);
  assert.equal(robots.groups[0].rules.length, 3);
});

test("longest matching rule wins and allow wins a tie", () => {
  const rules = rulesFor(parseRobots(SAMPLE), "copyui/0.1");
  assert.equal(isAllowed("/", rules), true);
  assert.equal(isAllowed("/private", rules), false);
  assert.equal(isAllowed("/private/public", rules), true);
  assert.equal(isAllowed("/data.json", rules), false);
  assert.equal(isAllowed("/data.json?x=1", rules), false);
});

test("specific user-agent groups override the wildcard", () => {
  const robots = parseRobots(SAMPLE);
  assert.equal(isAllowed("/", rulesFor(robots, "BadBot/2.0")), false);
  assert.equal(isAllowed("/", rulesFor(robots, "OtherBot/1.0")), true);
});

test("empty rules allow everything", () => {
  assert.equal(isAllowed("/anything", []), true);
  assert.equal(isAllowed("/anything", [{ allow: false, pattern: "" }]), true);
});
