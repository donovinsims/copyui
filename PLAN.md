# copyui — universal cloning plan

**Status:** Phases 0–2 implemented · **Owner:** donovinsims · **Last updated:** 2026-11-17

> **Progress:** Phase 0 landed the measurement baseline and the test/CI harness; Phase 1 added the
deterministic capture kernel (browser conditions, page model, discovery, retries, error taxonomy,
artifact writer, discovery cache, `scan`/`capture`); Phase 2 added node matching, the declarative
assertion engine, coverage accounting and the affectui port at the full 1000-check inventory.
`npm test` and `npm run compare:fixtures` pass. Phases 3+ are still open.

This plan turns the affectui-specific comparison rig into a general tool that can capture, measure,
mirror and rebuild *any* public website, then prove the result with scored, gated comparisons.

The existing app in `src/` stays as it is: the flagship clean-room example and the first regression
case. The new work lives in `tool/` and is what `copyui` becomes as a CLI.

---

## 1. What "damn near perfect" means

"Perfect" is not a feeling and not a screenshot that looks close. It is five measurable axes, each
scored per route, per viewport, per theme, with the weighted total reported as **Fidelity 0–100**:

| Axis | Weight | Measured as |
| --- | ---: | --- |
| Pixel | 45% | Perceptual diff (SSIM + CIEDE2000) over masked, aligned viewport and full-page captures |
| Geometry | 25% | Matched-node rect deltas, area-weighted, 1px / 0.5px-radius tolerances |
| Type & colour | 15% | Font family/size/weight/line-height/tracking, colour, background, border, radius, shadow equality |
| Content | 10% | Normalised text token multiset, heading order, image/icon inventory, link targets |
| Assets | 5% | SHA-256 match rate for images, fonts, SVGs, favicons, media posters |

Default gates for a **pass**:

- Fidelity ≥ **97** on content/marketing routes, ≥ **93** on interactive app shells.
- No route below **90**; no *unexplained* P0 (crash, blank render, unreachable, gate error).
- SSIM ≥ **0.98** on masked pixel comparison; geometry ≥ **95%** of matched nodes in tolerance.
- Two consecutive runs on a frozen fixture produce **identical** `metrics.json`.

Three honesty tiers go in every report, because no tool can do the impossible:

| Tier | What it covers | What is guaranteed |
| --- | --- | --- |
| **A — content** | Marketing, docs, blogs, catalogues, marketing SPAs | Full fidelity target, full route coverage |
| **B — app shell** | Logged-out dashboards, tools, settings shells | Layout + visible states; data-dependent internals reported as coverage gaps |
| **C — live/media** | Video, canvas/WebGL, realtime feeds, personalised or paywalled pages | Best-effort snapshot; pixel comparison masked; limitations listed, never silently claimed |

**Non-goals** (stated in the README, not hidden): defeating CAPTCHAs or bot challenges, bypassing
auth/paywalls/MFA, DRM video, server-side behaviour, native apps, and pixel-identical rendering of
canvas/WebGL content.

---

## 2. Where the code is today

| Piece | Location | Reality |
| --- | --- | --- |
| Flagship replica | `src/**` | 17 components, token system, docs. Works. Stays. |
| Comparison rig | `scripts/compare/capture.mjs` (1,256 lines, one file) | Hard-coded `SURFACES`, `selectorsFor()` per site, `checksFor()` full of affectui magic numbers (`86.58`, `40`, `"14px 16px"`), a "Decline" cookie button, the local `.ds__menu` path, and gates for exactly one component page |
| Gates | inside `main()` | 1000 frame checks, ±3% height gate, 54 section checks, 17/17 structure and uniqueness; not reusable for another site |
| Config | env vars `COMPARE_*` only | No config file, no CLI flags, no route discovery |
| Tests | none | No unit tests, no fixtures, no CI |
| Outputs | `artifacts/compare/**` | PNGs gitignored, metrics/report checked in; no HTML report |
| Working tree | 10 modified files + `diff-triage.md` untracked | The last measurement pass is unlanded |

What is genuinely valuable and should be lifted, not rewritten: the *conditions discipline* (same
viewport, theme, reduced motion, frozen animations, font wait, caret hidden, scroll 0), the
deterministic metrics shape, and the retry-on-missing-anchor idea.

What must go: every literal that names affectui, every per-site selector table, every hard-coded
expected value, and the assumption that the "local" side is this one React app.

---

## 3. Target architecture

One package, Node ESM, no build step for the tool itself. `app/` (Next.js App Router) and
`src/` remain the clean-room app and gallery.

```text
tool/
  cli.mjs                 # arg parsing, commands, exit codes
  config.mjs              # defaults, config file load, CLI merge, validation
  core/
    browser.mjs           # launch/context, conditions, determinism, blocking
    discover.mjs          # sitemap/robots/anchor crawl, canonicalisation, budgets
    capture.mjs           # per-route capture orchestration, retries, artifacts
    page-model.mjs        # injected in-page extractor -> normalised snapshot
    match.mjs             # cross-site node alignment + confidence
    assertions.mjs        # declarative checks (replaces checksFor)
    tokens.mjs            # design-token inference from computed styles
    components.mjs        # repeated-subtree clustering
    assets.mjs            # download, hash, rewrite, licence manifest
    states.mjs            # breakpoint + interactive state graph
    diff.mjs              # png decode, masking, SSIM/ΔE00, region clustering
    score.mjs             # axis scores, weights, gates, coverage accounting
    report.mjs            # markdown + single-file HTML report
    generate/
      mirror.mjs          # post-hydration DOM archive
      rebuild.mjs         # token-driven React/Vite project
    repair.mjs            # delta -> token overrides -> re-verify loop
    log.mjs               # structured progress, `--json`, no timestamps in metrics
  fixtures/
    sites/                # deterministic local fixture sites (quirks by design)
    expected/             # golden page models / metrics
  test/                   # node:test unit + fixture integration tests
examples/
  affectui/
    compare.config.mjs    # the current 1000-check rig expressed declaratively
    expectations.json     # the measured magic numbers, with provenance comments
```

**Data flow**

```text
URL ──discover──> routes ──capture──> snapshots (DOM model + PNGs + assets + states)
                                          │
                     ┌────────────────────┼────────────────────┐
                     ▼                    ▼                    ▼
                assertions            diff/score          token+component
                     │                    │                 inference
                     └──────────┬─────────┘                    │
                                ▼                              ▼
                          metrics.json + report.html      mirror / rebuild
                                ▲                              │
                                └──────── repair loop ─────────┘
```

**Artifact layout** (all git-ignored except the small reports you choose to keep):

```text
out/<site-slug>/
  manifest.json                     # target, config hash, tool version, timings, limitations
  capture/<route>/<viewport>/<theme>[-<state>]/
    reference.png  local.png  pair.png  overlay.png  diff.png
    snapshot.json  assertions.json  assets.json
  compare/
    metrics.json                    # deterministic: no timestamps, no absolute paths
    report.md                       # human summary
    report.html                     # self-contained: images inlined, per-node deltas
    coverage.json                   # captured vs discovered vs gated
  analysis/
    tokens.json                     # DTCG format + provenance counts
    tokens.css
    components.json                 # clusters, labels, file map, confidence
    inventory.json                  # images, fonts, SVGs, links, media
  clone/
    mirror/                         # static archive
    rebuild/                        # React + Vite project
```

---

## 4. CLI and config contract

```bash
copyui scan    <url>                          # discover routes + print a plan, capture nothing
copyui capture <url> --out out/site            # snapshots, assets, states, metrics
copyui compare <reference-url> <local-url>     # same conditions both sides, score + gates
copyui clone   <url> --mode mirror|rebuild --out out/site
copyui verify  out/site/clone/rebuild --ref <url> [--iterate 3]
copyui report  out/site                        # regenerate report.md / report.html
copyui init                                    # write copyui.config.mjs
```

Flags that matter: `--config`, `--routes`, `--max-pages`, `--depth`, `--viewport`,
`--themes light,dark`, `--state`, `--concurrency` (default 1 per host), `--cache`,
`--no-cache`, `--json`, `--fail-on fidelity|pixel|geometry|coverage`, `--allow-robots-off`,
`--auth <storageState.json>`, `--headers`, `--ignore <selector>`, `--mask <selector>`,
`--scripts keep|strip|neutralize`, `--dry-run`.

Exit codes: `0` pass · `1` gate failure · `2` usage/config · `3` target unreachable or blocked ·
`4` coverage below threshold.

```js
// copyui.config.mjs
export default {
  target: "https://example.com",
  viewports: "derive",                       // or [{ id, width, height }]
  themes: ["light", "dark"],
  routes: { include: ["/**"], exclude: ["/legal/**"], maxPages: 40, depth: 3 },
  auth: { storageState: null, headers: {}, basic: null },
  consent: { dismiss: ["button:has-text('Accept')", "[aria-label*='cookie' i]"] },
  deterministic: { freezeClock: true, seedRandom: true, blockHosts: ["*.analytics.*"] },
  compare: { geometryTolerancePx: 1, pixelMask: ["video", "canvas", "iframe"], weights: {} },
  gates: { fidelity: 97, ssim: 0.98, geometry: 0.95, coverage: 0.9 },
  generate: { mode: "rebuild", scripts: "strip", maxComponents: 40 },
  output: "out/example-com"
};
```

Precedence: CLI > config file > defaults. Every resolved value is echoed into `manifest.json` so a
run is reproducible from the artifact alone.

---

## 5. Fidelity mechanics

### 5.1 Determinism (non-negotiable)

Every capture runs under: fixed viewport and `deviceScaleFactor` (1 for gating, 2 optional), explicit
`colorScheme`, `reducedMotion` per matrix, `forcedColors: none`, fixed locale/timezone, clock frozen
via Playwright's clock API, `Math.random`/`crypto.getRandomValues` seeded, analytics/session-replay/
chat-widget hosts blocked, animations frozen twice (injected CSS + `getAnimations().pause()`), fonts
awaited (`document.fonts.ready` + `status === loaded`), lazy content forced (scroll bottom → top,
wait for image decode), scroll reset, caret hidden, and a final layout-settle double `rAF`.

A run that cannot reach these conditions reports it and downgrades the comparison to "advisory"
instead of pretending the numbers are comparable.

### 5.2 Page model and node matching

The injected extractor walks the rendered DOM (including open shadow roots and same-origin iframes)
and emits nodes with: tag, ARIA role, accessible name, landmark ancestry, depth, sibling index,
normalised class list, rect, computed styles (the ~70 properties that affect rendering), text,
attributes that change layout, and asset references. Nodes that are not visible or not rendered are
marked, not dropped.

Matching is layered, cheapest first:

1. **Landmarks and headings** as anchors (`header`, `nav`, `main`, `aside`, `footer`, `h1`–`h3`).
2. **Sibling sequence alignment** (Needleman–Wunsch) per parent using a similarity score of
   role, name, tag and normalised classes.
3. **Repetition assignment** for card/list clusters: order + size + content shape, Hungarian
   assignment for ambiguous groups.
4. **Fallback path keys** for leftovers, recorded with low confidence.

Every pair carries `confidence`. Pairs below 0.5 are reported separately and excluded from geometry
gates — they are a *finding* ("structure diverged here"), not a silent pass. Unmatched nodes on
either side reduce content/coverage scores and appear in the report.

### 5.3 Assertions

The old `checksFor()` becomes data:

```js
{ name: "panel.radius", a: "$panel.radius", b: "$panel.radius", tolerance: 0.5 }
{ name: "title.color",  a: "$title.color",  b: "$title.color",  exact: true }
{ name: "sections.titles", a: "$sections.titles", b: "$sections.titles", exactList: true }
```

Selectors are derived from the matched pairs, with optional overrides for inaccessible anchors.
`examples/affectui/expectations.json` keeps the current measured constants (the 86.58px install card,
the 40px code header) with a comment naming the reference route/viewport they came from, so the
flagship keeps its 1000-check standard without hard-coding affectui into the engine.

### 5.4 Pixel diff and scoring

Decode PNGs with `pngjs` + `pixelmatch` (pure JS, small); compute SSIM per 8×8 block plus a
CIEDE2000 colour delta. Masked regions: video, canvas, iframes, user masks, and auto-detected
"volatile" rects (found by capturing the same page twice and diffing — what changes on its own is
excluded and reported). Text antialiasing tolerance is a small per-channel slack, not a blanket
blur. Diffs are clustered into regions (connected components over a threshold map) and ranked by
area × delta, which becomes the "top 10 things to fix" list in the report.

Geometry/type/colour scores are computed over matched nodes weighted by rendered area, so a 400px
hero outweighs a 12px footnote.

### 5.5 Responsive and state coverage

Breakpoints are both derived and configured: scan CSSOM media queries, then sweep widths 320→1920
in 8px steps and record where any measured rect changes by >1px; canonicalise the set (dedupe
within 16px, always include 390/768/1024/1440). Themes come from `prefers-color-scheme` plus any
discovered theme toggle. Interactive states come from a bounded state graph: elements with
`aria-expanded`, `aria-haspopup`, `role=tab`, `details/summary`, dialogs, and forms; open each,
snapshot the resulting state, restore. Budget per route (default 12 states) and record what was
skipped — skipped states are coverage gaps, not passes.

---

## 6. Two clone outputs

### 6.1 Mirror mode — a faithful static archive

Post-hydration DOM serialisation per route, not raw HTML, so client-rendered sites work too:

- Rewrite absolute URLs to relative; localise `src`, `srcset`, `poster`, `href` assets.
- Keep full stylesheets, rewrite `url(...)` references, inline `@font-face` files, download
  images/media at highest available resolution.
- Generated `index.html` per route + SPA fallback + a tiny static server for verification.
- Script policy: `keep` (archive; warn it is a copy of the original code), `neutralize` (strip
  analytics/consent/chat only), `strip` (fully static). Default `neutralize`.
- Neutralise form actions, remove service workers, integrity attributes, `base` rewriting.
- `manifest.json` lists every original URL, licence/attribution metadata found, and what was
  rewritten.

Mirror mode is the guaranteed high-fidelity path: it reproduces the reference's own DOM and CSS, so
Tier A routes should score ≥ 99 unless we deliberately strip something.

### 6.2 Rebuild mode — clean-room, token-driven project

This is the copyui method generalised:

1. **Token inference** (`tokens.mjs`): cluster computed colours in OKLCH (ΔE ≤ 2), classify roles by
   where they appear (canvas, surface, ink, border, accent, status), pair light/dark by semantic
   role. Infer the type ramp, spacing set and base unit, radii, shadow layers, motion durations and
   easings, container widths, z-index layers, breakpoints. Emit `tokens.json` (DTCG) plus
   `tokens.css` with an editorial layer and `--ui-*` aliases — the same two-layer system that made
   the affectUI rebuild coherent — with provenance counts per token.
2. **Component clustering** (`components.mjs`): hash repeated subtrees (tag sequence + normalised
   class roles + layout mode + content shape), rank by frequency × area, label from ARIA/heading/
   class heuristics, and emit one file per component using this repo's convention: single `.tsx`,
   CSS in a template string, `injectCss`, native elements, `--ui-*` reads only.
3. **Page assembly**: routes become page components composing the clusters; extracted text and
   assets are preserved; interactive clusters get typed props and real handlers where the behaviour
   is legible (toggle, tabs, accordion, dialog), and a documented inert state where it is not.
4. **Clean-room guard**: rebuild mode never reads the reference's bundled JS or source. It works
   only from rendered output, computed styles, geometry, accessible text and downloaded public
   assets. A `--source` flag that would copy original markup/JS does not exist; mirror mode is the
   explicit, clearly-labelled alternative.
5. **Licence handling**: fonts with unknown or restricted licences are *not* bundled; the generator
   substitutes the closest metric-compatible open font (Inter, Geist, Source Sans, system stack),
   records the substitution and the fidelity cost. Images are copied with a provenance entry; the
   report lists anything that needs a human licence decision before redistribution.

Rebuild output is scored against the reference exactly like the flagship: `copyui verify` starts the
generated dev server, runs the same conditions, and iterates.

---

## 7. Repair loop

`copyui verify --iterate N` (default 3) closes the loop between generation and fidelity:

| Delta | Automatic action | Guardrail |
| --- | --- | --- |
| Colour/type/radius/shadow token drift | Override the token with the measured value | Only for tokens used ≥ 5 times |
| Spacing/geometry drift | Recalibrate the spacing base and section paddings | Reject if it worsens another route |
| Font mismatch | Metric-compatible substitution + letter-spacing correction | Record substitution, never bundle unlicensed fonts |
| Missing asset | Re-fetch by original URL, content-hash it | Skip if 404/403; report |
| Missing section/content | Report only | Structural edits need a config or human change |
| Low-confidence node match | Report only | Auto-repair never rewrites structure |

Each iteration writes `analysis/repair/<n>.json` with before/after scores and the exact token edits,
so a clone is auditable and reproducible. Stop at the gate, at `N`, or when the score regresses
twice.

---

## 8. Phases

Estimates are engineering days for one experienced dev; they assume the fixture harness exists early.

| Phase | Work | Exit criteria | Est. |
| --- | --- | ---: | ---: |
| **0. Baseline & harness** | Land the pending measurement update as a baseline commit. Add `tool/` skeleton, `copyui.config.mjs` loader, `node:test` runner, `npm test`, GitHub Actions (typecheck + build + unit + fixture run), `engines.node`. Move the existing rig's conditions into `core/browser.mjs` behind a compatibility flag. | `npm test` runs (even if mostly smoke); CI green; existing `npm run compare` still works unchanged. | 1 |
| **1. Capture kernel** | Browser/context factory, determinism layer, page-model extractor, route discovery (sitemap → robots → anchor crawl), retries, error taxonomy, artifact writer, `metrics.json` v1, structured logs, cache, concurrency=1 per host, `scan`/`capture` commands. | Capture 3 fixture sites + one real site at 3 viewports × 2 themes; identical metrics on repeat; unreachable/403/429/timeout paths produce clean artifacts and exit 3. | 3 |
| **2. Matching + assertions** | Normalised node model, layered matching with confidence, declarative assertion engine, coverage accounting, port the affectui checks to `examples/affectui` with zero loss of the current gate count. | Flagship reports the same 1000 frame checks from data, not code paths; a deliberately mutated fixture is caught; unmatched nodes surfaced. | 2 |
| **3. Diff + score + report** | PNG decode, masking, SSIM/CIEDE2000, region clustering, weighted score, gates, markdown + single-file HTML report, baseline mode for own-build regression. | Fidelity score reproduced within 0.1 across runs; top-region list matches human inspection on 3 fixture pages; `--fail-on` exits correctly. | 2 |
| **4. States & responsive** | Breakpoint derivation, theme detection, state graph with budgets, hover/focus/open captures, skipped-state coverage. | Fixture with tabs/accordion/dialog/dark toggle captures every state; skips are reported as gaps; derived breakpoints match the fixture's authored ones. | 2 |
| **5. Mirror mode** | Serialisation, URL/asset/CSS rewriting, fonts, script policy, route index, static server, provenance manifest. | A 10-route fixture site mirrors and serves offline; verification scores ≥ 99 on Tier A; no absolute reference URLs remain; licence manifest complete. | 2 |
| **6. Rebuild mode** | Token inference, component clustering, React/Vite codegen, page assembly, data extraction, clean-room guarantees, substitutions. | Generated project builds and typechecks; first-pass fidelity ≥ 90 on 3 fixture sites and ≥ 95 after repair; component map explains every generated file. | 5 |
| **7. Repair loop** | Token-delta application, spacing recalibration, font substitution, iteration budget, regression guard, audit log. | `verify --iterate` improves or holds fidelity on all fixtures; no route regresses; every edit is in the audit log. | 2 |
| **8. Hardening & corpus** | 20-site corpus (Tier A/B/C mix), failure matrix, SSRF/secret hygiene, cache/performance, docs (`docs/cloning.md`, config reference, troubleshooting), legal/robots guidance, README rewrite. | Corpus run: zero unexplained P0, all Tier A ≥ 97, Tier B ≥ 93, every limitation written down; cold run under 10 min for a 20-route site at 3 viewports/2 themes. | 3 |
| **9. Ship** | Full verification, artifact refresh, changelog, commit, push. | See §12. | 0.5 |

Dependencies: 1 → 2 → 3; 4 after 3 (needs scoring); 5 and 6 can start after 3 and run in parallel;
7 needs 6; 8 last before ship.

---

## 9. Test strategy

**Unit** (`node:test`, no network): URL canonicalisation, route filtering, assertion evaluation,
node similarity/alignment, token clustering on synthetic styles, media-query canonicalisation,
score maths, masking, config merge, script/URL rewriting, clean-room guard (it must refuse to read
`*.js` from a captured bundle).

**Fixture integration**: local static sites served by the test harness, each designed to break naive
tools — a hydration-only SPA, open shadow DOM, a same-origin iframe, lazy images, a font with a
FOUT, a cookie banner, a dark toggle, tabs/accordion/dialog, a 2400px-wide page, a canvas chart, a
date/number that changes daily, and an infinite scroll. Golden files pin the normalised page model
and metrics; screenshots pin pixel scores with tolerance.

**Flagship regression**: `examples/affectui` must keep reporting ≥ 1000 frame checks, 6/6 height,
54/54 section and 17/17 structure gates, with a byte-identical `metrics.json` for unchanged inputs.
This is the guard that the generalisation did not weaken the original standard.

**CI** (GitHub Actions, Ubuntu): `npm ci`, `npm run typecheck`, `npm test`, `npm run compare:fixtures`
(the fixture/corpus npm scripts are added in Phase 0 and Phase 8 respectively, so the commands in
this plan are the contract they must satisfy).
Chromium installed via Playwright; no live-site calls in CI — the live reference changes and would
make CI flaky. Live comparison runs on demand: `npm run compare` / `npm run corpus`.

**Corpus** (opt-in, documented): 5 marketing sites, 5 docs/blogs, 5 app shells, 5 hostile cases
(canvas-heavy, cookie/consent wall, anti-bot challenge expected to report cleanly, infinite scroll,
WebGL). Record scores and limitations in `artifacts/corpus/report.md`. Never commit third-party
assets; the corpus config stores URLs and masks only.

---

## 10. Failure handling matrix

| Condition | Behaviour |
| --- | --- |
| DNS/TLS/timeout | Retry with backoff (2×), then exit 3 with a typed error and a per-route entry |
| 401/403 | Stop the route, report "unauthenticated/forbidden"; suggest `--auth` or headers; never attempt to bypass |
| 429 | Honour `Retry-After` once, then abort the run with guidance to lower concurrency |
| Bot challenge detected | Report "blocked by challenge"; no evasion; route marked uncovered |
| `robots.txt` disallow | Skip and report; `--allow-robots-off` requires an explicit flag plus a printed warning |
| JS error on the reference | Capture what rendered, mark the route advisory, list the error |
| Missing anchor / low confidence | Report the divergence; do not crash, do not silently pass |
| Fonts unavailable | Fallback stack, record substitution and metric impact |
| Canvas/WebGL/video | Mask for scoring, capture poster frame, list as a Tier C limitation |
| Infinite scroll / live feed | Bound by scroll/time budget, mark the truncation, mask volatile regions |
| Huge page (> 250k nodes) | Sample the largest stable subtrees, record coverage, never hang |
| Workspace/disk limits | Stream PNGs to disk, cap artifacts per run, warn before exhaustion |

---

## 11. Legal, ethical, security

- **Clean room by default.** Rebuild mode uses rendered evidence only. Mirror mode is opt-in,
  labelled as an archive of the original, and retains attribution.
- **robots.txt respected**; rate-limited at 1 request in flight per host by default; identifiable
  user agent with a contact URL.
- **No auth bypass, paywall bypass, MFA, CAPTCHA solving or challenge evasion.** Credentials come
  from the user's own `storageState`/headers and are never written into artifacts.
- **Licence manifest** for every downloaded asset; fonts with unclear licences are substituted, not
  redistributed; the report tells the user what needs a licence before publishing.
- **Local-only by default.** Captures, cookies, tokens and storage state never leave the machine;
  no telemetry.
- **Secrets hygiene.** `--auth` files and headers are excluded from `manifest.json` (names only),
  from reports, and from Git (`.gitignore` covers `*.storageState.json`, `out/`, `.copyui-cache/`).
- **SSRF awareness.** The CLI fetches what you point it at, including localhost — documented; no
  server mode is offered, and redirects to non-HTTP(S) schemes are refused.
- The README states plainly that cloning a site's visual design can infringe copyright/trademark,
  that users must check the target's terms, and that the tool is for study, migration and testing
  on sites they are entitled to work with.

---

## 12. Ship checklist (definition of done)

Run from a clean checkout, in this order, and record the results in the final commit message:

```bash
npm ci
npm run typecheck
npm test
npm run compare:fixtures              # fixtures only, deterministic (script added in Phase 0)
npm run compare                       # affectui flagship regression (needs network + Chromium)
npm run build                         # Next.js app still builds
node tool/cli.mjs clone  <fixture> --mode mirror  --out out/fixture-mirror
node tool/cli.mjs verify out/fixture-mirror/clone/mirror  --ref <fixture-url>
node tool/cli.mjs clone  <fixture> --mode rebuild --out out/fixture-rebuild
node tool/cli.mjs verify out/fixture-rebuild/clone/rebuild --ref <fixture-url> --iterate 3
```

Done when:

- [ ] All commands above pass, with the flagship still at ≥ 1000 checks / 6-6 / 54-54 / 17-17.
- [ ] No affectui name, URL, selector or measured constant remains in `tool/core/**` (only in
      `examples/affectui/**` and historical artifacts).
- [ ] Two consecutive fixture runs produce byte-identical `metrics.json`.
- [ ] `out/fixture-rebuild` builds, typechecks and scores ≥ 97 (Tier A fixture).
- [ ] README documents the CLI, the fidelity model, limitations, legal guidance and the flagship.
- [ ] `docs/cloning.md` covers config reference, auth, masks, states, troubleshooting and CI use.
- [ ] CI is green on the branch; corpus report committed with scores and limitations.
- [ ] `PLAN.md` status updated to "implemented", with a short deviations section.
- [ ] Working tree contains only intended changes; generated `out/` and caches ignored.
- [ ] Final commit on `freebuff/0f38aa42a67ad792d8c92ef9`, pushed to GitHub via the authorized
      push path; branch and commit hash reported back.

---

## 13. Risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Automatic node matching is wrong on complex layouts | High | Confidence-gated pairs, anchor-first matching, report divergences, never let low-confidence pairs pass silently |
| Pixel diff noise from fonts/AA | High | Metric-compatible fonts in fixtures, per-channel slack, masked volatile rects, geometry/type axes as independent evidence |
| Rebuild mode plateaus below the target | Medium | Mirror mode is always a valid high-fidelity output; rebuild target is 95 after repair, not 99; report the delta honestly |
| Anti-bot sites block captures | Medium | Typed "blocked" outcome, clean exit, no evasion; corpus documents it |
| Scope creep into a full crawler/CMS | Medium | Non-goals in §1; budgets and route caps; rebuild emits a project, not a product |
| Legal exposure from mirroring | Medium | Opt-in, licence manifest, robots, attribution, README guidance, no redistribution defaults |
| Maintaining two output modes | Medium | Shared capture/score core; mirror is thin; rebuild is the only bespoke generator |
| Live reference drift breaks the flagship gate | High | Flagship gate pinned to measured expectations with provenance; CI uses fixtures; live runs advisory on "reference changed" |
| Performance on large sites | Medium | Route caps, per-host concurrency 1, response cache, streaming artifacts, incremental runs by route |
| CORS-blocked CSSOM / cross-origin sheets | Medium | Computed styles remain authoritative; CSSOM only enriches breakpoints/font URLs; fall back to network capture |
| Deterministic metrics vs. real dynamic sites | Medium | Freeze + mask + advisory downgrade; coverage accounting makes gaps visible |
