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
| Cash Reconciliation UX | cash-reconciliation-ux | UI instructions and error messages are English-only | All till management text — step headings, error messages, action labels, re-auth instructions — is in English only. No Italian translations found in reception app source. | Drawer/session workflow with fast counted close, immediate over/short display, offline audit record | minor-gap | apps/reception/src/components/till/CloseShiftForm.tsx | The underlying reconciliation mechanics are strong (denomination-aware, multi-step, blind mode, variance signoff, offline progress save). The single gap is language accessibility for Italian-speaking staff — the same constraint applies to all 4 domains but is noted here as it is most directly a Key Indicator for the staff-facing reconciliation UX. |
| Stock Accountability | stock-accountability | No guided batch count flow; stock counting is item-by-item via action table | `StockManagement` renders a full inventory ledger table; "count" is one of 6 action types selectable per row. Staff must scroll through all items, select "count", enter counted quantity, add a reason, and press Record individually. No storage-area or category grouping, no progress indicator, no batch count sequence, no completion gate. `IngredientStock` is a direct-edit table with no audit trail (legacy migration prompt exists). | Storage-area/category-based count sheet with fast quantity entry, offline save, and automatic expected-vs-counted variance calculation | major-gap | apps/reception/src/components/inventory/StockManagement.tsx | Three Key Indicators are clearly below threshold: (1) count sequencing matches physical layout — absent; (2) progress visibility showing % complete or uncounted items — absent; (3) immediate variance surfacing at count completion — variance is in a separate Count Variance Report section, not presented at the moment the count is submitted. Offline persistence and user attribution are present. |
| Stock Accountability | stock-accountability | No expected-vs-unexplained variance separation | `countVarianceSummary` shows total variance per item across all count entries. Waste is a distinct ledger entry type, but there is no view, calculation, or report that separates expected shrinkage (logged waste/comp/transfer) from unexplained variance. The shrinkage alert (24h window, threshold 10 units) fires on waste+adjust+count entries combined — it cannot distinguish between staff-documented waste and unexplained loss. | Count sheet with required note/reason when variance exceeds defined threshold | minor-gap | apps/reception/src/components/inventory/StockManagement.tsx | The ledger model (distinct entry types) has the data needed to support this separation, but the reporting layer does not expose it. An "explained vs unexplained" decomposition could be derived from existing entries. |
| Manager Audit Visibility | manager-audit-visibility | No unified cross-domain manager summary — cash and stock variances are in separate views | `TillShiftHistory` shows the last 10 till shifts with cash variance per shift. `EndOfDayPacket` aggregates daily cash and safe data (discrepancies by user, variance sign-offs, pending exceptions). Stock count variances are only visible inside `StockManagement`. No single screen or component combines cash, safe, and stock variance status to enable a 30-second "is today clean?" confirmation. `EndOfDayPacket` is the closest to a unified view but covers cash/safe only. | Single manager view per shift/day showing expected vs actual cash and any stock variances, with user attribution, timestamps, and exportable log | major-gap | apps/reception/src/components/till/TillShiftHistory.tsx, apps/reception/src/components/reports/EndOfDayPacket.tsx, apps/reception/src/components/inventory/StockManagement.tsx | Minimum threshold requires stock variances to appear alongside cash variances in the manager view — currently they do not. Manager must navigate to 2–3 separate pages to confirm a clean day. |
| Manager Audit Visibility | manager-audit-visibility | Shift history not filterable by staff or date; no denomination-level drill-down from variance | `TillShiftHistory` is hard-coded to `limitToLast: 10` with no filter by staff member, date range, or entity type. Clicking a shift row with a non-zero variance does not open denomination detail or the lift/drop journal for that shift. `EndOfDayPacket` shows cash discrepancies by user for a single selected date but requires separate navigation and does not link variance cells to denomination breakdowns. | Manager can filter by staff/date/entity and export; one tap from variance to underlying details | minor-gap | apps/reception/src/components/till/TillShiftHistory.tsx | The data exists in Firebase (denomination breakdowns are stored in shift records per `CloseShiftForm` — `denomBreakdown` is passed to `confirmShiftClose`). Surfacing it requires a detail view or expandable row, not a data pipeline change. |
| End-of-Day Close-Out | end-of-day-closeout | No unified EOD close-out wizard; till, safe, and stock close-out are separate uncoordinated flows | `CloseShiftForm` handles the till-level close in a 3-step wizard (denomination count → CC receipts → keycard count) with variance signoff and password re-auth — this is strong. `SafeManagement`/`SafeReconciliation` handles safe workflows. `StockManagement` handles stock actions. `EndOfDayPacket` is a reporting/print tool. There is no guided daily close-out sequence that orders these steps, checks whether each is complete, blocks confirmation if outstanding items remain, and produces a single "day closed" artefact. | Single guided close-out checklist: (a) drawers counted, (b) stock logging confirmed, (c) outstanding items resolved or carried over, (d) offline-readable stored summary | major-gap | apps/reception/src/components/reports/EndOfDayPacket.tsx, apps/reception/src/components/till/CloseShiftForm.tsx | Minimum threshold items (b) and (c) are not met: stock logging status is not confirmed as part of any daily close sequence, and there is no unified mechanism to force resolution of outstanding items across till, safe, and stock before the day is closed. The till-level variance signoff (`VarianceSignoffModal` + `PasswordReauth`) is excellent; the gap is at the daily cross-domain coordination level. |

## Scan Summary

- World-class domains: 0
- Major gaps: 3
- Minor gaps: 3
- No-data gaps: 0
- Total gap rows emitted: 6

---

## Ideas Summary

**Scan date:** 2026-02-28
**Business/App:** BRIK/reception
**Total gaps:** 6 (3 major, 3 minor)

### Dispatched Ideas

| Dispatch ID | Area | Gap | Status |
|---|---|---|---|
| IDEA-DISPATCH-20260228-0066 | End-of-Day Close-Out | No unified EOD close-out wizard | `auto_executed` → build complete (`reception-eod-closeout`) |

### Ideas Not Dispatched (this session)

| Gap | Domain ID | Classification | Reason held |
|---|---|---|---|
| UI instructions English-only | cash-reconciliation-ux | minor-gap | Deferred — minor gap; cosmetic i18n work; lower priority than structural gaps |
| No guided batch count flow | stock-accountability | major-gap | Deferred — significant scope; separate dispatch needed when stock accountability is prioritised |
| No explained/unexplained variance separation | stock-accountability | minor-gap | Deferred — reporting enhancement, data already available; queue when stock domain is active |
| No unified cross-domain manager summary | manager-audit-visibility | major-gap | Deferred — larger scope; requires cross-domain data aggregation; separate worldclass cycle |
| Shift history not filterable; no denomination drill-down | manager-audit-visibility | minor-gap | Deferred — UX enhancement; low-risk; queue with manager-audit-visibility cycle |

### Next Scan

Remaining major gaps in `stock-accountability` and `manager-audit-visibility` domains warrant a follow-on scan when those domains are prioritised. Run `/lp-do-worldclass --app reception` to refresh.
