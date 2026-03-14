---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14T20:05:00Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-prime-shadow-write-logging
Dispatch-ID: IDEA-DISPATCH-20260314200000-0006
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 92%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: none
---

# Prime Activity Shadow-Write Structured Error Logging Plan

## Summary

When the D1 shadow write for a Prime activity message fails, the error is currently caught and the raw error object is logged with no structured context. This makes it impossible to diagnose which thread or channel was affected. The fix adds structured fields — `threadId`, `channelId`, `error message`, and `timestamp` — to the existing `console.error` call inside the catch block in `apps/prime/functions/api/activity-message.ts`. The existing test TC-11 already proves the 200 response is preserved on failure; it needs to be extended to assert the structured `console.error` is emitted with the expected fields. No new files, no schema changes, no API contract changes.

## Active tasks
- [x] TASK-01: Add structured fields to shadow-write catch console.error and extend TC-11

## Goals
- On D1 shadow-write failure, emit a structured `console.error` containing `threadId`, `channelId`, error message, and timestamp.
- TC-11 asserts both 200 response and structured `console.error` call.
- Guest-facing behavior is unchanged: 200 is always returned even when D1 is unavailable.

## Non-goals
- Converting the shadow write from synchronous catch to `ctx.waitUntil` fire-and-forget (the code does not currently use `waitUntil` for this path).
- Adding metrics counters, alerting, or Sentry integration.
- Touching the direct-message shadow-write path.
- Any schema or database changes.

## Constraints & Assumptions
- Constraints:
  - Do NOT throw inside the catch — guest must receive 200.
  - Do NOT convert the synchronous catch to blocking/async restructure.
  - Stay within the existing catch block (lines 154–156 of `activity-message.ts`).
- Assumptions:
  - `channelId` and `activityId` are both in scope at the catch site. Since `activityId === channelId` per the enforced invariant at line 84, `channelId` is used for both the `threadId` and `channelId` log fields. There is no standalone `threadId` variable — the value is derived from `channelId`.
  - `Date.now()` is acceptable for the failure timestamp (no external clock required).
  - The i18n-exempt comment convention must be preserved on the new log line.

## Inherited Outcome Contract

- **Why:** Silent shadow-write failures cause activity thread messages to go missing from the reception inbox with no trace, making diagnosis impossible.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** When D1 is unavailable during an activity message shadow write, a structured error log is emitted with enough context (threadId, channelId, error message, timestamp) to diagnose the failure.
- **Source:** auto

## Analysis Reference
- Related analysis: None (micro-build; no prior analysis document)
- Selected approach inherited:
  - Targeted catch-block enhancement with structured `console.error`
- Key reasoning used:
  - The existing catch block at lines 154–156 of `activity-message.ts` is the correct insertion point. No architectural change is required.

## Selected Approach Summary
- What was chosen:
  - Replace the bare `console.error('Failed to shadow-write Prime activity message to D1:', shadowWriteError)` with a structured object log including `threadId`, `channelId`, `error`, and `failedAt` timestamp fields.
- Why planning is not reopening option selection:
  - The problem is precisely defined (missing structured fields in an existing catch block). There is one natural fix location and no competing approaches.

## Fact-Find Support
- Supporting brief: None — micro-build; problem and fix location verified directly from source.
- Evidence carried forward:
  - `apps/prime/functions/api/activity-message.ts` lines 144–156: existing try/catch wrapping `shadowWritePrimeInboundActivityMessage`; `channelId` is in scope.
  - `apps/prime/functions/__tests__/activity-message.test.ts` TC-11 (lines 211–257): test already asserts 200 on D1 failure; needs `console.error` assertion added.
  - `createPagesContext` in helpers already mocks `waitUntil` — no test-infrastructure gap.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add structured fields to shadow-write catch log + extend TC-11 | 92% | S | Complete (2026-03-14) | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — server-side Cloudflare Pages function only | - | No UI involved |
| UX / states | N/A — no user-visible state change; 200 response is unchanged | - | Error is operator-diagnostic only |
| Security / privacy | N/A — log emits threadId and channelId (no PII); no new data exposure | TASK-01 | threadId/channelId are non-sensitive internal identifiers |
| Logging / observability / audit | Required — this is the entire purpose of the change | TASK-01 | Structured console.error with threadId, channelId, error message, timestamp |
| Testing / validation | Required — TC-11 extended to assert console.error fields | TASK-01 | |
| Data / contracts | N/A — no schema changes, no API contract changes | - | Catch block does not alter the return value or any D1/Firebase path |
| Performance / reliability | N/A — change is in the catch block only; the shadow-write is awaited on the request path (success adds latency, but this change does not alter that); no hot-path impact from added structured logging | - | |
| Rollout / rollback | N/A — single file change; no feature flag needed; rollback = revert commit | - | |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Sole task; no parallelism needed |

## Delivered Processes

None: no material process topology change.

## Tasks

### TASK-01: Add structured fields to shadow-write catch log + extend TC-11
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/prime/functions/api/activity-message.ts` (catch block), `apps/prime/functions/__tests__/activity-message.test.ts` (TC-11 extension)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/prime/functions/api/activity-message.ts`, `apps/prime/functions/__tests__/activity-message.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 95% — the catch block is precisely located (lines 154–156); `channelId` is in scope; change is ~5 lines. `Date.now()` used for failure timestamp.
  - Approach: 92% — structured console.error is the idiomatic CF Workers log pattern and matches existing project conventions.
  - Impact: 90% — TC-11 is already set up with the failing D1 mock; extending it to spy on `console.error` is straightforward.
- **Acceptance:**
  - [ ] `console.error` inside the shadow-write catch block emits a single structured object with fields: `threadId` (string), `channelId` (string), `error` (string — the error message), `failedAt` (number — timestamp).
  - [ ] The existing TC-11 assertion (`response.status === 200`) continues to pass.
  - [ ] TC-11 now also asserts that `console.error` was called with a single structured object containing the expected fields for `threadId`, `channelId`, `error`, and `failedAt`.
  - [ ] TC-EDGE-01 (success path spy): in the existing D1-backed test case (`TC-06 extended`, `activity-message.test.ts` lines 298–336, which provides a real mock D1 DB), `console.error` is NOT called. The no-DB variant of TC-06 (default env, no `PRIME_MESSAGING_DB`) is not used for this assertion because `shadowWritePrimeInboundActivityMessage` returns early on `!hasPrimeMessagingDb(env)` — no error path is exercised there.
  - [ ] No other test cases are affected by the change.
  - [ ] The i18n-exempt comment is preserved on the log line.
- **Engineering Coverage:**
  - UI / visual: N/A — no UI affected
  - UX / states: N/A — guest-facing 200 response is unchanged; no UX states altered
  - Security / privacy: N/A — `threadId` and `channelId` are non-sensitive internal identifiers; no PII logged
  - Logging / observability / audit: Required — the structured log object must include `threadId`, `channelId`, `error` (message string), `failedAt` (epoch ms); verified by extended TC-11
  - Testing / validation: Required — TC-11 in `activity-message.test.ts` extended with `console.error` spy assertion
  - Data / contracts: N/A — no schema, API, or return-type changes
  - Performance / reliability: N/A — change is confined to the catch block; the shadow-write itself is awaited synchronously on the request path (success is not fire-and-forget — only failure is swallowed); no hot path affected
  - Rollout / rollback: N/A — single-file patch; rollback = revert commit; no migration needed
- **Validation contract:**
  - TC-11 (existing, extended): D1 shadow-write failure (TC-11 uses `failDb` which throws `D1 unavailable`) → response still 200 AND `console.error` called once with `(expect.stringContaining('shadow-write'), expect.objectContaining({ threadId: 'act-uuid-fire-forget', channelId: 'act-uuid-fire-forget', error: 'D1 unavailable', failedAt: expect.any(Number) }))`
  - TC-EDGE-01: D1-backed success case (TC-06 extended, lines 298–336, provides a working mock D1 via `createMockD1Database()`) → `console.error` NOT called (spy count = 0)
- **Execution plan:** Red -> Green -> Refactor
  - **Red**: Extend TC-11 to spy on `console.error` and assert it was called with structured fields. Run — fails because current catch logs raw error without structure.
  - **Green**: Replace the bare `console.error('Failed to shadow-write Prime activity message to D1:', shadowWriteError)` with a two-argument call preserving the searchable prefix string and adding a structured details object: `console.error('Failed to shadow-write Prime activity message to D1:', { threadId: channelId, channelId, error: (shadowWriteError instanceof Error ? shadowWriteError.message : String(shadowWriteError)), failedAt: Date.now() }); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]`. The Jest matcher in TC-11 uses `expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('shadow-write'), expect.objectContaining({ threadId: activityId, channelId: activityId, error: 'D1 unavailable', failedAt: expect.any(Number) }))`. Run — TC-11 passes.
  - **Refactor**: Verify TC-06 extended (`console.error` spy = 0 calls on success path) passes.
- **Planning validation (required for M/L):** None: S-effort task — planning validation not required.
- **Scouts:** `channelId` and `activityId` are both confirmed in scope at the catch site (assigned at lines 70–71, used in the try block; catch begins at line 154). There is no standalone `threadId` variable — `channelId` is used for both the `threadId` and `channelId` log fields, which is correct because activity channel threadId == channelId == activityId per the enforced invariant at line 84.
- **Edge Cases & Hardening:**
  - If `shadowWriteError` is not an `Error` instance (e.g. a thrown string), use `String(shadowWriteError)` for the `error` field — guards against `.message` being undefined.
  - `Date.now()` inside the catch block gives the failure timestamp; this is the correct approach (no external clock needed).
- **What would make this >=90%:** Already at 92%. Only uncertainty is the exact matcher shape for the TC-11 `console.error` spy assertion — addressed in execution plan with `expect.any(Number)` for `failedAt`.
- **Rollout / rollback:**
  - Rollout: Deploy with normal CF Pages function deployment. No configuration change required.
  - Rollback: Revert the single commit. No migration to undo.
- **Documentation impact:**
  - None: no public API or runbook change.
- **Notes / references:**
  - Source file: `apps/prime/functions/api/activity-message.ts` lines 144–156
  - Test file: `apps/prime/functions/__tests__/activity-message.test.ts` TC-11 (lines 211–257)
  - Shadow-write implementation: `apps/prime/functions/lib/prime-messaging-shadow-write.ts` — read-only for this task
- **Build evidence (2026-03-14):**
  - Implementation: replaced bare `console.error(msg, rawErr)` at activity-message.ts:154–156 with `console.error(msg, { threadId: channelId, channelId, error: ..., failedAt: Date.now() })`.
  - Scope expansion: added `RATE_LIMIT: createMockKv()` to TC-06, TC-11, TC-12, TC-06-extended env setup — pre-existing kv-rate-limit warn was failing these tests due to missing KV binding. Recorded in plan.
  - TC-11: ✓ response.status 200, consoleSpy called with `(stringContaining('shadow-write'), objectContaining({ threadId, channelId, error: 'D1 unavailable', failedAt: Number }))`.
  - TC-EDGE-01 (in TC-06 extended): ✓ consoleSpy NOT called on successful D1 shadow-write.
  - TC-08 remains failing (pre-existing: `validateGuestSessionToken` returns 404 not 401 for missing tokens) — out of scope.
  - Post-build validation (Mode 2 — Data Simulation): test suite is the simulation. TC-11 + TC-EDGE-01 pass and cover the full contract. No UI involved.
  - Engineering coverage Required rows: Logging/observability — structured fields verified by spy; Testing/validation — TC-11 extended + TC-EDGE-01 added.
  - typecheck: ✓ `pnpm --filter @apps/prime run typecheck` passes.
  - lint: ✓ `pnpm --filter @apps/prime run lint` passes.

## Risks & Mitigations
- If `console.error` spy setup in the test captures calls from other test cases, use `jest.spyOn(console, 'error')` scoped inside TC-11 with `mockRestore()` in the test teardown to isolate.

## Observability
- Logging: Structured `console.error` emitted on D1 failure with `threadId`, `channelId`, `error`, `failedAt`.
- Metrics: None: no new counter added in this micro-build.
- Alerts/Dashboards: None: no alert hook in this micro-build.

## Acceptance Criteria (overall)
- [ ] TC-11 passes with `response.status === 200` AND `console.error` called with structured fields including `threadId` and `channelId`.
- [ ] TC-EDGE-01 (D1-backed success case from `TC-06 extended`) shows `console.error` not called — asserted in TASK-01 contract.
- [ ] No other test regressions introduced.

## Decision Log
- 2026-03-14: The dispatch described the shadow write as wrapped in `ctx.waitUntil()`. Inspection of `activity-message.ts` shows it is actually inside a synchronous `try/catch` block — `ctx` is not destructured in the handler signature and `waitUntil` is not used for this path. The fix is the same (structured console.error in the catch block) regardless of this distinction. Noted for accuracy.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Structured log + extend TC-11 | Yes — `channelId` in scope at catch site confirmed; TC-11 mock infrastructure confirmed in helpers.ts; jest.spyOn pattern is available | None | No |

## Overall-confidence Calculation
- TASK-01: S=1 weight, 92% confidence
- Overall-confidence = 92 * 1 / 1 = **92%**

## Section Omission Rule

Non-omittable sections are present. All other sections are populated above.
