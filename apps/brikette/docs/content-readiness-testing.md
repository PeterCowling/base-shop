# Guide Content Readiness Testing

Tools for validating guide content quality, translation coverage, and data integrity in the brikette app.

## Quick Start

```bash
pnpm --filter @apps/brikette test:content-readiness
```

### Scope to experiences guides only

```bash
GUIDE_AREA=experience pnpm --filter @apps/brikette test:content-readiness
```

## What It Tests

The `test:content-readiness` command runs all tests related to guide content quality:

| Test File | Purpose |
|-----------|---------|
| `i18n/i18n-render-audit.test.ts` | Scans locale JSON for placeholder phrases (warn-only by default) |
| `i18n/guide-english-fallbacks.test.ts` | Reports English strings copied into non-en guide locales (warn-only by default) |
| `i18n/raw-content-key-tokens.test.ts` | Fails if `content.*` placeholder tokens appear as values in non-en guide content |
| `i18n/i18n-parity-quality-audit.test.ts` | Compares locale JSON vs EN for missing/extra files + structural drift; includes a dedicated guide-content structure audit (warn-only by default) |
| `i18n/json-parse.test.ts` | Ensures every locale JSON file parses (hard fail) |
| `i18n/check-i18n-coverage.test.ts` | Tests the i18n coverage CLI output + `--fail-on-missing` behavior |
| `guides/content-schema.test.ts` | Unit tests for the shared guide content Zod schema |
| `guides/placeholder-detection.test.ts` | Unit tests for placeholder detection used by guide diagnostics/SEO |
| `guides/guide-manifest*.test.ts` | Guardrails for manifest completeness + override schema |
| `guides/structured-toc-block.policy.test.tsx` | TOC block structure/policy validation |
| `data/assistanceGuideKeys.test.ts` | Validates assistance guide key mapping |

All content-readiness tests live under `src/test/content-readiness/`.

## Strict Mode

By default, non-blocking audits **warn** but do not fail (to keep the suite useful while translation work is in flight). To make audits fail:

```bash
CONTENT_READINESS_MODE=fail pnpm --filter @apps/brikette test:content-readiness
```

You can also target specific checks:

- Placeholder phrases: `I18N_MISSING_KEYS_MODE=fail`
- English fallback copies: `ENGLISH_FALLBACK_MODE=fail` (or bypass with `ALLOW_EN_FALLBACKS=1`)
- Parity/quality audit: `I18N_PARITY_MODE=fail`

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
- `src/test/content-readiness/i18n/i18n-render-audit.test.ts`
- `src/test/content-readiness/i18n/guide-english-fallbacks.test.ts`
- `src/test/content-readiness/i18n/raw-content-key-tokens.test.ts`
- `src/test/content-readiness/i18n/i18n-parity-quality-audit.test.ts`
- `src/test/content-readiness/i18n/json-parse.test.ts`
- `src/test/content-readiness/i18n/check-i18n-coverage.test.ts`
- `src/test/content-readiness/i18n/detectRenderedI18nPlaceholders.test.ts`
- `src/test/content-readiness/guides/placeholder-detection.test.ts`
- `src/test/content-readiness/guides/content-schema.test.ts`
- `src/test/content-readiness/guides/guide-manifest.status.test.ts`
- `src/test/content-readiness/guides/guide-manifest-completeness.test.ts`
- `src/test/content-readiness/guides/guide-manifest-overrides.test.ts`
- `src/test/content-readiness/guides/guide-manifest-overrides.node.test.ts`
- `src/test/content-readiness/guides/guide-namespace-migration.test.ts`
- `src/test/content-readiness/guides/structured-toc-block.policy.test.tsx`
- `src/test/content-readiness/data/assistanceGuideKeys.test.ts`

**Utilities:**
- `src/test/utils/detectRenderedI18nPlaceholders.ts`

**Plans:**
- `docs/plans/i18n-missing-key-detection-plan.md`
- `docs/plans/fix-placeholder-translations-plan.md`
