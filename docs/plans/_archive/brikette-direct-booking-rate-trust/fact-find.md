---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Brikette/UX
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Last-reviewed: 2026-02-27
Feature-Slug: brikette-direct-booking-rate-trust
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brikette-direct-booking-rate-trust/plan.md
Dispatch-ID: IDEA-DISPATCH-20260227-0040
Trigger-Source: dispatch-routed
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: none
---

# Brikette Direct Booking Rate Trust Fact-Find Brief

## Scope

### Summary

Brikette has multiple "why book direct" components and a "Best price guaranteed" badge on room detail pages, but no mechanism that proves or enforces the direct-booking advantage in-session. Two trust messages are internally inconsistent (the hero offers modal claims "up to 10% off" while every other surface claims "up to 25% off"), the perks block is positioned below the room list on `/book` rather than above the CTA, and the `/deals` page is in empty state for all current visitors (only deal expired Oct 2025). Direct booking share is declining (21.8% → 18%). This brief scopes the fixes required to make the direct-booking trust proposition consistent, visible at decision moments, and defensible as a "best rate guarantee."

### Goals
- Fix the internal 10%-vs-25% discount inconsistency across all booking surfaces
- Reposition the "why book direct" perks signal to appear at or above the primary booking CTA on `/book`
- Add a "Best Rate Guarantee" badge to room cards on `/rooms` and `/book` (not just on `StickyBookNow` for room detail pages)
- Restore the `/deals` page to an active state with an evergreen direct-booking perks entry

### Non-goals
- Building a live OTA price comparison widget (requires a real-time data feed from Octorate's channel manager — out of scope; Octorate does not expose a free live-rate API for OTA channels)
- Implementing third-party price-comparison SaaS (Triptease, Hotels Network) — deferred; higher-effort than native solution and introduces external JS dependency
- Changing the underlying rate structure or parity policy with OTAs
- Loyalty/CRM mechanics (deferred to a separate initiative)
- Rate parity monitoring / alerting tooling

### Constraints & Assumptions
- Constraints:
  - All copy changes must go through i18n JSON files; no hardcoded strings.
  - The site is deployed as a static export to Cloudflare Pages — no server-side rate lookups at render time.
  - Must not misrepresent the actual direct-booking discount; "up to 25% off" is the claimed maximum and must remain accurate.
  - Rate parity: EU DMA and prior EC commitments mean BRIK can legally communicate that direct prices are equal-to-or-lower than OTA prices. However, showing specific live OTA prices without a verified data feed creates false-advertising risk if the prices diverge. The safe mechanism is a "Best Rate Guarantee" (if you find a lower price elsewhere, we'll match it) rather than a live comparison widget.
- Assumptions:
  - The "up to 25% off" claim is accurate — the operator can confirm. If the real maximum discount is lower, copy must be updated accordingly before shipping.
  - The expired deal (`sep20_oct31_15off`) is the only entry in `deals.ts`; no active deals exist as of 2026-02-27.
  - The `StickyBookNow` "Best price guaranteed" label is already visible to users on room detail pages; this work extends the signal to `/book` and `/rooms`.

## Outcome Contract

- **Why:** Direct booking share is declining (21.8% → 18%) while the 90-day forecast targets 27% P50. The existing trust signals are inconsistent and below-the-fold — guests who could book direct don't have a reason to trust the direct channel at the moment of decision.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Increase direct booking share from 18% toward the 27% P50 target by improving trust-signal visibility and consistency. Proxy metric: click-through rate on the "Check rates" CTA on `/book` and `/rooms` (GA4 event, pre-handoff to Octorate). Measured over 30 days post-deploy.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` — canonical hostel direct-booking page; contains `DirectPerksBlock` positioned below `RoomsSection`
- `apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx` — rooms listing page; renders `DirectBookingPerks` card
- `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` — individual room page; renders `StickyBookNow` + `DirectBookingPerks`
- `apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx` — deals page; currently in `emptyState` for all visitors
- `apps/brikette/src/app/[lang]/HomeContent.tsx` — homepage; hero has "Direct booking perks • Best price guaranteed" link → `offers` modal

### Key Modules / Files
- `apps/brikette/src/components/booking/DirectPerksBlock.tsx` — compact checklist used on `/book` and `/rooms/[id]`; copy from `modals.json → directPerks`; claims "Up to 25% off"
- `apps/brikette/src/components/booking/DirectBookingPerks.tsx` — richer perk card (also exported from `@acme/ui/molecules`); used on `/rooms`, `/rooms/[id]`, `/deals`; copy from `dealsPage.json → perksList`; claims "Up to 25% off"
- `packages/ui/src/organisms/StickyBookNow.tsx` — sticky CTA on room detail pages only; has "Best price guaranteed" badge (`_tokens.bestPriceGuaranteed`) and "Skip third-party fees" subcopy; no price comparison
- `apps/brikette/src/components/rooms/RoomCard.tsx` — renders each bookable room on `/book` and `/rooms`; shows direct rate from `useRoomPricing`; `RoomCardPrice` type has no `compareAtPrice` or `otaPrice` field
- `apps/brikette/src/routes/deals/deals.ts` — single deal entry `{ id: "sep20_oct31_15off", discountPct: 15, endDate: "2025-10-31" }`; expired; causes `/deals` to show empty state for all current visitors
- `apps/brikette/src/locales/en/modals.json` — `offers.perks.discount` = "Up to 10% off your room rate" **(inconsistency: all other surfaces say 25%)**
- `apps/brikette/src/locales/en/dealsPage.json` — `perksList[0].title` = "Up to 25% off"
- `apps/brikette/src/config/hotel.ts` — ratings data (`Hostelworld: 9.3, Booking.com: 9.0`) used by `SocialProofSection`

### Patterns & Conventions Observed
- i18n copy: all user-facing strings in `apps/brikette/src/locales/<lang>/<namespace>.json`; TypeScript components reference via `useTranslation` hook — evidence: `BookPageContent.tsx`, `RoomDetailContent.tsx`
- Rate data: live room pricing fetched via `useRoomPricing` hook from Octorate; shows direct NR/Flex rates only
- Component placement: perks block on `/book` is sequenced *after* the room list in `BookPageContent` — missed opportunity to anchor the value proposition before the CTA
- Badge pattern: `StickyBookNow` uses a `BadgeCheck` icon + token label for trust signals; the pattern is established and can be reused on room cards
- Deals page: `deals.ts` exports a typed `Deal[]` array; `DealsPageContent` renders `emptyState` when no deal passes the date filter

### Data & Contracts
- Types/schemas/events:
  - `RoomCardPrice` (in `RoomCard.tsx`): `{ loading, soldOut, soldOutLabel, info, directRate }` — no `compareAtPrice`; adding a best-rate badge does not require a type change (badge is static, not data-driven)
  - `Deal` type (in `deals.ts`): `{ id, discountPct, startDate, endDate, rules }` — adding an evergreen deal (no `endDate` or far-future `endDate`) is backward-compatible
- Persistence:
  - None — all deal and copy data is static; no database changes required
- API/contracts:
  - Octorate: does not expose a free channel manager API for live OTA rates — confirmed by absence of any OTA rate fetch in codebase; live price comparison is out of scope

### Dependency & Impact Map
- Upstream dependencies:
  - `apps/brikette/src/locales/**/*.json` — all i18n namespaces (18 locales: ar, da, de, en, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh); changes are safe, no code changes needed for copy fixes
  - `deals.ts` — static deal array; extending is backward-compatible
- Downstream dependents:
  - `DealsPageContent` — consuming `deals.ts`; adding an evergreen deal will exit `emptyState`
  - All 18 locales must also receive the corrected `modals.json → offers.perks.discount` value; omitting any locale leaves the inconsistency for those language visitors
- Likely blast radius:
  - Low — all changes are copy/layout adjustments within existing component boundaries. No schema changes, no API changes, no shared-package changes except reading from existing `StickyBookNow` pattern for the room card badge.

### Delivery & Channel Landscape
- Audience/recipient: prospective guests visiting the Brikette website
- Channel constraints: static Next.js export (Cloudflare Pages) — no runtime rate lookups; all UI is pre-rendered or client-side React
- Existing templates/assets: `DirectPerksBlock`, `DirectBookingPerks`, `StickyBookNow` badge pattern already exist — new work reuses these patterns
- Approvals/owners: operator (Peter Cowling) must confirm the "up to 25%" claim is accurate before shipping the corrected copy
- Compliance constraints: "Best Rate Guarantee" language requires a mechanism for guests to claim it (contact email or WhatsApp link) — do not ship the guarantee badge without a claim path
- Measurement hooks: GA4 `select_content` or `cta_click` events on the booking CTA; pre-handoff CVR from `/book` and `/rooms`

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library (unit/integration); Playwright (E2E, `apps/brikette/scripts/e2e/*.mjs`)
- Commands: CI is the authoritative test runner for all tests (unit, integration, E2E). Do not run tests locally — push to CI and let the workflow validate. See `docs/testing-policy.md`.
- CI integration: unit tests run on every PR via reusable workflow; E2E tests excluded on the `staging` branch

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| i18n parity | Unit | `apps/brikette/src/test/content-readiness/i18n/i18n-parity-quality-audit.test.ts` | Audits EN namespace completeness; does not assert value equality across namespaces |
| `DirectBookingPerks` copy | Unit | `apps/brikette/src/test/components/booking-modals-direct-copy.test.tsx` | Component-level copy tests exist; specific assertions on `offers.perks.discount` vs `perksList` not confirmed |
| `DealsPageContent` | Unit | `apps/brikette/src/test/components/ga4-34-deals-page-promotions.test.tsx` | GA4 promotion event coverage; active-deal count assertion not confirmed |
| `StickyBookNow` | Unit | Not confirmed | Not investigated |

#### Coverage Gaps
- Untested paths:
  - No test that cross-validates `modals.json → offers.perks.discount` against `dealsPage.json → perksList[0].title` — the 10% vs 25% inconsistency was not caught by CI
  - No deal-date-expiry regression test to flag when `deals.ts` has zero active entries
- Extinct tests: none identified

#### Testability Assessment
- Easy to test:
  - i18n key value consistency (snapshot or equality assertion)
  - Deal-list active count (unit test on the date filter)
  - Presence of "Best Rate Guarantee" badge text on room card render (React Testing Library)
- Hard to test:
  - Visual positioning of perks block relative to CTA (requires visual regression or Playwright screenshot)
- Test seams needed:
  - A `getActiveDealCount()` helper in `deals.ts` to make the active-deal check unit-testable without date mocking complexity

### Recent Git History (Targeted)

Not investigated — booking funnel components are not in active flux. The worldclass-scan doc (2026-02-27) confirms this gap has been present and unchanged.

## Questions

### Resolved

- **Q: Can BRIK legally show that direct booking is cheaper than OTA (price comparison)?**
  - A: In the EU, Booking.com and Hostelworld have both committed to removing strict "rate parity" clauses (EU DMA 2022, EC self-regulatory commitments 2015/2016). BRIK operating in Italy is not legally prohibited from stating that direct rates are equal to or lower than OTA rates. However, showing a *specific live OTA price* alongside the direct price without a real-time verified data feed creates false-advertising risk if the prices diverge (e.g. OTA-only promotional codes, dynamic OTA discounting). The correct and low-risk approach is a **Best Rate Guarantee**: a visible badge plus a claim path (email/WhatsApp) stating "If you find a lower price on any OTA, we'll match it." This is the same mechanism used by independent hotels without Triptease/Hotels Network.
  - Evidence: `worldclass-scan-2026-02-27.md` (rate-parity gap documented); `apps/brikette/src/components/booking/PolicyFeeClarityPanel.tsx` (precedent for on-site claim-mechanism copy: "Generates support escalations" acknowledged in `perks-decision.md`)

- **Q: Which discount claim is accurate — 10% (offers modal) or 25% (all other surfaces)?**
  - A: "Up to 25% off" appears in `DirectPerksBlock`, `DirectBookingPerks.perksList[0].title`, and `StickyBookNow` subcopy — three independent surfaces. "Up to 10% off" appears only in `modals.json → offers.perks.discount`, which is used by the hero-triggered offers modal. The modal is the outlier. The most likely explanation is the modal copy was not updated when the discount claim was raised from 10% to 25%. Default assumption: **25% is the intended claim and the modal copy needs updating.** Operator must confirm before the PR is merged.
  - Evidence: `apps/brikette/src/locales/en/modals.json` vs `apps/brikette/src/locales/en/dealsPage.json`; worldclass-scan notes the inconsistency.

- **Q: Should the new "Best Rate Guarantee" badge go on the room card, on the `/book` page header, or both?**
  - A: Both, with a clear claim link. On `/book`, add a thin informational strip or badge above or adjacent to the `RoomsSection` header. On `/rooms` and `/rooms/[id]`, the `StickyBookNow` badge already covers the detail page; adding it to room cards on `/rooms` fills the listing gap. This matches the pattern established by `StickyBookNow` which uses `BadgeCheck` + token label.
  - Evidence: `StickyBookNow.tsx` (`_tokens.bestPriceGuaranteed`); `RoomCard.tsx` (no equivalent badge today); `RoomsPageContent.tsx` (no trust badge near rate display)

- **Q: What is the right approach for the deals page — add an evergreen deal, remove the expired entry, or leave it?**
  - A: Add an evergreen "direct booking perks" entry with no end date (or far-future end date like 2099-12-31). The deals page renders an empty state when no active deal exists, which is a missed conversion opportunity. An evergreen entry ensures the page always surfaces the baseline perks. The expired `sep20_oct31_15off` entry should be removed to avoid confusion if the date filter is ever changed.
  - Evidence: `apps/brikette/src/routes/deals/deals.ts` (single entry, expired Oct 2025); `DealsPageContent.tsx` (`emptyState.subtitle: "Book direct for the best rate and perks"` — useful as static fallback but the perk card is more compelling)

- **Q: Do all locales need to be updated for the offers modal copy fix?**
  - A: Yes. The offers modal is used on the homepage hero for all locales. If only EN is corrected, the other 17 locale files still carry the old (potentially incorrect) 10% value. All locale files in `apps/brikette/src/locales/<lang>/modals.json` must be updated in lockstep with EN. Full locale list: `ar, da, de, en, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh` (18 total).
  - Evidence: `apps/brikette/src/app/[lang]/HomeContent.tsx` — modal is locale-aware via `useTranslation`

### Open (Operator Input Required)

- **Q: Is the "up to 25% off" claim accurate for the current rate structure?**
  - Why operator input is required: The agent cannot determine the actual maximum discount from the codebase — rate codes are managed in Octorate and the actual price differential between NR-direct and OTA rates requires access to Octorate's channel manager configuration.
  - Decision impacted: Whether "up to 25% off" can ship or must be changed to a lower/vaguer claim.
  - Decision owner: Peter Cowling
  - Default assumption + risk: Assume 25% is accurate (it appears in 3 code surfaces); risk is minor copy inaccuracy if the real maximum is lower.

## Confidence Inputs

- **Implementation: 90%** — All changes are within existing component boundaries. i18n copy fixes, a new badge on `RoomCard`, repositioning in `BookPageContent`, and a deal data update. No new architecture needed.
  - What raises to >=90: Already at 90. Remaining 10%: locale file count (each language needs to be updated; any locale file with a different structural format could create i18n-parity test failures).
- **Approach: 85%** — The "Best Rate Guarantee" badge + claim path approach is well-matched to the codebase pattern and the legal constraint. The component patterns (`StickyBookNow`, `DirectPerksBlock`) are established.
  - What raises to >=90: Operator confirmation that 25% is accurate; decision on claim path (email vs WhatsApp link — both already exist in the codebase).
- **Impact: 65%** — Correcting copy inconsistency has high confidence of eliminating a trust-eroding signal. Repositioning the perks block and adding the badge has plausible positive impact on CVR, but causal attribution is hard without A/B testing. The worldclass-scan flags these as genuine gaps.
  - What raises to >=80: A/B test or before/after CVR measurement over 30 days. Proxy: GA4 CTA click events pre-handoff to Octorate.
  - What raises to >=90: Observable lift in direct booking share in the trailing 30-day Octorate data.
- **Delivery-Readiness: 92%** — No external dependencies, no API integrations, no infrastructure changes. Entirely within the Brikette app.
  - Remaining 8%: Operator must confirm the 25% discount claim before merging. Without confirmation, the copy fix ships with a risk annotation.
- **Testability: 78%** — i18n consistency and deal active count are unit-testable. Visual positioning of perks relative to CTA is harder to test without visual regression.
  - What raises to >=80: Add an i18n cross-namespace equality test for the discount claim; add an active-deal count unit test.
  - What raises to >=90: Add a Playwright visual regression or explicit layout assertion for perks-above-CTA positioning.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| "Up to 25% off" is overstated — actual discount is lower | Low | Medium: false advertising claim from a guest | Operator must confirm before merge; fallback: change to "exclusive direct-only perks" (no % claim) |
| Locale file update missed for one or more non-EN locales | Medium | Low: inconsistency visible to non-EN users | Include locale file audit as an explicit task; run i18n-parity test after changes |
| "Best Rate Guarantee" badge raises guest expectations without a staffed claim-resolution process | Low-Medium | Medium: support load increase if guests find lower OTA prices | Add claim path (email/WhatsApp link with 24h response expectation) in badge tooltip/modal |
| `/deals` evergreen entry may conflict with a real seasonal deal added later | Low | Low: two cards appear, both accurate | Deal type field can distinguish evergreen vs seasonal; `deals.ts` supports multiple entries |
| Perks reposition breaks existing snapshot/E2E tests for `/book` | Low | Low: CI catches; quick fix | Check for snapshot tests before merge |

## Planning Constraints & Notes

- Must-follow patterns:
  - All copy changes via i18n JSON; no hardcoded strings in components
  - Badge pattern: use `BadgeCheck` icon + token label from `StickyBookNow` as the established pattern; do not introduce a new design pattern without design review
  - Guide/translate workflow: if any perks copy changes affect guide content, run the translation gate (`validate-guide-structure.sh`) before merging
- Rollout/rollback expectations:
  - All changes are static copy/layout — rollback is a revert commit; no data migration needed
  - Deploy to staging first and verify all locale variants before production
- Observability expectations:
  - GA4 CTA click events on the booking CTA (pre-handoff) are the primary proxy metric; ensure these events fire on the repositioned perks block if a CTA is added to it
  - Optionally: add a `best_rate_guarantee_viewed` GA4 event when the badge is rendered

## Suggested Task Seeds (Non-binding)

1. **Fix i18n inconsistency** — update `offers.perks.discount` in all locale `modals.json` files from "Up to 10% off" to "Up to 25% off" (pending operator confirmation); add cross-namespace equality test
2. **Reposition `DirectPerksBlock` on `/book`** — move it above `RoomsSection` in `BookPageContent`; verify no snapshot regression
3. **Add "Best Rate Guarantee" badge to `RoomCard`** — add a `BadgeCheck` + "Best price guaranteed" label (using `_tokens.bestPriceGuaranteed`) below the rate display on room cards; include a `?` tooltip or click target linking to a claim modal/email
4. **Restore `/deals` page** — remove expired `sep20_oct31_15off` entry; add an evergreen "direct booking perks" entry (no end date); confirm the `DirectBookingPerks` card renders correctly
5. **Add claim path for Best Rate Guarantee** — a minimal modal or tooltip on the badge that says "If you find a lower rate anywhere online, contact us and we'll match it" + WhatsApp/email link (both patterns exist in the codebase)
6. **Add regression tests** — i18n cross-namespace discount claim equality test; active-deal count unit test

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry points (booking pages: `/book`, `/rooms`, `/rooms/[id]`, `/deals`, homepage) | Yes | None | No |
| `DirectPerksBlock` copy + position on `/book` | Yes | [Scope gap] Minor: component position (below room list) confirmed by source read, but DOM ordering not verified by render test | No |
| `DirectBookingPerks` copy on `/rooms` and `/deals` | Yes | None — copy is consistent with "25% off" on these surfaces | No |
| `StickyBookNow` badge on room detail pages | Yes | None — badge already exists and is correctly positioned | No |
| Offers modal (`modals.json → offers`) — inconsistent discount claim | Yes | [Type contract gap] Major: `offers.perks.discount` = "Up to 10% off" while `dealsPage.json → perksList[0].title` = "Up to 25% off"; no cross-namespace test catches this | No — fixed in task seeds |
| `RoomCard` pricing type and badge gap | Yes | None — `RoomCardPrice` has no `compareAtPrice` field; scope explicitly excludes live comparison; badge is static | No |
| `deals.ts` — expired deal, empty state | Yes | None — confirmed; evergreen deal addition is backward-compatible | No |
| Locale files (non-EN) for offers modal | Partial | [Missing domain coverage] Moderate: EN fix confirmed in scope; non-EN locale files not individually confirmed to have the same 10% value, but i18n is namespace-parallel so same key almost certainly exists in all locales | No — included in task seeds |
| OTA price data availability (live comparison widget) | No | None — scope explicitly excludes live OTA price feed; deferred | No |
| Test coverage for affected components | Partial | [Scope gap] Minor: existing unit tests for `DirectBookingPerks`, `DirectPerksBlock`, `DealsPageContent` not confirmed; regression risk is low given changes are copy/layout only | No |

No Critical scope gaps identified. Proceeding to Phase 6.

## Evidence Gap Review

### Gaps Addressed
- **Rate parity legal constraint**: Reasoned through using EU DMA and EC self-regulatory commitments; confirmed Best Rate Guarantee approach is the correct mechanism. No live-comparison widget needed.
- **10% vs 25% inconsistency root cause**: Confirmed by reading both `modals.json` and `dealsPage.json`; modal is the outlier. Scope includes fix.
- **Deals page root cause**: Confirmed single expired deal; evergreen entry solution identified.
- **Badge placement gap on room cards**: Confirmed by reading `RoomCard.tsx` — no badge exists today; `StickyBookNow` pattern available for reuse.

### Confidence Adjustments
- Implementation score raised from 80% → 90% after confirming all changes are within existing component boundaries with no schema or API changes.
- Impact score held at 65% — cannot be raised further without actual CVR data; the correlation between perks visibility and direct booking share is plausible but not proven.

### Remaining Assumptions
- The "up to 25%" claim is accurate (operator input required before merge).
- Non-EN locale files for `modals.json` have the same `offers.perks.discount` inconsistency as EN (high confidence, but not individually verified).
- No active A/B test is running on the booking funnel that this work would contaminate.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `modals.json` updated in all locales; `offers.perks.discount` consistent with "Up to 25% off" (or operator-confirmed value)
  - `DirectPerksBlock` appears above `RoomsSection` on `/book`
  - `RoomCard` renders a "Best price guaranteed" badge on room cards on `/book` and `/rooms`
  - `/deals` page has at least one active entry; no longer in empty state
  - i18n-parity test passes; active-deal count test added and passing
- Post-delivery measurement plan:
  - GA4 CTA click events pre-handoff (baseline vs post-deploy, 14-day window)
  - Octorate direct booking share (trailing 30-day, compare to 18% baseline)

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None (operator discount confirmation is advisory; plan can proceed with a `[CONFIRM BEFORE MERGE]` annotation on the copy task)
- Recommended next step: `/lp-do-plan brikette-direct-booking-rate-trust --auto`
