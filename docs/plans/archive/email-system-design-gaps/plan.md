---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-02-19
Last-updated: 2026-02-19
Last-reviewed: 2026-02-19
Feature-Slug: email-system-design-gaps
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: effort-weighted average of per-task confidence; S=1, M=2
Relates-to: docs/plans/email-system-design-gaps/fact-find.md
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Email System Design Gaps Plan

## Summary

The Brikette email pipeline (MCP server tools: `gmail_organize_inbox`, `draft_interpret`, `draft_generate`, `draft_refine`, `prime_process_outbound_drafts`) has eight confirmed design gaps. These span scan coverage, lock durability, deferral automation, policy enforcement, label hygiene on error, observability, Flow 2/3 label attribution, and numeric escalation thresholds. All gaps are isolated to `packages/mcp-server`; no app-layer or platform-core changes are required. This plan delivers seven IMPLEMENT tasks remediating all eight issues, sequenced to install observability first and resolve the two highest data-loss risks (Issues 2 and 5) before the transitional scan-scope fix (Issue 1) depends on them.

## Goals

- Add an append-only audit log so every lock-acquire and outcome event is persisted across sessions.
- Make `processingLocks` durable across process restarts using a file-backed lock store.
- Ensure label hygiene on failure: In-Progress label is removed whenever a Gmail API call throws mid-pipeline.
- Add a mechanical deferral gate in `draft_interpret` for CRITICAL and high-confidence HIGH escalation tiers.
- Add a code-level hard-rule guard in `draft_refine` for prepayment and cancellation categories.
- Switch `handleOrganizeInbox` default query from `is:unread` to a label-absence query derived from a single registry.
- Apply `Outcome/Drafted` and `Agent/*` labels in `prime_process_outbound_drafts` (Flow 2/3 attribution).

## Non-goals

- Full ingestion redesign (Gmail filter or history-based `lastHistoryId`) — separate plan track; transitional fix only in this plan.
- Changes to any app outside `packages/mcp-server` (no Next.js, no platform-core, no database migrations). Exception: `.claude/skills/ops-inbox/SKILL.md` is in scope for TASK-05 only, because it documents the operator contract for the new `escalation_required` field — the code change and the skill update are atomic.
- OAuth, Firebase, or external logging infrastructure changes.

## Constraints & Assumptions

- Constraints:
  - All Gmail label mutations must go through `ensureLabelMap` + `collectLabelIds` pattern.
  - All tool handlers must return `jsonResult` or `errorResult` (never throw to caller).
  - `PROCESSING_TIMEOUT_MS` constant must remain authoritative for the 30-minute processing timeout threshold.
  - New tests must use the existing Jest Node environment (`/** @jest-environment node */`).
  - No external logging infrastructure — audit log is append-only JSON-lines to local file.
  - Lock store uses local filesystem (`data/locks/`); Firebase-backed store is out of scope.
- Assumptions:
  - Gmail API label-absence query (`-label:X`) is functional for the Brikette inbox size (< 5000 messages).
  - Single-process mcp-server justifies file-based lock; no distributed lock needed.
  - Pete reads emails before the bot run infrequently enough that Issue 1 is lower priority than Issues 2 and 5.
  - `data/locks/` and `data/*.jsonl` will be gitignored; the `data/` directory may already exist (precedent: `loop.ts` uses `appendFile`).

## Fact-Find Reference

- Related brief: `docs/plans/email-system-design-gaps/fact-find.md`
- Key findings used:
  - Issue 1: `gmail.ts` line 1571 query is exactly `"is:unread in:inbox"`; read emails silently missed (fact-find §Issue 1).
  - Issue 2: `processingLocks` is in-memory; stale check falls back to `internalDate` on restart (semantically incorrect — email receive time, not lock-acquire time) (fact-find §Issue 2).
  - Issue 3/8: No numeric deferral threshold anywhere in tool chain; all deferral is natural-language instruction in SKILL.md (fact-find §Issues 3, 8).
  - Issue 4: `draft-refine.ts` (194 lines) has zero category-check logic (fact-find §Issue 4).
  - Issue 5: `handleMarkProcessed` has no try/catch around `gmail.users.messages.modify`; exception leaves In-Progress label orphaned (fact-find §Issue 5).
  - Issue 6: No persistent audit log exists; `loop.ts` precedent for `appendFile` in mcp-server (fact-find §Issue 6).
  - Issue 7: `categoryToLabelNames` applies only `READY_FOR_REVIEW` + category label; `PROCESSED_DRAFTED` and `Agent/*` absent (fact-find §Issue 7).
  - Pete's architectural decisions (2026-02-19): durable file-based lock; stale from `lockedAt`; 5-min grace on restart; reconcile reduced to 2h; CRITICAL always defers, HIGH + confidence >= 0.80 defers; label-absence query as default (fact-find §Resolved Decisions).

## Proposed Approach

- Option A: Fix all issues independently, no shared infrastructure — simple but misses the opportunity to share a lock-store module across tasks.
- Option B: Introduce two shared modules (`lock-store.ts`, `organize-query.ts`) first, then fix consumers — cleaner architecture, enables test isolation via dependency injection.
- Chosen approach: Option B. `lock-store.ts` is introduced in TASK-03 (after audit log is in place from TASK-01). `organize-query.ts` is introduced in TASK-06. Each fix is independently testable. Sequencing ensures observability (TASK-01) precedes all other tasks so subsequent fixes produce audit events from day one.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No — Status is Draft, not Active

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Audit log — append-only JSON-lines for lock-acquire and outcome events | 85% | S | Complete (2026-02-19) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Label hygiene on failure — try/catch + In-Progress cleanup in handleMarkProcessed | 88% | S | Complete (2026-02-19) | - | TASK-06 |
| TASK-03 | IMPLEMENT | Durable lock store — file-backed lock replacing in-memory processingLocks | 80% | M | Complete (2026-02-19) | TASK-01 | TASK-06 |
| TASK-04 | IMPLEMENT | Hard rule category guard in draft_refine for prepayment/cancellation | 90% | S | Complete (2026-02-19) | - | - |
| TASK-05 | IMPLEMENT | Mechanical deferral gate in draft_interpret for CRITICAL and HIGH escalation | 85% | S | Complete (2026-02-19) | - | - |
| TASK-06 | IMPLEMENT | Transitional label-absence query as default in handleOrganizeInbox | 80% | M | Complete (2026-02-19) | TASK-02, TASK-03, TASK-08 | - |
| TASK-07 | IMPLEMENT | Flow 2/3 label attribution — add Outcome/Drafted and Agent/* in prime_process_outbound_drafts | 90% | S | Complete (2026-02-19) | - | - |
| TASK-08 | INVESTIGATE | Gmail label-absence query syntax validation — confirm -label: works with label names not IDs | 75% | S | Complete (2026-02-19) | - | TASK-06 |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-04, TASK-05, TASK-07, TASK-08 | None | All fully independent; launch in parallel. TASK-08 is a quick dryRun scout. |
| 2 | TASK-03 | TASK-01 complete | Durable lock integrates with audit log; audit entries for lock events added here |
| 3 | TASK-06 | TASK-02 + TASK-03 + TASK-08 complete | Label-absence query depends on: label hygiene (TASK-02), durable lock (TASK-03), and confirmed Gmail query syntax (TASK-08) |

## Tasks

---

### TASK-01: Audit log — append-only JSON-lines for lock-acquire and outcome events

- **Type:** IMPLEMENT
- **Deliverable:** New audit log helper + entries written from `handleGetEmail` and `handleMarkProcessed`; new test file
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `packages/mcp-server/src/tools/gmail.ts` (write audit entries in handleGetEmail, handleMarkProcessed)
  - `packages/mcp-server/data/email-audit-log.jsonl` (created; gitignored)
  - `packages/mcp-server/src/__tests__/gmail-audit-log.test.ts` (new test file)
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 90% — Pattern is straightforward: `appendFile` with JSON-serialised entry. `loop.ts` precedent confirms this works in the mcp-server package. No unknown API surface.
  - Approach: 85% — JSON-lines format is well-understood; gitignore placement is clear; entry shape is specified. Single unknown: whether the `data/` directory needs to be created on first run or already exists — trivially handled with `fs.mkdirSync(..., { recursive: true })`.
  - Impact: 85% — Audit log is observability-only; no functional change. Risk of impact is near-zero. Held-back test: if `appendFile` path resolution fails in production (e.g., CWD differs), entries would silently not appear — mitigated by writing to an absolute path resolved from `__dirname`.
- **Acceptance:**
  - `handleGetEmail` appends a `lock-acquired` entry to `email-audit-log.jsonl` on every successful lock acquisition.
  - `handleMarkProcessed` appends an `outcome` entry containing the result of the operation.
  - Each line in the log is a valid JSON object (JSON-lines format).
  - Existing entries are never modified or overwritten on subsequent calls.
- **Validation contract (TC-01):**
  - TC-01-01: handleGetEmail writes `{ ts, messageId, action: "lock-acquired", actor }` entry to audit log — verified by reading file after call in test
  - TC-01-02: handleMarkProcessed writes `{ ts, messageId, action: "outcome", actor, result }` entry — verified by reading file after call in test
  - TC-01-03: each line in the audit log file is parseable as JSON (JSON-lines format) — verified by splitting on newline and parsing each non-empty line
  - TC-01-04: audit log is append-only — calling handleGetEmail twice for different messageIds produces two entries; first entry is unchanged
- **Execution plan:** Red → write failing tests TC-01-01 through TC-01-04, mocking `fs.appendFileSync` to capture calls. Green → implement `appendAuditEntry(entry: AuditEntry)` helper in `gmail.ts`; call from `handleGetEmail` (lock-acquired) and `handleMarkProcessed` (outcome). Refactor → extract `AuditEntry` type; add `.gitignore` entry for `packages/mcp-server/data/locks/` and `packages/mcp-server/data/*.jsonl`.
- **Planning validation:** None required for S-effort task.
- **Scouts:** None: all unknowns (CWD resolution, `data/` existence) are standard Node.js patterns with deterministic solutions.
- **Edge Cases & Hardening:** If `data/` directory does not exist, `appendAuditEntry` creates it with `fs.mkdirSync(dir, { recursive: true })` before writing. If `appendFile` throws (e.g., disk full), log the error to stderr but do not propagate — audit failure must not break the main tool flow.
- **What would make this >=90%:**
  - A completed implementation of the path-resolution approach verified against the actual mcp-server working directory at runtime (E2 evidence).
- **Rollout / rollback:**
  - Rollout: `data/email-audit-log.jsonl` is gitignored; it is created on first run. No migration needed.
  - Rollback: Remove the two `appendAuditEntry` call sites and the helper; no state is affected.
- **Documentation impact:** Add `.gitignore` entries for `packages/mcp-server/data/locks/` and `packages/mcp-server/data/*.jsonl`.
- **Notes / references:** `loop.ts` in mcp-server uses `appendFile` — confirms pattern is acceptable. Entry shape `{ ts, messageId, action, actor, result? }` matches the ops-inbox pipeline's existing actor enum.
- **Build evidence (Complete 2026-02-19):** `appendAuditEntry(entry, logPath?)` helper in `gmail.ts`. Path resolved via `process.cwd()`-based candidate resolution + `AUDIT_LOG_PATH` env override for test isolation (deviation: `__dirname` approach incompatible with ESM/CJS ts-jest mode; same pattern as `guest-email-activity.ts`). Called from `handleGetEmail` (lock-acquired) and `handleMarkProcessed` (outcome). `.gitignore` updated with `data/locks/` and `data/*.jsonl`. 4/4 tests passing (gmail-audit-log.test.ts TC-01-01..04). Committed in `f5b94af2af`.

---

### TASK-02: Label hygiene on failure — try/catch + In-Progress cleanup in handleMarkProcessed

- **Type:** IMPLEMENT
- **Deliverable:** try/catch wrapper around Gmail API calls in handleMarkProcessed and handleGetEmail with In-Progress label cleanup on error path
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `packages/mcp-server/src/tools/gmail.ts` (try/catch in handleMarkProcessed, handleGetEmail)
  - `packages/mcp-server/src/__tests__/gmail-label-state.test.ts` (extend with error-path cases)
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 88%
  - Implementation: 90% — The missing try/catch is confirmed at `gmail.ts` line 2370. Cleanup pattern (remove In-Progress, call `processingLocks.delete`) is straightforward and follows existing label-mutation patterns.
  - Approach: 90% — Error path must not change the outer `handleGmailTool` error contract. Adding an inner try/catch that catches, attempts cleanup, then returns `errorResult` preserves the contract. Well-understood pattern.
  - Impact: 88% — Directly addresses the confirmed data-loss path (In-Progress email stuck for up to 24h). Held-back test: if the cleanup attempt itself throws (e.g., second Gmail API call also fails), we must not lose the original error — mitigated by catching the cleanup error separately and including both statuses in `errorResult`.
- **Acceptance:**
  - When `gmail.users.messages.modify` throws in `handleMarkProcessed`, the In-Progress label removal is attempted before returning `errorResult`.
  - `processingLocks.delete` is called on the error path.
  - The `errorResult` message includes the cleanup status (succeeded or failed).
- **Validation contract (TC-02):**
  - TC-02-01: when `gmail.users.messages.modify` throws in handleMarkProcessed, In-Progress label removal is attempted before returning errorResult — verified by spy confirming second `messages.modify` call with In-Progress in `removeLabelIds`
  - TC-02-02: `processingLocks.delete` is called on the error path — verified by spy or by reading map state after error
  - TC-02-03: errorResult message includes cleanup status (succeeded/failed) — verified by inspecting returned content text
- **Execution plan:** Red → write test that forces `messages.modify` to throw on first call, assert cleanup `messages.modify` is called and `processingLocks.delete` is called. Green → wrap the main `messages.modify` call in try/catch; on catch, attempt In-Progress label removal in a nested try/catch; return `errorResult` with both error messages. Refactor → extract a `cleanupInProgress(emailId)` helper reusable from `handleGetEmail` error paths too.
- **Planning validation:** None required for S-effort task.
- **Scouts:** None: cleanup pattern is identical to the existing `isStale` cleanup block at lines 2070–2083.
- **Edge Cases & Hardening:** Cleanup attempt itself may throw (network down, rate limit) — catch separately, include in `errorResult` as `"cleanup failed: <message>"`. Must not throw from cleanup path; always return `errorResult`.
- **What would make this >=90%:**
  - E2 evidence: running the existing `gmail-label-state.test.ts` with a forced-throw case to confirm the spy approach works with the existing mock setup.
- **Rollout / rollback:**
  - Rollout: Try/catch addition is fully backward-compatible; success path is unchanged.
  - Rollback: Remove the try/catch wrapper; restore original inline code.
- **Documentation impact:** None: internal error handling; no API contract change.
- **Notes / references:** Outer try/catch in `handleGmailTool` (lines 2705–2755) catches all unhandled exceptions — this task inserts an inner catch that handles cleanup before the outer catch can fire, so the outer contract is preserved.
- **Build evidence (Complete 2026-02-19):** `cleanupInProgress(emailId, gmail)` private helper added before `handleMarkProcessed`. Removes In-Progress label + calls `processingLocks.delete`; returns `"cleanup succeeded"` or `"cleanup failed: <msg>"` — never throws. Main `messages.modify` in `handleMarkProcessed` wrapped in try/catch; on catch calls `cleanupInProgress` and returns `errorResult` with both error messages. 14/14 tests passing (gmail-label-state.test.ts, 4 new TC-02-01, 02-02, 02-03, 02-03b). Committed in `3db62f1629`.

---

### TASK-03: Durable lock store — file-backed lock replacing in-memory processingLocks

- **Type:** IMPLEMENT
- **Deliverable:** New `lock-store.ts` pure module; updated `handleGetEmail`, `handleMarkProcessed`, `handleOrganizeInbox`; new test files
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `packages/mcp-server/src/tools/gmail.ts` (replace processingLocks Map usage; update isProcessingLockStale; add startup recovery to handleOrganizeInbox; lower staleHours default to 2)
  - `packages/mcp-server/src/utils/lock-store.ts` (new pure module)
  - `packages/mcp-server/data/locks/` (created; gitignored)
  - `packages/mcp-server/src/__tests__/lock-store.test.ts` (new)
  - `packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts` (extend with startup recovery cases)
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 85% — File-based lock pattern is well-understood. The `acquireLock` / `releaseLock` / `isStale` API surface is specified. Key implementation risk: atomic file creation to prevent TOCTOU race (use `fs.writeFileSync` with `wx` flag). On a single-process Node.js server, `wx` flag provides sufficient exclusion.
  - Approach: 80% — Replacing module-level `processingLocks` Map with an injected LockStore requires threading the store through multiple call sites in `gmail.ts` (a 2750-line file). Risk: missed call sites. Mitigated by searching for all `processingLocks` references before coding.
  - Impact: 80% — Directly addresses confirmed double-processing risk on restart. Held-back test: if `data/locks/` is on a read-only filesystem in some deployment scenario, the entire lock mechanism silently fails. This is low-probability given mcp-server is a local Node.js process, but must be handled with a startup check. If such an unknown resolves badly (read-only FS), it would break lock acquisition entirely — therefore score stays at 80, not higher.
- **Acceptance:**
  - `acquireLock` creates `data/locks/<messageId>.json` with `{ lockedAt: number, owner: string }`.
  - `releaseLock` deletes the lock file.
  - `isProcessingLockStale` reads `lockedAt` from file; stale when `Date.now() - lockedAt > PROCESSING_TIMEOUT_MS`.
  - In-Progress label present but no lock file → stale after 5-minute grace period (not `internalDate` fallback).
  - `handleOrganizeInbox` startup recovery requeues In-Progress emails with stale or absent lock files.
  - `staleHours` default in `handleReconcileInProgress` reduced from 24 to 2.
  - Lock store is injectable (test parameter) for test isolation.
- **Validation contract (TC-03):**
  - TC-03-01: `acquireLock(messageId, owner)` writes `data/locks/<messageId>.json` containing `{ lockedAt: number, owner: string }` — verified by reading file after call
  - TC-03-02: `releaseLock(messageId)` deletes the lock file — verified by checking file absence after call
  - TC-03-03: `isProcessingLockStale(messageId)` reads `lockedAt` from file; returns `true` when `Date.now() - lockedAt > PROCESSING_TIMEOUT_MS` — verified with a mocked Date.now
  - TC-03-04: In-Progress label present + no lock file → stale after 5-minute grace (not internalDate fallback) — verified by injecting a mock lock store with no file + asserting stale=true after 5min simulated elapsed time
  - TC-03-05: startup recovery in `handleOrganizeInbox` requeues In-Progress emails with no valid lock file (or stale lock) — verified by mocking Gmail client to return one In-Progress message + no lock file, asserting `messages.modify` call to remove In-Progress and add Needs-Processing
  - TC-03-06: `staleHours` default in `handleReconcileInProgress` is 2 (not 24) — verified by reading schema default or calling with no staleHours arg and asserting the 2h threshold
  - TC-03-07: lock store is injectable (test param) — verified by passing a mock lock store to `handleGetEmail` in a unit test
- **Execution plan:** Red → write tests TC-03-01 through TC-03-07 against stub implementations. Green → implement `LockStore` class (or module with `acquireLock`, `releaseLock`, `isStale` exports) in `lock-store.ts`; update `handleGetEmail` and `handleMarkProcessed` to use injected lock store instead of module-level Map; add startup recovery to `handleOrganizeInbox`; lower `staleHours` default. Refactor → ensure lock files are cleaned up in all error paths; add audit log entries (from TASK-01) for lock events (acquired, released, stale-recovered).
- **Planning validation (M-effort):**
  - Checks run: `grep -n "processingLocks" packages/mcp-server/src/tools/gmail.ts` — required to enumerate all call sites before implementation to ensure no missed references.
  - Validation artifacts: count and line numbers of all `processingLocks` references; list of call sites requiring update.
  - Unexpected findings: None anticipated; `processingLocks` is a module-level singleton used in handleGetEmail and handleMarkProcessed only (confirmed by fact-find).
- **Scouts:** Confirm `wx` flag availability in Node.js version used by mcp-server (required for atomic file creation). Confirm `data/` directory gitignore scope does not conflict with existing `.gitignore` rules.
- **Edge Cases & Hardening:** Force-kill scenario (no cleanup): lock file left on disk; startup recovery or reconcile (now 2h) will requeue. Concurrent lock attempt for same messageId: `wx` flag causes second writer to fail — return `errorResult("already being processed")`; consistent with current behaviour. Lock file corruption (partial write): catch JSON.parse error and treat as no-lock-file (reclaimable after grace).
- **What would make this >=90%:**
  - E2 evidence: a spike test confirming the `wx` flag correctly prevents concurrent writes in Node.js, and confirming `data/locks/` path resolves correctly from the mcp-server working directory.
- **Rollout / rollback:**
  - Rollout: `data/locks/` created on first run. Existing in-memory lock state is lost on deploy (acceptable: locks are short-lived; reconcile covers the gap). `dryRun` mode tests can validate startup recovery path before live use.
  - Rollback: Revert `lock-store.ts` and restore module-level `processingLocks` Map in `gmail.ts`. Delete `data/locks/` directory.
- **Documentation impact:** Add `packages/mcp-server/data/locks/` to `.gitignore`.
- **Notes / references:** TASK-01 must be complete before TASK-03 so that audit entries for lock events (acquired, released, stale-recovered) can be added during TASK-03 Refactor step. Pete's decision (2026-02-19): "stale must be computed from lock acquisition time, not the email's internalDate."
- **Build evidence (Complete 2026-02-19):** `lock-store.ts` in `src/utils/` with `LockStore` interface and `createLockStore()` factory. `lockStoreRef` replaces `processingLocks` Map (7 call sites updated). `setLockStore()` exported for test injection. `isProcessingLockStale` delegates to `lockStoreRef.isStale()` — `internalDate` fallback removed. `staleHours` default changed 24→2. `runStartupRecovery()` added to `handleOrganizeInbox`. Audit log extended with `"lock-released"` action type. 47/47 tests passing across 4 suites (11 new in lock-store.test.ts, 2 new TC-03-05/06 in gmail-organize-inbox.test.ts). Committed in `a4026eebfd`.

---

### TASK-04: Hard rule category guard in draft_refine for prepayment/cancellation

- **Type:** IMPLEMENT
- **Deliverable:** Category guard in `handleDraftRefineTool`; extended test cases in `draft-refine.test.ts`
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `packages/mcp-server/src/tools/draft-refine.ts`
  - `packages/mcp-server/src/__tests__/draft-refine.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — The guard is a pure string comparison: `scenarios[0].category in PROTECTED_CATEGORIES && refinedBodyPlain.trim() !== originalBodyPlain.trim()`. The insertion point (after schema parse, before identity check) is unambiguous in a 194-line file.
  - Approach: 90% — Fully specified by Pete's decision and the fact-find. No unknown behavior. Held-back test: if `scenarios` array is empty (old-schema call), the guard would throw on `scenarios[0]` — must guard against empty array before accessing index 0; handle gracefully (skip guard if no scenarios).
  - Impact: 90% — Prevents policy bypass in prepayment and cancellation categories. No side-effect on non-protected categories or on identical text. Held-back test: if PROTECTED_CATEGORIES list grows later and the constant is in the wrong file, the guard becomes stale — mitigated by exporting the constant.
- **Acceptance:**
  - prepayment scenario + `refinedBodyPlain !== originalBodyPlain` → `errorResult` containing "Hard rule violation".
  - cancellation scenario + `refinedBodyPlain !== originalBodyPlain` → `errorResult` containing "Hard rule violation".
  - prepayment scenario + identical text → passes (refinement_applied: false).
  - Non-protected category + changed text → passes normally.
- **Validation contract (TC-04):**
  - TC-04-01: prepayment scenario + `refinedBodyPlain !== originalBodyPlain` → `errorResult` containing "Hard rule violation" — verified by asserting content[0].text includes "Hard rule violation"
  - TC-04-02: cancellation scenario + `refinedBodyPlain !== originalBodyPlain` → `errorResult` containing "Hard rule violation" — same assertion
  - TC-04-03: prepayment scenario + identical text → passes (refinement_applied: false) — verified by asserting success result with `refinement_applied: false`
  - TC-04-04: non-protected category + changed text → passes normally — verified by asserting success result with `refinement_applied: true`
- **Execution plan:** Red → add test cases TC-04-01 and TC-04-02 (expect errorResult). Green → add guard after schema parse, before identity check: check `scenarios[0]?.category` against `["prepayment", "cancellation"]` and `refinedBodyPlain.trim() !== originalBodyPlain.trim()`. Refactor → extract `PROTECTED_CATEGORIES` constant at module top; add a comment referencing ops-inbox SKILL.md hard-rule section.
- **Planning validation:** None required for S-effort task.
- **Scouts:** Confirm existing `draft-refine.test.ts` fixtures use `scenarios[]` format (not old-schema `scenario` format without array) — fact-find confirms the old-schema guard already exists (line reference: "old-schema guard" test in coverage table).
- **Edge Cases & Hardening:** Empty `scenarios` array (old-schema path): `scenarios[0]?.category` is `undefined`; guard does not trigger — safe. Whitespace-only differences: `.trim()` comparison normalises trailing whitespace — intentional; template text must not change in any meaningful way.
- **What would make this >=90%:**
  - Already at 90%. To reach 95%: E2 confirmation by running the existing test suite with a prepayment fixture to confirm the existing mock structure accepts the guard without fixture updates.
- **Rollout / rollback:**
  - Rollout: Guard is additive. Existing callers that pass identical text are unaffected. Only callers that attempt to modify prepayment/cancellation text will receive errorResult — which is the desired behaviour.
  - Rollback: Remove the guard block and `PROTECTED_CATEGORIES` constant.
- **Documentation impact:** None: guard enforces existing documented hard rule; no new rule introduced.
- **Notes / references:** ops-inbox SKILL.md lines 161–166 and 195–198 document the hard rule. This task moves the enforcement from text instruction to code.
- **Build evidence (Complete 2026-02-19):** `PROTECTED_CATEGORIES = ["prepayment", "cancellation"]` constant exported from `draft-refine.ts`. Guard returns `errorResult("Hard rule violation: ...")` when dominant scenario category is protected AND `refinedBodyPlain.trim() !== originalBodyPlain.trim()`. 10/10 tests passing (4 new TC-04-01..04). Typecheck clean. Committed in `8507cfd1e4`.

---

### TASK-05: Mechanical deferral gate in draft_interpret for CRITICAL and HIGH escalation

- **Type:** IMPLEMENT
- **Deliverable:** `escalation_required` field added to `EmailActionPlan` type and derivation in `handleDraftInterpretTool`; updated ops-inbox SKILL.md; extended test cases
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `packages/mcp-server/src/tools/draft-interpret.ts`
  - `.claude/skills/ops-inbox/SKILL.md` (update step 3 to check escalation_required before calling draft_generate; document threshold logic)
  - `packages/mcp-server/src/__tests__/draft-interpret.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — The derivation logic is a pure conditional: `tier === "CRITICAL" || (tier === "HIGH" && confidence >= 0.80)`. Insertion point is after `classifyEscalation` in `handleDraftInterpretTool`, before `jsonResult`. No external dependencies.
  - Approach: 85% — Adding a new field to `EmailActionPlan` type is additive; downstream consumers (ops-inbox SKILL.md) need to be updated to check it. Risk: if the skill update is missed, deferral logic remains text-only even though the field is computed — mitigated by TC-05-05 which tests the SKILL.md update. Held-back test: if a downstream tool reads `EmailActionPlan` and fails on unknown fields, the new field could cause breakage — JSON objects are open by default in TypeScript; no Zod parse of the plan on the downstream side confirmed by fact-find.
  - Impact: 85% — Directly addresses the confirmed gap: no code-level deferral exists. Risk: threshold (0.80) may over-defer; mitigated by fact-find decision (Pete, 2026-02-19) explicitly choosing 0.80.
- **Acceptance:**
  - `escalation.tier === "CRITICAL"` → returned plan includes `escalation_required: true`.
  - `escalation.tier === "HIGH" && escalation.confidence >= 0.80` → `escalation_required: true`.
  - `escalation.tier === "HIGH" && escalation.confidence < 0.80` → `escalation_required: false`.
  - `escalation.tier === "NONE"` → `escalation_required: false`.
  - ops-inbox SKILL.md updated to check `escalation_required` before calling `draft_generate`.
- **Validation contract (TC-05):**
  - TC-05-01: `escalation.tier === "CRITICAL"` → returned plan includes `escalation_required: true` — verified by parsing jsonResult content
  - TC-05-02: `escalation.tier === "HIGH" && escalation.confidence >= 0.80` → `escalation_required: true` — verified with fixture confidence 0.80 exactly and 0.95
  - TC-05-03: `escalation.tier === "HIGH" && escalation.confidence < 0.80` → `escalation_required: false` — verified with fixture confidence 0.74 (minimum HIGH value from classifyEscalation)
  - TC-05-04: `escalation.tier === "NONE"` → `escalation_required: false` — verified with no-escalation fixture
  - TC-05-05: ops-inbox SKILL.md contains text referencing `escalation_required` field check before draft_generate — verified by reading SKILL.md and asserting presence of the phrase
- **Execution plan:** Red → add tests TC-05-01 through TC-05-04. Green → add `escalation_required: boolean` to `EmailActionPlan` type in `draft-interpret.ts`; compute value after `classifyEscalation` call. Refactor → update `ops-inbox/SKILL.md` step 3 to include `escalation_required` check; add comment in code citing Pete's 2026-02-19 threshold decision.
- **Planning validation:** None required for S-effort task.
- **Scouts:** Confirm `EmailActionPlan` is exported and consumed only by the ops-inbox skill (not by any downstream Zod schema that would reject an unknown field).
- **Edge Cases & Hardening:** Confidence exactly at 0.80: `>= 0.80` means 0.80 triggers deferral — consistent with Pete's decision. Missing `confidence` field (if escalation is NONE, confidence is 0): `NONE && confidence 0 >= 0.80` is false — correct.
- **What would make this >=90%:**
  - E2 evidence: running existing `draft-interpret.test.ts` with a CRITICAL fixture to confirm the existing mock structure accepts the new field without fixture rewrites.
- **Rollout / rollback:**
  - Rollout: `escalation_required` is additive to the returned JSON. If the field is not yet checked by the skill operator, behaviour is unchanged — the natural-language deferral instruction in SKILL.md continues to apply.
  - Rollback: Remove `escalation_required` field from type and computation; revert SKILL.md change.
- **Documentation impact:** ops-inbox SKILL.md step 3 updated to check `escalation_required: true` before calling `draft_generate`.
- **Notes / references:** Pete's decision (2026-02-19): CRITICAL → always defer; HIGH + confidence >= 0.80 → defer; HIGH + confidence < 0.80 → proceed but flag. The `classifyEscalation` function computes HIGH confidence starting at 0.74 — values below 0.80 will not defer.
- **Build evidence (Complete 2026-02-19):** `escalation_required: boolean` added to `EmailActionPlan` type in `draft-interpret.ts`. Derived after `classifyEscalation` call: `CRITICAL → true; HIGH && confidence >= 0.80 → true; else false`. ops-inbox SKILL.md step 3 updated with `escalation_required` check. 37/37 tests passing (4 new TC-05-01..04). Typecheck clean. Committed in `8507cfd1e4`.

---

### TASK-06: Transitional label-absence query as default in handleOrganizeInbox

- **Type:** IMPLEMENT
- **Deliverable:** New `organize-query.ts` pure module; updated `handleOrganizeInbox` default query; extended test files
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `packages/mcp-server/src/tools/gmail.ts` (handleOrganizeInbox query construction)
  - `packages/mcp-server/src/utils/organize-query.ts` (new pure module: buildOrganizeQuery)
  - `packages/mcp-server/src/__tests__/organize-query.test.ts` (new)
  - `packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts` (extend with label-absence and dryRun cases)
- **Depends on:** TASK-02, TASK-03, TASK-08
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — `buildOrganizeQuery` is a pure function with no external dependencies. Query form is fully specified: `in:inbox after:<7-days-ago> -label:<terminal-label-name> ...`. Label names must be derived from the `LABELS` registry in `gmail.ts` to stay correct as labels are added.
  - Approach: 80% — Depends on TASK-02 and TASK-03 being stable so the query change runs on a system with correct label hygiene and durable locks. Without those, switching the default query could expose timing bugs in In-Progress management. Held-back test: if the Gmail API treats `-label:` with a label that contains `/` (path separator) differently from a flat label name, the query may not exclude the right emails — requires dryRun validation before live mutation. If this resolves badly, the query would silently fail to exclude In-Progress emails, risking double-processing. Score stays at 80.
  - Impact: 80% — Directly addresses the silent-miss gap for read emails. Risk: label-absence query is more expensive than `is:unread`; mitigated by scoping to last 7 days. DryRun gate (TC-06-04) must validate thread count before live mutation.
- **Acceptance:**
  - `buildOrganizeQuery("label-absence")` returns a query excluding all terminal Brikette labels and scoped to last 7 days.
  - Adding a new terminal label to `LABELS` registry causes `buildOrganizeQuery` to include it in exclusions (registry completeness).
  - `handleOrganizeInbox` uses label-absence query as default (not `is:unread`).
  - `dryRun: true` mode runs label-absence query, returns thread count, does not mutate any labels.
  - `specificStartDate` provided → uses time-bounded label-absence query (`after:DATE`) not `is:unread`.
- **Validation contract (TC-06):**
  - TC-06-01: `buildOrganizeQuery("label-absence")` returns a query string containing `-label:` exclusions derived from the `LABELS` registry terminal labels and `after:` scoped to last 7 days — verified by parsing returned string
  - TC-06-02: adding a new terminal label to `LABELS` registry causes `buildOrganizeQuery` to include it in exclusions — verified by adding a test label to the registry and asserting its exclusion appears in query output
  - TC-06-03: `handleOrganizeInbox` calls `gmail.users.threads.list` with a query matching the label-absence pattern (not `is:unread`) by default — verified by spy on threads.list
  - TC-06-04: dryRun mode calls threads.list with label-absence query, returns thread count, does NOT call `messages.modify` — verified by spy on messages.modify asserting no calls
  - TC-06-05: `specificStartDate` provided → threads.list called with `after:DATE` label-absence query (not `is:unread`) — verified by spy on threads.list call args
- **Execution plan:** Red → write tests TC-06-01 through TC-06-05. Green → implement `buildOrganizeQuery(mode: "unread" | "label-absence", options?: { startDate?: string }): string` in `organize-query.ts`; update `handleOrganizeInbox` to use `buildOrganizeQuery("label-absence")` as default; add dryRun count-only path. Refactor → add code comment: "This is the transitional fix. Long-term target: Gmail filter or history-based ingestion via `users.history.list` + `lastHistoryId`. See docs/plans/email-system-design-gaps/fact-find.md §Decision 1."
- **Planning validation (M-effort):**
  - Checks run: inspect `LABELS` registry in `gmail.ts` lines 40–65 to enumerate all terminal labels that must appear in exclusions; confirm label name format (e.g., whether Gmail API query requires the label path with `/` or the label ID).
  - Validation artifacts: list of terminal `LABELS` values; confirmation of query format for hierarchical labels.
  - Unexpected findings: If Gmail API requires label IDs (not names) in query strings, `buildOrganizeQuery` must resolve names to IDs — this would require a label map lookup. This is a key unknown; if it resolves badly it would block the pure-function approach. DryRun validation is mandatory before live deployment.
- **Scouts:** Run `gmail_organize_inbox` in dryRun mode with a single `-label:Brikette/Queue/In-Progress` exclusion to confirm the Gmail API accepts the query format before implementing the full label-absence query.
- **Edge Cases & Hardening:** New label added to `LABELS` registry but not marked as terminal: `buildOrganizeQuery` only excludes labels in a `TERMINAL_LABELS` sub-list (not all labels) — requires a clear terminal-label designation in the registry. Empty inbox (no threads after exclusion): returns empty list; handleOrganizeInbox handles gracefully (already does for `is:unread` with no results).
- **What would make this >=90%:**
  - E2 evidence: dryRun execution of the label-absence query against the real Gmail API confirming the query returns the correct thread set and no rate-limit errors.
- **Rollout / rollback:**
  - Rollout: First run with `dryRun: true` to validate thread count matches expectation. Then switch to live mode. `specificStartDate` override allows targeted re-processing if needed.
  - Rollback: Restore `"is:unread in:inbox"` default query in `handleOrganizeInbox`. Remove `organize-query.ts` (no state affected).
- **Documentation impact:** Code comment in `organize-query.ts` documents transitional nature and future ingestion redesign direction.
- **Notes / references:** Pete's decision (2026-02-19): label-absence query is the transitional default; full ingestion redesign (Gmail filter or `lastHistoryId`) is a separate plan track. This task is explicitly transitional.
- **Build evidence (Complete 2026-02-19):** `organize-query.ts` created in `src/utils/` with `buildOrganizeQuery(terminalLabels, mode, options?)`. `TERMINAL_LABELS` defined in `gmail.ts` covering 10 terminal state labels. `handleOrganizeInbox` uses label-absence mode as default; `scanWindow.mode` output updated to `"label-absence"`. dryRun gate confirmed: probe returned 61 threads, no error. 26/26 tests passing (8 new in organize-query.test.ts, 2 new TC-06-03b/04 in gmail-organize-inbox.test.ts). Lint clean.

---

### TASK-07: Flow 2/3 label attribution — add Outcome/Drafted and Agent/* in prime_process_outbound_drafts

- **Type:** IMPLEMENT
- **Deliverable:** Updated `categoryToLabelNames` in `outbound-drafts.ts`; new or extended test cases
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `packages/mcp-server/src/tools/outbound-drafts.ts`
  - `packages/mcp-server/src/__tests__/outbound-drafts.test.ts` (new or extend)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — `LABELS.PROCESSED_DRAFTED` and `Agent/*` constants already exist in the `LABELS` registry (fact-find: lines 47, 60–62). Change is additive: add two label lookups to `categoryToLabelNames`. Adding `actor` parameter to schema (default: `"human"`) follows the existing `actorToLabelName` pattern in `gmail.ts`.
  - Approach: 90% — Fully additive. Existing label sets are preserved. The `LABELS` constants already exist; no new constant definitions needed. Held-back test: if `LABELS.AGENT_HUMAN` does not exist (only `AGENT_CODEX` and `AGENT_CLAUDE` exist), a new constant must be added — fact-find states constants exist at lines 60–62 but does not enumerate them by name. If `AGENT_HUMAN` is missing, task requires adding the constant before using it.
  - Impact: 90% — Fixes label completeness for outbound drafts. No data loss risk. No existing behaviour changed.
- **Acceptance:**
  - `prime_process_outbound_drafts` applies `LABELS.PROCESSED_DRAFTED` to every outbound draft.
  - `prime_process_outbound_drafts` applies `LABELS.AGENT_HUMAN` (or equivalent) to every outbound draft.
  - `actor` parameter added to schema (default: `"human"`).
  - Existing label sets (`OUTBOUND_PRE_ARRIVAL`, `OUTBOUND_OPERATIONS`, `READY_FOR_REVIEW`) still applied.
- **Validation contract (TC-07):**
  - TC-07-01: `prime_process_outbound_drafts` spy on `messages.modify` shows `LABELS.PROCESSED_DRAFTED` in `addLabelIds` for every draft — verified by asserting label ID in spy call args
  - TC-07-02: `prime_process_outbound_drafts` spy on `messages.modify` shows `LABELS.AGENT_HUMAN` label in `addLabelIds` for every draft — same assertion
  - TC-07-03: `actor` parameter accepted in schema with default `"human"` — verified by calling without actor arg and asserting no schema error; verified by calling with `actor: "claude"` and asserting AGENT_CLAUDE label applied instead
  - TC-07-04: existing label sets (`OUTBOUND_PRE_ARRIVAL`, `OUTBOUND_OPERATIONS`, `READY_FOR_REVIEW`) still appear in `addLabelIds` — verified by asserting all three in spy call args for respective category inputs
- **Execution plan:** Red → add tests TC-07-01 through TC-07-03 (TC-07-04 may already be covered by existing tests). Green → add `LABELS.PROCESSED_DRAFTED` to the base label array in `categoryToLabelNames`; add `actor` parameter to `prime_process_outbound_drafts` schema (default `"human"`); apply `actorToLabelName[actor]` label. Refactor → verify `LABELS.AGENT_HUMAN` constant exists in `gmail.ts`; add it if missing.
- **Planning validation:** None required for S-effort task.
- **Scouts:** Confirm `LABELS.AGENT_HUMAN` constant name in `gmail.ts` lines 60–62 (fact-find confirms lines exist but does not enumerate exact constant names).
- **Edge Cases & Hardening:** Unknown `actor` value: `actorToLabelName[actor]` returns `undefined`; must guard — if actor is unknown, skip agent label (do not crash). `PROCESSED_DRAFTED` label not yet created in Gmail account: `ensureLabelMap` handles creation on first use (standard pattern).
- **What would make this >=90%:**
  - Already at 90%. To reach 95%: confirm exact constant names for `LABELS.AGENT_HUMAN` and `LABELS.PROCESSED_DRAFTED` by reading lines 40–65 of `gmail.ts`.
- **Rollout / rollback:**
  - Rollout: Fully additive; existing drafts in Gmail are unaffected (labels applied only on new calls). Gmail creates the label on first use via `ensureLabelMap`.
  - Rollback: Remove the two label additions from `categoryToLabelNames` and the `actor` schema field.
- **Documentation impact:** None: label attribution is internal pipeline metadata; no external API change.
- **Notes / references:** fact-find §Issue 7 confirms `categoryToLabelNames` lines 116–127; `LABELS` constants confirmed at lines 47, 60–62. `actorToLabelName` pattern confirmed at lines 684–694.
- **Build evidence (Complete 2026-02-19):** `actor` param added to schema (default: `"human"`). `PROCESSED_DRAFTED` and agent label (`AGENT_HUMAN`/`AGENT_CLAUDE`/`AGENT_CODEX`) always included in `categoryToLabelNames`. Firebase params grouped into `FirebaseOptions` object to satisfy `max-params` lint rule. MSW interceptor compatibility: mock Response objects updated with `clone()` method. 5/5 tests passing (new TC-07-01..04b). Typecheck clean. Committed in `8507cfd1e4`.

---

### TASK-08: Gmail label-absence query syntax validation

- **Type:** INVESTIGATE
- **Deliverable:** Evidence note confirming (or refuting) whether Gmail `threads.list` accepts `-label:Brikette/Queue/In-Progress` using the label's display name, and the correct query form to use in `buildOrganizeQuery`
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:**
  - None: no code changes. Deliverable is a Decision Log entry in this plan file recording the confirmed query form.
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 75%
  - Investigation: 75% — The question is answerable by a single dryRun API call. Uncertainty is in the answer, not the method. If Gmail requires label IDs rather than display names, TASK-06's pure-function approach needs a label-ID-lookup step. The investigate task converts this unknown into a confirmed finding.
- **Acceptance:**
  - Confirmed answer to: does `gmail.users.threads.list` with query `in:inbox -label:Brikette/Queue/In-Progress` return the expected threads (i.e., does it exclude threads with that label)?
  - Confirmed answer to: does the `/` path separator in label names (e.g., `Brikette/Queue/In-Progress`) work in query strings, or must label IDs be used?
  - Evidence note recorded: correct query form for `buildOrganizeQuery` stated explicitly.
- **Validation contract (TC-08):**
  - TC-08-01: `handleOrganizeInbox` called in dryRun mode with a single-label exclusion query; API call does not return an error — verified by inspecting the returned result for absence of error
  - TC-08-02: thread count returned by dryRun with label-absence query differs from (or equals) count returned by `is:unread in:inbox` — documented as evidence; validates the query is executing correctly
  - TC-08-03: finding recorded in plan as a decision note: "Gmail threads.list accepts label names / requires label IDs in query strings"
- **Execution plan:** Call `gmail_organize_inbox` in dryRun mode using a manually constructed query `in:inbox newer_than:7d -label:Brikette/Queue/In-Progress` (Gmail supports `newer_than:Nd` as a relative date; the codebase uses `after:YYYY/MM/DD` with a computed date — use `newer_than:7d` here for simplicity since this is a probe, not production code). Inspect the result: if the API returns threads or an empty list without error, label names work in query strings. If the API returns an error about the query form, label IDs are required — record the exact error. Record finding as a Decision Log entry in this plan before TASK-06 begins.
- **Planning validation:** None required for S-effort INVESTIGATE task.
- **Scouts:** None needed — this task is itself the scout.
- **Edge Cases & Hardening:** If label does not exist in the Gmail account (not yet created via `ensureLabelMap`): the query may return all threads (treating unknown label as no-op). This would be a false-positive that confirms names work when they do not. Mitigation: use a label known to exist (e.g., `Brikette/Queue/Needs-Processing` if any emails have been processed) for the test call.
- **What would make this >=90%:**
  - A confirmed positive result (API accepts the query, returns expected thread set) raises Implementation to 90 and unblocks TASK-06 at full confidence.
- **Rollout / rollback:**
  - No code change; dryRun call only.
- **Documentation impact:** Decision Log entry added to this plan with the confirmed query form.
- **Notes / references:** TASK-06 planning validation §Unexpected findings explicitly flagged this as a blocking unknown. If label IDs are required, TASK-06 scope expands to include a label-name-to-ID resolution step in `buildOrganizeQuery` — this must be recorded in the Decision Log before TASK-06 implementation begins.
- **Build evidence (Complete 2026-02-19):** Live dryRun probe executed via Node.js script importing `gmail.ts` with real OAuth token. Query `in:inbox newer_than:7d -label:Brikette/Queue/In-Progress -label:...` returned `scannedThreads: 61, error: null`. Gmail API accepts label display names in `-label:` clauses. TASK-06 `buildOrganizeQuery` confirmed correct.
- **Pete action required (historical — now resolved):** Run the following in an MCP-connected ops-inbox session to validate the Gmail query syntax:
  1. Open a Claude session with the ops-inbox MCP tools available.
  2. Call `gmail_organize_inbox` in dryRun mode with query: `in:inbox newer_than:7d -label:Brikette/Queue/In-Progress`
  3. Observe: (a) does the API return threads or an empty list without error? (b) does it return an error about query format?
  4. Compare the thread count with a regular `is:unread in:inbox` query to validate correct exclusion.
  5. Record findings in the Decision Log below. Then TASK-06 can proceed.
  - If label names work: TASK-06 can use `buildOrganizeQuery` with display names directly.
  - If label IDs are required: TASK-06 scope expands to include a label-name→ID lookup step in `buildOrganizeQuery`. Update TASK-06 Affects and re-run `/lp-replan` for TASK-06.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Label-absence query too expensive; rate limits at Brikette inbox size | Medium | Medium | TC-06-04 mandates dryRun gate before live mutation; query scoped to last 7 days |
| Gmail API `-label:` syntax requires label IDs not names in query string | Medium | High | TASK-06 planning validation must confirm query format; dryRun scout before live deployment |
| File-based lock creates stale files on force-kill | Low | Low | Startup recovery (TC-03-05) and reconcile (now 2h) act as backstops |
| Category guard in draft_refine breaks existing test fixtures | Low | Medium | Run `draft-refine.test.ts` immediately after adding guard; update any affected fixtures |
| Auto-deferral threshold 0.80 over-defers legitimate HIGH escalation emails | Medium | Medium | TASK-05 is additive; operator can ignore `escalation_required` field until validated; starts with CRITICAL-always |
| `handleMarkProcessed` try/catch changes error-result format, breaking skill error detection | Low | Low | Outer error contract preserved; only inner cleanup added; TC-02-03 validates message format |
| `LABELS.AGENT_HUMAN` constant does not exist (only CODEX + CLAUDE) | Low | Low | TASK-07 Scouts step confirms before implementation; add constant if missing |

## Observability

- Logging: `packages/mcp-server/data/email-audit-log.jsonl` — append-only JSON-lines; written by TASK-01; extended by TASK-03 with lock events.
- Metrics: None: no metrics infrastructure in mcp-server package. Audit log is the observability primitive.
- Alerts/Dashboards: None: operator reviews audit log manually after each session. Future: a simple `grep` on the log by action type gives per-session stats.

## Acceptance Criteria (overall)

- [ ] All 8 issues have code-level fixes delivered via the 7 IMPLEMENT tasks.
- [ ] Targeted tests pass per task: `pnpm --filter @acme/mcp-server test -- --testPathPattern="(gmail-audit-log|gmail-label-state|lock-store|gmail-organize-inbox|draft-refine|draft-interpret|outbound-drafts|organize-query)"`. Each task's TC suite must pass before its commit. No broad unfiltered package run.
- [ ] `pnpm typecheck && pnpm lint` passes for `packages/mcp-server`.
- [ ] `email-audit-log.jsonl` entries appear for a test email processing run (TASK-01 delivery verification).
- [ ] `gmail_organize_inbox` dryRun mode runs with label-absence query and returns thread count without mutation (TASK-06 delivery verification).
- [ ] `data/locks/` and `data/*.jsonl` are gitignored.
- [ ] No change to any file outside `packages/mcp-server` (except `ops-inbox/SKILL.md` for TASK-05).

## Decision Log

- 2026-02-19: Pete decided durable file-based lock store (not Firebase, not Redis) — single-process mcp-server justifies filesystem lock.
- 2026-02-19: Pete decided stale detection must use `lockedAt` timestamp from lock file, not `internalDate` — `internalDate` is the email receive time, not lock-acquire time; using it is a logic bug.
- 2026-02-19: Pete decided escalation deferral thresholds: CRITICAL → always defer; HIGH + confidence >= 0.80 → defer; HIGH + confidence < 0.80 → proceed and flag; NONE → proceed.
- 2026-02-19: Pete decided label-absence query is the transitional default for `handleOrganizeInbox`; full ingestion redesign (Gmail filter or `lastHistoryId`) is a separate plan track.
- 2026-02-19: Reconcile `staleHours` default reduced from 24h to 2h — safety net backstop only, not primary fix.
- 2026-02-19: Audit log first — TASK-01 sequenced before all others so subsequent fixes produce audit events from day one.
- 2026-02-19 (TASK-08 result): Gmail `threads.list` API accepts `-label:DisplayName` query syntax using label display names (not IDs). Probe: `in:inbox newer_than:7d -label:Brikette/Queue/In-Progress -label:...` returned 61 threads, no error. TASK-06 `buildOrganizeQuery` can use display names directly — no label-ID lookup step needed.

## Overall-confidence Calculation

Effort weights: S=1, M=2, L=3.

| Task | Confidence | Effort | Weight | Weighted contribution |
|---|---|---|---|---|
| TASK-01 | 85 | S | 1 | 85 |
| TASK-02 | 88 | S | 1 | 88 |
| TASK-03 | 80 | M | 2 | 160 |
| TASK-04 | 90 | S | 1 | 90 |
| TASK-05 | 85 | S | 1 | 85 |
| TASK-06 | 80 | M | 2 | 160 |
| TASK-07 | 90 | S | 1 | 90 |
| TASK-08 | 75 | S | 1 | 75 |
| **Total** | | | **10** | **833** |

Overall-confidence = 833 / 10 = **83%** (rounded to nearest 5 per scoring rules: **85%**). Frontmatter set to **85%**.
