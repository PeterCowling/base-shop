---
Type: Build-Record
Status: Complete
Feature-Slug: xa-uploader-design-token-migration
Build-date: 2026-02-28
artifact: build-record
---

# Build Record — XA Uploader Design Token Migration

## What was done

Removed all design-system lint exemptions (XAUP-0001) from 14 XA uploader UI component files.

**Wave 1 (TASK-01):** Defined gate tokens as CSS aliases in `globals.css` (`--gate-ink`, `--gate-muted`, `--gate-bg`, `--gate-accent` → base theme variables). Registered all recurring arbitrary values as Tailwind utilities (`text-gate-ink`, `text-gate-muted`, `tracking-label*`, `text-2xs`). Removed the raw hex inline style block from `UploaderHome.client.tsx`.

**Wave 2 (TASK-02–04, parallel):** Migrated all 13 remaining component files — 4 shell/simple components, 3 panel components, 7 product form components. Replaced every arbitrary Tailwind value with the new utilities. Removed blanket `/* eslint-disable */` from each file and replaced with targeted inline disables only for violations explicitly out of scope (operator-desktop tap size, layout primitives for a non-layout primitive migration, hardcoded test-id attributes).

**Checkpoint (TASK-05):** Verified final state: `pnpm --filter xa-uploader lint` reports 0 errors, 4 warnings (all pre-existing `security/detect-non-literal-fs-filename` in a route handler — out of scope). `pnpm --filter xa-uploader typecheck` reports 0 errors.

## Outcome Contract

- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 14 XA uploader UI component files pass design system lint rules with no XAUP-0001 design-token exemptions.

## Commits

- `7b3ea02ef9` — Wave 1: gate tokens, globals.css utilities, UploaderHome cleanup
- `34af986922` — Wave 2: 13 remaining UI components migrated

## Unexpected findings resolved without scope expansion

1. `complexity` violations in `CatalogProductBaseFields` (25 paths) and `CatalogProductClothingFields` (21 paths) — hidden by blanket disable. Resolved with targeted `// eslint-disable-next-line complexity` per function.
2. `max-lines-per-function` in `CatalogProductBaseFields` (317 lines) — same cause. Added to same targeted disable line.
3. `ds/no-hardcoded-copy` on `type="datetime-local"` attribute — rule fires on input type string literals as well as copy. Resolved with targeted disable.
4. `eslint --fix` auto-corrected focus ring pattern incorrectly (`focus:ring-2` → `focus-visible:focus:ring-2` double-prefix). Fixed manually to `focus-visible:ring-2`.
5. `ds/min-tap-size` rule fires on `className` attribute line, not the `<button>` element opening tag — inline disables must be placed between JSX attributes immediately before `className`.
