# Two-site comparison rig

A single, repeatable capture path for **affectui.com** and the local **copyui** recreation. It is intentionally strict about conditions so that screenshots and numbers from different passes are directly comparable.

## What it captures

Surfaces:

| id | Reference URL | Local URL | Capture |
| --- | --- | --- | --- |
| `home` | `/` | `/` | first viewport |
| `components` | `/components` | `/` → Components | first viewport |
| `detail-chat-composer` | `/components/chat-composer` | `/components/chat-composer` | full page |

Viewports: `1440x900`, `1024x768`, `390x844`.
Themes: `light`, `dark`.

The detail surface exercises the shared `/components/:slug` template. All 17 gallery entries use it, but `chat-composer` is the frame-gated representative because it has the most chrome and a stage-only composer layout. Its reference and local screenshots, and both composites, cover the complete document so below-the-fold layout is scored at all six captures. The full extent is recorded as `capture.width`, `capture.height`, `capture.documentHeight` and `capture.coversDocument` in `metrics.json`.

For every paired surface/viewport/theme it writes:

```text
artifacts/compare/<surface>/<viewport>/<theme>/
  reference.png  # full page for the detail surface, first viewport otherwise
  local.png
  pair.png       # labelled side-by-side, native pixel size; full height for detail
  overlay.png    # reference at 100% + local at 50%; full height for detail
```

Across all captures it writes:

```text
artifacts/compare/metrics.json   # fixed selector map, deterministic; no timestamps
artifacts/compare/report.md      # check table, measured detail values and remaining gaps
```

## Conditions

Both sites go through the same sequence:

1. New browser context with the same viewport, `deviceScaleFactor: 1`, `colorScheme`, and `reducedMotion: "reduce"`.
2. `document.fonts.ready`, then `document.fonts.status === "loaded"`.
3. The reference cookie banner is declined when visible.
4. The requested theme is activated (the local app is seeded through `localStorage` before scripts run).
5. Animations and transitions are disabled with injected CSS; all `document.getAnimations()` are paused.
6. Scroll is forced to `scrollY: 0`; caret is hidden by screenshot options; animations are disabled in the screenshot call itself.
7. Screenshot at 1× (no retina scaling). The detail surface uses Playwright's `fullPage` capture after measuring `document.scrollHeight`; the index and home keep the first viewport.

The reference's pages are public; no authentication is used. Local navigation at mobile widths opens the app's own menu and then selects Components, so the capture follows the same UI path a user does.

A capture retries up to three times only when a required selector is missing. A persistent miss is still a failing check; the retry exists because the live reference occasionally serves an HTML error for a JS module during a cold load.

## Selector map

### Index (`components`)

The same semantic nodes are measured on both sites:

| metric | reference | local |
| --- | --- | --- |
| panel | `main.panel` | `.ds__panel` |
| sidebar | `.sidebar` | `.ds__side` |
| content | `.hero` | `.library` |
| topbar | `.topbar` | `.ds__top` |
| title | `h1` | `.library .page-title` |
| body | `body` | `body` |
| card | `article.card` | `.library-card` |
| title/description/stage | `.card__*` | `.library-card__*` |
| grid | parent of first card | parent of first card |

Each node records its rect, font family/size/weight/line-height/letter-spacing, colour, background, border width/colour, radius, shadow, display and padding. The grid records columns count and gap; cards record count and the first 24 rects.

### Component detail (`detail-chat-composer`)

| metric | reference | local |
| --- | --- | --- |
| panel | `main.panel` | `.ds__panel` |
| sidebar | `.sidebar` | `.ds__side` |
| topbar | `.topbar` | `.ds__top` |
| article | `.doc` | `.doc` |
| breadcrumb | `.breadcrumb` | `.breadcrumb` |
| header | `.doc__header` | `.doc__header` |
| title | `h1.doc__title` | `.doc__title` |
| lead | `.doc__lead` | `.doc__lead` |
| preview section | `.doc__section--preview` | `.doc__section--preview` |
| preview bar | `.preview-bar` | `.preview-bar` |
| stage | `.stage` | `.stage` |
| stage look | `.stage__look` | `.stage__look` |
| composer | `.ui-ccc` | `.ui-cc` |
| selected tab | `.preview-bar button` | `.preview-tab[aria-selected="true"]` |
| body | `body` | `body` |
| first content section | `.doc__article > .doc__section:nth-of-type(2)` | `.doc__section:nth-of-type(2)` |
| content h2/list | first section `.doc__h2` / `.doc__list` | first section `.doc__h2` / `.doc__list` |
| install section | nth-of-type(4) | nth-of-type(4) |
| install card | `.install`, `.install__head`, `.install__cmd` | `.install`, `.install__head`, `.install__cmd` |
| code panel | `.code`, `.code__head`, `.code__body` | `.code`, `.code__head`, `.code__body` |
| API section/table | nth-of-type(7), `.table-wrap`, `.table` | nth-of-type(7), `.table-wrap`, `.table` |
| related grid | `.related` | `.related` |
| footer | `.doc__footer` | `.doc__footer` |
| active sidebar link | `.sidebar .nav-link[aria-current="page"]` | `.ds__nav-item--sub[aria-current="page"]` |
| table of contents | no in-page TOC | no in-page TOC |

The detail surface runs 136 frame checks per capture: the measured top frame plus 11 section headings and their 48px padding, first-section y/width, heading and list type, install width/height/tabs, code width/header/body, API heading/table cells/columns, the 3/1-column related grid and card boxes, the footer spacing, active sidebar state, no-TOC invariant, full-page coverage and 17-component body uniqueness. Values and tolerances are the same class as the index checks: 1px for frame geometry, 0.5px for radii, 0.05px for line-height, exact for font sizes, weights, letter-spacing, colours and column count. Panels without a border at mobile widths do not compare border colour.

The separate **document-height gate** compares reference and local `capture.documentHeight` for all six detail captures. It requires the local total to stay within ±3% of the reference and is stored as `metrics.detailHeight`; it is intentionally outside the 1000 frame checks so the fixed check count remains stable. The detail body uses the reference's measured 629px mobile API table and 220px mobile key column.

The **section-height gate** compares each stable documentation section at every capture using `metrics.detailSections`. It uses a 3% tolerance with a 4px floor. Installation and Usage are explicit exemptions because the reference blocks are Pro-locked; the nine gateable sections pass **54/54**. It is also outside the 1000 check count.

The **component-structure gate** visits all 17 detail routes at 390x844 and checks 11 sections, footer, API table, keyboard rows, usage code, related cards and page-level horizontal overflow. It passes **17/17** and is stored in `metrics.componentStructure`.

`home` is captured but not gated on frame checks: it intentionally keeps the larger marketing display scale. The index uses 30–31 checks per capture; the detail uses 136. The 18 captures total **1000 checks**, plus 6/6 height, 54/54 section and 17/17 structure gates.

## Run

```bash
npm install
npx playwright install chromium
npm run compare
```

The rig starts the local Vite server on `127.0.0.1:3000` if one is not already running, and stops only a server it started. Override targets with `COMPARE_LOCAL_URL` and `COMPARE_REFERENCE_URL`. If the Playwright browser cache is unavailable, point `COMPARE_CHROMIUM_EXECUTABLE` at a compatible Chromium binary; the default remains Playwright-managed.

The current Linux sandbox needs its Chromium shared libraries and fonts on the environment:

```bash
export FONTCONFIG_FILE=/tmp/fonts.conf
export LD_LIBRARY_PATH=$HOME/.local/fontdeps/usr/lib/x86_64-linux-gnu:$HOME/.local/chromium-deps/usr/lib/x86_64-linux-gnu
export PATH=$HOME/.local/fontdeps/usr/bin:$PATH
```

Those paths are environment-specific and are deliberately not checked in.

## Reproducibility

On this host, two consecutive unchanged full-page runs both passed **1000/1000** frame checks, the **6/6 ±3% document-height gate**, the **54/54** gateable section-height checks, the **17/17** structural probe and 17/17 unique bodies, with byte-identical `metrics.json`:

```text
b86dec59d6e80a9f44c39453d1b93553cedc7e3e25b5ed34ea00f2e68effa0c6
```

There are no timestamps, random ids or paths in the metrics. The PNGs are not a byte-stability gate: the reference is live and some previews can change between runs. Re-running after a source change keeps the same file layout, so visual differences can be reviewed against stable metrics.

## Supplemental layout audit

The optional `replica-design` / `replica-diff` skill provides an edge-map layout score. It is a supplement to the frame checks, not a replacement: the layout mode ignores colour, and content-inventory differences reduce the score even when the frame is aligned.

```bash
git clone https://github.com/Jakeschincariol/replica-skill /tmp/replica-skill
python3 /tmp/replica-skill/replica-diff/imgdiff.py \
  artifacts/compare/detail-chat-composer/1440x900/light/reference.png \
  artifacts/compare/detail-chat-composer/1440x900/light/local.png \
  --mode layout \
  --out artifacts/compare/diffs/detail-chat-composer-1440x900-light-full.png
```

Current scores and limitations are recorded in [`artifacts/compare/layout-audit.md`](../../artifacts/compare/layout-audit.md), and the 274-cluster section triage is in [`artifacts/compare/diff-triage.md`](../../artifacts/compare/diff-triage.md). The final diff images are under `artifacts/compare/diffs/`.

## Limits

- These are visual captures, not behavioural parity tests. The detail route's card navigation, browser back/forward, tabs, copy affordances and 390px no-overflow state were smoke-tested separately; keyboard and timer behaviour are not part of the rig.
- The reference site can change independently; a diff can be caused by affectui, not by copyui.
- Font rendering depends on the host's font stack and installed fonts. Geometry and declared font metrics are compared; glyph rasterization is not.
- The detail route renders 11 measured doc sections from a shared data registry; every component has its own body. The chat-composer install/usage panels are generated locally from the measured unlocked button/switch values because the reference page is Pro-locked.
- The detail layout screenshots capture the full page. The local chat-composer document is within 1.87–2.34% of the reference (5625/5732, 6174/6322 and 7157/7317px); the rig's separate ±3% gate passes 6/6. The full-page scores are 45.7/45.5 at 1440, 39.7/39.7 at 1024 and 28.5/28.6 at 390. Remaining score loss comes from the functional local install/usage blocks versus the reference Pro locks, the 17-versus-90 card inventory, and the different sidebar tree. The section and structure gates pass 54/54 and 17/17; the diff triage classifies 196 of 274 regions as intentional/accepted and 78 as review candidates.
