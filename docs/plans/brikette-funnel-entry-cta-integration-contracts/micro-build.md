---
Type: Micro-Build
Status: Complete
Created: 2026-03-11
Last-updated: 2026-03-11
Feature-Slug: brikette-funnel-entry-cta-integration-contracts
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260311092144-3104
Related-Plan: none
---

# Brikette Funnel Entry CTA Integration Contracts Micro-Build

## Scope
- Change:
  - Replace the helper-only `ga4-cta-click-header-hero-widget` assertions with rendered interaction coverage for Brikette’s key funnel entry CTAs.
  - Cover desktop header CTA wiring, mobile nav CTA wiring, hero CTA wiring, and booking widget CTA wiring in the deterministic booking-funnel contract bundle.
- Non-goals:
  - Add new live Playwright/browser-matrix workflows.
  - Expand into width sweeps, visual regression, or real-device infrastructure.
  - Rework funnel product behavior or CTA routing.

## Execution Contract
- Affects:
  - `apps/brikette/src/test/components/ga4-cta-click-header-hero-widget.test.tsx`
  - `docs/plans/brikette-funnel-entry-cta-integration-contracts/micro-build.md`
- Acceptance checks:
  - The CTA contract test renders the Header surface and verifies desktop/mobile CTA click wiring, not just `fireCtaClick()` helper calls.
  - The CTA contract test renders the home hero flow and verifies hero CTA click wiring plus route push.
  - The CTA contract test renders the booking widget and verifies submit CTA click wiring plus route push.
  - The existing booking-funnel contract command continues to include this test file unchanged.
- Validation commands:
  - `pnpm --filter @apps/brikette typecheck`
  - `pnpm --filter @apps/brikette lint`
- Rollback note:
  - Revert the CTA contract test to the prior helper-only implementation if the rendered integration layer proves unstable or starts depending on unrelated UI internals.

## Outcome Contract
- **Why:** The current Brikette funnel test surface proves CTA payload formatting but leaves a wiring gap at the actual entry points guests use first: desktop header, mobile nav, home hero, and booking widget. That weakens confidence in the deterministic PR gate for the very first clicks in the sales funnel.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Brikette’s deterministic booking-funnel contract suite verifies rendered CTA click wiring for the main funnel entry points, so regressions in header, hero, or booking widget analytics/navigation are caught before merge.
- **Source:** operator

## Build Evidence
- Replaced the prior helper-only `fireCtaClick()` assertions with rendered interaction tests that exercise `Header`, `HomeContent`, and `BookingWidget`.
- The desktop header and mobile nav assertions now verify CTA href propagation and `cta_click` emission from the rendered Header surface.
- The hero assertion now verifies `HomeContent` fires `hero_check_availability` and pushes the localized booking route.
- The booking widget assertion now verifies submit-click analytics wiring and localized booking-route navigation.

## Validation
- `pnpm --filter @apps/brikette typecheck` — pass
- `pnpm --filter @apps/brikette lint` — pass

## Remaining Follow-up
- This wave improves deterministic CTA wiring coverage only; it does not add new live browser, width-sweep, or real-device coverage.
