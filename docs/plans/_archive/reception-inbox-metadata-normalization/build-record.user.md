---
Type: Build-Record
Status: Complete
Domain: Data
Last-reviewed: "2026-03-12"
Feature-Slug: reception-inbox-metadata-normalization
Execution-Track: code
Completed-date: "2026-03-12"
artifact: build-record
Build-Event-Ref: docs/plans/reception-inbox-metadata-normalization/build-event.json
---

# Build Record: Reception Inbox Metadata Normalization

## Outcome Contract

- **Why:** Important details about each email thread -- like the guest's name, their booking reference, and room number -- are all crammed into one text field. Every time the system needs any of these details, it has to unpack the entire blob. This is slow, error-prone, and makes it impossible to search or filter threads by guest name or booking reference directly. Moving the most-used fields into proper database columns would make the inbox faster and more reliable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A validated next action exists for metadata normalization, with target fields identified, migration strategy defined, and backward compatibility approach documented.
- **Source:** auto

## What Was Built

**TASK-01 (D1 migration):** Created `apps/reception/migrations/0006_inbox_metadata_columns.sql` adding 20 columns to the `threads` table via `ALTER TABLE ADD COLUMN` statements. Backfill populates new columns from `json_extract(metadata_json, ...)` for existing rows. Added index on `needs_manual_draft` for query performance.

**TASK-02 (Unified type and mapper):** Consolidated three divergent metadata type definitions (`SyncThreadMetadata` in sync.server.ts, `InboxThreadMetadata` in api-models.server.ts, `ThreadMetadata` in recovery.server.ts) into a single canonical `ThreadMetadata` type exported from `api-models.server.ts`. Created `parseThreadMetadataFromRow(row: InboxThreadRow)` that reads columns first with `metadata_json` fallback. Updated `InboxThreadRow` to include all 20 new optional columns.

**TASK-03 (Dual-write):** Updated `buildThreadUpsertStatement()` in sync.server.ts and `updateThreadStatus()`/`createThread()` in repositories.server.ts to write both columns and metadata_json on every mutation. Introduced `METADATA_COLUMN_MAP`, `BOOLEAN_COLUMNS`, `ARRAY_COLUMNS` sets, and `metadataValueForColumn()` helper for type coercion (boolean to 0/1, array to JSON string). Replaced `json_extract(t.metadata_json, '$.needsManualDraft')` with direct `t.needs_manual_draft` column reference in `findStaleAdmittedThreads()`.

**TASK-04 (Read path migration):** Migrated all 10 call sites from `parseThreadMetadata(record.thread.metadata_json)` to `parseThreadMetadataFromRow(record.thread)`. Updated all SELECT queries in `listThreads()`, `listThreadsWithLatestDraft()`, and `getThread()` to include the 20 new columns. Updated `buildThreadSummary()` and `buildThreadSummaryFromRow()` to use the column-aware mapper.

**TASK-05 (Tests):** Created `api-models.server.test.ts` with unit tests for `parseThreadMetadataFromRow` covering: all-NULL rows, column reads, metadata_json fallback, column precedence over metadata_json, malformed JSON handling, guestRoomNumbers array parsing, and legacy `parseThreadMetadata` string parser.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `npx tsc --noEmit --project apps/reception/tsconfig.json` | Pass | Full TypeScript compilation clean after all changes |

## Workflow Telemetry Summary

- Feature slug: `reception-inbox-metadata-normalization`
- Records: 4 (fact-find, analysis, plan, build)
- Token measurement coverage: 0.0%

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes |
|---|---:|---:|---:|---:|
| lp-do-fact-find | 1 | 1.00 | 49227 | 30099 |
| lp-do-analysis | 1 | 1.00 | 66481 | 16680 |
| lp-do-plan | 1 | 1.00 | 96460 | 34402 |
| lp-do-build | 1 | 2.00 | 94569 | 6795 |

- Total context input bytes: 306737
- Total artifact bytes: 87976
- Total modules: 5, deterministic checks: 6

## Validation Evidence

### TASK-01
- TC-01: Migration SQL adds all 20 columns with NULL defaults via ALTER TABLE ADD COLUMN
- TC-02: Backfill UPDATE uses json_extract to populate columns from existing metadata_json
- TC-03: Rows with NULL metadata_json: json_extract returns NULL, columns remain NULL
- TC-04: Partial metadata_json: json_extract returns NULL for missing fields, populates present ones

### TASK-02
- TC-05: TypeScript compiles with unified ThreadMetadata replacing all three old types
- TC-06: parseThreadMetadataFromRow with row containing columns returns correct values (test: "reads promoted columns when present")
- TC-07: parseThreadMetadataFromRow with NULL columns falls back to metadata_json (test: "falls back to metadata_json when columns are NULL")
- TC-08: Column values take precedence over metadata_json (test: "column values take precedence over metadata_json")

### TASK-03
- TC-09: buildThreadUpsertStatement includes all 20 columns in INSERT/UPDATE with type coercion
- TC-10: updateThreadStatus writes affected columns plus metadata_json
- TC-11: Route handlers delegate to updateThreadStatus; dual-write is automatic
- TC-12: findStaleAdmittedThreads uses t.needs_manual_draft column directly
- TC-13: METADATA_COLUMN_MAP + metadataValueForColumn handles boolean/array/string coercion

### TASK-04
- TC-14: buildThreadSummary uses parseThreadMetadataFromRow; returns identical shape
- TC-15: buildThreadSummaryFromRow uses parseThreadMetadataFromRow; returns identical shape
- TC-16: All SELECT queries include 20 new columns
- TC-17: All 10 call sites migrated from parseThreadMetadata(string) to parseThreadMetadataFromRow(row)
- TC-18: NULL column rows fall back to metadata_json parse (tested in api-models.server.test.ts)

### TASK-05
- TC-19: api-models.server.test.ts covers all mapper scenarios
- TC-20: Tests cover column-only, metadata_json-only, mixed, and all-NULL rows
- TC-21: findStaleAdmittedThreads column-based filtering tested via column reference in SQL
- TC-22: buildTestThreadRow helper produces valid InboxThreadRow with all 20 new columns

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A: no UI changes; backend-only migration | API response shape unchanged |
| UX / states | N/A: no user-facing behavior change | Same metadata surfaced through same API fields |
| Security / privacy | Covered: PII fields (guest_first_name, guest_last_name, guest_booking_ref) become named columns; same D1 access controls | No new exposure surface |
| Logging / observability / audit | Covered: post-migration verification via wrangler d1 execute command | Existing telemetry events unchanged |
| Testing / validation | Covered: api-models.server.test.ts with 7 test cases for parseThreadMetadataFromRow + 4 for legacy parser | TypeScript compilation passes clean |
| Data / contracts | Covered: unified ThreadMetadata type; dual-write; API metadata response from columns with fallback | All consumers migrated |
| Performance / reliability | Covered: json_extract replaced with indexed column query in findStaleAdmittedThreads | Main gain is code clarity and queryability |
| Rollout / rollback | Covered: additive migration; dual-write keeps metadata_json current; rollback = deploy old code | No destructive schema changes |

## Scope Deviations

None.
