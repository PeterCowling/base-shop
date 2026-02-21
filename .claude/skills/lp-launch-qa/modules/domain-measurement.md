# Domain: Measurement & Analytics

**Goal**: Verify measurement infrastructure is correctly separated (staging/production), properly configured, and instrumented before live traffic hits the site.
**Required output schema**: `{ domain: "measurement", status: "pass|fail|warn", checks: [{ id: "<M1>", status: "pass|fail|warn", evidence: "<string>" }] }`

> **Pre-flight note:** If the business did not go through S1B (Measure stage, pre-website path) — e.g. an existing-site business on the `website-live` path — checks M1 and M2 may reveal a gap. In that case, produce a gap advisory and recommend routing to `measurement-quality-audit-prompt.md` rather than blocking launch.

> **Delayed checks (DV-series):** Checks marked `(DELAYED)` cannot be verified at T+0 because GA4 Data API has 24-72 hour data latency. Failures on delayed checks are **warnings only** — they do not block launch. Document as "Deferred to T+1/T+7 post-deploy verification (`post-deploy-measurement-verification-prompt.md`)."

## Checks

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

## Domain Pass Criteria

- **Blockers:** M1 (same measurement ID in both envs), M2 (same property for staging + production), M7 (DNS redirect broken)
- **Warnings:** M3 (internal traffic filter not active), M5 (cross-domain advisory), M6 (internal constraint note)
- **Existing-site gap advisory:** If S1B was not run (website-live path), M1/M2 failures produce a gap advisory → recommend `measurement-quality-audit-prompt.md`; do not block launch on this basis alone.
- **Delayed checks:** DV-series checks from `post-deploy-measurement-verification-prompt.md` are explicitly out of scope for launch-time QA. Document as deferred.
