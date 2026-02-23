---
Type: Task-Artifact
Status: Draft
Task-ID: TASK-07
Plan: docs/plans/brikette-seo-traffic-growth/plan.md
Created: 2026-02-22
---

# TASK-07 — Homepage title/H1/meta optimization

## Baseline (Red)

- Source of truth confirmed in `apps/brikette/src/locales/en/landingPage.json`.
- Pre-change EN metadata:
  - `meta.title`: `Brikette Hostel in Positano - Affordable Amalfi Coast Stay`
  - `meta.description`: `Book your stay at Positano's only budget hostel ... Reserve direct for the best rate.`
  - `heroSection.title` (homepage H1 source): `Hostel Brikette, Positano`
- Held-back test resolved: exact `hostel positano` phrase was not present in title copy.

## Implemented (Green)

- Updated EN title copy to include the target query cluster naturally:
  - `Brikette Hostel Positano - Affordable Stay on the Amalfi Coast`
- Updated EN description copy to keep Amalfi Coast + booking-hostel intent.
- Updated EN hero H1 copy alignment:
  - `Hostel Brikette - Hostel in Positano`

## Hardening (Refactor)

- Added focused metadata copy test:
  - `apps/brikette/src/test/app/homepage-metadata-copy.test.ts`
- Spot-check guard in test ensures IT/DE/FR homepage metadata remains populated and still targets Positano.

## Validation Evidence

- `pnpm --filter @apps/brikette test -- src/test/app/homepage-metadata-copy.test.ts` (pass)
- `pnpm --filter @apps/brikette test -- src/test/lib/metadata.test.ts` (pass)
- `pnpm --filter @apps/brikette typecheck` (pass)

## Acceptance Mapping

- Title includes `hostel positano`: pass.
- Description includes Amalfi Coast + booking/hostel intent: pass.
- H1 aligned with title strategy: pass.
- Existing metadata tests pass: pass.
- No regressions in IT/DE/FR metadata spot check: pass (test-backed).
