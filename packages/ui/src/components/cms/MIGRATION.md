# Migration: Move CMS UI out of @acme/ui

This folder contains CMS- and page‑builder‑specific UI. It will be moved to dedicated domain packages:

- `@acme/page-builder-core` — state, reducers, utils (no React)
- `@acme/page-builder-ui` — React canvas, panels, DnD, rulers, comments, versions, collab
- `@acme/cms-marketing` — campaigns, discounts, segments, email scheduling
- `@acme/templates` — app/domain templates and blocks

Tests for these areas should run in `apps/cms` (integration) or their new packages. While migration is in progress, the `packages/ui` coverage excludes this folder.
