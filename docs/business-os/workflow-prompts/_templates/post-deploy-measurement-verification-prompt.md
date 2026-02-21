---
Type: Template
Status: Reference
Domain: Business-OS
Created: 2026-02-17
Last-reviewed: 2026-02-17
Launch-surface: all
Stage: S9B (post-deploy verification) / standalone operator handoff
---

# Prompt — Post-Deploy Measurement Verification

Use this template immediately after the first production deploy and then at T+1 and T+7.
It is designed to run in **two distinct phases** matched to data-availability realities:

- **Immediate checks (T+0):** Run within minutes of first deploy. Use DebugView, Realtime,
  curl, and DevTools only. GA4 Data API and Search Console Coverage are NOT checked here —
  both have multi-hour to 24-hour processing latency and will return zero or stale data at T+0.
- **Delayed checks (T+1 / T+7):** Run after data has had time to process. GA4 Data API
  is available at T+24h; Search Console Coverage is available at T+24-72h and T+7.

This template does NOT provision infrastructure. It verifies that infrastructure provisioned
in Phase 0-2 (S1B bootstrap) is correctly active in production. If infrastructure setup has
not been completed, run the S1B bootstrap template first.

**Baseline cadence:** T+0 = tag verification snapshot; T+1 = first full-day GA4 Data API
extract (DV-01); T+7 = week-1 baseline (DV-05) + GSC coverage delta (DV-04);
thereafter = S10 weekly readouts.

Replace all `{{...}}` placeholders before use.

```text
You are a post-deploy measurement verification agent for a live production site.

Task:
Run all post-deploy measurement checks for:
- Business code:       {{BUSINESS_CODE}}
- Business name:       {{BUSINESS_NAME}}
- Date of first deploy: {{DEPLOY_DATE}}        (format: YYYY-MM-DD)
- Production URL:      {{PRODUCTION_URL}}
- Production GA4 property ID: {{GA4_PROPERTY_ID}}   (format: numeric, e.g. 474488225)
- Cloudflare zone ID:  {{CLOUDFLARE_ZONE_ID}}
- GitHub repo:         {{GITHUB_REPO}}         (format: org/repo)
- Service account key: {{SERVICE_ACCOUNT_KEY_PATH}}

IMPORTANT TIMING RULE:
Do NOT call the GA4 Data API (analyticsdata.googleapis.com) or check Search Console Coverage
totals during Immediate checks. These services have processing latency of hours to ~24 hours
after first events arrive. Calling them at T+0 will return zero or stale results and produce
false-negative failures. GA4 Data API is reserved for DV-01 (T+24h); Search Console Coverage
is reserved for DV-04 (T+7, human export only).

---

## SECTION 1 — IMMEDIATE CHECKS (T+0)

Run within minutes of first production deploy. All checks in this section use only:
curl, page source inspection, GA4 DebugView/Realtime, and Chrome DevTools network panel.

---

### PV-01 — Production measurement ID in page source

Owner: Agent (A)

Action:
  curl -s {{PRODUCTION_URL}} | grep -o 'G-[A-Z0-9]*'

Pass criteria:
  Output contains the production GA4 measurement ID (G-...) matching the value set in the
  production GitHub Environment variable NEXT_PUBLIC_GA_MEASUREMENT_ID.

Fail criteria:
  - No G-... ID found in source → tag not loading; check layout.tsx and build env vars.
  - Staging G-... ID appears in production source → wrong env var used at build time.

Note: The measurement ID in page source reflects the build-time baked value.
  NEXT_PUBLIC_* variables are baked at Next.js build time from GitHub Environment variables,
  NOT from Cloudflare Pages dashboard variables. Verify in GitHub Actions production
  environment settings if the wrong ID appears.

---

### PV-02 — GA4 DebugView / Realtime shows page_view events

Owner: Human (H) — requires GA4 UI login

Action:
  Option A (Tag Assistant): Open https://tagassistant.google.com and navigate to
    {{PRODUCTION_URL}}. Confirm page_view fires with correct GA4 property.
  Option B (debug_mode): Add debug_mode: true to the gtag config temporarily, visit
    {{PRODUCTION_URL}}, and check GA4 > Admin > DebugView.
  Option C (Realtime): Open GA4 > Reports > Realtime and confirm page_view appears
    within 2 minutes of visiting {{PRODUCTION_URL}}.

Pass criteria:
  page_view event visible in Realtime or DebugView for the correct production property
  (property ID: {{GA4_PROPERTY_ID}}).

IMPORTANT — Consent interaction required before DebugView shows events:
  DebugView and Realtime will show NO events if analytics_storage is denied. You MUST
  accept the analytics/cookie consent banner before checking DebugView. If you check
  DebugView before accepting consent and see no events, this is expected — it is NOT
  a GA4 failure. Accept cookies and re-check.

Fallback if GA4 UI is inaccessible:
  Use Chrome DevTools > Network panel, filter by "collect", and look for requests to
  https://www.google-analytics.com/g/collect returning HTTP 204. This is equivalent
  evidence that GA4 is receiving events.

---

### PV-03 — GA4 collect endpoint returns HTTP 204

Owner: Human (H) — Chrome DevTools inspection

Action:
  Open Chrome DevTools > Network panel. Filter by "collect".
  Visit {{PRODUCTION_URL}} and confirm at least one request to
  https://www.google-analytics.com/g/collect is visible with HTTP 204 status.

Pass criteria:
  HTTP 204 response observed for /g/collect endpoint after page load.

Note: 204 No Content is the expected success response. Any 4xx response indicates a
  tag configuration error. Ensure analytics cookies are accepted (see PV-02 note) —
  consent denied state suppresses collect calls.

---

### PV-04 — Redirect health: apex, www, and booking path

Owner: Agent (A)

Action:
  # Apex to www or canonical redirect
  curl -I https://{{PRODUCTION_URL}} 2>/dev/null | head -20

  # www to apex (or reverse, depending on canonical)
  curl -I https://www.{{PRODUCTION_URL}} 2>/dev/null | head -20

  # Booking/checkout path (if applicable)
  curl -I https://{{PRODUCTION_URL}}/book 2>/dev/null | head -20

Pass criteria:
  All permanent redirects return 308 (or 301) and resolve to the correct canonical URL.
  No redirect chains longer than 2 hops. Final destination returns 200.

Fail criteria:
  Redirect loop, wrong destination, 404, or 5xx on any path.

---

### PV-05 — Consent banner behaviour (two-phase check)

Owner: Human (H) — browser + DevTools inspection

PHASE A — Before accepting consent:

Action:
  1. Open a fresh private/incognito window.
  2. Visit {{PRODUCTION_URL}}.
  3. Do NOT click the consent banner accept button.
  4. Open DevTools > Application > Cookies. Check for _ga, _gid cookies.
  5. Open DevTools > Console. Run:
       window.__tcfapi && window.__tcfapi('getTCData', 2, console.log)
     or check the gtag consent state via:
       document.cookie (confirm no _ga cookie present)

Pass criteria (Phase A — before accept):
  - analytics_storage consent signal is 'denied' (check Consent Mode in DebugView or
    via DevTools as above).
  - No _ga or _gid cookies are set in Application > Cookies.

PHASE B — After accepting consent:

Action:
  1. Click the consent banner accept button.
  2. Re-check DevTools > Application > Cookies.
  3. Wait up to 2 minutes, then check GA4 Realtime for page_view events.

Pass criteria (Phase B — after accept):
  - analytics_storage consent signal is 'granted'.
  - _ga cookie is now present in Application > Cookies.
  - GA4 Realtime or DebugView shows page_view events (see PV-02 note on DebugView
    and consent — events will not appear until consent is granted).

Reference — Known-good Consent Mode v2 snippet (C-02):
  The following must be in layout.tsx as an inline script BEFORE the gtag.js Script tag:
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('consent', 'default', {
      ad_storage:             'denied',
      ad_user_data:           'denied',
      ad_personalization:     'denied',
      analytics_storage:      'denied',
      functionality_storage:  'denied',
      personalization_storage:'denied',
      security_storage:       'granted',
      wait_for_update:        500,
    });
    gtag('set', 'url_passthrough', true);
  If this snippet is absent or uses {all: 'denied'}, consent is not configured correctly.

---

### PV-06 — GA4 internal traffic filter status = Active

Owner: Agent (A)

Action:
  Use GA4 Admin API — READ ONLY. This is a confirmation check; Phase 1 / G-07 is the
  setter. Do not modify the filter here.

  GET https://analyticsadmin.googleapis.com/v1beta/properties/{{GA4_PROPERTY_ID}}/dataFilters

  Find the filter with type DEVELOPER_TRAFFIC or INTERNAL_TRAFFIC. Read the state field.

Pass criteria:
  filter.state = "ACTIVE"

Fail criteria:
  - state = "TESTING": filter is defined but not excluding traffic. Internal visits will
    appear in production data. This is a Policy-05 violation. Escalate to operator to run:
      PATCH properties/{{GA4_PROPERTY_ID}}/dataFilters/{filterId}
      body: {"state": "ACTIVE"}
  - No filter found: Phase 1 G-07 was skipped. Escalate immediately — all baseline data
    is contaminated by internal traffic until filter is created and activated.

Policy-05 reference: GA4 internal traffic filter must be in ACTIVE state before baselines
  are treated as decision-grade. Testing state is a known failure mode from brik (filter
  was stuck in Testing for the entire instrumentation period).

---

### PV-07 — Production site is indexable (no noindex)

Owner: Agent (A)

Action:
  curl -s https://{{PRODUCTION_URL}}/robots.txt
  curl -sI https://{{PRODUCTION_URL}} | grep -i x-robots-tag

Pass criteria:
  - robots.txt does NOT contain "Disallow: /" (or contains "Allow: /").
  - No X-Robots-Tag: noindex header.
  - Fetch the page source and confirm no <meta name="robots" content="noindex"> tag.

Fail criteria:
  NEXT_PUBLIC_NOINDEX_PREVIEW env var may be set in the production GitHub Environment,
  causing a site-wide noindex. Check and remove from production environment immediately.

---

### PV-08 — Cloudflare 404 rollup workflow initialised

Owner: Agent (A)

Action:
  1. Verify .github/workflows/cloudflare-404-rollup.yml exists in the {{GITHUB_REPO}} repo.
  2. The workflow must be configured as a scheduled job running daily at 02:00 UTC,
     using CLOUDFLARE_API_TOKEN_ANALYTICS_READ (Analytics:Read scope) to query
     Cloudflare GraphQL for 404 responses by URL.
  3. Trigger the workflow manually for day 0 using:
     gh workflow run cloudflare-404-rollup.yml --repo {{GITHUB_REPO}}
  4. Verify the workflow run completed and .tmp/cloudflare-404-rollup-{{DEPLOY_DATE}}.json
     was written.

Pass criteria:
  - Workflow file exists.
  - Day-0 manual run completes successfully.
  - .tmp/cloudflare-404-rollup-{{DEPLOY_DATE}}.json is populated (non-empty JSON).

Fail criteria:
  - Workflow file missing: 404 history has a gap from launch day; retroactive gap-fill
    is possible within ~8 days using Cloudflare GraphQL day-by-day queries (86400s window
    cap), but must be done promptly.
  - Run fails with 403: CLOUDFLARE_API_TOKEN_ANALYTICS_READ has wrong scope. Verify
    token has Analytics:Read (not DNS:Edit) scope.

Note: Initialise on launch day (T+0) so there are no gaps in the historical 404 record.
  Cloudflare GraphQL lookback limit is ~8 days; do not defer this initialisation.

Note: DNS-Edit token (P0-06a) rotation reminder — the CLOUDFLARE_API_TOKEN_DNS_EDIT
  token was used during Phase 1 bootstrap. Review whether it should be rotated/revoked
  now that DNS setup is complete. Enforcement is manual; token is labelled "bootstrap only".

---

## SECTION 1 RESULTS SUMMARY (T+0)

| Check | ID | Owner | Result | Notes |
|---|---|---|---|---|
| Production measurement ID in source | PV-01 | A | PASS / FAIL | |
| DebugView / Realtime page_view | PV-02 | H | PASS / FAIL | |
| Collect endpoint HTTP 204 | PV-03 | H | PASS / FAIL | |
| Redirect health | PV-04 | A | PASS / FAIL | |
| Consent banner (before accept) | PV-05a | H | PASS / FAIL | |
| Consent banner (after accept) | PV-05b | H | PASS / FAIL | |
| Internal traffic filter Active | PV-06 | A | PASS / FAIL | |
| No noindex in production | PV-07 | A | PASS / FAIL | |
| 404 rollup workflow initialised | PV-08 | A | PASS / FAIL | |

If all checks PASS: production measurement is live and collecting clean data.
If any check FAILS: do not begin marketing spend or channel activation until resolved.

---

## SECTION 2 — DELAYED CHECKS (T+1 / T+7)

Do NOT run these checks immediately after deploy. GA4 Data API requires approximately
24 hours of processing time after first events arrive. Search Console Coverage requires
24-72 hours for initial crawl data.

Schedule:
  T+24h (next morning after launch):  DV-01, DV-02
  Within first week:                   DV-03 (advisory, non-blocking)
  T+7 (one week after launch):         DV-04, DV-05

---

### DV-01 — GA4 Data API: first full-day baseline extract (T+24h)

Owner: Agent (A)
When: T+24h (first full calendar day of traffic)

Action:
  Use GA4 Data API (analyticsdata.googleapis.com v1beta):

  POST https://analyticsdata.googleapis.com/v1beta/properties/{{GA4_PROPERTY_ID}}:runReport

  Request body:
  {
    "dateRanges": [{"startDate": "{{DEPLOY_DATE}}", "endDate": "{{DEPLOY_DATE}}"}],
    "metrics": [
      {"name": "sessions"},
      {"name": "eventCount"},
      {"name": "screenPageViews"}
    ],
    "dimensions": [{"name": "eventName"}],
    "dimensionFilter": {
      "filter": {
        "fieldName": "eventName",
        "inListFilter": {
          "values": [
            "page_view",
            "session_start",
            "handoff_to_engine",
            "begin_checkout",
            "view_item"
          ]
        }
      }
    }
  }

Pass criteria:
  - Response contains non-zero sessions.
  - page_view and session_start appear with non-zero counts.
  - If site has real traffic: at least one funnel event (handoff_to_engine or begin_checkout)
    is visible. If zero funnel events: record as "funnel dark — no CTA clicks yet" rather
    than a failure; this is acceptable on day 1.
  - Write baseline JSON to:
    docs/business-os/strategy/{{BUSINESS_CODE}}/ga4-baseline-{{DEPLOY_DATE}}.json

Fail criteria:
  - Response returns zero sessions 24h after launch with known traffic:
    check that the production measurement ID (PV-01) is correct, that consent is not
    blocking all events (PV-05 result), and that no filter is excluding production traffic.
  - API 403: Service account lacks Analytics Viewer role on property {{GA4_PROPERTY_ID}}.
    Check P0-04b completion.

---

### DV-02 — Search Console: sitemap accepted and crawl begun (T+24-72h)

Owner: Human (H) — GSC UI inspection
When: T+24-72h after launch

Action:
  1. Open Google Search Console > {{PRODUCTION_URL}} property.
  2. Navigate to Sitemaps.
  3. Confirm the sitemap submitted in Phase 1 (SC-02) appears with status "Success"
     and a non-zero count of discovered URLs.

Pass criteria:
  Sitemap shown in Sitemaps report with status Success and >0 URLs submitted.

Note: If Status shows "Couldn't fetch", GSC may not have verified the property yet
  (P0-11a may be incomplete). Verify GSC ownership first, then resubmit sitemap.

---

### DV-03 — GA4 cross-domain linking: owner accepts domain suggestions (advisory)

Owner: Human (H) — GA4 UI only. Cannot be automated.
When: Within first week
Priority: Advisory — non-blocking for baseline collection; blocking for accurate
  session attribution across domains

Action:
  1. Open GA4 > Admin > Data Streams > [Production stream].
  2. Navigate to Tag Settings > Configure your domains.
  3. GA4 may auto-surface domain suggestions when cross-origin traffic is detected.
     Accept suggestions for the external checkout domain (e.g. Octorate, Booking.com)
     OR add the external domain manually.

Pass criteria:
  External checkout domain listed as Active in Tag Settings > Configure your domains.

Note: This step has NO GA4 Admin API equivalent. No endpoint exposes cross-domain
  linking configuration. This is a human-only UI action and cannot be partially automated.

Note: Without cross-domain linking configured, users who click through to the external
  checkout are counted as a new session, breaking funnel attribution. This is a medium-
  impact measurement gap. It does not corrupt the overall session count but it does make
  checkout funnel rates unreliable.

---

### DV-04 — GSC Pages coverage delta: compare counts at T+7 (H)

Owner: Human (H) — GSC UI export only
When: T+7

Note: No bulk API exists for Google Search Console Coverage/Pages totals
  (Indexed, Discovered-not-indexed, 404). The Search Console API provides
  searchanalytics.query (clicks/impressions) and urlInspection (per-URL, not bulk).
  Coverage totals must be exported manually from the GSC UI.

Action:
  1. Open Google Search Console > {{PRODUCTION_URL}} > Pages report.
  2. Note counts for: Indexed, Discovered-not-indexed, 404.
  3. Compare to the SC-03b baseline captured in Phase 1.
  4. Record delta in the baseline artifact:
     docs/business-os/strategy/{{BUSINESS_CODE}}/measurement-verification-{{DEPLOY_DATE}}.user.md

Pass criteria:
  - Indexed count is non-zero and growing.
  - 404 count is stable or decreasing relative to SC-03b baseline.
  - No unexpected spike in Discovered-not-indexed (could indicate crawl budget issue).

Note: T+7 is a minimum; full GSC coverage data can take 4+ weeks for new sites.
  This check establishes the first delta point, not a stable baseline.

---

### DV-05 — GA4 week-1 baseline: 7-day window from launch date (T+7)

Owner: Agent (A)
When: T+7

Action:
  Use GA4 Data API (analyticsdata.googleapis.com v1beta):

  POST https://analyticsdata.googleapis.com/v1beta/properties/{{GA4_PROPERTY_ID}}:runReport

  Request body:
  {
    "dateRanges": [{"startDate": "{{DEPLOY_DATE}}", "endDate": "7daysAgo"}],
    "metrics": [
      {"name": "sessions"},
      {"name": "eventCount"},
      {"name": "screenPageViews"},
      {"name": "bounceRate"},
      {"name": "averageSessionDuration"}
    ],
    "dimensions": [{"name": "eventName"}]
  }

Pass criteria:
  - 7-day session count is non-zero.
  - Funnel events visible (even at low counts) if traffic has been active.
  - Baseline written to:
    docs/business-os/strategy/{{BUSINESS_CODE}}/ga4-week1-baseline-{{DEPLOY_DATE}}.json
  - Baseline is locked (no data backfill after this date) and referenced in plan.user.md
    as the S10 weekly readout starting point.

Note: If zero sessions across 7 days with known traffic, re-run PV-01 through PV-06
  to diagnose. Zero sessions at T+7 is a measurement emergency — do not start S10 weekly
  readouts or channel spend until resolved.

---

## SECTION 2 RESULTS SUMMARY (Delayed)

| Check | ID | Owner | When | Result | Notes |
|---|---|---|---|---|---|
| GA4 first-day baseline extract | DV-01 | A | T+24h | PASS / FAIL | |
| GSC sitemap accepted | DV-02 | H | T+24-72h | PASS / FAIL | |
| GA4 cross-domain linking | DV-03 | H | First week | ADVISORY | Non-blocking |
| GSC coverage delta | DV-04 | H | T+7 | PASS / FAIL | |
| GA4 week-1 baseline | DV-05 | A | T+7 | PASS / FAIL | |

---

## BASELINE CADENCE

| Milestone | When | Action | Owner |
|---|---|---|---|
| T+0 | Launch day | Tag verification snapshot (PV-01 through PV-08) | A + H |
| T+1 | Next morning | First full-day GA4 Data API extract (DV-01) | A |
| T+24-72h | 1-3 days post-launch | GSC sitemap confirmation (DV-02) | H |
| T+7 | One week post-launch | GSC coverage delta (DV-04) + GA4 week-1 baseline (DV-05) | A + H |
| Weekly | Every Monday | S10 weekly readout (K/P/C/S decisions) | A + H |

---

## OUTPUT FORMAT

Produce one section per completed check phase:

A) T+0 IMMEDIATE RESULTS
   - Date/time of verification run
   - Results table (PV-01 through PV-08)
   - Any failures with diagnosis and escalation action

B) T+1 DELAYED RESULTS (if run)
   - DV-01 baseline JSON path
   - DV-02 GSC sitemap status
   - DV-03 cross-domain status (advisory)

C) T+7 DELAYED RESULTS (if run)
   - DV-04 coverage delta summary
   - DV-05 week-1 baseline JSON path
   - S10 readout start date confirmed

D) OVERALL PASS / FAIL + ESCALATION ACTIONS
   - If all checks PASS: state measurement is live and decision-grade at given baseline date
   - If any checks FAIL: list exact escalation actions, owner, and urgency
   - If any (H) steps are outstanding: list with expected completion date

---

RULES:
- Do not call analyticsdata.googleapis.com in Section 1 (Immediate). This is a hard rule.
- Do not call Search Console Coverage/Pages bulk API — it does not exist.
- Mark every Human-required step as (H) with the reason it cannot be automated.
- For PV-02: always note that analytics_storage consent must be granted before DebugView
  shows events. Missing events with consent denied is not a failure.
- For PV-06: always note that this is a READ confirmation only. G-07 (Phase 1) is the setter.
  Do not PATCH the filter state in this step.
- For DV-03: always mark as non-blocking advisory. Cross-domain linking absence degrades
  funnel attribution but does not stop measurement from functioning.
- For DV-01/DV-05: write baseline artifacts to the business strategy directory. These are
  the S10 weekly readout starting points.
```
