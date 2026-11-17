# Supplemental layout audit

Tool: [`Jakeschincariol/replica-skill`](https://github.com/Jakeschincariol/replica-skill), `replica-diff/imgdiff.py`. The skill is not vendored in this repository.

Method: the audit's layout mode rasterises both pages at 480px width, splits them into a 12-column grid and compares edge density. It ignores colour and is not a percentage of matched pixels. It supplements the fixed-selector frame checks; it does not replace them.

The detail surface feeds the **complete document** into the screenshots and the score. The index remains a first-viewport comparison. Detail numbers are not comparable to the earlier first-viewport audit: they include every documentation section, the related cards, the footer and the full body.

```bash
git clone https://github.com/Jakeschincariol/replica-skill /tmp/replica-skill
mkdir -p artifacts/compare/diffs
python3 /tmp/replica-skill/replica-diff/imgdiff.py \
  artifacts/compare/detail-chat-composer/1440x900/light/reference.png \
  artifacts/compare/detail-chat-composer/1440x900/light/local.png \
  --mode layout \
  --out artifacts/compare/diffs/detail-chat-composer-1440x900-light-full.png
```

## Current scores

Generated from the stable `npm run compare` captures.

### Library index (`components`)

These remain first-viewport scores. All six index pairs reported `height_delta_pct: 0.0`.

| Viewport | Light | Dark |
| --- | ---: | ---: |
| 1440x900 | 61.8 | 61.6 |
| 1024x768 | 64.0 | 63.7 |
| 390x844 | 60.9 | 60.9 |

### Component detail (`detail-chat-composer`, full page)

The documentation body was rebuilt from the reference structure: 17 API props, 8 keyboard rows, 5 accessibility items, 5 motion items, 3 responsive items and 4 named examples. The document-height gate passes at **6/6 captures**, the section-height gate passes **54/54** gateable sections, and the 390px structural probe passes **17/17** detail routes.

| Viewport | Light | Dark | Height gap |
| --- | ---: | ---: | ---: |
| 1440x900 | 45.7 | 45.5 | -1.87% |
| 1024x768 | 39.7 | 39.7 | -2.34% |
| 390x844 | 28.5 | 28.6 | -2.19% |

| Viewport | Before local | After local | Reference | After gap |
| --- | ---: | ---: | ---: | ---: |
| 1440x900 | 4380px | 5625px | 5732px | -1.87% |
| 1024x768 | 4569px | 6174px | 6322px | -2.34% |
| 390x844 | 5061px | 7157px | 7317px | -2.19% |

Before the rebuild, the full-page detail scores were 36.7 / 36.6 at 1440, 35.8 / 35.7 at 1024 and 25.4 / 25.4 at 390. Every viewport improved after the body was expanded. The reference/local PNG dimensions now match the document table exactly, and both sides report `capture.coversDocument: true` at every capture.

The 390px API table intentionally scrolls horizontally at its measured 629px width with 155/128/126/220 columns; the keyboard table stays at the 358px container with a fixed 220px key column. Those are the reference's mobile table dimensions and were required to avoid false wrapping.

### Section-height gate

The gate compares every stable documentation section against the live reference at all six captures. It uses a 3% tolerance with a 4px floor and is stored separately in `metrics.detailSections`; it does not change the 1000 frame-check count.

| Section | Max gap across six captures | Status |
| --- | ---: | --- |
| When to use | 0.00% | pass |
| When not to use | 0.00% | pass |
| Installation | 26.43% | exempt — Pro-locked |
| Usage | 128.57% | exempt — Pro-locked |
| Examples | 1.86% | pass |
| API reference | 1.60% | pass |
| Keyboard interactions | 0.21% | pass |
| Accessibility | 0.00% | pass |
| Motion | 0.00% | pass |
| Responsive behavior | 0.00% | pass |
| Guides | 0.00% | pass |

`54/54` gateable section measurements pass; Installation and Usage are deliberately exempt because their reference bodies are unavailable.

### Structural and mobile verification

A separate browser probe visits all **17** local detail routes at 390x844 and checks 11 sections, footer, API table, keyboard rows, usage code, related cards and page-level overflow. It passes **17/17**. The chat-composer route keeps `documentElement.scrollWidth` at **390**, a **358px** table wrapper with **629px** scroll content, 17 API rows, and a **358px** keyboard table with a **220px** key column. All 17 routes remain free of page-level horizontal overflow; only the contained API table scrolls.

### Full-page diff triage

The 274 diff clusters are recorded in [`diff-triage.md`](diff-triage.md): **196** are intentional or accepted (top shell, 17-vs-90 sidebar inventory, Pro-locked sections and the 390px contained API table) and **78** are review/fixable candidates in the stable body, mostly desktop API alignment and 390px keyboard/accessibility spacing. This is a triage, not a claim that those 78 are defects.

### Locked-content decision

At 1440 the reference Installation block is 414px and the local functional panel is 304.58px; reference Usage is 175px and local Usage is 400px. Replacing the functional pair with exact lock geometry would move the 1440 total from 5625px to about 5509px (-3.9%), outside the ±3% gate, because there is no accessible replacement content to restore the difference. The local functional Install/Usage panels are therefore kept, with no spacer; they are the two explicit section-gate exemptions.

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

The detail route is one measured template driven by the shared registry. Each of the 17 components has its own description, category, variants, usage sample, examples and props/API rows. The openness gate hashes the below-the-stage section text, variant chips, code samples and API prop names for every component: **17/17 unique body signatures**. A single shared body fails the rig.

## Why the score is not 100

- The local body is within 2.4% of the reference height, but its distribution still differs: the local Installation and Usage panels stay functional, while the reference replaces them with Pro lock blocks. This preserves usable local documentation at the cost of some exact section distribution.
- The reference's four example bodies are Pro-locked. Their real titles are reproduced; the local bodies are concise code examples built from the public props rather than the inaccessible Pro demos.
- The local index has 17 cards; the reference lists 90 components. The visible card inventory necessarily differs.
- The local sidebar has its own navigation groups and brand; the reference has a much deeper 90-item tree and different tabs.
- The local home is the docs shell, while the reference home is a separate marketing page. `home` is intentionally not frame-gated.
- The audit sees only edge placement. It does not measure typeface, colour, copy, assets or interaction.

## Reproducibility

Two consecutive unchanged full-page runs both passed **1000/1000** frame checks, the **6/6 ±3% document-height gate**, the **54/54** gateable section-height checks, the **17/17** structural probe and 17/17 unique bodies, with byte-identical `metrics.json`:

```text
b86dec59d6e80a9f44c39453d1b93553cedc7e3e25b5ed34ea00f2e68effa0c6
```

The detail surface runs 136 frame checks per capture, with the document-height, section-height and structural gates stored separately in `metrics.detailHeight`, `metrics.detailSections` and `metrics.componentStructure`. The PNGs are not promised to be byte-identical because the reference is live and some previews can change; use the metrics and generated composites for comparison.
