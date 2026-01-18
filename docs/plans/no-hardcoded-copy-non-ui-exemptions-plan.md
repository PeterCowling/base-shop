---
Type: Plan
Status: Active
Domain: Platform
Last-reviewed: 2026-01-16
Relates-to charter: none
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-16
Last-updated-by: Codex
---

# No-Hardcoded-Copy Non-UI Exemptions Plan

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

## Plan
1. Update `ds/no-hardcoded-copy` to ignore non-copy attribute values (`data-*`, `type`, `id`, etc.) and utility class lists in non-JSX contexts.
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

## Active tasks

- **COPY-01** - Implement path exemptions in eslint.config.mjs
