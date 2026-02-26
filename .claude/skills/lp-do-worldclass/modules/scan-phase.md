# Scan Phase Module

Called by `/lp-do-worldclass` in State 3 only (goal + current benchmark). Reads the benchmark artifact, probes all available data sources, produces a current-state summary per domain, classifies gaps against world-class thresholds, and writes the gap comparison table.

## Inputs

- `--biz <BIZ>` — from SKILL.md invocation
- `--as-of-date <YYYY-MM-DD>` — from SKILL.md invocation (defaults to today)
- `--dry-run` — from SKILL.md invocation (affects scan output frontmatter; does not skip writing the scan file)
- Benchmark artifact: `docs/business-os/strategy/<BIZ>/worldclass-benchmark.md` (validated present and current by goal-phase before this module runs)
- Goal artifact (for `goal_version`): `docs/business-os/strategy/<BIZ>/worldclass-goal.md`
- Strategy directory: `docs/business-os/strategy/<BIZ>/`
- App source (if applicable): `apps/brikette/` or equivalent app directory for `<BIZ>`

## Step 1: Read and Parse Benchmark

Read `docs/business-os/strategy/<BIZ>/worldclass-benchmark.md`.

**Validate schema_version:** frontmatter must contain `schema_version: worldclass-benchmark.v1`. If missing or wrong value, stop with:

```
Error: worldclass-benchmark.md for <BIZ> has an unexpected schema version.
Found:    schema_version: <actual value>
Expected: schema_version: worldclass-benchmark.v1
Fix the benchmark frontmatter or re-run deep research and replace the file, then re-run /lp-do-worldclass --biz <BIZ>.
```

**Parse domain sections:** scan the body for all headings matching `## [<domain_id>] <Domain Name>`. Each domain section must contain all four subsections: `### Current Best Practice`, `### Exemplars`, `### Key Indicators`, `### Minimum Threshold`. If a domain section is missing any of these subsections, stop with:

```
Error: worldclass-benchmark.md for <BIZ> has a malformed domain section.
Domain: <domain_id> — <Domain Name>
Missing subsection: <subsection heading>
Fix the benchmark document at docs/business-os/strategy/<BIZ>/worldclass-benchmark.md, then re-run.
```

**Extract per domain:**
- `domain_id` and `domain_name` from the heading
- Full text of `### Minimum Threshold` (used as the comparison target in Step 5)
- Full bullet list from `### Key Indicators` (used for indicator-by-indicator comparison in Steps 4–5)

Record the parsed domain list. All subsequent steps iterate over this list.

## Step 2: Enumerate Data Sources to Probe

For each of the five fixed data-source categories below, determine its status (`configured`, `not-configured`, or `uncertain`) before proceeding to scan.

### (a) Repo

**What to look for:** strategy documents, website pages, content files, and source code at `docs/business-os/strategy/<BIZ>/` and the equivalent app directory (`apps/brikette/` for BRIK, or the corresponding app for other businesses).

**Status determination:**
- Always `configured` — the repo is always accessible.
- The amount of relevant content found in Step 4 determines scan quality, not repo status itself.

**Probe action in Step 4:** read strategy docs, page source, and content files in `docs/business-os/strategy/<BIZ>/` and the relevant app directory.

### (b) Stripe

**What to look for:** product catalog, order volumes, revenue data — accessible via MCP tools.

**Status determination:**
- `configured` — `mcp__brikette__product_stats` or `mcp__brikette__order_list` returns data without error.
- `not-configured` — MCP call returns an auth error, shop-not-found error, or connection failure.
- `uncertain` — MCP server responds but returns empty results (no products, no orders).

**Probe action:** call `mcp__brikette__product_stats` with the shop ID for `<BIZ>` (look up in `data/shops/` or strategy docs). If no shop ID is discoverable, treat as `not-configured`.

### (c) GA4

**What to look for:** GA4 measurement ID (`G-XXXXXXXXXX`) in strategy docs, `.env*` files, or app source.

**Status determination:**
- `configured` — a measurement ID is found in `docs/business-os/strategy/<BIZ>/`, `.env`, `.env.local`, `.env.production`, or app source files.
- `not-configured` — no measurement ID found anywhere in the repo for `<BIZ>`.
- `uncertain` — measurement ID found but no recent analytics report data is visible in strategy docs.

**Probe action:** glob `docs/business-os/strategy/<BIZ>/` and grep for `G-[A-Z0-9]{8,12}` pattern; also grep app source. Note where found.

### (d) Firebase

**What to look for:** Firebase project configuration in `.firebaserc`, `firebase.json`, or accessible data via `mcp__brikette__*` Firebase-adjacent tools.

**Status determination:**
- `configured` — `.firebaserc` or `firebase.json` found at repo root or in app directory, OR MCP tools return Firebase data for `<BIZ>`.
- `not-configured` — no Firebase config files found and MCP tools return no Firebase data.
- `uncertain` — config files exist but no accessible data (e.g. no session, auth error, or empty data returned).

**Probe action:** check for `.firebaserc` and `firebase.json` at repo root and in the relevant app directory. If found, extract the project ID.

### (e) Octorate

**What to look for:** Octorate PMS references in `apps/reception/` source, or available `mcp__brikette__octorate_*` tools with a valid session.

**Status determination:**
- `configured` — Octorate references (API calls, config, constants) found in `apps/reception/` source, OR `mcp__brikette__octorate_calendar_check` returns a valid session.
- `not-configured` — no Octorate references found in `apps/reception/` and no Octorate MCP tools available or configured.
- `uncertain` — Octorate referenced in source but session state is unknown (e.g. `mcp__brikette__octorate_calendar_check` not callable or returns session-expired).

**Probe action:** grep `apps/reception/` for `octorate` (case-insensitive). If found, note file locations. Do not attempt to create a session; only check whether one is accessible.

---

After probing all five categories, record the status table:

| Data Source | Status | Notes |
|---|---|---|
| Repo | configured | — |
| Stripe | configured / not-configured / uncertain | shop ID or error |
| GA4 | configured / not-configured / uncertain | measurement ID or absence |
| Firebase | configured / not-configured / uncertain | project ID or absence |
| Octorate | configured / not-configured / uncertain | files found or absence |

Proceed to Step 3 before continuing.

## Step 3: Uncertain Data Source Handling

For each data source with status `uncertain`: pause and ask the operator a structured question before proceeding. Do not assume accessibility. Do not skip silently.

For each `uncertain` source, present exactly this format (one question per source):

```
Data source uncertain: <Source Name>
To proceed with the scan I need to know: <specific yes/no question about whether data is accessible for this business>
Please confirm: yes (data is accessible) / no (treat as not-configured) / skip (omit this source from scan)
```

Example questions by source:
- **Stripe uncertain:** "Is there an active Stripe account for `<BIZ>` with at least one product or order?"
- **GA4 uncertain:** "Is the GA4 property `<measurement ID>` receiving data and do you have a recent report available?"
- **Firebase uncertain:** "Is the Firebase project `<project ID>` active and does it contain data relevant to `<BIZ>`?"
- **Octorate uncertain:** "Does the Octorate session for `<BIZ>` currently have valid calendar access?"

Wait for the operator response for each uncertain source before continuing. Apply the response:
- `yes` → treat as `configured`; include in the scan in Step 4
- `no` → treat as `not-configured`; exclude from scan in Step 4
- `skip` → omit this source from Step 4 entirely; record as `skipped` in scan output

If no data sources are `uncertain`, proceed directly to Step 4.

## Step 4: Current-State Scan per Domain

For each domain parsed in Step 1, search all `configured` and operator-confirmed data sources (from Steps 2–3) for evidence relevant to that domain.

**Repo scan (always):** search `docs/business-os/strategy/<BIZ>/` and the relevant app directory for:
- Content, copy, imagery references, or page structure relevant to this domain
- Any existing benchmarks, audits, or assessments that reference the domain by name or by Key Indicator terms
- Source code, templates, or configuration that relates to the domain's subject matter

**Stripe scan (if configured):** check product catalog and order data for evidence relevant to the domain (e.g. for a pricing domain: price points, tier structure; for a product domain: catalog completeness).

**GA4 scan (if configured):** look in strategy docs or accessible reports for analytics data relevant to the domain (e.g. for a content domain: traffic to relevant pages; for a funnel domain: conversion steps visible).

**Firebase scan (if configured):** look for accessible data relevant to the domain (e.g. booking records, customer data, operational metrics).

**Octorate scan (if configured):** look for operational data in `apps/reception/` source that relates to the domain (e.g. booking flow, rate management, channel connections).

For each domain, produce a **current-state summary** containing:
- What exists: specific artifacts, pages, content, or data found
- Where found: file paths or data source names
- Quality notes: how well the evidence covers the domain's Key Indicators (cite specific indicators from `### Key Indicators` in the benchmark)

**If no evidence found in any source for a domain:** record:
```
current_state: not found
Evidence source: none
Quality notes: No artifacts, pages, content, or data found in any configured source for this domain.
```

## Step 5: Gap Classification

For each domain, compare the current-state summary (Step 4) against the benchmark's `### Minimum Threshold`. Assign exactly one of four classifications:

### Classification Rubric

**`world-class`** — current state meets or demonstrably exceeds the Minimum Threshold AND matches 5 or more Key Indicators from `### Key Indicators`.

**`major-gap`** — material distance from the Minimum Threshold. Assign if any of the following:
- The relevant artifact or evidence is completely absent from the repo AND all configured data sources
- Evidence is present but clearly below the Minimum Threshold on 3 or more Key Indicators

**`minor-gap`** — current state is close. Assign if all of the following:
- Evidence is present
- Current state partially meets the Minimum Threshold
- Below threshold on exactly 1 or 2 Key Indicators

**`no-data`** — cannot assess because the only data sources relevant to this domain are `not-configured` or were `skipped` in Step 3, AND the repo scan produced no evidence.

### Domain-Specific Anchors

Apply these anchors to prevent discretion drift on high-variance domains:

**Imagery domain** (any domain whose Minimum Threshold references photography, visual content, or imagery):
- `major-gap` if no professional photography is visible in the repo (no references to professional photo shoots, no structured image assets, no photography in page content)
- `minor-gap` if professional photography exists but is missing per-room or per-product coverage, or lifestyle/context shots are absent

**Booking funnel domain** (any domain whose Minimum Threshold references a booking engine, room pages, or purchase flow):
- `major-gap` if no room-level or product-level pages exist in app source, or no integration with a booking engine is present from any room/product page
- `minor-gap` if room or product pages exist but the funnel is incomplete (missing pricing display, social proof, or a seamless primary CTA)

**Absence anchor (applies to all domains):** if evidence is completely absent from the repo AND all data sources (including repo scan returning `not found`), classify as `major-gap`, not `no-data`. Reserve `no-data` strictly for domains where the absence of assessment is caused by missing data-source access — not by absence of the thing itself.

### Discrete Gap Identification

A single domain may contain multiple discrete gaps. Identify each gap separately. A discrete gap is one specific shortfall against one specific Key Indicator or one specific aspect of the Minimum Threshold. A domain with 3 discrete gaps produces 3 gap rows in Step 6.

## Step 6: Write Gap Comparison Table

Write the scan output to `docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md`. If a file already exists for the same `<YYYY-MM-DD>`, overwrite it.

### Table Format

7 columns, one row per discrete gap:

| Domain | Gap | Current State | Threshold | Gap Classification | Evidence Source | Notes |
|---|---|---|---|---|---|---|

**Column definitions:**
- **Domain** — `domain_name` from the benchmark heading
- **Gap** — short label for the specific shortfall (e.g. "No professional photography", "Missing pricing display", "No social proof on room pages"). For `world-class` rows: `None`. For `no-data` rows: `Cannot assess`.
- **Current State** — one-sentence summary of what was found (or `Not found` / `No data available`)
- **Threshold** — the Minimum Threshold text from the benchmark (verbatim or closely paraphrased; cite the domain's `### Minimum Threshold`)
- **Gap Classification** — one of: `world-class`, `major-gap`, `minor-gap`, `no-data`
- **Evidence Source** — comma-separated list of sources where evidence was found (e.g. `repo`, `Stripe`, `GA4`). `none` if no evidence found.
- **Notes** — any caveats, quality notes, or context the ideas-phase should know

**Row rules:**
- One row per discrete gap (a domain with 3 distinct gaps gets 3 rows, each with the same Domain name)
- `world-class` domains: one row with Gap = `None`, Current State = brief summary of what makes it world-class, Gap Classification = `world-class`
- `no-data` domains: one row with Gap = `Cannot assess`, Current State = `No data available`, Gap Classification = `no-data`
- Domains with `major-gap` or `minor-gap`: one row per discrete gap identified in Step 5

### Scan Output Document Structure

```markdown
---
Type: Worldclass-Scan
Business: <BIZ>
Scan-date: <YYYY-MM-DD>
Goal-version: <goal.goal_version>
Status: [DRY RUN — no dispatches emitted] | Active
---

# World-Class Gap Scan — <BIZ> (<YYYY-MM-DD>)

[DRY RUN — no dispatches emitted]   ← include only if --dry-run

## Data Sources Probed

| Data Source | Status | Notes |
|---|---|---|
| Repo | configured | — |
| Stripe | <status> | <notes> |
| GA4 | <status> | <notes> |
| Firebase | <status> | <notes> |
| Octorate | <status> | <notes> |

## Gap Comparison Table

| Domain | Gap | Current State | Threshold | Gap Classification | Evidence Source | Notes |
|---|---|---|---|---|---|---|
<rows>

## Scan Summary

- World-class domains: N
- Major gaps: N
- Minor gaps: N
- No-data gaps: N
- Total gap rows emitted: N
```

**Notes:**
- Include the `[DRY RUN — no dispatches emitted]` line in the document body only when `--dry-run` was passed. Remove it for live runs.
- Set `Status:` in frontmatter to `[DRY RUN — no dispatches emitted]` for dry-run, `Active` for live.
- The "Data Sources Probed" table uses the final resolved statuses after Step 3 operator responses.

## Step 7: Pass Gap Table to Ideas-Phase

Confirm the gap table is complete:
- All domains from Step 1 have at least one row in the table
- All 7 columns are populated for every row
- Gap Classification for every row is one of the four valid values: `world-class`, `major-gap`, `minor-gap`, `no-data`
- Scan output file has been written to `docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md`

If any check fails, fix before proceeding.

Once confirmed, pass the following to ideas-phase:
- The parsed domain list from Step 1
- The full gap table (all rows)
- The `--biz` value
- The `--as-of-date` value
- The `--dry-run` flag (if present)
- The path to the written scan file

Do not emit any dispatches here. Ideas-phase is responsible for all queue-state.json writes.
