---
Type: Validation-Protocol
Plan: coverage-manifest-scan-core
Task: TASK-05
Created: 2026-02-26
Status: Ready-for-execution
Blocked-by: IDEA-DISPATCH-20260226-0032 (BRIK manifest not yet created)
---

# lp-coverage-scan Validation Protocol — BRIK

Manual validation protocol for the `lp-coverage-scan` skill.

**Execute once** companion packet IDEA-DISPATCH-20260226-0032 delivers
`docs/business-os/strategy/BRIK/coverage-manifest.yaml`.

---

## Step 0: Prerequisites Check (BLOCKER)

Before any other step, verify:

1. **BRIK manifest exists:**
   ```
   docs/business-os/strategy/BRIK/coverage-manifest.yaml
   ```
   If missing: stop. Companion packet IDEA-DISPATCH-20260226-0032 must deliver
   this file before the protocol can run.

2. **Note baseline queue counts** (for verification in Step 4):
   - Open `docs/business-os/startup-loop/ideas/trial/queue-state.json`
   - Record `counts.enqueued` and `counts.total` before running

3. **Confirm working directory is repo root:**
   ```bash
   pwd  # should end in /base-shop
   ```

---

## Step 1: Dry Run (read-only scan)

```
/lp-coverage-scan --biz BRIK --dry-run
```

**Expected outputs:**

1. Gap report written to `docs/business-os/strategy/BRIK/coverage-scan-<today>.md`
2. Gap report header contains `[DRY RUN — no dispatches emitted]`
3. YAML frontmatter `Status: [DRY RUN — no dispatches emitted]`
4. `Dispatches emitted: 0 (dry run)` in Scan Summary
5. `queue-state.json` NOT modified — `counts.enqueued` matches baseline from Step 0

---

## Step 2: Inspect Gap Report

Open `docs/business-os/strategy/BRIK/coverage-scan-<today>.md`.

**Required structure:**

```markdown
---
Type: Coverage-Scan
Business: BRIK
Scan-date: <YYYY-MM-DD>
Status: [DRY RUN — no dispatches emitted]
---

# Coverage Scan Report — BRIK (<YYYY-MM-DD>)

[DRY RUN — no dispatches emitted]

## Gap Classification Table
...

## Scan Summary

- CRITICAL gaps: N
- MAJOR gaps: N
- MINOR gaps: N
- OK domains: N
- Optional domains skipped: N

Dispatches emitted: 0 (dry run)
```

**Gap table columns required:** Domain | Label | Mandatory | Severity | Status |
Artifact | Staleness-source | Evidence

---

## Step 3: Verify Gap Classification

Compare the Gap Classification Table against the expected BRIK gaps.

### Expected BRIK Gaps at Plan Time (2026-02-26)

Based on BRIK strategy directory state as of plan date:

| Domain | Expected Severity | Evidence Basis |
|---|---|---|
| Customer | CRITICAL | No `customer/**/*.md`, `personas*.md`, or `nps-*.md` under BRIK strategy dir |
| Compliance | CRITICAL | No `compliance/**/*.md`, `legal/**/*.md`, or `policies/**/*.md` under BRIK strategy dir |
| Operational | CRITICAL or MAJOR | No `operations/`, `sops/`, or `runbooks/` dirs; depends on Octorate integration check |
| Financial | OK or MAJOR | `signal-review-*.md` matches financial pattern (threshold 30d); severity depends on Stripe config |
| Marketing | OK or MAJOR | `signal-review-*.md` matches marketing pattern (threshold 30d); depends on GA4 config |
| Inventory | OPTIONAL — skipped | Hospitality profile: `mandatory: false` |

**Minimum expectation:** Gap table shows ≥ 2 domains with CRITICAL severity.

**Signal review staleness note:** As of 2026-02-26:
- `signal-review-20260226-1641-W09.md` — 0 days old → within 30d threshold → not stale
- `signal-review-20260218-1238-W08.md` — 8 days old → within threshold → not stale

If Financial/Marketing show as CRITICAL instead of OK/MAJOR, the likely cause is that
the Stripe or GA4 data connection was not configured (R5 in the risk table: fresh artifact
but no data backing).

---

## Step 4: Live Run (emit dispatches)

```
/lp-coverage-scan --biz BRIK
```

**Expected outputs:**

1. Writer lock acquired without error
2. Gap report at `docs/business-os/strategy/BRIK/coverage-scan-<today>.md`
   overwritten — `Status: Active`, no `[DRY RUN]` line
3. `Dispatches emitted: N` where N ≥ 1
4. `queue-state.json` updated:
   - `counts.enqueued` increased by N from baseline
   - `counts.total` increased by N from baseline
   - N new dispatch packets at **front** of `dispatches[]` array

If writer lock acquisition fails, the skill should print:
```
Error: Writer lock acquisition failed. No dispatches written.
Retry: scripts/agents/with-writer-lock.sh -- /lp-coverage-scan --biz BRIK
```

---

## Step 5: Schema Validation — Dispatches

For each new dispatch appended in Step 4, verify all required fields are present.

### Required Fields Checklist (dispatch.v1)

| Field | Required Value / Pattern |
|---|---|
| `schema_version` | `"dispatch.v1"` |
| `dispatch_id` | `"IDEA-DISPATCH-<14-digit>-<NNNN>"` e.g. `"IDEA-DISPATCH-20260226143052-0001"` |
| `mode` | `"trial"` |
| `root_event_id` | `"scan:BRIK:<domain>:<anchor-slug>:<YYYYMMDD>"` |
| `anchor_key` | lowercase hyphenated, ≤ 20 chars |
| `cluster_key` | `"BRIK:<domain>:<anchor-slug>:scan:<YYYYMMDD>"` |
| `cluster_fingerprint` | 32-char hex string |
| `lineage_depth` | `0` |
| `area_anchor` | ≤ 12 words; see anchor check below |
| `location_anchors` | array with ≥ 1 path |
| `provisional_deliverable_family` | `"doc"` or `"data-source+doc"` |
| `recommended_route` | `"lp-do-fact-find"` |
| `status` | `"fact_find_ready"` |
| `evidence_refs` | array with ≥ 2 entries |

### Anchor Phrasing Check

`area_anchor` must NOT contain any of these terms:

`process`, `throughput`, `determinism`, `startup loop`, `pipeline`, `queue`,
`classifier`, `prioriti`

### Compliance Gap Check (if Compliance gap present)

- [ ] `priority: "P1"` (not P2 or P3)
- [ ] At least one `evidence_refs` entry starts with `"compliance-risk:"`
- [ ] No `risk_vector` or `risk_ref` fields present (schema: `additionalProperties: false`)

### Forbidden Fields

The following fields are NOT in the dispatch.v1 schema and must not appear:

- `risk_vector`
- `risk_ref`

---

## Step 6: Final Report Check

Open `docs/business-os/strategy/BRIK/coverage-scan-<today>.md` (live run version).

Verify:
- [ ] `Status: Active` in frontmatter (not dry-run)
- [ ] `Dispatches emitted: N` where N ≥ 1
- [ ] No `[DRY RUN]` label in header

---

## Pass Criteria (Binary)

All 5 must be met for a passing validation:

| # | Criterion | Pass | Fail |
|---|---|---|---|
| P1 | Gap report exists at correct path | `docs/business-os/strategy/BRIK/coverage-scan-<today>.md` exists with valid frontmatter | File missing or no frontmatter |
| P2 | ≥ 1 CRITICAL gap identified | Scan Summary shows `CRITICAL gaps: N` where N ≥ 1 | N = 0 |
| P3 | ≥ 1 dispatch emitted (live run) | `Dispatches emitted: N` where N ≥ 1 AND `queue-state.json` counts increased by N | N = 0 or counts unchanged |
| P4 | All dispatches pass schema validation | Every new dispatch has all 14 required fields; no forbidden fields present | Any field missing or forbidden field present |
| P5 | Dry-run did NOT write dispatches | `counts.enqueued` unchanged after Step 1; gap report header includes `[DRY RUN]` | Counts changed or no DRY RUN label |

---

## Fail Actions

If any pass criterion fails:

1. Note which criterion failed and the exact mismatch (field name, value seen vs expected)
2. Find the corresponding rule in the relevant module:
   - Classification mismatch → `modules/scan-phase.md`
   - Dispatch emission or schema mismatch → `modules/emit-phase.md`
   - Invocation / preflight issue → `.claude/skills/lp-coverage-scan/SKILL.md`
3. Open a fact-find for the affected module — do not manually patch `queue-state.json`

---

## Invocation Reference

```
# Dry-run (read-only, safe for testing):
/lp-coverage-scan --biz BRIK --dry-run

# Live run (writes gap report + dispatches):
/lp-coverage-scan --biz BRIK

# With specific as-of date:
/lp-coverage-scan --biz BRIK --as-of-date 2026-03-01

# With writer lock (explicit):
scripts/agents/with-writer-lock.sh -- /lp-coverage-scan --biz BRIK
```

---

## Execution Log

*Record execution results here when the protocol is run.*

| Date | Operator | Outcome | Notes |
|---|---|---|---|
| (pending) | | | Blocked until IDEA-DISPATCH-20260226-0032 delivers BRIK manifest |
