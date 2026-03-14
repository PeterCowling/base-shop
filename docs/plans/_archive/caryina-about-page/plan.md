---
Type: Plan
Status: Archived
Domain: SELL
Workstream: Mixed
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: caryina-about-page
Dispatch-ID: IDEA-DISPATCH-20260314180008-HBAG-009
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 91%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/caryina-about-page/analysis.md
---

# Caryina About Page Plan

## Summary

Adds a `/[lang]/about` brand story page to the Caryina e-commerce app across all three locales (en/de/it). The page substantiates the "Designed in Positano, Italy" claim that currently appears everywhere but has no backing page. Five sequential-then-parallel tasks: content schema + JSON copy, page component, nav chrome updates, sitemap update, and tests. All patterns are established (support/page.tsx template, contentPacket accessor, CHROME_DEFAULTS). Build time: ~1–2 hours. Fully additive — rollback is reverting the commit.

## Active tasks

- [x] TASK-01: Add `AboutContent` type and `getAboutContent()` accessor to `contentPacket.ts`; add `about` section to `site-content.generated.json` with en/de/it copy
- [x] TASK-02: Create `apps/caryina/src/app/[lang]/about/page.tsx` server component
- [x] TASK-03: Add About nav link to `Header.tsx` + `SiteFooter.tsx`; add `header.about` / `footer.about` to `CHROME_DEFAULTS` and `ChromeContent` type in `contentPacket.ts`
- [x] TASK-04: Add `/about` to `STATIC_PATHS` in `apps/caryina/src/app/sitemap.ts`
- [x] TASK-05: Extend `contentPacket.test.ts` with `getAboutContent` tests; create `apps/caryina/src/app/[lang]/about/page.test.tsx`

## Goals

- Brand story page live at `/en/about`, `/de/about`, `/it/about`
- About link in header nav (Shop / About / Support) and site footer
- Copy derived from HBAG strategy dossier; "Designed in Positano, Italy" claim substantiated
- Text-only layout at launch; JSX TODO comment marking hero image insertion point
- TypeScript typecheck passes; accessor tests pass; page render test passes

## Non-goals

- Custom photography (deferred; TODO comment in JSX)
- Deep founder biography or press kit
- Changes to homepage, product pages, or checkout flow
- New sitemap test file (no existing test file; out of scope)

## Constraints & Assumptions

- Constraints:
  - Chrome/nav microcopy in `CHROME_DEFAULTS` TypeScript constant only — not in JSON
  - Single JSON copy: `data/shops/caryina/site-content.generated.json`
  - "Made in Italy" prohibited — "Designed in Positano, Italy" only (Italian Law 166/2009)
  - Tests run in CI only per `docs/testing-policy.md` — no local Jest execution
- Assumptions:
  - Three-item header nav (Shop / About / Support) is on-brand
  - `LocalizedText` type accepts `de?`/`it?` as optional — fallback to `en` is safe for launch
  - Brand copy can be drafted fully from `docs/business-os/strategy/HBAG/assessment/` without operator input

## Inherited Outcome Contract

- **Why:** The "Designed in Positano" claim is the heart of Caryina's brand. Without an About page, the claim feels thin and unsubstantiated. A short brand story reinforces trust and differentiates from generic dropshippers.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Brand story page live at `/about` in all three locales, linked from header nav and site footer, with copy derived from the strategy dossier. Page ships as text-only with a `{/* TODO: PLACEHOLDER — operator to supply hero image */}` comment in the JSX marking where photography can be inserted later.
- **Source:** operator

## Analysis Reference

- Related analysis: `docs/plans/caryina-about-page/analysis.md`
- Selected approach inherited:
  - Option A: Dedicated `/about` route following `support/page.tsx` pattern
  - Content in `site-content.generated.json`; chrome/nav labels in `CHROME_DEFAULTS` TypeScript constant
  - Text-only layout at launch with JSX TODO for hero image
- Key reasoning used:
  - Option B (Support embed) rejected: wrong URL, wrong mental model
  - Option C (Homepage accordion) rejected: competes with conversion focus, no SEO value
  - Option A has zero new patterns; all implementation pieces are already established in the codebase

## Selected Approach Summary

- What was chosen:
  - New `/[lang]/about` server component inheriting `support/page.tsx` structure
  - `AboutContent` type + `getAboutContent()` accessor added to `contentPacket.ts` (same pattern as `getSupportContent`, `getShippingContent`, etc.)
  - About nav labels added to `CHROME_DEFAULTS` + `ChromeContent.header.about` / `ChromeContent.footer.about`
  - Sitemap `STATIC_PATHS` updated
- Why planning is not reopening option selection:
  - Analysis settled all three options decisively; no operator fork outstanding

## Fact-Find Support

- Supporting brief: `docs/plans/caryina-about-page/fact-find.md`
- Evidence carried forward:
  - Single JSON copy at `data/shops/caryina/site-content.generated.json`
  - `CHROME_DEFAULTS` at `contentPacket.ts:408` — authoritative source for nav microcopy
  - `LocalizedText` type: `{ en: string; de?: string; it?: string }` — de/it optional
  - Brand story copy source: `docs/business-os/strategy/HBAG/assessment/2026-02-20-operator-context.user.md` (Pete designs in Positano) + `2026-02-21-brand-profile.user.md` (origin claim, brand voice)
  - `support/page.tsx` pattern: `generateMetadata()` + async server component + `max-w-3xl rounded-lg border p-6` cards

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | contentPacket + JSON content data | 92% | S | Complete (2026-03-14) | - | TASK-02, TASK-03, TASK-04, TASK-05 |
| TASK-02 | IMPLEMENT | About page component | 90% | S | Complete (2026-03-14) | TASK-01 | TASK-05 |
| TASK-03 | IMPLEMENT | CHROME_DEFAULTS + header/footer nav | 90% | S | Complete (2026-03-14) | TASK-01 | TASK-05 |
| TASK-04 | IMPLEMENT | Sitemap STATIC_PATHS update | 95% | S | Complete (2026-03-14) | TASK-01 | TASK-05 |
| TASK-05 | IMPLEMENT | Tests: accessor unit + page render | 88% | S | Complete (2026-03-14) | TASK-02, TASK-03, TASK-04 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | `support/page.tsx` card structure; `max-w-3xl` layout; TODO comment for hero image | TASK-02 | All brand tokens already in globals.css; no new tokens needed |
| UX / states | Static SSR; no new states; `resolveLocale()` fallback handles invalid locale params | TASK-02 | No loading/error states on content pages |
| Security / privacy | N/A | — | No user input; no auth; no PII |
| Logging / observability / audit | N/A for this plan | — | GA4 page-view emitters are page-specific in this app (not in shared layout); `/about` will not be auto-tracked; adding a page_view emitter is adjacent scope — deferred to post-launch |
| Testing / validation | Extend `contentPacket.test.ts` + create `about/page.test.tsx` | TASK-05 | Follow `support/page.test.tsx` pattern |
| Data / contracts | JSON `about` section + `AboutContent` type + `SAFE_DEFAULTS.about` fallback + `parsePayloadFromPath()` gate update + `getAboutContent()` + `CHROME_DEFAULTS` extension | TASK-01, TASK-03 | TypeScript enforces SAFE_DEFAULTS shape; JSON content validated by required-field gate at runtime (not by typecheck) |
| Performance / reliability | N/A | — | Static server component; existing `readPayload()` call; no new data fetching |
| Rollout / rollback | Purely additive; rollback = revert commit | All tasks | No migration; no existing routes modified |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | Foundational: JSON content + contentPacket types; must complete before all others |
| 2 | TASK-02, TASK-04 | TASK-01 complete | TASK-02 creates new file; TASK-04 edits sitemap.ts — no file conflicts |
| 3 | TASK-03 | TASK-01 complete | Edits contentPacket.ts (CHROME_DEFAULTS), Header.tsx, SiteFooter.tsx — run after Wave 2 to avoid contentPacket.ts conflicts |
| 4 | TASK-05 | TASK-02, TASK-03, TASK-04 complete | All tests; must have all implementations in place |

## Delivered Processes

None: no material process topology change. The plan adds a static content route to the site catalogue. No CI/deploy lane, operator runbook, approval path, or multi-step workflow is altered.

## Tasks

---

### TASK-01: Add `AboutContent` type and content data

- **Type:** IMPLEMENT
- **Deliverable:** Updated `contentPacket.ts` (new `AboutContent` interface, `SiteContentPayload.about` field, `getAboutContent()` accessor, `SAFE_DEFAULTS.about` hardcoded fallback, `parsePayloadFromPath()` required-field gate updated to check `parsed.about`); updated `data/shops/caryina/site-content.generated.json` (new `about` section with en/de/it copy)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/caryina/src/lib/contentPacket.ts` (SiteContentPayload, AboutContent, SAFE_DEFAULTS, parsePayloadFromPath, getAboutContent), `data/shops/caryina/site-content.generated.json`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05
- **Confidence:** 92%
  - Implementation: 93% — exact pattern exists (getSupportContent/getShippingContent); interface extension is straightforward
  - Approach: 92% — single JSON copy confirmed; LocalizedText schema confirmed; no architecture choices
  - Impact: 90% — if this task fails, no other task can proceed
- **Acceptance:**
  - `AboutContent` interface exported from `contentPacket.ts` with fields: `title: LocalizedText`, `eyebrow: LocalizedText`, `paragraphs: LocalizedText[]`
  - `SiteContentPayload` interface has `about: AboutContent` field
  - `SAFE_DEFAULTS` in `contentPacket.ts` has `about: AboutContent` fallback (required because `SAFE_DEFAULTS` is typed as `SiteContentPayload`; TypeScript typecheck enforces this)
  - `parsePayloadFromPath()` required-field gate updated: `!parsed.about` added to the `if (!parsed.home || ...)` check at line 257
  - `getAboutContent(lang: Locale): { title: string; eyebrow: string; paragraphs: string[] }` exported from `contentPacket.ts`
  - `data/shops/caryina/site-content.generated.json` has `about` key with en/de/it copy for all fields
  - All locale fields (en, de, it) in the JSON `about` section do NOT contain "Made in Italy" — only "Designed in Positano, Italy" or locale equivalent
  - TypeScript typecheck passes with no new errors
  - Note: `parsePayloadFromPath()` casts the JSON as `Partial<SiteContentPayload>` at runtime — TypeScript typecheck on source files will enforce `SAFE_DEFAULTS` shape but will NOT validate the JSON file content; the required-field gate is the runtime guard for JSON completeness
  - `getAboutContent()` must use optional chaining / nullish coalescing on all field accesses so that a malformed `about: {}` (which passes the presence gate) degrades to `SAFE_DEFAULTS.about` rather than throwing
- **Engineering Coverage:**
  - UI / visual: N/A — data layer only
  - UX / states: N/A — data layer only
  - Security / privacy: N/A — static content; no PII
  - Logging / observability / audit: N/A
  - Testing / validation: Required — accessor tested in TASK-05; this task establishes the contract TASK-05 will test
  - Data / contracts: Required — `AboutContent` interface; `SiteContentPayload.about`; `SAFE_DEFAULTS.about` fallback (TypeScript enforces this); `parsePayloadFromPath()` required-field gate (runtime guard); note: JSON content is cast at runtime so TypeScript does NOT validate JSON field values, only the source TypeScript objects (SAFE_DEFAULTS)
  - Performance / reliability: N/A — no new data fetching
  - Rollout / rollback: Required — rollback = revert this commit; no migration
- **Validation contract (TC-01):**
  - TC-01: `getAboutContent("en")` returns object with non-empty `title`, `eyebrow`, and at least 1 `paragraphs` entry
  - TC-02: `getAboutContent("de")` returns non-null object (de fields may fall back to en; must not throw)
  - TC-03: TypeScript `tsc --noEmit` passes with no new errors on `contentPacket.ts`
  - TC-04: All locale fields in the JSON `about` section — grep for "Made in Italy" across en, de, and it fields must return no matches
- **Execution plan:**
  - Red: write a minimal test `expect(getAboutContent("en").title).toBeTruthy()` — will fail because function doesn't exist yet
  - Green: add `AboutContent` interface, `SiteContentPayload.about` field, `getAboutContent()` accessor; add `SAFE_DEFAULTS.about` hardcoded fallback; add `!parsed.about` to `parsePayloadFromPath()` required-field gate; add `about` section to JSON with en copy drafted from dossier; add de/it translations
  - Refactor: run copycheck across all locale fields (en, de, it) in the JSON `about` section for "Made in Italy"; verify de/it translations are acceptable for launch or note in Decision Log that operator review is needed
- **English copy to use (derived from strategy dossier):**
  - `title`: `"About Caryina"`
  - `eyebrow`: `"Designed in Positano, Italy"`
  - `paragraphs[0]`: `"Caryina is a collection of bag charms designed in Positano on the Amalfi Coast. Each piece is created to turn a simple bag into something personal — a small detail that's entirely your own."`
  - `paragraphs[1]`: `"We work with one carefully chosen supplier to bring our designs to life. Every hardware finish, material, and proportion is specified by us. Nothing reaches the collection that we wouldn't carry ourselves."`
  - `paragraphs[2]`: `"Caryina is a brand of Skylar SRL, registered in Positano, Italy."`
- **Scouts:** None: pattern is fully established from existing accessors
- **Edge Cases & Hardening:** `parsePayloadFromPath()` only presence-checks top-level sections (not field shapes within them); TypeScript does NOT validate JSON content at runtime. If `about: {}` is present but empty, the gate passes and `getAboutContent()` may return null/empty fields. Mitigation: `getAboutContent()` must use optional chaining / nullish coalescing on all field accesses so an empty `about` object degrades to `SAFE_DEFAULTS.about` rather than throwing. This is a TASK-01 acceptance requirement. For de/it fields absent, `localizedText()` falls back to en — no additional guard needed for locale fallback.
- **What would make this >=90%:**
  - Already 93% implementation confidence; minor risk is copy review (legal constraint check)
- **Rollout / rollback:**
  - Rollout: part of build commit; no deploy action needed beyond normal CI
  - Rollback: revert commit; no migration
- **Documentation impact:** None
- **Notes / references:**
  - Strategy dossier: `docs/business-os/strategy/HBAG/assessment/2026-02-20-operator-context.user.md:34-35`
  - Brand profile: `docs/business-os/strategy/HBAG/assessment/2026-02-21-brand-profile.user.md:116-118`
  - Legal constraint: Italian Law 166/2009 — "Made in Italy" not permitted; "Designed in Positano, Italy" is accurate and defensible

---

### TASK-02: Create About page component

- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/caryina/src/app/[lang]/about/page.tsx` — server component with `generateMetadata()` and locale-aware brand story page
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/caryina/src/app/[lang]/about/page.tsx` (new file)
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 90% — `support/page.tsx` is the direct template; exact class names and structure are established
  - Approach: 92% — zero new patterns; text-only at launch with TODO for hero image
  - Impact: 88% — page is the primary deliverable; test coverage confirms correctness
- **Acceptance:**
  - File exists at `apps/caryina/src/app/[lang]/about/page.tsx`
  - `generateMetadata()` returns `title: "About Caryina | Caryina"` (en), localized for de/it; includes `description` (brand story summary) and `keywords` array, following the `support/page.tsx` pattern
  - Page renders: `<h1>` with `content.title`, eyebrow above heading, paragraphs in a bordered card
  - JSX includes `{/* TODO: PLACEHOLDER — operator to supply hero image before scaling traffic */}` comment
  - No "Made in Italy" text anywhere in the file (only "Designed in Positano, Italy" from content JSON)
  - TypeScript typecheck passes
- **Expected user-observable behavior:**
  - Navigate to `/en/about` → sees "About Caryina" heading, eyebrow "Designed in Positano, Italy", brand story paragraphs
  - Navigate to `/de/about` → sees same page with de translations (or en fallback if de is not populated)
  - Navigate to `/it/about` → sees same page with it translations (or en fallback)
  - Page has same visual structure as Support page (bordered card, muted text, consistent spacing)
- **Engineering Coverage:**
  - UI / visual: Required — follows `max-w-3xl rounded-lg border p-6 text-sm text-muted-foreground` card pattern; font-display h1
  - UX / states: N/A — static SSR; no interactive states
  - Security / privacy: N/A — no user input
  - Logging / observability / audit: N/A — no page_view emitter in scope for this task; deferred to post-launch
  - Testing / validation: Required — `about/page.test.tsx` created in TASK-05
  - Data / contracts: Required — imports `getAboutContent()` from TASK-01; TypeScript enforces return shape
  - Performance / reliability: N/A — static server component
  - Rollout / rollback: Required — new file only; rollback = revert
- **Validation contract (TC-02):**
  - TC-01: Page component renders without throwing when called with `params: { lang: "en" }`
  - TC-02: Page component renders without throwing when called with `params: { lang: "de" }`
  - TC-03: `generateMetadata({ params: { lang: "en" } })` resolves to object with non-empty `title`
  - TC-04: Rendered HTML does not contain "Made in Italy" string
  - TC-05: File includes `{/* TODO: PLACEHOLDER — operator to supply hero image */}` comment
- **Execution plan:**
  - Red: TypeScript import of non-existent `getAboutContent` will fail typecheck until TASK-01 is complete — verify TASK-01 done first
  - Green: create `about/page.tsx` cloning structure of `support/page.tsx`; replace `getSupportContent` calls with `getAboutContent`; render title/eyebrow/paragraphs; add TODO comment
  - Refactor: verify no "Made in Italy" in rendered output; verify QA loop passes (contrast + breakpoint)
- **Post-build QA loop (required for frontend IMPLEMENT tasks):**
  - Run `/lp-design-qa` scoped to `/about` route
  - Run `/tools-ui-contrast-sweep` scoped to `apps/caryina/src/app/[lang]/about/`
  - Run `/tools-ui-breakpoint-sweep` scoped to `apps/caryina/src/app/[lang]/about/`
  - Auto-fix and re-verify until no Critical/Major findings; Minor findings may be deferred with rationale
- **Scouts:** None: support/page.tsx is the direct template
- **Edge Cases & Hardening:** `resolveLocale(undefined)` → returns "en"; page renders correctly with locale fallback
- **What would make this >=90%:** Already 90%; minor risk is QA loop findings (no history for this route)
- **Rollout / rollback:**
  - Rollout: new file; part of build commit
  - Rollback: revert commit
- **Documentation impact:** None
- **Notes / references:**
  - Template: `apps/caryina/src/app/[lang]/support/page.tsx`
  - Font class: `font-display` for h1 (Cormorant Garamond)
  - Layout wrapper handles nav/footer — page just returns `<section>` content

---

### TASK-03: Add About nav to CHROME_DEFAULTS and Header/Footer components

- **Type:** IMPLEMENT
- **Deliverable:** Updated `contentPacket.ts` (add `about: LocalizedText` to `ChromeContent.header` and `ChromeContent.footer` interfaces + `CHROME_DEFAULTS` values + `getChromeContent()` return mapper at lines 492–507 updated to include `header.about` and `footer.about`); updated `Header.tsx` (add About nav link); updated `SiteFooter.tsx` (add About footer link)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/caryina/src/lib/contentPacket.ts`, `apps/caryina/src/components/Header.tsx`, `apps/caryina/src/components/SiteFooter.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 91% — CHROME_DEFAULTS extension is a direct copy of existing entries; Header/Footer link addition is additive
  - Approach: 90% — confirmed CHROME_DEFAULTS is the authoritative source (not JSON); Header and Footer patterns are established
  - Impact: 88% — without this task, About page exists but is unreachable from navigation
- **Acceptance:**
  - `ChromeContent.header` has `about: LocalizedText` field
  - `ChromeContent.footer` has `about: LocalizedText` field (optional: may add to policy links or separate section)
  - `CHROME_DEFAULTS.header.about` populated: `{ en: "About", de: "Über uns", it: "Chi siamo" }`
  - `CHROME_DEFAULTS.footer.about` populated with same labels
  - `Header.tsx` renders About link as the second item in the nav — order is: Shop | About | Support
  - `SiteFooter.tsx` renders About link in the footer links list
  - TypeScript typecheck passes — `ChromeContent` consumers that destructure `header` may need to be checked for exhaustive pattern matching
- **Expected user-observable behavior:**
  - Header nav shows: Shop | About | Support (About is the second item)
  - Site footer shows About link alongside Terms, Privacy, etc.
  - Clicking either About link navigates to `/{lang}/about`
- **Engineering Coverage:**
  - UI / visual: Required — nav link must inherit existing `hover:text-foreground` or equivalent hover style from Header; footer link must match existing footer link styling
  - UX / states: N/A — nav links are static; no interactive state beyond hover
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — no existing Header/SiteFooter component test exists in `apps/caryina/src`; `CHROME_DEFAULTS` accessor coverage handled by TC-01/TC-02/TC-03 (direct assertions on `getChromeContent()` return values); TC-05 (Header renders About link in DOM) and TC-06 (footer link renders) are validated by post-build QA loop visual inspection — there is no automated DOM render test for these components, and this is an accepted gap given no existing test infrastructure for Header/SiteFooter. The post-build QA loop is the hard acceptance gate for DOM rendering correctness.
  - Data / contracts: Required — `ChromeContent` interface extension in `contentPacket.ts`; `CHROME_DEFAULTS` update; both must be consistent
  - Performance / reliability: N/A
  - Rollout / rollback: Required — additive to Header/Footer; rollback = revert
- **Validation contract (TC-03):**
  - TC-01: `getChromeContent("en").header.about` returns `"About"`
  - TC-02: `getChromeContent("de").header.about` returns `"Über uns"`
  - TC-03: `getChromeContent("it").header.about` returns `"Chi siamo"`
  - TC-04: TypeScript typecheck passes — no new errors from `ChromeContent` interface extension
  - TC-05: `Header.tsx` renders an `<a>` or `<Link>` with `href="/{lang}/about"` in the nav element
- **Consumer tracing (CHROME_DEFAULTS extension):**
  - `CHROME_DEFAULTS` is consumed by `getChromeContent()` → returned as `ChromeContent`
  - `getChromeContent()` is called internally inside `Header.tsx` (line 13: `const chrome = getChromeContent(lang as "en" | "de" | "it")`) and inside `SiteFooter.tsx` — `layout.tsx` passes only `lang` to both components; it does not receive or forward `ChromeContent`
  - **Critical path**: `getChromeContent()` at lines 492–507 manually shapes the return object — it lists each field explicitly. Adding `about` to `ChromeContent.header` and `CHROME_DEFAULTS.header.about` is NOT sufficient alone; the return mapper must also include `about: localizedText(chrome.header.about, locale)` and similarly for footer. Without this, `Header.tsx` calling `chrome.header.about` receives `undefined` at runtime even though the interface and defaults are correct.
  - `<Header>` destructures `chrome.header` — must add rendering of `chrome.header.about`
  - `<SiteFooter>` destructures `chrome.footer` — must add rendering of `chrome.footer.about`
  - No other consumers of `ChromeContent` identified; TypeScript will catch any missed destructuring
- **Execution plan:**
  - Red: add `about: LocalizedText` to `ChromeContent.header` in `contentPacket.ts` — TypeScript will now require `CHROME_DEFAULTS.header.about` to exist; will fail typecheck until populated
  - Green: populate `CHROME_DEFAULTS.header.about` and `.footer.about`; update `getChromeContent()` return mapper to include `header.about` and `footer.about`; add `<Link>` to `Header.tsx` nav; add link to `SiteFooter.tsx`
  - Refactor: verify nav link order is visually clean; verify footer link renders consistently with adjacent links
- **Post-build QA loop:** Run scoped to changed `Header.tsx` and `SiteFooter.tsx`; check About link is visible in light/dark mode; no contrast failures
- **Scouts:** None: CHROME_DEFAULTS pattern is fully established
- **Edge Cases & Hardening:** Header nav is `hidden sm:flex` — the entire nav (Shop, Support, and the new About link) is hidden on mobile screens. This is existing behaviour shared by all nav items, not a regression. Mobile discoverability is provided by the SiteFooter About link which is always visible. The plan's "About link in header nav" acceptance criterion applies to sm+ viewports; the post-build QA loop must verify the footer link on mobile.
- **What would make this >=90%:** Already 91% implementation; risk is missing `ChromeContent` consumer that destructures header exhaustively — TypeScript typecheck catches this
- **Rollout / rollback:**
  - Rollout: part of build commit
  - Rollback: revert commit
- **Documentation impact:** None
- **Notes / references:**
  - CHROME_DEFAULTS source: `apps/caryina/src/lib/contentPacket.ts:408`
  - Header pattern: `apps/caryina/src/components/Header.tsx`
  - Footer pattern: `apps/caryina/src/components/SiteFooter.tsx`

---

### TASK-04: Update sitemap STATIC_PATHS

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/caryina/src/app/sitemap.ts` with `/about` added to `STATIC_PATHS`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/caryina/src/app/sitemap.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 95%
  - Implementation: 96% — single array entry addition; exact pattern established
  - Approach: 95% — static paths list is well understood
  - Impact: 93% — sitemap inclusion affects SEO; low risk of regression
- **Acceptance:**
  - `STATIC_PATHS` in `apps/caryina/src/app/sitemap.ts` contains `"/about"`
  - TypeScript typecheck passes
  - `sitemap()` function returns entries for `/en/about`, `/de/about`, `/it/about` alongside existing entries
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: N/A — no existing sitemap test; not in scope
  - Data / contracts: Required — `STATIC_PATHS` array is the data contract; type is `readonly string[]`
  - Performance / reliability: N/A
  - Rollout / rollback: Required — rollback = revert array entry
- **Validation contract (TC-04):**
  - TC-01: `STATIC_PATHS` includes `"/about"` — verify by reading file
  - TC-02: TypeScript typecheck passes
- **Execution plan:**
  - Red: N/A (trivial change — no meaningful test-first for array addition)
  - Green: add `"/about"` to `STATIC_PATHS` array
  - Refactor: verify sitemap function returns correct number of entries (3 locales × n+1 paths)
- **Scouts:** None
- **Edge Cases & Hardening:** `generateStaticParams` already emits en/de/it independently; sitemap only needs the path, not locale-specific entries (the sitemap function handles locale expansion)
- **What would make this >=90%:** Already 96%
- **Rollout / rollback:**
  - Rollout: part of build commit; sitemap regenerates on next build
  - Rollback: revert array entry
- **Documentation impact:** None
- **Notes / references:** `apps/caryina/src/app/sitemap.ts` — `STATIC_PATHS` array currently includes: `""`, `"/shop"`, `"/support"`, `"/privacy"`, `"/cookie-policy"`, `"/terms"`, `"/returns"`, `"/shipping"`

---

### TASK-05: Write accessor unit test and page render test

- **Type:** IMPLEMENT
- **Deliverable:** Extended `apps/caryina/src/lib/contentPacket.test.ts` (new `getAboutContent` test cases); new `apps/caryina/src/app/[lang]/about/page.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/caryina/src/lib/contentPacket.test.ts`, `apps/caryina/src/app/[lang]/about/page.test.tsx` (new file)
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 88% — `contentPacket.test.ts` pattern is established; `support/page.test.tsx` is the direct reference for the new test file
  - Approach: 90% — test structures are clear and match existing tests
  - Impact: 85% — tests run in CI only; no local execution; minor risk that mock setup differs from `support/page.test.tsx`
- **Acceptance:**
  - `contentPacket.test.ts` extended with test cases:
    - `getAboutContent("en")` returns non-empty `title`, `eyebrow`, and `paragraphs` array
    - `getAboutContent("de")` returns non-null result without throwing
    - `getAboutContent("it")` returns non-null result without throwing
    - `getChromeContent("en").header.about` returns `"About"` (extends existing `getChromeContent` locale test block at lines 70–251)
    - `getChromeContent("de").header.about` returns `"Über uns"`
    - `getChromeContent("en").footer.about` returns a non-empty string
    - Malformed `about: {}` degraded path: using `jest.isolateModules()` with mocked `fs` (following existing fallback test pattern at lines 18–68), verify `getAboutContent()` returns `SAFE_DEFAULTS.about.title` (not throws) when JSON has `about: {}`
  - `about/page.test.tsx` created following `support/page.test.tsx` structure:
    - renders without throwing for `lang: "en"`
    - renders without throwing for `lang: "de"`
    - `generateMetadata` resolves with non-empty title for `lang: "en"`
    - `generateMetadata` resolves with non-empty `description` for `lang: "en"` (matching `support/page.test.tsx` metadata assertion pattern)
  - All new test cases follow the governed Jest runner pattern per `docs/testing-policy.md`
  - Tests are added using `describe` blocks (not `describe.skip`)
- **Engineering Coverage:**
  - UI / visual: N/A — tests cover render correctness, not pixel-level UI
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — this IS the testing task
  - Data / contracts: Required — tests assert on `getAboutContent()` return shape; will catch JSON/interface mismatches
  - Performance / reliability: N/A
  - Rollout / rollback: Required — rollback = revert test files
- **Validation contract (TC-05):**
  - TC-01: All new tests in `contentPacket.test.ts` pass in governed test runner
  - TC-02: All tests in `about/page.test.tsx` pass in governed test runner
  - TC-03: No existing tests in `contentPacket.test.ts` are broken by the additions
- **Execution plan:**
  - Red: stub describe block with `it.todo()` items to verify the test file structure compiles
  - Green: implement assertions following existing test patterns from `support/page.test.tsx`
  - Refactor: ensure test descriptions are clear; ensure no mock imports are missing
- **Scouts:** Check `support/page.test.tsx` mock setup carefully — any provider or context wrapper needed for the about page test must match
- **Edge Cases & Hardening:** `docs/testing-policy.md` governs which Jest runner to use; governed tests must use `pnpm -w run test:governed`
- **What would make this >=90%:** Verified mock setup matches `support/page.test.tsx` exactly before writing
- **Rollout / rollback:**
  - Rollout: part of build commit
  - Rollback: revert test files
- **Documentation impact:** None
- **Notes / references:**
  - Reference test: `apps/caryina/src/app/[lang]/support/page.test.tsx`
  - Tests run in CI only per `docs/testing-policy.md` — push and monitor via `gh run watch`; do not execute Jest commands locally

---

## Risks & Mitigations

- **"Made in Italy" language in copy** — Low likelihood / High impact. Mitigation: TASK-01 acceptance includes explicit copycheck (grep for "Made in Italy" in `about` section). TASK-02 acceptance checks rendered output.
- **de/it translation quality** — Medium likelihood / Low impact. Mitigation: `localizedText()` fallback to en is safe for launch. Decision Log notes that operator review of de/it copy is recommended before scaling traffic.
- **JSON `about` section null/undefined at runtime** — Low likelihood / Medium impact. Mitigation: `parsePayloadFromPath()` required-field gate (updated to check `!parsed.about`) causes fallback to `SAFE_DEFAULTS.about` when the JSON key is absent — page renders correctly in degraded mode. TypeScript enforces `SAFE_DEFAULTS.about` shape; JSON content itself is not type-validated at runtime. Residual risk: a malformed `about: {}` would pass the gate (gate only checks presence, not shape), so `getAboutContent()` must include defensive field access (e.g., optional chaining / nullish coalescing) to avoid runtime errors on missing fields within the object. This defensive coding requirement is captured in TASK-01 acceptance.
- **`ChromeContent` consumer breakage from header.about addition** — Low likelihood / Low impact. Mitigation: TypeScript enforces exhaustive interface compliance; typecheck catches any missed consumer in TASK-03.

## Observability

- Logging: None — static content page; no new events
- Metrics: None in this plan — GA4 page-view emitters are page-specific in this app, not in the shared layout. Adding a page_view emitter for `/about` is adjacent scope; deferred to post-launch review.
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] `/en/about`, `/de/about`, `/it/about` each render a page with non-empty h1 and at least one body paragraph
- [ ] About link visible in Header nav (sm+ viewports) and SiteFooter on all locale routes; mobile header nav is `hidden sm:flex` for all items — footer link provides mobile discoverability
- [ ] Sitemap response includes `/en/about`, `/de/about`, `/it/about`
- [ ] No "Made in Italy" text anywhere in the about page or its content JSON section
- [ ] JSX TODO comment for hero image present in `about/page.tsx`
- [ ] TypeScript typecheck passes with no new errors
- [ ] `getAboutContent` unit tests pass (en/de/it)
- [ ] About page render tests pass (en render, de render, generateMetadata)
- [ ] No existing tests broken

## Decision Log

- 2026-03-14: Nav placement — About goes in both header (discovery) and footer (reference). Three-item header nav (Shop / About / Support) is standard for small DTC brand. Evidence: brand dossier aesthetic constraint ("fewer CTAs") satisfied; one additional item does not overwhelm.
- 2026-03-14: Hero image — deferred to post-launch. Text-only layout with JSX TODO comment is the deliverable. No `<Image>` component; no new JSON field for image src.
- 2026-03-14: i18n — full de/it translations in same build (preferred) using machine-assisted translation from en; optional since `localizedText()` fallback is production-safe.
- 2026-03-14: Chrome/nav labels — `CHROME_DEFAULTS` TypeScript constant (not JSON). Confirmed by `contentPacket.ts:404-407` comment.
- 2026-03-14: de/it copy quality — machine-assisted translations acceptable for launch given `localizedText()` en fallback. Operator review of de/it copy recommended before scaling traffic; this is not a code comment but a noted post-launch action.
- [Adjacent: delivery-rehearsal] Hero image component — adding an `<Image>` component with operator-supplied `src` would require a new JSON field and a media asset. Out of scope for this plan; route to post-build reflection or future fact-find when operator supplies photography.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: contentPacket types + JSON | Yes — no dependencies | None | No |
| TASK-02: about/page.tsx | Yes — TASK-01 produces `getAboutContent()` before this task starts | None | No |
| TASK-03: CHROME_DEFAULTS + nav | Yes — TASK-01 complete before contentPacket.ts touched again | None | No |
| TASK-04: sitemap STATIC_PATHS | Yes — independent; TASK-01 complete (ensures JSON is stable) | None | No |
| TASK-05: tests | Yes — all implementations complete; accessor and page both exist | None | No |

## Overall-confidence Calculation

- All tasks are S effort (weight 1 each)
- Overall-confidence = (92 + 90 + 90 + 95 + 88) / 5 = 455 / 5 = **91%**
