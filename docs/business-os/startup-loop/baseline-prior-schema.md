---
Type: Reference
Status: Canonical
Domain: Business-OS
Last-reviewed: 2026-02-13
---

# Baseline Prior Schema

Canonical schema for machine-owned priors blocks in baseline artifacts and the prior
delta format used by the learning compiler.

**Decision reference:** `docs/plans/learning-compiler-plan.md` (LC-01, DL-LC-02, DL-LC-04)

## 1) Purpose

Baseline artifacts contain both human-editable narrative and machine-owned priors. The
learning compiler extracts priors from a bounded `## Priors (Machine)` block, updates
only that block, and preserves all human narrative unchanged. This schema defines:

1. The machine priors block format.
2. The prior object schema with typed fields.
3. PriorRef grammar for referencing priors across artifacts.
4. The prior delta schema for invertible updates.

## 2) Machine Priors Block Format

Each baseline artifact (e.g., `HEAD-forecast-seed.user.md`) must contain exactly one
`## Priors (Machine)` section with a JSON code fence:

```markdown
## Priors (Machine)

Last updated: 2026-02-13 15:30 UTC

```json
[
  {
    "id": "forecast.target.mrr_month3",
    "type": "target",
    "statement": "Month 3 MRR target is $4000",
    "confidence": 0.6,
    "value": 4000,
    "unit": "USD",
    "last_updated": "2026-02-10T12:00:00Z",
    "evidence": ["Initial market sizing analysis"]
  }
]
```

## Other Business Context

[Human-editable narrative, analysis, charts, etc.]
```

### Block requirements

1. **Section header:** Must be exactly `## Priors (Machine)` (case-sensitive, level-2 heading).
2. **Optional metadata line:** Single `Last updated: <timestamp>` line is allowed before code fence.
3. **JSON code fence:** Must use triple-backtick JSON fence with valid array of prior objects.
4. **Bounded update:** Learning compiler may update only this block and the optional metadata line.
5. **Preserve narrative:** All content outside this block must remain unchanged during updates.

## 3) Prior Object Schema

Each prior is a JSON object with the following fields:

```json
{
  "id": "<string: unique prior identifier>",
  "type": "<enum: assumption | constraint | target | preference | risk>",
  "statement": "<string: human-readable prior statement>",
  "confidence": "<number: 0.0-1.0>",
  "value": "<number|null: numeric value when applicable>",
  "unit": "<string|null: unit of measurement when value is present>",
  "operator": "<enum|null: eq | lt | lte | gt | gte when value is constrained>",
  "range": "<object|null: {min, max} when value is ranged>",
  "last_updated": "<string: ISO 8601 UTC>",
  "evidence": "<string[]: list of evidence references>"
}
```

### Field definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique identifier within artifact scope. Must be valid identifier (alphanumeric + underscore + dot). |
| `type` | enum | yes | Prior type: `assumption`, `constraint`, `target`, `preference`, or `risk`. |
| `statement` | string | yes | Human-readable statement of the prior. |
| `confidence` | number | yes | Confidence level from `0.0` (no confidence) to `1.0` (full confidence). |
| `value` | number or null | no | Numeric value when prior has quantifiable target/constraint. |
| `unit` | string or null | no | Unit of measurement (e.g., `USD`, `users`, `days`). Required when `value` is present. |
| `operator` | enum or null | no | Comparison operator: `eq`, `lt`, `lte`, `gt`, `gte`. Used with `value` for constraints. |
| `range` | object or null | no | Range specification `{min, max}` when prior has bounded value. |
| `last_updated` | string | yes | ISO 8601 UTC timestamp of last update. |
| `evidence` | string[] | yes | Array of evidence references (free-form strings, typically artifact paths or summaries). |

### Validation rules

1. `id` must be unique within artifact scope.
2. `type` must be one of the five enumerated values.
3. `confidence` must be in range `[0.0, 1.0]`.
4. If `value` is present, `unit` must also be present.
5. If `operator` is present, `value` must also be present.
6. If `range` is present, it must have `min` and `max` numeric fields with `min <= max`.
7. `last_updated` must be valid ISO 8601 UTC timestamp.
8. `evidence` must be non-empty array.

### Prior types

| Type | Description | Example |
|---|---|---|
| `assumption` | Unvalidated belief about market, customer, or context | "Enterprise buyers require on-prem deployment" |
| `constraint` | Hard boundary condition | "Budget cannot exceed $50k/month" |
| `target` | Goal or success metric | "Month 3 MRR target is $4000" |
| `preference` | Directional preference without hard constraint | "Prefer organic traffic over paid ads" |
| `risk` | Known risk factor or failure mode | "High churn risk if onboarding exceeds 30 days" |

## 4) PriorRef Grammar

Prior references enable linking from experiment specs/readouts to specific priors across
the baseline artifact set.

### PriorRef forms

1. **Scope-qualified:** `artifact_scope#prior_id`
   - Example: `forecast#forecast.target.mrr_month3`
   - Artifact scope is short-form key (e.g., `forecast`, `offer`, `channels`).
   - Preferred form for clarity and stability.

2. **Path-qualified:** `artifact_path#prior_id`
   - Example: `docs/business-os/startup-baselines/HEAD-forecast-seed.user.md#forecast.target.mrr_month3`
   - Full relative path to artifact.
   - Used when scope is ambiguous or in delta output.

3. **Bare ID:** `prior_id`
   - Example: `forecast.target.mrr_month3`
   - Only valid when prior ID is globally unique across manifest-tracked baseline set.
   - Discouraged except for small baseline sets.

### Uniqueness rules

- Within a single artifact, all prior IDs must be unique.
- Across artifacts in the manifest-tracked baseline set:
  - If a bare prior ID appears in multiple artifacts, it is **invalid** unless all
    references use scope/path qualification.
  - The compiler builds a prior index at baseline load time and rejects duplicate bare IDs.

### PriorRef validation examples

#### Valid: Scope-qualified, unique IDs

Manifest tracks two artifacts:
- `forecast-seed.user.md` with prior `forecast.target.mrr_month3`
- `offer.user.md` with prior `offer.pricing.tier1_price`

Experiment readout:
```json
{
  "prior_refs": [
    "forecast#forecast.target.mrr_month3",
    "offer#offer.pricing.tier1_price"
  ]
}
```

Compiler resolves both references successfully.

#### Valid: Bare ID, globally unique

Only one artifact with prior `forecast.target.mrr_month3`.

Experiment readout:
```json
{
  "prior_refs": ["forecast.target.mrr_month3"]
}
```

Compiler resolves reference successfully (warns that scope qualification is preferred).

#### Invalid: Duplicate bare ID

Two artifacts both have prior `target.customer_retention`.

Experiment readout:
```json
{
  "prior_refs": ["target.customer_retention"]
}
```

Compiler rejects with error:
```
Duplicate prior ID 'target.customer_retention' found in:
  - docs/business-os/startup-baselines/HEAD-forecast-seed.user.md
  - docs/business-os/startup-baselines/HEAD-offer.user.md
Use scope-qualified or path-qualified references.
```

#### Valid: Path-qualified resolution

Experiment readout:
```json
{
  "prior_refs": [
    "docs/business-os/startup-baselines/HEAD-forecast-seed.user.md#target.customer_retention"
  ]
}
```

Compiler resolves to specific artifact.

## 5) Prior Delta Schema

Prior deltas are emitted by the learning compiler and stored in delta artifacts (e.g.,
`deltas/7b8e4f2a.json`). Each delta is invertible to support supersede semantics.

```json
{
  "schema_version": 1,
  "deltas": [
    {
      "artifact_path": "<string: relative path to baseline artifact>",
      "prior_id": "<string: prior identifier>",
      "old_confidence": "<number: 0.0-1.0>",
      "new_confidence": "<number: 0.0-1.0>",
      "old_value": "<number|null: optional prior value before update>",
      "new_value": "<number|null: optional prior value after update>",
      "old_unit": "<string|null: optional unit before update>",
      "new_unit": "<string|null: optional unit after update>",
      "reason": "<string: human-readable reason for update>",
      "evidence_ref": "<string: path to experiment readout or decision doc>",
      "mapping_confidence": "<enum: EXACT | HIGH | MEDIUM | LOW>"
    }
  ]
}
```

### Field definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `schema_version` | integer | yes | Always `1` for this version. |
| `deltas` | array | yes | Array of individual prior delta objects. |
| `artifact_path` | string | yes | Relative path to baseline artifact containing the prior. |
| `prior_id` | string | yes | Prior identifier (must exist in target artifact). |
| `old_confidence` | number | yes | Confidence value before update (0.0-1.0). |
| `new_confidence` | number | yes | Confidence value after update (0.0-1.0). |
| `old_value` | number or null | no | Prior value before update (when applicable). |
| `new_value` | number or null | no | Prior value after update (when applicable). |
| `old_unit` | string or null | no | Unit before update (when applicable). |
| `new_unit` | string or null | no | Unit after update (when applicable). |
| `reason` | string | yes | Human-readable reason for the update. |
| `evidence_ref` | string | yes | Reference to experiment readout or decision doc. |
| `mapping_confidence` | enum | yes | Mapping confidence: `EXACT` (from prior_refs), `HIGH`, `MEDIUM`, `LOW` (from fallback). |

### Invertibility

Each delta is invertible: swapping `old_*` ↔ `new_*` fields produces the inverse delta.
This enables supersede replacement-consistency (see `learning-ledger-schema.md` §5).

### Confidence update formula

From LC-04 (DL-LC-02):

- **Weights:** `HIGH=1.0`, `MEDIUM=0.5`, `LOW=0.25`
- **PASS:** `new_confidence = min(1.0, old_confidence + 0.2 * weight)`
- **FAIL:** `new_confidence = max(0.0, old_confidence - 0.3 * weight)`
- **INCONCLUSIVE:** `new_confidence = old_confidence` (no change)

### Examples

#### Example 1: PASS/HIGH increases confidence

Experiment passes with high confidence.

```json
{
  "schema_version": 1,
  "deltas": [
    {
      "artifact_path": "docs/business-os/startup-baselines/HEAD-forecast-seed.user.md",
      "prior_id": "forecast.target.mrr_month3",
      "old_confidence": 0.6,
      "new_confidence": 0.8,
      "old_value": null,
      "new_value": null,
      "old_unit": null,
      "new_unit": null,
      "reason": "Month 3 MRR exceeded target by 5%",
      "evidence_ref": "docs/business-os/strategy/HEAD/2026-02-13-forecast-readout.md",
      "mapping_confidence": "EXACT"
    }
  ]
}
```

Calculation: `0.6 + (0.2 * 1.0) = 0.8`

#### Example 2: FAIL/MEDIUM decreases confidence

Experiment fails with medium confidence.

```json
{
  "schema_version": 1,
  "deltas": [
    {
      "artifact_path": "docs/business-os/startup-baselines/HEAD-offer.user.md",
      "prior_id": "offer.pricing.tier1_acceptable",
      "old_confidence": 0.7,
      "new_confidence": 0.55,
      "old_value": null,
      "new_value": null,
      "old_unit": null,
      "new_unit": null,
      "reason": "Pricing survey showed 40% resistance to tier 1 price point",
      "evidence_ref": "docs/business-os/strategy/HEAD/2026-02-14-pricing-test.md",
      "mapping_confidence": "EXACT"
    }
  ]
}
```

Calculation: `0.7 - (0.3 * 0.5) = 0.7 - 0.15 = 0.55`

#### Example 3: Value update with PASS/HIGH

Experiment validates updated target value.

```json
{
  "schema_version": 1,
  "deltas": [
    {
      "artifact_path": "docs/business-os/startup-baselines/BRIK-forecast-seed.user.md",
      "prior_id": "forecast.target.occupancy_rate",
      "old_confidence": 0.5,
      "new_confidence": 0.7,
      "old_value": 0.75,
      "new_value": 0.80,
      "old_unit": "ratio",
      "new_unit": "ratio",
      "reason": "Historical occupancy data shows consistent 80% rate achievable",
      "evidence_ref": "docs/business-os/strategy/BRIK/2026-02-13-occupancy-analysis.md",
      "mapping_confidence": "EXACT"
    }
  ]
}
```

Calculation: `0.5 + (0.2 * 1.0) = 0.7`
Value updated: `0.75 → 0.80` based on evidence.

## 6) Relationship to Other Schemas

| Schema | Owner | Defined in |
|---|---|---|
| Baseline prior schema (this doc) | Control plane (LC-01, LC-03) | This document |
| Learning ledger | Control plane (LC-01, LC-02) | `learning-ledger-schema.md` |
| Baseline manifest | Control plane (LPSP-03B) | `manifest-schema.md` |
| Event ledger + derived state | Control plane (LPSP-04A) | `event-state-schema.md` |
| Stage result | Stage workers (data plane) | `stage-result-schema.md` |
