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

| Viewport | Light | Dark |
| --- | ---: | ---: |
| 1440x900 | 61.8 | 61.6 |
| 1024x768 | 64.0 | 63.7 |
| 390x844 | 60.9 | 60.9 |

### Component detail (`detail-chat-composer`)

| Viewport | Light | Dark |
| --- | ---: | ---: |
| 1440x900 | 64.8 | 64.6 |
| 1024x768 | 59.0 | 59.4 |
| 390x844 | 62.8 | 63.4 |

The first index audit, before the measured card-preview scaling and chrome pass, scored 54.7 / 54.3 at 1440, 51.7 / 50.6 at 1024 and 45.4 / 45.2 at 390. The detail surface did not exist locally in that audit. The final edge maps are in `artifacts/compare/diffs/`.

## Measured detail geometry

These values come from the live reference DOM and are enforced by the 55 detail frame checks per capture, not only by the layout score:

| Viewport | Article | Top bar | Title | Lead | Preview bar | Stage | Composer |
| --- | --- | ---: | --- | --- | ---: | --- | --- |
| 1440x900 | 894px @ x397 | 44px | 32/44 · 600 | 674×32 | 54px | 894×520 · 45px | 680×172 |
| 1024x768 | 702px @ x285 | 44px | 32/44 · 600 | 674×32 | 86px | 702×520 · 45px | 612×172 |
| 390x844 | 358px @ x16 | 45px | 32/44 · 600 | 358×56 | 96px | 358×400 · 52px 16px | 326×172 |

The detail title's measured `-0.8px` letter-spacing, stage-look sizes (804×430 / 612×430 / 326×296), tab frame and panel/sidebar geometry are also checked. See `report.md` for the generated table.

## Why the score is not 100

- The local index has 17 cards; the reference lists 90 components. The visible card inventory necessarily differs.
- The local sidebar has its own navigation groups and brand; the reference has a much deeper 90-item tree and different tabs.
- The local home is the docs shell, while the reference home is a separate marketing page. `home` is intentionally not frame-gated.
- The detail page's top frame is aligned, but its preview toolbar is a reduced set of the reference's model/provider icons, and its below-the-fold `Props & variants` layout is original local documentation rather than the reference's usage sections.
- The layout audit sees only edge placement. It does not measure typeface, colour, copy, assets or interaction.

## Reproducibility

Two consecutive unchanged rig runs both passed **514/514** frame checks and produced byte-identical `metrics.json`:

```text
ebfc70b20da68c251d0e0360f1326e289b3517664334e9d75dd78ae19d168148
```

The PNGs are not promised to be byte-identical because the reference is live and some previews can change; use the metrics and generated composites for comparison.
