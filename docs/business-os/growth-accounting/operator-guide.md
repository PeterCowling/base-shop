---
Type: Runbook
Status: Active
Domain: Business-OS
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
---

# Growth Accounting Operator Guide

## Purpose

Operate S10 growth-accounting outputs safely, with deterministic replay checks and explicit fallback behavior.

## Canonical Artifacts

- Ledger snapshot: `data/shops/{shopId}/growth-ledger.json`
- S10 stage result: `docs/business-os/startup-baselines/{BIZ}/runs/{RUN_ID}/stages/S10/stage-result.json`
- Growth event payload: `docs/business-os/startup-baselines/{BIZ}/runs/{RUN_ID}/stages/S10/growth-event-payload.json`
- Validation baseline: `docs/business-os/growth-accounting/validation-report.md`

## Standard S10 Flow

1. Run diagnosis pipeline with growth enabled for the target run.
2. Verify `stage-result.json` includes `growth_accounting` and `artifacts.growth_ledger`.
3. Verify `growth-ledger.json` revision and timestamp are updated for the run period.
4. Verify Business OS card/API reflects the same stage statuses and overall signal.

## Replay Procedure

1. Open the run payload (`growth-event-payload.json`) for the target `RUN_ID`.
2. Read replay inputs from `growth_accounting.input.metrics`.
3. Rebuild threshold set at `growth_accounting.threshold_set.generated_at` using the canonical catalog.
4. Re-evaluate and compare these fields against `growth_accounting.output`:
   - `stage_statuses`
   - `overall_status`
   - `guardrail_signal`
   - `actions`
5. Treat any mismatch as a failed replay check and block rollout until resolved.

## Override and Fallback Semantics

- Growth integration can be disabled at pipeline invocation (`growthAccounting.enabled=false`) for incident containment.
- Missing or invalid metric inputs do not crash S10 by default:
  - missing threshold metric => `not_tracked`
  - missing/low denominator => `insufficient_data`
- If growth integration throws, diagnosis pipeline continues and records a warning (`Growth accounting integration failed: ...`).
- API fallback when no ledger exists is deterministic: `404` with `ledger_not_initialized`.
- Rollback path: disable growth hook flag and hide growth card while preserving immutable event artifacts.

## Failure Modes

| Failure mode | Signal | Operator action |
|---|---|---|
| Missing S3/S10 artifacts | growth warning, missing source pointers | restore artifact paths and rerun S10 |
| Replay mismatch | evaluated output differs from payload output | block release, compare threshold hash and metric normalization |
| Ledger CAS conflict | explicit conflict error during write | rerun with latest ledger revision/input snapshot |
| Ledger read failure in API | `ledger_read_failed` response | validate schema + JSON integrity at ledger path |
| Ledger not initialized | `ledger_not_initialized` response | execute first governed S10 run for the business |

## Targeted Verification Commands

```bash
pnpm run test:governed -- jest -- --config ./jest.config.cjs -- src/startup-loop/__tests__/s10-growth-accounting.test.ts --modulePathIgnorePatterns=.open-next/ --modulePathIgnorePatterns=.worktrees/ --modulePathIgnorePatterns=.ts-jest/
pnpm --filter @apps/business-os test -- src/components/board/GrowthLedgerCard.test.tsx
```
