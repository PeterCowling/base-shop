---
Type: Analysis
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: reception-inbox-metadata-normalization
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-inbox-metadata-normalization/fact-find.md
Related-Plan: docs/plans/reception-inbox-metadata-normalization/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Inbox Metadata Normalization Analysis

## Decision Frame

### Summary

The reception inbox stores 23 metadata fields as a JSON blob in a single `metadata_json TEXT` column. Every access requires `JSON.parse`, only one field (`needsManualDraft`) is queried at the SQL level (via `json_extract`), and 7 route handlers use the spread-merge pattern to update subsets of fields. Five mutating route handlers plus sync and recovery use a spread-merge pattern to update subsets of fields; two additional read-only handlers return parsed metadata to the client. The decision is how to promote these fields to proper columns: all at once, in tiers, or not at all (retaining the blob with index workarounds).

### Goals

- Eliminate `JSON.parse` overhead on every metadata access
- Enable SQL-level indexing and querying of frequently-filtered fields
- Unify the three divergent metadata type definitions into a single canonical type
- Maintain API contract stability (both the summary fields and the full `metadata` response object)
- Preserve backward compatibility during rollout

### Non-goals

- Normalizing other JSON columns (`payload_json`, `quality_json`, `interpret_json`) on other tables
- Redesigning the inbox data model beyond metadata promotion
- Adding new queryable features (e.g. search by guest name) -- that is a downstream benefit, not a goal of this migration

### Constraints & Assumptions

- Constraints:
  - D1 (SQLite) with forward-only sequential SQL migrations
  - No ORM -- all queries are hand-written prepared statements
  - Production data exists; migration must be non-destructive
  - Thread detail API returns the full parsed metadata object to the client (`[threadId]/route.ts` line 78)
  - `guestRoomNumbers` is an array type (requires TEXT serialization in SQLite)
- Assumptions:
  - Row count is modest (hundreds to low thousands) -- backfill is trivial
  - Single-operator system -- brief downtime acceptable if needed

## Inherited Outcome Contract

- **Why:** Important details about each email thread -- like the guest's name, their booking reference, and room number -- are all crammed into one text field. Every time the system needs any of these details, it has to unpack the entire blob. This is slow, error-prone, and makes it impossible to search or filter threads by guest name or booking reference directly. Moving the most-used fields into proper database columns would make the inbox faster and more reliable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A validated next action exists for metadata normalization, with target fields identified, migration strategy defined, and backward compatibility approach documented.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-inbox-metadata-normalization/fact-find.md`
- Key findings used:
  - 23 metadata fields inventoried across 3 type definitions
  - Only `needsManualDraft` is queried via SQL `json_extract`; `latestInboundMessageId` and `recoveryAttempts` are queried in application code
  - 7 route handlers parse and spread-merge metadata
  - Thread detail API exposes full parsed metadata object to client (not just summary fields)
  - `channel` is read-side only (not written by sync/recovery)
  - D1 migrations are sequential numbered SQL files (0001-0005 exist; next is 0006)
  - Spread-merge update pattern preserves existing fields

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Migration safety | Production data exists; must not lose or corrupt metadata | Critical |
| API contract stability | Thread detail endpoint returns full metadata object; client reads fields directly | Critical |
| Code change surface | 7 route handlers + 3 core modules + 13+ test files need updating | High |
| Rollback simplicity | D1 migrations are forward-only; rollback = deploy old code | High |
| Type unification | Three divergent types cause maintenance burden and field drift risk | Medium |
| Query performance gain | Only one SQL `json_extract` today; modest row count limits performance benefit | Low |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Phased column promotion with tiers | Promote fields in 2-3 tiers, dual-write metadata_json + columns during transition, remove blob later | Lowest risk per deployment; can stop at any tier; rollback is trivial | More migrations; dual-write complexity; longer total timeline | Dual-write logic could diverge; intermediate state harder to test | Yes |
| B: Single-pass column promotion | One migration adds all columns, one code change updates all read/write paths, backfill, keep metadata_json populated via dual-write | Simplest mental model; one migration, one code change; type unification happens once | Larger blast radius per deployment; all-or-nothing; harder to review | Large PR; if any path missed, data loss for that field | Yes |
| C: Retain blob, add generated columns | Use SQLite generated columns (`AS json_extract(metadata_json, '$.field') STORED`) for query-critical fields only | Zero application code change for read paths; immediate index benefit | Only covers query use case; JSON.parse still needed everywhere; type fragmentation persists; D1 generated column support uncertain | D1 may not support generated columns; no type safety improvement; does not address the core problem | Rejected |

### Option C Elimination Rationale

Option C was investigated and rejected because:
1. D1's support for SQLite generated columns is not documented and may be incomplete
2. It only addresses the query/index use case (one field today: `needsManualDraft`) but does not reduce `JSON.parse` overhead, type fragmentation, or the spread-merge complexity
3. The core problem -- "every access requires JSON.parse, and none of these fields can be efficiently queried" -- remains largely unsolved

## Engineering Coverage Comparison

| Coverage Area | Option A (Phased) | Option B (Single-pass) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A -- no UI changes in either option | N/A | N/A |
| UX / states | N/A -- API response shape unchanged | N/A | N/A |
| Security / privacy | PII fields (guest name, booking ref) become named columns; same auth boundary; no new exposure | Same as A | PII handling unchanged; column names make fields more discoverable in schema but not in API |
| Logging / observability / audit | Can add migration-complete logging per tier | One migration-complete log event | Log backfill row count and any errors |
| Testing / validation | Test fixtures updated per tier; smaller diffs per PR; can validate each tier independently | All test fixtures updated at once; single validation pass | Option B: single validation pass is simpler but harder to review. Option A: incremental validation but more test churn. Difference is marginal given modest test surface. |
| Data / contracts | Dual-write keeps metadata_json populated; API `metadata` response reconstituted from columns; type unification can happen per tier | Type unification happens once; metadata_json kept as frozen JSON backup; API `metadata` response built from columns | Must keep `metadata` API response field populated regardless of option. In both cases, `parseThreadMetadata` becomes a column-to-object mapper. |
| Performance / reliability | Incremental improvement per tier; `needsManualDraft` indexed first | All fields available as columns immediately; all json_extract and JSON.parse eliminated at once | Performance gain is marginal given modest row count. Main win is code clarity, not speed. |
| Rollout / rollback | Tier rollback: deploy previous code, new columns ignored. Very safe. | Rollback: deploy previous code, all new columns ignored. metadata_json still populated. | Both options have safe rollback via old code deployment. Option A is slightly safer due to smaller per-deployment surface. |

## Chosen Approach

- **Recommendation:** Option B -- Single-pass column promotion

- **Why this wins:**
  1. **The write surface is the same either way.** Whether you add 20 columns in one migration or three tiers, the same 5 mutating route handlers (`dismiss`, `send`, `resolve`, `draft` PUT, `draft/regenerate`), plus `sync.server.ts` and `recovery.server.ts`, must be updated. The 2 read-only handlers (`[threadId]/route.ts` GET, `draft/route.ts` GET) need column-aware read logic regardless of phasing. You cannot partially migrate write paths without branching on "which fields are columns vs. still in the blob."
  2. **Uniform dual-write is simpler than tiered dual-write.** Both options require dual-write (columns + metadata_json) for rollback safety. The difference is that Option A requires tracking which fields are in which tier during the transition, while Option B treats all promoted fields uniformly. With modest row count and a single-operator system, tier bookkeeping cost exceeds the incremental safety it provides.
  3. **Type unification is cheaper in one pass.** Consolidating three type definitions (`SyncThreadMetadata`, `InboxThreadMetadata`, `ThreadMetadata`) into one canonical type is cleaner when done atomically rather than incrementally.
  4. **Backfill is trivial.** With hundreds to low thousands of rows, a single `UPDATE threads SET col = json_extract(metadata_json, '$.field')` per field runs in milliseconds.
  5. **metadata_json is retained via continuous dual-write.** The JSON blob is not deleted or frozen -- it remains actively populated by dual-write in all write paths (columns + metadata_json on every update). This means rollback to old code is safe because old code still reads from a current metadata_json. Removing metadata_json is a separate, future cleanup migration after a verification period confirms all column reads are correct.

- **What it depends on:**
  - D1 `ALTER TABLE ADD COLUMN` with DEFAULT NULL works (standard SQLite, well-documented)
  - All 7 route handlers and 3 core modules are identified and updated (fact-find provides complete list)
  - Test fixtures are updated for new column expectations

### Rejected Approaches

- **Option A (Phased)** -- Rejected because phasing does not meaningfully reduce risk when the same 5 mutating handlers + 2 core modules must be updated regardless of tier count. Both options require dual-write for rollback safety; the difference is that phasing adds tier bookkeeping (tracking which fields are columns vs. still blob-only). The modest row count and single-operator deployment model make this incremental safety negligible.

- **Option C (Generated columns)** -- Rejected because it does not address the core problem (JSON.parse overhead, type fragmentation, spread-merge complexity) and D1 generated column support is uncertain.

### Open Questions (Operator Input Required)

No open questions. All approach decisions are resolvable from codebase evidence and documented constraints.

## Planning Handoff

- Planning focus:
  - Single migration file (`0006_inbox_metadata_columns.sql`) adding all promoted columns with NULL defaults
  - Backfill script (SQL UPDATE using `json_extract` per field)
  - Unified `ThreadMetadata` type replacing all three current definitions
  - Updated `parseThreadMetadata` that reads from columns (with metadata_json fallback for robustness)
  - Updated write paths: all 5 mutating route handlers (`dismiss`, `send`, `resolve`, `draft` PUT, `draft/regenerate`) + `sync.server.ts` + `recovery.server.ts` write to columns AND metadata_json
  - Updated read-only handlers: `[threadId]/route.ts` GET and `draft/route.ts` GET read from columns instead of parsing metadata_json
  - Updated API serialization: `buildThreadSummary` and the `metadata` response field read from columns
  - Replace `json_extract` in `findStaleAdmittedThreads` with direct column reference
  - Test fixture updates

- Validation implications:
  - All existing inbox tests must pass with new schema
  - API response shape must be identical (thread summary fields + full metadata object)
  - New unit tests for the unified `parseThreadMetadata` column mapper
  - Migration SQL tested against empty and populated D1 databases

- Sequencing constraints:
  - Migration must run before code deployment (D1 migrations applied via `wrangler d1 migrations apply` before deploy)
  - Backfill must run after migration but can be part of the same migration file
  - Code changes can deploy after migration is applied (columns exist, old code ignores them)

- Risks to carry into planning:
  - `guestRoomNumbers` is an array; must be stored as JSON TEXT in the column and parsed on read (same as current behavior, just in a named column instead of inside the blob)
  - `channel` is read-side only; should NOT get a column -- it is computed from other context by `resolveInboxChannelAdapter`
  - Test fixture volume (13+ files) means the PR will have significant test churn

### Field Promotion Decision

Based on the fact-find field inventory:

**Promote to columns (20 fields):**
All fields from `SyncThreadMetadata` (21 fields) minus `gmailHistoryId` and `lastSyncMode` (sync-internal, never read outside sync), plus `recoveryAttempts` from recovery = 20 fields.

| Column name | SQLite type | Nullable | Notes |
|---|---|---|---|
| `latest_inbound_message_id` | TEXT | YES | Dedup check in sync |
| `latest_inbound_at` | TEXT | YES | |
| `latest_inbound_sender` | TEXT | YES | |
| `latest_admission_decision` | TEXT | YES | API summary |
| `latest_admission_reason` | TEXT | YES | API summary |
| `needs_manual_draft` | INTEGER | YES | SQL query + API + UI badge; index candidate |
| `draft_failure_code` | TEXT | YES | API summary |
| `draft_failure_message` | TEXT | YES | API summary |
| `last_processed_at` | TEXT | YES | |
| `last_draft_id` | TEXT | YES | |
| `last_draft_template_subject` | TEXT | YES | |
| `last_draft_quality_passed` | INTEGER | YES | |
| `guest_booking_ref` | TEXT | YES | API summary + regenerate context |
| `guest_occupant_id` | TEXT | YES | |
| `guest_first_name` | TEXT | YES | API summary + UI display |
| `guest_last_name` | TEXT | YES | API summary + UI display |
| `guest_check_in` | TEXT | YES | UI display |
| `guest_check_out` | TEXT | YES | UI display |
| `guest_room_numbers_json` | TEXT | YES | JSON array string; UI display + regenerate |
| `recovery_attempts` | INTEGER | YES | Recovery retry limit |

**Retain in metadata_json only (3 fields):**
- `gmailHistoryId` -- sync-internal, never read outside `buildThreadMetadata`
- `lastSyncMode` -- sync-internal diagnostic, never queried or displayed
- `channel` -- read-side computed concept, not a stored field

**metadata_json column disposition:**
- Retained as TEXT column (not dropped)
- Populated by dual-write during transition for rollback safety
- Contains full JSON blob (including promoted fields) for backward compatibility
- Future cleanup migration (separate scope) will drop it after verification period

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Large PR with 10+ files changed | Medium | Low | Inherent to single-pass approach; splitting would add more total complexity | Plan for focused review; consider splitting PR into migration + code change |
| `guestRoomNumbers` array serialization | Low | Low | SQLite has no native array type; JSON TEXT is the standard approach | Store as `guest_room_numbers_json TEXT`; parse on read like today |
| metadata_json fallback masking missing column writes | Low | Medium | Dual-write reduces risk but could mask a forgotten write path | Plan explicit checklist of all 7+3 write paths; test each |
| Test fixture volume (13+ files) | Medium | Low | Inherent to the migration scope | Budget for fixture updates; consider helper function for test thread creation |

## Planning Readiness

- Status: Go
- Rationale: Single viable approach chosen decisively (Option B). All write/read paths identified. Field promotion list finalized. No operator input required. Engineering coverage implications documented. Risk profile is manageable.
