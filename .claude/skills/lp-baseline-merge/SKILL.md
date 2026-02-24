# Baseline Merge (S4)

Join parallel fan-out outputs (MARKET-06 + S3 + SELL-01, with optional PRODUCT-02) into a single baseline snapshot and draft manifest.
This is the S4 join barrier in the startup loop.

**Loop-spec reference:** `docs/business-os/startup-loop/loop-spec.yaml` — stage `S4`

## Operating Mode

**STAGE WORKER (data plane)**

This skill writes ONLY to its own stage directory: `stages/S4/`.
It MUST NOT write to `baseline.manifest.json`, `state.json`, or `events.jsonl` (control-plane owned).

## When to Use

Invoked automatically by the startup loop control plane when all required upstream stages are complete.
Not typically invoked directly by users.

## Required Inputs

All inputs are read from upstream `stage-result.json` files within the run directory.

| Source Stage | Artifact Key | Required | Description |
|-------------|--------------|----------|-------------|
| MARKET-06 | `offer` | **yes** | Offer design artifact (ICP, positioning, pricing, objections) |
| S3 | `forecast` | **yes** | 90-day P10/P50/P90 scenario forecast |
| SELL-01 | `channels` | **yes** | Channel strategy + GTM plan |
| SELL-01 | `seo` | no | SEO strategy (optional) |
| SELL-01 | `outreach` | no | Outreach plan (optional) |
| PRODUCT-02 | `adjacent_product_research` | no | Adjacent product research results (optional) |

## Blocking Logic

Before producing any output, verify all required inputs are present and valid.

### Input Validation Sequence

1. **Discover stage results:** Scan `stages/*/stage-result.json` for MARKET-06, S3, SELL-01 (and PRODUCT-02 if present).
2. **Validate each result:** Check `schema_version=1`, `status`, `produced_keys`, `artifacts`.
3. **Check required inputs:**

| Scenario | Action |
|----------|--------|
| MARKET-06 `stage-result.json` missing | Block: `"Required input missing: MARKET-06 stage-result.json not found (offer artifact required)"` |
| S3 `stage-result.json` missing | Block: `"Required input missing: S3 stage-result.json not found (forecast artifact required)"` |
| SELL-01 `stage-result.json` missing | Block: `"Required input missing: SELL-01 stage-result.json not found (channels artifact required)"` |
| MARKET-06 result `status=Failed` | Block: `"Upstream failure: MARKET-06 status=Failed — offer design failed"` |
| S3 result `status=Failed` | Block: `"Upstream failure: S3 status=Failed — forecast failed"` |
| SELL-01 result `status=Failed` | Block: `"Upstream failure: SELL-01 status=Failed — channel strategy failed"` |
| MARKET-06 result `status=Blocked` | Block: `"Upstream blocked: MARKET-06 status=Blocked — offer design blocked"` |
| S3 result `status=Blocked` | Block: `"Upstream blocked: S3 status=Blocked — forecast blocked"` |
| SELL-01 result `status=Blocked` | Block: `"Upstream blocked: SELL-01 status=Blocked — channel strategy blocked"` |
| MARKET-06 `status=Done` but `offer` not in `produced_keys` | Block: `"Malformed input: MARKET-06 completed but offer artifact missing from produced_keys"` |
| S3 `status=Done` but `forecast` not in `produced_keys` | Block: `"Malformed input: S3 completed but forecast artifact missing from produced_keys"` |
| SELL-01 `status=Done` but `channels` not in `produced_keys` | Block: `"Malformed input: SELL-01 completed but channels artifact missing from produced_keys"` |
| All required inputs present and valid | Proceed to snapshot composition |

### Block Output

When blocking, write a `stage-result.json` with `status: Blocked` to `stages/S4/`:

```json
{
  "schema_version": 1,
  "run_id": "<run_id>",
  "stage": "S4",
  "loop_spec_version": "<version>",
  "status": "Blocked",
  "timestamp": "<ISO 8601 UTC>",
  "produced_keys": [],
  "artifacts": {},
  "error": null,
  "blocking_reason": "<specific reason from table above>"
}
```

## Snapshot Composition Algorithm

When all required inputs pass validation:

### 1) Read upstream artifacts

Read the actual artifact files referenced in each stage result's `artifacts` map:
- `offer` from MARKET-06 (e.g., `stages/MARKET-06/offer.md`)
- `forecast` from S3 (e.g., `stages/S3/forecast.md`)
- `channels` from SELL-01 (e.g., `stages/SELL-01/channels.md`)
- `seo` from SELL-01 if present (e.g., `stages/SELL-01/seo.md`)
- `outreach` from SELL-01 if present (e.g., `stages/SELL-01/outreach.md`)
- `adjacent_product_research` from PRODUCT-02 if present (e.g., `stages/PRODUCT-02/adjacent-product-research.md`)

### 2) Compose the baseline snapshot

Create `stages/S4/baseline.snapshot.md` by assembling sections in this priority order:

```markdown
# Baseline Snapshot — <BIZ>

Run: <run_id>
Generated: <ISO 8601 UTC>
Loop spec version: <version>

## 1. Offer Design (MARKET-06)

<contents of offer artifact>

## 2. Forecast (S3)

<contents of forecast artifact>

## 3. Channel Strategy + GTM (SELL-01)

<contents of channels artifact>

## 4. SEO Strategy (SELL-01, optional)

<contents of seo artifact, or "Not produced in this run.">

## 5. Outreach Plan (SELL-01, optional)

<contents of outreach artifact, or "Not produced in this run.">

## 6. Adjacent Product Research (PRODUCT-02, optional)

<contents of adjacent product research artifact, or "Not produced in this run.">

---

_This snapshot was generated by /lp-baseline-merge (S4). It is a candidate baseline
pending review at S5A and commit at S5B._
```

### 3) Determinism guarantee

The snapshot composition is deterministic:
- Sections are always in the fixed priority order above (1-6).
- Artifact contents are included verbatim (no rewriting or summarization).
- Optional sections use the exact placeholder text when absent.
- Same inputs produce identical output (byte-comparable).

### 4) Conflict resolution

There is no content conflict resolution in S4. Each section comes from exactly one upstream stage.
If a future loop-spec version introduces overlapping artifact keys, this policy will be revised.

## Outputs

### Files written to `stages/S4/`

| File | Condition | Description |
|------|-----------|-------------|
| `stage-result.json` | Always | Stage result per `stage-result-schema.md` |
| `baseline.snapshot.md` | `status=Done` only | Composed baseline snapshot |

### Stage Result (Done)

```json
{
  "schema_version": 1,
  "run_id": "<run_id>",
  "stage": "S4",
  "loop_spec_version": "<version>",
  "status": "Done",
  "timestamp": "<ISO 8601 UTC>",
  "produced_keys": ["baseline_snapshot"],
  "artifacts": {
    "baseline_snapshot": "stages/S4/baseline.snapshot.md"
  },
  "error": null,
  "blocking_reason": null
}
```

**Note:** The draft `baseline.manifest.json` is written by the control plane (LPSP-03B `updateManifest`), not by this stage worker. S4's responsibility is only to write the snapshot and its stage-result.json.

## Canonical Paths

| Artifact | Path |
|----------|------|
| Stage result | `<run_root>/stages/S4/stage-result.json` |
| Baseline snapshot | `<run_root>/stages/S4/baseline.snapshot.md` |

Where `<run_root>` is `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/`.

## Data-Plane Ownership Rules

Per `stage-result-schema.md` section 2:

- S4 MAY read `stages/MARKET-06/stage-result.json`, `stages/S3/stage-result.json`, `stages/SELL-01/stage-result.json`, and `stages/PRODUCT-02/stage-result.json`, plus referenced artifact files.
- S4 MUST ONLY write to `stages/S4/`.
- S4 MUST NOT read or write `baseline.manifest.json`, `state.json`, or `events.jsonl`.

## Error Handling

| Error Type | Behavior |
|-----------|----------|
| JSON parse error in upstream stage-result | Write `stage-result.json` with `status: Failed`, `error: "Malformed JSON in <stage> stage-result.json"` |
| Upstream artifact file not found | Write `stage-result.json` with `status: Failed`, `error: "Artifact file missing: <path> referenced in <stage> stage-result"` |
| Unexpected error | Write `stage-result.json` with `status: Failed`, `error: "<description>"` |

## Related Resources

- Stage result schema: `docs/business-os/startup-loop/stage-result-schema.md`
- Manifest schema: `docs/business-os/startup-loop/manifest-schema.md`
- Event/state schema: `docs/business-os/startup-loop/event-state-schema.md`
- Loop spec: `docs/business-os/startup-loop/loop-spec.yaml`
- Workspace paths: `.claude/skills/_shared/workspace-paths.md`
