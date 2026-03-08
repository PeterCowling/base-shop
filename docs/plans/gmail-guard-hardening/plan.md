---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06 (all tasks complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: gmail-guard-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Gmail Guard Hardening Plan

## Summary

Three structural gaps in the Brikette email pipeline allow customer emails to become permanently invisible (stuck `In-Progress` label after session crash), produce duplicate draft responses (no thread-level dedup on `gmail_create_draft`), and let the Gmail label hierarchy accumulate orphaned labels indefinitely. All three gaps are in `packages/mcp-server/src/tools/gmail*` and are independently fixable. TASK-01 adds a pre-flight `drafts.list` check to `gmail_create_draft` so a second draft is never created for the same thread. TASK-02 wires the existing `gmail_reconcile_in_progress` implementation into the ops-inbox session preflight. TASK-03 adds a `gmail_audit_labels` tool that surfaces orphaned `Brikette/*` labels in the session summary.

## Active tasks

- [x] TASK-01: Add thread-level dedup to `gmail_create_draft`
- [x] TASK-02: Wire reconcile-in-progress into ops-inbox preflight
- [x] TASK-03: Implement `gmail_audit_labels` tool

## Goals

- Prevent duplicate inquiry response drafts when a session crashes between draft creation and `gmail_mark_processed`
- Automatically recover emails stuck with `Brikette/Queue/In-Progress` at the start of every ops-inbox session
- Give the operator visibility into orphaned Gmail labels without requiring manual investigation

## Non-goals

- Changing the `REQUIRED_LABELS` schema or restructuring the label hierarchy
- Auto-deleting orphaned labels (flag-only by default)
- Addressing booking reservation draft dedup (already handled by `checkBookingRefDuplicate`)

## Constraints & Assumptions

- Constraints:
  - Tests run in CI only per `docs/testing-policy.md`
  - `max-lines-per-function` lint rule (300 lines) — new handlers must stay compact
  - Fail-open policy on all guard API calls — primary action must never be blocked by a guard query failure
- Assumptions:
  - Gmail `drafts.list` with thread-scoped query returns within acceptable latency (<100ms)
  - `staleHours: 2` is the correct auto-reconcile window (2h is the existing default)
  - LEGACY_LABELS are surfaced as a distinct category (known migration artifacts) in the label audit output

## Inherited Outcome Contract

- **Why:** Session crashes in ops-inbox leave emails stuck with `Brikette/Queue/In-Progress` — permanently invisible to `gmail_organize_inbox` because that label is in `TERMINAL_LABELS`. A crash after draft creation but before `gmail_mark_processed` can also produce a second draft on the next session. The Gmail label hierarchy has no cleanup path, so renamed labels from past migrations accumulate alongside current ones.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `gmail_create_draft` skips creation and warns if a draft already exists in the same thread; stale In-Progress emails are automatically re-routed at the start of every ops-inbox session; a `gmail_audit_labels` tool reports orphaned `Brikette/*` labels not in `REQUIRED_LABELS`, callable from ops-inbox session summary.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/gmail-guard-hardening/fact-find.md`
- Key findings used:
  - `handleCreateDraft` in `gmail.ts:2603-2676` has `original.data.threadId` in scope immediately before `drafts.create` — clean insertion point for dedup check
  - `checkBookingRefDuplicate` in `gmail-booking.ts` is the established dedup pattern: `drafts.list` query → `isDuplicate = drafts.length > 0` → fail-open on error → audit log entry
  - `handleReconcileInProgress` in `gmail-reconciliation.ts` is fully implemented (225 lines, `dryRun: true` default, `staleHours: 2`) — registered at `gmail.ts:3408`; no code change needed
  - `ensureLabelMap` in `gmail-shared.ts:533` creates but never removes; `REQUIRED_LABELS` (23 labels) and `LEGACY_LABELS` (9 names) are the reference sets
  - `TERMINAL_LABELS` includes `PROCESSING` — stuck In-Progress emails are invisible to queue scans

## Proposed Approach

- Option A: Three independent tasks, all parallelisable in Wave 1
- Option B: Sequence TASK-03 after TASK-01/02 to reduce merge risk
- Chosen approach: Option A (Wave 1 parallel). All three tasks touch different files with no overlapping write targets — TASK-01 modifies `gmail.ts` + test, TASK-02 modifies `ops-inbox/SKILL.md`, TASK-03 creates a new handler + test file. Zero merge conflict risk.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Thread-level dedup in `gmail_create_draft` | 90% | S | Complete (2026-03-06) | - | - |
| TASK-02 | IMPLEMENT | Wire reconcile into ops-inbox preflight | 92% | S | Complete (2026-03-06) | - | - |
| TASK-03 | IMPLEMENT | `gmail_audit_labels` tool + session summary | 82% | M | Complete (2026-03-06) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | All three modify disjoint files; run in parallel |

## Tasks

---

### TASK-01: Thread-level dedup in `gmail_create_draft`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `handleCreateDraft` in `gmail.ts`; new TC-10/TC-11 in `gmail-create-draft.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/__tests__/gmail-create-draft.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 92% — `threadId` confirmed available at insertion point; `drafts.list` query pattern verified in `checkBookingRefDuplicate`
  - Approach: 90% — fail-open on error mirrors booking dedup; thread-scoped query is correct granularity
  - Impact: 88% — eliminates duplicate drafts from session crash recovery; minor latency added per create call

**Acceptance:**
- `gmail_create_draft` called on a thread that already has a draft returns `{ success: false, already_exists: true, message: "Draft already exists for this thread" }` and does NOT call `drafts.create`
- If `drafts.list` throws an API error, draft creation proceeds normally (fail-open)
- On skip: `"inquiry-draft-dedup-skipped"` audit entry written with `messageId` and `threadId`
- TC-10 and TC-11 pass in CI

**Validation contract:**
- TC-10: `gmail_create_draft` called on thread with existing draft → `already_exists: true`, `drafts.create` not called, audit log entry `"inquiry-draft-dedup-skipped"` written
- TC-11: `gmail_create_draft` called on thread where `drafts.list` throws → draft created normally (fail-open), no error surfaced

**Execution plan:**
- Red: add TC-10 asserting `drafts.create` is NOT called when `drafts.list` returns 1 result for the threadId query → test fails (create is currently unconditional)
- Green: in `handleCreateDraft`, before the `drafts.create` call, query `gmail.users.drafts.list({ userId: "me", q: `in:drafts thread:${original.data.threadId}` })`. If `drafts.length > 0`, write audit entry and return `jsonResult({ success: false, already_exists: true, message: "Draft already exists for this thread — skipping to prevent duplicate." })`
- Refactor: wrap the `drafts.list` call in try/catch (fail-open); add TC-11 for the error path; verify `max-lines-per-function` rule still passes (function is currently 73 lines — well within 300 limit)

**Consumer tracing (new output: `already_exists: true`):**
- New field on `gmail_create_draft` result when skipping. Consumers: ops-inbox SKILL.md Step 5 ("Create draft" action) — unchanged because the response is surfaced to the operator as a message string; no code parses `already_exists` programmatically. Safe to add without updating callers.

**Scouts:** `AuditEntry.action` union type in `gmail-shared.ts:154` — verify whether it uses a string literal union or `string`. If a union, `"inquiry-draft-dedup-skipped"` must be added to the type. Current union: `"lock-acquired" | "lock-released" | "outcome" | "booking-dedup-skipped"`.

**Edge Cases & Hardening:**
- `drafts.list` rate-limited → fail-open, draft created
- `original.data.threadId` null/undefined → skip dedup check, proceed with draft (threadId absence means Gmail returned incomplete metadata; safe to continue)
- Thread has multiple existing drafts → `drafts.length > 0` covers this; still skips

**What would make this >=90%:** Confirmed `drafts.list` query latency benchmark from Gmail API docs or empirical measurement. Currently assumed safe based on existing booking dedup usage.

**Rollout / rollback:**
- Rollout: deploy MCP server; new behaviour active immediately on next `gmail_create_draft` call
- Rollback: revert `handleCreateDraft` change; prior behaviour (unconditional create) restored

**Documentation impact:** None: `ops-inbox/SKILL.md` Step 5 already says "Create draft" — the dedup message surfaces naturally in the tool response.

**Notes / references:**
- Pattern source: `checkBookingRefDuplicate` in `packages/mcp-server/src/tools/gmail-booking.ts`
- `handleCreateDraft` entry point: `packages/mcp-server/src/tools/gmail.ts:2603`
- Audit log type: `packages/mcp-server/src/tools/gmail-shared.ts:154` (`AuditEntry.action` union)

---

### TASK-02: Wire reconcile-in-progress into ops-inbox preflight

- **Type:** IMPLEMENT
- **Deliverable:** Updated `ops-inbox/SKILL.md` Step 0 with auto-reconcile call
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.claude/skills/ops-inbox/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 95% — SKILL.md change only; tool already fully implemented and registered
  - Approach: 92% — `dryRun: false, staleHours: 2` is the correct auto-preflight config; recover silently, surface count only if non-zero
  - Impact: 90% — eliminates silent email disappearance on session crash; zero risk of recovering a live In-Progress email (2h window)

**Acceptance:**
- ops-inbox SKILL.md Step 0 includes a `gmail_reconcile_in_progress({ dryRun: false, staleHours: 2 })` call immediately after `health_check` passes
- If reconcile returns `counts.routedRequeued > 0`, the preflight output mentions the count: "N stuck emails recovered and re-queued"
- If reconcile returns all zeros, preflight output is silent about reconcile (no noise on clean sessions)
- If reconcile call fails, preflight continues (fail-open — surface a warning, do not stop the session)

**Validation contract:**
- TC-R1: SKILL.md Step 0 block now contains `gmail_reconcile_in_progress` call with `dryRun: false` and `staleHours: 2`
- TC-R2: Preflight output template includes conditional recovery count message

**Execution plan:**
- Red: verify current Step 0 in SKILL.md contains only `health_check` — confirmed (line 30)
- Green: insert `gmail_reconcile_in_progress({ dryRun: false, staleHours: 2 })` call block after the `health_check` block in Step 0; add conditional output line to the preflight report format
- Refactor: ensure fail-open wording is explicit ("If this call fails, log a warning and continue — do not stop the session")

**Edge Cases & Hardening:**
- Reconcile call throws → preflight continues with warning; no emails lost
- All scanned emails are within 2h → `keptFresh` count non-zero, `routedRequeued` zero → silent (correct)
- Many stuck emails → all re-routed; surfaced in preflight count; operator can verify in gmail_list_pending

**What would make this >=90%:** Already at 92%. No further evidence needed.

**Rollout / rollback:**
- Rollout: immediate on next ops-inbox session (SKILL.md update, no code deploy)
- Rollback: revert SKILL.md Step 0 to health_check-only

**Documentation impact:** ops-inbox SKILL.md is the deliverable. No other docs affected.

**Notes / references:**
- `handleReconcileInProgress`: `packages/mcp-server/src/tools/gmail-reconciliation.ts:41`
- Tool registered at: `packages/mcp-server/src/tools/gmail.ts:3408`
- ops-inbox SKILL.md Step 0 current state: `.claude/skills/ops-inbox/SKILL.md:26-44`

---

### TASK-03: Implement `gmail_audit_labels` tool

- **Type:** IMPLEMENT
- **Deliverable:** New `handleAuditLabels` handler in `gmail.ts`; `gmail_audit_labels` registered in tool router; new test file `gmail-audit-labels.test.ts`; ops-inbox SKILL.md Step 7 updated to surface audit result
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/__tests__/gmail-audit-labels.test.ts`, `.claude/skills/ops-inbox/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 85% — `labels.list` + filter pattern is straightforward; REQUIRED_LABELS and LEGACY_LABELS are the authoritative reference sets
  - Approach: 82% — flag-only (no delete) is conservative and safe; LEGACY_LABELS surfaced as a distinct category to avoid confusing the operator
  - Impact: 78% — hygiene improvement; value is proportional to how many orphaned labels have accumulated in the live Gmail account (unknown without access)

**Acceptance:**
- `gmail_audit_labels` tool is callable via MCP and returns `{ known: string[], legacy: string[], orphaned: string[], total_brikette: number }`
- `known`: `Brikette/*` labels present in `REQUIRED_LABELS`
- `legacy`: `Brikette/*` labels matching any value in `LEGACY_LABELS` (known migration artifacts)
- `orphaned`: `Brikette/*` labels not in either set
- ops-inbox SKILL.md Step 7 session summary includes a `gmail_audit_labels` call and surfaces orphaned count with list (only if `orphaned.length > 0`)
- TC-A1, TC-A2, TC-A3 pass in CI

**Validation contract:**
- TC-A1: Gmail has only current REQUIRED_LABELS → `known` = 23 entries, `legacy` = [], `orphaned` = []
- TC-A2: Gmail has REQUIRED_LABELS + 2 LEGACY_LABELS + 1 unknown label → `legacy` = 2, `orphaned` = 1
- TC-A3: Gmail has zero Brikette/* labels → all lists empty, tool still succeeds

**Execution plan:**
- Red: write TC-A1 asserting `known.length === 23` and `orphaned.length === 0` when only current labels exist → no handler exists yet, test fails
- Green: implement `handleAuditLabels(gmail)`:
  1. Call `gmail.users.labels.list({ userId: "me" })`
  2. Filter to labels whose `name` starts with `"Brikette/"` or equals `"Brikette"`
  3. Classify each as `known` (in `REQUIRED_LABELS`), `legacy` (value in `Object.values(LEGACY_LABELS)`), or `orphaned` (neither)
  4. Return `jsonResult({ known, legacy, orphaned, total_brikette: known.length + legacy.length + orphaned.length })`
  5. Register in `handleGmailTool` switch: `case "gmail_audit_labels": return handleAuditLabels(gmail)`
  6. Add tool descriptor in the tools array
- Refactor: update ops-inbox SKILL.md Step 7 to add `gmail_audit_labels` call and conditional orphaned label summary block; add TC-A2 and TC-A3

**Planning validation (M effort):**
- Checks run: confirmed `REQUIRED_LABELS` and `LEGACY_LABELS` are both exported from `gmail-shared.ts` and importable in `gmail.ts`; confirmed tool router pattern at `gmail.ts:3408`
- Validation artifacts: `gmail-shared.ts:93-118` (REQUIRED_LABELS), `gmail-shared.ts:51-61` (LEGACY_LABELS)
- Unexpected findings: None

**Consumer tracing (new output: `{ known, legacy, orphaned, total_brikette }`):**
- Consumed by: ops-inbox SKILL.md Step 7 — addressed in this task (SKILL.md updated in Green phase)
- No TypeScript code parses `gmail_audit_labels` response programmatically — ops-inbox is a skill doc, not code. Safe.

**Edge Cases & Hardening:**
- `labels.list` API error → return `errorResult` (do not silently return empty lists)
- Label name is null/undefined → filter out before classification; do not crash
- LEGACY_LABELS overlap with REQUIRED_LABELS? — confirmed they do not overlap (different name strings); safe to classify independently
- More than 500 labels in account → `labels.list` returns paginated; Gmail label list is unpaginated (max 10,000 labels per account); no pagination needed

**What would make this >=90%:** Running against the live Gmail account to confirm actual orphan count and verify the classification logic produces the expected output. Not possible in fact-find mode.

**Rollout / rollback:**
- Rollout: deploy MCP server; tool available immediately
- Rollback: remove handler and tool registration; SKILL.md Step 7 reverted

**Documentation impact:** ops-inbox SKILL.md Step 7 updated (part of this task).

**Notes / references:**
- `REQUIRED_LABELS`: `packages/mcp-server/src/tools/gmail-shared.ts:93-118` (23 entries)
- `LEGACY_LABELS`: `packages/mcp-server/src/tools/gmail-shared.ts:51-61` (9 entries)
- Tool router: `packages/mcp-server/src/tools/gmail.ts:3408` — add new `case` here
- Tool descriptor array: `gmail.ts` tools list — add `{ name: "gmail_audit_labels", description: "..." }` entry

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Thread-level dedup in `gmail_create_draft` | Yes | None | No |
| TASK-02: Wire reconcile into ops-inbox preflight | Yes | None | No |
| TASK-03: `gmail_audit_labels` tool | Yes | [Minor] LEGACY_LABELS overlap check — confirmed no overlap with REQUIRED_LABELS | No |

## Risks & Mitigations

- `drafts.list` adds latency to every `gmail_create_draft` call — Low/Low. Fail-open; Gmail draft list queries are fast.
- Auto-reconcile recovers an email the operator left In-Progress intentionally — Low/Medium. 2h `staleHours` window prevents false positives on active sessions.
- LEGACY_LABELS surfaced as orphans instead of known migration artifacts — Medium/Low. Distinct `legacy` category in TASK-03 output addresses this.
- `gmail_audit_labels` API error confuses operator if it surfaces as session summary noise — Low/Low. `errorResult` on API error is clear; only `orphaned.length > 0` triggers summary output.

## Observability

- Logging: `"inquiry-draft-dedup-skipped"` audit entries in `data/email-audit-log.jsonl` (TASK-01)
- Metrics: reconcile recovery count surfaced per ops-inbox session preflight (TASK-02); orphaned label count surfaced per session summary (TASK-03)
- Alerts/Dashboards: None: existing telemetry rollup via `gmail_telemetry_daily_rollup` covers drafted/deferred counts; dedup skips are audit-log-only

## Acceptance Criteria (overall)

- [x] `gmail_create_draft` never creates a second draft in the same thread
- [x] Ops-inbox preflight automatically recovers stuck In-Progress emails on every session start
- [x] `gmail_audit_labels` correctly classifies Brikette/* labels as known/legacy/orphaned
- [x] TypeScript typecheck passes on all modified files
- [x] ESLint passes on all modified files (including `max-lines-per-function` rule)
- [x] TC-10, TC-11, TC-R1, TC-R2, TC-A1, TC-A2, TC-A3 pass in CI

## Decision Log

- 2026-03-06: Chosen parallel Wave 1 execution for all three tasks — disjoint file sets, zero merge risk
- 2026-03-06: TASK-03 flag-only by default (`autoDelete: false`) — label deletion is irreversible; operator review preferred
- 2026-03-06: TASK-01 fail-open on `drafts.list` error — mirrors `checkBookingRefDuplicate` policy
- 2026-03-06: TASK-02 `staleHours: 2` auto-reconcile — existing default is correct for ops-inbox cadence (sessions run 2× daily)

## Overall-confidence Calculation

- TASK-01: S=1, confidence 90% → weight 1 × 90 = 90
- TASK-02: S=1, confidence 92% → weight 1 × 92 = 92
- TASK-03: M=2, confidence 82% → weight 2 × 82 = 164
- Overall = (90 + 92 + 164) / (1 + 1 + 2) = 346 / 4 = **86.5% → 87%**
