---
Type: Build-Record
Status: Draft
Domain: Platform
Feature-Slug: startup-loop-new-business-launch-priorities
Generated: 2026-02-24
---

# Build Record — Startup Loop Website Iteration Factory

## Completed Tasks

- TASK-04: site-content materializer + generated runtime payload flow
- TASK-05: SEO bootstrap + claim-safety lint gate
- TASK-06: artifact-delta -> WEBSITE backlog mapper
- TASK-07: logistics-aware policy block mapper
- TASK-08: checkpoint evidence + downstream replan confirmation
- TASK-09: website-iteration throughput telemetry pack

## Key Outputs

- `scripts/src/startup-loop/materialize-site-content-payload.ts`
- `scripts/src/startup-loop/lint-website-content-packet.ts`
- `scripts/src/startup-loop/map-artifact-delta-to-website-backlog.ts`
- `scripts/src/startup-loop/map-logistics-policy-blocks.ts`
- `scripts/src/startup-loop/website-iteration-throughput-report.ts`
- `data/shops/caryina/site-content.generated.json`
- `docs/business-os/strategy/HBAG/website-iteration-seed.json`
- `docs/business-os/strategy/HBAG/website-iteration-throughput-report.user.md`
- `docs/business-os/startup-loop/website-iteration-throughput-report-contract.md`

## Validation Evidence

- `pnpm --filter scripts test -- "(materialize-site-content-payload|map-logistics-policy-blocks|lint-website-content-packet|map-artifact-delta-to-website-backlog|website-iteration-throughput-report)"` (pass)
- `pnpm --filter @apps/caryina typecheck` (pass)
- `pnpm --filter scripts startup-loop:materialize-site-content-payload -- --business HBAG --shop caryina --source ../docs/business-os/startup-baselines/HBAG-content-packet.md --output ../data/shops/caryina/site-content.generated.json --as-of 2026-02-24` (pass)
- `pnpm --filter scripts startup-loop:lint-website-content-packet -- --packet ../docs/business-os/startup-baselines/HBAG-content-packet.md --forbidden "made in italy,genuine leather,100% leather,ce certified"` (pass)
- `pnpm --filter scripts startup-loop:website-iteration-throughput-report -- --business HBAG --input ../docs/business-os/strategy/HBAG/website-iteration-cycles.json --output ../docs/business-os/strategy/HBAG/website-iteration-throughput-report.user.md --as-of 2026-02-24` (pass)
- `pnpm --filter @apps/caryina lint` (fails due pre-existing unrelated errors in `Header.tsx`, `ThemeModeSwitch.tsx`, and duplicate import/sort issues in `product/[slug]/page.tsx`)

## Checkpoint Outcome

- Payload acceptance pilot: complete for `HBAG -> caryina`.
- Delta seed quality pilot: 3/4 accepted (75%).
- Critical lint false positives: none in configured forbidden-claim run.
