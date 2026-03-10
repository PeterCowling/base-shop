# Critique History — prime-normalize-locale-constants

## Round 1 (2026-03-09)

- **Route:** codemoot
- **Score:** 7/10 → lp_score 3.5
- **Verdict:** needs_revision
- **Findings:**
  - [Major] Line 84: "per MEMORY.md" justification unsupported — MEMORY.md is not a repo file; claim should rely on `apps/prime/tsconfig.json` evidence directly.
  - [Major] Line 95: Blast-radius summary understated — "two files" omits `package.json`, `tsconfig.json`, `useUnifiedBookingData.ts`, and `useUnifiedBookingData.test.tsx`.
  - [Major] Line 163: Open question contradicts brief — shim-vs-delete has a clear default and is not operator-blocking; should be moved to Resolved.
  - [Major] Line 223: Wrong workspace filter — package is `@apps/prime`, command should be `pnpm --filter @apps/prime typecheck`.

- **Autofixes applied before Round 2:**
  - Removed "per MEMORY.md" references; justified tsconfig paths claim from `apps/prime/tsconfig.json` evidence.
  - Updated blast-radius to list all 6 files in the change set.
  - Moved shim-vs-delete question from Open to Resolved with default assumption documented.
  - Corrected filter to `pnpm --filter @apps/prime typecheck`.

## Round 2 (2026-03-09)

- **Route:** codemoot
- **Score:** 8/10 → lp_score 4.0
- **Verdict:** needs_revision (score ≥ 4.0 → credible gate passed; no Round 3 required)
- **Findings:**
  - [Major] Line 60: Outcome contract not aligned with chosen default — said "imports from @acme" but approach is to delete file and import at call site.
  - [Major] Line 175: Confidence section stale — still mentioned "one open style question" after Open questions were cleared.
  - [Major] Line 223: Acceptance package under-scoped — missing `@acme/i18n` typecheck and lint gates.
  - [Minor] Line 84: Tsconfig path count error — "4 entries" but listed 5 path keys.

- **Autofixes applied:**
  - Updated Outcome Contract Intended Outcome Statement to match delete-and-update-call-site default.
  - Updated Confidence Inputs to remove stale open-question references.
  - Added `@acme/i18n` typecheck and lint to acceptance package.
  - Fixed tsconfig path count from "4 entries" to "5 path keys".

**Final verdict: credible (lp_score 4.0). No Round 3 required.**

---

## Plan Critique — Round 1 (2026-03-09)

- **Route:** codemoot
- **Score:** 7/10 → lp_score 3.5
- **Verdict:** needs_revision
- **Findings:**
  - [Major] Line 125: `pnpm --filter @acme/i18n typecheck` is not a real script; `@acme/i18n/package.json` has no `typecheck` script.
  - [Major] Line 321: Overall acceptance criterion `grep ... SUPPORTED_LOCALES apps/prime/src` impossible — `dateUtils.ts` is out-of-scope but would match.
  - [Major] Line 277: TASK-04 overstates improvement; `language-selector/page.tsx`'s existing `normalizeUiLocale` already handles `'it-IT'` via split-on-hyphen.
  - [Minor] Line 333: Overall-confidence math (88.75 → 87) internally inconsistent.

- **Autofixes applied before Round 2:**
  - Replaced all `pnpm --filter @acme/i18n typecheck` with `pnpm --filter @acme/i18n build`.
  - Scoped grep acceptance criterion to `apps/prime/src/lib/i18n` + `apps/prime/src/app` dirs.
  - Removed incorrect "improvement" claim from TASK-04 user-observable behavior.
  - Fixed confidence calculation: 88.75% → 85% (downward bias rule).

## Plan Critique — Round 2 (2026-03-09)

- **Route:** codemoot
- **Score:** 9/10 → lp_score 4.5
- **Verdict:** APPROVED
- **Findings:**
  - [Minor] Line 167: TASK-02 dependency on TASK-01 is slightly conservative (config edits could precede build). Not blocking — conservative sequencing is safer.

**Final verdict: credible (lp_score 4.5). No Round 3 required. Auto-build eligible.**
