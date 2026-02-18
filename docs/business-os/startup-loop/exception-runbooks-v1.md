---
Type: Operations-Contract
Status: Active
Version: 1.0.0
Domain: Venture-Studio
Workstream: Operations
Created: 2026-02-18
Last-updated: 2026-02-18
Owner: startup-loop maintainers + operator
Related-plan: docs/plans/startup-loop-orchestrated-os-comparison/plan.md
Related-process-registry: docs/business-os/startup-loop/process-registry-v1.md
Related-bottleneck-schema: docs/business-os/startup-loop/bottleneck-diagnosis-schema.md
---

# Exception Runbooks v1

## Purpose and Scope

This document defines operational runbooks for the four canonical exception states in the startup loop. Each exception state can interrupt the normal weekly cycle at any point. The runbooks specify: trigger thresholds, owner, acknowledgement SLA, resolution SLA, mandatory artifacts, and closure criteria.

**Exception handling in the startup loop has two existing layers this document extends:**
1. `bottleneck-diagnosis-schema.md` — metric-based constraint diagnosis and blocked-stage reason taxonomy (`compliance`, `ops_capacity`, etc.). This document does NOT modify those keys.
2. `process-registry-v1.md` (DATA-2) — leading indicator monitoring and alert ticket generation. This document defines the escalation path and SLAs once a DATA-2 alert ticket is opened.

**These runbooks are additive.** They reference existing contracts without replacing them.

---

## Exception State Overview

| Exception State | Trigger Category | Precedence | Weekly Cycle Impact |
|---|---|---|---|
| Demand Shock | Revenue / demand | 4 (lowest) | Replans GTM-1; overrides discretionary spend |
| Cash Constraint | Financial / runway | 3 | Freezes discretionary spend; accelerates receivables |
| Quality Incident | Operational / reputation | 2 | Mandates CX-1 + OPS-4 + DATA-3 + CX-4 response |
| Compliance/Safety Incident | Legal / regulatory / safety | 1 (highest) | Overrides all other priorities; may halt operations |

**Precedence rule:** When a single root cause could trigger multiple exception states, activate only the highest-precedence state. Note secondary concerns in the exception ticket but do not open parallel runbooks for the same root cause. Exception: Compliance/Safety may co-exist with Cash Constraint when a compliance incident independently generates a cash impact (e.g., regulatory fine).

**Weekly review continues during all exception states.** Exception outcomes are recorded in DATA-4 decision log. Exception ticket SLAs run independently of the weekly cycle.

---

## Exception Ticket Format (DATA-2 Standard)

Every exception opens a ticket with the following fields:

```markdown
Exception Ticket

ID: EXC-<BIZ>-<YYYYMMDD>-<sequence>
State: [Demand Shock | Cash Constraint | Quality Incident | Compliance/Safety Incident]
Trigger: [specific threshold breached]
Triggered at: [ISO 8601 timestamp]
Detected by: [DATA-2 alert / manual observation]
Business: [BIZ]
Owner: [role / person]
Acknowledgement deadline: [timestamp]
Acknowledged at: [timestamp — filled when acked]
Resolution deadline: [timestamp]
Resolved at: [timestamp — filled when closed]
Status: [Open | Acknowledged | Resolved | Escalated]
Mandatory artifacts: [checklist — see runbook]
Root cause hypothesis: [brief statement]
Closure evidence: [links to mandatory artifacts when resolved]
Decision log reference: [DATA-4 entry date/ID]
```

---

## Runbook 1: Demand Shock

### Trigger Thresholds (objective; ≥1 must be met)

| Signal | Hard threshold | Measurement | Confirmation period |
|---|---|---|---|
| Traffic drop | < 50% of prior 4-week average | DATA-1 weekly KPI pack | ≥2 consecutive days (not single-day noise) |
| Bookings / orders | < 30% of weekly target | DATA-1 KPI pack | ≥1 full week missed |
| CAC spike | > 200% of established baseline | DATA-1 / channel dashboard | ≥1 week; exclude launch anomalies in first 4 weeks |
| OTA pickup / pacing | > 40% below expected OTB for arrival window | DATA-1 / channel manager (hospitality) | ≥5 days below threshold |

### Explicit Non-Triggers

- Seasonal dip documented in the forecast with an expected range (does not trigger if actual within range).
- One-day traffic anomaly with DATA-1 anomaly note (resolved or explained within 48 hours).
- Known platform outage (channel manager, OTA) with resolution confirmed within 24 hours.
- First 2 weeks post-launch: below-target bookings/orders do not trigger Demand Shock — baseline not yet established.

### Owner and Escalation

| Role | Responsibility |
|---|---|
| Growth/Commercial Lead | Primary owner; executes recovery processes |
| Founder/GM | Approver for pricing changes >10% vs baseline; approves spend allocation override |

### SLAs

| SLA | Target | Maximum |
|---|---|---|
| Acknowledgement (from DATA-2 alert) | 4 hours (business hours) | 24 hours |
| First recovery action documented | 24 hours from acknowledgement | 48 hours |
| Weekly cycle recovery plan | By next S10 session | 7 days from trigger |

### Required Processes (from process-registry-v1.md)

| Process | Action required |
|---|---|
| OFF-2 | Immediate pricing review; identify pricing actions within threshold |
| CDI-3 | Rapid competitor scan: check for pricing or promo changes driving demand away |
| GTM-1 | Replanned demand sprint with recovery hypothesis; stop non-performing campaigns |
| CDI-4 | Add recovery experiment to backlog with owner and hypothesis |

### Mandatory Artifacts

1. **Exception ticket** (EXC format above) — opened within acknowledgement SLA.
2. **Root cause hypothesis** (1 paragraph) — in exception ticket.
3. **Immediate actions plan** — which campaigns stopped/modified; which pricing actions taken; owner per action. Filed within first recovery action SLA.
4. **Weekly recovery plan** — recovery hypothesis with leading indicator targets; filed in DATA-4 before next S10.
5. **CDI-4 experiment brief** — at least one experiment designed to test the recovery hypothesis.

### Closure Criteria

Exception closes when ALL of the following are true:
1. Trigger threshold no longer met for ≥2 consecutive weeks.
2. Root cause documented with evidence (DATA-1 data).
3. Recovery plan outcome recorded in DATA-4 decision log.
4. CDI-4 experiment brief exists with owner and deadline.
5. Exception ticket `Resolved` status with `Resolved at` timestamp.

### Trigger Overlap Handling

If Demand Shock co-occurs with Cash Constraint (e.g., demand drop causing runway impact): activate Cash Constraint (higher precedence). Note Demand Shock as secondary concern in the Cash Constraint ticket.

---

## Runbook 2: Cash Constraint

### Trigger Thresholds (objective; ≥1 must be met)

| Signal | Hard threshold | Measurement | Notes |
|---|---|---|---|
| Cash runway | < 8 weeks at current burn rate | FIN-1 weekly cash sheet | Escalation threshold; below 4 weeks = critical |
| Payout variance | > £500 or >10% of expected weekly payout, unexplained | FIN-2 reconciliation pack | ≥2 consecutive weeks without explanation |
| Refund/chargeback rate | > 5% of weekly gross revenue | OPS-3 log + FIN-2 | ≥2 consecutive weeks |
| AR overdue | > £1,000 outstanding beyond payment terms (wholesale) | FIN-2 AR log | ≥14 days past due |

**Advisory threshold (pre-exception):** Runway 8–12 weeks triggers an advisory flag in DATA-4 (not a full exception) — operator monitors and prepares contingency plan.

### Explicit Non-Triggers

- Planned spend that was budgeted and approved (does not reduce remaining runway below threshold calculation).
- Timing difference in OTA/platform payout (reconciled within 48 hours without net variance).
- Single refund above normal rate explained by one-time identifiable cause (e.g., one large order cancellation).

### Owner and Escalation

| Role | Responsibility |
|---|---|
| Finance Owner | Primary owner; executes FIN-1/FIN-2 review; manages recoverable receivables |
| Founder/GM | Sole decision-maker for spend freeze; approves non-standard payment terms or emergency funding actions |

### SLAs

| SLA | Target | Maximum |
|---|---|---|
| Acknowledgement (from DATA-2 alert) | 2 hours (business hours) | 12 hours |
| Spend freeze notice issued | 24 hours from acknowledgement | 48 hours |
| Runway recalculation published | 24 hours from acknowledgement | 48 hours |
| Recovery options documented | 72 hours from acknowledgement | 7 days |

### Required Processes (from process-registry-v1.md)

| Process | Action required |
|---|---|
| FIN-1 | Immediate runway recalculation; identify discretionary spend eligible for freeze |
| FIN-2 | Full payout reconciliation; identify and chase recoverable receivables |
| OFF-4 | Review channel spend commitments; identify which channels can be paused without contractual penalty |

### Mandatory Artifacts

1. **Exception ticket** — opened within acknowledgement SLA.
2. **Runway recalculation** (FIN-1 output) — updated cash sheet with scenario: current burn, frozen burn, recovery burn.
3. **Spend freeze notice** — list of paused spend items with effective date and expected cash impact.
4. **Recoverable receivables list** (FIN-2 output) — overdue AR with chase plan and owner.
5. **Recovery options brief** — 2–3 options (e.g., accelerate receivables, reduce burn, emergency capital) with expected runway impact per option.
6. **DATA-4 decision log entry** — records spend freeze decision with Founder/GM approval.

### Closure Criteria

Exception closes when ALL of the following are true:
1. Cash runway ≥ 12 weeks based on revised forward plan.
2. Spend freeze lifted or modified spend profile documented as new baseline.
3. Root cause documented (payout variance explained, refund rate normalised, or runway improved via other means).
4. Recovery options brief outcome recorded in DATA-4.
5. Exception ticket `Resolved` with `Resolved at` timestamp.

---

## Runbook 3: Quality Incident

### Trigger Thresholds (objective; ≥1 must be met)

| Signal | Hard threshold | Measurement | Notes |
|---|---|---|---|
| Platform rating drop | Below Airbnb Superhost 4.8 / Booking.com 8.0 / equivalent platform threshold | CX-2 review dashboard | Immediate trigger — no confirmation period required |
| Complaint rate | > 5% of weekly orders/bookings for ≥1 week | CX-1 weekly top-issues report | Confirm rate is sustained, not single-event |
| OTIF failure rate | < 80% for ≥1 week (product businesses) | OPS-2 ops report | Applies to `inventory_present` and hospitality |
| Single safety-adjacent complaint | Any complaint alleging physical harm, property damage, or health risk | CX-1 escalation log | Immediate trigger — no persistence threshold |
| Review velocity spike (negative) | ≥3 negative reviews in <48 hours, or single viral/high-visibility negative review | CX-2 dashboard | Immediate trigger |

### Explicit Non-Triggers

- Isolated complaint with CAPA already documented and closed (CX-1 + OPS-4) within the same week.
- Single negative review counterbalanced by normal weekly review sentiment (no rating threshold breach).
- OTIF miss explained by one-time documented supply disruption with exception record in OPS-3 and FIN-4.

### Owner and Escalation

| Role | Responsibility |
|---|---|
| CX Lead | Primary owner; operates CX-1 triage; coordinates OPS-4 response |
| Ops Lead | Executes OPS-4 fixes and CX-4 SOP updates |
| Founder/GM | Owner for high-severity incidents (safety-adjacent, viral/reputational) |

### SLAs

| SLA | Target | Maximum |
|---|---|---|
| Acknowledgement (from DATA-2 alert or direct report) | 2 hours | 4 hours |
| Customer/guest acknowledgement (public response where applicable) | 4 hours (hospitality platforms) | 24 hours |
| Root cause identified | 24 hours from acknowledgement | 48 hours |
| CAPA documented (DATA-3) | 48 hours from root cause | 72 hours |
| SOP updated (CX-4) | 72 hours from CAPA | 7 days |

### Required Processes (from process-registry-v1.md)

| Process | Action required |
|---|---|
| CX-1 | Immediate triage; service recovery for affected customers/guests; response posted (hospitality platforms) |
| OPS-4 | Root cause inspection; maintenance or quality fix; preventive action documented |
| DATA-3 | Post-mortem with objective timeline and CAPA list |
| CX-4 | SOP update reflecting root cause finding; training completed |

### Mandatory Artifacts

1. **Exception ticket** — opened within acknowledgement SLA.
2. **Incident timeline** (DATA-3 input) — objective sequence of events with customer/guest impact.
3. **Customer/guest response record** (CX-1 output) — confirmation that affected parties have been contacted and resolution offered.
4. **CAPA document** (DATA-3 output) — corrective actions with owners and deadlines; preventive actions with verification dates.
5. **Updated SOP** (CX-4 output) — version-controlled SOP reflecting root cause fix.
6. **DATA-4 decision log entry** — exception outcome and whether platform threshold was recovered.

### Closure Criteria

Exception closes when ALL of the following are true:
1. Trigger threshold no longer breached for ≥2 consecutive weeks.
2. CAPA document complete and all corrective actions assigned with deadlines.
3. SOP updated (CX-4) with training completed.
4. Platform response posted where required (hospitality) and rating trend stabilising.
5. Exception ticket `Resolved` with `Resolved at` timestamp.

---

## Runbook 4: Compliance/Safety Incident

### Trigger Thresholds (objective; ALL are immediate triggers — no confirmation period)

| Signal | Threshold | Notes |
|---|---|---|
| Personal data breach | Any breach involving personal data | GDPR notification clock starts: 72 hours to supervisory authority where applicable |
| Guest/customer physical harm | Any reported harm or near-miss on business premises or from business activity | Safety-critical — immediate Founder/GM escalation |
| Regulatory notice | Any formal notice, fine, or investigation from a regulatory authority | Immediate regardless of severity |
| Staff compliance failure | Any staff action that creates a legal obligation or liability exposure | Immediate escalation |
| Safety-critical maintenance failure | Any identified issue that creates immediate risk to life, safety, or legal compliance | Immediate |

### Explicit Non-Triggers

- Minor documentation gap (e.g., SOP version not updated) without live usage impact — use normal CX-4 process.
- Advisory correspondence from a platform (not a formal notice) — monitor; log in FIN-3 risk register; does not open exception.
- Outdated training record for staff no longer in role — update during normal monthly SOP audit.

### Owner and Escalation

| Role | Responsibility |
|---|---|
| Founder/GM | **Sole decision-maker and primary owner for all Compliance/Safety Incidents** |
| Data Protection liaison | Supports GDPR-related incidents; prepares notification if required |
| Legal/Compliance advisor | Engaged immediately for regulatory notices and serious safety incidents |
| Safety Responsible Person (hospitality) | Owns safety incident response on site |

**No delegation rule:** Compliance/Safety Incident owner cannot be delegated below Founder/GM level.

### SLAs

| SLA | Target | Maximum |
|---|---|---|
| Acknowledgement | Immediate (< 1 hour, any time of day/night) | 1 hour |
| Incident containment actions initiated | 2 hours from acknowledgement | 4 hours |
| Internal incident record completed | 4 hours from acknowledgement | 12 hours |
| GDPR supervisory authority notification (if applicable) | Within 72 hours of becoming aware of breach | 72 hours — legal clock; no extension |
| DATA-3 post-mortem initiated | 24 hours from containment | 48 hours |
| Updated risk register and playbook | 7 days from resolution | 14 days |

### Required Processes (from process-registry-v1.md)

| Process | Action required |
|---|---|
| FIN-3 | Incident record in risk register; compliance checklist updated; incident playbook invoked |
| DATA-3 | Post-mortem with full timeline; CAPA list; systemic prevention actions |

Additional for GDPR breach:
- Breach assessment: is it notifiable? (high risk to natural persons)
- If notifiable: prepare supervisory authority notification within 72 hours
- If high risk to individuals: notify affected individuals without undue delay

Additional for safety incident:
- Preserve incident evidence; do not modify site/equipment until inspection complete
- Emergency services contacted if required
- Safety Responsible Person (hospitality) leads site response

### Mandatory Artifacts

1. **Exception ticket** — opened within 1 hour.
2. **Incident record** (FIN-3 / risk register entry) — nature of incident, immediate containment actions taken, persons involved.
3. **Containment actions log** — time-stamped record of every action taken in the first 4 hours.
4. **GDPR notification draft** (if applicable) — prepared within 48 hours; submitted within 72 hours; copy retained.
5. **DATA-3 post-mortem** — objective timeline, root cause, impact assessment, full CAPA list.
6. **Updated risk register** (FIN-3) — risk updated to reflect incident and control changes.
7. **Updated incident playbook** — at minimum, the trigger that caused this incident must have an explicit response step added or clarified.
8. **DATA-4 decision log entry** — incident outcome and decisions taken.

### Closure Criteria

Exception closes when ALL of the following are true:
1. Incident fully contained — no ongoing risk to persons or ongoing regulatory obligation outstanding.
2. All GDPR obligations met (notification filed if required; affected parties notified if required).
3. DATA-3 post-mortem complete with CAPA assigned.
4. Risk register updated and incident playbook improved.
5. Founder/GM sign-off on closure in DATA-4 decision log.
6. Exception ticket `Resolved` with `Resolved at` timestamp.

---

## Trigger Overlap Decision Matrix

| Scenario | Primary exception | Secondary note |
|---|---|---|
| Demand drop causing runway to fall below 8 weeks | Cash Constraint | Note Demand Shock in Cash Constraint ticket; address GTM-1 within Cash Constraint recovery plan |
| Quality incident causing booking collapse | Quality Incident | Note Demand Shock as expected consequence; resolve quality root cause first |
| Data breach causing reputational damage | Compliance/Safety | Note Quality Incident risk; CX-1 response included in compliance runbook |
| Platform safety violation causing account suspension | Compliance/Safety | Note Demand Shock (account suspension = demand loss); address through Compliance runbook only |
| Cash constraint + regulatory fine simultaneously | Both may co-exist | Open both exception tickets with cross-references; manage Cash Constraint recovery and compliance response in parallel |

---

## Integration with Existing Contracts

| Contract | Relationship |
|---|---|
| `bottleneck-diagnosis-schema.md` | Exception states map to blocked-stage reason codes: `compliance` → Compliance/Safety; `ops_capacity` → Quality Incident or Demand Shock. This document does NOT modify the blocked-stage key taxonomy. |
| `process-registry-v1.md` | Required processes per exception state sourced from DATA-2 (triggering), CDI-3/OFF-2/GTM-1 (Demand Shock), FIN-1/FIN-2/OFF-4 (Cash Constraint), CX-1/OPS-4/DATA-3/CX-4 (Quality), FIN-3/DATA-3 (Compliance). |
| `weekly-kpcs-decision-prompt.md` | Exception outcomes recorded in DATA-4 / S10 memo Section F (Risk watchlist). Exception active status noted in Section A (KPI denominator validity check). |
| `audit-cadence-contract-v1.md` (TASK-06) | Weekly light audit checks that all exception tickets have acknowledgement and resolution SLAs tracked. Monthly deep audit reviews closed exceptions for playbook improvement. |

---

## VC-05 Validation Evidence

**VC-05-A — Trigger determinism:** Every exception state has ≥1 objective trigger threshold (numeric, time-bounded) and ≥1 explicit non-trigger condition. ✓

**VC-05-B — Ownership/SLA completeness:** All four exception states have named owner role, acknowledgement SLA, and resolution SLA. ✓

**VC-05-C — Closure evidence:** Each state defines minimum closure evidence package: exception ticket (`Resolved` status), DATA-3 post-mortem or equivalent investigation artifact, decision log entry in DATA-4, corrective action with owner and deadline. ✓ (designed; pilot-week sample required for validation)
