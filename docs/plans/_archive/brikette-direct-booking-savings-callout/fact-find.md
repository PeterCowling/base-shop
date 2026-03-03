---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: brikette-direct-booking-savings-callout
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brikette-direct-booking-savings-callout/plan.md
Trigger-Why: "Guests on the hostel booking page have no named-OTA savings signal to anchor the 'book direct' decision — the apartment page provides this explicitly; parity closes a minor conversion gap."
Trigger-Intended-Outcome: "type: measurable | statement: Add a named-OTA savings headline to the hostel /book page (up to 25% less than Booking.com) — visible before the room grid — so every hostel booking page visitor sees the same anchoring signal the apartment page already provides | source: operator"
Dispatch-ID: IDEA-DISPATCH-20260227-0040
---

# BRIK Direct Booking Savings Callout — Fact-Find Brief

## Scope

### Summary

The hostel `/book` page promotes direct booking with a `DirectPerksBlock` ("Why book direct?" + 3 checklist items including "Up to 25% off"), but it never names the OTA reference point. The apartment booking page (`/apartment/book`) already provides explicit savings badges — "Save 26% vs OTA" and "Save 21% vs OTA" — directly on rate cards. The proposed change brings the hostel booking page to parity by inserting a named-OTA savings headline ("Up to 25% less than Booking.com") near the top of the booking flow, before guests reach the room grid.

### Goals

- Add an explicit, named-OTA savings claim to the hostel `/book` page visible before the room grid
- Match the visual framing established by the apartment `directSavings` block (eyebrow + headline)
- Extend `DirectPerksBlock` or introduce a small standalone component; no new data fetching
- Cover all 18 supported locales via i18n

### Non-goals

- Live/dynamic OTA rate comparison (scraping OTA prices at runtime — out of scope for P3)
- Rate-match guarantee mechanic (claim a refund if OTA is cheaper)
- Changes to the apartment booking flow
- Changes to the notification banner, deals page, or room card badges

### Constraints & Assumptions

- Constraints:
  - The savings claim must match the existing sitewide "up to 25%" figure (notification banner, `DirectPerksBlock` copy) — do not introduce a new percentage without operator confirmation
  - Naming Booking.com specifically is consistent with the apartment page pattern ("Up to 26% less than Booking.com") and the sitewide notification modal; carry this convention to the hostel page
  - i18n-exempt fallback pattern (`BRIK-005 [ttl=2026-03-15]`) applies to new keys until translations are provided; machine translations or EN fallback are acceptable at ship time
  - The `BRIK-005` TTL expires 2026-03-15 — if this ships near or after that date, full locale translations must be provided

- Assumptions:
  - "Up to 25%" is the verified hostel savings figure (inferred: notification banner consistent across all pages including hostel `/book`)
  - Booking.com is the primary named OTA reference (inferred: `ratingsBar.json` lists it first, apartment page uses it, guides content references it; Hostelworld is also listed but used for ratings, not price comparison)
  - Guests see the notification banner before navigating to `/book`, so this callout is a reinforcement signal, not the first exposure to the claim

## Outcome Contract

- **Why:** Guests landing on the hostel booking page have no named-OTA price anchor. The apartment page already provides this. Adding parity closes a minor conversion gap for the higher-volume hostel product.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Named-OTA savings headline visible on the hostel `/book` page before the room grid; GA4 `view_item_list` and `search_availability` events continue to fire without regression; no locale fallback warnings in production builds
- **Source:** operator

## Access Declarations

None — this fact-find requires no external data sources. All investigation was conducted within the repository.

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx:233` — `<DirectPerksBlock>` rendered between the date picker and `RoomsSection`; this is the insertion point for the savings headline
- `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx:243-285` — reference implementation: savings badge rendered inline on NR/Flex rate cards using `tBook("apartment.nr.saving")` / `tBook("apartment.flex.saving")`
- `apps/brikette/src/app/[lang]/apartment/ApartmentPageContent.tsx` (inferred) — `directSavings` block with eyebrow + headline above the booking form; second reference pattern

### Key Modules / Files

- `apps/brikette/src/components/booking/DirectPerksBlock.tsx` — compact "Why book direct?" component rendered on `/book`; accepts `lang` and optional `className`; returns a `<div>` with heading + checklist; **will be extended or replaced** as the primary change surface
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` — booking page orchestrator; currently passes `lang` and `className` to `DirectPerksBlock`; will need to pass new props or swap component
- `apps/brikette/src/locales/en/bookPage.json` — English locale for the booking page; already has `bookPage.apartment.nr.saving` / `bookPage.apartment.flex.saving` ("Save X% vs OTA"); new hostel savings keys go here
- `apps/brikette/src/locales/{ar,da,de,es,fr,hi,hu,it,ja,ko,no,pl,pt,ru,sv,vi,zh}/bookPage.json` — 17 non-English locales requiring translation or i18n-exempt fallback for new keys (18 locales total including EN)
- `apps/brikette/src/test/components/book-page-perks-cta-order.test.tsx` — existing ordering test; fully mocks `DirectPerksBlock`, so existing assertions are unaffected; extend with assertions for the new savings headline if added to the mock
- `apps/brikette/src/test/components/book-page-social-proof-order.test.tsx` — adjacent test for social proof ordering; lower risk of regression

### Patterns & Conventions Observed

- i18n-exempt fallback pattern — evidence: `apps/brikette/src/components/booking/DirectPerksBlock.tsx:19-33`; new locale keys use `{ defaultValue: "...", // i18n-exempt -- BRIK-005 [ttl=2026-03-15] }` until translations land
- `useTranslation("bookPage", { lng: lang })` in RSC wrappers / `"use client"` components — evidence: `BookPageContent.tsx:75`, `ApartmentBookContent.tsx:59`
- `tBook("apartment.nr.saving")` / `tBook("apartment.flex.saving")` — savings badge injected inline in rate card JSX with no sub-component; for a single-surface headline, a prop-driven extension of `DirectPerksBlock` is consistent
- `Section` + `className="mx-auto max-w-7xl"` container — evidence: `BookPageContent.tsx:175`; new markup should use the same container/padding tokens
- Tailwind design tokens (`text-brand-heading`, `text-brand-text/80`, `bg-brand-secondary`) — evidence: `DirectPerksBlock.tsx:45-52`, `ApartmentBookContent.tsx:244`

### Data & Contracts

- Types/schemas/events:
  - No new types required; `DirectPerksBlockProps` will gain two optional string props (`savingsEyebrow?: string`, `savingsHeadline?: string`) — both undefined-safe (render nothing if absent)
- Persistence:
  - None — static i18n copy only; no database or API changes
- API/contracts:
  - None — no new API calls; `useAvailability` and `buildOctorateUrl` are unchanged

### Dependency & Impact Map

- Upstream dependencies:
  - `apps/brikette/src/locales/en/bookPage.json` — new keys consumed by `BookPageContent.tsx` via `useTranslation`
  - `DirectPerksBlock.tsx` prop interface — new optional props passed from `BookPageContent.tsx`
- Downstream dependents:
  - `apps/brikette/src/test/components/book-page-perks-cta-order.test.tsx` — tests the render order of `DirectPerksBlock` on the book page; test mocks `DirectPerksBlock` entirely so existing assertions pass unchanged; extend mock if savings headline assertions are added
  - Any snapshot or integration tests that assert `DirectPerksBlock` output
- Likely blast radius:
  - Minimal — `DirectPerksBlock` has a single consumer import (`apps/brikette/src/app/[lang]/book/BookPageContent.tsx:12`). New props are optional and undefined-safe; no other surfaces are affected.
  - The notification banner and deals page are not affected.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library (unit); Playwright (e2e smoke)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=<pattern>`; GA4-governed runner for analytics tests
- CI integration: confirmed (reusable-app.yml, runs on all branches except staging)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| DirectPerksBlock ordering on /book | Unit (RTL) | `book-page-perks-cta-order.test.tsx` | Asserts perks block is above rooms CTA; test fully mocks `DirectPerksBlock` so existing assertions remain valid; extend test to add assertions covering the new savings headline |
| BookPageContent GA4 search_availability | Unit (RTL) | `ga4-33-book-page-search-availability.test.tsx` | Date/pax changes fire GA4 event; not affected by UI-only change |
| Book page structured data | Unit (RTL) | `book-page-structured-data.test.tsx` | SEO structured data; not affected |
| Book page social proof ordering | Unit (RTL) | `book-page-social-proof-order.test.tsx` | `SocialProofSection` ordering; not affected |
| Booking modal copy | Unit (RTL) | `booking-modals-direct-copy.test.tsx` | Modal copy; not affected |
| E2E smoke | Playwright | `e2e/availability-smoke.spec.ts` | Loads /en/book, checks live pricing, clicks CTA; UI-only change is unlikely to break; confirm no selector regression |

#### Coverage Gaps

- Untested paths:
  - `DirectPerksBlock` rendering with the new `savingsEyebrow`/`savingsHeadline` props — new unit tests required
  - i18n fallback behaviour for the new keys (missing translation → shows EN fallback copy without error)
- Extinct tests:
  - None identified

#### Testability Assessment

- Easy to test:
  - `DirectPerksBlock` with new optional props — pure component, renders based on prop presence; standard RTL `render` + `getByText` assertions
  - i18n key fallback — mock `useTranslation` to return empty string for new keys; assert no crash, heading absent
- Hard to test:
  - Visual positioning relative to other elements in the full `BookPageContent` — covered by the existing `book-page-perks-cta-order.test.tsx` ordering test; extend it rather than add a new test
- Test seams needed:
  - Mock `useTranslation("bookPage")` to return the new keys in `BookPageContent` tests

#### Recommended Test Approach

- Unit tests for: `DirectPerksBlock` with `savingsEyebrow` and `savingsHeadline` props (present / absent / empty string cases)
- Integration tests for: `BookPageContent` asserting the savings headline renders above the rooms section
- E2E tests for: No new e2e needed; existing Playwright smoke confirms `/book` loads and CTA works

### Recent Git History (Targeted)

- `c574aa6ee6 feat(brikette): reposition direct-booking perks above rooms CTA` — the `DirectPerksBlock` was recently moved above the rooms grid; this fact-find builds on that completed work
- `32503027d5 chore(brikette): archive perks-cta-positioning plan` — confirms the perks CTA positioning plan is complete, no in-flight conflicts
- `36843c7072 feat(brik-rooms): add useAvailabilityForRoom hook + fix room matching (TASK-RPC + TASK-RPR)` — live availability work complete; no in-flight availability changes
- `2b4a988b84 feat(brik-octorate-live-availability): TASK-01 — Octobook HTML-scraping availability proxy` — live pricing proxy is shipped; this fact-find does not touch the availability layer

## Questions

### Resolved

- **Q: What savings percentage should the hostel booking page display?**
  - A: "Up to 25%" — consistent with the sitewide notification banner ("Book direct & save up to 25%"), the `DirectPerksBlock` first item ("Up to 25% off"), and the notification modal ("Up to 25% off your room rate"). The apartment page uses a higher figure (26%/21%) because the apartment-specific rate differential is larger; the hostel product uses the established 25% figure.
  - Evidence: `apps/brikette/src/locales/en/notificationBanner.json:3`, `apps/brikette/src/components/booking/DirectPerksBlock.tsx:28`, `apps/brikette/src/locales/en/modals.json` (offers.perks.discount)

- **Q: Should the callout name Booking.com specifically or use a generic "OTA" reference?**
  - A: Name Booking.com specifically. The apartment page already sets this convention ("Up to 26% less than Booking.com" in `apartmentPage.directSavings.heading`). The notification modal names "Up to 25% off your room rate" without naming an OTA — but the more-specific apartment pattern is the directional choice. Naming the specific OTA makes the comparison concrete and credible.
  - Evidence: `apps/brikette/src/locales/en/apartmentPage.json` (directSavings.heading), `apps/brikette/src/locales/en/ratingsBar.json` (Booking.com listed as primary rating source)

- **Q: Should the change extend `DirectPerksBlock` or create a new component?**
  - A: Extend `DirectPerksBlock` with two optional props (`savingsEyebrow?: string`, `savingsHeadline?: string`). Rationale: the callout is directly above the existing perks list — it is part of the same conversion messaging block, not a separate section. Adding props keeps the template surface minimal and avoids a proliferation of small booking components. If the headline is absent (undefined), the component behaves identically to today. Creating a new component would be correct only if this callout needs to appear independently on other pages — and it does not (hostel `/book` is the only target).
  - Evidence: `apps/brikette/src/components/booking/DirectPerksBlock.tsx:10-13` (minimal prop interface; safe to extend)

- **Q: Where exactly on the page should the savings headline appear?**
  - A: Rendered inside `DirectPerksBlock` as a headline above the "Why book direct?" subheading and checklist items. The apartment pattern places the savings headline as a page-section hero element (`h2` eyebrow + `p` headline); for the hostel `/book` page, the equivalent is a small eyebrow + bold headline at the top of the `DirectPerksBlock` card. This is the natural read order: savings anchor → "why book direct?" perks confirmation → room grid.
  - Evidence: `apps/brikette/src/app/[lang]/book/BookPageContent.tsx:233` (DirectPerksBlock renders between date picker and RoomsSection), `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx:241-258` (savings badge on rate card as reference visual treatment)

- **Q: Do the 17 non-English locales need translations at ship time?**
  - A: No. The `BRIK-005 [ttl=2026-03-15]` i18n-exempt exemption allows EN fallback until translations land. New keys should include the exemption comment. The TTL expires 2026-03-15 — if this ships before that date, a follow-on translation task is required. If it ships after that date, translations must be provided in the same PR.
  - Evidence: `apps/brikette/src/components/booking/DirectPerksBlock.tsx:19-33` (existing exemption usage)

### Open (Operator Input Required)

_No open questions — all decision points resolved from repository evidence and documented conventions._

## Confidence Inputs

- **Implementation: 92%**
  - Evidence: Entry point (`BookPageContent.tsx:233`) and change surface (`DirectPerksBlock.tsx`) are both read in full. Prop extension pattern is unambiguous. i18n key location is clear (`bookPage.json`).
  - Raises to ≥80: Already there.
  - Raises to ≥90: Already there. Drops to 85 only if operator changes the savings figure or placement — neither is expected.

- **Approach: 85%**
  - Evidence: Extending `DirectPerksBlock` with optional props is the minimal, safe approach. The apartment pattern provides the reference visual treatment.
  - Raises to ≥80: Already there.
  - Raises to ≥90: Operator confirms savings figure (25%) and OTA name (Booking.com) are correct for hostel product.

- **Impact: 60%**
  - Evidence: Multiple "book direct" signals already exist (notification banner, perks block, meta title, guide content). Adding a named-OTA savings headline is incremental reinforcement, not a primary signal. Guests may have already seen the sitewide banner before reaching `/book`. Uplift is uncertain without A/B data.
  - Raises to ≥80: GA4 funnel data showing a click-to-Octorate drop-off correlated with guests who skip the perks block (not currently tracked as a distinct step).
  - Raises to ≥90: A/B test running named-OTA headline vs. control (no infrastructure available today; see Risks).

- **Delivery-Readiness: 95%**
  - Evidence: Pure frontend change, no external dependencies, no feature flags required. i18n-exempt fallback handles locale gap. Test patterns are established.
  - Raises to ≥90: Already there.

- **Testability: 90%**
  - Evidence: `DirectPerksBlock` is a pure component. Jest + RTL patterns are mature and established across the codebase. i18n mock pattern is documented in memory.
  - Raises to ≥90: Already there.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Savings claim becomes inaccurate | Low | Medium | Static "up to 25%" claim was set conservatively. Monitor if hostel OTA rate structure changes significantly. Link operator review to any Octorate pricing update. |
| Messaging saturation — guests see "book direct" claim for 5th time; no additional lift | Medium | Low | P3 priority is appropriate; this is a minor polish change. If GA4 data shows no click-through improvement after 4 weeks, the callout can be removed or moved. |
| i18n TTL breach (BRIK-005 expires 2026-03-15) | Medium | Low | If this ships after 2026-03-15, include translations in the same PR rather than relying on the exemption. Schedule translation pass as part of the plan. |
| `book-page-perks-cta-order.test.tsx` fails due to DOM structure change | Low | Low | Test asserts ordering; extending `DirectPerksBlock` adds content above the existing items. Update the test assertions to include the new savings headline as part of the same task. |
| `bestPriceGuaranteed` badge on room cards (WhatsApp link) creates conflicting signals | Low | Low | Two different "guarantee" mechanisms (WhatsApp and the new named-OTA headline) coexist. No functional conflict; cosmetic overlap is acceptable at P3 scope. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Extend `DirectPerksBlock` props; do not create a new booking component for a single new string
  - i18n-exempt fallback comment required on all new `defaultValue` strings until locale translations land
  - New i18n keys belong in `bookPage.json` namespace under a `hostel.savings` or `directSavings` sub-key (parallel to `bookPage.apartment.*`)
  - Tailwind tokens only — no hardcoded color/spacing values (`text-brand-heading`, `text-brand-text/80`, `text-brand-secondary`, etc.)
  - `data-cy` test IDs (not `data-testid`) — configured via `testIdAttribute: "data-cy"` in `test/setup/mocks.ts:29`
- Rollout/rollback expectations:
  - No feature flag needed — change is additive (new optional props, new i18n keys). Rolling back means removing the two new props and the new key from `bookPage.json`.
- Observability expectations:
  - Existing `view_item_list` and `search_availability` GA4 events continue unchanged. No new analytics event required for P3 scope — the savings headline is not interactive.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry point — `BookPageContent.tsx` prop pass-through | Yes | None | No |
| Change surface — `DirectPerksBlock.tsx` prop extension | Yes | None | No |
| i18n key addition — `bookPage.json` + 17 non-EN locale files | Yes | [Minor] i18n-exempt exemption TTL 2026-03-15 may require translation at ship time | No |
| Test update — `book-page-perks-cta-order.test.tsx` | Yes | [Minor] Existing test asserts perks items by text; new savings headline added above will need test to cover it | No |
| Blast radius — `DirectPerksBlock` usage outside `/book` | Yes | None — only used in `BookPageContent.tsx` | No |
| Apartment pattern reference | Yes | None | No |
| GA4 event contract | Yes | None — change is UI-only, no new analytics events | No |
| Locale coverage (18 locales: EN + 17 others) | Yes | [Minor] Machine translations or EN fallback acceptable under BRIK-005; monitor TTL | No |

No Critical findings. All Minor findings are advisory and addressed in the plan tasks.

## Suggested Task Seeds (Non-binding)

- TASK-01: Extend `DirectPerksBlock` props with optional `savingsEyebrow` and `savingsHeadline`; render above the heading + checklist when present
- TASK-02: Add `bookPage.hostel.directSavings` i18n keys (eyebrow + headline) to EN locale; apply i18n-exempt comment
- TASK-03: Pass new i18n values from `BookPageContent.tsx` to `DirectPerksBlock`
- TASK-04: Update `book-page-perks-cta-order.test.tsx` to cover the new savings headline; add unit tests for `DirectPerksBlock` with `savingsEyebrow`/`savingsHeadline` props
- TASK-05: Add EN locale keys to all 17 non-English locale `bookPage.json` files (copy EN as fallback; mark for translation follow-up)

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `DirectPerksBlock` renders savings eyebrow + headline when props are provided; renders identically to today when props are absent
  - `/en/book` page displays "Book direct and save" + "Up to 25% less than Booking.com" above the "Why book direct?" perks checklist
  - All existing tests pass; new tests cover the happy path and the absent-prop case
  - No new TypeScript errors (`pnpm typecheck` clean for `apps/brikette`)
  - No new lint errors
- Post-delivery measurement plan:
  - Monitor GA4 `/en/book` landing → `begin_checkout` funnel conversion rate for 4 weeks post-ship
  - If conversion rate is flat or declines, the callout can be removed or repositioned without code risk (feature is additive)

## Evidence Gap Review

### Gaps Addressed

1. **Entry point confirmed:** `BookPageContent.tsx:233` read in full — `DirectPerksBlock` is the exact insertion point; no ambiguity about where the savings headline goes.
2. **Change surface confirmed:** `DirectPerksBlock.tsx` read in full — prop extension is straightforward; no hidden complexity.
3. **Savings figure verified:** 25% is the established sitewide hostel claim across 3 independent sources (notification banner, DirectPerksBlock fallback, notification modal).
4. **OTA name confirmed:** Booking.com is the named OTA on the apartment page; consistent with ratingsBar and guide content.
5. **i18n mechanism confirmed:** bookPage.json + i18n-exempt pattern confirmed from DirectPerksBlock.tsx source.
6. **Test landscape confirmed:** `book-page-perks-cta-order.test.tsx` is the primary test to update; no other tests are affected.
7. **Blast radius confirmed:** `DirectPerksBlock` imported only in `BookPageContent.tsx` — no other consumers.
8. **Locale count confirmed:** 18 locales total (EN + 17 others) per `apps/brikette/src/i18n.config.ts:7-27`; directory listing confirmed: `ar da de es fr hi hu it ja ko no pl pt ru sv vi zh`.

### Confidence Adjustments

- Impact score set at 60% (not higher) because multiple "book direct" signals already exist on the page and site. This is honest — the savings headline is a reinforcement signal, not a primary converter.
- Implementation and Delivery-Readiness set at 90%+ because all files are read, patterns are confirmed, and no unknowns remain.

### Remaining Assumptions

- "Up to 25%" is accurate for the hostel product — inferred from sitewide notification banner and DirectPerksBlock fallback copy; not independently verified against Octorate pricing data. Risk is Low (see Risks table).
- Booking.com is the right OTA to name — inferred from apartment page pattern and ratingsBar ordering; operator may prefer "OTAs" generically or a different OTA name.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan brikette-direct-booking-savings-callout --auto`
