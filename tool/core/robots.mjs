import { parseUrl } from "./urls.mjs";

export function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  let current = null;
  let expectingAgents = false;

  for (const raw of String(text ?? "").split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (key === "user-agent") {
      if (!current || !expectingAgents) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      expectingAgents = true;
    } else if (key === "allow" || key === "disallow") {
      if (current) current.rules.push({ allow: key === "allow", pattern: value });
      expectingAgents = false;
    } else if (key === "sitemap" && value) {
      sitemaps.push(value);
      expectingAgents = false;
    }
  }

  return { groups, sitemaps: [...new Set(sitemaps)] };
}

function groupFor(robots, userAgent) {
  const ua = String(userAgent ?? "").toLowerCase();
  const specific = robots.groups.find((group) =>
    group.agents.some((agent) => agent !== "*" && ua.startsWith(agent)),
  );
  if (specific) return specific;
  return robots.groups.find((group) => group.agents.includes("*")) ?? null;
}

export function rulesFor(robots, userAgent) {
  return groupFor(robots, userAgent)?.rules ?? [];
}

function robotsPatternToRegExp(pattern) {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  let out = "^";
  for (const char of body) {
    if (char === "*") out += ".*";
    else if (char === "?") out += ".";
    else out += char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(anchored ? `${out}$` : out);
}

/**
 * Standard precedence: the longest matching rule wins, and Allow wins a tie.
 */
export function isAllowed(path, rules, { emptyMeansAllow = true } = {}) {
  const routePath = path.split("?")[0] || "/";
  let best = null;
  for (const rule of rules ?? []) {
    if (!rule.pattern) {
      if (emptyMeansAllow) continue;
      continue;
    }
    if (!robotsPatternToRegExp(rule.pattern).test(routePath)) continue;
    if (!best || rule.pattern.length > best.pattern.length || (rule.pattern.length === best.pattern.length && rule.allow)) {
      best = rule;
    }
  }
  return best ? best.allow : true;
}

export async function loadRobots(origin, { headers = {}, timeoutMs = 5000, fetchImpl = fetch, logger } = {}) {
  const url = new URL("/robots.txt", origin).href;
  try {
    const response = await fetchImpl(url, {
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return { url, status: response.status, text: "", robots: parseRobots("") };
    const text = await response.text();
    return { url, status: response.status, text, robots: parseRobots(text) };
  } catch (error) {
    logger?.warn("robots.txt unavailable", { url, error: String(error?.message ?? error) });
    return { url, status: 0, text: "", robots: parseRobots("") };
  }
}

export function robotsForPage(robots, userAgent) {
  return rulesFor(robots, userAgent);
}

export function originOf(input) {
  return parseUrl(input).origin;
}
