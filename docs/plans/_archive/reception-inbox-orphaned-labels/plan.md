---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-orphaned-labels
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Gmail Orphaned Label Cleanup Plan

## Summary

Add a `gmail_cleanup_labels` MCP tool that deletes orphaned Gmail labels from the `Brikette/*` namespace. Orphaned labels are those not in `REQUIRED_LABELS` or `LEGACY_LABELS`, not the bare `Brikette` parent, and with zero associated messages. The tool supports dry-run mode (default) and optional legacy label cleanup. As a prerequisite, fix `handleAuditLabels` to exclude the bare `Brikette` parent from the orphaned bucket so audit and cleanup share consistent classification semantics.

## Active tasks

- [x] TASK-01: Fix audit label parent classification and add regression test
- [x] TASK-02: Implement gmail_cleanup_labels tool with safety checks and tests

## Goals

- Fix the `Brikette` parent label misclassification in `gmail_audit_labels`
- Add a new `gmail_cleanup_labels` MCP tool that safely deletes orphaned labels
- Provide dry-run mode and optional legacy label cleanup
- Full test coverage following established mock patterns

## Non-goals

- Changing the label taxonomy or renaming labels
- Automated scheduling
- Modifying `apps/reception/src/lib/gmail-client.ts`

## Constraints & Assumptions

- Constraints:
  - Gmail API rate limits; one API call per label deletion
  - Labels with messages must never be deleted
  - `Brikette` parent label must never be deleted
  - Dry-run defaults to `true` per codebase convention
- Assumptions:
  - Orphaned labels accumulate from legacy migrations and one-off workflow states
  - On-demand invocation is sufficient (no cron needed)

## Inherited Outcome Contract

- **Why:** Accumulating orphaned labels clutter the Gmail label namespace and make it harder for operators to navigate the mailbox. Over time this degrades the usability of Gmail as the underlying mail client.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Orphaned Gmail labels (unused namespace entries not in the current or legacy taxonomy) can be cleaned up on demand via an MCP tool, keeping the label namespace manageable.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-inbox-orphaned-labels/fact-find.md`
- Key findings used:
  - `handleAuditLabels` classifies bare `Brikette` parent as orphaned (line 3414 filter includes `name === "Brikette"`)
  - `gmail_migrate_labels` uses `users.messages.list` with `labelIds` filter for message scanning (reusable pattern for zero-message check)
  - New cleanup tool does not need `ensureLabelMap` (no label creation); it only uses `labels.list`, `messages.list`, and `labels.delete`
  - Existing `buildLabelStub` mock pattern in `gmail-audit-labels.test.ts` covers `labels.list` and `labels.create`; needs `labels.delete` addition
  - Tool registration follows `gmailTools` array + `handleGmailTool` switch dispatch pattern

## Proposed Approach

- Option A: Add cleanup as a standalone tool with its own label classification logic
- Option B: Fix audit classification first, then build cleanup on top of corrected audit logic (reuse)
- Chosen approach: Option B. Fix `handleAuditLabels` to exclude bare `Brikette` parent, extract the classification logic into a shared helper (`classifyBriketteLabels`), then build `handleCleanupLabels` that uses the shared classifier with an additional message-count safety check and defense-in-depth parent guard before deletion.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix audit label parent classification and add regression test | 90% | S | Complete (2026-03-07) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Implement gmail_cleanup_labels tool with safety checks and tests | 85% | M | Complete (2026-03-07) | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Audit fix must land first so cleanup consumes correct classification |
| 2 | TASK-02 | TASK-01 | Cleanup tool + tests |

## Tasks

### TASK-01: Fix audit label parent classification and add regression test

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `packages/mcp-server/src/tools/gmail.ts` and `packages/mcp-server/src/__tests__/gmail-audit-labels.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/__tests__/gmail-audit-labels.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Build evidence:** Added `if (name === "Brikette") continue;` in classification loop. Extracted shared `classifyBriketteLabels()` helper. Added TC-A2b and TC-A2c regression tests. Typecheck and lint pass.
- **Confidence:** 90%
  - Implementation: 95% - One-line filter change in `handleAuditLabels` (line 3414) to exclude bare `Brikette` from orphaned bucket. Direct code path, no ambiguity.
  - Approach: 90% - Filtering out the parent at the audit level is the cleanest fix. Both audit and cleanup will share consistent semantics.
  - Impact: 90% - Prevents misclassification that would cause the cleanup tool to attempt deletion of the namespace parent.
- **Acceptance:**
  - `handleAuditLabels` excludes the bare `Brikette` label from the `orphaned` array by filtering it out during classification (not at the scan step -- `Brikette` remains in `briketteLabels` and counts toward `total_brikette`)
  - Concrete output shape: add `if (name === "Brikette") continue;` at the top of the classification loop (line 3423) so `Brikette` is neither known, legacy, nor orphaned. No new `namespace_parents` field -- the bare parent is simply excluded from all three buckets.
  - Existing 3 test cases in `gmail-audit-labels.test.ts` continue to pass
  - New regression test: when `Brikette` is present alongside required labels and one orphaned label, `orphaned` contains only the orphaned label (not `Brikette`), and `total_brikette` still counts `Brikette`
- **Validation contract (TC-XX):**
  - TC-01: Gmail has `Brikette` + all `REQUIRED_LABELS` -> `orphaned` is empty (bare `Brikette` skipped in classification loop), `known` has all required labels, `total_brikette` includes `Brikette`
  - TC-02: Gmail has `Brikette` + `REQUIRED_LABELS` + `Brikette/Unknown/Foo` -> `orphaned` contains only `Brikette/Unknown/Foo` (not `Brikette`), `total_brikette` counts all including `Brikette`
  - TC-03: Gmail has no `Brikette` labels -> all lists empty (existing TC-A3, unchanged)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add TC-01 and TC-02 tests that assert `Brikette` is not in orphaned. Tests fail against current code.
  - Green: Add `if (name === "Brikette") continue;` at the top of the classification loop in `handleAuditLabels` (line 3423). Tests pass.
  - Refactor: Verify `total_brikette` still counts `Brikette` (it does, since the count is computed from `briketteLabels` before classification).
- **Planning validation (required for M/L):** None: S-effort
- **Scouts:** None: direct code change with clear path
- **Edge Cases & Hardening:**
  - Edge: Gmail returns labels with empty or null names -> already handled by `.map((l) => l.name ?? "")` filter
  - Edge: `Brikette` label does not exist in Gmail -> no-op, no `Brikette` in scan results
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% after confirming existing test suite passes with the change.
- **Rollout / rollback:**
  - Rollout: MCP server restart picks up the change
  - Rollback: Revert the filter change; bare `Brikette` returns to orphaned bucket (harmless)
- **Documentation impact:** None
- **Notes / references:**
  - Current filter at `gmail.ts` line 3414: `(name) => name === "Brikette" || name.startsWith("Brikette/")`
  - The orphaned classification loop at lines 3423-3431 puts anything not in `requiredSet` or `legacyValues` into `orphaned`

### TASK-02: Implement gmail_cleanup_labels tool with safety checks and tests

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `packages/mcp-server/src/tools/gmail.ts` and new test file `packages/mcp-server/src/__tests__/gmail-cleanup-labels.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:** `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/__tests__/gmail-cleanup-labels.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Build evidence:** Added `gmail_cleanup_labels` tool definition, `cleanupLabelsSchema` Zod schema, `handleCleanupLabels` handler with message-count safety check and defense-in-depth parent guard, dispatch case in `handleGmailTool`. Created `gmail-cleanup-labels.test.ts` with 8 test cases (TC-01 through TC-08). Typecheck and lint pass.
- **Confidence:** 85%
  - Implementation: 85% - Handler logic is clear: list labels, classify using REQUIRED/LEGACY sets, check message count per orphaned label via `users.messages.list`, delete empty ones via `users.labels.delete`. Held-back test at 85: no single unknown drops below 80 -- `labels.delete` API is standard and the mock pattern is established.
  - Approach: 85% - Follows `handleMigrateLabels` pattern (iterate labels, check messages, act). Dry-run convention matches existing tools.
  - Impact: 85% - Directly addresses the operator-reported usability issue. Impact is moderate since label clutter is a slow-burn problem.
- **Acceptance:**
  - New `gmail_cleanup_labels` tool registered in `gmailTools` array
  - Tool accepts `dryRun` (boolean, default true), `includeLegacy` (boolean, default false) parameters
  - Case dispatched in `handleGmailTool` switch
  - `handleCleanupLabels` function:
    - Lists all Gmail labels, filters to `Brikette/*` namespace
    - Classifies into known/legacy/orphaned (reuses audit logic, excludes bare `Brikette`)
    - For each orphaned label (and legacy if `includeLegacy`): checks message count via `users.messages.list` with `labelIds` filter
    - Deletes only labels with zero messages via `users.labels.delete`
    - Returns structured result: `{ success, dryRun, includeLegacy, deleted: [...], skipped: [...], errors: [...] }`
  - Dry-run mode returns same structure with `deleted` showing what would be deleted
  - Labels with messages are never deleted
  - Error on individual label deletion does not abort the batch
  - Unit tests pass in CI
- **Validation contract (TC-XX):**
  - TC-01: Dry-run with orphaned labels present -> `deleted` lists orphaned labels, no `labels.delete` called
  - TC-02: Live run with orphaned labels (zero messages) -> `labels.delete` called for each, `deleted` populated
  - TC-03: Orphaned label has messages -> skipped, not deleted, appears in `skipped` list with reason
  - TC-04: No orphaned labels present -> `deleted` and `skipped` empty, success true
  - TC-05: `includeLegacy: true` with empty legacy labels -> legacy labels included in deletion
  - TC-06: `includeLegacy: true` with legacy labels that have messages -> legacy labels skipped
  - TC-07: `labels.delete` throws for one label -> error recorded in `errors`, other labels still processed
  - TC-08: Bare `Brikette` parent is never in deletion candidates (defense-in-depth guard in cleanup handler, independent of TASK-01 audit fix)

- **Execution plan:** Red -> Green -> Refactor
  - Red: Create `gmail-cleanup-labels.test.ts` with TC-01 through TC-08. Tests fail (tool does not exist).
  - Green:
    1. Add `gmail_cleanup_labels` tool definition to `gmailTools` array with `dryRun` and `includeLegacy` input schema
    2. Add Zod schema `cleanupLabelsSchema` (dryRun: boolean default true, includeLegacy: boolean default false)
    3. Implement `handleCleanupLabels(gmail, args)`:
       - Parse args with `cleanupLabelsSchema`
       - Call `gmail.users.labels.list({ userId: "me" })` to get all labels
       - Build label ID map (`name -> id`) for Brikette/* labels
       - Classify into known/legacy/orphaned using `REQUIRED_LABELS` and `LEGACY_LABELS` sets, excluding bare `Brikette` (skip in classification loop, same as TASK-01 audit fix)
       - **Safety guard (defense-in-depth):** Before building candidates, explicitly filter out any label where `name === "Brikette"` from candidates. This guard is redundant with the classification fix but protects the delete path independently.
       - Build candidates list: orphaned always; legacy only if `includeLegacy`
       - For each candidate: call `gmail.users.messages.list({ userId: "me", labelIds: [labelId], maxResults: 1 })` to check message count
       - If zero messages and not `dryRun`: call `gmail.users.labels.delete({ userId: "me", id: labelId })`
       - Collect results into `deleted`/`skipped`/`errors` arrays
       - Return `jsonResult({ success, dryRun, includeLegacy, deleted, skipped, errors })`
    4. Add `case "gmail_cleanup_labels"` to `handleGmailTool` switch
    5. Tests pass.
  - Refactor: Extract the shared classification logic (filter to `Brikette/*`, classify using `REQUIRED_LABELS`/`LEGACY_LABELS` sets, skip bare `Brikette`) into a helper function `classifyBriketteLabels(labels)` used by both `handleAuditLabels` and `handleCleanupLabels`. This prevents semantic drift between the two tools.

- **Planning validation (required for M/L):**
  - Checks run:
    - Verified `gmail.users.labels.delete` is available on `gmail_v1.Gmail` type (Google APIs Node.js client)
    - Verified `gmail.users.messages.list` with `labelIds` filter is already used in `handleMigrateLabels` (gmail.ts line 3150)
    - Verified `buildLabelStub` mock pattern in `gmail-audit-labels.test.ts` provides `labels.list`, `labels.create`, `messages.list` mocks
  - Validation artifacts: `gmail.ts` lines 3109-3207 (migrate_labels reference), `gmail-audit-labels.test.ts` lines 42-64 (mock pattern)
  - Unexpected findings: None

- **Consumer tracing (M-effort code task):**
  - New outputs: `gmail_cleanup_labels` tool returns `{ success, dryRun, includeLegacy, deleted, skipped, errors }`. Consumers: MCP tool callers (agents, operator via Claude). No code within the repo consumes this output programmatically -- it is a terminal tool response.
  - Modified behavior: `handleAuditLabels` classification loop gains a `continue` for bare `Brikette` (from TASK-01). Output shape is unchanged (still `{ known, legacy, orphaned, total_brikette }`); the only difference is that `Brikette` no longer appears in the `orphaned` array. Consumers: `gmail_audit_labels` MCP tool callers. No internal code consumes this output -- it is a terminal tool response. Consumer unchanged because: no automated pipeline reads `gmail_audit_labels` output; it is invoked manually.

- **Scouts:** None: implementation path is clear from existing patterns
- **Edge Cases & Hardening:**
  - Edge: Gmail API returns paginated label list -> `labels.list` returns all labels in one call (Gmail API does not paginate labels)
  - Edge: Label deletion fails due to permissions -> catch error, add to `errors` array, continue batch
  - Edge: Race condition during deletion -> orphaned labels are outside current taxonomy; `ensureLabelMap` auto-recreates if needed
  - Edge: `includeLegacy` with no legacy labels in Gmail -> no-op for legacy portion
- **What would make this >=90%:**
  - Confirming `users.labels.delete` mock works in the test stub pattern (high confidence it will, given `labels.create` mock already works). Would reach 90% after tests written and passing.
- **Rollout / rollback:**
  - Rollout: MCP server restart picks up the new tool
  - Rollback: Remove tool definition and handler; labels already deleted are not restored (but can be recreated by `ensureLabelMap` if they are in `REQUIRED_LABELS`)
- **Documentation impact:** None
- **Notes / references:**
  - Gmail API `users.labels.delete`: `DELETE https://gmail.googleapis.com/gmail/v1/users/{userId}/labels/{id}`
  - Follow `handleMigrateLabels` as the primary implementation pattern (iterate, check, act, collect results)

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Accidentally deleting label with messages | Very Low | High | Message-count check (TC-03); dry-run default |
| Deleting bare `Brikette` parent | Very Low | Medium | Three layers: TASK-01 audit fix excludes from classification; TASK-02 defense-in-depth guard in cleanup handler; TC-08 regression test |
| Gmail API rate limiting | Low | Low | Label count is small (dozens); one delete call per label |
| Race condition: label deleted while being applied | Very Low | Low | Orphaned labels are outside current taxonomy; `ensureLabelMap` auto-recreates |

## Observability

- Logging: Structured `jsonResult` return showing deleted/skipped/errors
- Metrics: None needed (on-demand tool, not a recurring job)
- Alerts/Dashboards: None needed

## Acceptance Criteria (overall)

- [ ] `gmail_audit_labels` no longer classifies bare `Brikette` as orphaned
- [ ] `gmail_cleanup_labels` MCP tool is callable and returns structured results
- [ ] Dry-run mode correctly previews without deleting
- [ ] Labels with messages are never deleted
- [ ] `includeLegacy` flag works as expected
- [ ] All unit tests pass in CI

## Decision Log

- 2026-03-07: Decided to fix audit classification at the source (`handleAuditLabels`) rather than post-filtering in cleanup tool. Rationale: consistent semantics across both tools, and audit output becomes accurate for operator use regardless of cleanup.
- 2026-03-07: Decided to place handler in `gmail.ts` monolith alongside `handleAuditLabels` and `handleMigrateLabels` rather than creating a new modular file. Rationale: these three functions are closely related and share classification constants.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix audit parent classification | Yes | None | No |
| TASK-02: Implement cleanup tool | Yes | None -- depends on TASK-01 for corrected classification; `labels.delete` API confirmed available; mock pattern confirmed extensible | No |

## Overall-confidence Calculation

- TASK-01: 90% * S(1) = 90
- TASK-02: 85% * M(2) = 170
- Overall = (90 + 170) / (1 + 2) = 86.7% -> 85% (rounded to nearest 5, downward bias)
