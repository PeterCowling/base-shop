---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: gmail-guard-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/gmail-guard-hardening/plan.md
---

# Gmail Guard Hardening Fact-Find Brief

## Scope

### Summary
Three structural gaps in the Brikette email pipeline allow emails to silently disappear from the active queue (stuck In-Progress label), produce duplicate draft responses (no thread-level dedup on `gmail_create_draft`), and let the Gmail label hierarchy accumulate orphaned labels indefinitely (no cleanup path). All three gaps are in `packages/mcp-server/src/tools/gmail*`.

### Goals
- Add a thread-level duplicate check to `gmail_create_draft` so a second draft is never created for the same thread
- Wire `gmail_reconcile_in_progress` into the ops-inbox preflight so stuck In-Progress emails are automatically recovered at session start
- Add a `gmail_audit_labels` tool that detects orphaned `Brikette/*` labels and flags them for review

### Non-goals
- Changing the Gmail label hierarchy schema (REQUIRED_LABELS is the authoritative set)
- Auto-deleting orphaned labels without operator review
- Addressing booking reservation draft dedup (already handled by `checkBookingRefDuplicate` in `gmail-booking.ts`)

### Constraints & Assumptions
- Constraints:
  - Tests run in CI only per `docs/testing-policy.md` — no local Jest runs
  - `handleDraftGenerateTool` has a 300-line max-lines-per-function lint rule — not directly relevant here but sets the pattern for keeping handler functions compact
  - All Gmail API calls are through the authenticated client returned by `getGmailClient()` — no direct Gmail SDK imports in tools
- Assumptions:
  - Gmail `drafts.list` with `q: "in:drafts thread:<threadId>"` is sufficient to detect existing drafts per thread (established pattern in `checkBookingRefDuplicate`)
  - The ops-inbox SKILL.md change (GAP-2) requires no MCP server code change — only the skill doc
  - Orphaned label cleanup should be flag-only by default (`autoDelete: false`) to avoid accidental label deletion

## Outcome Contract

- **Why:** Session crashes in ops-inbox leave emails stuck with `Brikette/Queue/In-Progress` — permanently invisible to `gmail_organize_inbox` because that label is in `TERMINAL_LABELS`. A crash after draft creation but before `gmail_mark_processed` can also produce a second draft on the next session. The Gmail label hierarchy has no cleanup path, so renamed labels from past migrations accumulate alongside current ones.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `gmail_create_draft` skips creation and warns if a draft already exists in the same thread; stale In-Progress emails are automatically re-routed at the start of every ops-inbox session; a `gmail_audit_labels` tool reports orphaned `Brikette/*` labels not in `REQUIRED_LABELS`, callable from ops-inbox session summary.
- **Source:** operator

## Access Declarations

None — all evidence is in-repo code. No external API access required for fact-find.

## Evidence Audit (Current State)

### Entry Points

- `packages/mcp-server/src/tools/gmail.ts:2603` — `handleCreateDraft()`: fetches original message metadata, calls `drafts.create` unconditionally. `threadId` is available at `original.data.threadId` immediately before the `drafts.create` call.
- `packages/mcp-server/src/tools/gmail-reconciliation.ts:41` — `handleReconcileInProgress()`: full implementation, 225 lines, registered at `gmail.ts:3408`. Not called anywhere except on explicit `gmail_reconcile_in_progress` tool invocation.
- `packages/mcp-server/src/tools/gmail-shared.ts:533` — `ensureLabelMap()`: creates missing labels on demand, no deletion path. Called by every tool on startup.
- `.claude/skills/ops-inbox/SKILL.md:26` — Step 0 Mandatory MCP Preflight: calls `health_check` only. No reconcile call.

### Key Modules / Files

- `packages/mcp-server/src/tools/gmail.ts` — tool router, `handleCreateDraft` (2603–2676), `TERMINAL_LABELS` (116–127), `REQUIRED_LABELS` re-export (131)
- `packages/mcp-server/src/tools/gmail-shared.ts` — `LABELS` (24–49), `LEGACY_LABELS` (51–61), `REQUIRED_LABELS` (93–118, 23 labels), `ensureLabelMap` (533–569)
- `packages/mcp-server/src/tools/gmail-booking.ts` — `checkBookingRefDuplicate()`: queries `drafts.list` by booking ref — canonical pattern for the GAP-1 fix
- `packages/mcp-server/src/tools/gmail-reconciliation.ts` — `handleReconcileInProgress()`: staleHours=2h default, reroutes stuck emails; `dryRun: true` by default
- `packages/mcp-server/src/__tests__/gmail-create-draft.test.ts` — TC-03 to TC-09; no duplicate-prevention test
- `packages/mcp-server/src/__tests__/gmail-booking-dedup.test.ts` — TC-01 to TC-04; dedup pattern tests for booking path

### Patterns & Conventions Observed

- **Draft dedup pattern** (booking path): `drafts.list({ userId: "me", q: "in:drafts <reservationCode>" })` → `isDuplicate = drafts.length > 0` → skip + audit log entry `"booking-dedup-skipped"` — evidence: `gmail-booking.ts` + `gmail-booking-dedup.test.ts`
- **Audit log** (`appendAuditEntry`): all dedup/lock events written to `data/email-audit-log.jsonl` — available for GAP-1 to log `"inquiry-draft-dedup-skipped"` entries following the same pattern
- **TERMINAL_LABELS exclusion**: `gmail_organize_inbox` excludes emails bearing any terminal label from re-scan — `PROCESSING` is in this set, so stuck In-Progress emails are invisible until explicitly reconciled
- **LEGACY_LABELS migration map**: `LEGACY_TO_CURRENT_LABEL_MAP` in `gmail-shared.ts:63-73` — 9 old label names mapped to current equivalents; these old labels remain in Gmail account as orphans after migration

### Data & Contracts

- Types/schemas/events:
  - `AuditEntry.action`: `"lock-acquired" | "lock-released" | "outcome" | "booking-dedup-skipped"` — GAP-1 fix adds `"inquiry-draft-dedup-skipped"` to this union
  - `reconcileInProgressSchema`: `{ dryRun: boolean=true, staleHours: number=2, limit: number=100, actor: enum }` — already validated
  - `REQUIRED_LABELS`: 23 labels across Queue (4), Drafts (2), Outcome (5), Workflow (7), Agent (3), Outbound (2)
  - `LEGACY_LABELS`: 9 label names — all mapped in `LEGACY_TO_CURRENT_LABEL_MAP`; will appear as orphans in a label audit
- Persistence:
  - `data/email-audit-log.jsonl` — append-only JSON-lines audit log; path overridable via `AUDIT_LOG_PATH` env var for tests

### Dependency & Impact Map

- Upstream dependencies:
  - `getGmailClient()` — all three gaps use it; authentication is pre-configured
  - `ensureLabelMap()` — called at start of every tool; used by GAP-3 new tool
- Downstream dependents:
  - ops-inbox SKILL.md steps 1–7 depend on GAP-2 change being transparent (reconcile runs silently, only surfacing a count if emails were recovered)
  - GAP-3 `gmail_audit_labels` output should appear in ops-inbox session summary (Step 7) — no other dependents
- Likely blast radius:
  - GAP-1: `handleCreateDraft` only; test impact limited to `gmail-create-draft.test.ts` (add TC-10)
  - GAP-2: `ops-inbox/SKILL.md` Step 0 only; no MCP server code change
  - GAP-3: new tool registration in `gmail.ts` tool router + new handler function + new test file

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (`@jest-environment node`), mock-heavy (no real Gmail API in tests)
- Commands: governed entrypoint per `docs/testing-policy.md` — CI only
- CI integration: runs on push; lint + typecheck run locally before commit

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `gmail_create_draft` | Unit | `gmail-create-draft.test.ts` (TC-03–TC-09) | Happy path, error, label failure — no dedup test |
| Booking dedup | Unit + Integration | `gmail-booking-dedup.test.ts` (TC-01–TC-04) | Full dedup pattern including audit log assertion |
| Reconciliation | Unit | `gmail-reconciliation.ts` inline (via `handleGmailTool`) | Covered via `gmail.ts` router; no dedicated reconcile test file found |
| Label state | Unit | `gmail-label-state.test.ts` | Label transitions; not covering orphan detection |

#### Coverage Gaps
- Untested paths:
  - `gmail_create_draft` called twice on same thread — no test for dedup skip behaviour (GAP-1)
  - `gmail_reconcile_in_progress` called at ops-inbox startup — no integration test for auto-recovery flow (GAP-2 is SKILL.md only, but reconcile coverage could be strengthened)
  - Orphaned label detection — no test (GAP-3 new tool)

#### Recommended Test Approach
- Unit tests for: TC-10 in `gmail-create-draft.test.ts` — same thread, second call → no draft created, `already_exists: true` in result; TC-11 — `drafts.list` throws → fail-open, draft created anyway
- Unit tests for: `gmail-audit-labels.test.ts` (new file) — Brikette/* labels not in REQUIRED_LABELS flagged as orphaned; known legacy labels in LEGACY_LABELS also surfaced with migration hint
- Integration tests for: GAP-2 (SKILL.md change) is not code-testable; covered by manual ops-inbox session verification

## Questions

### Resolved

- Q: Should the GAP-1 dedup check use `threadId` or `emailId` as the lookup key?
  - A: `threadId`. The goal is to prevent duplicate drafts in the same Gmail thread, regardless of which specific message in the thread triggered the draft. `threadId` is available at `original.data.threadId` before `drafts.create`. Query: `drafts.list({ userId: "me", q: "in:drafts thread:<threadId>" })`.
  - Evidence: `checkBookingRefDuplicate` pattern in `gmail-booking.ts`; `handleCreateDraft` already has `original.data.threadId` in scope.

- Q: Should GAP-1 be fail-open or fail-closed if the `drafts.list` API call throws?
  - A: Fail-open — proceed with draft creation. Blocking draft creation on an API error would be worse than a duplicate. Same policy as `checkBookingRefDuplicate` (returns `isDuplicate: false` on error).
  - Evidence: `gmail-booking.ts:checkBookingRefDuplicate` lines matching the API-throws test case in `gmail-booking-dedup.test.ts` TC-03.

- Q: Should `gmail_reconcile_in_progress` run with `dryRun: false` or `dryRun: true` at ops-inbox startup?
  - A: `dryRun: false`. The purpose of auto-running it is to actually recover stuck emails, not just report them. The existing `staleHours: 2` default provides a safe buffer — only emails stuck for more than 2 hours are touched.
  - Evidence: `reconcileInProgressSchema` default `dryRun: true` is for manual/exploratory runs; the auto-preflight path should be actionable.

- Q: Should GAP-3 auto-delete orphaned labels or flag-only?
  - A: Flag-only by default (`autoDelete: false`). Deleting Gmail labels is irreversible and can remove labels from existing emails silently. The tool should report orphans and let the operator decide. An `autoDelete: true` option can be added for future use once the operator is comfortable with the output.
  - Evidence: `LEGACY_LABELS` — 9 old label names that operators may still have on historical emails; deleting them would strip labels from archived threads.

- Q: Where should `gmail_audit_labels` output surface?
  - A: Wired into ops-inbox session summary (Step 7) — report orphaned count and list. No blocking gate needed; this is hygiene information only.
  - Evidence: ops-inbox SKILL.md Step 7 already calls `draft_signal_stats` and `draft_template_review` for session stats — same pattern.

### Open (Operator Input Required)

None.

## Confidence Inputs

- Implementation: 90% — all three fixes have clear entry points and established patterns to follow; GAP-3 requires a new tool but the boilerplate is standard
- Approach: 88% — GAP-1 and GAP-2 approaches are unambiguous; GAP-3 flag-only approach is conservative and safe
- Impact: 85% — eliminates the known failure modes; residual risk is `drafts.list` query latency on every `gmail_create_draft` call (expected <100ms, acceptable)
- Delivery-Readiness: 88%
- Testability: 85% — GAP-1 and GAP-3 are fully unit-testable following existing patterns; GAP-2 is a SKILL.md-only change, testable only via manual session verification

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `drafts.list` query adds latency to every `gmail_create_draft` call | Low | Low | Query is indexed by threadId; expected <100ms; fail-open so it never blocks |
| Auto-reconcile at startup recovers an email the operator intentionally left In-Progress | Low | Medium | staleHours=2 buffer means emails processed in the last 2h are untouched; operator can increase staleHours if needed |
| `gmail_audit_labels` flags LEGACY_LABELS as orphaned, confusing operator | Medium | Low | Report should include a note distinguishing legacy labels (known migration artifacts) from truly unknown orphans |
| New `AuditEntry.action` value `"inquiry-draft-dedup-skipped"` not handled by existing audit log readers | Low | Low | Audit log readers use `find()` by specific action string; unknown actions are silently skipped |

## Planning Constraints & Notes

- Must-follow patterns:
  - Fail-open on API errors (never block a primary action due to a guard query failure)
  - Audit log entry for every dedup skip — same pattern as `"booking-dedup-skipped"`
  - New tool must be registered in the `handleGmailTool` switch in `gmail.ts`
  - Handler functions must stay within the 300-line `max-lines-per-function` lint rule — keep handlers thin, extract helpers
- Rollout/rollback expectations:
  - All three changes are backwards-compatible and independently deployable
  - GAP-2 (SKILL.md) is immediately effective with no code deploy
- Observability expectations:
  - GAP-1: `"inquiry-draft-dedup-skipped"` audit log entries + `already_exists: true` in tool response
  - GAP-2: reconcile recovery count surfaced in preflight output per session
  - GAP-3: orphaned label list in session summary

## Suggested Task Seeds (Non-binding)

- TASK-01: Add thread-level dedup to `gmail_create_draft` + TC-10/TC-11 tests (S effort, code)
- TASK-02: Wire `gmail_reconcile_in_progress` into ops-inbox Step 0 preflight (S effort, doc/code)
- TASK-03: Implement `gmail_audit_labels` tool + tests + wire into ops-inbox session summary (M effort, code)

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| GAP-1: `handleCreateDraft` dedup insertion point | Yes | None | No |
| GAP-1: `drafts.list` query pattern (from booking path) | Yes | None | No |
| GAP-1: fail-open on API error | Yes | None | No |
| GAP-2: `handleReconcileInProgress` registration and wiring | Yes | None | No |
| GAP-2: ops-inbox SKILL.md Step 0 change scope | Yes | None | No |
| GAP-3: `ensureLabelMap` create-only behaviour | Yes | None | No |
| GAP-3: LEGACY_LABELS orphan surfacing | Yes | [Minor] Legacy labels should be distinguished from unknown orphans in output | No |
| Test coverage for new TC-10/TC-11 | Yes | None | No |
| Test coverage for `gmail_audit_labels` | Yes | None | No |

## Scope Signal

Signal: right-sized

Rationale: Three independently scoped fixes, all in `packages/mcp-server/src/tools/gmail*`. Each has a clear entry point, established test pattern, and bounded blast radius. No cross-package dependencies. Combined effort is S+S+M = low total build cost.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - TC-10 (dedup skip) and TC-11 (fail-open) pass in CI
  - `gmail-audit-labels.test.ts` passes in CI
  - ops-inbox SKILL.md Step 0 includes reconcile call with preflight output
  - TypeScript typecheck and ESLint pass on all modified files
- Post-delivery measurement plan:
  - Monitor `data/email-audit-log.jsonl` for `"inquiry-draft-dedup-skipped"` entries in production to confirm the guard is firing
  - Check ops-inbox session summaries for reconcile recovery counts over first 2 weeks

## Evidence Gap Review

### Gaps Addressed

- Entry point for GAP-1 dedup: confirmed `original.data.threadId` is in scope at the exact insertion point (`gmail.ts:2638`)
- Dedup query pattern: confirmed from `checkBookingRefDuplicate` — directly reusable
- Reconcile wiring: confirmed tool is fully implemented and registered; only SKILL.md change needed
- Label audit scope: confirmed `REQUIRED_LABELS` (23) and `LEGACY_LABELS` (9) are the complete reference sets

### Confidence Adjustments

- No downward adjustments. All three gaps are fully evidenced with concrete file paths and line numbers.

### Remaining Assumptions

- Gmail `drafts.list` query `in:drafts thread:<threadId>` returns results within acceptable latency for a preflight check. No measured baseline but this is a standard Gmail API search query.
- Operators will review `gmail_audit_labels` output in session summary — no enforcement mechanism.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan gmail-guard-hardening --auto`
