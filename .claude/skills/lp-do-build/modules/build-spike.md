# Build Executor: SPIKE

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
