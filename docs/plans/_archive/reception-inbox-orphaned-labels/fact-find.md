---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-orphaned-labels
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-orphaned-labels/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307142547-9103
Trigger-Why:
Trigger-Intended-Outcome:
---

# Gmail Orphaned Label Cleanup Fact-Find Brief

## Scope

### Summary

The BRIK Gmail pipeline uses a structured label hierarchy (`Brikette/*`) to track email processing state (queue position, draft status, outcome, workflow stage, agent attribution, outbound type). Labels are created on demand by `ensureLabelMap` and applied/removed during message lifecycle transitions. However, there is no mechanism to periodically identify and remove labels that are no longer associated with any messages -- so-called "orphaned" labels. Over time, unused labels from legacy taxonomy migrations or one-off workflow states accumulate in the Gmail label namespace, cluttering operator navigation.

An existing `gmail_audit_labels` MCP tool already classifies Brikette labels into known, legacy, and orphaned buckets. The gap is that audit is read-only; there is no cleanup action that removes orphaned labels or deletes empty legacy labels after migration.

### Goals

- Implement a cleanup mechanism that can delete Gmail labels classified as orphaned (not in `REQUIRED_LABELS` and not in `LEGACY_LABELS`)
- Provide a dry-run mode so the operator can preview which labels would be deleted before executing
- Optionally allow cleanup of legacy labels that have zero associated messages (post-migration empties)
- Expose this as an MCP tool callable by agents and operator

### Non-goals

- Changing the label taxonomy or renaming existing labels (that is `gmail_migrate_labels`)
- Removing labels that still have messages associated with them
- Automated scheduling (periodic cron) -- the tool is invoked on demand
- Modifying the `apps/reception` Gmail client (`gmail-client.ts`), which is a low-level API wrapper with no label management

### Constraints & Assumptions

- Constraints:
  - Gmail API rate limits apply; label deletion is one API call per label
  - Labels with associated messages must not be deleted (safety invariant)
  - The `Brikette` parent label itself must never be deleted
- Assumptions:
  - Orphaned labels are those under `Brikette/*` (excluding the bare `Brikette` parent) that are not in `REQUIRED_LABELS` and not in `LEGACY_LABELS` and have zero messages
  - The existing `gmail_audit_labels` classification logic is partially reusable -- it correctly partitions labels into known/legacy/orphaned, but it includes the bare `Brikette` parent label in the orphaned bucket (since `Brikette` is not in `REQUIRED_LABELS` or `LEGACY_LABELS`). The fix should be applied at the audit level: `handleAuditLabels` should exclude the bare `Brikette` parent from the orphaned list (moving it to a separate `namespace_parents` bucket or simply filtering it out). This way both the audit tool and the cleanup tool have consistent semantics. The cleanup tool then consumes audit output directly without post-filtering.
  - The operator will invoke cleanup manually via MCP tool, not on an automated schedule

## Outcome Contract

- **Why:** Accumulating orphaned labels clutter the Gmail label namespace and make it harder for operators to navigate the mailbox. Over time this degrades the usability of Gmail as the underlying mail client.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Orphaned Gmail labels (unused namespace entries not in the current or legacy taxonomy) can be cleaned up on demand via an MCP tool, keeping the label namespace manageable.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `packages/mcp-server/src/tools/gmail.ts` (line 3448, `handleGmailTool`) -- central tool dispatcher; all gmail MCP tools route through here
- `packages/mcp-server/src/tools/gmail.ts` (line 3407, `handleAuditLabels`) -- existing audit function that classifies labels into known/legacy/orphaned
- `packages/mcp-server/src/tools/index.ts` (line 172) -- routes `gmail_*` tool names to `handleGmailTool`

### Key Modules / Files

1. `packages/mcp-server/src/tools/gmail.ts` (3533 lines) -- monolith containing tool definitions, LABELS/LEGACY_LABELS constants, `ensureLabelMap`, `handleAuditLabels`, `handleMigrateLabels`, and the main `handleGmailTool` dispatcher
2. `packages/mcp-server/src/tools/gmail-shared.ts` (849 lines) -- canonical shared utilities including a second `ensureLabelMap` implementation, `collectLabelIds`, `actorToLabelName`, `cleanupInProgress`
3. `packages/mcp-server/src/tools/gmail-handlers.ts` (785 lines) -- refactored handlers for list_pending, list_query, get_email, create_draft, mark_processed, telemetry_daily_rollup, migrate_labels
4. `packages/mcp-server/src/tools/gmail-reconciliation.ts` (225 lines) -- `handleReconcileInProgress` for stale In-Progress recovery
5. `packages/mcp-server/src/tools/gmail-organize.ts` (455 lines) -- `handleOrganizeInbox` for inbox scanning/classification
6. `packages/mcp-server/src/__tests__/gmail-audit-labels.test.ts` (134 lines) -- test coverage for `gmail_audit_labels` (3 test cases)
7. `apps/reception/src/lib/gmail-client.ts` (604 lines) -- low-level Gmail API wrapper used by the reception app; has NO label management functions

### Patterns & Conventions Observed

- **Dual implementation pattern**: `ensureLabelMap` exists in both `gmail.ts` (line 947) and `gmail-shared.ts` (line 543) with identical logic. The monolith (`gmail.ts`) still handles `gmail_audit_labels` and `gmail_migrate_labels` directly; the refactored modules import from `gmail-shared.ts`. Evidence: `gmail-handlers.ts` line 29 imports from `gmail-shared.ts`; `gmail.ts` line 3509 calls its local `handleAuditLabels`.
- **Dry-run convention**: `gmail_migrate_labels` and `gmail_reconcile_in_progress` both accept a `dryRun` boolean parameter defaulting to `true`. Evidence: `gmail.ts` line 738, `gmail-reconciliation.ts` line 31.
- **Label classification pattern**: `handleAuditLabels` lists all labels, filters to `Brikette/*` namespace (including the bare `Brikette` parent at line 3414), then classifies into three buckets using set membership checks against `REQUIRED_LABELS` and `LEGACY_LABELS`. The bare `Brikette` parent falls into the orphaned bucket since it is in neither set -- this is a known edge case that the cleanup tool must handle by excluding it explicitly. Evidence: `gmail.ts` lines 3407-3442.
- **Tool registration pattern**: Tools are defined as objects in a `gmailTools` array with `name`, `description`, and `inputSchema` properties. Evidence: `gmail.ts` lines 780-786.

### Data & Contracts

- Types/schemas/events:
  - `LABELS` constant: 24 label names under `Brikette/Queue/*`, `Brikette/Drafts/*`, `Brikette/Outcome/*`, `Brikette/Workflow/*`, `Brikette/Agent/*`, `Brikette/Outbound/*` (gmail.ts lines 51-76)
  - `LEGACY_LABELS` constant: 9 label names under old `Brikette/Inbox/*`, `Brikette/Processed/*` taxonomy (gmail.ts lines 78-88)
  - `REQUIRED_LABELS` array: all 24 current labels (gmail.ts lines 131-156)
  - Gmail API `users.labels.list` returns `{ labels: Array<{ id, name, type, ... }> }`
  - Gmail API `users.labels.delete` takes `{ userId, id }` -- this is the API call needed for cleanup
  - Gmail API `users.messages.list` with `labelIds` filter -- needed to check if a label has zero messages
- Persistence:
  - Labels exist only in Gmail (no local DB or cache beyond in-memory `labelMap`)
  - Audit log at `packages/mcp-server/data/email-audit-log.jsonl` (append-only)
- API/contracts:
  - MCP tool interface: `{ name: string, inputSchema: object }` registration + `handleGmailTool(name, args)` dispatch

### Dependency & Impact Map

- Upstream dependencies:
  - Gmail API (OAuth2 credentials via `getGmailClient`)
  - `REQUIRED_LABELS` and `LEGACY_LABELS` constants for classification
- Downstream dependents:
  - No downstream code depends on orphaned labels existing; they are by definition unused
  - `gmail_audit_labels` will report fewer orphaned labels after cleanup (expected, positive)
- Likely blast radius:
  - Very low. Deleting a label that has zero messages has no effect on any message state. The only risk is accidentally classifying an in-use label as orphaned, which is mitigated by the message-count check and dry-run mode.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest
- Commands: `pnpm -w run test:governed -- jest -- --config=packages/mcp-server/jest.config.cjs --testPathPattern=gmail`
- CI integration: Tests run in CI only (per testing policy)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| gmail_audit_labels | Unit | `gmail-audit-labels.test.ts` | 3 cases: all-required, mixed known/legacy/orphaned, no Brikette labels |
| ensureLabelMap | Unit | `gmail-ensure-label.test.ts` | 2 cases: stderr warning on create failure (local + canonical) |
| gmail_migrate_labels | Unit | `gmail-label-state.test.ts` | Migration of legacy labels to current taxonomy |
| gmail_mark_processed | Unit | `gmail-mark-processed.test.ts` | Label transitions on processing outcomes |
| gmail_organize_inbox | Unit | `gmail-organize-inbox.test.ts` | Classification and labeling of inbox emails |
| gmail_reconcile_in_progress | Unit | `gmail-reconciliation.test.ts` | Stale in-progress recovery routing |

#### Coverage Gaps

- No tests for label deletion (Gmail `users.labels.delete` is never called anywhere in the codebase)
- No tests verifying message count before label deletion (safety check)
- `handleAuditLabels` does not check message counts, so the classification of "orphaned" is purely name-based, not usage-based

#### Testability Assessment

- Easy to test: The Gmail client is already well-mocked in existing tests using a stub pattern (`buildLabelStub`). Adding `labels.delete` to the mock is trivial.
- Hard to test: Real Gmail API interaction (but this is covered by the existing mock pattern, no e2e needed).
- Test seams needed: Mock for `gmail.users.labels.delete` and `gmail.users.messages.list` (with labelIds filter for count check). Both already have mock patterns in existing tests.

#### Recommended Test Approach

- Unit tests for:
  - Cleanup with orphaned labels present (dry-run and live modes)
  - Cleanup skips labels with associated messages (safety check)
  - Cleanup skips the `Brikette` parent label
  - Cleanup with no orphaned labels (no-op)
  - Cleanup of empty legacy labels (optional feature)
  - Error handling when labels.delete fails
  - Bare `Brikette` parent label excluded from orphaned classification in `handleAuditLabels` (audit-side fix, regression test)
- Integration tests for: Not needed -- Gmail API is external
- E2E tests for: Not needed
- Contract tests for: Not needed

### Recent Git History (Targeted)

- `c26c2e867e` feat(email-observability): close three logging gaps in Gmail pipeline -- recent, adds telemetry
- `55d7d1c503` fix(mcp-server): correct AuditEntry action type and Set<string> for legacy label check -- fixes type issues in audit
- `d368273a4c` feat: complete TASK-09 label attribution harmonization -- label-related changes
- `88cf0c2e00` feat(email): TASK-06/08 -- label-absence query replaces is:unread in organize inbox -- changed how labels filter queries
- `3db62f1629` feat(email): TASK-02 -- label hygiene on failure in handleMarkProcessed -- added cleanup for failed label applies

## Access Declarations

- Gmail API (OAuth2) -- read/write access to labels and messages. Verified: credentials configured in MCP server via `getGmailClient`.
- No other external sources needed.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The scope is well-bounded: (a) fix the bare `Brikette` parent classification edge case in `handleAuditLabels`, and (b) add one new MCP tool (`gmail_cleanup_labels`) that consumes the corrected audit classification, adds a message-count safety check via `users.messages.list`, and calls `users.labels.delete` for confirmed-empty orphaned labels. The existing test infrastructure and mock patterns make this straightforward to test. No upstream or downstream dependencies are affected.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Label classification (REQUIRED_LABELS, LEGACY_LABELS, orphaned) | Yes | [Scope gap in investigation] Minor: bare `Brikette` parent is classified as orphaned by audit; fix at audit level so cleanup can consume output directly | No |
| Gmail API label deletion (`users.labels.delete`) | Yes | None -- API documented, never used in codebase but straightforward | No |
| Message count safety check (`users.messages.list` with labelIds) | Yes | None -- pattern already used in `handleMigrateLabels` | No |
| Dual ensureLabelMap implementations | Yes | [Scope gap in investigation] Minor: new tool should use one canonical `ensureLabelMap`; recommend using `gmail-shared.ts` version | No |
| Test mock infrastructure | Yes | None -- existing `buildLabelStub` pattern covers labels.list, labels.create; needs labels.delete addition | No |
| Tool registration and dispatch | Yes | None -- follows established `gmailTools` + `handleGmailTool` switch pattern | No |

## Questions

### Resolved

- Q: Are labels applied per-message or per-thread?
  - A: Per-message. Gmail API `users.messages.modify` applies labels to individual messages. A label with zero messages listed under it is truly empty.
  - Evidence: `gmail.ts` lines 3150-3174 (migrate_labels scans by message), `gmail-shared.ts` line 736 (modify individual message)

- Q: Does the `Brikette` bare label (without sub-path) need special handling?
  - A: Yes. `handleAuditLabels` includes `name === "Brikette"` in the Brikette filter (line 3414). The parent label must be excluded from deletion even if it has no direct messages, as it serves as the namespace container.
  - Evidence: `gmail.ts` line 3414

- Q: Should legacy labels with zero messages be cleaned up too?
  - A: Yes, as an optional mode. After `gmail_migrate_labels` has moved all messages off legacy labels, those empty legacy labels serve no purpose. The cleanup tool should support a `includeLegacy` flag (default false) to optionally remove them.
  - Evidence: `gmail_migrate_labels` implementation (gmail.ts lines 3109-3207) already handles the message migration; the empty label shell persists after migration.

- Q: Where should the new handler live -- in `gmail.ts` monolith or in a new modular file?
  - A: In `gmail.ts` alongside `handleAuditLabels`, following the established pattern. The audit and cleanup functions are closely related and share the same classification logic. The monolith is where `handleAuditLabels` and `handleMigrateLabels` currently live.
  - Evidence: `gmail.ts` lines 3407-3442 (audit), lines 3109-3207 (migrate)

- Q: Is there a risk of deleting a label that is concurrently being applied to a new message?
  - A: Low risk. The cleanup tool checks message count at the time of execution. A race condition is theoretically possible but practically negligible given that (a) orphaned labels are by definition not part of the current workflow taxonomy, and (b) `ensureLabelMap` will re-create any needed label on the next tool invocation. Dry-run mode further mitigates this.
  - Evidence: `ensureLabelMap` auto-creates missing labels (gmail-shared.ts lines 559-576)

### Open (Operator Input Required)

No open questions. All decisions can be resolved from codebase evidence and established patterns.

## Confidence Inputs

- **Implementation: 90%** -- The Gmail API for label deletion is well-documented. The classification logic already exists in `handleAuditLabels`. Adding a message-count check and delete call is straightforward. Raises to 95%: confirming `users.labels.delete` works as expected in a dry-run test against real Gmail.
- **Approach: 85%** -- The approach (reuse audit classification + add safety check + delete) follows established patterns in the codebase. Raises to 90%: confirming the operator is satisfied with on-demand invocation rather than scheduled cleanup.
- **Impact: 80%** -- Reduces label clutter, improving operator Gmail navigation. Impact is moderate since label accumulation is a slow-burn usability issue, not a functional blocker. Raises to 90%: measuring actual orphaned label count in production Gmail to confirm the problem magnitude.
- **Delivery-Readiness: 90%** -- All building blocks exist: mock infrastructure, tool registration pattern, audit classification logic. Only new code is the handler function and test file. Raises to 95%: no blockers identified.
- **Testability: 90%** -- Excellent testability. Mock patterns are well-established. The handler is a pure function of Gmail API responses. Raises to 95%: confirming `labels.delete` mock can be added to existing stub pattern (strong evidence it can).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Accidentally deleting a label with messages | Very Low | High | Message-count check before deletion; dry-run mode default; test coverage for this invariant |
| Gmail API rate limiting during bulk deletion | Low | Low | Labels accumulate slowly (dozens, not thousands); batch size is inherently limited |
| Race condition: label deleted while being applied | Very Low | Low | `ensureLabelMap` auto-recreates missing labels; orphaned labels are outside current taxonomy |
| Deleting the `Brikette` parent label | Very Low | Medium | Explicit exclusion in cleanup logic; test case for this |

## Planning Constraints & Notes

- Must-follow patterns:
  - Dry-run defaults to `true` (matches `gmail_migrate_labels` and `gmail_reconcile_in_progress` conventions)
  - Tool definition follows `gmailTools` array pattern with Zod schema validation
  - Handler lives in `gmail.ts` alongside related audit/migrate handlers
  - Tests follow `buildLabelStub` mock pattern from `gmail-audit-labels.test.ts`
- Rollout/rollback expectations:
  - No rollout risk: tool is invoked manually; deleted labels can be recreated by `ensureLabelMap` if needed
- Observability expectations:
  - Return a structured result showing which labels were deleted (or would be in dry-run), matching the `jsonResult` pattern used by audit and migrate tools

## Suggested Task Seeds (Non-binding)

1. Fix `handleAuditLabels` to exclude the bare `Brikette` parent label from the orphaned bucket (move to a `namespace_parents` field or filter out); add regression test
2. Implement `handleCleanupLabels` in `gmail.ts` with message-count safety check, consuming audit classification directly
3. Register `gmail_cleanup_labels` tool definition in `gmailTools` array and add case to `handleGmailTool` dispatcher
4. Write unit tests covering: dry-run, live deletion, safety check (skip labels with messages), empty legacy label cleanup, error handling
5. Optionally enhance `gmail_audit_labels` to include message counts in its output (useful for operator visibility)

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - New MCP tool `gmail_cleanup_labels` callable and returning structured results
  - Dry-run mode works correctly
  - Labels with messages are never deleted
  - Unit tests pass in CI
- Post-delivery measurement plan:
  - Run `gmail_audit_labels` before and after cleanup to confirm orphaned count drops to zero (or to 1 if the bare `Brikette` parent is reported separately rather than excluded)

## Evidence Gap Review

### Gaps Addressed

- Citation integrity: all claims traced to specific file paths and line numbers
- Boundary coverage: Gmail API boundary inspected (OAuth via `getGmailClient`, label CRUD operations)
- Error/fallback paths: `ensureLabelMap` auto-recreation on next invocation covers accidental deletion recovery
- Testing coverage: existing test files verified (gmail-audit-labels.test.ts confirmed with 3 test cases); coverage gap for `labels.delete` identified and test approach specified
- Security boundaries: OAuth credentials already managed by `getGmailClient`; no new auth surface

### Confidence Adjustments

- No downward adjustments needed. Evidence is concrete for all claims.

### Remaining Assumptions

- Orphaned label count in production Gmail is non-trivial (assumption based on operator report; not independently verified)
- `users.labels.delete` Gmail API behaves as documented (standard Google API, high confidence)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-inbox-orphaned-labels --auto`
