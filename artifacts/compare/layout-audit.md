# Supplemental layout audit

Tool: [`Jakeschincariol/replica-skill`](https://github.com/Jakeschincariol/replica-skill), `replica-diff/imgdiff.py`. The skill is not vendored in this repository.

Method: the audit's layout mode rasterises both pages at 480px width, splits them into a 12-column grid and compares edge density. It ignores colour and is not a percentage of matched pixels. It supplements the fixed-selector frame checks; it does not replace them.

```bash
git clone https://github.com/Jakeschincariol/replica-skill /tmp/replica-skill
python3 /tmp/replica-skill/replica-diff/imgdiff.py \
  artifacts/compare/detail-chat-composer/1440x900/light/reference.png \
  artifacts/compare/detail-chat-composer/1440x900/light/local.png \
  --mode layout \
  --out artifacts/compare/diffs/detail-chat-composer-1440x900-light.png
```

## Final scores

Generated from the stable `npm run compare` captures. All six detail and six index pairs reported `height_delta_pct: 0.0`.

### Library index (`components`)

The index code was unchanged in this pass; these are the recorded index scores from the preceding audit.

| Viewport | Light | Dark |
| --- | ---: | ---: |
| 1440x900 | 61.8 | 61.6 |
| 1024x768 | 64.0 | 63.7 |
| 390x844 | 60.9 | 60.9 |

### Component detail (`detail-chat-composer`)

Every detail pair improved on its recorded baseline; no capture regressed.

| Viewport | Light (baseline → final) | Dark (baseline → final) |
| --- | ---: | ---: |
| 1440x900 | 64.8 → **67.4** | 64.6 → **67.0** |
| 1024x768 | 59.0 → **67.7** | 59.4 → **68.5** |
| 390x844 | 62.8 → **74.2** | 63.4 → **73.9** |

The first index audit, before the measured card-preview scaling and chrome pass, scored 54.7 / 54.3 at 1440, 51.7 / 50.6 at 1024 and 45.4 / 45.2 at 390. The detail surface did not exist locally in that audit. The final edge maps are in `artifacts/compare/diffs/`.

## Measured detail geometry

These values come from the live reference DOM and are enforced by the detail frame checks, not only by the layout score:

| Viewport | Article | Top bar | Title | Lead | Preview bar | Stage | Composer |
| --- | --- | ---: | --- | --- | ---: | --- | --- |
| 1440x900 | 894px @ x397 | 44px | 32/44 · 600 | 674×32 | 54px | 894×520 · 45px | 680×172 |
| 1024x768 | 702px @ x285 | 44px | 32/44 · 600 | 674×32 | 86px | 702×520 · 45px | 612×172 |
| 390x844 | 358px @ x16 | 45px | 32/44 · 600 | 358×56 | 96px | 358×400 · 52px 16px | 326×172 |

The detail title's measured `-0.8px` letter-spacing, stage-look sizes (804×430 / 612×430 / 326×296), panel/sidebar geometry and preview controls are also checked.

The 36px tab capsule, 28px style/theme controls at the measured 8px/4px gaps, 180px capsule width, 30px prompt tools, 75px Copy button and the 551.7px / 510px right cluster at 1440 / 1024 are checked as part of the same frame.

## Measured documentation body

Measured from the live button, switch and chat-composer detail pages at all three widths and both themes. The body starts directly under the preview section; the first content section is at `y845` (1440), `y877` (1024) and `y783` (390).

| Viewport | Sections | First H2 | Install | Code | API table | Related | Footer | Sidebar state |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 11 | 20/24 · 600 · -0.4px | 894×86.58 | 894×40 head · 12.5/21 | 894 · 4 cols | 3 cols · 291.33×159.16 | `20px 0 32px` · 12px | Chat Composer active, no TOC |
| 1024x768 | 11 | 20/24 · 600 · -0.4px | 702×86.58 | 702×40 head · 12.5/21 | 702 · 4 cols | 3 cols · 227.33×177.16 | `20px 0 32px` · 12px | Chat Composer active, no TOC |
| 390x844 | 11 | 20/24 · 600 · -0.4px | 358×86.58 | 358×40 head · 12.5/21 | 358 · 4 cols | 1 col · 358×122.58 | `20px 0 32px` · 12px | Chat Composer active, no TOC |

Section order: **When to use → When not to use → Installation → Usage → Examples → API reference → Keyboard interactions → Accessibility → Motion → Responsive behavior → Guides**.

Every section abuts the previous one and opens with 48px top padding. The install card has a 40px header and 46.58px command row; the package-manager selector is 200×30 and the installation tabs are 34px. The code panel has a 40px header and a 12.5/21 body at `14px 16px`; the API table has a 40px header, 4 columns, 13/20 cells at `12px 14px` and a 12px radius. Related cards use a 10px gap, 8px top padding, 14px card padding and the measured 12px radius.

## Per-component content

The detail route is one measured template driven by the shared registry. Each of the 17 components has its own description, category, variants, usage sample, two examples and props/API rows. The openness gate hashes the below-the-stage section text, variant chips, code samples and API prop names for every component: **17/17 unique body signatures**. A single shared body now fails the rig.

## Why the score is not 100

- The local index has 17 cards; the reference lists 90 components. The visible card inventory necessarily differs.
- The local sidebar has its own navigation groups and brand; the reference has a much deeper 90-item tree and different tabs.
- The local home is the docs shell, while the reference home is a separate marketing page. `home` is intentionally not frame-gated.
- The chat-composer page is Pro-locked on the reference; its install and usage panels are mirrored locally from the measured unlocked button/switch geometry. The reference CTA above the stage is not reproduced as a locked state.
- The layout audit compares the first viewport. At 1024 the body starts below the 768px screenshot, and at 1440 only the first heading edge is visible; the 1024 improvement therefore comes from the measured toolbar and top frame, while the 390 pair includes several document sections.
- The audit sees only edge placement. It does not measure typeface, colour, copy, assets or interaction.

## Reproducibility

Two consecutive unchanged rig runs both passed **988/988** frame checks and produced byte-identical `metrics.json`:

```text
faf2b2e2f4117991d138f104f004ac6ab3c170ea16d4e963f965c4fdce5b5dc3
```

The detail surface now runs 134 checks per capture, including every measured document section and the 17-component uniqueness gate. The PNGs are not promised to be byte-identical because the reference is live and some previews can change; use the metrics and generated composites for comparison.
