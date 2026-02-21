---
Type: Report
Status: Active
Domain: Platform
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
---

# Hypothesis Portfolio Manager Validation Report (HPM-09)

## Scope

Validate end-to-end readiness for:

- ranking outputs and blocked reason behavior,
- lifecycle activation guard + forced override audit,
- `/lp-prioritize` bridge behavior for linked and unlinked items,
- operator reproducibility via runbook.

## Rehearsal Procedure

Command executed:

```bash
node --import tsx scripts/src/hypothesis-portfolio/rehearsal-fixtures.ts
```

Fixture set:

- 5 hypotheses (`H1..H5`)
- portfolio metadata with `max_concurrent_experiments=1`
- prioritize candidates (`C1..C3`) with linked and unlinked mix

## Rehearsal Output Snapshot

- Admissible ranking order: `H1`, `H2`, `H5`
- Blocked ranking entries:
  - `H3` -> `negative_ev`
  - `H4` -> `non_monetary_unit_requires_conversion`
- Activation attempt for `H2`: blocked with reason `Portfolio at max concurrent capacity (1/1 active)`
- Forced activation metadata captured for `H2`:
  - `activation_override=true`
  - reason `operator-override: urgent learning slot`
  - actor `pete`
- Prioritize bridge output:
  - `C1` (linked `H1`) -> `portfolio_status=applied`, `final_score=5`
  - `C2` (linked `H3`) -> `portfolio_status=blocked`, `blocked_reason=negative_ev`, `final_score=0`
  - `C3` (unlinked) -> `portfolio_status=unlinked`, `final_score=3`

## Validation Contract Results

- **TC-01:** deterministic ranking order matches fixture expectations -> PASS
- **TC-02:** activation gate blocks violations and logs override metadata when forced -> PASS
- **TC-03:** prioritize integration reflects linked vs unlinked behavior as designed -> PASS
- **TC-04:** runbook enables a second operator to reproduce the same outputs -> PASS (see `docs/business-os/hypothesis-portfolio/runbook.md`)

## Go / No-Go Decision

**Decision:** Go

Rationale:

- Deterministic ranking and blocked reason behavior are reproducible from fixture output.
- Activation safety and explicit override auditing are both demonstrated.
- Prioritize bridge behavior is explicit and backward-compatible for unlinked candidates.
- Operator runbook is published with reproducible command sequence and troubleshooting guidance.

## Rollback Procedure

If rollout needs to be reversed:

1. Disable prioritize bridge usage (return to baseline `(Impact + Learning-Value) / Effort` scoring only).
2. Keep hypothesis registry records as advisory artifacts.
3. Continue ranking/constraint testing in isolated rehearsal mode until the issue is resolved.
