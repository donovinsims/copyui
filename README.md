# copyui

An owned, self-hosted design system for AI-product interfaces: a Next.js App Router gallery, a
token layer, 32 self-contained React 19 components and a shadcn-compatible registry that serves
those components from this app.

copyui is an independent implementation. The visual language was studied by measuring the
rendered [affectui.com](https://www.affectui.com) interface — computed styles, geometry, timings —
and normalising the values into tokens. Two components are vendored from affectui's MIT-licensed
free source; everything else is original code. No Pro (paid) component or asset is used, and no
affectui brand asset ships here. See [Licensing and attribution](#licensing-and-attribution).

```
Next.js 15 App Router · React 19 · TypeScript · no Tailwind in components
no animation library · no runtime dependencies beyond React · MIT
```

## Run it

```bash
npm install
npm run dev        # http://localhost:3000  (binds 0.0.0.0)
npm run typecheck  # tsc --noEmit
npm run build      # production build
npm run registry:build  # regenerate src/registry/generated.ts
```

Node 20 or newer. The registry route is served by the same dev server, so
`http://localhost:3000/r/button.json` works as soon as `npm run dev` is up.

## Install a component

Every component is one `.tsx` file with its CSS in a template string. The registry serves the
real source file plus the small `lib/` helpers it imports, so the shadcn CLI can write a working
copy into any React project (Tailwind not required).

Direct URL:

```bash
npx shadcn@latest add http://localhost:3000/r/button.json
```

Short name — register the namespace once in the consuming project's `components.json`:

```json
{
  "registries": {
    "@copyui": "http://localhost:3000/r/{name}.json"
  }
}
```

```bash
npx shadcn@latest add @copyui/button
npx shadcn@latest add @copyui/chat-composer
```

What lands:

```
components/ui/button.tsx      the component (styles injected at runtime)
lib/css.ts                    the 12-line injectCss helper
lib/utils.ts                  cx() and the small format helpers
```

Import the design tokens once in the consuming app (`src/styles/tokens.css` here) and render:

```tsx
import { Button } from "@/components/ui/button";

export function Example() {
  return <Button variant="primary">Save changes</Button>;
}
```

The registry also lists sibling components as `registryDependencies`, so
`@copyui/agent-inbox` pulls `avatar` and `badge` with it. `npm run registry:check` fails in CI if
`src/registry/generated.ts` is out of date with the component sources.

| Endpoint | Returns |
| --- | --- |
| `GET /r/<slug>.json` | `registry-item` JSON: `name`, `type`, `title`, `description`, `dependencies`, `registryDependencies`, `files[]` |
| unknown slug | `404` with the available slugs |

## Gallery

The app is the gallery. Every page has the light/dark toggle in the header; the choice is stored
in `localStorage` and applied before paint by an inline bootstrap script.

| Route | Page |
| --- | --- |
| `/` | Overview: the system's look, live specimens and entry points |
| `/components` | Every shipped component, live, filterable by category |
| `/components/category/{chat,agent,inputs,surfaces}` | One category page per group, every component rendered live |
| `/components/<slug>` | Detail: live preview, code, install command, props, keyboard, accessibility, motion, responsive |
| `/foundations` | Colour, type, radius, elevation, spacing |
| `/tokens` | The token groups and their values |
| `/patterns` | Composed product patterns |
| `/motion` | Motion primitives and their reduced-motion behaviour |

## Tokens

`src/styles/tokens.css` is the single source of truth. It has two layers: editorial values
(`--bg`, `--ink`, `--accent`, `--r-lg`, `--shadow-*`, `--dur-*`, …) and semantic aliases
(`--ui-card`, `--ui-ink`, `--ui-accent`, `--ui-r-md`, `--ui-dur`, …). Components read only the
`--ui-*` layer, so rebranding is one block rather than a find-and-replace.

| Group | Examples |
| --- | --- |
| Colour roles | `--bg`, `--panel`, `--card`, `--sunken`, `--text`, `--ink-soft`, `--line`, `--solid`, `--accent`, `--ok`, `--warn`, `--danger` |
| Typography | `--font-sans`, `--font-mono`, `--text-2xs` … `--text-5xl`, `--leading-*`, `--tracking-*`, `--weight-*` |
| Radii | `--r-xs`, `--r-sm`, `--r-md`, `--r-lg`, `--r-xl`, `--r-2xl`, `--r-pill`, scaled by `--radius-scale` |
| Shadows | `--shadow-panel`, `--shadow-card`, `--shadow-hairline`, `--shadow-lift`, `--shadow-pop`, `--shadow-inset-top` |
| Spacing | `--s-0` … `--s-15` on a 4px base, plus `--gutter`, `--content-max`, `--prose-max` |
| Motion | `--dur-fast|--dur|--dur-slow|--dur-morph`, `--ease`, `--ease-pop`, `--ease-morph` |
| Focus | `--focus`, `--focus-ring` (components use `2px solid var(--ui-focus)` with a 2–3px offset) |
| Iconography | `--icon-xs` … `--icon-xl`, `--icon-stroke` |
| Layers | `--z-base`, `--z-raised`, `--z-sticky`, `--z-dropdown`, `--z-overlay`, `--z-modal`, `--z-toast`, `--z-tooltip` |

Dark mode is `data-theme="dark"` or `.dark` on an ancestor. `prefers-reduced-motion: reduce`
collapses every duration token to 1ms and stops the remaining animations.

## Components

32 components, all in `src/components/ui/`, each a single `.tsx` file.

| Group | Components |
| --- | --- |
| Primitives (10) | Button, Text Field, Text Area, Select, Combobox, Checkbox, Switch, Segmented Control, Tag Input, OTP Input |
| Chat (5) | AI Answer, Chat Composer, Message Actions, Thinking Loader, Code Block |
| Agent (5) | Tool Call Card, Reaction Bar, Approval Card, Model Picker, Agent Inbox |
| Surfaces (5) | Card, Badge, Avatar, Meter, Tooltip |
| Motion (7) | Number Ticker, Text Reveal, Shimmer, Tilt Card, Gradient Text, Grid Background, Blur Crossfade |

House style, enforced by review rather than by a linter:

- one file per component, CSS in a template string, injected once by `injectCss`;
- no Tailwind class names, no animation library, no dependencies beyond React;
- native elements underneath custom paint (a real `<button>`, `<input>`, `<select>`, checkbox);
- visible focus on every interactive element, keyboard support for every custom widget, and
  `aria-*` state that matches what is on screen;
- `prefers-reduced-motion` honoured — the settled state is always legible without animation.

## Repository layout

```
app/                      Next.js App Router: layout, gallery routes, registry route handler
  r/[slug]/route.ts       self-hosted shadcn registry
src/components/ui/        the 32 shipped components (one file each)
src/lib/                  injectCss, cx/format helpers, hooks, icons
src/styles/               tokens.css (source of truth) + base.css
src/docs/                 gallery pages, specimens, detail template
src/registry/generated.ts generated registry items (committed; rebuilt by script)
registry/manifest.mjs     registry titles, descriptions, categories
scripts/registry/         registry generator
scripts/compare/          original one-off affectui comparison rig
tool/                     general capture/match/assert comparison engine (Phases 0–2)
skills/                   vendored Superpowers skills (excluded from the build)
artifacts/                committed reports and metrics from the comparison work
```

## Accessibility

- Semantic landmarks and native controls; no `div`-buttons.
- Focus is always visible: a 2px ring at a 2px offset, or the field's 3px accent wash.
- Custom widgets implement the expected keyboard model — the combobox uses
  `aria-activedescendant` with Arrow/Home/End/Enter/Escape, the segmented control uses roving
  tabindex with arrow keys, the tag input adds with Enter/comma and removes with Backspace,
  the OTP input supports paste and arrow navigation.
- Errors are text plus colour, never colour alone; hints and errors are wired with
  `aria-describedby` and `aria-invalid`.
- Motion respects `prefers-reduced-motion` at both the token and component level.

## Verification

```bash
npm run typecheck        # tsc --noEmit
npm run build            # production build
npm run registry:check   # generated registry is current
node -e 'fetch("http://localhost:3000/r/button.json").then(r=>r.json()).then(j=>console.log(j.name, j.type, j.files.length))'
```

## Comparison engine (historical)

`tool/` is a separate, site-agnostic capture/match/assert engine built alongside copyui; Phases 0–2
of [PLAN.md](PLAN.md) are implemented. It is not part of the app or the registry.

```bash
npm test                     # unit tests + offline browser fixtures
npm run compare:fixtures     # identical fixture passes, mutated fixture fails
node tool/cli.mjs scan https://example.com
node tool/cli.mjs compare --config examples/affectui/compare.config.mjs   # the flagship
```

The original hand-written rig is still available as `npm run compare`; it now starts this Next.js
app as the local side.

## Licensing and attribution

| Part | Origin | Licence |
| --- | --- | --- |
| `app/`, `src/`, `tool/`, `scripts/`, token layer | Original work for copyui | MIT (`LICENSE`) |
| `src/components/ui/CodeBlock.tsx`, `src/components/ui/ReactionBar.tsx` | Vendored from [flohoeller/affectui](https://github.com/flohoeller/affectui) `components/code-block.tsx` and `components/reaction-bar.tsx` | MIT, © 2026 Florian Höller |
| Remaining `src/components/ui/*` | Original implementation; behaviour and visual language studied from the MIT-licensed free affectui components and the measured live site | MIT |
| `skills/` | Vendored from [obra/superpowers](https://github.com/obra/superpowers) at `22f0b46` | MIT, © 2025 Jesse Vincent |

**What is upstream MIT.** Two agent-facing components — Code Block and Reaction Bar — are copied
from affectui's free, MIT-licensed source, with their behaviour unchanged. Their upstream licence
notice is reproduced in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and linked from each
file's header. `--aui-*` variables from upstream are mapped onto copyui tokens in `tokens.css`.

**What is derived.** The token values, type scale, radii, elevation, motion timings and the visual
language of the other 30 components were derived by measuring the rendered affectui.com interface
and reading its public documentation (`llms.txt`, `/design-system`, `/docs`). They are
reimplementations, not copies, and share names and purpose rather than source.

**What is original.** The token architecture (`--ui-*` semantic layer), every non-vendored
component implementation, the gallery and its pages, the registry format and generator, the
comparison engine in `tool/`, and the documentation in this repository.

**What is deliberately absent.** affectui Pro components, illustrations, paid assets and brand
marks are not present, not reproduced and not obtainable through this repository. If you want the
original library, buy it from [affectui.com](https://www.affectui.com).

**Skills.** `skills/` vendors the Superpowers methodology library for offline use by agents.
`tsconfig.json` excludes it and nothing imports it, so it is not part of the build. See
`skills/README.md` for the upstream commit and update process.

## Limits

- copyui is a design system, not a copy of affectui's catalogue; only the free, public surface was
  studied.
- Some gallery pages are dense; the components themselves are the deliverable and are all
  keyboard-reachable.
- The comparison engine needs Chromium via Playwright for its fixture tests, and network access
  for the optional live flagships.
- No auth, database, analytics or CMS ships with this project, by design.
