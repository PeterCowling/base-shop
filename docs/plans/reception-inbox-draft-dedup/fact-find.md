---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-draft-dedup
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-draft-dedup/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307142547-9102
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Inbox Draft Dedup Fact-Find Brief

## Scope

### Summary

When `draft_generate` (or the sync pipeline) creates a draft for a thread that already has a pending draft, a second draft row is inserted into the D1 `drafts` table. The UI shows only the most recent draft (`getCurrentDraft` returns `record.drafts[0]`), but stale drafts accumulate silently. The fix is a dedup guard that prevents duplicate pending drafts per thread.

### Goals

- Ensure only one pending (status `generated` or `edited`) draft exists per thread at any time in the D1 database.
- Subsequent draft creation for the same thread should replace (update) the existing pending draft rather than inserting a new row.
- Preserve the existing Gmail-level dedup in `gmail_create_draft` (already working).

### Non-goals

- Changing the MCP `draft_generate` tool itself (it does not persist to DB; it returns content).
- Retroactive cleanup of existing duplicate drafts (can be a follow-up).
- Changing draft lifecycle statuses or the UI rendering logic.

### Constraints & Assumptions

- Constraints:
  - D1 (SQLite) does not support `SELECT ... FOR UPDATE`; concurrency is limited to single-writer per database, so race conditions are unlikely but the guard must be logically correct.
  - The `drafts` table has no UNIQUE constraint on `(thread_id, status)` and adding one would be a migration.
- Assumptions:
  - The primary duplication vector is the sync pipeline (`sync.server.ts` line 612) calling `createDraft` without checking for existing drafts.
  - The secondary vector is the `regenerate/route.ts` POST handler, though this already checks `getCurrentDraft` and updates when present.
  - The `[threadId]/draft/route.ts` PUT handler also already checks `getCurrentDraft` and updates when present.

## Outcome Contract

- **Why:** Duplicate pending drafts for the same thread create confusion in the inbox UI and waste operator attention sorting through redundant drafts.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Only one pending draft exists per thread at any time; subsequent draft_generate calls either replace or skip if a pending draft already exists.
- **Source:** operator

## Access Declarations

None. All investigation uses local codebase files only.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/lib/inbox/sync.server.ts` — sync pipeline; calls `createDraft` at line 612 without dedup check. **Primary duplication vector.**
- `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts` — PUT handler for manual draft edits; already has dedup (checks `getCurrentDraft`, updates if exists, creates if not).
- `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts` — POST handler for regeneration; already has dedup (checks `getCurrentDraft`, updates if exists, creates if not).
- `packages/mcp-server/src/tools/draft-generate.ts` — MCP tool; does NOT persist to DB, returns JSON content only. Not a duplication vector.
- `packages/mcp-server/src/tools/gmail.ts` (line 2644-2668) — `gmail_create_draft`; already has Gmail-level dedup via `drafts.list` query.

### Key Modules / Files

- `apps/reception/src/lib/inbox/repositories.server.ts` — `createDraft()` (line 721), `updateDraft()` (line 806), `getThread()` (line 423). `createDraft` always inserts; no dedup logic.
- `apps/reception/src/lib/inbox/api-models.server.ts` — `getCurrentDraft()` (line 147) returns `record.drafts[0]` (most recent by `updated_at DESC`). Multiple drafts are silently ignored.
- `apps/reception/migrations/0001_inbox_init.sql` — `drafts` table schema (line 31-45). No UNIQUE constraint on `(thread_id)` for pending drafts.
- `apps/reception/src/lib/inbox/sync.server.ts` — `syncInboxThreads()` function, draft creation block at lines 564-627.

### Patterns & Conventions Observed

- **Upsert-by-check pattern**: Both the PUT route and regenerate route follow the same pattern: call `getCurrentDraft(record)`, then branch to `updateDraft` (if exists) or `createDraft` (if not). Evidence: `[threadId]/draft/route.ts` lines 107-125, `regenerate/route.ts` lines 101-129.
- **Draft status lifecycle**: `generated` -> `edited` -> `approved` -> `sent`. Defined in `repositories.server.ts` line 19-24.
- **Thread record includes all drafts**: `getThread()` fetches all drafts for a thread ordered by `updated_at DESC, created_at DESC` (line 496-497). The full array is available to callers.
- **Gmail-side dedup is fail-open**: `gmail_create_draft` catches errors from `drafts.list` and proceeds with creation (line 2666-2668).

### Data & Contracts

- Types/schemas/events:
  - `InboxDraftRow`: id, thread_id, gmail_draft_id, status (`generated|edited|approved|sent`), subject, recipient_emails_json, plain_text, html, original_plain_text, original_html, template_used, quality_json, interpret_json, created_by_uid, created_at, updated_at.
  - `InboxDraftStatus`: `"generated" | "edited" | "approved" | "sent"`.
  - `CreateDraftInput`: threadId required, status defaults to `"generated"`.
- Persistence:
  - D1 (Cloudflare SQLite). Table `drafts` with `idx_drafts_thread_updated` index on `(thread_id, updated_at)`.
  - No UNIQUE constraint preventing multiple drafts per thread.
- API/contracts:
  - GET `/api/mcp/inbox/[threadId]/draft` — returns the latest draft (single).
  - PUT `/api/mcp/inbox/[threadId]/draft` — upsert pattern (already deduped).
  - POST `/api/mcp/inbox/[threadId]/draft/regenerate` — upsert pattern (already deduped).

### Dependency & Impact Map

- Upstream dependencies:
  - `generateAgentDraft()` in `draft-pipeline.server.ts` — generates draft content, called by sync pipeline.
  - Gmail API `drafts.list` / `drafts.create` — used by MCP `gmail_create_draft` tool (separate dedup path).
- Downstream dependents:
  - Inbox UI — reads thread data including `currentDraft` via the GET endpoint. Only shows one draft.
  - `[threadId]/send/route.ts` — sends the current draft. If multiple drafts exist, only the latest is sent; orphans persist.
  - `listThreadsWithLatestDraft` query (line 304) — LEFT JOINs to latest draft by `updated_at DESC LIMIT 1`. Multiple drafts do not break the query but waste storage.
- Likely blast radius:
  - Small. Change is isolated to draft creation logic in `sync.server.ts` and potentially a helper in `repositories.server.ts`.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest
- Commands: `pnpm -w run test:governed` (CI only per policy)
- CI integration: Runs in CI pipeline

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Sync pipeline | Unit | `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts` | Tests sync flow but does not test duplicate draft prevention |
| Draft pipeline | Unit | `apps/reception/src/lib/inbox/__tests__/draft-pipeline.server.test.ts` | Tests draft generation, not persistence dedup |
| Draft helpers | Unit | `apps/reception/src/lib/inbox/__tests__/draft-helpers.test.ts` | Utility tests |
| MCP gmail_create_draft dedup | Unit | `packages/mcp-server/src/__tests__/gmail-create-draft.test.ts` | TC-10 tests Gmail-level dedup (already_exists path) |

#### Coverage Gaps

- No test verifies that calling `createDraft` twice for the same thread results in only one pending draft.
- No test for the sync pipeline's behavior when re-syncing a thread that already has a draft.

#### Testability Assessment

- Easy to test: The dedup logic is a pure DB operation. Can be tested with an in-memory D1 mock or the existing test patterns in `sync.server.test.ts`.
- Test seams needed: None new. The existing `createDraft` / `getThread` functions are already injectable via the `db` parameter.

#### Recommended Test Approach

- Unit tests for: `createDraft` or a new `upsertDraft` function that checks for existing pending draft before insert.
- Integration tests for: Sync pipeline re-processing a thread that already has a generated draft.

### Recent Git History (Targeted)

- `ee29b9b` feat(reception-inbox-draft-acceptance-rate): add draft stats endpoint + MCP tool
- `5b74772` feat(reception-inbox-draft-edit-tracking): preserve original AI-generated draft text on staff edits
- `ea63dee` perf(reception-inbox): eliminate N+1 queries, remove Gmail blocking, add client cache
- `551066d` fix(reception): harden dismiss action — race condition, misclick risk, guards, copy

## Questions

### Resolved

- Q: Does the MCP `draft_generate` tool persist drafts to the database?
  - A: No. It returns JSON content (bodyPlain, bodyHtml, quality, etc.). The caller (sync pipeline or agent) is responsible for persisting via `createDraft`.
  - Evidence: `packages/mcp-server/src/tools/draft-generate.ts` line 1860 — returns `jsonResult({...})` with no DB write.

- Q: Where is the primary duplication vector?
  - A: `sync.server.ts` line 612 — calls `createDraft` without checking if a draft already exists for the thread. If the same thread is re-synced (e.g., new inbound message triggers re-admission and re-draft), a second draft is inserted.
  - Evidence: `apps/reception/src/lib/inbox/sync.server.ts` lines 564-627.

- Q: Do the API routes already have dedup?
  - A: Yes. Both PUT `[threadId]/draft/route.ts` and POST `[threadId]/draft/regenerate/route.ts` check `getCurrentDraft(record)` and call `updateDraft` if a draft exists. The duplication only happens via the sync pipeline.
  - Evidence: `route.ts` lines 107-125, `regenerate/route.ts` lines 101-129.

- Q: Should the dedup strategy be "replace" or "skip"?
  - A: Replace (update the existing draft). This matches the pattern already used by the PUT and regenerate routes. If a new sync produces a better draft, the operator should see the latest version, not a stale one.
  - Evidence: Consistent with regenerate route behavior and dispatch payload intent ("replace or skip").

- Q: Is a DB migration needed?
  - A: Not required for the dedup check (application-level guard is sufficient). While SQLite does support partial unique indexes, this would add migration complexity for minimal benefit given D1's single-writer model. The application-level check-then-update is the pragmatic approach and matches the existing patterns used by the PUT and regenerate routes.
  - Evidence: No UNIQUE constraint exists today (`migrations/0001_inbox_init.sql` line 31-45). Application-level guard is consistent with how the codebase handles this pattern in two other call sites.

### Open (Operator Input Required)

No open questions. All decisions can be resolved from codebase evidence and the dispatch payload.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The change is isolated to one function call site in the sync pipeline. The dedup pattern already exists in two other call sites (PUT route, regenerate route). The fix is to apply the same check-then-update pattern to the sync pipeline's `createDraft` call. No schema migration is required. Test coverage is straightforward.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| MCP draft_generate tool | Yes | None — confirmed it does not persist to DB | No |
| Sync pipeline draft creation | Yes | None — primary vector identified with line numbers | No |
| PUT draft route | Yes | None — already has dedup pattern | No |
| Regenerate draft route | Yes | None — already has dedup pattern | No |
| Gmail-level dedup | Yes | None — separate dedup path, already working | No |
| DB schema (drafts table) | Yes | None — no UNIQUE constraint, but application-level guard is sufficient | No |
| Draft status lifecycle | Yes | None — statuses documented | No |
| Test landscape | Yes | None — coverage gaps identified, testability confirmed | No |

## Confidence Inputs

- Implementation: 92% — the fix is a straightforward application of an existing pattern (check `getCurrentDraft`, branch to update/create). Would reach 95% with a working prototype.
- Approach: 95% — the upsert pattern is proven in two other call sites in the same codebase.
- Impact: 90% — eliminates the primary duplication vector. Edge cases (rapid concurrent syncs) are mitigated by D1's single-writer model. Would reach 95% with production verification.
- Delivery-Readiness: 90% — all evidence gathered, no blockers, no external dependencies.
- Testability: 88% — existing test infrastructure supports this. Would reach 95% with the test written.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Existing duplicate drafts cause confusion after fix (old duplicates remain) | Low | Low | Out of scope; follow-up cleanup task can purge orphaned drafts |
| Race condition if two syncs run concurrently for the same thread | Very Low | Low | D1 single-writer model prevents true concurrent writes; application-level check is sufficient |
| Updating an edited draft with a generated one overwrites staff work | Low | Medium | Check draft status: only replace `generated` drafts, not `edited`/`approved` ones (same pattern as regenerate route's `force` flag) |

## Planning Constraints & Notes

- Must-follow patterns:
  - Do NOT reuse `getCurrentDraft` directly — it is not status-aware (returns `drafts[0]` regardless of status). Instead, introduce a `getPendingDraft` helper that filters by `status = 'generated'`.
  - Only replace drafts with status `generated`. If the current draft has status `edited` or `approved`, the sync pipeline must skip draft creation (the operator has already acted on it). This mirrors the `regenerate/route.ts` pattern where `edited` drafts require `force=true`.
- Rollout/rollback expectations:
  - No migration; pure application logic change. Rollback is a code revert.
- Observability expectations:
  - The existing `recordInboxEvent` telemetry with `event_type: "drafted"` already tracks draft creation. No new observability needed.

## Suggested Task Seeds (Non-binding)

1. Add a `getPendingDraft` helper that filters drafts by status `generated` (not `edited`, `approved`, or `sent`) and returns the latest one. Do NOT reuse `getCurrentDraft` — it returns `drafts[0]` regardless of status and would overwrite `edited`/`approved` drafts.
2. Modify `sync.server.ts` draft creation block to check for existing pending draft and call `updateDraft` instead of `createDraft` when one exists. Protect `edited`/`approved` drafts from overwrite.
3. Add unit test: sync pipeline re-processes a thread that already has a `generated` draft — verify no duplicate is created and the existing draft is updated.
4. Add unit test: sync pipeline re-processes a thread that has an `edited` draft — verify the edited draft is preserved (not overwritten).

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: All existing tests pass + new dedup tests pass + manual verification that re-syncing a thread does not create duplicate drafts.
- Post-delivery measurement plan: Monitor `drafts` table for threads with multiple non-sent drafts. Count should trend to zero for new threads.

## Evidence Gap Review

### Gaps Addressed

- [x] Citation Integrity: All claims cite specific file paths and line numbers.
- [x] Boundary Coverage: API routes, sync pipeline, MCP tool, and Gmail dedup all inspected.
- [x] Testing/Validation Coverage: Existing tests verified; gaps identified (no dedup test exists).
- [x] Confidence Calibration: Scores reflect the straightforward nature of the fix with evidence-based reasoning.

### Confidence Adjustments

- No downward adjustments needed. The fix follows a proven pattern already in the codebase.

### Remaining Assumptions

- D1 single-writer model prevents true concurrent duplicate inserts. This is a documented Cloudflare D1 property.
- The `getCurrentDraft` function (returning `drafts[0]` from a `DESC` ordered query) is the canonical way to find the active draft. This is used consistently across all three call sites.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan reception-inbox-draft-dedup --auto`
