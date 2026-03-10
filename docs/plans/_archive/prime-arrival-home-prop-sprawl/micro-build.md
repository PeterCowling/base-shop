---
Type: Micro-Build
Status: Archived
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: prime-arrival-home-prop-sprawl
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309120000-0003
Related-Plan: none
---

# ArrivalHome Prop Sprawl Micro-Build

## Scope
- Change: Group the five code-loading props on `ArrivalHomeProps` (`checkInCode`, `isCodeLoading`, `isCodeStale`, `isOffline`, `onRefreshCode`) into a single `ArrivalCodeState` interface passed as one `codeState` prop. Export the interface so callers and tests can import it cleanly.
- Non-goals: No changes to runtime behaviour, no API changes, no new dependencies, no changes to other components.

## Execution Contract
- Affects:
  - `apps/prime/src/components/arrival/ArrivalHome.tsx` — define `ArrivalCodeState`, rewrite `ArrivalHomeProps`, destructure from `codeState` in the component body
  - `apps/prime/src/components/homepage/GuardedHomeExperience.tsx` — update the single `<ArrivalHome>` call site to pass `codeState={{ ... }}`
  - `apps/prime/src/components/arrival/__tests__/ArrivalHome.offline-fallback.test.tsx` — update `defaultProps` and all per-test prop objects to use `codeState`
  - `apps/prime/src/components/arrival/__tests__/ArrivalHome.tokens.test.tsx` — update inline props to use `codeState`
  - `apps/prime/src/components/arrival/__tests__/ArrivalHome.ds-migration.test.tsx` — update `defaultProps` and all renders to use `codeState`
  - `apps/prime/src/components/arrival/__tests__/utility-actions.test.tsx` — update all `<ArrivalHome>` renders to use `codeState`
  - `apps/prime/src/components/pre-arrival/__tests__/CashPrep.test.tsx` — update the `<ArrivalHome>` render at TC-03 to use `codeState`
- Acceptance checks:
  1. TypeScript builds without errors (`pnpm typecheck`)
  2. ESLint passes (`pnpm lint`)
  3. No file in the prime app still references the bare prop names `checkInCode`, `isCodeLoading`, `isCodeStale`, `isOffline`, `onRefreshCode` on `ArrivalHome` (i.e., not as JSX attributes on `<ArrivalHome`)
- Validation commands:
  - `pnpm --filter prime typecheck`
  - `pnpm --filter prime lint`
- Rollback note: Pure rename — revert all touched files. No data migrations, no API surface changes.

## Outcome Contract
- **Why:** ArrivalHome had 11 props; five of them are a single domain concept (code loading state) passed individually. Grouping them makes the call site self-documenting and reduces prop sprawl without changing any behaviour.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** ArrivalHome prop count reduced from 11 to 7 (firstName, codeState, preArrivalData, cashAmounts, nights, onChecklistItemClick, keycardStatus + optional className) by grouping the five code-loading props into a single `ArrivalCodeState` config object.
- **Source:** operator
