---
Type: Decision-Memo
Plan: docs/plans/brik-gbp-api-rejection-remediation/plan.md
Task: TASK-01
Created: 2026-02-25
Status: Awaiting operator sign-off
---

# GBP API Access — Closure Decision

## What happened

On **25 February 2026**, Google's Business Profile API team rejected BRIK's API access application (Google support case **#1-1062000040302**, submitted 23 February 2026).

The rejection email stated: *"We will not be able to move forward with your application to use the GBP API as your account did not pass our internal quality checks. We recommend reviewing our eligibility criteria and ensuring that your Business Profile and your company's official website are fully up to date before reapplying in the future if you choose to do so."*

The API application was submitted as part of the Phase A GBP optimisation work (TASK-16). The intent was to automate future GBP updates (description edits, post publishing). TASK-16 itself is already **complete** — the manual execution path was proven to work in a ~30-minute session on 23 February 2026.

---

## Decision: Accept manual-only GBP management

**Verdict: Do not reapply. Accept manual management permanently at current scale.**

---

## Rationale

### 1. The API adds ~15 minutes per month — the ROI does not exist

Manual GBP management (photos, Q&A, Posts, Insights review) takes approximately 30 minutes per month. That was proven in TASK-16. The Business Profile API would eliminate perhaps 15 minutes of that. Pursuing reapplication — which requires fixing unknown profile/website quality signals with opaque criteria — is not worth that saving.

### 2. The API is designed for agencies and multi-location businesses

The Business Profile API is Google's programmatic interface for managing multiple GBP listings at scale. It is intended for: agencies managing profiles for many clients, enterprise businesses with large location portfolios, and developers building GBP management software. A single-location independent hostel does not match this profile. The rejection almost certainly reflects this structural mismatch, not a fixable technical issue.

### 3. The rejection criteria are opaque — remediation ROI is unknown

Google does not publish the pass/fail thresholds for its API quality checks. Even if we invested effort in improving website quality signals and resolving the description edit control restriction (which has been unavailable since at least 23 February 2026), we have no guarantee of a different outcome on reapplication.

### 4. The high-value local search action is entirely separate

The Google Hotel Free Listing (via Octorate) is what gets Hostel Brikette into the hotel booking panel that appears when travellers search for accommodation in Positano. That activation path goes through Octorate's own connectivity partner status — it has nothing to do with the Business Profile API, and it is **not blocked** by this rejection. That is where the attention should go next.

---

## What the rejection does and does not affect

| Item | Status |
|---|---|
| GBP listing — live and verified | ✅ Unaffected |
| Manual GBP management (business.google.com) | ✅ Unaffected — fully available |
| TASK-16 GBP audit work (photos, Q&A, Posts) | ✅ Already complete (2026-02-23) |
| Google Hotel Free Listing via Octorate | ✅ Unaffected — entirely separate API path |
| SEO plan tasks (TASK-13, TASK-17, TASK-21) | ✅ None depend on GBP API |
| Automated GBP description/photo/post management | ❌ Not available — manual path required |

---

## What to do next

**Immediate (within 5 business days):**

1. Sign off this decision memo (sign-off block below).
2. Open `docs/plans/brikette-google-hotel-free-listing/fact-find.md` and confirm the two blockers are still valid:
   - Octorate Metasearch is still active: Menu → Upgrade → Version in Octorate dashboard (last confirmed 2026-02-18)
   - GBP is still verified (blue badge visible in GBP dashboard)
3. Run `/lp-do-plan brikette-google-hotel-free-listing` to create the plan and begin the Octorate activation + schema fix work.

**Monthly (ongoing):**

Maintain the GBP profile manually using the checklist at `docs/plans/brik-gbp-api-rejection-remediation/task-02-gbp-maintenance-cadence.md`. Target: 30 minutes per session.

---

## Scale caveat

This decision applies at current scale: **one property** (Hostel Brikette, Positano). If BRIK expands to manage a second property — a second hostel, apartment portfolio, or external property — the Business Profile API reapplication calculus changes significantly. At that point, the API use case becomes legitimate and reapplication is worth pursuing.

---

## Monitoring notes

- **Description edit control**: unavailable in GBP UI since 23 February 2026. Check each monthly session. If still unavailable after June 2026 (3 months), investigate the GBP profile restriction cause directly with Google support.
- **Hotel Center property matching**: after activating the Octorate Metasearch toggle, check the Octorate dashboard for property matching status within 48 hours. If NOT_MATCHED, align the GBP name/address data with the Octorate account data and re-check. Escalate to Octorate support if unresolved after 72 hours.

---

## Operator sign-off

> Review the rationale above. If you agree, fill in the sign-off block below. If you disagree or want to pursue reapplication, annotate your counter-rationale here instead and open a new fact-find.

| Field | Value |
|---|---|
| **Verdict confirmed** | Accept manual-only GBP management — do not reapply |
| **Reviewed by** | _(name)_ |
| **Sign-off date** | _(YYYY-MM-DD)_ |
| **Notes (optional)** | _(any counter-rationale or caveats)_ |
