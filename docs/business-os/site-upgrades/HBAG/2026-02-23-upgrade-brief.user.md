---
Type: Site-Upgrade-Brief
Status: Active
Business: HBAG
Created: 2026-02-23
Updated: 2026-02-23
Last-reviewed: 2026-02-23
Owner: Pete
Mode: WEBSITE-02-L1-Build-2
Image-First-Merchandising-Mode: Active
Platform-Baseline: docs/business-os/platform-capability/2026-02-12-platform-capability-baseline.user.md
Source: Web synthesis + HBAG market research + Caryina app baseline
---

# HBAG Site Upgrade Brief (L1 Build 2, Image-First)

## A) Executive Summary

- (observed) WEBSITE-02 for HBAG is first-cycle and therefore L1 Build 2; image-first auto-mode is active by contract.
- (observed) Current Caryina surface is route-complete but merchandising-light: PLP and PDP are mostly text cards with minimal media depth (`apps/caryina/src/app/[lang]/shop/page.tsx`, `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`).
- (observed) Brand dossier requires product imagery to lead and site chrome to stay recessive.
- (observed) World-class references converge on image-led hierarchy: hero campaign visual first, product grid second, copy tertiary.
- (observed) Best-performing bag sites show early on-body context and hardware detail proof, not just flat product renders.
- (inferred) With ~60 launch variants, conversion quality will depend on gallery consistency, strong filtering, and fast image browsing more than long copy.
- (inferred) Caryina should adopt a photo-led homepage/PLP/PDP contract before adding advanced storytelling modules.
- (inferred) Immediate priority is not “new pages” but reweighting existing pages toward visual merchandising and media QA.
- (observed) References repeatedly use 3:4 to 4:5 image framing and clear family-level navigation to keep browsing dense but premium.
- (inferred) A measurable media contract (shot counts, ordering, density, mobile behavior) is required to avoid subjective “make images bigger” execution drift.
- (inferred) First implementation wave can be shipped with current Next.js stack and existing design tokens without new runtime dependencies.
- (inferred) This brief is decision-ready and directly usable as lp-do-fact-find handoff input.

## B) Business Outcome Frame and Constraints

Outcome frame:
- Move Caryina from manual WhatsApp demand handling to a conversion-capable owned website where image quality and browsing speed can support €80–€150 premium positioning.

Decision links unlocked:
- `DEC-HBAG-01`: continue/scale website-first investment if image-heavy merchandising raises qualified product-detail and checkout intent.
- `DEC-HBAG-WEB-02`: lock a media-production contract (shots per SKU + ordering) before adding additional launch variants.

Non-negotiables:
- Product imagery stays primary; copy supports, not dominates.
- Preserve active brand language and token contract from `docs/business-os/strategy/HBAG/2026-02-21-brand-identity-dossier.user.md`.
- Keep accessibility parity (semantic text remains present; no canvas-only semantic dependency).
- Avoid heavy runtime additions (no WebGL/effects libraries required for this upgrade lane).
- Mobile-first behavior is mandatory (social-origin traffic assumption).

## C) Existing Site Baseline Assessment

Launch-surface mode:
- `website-live` (Caryina app route framework exists and runs).

Observed baseline:
- Locale and route shell exist for shop, PDP, checkout, legal/support paths.
- `shop/page.tsx` renders product cards with slug/title/description/price but no media-forward tile system.
- `product/[slug]/page.tsx` renders title/description/price and checkout link but no gallery, no detail zoom, and no on-body context.
- Header brand system is active (BrandMark + tokenized theme), but merchandising layers are still framework-level.

Primary friction points:
- Insufficient visual hierarchy for a bag-first catalog.
- No image-depth contract per SKU (hero/detail/on-body/scale proof not encoded).
- Browsing density and variant scanning are not optimized for a 60-variant launch.
- PDP lacks trust-through-visual-proof (hardware, stitching, closure, scale, worn context).

## D) Reference-Site Pattern Decomposition

| Reference site | Pattern | Why it matters for HBAG | Evidence (observed/inferred) |
|---|---|---|---|
| LOEWE | Editorial-first hero and family landing pages before dense product browsing | Sets premium tone while still routing quickly into bag families | observed |
| LOEWE | PDP includes multiple framed angles and close craft views | Supports premium price belief through visual proof, not claim-heavy copy | observed |
| Bottega Veneta | Craft-signature visual emphasis (material texture as hero) | Directly relevant for “reads premium in photos” requirement | observed |
| Coach | High-density family collections with campaign + product mix | Useful model for balancing scale (60 variants) and discoverability | observed |
| Strathberry | Consistent 2x3/4x5 product framing with clear silhouette comparison | Helps fast shape comparison across many SKUs | observed |
| Strathberry | Frequent on-body and in-hand context imagery | Reduces uncertainty about scale and styling outcome | observed |
| Polene | Object-led minimal product framing and restrained copy | Aligns with Caryina brand requirement: curated and image-led | observed |
| Longchamp | Strong collection taxonomy plus clean PDP variants | Supports broad assortment browsing without overwhelming UI chrome | observed |
| Mulberry | Family hubs (e.g., Alexa) and shape-first category paths | Useful for grouping many variants under coherent product stories | observed/inferred |
| DeMellier | Collection-first bag browsing with premium image consistency | Good benchmark for launch PLP image consistency across assortment | observed |
| Mansur Gavriel | Minimal category scaffolding and silhouette-led navigation | Reinforces “photo first, copy second” grid behavior | observed/inferred |

## E) Best-Of Synthesis Matrix (Adopt / Adapt / Defer / Reject)

| Pattern | Source reference | User value | Conversion impact | Platform fit | Effort | Risk | Classification | Rationale |
|---|---|---:|---:|---:|---:|---:|---|---|
| Full-bleed homepage hero with immediate bag-category entries | LOEWE, Coach | High | High | High | Medium | Low | Adopt | Establishes premium intent fast while preserving quick route to shopping |
| Media-dense PLP with uniform image ratio and minimal text | Strathberry, Polene, DeMellier | High | High | High | Medium | Low | Adopt | Critical for scanning ~60 variants without copy overload |
| Early on-body shot in each product media sequence | Strathberry, LOEWE | High | High | High | Medium | Low | Adopt | Scale/styling confidence is a key bag purchase unlock |
| Hardware/detail macro shot requirement per SKU | Bottega, LOEWE | High | High | High | Medium | Low | Adopt | Premium proof shifts from words to visual evidence |
| Family-level collection hubs (silhouette-led) | Mulberry, Longchamp | Medium | High | High | Medium | Low | Adopt | Improves assortment navigation and internal search behavior |
| Desktop hover second-image reveal on PLP | Coach, Strathberry | Medium | Medium | High | Low | Low | Adopt | Faster visual comparison without extra clicks |
| Mobile swipe preview behavior in PLP cards | Premium DTC norm | Medium | Medium | Medium | Medium | Medium | Adapt | Useful on mobile but must not degrade scroll performance |
| PDP media strip with “hero -> angle -> detail -> on-body -> scale” order | LOEWE, Strathberry, Longchamp | High | High | High | Medium | Low | Adopt | Creates deterministic, reusable media QA contract |
| Cross-sell strip driven by image chips, not text list | Coach, Longchamp | Medium | Medium | High | Medium | Low | Adapt | Good AOV mechanism once primary PDP trust is solved |
| Background video hero blocks above the fold | Luxury campaign sites | Medium | Low | Medium | Medium | Medium | Defer | Risky for LCP; can be tested after static-image baseline is stable |
| Long editorial brand-story modules before catalog | Luxury brand content hubs | Low | Low | High | Medium | Low | Reject | Conflicts with current launch need: variant browsing and conversion proof |
| 3D/AR bag viewers at launch | Luxury innovation showcases | Medium | Low | Low | High | High | Defer | Too heavy for L1 Build 2; revisit after conversion baseline is healthy |

## F) Design Implications Checklist

- Homepage:
  - Hero must be image-first with direct entry to primary bag families.
  - Campaign stack should prioritize bag imagery blocks over paragraph-heavy sections.
- PLP:
  - Keep dense image-first grid with restrained metadata (title + price + quick CTA only).
  - Make silhouette and color variation scannable before entering PDP.
- PDP:
  - Deterministic media ordering: hero, alternate angle, detail macro, on-body, scale reference.
  - Keep trust copy compact and adjacent to buy action; do not push media below long copy.
- Information architecture:
  - Add family hubs for major silhouettes to prevent a flat 60-variant list.
- Copy system:
  - Product copy remains concise; craft proof shifts to visual sequence and captions.
- Trust/support:
  - Returns/shipping clarity remains visible, but as secondary support rails to visual proof.

## G) Technical Implications Checklist

- Data model:
  - Extend product media schema to support typed assets (`hero`, `alt`, `detail`, `on_body`, `scale`, `video_optional`) and display order.
- Rendering:
  - Introduce reusable PLP media card and PDP gallery components in `apps/caryina`.
  - Keep typography/token usage aligned with existing theme (`@themes/caryina`).
- Performance:
  - Use responsive image sizes and deterministic aspect-ratio placeholders.
  - Add a launch guardrail for image payload and LCP on key surfaces.
- QA:
  - Add content lint/check script for missing mandatory media slots per SKU.
  - Add visual regression snapshots for PLP card and PDP gallery states.
- Accessibility:
  - Ensure alt text strategy by shot role; preserve keyboard and screen-reader pathways.
- Observability:
  - Track interaction events for media engagement (gallery slide, zoom, variant switch, cross-sell click).

## H) Prioritized Backlog Candidates (P1 / P2 / P3)

| Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|---|
| P1 | Rebuild homepage as image-first merchandising surface | Current homepage routing has no premium visual conversion layer | First viewport uses >=70% image area on mobile and desktop; includes direct links to top bag families; text blocks do not exceed 20% viewport height above first scroll | Hero and campaign image set ready | LOEWE, Coach |
| P1 | Replace current PLP cards with media-dense product grid | 60-variant launch needs fast visual scanning | Mobile shows 2-up grid; desktop shows 4-up grid; each card has primary image + secondary image behavior; title and price remain visible without expanding card height | New media schema + transformed product records | Strathberry, Polene, DeMellier |
| P1 | Introduce deterministic PDP gallery contract | Current PDP has no media depth | Each launch SKU has minimum 6 assets in fixed order: hero, angle, detail, on-body, scale, alternate; gallery is swipeable on mobile and keyboard-accessible on desktop | Photography shot list + asset ingestion | LOEWE, Bottega, Strathberry |
| P1 | Ship media QA gate for launch catalog | Prevent inconsistent image quality across 60 variants | Build-time check fails when required media slots are missing; report lists SKU and missing shot type; zero missing required slots for launch subset | Media schema + ingestion pipeline | All exemplar references |
| P2 | Add silhouette family landing pages and filters | Improves findability as assortment grows | Family hubs route from homepage and PLP; filter state persists across pagination and back navigation | Taxonomy mapping from product data | Mulberry, Longchamp |
| P2 | Add visual cross-sell strip on PDP | Supports AOV with low cognitive load | PDP shows at least 8 image-led related products with quick view/add path; click-through tracked | Related-product mapping and analytics events | Coach, Longchamp |
| P3 | Add optional lightweight campaign video module | Potential uplift after static baseline | Video block loads only after primary hero image; fallback static image required; no regression on target LCP threshold | CDN/video asset support + perf budget | Luxury campaign patterns |

## I) Open Questions and Risk Notes

Open questions:
- What is the mandatory launch shot pack per SKU (minimum viable: 6, stretch: 8)?
- Which families/silhouettes are the primary navigation anchors for launch?
- What percentage of the 60 variants is ready with premium-grade photography today?
- Should PDP include model video loops at launch or after static image contract is stable?
- What is the acceptable image payload budget per PDP on mobile 4G?

Risk notes:
- If photography depth is inconsistent, premium price perception will collapse regardless of UI quality.
- A visually dense PLP without strict ratio/cropping rules can look chaotic and reduce trust.
- Overusing motion media early can hurt LCP and mobile conversion.
- Missing typed media metadata will create recurring manual QA debt at each SKU expansion.

## J) Source List (URLs + access dates)

Accessed: 2026-02-23

- https://www.loewe.com/usa/en/women/bags/
- https://www.loewe.com/usa/en/women/bags/amazona
- https://www.loewe.com/usa/en/women/bags/mini-bags/mini-puzzle-bag-in-soft-grained-calfskin/A510P88X16-2150.html
- https://www.bottegaveneta.com/en-us/search?cgid=women-bags-cabat
- https://www.bottegaveneta.com/en-us/mini-cabat-black-815643408.html
- https://www.coach.com/shop/women/handbags
- https://www.coach.com/shop/women/collections/tabby
- https://www.coach.com/products/chain-tabby-shoulder-bag/CBH11.html
- https://us.strathberry.com/collections/all-bags
- https://us.strathberry.com/products/mosaic-bag-black
- https://us.strathberry.com/products/mosaic-nano-black
- https://eng.polene-paris.com/collections/numero-un
- https://www.longchamp.com/us/en/women/bags/
- https://www.longchamp.com/us/en/products/handbag-l-10212HCV001.html
- https://www.longchamp.com/us/en/products/bucket-bag-xs-10159HCN001.html
- https://www.mulberry.com/us/shop/women/bags
- https://www.mulberry.com/us/shop/women/bags/alexa
- https://www.demellierlondon.com/collections/all-bags
- https://www.mansurgavriel.com/collections/bags

## K) Exemplar Image Shot-Board

| Reference site | Page URL | Shot type (hero/PLP/PDP/detail/on-body/cross-sell) | Why it matters | Evidence |
|---|---|---|---|---|
| LOEWE | https://www.loewe.com/usa/en/women/bags/ | hero | Editorial-first bag entry with image-led hierarchy | observed |
| LOEWE | https://www.loewe.com/usa/en/women/bags/amazona | PLP | Family-level entry with dense but premium bag assortment scan | observed |
| LOEWE | https://www.loewe.com/usa/en/women/bags/mini-bags/mini-puzzle-bag-in-soft-grained-calfskin/A510P88X16-2150.html | PDP | Product gallery sequencing and premium framing standard | observed |
| LOEWE | https://www.loewe.com/dw/image/v2/BBPC_PRD/on/demandware.static/-/Sites-LOW_ESP_master/default/dw27f6c9f5/images/A510P88X16/BP/2x3/A510P88X16_2150_2F.jpg?sw=1450&sh=2175&sm=fit | on-body | On-model shot demonstrates scale and styling outcome immediately | observed |
| Bottega Veneta | https://www.bottegaveneta.com/en-us/search?cgid=women-bags-cabat | PLP | Craft-signature category treatment and shape taxonomy | observed |
| Bottega Veneta | https://www.bottegaveneta.com/en-us/mini-cabat-black-815643408.html | PDP | Premium object treatment and focused gallery behavior | observed |
| Bottega Veneta | https://media.bottegaveneta.com/image/upload/f_auto,q_auto,dpr_2.0/v1732280916/content_pages/cabat/Parallax/Card_6.jpg | detail | Texture/material macro usage to justify premium quality | observed |
| Coach | https://www.coach.com/shop/women/handbags | PLP | High-density browsing model with clear family cues | observed |
| Coach | https://www.coach.com/shop/women/collections/tabby | collection hub | Family-level assortment organization for fast intent routing | observed |
| Coach | https://www.coach.com/products/chain-tabby-shoulder-bag/CBH11.html | PDP | Commerce-ready PDP with campaign-to-product continuity | observed |
| Strathberry | https://us.strathberry.com/collections/all-bags | PLP | Uniform frame ratio and silhouette-comparison clarity | observed |
| Strathberry | https://us.strathberry.com/products/mosaic-bag-black | PDP | Primary product framing with clean premium context | observed |
| Strathberry | https://us.strathberry.com/products/mosaic-nano-black | PDP (variant scale) | Mini silhouette presentation useful for small-format SKU merchandising | observed |
| Strathberry | https://us.strathberry.com/cdn/shop/files/2x3_MosaicNano_Black_4x5_8f21808d-5fce-4a0b-8331-47d4031495c4.jpg?v=1747033348&width=1800 | on-body | Strong size/context cue for micro-bag variants | observed |
| Polene | https://eng.polene-paris.com/collections/numero-un | PLP | Minimal copy, image-first product-object browsing | observed |
| Polene | https://eng.polene-paris.com/cdn/shop/files/NumeroUnMonochromeNoirGraine_3_1800x1800.jpg?v=1745313048 | detail/object | Clean material/shape emphasis for premium perception | observed |
| Polene | https://eng.polene-paris.com/cdn/shop/files/0244_-_Cyme_Mini_Camel_3_4fce3322-f86c-4950-975f-5e2498f7423f_1800x1800.jpg?v=1737471656 | on-body | Lifestyle framing while keeping product dominant | observed |
| Longchamp | https://www.longchamp.com/us/en/women/bags/ | PLP | Category breadth with readable family clustering | observed |
| Longchamp | https://www.longchamp.com/us/en/products/handbag-l-10212HCV001.html | PDP | Product-detail layout benchmark for structured bags | observed |
| Longchamp | https://www.longchamp.com/us/en/products/bucket-bag-xs-10159HCN001.html | PDP | Alternate silhouette PDP useful for cross-shape consistency checks | observed |
| Mulberry | https://www.mulberry.com/us/shop/women/bags | PLP | Premium bag taxonomy and navigation benchmark | observed/inferred |
| Mulberry | https://www.mulberry.com/us/shop/women/bags/alexa | collection hub | Family storytelling page pattern for key silhouettes | observed/inferred |
| DeMellier | https://www.demellierlondon.com/collections/all-bags | PLP | Launch-grade collection page with premium visual consistency | observed |
| Mansur Gavriel | https://www.mansurgavriel.com/collections/bags | PLP | Minimalist silhouette-led browsing benchmark | observed/inferred |

## L) Image-Heavy Launch Contract

| Surface | Required media behavior | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|
| Homepage hero | Full-bleed campaign image leads; direct entry to top bag families | First viewport has >=70% image area; at least 2 image-based family links visible without scrolling on mobile | Hero shoot + family taxonomy | LOEWE, Coach |
| Homepage campaign stack | Image-led modules before long copy | Above the fold plus first scroll section contains max 2 short copy blocks; all other blocks are media-first | Campaign asset pack | LOEWE, Polene |
| PLP grid | Dense, uniform product imagery with restrained metadata | Mobile 2-up and desktop 4-up; fixed image ratio across cards; secondary image available for >=90% launch SKUs | Typed media schema + transformed card component | Strathberry, DeMellier |
| PDP gallery depth | Deterministic media ordering for confidence | Each launch SKU has minimum 6 assets in order: hero, alt angle, detail, on-body, scale, alternate; missing slot fails media QA | Shot list + ingestion lint | LOEWE, Bottega, Strathberry |
| Mobile gallery behavior | Swipeable gallery with clear progression and quick CTA reach | Horizontal swipe works with indicator state; median thumb travel <=1.5 screens to reach CTA after first media view; no blocked scrolling | Mobile interaction QA + analytics | Coach, Longchamp |
| Visual trust layer | Detail and craft proof near buy action | Hardware/detail macro and one scale cue are visible before or adjacent to primary buy controls on PDP | Media ordering + PDP composition update | Bottega, LOEWE |
| Performance guardrail | Image-heavy but conversion-safe | LCP on homepage hero <=2.7s (mobile 4G profile) and no CLS from late media sizing on PLP/PDP | Responsive image sizing + placeholders | Platform baseline + implementation QA |

## 11) HTML Companion (Required)

```bash
pnpm docs:render-user-html -- docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md
```

## 12) Fact-Find Handoff Packet

Use this brief as direct `/lp-do-fact-find` input with the following immediate seeds:

| Candidate task seed | Outcome linkage | Decision linkage | Dependencies |
|---|---|---|---|
| Implement typed media schema and ingestion checks | Better premium proof and conversion confidence | DEC-HBAG-WEB-02 | Product data + media asset inventory |
| Rebuild PLP media grid with dense image behavior | Faster variant scanning for 60-SKU launch | DEC-HBAG-01 | Card component and data mapping |
| Ship deterministic PDP gallery | Visual trust and reduced hesitation at premium price | DEC-HBAG-01 | Shot list and PDP component refactor |
| Add homepage image-first merchandising modules | Stronger first impression and path-to-shop clarity | DEC-HBAG-01 | Campaign photography and IA decisions |
