---
Type: Results-Review
Status: Draft
Feature-Slug: brikette-direct-booking-rate-trust
Review-date: 2026-02-27
artifact: results-review
---

# Results Review

## Observed Outcomes
- All 18 locale modals now show "Up to 25% off" in the direct-booking perks modal — eliminating the 10%-vs-25% inconsistency that existed in production since the offers modal was written.
- "Best price guaranteed" badge added to room cards across `/book` and `/rooms` pages, with a WhatsApp claim link — first time a price-trust signal appears at the room-card level.
- `/deals` page exits empty state permanently via the evergreen `direct-perks-evergreen` entry; expired `sep20_oct31_15off` deal now surfaces in a collapsible "Past Deals" section rather than driving an empty page.
- Regression test suite expanded: 3 new assertions lock in the corrected discount claim, active-deal count, and badge rendering — any future revert will surface immediately in CI.
- Deployment gate outstanding: operator confirmation of "up to 25% off" accuracy against current Octorate rate structure is required before pushing to production.

## Standing Updates
- `docs/business-os/strategy/BRIK/worldclass-goal.md`: no update required — this build addresses trust signals but doesn't change the underlying booking-share target or measurement approach.
- No standing updates: changes are tactical copy/component fixes; no strategic artifact update needed.

## New Idea Candidates
- Track direct booking share weekly post-deploy to close the measurement loop | Trigger observation: build sets up GA4 CTA click event proxy but no standing measurement cadence exists | Suggested next action: spike
- Extract `getActiveDealCount` + deal-status helpers into a shared utility module | Trigger observation: deal status logic is split across `status.ts` (getDealStatus) and the new inline filter in `deals.ts` (getActiveDealCount) — two approaches for the same concern | Suggested next action: defer
- None. (for new standing data source, new open-source package, new loop process, AI-to-mechanistic)

## Standing Expansion
- No standing expansion: this build fixes trust-signal gaps documented in the fact-find; no new standing data sources or processes were introduced.

## Intended Outcome Check

- **Intended:** Increase direct booking share toward 27% P50 target. Proxy: GA4 CTA click events on `/book` and `/rooms` pre-Octorate-handoff, measured over 30 days post-deploy.
- **Observed:** Build complete, not yet deployed to production (awaiting operator confirmation of "25% off" claim accuracy). No GA4 data available yet.
- **Verdict:** Not Met (pending deployment)
- **Notes:** This is expected — the outcome measurement window starts at production deploy. All code changes are committed and tested. Review again at 14-day post-deploy mark.
