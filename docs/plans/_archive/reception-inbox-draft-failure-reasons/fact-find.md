---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-draft-failure-reasons
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-draft-failure-reasons/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307153740-9206
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Inbox Draft Failure Reasons — Fact-Find Brief

## Scope

### Summary

When draft generation fails during inbox sync, the system sets `needsManualDraft=true` in thread metadata but discards all failure detail. Staff see a generic "Auto-draft unavailable for this thread" banner and a "Manual" badge with no explanation of what went wrong. The `AgentDraftResult` object at the failure point contains structured error information (status, error code, quality check results with specific failed_checks arrays) but none of this is persisted to metadata or surfaced in the UI.

The change adds a failure reason code and human-readable message to thread metadata, flows them through the API model and thread summary, and displays them in the inbox UI so staff immediately understand why auto-drafting failed.

### Goals

- Store a structured failure reason (code + message) in thread metadata when `needsManualDraft` is set to true
- Surface failure reason in the inbox UI where the "Manual" badge and "Auto-draft unavailable" banner currently appear
- Cover the two primary failure paths that persist `needsManualDraft: true`: sync pipeline and recovery pipeline
- Secondary: the regeneration endpoint currently throws on failure without updating metadata; consider persisting the last regeneration error in metadata as a separate, lower-priority behavior

### Non-goals

- Auto-retry logic changes (recovery.server.ts retry policy stays as-is)
- Quality check threshold tuning
- Draft generation algorithm improvements
- New D1 columns or schema migrations (metadata_json is flexible JSON)

### Constraints & Assumptions

- Constraints:
  - No D1 schema migration required — `metadata_json` is a flexible JSON column that already stores arbitrary thread metadata fields
  - Must be backward-compatible: threads with no failure reason fields must continue to work (existing `needsManualDraft: true` without reason is treated as "unknown")
  - Testing policy: tests run in CI only, not locally
- Assumptions:
  - The `AgentDraftResult` type provides sufficient failure categorization for sync and recovery draft-generation failures. Recovery also has a `max_retries` path (line 128-131 of recovery.server.ts) that flags for manual draft without ever producing an `AgentDraftResult` — the reason derivation helper must also accept a standalone reason code (e.g., `"max_retries_exceeded"`) for this path.
  - Staff do not need to see raw `failed_checks` arrays — a summarized reason is sufficient

## Outcome Contract

- **Why:** When draft generation fails, reception staff have no way to understand what went wrong. They see "needs manual draft" but cannot tell if the email body was empty, the quality gate failed, or the template engine had no match. This slows triage and wastes staff time investigating causes that the system already knows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Draft generation failures store a reason code and human-readable message in thread metadata, displayed in the inbox UI so staff knows what went wrong without investigating.
- **Source:** operator

## Access Declarations

None. All changes are within the reception app codebase; no external services or credentials needed.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/lib/inbox/sync.server.ts` — Main sync pipeline; lines 657-682 contain the failure branch where `needsManualDraft` is set
- `apps/reception/src/lib/inbox/recovery.server.ts` — Recovery pipeline; lines 236-243 and 246-269 set `needsManualDraft` without reason
- `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts` — Regeneration endpoint; throws error on failure (surfaces via client toast) but does not persist reason in metadata. Secondary scope — does not set `needsManualDraft`.

### Key Modules / Files

1. `apps/reception/src/lib/inbox/sync.server.ts` — `SyncThreadMetadata` type (line 47-67) defines `needsManualDraft?: boolean` with no reason fields. Failure branch at line 679-681 sets `needsManualDraft = true` and increments `manualDraftFlags` counter but discards `draftResult`.
2. `apps/reception/src/lib/inbox/draft-pipeline.server.ts` — `AgentDraftResult` type (line 29-46) contains `status`, `error` (with `code` and `message`), and `qualityResult`. The `buildInvalidInputResult()` function (line 62-78) returns `status: "error"` with `code: "invalid_input"`.
3. `apps/reception/src/lib/inbox/draft-core/quality-check.ts` — `QualityCheckResult` type (line 27-33) has `passed`, `failed_checks` (string array), `warnings`, `confidence`. Failed checks include: `unanswered_questions`, `prohibited_claims`, `missing_plaintext`, `missing_html`, `missing_signature`, `missing_required_link`, `missing_required_reference`, `reference_not_applicable`, `contradicts_thread`, `missing_policy_mandatory_content`, `policy_prohibited_content`.
4. `apps/reception/src/lib/inbox/api-models.server.ts` — `InboxThreadMetadata` type (line 12-27) has `needsManualDraft?: boolean` and no failure reason fields. `buildThreadSummary` (line 218-253) and `buildThreadSummaryFromRow` (line 259-315) both expose `needsManualDraft: Boolean(metadata.needsManualDraft)` with no reason.
5. `apps/reception/src/services/useInbox.ts` — `InboxThreadSummary` type (line 26-41) has `needsManualDraft: boolean` with no reason fields.
6. `apps/reception/src/components/inbox/presentation.ts` — `buildInboxThreadBadge` (line 31-37) returns `{ label: "Manual", className: "bg-warning-light text-warning-main" }` with no detail.
7. `apps/reception/src/components/inbox/DraftReviewPanel.tsx` — Line 204-207 shows generic banner: "Auto-draft unavailable for this thread. Write a manual reply below."
8. `apps/reception/src/components/inbox/InboxWorkspace.tsx` — `countThreadsNeedingManualDraft` (line 15-19) counts threads; header shows "{N} need draft" with no reason breakdown.
9. `apps/reception/src/components/inbox/ThreadList.tsx` — Uses `buildInboxThreadBadge` for badge display; no failure reason tooltip or detail.
10. `apps/reception/src/lib/inbox/recovery.server.ts` — `flagForManualDraft` (line 246-269) records outcome in telemetry but not in metadata.

### Patterns & Conventions Observed

- **Metadata as flexible JSON**: Thread metadata is stored as `metadata_json TEXT` in D1, parsed/serialized via `parseThreadMetadata()`/`JSON.stringify()`. New fields can be added by extending the TypeScript type — no migration needed. Evidence: `apps/reception/migrations/0001_inbox_init.sql` line 12, `api-models.server.ts` line 116-119.
- **Type-driven API surface**: `InboxThreadMetadata` → `buildThreadSummary` → `InboxThreadSummary` → `useInbox` → UI components. Adding a field at the metadata type level flows through naturally. Evidence: `api-models.server.ts`, `useInbox.ts`.
- **Quality result already structured**: `QualityCheckResult.failed_checks` is a string array of well-defined check names. Evidence: `quality-check.ts` line 27-33, line 311-403.
- **AgentDraftResult.error already structured**: Has `code` and `message` fields. Evidence: `draft-pipeline.server.ts` line 42-46.

### Data & Contracts

- Types/schemas/events:
  - `SyncThreadMetadata` (sync.server.ts) — internal sync metadata, superset of `InboxThreadMetadata`
  - `InboxThreadMetadata` (api-models.server.ts) — API-facing metadata type
  - `AgentDraftResult` (draft-pipeline.server.ts) — draft pipeline output with error detail
  - `QualityCheckResult` (quality-check.ts) — quality gate output with failed_checks
  - `InboxThreadSummary` (useInbox.ts) — client-side thread model
- Persistence:
  - D1 `threads.metadata_json` — flexible JSON, no migration needed
- API/contracts:
  - GET `/api/mcp/inbox` returns `InboxThreadSummary[]`
  - GET `/api/mcp/inbox/[threadId]` returns `InboxThreadDetail` with `metadata: Record<string, unknown>`

### Dependency & Impact Map

- Upstream dependencies:
  - `generateAgentDraft()` — already produces failure detail; no changes needed to this function
- Downstream dependents:
  - `buildThreadSummary()` / `buildThreadSummaryFromRow()` — must expose new fields
  - `InboxThreadSummary` client type — must add optional fields
  - `DraftReviewPanel`, `ThreadList`, `InboxWorkspace` — must consume and display new fields
- Likely blast radius:
  - Small and contained. All changes are additive (new optional fields). Backward-compatible with existing threads that lack the new fields.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs`
- CI integration: tests run in CI only per testing policy

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Inbox sync API | Integration | `inbox-sync.route.test.ts` | Tests sync endpoint |
| Inbox draft API | Integration | `inbox-draft.route.test.ts` | Tests draft CRUD |
| Inbox actions API | Integration | `inbox-actions.route.test.ts` | Tests send/resolve/dismiss |
| Inbox list API | Integration | `inbox.route.test.ts` | Tests thread listing |
| Recovery pipeline | Unit | `recovery.server.test.ts` | Tests stale thread recovery |

#### Coverage Gaps
- No unit tests for `buildThreadSummary` / `buildThreadSummaryFromRow` field mapping
- No unit tests for `buildInboxThreadBadge` or `presentation.ts` helpers

#### Testability Assessment
- Easy to test: metadata field extraction in `buildThreadSummary`, badge logic in `presentation.ts`, failure reason derivation from `AgentDraftResult`
- Hard to test: Full sync pipeline integration (requires Gmail API mocks, D1 mocks)

#### Recommended Test Approach
- Unit tests for: failure reason derivation function (mapping AgentDraftResult to reason code + message)
- Integration tests for: existing route tests updated to verify failure reason fields in API responses

### Recent Git History (Targeted)

Not investigated: recent commits do not touch the failure handling path; the `needsManualDraft` boolean has been unchanged since initial inbox implementation.

## Questions

### Resolved

- Q: Do we need a D1 schema migration for the new fields?
  - A: No. `metadata_json` is a flexible JSON column. Adding new keys to the TypeScript type is sufficient.
  - Evidence: `apps/reception/migrations/0001_inbox_init.sql` line 12; `SyncThreadMetadata` type already has many fields not in schema.

- Q: What failure categories exist at the `draftResult` decision point?
  - A: Three categories:
    1. **invalid_input** — `status === "error"` with `error.code === "invalid_input"` (empty email body)
    2. **quality_gate_failed** — `status !== "error"` but `qualityResult.passed === false` (failed_checks: unanswered_questions, prohibited_claims, missing_signature, missing_html, missing_plaintext, missing_required_link, missing_required_reference, reference_not_applicable, contradicts_thread, missing_policy_mandatory_content, policy_prohibited_content)
    3. **max_retries_exceeded** — recovery.server.ts line 128-131: when `attempts >= maxRetries`, `flagForManualDraft` is called without ever invoking `generateAgentDraft`. No `AgentDraftResult` exists for this path.
    - NOTE on `needs_follow_up`: `generateDraftCandidate` can return `deliveryStatus: "needs_follow_up"` but this does NOT independently trigger `needsManualDraft`. The sync check at line 668 is `draftResult.status !== "error" && draftResult.qualityResult?.passed` — so `needs_follow_up` with quality passed creates a draft normally, and `needs_follow_up` with quality failed falls through to manual-draft via the quality_gate_failed path. `needs_follow_up` is therefore not a separate failure category for metadata purposes.
  - Evidence: `sync.server.ts` lines 668-681; `draft-pipeline.server.ts` lines 62-78, 131-175; `quality-check.ts` lines 311-403; `generate.ts` lines 420-424.

- Q: Does the regeneration endpoint need the same treatment?
  - A: No — the regeneration endpoint (`regenerate/route.ts`) is fundamentally different. It throws on failure and the error reaches the UI via the client-side toast in `InboxWorkspace.tsx` (line 86-89). It does NOT set `needsManualDraft: true` in metadata. Persisting regeneration errors in metadata would be a separate, lower-priority enhancement and is out of primary scope.
  - Evidence: `regenerate/route.ts` lines 88-89; `InboxWorkspace.tsx` lines 86-89.

- Q: Is the recovery pipeline a separate code path that also needs updating?
  - A: Yes. `recovery.server.ts` has its own `flagForManualDraft()` function (line 246-269) that sets `needsManualDraft: true` without a reason. It records the outcome in telemetry events but not in metadata. Must be updated alongside sync.
  - Evidence: `recovery.server.ts` lines 236-269.

- Q: What should the human-readable messages say?
  - A: Staff-appropriate messages mapped from reason codes. Agent can determine appropriate wording based on the code (e.g., "quality_gate_failed" -> "Draft did not pass quality checks (unanswered questions, missing signature, etc.)"). This is a presentation concern resolvable at build time.

### Open (Operator Input Required)

No open questions. All decisions can be resolved from codebase evidence and the stated intended outcome.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The change touches a well-defined data flow (metadata -> API model -> client type -> UI components) with clear failure categories already present in the `AgentDraftResult` type. No schema migration, no new infrastructure, no cross-app dependencies. Three code paths (sync, recovery, regenerate) need the same pattern applied. The UI changes are additive (enhance existing banner and badge). Risk is low because all new fields are optional and backward-compatible.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Sync pipeline failure branch (sync.server.ts) | Yes | None | No |
| Recovery pipeline failure branch (recovery.server.ts) | Yes | None | No |
| Regeneration endpoint (regenerate/route.ts) | Yes | None | No |
| Metadata type chain (SyncThreadMetadata -> InboxThreadMetadata -> InboxThreadSummary) | Yes | None | No |
| API serialization (buildThreadSummary, buildThreadSummaryFromRow) | Yes | None | No |
| UI components (DraftReviewPanel, ThreadList, InboxWorkspace, presentation.ts) | Yes | None | No |
| D1 schema impact | Yes | None — no migration needed | No |
| Test landscape | Partial | No unit tests for presentation helpers; existing integration tests cover API surface | No |

## Confidence Inputs

- Implementation: 95% — Clear, contained change across a well-understood data flow. All touch points identified. Would reach 100% with a prototype confirming the metadata JSON round-trip.
- Approach: 95% — Extending existing metadata JSON pattern is the established convention. No alternative approaches warrant consideration.
- Impact: 90% — Staff will see failure reasons immediately. Would reach 95% with user feedback on message clarity.
- Delivery-Readiness: 95% — All code paths mapped, no external dependencies, no migrations. Would reach 100% with integration test coverage plan confirmed.
- Testability: 85% — Easy to unit-test the reason derivation and presentation logic. Integration tests exist for API routes. Would reach 95% with dedicated unit tests for buildThreadSummary field mapping.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Existing threads with `needsManualDraft: true` but no reason fields display "unknown reason" | Low | Low | Backward-compatible: treat missing reason as "Unknown — draft generation failed before reason tracking was added" |
| Quality check names change in future, causing stale reason codes | Low | Low | Reason codes are derived at write time and stored as human-readable messages; they do not need to match future check names |
| Metadata JSON size increase | Very Low | Very Low | Two small string fields per failure; negligible compared to existing metadata |

## Planning Constraints & Notes

- Must-follow patterns:
  - Extend `SyncThreadMetadata` and `InboxThreadMetadata` with optional fields (not required)
  - Use `buildThreadSummary` / `buildThreadSummaryFromRow` to expose fields to API
  - Follow existing badge/banner pattern in UI components
- Rollout/rollback expectations:
  - Additive change; no rollback concern. New fields are optional and ignored by older code.
- Observability expectations:
  - Failure reasons will be visible in thread metadata JSON (queryable via D1)
  - Existing telemetry events in recovery.server.ts already record outcomes

## Suggested Task Seeds (Non-binding)

1. Add `draftFailureCode` and `draftFailureMessage` fields to `SyncThreadMetadata` and `InboxThreadMetadata` types; create a helper function to derive reason code + message from `AgentDraftResult` (for sync/recovery draft failures) and accept standalone reason codes (for recovery `max_retries_exceeded` path)
2. Update sync.server.ts failure branch (line 679-681) to persist failure reason in metadata
3. Update recovery.server.ts `flagForManualDraft()` to accept and persist failure reason in metadata; update `max_retries` call site (line 129) and draft-failed call site (line 238-241)
4. Update `buildThreadSummary` / `buildThreadSummaryFromRow` and `InboxThreadSummary` to expose failure reason fields
5. Update UI components: enhance "Manual" badge tooltip, enhance "Auto-draft unavailable" banner with reason message, update `presentation.ts`

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: TypeScript compiles, lint passes, existing tests pass, failure reason visible in thread metadata and UI
- Post-delivery measurement plan: Verify via inbox UI that threads with `needsManualDraft=true` display a specific failure reason instead of the generic message

## Evidence Gap Review

### Gaps Addressed

- Confirmed all three code paths (sync, recovery, regenerate) that set `needsManualDraft`
- Confirmed `AgentDraftResult` provides sufficient failure detail at each decision point
- Confirmed no D1 migration needed — metadata_json is flexible
- Confirmed backward compatibility — all new fields are optional
- Confirmed the full type chain from metadata to UI

### Confidence Adjustments

- No adjustments needed. All initial claims verified against codebase evidence.

### Remaining Assumptions

- Staff will find the summarized reason messages useful without seeing raw `failed_checks` arrays. This is a reasonable default; the message can include the primary failed check name if more detail is desired.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan`
