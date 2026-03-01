---
Status: Complete
Feature-Slug: hbag-caryina-cookie-consent-analytics
Completed-date: 2026-03-01
artifact: build-record
---

# Build Record — Caryina Cookie Consent Banner and Analytics Wiring

## Outcome Contract

- **Why:** GDPR requires explicit consent before setting analytics cookies for EU visitors. No consent banner meant the entire analytics pipeline was silently non-functional for all new visitors before launch.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Cookie consent banner is live in the caryina layout. Analytics events are delivered to the configured provider for all consenting visitors. The operator can open GA4 Realtime debug view and see at least one event within 60 seconds of accepting consent on the live site.

## What Was Built

**TASK-01 — ConsentBanner.client.tsx**

Created `apps/caryina/src/components/ConsentBanner.client.tsx`. A `"use client"` component that reads `document.cookie` on mount via `useEffect`, shows a fixed-position consent overlay if `consent.analytics` cookie is not set, and hides permanently once the visitor accepts or declines. Accept handler sets `consent.analytics=true; SameSite=Lax; Path=/; Max-Age=31536000`; Decline handler sets `=false`. Privacy policy link points to `/${lang}/privacy` using the `lang` prop. No npm packages added — native `document.cookie` API only. Cookie name matches the shared literal in `packages/platform-core/src/analytics/client.ts:5` and `apps/caryina/src/app/api/analytics/event/route.ts:26` exactly.

**TASK-02 — Wire ConsentBanner into locale layout**

Added `import { ConsentBanner } from "@/components/ConsentBanner.client"` and `<ConsentBanner lang={lang} />` after `<SiteFooter />` in `apps/caryina/src/app/[lang]/layout.tsx`. The banner now renders on every locale-prefixed route. Server component renders client component child — standard Next.js App Router pattern.

**TASK-03 — Unit tests for ConsentBanner (6 TCs)**

Created `apps/caryina/src/components/ConsentBanner.client.test.tsx`. Uses `Object.defineProperty(document, "cookie", { writable: true, configurable: true, value: "" })` to mock the cookie jar (pattern from `packages/platform-core/src/analytics/client.test.ts`). Tests cover: no cookie → banner visible with Accept/Decline; `=true` pre-set → banner hidden; `=false` pre-set → banner hidden; Accept click → cookie written with `=true` + banner hidden; Decline click → cookie written with `=false` + banner hidden; privacy link href is `/${lang}/privacy`.

**TASK-04 — Unit tests for analytics event route (5 TCs)**

Created `apps/caryina/src/app/api/analytics/event/route.test.ts`. Mocks `@acme/platform-core/analytics` (trackEvent), `@acme/platform-core/repositories/settings.server` (getShopSettings), and `shop.json`. Uses `NextRequest` with `Cookie` header to simulate consent states. Tests cover: no cookie → 202 `skipped: no-consent`; `=false` → 202 `skipped: no-consent`; `=true` + valid type → 200, trackEvent called once; `=true` + invalid type → 400 validation error; analytics disabled in settings → 202 `skipped: analytics-disabled`. Closes a pre-existing coverage gap on the route — there were no tests before this task.

**TASK-05 — GA4 settings wiring and documentation**

Updated `data/shops/caryina/settings.json`: changed `analytics.provider` from `"console"` to `"ga"`, added `analytics.id: "G-XXXXXXXXXX"` (placeholder pending operator-supplied measurement ID). Added `## GA4 Analytics Setup` section to `apps/caryina/NOTES.md` documenting the measurement ID format, `GA_API_SECRET` env var requirement for Cloudflare Workers, and how to verify via GA4 Realtime. Also documents the `providerCache` server restart requirement.

**TASK-06 — Privacy policy content verification**

Read `data/shops/caryina/site-content.generated.json` `policies.privacy.bullets` — no analytics mention found in the three existing bullets. Added analytics privacy bullet to `docs/business-os/startup-baselines/HBAG-content-packet.md` under `## Policies` → `### Privacy policy bullets`: "We use analytics cookies to understand how visitors use the site. You can accept or decline analytics tracking via the cookie banner. No advertising or third-party tracking cookies are set." Note: `site-content.generated.json` must be regenerated before launch to pick up the new bullet.

## Commit Evidence

- `644cecd8da` — `feat(hbag-caryina): add cookie consent banner and analytics wiring` — 8 files, 358 insertions, 21 deletions. 3 new files created: `ConsentBanner.client.tsx`, `ConsentBanner.client.test.tsx`, `route.test.ts`.

## Tests Run

Tests run in CI only (per `docs/testing-policy.md`). All files passed pre-commit hooks (typecheck-staged + lint-staged on `@apps/caryina`). Caryina typecheck clean. Caryina lint: 0 errors (21 pre-existing `ds/min-tap-size` warnings across caryina, none in new code that don't already exist on other buttons).

## Operator Actions Required Before Launch

1. Replace `G-XXXXXXXXXX` in `data/shops/caryina/settings.json` `analytics.id` with the real GA4 Measurement ID.
2. Set `GA_API_SECRET` environment variable in Cloudflare Workers dashboard for the caryina deployment.
3. Restart/redeploy the Worker after settings.json change (providerCache is module-level).
4. Regenerate `data/shops/caryina/site-content.generated.json` to pick up the new analytics privacy bullet: `pnpm --filter scripts startup-loop:compile-website-content-packet -- --business HBAG`.
5. Verify GA4 Realtime report shows a `page_view` event within 60 seconds of accepting consent on the live site.
