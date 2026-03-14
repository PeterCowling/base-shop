---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-prime-source-field-consistency
Dispatch-ID: IDEA-DISPATCH-20260314200000-0008
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: none
---

# Reception Prime Source Field Consistency Plan

## Summary

Two functions that build email inbox thread summaries — `buildThreadSummary` and `buildThreadSummaryFromRow` in `apps/reception/src/lib/inbox/api-models.server.ts` — never set the `source` field on the returned `InboxThreadSummaryApiModel`. The field was added with type `"email" | "prime"` and is correctly set to `"prime"` in the Prime adapter (`mapPrimeSummaryToInboxThread`), but is silently undefined for all email threads. Any downstream code checking `source` to identify email threads receives `undefined` instead of `"email"`. This single-task plan adds `source: "email"` to both email-path builder functions and adds a unit test covering both paths.

## Active tasks
- [x] TASK-01: Set `source: "email"` in both email thread summary builder functions and add unit tests

## Goals
- Both `buildThreadSummary` and `buildThreadSummaryFromRow` emit `source: "email"` on the returned object.
- A unit test in `apps/reception/src/lib/inbox/__tests__/api-models.server.test.ts` confirms both functions set `source: "email"`.
- No downstream code relies on `undefined` as a meaningful distinct value for `source`.

## Non-goals
- Any change to the Prime path (`mapPrimeSummaryToInboxThread`) — already correct.
- Changes to `InboxThreadSummaryApiModel` type definition.
- Adding source filtering logic or new consumers.
- Database schema changes.

## Constraints & Assumptions
- Constraints:
  - Tests run in CI only; no local `jest` or `pnpm test` invocations.
  - Pre-commit hooks must not be skipped.
- Assumptions:
  - No code in the current codebase uses `source === undefined` to mean "this is an email thread". Verified below via grep — only `options.source === "prime"` found in analytics.server.ts (unrelated to thread summary output).
  - The `source` field is optional (`source?: "email" | "prime"`) at the type level, but the intent per the JSDoc comment is that all threads should identify themselves. Setting it explicitly is the correct completion of the interface contract.

## Inherited Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** TBD
- **Intended Outcome Statement:** TBD
- **Source:** auto

## Analysis Reference
- Related analysis: `none` — no prior analysis artifact exists for this micro-fix.
- Selected approach inherited:
  - Direct one-line fix: add `source: "email"` to the return objects in both builder functions.
- Key reasoning used:
  - Fix is mechanical and completely understood from repo evidence; no analysis phase was needed.

## Selected Approach Summary
- What was chosen:
  - Add `source: "email"` in the return statement of `buildThreadSummary` (line ~332) and `buildThreadSummaryFromRow` (line ~397) in `apps/reception/src/lib/inbox/api-models.server.ts`.
- Why planning is not reopening option selection:
  - The type already defines the field and intent; this is a gap-fill, not a design decision.

## Fact-Find Support
- Supporting brief: `none`
- Evidence carried forward:
  - `buildThreadSummary` (line 327–355): no `source` field in return object.
  - `buildThreadSummaryFromRow` (line 369–420): no `source` field in return object.
  - `mapPrimeSummaryToInboxThread` (line 301–): sets `source: "prime"` — this is the correct pattern to mirror.
  - Grep of `source === undefined` / `source !== undefined` / `thread.source` across the entire reception `src/` directory returned only `options.source === "prime"` in `analytics.server.ts` — that is a separate analytics filter unrelated to thread summary output. No code treats `undefined` as a meaningful thread source value.
  - Existing tests in `api-models.server.test.ts` cover `buildThreadSummary`-adjacent parsing functions but do not test `source` field presence.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Set source: "email" in both builder functions and add tests | 90% | S | Complete (2026-03-14) | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — no rendering changes | - | Server-side API model only |
| UX / states | N/A — field addition does not change any visible state | - | Source field not rendered in UI currently |
| Security / privacy | N/A — no auth, input handling, or sensitive data affected | - | Thread source label is non-sensitive metadata |
| Logging / observability / audit | N/A — no logging changes needed for this field | - | No audit trail impact |
| Testing / validation | Required — new unit tests confirm `source: "email"` on both code paths | TASK-01 | Tests added to existing test file |
| Data / contracts | Required — field was always typed but never populated; fix completes the contract | TASK-01 | No schema or persistence changes |
| Performance / reliability | N/A — single field assignment, negligible overhead | - | |
| Rollout / rollback | N/A — no migration, no flag; rollback is a one-line revert | - | |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task; no dependencies |

## Delivered Processes

None: no material process topology change

## Tasks

### TASK-01: Set `source: "email"` in both email thread summary builder functions and add unit tests
- **Type:** IMPLEMENT
- **Deliverable:** Code change to `apps/reception/src/lib/inbox/api-models.server.ts` and updated tests in `apps/reception/src/lib/inbox/__tests__/api-models.server.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/reception/src/lib/inbox/api-models.server.ts`, `apps/reception/src/lib/inbox/__tests__/api-models.server.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — exact line locations confirmed from file read; change is one field per function. Held-back test: no single unknown would push this below 80. The only unknown is whether any unconventional consumer reads `undefined` as meaningful, but grep confirms none exists.
  - Approach: 95% — mirrors the already-correct Prime pattern; no alternative approach is needed.
  - Impact: 90% — field is typed optional, so existing code that does not read `source` is unaffected. Any future code checking `source` for email discrimination will now work correctly.
- **Acceptance:**
  - [ ] `buildThreadSummary` returns object with `source: "email"`.
  - [ ] `buildThreadSummaryFromRow` returns object with `source: "email"`.
  - [ ] Unit test TC-01 passes: `buildThreadSummary` result has `source === "email"`.
  - [ ] Unit test TC-02 passes: `buildThreadSummaryFromRow` result has `source === "email"`.
  - [ ] No existing tests are broken by the change.
- **Engineering Coverage:**
  - UI / visual: N/A — server-only model serializer, no rendering involved
  - UX / states: N/A — no UI state change
  - Security / privacy: N/A — non-sensitive metadata field
  - Logging / observability / audit: N/A — no log/audit trail impact
  - Testing / validation: Required — add two test cases covering both builder functions in the existing test file
  - Data / contracts: Required — complete the populated field on the existing `InboxThreadSummaryApiModel` interface
  - Performance / reliability: N/A — single field assignment
  - Rollout / rollback: N/A — no migration; revert via git
- **Validation contract:**
  - TC-01: call `buildThreadSummary` with a minimal `InboxThreadRecord` → returned object has `source === "email"`
  - TC-02: call `buildThreadSummaryFromRow` with a minimal `ThreadWithLatestDraftRow` → returned object has `source === "email"`
  - TC-03: existing `parseThreadMetadataFromRow` tests continue to pass unmodified
- **Execution plan:** Red → Green → Refactor
  - Red: add TC-01 and TC-02 assertions targeting `source` — both will fail before fix
  - Green: add `source: "email"` to return objects in both `buildThreadSummary` and `buildThreadSummaryFromRow`
  - Refactor: none required — change is additive and minimal
- **Planning validation (required for M/L):**
  - None: S-effort task; validation was direct file reading + grep
- **Scouts:** None: both target lines are confirmed by direct file read; no ambiguity about location or signature.
- **Edge Cases & Hardening:**
  - Existing call sites (`apps/reception/src/app/api/mcp/inbox/route.ts` at line 66 and `apps/reception/src/app/api/mcp/inbox/[threadId]/route.ts` at line 78) pass through the returned model directly — no spreading/merging that would drop the field.
  - The `source` field is typed `optional` on `InboxThreadSummaryApiModel`, so adding it does not break any TypeScript consumer that was not reading it.
- **What would make this >=90%:**
  - Already at 90%; would reach 95% after tests confirm green in CI.
- **Rollout / rollback:**
  - Rollout: standard deploy — no flags, no migration.
  - Rollback: revert the two-line diff; no downstream state affected.
- **Documentation impact:**
  - None: the JSDoc comment on `InboxThreadSummaryApiModel.source` already documents the intent. No further documentation change needed.
- **Notes / references:**
  - `mapPrimeSummaryToInboxThread` at line 307 of `prime-review.server.ts` is the canonical pattern: `source: "prime"`.
  - Consumer tracing: the only `source` field consumer found is `options.source === "prime"` in `analytics.server.ts` (unrelated analytics filter). No consumer reads the thread summary `source` field today. Adding the value now makes the field correct and safe for future consumers.

## Risks & Mitigations
- No material risk. The change is additive; the field was always intended to be populated. No consumer of `undefined` exists.

## Observability
- Logging: None — not applicable to this change.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] Both builder functions return `source: "email"` on all code paths.
- [ ] Unit tests TC-01 and TC-02 pass in CI.
- [ ] TypeScript types continue to pass (`pnpm typecheck`).
- [ ] Lint continues to pass (`pnpm lint`).

## Decision Log
- 2026-03-14: Both `buildThreadSummary` and `buildThreadSummaryFromRow` confirmed as the two fix sites; no analysis phase needed. [Adjacent: delivery-rehearsal] — consumer tracing finds no active reader of `source` on email threads today; the fix is still warranted to complete the interface contract.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add `source: "email"` to both builder functions and add tests | Yes — both functions confirmed in file at exact lines; test file confirmed to exist and accept new `describe` blocks; `InboxThreadSummaryApiModel` type already supports the field as optional | None | No |

## Overall-confidence Calculation
- TASK-01: S=1, confidence=90%
- Overall-confidence = (90 × 1) / 1 = **90%**
