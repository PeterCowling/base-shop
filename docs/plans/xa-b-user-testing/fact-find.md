---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Product
Workstream: Operations
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: xa-b-user-testing
Execution-Track: business-artifact
Deliverable-Family: doc
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: doc
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-b-user-testing/plan.md
Trigger-Why: Staging deployment is live on Cloudflare Pages (project xa-b-site); the operator has confirmed the app is finalized for user testing but no logistics for that testing session have been planned.
Trigger-Intended-Outcome: type: operational | statement: A concrete user testing plan exists and a review session is conducted with the client/stakeholder so that actionable feedback is captured before any production deployment | source: operator
---

# XA-B User Testing Fact-Find Brief

## Scope

### Summary

The xa-b member-rewards storefront (an exclusive-access bag-and-accessories shop with invitation-only registration) is deployed to Cloudflare Pages at `https://xa-b-site.pages.dev` (dev branch: `https://dev--xa-b-site.pages.dev`). The app is a fully static Next.js 16 export. The operator has confirmed the app is ready for user testing but no testing logistics have been planned. This fact-find investigates what the app does, who the audience is for the review session, what routes and flows exist, and what form the user-testing plan should take.

### Goals

- Produce a user testing protocol / logistics plan that specifies: who reviews, what they walk through, how feedback is collected, and what the follow-on action is.
- Ensure the staging URL format and access model are confirmed so that reviewers can actually reach the app.
- Document the flows that exist (routes/screens) so a demo walkthrough can be planned without needing code changes.

### Non-goals

- Code changes to xa-b.
- Formal UX-lab-style usability research with recruited strangers; this is operator-level client/stakeholder review.
- Cloudflare Pages project setup and CI deploy (covered by XA-V2-01 — that is a staging infrastructure task; production deployment is a separate future concern).
- Cloudflare Access setup (confirmed not needed — see resolved questions).

### Constraints & Assumptions

- Constraints:
  - The app is a static export: no server-side session, no live inventory, no real checkout processing. Demo interactions with cart/checkout/account will not persist or transact.
  - The `brandName` and all contact/legal config fields are currently placeholder values (`XA-B`, `support@example.com`, `example.com`). The reviewer will see these unless `NEXT_PUBLIC_BRAND_NAME` and related env vars are set on the Cloudflare Pages project at build time.
  - The staging URL is public — no Cloudflare Access or password protection is in place. Anyone with the URL can view the site.
  - No `/account` route exists in the static export (account system was removed). Links that reference `/account/login`, `/account/register`, and `/account/trackingorder` are present in UI copy (FAQ, checkout, FAQs) but will 404 or show the not-found page. This is a known demo limitation.
  - XA-V2-05 (demo script) does not yet exist — it is still Pending in the XA-V2 plan.
  - XA-V2-01 (CF Pages project creation + first CI deploy) is still Pending. The dispatch states staging is live, so this constraint may already be resolved; the operator should confirm the public URL returns 200 before scheduling the review.

- Assumptions:
  - "User testing" in this context means client/stakeholder review of the staged storefront — not formal usability research with recruited end-users.
  - The operator knows who the client is and holds contact information to schedule the review.
  - Feedback will be collected informally (call notes, email) rather than via a structured tool like Maze or UserTesting.com.
  - The review is focused on whether the storefront concept and visual presentation are correct — not on functional checkout flow.

---

## Outcome Contract

- **Why:** The staging deployment is live and the app is code-complete for this phase. Without a testing plan, the client review will not happen in a structured way, feedback will not be captured, and any necessary adjustments before a wider reveal will be missed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A user testing protocol document is produced and a client/stakeholder review session is conducted. The session generates at least one round of structured feedback, which is recorded and triaged against a go/no-go decision for any follow-up changes before any production reveal.
- **Source:** operator

---

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-b/src/app/page.tsx` — home page: hero ("The finest carry goods. By invitation."), "New in" product grid (up to 12 products sorted by `createdAt`), three info cards linking to How to shop / FAQs / Contact us. This is the primary landing screen for any review.
- `apps/xa-b/src/app/products/[handle]/page.tsx` — product detail page (PDP): image gallery, buy box (XaBuyBox), bag/clothing/jewelry detail blocks, "Complete the look" and "More from designer" carousels. Demo data sourced from `apps/xa-b/src/data/catalog.runtime.json` via `demoData.ts`.
- `.github/workflows/xa.yml` — CI definition. `deploy-xa-b` job deploys `out/` to Cloudflare Pages project `xa-b-site` via `wrangler pages deploy out/ --project-name xa-b-site`. Triggered on push to `main` or `dev`, or `workflow_dispatch`.

### Key Modules / Files

- `apps/xa-b/src/lib/siteConfig.ts` — all brand/config values. Current placeholders: `brandName: "XA-B"`, `domain: "example.com"`, `supportEmail: "support@example.com"`, `whatsappNumber: "+00 000 000 000"`. All overridable via `NEXT_PUBLIC_*` env vars at build time.
- `apps/xa-b/src/lib/demoData.ts` — loads demo product catalog from `src/data/catalog.runtime.json`, resolves Cloudflare Images URLs. This is what populates the "New in" grid and PDPs.
- `apps/xa-b/src/app/layout.tsx` — root layout. Stealth mode (`XA_STEALTH_MODE`) is supported but not required for demo. Providers: `CartProvider`, `WishlistProvider`, `ShopThemeProvider`, `CurrencyProvider`. Service worker registration is active.
- `apps/xa-b/src/app/faqs/page.tsx` — full FAQ page with 9 sections covering membership, pricing, ordering, shipping, returns, pre-order, size/fit, promotions, legal/DSA. Content is production-grade; some questions reference `/account/*` routes that 404 in static export.
- `apps/xa-b/src/app/pages/contact-us/page.tsx` — Contact Us page with enquiry form (`ContactUsEnquiryForm`), general contacts, feedback card, and newsletter signup.
- `apps/xa-b/src/app/checkout/page.tsx` — Checkout page: calls `/api/account/session` (will fail gracefully in static export, showing "Login required" state). Cart table + place order flow present but non-functional for demo.

### Route Map (Complete)

The following routes were confirmed to exist in `apps/xa-b/src/app/`:

**Top-level informational / catalog:**
- `/` — Home
- `/new-in` — New arrivals listing
- `/collections` — Collections index (lists all collections)
- `/collections/all` — All products listing
- `/collections/[handle]` — Collection detail
- `/brands` — Brands listing
- `/brands/[handle]` — Brand detail
- `/designers` — Designers listing
- `/designer/[slug]` — Designer detail
- `/edits` — Edits (curated selections)
- `/edits/[slug]` — Edit detail
- `/search` — Search
- `/sale` — Sale listing

**Department / category:**
- `/bags` — Bags landing
- `/jewelry` — Jewelry landing
- `/women`, `/women/bags`, `/women/bags/[type]`, `/women/clothing`, `/women/clothing/[category]`, `/women/jewelry`, `/women/jewelry/[type]`
- `/men`, `/men/bags`, `/men/bags/[type]`, `/men/clothing`, `/men/clothing/[category]`, `/men/jewelry`, `/men/jewelry/[type]`
- `/kids`, `/kids/bags`, `/kids/bags/[type]`, `/kids/clothing`, `/kids/clothing/[category]`, `/kids/jewelry`, `/kids/jewelry/[type]`

**Product:**
- `/products/[handle]` — Product detail page

**Support / info pages:**
- `/faqs`
- `/pages/how-to-shop`
- `/pages/contact-us`
- `/pages/about-us`
- `/pages/privacy-policy`
- `/pages/terms-of-service`
- `/pages/shipping-policy`
- `/pages/return-policy`
- `/pages/payment-and-pricing`
- `/pages/cryptocurrency-payment`
- `/pages/reviews`
- `/service-center`

**Commerce (limited functionality in static export):**
- `/cart`
- `/wishlist`
- `/checkout`
- `/checkout/success`

**Non-functional in static export (known 404 risk):**
- `/account/register` — linked from hero CTA "Join Us" and FAQ
- `/account/login` — linked from FAQ and checkout
- `/account/trackingorder` — linked from multiple FAQ answers
- `/account` — linked from FAQ and checkout

### Patterns & Conventions Observed

- Static export with demo data: the catalog is pre-built into the static output. No live backend. Evidence: `demoData.ts` loads from `catalog.runtime.json`; CI build does not call a live API beyond `XA_CATALOG_CONTRACT_READ_URL` (optional env var for catalog seed).
- Stealth mode: supported via env vars. Whether stealth is active on the Cloudflare Pages project is not determinable from the repository — it depends on the runtime env vars set in the dashboard. Per the dispatch, the staging deployment is live and the operator has confirmed it is accessible for user testing; this is treated as an assumption that `XA_STEALTH_MODE` is not set (i.e. stealth is off). Regardless, `apps/xa-b/src/app/robots.ts` defaults to `disallow: "/"` for all user agents unless `XA_ALLOW_INDEXING === "true"` — so crawlers are blocked by default. Evidence: `robots.ts` L21–29.
- Placeholder brand config: `siteConfig.ts` uses env var overrides; staging build uses defaults ("XA-B", "example.com") unless the operator has set `NEXT_PUBLIC_*` vars on the Cloudflare Pages project.
- The "Join Us" hero CTA links to `/account/register` which 404s in static export — this is the most prominent dead-end a reviewer will encounter immediately.

### Delivery & Channel Landscape

- **Audience/recipient:** The intended reviewers are the client/stakeholder behind xa-b (operator knows identity and contact). Secondary audience: operator themselves reviewing before the client session.
- **Channel constraints:** Review is async URL share + optional synchronous screen-share/call. No formal UX lab infrastructure needed.
- **Existing templates/assets:**
  - XA-V2 plan includes task XA-V2-05 (demo script — Pending). No script exists yet at `docs/plans/xa-v2/demo-script.md`.
  - No prior XA user testing artifacts found in `docs/plans/xa-v2/` (only `replan-notes.md` present).
- **Approvals/owners:** Operator owns the review logistics. No separate approvals required for a client walkthrough.
- **Compliance constraints:** The staging URL is public (no Access protection). However, `robots.ts` defaults to `disallow: "/"` even without stealth mode — crawlers are blocked unless `XA_ALLOW_INDEXING=true` is set. Search engine indexing risk is therefore low for the staging period. The operator does not need to take any action on this front for the review.
- **Measurement hooks:** No analytics installed on xa-b staging. Feedback is qualitative only. Post-session, the operator should record notes against a written rubric.

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | The storefront's visual identity and product presentation are compelling to the target client | Client review session | Low (one review call) | 1–2 hours |
| H2 | The demo content (product catalog, copy, pricing display) is sufficiently realistic for the client to evaluate the concept | Client review session | Low | 1–2 hours |
| H3 | The known dead-ends (account routes, non-functional checkout) do not fatally undermine the review session | Review session observation | Low | During session |
| H4 | The "by invitation" positioning resonates with the target audience | Client feedback | Low | 1–2 hours |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Storefront is code-complete with production-grade copy and real product images | Code review of `page.tsx`, `products/[handle]/page.tsx` | Medium (visual quality is present; client reaction is untested) |
| H2 | Demo catalog populated via `catalog.runtime.json`; products have titles, prices, brands, images | `demoData.ts`, catalog file | Medium (data exists; realism depends on catalog content quality) |
| H3 | Account routes are known 404s; checkout shows "Login required" state gracefully | Code review of `checkout/page.tsx`, absence of `/account` directory | High (behaviour is predictable; can be scripted around in demo) |
| H4 | Hero headline "The finest carry goods. By invitation." is set in `siteConfig.ts` | `siteConfig.ts` L74–75 | Low (no client signal yet) |

#### Falsifiability Assessment

- Easy to test: H1, H2, H3, H4 — all tested in a single 60–90 minute review session.
- Hard to test: Reaction from the actual end-customer (members) — out of scope for this session.
- Validation seams needed: A written feedback rubric so that the session produces structured data rather than informal impressions.

#### Recommended Validation Approach

- Quick probes: Operator self-review of staging URL before the client session to verify all core flows render.
- Structured tests: Guided walkthrough of 5–6 defined screens with the client, using a demo script. Client provides yes/no/concern feedback on each screen against defined questions.
- Deferred validation: End-member user testing (separate, post-production, out of scope here).

### Blast-Radius Map

The user testing plan itself does not change any code. The downstream effects of the session are:

- **In-scope:** Feedback items that require landing page or copy changes (would trigger XA-V2-04 or a new plan).
- **In-scope:** Decision on whether CF Access / stealth mode should be enabled for the staging period (XA-V2-02).
- **Out-of-scope:** Production deployment (separate plan).
- **Out-of-scope:** Account system restoration (removed in static export migration; not part of xa-b scope).
- **Accepted inconsistency:** Account-linked FAQ answers and CTA text reference non-functional routes. This is a known, documented limitation for the demo.

### Recent Git History (Targeted)

- `apps/xa-b/` — Last 15 commits since 2026-01-01: static export migration complete (5 waves, commits 94d5712c1 through 85479a0082, all in 2026-02). The app is code-stable; no active development is ongoing.

---

## Questions

### Resolved

- **Q: What is the staging URL pattern?**
  - A: `https://xa-b-site.pages.dev` (main branch) or `https://dev--xa-b-site.pages.dev` (dev branch). CI deploys via `wrangler pages deploy out/ --project-name xa-b-site`.
  - Evidence: `.github/workflows/xa.yml` L134; `docs/plans/xa-v2-plan.md` open questions section (resolved 2026-02-28).

- **Q: Is Cloudflare Access needed to protect the staging URL?**
  - A: No. The app has no middleware (`apps/xa-b/middleware.ts` does not exist); stealth middleware was removed in the static export migration. The `xa-b-site.pages.dev` URL is public. The operator can optionally set `XA_STEALTH_MODE=1` on the Pages project if they want to suppress robots indexing for the staging period, but no CF Access app is required.
  - Evidence: `apps/xa-b/src/app/layout.tsx` L29–36 (stealth mode env var logic); XA-V2-02 task context.

- **Q: Does `/account` exist? Will the "Join Us" hero CTA work?**
  - A: No. `/account` and all sub-routes were removed in Wave 1 of the static export migration (commit 94d5712c1). The "Join Us" hero CTA links to `/account/register` which will 404. This is the most prominent dead-end in the demo. It must be scripted around or the link behaviour noted in the demo script as a known limitation.
  - Evidence: `apps/xa-b/src/app/page.tsx` around L60 (`<Link href="/account/register">Join Us</Link>`); absence of `/account` directory confirmed by bash check.

- **Q: What is xa-b? What does it sell?**
  - A: xa-b is a member-rewards storefront for exclusive-access luxury bags and accessories. The positioning is "by invitation" — members shop curated bags from established designers. The catalog includes bags, clothing, and jewelry across women/men/kids departments. The siteConfig hero copy reads: "The finest carry goods. By invitation." / "Exclusive access to curated bags from established designers." Evidence: `siteConfig.ts` L74–75, `catalogConfig` L54–65.

- **Q: Is there a demo script already?**
  - A: No. XA-V2-05 (demo script) is Pending in the XA-V2 plan. No file exists at `docs/plans/xa-v2/demo-script.md`. The demo script must be created as part of this plan.
  - Evidence: `docs/plans/xa-v2-plan.md` XA-V2-05 task; `docs/plans/xa-v2/` directory contains only `replan-notes.md`.

- **Q: Is there analytics on the staging site?**
  - A: No analytics instrumentation was found in `apps/xa-b/`. The layout does not include GA4 or any analytics provider. Feedback from the review session will be qualitative only.
  - Evidence: `apps/xa-b/src/app/layout.tsx` — no analytics script or provider in the layout tree.

### Open (Operator Input Required)

- **Q: Who is the client/stakeholder for the review session, and how should they be contacted to schedule it?**
  - Why operator input is required: The client identity is not documented anywhere in the codebase. The operator holds this relationship.
  - Decision impacted: Scheduling the session; format (async video vs. live call vs. in-person).
  - Decision owner: Operator.
  - Default assumption: One named client contact will review via a screen-share call.

- **Q: Should the staging URL use real brand name and contact details (by setting `NEXT_PUBLIC_BRAND_NAME`, `NEXT_PUBLIC_SUPPORT_EMAIL`, etc. on the Cloudflare Pages project) before the review, or is the placeholder "XA-B" acceptable?**
  - Why operator input is required: The operator knows whether the client already knows the real brand name, or whether the placeholder is intentional for stealth purposes.
  - Decision impacted: Whether a Cloudflare Pages env-var update is needed before the session (a CI re-trigger step).
  - Decision owner: Operator.
  - Default assumption: If this is a fully internal/confidential review, keeping "XA-B" placeholder is fine. If the client needs to see the real brand, the operator must set the env vars and trigger a new deploy.

- **Q: What is the target date for the review session?**
  - Why operator input is required: Scheduling depends on the client's availability, which the operator controls.
  - Decision impacted: Plan timeline; whether XA-V2-05 (demo script) needs to be completed urgently.
  - Decision owner: Operator.
  - Default assumption: Within 2 weeks of plan approval (i.e., by 2026-03-14).

---

## Confidence Inputs

- **Implementation: 90%** — The deliverable is a doc (user testing plan + demo script). No code changes involved. All content needed to write it is available from the codebase. What raises to 95%+: operator confirming client identity and target date.
- **Approach: 85%** — The approach (operator-led client walkthrough using a written script) is appropriate for this stage. What raises to 90%+: operator confirming the review format (call vs. async) so the script can be tailored.
- **Impact: 75%** — A structured review session has high value compared to an ad-hoc one, but impact depends on whether the client provides actionable feedback. Unknown client engagement level. What raises to 85%+: client confirms attendance and engagement format.
- **Delivery-Readiness: 80%** — Owner: operator (confirmed). Channel: staging URL (live per dispatch). Format: doc + URL share. Approval: operator self-approves. Measurement: qualitative feedback rubric. Gaps: client scheduling not confirmed. What raises to 90%: target date confirmed by operator.
- **Testability: 95%** — The plan itself is a doc; no technical test risk. The session outcome is observable. The staging URL is functional (or will be after XA-V2-01 completes).

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Staging URL is not yet live (XA-V2-01 still Pending) | Medium | High — cannot run review | Operator confirms URL returns 200 before scheduling session. If not live, XA-V2-01 must complete first. |
| Client clicks "Join Us" or "/account" links and encounters 404 | High | Medium — breaks demo flow | Demo script scripts around this: presenter narrates the limitation; "Join Us" treated as a placeholder CTA for the invites feature. |
| Placeholder brand name ("XA-B") confuses or undermines the review | Low-Medium | Medium | Operator decides whether to set real brand name env vars before the session. |
| Staging URL is indexed by search engines | Very Low | Very Low | `robots.ts` defaults to `disallow: "/"` for all crawlers even without stealth mode (confirmed: `apps/xa-b/src/app/robots.ts` L27–29). No action needed. |
| No feedback rubric means session produces only informal impressions | Medium | Medium — feedback unusable | Plan includes a one-page feedback rubric as a deliverable. |
| Client is unavailable within 2-week window | Low-Medium | Low (delay only) | Operator escalates scheduling. |

---

## Planning Constraints & Notes

- **Must-follow patterns:**
  - The demo script should explicitly call out known limitations (account routes, non-functional checkout) so the reviewer is not surprised.
  - The plan must include a feedback rubric (structured questions the client answers during or after the session).
  - The plan should specify a go/no-go decision framework: what feedback signals mean "proceed to production reveal" vs. "make changes first."
- **Rollout/rollback expectations:** Not applicable (this is a doc deliverable; no code is deployed).
- **Observability expectations:** Session notes should be saved to `docs/plans/xa-b-user-testing/session-notes.md` after the review.

---

## Suggested Task Seeds (Non-binding)

1. **Write demo walkthrough script** — A one-page doc that specifies the 6–8 screens to show in order, what to say at each, how to handle dead-ends (especially "Join Us"), and what questions to ask the client. Output: `docs/plans/xa-b-user-testing/demo-script.md`.
2. **Write feedback rubric** — A structured one-page form the client fills in (or the operator fills in based on client responses) covering: visual identity, product presentation, pricing clarity, membership concept, overall confidence. Output: `docs/plans/xa-b-user-testing/feedback-rubric.md`.
3. **Confirm staging URL is live** — Verify `https://xa-b-site.pages.dev/` returns 200 and core routes render. If not, XA-V2-01 must complete first.
4. **Optional: set real brand name env var** — If the operator wants the real brand name to appear, set `NEXT_PUBLIC_BRAND_NAME` (and optionally other contact env vars) on the Cloudflare Pages project and trigger a new deploy.
5. **Schedule the review session** — Operator contacts the client with the staging URL and a proposed time slot.
6. **Record session notes** — After the session, save structured notes to `docs/plans/xa-b-user-testing/session-notes.md` and triage feedback against a go/no-go decision.

---

## Execution Routing Packet

- **Primary execution skill:** lp-do-build (doc production)
- **Supporting skills:** none
- **Deliverable acceptance package:**
  - `docs/plans/xa-b-user-testing/demo-script.md` exists and covers ≥6 screens with talking points and known limitation call-outs.
  - `docs/plans/xa-b-user-testing/feedback-rubric.md` exists with ≥5 structured questions.
  - Staging URL confirmed live (operator-verified).
- **Post-delivery measurement plan:** After the review session, operator saves `docs/plans/xa-b-user-testing/session-notes.md`. Go/no-go decision is documented in that file.

---

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Route inventory (all screens that exist) | Yes | None | No |
| Known demo dead-ends (account routes) | Yes | None — documented as known limitation | No |
| Staging URL format and CI mechanism | Yes | None | No |
| Demo content readiness (catalog, copy) | Yes | Placeholder brand name — operator decision required | No |
| Analytics / feedback capture mechanisms | Yes | No analytics installed; feedback is qualitative only | No |
| Existing demo/testing artifacts | Yes | None exist yet; XA-V2-05 is Pending | No |
| Client identity and scheduling logistics | No | Operator-only knowledge; 3 open questions | No (advisory) |
| Brand name placeholder in staging build | Partial | Placeholder "XA-B" visible; operator must decide | No |
| robots.ts default behaviour | Yes | Default is `disallow: "/"` — crawlers blocked without stealth mode; corrected in compliance section | No |

No Critical scope gaps found. Three advisory open questions (client identity, brand name decision, and target date) are operator-only knowledge; they do not block the plan from being written.

---

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity:** All claims about routes, config, demo data, and CI are traced to specific files read during this investigation. Inferred claims (e.g. that the checkout flow shows "Login required" gracefully) are verified by reading `checkout/page.tsx` L39–63 (session fetch with fallback).
2. **Boundary coverage:** The demo scope is bounded to static export behaviour. No API boundaries exist (static site). The known boundary gap (account routes = 404) is documented and scripted around.
3. **Business validation coverage:** Hypotheses are explicit and all testable in a single review session. Signal coverage is marked as "untested" where appropriate (H4 — client reaction to positioning).
4. **Minimum evidence floor:** ≥1 hypothesis present; Delivery-Readiness is 80% (above the 60% floor for business track).

### Confidence Adjustments

- Impact score reduced from initial estimate of 85% to 75% to reflect the unknown client engagement level. The deliverable itself has high value, but the session outcome is outside the operator's control.
- Delivery-Readiness capped at 80% (not 90%) because the target date is unconfirmed.

### Remaining Assumptions

- The operator will confirm the staging URL is live before scheduling the review.
- The review will be a synchronous screen-share call (default assumption; async is also viable but the demo script will need adaptation).
- The client has already been told about xa-b at a high level and does not need a cold introduction — the review is a product walkthrough, not a pitch.

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None. Open questions are advisory (scheduling, brand name decision) and do not block the plan from being written. The plan tasks can be completed independently; scheduling will be filled in by the operator.
- Recommended next step: `/lp-do-plan xa-b-user-testing --auto`

---

## Critique History

### Round 1 (codemoot route)

- Artifact: `docs/plans/xa-b-user-testing/fact-find.md`
- codemoot score: 7/10 → lp_score: 3.5 (partially credible — triggers Round 2)
- Severity counts: Critical 0 / Major 4 (WARNING) / Minor 1 (INFO)

**Pre-critique factcheck gate:** The artifact contains specific file paths and architectural claims. The codemoot review identified 4 factual errors in the initial draft. Verified claims include:
- `apps/xa-b/src/app/page.tsx` — hero CTA link to `/account/register`: confirmed around L60.
- `apps/xa-b/src/app/layout.tsx` — no analytics provider: confirmed by reading full layout tree.
- `apps/xa-b/src/app/checkout/page.tsx` — session fetch + graceful fallback: confirmed at L36–63.
- Absence of `/account` directory: confirmed by bash `ls` check.
- CI URL pattern `xa-b-site`: confirmed at `.github/workflows/xa.yml` L134.
- `apps/xa-b/src/app/robots.ts` — default `disallow: "/"` behaviour: confirmed by reading file (L27–29).

**Round 1 findings and fixes applied:**

1. **WARNING (Major) — L41: XA-V2-01 non-goal mis-mapping:** Original text stated "Production deployment planning (covered by XA-V2-01)" — incorrect; XA-V2-01 is a staging deploy task, not production. Fixed: reworded to "Cloudflare Pages project setup and CI deploy (covered by XA-V2-01 — that is a staging infrastructure task; production deployment is a separate future concern)."

2. **WARNING (Major) — L145: Incorrect robots behaviour:** Original stated "Metadata robots tags default to indexable when stealth is off." Incorrect — `robots.ts` defaults to `disallow: "/"` unless `XA_ALLOW_INDEXING === "true"`. Fixed: updated Patterns section and Compliance section with verified behaviour from `apps/xa-b/src/app/robots.ts` L21–29.

3. **WARNING (Major) — L157: Compliance guidance based on incorrect robots assumption:** Same root cause as finding 2. Fixed: compliance section now correctly states crawlers are blocked by default; no action needed from the operator.

4. **WARNING (Major) — L90: Missing `/collections` route:** `apps/xa-b/src/app/collections/page.tsx` exists but was omitted from route map. Fixed: added `/collections` (Collections index) to route map.

5. **INFO (Minor) — L324: "2 open questions" count incorrect:** Three operator-input questions are listed. Fixed: updated simulation trace and narrative to say "3 open questions."

### Round 2 (codemoot route)

- All 4 Major findings from Round 1 resolved in the artifact before Round 2.
- Round 2 triggered per protocol (4 Major findings in Round 1).
- codemoot score: 8/10 → lp_score: 4.0 (credible).
- Severity counts: Critical 0 / Major 1 (WARNING) / Minor 1 (INFO).
- Raw output: updated in `docs/plans/xa-b-user-testing/critique-raw-output.json`.

**Round 2 findings and fixes applied:**

1. **WARNING (Major) — L146: Stealth env var state not provable from code:** "inactive at xa-b-site.pages.dev (no env var set)" is an unverifiable runtime claim. Fixed: reworded to clearly mark this as an assumption based on operator dispatch context, and noted that crawlers are blocked by default regardless via `robots.ts`.

2. **INFO (Minor) — L372: Stale line reference:** Hero CTA link around L60 in `page.tsx`, not L61. Fixed: updated to "around L60" in both the critique log and the inline evidence reference in the resolved questions section.

**Verdict (Round 2):** credible. lp_score 4.0 ≥ 4.0 threshold. No Critical findings across either round. Status confirmed: Ready-for-planning.
