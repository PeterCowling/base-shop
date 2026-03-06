---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: email-logging-observability
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/email-logging-observability/plan.md
Dispatch-IDs: IDEA-DISPATCH-20260306170000-0001, IDEA-DISPATCH-20260306170000-0002, IDEA-DISPATCH-20260306170000-0003
Trigger-Source: dispatch-routed
---

# Email Logging Observability Fact-Find Brief

## Scope

### Summary

Three structural logging gaps in `packages/mcp-server/src/tools/gmail*` leave the email pipeline partially blind during troubleshooting. When `gmail_reconcile_in_progress` recovers stuck emails, per-email context (stale reason, age) is not persisted — though standard lock/outcome entries are written by the `handleMarkProcessed` call. When processing fails mid-session and `cleanupInProgress()` runs, the triggering error is not persisted. When `ensureLabelMap` fails to create a required Gmail label, the failure is silently discarded.

**Architectural reality (`gmail.ts` monolith):** `gmail.ts` contains its own LOCAL copies of `AuditEntry`, `TelemetryEventKey`, `TelemetryEventSchema`, `appendAuditEntry`, `appendTelemetryEvent`, `ensureLabelMap`, `cleanupInProgress`, and `handleReconcileInProgress` — parallel to the canonical extracted versions in `gmail-shared.ts`, `gmail-handlers.ts`, and `gmail-reconciliation.ts`. The tool router (`handleGmailTool`) calls the LOCAL implementations in `gmail.ts`; the extracted modules are NOT on the router's runtime path. ALL fixes must target the monolith-local functions, with matching changes in the shared types for consistency.

### Goals
- Emit a new `email_reconcile_recovery` telemetry event per recovered email inside the LOCAL `handleReconcileInProgress` (before the `handleMarkProcessed` call), capturing stale reason and age.
- Persist the triggering error reason in the `lock-released` audit entry emitted by both `cleanupInProgress` copies on their error paths.
- Emit a stderr warning in both `ensureLabelMap` copies when label creation fails.
- Extend the `gmail_telemetry_daily_rollup` counter to include `email_reconcile_recovery` so the new events are queryable via the MCP tool.

### Non-goals
- Routing the tool router to use the extracted `gmail-reconciliation.ts` (architectural consolidation deferred).
- Changing the behavior of any Gmail API operation (all fixes are logging-only).
- Consolidating the two `cleanupInProgress` or two `ensureLabelMap` implementations.

### Constraints & Assumptions
- Constraints:
  - Tests run in CI only per `docs/testing-policy.md`.
  - `max-lines-per-function` lint rule (300 lines) — additions must remain compact.
  - Fail-open policy: no logging call must block or throw.
  - `TelemetryEventSchema` is defined in BOTH `gmail.ts:213` (local, not exported) and `gmail-shared.ts:186` (exported). Both Zod enums must be updated together.
- Assumptions:
  - A new `TelemetryEventKey` (`"email_reconcile_recovery"`) is correct to avoid double-counting the `email_queue_transition` already emitted by `handleMarkProcessed` for each recovered email.
  - `error_reason?: string` added to both `AuditEntry` definitions is safe — no consumer parses this field programmatically.
  - Stderr is acceptable for Gap 3 label creation warnings — consistent with existing write-failure pattern; no `messageId` available to persist a structured entry.

## Outcome Contract

- **Why:** Three identified logging gaps leave the email pipeline partially blind. Reconcile recovery lacks per-email context; error-path lock-releases carry no error reason; label creation failures produce zero trace.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this change: (1) each non-dry-run reconcile recovery emits an `email_reconcile_recovery` event with `reason` and `age_hours`, visible in the daily rollup; (2) error-path `lock-released` entries carry an `error_reason` field; (3) `ensureLabelMap` label creation failures emit a stderr warning. All fail-open guarantees are preserved.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

**Gap 1 — reconcile recovery telemetry:**
- `packages/mcp-server/src/tools/gmail.ts:3197` — LOCAL `handleReconcileInProgress(gmail, args)` — called by the router at `gmail.ts:3483`. Takes `(gmail, args)` only (no `handleMarkProcessedFn` parameter). Directly calls `handleMarkProcessed(gmail, { emailId, action, actor })` at line 3332.
- The telemetry emit goes BEFORE the `if (!dryRun)` block at line 3331, so reconcile context is captured only for real (non-dry-run) recoveries.
- `gmail-reconciliation.ts:41` — extracted module with a parallel `handleReconcileInProgress(gmail, args, handleMarkProcessedFn)` signature — NOT called by the router; informational only.

**Gap 2 — error_reason on lock-released:**
- `packages/mcp-server/src/tools/gmail.ts:2721` — LOCAL `cleanupInProgress(emailId, gmail)` — called from the LOCAL `handleMarkProcessed` at `gmail.ts:2968` on label-modify failure. Writes `lock-released` at line 2740 (error catch) with no error reason persisted.
- `packages/mcp-server/src/tools/gmail-shared.ts:718` — CANONICAL `cleanupInProgress(emailId, gmail)` — called from `gmail-handlers.ts:598` on label-modify failure. Same empty error-path audit entry pattern.
- Both copies need the fix.

**Gap 3 — ensureLabelMap silent failure:**
- `packages/mcp-server/src/tools/gmail.ts:937` — LOCAL `ensureLabelMap`; empty catch at ~line 967.
- `packages/mcp-server/src/tools/gmail-shared.ts:533` — CANONICAL `ensureLabelMap`; empty catch at ~line 564.
- Both copies need the fix.

### Key Modules / Files

- `packages/mcp-server/src/tools/gmail.ts` (~3500 lines) — contains all LOCAL runtime implementations. Key locals: `AuditEntry` (line 180), `TelemetryEventKey` (line 190), `TelemetryEventSchema` (line 213, NOT exported), `appendAuditEntry` (line 273), `appendTelemetryEvent` (line ~290), `ensureLabelMap` (line 937), `cleanupInProgress` (line 2721), `handleReconcileInProgress` (line 3197), and rollup logic (line 364).
- `packages/mcp-server/src/tools/gmail-shared.ts` — CANONICAL types. `AuditEntry` (line 151), `TelemetryEventKey` (line 161), `TelemetryEventSchema` (line 184), `appendAuditEntry` (line 314), `appendTelemetryEvent` (line 327), `ensureLabelMap` (line 533), `cleanupInProgress` (line 718), rollup (line 397).
- `packages/mcp-server/src/tools/gmail-handlers.ts` — calls SHARED `cleanupInProgress` at line 598; writes `lock-released` + `outcome` + `email_queue_transition` in `handleMarkProcessed` (lines 604–619).
- `packages/mcp-server/src/tools/gmail-reconciliation.ts` — extracted module; NOT on runtime path. Informational reference only.

### Patterns & Conventions Observed

- **Dual AuditEntry drift**: `gmail.ts:180` union is `"lock-acquired" | "lock-released" | "outcome"` (stale, missing dedup actions). `gmail-shared.ts:151` has the updated 5-action union. Gap 2 must update both.
- **Four TelemetryEvent schema locations**: `gmail.ts:190` (TelemetryEventKey union), `gmail.ts:213` (local TelemetryEventSchema Zod enum), `gmail-shared.ts:161` (TelemetryEventKey union), `gmail-shared.ts:186` (exported TelemetryEventSchema Zod enum). All four must be updated to add `"email_reconcile_recovery"`.
- **Rollup is key-filtered**: `gmail.ts:364` and `gmail-shared.ts:397` both enumerate specific event keys. `email_reconcile_recovery` is not counted without an explicit rollup extension.
- **`handleMarkProcessed` already writes `email_queue_transition` per recovered email** — so a second `email_queue_transition` before the call would double-count. New key `"email_reconcile_recovery"` avoids this.
- **Fail-open logging**: all `append*` helpers catch write errors to stderr. New calls must follow this pattern.

### Data & Contracts

- Types/schemas/events:
  - `AuditEntry` — TWO definitions. Gap 2: add `error_reason?: string` to both `gmail.ts:180` and `gmail-shared.ts:151`. Also sync the stale `gmail.ts` action union with `gmail-shared.ts`.
  - `TelemetryEventKey` — TWO definitions. Gap 1: add `"email_reconcile_recovery"` to `gmail.ts:190` and `gmail-shared.ts:161`.
  - `TelemetryEventSchema` Zod enum — TWO definitions. Gap 1: add `"email_reconcile_recovery"` to `gmail.ts:213` and `gmail-shared.ts:186`.
  - `TelemetryEvent` shape: `message_id?`, `reason?` already present. New events use `reason` for the stale reason string. `age_hours` is a new optional numeric field — passes through the `.passthrough()` Zod schema.
- Persistence:
  - `data/email-audit-log.jsonl` — Gap 1 telemetry and Gap 2 audit entries land here.
  - stderr — Gap 3 label creation warnings.
- Rollup impact:
  - Both rollup implementations need a new bucket counter for `"email_reconcile_recovery"` — TASK-04 addresses this.

### Dependency & Impact Map

- Upstream dependencies: Gmail API — no changes.
- Downstream dependents:
  - `gmail_telemetry_daily_rollup` — reads `email-audit-log.jsonl`. Without TASK-04, new `email_reconcile_recovery` events are written but silently ignored by the rollup. With TASK-04, they appear as a new daily counter.
  - No code consumers parse `AuditEntry.error_reason` or `AuditEntry.action` unions at runtime — additive field and sync are safe.
- Likely blast radius:
  - **Gap 1**: `gmail.ts:3197` (local reconcile handler) + 4 schema locations. Additive telemetry.
  - **Gap 2**: `gmail.ts:180` + `gmail.ts:2740` (local AuditEntry + local cleanupInProgress error path) + `gmail-shared.ts:151` + `gmail-shared.ts:718` (shared AuditEntry + shared cleanupInProgress error path).
  - **Gap 3**: `gmail.ts:~967` + `gmail-shared.ts:~564`.
  - **TASK-04 rollup**: `gmail.ts:364` + `gmail-shared.ts:397`.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (`/** @jest-environment node */`), mocked Gmail client via `jest.fn()`
- Commands: CI only. `pnpm -w run test:governed -- jest -- --config=packages/mcp-server/jest.config.cjs --testPathPattern=<pattern> --no-coverage`
- CI integration: `reusable-app.yml`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Audit log writes | Unit | `gmail-audit-log.test.ts` | `appendAuditEntry` write behavior |
| Lock store | Unit | `lock-store.test.ts` | Lock acquire/release mechanics |
| Mark processed | Unit | `gmail-mark-processed.test.ts` | `handleMarkProcessed` outcomes and telemetry |
| Create draft dedup | Unit | `gmail-create-draft.test.ts` | TC-10, TC-11 audit entries |
| Audit labels | Unit | `gmail-audit-labels.test.ts` | TC-A1, TC-A2, TC-A3 |
| LOCAL `handleReconcileInProgress` | **None** | — | No test for the gmail.ts local handler |
| `cleanupInProgress` error path | **None** | — | Not directly tested in either copy |
| `ensureLabelMap` catch block | **None** | — | Empty catch makes this currently untestable |

#### Coverage Gaps

- Untested paths:
  - LOCAL `handleReconcileInProgress` in `gmail.ts` — new test file `gmail-reconciliation.test.ts` with TC-R3 (telemetry emitted per non-dry-run recovered email) and TC-R4 (dry-run emits no telemetry).
  - `cleanupInProgress` error path in `gmail.ts:2740` and `gmail-shared.ts` equivalent — TC-E1: mock label-modify throw → assert `lock-released` entry has `error_reason`.
  - `ensureLabelMap` label creation failure — TC-L1: mock `labels.create` throw → assert stderr warning.
  - `gmail_telemetry_daily_rollup` new bucket — TC-RU1: assert `email_reconcile_recovery` events appear in the rollup output (can extend existing rollup tests).

#### Testability Assessment

- Easy to test: all four gaps with existing mock-gmail pattern. No new test seams needed.
- Test seams: `AUDIT_LOG_PATH` env var redirect + `setLockStore` already exist.

### Recent Git History (Targeted)

- `55d7d1c503` — `fix(mcp-server): correct AuditEntry action type` — updated `gmail-shared.ts` AuditEntry union but did NOT update the local `gmail.ts:180` copy. This is the origin of the current drift.
- `d1f8b5f24d` — `fix: route gmail dedup logic through modular handlers` — established the dual-implementation pattern.

## Questions

### Resolved

- Q: Does the router call `gmail-reconciliation.ts` or the local `gmail.ts` handler?
  - A: LOCAL `gmail.ts:3197`. Confirmed: router `case "gmail_reconcile_in_progress"` at line 3483 calls the local function. The extracted module is not imported by the router.
  - Evidence: grep of `gmail.ts` lines 3197, 3483.

- Q: Does the local reconcile handler use `handleMarkProcessedFn` as a parameter?
  - A: No. `gmail.ts:3197` signature is `(gmail, args)` only. It calls `handleMarkProcessed(gmail, {...})` directly at line 3332. The `handleMarkProcessedFn` parameter pattern is from the extracted `gmail-reconciliation.ts` module only.
  - Evidence: `gmail.ts:3197–3200`, `gmail.ts:3331–3336`.

- Q: Does `handleMarkProcessed` already write `email_queue_transition` per recovered email?
  - A: Yes — both `gmail-handlers.ts:615` and `gmail.ts` local `handleMarkProcessed` write `email_queue_transition`. New key `"email_reconcile_recovery"` avoids double-counting.

- Q: Is `cleanupInProgress` called from one place or two?
  - A: Two. LOCAL `gmail.ts:2721` called from local `handleMarkProcessed` at `gmail.ts:2968`. CANONICAL `gmail-shared.ts:718` called from `gmail-handlers.ts:598`. Both need `error_reason` added.

- Q: How many locations need TelemetryEventKey/Schema update?
  - A: Four. `gmail.ts:190` (TelemetryEventKey union), `gmail.ts:213` (local TelemetryEventSchema Zod enum, NOT exported), `gmail-shared.ts:161` (TelemetryEventKey union), `gmail-shared.ts:186` (TelemetryEventSchema Zod enum).

- Q: Will the rollup automatically count `email_reconcile_recovery` events?
  - A: No. Both rollup implementations (`gmail.ts:364`, `gmail-shared.ts:397`) enumerate specific event keys. New events are silently ignored without an explicit counter addition. TASK-04 addresses this.

### Open (Operator Input Required)

None.

## Confidence Inputs

- **Implementation: 92%** — All four insertion points confirmed. Four TelemetryEvent schema locations identified. Two `cleanupInProgress` callers confirmed. Two `ensureLabelMap` copies confirmed. Rollup extension requirement confirmed.
  - Raises to ≥90%: already satisfied.

- **Approach: 88%** — New event key avoids double-counting. `error_reason` is additive. Stderr for label failures is consistent with existing pattern. Rollup extension is a simple counter addition.
  - Raises to ≥90%: confirmed `.passthrough()` on TelemetryEventSchema means `age_hours` field doesn't break schema validation.

- **Impact: 85%** — Gap 1 closes the reconcile blind spot; Gap 2 makes crash diagnosis possible; Gap 3 removes a silent failure mode; TASK-04 makes Gap 1 events queryable via MCP.

- **Delivery-Readiness: 90%** — Four independent tasks (S, S, XS, XS). All patterns established.

- **Testability: 92%** — Unit-testable with existing mock patterns. No new seams.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| gmail.ts local types drift again after this fix | Medium | Low | Plan notes all 4 schema locations explicitly; long-term consolidation deferred |
| `age_hours` field rejected by TelemetryEventSchema Zod validation on rollup read | Low | Low | `.passthrough()` confirmed on both TelemetryEventSchema definitions |
| TASK-04 rollup change introduces a regression in existing rollup tests | Low | Low | Rollup tests use fixed event payloads; new bucket is additive |
| `cleanupInProgress` in gmail-shared.ts has a slightly different signature than in gmail.ts | Low | Low | Both confirmed at lines `gmail.ts:2721` and `gmail-shared.ts:718`; both take `(emailId, gmail)`; verify before build |

## Planning Constraints & Notes

- Must-follow patterns:
  - All `append*` calls must be fail-open.
  - TelemetryEvent emit goes BEFORE `if (!dryRun) { await handleMarkProcessed(...) }` at `gmail.ts:3331`.
  - All 4 TelemetryEvent schema locations must be updated atomically in TASK-01.
  - Both `cleanupInProgress` error paths and both `AuditEntry` definitions updated atomically in TASK-02.
- Rollout/rollback: standard MCP server restart. Rollback: revert targeted additions. No data migration.
- Observability expectations:
  - Gap 1: `email_reconcile_recovery` rows in `email-audit-log.jsonl` with `reason` and `age_hours`; visible in rollup after TASK-04.
  - Gap 2: `lock-released` entries with `error_reason` field on error path.
  - Gap 3: stderr `[ensureLabelMap] Failed to create label "<name>": <error>`.

## Suggested Task Seeds (Non-binding)

- TASK-01 (S): Add `"email_reconcile_recovery"` to all 4 TelemetryEvent schema locations. Emit `appendTelemetryEvent({ event_key: "email_reconcile_recovery", message_id: msg.id, reason, age_hours: ageHours, ... })` per recovered email INSIDE the `if (!dryRun)` block at `gmail.ts:3331`, before the `handleMarkProcessed(...)` call at line 3332. Emitting inside the block ensures dry-run calls produce no telemetry. TC-R3 (non-dry-run recovery emits telemetry per email), TC-R4 (dry-run emits none).
- TASK-02 (S): Sync stale `gmail.ts:180` AuditEntry union with `gmail-shared.ts:151`. Add `error_reason?: string` to both. Populate `error_reason` in error-path catch of LOCAL `cleanupInProgress` (`gmail.ts:2740`) and CANONICAL `cleanupInProgress` (`gmail-shared.ts:~740`). TC-E1: mock label-modify throw → assert `lock-released` entry has `error_reason`.
- TASK-03 (XS): Add `process.stderr.write()` warning in both `ensureLabelMap` catch blocks (`gmail.ts:~967`, `gmail-shared.ts:~564`). TC-L1: mock `labels.create` throw → spy on stderr → assert warning emitted.
- TASK-04 (S): Add `email_reconcile_recovery` counter to both rollup implementations (`gmail.ts:364`, `gmail-shared.ts:397`). **Scope note:** this is not just adding a counter branch — it expands the fixed bucket shape `{ drafted, deferred, requeued, fallback }` to `{ drafted, deferred, requeued, fallback, recovered }` in both the TypeScript type and the tool response. The existing rollup test at `gmail-audit-log.test.ts:413` asserts the exact bucket shape and must be updated. TC-RU1: assert `email_reconcile_recovery` events are counted in the `recovered` rollup bucket; existing bucket assertions updated to include new field.

## Scope Signal

- **Signal: right-sized**
- **Rationale:** Four bounded, independent tasks. All within `packages/mcp-server/src/tools/gmail*`. No new infrastructure, no API changes. Largest task (TASK-01) is S effort. Combined effort is S+S+XS+XS.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Gap 1 — runtime entry point (gmail.ts:3197, not gmail-reconciliation.ts) | Yes | None | No |
| Gap 1 — double-count avoidance (new key vs email_queue_transition) | Yes | None — distinct key used | No |
| Gap 1 — 4 TelemetryEvent schema locations | Yes | [Minor] All 4 must be updated atomically — plan notes this | No |
| Gap 1 — telemetry emit before handleMarkProcessed call | Yes | None — emit before `if (!dryRun)` at line 3331 | No |
| Gap 2 — two cleanupInProgress copies | Yes | [Minor] Both confirmed; both need fix; verify signatures identical before build | No |
| Gap 2 — AuditEntry dual-definition sync | Yes | None — both locations identified | No |
| Gap 3 — two ensureLabelMap copies | Yes | None — both identified | No |
| Rollup — email_reconcile_recovery ignored without TASK-04 | Yes | None — TASK-04 explicit in plan | No |
| Test coverage — local reconcile handler untested | Yes | [Moderate] New file needed; standard pattern | No |

## Evidence Gap Review

### Gaps Addressed
- Confirmed LOCAL `handleReconcileInProgress` at `gmail.ts:3197` is the runtime path; directly calls `handleMarkProcessed` at line 3332.
- Confirmed double-count risk and selected distinct event key.
- Confirmed 4 TelemetryEvent schema locations requiring update.
- Confirmed 2 `cleanupInProgress` callers and locations.
- Confirmed rollup enumeration excludes new key without explicit extension.
- Confirmed local `TelemetryEventSchema` at `gmail.ts:213` (not exported) must also be updated.

### Confidence Adjustments
- TASK-01 scope: expanded to cover 4 schema locations (vs 2 in first draft). Higher confidence now — explicit enumeration reduces build-time discovery risk.
- TASK-02 scope: expanded to cover 2 cleanupInProgress copies. Correct.

### Remaining Assumptions
- Both `cleanupInProgress` copies have identical signatures `(emailId: string, gmail: gmail_v1.Gmail)` — very high confidence; verify before build.
- `age_hours` field passes through `.passthrough()` without Zod validation failure — confirmed pattern.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `"email_reconcile_recovery"` in all 4 TelemetryEvent schema locations.
  - `appendTelemetryEvent` emitted per non-dry-run recovered email before `handleMarkProcessed` call in `gmail.ts:3331`.
  - `AuditEntry` unions synced between `gmail.ts` and `gmail-shared.ts`; `error_reason?: string` in both.
  - Both `cleanupInProgress` error paths carry `error_reason`.
  - Both `ensureLabelMap` copies emit stderr on label creation failure.
  - Both rollup implementations count `email_reconcile_recovery`.
  - TC-R3, TC-R4, TC-E1, TC-L1, TC-RU1 pass in CI.
- Post-delivery measurement: observe `email-audit-log.jsonl` after next ops-inbox session; confirm `email_reconcile_recovery` entries appear with `reason` field; confirm rollup counts them.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan email-logging-observability --auto`
