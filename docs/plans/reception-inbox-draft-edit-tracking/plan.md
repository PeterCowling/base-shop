---
Type: Plan
Status: Complete
Domain: Data
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-draft-edit-tracking
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Inbox Draft Edit Tracking Plan

## Summary
Add `original_plain_text` and `original_html` columns to the D1 `drafts` table so that when staff edit an AI-generated draft, the original generated text is preserved. Currently the PUT handler overwrites `plain_text` and the original is lost. This is a prerequisite for any future diff-based learning from staff corrections. Three tasks: D1 migration, repository/type updates with capture logic, and API serialization update.

## Active tasks
- [x] TASK-01: D1 migration — add original_plain_text and original_html columns
- [x] TASK-02: Repository types + capture/preserve logic
- [x] TASK-03: API serialization + client type update

## Goals
- Preserve original AI-generated draft text when staff edits
- Enable downstream diff computation between generated and edited versions

## Non-goals
- Building the analysis/learning pipeline (separate dispatch)
- Changing the staff editing UX
- Modifying the MCP server's draft generation logic

## Constraints & Assumptions
- Constraints:
  - D1 database (Cloudflare) — migration via SQL file
  - Must not break existing draft lifecycle (generated → edited → approved → sent)
- Assumptions:
  - D1 supports ALTER TABLE ADD COLUMN for nullable TEXT (standard SQLite)
  - Storage cost of duplicate text is negligible

## Inherited Outcome Contract
- **Why:** Staff edits to AI-generated drafts are lost — the original generated text is overwritten on save, preventing any diff-based learning or quality feedback loop.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Preserve original generated draft text alongside staff edits so downstream systems can compute diffs and learn from corrections.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-inbox-draft-edit-tracking/fact-find.md`
- Key findings used:
  - No `original_plain_text` column exists in D1 `drafts` table
  - PUT handler at `draft/route.ts:108-114` overwrites `plain_text` without preserving original
  - Regenerate handler at `regenerate/route.ts:101-125` is the capture point (creates/updates draft with generated text)
  - `serializeDraft()` in `api-models.server.ts:124-141` maps row to API model — needs new fields
  - `InboxDraft` type in `useInbox.ts:7-22` is the client-side type — needs optional new fields

## Proposed Approach
- Chosen approach: Add nullable `original_plain_text` and `original_html` columns to `drafts` table. At draft generation time (regenerate route), copy `plainText`/`html` into the original columns. On staff edit (PUT route), these columns remain untouched. The `updateDraft()` function never writes to original columns — only `createDraft()` and a new dedicated path in regenerate set them.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | D1 migration — add original columns | 95% | S | Pending | - | TASK-02 |
| TASK-02 | IMPLEMENT | Repository types + capture/preserve logic | 90% | S | Pending | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | API serialization + client type update | 85% | S | Pending | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Migration file only |
| 2 | TASK-02 | TASK-01 | Type + logic changes |
| 3 | TASK-03 | TASK-02 | Serialization + client types |

## Tasks

### TASK-01: D1 migration — add original_plain_text and original_html columns
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/migrations/0004_inbox_draft_original_text.sql`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete
- **Affects:** `apps/reception/migrations/0004_inbox_draft_original_text.sql`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 95%
  - Implementation: 95% - standard ALTER TABLE ADD COLUMN
  - Approach: 95% - only viable approach for D1
  - Impact: 95% - prerequisite for all downstream work
- **Acceptance:**
  - Migration file exists at `apps/reception/migrations/0004_inbox_draft_original_text.sql`
  - Adds `original_plain_text TEXT DEFAULT NULL` column
  - Adds `original_html TEXT DEFAULT NULL` column
  - Migration is additive only (no data loss risk)
- **Validation contract (TC-01):**
  - TC-01: Migration SQL is valid SQLite ALTER TABLE syntax
  - TC-02: Columns are nullable with DEFAULT NULL (no NOT NULL constraint)
- **Execution plan:** Write migration SQL file with two ALTER TABLE statements
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: standard D1 migration pattern, already 3 migrations exist
- **Edge Cases & Hardening:**
  - Migration must use separate ALTER TABLE statements (SQLite doesn't support multi-column ALTER)
- **What would make this >=90%:** Already at 95%
- **Rollout / rollback:**
  - Rollout: `wrangler d1 migrations apply reception-inbox`
  - Rollback: nullable columns are harmless if unused — no rollback needed
- **Documentation impact:** None
- **Notes / references:** Follows pattern of `0003_inbox_draft_recipients_subject.sql`

### TASK-02: Repository types + capture/preserve logic
- **Type:** IMPLEMENT
- **Deliverable:** Updated `repositories.server.ts` types and functions, updated `regenerate/route.ts` to set original text
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete
- **Affects:** `apps/reception/src/lib/inbox/repositories.server.ts`, `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts`, `[readonly] apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% - clear changes to type + createDraft function + regenerate route
  - Approach: 90% - capture at generation time is the right point
  - Impact: 90% - core logic change
- **Acceptance:**
  - `InboxDraftRow` type has `original_plain_text: string | null` and `original_html: string | null`
  - `CreateDraftInput` has optional `originalPlainText` and `originalHtml` fields
  - `createDraft()` INSERT includes `original_plain_text` and `original_html` columns
  - `createDraft()` SELECT reads back the new columns
  - `updateDraft()` never writes to `original_plain_text` or `original_html` (preservation by omission)
  - Regenerate route sets `originalPlainText: regenerated.plainText` and `originalHtml: regenerated.html` in both the `createDraft` and `updateDraft` paths
  - For the `updateDraft` path in regenerate: need to add a raw SQL update for `original_plain_text` since `updateDraft()` deliberately excludes it
  - PUT draft route (staff edit) is unchanged — confirms preservation
- **Validation contract (TC-02):**
  - TC-01: After regenerate, `original_plain_text` equals `plain_text` in D1
  - TC-02: After PUT edit, `original_plain_text` is unchanged while `plain_text` is updated
  - TC-03: `updateDraft()` function does not modify `original_plain_text` or `original_html`
- **Execution plan:**
  1. Add fields to `InboxDraftRow`, `CreateDraftInput`
  2. Update `createDraft()` INSERT/SELECT to include new columns
  3. Update all SELECT queries in `getThread()` and `listThreadsWithLatestDraft()` to include new columns
  4. In regenerate route: pass `originalPlainText`/`originalHtml` when creating new draft; for existing draft update path, add a separate SQL statement to set `original_plain_text` and `original_html`
  5. Verify PUT route does NOT pass original fields (preservation by omission)
- **Consumer tracing:**
  - New field `original_plain_text` on `InboxDraftRow`: consumed by `serializeDraft()` (TASK-03), all draft SELECT queries (this task)
  - New field `original_html` on `InboxDraftRow`: consumed by `serializeDraft()` (TASK-03), all draft SELECT queries (this task)
  - `updateDraft()` unchanged — does not touch original columns. Callers: PUT route (staff edit), regenerate route (both paths), send route. Consumer `updateDraft` is unchanged because it only updates fields explicitly passed via `Object.prototype.hasOwnProperty.call()` checks, and `originalPlainText` is never in `UpdateDraftInput`.
  - `ThreadWithLatestDraftRow` type: needs `draft_original_plain_text` and `draft_original_html` fields added, and the LEFT JOIN SELECT updated
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: clear code paths verified
- **Edge Cases & Hardening:**
  - Regenerate of existing draft (update path): must set original columns via direct SQL since `updateDraft()` deliberately excludes them
  - Historical drafts: will have NULL originals — acceptable
- **What would make this >=90%:** Already at 90%
- **Rollout / rollback:**
  - Rollout: deploy updated code after migration applied
  - Rollback: revert code; nullable columns ignored by old code
- **Documentation impact:** None
- **Notes / references:** Key insight: `updateDraft()` uses `hasOwnProperty` checks so it naturally excludes fields not in `UpdateDraftInput` — preservation by design.

### TASK-03: API serialization + client type update
- **Type:** IMPLEMENT
- **Deliverable:** Updated `api-models.server.ts` serialization, updated `useInbox.ts` client type
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete
- **Affects:** `apps/reception/src/lib/inbox/api-models.server.ts`, `apps/reception/src/services/useInbox.ts`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - straightforward field additions
  - Approach: 85% - field naming must match convention
  - Impact: 85% - exposes data for future UI diff feature
- **Acceptance:**
  - `InboxDraftApiModel` has `originalPlainText: string | null` and `originalHtml: string | null`
  - `serializeDraft()` maps `draft.original_plain_text` → `originalPlainText` and `draft.original_html` → `originalHtml`
  - `InboxDraft` type in `useInbox.ts` has `originalPlainText: string | null` and `originalHtml: string | null`
  - `ThreadWithLatestDraftRow` serialization in `listThreadsWithLatestDraft` response mapping includes original fields
  - Typecheck passes
- **Validation contract (TC-03):**
  - TC-01: API response for a regenerated draft includes `originalPlainText` field
  - TC-02: `pnpm typecheck` passes with new fields
- **Execution plan:**
  1. Add `originalPlainText` and `originalHtml` to `InboxDraftApiModel`
  2. Update `serializeDraft()` to map new row fields
  3. Add `originalPlainText` and `originalHtml` to `InboxDraft` in `useInbox.ts`
- **Consumer tracing:**
  - New API field `originalPlainText`: consumed by client-side `InboxDraft` type. No UI component reads it yet (future diff view) — dead-end field is acceptable because this task's purpose is data capture, not UI.
  - Consumer `DraftReviewPanel` is unchanged because it reads `plainText` for display, not `originalPlainText`.
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: standard API field addition
- **Edge Cases & Hardening:** None: nullable fields, backwards compatible
- **What would make this >=90%:** Verify the `ThreadWithLatestDraftRow` join query also picks up new columns
- **Rollout / rollback:**
  - Rollout: deploy with TASK-01 + TASK-02
  - Rollback: revert code; API consumers ignore unknown fields
- **Documentation impact:** None
- **Notes / references:** The `originalPlainText` field is intentionally exposed but not yet consumed by UI — it enables the future acceptance rate feedback loop.

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| D1 migration failure | Low | High | Additive nullable columns; test locally first |
| Original text not captured for regenerate-update path | Medium | Medium | TASK-02 explicitly handles both create and update paths in regenerate |

## Observability
- Logging: `draft_edited` telemetry event already exists
- Metrics: None: no new metrics needed for this change
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [x] D1 migration applied successfully
- [x] After draft regeneration, `original_plain_text` is populated
- [x] After staff edit, `original_plain_text` is preserved (not overwritten)
- [x] TypeScript types updated across server and client
- [x] `pnpm typecheck` passes

## Decision Log
- 2026-03-07: Chose to capture original at both createDraft and regenerate-update paths (covers all generation scenarios)
- 2026-03-07: Chose nullable columns (historical drafts get NULL originals — acceptable)
- 2026-03-07: `updateDraft()` deliberately does NOT include original fields — preservation by omission

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: D1 migration | Yes | None | No |
| TASK-02: Repository + capture logic | Yes (TASK-01 migration applied) | None | No |
| TASK-03: API serialization + client types | Yes (TASK-02 types available) | None | No |

## Delivery Rehearsal
- **Data:** TASK-01 creates the schema. TASK-02 reads/writes it. No missing data dependencies.
- **Process/UX:** No user-visible flow changes. Staff editing UX unchanged.
- **Security:** No auth boundary changes. Existing `requireStaffAuth` applies.
- **UI:** No UI changes in this plan. Data capture only.

## Overall-confidence Calculation
- TASK-01: 95% * 1 (S) = 95
- TASK-02: 90% * 1 (S) = 90
- TASK-03: 85% * 1 (S) = 85
- Overall = (95 + 90 + 85) / 3 = 90%
