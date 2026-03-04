---
Type: Process-Contract
Status: Active
Version: 1.0.0
Domain: Venture-Studio
Workstream: Startup-Loop
Created: 2026-03-04
Last-updated: 2026-03-04
Owner: startup-loop maintainers
---

# Naming Round Analytics Cadence Contract v1

## Purpose

Define the mandatory review cadence for naming sidecar analytics so each naming round feeds quantitative self-improvement decisions.

## Trigger

Run this cadence immediately after any naming round that writes sidecar events under:

- `docs/business-os/strategy/<BIZ>/assessment/naming-workbench/naming-sidecars/*.jsonl`
- `docs/business-os/strategy/<BIZ>/assessment/naming-workbench/product-naming-sidecars/*.jsonl`

## Inputs

- Sidecar JSONL event files from one or more businesses.
- Generator command:
  - `pnpm --filter scripts run startup-loop:naming-round-analytics`

## Outputs

The cadence must refresh both canonical artifacts:

- `docs/business-os/startup-loop/operations/naming-round-analytics.latest.json`
- `docs/business-os/startup-loop/operations/naming-round-analytics.latest.md`

## Minimum Review Checklist

1. Confirm command succeeded and artifacts were regenerated.
2. Confirm round count and source file list match expected recent rounds.
3. Review RDAP yield metrics for company naming rounds.
4. Review TM operator label coverage for product naming rounds.
5. If TM label coverage is below 20% for a round, record follow-up to capture operator outcomes.
6. If RDAP yield shifts by >=15 percentage points versus prior company round, record investigation follow-up.
7. Link observations into the relevant `results-review.user.md` under New Idea Candidates or Standing Updates.

## Completion Criteria

Cadence is complete when:

- Both artifacts are updated.
- Review checklist items 1-7 are addressed.
- At least one explicit statement exists about whether a follow-up is required.

## Failure / Degraded Mode

If the generator fails:

1. Record failure context in the active plan/build record.
2. Do not estimate metrics manually.
3. Open a follow-up task to restore generator health.

## Notes

- This contract is additive and does not change naming round execution logic.
- Low operator label coverage is expected during early adoption; treat coverage as readiness signal, not a failure by itself.
