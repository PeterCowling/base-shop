---
Type: Results-Review
Status: Draft
Feature-Slug: brikette-cta-sales-funnel-ga4
Review-date: 2026-02-25
artifact: results-review
---

# Results Review

## Observed Outcomes
- The full GA4 e-commerce funnel (`cta_click` → `search_availability` → `view_item_list` → `select_item` → `begin_checkout` → `handoff_to_engine`) was confirmed firing in production at `hostel-positano.com` via live Playwright smoke test on 2026-02-22.
- `BookingModal` and `Booking2Modal` are fully deleted from the codebase — 9 primary call sites and 2 secondary call sites migrated to direct `/{lang}/book` navigation.
- The `/book` page now carries conversion content (perks, social proof, FAQ, location block, deal banner), structured data (`LodgingBusiness`, `FAQPage`, `BreadcrumbList`), and improved H1/meta.
- `ContentStickyCta` was added to all 10 high-traffic pages that previously had no booking CTA.
- 4 GA4 custom dimensions (`cta_id`, `cta_location`, `item_list_id`, `coupon`) registered via the GA4 Admin API against property `properties/474488225` — these require 24–48 hours to appear in GA4 Explorations.
- SPA `page_view` tracking confirmed working via `PageViewTracker` on internal navigation.
- `beacon` transport confirmed for `begin_checkout` with 150ms timeout fallback — prevents data loss on Octorate navigation.

## Standing Updates
- `MEMORY.md` (CI/Deploy section): The `/it/prenota` route is not in the static export and redirects to `/en` — this is expected and confirmed in the smoke test. Add a note that the IT-locale `/book` equivalent is intentionally excluded from the static export.
- `apps/brikette/src/app/[lang]/book/` architecture: The key architectural decisions locked in this build (URL strategy, dates gate, analytics placement, beacon transport, modal removal) should be preserved in a short decision record or `DECISIONS.md` within the plan archive rather than left only in the build-record. These decisions will otherwise be invisible to future contributors making changes to the booking flow.

## New Idea Candidates
- Add IT locale /book route to the static export to stop the redirect to /en | Trigger observation: Smoke test confirmed `/it/prenota` redirects to `/en` — IT-speaking visitors get an English booking page | Suggested next action: spike
- Track GA4 funnel drop-off in Explorations once custom dimensions are visible (48h) | Trigger observation: Full funnel confirmed firing; no conversion rate baseline exists yet | Suggested next action: defer (check at T+7 days when custom dimensions propagate)
- ~~Add `view_item_list` assertions to the Playwright smoke test~~ | Actioned: plan `brikette-smoke-view-item-list` archived 2026-02-26 — `view_item_list` added to `REQUIRED_EVENTS` in `ga4-funnel-smoke.mjs`

## Standing Expansion
No standing expansion: the beacon transport pattern (`trackThenNavigate` with `event_callback` + 150ms fallback) and the analytics placement rule (callbacks from app layer, `packages/ui` analytics-free) are the two decisions most worth codifying. These are currently captured in the build-record decision table. Consider promoting them to `docs/architecture.md` under a "GA4 / Analytics" section if a second GA4 integration is planned for another app.

## Intended Outcome Check

- **Intended:** Replace the booking modal with a direct CTA → `/book` → Octorate funnel, upgrade the `/book` page with conversion content, wire GA4 e-commerce event tracking across the full funnel, and verify the implementation with unit tests and a live smoke test against production.
- **Observed:** All four tracks delivered and confirmed live. Modal removed completely. `/book` page upgraded with structured data and conversion content. Full GA4 funnel confirmed in production via live Playwright smoke test. Custom dimensions registered in GA4 Admin. All unit tests passing.
- **Verdict:** Met
- **Notes:** n/a
