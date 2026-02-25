# Build Executor: Code / Mixed IMPLEMENT

## Objective

Execute IMPLEMENT work via TDD with strict scope control and accurate regression handling.

## Workflow

1. Read task constraints and TC contract.
2. Apply extinct test policy (`../../_shared/testing-extinct-tests.md`).
3. Implement TDD cycle:
- write/activate tests from TC contract
- confirm expected fail
- implement minimum change
- refactor while green
4. Run required validations (typecheck/lint/tests per task/repo policy).
5. **Post-build validation:** run `modules/build-validate.md`.
   - Select Mode 1 (Visual Walkthrough) if the task's `Deliverable-Type` is `code-change` and the acceptance criteria reference rendered UI elements (screenshots, DOM elements, visible components).
   - Select Mode 2 (Data Simulation) if the task's `Deliverable-Type` is `code-change` and the deliverable is a function, API, service, or data transformation with no rendered UI in acceptance criteria.
   - Select both Mode 1 and Mode 2 if `Deliverable-Type` is `multi-deliverable`.
   - Task completion is gated on the walkthrough passing. If the walkthrough fails, run the Fix+Retry loop (max 3 attempts) before marking the task done. Do not proceed to step 6 until the walkthrough passes or the task is marked `Blocked`.
6. Update plan build evidence and confidence notes.

## Test Invocation

All Jest runs MUST use the governed entrypoint. Canonical rule source: `docs/testing-policy.md`.

**Standard form (repo-relative config):**
```bash
pnpm -w run test:governed -- jest -- --testPathPattern="<pattern>" --no-coverage
```

For a specific test file with a repo-relative config path (for example Brikette tests):
```bash
pnpm -w run test:governed -- jest -- --config apps/brikette/jest.config.cjs --testPathPattern="<pattern>" --no-coverage
```

**Package-CWD variant** — use this when the package test script requires `./jest.config.cjs` (a package-relative config path) instead of a repo-relative path:
```bash
# Run from repo root; the script changes CWD to the package directory
bash <path-to-package>/../../scripts/tests/run-governed-test.sh -- jest -- --config ./jest.config.cjs --testPathPattern="<pattern>"
```

**Blocked forms — do not use these:**
- `npx jest` — blocked by `scripts/agent-bin/npx`
- `pnpm exec jest` — blocked by `scripts/agent-bin/pnpm`
- `npm exec jest` / `npm x jest` — blocked by `scripts/agent-bin/npm`
- Raw direct invocations (`node .../jest/bin/jest.js`, `./node_modules/.bin/jest`) — blocked by guarded-shell-hooks

The governed runner enforces `--maxWorkers=2`, `--forceExit`, process admission, and wall-clock timeouts. Never bypass it.

## Scope Handling

- Follow `Affects` list.
- If required test/doc files are outside `Affects`, use controlled scope expansion and update the plan before commit.
- Never modify `[readonly]` files.
