---
Type: Artifact
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-10
Last-updated: 2026-03-10
Relates-to: docs/plans/_archive/startup-loop-results-review-queue-unification/plan.md
Task-ID: TASK-01
---

# Build-Origin Signal Contract (TASK-01)

## Purpose
Define the canonical machine-readable contract that turns build-review findings into one queue-admissible work signal instead of two incompatible sidecar interpretations.

This contract must do four things:
- give `results-review.signals.json` and `pattern-reflection.entries.json` one shared identity model;
- define source precedence and merge rules when both describe the same finding;
- define the queue-native fields required for canonical ideas admission;
- define explicit failure states so queue canonicality does not depend on silent extractor success.

## Current Seam Map

### Current producers
- [lp-do-build-results-review-extract.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-results-review-extract.ts)
  - emits `results-review.signals.v1`
  - item shape is classifier-friendly: `title`, `body`, `suggested_action`, `business`, `date`, `idea_key`, classifier outputs
- [lp-do-build-pattern-reflection-extract.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-pattern-reflection-extract.ts)
  - emits `pattern-reflection.entries.v1`
  - entry shape is reflection-oriented: `pattern_summary`, `category`, `routing_target`, `occurrence_count`, `evidence_refs`

### Current consumers
- [generate-process-improvements.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/generate-process-improvements.ts)
  - reads `results-review.signals.json` directly into visible backlog items
- [self-evolving-from-build-output.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts)
  - reads both sidecars directly and treats them as independent observation sources
- [lp-do-ideas-trial.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts)
  - canonical queue packet contract and route/status vocabulary

## Current Defects Confirmed In Code

### 1. Identity is incompatible today
- Results-review identity is `sha1(sourcePath::title)` in [lp-do-build-results-review-extract.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-results-review-extract.ts).
- Pattern-reflection recurrence is `sha1(normalizedTitle)` in [lp-do-build-pattern-reflection-prefill.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts).
- These two keys solve different problems and cannot act as one canonical admission identity.

### 2. Pattern-reflection routing is not queue routing
- Pattern-reflection routes `loop_update | skill_proposal | defer` in [lp-do-build-pattern-reflection-prefill.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts).
- The queue routes `lp-do-fact-find | lp-do-plan | lp-do-build | lp-do-briefing` in [lp-do-ideas-trial.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts) and [lp-do-ideas-routing-adapter.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts).
- Direct mapping would be lossy and wrong.

### 3. Pattern-reflection schema is already drifted
- The declared `PatternCategory` union in [lp-do-build-pattern-reflection-prefill.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts) is `deterministic | ad_hoc | access_gap | unclassified`.
- The parser and tests already accept categories such as `ai-to-mechanistic`, `new-loop-process`, and `new-skill` in [lp-do-pattern-promote-loop-update.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-pattern-promote-loop-update.ts) and [lp-do-build-pattern-reflection-extract.test.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/lp-do-build-pattern-reflection-extract.test.ts).
- Archived sidecars confirm that drift, for example [pattern-reflection.entries.json](/Users/petercowling/base-shop/docs/plans/_archive/startup-loop-structured-sidecar-introduction/pattern-reflection.entries.json).

### 4. `pattern_summary` is not safe as an identity field
- Prefill truncates long summaries to 100 chars in [lp-do-build-pattern-reflection-prefill.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts).
- A truncated display field cannot be the canonical dedupe key.

### 5. `source_path` is not stable enough to be the canonical join key
- Extractors default `repoRoot` to `process.cwd()` in [lp-do-build-results-review-extract.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-results-review-extract.ts) and [lp-do-build-pattern-reflection-extract.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-pattern-reflection-extract.ts).
- Archived sidecars already contain `../docs/...` paths, for example [results-review.signals.json](/Users/petercowling/base-shop/docs/plans/_archive/startup-loop-structured-sidecar-introduction/results-review.signals.json).
- Canonical identity must not depend on cwd-sensitive path rendering.

### 6. Failure handling is fail-open and silent for backlog purposes
- Both extractors warn and return without durable machine-readable failure state.
- That is acceptable for additive sidecars; it is not acceptable once queue admission becomes canonical backlog intake.

## Contract Decisions

### 1. Canonical unit: `BuildOriginSignal`
The canonical bridge unit is a normalized per-finding record:

```ts
interface BuildOriginSignalV1 {
  schema_version: "build-origin.signal.v1";
  build_signal_id: string;
  recurrence_key: string;
  build_origin_status: "ready" | "needs_review" | "parse_failed" | "schema_invalid" | "source_missing";
  merge_state: "single_source" | "merged_cross_sidecar";
  primary_source: "pattern-reflection.entries.json" | "results-review.signals.json";
  source_presence: {
    results_review_signal: boolean;
    pattern_reflection_entry: boolean;
  };
  business: string;
  plan_slug: string;
  review_cycle_key: string;
  canonical_title: string;
  display_title: string;
  narrative_body: string | null;
  suggested_action: string | null;
  results_review_fields: {
    priority_tier?: string;
    urgency?: string;
    effort?: string;
    reason_code?: string;
  } | null;
  reflection_fields: {
    category: string | null;
    routing_target: string | null;
    occurrence_count: number | null;
  } | null;
  classifier_input: {
    idea_id: string;
    title: string;
    source_path: string;
    source_excerpt: string | null;
    created_at: string;
    trigger: "operator_idea";
    artifact_id: null;
    evidence_refs: string[];
    area_anchor: string;
    content_tags: string[];
  };
  queue_input: {
    trigger: "operator_idea";
    area_anchor: string;
    location_anchors: [string, ...string[]];
    provisional_deliverable_family: "multi" | "doc" | "code-change" | "business-artifact";
    why: string;
    intended_outcome: {
      type: "operational";
      statement: string;
      source: "auto";
    };
  };
  provenance: {
    review_artifact_path: string;
    results_review_sidecar_path: string | null;
    pattern_reflection_sidecar_path: string | null;
    evidence_refs: string[];
  };
}
```

### 2. Admission model: direct `operator_idea`, not synthetic `artifact_delta`
Chosen model:
- build-review findings bridge into the queue as direct `dispatch.v2` packets with `trigger: "operator_idea"`;
- they do **not** pretend to be standing-registry artifact deltas.

Rationale:
- the findings are authored idea candidates, not source-primary artifact deltas;
- synthetic `artifact_id` values would abuse standing-registry and cutover-phase semantics in [lp-do-ideas-trial.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts);
- the classifier already explicitly supports `operator_idea` semantics in [lp-do-ideas-classifier.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-classifier.ts).

Implementation note for TASK-03:
- bridge code may need a bounded packet-typing cleanup because some queue types still assume artifact-delta-heavy shapes.
- That cleanup is part of doing the right thing, not a reason to introduce fake artifact IDs.

### 3. Identity model: one intra-build key and one cross-build recurrence key

#### `build_signal_id`
Purpose:
- dedupe the same finding across `results-review.signals.json` and `pattern-reflection.entries.json` within one build review cycle

Definition:
- `sha1(review_cycle_key + "::" + canonical_title)`

#### `review_cycle_key`
Definition:
- repo-root-relative plan directory slug key
- minimum form: `plan_slug`
- preferred rendered basis: repo-root-relative plan path plus slug if future ambiguity appears

#### `recurrence_key`
Purpose:
- count equivalent patterns across different build cycles without collapsing them into one admission record

Definition:
- `sha1(canonical_title)`

### 4. `canonical_title` is a new required field
`canonical_title` is the untruncated identity/display basis shared across both sources.

Rules:
- strip markdown formatting
- normalize whitespace
- strip known category prefixes such as `AI-to-mechanistic —`, `New loop process —`, `New skill —`, `New standing data source —`
- never truncate

`display_title` may remain truncated for operator-facing rendering, but `canonical_title` is the identity basis.

### 5. Source precedence and merge rule

#### Final precedence rule
- Primary intake source after TASK-02 hardening: `pattern-reflection.entries.json`
- Compatibility fallback when pattern-reflection is absent or invalid: `results-review.signals.json`

#### Merge rule when both sources are present and share `build_signal_id`
- structural envelope and recurrence metadata come from pattern-reflection
- narrative fields come from results-review
- evidence refs are unioned and deduped
- queue admission emits one merged `BuildOriginSignalV1`

#### Field-level precedence
| Canonical field | Preferred source | Fallback | Reason |
|---|---|---|---|
| `canonical_title` | new shared field on both | normalized results-review `title` until hardened | title must be untruncated and shared |
| `narrative_body` | results-review `body` | `null` | pattern-reflection has no equivalent today |
| `suggested_action` | results-review `suggested_action` | `null` | queue/operator context needs action text |
| `reflection_fields.category` | pattern-reflection `category` | `null` | recurrence/promotion semantics live here |
| `reflection_fields.routing_target` | pattern-reflection `routing_target` | `null` | advisory only, not queue route |
| `reflection_fields.occurrence_count` | pattern-reflection `occurrence_count` | `1` | recurrence metadata source |
| `results_review_fields.*` | results-review sidecar | `null` | existing classifier outputs live here |
| `provenance.evidence_refs` | union both sources | - | preserve evidence, do not discard |

### 6. Queue-native field decisions

#### Required minimum queue inputs
- `trigger: "operator_idea"`
- `area_anchor`: use `canonical_title`
- `location_anchors`: non-empty tuple; first anchor must be repo-relative review artifact path, additional anchors may include sidecar paths and repo-local evidence refs
- `provisional_deliverable_family`: default `multi`; may be hardened later when code/document-only signals are provable
- `why`: auto-generated from canonical title plus narrative body/suggested action when available
- `intended_outcome`: always operational and auto-sourced at bridge time

#### Classifier input rule
Every admitted signal must carry a deterministic `IdeaClassificationInput` subset so the bridge can reuse normal idea grading instead of inventing a second priority policy.

### 7. Queue-route derivation rules
Route derivation is **not** copied from `pattern-reflection.routing_target`.

Rules:
1. Build the canonical classifier input from `BuildOriginSignalV1`.
2. Run the existing idea-classification and bounded-surface routing logic.
3. Apply the following queue rule set:
   - `lp-do-build` only when existing micro-build boundedness rules pass on the canonical signal
   - `lp-do-plan` only when:
     - reflection metadata exists,
     - `routing_target` is `loop_update` or `skill_proposal`,
     - recurrence threshold is met,
     - and the signal is deterministic enough that fact-find is not the right next step
   - `lp-do-fact-find` for all other actionable build-origin signals
   - `lp-do-briefing` only for non-actionable or explicitly degraded review-debt records, not for normal worthwhile backlog items

Negative rule:
- Never map `loop_update -> lp-do-plan`, `skill_proposal -> lp-do-plan`, or `defer -> lp-do-fact-find` directly without the classifier/micro-build gate. Reflection routing is advisory metadata, not queue status.

### 8. Failure states
The canonical contract requires durable machine-readable failure states even when extraction remains non-blocking.

| Status | Meaning | Required follow-up |
|---|---|---|
| `ready` | signal is valid for queue admission | admit/merge normally |
| `needs_review` | signal exists but required canonical fields conflict or are incomplete | surface as review debt; do not silently drop |
| `parse_failed` | source artifact existed but parse failed | emit failure/debt record |
| `schema_invalid` | sidecar existed but shape/version/required fields invalid | emit failure/debt record |
| `source_missing` | expected source artifact absent for that slot | allowed only for fallback compatibility, not for silent success |

`merge_state` is separate from failure:
- `single_source`
- `merged_cross_sidecar`

### 9. Join surface for downstream consumers

#### Report provenance
Queue-backed backlog items must preserve:
- `build_signal_id`
- `review_cycle_key`
- source sidecar paths
- merge state

That is enough for `process-improvements` to render queue-backed provenance without re-reading sidecars as backlog inputs.

#### Self-evolving join surface
If self-evolving continues to ingest build output directly in TASK-06/TASK-11, it must join on:
- `build_signal_id` for same-cycle identity
- `recurrence_key` for cross-cycle recurrence

It must not invent a third fingerprint family.

#### Completion/compatibility join surface
Queue-backed build-origin items should carry `build_signal_id` into queue provenance so later completion and historical carry-over can trace:
- source review cycle
- merged sources
- carried-forward legacy item set

## Producer Mapping

| Canonical field | Current results-review source | Current pattern-reflection source | Contract action |
|---|---|---|---|
| `build_signal_id` | `idea_key` is wrong basis | none | new required field |
| `recurrence_key` | none | `deriveRecurrenceKey(title)` is partial basis | new required field |
| `canonical_title` | `title` usable | `pattern_summary` is lossy/truncated | new shared field |
| `display_title` | `title` | `pattern_summary` | keep |
| `narrative_body` | `body` | none | results-review primary |
| `suggested_action` | `suggested_action` | none | results-review primary |
| `results_review_fields.*` | classifier outputs already present | none | keep |
| `reflection_fields.category` | none | `category` | keep, but normalize schema drift |
| `reflection_fields.routing_target` | none | `routing_target` | keep as advisory only |
| `reflection_fields.occurrence_count` | none | `occurrence_count` | keep |
| `provenance.review_artifact_path` | `path` exists but is cwd-sensitive today | `source_path` exists but is cwd-sensitive today | normalize to repo-root-relative |
| `provenance.evidence_refs` | implied from review artifact | `evidence_refs` | union and normalize |

## Fixture Evidence From Current Repo

### Same semantic finding present in both sources
- [results-review.signals.json](/Users/petercowling/base-shop/docs/plans/_archive/startup-loop-structured-sidecar-introduction/results-review.signals.json)
- [pattern-reflection.entries.json](/Users/petercowling/base-shop/docs/plans/_archive/startup-loop-structured-sidecar-introduction/pattern-reflection.entries.json)

Observed:
- `Post-authoring sidecar extraction as a reusable loop process` appears in both sources
- current repo therefore already contains a real duplicate-sidecar case that the contract must collapse into one admission record

### Path normalization drift
The same archived pair uses `../docs/plans/...` for `source_path`, proving current path rendering is not repo-root stable enough to be a canonical key.

## Consequences For Follow-On Tasks

### TASK-02
- add `canonical_title`, `build_signal_id`, `recurrence_key`, `build_origin_status`, repo-root-stable paths
- normalize pattern-reflection category schema so emitted JSON matches actual accepted values
- stop treating `pattern_summary` as identity-bearing

### TASK-03
- build the queue bridge around direct `operator_idea` dispatch packets
- merge same-cycle signals on `build_signal_id`
- use pattern-reflection as primary structural source and results-review as narrative fallback/enrichment

### TASK-06 / TASK-11
- self-evolving must adopt `build_signal_id` and `recurrence_key` instead of reusing its current raw-sidecar parsing identities

## Acceptance Check

### TC-01: every field in the contract is mapped or declared new
Pass:
- current-source mapping is explicit in `Producer Mapping`
- every missing field is named as new required output

### TC-02: precedence and dedupe rules cover same-signal dual-sidecar case
Pass:
- merge rule uses `build_signal_id`
- archived `startup-loop-structured-sidecar-introduction` pair provides a real dual-sidecar example

### TC-03: contract explicitly says what happens when extraction/parsing fails
Pass:
- explicit `build_origin_status` failure states are defined
- silent drop is rejected as end-state behavior
