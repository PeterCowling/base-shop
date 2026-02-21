---
Type: Investigation
Status: Complete
Domain: Analytics
Created: 2026-02-17
Last-updated: 2026-02-17
Owner: Pete
Relates-to:
  - docs/plans/brikette-octorate-funnel-reduction/plan.md
  - docs/plans/brikette-octorate-funnel-reduction/fact-find.md
---

# GA4 Handoff Capture Investigation

## Scope
Resolve why controlled handoff-like emits are observable during testing, while standard reporting windows used for reconciliation have shown zero `begin_checkout` and `handoff_to_engine`.

## Evidence Ledger
- Historical standard Data API window (`2026-02-10..2026-02-17`):
  - `page_view=266`, `begin_checkout=0`, `handoff_to_engine=0`
  - Source: `.tmp/reconciliation-2026-02-10_2026-02-17/ga4-events-by-day-2026-02-10_2026-02-17.csv`
- Controlled browser test evidence (session notes, 2026-02-17):
  - `window.dataLayer` contained `['event','begin_checkout',{...}]` after consent update.
  - Tag Assistant session connected on live route `/en/rooms`.
- Historical realtime check note (from fact-find):
  - Non-zero rows were reported for `begin_checkout` and `handoff_to_engine` during prior controlled check on 2026-02-17.
  - Source note: `docs/plans/brikette-octorate-funnel-reduction/fact-find.md`
- Fresh probes (idle traffic sample):
  - Realtime 29m at `2026-02-17T13:04:53Z`: all tested events `0`
  - Standard `2026-02-17..2026-02-17` at `2026-02-17T13:05:03Z`: all tested events `0`
  - Sources:
    - `.tmp/reconciliation-2026-02-10_2026-02-17/ga4-realtime-29m-2026-02-17T1304Z.json`
    - `.tmp/reconciliation-2026-02-10_2026-02-17/ga4-standard-2026-02-17-only-2026-02-17T1305Z.json`
- Follow-up standard/realtime API probes (2026-02-17, no controlled CTA during probe window):
  - Standard window `2026-02-16..today`: `handoff_to_engine=0`, `begin_checkout=0`, `user_engagement=1`
  - Realtime 29m: target + control events all `0` in sampled window
  - Sources:
    - `.tmp/reconciliation-2026-02-10_2026-02-17/ga4-standard-2026-02-16_to_today-20260217T151354.json`
    - `.tmp/reconciliation-2026-02-10_2026-02-17/ga4-realtime-29m-20260217T151403.json`
- Direct collection endpoint probe (terminal, 2026-02-17):
  - Sent `handoff_to_engine` to `https://www.google-analytics.com/g/collect` with `tid=G-2ZSYXG8R7T`, debug params, and unique CID.
  - Response: HTTP `204` (accepted).
  - Follow-up Realtime API polling (4 polls over ~40 seconds): all tested events remained `0`.
  - Interpretation: request acceptance alone does not prove report-surface visibility; filtering/config/reporting path still suspected.
- Realtime control-surface probe (terminal, 2026-02-17):
  - Querying `web_vitals,click,user_engagement,page_view` returned non-zero rows in Realtime API.
  - Source: `.tmp/reconciliation-2026-02-10_2026-02-17/ga4-realtime-control-events-2026-02-17T1340Z.json`
  - Interpretation: GA4 Data API and property access are functioning; the gap is specific to handoff-intent event persistence/availability.
- GA4 UI evidence provided (2026-02-17):
  - DebugView screenshot shows no visible `handoff_to_engine`/`begin_checkout` in current debug timeline; top events shown are `web_vitals`, `click`, `user_engagement`.
  - Stream details screenshot confirms target stream alignment:
    - Stream URL: `https://hostel-positano.com`
    - Stream ID: `10183287178`
    - Measurement ID: `G-2ZSYXG8R7T`
  - Data filters screenshot shows:
    - `Internal Traffic` filter exists with operation `Exclude`
    - Current state: `Testing` (not Active exclusion)

## Truth Table
| Surface | Expected | Actual | Interpretation |
|---|---|---|---|
| DebugView (test device) | event appears immediately | Captured; no visible `handoff_to_engine`/`begin_checkout` in provided view | Event is not reliably reaching DebugView despite client/tag emit evidence |
| Realtime | event count increments after controlled click | Target events remained zero in sampled probes; control events were non-zero in same property/window | Realtime surface works; issue is target-event ingestion/availability, not API outage |
| Events report (standard UI) | event name appears with non-zero count | Unverified | Cannot yet distinguish reporting latency/filtering from ingestion failure |
| Explorations | event available in analysis | Unverified | Same as above |
| Data API (`ga4-run-report.ts`) | non-zero count in controlled window | Target events zero in sampled windows; control events non-zero | Query pipeline is healthy; target events are not persisting into report surfaces |

## Current Diagnosis
- Confirmed: event emission can be triggered client-side under consent-granted test conditions.
- Confirmed: stream identity is correct (`G-2ZSYXG8R7T`), and Internal Traffic filter is not actively excluding (state `Testing`).
- Confirmed: Data API is functioning for control events in the same property/time window.
- Root-cause decision (for planning):
  - Treat this as a target-event persistence problem, not a report-query problem.
  - Current event strategy (create-rule mapping + manual emits) is not decision-grade for handoff measurement.
  - Priority fix remains TASK-05A: native first-party `handoff_to_engine` emission at real CTA click points, followed by TASK-06 governance/reporting validation.
- TASK-04 status:
  - Diagnostically sufficient for plan progression; residual verification should be completed inside TASK-05A/TASK-06 rollout validation.
  - Planning closure does not require GA4 UI screenshots when reproducible API evidence is available.

## Remaining Checks (Folded Into Build Validation)
1. After TASK-05A deploy, run controlled real CTA click (not console-only emit) and verify:
   - DebugView visibility for `handoff_to_engine`.
   - Realtime non-zero for `handoff_to_engine` in immediate window.
2. After processing delay, verify Events + Explore + Data API parity for the same date/event.
3. Record pass/fail in TASK-05A/TASK-06 validation artifacts.

## Exit Criteria
- Planning exit: achieved (root-cause class identified and next fix path selected).
- Build exit (TASK-05A/TASK-06): one controlled real CTA event visible across DebugView, Realtime, Events report, Exploration, and Data API for same event/date scope.
