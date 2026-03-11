---
Type: Micro-Build
Status: Complete
Created: 2026-03-11
Last-updated: 2026-03-11
Feature-Slug: brikette-commercial-richtext-seo-hardening
Execution-Track: code
Deliverable-Type: multi-deliverable
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260311174203-9552
Related-Plan: none
---

# Brikette Commercial Rich-Text SEO Hardening Micro-Build

## Scope
- Change:
  - Render arrival intro rich-text safely on `/[lang]/how-to-get-here` via `<Trans>` so locale `<Link>` and `<Strong>` tokens become real guest-facing content.
  - Align private-accommodation structured data and sitemap generation with the canonical chooser IA.
  - Add regression guards for raw rich-text tag leaks in component render tests and static export audits.
- Non-goals:
  - Rework unrelated release-lane workflow files already in flight elsewhere in the repo.
  - Audit or rewrite every guide-detail locale string outside the affected arrival/commercial surfaces.

## Execution Contract
- Affects:
  - `apps/brikette/src/routes/how-to-get-here/components/IntroHighlights.tsx`
  - `apps/brikette/src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx`
  - `apps/brikette/src/components/seo/PrivateAccomStructuredDataRsc.tsx`
  - `apps/brikette/src/app/[lang]/HomeContent.tsx`
  - `apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx`
  - `apps/brikette/src/app/[lang]/page.tsx`
  - `apps/brikette/src/utils/roomsCatalog.ts`
  - `apps/brikette/src/utils/schema/builders.ts`
  - `apps/brikette/scripts/generate-public-seo.ts`
  - `apps/brikette/scripts/verify-localized-commercial-copy.ts`
  - `apps/brikette/src/test/**` task-scoped regression coverage
- Acceptance checks:
  - No literal `<Link>` or `<Strong>` tokens render from `IntroHighlights` across supported locales.
  - Static export verification covers localized `how-to-get-here` pages for raw rich-text tag leaks.
  - Private-accommodation chooser emits collection/list JSON-LD instead of apartment markup.
  - Redirect-only private-room roots are excluded from sitemap generation.
- Validation commands:
  - `pnpm --filter @apps/brikette typecheck`
  - `pnpm --filter @apps/brikette lint`
- Rollback note:
  - Revert this task-scoped commit if the new arrival copy rendering or SEO contract guards create regressions on Brikette routes.

## Outcome Contract
- **Why:** Arrival/support trust surfaces and search-facing metadata must reflect the revised Brikette booking IA without leaking raw i18n component tags.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Brikette ships rich-text-safe arrival/support content and cleaner chooser-aligned SEO contracts with regression coverage that blocks future raw tag leaks.
- **Source:** operator
