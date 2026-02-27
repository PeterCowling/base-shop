---
Type: Build-Record
Status: Complete
Feature-Slug: prime-hardcoded-copy-i18n-remediation
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record — Prime Hardcoded Copy and i18n Remediation

## Build Summary

Prime now ships with complete en/it i18n coverage across all 11 namespaces and all guest-facing routes. The work confirmed that locale files were already in excellent shape (99.6% IT parity before the build began), meaning the primary scope reduced from a large content-authoring effort to targeted gap-filling and copy migration. All guest-surface hardcoded strings across 23 files were migrated to `t()` calls. Italian translations were added for all new English keys introduced during migration. A new translations-completeness test (22 assertions across 11 namespaces) now guards against future drift in both locales.

## Task Outcomes

| Task | Description | Result | Commit |
|---|---|---|---|
| TASK-01 | ESLint overrides for test and internal-ops files | No-op — overrides already present in `eslint.config.mjs` at lines 2569–2600. Confirmed by audit. | — |
| TASK-02 | Audit en/it locale JSON completeness | Completed. Report at `task-02-locale-audit.md`. Findings: 99.6% IT parity (524/524 keys); only 2 IT stubs; `rooms.json` empty in both locales. Rescoped TASK-04/06 from M → S effort. | — |
| TASK-03 | CHECKPOINT — reassess scope from audit | Executed inline. TASK-04 rescored 70% → 90%, TASK-05 75% → 80%, TASK-06 M → S / 70% → 80%. TASK-07 revised: create new test rather than enable a skipped one (no prior test existed). | — |
| TASK-04 | Fix IT stubs + populate rooms.json (en + it) | Fixed `Chat.sendFailed` stub → `"Invio non riuscito"` and `PreArrival.lateCheckin.priorityNotice` stub → `"Avviso prioritario"`. Populated `rooms.json` with 20 keys (10 rooms × name + details) in both locales. Zero IT stubs remain. | f75ffa3a11 |
| TASK-05 | Migrate guest-surface hardcoded copy to i18n | Migrated 23 files across `(guarded)/` routes; added keys to FindMyStay, Homepage, PreArrival, and PositanoGuide namespaces. All guest-surface `ds/no-hardcoded-copy` warnings eliminated. | cb3fa82eec |
| TASK-06 | Translate new EN keys to Italian | Translated all 215 lines of new EN keys across 4 IT locale files (FindMyStay, Homepage, PreArrival, PositanoGuide). Key count parity achieved across all namespaces. | 64594831dc |
| TASK-07 | Add translations-completeness test | Created `translations-completeness.test.ts` with 22 tests — 11 namespaces × 2 assertions (key parity + no stubs). All tests pass for both en and it. | 18b0cd53a5 |

TASK-08 (shared canonical translation source — `packages/prime-translations`) is deferred. It is non-blocking, independent, and below the 70% confidence threshold for inclusion in this build.

## Scope Deviations

- **TASK-01 no-op (controlled):** ESLint overrides for test/internal-ops files were already present from a prior session. No code change required. Confirmed via line-number audit of `eslint.config.mjs`. This is a positive deviation — the work was already done.
- **TASK-03 checkpoint finding (controlled):** The plan expected to un-skip an existing translations-completeness test. Audit revealed no such test existed. TASK-07 was revised to create the test from scratch rather than enable a skipped one. Scope and effort were equivalent (S / 80%).
- **TASK-04 scope reduction (controlled):** Originally estimated M effort for completing English locale content. Audit (TASK-02) found en locale was already complete; only 2 IT stubs and empty `rooms.json` remained. Actual effort was S, consistent with the post-checkpoint rescore.
- **TASK-05 file count (within range):** Migration covered 23 files rather than the estimated 28. The difference reflects files that contained no actionable guest-surface copy after audit.

## Outcome Contract

- **Why:** Prime must support multinational guests; English-only runtime is not acceptable for production.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime ships with complete en/it i18n coverage, zero test-file copy lint warnings, a passing translations-completeness test, and a structural path to full CONTENT_LOCALES expansion.
- **Observed Outcome:** Prime now has complete en/it parity across all 11 namespaces, all guest-surface hardcoded copy migrated to `t()` calls, and a 22-assertion translations-completeness test guarding against future drift. The structural path to CONTENT_LOCALES expansion is in place via the existing `@acme/i18n` constant and the standalone i18next runtime; the shared canonical package (TASK-08) remains as a follow-up architectural step.
