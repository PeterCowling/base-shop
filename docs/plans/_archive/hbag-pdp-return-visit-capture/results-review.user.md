---
Type: Results-Review
Status: Draft
Feature-Slug: hbag-pdp-return-visit-capture
Review-date: 2026-02-28
artifact: results-review
---

# Results Review

## Observed Outcomes
- Not yet observed: feature committed to `dev` on 2026-02-28 and awaiting deployment. No live data is available yet. Operator to complete this section after first deployment and test submission.
- Pre-deployment check: `NotifyMeForm` component renders on the PDP at `/[lang]/product/[slug]` with email input, unchecked consent checkbox, and "Notify me" button. API route at `/api/notify-me` returns 200 for valid submissions and 400 for invalid inputs.

## Standing Updates
- No standing updates: feature is newly deployed; no baseline has been established yet. Revisit after first week of live data to check for email delivery failures, `notify_me_submit` event volume, or abuse signals.

## New Idea Candidates
- Track notify-me submissions in a lightweight DB table (Prisma + D1) to enable follow-up campaigns when new stock arrives | Trigger observation: v1 fire-and-forget sends to merchant inbox — no queryable capture store for automated follow-up | Suggested next action: create card
- Email provider upgrade to Resend for better deliverability + bounce tracking | Trigger observation: `sendSystemEmail` via Gmail SMTP silently simulates if credentials absent; no delivery confirmation or bounce visibility | Suggested next action: defer until submission volume justifies upgrade
- None for remaining categories (new standing data source, new open-source package, new skill, AI-to-mechanistic).

## Standing Expansion
- No standing expansion: no new standing artifact warranted at this stage. If submission volume data is collected, update `docs/business-os/strategy/HBAG/conversion-context.md` (or equivalent Layer A artifact) with conversion funnel data after 30 days.

## Intended Outcome Check

- **Intended:** At least one functional return-visit mechanism live on the PDP within one build cycle, with a measurable submission event logged. Secondary: first email follow-up sent to at least one captured address within 7 days of launch.
- **Observed:** Not yet measured — awaiting deployment and first live submission. Feature is technically complete and committed. `notify_me_submit` analytics event wired to client-side emission and allowlisted in analytics route. Email send flow requires operator to provision `EMAIL_PROVIDER`, `GMAIL_USER`, `GMAIL_PASS` in Cloudflare Workers environment before go-live.
- **Verdict:** Not Met (pre-deployment — no live submissions yet)
- **Notes:** Verdict will be revisited post-deployment. Technical delivery is complete; outcome is gated on deployment + Gmail credentials provisioning. Operator should run a test submission after deploying to confirm end-to-end email delivery.
