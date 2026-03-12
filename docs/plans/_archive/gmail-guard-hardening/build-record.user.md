# Build Record: Gmail Guard Hardening

**Plan:** docs/plans/gmail-guard-hardening/plan.md
**Feature slug:** gmail-guard-hardening
**Build completed:** 2026-03-06
**Business:** BRIK

## Outcome Contract

- **Why:** Session crashes in ops-inbox leave emails stuck with `Brikette/Queue/In-Progress` — permanently invisible. A crash after draft creation but before `gmail_mark_processed` can produce a second draft on the next session. The Gmail label hierarchy had no cleanup path.
- **Intended Outcome Type:** Operational reliability
- **Intended Outcome Statement:** Guest emails cannot get stuck silently; duplicate draft creation is prevented; orphaned Gmail labels are surfaced in each ops-inbox session summary.
- **Source:** auto

## What Was Built

All three TASK implementations confirmed in code on 2026-03-06:

- **TASK-01** (thread-level dedup): `handleCreateDraft` in `gmail.ts` now calls `gmail.users.drafts.list` before `drafts.create`. If a draft exists for the thread, returns `{ already_exists: true }` and writes `"inquiry-draft-dedup-skipped"` audit entry. `AuditEntry.action` union updated in `gmail-shared.ts`. Test: `gmail-create-draft.test.ts`.
- **TASK-02** (reconcile preflight): `ops-inbox/SKILL.md` Step 0 now calls `gmail_reconcile_in_progress({ dryRun: false, staleHours: 2 })` after health_check. Recovers stuck In-Progress emails automatically at session start.
- **TASK-03** (audit_labels tool): `gmail_audit_labels` registered in `gmail.ts`. Returns `{ known, legacy, orphaned, total_brikette }`. Test: `gmail-audit-labels.test.ts`. ops-inbox SKILL.md Step 7 updated to surface orphaned label count.

## Validation Summary

Confirmed via code grep (2026-03-12 retrospective closure):
- `inquiry-draft-dedup-skipped` present in `gmail.ts` at line ~2723 and type union in `gmail-shared.ts`
- `gmail_reconcile_in_progress` present in `ops-inbox/SKILL.md` at line 50
- `gmail_audit_labels` registered at `gmail.ts:792`, test file exists, SKILL.md Step 7 references tool
