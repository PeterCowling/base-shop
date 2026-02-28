# Auto Implement

Run this module after scout+score updates complete.

## 1) Build execution queue

```bash
node .claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/build-execution-queue.mjs \
  --analysis docs/plans/startup-loop-token-efficiency-v2/deterministic-extraction-analysis.md \
  --output docs/plans/startup-loop-token-efficiency-v2/auto-opportunity-implementation/analysis-execution-queue.md
```

The queue includes all rows whose decision is `Implement now` or `Backlog`.

## 2) Execute queue in strict order

For each `Pending` queue row:

1. Implement change scope for that row.
2. Run targeted validation(s) for changed package(s).
3. Update queue `Status` to `Done` or `Blocked` with a reason.
4. If `Blocked`, continue to next row.

Execution ordering is fixed:

1. `Implement now`
2. `Backlog`

## 3) Implementation mapping

### `Source=core`

Use analysis row details directly:

- Candidate description from Payback Scorecard
- Artifacts and contract from the `Table (20 candidates)` section
- Minimal implementation guidance from section `D) First 3 Extractions to Implement Now` when applicable

### `Source=scout`

Use signal-specific templates:

- `H1`: modularize or trim orchestrator size while preserving behavior
- `H2`: add dispatch contract adoption only when domains can execute in parallel
- `H3`: add wave dispatch protocol references only for actual multi-wave execution skills

## 4) Stop conditions

Stop only when all queue rows are non-pending.

If all remaining rows are blocked, return a blocked summary with concrete unblock actions.
