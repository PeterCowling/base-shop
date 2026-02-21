---
Type: Build-Artifact
Status: Complete
Domain: Infra
Created: 2026-02-20
Task-ID: TASK-01
Feature-Slug: turbopack-i18n-alias-retirement
---

# i18n Baseline Freeze (TASK-01)

## Disposition
- Decision: **Revert** in-flight `packages/i18n/src/*` relative-import specifier removals.
- Reason: local extensionless specifier edits previously produced Node ESM resolver failures in `dist`.
- Method: restored `.js` relative specifiers in modified i18n source files to match committed HEAD contract.

## Files Normalized
- `packages/i18n/src/fillLocales.ts`
- `packages/i18n/src/index.ts`
- `packages/i18n/src/loadMessages.server.ts`
- `packages/i18n/src/parseMultilingualInput.ts`
- `packages/i18n/src/resolveText.ts`
- `packages/i18n/src/tokenization/content-filter.ts`
- `packages/i18n/src/tokenization/index.ts`
- `packages/i18n/src/tokenization/pii-scanner.ts`
- `packages/i18n/src/tokenization/tokenizer.ts`
- `packages/i18n/src/useTextResolver.ts`
- `packages/i18n/src/useTranslations.server.ts`
- `packages/i18n/src/useTranslations.ts`

## Validation Evidence
- Command: `pnpm --filter @acme/i18n build`
  - Result: pass
- Command: `cd packages/template-app && node -e "import('@acme/i18n')..."`
  - Result: `ROOT_IMPORT_OK`
- Command: `cd packages/template-app && node -e "import('@acme/i18n/locales')..."`
  - Result: `LOCALES_IMPORT_OK`

## Notes
- No commit SHA captured in this artifact because baseline freeze was applied in working tree during active build cycle.
- Node emitted a deprecation warning during probe for assert import syntax in `packages/i18n/dist/Translations.js`; non-blocking for this task.
