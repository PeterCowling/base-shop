---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: BRIK-ENG-0006
Title: Editable Guide Areas Plan
Business: BRIK
Tags:
  - plan-migration
  - cms
Created: 2026-01-26T00:00:00.000Z
Updated: 2026-01-26T00:00:00.000Z
---
# Editable Guide Areas Plan

**Source:** Migrated from `guide-area-editor-plan.md`


# Editable Guide Areas Plan

## Summary

Enable content editors to select which site areas a guide publishes to (Experiences, Help, How to get here) via the editorial panel UI. Currently, areas are hardcoded in TypeScript (`guide-manifest.ts`) and require developer intervention to change.

## Success Signals (What “Good” Looks Like)

- Editors can change a guide’s areas + primary area from the editorial panel and see the updated pills immediately.
- The changes persist (refresh/new tab) and are reflected anywhere routing/grouping is derived from the manifest (e.g., base namespace selection).
- Invalid configurations are prevented (at least one area selected; primary area must be one of the selected areas).
- Changes are gated behind guide authoring + preview token and do not impact production runtime unless explicitly enabled.

## Audit Updates (2026-01-26)

Concrete repo findings that reduce implementation risk and remove unknowns:

- `apps/brikette/src/routes/guides/guide-manifest.ts` is imported by client-side guide rendering (via `GuideContent.tsx`), so **it must remain browser-safe** (no `fs` imports).
- Namespace routing/grouping is already derived from manifest areas in `apps/brikette/src/guides/slugs/namespaces.ts`, but `GUIDE_BASE_KEY_OVERRIDES` currently takes precedence over the manifest for many keys; this would make “editable areas” ineffective without adjusting precedence.

[... see full plan in docs/plans/guide-area-editor-plan.md]
