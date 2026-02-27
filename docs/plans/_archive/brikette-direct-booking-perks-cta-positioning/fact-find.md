---
Type: Fact-Find
Outcome: Planning
Status: Archive
Domain: UI
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: brikette-direct-booking-perks-cta-positioning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brikette-direct-booking-perks-cta-positioning/plan.md
Trigger-Why: Direct-booking perks ("Why book direct?" + 3 benefits) render after the RoomsSection on the /book page, meaning guests who click a room CTA never saw the perks and had no incentive signal to prefer direct booking over OTA.
Trigger-Intended-Outcome: type: measurable | statement: Increase direct-booking conversion by surfacing perks before guests reach room-level CTAs | source: operator
Dispatch-ID: IDEA-DISPATCH-20260227-0041
Trigger-Source: dispatch-routed
---

# Brikette Direct Booking Perks — CTA Positioning Fact-Find Brief

## Scope

### Summary

On the Brikette hostel booking page (`/[lang]/book`), the `DirectPerksBlock` component ("Why book direct?" + ["Up to 25% off", "Complimentary breakfast", "Complimentary evening drink"]) renders **after** `RoomsSection`. Guests who click any room-level "Book" button — the primary CTA — have not yet seen these perks. Moving `DirectPerksBlock` to above `RoomsSection` ensures perks are visible before the booking decision is made.

### Goals

- Move `DirectPerksBlock` to render above `RoomsSection` on the hostel `/book` page.
- Preserve all existing content, i18n, and guard behaviour of `DirectPerksBlock`.
- Add a DOM-order test asserting the perks block precedes room cards.

### Non-goals

- Apartment booking page (no perks component; out of scope).
- `packages/ui/src/molecules/DirectBookingPerks.tsx` (full-width banner used on `/rooms` and `/rooms/[id]` pages; not in scope).
- Perks content changes — only positioning is changing.
- A/B test infrastructure for placement variants.
- Rate comparison widget (separate dispatch 0040).

### Constraints & Assumptions

- Constraints:
  - `BookPageContent.tsx` is a client component (`"use client"`) — no RSC conversion needed.
  - `DirectPerksBlock` accepts a `className` prop for styling; existing styles (`mb-8 rounded-2xl border …`) were sized for a standalone section. These will need adjusting for the new position.
  - `SocialProofSection` must stay at the top (test `book-page-social-proof-order.test.tsx` enforces this).
- Assumptions:
  - Moving perks above rooms will not conflict with the sticky deal banner, which is conditionally rendered above `SocialProofSection`.
  - No design approval gate is required for a DOM reorder of this scope (P3 minor-gap treatment).
  - i18n content for `modals:directPerks.*` already exists and is complete.

## Outcome Contract

- **Why:** Direct-booking perks are below all room-level "Book" CTAs. Guests who convert directly may do so without ever seeing the incentive benefits. Repositioning makes the value proposition visible at the point of decision.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** `DirectPerksBlock` renders before `RoomsSection` on the hostel book page; direct-booking conversion rate maintained or improved over subsequent 30-day window (baseline: current Octorate-tracked direct bookings per GA4 funnel).
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/[lang]/book/page.tsx` — RSC wrapper, renders `<BookPageContent>` inside `<Suspense>`. Entry point for the hostel booking route.
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` — client component; all booking page rendering logic.

### Key Modules / Files

- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` — **primary change target.** Render order (lines 155–249):
  - L165: `<SocialProofSection>`
  - L167–223: date/pax input section (heading + 3-column date grid) — primary search/CTA zone
  - L225–236: `<RoomsSection>` — room cards each with "Book" CTA → Octorate navigation
  - L238–242: `<Section>` containing **`<DirectPerksBlock>`** (L239), `<LocationInline>`, `<PolicyFeeClarityPanel>`
  - L244: `<FaqStrip>`
- `apps/brikette/src/components/booking/DirectPerksBlock.tsx` — compact "Why book direct?" block. Props: `lang: AppLanguage`, `className?: string`. Reads `modals:directPerks.heading` + `modals:directPerks.items` (3-item string array). Guard: returns `<></>` if heading or items are empty. Introduced in commit `fd40afb33c` ("TASK-12 modal conversion copy").
- `apps/brikette/src/components/rooms/RoomsSection.tsx` — room listing; each card triggers `buildOctorateUrl(…)` → `window.location.assign(url)` when date `queryState === "valid"`.
- `apps/brikette/src/utils/buildOctorateUrl.ts` — Octorate URL builder. Unaffected by this change.

### Patterns & Conventions Observed

- DOM order = render order: `book-page-social-proof-order.test.tsx` asserts render-order via `compareDocumentPosition`. Same pattern will be used for the new perks-order test.
- `className` prop forwarding: `DirectPerksBlock` accepts an external `className` — styling adjustment for the new position is straightforward.
- Section wrapper pattern: the current perks section wraps `DirectPerksBlock` + `LocationInline` + `PolicyFeeClarityPanel` in a shared `<Section>`. After the move, `DirectPerksBlock` will leave this group and sit between the date input section and `RoomsSection`.

### Data & Contracts

- Types/schemas/events:
  - `AppLanguage` (i18n locale enum) — passed as `lang` to `DirectPerksBlock`.
  - No new types or events introduced.
- Persistence:
  - i18n content sourced from `modals:directPerks` namespace. Existing translations assumed complete.
- API/contracts:
  - None. `DirectPerksBlock` is a pure render component with no API calls.

### Dependency & Impact Map

- Upstream dependencies:
  - `modals:directPerks.heading` + `modals:directPerks.items` (i18n namespace) — already populated.
  - `lang` prop — passed down from `BookPageContent` props, unchanged.
- Downstream dependents:
  - `ga4-33-book-page-search-availability.test.tsx` — mocks `DirectPerksBlock` as null; position-agnostic, unaffected.
  - `booking-modals-direct-copy.test.tsx` — tests `DirectPerksBlock` in isolation; position-agnostic, unaffected.
  - `book-page-social-proof-order.test.tsx` — tests `SocialProofSection` vs date input; unaffected by perks repositioning.
- Likely blast radius:
  - **`BookPageContent.tsx`** — DOM reorder of one component; no state, prop, or API change.
  - Styling: `className` on `DirectPerksBlock` will change (current: `"mb-8 rounded-2xl border …"` inside a `<Section>`; new: needs adjustment for standalone placement between sections).
  - **New test file** — `book-page-perks-cta-order.test.tsx` added to `apps/brikette/src/test/components/`. No existing test files modified.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library (RTL)
- Commands: Tests run in CI on PR. See `docs/testing-policy.md` for policy — do not run the full test suite locally; CI is the validation gate.
- CI integration: PR gate via `reusable-app.yml`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| DirectPerksBlock content | Unit (RTL) | `booking-modals-direct-copy.test.tsx` | TC-01: heading + 3 items; TC-02: empty guard. Position-agnostic. |
| Book page social proof order | Unit (RTL) | `book-page-social-proof-order.test.tsx` | Asserts SocialProofSection renders before date input. Same DOM-order pattern to use. |
| Book page GA4 availability | Unit (RTL) | `ga4-33-book-page-search-availability.test.tsx` | Mocks DirectPerksBlock as null; unaffected. |
| Sticky CTA | Unit (RTL) | `ga4-35-sticky-begin-checkout.test.tsx` | Mocks DirectBookingPerks from @acme/ui; unaffected. |

#### Coverage Gaps

- Untested paths:
  - **No test asserts `DirectPerksBlock` renders before `RoomsSection`.** This is the primary gap introduced by this change — a DOM-order test must be added.
- Extinct tests:
  - None found.

#### Testability Assessment

- Easy to test:
  - DOM order assertion using `compareDocumentPosition` — exact same pattern as `book-page-social-proof-order.test.tsx`.
- Hard to test:
  - Actual conversion impact (requires real GA4/Octorate data; out of scope for unit tests).
- Test seams needed:
  - None new; existing mocking pattern for `DirectPerksBlock` in GA4 tests is already in place.

#### Recommended Test Approach

- Unit tests for: DOM order — `DirectPerksBlock` container precedes `RoomsSection` container. New test file: `book-page-perks-cta-order.test.tsx` (mirrors structure of social-proof-order test).
- Integration tests for: None required (no API or state changes).
- E2E tests for: Deferred — would require Playwright assertions on scroll depth; lower priority for P3.

### Recent Git History (Targeted)

- `fd40afb33c` — "TASK-12 modal conversion copy": introduced `DirectPerksBlock`; placed below `RoomsSection` at time of creation.
- `448aa65170` — "chore: checkpoint outstanding work": last touch on `DirectPerksBlock`.
- `c79ce2a44a` — "chore: checkpoint audit and UX hardening updates": last touch on `packages/ui/src/molecules/DirectBookingPerks.tsx`.

Implication: `DirectPerksBlock` was placed below rooms from day one; no prior repositioning attempts.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Current render position of `DirectPerksBlock` in `BookPageContent.tsx` | Yes | None | No |
| Primary CTA definition (room-level "Book" buttons) | Yes | None | No |
| Perks component props/styling footprint | Yes | [Missing domain coverage] [Minor]: `className` styles for standalone position not yet determined — will need adjustment in plan | No (advisory) |
| Test landscape — existing order tests | Yes | None | No |
| Apartment booking page — perks scope | Yes | None | No |
| `SocialProofSection` position constraint | Yes | None | No |
| i18n content availability for `modals:directPerks.*` | Yes (assumed populated — not verified against locale files) | [Scope gap] [Minor]: locale file content not read; guard in `DirectPerksBlock` handles empty gracefully | No (guard is defensive) |

No Critical simulation findings. Advisory Minor findings noted above; do not block planning.

## Questions

### Resolved

- Q: Where exactly should `DirectPerksBlock` move — above `RoomsSection`, or inlined within the date/pax section?
  - A: Above `RoomsSection`, between the date input section and the rooms listing. This is the natural reading flow: search intent (dates) → value proposition (perks) → options (rooms). Inlining within the date section would clutter the primary search interaction.
  - Evidence: Render order analysis of `BookPageContent.tsx` lines 167–236.

- Q: Does moving `DirectPerksBlock` affect `SocialProofSection` ordering?
  - A: No. `SocialProofSection` is at line 165, before the date section. The reorder only affects lines 225–242 (rooms + perks post-section). `SocialProofSection` position is unchanged.
  - Evidence: `BookPageContent.tsx` line 165; `book-page-social-proof-order.test.tsx`.

- Q: Is apartment `/apartment/book` page in scope?
  - A: No. The apartment booking page has no `DirectPerksBlock` or equivalent perks component at all. Out of scope.
  - Evidence: Explore agent confirmed no direct perks component on apartment page.

- Q: Do existing tests break?
  - A: No. Tests that mock `DirectPerksBlock` as null are position-agnostic. The content test is isolation-based. Only a new DOM-order test needs to be added.
  - Evidence: `ga4-33-book-page-search-availability.test.tsx` (mocks as null); `booking-modals-direct-copy.test.tsx` (isolation test).

- Q: Does `DirectPerksBlock` have any stateful dependencies that tie it to RoomsSection?
  - A: No. `DirectPerksBlock` is a pure rendering component — it reads i18n, applies guard logic, and renders a static list. No shared state with `RoomsSection`.
  - Evidence: `DirectPerksBlock.tsx` (no hooks other than `useTranslation`).

### Open (Operator Input Required)

- Q: Should the new `className` for `DirectPerksBlock` in its repositioned context match the existing border/bg card style, or adopt a lighter in-flow style?
  - Why operator input is required: This is a visual preference decision. The current `className` includes `mb-8 rounded-2xl border …` sizing appropriate for a standalone section card. The right appearance above `RoomsSection` depends on the operator's preferred visual treatment (card, plain block, or subtle divider).
  - Decision impacted: `className` value on `<DirectPerksBlock>` in `BookPageContent.tsx`.
  - Decision owner: Operator (Peter)
  - Default assumption (if any) + risk: Default — retain the card style (`mb-8 rounded-2xl border …`) with minor `mt` adjustment. Risk: may appear visually heavy between the date inputs and rooms if the section is already dense. Operator should confirm.

## Confidence Inputs

- Implementation: 95%
  - Evidence: Single-file change (DOM reorder + `className` tweak in `BookPageContent.tsx`). Component API unchanged.
  - What raises to ≥90: Already ≥90. Only the `className` confirmation (Open Q above) is unresolved; guard in `DirectPerksBlock` is defensive.

- Approach: 88%
  - Evidence: Render order analysis is complete; the target position (between date section and RoomsSection) is well-justified by UX reading flow.
  - What raises to ≥90: Operator confirms the preferred visual treatment for the repositioned block.

- Impact: 65%
  - Evidence: No GA4 scroll-depth data available to confirm what % of users reach the current below-rooms perks position. The P3/minor-gap classification reflects this uncertainty.
  - What raises to ≥80: GA4 engagement_time or scroll_depth events for the `/book` page showing the proportion of sessions that don't scroll past RoomsSection.
  - What raises to ≥90: A/B test comparing direct booking conversion rate before/after the reposition.

- Delivery-Readiness: 92%
  - Evidence: Single-file change; no API, no data model, no migration. Well-contained.
  - What raises to ≥90: Already ≥90.

- Testability: 88%
  - Evidence: `compareDocumentPosition` DOM-order test pattern is proven (social-proof-order test). New test file is a direct adaptation.
  - What raises to ≥90: Add the DOM-order test in the same PR; CI will enforce going forward.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Visual density — perks card above rooms may feel crowded on mobile | Medium | Low | Adjust `className` to use a lighter in-flow style (plain list vs border card); review at build time |
| `SocialProofSection` + date input + perks + rooms = too much above-the-fold | Low | Low | Perks block is compact (3 lines); mobile layout shrinks the block naturally |
| Test failure if `book-page-social-proof-order.test.tsx` is order-sensitive to perks | Low | Low | That test only checks SocialProof vs date input; unrelated to perks block |
| Perks content empty in some locales (guard returns `<></>`) | Low | Low | Guard already handles this; repositioned empty block renders nothing |
| Conflict with deal banner sticky strip | Low | None | Deal banner renders before `SocialProofSection` (conditional on `?deal=` param); perks block is well below it |

## Planning Constraints & Notes

- Must-follow patterns:
  - DOM-order test using `compareDocumentPosition` (see `book-page-social-proof-order.test.tsx` for pattern).
  - `DirectPerksBlock` className forwarded as prop — do not hardcode styles inside the component.
  - No changes to `DirectPerksBlock.tsx` internal logic or API.
- Rollout/rollback expectations:
  - Single-file change; revert is one-line DOM reorder. No feature flag needed for P3.
- Observability expectations:
  - Optionally: add a `direct_perks_viewed` or leverage existing scroll-depth GA4 data post-deploy to measure impression rate change.

## Suggested Task Seeds (Non-binding)

1. **TASK-01 — Reposition `DirectPerksBlock` in `BookPageContent.tsx`**: Move `<DirectPerksBlock>` from the post-`RoomsSection` `<Section>` to between the date/pax section and `<RoomsSection>`. Adjust `className` for the new position (confirm style with operator).
2. **TASK-02 — Add DOM-order test**: Create `book-page-perks-cta-order.test.tsx` asserting `DirectPerksBlock` container precedes `RoomsSection` in the DOM. Mirror pattern of `book-page-social-proof-order.test.tsx`.
3. **TASK-03 — Verify `PolicyFeeClarityPanel` and `LocationInline` still render correctly**: With `DirectPerksBlock` removed from their section, confirm the remaining section is visually coherent (no orphaned section wrapper).

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - None required
- Deliverable acceptance package:
  - `BookPageContent.tsx` with `DirectPerksBlock` rendering above `RoomsSection`
  - New DOM-order test passing in CI
  - `PolicyFeeClarityPanel` + `LocationInline` section still renders correctly
- Post-delivery measurement plan:
  - Monitor GA4 `/book` page scroll depth and engagement time over 30 days post-deploy. Compare Octorate direct booking rate (if reportable) vs prior 30 days.

## Evidence Gap Review

### Gaps Addressed

- Confirmed exact line positions of `DirectPerksBlock` and `RoomsSection` in `BookPageContent.tsx` (L239 vs L225).
- Confirmed `DirectPerksBlock` is a pure render component — no stateful dependencies on `RoomsSection`.
- Confirmed no existing test covers perks-vs-rooms DOM ordering (coverage gap identified; test task seeded).
- Confirmed apartment booking page is out of scope.
- Confirmed `SocialProofSection` ordering constraint is unaffected.

### Confidence Adjustments

- Implementation confidence high (95%) because the change is a single DOM reorder with no state or API impact.
- Impact confidence held at 65% — no scroll-depth GA4 data available to quantify the size of the problem.

### Remaining Assumptions

- `modals:directPerks.*` locale content is complete for all supported languages (assumed, not verified against locale files — guard handles empty gracefully).
- No design review gate is required for a P3 DOM reorder (assumed, consistent with minor-gap treatment).
- `className` visual treatment for the repositioned block will be determined at build time (Open Q: operator preference).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None hard-blocking (Open Q on `className` style is advisory; default assumption is to retain card style with `mt` adjustment).
- Recommended next step:
  - `/lp-do-plan brikette-direct-booking-perks-cta-positioning --auto`
