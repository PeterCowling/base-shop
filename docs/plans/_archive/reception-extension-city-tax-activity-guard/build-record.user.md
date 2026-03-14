# Build Record — Reception Extension City Tax Activity Guard

**Date:** 2026-03-13
**Feature Slug:** `reception-extension-city-tax-activity-guard`
**Dispatch:** `IDEA-DISPATCH-20260313150000-0002`
**Business:** BRIK

## Outcome Contract

- **Why:** Every time an extension is confirmed, the system was logging 'city tax paid' activity even if the guest already paid in full. This created false duplicate entries in the guest activity log.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The 'city tax paid' activity entry is only written when the guest actually had an outstanding city tax balance.
- **Source:** operator

## What Was Built

Single-line fix in `ExtensionPayModal.tsx`: moved `saveActivity(CITY_TAX_PAYMENT)` and its error check inside the `if (record.balance > 0)` guard, so the activity log is only written when the city tax balance write also fires.

Added regression test that extends all guests when one has `balance = 0` — verifies `saveActivity(code 9)` fires once (for the guest with balance > 0) and not for the already-paid guest.

Also excluded `.claude/worktrees/` from the Jest haste module map in `apps/reception/jest.config.cjs` to prevent duplicate-mock errors from stale agent worktrees. Fixed 4 pre-existing `simple-import-sort` errors in analytics/cash files.

## Engineering Coverage Evidence

| Layer | Required | Evidence |
|---|---|---|
| Unit test — fix path | Required | Added `does not write city tax activity for occupant whose balance is already zero` — 7/7 tests pass |
| Unit test — existing regression | Required | All 6 prior tests continue to pass |
| Lint + typecheck | Required | `pnpm lint && pnpm typecheck` — 0 errors |
| Engineering coverage validator | Required | `validate-engineering-coverage.sh` → `valid: true` |

## Workflow Telemetry Summary

- Context input bytes: 34,739
- Modules loaded: `modules/build-code.md`
- Deterministic checks: `scripts/validate-engineering-coverage.sh`
- Token capture: not available (direct session, no Codex thread)

## Build Ideas Hook

Advisory — files changed (`ExtensionPayModal.tsx`, `jest.config.cjs`) not in standing registry; no dispatches emitted.
