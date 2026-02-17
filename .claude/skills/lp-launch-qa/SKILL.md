---
name: lp-launch-qa
description: Pre-launch quality assurance gate for startup loop (S9B). Validates conversion flows, SEO technical readiness, performance budget, and legal compliance before a site goes live.
---

# Launch QA Gate

Pre-launch quality assurance gate for the startup loop (S9B). Validates conversion flows, SEO technical readiness, performance budget, and legal compliance before a site goes live or launches an experiment.

**Operating mode:** AUDIT + GATE. This skill performs read-only checks and produces a pass/fail checklist with evidence. No code changes, no deployments — only validation and go/no-go assessment.

## Purpose

Prevent embarrassing launch failures by systematically verifying the five critical domains that separate a built site from a production-ready site:
- Conversion machinery (forms submit, checkout flows, analytics fire)
- SEO technical health (indexing, canonicals, structured data)
- Performance budget (Core Web Vitals, asset sizes, critical rendering path)
- Legal compliance (GDPR, cookie consent, terms, returns policy, disclaimers)
- Measurement infrastructure (GA4 staging/production isolation, Consent Mode v2, DNS redirects)

This is the **final gate** before S10 (launch/experiment). If any domain fails, the site is not ready.

## Invocation

```
/lp-launch-qa --business <BIZ> [--domain conversion|seo|performance|legal|measurement|all]
```

**Arguments:**
- `--business`: Business unit code (`BRIK`, `PLAT`, `PIPE`, `BOS`) — determines which site/app to audit
- `--domain`: Optional scope filter. Default: `all` (run all five domains)

**Fast path examples:**
```
/lp-launch-qa --business BRIK
/lp-launch-qa --business PIPE --domain conversion
/lp-launch-qa --business BRIK --domain seo
```

**When to use:**
- After `/lp-build` completes S9 (Build MVP site)
- Before `/lp-launch` (S10) or any experiment that drives external traffic
- As a periodic health check on live production sites (diagnostic mode)

**When NOT to use:**
- During development (too early — site isn't built yet)
- For non-customer-facing internal tools (legal/SEO domains may not apply)
- As a replacement for `/lp-plan` validation contracts (this is a pre-launch audit, not a build-time validation)

## Operating Mode

**AUDIT + GATE (read-only)**

**Allowed:**
- Read deployed site (staging or production URL)
- Run automated checks (Lighthouse, crawler tests, form submission smoke tests)
- Read configuration files (analytics IDs, sitemap paths, robots.txt, legal doc paths)
- Inspect network requests (analytics beacons, API calls, third-party scripts)
- Read source code to verify implementation patterns (analytics wiring, schema markup)

**Not allowed:**
- Code changes
- Config changes
- Deployments
- Destructive commands
- Committing fixes (flag issues for a follow-up build task instead)

**Commits allowed:**
- QA report artifact: `docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md`
- Update to startup loop checkpoint: `docs/business-os/startup-baselines/<BIZ>/loop-state.json` (S9B checkpoint)

## Inputs

### Required (from invocation)
- Business unit code (`--business`)
- Optional domain scope (`--domain`)

### Discovery (from existing artifacts)
- Site baseline: `docs/business-os/site-upgrades/<BIZ>/latest.user.md`
- Platform capability baseline: `docs/business-os/platform-capability/latest.user.md`
- Startup loop state: `docs/business-os/startup-baselines/<BIZ>/loop-state.json`
- Build plan: `docs/plans/<feature-slug>-plan.md` (if linked from loop state)
- Deployment URL: read from loop state or site baseline (staging vs. production)

**If baseline/loop-state is missing:**
- STOP and report: "Baseline missing. Run `/lp-fact-find` with `Startup-Deliverable-Alias: website-upgrade-backlog` to create site baseline before launch QA."

## Workflow

### 1) Intake and discovery

**1a) Validate arguments**
- Confirm `--business` is a valid business unit code
- Confirm `--domain` is one of: `conversion`, `seo`, `performance`, `legal`, `measurement`, `all` (or omitted, defaults to `all`)

**1b) Locate site baseline and loop state**
- Read `docs/business-os/site-upgrades/<BIZ>/latest.user.md` to get deployment URL, analytics config, expected conversion flows, legal doc paths
- Read `docs/business-os/startup-baselines/<BIZ>/loop-state.json` to confirm S9 (build) is complete and S9B (launch QA) is the current checkpoint
- If loop state is missing or S9 is incomplete: STOP and report "Build incomplete. Complete `/lp-build` on S9 tasks before running launch QA."

**1c) Identify deployment target**
- For pre-launch audit: use staging URL from site baseline
- For production health check: use production URL
- If both exist, default to staging unless user specifies production explicitly

**1d) Read platform capability baseline**
- Confirm analytics platform (GA4, Plausible, custom)
- Confirm SEO infrastructure (sitemap generation, schema.org support, meta tag patterns)
- Confirm performance baseline expectations (target Core Web Vitals, asset budget)

### 2) Execute domain checks (per domain)

Run checks for the selected domain(s). Each check produces **pass/fail + evidence**.

For `--domain all`, run all five domains sequentially.

#### Domain 1: Conversion QA

**Goal:** Verify that revenue-generating flows work end-to-end and are instrumented for measurement.

**Checks:**

- **C1: Primary conversion flow submits successfully**
  - **What:** Navigate to primary conversion entry point (booking form, contact form, preorder form), fill with test data, submit
  - **Pass condition:** Form submits without errors; success state renders; no console errors
  - **Evidence:** Screenshot of success state + network log showing form POST + response status
  - **Fail condition:** Form errors, validation blocks submission, network failure, no success feedback

- **C2: Conversion analytics event fires**
  - **What:** Inspect network tab during form submission for analytics beacon (GA4 event, Plausible goal, custom event)
  - **Pass condition:** Analytics event fires with correct event name and parameters (e.g., `form_submit`, `booking_start`)
  - **Evidence:** Network request screenshot showing analytics payload with event name
  - **Fail condition:** No analytics event, wrong event name, missing required parameters

- **C3: Lead/order data reaches backend**
  - **What:** If applicable, verify form submission creates a record in CRM/database (check admin panel, logs, or API response)
  - **Pass condition:** Record appears in expected system with correct data
  - **Evidence:** Screenshot of CRM entry or log line showing record creation
  - **Fail condition:** No record created, data missing or malformed
  - **Note:** Skip if conversion is purely informational (no backend persistence)

- **C4: Error states render correctly**
  - **What:** Submit form with intentionally invalid data (missing required field, invalid email format)
  - **Pass condition:** Inline validation errors appear; form does not submit; user can correct and retry
  - **Evidence:** Screenshot of validation error UI
  - **Fail condition:** Form submits with invalid data, no error feedback, confusing error messages

- **C5: Checkout flow completeness (if applicable)**
  - **What:** For e-commerce/booking sites, walk through full checkout (add to cart → checkout → payment screen)
  - **Pass condition:** All steps render; payment gateway loads (do not complete payment); cart state persists across steps
  - **Evidence:** Screenshot of each checkout step including payment screen
  - **Fail condition:** Broken step, cart resets, payment gateway fails to load
  - **Note:** Skip if site has no checkout flow

**Conversion domain pass criteria:** All applicable checks pass. One failure blocks launch.

#### Domain 2: SEO Technical Readiness

**Goal:** Verify that search engines can discover, crawl, index, and understand the site.

**Checks:**

- **S1: Sitemap exists and is valid**
  - **What:** Fetch `/sitemap.xml` (or sitemap path from baseline); parse and validate structure
  - **Pass condition:** Sitemap returns 200, valid XML, includes expected URLs (home, key landing pages, legal pages)
  - **Evidence:** Sitemap URL + XML snippet showing valid structure + URL count
  - **Fail condition:** 404, malformed XML, empty sitemap, missing critical URLs

- **S2: Robots.txt allows indexing**
  - **What:** Fetch `/robots.txt`; verify `Disallow: /` is NOT present for production (allowed for staging)
  - **Pass condition:** robots.txt allows crawling of public pages; sitemap referenced in robots.txt
  - **Evidence:** robots.txt content snippet
  - **Fail condition:** Production site blocks all crawlers, sitemap not referenced

- **S3: Canonical tags are correct**
  - **What:** Inspect key pages (home, landing pages, legal pages) for `<link rel="canonical">` tags
  - **Pass condition:** Canonical tag present, points to self or correct primary URL, no conflicting canonicals
  - **Evidence:** HTML snippet showing canonical tag for 2–3 sample pages
  - **Fail condition:** Missing canonical, points to wrong URL, conflicts with alternate tags

- **S4: Meta tags present and unique**
  - **What:** Inspect key pages for `<title>` and `<meta name="description">` tags
  - **Pass condition:** Title and description present, unique per page, within length limits (title ≤60 chars, description ≤160 chars)
  - **Evidence:** Title + description text for 2–3 sample pages
  - **Fail condition:** Missing tags, duplicate across pages, exceeds length limits

- **S5: Structured data (schema.org) present**
  - **What:** Inspect key pages for JSON-LD structured data (e.g., Organization, WebSite, Product, LocalBusiness)
  - **Pass condition:** At least one valid schema.org type present on home page; validates via Google Structured Data Testing Tool or schema.org validator
  - **Evidence:** JSON-LD snippet + validation result
  - **Fail condition:** No structured data, invalid JSON, schema errors
  - **Note:** Skip if baseline explicitly states "no structured data required"

- **S6: Index status check (production only)**
  - **What:** For production sites, check Google Search Console for indexing status
  - **Pass condition:** Key pages indexed; no "Excluded" errors for primary pages
  - **Evidence:** Search Console screenshot showing indexed page count
  - **Fail condition:** Pages excluded, indexing errors, no pages indexed after >7 days live
  - **Note:** Skip for staging or sites <7 days old

**SEO domain pass criteria:** All applicable checks pass. One failure is a warning (not a blocker) unless it affects primary conversion pages.

#### Domain 3: Performance Budget

**Goal:** Verify site meets Core Web Vitals targets and performance budget for critical user journeys.

**Checks:**

- **P1: Core Web Vitals (Lighthouse)**
  - **What:** Run Lighthouse audit (desktop + mobile) on home page and primary conversion page
  - **Pass condition:** Performance score ≥90; LCP <2.5s, FID <100ms, CLS <0.1
  - **Evidence:** Lighthouse report summary with scores + Core Web Vitals metrics
  - **Fail condition:** Performance score <90, any Core Web Vital in "Needs Improvement" or "Poor" range

- **P2: Asset size budget**
  - **What:** Inspect network tab for total page weight (home page + primary conversion page)
  - **Pass condition:** Total transfer size ≤1MB for initial page load (excluding video); largest asset ≤500KB
  - **Evidence:** Network tab screenshot showing total transfer size + largest assets
  - **Fail condition:** Page weight >1MB, single asset >500KB (excluding video)

- **P3: Critical rendering path**
  - **What:** Inspect for render-blocking resources (synchronous scripts, blocking CSS in `<head>`)
  - **Pass condition:** No render-blocking scripts in `<head>`; critical CSS inlined or preloaded; fonts use `font-display: swap`
  - **Evidence:** HTML `<head>` snippet showing async/defer on scripts + font-display usage
  - **Fail condition:** Synchronous scripts block rendering, fonts cause FOIT (Flash of Invisible Text)

- **P4: Image optimization**
  - **What:** Inspect images for modern formats (WebP, AVIF) and responsive sizing
  - **Pass condition:** Hero images use modern formats; images have `width` and `height` attributes (prevents CLS); responsive images use `srcset` or `<picture>`
  - **Evidence:** Image tag snippet showing format + attributes
  - **Fail condition:** JPEG/PNG only, missing dimensions, no responsive images

- **P5: Third-party script budget**
  - **What:** Count third-party scripts (analytics, ads, tracking pixels) and measure their impact on load time
  - **Pass condition:** ≤3 third-party scripts; total third-party script weight ≤100KB; scripts load async
  - **Evidence:** Network tab showing third-party requests + sizes
  - **Fail condition:** >3 third-party scripts, >100KB third-party weight, synchronous third-party scripts

**Performance domain pass criteria:** P1–P3 must pass (blockers). P4–P5 failures are warnings (fix before scaling traffic).

#### Domain 4: Legal Compliance

**Goal:** Verify site meets legal requirements for EU GDPR, cookie consent, and consumer protection.

**Checks:**

- **L1: Cookie consent banner present (EU visitors)**
  - **What:** Load site as EU visitor (or clear cookies and reload); verify cookie consent modal appears
  - **Pass condition:** Consent banner appears on first visit; user can accept/reject; choice is persisted; no tracking cookies before consent
  - **Evidence:** Screenshot of consent banner + network tab showing no tracking requests before consent
  - **Fail condition:** No consent banner, tracking cookies set before consent, cannot reject

- **L1b: Two-phase consent signal check (Consent Mode v2)**
  - **What:** Verify that GA4 Consent Mode v2 signals fire in the correct phases: (a) before consent — `analytics_storage: denied`, no `_ga` cookie, no analytics network requests; (b) after consent accepted — `analytics_storage: granted`, `_ga` cookie set, analytics events visible in GA4 DebugView
  - **Pass condition:** Both phases correct. Before accept: no `_ga` cookie, no analytics beacons. After accept: `_ga` cookie present, DebugView shows events with no consent-denied signal
  - **Evidence:** Network tab screenshots for both states (before/after consent); cookie inspector showing `_ga` absent before and present after
  - **Fail condition:** Analytics firing before consent (`_ga` set on page load); or `_ga` never set after consent; or DebugView empty after consent with no error explanation
  - **Note:** An empty DebugView while consent is still `denied` is correct behaviour — **not a GA4 bug**. DebugView silence with denied consent is expected; only silence *after* accept is a failure.

- **L2: Privacy policy exists and is linked**
  - **What:** Verify privacy policy page exists and is linked from footer and cookie banner
  - **Pass condition:** Privacy policy page returns 200; contains GDPR-required disclosures (data controller, data usage, user rights); linked from footer
  - **Evidence:** Privacy policy URL + screenshot of footer link
  - **Fail condition:** 404, missing GDPR sections, not linked from site

- **L3: Terms of service / Terms and conditions exist**
  - **What:** Verify terms page exists and is linked from footer and checkout (if applicable)
  - **Pass condition:** Terms page returns 200; contains required clauses (liability, jurisdiction, refund/return policy if selling goods); linked from footer
  - **Evidence:** Terms URL + screenshot of footer link
  - **Fail condition:** 404, missing required clauses, not linked

- **L4: Returns/refund policy (e-commerce only)**
  - **What:** For sites selling goods/services, verify returns policy is clear and accessible
  - **Pass condition:** Returns policy page exists or returns section in terms is clear; linked from footer and checkout; complies with EU consumer protection (14-day cooling-off period for distance sales)
  - **Evidence:** Returns policy URL or terms section screenshot
  - **Fail condition:** Missing policy, unclear terms, non-compliant cooling-off period
  - **Note:** Skip if site is purely informational (no sales)

- **L5: Business/contact information disclosed**
  - **What:** Verify site discloses business name, registered address, contact email (required for EU e-commerce)
  - **Pass condition:** Contact/imprint page exists with required info; linked from footer
  - **Evidence:** Contact page URL + screenshot showing required fields
  - **Fail condition:** Missing contact info, incomplete address, no contact link

- **L6: Disclaimers for user-generated content (if applicable)**
  - **What:** If site allows user reviews, comments, or UGC, verify disclaimer exists
  - **Pass condition:** Disclaimer present (e.g., "Opinions are users' own"); moderation policy linked
  - **Evidence:** Disclaimer text screenshot
  - **Fail condition:** UGC present but no disclaimer, no moderation policy
  - **Note:** Skip if no UGC features

**Legal domain pass criteria:** All applicable checks pass. One failure blocks launch (legal risk too high).

#### Domain 5: Brand Copy Compliance

> **Pre-flight check:** If `docs/business-os/strategy/<BIZ>/brand-dossier.user.md` is absent, skip all Domain 5 checks with note: _"Brand Dossier absent — skipping brand copy compliance checks."_ All Domain 5 failures are warnings (GATE-BD-06b Warn) — they do not block launch.

**Goal:** Verify guest-facing copy aligns with the Brand Dossier voice, messaging hierarchy, and avoidance list.

**Checks:**

- **BC-04 [GATE-BD-06b Warn]: Words to Avoid**
  - **What:** Scan guest-facing page copy (headings, CTAs, descriptions) against the brand-dossier "Words to Avoid" list
  - **Pass condition:** None of the avoid-words appear in guest-facing copy (or any found instance is flagged for review)
  - **Evidence:** Manual audit of page copy vs. brand-dossier Words to Avoid section; list any instances
  - **Fail condition:** Avoid-words present in headings, CTAs, or primary copy → Warning
  - **Note:** Skip if brand-dossier lacks "Words to Avoid" section; note the absence

- **BC-05 [GATE-BD-06b Warn]: Claims in Messaging Hierarchy**
  - **What:** Verify substantive marketing claims (features, guarantees, benefits) have a corresponding entry in `messaging-hierarchy.user.md` Claims + Proof Ledger (if the file exists)
  - **Pass condition:** All substantive claims on guest-facing pages map to a Claims + Proof Ledger entry
  - **Evidence:** List of substantive claims found on site → status in Claims + Proof Ledger (Substantiated / Missing)
  - **Fail condition:** Substantive claim has no proof ledger entry → Warning
  - **Note:** Skip entirely if `docs/business-os/strategy/<BIZ>/messaging-hierarchy.user.md` does not yet exist; note the absence

- **BC-07 [GATE-BD-06b Warn]: Key Phrase alignment**
  - **What:** Verify primary CTA labels and key UX labels match brand-dossier Key Phrases (e.g., "Explore" not "Browse", "Your stay" not "Your booking")
  - **Pass condition:** CTAs and key labels are consistent with Key Phrases list
  - **Evidence:** Screenshot or list of CTAs + brand-dossier Key Phrases cross-reference
  - **Fail condition:** Primary CTAs contradict Key Phrases or use avoid-words → Warning
  - **Note:** Skip if brand-dossier lacks Key Phrases section; note the absence

**Brand Copy Compliance domain pass criteria:** All Domain 5 failures are warnings — skip the domain entirely if `brand-dossier.user.md` is absent.

#### Domain 6: Measurement & Analytics

> **Pre-flight note:** If the business did not go through S1B (pre-website measurement bootstrap) — e.g. an existing-site business on the `website-live` path — checks M1 and M2 may reveal a gap. In that case, produce a gap advisory and recommend routing to `measurement-quality-audit-prompt.md` rather than blocking launch.

> **Delayed checks (DV-series):** Checks marked `(DELAYED)` cannot be verified at T+0 because GA4 Data API has 24-72 hour data latency. Failures on delayed checks are **warnings only** — they do not block launch. Document as "Deferred to T+1/T+7 post-deploy verification (`post-deploy-measurement-verification-prompt.md`)."

**Goal:** Verify measurement infrastructure is correctly separated (staging/production), properly configured, and instrumented before live traffic hits the site.

**Checks:**

- **M1: Staging GA4 measurement ID ≠ production GA4 measurement ID**
  - **What:** Read `NEXT_PUBLIC_GA_MEASUREMENT_ID` (or equivalent) for staging and production environments; confirm the two IDs are different
  - **Pass condition:** Staging ID ≠ Production ID (necessary condition — required but not sufficient alone; see M2)
  - **Evidence:** Both measurement IDs shown side-by-side (redact everything after `G-` prefix to first 3 chars; e.g., `G-ABC...` vs `G-XYZ...`)
  - **Fail condition:** Same measurement ID in both environments → high-risk data contamination; **BLOCKER**

- **M2: Staging measurement ID belongs to a different GA4 property than production (V-05 full check)**
  - **What:** Using GA4 Admin API (`analyticsadmin.googleapis.com`), read the `parent` property for each measurement ID; confirm they are different property IDs
  - **Pass condition:** Staging measurement ID → Property A (staging property); Production measurement ID → Property B (production property). BOTH conditions must hold (different IDs AND different properties)
  - **Evidence:** `GET /v1beta/properties/{propertyId}/dataStreams` → show property IDs for each stream
  - **Fail condition:** Staging stream belongs to same property as production → Policy-02 violated; **BLOCKER**
  - **Note:** This is the V-05 full check from the S1B verification checklist. M1 pass alone is not sufficient.

- **M3: GA4 internal traffic filter status = Active (read-only confirm)**
  - **What:** Using GA4 Admin API, read the internal traffic filter for the production property; confirm status = `ACTIVE`
  - **Pass condition:** Filter exists and status is `ACTIVE`; IP match rule covers the operator's known office/home IP range
  - **Evidence:** `GET /v1beta/properties/{propertyId}/dataStreams/{streamId}/measurementProtocolSecrets` and filter list; show status field
  - **Fail condition:** Filter absent or status = `ENABLED` but not `ACTIVE` (not yet applied) → Warning (defers to Policy-05 post-launch remediation)
  - **Note:** **Do NOT activate or modify the filter here.** This check is read-only. G-07 (Phase 1) is the setter; activating in QA scope is prohibited.

- **M5: Cross-domain linking advisory (H — human action, non-blocking)**
  - **What:** Note whether the site has any external domains that should share GA4 sessions (e.g. external booking engine, external checkout, subdomain payment provider)
  - **Pass condition:** Either (a) no external domains in conversion flow, or (b) cross-domain linking is confirmed configured in GA4 Tag Settings (owner confirms in-session)
  - **Evidence:** List external domains in conversion path; owner verbal confirmation or GA4 Tag Settings screenshot
  - **Fail condition:** External domains in conversion path AND cross-domain linking not configured → Warning (advisory, not blocker)
  - **Note:** `(H)` only — no GA4 Admin API endpoint exists for cross-domain linking configuration. Human must add allowed domains in GA4 UI: Admin → Tag Settings → Configure your Google tag → Domains. DV-03 in `post-deploy-measurement-verification-prompt.md` covers the delayed verification.

- **M6: SC-03 Coverage API guard (internal constraint)**
  - **What:** Confirm that no automated check in this QA run is attempting to call the Google Search Console Coverage/Pages API for bulk index totals
  - **Pass condition:** No Coverage API calls made; SC-03b (manual GSC UI export) is noted as deferred human action
  - **Evidence:** Audit log confirms no `searchconsole.googleapis.com/webmasters/v3/sites/.../sitemaps` coverage bulk calls in this run
  - **Fail condition:** An automated step attempted to call GSC Coverage bulk API → **internal constraint violation**; abort and flag
  - **Note:** GSC has no bulk Coverage/Pages report API. Agents must NOT attempt to call it. SC-03b requires manual GSC UI export by the operator. This check prevents silent constraint violation.

- **M7: DNS redirect health (apex + www + booking path)**
  - **What:** Using `curl -I`, verify that apex → www redirect, www → production URL, and any external booking path redirect are all functioning correctly
  - **Pass condition:** All redirects return correct HTTP codes (301/302); final destination is production URL with correct SSL; no redirect loops
  - **Evidence:** `curl -I` output for apex, www, and booking redirect path (automated)
  - **Fail condition:** Missing redirect, redirect loop, HTTP 404/5xx at redirect target → **BLOCKER** (broken DNS before launch = traffic lost)

**Measurement domain pass criteria:**
- **Blockers:** M1 (same measurement ID in both envs), M2 (same property for staging + production), M7 (DNS redirect broken)
- **Warnings:** M3 (internal traffic filter not active), M5 (cross-domain advisory), M6 (internal constraint note)
- **Existing-site gap advisory:** If S1B was not run (website-live path), M1/M2 failures produce a gap advisory → recommend `measurement-quality-audit-prompt.md`; do not block launch on this basis alone.
- **Delayed checks:** DV-series checks from `post-deploy-measurement-verification-prompt.md` are explicitly out of scope for launch-time QA. Document as deferred.

### 3) Aggregate results and produce go/no-go decision

**3a) Count pass/fail per domain**
- Conversion: X/Y checks passed
- SEO: X/Y checks passed
- Performance: X/Y checks passed
- Legal: X/Y checks passed
- Brand Copy: X/Y checks passed (or "Skipped — Brand Dossier absent")
- Measurement: X/Y checks passed (or "Gap advisory — S1B not run; route to measurement-quality-audit")

**3b) Determine blocker vs. warning severity**
- **Blocker:** Any failure in Conversion or Legal domains; Performance P1–P3 failures; Measurement M1, M2, or M7 failures
- **Warning:** SEO failures (fix recommended but not blocking); Performance P4–P5 failures; all Brand Copy failures (GATE-BD-06b Warn); Measurement M3, M5, M6 failures; all DV-series delayed checks (deferred to post-deploy verification)
- **Existing-site gap advisory (non-blocking):** M1/M2 failure where S1B was not run → recommend `measurement-quality-audit-prompt.md`; does not block launch unilaterally

**3c) Go/no-go decision**
- **GO:** All blocker checks pass; warnings documented for follow-up
- **NO-GO:** One or more blocker checks fail

### 4) Produce QA report artifact

Write report to:
```
docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md
```

**Report structure:**

```markdown
---
Type: Launch QA Report
Business-Unit: <BIZ>
Audit-Date: YYYY-MM-DD
Deployment-Target: <staging | production>
Deployment-URL: <URL>
Domains-Audited: <conversion, seo, performance, legal, measurement | all>
Decision: <GO | NO-GO>
---

# Launch QA Report — <Business Name>

## Executive Summary

**Audit Date:** YYYY-MM-DD
**Deployment Target:** <staging/production>
**Deployment URL:** <URL>
**Decision:** <GO | NO-GO>

**Results:**
- Conversion: X/Y passed (<% pass rate>)
- SEO: X/Y passed (<% pass rate>)
- Performance: X/Y passed (<% pass rate>)
- Legal: X/Y passed (<% pass rate>)
- Brand Copy: X/Y passed (<% pass rate>) | _or_ Skipped — Brand Dossier absent
- Measurement: X/Y passed (<% pass rate>) | _or_ Gap advisory — S1B not run

**Blockers:** <count> | **Warnings:** <count>

---

## Domain 1: Conversion QA

### C1: Primary conversion flow submits successfully
- **Status:** <PASS | FAIL>
- **Evidence:** <screenshot link or inline description>
- **Notes:** <any deviations or observations>

### C2: Conversion analytics event fires
- **Status:** <PASS | FAIL>
- **Evidence:** <network log screenshot or event payload snippet>
- **Notes:** <any deviations or observations>

<... continue for all Conversion checks ...>

---

## Domain 2: SEO Technical Readiness

### S1: Sitemap exists and is valid
- **Status:** <PASS | FAIL>
- **Evidence:** <sitemap URL + XML snippet + URL count>
- **Notes:** <any deviations or observations>

<... continue for all SEO checks ...>

---

## Domain 3: Performance Budget

### P1: Core Web Vitals (Lighthouse)
- **Status:** <PASS | FAIL>
- **Evidence:** <Lighthouse report summary + metrics>
- **Notes:** <any deviations or observations>

<... continue for all Performance checks ...>

---

## Domain 4: Legal Compliance

### L1: Cookie consent banner present (EU visitors)
- **Status:** <PASS | FAIL>
- **Evidence:** <screenshot + network tab snippet>
- **Notes:** <any deviations or observations>

<... continue for all Legal checks ...>

---

## Domain 5: Brand Copy Compliance

<_Skip this section if brand-dossier.user.md is absent. All Domain 5 failures are Warnings (GATE-BD-06b)._>

### BC-04: Words to Avoid
- **Status:** <PASS | WARN | SKIPPED>
- **Evidence:** <list of found avoid-words or "none found">
- **Notes:** <any instances flagged for review>

### BC-05: Claims in Messaging Hierarchy
- **Status:** <PASS | WARN | SKIPPED>
- **Evidence:** <list of claims checked vs. proof ledger>
- **Notes:** <any claims missing from proof ledger>

### BC-07: Key Phrase alignment
- **Status:** <PASS | WARN | SKIPPED>
- **Evidence:** <CTAs / key labels checked vs. brand-dossier Key Phrases>
- **Notes:** <any mismatches>

---

## Domain 6: Measurement & Analytics

<_Note: DV-series checks (delayed) are out of scope here — deferred to post-deploy verification (`post-deploy-measurement-verification-prompt.md`). Document as "Deferred (T+1/T+7)" rather than FAIL._>

### M1: Staging GA4 measurement ID ≠ production GA4 measurement ID
- **Status:** <PASS | FAIL>
- **Evidence:** <staging ID prefix vs. production ID prefix (redacted)>
- **Notes:** <any environment config observations>

### M2: Staging ID belongs to different GA4 property than production (V-05 full check)
- **Status:** <PASS | FAIL | GAP-ADVISORY>
- **Evidence:** <property IDs for staging and production streams (from Admin API)>
- **Notes:** <if GAP-ADVISORY: S1B not run for this business; recommend measurement-quality-audit-prompt.md>

### M3: GA4 internal traffic filter status = Active (read-only confirm)
- **Status:** <PASS | WARN>
- **Evidence:** <filter status from Admin API; filter IP rule summary>
- **Notes:** <if WARN: remediate post-launch via G-07; do not activate here>

### M5: Cross-domain linking advisory (H — advisory)
- **Status:** <PASS | WARN | N/A>
- **Evidence:** <list external domains in conversion path; owner confirmation if applicable>
- **Notes:** <if WARN: owner to add domains in GA4 Tag Settings > Configure your Google tag > Domains; DV-03 tracks post-deploy verification>

### M6: SC-03 Coverage API guard (internal constraint check)
- **Status:** <PASS | VIOLATION>
- **Evidence:** <confirm no GSC Coverage bulk API calls made in this QA run>
- **Notes:** <SC-03b (manual GSC UI export) noted as deferred human action>

### M7: DNS redirect health (apex + www + booking path)
- **Status:** <PASS | FAIL>
- **Evidence:** <curl -I output for apex, www, booking redirect; final destination URL + HTTP status>
- **Notes:** <any redirect anomalies>

---

## Blockers (must fix before launch)

<If NO-GO, list all blocker failures with fix recommendations>

| Check | Domain | Issue | Fix Recommendation |
|-------|--------|-------|-------------------|
| C1 | Conversion | Form returns 500 error on submit | Debug API endpoint; check logs; verify DB connection |
| L1 | Legal | No cookie consent banner | Integrate consent management platform (CookieBot, OneTrust, custom) |

---

## Warnings (fix recommended; not blocking)

<List all warning-level failures>

| Check | Domain | Issue | Fix Recommendation |
|-------|--------|-------|-------------------|
| S4 | SEO | Meta description exceeds 160 chars on /about page | Trim description to ≤160 chars |
| P4 | Performance | Hero image still using JPEG | Convert to WebP or AVIF |

---

## Release Notes Section

**Pre-launch release notes (if GO):**
- Primary conversion flow: <describe what users can do>
- Key features live: <list>
- Known limitations: <list any warnings or deferred features>
- Monitoring/tracking: <analytics setup, error tracking>

**Rollback plan:**
- Rollback trigger: <what condition requires rollback — e.g., >5% error rate on conversion flow>
- Rollback procedure: <how to revert — e.g., revert deployment, disable feature flag, DNS cutover>
- Rollback validation: <how to confirm rollback worked — e.g., staging URL loads, error rate drops>
- Rollback owner: <who executes rollback — e.g., Pete, on-call engineer>

---

## Next Steps

**If GO:**
1. Commit this QA report to repo
2. Update loop state: mark S9B (launch QA) complete
3. Proceed to `/lp-launch` (S10) or experiment launch
4. Monitor blockers-turned-warnings for post-launch fix

**If NO-GO:**
1. Commit this QA report to repo
2. Create follow-up build tasks for each blocker via `/lp-replan`
3. Re-run `/lp-build` on blocker fixes
4. Re-run `/lp-launch-qa` after fixes deployed
5. Do NOT proceed to S10 until all blockers are resolved
```

### 5) Update loop state (if integrated with startup loop)

If `docs/business-os/startup-baselines/<BIZ>/loop-state.json` exists:
- Mark S9B (Launch QA) checkpoint as `complete` if GO
- Mark S9B as `blocked` if NO-GO (with blocker list)
- Update `Last-Progress` timestamp

**Loop state update example (GO):**
```json
{
  "currentStage": "S9B",
  "stages": {
    "S9B": {
      "name": "Launch QA Gate",
      "status": "complete",
      "completedDate": "YYYY-MM-DD",
      "artifacts": [
        "docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md"
      ]
    },
    "S10": {
      "name": "Launch / Experiment",
      "status": "ready"
    }
  }
}
```

**Loop state update example (NO-GO):**
```json
{
  "currentStage": "S9B",
  "stages": {
    "S9B": {
      "name": "Launch QA Gate",
      "status": "blocked",
      "blockers": [
        "C1: Primary conversion flow returns 500 error",
        "L1: No cookie consent banner"
      ],
      "artifacts": [
        "docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md"
      ]
    }
  }
}
```

### 6) Commit QA report

Commit the QA report and loop state update:

```bash
git add docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md
git add docs/business-os/startup-baselines/<BIZ>/loop-state.json  # if exists
git commit -m "$(cat <<'EOF'
docs(launch-qa): <BIZ> pre-launch QA — <GO | NO-GO>

- Audited domains: <conversion, seo, performance, legal, measurement | all>
- Deployment target: <staging | production>
- Decision: <GO | NO-GO>
- Blockers: <count> | Warnings: <count>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

## Output Contract

### Completion message format

**If GO:**
```
Launch QA complete — GO decision.

**Audit Summary:**
- Business: <BIZ>
- Deployment: <URL>
- Domains audited: <list>
- Overall: X/Y checks passed (<% pass rate>)

**Blockers:** 0
**Warnings:** <count> (documented for post-launch fix)

**Report saved:** docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md

**Next step:** Proceed to `/lp-launch` (S10) or experiment launch.
```

**If NO-GO:**
```
Launch QA complete — NO-GO decision (blockers found).

**Audit Summary:**
- Business: <BIZ>
- Deployment: <URL>
- Domains audited: <list>
- Overall: X/Y checks passed (<% pass rate>)

**Blockers:** <count> (must fix before launch)
**Warnings:** <count>

**Blocker summary:**
- <Check ID>: <Issue summary>
- <Check ID>: <Issue summary>

**Report saved:** docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md

**Next step:** Fix blockers via `/lp-replan` + `/lp-build`, then re-run `/lp-launch-qa`.
```

## Quality Checks

A launch QA run is complete only if:

- [ ] All invocation arguments validated
- [ ] Site baseline and loop state located (or missing baseline reported as blocker)
- [ ] Deployment URL identified and accessible
- [ ] All selected domain checks executed (no checks skipped without documented reason)
- [ ] Each check result includes pass/fail + evidence (not just pass/fail)
- [ ] Blocker vs. warning severity correctly assigned per domain criticality
- [ ] Go/no-go decision matches blocker count (blockers=0 → GO; blockers>0 → NO-GO)
- [ ] QA report artifact written with all required sections
- [ ] Loop state updated (if applicable)
- [ ] QA report committed to repo

## Red Flags

Stop and escalate to user if any of the following occur:

- **Deployment URL unreachable:** Site returns 404/500 or DNS fails → cannot audit → report infra issue
- **Baseline missing critical info:** Site baseline lacks deployment URL, analytics config, or legal doc paths → cannot run checks → request baseline completion
- **Conflicting evidence:** Same check yields different results on repeat (flaky test, intermittent failure) → flag as unstable; require stabilization before GO
- **Manual checks blocked:** Cookie consent test requires EU IP but cannot simulate; legal doc review requires legal expert → flag as "manual review required" and document in report
- **Third-party dependency failure:** Analytics platform down, payment gateway unavailable during checkout test → cannot verify; defer or use cached/documented evidence if recent

## Integration

### Upstream dependencies
- **S9 (Build MVP site):** `/lp-build` must complete all build tasks before launch QA can run
- **Site baseline:** `docs/business-os/site-upgrades/<BIZ>/latest.user.md` provides deployment URL, expected flows, legal doc paths
- **Platform baseline:** `docs/business-os/platform-capability/latest.user.md` provides analytics platform, SEO infrastructure, performance tooling

### Downstream consumers
- **S10 (Launch / Experiment):** `/lp-launch` skill uses GO decision as gate to proceed
- **Startup loop advance:** Loop state S9B checkpoint gates progression to S10
- **Post-launch monitoring:** Warning-level findings seed post-launch improvement tasks

### Related skills
- `/lp-fact-find` (with `Startup-Deliverable-Alias: website-upgrade-backlog`) creates site baseline
- `/lp-build` executes build tasks for S9
- `/lp-launch` (S10) executes launch or experiment (not yet implemented; future skill)
- `/lp-replan` creates fix tasks for blocker findings

## Notes

**Line count target:** 150–220 lines (this file is ~430 lines; within extended range for skill with 4 detailed domain checklists)

**Evidence format:** Screenshots, network logs, HTML snippets, Lighthouse reports should be saved to `docs/business-os/site-upgrades/<BIZ>/launch-qa-evidence-YYYY-MM-DD/` and referenced by relative path in the report.

**Re-run policy:** Launch QA can be run multiple times (after fixes, on different environments, as periodic health check). Each run produces a new timestamped report.

**Staging vs. production:** Default to staging URL for pre-launch audit. Use production URL only for post-launch health check or when explicitly specified.
