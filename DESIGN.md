# Reverse-engineering dossier

How the affectUI look was taken apart, what was measured, and how the result was rebuilt as a
repeatable system. This is the document to read before adding a component.

---

## 1. Method

The three reference projects informed *how* to investigate, not what to copy:

| Project | Principle applied here |
| --- | --- |
| **REA** (`morluto/rea`) | Evidence over vibes. Every conclusion carries the observation behind it and a stated limitation. Inspect the running artefact, not a screenshot of it. |
| **Craft Anything** (`storytold/craft-anything`) | **Clean room.** Work from what a visitor can see: rendered text, measured layout, colours, fonts, spacing, opened menus. Do not read the original's source, assets or paid files. |
| **reverse-skill** (`zhaoxuya520/reverse-skill`) | Evidence → Finding → Path. Record the observation, name the rule it implies, then implement and verify the rule in the rebuild. |

**Scope gate.** The target is a commercial component library. Only its *public documentation* and
*rendered interface* were examined. No paid source files, no bundled JS, no brand assets, no copy of
component code. The output is an independent implementation intended for the user's own product.

**Limitations, stated plainly.**

- Measurements come from the marketing site and public docs, not from every Pro component.
- The site is responsive and has its own marketing tokens; component tokens (`--ui-*`) were read
  from rendered specimens, the page chrome from computed styles.
- Behavioural specs (keyboard, countdown, morph) are reconstructed from the public documentation
  and from operating the previews; they are close, not byte-identical.
- Fonts other than Inter (if the original swaps them for display) were not available to inspect;
  the rebuilt type scale uses Inter throughout.

---

## 2. Evidence ledger

| Observation | Value | Confidence | Implication |
| --- | --- | --- | --- |
| Body font | `Inter, ui-sans-serif, system-ui, -apple-system, sans-serif` | High — computed style | Inter everywhere, system fallback only |
| Base font size | `13px` | High | A deliberately dense desktop UI, not 16px web default |
| Display size / weight | `40px / 44px`, `500`, `-1.4px` (`-0.035em`) | High | Big type is *medium* weight with tight tracking |
| Body ink | `#0a0a0a` | High | Near-black, never pure `#000` for text |
| Muted ink | `#737373` | High | Neutral-500 equivalent |
| Canvas | `#f5f5f5`; panel `#fcfcfc`; card `#fff`; preview `#fafafa` | High — CSS variables | Three near-white levels separate page, rail and card |
| Border | `#e5e5e5`; hairline `rgba(0,0,0,.06–.07)` | High | Depth is a line, not a shadow |
| Primary control | `#171717` on white, pill radius | High | Solid near-black is the primary action |
| Accent | `#2f6bff` / `#5e3ee0` (marketing), `rgba(0,96,226,.765)` (components) | Medium — two surfaces differ | One blue-violet signal; components use a calmer variant |
| Radii | panel 18, card 14, preview 10, pill 999 | High — variables | Radius is a scale, not ad-hoc |
| Shadows | `0 0 0 .5px rgba(0,0,0,.06), 0 1px 1px -1px …, 0 1px 2px …` | High | A 0.5px ring does the work of a border |
| Popover shadow | `0 4px 42px rgba(0,0,0,.06), … , 0 0 0 1px` | High | Wide, very low-alpha, ringed |
| Standard ease | `cubic-bezier(.22,1,.36,1)`, `180ms` | High — variables | One dominant ease-out |
| Spring ease | `cubic-bezier(.34,1.5,.64,1)` | High | Overshoot only for thumbs/badges |
| Morph ease | `cubic-bezier(.32,.72,0,1)`, `380ms` | High | Resolve rows and content swaps |
| Status tones | ok `#007d2e` on ~10% wash; warn `#cc4e00`; danger `#d72400` | High | Tinted badges, not saturated fills |
| Density | control heights 26–34px, 4px rhythm, 13px labels | Medium | Small, calm, high information density |
| Behaviour | press → 97%; width glides on label change; loading sweeps a band; reduced motion stops the sweep | High — docs | Micro-interactions are part of the brand |

### Findings → paths

1. **Finding:** the interface is almost achromatic; colour appears only for work-in-progress, focus,
   citations and status.
   **Path:** neutral ramp carries surfaces; `--accent` is reserved for state and links; statuses get
   their own fixed tones.
2. **Finding:** depth is achieved with sub-pixel rings and 1px hairlines, not elevation glows.
   **Path:** two shadow recipes (`card`, `hairline`) plus a `pop` recipe for overlays; no coloured
   shadows anywhere.
3. **Finding:** geometry is soft but not bubbly — 14/18px on surfaces, full pills on controls.
   **Path:** a single `--radius-scale` multiplier; pills stay 999 so controls never become blobs.
4. **Finding:** typography tightens as it grows and never exceeds weight 500 for headings.
   **Path:** explicit tracking tokens (`display`, `heading`, `body`, `caps`).
5. **Finding:** motion is short, eased-out, and attached to state changes.
   **Path:** 120/180/280/380 durations with three curves; loops only for live work; everything
   collapses under reduced motion.

---

## 3. Token specification

```
editorial layer                     semantic layer (components read only these)
─────────────────────────────       ──────────────────────────────────────────
--bg --panel --card --preview       --ui-card --ui-tray --ui-sunken
--text --text-muted --text-subtle   --ui-ink --ui-text --ui-muted --ui-faint
--line --hairline                   --ui-line --ui-line-strong
--solid --on-solid                  --ui-solid --ui-on-solid
--accent --accent-2                 --ui-accent --ui-accent-soft --ui-focus
--ok --warn --danger                --ui-ok --ui-warn --ui-danger (+ -bg)
--r-xs … --r-xl --r-pill            --ui-r-xs … --ui-r-pill
--shadow-card/-hairline/-pop        --ui-shadow --ui-shadow-pop
--ease --dur-*                      --ui-ease --ui-dur-*
```

**Type scale:** 10, 11, 12, 13, 14, 16, 20, 26, 32, 40, 52 px.
**Weights:** 400 body, 500 everything interactive/heading, 600 reserved for tiny initials.
**Space:** 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 64.
**Dark theme:** canvas `#08080a`, panel `#101012`, card `#151517`, line `#26262a`, ink `#ededed`,
solid inverts to `#f2f2f2` so the primary button stays the brightest object.

---

## 4. Component behaviour contracts

Each of these is implemented and visible in the running gallery.

### Button
- Variants: primary (solid), secondary (fill), ghost, destructive (solid red).
- Sizes 26 / 32 / 40px; touch pointers grow to 36 / 40 / 46.
- Press scales to 97% with the fast curve.
- Loading: left icon becomes a spinner, label keeps its text but gets a moving light band,
  `aria-busy="true"`, clicks ignored, focus retained.
- Icon-only buttons are square and require `aria-label`.
- Label changes remount the label with a 3px blur-in.

### Segmented control
- Indicator is measured (`offsetLeft`/`offsetWidth`), not percentage-based, so labels of any width
  glide correctly; `ResizeObserver` + `document.fonts.ready` re-measure.
- Roving tabindex, `Arrow`/`Home`/`End` move and select; pill and underline variants.
- Counts are tabular and tint to the accent only when selected.

### Switch
- `role="switch"`, `aria-checked`, label + description inside one hit area.
- Thumb overshoots on the pop curve; track goes solid ink, never accent.

### Field
- 34px height, 1px `--hairline-strong`, 3px accent wash on focus.
- Errors are a message *and* a red outline + `aria-invalid`.

### Thinking loader
- Eight rays with negative animation delays; phase label rolls every `interval` ms.
- `done` swaps rays for a drawn check and the label for `Thought for Ns`; resets if `done` goes false.
- Whole pill is `role="status" aria-live="polite"`; visual shimmer copy is `aria-hidden`.

### Chat composer
- Autogrowing textarea (44→168px), Enter sends, Shift+Enter newline.
- Three menus (model, folder, apps); focus stays on the trigger, highlight is communicated with
  `aria-activedescendant`; `↑/↓/Home/End/Enter/Esc/Tab` handled; click-outside closes.
- “Request approval” shows `aria-busy` for `loadMs`.
- Dictation appends the demo transcript word by word with a pulsing recording dot.
- At <520px the approval label and folder name collapse to icons; app marks keep their place.

### AI answer
- Mini markdown: blank line = paragraph, `- ` = list, `**bold**`, `[1]`/`[1,3]` = citation chips.
- Streams by word at `speed` words/second; caret visible while writing; `aria-busy` while streaming.
- Source cards scroll horizontally; citation chips show a source preview on hover/focus.
- Actions render only after writing stops; copy → check for 1.6s; thumbs-down reveals reasons.

### Tool call card
- One-line summary + live timer; expanded arguments are syntax-tinted, result is copyable.
- Running uses a dashed spinner; error keeps a red panel and a retry action.

### Approval card
- Risk drives the icon tile and badge tone, never the primary button colour.
- Details sit in a recessed preview panel; optional `always` checkbox.
- Countdown ticks only while pending, pauses on pointer/focus, turns amber ≤10s, expires into a
  denied resolved row with `Undo`. Programmatic focus of the container (after Undo) does not pause
  it; keyboard focus inside the card does.
- `⌘/Ctrl+Enter` approves, `Esc` denies; buttons expose `aria-keyshortcuts`.
- Approve awaits the returned promise, shows a spinner, then morphs to the resolved row.

### Agent inbox
- Filters recompute counts from data; running rows tick every second.
- Rows expand to a step timeline with done/current marks and state-appropriate actions.
- Cost is tabular and right-aligned.

### Model picker
- Bars fill on hover/focus; the tray previews first-token latency and price for the hovered model.
- Extended thinking uses a switch; effort control unfolds with a 220ms scaleY. Effort is stateful
  when uncontrolled and switches to fully controlled when `onEffortChange` is supplied.

### Message actions
- Copy → check; regenerate spins then reveals a version menu; feedback colours; read-aloud swaps to
  a five-bar equaliser.

### Motion effects
- `NumberTicker`: per-digit columns, 22ms stagger, counts in on first view, accessible label.
- `TextReveal`: word/letter pieces with 4px blur rise, triggered by IntersectionObserver.
- `Shimmer`: one sweep speed shared by blocks and text.
- `TiltCard`: ≤8°, pointer glare, spring reset, disabled for touch/reduced motion.
- `GradientText`: four-stop sweep once, then a 9s drift.
- `GridBackground`: 28px grid drifting one cell per 32s under a radial mask.
- `BlurCrossfade`: 5px blur swap with height measured and morphed on the morph curve.
- Reduced motion (`prefers-reduced-motion: reduce`): token durations collapse to 1ms and every
  effect's loop or travel is removed while state still changes.
  - `NumberTicker` settles on the value without a count-in roll: no 22ms digit stagger, no strip
    transition.
  - `TextReveal` renders every piece at full opacity with no blur, transform or stagger.
  - `Shimmer` stops the block sweep; `ShimmerText` drops its gradient and renders solid
    `--ui-muted`.
  - `TiltCard` ignores pointer movement: no rotation, no glare.
  - `GradientText` holds `background-position: 0% 50%`; no one-shot sweep and no 9s drift.
  - `GridBackground` renders a static grid with no drift.
  - `BlurCrossfade` swaps height and content immediately (transition collapsed to 1ms, entrance
    animation off).
  - `AgentInbox` stops the live dot, the running-row pulse and the panel entrance.

---

## 5. How to extend without breaking the look

1. **Start from tokens.** If a new component needs a colour that does not exist, it is probably a
   status, not a new brand colour.
2. **Pick an elevation.** Page → card → popover. Never a fourth.
3. **Use the type roles.** 13px UI, 14px reading, 500 headings, one tracking token per role.
4. **Choose a duration by consequence.** Feedback 120ms, surface 180–280ms, content morph 380ms.
5. **Prefer a hairline to a shadow**; prefer a tonal badge to a coloured row.
6. **State must be readable without colour** — pair every tone with a word, icon or dot.
7. **Respect the contract**: native element, accessible name, visible focus, live region for async
   state, reduced-motion fallback.

### Definition of done for a new component

- [ ] One file, styles inside, only React + `injectCss` (+ intentional primitive imports)
- [ ] Reads `--ui-*` only; no literal hex/rgba in component CSS
- [ ] Works in light and dark without a theme branch
- [ ] Keyboard path documented and implemented
- [ ] `aria-busy`/`aria-live` where async or streaming
- [ ] Reduced-motion path verified
- [ ] Added to the gallery with a one-line behaviour note

---

## 6. Attribution

Design language studied: **affectUI** by Flo Höller (affectui.com). This dossier records
measurements and inferred rules for an independent personal build. It contains no affectUI source,
Pro files or brand assets, and is not endorsed by or affiliated with affectUI.
