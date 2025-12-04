Type: Guide
Status: Reference
Domain: CMS
Last-reviewed: 2025-12-02

# Migration: Sections-First Pages

This guide outlines a safe path to migrate existing pages to the new Sections-first model.

How to use this doc now:

- This is a **targeted migration playbook** for upgrading legacy pages to the Sections-first Page Builder model.
- Before running new migrations, cross-check with:
  - `docs/cms/cms-charter.md` and Page Builder docs (`docs/pagebuilder-library.md`, `docs/page-builder-metadata.md`) to confirm assumptions still hold.

Overview
- Goal: enforce `Section` at the root of every page so the Page Builder works in Sections mode without flags.
- Strategy: wrap any legacy root nodes in a `Section` container with minimal visual changes.

Steps
- Inventory pages and detect legacy roots (anything not `Section`).
- For each legacy page:
  - Create a new `Section` node as the first/root component.
  - Move the previous root component into `section.children[0]`.
  - Initialize optional `Section` fields conservatively (no background, undefined `textTheme` and `heightPreset`).
  - Preserve ids for all existing components to avoid breaking links; only the new `Section` gets a new id.
- Save as a draft and allow publish via CMS once reviewed.

CLI Script (suggested)
- Implement a script at `scripts/src/migrate-sections.ts` that:
  - Reads pages via `@acme/platform-core/repositories/pages/index.server`.
  - Applies the wrapping transformation where needed.
  - Writes back via `savePage` with a new history entry.

CMS One‑Click
- Provide a button in `/cms/shop/{shop}/pages` to trigger the migration for the current shop.
- Show a summary of affected pages and a confirmation step before running.

Post‑Migration
- Remove the `NEXT_PUBLIC_PB_SECTIONS_ONLY` flag and make Sections-only the default in `rules.ts`.
- Enable palette filtering (already enforced) and keep DnD root constraints.

Rollback
- Since the change only wraps roots, rollback consists of unwrapping the single child from the root `Section` when no Section-specific fields were set.

Notes
- Large shops: run in batches and paginate the pages list to avoid memory spikes.
- Backups: export a snapshot of pages prior to migration.
