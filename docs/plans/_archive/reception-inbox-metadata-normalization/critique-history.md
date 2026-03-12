# Critique History: reception-inbox-metadata-normalization

## Round 1

- **Route:** codemoot
- **Score:** 7/10 (lp_score: 3.5)
- **Verdict:** needs_revision
- **Severity counts:** Critical: 0, Major: 4, Minor: 0

### Findings

1. **Major:** Thread detail API (`[threadId]/route.ts` line 78) returns `metadata: parseThreadMetadata(record.thread.metadata_json)` as a full object to the client. The fact-find understated the API contract surface by saying clients only receive pre-extracted summary fields.
   - **Fix:** Updated Entry Points, Data & Contracts, Dependency & Impact Map, and backward compatibility Q&A to document the full metadata response and its UI consumers.

2. **Major:** Field inventory listed `channel` as a write-side metadata field from `SyncThreadMetadata`. In fact, `SyncThreadMetadata` does not include `channel` -- it is a read-side concept interpreted by `api-models.server.ts` and Prime mapping code, not populated by email sync/recovery write paths.
   - **Fix:** Updated field inventory table to clarify `channel` is read-side only with accurate description.

3. **Major:** Field inventory marked `guestCheckIn`, `guestCheckOut`, and `guestRoomNumbers` as not displayed or internal-only. In fact, `ThreadDetailPane.tsx` (lines 224-237) renders all three from `threadDetail.metadata`.
   - **Fix:** Updated field inventory read-by-display column to reflect UI rendering via metadata API field.

4. **Major:** Entry points omitted `send/route.ts`, `resolve/route.ts`, and `draft/route.ts` -- all parse and spread-merge `metadata_json`. For a normalization migration, these are part of the write blast radius.
   - **Fix:** Added all 6 route handlers to Entry Points and Dependency & Impact Map with specific line references.

### Action taken

Revised fact-find.md to address all 4 findings. Proceeding to Round 2.

## Round 2

- **Route:** codemoot
- **Score:** 8/10 (lp_score: 4.0)
- **Verdict:** needs_revision (score takes precedence; 4.0 = credible)
- **Severity counts:** Critical: 0, Major: 3, Minor: 0

### Findings

1. **Major:** Field inventory heading still said "From `SyncThreadMetadata` (the write-side superset)" but the table includes `channel` and `recoveryAttempts` which are not in `SyncThreadMetadata`.
   - **Fix:** Rewrote heading to accurately describe the table as covering all observed fields across all write and read paths, with explicit notes about which types define which fields.

2. **Major:** Document claimed "up to 22 distinct fields" but the inventory now enumerates 23 rows.
   - **Fix:** Updated count to 23.

3. **Major:** The "How is metadata_json populated?" answer listed only sync, recovery, dismiss, and regenerate but omitted send, resolve, and draft save routes -- now correctly listed as entry points.
   - **Fix:** Updated answer to list all 7 write call sites explicitly.

### Post-loop gate (fact-find)

- lp_score: 4.0 (credible)
- No Critical findings remaining
- Proceed to completion

---

# Analysis Critique

## Analysis Round 1

- **Route:** codemoot
- **Score:** 7/10 (lp_score: 3.5)
- **Verdict:** needs_revision
- **Severity counts:** Critical: 0, Major: 4, Minor: 1

### Findings

1. **Major:** Planning handoff hard-coded `0005_inbox_metadata_columns.sql` but `0005_thread_events_event_type_index.sql` already exists. Next migration must be `0006_*`.
   - **Fix:** Updated all references to `0006_inbox_metadata_columns.sql`.

2. **Major:** Core rationale against Option A was internally inconsistent -- rejected phased dual-write complexity but Option B also depends on dual-write for rollback safety.
   - **Fix:** Reframed rationale to distinguish "uniform dual-write" (Option B) from "tiered dual-write bookkeeping" (Option A). Both require dual-write; the difference is tier tracking overhead.

3. **Major:** Field promotion count said "19 fields" but the table lists 20 columns (21 - 2 + recoveryAttempts = 20).
   - **Fix:** Updated count to 20.

4. **Major:** Claimed "7 route handlers use spread-merge" but only 5 are mutating (`dismiss`, `send`, `resolve`, `draft` PUT, `draft/regenerate`); 2 are read-only (`[threadId]/route.ts` GET, `draft/route.ts` GET).
   - **Fix:** Updated summary and planning handoff to distinguish 5 mutating + 2 read-only handlers.

5. **Minor:** `channel` column exclusion decision is correctly aligned with codebase evidence. No fix needed.

### Action taken

Revised analysis.md to address all 4 Major findings. Proceeding to Round 2.

## Analysis Round 2

- **Route:** codemoot
- **Score:** 8/10 (lp_score: 4.0)
- **Verdict:** needs_revision (score takes precedence; 4.0 = credible)
- **Severity counts:** Critical: 0, Major: 2, Minor: 1

### Findings

1. **Major:** Option B description still said "frozen backup" for metadata_json but the approach depends on continuous dual-write.
   - **Fix:** Replaced "frozen backup" with "continuous dual-write" throughout. Clarified metadata_json remains actively populated on every write.

2. **Major:** Planning handoff still said "all 7 route handlers" for writes but 2 are read-only.
   - **Fix:** Updated to "5 mutating route handlers + 2 read-only handlers" with explicit names.

3. **Minor:** Stale migration numbering reference (said 0001-0004 but 0005 also exists). Handoff already used correct 0006.
   - **Fix:** Updated reference to 0001-0005.

### Post-loop gate (analysis)

- lp_score: 4.0 (credible)
- No Critical findings remaining
- Proceed to completion

---

# Plan Critique

## Plan Round 1

- **Route:** codemoot
- **Score:** 6/10 (lp_score: 3.0)
- **Verdict:** needs_revision
- **Severity counts:** Critical: 1, Major: 3, Minor: 0

### Findings

1. **Critical:** TASK-02 is internally inconsistent about the mapper contract. It says `parseThreadMetadata()` will read from `InboxThreadRow` columns, but current consumers all pass `record.thread.metadata_json` (a string), and line 243 says no consumption-site changes are needed. As written, this either breaks builds or leaves the read migration incomplete.
   - **Fix:** Introduced `parseThreadMetadataFromRow(row: InboxThreadRow)` as the new column-aware function. Existing `parseThreadMetadata(raw: string)` kept as internal helper for fallback. TASK-04 acceptance now explicitly requires migrating all 10 call sites from `parseThreadMetadata(record.thread.metadata_json)` to `parseThreadMetadataFromRow(record.thread)`.

2. **Major:** Migration acceptance criteria misused "idempotent." `ALTER TABLE ... ADD COLUMN` errors if column exists -- this is not idempotent. Acceptable only because D1 migrations are sequential and guarantee single execution.
   - **Fix:** Replaced idempotency claim with accurate description of D1 sequential guarantee.

3. **Major:** Observability requirement underspecified. D1 SQL migration files cannot "log backfill row count," and "SQL comments or separate verification query" is not an actual logging mechanism.
   - **Fix:** Replaced with concrete post-migration verification command: `wrangler d1 execute --remote --command "SELECT COUNT(*) FROM threads WHERE guest_first_name IS NOT NULL"`.

4. **Major:** TASK-05 execution plan says "Run full test suite" but repo policy is CI-only for Jest/e2e (AGENTS.md/MEMORY.md).
   - **Fix:** Changed to "Push changes and verify full test suite passes in CI (`gh run watch`)".

### Action taken

Revised plan.md to address all 4 findings. Proceeding to Round 2.

## Plan Round 2

- **Route:** codemoot
- **Score:** 8/10 (lp_score: 4.0)
- **Verdict:** needs_revision (score takes precedence; 4.0 = credible)
- **Severity counts:** Critical: 0, Major: 3, Minor: 0

### Findings

1. **Major:** Parallelism guide said TASK-03 and TASK-04 can run in parallel, but both modify `repositories.server.ts`. Collision-prone.
   - **Fix:** Made TASK-04 depend on TASK-03. Updated parallelism guide (Wave 3 -> 3/3b). Updated task summary table and rehearsal trace.

2. **Major:** Post-migration verification command unreliable. `COUNT(*) WHERE guest_first_name IS NOT NULL` under-reports for threads without guest names. Also missing D1 database name.
   - **Fix:** Changed to `wrangler d1 execute reception-inbox --remote --command "SELECT COUNT(*) as total, COUNT(needs_manual_draft) as backfilled FROM threads"` which checks a field present on all metadata rows.

3. **Major:** CI verification step underspecified. `gh run watch` without run ID does not guarantee watching the correct push.
   - **Fix:** Updated to "Push changes; wait for CI to trigger, then `gh run watch` on the triggered run".

### Post-loop gate (plan)

- lp_score: 4.0 (credible)
- No Critical findings remaining
- Proceed to completion
