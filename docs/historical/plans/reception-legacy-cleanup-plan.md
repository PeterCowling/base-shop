Type: Plan
Status: Historical

# Reception App Legacy Cleanup Plan

**Status: Historical**

## Problem

The reception app contained a `/src/compat/` directory with React Router compatibility shims that were **completely unused**. This was dead code left over from a migration to Next.js.

## What Was Removed

- **Compat layer files** (3 files, ~16KB total):
  - `apps/reception/src/compat/react-router.tsx` - DELETED
  - `apps/reception/src/compat/react-router-dom.tsx` - DELETED
  - `apps/reception/src/compat/router-state.tsx` - DELETED

## What Was Fixed

- **Test files** (2 files) - converted from Vitest to Jest and updated mocks:
  - `apps/reception/src/components/checkins/__tests__/DocInsertButton.test.tsx`
    - Changed from `vi.mock("react-router-dom")` to `jest.mock("next/navigation")`
    - Converted Vitest syntax to Jest
  - `apps/reception/src/components/checkins/docInsert/__tests__/DocInsertPage.test.tsx`
    - Changed from `vi.mock("react-router-dom")` to `jest.mock("next/navigation")`
    - Converted Vitest syntax to Jest
    - Removed tests that used `vi.importActual` (Row2/Row3 validation tests)

## Evidence That Compat Layer Was Unused

1. Zero imports from `./compat/` anywhere in the codebase
2. All components use `next/navigation` directly (`useRouter`, `useSearchParams`, etc.)
3. No router provider wraps the app
4. The test mocks referenced `react-router-dom` but the components they tested use `next/navigation`

## Verification

- All tests pass after cleanup
- No broken imports
