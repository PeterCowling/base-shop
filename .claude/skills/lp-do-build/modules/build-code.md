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
5. Update plan build evidence and confidence notes.

## Scope Handling

- Follow `Affects` list.
- If required test/doc files are outside `Affects`, use controlled scope expansion and update the plan before commit.
- Never modify `[readonly]` files.
