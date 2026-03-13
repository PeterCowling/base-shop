---
Type: Build-Record
Feature-Slug: prime-firebase-env-guard
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-004
Business: BRIK
Completed: 2026-03-13
Execution-Track: code
artifact: build-record
---

# Prime Firebase Env Guard — Build Record

## What Was Done

Added a client-side startup guard to `apps/prime/src/services/firebase.ts` (lines 69-83).

When the module loads in a browser context, it checks whether the three required Firebase env
vars are set:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

If any are missing, `console.error` is called immediately with the list of missing variable names
and a note that all real-time data calls will fail. This fires before any Firebase calls are
attempted, giving the deploying engineer a clear diagnosis at startup rather than cryptic data
errors later.

Built as part of the `prime-resilience-and-test-fixes` batched micro-build wave (commit
`fb9e37369f`). This plan record closes the standalone queue entry for PRIME-004.

## Outcome Contract

- **Why:** Firebase initialises silently with empty strings when env vars are absent, making all
  real-time data failures look like data problems rather than configuration problems.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** On startup, Firebase config is validated — if any required env
  var is absent, a clear error is logged before any Firebase calls are attempted.
- **Source:** operator

## Engineering Coverage Evidence

Single-file change in `apps/prime/src/services/firebase.ts`. Typecheck (`pnpm --filter @apps/prime typecheck`) passed clean (confirmed via `prime-resilience-and-test-fixes` build record). validate-engineering-coverage.sh: valid (micro-build lane). Bug scan: 0 findings scoped to changed file.

## Workflow Telemetry Summary

- Feature slug: `prime-firebase-env-guard`
- Records: 1
- Token measurement coverage: 0.0%

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-build | 1 | 1.00 | 37285 | 2131 | 0.0% |

- Context input bytes: 37285
- Artifact bytes: 2131
- Modules counted: 1
- Deterministic checks counted: 1

Note: stages missing records (lp-do-ideas, lp-do-fact-find, lp-do-plan) because this dispatch
was a direct-dispatch micro-build that bypassed the full fact-find/plan flow, and PRIME-004 was
built within the `prime-resilience-and-test-fixes` batched wave.

Built within batched wave: prime-resilience-and-test-fixes
Implementation commit: fb9e37369f
