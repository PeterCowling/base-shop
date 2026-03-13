---
Type: Sales-Funnel-Audit
Status: Active
Business: BRIK
Date: 2026-03-12
Owner: Codex
Viewport-Scope: mobile, fullscreen
Rendered-Evidence: required
Primary-URL: https://hostel-positano.com/en
Activation-Decision: Blocked
Activation-Blockers-High: 2
Activation-Blockers-Critical: 1
Review-trigger: Before SELL-08 paid activation or after any booking funnel / booking-engine change.
Standing-Registry-ID: BRIK-SELL-FUNNEL-BRIEF
Relates-to: docs/business-os/strategy/BRIK/sales/2026-02-17-brikette-sales-funnel-external-brief.user.md
---

# Brikette Sales Funnel Rendered Audit

## Scope and evidence

- Audit date: 2026-03-12
- Site audited: `https://hostel-positano.com/en`
- Viewports only: `mobile` (iPhone-class touch viewport) and `fullscreen` (`1440x900`)
- Required surfaces:
  - homepage booking entry
  - homepage room cards
  - deals page
  - dated booking page
  - Octorate handoff page
- Prior review critique source: operator-provided "Brikette Sales Funnel Audit"

Rendered evidence was used as the source of truth. DOM and affordance-tree inspection were used only as supporting evidence. Several claims in the prior review were rejected because the live rendered state contradicted them.
Each audited surface was judged only after the rendered state settled following hydration, redirects, and the primary handoff navigation.

## Executive verdict

The prior review is directionally useful but not safe to use as a current decision document. Several of its strongest claims are stale or false on the live site as of 2026-03-12.

Current live state:
- Homepage room cards do show prices on mobile and fullscreen.
- Mobile already has a persistent sticky `Check availability` CTA in the header.
- The main deals CTA carries a deal parameter through to booking.
- The dated booking page shows prices on room cards.
- Octorate now shows a room photo, dates, guests, and amount on the handoff page.

Current blockers:
- Octorate shows a contradictory header strip with `Amount 0.00 EUR` and `Rooms 0` while the same screen shows a real room, real dates, and a real amount below.
- Octorate brand continuity is still weak enough to create trust drop at the handoff.
- On mobile Octorate, the primary `Continue` action is below the fold on first load.

Activation readiness verdict: `Blocked`.

## Live funnel map

Observed mobile/fullscreen path:

1. `https://hostel-positano.com/en`
2. Homepage hero / sticky header / room card CTA
3. `https://hostel-positano.com/en/book`
4. Redirected live booking surface:
   `https://hostel-positano.com/en/book-dorm-bed?checkin=2026-07-01&checkout=2026-07-04&pax=2`
5. Rate-plan selection on room cards (`Non-Refundable` or `Flexible`)
6. Octorate handoff:
   `https://book.octorate.com/octobook/site/reservation/result.xhtml?...`

Observed deal path:

1. `https://hostel-positano.com/en/deals`
2. `Book direct`
3. `https://hostel-positano.com/en/book?deal=direct-perks-evergreen`

## Prior review validation

| Prior claim | Live verdict | Evidence | Notes |
|---|---|---|---|
| Homepage room cards have no prices | Invalid on live site | [mobile homepage room card](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-home-roomcard.png), [desktop homepage room cards](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/desktop-home-roomcards.png) | Cards show `From EUR...` on both audited viewports. |
| No sticky/floating book CTA on mobile | Invalid on live site | [mobile homepage top](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-home-top.png) | Sticky mobile header includes `Check availability`. |
| Book page with dates selected shows no prices | Invalid on live site | [mobile booking room card](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-book-roomcard.png), [desktop booking room cards](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/desktop-book-roomcards.png) | Dated room cards show `From EUR129.00`, `EUR80.00`, etc. |
| Mobile filters are mainly a horizontal-scroll issue | Partially valid | [mobile booking top](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-book-top.png) | The mobile filter problem is density and multi-row scanning, not primarily horizontal scroll. |
| Deals page lacks context and urgency | Partially valid | [mobile deals top](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-deals-top.png) | It still lacks normal-price context, but now shows `Active now - ends Oct 31`, `Auto-applied`, and `Direct bookings only`. |
| Deals page does not carry the deal code forward | Invalid for the primary CTA | [mobile deals top](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-deals-top.png) | Main `Book direct` CTA routes to `/en/book?deal=direct-perks-evergreen`. Lower route links remain plainer. |
| Octorate has no photos | Invalid on live site | [desktop Octorate handoff](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/desktop-handover-top.png), [mobile Octorate handoff](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-handover-top.png) | Photo is present on both audited viewports. |
| Octorate does not show dates or guests | Invalid on live site | [desktop Octorate handoff](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/desktop-handover-top.png), [mobile Octorate handoff](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-handover-top.png) | Check-in, check-out, and guest count are visible. |
| Octorate does not show price on first load | Invalid on live site | [desktop Octorate handoff](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/desktop-handover-top.png) | Price is visible, but the header strip is contradictory. |
| Brand discontinuity at handoff | Validated | [desktop Octorate handoff](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/desktop-handover-top.png), [mobile Octorate handoff](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-handover-top.png) | Still a real trust problem. |
| Rate-plan labels are underexplained before click | Validated | [mobile booking room card](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-book-roomcard.png) | `Non-Refundable` vs `Flexible` still lacks clear pre-click explanation. |

## Current findings

### Critical

1. Octorate header contradiction on first handoff load
   - Surface: Octorate handoff, mobile + fullscreen
   - Evidence: [desktop Octorate handoff](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/desktop-handover-top.png), [mobile Octorate handoff](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-handover-top.png)
   - Observed: top strip shows `Amount 0.00 EUR` and `Rooms 0` while the main page simultaneously shows a selected room, dates, guests, tourist tax, and a real amount.
   - Why it matters: this is a trust-breaking contradiction on the most conversion-sensitive page in the flow.
   - Recommended fix: correct or remove the misleading header summary before any paid activation.

### High

1. Octorate brand discontinuity remains strong enough to create handoff trust loss
   - Surface: Brikette -> Octorate transition
   - Evidence: [mobile booking top](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-book-top.png), [desktop Octorate handoff](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/desktop-handover-top.png)
   - Observed: branded Brikette surfaces hand off to lowercase Octorate chrome with weaker visual hierarchy.
   - Recommended fix: align property title casing, logo, and basic brand treatment in Octorate before scaling traffic.

2. Mobile handoff places the primary `Continue` action below the fold
   - Surface: Octorate handoff, mobile
   - Evidence: [mobile Octorate handoff](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-handover-top.png)
   - Observed: first mobile viewport shows room image and details, but not the primary next-step action.
   - Recommended fix: move summary and CTA higher, or make the CTA sticky inside the handoff shell.

### Medium

1. Rate-plan choice is still underexplained on Brikette before click
   - Surface: dated booking page
   - Evidence: [mobile booking room card](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-book-roomcard.png)
   - Observed: `Non-Refundable` and `Flexible` are visible, but the difference is not obvious until after click.
   - Recommended fix: add two-line cancellation/payment summary and visible price delta per rate.

2. Mobile booking and deals pages lose too much above-the-fold height to sticky chrome
   - Surface: mobile booking + deals
   - Evidence: [mobile booking top](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-book-top.png), [mobile deals top](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-deals-top.png)
   - Observed: promo banner plus sticky header consume a large part of the first viewport.
   - Recommended fix: reduce sticky vertical footprint after first interaction or collapse the promo bar sooner.

3. Mobile filters are usable but visually dense
   - Surface: mobile booking page
   - Evidence: [mobile booking top](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-book-top.png)
   - Observed: filters wrap into multiple rows and push the first room card down.
   - Recommended fix: collapse advanced filters behind a single control or prioritize the first filter row.

4. Deal propagation is fixed on the main CTA but still inconsistent across alternate path links
   - Surface: deals page
   - Evidence: [mobile deals top](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-deals-top.png)
   - Observed: `Book direct` carries the deal parameter; lower route links remain plain route exits.
   - Recommended fix: either make the lower links inherit the deal state or clearly mark them as generic browsing paths.

### Positive confirmations

- Homepage room cards show prices in both audited viewports.
- The dated booking page shows prices on room cards.
- The main deals CTA carries a deal parameter to booking.
- Octorate now shows room photo, dates, guest count, and a real amount in the main body.

## Activation readiness decision

Decision: `Blocked`

Reason:
- `Critical` blocker still present: contradictory Octorate summary strip.
- `High` blockers still present on the core path in required viewports.

SELL-08 pass condition for this surface:

1. No unresolved `Critical` or `High` issues on:
   - homepage booking entry
   - deals CTA path
   - dated booking page
   - Octorate handoff
2. Mobile and fullscreen both re-audited with rendered screenshots.
3. Latest audit frontmatter updated to:
   - `Activation-Decision: Pass`
   - `Activation-Blockers-High: 0`
   - `Activation-Blockers-Critical: 0`

## Evidence log

- [mobile homepage top](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-home-top.png)
- [mobile homepage room card](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-home-roomcard.png)
- [desktop homepage room cards](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/desktop-home-roomcards.png)
- [mobile deals top](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-deals-top.png)
- [mobile booking top](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-book-top.png)
- [mobile booking room card](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-book-roomcard.png)
- [desktop booking room cards](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/desktop-book-roomcards.png)
- [desktop Octorate handoff](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/desktop-handover-top.png)
- [mobile Octorate handoff](artifacts/2026-03-12-brikette-sales-funnel-rendered-audit/mobile-handover-top.png)

## Next actions

1. Fix the contradictory Octorate top summary strip before any paid activation.
2. Make the mobile Octorate `Continue` action visible above the fold.
3. Align Octorate title casing and baseline brand treatment with Brikette.
4. Add pre-click rate-plan explanation on Brikette room cards.
5. Re-run this audit immediately after the next funnel or Octorate configuration change.
