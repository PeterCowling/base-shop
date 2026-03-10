# Fact-Find: BRIK book-private-accomodations SEO + Content Regression

```yaml
Status: Ready-for-planning
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Business: BRIK
Dispatch-IDs:
  - IDEA-DISPATCH-20260304143000-0096
  - IDEA-DISPATCH-20260304143000-0097
  - IDEA-DISPATCH-20260304143000-0098
```

## Outcome Contract

- **Why:** The private accommodation booking page is invisible to search engines due to broken meta tags (raw i18n keys rendered) and a noindex directive. The page is the highest-margin conversion path (apartment + double room) and is intended as both a search landing page and booking funnel bridge. Without server-rendered content, heading hierarchy, or structured data, it cannot rank, engage, or convert organic traffic.
- **Intended Outcome:** Page serves correct meta title/description, is indexable, has SSR heading hierarchy and descriptive content, and includes JSON-LD structured data — enabling organic discovery and improving landing page conversion for private accommodation bookings.
- **Source:** operator

## Access Declarations

None — all investigation is codebase-only.

## Summary

Manual staging audit of `8a8586f7.brikette-website.pages.dev/en/book-private-accomodations` on 2026-03-04 revealed 10 issues across three clusters: (A) broken meta tags + noindex regression, (B) SSR content gap with thin landing copy, (C) missing structured data and SEO signals. All stem from the page component at `apps/brikette/src/app/[lang]/book-private-accomodations/page.tsx` and its relationship with the shared `BookPageContent` client component.

## Evidence

### Issue A: Broken Meta Tags + noindex

**Root cause 1 — `isPublished: false` hardcoded:**
- `page.tsx:45` passes `isPublished: false` to `buildAppMetadata()`.
- `metadata.ts:141-146` converts this to `robots: { index: false, follow: true }` → `noindex, follow`.
- The `/book` page has the same pattern (`book/page.tsx:49`), which was a deliberate decision per `docs/plans/brikette-sales-funnel-analysis/artifacts/seo-indexation-matrix.md` — but that matrix only covers `/book`, not `/book-private-accomodations`.
- **Decision needed:** Should this page be indexed? It serves as a landing page for "book private apartment Positano" searches. The `/book` page (all room types) may warrant noindex, but the private-specific page is a targeted landing page.

**Root cause 2 — i18n key fallback rendering raw keys:**
- `page.tsx:26` calls `getTranslations(validLang, ["bookPage"], { optional: true })`.
- `page.tsx:28-29` calls `t("apartment.meta.title")` — the key **does exist** in `locales/en/bookPage.json:49-90` at the correct nested path.
- i18next returns the key string itself when resolution fails (not null/undefined), so the `?? ""` fallback on line 28 never triggers.
- At static export time (`OUTPUT_EXPORT=1`), namespace loading may fail silently due to the `{ optional: true }` flag (`i18n-server.ts:34-35` → `preloadI18nNamespaces` with `optional: true` swallows errors).
- **Hypothesis:** During Cloudflare Pages static build, the bookPage namespace doesn't load (filesystem path mismatch or bundling gap), `optional: true` suppresses the error, and `t()` returns the raw key.
- **Supporting evidence:** The `/book` page has the identical pattern (`book/page.tsx:28-30`) and likely exhibits the same meta tag regression — this is systemic.

**Key files:**
1. `apps/brikette/src/app/[lang]/book-private-accomodations/page.tsx` — the page component (lines 23-47 for metadata, 49-72 for render)
2. `apps/brikette/src/app/_lib/metadata.ts` — `buildAppMetadata()` with `isPublished` gate (line 141)
3. `apps/brikette/src/app/_lib/i18n-server.ts` — `getTranslations()` with optional flag (line 34)
4. `apps/brikette/src/locales/en/bookPage.json` — translation source (lines 49-90 for apartment keys)

### Issue B: SSR Content Gap — Client-Only Render Tree

**Root cause — `BookPageContent` is a client component:**
- `BookPageContent.tsx:1` has `"use client"` directive.
- The page component (`page.tsx:57-63`) wraps it in `<Suspense fallback={null}>`.
- **Everything inside is client-rendered:** H1 heading, subheading, rooms section, FAQ strip, social proof, search panel, recovery section, location info, policies.
- The server HTML contains only: nav shell, `<noscript>` fallback link, footer. Zero content for crawlers.

**What's invisible to crawlers:**
- H1 heading (`BookPageContent.tsx:301` — `<h1>` exists but only in client JS)
- Room listings with features/prices
- FAQ accordion content
- Social proof / testimonials
- Location and policy information

**BookPageStructuredData is also client-only:**
- `BookPageStructuredData.tsx:3` has `"use client"`.
- JSON-LD (hostel schema, FAQ schema, breadcrumb) is injected client-side only.
- Google can execute JS but relies on server-rendered structured data for reliable indexing.

### Issue C: SEO Signals

**C1 — No apartment-specific OG image:**
- `page.tsx:32` uses `/img/facade.avif` (generic hostel exterior).
- Should use an apartment interior/terrace image for social sharing on this landing page.

**C2 — URL misspelling:**
- Route slug is `book-private-accomodations` (one `m`), should be `accommodations` (double `m`).
- Canonical URL propagates the typo: `https://hostel-positano.com/en/book-private-accomodations`.
- Existing redirects in `_redirects` already handle legacy paths → this slug. A rename requires new redirects from old → new.
- `routeInventory.ts:37` hardcodes the slug.

**C3 — hreflang x-default:**
- `seo.ts` **does** emit `x-default` hreflang (lines 199-207). The staging audit reporting it missing may be a rendering issue (client vs server).
- **Revised assessment:** x-default is likely present in the `<head>` — not a real gap.

**C4 — No internal cross-links:**
- Page has zero in-content links to related pages (dorms, experiences, how to get here).
- All navigation is in the header/footer only.

**C5 — Thin landing page content:**
- No intro paragraph describing the apartment (85sqm, full kitchen, 2 bathrooms, sea view, terrace, sleeps up to 4).
- No "why book direct" value proposition (save vs OTA, free breakfast, welcome drink).
- No trust signals visible in server HTML.

## Risks

1. **URL rename blast radius:** Renaming `accomodations` → `accommodations` affects 18 locale routes, `_redirects`, `routeInventory.ts`, and any backlinks/bookmarks. Needs 301 redirects from old → new.
2. **SSR refactor complexity:** Moving content out of the client component into server-rendered sections requires splitting `BookPageContent` or creating a parallel server-rendered content block. The component is deeply interactive (date picker, guest counter, URL state).
3. **Systemic meta regression:** If the bookPage namespace fails at static export, `/book` has the same bug. Fix must address both pages.
4. **`isPublished` flag semantics:** Changing to `true` makes the page indexable. Need to ensure content quality is sufficient before enabling indexing (don't index a broken page).

## Open Questions

1. **[Resolved — recommend YES]** Should `/book-private-accomodations` be indexed? It's a targeted landing page for apartment/private room searches. The generic `/book` may stay noindex, but this page should be indexable once content is adequate.
2. **[Resolved — phased approach]** Should the URL be renamed now or deferred? Recommend renaming with 301 redirect chain, but can be a separate task from the meta/content fixes.
3. **[Resolved — server content block]** How to SSR key content without refactoring BookPageContent? Add a server-rendered content section (intro paragraph, feature highlights, structured data) directly in `page.tsx` above the `<Suspense>` boundary, keeping the interactive booking widget client-side.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Meta tag generation (page.tsx + metadata.ts) | Yes | None | No |
| i18n resolution chain (getTranslations → preload → t()) | Yes | None | No |
| Client/server boundary (BookPageContent "use client") | Yes | None | No |
| SEO helpers (seo.ts buildLinks, hreflang) | Yes | [Minor] x-default actually present | No |
| Redirect chain (_redirects) | Yes | None | No |
| Route registration (routeInventory.ts) | Yes | None | No |
| Structured data (BookPageStructuredData) | Yes | Client-only rendering confirmed | No |
| Content/copy (bookPage.json apartment keys) | Yes | None | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** Three dispatch packets cover all identified issues. The investigation confirms clear root causes for each. No hidden dependencies or unresolvable blockers. Fix scope is bounded to one page component, shared metadata utility, locale data, and redirect config.

## Evidence Gap Review

### Gaps Addressed
- Confirmed i18n keys exist correctly in bookPage.json — the failure is at namespace loading, not key structure.
- Confirmed x-default hreflang is emitted by seo.ts — initial audit finding was incorrect.
- Confirmed BookPageStructuredData exists but is client-only — JSON-LD needs server rendering.

### Confidence Adjustments
- **Meta regression confidence:** HIGH (95%) — root cause clearly identified (isPublished: false + optional namespace loading).
- **SSR gap confidence:** HIGH (95%) — "use client" at component root confirmed.
- **URL rename confidence:** HIGH (90%) — straightforward rename with redirect, bounded blast radius.

### Remaining Assumptions
- Static export namespace loading failure is the cause of raw i18n keys (not verified by reproducing the build — would need `OUTPUT_EXPORT=1 pnpm build` to confirm).
- Apartment-specific images exist in the public assets (need to verify available apartment photos for OG image).
