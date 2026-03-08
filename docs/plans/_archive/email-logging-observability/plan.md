---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: email-logging-observability
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted average
Auto-Build-Intent: plan+auto
---

# Email Logging Observability Plan

## Summary

Three logging gaps in `packages/mcp-server/src/tools/gmail*` leave the email pipeline blind during troubleshooting. This plan closes them with minimal, fail-open additions to the existing audit/telemetry infrastructure: a new `email_reconcile_recovery` telemetry event per recovered email inside the LOCAL `handleReconcileInProgress`; an `error_reason` field on error-path `lock-released` audit entries; and stderr warnings from both `ensureLabelMap` copies when label creation fails. A fourth task extends the daily rollup to surface the new recovery events. All changes are logging-only — no Gmail API behavior is altered.

## Active tasks
- [x] TASK-01: Add `email_reconcile_recovery` telemetry to local reconcile handler
- [x] TASK-02: Sync AuditEntry union drift and add `error_reason` to cleanupInProgress error paths
- [x] TASK-03: Add stderr warning to both `ensureLabelMap` catch blocks
- [x] TASK-04: Extend `gmail_telemetry_daily_rollup` to count `email_reconcile_recovery`

## Build Evidence
- Commit: `c26c2e867e` (dev) — 2026-03-06
- Files modified: `gmail.ts`, `gmail-shared.ts`
- Files created: `gmail-reconciliation.test.ts`, `gmail-error-reason.test.ts`, `gmail-ensure-label.test.ts`
- Files updated: `gmail-audit-log.test.ts` (totals assertion + TC-RU1, TC-RU2)
- Pre-commit hooks: typecheck ✓, lint ✓, agent-context validation ✓
- Inline execution route (writer lock held by another Codex session; waited for release)
- Build-time ideas hook: 0 dispatches (no registered artifacts changed)

## Goals
- Emit `email_reconcile_recovery` telemetry per recovered email with stale reason and age.
- Persist error reason on `lock-released` entries from error paths.
- Surface label creation failures via stderr rather than discarding them silently.
- Make recovery events queryable via `gmail_telemetry_daily_rollup`.

## Non-goals
- Routing the tool router to the extracted `gmail-reconciliation.ts` module.
- Changing any Gmail API operation behavior.
- Consolidating the two `cleanupInProgress` or `ensureLabelMap` implementations.

## Constraints & Assumptions
- Constraints:
  - Tests run in CI only (`docs/testing-policy.md`).
  - `max-lines-per-function` lint rule (300 lines) — additions must stay compact.
  - All new logging calls must be fail-open (never throw).
  - `TelemetryEventSchema` Zod enum defined in BOTH `gmail.ts:213` (local, not exported) and `gmail-shared.ts:186` — both must be updated.
- Assumptions:
  - `error_reason?: string` on `AuditEntry` is safe — no consumer parses this field programmatically.
  - The `TelemetryEvent` Zod schema uses `.passthrough()` — the `age_hours` numeric field will survive read-side validation.
  - Both `cleanupInProgress` copies have identical signatures `(emailId: string, gmail: gmail_v1.Gmail)`.

## Inherited Outcome Contract
- **Why:** Three identified logging gaps leave the email pipeline partially blind. Reconcile recovery lacks per-email context; error-path lock-releases carry no error reason; label creation failures produce zero trace.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this change: (1) each non-dry-run reconcile recovery emits an `email_reconcile_recovery` event with `reason` and `age_hours`, visible in the daily rollup; (2) error-path `lock-released` entries carry an `error_reason` field; (3) `ensureLabelMap` label creation failures emit a stderr warning. All fail-open guarantees are preserved.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/email-logging-observability/fact-find.md`
- Key findings used:
  - Runtime reconcile handler is LOCAL `gmail.ts:3197` — not the extracted `gmail-reconciliation.ts`; router at `gmail.ts:3483` calls local function.
  - `handleMarkProcessed` already writes `email_queue_transition` per recovered email — new key `email_reconcile_recovery` avoids double-counting.
  - `TelemetryEventKey` and `TelemetryEventSchema` Zod enum exist in BOTH `gmail.ts` and `gmail-shared.ts` — four locations need updating for TASK-01.
  - `AuditEntry` in `gmail.ts:180` has a stale 3-action union (drift since commit `55d7d1c503`); `gmail-shared.ts:151` has the updated 5-action union.
  - Two `cleanupInProgress` copies: LOCAL at `gmail.ts:2721` (called from `gmail.ts:2968`) and CANONICAL at `gmail-shared.ts:718` (called from `gmail-handlers.ts:598`).
  - Rollup at `gmail.ts:364` and `gmail-shared.ts:397` enumerates specific event keys — `email_reconcile_recovery` is silently ignored without TASK-04.
  - Existing rollup test at `gmail-audit-log.test.ts:413` asserts the fixed bucket shape and must be updated.

## Proposed Approach
- Option A: Make all changes in a single commit touching all files at once.
- Option B: Four independent tasks executed sequentially, each with its own test coverage, committed separately.
- Chosen approach: Option B. Targeted per-task commits are easier to review and revert. All tasks share `gmail.ts` and `gmail-shared.ts` — sequential execution prevents merge conflicts without needing coordination.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `email_reconcile_recovery` to 4 schema locations + emit in reconcile handler | 85% | S | Complete (2026-03-06) | - | TASK-04 |
| TASK-02 | IMPLEMENT | Sync AuditEntry union drift; add `error_reason` to both cleanupInProgress error paths | 80% | S | Complete (2026-03-06) | - | - |
| TASK-03 | IMPLEMENT | Add stderr warning to both `ensureLabelMap` catch blocks | 75% | S | Complete (2026-03-06) | - | - |
| TASK-04 | IMPLEMENT | Extend daily rollup to count `email_reconcile_recovery`; update test | 80% | S | Complete (2026-03-06) | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | All modify `gmail.ts` and `gmail-shared.ts`; execute sequentially — suggested order TASK-02 → TASK-03 → TASK-01 to fix type foundation before adding new keys |
| 2 | TASK-04 | TASK-01 | Rollup extension after new key is defined |

## Tasks

---

### TASK-01: Add `email_reconcile_recovery` to schema locations and reconcile handler

- **Type:** IMPLEMENT
- **Deliverable:** Updated `TelemetryEventKey` unions + `TelemetryEventSchema` Zod enums in `gmail.ts` and `gmail-shared.ts`; new `appendTelemetryEvent` call inside local `handleReconcileInProgress` in `gmail.ts`; new test file `gmail-reconciliation.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/tools/gmail-shared.ts`, `packages/mcp-server/src/__tests__/gmail-reconciliation.test.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% — all 4 schema locations confirmed; emit insertion point at `gmail.ts:3331–3336` (inside `if (!dryRun)` block, before `handleMarkProcessed` call) confirmed by direct read.
  - Approach: 90% — new key avoids `email_queue_transition` double-count; emit inside `if (!dryRun)` guard ensures dry-run produces no telemetry.
  - Impact: 80% — directly closes the reconcile blind spot; value proportional to crash frequency. Held-back test: the single risk is that `age_hours` is rejected by TelemetryEventSchema on read, but `.passthrough()` is confirmed in both schema definitions — no single unknown would drop Impact below 80.

**Acceptance:**
- `"email_reconcile_recovery"` present in `gmail.ts:190` (`TelemetryEventKey` union), `gmail.ts:213` (local `TelemetryEventSchema` Zod enum), `gmail-shared.ts:161` (`TelemetryEventKey` union), `gmail-shared.ts:186` (exported `TelemetryEventSchema` Zod enum).
- `age_hours?: number` added to `TelemetryEvent` interface in both `gmail.ts:197` and `gmail-shared.ts:168` so `appendTelemetryEvent({ ..., age_hours })` passes TypeScript typecheck.
- Non-dry-run reconcile recovery emits one `email_reconcile_recovery` event per recovered email with `message_id`, `reason`, `age_hours`, and `actor`.
- Dry-run mode emits no telemetry events.
- TC-R3 and TC-R4 pass in CI.

**Validation contract:**
- TC-R3: Call `handleGmailTool("gmail_reconcile_in_progress", { dryRun: false, staleHours: 0 })` with mocked Gmail client returning one stale In-Progress message; read `email-audit-log.jsonl` from temp dir (via `AUDIT_LOG_PATH`); assert at least one entry with `event_key: "email_reconcile_recovery"`, `message_id` set, `reason` set. (Test seam is the audit log file — `appendTelemetryEvent` is local and not exported; pattern matches `gmail-create-draft.test.ts`.)
- TC-R4: Same call with `dryRun: true` → no `email_reconcile_recovery` entry in the audit log.

**Execution plan:**
- Red: write `gmail-reconciliation.test.ts` with TC-R3 asserting `email_reconcile_recovery` event emitted → fails (key undefined, no emit).
- Green: (1) add `age_hours?: number` to `TelemetryEvent` interface in `gmail.ts:210` and `gmail-shared.ts:168`; (2) add `"email_reconcile_recovery"` to all 4 schema locations; (3) inside `if (!dryRun)` at `gmail.ts:3331`, before the `handleMarkProcessed(gmail, {...})` call at line 3332, add `appendTelemetryEvent({ ts: new Date().toISOString(), event_key: "email_reconcile_recovery", source_path: "queue", actor, message_id: msg.id, reason, age_hours: ageHours ?? undefined })`.
- Refactor: add TC-R4 for dry-run guard; verify `max-lines-per-function` rule passes on the reconcile function.

**Scouts:** Confirm `appendTelemetryEvent` is imported/available inside the local `handleReconcileInProgress` scope in `gmail.ts` — it should be since it's defined locally at ~line 290. Confirm `ageHours` variable is in scope at the insertion point (it is: `gmail.ts:3290+`).

**Edge Cases & Hardening:**
- `ageHours` is `null` (timestamp unavailable) → pass `age_hours: undefined` (Zod `.passthrough()` handles optional/undefined fields).
- `appendTelemetryEvent` write failure → existing fail-open handler emits to stderr; reconcile proceeds normally.

**What would make this >=90%:** Live confirmation that `appendTelemetryEvent` write succeeds during an actual reconcile run. Not required for build eligibility.

**Rollout / rollback:**
- Rollout: MCP server restart; new entries appear in `email-audit-log.jsonl` on next reconcile run.
- Rollback: revert the 4 schema additions and the emit call; no data migration.

**Documentation impact:** None — ops-inbox SKILL.md already surfaces reconcile count from tool response.

**Notes / references:**
- Insertion point: `gmail.ts:3331` (inside `if (!dryRun)` block, before `handleMarkProcessed` at line 3332).
- 4 schema locations: `gmail.ts:190`, `gmail.ts:213`, `gmail-shared.ts:161`, `gmail-shared.ts:186`.

---

### TASK-02: Sync AuditEntry union drift and add `error_reason` to cleanupInProgress error paths

- **Type:** IMPLEMENT
- **Deliverable:** Updated `AuditEntry` interfaces in `gmail.ts` and `gmail-shared.ts`; `error_reason` populated in both `cleanupInProgress` error catch blocks
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/tools/gmail-shared.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 90% — both AuditEntry locations and both cleanupInProgress error paths confirmed. Both callers confirmed (gmail.ts:2968, gmail-handlers.ts:598).
  - Approach: 85% — additive optional field; union sync is mechanical. No caller breakage since `error_reason` is optional.
  - Impact: 80% — closes error-path blind spot. Held-back test: the single risk is that `cleanupInProgress` in `gmail-shared.ts` has a different signature; confirmed both take `(emailId, gmail)` — no single unknown drops Impact below 80.

**Acceptance:**
- `gmail.ts:180` `AuditEntry` action union includes all 5 actions: `"lock-acquired" | "lock-released" | "outcome" | "booking-dedup-skipped" | "inquiry-draft-dedup-skipped"`.
- `error_reason?: string` present in both `AuditEntry` interface definitions.
- LOCAL `cleanupInProgress` catch block at `gmail.ts:2740` passes `error_reason: cleanupError instanceof Error ? cleanupError.message : String(cleanupError)` to `appendAuditEntry`.
- CANONICAL `cleanupInProgress` catch block in `gmail-shared.ts` similarly passes `error_reason`.
- TC-E1 and TC-E2 pass in CI.

**Validation contract:**
- TC-E1: Mock `gmail.users.messages.modify` to throw for the label-apply step inside the LOCAL `handleMarkProcessed` in `gmail.ts`; verify the resulting `lock-released` audit entry has `error_reason` field set to the thrown error message. (Exercises `gmail.ts:2968 → gmail.ts:2721` path.)
- TC-E2: Mock `gmail.users.messages.modify` to throw for the label-apply step inside `handleMarkProcessed` in `gmail-handlers.ts`; verify the resulting `lock-released` audit entry has `error_reason` field set. (Exercises `gmail-handlers.ts:598 → gmail-shared.ts:718` path.)

**Execution plan:**
- Red: write TC-E1 asserting `error_reason` on the `lock-released` entry → fails (field absent).
- Green: (1) sync `gmail.ts:180` AuditEntry action union to match `gmail-shared.ts:151` (add `"booking-dedup-skipped" | "inquiry-draft-dedup-skipped"`); (2) add `error_reason?: string` to both `AuditEntry` definitions; (3) in LOCAL `cleanupInProgress` catch at `gmail.ts:2740`, change `appendAuditEntry(...)` to include `error_reason: msg` where `msg` is the already-computed error message string; (4) apply same change to CANONICAL `cleanupInProgress` catch in `gmail-shared.ts:~740`.
- Refactor: Confirm TypeScript accepts `error_reason` on `lock-released` entries (no discriminated union restriction on `AuditEntry`).

**Scouts:** Confirm `gmail-shared.ts:718-750` — the CANONICAL `cleanupInProgress` catch block structure is identical to the local one (`lockStoreRef.release`, `appendAuditEntry`, return string).

**Edge Cases & Hardening:**
- `error_reason` containing special characters → JSON.stringify handles this in `appendAuditEntry`.
- CANONICAL `cleanupInProgress` in `gmail-shared.ts` is also called indirectly; same fix applies.

**What would make this >=90%:** Confirmed that no TypeScript consumer of `AuditEntry` uses a discriminated union narrowing that would treat `error_reason` as unexpected on `lock-released` entries.

**Rollout / rollback:**
- Rollout: MCP server restart; new `error_reason` field appears on subsequent error-path lock-releases.
- Rollback: remove `error_reason` field and revert union sync.

**Documentation impact:** None.

**Notes / references:**
- LOCAL `cleanupInProgress`: `gmail.ts:2721`, catch at ~line 2738–2743.
- CANONICAL `cleanupInProgress`: `gmail-shared.ts:718`, catch at ~line 740.
- `AuditEntry` drift source commit: `55d7d1c503`.

---

### TASK-03: Add stderr warning to both `ensureLabelMap` catch blocks

- **Type:** IMPLEMENT
- **Deliverable:** `process.stderr.write()` call in both `ensureLabelMap` catch blocks
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/tools/gmail-shared.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 95% — both empty catch blocks confirmed at `gmail.ts:~967` and `gmail-shared.ts:~564`.
  - Approach: 90% — matches existing `appendAuditEntry` write-failure pattern; stderr is correct here since no `messageId` is available.
  - Impact: 75% — label creation failures are rare (permissions/quota issues); when they occur, the warning is the only trace. Score is 75 because the value depends on the failure mode frequency which is unknown.

**Acceptance:**
- `gmail.ts:~967` catch block emits `process.stderr.write(`[ensureLabelMap] Failed to create label "${labelName}": ${err}\n`)`.
- `gmail-shared.ts:~564` catch block emits the same warning.
- TC-L1 passes in CI.

**Validation contract:**
- TC-L1: Call `handleGmailTool("gmail_organize_inbox", ...)` with mocked `labels.create` throwing for a missing label (exercises `gmail.ts:~967` LOCAL `ensureLabelMap`); spy on `process.stderr.write`; assert warning emitted containing the label name.
- TC-L2: Call the exported `ensureLabelMap` from `gmail-shared.ts` directly with a mocked Gmail client where `labels.create` throws; spy on `process.stderr.write`; assert warning emitted. (Exercises `gmail-shared.ts:~564` CANONICAL `ensureLabelMap` catch block independently.)

**Execution plan:**
- Red: write TC-L1 asserting stderr warning on label creation failure → fails (empty catch produces no output).
- Green: add `process.stderr.write(`[ensureLabelMap] Failed to create label "${labelName}": ${String(err)}\n`)` to both catch blocks.
- Refactor: Ensure the existing catch variable is exposed correctly (`catch (err)` vs `catch` with no binding — update catch binding if needed).

**Scouts:** Confirm both catch blocks use `catch { }` (no binding) or `catch (err) { }` — if no binding, must add `(err)` to access the error.

**Edge Cases & Hardening:**
- `String(err)` is already safe for all error types. No throw from stderr.write (mirrors existing pattern).

**What would make this >=90%:** Elevated by measuring label creation failure frequency in production — not required for build.

**Rollout / rollback:**
- Rollout: MCP server restart; warning appears immediately on next label creation failure.
- Rollback: remove the two `process.stderr.write` calls.

**Documentation impact:** None.

**Notes / references:**
- `gmail.ts:~967`; `gmail-shared.ts:~564`.

---

### TASK-04: Extend daily rollup to count `email_reconcile_recovery`

- **Type:** IMPLEMENT
- **Deliverable:** Updated rollup logic in `gmail.ts` and `gmail-shared.ts`; updated bucket type; updated rollup test in `gmail-audit-log.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/tools/gmail-shared.ts`, `packages/mcp-server/src/__tests__/gmail-audit-log.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — both rollup implementations confirmed at `gmail.ts:364` and `gmail-shared.ts:397`; bucket type at `gmail.ts:329`; existing test at `gmail-audit-log.test.ts:413` confirmed.
  - Approach: 85% — new `recovered` bucket field is additive alongside existing fields; MCP tool response shape expands, not breaks.
  - Impact: 80% — makes Gap 1 events queryable via MCP tool; operator-facing. Held-back test: single risk is that the tool response schema change breaks a consumer that expects the fixed 4-field shape. No code consumer parses the rollup response programmatically outside the test — only the ops-inbox skill reads it, and it uses the fields it knows about. No single unknown drops Impact below 80.

**Acceptance:**
- Both rollup implementations count `email_reconcile_recovery` events in a new `recovered` bucket field.
- Rollup bucket type updated from `{ drafted, deferred, requeued, fallback }` to include `recovered: number`.
- `gmail_telemetry_daily_rollup` tool response includes `recovered` in each day bucket AND in the `totals` accumulator at `gmail.ts:3073–3082`. Note: `gmail-shared.ts` has no totals builder — the accumulator update is `gmail.ts` only.
- Existing `gmail-audit-log.test.ts` rollup assertions updated to include `recovered: 0` for existing test fixtures.
- TC-RU1 passes in CI.

**Validation contract:**
- TC-RU1: seed `email-audit-log.jsonl` with 2 `email_reconcile_recovery` events on date D and 1 on date D+1; call rollup for that range; assert `daily[D].recovered === 2` and `daily[D+1].recovered === 1`.
- TC-RU2: same seed; assert `totals.recovered === 3`. (Validates the `gmail.ts:3073–3082` totals accumulator separately from per-day bucket logic.)

**Execution plan:**
- Red: write TC-RU1 asserting `recovered` field in rollup buckets → fails (field absent).
- Green: (1) add `recovered: 0` to bucket initializer in both rollup compute functions (`gmail.ts:~329` bucket type and `gmail-shared.ts:computeDailyTelemetryRollup`); (2) add `if (event.event_key === "email_reconcile_recovery") { bucket.recovered += 1; }` branch in both rollup loops; (3) update bucket TypeScript type definition to include `recovered: number`; (4) update the `totals` accumulator in the `gmail.ts` handler at `gmail.ts:3073–3082` ONLY — add `acc.recovered += bucket.recovered` to the reduce and `recovered: 0` to the initial accumulator. Note: `gmail-shared.ts` exposes only `computeDailyTelemetryRollup` (pure bucket compute) and has no `totals` response builder — the totals accumulator is exclusively a `gmail.ts` handler concern.
- Refactor: update existing `gmail-audit-log.test.ts` rollup test assertions to add `recovered: 0` (or appropriate count) to the expected bucket shape.

**Consumer tracing (new output: `recovered` field in rollup response):**
- `ops-inbox/SKILL.md` Step 7: reads rollup for session summary. Uses `drafted`, `deferred` field names explicitly — does not enumerate all fields. The new `recovered` field is silently ignored unless the skill explicitly references it. Safe to add without updating the skill doc. If desired, the skill doc can be updated in a follow-on to surface the count — noted as adjacent scope, not in this task.

**Planning validation:**
- Checks run: confirmed `gmail.ts:329` defines the rollup bucket type; confirmed both rollup loops at `gmail.ts:364` and `gmail-shared.ts:397` are structurally identical (4 if-branches, one per event key).
- Validation artifacts: `gmail.ts:329–382`, `gmail-shared.ts:253–410`.
- Unexpected findings: none.

**Scouts:** Confirm `gmail-audit-log.test.ts:413` asserts specific bucket field values (not just `.toMatchObject`) — if strict equality, all fields must be enumerated including the new `recovered` field.

**Edge Cases & Hardening:**
- Rollup date range contains no `email_reconcile_recovery` events → `recovered: 0` for all buckets (correct, matches existing pattern for other counters).

**What would make this >=90%:** Confirmed the ops-inbox skill can access the new `recovered` field when it needs it — already safe since the field is present in all rollup responses.

**Rollout / rollback:**
- Rollout: MCP server restart; `recovered` field appears in all subsequent rollup responses (defaults to 0 for dates with no recovery events).
- Rollback: remove `recovered` branch and field; revert test.

**Documentation impact:** `ops-inbox/SKILL.md` Step 7 may optionally be updated to surface `recovered` count in the session summary — deferred as adjacent scope.

**Notes / references:**
- Rollup bucket type: `gmail.ts:329`; `gmail-shared.ts:253`.
- Rollup loops: `gmail.ts:364`; `gmail-shared.ts:397`.
- Test to update: `gmail-audit-log.test.ts:413`.

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Schema additions + reconcile emit | Yes | [Minor] `appendTelemetryEvent` must be in local scope at the insertion point in `gmail.ts:3331` — confirmed it is locally defined at ~line 290 | No |
| TASK-01: Dry-run guard precision | Yes | None — emit inside `if (!dryRun)` block confirmed correct | No |
| TASK-02: AuditEntry union sync | Yes | None — both union locations confirmed; additive field | No |
| TASK-02: cleanupInProgress catch binding | Partial | [Minor] Both catch blocks must expose error binding; confirm `catch (err)` vs `catch` before build | No |
| TASK-03: ensureLabelMap catch binding | Partial | [Minor] Same as TASK-02 — confirm catch error binding exists | No |
| TASK-04: Rollup bucket type expansion | Yes | None — TC-RU1 covers per-day bucket assertions; TC-RU2 covers totals accumulator (`gmail.ts:3073–3082`); existing test assertions updated as part of task | No |
| TASK-04: Consumer tracing for `recovered` field | Yes | None — ops-inbox skill reads named fields only; `recovered` field ignored unless explicitly referenced — safe | No |

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Schema locations correctly identified | Yes | None | No |
| TASK-02: Union sync eliminates type drift | Yes | None | No |
| TASK-03: Stderr pattern verified | Yes | None | No |
| TASK-04: Rollup consumer tracing complete | Yes | None | No |

## Risks & Mitigations

- Catch block binding form (`catch {}` vs `catch (err) {}`) unknown until file read — mitigation: scout confirms before Green phase; fix catch binding as part of Red/Green if needed.
- `gmail.ts` local `TelemetryEventSchema` is not exported — risk: test stubs that mock `readTelemetryEvents` may hit the shared schema. Mitigation: tests write directly to the temp log file and call the tool handler, bypassing schema read-side — existing pattern from `gmail-create-draft.test.ts`.
- TASK-04 rollup test strict equality assertion might require enumerating all fields — mitigation: scouted in TASK-04.

## Observability

- Logging: `email_reconcile_recovery` entries in `email-audit-log.jsonl` (TASK-01); `error_reason` field on `lock-released` entries (TASK-02); stderr `[ensureLabelMap]` warnings (TASK-03).
- Metrics: `recovered` bucket in `gmail_telemetry_daily_rollup` output (TASK-04).
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] `email_reconcile_recovery` key in all 4 TelemetryEvent schema locations.
- [ ] Non-dry-run reconcile recovery emits one telemetry event per recovered email with `reason` and `age_hours`.
- [ ] `AuditEntry` unions synced between `gmail.ts` and `gmail-shared.ts`.
- [ ] `error_reason` field present on error-path `lock-released` entries from both `cleanupInProgress` copies.
- [ ] Both `ensureLabelMap` catch blocks emit stderr warning on label creation failure.
- [ ] Daily rollup includes `recovered` counter; existing rollup test updated.
- [ ] TypeScript typecheck passes on all modified files.
- [ ] ESLint passes (including `max-lines-per-function`).
- [ ] TC-R3, TC-R4, TC-E1, TC-E2, TC-L1, TC-RU1, TC-RU2 pass in CI.

## Decision Log

- 2026-03-06: New event key `email_reconcile_recovery` chosen over adding another `email_queue_transition` before `handleMarkProcessed` — avoids double-counting in rollup.
- 2026-03-06: Sequential wave execution required despite no logical dependencies between TASK-01/02/03 — all touch `gmail.ts` and `gmail-shared.ts`; writer lock enforces serial execution.
- 2026-03-06: ops-inbox SKILL.md Step 7 rollup surface for `recovered` count deferred as adjacent scope — not same-outcome within this plan's contract.

## Overall-confidence Calculation

- TASK-01: S=1, confidence 85% → weight 1 × 85 = 85
- TASK-02: S=1, confidence 80% → weight 1 × 80 = 80
- TASK-03: S=1, confidence 75% → weight 1 × 75 = 75
- TASK-04: S=1, confidence 80% → weight 1 × 80 = 80
- Overall = (85 + 80 + 75 + 80) / 4 = **80%**

## Delivery Rehearsal (Phase 9.5)

- **Data:** All tasks are logging-only, append-only to existing JSONL and stderr paths. Tests use temp AUDIT_LOG_PATH files (established pattern). No seed data required. ✓ Clear.
- **Process/UX:** No user-visible flows changed. Rollup tool response gains additive `recovered` field only. ✓ Clear.
- **Security:** No auth boundaries, permission checks, or data access rules introduced. All writes are local. ✓ Clear.
- **UI:** No UI components modified. All changes are server-side MCP server package only. ✓ Clear.
- **Verdict:** No Critical findings. No adjacent-scope ideas. Eligible for build handoff.
