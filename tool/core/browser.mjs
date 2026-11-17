import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { parseUrl } from "./urls.mjs";

const FREEZE_CSS = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
  html { scroll-behavior: auto !important; }
`;

const TRACKER_HOST = /(^|\.)(google-analytics\.com|googletagmanager\.com|doubleclick\.net|segment\.(com|io)|mixpanel\.com|hotjar\.com|fullstory\.com|clarity\.ms|sentry\.io|intercom\.(io|com)|intercomcdn\.com|drift\.com|crisp\.chat)$/i;

export async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    const next = new Error(
      `Playwright is required for capture. Run "npm ci" and "npx playwright install chromium". (${error.message})`,
    );
    next.exitCode = 3;
    throw next;
  }
}

/**
 * Playwright 1.49 launches a separate headless-shell binary by default. Some
 * environments only have the full Chromium download, so fall back to it rather
 * than failing a capture run that could work.
 */
async function findCachedChromium() {
  const cache = path.join(homedir(), ".cache", "ms-playwright");
  let entries = [];
  try {
    entries = await readdir(cache, { withFileTypes: true });
  } catch {
    return null;
  }
  const candidates = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("chromium-") && !entry.name.includes("headless"))
    .sort((a, b) => b.name.localeCompare(a.name));
  for (const entry of candidates) {
    for (const relative of ["chrome-linux/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium", "chrome-win/chrome.exe"]) {
      const file = path.join(cache, entry.name, relative);
      if (existsSync(file)) return file;
    }
  }
  return null;
}

export async function launchBrowser({ executablePath, headless = true } = {}) {
  const { chromium } = await loadPlaywright();
  const args = ["--font-render-hinting=none", "--force-color-profile=srgb", "--no-sandbox"];
  const options = { headless, args };
  const explicit = executablePath ?? process.env.COPYUI_CHROMIUM_EXECUTABLE ?? process.env.COMPARE_CHROMIUM_EXECUTABLE;
  if (explicit) options.executablePath = explicit;
  try {
    return await chromium.launch(options);
  } catch (error) {
    if (!/Executable doesn't exist|headless_shell|playwright install/i.test(String(error?.message))) throw error;
    const fallback = await findCachedChromium();
    if (!fallback) throw error;
    return chromium.launch({ ...options, executablePath: fallback });
  }
}

function hostPatternToRegExp(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

export function shouldBlockRequest(url, patterns = []) {
  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return false;
  }
  if (TRACKER_HOST.test(hostname)) return true;
  return patterns.some((pattern) => hostPatternToRegExp(pattern).test(hostname));
}

export async function createCaptureContext(browser, config, { viewport, theme, side = "reference" }) {
  const origin = config[side === "reference" ? "target" : "local"];
  const headers = {
    "user-agent": config.userAgent ?? "copyui/0.1 (+https://github.com/donovinsims/copyui)",
    ...(config.auth?.headers ?? {}),
  };
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: config.capture?.deviceScaleFactor ?? 1,
    colorScheme: theme,
    reducedMotion: config.capture?.reducedMotion ?? "reduce",
    locale: config.capture?.locale ?? "en-US",
    timezoneId: config.capture?.timezoneId ?? "UTC",
    serviceWorkers: "block",
    ...(config.auth?.storageState ? { storageState: config.auth.storageState } : {}),
    extraHTTPHeaders: headers,
  });
  context.captureOrigin = origin ? parseUrl(origin).origin : null;
  return context;
}

/**
 * Everything that makes two captures comparable: a seeded RNG, a frozen clock,
 * a forced theme, tracker blocking, disabled animation and a hidden caret.
 * Installed before navigation so hydration sees the same world both times.
 */
export async function preparePage(page, config, { theme = "light", side = "reference" } = {}) {
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (!/^https?:/i.test(url)) return route.continue();
    if (shouldBlockRequest(url, config.capture?.blockHosts ?? [])) return route.abort().catch(() => {});
    return route.continue().catch(() => {});
  });

  await page.addInitScript(
    ({ theme: nextTheme, seed, freezeClock, seedRandom, attribute, className, storageKeys }) => {
      try {
        if (freezeClock) {
          const fixed = Date.UTC(2020, 0, 1, 12, 0, 0);
          const RealDate = Date;
          class FrozenDate extends RealDate {
            constructor(...args) {
              super(...(args.length ? args : [fixed]));
            }
            static now() {
              return fixed;
            }
          }
          // eslint-disable-next-line no-global-assign
          window.Date = FrozenDate;
        }
        if (seedRandom) {
          let state = seed >>> 0;
          Math.random = () => {
            state = (state + 0x6d2b79f5) >>> 0;
            let t = state;
            t = Math.imul(t ^ (t >>> 15), 1 | t);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
          };
          if (window.crypto?.getRandomValues) {
            window.crypto.getRandomValues = (array) => {
              for (let index = 0; index < array.length; index += 1) {
                array[index] = Math.floor(Math.random() * 256);
              }
              return array;
            };
          }
        }
        const root = document.documentElement;
        if (attribute) root.setAttribute(attribute, nextTheme === "dark" ? "dark" : "light");
        if (className) root.classList.toggle(className, nextTheme === "dark");
        root.style.colorScheme = nextTheme;
        for (const key of storageKeys ?? []) {
          try {
            localStorage.setItem(key, nextTheme);
          } catch {
            /* storage can be blocked */
          }
        }
      } catch {
        /* the page may still legitimately fail to accept init overrides */
      }
    },
    {
      theme,
      seed: 0x9e3779b9,
      freezeClock: config.capture?.freezeClock !== false,
      seedRandom: config.capture?.seedRandom !== false,
      attribute: config.theme?.attribute ?? null,
      className: config.theme?.class ?? null,
      storageKeys: config.theme?.storageKeys ?? [],
    },
  );
}

export async function gotoPage(page, url, config) {
  const timeout = config.capture?.timeoutMs ?? 60000;
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout });
  await page.waitForLoadState("load", { timeout: Math.min(15000, timeout) }).catch(() => {});
  return response;
}

export async function dismissConsent(page, config) {
  for (const selector of config.consent?.dismiss ?? []) {
    try {
      const locator = page.locator(selector).first();
      if (!(await locator.count())) continue;
      if (!(await locator.isVisible().catch(() => false))) continue;
      await locator.click({ timeout: 2500 });
      await page.waitForTimeout(200);
    } catch {
      /* a consent selector that no longer exists is not fatal */
    }
  }
}

export async function applyTheme(page, config, theme) {
  const toggleName = config.theme?.toggle?.[theme];
  if (toggleName) {
    try {
      const button = page.getByRole("button", { name: toggleName, exact: true }).first();
      if (await button.count()) {
        await button.click({ timeout: 2500 }).catch(() => {});
        await page.waitForTimeout(300);
      }
    } catch {
      /* the theme may already be active */
    }
  }

  await page.evaluate(
    ({ nextTheme, attribute, className, storageKeys }) => {
      const root = document.documentElement;
      if (attribute) root.setAttribute(attribute, nextTheme === "dark" ? "dark" : "light");
      if (className) root.classList.toggle(className, nextTheme === "dark");
      root.style.colorScheme = nextTheme;
      for (const key of storageKeys ?? []) {
        try {
          localStorage.setItem(key, nextTheme);
        } catch {
          /* ignore */
        }
      }
    },
    {
      nextTheme: theme,
      attribute: config.theme?.attribute ?? null,
      className: config.theme?.class ?? null,
      storageKeys: config.theme?.storageKeys ?? [],
    },
  );
  await page.waitForTimeout(250);
}

export async function runNavigation(page, config, { side, surface, viewport }) {
  const steps = [...(surface?.navigation ?? []), ...(config.navigation ?? [])];
  for (const step of steps) {
    if (step.side && step.side !== side) continue;
    if (step.surface && step.surface !== surface?.id) continue;
    if (step.when?.maxWidth !== undefined && viewport.width > step.when.maxWidth) continue;
    if (step.when?.minWidth !== undefined && viewport.width < step.when.minWidth) continue;
    if (!step.click) continue;
    try {
      const base = page.locator(step.click);
      const locator = step.text ? base.filter({ hasText: step.text }).first() : base.first();
      if (!(await locator.count())) {
        if (step.optional) continue;
        throw new Error(`navigation target not found: ${step.click}${step.text ? ` (${step.text})` : ""}`);
      }
      if (!(await locator.isVisible().catch(() => false))) {
        if (step.optional) continue;
        throw new Error(`navigation target not visible: ${step.click}`);
      }
      await locator.click({ timeout: step.timeoutMs ?? 4000 });
      await page.waitForTimeout(step.waitMs ?? 400);
    } catch (error) {
      if (!step.optional) throw error;
    }
  }
}

export async function waitForSlots(page, selectors, { timeoutMs = 15000 } = {}) {
  const entries = Object.entries(selectors ?? {});
  if (!entries.length) return [];
  const deadline = Date.now() + timeoutMs;
  let missing = entries.map(([name]) => name);
  while (Date.now() < deadline) {
    missing = await page
      .evaluate((selectors) => {
        const query = (selector, root = document) => {
          const out = [...root.querySelectorAll(selector)];
          for (const element of root.querySelectorAll("*")) {
            if (element.shadowRoot) out.push(...query(selector, element.shadowRoot));
          }
          return out;
        };
        return selectors.filter(([, selector]) => !query(selector).length).map(([name]) => name);
      }, entries)
      .catch(() => entries.map(([name]) => name));
    if (!missing.length) return [];
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return missing;
}

export async function freezePage(page) {
  await page.addStyleTag({ content: FREEZE_CSS }).catch(() => {});
  await page.evaluate(() => {
    for (const animation of document.getAnimations?.() ?? []) {
      try {
        animation.pause();
      } catch {
        /* non-pausable animations are left alone */
      }
    }
  }).catch(() => {});
}

export async function settlePage(page, config = {}) {
  await page.evaluate(async () => {
    // Every wait inside the page is bounded. A lazy image whose decode() never
    // settles, or a font request that stays pending, must not hang the run.
    const until = (promise, ms) =>
      Promise.race([
        Promise.resolve(promise).catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, ms)),
      ]);
    await until(document.fonts?.ready, 4000);
    const height = () => Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
    const viewport = window.innerHeight || 800;
    // Bounded: an infinite-scroll page must not turn settling into an endless
    // loop. 40 viewports is more than any real page needs before the fold
    // lazy-loads, and the cap is reported through the page model's truncation.
    const start = height();
    const limit = Math.min(40, Math.ceil((start + viewport) / viewport) + 4);
    for (let step = 0, y = 0; step < limit; step += 1, y += viewport) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
    await until(new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))), 2000);
    await until(
      Promise.all([...document.images].map((image) => until(image.decode?.(), 2000))),
      6000,
    );
  }).catch(() => {});
  await page.waitForTimeout(config.capture?.settleMs ?? 250);
}

export async function detectChallenge(page) {
  const markers = [
    "just a moment",
    "attention required",
    "checking your browser",
    "enable javascript and cookies to continue",
    "verify you are human",
    "access denied",
  ];
  try {
    const text = await page.evaluate(() => `${document.title} ${(document.body?.innerText ?? "").slice(0, 4000)}`);
    const lower = text.toLowerCase();
    return markers.find((marker) => lower.includes(marker)) ?? null;
  } catch {
    return null;
  }
}

export function classifyError(error) {
  const message = String(error?.message ?? error ?? "unknown error");
  if (/timeout|timed out|exceeded/i.test(message)) return { status: "timeout", message };
  if (/ERR_NAME_NOT_RESOLVED|getaddrinfo|ENOTFOUND/i.test(message)) return { status: "dns", message };
  if (/ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|ECONNREFUSED|ERR_CONNECTION_CLOSED/i.test(message)) {
    return { status: "unreachable", message };
  }
  if (/ERR_CERT|SSL|TLS/i.test(message)) return { status: "tls", message };
  if (/ERR_ABORTED/i.test(message)) return { status: "aborted", message };
  return { status: "error", message };
}

export function isRetryable(status) {
  return status === "timeout" || status === "aborted" || status === "missing" || status === "error";
}
