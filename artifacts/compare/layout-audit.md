# Supplemental layout audit

Tool: [`Jakeschincariol/replica-skill`](https://github.com/Jakeschincariol/replica-skill), `replica-diff/imgdiff.py`. The skill is not vendored in this repository.

Method: the audit's layout mode rasterises both pages at 480px width, splits them into a 12-column grid and compares edge density. It ignores colour and is not a percentage of matched pixels. It supplements the fixed-selector frame checks; it does not replace them.

```bash
git clone https://github.com/Jakeschincariol/replica-skill /tmp/replica-skill
python3 /tmp/replica-skill/replica-diff/imgdiff.py \
  artifacts/compare/components/1440x900/light/reference.png \
  artifacts/compare/components/1440x900/light/local.png \
  --out artifacts/compare/diffs/components-1440x900-light.png
```

Final scores, generated from the last `npm run compare` captures:

| Viewport | Light | Dark |
| --- | ---: | ---: |
| 1440x900 | 61.8 | 61.6 |
| 1024x768 | 64.0 | 63.7 |
| 390x844 | 60.9 | 60.9 |

The first audit, before the measured card-preview scaling and chrome pass, scored 54.7 / 54.3 at 1440, 51.7 / 50.6 at 1024 and 45.4 / 45.2 at 390. The six final edge maps are in `artifacts/compare/diffs/`.

## Why the score is not 100

- The local index has 17 cards; the reference lists 90 components. The visible card inventory necessarily differs.
- The local sidebar has its own navigation groups and brand; the reference has a much deeper 90-item tree and different tabs.
- The local home is the docs shell, while the reference home is a separate marketing page. `home` is intentionally not frame-gated.
- `detail-chat-composer` is reference-only until the detail template exists; it is not scored as a local surface.
- The layout audit sees only edge placement. It does not measure typeface, colour, copy, assets or interaction.

## Reproducibility

Two consecutive unchanged rig runs both passed 184/184 frame checks and produced byte-identical `metrics.json`. The PNGs are not promised to be byte-identical because the reference is live and some previews can change; use the metrics and generated composites for comparison.
