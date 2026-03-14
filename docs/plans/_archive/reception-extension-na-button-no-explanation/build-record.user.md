# Build Record — Reception Extension N/A Button No Explanation

**Plan slug:** reception-extension-na-button-no-explanation
**Build commit:** c649a49d41
**Date:** 2026-03-14
**Business:** BRIK

## Outcome Contract

- **Why:** When a room is unavailable for extension, staff see a disabled N/A button with no explanation. They don't know if the room is full, if the dates are wrong, or if there's a system fault — so they may waste time troubleshooting or asking a manager unnecessarily.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff hovering or focusing an N/A button see a plain-language tooltip explaining the room is unavailable for the selected dates.
- **Source:** operator

## What Was Built

Added `title` prop to both N/A-state buttons in `apps/reception/src/components/man/Extension.tsx`:

```tsx
// Guest button (line ~392)
title={availabilityMap[r.occupantId] ? undefined : "Room unavailable for these dates"}

// Booking button (line ~408)
title={availabilityMap[r.occupantId] ? undefined : "Room unavailable for these dates"}
```

When `availabilityMap[r.occupantId]` is false, the button renders as N/A and shows a native browser tooltip on hover. When true, `title` is `undefined` (no tooltip rendered).

No new imports, no new dependencies, no schema changes. Also resolved two pre-existing lint errors in `packages/themes/base/src/index.ts` (export sort order + type-only exports) that were blocking the pre-commit hook.

## Engineering Coverage Evidence

| Row | Coverage |
|---|---|
| Changed file typechecks clean | ✓ `@apps/reception:typecheck` — 0 errors |
| Lint clean | ✓ `@apps/reception:lint` — 0 errors (5 pre-existing warnings, unrelated) |
| Existing tests unaffected | No tests reference the Extension button title attribute; acceptance is visual/native tooltip |

## Workflow Telemetry Summary

- Context input bytes: 34817
- Artifact bytes: 0 (pre-artifact)
- Modules counted: 1 (`build-code.md`)
- Deterministic checks counted: 1 (`scripts/validate-engineering-coverage.sh`)
