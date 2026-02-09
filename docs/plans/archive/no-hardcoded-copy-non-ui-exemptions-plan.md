---
Type: Plan
Status: Complete
Domain: Platform
Last-reviewed: 2026-01-20
Relates-to charter: none
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-20
Last-updated-by: Claude
---

# No-Hardcoded-Copy Non-UI Exemptions Plan


## Active tasks

No active tasks at this time.

## Problem
The `ds/no-hardcoded-copy` rule is flagging strings that are not customer-facing copy, which forces repeated inline disables. This adds noise and masks real copy issues in UI surfaces that should be localized.

## Patterns Observed
- SEO/JSON-LD helpers and components (schema identifiers, `application/ld+json`, structured data constants).
- CLI scripts and diagnostics output under `scripts/` and `apps/*/scripts/`.
- Locale stub fixtures under `**/locales/**/*.stub/**` used for tests/dev fallbacks.
- Utility class lists and data/test attributes used for editor-only UI or automation hooks.

## Goals
- Reduce unnecessary `ds/no-hardcoded-copy` disables in non-UI areas.
- Keep enforcement intact for user-facing copy.
- Encode exemptions in lint settings or rule heuristics rather than per-file comments.

## Current State (audited 2026-01-20, updated after COPY-01)

**Implemented exemptions in eslint.config.mjs:**
- [x] `apps/brikette/scripts/**` - CLI scripts exempted
- [x] `packages/ui/**` - Temporary broad exemption
- [x] `packages/lib/**`, `packages/editorial/**` - Package exemptions
- [x] `packages/mcp-*/**` - MCP packages exempted
- [x] Test files (`test/msw/**`, `test/shims/**`, Cypress support)
- [x] `**/components/seo/**` - SEO components (SEO-315)
- [x] `**/*StructuredData*.{ts,tsx,js,jsx}` - Structured data files
- [x] `**/utils/seo*.{ts,tsx,js,jsx}` - SEO utilities
- [x] `**/utils/schema/**` - Schema utilities
- [x] `**/locales/**/*.stub/**` - Locale stub fixtures
- [x] `scripts/**` - Root scripts directory

**All path exemptions are now implemented.** COPY-02 can proceed to remove redundant inline disables.

## Plan
1. ~~Update `ds/no-hardcoded-copy` to ignore non-copy attribute values~~ (done via rule config)
2. Add ESLint path-based exemptions for non-UI surfaces:
   - `**/components/seo/**`
   - `**/*StructuredData*.*`
   - `**/utils/seo*.*`
   - `**/utils/schema/**`
   - `**/locales/**/*.stub/**`
   - `scripts/**` and `apps/*/scripts/**`
3. Remove redundant `eslint-disable ds/no-hardcoded-copy` comments in exempted paths.
4. Re-scan remaining disables to verify only user-facing copy or true tech-debt cases remain.

## Risks / Considerations
- Over-broad path exemptions could hide legitimate copy that should be localized. Keep globs tight and limited to known non-UI directories.
- Utility-class heuristics must avoid accidentally ignoring real copy; require token-like patterns and class-like signals.

## Validation
- Run targeted lint checks for touched files/paths when needed.
- Spot-check remaining `eslint-disable ds/no-hardcoded-copy` annotations to ensure they still have value.

## Completed tasks

- [x] **COPY-01** - Add missing path exemptions to eslint.config.mjs
  - Completed: 2026-01-20
  - Added exemptions for:
    - `**/components/seo/**/*.{ts,tsx,js,jsx}`
    - `**/*StructuredData*.{ts,tsx,js,jsx}`
    - `**/utils/seo*.{ts,tsx,js,jsx}`
    - `**/utils/schema/**/*.{ts,tsx,js,jsx}`
    - `**/locales/**/*.stub/**/*.{ts,tsx,js,jsx}`
    - `scripts/**/*.{ts,tsx,js,jsx}`
  - Verified: ESLint now reports "Unused eslint-disable directive" in exempted paths

- [x] **COPY-02** - Remove redundant inline disables in linted paths
  - Completed: 2026-01-20
  - Fixed: `scripts/src/secrets/materialize.ts`, `scripts/src/secrets/validate-ci.ts`
  - Note: Brikette files (SEO, locale stubs) are in global ignores (`apps/brikette/**`), so they aren't linted. Inline disables there are harmless but can be cleaned up opportunistically.

## Notes

- 26 inline disables remain in `apps/brikette/src/components/seo/` - harmless due to global ignore
- 28 inline disables remain in `apps/brikette/src/locales/guides.stub/` - harmless due to global ignore
- When brikette is un-ignored in the future, the path exemptions will apply and `eslint --fix` can auto-remove these
