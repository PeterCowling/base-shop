---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: brik-reception-language-english-default
Dispatch-ID: IDEA-DISPATCH-20260228-0075
Trigger-Source: direct-inject
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-reception-language-english-default/plan.md
Trigger-Why: TBD
Trigger-Intended-Outcome: type: operational | statement: All reception app UI screens display English as the primary language; Italian strings are permitted alongside English but must not be the only label shown | source: operator
---

# BRIK Reception Language — English Default Fact-Find Brief

## Scope

### Summary

The BRIK reception app has inconsistent language coverage. Older screens (TillShiftHistory, CloseShiftForm, StockManagement) were written in English. Newer screens added in February 2026 — BatchStockCount (added 2026-02-28), ManagerAuditContent (added 2026-02-28), EodChecklistContent (added 2026-02-28) — were written entirely in Italian. The operator policy is English as the default language; Italian already in place is acceptable but must not be the sole label. The work is: audit all hardcoded UI strings in the three Italian-only components (and the mixed StockManagement trigger button), translate Italian-only strings to English as the primary label, and update tests that assert on Italian text.

### Goals

- All visible strings in BatchStockCount, ManagerAuditContent, and EodChecklistContent render English as the primary label.
- Italian strings that carry business meaning (e.g. "conteggio batch" used as a database ledger reason value) are handled separately — the DB value need not change, only the UI display label.
- The "Inizia conteggio batch" button in StockManagement (the parent/launch screen) is translated to English.
- The nav labels "Controllo" and "Chiusura" in AppNav (Admin section) are translated to English.
- UNCATEGORIZED_LABEL ("Senza categoria") in BatchStockCount is replaced with an English equivalent; the test that asserts on the Italian string is updated to match.
- Existing test suite continues to pass after label changes.
- English is established as the written convention for all future work on this app.

### Non-goals

- Introducing an i18n/internationalisation framework — all changes are inline string replacements only.
- Translating Italian category names stored in Firebase (e.g. "Bar", "Cucina" — these are user-entered data, not UI labels).
- Translating the ledger reason value stored in Firebase (`BATCH_REASON = "conteggio batch"`) — this is a data identifier, not a display label. The UI button label is replaced; the stored value is not.
- Translating content in the bar/food ordering screens (not in scope per dispatch).
- Translating `"Alloggiati"` in AppNav and ManModal — this is a proper noun referring to the Italian government's "Alloggiati Web" compliance registration system. The term is the name of the regulatory service and has no standard English equivalent in context. It remains as-is; this is not a language policy violation.
- Changing date/number locale formatting (`toLocaleString("it-IT")` in ManagerAuditContent) — this formats timestamps in Italian locale, which may be intentional for Italian-speaking operators. Noted as advisory.

### Constraints & Assumptions

- Constraints:
  - No i18n library — all replacements are bare string literals in JSX / JS constants.
  - Tests must be updated in sync; the test suite asserts on exact Italian strings in several places.
  - BATCH_REASON constant is written to Firebase as the ledger entry `reason` field — changing its value would corrupt historical query assumptions. Display label is separate.
  - The `UNCATEGORIZED_LABEL` constant is used both in JSX display and in test assertions (`"Senza categoria"`). Changing it requires updating the test that asserts `grouped["Senza categoria"]`.
- Assumptions:
  - Operator has confirmed Italian-alongside-English is acceptable; pure English is also acceptable where Italian was the only label.
  - "Signoff" column header in ManagerAuditContent is already English — confirmed in source, no change needed.
  - "Check-in" is an English loanword used internationally and consistently across the nav and screens — no change needed.
  - The `"it-IT"` locale in `formatDateTime` (ManagerAuditContent line 42) is intentional and out of scope.

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All reception app screens display English as the primary label; no screen shows Italian as the only UI language; this is codified as a written convention for future work.
- **Source:** auto

## Access Declarations

None — this is a pure codebase read/write task. No external services, APIs, or credentials are required.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/inventory/BatchStockCount.tsx` — standalone batch-count component, rendered by StockManagement when `batchCountMode = true`.
- `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` — full-page content for `/manager-audit` route.
- `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` — full-page content for `/eod-checklist` route.
- `apps/reception/src/components/inventory/StockManagement.tsx` — parent screen containing the "Inizia conteggio batch" trigger button (line 606).
- `apps/reception/src/components/appNav/AppNav.tsx` — navigation bar; contains "Controllo" (line 99) and "Chiusura" (line 100) nav labels.

### Key Modules / Files

- `apps/reception/src/components/inventory/BatchStockCount.tsx` — contains all Italian UI strings for the batch count screen. UNCATEGORIZED_LABEL and BATCH_REASON are module-level constants.
- `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` — Italian strings in section headings, table headers, status formatters, loading/error/empty states.
- `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` — Italian strings in page heading, section headings, status text. Uses `data-cy` attributes for test selection (test-stable).
- `apps/reception/src/components/inventory/StockManagement.tsx` — mostly English; one Italian string on line 606: `"Inizia conteggio batch"` (button label to enter batch count mode).
- `apps/reception/src/components/appNav/AppNav.tsx` — two Italian nav labels in the Admin section: `"Controllo"` (line 99, route `/manager-audit`) and `"Chiusura"` (line 100, route `/eod-checklist`).
- `apps/reception/src/components/inventory/__tests__/BatchStockCount.test.tsx` — 25 tests. Multiple assertions on Italian strings: `"Caricamento inventario..."`, `"Errore durante il caricamento dell'inventario."`, `"Completa categoria"` (button name), `"1 / 2 categorie complete"`, `"Senza categoria"`. All must be updated to match new English labels.
- `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx` — 7 tests. Assertions on: `"Variazione Stock"`, `"Ultimi Turni"`, `"Check-in Oggi"`, `"Controllo Manager"` (h1), `"Caricamento..."`, `"Chiuso"`, `"Aperto"`, `"2 check-in oggi"`, `"0 check-in oggi"`.
- `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx` — 9 tests. Assertions on: `"Caricamento..."` (via `toHaveTextContent`), `"Completata"`, `"Incompleta"`. The test uses `data-cy` attributes for element selection — test selectors are stable. Only the `toHaveTextContent` assertions on display text need updating.

### Patterns & Conventions Observed

- **String pattern — hardcoded inline:** All display text is hardcoded inline in JSX. No i18n library, no translation keys, no string constants files. Evidence: all three target files.
- **Module-level constants for reused strings:** `UNCATEGORIZED_LABEL` and `BATCH_REASON` in BatchStockCount — the only constants; everything else is inline JSX text. Evidence: `apps/reception/src/components/inventory/BatchStockCount.tsx` lines 19–20.
- **English baseline in older screens:** TillShiftHistory, CloseShiftForm, StockManagement body are English. The pattern to follow is plain English inline strings with no constants layer needed. Evidence: `apps/reception/src/components/till/TillShiftHistory.tsx`, `CloseShiftForm.tsx`.
- **`data-cy` attributes for test selection in EodChecklist:** Tests select elements by `data-cy` attribute (`till-loading`, `till-status`, etc.), not by text. This means text changes do not break element targeting — only `toHaveTextContent` assertions need updating. Evidence: `EodChecklistContent.tsx` lines 53–54, 62–64.
- **`getByRole("button", { name: "..." })` in BatchStockCount tests:** The button name `"Completa categoria"` is the accessible name used by test selectors. This must be updated in sync with the component. Evidence: `BatchStockCount.test.tsx` lines 305, 343, 376, 407, 452, 518, 548, 586.
- **`toLocaleString("it-IT")`** in ManagerAuditContent line 42: formats timestamps using Italian locale convention. Out of scope — confirmed not a UI label.

### Data & Contracts

- Types/schemas/events:
  - `BATCH_REASON` (string `"conteggio batch"`) is written as the `reason` field of `InventoryLedgerEntry` to Firebase Realtime Database via `useInventoryLedgerMutations.addLedgerEntry`. This is a stored data value, not a display label. Do NOT change this constant. Evidence: `BatchStockCount.tsx` line 209.
  - `UNCATEGORIZED_LABEL` is used only for UI display and as a grouping key in `groupItemsByCategory`. It is not persisted. Changing it is safe for runtime; tests must be updated. Evidence: `BatchStockCount.tsx` lines 19, 44.
- Persistence:
  - No screen-level state is persisted with Italian strings as keys. `useBatchCountProgress` stores `categoriesComplete` (category names from user data) and `enteredQuantities` (item IDs). Neither depends on the UI label constants.
- API/contracts:
  - `PasswordReauthModal` in BatchStockCount receives `title` and `instructions` as props (Italian strings). These are display props — no external contract dependency. Changing them is safe.

### Dependency & Impact Map

- Upstream dependencies:
  - `useInventoryLedgerMutations.addLedgerEntry` — receives `reason: BATCH_REASON` from BatchStockCount. The stored value is not a UI concern and must not change.
  - `useAuth`, `canAccess`, `Permissions` — auth-gated rendering. Not affected.
- Downstream dependents:
  - `StockManagement.tsx` imports `BatchStockCount` — the launch button ("Inizia conteggio batch") is in StockManagement, not BatchStockCount itself. Both files need changes.
  - `apps/reception/src/app/manager-audit/page.tsx` renders `ManagerAuditContent` — thin wrapper, no display strings to change.
  - `apps/reception/src/app/eod-checklist/page.tsx` renders `EodChecklistContent` — thin wrapper, no display strings to change.
  - `AppNav.tsx` defines nav labels for all admin routes. The "Controllo" and "Chiusura" labels are visible in the sidebar nav and are the primary navigation affordance for these screens.
- Likely blast radius:
  - 5 production files: `BatchStockCount.tsx`, `ManagerAuditContent.tsx`, `EodChecklistContent.tsx`, `StockManagement.tsx`, `AppNav.tsx`.
  - 3 test files: `BatchStockCount.test.tsx`, `ManagerAuditContent.test.tsx`, `EodChecklistContent.test.tsx`.
  - No database migrations, no API changes, no type changes, no new dependencies.

### Complete Italian String Inventory

#### BatchStockCount.tsx

| Location | Italian string | Proposed English | Note |
|---|---|---|---|
| Line 19 (constant) | `"Senza categoria"` | `"Uncategorized"` | Used in JSX display and as grouping key; tests assert on it |
| Line 20 (constant) | `"conteggio batch"` | **DO NOT CHANGE** | Stored in Firebase as ledger reason; not a display label |
| Line 296 (JSX) | `Caricamento inventario...` | `Loading inventory...` | Loading state |
| Line 304 (JSX) | `Errore durante il caricamento dell'inventario.` | `Error loading inventory.` | Error state |
| Line 313 (JSX) | `Sincronizzazione in attesa...` | `Sync pending...` | Offline banner |
| Line 317 (JSX) | `{completeCategorySet.size} / {categoryNames.length} categorie complete` | `{completeCategorySet.size} / {categoryNames.length} categories complete` | Progress indicator |
| Line 337 (JSX/button) | `Completa categoria` | `Complete category` | Button label — also used as accessible name in tests |
| Line 344 (TableHead) | `Articolo` | `Item` | Column header |
| Line 345 (TableHead) | `Unità` | `Unit` | Column header |
| Line 346 (TableHead) | `Previsto` | `Expected` | Column header |
| Line 347 (TableHead) | `Conteggiato` | `Counted` | Column header |
| Line 395 (TableHead) | `Articolo` (variance table) | `Item` | Column header |
| Line 396 (TableHead) | `Previsto` (variance table) | `Expected` | Column header |
| Line 397 (TableHead) | `Conteggiato` (variance table) | `Counted` | Column header |
| Line 424 (JSX) | `Nessuna quantità inserita per questa categoria.` | `No quantities entered for this category.` | Empty variance state |
| Line 434 (prop) | `title="Conferma conteggio"` | `title="Confirm batch count"` | Modal title prop |
| Line 435 (prop) | `instructions="Inserisci la tua password..."` | `instructions="Enter your password to confirm the batch count with large variances."` | Modal instructions prop |

#### ManagerAuditContent.tsx

| Location | Italian string | Proposed English | Note |
|---|---|---|---|
| Line 47 | `return "Aperto"` | `return "Open"` | Shift status formatter |
| Line 50 | `return "Chiuso"` | `return "Closed"` | Shift status formatter |
| Line 117 (h1) | `Controllo Manager` | `Manager Audit` | Page title |
| Line 120 (h2) | `Variazione Stock` | `Stock Variance` | Section heading |
| Line 122 (JSX) | `Caricamento...` | `Loading...` | Loading state |
| Line 126 (JSX) | `Errore caricamento stock:` | `Error loading stock:` | Error state |
| Line 135 (JSX) | `Nessuna variazione negli ultimi 7 giorni` | `No variance in the last 7 days` | Empty state |
| Line 143 (TableHead) | `Articolo` | `Item` | Column header |
| Line 149 (TableHead) | `Data` | `Date` | Column header |
| Line 175 (h2) | `Ultimi Turni` | `Recent Shifts` | Section heading |
| Line 177 (JSX) | `Caricamento...` | `Loading...` | Loading state |
| Line 181 (JSX) | `Errore caricamento turni:` | `Error loading shifts:` | Error state |
| Line 186 (JSX) | `Nessun turno registrato` | `No shifts recorded` | Empty state |
| Line 193 (TableHead) | `Stato` | `Status` | Column header |
| Line 196 (TableHead) | `Chiuso il` | `Closed at` | Column header |
| Line 199 (TableHead) | `Chiuso da` | `Closed by` | Column header |
| Line 202 (TableHead) | `Differenza` | `Difference` | Column header |
| Line 237 (h2) | `Check-in Oggi` | `Check-ins Today` | Section heading |
| Line 239 (JSX) | `Caricamento...` | `Loading...` | Loading state |
| Line 243 (JSX) | `Errore caricamento check-in:` | `Error loading check-ins:` | Error state |
| Line 248 (JSX) | `{todayCheckinCount} check-in oggi` | `{todayCheckinCount} check-in(s) today` | Count display |

**Note:** `"Signoff"` column header (line 205) and `"Delta"` (line 146) are already English — no change.

#### EodChecklistContent.tsx

| Location | Italian string | Proposed English | Note |
|---|---|---|---|
| Line 45 (h1) | `Chiusura Giornata` | `End of Day` | Page title |
| Line 49 (h2) | `Cassa` | `Till` | Section heading |
| Line 55 (JSX) | `Caricamento...` | `Loading...` | Loading state; data-cy="till-loading" — selector stable |
| Line 64 (JSX) | `✓ Completata` / `✗ Incompleta` | `✓ Complete` / `✗ Incomplete` | Status text; data-cy="till-status" — selector stable |
| Line 71 (h2) | `Cassaforte` | `Safe` | Section heading |
| Line 78 (JSX) | `Caricamento...` | `Loading...` | Loading state; data-cy="safe-loading" — selector stable |
| Line 87 (JSX) | `✓ Completata` / `✗ Incompleta` | `✓ Complete` / `✗ Incomplete` | Status text; data-cy="safe-status" — selector stable |
| Line 99 (JSX) | `Caricamento...` | `Loading...` | Loading state; data-cy="stock-loading" — selector stable |
| Line 110 (JSX) | `✓ Completata` / `✗ Incompleta` | `✓ Complete` / `✗ Incomplete` | Status text; data-cy="stock-status" — selector stable |

#### StockManagement.tsx (parent — one Italian string)

| Location | Italian string | Proposed English | Note |
|---|---|---|---|
| Line 606 (button) | `Inizia conteggio batch` | `Start batch count` | Button to enter batch count mode |

#### AppNav.tsx (two Italian nav labels)

| Location | Italian string | Proposed English | Note |
|---|---|---|---|
| Line 99 | `"Controllo"` | `"Manager Audit"` | Nav label for /manager-audit |
| Line 100 | `"Chiusura"` | `"End of Day"` | Nav label for /eod-checklist |

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (`@testing-library/react`, `@testing-library/user-event`)
- Commands: CI-enforced; tests run automatically on PR. Do not rely on local test execution — push and observe CI results.
- CI integration: runs on PR; tests for the three components currently pass (no describe.skip observed in target files). Test changes must land in the same commit as production file changes — do not merge with broken tests.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| BatchStockCount | Unit | `BatchStockCount.test.tsx` (25 tests) | Full coverage of loading, error, category rendering, submit, reauth gate, progress restore. Multiple Italian string assertions must be updated. |
| ManagerAuditContent | Unit | `ManagerAuditContent.test.tsx` (7 tests) | Section heading assertions, shift status rendering, checkin count, loading states. All Italian string assertions must be updated. |
| EodChecklistContent | Unit | `EodChecklistContent.test.tsx` (9 tests) | Loading states, complete/incomplete status, mixed state. Uses `data-cy` for selectors — safe. `toHaveTextContent` assertions on "Caricamento...", "Completata", "Incompleta" must be updated. |
| StockManagement | Unit | `StockManagement.test.tsx` (exists) | Confirmed by grep: no assertion on "Inizia conteggio batch". No test update required for the button label change. |
| AppNav | Unit | `apps/reception/src/components/appNav/__tests__/Modals.test.tsx` exists | `withIconModal` HOC is fully mocked — tests assert on `data-label` and `data-interactive` attributes, not on nav label strings from the real components. No Italian label assertions present. Nav label changes will not break this test. Evidence: Modals.test.tsx lines 17–36. |

#### Coverage Gaps

- Untested paths: The `"Inizia conteggio batch"` button in StockManagement is **confirmed not asserted** in `StockManagement.test.tsx` (grep found no match). No test update required for this string in StockManagement tests.
- Extinct tests: None identified. All 25 BatchStockCount tests are active (no `describe.skip`).
- AppNav test coverage: `Modals.test.tsx` mocks `withIconModal` fully — confirmed no assertions on real nav label strings. Nav label changes will not break AppNav tests; no update required.

#### Testability Assessment

- Easy to test: All string changes are pure text replacements in JSX — tests that use `getByText` or `toHaveTextContent` will confirm correctness after replacement.
- Hard to test: Nothing structurally difficult.
- Test seams needed: None — existing seams (mocks, data-cy attributes) are sufficient.

#### Recommended Test Approach

- Unit tests for: Update all Italian string assertions in the three test files to match new English labels.
- No integration or E2E tests needed for this change — it is pure UI text replacement with no logic changes.

### Recent Git History (Targeted)

- `3654b9319e` (test) — BatchStockCount test suite added (25 tests), latest commit touching BatchStockCount area.
- `24f7422b06` (feat) — Wave 3: reauth gate + batch count toggle added to StockManagement.
- `d99d9a0256` (feat) — Wave 3: BatchStockCount core component created (Italian-language original).
- `fb0719f063` (style) — Wave 3: icon/colour migration. No text changes expected.
- `4b777cacab` (feat) — Wave 2 screen polish; ManagerAudit and EodChecklist screens present at this point.

**Implication:** All three Italian-only screens were introduced on 2026-02-28 (the same day as this dispatch). BatchStockCount was introduced in `d99d9a0256` (2026-02-28); ManagerAuditContent and EodChecklistContent were added in separate commits on the same date. None of these files have been touched for text since their introduction — low merge conflict risk. The absence of prior history confirms these are new files with no pre-existing Italian text debt to track.

## Questions

### Resolved

- Q: Should `BATCH_REASON = "conteggio batch"` be changed?
  - A: No. This constant is written to Firebase as the `reason` field of a ledger entry (line 209 of BatchStockCount.tsx). It is a data identifier stored in the database, not a UI display label. Changing it would misalign historical query patterns. The UI button label ("Complete category") is separate from the stored value.
  - Evidence: `BatchStockCount.tsx` lines 20, 205–210.

- Q: Is `UNCATEGORIZED_LABEL = "Senza categoria"` used as a stored key in Firebase?
  - A: No. It is used only in the `groupItemsByCategory` utility for in-memory grouping and display. The value is not written to Firebase. Changing it is runtime-safe; test assertions must be updated.
  - Evidence: `BatchStockCount.tsx` lines 19, 44; `BatchStockCount.test.tsx` lines 144, 158, 178, 278.

- Q: Are there test selectors that will break if display text changes?
  - A: Yes, in BatchStockCount: `getByRole("button", { name: "Completa categoria" })` uses the button's accessible text as the selector. This appears in 8 test cases and must be updated in sync with the component. EodChecklistContent uses `data-cy` attributes for element targeting — those selectors are text-independent and will not break.
  - Evidence: `BatchStockCount.test.tsx` lines 305, 343, 376, 407, 452, 518, 548, 586; `EodChecklistContent.tsx` lines 53–54, 62–64.

- Q: Do the AppNav nav labels "Controllo" and "Chiusura" need to change?
  - A: Yes. These are the primary navigation affordance for the two Italian-only screens. If the page headings become English, the nav labels should match. "Manager Audit" and "End of Day" are the appropriate English equivalents, matching the proposed page headings.
  - Evidence: `AppNav.tsx` lines 99–100.

- Q: Is `toLocaleString("it-IT")` in ManagerAuditContent in scope?
  - A: No. This formats date/time values using Italian locale conventions (day/month/year order, comma decimal separators in numbers). It is a formatting preference, not a UI label. The operator's policy covers label language, not date format locale. Out of scope.
  - Evidence: `ManagerAuditContent.tsx` line 42.

- Q: Does `"Alloggiati"` in AppNav and ManModal need to be translated to English?
  - A: No. "Alloggiati" is a proper noun — it is the name of the Italian government's "Alloggiati Web" guest registration system (a legal compliance requirement for Italian accommodation providers). There is no English equivalent; translating it would be incorrect and confusing for operators who must interact with the official system. It is excluded from scope.
  - Evidence: `AppNav.tsx` line 95; `ManModal.tsx` line 19; context: Alloggiati Web is a mandatory Italian Ministry of Interior reporting system.

- Q: Does `"Check-in"` need translation?
  - A: No. "Check-in" is an English term used internationally, already used consistently across English screens (TillShiftHistory, nav labels). The compound `{n} check-in oggi` is the only Italian form — the word "oggi" (today) needs translation; "check-in" stays.
  - Evidence: `ManagerAuditContent.tsx` line 248; `AppNav.tsx` line 99 (route name `/manager-audit`).

### Open (Operator Input Required)

None — all decision points are resolved from documented policy and code evidence.

## Confidence Inputs

- **Implementation: 97%**
  - Evidence: All target strings are identified by file and line number. The change pattern is simple inline string replacement with no logic changes. No external dependencies involved.
  - What raises to >=90: Already at 97%.

- **Approach: 95%**
  - Evidence: English-only inline strings is the established pattern in older screens (confirmed in TillShiftHistory, CloseShiftForm, StockManagement). No i18n framework exists; no constants layer is required. The approach matches existing conventions exactly.
  - What raises to >=90: Already at 95%.

- **Impact: 92%**
  - Evidence: All five production files and three test files are fully identified and audited. BATCH_REASON (stored DB value) confirmed out of scope. StockManagement.test.tsx confirmed by grep to have no assertion on "Inizia conteggio batch". AppNav Modals.test.tsx confirmed to mock withIconModal — no label string assertions. All test update scope is known with precision.
  - What raises to >=95: Full exhaustive read of StockManagement.test.tsx to rule out any other Italian string assertions in that file.

- **Delivery-Readiness: 95%**
  - Evidence: Scope is fully bounded. No new dependencies, no schema changes, no API changes, no build config changes. Delivery is string replacements + test sync only.
  - What raises to >=90: Already at 95%.

- **Testability: 95%**
  - Evidence: All existing tests are active (no describe.skip). Test coverage is comprehensive. String changes are directly verifiable by running the existing test suite after updates.
  - What raises to >=90: Already at 95%.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Test selectors break on button name changes | Medium | Low | `getByRole("button", { name: ... })` in BatchStockCount tests uses accessible text. Update all 8 occurrences in sync with the component. |
| StockManagement test asserts on "Inizia conteggio batch" | Low | Low | Verify `StockManagement.test.tsx` at build start; add to test-update scope if found. |
| AppNav test asserts on "Controllo" or "Chiusura" | None | None | Confirmed resolved: `Modals.test.tsx` mocks `withIconModal` fully — no assertions on real nav label strings. Nav label changes will not break any existing AppNav test. |
| BATCH_REASON value accidentally changed | Low | Medium | Make it explicit in the plan: BATCH_REASON (`"conteggio batch"`) is a Firebase-stored data value and must not be touched. Only the UI display labels change. |
| Italian category names in Firebase data treated as in scope | Low | Low | Category names ("Bar", "Cucina") are user-entered data values stored in Firebase, not UI labels. They are out of scope and not affected by this change. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Inline string replacement only — no i18n library, no string constants file, no new abstractions.
  - Update test files in the same PR/commit as source files — do not leave tests asserting on stale Italian strings.
  - BATCH_REASON constant (`"conteggio batch"`) must not be changed — it is a database-stored value, not a UI label.
  - UNCATEGORIZED_LABEL must be changed from `"Senza categoria"` to `"Uncategorized"` (or similar English equivalent) in the constant declaration; all test assertions on the old value must be updated.
- Rollout/rollback expectations:
  - This is a cosmetic UI change with no data model impact. Rollback is a revert of the affected files — low risk.
- Observability expectations:
  - None — no analytics events, no feature flags, no logging changes required.

## Suggested Task Seeds (Non-binding)

- TASK-01: Translate Italian strings in BatchStockCount.tsx — update UNCATEGORIZED_LABEL constant, all JSX text, and PasswordReauthModal props.
- TASK-02: Update BatchStockCount.test.tsx — update all Italian string assertions and button-name selectors to match new English labels.
- TASK-03: Translate Italian strings in ManagerAuditContent.tsx — update page heading, section headings, table headers, status formatters, loading/error/empty states.
- TASK-04: Update ManagerAuditContent.test.tsx — update all Italian string assertions.
- TASK-05: Translate Italian strings in EodChecklistContent.tsx — update page heading, section headings, loading states, status text.
- TASK-06: Update EodChecklistContent.test.tsx — update `toHaveTextContent` assertions.
- TASK-07: Translate "Inizia conteggio batch" button in StockManagement.tsx; verify StockManagement.test.tsx for that string.
- TASK-08: Translate AppNav.tsx nav labels "Controllo" → "Manager Audit" and "Chiusura" → "End of Day"; verify AppNav tests.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - All Italian-only strings in the five production files replaced with English (per the string inventory in this brief).
  - All three test files updated to assert on new English labels.
  - `pnpm typecheck && pnpm lint` passes for the reception package.
  - CI test run passes with no new failures on the affected paths.
- Post-delivery measurement plan:
  - Operator review of the three screens (BatchStockCount, ManagerAuditContent, EodChecklistContent) confirms all visible text is English.
  - No follow-up measurement hooks required — this is an operational fix with binary success criterion.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| BatchStockCount.tsx — Italian string inventory | Yes | None | No |
| ManagerAuditContent.tsx — Italian string inventory | Yes | None | No |
| EodChecklistContent.tsx — Italian string inventory | Yes | None | No |
| StockManagement.tsx — mixed-language button | Yes | None | No |
| AppNav.tsx — nav label strings | Yes | None | No |
| BATCH_REASON constant — Firebase stored value boundary | Yes | None | No |
| UNCATEGORIZED_LABEL — test assertion dependency | Yes | Minor: test assertions on "Senza categoria" exist in 4 BatchStockCount test cases; must be updated in same commit | No (documented in test update tasks) |
| Test file update scope — BatchStockCount.test.tsx | Yes | Minor: `getByRole("button", { name: "Completa categoria" })` used as selector in 8 test cases; must be updated in sync | No (documented in TASK-02) |
| Test file update scope — ManagerAuditContent.test.tsx | Yes | None | No |
| Test file update scope — EodChecklistContent.test.tsx | Yes | None | No |
| StockManagement.test.tsx — "Inizia conteggio batch" assertion | Yes | None — confirmed by grep: no assertion on this string in StockManagement.test.tsx. No test update needed for the button label change. | No |
| AppNav tests — "Controllo"/"Chiusura" assertion | Yes | None — `Modals.test.tsx` confirmed: `withIconModal` is fully mocked, no assertions on real nav label strings. Nav label changes will not break AppNav tests. | No |
| Integration boundaries (Firebase, auth) | Yes | None — no integration boundaries touched by display string changes | No |
| Ordering — component changes before test changes | Yes | None — tasks are grouped component+test to avoid broken intermediate state | No |

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity:** Every Italian string is cited by exact file path and line number. The complete string inventory (5 files) covers all Italian-language UI strings across the three Italian-only screens, the parent screen launch button, and the nav labels. Two strings initially missed (`Unità` line 345 in BatchStockCount, `Data` line 149 in ManagerAuditContent) were added during Round 1 critique review.
2. **Boundary coverage:** Firebase write boundary was inspected — confirmed BATCH_REASON is a stored ledger value not to be changed. Auth boundaries (canAccess, Permissions) are not affected by text changes.
3. **Testing/validation coverage:** All three component test files were read in full. AppNav `Modals.test.tsx` was verified — `withIconModal` HOC is fully mocked; no assertions on real nav label strings. Italian string assertion sites in tests are identified by line number. The gap on StockManagement.test.tsx is noted with a build-start check.
4. **Scope boundary — Alloggiati:** The term "Alloggiati" in AppNav and ManModal was evaluated and confirmed out of scope — it is a proper noun (Italian government regulatory system name) with no English equivalent.
5. **Circular investigation dependency:** None exists — language of UI strings does not depend on any other investigation finding.
6. **Missing domain coverage:** Nav labels were discovered as an additional scope item during investigation (AppNav.tsx) and are included. This was not in the original dispatch location anchors.

### Confidence Adjustments

- Impact confidence set to 92%: AppNav test coverage confirmed safe (Modals.test.tsx fully mocks withIconModal, no label string assertions). StockManagement.test.tsx confirmed by grep to have no assertion on "Inizia conteggio batch". All test update scope is precisely bounded.
- No other adjustments — the change is bounded, well-evidenced, and follows established patterns.

### Remaining Assumptions

- The `"it-IT"` locale in `formatDateTime` is intentional and out of scope (undocumented but inferred from operator preference for Italian date display).
- Category names in Firebase data ("Bar", "Cucina") are user-entered values, not UI labels, and are out of scope. This is treated as a constraint, not an assumption.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan brik-reception-language-english-default --auto`
