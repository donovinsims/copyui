# Full-page diff triage

Generated from the stable `replica-diff --mode layout` JSONs in this directory and the final `metrics.json` section rectangles. The detail captures cover the **complete document**, so the regions include the top frame, sidebar, all 11 documentation sections, related cards and footer.

The layout score is an edge-placement score, not a percentage of matched pixels. A score of 28.5 at 390px does not mean the page is only 28.5% correct; the 390px view has 93–97 diff clusters, most of them inside the intentionally scrollable API table.

## Method

- Each diff region is a cluster of differing edge cells. Regions can span several sections.
- A region is assigned to the section with the greatest vertical overlap.
- A region wholly left of the content column is assigned to **Sidebar**.
- **Top frame** covers everything above the first documentation section.
- **Footer margin** is the space between the last section and the footer; the footer itself is assigned separately.
- Counts are per viewport and theme; `L/D` means light/dark.

## Region counts

| Bucket | 1440 L/D | 1024 L/D | 390 L/D | Total | Classification |
| --- | ---: | ---: | ---: | ---: | --- |
| Top frame | 3/3 | 7/7 | 15/17 | 52 | accepted shell |
| Sidebar | 3/3 | 4/4 | 0/0 | 14 | accepted inventory/nav |
| When to use | 0/0 | 0/0 | 2/2 | 4 | review |
| When not to use | 0/0 | 0/0 | 0/0 | 0 | — |
| Installation | 0/0 | 1/1 | 2/2 | 6 | intentional Pro-lock |
| Usage | 1/1 | 2/2 | 2/1 | 9 | intentional Pro-lock |
| Examples | 3/2 | 6/6 | 4/5 | 26 | intentional Pro-lock/no live demo |
| API reference | 2/3 | 6/6 | 44/45 | 106 | 89 accepted mobile table; 17 review |
| Keyboard interactions | 0/0 | 0/0 | 12/12 | 24 | review |
| Accessibility | 0/1 | 1/1 | 5/5 | 13 | review |
| Motion | 0/0 | 0/1 | 3/4 | 8 | review |
| Responsive behavior | 0/0 | 0/0 | 2/2 | 4 | review |
| Guides | 1/1 | 0/0 | 1/1 | 4 | review |
| Footer | 1/1 | 0/0 | 1/1 | 4 | review |
| **Total** | **14/15** | **27/28** | **93/97** | **274** | |

## Classification

### Intentional or accepted — 196 regions

- **Top frame (52):** the local docs shell and theme controls are not the reference marketing/detail chrome.
- **Sidebar (14):** local navigation groups and the 17-item library differ from the reference 90-item tree.
- **Installation (6), Usage (9), Examples (26):** the reference blocks are Pro-locked. The local page keeps functional install/usage panels and four real public-prop code examples.
- **API reference at 390 (89):** the 629px table scrolls inside the 358px wrapper. The reference uses the same mobile table width; this is an intentional contained overflow, not page overflow.

### Review / fixable candidates — 78 regions

- **API reference at 1440/1024 (17):** desktop/tablet table alignment and row wrapping.
- **Keyboard interactions (24):** mostly the 390px key/action table.
- **Accessibility (13), Motion (8), Responsive behavior (4), When to use (4), Guides (4), Footer (4):** smaller spacing and text-position differences.

No phase 1 source changes were made. These are candidates for a future visual pass, not confirmed defects. The section-height gate already checks their vertical distribution; the remaining differences are horizontal alignment, wrapping and shell content.

## Why this does not reopen the total-height result

The total-height gate is **6/6** at **-1.87%**, **-2.34%** and **-2.19%**. The section gate is **54/54** across the nine non-exempt sections. Installation and Usage are explicitly exempt because their reference content is unavailable. The diff clusters are therefore visual distribution and content-inventory differences, not a missing page body.
