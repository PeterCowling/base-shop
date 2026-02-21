---
Type: Template
Status: Reference
Domain: Business-OS
Created: 2026-02-12
Last-reviewed: 2026-02-17 (expanded from thin template — startup-loop-infra-measurement-bootstrap plan)
Launch-surface: pre-website
Stage: S1B (conditional: pre-website path)
---

# Prompt — S1B Measure (Pre-Website)

Use this template for `launch-surface = pre-website` (a new site being built, with no GA4
property or Search Console presence yet). For an existing live site that already has GA4/Cloudflare,
use the **measurement quality audit template** instead.

This template covers three phases:

- **Phase 0 (Human, ~30-60 min):** One-session access bundle. Front-loads all credential creation
  and access grants so agents can run Phase 1 unattended. Do not skip or reorder Phase 0 steps —
  they have strict dependencies. The ordering is enforced.
- **Phase 1 (Agent, after Phase 0 complete):** All GA4, Search Console, DNS, GitHub, and code
  integration steps that can be executed via API/CLI once access is granted.
- **Phase 2 (Agent + Human, before production):** Staging verification. Confirms the full setup
  is working before any production deploy.

**Human-gating points are explicitly labelled `(H)`. Every `(H)` step is irreducible — it
requires either UI access, a credential that only the owner can generate, or a judgment call
that an agent cannot make.**

Replace all `{{...}}` placeholders before use. Do not substitute brik-specific values.

```text
You are an infrastructure and measure stage operator for a new pre-website startup.

Task:
Produce a complete infrastructure setup pack covering Phase 0 (human), Phase 1 (agent),
and Phase 2 (staging verification) for:
- Business code:         {{BUSINESS_CODE}}
- Business name:         {{BUSINESS_NAME}}
- Date:                  {{DATE}}
- Production domain:     {{PRODUCTION_DOMAIN}}   (e.g. example.com — apex only, no www)
- Staging domain:        {{STAGING_DOMAIN}}       (e.g. staging.example.pages.dev)
- Timezone:              {{TIMEZONE}}             (e.g. Europe/Rome)
- Currency:              {{CURRENCY}}             (e.g. EUR)
- GCP project name:      {{GCP_PROJECT_NAME}}     (e.g. mybusiness-web)
- Deployment platform:   {{DEPLOY_PLATFORM}}      (e.g. GitHub Actions + Cloudflare Pages/Workers)
- GitHub repo:           {{GITHUB_REPO}}          (format: org/repo)
- Business plan:         {{BUSINESS_PLAN_PATH}}
- Intake packet:         {{INTAKE_PACKET_PATH}}

---

## IDS GLOSSARY

Collect and record these IDs as you progress through Phase 0-1. They are referenced
throughout Phase 1 steps and template variables below.

### GA4

| Name | Example format | Where to find |
|---|---|---|
| Property ID (production) | 123456789 (example) | GA4 Admin → Property Settings (numeric, 9-10 digits) |
| Measurement ID (production) | G-XXXXXXXXXX | GA4 Admin → Data Streams → stream details (format: G-...) |
| Data Stream ID (production) | 10183287178 | GA4 Admin → Data Streams → URL in browser bar |
| Property ID (staging) | [different number] | GA4 Admin → staging property → Property Settings |
| Measurement ID (staging) | G-YYYYYYYYYY | GA4 Admin → staging property → Data Streams (MUST differ from production) |

### Cloudflare

| Name | Where to find |
|---|---|
| Account ID | Dashboard top-right, or Workers subdomain prefix |
| Zone ID | Dashboard → {domain} → right sidebar → Zone ID |

### GCP

| Name | Where to find |
|---|---|
| Project ID (string) | Google Cloud Console → project selector dropdown |
| Project Number (numeric) | Google Cloud Console → IAM & Admin → Settings |

### GitHub

| Kind | How it is set | Encrypted? | Environment-scoped? |
|---|---|---|---|
| Repository secret | Settings → Secrets → Actions | Yes | No — all envs see it |
| Environment secret | Settings → Environments → {env} → Secrets | Yes | Yes |
| Environment variable | Settings → Environments → {env} → Variables | No | Yes |

Record this glossary in the output artifact for the operator's reference.

---

## DEPLOYMENT MODEL

This template assumes the default deployment stack:

| Environment | Build system | Artifact | Host |
|---|---|---|---|
| Staging / PR preview | GitHub Actions | Static export (`out/`) | Cloudflare Pages (Preview branch) |
| Production | GitHub Actions | Workers build (`.open-next/`) | Cloudflare Workers |

IMPORTANT — where to set NEXT_PUBLIC_* variables:
`NEXT_PUBLIC_*` variables are baked into the bundle at **GitHub Actions build time**.
Set them as **GitHub Environment variables** (scoped to the `staging` or `production`
GitHub Environment), NOT in the Cloudflare Pages dashboard.

If the business uses Cloudflare's built-in CI instead of GitHub Actions: set env vars
in Cloudflare Pages Settings > Environment variables.

Runtime server-side secrets for Workers: `wrangler secret put <NAME>` — separate from
build-time vars and not stored in GitHub Environment variables.

---

## DERIVED POLICIES

These 7 policies are derived from real startup failures and are enforced by the startup loop.
Each agent and human step below references the relevant policy by number.

Policy-01: Cloudflare API tokens must be split by capability — DNS-Edit token separate from
  Analytics-Read token. Never use a single broad-scope token for both.

Policy-02: Staging must use a separate GA4 property (not just a separate data stream).
  Separate property = clean isolation, no risk of cross-contamination in production baselines.
  Separate stream only (Allowed B, explicit opt-in) is a process discipline requirement, not
  a GA4 enforcement mechanism — requires all queries to include a streamId filter always.

Policy-03: GTM is NOT added by default. Use direct gtag.js. Add GTM only when >=3 distinct
  marketing pixel tags need simultaneous management by a non-engineer.

Policy-04: Consent Mode v2 must default all signals to denied before any gtag hit is emitted.
  The consent default call must execute before gtag.js loads. Use a synchronous inline script.

Policy-05: GA4 internal traffic filter must be in Active state (not Testing) before S9B passes.
  Testing state does not exclude traffic. G-07 activates it; PV-06 confirms it as read-only.

Policy-06: Agent GitHub authorization model must be declared in Phase 0. Without a declared
  mechanism (PAT or GitHub App), all GitHub variable steps remain (H), not (A).

Policy-07: External checkout businesses (e.g. Octorate, Booking.com) use `handoff_to_engine`
  as the canonical funnel conversion event. Revenue is reconciled probabilistically, not via
  pixel, because external booking engines have no callback or webhook mechanism.

---

## PHASE 0 — ACCESS BUNDLE (Human-First, One Session)

Time estimate: 30-60 minutes.

Complete all steps below in a single session before asking agents to run Phase 1.
Steps are in strict dependency order — do not reorder. P0-04 must precede P0-04b.
P0-05 must precede P0-05b. P0-11 must precede SC-01 (which precedes P0-11a and P0-11b).

Classification key:
  (H)   Human-gated: requires UI action, owner credential, or non-automatable judgment
  (A)   Agent-doable once Phase 0 prerequisites are met
  (H→A) Human does one-time access step; agent does the rest

### Main Phase 0 Steps

| # | Step | Owner | What it unlocks |
|---|---|---|---|
| P0-01 | Create GCP project (`{{GCP_PROJECT_NAME}}`); enable APIs: `analyticsadmin.googleapis.com`, `analyticsdata.googleapis.com`, `searchconsole.googleapis.com` | (H) Google Cloud Console | All GA4 Admin API + GSC API agent calls |
| P0-02 | Create GCP service account; download JSON key file; note the service account email (`name@{{GCP_PROJECT_NAME}}.iam.gserviceaccount.com`); store key at `.secrets/ga4/{{GCP_PROJECT_NAME}}.json`; confirm `.gitignore` covers `.secrets/ga4/*.json` — no key material in repo docs | (H) | Agent API identity. Do NOT grant property access yet — GA4 properties do not exist yet |
| P0-03 | Verify `.secrets/ga4/*.json` is in `.gitignore`; confirm no credential in any markdown or plan file | (H) security check | Safe credential storage; required before any agent API call |
| P0-04 | Create GA4 **production** property in GA4 UI (Admin → Create property): name = `{{BUSINESS_NAME}} Production`, timezone = `{{TIMEZONE}}`, currency = `{{CURRENCY}}`; record Property ID in IDs Glossary | (H) GA4 UI | Production GA4 property exists |
| P0-04b | In GA4 Admin → production property → Property access management: add service account email from P0-02 with `Analytics Editor` role | (H) GA4 UI | Agent GA4 Admin API + Data API access for production property — must follow P0-04 |
| P0-05 | Create GA4 **staging** property in GA4 UI (same settings, name = `{{BUSINESS_NAME}} Staging`); record staging Property ID | (H) GA4 UI — Policy-02 | Staging isolation; separate measurement baseline |
| P0-05b | In GA4 Admin → staging property → Property access management: add service account email with `Analytics Editor` role | (H) GA4 UI | Agent access to staging property — must follow P0-05 |
| P0-06a | Create Cloudflare API token — **DNS-Edit**: scopes `Zone:DNS:Edit` + `Zone:Zone:Read`; name token `{{BUSINESS_CODE}}-dns-edit`; label it "bootstrap only — rotate after Phase 1"; store token value as GitHub repo secret `CLOUDFLARE_API_TOKEN_DNS_EDIT` | (H) Cloudflare UI — Policy-01 | SC-01, D-01, D-02 DNS operations; rotate/revoke after Phase 1 completes |
| P0-06b | Create Cloudflare API token — **Analytics-Read**: scope `Analytics:Read`; name token `{{BUSINESS_CODE}}-analytics-read`; store as GitHub repo secret `CLOUDFLARE_API_TOKEN_ANALYTICS_READ` | (H) Cloudflare UI — Policy-01 | Zone analytics, 404 rollup workflow (long-lived, safe to keep active) |
| P0-07 | Create Cloudflare Pages project; connect to `{{GITHUB_REPO}}`; configure production branch (`main`) and preview/staging branch; attach custom domain `{{PRODUCTION_DOMAIN}}`; note Cloudflare Account ID and Zone ID in IDs Glossary | (H) Cloudflare UI | Staging + production deploy targets; GitHub Actions env var namespace |
| P0-08 | Add GitHub Actions **repo-level secrets**: `CLOUDFLARE_API_TOKEN_DNS_EDIT`, `CLOUDFLARE_API_TOKEN_ANALYTICS_READ`, `CLOUDFLARE_ACCOUNT_ID` | (H) GitHub Settings → Secrets | CI/CD pipeline access to Cloudflare |
| P0-09 | Declare agent GitHub auth mechanism: create Personal Access Token (PAT) with `repo` + `secrets:write` scopes, OR configure GitHub App installation on `{{GITHUB_REPO}}`; store credential outside repo; document which environments and variables the agent is authorised to update | (H) — Policy-06 prerequisite | Enables GH-01 through GH-04 as (A); without this, all GitHub variable steps remain (H) |
| P0-10 | Create GitHub Actions `production` and `staging` Environments (Settings → Environments); add `NEXT_PUBLIC_GA_MEASUREMENT_ID` as an environment variable: production env = production stream Measurement ID; staging env = staging stream Measurement ID (from P0-04/P0-05 above) | (H→A) after P0-09 — Policy-02 | Environment-isolated measurement IDs baked into GitHub Actions builds |
| P0-11 | Add Google Search Console Domain property (`sc-domain:{{PRODUCTION_DOMAIN}}`); GSC will display a DNS TXT record value — record this TXT record value here: [TXT VALUE FROM GSC]; do NOT click "Verify" yet — agent adds the TXT record via Cloudflare DNS in SC-01, then verification follows | (H) GSC UI | GSC property exists; TXT value known for SC-01 |
| P0-12 | Confirm canonical hostname decision: apex-only (`{{PRODUCTION_DOMAIN}}`) vs www-primary (`www.{{PRODUCTION_DOMAIN}}`); document decision | (H) decision | All downstream URL references, sitemap, NEXT_PUBLIC_SITE_ORIGIN, Cloudflare custom domain config |

### Deferred Phase 0 Steps

Complete these AFTER Phase 1 SC-01 completes and DNS propagates (usually within minutes on Cloudflare):

| # | Step | Owner | Notes |
|---|---|---|---|
| P0-11a | In GSC UI: click "Verify" if auto-verification has not occurred within 5-10 minutes of SC-01 completing; confirm property shows as Verified | (H) GSC UI | DNS TXT propagates fast on Cloudflare; often auto-verifies. Required before P0-11b |
| P0-11b | In GSC Settings → Users and permissions: add service account email from P0-02 with `Full` access | (H) GSC UI — no API to grant SA access to GSC | Unlocks SC-02 sitemap submit, SC-03a Search Analytics API, URL Inspection API (SC-03c) |

### Phase 0 Blockers Checklist

Before handing over to agent for Phase 1, confirm ALL of the following:

- [ ] P0-01: GCP project created; all three APIs enabled
- [ ] P0-02: Service account created; JSON key downloaded and stored at `.secrets/ga4/{{GCP_PROJECT_NAME}}.json`
- [ ] P0-03: `.gitignore` covers `.secrets/ga4/*.json`; no credential in any doc
- [ ] P0-04 + P0-04b: Production GA4 property created; service account has Analytics Editor role
- [ ] P0-05 + P0-05b: Staging GA4 property created; service account has Analytics Editor role
- [ ] P0-06a: Cloudflare DNS-Edit token created; stored as `CLOUDFLARE_API_TOKEN_DNS_EDIT` in GitHub
- [ ] P0-06b: Cloudflare Analytics-Read token created; stored as `CLOUDFLARE_API_TOKEN_ANALYTICS_READ`
- [ ] P0-07: Cloudflare Pages project created; GitHub repo connected; production + staging branches set
- [ ] P0-08: Cloudflare secrets in GitHub repo-level secrets
- [ ] P0-09: Agent GitHub auth mechanism declared and documented
- [ ] P0-10: GitHub `production` and `staging` Environments created; `NEXT_PUBLIC_GA_MEASUREMENT_ID` set per environment
- [ ] P0-11: GSC Domain property created; TXT record value noted; NOT yet verified
- [ ] P0-12: Canonical hostname confirmed

Deferred (complete after Phase 1 SC-01 + DNS propagation):
- [ ] P0-11a: GSC property verified
- [ ] P0-11b: Service account granted Full access in GSC

---

## PHASE 1 — AGENT-AUTOMATED CONFIGURATION

Prerequisites: Phase 0 complete. Service account key loaded from `.secrets/ga4/{{GCP_PROJECT_NAME}}.json`.

IMPORTANT — token usage rule:
- Use `CLOUDFLARE_API_TOKEN_DNS_EDIT` for SC-01, D-01, D-02 only (DNS write operations).
- Use `CLOUDFLARE_API_TOKEN_ANALYTICS_READ` for analytics/404 queries only.
- NEVER use the Analytics-Read token for DNS operations — it has no DNS write scope and returns 403.
- NEVER use the DNS-Edit token for analytics queries — use the scoped analytics token (Policy-01).

### GA4 Configuration

| # | Step | API / mechanism | Owner |
|---|---|---|---|
| G-01 | Create web data stream for production URL on production property; capture Measurement ID; store in IDs Glossary | GA4 Admin API `POST /v1beta/properties/{propertyId}/dataStreams` | (A) |
| G-02 | Create web data stream for staging URL on staging property; capture staging Measurement ID; confirm it differs from production Measurement ID — Policy-02 | GA4 Admin API | (A) |
| G-03 | Register web-vitals custom dimensions on both properties: `metric_id`, `metric_value`, `metric_delta`, `metric_rating`, `navigation_type` | GA4 Admin API `POST /v1beta/properties/{propertyId}/customDimensions` | (A) |
| G-04 | Create key events on production property: `begin_checkout`, `purchase` (minimum); add any business-specific conversion events from intake packet | GA4 Admin API `POST /v1beta/properties/{propertyId}/keyEvents` | (A) |
| G-05 | Set canonical funnel conversion event — Policy-07: if business uses external checkout (e.g. Octorate, Booking.com, Shopify external redirect): create `handoff_to_engine` key event; if native checkout: `purchase` is correct | GA4 Admin API | (A) |
| G-06 | Configure internal traffic definition: `POST /v1beta/properties/{propertyId}/dataFilters` with type `internalTrafficFilter`; add office/dev IP ranges and VPN CIDRs | GA4 Admin API | (A) |
| G-07 | Activate internal traffic filter: `PATCH /v1beta/properties/{propertyId}/dataFilters/{filterId}` with body `{"state": "ACTIVE"}` — Policy-05 | GA4 Admin API | (A) — Phase 3 PV-06 confirms this as a read check only |
| G-08 | Add cross-domain domains in GA4 Tag Settings > Configure your domains | **GA4 UI only — (H)** | No GA4 Admin API endpoint exists for this. GA4 may auto-surface domain suggestions when cross-origin hits are detected. Owner must accept suggestions OR add external checkout domain manually in GA4 UI. Cannot be automated. |
| G-09 | Set unwanted referrals: exclude external checkout domain (if applicable) to prevent checkout return as new session | GA4 Admin API | (A) |

### Search Console

SC-01, SC-02, SC-03a all require the DNS-Edit token or siteFullUser grant respectively. Read the
ordering note below before running SC-01.

| # | Step | API / mechanism | Owner |
|---|---|---|---|
| SC-01 | Add DNS TXT record from P0-11 for GSC ownership verification | Cloudflare API with `CLOUDFLARE_API_TOKEN_DNS_EDIT` `POST /zones/{zone_id}/dns_records` | (A) — after this completes, trigger deferred P0-11a and P0-11b |
| SC-02 | Submit sitemap: `https://{{PRODUCTION_DOMAIN}}/sitemap_index.xml` (or sitemap URL confirmed in P0-12) | Search Console API `POST /webmasters/v3/sites/{site}/sitemaps/{feedpath}` | (A) — requires P0-11b (siteFullUser grant) completed |
| SC-03a | Extract Search Analytics baseline: last 28 days of clicks, impressions, CTR, position by page and query; write to `docs/business-os/strategy/{{BUSINESS_CODE}}/search-console-baseline-{{DATE}}.json` | Search Console API `searchanalytics.query` | (A) — requires P0-11b |
| SC-03b | Export Pages report summary counts (Indexed, Discovered-not-indexed, 404) from GSC UI; attach to baseline artifact | **GSC UI export — (H)** | Coverage/Pages report totals have **no bulk API** — manual GSC UI export only. Agent cannot extract these programmatically. |
| SC-03c | URL Inspection API check: for a fixed named set (home, /book, top 5 landing pages), get per-URL index status via `urlInspection/index:inspect`; record results in baseline artifact | Search Console API `urlInspection/index:inspect` (optional) | (A) — requires P0-11b; use for critical path URLs only, not as a Coverage proxy |

SC-01 → deferred P0-11a/P0-11b → SC-02 ordering:
- SC-01 adds TXT record (agent, Phase 1, uses DNS-Edit token)
- P0-11a human verifies GSC property (after DNS propagation, usually minutes)
- P0-11b human grants service account siteFullUser in GSC UI
- SC-02 and SC-03a require P0-11b before running

### DNS & Redirect Architecture

| # | Step | API / mechanism | Owner |
|---|---|---|---|
| D-01 | Set apex domain DNS record: CNAME or A record for `{{PRODUCTION_DOMAIN}}` pointing to Cloudflare Pages/Workers | Cloudflare API with `CLOUDFLARE_API_TOKEN_DNS_EDIT` | (A) |
| D-02 | Set www subdomain DNS record: CNAME for `www.{{PRODUCTION_DOMAIN}}` → apex redirect (or www-primary per P0-12) | Cloudflare API with `CLOUDFLARE_API_TOKEN_DNS_EDIT` | (A) |
| D-03 | Create `public/_redirects` with minimum redirect rules per P0-12 canonical decision: at minimum `308 /` → `/<default-lang>/` (i18n) and `308 /book` → `/<lang>/book` (canonical booking path). Middleware does not run on static Cloudflare Pages export — all redirects must be in `_redirects` | File in repo | (A) code |
| D-04 | Automated redirect health check: apex resolves, www redirects correctly, booking path redirects correctly; confirm 308 `Location` headers are correct | curl / Playwright | (A) |

Note: every DNS write step (D-01, D-02, SC-01) uses `CLOUDFLARE_API_TOKEN_DNS_EDIT`.
`CLOUDFLARE_API_TOKEN_ANALYTICS_READ` has no DNS write scope and will return 403 on these calls.

### GitHub Actions & Environment Variables

| # | Step | API / mechanism | Owner |
|---|---|---|---|
| GH-01 | Confirm `NEXT_PUBLIC_GA_MEASUREMENT_ID` environment-scoped variables are correct: production env = production stream Measurement ID (from G-01); staging env = staging stream Measurement ID (from G-02) | GitHub Environment variables — verify via API if P0-09 PAT/App declared; otherwise human confirms | (H→A) — depends on P0-09 |
| GH-02 | Set `NEXT_PUBLIC_SITE_ORIGIN`, `NEXT_PUBLIC_SITE_DOMAIN`, `NEXT_PUBLIC_BASE_URL` per environment using canonical hostname from P0-12 | GitHub Environment variables | (H→A) — depends on P0-09 |
| GH-03 | Set `NEXT_PUBLIC_CONSENT_BANNER=1` in production and staging GitHub environments | GitHub Environment variables | (H→A) — depends on P0-09 |
| GH-04 | Confirm `NEXT_PUBLIC_NOINDEX_PREVIEW=1` is set for staging env; confirm it is ABSENT from production env (production must be indexable) | GitHub Environment variables — read-verify | (A) — fail if present in production |

### Code Integration (Next.js + Cloudflare stack)

| # | Step | Pattern | Owner |
|---|---|---|---|
| C-01 | Load `gtag.js` in root `layout.tsx` via `<Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}">` — Policy-03: direct gtag, no GTM | Next.js Script | (A) |
| C-02 | Initialise Consent Mode v2 **before** gtag.js loads: use a synchronous inline `<script dangerouslySetInnerHTML>` placed in `<head>` BEFORE the `<Script strategy="afterInteractive">` tag — Policy-04 | Consent Mode v2 | (A) — use known-good snippet below |
| C-03 | Integrate CMP (`vanilla-cookieconsent` v3 recommended: MIT, <15kB gzipped, Consent Mode v2 native, zero backend) gated by `NEXT_PUBLIC_CONSENT_BANNER` env var | CMP | (A) — EU businesses must enable |
| C-04 | Write `ga4-events.ts` central enum/helper module: event names, required params, optional params; all GA4 event calls go through this module | Convention | (A) |
| C-05 | Add web-vitals integration: `reportWebVitals` → gtag custom event with `metric_id`, `metric_value`, `metric_delta`, `metric_rating`, `navigation_type` dimensions (from G-03) | Next.js pattern | (A) |
| C-06 | For all CTAs that navigate same-tab to external checkout: add `transport_type: "beacon"` + `event_callback` handler to the GA4 event call | Pattern | (A) — required for event reliability when tab leaves; without this, events may be lost |
| C-07 | For external checkout: add cross-domain linker param to all outbound booking URLs — only after G-08 is confirmed active by owner | Pattern | (A) — depends on G-08 owner action |

### Known-Good Consent Mode v2 Snippet (C-02)

Copy-paste verbatim into layout.tsx. This is the authoritative form — do not use `{all: 'denied'}`.

```html
<!-- CONSENT MODE v2 — must appear in <head> BEFORE the afterInteractive gtag.js Script tag -->
<script dangerouslySetInnerHTML={{__html: `
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
`}} />
```

Ordering rule: the inline `<script>` above must appear in layout.tsx `<head>` BEFORE the
`<Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=...">` tag.
The consent default must execute synchronously before any gtag event is emitted.

### GTM Policy

Do NOT add Google Tag Manager. Use direct gtag.js (Policy-03). Add GTM only when:
- >=3 distinct third-party marketing pixel tags need simultaneous management, AND
- A non-engineer owner needs to deploy tag changes without code deploys.
Brik evaluated and rejected GTM as unjustified overhead. This is the startup loop default.

### Cloudflare 404 Rollup Cron

Create `.github/workflows/cloudflare-404-rollup.yml`:
- Schedule: `on: schedule: - cron: '0 2 * * *'` (daily at 02:00 UTC)
- Uses `CLOUDFLARE_API_TOKEN_ANALYTICS_READ` + `CLOUDFLARE_ACCOUNT_ID` from repo secrets
- Queries Cloudflare GraphQL `httpRequestsAdaptiveGroups` for 404 paths in the previous day
- Outputs to `.tmp/cloudflare-404-rollup-<YYYY-MM-DD>.json`

Initialise on launch day (Phase 3 PV-08): trigger a manual run for day 0 so no gap exists
in the 404 history from launch day. Cloudflare GraphQL lookback limit is ~8 days.

---

## PHASE 2 — STAGING VERIFICATION

Run before any production deploy. All checks must pass before the site goes live.

Consent and DebugView note (applies to V-02 and V-03):
Events will NOT appear in GA4 DebugView if `analytics_storage` is `denied`. For staging QA,
the test session MUST have `analytics_storage: granted` — either by accepting analytics cookies
via the CMP on staging, or by temporarily setting `debug_mode: true` in the staging `gtag('config', ...)`
call. Do NOT check DebugView with consent denied and conclude GA4 is broken.

| # | Check | Owner | Pass criteria |
|---|---|---|---|
| V-01 | `curl -s https://{{STAGING_DOMAIN}}/` — confirm staging `gtag/js?id=G-...` present in page source | (A) curl | Staging Measurement ID (from G-02) in page source; NOT the production ID |
| V-02 | Enable GA4 debug mode for test device via Tag Assistant (`https://tagassistant.google.com`) OR add `debug_mode: true` to staging `gtag('config', ...)` call; accept analytics cookies in the CMP; confirm `web_vitals` and `page_view` events appear in GA4 DebugView for the staging property | (H) manual | Events visible in DebugView after consent granted. Note: `?gtag_debug=1` is not a standardised GA4 parameter — use Tag Assistant or `debug_mode: true` instead. |
| V-03 | Click primary CTA on staging; confirm GA4 event fires (Chrome DevTools network panel: /g/collect endpoint returns HTTP 204 for the event) — test session must have analytics cookies accepted | (H) manual | Event visible in network panel (HTTP 204) and in DebugView after consent granted |
| V-04 | Staging `_redirects` rules resolve correctly: apex/www/canonical paths all redirect as expected | (A) curl/Playwright | HTTP 308 with correct `Location` headers for all redirect rules in `public/_redirects` |
| V-05 | Staging Measurement ID ≠ production Measurement ID AND staging Measurement ID belongs to a different GA4 property ID (not just a different stream in the same property) — Policy-02 | (A) env var read + GA4 Admin API `GET /v1beta/properties/{propertyId}/dataStreams/{streamId}` for each stream | Both conditions must pass. ID difference alone is not sufficient — check the parent property ID for each stream. |
| V-06 | Run `lp-launch-qa` pre-flight against staging: GA4 beacon, structured data, Core Web Vitals, consent banner behaviour | (A) skill | `lp-launch-qa` returns `go` |

---

## PHASE 0 PREREQUISITE SUMMARY

Confirm all main Phase 0 steps complete before handing to agent for Phase 1.
Deferred steps (P0-11a, P0-11b) complete after Phase 1 SC-01 + DNS propagation.

Complete Phase 0 status:
- [ ] P0-01 GCP project + APIs
- [ ] P0-02 Service account + key downloaded + stored
- [ ] P0-03 .gitignore verified
- [ ] P0-04 Production GA4 property
- [ ] P0-04b Service account Analytics Editor on production property
- [ ] P0-05 Staging GA4 property
- [ ] P0-05b Service account Analytics Editor on staging property
- [ ] P0-06a DNS-Edit Cloudflare token
- [ ] P0-06b Analytics-Read Cloudflare token
- [ ] P0-07 Cloudflare Pages project + custom domain
- [ ] P0-08 Cloudflare secrets in GitHub repo
- [ ] P0-09 Agent GitHub auth mechanism declared
- [ ] P0-10 GitHub Environments + NEXT_PUBLIC_GA_MEASUREMENT_ID per environment
- [ ] P0-11 GSC Domain property created; TXT value noted
- [ ] P0-12 Canonical hostname confirmed

Deferred (after SC-01 + DNS propagation):
- [ ] P0-11a GSC property verified (H)
- [ ] P0-11b Service account granted Full access in GSC (H)

---

## DEMAND SIGNAL CAPTURE (Parallel to Phase 0-2)

Infra setup (Phases 0-2) is a prerequisite for measurement, but demand signal capture must begin in parallel — not after infra is complete. Delaying capture until infra is ready introduces 1-2 weeks of avoidable S6B activation lag.

**What to start now (alongside Phase 0):**

1. Register at least 1 message hypothesis in `docs/business-os/strategy/<BIZ>/message-variants.user.md`:
   - Channel, audience_slice, asset_ref, timestamp for each variant
   - Minimum 2 variants per hypothesis

2. Set up source-tagged tracking before any impressions go out (UTM or nearest-origin tag per channel)

3. Log objections from any early outreach, discovery calls, or landing page visits

**Schema and pass floor:** `docs/business-os/startup-loop/demand-evidence-pack-schema.md`

**Why this matters:** Demand Evidence Pack (DEP) is required before GATE-S6B-ACT-01 (spend authorization). DEP capture cannot be retroactively reconstructed from infra data alone — it requires active logging of variants, denominators, and objections from the start.

---

## OUTPUT FORMAT

Produce each section in order:

A) SETUP SCOPE AND ASSUMPTIONS
   - Business, date, domain, deployment platform
   - Phase 0 completion confirmed (list any incomplete items as blockers)
   - Service account key path and email confirmed (no key values in output)
   - IDs Glossary populated with all discovered IDs

B) PHASE 0 STATUS TABLE
   | Item | Status | Notes |
   |------|--------|-------|
   | P0-01 | DONE / PENDING / BLOCKED | |

C) PHASE 1 EXECUTION RESULTS
   | Step | Owner | Status | Evidence |
   |------|-------|--------|----------|
   | G-01 | A | DONE / FAILED | Measurement ID: G-XXXXXXXXXX |

D) PHASE 2 VERIFICATION RESULTS
   | Check | Owner | Status | Notes |
   |-------|-------|--------|-------|
   | V-01 | A | PASS / FAIL | |

E) BLOCKERS AND EXACT NEXT ACTIONS
   For any item that is BLOCKED or FAILED:
   - Exact item ID
   - Reason for block
   - Exact next action (one command or UI step)
   - Owner (H or A)
   - Dependency (what must complete first)

F) READY-TO-SEND OPERATOR HANDOFF MESSAGE
   - Summary for business owner: what is done, what requires their action, what is pending
   - List all (H) steps that require owner UI access
   - State which (H) steps are unblocked now vs deferred (P0-11a, P0-11b after DNS)
   - Include Phase 3 reminder: run post-deploy-measurement-verification-prompt after first production deploy

---

RULES:
- Do not invent access credentials or property IDs.
- Do not include secret values in any output section.
- Every step must be classified (H), (A), or (H→A).
- Every DNS write step (SC-01, D-01, D-02) must name CLOUDFLARE_API_TOKEN_DNS_EDIT explicitly.
- G-08 is (H) only — no GA4 Admin API exists for cross-domain linking configuration.
- SC-03b is (H) only — no GSC Coverage/Pages bulk API exists.
- V-05 must check both: different Measurement ID AND different property ID.
- For V-02/V-03: remind operator that analytics_storage must be granted before DebugView shows events.
- Do not use ?gtag_debug=1 — not a standardised GA4 parameter. Use Tag Assistant or debug_mode:true.
- The Consent Mode v2 snippet must use the explicit per-signal form above, not {all: 'denied'}.
- No brik-specific IDs, domains, or project names in any section — all must use {{PLACEHOLDER}} form.
```
