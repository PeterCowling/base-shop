---
Type: Results-Review
Status: Draft
Feature-Slug: brik-live-pricing-activation
Review-date: 2026-02-27
artifact: results-review
---

# Results Review — BRIK Live Pricing Activation

## Observed Outcomes

- The Cloudflare Pages Function (`apps/brikette/functions/api/availability.js`) is committed and will be deployed alongside the static Pages export on the next production deploy. Before this build, the `/api/availability` route had no mechanism to execute on production (static export + `force-dynamic` route handler are incompatible).
- The production CI build command now includes `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1`, which will bake the feature-active client JS into the next production build.
- The `src/app/api` directory is now hidden during all static export builds (static-export-check, staging, production), preventing the known build failure from the `force-dynamic` route handler.
- The production health check now validates `/api/availability` after every deploy.
- Operator smoke test instructions are ready in `docs/plans/brik-live-pricing-activation/task-04-smoke-test-results.md`.
- End-to-end activation (live prices appearing on the book page) is contingent on the operator: (1) running the smoke test against a local dev server, (2) registering `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` as a Cloudflare Pages environment variable for the `brikette-website` project (value `1`), and (3) triggering a production deploy via workflow dispatch.

## Standing Updates

- `docs/business-os/startup-loop-containers-process-map.html`: no update needed — infra activation is captured via this build record.
- `apps/brikette/public/_redirects`: no update needed — the Pages Function intercepts `/api/availability` before `_redirects` rules fire.
- `MEMORY.md` CI/Deploy Pipeline section: already documents the `mv dir _dir-off` pattern; no new pattern introduced.
- No standing updates: this build adds infrastructure (Pages Function, CI flag) rather than new standing data. The operator-facing validation step (smoke test, CF env var registration) cannot be recorded until the operator completes those actions.

## New Idea Candidates

- Add Playwright smoke test for `/api/availability` to CI on the Worker build path | Trigger observation: `availability-smoke.spec.ts` is not in standard CI (noted in plan Risks); every production deploy activates live pricing without automated regression coverage | Suggested next action: create card
- Alert when CF Pages env var bindings diverge from build-cmd inline flag values | Trigger observation: `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` must be set in two places; divergence means feature appears active in client UI but API returns empty rooms | Suggested next action: defer (low frequency; documented in health check Known Limitation)
- None for new standing data sources, new open-source packages, new loop processes, or AI-to-mechanistic steps.

## Standing Expansion

No standing expansion: this build activates an existing feature rather than introducing a new standing data source, business model change, or hypothesis. The CF Pages Function architecture pattern (plain JS Pages Function alongside static export) is already implicitly documented in MEMORY.md. If the operator smoke test reveals unexpected behaviour, a follow-on plan should capture it.

## Intended Outcome Check

- **Intended:** `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` is set in the production build environment, the deployment succeeds, and live prices from Octorate appear on the book page (`/en/book`) or room detail pages within 15 seconds of date entry.
- **Observed:** All four build tasks are complete and committed (commits `885afec878` and `5c5420988f`). The flag is set in the production build-cmd, the Pages Function is created, the static export builds are protected. End-to-end price display is not yet observable — production deploy has not been triggered; operator smoke test against local dev server has not been run; CF Pages env var binding has not been registered.
- **Verdict:** Partially Met
- **Notes:** The build pre-conditions for activation are met. Full activation requires three operator actions before "Met" status can be claimed: (1) operator smoke test pass, (2) CF Pages env var registration, (3) production deploy trigger.
