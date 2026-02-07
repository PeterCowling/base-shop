---
Type: Plan
Status: Historical
Domain: Apps
Last-reviewed: 2026-01-24
Relates-to charter: docs/i18n/i18n-charter.md
Created: 2026-01-24
Created-by: Codex (GPT-5)
Last-updated: 2026-01-24
Last-updated-by: Codex (GPT-5)
---

# Plan: Translate the Terms of Sale EU content before re-enabling lint

Source: `apps/cochlearfit` progress report (2026-01-24) + lint gating on text-heavy policy files.


## Active tasks

No active tasks at this time.

## Summary

- The EU Terms of Sale content lives in `apps/cochlearfit/src/components/policies/terms-sale-eu/*` and currently embeds dozens of literal strings. ESLint’s `ds/no-hardcoded-copy` flag forces the package to stay on the global “ignore” list.
- Enabling lint for this app therefore depends on pulling every visible sentence into the existing i18n catalog (`apps/cochlearfit/i18n/*.json`) and wiring the components to consume those keys.

## Problem Statement

- The Terms of Sale copy is lengthy, legally sensitive, and must stay synchronized between English and Italian versions. Hardcoding it violates our `ds/no-hardcoded-copy` policy, so linting cannot be re-enabled for Cochlearfit until the copy is translated and served via the i18n pipeline.
- Simply “disabling” the rule is a short-term hack; the better long-term fix is to integrate the copy into the translation framework, making it safe for the lint baseline and future localization work.

## Tasks

1. Inventory every heading, paragraph, list item, and helper label in `TermsOfSaleEuIntro`, `TermsOfSaleEuPartA/B/C`, and `TermsOfSaleEuContent`, and map it to a unique translation key so the UI strings can be replaced with `t(key)`.
2. Populate `apps/cochlearfit/i18n/en.json`/`it.json` with the new keys and trustworthy translations (Italian should closely mirror the legal tone of the English copy).
3. Refactor the Terms components so they accept a translator (`t`) and read their content from the catalog, and ensure `TermsOfSaleEuContent` forwards the translator wherever it is needed.
4. Run the targeted lint command (`pnpm --filter @apps/cochlearfit lint`) to confirm there are no hardcoded strings and that the app passes with the new translation wiring.

## Acceptance Criteria

- All text in the Terms of Sale components is emitted via `t("termsSale...")`; there is no remaining literal copy in the `*.tsx` files.
- The English and Italian message catalogs declare matching keys for each phrase (content headings, paragraphs, bullet points, labels, annex form text, etc.).
- `pnpm --filter @apps/cochlearfit lint` succeeds without `ds/no-hardcoded-copy` warnings or other failures.

## Progress

- Captured every copy fragment inside `apps/cochlearfit/src/components/policies/terms-sale-eu` behind `t(...)` by wiring the intro/parts through shared translation keys and resolving IDs via the new `sectionIds.ts`.
- Filled both English and Italian catalogs with the expanded key set (including metadata/page copy for the new `/policies/terms-sale-eu` route).
- Added `Section`/`PageHeader` scaffolding at `apps/cochlearfit/src/app/[lang]/policies/terms-sale-eu/page.tsx`, so the eventual Terms of Sale page creates its own translator instance and renders `TermsOfSaleEuContent` with the same `t`.
- Re-enabled `ds/no-hardcoded-copy` for the policy folder, removed the exception from `eslint.config.mjs`, and verified `pnpm --filter @apps/cochlearfit lint` succeeds with the new wiring.

## Next steps

- Keep the plan document as an audit trail; no further code changes required unless legal copy updates arrive.
- Monitor lint when real content changes to ensure translations stay in sync, especially if new locales are added in the future.

## Risks / Notes

- The Terms files are currently detached from any page—implementing the translations should not change behavior but keep in mind that whoever hooks them into a route must supply the same translator and locale data that `loadMessages` already provides.
