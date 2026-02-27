# Build Executor: Business Artifact IMPLEMENT

## Offload Route

When `CODEX_OK=1` (checked in `SKILL.md § Executor Dispatch`), offload this task to Codex. Load and follow: `../../_shared/build-offload-protocol.md`.

**Track-specific prompt additions for business-artifact tasks:**

- Include the Red→Green→Refactor requirement verbatim: Red (falsification probes from VC checks), Green (minimum artifact that satisfies scoped VCs), Refactor (quality hardening + VC re-pass).
- Include the full VC contract from the task (each VC check, pass criterion, deadline, sample).
- State clearly that the approval gate remains Claude's responsibility — Codex produces the artifact; Claude reads it, verifies VCs, and records approval evidence. Codex cannot substitute for reviewer acknowledgement.
- Reference: `../../_shared/subagent-dispatch-contract.md` for any parallelism the prompt may describe.

**Claude's post-execution verification steps (after `codex exec` returns):**

1. Re-read all `Affects` files — confirm each file was written or modified as specified. If any required file is missing or empty: treat as task failure; do not proceed to commit.
2. Run `modules/build-validate.md` (Mode 3 — Document Review) — this is Claude's gate, not Codex's.
3. Commit gate — stage only task-scoped files (the `Affects` list). Run via `scripts/agents/with-writer-lock.sh`. Never commit broken artifacts as complete outputs.
4. Post-task plan update — mark task status Complete with date; add build evidence block (exit code, Affects files verified, VC pass/fail, offload route used).

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
4. **Post-build validation:** run `modules/build-validate.md` (Mode 3 — Document Review).
   - Read the completed artifact linearly as its intended audience would. Check for broken references, internal inconsistencies, missing required sections, and dead calls-to-action.
   - Task completion is gated on the document review passing. If it fails, run the Fix+Retry loop (max 3 attempts) before capturing approval evidence or marking the task done.
   - Do not proceed to Approval and Measurement until the Mode 3 review passes or the task is marked `Blocked`.

See `../../_shared/subagent-dispatch-contract.md` (Model A) for output schema, budget controls, and failure handling.

## Approval and Measurement

- Capture approval evidence exactly as task specifies.
- If approval is asynchronous/unavailable, mark task `Blocked` (`Awaiting approval evidence`) and stop.
- Confirm measurement readiness fields are complete and actionable.

## Failing Output Policy

- Do not commit final broken artifacts as complete outputs.
- Draft/Red evidence notes may be committed only while task remains non-complete.
