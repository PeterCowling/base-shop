---
Status: Complete
Feature-Slug: email-logging-observability
Completed-date: 2026-03-06
artifact: build-record
Build-Event-Ref: docs/plans/email-logging-observability/build-event.json
---

# Build Record — Email Logging Observability

## What Was Built

**TASK-01 (schema + reconcile emit):** Added `"email_reconcile_recovery"` to all four `TelemetryEventKey` / `TelemetryEventSchema` locations in `gmail.ts` and `gmail-shared.ts`. Added `age_hours?: number` to both `TelemetryEvent` interface definitions. Inserted a fail-open `appendTelemetryEvent` call inside the `if (!dryRun)` block of the LOCAL `handleReconcileInProgress` function in `gmail.ts` (before the `handleMarkProcessed` call at line 3332), emitting `event_key: "email_reconcile_recovery"` with `message_id`, `reason`, `age_hours`, and `actor` per recovered email. New test file `gmail-reconciliation.test.ts` (TC-R3, TC-R4).

**TASK-02 (AuditEntry union sync + error_reason):** Synced the stale 3-action `AuditEntry` union in `gmail.ts:180` to match `gmail-shared.ts:151` (added `"booking-dedup-skipped"` and `"inquiry-draft-dedup-skipped"`). Added `error_reason?: string` field to both `AuditEntry` interface definitions. Updated both `cleanupInProgress` catch blocks to compute the error message string first and pass it as `error_reason` in the `appendAuditEntry` call (previously the `msg` variable was computed after the write). New test file `gmail-error-reason.test.ts` (TC-E1, TC-E2).

**TASK-03 (ensureLabelMap stderr warning):** Both `ensureLabelMap` catch blocks (LOCAL `gmail.ts:~967` and CANONICAL `gmail-shared.ts:~564`) updated from bare `catch { }` to `catch (err) { }` with a `process.stderr.write` warning containing the label name and error. New test file `gmail-ensure-label.test.ts` (TC-L1, TC-L2).

**TASK-04 (rollup recovered bucket):** Added `recovered: number` to `DailyRollupBucket` type (both `gmail.ts` private interface and `gmail-shared.ts` exported interface); added `recovered: 0` to bucket initializers in both `computeDailyTelemetryRollup` functions; added `email_reconcile_recovery` counter branches in both rollup loops; added `acc.recovered += bucket.recovered` and `recovered: 0` initial value to the `totals` accumulator in the `gmail.ts` handler (no totals path in `gmail-shared.ts`). Updated existing `gmail-audit-log.test.ts` TC-03-03 totals `toEqual` assertion to include `recovered: 0`. New TC-RU1 and TC-RU2 tests added.

## Tests Run

Tests run in CI (policy: no local Jest execution). Pre-commit hooks confirmed typecheck and lint pass for `@acme/mcp-server`. CI validates test contracts.

- TC-R3: `gmail_reconcile_in_progress` non-dry-run emits `email_reconcile_recovery` to audit log
- TC-R4: dry-run emits no `email_reconcile_recovery`
- TC-E1: LOCAL `cleanupInProgress` catch writes `lock-released` with `error_reason`
- TC-E2: CANONICAL `cleanupInProgress` catch writes `lock-released` with `error_reason`
- TC-L1: LOCAL `ensureLabelMap` catch emits stderr warning on `labels.create` failure
- TC-L2: CANONICAL `ensureLabelMap` catch emits stderr warning on `labels.create` failure
- TC-RU1: `email_reconcile_recovery` events counted per-day in rollup bucket
- TC-RU2: `totals.recovered` sums across days

## Validation Evidence

All TC contracts implemented and committed in `c26c2e867e`. Pre-commit typecheck + lint passed. No TypeScript errors; no ESLint errors in modified files. All changes are fail-open (no throws from logging paths).

## Scope Deviations

All four tasks executed sequentially in a single commit due to shared files (`gmail.ts`, `gmail-shared.ts`) and writer lock contention from a concurrent Codex session. Affects list correct; no controlled scope expansion needed.

## Outcome Contract

- **Why:** Three identified logging gaps leave the email pipeline partially blind. Reconcile recovery lacks per-email context; error-path lock-releases carry no error reason; label creation failures produce zero trace.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this change: (1) each non-dry-run reconcile recovery emits an `email_reconcile_recovery` event with `reason` and `age_hours`, visible in the daily rollup; (2) error-path `lock-released` entries carry an `error_reason` field; (3) `ensureLabelMap` label creation failures emit a stderr warning. All fail-open guarantees are preserved.
- **Source:** operator
