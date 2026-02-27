# Build Executor: INVESTIGATE

## Offload Route

When `CODEX_OK=1` (checked in `SKILL.md § Executor Dispatch`), offload this task to Codex. Load and follow: `../../_shared/build-offload-protocol.md`.

**Track-specific prompt additions for INVESTIGATE tasks:**

- Use `codex exec -a never --sandbox workspace-write` — artifact write access is required because INVESTIGATE tasks produce a deliverable file. `codex exec --sandbox read-only` cannot write the deliverable and must not be used.
- MCP tools are available to Codex via `~/.codex/config.toml` — Codex has the same evidence sources as Claude for INVESTIGATE tasks (GA4, Firebase, BOS API, brikette MCP server).
- Codex's own internal parallelism replaces the `build-investigate.md` subagent dispatch pattern described in the `## Subagent Dispatch` section below. Do not instruct Codex to spawn subagents — it handles parallelism internally via tool-calling.
- Include the full evidence queries (from `Questions to answer` or acceptance criteria) in the prompt so Codex can plan its evidence collection.

**Claude's post-execution verification steps (after `codex exec` returns):**

1. Re-read all `Affects` files — confirm the deliverable artifact was written. If missing or empty: treat as task failure; do not proceed to commit.
2. Validate artifact against task acceptance criteria — INVESTIGATE tasks are exempt from `modules/build-validate.md`, but acceptance criteria must be met.
3. Commit gate — stage only task-scoped files (the `Affects` list). Run via `scripts/agents/with-writer-lock.sh`.
4. Post-task plan update — mark task status Complete with date; add build evidence block (exit code, Affects files verified, acceptance criteria pass/fail, offload route used). Run downstream confidence propagation per `## Downstream Confidence Propagation` below.

## Objective

Produce the investigation artifact (decision memo, analysis note, evidence map) that closes the task's uncertainty.

## Subagent Dispatch (Multi-Source Evidence)

When the task has ≥2 independent evidence sources or "Questions to answer":

1. Parse task acceptance criteria into discrete evidence queries.
2. Dispatch one read-only subagent per query in a SINGLE message (max 5 concurrent; see `../../_shared/subagent-dispatch-contract.md`).
   - Brief: exact question, source files/commands, expected output schema `{ status, summary, outputs: { findings[] }, touched_files: [], tokens_used }`.
   - Subagents MUST NOT write files — read-only analysis only.
3. Synthesize all subagent outputs into a unified evidence set.
4. Produce the deliverable artifact from synthesized findings.
5. Validate artifact against task acceptance criteria.
6. Update plan task status and notes.

When evidence sources = 1, or questions are tightly coupled (each answer depends on the previous): proceed sequentially through steps 1–5 below.

## Sequential Workflow (single source or coupled questions)

1. Execute investigation steps in task acceptance.
2. Gather evidence via read-only commands/docs.
3. Produce deliverable artifact at planned path.
4. Validate against task acceptance criteria.
5. Update plan task status and notes.

## Approval-Gated Artifact Contract (Required)

When an INVESTIGATE task is `Execution-Track: business-artifact` and the plan task includes
reviewer-gate fields (`Reviewer`, `Approval-Evidence`) or blocks another task pending sign-off
(for example outreach rehearsal gates like TASK-21), the output artifact must include the
following sections in order:

1. `Execution Status` (explicitly states blocked/complete gate state)
2. `Inputs` (upstream artifacts referenced by path)
3. `Scope` (what this task does and does not cover)
4. `Guardrails` (content and compliance constraints)
5. `Final Templates` (ready-to-send templates with subject variants + body)
6. `Personalized Draft Entries` (target-mapped rows, expected count enforced by task contract)
7. `Rehearsal Checklist` (pass/pending checks)
8. `Reviewer Approval Block` (checkboxes + timestamp + evidence pointer)
9. `Gate Result` (single sentence: why task remains blocked or is complete)

Additional hard requirements:

- Do not mark task complete without reviewer approval evidence when the approval block is required.
- Approval block must include:
  - reviewer identity
  - explicit approval checkboxes
  - approval timestamp field
  - approval evidence path/link field
- If reviewer sign-off is missing, set task status to blocked and state exact missing fields.
- Keep language operational and copy-paste ready; avoid abstract guidance.

## Downstream Confidence Propagation

After producing and validating the deliverable artifact, assess impact on dependent tasks:

1. Identify tasks whose `Depends on` includes this INVESTIGATE task.
2. Classify the investigation outcome:
   - **Affirming**: findings confirm expectations or eliminate a risk that was capping downstream confidence.
   - **Neutral**: findings match assumptions without materially changing the uncertainty picture.
   - **Uncertain**: findings reveal new or unresolved execution uncertainty (handled under Constraints below).
3. For **Affirming** outcomes:
   - Update each dependent task's confidence in the plan using the evidence ladder (E2 for read-only verification evidence, E3 when the investigation produced prototype-grade proof).
   - Actualize any conditional confidence patterns (e.g., `70% (-> 84% conditional on TASK-XX)` becomes `84%`).
   - Cite the INVESTIGATE deliverable artifact as the evidence source per the uplift justification rule.
4. For **Neutral** outcomes:
   - Add a brief note to dependent tasks confirming assumptions hold; no score change required.
5. If any re-scored dependent task crosses its type threshold (was below, now at or above), it becomes eligible for the next build cycle without a separate `/lp-do-replan` invocation.

## Constraints

- No production implementation work.
- If investigation reveals unresolved execution uncertainty, add notes and route to `/lp-do-replan`.
