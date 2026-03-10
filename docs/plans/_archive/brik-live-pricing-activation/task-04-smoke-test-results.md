---
Type: Task-Artifact
Task: TASK-04
Plan: docs/plans/brik-live-pricing-activation/plan.md
Status: Awaiting operator run
Created: 2026-02-27
---

# Availability Smoke Test — Operator Run Instructions and Results

## Context

The Playwright smoke test at `apps/brikette/e2e/availability-smoke.spec.ts` validates the end-to-end live pricing flow against a running dev server. Per `AGENTS.md` Testing Rules (line 93: "Tests run in CI only. Do not run Jest or e2e commands locally"), the agent does not execute this test. This document provides operator run instructions and a results template for recording the outcome.

The smoke test exercises three cases:

- **TC-07-01:** `/en/book` loads without console errors (HTTP 200).
- **TC-07-02:** After entering future dates, at least one room card shows a price matching `From €XX` within 15 seconds.
- **TC-07-03:** Clicking a Book Now / NR CTA triggers navigation to `book.octorate.com/octobook/site/reservation/result.xhtml`.

---

## Prerequisites

Before running the test, confirm all of the following are true:

1. TASK-01, TASK-02, and TASK-03 are complete and committed (they are, as of 2026-02-27).
2. You have `pnpm` and Playwright installed in the monorepo (run `pnpm install` from repo root if needed).
3. Playwright browsers are installed: `cd apps/brikette && pnpm exec playwright install chromium`.

---

## Operator Run Instructions

### Step 1: Start the dev server with the flag enabled

From the repo root, start the Brikette dev server with the live pricing flag set:

```bash
cd apps/brikette
NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1 pnpm dev
```

The dev server starts on port **3012**. Wait until the terminal shows "Ready" or "Local: http://localhost:3012". This may take 30–60 seconds on first start.

> Note: `pnpm dev` uses `cross-env NODE_OPTIONS="--require ./scripts/ssr-polyfills.cjs" next dev -p 3012`. The flag is passed as an inline env var prefix; Next.js inlines it at startup.

### Step 2: Run the smoke test (in a separate terminal)

```bash
cd apps/brikette
PLAYWRIGHT_BASE_URL=http://localhost:3012 pnpm exec playwright test e2e/availability-smoke.spec.ts --project=chromium
```

The test runs 3 cases in sequence. Expected duration: 30–90 seconds (TC-07-02 waits up to 15s for Octobook to respond).

### Step 3: Record results below

Fill in the results table and any observations. If TC-07-02 fails with a timeout, retry once with a different date range (Octobook occasionally has no availability for specific dates). The test auto-generates dates 30 and 32 days ahead.

---

## Results

> Operator: fill in this section after running the test.

**Test run date:** _YYYY-MM-DD_
**Dev server port:** 3012
**Flag state:** `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1`
**Playwright base URL:** `http://localhost:3012`

| Test Case | Description | Status | Notes |
|---|---|---|---|
| TC-07-01 | `/en/book` loads without console errors | PENDING | |
| TC-07-02 | Prices appear on room cards within 15s after date entry | PENDING | |
| TC-07-03 | NR CTA navigates to `book.octorate.com/octobook/...` | PENDING | |

**Rooms and prices seen (TC-07-02 evidence):**

_List any room names and prices observed in the test run, e.g.:_
- "Single Room — From €45.00/night"
- "Double Room — From €75.00/night"

**Full test output (paste here or attach):**

```
(paste playwright output)
```

---

## Troubleshooting

| Symptom | Likely cause | Action |
|---|---|---|
| TC-07-02 timeout (no price appears in 15s) | Octobook is slow or has no availability for auto-generated dates | Retry once; if still failing, check `https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&date=<checkin>&checkin=<checkin>&checkout=<checkout>&pax=1&lang=EN` directly in browser |
| TC-07-01 console errors | JS error in page load | Check browser console; look for import errors, API calls failing |
| TC-07-03 button not found | Selector mismatch (`/non.refundable|reserve now|book now|rates/i`) | Try navigating to `/en/book?checkin=<date>&checkout=<date>&pax=1` manually and confirm price cards appear first |
| `PLAYWRIGHT_BASE_URL` ignored | Playwright picks up cached config | Run with explicit env var: `PLAYWRIGHT_BASE_URL=http://localhost:3012 pnpm exec playwright test ...` |
| Dev server starts on wrong port | `cross-env` or environment variable issue | Confirm with `lsof -i :3012` or check terminal output after `pnpm dev` |

---

## Post-Run Action

After recording results:

1. If all three TCs pass: mark TASK-04 Complete in the plan (`docs/plans/brik-live-pricing-activation/plan.md`) by updating `Status: Pending → Complete (YYYY-MM-DD)` and filling in the build evidence field with the test run date and TC outcomes.
2. If any TC fails: investigate using the troubleshooting guide above, then re-run. Document the failure and resolution in the Notes column above.
3. The plan can be archived once all four tasks are Complete.

---

## CF Pages Environment Variable Reminder

The smoke test above exercises the Next.js route handler (`route.ts`) path via the local dev server. It does NOT exercise the Cloudflare Pages Function (`functions/api/availability.js`). After production deploy, verify the CF Pages Function is working by:

1. Visiting `https://www.hostel-positano.com/en/book` in a browser.
2. Entering future check-in and check-out dates.
3. Confirming room prices appear within 15 seconds.

If prices do not appear, check the Cloudflare dashboard: **brikette-website project → Settings → Environment Variables** and confirm `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` is set to `1` for the Production environment. This env var binding controls the Pages Function at request time and must be set separately from the build-cmd inline.
