---
Type: Artifact
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Relates-to: docs/plans/xa-uploader-usability-hardening/plan.md
Task-ID: TASK-01
---

# XA Uploader Usability Baseline (TASK-01)

## Execution Status
- Task status: Complete evidence package for KPI baseline and operator journey mapping.
- Build cycle date: 2026-02-23.
- Scope: evidence-first baseline using current repo state and code-path inspection.

## Primary KPI
- KPI name: `Critical Journey Deterministic Blocker Rate (CJDBR)`.
- Why this KPI for this cycle:
  - It captures the most damaging usability class first: journeys that cannot complete at all in default operator conditions.
  - It is reproducible from code and repo state even before telemetry instrumentation exists.
- Formula:
  - `CJDBR = deterministic_blocked_journeys / total_priority_journeys`.
- Denominator and window:
  - `total_priority_journeys = 2` per audit pass (J1 Catalog Edit/Save, J2 Sync).
  - One audit pass is run per build cycle; final go/no-go recheck occurs in TASK-10.
- Baseline value (2026-02-23):
  - J1 Catalog Edit/Save: no deterministic hard block found from code-path evidence.
  - J2 Sync: deterministic hard block found (missing sync script dependencies).
  - `CJDBR = 1 / 2 = 50%`.
- Pre-committed threshold for TASK-10 go/no-go:
  - `CJDBR = 0 / 2 = 0%` deterministic blockers.
- Decision owner sign-off:
  - Engineering owner (sync contract owner): sign-off pending.
  - Operations lead (usability acceptance owner): sign-off pending.

## Operator Journeys (Baseline for Post-Change Comparison)

### J1 - Login -> Edit/Save -> Delete
| Step | Timing Baseline (Current) | Failure Points (Current) | Evidence |
|---|---|---|---|
| Enter token + authenticate | 2 request hops (`POST /api/uploader/login`, then session refresh path) | Invalid token -> login failure message | `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:173`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:185` |
| Load catalog list | 1 request hop (`GET /api/catalog/products`) | Load failure sets global error | `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:549`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:567` |
| Save edited product | 2 request hops (`POST /api/catalog/products` + refresh) | Validation errors and save failures use shared global error channel | `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:257`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:289`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:533` |
| Delete product | 2 request hops (`DELETE /api/catalog/products/[slug]` + refresh) | Delete failures use shared global error channel | `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:321`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:332`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:533` |

### J2 - Login -> Run Sync -> Review Result
| Step | Timing Baseline (Current) | Failure Points (Current) | Evidence |
|---|---|---|---|
| Trigger sync from panel | 1 API request containing 2 script invocations (validate + sync) | Missing scripts make sync non-operational in default repo state | `apps/xa-uploader/src/app/api/catalog/sync/route.ts:91`, `apps/xa-uploader/src/app/api/catalog/sync/route.ts:92`, `apps/xa-uploader/src/app/api/catalog/sync/route.ts:117` |
| Handle sync response in UI | 1 request-response render cycle | Errors route through shared global `error` channel with non-actionable generic `syncFailed` copy | `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:377`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:381`, `apps/xa-uploader/src/lib/uploaderI18n.ts:33` |

## Reproducible Evidence Snapshot (2026-02-23)

### Command results
```bash
test -f scripts/src/xa/validate-xa-inputs.ts; echo validate_script_exit:$?
test -f scripts/src/xa/run-xa-pipeline.ts; echo sync_script_exit:$?
```

Observed output:
```text
validate_script_exit:1
sync_script_exit:1
```

```bash
rg --files apps/xa-uploader/src | rg "__tests__|\\.test\\."
```

Observed output:
```text
apps/xa-uploader/src/lib/__tests__/imageDimensions.test.ts
apps/xa-uploader/src/lib/__tests__/catalogAdminSchema.test.ts
apps/xa-uploader/src/lib/__tests__/submissionZip.test.ts
apps/xa-uploader/src/lib/__tests__/catalogCsvMapping.test.ts
```

```bash
rg -n "const \\[error, setError\\]|setError\\(|setSubmissionStatus\\(" \
  apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts
```

Observed highlights:
- One shared error state declaration (`const [error, setError] = React.useState<string | null>(null)`).
- Multiple independent action handlers (`login`, `save`, `delete`, `sync`, `export`) writing into the same error channel.

## Collection Procedure for TASK-10 Re-run
1. Re-run the command set in this artifact to verify deterministic blocker status.
2. Re-check J1 and J2 steps against current code paths.
3. Compute `CJDBR` with the same two-journey denominator.
4. Record pass/fail:
   - Pass if `CJDBR = 0 / 2`.
   - Fail if any deterministic blocker remains.

## Downstream Hand-off Notes
- TASK-02 is now unblocked with KPI baseline and threshold defined.
- TASK-10 has a fixed baseline formula and pre-committed go/no-go threshold for impact interpretation.
