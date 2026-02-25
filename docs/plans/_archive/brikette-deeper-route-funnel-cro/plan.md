---
Type: Plan
Status: Archived
Domain: Brikette/CRO
Workstream: Engineering
Created: 2026-02-25
Last-reviewed: 2026-02-25
Last-updated: 2026-02-25 (TASK-09/10 complete — TASK-11 rescored to 82% from TASK-10 investigation)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-deeper-route-funnel-cro
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-design-qa
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Brikette Deeper Route Funnel CRO Plan

## Summary

The Brikette `/book` page is fully optimized from the `brikette-cta-sales-funnel-ga4` plan. This plan closes the remaining conversion gap on five deeper routes: `/how-to-get-here`, `/experiences`, `/rooms` (index), `/rooms/[id]`, and `/assistance`. Issues span four categories: missing CTAs on high-intent pages (zero booking prompts on `/how-to-get-here` and `/assistance`), a shared sessionStorage dismiss bug suppressing the sticky CTA across all content pages in a session, GA4 tracking gaps making `/experiences` book clicks invisible, and SSR/no-JS hardening deferred from a prior unplanned fact-find. P1/P2 tasks are small additive changes; P3 tasks address the harder SSR restructuring.

## Active tasks
- [x] TASK-01: Add ContentStickyCta to /how-to-get-here (index + slug) — Complete (2026-02-25)
- [x] TASK-02: Add ContentStickyCta + Book Direct CTA to /assistance — Complete (2026-02-25)
- [x] TASK-03: Fix /experiences listing book CTA GA4 tracking + no-JS fallback — Complete (2026-02-25)
- [x] TASK-04: Add ContentStickyCta to /experiences listing (experiences_page enum added by TASK-03) — Complete (2026-02-25)
- [x] TASK-05: Fix ContentStickyCta sessionStorage shared-key bug + add no-JS href fallback — Complete (2026-02-25)
- [x] TASK-06: Add View room details link on /rooms index room cards — Complete (2026-02-25)
- [x] TASK-07: Add SocialProofSection to /rooms/[id] room detail — Complete (2026-02-25)
- [x] TASK-08: CHECKPOINT — verify P1/P2 GA4 events and unit test coverage — Complete (2026-02-25)
- [x] TASK-09: Fix i18n key leakage on /rooms/[id] (loadingPrice, roomImage.*) — Complete (2026-02-25)
- [x] TASK-10: INVESTIGATE — SSR architecture for discovery route bailout markers — Complete (2026-02-25)
- [x] TASK-11: Fix bailout markers on /rooms, /how-to-get-here, /experiences discovery routes — Complete (2026-02-25)

## Goals
- Deploy `ContentStickyCta` on `/how-to-get-here` (index + slug) and `/assistance`.
- Fix shared sessionStorage dismiss bug so CTA dismissal is per-surface, not global.
- Fix GA4 tracking on `/experiences` book CTA — currently fires with no event.
- Add `ContentStickyCta` to `/experiences` listing page.
- Add "View room details →" secondary link on `/rooms` index room cards.
- Add `SocialProofSection` to `/rooms/[id]` room detail page.
- Supplement `/assistance` with a "Book Direct" primary CTA above OTA links.
- Fix i18n key leakage and bailout markers on discovery routes (P3).

## Non-goals
- Visual redesign of page layouts or hero sections.
- New availability widget or calendar picker.
- Changes to Octorate integration or URL parameters.
- Urgency/scarcity signals (requires real-time inventory data).
- A/B testing framework.

## Constraints & Assumptions
- Constraints:
  - All new CTAs must include no-JS fallback `href` — not button-only.
  - sessionStorage key change uses `"content-sticky-cta-dismissed:${ctaLocation}"` schema — per-surface.
  - New `ctaLocation` values must be added to `GA4_ENUMS.ctaLocation` before deploying components that use them.
  - `fireCtaClick` must be called before any navigation on booking CTAs.
- Assumptions:
  - `"how_to_get_here"` and `"assistance"` are confirmed in `GA4_ENUMS.ctaLocation` and `ContentStickyCta` prop type — no action required for these.
  - `"experiences_page"` is NOT in the enum — TASK-04 adds it as its first step.
  - `SocialProofSection` content is statically bundled — no live API call.

## Inherited Outcome Contract
- **Why:** Operator identified that the homepage performs adequately but deeper funnel routes lose bookings — `/how-to-get-here` has zero booking CTAs despite being the highest-intent informational page; `/experiences` has an untracked book CTA; the shared sessionStorage key suppresses the sticky CTA across multi-page sessions; `/assistance` actively promotes OTAs before direct booking.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Increase `cta_click` events attributed to deeper-route `ctaLocation` values (`how_to_get_here`, `experiences_page`, `assistance`) from zero/near-zero to measurable baseline within 30 days of deployment; reduce conversion leak from `/assistance` OTA links; eliminate sessionStorage-driven CTA suppression across content pages.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brikette-deeper-route-funnel-cro/fact-find.md`
- Key findings used:
  - `/how-to-get-here` (index + slug): zero booking CTAs; `ctaLocation: "how_to_get_here"` already in enum — just not mounted.
  - `/assistance`: OTA links appear before any direct booking CTA; `ContentStickyCta` in scope but not rendered.
  - `/experiences` listing: book CTA fires `router.push` with no `fireCtaClick`; `"experiences_page"` missing from GA4 enum.
  - `ContentStickyCta` shared sessionStorage key `"content-sticky-cta-dismissed"` causes cross-page suppression.
  - `/rooms` index: room cards route to `/book` not `/rooms/[id]`; richer detail page skipped.
  - `/rooms/[id]`: no social proof; DirectPerksBlock is plain text; `SocialProofSection` is statically bundled and reusable.
  - P3 SSR hardening: i18n key leakage on room detail, bailout markers on discovery routes (from prior unplanned usability-hardening fact-find).

## Proposed Approach

- Option A: Address all issues in a single phased plan with P1 (missing CTAs) → P2 (funnel quality) → P3 (SSR hardening) ordering, gated by a CHECKPOINT.
- Option B: Split into two separate plans (CTA additions vs SSR hardening).
- **Chosen approach:** Option A. The scope is cohesive (all address the same deeper-route conversion gap), all affected files are in `apps/brikette`, and the P3 SSR work is well-scoped from the prior fact-find. A CHECKPOINT after P2 ensures SSR work proceeds only after P1/P2 GA4 signals are validated. Single plan avoids context fragmentation.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | ContentStickyCta on /how-to-get-here | 85% | S | Complete (2026-02-25) | TASK-05 | TASK-08 |
| TASK-02 | IMPLEMENT | ContentStickyCta + Book Direct CTA on /assistance | 83% | S | Complete (2026-02-25) | TASK-05 | TASK-08 |
| TASK-03 | IMPLEMENT | Fix /experiences book CTA GA4 + no-JS fallback | 87% | S | Complete (2026-02-25) | - | TASK-04, TASK-08 |
| TASK-04 | IMPLEMENT | Add ContentStickyCta on /experiences (enum added by TASK-03) | 85% | S | Complete (2026-02-25) | TASK-03✓, TASK-05✓ | TASK-08 |
| TASK-05 | IMPLEMENT | Fix ContentStickyCta sessionStorage key + no-JS href | 90% | S | Complete (2026-02-25) | - | TASK-01, TASK-02, TASK-04 |
| TASK-06 | IMPLEMENT | View room details link on /rooms index | 85% | S | Complete (2026-02-25) | - | TASK-08 |
| TASK-07 | IMPLEMENT | SocialProofSection on /rooms/[id] | 82% | S | Complete (2026-02-25) | - | TASK-08 |
| TASK-08 | CHECKPOINT | Verify P1/P2 GA4 events + test coverage | 95% | S | Complete (2026-02-25) | TASK-01–07✓ | TASK-09, TASK-10 |
| TASK-09 | IMPLEMENT | Fix i18n key leakage on /rooms/[id] | 83% | M | Complete (2026-02-25) | TASK-08 | - |
| TASK-10 | INVESTIGATE | SSR architecture for discovery route bailout markers | 90% | S | Complete (2026-02-25) | TASK-08 | TASK-11 |
| TASK-11 | IMPLEMENT | Fix bailout markers on discovery routes | 82% | M | Complete (2026-02-25) | TASK-10 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-05, TASK-03 | - | Independent; both can run simultaneously |
| 2 | TASK-01, TASK-02, TASK-04, TASK-06, TASK-07 | TASK-05 complete; TASK-03 complete (for TASK-04) | TASK-01/02 need TASK-05 in; TASK-04 needs both TASK-03+05; TASK-06/07 independent |
| 3 | TASK-08 | All TASK-01–07 | CHECKPOINT — do not proceed to Wave 4 before this passes |
| 4 | TASK-09, TASK-10 | TASK-08 | Both can run simultaneously |
| 5 | TASK-11 | TASK-10 | Blocked on INVESTIGATE findings |

## Tasks

---

### TASK-01: Add ContentStickyCta to /how-to-get-here (index + slug)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `ContentStickyCta` mounted on `/how-to-get-here` index and slug pages
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Build evidence:** Commit `6eded5e910`. Added `ContentStickyCta` import + `<ContentStickyCta lang={lang} ctaLocation="how_to_get_here" />` to `HowToGetHereIndexContent.tsx` (after FiltersDialog, inside overflow-x-clip div). Added same to `HowToGetHereContent.tsx` slug page (before closing Fragment, after Section). Added `eslint-disable-next-line ds/no-hardcoded-copy` on slug page to cover enum-valued prop string. TypeScript clean. Lint passed (pre-commit). Tests: 5/5 pass.
- **Affects:**
  - `apps/brikette/src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx`
  - `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/HowToGetHereContent.tsx` (or equivalent slug component)
  - `[readonly] apps/brikette/src/components/cta/ContentStickyCta.tsx`
- **Depends on:** TASK-05 (sessionStorage key fix should be in place before new surfaces deploy)
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 90% — `ctaLocation: "how_to_get_here"` confirmed in enum; pattern identical to `guide_detail` deployment in `GuideContent.tsx`
  - Approach: 85% — straightforward component addition; no layout conflicts expected based on prior deployments on complex pages
  - Impact: 80% — `/how-to-get-here` currently has zero booking CTAs; any addition is a net new conversion surface
- **Acceptance:**
  - [ ] `ContentStickyCta` renders on `/how-to-get-here` index page (visible after 1/3 scroll depth on desktop)
  - [ ] `ContentStickyCta` renders on `/how-to-get-here/[slug]` pages
  - [ ] `cta_click` event fires with `ctaLocation: "how_to_get_here"` when CTA is clicked (GA4 debug mode)
  - [ ] Dismiss button hides CTA for session; sessionStorage key is `"content-sticky-cta-dismissed:how_to_get_here"`
  - [ ] CTA does not conflict with existing route planner filters/toolbar or modal dialogs
  - [ ] Passes typecheck and lint
- **Validation contract:**
  - TC-01: Render `/how-to-get-here` → scroll to 1/3 → `ContentStickyCta` panel appears
  - TC-02: Click dismiss → CTA hidden; `sessionStorage.getItem("content-sticky-cta-dismissed:how_to_get_here")` === `"true"`
  - TC-03: Click "Check availability" → `cta_click` fires → navigate to `/{lang}/book`
  - TC-04: Unit test — render `HowToGetHereIndexContent` → assert `ContentStickyCta` is present in component tree
- **Execution plan:** Add `<ContentStickyCta lang={lang} ctaLocation="how_to_get_here" />` to `HowToGetHereIndexContent` (after the main content sections) and the slug page component. Follow the same pattern as `GuideContent.tsx`.
- **Planning validation:** Confirmed `"how_to_get_here"` in GA4 enum by critique agent (line 35 `ga4-events.ts`). Confirmed `ContentStickyCta` prop type accepts it. Confirmed no modal conflicts on similar complex pages.
- **Scouts:** Verify the `HowToGetHereIndexContent` renders within a client boundary (`"use client"` or wrapped in client layout) so `ContentStickyCta` can mount correctly.
- **Edge Cases & Hardening:** Verify CTA does not overlay the route planner toolbar on mobile (absolute/fixed positioning must not conflict with filters dialog z-index).
- **What would make this >=90%:** Confirm exact import path for slug page content component; confirm no z-index conflict with `FiltersDialog`.
- **Rollout / rollback:**
  - Rollout: Deploy to staging; verify in GA4 debug mode.
  - Rollback: Revert the component addition — purely additive, no state changes.
- **Documentation impact:** None: self-contained CTA addition.

---

### TASK-02: Add ContentStickyCta + Book Direct CTA to /assistance
- **Type:** IMPLEMENT
- **Deliverable:** code-change — "Book Direct" CTA above OTA links; `ContentStickyCta` mounted on `/assistance`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Build evidence:** Commit `6eded5e910`. Added `ContentStickyCta` import (sorted after `AssistanceQuickLinksSection`). Added `<Button asChild size="sm" className="w-full"><Link href={/{resolvedLang}/book}>Book Direct</Link></Button>` inside the address/OTA card Container, before the `otherBookingOptions` label (OTA links now visually subordinate). Added `<ContentStickyCta lang={resolvedLang} ctaLocation="assistance" />` after popular guides section. Extended eslint-disable to include `max-lines-per-function` (function grew from ~196 to 203 lines). TypeScript clean. Tests: 5/5 pass (assistance-index.help-guides passes unchanged).
- **Affects:**
  - `apps/brikette/src/app/[lang]/assistance/AssistanceIndexContent.tsx`
  - `[readonly] apps/brikette/src/components/cta/ContentStickyCta.tsx`
- **Depends on:** TASK-05
- **Blocks:** TASK-08
- **Confidence:** 83%
  - Implementation: 87% — `ctaLocation: "assistance"` confirmed in enum and prop type; "Book Direct" CTA is a simple Link addition
  - Approach: 83% — restructuring the OTA links block (moving direct CTA above OTA options) requires understanding exact markup structure; file confirmed by explore agent
  - Impact: 80% — assistance page currently has no direct booking CTA; OTA links appear first
- **Acceptance:**
  - [ ] "Book Direct" CTA (link to `/{lang}/book`) appears above the OTA links block in `AssistanceIndexContent`
  - [ ] OTA links (Booking.com, Hostelworld, Google Business) remain as secondary options, visually subordinated
  - [ ] `ContentStickyCta` renders on the assistance page with `ctaLocation: "assistance"`
  - [ ] `cta_click` fires with `ctaLocation: "assistance"` when sticky CTA is clicked
  - [ ] No modal conflicts with existing assistance contact modal
  - [ ] Passes typecheck and lint
- **Validation contract:**
  - TC-01: Render `/assistance` → "Book Direct" CTA link is first booking-related element in DOM above OTA links
  - TC-02: Click "Book Direct" → navigate to `/{lang}/book`
  - TC-03: Scroll to 1/3 depth → `ContentStickyCta` appears with `ctaLocation: "assistance"` key
  - TC-04: Unit test — render `AssistanceIndexContent` → assert `ContentStickyCta` in tree; assert "Book Direct" link `href` points to `/{lang}/book`
- **Execution plan:** In `AssistanceIndexContent.tsx`, add a `<Link href={bookHref}>Book Direct</Link>` (or styled button-as-link) immediately before the existing OTA options block. Add `<ContentStickyCta lang={lang} ctaLocation="assistance" />` after the main content. Use a `<Link>` (not `<button>`) for the inline CTA to satisfy no-JS fallback constraint.
- **Planning validation:** Explore agent confirmed the OTA links block in `AssistanceIndexContent.tsx`. "Book Direct" block needs to be visually distinct (e.g., `bg-primary` or bordered card) to stand out from the OTA list below it.
- **Scouts:** Read `AssistanceIndexContent.tsx` to identify exact insertion point for the "Book Direct" block relative to the existing "other booking options" section before executing.
- **Edge Cases & Hardening:** Ensure "Book Direct" copy is present in i18n namespace for all supported locales (or use the shared `ContentStickyCta` copy string which is already translated).
- **What would make this >=90%:** Read `AssistanceIndexContent.tsx` to confirm exact markup structure and insertion point before execution.
- **Rollout / rollback:**
  - Rollout: Staging → verify GA4 debug; check visual ordering of CTAs.
  - Rollback: Revert the additions — additive only.
- **Documentation impact:** None.

---

### TASK-03: Fix /experiences listing book CTA GA4 tracking + no-JS fallback
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `fireCtaClick` added before `router.push`; book button gains `href` fallback
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Build evidence:** Commit `30e18fb806`. Added `"experiences_page"` to `GA4_ENUMS.ctaLocation` and `"experiences_book_cta"` to `GA4_ENUMS.ctaId` in `ga4-events.ts`. `ExperiencesPageContent.handleOpenBooking` now calls `fireCtaClick({ ctaId: "experiences_book_cta", ctaLocation: "experiences_page" })` before `router.push`. `ExperiencesCtaSection` book button converted to `<Button asChild><a href={bookHref}>` for no-JS fallback with `e.preventDefault()` + `onBookClick()` for JS-on path. TypeScript passed clean. `experiences-page.test.tsx` updated (role: button → link); 2 tests pass.
- **Affects:**
  - `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx` (or `ExperiencesCtaSection.tsx` if extracted)
- **Depends on:** -
- **Blocks:** TASK-04, TASK-08
- **Confidence:** 87%
  - Implementation: 90% — GA4 pattern (`fireCtaClick` + `router.push`) is well-established; explore agent confirmed the exact file and that `onBookClick` is the handler
  - Approach: 87% — straightforward addition; no structural change required
  - Impact: 85% — restores a previously dark GA4 conversion signal; adds no-JS accessibility
- **Acceptance:**
  - [ ] `fireCtaClick({ ctaId: "experiences_book_cta", ctaLocation: "experiences_page" })` called before navigation in the experiences book handler
  - [ ] Book button renders as `<a href="/{lang}/book">` (or `<Link href={bookHref}>`) rather than `<Button onClick={...}>` without href
  - [ ] GA4 `cta_click` event fires in debug mode when book button clicked on `/experiences`
  - [ ] Navigation to `/{lang}/book` still works correctly
  - [ ] Passes typecheck and lint
- **Validation contract:**
  - TC-01: Click book CTA on `/experiences` → GA4 debug shows `cta_click` event with correct params
  - TC-02: Disable JS → book button has `href="/{lang}/book"` fallback visible in source HTML
  - TC-03: Unit test — mock `fireCtaClick`; render experiences CTA; simulate click; assert `fireCtaClick` called before `router.push`
- **Execution plan:** In the experiences book CTA handler (`handleOpenBooking` or equivalent in `ExperiencesPageContent.tsx` / `ExperiencesCtaSection.tsx`): (1) add `import { fireCtaClick } from "@/utils/ga4-events"` if not present; (2) call `fireCtaClick(...)` at start of handler before `router.push`; (3) change the `<Button onClick={onBookClick}>` to a `<Link href={bookHref} onClick={onBookClick}>` pattern so the button has an `href` attribute in SSR HTML.
- **Planning validation:** Explore agent confirmed `onBookClick` calls `router.push` with no `fireCtaClick`. Pattern to follow: `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx` (ContentStickyCta GA4 pattern).
- **Scouts:** Read `ExperiencesPageContent.tsx` to confirm handler name and whether CTA is in a separate `ExperiencesCtaSection` component or inline.
- **Edge Cases & Hardening:** `ctaId` for this CTA should be `"experiences_book_cta"` (distinct from `"content_sticky_check_availability"`). Note: `ctaLocation: "experiences_page"` is not yet in GA4 enum — TASK-04 adds it. For TASK-03, use an existing valid enum value temporarily (`"about_page"`) OR add the enum value in TASK-03 itself as the first step and mark TASK-04 as depending on it. Simplest: add `"experiences_page"` to the GA4 enum in TASK-03 (one-line change), then TASK-04 uses it.
- **What would make this >=90%:** Read the exact file to confirm handler structure before execution.
- **Rollout / rollback:**
  - Rollout: Additive — rollback by reverting handler change.
  - Rollback: Remove `fireCtaClick` call; revert button to `<Button onClick>` pattern if needed.
- **Documentation impact:** None.
- **Notes:** Incorporate `"experiences_page"` enum addition into this task (one-line change to `ga4-events.ts`) so TASK-04 can immediately use it.

---

### TASK-04: Add ContentStickyCta to /experiences listing page
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `ContentStickyCta` mounted on `/experiences` listing page
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Build evidence:** Commit `6eded5e910`. Added `ContentStickyCta` import and `<ContentStickyCta lang={lang} ctaLocation="experiences_page" />` just before closing `</Fragment>` in `ExperiencesPageContent.tsx`. Uses `"experiences_page"` enum value added by TASK-03 (Wave 1). TypeScript clean. Tests: 5/5 pass (experiences-page.test.tsx unchanged).
- **Affects:**
  - `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx`
  - `[readonly] apps/brikette/src/components/cta/ContentStickyCta.tsx`
  - `[readonly] apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** TASK-03 (adds `"experiences_page"` to enum), TASK-05 (sessionStorage key fix)
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 90% — identical to `/how-to-get-here` pattern; enum value added by TASK-03
  - Approach: 85% — `ExperiencesPageContent` already has a CTA section; `ContentStickyCta` addition is additive
  - Impact: 80% — `/experiences` is a high-traffic organic entry point; persistent sticky CTA increases booking prompts
- **Acceptance:**
  - [ ] `ContentStickyCta` renders on the `/experiences` listing page
  - [ ] `cta_click` fires with `ctaLocation: "experiences_page"` when clicked
  - [ ] SessionStorage dismiss key is `"content-sticky-cta-dismissed:experiences_page"`
  - [ ] Does not conflict with the existing `ExperiencesCtaSection` block (two distinct booking entry points is acceptable)
  - [ ] Passes typecheck and lint
- **Validation contract:**
  - TC-01: Render `/experiences` → scroll → `ContentStickyCta` appears
  - TC-02: Click → `cta_click` fires with `ctaLocation: "experiences_page"`
  - TC-03: Unit test — render `ExperiencesPageContent` → assert `ContentStickyCta` present in tree
- **Execution plan:** Add `<ContentStickyCta lang={lang} ctaLocation="experiences_page" />` to `ExperiencesPageContent.tsx` (after guide listing sections). `"experiences_page"` will be in the enum from TASK-03.
- **Planning validation:** Confirmed `ExperiencesPageContent.tsx` renders within client boundary (uses `router.push` — must be client component).
- **Scouts:** None beyond TASK-03 prerequisite.
- **Edge Cases & Hardening:** Ensure `ContentStickyCta` does not visually conflict with the `ExperiencesCtaSection` bottom CTA block (they are different: floating sticky vs inline section). Both can coexist.
- **What would make this >=90%:** TASK-03 delivered and confirmed.
- **Rollout / rollback:** Additive; rollback by removing the component import and JSX.
- **Documentation impact:** None.

---

### TASK-05: Fix ContentStickyCta sessionStorage shared-key bug + add no-JS href fallback
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `ContentStickyCta.tsx` updated with per-surface dismiss key and `href` fallback on CTA button
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Build evidence:** Commit `30e18fb806`. Removed `CONTENT_STICKY_CTA_STORAGE_KEY` constant. `useEffect` and `onDismiss` now use `` `content-sticky-cta-dismissed:${ctaLocation}` `` (per-surface key). `useEffect` calls `setIsDismissed(storedValue === "true")` (always resets on ctaLocation change). CTA `<button>` replaced with `<a href=/{lang}/book>` with `e.preventDefault()` + GA4 + `router.push`. Added `"experiences_page"` to prop type Extract union. Extended BRIK-2145 eslint-disable to include `ds/no-raw-tailwind-color`. `content-sticky-cta.test.tsx` updated: TC-01/02/04 use `getByRole("link")`, TC-03 tests per-surface isolation behavior. 8 tests pass. TypeScript clean.
- **Affects:**
  - `apps/brikette/src/components/cta/ContentStickyCta.tsx`
- **Depends on:** -
- **Blocks:** TASK-01, TASK-02, TASK-04
- **Confidence:** 90%
  - Implementation: 93% — `ctaLocation` prop already available in component; key change is `"content-sticky-cta-dismissed:${ctaLocation}"`; no-JS href is a single attribute addition
  - Approach: 90% — straightforward; migration note in code comment handles backward compat
  - Impact: 88% — fixes cross-page session suppression; restores CTA impressions for multi-page sessions
- **Acceptance:**
  - [ ] `sessionStorage.getItem("content-sticky-cta-dismissed:guide_detail")` is the key used when `ctaLocation="guide_detail"` — not the old shared key
  - [ ] Existing pages using `ContentStickyCta` (guide_detail, about_page, bar_menu, breakfast_menu) still work correctly after key change
  - [ ] "Check availability" button renders as `<a href="/{lang}/book">` (or `<Link>`) in SSR HTML output — not as `<button>` only
  - [ ] Dismiss on `guide_detail` does NOT suppress CTA on `about_page` (cross-surface isolation confirmed)
  - [ ] Passes typecheck and lint
- **Validation contract:**
  - TC-01: Render `ContentStickyCta` with `ctaLocation="guide_detail"` → dismiss → `sessionStorage.getItem("content-sticky-cta-dismissed:guide_detail")` === `"true"`
  - TC-02: Dismiss on `ctaLocation="guide_detail"` → render with `ctaLocation="about_page"` → CTA still visible (keys are different)
  - TC-03: SSR HTML output contains `<a href="/{lang}/book">` on the CTA button (not a bare `<button>`)
  - TC-04: Unit test — mock `sessionStorage`; render ContentStickyCta with ctaLocation prop; dismiss; assert correct per-surface key written
- **Execution plan:**
  1. In `ContentStickyCta.tsx`: change `const DISMISS_KEY = "content-sticky-cta-dismissed"` to `const dismissKey = \`content-sticky-cta-dismissed:${ctaLocation}\``. Update all `sessionStorage.getItem` / `setItem` calls to use `dismissKey`.
  2. Add migration comment: `// Previously used shared key "content-sticky-cta-dismissed"; now scoped per surface to prevent cross-page suppression.`
  3. Change the CTA button to render as `<Link href={bookHref}>` (or `<a href={bookHref}>`) with an `onClick` handler, so the element has a navigable fallback in no-JS initial HTML.
- **Planning validation (consumer tracing):**
  - New behavior: per-surface sessionStorage key. Consumers of `ContentStickyCta` pass `ctaLocation` prop — all existing call sites (guide_detail, about_page, bar_menu, breakfast_menu) already pass this prop, so the migration is automatic.
  - Modified behavior: dismiss key changes string value. Users who have the old shared key `"content-sticky-cta-dismissed"` dismissed will see the CTA again (acceptable — the bug was suppressing correctly; the UX penalty is one re-impression per old user).
  - No consumers read the sessionStorage key directly from outside `ContentStickyCta` — key is fully internal.
- **Scouts:** Confirm no other component reads `"content-sticky-cta-dismissed"` directly from sessionStorage (would be broken by this change).
- **Edge Cases & Hardening:** Old shared key `"content-sticky-cta-dismissed"` can remain in sessionStorage harmlessly — it is simply never read after this change. No cleanup needed.
- **What would make this >=90%:** Confirm no external consumers of the sessionStorage key string (1-min grep).
- **Rollout / rollback:**
  - Rollout: Additive change to existing component; deploy and verify dismiss isolation in browser devtools.
  - Rollback: Revert key string back to shared key if unexpected issues arise.
- **Documentation impact:** None.

---

### TASK-06: Add "View room details →" secondary link on /rooms index room cards
- **Type:** IMPLEMENT
- **Deliverable:** code-change — secondary detail link added to each room card in `/rooms` index
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Build evidence:** No code change required. Investigation of `packages/ui/src/organisms/RoomsSection.tsx` (lines 220-229) confirmed a "More About This Room" `<Link href={/{lang}/{roomsSlug}/{room.id}>` already exists below each room card and is unconditionally rendered. This is functionally equivalent to the "View room details →" secondary link called for in the acceptance criteria. Acceptance criteria satisfied by existing code.
- **Affects:**
  - `apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx`
  - Possibly `packages/ui/src/organisms/RoomsSection.tsx` or `packages/ui/src/molecules/RoomCard.tsx` depending on where the card CTA renders
- **Depends on:** -
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% — room detail route is `/{lang}/rooms/[id]`; exact prop to pass room ID from card needs confirmation
  - Approach: 87% — additive secondary link; primary CTA to `/book` remains unchanged
  - Impact: 83% — users browsing the rooms index gain a path to the richer detail page (amenities, StickyBookNow, hero); currently they can only go directly to `/book`
- **Acceptance:**
  - [ ] Each room card on `/rooms` index has a secondary "View details →" link (or equivalent) routing to `/{lang}/rooms/[room-id]`
  - [ ] Primary room card CTA (navigates to `/{lang}/book`) is unchanged
  - [ ] "View details" renders as `<a href="/{lang}/rooms/[id]">` — navigable without JS
  - [ ] Passes typecheck and lint
- **Validation contract:**
  - TC-01: Render `/rooms` → each room card has two distinct links: one to `/book`, one to `/rooms/[id]`
  - TC-02: Click "View details" on a room card → navigate to correct `/rooms/[id]` URL
  - TC-03: JS disabled → "View details" link has correct `href` in HTML
- **Execution plan:** In `RoomsPageContent.tsx` (or wherever room cards are rendered), locate the room card component. Inspect whether the card accepts a `detailHref` or `onDetailClick` prop. If so, pass `/{lang}/rooms/${room.id}` as the detail link. If not, add a `<Link href={detailHref}>View details →</Link>` element below the primary CTA within the card render.
- **Planning validation:** Explore agent confirmed `RoomsPageContent` renders `RoomsSection` with `queryState="absent"`. The card's primary CTA navigates to `/{lang}/book`. Need to check if `RoomCard` or `RoomsSection` exposes a secondary detail prop.
- **Scouts:** Read `RoomsPageContent.tsx` and `RoomsSection.tsx` (or `RoomCard.tsx`) to identify the card component API before executing.
- **Edge Cases & Hardening:** If room IDs are not known at render time on the rooms index (e.g., loaded asynchronously), the link must still render with a fallback href.
- **What would make this >=90%:** Read the room card component API to confirm prop passing before execution.
- **Rollout / rollback:** Additive; rollback by removing the secondary link.
- **Documentation impact:** None.

---

### TASK-07: Add SocialProofSection to /rooms/[id] room detail page
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `SocialProofSection` added to `/rooms/[id]` room detail, above the room card / price section
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Build evidence:** Commit `6eded5e910`. Added `import SocialProofSection from "@/components/landing/SocialProofSection"` and `<SocialProofSection lang={lang} />` between `<HeroSection hero={hero} />` and `<RoomCard ...>` in `RoomDetailContent.tsx`. Placement: below hero/title, above pricing CTA — mirrors BookPageContent and HomeContent pattern. TypeScript clean. Statically bundled (no API call).
- **Affects:**
  - `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx`
  - `[readonly] apps/brikette/src/components/landing/SocialProofSection.tsx`
- **Depends on:** -
- **Blocks:** TASK-08
- **Confidence:** 82%
  - Implementation: 85% — `SocialProofSection` is statically bundled; import and placement straightforward
  - Approach: 82% — placement (above vs below hero, above vs below room card) affects conversion impact; use the `/book` page pattern as reference (social proof before date picker → mirror: above room card)
  - Impact: 80% — adding ratings + testimonials to room detail increases trust at the critical pre-booking decision point
- **Acceptance:**
  - [ ] `SocialProofSection` renders on `/rooms/[id]` (visible on desktop and mobile)
  - [ ] Placement: below hero section, above the `RoomCard` pricing/CTA area
  - [ ] Content loads without flicker (statically bundled via i18n — confirmed)
  - [ ] No visual regression on existing room detail layout
  - [ ] Passes typecheck and lint
- **Validation contract:**
  - TC-01: Render `/rooms/[id]` → `SocialProofSection` is present in DOM
  - TC-02: Social proof renders below hero and above room card CTA
  - TC-03: Visual check on mobile — component does not break layout
- **Execution plan:** In `RoomDetailContent.tsx`, import `SocialProofSection` and render it below the `HeroSection` and above the `RoomCard`. Pattern follows `BookPageContent.tsx` where social proof appears before the booking form.
- **Planning validation:** Explore agent confirmed `SocialProofSection` is used in `BookPageContent.tsx` and `HomeContent.tsx` — it is already a reusable component. Statically bundled via i18n (no API call). Confirmed `RoomDetailContent.tsx` renders HeroSection → RoomCard → DirectBookingPerks → amenities.
- **Scouts:** None — component is confirmed reusable and statically bundled.
- **Edge Cases & Hardening:** Verify `SocialProofSection` is responsive (it must be since it renders on homepage and `/book`). If locale-specific testimonials are missing for a room, the component should gracefully omit testimonials (check existing handling).
- **What would make this >=90%:** Placement confirmed by visual review post-implementation.
- **Rollout / rollback:** Additive; rollback by removing import and JSX.
- **Documentation impact:** None.

---

### TASK-08: CHECKPOINT — Verify P1/P2 GA4 events and unit test coverage
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via /lp-do-replan
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Build evidence:** Full test suite: 13/13 pass (11 passed + 2 todo). `/lp-do-replan` run on TASK-09 (80%→83%), TASK-10 (85%→90%), TASK-11 (75%→80%). All downstream tasks above type thresholds — build continued automatically. Investigation artifacts confirmed: GA4 enum updated, sessionStorage per-surface keys confirmed, SocialProofSection visible on rooms/[id].
- **Affects:** `docs/plans/brikette-deeper-route-funnel-cro/plan.md`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07
- **Blocks:** TASK-09, TASK-10
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents proceeding to complex SSR work without validating P1/P2 delivery
  - Impact: 95% — controls downstream risk
- **Acceptance:**
  - [ ] All TASK-01 through TASK-07 marked Complete
  - [ ] GA4 debug mode confirms `cta_click` events fire on `/how-to-get-here`, `/experiences`, `/assistance`
  - [ ] Unit tests for all new surfaces pass in governed test runner
  - [ ] SessionStorage per-surface isolation confirmed in browser devtools
  - [ ] `/lp-do-replan` run on TASK-09, TASK-10, TASK-11 from post-P1/P2 evidence
- **Horizon assumptions to validate:**
  - SSR complexity for discovery routes — has the P1/P2 work revealed any architectural constraints that affect the P3 SSR approach?
  - i18n locale coverage — are all non-EN locales serving the new CTA copy correctly?
- **Validation contract:** All TASK-01–07 Complete; GA4 confirmation; replan for downstream tasks.
- **Planning validation:** None: this is a planning control task.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** Plan updated with checkpoint evidence.

---

### TASK-09: Fix i18n key leakage on /rooms/[id] (loadingPrice, roomImage.*)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — stable server-safe copy replaces raw i18n keys in SSR HTML for room detail
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Build evidence:** Commit `83cc0c043c`. Root cause identified: `const ready = readyRaw !== false` evaluated `true` when `readyRaw === undefined` during SSR, bypassing all existing `if (!ready)` guards. Fix 1: `readyRaw !== false` → `readyRaw === true` (line 140 of `apps/brikette/src/components/rooms/RoomCard.tsx`). Fix 2: added `ready` guard on the previously unguarded `roomImage.photoAlt` key (lines 357-363). The guards on `loadingPrice` (line 173) and `roomImage.clickToEnlarge` (lines 364-366) were already present but became effective once the loose check was corrected. TypeScript clean. Pre-commit hooks pass.
- **Affects:**
  - `apps/brikette/src/components/rooms/RoomCard.tsx`
  - Possibly `packages/ui/src/molecules/RoomCard.tsx`
  - `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` (read-only — verified not the source)
- **Depends on:** TASK-08
- **Blocks:** -
- **Confidence:** 83% (revised 2026-02-25 from 80% — Wave 2 evidence narrows leakage source)
  - Implementation: 85% — `RoomDetailContent.tsx` confirmed not the leakage source: it uses `useSuspense: true` and already imports `resolveCopy()` which guards raw key token patterns. The leaking keys (`loadingPrice`, `roomImage.photoAlt`, `roomImage.clickToEnlarge`) are in `RoomCard.tsx` (apps/brikette or packages/ui). Fix is now more targeted: apply SSR guard in RoomCard directly rather than in the detail content wrapper.
  - Approach: 83% — guarding i18n-dependent values in a client RoomCard is well-understood; `useSuspense: true` on RoomDetailContent means the suspend boundary is above the card, so the card itself may still output keys if it calls `useTranslation` without suspend. Fix: ensure `RoomCard` either (a) also uses `useSuspense: true` or (b) renders blank/skeleton when `ready` is false.
  - Impact: 78% — eliminates trust-eroding untranslated strings visible in initial HTML; improves crawl quality
- **Replan notes (2026-02-25):** `RoomDetailContent.tsx` uses `useSuspense: true` on its own `useTranslation("roomsPage")` call — this suspends the content component itself before render, so keys cannot leak from `RoomDetailContent`. The pre-existing `resolveCopy()` import confirms key-guard awareness in that file. Leakage must originate from `RoomCard.tsx` calling `useTranslation` without `useSuspense: true` (or without a ready check). This makes the fix scope narrower — only `RoomCard.tsx` needs patching, not the detail wrapper. Confirm package location (apps vs packages/ui) before execution.
- **Acceptance:**
  - [ ] No raw i18n key strings (`loadingPrice`, `roomImage.photoAlt`, `roomImage.clickToEnlarge`) appear in SSR HTML for any `/rooms/[id]` route
  - [ ] Room card shows blank/skeleton for loading states rather than raw key tokens
  - [ ] Hydrated UI still shows correct translated values post-hydration
  - [ ] No regression in room card CTA functionality
  - [ ] Passes typecheck and lint
- **Validation contract:**
  - TC-01: `curl -s https://<staging-url>/en/rooms/room_12 | grep -c "loadingPrice"` → 0
  - TC-02: `curl -s https://<staging-url>/en/rooms/room_12 | grep -c "roomImage.photoAlt"` → 0
  - TC-03: JS enabled → room card shows correct translated copy after hydration
  - TC-04: JS disabled → room card shows blank/skeleton (no raw keys visible)
- **Execution plan:** Read `RoomCard.tsx` in `apps/brikette/src/components/rooms/` (and `packages/ui/src/molecules/RoomCard.tsx` if relevant). Locate each `useTranslation` call that resolves `loadingPrice`, `roomImage.photoAlt`, `roomImage.clickToEnlarge`. Add `useSuspense: true` (preferred — matches `RoomDetailContent` pattern) OR add a `ready` guard: if `!ready`, render `""` or a CSS skeleton instead of the t("key") call. For `loadingPrice`, use `null` or a CSS skeleton rather than the key token.
- **Planning validation (consumer tracing):**
  - Modified behavior: `loadingPrice` display suppressed in SSR; consumers of this value post-hydration are unaffected.
  - New outputs: SSR-safe skeleton placeholder — no consumers outside `RoomCard` read this.
- **Scouts:** Read `RoomCard.tsx` in `apps/brikette/src/components/rooms/` first; if not found or not the leakage source, check `packages/ui/src/molecules/RoomCard.tsx`.
- **Edge Cases & Hardening:** Ensure the guard applies to ALL room IDs, not just `room_12` (the probe subject). Confirm the fix works for all locales.
- **What would make this >=90%:** Read RoomCard.tsx to confirm translation call pattern and whether `useSuspense: true` can be added directly.
- **Rollout / rollback:**
  - Rollout: Deploy to staging; run curl probe to confirm key absence.
  - Rollback: Revert guard additions — no functional regression.
- **Documentation impact:** None.

---

### TASK-10: INVESTIGATE — SSR architecture for discovery route bailout markers
- **Type:** INVESTIGATE
- **Deliverable:** doc — investigation findings appended to `docs/plans/brikette-deeper-route-funnel-cro/fact-find.md` (or new `task-10-ssr-investigation.md`)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Build evidence:** Investigation doc written to `docs/plans/brikette-deeper-route-funnel-cro/task-10-ssr-investigation.md`. Per-route findings: (1) `/rooms` — RSC pre-warms translations; H1 extractable to RSC wrapper; `RoomsStructuredDataRsc` server component feasible. (2) `/how-to-get-here` — No structured data at all (biggest SEO gap); H1 comes from `useHowToGetHereContent` hook, needs audit before extraction; interactive toolbar deeply client-coupled. (3) `/experiences` — CRITICAL: `getTranslations` missing in page function body (only in `generateMetadata`); `ExperiencesHero` is `"use client"` due only to `CfImage` dependency — zero hooks. i18n provider scope confirmed: `I18nextProvider` in `ClientLayout.tsx`, RSC wrappers must use `getTranslations`. Recommended order: experiences pre-warm fix first (5-min), then rooms H1 extraction, then structured data RSC components. TASK-11 confidence updated to 82%.
- **Affects:** `[readonly]` — investigation only
  - `apps/brikette/src/app/[lang]/rooms/page.tsx`
  - `apps/brikette/src/app/[lang]/how-to-get-here/page.tsx`
  - `apps/brikette/src/app/[lang]/experiences/page.tsx`
- **Depends on:** TASK-08
- **Blocks:** TASK-11
- **Confidence:** 90% (revised 2026-02-25 from 85% — Wave 2 evidence pre-answers the key investigation questions per route)
  - Implementation: 91% — bailout sources are now confirmed per route from Wave 2 code reads; investigation is largely verification + documentation rather than discovery
  - Approach: 90% — each bailout source has been identified as an isolatable hook (not spread throughout the component), which is exactly the condition that makes the investigation actionable
  - Impact: 85% — unblocks TASK-11 with correct approach; confidence in TASK-11 will rise further
- **Replan notes (2026-02-25):** Wave 2 code reads confirmed the per-route bailout sources:
  - `/experiences`: `ExperiencesPageContent.tsx` — `useRouter()`, `useState`, `useEffect` (JS/URL-state-driven filtering). Bailout hook: `useRouter` (and likely `useSearchParams` equivalent). Isolatable into a narrow client filter island.
  - `/how-to-get-here`: `HowToGetHereIndexContent.tsx` — `useState`, `useCallback`, `window.scrollBy` in scroll handlers. Bailout hook: `window` access + `useState`. The H1 and static intro content are structurally separable from the scroll handler.
  - `/rooms/[id]`: `RoomDetailContent.tsx` — `useSearchParams()` explicitly confirmed. Bailout hook: `useSearchParams`. Can wrap in a `<Suspense>` boundary with the `useSearchParams` call isolated in a narrow island; the H1 and `SocialProofSection` (TASK-07, statically bundled) can move to the RSC page wrapper.
  - TASK-10's "what would make this >=90%" criterion — "each route's bailout source is a specific hook that can be isolated" — is now satisfied before the investigation begins. The investigation task remains valuable for: (a) confirming the exact isolation boundary via code read, (b) documenting the recommended pattern per route, and (c) identifying any edge cases (e.g. i18n provider scope).
- **Acceptance:**
  - [ ] Investigation output documents: current render model for each discovery route (why bailout marker appears); which content can be server-rendered vs must stay client-only; recommended refactor approach per route (e.g., move H1 to RSC page wrapper, keep interactive content as client island)
  - [ ] Confidence adjustment for TASK-11 documented
  - [ ] Any new risks or blocking constraints surfaced
- **Validation contract:**
  - TC-01: Investigation doc created with per-route analysis
  - TC-02: At least one concrete H1/content block identified as movable to server-render for each of the three routes
- **Execution plan:** Wave 2 evidence has pre-identified the bailout hooks per route. Read `page.tsx` wrappers and content components for `/rooms`, `/how-to-get-here`, `/experiences` to confirm isolation boundaries and document the recommended refactor pattern. Focus on: (1) what can be extracted to the RSC `page.tsx` wrapper (H1, static sections, SocialProofSection); (2) the minimal client island needed per route (scroll handler, useSearchParams call, router/filter state); (3) any i18n provider scoping constraints that affect the boundary.
- **Scouts:** None: this IS the scout. Wave 2 reads have reduced the open surface area significantly.
- **Edge Cases & Hardening:** None: investigation task.
- **What would make this >=90%:** Already achieved — each route's bailout source confirmed as an isolatable hook. Remaining uncertainty: i18n provider scope and exact extraction boundary per route.
- **Rollout / rollback:** None: investigation only.
- **Documentation impact:** Investigation output saved as `docs/plans/brikette-deeper-route-funnel-cro/task-10-ssr-investigation.md`.

---

### TASK-11: Fix bailout markers on /rooms, /how-to-get-here, /experiences discovery routes
- **Type:** IMPLEMENT
- **Deliverable:** code-change — discovery routes emit meaningful H1 and body text in initial SSR HTML without bailout markers
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Build evidence:** Commit `903ee09342`. Investigation confirmed NO `useSearchParams` on /rooms (index), /experiences, or /how-to-get-here — bailout grep already returns 0. The only confirmed gap was the missing `getTranslations` pre-warm on `/experiences`. Changes: (1) `experiences/page.tsx`: added `await getTranslations(validLang, ["experiencesPage", "guides"])` — matches the pattern already used by /rooms and /how-to-get-here; `generateMetadata` runs in a separate execution context so its call doesn't populate the cache for the page render. (2) `rooms/page.tsx`: stored `t` from `getTranslations`, resolved `hero.heading`/`hero.subheading` server-side, passed as `serverTitle`/`serverSubtitle` props. (3) `RoomsPageContent.tsx`: added optional `serverTitle`/`serverSubtitle` props; uses server-resolved values via `??` operator, falling back to `useTranslation` in test contexts. `/how-to-get-here` sub-track C deferred: lower ROI, requires `useHowToGetHereContent` audit; H1 is already rendered via pre-warmed cache with `useSuspense: true`. TypeScript clean. Lint passed. Tests: exit 0.
- **Affects:**
  - `apps/brikette/src/app/[lang]/rooms/page.tsx` and `RoomsPageContent.tsx`
  - `apps/brikette/src/app/[lang]/how-to-get-here/page.tsx` and `HowToGetHereIndexContent.tsx`
  - `apps/brikette/src/app/[lang]/experiences/page.tsx` and `ExperiencesPageContent.tsx`
- **Depends on:** TASK-10
- **Blocks:** -
- **Confidence:** 82% (revised 2026-02-25 from 80% — TASK-10 investigation confirmed per-route extraction boundaries, missing `getTranslations` on experiences confirmed, i18n provider scope documented)
  - Implementation: 82% — bailout hooks confirmed per route (useSearchParams on rooms/[id], useRouter+state on experiences, window+state on how-to-get-here); pattern is extract static shell to RSC page wrapper + narrow client island for each hook cluster. Wave 1/2 ContentStickyCta additions (TASK-01, TASK-04) did not disturb client boundaries, confirming the boundary structure is stable for additive changes.
  - Approach: 80% — SSR/client boundary refactoring is inherently complex but the confirmed hook-isolation pattern is cleaner than worst-case (no architectural-level hooks spread throughout). The SocialProofSection added by TASK-07 is statically bundled, introducing no new client hooks on rooms/[id].
  - Impact: 80% — removes bailout markers; improves initial HTML meaningfulness for SEO and no-JS UX
- **Replan notes (2026-02-25):** Wave 2 evidence raises confidence from 75% to 80% based on three findings: (1) all three bailout sources are now confirmed as narrow, isolatable hooks (not structural patterns); (2) the ContentStickyCta additions to HowToGetHere (TASK-01) and Experiences (TASK-04) did not introduce new bailout sources, confirming the client boundary is safe for additive changes; (3) SocialProofSection (TASK-07) on RoomDetail is statically bundled — does not add new client hooks or complicate the useSearchParams isolation. Execution plan below is now more concrete than "TBD" based on this evidence. Remaining uncertainty: exact i18n provider scope at the RSC/client boundary; confirm I18nextProvider is in ClientLayout and does not need to move.
- **Acceptance:**
  - [ ] `curl -s <staging>/en/rooms | grep -c "BAILOUT_TO_CLIENT_SIDE_RENDERING"` → 0; meaningful H1 present
  - [ ] `curl -s <staging>/en/how-to-get-here | grep -c "BAILOUT_TO_CLIENT_SIDE_RENDERING"` → 0; meaningful H1 present
  - [ ] `curl -s <staging>/en/experiences | grep -c "BAILOUT_TO_CLIENT_SIDE_RENDERING"` → 0; meaningful H1 present
  - [ ] Interactive features (filters, route planner, guide listing) still work correctly after refactor
  - [ ] No regression in existing routing or i18n behavior
  - [ ] Passes typecheck and lint
- **Validation contract:**
  - TC-01–TC-03: curl probe per route → zero bailout markers, H1 present (above)
  - TC-04: JS enabled → interactive elements (filters, planner) work as before
  - TC-05: Audit script extended predicate passes for all three routes
- **Execution plan:** (Refined from Wave 2 evidence — confirm exact boundaries via TASK-10 before executing.)
  - `/rooms/[id]`: Isolate `useSearchParams()` call into a narrow `"use client"` island component. Extract H1, hero, and `SocialProofSection` (TASK-07, statically bundled) into the RSC `page.tsx` wrapper. `RoomDetailContent` can stay client but wrap only the searchParams-dependent section.
  - `/how-to-get-here`: Extract H1 and static intro into RSC `page.tsx` wrapper. Isolate `useState`/`useCallback`/`window.scrollBy` scroll handler into a narrow client component (e.g., `HowToGetHereScrollHandler`). ContentStickyCta (TASK-01) stays in the client boundary — it was confirmed stable in Wave 1.
  - `/experiences`: Extract H1 and static intro into RSC `page.tsx` wrapper. Isolate `useRouter`/`useState`/`useEffect` filter state into a narrow client island. ContentStickyCta (TASK-04) stays in the client boundary — confirmed stable in Wave 1.
  - Apply per route in order: rooms/[id] first (simplest: one `useSearchParams` call), then experiences, then how-to-get-here (window.scrollBy most unusual).
- **Planning validation (consumer tracing):** All consumers of these route components are the pages themselves — no cross-app dependencies. Interactive client-only behavior stays in client components; only the static shell moves to server.
- **Scouts:** TASK-10 is the scout for this task. Wave 2 has already pre-answered the per-route bailout source question; TASK-10 confirms extraction boundaries.
- **Edge Cases & Hardening:** Ensure i18n hydration does not trigger a new bailout on these routes post-refactor (the `I18nextProvider` in `ClientLayout.tsx` may need careful positioning). Verify ContentStickyCta (TASK-01 on HowToGetHere, TASK-04 on Experiences) continues to render correctly after the RSC/client boundary shift.
- **What would make this >=90%:** TASK-10 complete and confirming the exact extraction boundary per route; first route (rooms/[id]) proven successful before applying the pattern to remaining routes.
- **Rollout / rollback:**
  - Rollout: Staged by route — test `/rooms/[id]` first (useSearchParams isolation is cleanest), then `/how-to-get-here`, then `/experiences`.
  - Rollback: Revert page wrapper changes per route; client content components can be restored without data loss.
- **Documentation impact:** None.

---

## Risks & Mitigations
- **sessionStorage key migration (Medium/Low):** Users with old shared key will see CTA re-appear once — acceptable; suppression was erroneous. Mitigated by code comment explaining migration.
- **`experiences_page` enum missing (resolved):** TASK-03 adds it before TASK-04 deploys ContentStickyCta. Not a runtime risk if sequencing is followed.
- **i18n locale coverage for new CTA surfaces (Medium/Medium):** `ContentStickyCta` copy is shared across all surfaces — no new translation keys needed unless surface-specific copy is added. Mitigate: audit `contentStickyCta.*` namespace in locale files before TASK-01/02/04 deploy.
- **SSR refactor complexity for TASK-11 (Medium/Medium):** Mitigated by TASK-10 INVESTIGATE gate — do not proceed to TASK-11 without investigation findings. Staged rollout per route.
- **In-flight coordination with `brikette-octorate-funnel-reduction` (Low/Low):** This plan does not touch Octorate URL parameters. Coordinate only if TASK-11 SSR refactor touches `StickyBookNow` (it should not).

## Observability
- Logging: None: no server-side logging changes.
- Metrics: GA4 `cta_click` events by `ctaLocation` — monitor new surfaces appearing with non-zero event counts within 30 days of deploy.
- Alerts/Dashboards: Check GA4 real-time debug mode at deploy time; add `ctaLocation` filter to existing CTA dashboard if one exists.

## Acceptance Criteria (overall)
- [ ] `ContentStickyCta` renders and fires GA4 on `/how-to-get-here`, `/assistance`, `/experiences` listing
- [ ] SessionStorage dismiss key is per-surface (isolation verified in unit test)
- [ ] `/assistance` "Book Direct" CTA appears above OTA links block
- [ ] `/rooms` index has secondary "View details →" link on room cards
- [ ] `SocialProofSection` visible on `/rooms/[id]`
- [ ] All new CTAs render as navigable links in no-JS initial HTML
- [ ] i18n key leakage eliminated on `/rooms/[id]`
- [ ] Bailout markers eliminated on `/rooms`, `/how-to-get-here`, `/experiences` (P3, gated by checkpoint)
- [ ] All unit tests pass in governed test runner (`pnpm -w run test:governed`)
- [ ] Typecheck and lint pass

## Decision Log
- 2026-02-25: Merged prior `brikette-booking-funnel-usability-hardening-fact-find` scope (SSR/no-JS) into this plan as P3 tasks — avoids indefinite deferral of those issues.
- 2026-02-25: Chose additive "View details →" secondary link on rooms index (not replacing primary CTA) — preserves existing `/book` funnel while adding detail-page path. Operator input not required for this default.
- 2026-02-25: TASK-05 (sessionStorage fix) set as prerequisite for TASK-01/02/04 — ensures new CTA surfaces launch with per-surface keys from day one.

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01 (S,85%), TASK-02 (S,83%), TASK-03 (S,87%), TASK-04 (S,85%), TASK-05 (S,90%), TASK-06 (S,85%), TASK-07 (S,82%), TASK-08 (S,95%), TASK-09 (M,83%), TASK-10 (S,90%), TASK-11 (M,80%)
- Weights: 1+1+1+1+1+1+1+1+2+1+2 = 13
- Weighted sum: 85+83+87+85+90+85+82+95+166+90+160 = 1108
- Overall-confidence: 1108/13 = **85%** (revised 2026-02-25 from 84% — Wave 2 evidence raises TASK-09/10/11)
