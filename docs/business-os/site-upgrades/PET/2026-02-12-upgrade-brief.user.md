---
Type: Site-Upgrade-Brief
Status: Active
Business: PET
Created: 2026-02-12
Updated: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
Platform-Baseline: docs/business-os/platform-capability/2026-02-12-platform-capability-baseline.user.md
---

# PET Site Upgrade Brief

## 1) Business Outcome Frame

- Convert first PET demand into reliable sales using a fast pre-website surface, then harden into repeatable DTC.
- Maximize conversion on a style-led but utility-critical product (poop bag holder) while minimizing returns and support load.
- Decision links unlocked:
  - `DEC-PET-01`: scale traffic and channel investment after first conversion proof.
  - `DEC-PET-02`: expand bundle/recurring bag economics once holder conversion is stable.

## 2) Existing Site Baseline

- Launch-surface mode: `pre-website`.
- Core constraint: speed-to-first-sales; avoid heavy build before proof.
- Current friction risks to remove before scale:
  - weak trust signals for a new brand,
  - unclear fit/compatibility on bag roll formats,
  - weak bundle and quick-add UX,
  - checkout/payment friction for Italy.

## 3) Reference Sites

- MiaCara: premium-accessory PDP discipline (fit/details/trust).
- Labbvenn: material quality framing + incentives.
- Poldo Dog Couture: Italian premium signal and origin trust.
- A.Mici&Co Boutique: quick-cart and localized merchandising.
- Sezane, Missoma, Astrid & Miyu, Monica Vinader: fashion-grade DTC trust, quick-add, bundles/sets, and post-purchase confidence patterns.

## 4) Pattern Decomposition

| Reference site | Pattern | Why it matters | Evidence |
|---|---|---|---|
| MiaCara | Strong PDP structure (dimensions, promise, accessory context) | Reduces uncertainty on a functional accessory sold at premium aesthetics | Deep research pattern code: `V>F>T>B>P>Q` |
| Labbvenn | Material-quality framing + offer nudge | Supports premium positioning while retaining conversion intent | Deep research pattern code: `I>F>P>T>B>Q` |
| Poldo Dog Couture | Made-in-Italy trust and premium signal | Helps PET if origin/story is part of offer | Deep research pattern code: `O>T>Q>I>C>B` |
| A.Mici&Co | Quick-cart behavior in localized pet context | Faster purchase path and less PDP drop-off | Deep research pattern code: `Q>V>T>B>I>F` |
| Sezane | Trust strip + payment confidence patterns | Strong checkout confidence and reduced hesitation | Deep research pattern code: `T>C>Q>V>P>I` |
| Missoma | Bundle/set mechanics + warranty/returns confidence | Direct AOV and repeat-buy leverage | Deep research pattern code: `I>B>P>T>C>Q` |
| Astrid & Miyu | Quick-add and loyalty cues | Supports repeat purchase economics in accessory category | Deep research pattern code: `Q>L>T>B>I>C` |
| Monica Vinader | Strong policy promises (warranty/returns) | Improves trust for first-time buyers | Deep research pattern code: `P>T>I>C>Q>L` |

## 5) Best-Of Synthesis Matrix

| Pattern | Source reference | User value | Conversion impact | Platform fit | Effort | Risk | Classification (Adopt/Adapt/Defer/Reject) | Rationale |
|---|---|---:|---:|---:|---:|---:|---|---|
| Trust strip near CTA | Sezane, Monica Vinader | High | High | High | Low | Low | Adopt | Fastest confidence uplift for new-brand purchase |
| Fit and compatibility clarity (roll size and holder dimensions) | MiaCara, Labbvenn | High | High | High | Low | Low | Adopt | Prevents wrong-buy and return-heavy orders |
| Quick add / sticky add-to-cart | A.Mici&Co, Astrid & Miyu | Medium | High | High | Low | Low | Adopt | Direct mobile conversion gain with low implementation effort |
| Bundles (holder + bags, multi-buy) | Missoma bundle logic + pet category patterns | High | Medium | Medium | Low | Low | Adopt | Improves AOV and supports early repeat economics |
| Incentive framing (starter offer / first-order nudge) | Labbvenn, Missoma | Medium | Medium | Medium | Low | Medium | Adapt | Use lightly to avoid discount-led brand positioning |
| Origin/craft signal | Poldo Dog Couture | Medium | Low | Medium | Low | Low | Adapt | Useful if truthful and core to PET brand story |
| Chat-assisted purchase | Sezane/Poldo style support cues | Medium | Medium | High | Low | Low | Adopt | Reduces pre-purchase hesitation and support cycle time |
| Delivery/returns promise block | Monica Vinader-like confidence pattern | High | High | High | Low | Low | Adopt | Core trust and legal clarity requirement |
| Loyalty points layer | Astrid & Miyu | Low | Low | Medium | Medium | Medium | Defer | Useful later, not first-cycle critical |

## 6) Design Implications

- Information architecture:
  - Home (style + utility split),
  - Core holder PDP,
  - Bundle PDP (`holder + bags`),
  - Support/FAQ,
  - Shipping/returns/legal.
- Page/component implications:
  - trust strip near CTA,
  - explicit fit block (dimensions + compatible roll format),
  - quick add / sticky mobile add-to-cart,
  - bundle selector.
- Copy/messaging implications:
  - combine aesthetic language with reliability claims (`secure closure`, `easy dispense`, `clean carry`),
  - avoid vague green claims for bags without substantiation.
- Trust/support implications:
  - clear delivery window and tracking promise,
  - clear returns/withdrawal workflow,
  - visible support channel for pre-purchase questions.

## 7) Technical Implications

- Reusable platform primitives to use:
  - product option controls,
  - quick-cart/sticky CTA component,
  - trust strip block,
  - FAQ and policy components.
- New build requirements:
  - explicit fit/compatibility field model (`holder dimensions`, `roll format compatibility`),
  - bundle pricing rule engine for holder+bags packs,
  - event instrumentation for quick add, bundle selection, and checkout drop-off.
- Testing and observability implications:
  - unit tests for bundle/price logic,
  - integration tests for option and quick-add flows,
  - E2E tests for checkout and policy visibility,
  - funnel analytics with conversion by message/offer variant.

## 8) Prioritized Backlog Candidates

| Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|---|
| P1 | Add trust strip + delivery/returns block on purchase surface | New-brand trust gap is critical | Trust/payment/returns signals visible before checkout on mobile and desktop | Policy copy and payment setup | Sezane, Monica Vinader |
| P1 | Add explicit fit/compat block (dimensions + roll format) | Major wrong-order/return risk | Fit block present on PDP; no missing product-size fields; support FAQ linked | Product spec finalization | MiaCara, Labbvenn |
| P1 | Implement quick-add and sticky mobile ATC | Direct conversion uplift | Quick-add works from list/PDP; sticky CTA retains selection state | PDP option state handling | A.Mici&Co, Astrid & Miyu |
| P1 | Add holder + bags bundle option | AOV and repeat path | Bundle is selectable, price verified, and tracked in analytics | Bag SKU readiness | Missoma-inspired bundle logic |
| P2 | Add chat-assisted pre-purchase support | Reduces hesitation and support delays | Contact channel visible on PDP/FAQ; response SLA defined | Ops support owner | Sezane/Poldo support cues |
| P2 | Add origin/craft signal block (if true) | Premium differentiation | Origin claims are factual and displayed consistently | Verified sourcing narrative | Poldo Dog Couture |
| P3 | Add loyalty/reward mechanic | Repeat economics after proof | Loyalty config live and measured | Stable baseline conversion | Astrid & Miyu |

## 9) Open Questions

- What exact roll formats will be guaranteed compatible at launch?
- Will bags be included in-box by default or only as bundle add-on?
- What first-cycle shipping SLA can be promised reliably in Italy?
- Which payment methods are confirmed day one (cards, wallets, PayPal, prepaid-friendly)?
- Which support channel SLA can be maintained in week 1-4?

## 10) Source List

Accessed 2026-02-12:

- https://miacara.com/en/products/pisa
- https://labbvenn.com/product/saku
- https://poldodogcouture.com/collections/dog-bag-holder
- https://amicieco.com/collections/porta-sacchetti
- https://www.sezane.com/eu-en
- https://www.missoma.com
- https://www.astridandmiyu.com/collections/necklaces
- https://www.monicavinader.com

## 11) HTML Companion (Required)

```bash
pnpm docs:render-user-html -- docs/business-os/site-upgrades/PET/2026-02-12-upgrade-brief.user.md
```
