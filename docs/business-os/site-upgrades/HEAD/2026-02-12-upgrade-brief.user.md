---
Type: Site-Upgrade-Brief
Status: Active
Business: HEAD
Created: 2026-02-12
Updated: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
Platform-Baseline: docs/business-os/platform-capability/2026-02-12-platform-capability-baseline.user.md
---

# HEAD Site Upgrade Brief

## 1) Business Outcome Frame

- Convert cochlear-implant headband demand into reliable first sales in Italy, then repeatable weekly sales.
- Reduce wrong-fit/wrong-device purchases through compatibility and sizing clarity.
- Decision links unlocked:
  - `DEC-HEAD-01`: scale paid demand generation beyond precision/retargeting.
  - `DEC-HEAD-02`: expand into add-ons (jewellery/retention accessories) after core PDP conversion is stable.

## 2) Existing Site Baseline

- Launch-surface mode: `pre-website`.
- Core constraint: speed-to-first-sales; avoid heavy CMS dependency in first cycle.
- Current friction risks to remove before scale:
  - compatibility ambiguity,
  - size/fit uncertainty,
  - weak trust signals for a medical-adjacent category,
  - checkout/payment friction for Italian buyers.

## 3) Reference Sites

- PowerAid (Italy): direct local benchmark for pricing, sizing tables, and CI-retention copy.
- SmartEar (EU): strong compatibility-led PDP structure with clear trust stack.
- hearinghenry: CI-specific story-led positioning, especially caregiver/toddler segment.
- Deafmetal: identity-plus-retention framing for adult/teen confidence and add-on economics.
- BAHA Accessories UK: robust options architecture (single/bilateral, age/size tiers, add-ons).
- CI Retention Solutions: bundle and multi-buy mechanics.
- MED-EL / Advanced Bionics: manufacturer-grade compatibility and functional language benchmark.

## 4) Pattern Decomposition

| Reference site | Pattern | Why it matters | Evidence |
|---|---|---|---|
| PowerAid | Head-circumference sizing table with explicit size choices | Reduces fit confusion and returns | Italy PDP includes sizing and direct add-to-cart flow |
| SmartEar | Processor compatibility list on PDP | Removes top purchase blocker ("will it fit my processor?") | Compatible-processor pattern visible on product pages |
| SmartEar | Trust stack near purchase CTA | Increases conversion confidence in medical-adjacent category | 14-day returns, safe shopping, and review confirmation patterns |
| hearinghenry | Caregiver-first narrative for newly implanted children | Aligns with highest-urgency buyer segment | Child/toddler retention narrative is prominent |
| BAHA Accessories UK | Option architecture (single vs bilateral; age-tier sizes) | Lowers wrong-order risk and improves conversion | Structured option choices on PDP |
| CI Retention Solutions | Multi-buy economics | Raises AOV and supports spare/backup usage behavior | Bundle and discount cues |
| Deafmetal | Retention plus style/jewellery lane | Opens adult/teen segment and add-on revenue | How-it-works and style-led retention framing |
| MED-EL / Advanced Bionics | Manufacturer-style compatibility precision | Sets quality bar for language and fit certainty | Accessory pages with structured model references |

## 5) Best-Of Synthesis Matrix

| Pattern | Source reference | User value | Conversion impact | Platform fit | Effort | Risk | Classification (Adopt/Adapt/Defer/Reject) | Rationale |
|---|---|---:|---:|---:|---:|---:|---|---|
| Compatibility matrix by processor model | SmartEar, Advanced Bionics | High | High | Medium | Medium | Medium | Adopt | Highest-impact uncertainty reducer for first purchase |
| Sizing guide by head circumference | PowerAid, BAHA Accessories | High | High | High | Low | Low | Adopt | Fast to implement; direct impact on returns and support |
| Compatibility quiz flow | SmartEar-like compatibility UX | High | Medium | Medium | Medium | Medium | Adapt | Start lightweight; expand after observed support data |
| Mobile sticky add-to-basket | DTC best-practice pattern | Medium | Medium | High | Low | Low | Adopt | Low effort with direct mobile funnel benefit |
| Trust stack near CTA | SmartEar, Deafmetal | High | High | High | Low | Low | Adopt | Needed for confidence in CI-adjacent buying context |
| Italy payments mix (wallets/cards/prepaid-friendly) | Italy ecommerce expectations | High | High | Medium | Medium | Medium | Adopt | Conversion-critical for Italy checkout behavior |
| Delivery ETA + tracking promise | Ecommerce leaders | Medium | Medium | High | Low | Low | Adopt | Reduces buyer anxiety and support load |
| 14-day withdrawal/returns clarity | Italy consumer rights context | High | High | High | Low | Low | Adopt | Compliance plus conversion trust requirement |
| Bundles (2-pack + spare) | CI Retention Solutions style mechanics | Medium | Medium | Medium | Low | Low | Adopt | Lifts AOV and resilience for daily-use buyers |
| Jewellery add-ons lane | Deafmetal | Medium | Low | Medium | Medium | Medium | Defer | Valuable after core headband funnel stabilizes |
| Clinic/provider partner page | Manufacturer/provider patterns | Medium | Medium | Medium | Medium | Medium | Adapt | Good referral channel; stage after core PDP reliability |

## 6) Design Implications

- Information architecture:
  - Home with ICP split (`Caregivers/Kids`, `Sport/Active`, `Daily Comfort`).
  - Core PDP with compatibility + sizing above the fold.
  - Dedicated compatibility guide and sizing guide pages.
  - Support/FAQ, legal/returns, and provider page.
- Page/component implications:
  - Compatibility matrix component.
  - Size selector with circumference helper.
  - Trust strip near CTA (payments, returns, shipping, reviews).
  - Sticky mobile purchase CTA.
- Copy/messaging implications:
  - Use-case language: loss prevention, fit stability, sweat/sport stability.
  - Avoid medical efficacy claims.
  - Clarify microphone-safe wear guidance where true.
- Trust/support implications:
  - Fast support entrypoint (including messaging channel).
  - Clear delivery windows and returns workflow.

## 7) Technical Implications

- Reusable platform primitives to use:
  - product option components,
  - trust/payment iconography blocks,
  - FAQ/accordion patterns,
  - analytics event hooks for funnel steps.
- New build requirements:
  - compatibility data model keyed by processor family/model,
  - sizing helper logic + content management for fit guides,
  - event instrumentation for compatibility/sizing interactions.
- Testing and observability implications:
  - Unit tests for compatibility and size logic.
  - Integration tests for add-to-cart with options.
  - E2E tests for checkout path and policy visibility.
  - KPI logging for CVR, checkout drop-off, and return reasons.

## 8) Prioritized Backlog Candidates

| Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|---|
| P1 | Build compatibility matrix on PDP | Top conversion blocker | Users can select processor type and see fit status; no broken states | Processor model list | SmartEar, Advanced Bionics |
| P1 | Add circumference-based sizing guide | Top return-risk blocker | Sizing guide visible from PDP; size selection assist works on mobile/desktop | Size chart content | PowerAid, BAHA Accessories |
| P1 | Add trust stack + returns/delivery summary near CTA | Purchase confidence + compliance | Payment, shipping ETA, and returns summary visible before checkout | Policy copy, payment config | SmartEar, Italy rights |
| P1 | Implement sticky mobile add-to-basket | Mobile conversion uplift | Sticky CTA appears on scroll and preserves selected options | PDP option state | DTC best-practice pattern |
| P2 | Add bundles (2-pack + spare) | AOV and convenience | Bundle option on PDP and tracked in analytics | Pricing rules | CI Retention Solutions |
| P2 | Add compatibility quiz page | Pre-qualification | Quiz routes users to right variant and logs outcomes | Compatibility data model | SmartEar pattern |
| P3 | Add clinic/provider landing page | Referral channel | Provider page live with contact/referral flow | Ops readiness | MED-EL/provider model |
| P3 | Add jewellery add-on lane | Expansion after core proof | Add-on page integrated and purchasable | Add-on SKU readiness | Deafmetal |

## 9) Open Questions

- Which processor models are guaranteed supported at launch (exact compatibility table)?
- Which payment methods will be live on day one in Italy (cards, PayPal, wallet set)?
- What is the final delivery SLA promise for Italy and how is tracking communicated?
- Which support channel SLA is realistic for first 30 days?
- Which bundle configuration is preferred for first test (`2-pack`, `3-pack`, mixed)?

## 10) Source List

Accessed 2026-02-12:

- https://www.poweraid.it/apparecchi-acustici/protesi-acustiche-digitali/sistemi-anticaduta/smartear-fascia-universale-per-impianti-cocleari-grigio-l.html
- https://smartear.eu/en/products/med-el-sports-headband-for-audio-processor-1421
- https://smartear.eu/en/delivery
- https://smartear.eu/en/payments
- https://hearinghenry.com/products/standard-junior-headband
- https://hearinghenry.com/pages/shipping-information
- https://deafmetalusa.com/
- https://deafmetalusa.com/products/holster
- https://www.bahaaccessoriesuk.com/product/aligator-baha-headband-cochlear-baha-oticon-ponto-medel-adhear/
- https://www.ciretentionsolutions.com/product-page/retention-bows
- https://www.medel.com/hearing-solutions/accessories/fixations
- https://www.advancedbionics.com/us/en/portals/consumer-portal/shop/accessories.html
- https://www.osservatori.net/comunicato/ecommerce-b2c/ecommerce-b2c-in-italia-cresce-netcomm/
- https://www.mimit.gov.it/it/mercato-e-consumatori/tutela-del-consumatore/diritti-del-consumatore/diritto-di-recesso

## 11) HTML Companion (Required)

```bash
pnpm docs:render-user-html -- docs/business-os/site-upgrades/HEAD/2026-02-12-upgrade-brief.user.md
```
