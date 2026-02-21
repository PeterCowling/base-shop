---
Type: Feasibility-Report
Status: Active
Business: BRIK
Date: 2026-02-17
Owner: Pete
Relates-to:
  - docs/business-os/strategy/BRIK/2026-02-17-brikette-sales-funnel-external-brief.user.md
  - docs/business-os/strategy/BRIK/2026-02-12-ga4-search-console-setup-note.user.md
---

# Octorate Process Reduction Feasibility (Playwright Exploration)

## 1) Question

Can Brikette remove much of the Octorate booking process to deliver a better, SEO-richer conversion funnel while preserving booking operations?

## 2) Method

- Live browser exploration with Playwright (headless), including interaction steps and snapshots.
- Additional HTTP/HTML inspection of Octorate booking pages.
- Review of current Brikette integration code and Octorate public OpenAPI spec.

Evidence artifacts:
- `.tmp/octorate-funnel-probe-2026-02-17/report.json`
- `.tmp/octorate-funnel-probe-2026-02-17/01-home.png`
- `.tmp/octorate-funnel-probe-2026-02-17/02-book-route.png`
- `.tmp/octorate-funnel-probe-2026-02-17/03-octorate-result.png`
- `.tmp/octorate-funnel-probe-2026-02-17/04-octorate-after-show-offers.png`
- `.tmp/octorate-funnel-probe-2026-02-17/05-octorate-after-availability.png`
- `.tmp/octorate-openapi.yaml`

## 3) Observed Booking Path

### 3.1 Brikette entry

- `/en/book` exposes direct links to Octorate result page with query params (`codice`, dates, pax, UTM fields).
- Current code sends users to Octorate via:
  - generic booking modal: new tab (`target="_blank"`)
  - booking2/apartment/sticky paths: same-tab navigation

Code points:
- `apps/brikette/src/context/modal/global-modals/BookingModal.tsx`
- `packages/ui/src/organisms/modals/BookingModal.tsx`
- `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx`
- `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx`

### 3.2 Octorate journey

Observed sequence:
1. `result.xhtml` (room/result listing)
2. user click `Show offers`
3. user click `Availability`
4. transition to `calendar.xhtml;octobooksessionid=...`
5. further progression appears JSF/PrimeFaces state-driven (not simple link navigation)

## 4) Technical Findings (Material)

1. Octorate booking UI is highly stateful JSF/PrimeFaces.
- Session in path and form actions: `;octobooksessionid=...`
- Multiple hidden `jakarta.faces.ViewState` tokens.
- Next actions are command buttons/JS callbacks, not stable static links.

2. SEO signal quality on Octorate booking pages is weak by default.
- No canonical link observed.
- No `meta robots` observed.
- No OG/Twitter tags observed.
- No JSON-LD observed.
- Headers are `no-cache/no-store` and pages are session-driven.

3. Octorate steps are operationally rich but crawler-unfriendly.
- Heavy interactive forms and dynamic behavior.
- Accessibility/action labels are inconsistent in places (`ui-button`, icon glyph labels).

4. Confirm/deep-link behavior is fragile.
- Direct `confirm.xhtml` links can return no-availability outcomes outside the expected state flow.
- Indicates that reliable deep-linking beyond documented entry points may be brittle.

5. Octorate API surface is broad (official OpenAPI).
- Public spec includes reservation read/write, payments, calendar availability checks, and webhooks.
- Relevant references include:
  - `POST /rest/v1/reservation/{accommodation}` (createSingleReservation)
  - `GET /rest/v1/calendar/{accommodation}/{productId}/availabilityCheck`
  - webhook events like `RESERVATION_CREATED`, `RESERVATION_CONFIRMED`
- Payment/card handling includes explicit PCI/tokenization constraints in docs.

## 5) Feasibility: How Much Can Be Removed?

## 5.1 Partial removal (recommended): **Yes, feasible**

You can remove most pre-checkout Octorate UI from user-visible flow by moving discovery/selection to Brikette:
- First-party SSR booking pages (SEO indexable) with room/rate intent capture.
- Optional read-side availability checks via Octorate API.
- Octorate retained only for final transactional step.

Impact:
- High SEO gain (content, metadata, structured data controlled on your domain).
- Better funnel instrumentation quality before handoff.
- Lower operational risk than full replacement.

## 5.2 Full replacement (remove Octorate checkout): **Technically possible, high complexity/risk**

Would require Brikette to own:
- reservation creation/update lifecycle,
- pricing/taxes/policies edge cases,
- payment/tokenization compliance flows,
- failure handling/reconciliation,
- webhook/state sync with PMS/operations.

Given current constraints, this is a large product + compliance project, not a funnel quick win.

## 6) Recommended Architecture Direction

Phase 1 (short term):
- Keep Octorate as transaction engine.
- Move all browsing/offer storytelling/rate comparison to SSR Brikette pages.
- Route to Octorate only at “Proceed to secure booking”.

Phase 2 (medium term):
- Integrate Octorate read-side APIs for availability confidence and better pre-handoff UX.
- Add server-side event bridge (including webhook ingestion) to close measurement loop.

Phase 3 (optional, long-term):
- Evaluate full custom checkout only if ROI justifies engineering + compliance burden.

## 7) Immediate Decisions Needed

1. Approve target model: “Brikette-first discovery, Octorate-last-mile checkout”.
2. Confirm acceptable handoff point (room selection vs final checkout button).
3. Decide whether to pursue Octorate API onboarding for read-side availability now.
4. Define success KPIs for migration phase (SEO sessions to booking pages, handoff rate, booked-stay reconciliation accuracy).

## 8) Bottom Line

- **Yes**: you can remove a large portion of user-facing Octorate flow and materially improve SEO/UX by moving pre-checkout funnel steps onto Brikette.
- **No (for now)**: fully replacing Octorate’s transactional checkout is not a low-risk optimization; it is a major systems/compliance build.
