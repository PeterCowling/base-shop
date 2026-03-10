---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26 (all tasks complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-rounded-lg-lint-rule
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception: rounded-lg Lint Rule Plan

## Summary

Adds a new `ds/no-bare-rounded` ESLint rule to the `@acme/eslint-plugin-ds` package that flags bare `rounded` Tailwind classes (which must always be `rounded-lg` in the reception app). The rule is enabled for `apps/reception/src/**` at error level. All ~100 existing violations across 34 files are then bulk-fixed using ESLint `--fix`. This prevents the bare-`rounded` recurrence that was found in all four phases of the reception UI polish.

## Active tasks
- [x] TASK-01: Write `ds/no-bare-rounded` rule, register in plugin, build
- [x] TASK-02: Enable rule in `eslint.config.mjs` for reception app
- [x] TASK-03: Bulk-fix all bare `rounded` violations in `apps/reception/src/`
- [x] TASK-04: Verify lint and typecheck pass clean

## Goals
- Block new bare `rounded` occurrences in `apps/reception/src/` at commit time
- Eliminate all ~100 existing violations across 34 files
- Keep correct usage (`rounded-lg`, `rounded-full`, etc.) unaffected

## Non-goals
- Enforcing `rounded-lg` across other apps (brikette, business-os, etc.)
- Migrating `rounded-full` or `rounded-md` to `rounded-lg` where semantically different
- Rewriting component APIs to use shape/radius props (`resolveShapeRadiusClass()`)
- Banning `rounded-sm` / `rounded-md` (deferred pending operator confirmation)

## Constraints & Assumptions
- Constraints:
  - The existing `ds/no-hardcoded-rounded-class` rule flags ALL `rounded*` classes including `rounded-lg` — do NOT enable or modify it for this purpose
  - Plugin must be rebuilt (`pnpm --filter @acme/eslint-plugin-ds build`) before the config can use the new rule
  - `no-console: "off"` in the reception config is unrelated to this change
- Assumptions:
  - ESLint `--fix` handles most violations; a small number with `confident: false` parse may need manual replacement
  - `rounded-full` is used intentionally for pill/circular shapes — the new rule must not flag it

## Inherited Outcome Contract

- **Why:** Bare `rounded` violations recurred in every phase of reception UI polish (12+ per phase); no automated gate exists. Manual fix passes are not sustainable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `ds/no-bare-rounded` rule added to the plugin and enabled for `apps/reception/src/**`. Zero bare-`rounded` violations remain. Rule runs in CI.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/reception-rounded-lg-lint-rule/fact-find.md`
- Key findings used:
  - `ds/no-hardcoded-rounded-class` already exists but is wrong semantics — confirmed from rule source
  - ~100 violations across 34 files — enumerated by explore agent
  - Plugin index registration pattern — confirmed: import camelCase, add to `export const rules` object in `packages/eslint-plugin-ds/src/index.ts`
  - LINT-01 reception config block is at `eslint.config.mjs:2383`
  - `extractFromJsxAttribute` utility at `packages/eslint-plugin-ds/src/utils/classParser.js` is reusable

## Proposed Approach
- Option A: Enable `ds/no-hardcoded-rounded-class` with an allow-list — rejected; rule has `schema: []` (no config options) and its semantics push `resolveShapeRadiusClass()` pattern not used in reception
- Option B: `no-restricted-syntax` AST selector — rejected; cannot parse template literals and clsx/cn() calls reliably
- **Chosen approach: Option C** — New `ds/no-bare-rounded` rule in the plugin. ~40 lines, direct pattern copy from `no-hardcoded-rounded-class.ts`, includes auto-fix to `rounded-lg`, flags only exact bare `rounded` token.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Write `ds/no-bare-rounded` rule + register + build plugin | 85% | S | Complete (2026-02-26) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Enable rule in `eslint.config.mjs` reception block | 90% | S | Complete (2026-02-26) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Bulk-fix ~100 bare `rounded` violations across 34 files | 80% | M | Complete (2026-02-26) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Verify lint + typecheck pass clean | 95% | S | Complete (2026-02-26) | TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | New rule file + plugin build |
| 2 | TASK-02 | TASK-01 complete | Config edit only |
| 3 | TASK-03 | TASK-02 complete | Bulk fix; CI will fail until complete |
| 4 | TASK-04 | TASK-03 complete | Final verification |

## Tasks

---

### TASK-01: Write `ds/no-bare-rounded` rule + register in plugin + build
- **Type:** IMPLEMENT
- **Deliverable:** New rule file + plugin index update + compiled plugin
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** Rule written at `packages/eslint-plugin-ds/src/rules/no-bare-rounded.ts` (52 lines); registered in `index.ts` (import + `"no-bare-rounded"` entry); `pnpm --filter @acme/eslint-plugin-ds build` → 0 errors; 11/11 RuleTester tests pass (TC-01-01 through TC-01-04 all verified, plus 7 additional valid/invalid cases). Auto-fix confirmed: `"border rounded px-2"` → `"border rounded-lg px-2"`, `"hover:rounded"` → `"hover:rounded-lg"`.
- **Affects:** `packages/eslint-plugin-ds/src/rules/no-bare-rounded.ts` (new), `packages/eslint-plugin-ds/src/index.ts`, `packages/eslint-plugin-ds/tests/no-bare-rounded.spec.ts` (new), `[readonly] packages/eslint-plugin-ds/src/rules/no-hardcoded-rounded-class.ts` (reference only)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% — rule is ~40 lines using the same `JSXAttribute` visitor and `extractFromJsxAttribute` utility as the existing rules; auto-fix is a straightforward token replacement
  - Approach: 90% — new focused rule is clearly superior to alternatives (existing rule semantics wrong, `no-restricted-syntax` can't handle template literals)
  - Impact: 85% — rule will catch bare `rounded` at AST level; slight discount because auto-fix edge cases for `confident: false` expressions are untested until runtime
- **Acceptance:**
  - `no-bare-rounded.ts` exists in `packages/eslint-plugin-ds/src/rules/`
  - Rule is registered in `packages/eslint-plugin-ds/src/index.ts` (import + rules object entry)
  - `pnpm --filter @acme/eslint-plugin-ds build` exits 0 with no TypeScript errors
  - TC-01-01 and TC-01-02 pass (see validation contract)
- **Validation contract (TC-01):**
  - TC-01-01: `className="border rounded px-2 py-1"` → rule reports `noHardcodedBareRounded` error on `rounded`; auto-fix changes to `className="border rounded-lg px-2 py-1"`
  - TC-01-02: `className="border rounded-lg px-2 py-1"` → rule reports no error (allow all `rounded-*` scale variants)
  - TC-01-03: `className="rounded-full"` → no error (pill/circular shapes are valid)
  - TC-01-04: `className="hover:rounded"` → rule reports error on the bare `rounded` token (variant prefixes do not exempt the base class)
- **Execution plan:** Red → Green → Refactor
  - **Red:** *(Build-time TDD — executed by lp-do-build, not committed as a failing test in planning mode)* Create `no-bare-rounded.ts`; write RuleTester test with TC-01-01 as invalid case → test fails (rule not yet implemented)
  - **Green:** Implement rule — flag only bare `rounded` token (not `rounded-lg`, `rounded-sm`, `rounded-full`, etc.); add auto-fix returning `fixer.replaceText` substituting `rounded` → `rounded-lg` in the matched class string; add import + `"no-bare-rounded": noBareRounded` entry to `index.ts`; run `pnpm --filter @acme/eslint-plugin-ds build` → exits 0
  - **Refactor:** Verify TC-01-02, TC-01-03, TC-01-04 all pass; clean up any lint warnings in the new file
- **Scouts:** `extractFromJsxAttribute` API confirmed via `no-hardcoded-rounded-class.ts` usage; returns `{ confident: boolean; classes: string[] }`; safe to reuse
- **Edge Cases & Hardening:** `confident: false` expressions — rule should still report (no auto-fix), so the violation surfaces for manual review; bare `rounded` in non-className attributes (e.g., `data-class`) — `JSXAttribute` visitor already guards on `name.name === "className" || name.name === "class"` (copy from existing rule)
- **What would make this >=90%:**
  - Verify that auto-fix handles template literal cases correctly via RuleTester (would add TC-01-05 template literal case)
- **Rollout / rollback:**
  - Rollout: rule is inactive until TASK-02 enables it in config
  - Rollback: revert `index.ts` import + rules entry; revert `no-bare-rounded.ts` (delete)
- **Documentation impact:**
  - None: internal lint tooling change; no user-facing docs affected
- **Notes / references:**
  - Model on `packages/eslint-plugin-ds/src/rules/no-hardcoded-rounded-class.ts`
  - `isRoundedClass` in that file matches ALL `rounded*` — new rule needs a narrower test: exactly `/^rounded$/` (without `-*` variants)
  - Import extension in index.ts must be `.js` not `.ts` (ESM convention used by entire file)

---

### TASK-02: Enable `ds/no-bare-rounded: "error"` in `eslint.config.mjs`
- **Type:** IMPLEMENT
- **Deliverable:** Single-line addition to LINT-01 reception block in `eslint.config.mjs`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `eslint.config.mjs`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 95% — single line addition to an existing, well-understood config block; pattern identical to other `ds/` rules already in the block
  - Approach: 95% — the LINT-01 block at line 2383 is the only correct place for reception-scoped DS rules
  - Impact: 90% — CI will fail with ~100 errors until TASK-03 fixes violations; this is expected and documented
- **Acceptance:**
  - `"ds/no-bare-rounded": "error"` present in the `apps/reception/src/**/*.{ts,tsx}` config block
  - `pnpm --filter @acme/eslint-plugin-ds build` already passed (TASK-01 prerequisite)
  - Running `pnpm lint --filter reception` produces errors for bare `rounded` violations (expected, confirms rule is active)
  - TC-02-01 passes
- **Validation contract (TC-02):**
  - TC-02-01: `pnpm lint` run against `apps/reception/src/components/loans/LoanModal.tsx` (known high-violation file) reports `ds/no-bare-rounded` errors → confirms rule is active and firing
- **Execution plan:** Red → Green → Refactor
  - **Red:** Rule not yet in config; `pnpm lint` against reception produces no `no-bare-rounded` errors
  - **Green:** Add `"ds/no-bare-rounded": "error",` with comment `/* Design standard: bare 'rounded' must be 'rounded-lg' — see Phase 1-4 polish plans */` to the LINT-01 reception block; run lint → errors appear as expected
  - **Refactor:** None required — config addition is complete
- **Scouts:** None — config block structure and exact insertion point confirmed from fact-find
- **Edge Cases & Hardening:** If the plugin was not rebuilt in TASK-01, this step will fail with "rule not found" — prerequisite is hard; `pnpm --filter @acme/eslint-plugin-ds build` must complete first
- **What would make this >=90%:** Already at 90%. The only discount is the expected CI failure from violations — intentional, not a risk.
- **Rollout / rollback:**
  - Rollout: single-line config addition
  - Rollback: remove the line; CI passes again immediately
- **Documentation impact:**
  - None — rule comment in config is self-documenting
- **Notes / references:**
  - Insert after the `"ds/no-raw-spacing": "error"` entry in the LINT-01 block (use the string as the anchor, not a line number — the file may shift)

---

### TASK-03: Bulk-fix all bare `rounded` violations in `apps/reception/src/`
- **Type:** IMPLEMENT
- **Deliverable:** All ~100 bare `rounded` className instances replaced with `rounded-lg` across 34 files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/man/DateSelectorAllo.tsx`, `apps/reception/src/components/loans/LoanModal.tsx`, `apps/reception/src/components/loans/LoanFilters.tsx`, `apps/reception/src/components/loans/DateSel.tsx`, `apps/reception/src/components/loans/KeycardsModal.tsx`, `apps/reception/src/components/loans/LoanableItemSelector.tsx`, `apps/reception/src/components/safe/BankDepositForm.tsx`, `apps/reception/src/components/safe/SafeOpenForm.tsx`, `apps/reception/src/components/safe/PettyCashForm.tsx`, `apps/reception/src/components/appNav/AppNav.tsx`, `apps/reception/src/components/appNav/CurrentPageIndicator.tsx`, `apps/reception/src/components/prepare/CleaningPriorityTable.tsx`, `apps/reception/src/components/prepare/DateSelectorPP.tsx`, `apps/reception/src/components/till/CreditSlipRegistry.tsx`, `apps/reception/src/components/till/CloseShiftForm.tsx`, `apps/reception/src/components/till/CreditCardReceiptCheck.tsx`, `apps/reception/src/components/till/ActionButtons.tsx`, `apps/reception/src/components/till/ReturnKeycardsModal.tsx`, `apps/reception/src/components/till/AddKeycardsModal.tsx`, `apps/reception/src/components/till/DenominationInput.tsx`, `apps/reception/src/components/till/VarianceSignoffModal.tsx`, `apps/reception/src/components/till/KeycardCountForm.tsx`, `apps/reception/src/components/till/FloatEntryModal.tsx`, `apps/reception/src/components/till/VoidTransactionModal.tsx`, `apps/reception/src/components/till/EditTransactionModal.tsx`, `apps/reception/src/components/till/TenderRemovalModal.tsx`, `apps/reception/src/components/till/ActionDropdown.tsx`, `apps/reception/src/components/checkout/DaySelector.tsx`, `apps/reception/src/components/search/EditableBalanceCell.tsx`, `apps/reception/src/components/search/BookingSearchTable.tsx`, `apps/reception/src/components/search/FinancialTransactionAuditSearch.tsx`, `apps/reception/src/components/search/FinancialTransactionSearch.tsx`, `apps/reception/src/components/common/FormContainer.tsx`, `apps/reception/src/components/common/CashCountingForm.tsx`, `apps/reception/src/components/inventory/StockManagement.tsx`, `apps/reception/src/components/prepayments/EntryDialogue.tsx`, `apps/reception/src/components/prepayments/CheckInDateChip.tsx`, `apps/reception/src/components/prepayments/HoursChip.tsx`, `apps/reception/src/components/prepayments/BookingPaymentsLists.tsx`, `apps/reception/src/components/checkins/tooltip/Tooltip.tsx`, `apps/reception/src/components/bar/ModalPreorderDetails.tsx`, `apps/reception/src/components/emailAutomation/EmailProgressLists.tsx`, `apps/reception/src/components/emailAutomation/ArrivalDateChip.tsx`, `apps/reception/src/components/emailAutomation/TimeElapsedChip.tsx`, `apps/reception/src/components/reports/VarianceSummary.tsx`, `apps/reception/src/components/reports/RealTimeDashboard.tsx`, `apps/reception/src/components/roomgrid/BookingDetailsModal.tsx`, `apps/reception/src/components/roomgrid/_BookingTooltip.tsx`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 80%
  - Implementation: 80% — ESLint `--fix` handles the majority of simple string-literal violations automatically; edge cases where `extractFromJsxAttribute` returns `confident: false` surface as lint errors without auto-fix and need manual string replacement; held-back test: if auto-fix implementation has a bug in TASK-01, this task reverts to full manual search/replace — but that scenario is TASK-01's responsibility, not this task's
  - Approach: 80% — `pnpm eslint --fix apps/reception/src/` is the primary method; fallback is targeted sed/search-replace for remaining errors
  - Impact: 90% — all violation locations are enumerated; fix is mechanical
- **Acceptance:**
  - `pnpm --filter reception lint` (or `pnpm lint` scoped to reception) reports zero `ds/no-bare-rounded` errors
  - TC-03-01 and TC-03-02 pass
- **Validation contract (TC-03):**
  - TC-03-01: After fix pass, `pnpm lint` against `apps/reception/src/` exits 0 with zero `ds/no-bare-rounded` errors
  - TC-03-02: Spot-check 3 previously-flagged files (`LoanModal.tsx`, `CloseShiftForm.tsx`, `StockManagement.tsx`) — each now contains `rounded-lg` where `rounded` appeared before; no `rounded-full` was changed
- **Execution plan:** Red → Green → Refactor
  - **Red:** After TASK-02, `pnpm lint` shows ~100 `ds/no-bare-rounded` errors (TASK-02 left CI in this expected-failing state)
  - **Green:** Run `pnpm eslint --fix apps/reception/src/ --rule 'ds/no-bare-rounded: error'`; check remaining errors; for any `confident: false` edge cases, manually replace bare `rounded` with `rounded-lg` in the affected className strings; run `pnpm lint` → 0 `no-bare-rounded` errors
  - **Refactor:** Verify no `rounded-full` was changed to `rounded-lg` (TC-03-02 spot-check); verify no other DS rules were regressed
- **Planning validation (required for M):**
  - Checks run: full violation list enumerated by explore agent (34 files, ~100 lines)
  - Validation artifacts: violation list in fact-find + plan Affects field above
  - Unexpected findings: none — violations are consistent bare-`rounded` patterns
- **Scouts:** All violations are in JSX `className` attributes (no programmatic `clsx`/`cn` calls with bare `rounded` found by explore agent — grep of violations shows 0 programmatic occurrences)
- **Edge Cases & Hardening:** `rounded-full` must NOT be changed; `rounded` inside a CSS variable name or attribute value other than `className` must not be affected (AST-level rule guard handles this); if `--fix` command fails silently, run `git diff` to confirm changes were applied
- **What would make this >=90%:**
  - Confirm auto-fix works correctly on a subset of files first (run --fix on one file, verify output, then apply to all 34)
- **Rollout / rollback:**
  - Rollout: changes are visual-only (border-radius CSS) on an internal staff tool; no user-facing impact
  - Rollback: `git checkout apps/reception/src/` to restore pre-fix state if needed
- **Documentation impact:**
  - None: class-level visual change; no API or component interface changes
- **Notes / references:**
  - Affected file list above is the exhaustive enumeration from fact-find; confirm with `git diff --stat` after fix

---

### TASK-04: Verify lint and typecheck pass clean
- **Type:** IMPLEMENT
- **Deliverable:** Verified clean state — zero lint errors + passing typecheck
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** None (read-only verification task)
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — all verification commands are known and deterministic
  - Approach: 95% — standard lint + typecheck gates
  - Impact: 95% — confirms no regressions introduced across the reception build
- **Acceptance:**
  - TC-04-01, TC-04-02, TC-04-03 all pass
- **Validation contract (TC-04):**
  - TC-04-01: `pnpm --filter reception lint` exits 0
  - TC-04-02: `pnpm typecheck` (or `pnpm --filter reception exec tsc --noEmit`) exits 0
  - TC-04-03: `git grep -n "\brounded\b" apps/reception/src/ | grep -v "rounded-"` returns 0 matches (or each remaining match is reviewed and justified — e.g., a legitimate CSS variable or data attribute)
- **Execution plan:** Red → Green → Refactor
  - **Red:** None — this task is a gate-check; it has no Red phase
  - **Green:** Run TC-04-01, TC-04-02, TC-04-03 in sequence; if any fail, return to TASK-03 to address remaining violations
  - **Refactor:** None required
- **Planning validation:** Not required (S-effort verification task)
- **Scouts:** None
- **Edge Cases & Hardening:** `git grep` pattern `"\brounded\b"` may match `rounded-` — use the `| grep -v "rounded-"` filter; any remaining match after filter should be inspected (may be in a comment, an auto-generated file, or a valid exception)
- **What would make this >=90%:** Already at 95%
- **Rollout / rollback:**
  - Rollout: no changes; gate check only
  - Rollback: N/A
- **Documentation impact:**
  - None
- **Notes / references:**
  - If TC-04-02 fails (typecheck), check for TypeScript errors introduced by `rounded-lg` replacements — extremely unlikely (className strings are untyped) but worth confirming

---

## Risks & Mitigations
- Auto-fix misses some `confident: false` template-literal expressions → manual replacement for remaining violations in Green phase of TASK-03; TC-03-01 will catch any remaining errors
- Plugin rebuild not run before TASK-02 → enforced by TASK-01 acceptance criteria (build must pass before task is marked complete)
- `rounded-full` accidentally changed to `rounded-lg` by auto-fix → TC-03-02 spot-check explicitly verifies no `rounded-full` was modified; the rule's `isRoundedClass` test for bare `rounded` does not match `rounded-full`

## Observability
- Logging: None — lint tooling only
- Metrics: `ds/no-bare-rounded` error count in CI — goes from ~100 after TASK-02 to 0 after TASK-03
- Alerts/Dashboards: CI lint job — any future `rounded` commit triggers the error gate

## Acceptance Criteria (overall)
- [ ] `pnpm lint` exits 0 with no `ds/no-bare-rounded` errors
- [ ] `pnpm typecheck` exits 0
- [ ] `git grep` returns 0 bare `rounded` matches in `apps/reception/src/`
- [ ] `rounded-full` instances are unchanged
- [ ] `packages/eslint-plugin-ds/src/rules/no-bare-rounded.ts` exists and is registered in `index.ts`

## Decision Log
- 2026-02-26: New `ds/no-bare-rounded` rule chosen over modifying `ds/no-hardcoded-rounded-class` (wrong semantics) or using `no-restricted-syntax` (cannot parse template literals / clsx expressions)
- 2026-02-26: Enable at `error` level immediately (not `warn`) — violation list is fully enumerated and all fixes are mechanical

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: 85% × 1 = 85
- TASK-02: 90% × 1 = 90
- TASK-03: 80% × 2 = 160
- TASK-04: 95% × 1 = 95
- Sum: 430 / 5 = **86%**
