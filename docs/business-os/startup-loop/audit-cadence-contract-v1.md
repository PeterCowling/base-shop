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
Related-process-registry: docs/business-os/startup-loop/process-registry-v2.md
Related-exception-runbooks: docs/business-os/startup-loop/exception-runbooks-v1.md
Related-kpcs-prompt: docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md
---

# Audit Cadence Contract v1

## Purpose and Scope

This document defines two complementary audit contracts for the startup loop:

1. **Weekly light-audit** — a process conformance check run as part of every S10 weekly session (≤20 minutes).
2. **Monthly deep-audit** — a structured review covering capability health, exception post-mortems, data freshness, and decision traceability (≤120 minutes).

**Separation of concerns:**

| Mechanism | What it checks | When |
|---|---|---|
| S10 KPCs decision (KPI-driven) | Signal quality and K/P/C/S decision based on denominator-validated KPIs | Weekly (every S10) |
| Weekly light-audit (process-driven) | Operational conformance: are commitments being kept, are contracts current, are exception SLAs met? | Weekly (companion to S10) |
| Monthly deep-audit (structural review) | Capability progression, data governance, exception post-mortems, decision traceability quality | Monthly |

The weekly light-audit is NOT a second KPCs decision. It evaluates process quality, not KPI signal quality. A business can have strong KPIs and still fail the weekly audit if operational commitments are not tracked.

---

## Remediation Task ID Format

When a checklist item FAILS, a remediation task must be created and tracked:

```
REM-<BIZ>-<YYYYMMDD>-<n>
```

Where:
- `<BIZ>` is the business code (HEAD, PET, BRIK, etc.)
- `<YYYYMMDD>` is the audit date
- `<n>` is the sequence number for that audit date (01, 02, etc.)

Remediation tasks are logged in:
- **Weekly failures** → Section H of the current week's KPCs decision document.
- **Monthly failures** → The monthly audit summary document at `docs/business-os/strategy/<BIZ>/<YYYY-MM>-monthly-audit.user.md`.

A remediation task must include: REM ID, checklist item that failed, owner, due date, and resolution criteria.

---

## Weekly Light-Audit Checklist (S10 companion)

**Timebox:** ≤20 minutes. Run immediately after completing the KPCs decision (Sections A–G).

**Pass bar:** All 8 items PASS. Any FAIL → create `REM-` task before closing the S10 session.

**Checklist output:** Append a Section H to the weekly KPCs decision document with pass/fail for each item and REM task IDs for any failures.

### Checklist Items

| # | Item | Pass condition | Fail condition | Owner | If fail |
|---|---|---|---|---|---|
| A1 | **Measurement active** | Each business's primary conversion event (e.g., begin_checkout for BRIK) has non-zero signal in the last 7 days in GA4/tracking standard reports (not Realtime). | Any primary event shows zero or is unverifiable. | Operator | Create REM task: "Restore [event] signal" with diagnosis deadline = 2 business days. |
| A2 | **S10 decision documented** | This week's KPCs decision document exists, is dated, and is saved at the canonical path for this business. | Document is missing, undated, or saved at non-canonical path. | Operator | Create the document immediately. If done in this session, PASS. |
| A3 | **Last-week action items reviewed** | Every action item from the previous week's Section E (next-week action plan) has a disposition in this week's decision: executed, explicitly deferred (with new date), or elevated to open risk. | Any prior action item has no disposition this week. | Operator | Create REM task listing undisposed items. Add to Section E of this week's decision for next cycle. |
| A4 | **Exception tickets checked** | No open exception ticket is past its acknowledgement SLA (see exception-runbooks-v1.md for SLA by state). | Any open `EXC-*` ticket has no acknowledgement within SLA. | Operator | Escalate to named owner immediately. Create REM task: "Acknowledge EXC-[ticket] past SLA." |
| A5 | **Capability contract not regressed** | Each active CAP (e.g., CAP-05, CAP-06) retains its last-known status. No capability has silently moved from Schema-defined or Active to Missing without a recorded N/A decision. | Any capability shows regression in the capability contract registry without a recorded decision. | startup-loop maintainers | Create REM task: "Investigate CAP-[X] regression." |
| A6 | **Forecast within recalibration window** | The active forecast artifact for this business has a `next_review_date` in the future, or a recalibration artifact exists covering the current period. | `next_review_date` is in the past and no recalibration artifact exists. | Operator | Create REM task: "Run forecast recalibration for [BIZ]" due within 5 business days. |
| A7 | **Prior data quality items have dispositions** | All Section G items from last week's KPCs decision are either resolved or have an open REM task with a named owner and due date. | Any prior Section G item has no update this week and no REM task. | Operator | Carry item forward to this week's Section G. Create REM task if no owner assigned. |
| A8 | **No ownerless exception tickets** | Every open `EXC-*` ticket has a named owner in the ticket's owner field. | Any open exception ticket has no named owner. | Operator | Assign owner immediately. If owner is unknown, escalate to operator (Pete). |

---

## Monthly Deep-Audit Checklist

**Timebox:** ≤120 minutes. Run in the first week of each month, or within 5 business days of month-end.

**Output artifact:** `docs/business-os/strategy/<BIZ>/<YYYY-MM>-monthly-audit.user.md`
- One audit document per business per month.
- Must include: audit date, items run, PASS/FAIL per item, all REM task IDs created, and a summary verdict (All Pass / Conditional Pass / Requires Action).
- **Conditional Pass:** ≤2 items fail, all failures are non-critical, and REM tasks are created with owners. The business can continue the weekly loop without interruption.
- **Requires Action:** ≥3 items fail, or any Category 5 (risk/compliance) item fails. Weekly loop continues but a structured remediation sprint is required within 30 days.

**Pass bar:** All 21 items PASS, or Conditional Pass as defined above.

---

### Category 1: Capability Contract Health (≤25 min)

| # | Item | Pass condition | Fail condition | Owner | If fail |
|---|---|---|---|---|---|
| B1 | **CAP coverage progression on track** | Compare capability contract registry vs prior month. No regression. Any planned CAP advancement (Missing → Schema-defined) has progressed or has a documented delay reason. | Any regression without recorded decision; or planned advancement has no progress and no delay reason. | startup-loop maintainers | Create REM task: "Investigate CAP-[X] stall." Document reason in capability contract registry Notes column. |
| B2 | **CAP-05 artifact current (active businesses)** | For each business with CAP-05 active or at Schema-defined: `sales-ops.user.md` exists and `Last-updated` is within 30 days (or no relevant change this period). | `sales-ops.user.md` is missing, or Last-updated is >30 days with documented pipeline activity this month. | Operator | Create REM task: "Refresh CAP-05 artifact for [BIZ]." |
| B3 | **CAP-06 activation gate evaluated** | For each business: CAP-06 status is correctly set (Not-yet-active, active, or N/A). If business had first transaction this month, CAP-06 activation gate assessment has been documented. | First transaction occurred but CAP-06 activation gate was not evaluated. | Operator | Create REM task: "Evaluate CAP-06 activation gate for [BIZ]." |
| B4 | **CAP-07 Measure stage confirmed active** | For each business: `measurement-setup.user.md` exists at Active status and ≥1 confirmed conversion event is documented. | Measure stage doc missing, at Draft, or confirmed conversion event count = 0. | Operator | Create REM task: "Advance Measure stage for [BIZ] to Active status." |

---

### Category 2: Process Registry Adherence (≤20 min)

| # | Item | Pass condition | Fail condition | Owner | If fail |
|---|---|---|---|---|---|
| B5 | **Process sample audit (3 IDs)** | Select 3 process IDs from process-registry-v2.md (choose across CDI, OPS, CX workstreams). For each: the expected primary artifact exists and is dated within the expected cadence. | Any sampled process ID has no matching artifact, or the artifact is past its expected refresh cadence with no documented skip reason. | Operator | Create REM task for each failing process ID. Note which artifact is missing or stale. |
| B6 | **Owner roles filled** | For each process entry tagged "active this month" in the registry: a named person or role is identified as owner. No entry is marked active with owner = TBD. | Any active process entry has no named owner. | startup-loop maintainers | Assign owner. If unresolvable, flag as process-registry-gap and log REM task. |
| B7 | **Exception state process adherence** | For any exception ticket opened and closed this month: all required processes listed in the runbook under "Required Processes" have run (artifacts exist). | Required processes were skipped during an active exception state with no recorded waiver. | Operator | Create REM task: "Complete post-exception process audit for EXC-[ticket]." |

---

### Category 3: Exception State Review (≤20 min)

| # | Item | Pass condition | Fail condition | Owner | If fail |
|---|---|---|---|---|---|
| B8 | **Closed exception post-mortems complete** | For each exception ticket closed this month: a post-incident review entry exists in the decision log with root cause and corrective action documented. | Any closed ticket has no post-incident review. | Operator | Create REM task: "Complete post-incident review for EXC-[ticket]." Due within 5 business days. |
| B9 | **Open exception age within tolerance** | No open exception ticket exceeds: Demand Shock 30 days, Cash Constraint 21 days, Quality Incident 14 days, Compliance/Safety 7 days (these are escalation-to-venture-studio thresholds). | Any open exception ticket exceeds its state-specific age threshold. | Operator | Create REM task: "Escalate EXC-[ticket] — past age threshold." Escalate to operator (Pete) immediately. |
| B10 | **Trigger overlap events handled correctly** | For any week this month where two exception states were simultaneously open: precedence rule (Compliance=1, Quality=2, Cash=3, Demand=4) was applied correctly and documented. | No precedence record for a concurrent-exception week, or precedence was inverted vs the runbook definition. | Operator | Create REM task: "Correct exception precedence record for [week]." |

---

### Category 4: Data Integrity and Freshness (≤25 min)

| # | Item | Pass condition | Fail condition | Owner | If fail |
|---|---|---|---|---|---|
| B11 | **Standing refresh cadence compliance** | Market pulse: refreshed within last 30 days. Channel economics: refreshed within last 30 days. Regulatory watch: refreshed within last 90 days. (All per business.) | Any standing refresh is overdue per its cadence. | Operator | Create REM task: "Run [refresh type] for [BIZ]." |
| B12 | **Forecast freshness** | For each active business: active forecast artifact has `next_review_date` in the future, or a recalibration has been run this month. | Overdue `next_review_date` with no recalibration. | Operator | Create REM task: "Run forecast recalibration for [BIZ]." |
| B13 | **Market intelligence freshness** | For each business: `latest.user.md` points to a source with `Last-reviewed` ≤ 30 days, or a change-trigger refresh has been logged (with trigger reason documented). | `Last-reviewed` >30 days with no change-trigger log entry. | Operator | Create REM task: "Refresh market intelligence for [BIZ]." |
| B14 | **Results baseline integrity (website-live only)** | For website-live businesses: Cloudflare/Octorate data refresh on schedule (or documented gap with root cause). No undocumented data-quality regressions. | Data quality regression with no root cause logged, or refresh missed without documentation. | Operator | Create REM task: "Resolve data gap for [BIZ] Results baseline." |

---

### Category 5: Decision Traceability (≤20 min)

| # | Item | Pass condition | Fail condition | Owner | If fail |
|---|---|---|---|---|---|
| B15 | **S10 weekly cadence continuity** | The weekly KPCs decision has run every week this month without a gap (target: 4 or 5 per month per business). | Any week has no decision document for a business in active loop. | Operator | Create REM task: "Backfill S10 decision for [BIZ] week of [date]" if data exists. If gap is irrecoverable, document data gap in Section G of current decision. |
| B16 | **Scale/Kill decisions have denominator evidence** | For any Scale or Kill decision issued this month: Section A of that week's KPCs decision confirms all relevant KPI families PASS denominator check. | A Scale or Kill decision was issued without documented denominator PASS in Section A. | Operator | Create REM task: "Review and annotate decision validity for [BIZ] [date] decision." Decisions may need to be re-evaluated. |
| B17 | **Action item closure rate ≥70%** | Of last month's total action items (Section E across all decisions for this business), ≥70% were closed on time (executed or explicitly deferred before due date). | Closure rate <70% with no root cause identified. | Operator | Create REM task: "Analyse action item execution gap for [BIZ]." |
| B18 | **Open REM tasks within age window** | No open remediation task is >30 days old without a new due date or escalation record. | Any open REM task is >30 days old with no update. | Operator | Escalate to operator (Pete). Reassign or close with documented reason. |

---

### Category 6: Risk and Compliance Controls (≤10 min)

| # | Item | Pass condition | Fail condition | Owner | If fail |
|---|---|---|---|---|---|
| B19 | **Exception runbook coverage still valid** | All four exception states (Demand Shock, Cash Constraint, Quality Incident, Compliance/Safety) remain relevant to at least one active business. If any state is N/A for all active businesses, document rationale. | An exception state applies to an active business but has been silently removed from operating practice. | startup-loop maintainers | Create REM task: "Audit exception runbook applicability for [BIZ]." |
| B20 | **Data governance alignment** | For DATA-3 (data governance and schema alignment in process-registry-v2.md): all active data schema changes this month are documented in the relevant artifact or change log. No undocumented schema drift. | A data schema change occurred with no change log entry. | Operator | Create REM task: "Document schema change [description] for [BIZ]." |
| B21 | **Regulatory and claims compliance current** | Regulatory-watch artifact for each active business is updated within 90 days. No open compliance items from prior quarter remain unaddressed. | Regulatory-watch is >90 days old, or a prior-quarter compliance item has no resolution. | Operator | Create REM task: "Update regulatory watch for [BIZ]." Escalate compliance items immediately. |

---

## Audit Output Artifact

### Weekly — Section H (appended to KPCs decision document)

```markdown
## Section H — Weekly Audit Compliance

Audit date: [YYYY-MM-DD]
Business: [BIZ]

| Item | Status | Notes |
|---|---|---|
| A1 Measurement active | PASS / FAIL | [notes] |
| A2 S10 decision documented | PASS / FAIL | [notes] |
| A3 Last-week action items reviewed | PASS / FAIL | [notes] |
| A4 Exception tickets checked | PASS / FAIL | [notes] |
| A5 Capability contract not regressed | PASS / FAIL | [notes] |
| A6 Forecast within recalibration window | PASS / FAIL | [notes] |
| A7 Prior data quality items have dispositions | PASS / FAIL | [notes] |
| A8 No ownerless exception tickets | PASS / FAIL | [notes] |

Remediation tasks created: [REM-BIZ-YYYYMMDD-01, ...] or None.
```

### Monthly — Standalone audit summary artifact

Output path: `docs/business-os/strategy/<BIZ>/<YYYY-MM>-monthly-audit.user.md`

```markdown
---
Type: Audit-Summary
Business: [BIZ]
Audit-Month: [YYYY-MM]
Audit-Date: [YYYY-MM-DD]
Verdict: All Pass / Conditional Pass / Requires Action
Open-REM-Tasks: [count]
---

# Monthly Deep-Audit — [BIZ] [YYYY-MM]

## Summary

| Category | Items | PASS | FAIL |
|---|---|---|---|
| Capability Contract Health | 4 | [n] | [n] |
| Process Registry Adherence | 3 | [n] | [n] |
| Exception State Review | 3 | [n] | [n] |
| Data Integrity and Freshness | 4 | [n] | [n] |
| Decision Traceability | 4 | [n] | [n] |
| Risk and Compliance Controls | 3 | [n] | [n] |
| **Total** | **21** | **[n]** | **[n]** |

**Verdict:** [All Pass / Conditional Pass / Requires Action]

## Remediation Tasks

| REM ID | Checklist item | Owner | Due date | Resolution criteria |
|---|---|---|---|---|
| REM-[BIZ]-[YYYYMMDD]-01 | [item that failed] | [owner] | [date] | [done when] |

## Detail

[Category-by-category pass/fail with notes for any failure]
```

---

## Integration Notes

### With S10 KPCs Decision Prompt

The weekly audit (Section H) runs after the KPCs decision (Sections A–G) is complete. It does not modify the KPI-based decision in Section C. A FAIL in the audit does not automatically change the KPCs decision class — it creates a remediation task.

Exception: if item A1 (Measurement active) FAILs, Section A of the KPCs decision should note measurement unreliability. The decision class should be restricted to `Continue` / `Investigate` regardless of nominal KPI values.

### With Exception Runbooks

- Item A4 (exception tickets) links directly to `exception-runbooks-v1.md` acknowledgement SLAs.
- Item B9 (open exception age) uses the escalation thresholds defined per exception state.
- Item B7 and B8 (process adherence + post-mortems) depend on exception runbook "Required Processes" lists.

### With Process Registry

- Item B5 (process sample audit) samples randomly from `process-registry-v2.md`.
- Item B6 (owner roles filled) uses the Owner Role column from `process-registry-v2.md`.
- Items referencing DATA-3 (B20) link to the OPS/DATA workstream in `process-registry-v2.md`.

### With Capability Contract Registry

- Items B1–B4 use `docs/business-os/startup-loop/marketing-sales-capability-contract.md` as the source of truth.
- Any CAP status change discovered during the audit must be reflected in the capability contract registry.

---

## Validation Rules (VC-06)

### VC-06-A — Checklist Atomicity

**Pass when:** Every checklist item has an objective pass/fail rule (verifiable without subjective judgement), an assigned owner role, and a defined "if fail" remediation path. Reviewer can classify any scenario in ≤2 minutes per item.

**Fail when:** Any item uses subjective language ("seems okay", "roughly on track") without a numeric or binary anchor; or any item has no named owner; or "if fail" is undefined.

**Evidence:** This contract. All 29 items (8 weekly + 21 monthly) have: objective pass condition, objective fail condition, owner, if-fail action.

### VC-06-B — Operator Timebox Viability

**Pass when:** Weekly checklist ≤20 minutes and monthly checklist ≤120 minutes in dry-run samples. Measured by actual time per item across one complete run cycle.

**Fail when:** A complete weekly checklist run exceeds 25 minutes, or a complete monthly run exceeds 150 minutes. If exceeded: prune lowest-value items first (consult overlap with S10 Section G and existing stage gate checks before removing items with unique coverage).

**Designed timebox:**
- Weekly: 8 items × avg 2 min = 16 min (fits ≤20 min target with buffer)
- Monthly: 21 items across 6 categories; Category allocations shown in checklist headers: 25+20+20+25+20+10 = 120 min (exactly at target; allow 10% slip to 132 min before triggering scope reduction)

### VC-06-C — Traceability

**Pass when:** In one complete audit cycle (weekly + monthly), 100% of FAIL items have a REM task ID recorded with named owner and due date. REM task IDs are logged in the designated output artifact (Section H for weekly; `<YYYY-MM>-monthly-audit.user.md` for monthly).

**Fail when:** Any FAIL item has no REM task created, or a REM task is created but not logged in the canonical output path.

---

## Downstream Consumers

| Consumer | How it uses this contract |
|---|---|
| `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Section H (weekly audit) appended to each S10 decision document |
| `docs/business-os/startup-loop-workflow.user.md` | Audit cadence referenced in Quick Actions and stage status table |
| `docs/business-os/startup-loop/exception-runbooks-v1.md` | Exception SLA thresholds referenced in items A4, B8, B9, B10 |
| `docs/business-os/startup-loop/process-registry-v2.md` | Process sample audit (B5) and owner check (B6) source |
| `docs/business-os/startup-loop/marketing-sales-capability-contract.md` | CAP health items B1–B4 source of truth |

---

## N/A Policy

Individual checklist items may be marked `N/A` for a specific business or month when:

1. **The item is structurally irrelevant** (e.g., B14 for a pre-launch business with no historical baseline). Explicit business-model rationale required.
2. **A prerequisite contract is not yet active** (e.g., B2/B3 for businesses with CAP-05/CAP-06 Not-yet-active). Record `CAP-not-yet-active` instead of PASS or FAIL.
3. **No exception tickets exist** for items A4/A8/B8/B9/B10. Record `no-open-tickets` — this counts as PASS for those items.

N/A items are excluded from the pass/fail count but must be documented in the output artifact.

---

## Current Coverage

| Business | Weekly audit status | Monthly audit status | Notes |
|---|---|---|---|
| HEAD | Not yet started | Not yet started | Activate at first S10 session after this contract is published |
| PET | Not yet started | Not yet started | Activate at first S10 session after this contract is published |
| BRIK | Not yet started | Not yet started | Activate at first S10 session after this contract is published |

> **As of 2026-02-18.** First audit runs to be executed at next S10 session for each business.

---

## References

- Capability contract: `docs/business-os/startup-loop/marketing-sales-capability-contract.md`
- Process registry: `docs/business-os/startup-loop/process-registry-v2.md`
- Exception runbooks: `docs/business-os/startup-loop/exception-runbooks-v1.md`
- Weekly KPCs prompt: `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
- Bottleneck diagnosis: `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`
- Workflow guide: `docs/business-os/startup-loop-workflow.user.md`
