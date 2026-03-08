# Replan Notes — inventory-app-uploader-unification

## Round 1 — 2026-03-08

**Trigger:** Operator identified that several M-effort IMPLEMENT tasks were too large and should be split into S-sized work packages. The buried InventoryAuditEvent Prisma migration prerequisite inside TASK-08's scouts needed extracting as its own task.

### Task splits applied

**TASK-02 (M→S):** Narrowed to shell wrapper layer only — InventoryShell, InventoryHome, layout.tsx, page.tsx, CSS modules, fonts. Console component (InventoryConsole, useInventoryConsole) moved to new TASK-12. Confidence raised from 82% to 85%. Blocks updated from `TASK-03, TASK-04` to `TASK-12, TASK-03`.

**TASK-06 (M→S):** Narrowed to GET /api/inventory/[shop] route + left panel SKU list + low-stock highlight only. No PATCH route, no right panel editor. Variant editor moved to new TASK-13. Confidence raised from 80% to 85%. Blocks updated to include TASK-13.

**TASK-07 (M→S):** Narrowed to GET /api/inventory/[shop]/export route only (thin wrapper, CSV/JSON response). Import UI + API moved to new TASK-14. Confidence raised from 85% to 90%.

**TASK-08 (M→S):** Narrowed to POST /api/inventory/[shop]/adjustments route only (dry-run, idempotency). Prisma migration extracted to TASK-15. UI extracted to TASK-16. Depends-on updated to include TASK-15. Blocks updated from CHECKPOINT-11 to TASK-16. Confidence updated to 82%. Removed "JSONL, same pattern as CMS" audit log language — replaced with Prisma DB write via InventoryAuditEvent model (TASK-15). Removed prerequisite sub-task language from Scouts.

**TASK-09 (M→S):** Narrowed to POST /api/inventory/[shop]/inflows route only. UI extracted to TASK-17. Depends-on updated to include TASK-15. Blocks updated from CHECKPOINT-11 to TASK-17. Confidence updated to 82%.

### New tasks added

- **TASK-12** (S, 82%): Port XA console component layer — InventoryConsole.client.tsx + useInventoryConsole.client.ts. Depends on TASK-02, blocks TASK-04.
- **TASK-13** (S, 80%): Inventory variant editor + PATCH route — InventoryEditor.client.tsx + PATCH /api/inventory/[shop]/[sku]. Depends on TASK-06, blocks CHECKPOINT-11.
- **TASK-14** (M, 82%): Inventory import UI + API — InventoryImport.client.tsx + POST /api/inventory/[shop]/import. Depends on CHECKPOINT-05, blocks CHECKPOINT-11.
- **TASK-15** (M, 78%): InventoryAuditEvent Prisma migration — new schema model + migration + migrate stockAdjustments.server.ts and stockInflows.server.ts writes from JSONL to Prisma. Depends on CHECKPOINT-05, blocks TASK-08, TASK-09, TASK-10.
- **TASK-16** (S, 80%): Stock adjustments UI — StockAdjustments.client.tsx. Depends on TASK-08, blocks CHECKPOINT-11.
- **TASK-17** (S, 80%): Stock inflows UI — StockInflows.client.tsx. Depends on TASK-09, blocks CHECKPOINT-11.

### Dependency changes

- TASK-04 depends-on changed from TASK-02 to TASK-12 (shop selector modifies useInventoryConsole which lives in TASK-12).
- TASK-10 depends-on updated to include TASK-15.
- CHECKPOINT-11 depends-on updated to: TASK-07, TASK-13, TASK-14, TASK-16, TASK-17, TASK-10.
- CHECKPOINT-05 blocks updated to include TASK-14 and TASK-15.

### Sequencing changes

Parallelism guide rewritten from 7 waves to 9 waves to reflect the new task graph. Key change: Wave 6 now runs four parallel tasks (TASK-06, TASK-07, TASK-14, TASK-15) off CHECKPOINT-05; Wave 7 runs four parallel tasks (TASK-13, TASK-08, TASK-09, TASK-10) once TASK-06 + TASK-15 are complete; Wave 8 runs TASK-16 + TASK-17 in parallel.

### Confidence recalibration

Overall-confidence updated from 83% to 82%. Calculation now covers 15 IMPLEMENT tasks (13 × S + 2 × M = weight 17). Weighted sum 1394 / 17 = 82%.

### Rehearsal trace updated

All rows updated to reflect narrowed scopes. Six new rows added for TASK-12 through TASK-17. TASK-02 and TASK-06 rows updated to reflect "no rehearsal issues" given narrowed scope.
