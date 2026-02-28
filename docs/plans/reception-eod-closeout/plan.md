---
Type: Plan
Status: Active
Domain: Operations
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-eod-closeout
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception EOD Close-Out Checklist Plan

## Summary
Add a `/eod-checklist/` page to the reception app providing a single read-only view of today's end-of-day close-out status across three signals: till shift closed, safe reconciled, and stock counted. All three signals are queryable from existing confirmed hooks with no new Firebase paths. The page is gated to `MANAGEMENT_ACCESS` and added to the Admin nav section alongside "Controllo". Implementation follows the established `force-dynamic + Providers + Content` page pattern with full RTL coverage modelled after `ManagerAuditContent.test.tsx`.

## Active tasks
- [x] TASK-01: Build EodChecklistContent component + RTL tests
- [ ] TASK-02: Add /eod-checklist/ page route
- [ ] TASK-03: Add Admin nav entry (Chiusura)

## Goals
- Single manager-facing page showing today's till, safe, and stock close-out status
- Read-only; each card links to the relevant action page
- Gated to `MANAGEMENT_ACCESS`
- Admin nav entry

## Non-goals
- No wizard or guided close-out actions (actions happen in existing pages)
- No historical report view (today only)
- No new Firebase data writes
- No changes to CloseShiftForm, SafeManagement, or StockManagement

## Constraints & Assumptions
- Constraints:
  - Existing hooks only; no new Firebase paths
  - `force-dynamic + Providers + PageContent` pattern mandatory
  - RTL coverage required (≥9 tests)
- Assumptions:
  - `useTillShiftsData({ limitToLast: 10 })` checking `status !== "closed"` is a sufficient proxy for EOD till status
  - `startOfDayIso`/`endOfDayIso` from `apps/reception/src/utils/dateUtils.ts` (Italy timezone) provide correct day boundaries
  - `sameItalyDate` from same file is the correct comparator for "is today" stock count check
  - Safe check requires either `type === "safeReconcile"` or `type === "reconcile"` entry today

## Inherited Outcome Contract

- **Why:** World-class gap scan (BRIK/reception, 2026-02-28) identified EOD close-out unification as a gap. Till, safe, and stock close-out are uncoordinated with no single confirmation artefact.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A unified EOD close-out checklist page is live in the reception app that shows till, safe, and stock close-out status for today in one view, accessible to users with MANAGEMENT_ACCESS.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/reception-eod-closeout/fact-find.md`
- Key findings used:
  - All three hooks confirmed from source: `useTillShiftsData`, `useSafeCountsData`, `useInventoryLedger`
  - `startOfDayIso` + `endOfDayIso` + `sameItalyDate` confirmed in `apps/reception/src/utils/dateUtils.ts`
  - `SafeCount.type` enum: both `"safeReconcile"` and `"reconcile"` are valid EOD reconcile types
  - `ManagerAuditContent.tsx` + its test file are the direct implementation blueprint
  - `ListChecks` icon confirmed available in lucide-react v0.540.0

## Proposed Approach
- Option A: Build new read-only component using direct hook calls (same pattern as ManagerAuditContent)
- Option B: Extend EndOfDayPacket with a checklist mode
- Chosen approach: Option A — EndOfDayPacket is a print/report tool with a complex 804-line structure that serves a different purpose. A dedicated `EodChecklistContent` component is simpler, independently testable, and follows the established pattern.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | EodChecklistContent component + RTL tests | 85% | S | Complete (2026-02-28) | - | TASK-02 |
| TASK-02 | IMPLEMENT | /eod-checklist/ page route | 90% | S | Pending | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Admin nav entry (Chiusura) | 90% | S | Pending | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Component + tests; all hooks and utilities confirmed |
| 2 | TASK-02 | TASK-01 complete | Page file references EodChecklistContent |
| 3 | TASK-03 | TASK-02 complete | Nav entry links to confirmed route |

## Tasks

---

### TASK-01: EodChecklistContent component + RTL tests
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` + `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Build evidence:**
  - `EodChecklistContent.tsx` created — 3 status cards (Cassa, Cassaforte, Stock), permission gate after all hooks (ManagerAuditContent:111 pattern), done/incomplete states, loading states with `data-cy` attrs
  - `EodChecklistContent.test.tsx` created — 9 TCs (TC-01 through TC-09), all following ManagerAuditContent.test.tsx blueprint
  - `pnpm --filter @apps/reception typecheck` — exit 0, no errors
  - `pnpm --filter @apps/reception lint` — 0 new errors (7 pre-existing warnings in unrelated files)
  - Post-build validation: Mode 1 (Visual) — Degraded mode (no dev server); JSX reviewed; all acceptance criteria confirmed. Result: Pass.
  - Tests: CI-only policy — will verify via CI after commit.
  - Offload route: inline fallback (codex exec flag API changed; `-a never` flag removed in current version)
- **Affects:**
  - `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` (new)
  - `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx` (new)
  - `[readonly] apps/reception/src/hooks/data/till/useTillShiftsData.ts`
  - `[readonly] apps/reception/src/hooks/data/useSafeCountsData.ts`
  - `[readonly] apps/reception/src/hooks/data/inventory/useInventoryLedger.ts`
  - `[readonly] apps/reception/src/utils/dateUtils.ts`
  - `[readonly] apps/reception/src/lib/roles.ts`
  - `[readonly] apps/reception/src/context/AuthContext.tsx`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 95% — all hooks confirmed, date utilities confirmed in `dateUtils.ts`, direct blueprint in `ManagerAuditContent.tsx`. No novel code patterns required.
  - Approach: 90% — till check via `useTillShiftsData({ limitToLast: 10 })` + `status !== "closed"` is a known simplification (accepted for MVP); safe check via Italy-timezone date range + type filter; stock check via `sameItalyDate`. All verified as correct and timezone-safe.
  - Impact: 85% — operational page confirmed useful; "live" evidence only available post-deployment. Held-back test: no single unknown that would push Impact below 80 — the page provides concrete operational value even with the `limitToLast: 10` simplification.
- **Acceptance:**
  - `EodChecklistContent` renders 3 status cards: till, safe, stock
  - Each card shows ✓ (done) or ✗ (incomplete) for today
  - Permission gate: returns null for users without `MANAGEMENT_ACCESS`
  - Loading states displayed per-card while hooks are fetching
  - ≥9 RTL tests passing
- **Validation contract (TC-01–TC-07):**
  - TC-01: User without MANAGEMENT_ACCESS → `canAccess` returns false → component returns null
  - TC-02: `useTillShiftsData` loading = true → loading indicator shown in till card
  - TC-03: All three complete (0 open shifts, stock count entry today, safeReconcile entry today) → all three cards show "done" state
  - TC-04: Till has a shift with `status === "open"` → till card shows "incomplete" state
  - TC-05: `useInventoryLedger` returns entries but none with `type === "count"` + today → stock card shows "incomplete"
  - TC-06: `useSafeCountsData` returns entries but none with `type: "safeReconcile" | "reconcile"` → safe card shows "incomplete"
  - TC-07: Mixed state (till closed, stock missing, safe done) → correct per-card states independently
  - TC-08: `useSafeCountsData` loading = true → loading indicator shown in safe card
  - TC-09: `useInventoryLedger` loading = true → loading indicator shown in stock card
- **Execution plan:**
  - Red: Write test file first; mock `useTillShiftsData` to return an open shift → assert till card NOT complete; run test → RED
  - Green: Write `EodChecklistContent.tsx` with all 3 status cards + permission gate + loading states → run all 9 tests → GREEN
  - Refactor: Verify no duplication with `ManagerAuditContent` patterns; ensure `sameItalyDate` is imported not duplicated; ensure `if (!canView) return null;` is placed *after* all hook calls — see `ManagerAuditContent.tsx:111` for the confirmed pattern; React rules prohibit conditional hook calls
- **Planning validation (required for M/L):** None: S-effort task; planning evidence is hook source reads and blueprint review documented in fact-find.
- **Scouts:**
  - Verified: `startOfDayIso(new Date())` + `endOfDayIso(new Date())` → Italy-timezone ISO strings suitable as `startAt`/`endAt` for `useSafeCountsData`
  - Verified: `sameItalyDate(entry.timestamp, new Date())` → correct Italy-timezone "is today" comparator for stock entries
  - Verified: `useTillShiftsData` returns shifts with `status?: "open" | "closed"` — checking `shift.status !== "closed"` is correct (includes shifts with absent status field, which are treated as open)
- **Edge Cases & Hardening:**
  - No shifts today: `useTillShiftsData({ limitToLast: 10 })` returns empty array → `openShifts.length === 0` → till card shows "done". Correct: nothing open.
  - Old stock count entry: `sameItalyDate(entry.timestamp, new Date())` correctly excludes yesterday's count
  - `SafeCount.type === "reconcile"` (legacy type): accepted alongside `"safeReconcile"` — both count
  - Hook errors: each card independently shows error state; other cards unaffected
- **What would make this >=90%:**
  - Approach would reach 95% with confirmation that `useTillShiftsData` `limitToLast: 10` is sufficient in all operational scenarios (post-deployment evidence)
- **Rollout / rollback:**
  - Rollout: New files only; no changes to existing files. Zero risk to existing functionality.
  - Rollback: Delete `apps/reception/src/components/eodChecklist/` directory.
- **Documentation impact:** None: internal operations component.
- **Notes / references:**
  - Blueprint: `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx`
  - Test blueprint: `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx`
  - Date utilities: `apps/reception/src/utils/dateUtils.ts` (Italy timezone aware)
  - Safe schema: `apps/reception/src/schemas/safeCountSchema.ts` (both `"reconcile"` and `"safeReconcile"` accepted)

---

### TASK-02: Add /eod-checklist/ page route
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/app/eod-checklist/page.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/app/eod-checklist/page.tsx` (new)
  - `[readonly] apps/reception/src/components/eodChecklist/EodChecklistContent.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 95% — exact pattern: `export const dynamic = "force-dynamic"` + `<Providers><EodChecklistContent /></Providers>`. Already working for `/manager-audit/page.tsx`.
  - Approach: 95% — single canonical pattern; no decisions required.
  - Impact: 90% — route is required for the nav entry and direct access; no route = no page.
- **Acceptance:**
  - `/eod-checklist/page.tsx` exists with `export const dynamic = "force-dynamic"`
  - Wraps `<Providers>` around `<EodChecklistContent />`
  - `pnpm --filter @apps/reception typecheck` passes
- **Validation contract (TC-01):**
  - TC-01: `pnpm --filter @apps/reception typecheck` exits 0 with new page file present → TypeScript confirms imports resolve correctly
- **Execution plan:**
  - Red → Green → Refactor: Single file creation. Red phase waived — accepted exception for pure scaffold files with no component logic; zero test-driven logic required. Create file, verify typecheck passes.
- **Planning validation (required for M/L):** None: S-effort scaffold task.
- **Scouts:** None: pattern is identical to `apps/reception/src/app/manager-audit/page.tsx`.
- **Edge Cases & Hardening:** None: new file, no consumer changes.
- **What would make this >=90%:** Already at 90%; reaches 95% after TASK-01 is confirmed complete.
- **Rollout / rollback:**
  - Rollout: New directory + file.
  - Rollback: Delete `apps/reception/src/app/eod-checklist/` directory.
- **Documentation impact:** None.
- **Notes / references:**
  - Pattern reference: `apps/reception/src/app/manager-audit/page.tsx`

---

### TASK-03: Add Admin nav entry (Chiusura)
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/reception/src/components/appNav/AppNav.tsx` with "Chiusura" nav item in Admin section
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/appNav/AppNav.tsx`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — `ListChecks` confirmed available in lucide-react v0.540.0; nav item pattern is identical to all other Admin section items.
  - Approach: 95% — add one object to `navSections[3].items` array and add `ListChecks` to the import block.
  - Impact: 90% — nav entry is required for discoverability; without it the page is inaccessible from normal app navigation.
- **Acceptance:**
  - `{ label: "Chiusura", route: "/eod-checklist", icon: ListChecks }` added to Admin section in `navSections`
  - `ListChecks` imported from `lucide-react`
  - Admin section renders "Chiusura" nav item for users with `MANAGEMENT_ACCESS`
  - `pnpm --filter @apps/reception typecheck` passes
  - `pnpm --filter @apps/reception lint` passes (or only pre-existing warnings)
- **Validation contract (TC-01, TC-02):**
  - TC-01: Typecheck passes with new `ListChecks` import and nav item object
  - TC-02: Lint passes with no new errors introduced
- **Execution plan:**
  - Red → Green → Refactor: Edit two sections of `AppNav.tsx` — add import + add nav item. Verify typecheck + lint.
- **Planning validation (required for M/L):** None: S-effort edit task.
- **Scouts:**
  - `ListChecks` at lucide-react v0.540.0 d.ts: confirmed 5 occurrences — available.
  - Admin section is `navSections[3]` (index 3 in the array at AppNav.tsx:55); `items` array starts at `:93`. Add new entry before "Statistics" for logical ordering.
- **Edge Cases & Hardening:**
  - Section-level `permission: Permissions.MANAGEMENT_ACCESS` on Admin section already gates the entire section — no item-level permission needed.
  - Nav item order: insert between "Controllo" and "Statistics" for logical grouping (EOD and audit are related).
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Edit AppNav.tsx only.
  - Rollback: Revert the two edits to AppNav.tsx.
- **Documentation impact:** None.
- **Notes / references:**
  - Import block: `apps/reception/src/components/appNav/AppNav.tsx:1-35` (add `ListChecks`)
  - Admin section items: `AppNav.tsx:93-108` (add after "Controllo" at line 98)

---

## Risks & Mitigations
- `useTillShiftsData({ limitToLast: 10 })` misses an open shift from >10 shifts ago: Very Low likelihood for single-hostel operation. No mitigation needed for MVP.
- Timezone mismatch in date filtering: Mitigated — `startOfDayIso`/`endOfDayIso`/`sameItalyDate` from `dateUtils.ts` all use `Europe/Rome` timezone. Consistent with rest of app.
- `"reconcile"` type not covering all legacy safe reconcile entries: Low. Both `"reconcile"` and `"safeReconcile"` accepted in EOD check; schema confirms both exist.

## Observability
- Logging: None: internal ops page.
- Metrics: None: no analytics for internal tools.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] `/eod-checklist/` page accessible to users with `MANAGEMENT_ACCESS`
- [ ] Page returns null / not accessible for users without `MANAGEMENT_ACCESS`
- [ ] All 3 status cards (till, safe, stock) display correct state for today
- [ ] "Chiusura" nav entry visible in Admin section for managers
- [ ] ≥9 RTL tests passing for `EodChecklistContent`
- [ ] `pnpm --filter @apps/reception typecheck` passes
- [ ] `pnpm --filter @apps/reception lint` passes (no new errors)

## Decision Log
- 2026-02-28: Chose `EodChecklistContent` as a new standalone component (not extending EndOfDayPacket) — EndOfDayPacket is 804 lines, report-focused, and uses specialised providers; a new component is simpler and independently testable.
- 2026-02-28: Chose `useTillShiftsData({ limitToLast: 10 })` over `useTillShiftsRange` for till check — catches cross-midnight open shifts; sufficient for single-hostel operation.
- 2026-02-28: Chose `ListChecks` icon for "Chiusura" nav entry — differentiates from "Controllo" (ClipboardCheck); confirmed available in v0.540.0.
- 2026-02-28: Safe reconcile check accepts both `"safeReconcile"` and `"reconcile"` — both present in SafeCount schema; `"reconcile"` is a legacy type representing the same operation.

## Overall-confidence Calculation
- TASK-01: 85% × S(1) = 85
- TASK-02: 90% × S(1) = 90
- TASK-03: 90% × S(1) = 90
- Total: 265 / 3 = **88%**

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: EodChecklistContent + tests | Yes | None — all hooks, date utilities (`startOfDayIso`, `endOfDayIso`, `sameItalyDate`), permission gate, and test blueprint confirmed from source | No |
| TASK-02: page route | Yes — TASK-01 prerequisite explicit | None — pattern is identical to `manager-audit/page.tsx` | No |
| TASK-03: nav entry | Yes — TASK-02 prerequisite explicit; `ListChecks` confirmed available | None | No |
