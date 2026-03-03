---
Type: Spike-Artifact
Status: Complete
Domain: STRATEGY
Feature-Slug: startup-loop-build-reflection-gate
Task-ID: TASK-01
Last-reviewed: 2026-02-27
artifact: spike-artifact
---

# TASK-01 Schema Spec — `pattern-reflection.user.md`

## 1. Overview

This document defines the schema and routing criteria for the `pattern-reflection.user.md` artifact used by the startup-loop build reflection gate. The artifact is designed to be minimal, deterministic, and compatible with the existing idea classifier pipeline.

The schema captures structured post-build patterns, including access gaps discovered mid-build. It includes explicit routing targets and occurrence thresholds so promotion decisions are reproducible: deterministic patterns promote at `occurrence_count >= 3`; ad-hoc patterns promote at `occurrence_count >= 2`; otherwise items defer.

## 2. `pattern-reflection.user.md` Schema

### 2.1 Field Table (entry-level `entries[]`)

| Field | Type | Required/Optional | Description | Example |
|---|---|---|---|---|
| `pattern_summary` | `string` (1..100 chars) | Required | Plain summary of the repeated pattern. | `Sync dependency gap discovered after implementation started` |
| `category` | `"deterministic" \| "ad_hoc" \| "access_gap" \| "unclassified"` | Required | Pattern class used for routing logic. | `access_gap` |
| `routing_target` | `"loop_update" \| "skill_proposal" \| "defer"` | Required | Deterministic routing result from decision tree. | `defer` |
| `occurrence_count` | `integer` (`>= 1`) | Required | Number of observed occurrences across builds/artifacts used for thresholding. | `1` |
| `evidence_refs` | `string[]` | Optional | Source pointers backing the pattern claim. | `["docs/plans/xa-uploader-usability-hardening/results-review.user.md#new-idea-candidates"]` |
| `idea_key` | `string` | Optional | Stable key for downstream idea/process references. | `xa-uploader-sync-scripts-blocker` |
| `classifier_input` | `IdeaClassificationInputSubset` (object) | Optional | Directly mappable subset of `IdeaClassificationInput` from `lp-do-ideas-classifier.ts`. | `{ "idea_id": "xa-uploader-sync-scripts-blocker", "title": "Restore XA sync scripts", "trigger": "artifact_delta" }` |
| `access_declarations` | `AccessDeclaration[]` | Optional | Access declarations linked to this specific pattern when relevant (mostly `access_gap`). | `[{ "data_source": "Octorate API", "required_access_type": "credentials", "verified_before_build": false, "discovery_event": true }]` |

### 2.2 `IdeaClassificationInputSubset` (allowed keys for `classifier_input`)

All keys below are optional and keep original `IdeaClassificationInput` names/types so no wrapper is needed.

| Field | Type |
|---|---|
| `idea_id` | `string` |
| `title` | `string` |
| `source_path` | `string` |
| `source_excerpt` | `string` |
| `created_at` | `string` (ISO-8601) |
| `trigger` | `"artifact_delta" \| "operator_idea"` |
| `artifact_id` | `string \| null` |
| `evidence_refs` | `string[]` |
| `area_anchor` | `string` |
| `content_tags` | `string[]` |
| `incident_id` | `string \| null` |
| `deadline_date` | `string \| null` |
| `repro_ref` | `string \| null` |
| `leakage_estimate_value` | `number \| null` |
| `leakage_estimate_unit` | `string \| null` |
| `first_observed_at` | `string \| null` |
| `risk_vector` | `string \| null` |
| `risk_ref` | `string \| null` |
| `failure_metric` | `string \| null` |
| `baseline_value` | `number \| null` |
| `funnel_step` | `string \| null` |
| `metric_name` | `string \| null` |
| `parent_idea_id` | `string \| null` |
| `is_prerequisite` | `boolean` |

### 2.3 YAML Frontmatter Spec

Required top-level frontmatter fields:

```yaml
schema_version: pattern-reflection.v1
feature_slug: <feature-slug>
generated_at: <ISO-8601>
entries: []
```

Notes:
- `entries` is an array of entry objects matching section 2.1.
- Empty-state artifact is valid with `entries: []` plus `None identified` body text.

### 2.4 Section Structure Spec

`pattern-reflection.user.md` on-disk structure:

1. YAML frontmatter (includes `schema_version`, `feature_slug`, `generated_at`, `entries`)
2. `# Pattern Reflection`
3. `## Patterns`
- Either rendered per-entry bullets/tables derived from `entries`, or `None identified`
4. `## Access Declarations`
- Either rendered declarations (artifact-level summary of access records), or `None identified`

## 3. Access Declarations Sub-schema

### 3.1 Field Table (`AccessDeclaration`)

| Field | Type | Required/Optional | Description | Example |
|---|---|---|---|---|
| `data_source` | `string` | Required | External source/service needed during build or investigation. | `GA4 property for BRIK` |
| `required_access_type` | `"api_key" \| "mcp_tool" \| "database" \| "credentials" \| "other"` | Required | Access modality required to use source. | `mcp_tool` |
| `verified_before_build` | `boolean` | Required | Whether access was confirmed before build execution started. | `false` |
| `discovery_event` | `boolean` | Required | `true` when source was discovered mid-build, not declared upfront. | `true` |
| `notes` | `string` | Optional | Clarifying context, missing scope, or follow-up action. | `MCP server reachable but tool auth missing for production shop.` |

### 3.2 Nesting and Placement

- Entry-scoped nesting: `entries[].access_declarations[]` links access evidence to a specific pattern.
- Artifact summary section: `## Access Declarations` should also show a de-duplicated summary view for quick operator review.
- If no declarations exist, the section must still be present with `None identified`.

## 4. Routing Criteria Decision Tree

### 4.1 Deterministic Decision Logic (pseudocode)

```text
for each entry in entries:
  if entry.category == "unclassified":
    entry.routing_target = "defer"
    continue

  if entry.category == "deterministic":
    if entry.occurrence_count >= 3:
      entry.routing_target = "loop_update"
    else:
      entry.routing_target = "defer"
    continue

  if entry.category == "ad_hoc":
    if entry.occurrence_count >= 2:
      entry.routing_target = "skill_proposal"
    else:
      entry.routing_target = "defer"
    continue

  if entry.category == "access_gap":
    entry.routing_target = "defer"
    continue
```

Category definitions:
- `deterministic`: repeatable rule-like pattern suitable for loop/skill codification.
- `ad_hoc`: useful recurring pattern with context variance; candidate for `tool-*` skill.
- `access_gap`: missing upfront access declaration discovered during build.
- `unclassified`: insufficient signal; must defer.

### 4.2 Worked Example 1 (deterministic, promoted)

Input:
- `category = deterministic`
- `occurrence_count = 3`

Output:
- `routing_target = loop_update`

Interpretation:
- Pattern crossed deterministic threshold; propose update to an existing startup-loop stage or existing skill.

### 4.3 Worked Example 2 (ad_hoc, promoted)

Input:
- `category = ad_hoc`
- `occurrence_count = 2`

Output:
- `routing_target = skill_proposal`

Interpretation:
- Pattern crossed ad-hoc threshold; propose new `tool-*` skill (operator confirmation required).

## 5. IdeaClassificationInput Compatibility Note

### 5.1 Mapping Table

| Pattern field | IdeaClassificationInput field | Mapping |
|---|---|---|
| `classifier_input.idea_id` | `idea_id` | Direct |
| `classifier_input.title` | `title` | Direct |
| `classifier_input.source_path` | `source_path` | Direct |
| `classifier_input.source_excerpt` | `source_excerpt` | Direct |
| `classifier_input.created_at` | `created_at` | Direct |
| `classifier_input.trigger` | `trigger` | Direct |
| `classifier_input.artifact_id` | `artifact_id` | Direct |
| `classifier_input.evidence_refs` | `evidence_refs` | Direct |
| `classifier_input.area_anchor` | `area_anchor` | Direct |
| `classifier_input.content_tags` | `content_tags` | Direct |
| `classifier_input.incident_id` | `incident_id` | Direct |
| `classifier_input.deadline_date` | `deadline_date` | Direct |
| `classifier_input.repro_ref` | `repro_ref` | Direct |
| `classifier_input.leakage_estimate_value` | `leakage_estimate_value` | Direct |
| `classifier_input.leakage_estimate_unit` | `leakage_estimate_unit` | Direct |
| `classifier_input.first_observed_at` | `first_observed_at` | Direct |
| `classifier_input.risk_vector` | `risk_vector` | Direct |
| `classifier_input.risk_ref` | `risk_ref` | Direct |
| `classifier_input.failure_metric` | `failure_metric` | Direct |
| `classifier_input.baseline_value` | `baseline_value` | Direct |
| `classifier_input.funnel_step` | `funnel_step` | Direct |
| `classifier_input.metric_name` | `metric_name` | Direct |
| `classifier_input.parent_idea_id` | `parent_idea_id` | Direct |
| `classifier_input.is_prerequisite` | `is_prerequisite` | Direct |
| `idea_key` | `idea_id` | Optional fallback only when `classifier_input.idea_id` absent |
| `evidence_refs` | `evidence_refs` | Optional fallback only when `classifier_input.evidence_refs` absent |

### 5.2 Compatibility Conclusion

Compatibility is acceptable without a wrapper because `classifier_input` preserves canonical `IdeaClassificationInput` field names and types. No blocking mismatch found.

Non-blocking note:
- `pattern_summary`, `category`, `routing_target`, and `occurrence_count` are routing metadata for the reflection gate and are intentionally outside `IdeaClassificationInput`.

## 6. Annotated Fixture

Derived from:
- `docs/plans/xa-uploader-usability-hardening/results-review.user.md` (`## New Idea Candidates` entries)

### 6.1 Fixture (as written on disk)

```markdown
---
schema_version: pattern-reflection.v1
feature_slug: xa-uploader-usability-hardening
generated_at: 2026-02-27T12:00:00Z
entries:
  - pattern_summary: Sync dependency gap discovered after implementation started # from "sync journey blocked by missing script dependencies"
    category: access_gap # mid-build dependency/access discovery pattern
    routing_target: defer # access_gap defaults to defer in this schema version
    occurrence_count: 1 # observed in this completed build artifact
    evidence_refs:
      - docs/plans/xa-uploader-usability-hardening/results-review.user.md#observed-outcomes # primary evidence
      - docs/plans/xa-uploader-usability-hardening/results-review.user.md#new-idea-candidates # follow-on action evidence
    idea_key: xa-uploader-sync-scripts-blocker # stable slug for downstream tracking
    classifier_input:
      idea_id: xa-uploader-sync-scripts-blocker # direct idea identity
      title: Restore or port missing XA sync scripts to unblock J2 # copied from idea candidate text
      source_path: docs/plans/xa-uploader-usability-hardening/results-review.user.md # source artifact path
      source_excerpt: scripts/src/xa/validate-xa-inputs.ts and run-xa-pipeline.ts are absent; sync journey is blocked
      created_at: 2026-02-25T00:00:00Z # review date used as idea creation proxy
      trigger: artifact_delta # artifact-originated pattern
      artifact_id: results-review
      evidence_refs:
        - docs/plans/xa-uploader-usability-hardening/results-review.user.md#new-idea-candidates
      area_anchor: startup-loop build reliability and dependency readiness
      content_tags:
        - reliability
        - process
    access_declarations:
      - data_source: XA sync scripts (validate-xa-inputs.ts, run-xa-pipeline.ts) # concrete missing dependency source
        required_access_type: other # local script artifact dependency (not api/db/credential)
        verified_before_build: false # explicitly discovered as missing during build
        discovery_event: true # mid-build discovery event
        notes: Missing script artifacts blocked J2 sync completion.
---

# Pattern Reflection

## Patterns

- `access_gap` | `Sync dependency gap discovered after implementation started` | routing: `defer` | occurrences: `1`

## Access Declarations

- XA sync scripts (validate-xa-inputs.ts, run-xa-pipeline.ts) | access: `other` | verified_before_build: `false` | discovery_event: `true`
```

## 7. Empty-State Fixture

Valid artifact for simple builds with no patterns identified:

```markdown
---
schema_version: pattern-reflection.v1
feature_slug: example-simple-build
generated_at: 2026-02-27T12:00:00Z
entries: []
---

# Pattern Reflection

## Patterns

None identified.

## Access Declarations

None identified.
```
