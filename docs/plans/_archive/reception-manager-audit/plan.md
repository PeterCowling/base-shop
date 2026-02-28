---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-manager-audit
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Manager Audit Plan

## Summary

Builds a read-only `/manager-audit/` page in the reception app that aggregates three
operational signals into one view: stock count variance (last 7 days), last 3 shift close
summaries, and today's check-in count. The page is gated by `MANAGEMENT_ACCESS` (owner,
developer, admin, manager) and exposed via a new "Controllo" item in the Admin nav section.
All data comes from existing hooks; no hook modifications are required.

## Active tasks
- [x] TASK-01: New ManagerAudit page + AppNav item + 3 signal cards
- [x] TASK-02: RTL test suite for ManagerAuditContent

## Goals
- Single read-only view showing stock variance, shift close status, and check-in count
- Accessible to all MANAGEMENT_ACCESS roles
- Follows established page + nav pattern; no new abstractions needed

## Non-goals
- Replacing or duplicating StockManagement, ShiftHistory, or Check-in pages
- Real-time streaming refresh (static on-mount fetch is sufficient for MVP)
- Deep drill-down (links to existing pages serve that need)
- Any mutations on this page

## Constraints & Assumptions
- Constraints:
  - `force-dynamic` required (Firebase RTDB dependency)
  - Italian text for all new UI labels
  - Read-only: no mutations
  - Permission gate: `canAccess(user, Permissions.MANAGEMENT_ACCESS)`
- Assumptions:
  - `useTillShiftsData({ limitToLast: 3 })` — confirmed from source (`UseTillShiftsDataParams.limitToLast?: number`)
  - `useCheckins({ startAt: todayKey, endAt: todayKey })` — efficient today-only query using Firebase startAt/endAt on date-keyed node
  - All TillShift fields are optional (`?`) — null-safe access required in render

## Inherited Outcome Contract

- **Why:** World-class gap scan (BRIK/reception, 2026-02-28) identified manager audit
  visibility as a major gap — managers must navigate multiple screens to get an operational
  overview and have no unified exception surface.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A manager audit page is live in the reception app that
  shows stock count variance summary, last 3 shift close summaries, and today's check-in
  count in one read-only view, accessible to all users with MANAGEMENT_ACCESS.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/reception-manager-audit/fact-find.md`
- Key findings used:
  - `useTillShiftsData({ limitToLast: 3 })` confirmed from source
  - AppNav Admin section accepts new items (flat `items[]` array, section-level `MANAGEMENT_ACCESS` gate)
  - `Checkins` type: `Record<string, CheckinData> | null` keyed by date → occupant map
  - All TillShift fields optional — null-safe render required
  - `buildInventorySnapshot` pattern proven in BatchStockCount (just shipped)

## Proposed Approach
- Option A: New `/manager-audit/` route following `page.tsx → Providers → PageContent → PageShell` pattern, all 3 data hooks called at page level, one `ManagerAuditContent` component with 3 signal sections, AppNav Admin item added.
- Option B: Add new tab or section to existing Real Time Dashboard.
- Chosen approach: **Option A** — avoids coupling to an existing page; each page is a route per established pattern; Real Time Dashboard serves a different audience (owner/developer only at component level); new route is discoverable and independently navigable.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | ManagerAudit page + AppNav item + 3 signal cards | 85% | M | Complete (2026-02-28) | - | TASK-02 |
| TASK-02 | IMPLEMENT | RTL test suite for ManagerAuditContent | 85% | S | Complete (2026-02-28) | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Creates all new files; modifies AppNav |
| 2 | TASK-02 | TASK-01 complete | Tests TASK-01 output |

## Tasks

---

### TASK-01: New ManagerAudit page + AppNav item + 3 signal cards
- **Type:** IMPLEMENT
- **Deliverable:** New page route + component + AppNav entry in `apps/reception/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Build Evidence:**
  - Offload route: Codex exec (exit 0)
  - Affects files confirmed present: page.tsx (303 bytes), ManagerAuditContent.tsx (9190 bytes), AppNav.tsx (8005 bytes)
  - `pnpm --filter @apps/reception typecheck` — pass
  - `pnpm --filter @apps/reception lint` — pass (7 pre-existing warnings in unrelated files)
  - Committed: da88603fc7 (files swept into adjacent parallel commit; content correct)
- **Affects:**
  - `apps/reception/src/app/manager-audit/page.tsx` (new)
  - `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` (new)
  - `apps/reception/src/components/appNav/AppNav.tsx`
  - `[readonly] apps/reception/src/hooks/data/till/useTillShiftsData.ts`
  - `[readonly] apps/reception/src/hooks/data/inventory/useInventoryLedger.ts`
  - `[readonly] apps/reception/src/hooks/data/inventory/useInventoryItems.ts`
  - `[readonly] apps/reception/src/hooks/data/useCheckins.ts`
  - `[readonly] apps/reception/src/utils/inventoryLedger.ts`
  - `[readonly] apps/reception/src/lib/roles.ts`
  - `[readonly] apps/reception/src/app/real-time-dashboard/page.tsx`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% — All hooks verified from source. `useTillShiftsData.ts:17–23` confirms `limitToLast?: number`. `tillShiftData.ts` confirms all fields optional. `checkinData.ts` confirms `Checkins = Record<string, CheckinData> | null` (date-keyed). `buildInventorySnapshot` pattern confirmed in BatchStockCount. AppNav `navSections` Admin array is flat — adding item is one entry. `force-dynamic` + `Providers` wrapper pattern confirmed in `real-time-dashboard/page.tsx`.
  - Approach: 90% — New route + read-only aggregate is the proven pattern for admin pages. No shared components modified; no schema changes. RTD `page.tsx` is the direct template.
  - Impact: 85% — Page will render 3 cards correctly with live data. TillShift optional fields require null-safe access (confirmed in type). Only gap: `useCheckins({ startAt, endAt })` with date-keyed filtering not exercised in tests yet — low risk given type shape confirmed.
- **Acceptance:**
  - [ ] `/manager-audit/` route renders without error for MANAGEMENT_ACCESS user
  - [ ] Stock variance card shows items with count entries in last 7 days, with expected/counted/delta columns
  - [ ] Shift close card shows last 3 shifts with status, closedAt, closedBy, closeDifference, varianceSignoffRequired
  - [ ] Check-in card shows today's check-in count (0 if none — card never hidden)
  - [ ] AppNav Admin section shows "Controllo" item for MANAGEMENT_ACCESS user
  - [ ] Page returns `null` for users without MANAGEMENT_ACCESS
  - [ ] `pnpm --filter @apps/reception typecheck` and `pnpm --filter @apps/reception lint` pass
- **Validation contract (TC-01 – TC-05):**
  - TC-01: MANAGEMENT_ACCESS user navigates to `/manager-audit/` → page renders with 3 section headings visible
  - TC-02: User without MANAGEMENT_ACCESS → page renders null (no content visible)
  - TC-03: `useTillShiftsData` called with `{ limitToLast: 3 }` → shift section shows at most 3 rows
  - TC-04: `useCheckins` called with `{ startAt: todayKey, endAt: todayKey }` → count card shows today's occupant count
  - TC-05: All hooks in loading state → each section shows its own loading indicator independently
- **Execution plan:**
  - **Red:** Write `ManagerAuditContent.tsx` shell importing all 3 hooks; render nothing; confirm typecheck passes (no content rendered yet — page is valid but empty)
  - **Green:** Implement permission gate (`canAccess`), stock variance section (filter raw `entries` by `type === "count"` and `timestamp >= 7 days ago` — each `entry.quantity` is already the delta; use `itemsById` to look up item names; `buildInventorySnapshot` provides current `onHand` for context header only), shift close section (last 3 shifts from `useTillShiftsData({ limitToLast: 3 })`, null-safe field access for all optional `TillShift` fields), check-in count section (`useCheckins({ startAt: todayKey, endAt: todayKey })` → `Object.keys(checkins?.[todayKey] ?? {}).length`). Add `page.tsx` with `force-dynamic`. Add AppNav item. Confirm TC-01 through TC-05 pass via RTL in TASK-02.
  - **Refactor:** Extract helper functions for delta computation if > 5 lines. Verify Italian labels throughout. Run typecheck + lint clean.
- **Planning validation (required for M/L):**
  - Checks run:
    - `useTillShiftsData.ts:17–23` — `UseTillShiftsDataParams.limitToLast?: number` ✓
    - `tillShiftData.ts:1–22` — all fields optional; `closeDifference?: number`, `closedAt?: string`, `closedBy?: string`, `varianceSignoffRequired?: boolean` ✓
    - `checkinData.ts:38` — `Checkins = Record<string, CheckinData> | null` (date-keyed) ✓
    - `AppNav.tsx:90–107` — Admin section `items[]` flat array, `permission: Permissions.MANAGEMENT_ACCESS` ✓
    - `real-time-dashboard/page.tsx:1–13` — `force-dynamic` + `Providers` wrapper pattern ✓
    - `roles.ts:54` — `MANAGEMENT_ACCESS: ["owner", "developer", "admin", "manager"]` ✓
  - Validation artifacts: Source reads confirmed above
  - Unexpected findings:
    - `useCheckins` accepts `startAt`/`endAt` params — enables efficient today-only query instead of loading all history. Use `useCheckins({ startAt: todayKey, endAt: todayKey })`.
    - All TillShift fields are optional — null-safe rendering required (e.g. `shift.closedBy ?? "—"`).
- **Consumer tracing:**
  - New route `/manager-audit/` → consumed by: AppNav nav item (same task), Next.js router
  - New `ManagerAuditContent` → consumed by: `page.tsx` (same task)
  - AppNav `navSections` modification → consumed by: AppNav rendering (same file, no external consumers)
  - No existing function signatures modified. All hooks called with params; no mutations.
- **Scouts:** None needed — all APIs confirmed from source.
- **Edge Cases & Hardening:**
  - Empty shifts array (no shifts ever) → section shows "Nessun turno registrato" placeholder
  - All shifts `status: "open"` (no closed shifts in last 3) → render status as "Aperto" with no closeDifference
  - `closeDifference === 0` → show "0" not "—"; `closeDifference` undefined → show "—"
  - Today checkin count = 0 → show "0 check-in oggi" (never hide the card)
  - No inventory count entries in last 7 days → show "Nessuna variazione negli ultimi 7 giorni"
  - Firebase offline: per-section loading states; each section independently shows loading/error
- **What would make this >=90%:**
  - Verify `buildInventorySnapshot` handles empty entries without throwing (low risk — proven in BatchStockCount)
  - Exercise `useCheckins({ startAt, endAt })` with real date filter in integration test
- **Rollout / rollback:**
  - Rollout: merge to dev; no feature flag needed (permission gate is the access control)
  - Rollback: revert AppNav item + delete new files; no DB changes, no migrations
- **Documentation impact:** None: internal tool page; no user-facing docs updated
- **Notes / references:**
  - AppNav icon: use `ClipboardCheck` from lucide-react (already imported would need adding) or `BarChart3` if a different icon is chosen; Lucide import added in AppNav.tsx at top of icon list
  - Italian labels: section headings "Variazione Stock", "Ultimi Turni", "Check-in Oggi"; page title "Controllo Manager"; AppNav item "Controllo"
  - `buildInventorySnapshot` returns `Record<string, { onHand, lastMovementAt?, entryCount }>`; delta = `entry.quantity` (already a delta from batch count)

---

### TASK-02: RTL test suite for ManagerAuditContent
- **Type:** IMPLEMENT
- **Deliverable:** New test file `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Build Evidence:**
  - Offload route: Codex exec (exit 0)
  - Test file created: `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx` (181 lines, 7 tests)
  - Governed runner: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=ManagerAuditContent --no-coverage` → 7/7 passing
  - All 5 TCs covered: TC-01 (3 section headings), TC-02 (null for non-MANAGEMENT_ACCESS), TC-03 (useTillShiftsData called with `{limitToLast:3}`), TC-04 (useCheckins called with today's startAt/endAt), TC-05 (loading indicators)
  - Regression: BatchStockCount tests unaffected (separate test file, no shared mocks)
  - Pre-commit hooks pass (typecheck + lint clean for reception scope)
  - Committed atomically via writer lock: `bash scripts/agents/with-writer-lock.sh -- bash -c "git add ... && git commit -m ..."`
- **Affects:**
  - `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx` (new)
  - `[readonly] apps/reception/src/components/managerAudit/ManagerAuditContent.tsx`
  - `[readonly] apps/reception/src/components/appNav/AppNav.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — Mock patterns fully established from BatchStockCount tests (hoisted var pattern, Firebase mock, canAccess mock). All 3 hooks follow same pattern (hoisted var + mockReturnValue). `renderHook` not needed here (no hooks to test independently). RTL render + userEvent not needed (read-only component).
  - Approach: 90% — Direct RTL render + mock injection. Same file structure as `BatchStockCount.test.tsx`.
  - Impact: 85% — Tests confirm all 5 TCs pass. No mutation paths to test (read-only page). Only gap: integration with real Firebase not exercised (unit mock boundary is correct approach here).
- **Acceptance:**
  - [ ] All tests pass: `pnpm --filter @apps/reception test -- --testPathPattern=ManagerAuditContent --no-coverage`
  - [ ] Existing tests unaffected: `pnpm --filter @apps/reception test -- --testPathPattern=BatchStockCount --no-coverage`
  - [ ] TC-01 through TC-05 from TASK-01 covered by named test cases
  - [ ] Zero skips, zero todos
- **Validation contract (TC-01 – TC-05):** Inherited from TASK-01 — same TC numbers map directly to test cases.
- **Execution plan:**
  - **Red → Green → Refactor** (S task — execute directly):
    - Mock setup: `useInventoryItemsMock`, `useInventoryLedgerMock`, `useTillShiftsDataMock`, `useCheckinsMock`, `canAccess` (roles mock), Firebase database mock (same pattern as BatchStockCount)
    - `beforeEach`: default mocks (items=[], entries=[], shifts=[], checkins=null, loading=false, error=null)
    - Tests: permission gate (null for non-MANAGEMENT_ACCESS), 3 section headings visible for MANAGEMENT_ACCESS user, loading state per section, shift null-safe render (optional fields), check-in count 0 shown explicitly, stock variance with count entries shows delta row
- **Planning validation (required for M/L):** None: S effort — exempt.
- **Scouts:** None: mock patterns confirmed from BatchStockCount tests.
- **Edge Cases & Hardening:**
  - Shift with no `closedAt` / no `closedBy` → "—" placeholder rendered
  - Zero check-in count → count label visible with "0"
  - Empty inventory → placeholder text rendered
- **What would make this >=90%:**
  - Add snapshot test for visual regression (low priority for MVP)
- **Rollout / rollback:** None: test-only task
- **Documentation impact:** None: test-only task, no docs affected
- **Notes / references:**
  - testIdAttribute: `data-cy` (configured in jest.setup.ts)
  - Mock import pattern: hoisted var with `jest.mock(path, () => { mockVar = jest.fn(); return { default: mockVar } })`
  - `canAccess` mock: `jest.mock("../../lib/roles", () => ({ canAccess: jest.fn(() => true), Permissions: { MANAGEMENT_ACCESS: ["owner"] } }))`

---

## Risks & Mitigations
- `useCheckins` startAt/endAt date-key filter may not limit correctly if Firebase node ordering differs: Low likelihood — `orderByKey()` is default, YYYY-MM-DD keys sort lexicographically; mitigation: fallback to `Object.entries(checkins ?? {}).filter(([k]) => k === today)` in component if needed
- Manager audit page crowded if scope expands: Low — Scope blocked at exactly 3 signal cards by Non-goals
- Today check-in count = 0 looks broken: Medium — mitigated by always showing the card with "0 check-in oggi" explicitly
- Firebase RTDB offline: Low — per-section independent loading states; no single-point failure

## Observability
- Logging: None: read-only page; no writes to log
- Metrics: None: page views tracked via existing GA4 if configured for reception app
- Alerts/Dashboards: None: internal ops tool

## Acceptance Criteria (overall)
- [ ] `/manager-audit/` route live in reception app
- [ ] 3 signal cards render with real data for MANAGEMENT_ACCESS users
- [ ] AppNav Admin section shows "Controllo" item linking to `/manager-audit`
- [ ] TASK-02 test suite passes with zero failures and zero skips
- [ ] `pnpm --filter @apps/reception typecheck` and `pnpm --filter @apps/reception lint` clean

## Decision Log
- 2026-02-28: Chose `useCheckins({ startAt: todayKey, endAt: todayKey })` over full-fetch + filter — avoids loading all historical check-in data; Firebase date-key ordering confirmed
- 2026-02-28: Page uses `MANAGEMENT_ACCESS` directly (not `REALTIME_DASHBOARD`) — wider audience is correct for an operational audit view; Admin section already uses this gate
- 2026-02-28: INVESTIGATE task for useTillShiftsData limit API dropped — API confirmed from source in fact-find critique round

## Overall-confidence Calculation
- TASK-01: 85% × 2 (M) = 170
- TASK-02: 85% × 1 (S) = 85
- Overall = 255 / 3 = **85%**

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: ManagerAudit page + AppNav item + 3 signal cards | Yes — all hooks confirmed, pattern verified | None | No |
| TASK-02: RTL test suite | Yes — TASK-01 must be complete (file exists to import) | None | No |
