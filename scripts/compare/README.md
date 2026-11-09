# Two-site comparison rig

A single, repeatable capture path for **affectui.com** and the local **copyui** recreation. It is intentionally strict about conditions so that screenshots and numbers from different passes are directly comparable.

## What it captures

Surfaces:

| id | Reference URL | Local URL |
| --- | --- | --- |
| `home` | `/` | `/` |
| `components` | `/components` | `/` → Components |
| `detail-chat-composer` | `/components/chat-composer` | reference only (the template does not exist yet) |

Viewports: `1440x900`, `1024x768`, `390x844`.
Themes: `light`, `dark`.

For every paired surface/viewport/theme it writes:

```text
artifacts/compare/<surface>/<viewport>/<theme>/
  reference.png
  local.png
  pair.png       # labelled side-by-side, native pixel size
  overlay.png    # reference at 100% + local at 50%
```

Across all captures it writes:

```text
artifacts/compare/metrics.json   # fixed selector map, deterministic; no timestamps
artifacts/compare/report.md      # check table + missing-template note
```

## Conditions

Both sites go through the same sequence:

1. New browser context with the same viewport, `deviceScaleFactor: 1`, `colorScheme`, and `reducedMotion: "reduce"`.
2. `document.fonts.ready`, then `document.fonts.status === "loaded"`.
3. The reference cookie banner is declined when visible.
4. The requested theme is activated (the local app is seeded through `localStorage` before scripts run).
5. Animations and transitions are disabled with injected CSS; all `document.getAnimations()` are paused.
6. Scroll is forced to `scrollY: 0`; caret is hidden by screenshot options; animations are disabled in the screenshot call itself.
7. Screenshot the viewport at 1× (no retina scaling).

The reference's pages are public; no authentication is used. Local navigation at mobile widths opens the app's own menu and then selects Components, so the capture follows the same UI path a user does.

## Selector map

`components` is the alignment surface. The same semantic nodes are measured on both sites:

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

`checksFor()` compares reference and local within explicit tolerances: 1px for frame geometry, 0.5px for radii, 0.05px for line-height, exact values for font sizes, weights, letter-spacing, colours and column count. Panels without a border at mobile widths do not compare border colour.

`home` is captured but not gated on frame checks: it intentionally keeps the larger marketing display scale. `detail-chat-composer` is reference-only until the detail template exists; the report records that as the next unit of work instead of pretending the index is that template.

## Run

```bash
npm install
npx playwright install chromium
npm run compare
```

The rig starts the local Vite server on `127.0.0.1:3000` if one is not already running, and stops only a server it started. Override targets with `COMPARE_LOCAL_URL` and `COMPARE_REFERENCE_URL`.

The current Linux sandbox needs its Chromium shared libraries and fonts on the environment:

```bash
export FONTCONFIG_FILE=/tmp/fonts.conf
export LD_LIBRARY_PATH=$HOME/.local/fontdeps/usr/lib/x86_64-linux-gnu:$HOME/.local/chromium-deps/usr/lib/x86_64-linux-gnu
export PATH=$HOME/.local/fontdeps/usr/bin:$PATH
```

Those paths are environment-specific and are deliberately not checked in.

## Reproducibility

On this host, two consecutive unchanged runs both passed 184/184 checks and produced byte-identical `metrics.json`. There are no timestamps, random ids or paths in the metrics. The PNGs are not a byte-stability gate: the reference is live and some previews can change between runs. Re-running after a source change keeps the same file layout, so visual differences can be reviewed against stable metrics.

## Supplemental layout audit

The optional `replica-design` / `replica-diff` skill provides an edge-map layout score. It is a supplement to the frame checks, not a replacement: the layout mode ignores colour, and content-inventory differences reduce the score even when the frame is aligned.

```bash
git clone https://github.com/Jakeschincariol/replica-skill /tmp/replica-skill
python3 /tmp/replica-skill/replica-diff/imgdiff.py \
  artifacts/compare/components/1440x900/light/reference.png \
  artifacts/compare/components/1440x900/light/local.png \
  --out artifacts/compare/diffs/components-1440x900-light.png
```

Current scores and limitations are recorded in [`artifacts/compare/layout-audit.md`](../../artifacts/compare/layout-audit.md). The six final diff images are under `artifacts/compare/diffs/`.

## Limits

- These are visual captures, not behavioural parity tests. Interactions (keyboard, focus, timers) are not exercised.
- The reference site can change independently; a diff can be caused by affectui, not by copyui.
- Font rendering depends on the host's font stack and installed fonts. Geometry and declared font metrics are compared; glyph rasterization is not.
- The detail template is absent locally and is shown as a documented gap, not a passing capture.
