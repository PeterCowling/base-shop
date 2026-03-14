---
Type: Plan
Status: Active
Domain: API
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: inventory-uploader-user-attribution
Dispatch-ID: IDEA-DISPATCH-20260313190000-0001
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/inventory-uploader-user-attribution/analysis.md
---

# Inventory Uploader — User Attribution Plan

## Summary

Stock adjustments and inflows currently write `operatorId: null` to every `InventoryAuditEvent` row, even though the column already exists and the repository functions already accept an optional `actor` parameter. This plan threads the requester's IP address from the HTTP request headers through the route handler → repository → database write path using the existing `getTrustedRequestIpFromHeaders` utility. The `LedgerEvent` type gains an `operatorId` field so the attribution is visible in the ledger GET response. No DB migration is needed. The `StockAdjustmentActor` and `StockInflowActor` types receive an `ip?: string` field; the Zod `adjustedBy`/`receivedBy` nested schemas in the event schemas do not use `.strict()` so no Zod schema change is required for them.

## Active tasks
- [x] TASK-01: Thread IP-based actor attribution through adjustments and inflows routes

## Goals
- Every `POST /api/inventory/[shop]/adjustments` write records the requester IP in `operatorId`.
- Every `POST /api/inventory/[shop]/inflows` write records the requester IP in `operatorId`.
- The ledger `GET /api/inventory/[shop]/ledger` response exposes `operatorId` in each event.
- No unauthenticated request can supply a fabricated actor identity (IP is server-side derived).

## Non-goals
- Adding per-user login or per-staff accounts; single-token model unchanged.
- UI changes to display attribution (API response exposure is sufficient for this change).
- Retroactive backfill of historical `operatorId = null` rows.

## Constraints & Assumptions
- Constraints:
  - Session token carries no user identity; IP is the only server-side attribution source.
  - `getTrustedRequestIpFromHeaders` returns `""` when `INVENTORY_TRUST_PROXY_IP_HEADERS` is unset — this is stored as `null` (falsy empty string maps to null gracefully).
  - Pass actor via the existing `options: { actor? }` parameter — do not change repository function signatures.
  - Zod schemas for the outer schemas use `.strict()` but the `adjustedBy`/`receivedBy` nested objects do not; no Zod schema updates are required.
- Assumptions:
  - IP-based attribution (confirmed as default by operator decision per fact-find).
  - `options?.actor?.ip ?? null` (or empty string coerced to null) is the value stored in `operatorId`.

## Inherited Outcome Contract

- **Why:** When stock goes missing or an error is spotted, there is no record of who made the change. Attaching the logged-in user to every stock adjustment makes it easy to audit who did what and catch mistakes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Every stock change record shows which staff member made it, enabling accountability and easier error investigation.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/inventory-uploader-user-attribution/analysis.md`
- Selected approach inherited:
  - IP-based attribution using `getTrustedRequestIpFromHeaders` from the existing `requestIp.ts` utility.
  - Actor `ip` field added to `StockAdjustmentActor` and `StockInflowActor` types.
  - Hardcoded `operatorId: null` replaced with `options?.actor?.ip || null` in both repository create calls.
- Key reasoning used:
  - IP is server-side derived and tamper-proof given the current single-token auth model.
  - All extension points (actor options bag, operatorId column, IP utility) already exist — minimal surface change required.

## Selected Approach Summary
- What was chosen:
  - Extract requester IP in both route handlers using `getTrustedRequestIpFromHeaders(req.headers)`.
  - Build an actor object `{ ip }` and pass as `options` third argument to `applyStockAdjustment` / `receiveStockInflow`.
  - In both repositories, replace `operatorId: null` with `options?.actor?.ip || null`.
  - Add `ip?: string` to both actor types.
  - Add `operatorId: string | null` to `LedgerEvent` type and map it in the ledger GET route.
- Why planning is not reopening option selection:
  - Operator confirmed IP-based approach (fact-find open question defaulted to IP). All code extension points exist. No alternative approach adds value without auth infrastructure changes.

## Fact-Find Support
- Supporting brief: `docs/plans/inventory-uploader-user-attribution/fact-find.md`
- Evidence carried forward:
  - `operatorId String?` already in Prisma schema — no migration needed.
  - Both repository functions already have `options: { actor? }` parameter — `operatorId: null` hardcoded at line 252 (adjustments) and line 239 (inflows).
  - `getTrustedRequestIpFromHeaders` in `apps/inventory-uploader/src/lib/auth/requestIp.ts` returns `""` when proxy headers disabled.
  - `stockAdjustmentEventSchema.adjustedBy` and `stockInflowEventSchema.receivedBy` nested objects do NOT use `.strict()` — adding `ip` to the type does not require Zod schema changes.
  - `LedgerEvent` in `inventory-utils.ts` lacks `operatorId` — must be added.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Thread IP-based actor attribution through adjustments and inflows routes | 87% | S | Complete (2026-03-13) | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — server-side only | - | No UI changes |
| UX / states | N/A — API response is additive | - | Adding `operatorId` field is backward-compatible |
| Security / privacy | IP derived server-side, never from request body; actor identity cannot be fabricated by caller | TASK-01 | `null` stored gracefully when proxy headers disabled |
| Logging / observability / audit | `operatorId` written to every `InventoryAuditEvent` row; visible in ledger GET response | TASK-01 | Core deliverable of the change |
| Testing / validation | TC-01 through TC-04 cover actor threading, null fallback, and ledger exposure | TASK-01 | Integration test pattern from existing `stockInflows.server.test.ts` |
| Data / contracts | `StockAdjustmentActor` and `StockInflowActor` gain `ip?: string`; `LedgerEvent` gains `operatorId: string \| null`; Zod nested schemas unchanged (not `.strict()`) | TASK-01 | Ledger GET mapper updated |
| Performance / reliability | IP extraction is synchronous; one extra field in DB write; no query changes | - | N/A — negligible overhead |
| Rollout / rollback | No feature flag; additive change; rollback = code revert; existing null rows are valid state | TASK-01 | No migration to reverse |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task, no dependencies |

## Delivered Processes

None: no material process topology change.

## Tasks

### TASK-01: Thread IP-based actor attribution through adjustments and inflows routes
- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated type files, repository files, route handlers, inventory-utils.ts
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `packages/platform-core/src/types/stockAdjustments.ts` — add `ip?: string` to `StockAdjustmentActor`
  - `packages/platform-core/src/types/stockInflows.ts` — add `ip?: string` to `StockInflowActor`
  - `packages/platform-core/src/repositories/stockAdjustments.server.ts` — replace `operatorId: null` with `options?.actor?.ip || null`
  - `packages/platform-core/src/repositories/stockInflows.server.ts` — replace `operatorId: null` with `options?.actor?.ip || null`
  - `apps/inventory-uploader/src/app/api/inventory/[shop]/adjustments/route.ts` — extract IP, pass as actor
  - `apps/inventory-uploader/src/app/api/inventory/[shop]/inflows/route.ts` — extract IP, pass as actor
  - `apps/inventory-uploader/src/lib/inventory-utils.ts` — add `operatorId: string | null` to `LedgerEvent`
  - `apps/inventory-uploader/src/app/api/inventory/[shop]/ledger/route.ts` — map `operatorId` in the response
  - `[readonly] apps/inventory-uploader/src/lib/auth/requestIp.ts` — `getTrustedRequestIpFromHeaders` used as-is
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 87%
  - Implementation: 90% — all extension points exist; change is mechanical substitution
  - Approach: 85% — IP threading is well-understood; one minor uncertainty is that `getTrustedRequestIpFromHeaders` returns `""` (empty string, not null) so the `|| null` coercion must be applied correctly
  - Impact: 95% — `operatorId` visible in DB rows and ledger response after deploy
- **Acceptance:**
  - `operatorId` stored as a non-null IP string (or null when proxy headers disabled) in every new `InventoryAuditEvent` row written by adjustments or inflows POST.
  - Ledger GET response includes `operatorId` field on each event.
  - TypeScript build passes for `@acme/platform-core` and `@acme/inventory-uploader`.
  - Existing tests continue to pass.
- **Engineering Coverage:**
  - UI / visual: N/A — no UI changes
  - UX / states: N/A — API response is additive; existing consumers unaffected
  - Security / privacy: Required — IP extracted server-side from trusted request headers; cannot be spoofed via request body; null stored gracefully when `INVENTORY_TRUST_PROXY_IP_HEADERS=false`
  - Logging / observability / audit: Required — `operatorId` written to `InventoryAuditEvent` for every non-dryRun write; visible via ledger GET endpoint
  - Testing / validation: Required — TC-01 through TC-04 cover the actor threading path
  - Data / contracts: Required — two actor types updated; `LedgerEvent` updated; ledger mapper updated; Zod event schemas unchanged (nested objects not `.strict()`)
  - Performance / reliability: N/A — synchronous IP extraction, one extra DB field, negligible
  - Rollout / rollback: Required — additive change; rollback = code revert; null rows pre-deploy are valid and remain valid
- **Validation contract (TC-XX):**
  - TC-01: `applyStockAdjustment` called with `options: { actor: { ip: "1.2.3.4" } }` → `InventoryAuditEvent.operatorId` stored as `"1.2.3.4"`
  - TC-02: `receiveStockInflow` called with `options: { actor: { ip: "1.2.3.4" } }` → `InventoryAuditEvent.operatorId` stored as `"1.2.3.4"`
  - TC-03: Route handler with `INVENTORY_TRUST_PROXY_IP_HEADERS` unset / `getTrustedRequestIpFromHeaders` returning `""` → `operatorId` stored as `null` (not empty string)
  - TC-04: Ledger GET response includes `operatorId` field on each returned event
- **Execution plan:** Red → Green → Refactor
  1. Add `ip?: string` to `StockAdjustmentActor` type in `stockAdjustments.ts`
  2. Add `ip?: string` to `StockInflowActor` type in `stockInflows.ts`
  3. In `stockAdjustments.server.ts`: change `operatorId: null` → `operatorId: options?.actor?.ip || null`
  4. In `stockInflows.server.ts`: change `operatorId: null` → `operatorId: options?.actor?.ip || null`
  5. In `adjustments/route.ts` POST: import `getTrustedRequestIpFromHeaders`, extract IP, pass `{ actor: { ip: ip || undefined } }` as third arg to `applyStockAdjustment`
  6. In `inflows/route.ts` POST: same pattern for `receiveStockInflow`
  7. In `inventory-utils.ts`: add `operatorId: string | null` to `LedgerEvent` type
  8. In `ledger/route.ts`: add `operatorId: (r.operatorId as string | null) ?? null` to the event mapper
- **Planning validation (required for M/L):** N/A — effort S
- **Scouts:**
  - Confirm `adjustedBy` nested schema in `stockAdjustmentEventSchema` has no `.strict()` call (confirmed: lines 67-72 of stockAdjustments.ts, no `.strict()` on nested object).
  - Confirm `receivedBy` nested schema in `stockInflowEventSchema` has no `.strict()` call (confirmed: lines 57-62 of stockInflows.ts, no `.strict()` on nested object).
  - Confirm `getTrustedRequestIpFromHeaders` returns `string` not `string | null` (confirmed: returns `""` for no-IP case).
- **Edge Cases & Hardening:**
  - Empty string IP from `getTrustedRequestIpFromHeaders` must be coerced to `null` using `|| null` before passing as `actor.ip` — do not store empty strings.
  - Dry-run writes do not create DB rows so no actor threading needed in dry-run path (existing behavior preserved).
  - Idempotent duplicate requests: the prior-row path returns the stored row as-is; `operatorId` on duplicate events already reflects the original write — no action needed.
- **What would make this >=90%:**
  - Operator confirmation that IP is acceptable attribution (defaulted to yes per fact-find).
- **Rollout / rollback:**
  - Rollout: deploy normally; no migration; first writes after deploy will carry `operatorId`.
  - Rollback: revert the code; rows written with `operatorId` set remain harmless (column is nullable).
- **Documentation impact:**
  - None required; the `LedgerEvent` type change is self-documenting via TypeScript.
- **Notes / references:**
  - `getTrustedRequestIpFromHeaders` import path: `apps/inventory-uploader/src/lib/auth/requestIp.ts` → relative import from route as `"../../../../../lib/auth/requestIp"` (same depth as other lib imports in the route).
  - `operatorId: null` is at line 252 of `stockAdjustments.server.ts` and line 239 of `stockInflows.server.ts`.

## Risks & Mitigations
- **IP returns empty string / null when `INVENTORY_TRUST_PROXY_IP_HEADERS` is unset** — mitigated by `|| null` coercion; `operatorId` stored as null (same as current state), no error thrown.
- **Zod `.strict()` rejection on actor schema** — risk does not materialise; the `adjustedBy`/`receivedBy` nested objects in the event schemas are NOT `.strict()`; confirmed by reading the source.
- **Historical rows with `operatorId = null`** — expected and acceptable; null means "recorded before attribution was enabled".

## Observability
- Logging: None — no additional logging added; `operatorId` in the DB is the audit trail.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] `operatorId` non-null in `InventoryAuditEvent` rows written by POST /adjustments when proxy headers enabled.
- [ ] `operatorId` non-null in `InventoryAuditEvent` rows written by POST /inflows when proxy headers enabled.
- [ ] `operatorId: null` stored gracefully when proxy headers disabled (no error thrown).
- [ ] Ledger GET response includes `operatorId` field.
- [ ] TypeScript build passes (`pnpm --filter @acme/platform-core typecheck` and `pnpm --filter @acme/inventory-uploader typecheck`).
- [ ] Lint passes (`pnpm --filter @acme/platform-core lint` and `pnpm --filter @acme/inventory-uploader lint`).

## Decision Log
- 2026-03-13: IP-based attribution chosen (defaulted from fact-find open question); operator acknowledged single-token auth model means IP is the only tamper-proof server-side identifier.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Type changes | Yes | Zod nested schemas confirmed NOT `.strict()` — no Zod update needed (finding improves confidence) | No |
| TASK-01: Repository changes | Yes | `operatorId: null` confirmed at lines 252 (adjustments) and 239 (inflows) | No |
| TASK-01: Route handler changes | Yes | `getTrustedRequestIpFromHeaders` returns `""` not null — must coerce with `\|\| null` | No |
| TASK-01: Ledger mapper | Yes | `LedgerEvent` lacks `operatorId`; mapper does not include it | No |

## Overall-confidence Calculation
- TASK-01: S=1 effort weight, confidence=87%
- Overall-confidence = 87 * 1 / 1 = **87**
