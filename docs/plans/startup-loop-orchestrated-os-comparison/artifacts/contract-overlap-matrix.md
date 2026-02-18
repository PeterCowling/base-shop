---
Type: Investigation-Artifact
Task: TASK-00
Plan: docs/plans/startup-loop-orchestrated-os-comparison/plan.md
Created: 2026-02-18
Last-updated: 2026-02-18
Status: Complete
---

# Contract Overlap Matrix: Current Startup-Loop vs Research Process Model

## Purpose

Maps all 28 research process IDs from `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md` against current startup-loop contracts to identify coverage status, evidence paths, and v1 action for each requirement.

**Coverage status definitions:**
- `Covered` — fully covered by an existing canonical contract; no v1 action required.
- `Partial` — some coverage exists but is incomplete, not recurring, or lacks a first-class artifact schema.
- `Missing` — no canonical contract, artifact path, or gate exists; v1 action required.

**Collision risk definitions:**
- `None` — addition is safe as additive contract.
- `Low` — minimal overlap; care needed on naming.
- `Medium` — existing contract covers adjacent territory; must not duplicate or contradict.
- `High` — proposed addition would directly conflict with a canonical contract.

---

## Matrix

| # | Research Requirement | Research Process ID | Current Contract | Coverage Status | Evidence Path | Collision Risk | V1 Action |
|---|---|---|---|---|---|---|---|
| 1 | Weekly signal intake and insight synthesis | CDI-1 | S10 weekly readout (loop-spec.yaml) + weekly-kpcs-decision-prompt.md | Partial | `docs/business-os/startup-loop/loop-spec.yaml#S10`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Low | Add CDI-1 to `process-registry-v1.md` with explicit artifact path for Weekly Insight Memo; link to S10 stage |
| 2 | Customer Development interviews and field validation | CDI-2 | None | Missing | — | None | Add CDI-2 to `process-registry-v1.md` with artifact path, owner role, and cadence; stage anchor: recurring across S7→S10 |
| 3 | Market and competitor scan | CDI-3 | S2 market intelligence prompt (one-time; not recurring) | Partial | `docs/business-os/startup-loop/loop-spec.yaml#S2`, `docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.md` | Low | Add CDI-3 to `process-registry-v1.md` as recurring process; distinguish from one-time S2 initial scan |
| 4 | Experiment backlog design and prioritisation | CDI-4 | weekly-kpcs-decision-prompt.md K/P/C/S experiment tracking; lp-signal-review skill | Partial | `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Low | Add CDI-4 to `process-registry-v1.md` with Experiment Backlog artifact path; link to S10 contract |
| 5 | Offer and value proposition iteration | OFF-1 | lp-offer (S2B) — one-time stage; CAP-01/03 partial in capability contract | Partial | `docs/business-os/startup-loop/loop-spec.yaml#S2B`, `docs/business-os/startup-loop/marketing-sales-capability-contract.md#CAP-01` | Medium | Add OFF-1 to `process-registry-v1.md` as recurring process; reference existing offer artifact path `strategy/<BIZ>/offer.user.md`; must NOT duplicate CAP-01/03 ownership |
| 6 | Pricing and revenue management review | OFF-2 | weekly-kpcs-decision-prompt.md has pricing decisions; lp-forecast (S3) for financial forecasts | Partial | `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`, `docs/business-os/startup-loop/loop-spec.yaml#S3` | Low | Add OFF-2 to `process-registry-v1.md` with structured pricing review process; note revenue management for hospitality branch |
| 7 | Product/listing content and merchandising refresh | OFF-3 | lp-site-upgrade (S6) for site improvements — not recurring | Partial | `docs/business-os/startup-loop/loop-spec.yaml#S6` | Low | Add OFF-3 to `process-registry-v1.md` as recurring process separate from one-time S6 site upgrade |
| 8 | Channel policy and conflict management | OFF-4 | CAP-04 Partial in capability contract; lp-channels (S6B) for initial channel strategy | Partial | `docs/business-os/startup-loop/marketing-sales-capability-contract.md#CAP-04` | Medium | Add OFF-4 to `process-registry-v1.md` as recurring process; link to CAP-04 completion work; must not conflict with lp-channels artifact path |
| 9 | Weekly demand plan and campaign sprint | GTM-1 | weekly-kpcs-decision-prompt.md demand actions; no "Demand Sprint Plan" artifact schema | Partial | `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Low | Add GTM-1 to `process-registry-v1.md` with Weekly Demand Sprint Plan artifact path |
| 10 | Distribution channel ops (retail/wholesale/OTAs) | GTM-2 | None | Missing | — | None | Add GTM-2 to `process-registry-v1.md`; profile-conditional (wholesale-heavy / OTA-high branches); stage anchor: recurring S10 |
| 11 | Sales/account pipeline and booking deals | GTM-3 | CAP-05 Missing in capability contract; no canonical gate or template | Missing | `docs/business-os/startup-loop/marketing-sales-capability-contract.md#CAP-05` | None | Add GTM-3 schema to `docs/business-os/startup-loop/sales-ops-schema.md` (TASK-03); GTM-3 = primary CAP-05 process vehicle |
| 12 | Conversion and lifecycle automation | GTM-4 | CAP-06 Missing; no lifecycle automation process or artifact | Missing | `docs/business-os/startup-loop/marketing-sales-capability-contract.md#CAP-06` | None | Add GTM-4 to `docs/business-os/startup-loop/retention-schema.md` (TASK-04); GTM-4 = automation arm of CAP-06 |
| 13 | Capacity and inventory planning | OPS-1 | bottleneck-diagnosis-schema.md covers constraint scoring; no recurring capacity planning process | Partial | `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` | Low | Add OPS-1 to `process-registry-v1.md`; profile-conditional (inventory-present / hospitality branches) |
| 14 | Fulfilment or stay delivery execution | OPS-2 | None in startup-loop scope (S9 builds artifacts, S9B QAs them; post-launch delivery is not contracted) | Missing | — | None | Add OPS-2 to `process-registry-v1.md` with explicit pre-PMF scope note: this process activates post-launch; not a startup-loop stage output |
| 15 | Returns, refunds, cancellations and chargebacks | OPS-3 | None | Missing | — | None | Add OPS-3 to `process-registry-v1.md`; profile-conditional; stage anchor: activates after first transactions |
| 16 | Quality assurance and maintenance management | OPS-4 | S9B (lp-launch-qa/lp-design-qa) — pre-launch QA only; no ongoing maintenance process | Partial | `docs/business-os/startup-loop/loop-spec.yaml#S9B` | Low | Add OPS-4 to `process-registry-v1.md` as recurring process; distinguish from one-time S9B pre-launch gate |
| 17 | Support triage and service recovery | CX-1 | None | Missing | — | None | Add CX-1 to `process-registry-v1.md`; stage anchor: recurring from first customer contact |
| 18 | Reviews and reputation management | CX-2 | None | Missing | — | None | Add CX-2 to `process-registry-v1.md`; profile-conditional (hospitality platform performance thresholds) |
| 19 | Retention and loyalty loops | CX-3 | CAP-06 Missing; no retention contract | Missing | `docs/business-os/startup-loop/marketing-sales-capability-contract.md#CAP-06` | None | Add CX-3 to `docs/business-os/startup-loop/retention-schema.md` (TASK-04); CX-3 = retention-journey arm of CAP-06; complements GTM-4 |
| 20 | SOP and training updates | CX-4 | None | Missing | — | None | Add CX-4 to `process-registry-v1.md`; profile-conditional (scales with team size) |
| 21 | Weekly cash and unit economics review | FIN-1 | weekly-kpcs-decision-prompt.md financial decisions; lp-forecast (S3) unit economics | Partial | `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`, `docs/business-os/startup-loop/loop-spec.yaml#S3` | Low | Add FIN-1 to `process-registry-v1.md` with Weekly Cash Sheet artifact path; link to S10 contract |
| 22 | Billing, payouts and reconciliation | FIN-2 | None | Missing | — | None | Add FIN-2 to `process-registry-v1.md`; activates after first transactions |
| 23 | Risk register, compliance, and incident readiness | FIN-3 | bottleneck-diagnosis-schema.md has compliance/safety incident trigger codes; exception handling is thin operationally | Partial | `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` | Medium | Add FIN-3 to `exception-runbooks-v1.md` (TASK-05) Compliance/Safety exception state; add to `process-registry-v1.md` for recurring compliance review; must not conflict with bottleneck-diagnosis trigger codes |
| 24 | Vendor and procurement management | FIN-4 | None | Missing | — | None | Add FIN-4 to `process-registry-v1.md`; profile-conditional (scaling stage, vendor-dependent profiles) |
| 25 | KPI refresh and data integrity checks | DATA-1 | weekly-kpcs-decision-prompt.md denominator validity; CAP-07 Partial | Partial | `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`, `docs/business-os/startup-loop/marketing-sales-capability-contract.md#CAP-07` | Medium | Add DATA-1 to `process-registry-v1.md`; KPI Pack artifact path; must not duplicate CAP-07 measurement setup contract |
| 26 | Leading indicator monitoring and alerting | DATA-2 | bottleneck-diagnosis-schema.md covers constraint-level blocked-stage keys; no threshold-management process | Partial | `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` | Medium | Add DATA-2 alert threshold management to `exception-runbooks-v1.md` (TASK-05); add to `process-registry-v1.md` for recurring monitoring process; must not duplicate bottleneck-diagnosis-schema blocked-stage ownership |
| 27 | Incident post-mortems and corrective actions | DATA-3 | bottleneck-diagnosis-schema.md identifies constraint types; no post-mortem or CAPA process contracted | Partial | `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` | Low | Add DATA-3 CAPA process to `exception-runbooks-v1.md` (TASK-05); CAPA is the resolution arm of each exception runbook section |
| 28 | Weekly Review facilitation and decision log | DATA-4 | S10 (weekly-kpcs-decision-prompt.md) fully covers weekly review and decision log | **Covered** | `docs/business-os/startup-loop/loop-spec.yaml#S10`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | High (do not add competing contract) | No v1 action; preserve current contract; any additions must extend S10 scope only |

---

## Coverage Summary

| Status | Count | % of Total |
|---|---|---|
| Covered | 1 | 4% |
| Partial | 15 | 54% |
| Missing | 12 | 43% |
| **Total** | **28** | 100% |

---

## Missing Rows: Candidate Destination Contract Paths

All 12 Missing rows have explicit candidate destination paths:

| Process ID | Candidate Destination | TASK |
|---|---|---|
| CDI-2 | `docs/business-os/startup-loop/process-registry-v1.md` | TASK-02 |
| GTM-2 | `docs/business-os/startup-loop/process-registry-v1.md` | TASK-02 |
| GTM-3 | `docs/business-os/startup-loop/sales-ops-schema.md` | TASK-03 |
| GTM-4 | `docs/business-os/startup-loop/retention-schema.md` | TASK-04 |
| OPS-2 | `docs/business-os/startup-loop/process-registry-v1.md` (with post-launch scope note) | TASK-02 |
| OPS-3 | `docs/business-os/startup-loop/process-registry-v1.md` (conditional) | TASK-02 |
| CX-1 | `docs/business-os/startup-loop/process-registry-v1.md` | TASK-02 |
| CX-2 | `docs/business-os/startup-loop/process-registry-v1.md` | TASK-02 |
| CX-3 | `docs/business-os/startup-loop/retention-schema.md` | TASK-04 |
| CX-4 | `docs/business-os/startup-loop/process-registry-v1.md` | TASK-02 |
| FIN-2 | `docs/business-os/startup-loop/process-registry-v1.md` | TASK-02 |
| FIN-4 | `docs/business-os/startup-loop/process-registry-v1.md` | TASK-02 |

**Validation:** All 12 Missing rows have a candidate destination. ✓

---

## Collision Risk Summary

| Risk Level | Count | Process IDs |
|---|---|---|
| None | 12 | CDI-2, GTM-2, GTM-3, GTM-4, OPS-2, OPS-3, CX-1, CX-2, CX-3, CX-4, FIN-2, FIN-4 |
| Low | 10 | CDI-1, CDI-3, CDI-4, OFF-2, OFF-3, GTM-1, OPS-1, OPS-4, FIN-1, DATA-3 |
| Medium | 5 | OFF-1, OFF-4, FIN-3, DATA-1, DATA-2 |
| High | 1 | DATA-4 — DO NOT add competing weekly-review contract |

**Key collision mitigations for v1:**
1. **DATA-4 (High risk):** The weekly KPCs decision prompt + S10 is fully covered. Any process-registry entries must reference this existing contract, never replace it.
2. **OFF-1/CAP-01/03 (Medium risk):** Process registry must use the same offer artifact path (`strategy/<BIZ>/offer.user.md`) and must not reassign CAP-01/03 ownership from `lp-offer`.
3. **OFF-4/CAP-04 (Medium risk):** Channel policy process must reference CAP-04 completion work in capability contract; no duplicate channel plan artifact path.
4. **DATA-2/bottleneck-diagnosis-schema (Medium risk):** Exception triggering must extend (not replace) the existing blocked-stage taxonomy in `bottleneck-diagnosis-schema.md`.

---

## Implications for TASK-01 Boundary Decision

This matrix confirms that the v1 boundary should be:

1. **stage-orchestration responsibility** (loop-spec.yaml, manifest-schema.md) → **unchanged in v1.** All 28 process IDs are *additive* overlays; none require stage ordering changes.
2. **process-layer registry** (new `process-registry-v1.md`) → owns: CDI/OFF/GTM/OPS/CX/FIN/DATA process IDs, recurring artifact paths, owner roles, and stage anchor references.
3. **capability completion** (marketing-sales-capability-contract.md) → owns: CAP-01..CAP-07 status, validation rules. Process registry links to it but does not replace it.
4. **exception-runbooks** (new `exception-runbooks-v1.md`) → owns: DATA-2 threshold management, FIN-3 compliance runbook, DATA-3 CAPA process, and all four exception state playbooks.

**Conflicts to prohibit in v1:**
- Do not add process-state fields to loop-spec.yaml (preserve stage-graph stability).
- Do not create a second Weekly Review artifact schema (DATA-4 is covered; extend S10 only).
- Do not create a competing offer artifact path (CAP-01/03 path is canonical).

---

## Investigation Closure

**Acceptance check:**
- [x] Matrix has columns: `research-requirement`, `research-process-id`, `current-contract`, `coverage-status`, `evidence-path`, `collision-risk`, `v1-action`.
- [x] Every row is tagged `Covered`, `Partial`, or `Missing`.
- [x] 28 total requirements mapped (≥12 high-signal required; 28 delivered).
- [x] All 12 Missing rows have a candidate destination contract path.
- [x] Collision risks identified and mitigated in notes.

**Investigation conclusion:** Matrix is complete. TASK-01 can proceed with full overlap evidence. The boundary decision has a clear recommended default: additive process-registry overlay with no loop-spec edits in v1.
