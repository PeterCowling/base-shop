Type: Report
Status: Draft
Domain: UI
Last-reviewed: 2025-02-05

# UI Responsive & Content-Stress Audit — Bootstrap

This file tracks the state of the responsive/content-durability audit for the design system. It is aligned with the centralisation goal (all reusable UI lives in `packages/ui`) and documents what has been done vs what remains.

## Scope
- Design-system components in `packages/ui/src/components` (atoms → organisms → templates → overlays), plus platform-core UI re-exported via `packages/ui/src/components/platform/*`.
- CMS/editor components are out of scope for this pass unless they are intended to be reused as part of the shared UI.

## What was done
- Centralised “rogue” platform-core UI into `@acme/ui` via `packages/ui/src/components/platform/{shop,pdp,blog}` with exports in `packages/ui/package.json`.
- Added Storybook stories for the previously unstoried platform-core components so they can be audited:
  - `Platform/Shop`: `AddToCartButton`, `ProductCard`, `ProductGrid`, `FilterBar`.
  - `Platform/PDP`: `ImageGallery`, `SizeSelector`.
  - `Platform/Blog`: `BlogPortableText`.
- Stories include mock cart/currency providers to avoid network calls when rendering.
- Added stories for several missing atoms/organisms:
  - Atoms: `FormField`, `FileSelector`, `Progress`, `SelectField`, and a primitives playground (button/input/checkbox/select/accordion/table/textarea).
  - Molecules: `Accordion`, `CodeBlock`, `CurrencySwitcher`.
  - Organisms: base `ProductGrid`, `AnnouncementBar`, `DataTable`.
  - Common/layout/home: `DeviceSelector`, `HeroBanner.client`, `HeaderClient.client`.
  - Account: `AccountNavigation`, `MfaChallenge`, `MfaSetup`, `RevokeSessionButton`, `Sessions`, `StartReturnButton`.
  - Organisms extended: `FilterSidebar.client`, `ImageCarousel`, `MiniCart.client`, `SideNav`.
  - Templates: `TrackingDashboardTemplate`.

## Gaps blocking full audit
- Design-system components still lacking stories (non-CMS):
  - `ThemeStyle` (out of scope for responsive audit; server-only style injector)
  - `templates`: `AppShell.story-helpers` (Storybook-only utility; out of scope)
- CMS/editor surface has hundreds of unstoried components. Recommendation: only story the CMS pieces that are meant to be reusable UI; move app-only/editor flows to `apps/cms`.

## Proposed next actions
1) Add minimal stories for the gap list above with stressed content toggles (double-length text, long unbroken strings, empty/loading).
2) Introduce a shared Storybook decorator/helper to toggle stress modes and cycle required viewports (320/375/768/1024/1440/1920) across all stories.
3) Run the responsive + content-stress audit in Storybook using the new stories and log failures (viewport, screenshot, remediation) back into this file.
4) For CMS/editor: triage which components belong in `packages/ui`; story those, and relocate app-only flows to `apps/cms`.

## Notes
- Keep tests scoped; no repo-wide suites per `AGENTS.md`.
- Network access is restricted; stories must rely on local mocks/fixtures (no remote fetches).
