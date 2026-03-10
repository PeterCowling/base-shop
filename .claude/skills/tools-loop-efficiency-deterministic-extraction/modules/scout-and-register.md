# Scout And Register

Run this module first on every invocation.

## 1) Produce latest audit context

If no explicit audit path was passed, run a fresh scan before scoring:

```bash
/meta-loop-efficiency
```

If a fixed audit file was provided by the operator, skip the scan and use that file.

## 2) Refresh analysis.md with true ROI and new opportunities

```bash
node .claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/refresh-analysis-and-scout.mjs \
  --analysis docs/plans/startup-loop-token-efficiency-v2/deterministic-extraction-analysis.md
```

Optional cost overrides:

```bash
node .claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/refresh-analysis-and-scout.mjs \
  --analysis <analysis-path> \
  --model-cost <usd-per-mtok> \
  --engineer-rate <usd-per-hour> \
  --evidence-quality <proxy|observed|measured>
```

Dry run:

```bash
node .claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/refresh-analysis-and-scout.mjs --dry-run
```

## 3) Verify outputs

Confirm analysis markdown now includes:

- `### Payback Scorecard (estimated)` with recomputed scores
- `Expected ROI` columns in both payback and auto-scout tables
- `### Auto-Scout Register (new opportunities from latest audit)`

If either section is missing, stop and fix parser assumptions before proceeding.
