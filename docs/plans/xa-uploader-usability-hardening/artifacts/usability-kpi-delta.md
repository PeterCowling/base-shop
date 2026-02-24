---
Type: Artifact
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
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
| Measurement | Baseline (2026-02-23 TASK-01) | Post-change (2026-02-23 TASK-10) | Delta |
|---|---:|---:|---:|
| Deterministic blocked journeys | 1 | 1 | 0 |
| Total priority journeys | 2 | 2 | 0 |
| CJDBR | 50% | 50% | 0 pp |

## Post-Change Evidence

### J1: Login -> Edit/Save -> Delete
- Deterministic blocker status: **Not blocked**
- Evidence:
  - `pnpm --filter @apps/xa-uploader run test:e2e` TC-09-01 passed.
  - `pnpm --filter @apps/xa-uploader run test:local` route + hook suites passed.

### J2: Login -> Run Sync -> Review Result
- Deterministic blocker status: **Blocked (dependency missing)**
- Evidence:
```bash
test -f scripts/src/xa/validate-xa-inputs.ts; echo validate_script_exit:$?
test -f scripts/src/xa/run-xa-pipeline.ts; echo sync_script_exit:$?
```
Observed:
```text
validate_script_exit:1
sync_script_exit:1
```
- Current behavior improvement:
  - Blocker is now surfaced with deterministic, actionable guidance (`sync_dependencies_missing` + recovery copy), but the sync journey itself remains non-completable until scripts are restored.

## Interpretation
- Threshold result: **Not met** (`50%` vs required `0%`).
- Usability impact result:
  - Positive: operator recoverability and clarity improved materially (scoped feedback, localized errors, E2E-protected happy path).
  - Remaining gap: sync operability still depends on restoring missing script artifacts under `scripts/src/xa`.

## Recommended Next Action
- Restore/port required sync scripts, then rerun TASK-10 KPI measurement. Expected KPI movement after dependency restoration: `50% -> 0%`.

