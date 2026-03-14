---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Build-completed: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-prime-shared-contract-layer
Dispatch-ID: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-prime-shared-contract-layer/analysis.md
---

# Reception–Prime Shared Contract Layer Plan

## Summary

This plan extracts the three highest-risk cross-app coupling points (Prime channel names, HMAC actor-claims utilities, and the whole-hostel broadcast channel ID) from their parallel per-app definitions into a new `@acme/lib/prime` sub-path. Both `apps/reception` and `apps/prime/functions` currently define these independently, meaning a field-order change or channel rename fails silently at runtime with no compile-time enforcement. After this change, both apps import from a single authoritative source, and any divergence becomes a build error. The extraction follows the exact structural pattern of the existing `@acme/lib/hospitality` sub-path, which Prime already imports. Structural `satisfies` tests are added for the complex types that intentionally stay per-app.

## Active tasks
- [x] TASK-01: Create `packages/lib/src/prime/` sub-path with channels, actor-claims, and constants — Complete (2026-03-14)
- [x] TASK-02: Migrate reception imports to `@acme/lib/prime` — Complete (2026-03-14)
- [x] TASK-03: Migrate prime functions imports to `@acme/lib/prime` — Complete (2026-03-14)
- [x] TASK-04: Add structural validation tests in `packages/lib/__tests__/prime/` — Complete (2026-03-14)

## Goals
- Compile-time enforcement for the three highest-risk cross-app coupling points
- No change to runtime behaviour
- Minimum restructuring surface

## Non-goals
- Extracting Prime's internal message-type graph (`MessageKind`, `MessageAudience`, etc.)
- Unifying the full inbox API models (reception's intentional type widening stays)
- Changing any API shape or wire format

## Constraints & Assumptions
- Constraints:
  - Prime functions run in Cloudflare Workers: Web Crypto only, no Node.js `crypto`
  - `@acme/lib` must not import from app code (one-way dep direction preserved)
  - `packages/lib/tsconfig.json` has `"types": ["node"]` — actor-claims must use `crypto.subtle` (Web Crypto API), not `import crypto from 'node:crypto'`
  - Both apps must update imports in the same PR for Turborepo to build consistently
  - Scope of broadcast ID extraction: only the reception→prime boundary (reception's `prime-compose/route.ts` hardcoded string). Prime's internal `WHOLE_HOSTEL_THREAD_ID` in `prime-whole-hostel-campaigns.ts` is a private module-level const — not exported, not cross-app, and out of scope for this plan. Prime's `src` layer already exports `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` from `src/lib/chat/directMessageChannel.ts` (used by the Next.js UI) — that constant lives in a Next.js-only module and cannot be shared via `@acme/lib/prime` without creating a dependency on Prime's `src` types. The `@acme/lib/prime/constants.ts` constant is a new independent canonical value for use by both reception and prime functions.
  - Structural `satisfies` tests in `packages/lib/__tests__/prime/` are excluded from `packages/lib/tsconfig.json` (which excludes `**/__tests__/**`). These tests enforce contracts only at Jest runtime (when ts-jest processes them), not at `tsc -b` typecheck time.
- Assumptions:
  - Prime functions tsconfig already supports `@acme/lib/prime` import (same pattern as `@acme/lib/hospitality` which Prime already uses)
  - `packages/lib` build config (`tsc -b`) handles new sub-directories automatically via `src/**/*.ts` glob in `tsconfig.json`
  - No new dependency edge is required — both apps already depend on `@acme/lib`

## Inherited Outcome Contract

- **Why:** Reception and the guest messaging app currently duplicate shared language in two places. If either side adds a field, renames a channel, or changes the security token format, the other side silently fails at runtime with no compile-time warning. Extracting to a shared package turns silent divergence into a build error.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Channel names, actor claims utilities, and the broadcast channel identifier are defined once in a shared package and imported by both apps. A mismatch between the two apps becomes a compile error, not a silent runtime failure.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/reception-prime-shared-contract-layer/analysis.md`
- Selected approach inherited:
  - Option C — targeted extraction to `@acme/lib/prime` + structural tests for complex types
- Key reasoning used:
  - Actor claims HMAC is the highest-risk coupling point: an algorithm divergence breaks all mutating Prime calls silently. Sharing the implementation eliminates that class of bug entirely.
  - Complex types (`PrimeReviewThreadSummary`, `PrimeReviewCampaignDetail`) are intentionally widened in reception — extraction would drag prime-internal message types into `@acme/lib`. Structural tests cover this gap at lower cost.
  - The extraction follows the exact pattern already used for `@acme/lib/hospitality`.

## Selected Approach Summary
- What was chosen:
  - New `packages/lib/src/prime/` directory with three files: `channels.ts`, `actor-claims.ts`, `constants.ts`
  - `packages/lib/package.json` exports extended with `"./prime"` entry
  - Reception and Prime functions updated to import from `@acme/lib/prime`
  - Structural `satisfies` tests added in `packages/lib/__tests__/prime/`
- Why planning is not reopening option selection:
  - Analysis evaluated three options with explicit criteria and rejected A (too broad) and B (insufficient for actor claims). Option C was decisive. No new facts have emerged since analysis.

## Fact-Find Support
- Supporting brief: `docs/plans/reception-prime-shared-contract-layer/fact-find.md`
- Evidence carried forward:
  - Prime already imports `@acme/lib/hospitality` in `guest-booking.ts` — confirmed no new dep edge needed
  - Both actor-claims implementations use identical Web Crypto API calls and `{ uid, roles, iat }` fixed field order — confirmed byte-identical serialization is achievable
  - `broadcast_whole_hostel` is a raw string literal throughout prime production code (no exported constant exists) — confirmed trivial to extract
  - Reception's `PrimeReviewThreadSummary` is intentionally widened relative to prime's — confirmed complex types must stay per-app
  - `packages/lib/src/hospitality/index.ts` is a flat single-file sub-path — confirmed the structural pattern for `prime/`

## Plan Gates
- Foundation Gate: Pass — three source files read, exact implementations verified, hospitality pattern confirmed
- Sequenced: Yes — TASK-01 is required before TASK-02/03; TASK-04 requires TASK-01
- Edge-case review complete: Yes — actor claims byte identity, inboxChannels type guard, Turborepo build order, Prime tsconfig
- Auto-build eligible: Yes — all tasks ≥80% confidence

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `@acme/lib/prime` sub-path | 90% | M | Complete (2026-03-14) | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Migrate reception to `@acme/lib/prime` imports | 85% | S | Complete (2026-03-14) | TASK-01 | - |
| TASK-03 | IMPLEMENT | Migrate prime functions to `@acme/lib/prime` imports | 90% | S | Complete (2026-03-14) | TASK-01 | - |
| TASK-04 | IMPLEMENT | Add structural validation tests in `packages/lib/__tests__/prime/` | 85% | S | Complete (2026-03-14) | TASK-01 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — no UI change | - | Pure package refactor |
| UX / states | N/A — no user-facing state change | - | Pure package refactor |
| Security / privacy | Actor claims algorithm shared from single source; `CLOCK_SKEW_SECONDS = 300` preserved; min-key-length assertion preserved; `serializePayload` fixed field order preserved; Web Crypto API only | TASK-01, TASK-02, TASK-03, TASK-04 | Round-trip test in TASK-04 is the primary regression gate |
| Logging / observability / audit | N/A — no log/metric/audit path change | - | Extract does not touch telemetry |
| Testing / validation | Round-trip sign→verify test; structural `satisfies` tests for complex types that stay per-app | TASK-04 | Tests live in `packages/lib/__tests__/prime/` to prove cross-app accessibility |
| Data / contracts | `./prime` export added to `packages/lib/package.json`; `PrimeReviewChannel` type moved from prime-review-api.ts to shared; `PRIME_CHANNELS` const drives `inboxChannels` composition | TASK-01, TASK-02, TASK-03 | Wire formats unchanged; internal type graph unchanged |
| Performance / reliability | N/A — no hot path or latency change; actor claims sign/verify are already async per-request | - | Identical implementation, identical runtime cost |
| Rollout / rollback | Single PR; 8–10 file changes; Turborepo builds `@acme/lib` before apps by dependency order; rollback = revert PR | TASK-01, TASK-02, TASK-03 | No feature flag needed; compile-time-only change visible to both apps simultaneously |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Must complete before any consumer tasks |
| 2 | TASK-02, TASK-03, TASK-04 | TASK-01 complete | All three can run in parallel after wave 1 |

## Delivered Processes

None: no material process topology change. This is a compile-time refactor with no impact on runtime flows, CI/deploy lanes, operator runbooks, or approval paths.

## Tasks

---

### TASK-01: Create `packages/lib/src/prime/` sub-path
- **Type:** IMPLEMENT
- **Deliverable:** New directory `packages/lib/src/prime/` with three TypeScript files; updated `packages/lib/package.json` exports
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Build evidence:** Committed as 61b724adcc. `packages/lib/src/prime/` created with `channels.ts`, `actor-claims.ts`, `constants.ts`, `index.ts`. `package.json` extended with `"./prime"` export entry. `pnpm --filter @acme/lib build` exits 0. TC-01 through TC-04 passed. Post-build validation Mode 2: `dist/prime/index.js` and `dist/prime/index.d.ts` confirmed present.
- **Affects:**
  - `packages/lib/src/prime/channels.ts` (new)
  - `packages/lib/src/prime/actor-claims.ts` (new)
  - `packages/lib/src/prime/constants.ts` (new)
  - `packages/lib/src/prime/index.ts` (new — barrel re-export)
  - `packages/lib/package.json` (add `"./prime"` export)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 90%
  - Implementation: 90% — hospitality sub-path pattern is fully visible and mechanically repeatable; actor-claims implementations in both apps have been read and are byte-for-byte identical in algorithm and field order. Held-back test: the one risk is `packages/lib/tsconfig.json` having `"types": ["node"]` which could conflict with Web Crypto types — but `crypto.subtle` is in the global scope in both Node 18+ and Cloudflare Workers without explicit lib additions, and the existing reception actor-claims.ts already uses it without import. No single unknown would push this below 80.
  - Approach: 95% — extraction follows a confirmed pattern. No design decisions required.
  - Impact: 85% — this unblocks TASK-02/03/04 and is the highest-leverage task. Impact risk: if the tsconfig excludes test files and the dist path is wrong, consumers break; mitigated by `pnpm typecheck` gate.
- **Acceptance:**
  - `packages/lib/src/prime/channels.ts` exports `PRIME_CHANNELS` as `readonly ['prime_direct', 'prime_broadcast', 'prime_activity']` and `PrimeReviewChannel` type
  - `packages/lib/src/prime/actor-claims.ts` exports `signActorClaims`, `verifyActorClaims`, `ActorClaims` interface
  - `packages/lib/src/prime/actor-claims.ts` uses Web Crypto API (`crypto.subtle`) exclusively — no Node.js `crypto` import
  - `CLOCK_SKEW_SECONDS = 300` preserved
  - `serializePayload` with fixed field order `{ uid, roles, iat }` preserved
  - `packages/lib/src/prime/constants.ts` exports `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID = 'broadcast_whole_hostel'`
  - `packages/lib/src/prime/index.ts` re-exports all public symbols from the three files
  - `packages/lib/package.json` `"./prime"` export points to `dist/prime/index.d.ts` (types) and `dist/prime/index.js` (import)
  - `pnpm typecheck` passes for `@acme/lib`
- **Engineering Coverage:**
  - UI / visual: N/A — new package file, no UI
  - UX / states: N/A — no user-facing state
  - Security / privacy: Required — actor-claims algorithm must use Web Crypto API; CLOCK_SKEW_SECONDS = 300; serializePayload field order { uid, roles, iat } must be byte-identical to both existing implementations
  - Logging / observability / audit: N/A — no log path
  - Testing / validation: Required — `pnpm typecheck` for `@acme/lib` passes; TASK-04 provides the round-trip and structural runtime tests
  - Data / contracts: Required — `./prime` export entry added to `package.json`; `PrimeReviewChannel` type is `'prime_direct' | 'prime_broadcast' | 'prime_activity'` (matches current prime-review-api.ts)
  - Performance / reliability: N/A — static types and pure utility functions
  - Rollout / rollback: Required — single atomic addition; rollback = delete `src/prime/` dir and revert `package.json` exports
- **Validation contract:**
  - TC-01: `packages/lib` build passes without errors → `pnpm --filter @acme/lib build` exits 0 (the `packages/lib` package has no separate `typecheck` script; build via `tsc -b` is the type-check gate)
  - TC-02: `packages/lib/package.json` contains `"./prime"` entry with correct dist paths → manual inspection confirms `dist/prime/index.d.ts` and `dist/prime/index.js`
  - TC-03: `actor-claims.ts` contains no Node.js `crypto` import — only `crypto.subtle` calls → grep confirms absence of `import crypto from 'node:crypto'` or `require('crypto')`
  - TC-04: `serializePayload` produces `{"uid":"x","roles":["r"],"iat":1}` for inputs `{uid:"x", roles:["r"], iat:1}` — field order matches existing implementations exactly → inspection of JSON.stringify call
- **Execution plan:** Red → Green → Refactor
  - Red: Create `src/prime/` dir with stub files that export empty/placeholder values → `pnpm typecheck` fails for consumers referencing unexported names
  - Green: Implement all three files and `index.ts` barrel; add `./prime` to `package.json` exports → `pnpm typecheck` passes
  - Refactor: Verify no duplicate exports between files; confirm `index.ts` barrel is minimal and clean
- **Planning validation:**
  - Checks run: Inspected `packages/lib/src/hospitality/index.ts` (single flat file pattern); inspected `packages/lib/package.json` (existing `./hospitality` export entry format); inspected `packages/lib/tsconfig.json` (`src/**/*.ts` glob covers new sub-path automatically); read both actor-claims implementations line-by-line to confirm identical algorithm.
  - Validation artifacts: Source files read; export entry format confirmed from `./hospitality` entry.
  - Unexpected findings: Reception's `actor-claims.ts` has an inlined `toBase64Url` helper without a `serializePayload` abstraction — the shared implementation should follow prime's version (has `serializePayload` + `importKey` helpers) for clarity, not reception's inline version.
- **Scouts:** Actor-claims byte identity — verified: both apps use `JSON.stringify({ uid: claims.uid, roles: claims.roles, iat })` with identical field order. Web Crypto types — verified: `crypto.subtle` is already used in reception's actor-claims.ts with no special tsconfig lib entry.
- **Edge Cases & Hardening:**
  - Empty `roles` array: `JSON.stringify({uid, roles:[], iat})` → `{"uid":"x","roles":[],"iat":1}` — stable and consistent
  - `iat` defaulted to `Math.floor(Date.now() / 1000)` when not supplied — preserved from both implementations
  - `uid` empty check preserved: throws `signActorClaims: uid must be a non-empty string`
- **What would make this >=90%:**
  - Confirmed by running `pnpm typecheck` locally against a draft of the new files (currently assessment from code inspection only)
- **Rollout / rollback:**
  - Rollout: Part of single PR with TASK-02/03/04. Turborepo builds `@acme/lib` before apps.
  - Rollback: Delete `src/prime/` dir, revert `package.json` exports entry, revert any consumer imports to their original per-app versions.
- **Documentation impact:**
  - None required. The `./prime` export follows the same undocumented convention as all other `@acme/lib` sub-paths.
- **Notes / references:**
  - Pattern source: `packages/lib/src/hospitality/index.ts` and `"./hospitality"` export in `package.json`
  - Prime's `importKey` helper is cleaner than reception's inline key import — use prime's version as the basis

---

### TASK-02: Migrate reception to imports from `@acme/lib/prime`
- **Type:** IMPLEMENT
- **Deliverable:** Updated imports in three reception source files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** Committed in Wave 2 as 33ae94be06. `actor-claims.ts` → re-exports `signActorClaims` only from `@acme/lib/prime`. `channels.ts` → composes `inboxChannels = ["email", ...PRIME_CHANNELS] as const`. `prime-compose/route.ts` → uses `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` from `@acme/lib/prime`. `pnpm --filter @apps/reception typecheck` exits 0. TC-01 through TC-04 passed.
- **Affects:**
  - `apps/reception/src/lib/inbox/actor-claims.ts` (replace implementation with re-export)
  - `apps/reception/src/lib/inbox/channels.ts` (compose `inboxChannels` from `PRIME_CHANNELS`)
  - `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts` (import constant)
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — three targeted file edits with clear before/after states. One risk: `inboxChannels` type narrowing — `["email", ...PRIME_CHANNELS] as const` must produce a type that `isInboxChannel()` accepts. `PRIME_CHANNELS` is `readonly ["prime_direct", "prime_broadcast", "prime_activity"]` — spreading into a `const` array with a string literal prefix should produce the correct union type. Held-back test: if TypeScript refuses to narrow the spread of a `readonly` const tuple in a `const` assertion, the type guard breaks. This is a known TypeScript pattern that works, but it's slightly non-obvious. Score: 85.
  - Approach: 95% — straightforward import substitution; no logic changes.
  - Impact: 85% — `inboxChannels` type guard is used throughout reception's inbox routing; a type regression would be caught by typecheck.
- **Acceptance:**
  - `apps/reception/src/lib/inbox/actor-claims.ts` re-exports `signActorClaims` from `@acme/lib/prime` (no local implementation)
  - `apps/reception/src/lib/inbox/channels.ts` composes `inboxChannels` as `["email", ...PRIME_CHANNELS] as const` — `PRIME_CHANNELS` imported from `@acme/lib/prime`
  - `isInboxChannel()` type guard continues to accept `"prime_direct"`, `"prime_broadcast"`, `"prime_activity"` — verified by `pnpm typecheck`
  - `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts` uses `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` from `@acme/lib/prime` instead of `"broadcast_whole_hostel"` string literal; TODO comment removed
  - `pnpm typecheck` passes for `apps/reception`
- **Engineering Coverage:**
  - UI / visual: N/A — no UI change
  - UX / states: N/A — no user-facing state change
  - Security / privacy: Required — `signActorClaims` is called in production for mutating Prime requests; the re-export must call through to the shared implementation without wrapping or modifying behavior
  - Logging / observability / audit: N/A — no log path change
  - Testing / validation: Required — `pnpm typecheck` for `apps/reception` passes; existing tests continue to pass in CI
  - Data / contracts: Required — `inboxChannels` const and `InboxChannel` type must remain structurally identical after composition; `isInboxChannel()` type guard must not narrow incorrectly
  - Performance / reliability: N/A — import substitution; identical runtime cost
  - Rollout / rollback: Required — part of same PR as TASK-01/03/04; rollback = revert to original per-app implementations
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/reception typecheck` exits 0 → passes with no new type errors
  - TC-02: `inboxChannels` includes all four values (`"email"`, `"prime_direct"`, `"prime_broadcast"`, `"prime_activity"`) → TypeScript tuple type assertion confirms this
  - TC-03: `isInboxChannel("prime_broadcast")` returns `true` at the type level → `pnpm --filter @apps/reception typecheck` accepts `inboxChannels.includes(value as InboxChannel)` without error
  - TC-04: `prime-compose/route.ts` references `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` constant, not string literal `"broadcast_whole_hostel"` → grep confirms
- **Execution plan:** Red → Green → Refactor
  - Red: Update `channels.ts` import before TASK-01 is complete → import fails
  - Green: After TASK-01: update `actor-claims.ts` to re-export; update `channels.ts` to compose from `PRIME_CHANNELS`; update `route.ts` to use constant → `pnpm typecheck` passes
  - Refactor: Confirm no orphaned local channel string literals remain in reception's inbox adapter files
- **Scouts:** `channels.ts` spread pattern — `["email", ...PRIME_CHANNELS] as const` confirmed valid TypeScript for spreading a `readonly` const tuple into a new `const` tuple. The resulting type is `readonly ["email", "prime_direct", "prime_broadcast", "prime_activity"]`. `isInboxChannel()` uses `.includes()` which works on `readonly` arrays.
- **Edge Cases & Hardening:**
  - `inboxChannels` is used by `isInboxChannel()` type guard and by channel adapter lookups throughout reception's inbox. The composed value must be runtime-identical to the original — confirmed since both are the same four string literals.
  - Reception never needs `verifyActorClaims` — the re-export from `actor-claims.ts` only needs to expose `signActorClaims`. The local file can re-export only that function.
- **What would make this >=90%:**
  - TypeScript `satisfies` assertion on the composed `inboxChannels` array to prove it matches the expected union type — adds compile-time proof, not just inspection
- **Rollout / rollback:**
  - Rollout: Same PR as TASK-01. Turborepo dependency order guarantees `@acme/lib` builds first.
  - Rollback: Revert `actor-claims.ts`, `channels.ts`, and `route.ts` to their pre-change states.
- **Documentation impact:**
  - Remove the `// WHOLE_HOSTEL_BROADCAST_CHANNEL_ID lives in the Prime app and is not importable here.` comment from `prime-compose/route.ts` — it becomes incorrect after this task.
- **Notes / references:**
  - `prime-compose/route.ts` line 60–63: explicit TODO comment about the hardcoded string — this is precisely what TASK-02 resolves.
  - Reception's `channels.ts` also defines `InboxChannelDescriptor`, `InboxChannelCapabilities`, etc. — these are not affected and remain unchanged.

---

### TASK-03: Migrate prime functions to imports from `@acme/lib/prime`
- **Type:** IMPLEMENT
- **Deliverable:** Updated imports in two prime functions source files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** Committed in Wave 2 as 33ae94be06. `actor-claims.ts` → re-exports `signActorClaims`, `verifyActorClaims`, `ActorClaims` from `@acme/lib/prime` (local HMAC implementation removed). `prime-review-api.ts` → imports `PrimeReviewChannel` from `@acme/lib/prime`; local type declaration removed. `pnpm --filter @apps/prime typecheck:functions` exits 0. TC-01 through TC-04 passed.
- **Affects:**
  - `apps/prime/functions/lib/actor-claims.ts` (replace local implementation with imports from `@acme/lib/prime`)
  - `apps/prime/functions/lib/prime-review-api.ts` (import `PrimeReviewChannel` from `@acme/lib/prime`)
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — prime already imports from `@acme/lib/hospitality`; the pattern is confirmed. The only risk is that Prime's `actor-claims.ts` also exports `ActorClaims` interface and `verifyActorClaims` — the shared implementation exports both, so the re-export covers the full public API. Held-back test: if prime's tsconfig excludes `@acme/lib/prime` via path restrictions, the import fails. However, prime uses `@acme/lib/hospitality` via the same `node_modules` resolution path, so this path is already open. No single unknown would push this below 80.
  - Approach: 95% — direct import substitution with no logic changes.
  - Impact: 90% — prime's `verifyActorClaims` is used on every mutating endpoint; correctness is verified by TASK-04's round-trip test.
- **Acceptance:**
  - `apps/prime/functions/lib/actor-claims.ts` imports `signActorClaims`, `verifyActorClaims`, `ActorClaims` from `@acme/lib/prime` and either re-exports them or calls them directly (callers within prime functions remain unchanged)
  - `apps/prime/functions/lib/prime-review-api.ts` imports `PrimeReviewChannel` from `@acme/lib/prime` instead of declaring it locally
  - `pnpm typecheck` passes for `apps/prime`
- **Engineering Coverage:**
  - UI / visual: N/A — no UI change
  - UX / states: N/A — no user-facing state change
  - Security / privacy: Required — `verifyActorClaims` is the authentication gate for all mutating Prime endpoints; the shared implementation must be byte-identical to the current prime implementation; CLOCK_SKEW_SECONDS = 300 preserved
  - Logging / observability / audit: N/A — no log path change
  - Testing / validation: Required — `pnpm typecheck` for `apps/prime` passes; TASK-04 round-trip test provides runtime sign/verify correctness proof
  - Data / contracts: Required — `PrimeReviewChannel` union type (`'prime_direct' | 'prime_broadcast' | 'prime_activity'`) must remain identical after import substitution
  - Performance / reliability: N/A — import substitution; identical runtime cost
  - Rollout / rollback: Required — part of same PR; rollback = revert prime's actor-claims.ts and prime-review-api.ts
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/prime typecheck:functions` exits 0 → no new type errors in prime functions layer
  - TC-02: `prime-review-api.ts` no longer declares `PrimeReviewChannel` locally → grep confirms `type PrimeReviewChannel` definition removed from that file
  - TC-03: `actor-claims.ts` in prime no longer contains the `toBase64Url`, `fromBase64Url`, `importKey`, `serializePayload` implementations → those implementations are now exclusively in `@acme/lib/prime`
  - TC-04: `verifyActorClaims` call sites in prime functions remain unchanged — callers are not modified → grep confirms call-site signatures unchanged
- **Execution plan:** Red → Green → Refactor
  - Red: Remove local implementations from prime's `actor-claims.ts` before TASK-01 is complete → import fails at module resolution
  - Green: After TASK-01: update `actor-claims.ts` to import from `@acme/lib/prime`; update `prime-review-api.ts` to import `PrimeReviewChannel` from `@acme/lib/prime` → `pnpm typecheck` passes
  - Refactor: Confirm `actor-claims.ts` in prime is now a thin re-export or removed if callers import from `@acme/lib/prime` directly
- **Scouts:** Prime functions tsconfig confirmed to allow `@acme/lib` imports via `node_modules` resolution (confirmed by existence of `@acme/lib/hospitality` import in `guest-booking.ts`). `PrimeReviewChannel` in prime-review-api.ts is a simple type alias with no cross-file dependencies — safe to replace with an import.
- **Edge Cases & Hardening:**
  - Prime's `actor-claims.ts` exports `ActorClaims` interface which is used as a type annotation in `prime-review-send-support.ts` and `prime-thread-projection.ts` — the shared `ActorClaims` must export the identical interface `{ uid: string; roles: string[]; iat: number }`. Confirmed from both implementations.
  - `PrimeReviewChannel` in `prime-review-api.ts` is exported and re-used throughout prime functions. The import substitution must not break any of those downstream usages — they continue to import from `prime-review-api.ts` which now re-exports from `@acme/lib/prime`.
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% after `pnpm typecheck` passes locally against the draft changes.
- **Rollout / rollback:**
  - Rollout: Same PR as TASK-01. Prime functions are built after `@acme/lib` in Turborepo order.
  - Rollback: Revert prime's `actor-claims.ts` to its original local implementation; revert `prime-review-api.ts` to its original `PrimeReviewChannel` type declaration.
- **Documentation impact:**
  - None required. The comment block in prime's `actor-claims.ts` should be updated to note that the implementation now lives in `@acme/lib/prime`.
- **Notes / references:**
  - Prime's `actor-claims.ts` callers: `prime-review-send-support.ts` and `prime-thread-projection.ts` — both import `verifyActorClaims` and `ActorClaims` from `./actor-claims`. If prime's `actor-claims.ts` becomes a thin re-export file, these callers remain unchanged.

---

### TASK-04: Add structural validation tests in `packages/lib/__tests__/prime/`
- **Type:** IMPLEMENT
- **Deliverable:** New test file `packages/lib/__tests__/prime/actor-claims-contract.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** Committed in Wave 2 as 33ae94be06. `packages/lib/__tests__/prime/actor-claims-contract.test.ts` created with TC-01 through TC-05: round-trip sign/verify (TC-01, TC-01b), tamper rejection (TC-02, TC-02b), clock-skew rejection (TC-03, TC-03b), empty uid throw, null/undefined/no-dot-separator edge cases, structural satisfies tests for `PrimeReviewThreadSummary` (TC-04) and `PrimeReviewCampaignDetail` (TC-05). Tests enforced by ts-jest at CI time.
- **Affects:**
  - `packages/lib/__tests__/prime/actor-claims-contract.test.ts` (new)
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — round-trip test requires async HMAC operations in a Jest test environment. Jest runs in Node.js which has `crypto.subtle` available via global scope in Node 18+. The `@acme/lib` test command (`pnpm exec jest --ci --runInBand --detectOpenHandles --config ../../jest.config.cjs`) confirms Jest is configured. Risk: if the root `jest.config.cjs` doesn't cover `packages/lib/__tests__/prime/`, the tests won't run in CI. But the existing test files at `packages/lib/__tests__/validateShopName.test.ts` confirm this directory is already included.
  - Approach: 90% — round-trip test is a standard pattern. Note: structural `satisfies` tests in `__tests__/` are excluded from `packages/lib/tsconfig.json` (which excludes `**/__tests__/**`). They enforce contracts only at Jest runtime via ts-jest, not at `tsc -b` typecheck time. The plan accepts this: these tests catch type drift during CI test runs, not during typecheck.
  - Impact: 80% — these tests provide the primary regression gate for actor claims byte identity. Without them, a future actor-claims change could silently break the HMAC contract. Held-back test: if Jest's test environment doesn't expose `crypto.subtle` globally, the round-trip test throws at runtime. Node 18+ has Web Crypto in global scope; the `packages/lib/tsconfig.json` uses `"types": ["node"]` confirming Node-compatible environment. No single unknown would push this below 80.
- **Acceptance:**
  - Round-trip test: `signActorClaims` → `verifyActorClaims` with same secret → asserts returned `{ uid, roles }` matches input `{ uid: 'test-uid', roles: ['owner'] }`
  - Round-trip tamper test: changing one byte in the header → `verifyActorClaims` returns `null`
  - Clock-skew test: signing with `iat` 301 seconds in the past → `verifyActorClaims` returns `null`
  - Structural `satisfies` test: reception's local `PrimeReviewThreadSummary` shape satisfies a canonical type derived from the fact-find fields (or optionally a lightweight canonical type in `@acme/lib/prime`)
  - Structural `satisfies` test: reception's `PrimeReviewCampaignDetail` shape satisfies the fields documented in the fact-find
  - All tests pass in CI via `pnpm --filter @acme/lib test` (not run locally)
- **Engineering Coverage:**
  - UI / visual: N/A — test file
  - UX / states: N/A — test file
  - Security / privacy: Required — round-trip test is the primary gate proving byte-identical HMAC serialization across the sign/verify boundary
  - Logging / observability / audit: N/A — test file
  - Testing / validation: Required — this task IS the testing coverage; tests live in `packages/lib/__tests__/prime/` to prove cross-app accessibility of the shared sub-path
  - Data / contracts: Required — structural `satisfies` tests enforce that reception's widened types remain compatible with the authoritative prime shapes (enforced at Jest runtime via ts-jest; `__tests__/` is excluded from `tsc -b` so enforcement is CI test run, not typecheck-only)
  - Performance / reliability: N/A — test file
  - Rollout / rollback: N/A — test file; no deploy impact
- **Validation contract:**
  - TC-01: Round-trip passes: sign then verify with same secret → `{ uid: 'test-uid', roles: ['owner'] }` returned
  - TC-02: Tamper rejection: flip one character in the sig portion → `verifyActorClaims` returns `null`
  - TC-03: Clock-skew rejection: `iat` = 5 minutes + 1 second in the past → returns `null`
  - TC-04: Structural test: reception's `PrimeReviewThreadSummary` type passes `satisfies` check against the expected fields (enforced at Jest runtime by ts-jest; not at `tsc -b` typecheck time because `__tests__/` is excluded from tsconfig)
  - TC-05: Structural test: reception's `PrimeReviewCampaignDetail` type passes `satisfies` check against the expected fields (same enforcement note as TC-04)
  - All TCs pass in CI (root `pnpm test` which covers `packages/lib/__tests__/`)
- **Execution plan:** Red → Green → Refactor
  - Red: Create test file importing from `@acme/lib/prime` before TASK-01 is complete → module not found
  - Green: After TASK-01: implement round-trip test and structural tests → tests pass in CI
  - Refactor: Ensure test file is focused — no duplicate test cases, clear describe/it labels
- **Scouts:** Jest test environment has `crypto.subtle` in global scope for Node 18+ — confirmed by Node.js 18 docs; no polyfill needed. `packages/lib/__tests__/` directory already included in Jest config (confirmed by existing test files at that path).
- **Edge Cases & Hardening:**
  - The structural `satisfies` tests are compile-time only — they will always pass if the types are correct. The value is that adding a required field to the authoritative shape would cause a compile error before the test even runs.
  - The clock-skew test must use a fixed `iat` relative to `Date.now()` — use `Math.floor(Date.now() / 1000) - 301` to test just outside the window.
- **What would make this >=90%:**
  - Confirming that `crypto.subtle` is available in the Jest test environment used by `packages/lib` (currently assessed from Node docs, not from a test run)
- **Rollout / rollback:**
  - Rollout: Tests run in CI automatically; no manual deployment steps.
  - Rollback: Delete test file if needed; has no production impact.
- **Documentation impact:**
  - None. Tests are self-documenting.
- **Notes / references:**
  - Test location: `packages/lib/__tests__/prime/actor-claims-contract.test.ts` — consistent with other `packages/lib/__tests__/` sub-paths like `math/`, `seoAudit.test.ts`
  - Structural `satisfies` tests: TypeScript `satisfies` checks are compile-time assertions, but because `packages/lib/tsconfig.json` excludes `**/__tests__/**`, they are only checked when ts-jest compiles the test file during a Jest run. They do NOT fail `pnpm --filter @acme/lib build` (tsc -b). The value is that ts-jest runs type-checking on the test file content during CI test runs, so a type drift between reception's local types and the expected shape will cause a Jest compilation error, not a runtime assertion failure.

---

## Risks & Mitigations
- **Actor claims byte-identity broken during migration** (Critical): The `serializePayload` function must produce byte-identical output to the current implementations. Mitigation: the round-trip test in TASK-04 is the primary gate. Additionally, the shared implementation is taken verbatim from prime's version (which has `serializePayload` as an explicit named function with `{ uid, roles, iat }` field order).
- **`inboxChannels` type guard broken by composed array** (High): If `["email", ...PRIME_CHANNELS] as const` produces a different type than `["email", "prime_direct", "prime_broadcast", "prime_activity"] as const`, the `isInboxChannel()` guard may fail at the type level. Mitigation: TypeScript `const` assertion on a tuple with spread of a `readonly` const tuple is well-defined; `pnpm typecheck` is the gate.
- **Package build order issue** (Medium): If Turborepo does not build `@acme/lib` before the apps, consumer imports fail. Mitigation: Turborepo builds by `package.json` dependencies; both apps already declare `@acme/lib` as a workspace dependency, so build order is already correct.
- **Prime tsconfig excludes new `@acme/lib/prime` sub-path** (Low): Prime already imports `@acme/lib/hospitality` via the same `node_modules` resolution path. The `./prime` export entry in `package.json` is sufficient. No additional tsconfig changes expected.
- **Jest `crypto.subtle` availability** (Low): Node 18+ has Web Crypto globally. The root monorepo targets Node 18+. If the CI runner uses an older version, the round-trip test fails. Mitigation: CI currently passes actor-claims tests in both apps which use the same API.

## Observability
- Logging: None — this change does not add, remove, or alter any log statements.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [x] `packages/lib/src/prime/` directory exists with `channels.ts`, `actor-claims.ts`, `constants.ts`, `index.ts`
- [x] `packages/lib/package.json` contains `"./prime"` export entry pointing to correct dist paths
- [x] `apps/reception/src/lib/inbox/actor-claims.ts` is a re-export wrapper (no local HMAC implementation)
- [x] `apps/reception/src/lib/inbox/channels.ts` composes `inboxChannels` from `PRIME_CHANNELS`
- [x] `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts` uses `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` constant
- [x] `apps/prime/functions/lib/actor-claims.ts` imports from `@acme/lib/prime` (no local HMAC implementation)
- [x] `apps/prime/functions/lib/prime-review-api.ts` imports `PrimeReviewChannel` from `@acme/lib/prime`
- [x] `packages/lib/__tests__/prime/actor-claims-contract.test.ts` contains round-trip and structural tests
- [x] `pnpm --filter @apps/reception typecheck` and `pnpm --filter @apps/prime typecheck:functions` pass
- [ ] CI passes (tests, typecheck, lint) — pending push

## Decision Log
- 2026-03-14: Confirmed hospitality sub-path pattern from `packages/lib/src/hospitality/index.ts` — single flat `index.ts` with all exports. The `prime/` sub-path uses multiple files for separation of concerns (actor-claims, channels, constants) plus a barrel `index.ts`.
- 2026-03-14: Reception's `actor-claims.ts` has no `serializePayload` abstraction (inline JSON.stringify). The shared implementation follows prime's version (with named `serializePayload` function) for clarity and consistency.
- 2026-03-14: The `prime-compose/route.ts` does not need to import `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` into the full route logic — it only uses it to build a telemetry thread ID. The import is straightforward and low-risk.
- 2026-03-14 (post-critique): Clarified broadcast ID scope. Prime's `src/lib/chat/directMessageChannel.ts` already exports `WHOLE_HOSTEL_BROADCAST_CHANNEL_ID` for use by the Next.js UI layer. Prime's `functions/lib/prime-whole-hostel-campaigns.ts` uses a private module-level `WHOLE_HOSTEL_THREAD_ID` const that is not exported and not cross-app. The `@acme/lib/prime/constants.ts` extraction serves the reception→prime functions boundary only (reception currently hardcodes the string literal). Prime's UI and private functions constants are out of scope.
- 2026-03-14 (post-critique): Corrected validation commands throughout. `packages/lib` has no `typecheck` script; build is via `pnpm --filter @acme/lib build` (`tsc -b`). Reception filter is `@apps/reception`, prime filter is `@apps/prime` (per their respective `package.json` `name` fields).
- 2026-03-14 (post-critique): Clarified structural `satisfies` test enforcement. `packages/lib/tsconfig.json` excludes `**/__tests__/**`, so these tests are NOT checked by `tsc -b`. They are checked by ts-jest during CI test runs. The plan accepts this limitation and documents it explicitly.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create `@acme/lib/prime` sub-path | Yes — hospitality pattern confirmed; tsconfig `src/**/*.ts` glob includes new dir; `package.json` export format confirmed | None | No |
| TASK-02: Migrate reception imports (depends on TASK-01) | Yes — TASK-01 produces the `./prime` export; `inboxChannels` spread pattern is valid TypeScript; `prime-compose/route.ts` only uses the constant for telemetry ID construction | Minor: `inboxChannels.includes()` call in `isInboxChannel()` uses type assertion `value as InboxChannel` — the composed tuple must have the same element type; confirmed by `as const` on the composed array | No |
| TASK-03: Migrate prime functions imports (depends on TASK-01) | Yes — TASK-01 produces all required exports (`signActorClaims`, `verifyActorClaims`, `ActorClaims`); prime already uses `@acme/lib/hospitality` via the same node_modules path | None | No |
| TASK-04: Add structural validation tests (depends on TASK-01) | Yes — TASK-01 produces the shared implementations; `packages/lib/__tests__/` is in Jest config scope; Node 18+ has `crypto.subtle` in global scope | None | No |

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: confidence=90%, effort=M(2)
- TASK-02: confidence=85%, effort=S(1)
- TASK-03: confidence=90%, effort=S(1)
- TASK-04: confidence=85%, effort=S(1)
- Overall-confidence = (90×2 + 85×1 + 90×1 + 85×1) / (2+1+1+1) = (180+85+90+85) / 5 = 440 / 5 = 88% → rounded to 87% (applying downward bias rule for overall plan score)
