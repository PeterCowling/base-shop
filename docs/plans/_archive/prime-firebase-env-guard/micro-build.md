---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-firebase-env-guard
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-004
Related-Plan: docs/plans/_archive/prime-resilience-and-test-fixes/micro-build.md
---

# Prime Firebase Env Guard — Micro-Build

## Note

This dispatch (PRIME-004) was built as part of the `prime-resilience-and-test-fixes` batched
micro-build wave alongside PRIME-002, PRIME-005, and PRIME-006. The implementation is committed
in `fb9e37369f`. This document exists to close the queue-state record for the dedicated dispatch.

See: `docs/plans/_archive/prime-resilience-and-test-fixes/micro-build.md`

## Scope

- Change: Log a clear `console.error` at client startup when any of the 3 required Firebase env
  vars are missing (`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`,
  `NEXT_PUBLIC_FIREBASE_PROJECT_ID`).
- Non-goals: throwing an exception at startup; changing happy-path Firebase behaviour.

## Execution Contract

- Affects: `apps/prime/src/services/firebase.ts`
- Acceptance checks:
  - Missing vars produce an actionable `console.error` log before any Firebase calls.
  - No change to behaviour when all vars are present.
- Validation commands: `pnpm --filter @apps/prime typecheck`
- Rollback note: remove the `if (typeof window !== 'undefined') { ... }` guard block added at
  lines 69-83.

## Build Evidence

- Commit: `fb9e37369f` — "fix(prime): resilience wave — code cache TTL, refetch logging, Firebase guard, TC-03"
- Guard block added at `apps/prime/src/services/firebase.ts:69-83`.
- Typecheck passed (confirmed via `prime-resilience-and-test-fixes` build record).

## Outcome Contract

- **Why:** Firebase initialises silently with empty strings when env vars are absent, making all
  subsequent real-time data failures look like data problems rather than configuration problems.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** On startup, Firebase config is validated — if any required env
  var is absent, a clear error is logged before any Firebase calls are attempted.
- **Source:** operator
