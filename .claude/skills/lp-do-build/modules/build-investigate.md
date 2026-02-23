# Build Executor: INVESTIGATE

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
