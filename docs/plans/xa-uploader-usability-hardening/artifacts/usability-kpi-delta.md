---
Type: Artifact
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-26
Relates-to: docs/plans/xa-uploader-usability-hardening/plan.md
Task-ID: TASK-10
---

# XA Uploader KPI Delta (TASK-10)

## KPI Definition (from TASK-01)
- KPI: `Critical Journey Deterministic Blocker Rate (CJDBR)`
- Formula: `deterministic_blocked_journeys / total_priority_journeys`
- Priority journeys in scope:
  - J1: Login -> Edit/Save -> Delete
  - J2: Login -> Run Sync -> Review Result
- Pre-committed threshold (TASK-01): `CJDBR = 0 / 2 = 0%`

## Baseline vs Post-Change
| Measurement | Baseline (2026-02-23 TASK-01) | Post-change (2026-02-23 TASK-10) | Post-change (2026-02-26 xa-e2e-sync-success-path) | Delta (total) |
|---|---:|---:|---:|---:|
| Deterministic blocked journeys | 1 | 1 | 0 | -1 |
| Total priority journeys | 2 | 2 | 2 | 0 |
| CJDBR | 50% | 50% | 0% | -50 pp |

## Post-Change Evidence

### J1: Login -> Edit/Save -> Delete
- Deterministic blocker status: **Not blocked**
- Evidence:
  - `pnpm --filter @apps/xa-uploader run test:e2e` TC-09-01 passed.
  - `pnpm --filter @apps/xa-uploader run test:local` route + hook suites passed.

### J2: Login -> Run Sync -> Review Result
- Deterministic blocker status: **Blocked (dependency missing)** — as of 2026-02-23 TASK-10.

- Evidence (2026-02-23 TASK-10):
```bash
test -f scripts/src/xa/validate-xa-inputs.ts; echo validate_script_exit:$?
test -f scripts/src/xa/run-xa-pipeline.ts; echo sync_script_exit:$?
```
Observed:
```text
validate_script_exit:1
sync_script_exit:1
```
- Current behavior improvement (2026-02-23):
  - Blocker is now surfaced with deterministic, actionable guidance (`sync_dependencies_missing` + recovery copy), but the sync journey itself remains non-completable until scripts are restored.

### J2 Post-change Remeasurement (2026-02-26 xa-e2e-sync-success-path)
- Deterministic blocker status: **Not blocked**
- Evidence:
  - Scripts restored in commit `2ac91e7e5a` (2026-02-24).
  - TC-09-03 Playwright E2E test (real sync, dryRun=false): `3 passed (3.0m)` — TC-09-01 (2.0m), TC-09-02 (14.5s), TC-09-03 (4.7s).
  - `catalog-sync-feedback` shows "Sync completed." with stub contract server responding `{ ok: true, version: "v-e2e-test" }`.
  - Keyboard access maintained: `catalog-run-sync` button regains focus after sync completes.
  - Run command: `pnpm --filter @apps/xa-uploader run test:e2e`

## Interpretation
- Threshold result (2026-02-26): **Met** (`0%` vs required `0%`).
- Usability impact result:
  - Positive: both J1 and J2 are fully covered by deterministic E2E tests. CJDBR threshold reached.
  - No remaining gaps for priority journeys in scope.

## Recommended Next Action
- No further action required on CJDBR. Threshold met. Consider expanding E2E coverage to J2 error paths (validation failure, pipeline failure, empty-input 409) as a future enhancement outside this plan's scope.

