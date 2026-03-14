---
Type: Schema-Contract
Status: Active
Version: 1.2.0
Domain: Venture-Studio
Workstream: Feature-Development
Created: 2026-03-11
Last-updated: 2026-03-12
Owner: startup-loop maintainers
Relates-to: docs/business-os/startup-loop/contracts/loop-output-contracts.md
---

# Feature Development (DO) Stage Handoff Packet Contract

## Purpose

Define the canonical progressive-disclosure sidecars for the feature development (DO) workflow:

- `docs/plans/<feature-slug>/fact-find.packet.json`
- `docs/plans/<feature-slug>/analysis.packet.json`
- `docs/plans/<feature-slug>/plan.packet.json`

These packets exist to bound cross-stage context. They are deterministic extracts from the canonical markdown artifacts and are the default first-read input for the next feature development (DO) stage.

## Invariants

- Packets are **sidecars**, not replacements. The canonical source of truth remains:
  - `fact-find.md`
  - `analysis.md`
  - `plan.md`
- Packets are **deterministic**. They must be derived only from the source artifact content and path. Do not add current timestamps, model summaries, or operator-only prose that is not already present upstream.
- Packets are **bounded**. Include compact structured fields, short summaries, and task briefs; do not embed whole task blocks or copy full artifact bodies.
- Packets are **generated after validators pass** for the stage artifact, then used as the default upstream input for the next stage.
- Packet generation is required for:
  - `lp-do-fact-find`
  - `lp-do-analysis`
  - `lp-do-plan`

## Load Order

Downstream stages must use this load order unless a packet is missing or insufficient:

1. Load the upstream `*.packet.json` sidecar first.
2. Load the current stage artifact being edited.
3. Load the full upstream markdown artifact only when:
   - the packet omits needed detail,
   - a quoted/path-specific upstream claim needs verification,
   - a task block or acceptance contract must be read in full,
   - or the packet appears stale relative to the markdown artifact.

This is the default progressive-disclosure policy for `lp-do-analysis`, `lp-do-plan`, and `lp-do-build`.

## Canonical Generation Command

```bash
scripts/generate-stage-handoff-packet.sh docs/plans/<feature-slug>/<fact-find|analysis|plan>.md
```

Default output path:
- `fact-find.md` -> `fact-find.packet.json`
- `analysis.md` -> `analysis.packet.json`
- `plan.md` -> `plan.packet.json`

Optional explicit output path:

```bash
scripts/generate-stage-handoff-packet.sh docs/plans/<feature-slug>/plan.md --output docs/plans/<feature-slug>/plan.packet.json
```

## Shared Envelope

Every packet must contain:

```json
{
  "schema_version": "do-stage-handoff.v2",
  "stage": "fact-find | analysis | plan",
  "feature_slug": "<slug>",
  "source_artifact_path": "docs/plans/<feature-slug>/<artifact>.md",
  "source_artifact_status": "<frontmatter Status or null>",
  "source_last_updated": "<Last-updated or Last-reviewed or null>",
  "execution_track": "<code | business-artifact | mixed | null>",
  "deliverable_type": "<canonical type or null>",
  "primary_execution_skill": "<skill id or null>",
  "supporting_skills": ["..."],
  "related_artifacts": {
    "fact_find": "docs/plans/<feature-slug>/fact-find.md",
    "analysis": "docs/plans/<feature-slug>/analysis.md",
    "plan": "docs/plans/<feature-slug>/plan.md"
  },
  "outcome_contract": {
    "why": "<string or null>",
    "intended_outcome_type": "<string or null>",
    "intended_outcome_statement": "<string or null>",
    "source": "<operator | auto | null>"
  },
  "engineering_coverage": [],
  "open_operator_questions": [],
  "stage_payload": {}
}
```

## Stage Payload Requirements

### `fact-find.packet.json`

`stage_payload` must carry:
- `scope_summary`
- `goals`
- `non_goals`
- `constraints`
- `assumptions`
- `key_entry_points`
- `key_findings`
- `analysis_readiness`
- `rehearsal_issues`
- `process_topology`

`process_topology` for fact-find must carry:
- `changed`
- `note`
- `trigger`
- `end_condition`
- `areas`

Each fact-find topology area must use the compact typed shape:
- `id`
- `label`
- `flow`
- `owners`
- `evidence`
- `issues`

### `analysis.packet.json`

`stage_payload` must carry:
- `decision_summary`
- `goals`
- `non_goals`
- `constraints`
- `assumptions`
- `evaluation_criteria`
- `options_considered`
- `chosen_approach`
- `rejected_approaches`
- `planning_handoff`
- `process_topology`

`process_topology` for analysis must carry:
- `changed`
- `note`
- `areas`

Each analysis topology area must use the compact typed shape:
- `id`
- `label`
- `current`
- `trigger`
- `future`
- `steady`
- `seams`

### `plan.packet.json`

`stage_payload` must carry:
- `summary`
- `goals`
- `non_goals`
- `constraints`
- `assumptions`
- `selected_approach`
- `plan_gates`
- `task_briefs`
- `next_runnable_task_ids`
- `validation_contracts`
- `open_decisions`
- `process_topology`

`process_topology` for plan must carry:
- `changed`
- `note`
- `areas`

Each plan topology area must use the compact typed shape:
- `id`
- `label`
- `trigger`
- `flow`
- `task_ids`
- `dependency_note`
- `seams`

These topology fields are compact stage-aware extracts from the canonical walkthrough sections:
- `fact-find.md` -> `## Current Process Map`
- `analysis.md` -> `## End-State Operating Model`
- `plan.md` -> `## Delivered Processes`

They exist so downstream stages can understand workflow/process topology from the packet first, without reopening full upstream markdown by default. The packet must not preserve the original markdown column headings as JSON keys once the stage is already known; compact stage-aware field names are the contract.

`task_briefs` must be compact and deterministic. Include only the fields needed to identify runnable work and likely blast radius:
- `task_id`
- `title`
- `type`
- `status`
- `confidence`
- `effort`
- `depends_on`
- `blocks`
- `execution_skill`
- `deliverable`
- `affects`

## Telemetry Alignment

When a stage uses an upstream packet as part of its actual context, record that packet path in feature development (DO) workflow telemetry via `--input-path`.

Examples:
- `lp-do-analysis` -> `docs/plans/<feature-slug>/fact-find.packet.json`
- `lp-do-plan` -> `docs/plans/<feature-slug>/analysis.packet.json`
- `lp-do-build` -> `docs/plans/<feature-slug>/plan.packet.json`

Record the full upstream markdown artifact as an additional `--input-path` only when it was materially loaded during the stage.
