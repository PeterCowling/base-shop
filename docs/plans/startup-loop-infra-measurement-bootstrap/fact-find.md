---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Mixed
Created: 2026-02-17
Last-updated: 2026-02-17
Feature-Slug: startup-loop-infra-measurement-bootstrap
Execution-Track: business-artifact
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-launch-qa
Related-Plan: docs/plans/startup-loop-infra-measurement-bootstrap/plan.md
Business-OS-Integration: off
Business-Unit: PIPE
Card-ID: none
---

# Startup Loop — Infrastructure & Measurement Bootstrap: Fact-Find Brief

## Scope

### Summary

The startup loop's `S1B` (Measurement Bootstrap) stage was designed when BRIK was the first live
business. It covers GA4 property + Search Console setup at a high level — but real brik execution
revealed a much larger surface that must be set up before a sales funnel can operate and be measured
end-to-end in production.

This fact-find mines every brik fact-find and planning document to extract the complete infrastructure
and measurement setup footprint. The goal is to expand and sharpen the startup loop so future startups
benefit from hard-won brik experience — particularly the **agent-access front-loading pattern**: get
all API tokens, service accounts, and hosting projects created in one human-owned session (Phase 0),
then let agents execute everything else unattended.

**Evidence source**: 6 brik fact-find/plan docs + 3 strategy/measurement-setup notes, dated
2026-02-12 through 2026-02-17.

Each fact in the setup footprint is marked as:
- **Observed constraint** — something that broke or was missing in brik
- **Derived policy** — what the startup loop will now enforce as a result

### Goals

- Document the complete infrastructure setup footprint mined from brik experience
- Identify every human-gating point with its minimum required action and which agent capability it
  unlocks
- Identify every agent-automatable step so they can be encoded into updated prompt templates
- Recommend concrete startup loop changes: which stages and gates to update, which prompt templates
  to create

### Non-goals

- Writing or modifying any production code for brik
- Replacing or disrupting the current loop-spec.yaml (PIPE changes require their own plan+sequence)
- Covering Google Ads account linking (deferred by brik; stub only)
- Covering GTM Server-Side (explicitly excluded — see Policy-03)

### Constraints & Assumptions

- Constraints:
  - `loop-spec.yaml` is version-controlled at `spec_version: "1.1.0"` — new stages require a version
    bump + downstream alignment per `VC-02`
  - S1B prompt template is referenced by filename in loop-spec; renaming requires sync
  - New prompt templates must use `{{PLACEHOLDER}}` fill-before-use convention
- Assumptions:
  - Target deployment stack: Next.js + GitHub Actions build → Cloudflare Pages (staging) +
    Cloudflare Workers (production). See deployment model in Data & Contracts.
  - All startups use GA4 and Google Search Console.
  - GTM is NOT added by default (Policy-03).

---

## Evidence Audit (Current State)

### Key Evidence Sources (max 10)

1. `docs/plans/archive/brik-ga4-world-class-fact-find.md` — Foundational GA4 setup audit (2026-02-12);
   exact property IDs, service account pattern, consent mode decision, missing links at that point
2. `docs/business-os/strategy/BRIK/2026-02-12-ga4-search-console-setup-note.user.md` — GA4 + GSC
   setup checklist; 6-section breakdown; owner/agent classification per step
3. `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md` — Post-deploy
   verification results; GA4 collect endpoint live, DNS TXT records present, first baseline extracted
4. `docs/plans/brikette-cta-sales-funnel-ga4/fact-find.md` — Full CTA + GA4 audit (BRIK-005);
   GA4 event semantics model, staging isolation gap (confirmed active problem), consent mode gating
5. `docs/plans/brikette-octorate-funnel-reduction/fact-find.md` — Deep infrastructure audit
   (BRIK-ENG-0021, 2026-02-17); GA4 Admin API usage, Cloudflare API token patterns, Search Console
   API extracts, cross-domain linking, redirect architecture, external checkout handoff
6. `docs/plans/brikette-octorate-funnel-reduction/ga4-handoff-capture-investigation.md` — Root-cause
   analysis of GA4 event persistence failure; internal traffic filter stuck in `Testing` state;
   GA4 Data API processing latency confirmed (hits collect but take hours to appear in reports)
7. `docs/plans/archive/brikette-staging-to-live-launch-fact-find.md` — Pre-production checklist;
   GitHub Actions secrets, env vars, canonical hostname decision
8. `docs/business-os/strategy/BRIK/2026-02-17-brikette-sales-funnel-external-brief.user.md` —
   GA4 tag quality warnings, cross-domain linking pending state (owner UI action required),
   handoff mode inconsistency

### Patterns & Conventions Observed

- **Access-first pattern** — GCP service account created before any GA4 Admin API automation; key
  stored at `.secrets/ga4/*.json` (git-ignored). Correct sequencing.
  Evidence: `brik-ga4-world-class-fact-find.md`
- **Service account grant ordering bug (brik)** — Service account access was attempted before GA4
  properties existed. Grants must follow property creation, not precede it.
  Evidence: observed during brik setup note (P0 items out of order)
- **Scoped Cloudflare API tokens must be split by capability** — analytics/read token is insufficient
  for DNS operations. Single token caused confusion about what agents could do.
  Evidence: `brikette-octorate-funnel-reduction/fact-find.md` + correction applied here
- **Staging isolation gap** — Staging and production shared the same GA4 measurement ID.
  Evidence: `brikette-cta-sales-funnel-ga4/fact-find.md`
- **Consent Mode v2 gated by env var** — Cookie consent controlled by `NEXT_PUBLIC_CONSENT_BANNER=1`;
  defaults all signals to denied. Correct GDPR-safe pattern.
  Evidence: `brik-ga4-world-class-fact-find.md`
- **Direct gtag.js, no GTM** — GTM explicitly called out as unjustified at current scale.
  Evidence: `brik-ga4-world-class-plan.md`
- **`_redirects` file for Cloudflare Pages** — Middleware doesn't run on static export; all redirects
  go in `public/_redirects`.
  Evidence: `brikette-octorate-funnel-reduction/fact-find.md` + MEMORY.md
- **DebugView consent interaction** — Events do not appear in GA4 DebugView if `analytics_storage`
  is `denied`. QA must either (a) accept analytics cookies in the test session, or (b) use a
  staging-only `debug_mode: true` config override. `?gtag_debug=1` is not a standardised GA4
  parameter and must not be used in templates.
  Evidence: `brikette-cta-sales-funnel-ga4/fact-find.md` + Google Consent Mode docs
- **Internal traffic filter must be `Active`** — Filter in `Testing` state does not exclude
  internal traffic. Brik had it stuck in `Testing` throughout the investigation period.
  Evidence: `ga4-handoff-capture-investigation.md`
- **Cross-domain linking requires owner UI action** — GA4 may auto-surface "additional domain"
  suggestions when it detects cross-origin hits. Owner must accept these in GA4 Tag Settings UI.
  There is **no GA4 Admin API endpoint** for configuring cross-domain linked domains.
  Evidence: `2026-02-17-brikette-sales-funnel-external-brief.user.md` + GA4 Admin API surface review
- **GA4 Data API latency** — Standard GA4 Data API reports lag hours to ~24h after events collect.
  DebugView/Realtime is the only T+0 verification mechanism.
  Evidence: `ga4-handoff-capture-investigation.md`
- **Search Console Coverage/Pages API not available** — The Coverage report (Indexed, Discovered-not-indexed,
  404 counts) has no bulk-export API. Only available via manual GSC UI export.
  Evidence: `brikette-octorate-funnel-reduction/fact-find.md` — API surface investigation

### Data & Contracts

**Deployment model (default: Next.js + Cloudflare stack):**

| Environment | Build system | Artifact | Host |
|---|---|---|---|
| Staging / PR preview | GitHub Actions | Static export (`out/`) | Cloudflare Pages (Preview branch) |
| Production | GitHub Actions | Workers build (`.open-next/`) | Cloudflare Workers |

`NEXT_PUBLIC_*` variables are baked into the bundle at **GitHub Actions build time**.
They are **NOT** set in the Cloudflare Pages dashboard when GitHub Actions does the build.
Use GitHub Environment variables (not repo-level; scoped to `staging` vs `production` environment)
for `NEXT_PUBLIC_GA_MEASUREMENT_ID` and similar build-time vars.

Runtime server-side secrets for Workers: `wrangler secret put <NAME>` — separate from build-time vars.

Businesses using Cloudflare's built-in CI (not GitHub Actions): set env vars in
Cloudflare Pages Settings > Environment variables instead.

**GA4 Admin API endpoints used by agents:**
- `analyticsadmin.googleapis.com/v1beta/properties/{property}/dataFilters` — create/update filters
  - G-07 uses `PATCH properties/{property}/dataFilters/{filter}` with `state: ACTIVE`
- `analyticsadmin.googleapis.com/v1beta/properties/{property}/customDimensions` — custom dimensions
- `analyticsadmin.googleapis.com/v1beta/properties/{property}/keyEvents` — conversion events
- `analyticsadmin.googleapis.com/v1alpha/properties/{property}/channelGroups` — channel groupings
- `analyticsdata.googleapis.com/v1beta/properties/{property}:runReport` — baseline extraction
- Requires: service account with `Analytics Editor` role on each property; both API namespaces
  enabled in GCP project

**Search Console API — what IS and IS NOT available:**
- ✅ `searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query` — clicks,
  impressions, CTR, position by page/query/device/date. Agent-automatable.
- ✅ `searchconsole.googleapis.com/webmasters/v3/sitemaps/{feedpath}` — sitemap submit/list.
- ✅ `searchconsole.googleapis.com/v1/urlInspection/index:inspect` — per-URL index status for
  a named set of URLs. Agent-automatable for a fixed small set.
- ❌ Coverage/Pages report totals (Indexed count, Discovered-not-indexed count, 404 count) —
  **no bulk API**; manual GSC UI export only.
- Requires: service account granted `siteFullUser` on the GSC property (GSC UI only — no API
  for granting service account access)

**Cross-domain linking — no Admin API:**
- GA4 Tag Settings > Configure your domains is UI-only.
- GA4 may auto-surface "additional domain" suggestions when cross-origin hits are detected.
- Owner must accept suggestions or manually add domains in GA4 Tag Settings UI.
- **No GA4 Admin API endpoint** exposes this configuration.
- Classification: `(H)` only — not `(H→A)`.

**Cloudflare API — split by capability:**
- `api.cloudflare.com/client/v4/graphql` — zone analytics, 404 rollup
  - Token: `CLOUDFLARE_API_TOKEN_ANALYTICS_READ` (scope: `Analytics:Read`)
- `api.cloudflare.com/client/v4/zones/{zone_id}/dns_records` — DNS record management
  - Token: `CLOUDFLARE_API_TOKEN_DNS_EDIT` (scopes: `Zone:DNS:Edit`, `Zone:Zone:Read`)
  - This token has write access to the zone. Rotate/revoke after Phase 1 DNS setup completes.

**GitHub Actions model (for default Cloudflare stack):**
- Repo-level secrets: `CLOUDFLARE_API_TOKEN_DNS_EDIT`, `CLOUDFLARE_API_TOKEN_ANALYTICS_READ`,
  `CLOUDFLARE_ACCOUNT_ID`, `SOPS_AGE_KEY` (main-only)
- GitHub Environments (`staging`, `production`): environment-scoped variables for
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` (different value per environment)
- Agent authorization to write secrets/vars: GitHub PAT with `repo` + `secrets:write`, or
  GitHub App installation — must be declared in Phase 0 before any GH step claims `(A)`

**IDs Glossary — critical for reducing setup failures:**

GA4:

| Name | Example | Where to find | Used for |
|---|---|---|---|
| Property ID | `474488225` | GA4 Admin → Property Settings | Admin API calls, Data API |
| Measurement ID | `G-2ZSYXG8R7T` | GA4 Admin → Data Streams → stream details | `NEXT_PUBLIC_GA_MEASUREMENT_ID`; gtag.js |
| Data Stream ID | `10183287178` | GA4 Admin → Data Streams → URL in browser | Admin API stream-level calls |

Cloudflare:

| Name | Where to find | Used for |
|---|---|---|
| Account ID | Dashboard → top-right or Workers subdomain | wrangler, most API calls |
| Zone ID | Dashboard → right sidebar → Zone ID | DNS API, zone analytics API |

GCP:

| Name | Example | Used for |
|---|---|---|
| Project ID (string) | `brikette-web` | `gcloud` CLI, OAuth, API URLs |
| Project Number | `98263641014` | IAM bindings, some API responses |

GitHub:

| Kind | Set via | Encrypted? | Env-scoped? |
|---|---|---|---|
| Repository secret | Settings → Secrets → Actions | Yes | No (all envs see it) |
| Environment secret | Settings → Environments → {env} → Secrets | Yes | Yes |
| Environment variable | Settings → Environments → {env} → Variables | No | Yes |

### Dependency & Impact Map

- Upstream dependencies (strict ordering in Phase 0):
  - GCP project must exist before service account can be created (P0-01 → P0-02)
  - GA4 properties must exist before service account can be granted access (P0-04 → P0-04b; P0-05 → P0-05b)
  - GSC property must exist before service account can be granted `siteFullUser` (P0-11 → P0-11b)
  - GSC property must be **verified** before `siteFullUser` grant and before SC-03a API queries work
  - Cloudflare Pages project must exist before env vars can be set
  - Hosting project must be linked to GitHub before CI/CD runs
- Downstream dependents:
  - GA4 instrumentation code depends on `NEXT_PUBLIC_GA_MEASUREMENT_ID` per environment
  - `lp-launch-qa` GA4 beacon checks depend on measurement ID in production env
  - `S10` weekly readout depends on GA4 Data API queryable (service account access)
  - Redirect rules in `_redirects` depend on Cloudflare Pages being the deploy target
  - Cross-domain linking depends on GA4 property existing + owner accepting in UI (cannot be automated)
- Likely blast radius if skipped:
  - Staging GA4 isolation: production baselines permanently contaminated
  - Consent mode: GDPR non-compliance from day 1; cannot clean historical data retroactively
  - Internal traffic filter in `Testing` state: team QA hits inflate all funnel metrics
  - Missing DNS-Edit token: SC-01/D-01/D-02 fail with 403 or time out

---

## Derived Policies

These policies are derived from brik failures and are encoded as startup loop enforcement rules.
They are normative (what the loop enforces), not optional guidance.

**Policy-01** — Cloudflare API tokens must be split by capability.
- `CLOUDFLARE_API_TOKEN_DNS_EDIT`: scopes `Zone:DNS:Edit` + `Zone:Zone:Read`. Used for DNS only.
  Rotate or revoke after Phase 1 DNS setup is complete (it has write access to the production zone).
- `CLOUDFLARE_API_TOKEN_ANALYTICS_READ`: scope `Analytics:Read`. Long-lived; safe to leave active.
- Optional: `CLOUDFLARE_API_TOKEN_PAGES_EDIT` if CI manages Pages project via API.
- Rationale: brik used a single token described as "read-only" but relied on DNS edit behavior.
  Mismatch blocks agents.

**Policy-02** — Staging must use a separate GA4 **property**, not just a separate data stream.
- Default (mandated): separate GA4 property for staging. Clean isolation — no filtering required.
- Allowed B (explicit opt-in only, with documented risk): same property + separate data stream. This
  is a **process discipline requirement, not a GA4 enforcement mechanism**. GA4 Data Filters cannot
  reliably exclude staging traffic by hostname at property level in all reporting surfaces. If
  Allowed B is chosen, all baselines and dashboards must include a `streamId` or `hostname` filter
  in every query — and this guarantee erodes over time as new consumers are added. Document explicitly.
- V-05 verification: staging measurement ID ≠ production measurement ID **AND** staging measurement
  ID belongs to a different GA4 property ID. Both conditions required; difference in ID alone is
  not sufficient.

**Policy-03** — GTM is not added by default.
- Direct `gtag.js` (no GTM) is the default for all startup loop businesses.
- Add GTM only when: (a) ≥3 simultaneous third-party tags need management, or (b) a non-engineer
  owner needs to deploy tags without code deploys.
- Rationale: brik explicitly evaluated and rejected GTM as unjustified overhead.

**Policy-04** — Consent Mode v2 must default all signals to denied before any gtag hit is emitted.
- The consent default call must execute before the `gtag('config', ...)` call and before any
  event-emitting code runs.
- In Next.js `layout.tsx`: use a synchronous inline `<script dangerouslySetInnerHTML>` for the
  consent default; then `<Script strategy="afterInteractive">` for the gtag.js load.
- Rationale: Italian GDPR compliance; without Consent Mode v2, Google cannot model conversions for
  EU users and reporting degrades permanently.

**Policy-05** — GA4 internal traffic filter must be in `Active` state before S9B passes.
- Phase 1 G-07 sets it to `Active` via `PATCH properties/{property}/dataFilters/{filter}`.
- Phase 3 (production verification) confirms it is `Active` — read check only.
- `Testing` state is a trap: filter definition exists but no traffic is excluded. Brik had this
  stuck in `Testing` for the entire instrumentation period.

**Policy-06** — Agent GitHub authorization model must be declared in Phase 0.
- Agents cannot write GitHub secrets/variables without an explicit credential grant.
- That grant is a human prerequisite. The startup loop must name the mechanism (PAT vs GitHub App)
  before claiming any GitHub variable step is `(A)`.

**Policy-07** — External checkout businesses use `handoff_to_engine` as the canonical funnel
conversion event; revenue is reconciled probabilistically via booking export, not via pixel.
- Rationale: external JSF/PrimeFaces engines (e.g. Octorate) have no callback/webhook mechanism.
  Cross-domain linker session ID is not echoed back. GA4 can measure pre-handoff only.

---

## Infrastructure Setup Footprint — Mined from Brik

Classification key:
- `(H)` Human-gated: requires manual UI action or credential only the owner can produce
- `(A)` Agent-doable: executable via API/CLI once Phase 0 prerequisites are met
- `(H→A)` Human does one-time access step; agent does the rest

### Phase 0 — Access Bundle (Human-First, Front-Loaded)

Must be completed in one session before agents can run Phase 1.
This is the leverage point: 30-60 min of human effort unlocks all downstream agent automation.

**Steps are in strict dependency order — do not reorder.**

| # | Step | Owner | What it unlocks |
|---|---|---|---|
| P0-01 | Create GCP project; enable APIs: `analyticsadmin.googleapis.com`, `analyticsdata.googleapis.com`, `searchconsole.googleapis.com` | `(H)` | All GA4 Admin API + GSC API |
| P0-02 | Create GCP service account; download JSON key; note service account email (`name@project.iam.gserviceaccount.com`) | `(H)` | Agent API identity; **do not grant access yet — properties don't exist** |
| P0-03 | Store key at `.secrets/ga4/<project>.json`; confirm `.gitignore` covers `.secrets/ga4/*.json`; no key material in repo docs | `(H)` | Safe credential storage; unlocks all agent API calls |
| P0-04 | Create GA4 **production** property in GA4 UI (timezone = business local, currency = operational currency) | `(H)` UI | Production data stream creation; measurement ID capture |
| P0-04b | In GA4 Admin → Property → Property access management: add service account email from P0-02 with `Analytics Editor` role | `(H)` UI | Agent GA4 Admin API + Data API for production property |
| P0-05 | Create GA4 **staging** property in GA4 UI (same settings as production) — Policy-02 | `(H)` UI | Staging data stream; separate baseline |
| P0-05b | In GA4 Admin → staging property → Property access management: add service account email with `Analytics Editor` role | `(H)` UI | Agent access to staging property |
| P0-06a | Create Cloudflare API token — **DNS-Edit**: scopes `Zone:DNS:Edit` + `Zone:Zone:Read`; store as `CLOUDFLARE_API_TOKEN_DNS_EDIT`; label "bootstrap only — rotate after Phase 1" | `(H)` UI | SC-01, D-01, D-02; rotate/revoke after Phase 1 — Policy-01 |
| P0-06b | Create Cloudflare API token — **Analytics-Read**: scope `Analytics:Read`; store as `CLOUDFLARE_API_TOKEN_ANALYTICS_READ` | `(H)` UI | Zone analytics, 404 rollup scripts (long-lived) — Policy-01 |
| P0-07 | Create Cloudflare Pages project; connect to GitHub repo; configure production branch (`main`) and preview/staging branch; attach custom domain | `(H)` UI | Staging + production deploy targets; env var namespace |
| P0-08 | Add GitHub Actions **repo-level secrets**: `CLOUDFLARE_API_TOKEN_DNS_EDIT`, `CLOUDFLARE_API_TOKEN_ANALYTICS_READ`, `CLOUDFLARE_ACCOUNT_ID`, `SOPS_AGE_KEY` (main-only) | `(H)` UI | CI/CD pipeline |
| P0-09 | Declare agent GitHub auth mechanism: create PAT with `repo` + `secrets:write` scope OR configure GitHub App installation; store credential outside repo; document which envs/vars agent may update | `(H)` — Policy-06 prerequisite | Enables GH-01 (A) path; without this all GitHub variable steps remain `(H)` |
| P0-10 | Add GitHub Actions **environment-scoped variables**: create `production` and `staging` Environments; add `NEXT_PUBLIC_GA_MEASUREMENT_ID` = production stream measurement ID in production env; = staging stream measurement ID in staging env | `(H→A)` after P0-09 | Environment-isolated measurement — Policy-02; build-time var baked into bundle by GitHub Actions |
| P0-11 | Add Google Search Console **Domain property** (`sc-domain:<apex-domain>`); GSC shows a DNS TXT record value — note this value; **do NOT click Verify yet** (agent adds TXT in Phase 1 SC-01) | `(H)` UI | GSC property exists; TXT value known for SC-01 |
| P0-12 | Confirm canonical hostname: apex-only (`example.com`) vs www-primary | `(H)` decision | Sitemap, `NEXT_PUBLIC_SITE_ORIGIN`, Cloudflare custom domain config; all downstream URL refs |

**Deferred steps (complete after Phase 1 SC-01 + DNS propagation, usually minutes on Cloudflare):**

| # | Step | Owner | Notes |
|---|---|---|---|
| P0-11a | In GSC UI: click "Verify" if auto-verification has not occurred within 5-10 min of SC-01 completing | `(H)` UI | DNS TXT propagates fast on Cloudflare; usually auto-verifies |
| P0-11b | In GSC Settings → Users and permissions: add service account email with `Full` access | `(H)` UI — GSC has no API to grant service account access | Unlocks SC-03a Search Analytics API queries + URL Inspection API |

**Note on deployment model env var ownership:**
`NEXT_PUBLIC_*` variables are **build-time** vars baked into the bundle by GitHub Actions.
Set them as GitHub Environment variables (P0-10), not Cloudflare Pages dashboard variables.
If Cloudflare's built-in CI is used instead of GitHub Actions, set them in Cloudflare Pages
Settings > Environment variables.

### Phase 1 — Agent-Automated Configuration (requires Phase 0 complete)

#### GA4 Configuration

| # | Step | API / mechanism | Notes |
|---|---|---|---|
| G-01 | Create web data stream for production URL on production property; capture measurement ID | GA4 Admin API | `(A)` |
| G-02 | Create web data stream for staging URL on staging property; capture staging measurement ID | GA4 Admin API | `(A)` — Policy-02; staging property from P0-05 |
| G-03 | Register web-vitals custom dimensions on both properties: `metric_id`, `metric_value`, `metric_delta`, `metric_rating`, `navigation_type` | GA4 Admin API | `(A)` |
| G-04 | Create key events: `begin_checkout`, `purchase` (minimum); add business-specific events | GA4 Admin API | `(A)` |
| G-05 | Set canonical conversion event for the funnel: `handoff_to_engine` for external checkout (Policy-07); `purchase` for native checkout | GA4 Admin API | `(A)` |
| G-06 | Configure internal traffic definition: `POST properties/{property}/dataFilters` with `internalTrafficFilter` type and IP ranges/VPN CIDRs | GA4 Admin API | `(A)` |
| G-07 | Activate internal traffic filter: `PATCH properties/{property}/dataFilters/{filter}` with `state: ACTIVE` | GA4 Admin API | `(A)` — Policy-05; confirmed in Phase 3 PV-06 as a read check |
| G-08 | Add cross-domain domains in GA4 Tag Settings > Configure your domains | **`(H)` UI only** | No GA4 Admin API endpoint exposes this. GA4 may auto-surface suggestions when cross-origin hits are detected. Owner must accept suggestions or add domains manually. Cannot be partially automated. |
| G-09 | Set unwanted referrals: exclude external checkout domain (if applicable) | GA4 Admin API | `(A)` |

#### Search Console

| # | Step | API / mechanism | Notes |
|---|---|---|---|
| SC-01 | Add DNS TXT record from P0-11 for GSC ownership verification | Cloudflare API with `CLOUDFLARE_API_TOKEN_DNS_EDIT` | `(A)` — DNS-Edit token; after this completes, trigger P0-11a/P0-11b |
| SC-02 | Submit sitemap: `https://<domain>/sitemap_index.xml` | Search Console API | `(A)` — requires P0-11b (siteFullUser grant) and sitemap endpoint live in build |
| SC-03a | Extract Search Analytics baseline (last 28 days; clicks, impressions, CTR, position by page and query) via `searchanalytics.query`; store to `docs/business-os/strategy/<BIZ>/search-console-baseline-<date>.json` | Search Console API | `(A)` — requires P0-11b |
| SC-03b | Export Pages report summary counts (Indexed, Discovered-not-indexed, 404, etc.) from GSC UI; attach to baseline artifact | **`(H)` UI** | Coverage/Pages API does not exist. Manual export only. |
| SC-03c | URL Inspection API check: for a fixed named set (home, /book, top 5 landing pages) get per-URL index status via `urlInspection/index:inspect` | Search Console API (optional) | `(A)` — requires P0-11b; use for critical path URLs only, not as a coverage proxy |

**Clarification on SC-01 vs P0-11 ordering:**
- P0-11 creates the GSC property and reveals the TXT record value (human, Phase 0)
- SC-01 adds the TXT record via Cloudflare API (agent, Phase 1)
- P0-11a triggers GSC verification (human, deferred — after DNS propagation)
- P0-11b grants service account access (human, deferred — after property verified)
- SC-02 and SC-03a require P0-11b to be complete before running

#### DNS & Redirect Architecture

| # | Step | API / mechanism | Notes |
|---|---|---|---|
| D-01 | Set CNAME/A record for apex domain → Cloudflare Pages/Workers | Cloudflare API with `CLOUDFLARE_API_TOKEN_DNS_EDIT` | `(A)` — DNS-Edit token |
| D-02 | Set CNAME for `www` → apex redirect | Cloudflare API with `CLOUDFLARE_API_TOKEN_DNS_EDIT` | `(A)` — DNS-Edit token |
| D-03 | Create `public/_redirects` with minimum redirect rules: `308 / -> /<default-lang>/` (i18n), `308 /book -> /<lang>/book` (canonical booking path) | File in repo + Cloudflare Pages deploy | `(A)` code |
| D-04 | Automated health check: apex resolves, www redirects correctly, booking path redirects correctly | curl / Playwright | `(A)` |

Note: `CLOUDFLARE_API_TOKEN_ANALYTICS_READ` is NOT used for DNS steps — it has no DNS write scope
and will return 403. Every DNS step explicitly requires `CLOUDFLARE_API_TOKEN_DNS_EDIT`.

#### GitHub Actions & Env Vars

| # | Step | API / mechanism | Notes |
|---|---|---|---|
| GH-01 | Confirm `NEXT_PUBLIC_GA_MEASUREMENT_ID` environment-scoped variables are correct (production stream ID for production env; staging stream ID for staging env) — set in P0-10 | GitHub Environment variables | `(H→A)` — verify via API if P0-09 auth declared; otherwise human confirms |
| GH-02 | Set `NEXT_PUBLIC_SITE_ORIGIN`, `NEXT_PUBLIC_SITE_DOMAIN`, `NEXT_PUBLIC_BASE_URL` per environment | GitHub Environment variables | `(H→A)` — depends on P0-12 canonical hostname decision |
| GH-03 | Set `NEXT_PUBLIC_CONSENT_BANNER=1` in production GitHub env | GitHub Environment variables | `(H→A)` |
| GH-04 | Confirm `NEXT_PUBLIC_NOINDEX_PREVIEW=1` is set for staging env; confirm absent in production env | GitHub Environment variables | `(A)` read-verify |

#### Code Integration (Next.js + Cloudflare stack)

| # | Step | Pattern | Notes |
|---|---|---|---|
| C-01 | Load `gtag.js` in root `layout.tsx` via `<Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=${NEXT_PUBLIC_GA_MEASUREMENT_ID}">` | Direct gtag — Policy-03 | `(A)` |
| C-02 | Initialise Consent Mode v2 **before** gtag.js loads. Use synchronous inline script before `<Script strategy="afterInteractive">`. | Consent Mode v2 — Policy-04 | `(A)` — use known-good snippet below |

**Known-good Consent Mode v2 default snippet (copy-paste safe, verbatim in template):**

```js
// Must run before gtag.js loads and before any gtag('config',...) call.
// Use as a synchronous inline <script> in layout.tsx <head>, before the afterInteractive Script tag.
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('consent', 'default', {
  ad_storage:             'denied',
  ad_user_data:           'denied',
  ad_personalization:     'denied',
  analytics_storage:      'denied',
  functionality_storage:  'denied',
  personalization_storage:'denied',
  security_storage:       'granted',  // session security, not tracking
  wait_for_update:        500,        // ms before sending hits if CMP not yet resolved
});
gtag('set', 'url_passthrough', true); // preserve URL params for modelled conversions
```

**Critical staging QA note (consent + DebugView interaction):**
Events will NOT appear in GA4 DebugView if `analytics_storage` is `denied`. For QA purposes:
- Either: enable the CMP on staging and accept analytics cookies in the test session before checking DebugView
- Or: use a staging-only `debug_mode: true` flag in the `gtag('config', ...)` call and temporarily
  set `analytics_storage: 'granted'` for the QA device session only
- Do NOT disable Consent Mode on staging — it must be tested as close to production as possible

| # | Step | Pattern | Notes |
|---|---|---|---|
| C-03 | Integrate CMP (`vanilla-cookieconsent` v3 or equivalent) gated by `NEXT_PUBLIC_CONSENT_BANNER` | CMP | `(A)` — EU businesses must enable |
| C-04 | Write `ga4-events.ts` central enum/helper module: event names, required params, optional params | Convention | `(A)` |
| C-05 | Add web-vitals integration (`reportWebVitals` → gtag) | Next.js pattern | `(A)` |
| C-06 | For all CTAs that navigate same-tab to external checkout: add `transport_type: "beacon"` + `event_callback` handler | Pattern | `(A)` — required for event reliability on tab-leaving nav |
| C-07 | For external checkout: add cross-domain linker param to all outbound URLs after G-08 is confirmed active by owner | Pattern | `(A)` — depends on G-08 owner action |

#### GTM Policy

Do NOT add Google Tag Manager by default. Only introduce GTM when ≥3 distinct marketing pixel tags
need simultaneous management. Evidence: brik `brik-ga4-world-class-fact-find.md` — GTM explicitly
rejected as unjustified overhead.

### Cloudflare 404 Rollup Cron

**Mechanism: GitHub scheduled workflow** (`.github/workflows/cloudflare-404-rollup.yml`).

Runs daily at a fixed UTC time (e.g. 02:00 UTC) via `on: schedule: - cron: '0 2 * * *'`.
Uses `CLOUDFLARE_API_TOKEN_ANALYTICS_READ` + `CLOUDFLARE_ACCOUNT_ID` from GitHub repo secrets.
Queries Cloudflare GraphQL `httpRequestsAdaptiveGroups` for 404 paths in the previous day.
Outputs to `.tmp/cloudflare-404-rollup-<YYYY-MM-DD>.json`.

Must be initialised on launch day (PV-08) so there are no gaps in the historical 404 record.
Cloudflare GraphQL lookback limit is ~8 days (86400s window cap); retroactive gap-fill requires
day-by-day queries but is achievable within the ~8-day window.

### Phase 2 — Staging Verification (before any production deploy)

**Consent and DebugView:** For V-02, the test session must have `analytics_storage: granted` (either
by accepting cookies via CMP, or via a staging `debug_mode: true` config). If analytics consent is
denied, DebugView shows nothing — this is correct behaviour, not a bug.

| # | Check | Owner | Pass criteria |
|---|---|---|---|
| V-01 | `view-source:https://staging.<domain>/` — confirm `gtag/js?id=G-...` present | `(A)` curl | Staging measurement ID in page source |
| V-02 | Enable GA4 debug mode for the test device: use [tagassistant.google.com](https://tagassistant.google.com) OR add `debug_mode: true` to the staging `gtag('config', ...)` call; accept analytics cookies in the test session; confirm `web_vitals` events appear in GA4 DebugView | `(H)` manual | `web_vitals` visible in DebugView after consent granted |
| V-03 | Click primary CTA on staging; confirm GA4 event fires (Chrome network DevTools: collect endpoint returns HTTP 204) | `(H)` manual | Event in network payload; DebugView confirms (after consent granted) |
| V-04 | Staging `_redirects` rules resolve correctly | `(A)` curl/Playwright | HTTP 308 with correct `Location` headers for all redirect rules |
| V-05 | Staging measurement ID ≠ production measurement ID **AND** staging measurement ID belongs to a different GA4 property ID | `(A)` env var read + Admin API `properties.get` | Both conditions must pass — Policy-02; ID difference alone is not sufficient |
| V-06 | Run `lp-launch-qa` pre-flight: GA4 beacon, structured data, CWV, consent banner behavior | `(A)` skill | `lp-launch-qa` returns `go` |

### Phase 3 — Production Launch Verification

#### Immediate Checks (T+0, within minutes of first production deploy)

These must pass before calling the launch complete. Use DebugView / Realtime — NOT the GA4 Data API.
GA4 Data API has processing latency of hours to ~24h; checking it at T+0 produces false negatives.

| # | Check | Owner | Pass criteria |
|---|---|---|---|
| PV-01 | `view-source:https://<domain>/` — production measurement ID present | `(A)` curl | Production `G-...` ID in source |
| PV-02 | GA4 DebugView or Realtime: `page_view` events arriving after visiting production site | `(H)` manual — requires GA4 login | Events visible in Realtime within 2 min |
| PV-03 | Chrome DevTools network panel: collect endpoint returns HTTP 204 for `page_view` | `(H)` manual | HTTP 204 response observed |
| PV-04 | Redirect health: apex, www, and booking path all return correct 308 or 200 | `(A)` curl/Playwright | All redirects resolve correctly |
| PV-05 | Consent banner behaviour: Before accept — `analytics_storage` is `denied` AND no `_ga` cookie set. After accept — `analytics_storage` is `granted` AND `_ga` cookie is set AND DebugView events become visible | `(H)` manual | Both before-accept and after-accept states verified |
| PV-06 | Confirm GA4 internal traffic filter status = `Active` | `(A)` Admin API `GET properties/{property}/dataFilters` | `filter.state = ACTIVE` — Policy-05; G-07 set this in Phase 1; this is a read confirmation |
| PV-07 | Confirm `NEXT_PUBLIC_NOINDEX_PREVIEW` absent from production (site is indexable) | `(A)` fetch `robots.txt` | No `Disallow: /` or `noindex` |
| PV-08 | Initialise Cloudflare 404 rollup GitHub workflow: confirm workflow is in `.github/workflows/`; trigger manually for day 0 | `(A)` | `.tmp/cloudflare-404-rollup-<date>.json` populated |

#### Delayed Checks (T+1 and T+7)

Cannot be validated at launch time due to platform processing latency.

| # | Check | When | Owner | Pass criteria |
|---|---|---|---|---|
| DV-01 | GA4 Data API: extract first full-day baseline (sessions, `page_view`, funnel events) | T+24h | `(A)` | Baseline written to `docs/business-os/strategy/<BIZ>/ga4-baseline-<date>.json` |
| DV-02 | Search Console: sitemap accepted and crawl begun | T+24-72h | `(H)` UI | Sitemap shown in Coverage with >0 URLs submitted |
| DV-03 | GA4 cross-domain linking: owner accepts domain suggestions (or adds manually) in GA4 Tag Settings UI | Within first week | `(H)` UI — cannot be automated | Domains listed as `Active` in Tag Settings |
| DV-04 | GSC Pages report coverage delta: compare counts (Indexed, Discovered-not-indexed, 404) to SC-03b baseline | T+7 | `(H)` UI export | Coverage delta recorded in baseline artifact |
| DV-05 | GA4 week-1 baseline: 7-day window from launch date | T+7 | `(A)` | Week-1 baseline artifact written |

**Baseline cadence:** T+0 = tag verification snapshot; T+1 = first full-day GA4 Data API extract
(DV-01); T+7 = week-1 baseline (DV-05) + GSC coverage delta (DV-04); then S10 weekly readouts.

---

## External Research

- Finding: Consent Mode v2 required by Google for EU businesses to maintain modelled conversions.
  Must default all signals to denied. Confirmed working in brik production since 2026-02-12.
- Finding: `vanilla-cookieconsent` v3: MIT-licensed, <15kB gzipped, Consent Mode v2 native, zero
  backend. Confirmed in brik production.
- Finding: GSC Coverage/Pages API does not exist. Bulk index coverage totals (Indexed count,
  Discovered-not-indexed count, etc.) are only available via manual GSC UI export. Agents cannot
  extract these programmatically. Source: `brikette-octorate-funnel-reduction/fact-find.md`.
- Finding: GA4 Data API processing latency is hours to ~24h. DebugView/Realtime is the only T+0
  verification path. Source: `ga4-handoff-capture-investigation.md`.
- Finding: GA4 cross-domain linking (Tag Settings > Configure your domains) has no GA4 Admin API
  endpoint. Classification is `(H)` only — not `(H→A)`. Source: GA4 Admin API surface review +
  `2026-02-17-brikette-sales-funnel-external-brief.user.md`.
- Finding: GA4 internal traffic filter activation is automatable via `PATCH properties/{property}/dataFilters/{filter}`
  with `state: ACTIVE`. Source: GA4 Admin API v1beta spec.
- Finding: Octorate (external JSF/PrimeFaces booking engines) have no webhook or API callback.
  Revenue reconciliation must be probabilistic (Policy-07). Source: `brikette-octorate-funnel-reduction/fact-find.md`.

---

## Questions

### Resolved

- Q: Should GTM be added to the startup loop infrastructure template?
  - A: No. Policy-03. Direct gtag.js is the default.
  - Evidence: `docs/plans/archive/brik-ga4-world-class-fact-find.md`

- Q: Should staging and production share a GA4 measurement ID?
  - A: No. Policy-02. Default is separate properties.
  - Evidence: `docs/plans/brikette-cta-sales-funnel-ga4/fact-find.md`

- Q: Can GA4 cross-domain linking be partially automated by an agent?
  - A: No. Fully `(H)`. No GA4 Admin API endpoint for this configuration.
  - Evidence: GA4 Admin API surface review + brik external brief 2026-02-17

- Q: Is the GA4 internal traffic filter `Testing` state sufficient?
  - A: No. `Testing` does not exclude traffic. Must be `Active` via `dataFilters.patch`. Policy-05.
  - Evidence: `ga4-handoff-capture-investigation.md`

- Q: Can GSC service account access be granted via API?
  - A: No. GSC does not expose a service account grant API. Phase 0 human step (P0-11b).
  - Evidence: GSC API surface; `brikette-octorate-funnel-reduction/fact-find.md`

- Q: What is the correct Consent Mode v2 default shape?
  - A: Explicit per-signal shape — `{all: 'denied'}` is not canonical. See C-02 snippet above.
  - Evidence: Google Consent Mode v2 API spec; brik implementation.

- Q: Can the Search Console Coverage/Pages report (Indexed count, etc.) be extracted via API?
  - A: No. Coverage totals have no bulk API. Use manual GSC UI export (SC-03b). Only Search Analytics
    (clicks/impressions) and URL Inspection (per-URL status) are available via API.
  - Evidence: `brikette-octorate-funnel-reduction/fact-find.md` + Search Console API surface.

- Q: What parameter enables GA4 DebugView?
  - A: Use Tag Assistant (`tagassistant.google.com`) or add `debug_mode: true` to the `gtag('config', ...)`
    call. `?gtag_debug=1` is not a standardised GA4 parameter and must not be used in templates.
  - Evidence: Google GA4 DebugView documentation.

- Q: Where are env vars set in the default Next.js + Cloudflare deployment model?
  - A: Build-time `NEXT_PUBLIC_*` vars are GitHub Actions environment-scoped variables — NOT
    Cloudflare Pages dashboard variables (when GitHub Actions does the build). Runtime Workers
    secrets use `wrangler secret put`.
  - Evidence: brik deployment architecture (MEMORY.md + `brikette-staging-to-live-launch-fact-find.md`)

### Open (User Input Needed)

- Q: Should the expanded infra bootstrap replace the existing `S1B` prompt template in-place (same
  filename, expanded content) or become a new template filename with a loop-spec update?
  - Why it matters: renaming requires a loop-spec edit + potential spec version bump (VC-02).
  - Decision owner: Pete
  - Default: expand in-place, keep filename. Avoids cascading changes.

- Q: Should the infra bootstrap apply to `pre-website` only, or also `website-live` via a separate
  audit template?
  - Why it matters: website-live businesses need gap-audit, not provisioning.
  - Decision owner: Pete
  - Default: two templates — `infra-and-measurement-bootstrap-prompt.md` (pre-website) and
    `measurement-quality-audit-prompt.md` (website-live, audit-first).

- Q: Should the DNS-Edit token (P0-06a) be explicitly rotated/revoked after Phase 1, and how is
  this enforced?
  - Default: include rotation reminder in Phase 3 checklist. Enforcement is manual.

---

## Confidence Inputs

- Implementation: 88% — All content from real brik execution. Phase 0 ordering fixed; GSC API
  surface confirmed; cross-domain linking reclassified `(H)`; DebugView enablement corrected.
  Remaining gap: GitHub Secrets API agent write flow unverified by an actual agent run.
- Approach: 85% — Phase 0 → 1 → 2 → 3 ordering confirmed correct. Two-template split for
  pre-website vs website-live is well-motivated. Open question on S1B filename is the remaining
  approach uncertainty.
- Impact: 90% — Front-loaded P0 access bundle design is high-value. Corrected Phase 0 ordering
  makes "doable in one sitting" actually achievable.
- Delivery-Readiness: 82% — All template content is present. Open question 1 (filename) should
  be resolved before loop-spec update task.
- Testability: 70% — Automated coverage high for agent steps; DebugView, GSC coverage export, and
  cross-domain linking are inherently manual with no programmatic equivalent.

What raises each to >=90:
- Implementation 90: Verify GitHub Secrets API agent write flow in a test.
- Approach 90: Resolve open question 1 (filename).
- Delivery-Readiness 90: Resolve Q1 + Q2; then draft templates from this document.
- Testability 90: Add Playwright checks for V-01, V-04, V-05, PV-01, PV-04, PV-07 in lp-launch-qa.

---

## Risks (max 10)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Owner completes Phase 0 out-of-order (e.g. tries to grant SA access before creating properties) | High | High | P0 table has explicit "strict dependency order" note; template prompts must enforce sequential completion |
| DNS-Edit token absent; SC-01/D-01/D-02 fail with 403 | High (if Policy-01 not followed) | High | Policy-01; every DNS step explicitly names `CLOUDFLARE_API_TOKEN_DNS_EDIT` |
| Agent attempts SC-03 Coverage API → fails (API doesn't exist) | High (without correction) | High | SC-03 split: SC-03a (Search Analytics, A), SC-03b (Coverage totals, H UI), SC-03c (URL Inspection, A optional) |
| Staging measurement ID shares production property → baseline contamination | Medium | High | Policy-02; V-05 requires separate property check |
| GA4 internal traffic filter left in `Testing` → internal hits in baselines | Medium (happened in brik) | Medium | Policy-05; G-07 sets `Active`; PV-06 confirms |
| Cross-domain linking never accepted by owner → checkout sessions as new sessions | Medium | High | Named `(H)` DV-03; non-blocking advisory in lp-launch-qa |
| DebugView appears empty because consent denied → operator thinks GA4 is broken | Medium | Medium | V-02/PV-02 explicitly state consent must be granted in test session before checking DebugView |
| P0-11b GSC siteFullUser grant skipped → SC-03a and URL Inspection API queries fail | Medium | Medium | P0-11b is a deferred Phase 0 step with explicit dependency on P0-11a (verified property) |
| GitHub agent auth not declared before GH-01 → variable write fails silently | Medium | Medium | Policy-06; P0-09 is explicit prerequisite; no GH step claims `(A)` without P0-09 complete |
| DNS-Edit token not rotated after Phase 1 → elevated blast radius if secret leaks | Low-Medium | Medium | Rotation reminder in Phase 3 checklist; token labelled "bootstrap only" at P0-06a |

---

## Evidence Gap Review

### Gaps Addressed (cumulative across revisions)

- Cloudflare token scope inconsistency: Policy-01, two-token model, every DNS step names DNS-Edit token
- Consent Mode v2 snippet: replaced `{all: 'denied'}` with verbatim per-signal known-good block
- Staging isolation ambiguity: Policy-02 with Default A (separate property) and Allowed B (process
  discipline only, not GA4 enforcement); V-05 requires both conditions
- Verification timing realism: Phase 3 split immediate/delayed; Data API reserved for T+24h+
- Duplicate filter steps: G-07 sets `Active`; PV-06 is a confirm read
- Missing GSC property creation: P0-11 (create) + P0-11a (verify) + P0-11b (grant SA)
- Missing Cloudflare Pages hosting project: P0-07
- GitHub agent auth prerequisite: P0-09 (Policy-06)
- IDs glossary: GA4, Cloudflare, GCP, GitHub variable kinds
- Baseline timing incoherence: T+0/T+1/T+7 cadence; DV-01 is T+24h
- Phase 0 ordering bug: service account grants moved to after property creation (P0-04b, P0-05b)
- GSC Coverage API non-existence: SC-03 split into SC-03a (Search Analytics, A), SC-03b (Coverage,
  H manual), SC-03c (URL Inspection, A optional); DV-04 reclassified to `(H)` UI export
- DebugView enablement: replaced `?gtag_debug=1` with Tag Assistant / `debug_mode: true`; consent
  interaction documented explicitly
- GA4 cross-domain linking API: reclassified G-08 from `(H→A)` to `(H)` only
- Policy-02 Allowed B enforceability: rewritten as "process discipline, not GA4 enforcement"
- Deployment model clarification: explicit section; GitHub Actions env vars vs Cloudflare Pages vars
- 404 rollup cron mechanism: specified as GitHub scheduled workflow with exact schedule pattern
- Duplicate P0-09-auth / P0-13: merged into single P0-09
- GA4 Admin API exact method references: G-06 and G-07 include resource paths

### Confidence Adjustments

- Implementation raised to 88%: Phase 0 ordering fixed; API surface corrections applied;
  cross-domain linking correctly classified `(H)`; DebugView enablement correct
- Testability held at 70%: DebugView, GSC coverage export, and cross-domain linking are inherently
  manual; no additional automation path found

### Remaining Assumptions

- GitHub Actions Secrets API write via PAT with `secrets:write` is assumed correct but not verified
  by an agent run — needs confirmation before template claims GH-01 fully `(A)`
- `vanilla-cookieconsent` v3 is correct for EU businesses; non-EU may use a lighter CMP
- Cloudflare Pages + GitHub Actions is the assumed deployment model; other platforms need adaptation
- DNS-Edit token rotation after Phase 1 is a manual reminder; no automated enforcement mechanism

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None that prevent planning. Open Q1 (S1B filename) should be resolved before the
  loop-spec update task; default assumption allows planning to proceed.
- Recommended next step:
  `/lp-plan docs/plans/startup-loop-infra-measurement-bootstrap/fact-find.md` — scope and sequence
  TASK-D1 through TASK-07. TASK-D1 (decision) resolves first; TASK-01/02/03 run in parallel after D1;
  TASK-04 gates TASK-05/06/07.
