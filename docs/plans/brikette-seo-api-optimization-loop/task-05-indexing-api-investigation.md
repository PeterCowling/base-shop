# TASK-05: Google Indexing API Eligibility Investigation

**Date:** 2026-02-25
**Property:** `sc-domain:hostel-positano.com`
**SA:** `ga4-automation-bot@brikette-web.iam.gserviceaccount.com`
**GCP Project:** 98263641014 (brikette-web)

---

## Pre-flight Check Results

### Scope

The SA token was obtained successfully with the `https://www.googleapis.com/auth/indexing` scope. Token length: 1024 characters. No scope rejection at the OAuth token exchange step.

### API Enablement

**Result: BLOCKED — API not enabled in GCP project.**

All 5 test URL submissions returned HTTP 403:

```json
{
  "error": {
    "code": 403,
    "message": "Web Search Indexing API has not been used in project 98263641014 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/indexing.googleapis.com/overview?project=98263641014"
  }
}
```

The Indexing API is a separate Google API (`indexing.googleapis.com`) that must be explicitly enabled in the GCP console before any requests will succeed. This is a prerequisite step the pre-flight check was designed to catch.

### Test URLs Attempted

1. `https://hostel-positano.com/en/experiences/arienzo-beach-guide` — 403
2. `https://hostel-positano.com/en/experiences/boat-tours-positano` — 403
3. `https://hostel-positano.com/en/experiences/capri-on-a-budget` — 403
4. `https://hostel-positano.com/en/how-to-get-here/amalfi-positano-ferry` — 403
5. `https://hostel-positano.com/it/come-arrivare/amalfi-positano-bus` — 403

---

## Eligibility Verdict

**INCONCLUSIVE** — The Google Indexing API is not enabled for the brikette-web GCP project. Cannot determine content eligibility (Article vs NewsArticle/JobPosting policy) without first enabling the API and completing the test.

This is not a rejection of the guide pages themselves. It is a missing GCP console configuration step.

---

## Required Pre-flight Steps (Operator Action)

To complete this investigation, the operator must:

1. **Enable the Indexing API** in GCP console:
   - URL: `https://console.developers.google.com/apis/api/indexing.googleapis.com/overview?project=98263641014`
   - Click "Enable"

2. **Verify SA ownership** in Google Search Console:
   - Go to `https://search.google.com/search-console/` → Settings → Users and permissions
   - Confirm `ga4-automation-bot@brikette-web.iam.gserviceaccount.com` is listed as an Owner (not just Verified User). The Indexing API requires Owner-level verification.
   - If not an Owner: add the SA email as a Property Owner in GSC.

3. **Re-run the investigation** using the test script:
   ```bash
   node /tmp/test-indexing-api.mjs
   ```
   Or reuse this investigation pattern directly.

4. **Await 48h** after successful submissions, then re-run `gsc-url-inspection-batch.ts` on the same 5 URLs to check if `coverageState` changed.

---

## Content Eligibility Question (Deferred)

The original investigation question was whether Google Indexing API accepts content with `Article` schema (travel guides), not just `NewsArticle`/`JobPosting`. This remains unanswered until the API is enabled.

**Working hypothesis:** Google's documented policy restricts the Indexing API to content with "JobPosting" or "NewsArticle" schema types. Travel guide pages use `Article` schema. If this restriction is enforced strictly, the API will return a 200 OK response but submissions may not actually accelerate crawl scheduling. The only way to verify is empirically.

---

## Impact on TASK-06

Per the plan conditional gate: TASK-06 (Sitemaps re-ping script) proceeds because this investigation is **inconclusive**, not "eligible". The conditional gate reads:

> Proceed only if TASK-05 verdict is "ineligible" or "inconclusive." If TASK-05 verdict is "eligible" (Indexing API accepted), defer TASK-06 to Phase B.

Since the verdict is **inconclusive**, TASK-06 proceeds.

---

## API Call Pattern (for future use once enabled)

Once the Indexing API is enabled and the SA is a verified owner, the submission call is:

```typescript
// POST https://indexing.googleapis.com/v3/urlNotifications:publish
// Scope: https://www.googleapis.com/auth/indexing
// Same JWT auth pattern as gsc-url-inspection-batch.ts

const body = {
  url: "https://hostel-positano.com/en/experiences/arienzo-beach-guide",
  type: "URL_UPDATED",
};
```

Cadence recommendation (if eligible):
- Submit new/updated guide URLs on every content deploy
- Do not re-submit unchanged pages more than once per 48h
- Monitor coverage state changes via `gsc-url-inspection-batch.ts` after 48h

---

## Follow-up Action (Operator)

**Required before the 48h re-inspection check:**
1. Enable the Indexing API at the GCP console URL above
2. Confirm SA Owner status in GSC
3. Re-submit the 5 test URLs
4. 48h later: run `gsc-url-inspection-batch.ts` on those 5 URLs and compare `coverageState` to the T+0 baseline

The investigation report will be updated with final verdict once the re-inspection completes.
