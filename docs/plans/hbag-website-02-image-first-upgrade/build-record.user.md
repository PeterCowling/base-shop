---
Type: Build-Record
Plan: hbag-website-02-image-first-upgrade
Status: Complete
Feature-Slug: hbag-website-02-image-first-upgrade
Business-Unit: HBAG
Card-ID: none
Started-date: 2026-02-23
Completed-date: 2026-02-23
Last-updated: 2026-02-23
artifact: build-record
---

# Build Record: hbag-website-02-image-first-upgrade

## Completed Tasks

- TASK-01: locked Option A launch defaults (6 mandatory slots + 3 family anchors).
- TASK-02: implemented typed media contract + deterministic validator command.
- TASK-03: shipped image-first homepage and PLP card/grid implementation.
- TASK-04: shipped deterministic PDP gallery with keyboard/touch navigation.
- TASK-05: published media production/QA contract artifact with reviewer sign-off.
- TASK-06: captured media-focused validation and performance evidence package.
- TASK-07: executed checkpoint with `Go` verdict for launch packaging.

## Files Added / Updated (Primary)

- `apps/caryina/src/app/[lang]/page.tsx`
- `apps/caryina/src/app/[lang]/shop/page.tsx`
- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`
- `apps/caryina/src/components/catalog/ProductMediaCard.tsx`
- `apps/caryina/src/components/catalog/ProductGallery.client.tsx`
- `apps/caryina/src/components/catalog/ProductGallery.client.test.tsx`
- `apps/caryina/src/lib/launchMediaContract.ts`
- `apps/caryina/src/lib/launchMediaContract.test.ts`
- `apps/caryina/src/lib/launchMerchandising.ts`
- `apps/caryina/src/lib/shop.ts`
- `apps/caryina/scripts/validate-launch-media-contract.ts`
- `apps/caryina/src/styles/global.css`
- `apps/caryina/package.json`
- `apps/caryina/public/images/hbag/*.svg`
- `data/shops/caryina/products.json`
- `docs/business-os/site-upgrades/HBAG/2026-02-23-image-production-contract.user.md`
- `docs/business-os/site-upgrades/HBAG/2026-02-23-image-production-contract.user.html`
- `docs/plans/hbag-website-02-image-first-upgrade/artifacts/fixtures/launch-media-missing-on-body.json`
- `docs/plans/hbag-website-02-image-first-upgrade/artifacts/performance-evidence.md`
- `docs/plans/hbag-website-02-image-first-upgrade/plan.md`

## Validation Commands & Results

- `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern="launchMediaContract.test.ts|ProductGallery.client.test.tsx"` -> pass (5 tests).
- `pnpm --filter @apps/caryina typecheck` -> pass.
- `pnpm --filter @apps/caryina lint` -> pass.
- `pnpm --filter @apps/caryina validate:launch-media` -> pass (`3/3` active SKUs valid).
- `pnpm --filter @apps/caryina validate:launch-media --file ../../docs/plans/hbag-website-02-image-first-upgrade/artifacts/fixtures/launch-media-missing-on-body.json` -> expected fail (`missing on_body`).
- `pnpm --filter @apps/caryina build` -> pass.

## Performance Snapshot

- Root main client JS gzip payload: `115668` bytes (threshold `<=120000`, pass).
- Build stability: compiled successfully and generated `13/13` static pages (pass).
- Media completeness gate: `3/3` active SKUs valid (pass).

See: `docs/plans/hbag-website-02-image-first-upgrade/artifacts/performance-evidence.md`

## Checkpoint Verdict

- TASK-07 decision: `Go`
- Rationale:
  - media contract gating is deterministic and passing for active catalog;
  - homepage/PLP/PDP image-first implementation is complete;
  - validation package passes with explicit threshold evidence.
- Residual risk:
  - operator-run real-device UX/performance spot-check remains required as post-merge launch QA.
  - execution template: `docs/plans/hbag-website-02-image-first-upgrade/artifacts/real-device-qa-matrix.md`.
