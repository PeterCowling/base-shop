---
Status: Complete
Feature-Slug: core-triad-size-budget-guardrails
Completed-date: 2026-03-09
artifact: build-record
---

# Core Triad Size Budget Guardrails Build Record

## What Was Built
Added a shared skill-size metric collector for startup-loop skill audits and reused it in the existing `meta-loop-efficiency` audit path. Added a checked-in triad budget manifest covering `lp-do-fact-find`, `lp-do-plan`, and `lp-do-build`, with explicit `target_lines`, `allowed_lines`, and waiver metadata so the repo can fail closed on future growth without instantly breaking on the current over-budget state.

Added a dedicated validator CLI and wired it into `scripts/validate-changes.sh` for relevant changes. The validator now blocks growth past each skill’s current allowed cap, fails on missing/invalid waiver state, and emits failure guidance shaped to the repo’s failure-message contract. Added CI-runnable tests for waiver-pass, over-limit fail, expired-waiver fail, and missing-entry fail cases.

## Tests Run
- `pnpm exec tsc -p scripts/tsconfig.json --noEmit` — pass
- `pnpm exec eslint scripts/src/startup-loop/diagnostics/skill-size-metrics.ts scripts/src/startup-loop/diagnostics/core-triad-size-budget-validator.ts scripts/src/startup-loop/diagnostics/meta-loop-efficiency-audit.ts scripts/src/startup-loop/__tests__/core-triad-size-budget-validator.test.ts scripts/src/startup-loop/__tests__/meta-loop-efficiency-audit.test.ts --no-warn-ignored` — pass
- `pnpm --filter scripts startup-loop:validate-core-triad-size-budgets` — pass with expected waiver warnings
- `pnpm --filter scripts startup-loop:meta-loop-efficiency-audit -- --dry-run` — pass

## Validation Evidence
- Shared collector exists at `scripts/src/startup-loop/diagnostics/skill-size-metrics.ts` and is consumed by `meta-loop-efficiency-audit.ts`.
- Triad manifest exists at `scripts/src/startup-loop/diagnostics/core-triad-skill-budgets.json`.
- Validator CLI exists at `scripts/src/startup-loop/diagnostics/core-triad-size-budget-validator.ts` and is exposed through `scripts/package.json`.
- Local validation gate invokes the validator from `scripts/validate-changes.sh` when triad or validator-related paths change.
- Tests covering validator behavior exist at `scripts/src/startup-loop/__tests__/core-triad-size-budget-validator.test.ts`.

## Scope Deviations
- None.

## Outcome Contract
- **Why:** The triad that every build cycle depends on has already regressed significantly; without guardrails it will drift back into monolith state.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Define and implement enforceable size-budget checks and exception policy for `lp-do-fact-find`, `lp-do-plan`, and `lp-do-build`.
- **Source:** operator
