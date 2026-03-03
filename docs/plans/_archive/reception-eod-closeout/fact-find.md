---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Operations
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: reception-eod-closeout
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-eod-closeout/plan.md
Trigger-Why: World-class scan (BRIK/reception, 2026-02-28) identified EOD close-out unification as a gap. Till, safe, and stock close-out are uncoordinated with no guided sequence or confirmation artefact.
Trigger-Intended-Outcome: type: operational | statement: A unified EOD close-out checklist page is live in the reception app that shows till, safe, and stock close-out status for today in one view, accessible to users with MANAGEMENT_ACCESS. | source: auto
---

# Reception EOD Close-Out Checklist Fact-Find Brief

## Scope
### Summary
Add a `/eod-checklist/` page to the reception app that aggregates three existing signals into a single read-only close-out status view: (1) whether today's till shift is closed, (2) whether a safe reconcile was recorded today, and (3) whether a stock count was logged today. All three signals are already queryable from existing Firebase hooks — no new data infrastructure is required.

### Goals
- Single page confirming till, safe, and stock close-out status for the current day
- Read-only; each status card links to the relevant existing page for action
- Gated to `MANAGEMENT_ACCESS` (manager, admin, owner, developer)
- Added to Admin nav section alongside "Controllo"

### Non-goals
- Not a wizard that steps through close-out actions (actions happen in existing pages)
- Not a historical report (today only)
- No new Firebase data writes
- No changes to CloseShiftForm, SafeManagement, or StockManagement pages

### Constraints & Assumptions
- Constraints:
  - Must use existing hooks only; no new Firebase paths
  - Must follow `force-dynamic + Providers + PageContent` pattern
  - RTL test coverage required (pattern established by ManagerAuditContent)
- Assumptions:
  - A `useTillShiftsData({ limitToLast: 10 })` scan for any `status === "open"` shift is a reliable enough proxy for "till not closed today" — this handles shifts opened yesterday and still open, which `useTillShiftsRange` with today's date would miss
  - Safe reconcile check: `useSafeCountsData` range query by `timestamp` for today, filter `type === "safeReconcile" || type === "reconcile"` — either type counts
  - Stock count check: `useInventoryLedger()` (all entries), filter `type === "count"` + today's date client-side — inventory ledger size is manageable for in-memory filtering

## Outcome Contract

- **Why:** World-class gap scan identified manager audit visibility gap — end-of-day close-out is uncoordinated with no single confirmation view.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A unified EOD close-out checklist page is live in the reception app that shows till, safe, and stock close-out status for today in one view, accessible to users with MANAGEMENT_ACCESS.
- **Source:** auto

## Access Declarations

- Firebase `/tillShifts` — direct hook `useTillShiftsData` (pre-configured, confirmed active)
- Firebase `/safeCounts` — direct hook `useSafeCountsData` (pre-configured, confirmed active)
- Firebase `/inventory/ledger` — direct hook `useInventoryLedger` (pre-configured, confirmed active)

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/src/components/reports/EndOfDayPacket.tsx` — existing EOD reporting tool (804 lines); print/view report for a selected date, not a guided close-out wizard. Confirms the gap: no checklist behaviour exists.
- `apps/reception/src/app/end-of-day/page.tsx` — simple page wrapper: `force-dynamic + Providers + EndOfDayPacket`. Pattern to replicate for new page.
- `apps/reception/src/components/appNav/AppNav.tsx` — nav structure; Admin section uses `Permissions.MANAGEMENT_ACCESS`. "Controllo" → `/manager-audit/` already added.

### Key Modules / Files
- `apps/reception/src/hooks/data/till/useTillShiftsData.ts` — `{ limitToLast?: number }`, queries `/tillShifts` ordered by `openedAt`. Returns `{ shifts: TillShift[], loading, error }`. Default last 20.
- `apps/reception/src/hooks/data/till/useTillShiftsRange.ts` — queries `/tillShifts` with date range (`startAt`/`endAt`) and `orderByChild`. Returns `{ shifts: TillShift[], loading, error }`. Direct Firebase, no context provider required.
- `apps/reception/src/hooks/data/inventory/useInventoryLedger.ts` — queries all `/inventory/ledger` entries. Returns `{ entries: InventoryLedgerEntry[], loading, error }`. No date filter param; filtering is client-side.
- `apps/reception/src/hooks/data/useSafeCountsData.ts` — queries `/safeCounts` with optional `orderByChild` + `startAt`/`endAt`. Returns `{ safeCounts: SafeCount[], loading, error }`.
- `apps/reception/src/schemas/safeCountSchema.ts` — `SafeCount.type` enum: `"deposit" | "withdrawal" | "pettyWithdrawal" | "exchange" | "bankDeposit" | "bankWithdrawal" | "opening" | "safeReset" | "reconcile" | "safeReconcile"`.
- `apps/reception/src/types/hooks/data/inventoryLedgerData.ts` — `InventoryLedgerEntry.type` includes `"count"`. Confirmed.
- `apps/reception/src/types/hooks/data/tillShiftData.ts` — `TillShift.status?: "open" | "closed"`. Confirmed.
- `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` — direct predecessor; same hook composition pattern, same permission gate, same section/table layout. Blueprint for implementation.
- `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx` — 7-test RTL suite (permission gate, loading, hook params, section headings). Pattern to follow.

### Patterns & Conventions Observed
- Page pattern: `export const dynamic = "force-dynamic"` + default `Providers` wrapper + named `Content` component — evidence: `apps/reception/src/app/end-of-day/page.tsx`, `apps/reception/src/app/manager-audit/page.tsx`
- Permission gate pattern: `canAccess(user, Permissions.MANAGEMENT_ACCESS)` → return null if no access — evidence: `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx:62-113`
- RTL test pattern: mock hooks via `jest.mock`, render `<AuthContext.Provider>`, assert permission gate + loading + content — evidence: `ManagerAuditContent.test.tsx`
- `testIdAttribute: "data-cy"` configured in `jest.setup.ts` — use `data-cy` attributes in tests
- Admin nav entry pattern: add `{ label, route, icon }` to `navSections[3].items` (Admin section) — evidence: `apps/reception/src/components/appNav/AppNav.tsx:91-108`

### Data & Contracts
- Types/schemas/events:
  - `TillShift.status?: "open" | "closed"` — `closedAt?: string` (undefined = open)
  - `InventoryLedgerEntry.type: "count"` — timestamp as ISO string
  - `SafeCount.type: "safeReconcile" | "reconcile"` — both are valid EOD safe confirmation entries; `timestamp: string`
- Persistence:
  - All three signals read from Firebase Realtime Database (live subscription via `onValue`)
  - No writes required
- API/contracts:
  - `useTillShiftsData({ limitToLast: 10 })` → check if any entry has `status === "open"` or `!closedAt`. Note: `status` is optional — if both `status` and `closedAt` are absent on a partially-written record, this produces a false "till open" signal. Acceptable for MVP given the narrow race window in normal operation; use `status !== "closed"` as primary check and `!closedAt` as fallback.
  - `useInventoryLedger()` → filter: `entry.type === "count"` AND `toTimestampMs(entry.timestamp) >= startOfToday()`
  - `useSafeCountsData({ orderByChild: "timestamp", startAt: startOfTodayIso, endAt: endOfTodayIso })` → filter: `type === "safeReconcile" || type === "reconcile"`

### Dependency & Impact Map
- Upstream dependencies:
  - All three hooks exist and are confirmed working in production (used by ManagerAuditContent and EndOfDayPacket)
  - `AuthContext.useAuth()` + `canAccess` + `Permissions.MANAGEMENT_ACCESS` confirmed available
- Downstream dependents:
  - None — new page, no existing components consume it
- Likely blast radius:
  - Minimal: new page + new component + nav entry. No changes to existing hooks, types, or pages.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest + React Testing Library; `configure({ testIdAttribute: "data-cy" })`
- Commands: `pnpm --filter @apps/reception test --testPathPattern=EodChecklistContent`; governed runner: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs`
- CI integration: governed Jest runner in reusable-app.yml

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| ManagerAuditContent | RTL | `src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx` | 7 tests; pattern identical to planned EodChecklistContent coverage |
| useSafeCountsData | None identified | — | Hook tested indirectly via component tests |
| useTillShiftsData | None identified | — | Hook tested indirectly via component tests |
| AppNav | None identified | — | Nav items not RTL tested; nav entry change is low-risk |

#### Coverage Gaps
- Untested paths: `useTillShiftsRange` has no dedicated unit test
- Extinct tests: none relevant

#### Testability Assessment
- Easy to test: `EodChecklistContent` — all three hooks can be mocked with `jest.mock`; permission gate, loading, and status states are straightforward to exercise
- Hard to test: date-sensitive logic (startOfToday) — use `jest.setSystemTime` or pass today as prop
- Test seams needed: extract `startOfDayIso` / `endOfDayIso` as pure utilities so they can be mocked cleanly in tests

#### Recommended Test Approach
- Unit tests for: `EodChecklistContent` — 7 cases: (1) no access → null, (2) loading state, (3) all three complete, (4) till open, (5) no stock count, (6) no safe reconcile, (7) mixed
- Integration tests for: not required (hooks use Firebase, covered by existing Firebase test infrastructure)
- E2E tests for: not in scope for MVP
- Contract tests for: not required

## Questions

### Resolved
- Q: Should the safe reconcile check accept `type === "reconcile"` in addition to `"safeReconcile"`?
  - A: Yes. The schema includes both. `"reconcile"` appears to be an older type; both represent a safe balance confirmation. The EOD checklist should accept either.
  - Evidence: `apps/reception/src/schemas/safeCountSchema.ts:13-24`

- Q: Should the till check use `useTillShiftsRange` (date range) or `useTillShiftsData` (limitToLast)?
  - A: `useTillShiftsData({ limitToLast: 10 })` is more reliable. A `useTillShiftsRange` with today's `openedAt` range would miss shifts opened yesterday that remain open. For EOD purposes, "is any recent shift still open?" is the correct question.
  - Evidence: `useTillShiftsRange.ts` — `orderByChild("openedAt")` + date range only returns shifts with `openedAt` in range, missing cross-midnight open shifts.

- Q: What icon should be used for the nav entry?
  - A: `ClipboardCheck` (same as "Controllo") or `CheckSquare` from lucide-react. `ClipboardCheck` is already imported in `AppNav.tsx` (line 16 — confirmed). Use `ListChecks` to differentiate from "Controllo". `ListChecks` is available from lucide-react.
  - Evidence: `apps/reception/src/components/appNav/AppNav.tsx:1-35`

- Q: What Italian label should be used for the nav item?
  - A: "Chiusura" (close-out/closing) — short, fits nav width, unambiguous in context.
  - Evidence: Business context; Italian UI convention in this app.

- Q: Should the page live in the Admin section or "Till & Safe" section of the nav?
  - A: Admin section — gated to MANAGEMENT_ACCESS, consistent with "Controllo". "End of Day" in Till & Safe is TILL_ACCESS only.
  - Evidence: `apps/reception/src/components/appNav/AppNav.tsx:69-79` (Till & Safe has TILL_ACCESS gate); Admin section has MANAGEMENT_ACCESS gate.

### Open (Operator Input Required)
- None. All decisions are resolvable by reasoning about codebase, hooks, and business context.

## Confidence Inputs
- Implementation: 92% — all hooks confirmed, types confirmed, pattern established by ManagerAuditContent. `ListChecks` confirmed available in lucide-react v0.540.0. Date utility helpers (`startOfDayIso`, `toTimestampMs`) need to be created in TASK-01 scope (trivial, ~10 lines).
- Approach: 88% — the `useTillShiftsData` approach for till status is a practical simplification (checks last 10 shifts, not strictly "today's shifts"). For MVP this is sufficient. Could later be refined with date filtering.
- Impact: 82% — operational utility is high; manager gets one confirmation view. "Live" evidence not possible at planning stage.
- Delivery-Readiness: 92% — no blockers. All patterns established. Codex offload eligible.
- Testability: 93% — RTL pattern established by previous build; mock strategy is identical.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `ListChecks` icon not in installed lucide-react version | Confirmed available: lucide-react v0.540.0 d.ts shows 5 occurrences — not a risk | None | N/A |
| `useTillShiftsData` returns a shift opened >10 ago that's still open | Very Low | Low | Last 10 is generous for a single-hostel operation; shift carryover from prior days is an operational anomaly |
| Inventory ledger is large and client-side filtering is slow | Very Low | Low | Reception app is internal; ledger size expected in hundreds, not millions |
| `safeReconcile` vs `reconcile` type confusion | Low | Medium | Both accepted in EOD check; documented in fact-find |
| Timezone mismatch in ISO string date filtering | Low | Medium — safe/stock entries from today may be excluded if UTC vs local time boundary differs | Verify timezone convention for `/safeCounts` and `/inventory/ledger` timestamp fields before writing TASK-01 date filter logic |

## Planning Constraints & Notes
- Must-follow patterns:
  - `export const dynamic = "force-dynamic"` on page.tsx
  - `<Providers>` wrapper (standard app providers, no special till/safe providers needed)
  - `canAccess(user, Permissions.MANAGEMENT_ACCESS)` gate returning null
  - Component in `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx`
  - Tests in `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx`
  - Nav entry in Admin section of `navSections` array
- Rollout/rollback expectations:
  - Rollback: remove nav entry + delete page files. No data side effects.
- Observability expectations:
  - No new analytics required for MVP. Page is internal operations tooling.

## Suggested Task Seeds (Non-binding)
- TASK-01: Build `EodChecklistContent` component + RTL tests (S effort, IMPLEMENT)
  - Affects: `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx`, `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx`
  - Note: Must create `startOfDayIso`, `endOfDayIso`, and `toTimestampMs` date helpers — these are not confirmed as shared utilities in the codebase. `toTimestampMs` is currently defined inline in `ManagerAuditContent.tsx` and should be extracted rather than duplicated. Likely file: `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` inline, or a shared `apps/reception/src/utils/dateUtils.ts` if it doesn't exist.
- TASK-02: Add `/eod-checklist/` page route (XS effort, IMPLEMENT)
  - Affects: `apps/reception/src/app/eod-checklist/page.tsx`
  - Depends on: TASK-01
- TASK-03: Add nav entry to Admin section in AppNav (XS effort, IMPLEMENT)
  - Affects: `apps/reception/src/components/appNav/AppNav.tsx`
  - Depends on: TASK-02
  - Note: Must add `ListChecks` to the lucide-react import block (line ~1-35 in AppNav.tsx). `ListChecks` is confirmed available in v0.540.0.

## Execution Routing Packet
- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `EodChecklistContent.tsx` renders 3 status cards (till, safe, stock) using confirmed hooks
  - Permission gate: returns null for users without MANAGEMENT_ACCESS
  - `/eod-checklist/` page route exists with `force-dynamic + Providers + EodChecklistContent`
  - Nav entry "Chiusura" in Admin section points to `/eod-checklist`
  - RTL tests: ≥7 passing; reception typecheck + lint pass
- Post-delivery measurement plan: No automated measurement for internal ops page. Operator confirms page renders correctly in staging.

## Evidence Gap Review

### Gaps Addressed
- Till status hook: `useTillShiftsData` confirmed; `status: "open" | "closed"` field confirmed in `tillShiftData.ts`
- Safe status hook: `useSafeCountsData` confirmed; `"safeReconcile"` and `"reconcile"` type values confirmed in `safeCountSchema.ts`
- Stock count hook: `useInventoryLedger` confirmed; `type: "count"` entry type confirmed in `inventoryLedgerData.ts`
- Page pattern: confirmed by reading `end-of-day/page.tsx` and `manager-audit/page.tsx`
- Permission gate pattern: confirmed from `ManagerAuditContent.tsx`
- Nav entry pattern: confirmed from `AppNav.tsx` Admin section

### Confidence Adjustments
- All three hook paths confirmed from source — no adjustments downward required
- Implementation confidence raised from initial ~80% to 92% after confirming all three hook signatures and type enums

### Remaining Assumptions
- `ListChecks` icon is available in the installed lucide-react version (mitigated: `ClipboardCheck` fallback)
- `useTillShiftsData({ limitToLast: 10 })` is sufficient for detecting open shifts (accepted for MVP)

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Till status detection | Yes | None | No |
| Safe status detection | Yes | None | No |
| Stock count detection | Yes | None | No |
| Permission gate | Yes | None | No |
| Page pattern (force-dynamic + Providers) | Yes | None | No |
| Nav entry (Admin section) | Yes | None | No |
| Hook provider dependency | Yes | None — all three hooks are direct Firebase hooks, no special providers required | No |
| RTL test pattern | Yes | None — ManagerAuditContent.test.tsx is a complete blueprint | No |
| Date edge case (cross-midnight open shift) | Partial | [Advisory Minor]: `useTillShiftsRange` with today's openedAt range would miss shifts opened yesterday and still open. Resolved by using `useTillShiftsData({ limitToLast: 10 })` instead. | No |

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan reception-eod-closeout --auto`
