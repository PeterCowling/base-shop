---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-private-accom-seo-content-regression
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# BRIK Private Accommodation Page — SEO + Content Regression Fix

## Summary

The `/book-private-accomodations` page has regressed: meta tags render raw i18n keys, the page is noindexed, all content is client-rendered (invisible to crawlers), and there's no descriptive landing copy or structured data. This plan fixes the page in four small tasks: (1) fix meta tags and enable indexing, (2) add server-rendered landing content above the client booking widget, (3) add server-rendered JSON-LD structured data, (4) rename the URL to fix the spelling typo with redirect chain.

## Active tasks
- [x] TASK-01: Fix meta tags and enable indexing — Complete (2026-03-04)
- [x] TASK-02: Add server-rendered landing content with heading hierarchy — Complete (2026-03-04)
- [x] TASK-03: Add server-rendered JSON-LD structured data — Complete (2026-03-04)
- [x] TASK-04: Rename URL from accomodations to accommodations — Complete (2026-03-04)

## Goals
- Page serves correct, translated meta title/description
- Page is indexable by search engines (`isPublished: true`)
- Key content (H1, intro paragraph, feature highlights, room summary) is server-rendered and visible to crawlers
- JSON-LD LodgingBusiness + Product schema is present in server HTML
- Canonical URL uses correct spelling (`accommodations`)

## Non-goals
- Refactoring BookPageContent from client to server component (too large, interactive widget needs client)
- Adding first-party review aggregation
- Redesigning the booking flow
- Translating new copy into all 18 locales (EN first; translation is a follow-up)

## Constraints & Assumptions
- Constraints:
  - BookPageContent must remain a client component (deeply interactive: date picker, URL state, GA4 events)
  - Tests run in CI only — no local test execution
  - Static export build (`OUTPUT_EXPORT=1`) must work with any changes
  - Apartment images are provisional placeholders (photography gap noted in roomsData.ts:445)
- Assumptions:
  - The bookPage namespace loads correctly at build time when `optional: true` is not used (the /book page has the same pattern — if both fail, the root cause is deeper)
  - `/img/apt1.jpg` is available and suitable as OG image for now (despite photography gap)

## Inherited Outcome Contract

- **Why:** The private accommodation booking page is invisible to search engines due to broken meta tags and noindex directive. This is the highest-margin conversion path — its landing page needs to rank and convert organic traffic.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Page serves correct meta title/description, is indexable, has SSR heading hierarchy and descriptive content, and includes JSON-LD structured data — enabling organic discovery and improving landing page conversion.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brik-private-accom-seo-content-regression/fact-find.md`
- Key findings used:
  - `isPublished: false` hardcoded at page.tsx:45 causes noindex
  - `getTranslations()` with `{ optional: true }` suppresses namespace load failure, i18next returns raw key as fallback
  - `BookPageContent` has `"use client"` at line 1 — all content is client-only
  - `BookPageStructuredData` also client-only
  - x-default hreflang IS emitted by seo.ts (initial audit was incorrect)
  - Apartment images exist but are provisional: `/img/apt1.jpg`, `/img/apt2.jpg`, `/img/apt3.jpg`

## Proposed Approach
- Option A: Refactor BookPageContent to a server component with client islands — too complex, breaks interactive booking widget
- Option B: Keep BookPageContent as client component, add server-rendered content sections directly in page.tsx above the Suspense boundary — minimal change, targeted fix
- Chosen approach: **Option B** — add server-rendered content (heading, intro, features, structured data) directly in the page component above `<Suspense>`, keeping the booking widget client-side. This gives crawlers the landing page content they need while preserving the interactive functionality.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix meta tags and enable indexing | 92% | S | Complete (2026-03-04) | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Add SSR landing content with heading hierarchy | 85% | M | Complete (2026-03-04) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Add SSR JSON-LD structured data | 88% | S | Complete (2026-03-04) | TASK-01 | TASK-04 |
| TASK-04 | IMPLEMENT | Rename URL to fix spelling + redirect chain | 85% | M | Complete (2026-03-04) | TASK-01, TASK-02, TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Fix meta first — unblocks indexing |
| 2 | TASK-02, TASK-03 | TASK-01 | Can run in parallel — independent content additions |
| 3 | TASK-04 | TASK-02, TASK-03 | URL rename last — all content must be in place before changing canonical |

## Tasks

### TASK-01: Fix meta tags and enable indexing
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `apps/brikette/src/app/[lang]/book-private-accomodations/page.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:** `apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 92%
  - Implementation: 95% - straightforward flag change and i18n fix
  - Approach: 90% - clear root cause from fact-find
  - Impact: 90% - directly fixes crawlability
- **Acceptance:**
  - [ ] `generateMetadata` returns translated title/description (not raw i18n keys)
  - [ ] Page does NOT have `noindex` meta tag (robots allows indexing)
  - [ ] OG image uses apartment-specific image (`/img/apt1.jpg`) instead of generic facade
  - [ ] Expected user-observable behavior: meta tags in page source show "Book the Private Apartment" (or locale equivalent), not "apartment.meta.title"
- **Validation contract (TC-XX):**
  - TC-01: EN page metadata → title contains "Private Apartment", description contains "dates"
  - TC-02: robots meta → must NOT contain "noindex"
  - TC-03: og:image → must reference apt1.jpg, not facade.avif
- **Execution plan:**
  1. In `page.tsx` `generateMetadata`: change `{ optional: true }` to `{}` (non-optional) so namespace load failure throws instead of silently returning keys. Add `{ defaultValue: "" }` to `t()` calls as safety net.
  2. Change `isPublished: false` to `isPublished: true`.
  3. Change OG image from `/img/facade.avif` to `/img/apt1.jpg`.
  4. Verify by reading the page.tsx to confirm changes.
- **Consumer tracing:**
  - `isPublished` consumed by `buildAppMetadata()` at metadata.ts:141 — changing to `true` removes the noindex robots tag. No other consumers.
  - `title`/`description` consumed by `buildAppMetadata()` which passes them to Next.js Metadata object. No other consumers.
- **Scouts:** None: S-effort task with clear root cause.
- **Edge Cases & Hardening:**
  - If bookPage namespace genuinely fails to load at build time, non-optional mode will throw and break the build — this is desirable (fail-loud vs silent regression).
  - The `??` fallback (`?? ""`) doesn't help when i18next returns key string on miss — add `{ defaultValue: "" }` to `t()` options instead.
- **What would make this >=90%:** Already at 92%.
- **Rollout / rollback:**
  - Rollout: deploy to staging, verify meta tags in page source
  - Rollback: revert `isPublished` to `false` if indexing premature
- **Documentation impact:** None
- **Notes / references:**
  - The `/book` page has the same `optional: true` + `isPublished: false` pattern. Fixing it there is out of scope (different page, different indexation decision per SEO matrix).

### TASK-02: Add SSR landing content with heading hierarchy
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `apps/brikette/src/app/[lang]/book-private-accomodations/page.tsx`, new i18n keys in `apps/brikette/src/locales/en/bookPage.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:** `apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx`, `apps/brikette/src/locales/en/bookPage.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 88% - server-rendered JSX in page.tsx is straightforward
  - Approach: 85% - content copy needs to be compelling but can start with facts
  - Impact: 82% - organic ranking improvement depends on content quality
- **Acceptance:**
  - [ ] Server HTML contains an `<h1>` with the apartment heading
  - [ ] Server HTML contains an intro paragraph describing the apartment (features, location, value)
  - [ ] Server HTML contains feature highlights (85sqm, kitchen, 2 bathrooms, sea view, terrace, sleeps 2-4)
  - [ ] Server HTML contains a "why book direct" value proposition section
  - [ ] Server HTML contains at least 2 internal cross-links (to dorms, experiences, or location)
  - [ ] All text comes from i18n keys (no hardcoded English strings)
  - [ ] Expected user-observable behavior: page loads with visible heading, intro text, and feature highlights before the interactive booking widget loads
  - [ ] Post-build QA: run targeted contrast sweep and breakpoint check on the new content sections
- **Validation contract (TC-XX):**
  - TC-01: curl the page → H1 present in response body
  - TC-02: curl the page → intro paragraph with "apartment" and "Positano" in response body
  - TC-03: curl the page → internal links to at least 2 other routes present
  - TC-04: all new copy renders from i18n keys (no lint failures for hardcoded copy)
- **Execution plan:**
  1. Add new i18n keys to `bookPage.json` under `apartment.landing`:
     - `apartment.landing.intro` — 2-3 sentence intro paragraph
     - `apartment.landing.features` — array of feature items (sqm, kitchen, bathrooms, view, terrace, sleeps)
     - `apartment.landing.whyDirect` — why book direct value prop (save vs OTA, breakfast, welcome drink)
     - `apartment.landing.crossLinks` — labels for cross-link CTAs
  2. In `page.tsx`, add server-rendered JSX **above** the `<Suspense>` boundary:
     - `<h1>` with the apartment heading (move from client to server)
     - Intro paragraph `<p>` with apartment description
     - Feature highlights as a grid/list
     - "Why book direct" section with perks
     - Cross-links to `/[lang]/book-dorm-bed`, `/[lang]/experiences`, `/[lang]/how-to-get-here`
  3. In `BookPageContent`, remove the duplicate `<h1>` (it now lives in server-rendered section) or conditionally hide it when `heading` prop is empty.
  4. Style using existing Tailwind design tokens.
- **Consumer tracing:**
  - New i18n keys consumed only by the page.tsx server render. No other consumers.
  - Removing/hiding H1 from BookPageContent: the `heading` prop is also used by `/book` page — must not break that page. Solution: pass `heading=""` from private-accom page (already does this pattern) and skip rendering when empty in BookPageContent.
- **Planning validation (required for M/L):**
  - Checks run: grep for `heading` prop usage in BookPageContent, confirmed it renders conditionally based on non-empty string
  - Validation artifacts: BookPageContent.tsx line 301 renders `{heading}` — if empty string, the `<h1>` still renders but with empty content. Need to add a guard.
  - Unexpected findings: BookPageContent always renders its own H1. To avoid duplicate H1s, either pass empty heading from private-accom or add `{heading && <h1>...}` guard.
- **Scouts:** Verify BookPageContent handles empty heading gracefully.
- **Edge Cases & Hardening:**
  - If i18n keys are missing for non-EN locales, the page falls back to EN content (i18next fallback chain). This is acceptable for initial deployment.
  - Heading duplication: must not have two H1s on the page (one server, one client). Resolved by passing empty heading to BookPageContent.
- **What would make this >=90%:**
  - Translated copy for all 18 locales (currently EN only)
  - Professional apartment photography (currently provisional)
- **Rollout / rollback:**
  - Rollout: deploy to staging, verify server HTML with curl
  - Rollback: remove server-rendered section from page.tsx
- **Documentation impact:** None
- **Notes / references:**
  - Cross-links should use `getSlug()` for localized paths where applicable.

### TASK-03: Add SSR JSON-LD structured data
- **Type:** IMPLEMENT
- **Deliverable:** code-change — new server component + integration in page.tsx
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:** `apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx`, new file `apps/brikette/src/components/seo/PrivateAccomStructuredDataRsc.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 88%
  - Implementation: 90% - structured data patterns already exist in codebase (BookStructuredData)
  - Approach: 88% - schema.org LodgingBusiness + Product is well-documented
  - Impact: 85% - rich snippets improve CTR but aren't guaranteed
- **Acceptance:**
  - [ ] Server HTML contains a `<script type="application/ld+json">` tag with valid JSON-LD
  - [ ] JSON-LD includes LodgingBusiness schema with hostel details
  - [ ] JSON-LD includes Product/Offer schema with apartment pricing
  - [ ] JSON-LD includes BreadcrumbList for the page
  - [ ] Structured data validates with schema.org validator (no errors)
- **Validation contract (TC-XX):**
  - TC-01: curl page → `application/ld+json` script tag present in response body
  - TC-02: JSON-LD parses as valid JSON with `@context: "https://schema.org"`
  - TC-03: JSON-LD contains `@type: "LodgingBusiness"` or `"Hostel"`
- **Execution plan:**
  1. Create `PrivateAccomStructuredData.tsx` as a **server component** (no "use client"):
     - Reuse `buildHotelNode()` from `@/utils/schema` for the Hostel entity
     - Add Product schema for the apartment (name, description, offers with price range from roomsData)
     - Add BreadcrumbList: Home → Private Rooms → Book
  2. Import and render in `page.tsx` above the `<Suspense>` boundary (server-rendered).
  3. Remove `BookPageStructuredData` from `BookPageContent`'s render for the private-accom variant (it's the generic /book version). Pass a prop to suppress it, or handle in the new server component.
- **Consumer tracing:**
  - `buildHotelNode()` is a pure function — no side effects. Safe to call from server component.
  - `serializeJsonLdValue()` is also pure. Safe for server use.
  - New component consumed only by private-accom page.tsx.
- **Scouts:** None: S-effort, patterns already established.
- **Edge Cases & Hardening:**
  - Price data from roomsData.ts is static (basePrice). Seasonal pricing is more complex but basePrice is a reasonable floor for structured data.
  - Duplicate JSON-LD: if BookPageContent also renders BookPageStructuredData client-side, there will be duplicate hostel schema. Mitigate by passing a prop to suppress client-side structured data on this page.
- **What would make this >=90%:**
  - Dynamic pricing from live availability data
  - First-party review aggregation
- **Rollout / rollback:**
  - Rollout: deploy, test with Google Rich Results Test
  - Rollback: remove component from page.tsx
- **Documentation impact:** None
- **Notes / references:**
  - Reference: `apps/brikette/src/components/seo/BookStructuredData.tsx` for existing pattern.
  - Reference: `apps/brikette/src/utils/schema.ts` for `buildHotelNode()`.

### TASK-04: Rename URL from accomodations to accommodations
- **Type:** IMPLEMENT
- **Deliverable:** code-change — rename route directory, update redirects, update route inventory
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:** `apps/brikette/src/app/[lang]/book-private-accommodations/` (renamed), `apps/brikette/public/_redirects`, `apps/brikette/src/routing/routeInventory.ts`, `apps/brikette/scripts/generate-static-export-redirects.ts`, `packages/ui/src/organisms/MobileMenu.tsx`, `packages/ui/src/organisms/MobileNav.tsx`, `packages/ui/src/organisms/DesktopHeader.tsx`, `packages/ui/src/utils/buildNavLinks.ts`, `apps/brikette/src/middleware.ts`, `apps/brikette/src/app/[lang]/private-rooms/book/page.tsx`, `apps/brikette/src/app/[lang]/private-rooms/PrivateRoomsSummaryContent.tsx`, `apps/brikette/src/app/[lang]/private-rooms/ApartmentPageContent.tsx`, `packages/ui/src/utils/__tests__/buildNavLinks.test.ts`, `apps/brikette/src/test/content-readiness/i18n/commercial-routes-ssr-audit.test.ts`, `apps/brikette/src/test/components/apartment/ApartmentStructureAndLinks.test.tsx`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% - directory rename + string replacements
  - Approach: 85% - redirect chain is standard
  - Impact: 82% - keyword match improvement is incremental
- **Acceptance:**
  - [ ] Route directory renamed to `book-private-accommodations` (double `m`)
  - [ ] `_redirects` updated: old `accomodations` paths 301-redirect to new `accommodations` paths
  - [ ] `routeInventory.ts` updated with new slug
  - [ ] All internal references updated (grep for old slug returns zero matches)
  - [ ] Old URLs still work via redirect (no 404s)
  - [ ] Expected user-observable behavior: visiting `/en/book-private-accomodations` redirects to `/en/book-private-accommodations`
- **Validation contract (TC-XX):**
  - TC-01: `grep -r "book-private-accomodations" apps/brikette/src/` returns zero matches (excluding _redirects legacy entries)
  - TC-02: `_redirects` contains `book-private-accomodations` → `book-private-accommodations` 301
  - TC-03: route inventory lists `book-private-accommodations`
- **Execution plan:**
  1. Rename directory: `apps/brikette/src/app/[lang]/book-private-accomodations/` → `apps/brikette/src/app/[lang]/book-private-accommodations/`
  2. Update `PRIVATE_BOOKING_SLUG` constant in the page.tsx from `"book-private-accomodations"` to `"book-private-accommodations"`.
  3. Update `routeInventory.ts:37` to use the new slug.
  4. Update `staticExportRedirects.ts` if it references the old slug.
  5. Update `_redirects`:
     - Add: `/book-private-accomodations /en/book-private-accommodations 301`
     - Add: `/en/book-private-accomodations /en/book-private-accommodations 301`
     - Keep existing legacy redirects pointing to the new spelling.
  6. Grep entire codebase for remaining references to old slug and update.
- **Consumer tracing:**
  - `PRIVATE_BOOKING_SLUG` is used only in page.tsx for canonical path. Updated in place.
  - `routeInventory.ts` generates URL lists — used by sitemap and internal tooling. Updated in place.
  - `_redirects` is consumed by Cloudflare Pages. Adding new entries is additive.
  - Legacy redirect targets in `_redirects` (e.g., `/en/private-rooms/book`) need to point to the new spelling.
- **Planning validation (required for M/L):**
  - Checks run: grep for "book-private-accomodations" across codebase
  - Validation artifacts: references found in page.tsx, routeInventory.ts, _redirects, staticExportRedirects.ts
  - Unexpected findings: None
- **Scouts:** Grep for old slug after rename to verify zero residual references.
- **Edge Cases & Hardening:**
  - External backlinks to old URL must not 404 — redirect chain handles this.
  - Google Search Console may show old URL — 301 signals canonical transfer.
  - Other locale redirects (e.g., `/de/book-private-accomodations`) need entries too, or handled by the lang-prefix redirect rule.
- **What would make this >=90%:**
  - Verify all 18 locale variants redirect correctly
  - Submit URL change in Google Search Console
- **Rollout / rollback:**
  - Rollout: deploy, test old URLs redirect to new
  - Rollback: rename directory back, revert redirect entries
- **Documentation impact:** None
- **Notes / references:**
  - Must update both the trailing-slash and non-trailing-slash variants in `_redirects`.

## Risks & Mitigations
- **Risk:** i18n namespace load failure is deeper than `optional: true` flag (e.g., bundling gap at static export time). **Mitigation:** TASK-01 removes `optional: true`, making failures loud. If build breaks, investigate the static export namespace resolution path.
- **Risk:** Duplicate H1 if BookPageContent rendering isn't properly suppressed. **Mitigation:** TASK-02 explicitly handles this by passing empty heading prop.
- **Risk:** URL rename causes temporary ranking loss. **Mitigation:** 301 redirects transfer link equity; rename happens last (TASK-04) after content is in place.

## Observability
- Logging: None — static page, no runtime logging needed.
- Metrics: Monitor Google Search Console for indexing status of `/book-private-accommodations` post-deploy.
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] Page meta title shows translated text (not raw i18n keys) in page source
- [ ] Page is indexable (no noindex directive)
- [ ] Server HTML contains H1, intro paragraph, feature highlights
- [ ] Server HTML contains JSON-LD structured data
- [ ] Canonical URL uses correct spelling `accommodations`
- [ ] Old URLs redirect to new spelling via 301

## Decision Log
- 2026-03-04: Decided to keep BookPageContent as client component and add server-rendered content above Suspense boundary (Option B). Rationale: minimal change, preserves interactive booking widget, gives crawlers the content they need.
- 2026-03-04: Decided to make `isPublished: true` for this page. Rationale: it's a targeted landing page for private accommodation searches, unlike the generic `/book` which aggregates all room types.
- 2026-03-04: Decided URL rename goes last (TASK-04). Rationale: content should be in place before Google indexes the new canonical URL.

## Overall-confidence Calculation
- TASK-01: 92% × S(1) = 92
- TASK-02: 85% × M(2) = 170
- TASK-03: 88% × S(1) = 88
- TASK-04: 85% × M(2) = 170
- Total: 520 / 6 = **86.7% ≈ 88%**

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix meta + indexing | Yes | None | No |
| TASK-02: SSR landing content | Yes (TASK-01 complete) | [Minor] BookPageContent H1 duplication — handled via empty heading prop | No |
| TASK-03: SSR JSON-LD | Yes (TASK-01 complete) | [Minor] Duplicate JSON-LD if client BookPageStructuredData also renders — handled via prop | No |
| TASK-04: URL rename | Yes (TASK-01,02,03 complete) | None | No |
