---
Type: Fact-Find
Outcome: Planning
Status: Needs-input
Domain: SELL
Workstream: Mixed
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: caryina-brand-contact-email
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Dispatch-ID: IDEA-DISPATCH-20260314180007-HBAG-008
---

# Caryina Brand Contact Email Fact-Find Brief

## Scope

### Summary

The customer-facing contact email for Caryina is `hostelpositano@gmail.com` — the email
address of the Brikette hostel business, not a Caryina brand email. This appears on the
support page, in four legal policy documents (Terms, Privacy, Returns, Cookie Policy), in
order-confirmation emails sent to customers, and in the returns-request system email.

The fix has two components: (1) a business decision — what the brand email address should
be and how it is routed; and (2) a code change — updating the constant, fixing a hardcoded
occurrence on the support page that is not wired to the constant, and updating two separate
tracked copies of the generated site content JSON file.

A secondary finding: `COMPANY_WEBSITE = "https://hostel-positano.com"` is a second hostel-branded
constant in `legalContent.ts:27`, which appears in the Terms of Sale text as "Company website:
hostel-positano.com". Changing only the email still leaves hostel branding in legal copy.
This should be updated to `https://caryina.com` in the same pass.

A tertiary finding: `MERCHANT_NOTIFY_EMAIL` (internal ops alerts: checkout anomalies,
notify-me captures, order notifications) defaults to `peter.cowling1976@gmail.com` in three
files. This is not customer-facing but should be a proper operational address.

### Goals

- Replace `hostelpositano@gmail.com` with a brand email across all customer-facing surfaces.
- Fix the `support/page.tsx` hardcoding to use the centralised `CONTACT_EMAIL` constant
  (currently diverged from the constant, will not update when the constant changes).
- Update **both** tracked copies of the generated site-content JSON — `contentPacket.ts`
  resolves from multiple `cwd()` candidates: `apps/caryina/data/shops/caryina/site-content.generated.json`
  and `data/shops/caryina/site-content.generated.json` are both live candidates.
- Update `COMPANY_WEBSITE` from `https://hostel-positano.com` to `https://caryina.com`
  in `legalContent.ts:27` — it appears in Terms of Sale body text.
- Recommend an env-var approach so the email is configurable without code deploys; use a
  safe compile-time fallback for dev/SSR — not a hard fail (CONTACT_EMAIL is used at
  render time on legal pages; a missing env var must not crash page rendering).
- Surface the `MERCHANT_NOTIFY_EMAIL` gap for the operator to address in the same pass.

### Non-goals

- Setting up or migrating the email delivery infrastructure (SMTP/Resend) — this is
  governed by a separate env-var decision and is already partially in `.env.example`.
- Changing the legal entity details (Skylar SRL, VAT number, registered address) — those
  remain correct and unchanged.

### Constraints & Assumptions

- Constraints:
  - `CONTACT_EMAIL` is a compile-time constant in `legalContent.ts`. Until an env-var
    pattern is added, changing the email requires a code change and redeploy.
  - `caryina.com` is already the brand domain used in sitemap, robots, and notification
    email links. A `@caryina.com` address would be consistent with existing brand assets.
- Assumptions:
  - The operator controls or can set up email forwarding on `caryina.com` (this is an
    open question — see below).
  - A simple email forward (e.g. `hello@caryina.com` → personal Gmail) is acceptable as
    the first solution, without needing a full Google Workspace or Resend setup.

## Outcome Contract

- **Why:** A fashion brand's only customer contact email being a hostel Gmail address damages
  perceived legitimacy. Customers who see `hostelpositano@gmail.com` on the support page or
  in their order confirmation email may question whether Caryina is a real, independent brand.
  A brand email address has outsized trust impact for minimal cost.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Caryina uses a dedicated brand email address on its own
  domain for all customer-facing contact. The hostel email no longer appears on any
  customer-facing page, policy document, or system email.
- **Source:** auto

## Current Process Map

- **Trigger:** A customer visits the support page, receives an order confirmation, submits
  a returns request, or reads any policy document.
- **End condition:** Customer sees or receives `hostelpositano@gmail.com` as the brand contact.

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Support page | Customer navigates to `/[lang]/support` → page renders with hardcoded `hostelpositano@gmail.com` as `href` and display text | `apps/caryina/src/app/[lang]/support/page.tsx:80-82` | `support/page.tsx:80-82` | Email is hardcoded in JSX, not using `CONTACT_EMAIL` constant — will not auto-update when constant is changed |
| Legal policies | `CONTACT_EMAIL` constant imported from `legalContent.ts` and interpolated into Terms, Privacy, Returns, Cookie Policy text | `legalContent.ts:25, 45, 137, 270, 373` | `legalContent.ts` | Single constant controls all four policy documents — updating the constant updates all four |
| Order confirmation emails | `notifications.server.ts` imports `CONTACT_EMAIL` and includes it in the customer-facing confirmation email body | `notifications.server.ts:96` | `notifications.server.ts` | Updates automatically with constant |
| Returns-request flow | Customer submits returns form → system emails customer (confirming receipt) and emails merchant (to action the request) at `CONTACT_EMAIL` | `returns-request/route.ts:70, 82` | `route.ts:82` | Returns go to the hostel Gmail; correct address needed to reach the Caryina operator |
| Generated site content | `site-content.generated.json` channels EN copy includes `hostelpositano@gmail.com` hardcoded as human-readable text | `data/shops/caryina/site-content.generated.json:164` | Generated file | Requires regeneration or direct edit to update |
| Merchant ops alerts | Checkout anomalies and notify-me captures sent to `MERCHANT_NOTIFY_EMAIL` env var, defaulting to `peter.cowling1976@gmail.com` | `checkoutReconciliation.server.ts:22`, `notify-me/route.ts:46` | `.env.example:17` | Not customer-facing but not a brand address; requires env var in production to override |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/lib/legalContent.ts:25` — `CONTACT_EMAIL` constant, single source of truth for all policy documents
- `apps/caryina/src/app/[lang]/support/page.tsx:80-82` — support page hardcodes the email directly (not via constant)

### Key Modules / Files

- `apps/caryina/src/lib/legalContent.ts` — defines `CONTACT_EMAIL = "hostelpositano@gmail.com"` at line 25 (used in 4 policy sections at lines 45, 137, 270, 373); also defines `COMPANY_WEBSITE = "https://hostel-positano.com"` at line 27 (used in Terms of Sale at line 45 as "Company website: hostel-positano.com") — a second hostel-branded value needing correction
- `apps/caryina/src/app/[lang]/support/page.tsx` — JSX hardcodes email at lines 80, 82 independently of the constant; a divergence bug — the two will desync if only the constant is updated
- `apps/caryina/src/lib/payments/notifications.server.ts:96` — uses `CONTACT_EMAIL` in customer order-confirmation email body
- `apps/caryina/src/app/api/returns-request/route.ts:82` — uses `CONTACT_EMAIL` as the `to:` address for inbound returns requests
- `apps/caryina/src/app/[lang]/success/page.tsx:114,116` — uses `CONTACT_EMAIL` via `href` and display on post-purchase success page
- `apps/caryina/data/shops/caryina/site-content.generated.json:164` — EN channels copy hardcodes the email as prose text; a second tracked copy also exists at `data/shops/caryina/site-content.generated.json:164` — both must be updated (contentPacket.ts resolves from multiple cwd() candidates at lines 108–113)
- `apps/caryina/.env.example` — already declares `MERCHANT_NOTIFY_EMAIL=your-email@example.com`; separately declares `EMAIL_FROM=noreply@yourdomain.com` for Resend path

### Patterns & Conventions Observed

- `CONTACT_EMAIL` constant pattern is already established in `legalContent.ts` — all policy documents consume it. The pattern is correct; the value is wrong.
- `support/page.tsx` is the only surface that bypasses the constant — a pre-existing divergence bug. — evidence: `support/page.tsx:77-83`
- `MERCHANT_NOTIFY_EMAIL` env var is the correct pattern for the ops-side email — already in `.env.example` — evidence: `.env.example:17`; fallback to personal Gmail exists in three files: `checkoutReconciliation.server.ts:22`, `notify-me/route.ts:46`, and `notifications.server.ts:17`

### Data & Contracts

- Types/schemas/events:
  - `CONTACT_EMAIL: string` — plain string export from `legalContent.ts`
  - No schema or type contract wrapping it; safe to change value directly
- Persistence:
  - Two tracked copies of `site-content.generated.json` contain a hardcoded copy in the `channels` text — requires regeneration via the content generation pipeline or direct string replacement in both JSON files (JSON does not support inline comments; the build task should note both file paths explicitly to avoid missing one)
- API/contracts:
  - `returns-request/route.ts` uses `CONTACT_EMAIL` as the `to:` recipient for inbound support emails — if the email changes, the operator must ensure the new address is monitored and responsive

### Dependency & Impact Map

- Upstream dependencies:
  - Operator must provide the target brand email address (open question — blocking)
  - If using `@caryina.com`, operator must have domain email routing configured (MX records, forwarding, or a mail service)
- Downstream dependents:
  - All four legal policy documents — auto-update via constant
  - Customer order-confirmation emails — auto-update via constant
  - Returns-request inbound emails — the new address must be actively monitored; missed returns requests are a customer service failure
  - Support page — requires separate fix (hardcoded, not via constant)
  - Generated site content — requires manual update to JSON or content regeneration
- Likely blast radius:
  - Low risk: only string value changes, no logic or schema changes
  - One meaningful risk: if the new email is not actively monitored, returns and support requests will go unread

### Test Landscape

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Returns-request route | Unit | `route.test.ts` | Tests include `to: "hostelpositano@gmail.com"` as a direct assertion at line 53 — will fail after value changes; must be updated to import `CONTACT_EMAIL` or use the new value |
| Support page | None observed | — | No test for support page rendering |
| Notifications | None observed | — | No test for notification email bodies |

#### Coverage Gaps

- `route.test.ts` has `to: "hostelpositano@gmail.com"` hardcoded at line 53 — will fail after the constant changes. Must be updated alongside the code change.
- Support page has no test. Post-change, a smoke render test would catch future hardcoding regressions.

#### Recommended Test Approach

- Update `route.test.ts` to use the new address (or import `CONTACT_EMAIL` from `legalContent.ts` in the test).
- No new test infrastructure needed; this is a string value change.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | Support page renders hardcoded email at `support/page.tsx:80-82`; success page renders via CONTACT_EMAIL | Support page bypass of constant is a pre-existing bug | Yes — fix hardcoding in support/page.tsx |
| UX / states | N/A | No state logic involved | — | No |
| Security / privacy | Required | CONTACT_EMAIL appears in Privacy Policy as the GDPR data-rights contact address — must be a monitored, responsive address | If new address is unmonitored, privacy rights requests go unacknowledged — a GDPR compliance risk | Yes — operator must confirm monitoring |
| Logging / observability / audit | N/A | No logging changes | — | No |
| Testing / validation | Required | `route.test.ts:53` has email hardcoded — will break after change | Test must be updated | Yes |
| Data / contracts | Required | `site-content.generated.json:164` hardcodes the email in prose — separate from constant | Generated file must be updated | Yes |
| Performance / reliability | N/A | String constant change; no performance implications | — | No |
| Rollout / rollback | Required | Low risk rollout; rollback is updating the constant value. Key dependency: new email must be live and monitored before deploying | If new email is dead on deploy, returns and privacy requests are silently lost | Yes |

## Questions

### Resolved

- Q: Where is `CONTACT_EMAIL` used in code?
  - A: 7 locations — `legalContent.ts` (definition + 4 interpolations into policy text), `notifications.server.ts:96`, `returns-request/route.ts:82`, `success/page.tsx:114,116`. One additional hardcoding in `support/page.tsx:80-82` that bypasses the constant.
  - Evidence: `grep -rn "CONTACT_EMAIL\|hostelpositano" apps/caryina/src/`

- Q: Is `caryina.com` already the brand domain?
  - A: Yes. `robots.ts`, `sitemap.ts`, `shop/page.tsx`, `product/[slug]/page.tsx`, `page.tsx` all use `process.env.NEXT_PUBLIC_SITE_URL ?? "https://caryina.com"`. Notification emails link to `caryina.com/en/*`. A `@caryina.com` email would be consistent.
  - Evidence: `grep -rn "caryina.com" apps/caryina/src/`

- Q: Is there already an env-var pattern for email configuration?
  - A: Yes — `MERCHANT_NOTIFY_EMAIL` in `.env.example:17` is the correct pattern. `CONTACT_EMAIL` is currently a hardcoded constant rather than env-var driven; the recommended fix is to add `CARYINA_CONTACT_EMAIL` env var with a safe fallback string and a startup `console.warn` when the env var is absent. A hard-fail-if-unset approach must be avoided — `CONTACT_EMAIL` is imported at SSR render time by all legal page routes; an unset env var must not crash page rendering.
  - Evidence: `.env.example`, `legalContent.ts:25`

- Q: Does the support page use `CONTACT_EMAIL`?
  - A: No. It hardcodes `hostelpositano@gmail.com` directly in JSX at lines 80 and 82. This is a pre-existing divergence bug — changing the constant will not fix the support page.
  - Evidence: `support/page.tsx:77-83`

### Open (Operator Input Required)

- Q: What should the brand email address be?
  - Why operator input is required: Only the operator knows which address to use, whether `caryina.com` has email routing set up (MX records, Google Workspace, Zoho, Cloudflare email routing, or simple forwarding), and whether a new mail service needs to be configured.
  - Decision impacted: The value of `CONTACT_EMAIL`, whether an env var needs to accompany a mail service setup, and whether the `MERCHANT_NOTIFY_EMAIL` is the same address or a different one.
  - Decision owner: Operator (Peter)
  - Default assumption (if any) + risk: `hello@caryina.com` is the logical candidate given `caryina.com` is the brand domain, but this cannot be deployed without confirming mail routing exists. If deployed without routing, returns requests, GDPR requests, and support contacts are silently lost.

## Confidence Inputs

- Implementation: 95% — All 7 code locations identified; change is a string value update with one additional fix for the hardcoded support page.
- Approach: 90% — Mixed track is the correct framing; approach is clear pending the one operator decision.
- Impact: 85% — Impact is direct and immediate. Risk is low (string change), benefit is concrete (credibility, compliance).
- Delivery-Readiness: 40% — Blocked on operator confirming the brand email address and mail routing setup. All code changes can proceed immediately once the address is known.
- Testability: 90% — `route.test.ts` hardcoding identified; update is straightforward.

For scores above 80%: implementation and testability are already above threshold. Delivery-readiness blocks at 40% pending operator input. Approach reaches 90% once the address is confirmed.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| New email unmonitored on deploy — returns requests and GDPR privacy requests silently lost | Medium | High | Operator must confirm the email is live and monitored before deployment; add a note to the deployment checklist |
| `caryina.com` has no email routing configured — brand email unusable | Medium | High | Operator must verify MX records or configure Cloudflare Email Routing / Google Workspace before committing the address |
| `support/page.tsx` hardcoding not caught — still shows hostel email after constant is updated | Low (known) | Medium | Fix is identified and explicit in the task list; include in acceptance criteria |
| `site-content.generated.json` not updated — EN channel copy still references hostel email | Low | Low | Direct edit of generated file is sufficient; flag in acceptance criteria |
| `MERCHANT_NOTIFY_EMAIL` left as personal Gmail — ops alerts still go to personal email | Medium | Low | Low customer impact but messy; recommend operator provides a proper ops address at the same time |

## Planning Constraints & Notes

- Must-follow patterns:
  - Do not change `legalContent.ts` legal entity details (name, address, VAT). Permitted changes in scope: `CONTACT_EMAIL` (email value) and `COMPANY_WEBSITE` (hostel URL → caryina.com).
  - Keep `CONTACT_EMAIL` as a single exported constant; do not scatter the value across files.
  - Recommend adding env var `CARYINA_CONTACT_EMAIL` with a safe compile-time fallback (e.g. `"configure-me@caryina.com"` in dev, log a startup warning when fallback is active in production). Do **not** use a hard-fail-if-unset pattern — `CONTACT_EMAIL` is imported at SSR render time by all legal pages; a missing env var must not crash page rendering.
- Rollout/rollback expectations:
  - The new email must be live and monitored before deployment. Rollback = change the constant back and redeploy (low risk).
  - If using env var, rollback is setting the env var to the old address.
- Observability expectations:
  - No new observability needed for the email change itself.
  - Recommend a sentence in deployment notes: "Verify returns-request emails arrive at the new address by sending a test submission."

## Suggested Task Seeds (Non-binding)

1. **[Operator]** Confirm target brand email address and verify `caryina.com` email routing is active.
2. **[Code]** Add `CARYINA_CONTACT_EMAIL` env var support to `legalContent.ts` — use safe fallback with startup warning (not hard fail); update `.env.example`.
3. **[Code]** Update `CONTACT_EMAIL` value to the confirmed brand address.
4. **[Code]** Update `COMPANY_WEBSITE` from `https://hostel-positano.com` to `https://caryina.com` in `legalContent.ts:27`.
5. **[Code]** Fix `support/page.tsx:80-82` — replace hardcoded email with `CONTACT_EMAIL` import.
6. **[Code]** Update both tracked JSON copies: `apps/caryina/data/shops/caryina/site-content.generated.json:164` AND `data/shops/caryina/site-content.generated.json:164` — EN channels prose.
7. **[Code]** Update `route.test.ts:53` to use `CONTACT_EMAIL` import (or new value).
8. **[Operator]** Set `MERCHANT_NOTIFY_EMAIL` env var in production to a proper operational address (affects `checkoutReconciliation.server.ts`, `notify-me/route.ts`, and `notifications.server.ts`).

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `hostelpositano@gmail.com` does not appear in any customer-facing file, policy, or email
  - `support/page.tsx` uses `CONTACT_EMAIL` constant (not hardcoded)
  - `route.test.ts` passes with updated email
  - `.env.example` documents `CARYINA_CONTACT_EMAIL` as a required field
- Post-delivery measurement plan:
  - Manual: send a test returns request and confirm it arrives at the new address
  - Manual: load the support page and confirm it shows the new address

## Evidence Gap Review

### Gaps Addressed

- All 7 code occurrences of the hostel email identified and verified.
- The `support/page.tsx` hardcoding (diverged from constant) identified.
- The `site-content.generated.json` hardcoded prose copy identified.
- The `MERCHANT_NOTIFY_EMAIL` secondary gap surfaced.
- Test impact in `route.test.ts` identified.

### Confidence Adjustments

- Implementation confidence high (95%) — exhaustive grep confirms the complete surface.
- Delivery-readiness low (40%) — solely gated on one operator decision (email address + routing).

### Remaining Assumptions

- `caryina.com` is available for email use. **Must be confirmed by operator.**
- Simple forwarding is acceptable as a v1 approach (no full mail service required).

## Scope Signal

- **Signal:** `limited-thinking`
- **Rationale:** The code change scope is very narrow (3 files, 1 constant update). The operator decision unlocks everything. While the immediate scope is right-sized, there is clear adjacent work that should be done in the same pass at low incremental cost.

### Expansion Suggestions

1. **Add `CARYINA_CONTACT_EMAIL` env var with safe fallback**
   - What to add: Make `CONTACT_EMAIL` env-var driven instead of a hardcoded constant. Use a safe fallback string (e.g. `"configure-me@caryina.com"`) with a startup `console.warn` when the env var is not set, rather than a hard fail — legal pages import `CONTACT_EMAIL` at SSR render time and a missing env var must not crash page rendering.
   - Expected upside: Future email changes require only an env var update, not a code deploy. Startup warning catches misconfiguration before it silently uses the wrong address.
   - Added risk/cost: Minimal — adds one env var, one fallback+warn in `legalContent.ts`, and one line in `.env.example`.

2. **Fix `MERCHANT_NOTIFY_EMAIL` default in the same pass**
   - What to add: The `MERCHANT_NOTIFY_EMAIL` default (`peter.cowling1976@gmail.com`) is a personal email. Set a proper value in production (and add `.env.example` guidance) alongside the customer-facing fix.
   - Expected upside: All email addresses in the Caryina system become brand/ops appropriate in one pass; no follow-up needed.
   - Added risk/cost: Operator-only action (env var in production); zero code change.

3. **Replace `support/page.tsx` hardcoding with `CONTACT_EMAIL` import as a lint rule**
   - What to add: After fixing the hardcoding, add a comment or small lint guard (e.g. a grep CI check) to prevent future hardcoding of email addresses in JSX.
   - Expected upside: Prevents the divergence bug from reoccurring.
   - Added risk/cost: Very low — can be a simple `validate-changes.sh` grep gate.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `legalContent.ts` constant | Yes | None | No |
| `support/page.tsx` hardcoding | Yes | [Correctness] [Major]: hardcoded email bypasses constant — won't update with constant change | Yes — explicit task in seeds |
| Policy documents (Terms, Privacy, Returns, Cookie) | Yes | None — all use constant | No |
| `notifications.server.ts` (order confirmation emails) | Yes | None — uses constant | No |
| `returns-request/route.ts` (inbound returns `to:` address) | Yes | None — uses constant; monitoring risk noted | No (monitoring risk in risks table) |
| `success/page.tsx` (post-purchase page) | Yes | None — uses constant | No |
| `site-content.generated.json` (generated EN copy) | Yes | [Correctness] [Minor]: hardcoded prose string not via constant | Yes — explicit task in seeds |
| `route.test.ts` test | Yes | [Testing] [Major]: hardcoded expected email will fail after constant change | Yes — explicit task in seeds |
| `MERCHANT_NOTIFY_EMAIL` (ops email) | Partial | [Correctness] [Minor]: defaults to personal Gmail in prod | Advisory — operator env var action |
| Email routing on `caryina.com` | No — operator knowledge required | [Unknowns] [Blocking]: cannot verify without operator confirmation | Yes — blocking open question |

## Analysis Readiness

- **Status: Needs-input**
- Blocking items:
  - **[Operator required]** What is the target brand email address? Is `caryina.com` configured for email routing (MX records, forwarding service, or mail service)?
- Recommended next step:
  - Operator provides the confirmed brand email address (e.g. `hello@caryina.com` or another address).
  - Once confirmed, all code locations are known and the build can proceed directly via `/lp-do-build` — no further analysis needed.
  - If `caryina.com` email routing is not yet set up, a brief infrastructure note is needed (Cloudflare Email Routing, Google Workspace, or Resend `EMAIL_FROM` update) before deploying.
