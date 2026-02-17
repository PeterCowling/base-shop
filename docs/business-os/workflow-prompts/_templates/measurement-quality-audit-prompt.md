---
Type: Template
Status: Reference
Domain: Business-OS
Created: 2026-02-17
Last-reviewed: 2026-02-17
Launch-surface: website-live
Stage: S1B (conditional: website-live path)
---

# Prompt — S1B Measurement Quality Audit (Website-Live)

Use this template when `launch-surface = website-live` (an existing site with GA4/Cloudflare
already set up). This template **audits configuration quality** against the startup loop's
7 derived policies. It does NOT provision new infrastructure — if no GA4 property exists yet,
use the infra-and-measurement-bootstrap template instead.

**This audit is idempotent.** Running it twice against the same setup produces the same gap
manifest. It does not modify any configuration; it only reads and reports.

Replace all `{{...}}` placeholders before use.

```text
You are a measurement-quality auditor for an existing live website entering the startup loop.

Task:
Produce a measurement configuration gap manifest for:
- Business code:   {{BUSINESS_CODE}}
- Business name:   {{BUSINESS_NAME}}
- Date:            {{DATE}}
- Production URL:  {{PRODUCTION_URL}}
- Staging URL:     {{STAGING_URL}}

Inputs available:
- Business plan:         {{BUSINESS_PLAN_PATH}}
- GA4 property ID:       {{GA4_PROPERTY_ID}}        (format: numeric, e.g. 474488225)
- GA4 staging property ID: {{GA4_STAGING_PROPERTY_ID}}  (or "unknown" if not yet set up)
- Cloudflare zone name:  {{CLOUDFLARE_ZONE}}
- GSC property:          {{GSC_PROPERTY}}           (format: sc-domain:example.com)
- GitHub repo:           {{GITHUB_REPO}}            (format: org/repo)
- Deployment model:      {{DEPLOYMENT_MODEL}}       (e.g. "GitHub Actions + Cloudflare Pages/Workers")
- Service account key:   {{SERVICE_ACCOUNT_KEY_PATH}} (e.g. .secrets/ga4/project.json)

PREREQUISITE CHECK (run first):
Before auditing, verify the minimum access needed to inspect current configuration:
- GA4 Admin API access (service account with Analytics Editor on the property)
- Cloudflare API token with Analytics:Read scope
- GSC API access (service account with siteFullUser on the property)

If any access is missing, produce a "cannot audit" note for the affected policies and
instruct the operator to complete the access prerequisites from the infra bootstrap P0 steps.

---

AUDIT TASK:
For each of the 7 startup loop Derived Policies below, inspect the current configuration and
produce one row in the Gap Manifest. For each policy:
1. Describe exactly how you checked it (API call, file read, env var read, UI inspection note).
2. State the current configuration value observed.
3. State the required configuration value.
4. Determine: PASS / GAP / CANNOT_AUDIT.
5. If GAP: name the owner and the remediation action (referencing the infra bootstrap Phase 0/1
   step that fixes it).

---

POLICIES TO AUDIT:

Policy-01 — Cloudflare API token split by capability
  Required state: Two distinct API tokens exist —
    CLOUDFLARE_API_TOKEN_DNS_EDIT (scopes: Zone:DNS:Edit + Zone:Zone:Read)
    CLOUDFLARE_API_TOKEN_ANALYTICS_READ (scope: Analytics:Read)
  How to check: Inspect GitHub repo secrets and/or ask operator to confirm token names and scopes.
    Cloudflare API tokens cannot be read back via API (scopes are set at creation time);
    operator must confirm from the Cloudflare dashboard token list.
  Gap action if failing: Create missing tokens (P0-06a, P0-06b). Mark old single-token as
    "rotation candidate" if a broad-scope token exists. If only Analytics:Read exists and DNS-Edit
    is absent, any DNS operations (SC-01, D-01, D-02) will fail with 403.

Policy-02 — Staging uses a separate GA4 property (not just a separate data stream)
  Required state: Staging site uses a measurement ID from a different GA4 property than production.
    V-05 pass requires BOTH: (a) staging ID ≠ production ID AND (b) staging ID belongs to a
    different GA4 property ID.
  How to check:
    1. Read NEXT_PUBLIC_GA_MEASUREMENT_ID from staging GitHub Environment variables.
    2. Read NEXT_PUBLIC_GA_MEASUREMENT_ID from production GitHub Environment variables.
    3. If IDs differ: use GA4 Admin API to check which property each measurement ID belongs to.
       GET /v1beta/properties/{property}/dataStreams/{stream}
       Compare property IDs in each response.
    4. If staging env var is missing or equals production: GAP.
  Gap action if failing: Create staging GA4 property (P0-05), create data stream (G-02),
    set staging env var (P0-10 / GH-01).
  Allowed-B exception: If operator has explicitly documented that same-property + separate-stream
    is an intentional choice, record it as "PASS (Allowed-B)" only if: all baselines filter by
    stream/hostname, and this process discipline is formally documented. Otherwise treat as GAP.

Policy-03 — No GTM (or documented exception)
  Required state: Google Tag Manager is NOT loaded on production pages unless a documented
    exception exists (≥3 simultaneous marketing tags or non-engineer tag management required).
  How to check: Fetch production page source; search for "googletagmanager.com/gtm.js".
    If absent: PASS. If present: check for documented exception in business plan or strategy docs.
  Gap action if failing: If GTM is unjustified by documented exception, document a plan to
    migrate to direct gtag.js. This is a policy advisory; not a hard blocker.

Policy-04 — Consent Mode v2 with correct default denied state and ordering
  Required state:
    a) gtag consent default call uses explicit per-signal shape (NOT {all: 'denied'}):
       ad_storage, ad_user_data, ad_personalization, analytics_storage,
       functionality_storage, personalization_storage all denied;
       security_storage granted.
    b) Consent default call executes BEFORE the gtag.js <Script> load (synchronous inline script).
    c) wait_for_update and url_passthrough are present.
  How to check: Fetch production page source; inspect the <head> section for the consent default
    block above the gtag.js Script tag. Compare against the known-good snippet.
  Gap action if failing: Fix C-02 code — add correct consent default inline script in layout.tsx
    before the afterInteractive Script tag (Phase 1 code change C-02).

Policy-05 — GA4 internal traffic filter in Active state
  Required state: Internal traffic filter exists with state = ACTIVE (not TESTING or INACTIVE).
  How to check:
    GET /v1beta/properties/{property}/dataFilters
    Find filter with type internalTrafficFilter or developerTrafficFilter.
    Check state field.
  Gap action if failing: PATCH filter state to ACTIVE (G-07). If no filter exists: create one (G-06)
    then activate it. If no internal IPs are defined yet, define dev/office IP range first.

Policy-06 — Agent GitHub auth mechanism declared
  Required state: An explicit agent authorization mechanism exists for writing GitHub variables/secrets:
    either a PAT with repo + secrets:write scope, or a GitHub App installation. The mechanism is
    documented and the credential is stored outside the repo.
  How to check: Ask operator to confirm. Check if any automation scripts reference a GH_TOKEN or
    GITHUB_PAT with write scope. Look for agent configuration docs referencing GitHub credentials.
  Gap action if failing: Declare mechanism (P0-09). Without this, all GH-series steps claiming
    agent-automatable status remain human-manual.

Policy-07 — External checkout businesses use handoff_to_engine as canonical conversion event
  Required state: If the business uses an external booking/checkout engine (e.g. Octorate,
    Booking.com, Shopify Payments redirected externally), the GA4 key event for the funnel is
    handoff_to_engine (not begin_checkout or purchase alone).
    If the business has a native checkout: purchase is correct. Policy-07 does not apply.
  How to check:
    GET /v1beta/properties/{property}/keyEvents
    Check if handoff_to_engine exists as a key event.
    Check if begin_checkout or search_availability have event create rules mapping to handoff_to_engine.
  Gap action if failing: Create handoff_to_engine key event (G-05). Add event create rules mapping
    upstream events. Update instrumentation code to emit handoff_to_engine at real CTA click points.
    Note: if GA4 Data API shows zero handoff_to_engine events for a live site with real traffic,
    the funnel is dark — this is a P0 measurement gap.

---

ADDITIONAL CHECKS (outside 7 policies but high-impact):

A) GA4 cross-domain linking:
  Check: Does the business have external checkout or cross-domain user journeys?
  If yes: inspect GA4 Tag Settings > Configure your domains in the GA4 UI.
  Note: This cannot be checked via GA4 Admin API — no endpoint exposes this configuration.
  If cross-domain domains are not configured: produce an advisory (human action required).

B) GSC sitemap and coverage baseline:
  Check: Has a sitemap been submitted? Use Search Console API sitemaps.list to verify.
  Coverage totals (Indexed / Discovered-not-indexed / 404): NO BULK API EXISTS for these.
  Produce an advisory to export the Pages report from GSC UI manually.

C) Cloudflare 404 rollup cron:
  Check: Does .github/workflows/cloudflare-404-rollup.yml exist in the repo?
  If not: produce a gap note. Without this, the daily 404 history is not maintained.

---

OUTPUT FORMAT (strict — produce each section in order):

A) AUDIT SCOPE AND ASSUMPTIONS
   - Business, date, properties audited
   - Access confirmed / cannot-audit items listed
   - Audit is read-only; no configuration was changed

B) GAP MANIFEST (one row per policy)
   | Policy | Policy name | Current state | Required state | Result | Owner | Remediation action |
   |--------|-------------|---------------|----------------|--------|-------|-------------------|
   | P-01   | Token split  | ...           | ...            | PASS / GAP / CANNOT_AUDIT | ... | ... |

C) ADDITIONAL CHECKS RESULTS
   - Cross-domain linking advisory (if applicable)
   - GSC sitemap and coverage advisory
   - Cloudflare 404 cron advisory

D) PRIORITISED ACTION LIST
   - Order gaps by impact (measurement blindness > data contamination > process gaps)
   - For each gap: exact remediation step (by Phase/step ID from infra bootstrap), owner, urgency
   - If no gaps: "All 7 policies PASS — measurement configuration meets startup loop standards"

E) OPERATOR HANDOFF MESSAGE
   - Ready-to-send summary for Pete (or business owner)
   - States: which policies pass, which have gaps, what must be done before measurement baselines
     are reliable, and which gaps require human action vs agent action

---

RULES:
- Do not modify any configuration. Audit only.
- Do not invent or assume values — only report what you can directly observe.
- Mark CANNOT_AUDIT when access is missing; do not guess.
- For Policy-02, check both conditions (different ID AND different property) — ID difference alone
  is not sufficient.
- For Policy-04, fetch real page source — do not rely on code reading alone (env var substitution
  may differ from deployed output).
- For Policy-05, use GA4 Admin API — do not rely on GA4 UI description (filter UI descriptions
  can be ambiguous).
- Keep the gap manifest ordered Policy-01 through Policy-07.
- All steps must be executable by an operator with the confirmed access prerequisites.
```
