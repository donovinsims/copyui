# Superpowers skills (vendored)

This directory is a **vendor copy** of the skills library from
[obra/superpowers](https://github.com/obra/superpowers), kept here so agents working on
copyui have the same methodology available offline.

- Upstream commit: `22f0b463e7a5e579904dd6211a520321035526f7`
- Upstream licence: MIT — Copyright (c) 2025 Jesse Vincent (see `LICENSE`)
- Vendored on: 2026-11-17
- Changes: copied as-is. Nothing in this directory is imported by the app or the registry.

## Excluded from the build

- `tsconfig.json` excludes `skills/**`, so `tsc --noEmit` never walks these files.
- Next.js only compiles what `app/` and `src/` import; no module here is imported.
- The registry generator only reads `src/components/ui` and `src/lib`.

To update, copy the upstream `skills/` directory over this one and update the commit above.
