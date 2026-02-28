---
schema_version: worldclass-scan.v1
business: BRIK
app: reception
goal_version: 1
scan_date: 2026-02-28
status: active
---

# World-Class Gap Scan — BRIK/reception (2026-02-28)

## Data Sources Probed

| Data Source | Status | Notes |
|---|---|---|
| Repo | configured | `apps/reception/src/` fully probed; extensive source code found across till, inventory, safe, and reports modules |
| Stripe | not-configured | Not applicable to reception cash/stock workflows; reception app is Firebase-based POS (not e-commerce); MCP shop_list returned error |
| GA4 | not-configured | No GA4 measurement ID found in `apps/reception/` source; GA4 is configured for the brikette website only (found in `docs/business-os/strategy/BRIK/` docs) |
| Firebase | configured | `.firebaserc` and `firebase.json` at repo root; project `prime-f3652` with `reception` alias; Firebase used as the primary data store for all app workflows |
| Octorate | not-configured | Only 2 files reference Octorate in `apps/reception/` (`useEmailGuest.ts` for booking email automation + one test file); Octorate is not integrated into cash or stock management workflows |

## Gap Comparison Table

| Domain | domain_id | Gap | Current State | Threshold | Gap Classification | Evidence Source | Notes |
|---|---|---|---|---|---|---|---|
| Cash Reconciliation UX | cash-reconciliation-ux | Older till screens (TillShiftHistory, CloseShiftForm labels) are English; newer screens are Italian — inconsistent language across app | Newer screens (`BatchStockCount`, `ManagerAuditContent`, `EodChecklistContent`) are fully Italian. Older till screens (`TillShiftHistory`, `CloseShiftForm` labels) remain in English. The app is bilingual but not consistently so. | Drawer/session workflow with fast counted close, immediate over/short display, offline audit record | minor-gap | apps/reception/src/components/till/CloseShiftForm.tsx | The underlying reconciliation mechanics are strong (denomination-aware, multi-step, blind mode, variance signoff, offline progress save). The gap is language inconsistency across screens — Italian-speaking staff encounter a mix of Italian and English depending on which screen they are on. |
| Stock Accountability | stock-accountability | No expected-vs-unexplained variance separation | `countVarianceSummary` shows total variance per item across all count entries. Waste is a distinct ledger entry type, but there is no view, calculation, or report that separates expected shrinkage (logged waste/comp/transfer) from unexplained variance. The shrinkage alert (24h window, threshold 10 units) fires on waste+adjust+count entries combined — it cannot distinguish between staff-documented waste and unexplained loss. | Count sheet with required note/reason when variance exceeds defined threshold | minor-gap | apps/reception/src/components/inventory/StockManagement.tsx | The ledger model (distinct entry types) has the data needed to support this separation, but the reporting layer does not expose it. An "explained vs unexplained" decomposition could be derived from existing entries. |
| Manager Audit Visibility | manager-audit-visibility | Shift history not filterable by staff or date; no denomination-level drill-down from variance | `TillShiftHistory` is hard-coded to `limitToLast: 10` with no filter by staff member, date range, or entity type. Clicking a shift row with a non-zero variance does not open denomination detail or the lift/drop journal for that shift. `EndOfDayPacket` shows cash discrepancies by user for a single selected date but requires separate navigation and does not link variance cells to denomination breakdowns. | Manager can filter by staff/date/entity and export; one tap from variance to underlying details | minor-gap | apps/reception/src/components/till/TillShiftHistory.tsx | The data exists in Firebase (denomination breakdowns are stored in shift records per `CloseShiftForm` — `denomBreakdown` is passed to `confirmShiftClose`). Surfacing it requires a detail view or expandable row, not a data pipeline change. |
| End-of-Day Close-Out | end-of-day-closeout | EOD close-out checklist built (resolved) | `/eod-checklist/` page now exists (built in commits `b58f3536`, `2a4dd180`, `f8e47b8f`). The page shows till, safe, and stock done/incomplete status in one unified view. | Single guided close-out checklist: (a) drawers counted, (b) stock logging confirmed, (c) outstanding items resolved or carried over, (d) offline-readable stored summary | resolved | apps/reception/src/components/reports/EndOfDayPacket.tsx, apps/reception/src/components/till/CloseShiftForm.tsx | EOD close-out checklist delivered. Till-level variance signoff (`VarianceSignoffModal` + `PasswordReauth`) remains strong. Cross-domain coordination gap is now resolved. |

## Scan Summary

- World-class domains: 0
- Major gaps: 0
- Minor gaps: 3
- No-data gaps: 0
- Total gap rows emitted: 3 (plus 1 resolved)

---

## Ideas Summary

**Scan date:** 2026-02-28
**Business/App:** BRIK/reception
**Total gaps:** 3 active, 1 resolved

### Dispatched Ideas

| Dispatch ID | Area | Gap | Status |
|---|---|---|---|
| IDEA-DISPATCH-20260228-0066 | End-of-Day Close-Out | No unified EOD close-out wizard | `auto_executed` → build complete (`reception-eod-closeout`) |

### Ideas Not Dispatched (this session)

| Gap | Domain ID | Classification | Reason held |
|---|---|---|---|
| Older till screens English; newer screens Italian — inconsistent language | cash-reconciliation-ux | minor-gap | Deferred — minor gap; cosmetic i18n work; lower priority than structural gaps |
| No explained/unexplained variance separation | stock-accountability | minor-gap | Deferred — reporting enhancement, data already available; queue when stock domain is active |
| Shift history not filterable; no denomination drill-down | manager-audit-visibility | minor-gap | Deferred — UX enhancement; low-risk; queue with manager-audit-visibility cycle |

### Next Scan

No major gaps remain. Remaining minor gaps in `cash-reconciliation-ux`, `stock-accountability`, and `manager-audit-visibility` domains can be addressed incrementally. Run `/lp-do-worldclass --app reception` to refresh.
