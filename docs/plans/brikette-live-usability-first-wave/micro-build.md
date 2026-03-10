---
Type: Micro-Build
Status: Complete
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: brikette-live-usability-first-wave
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260308133000-9301
Related-Plan: none
---

# Brikette Live Usability First Wave Micro-Build

## Scope
- Change:
  - Make `ContentStickyCta` non-obstructive on the `/how-to-get-here` and `/help` surfaces implicated by the live smoke failures.
  - Remove render-time `window.location` dependency from the shared guide template so guide URL-derived state is stable across server and client render.
- Non-goals:
  - Rework the transport hub layout beyond the shared sticky CTA behavior.
  - Fix Safari/WebKit `.txt?_rsc` request handling in middleware.
  - Diagnose every Firefox transition failure from the live smoke run.

## Execution Contract
- Affects:
  - `apps/brikette/src/components/cta/ContentStickyCta.tsx`
  - `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx`
  - `apps/brikette/src/test/components/content-sticky-cta.test.tsx`
  - `apps/brikette/src/test/routes/guides/__tests__/block-template-wiring.test.tsx`
- Acceptance checks:
  - Transport/help sticky CTA surfaces no longer use the desktop side-floating layout that can sit over content.
  - Sticky CTA dismiss control no longer shares the generic `Close` accessible name with modal/lightbox controls.
  - Guide template canonical/path-derived state is sourced from router pathname rather than `window.location` during render.
- Validation commands:
  - `pnpm --filter @apps/brikette typecheck`
  - `pnpm --filter @apps/brikette lint`
- Rollback note:
  - Revert only the shared sticky CTA layout/dismiss-label changes and the guide template pathname sourcing if this wave causes layout or SEO regressions.

## Outcome Contract
- **Why:** The first live cross-browser smoke run against production exposed shared usability blockers on Brikette content pages: the sticky booking CTA can obstruct critical controls on `/how-to-get-here` and `/help`, and the shared guide template still contains render-time browser-path logic consistent with the production guide hydration crash.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The first Brikette live-usability remediation wave removes shared CTA obstruction on transport/help surfaces and hardens shared guide rendering so production guide pages no longer depend on render-time `window.location` state.
- **Source:** operator

## Build Evidence
- `ContentStickyCta` now uses a bottom-docked layout for `how_to_get_here` and `assistance` surfaces instead of the floating desktop side-card layout that could sit over interactive content.
- Sticky CTA dismiss controls now use `Dismiss offer`, removing the shared `Close` accessible name collision with modal/lightbox controls.
- `_GuideSeoTemplate` now sources pathname state from the App Router via `useOptionalRouterPathname()` and passes a stable pathname into canonical URL resolution.
- Regression coverage now asserts the CTA layout split and confirms guide canonical-path resolution is driven by router pathname.

## Validation
- `pnpm --filter @apps/brikette typecheck` — pass
- `pnpm --filter @apps/brikette lint` — pass with existing package warnings only (`128` warnings, `0` errors)

## Remaining Follow-up
- Safari/WebKit `.txt?_rsc` navigation errors remain out of scope for this wave.
- Firefox desktop navigation instability and the mobile Help → Privacy flow should be rechecked against production after the shared CTA change is deployed.
