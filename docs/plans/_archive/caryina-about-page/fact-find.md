---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: SELL
Workstream: Mixed
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: caryina-about-page
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Dispatch-ID: IDEA-DISPATCH-20260314180008-HBAG-009
---

# Caryina About Page Fact-Find Brief

## Scope

### Summary

Caryina's primary brand claim — "Designed in Positano, Italy" — appears on every page (homepage eyebrow, product cards, footer) but has no supporting page behind it. Visitors who respond to the provenance claim and want to know more hit a dead end: the company identity only surfaces in legal copy (support page). An About page would give the origin story a home, substantiate the claim, and differentiate Caryina from generic dropshippers. This requires: a new `/about` route (code), i18n content for en/de/it (business artifact), nav/footer link additions (code), and sitemap update (code).

### Goals

- Add `/[lang]/about` route serving a short brand story page in all three locales (en/de/it)
- Add About to header nav and/or site footer so the page is discoverable
- Draft brand story copy from existing strategy documents; mark photographer/image decisions as PLACEHOLDER
- Update sitemap.ts to include `/about` in all locales
- Content should be consistent with the brand voice: conversational, confident, no hard sell, whitespace-first

### Non-goals

- Full brand redesign or visual overhaul
- Custom photography shoot (images will be PLACEHOLDER)
- Deep founder biography or press-style page
- Adding the About page to the checkout/cart flow chrome

### Constraints & Assumptions

- Constraints:
  - All existing locales (en, de, it) should be served from day one — `generateStaticParams` emits en/de/it independently of page content so missing About translations are a content-quality gap, not a build failure; `localizedText()` falls back to English. Full de/it translations in the same build is preferred but not a hard blocker.
  - Content must follow the contentPacket.ts / `data/shops/caryina/site-content.generated.json` architecture — no inline string literals in page.tsx
  - Only one JSON copy exists: `data/shops/caryina/site-content.generated.json`; `apps/caryina/data/shops/caryina/` does not exist
  - Brand voice constraints from dossier: no hard selling, whitespace-first, conversational, short sentences
  - "Made in Italy" cannot be claimed (Italian Law 166/2009 + EU consumer law) — only "Designed in Italy" / "Designed in Positano, Italy" is legally defensible
  - Photography/hero image is operator's call — build will use PLACEHOLDER
- Assumptions:
  - About page link goes in both header nav and footer (standard for small DTC brands)
  - Story can be drafted in full from existing strategy documents; content does NOT require operator input before build proceeds
  - i18n (de/it translations) can be machine-assisted from en copy in the same build cycle; `LocalizedText` accepts `de?`/`it?` as optional so missing translations degrade gracefully to English — full de/it in one build is preferred but not a hard requirement
  - No server-side data fetching needed beyond the existing contentPacket pattern

## Outcome Contract

- **Why:** The "Designed in Positano" claim is the heart of Caryina's brand. Without an About page, the claim feels thin and unsubstantiated. A short brand story reinforces trust and differentiates from generic dropshippers.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Brand story page live at `/about` in all three locales, linked from header nav and site footer, with copy derived from the strategy dossier and placeholder image slot ready for operator-supplied photography.
- **Source:** operator

## Current Process Map

None: local code path only. This is a net-new static content page. There is no existing operator runbook, approval path, or multi-step process being altered. The change adds a new route to the site content catalogue.

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/app/[lang]/about/` — does not exist yet
- `apps/caryina/src/app/[lang]/support/page.tsx` — closest equivalent (content page pattern)
- `apps/caryina/src/app/[lang]/layout.tsx` — locale layout wrapper (Header + SiteFooter + ConsentBanner)
- `apps/caryina/src/components/Header.tsx` — nav with "Shop" + "Support" links only
- `apps/caryina/src/components/SiteFooter.tsx` — footer links list

### Key Modules / Files

- `apps/caryina/src/lib/contentPacket.ts` — defines `SiteContentPayload` interface + accessor exports; About section and chrome nav labels must be added here
- `data/shops/caryina/site-content.generated.json` — sole content store; `contentPacket.ts` resolves this as the single authoritative copy (`apps/caryina/data/shops/caryina/` does not exist in the current tree)
- `apps/caryina/src/app/sitemap.ts` — `STATIC_PATHS` array; `/about` must be added
- `docs/business-os/strategy/HBAG/assessment/2026-02-21-brand-profile.user.md` — positioning, legal origin claim, aesthetic constraints
- `docs/business-os/strategy/HBAG/assessment/2026-02-21-brand-identity-dossier.user.md` — brand personality, writing style, color/type tokens
- `docs/business-os/strategy/HBAG/assessment/2026-02-20-operator-context.user.md` — operator role (Pete designs and curates from Positano, Italy)

### Patterns & Conventions Observed

- Content page pattern: `generateMetadata()` resolves locale, fetches localized content, returns title/description/keywords — evidence: `apps/caryina/src/app/[lang]/support/page.tsx`
- Content externalization: all copy in `site-content.generated.json`, accessed via typed accessors in `contentPacket.ts` — evidence: `apps/caryina/src/lib/contentPacket.ts:108-113`
- Localization: `LocalizedText` type `{ en: string; de?: string; it?: string }` (de/it are optional; `localizedText()` falls back to en when absent) — evidence: `contentPacket.ts`
- Route segments: `apps/caryina/src/app/[lang]/[route]/page.tsx` async server components — evidence: all existing routes
- `max-w-3xl rounded-lg border p-6 text-sm text-muted-foreground` — standard content section card class — evidence: `support/page.tsx`

### Data & Contracts

- Types/schemas/events:
  - `SiteContentPayload` in `contentPacket.ts` must gain an `about` key with fields: `title: LocalizedText`, `eyebrow: LocalizedText`, `body: LocalizedText[]`, `heroAlt: LocalizedText`
  - `CHROME_DEFAULTS` in `contentPacket.ts:408` is the authoritative source for header/footer nav microcopy. The comment at line 404-407 explicitly states: "do NOT add a `chrome` key to `site-content.generated.json`". About nav labels (`header.about`, `footer.about`) must be added directly to `CHROME_DEFAULTS` in TypeScript — not to the JSON file.
- Persistence:
  - One JSON copy updated: `data/shops/caryina/site-content.generated.json` — there is no second app-local copy (`apps/caryina/data/shops/caryina/` does not exist)
  - `CHROME_DEFAULTS` in `contentPacket.ts` updated to add About nav labels in TypeScript
  - `contentPacket.ts` updated to add `getAboutContent(lang: Locale)` accessor
- API/contracts:
  - No API changes; About page is server-rendered static content using the same Next.js App Router pattern as all other content pages

### Dependency & Impact Map

- Upstream dependencies:
  - `apps/caryina/src/lib/contentPacket.ts` — must be extended before page.tsx can be written; `CHROME_DEFAULTS` and `SiteContentPayload` both require additions
  - `data/shops/caryina/site-content.generated.json` — single copy; must be updated with About content section
- Downstream dependents:
  - `apps/caryina/src/app/sitemap.ts` — must add `/about` to STATIC_PATHS
  - `apps/caryina/src/components/Header.tsx` — must add About nav link
  - `apps/caryina/src/components/SiteFooter.tsx` — may add About footer link
  - Existing tests snapshot for `Header.tsx` if one exists — check and update
- Likely blast radius:
  - Low — isolated new route + content schema extension; no existing routes modified structurally
  - Header nav addition touches a shared component but is purely additive (new `<Link>`)

### Delivery & Channel Landscape

- Audience/recipient: shoppers who clicked the "Designed in Positano, Italy" hook and want to know more
- Channel constraints: web only; accessible via `/[lang]/about` in all 3 locales
- Existing templates/assets: support/page.tsx is the reference template to follow
- Approvals/owners: operator (Pete) to confirm hero image slot content; copy can be generated from dossier
- Compliance constraints: "Designed in Positano, Italy" only — "Made in Italy" is legally prohibited (Italian Law 166/2009)
- Measurement hooks: no new instrumentation needed for MVP; existing GA4 page-view tracking covers /about

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/component), Next.js server component rendering (integration)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/caryina/jest.config.cjs --testPathPattern=<pattern> --no-coverage`
- CI integration: per `docs/testing-policy.md`, tests run in CI only — no local Jest execution

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| contentPacket | Unit | `apps/caryina/src/lib/contentPacket.test.ts` | Tests `getSupportContent`, `getShippingContent`, etc. — new `getAboutContent` needs a parallel test |
| Support page | Component | `apps/caryina/src/app/[lang]/support/page.test.tsx` | Reference for About page test structure |
| Sitemap | None — no existing sitemap test file found | — | No `routeInventory.seo.test.ts` exists in the tree; if sitemap test coverage is desired, a new file is required |
| Header/Footer | None identified | — | No snapshot or render test found for Header.tsx or SiteFooter.tsx |

#### Coverage Gaps

- Untested paths:
  - New `getAboutContent()` accessor (unit test required, following contentPacket.test.ts pattern)
  - New About page render (component test required, following support/page.test.tsx pattern)
  - Sitemap STATIC_PATHS update has no existing test file — if sitemap test coverage is wanted, a new test file must be created (out of scope for this build unless explicitly added)
- Extinct tests:
  - None identified for this scope

#### Recommended Test Approach

- Unit tests for: `getAboutContent(lang)` — all three locales return non-empty title and body fields
- Integration tests for: About page renders expected heading in each locale (follow support/page.test.tsx)
- E2E tests for: none required for MVP
- Contract tests for: none required

### Recent Git History (Targeted)

- `apps/caryina/src/app/[lang]/*` — recent additions: cookie-policy, returns-request form (this session); established stable pattern for content pages
- `apps/caryina/src/lib/contentPacket.ts` — extended with returns content this session; safe to extend further

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | Support page provides exact template: `max-w-3xl rounded-lg border p-6`; brand tokens established | About needs a hero element (image placeholder) not in current support pattern | Add hero slot with PLACEHOLDER `<div>` + TODO comment |
| UX / states | Required | Content pages have no loading/error states — static content resolved at SSR | No edge cases; if locale param is invalid, `resolveLocale` falls back to `en` | No new states needed |
| Security / privacy | N/A | Static content page; no user input, no auth, no PII processing | None | — |
| Logging / observability / audit | N/A | GA4 page-view tracking already active via layout; no custom events needed | None | — |
| Testing / validation | Required | `contentPacket.test.ts` pattern established; `support/page.test.tsx` is the reference; no existing sitemap test file in the Caryina app | New accessor test + page render test; sitemap test does not exist — out of scope unless explicitly added | Two test files to write |
| Data / contracts | Required | `SiteContentPayload` interface in contentPacket.ts; `CHROME_DEFAULTS` for nav microcopy; single JSON copy at `data/shops/caryina/site-content.generated.json` | `CHROME_DEFAULTS` must be updated in TypeScript (not JSON) for nav labels; JSON must be updated for About page content section | One JSON file + one TypeScript constant block to update |
| Performance / reliability | N/A | Static server component; no data fetching; Next.js caches by default | None | — |
| Rollout / rollback | Required | Cloudflare Pages deploy; static export; About route is purely additive — rollback is removing the directory commit | No risk; new route with no dependencies on existing routes | Rollback = revert commit |

## Questions

### Resolved

- Q: Does brand story content exist in the repository to draft About copy without operator input?
  - A: Yes — full brand dossier at `docs/business-os/strategy/HBAG/assessment/2026-02-21-brand-profile.user.md` and `2026-02-20-operator-context.user.md` provide: operator role (Pete designs and curates from Positano), legal origin claim ("Designed in Positano, Italy" — "Made in Italy" prohibited), brand personality (sophisticated, curated, feminine), and writing style (conversational, short sentences, no hard sell). Copy can be drafted in full without blocking on operator.
  - Evidence: `docs/business-os/strategy/HBAG/assessment/2026-02-20-operator-context.user.md:34-35`, `2026-02-21-brand-profile.user.md:116-118`

- Q: Should About go in header nav or footer only?
  - A: Both. Header nav for discovery (customers who are undecided benefit from a trust signal before committing); footer for reference (repeat visitors). The brand aesthetic constraint is "fewer CTAs, more editorial" — adding one About link to the header alongside Shop + Support is additive without overwhelming. Three items is a very common and uncluttered small-brand nav pattern.
  - Evidence: `apps/caryina/src/components/Header.tsx` current 2-item nav; brand aesthetic constraint from `2026-02-21-brand-identity-dossier.user.md:138-141`

- Q: Does the existing contentPacket architecture support adding a new section?
  - A: Yes — `SiteContentPayload` is a plain TypeScript interface; adding an `about` key follows the same pattern as existing `support`, `shop`, `home` sections. JSON must be updated alongside the interface.
  - Evidence: `apps/caryina/src/lib/contentPacket.ts:31-105`

- Q: Should i18n (de/it) be done in the same build or deferred?
  - A: Same build is preferred. `LocalizedText` makes `de`/`it` optional and `localizedText()` falls back to en, so missing translations degrade gracefully — but shipping all three locales together avoids a noticeable English fallback on the German and Italian site variants. Machine-assisted translation from en is the established pattern; the live JSON already has many fields with only `en` populated, confirming the fallback is production-safe.
  - Evidence: `apps/caryina/src/lib/contentPacket.ts` — `LocalizedText` type; `data/shops/caryina/site-content.generated.json` — some fields have only `en`

### Open (Operator Input Required)

- Q: What hero image or visual element should appear on the About page?
  - Why operator input is required: The build can produce a PLACEHOLDER `<div>` with a TODO comment, but the actual image (photo of Pete in Positano? Product editorial shot? No hero at all?) requires creative direction the dossier doesn't specify for this specific page.
  - Decision impacted: Whether the page template needs an `<Image>` component with `src` from content JSON, or just a plain editorial text layout.
  - Decision owner: Pete (operator)
  - Default assumption: Build uses text-only layout with a `{/* TODO: PLACEHOLDER — operator to supply hero image before scaling */}` comment in the JSX. The outcome contract phrase "placeholder image slot ready" refers to this TODO comment, not a rendered `<Image>` component. This is safe for launch — many small brand About pages are text-only at launch.

## Confidence Inputs

- Implementation: 92% — Pattern is clear, all dependencies are identified, single JSON copy path confirmed. Hero image decision is resolved by defaulting to text-only with TODO comment (no unresolvable blockers).
- Approach: 88% — Content can be drafted from dossier; standard About page pattern well understood; route addition is purely additive.
- Impact: 80% — Directly addresses the "Designed in Positano" substantiation gap; trust signal for undecided visitors. Hard to predict uplift in conversion but qualitative impact on brand credibility is clear.
- Delivery-Readiness: 90% — All evidence gathered, all implementation paths clear, content source exists.
- Testability: 85% — New accessor, page render, and sitemap test all follow established patterns. Test seams already exist.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| JSON content and CHROME_DEFAULTS drift out of sync | Low | Low — a mismatched interface type at compile time would be caught by TypeScript | TypeScript interface must be updated alongside JSON and CHROME_DEFAULTS in the same commit; typecheck gate enforces this |
| "Made in Italy" language creeps into copy | Low | High — legal liability under Italian Law 166/2009 | Hard rule in plan: all copy must say "Designed in Positano" or "Designed in Italy" only; copycheck in task |
| Header nav with 3 items feels cluttered on narrow screen | Low | Low — header already hides nav on mobile (sm:flex) | No mitigation needed; mobile sees hamburger/icon nav anyway |
| i18n copy quality (de/it) | Medium | Low — fallback to en if machine translation is poor | PLACEHOLDER comment on de/it sections noting operator review is recommended before production |
| Sitemap not updated | Low | Low — SEO lag only | Explicitly in task scope: update `STATIC_PATHS` in `sitemap.ts` |

## Planning Constraints & Notes

- Must-follow patterns:
  - All page copy in `data/shops/caryina/site-content.generated.json`; chrome/nav microcopy in `CHROME_DEFAULTS` (TypeScript); never inline strings in page.tsx
  - Single JSON file: `data/shops/caryina/site-content.generated.json` — no second app-local copy exists
  - TypeScript interface in `contentPacket.ts` must match JSON shape before `getAboutContent()` is typed
  - "Designed in Positano, Italy" only — never "Made in Italy"
  - Brand writing style: conversational, ≤2-sentence paragraphs, no hard sell, no buzzwords
- Rollout/rollback expectations:
  - Purely additive route — rollback is reverting the commit; no migration or data change needed
- Observability expectations:
  - No new instrumentation; GA4 page-view covers /about automatically

## Suggested Task Seeds (Non-binding)

1. **IMPLEMENT** — Add `about` section to `data/shops/caryina/site-content.generated.json` and add `getAboutContent(lang)` accessor + `AboutContent` type to `contentPacket.ts`; update `SiteContentPayload` interface; include en/de/it copy drafted from strategy dossier
2. **IMPLEMENT** — Create `apps/caryina/src/app/[lang]/about/page.tsx` following `support/page.tsx` pattern; text-only layout with brand story sections; add `generateMetadata()` with title/description/keywords
3. **IMPLEMENT** — Add About link to `Header.tsx` nav (alongside Shop + Support) and add About to `SiteFooter.tsx` links; update `CHROME_DEFAULTS` in `contentPacket.ts` to include `header.about` and `footer.about` nav labels in all 3 locales (TypeScript constant, not JSON)
4. **IMPLEMENT** — Add `/about` to `STATIC_PATHS` in `apps/caryina/src/app/sitemap.ts`
5. **IMPLEMENT** — Write tests: `getAboutContent` unit test (all 3 locales following contentPacket.test.ts pattern), About page render test (follows `support/page.test.tsx`)

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `/en/about`, `/de/about`, `/it/about` all render with non-empty heading and body
  - About link visible in Header nav and SiteFooter
  - `/about` present in sitemap response
  - `getAboutContent()` unit test passes for all 3 locales
  - TypeScript typecheck passes (no new errors)
- Post-delivery measurement plan:
  - GA4 page-views on `/*/about` after deploy (no custom event needed)
  - Operator reviews de/it translations before production traffic ramps up

## Evidence Gap Review

### Gaps Addressed

- Brand story source material: fully resolved via strategy dossier; no operator input needed to draft copy
- Hero image decision: resolved by defaulting to text-only layout with PLACEHOLDER comment
- JSON copy topology: confirmed only one copy exists at `data/shops/caryina/site-content.generated.json`; `apps/caryina/data/shops/caryina/` does not exist — no dual-copy complexity
- Chrome/nav microcopy source: confirmed `CHROME_DEFAULTS` in `contentPacket.ts:408` is the authoritative source; JSON must not be used for nav labels
- Nav placement: resolved (header + footer, 3-item nav is standard for small DTC brand)
- Locale build-failure concern: resolved — missing de/it About content is a quality gap, not a build failure; `localizedText()` falls back to en; `generateStaticParams` emits all 3 locales regardless

### Confidence Adjustments

- Implementation 92%: raised from initial 80% after confirming both JSON paths, the `SiteContentPayload` extension pattern, and that strategy docs contain sufficient copy material
- Approach 88%: raised from 75% after confirming `support/page.tsx` template is a direct fit

### Remaining Assumptions

- Machine-assisted de/it translations are acceptable for launch (operator will review pre-scaling)
- Text-only layout (no hero image) is acceptable for MVP About page
- Three-item header nav (Shop / About / Support) is preferred over footer-only placement

## Scope Signal

Signal: right-sized
Rationale: One new static route, four supporting code changes (contentPacket, header, footer, sitemap), and five tests. All implementation paths are clear and directly evidenced. Content source exists. No architectural decisions, no external dependencies, no research gaps.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| New route creation pattern | Yes | None | No |
| contentPacket.ts extension | Yes | Single JSON copy confirmed; CHROME_DEFAULTS is the source for nav labels (not JSON) | No |
| Header nav addition | Yes | None | No |
| Footer link addition | Yes | None | No |
| Sitemap STATIC_PATHS update | Yes | None | No |
| i18n all 3 locales | Yes | Machine translation risk flagged; TODO comment for operator review | No |
| Brand voice compliance | Yes | "Made in Italy" legal constraint documented | No |
| Test coverage | Yes | Three test surfaces identified (accessor unit, page render, sitemap) | No |
| Hero image decision | Yes | Resolved: text-only default + PLACEHOLDER comment | No |

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis caryina-about-page`
