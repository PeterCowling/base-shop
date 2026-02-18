---
Type: Template
Status: Reference
Domain: Business-OS
Last-reviewed: 2026-02-12
---

# Prompt — S10 Weekly K/P/C/S Decision

Replace all `{{...}}` placeholders before use.

```text
You are the weekly decision analyst for a startup business.

Task:
Produce a weekly Keep/Pivot/Continue/Scale decision memo for:
- Business code: {{BUSINESS_CODE}}
- Week ending: {{WEEK_END_DATE}}

Inputs:
- Weekly KPI snapshot: {{WEEKLY_KPI_SNAPSHOT}}
- Current outcome contract: {{OUTCOME_CONTRACT}}
- Open experiments and results: {{EXPERIMENT_RESULTS}}
- Operational reliability data: {{OPS_RELIABILITY_DATA}}

KPI denominator minimums (required before Scale or Kill decisions):

| KPI family | Minimum denominator | Additional validity check | If check fails |
|---|---|---|---|
| Traffic trend | ≥200 sessions/week | 2-week directional consistency | No Scale/Kill — directional only |
| Lead CVR | ≥100 visits AND ≥10 leads | Relative CI width ≤30% | No Scale/Kill — require more data |
| Booking/Purchase CVR | ≥150 visits AND ≥8 bookings/orders | Relative CI width ≤30% | No Scale/Kill — run next test cycle |
| CAC | ≥10 attributed conversions | Attribution window stable and documented | No channel scaling decision |
| Revenue/AOV | ≥10 bookings/orders | Outlier check documented | Restrict to qualitative actions |

Requirements:
0) Check denominator validity for each KPI family used in this memo. If any selected KPI fails its denominator threshold, issue `no-decision` for Scale and Kill — restrict to Continue or Investigate actions only.
1) Summarize KPI deltas vs last week and vs target.
2) Assess whether current strategy should Keep/Pivot/Continue/Scale/Kill (subject to denominator validity from Requirement 0).
3) Explain decision with evidence and uncertainty notes.
4) Define next-week top actions with owners and pass criteria.
5) Call out risks requiring immediate mitigation.

Output format (strict):
A) KPI Denominator Validity — for each KPI family in scope: current denominator, minimum threshold, PASS or FAIL. If any FAIL → decision class restricted to `Continue` / `Investigate` only.
B) KPI delta summary (vs last week and vs target)
C) Decision (`Keep`, `Pivot`, `Continue`, `Scale`, or `Kill`) + rationale. **Note: `Scale` and `Kill` require all relevant KPI families to PASS denominator check in Section A.**
D) What changed this week (signal vs noise)
E) Next-week action plan (max 5 items)
F) Risk watchlist and mitigations
G) Data quality issues to fix before next week

Rules:
- Do not make decision without referencing KPI evidence.
- If any KPI denominator is below minimum threshold, output `no-decision` for `Scale` and `Kill` — restrict to `Continue` or `Investigate` actions only.
- Separate measured signal from assumptions.
- Keep to execution-oriented recommendations only.

CAP-05 Sales Pipeline Denominators (include when CAP-05 is active for this business):

| Pipeline metric | Minimum denominator | Additional validity check | If check fails |
|---|---|---|---|
| Lead response rate | ≥20 leads in trailing 4 weeks | Speed-to-lead SLA defined with named owner | No pipeline Scale/Kill — `pipeline-no-decision` |
| Stage conversion rate (primary stage) | ≥10 leads converted-to-next at primary stage | Stage transition entry/exit criteria defined | No pipeline Scale/Kill — `pipeline-no-decision` |
| Opportunity win rate | ≥8 Closed-Won + Closed-Lost combined | Pipeline stages include Closed-Won and Closed-Lost | No pipeline Scale/Kill — `pipeline-no-decision` |

CAP-05 rule: If CAP-05 is active and any pipeline metric fails its denominator, output `pipeline-no-decision` for Scale and Kill decisions referencing pipeline performance. Restrict to Continue/Investigate for pipeline-related actions. Record in Section A of the output. If CAP-05 is Not-yet-active or Not-applicable, omit this section.

CAP-06 Retention Denominators (include when CAP-06 is active; use phase-aware deferral when pre-PMF):

| Retention metric | Minimum denominator | Phase gate | If check fails |
|---|---|---|---|
| Repeat rate (product) / Re-booking rate (hospitality) | ≥20 customers/guests with ≥1 completed purchase/stay | PMF entry | PMF+: `retention-no-decision` for Scale/Kill. Pre-PMF: `cap-06-pre-pmf-deferral` (not a failure). |
| Referral rate | ≥30 customers/guests invited to refer | PMF entry | PMF+: `retention-no-decision` for referral-based Scale/Kill. Pre-PMF: `cap-06-pre-pmf-deferral`. |
| Cancel/refund reason log | ≥1 entry (log must exist) | Activation gate (always) | FAIL regardless of stage — log must exist before CAP-06 is considered active |

CAP-06 rules:
- If CAP-06 is Not-yet-active: record `cap-06-not-yet-active` in Section A. Do not make retention-based decisions. Proceed with other KPIs.
- If CAP-06 is active, PMF+, and repeat/referral denominator FAIL: output `retention-no-decision` for Scale and Kill on retention-referencing actions. Continue/Investigate permitted.
- If CAP-06 is active, pre-PMF, and denominator below floor: output `cap-06-pre-pmf-deferral` (advisory only; weekly session proceeds normally).
- Cancel/refund reason log check is always required once CAP-06 is active, regardless of stage.

Section H — Weekly Audit Compliance (run after Sections A–G):

After completing the KPCs decision, run the 8-item weekly light-audit. Append Section H to this document.

| Item | Check | If FAIL |
|---|---|---|
| A1 Measurement active | Primary conversion event non-zero in last 7 days (standard reports, not Realtime) | Restrict Section A KPI validity note to unreliable; create REM task |
| A2 S10 decision documented | This document exists, is dated, and is at the canonical output path | Resolve immediately; PASS if corrected in this session |
| A3 Last-week action items reviewed | Every Section E item from last week has a disposition this week | List undisposed items; create REM task |
| A4 Exception tickets checked | No open EXC-* ticket is past its acknowledgement SLA | Escalate to owner; create REM task |
| A5 Capability contract not regressed | No active CAP status has regressed without a recorded decision | Create REM task to investigate |
| A6 Forecast within recalibration window | Active forecast next_review_date is in the future | Create REM task: run recalibration within 5 business days |
| A7 Prior Section G items have dispositions | All prior Section G data quality items are resolved or have open REM tasks | Carry forward to this Section G; create REM task if no owner |
| A8 No ownerless exception tickets | Every open EXC-* ticket has a named owner | Assign owner immediately |

Remediation task format: `REM-<BIZ>-<YYYYMMDD>-<n>`. Record all REM task IDs in Section H.

Note on A1: If A1 fails, add a measurement-unreliability note to Section A. Restrict decision class to `Continue` / `Investigate` regardless of nominal KPI values until signal is restored.

Full checklist specification (including monthly deep-audit): `docs/business-os/startup-loop/audit-cadence-contract-v1.md`.
```
