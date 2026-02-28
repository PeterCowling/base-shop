# Build Executor: SPIKE

## Offload Route

When `CODEX_OK=1` (checked in `SKILL.md § Executor Dispatch`), offload this task to Codex. Load and follow: `../../_shared/build-offload-protocol.md`.

**Track-specific prompt additions for SPIKE tasks:**

- Spike scope must be explicitly bounded in the prompt — state what is in scope and what is out of scope. Codex must not expand beyond the defined spike boundary.
- Include the spike exit criteria verbatim from the task. Codex must address each criterion individually in the spike result artifact.
- State that the spike must remain minimal and reversible — no production changes, no large refactors.
- State that if the spike reveals an invalidating finding (approach does not work), Codex should document the finding clearly in the output artifact and stop — it must not attempt to redesign the approach inline.

**Claude's post-execution verification steps (after `codex exec` returns):**

1. Re-read all `Affects` files — confirm the spike result artifact was written. If missing or empty: treat as task failure.
2. Validate spike result against exit criteria — SPIKE tasks are exempt from `modules/build-validate.md`, but exit criteria must be addressed.
3. Commit gate — stage only task-scoped files (the `Affects` list). Run via `scripts/agents/with-writer-lock.sh`.
4. Post-task plan update — mark task status Complete with date; add build evidence block (exit code, spike verdict, exit criteria pass/fail, offload route used). If invalidating: invoke `/lp-do-replan`.

## Objective

Run bounded prototype/probe work with explicit exit criteria to generate promotable evidence.

## Workflow

1. Execute spike scope exactly as defined.
2. Produce measurable output artifact (prototype result, benchmark, contract proof).
3. Record pass/fail against spike exit criteria.
4. Update downstream confidence assumptions in plan notes.

## Constraints

- Keep spike scope minimal and reversible.
- If spike invalidates downstream approach, stop and invoke `/lp-do-replan`.
- **If the spike scope explicitly includes Jest test execution:** use `pnpm -w run test:governed -- jest -- <args>`. Do not use `npx jest`, `pnpm exec jest`, or direct binary invocations — these are blocked by the guard layer. See `docs/testing-policy.md` and `modules/build-code.md § Test Invocation`.
