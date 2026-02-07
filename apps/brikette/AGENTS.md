# Brikette — Upstreaming Guide

## How to upstream shared code

When you see Brikette-local logic that should become shared (UI, hooks, SEO helpers), follow this sequence:

1) **Confirm portability**
   - No app-specific data, routes, or translations in the shared implementation.
   - Inject config/data via props or factory functions.

2) **Promote to the canonical package**
   - UI: `@acme/ui` (components/hooks).
   - Non-React helpers: `@acme/ui/lib/*` or a dedicated core package (e.g., `@acme/guides-core`).

3) **Keep Brikette as the wiring layer**
   - Brikette should only supply app-specific data (translations, routes, slugs).
   - Do not duplicate the shared logic locally.

4) **Migrate imports**
   - Update all Brikette imports to the shared module.
   - Remove local copies after migration.

5) **Add guardrails**
   - Add a focused Jest guardrail in `apps/brikette/src/test/migration/` to prevent reintroducing local copies.
   - Prefer additive changes; avoid breaking shared APIs without a migration plan.

6) **Validate**
   - Run targeted tests for the modified area.
   - If the shared package changes, run its tests too.

Keep changes small and reversible. If portability is unclear, document it in the plan before extracting.
