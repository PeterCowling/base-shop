---
Type: Fact-Find
Outcome: Planning
Status: Needs-input
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-11
Last-updated: 2026-02-11
Last-reviewed: 2026-02-11
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ideas-readiness-tooling-prerequisites
Deliverable-Type: spreadsheet
Execution-Track: business-artifact
Primary-Execution-Skill: create-ops-spreadsheet
Supporting-Skills: ideas-readiness, update-business-plan
Business-OS-Integration: on
Business-Unit: BOS
---

# Ideas Readiness — Tooling Prerequisites Fact-Find

## Scope
### Summary
Specify the exact tooling/data prerequisites required to make idea generation evidence-based for each business.

### Goals
- Define mandatory tooling baseline for BRIK, PIPE, PLAT, BOS.
- Define evidence/verification fields for each prerequisite.
- Define blocker criteria when prerequisites are missing or stale.

### Non-goals
- Implementing all tools in this brief.
- Treating missing critical tools as warnings.

## Evidence Audit (Current State)
- BRIK analytics and conversion instrumentation missing.
  - `docs/business-os/strategy/BRIK/plan.user.md:22`
- PIPE demand/fulfillment signal loop not instrumented.
  - `docs/business-os/strategy/PIPE/plan.user.md:18`
- PLAT build/CI baseline metrics not measured.
  - `docs/business-os/strategy/PLAT/plan.user.md:64`
- BOS process throughput metrics not instrumented.
  - `docs/business-os/strategy/BOS/plan.user.md:72`

## Prerequisite Inventory Contract

Each prerequisite row must include:

| Field | Type | Constraints |
|---|---|---|
| Business | enum | `BRIK|PIPE|PLAT|BOS` |
| Prereq-ID | string | `<BIZ>-PREREQ-NN` |
| Tool/Data Source | string | explicit system name |
| Purpose | string | decision/use-case statement |
| Owner | person | accountable owner |
| Status | enum | `missing|planned|in-progress|active|stale` |
| Verification Method | string | command/query/report path |
| Freshness-SLA | string | update cadence (`daily|weekly|biweekly`) |
| Last-Verified | date | `YYYY-MM-DD` |
| Blocker-Class | enum | `hard|soft` |
| Linked Outcome-ID | string | must exist in business plan |
| Linked Decision-Link-ID | string | must exist in business plan |

## Minimum Hard Prereqs by Business

### BRIK
1. Web analytics baseline (traffic + source + conversion events)
2. Search performance baseline

### PIPE
1. First-sale demand signal tracker
2. Fulfillment loop metrics (lead-time, success-rate, margin proxy)

### PLAT
1. Local build baseline timing
2. CI pass/fail + duration baseline

### BOS
1. Sweep->card->done conversion tracking
2. Cycle-time and rework indicator tracking

## Blocker Rules
- Missing hard prereq for a business => readiness `block` for that business.
- `Status=stale` beyond SLA => readiness `block`.
- Prereq without linked outcome + decision link => readiness `block`.

## Question Set (User Input Needed)
1. Who owns each hard prerequisite listed above?
2. By what dates will each prerequisite move to `active`?
3. What exact verification method proves each prerequisite is active?
4. Which outcome and decision-link IDs should each prerequisite map to?

## Planning Readiness Gate
- [ ] All hard prerequisites have owner and date.
- [ ] Verification method defined for each row.
- [ ] Outcome/decision links attached for each row.
- [ ] No stale hard prerequisite rows.

## Recommended Next Step
- Create/update prerequisite tracker in docs/business-os/readiness and link into business plans.
- Re-run `/ideas-readiness` after owner/date commitments are documented.
