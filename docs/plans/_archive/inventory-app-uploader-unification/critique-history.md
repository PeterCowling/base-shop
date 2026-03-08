# Critique History: inventory-app-uploader-unification

## Round 1 — 2026-03-08

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | TASK-01, CHECKPOINT-05, Constraints | Workers+Postgres connectivity unaddressed — no Hyperdrive binding in wrangler.toml; no test mechanism for Prisma init in Workers; XA uploader (the reference) uses no Prisma. Fixed: added TC-04 health-check route to TASK-01; added critical scout for Hyperdrive investigation. |
| 1-02 | Major | TASK-10, TASK-08 consumer tracing, Risks table | JSONL-on-disk fallback invalid in deployed Workers (read-only FS). Fixed: replaced "accept JSONL file reads via Workers FS" with explicit blocker language and mandatory grep scout in TASK-08/TASK-09/TASK-10; Risks table Impact upgraded to High. |
| 1-03 | Major | All 9 IMPLEMENT tasks | `Execution plan: Red → Green → Refactor` field absent from all tasks (required by plan-lens.md). Fixed: added field to all 9 IMPLEMENT tasks with task-appropriate content. |
| 1-04 | Moderate | Frontmatter | Confidence-Method said `min()` but all task confidences use average of 3 sub-scores. Fixed: changed Confidence-Method to `avg(...)` to match actual calculation. |
| 1-05 | Moderate | TASK-07 | Effort rated S but scope (drag-drop UI, preview, streaming, error display) is M. Fixed: upgraded to M; added planning validation with CMS UI complexity evidence. |
| 1-06 | Moderate | TASK-04 | CMS `/api/shops` auth requirement unresolved; no INVESTIGATE task created. Fixed: lowered confidence from 85% to 78%; promoted scout to mandatory with explicit resolution paths; overall confidence recalculated. |
| 1-07 | Minor | Confidence-Method | Method description ambiguous (min vs avg). Fixed as part of 1-04. |
| 1-08 | Minor | TASK-09 planning validation | Less specific than TASK-08's equivalent — no artifact citations. Carried open: low priority, not autofix-eligible without reading the actual file. |

### Issues Confirmed Resolved This Round
None (round 1).

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-08 | Minor | 1 | TASK-09 planning validation cites "confirmed snapshot-assist and idempotency patterns" without artifact reference. Next round: add specific file + line citation matching TASK-08's level of evidence. |

### Score
- Pre-fix: 3.5 (partially credible)
- Post-fix: estimated 4.0 (credible) — Majors resolved, carried-open is Minor only
- Recommended action after fixes: re-critique to confirm 4.0 or proceed to build

---

## Round 2 — 2026-03-08

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | Constraints & Assumptions | Assumptions block stated stock adjustments/inflows services "work in Workers without changes." Source confirms both use `fs.promises` (file-lock creation, JSONL append) — inaccessible on deployed Workers read-only FS. Direct contradiction with TASK-08/09 scouts. Fixed: assumption rewritten to describe known FS dependency and prerequisite migration. |
| 2-02 | Major | TASK-06 Acceptance + Planning Validation | `updateInventoryItem` described with wrong signature `(shop, sku, attrs, updates)`. Actual: `(shop, sku, variantAttributes, mutate: InventoryMutateFn)` — fourth arg is a function. Fixed: acceptance, planning validation, and TC-06 rewritten to show mutate-function pattern and undefined-return 404 case. |
| 2-03 | Moderate | TASK-01 Validation Contract | `import "server-only"` in all platform-core repos not validated for Workers compatibility. Fixed: added TC-05 to TASK-01 to confirm no guard error on startup. |
| 2-04 | Moderate | TASK-01 + TASK-02 | `repoResolver` bundles both Prisma and JSON (fs-dependent) implementations via dynamic import — JSON module is always in the bundle. Not a plan blocker but bundle may include `fs` code even on Prisma path. Noted in TASK-08 scout (scout already addresses the runtime risk; the bundle inclusion aspect is documented via the Assumptions fix). |
| 2-05 | Moderate | TASK-09 Planning Validation | Carried open from 1-08 (elevated from Minor to Moderate after 2 rounds). No artifact citation for CMS inflows client review. Fixed: added explicit file path citation. |
| 2-06 | Moderate | TASK-10 Acceptance | Ledger view could accidentally query `CentralInventoryItem` table (different variantKey format). Fixed: added negative constraint to TASK-10 acceptance. |
| 2-07 | Minor | TASK-06 Planning Validation | variantKey format marked as "to be confirmed" even though source is verifiable. Fixed: marked as confirmed with source citation in planning validation. |
| 2-08 | Minor | TASK-06 Acceptance | `updateInventoryItem` can return `undefined` (item deleted); PATCH handler must return 404. Addressed as part of 2-02 fix. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary |
|---|---|---|
| 1-08 | Minor → resolved | TASK-09 planning validation now cites `apps/cms/.../stockInflows.client.tsx` explicitly with pattern descriptions. Closed. |

### Issues Carried Open (not yet resolved)
None. All round-2 issues were autofixed this session.

### Score
- Pre-fix: 3.7 (two new Majors from source verification; Assumptions contradiction; signature mismatch)
- Post-fix: estimated 4.1 (credible, build-eligible) — both Majors resolved, migration dependency now sequenced, carried-open from round 1 closed
- Recommended action: proceed to build. No further re-critique required unless TASK-08 critical scout result (JSONL confirmed) triggers the Prisma migration sub-task, at which point that sub-task should be planned before TASK-10 starts.

---

## Round 3 — 2026-03-08

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Major | TASK-15 Acceptance + TC | CMS history display confirmed (not hypothetical) to call `listStockAdjustments` and `listStockInflows` which both use `fs.readFile` on JSONL files. Relegated to Refactor in prior plan version — this means it could be skipped, leaving CMS history silently empty after migration. Fixed: elevated to mandatory Acceptance + TC-06 (grep confirms no remaining JSONL reads in both server files). |
| 3-02 | Major | TASK-15 Acceptance + TC | `applyStockAdjustment` calls `readAll(shop)` (an `fs.readFile` on JSONL) to check for a prior event by idempotency key. After migration removes JSONL writes, this read returns stale/empty data — idempotency detection silently fails for all new events (duplicate adjustments are processed). Not mentioned in prior acceptance or TC. Fixed: added mandatory Acceptance clause for idempotency read path migration + TC-07 (re-submit same idempotency key verifies DB query used). |
| 3-03 | Minor | TASK-07 Acceptance | Export route built but no task's acceptance added an "Export" button to InventoryMatrix. Route was an orphan output. Fixed: added export button wiring to TASK-07 acceptance. |
| 3-04 | Minor | Rehearsal Trace (TASK-15) | Rehearsal row said "may read JSONL directly" — source verification confirms it does. Fixed: updated rehearsal row to "confirmed" with function names and severity upgraded from Moderate to Major. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary |
|---|---|---|
| All round-2 issues | Various | Confirmed resolved; no regression found. |

### Issues Carried Open (not yet resolved)
None. All round-3 issues were autofixed this session.

### Score
- Pre-fix: 3.9 (two new Majors from TASK-15 source verification of JSONL read paths)
- Post-fix: 4.4 (credible, build-eligible, improved) — both Majors resolved with explicit TC; two Minors fixed; no carried-open issues
- Delta justification: move from 4.1 (round 2 post-fix) to 4.4 (round 3 post-fix) reflects resolution of two new Majors that were sourced by direct file verification this round. Pre-fix score drops to 3.9 due to the Majors; post-fix recovers to 4.4 because both are cleanly fix-eligible within TASK-15 scope and the overall plan structure remains sound.
- Recommended action: proceed to build. No further re-critique required. TASK-15 is now the most complex task in the plan — build agents should treat TC-06 and TC-07 as hard gates before marking TASK-15 complete.
