---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: reception-manager-audit
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Dispatch-ID: IDEA-DISPATCH-20260228-0065
artifact: fact-find
---

# Reception Manager Audit Visibility Fact-Find Brief

## Scope

### Summary

The reception app has no single summary view for managers. Operational signals — stock
count variance, shift close status, and occupancy/check-in activity — live in separate
pages, requiring managers to navigate multiple screens to get an overview. This brief
investigates what data is available and how to build a read-only manager audit view
that aggregates these signals into one page.

### Goals

- Identify available data hooks for stock variance, shift close status, and check-in activity.
- Determine the routing/nav integration point for a new manager page.
- Confirm permissions (which roles can see the page).
- Scope an MVP that covers the core signals without replicating existing views.

### Non-goals

- Replacing or duplicating StockManagement, ShiftHistory, or Check-in pages.
- Real-time streaming refresh (static on-mount fetch is sufficient for MVP).
- Deep drill-down from the summary (links to existing pages serve that need).

### Constraints & Assumptions

- Constraints:
  - Read-only: no mutations on this page.
  - `MANAGEMENT_ACCESS` permission gate — same as Real Time Dashboard.
  - Must follow `force-dynamic` pattern (Firebase RTDB dependency).
  - Italian text for all new UI labels.
- Assumptions:
  - Firebase hooks and RTDB are always available in the reception context.
  - `useTillShiftsData`, `useInventoryLedger`, `useInventoryItems`, `useCheckins` are
    sufficiently pre-built that no hook modifications are needed.
  - A single-page aggregate (not a multi-tab dashboard) is sufficient for MVP.

## Outcome Contract

- **Why:** World-class gap scan (BRIK/reception, 2026-02-28) identified manager audit
  visibility as a major gap — managers must navigate multiple screens to get an operational
  overview and have no unified exception surface.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A manager audit page is live in the reception app that
  shows stock count variance summary, last 3 shift close summaries, and today's check-in
  count in one read-only view, accessible to all users with MANAGEMENT_ACCESS.
- **Source:** auto

## Access Declarations

None. All investigation is local repo. Firebase RTDB is pre-configured per `memory/data-access.md`.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/app/page.tsx` — root redirects to `/bar`; all authenticated pages use `Providers` wrapper + `force-dynamic`
- `apps/reception/src/components/appNav/AppNav.tsx` — sidebar nav with role-based section filtering; add "Manager Audit" to Admin section

### Key Modules / Files

- `apps/reception/src/hooks/data/inventory/useInventoryLedger.ts` — returns `{ entries, loading, error }`; entries typed as `InventoryLedgerEntry[]`
- `apps/reception/src/hooks/data/inventory/useInventoryItems.ts` — returns `{ items, itemsById, loading, error }`
- `apps/reception/src/utils/inventoryLedger.ts` — `buildInventorySnapshot(itemsById, entries)` → `Record<string, { onHand, lastMovementAt?, entryCount }>`
- `apps/reception/src/hooks/data/till/useTillShiftsData.ts` — returns `{ shifts, loading, error }`; shifts typed as `TillShift[]`
- `apps/reception/src/hooks/data/useCheckins.ts` — returns `{ checkins, loading, error }` keyed by date → occupant
- `apps/reception/src/lib/roles.ts` — `canAccess(user, Permissions.MANAGEMENT_ACCESS)` covers owner/developer/admin/manager
- `apps/reception/src/app/real-time-dashboard/` — existing dashboard pattern (PageShell + multi-section layout + auto-refresh 60s)

### Patterns & Conventions Observed

- Page structure: `page.tsx` (force-dynamic) → `Providers` → `PageContent` → `PageShell` (title + grid)
- Sidebar nav uses `canAccess` guard per section/item; "Admin" section contains Stock, Real Time Dashboard etc.
- All data fetching via Firebase RTDB hooks; hooks manage own loading/error states
- Italian UI text throughout

### Data & Contracts

- `InventoryLedgerEntry.type: "count"` — batch count entries; `quantity` is delta (positive or negative)
- `InventorySnapshot.onHand` — current on-hand per item; `lastMovementAt` — last count/movement
- `TillShift.closeDifference` — cash variance at close; `status: "open" | "closed"`; `varianceSignoffRequired`
- `CheckinData` keyed by date (YYYY-MM-DD) → occupant ID → `{ reservationCode, timestamp }`

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (`testIdAttribute: data-cy`)
- Commands: `pnpm --filter @apps/reception test`
- CI integration: yes (governed test runner via `pnpm -w run test:governed`)

#### Existing Test Coverage

| Area | Test Type | Notes |
|---|---|---|
| Inventory hooks | Unit | `hooks/data/__tests__/` — 20+ hook tests |
| Till shift hooks | Unit | `hooks/data/till/__tests__/` |
| StockManagement component | RTL component | 9 tests |
| BatchStockCount component | RTL component | 25 tests (just added) |

#### Testability Assessment

- Easy to test: read-only aggregate component; mock data hooks; assert summary card renders
- Test seams: `canAccess` mock for permission check; hook return value mocks

## Questions

### Resolved

- Q: Which permission should gate the manager audit page?
  - A: `Permissions.MANAGEMENT_ACCESS` — covers owner, developer, admin, and manager roles. This is appropriate for manager-visible operational data. The Admin nav section itself (`AppNav.tsx:91`) already uses `MANAGEMENT_ACCESS` as its section-level gate, so the manager audit page is consistent with the existing Admin section audience. Note: `REALTIME_DASHBOARD` is a separate, more restrictive constant (`["owner", "developer"]` only) — the manager audit should use `MANAGEMENT_ACCESS`, not `REALTIME_DASHBOARD`.
  - Evidence: `apps/reception/src/lib/roles.ts:54` — `MANAGEMENT_ACCESS: ["owner", "developer", "admin", "manager"]`; `apps/reception/src/components/appNav/AppNav.tsx:91` — Admin section permission

- Q: Where should the nav item appear?
  - A: Admin section of AppNav, alongside Real Time Dashboard and Stock. No new section needed.
  - Evidence: AppNav.tsx admin section structure

- Q: What shift data is most relevant for a manager audit?
  - A: Last 3 shifts: open/close time, closer name, `closeDifference`, `varianceSignoffRequired` status. This surfaces exceptions without duplicating the full ShiftHistory view.
  - Evidence: `apps/reception/src/hooks/data/till/useTillShiftsData.ts:17–23` — `UseTillShiftsDataParams.limitToLast?: number` (default 20); call `useTillShiftsData({ limitToLast: 3 })`. API confirmed from source — no scout task required.

- Q: What stock variance signal is most useful?
  - A: Recent "count" ledger entries (last 7 days) grouped by item, showing expected vs counted delta. `buildInventorySnapshot` provides `onHand` and `lastMovementAt`. Filter `entries` by `type === "count"` and `timestamp >= 7 days ago`.
  - Evidence: `useInventoryLedger` + `buildInventorySnapshot` utilities confirmed in reception source

- Q: What check-in signal is appropriate?
  - A: Today's check-in count (number of occupants checked in today). Simple count from `useCheckins` filtered to today's date key.
  - Evidence: `useCheckins` returns record keyed by date; today's key is `new Date().toISOString().split("T")[0]`

- Q: Is a new page route needed, or a new section within an existing page?
  - A: New page route `/manager-audit/` following the established app router pattern. Existing pages are each a route; there is no "single page with nav tabs" pattern to reuse.
  - Evidence: App router structure in `apps/reception/src/app/`

### Open (Operator Input Required)

None — all decisions are resolvable from evidence and business context.

## Confidence Inputs

- **Implementation:** 85%
  - All hooks confirmed reusable; `buildInventorySnapshot`, `useTillShiftsData`, `useCheckins` directly available. New page + nav item follows well-established pattern. `useTillShiftsData({ limitToLast: 3 })` API confirmed from source (`UseTillShiftsDataParams.limitToLast?: number`). No outstanding holds.
  - To raise to 90%: Confirm AppNav admin section can accept a new item without structural change (already confirmed — see Questions/Resolved).

- **Approach:** 85%
  - New route + read-only aggregate is the clearest path; no schema changes; no shared components modified. Pattern is proven (Real Time Dashboard).
  - To raise to 90%: Confirm AppNav admin section can accept a new item without structural change.

- **Impact:** 80%
  - Addresses the world-class gap directly. Three signals (stock variance, shift close, check-ins) in one view eliminates the multi-screen navigation problem. Capped at 80% pending operator use: if managers rarely use the admin section, discoverability suffers (nav item placement is the only entry point).

- **Delivery-Readiness:** 85%
  - No blocking open questions. Pattern is understood. Hooks are ready. Test landscape supports RTL component tests.

- **Testability:** 85%
  - Read-only aggregate component: straightforward to mock all hooks; assert summary cards render with correct values.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `useTillShiftsData` limit API different than assumed | **Resolved** | N/A | API confirmed: `UseTillShiftsDataParams.limitToLast?: number` — call `useTillShiftsData({ limitToLast: 3 })` |
| Manager audit page gets crowded if too many signals added | Low | Medium | Scope MVP to exactly 3 signal cards; block scope expansion |
| Today's check-in count is 0 on days with no check-ins (looks broken) | Medium | Low | Show "0 check-ins today" explicitly rather than hiding the card |
| Firebase RTDB offline: all three hooks show loading simultaneously | Low | Low | Show individual per-section loading states; offline banner via `.info/connected` |

## Suggested Task Seeds (Non-binding)

1. ~~INVESTIGATE: Confirm `useTillShiftsData` limit/filter API~~ — **Resolved**: API confirmed as `UseTillShiftsDataParams.limitToLast?: number`. Drop this task from the plan.
2. IMPLEMENT: New `ManagerAudit` page + route + AppNav item (M)
3. IMPLEMENT: Stock variance signal card — recent count deltas (S)
4. IMPLEMENT: Shift close summary cards — last 3 shifts (S)
5. IMPLEMENT: Check-in count card — today's total (S)
6. IMPLEMENT: Test suite for ManagerAudit component (S)

Tasks 3–5 can likely be folded into task 2 (single IMPLEMENT, M effort) since all data
comes from hooks called at the page level. Scout in task 1 gates task 2 confidence.

## Execution Routing Packet

- **Primary execution skill:** lp-do-build
- **Supporting skills:** none
- **Deliverable acceptance package:** New route `/manager-audit/` renders 3 summary cards; permission gate; AppNav item; typecheck + lint pass; RTL tests green.
- **Post-delivery measurement plan:** Operator confirms managers use the page as their first stop for daily review within 2 shifts.

## Evidence Gap Review

### Gaps Addressed

- `useTillShiftsData` limit parameter: **confirmed** — `UseTillShiftsDataParams.limitToLast?: number` (default 20); call `useTillShiftsData({ limitToLast: 3 })`. No scout task required.
- AppNav admin section structure: confirmed accepts new items by pattern (Real Time Dashboard nav item is existing example).
- Check-in data shape: confirmed keyed by date → occupant; today filter is straightforward.

### Confidence Adjustments

- No downward adjustments required. All key paths confirmed.

### Remaining Assumptions

- Managers navigate to the Admin section regularly — deployment dependency on operator onboarding.
- Managers navigate to the Admin section regularly — deployment dependency on operator onboarding.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| New page route `/manager-audit/` | Yes | None | No |
| AppNav nav item integration | Yes | None | No |
| `useInventoryLedger` + `buildInventorySnapshot` for stock signal | Yes | None | No |
| `useTillShiftsData` for shift close signal | Yes | None | No |
| `useCheckins` for today's count signal | Yes | None | No |
| Permission gate (MANAGEMENT_ACCESS) | Yes | None | No |
| Test patterns (RTL + hook mocks) | Yes | None | No |

## Planning Readiness

- **Status:** Ready-for-planning
- **Blocking items:** None
- **Recommended next step:** `/lp-do-plan reception-manager-audit --auto`
