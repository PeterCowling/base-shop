# Ideas Phase Module

Called by `/lp-do-worldclass` in State 3, immediately after scan-phase completes. Reads the gap comparison table from the scan output file, prepares operator-idea data for each actionable gap row, presents the ideas to the operator for selection, and invokes `/lp-do-ideas` for each selected idea. Unselected ideas are not taken forward. Skipped entirely (selection step skipped, dry-run annotation written) when `--dry-run` is active.

## Inputs

- `--biz <BIZ>` — from SKILL.md invocation
- `--as-of-date <YYYY-MM-DD>` — from SKILL.md invocation (defaults to today)
- `--dry-run` — from SKILL.md invocation (optional; skips operator selection and lp-do-ideas invocations)
- Scan output file: `docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md`
- Gap table: the `## Gap Comparison Table` section within the scan output file
- Queue state: `docs/business-os/startup-loop/ideas/trial/queue-state.json` (read-only; used for already-queued pre-filter in Step 5)

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

If after filtering no rows remain, proceed directly to Step 7 with all counts at zero.

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

## Step 3: Prepare Operator-Idea Data per Gap Row

For each filtered gap row, prepare the operator-idea payload. These fields are used both for the selection display (Step 5) and the `/lp-do-ideas` invocation (Step 6).

| Field | Rule |
|---|---|
| `area_anchor` | `"<BIZ> <domain_name> — <gap in ≤12 words, no full sentences>"` — use the `Gap` column value, trimmed to 12 words or fewer |
| `business` | `<BIZ>` |
| `current_truth` | Constructed per Pattern A or Pattern B template from Step 2 |
| `next_scope_now` | Constructed per Pattern A or Pattern B template from Step 2 |
| `priority` | See Priority Mapping Table below |
| `recommended_route` | `"lp-do-fact-find"` for `major-gap` and `no-data` rows; `"lp-do-briefing"` for `minor-gap` rows that are primarily informational |
| `provisional_deliverable_family` | See Deliverable Family Rules below |
| `location_anchors` | Array: if Pattern B → use the repo path from `Evidence Source`; if Pattern A → `["docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md"]` |
| `evidence_refs` | `["operator-stated: worldclass-scan gap: <domain_id>", "docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md"]` |

### Priority Mapping Table

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

### no-data row overrides

For rows where `Gap Classification` is `no-data`, use these fixed templates instead of the Pattern A/B templates from Step 2:

- `current_truth`:
  > `"Cannot assess <Domain Name> — <Evidence Source value, or 'data source'> not confirmed available or accessible for <BIZ>."`
- `next_scope_now`:
  > `"Confirm whether <Evidence Source or data source type> data is accessible for <BIZ>; if so, re-run scan for this domain; if not, establish the data source connection or instrument first."`
- `location_anchors`: `["docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md"]`
- All other fields (priority P2, deliverable family `"business-artifact"`, route `"lp-do-fact-find"`) follow from the tables above.

## Step 4: Decomposition Rule

**One idea per gap row. Never aggregate multiple gap rows into one idea.**

If scan-phase emits 3 gap rows for a single domain, prepare 3 separate operator-idea payloads — one per row. Each must be independently actionable and presented as a distinct numbered item in Step 5.

## Step 5: Present Ideas for Operator Selection

**Dry-run mode:** if `--dry-run` is active, skip the selection step entirely. Append a `## Dispatches (Dry Run)` section to the scan output file — for each idea, show the prepared operator-idea payload as a fenced block. Do NOT invoke `/lp-do-ideas`. Proceed to Step 7.

**Existing-queue pre-filter (live runs only):** before displaying the list, scan `docs/business-os/startup-loop/ideas/trial/queue-state.json` for dispatches with a matching `area_anchor`. Mark any matches as `(already queued)` in the list — show them but flag them so the operator can decide whether to re-submit.

**Selection presentation:** present a numbered list, P1 first then P2 then P3:

```
Gap scan complete for <BIZ>. Found N idea(s) from the scan.
Select which to take forward (comma-separated numbers, 'all', or 'none'):

  1. [P1] <area_anchor>
         <gap_classification> | <domain_name> | Route: <recommended_route>

  2. [P1] <area_anchor>  (already queued)
         <gap_classification> | <domain_name> | Route: <recommended_route>

  3. [P2] <area_anchor>
         <gap_classification> | <domain_name> | Route: <recommended_route>
```

Wait for the operator response before proceeding.

## Step 6: Invoke lp-do-ideas for Selected Ideas

**For each selected idea:** invoke `/lp-do-ideas` with the prepared operator-idea payload from Step 3 as a structured `operator_idea` intake. `/lp-do-ideas` will write the dispatch to `queue-state.json` (under its own writer lock) and auto-execute `fact_find_ready` dispatches via `/lp-do-fact-find`. `briefing_ready` dispatches are enqueued and presented for operator confirmation by lp-do-ideas before proceeding.

**For each unselected idea:** no action. Record as skipped in Step 7.

**Dry-run mode:** no invocations — dry-run output from Step 5 covers this.

## Step 7: Write Completion Summary

Append the following section to the scan output file `docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md`:

```
## Ideas Summary

- Total gap rows found: N
- Ideas presented to operator: N (N already queued)
- Selected by operator: N
  - P1 (major-gap, conversion-critical): N
  - P2 (major-gap other + no-data): N
  - P3 (minor-gap): N
- Skipped (not selected): N
- Passed to lp-do-ideas: N
```

On dry-run runs, replace `"Selected by operator"` with `"Would be available for selection (dry run)"` and replace `"Passed to lp-do-ideas"` with `"Would pass to lp-do-ideas"`.

After appending the summary, report to the operator:

```
ideas-phase complete for <BIZ>.
Scan file: docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md

Ideas found: N  |  Selected: N  |  Skipped: N
Passed to lp-do-ideas: N  (P1: N  P2: N  P3: N)
```

If `--dry-run` was active, clarify that no ideas were passed to lp-do-ideas and operator selection was skipped.
