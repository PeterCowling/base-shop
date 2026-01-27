# Guide Content Readiness Testing

Tools for validating guide content quality, translation coverage, and data integrity in the brikette app.

## Quick Start

```bash
pnpm --filter @apps/brikette test:content-readiness
```

## What It Tests

The `test:content-readiness` command runs all tests related to guide content quality:

| Test File | Purpose |
|-----------|---------|
| `i18n-render-audit.test.ts` | Scans locales for placeholder phrases |
| `placeholder-detection.test.ts` | Unit tests for placeholder detection |
| `guide-manifest.draft-status.test.ts` | Ensures all guides have manifest entries |
| `guide-manifest-overrides.test.ts` | Validates manifest override mechanism |
| `guide-namespace-migration.test.ts` | Verifies namespace assignments |
| `assistanceGuideKeys.test.ts` | Validates assistance guide key mapping |
| `structured-toc-block.policy.test.tsx` | TOC block structure validation |

**Output:** 95 tests across 8 test suites covering translation completeness, manifest integrity, and guide data structure.

## Strict Mode

By default, tests pass but report any placeholder phrases found. To fail on placeholder phrases:

```bash
I18N_MISSING_KEYS_MODE=fail pnpm --filter @apps/brikette test:content-readiness
```

## CI Usage

```yaml
- name: Content readiness tests
  run: pnpm --filter @apps/brikette test:content-readiness
  continue-on-error: true
```

## Understanding the Output

### Placeholder Report

```
Total findings: 1327
Locales with issues: 2

pl (654 issues):
  guides/content/cuisineAmalfiGuide: 15
    - "Tłumaczenie w przygotowaniu."
    ...
```

This means Polish has 654 placeholder phrases across guide content files that need translation.

## Related Files

**Test Files:**
- `src/test/i18n/i18n-render-audit.test.ts`
- `src/test/routes/guides/__tests__/placeholder-detection.test.ts`
- `src/test/routes/guides/__tests__/guide-manifest.draft-status.test.ts`
- `src/test/routes/guides/__tests__/guide-manifest-overrides.test.ts`
- `src/test/routes/guides/__tests__/guide-namespace-migration.test.ts`
- `src/test/data/assistanceGuideKeys.test.ts`

**Utilities:**
- `src/test/utils/detectRenderedI18nPlaceholders.ts`

**Plans:**
- `docs/plans/i18n-missing-key-detection-plan.md`
- `docs/plans/fix-placeholder-translations-plan.md`
