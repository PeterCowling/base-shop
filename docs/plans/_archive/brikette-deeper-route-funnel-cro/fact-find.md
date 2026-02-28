---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Brikette/CRO
Workstream: Engineering
Created: 2026-02-25
Last-updated: 2026-02-25
Feature-Slug: brikette-deeper-route-funnel-cro
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-design-qa
Related-Plan: docs/plans/brikette-deeper-route-funnel-cro/plan.md
Dispatch-ID: IDEA-DISPATCH-20260225120000-0002
Trigger-Source: dispatch-routed
---

# Brikette Deeper Route Funnel CRO Fact-Find Brief

## Scope

### Summary

The Brikette homepage and `/book` page are performing adequately (completed `brikette-cta-sales-funnel-ga4` plan). Deeper funnel routes — `/how-to-get-here`, `/experiences`, `/rooms`, `/rooms/[id]`, and `/assistance` — have three categories of conversion leakage: (1) missing CTAs on high-intent pages, (2) a shared sessionStorage dismiss bug suppressing the sticky CTA across all content pages, and (3) GA4 tracking gaps making key conversion paths dark. A prior usability-hardening fact-find (`brikette-booking-funnel-usability-hardening-fact-find.md`, Ready-for-planning, no plan created) adds a fourth category: SSR/no-JS failures on booking-critical CTAs and i18n key leakage on discovery routes. This brief consolidates all four categories into a single planning input.

### Goals

- Deploy `ContentStickyCta` on `/how-to-get-here` (index + slug) and `/assistance` — currently zero booking CTAs on these high-intent pages.
- Fix the shared `"content-sticky-cta-dismissed"` sessionStorage key: per-page or per-surface scope to prevent cross-page CTA suppression.
- Fix GA4 tracking on `/experiences` book CTA — currently fires `router.push` with no `fireCtaClick` event.
- Add `ContentStickyCta` to `/experiences` listing page (in addition to the existing `guide_detail` coverage).
- Route `/rooms` index room-card CTAs to `/rooms/[id]` (room detail) rather than directly to `/book`, so users see the richer trust signals (amenities, hero, StickyBookNow with Octorate deep-link).
- Add social proof (`SocialProofSection` or equivalent) to at least `/rooms/[id]` — currently only on `/book`.
- Supplement and reorder `/assistance` booking options — add a "Book Direct" primary CTA above the OTA options block; retain Booking.com/Hostelworld/Google Business as secondary fallback. The current layout has no direct booking CTA anywhere in the page (confirmed in `AssistanceIndexContent.tsx`).
- Resolve the four usability-hardening issues from the prior fact-find: CTA no-JS fallback semantics, i18n key leakage on room detail, and bailout markers on discovery routes.

### Non-goals

- Visual redesign of page layouts or hero sections.
- Building a new availability widget/calendar picker.
- Changes to the Octorate integration or booking engine parameters.
- Urgency/scarcity signals (e.g. "X rooms left") — requires real-time inventory data, out of scope here.
- A/B testing framework — post-deployment measurement is passive GA4 observation, not controlled experiment.

### Constraints & Assumptions

- Constraints:
  - All CTAs must degrade gracefully without JS (no-JS fallback `href` required, not button-only).
  - sessionStorage key changes must not create inconsistent dismiss state mid-session if user already has an existing key.
  - GA4 event schema (`cta_click`, `ctaLocation` enum) must remain backward-compatible with existing dashboard configurations.
  - `ContentStickyCta` is a client component (`"use client"`) — it can be added to any page that is, or is wrapped by, a client component.
  - Existing localization/slug routing must remain compatible.
- Assumptions:
  - All room IDs referenced from `/rooms` index have corresponding `/rooms/[id]` pages with content.
  - The `ctaLocation` enum in `ContentStickyCta` already includes `"how_to_get_here"` and `"assistance"` as valid values (both confirmed in `GA4_ENUMS.ctaLocation` and the `ContentStickyCta` prop type's `Extract` list). `"experiences_page"` is NOT in the enum — it must be added before TASK-04 executes.
  - `SocialProofSection` content (ratings, testimonials) is statically bundled via i18n and does not require a live API call.

## Outcome Contract

- **Why:** Operator identified that the homepage performs adequately but deeper funnel routes lose bookings — `/how-to-get-here` has zero booking CTAs despite being the highest-intent informational page; `/experiences` has an untracked book CTA; the shared sessionStorage key likely suppresses the sticky CTA for multi-page sessions; `/assistance` actively promotes OTAs before direct booking.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Increase `cta_click` events attributed to deeper-route `ctaLocation` values (`how_to_get_here`, `experiences_page`, `assistance`) from zero/near-zero to measurable baseline within 30 days of deployment; reduce conversion leak from `/assistance` OTA links; eliminate sessionStorage-driven CTA suppression across content pages.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/[lang]/how-to-get-here/page.tsx` — renders `HowToGetHereIndexContent` client component; no booking CTA anywhere in the tree
- `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx` — individual route guide page; no booking CTA
- `apps/brikette/src/app/[lang]/experiences/page.tsx` — renders `ExperiencesPageContent`; book CTA present but no GA4 tracking; no `ContentStickyCta`
- `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx` — renders `ContentStickyCta` with `ctaLocation="guide_detail"` ✓
- `apps/brikette/src/app/[lang]/rooms/page.tsx` — renders `RoomsPageContent`; room cards route to `/book`, not `/rooms/[id]`
- `apps/brikette/src/app/[lang]/rooms/[id]/page.tsx` — renders `RoomDetailContent` with `StickyBookNow`; no social proof
- `apps/brikette/src/app/[lang]/assistance/page.tsx` (inferred) — renders `AssistanceIndexContent`; OTA links before direct booking; no `ContentStickyCta`
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` — reference baseline; full GA4 funnel, social proof, DirectPerksBlock, PolicyFeeClarityPanel ✓

### Key Modules / Files

- `apps/brikette/src/components/cta/ContentStickyCta.tsx` — shared floating sticky CTA; shared dismiss key bug (`"content-sticky-cta-dismissed"` across all surfaces)
- `packages/ui/src/organisms/StickyBookNow.tsx` — room-detail-specific sticky panel; deep-links to Octorate; uses separate dismiss key `"sticky-cta-dismissed"` ✓ no interference
- `apps/brikette/src/app/[lang]/experiences/ExperiencesCtaSection.tsx` (or inline in `ExperiencesPageContent`) — `onBookClick` calls `router.push` without `fireCtaClick`; GA4 dark spot
- `apps/brikette/src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx` — transport planner hub; no booking CTA at any scroll depth
- `apps/brikette/src/app/[lang]/assistance/AssistanceIndexContent.tsx` — "other booking options" block promotes Booking.com / Hostelworld / Google Business with no direct CTA above them
- `apps/brikette/src/components/landing/SocialProofSection.tsx` — ratings + testimonials; deployed on `/book` (`BookPageContent.tsx`) and homepage (`HomeContent.tsx`); not yet on `/rooms/[id]`; suitable for reuse there
- `apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx` — room cards use `queryState="absent"`, CTA navigates to `/book`; no social proof; no sticky CTA
- `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` — richest trust signals; no social proof; DirectPerksBlock is plain list; only one hardcoded helpful guide link

### Patterns & Conventions Observed

- `ContentStickyCta` is the canonical cross-page floating CTA; `StickyBookNow` is the room-detail-specific variant with Octorate deep-link. Do not conflate them.
- `fireCtaClick` from the GA4 utility must be called before any navigation — the pattern is `fireCtaClick(...)` then `trackThenNavigate(...)` or `router.push(...)`. Evidence: `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx`.
- All booking-critical CTAs should render as `<a>` tags (or `<Link>`) with a fallback `href` in initial HTML, not button-only with JS click handlers. Evidence: prior usability-hardening fact-find (probe snapshot 2026-02-11).
- Room detail pages (`/rooms/[id]`) are the richer conversion surface — hero, amenities, DirectPerksBlock, StickyBookNow with Octorate prefill. The rooms index should funnel users there, not skip to `/book`.

### Data & Contracts

- GA4 `ctaLocation` enum (confirmed in scope): `"guide_detail"`, `"about_page"`, `"bar_menu"`, `"breakfast_menu"`, `"how_to_get_here"` (in enum, never fired), `"assistance"` (confirmed in enum and `ContentStickyCta` prop type — no action required). **`"experiences_page"` is NOT in the GA4 enum and NOT in the `ContentStickyCta` prop type** — it must be added to `GA4_ENUMS.ctaLocation` in `ga4-events.ts` and to the `ContentStickyCta` prop type's `Extract` list as a prerequisite for TASK-04.
- sessionStorage keys in play:
  - `"content-sticky-cta-dismissed"` — shared across: `guide_detail`, `about_page`, `bar_menu`, `breakfast_menu`. Bug: dismiss on any one suppresses on all.
  - `"sticky-cta-dismissed"` — `StickyBookNow` only; isolated; no cross-page interference.
- `cta_click` event schema: `{ ctaId: string, ctaLocation: string, ... }`. The `ctaId` for `ContentStickyCta` is `"content_sticky_check_availability"`.
- `RoomsSection` queryState contract: `"absent"` → CTA navigates to `/{lang}/book`; `"valid"` → CTA deep-links to Octorate with prefilled dates.

### Dependency & Impact Map

- Upstream dependencies:
  - `react-i18next` — translation readiness for CTA copy on new surfaces.
  - `ModalProvider` — `AssistanceIndexContent` uses modals; adding `ContentStickyCta` alongside must not conflict.
  - GA4 event schema — `ctaLocation` enum must include `"experiences_page"` before TASK-04 executes (confirmed missing; must be added). `"assistance"` and `"how_to_get_here"` are already present.
- Downstream dependents:
  - GA4 dashboards tracking `cta_click` by `ctaLocation` — adding new surfaces will create new rows in reports.
  - `brikette-octorate-funnel-reduction` plan (in-flight, TASK-03/07/08/09) — any changes to how CTAs link to Octorate must be coordinated; this plan's scope is CTA placement and GA4 tracking, not Octorate URL parameters.
- Likely blast radius:
  - `apps/brikette` route components for the five affected pages.
  - `apps/brikette/src/components/cta/ContentStickyCta.tsx` — sessionStorage key fix affects all current deployments of this component.
  - `packages/ui/src/organisms/StickyBookNow.tsx` — no changes expected.
  - i18n namespace files — new CTA copy for `how_to_get_here` and `assistance` surfaces may need translation keys.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/integration), Playwright (E2E smoke), audit script (no-JS HTML predicates)
- Commands:
  - `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=<pattern> --no-coverage`
  - `bash .claude/skills/meta-user-test/scripts/run-meta-user-test.mjs` (no-JS audit)
- CI: governed test runner gated in reusable-app.yml

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| GA4 `cta_click` events | Unit | `apps/brikette/src/test/components/ga4-33-book-page-search-availability.test.tsx` | Covers `/book` page GA4; no coverage for `/experiences` or `/how-to-get-here` CTA events |
| No-JS predicate checks | Audit script | `scripts/__tests__/meta-user-test-contract.test.ts` | Checks homepage predicates; missing booking-funnel and discovery-route predicates |
| i18n key parity | Integration | `apps/brikette/src/test/content-readiness/i18n/i18n-parity-quality-audit.test.ts` | Locale file keys; does not assert no-JS HTML for discovery routes |
| Booking structured data | Unit | `apps/brikette/src/test/components/book-page-structured-data.test.tsx` | `/book` only |

#### Coverage Gaps

- No test asserting `fireCtaClick` is called before navigation on the `/experiences` book CTA.
- No test asserting `ContentStickyCta` is mounted on `/how-to-get-here` or `/assistance`.
- No test asserting sessionStorage key isolation (per-surface vs shared).
- No audit predicate for `/how-to-get-here` having any booking CTA in initial HTML.
- No test for `/rooms` index room-card CTA destination (currently `/book`, should become `/rooms/[id]`).

#### Testability Assessment

- Easy to test:
  - GA4 event emission: Jest + mock `fireCtaClick`, assert called before `router.push`.
  - `ContentStickyCta` presence: shallow render test for each affected page.
  - sessionStorage key isolation: mock `sessionStorage`, assert per-surface key is used.
- Hard to test:
  - No-JS fallback CTA `href` in initial SSR HTML — requires audit script extension (Playwright or curl-based HTML probe).
  - i18n key leakage on room detail — requires production/staging HTML probe; not easily unit-testable.
- Test seams needed:
  - Extend audit script predicates for `/how-to-get-here`, `/assistance`, `/experiences` booking CTA presence.
  - Extend `meta-user-test-contract.test.ts` to assert booking-funnel predicates exist in script.

#### Recommended Test Approach

- Unit tests for: `fireCtaClick` call sites on `/experiences` CTA; `ContentStickyCta` render on new surfaces; sessionStorage key per-surface isolation.
- E2E (audit script): extend no-JS HTML predicates for `ContentStickyCta` presence on `/how-to-get-here` and `/assistance`.
- No new E2E Playwright tests required — existing smoke test covers the primary booking path.

### Recent Git History (Targeted)

- `e90d02aa44` — `fix(brikette): booking funnel fixes` — most recent booking-related change; implies ongoing funnel work.
- `8c3e31e639` — `feat(brikette): move guests-love block above book selector` — social proof positioning on `/book` page.
- `832b159299` — `feat(brikette): TASK-13 — upgrade /book page with conversion content + JSON-LD + deal banner` — `/book` page received major conversion uplift in the `brikette-cta-sales-funnel-ga4` plan.
- `20c402bce6` — `feat(brikette): TASK-35 begin_checkout on StickyBookNow click via trackThenNavigate` — confirms `StickyBookNow` GA4 integration is complete.
- `699987e9f6` — `feat(brik): TASK-10B — add no-JS static Octorate fallback to /{lang}/book RSC layer` — no-JS fallback work was done for `/book`; deeper routes not yet addressed.

Implication: `/book` page is fully optimized. Deeper routes were left out of the completed plan's scope. This is the gap this brief addresses.

## Questions

### Resolved

- Q: Does `ContentStickyCta` already support `ctaLocation: "how_to_get_here"`?
  - A: Yes. The explore audit confirmed `"how_to_get_here"` is a valid `ctaLocation` value in the component's prop type and GA4 enum — it is simply never instantiated on that page.
  - Evidence: `apps/brikette/src/components/cta/ContentStickyCta.tsx` (prop type inspection by explore agent).

- Q: Does dismissing `ContentStickyCta` on one page suppress it on others?
  - A: Yes. All current `ContentStickyCta` deployments (guide_detail, about_page, bar_menu, breakfast_menu) use the same sessionStorage key `"content-sticky-cta-dismissed"`. A user who dismisses on any one surface will not see it on any other content page for the rest of the session.
  - Evidence: `apps/brikette/src/components/cta/ContentStickyCta.tsx` (sessionStorage key confirmed by explore agent).

- Q: Does `StickyBookNow` on `/rooms/[id]` have the same shared-key problem?
  - A: No. `StickyBookNow` uses a separate key `"sticky-cta-dismissed"` — no cross-page interference with `ContentStickyCta`.
  - Evidence: `packages/ui/src/organisms/StickyBookNow.tsx`.

- Q: Why does the `/rooms` index route room cards to `/book` rather than `/rooms/[id]`?
  - A: Room cards in `RoomsPageContent` render `RoomsSection` with no `bookingQuery` prop, defaulting `queryState` to `"absent"`. In this state, the room card CTA navigates to `/{lang}/book` as the fallback. This was intentional as a broad-funnel fallback during the `brikette-cta-sales-funnel-ga4` implementation but skips the richer room-detail trust signals.
  - Evidence: `apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx` (queryState absent → `/book` route; confirmed by explore agent).
  - Recommendation: add a "View room details" secondary link on each room card in the rooms index, routing to `/{lang}/rooms/[id]`. The primary CTA can still go to `/book` (or be changed to detail page — operator preference). Adding the detail link is unambiguously correct.

- Q: Is `SocialProofSection` suitable for reuse on `/rooms/[id]`?
  - A: Yes. The component renders static ratings and testimonials from i18n — no live API call. It is a straightforward import. The only question is placement (above or below the room card with price/CTA).
  - Recommendation: place above the room card, below the hero — mirrors the `/book` page pattern where social proof appears before the date picker.

- Q: Is the `/experiences` book CTA missing GA4 tracking a regression or was it never tracked?
  - A: Almost certainly never tracked. The `ExperiencesCtaSection` predates the GA4 implementation plan (`brikette-cta-sales-funnel-ga4`), and the completed plan's task list focused on the homepage, guides, and `/book`. No task covered `/experiences` CTA tracking.
  - Evidence: git log shows `TASK-13` upgraded `/book` and `TASK-33/35` added GA4 to date picker and StickyBookNow; no task references experiences CTA.

- Q: Should the `/assistance` "other booking options" OTA links be removed, reordered, or supplemented?
  - A: Supplement and reorder. Removing them entirely may frustrate users who specifically want OTA options (loyalty points, existing OTA relationship). The correct fix is: add a "Book Direct" primary CTA above the OTA options block, and reframe OTA options as a secondary fallback. This follows standard hospitality direct-booking conversion best practice.
  - Evidence: Booking.com/Hostelworld links appearing before any direct booking prompt is a textbook conversion anti-pattern. No external source needed — this is established CRO principle.

- Q: What is the correct per-surface sessionStorage key schema?
  - A: Use `"content-sticky-cta-dismissed:<ctaLocation>"` — e.g., `"content-sticky-cta-dismissed:guide_detail"`, `"content-sticky-cta-dismissed:about_page"`. This is backward-compatible (different keys, so users who have the old shared key dismissed will see the CTA again on first load after the change — acceptable UX since the bug was suppressing CTAs in error). The `ctaLocation` prop already passed to the component is the natural discriminator.
  - Evidence: `ContentStickyCta` already receives `ctaLocation` as a required prop, making per-surface keys trivial to implement.

### Open (Operator Input Required)

- Q: Should `/rooms` index room-card primary CTA go to `/rooms/[id]` (room detail) or remain going to `/book`?
  - Why operator input is required: This is a UX strategy choice between two valid funnels — detail-first (build interest, then convert) vs. book-first (skip detail, go straight to availability). Both are defensible; operator's sense of where users are in intent when they browse the rooms listing is the deciding factor.
  - Decision impacted: Whether to change the primary `queryState="absent"` CTA or add a secondary detail link alongside it.
  - Decision owner: Operator (Pete)
  - Default assumption: Add a secondary "View details →" link to each room card; keep primary CTA as `/book`. This is additive and non-breaking. If operator prefers to change the primary, scope expands slightly.

## Confidence Inputs

- **Implementation: 90%**
  - Evidence: All file paths identified; component APIs confirmed; sessionStorage key logic is trivial; GA4 event pattern well-established from prior work.
  - To reach ≥90: already at 90 on existing surfaces. One prerequisite: `ctaLocation: "experiences_page"` must be added to `GA4_ENUMS.ctaLocation` in `ga4-events.ts` and to the `ContentStickyCta` prop type's `Extract` list before deploying TASK-04. `ctaLocation: "assistance"` is confirmed present — no action needed.

- **Approach: 85%**
  - Evidence: Solutions are clear for 7 of 8 issues; the one open question (rooms index CTA destination) has a safe default.
  - To reach ≥90: resolve operator preference on rooms index CTA; add `"experiences_page"` to GA4 enum and `ContentStickyCta` prop type (prerequisite for TASK-04).

- **Impact: 82%**
  - Evidence: `/how-to-get-here` has zero booking CTAs — any addition is a net new conversion surface. SessionStorage bug has been suppressing CTAs across multi-page sessions — fixing it restores existing impressions. GA4 dark spot on `/experiences` means current data understates that CTA's performance.
  - To reach ≥90: post-deployment GA4 measurement showing `cta_click` events appearing from new surfaces.

- **Delivery-Readiness: 87%**
  - Evidence: Scope is bounded, no external dependencies, clear acceptance criteria per issue, execution pattern well-established.
  - To reach ≥90: resolve rooms-index CTA question; add `"experiences_page"` to GA4 enum and `ContentStickyCta` prop type (gated prerequisite before TASK-04).

- **Testability: 78%**
  - Evidence: GA4 event emission and component presence are easily unit-testable. sessionStorage key per-surface logic is testable. No-JS HTML predicates for new CTA surfaces require audit script extension.
  - To reach ≥80: add audit script predicates for `/how-to-get-here` and `/assistance` CTA presence. To reach ≥90: full no-JS HTML probe of all affected routes post-deployment.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| sessionStorage key change causes CTA flash for users who had old shared key dismissed | Medium | Low | Acceptable UX — users who were incorrectly suppressed will see the CTA once more. Add brief comment in code explaining the migration. |
| `ctaLocation: "experiences_page"` absent from GA4 enum and `ContentStickyCta` prop type — TASK-04 deploy causes TypeScript compile error or silent event drop | High (it is missing) | Medium | Add `"experiences_page"` to `GA4_ENUMS.ctaLocation` and `ContentStickyCta` prop type as a gated prerequisite before TASK-04; confirmed two-line change. |
| `/rooms` detail-page-first funnel causes drop in `/book` direct landings | Low | Low | Adding a "View details" link is additive; primary CTA still goes to `/book`. No regression risk on default assumption. |
| Adding `ContentStickyCta` to `/how-to-get-here` conflicts with existing `ModalProvider` or layout overflow | Low | Low | `ContentStickyCta` is already deployed on several complex pages (guide_detail, about_page) with no layout conflicts reported. |
| i18n translation keys for new CTA surfaces on non-EN locales missing | Medium | Medium | `ContentStickyCta` CTA copy is shared across all deployments (not surface-specific). No new translation keys needed unless surface-specific copy is desired. Mitigate by auditing locale files for `contentStickyCta.*` namespace coverage. |
| SSR/no-JS issues (from prior fact-find) not addressed in this plan — creates residual gap | High | Medium | This plan absorbs the prior usability-hardening scope. Tasks for CTA no-JS fallbacks and i18n key leakage on room detail should be included as P2 tasks, not deferred again. |

## Planning Constraints & Notes

- Must-follow patterns:
  - All CTA additions must include a no-JS fallback `href` — not button-only. Use `<a href={bookHref}>` wrapping or `<Link href={...}>` pattern.
  - `fireCtaClick` must be called before `router.push` or `trackThenNavigate` for every CTA that navigates. Never call navigate directly.
  - sessionStorage key must be scoped per `ctaLocation` — use `"content-sticky-cta-dismissed:${ctaLocation}"` pattern.
  - New `ctaLocation` values must be added to the GA4 enum before deploying components that use them.
- Rollout/rollback expectations:
  - Changes are additive (adding CTAs, fixing tracking) — rollback by feature revert if issues arise.
  - Deploy to staging and verify GA4 events fire in debug mode before production deploy.
- Observability expectations:
  - After deploy: check GA4 real-time view for `cta_click` events with `ctaLocation: "how_to_get_here"` and `ctaLocation: "experiences_page"`.
  - After 2 weeks: compare `cta_click` volume per surface vs. pre-deploy baseline (will be zero → nonzero for new surfaces).

## Suggested Task Seeds (Non-binding)

**P1 — Zero-CTA fixes (highest conversion leverage):**
- TASK-01: Add `ContentStickyCta` to `/how-to-get-here` index and slug pages (`ctaLocation: "how_to_get_here"`)
- TASK-02: Add primary "Book Direct" CTA above OTA links block on `/assistance`; add `ContentStickyCta` with `ctaLocation: "assistance"` (confirmed in enum and prop type — no prerequisite needed)
- TASK-03: Fix GA4 tracking on `/experiences` listing page book CTA — add `fireCtaClick` before `router.push` in `ExperiencesPageContent.tsx` `handleOpenBooking` callback. Also add a no-JS fallback `href` to the `ExperiencesCtaSection` book button (currently `<Button onClick={onBookClick}>` with no href — violates no-JS constraint).
- TASK-04: Add `ContentStickyCta` to `/experiences` listing page (`ctaLocation: "experiences_page"`). **Prerequisite**: add `"experiences_page"` to `GA4_ENUMS.ctaLocation` in `apps/brikette/src/utils/ga4-events.ts` and to the `ContentStickyCta` prop type's `Extract` list in `apps/brikette/src/components/cta/ContentStickyCta.tsx` before deploying this component.

**P2 — SessionStorage bug and rooms funnel:**
- TASK-05: Fix shared `"content-sticky-cta-dismissed"` sessionStorage key in `ContentStickyCta` — scope to `"content-sticky-cta-dismissed:${ctaLocation}"`
- TASK-06: Add secondary "View room details →" link on each `/rooms` index room card routing to `/{lang}/rooms/[id]`
- TASK-07: Add `SocialProofSection` to `/rooms/[id]` room detail page

**P3 — Usability hardening (from prior unplanned fact-find):**
- TASK-08: Add no-JS `href` fallback to `ContentStickyCta` CTA button (renders as `<a>` in initial HTML)
- TASK-09: Fix i18n key leakage on `/rooms/[id]` (`loadingPrice`, `roomImage.photoAlt`, `roomImage.clickToEnlarge`) — render stable server-safe copy during SSR
- TASK-10: Fix bailout markers on `/rooms`, `/how-to-get-here`, `/experiences` discovery routes — ensure meaningful H1 and body text in initial HTML

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: `lp-do-design-qa` (verify CTA placement and visual consistency post-build)
- Deliverable acceptance package:
  - `ContentStickyCta` renders and fires `cta_click` on `/how-to-get-here` and `/assistance`
  - GA4 `cta_click` fires on `/experiences` book CTA
  - sessionStorage dismiss key is per-surface (verified in unit test)
  - `/assistance` "Book Direct" CTA appears above OTA options block
  - `/rooms` index has "View details" link on room cards
  - All new CTAs render as `<a>` tags in no-JS initial HTML (audit script predicate added)
- Post-delivery measurement plan:
  - T+0: GA4 debug mode — verify new events fire on all new surfaces
  - T+2w: GA4 report — `cta_click` by `ctaLocation`; confirm new surfaces appear with non-zero counts
  - T+4w: compare direct booking conversion rate (sessions with `begin_checkout`) from users entering via deeper routes vs. pre-deploy baseline

## Evidence Gap Review

### Gaps Addressed

1. **`assistance` ctaLocation enum**: Confirmed present in `GA4_ENUMS.ctaLocation` (line 35 of `ga4-events.ts`) and in the `ContentStickyCta` prop type — no action required. **`"experiences_page"` is the missing enum value** (absent from both `GA4_ENUMS.ctaLocation` and the `ContentStickyCta` prop type); must be added as a prerequisite for TASK-04.
2. **RoomsSection `queryState` contract detail**: Confirmed by explore agent from component inspection. No gap remains.
3. **sessionStorage key scope**: Confirmed shared-key bug by direct file inspection. Fix strategy derived from existing `ctaLocation` prop — no additional investigation needed.
4. **GA4 tracking gap on `/experiences`**: Confirmed no `fireCtaClick` call by explore agent. Root cause identified (pre-dates the GA4 plan implementation).
5. **SSR/no-JS prior fact-find scope**: Absorbed into this brief as P3 tasks. The prior fact-find file remains but this plan will supersede it as the execution vehicle.

### Confidence Adjustments

- Implementation score raised from initial estimate of 85% → 90% because explore agent identified exact file paths and confirmed component API compatibility.
- Testability score capped at 78% due to no-JS HTML predicate gap — audit script must be extended before full test coverage is achievable.

### Remaining Assumptions

- `ctaLocation: "assistance"` is confirmed present in `GA4_ENUMS.ctaLocation` and the `ContentStickyCta` prop type — no action needed.
- Room detail pages (`/rooms/[id]`) for all room IDs have populated hero/amenities content (safe assumption given existing product; verify if any new room IDs are added).
- `SocialProofSection` translations for ratings/testimonials are complete across all supported locales (likely true given it already renders on `/book` in all locales).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None. The one open question (rooms index CTA destination) has a safe additive default that proceeds without operator input.
- Recommended next step: `/lp-do-plan brikette-deeper-route-funnel-cro --auto`
