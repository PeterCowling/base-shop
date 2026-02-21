---
Type: Report
Status: Canonical
Domain: Business-OS
Last-reviewed: 2026-02-13
---

# Growth Accounting Validation Report (GAK-08)

Date: 2026-02-13
Plan task: `GAK-08` (`growth-accounting-kernel`)

## Scope

This report validates the replayable end-to-end dry-run requirements for pilot fixtures (`HEAD`, `PET`) and records the canonical `HEAD` ledger snapshot used by API/UI tests.

## Fixture Inputs

Dry-run run IDs:
- `SFS-HEAD-20260213-1200`
- `SFS-PET-20260213-1200`

Seeded S10 actuals:

| Business | traffic | cvr | aov (EUR) | cac (EUR) | orders | revenue (EUR) |
|---|---:|---:|---:|---:|---:|---:|
| HEAD | 8500 | 0.025 | 145 | 45 | 213 | 30885 |
| PET | 12000 | 0.012 | 32 | 18 | 144 | 4608 |

## TC-01: End-to-end dry-run artifacts

For both fixtures, one complete `runDiagnosisPipeline(..., growthAccounting.enabled=true)` execution produced:
- Growth ledger: `data/shops/{BUSINESS}/growth-ledger.json`
- S10 stage result: `docs/business-os/startup-baselines/{BUSINESS}/runs/{RUN_ID}/stages/S10/stage-result.json`
- Growth event payload capture: `docs/business-os/startup-baselines/{BUSINESS}/runs/{RUN_ID}/stages/S10/growth-event-payload.json`

Observed outputs:

| Business | overall_status | guardrail_signal | acquisition | activation | revenue | retention | referral |
|---|---|---|---|---|---|---|---|
| HEAD | red | kill | red | green | green | not_tracked | not_tracked |
| PET | red | kill | red | yellow | yellow | not_tracked | not_tracked |

## TC-02: Hand-calculated threshold breach scenario (HEAD)

Acquisition breach check (threshold direction `lower`, green `1300`, red `1500` for `blended_cac_eur_cents`):
- `new_customers_count = orders = 213`
- `spend_eur_cents = cac * new_customers_count * 100 = 45 * 213 * 100 = 958500`
- `blended_cac_eur_cents = spend_eur_cents / new_customers_count = 958500 / 213 = 4500`
- `4500 >= 1500` => acquisition status `red`

Reducer output matched this expectation exactly:
- `stages.acquisition.status = red`
- `overall_status = red`
- `guardrail_signal = kill`

## TC-03: Replay from event payload reproduces identical output

Replay procedure:
1. Read `growth_accounting.input.metrics` from the emitted event payload.
2. Rebuild threshold set from catalog at payload `threshold_set.generated_at`.
3. Re-run `evaluateGrowthLedger` using only replay payload metrics + threshold set.
4. Compare to `growth_accounting.output` from the event payload.

Result:
- `HEAD`: replay equivalence `true`
- `PET`: replay equivalence `true`

## TC-04: UI card reflects dry-run fixture state

Canonical fixture materialized from `HEAD` dry-run output:
- `data/shops/HEAD/growth-ledger.json`
- `scripts/src/startup-loop/__tests__/fixtures/growth-ledger-head.json`

Expected UI-visible state from this fixture:
- overall status `red`
- guardrail `kill`
- acquisition `red`
- retention `not_tracked`

Validated by targeted UI test (see Validation Evidence).

## Validation Evidence

Commands executed for this task:
- `pnpm --filter scripts test -- src/startup-loop/__tests__/s10-growth-accounting.test.ts --modulePathIgnorePatterns='\.open-next/' --modulePathIgnorePatterns='\.worktrees/' --modulePathIgnorePatterns='\.ts-jest/'`
- `pnpm --filter @apps/business-os test -- src/components/board/GrowthLedgerCard.test.tsx`

Both commands passed during GAK-08 execution. The ignore patterns on the scripts Jest run isolate this task from unrelated generated workspace directories.
