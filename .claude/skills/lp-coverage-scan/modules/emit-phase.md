# Emit Phase Module

Called by `/lp-coverage-scan` after scan-phase produces the gap classification table. Writes the gap report artifact and emits dispatch packets for CRITICAL/MAJOR gaps.

## Inputs

- Gap classification table + Scan Summary block from scan-phase
- `--biz <BIZ>`, `--as-of-date <YYYY-MM-DD>`, `--dry-run` from SKILL.md invocation
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` (runtime write target)

## Step 1: Write Gap Report Artifact

Write the gap report to `docs/business-os/strategy/<BIZ>/coverage-scan-<YYYY-MM-DD>.md`.

Use `--as-of-date` for the date component. Write this file regardless of `--dry-run` state.

**Gap report structure:**

```markdown
---
Type: Coverage-Scan
Business: <BIZ>
Scan-date: <YYYY-MM-DD>
Status: [DRY RUN — no dispatches emitted] | Active
---

# Coverage Scan Report — <BIZ> (<YYYY-MM-DD>)

[DRY RUN — no dispatches emitted]   ← include only if --dry-run

## Gap Classification Table

<paste gap table from scan-phase output verbatim>

## Scan Summary

- CRITICAL gaps: N
- MAJOR gaps: N
- MINOR gaps: N
- OK domains: N
- Optional domains skipped: N

Dispatches emitted: N   (or "0 (dry run)" if --dry-run)
```

## Step 2: Determine Dispatch Scope

From the Scan Summary, read `Domains to emit (CRITICAL + MAJOR)`. These are the only domains for which dispatches are emitted.

**MINOR gaps**: appear in the gap report only. Do not emit dispatches.
**OK domains**: no dispatch. Do not mention in queue.
**Optional domains**: no dispatch. Appear in gap report as OPTIONAL — skipped.

If the Domains-to-emit list is empty: write the gap report with "No gaps found" and `Dispatches emitted: 0`. Stop — do not proceed to queue writes.

## Step 3: Acquire Writer Lock (live run only)

If `--dry-run` is NOT active:

```
scripts/agents/with-writer-lock.sh -- <queue-write-command>
```

Acquire the writer lock before any queue-state.json reads or writes. If lock acquisition fails (timeout or error), abort emit-phase with:

```
Error: Writer lock acquisition failed. No dispatches written.
Retry: scripts/agents/with-writer-lock.sh -- /lp-coverage-scan --biz <BIZ>
```

Do NOT write partial state. Abort cleanly.

If `--dry-run` is active: skip Steps 3–6. Go directly to Step 7 (completion).

## Step 4: Determine Next Dispatch Sequence Number

Read `docs/business-os/startup-loop/ideas/trial/queue-state.json`. Parse the `dispatches` array.

Scan all existing `dispatch_id` values for the pattern `IDEA-DISPATCH-<YYYYMMDDHHMMSS>-<NNNN>` (14-digit timestamp format). Find all IDs with the current date prefix (first 8 digits of the timestamp match today's date in YYYYMMDD format). Extract the sequence number NNNN from each. Use `max(NNNN) + 1` as the next sequence number.

If no 14-digit dispatch IDs exist for today: start at 0001.

Note: the live queue also contains legacy 8-digit IDs (`IDEA-DISPATCH-YYYYMMDD-NNNN`). These are the hand-authored format. Ignore them for sequence number determination — use only 14-digit IDs.

**Dispatch ID format**: `IDEA-DISPATCH-<YYYYMMDDHHmmss>-<NNNN>` where `YYYYMMDDHHmmss` is the current local time with seconds (14 digits total). Example: `IDEA-DISPATCH-20260226143052-0001`.

Assign sequential IDs to each gap dispatch in order of severity (CRITICAL first, MAJOR second), incrementing NNNN for each.

## Step 5: Construct Dispatch Packets

For each CRITICAL or MAJOR gap domain, construct a `dispatch.v1` packet. All required schema fields must be present.

### Required fields

| Field | Value |
|---|---|
| `schema_version` | `"dispatch.v1"` |
| `dispatch_id` | `"IDEA-DISPATCH-<YYYYMMDDHHmmss>-<NNNN>"` (14-digit; see Step 4) |
| `mode` | `"trial"` |
| `root_event_id` | `"scan:<BIZ>:<DOMAIN>:<anchor-slug>:<YYYYMMDD>"` — e.g. `"scan:BRIK:Financial:financial-coverage-gap:20260226"` |
| `anchor_key` | Slugified area anchor, lowercase hyphenated, ≤20 chars — e.g. `"financial-coverage-gap"` |
| `cluster_key` | `"<BIZ>:<DOMAIN>:<anchor-slug>:scan:<YYYYMMDD>"` |
| `cluster_fingerprint` | 32-char hex string — compute as `sha256(BIZ + ":" + domain + ":" + date)[0:32]` or a stable pseudo-random hex string unique per dispatch |
| `lineage_depth` | `0` (scanner is always the root event) |
| `area_anchor` | See Anchor Phrasing Rules below |
| `location_anchors` | List of relevant paths — e.g. the strategy directory, any matching artifact paths |
| `provisional_deliverable_family` | `"doc"` for doc-only domains; `"data-source+doc"` for data-backed domains |
| `recommended_route` | `"lp-do-fact-find"` |
| `status` | `"fact_find_ready"` |
| `evidence_refs` | At minimum: scan evidence string + domain context (see Evidence Refs format) |

### Optional but strongly recommended fields

| Field | Value |
|---|---|
| `business` | `<BIZ>` |
| `trigger` | `"operator_idea"` (closest schema-compatible trigger type for scanner-originated events) |
| `priority` | See Priority Assignment below |
| `confidence` | `0.85` (scanner classification confidence; constant for Phase 1) |
| `queue_state` | `"enqueued"` |
| `created_at` | ISO 8601 timestamp — e.g. `"2026-02-26T14:30:52Z"` |
| `domain` | Domain category (e.g. `"STRATEGY"`, `"MARKET"`, `"PRODUCTS"`) — use `"STRATEGY"` as default |

### Anchor Phrasing Rules

`area_anchor` must be ≤12 words and must NOT contain any of the following terms (PROCESS_QUALITY_RE):
`process`, `throughput`, `determinism`, `startup.?loop`, `pipeline`, `queue`, `classifier`, `prioriti`

**Correct patterns by domain:**

| Domain | CRITICAL anchor pattern | MAJOR anchor pattern |
|---|---|---|
| Financial | `"<BIZ> financial health — no revenue data or artifact"` | `"<BIZ> financial artifact stale — data not refreshed"` |
| Inventory | `"<BIZ> inventory — no stock level data or records"` | `"<BIZ> inventory artifact stale — stock records outdated"` |
| Customer | `"<BIZ> customer insight — no ICP or segment artifact"` | `"<BIZ> customer artifact stale — insight not refreshed"` |
| Operational | `"<BIZ> operational coverage — no process docs found"` | `"<BIZ> operational artifact stale — docs not refreshed"` |
| Marketing | `"<BIZ> marketing coverage — no channel or GA4 data"` | `"<BIZ> marketing artifact stale — no recent channel data"` |
| Compliance | `"<BIZ> compliance — no legal or policy artifact"` | `"<BIZ> compliance artifact missing or stale"` |

Adapt these patterns with the actual business identifier and specific gap evidence. Keep under 12 words.

### Priority Assignment

| Domain | Severity | Priority |
|---|---|---|
| Compliance | CRITICAL or MAJOR | `"P1"` — highest schema-valid priority; encode compliance context in `evidence_refs` (e.g. `"compliance-risk: No financial reporting data — compliance audit exposure"`) |
| Financial | CRITICAL | `"P2"` |
| Financial | MAJOR | `"P2"` |
| Customer | CRITICAL | `"P2"` |
| Inventory | CRITICAL | `"P2"` |
| Operational | CRITICAL | `"P3"` |
| Marketing | CRITICAL | `"P3"` |
| Any | MAJOR (non-Compliance) | `"P3"` |

Note: `priority` is metadata from the scanner; downstream lp-do-ideas TypeScript classifier re-evaluates from `area_anchor` and `evidence_refs` when the dispatch is processed. Include clear evidence context so the classifier can escalate correctly.

### Evidence Refs Format

Every dispatch must include at least two `evidence_refs` entries:

1. Scan result: `"coverage-scan: <BIZ> <Domain> domain — <CRITICAL|MAJOR> gap detected. <specific evidence: e.g. 'No files matched patterns: financial/**/*.md'>"`
2. Domain context: `"domain-context: <backing_type> domain; staleness threshold <N>d; <data_connections list or 'no data connections required'>"`
3. For Compliance: add `"compliance-risk: <description of compliance exposure>"` as third entry

## Step 6: Append Dispatches to queue-state.json (live run only)

Under writer lock (from Step 3):

1. Re-read `queue-state.json` (re-read under lock to prevent stale-read race condition)
2. For each dispatch packet: prepend to the `dispatches` array (insert at front, index 0)
3. Increment `counts.enqueued` by the number of dispatches emitted
4. Increment `counts.total` by the number of dispatches emitted
5. Update `last_updated` to today's ISO date string
6. Write the updated JSON back to `queue-state.json`

**Format constraint**: Always write in the hand-authored format:
```json
{
  "queue_version": "queue.v1",
  "last_updated": "YYYY-MM-DD",
  "counts": { ... },
  "dispatches": [ ... ]
}
```

Do NOT call `persistOrchestratorResult()` or use the TypeScript persistence layer format (`schema_version: "queue-state.v1"`, `entries: []`). These are incompatible with the live queue file.

**Collision prevention**: Re-determine the sequence number after re-reading the file (Step 4 may have been run before acquiring the lock). If another process added dispatches in the interim, the max NNNN may have advanced — recalculate from the re-read data.

## Step 7: Completion

After all dispatches are written (or after dry-run scan):

Output to the operator:

```
Coverage scan complete — <BIZ> (<YYYY-MM-DD>)

Gap report: docs/business-os/strategy/<BIZ>/coverage-scan-<YYYY-MM-DD>.md
  CRITICAL: N domain(s)
  MAJOR:    N domain(s)
  MINOR:    N domain(s)
  OK:       N domain(s)

Dispatches emitted: N  [or "0 (dry run)"]
  Priority breakdown: P1: N, P2: N, P3: N  [or omit if 0 dispatches]

Next: Review gap report and monitor lp-do-ideas queue for dispatched gaps.
```

## Edge Cases

- **All domains OK**: gap report written with "No gaps found"; `Dispatches emitted: 0`; no queue writes
- **Dispatch ID collision on same second**: if two dispatches are emitted in the same second (same 14-digit timestamp), increment NNNN sequentially (0001, 0002, etc.)
- **Writer lock timeout**: abort cleanly with error message; gap report was already written (safe); no partial queue writes
- **Empty `dispatches[]` array in queue-state.json**: initialize as `[]`, insert first dispatch, set `counts.enqueued: 1`, `counts.total: 1`
- **Multiple CRITICAL gaps in one run**: emit one dispatch per gap — follow the lp-do-ideas decomposition rule ("one event, multiple narrow packets"); do NOT aggregate into one dispatch
