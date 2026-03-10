---
Type: Note
Status: Active
Domain: UI
Last-reviewed: 2026-03-10
Relates-to: docs/plans/brikette-dead-code-cleanup/plan.md
---

# Medium-Confidence Findings

Source: March 10, 2026 `dead-code-audit --app=brikette --format=json`

## Disposition Matrix

| File | Audit reason | Evidence gathered | Disposition |
|---|---|---|---|
| `apps/brikette/src/hooks/useIsDesktop.ts` | No static imports or re-exports found in app module graph | Repo search found no imports from `@/hooks/useIsDesktop` or relative path consumers in `apps/brikette/src` or `apps/brikette/scripts`. | Delete candidate |
| `apps/brikette/src/lib/search/index.ts` | No static imports or re-exports found in app module graph | Search consumers import directly from `@/lib/search/guide-search`; no barrel imports were found. | Delete candidate |
| `apps/brikette/src/lib/rates.ts` | No static imports or re-exports found in app module graph | No imports or symbol consumers (`getRates`, `findNightlyPrices`, `cityTaxFor`, `listNights`) were found outside the file itself. | Delete candidate |
| `apps/brikette/src/lib/metrics/index.ts` | No static imports or re-exports found in app module graph | No imports of the metrics barrel or any of its re-exported symbols were found outside the metrics module files themselves. | Delete candidate |
| `apps/brikette/src/lib/cfLibImage.ts` | No static imports or re-exports found in app module graph | File is already deleted in the working tree before this wave; no further action taken in this task. | Already removed outside task |
| `apps/brikette/src/lib/analytics/index.ts` | No static imports or re-exports found in app module graph | No imports of the analytics barrel or its re-exported symbols were found outside the analytics module files themselves. | Delete candidate |
| `apps/brikette/src/utils/testimonials.ts` | No static imports or re-exports found in app module graph | Home page and booking pages preload the `testimonials` namespace, but no production or script consumer imports the helper module itself. | Needs follow-up |
| `apps/brikette/src/utils/ensureGuideContent.ts` | No static imports or re-exports found in app module graph | `apps/brikette/scripts/check-guides-translations.ts` imports and executes `ensureGuideContent`, so it has an active script consumer. | Keep |

## Notes

- `testimonials.ts` looks unused in runtime code, but it performs dynamic locale imports and models a structured testimonial shape. It should only be deleted after checking whether any unpublished script or content workflow still relies on it.
- `cfLibImage.ts` should be treated as an externally resolved finding for this wave because it was already deleted in the shared worktree before implementation started.

## Recommended TASK-03 Input

Promote these files into the bounded deletion tranche, subject to a final pre-delete recheck:

- `apps/brikette/src/hooks/useIsDesktop.ts`
- `apps/brikette/src/lib/search/index.ts`
- `apps/brikette/src/lib/rates.ts`
- `apps/brikette/src/lib/metrics/index.ts`
- `apps/brikette/src/lib/analytics/index.ts`

Hold out of TASK-03 for now:

- `apps/brikette/src/lib/cfLibImage.ts` — already removed outside task scope
- `apps/brikette/src/utils/testimonials.ts` — needs follow-up
- `apps/brikette/src/utils/ensureGuideContent.ts` — keep
