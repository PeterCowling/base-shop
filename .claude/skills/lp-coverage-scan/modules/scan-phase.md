# Scan Phase Module

Called by `/lp-coverage-scan` after preflight passes. Reads the coverage manifest, scans the strategy directory, and produces a structured gap classification table.

## Inputs

- `--biz <BIZ>` — from SKILL.md invocation
- `--as-of-date <YYYY-MM-DD>` — the reference date for staleness calculation (defaults to today)
- Manifest: `docs/business-os/strategy/<BIZ>/coverage-manifest.yaml`
- Strategy directory: `docs/business-os/strategy/<BIZ>/`

## Step 1: Read and Parse the Manifest

Read `docs/business-os/strategy/<BIZ>/coverage-manifest.yaml`.

Parse the `domains` array. For each entry, extract:
- `domain` — domain ID
- `label` — human-readable label
- `mandatory` — boolean
- `backing_type` — `doc-only` or `data-backed`
- `staleness_threshold_days` — integer
- `artifact_path_patterns` — list of glob patterns (relative to `docs/business-os/strategy/<BIZ>/`)
- `data_connections` — list of integration IDs

**Scope filter**: Process ALL domain entries — mandatory and optional. Optional domains (`mandatory: false`) appear in the output table as `Status: OPTIONAL — skipped` and are not classified. Do not skip them silently.

## Step 2: Scan Artifacts for Each Domain

For each domain entry, expand all `artifact_path_patterns` globs relative to `docs/business-os/strategy/<BIZ>/`. Collect all matching file paths.

**Multiple matches**: Use the most recently modified match (latest filename date or highest mtime). Only one match is needed to satisfy existence.

**If 0 matches**: Record `artifact_found: false`. Gap severity is at minimum CRITICAL (see Step 4).

**If ≥1 match**: Record `artifact_found: true`, `artifact_path: <path>`. Proceed to staleness check (Step 3).

## Step 3: Staleness Detection (Multi-Key Priority Chain)

For each artifact file found in Step 2, determine its last-modified date using the following priority chain. Stop at the first successful resolution. Document the method used per domain entry in the output table.

**Priority order:**

1. **`Last-updated:` frontmatter** — read the YAML/markdown frontmatter block. If key `Last-updated:` is present, parse as `YYYY-MM-DD`. Label: `frontmatter-Last-updated`

2. **`Updated:` frontmatter** — if `Updated:` is present in frontmatter, parse as `YYYY-MM-DD`. Label: `frontmatter-Updated`

3. **`Run-date:` frontmatter** — if `Run-date:` is present, parse as `YYYYMMDD` (8 digits). Convert to `YYYY-MM-DD`. Label: `frontmatter-Run-date`

4. **`Date:` frontmatter** — if `Date:` is present, parse as `YYYY-MM-DD`. Label: `frontmatter-Date`

5. **Filename date prefix** — check if the filename starts with `YYYY-MM-DD-` (e.g. `2026-02-12-brand-identity-dossier.user.md`). Extract the leading date. Label: `filename-prefix`

6. **File mtime** — use the file system modification time. Note: mtime is unreliable after `git checkout` (may reflect checkout time rather than last content change). Label: `mtime` ⚠ (flag with a warning in the output)

**Parse error handling**: If a frontmatter date is found but cannot be parsed as a valid date, skip to the next priority level and note `parse-error` in the output.

**Staleness calculation**:
- Compute `days_since_update = (as_of_date - resolved_date).days`
- `stale = days_since_update > staleness_threshold_days`
- If date could not be resolved by any method: record `date_resolved: false`; treat as stale (conservative fallback)

## Step 4: Data-Connection Check

For each domain entry with `data_connections` (non-empty list), check each integration ID against the following fixed lookup table.

**Phase 1 integration lookup table:**

| Integration ID | Check location | Signal of presence |
|---|---|---|
| `stripe` | `data/` directory or `packages/` directory | Any file referencing Stripe API keys, order records, or Stripe webhook configs |
| `firebase` | Firebase config files (`*.firebase*`, `firebaserc`, `firebase.json`) or `packages/` | Presence of Firebase project config |
| `ga4` | GA4 property config in strategy docs or `.env*` files | GA4 measurement ID (format `G-XXXXXXXXXX`) present anywhere in repo |
| `octorate` | `.tmp/octorate-state.json` or `apps/reception/` Octorate references | Any Octorate session file or config reference |

**Configured** = at least one check signal found for the integration ID.
**Not configured** = no signal found.

**Unknown integration IDs** (not in the table above): treat as `not configured`; note `unknown-integration-id` in output.

**For `doc-only` domains**: skip data-connection check entirely; record `data_connections: n/a`.

## Step 5: Gap Classification

Classify each mandatory domain entry using the following rules. Apply rules in order — the first matching rule wins.

**Classification rules:**

| Rule | Condition | Severity |
|---|---|---|
| R1: No artifact, no data | `artifact_found: false` AND (`backing_type: doc-only` OR all `data_connections` not configured) | **CRITICAL** |
| R2: No artifact, data present | `artifact_found: false` AND at least one `data_connections` configured | **MAJOR** — data exists but no artifact captures it |
| R3: Stale artifact, no data | `artifact_found: true` AND `stale: true` AND (`backing_type: doc-only` OR all `data_connections` not configured) | **MAJOR** |
| R4: Stale artifact, data present | `artifact_found: true` AND `stale: true` AND at least one `data_connections` configured | **MAJOR** |
| R5: Fresh artifact, data missing | `artifact_found: true` AND `stale: false` AND `backing_type: data-backed` AND all `data_connections` not configured | **MAJOR** — artifact exists but data backing is absent |
| R6: Fresh artifact, thin | `artifact_found: true` AND `stale: false` AND (data check OK or `doc-only`) AND artifact is structurally thin | **MINOR** |
| R7: Fresh artifact, complete | `artifact_found: true` AND `stale: false` AND (data check OK or `doc-only`) AND artifact is substantive | **OK** — no gap |

**Thinness assessment (R6)**: Agent judgment. An artifact is thin if it contains only a title and ≤2 paragraphs, or has no substantive content (empty sections, placeholder text). When uncertain, classify as MINOR rather than OK.

**Optional domains** (`mandatory: false`): record as `Status: OPTIONAL — skipped`. No severity classification. Do not emit dispatches.

**Domains with `date_resolved: false`**: treat the artifact as stale (conservative; see Step 3). Note `date_resolved: false` in evidence column.

## Step 6: Produce Gap Classification Table

Write the gap table as a structured markdown table. This is the primary output of scan-phase — it is consumed directly by emit-phase.

**Output format:**

```markdown
## Gap Classification Table

Scan run: <BIZ> as of <YYYY-MM-DD>

| Domain | Label | Mandatory | Severity | Status | Artifact | Staleness-source | Evidence |
|---|---|---|---|---|---|---|---|
| Financial | Financial Health | true | CRITICAL | No artifact found | — | n/a | No files matched patterns: financial/**/*.md, financial/**/*.json, signal-review-*.md |
| Inventory | Inventory & Stock | false | — | OPTIONAL — skipped | — | n/a | optional domain; not classified |
| Customer | Customer Insight | true | OK | Fresh | docs/.../2026-02-12-icp.md | filename-prefix | Last updated 2026-02-12 (45d ago); threshold 60d |
| ...
```

**Column definitions:**
- `Severity`: CRITICAL | MAJOR | MINOR | OK | — (for optional)
- `Staleness-source`: frontmatter-{key} | filename-prefix | mtime ⚠ | n/a | date_resolved:false
- `Evidence`: one-line description — which files matched (or didn't), what date was used, what data connections were checked

**MINOR gaps** appear in the table with `Severity: MINOR`. They are NOT passed to emit-phase.

**After the table**, write a short summary section:

```markdown
## Scan Summary

- CRITICAL gaps: N
- MAJOR gaps: N
- MINOR gaps: N
- OK domains: N
- Optional domains skipped: N

Domains to emit (CRITICAL + MAJOR): [list domain IDs]
```

## Edge Cases

- **Domain with `artifact_path_patterns: []` (empty list)**: treat as CRITICAL if `data_connections` also empty; MAJOR if at least one `data_connections` configured.
- **Multiple artifacts matching patterns**: use most recently dated match; note all matched paths in Evidence column.
- **Artifact with future date (clock skew)**: treat as fresh; add note `future-date-anomaly` in Evidence.
- **`Run-date: YYYYMMDD` parse**: strip hyphens, parse as 4-digit year + 2-digit month + 2-digit day.
- **`backing_type: data-backed` with empty `data_connections`**: treat `data_connections` check as not-configured (same as absent).

## Output Handoff to emit-phase

After writing the gap table, pass the following to emit-phase:
1. The full gap table (markdown)
2. The scan summary block (CRITICAL count, MAJOR count, list of domains to emit)
3. The `--biz`, `--as-of-date`, and `--dry-run` flags as-is (emit-phase uses them)
