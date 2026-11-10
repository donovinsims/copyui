# copyui

A clean-room, token-driven recreation of the **affectUI** design language: the same premium feel
for AI-product interfaces — quiet neutral surfaces, hairline depth, pill controls, one blue-violet
accent, and motion that explains state.

This is an **independent implementation of the visible design**, built by measuring the rendered
site (computed styles, geometry, timings) and normalising those values into a system. No affectUI
source, assets or branding are copied. The original library is proprietary; if you want its actual
files, buy a licence from [affectui.com](https://www.affectui.com).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run build      # type-check + production build
```

React 19 · TypeScript · Vite · no Tailwind · no animation library · no runtime dependencies beyond
React.

## What is inside

| Area | Files |
| --- | --- |
| Token source of truth | `src/styles/tokens.css`, `tokens.json`, `src/data/tokens.ts` |
| Reset & base type | `src/styles/base.css` |
| Primitives | `src/components/ui/Button.tsx`, `Badge`, `Card`, `SegmentedControl`, `Switch`, `Field`, `Tooltip`, `Avatar`, `Meter` |
| AI surfaces | `ThinkingLoader`, `ChatComposer`, `AIAnswer`, `MessageActions`, `ModelPicker`, `ToolCallCard` |
| Agent operations | `ApprovalCard`, `AgentInbox` |
| Motion effects | `NumberTicker`, `TextReveal`, `Shimmer`, `TiltCard`, `GradientText`, `GridBackground`, `BlurCrossfade` |
| Docs / gallery | `src/docs/*`, shell in `src/App.tsx` |
| Reverse-engineering dossier | `DESIGN.md` |

Open the app and use the header controls to change **accent**, **radius**, **elevation** and
**theme** — every specimen re-skins live.

## The architecture

### 1. Two layers of tokens

```css
:root {
  /* editorial: what the page is made of */
  --bg: #f5f5f5;
  --card: #fff;
  --text: #0a0a0a;
  --accent: #2f6bff;
  --r-lg: calc(14px * var(--radius-scale));

  /* semantic: what components read */
  --ui-card: var(--card);
  --ui-ink: var(--ink);
  --ui-accent: var(--accent);
  --ui-r-lg: var(--r-lg);
}
```

Components only ever use `--ui-*`. That is what makes rebranding a one-block change rather than a
find-and-replace.

### 2. One file per component

Every component is a single `.tsx` file that imports only React, the tiny `injectCss` helper and
sibling primitives where it genuinely composes. Its CSS lives in a template string at the top of
the file and is injected once into `<head>`:

```tsx
import { injectCss } from "../../lib/css";

const CSS = `.ui-btn { … }`;
injectCss("ui-button", CSS);

export function Button(…) { … }
```

That keeps components portable: copy `Button.tsx` + `lib/css.ts` into another project and it works,
with or without Tailwind.

### 3. Theme by attributes

```html
<html data-theme="dark">
```

Dark mode is a variable swap (`.dark` also works). Elevation modes are
`data-elevation="flat | layered"`. Reduced motion collapses the duration tokens to 1ms and stops
looping animations.

### 4. Motion grammar

| Token | Value | Use |
| --- | --- | --- |
| `--dur-fast` | 120ms | hover, press |
| `--dur` | 180ms | menus, borders |
| `--dur-slow` | 280ms | indicator glide |
| `--dur-morph` | 380ms | resolve rows, crossfades |
| `--ease` | `cubic-bezier(.22,1,.36,1)` | almost everything |
| `--ease-pop` | `cubic-bezier(.34,1.5,.64,1)` | switch thumb |
| `--ease-morph` | `cubic-bezier(.32,.72,0,1)` | height morphs |

## Rebranding

```css
:root {
  --accent: #0f9d6a;
  --accent-2: #0e7490;
  --radius-scale: 0.9;
}

:root[data-theme="dark"] {
  --accent: #59d18c;
}
```

Platform status colours (`--ok`, `--warn`, `--danger`) are intentionally *not* derived from the
accent: an approval is amber regardless of brand.

## Copying into your project

1. Copy `src/styles/tokens.css` and import it once.
2. Copy `src/lib/css.ts` (12 lines).
3. Copy the component file you need, plus any primitives it imports (`Button` imports nothing but
   React and `css.ts`; `AgentInbox` also imports `Avatar`, `Badge`, `useInterval`).
4. Keep your own accent overrides in a selector with higher specificity than the component file.

## Accessibility contract

- Native elements first; buttons are buttons, inputs are inputs.
- Focus rings only for keyboard users (`:focus-visible`), 2px at 55% accent.
- Icon-only controls require `aria-label`; decorative SVG is `aria-hidden`.
- Agent state changes are announced through polite live regions; shortcut hints are visual only
  while the real bindings (`⌘↵`, `Esc`) work.
- `prefers-reduced-motion` is honoured across every effect.
- Colour never carries meaning alone: statuses pair a tone with a word and a dot.

## Two-site comparison rig

`npm run compare` captures affectui.com and this app under the same viewport, theme, font and
frozen-animation conditions, then writes side-by-side composites, 50% overlays, fixed-selector
metrics and a check report to `artifacts/compare/`.

The detail surface now captures and scores the **entire page**, not only the first viewport, so the
documentation body contributes to every layout score. The body carries the reference's full API,
keyboard, accessibility, motion, responsive and named-example content, and its document length is
within 1.87–2.34% of the reference at all three widths. The latest run passes **1000/1000** frame
checks, a **6/6 ±3% document-height gate**, a **54/54 gateable section-height gate**, a **17/17
structural probe** and a **17/17 body-uniqueness gate** across 1440x900, 1024x768 and 390x844 in
light and dark. Two unchanged runs produced byte-identical `metrics.json`. See
`scripts/compare/README.md` for setup, `artifacts/compare/report.md` for the measured values,
`artifacts/compare/layout-audit.md` for the full-page scores and before/after heights, and
`artifacts/compare/diff-triage.md` for the 274-cluster intentional-versus-review split.

Screenshots are generated locally and ignored by Git; `metrics.json`, `report.md` and
`layout-audit.md` are checked in.

## Licence & attribution

Original design language: affectUI by Flo Höller. This repository is an independent study for
personal use; it reproduces measurements and interaction patterns, not source code. Refer to
affectUI's licence before redistributing anything that mimics its commercial components.
