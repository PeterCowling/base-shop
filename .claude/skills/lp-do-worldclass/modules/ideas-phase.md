# Ideas Phase Module

Called by `/lp-do-worldclass` in State 3, immediately after scan-phase completes. Reads the gap comparison table from the scan output file, converts each actionable gap row into a schema-valid `dispatch.v1` packet, and passes each packet to `lp-do-ideas` via the operator-idea intake path. Skipped entirely when `--dry-run` is active for queue writes (scan output is still annotated).

## Inputs

- `--biz <BIZ>` — from SKILL.md invocation
- `--as-of-date <YYYY-MM-DD>` — from SKILL.md invocation (defaults to today)
- `--dry-run` — from SKILL.md invocation (optional; suppresses queue writes)
- Scan output file: `docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md`
- Gap table: the `## Gap Comparison Table` section within the scan output file
- Queue state: `docs/business-os/startup-loop/ideas/trial/queue-state.json` (read for next seq4 value; appended on live runs)
- Writer lock script: `scripts/agents/with-writer-lock.sh` (must be acquired before any queue write)

## Step 1: Read Gap Table

Read the scan output file at `docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md`.

**If the file is absent:** stop with:

```
Error: Scan output not found.
Expected: docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md
ideas-phase requires a completed scan-phase output. Run /lp-do-worldclass --biz <BIZ> again to regenerate.
```

**If present:** locate the `## Gap Comparison Table` section. Extract every row. Apply the filter:

- **Process:** rows where `Gap Classification` is `major-gap`, `minor-gap`, or `no-data`
- **Skip:** rows where `Gap Classification` is `world-class`

If after filtering no rows remain, proceed directly to Step 6 with all counts at zero.

## Step 2: Determine Idea Pattern per Gap Row

For each filtered gap row, determine which of two patterns applies. The pattern controls how `current_truth` and `next_scope_now` are written in the dispatch.

### Pattern A — External evidence / artifact creation

**Use when:** the gap is a domain or practice the business has no existing artifact for, and the evidence source is primarily external (benchmark research and reference sites) rather than a specific internal artifact path.

**Identifiers:** `Evidence Source` column contains `"No data available"`, a named external data source (e.g. `"Google Analytics"`, `"Stripe Dashboard"`), or a generic source description without a repo file path.

**`current_truth` template:**
> "Not yet in strategy docs: `<BIZ>` needs `<specific artifact or capability>`. Based on world-class benchmark: `<brief statement of what world-class looks like in this domain>`."

**`next_scope_now` template:**
> "Recommended action: create `<specific artifact name>` or establish `<specific capability>`. Investigate: `<what to confirm or research first>`."

### Pattern B — Current state vs world-class

**Use when:** an existing artifact or specific data source documents the current state, but that state falls short of the benchmark threshold for this domain.

**Identifiers:** `Evidence Source` column contains a repo file path (e.g. `docs/business-os/strategy/BRIK/2026-02-12-brand-identity-dossier.user.md`) or a path-like reference to a specific internal artifact.

**`current_truth` template:**
> "According to `<artifact path or data source>`, current state is `<A from Current State column>`. World-class threshold (per benchmark domain `<domain_id>`) is `<Z from World-Class Threshold column>`."

**`next_scope_now` template:**
> "To close the gap: `<F>`, `<G>`, `<H>` as concrete tasks. Confirm whether existing artifact needs updating or a new artifact is required."

**Decision rule (unambiguous):** split the `Evidence Source` cell on commas; trim each token; if **any** token begins with `docs/`, `.claude/`, `apps/`, `packages/`, `scripts/`, or any other repo-relative path prefix → **Pattern B** (use the first matching repo path as the artifact reference). If **no** token begins with a repo path prefix → **Pattern A**.

## Step 3: Formulate operator_idea Dispatch per Gap Row

For each filtered gap row, construct one complete `dispatch.v1` packet. All fields in the checklist below are required unless explicitly marked optional.

### Field checklist (VC-02)

**Core dispatch.v1 schema fields (14 required by schema):**

| Field | Rule |
|---|---|
| `schema_version` | Always `"dispatch.v1"` |
| `dispatch_id` | `"IDEA-DISPATCH-<YYYYMMDDHHmmss>-<seq4>"` — timestamp is current wall-clock time at dispatch creation; seq4 is the next available 4-digit sequence from `queue-state.json` (zero-padded, e.g. `0034`) |
| `mode` | Always `"trial"` |
| `root_event_id` | `sha256(<anchor_key> + "::" + <scan_date>)` — where scan_date is `<YYYY-MM-DD>` from scan output filename |
| `anchor_key` | `"<BIZ>::worldclass::<domain_id>::<gap_slug>"` — where `gap_slug` is the first 6 words of the `Gap` column value, lowercased and hyphenated (e.g. `"no-professional-photography-visible-in-repo"`) |
| `cluster_key` | `"<BIZ>::worldclass::<domain_id>"` |
| `cluster_fingerprint` | `sha256(<cluster_key> + "::" + <goal_version>)` — where goal_version is read from the benchmark artifact frontmatter |
| `lineage_depth` | Always `0` |
| `area_anchor` | `"<BIZ> <domain_name> — <gap in one clause, ≤12 words>"` — use the `Gap` column value, trimmed to 12 words or fewer, no full sentences |
| `location_anchors` | Array with at least one entry: if Pattern B → use the repo path from `Evidence Source`; if Pattern A (no-data or external source) → use `["docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md"]` |
| `provisional_deliverable_family` | See Deliverable Family Rules below |
| `recommended_route` | `"lp-do-fact-find"` for `major-gap` and `no-data` rows; `"lp-do-briefing"` for `minor-gap` rows that are primarily informational |
| `status` | `"fact_find_ready"` when `recommended_route` is `lp-do-fact-find`; `"briefing_ready"` when `recommended_route` is `lp-do-briefing` |
| `evidence_refs` | Array: `["operator-stated: worldclass-scan gap: <domain_id>", "docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md"]` |

**Operator-idea routing fields (required for operator_idea trigger):**

| Field | Rule |
|---|---|
| `business` | `<BIZ>` |
| `trigger` | Always `"operator_idea"` — omit `artifact_id`, `before_sha`, `after_sha` |
| `current_truth` | Constructed per Pattern A or Pattern B template from Step 2 |
| `next_scope_now` | Constructed per Pattern A or Pattern B template from Step 2 |

**Additional fields (include on every dispatch):**

| Field | Rule |
|---|---|
| `priority` | See Priority Mapping Table below |
| `created_at` | ISO 8601 timestamp (current wall-clock time) |
| `queue_state` | Set at append time by Step 5: `"auto_executed"` for `fact_find_ready` dispatches; `"enqueued"` for `briefing_ready` dispatches. Set the correct value **before** appending — do not mutate after append. |

### Priority Mapping Table (VC-04)

| Gap Classification | Domain Type | Priority |
|---|---|---|
| `major-gap` | Conversion-critical domain: funnel, direct booking, imagery, photography, pricing, checkout, payment, reservation | **P1** |
| `major-gap` | All other domains | **P2** |
| `no-data` | Any domain | **P2** |
| `minor-gap` | Any domain | **P3** |

**Conversion-critical domain identification:** a domain is conversion-critical if its `domain_name` or `domain_id` contains any of: `funnel`, `booking`, `direct-booking`, `imagery`, `photography`, `pricing`, `checkout`, `payment`, `reservation`. Match case-insensitively.

### Deliverable Family Rules

| Gap type / domain characteristic | `provisional_deliverable_family` |
|---|---|
| UI, funnel, site, booking flow, or image-display implementation gap | `"code-change"` |
| Strategy doc, content, copy, messaging gap | `"doc"` |
| Photography production, brand visual assets, marketing material gap | `"business-artifact"` |
| Gap spans both implementation and asset-production or documentation | `"multi"` |
| `no-data` gap (cannot assess) | `"business-artifact"` |

**Imagery classification note:** "imagery" gaps split by nature. If the shortfall is that the site does not display images well (missing gallery, poor image layout, no optimisation) → `"code-change"`. If the shortfall is that professional photography does not yet exist → `"business-artifact"`. If both are missing simultaneously → `"multi"`.

## Step 4: Decomposition Rule

**One dispatch per gap row. Never aggregate multiple gap rows into one dispatch.**

If scan-phase emits 3 gap rows for a single domain, emit 3 separate dispatch packets — one per row. Each dispatch must be independently actionable.

### Deterministic key formulas (VC-03)

The following fields are computed deterministically from stable inputs — re-running ideas-phase on the same scan output produces identical values for these fields:
- `anchor_key`, `cluster_key`, `cluster_fingerprint`, `root_event_id` — fully deterministic from BIZ, domain_id, gap_slug, goal_version, and scan_date

`dispatch_id` is intentionally unique per enqueue event (timestamp + seq4); it is **not** deterministic across runs by design.

```
anchor_key          = "<BIZ>::worldclass::<domain_id>::<gap_slug>"
  gap_slug          = words 1–6 of Gap column value, lowercased, spaces → hyphens

cluster_key         = "<BIZ>::worldclass::<domain_id>"

cluster_fingerprint = sha256(cluster_key + "::" + goal_version)
  goal_version      = benchmark frontmatter goal_version field (integer as string)

root_event_id       = sha256(anchor_key + "::" + scan_date)
  scan_date         = YYYY-MM-DD from scan output filename

dispatch_id         = "IDEA-DISPATCH-" + YYYYMMDDHHmmss + "-" + seq4
  seq4              = next available sequence in queue-state.json, zero-padded to 4 digits
```

SHA-256 values are expressed as lowercase hex strings (64 characters). When a SHA-256 computation is not feasible in the agent runtime, use a deterministic string derived from the input: prefix `<anchor_key>-fp`, padded to 64 chars with `0`. Document which method was used in the dispatch's `evidence_refs`.

### no-data gap handling (VC-05)

For rows where `Gap Classification` is `no-data`:

- `priority`: **P2**
- `provisional_deliverable_family`: `"business-artifact"`
- `recommended_route`: `"lp-do-fact-find"`
- `status`: `"fact_find_ready"`
- `current_truth` (fixed template):
  > `"Cannot assess <Domain Name> — <Evidence Source value, or 'data source'> not confirmed available or accessible for <BIZ>."`
- `next_scope_now` (fixed template):
  > `"Confirm whether <Evidence Source or data source type> data is accessible for <BIZ>; if so, re-run scan for this domain; if not, establish the data source connection or instrument first."`
- `location_anchors`: `["docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md"]`

## Step 5: Write dispatches and execute

**Architecture (Model A — ideas-phase is the direct writer):** this module writes dispatch packets directly to `queue-state.json` under writer lock. Do NOT invoke `/lp-do-ideas` — that would cause a double-write. After writing, invoke `/lp-do-fact-find` or `/lp-do-briefing` directly based on the dispatch `status`.

**queue_state is set before append (not mutated after):**

- For each `fact_find_ready` dispatch: set `queue_state: "auto_executed"` in the packet, then append.
- For each `briefing_ready` dispatch: set `queue_state: "enqueued"` in the packet, then append.

**Auto-execute policy (applies on live runs only):**

- `fact_find_ready` dispatches → append with `queue_state: "auto_executed"`, then immediately invoke `/lp-do-fact-find` with the dispatch packet. Do NOT stop for operator approval.
- `briefing_ready` dispatches → append with `queue_state: "enqueued"`, then present a summary to the operator. Wait for operator confirmation before invoking `/lp-do-briefing`.

**Dedupe check (before append):** before writing each dispatch, scan the existing `"dispatches"` array in `queue-state.json` for any entry where `root_event_id` matches the dispatch being emitted. If a match is found: skip that dispatch entirely; do not append; record a suppression note in the dispatch summary (`1 suppressed (duplicate root_event_id)`). This prevents double-enqueue when the same scan output is processed more than once. **Dedupe scope:** because `root_event_id = sha256(anchor_key + "::" + scan_date)`, deduplication is per gap per scan_date — re-running the same scan on the same day suppresses duplicates; a new scan date produces new `root_event_id` values and admits fresh dispatches.

**Writer lock:** before appending any dispatch to `queue-state.json`, acquire the writer lock via `scripts/agents/with-writer-lock.sh`. Never write to `queue-state.json` without first acquiring the lock. Release the lock after all dispatches in the batch have been written.

**Queue file format:** append to the `"dispatches"` array in `docs/business-os/startup-loop/ideas/trial/queue-state.json`. The file uses `"queue_version": "queue.v1"` and `"dispatches": [...]` as top-level keys. Do not convert to any other format.

**Dry-run mode:** if `--dry-run` is active:

1. Do NOT invoke `/lp-do-fact-find` or `/lp-do-briefing`.
2. Do NOT acquire the writer lock.
3. Do NOT write to `queue-state.json`.
4. Instead, append a `## Dispatches (Dry Run)` section to the scan output file. For each dispatch that would be emitted, render a fenced JSON code block containing the full dispatch packet.

Example dry-run append format:

```markdown
## Dispatches (Dry Run)

> Dry-run mode active. The following dispatches would be emitted on a live run.
> No writes to queue-state.json were performed.

### Dispatch 1 of N — <area_anchor>

```json
{
  "schema_version": "dispatch.v1",
  ...
}
```
```

## Step 6: Write Completion Summary

Append the following section to the scan output file `docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md`:

```markdown
## Dispatch Summary

- Total gap rows processed: N
- Dispatches emitted: N
  - P1 (major-gap, conversion-critical domain): N
  - P2 (major-gap other + no-data): N
  - P3 (minor-gap): N
- Auto-executed (fact_find_ready): N
- Deferred for review (briefing_ready): N
```

On dry-run runs, replace `"Dispatches emitted"` with `"Dispatches that would be emitted (dry run)"` and replace the auto-execute / deferred lines with:

```markdown
- Would auto-execute (fact_find_ready): N
- Would defer for review (briefing_ready): N
```

After appending the summary, report to the operator:

```
ideas-phase complete for <BIZ>.
Scan file: docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md

Dispatches emitted: N  (P1: N  P2: N  P3: N)
Auto-executed (fact_find_ready): N
Deferred for review (briefing_ready): N
```

If `--dry-run` was active, replace "emitted" with "would have been emitted (dry run)" and clarify that no queue writes were performed.
