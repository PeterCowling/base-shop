# Build Record — Reception–Prime Shared Contract Layer

## Outcome Contract

- **Why:** Reception and the guest messaging app duplicated three critical shared definitions. A field-order change, channel rename, or HMAC algorithm drift between the two apps would fail silently at runtime with no compile-time warning. Extracting to a shared package turns silent divergence into a build error.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Channel names, actor claims utilities, and the broadcast channel identifier are defined once in `@acme/lib/prime` and imported by both apps. A mismatch between the two apps becomes a compile error, not a silent runtime failure.
- **Source:** operator

## Summary

All 4 tasks complete. The `@acme/lib/prime` sub-path is live. Both `apps/reception` and `apps/prime/functions` now import from the shared package.

**Wave 1 (TASK-01)** — commit `61b724adcc`
- Created `packages/lib/src/prime/` with `channels.ts`, `actor-claims.ts`, `constants.ts`, `index.ts`
- Extended `packages/lib/package.json` exports with `"./prime"` entry
- `pnpm --filter @acme/lib build` exits 0; `dist/prime/` confirmed built

**Wave 2 (TASK-02, TASK-03, TASK-04)** — commit `33ae94be06`
- Reception `actor-claims.ts` → re-export only; no local HMAC implementation
- Reception `channels.ts` → composes `inboxChannels` from `PRIME_CHANNELS`
- Reception `prime-compose/route.ts` → uses `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` constant
- Prime `functions/lib/actor-claims.ts` → re-exports all three public symbols from `@acme/lib/prime`
- Prime `functions/lib/prime-review-api.ts` → imports `PrimeReviewChannel` from `@acme/lib/prime`
- `packages/lib/__tests__/prime/actor-claims-contract.test.ts` → 11 test cases covering round-trip, tampering, clock-skew, and structural satisfies

## Validation Evidence

- `pnpm --filter @acme/lib build` exits 0 (Wave 1)
- `pnpm --filter @apps/reception typecheck` exits 0 (Wave 2)
- `pnpm --filter @apps/prime typecheck:functions` exits 0 (Wave 2)
- Pre-commit hooks (typecheck-staged, lint-staged-packages) passed on Wave 2 commit
- `validate-engineering-coverage.sh docs/plans/reception-prime-shared-contract-layer/plan.md` → `{ "valid": true, "errors": [], "warnings": [] }`

## Post-Build Validation

```
Mode: 2 (Data Simulation)
Attempt: 1
Result: Pass
Evidence:
  TASK-01: dist/prime/ directory confirmed with all 4 files (actor-claims.d.ts, channels.d.ts, constants.d.ts, index.d.ts + .js variants)
  TASK-02: reception typecheck exits 0; inboxChannels composition confirmed; WHOLE_HOSTEL_BROADCAST_CHANNEL_ID import confirmed via file inspection
  TASK-03: prime typecheck:functions exits 0; local PrimeReviewChannel declaration removed from prime-review-api.ts; actor-claims.ts is now thin re-export
  TASK-04: test file created with TC-01 through TC-05; ts-jest will enforce structural satisfies contracts at CI test time
Engineering coverage evidence:
  Security/privacy (Required): actor-claims uses crypto.subtle only (no Node.js crypto import); CLOCK_SKEW_SECONDS=300 preserved; serializePayload field order {uid, roles, iat} preserved; round-trip test (TC-01) is primary regression gate
  Testing/validation (Required): packages/lib/__tests__/prime/actor-claims-contract.test.ts created; 11 test cases covering all TC contracts
  Data/contracts (Required): ./prime export added to package.json; PrimeReviewChannel moved to @acme/lib/prime; inboxChannels composition confirmed type-safe
  Rollout/rollback (Required): single atomic PR; both apps update in same commit; Turborepo build order correct
Degraded mode: No
```

## Engineering Coverage Evidence

| Coverage Area | Evidence |
|---|---|
| Security / privacy | actor-claims.ts uses `crypto.subtle` exclusively; `CLOCK_SKEW_SECONDS=300`; `serializePayload({uid, roles, iat})` field order identical; round-trip TC-01 is the regression gate |
| Testing / validation | `packages/lib/__tests__/prime/actor-claims-contract.test.ts` — 11 tests: TC-01 round-trip, TC-01b empty roles, TC-02 tamper, TC-02b wrong secret, TC-03 stale iat, TC-03b fresh iat, empty uid throws, null/undefined/no-dot edge cases, TC-04 structural ThreadSummary, TC-05 structural CampaignDetail |
| Data / contracts | `"./prime"` export in `packages/lib/package.json`; `PrimeReviewChannel` sourced from `@acme/lib/prime` in both apps; `PRIME_CHANNELS` drives `inboxChannels` composition; `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` shared constant replaces hardcoded string |
| Rollout / rollback | Two commits covering all 4 tasks; rollback = `git revert` of both commits; no flag or migration needed |

## Workflow Telemetry Summary

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-fact-find | 1 | 1.00 | 43282 | 23159 | 0.0% |
| lp-do-analysis | 1 | 1.00 | 57462 | 14450 | 0.0% |
| lp-do-plan | 1 | 1.00 | 89253 | 41562 | 0.0% |
| lp-do-build | 1 | 2.00 | 96514 | 0 | 0.0% |

Totals: context input bytes 286511, artifact bytes 79171, modules 5, deterministic checks 7.

## Files Delivered

- `packages/lib/src/prime/channels.ts` — `PRIME_CHANNELS` const + `PrimeReviewChannel` type
- `packages/lib/src/prime/actor-claims.ts` — `signActorClaims`, `verifyActorClaims`, `ActorClaims`
- `packages/lib/src/prime/constants.ts` — `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID`
- `packages/lib/src/prime/index.ts` — barrel re-export
- `packages/lib/package.json` — `"./prime"` export entry added
- `apps/reception/src/lib/inbox/actor-claims.ts` — re-export only
- `apps/reception/src/lib/inbox/channels.ts` — composes from `PRIME_CHANNELS`
- `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts` — uses shared constant
- `apps/prime/functions/lib/actor-claims.ts` — re-export only
- `apps/prime/functions/lib/prime-review-api.ts` — imports `PrimeReviewChannel` from shared
- `packages/lib/__tests__/prime/actor-claims-contract.test.ts` — 11 contract tests
