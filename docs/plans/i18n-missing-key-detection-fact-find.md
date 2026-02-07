---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: UI / i18n
Created: 2026-01-27
Last-updated: 2026-01-27
Feature-Slug: i18n-missing-key-detection
Related-Plan: docs/plans/i18n-missing-key-detection-plan.md
---

# i18n Missing Key Detection - Fact-Find Brief

## Scope

### Summary

Users are seeing raw i18n keys rendered on the brikette website instead of translated text. The goal is to improve testing to report all instances of such gaps, enabling developers to catch missing translation issues before they reach production.

### Goals

- Detect raw i18n keys being rendered in the UI
- Report missing translation keys in test output (not necessarily fail tests)
- Cover all content areas (guides, assistance, pages, components)
- Enable visibility into translation gaps across all 18 supported languages

### Non-goals

- Automatically fixing missing translations
- Enforcing 100% translation coverage (some locales are intentionally partial)
- Hard-failing CI on missing keys (user requested reporting, not blocking)

### Constraints & Assumptions

- Constraints:
  - Must not break existing test patterns
  - Should work with the existing react-i18next mock infrastructure
  - Must handle both runtime mocked tests and filesystem-based validation
- Assumptions:
  - English (en) is the complete baseline locale
  - Some locales are intentionally incomplete (gradual rollout)

## Repo Audit (Current State)

### Entry Points

- [i18n.ts](apps/brikette/src/i18n.ts) - Universal i18next bootstrap with lazy loading
- [i18n.config.ts](apps/brikette/src/i18n.config.ts) - Central configuration (18 languages, fallback to en)
- [locale-loader.ts](apps/brikette/src/locales/locale-loader.ts) - Dynamic import system for loading translations

### Key Modules / Files

- [placeholders.ts](apps/brikette/src/routes/guides/guide-seo/content-detection/placeholders.ts) - **Critical**: `isPlaceholderString()` already detects raw keys
- [guide-diagnostics.ts](apps/brikette/src/routes/guides/guide-diagnostics.ts) - Guide completeness analysis using placeholder detection
- [translatorWrapper.ts](apps/brikette/src/routes/guides/guide-seo/components/generic/translatorWrapper.ts) - Contains `isUnresolved()` for detecting unresolved keys
- [check-i18n-coverage.ts](apps/brikette/scripts/check-i18n-coverage.ts) - CLI script for coverage reporting

### Patterns & Conventions Observed

- **Placeholder detection pattern**: `isPlaceholderString(value, key)` checks:
  1. Empty/undefined values
  2. When `value === key` (raw i18n key rendered)
  3. Locale-specific placeholder phrases ("Translation in progress" in 12+ languages)
  - Evidence: [placeholders.ts:34-42](apps/brikette/src/routes/guides/guide-seo/content-detection/placeholders.ts#L34-L42)

- **Fallback behavior**: i18next returns the key itself when translation is missing
  - Config: `fallbackLng: "en"`, `returnNull: false`
  - Evidence: [i18n.config.ts:32-37](apps/brikette/src/i18n.config.ts#L32-L37)

- **Test mocking pattern**: Tests mock `useTranslation()` with dictionaries
  - Evidence: [test/__mocks__/i18n.ts](apps/brikette/src/test/__mocks__/i18n.ts)
  - Issue: Mocks return keys or defaultValue, never revealing missing keys

### Data & Contracts

- Types/schemas:
  - `AppLanguage` - Union of 18 supported language codes
  - `GuideKey` - Type-safe guide identifiers
- Persistence:
  - JSON files in `src/locales/{lang}/` (40+ namespace files per language)
  - Guide content in `src/locales/{lang}/guides/content/` (141 files per language)

### Dependency & Impact Map

- Upstream dependencies:
  - i18next v24.2.3
  - react-i18next v15.5.3
  - i18next-resources-to-backend v1.2.1
- Downstream dependents:
  - All React components using `useTranslation()`
  - Server components using `getTranslations()`
  - Guide rendering pipeline
- Likely blast radius:
  - Test utilities (renderers.tsx, guides.test-utils.tsx)
  - CI scripts (check-i18n-coverage.ts)
  - New test files for validation

### Tests & Quality Gates

- Existing tests:
  - [guide-english-fallbacks.test.ts](apps/brikette/src/test/content-readiness/i18n/guide-english-fallbacks.test.ts) - Checks guides for untranslated English content (40+ char strings)
  - [placeholder-detection.test.ts](apps/brikette/src/test/content-readiness/guides/placeholder-detection.test.ts) - Tests `isPlaceholderString()` logic
  - [check-i18n-coverage.ts](apps/brikette/scripts/check-i18n-coverage.ts) - Reports missing files/keys (does not fail CI by default)
  - Component tests mock translations, bypassing real translation resolution

- Gaps:
  - **No tests validate rendered output for raw i18n keys**
  - No runtime detection of `value === key` in test assertions
  - No E2E/Cypress tests for i18n (Cypress directory doesn't exist)
  - Component tests with mocks can never catch missing keys
  - `check-i18n-coverage.ts` only runs on-demand, not in CI

- Commands/suites:
  - `pnpm test` - Jest tests
  - `pnpm check:i18n-coverage` - Manual coverage report
  - `pnpm check:i18n-coverage --fail-on-missing` - Strict mode (not used in CI)

### Recent Git History (Targeted)

- `src/locales/` - Extensive changes moving assistance articles to guides
- `src/routes/guides/` - Guide content refactoring
- New guide content files added across multiple locales

## External Research (If needed)

- i18next missing key handling: By default returns the key. Can be configured with `missingKeyHandler` but not currently used.
- react-testing-library: Can use `screen.getByText()` to verify text content, but won't detect raw keys unless explicitly checked.

## Questions

### Resolved

- Q: What happens when a translation key is missing?
  - A: i18next returns the key itself as the translation value
  - Evidence: [i18n.config.ts](apps/brikette/src/i18n.config.ts) - no `missingKeyHandler` configured, default behavior is to return key

- Q: Does detection logic already exist for raw keys?
  - A: Yes, `isPlaceholderString()` checks if `value === key`
  - Evidence: [placeholders.ts:38](apps/brikette/src/routes/guides/guide-seo/content-detection/placeholders.ts#L38)

- Q: Why don't current tests catch this?
  - A: Component tests mock `useTranslation()` which returns either the key or a test dictionary, never using real locale files
  - Evidence: [test/__mocks__/i18n.ts](apps/brikette/src/test/__mocks__/i18n.ts)

### Open (User Input Needed)

None - sufficient information gathered to proceed with planning.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 85%
  - `isPlaceholderString()` already handles detection logic
  - Test infrastructure exists (Jest, renderers.tsx)
  - What's missing: Integration into test workflow, utility for scanning rendered text

- **Approach:** 80%
  - Multiple valid approaches exist; recommendation below
  - Options: (1) Post-render scanning utility, (2) CI script enhancement, (3) Snapshot-based detection
  - Slight uncertainty on which approach gives best DX

- **Impact:** 90%
  - Well-scoped to test utilities and CI scripts
  - No production code changes required
  - Clear blast radius

## Planning Constraints & Notes

- Must-follow patterns:
  - Use existing `isPlaceholderString()` for key detection
  - Follow existing test file organization (`src/test/`, `__tests__/`)
  - Maintain consistency with existing i18n test patterns

- Rollout/rollback expectations:
  - Additive changes only (new tests, new utilities)
  - Can be merged incrementally
  - No rollback concerns

- Observability expectations:
  - Test output should clearly list detected raw keys
  - Report should include: locale, namespace, key path, rendered value

## Suggested Task Seeds (Non-binding)

1. **Create `detectRawI18nKeys` test utility**
   - Scan rendered text for strings matching i18n key patterns
   - Use `isPlaceholderString()` for detection logic
   - Return array of detected issues with context

2. **Enhance `check-i18n-coverage.ts` script**
   - Add `--report-only` mode (default) for visibility
   - Output structured report (JSON or markdown)
   - Integrate as optional CI step

3. **Add namespace completeness tests**
   - Test that validates all keys in `en/` exist in other locales
   - Uses existing filesystem-based approach from `guide-english-fallbacks.test.ts`
   - Reports missing keys without hard-failing

4. **Create sample component test demonstrating pattern**
   - Show how to use new utility in component tests
   - Document pattern in test file comments

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: None
- Recommended next step: Proceed to `/plan-feature` to design the test utility and integration approach
