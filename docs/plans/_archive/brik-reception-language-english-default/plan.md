---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-reception-language-english-default
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# BRIK Reception Language — English Default Plan

## Summary

Three reception app screens added in February 2026 (BatchStockCount, ManagerAuditContent, EodChecklistContent) were written entirely in Italian. Operator policy requires English as the default language. This plan translates all Italian-only UI strings to English in the five affected production files, updates three test files whose assertions reference the old Italian text, and translates two Italian nav labels in the sidebar. No i18n framework, no logic changes — pure inline string replacement throughout. BATCH_REASON (`"conteggio batch"`) is a Firebase-stored data value and must not be changed.

## Active tasks

- [x] TASK-01: Translate BatchStockCount.tsx and update BatchStockCount.test.tsx
- [x] TASK-02: Translate ManagerAuditContent.tsx and update ManagerAuditContent.test.tsx
- [x] TASK-03: Translate EodChecklistContent.tsx and update EodChecklistContent.test.tsx
- [x] TASK-04: Translate StockManagement.tsx launch button and AppNav.tsx nav labels

## Goals

- All visible UI strings in BatchStockCount, ManagerAuditContent, and EodChecklistContent render English as the primary label.
- The "Inizia conteggio batch" launch button in StockManagement renders English.
- Nav labels "Controllo" and "Chiusura" in AppNav render English.
- All three test files pass after their Italian string assertions are updated to match the new English labels.
- English is the written convention for all future work on this app.

## Non-goals

- Introducing an i18n framework.
- Translating user-entered Firebase data (category names "Bar", "Cucina").
- Changing BATCH_REASON (`"conteggio batch"`) — Firebase-stored ledger value.
- Translating "Alloggiati" — proper noun for Italian government regulatory system.
- Changing the `toLocaleString("it-IT")` date formatter in ManagerAuditContent.

## Constraints & Assumptions

- Constraints:
  - Inline string replacement only — no new abstractions, no constants files.
  - BATCH_REASON constant must not be modified.
  - Test updates must be committed in the same change as source file updates.
- Assumptions:
  - Operator has confirmed pure English is acceptable where Italian was the sole label.
  - "Check-in" is an English loanword and requires no translation.

## Inherited Outcome Contract

- **Why:** Operator policy requires English as the default language across all reception app screens. Newer screens added in February 2026 were written in Italian-only, creating inconsistency with older English-language screens and violating the stated convention.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All reception app screens display English as the primary label; no screen shows Italian as the only UI language; this is codified as a written convention for future work.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/brik-reception-language-english-default/fact-find.md`
- Key findings used:
  - Complete Italian string inventory with file paths and line numbers for all 5 production files.
  - BATCH_REASON confirmed as Firebase-stored value — must not change.
  - UNCATEGORIZED_LABEL confirmed not persisted — safe to change; 4 test assertions depend on it.
  - `getByRole("button", { name: "Completa categoria" })` used as selector in 8 BatchStockCount tests — must be updated in sync.
  - AppNav Modals.test.tsx mocks withIconModal fully — no real label assertions, no test update needed.
  - StockManagement.test.tsx confirmed by grep to have no assertion on "Inizia conteggio batch".
  - EodChecklistContent uses data-cy attributes for test selection — text changes don't break element targeting.

## Proposed Approach

- Option A: One task per component+test pair, all parallelisable (chosen).
- Option B: One task per file (8 tasks) — unnecessary overhead for this scope.
- Chosen approach: Option A. Four tasks, all Wave 1 (fully independent). Component and its test file are bundled in the same task to prevent broken intermediate state.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | BatchStockCount.tsx + test | 90% | S | Complete (2026-02-28) | - | - |
| TASK-02 | IMPLEMENT | ManagerAuditContent.tsx + test | 90% | S | Complete (2026-02-28) | - | - |
| TASK-03 | IMPLEMENT | EodChecklistContent.tsx + test | 90% | S | Complete (2026-02-28) | - | - |
| TASK-04 | IMPLEMENT | StockManagement.tsx + AppNav.tsx | 90% | S | Complete (2026-02-28) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | - | All fully independent; no shared files. Run in parallel. |

## Tasks

---

### TASK-01: Translate BatchStockCount.tsx and update BatchStockCount.test.tsx

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/inventory/BatchStockCount.tsx` + `apps/reception/src/components/inventory/__tests__/BatchStockCount.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:** `apps/reception/src/components/inventory/BatchStockCount.tsx`, `apps/reception/src/components/inventory/__tests__/BatchStockCount.test.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — All strings identified by line number; change pattern is trivial replacement. BATCH_REASON (line 20) is explicitly marked do-not-change.
  - Approach: 95% — Inline string replacement matches the established pattern in older English screens.
  - Impact: 90% — 8 `getByRole("button", { name: ... })` selectors in tests depend on the button label; all 8 locations are identified and must be updated. 4 test assertions use "Senza categoria" — all identified. No other impact surface.
- **Acceptance:**
  - `UNCATEGORIZED_LABEL` changed from `"Senza categoria"` to `"Uncategorized"` at line 19.
  - `BATCH_REASON` (`"conteggio batch"`) unchanged at line 20.
  - All 15 Italian display strings in BatchStockCount.tsx replaced with English equivalents per the fact-find inventory.
  - All 8 `getByRole("button", { name: "Completa categoria" })` selectors in BatchStockCount.test.tsx updated to `"Complete category"`.
  - All 4 assertions on `"Senza categoria"` in BatchStockCount.test.tsx updated to `"Uncategorized"`.
  - All other Italian text assertions in BatchStockCount.test.tsx updated to match new English labels.
  - Tests pass (CI).
- **Validation contract:**
  - TC-01: Loading state renders "Loading inventory..." — was "Caricamento inventario..."
  - TC-02: Error state renders "Error loading inventory." — was "Errore durante il caricamento dell'inventario."
  - TC-03: Button label renders "Complete category" — was "Completa categoria"; 8 test selectors updated.
  - TC-04: Progress indicator renders "{n} / {m} categories complete" — was "categorie complete".
  - TC-05: Table headers render "Item", "Unit", "Expected", "Counted" — were "Articolo", "Unità", "Previsto", "Conteggiato".
  - TC-06: Variance table headers render "Item", "Expected", "Counted", "Delta" — were "Articolo", "Previsto", "Conteggiato", "Delta".
  - TC-07: Empty variance state renders "No quantities entered for this category." — was "Nessuna quantità inserita per questa categoria."
  - TC-08: Sync-pending banner renders "Sync pending..." — was "Sincronizzazione in attesa..."
  - TC-09: PasswordReauthModal title renders "Confirm batch count" — was "Conferma conteggio".
  - TC-10: PasswordReauthModal instructions render "Enter your password to confirm the batch count with large variances." — was Italian.
  - TC-11: Uncategorized items grouped under "Uncategorized" — was "Senza categoria"; 4 test assertions updated.
  - TC-12: BATCH_REASON constant value is still `"conteggio batch"` (do not change).
- **Execution plan:** Red → Green → Refactor
  - Red: No failing tests to write (pure text replacement); existing tests will fail against old Italian strings until source is changed.
  - Green: Replace `UNCATEGORIZED_LABEL` constant; replace all Italian JSX strings; update all Italian string assertions and button selectors in test file.
  - Refactor: Verify no remaining Italian display strings in BatchStockCount.tsx (grep check). Exclude: `BATCH_REASON = "conteggio batch"` (line 20, Firebase value — do not change) and `localeCompare(b, "it")` (line 101, sort behaviour — do not change).
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: all strings and their locations are fully enumerated in the fact-find.
- **Edge Cases & Hardening:**
  - BATCH_REASON must not change — the constant is on line 20 directly below UNCATEGORIZED_LABEL. Guard: ensure only line 19 constant is changed, not line 20.
  - The `localeCompare` call uses `"it"` locale for Italian alphabetical sort (line 101). This is behavioural (sort order for category names), not a UI label. Do not change.
- **What would make this >=90%:** Already at 90%. Reaching 95%: read the full test file exhaustively to catch any other Italian string assertion not in the identified list.
- **Rollout / rollback:**
  - Rollout: Deploy with normal PR merge; no feature flag.
  - Rollback: Revert the two files.
- **Documentation impact:** None: cosmetic string change only.
- **Notes / references:**
  - String inventory: fact-find.md BatchStockCount table.
  - Do NOT change: `BATCH_REASON = "conteggio batch"` (line 20) — Firebase-stored value.
  - Do NOT change: `localeCompare(b, "it")` locale parameter (line 101) — sort behaviour, not UI label.

---

### TASK-02: Translate ManagerAuditContent.tsx and update ManagerAuditContent.test.tsx

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` + `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:** `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx`, `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — All 18 Italian strings identified by line number. The `formatShiftStatus` function (lines 45–53) returns Italian strings "Aperto"/"Chiuso" — these are tested directly in ManagerAuditContent.test.tsx.
  - Approach: 95% — Inline replacement; no structural change.
  - Impact: 90% — Tests assert directly on "Variazione Stock", "Ultimi Turni", "Check-in Oggi", "Controllo Manager", "Caricamento...", "Chiuso", "Aperto", "2 check-in oggi", "0 check-in oggi". All identified.
- **Acceptance:**
  - All 18 Italian strings in ManagerAuditContent.tsx replaced per the fact-find inventory.
  - `formatShiftStatus` returns "Open" for "open" status and "Closed" for "closed" status.
  - All Italian string assertions in ManagerAuditContent.test.tsx updated to English equivalents.
  - Tests pass (CI).
- **Validation contract:**
  - TC-01: h1 renders "Manager Audit" — was "Controllo Manager".
  - TC-02: Stock Variance section h2 renders "Stock Variance" — was "Variazione Stock".
  - TC-03: Loading state renders "Loading..." — was "Caricamento...".
  - TC-04: Error states render "Error loading stock:", "Error loading shifts:", "Error loading check-ins:" — were Italian.
  - TC-05: Empty state renders "No variance in the last 7 days" — was "Nessuna variazione negli ultimi 7 giorni".
  - TC-06: Table headers render "Item", "Date", "Status", "Closed at", "Closed by", "Difference" — were Italian.
  - TC-07: Recent Shifts h2 renders "Recent Shifts" — was "Ultimi Turni".
  - TC-08: Empty shifts state renders "No shifts recorded" — was "Nessun turno registrato".
  - TC-09: Shift status "open" displays "Open" — was "Aperto"; test assertion updated.
  - TC-10: Shift status "closed" displays "Closed" — was "Chiuso"; test assertion updated.
  - TC-11: Check-ins Today h2 renders "Check-ins Today" — was "Check-in Oggi".
  - TC-12: Checkin count renders "{n} check-in(s) today" — was "{n} check-in oggi"; test assertions for "2 check-in oggi" and "0 check-in oggi" updated.
  - TC-13: `toLocaleString("it-IT")` date formatter unchanged (out of scope).
- **Execution plan:** Red → Green → Refactor
  - Red: Existing tests fail on Italian strings until source is changed.
  - Green: Replace `formatShiftStatus` return values; replace all Italian JSX strings; update all Italian assertions in test file.
  - Refactor: Grep check for remaining Italian display strings in ManagerAuditContent.tsx. Exclude: `toLocaleString("it-IT")` (line 42, date formatting — do not change).
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: all strings enumerated in fact-find.
- **Edge Cases & Hardening:**
  - The `"{todayCheckinCount} check-in(s) today"` phrasing uses "(s)" for grammatical pluralisation. If the test asserts on the exact string "2 check-in oggi", update to "2 check-in(s) today". Consistent with English convention.
  - `"Signoff"` header (line 205) and `"Delta"` (line 146) are already English — do not touch.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Normal PR merge.
  - Rollback: Revert the two files.
- **Documentation impact:** None.
- **Notes / references:**
  - String inventory: fact-find.md ManagerAuditContent table.
  - Do NOT change: `toLocaleString("it-IT")` at line 42.

---

### TASK-03: Translate EodChecklistContent.tsx and update EodChecklistContent.test.tsx

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` + `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:** `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx`, `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — 9 Italian strings identified. EodChecklistContent uses data-cy attributes for test element selection — text changes do not break element targeting. Only toHaveTextContent assertions need updating.
  - Approach: 95% — Inline replacement; no structural change.
  - Impact: 90% — Test assertions on "Caricamento...", "Completata", "Incompleta" are the only text-dependent assertions. Element selection is data-cy-based and unaffected. Lowest risk task in the set.
- **Acceptance:**
  - All 9 Italian strings in EodChecklistContent.tsx replaced per the fact-find inventory.
  - `toHaveTextContent("Caricamento...")` assertions updated to `"Loading..."` in all three loading tests.
  - `toHaveTextContent("Completata")` assertions updated to `"Complete"`.
  - `toHaveTextContent("Incompleta")` assertions updated to `"Incomplete"`.
  - All data-cy element selectors unchanged and functional.
  - Tests pass (CI).
- **Validation contract:**
  - TC-01: h1 renders "End of Day" — was "Chiusura Giornata".
  - TC-02: Till section h2 renders "Till" — was "Cassa".
  - TC-03: Safe section h2 renders "Safe" — was "Cassaforte".
  - TC-04: Stock section h2 is already "Stock" — no change needed.
  - TC-05: Loading state across all three sections renders "Loading..." — was "Caricamento...".
  - TC-06: Done status renders "✓ Complete" — was "✓ Completata".
  - TC-07: Incomplete status renders "✗ Incomplete" — was "✗ Incompleta".
  - TC-08: data-cy attributes (till-loading, till-status, safe-loading, safe-status, stock-loading, stock-status) unchanged.
- **Execution plan:** Red → Green → Refactor
  - Red: Existing tests fail on "Caricamento...", "Completata", "Incompleta" assertions.
  - Green: Replace Italian JSX strings; update toHaveTextContent assertions.
  - Refactor: Grep check for remaining Italian.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: all strings enumerated.
- **Edge Cases & Hardening:**
  - The checkmark/cross symbols (✓, ✗) are Unicode and remain unchanged — only the following word changes.
  - "Stock" section h2 is already English — confirm no change needed before editing.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Normal PR merge.
  - Rollback: Revert the two files.
- **Documentation impact:** None.
- **Notes / references:**
  - String inventory: fact-find.md EodChecklistContent table.

---

### TASK-04: Translate StockManagement.tsx button label and AppNav.tsx nav labels

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/inventory/StockManagement.tsx` + `apps/reception/src/components/appNav/AppNav.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:** `apps/reception/src/components/inventory/StockManagement.tsx`, `apps/reception/src/components/appNav/AppNav.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — Three strings, all identified by line number. No test updates required (confirmed by grep for StockManagement; AppNav Modals.test.tsx mocks withIconModal entirely).
  - Approach: 95% — Inline replacement.
  - Impact: 90% — AppNav nav labels change the sidebar navigation affordance for the two affected screens. The English names match the proposed page headings from TASK-02 and TASK-03 — consistent navigation experience.
- **Acceptance:**
  - StockManagement.tsx: button label changed from "Inizia conteggio batch" to "Start batch count" (currently line 744; do not rely on this line number — search by string).
  - AppNav.tsx line 99: nav label changed from "Controllo" to "Manager Audit".
  - AppNav.tsx line 100: nav label changed from "Chiusura" to "End of Day".
  - No test files require updates for these changes.
  - Tests pass (CI).
- **Validation contract:**
  - TC-01: StockManagement batch count trigger button renders "Start batch count" — was "Inizia conteggio batch".
  - TC-02: AppNav Admin section shows "Manager Audit" for /manager-audit route — was "Controllo".
  - TC-03: AppNav Admin section shows "End of Day" for /eod-checklist route — was "Chiusura".
  - TC-04: AppNav Modals.test.tsx passes without modification (HOC is mocked; no real label assertions).
  - TC-05: StockManagement.test.tsx passes without modification (no assertion on button label — confirmed by grep).
- **Execution plan:** Red → Green → Refactor
  - Red: No existing failing tests for these strings; confirm StockManagement.test.tsx grep result still holds.
  - Green: Replace the three strings.
  - Refactor: Grep both files for remaining Italian.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: all strings enumerated.
- **Edge Cases & Hardening:**
  - "Manager Audit" in AppNav (12 chars) vs original "Controllo" (9 chars) — sidebar layout uses text-based nav items; confirm the longer label fits at build time (risk: very low given existing labels like "Real Time", "Menu Perf").
  - "End of Day" in AppNav matches the EodChecklistContent h1 from TASK-03 — consistent.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Normal PR merge.
  - Rollback: Revert the two files.
- **Documentation impact:** None.
- **Notes / references:**
  - String inventory: fact-find.md StockManagement and AppNav tables.
  - AppNav Modals.test.tsx confirmed safe — no update needed.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: BatchStockCount.tsx + test | Yes | None — all strings enumerated, BATCH_REASON exclusion explicit, 8 button selector sites identified | No |
| TASK-02: ManagerAuditContent.tsx + test | Yes | None — formatShiftStatus return values included in inventory; test assertions identified | No |
| TASK-03: EodChecklistContent.tsx + test | Yes | None — data-cy selectors confirmed stable; only toHaveTextContent assertions require updates | No |
| TASK-04: StockManagement.tsx + AppNav.tsx | Yes | None — no test updates needed (confirmed); nav label length is a minor visual check, not a blocking risk | No |
| Wave 1 parallelism | Yes | None — all four tasks touch distinct files with zero overlap | No |
| BATCH_REASON boundary | Yes | None — constant is on adjacent line to UNCATEGORIZED_LABEL; explicitly noted in TASK-01 edge cases | No |
| Test sync constraint | Yes | None — component and test bundled in same task in all cases | No |

No Critical simulation findings. All tasks are pre-conditions-complete and can proceed.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Button selector break on "Completa categoria" → "Complete category" | Low | Low | 8 locations identified in fact-find; TASK-01 acceptance requires all 8 updated |
| BATCH_REASON accidentally changed | Low | Medium | Explicit do-not-change guard in TASK-01 notes and edge cases |
| "Manager Audit" nav label wider than sidebar column | Low | Low | Visual check at build time; label length comparable to existing items |

## Observability

- Logging: None: no logging change.
- Metrics: None: no analytics change.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] All Italian-only UI strings in the five production files replaced with English equivalents per the fact-find string inventory.
- [ ] All Italian string assertions in BatchStockCount.test.tsx, ManagerAuditContent.test.tsx, and EodChecklistContent.test.tsx updated.
- [ ] BATCH_REASON constant (`"conteggio batch"`) unchanged.
- [ ] CI test run passes with no new failures.
- [ ] `pnpm --filter reception typecheck && pnpm --filter reception lint` passes.

## Decision Log

- 2026-02-28: Chose Option A (component+test pairs bundled per task) over Option B (one task per file). Rationale: keeps component and its test in the same atomic unit, preventing broken intermediate state, while keeping the plan compact.
- 2026-02-28: BATCH_REASON excluded from translation — Firebase-stored data value, not a display label.
- 2026-02-28: "Alloggiati" excluded — proper noun (Italian government system name) with no English equivalent.
- 2026-02-28: `toLocaleString("it-IT")` excluded — formatting preference, not a UI label.

## Overall-confidence Calculation

All tasks are S-effort (weight=1). Confidence per task = min(impl, approach, impact).
- TASK-01: min(95, 95, 90) = 90%; weight 1
- TASK-02: min(95, 95, 90) = 90%; weight 1
- TASK-03: min(95, 95, 90) = 90%; weight 1
- TASK-04: min(95, 95, 90) = 90%; weight 1

Overall-confidence = (90 + 90 + 90 + 90) / 4 = **90%**
