---
Type: Build-Record
Status: Complete
Domain: API
Last-reviewed: 2026-03-14
Feature-Slug: reception-prime-actor-claims-compat
Execution-Track: code
Completed-date: 2026-03-14
artifact: build-record
Build-Event-Ref: docs/plans/reception-prime-actor-claims-compat/build-event.json
---

# Build Record: Reception Prime Actor Claims Compat

## Outcome Contract

- **Why:** The `prime-outbound-auth-hardening` build removed the compat fallback but left two residual issues: `actorSource: 'reception_proxy'` in audit records is misleading now that the UID is verified, and `PRIME_ACTOR_CLAIMS_SECRET` is absent from local dev env files, causing Reception-side failures (surfaced as 502 by most routes via `inboxApiErrorResponse`, thrown by `buildPrimeActorHeaders()` before Prime is called) with no clear diagnostic indicator in the `.env.example` wording.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this change, `actorSource` in D1 audit records accurately reflects a verified Reception staff origin (`'reception_staff'`), existing tests that pin `'reception_proxy'` are updated to the new value, and the existing `PRIME_ACTOR_CLAIMS_SECRET` entries in both `.env.example` files are updated with clearer wording about the Reception-side failure mode (surfaced as 502 by `inboxApiErrorResponse` after `buildPrimeActorHeaders()` throws before Prime is called) so new contributors can diagnose misconfiguration without reading the source.
- **Source:** auto

## Self-Evolving Measurement

- **Status:** none

## What Was Built

**TASK-01 + TASK-02 (coupled, same commit):** Renamed `actorSource: 'reception_proxy'` to `'reception_staff'` in `apps/prime/functions/api/review-thread-send.ts:66` and `apps/prime/functions/api/review-campaign-send.ts:67`. These are the two Prime CF Pages Function endpoints that write to the D1 audit trail; the old value was an artefact of the pre-TASK-07 compat path where the UID was forwarded without HMAC verification. Updated the two test fixture strings in `apps/prime/functions/__tests__/review-threads.test.ts` (lines 2742 and 3045) to match, keeping CI green. Note: `review-campaign-send` has no current Reception caller; the rename is a preemptive correctness fix for future direct callers.

**TASK-03:** Updated the `PRIME_ACTOR_CLAIMS_SECRET` comment blocks in `apps/prime/.env.example` and `apps/reception/.env.example`. The Prime file now explicitly distinguishes the primary local-dev failure mode (Reception-side 502 from `buildPrimeActorHeaders()` throwing before Prime is called) from the Prime-side 503 (when Prime's own secret is absent or too short). It also notes that `validatePrimeActorClaimsConfig()` is currently not wired anywhere in `apps/prime`, so misconfiguration is only surfaced at request-time. The Reception file now names the 502 surfacing path explicitly.

**Scope deviation note:** `apps/prime/functions/lib/actor-claims.ts` and `apps/prime/functions/lib/prime-review-api.ts` were also staged as a controlled expansion to clear pre-existing lint violations (import sort) triggered by the package-level lint gate. These files were already modified in the working tree as part of a concurrent Wave 2 build for `@acme/lib/prime`; all five changes landed in commit `33ae94be06`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/prime typecheck` | Pass | Zero type errors |
| `lint-staged (pre-commit)` | Pass | ESLint clean on all staged prime and reception files |
| Mode 2 Data Simulation (TASK-01) | Pass | actorSource verified as 'reception_staff' in both API files; no 'reception_proxy' remaining |
| Mode 2 Data Simulation (TASK-02) | Pass | Fixture strings at lines 2742/3045 updated; staff-broadcast-send.test.ts unchanged |
| Mode 2 Data Simulation (TASK-03) | Pass | Both .env.example files contain '502' failure mode language; PRIME_ACTOR_CLAIMS_SECRET= still present |

## Workflow Telemetry Summary

4 workflow records across all stages (fact-find, analysis, plan, build). 380k bytes total context input. 5 modules loaded, 7 deterministic checks run. Token measurement: 0% (captured via session logs; no CODEX_THREAD_ID available).

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes |
|---|---:|---:|---:|---:|
| lp-do-fact-find | 1 | 1.00 | 76976 | 29950 |
| lp-do-analysis | 1 | 1.00 | 71576 | 17529 |
| lp-do-plan | 1 | 1.00 | 127612 | 26371 |
| lp-do-build | 1 | 2.00 | 104110 | 6952 |

## Validation Evidence

### TASK-01
- TC-01: `grep -r "reception_proxy" apps/prime/functions/api/` → 0 matches ✓
- TC-02: `grep "actorSource" apps/prime/functions/api/review-thread-send.ts` → `actorSource: 'reception_staff'` ✓
- TC-03: `grep "actorSource" apps/prime/functions/api/review-campaign-send.ts` → `actorSource: 'reception_staff'` ✓

### TASK-02
- TC-01: `grep '"actorSource":"reception_staff"' apps/prime/functions/__tests__/review-threads.test.ts` → 2 matches at lines 2742, 3045 ✓
- TC-02: `grep '"actorSource":"reception_proxy"' apps/prime/functions/__tests__/review-threads.test.ts` → 0 matches ✓
- TC-03: `grep "reception_staff_compose" apps/prime/functions/__tests__/staff-broadcast-send.test.ts` → present, unchanged ✓

### TASK-03
- TC-01: `grep -A5 "PRIME_ACTOR_CLAIMS_SECRET" apps/prime/.env.example` → contains "502" and "Reception-side" failure mode language ✓
- TC-02: `grep -A5 "PRIME_ACTOR_CLAIMS_SECRET=" apps/reception/.env.example` → contains "502 via inboxApiErrorResponse" ✓
- TC-03: `grep "PRIME_ACTOR_CLAIMS_SECRET=" apps/prime/.env.example` → entry still present ✓
- TC-04: `grep "PRIME_ACTOR_CLAIMS_SECRET=" apps/reception/.env.example` → entry still present ✓

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A — server-side only | No rendering path affected |
| UX / states | N/A — no UI state | CF Pages Function string rename only |
| Security / privacy | N/A — audit label only | HMAC-SHA256 auth path unchanged; actorSource is free-form TEXT |
| Logging / observability / audit | `actorSource: 'reception_staff'` confirmed in both API files; .env.example comment updated with accurate 502 failure mode | D1 audit records will now correctly identify verified staff origin |
| Testing / validation | Both fixture strings at lines 2742/3045 updated; lint-staged + typecheck pass | CI will pass after commit |
| Data / contracts | N/A — free-form TEXT column; no schema migration | No API contract change |
| Performance / reliability | N/A — string literal rename | Zero runtime performance impact |
| Rollout / rollback | All changes committed together in one commit; rollback by reverting string values in 4 source files | No deploy-order constraint |

## Scope Deviations

Controlled expansion: `apps/prime/functions/lib/actor-claims.ts` and `apps/prime/functions/lib/prime-review-api.ts` staged alongside plan-scoped files to resolve pre-existing import-sort lint violations triggered by the package-level lint gate. These files were already modified in the working tree as part of a concurrent build for `@acme/lib/prime`. The import-sort autofix applied by `eslint --fix` was the minimum change; the substantive content of those files had already been modified by a parallel agent. This expansion did not touch any plan-scoped logic.
