---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: xa-uploader-accessibility
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260312150000-C010
Related-Plan: none
---

# XA Uploader Accessibility Micro-Build

## Scope
- Change:
  - `FilterSelect` (EditProductFilterSelector.client.tsx): add `aria-controls` + `id` on listbox, `aria-activedescendant` + option IDs, ArrowUp/ArrowDown/Enter keyboard navigation
  - `ThemeToggle` (ThemeToggle.client.tsx): change mount-only DOM attribute sync from `useEffect` → `useLayoutEffect` to eliminate theme flash before paint
- Non-goals:
  - Image alt text (already fully i18n'd with `t()` keys in EN and ZH)
  - Save/publish coordination (already enforced via `peerBusyRef` + `combinedSaveDisabled`)
  - Full WCAG 2.1 AA audit beyond the two surface fixes above

## Execution Contract
- Affects:
  - `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx`
  - `apps/xa-uploader/src/components/ThemeToggle.client.tsx`
- Acceptance checks:
  - `FilterSelect` trigger button has `aria-controls` pointing to a `<ul id>` when open
  - `FilterSelect` trigger button has `aria-activedescendant` pointing to focused option ID when open
  - Arrow keys move virtual focus; Enter selects focused option and closes
  - Escape still closes
  - `ThemeToggle` mounts without flash (attribute applied before paint via `useLayoutEffect`)
- Validation commands:
  - `pnpm --filter @acme/xa-uploader typecheck`
  - `pnpm --filter @acme/xa-uploader lint`
- Rollback note: revert two files; no data migration

## Outcome Contract
- **Why:** Staff using screen readers or keyboard-only navigation cannot properly operate the product filter dropdown — it lacks the ARIA cues assistive technology needs to announce state and navigate options. The theme flashes on every page load.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Filter dropdown exposes `aria-controls`, `aria-activedescendant`, and option IDs; Arrow/Enter/Escape keyboard navigation works; ThemeToggle applies the correct theme class before first paint (no flash)
- **Source:** operator
