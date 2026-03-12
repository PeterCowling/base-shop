---
Type: Plan
Status: Archived
Domain: Data
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-metadata-normalization
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-inbox-metadata-normalization/analysis.md
---

# Reception Inbox Metadata Normalization Plan

## Summary

Promote 20 metadata fields from the `metadata_json` TEXT blob on the `threads` table to dedicated columns via a single D1 migration (`0006_inbox_metadata_columns.sql`). Unify the three divergent metadata type definitions (`SyncThreadMetadata`, `InboxThreadMetadata`, `ThreadMetadata`) into one canonical type. Update all 5 mutating route handlers plus sync and recovery to dual-write (columns + metadata_json). Update all read paths to read from columns. Retain `metadata_json` as a continuously-populated dual-write backup for rollback safety.

## Active tasks

- [x] TASK-01: D1 migration and backfill
- [x] TASK-02: Unified ThreadMetadata type and column mapper
- [x] TASK-03: Update write paths to dual-write
- [x] TASK-04: Update read paths and API serialization
- [x] TASK-05: Update test fixtures and add migration tests

## Goals

- Eliminate `JSON.parse` overhead on every metadata access
- Enable SQL-level indexing and querying of promoted fields
- Unify three divergent metadata type definitions into one canonical type
- Maintain API contract stability (summary fields + full `metadata` response object)
- Preserve backward compatibility via dual-write to metadata_json

## Non-goals

- Normalizing other JSON columns (`payload_json`, `quality_json`, `interpret_json`)
- Redesigning the inbox data model beyond metadata promotion
- Dropping `metadata_json` column (separate future cleanup)
- Adding new queryable features (e.g. search by guest name)

## Constraints & Assumptions

- Constraints:
  - D1 (SQLite) with forward-only sequential SQL migrations (next: 0006)
  - No ORM -- hand-written D1 prepared statements
  - Production data exists; migration must be non-destructive
  - Thread detail API returns full parsed metadata object to client
  - `guestRoomNumbers` is an array; stored as JSON TEXT column
  - `channel` is read-side only -- no column needed
- Assumptions:
  - Row count is modest (hundreds to low thousands); backfill is trivial
  - Single-operator system; brief deployment pause acceptable

## Inherited Outcome Contract

- **Why:** Important details about each email thread -- like the guest's name, their booking reference, and room number -- are all crammed into one text field. Every time the system needs any of these details, it has to unpack the entire blob. This is slow, error-prone, and makes it impossible to search or filter threads by guest name or booking reference directly. Moving the most-used fields into proper database columns would make the inbox faster and more reliable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A validated next action exists for metadata normalization, with target fields identified, migration strategy defined, and backward compatibility approach documented.
- **Source:** auto

## Analysis Reference

- Related analysis: `docs/plans/reception-inbox-metadata-normalization/analysis.md`
- Selected approach inherited:
  - Option B: Single-pass column promotion with uniform dual-write
- Key reasoning used:
  - Same 5 mutating handlers + 2 core modules must be updated regardless of phasing
  - Uniform dual-write simpler than tiered dual-write bookkeeping
  - Type unification cleaner when done atomically
  - Backfill trivial at modest row count

## Selected Approach Summary

- What was chosen:
  - Single migration adds 20 columns. Single code change updates all read/write paths. metadata_json retained via continuous dual-write for rollback safety.
- Why planning is not reopening option selection:
  - Analysis compared phased vs. single-pass vs. generated columns with explicit engineering coverage comparison. Single-pass won on simplicity and equivalent blast radius. No new information invalidates this.

## Fact-Find Support

- Supporting brief: `docs/plans/reception-inbox-metadata-normalization/fact-find.md`
- Evidence carried forward:
  - Complete 23-field metadata inventory with write/read consumer mapping
  - 5 mutating route handlers + 2 read-only handlers identified
  - D1 migration precedent (0001-0005 exist)
  - `json_extract` SQL query in `findStaleAdmittedThreads` for `needsManualDraft`
  - Thread detail API exposes full parsed metadata to client

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | D1 migration: add 20 columns + backfill from metadata_json | 90% | S | Complete (2026-03-12) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Unified ThreadMetadata type + column read mapper | 85% | M | Complete (2026-03-12) | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Update all write paths to dual-write (columns + metadata_json) | 85% | M | Complete (2026-03-12) | TASK-02 | TASK-05 |
| TASK-04 | IMPLEMENT | Update all read paths and API serialization | 85% | M | Complete (2026-03-12) | TASK-02, TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Update test fixtures + add migration/mapper tests | 80% | M | Complete (2026-03-12) | TASK-03, TASK-04 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A: no UI changes; UI reads already-serialized API fields | - | Backend-only migration |
| UX / states | N/A: API response shape unchanged; no user-facing behavior change | - | |
| Security / privacy | Required: PII fields (guest name, booking ref) become named columns; same auth boundary | TASK-01, TASK-02 | No new exposure; column names more discoverable in schema but not in API |
| Logging / observability / audit | Required: post-migration verification command to confirm backfill row count | TASK-01 | Existing telemetry events unaffected |
| Testing / validation | Required: update 13+ test fixtures; add migration + mapper unit tests | TASK-05 | |
| Data / contracts | Required: unified type; dual-write; API `metadata` response from columns | TASK-02, TASK-03, TASK-04 | |
| Performance / reliability | Required: replace `json_extract` with column query; add index on `needs_manual_draft` | TASK-01, TASK-04 | Marginal perf gain; main win is code clarity |
| Rollout / rollback | Required: additive migration; dual-write; rollback = deploy old code | TASK-01, TASK-03 | metadata_json remains populated |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Migration SQL only |
| 2 | TASK-02 | TASK-01 | Type + mapper foundation |
| 3 | TASK-03 | TASK-02 | Write paths first (modifies repositories.server.ts write functions) |
| 3b | TASK-04 | TASK-02, TASK-03 | Read paths after writes stabilize (both touch repositories.server.ts) |
| 4 | TASK-05 | TASK-03, TASK-04 | Test fixtures after code changes stabilize |

## Tasks

### TASK-01: D1 migration -- add 20 columns and backfill

- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/migrations/0006_inbox_metadata_columns.sql`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/reception/migrations/0006_inbox_metadata_columns.sql` (new), `[readonly] apps/reception/migrations/0001_inbox_init.sql`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 95% - standard SQLite ALTER TABLE ADD COLUMN; 5 prior migrations as precedent
  - Approach: 90% - analysis confirmed single-pass; 20 columns with NULL defaults
  - Impact: 90% - additive schema change; no existing data modified
- **Acceptance:**
  - [ ] Migration file `0006_inbox_metadata_columns.sql` adds all 20 columns to the `threads` table
  - [ ] Backfill statements populate new columns from `json_extract(metadata_json, ...)` for all existing rows
  - [ ] Index added on `needs_manual_draft` column
  - [ ] Migration uses plain `ALTER TABLE ... ADD COLUMN` (not idempotent; errors if column exists, but D1 sequential migrations guarantee single execution)
  - [ ] `guestRoomNumbers` stored as `guest_room_numbers_json TEXT`
  - [ ] Boolean fields (`needs_manual_draft`, `last_draft_quality_passed`) stored as INTEGER (0/1/NULL)
- **Engineering Coverage:**
  - UI / visual: N/A - migration only
  - UX / states: N/A - migration only
  - Security / privacy: Required - PII columns added (guest_first_name, guest_last_name, guest_booking_ref); same D1 access controls
  - Logging / observability / audit: Required - post-migration verification: run `wrangler d1 execute reception-inbox --remote --command "SELECT COUNT(*) as total, COUNT(needs_manual_draft) as backfilled FROM threads"` to confirm backfill coverage
  - Testing / validation: Required - migration tested in TASK-05
  - Data / contracts: Required - schema change; column names follow snake_case convention matching existing schema
  - Performance / reliability: Required - index on needs_manual_draft replaces json_extract query
  - Rollout / rollback: Required - additive only; old code ignores new columns
- **Validation contract (TC-01):**
  - TC-01: Apply migration to empty database -> all 20 columns exist with NULL defaults, index on needs_manual_draft
  - TC-02: Apply migration to database with existing rows -> backfill populates columns from metadata_json
  - TC-03: Rows with NULL metadata_json -> new columns remain NULL (no error)
  - TC-04: Rows with partial metadata_json (missing some fields) -> present fields populated, missing fields NULL
- **Execution plan:**
  1. Write migration SQL: 20 `ALTER TABLE threads ADD COLUMN` statements
  2. Write backfill: 20 `UPDATE threads SET <col> = json_extract(metadata_json, '$.<field>')` statements
  3. Write index: `CREATE INDEX IF NOT EXISTS idx_threads_needs_manual_draft ON threads(needs_manual_draft)`
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: well-understood SQLite DDL
- **Edge Cases & Hardening:**
  - Rows with malformed metadata_json: `json_extract` returns NULL on parse failure -- safe
  - `guestRoomNumbers` is a JSON array in the blob; `json_extract` returns it as a JSON string -- correct for `guest_room_numbers_json TEXT`
  - Boolean fields: `json_extract` returns 1/0/null for boolean values -- correct for INTEGER column
- **What would make this >=90%:** Already at 90%. Local D1 test would confirm.
- **Rollout / rollback:**
  - Rollout: `wrangler d1 migrations apply --remote` before code deploy
  - Rollback: new columns are ignored by old code; no rollback needed for schema
- **Documentation impact:** None
- **Notes / references:**
  - Column list from analysis field promotion table (20 fields)
  - `channel` explicitly excluded (read-side only)
  - `gmailHistoryId` and `lastSyncMode` explicitly excluded (sync-internal)

### TASK-02: Unified ThreadMetadata type and column read mapper

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/reception/src/lib/inbox/api-models.server.ts` with unified type and column-aware mapper
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/lib/inbox/api-models.server.ts`, `apps/reception/src/lib/inbox/repositories.server.ts`, `apps/reception/src/lib/inbox/sync.server.ts`, `apps/reception/src/lib/inbox/recovery.server.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 85% - straightforward type consolidation; 3 types -> 1
  - Approach: 90% - analysis confirmed unified type
  - Impact: 85% - foundation for all subsequent tasks; type errors caught at compile time
- **Acceptance:**
  - [ ] Single canonical `ThreadMetadata` type exported from `api-models.server.ts` (or a new `thread-metadata.ts` module)
  - [ ] `InboxThreadMetadata`, `SyncThreadMetadata` (sync.server.ts), and `ThreadMetadata` (recovery.server.ts) all removed or aliased to canonical type
  - [ ] New `parseThreadMetadataFromRow(row: InboxThreadRow)` function reads from columns with metadata_json fallback: `row.guest_first_name ?? parsed.guestFirstName`
  - [ ] Existing `parseThreadMetadata(raw: string | null | undefined)` kept as internal helper (called by the new row-based function for fallback)
  - [ ] `InboxThreadRow` type updated in `repositories.server.ts` to include all 20 new columns as optional properties
  - [ ] `channel` field remains on the type but is not read from a column (computed by `resolveInboxChannelAdapter`)
  - [ ] `gmailHistoryId` and `lastSyncMode` remain in metadata_json only; accessed via fallback parse
- **Engineering Coverage:**
  - UI / visual: N/A - type changes only
  - UX / states: N/A - no behavior change
  - Security / privacy: N/A - type definitions; no new exposure
  - Logging / observability / audit: N/A - no runtime behavior change
  - Testing / validation: Required - type compilation validates; runtime tests in TASK-05
  - Data / contracts: Required - unified type is the new contract; all consumers must use it
  - Performance / reliability: N/A - type-level change
  - Rollout / rollback: N/A - ships with code; rollback = deploy old code
- **Validation contract (TC-02):**
  - TC-05: TypeScript compiles with unified type replacing all three old types
  - TC-06: `parseThreadMetadataFromRow()` with row containing new columns returns correct object
  - TC-07: `parseThreadMetadataFromRow()` with row missing new columns (NULL) falls back to metadata_json
  - TC-08: `parseThreadMetadataFromRow()` with both column values and metadata_json returns column values (column takes precedence)
- **Execution plan:**
  1. Define canonical `ThreadMetadata` type with all 23 fields (20 promoted + 3 metadata_json-only)
  2. Update `InboxThreadRow` to include 20 new optional columns
  3. Create new `parseThreadMetadataFromRow(row: InboxThreadRow)` that reads columns first, falls back to `JSON.parse(row.metadata_json)` for missing values
  4. Keep existing `parseThreadMetadata(raw: string)` as internal helper used by the row-based function for fallback parsing
  5. Remove `SyncThreadMetadata` from sync.server.ts; import canonical type
  6. Remove `ThreadMetadata` from recovery.server.ts; import canonical type
  7. Remove `InboxThreadMetadata` from api-models.server.ts; replace with canonical type
  8. Verify TypeScript compilation
- **Consumer tracing:**
  - `parseThreadMetadata(raw)` is consumed by 10 call sites that pass `record.thread.metadata_json` or `row.metadata_json`. These call sites are NOT updated in this task -- they are migrated in TASK-04 to call `parseThreadMetadataFromRow(row)` instead, which passes the full row (including columns) to the new function.
  - `InboxThreadRow` is consumed by: `listThreads()`, `getThread()`, `createThread()`, `updateThreadStatus()`, `findStaleAdmittedThreads()`, `listThreadsWithLatestDraft()`. Adding optional properties is backward-compatible.
- **Planning validation (required for M/L):**
  - Checks run: verified all 3 type definitions in fact-find field inventory
  - Validation artifacts: fact-find field inventory table (23 fields)
  - Unexpected findings: none
- **Scouts:** None: type consolidation is well-understood
- **Edge Cases & Hardening:**
  - Rows written by old code (before migration): columns are NULL; mapper falls back to metadata_json -- correct
  - Rows written by new code: columns populated; metadata_json also populated via dual-write -- column takes precedence
  - `channel` field: not a column; always parsed from metadata_json or computed by adapter -- unchanged behavior
- **What would make this >=90%:** Prototype mapper tested against real D1 row fixtures
- **Rollout / rollback:**
  - Rollout: code deploys after migration applied
  - Rollback: deploy old code; old type definitions still work with metadata_json
- **Documentation impact:** None
- **Notes / references:** The mapper must handle the `ThreadWithLatestDraftRow` type used by `listThreadsWithLatestDraft()` as well

### TASK-03: Update all write paths to dual-write

- **Type:** IMPLEMENT
- **Deliverable:** Updated write paths in sync, recovery, and 5 mutating route handlers
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/lib/inbox/sync.server.ts`, `apps/reception/src/lib/inbox/recovery.server.ts`, `apps/reception/src/lib/inbox/repositories.server.ts`, `apps/reception/src/app/api/mcp/inbox/[threadId]/dismiss/route.ts`, `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts`, `apps/reception/src/app/api/mcp/inbox/[threadId]/resolve/route.ts`, `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts`, `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% - 7 write sites identified; spread-merge pattern is consistent
  - Approach: 90% - dual-write is the standard migration pattern
  - Impact: 85% - must not miss any write path or columns drift from metadata_json
- **Acceptance:**
  - [ ] `buildThreadUpsertStatement()` in sync.server.ts writes to all 20 new columns + metadata_json
  - [ ] `updateThreadStatus()` in repositories.server.ts writes to affected columns + metadata_json
  - [ ] `createThread()` in repositories.server.ts writes to columns + metadata_json
  - [ ] All 5 mutating route handlers (`dismiss`, `send`, `resolve`, `draft` PUT, `draft/regenerate`) continue to work via `updateThreadStatus()` -- no direct SQL changes needed in routes
  - [ ] `findStaleAdmittedThreads()` query updated: replace `json_extract(t.metadata_json, '$.needsManualDraft')` with direct `t.needs_manual_draft` column reference
  - [ ] metadata_json continues to be populated with full JSON blob on every write
- **Engineering Coverage:**
  - UI / visual: N/A - backend write paths only
  - UX / states: N/A - no behavior change
  - Security / privacy: N/A - same data written; column format only
  - Logging / observability / audit: N/A - existing telemetry events unchanged
  - Testing / validation: Required - tested in TASK-05
  - Data / contracts: Required - dual-write ensures metadata_json stays current for rollback
  - Performance / reliability: Required - `findStaleAdmittedThreads` uses indexed column instead of json_extract
  - Rollout / rollback: Required - dual-write enables safe rollback to old code
- **Validation contract (TC-03):**
  - TC-09: After sync processes a thread -> both columns and metadata_json contain matching values
  - TC-10: After recovery updates a thread -> both columns and metadata_json contain matching values
  - TC-11: After dismiss/send/resolve/draft-save/regenerate -> both columns and metadata_json contain matching values
  - TC-12: `findStaleAdmittedThreads()` returns correct threads using column-based query (no json_extract)
  - TC-13: Existing spread-merge pattern preserves non-updated columns (e.g. dismiss only changes `needs_manual_draft`)
- **Execution plan:**
  1. Update `buildThreadUpsertStatement()` INSERT/UPDATE to include all 20 columns
  2. Update `updateThreadStatus()` to write individual columns when metadata is provided
  3. Update `createThread()` to write columns from metadata input
  4. Replace `json_extract` in `findStaleAdmittedThreads()` with `t.needs_manual_draft`
  5. Ensure metadata_json continues to be populated (JSON.stringify of full metadata object)
  6. Verify all 5 route handlers work without direct changes (they call `updateThreadStatus()`)
- **Consumer tracing:**
  - `buildThreadUpsertStatement()` is called by `upsertThreadAndMessages()` in sync.server.ts -- one call site
  - `updateThreadStatus()` is called by: sync.server.ts (post-draft update), recovery.server.ts (2 sites), dismiss/route.ts, send/route.ts, resolve/route.ts, draft/route.ts PUT, draft/regenerate/route.ts -- 8 call sites total. All pass metadata as `Record<string, unknown>` which is unchanged.
  - `findStaleAdmittedThreads()` is called by recovery.server.ts -- one call site
- **Planning validation (required for M/L):**
  - Checks run: traced all write paths from fact-find entry points
  - Validation artifacts: fact-find blast radius list (5 mutating handlers + sync + recovery)
  - Unexpected findings: none
- **Scouts:** None: write paths fully enumerated in fact-find
- **Edge Cases & Hardening:**
  - Partial metadata updates (e.g. dismiss only sets `needsManualDraft: false`): `updateThreadStatus` only writes columns that are in the metadata input; unmentioned columns remain unchanged
  - `guestRoomNumbers` array: serialize to JSON string for `guest_room_numbers_json` column
  - Boolean to INTEGER: `needsManualDraft: true` -> `1`, `false` -> `0`, `undefined` -> `NULL`
- **What would make this >=90%:** All write paths verified with integration tests
- **Rollout / rollback:**
  - Rollout: code deploys after TASK-01 migration
  - Rollback: deploy old code; metadata_json is still current (dual-write ensures this)
- **Documentation impact:** None
- **Notes / references:** The key insight is that route handlers don't write SQL directly -- they all go through `updateThreadStatus()`. So the write-path update is concentrated in `repositories.server.ts` and `sync.server.ts`.

### TASK-04: Update all read paths and API serialization

- **Type:** IMPLEMENT
- **Deliverable:** Updated read paths in api-models, repositories queries, and route handlers
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/lib/inbox/api-models.server.ts`, `apps/reception/src/lib/inbox/repositories.server.ts`, `apps/reception/src/app/api/mcp/inbox/[threadId]/route.ts`, `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts`
- **Depends on:** TASK-02, TASK-03 (both touch `repositories.server.ts`; write paths must stabilize before read path changes)
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% - read paths are well-mapped from fact-find
  - Approach: 90% - column reads with metadata_json fallback via unified mapper
  - Impact: 85% - API response must be identical; client reads metadata object directly
- **Acceptance:**
  - [ ] All 10 call sites of `parseThreadMetadata(record.thread.metadata_json)` migrated to `parseThreadMetadataFromRow(record.thread)` or `parseThreadMetadataFromRow(row)` -- passing the full row object instead of just the JSON string
  - [ ] `buildThreadSummary()` reads from columns via unified mapper (TASK-02 `parseThreadMetadataFromRow`)
  - [ ] `buildThreadSummaryFromRow()` reads from columns (ThreadWithLatestDraftRow includes new columns)
  - [ ] Thread detail endpoint (`[threadId]/route.ts` GET) returns `metadata` field built from columns (same shape as current `parseThreadMetadata` output)
  - [ ] `draft/route.ts` GET reads `needsManualDraft` from column
  - [ ] `listThreads()` and `listThreadsWithLatestDraft()` SQL queries include new columns in SELECT
  - [ ] `getThread()` SQL query includes new columns in SELECT
  - [ ] API response shape is byte-for-byte identical for existing fields (no renames, no type changes)
- **Engineering Coverage:**
  - UI / visual: N/A - API response shape unchanged; UI reads same fields
  - UX / states: N/A - no behavior change
  - Security / privacy: N/A - same data exposed; column source instead of blob parse
  - Logging / observability / audit: N/A - no runtime behavior change
  - Testing / validation: Required - tested in TASK-05
  - Data / contracts: Required - API contract must be stable; `metadata` response field must return same object shape
  - Performance / reliability: Required - eliminates JSON.parse on every read; modest but real improvement
  - Rollout / rollback: N/A - code change; rollback = deploy old code
- **Validation contract (TC-04):**
  - TC-14: `buildThreadSummary()` returns identical object shape as current implementation
  - TC-15: `buildThreadSummaryFromRow()` returns identical object shape as current implementation
  - TC-16: Thread detail endpoint `metadata` field contains all expected properties including `guestCheckIn`, `guestCheckOut`, `guestRoomNumbers`
  - TC-17: `listThreads()` returns rows with all new columns populated
  - TC-18: Thread with NULL columns (pre-migration data) falls back to metadata_json parse
- **Execution plan:**
  1. Update `listThreads()` SELECT to include 20 new columns
  2. Update `listThreadsWithLatestDraft()` SELECT to include 20 new columns
  3. Update `getThread()` SELECT to include 20 new columns
  4. Update `buildThreadSummary()` to use unified mapper (already done in TASK-02; verify integration)
  5. Update `buildThreadSummaryFromRow()` to read from row columns
  6. Update `[threadId]/route.ts` to build metadata response from columns
  7. Update `draft/route.ts` GET to read `needsManualDraft` from column
- **Consumer tracing:**
  - `buildThreadSummary()` output consumed by: `[threadId]/route.ts` (thread field), inbox list route. Same shape returned -- no downstream changes.
  - `buildThreadSummaryFromRow()` output consumed by: inbox list route. Same shape returned.
  - `metadata` response field consumed by: `ThreadDetailPane.tsx` (reads `guestCheckIn`, `guestCheckOut`, `guestRoomNumbers`), `useInbox.ts` client hook. Same shape returned -- no client changes.
  - Consumer `isThreadVisibleInInbox()` reads `latest_message_direction` which is already a computed subquery, not from metadata_json -- unchanged.
- **Planning validation (required for M/L):**
  - Checks run: verified all read paths from fact-find; confirmed API response shape from `[threadId]/route.ts`
  - Validation artifacts: fact-find entry points list
  - Unexpected findings: none
- **Scouts:** None: read paths fully enumerated
- **Edge Cases & Hardening:**
  - `guestRoomNumbers` column contains JSON array string; `parseThreadMetadata` must parse it back to `string[]`
  - `channel` not in columns; mapper reads from metadata_json fallback or returns null for column-based path
  - `gmailHistoryId` and `lastSyncMode` not in columns; sync.server.ts `parseMetadata` still reads these from metadata_json directly (separate from the unified mapper)
- **What would make this >=90%:** API response snapshot tests confirm identical output
- **Rollout / rollback:**
  - Rollout: deploys with TASK-03 code
  - Rollback: deploy old code; reads from metadata_json as before
- **Documentation impact:** None
- **Notes / references:** TASK-04 depends on TASK-03 because both modify `repositories.server.ts`. Write paths (TASK-03) must stabilize first so read path changes (TASK-04) merge cleanly.

### TASK-05: Update test fixtures and add migration tests

- **Type:** IMPLEMENT
- **Deliverable:** Updated test fixtures across 13+ test files; new migration and mapper unit tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts`, `apps/reception/src/lib/inbox/__tests__/recovery.server.test.ts`, `apps/reception/src/lib/inbox/__tests__/telemetry.server.test.ts`, `apps/reception/src/app/api/mcp/__tests__/inbox.route.test.ts`, `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts`, `apps/reception/src/app/api/mcp/__tests__/inbox-draft.route.test.ts`, `apps/reception/src/components/inbox/__tests__/presentation.test.ts`, `apps/reception/src/components/inbox/__tests__/filters.test.ts`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% - 13+ test files need fixture updates; volume is the challenge
  - Approach: 85% - straightforward fixture updates; new tests for mapper
  - Impact: 80% - must not break existing test assertions
- **Acceptance:**
  - [ ] All existing inbox tests pass with new schema (columns present in fixtures)
  - [ ] Test fixtures include both column values and metadata_json for backward compatibility testing
  - [ ] New unit test for unified `parseThreadMetadata` mapper: column-only, metadata_json-only, mixed, NULL cases
  - [ ] New unit test for `findStaleAdmittedThreads` column-based query (replaces json_extract)
  - [ ] Test helper function created for building `InboxThreadRow` fixtures with new columns
  - [ ] No test regressions in CI
- **Engineering Coverage:**
  - UI / visual: N/A - test files only
  - UX / states: N/A - test files only
  - Security / privacy: N/A - test files only
  - Logging / observability / audit: N/A - test files only
  - Testing / validation: Required - this IS the testing task
  - Data / contracts: Required - fixtures validate the new column contract
  - Performance / reliability: N/A - test files only
  - Rollout / rollback: N/A - test files only
- **Validation contract (TC-05):**
  - TC-19: All existing inbox tests pass with updated fixtures (no regressions)
  - TC-20: Unified mapper tests cover: column-only row, metadata_json-only row, mixed row, all-NULL row
  - TC-21: `findStaleAdmittedThreads` test verifies column-based filtering works correctly
  - TC-22: Test helper produces valid `InboxThreadRow` with all 20 new columns
- **Execution plan:**
  1. Create test helper function for building `InboxThreadRow` fixtures with new columns
  2. Update recovery.server.test.ts fixtures (currently uses `metadata_json: null` and `metadata_json: JSON.stringify(...)`)
  3. Update telemetry.server.test.ts fixtures
  4. Update inbox route test fixtures
  5. Add unit tests for unified `parseThreadMetadata` mapper
  6. Add unit test for `findStaleAdmittedThreads` column-based query
  7. Push changes; wait for CI to trigger, then `gh run watch` on the triggered run to verify all tests pass; fix any regressions and re-push
- **Planning validation (required for M/L):**
  - Checks run: identified all test files referencing `metadata_json` from fact-find grep results
  - Validation artifacts: fact-find test landscape section
  - Unexpected findings: none
- **Scouts:** None: test files enumerated in fact-find
- **Edge Cases & Hardening:**
  - Test fixtures with `metadata_json: null` must continue to work (columns also NULL)
  - Test fixtures with `metadata_json: JSON.stringify(...)` must include corresponding column values
  - Mock D1 database in tests must support new columns in prepared statements
- **What would make this >=90%:** Full CI green with all fixture updates
- **Rollout / rollback:**
  - Rollout: ships with code changes
  - Rollback: not applicable (test files revert with code rollback)
- **Documentation impact:** None
- **Notes / references:** Consider a shared `buildTestThreadRow()` factory to reduce fixture duplication across test files

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: D1 migration | Yes -- no dependencies | None | No |
| TASK-02: Unified type + mapper | Yes -- TASK-01 provides columns | None | No |
| TASK-03: Write path dual-write | Yes -- TASK-02 provides type | None -- route handlers delegate to `updateThreadStatus()` which centralizes writes | No |
| TASK-04: Read path update | Yes -- TASK-02 provides mapper; TASK-03 stabilizes repositories.server.ts writes | None -- read paths use existing query functions; only SELECT lists and call sites change | No |
| TASK-05: Test fixtures | Yes -- TASK-03 and TASK-04 provide stable code | None -- test fixtures update to match new schema | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Large PR with 10+ files changed | Medium | Low | Split into sub-PRs per task if review burden is too high |
| Missed write path causes column/metadata_json drift | Low | Medium | Explicit checklist of all 7 write sites (5 handlers + sync + recovery); all go through `updateThreadStatus()` or `buildThreadUpsertStatement()` |
| Test fixture volume causes unexpected regressions | Medium | Low | Test helper factory function; run CI early and often |
| `guestRoomNumbers` JSON array deserialization edge case | Low | Low | Explicit test case for array round-trip through column |
| metadata_json fallback masking missed column write | Low | Medium | Integration tests verify column values match metadata_json values |

## Observability

- Logging: post-migration verification via `wrangler d1 execute reception-inbox --remote` to confirm backfill coverage
- Metrics: none new; existing telemetry unchanged
- Alerts/Dashboards: none new

## Acceptance Criteria (overall)

- [ ] All 20 columns exist on the `threads` table with correct types
- [ ] All existing inbox tests pass (no regressions)
- [ ] API response shape is identical for both list and detail endpoints
- [ ] ThreadDetailPane renders guest context (check-in, check-out, room numbers) correctly
- [ ] `findStaleAdmittedThreads` uses column-based query instead of json_extract
- [ ] metadata_json continues to be populated on every write (dual-write)
- [ ] Three old type definitions replaced by single canonical `ThreadMetadata`
- [ ] TypeScript compilation passes

## Decision Log

- 2026-03-12: Analysis chose Option B (single-pass column promotion) over phased and generated-column approaches
- 2026-03-12: `channel` excluded from column promotion (read-side only, computed by adapter)
- 2026-03-12: `gmailHistoryId` and `lastSyncMode` excluded from column promotion (sync-internal only)
- 2026-03-12: `guestRoomNumbers` stored as `guest_room_numbers_json TEXT` (JSON array string)

## Overall-confidence Calculation

- TASK-01: 90% * S(1) = 90
- TASK-02: 85% * M(2) = 170
- TASK-03: 85% * M(2) = 170
- TASK-04: 85% * M(2) = 170
- TASK-05: 80% * M(2) = 160
- Sum = 760, Weight = 9
- Overall-confidence = 760/9 = 84.4% -> **85%**
