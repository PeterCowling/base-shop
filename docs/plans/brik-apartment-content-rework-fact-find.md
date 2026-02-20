---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Feature-Slug: brik-apartment-content-rework
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-system
Related-Plan: docs/plans/brik-apartment-content-rework-plan.md
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: TBD
---

# Apartment Content Rework Fact-Find Brief

## Scope

### Summary

The apartment pages (hub + 3 sub-pages) were built with correct technical plumbing — routes, FitCheck truth layer, Octorate integration, GA4 events, navigation, structured data — but shipped with placeholder-grade copy and an inverted page structure that contradicts the revenue architecture brief. The pages do not sell; they describe an anonymous apartment with generic text that undersells a 495-550/night product and introduces expectation-mismatch risk via factual inaccuracies.

This rework brings content, structure, and data alignment to the level specified in the brief (`docs/business-os/strategy/BRIK/2026-02-12-apartment-revenue-architecture.user.md`).

### Goals

- Fix hub page structure: hero above fold, then intent cards, then FitCheck, then CTA — matching brief section 6A
- Replace all placeholder copy with brief-aligned, positioning-accurate content across all 4 pages
- Fix factual inaccuracies (kitchen size, bathroom count, amenities list)
- Add WhatsApp CTA to hub page; fix empty WhatsApp links on sub-pages
- Add price anchoring signal (seasonal "from" price)
- Update SEO metadata to target brief's keyword clusters (section 9)
- Fix booking page placeholder values (GA4 price, rate plan base price)

### Non-goals

- Adding photography/video assets (pending from Pete — placeholders are acceptable)
- Octorate rate plan ID setup (external dependency, TODO markers remain)
- Translation to non-English locales (follow-on task)
- Redesigning page layouts or component architecture (structure reordering only)
- Adding social proof / reviews module (valuable but separate scope)
- Cross-sell module from hostel booking flow (brief section 14C — follow-on)

### Constraints & Assumptions

- Constraints:
  - All changes are content/copy/structure — no new components needed
  - Must preserve existing test coverage (120 suites, 755 tests, 0 failures)
  - Must work on both static export (staging) and production (OpenNext/Worker)
  - English only; other locale JSON files get English fallback (existing pattern)
  - No hardcoded colors or arbitrary Tailwind values (design system compliance)
- Assumptions:
  - WhatsApp number `393287073695` (from booking page) is correct for all apartment CTAs
  - "From €265/night" is acceptable as the starting price signal (shoulder season per brief)
  - Apartment spec from brief section 2 is factually accurate (100sqm, full kitchen, 2 bathrooms, sleeps 4)

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/[lang]/apartment/page.tsx` — hub page server component (metadata + render)
- `apps/brikette/src/app/[lang]/apartment/street-level-arrival/page.tsx` — street-level arrival page
- `apps/brikette/src/app/[lang]/apartment/private-stay/page.tsx` — private stay page
- `apps/brikette/src/app/[lang]/apartment/book/page.tsx` — booking page

### Key Modules / Files

- `apps/brikette/src/app/[lang]/apartment/ApartmentPageContent.tsx` — hub client component (structure + content)
- `apps/brikette/src/app/[lang]/apartment/street-level-arrival/StreetLevelArrivalContent.tsx` — street-level client component
- `apps/brikette/src/app/[lang]/apartment/private-stay/PrivateStayContent.tsx` — private stay client component
- `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx` — booking client component
- `apps/brikette/src/locales/en/apartmentPage.json` — all apartment copy (single translation file)
- `apps/brikette/src/components/apartment/FitCheck.tsx` — truth layer component (no changes needed)
- `apps/brikette/src/components/apartment/GallerySection.tsx` — gallery (no changes needed)
- `packages/ui/src/organisms/ApartmentHeroSection.tsx` — hero component (no changes needed)
- `packages/ui/src/organisms/ApartmentHighlightsSection.tsx` — highlights component (reads from translations)
- `packages/ui/src/organisms/ApartmentDetailsSection.tsx` — details component (reads from translations)
- `packages/ui/src/organisms/ApartmentAmenitiesSection.tsx` — amenities component (reads from translations)
- `apps/brikette/src/data/roomsData.ts` — apartment room data entry (placeholder pricing)
- `apps/brikette/src/utils/trackApartmentEvent.ts` — GA4 event utility (no changes needed)

### Issues Catalogued (Brief vs. Built)

#### I1: Hub page structure is inverted (CRITICAL)

**Brief spec (section 6A):** Above-the-fold: Hero (premium photography) → Intent cards → FitCheck → CTA

**Actual render order in `ApartmentPageContent.tsx`:**
1. `sr-only` h1 (invisible)
2. One line of generic body text
3. Intent-routing cards
4. FitCheck
5. "Check availability" CTA
6. HeroSection ← buried below fold
7. HighlightsSection
8. GallerySection
9. AmenitiesSection
10. DetailsSection

The hero — the single strongest visual hook for a €500/night product — is rendered *after* the CTA. A visitor sees a wall of text and small cards before any imagery.

**Fix:** Reorder to: HeroSection → Intent cards → FitCheck → CTA → (remaining sections).

#### I2: All copy is placeholder-grade (CRITICAL)

| Element | Current value | Problem | Brief-aligned replacement needed |
|---|---|---|---|
| `meta.title` | "Apartment Accommodation" | Generic, no location, no USP | Target "apartment Positano" cluster (brief S9) |
| `meta.description` | "Learn about our self-catering apartment in Positano." | Passive, no hook, no USP | Include step-free, couples, price anchor |
| `title` | "Apartment" | One word, sr-only anyway | Descriptive h1 |
| `body` | "Our apartment offers a comfortable stay with stunning views." | Could describe any rental anywhere | Specific: 100sqm, couples, step-free arrival, full kitchen |
| `heroTitle` | "Private Apartment" | Two generic words | Brief: premium interior feel |
| `heroIntro` | "Enjoy a fully equipped space with stunning Positano views." | Booking.com cliché | Specific to this property |
| Highlight 1 | "Panoramic Views" / "Wake up to sweeping vistas every morning." | Generic filler | Property-specific |
| Highlight 2 | "Comfortable Spaces" / "Plenty of room to relax after exploring." | Generic filler | Property-specific (100sqm, full kitchen) |
| Highlight 3 | "Central Location" / "**Steps** from shops and the beach." | Uses word "steps" on a step-free brand | Rewrite — avoid "steps" entirely |

#### I3: Details list is factually wrong (HIGH)

Current `detailsList`:
```json
["Sleeps up to 4 guests", "Kitchenette with fridge", "Private bathroom", "Air conditioning", "Sea-view balcony"]
```

Per brief section 2:
- **"Kitchenette with fridge"** → full kitchen (100sqm apartment)
- **"Private bathroom"** → 2 bathrooms
- **"Sea-view balcony"** → not confirmed in brief; if inaccurate, creates expectation-mismatch risk

#### I4: No WhatsApp CTA on hub page (MEDIUM)

Brief section 8: Secondary CTA "WhatsApp for quick answers" on **all pages**. Hub page only has "Check availability". Sub-pages and booking page have WhatsApp CTAs.

#### I5: WhatsApp links empty on sub-pages (HIGH — broken functionality)

- `StreetLevelArrivalContent.tsx:73` → `href="https://wa.me/"` (no phone number)
- `PrivateStayContent.tsx:84` → `href="https://wa.me/"` (no phone number)
- `ApartmentBookContent.tsx:23` → `href="https://wa.me/393287073695"` (correct)

Two of four WhatsApp CTAs link to nothing.

#### I6: No price signal (MEDIUM)

At €495-550/night in-season, visitors need a price anchor to self-qualify before clicking through the funnel. Brief section 2 confirms shoulder season starts at €265/night. No price is shown anywhere.

#### I7: Booking page placeholder GA4 values (LOW — analytics accuracy)

`ApartmentBookContent.tsx:68-69`:
```typescript
value: nights * 150,
items: [{ ..., price: 150, ... }]
```

€150 is a placeholder. `roomsData.ts` also has `basePrice: { amount: 150.0 }`. Should reflect actual pricing (€265-550 range).

#### I8: Amenities list incomplete (LOW)

Current: `["Wi-Fi included", "Fully equipped kitchen", "Air conditioning", "Washer and dryer"]`

Missing from brief: 2 bathrooms, terrace access (optional, next door), 100sqm size. "Fully equipped kitchen" is correct here but contradicts the details list which says "Kitchenette".

#### I9: All OG images use same facade.avif (LOW)

All 4 pages generate OG images from `/img/facade.avif`. Ideally each intent page would use differentiated imagery, but this depends on photography assets (non-goal for this rework).

### Patterns & Conventions Observed

- All copy lives in `apartmentPage.json` — components read via `useTranslation("apartmentPage")`. Content changes are translation-file-only unless structure reordering is needed.
- Hero, Highlights, Details, Amenities sections are `packages/ui` organisms that read from translations. Copy changes propagate automatically.
- Hub page structure is controlled by `ApartmentPageContent.tsx` render order.
- WhatsApp URL should be a shared constant (booking page already has it hardcoded).
- Metadata uses `buildAppMetadata` helper — titles/descriptions come from translation file.

### Dependency & Impact Map

- Upstream: `apartmentPage.json` translations → all 4 page components + all `packages/ui` apartment organisms
- Downstream: SEO metadata (Google indexing), GA4 analytics accuracy, user conversion funnel
- Blast radius: Contained to apartment pages only. No hostel/rooms pages affected. Shared `packages/ui` organisms read from translations so content changes don't affect other apps.

### Test Landscape

#### Test Infrastructure
- **Framework:** Jest
- **Command:** `pnpm --filter brikette test`
- **CI:** Required check before merge

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| FitCheck component | unit | `src/test/components/apartment/FitCheck.test.tsx` | 5 topics render, semantic HTML |
| Navigation integration | unit | `src/test/components/apartment/ApartmentIntegration.test.tsx` | NAV_ITEMS, header translation, redirects, JSON-LD, GA4 events |
| GA4 checkout | unit | `src/test/components/ga4-07-apartment-checkout.test.tsx` | begin_checkout event shape |
| Details CTA | unit | `src/test/components/apartment/DetailsSection.test.tsx` | Modal vs URL booking CTA |

#### Coverage Gaps

- No test for hub page render order (hero position, card position)
- No test for WhatsApp link validity (href contains phone number)
- No test for copy accuracy (meta titles, details list content)
- GA4 checkout test asserts placeholder price (€150) — will need updating if price changes

#### Testability Assessment

- **Easy to test:** Translation key accuracy, WhatsApp URL validity, render order assertions
- **Hard to test:** Visual above-fold position (would need E2E/visual regression)

### Recent Git History (Targeted)

- `2026-02-12/13` — All 6 apartment tasks completed (TASK-01 through TASK-06). Technical plumbing correct, content placeholder.
- `2026-02-13` — TASK-06 added nav, GA4, redirects, structured data. Nav fix (this session) added apartment to `packages/ui` navItems.

## Questions

### Resolved

- Q: What is the correct WhatsApp number for apartment CTAs?
  - A: `393287073695` — already used in `ApartmentBookContent.tsx:23`
  - Evidence: `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx:23`

- Q: What is the shoulder-season starting price?
  - A: €265/night (non-refundable), per brief section 2
  - Evidence: `docs/business-os/strategy/BRIK/2026-02-12-apartment-revenue-architecture.user.md` section 2

- Q: Is "Sea-view balcony" in the details list accurate?
  - A: Brief does not mention a balcony. Structured data (`apartment.jsonld`) lists "Terrace" as an amenity but this is the hostel communal terrace next door, not a private balcony. This is an expectation-mismatch risk.
  - Evidence: `apps/brikette/src/schema/apartment.jsonld` amenities list vs brief section 2

- Q: Should the hub page have a WhatsApp CTA?
  - A: Yes — brief section 8 says secondary CTA on all pages.
  - Evidence: Brief section 8: "WhatsApp for quick answers (high intent; handles qualification on stairs/noise quickly)"

### Open (User Input Needed)

- Q: Does the apartment have a private balcony or sea view, or is that only via the hostel communal terrace?
  - Why it matters: "Sea-view balcony" in the details list is either accurate or creates mismatch risk at €500+/night
  - Decision impacted: Details list copy, structured data accuracy
  - Decision owner: Pete
  - Default assumption: Remove "Sea-view balcony" from details, mention optional terrace access next door. Risk if wrong: undersells the property.

- Q: What is the actual base price to use in roomsData.ts and GA4 tracking?
  - Why it matters: GA4 begin_checkout reports €150/night (placeholder). Real conversion analytics need real pricing.
  - Decision impacted: `roomsData.ts` basePrice, GA4 event value
  - Decision owner: Pete
  - Default assumption: Use €265 (shoulder season minimum from brief). Risk: GA4 values won't match peak-season actual.

## Confidence Inputs (for /lp-do-plan)

- **Implementation:** 92%
  - Most changes are translation-file edits (apartmentPage.json). Hub structure reorder is a JSX move in one file. WhatsApp fix is a string constant. All patterns established.
  - Would reach 95%: Confirmation on balcony/sea-view accuracy

- **Approach:** 90%
  - Brief provides clear positioning, keyword targets, and page roles. Copy direction is unambiguous. The approach is "align to the spec that already exists."
  - Would reach 95%: Final copy review from Pete before deploy

- **Impact:** 95%
  - Changes are contained to apartment pages and one translation file. No shared component modifications. No risk to hostel pages.
  - Blast radius: apartment pages only.

- **Delivery-Readiness:** 88%
  - All files identified, patterns clear, tests exist. Two open questions (balcony accuracy, base price) are non-blocking — can use safe defaults.
  - Would reach 95%: Answers to open questions

- **Testability:** 85%
  - Content accuracy can be tested via translation key assertions. WhatsApp URL validity is testable. Render order can be tested with DOM position checks.
  - Would improve: Adding a hub-page render-order test

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| "Sea-view balcony" claim is inaccurate | Medium | High (mismatch → bad review at €500/night) | Remove from details list; add optional terrace mention instead. Ask Pete to confirm. |
| Price signal ("from €265") becomes outdated if pricing changes | Low | Low (cosmetic inaccuracy) | Use translation key so it's easy to update; note in docs |
| Reordering hub page JSX breaks existing test assertions | Low | Low (tests check presence, not order) | Run full test suite after reorder |
| Copy changes need translation to 17 other locales | Certain | Medium (English-only until follow-up) | Accepted non-goal; other locales fall back to English |

## Planning Constraints & Notes

- Must-follow patterns:
  - All copy changes go in `apartmentPage.json` — components read via `useTranslation`
  - Hub page structure controlled by render order in `ApartmentPageContent.tsx`
  - WhatsApp URL: extract to shared constant (like booking page pattern)
  - Metadata comes from translation file via `buildAppMetadata` helper
- Rollout/rollback:
  - Direct deploy — copy changes are safe to ship
  - Rollback: revert `apartmentPage.json` and `ApartmentPageContent.tsx`
- Observability:
  - GA4 events already in place — monitor CTA CTR after content upgrade
  - Track bounce rate change on hub page (expect improvement with hero above fold)

## Suggested Task Seeds (Non-binding)

1. **Reorder hub page structure** — Move HeroSection above intent cards in `ApartmentPageContent.tsx`. Add WhatsApp secondary CTA.
2. **Rewrite all copy in apartmentPage.json** — Meta titles/descriptions, body text, hero copy, highlights, details list, amenities list. Fix factual errors (kitchen, bathrooms). Add price signal.
3. **Fix WhatsApp links** — Extract WhatsApp URL to shared constant. Fix empty `wa.me/` hrefs in street-level and private-stay pages.
4. **Update booking page data accuracy** — Fix GA4 placeholder price in `ApartmentBookContent.tsx`. Update `roomsData.ts` basePrice.
5. **Update/add tests** — WhatsApp URL validity test, hub render-order test, details-list accuracy test. Update GA4 checkout test if price changes.

## Execution Routing Packet

- Primary execution skill: `/lp-do-build`
- Supporting skills: `/lp-design-system` (token compliance check only)
- Deliverable acceptance package:
  - All 4 apartment pages render brief-aligned content
  - Hub page: hero above fold, intent cards below, FitCheck, WhatsApp + Check Availability CTAs
  - No factual inaccuracies in details/amenities lists
  - All WhatsApp links contain valid phone number
  - Meta titles target brief's keyword clusters
  - Full test suite passes (120+ suites, 755+ tests, 0 failures)
  - Typecheck clean
- Post-delivery measurement:
  - GA4: compare hub page bounce rate before/after
  - GA4: CTA CTR on apartment pages
  - Manual: verify meta titles appear correctly in dev tools

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None (open questions have safe defaults)
- Recommended next step: Proceed to `/lp-do-plan`
