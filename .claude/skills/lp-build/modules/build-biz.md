# Build Executor: Business Artifact IMPLEMENT

## Objective

Execute business-artifact work with explicit VC validation and fail-first evidence.

## Required Sequence

The Red→Green→Refactor phases are always sequential. Subagent parallelism applies **within** phases where items are independent.

1. **Red:** run falsification probes from task execution plan; record evidence.
   - If task has ≥2 independent VC checks: dispatch parallel read-only subagents (one per VC probe) in a SINGLE message. Synthesize all probe results before proceeding to Green.
   - If only 1 VC check or probes are coupled: run sequentially.
2. **Green:** produce minimum artifact that satisfies scoped VC checks.
   - If artifact has ≥2 structurally independent sections (e.g. separate contract docs, independent taxonomy tables): dispatch parallel drafting subagents in a SINGLE message. Apply section diffs serially under writer lock.
   - If sections are coupled or artifact is a single unified doc: draft sequentially.
3. **Refactor:** improve quality/operability; rerun VC checks. Always sequential — cross-section coherence required.

See `../../_shared/subagent-dispatch-contract.md` (Model A) for output schema, budget controls, and failure handling.

## Approval and Measurement

- Capture approval evidence exactly as task specifies.
- If approval is asynchronous/unavailable, mark task `Blocked` (`Awaiting approval evidence`) and stop.
- Confirm measurement readiness fields are complete and actionable.

## Failing Output Policy

- Do not commit final broken artifacts as complete outputs.
- Draft/Red evidence notes may be committed only while task remains non-complete.
