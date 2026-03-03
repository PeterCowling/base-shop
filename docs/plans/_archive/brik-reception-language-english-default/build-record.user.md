---
Type: Build-Record
Status: Complete
Feature-Slug: brik-reception-language-english-default
Completed-date: 2026-02-28
artifact: build-record
---

# Build Record — BRIK Reception Language: English Default

## What Was Built

Four tasks completed in a single Wave 1 parallel pass. All changes are pure inline string replacements — no logic changes, no new abstractions, no i18n framework introduced.

**TASK-01 — BatchStockCount.tsx + test:** Translated all 15 Italian display strings. `UNCATEGORIZED_LABEL` changed from `"Senza categoria"` to `"Uncategorized"`. Loading, error, sync-pending, progress indicator, button label, table headers, variance headers, empty state, and PasswordReauthModal title/instructions all translated to English. `BATCH_REASON` (`"conteggio batch"`) left unchanged — it is a Firebase-stored ledger value. `localeCompare(b, "it")` left unchanged — it controls sort order, not a display label. BatchStockCount.test.tsx updated: all 8 `getByRole("button", { name: "Completa categoria" })` selectors changed to `"Complete category"`, 4 assertions on `"Senza categoria"` changed to `"Uncategorized"`, and all other Italian text assertions updated.

**TASK-02 — ManagerAuditContent.tsx + test:** Translated all 18 Italian strings. `formatShiftStatus` returns `"Open"` and `"Closed"` instead of `"Aperto"` and `"Chiuso"`. Section headings (Stock Variance, Recent Shifts, Check-ins Today), loading states, error messages, empty states, and table headers translated. `toLocaleString("it-IT")` left unchanged — date formatting preference, not a UI label. ManagerAuditContent.test.tsx updated: heading, status, loading, and count assertions changed to English equivalents including `"{n} check-in(s) today"`.

**TASK-03 — EodChecklistContent.tsx + test:** Translated 9 Italian strings. Page heading changed from `"Chiusura Giornata"` to `"End of Day"`. Section headings Till (was "Cassa") and Safe (was "Cassaforte") translated. All three loading and status pairs translated. `"Stock"` heading was already English. EodChecklistContent.test.tsx updated: `toHaveTextContent` assertions on `"Caricamento..."`, `"Completata"`, and `"Incompleta"` changed to `"Loading..."`, `"Complete"`, and `"Incomplete"`. `data-cy` element selectors are unaffected.

**TASK-04 — StockManagement.tsx + AppNav.tsx:** Three strings changed. StockManagement batch count trigger button changed from `"Inizia conteggio batch"` to `"Start batch count"`. AppNav Admin section: `"Controllo"` → `"Manager Audit"` (route `/manager-audit`) and `"Chiusura"` → `"End of Day"` (route `/eod-checklist`). `"Alloggiati"` left unchanged — proper noun for Italian government system. No test updates required (confirmed by grep — StockManagement.test.tsx has no assertion on button label; AppNav Modals.test.tsx mocks withIconModal in full).

## Tests Run

- `pnpm --filter @apps/reception typecheck` — 0 errors (run post-edit)
- `pnpm --filter @apps/reception lint` — 0 errors, 7 pre-existing warnings in unrelated files
- Per testing policy (effective 2026-02-27): Jest tests are CI-only. Local Jest execution not performed. Tests in BatchStockCount.test.tsx, ManagerAuditContent.test.tsx, and EodChecklistContent.test.tsx have been updated to match new English labels.

## Validation Evidence

**TASK-01 (TC-01 through TC-12):** All acceptance criteria met. `UNCATEGORIZED_LABEL = "Uncategorized"` confirmed at line 19. `BATCH_REASON = "conteggio batch"` confirmed unchanged at line 20. All 15 Italian strings replaced. All 8 button selectors and 4 category label assertions updated in test file. Grep confirms no remaining Italian display strings in BatchStockCount.tsx (excluding BATCH_REASON and localeCompare locale).

**TASK-02 (TC-01 through TC-13):** All acceptance criteria met. `formatShiftStatus` returns `"Open"` / `"Closed"`. All 18 Italian strings replaced in source. All Italian assertions in test file updated. `toLocaleString("it-IT")` confirmed unchanged.

**TASK-03 (TC-01 through TC-08):** All acceptance criteria met. All 9 Italian strings replaced. All `toHaveTextContent` assertions updated. `data-cy` attributes confirmed unchanged. `"Stock"` heading confirmed already English — no change made.

**TASK-04 (TC-01 through TC-05):** All acceptance criteria met. StockManagement button renders `"Start batch count"`. AppNav labels `"Manager Audit"` and `"End of Day"` confirmed in HEAD. No test updates required — grep confirmed no test asserts on these strings.

## Scope Deviations

None. All changes were within the planned file set. ManagerAuditContent.test.tsx was a pre-existing file (tracked, not new) — its update was within TASK-02 scope.

## Outcome Contract

- **Why:** Operator policy requires English as the default language across all reception app screens. Newer screens added in February 2026 were written in Italian-only, creating inconsistency with older English-language screens and violating the stated convention.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All reception app screens display English as the primary label; no screen shows Italian as the only UI language; this is codified as a written convention for future work.
- **Source:** auto
