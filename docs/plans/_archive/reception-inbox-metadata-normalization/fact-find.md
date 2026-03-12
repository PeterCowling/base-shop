---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Data
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: reception-inbox-metadata-normalization
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-inbox-metadata-normalization/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312120000-0004
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Inbox Metadata Normalization Fact-Find Brief

## Scope

### Summary

Thread metadata in the reception inbox is stored as a JSON string in a single `metadata_json TEXT` column on the `threads` table. This includes guest details (name, booking reference, room numbers, check-in/out dates), admission outcomes, draft generation stats, sync state, and failure tracking. Every consumer must call `JSON.parse` on access, and no metadata field can be indexed or queried at the SQL level -- except one `json_extract` call for `needsManualDraft` in the stale thread recovery query.

The proposed change is to promote frequently-accessed and query-filtered metadata fields to dedicated columns on the `threads` table, improving query performance, type safety, and developer ergonomics.

### Goals

- Identify which metadata fields exist and how they are used (read vs. write, query vs. display)
- Map the full consumption surface of `metadata_json` across the codebase
- Assess the D1/Cloudflare migration approach for schema changes
- Determine backward compatibility strategy for incremental rollout
- Produce evidence sufficient for analysis of migration approaches

### Non-goals

- Writing migration code or implementing any schema changes
- Redesigning the inbox data model beyond metadata normalization
- Addressing `payload_json`, `quality_json`, `interpret_json`, or other JSON columns on different tables

### Constraints & Assumptions

- Constraints:
  - Reception uses Cloudflare D1 (SQLite) -- no Prisma, raw SQL migrations in `apps/reception/migrations/`
  - D1 migrations are sequential numbered SQL files applied via `wrangler d1 migrations apply`
  - Production data exists; migration must be non-destructive
  - No ORM layer -- all queries are hand-written D1 prepared statements
- Assumptions:
  - Row count is modest (hundreds to low thousands of threads, based on hostel email volume)
  - Downtime during migration is acceptable if brief (single-operator system)

## Outcome Contract

- **Why:** Important details about each email thread -- like the guest's name, their booking reference, and room number -- are all crammed into one text field. Every time the system needs any of these details, it has to unpack the entire blob. This is slow, error-prone, and makes it impossible to search or filter threads by guest name or booking reference directly. Moving the most-used fields into proper database columns would make the inbox faster and more reliable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A validated next action exists for metadata normalization, with target fields identified, migration strategy defined, and backward compatibility approach documented.
- **Source:** auto

## Discovery Contract Output

Not investigated: no `self_evolving.discovery_contract` present on the dispatch packet.

## Access Declarations

None. All evidence is from the local repository. No external services, APIs, or credentials needed.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/lib/inbox/sync.server.ts` -- `syncInbox()` and `processThread()`: primary metadata write path during Gmail sync
- `apps/reception/src/lib/inbox/recovery.server.ts` -- `recoverStaleThreads()`: reads and writes metadata during draft recovery
- `apps/reception/src/lib/inbox/api-models.server.ts` -- `buildThreadSummary()` and `buildThreadSummaryFromRow()`: primary metadata read path for API serialization
- `apps/reception/src/app/api/mcp/inbox/[threadId]/route.ts` -- returns both `buildThreadSummary(record)` AND `parseThreadMetadata(record.thread.metadata_json)` as separate `thread` and `metadata` response fields (line 76-78); the raw parsed metadata object is part of the client API contract
- `apps/reception/src/app/api/mcp/inbox/[threadId]/dismiss/route.ts` -- reads metadata, writes modified metadata on dismiss
- `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts` -- reads metadata, spread-merges with `needsManualDraft: false` and `lastDraftId` on send (line 80, 96-104)
- `apps/reception/src/app/api/mcp/inbox/[threadId]/resolve/route.ts` -- reads metadata, spread-merges with `needsManualDraft: false` on resolve (line 51-58)
- `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts` -- reads metadata for `needsManualDraft` (GET, line 83) and spread-merges on draft save (PUT, line 149, 183-191)
- `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts` -- reads metadata for guest context, writes updated draft tracking fields

### Key Modules / Files

1. `apps/reception/src/lib/inbox/repositories.server.ts` -- `InboxThreadRow` type definition, all CRUD operations, `findStaleAdmittedThreads()` with `json_extract` query
2. `apps/reception/src/lib/inbox/sync.server.ts` -- `SyncThreadMetadata` type (21 fields), `buildThreadMetadata()`, `parseMetadata()`
3. `apps/reception/src/lib/inbox/api-models.server.ts` -- `InboxThreadMetadata` type (16 fields), `parseThreadMetadata()`, `buildThreadSummary()`, `buildThreadSummaryFromRow()`
4. `apps/reception/src/lib/inbox/recovery.server.ts` -- `ThreadMetadata` type (with `recoveryAttempts`), `parseMetadata()`, metadata merge on recovery
5. `apps/reception/src/app/api/mcp/inbox/[threadId]/dismiss/route.ts` -- reads and merges metadata on thread dismissal
6. `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts` -- reads guest fields from metadata for draft context
7. `apps/reception/src/components/inbox/ThreadDetailPane.tsx` -- UI consumption of `guestFirstName`, `guestLastName`
8. `apps/reception/src/components/inbox/ThreadList.tsx` -- UI consumption of summary fields derived from metadata
9. `apps/reception/src/services/useInbox.ts` -- client-side types (`InboxThreadSummary`) that mirror API models
10. `apps/reception/migrations/0001_inbox_init.sql` -- original schema with `metadata_json TEXT`

### Patterns & Conventions Observed

- **Three separate `parseMetadata` functions** exist (sync, recovery, api-models), each with slightly different type signatures but identical parse logic -- evidence: `sync.server.ts:106`, `recovery.server.ts:60`, `api-models.server.ts:155`
- **Spread-merge pattern** for metadata updates: callers read existing metadata, spread it with new fields, and write back the entire blob -- evidence: `sync.server.ts:259-271`, `recovery.server.ts:268-284`, `dismiss/route.ts:95-98`
- **Sequential SQL migrations** numbered `0001` through `0004` -- evidence: `apps/reception/migrations/`
- **No Prisma or ORM** -- all database access is via raw D1 prepared statements with hand-written SQL

### Data & Contracts

- Types/schemas/events:
  - `SyncThreadMetadata` (sync.server.ts:49-71) -- 21 fields, superset of all metadata
  - `InboxThreadMetadata` (api-models.server.ts:18-36) -- 16 fields, API-facing subset (adds `channel`, omits sync-internal fields like `gmailHistoryId`, `lastSyncMode`, `lastProcessedAt`)
  - `ThreadMetadata` (recovery.server.ts:55-58) -- minimal type with `needsManualDraft` and `recoveryAttempts`
  - `InboxThreadSummaryApiModel` (api-models.server.ts:101-123) -- API response type that extracts specific metadata fields
  - `InboxThreadSummary` (useInbox.ts:40-62) -- client-side mirror of the API model
- Persistence:
  - `threads.metadata_json TEXT` -- nullable, stores `JSON.stringify(SyncThreadMetadata)`
  - D1 (SQLite) database `reception-inbox` bound as `RECEPTION_INBOX_DB`
  - Database ID: `f3ed1b8f-cb6a-4950-9bfa-8f85a0913db9`
- API/contracts:
  - `buildThreadSummary()` and `buildThreadSummaryFromRow()` extract specific metadata fields into the thread list response
  - **Thread detail endpoint** (`[threadId]/route.ts` line 78) returns BOTH `thread: buildThreadSummary(record)` AND `metadata: parseThreadMetadata(record.thread.metadata_json)` -- the full parsed metadata object is part of the client API contract. The UI reads `guestCheckIn`, `guestCheckOut`, and `guestRoomNumbers` directly from `threadDetail.metadata` (ThreadDetailPane.tsx lines 224-237)
  - This means migration must preserve the `metadata` response field shape, not just the `thread` summary fields

### Complete Metadata Field Inventory

All fields observed in `metadata_json` across all write paths (sync, recovery, route handlers) and the read-side API model. Note: `SyncThreadMetadata` (sync.server.ts:49-71) defines 21 fields; `recoveryAttempts` is added by recovery.server.ts; `channel` is a read-side concept from api-models.server.ts, not written by sync/recovery:

| Field | Type | Written by | Read by (query) | Read by (display) |
|---|---|---|---|---|
| `gmailHistoryId` | `string \| null` | sync | -- | -- |
| `latestInboundMessageId` | `string \| null` | sync | sync (dedup check) | -- |
| `latestInboundAt` | `string \| null` | sync | -- | -- |
| `latestInboundSender` | `string \| null` | sync | -- | -- |
| `latestAdmissionDecision` | `string \| null` | sync | -- | API summary |
| `latestAdmissionReason` | `string \| null` | sync | -- | API summary |
| `needsManualDraft` | `boolean` | sync, recovery, dismiss, regenerate | `findStaleAdmittedThreads` (json_extract SQL) | API summary, UI badge |
| `draftFailureCode` | `string \| null` | sync, recovery, regenerate | -- | API summary |
| `draftFailureMessage` | `string \| null` | sync, recovery, regenerate | -- | API summary |
| `lastProcessedAt` | `string \| null` | sync | -- | -- |
| `lastSyncMode` | `SyncMode \| null` | sync | -- | -- |
| `lastDraftId` | `string \| null` | sync, regenerate | -- | -- |
| `lastDraftTemplateSubject` | `string \| null` | sync, recovery | -- | -- |
| `lastDraftQualityPassed` | `boolean` | sync, recovery, regenerate | -- | -- |
| `guestBookingRef` | `string \| null` | sync, recovery | -- | API summary, regenerate context |
| `guestOccupantId` | `string \| null` | sync, recovery | -- | -- |
| `guestFirstName` | `string \| null` | sync, recovery | -- | API summary, regenerate context, UI display |
| `guestLastName` | `string \| null` | sync, recovery | -- | API summary, UI display |
| `guestCheckIn` | `string \| null` | sync, recovery | -- | UI display (ThreadDetailPane, via `metadata` API field) |
| `guestCheckOut` | `string \| null` | sync, recovery | -- | UI display (ThreadDetailPane, via `metadata` API field) |
| `guestRoomNumbers` | `string[] \| null` | sync, recovery | -- | UI display (ThreadDetailPane), regenerate context |
| `channel` | `InboxChannel \| null` | not in `SyncThreadMetadata`; read-side only, interpreted by `api-models.server.ts` and Prime mapping. Not populated by email sync/recovery write paths. | -- | API summary (channel routing via `resolveInboxChannelAdapter`) |
| `recoveryAttempts` | `number` | recovery | recovery (retry limit check) | -- |

### Dependency & Impact Map

- Upstream dependencies:
  - Gmail API (thread data, message content) via `gmail-client.ts`
  - Guest matcher (`guest-matcher.server.ts`) provides guest booking fields
  - Admission classifier (`admission.ts`) provides admission decision fields
  - Draft pipeline (`draft-pipeline.server.ts`) provides draft status/failure fields
- Downstream dependents:
  - All API routes under `apps/reception/src/app/api/mcp/inbox/` consume metadata via `parseThreadMetadata()`
  - UI components (`ThreadDetailPane`, `ThreadList`, `DraftReviewPanel`) consume API-serialized metadata fields
  - Recovery pipeline reads metadata to check retry counts and manual draft flags
  - Stale thread recovery query uses `json_extract(metadata_json, '$.needsManualDraft')` in SQL WHERE clause
- Likely blast radius:
  - `repositories.server.ts` -- all CRUD functions that read/write `metadata_json`
  - `sync.server.ts` -- `buildThreadMetadata()`, `buildThreadUpsertStatement()`, `processThread()`
  - `recovery.server.ts` -- `recoverSingleThread()`, `flagForManualDraft()`
  - `api-models.server.ts` -- `parseThreadMetadata()`, `buildThreadSummary()`, `buildThreadSummaryFromRow()`
  - **6 route handlers** that parse and spread-merge metadata:
    - `[threadId]/route.ts` (GET -- returns full parsed metadata in response)
    - `[threadId]/dismiss/route.ts` (POST -- merges `needsManualDraft: false`)
    - `[threadId]/send/route.ts` (POST -- merges `needsManualDraft`, `lastDraftId`)
    - `[threadId]/resolve/route.ts` (POST -- merges `needsManualDraft: false`)
    - `[threadId]/draft/route.ts` (GET reads `needsManualDraft`; PUT merges `needsManualDraft`, `lastDraftId`)
    - `[threadId]/draft/regenerate/route.ts` (POST -- merges draft tracking + guest context read)
  - `ThreadDetailPane.tsx` -- reads `metadata.guestCheckIn`, `metadata.guestCheckOut`, `metadata.guestRoomNumbers` directly from the API response
  - 13+ test files in `apps/reception/src/lib/inbox/__tests__/` and `apps/reception/src/app/api/mcp/__tests__/`

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest
- Commands: `pnpm --filter @apps/reception test` (CI-only per testing policy)
- CI integration: governed test runner

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Sync pipeline | Unit | `sync.server.test.ts` | Tests sync flow, metadata construction |
| Recovery pipeline | Unit | `recovery.server.test.ts` | Tests stale thread recovery, uses `metadata_json: null` and `metadata_json: JSON.stringify(...)` in fixtures |
| Admission classifier | Unit | `admission.test.ts` | Tests classification logic |
| Draft generation | Unit | `generate.test.ts`, `draft-pipeline.server.test.ts` | Tests draft pipeline |
| Thread interpretation | Unit | `interpret.test.ts` | Tests thread interpretation |
| Guest matcher | Unit | `guest-matcher.server.test.ts` | Tests email-to-guest matching |
| API routes | Integration | `inbox.route.test.ts`, `inbox-actions.route.test.ts`, `inbox-draft.route.test.ts` | Tests API endpoints |
| Presentation | Unit | `presentation.test.ts` | Tests UI presentation logic |
| Filters | Unit | `filters.test.ts` | Tests thread filtering |
| Telemetry | Unit | `telemetry.server.test.ts` | Tests event recording |

#### Coverage Gaps

- Untested paths:
  - No dedicated test for `parseThreadMetadata()` or `parseMetadata()` in isolation
  - No test for `buildThreadSummaryFromRow()` (the N+1-optimized list path)
  - `json_extract` query in `findStaleAdmittedThreads` has no unit test verifying the SQL filter
- Extinct tests:
  - None identified

#### Testability Assessment

- Easy to test: Migration SQL can be tested against a local D1 database; new column reads/writes are straightforward unit tests
- Hard to test: Verifying backward compatibility during rolling migration (old code reading new schema) requires integration-level testing
- Test seams needed: The three separate `parseMetadata` functions could be unified behind a single tested function

#### Recommended Test Approach

- Unit tests for: new column read/write in repositories, unified `parseMetadata` function, migration SQL correctness
- Integration tests for: API route responses with migrated schema, backward compatibility of metadata_json fallback
- Contract tests for: `InboxThreadSummaryApiModel` shape stability after migration

### Recent Git History (Targeted)

- `a890347292` -- checkpoint outstanding repo changes (recent, includes inbox modifications)
- `10b6a6243c` -- remove dead code candidates from reception
- `7b0414ddf6` -- added draft failure reason fields (`draftFailureCode`, `draftFailureMessage`) to metadata
- `719cb6183b` -- added thread filters (consumes `needsManualDraft` from metadata)
- `612efb38a6` -- added recovery pipeline (reads/writes metadata for `recoveryAttempts`, `needsManualDraft`)
- `ea63dee932` -- N+1 optimization with `listThreadsWithLatestDraft` (reads `metadata_json` in join query)
- `836fa1a446` -- added guest booking context (added `guestBookingRef`, `guestFirstName`, etc. to metadata)

Implication: metadata_json has grown organically through multiple feature additions. Each feature added fields to the blob rather than adding columns, creating the current state.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No UI changes -- metadata normalization is backend-only. UI consumes already-serialized API fields. | None | None |
| UX / states | N/A | No user-facing behavior changes. API response shape remains identical. | None | None |
| Security / privacy | Required | Guest PII (name, booking ref, room numbers) stored in metadata_json; no encryption. Auth via `requireStaffAuth`. | Column promotion does not change security posture but makes PII fields more visible in schema. No new risk. | Confirm PII handling unchanged |
| Logging / observability / audit | Required | `thread_events` table provides audit trail. `recordInboxEvent` logs sync/recovery/draft events with metadata. | No logging of schema migration itself. Should log migration completion. | Migration event logging |
| Testing / validation | Required | 13+ test files cover sync, recovery, API routes. Tests use `metadata_json: null` and `metadata_json: JSON.stringify(...)` in fixtures. | No test for `parseMetadata` in isolation. No test for `json_extract` SQL filter. Test fixtures will need updating for new columns. | Test fixture migration, parseMetadata consolidation |
| Data / contracts | Required | Three parallel type definitions (`SyncThreadMetadata`, `InboxThreadMetadata`, `ThreadMetadata`). API contract (`InboxThreadSummaryApiModel`) extracts specific fields. | Type fragmentation across three definitions. API contract must remain stable. | Type unification, API contract stability |
| Performance / reliability | Required | `json_extract` in `findStaleAdmittedThreads` is the only SQL-level metadata query. All other filtering happens in application code after `JSON.parse`. Row count is modest. | Current `json_extract` is slower than a direct column index. After migration, `needsManualDraft` becomes a proper indexed column. | Index design for promoted columns |
| Rollout / rollback | Required | D1 migrations are forward-only numbered SQL files. No built-in rollback mechanism. | Must use additive migration (add columns, keep `metadata_json`). Rollback = deploy old code that ignores new columns. | Additive migration strategy, dual-write period |

## Questions

### Resolved

- Q: What is the current InboxThreadRow schema? What fields exist in metadata_json?
  - A: `InboxThreadRow` has 11 columns (id, status, subject, snippet, assigned_uid, latest_message_at, latest_message_direction (computed), last_synced_at, metadata_json, created_at, updated_at). The `metadata_json` blob contains up to 23 distinct fields (see Complete Metadata Field Inventory above).
  - Evidence: `repositories.server.ts:32-44`, `sync.server.ts:49-71`

- Q: How is metadata_json populated?
  - A: Built by `buildThreadMetadata()` in sync.server.ts which spreads existing metadata with updated fields, then serialized via `JSON.stringify()`. Written via `updateThreadStatus()` from 7 call sites: sync (`upsertThreadAndMessages` + post-draft update), recovery (`recoverSingleThread`, `flagForManualDraft`), dismiss (`dismiss/route.ts`), send (`send/route.ts`), resolve (`resolve/route.ts`), draft save (`draft/route.ts` PUT), and draft regenerate (`draft/regenerate/route.ts`). All use the same spread-merge pattern (`{...existingMetadata, ...newFields}`) to preserve existing fields while updating specific ones.
  - Evidence: `sync.server.ts:251-271`, `send/route.ts:96-104`, `resolve/route.ts:51-58`, `draft/route.ts:183-191`

- Q: How is metadata_json consumed?
  - A: Parsed via three separate `parseMetadata`/`parseThreadMetadata` functions. Consumed in two main paths: (1) API serialization via `buildThreadSummary()`/`buildThreadSummaryFromRow()` which extracts specific fields into response objects, and (2) sync/recovery pipelines which read existing metadata to check for changes (latestInboundMessageId dedup, recoveryAttempts limit).
  - Evidence: `api-models.server.ts:155-158`, `sync.server.ts:106-117`, `recovery.server.ts:60-70`

- Q: Which metadata fields are used in queries/filters vs. only in display?
  - A: Only `needsManualDraft` is used in a SQL-level query (`json_extract` in `findStaleAdmittedThreads`). `latestInboundMessageId` is used for application-level dedup in sync. `recoveryAttempts` is used for retry limit checks in recovery. `channel` is used for channel routing in API serialization. All other fields are display-only (passed through to API response or used as context for draft generation).
  - Evidence: `repositories.server.ts:1081-1083`, `sync.server.ts:578-579`, `recovery.server.ts:153`

- Q: What's the D1/Cloudflare migration approach?
  - A: Sequential numbered SQL files in `apps/reception/migrations/`. Currently 4 migrations (0001-0004). Applied via `wrangler d1 migrations apply`. D1 supports standard SQLite `ALTER TABLE ADD COLUMN`. No Prisma, no ORM, no rollback mechanism.
  - Evidence: `apps/reception/migrations/0001_inbox_init.sql` through `0004_inbox_draft_original_text.sql`

- Q: What backward compatibility concerns exist?
  - A: The spread-merge pattern (`{...existingMetadata, ...newFields}`) means existing metadata fields are preserved during updates. An additive migration (add columns + keep metadata_json) allows: (1) old code to continue reading from metadata_json, (2) new code to read from columns with metadata_json fallback, (3) backfill script to populate columns from existing metadata_json. **Important:** the thread detail API (`[threadId]/route.ts` line 78) returns `metadata: parseThreadMetadata(record.thread.metadata_json)` as a full object, meaning the client depends on the full metadata shape -- not just the summary fields. The `metadata` response field must continue to return the same shape during and after migration (either from columns reconstituted into the object, or by keeping metadata_json populated).
  - Evidence: `[threadId]/route.ts:78`, `ThreadDetailPane.tsx:224-237` (reads `metadata.guestCheckIn/Out/RoomNumbers`)

- Q: What's the estimated row count / data volume?
  - A: The system processes hostel guest emails for a single property (Hostel Positano). With cron sync running every minute, the inbox accumulates threads over a 30-day rescan window. Estimated volume: hundreds to low thousands of threads. This is well within D1's limits and means migration/backfill can run in a single batch.
  - Evidence: `sync.server.ts:44` (DEFAULT_RESCAN_WINDOW_DAYS = 30), `wrangler.toml:53` (cron: every minute)

### Open (Operator Input Required)

No open questions. All investigation questions are resolved from codebase evidence.

## Confidence Inputs

- **Implementation: 85%** -- The migration path is well-understood (additive ALTER TABLE, dual-write, backfill). D1 supports standard SQLite DDL. The codebase has 4 prior migrations as precedent. Would reach 90% with a prototype migration tested against local D1.
  - Evidence: existing migration files, D1 documentation, modest data volume

- **Approach: 80%** -- Additive column migration with metadata_json retention is the standard approach for this type of normalization. The main decision is which fields to promote first (tier 1 vs. tier 2). Would reach 90% with analysis confirming field prioritization.
  - Evidence: only 1 field (`needsManualDraft`) currently queried in SQL; guest fields and admission fields are strong promotion candidates based on API usage frequency

- **Impact: 85%** -- Impact is well-bounded. API contract remains stable (clients already receive individual fields, not raw JSON). Migration eliminates `JSON.parse` overhead and enables future indexing. Risk of breakage is low due to additive approach.
  - Evidence: `buildThreadSummary` already extracts fields; client types already expect individual properties

- **Delivery-Readiness: 80%** -- All affected modules are identified. Type definitions, write paths, read paths, and test fixtures are mapped. No external dependencies or service changes required.
  - Evidence: complete field inventory, blast radius map, test landscape

- **Testability: 80%** -- Test infrastructure exists (Jest, CI governed runner). Test fixtures use `metadata_json` directly and will need updating. Three `parseMetadata` functions should be consolidated for cleaner testing. Would reach 90% with a unified parse function and isolated migration test.
  - Evidence: 13+ existing test files, fixture patterns in recovery.server.test.ts

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Migration ordering: columns added before code reads them | Low | Low | D1 migrations run before deploy. SQLite `ALTER TABLE ADD COLUMN` with DEFAULT NULL is safe. |
| Test fixture breakage during migration | Medium | Low | Update fixtures incrementally. Maintain metadata_json in fixtures during transition. |
| Three divergent metadata types cause field drift | Medium | Medium | Unify into a single canonical `ThreadMetadata` type as part of the migration. |
| `json_extract` query for `needsManualDraft` must be updated atomically with column promotion | Low | Medium | Migration adds column + backfills before code change. Query can use COALESCE(column, json_extract) during transition. |
| Backfill for `guestRoomNumbers` (array field) requires TEXT serialization in column | Low | Low | Keep as JSON string in dedicated column, or normalize to a separate join table. Array fields are a design decision for analysis. |
| Thread detail API returns full parsed metadata object; client reads fields directly from it | Medium | Medium | Must keep `metadata` response field populated after migration. Either reconstitute object from columns or keep metadata_json in sync. Dual-write strategy addresses this. |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The investigation scope matches the change complexity well. All 22 metadata fields are inventoried, the write/read paths are mapped, the migration approach is understood, and backward compatibility is achievable with additive changes. The field inventory naturally segments into tiers (query-critical, API-exposed, internal-only) which will guide phased migration.

## Planning Constraints & Notes

- Must-follow patterns:
  - Sequential migration numbering (next is `0005_*.sql`)
  - Raw D1 prepared statements (no Prisma/ORM)
  - Spread-merge metadata update pattern during transition
- Rollout/rollback expectations:
  - Additive migration: add columns, keep `metadata_json` populated
  - Rollback: deploy previous code version; new columns are ignored by old code
  - Remove `metadata_json` only after all consumers are migrated and verified (separate future migration)
- Observability expectations:
  - Log migration completion and backfill row counts
  - No new metrics required; existing telemetry events are unaffected

## Suggested Task Seeds (Non-binding)

1. Add promoted columns via `0005_inbox_metadata_columns.sql` (additive ALTER TABLE)
2. Backfill new columns from existing `metadata_json` data
3. Update write paths (sync, recovery, dismiss, regenerate) to dual-write (columns + metadata_json)
4. Update read paths (api-models, repositories queries) to read from columns
5. Consolidate three `parseMetadata` functions into one canonical implementation
6. Replace `json_extract` query in `findStaleAdmittedThreads` with direct column reference
7. Update test fixtures for new schema

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: all existing inbox tests pass with new schema, API response shape unchanged, `metadata_json` retained but optional
- Post-delivery measurement plan: verify inbox sync and recovery pipelines work correctly post-migration; no new metrics needed

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| InboxThreadRow schema and metadata_json fields | Yes | None | No |
| Metadata write paths (sync, recovery, dismiss, regenerate) | Yes | None | No |
| Metadata read paths (api-models, repositories, route handlers) | Yes | None | No |
| SQL-level metadata queries (json_extract) | Yes | None | No |
| D1 migration approach | Yes | None | No |
| Backward compatibility | Yes | None | No |
| Test landscape and fixture impact | Yes | None | No |
| UI consumption surface | Yes | None -- UI receives pre-serialized fields via API | No |

## Evidence Gap Review

### Gaps Addressed

- All 7 investigation questions from the dispatch are resolved with file-level evidence
- Complete field inventory (22 fields) with write-source and read-consumer mapping
- Migration precedent confirmed (4 existing migrations, sequential SQL files)
- Backward compatibility strategy validated (additive columns, spread-merge pattern preserves existing fields)

### Confidence Adjustments

- No confidence adjustments needed. Initial estimates hold after full investigation.

### Remaining Assumptions

- D1 `ALTER TABLE ADD COLUMN` with NULL default is supported and non-destructive (standard SQLite behavior, confirmed by D1 documentation)
- Row count is modest enough for single-batch backfill (based on single-property hostel volume)

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis` to compare migration approaches (big-bang vs. phased, which fields to promote in tier 1 vs. tier 2, array field handling strategy)
