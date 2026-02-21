# Planner Module: Business Artifact Track

Use for `Execution-Track: business-artifact`.

## Objective

Produce decision-quality business deliverable tasks with explicit validation checks and ownership.

## Task Decomposition Heuristics

- Front-load demand/channel/compliance risks.
- Separate validation probes from scaling/refinement work.
- Use CHECKPOINT tasks when later tasks depend on early market/ops assumptions.

## Required Fields for IMPLEMENT (Business)

Use `docs/plans/_templates/task-implement-biz.md`.

Minimum required:
- Type, Deliverable, Execution-Skill
- Execution-Track, Effort, Status
- Artifact-Destination, Reviewer, Approval-Evidence, Measurement-Readiness
- Affects, Depends on, Blocks
- Confidence breakdown
- Acceptance
- Validation contract (VC-XX)
- Red/Green/Refactor evidence plan
- Rollout/rollback (operational handoff or rollback)
- Documentation impact

If a required field is not applicable, write `None: <reason>`.

## VC Quality Contract

Every VC must satisfy:
- `docs/business-os/_shared/business-vc-quality-checklist.md`

No vague VC language such as "validate demand" without thresholds/timebox/sample.

## Confidence Policy

Apply shared scoring rules:
- `../../_shared/confidence-scoring-rules.md`
