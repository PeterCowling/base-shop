---
Type: Process-Registry
Status: Active
Version: 2.0.2
Created: 2026-02-18
Last-updated: 2026-02-23
Owner: startup-loop maintainers
Taxonomy-Ref: docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.yaml
Assignment-Ref: docs/business-os/startup-loop/process-assignment-v2.yaml
Decision-Record: docs/plans/startup-loop-orchestrated-os-comparison-v2/decisions/v2-scope-boundary-decision.md
Supersedes: docs/business-os/startup-loop/process-registry-v1.md
Related-plan: docs/plans/startup-loop-orchestrated-os-comparison-v2/plan.md
---

> **AUTHORITATIVE:** This is the v2 process registry. `process-registry-v1.md` is archived.
> Process definitions source-of-truth: this file.
> Assignment source-of-truth: `docs/business-os/startup-loop/process-assignment-v2.yaml`.

# Startup Loop Process Registry v2

## Authority and Scope

**This registry is a process-layer operating contract. It does NOT govern stage ordering.**

Stage sequencing, join barriers, run packet structure, and gate conditions remain exclusively authoritative in:
- `docs/business-os/startup-loop/loop-spec.yaml` — stage graph and run contract
- `docs/business-os/startup-loop/manifest-schema.md` — single-writer baseline state

This registry answers: *"During each startup-loop run and weekly operating cycle, which process activities should be executed, by whom, and with what inputs/outputs?"* It complements the stage engine by specifying the operational substance within and between stages.

**Canonical artifact paths for `lp-*` skill outputs** remain in `docs/business-os/startup-loop/artifact-registry.md`. This registry references those paths but does not replace them.

**Consolidated operator briefing integrity** is governed by `docs/business-os/startup-loop/briefing-contract-schema-v1.md` (metadata contract, status taxonomy, contradiction keys, and T1 operator-card requirements). This registry references that contract for S10 operations and does not duplicate it.

---

## Authority and Deprecation Policy

| Dimension | Value |
|---|---|
| **Process definitions source-of-truth** | This file (`process-registry-v2.md`) |
| **Assignment source-of-truth** | `process-assignment-v2.yaml` |
| **Taxonomy source-of-truth** | `workstream-workflow-taxonomy-v2.yaml` |
| **v1 status** | Archived — tombstone at top of `process-registry-v1.md`. No new edits. |
| **Change-order rule** | Update `process-assignment-v2.yaml` first; update prose in this file second. |
| **Stage authority** | Stage ordering, stage IDs, and gate semantics remain in `loop-spec.yaml`. |

---

## Quick Reference Index

| Process ID | Name | Workstream | Stage Anchor | Cadence | Profile / Branch Conditions |
|---|---|---|---|---|---|
| CDI-1 | Weekly signal intake and insight synthesis | CDI | S10 | Weekly | All profiles |
| CDI-2 | Customer development interviews and field validation | CDI | MARKET-01, DO, recurring | Weekly (pre-PMF) / Biweekly (PMF+) | All profiles |
| CDI-3 | Market and competitor scan | CDI | MARKET-01, recurring | Weekly (hospitality, high season) / Biweekly (product) | All |
| CDI-4 | Experiment backlog design and prioritisation | CDI | S5A, S10 | Weekly | All |
| OFF-1 | Offer and value proposition iteration | OFF | MARKET-06, recurring | Weekly (pre-PMF/PMF) / Monthly (scaling) | All |
| OFF-2 | Pricing and revenue management review | OFF | MARKET-06, S10 | Weekly (hospitality always; product if volatile) | All |
| OFF-3 | Product / listing content and merchandising refresh | OFF | WEBSITE-01 (bootstrap), WEBSITE-02 (recurring; L1 Build 2 image-first default for visual-heavy catalogs) | One-time at first build, then Weekly (top assets) / Monthly full audit | All |
| OFF-4 | Channel policy and conflict management | OFF | SELL-01, recurring | Monthly review; weekly exceptions | `wholesale_heavy`, `OTA_mix_high` (conditional others) |
| GTM-1 | Weekly demand plan and campaign sprint | GTM | DO, S10 | Weekly | All |
| GTM-2 | Distribution channel ops (retail/wholesale/OTAs) | GTM | SELL-01, recurring | Weekly / Daily (high season or volume) | `wholesale_heavy`, `OTA_mix_high`, hospitality |
| GTM-3 | Sales / account pipeline and booking deals | GTM | SELL-01→S10 (CAP-05 gate) | Weekly | `wholesale_accounts>0`, group bookings, `hospitality` |
| GTM-4 | Conversion and lifecycle automation | GTM | DO→S10 (CAP-06 gate) | Weekly optimisation / Monthly flow audit | All post-launch |
| OPS-1 | Capacity and inventory planning | OPS | DO, S10 | Weekly; Daily peaks | `inventory_present`, `hospitality` |
| OPS-2 | Fulfilment or stay delivery execution | OPS | Post-DO launch | Daily | `inventory_present`, `hospitality` (activates post-launch) |
| OPS-3 | Returns, refunds, cancellations and chargebacks | OPS | Post-DO launch | Daily processing / Weekly review | `returns_enabled`, `hospitality` (activates after first transactions) |
| OPS-4 | Quality assurance and maintenance management | OPS | S9B, recurring | Weekly schedule + Daily urgent; Monthly deep | `inventory_present`, `hospitality` |
| CX-1 | Support triage and service recovery | CX | Post-DO launch | Daily triage / Weekly synthesis | All (activates from first customer contact) |
| CX-2 | Reviews and reputation management | CX | S10, recurring | Daily monitoring (hospitality) / Weekly batches (product) | `OTA_mix_high`, `hospitality` |
| CX-3 | Retention and loyalty loops | CX | S10 (CAP-06 gate) | Weekly optimisation / Monthly cohort | PMF+ (see retention-schema.md) |
| CX-4 | SOP and training updates | CX | DO, recurring | Weekly as needed; Monthly SOP audit | All (scales with team) |
| FIN-1 | Weekly cash and unit economics review | FIN | S3, S10 | Weekly | All |
| FIN-2 | Billing, payouts and reconciliation | FIN | Post-DO launch | Weekly / Daily (high volume) | All (activates after first transactions) |
| FIN-3 | Risk register, compliance, and incident readiness | FIN | ASSESSMENT, recurring | Weekly light / Monthly deep | All (see exception-runbooks-v1.md) |
| FIN-4 | Vendor and procurement management | FIN | Post-S5B, recurring | Monthly; Weekly exceptions | `inventory_present`, `hospitality`, scaling stage |
| DATA-1 | KPI refresh and data integrity checks | DATA | MEASURE-01/MEASURE-02, S3, S10 | Weekly + Daily key metrics | All |
| DATA-2 | Leading indicator monitoring and alerting | DATA | S10, recurring | Daily monitoring / Weekly summary | All (see exception-runbooks-v1.md) |
| DATA-3 | Incident post-mortems and corrective actions | DATA | Triggered | As-needed | All (see exception-runbooks-v1.md) |
| DATA-4 | Weekly Review facilitation and decision log | DATA | S10 | Weekly | All — **fully covered by `weekly-kpcs-decision-prompt.md`; do not add competing contract** |

---

## Stage Coverage Map

Every core startup-loop stage anchor has at least one linked workstream process responsibility:

| Stage | Name | Primary Process Activities |
|---|---|---|
| ASSESSMENT-09 | Intake | FIN-3 (initial risk scan), DATA-1 (KPI setup start) |
| ASSESSMENT | Assessment container and gate readiness | FIN-3 (compliance readiness), CDI-2 (customer evidence review) |
| MEASURE-01 | Agent-Setup | DATA-1 (Agent-Capability) |
| MEASURE-02 | Results | DATA-1 (baseline KPI data collection) |
| MARKET-01 | Market intelligence | CDI-3 (market/competitor scan), CDI-2 (customer interviews) |
| MARKET-06 | Offer design | OFF-1 (offer iteration), OFF-2 (initial pricing hypothesis) |
| S3 | Forecast | FIN-1 (unit economics baseline), DATA-1 (KPI modeling) |
| SELL-01 | Channel strategy + GTM | GTM-1 (demand plan), GTM-2 (distribution ops), OFF-4 (channel policy), CDI-4 (experiment design) |
| S4 | Baseline merge | DATA-1 (artifact integrity audit) |
| S5A | Prioritize | CDI-4 (experiment backlog prioritisation) |
| S5B | BOS sync | DATA-4 (decision log state sync) |
| WEBSITE-01 | L1 first build framework | OFF-3 (first-build framework and content/listing baseline contract) |
| WEBSITE-02 | Site-upgrade synthesis | OFF-3 (recurring content/listing refresh and merchandising iteration) |
| DO | Do | CDI-2 (field validation), CDI-4 (hypothesis design), GTM-1 (demand plan inputs), OPS-1 (capacity planning inputs), OPS-2 (delivery execution preparation), CX-4 (SOP updates), OPS-4 (build QA) |
| S9B | QA gates | OPS-4 (quality assurance), DATA-1 (tracking verification) |
| S10 | Weekly readout | CDI-1 (signal intake), CDI-4 (experiments), OFF-2 (pricing), GTM-1 (demand), FIN-1 (cash), DATA-2 (alerting), DATA-3 (CAPAs) — DATA-4 (weekly review) is the primary S10 process anchor |

---

## Workstream: Customer Discovery and Market Intelligence (CDI)

### CDI-1 — Weekly Signal Intake and Insight Synthesis

| Field | Value |
|---|---|
| **Workstream** | CDI — Customer Discovery and Market Intelligence |
| **Workflow phases** | Sense → Decide/Plan |
| **Primary phase** | Sense |
| **Activation** | always |
| **Purpose** | Convert raw weekly signals (sales/booking, support, reviews, web/OTA performance) into 3–5 actionable insights and hypotheses. |
| **Stage anchor** | S10 (weekly cadence) |
| **Cadence** | Weekly (pre-Weekly Review) |
| **Owner role** | Growth Lead (product) or Commercial/Revenue Lead (hospitality); in small teams: Founder/GM |
| **Inputs** | KPI Pack (DATA-1 output); support tickets; reviews; refund/cancellation reasons; competitor pricing observations; bottleneck-diagnosis signal |
| **Outputs / artifacts** | Weekly Insight Memo (1 page); updated Insight Log; 3–5 hypotheses linked to CDI-4 backlog |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/insight-log.user.md` (proposed path; schema TBD) |
| **Entry criteria** | Dashboard refreshed and reconciled (DATA-1 output available) |
| **Exit criteria** | Memo published; hypotheses added/updated with clear expected metric movement and linked to CDI-4 |
| **Exception linkage** | Feeds DATA-2 alert triggers when KPI anomalies exceed thresholds; feeds Demand Shock exception state |
| **Profile / branch** | All profiles; for hospitality, leading indicators include OTB/pickup and review velocity |
| **Collision note** | References S10 / `weekly-kpcs-decision-prompt.md`; does not replace it. This process focuses on insight synthesis *before* the decision meeting. |

### CDI-2 — Customer Development Interviews and Field Validation

| Field | Value |
|---|---|
| **Workstream** | CDI — Customer Discovery and Market Intelligence |
| **Workflow phases** | Sense → Decide/Plan |
| **Primary phase** | Sense |
| **Activation** | conditional — Weekly pre-PMF; biweekly at PMF/scaling; mandatory when top assumptions unvalidated |
| **Purpose** | Validate (or falsify) the highest-risk assumptions about customer/guest problems, willingness to pay, and buying/booking behaviour. |
| **Stage anchor** | MARKET-01 (initial), DO (`/lp-do-fact-find`), recurring thereafter |
| **Cadence** | Weekly (pre-PMF); biweekly (PMF/scaling) |
| **Owner role** | Founder/GM or Product/Experience Lead |
| **Inputs** | Hypothesis list (CDI-1 / CDI-4); target segment list; recruitment script; prior interview notes |
| **Outputs / artifacts** | Interview notes; synthesis (themes + quotes); updated segment and objection map |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/customer-interviews.user.md` (operator-maintained; no canonical schema yet) |
| **Entry criteria** | Top assumptions named and prioritised in CDI-4 backlog |
| **Exit criteria** | At least one decision made (pivot/persevere; offer/pricing change; new experiment); linked to CDI-4 backlog item |
| **Exception linkage** | Can surface Quality Incident early signals (repeated complaints pointing to delivery issues) |
| **Profile / branch** | All profiles; for hospitality, include cancelled/refunded guests as mandatory input source |

### CDI-3 — Market and Competitor Scan

| Field | Value |
|---|---|
| **Workstream** | CDI — Customer Discovery and Market Intelligence |
| **Workflow phases** | Sense → Decide/Plan |
| **Primary phase** | Sense |
| **Activation** | conditional — Weekly in high season or wholesale-heavy; biweekly/monthly for digital-only; mandatory during Demand Shock exception |
| **Purpose** | Keep pricing, positioning, and channel presence grounded in the current market (seasonality and local competition). |
| **Stage anchor** | MARKET-01 (initial deep research); recurring post-S5B |
| **Cadence** | Weekly (hospitality, high season); biweekly/monthly (product, depending on volatility) |
| **Owner role** | Commercial Lead; in small teams: Growth Lead |
| **Inputs** | Competitor list; scrape/notes of competitor prices and offers; OTA market view; retail shelf checks (wholesale) |
| **Outputs / artifacts** | Competitor scan snapshot; 1–3 recommended actions linked to OFF-2/OFF-4 |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/competitor-scan.user.md` (operator-maintained log) |
| **Entry criteria** | Competitor set defined |
| **Exit criteria** | Actions recorded and either approved or explicitly deferred in decision log (DATA-4) |
| **Exception linkage** | Feeds Demand Shock exception state (unexpected competitive pricing or promo activity) |
| **Profile / branch** | All profiles; hospitality must include OTA review scores and platform position |
| **Collision note** | Distinct from MARKET-01 deep-research market intelligence prompt (one-time initial scan). CDI-3 is the recurring operational scan. |

### CDI-4 — Experiment Backlog Design and Prioritisation

| Field | Value |
|---|---|
| **Workstream** | CDI — Customer Discovery and Market Intelligence |
| **Workflow phases** | Decide/Plan → Measure/Learn |
| **Primary phase** | Decide/Plan |
| **Activation** | always |
| **Purpose** | Turn hypotheses into testable experiments and prioritise them by expected impact and effort, maintaining a steady weekly experimentation throughput. |
| **Stage anchor** | S5A (initial prioritisation), S10 (weekly reprioritisation) |
| **Cadence** | Weekly |
| **Owner role** | Growth Lead (product) or Commercial/Revenue Lead (hospitality); facilitated by Data Lead |
| **Inputs** | Hypotheses (CDI-1/CDI-2); operational constraints (OPS-1); OKRs/targets; bottleneck diagnosis output |
| **Outputs / artifacts** | Experiment Backlog; 1–3 weekly Experiment Briefs with measurement plan |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/experiment-backlog.user.md` (operator-maintained) |
| **Entry criteria** | Hypotheses written with expected metric movement |
| **Exit criteria** | 1–3 experiments scheduled with owners, defined success metrics, and guardrail metrics |
| **Exception linkage** | Guardrail thresholds from experiments feed DATA-2 alert triggers |
| **Profile / branch** | All profiles; stage-aware (fewer experiments pre-PMF; higher throughput at scaling) |

---

## Workstream: Offering and Pricing (OFF)

### OFF-1 — Offer and Value Proposition Iteration

| Field | Value |
|---|---|
| **Workstream** | OFF — Offering and Pricing |
| **Workflow phases** | Decide/Plan → Build/Prepare |
| **Primary phase** | Decide/Plan |
| **Activation** | always |
| **Purpose** | Maintain a coherent offer catalogue and evolve it from learning; distinct from the one-time MARKET-06 offer design stage. |
| **Stage anchor** | MARKET-06 (initial creation via `lp-offer`); recurring post-S5B |
| **Cadence** | Weekly (pre-PMF/PMF); monthly (scaling) |
| **Owner role** | Product Lead (product) or Experience Lead (hospitality); approval: Founder/GM |
| **Inputs** | Insights (CDI-1/CDI-2); margin/unit economics (FIN-1); operational constraints (OPS-1) |
| **Outputs / artifacts** | Updated offer catalogue (change log); adjusted "promise statements" |
| **Artifact path** | `docs/business-os/startup-baselines/<BIZ>-offer.md` — canonical offer artifact (see artifact-registry.md); operator change log separate |
| **Entry criteria** | At least one quantified insight or problem statement from CDI-1/CDI-2 |
| **Exit criteria** | Updated offer with operational feasibility confirmed (OPS-1 sign-off); changes linked to DATA-4 decision log |
| **Exception linkage** | Major offer changes during Demand Shock exception require Founder/GM approval before activation |
| **Profile / branch** | All profiles |
| **Collision note** | The canonical offer artifact path is owned by `lp-offer` (artifact-registry.md). OFF-1 governs ongoing iteration; it does not reassign CAP-01/03 ownership. |

### OFF-2 — Pricing and Revenue Management Review

| Field | Value |
|---|---|
| **Workstream** | OFF — Offering and Pricing |
| **Workflow phases** | Decide/Plan → Sell/Acquire |
| **Primary phase** | Decide/Plan |
| **Activation** | conditional — Always weekly for hospitality; product: only on price-sensitivity flag or Demand Shock exception |
| **Purpose** | Make disciplined weekly pricing decisions that balance volume, margin, and channel health. |
| **Stage anchor** | MARKET-06 (initial pricing hypothesis via `lp-offer`); S10 (recurring pricing decisions) |
| **Cadence** | Weekly (hospitality always; product if price-sensitive or demand-shocked); daily micro-adjustments only if automated and governed |
| **Owner role** | Revenue Manager / Commercial Lead; approval: Founder/GM for large changes (>10% vs baseline) |
| **Inputs** | Competitor scan (CDI-3); inventory/capacity constraints (OPS-1); KPI pack (DATA-1) |
| **Outputs / artifacts** | Pricing Decision Log entry; updated price list/rate plan; channel rules |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/pricing-decisions.user.md` (decision log; operator-maintained) |
| **Entry criteria** | Refreshed metrics + competitor snapshot available |
| **Exit criteria** | Pricing updated and verified in channels; decision recorded with expected effect in DATA-4 |
| **Exception linkage** | Pricing changes are mandatory outputs of both Demand Shock and Cash Constraint exception states |
| **Profile / branch** | Hospitality: mandatory weekly revenue management (OCC/ADR/RevPAR/RevPAB). Product: mandatory when demand shock or price-sensitivity flag set |

### OFF-3 — Product / Listing Content and Merchandising Refresh

| Field | Value |
|---|---|
| **Workstream** | OFF — Offering and Pricing |
| **Workflow phases** | Build/Prepare |
| **Primary phase** | Build/Prepare |
| **Activation** | always |
| **Purpose** | Keep "what customers/guests see" accurate and conversion-optimised (PDPs, listings, photos, policies), starting with WEBSITE-01 first-build framework assembly and continuing through WEBSITE-02 recurring upgrades. For L1 Build 2 on visual-heavy physical-product catalogs, default to image-first merchandising with world-class exemplar evidence. |
| **Stage anchor** | WEBSITE-01 (one-time first-build framework), WEBSITE-02 (site-upgrade synthesis); recurring thereafter |
| **Cadence** | Weekly (top assets); monthly full audit |
| **Owner role** | Content/Brand Lead (product) or Distribution/Marketing Lead (hospitality) |
| **Inputs** | Insights (CDI-1/CDI-2); review themes (CX-2); pricing changes (OFF-2); catalog shape (SKU/variant count + image coverage baseline) |
| **Outputs / artifacts** | WEBSITE-01 framework packet (first build) plus DO handover fact-find trigger packet, or updated PDP/listing change log + QA checklist result (recurring). For L1 Build 2 image-first mode: exemplar shot-board + image-heavy launch contract attached to WEBSITE-02 brief. |
| **Artifact path** | WEBSITE-01: `docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md`; WEBSITE-02+: operator-maintained updates and site-upgrade artifacts under `docs/business-os/site-upgrades/<BIZ>/` |
| **Entry criteria** | Identified gap or conversion hypothesis; for WEBSITE-02 path, catalog size/variant count and baseline media coverage are known |
| **Exit criteria** | QA passed (DATA-1 tracking verification); for WEBSITE-01 path, handover sequence `/lp-do-fact-find --website-first-build-backlog` -> `/lp-do-plan` is completed before `/lp-do-build`; impact tracked as experiment when feasible (CDI-4). For L1 Build 2 image-first mode: WEBSITE-02 brief includes >=8 exemplar sites, >=24 shot-board references, and measurable homepage/PLP/PDP media acceptance criteria. |
| **Exception linkage** | Quality Incident exception can trigger immediate content correction (OPS-4 + CX-4 co-trigger) |
| **Profile / branch** | All profiles; hospitality must include OTA listing accuracy and cancellation policy updates. Visual-heavy physical-product profiles (bags/fashion/accessories/footwear/jewelry/beauty) default to image-first mode during L1 Build 2. |
| **Collision note** | OFF-3 owns both WEBSITE-01 first-build framework baseline and WEBSITE-02 recurring maintenance. It does not change runtime stage authority in `loop-spec.yaml`. |

### OFF-4 — Channel Policy and Conflict Management

| Field | Value |
|---|---|
| **Workstream** | OFF — Offering and Pricing |
| **Workflow phases** | Decide/Plan |
| **Primary phase** | Decide/Plan |
| **Activation** | conditional — Mandatory for wholesale_heavy / OTA_mix_high; monthly for all; weekly only on exception |
| **Purpose** | Prevent margin leakage and channel conflict by setting explicit rules for pricing, inventory allocation, promotions, and partner terms. |
| **Stage anchor** | SELL-01 (initial channel strategy via `lp-channels`); recurring thereafter |
| **Cadence** | Monthly review; weekly exceptions |
| **Owner role** | Founder/GM with Commercial Lead; scaling: Governance/RevOps |
| **Inputs** | Channel performance by margin and volume; partner terms; inventory/capacity risk (OPS-1) |
| **Outputs / artifacts** | Channel Policy document; allocation rules; escalation SOP |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/channel-policy.user.md` (operator-maintained) |
| **Entry criteria** | Channel mix and margin by channel known; initial channel strategy (CAP-04) complete |
| **Exit criteria** | Policy published; enforcement mechanism assigned (owner for exception approvals) |
| **Exception linkage** | Cash Constraint exception triggers freeze on discretionary channel spend; OFF-4 policy exceptions require FIN-1 sign-off |
| **Profile / branch** | Mandatory for `wholesale_heavy` and `OTA_mix_high` profiles; conditional for others |
| **CAP reference** | CAP-04 (Channel strategy) governs the initial channel plan; OFF-4 governs ongoing channel governance. These are complementary, not duplicates. |

---

## Workstream: Go-to-Market and Growth (GTM)

### GTM-1 — Weekly Demand Plan and Campaign Sprint

| Field | Value |
|---|---|
| **Workstream** | GTM — Go-to-Market and Growth |
| **Workflow phases** | Decide/Plan → Sell/Acquire |
| **Primary phase** | Decide/Plan |
| **Activation** | always |
| **Purpose** | Produce a weekly "demand sprint" plan linking actions to targets and capacity constraints. |
| **Stage anchor** | DO (`/lp-do-plan` inputs), S10 (recurring weekly demand planning) |
| **Cadence** | Weekly |
| **Owner role** | Growth Lead; approval: Founder/GM |
| **Inputs** | Weekly insights (CDI-1); pricing (OFF-2); capacity/inventory (OPS-1); OKRs/targets |
| **Outputs / artifacts** | Weekly Demand Sprint Plan; campaign calendar; tracking checklist |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/weekly-demand-plan.user.md` (operator-maintained; single overwritten file) |
| **Entry criteria** | Targets and constraints known; capacity signed off (OPS-1 gate) |
| **Exit criteria** | Plan published; tracking verified; approvals complete; stop conditions defined per campaign |
| **Exception linkage** | Demand Shock exception requires immediate GTM-1 replan with recovery hypothesis |
| **Profile / branch** | All profiles |

### GTM-2 — Distribution Channel Ops (Retail/Wholesale/OTAs)

| Field | Value |
|---|---|
| **Workstream** | GTM — Go-to-Market and Growth |
| **Workflow phases** | Sell/Acquire |
| **Primary phase** | Sell/Acquire |
| **Activation** | conditional — Mandatory for wholesale_heavy, OTA_mix_high, hospitality; daily cadence in high season |
| **Purpose** | Maintain healthy distribution execution: correct availability, pricing propagation, content consistency, and partner compliance. |
| **Stage anchor** | SELL-01 (initial channel setup via `lp-channels`); recurring post-launch |
| **Cadence** | Weekly; daily in high season or high volume |
| **Owner role** | Channel Manager / Partnerships Lead |
| **Inputs** | Channel policy (OFF-4); pricing (OFF-2); content updates (OFF-3); partner/platform dashboards |
| **Outputs / artifacts** | Channel Health Report; resolved issues log; escalations |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/channel-health-log.user.md` (operator-maintained) |
| **Entry criteria** | Price/rate change log available; channels active |
| **Exit criteria** | All channels verified; issues resolved or scheduled with owners |
| **Exception linkage** | Channel suppression or rate-parity breach can trigger Demand Shock exception (DATA-2 alert) |
| **Profile / branch** | Mandatory for `wholesale_heavy`, `OTA_mix_high`, hospitality. Conditional for `digital_only` if using marketplaces. |

### GTM-3 — Sales / Account Pipeline and Booking Deals

| Field | Value |
|---|---|
| **Workstream** | GTM — Go-to-Market and Growth |
| **Workflow phases** | Sell/Acquire |
| **Primary phase** | Sell/Acquire |
| **Activation** | conditional — Mandatory when wholesale_accounts > 0; activates at CAP-05 gate |
| **Purpose** | Create predictable revenue via managed pipelines (wholesale accounts, group bookings, corporate/long-stay deals). |
| **Stage anchor** | SELL-01→S10 recurring; activated when CAP-05 gate is met (see `sales-ops-schema.md`) |
| **Cadence** | Weekly; daily follow-up as needed |
| **Owner role** | Sales Lead / Account Manager |
| **Inputs** | Lead list; pipeline stages; standard terms; capacity constraints (OPS-1); channel policy (OFF-4) |
| **Outputs / artifacts** | Updated pipeline; forecast; next-step task list; deal approvals |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/sales-ops.user.md` — schema defined in `sales-ops-schema.md` |
| **Entry criteria** | Pipeline is current and staged; capacity confirmed (OPS-1) |
| **Exit criteria** | Each deal has next step with owner/date; approvals recorded for discounts/terms above threshold |
| **Exception linkage** | Pipeline decline feeds Demand Shock exception; pricing override requests feed Cash Constraint exception |
| **Profile / branch** | Mandatory for `wholesale_accounts>0`; conditional for group bookings / corporate hospitality |
| **CAP reference** | CAP-05 (Sales ops) — full schema in `sales-ops-schema.md`. GTM-3 is the primary recurring process vehicle for CAP-05. |

### GTM-4 — Conversion and Lifecycle Automation

| Field | Value |
|---|---|
| **Workstream** | GTM — Go-to-Market and Growth |
| **Workflow phases** | Sell/Acquire → Measure/Learn |
| **Primary phase** | Sell/Acquire |
| **Activation** | conditional — Post-launch only; activates at CAP-06 gate when first transaction data available |
| **Purpose** | Systematically improve conversion and repeat behaviour using messaging, follow-ups, and lifecycle journeys. |
| **Stage anchor** | DO→S10 recurring; activated when CAP-06 gate is met (see `retention-schema.md`) |
| **Cadence** | Weekly optimisation; monthly flow audit |
| **Owner role** | Growth Ops / CRM Manager |
| **Inputs** | Funnel analytics; email/SMS performance; abandoned cart/enquiry lists; guest pre-arrival messages |
| **Outputs / artifacts** | Updated lifecycle flows; experiment results; message templates |
| **Artifact path** | Referenced in `docs/business-os/strategy/<BIZ>/retention.user.md` — schema in `retention-schema.md` |
| **Entry criteria** | Baseline funnel metrics known; first non-zero transaction data available |
| **Exit criteria** | Change deployed with tracking; results reviewed in next S10; guardrail metrics checked |
| **Exception linkage** | Automation-caused complaint spikes trigger Quality Incident exception |
| **Profile / branch** | All post-launch; hospitality: pre-arrival comms are critical for review-score management |
| **CAP reference** | CAP-06 (Lifecycle and retention) — full schema in `retention-schema.md`. GTM-4 handles the automation arm; CX-3 handles the relational/loyalty arm. |

---

## Workstream: Operations and Tooling (OPS)

### OPS-1 — Capacity and Inventory Planning

| Field | Value |
|---|---|
| **Workstream** | OPS — Operations and Tooling |
| **Workflow phases** | Decide/Plan → Deliver/Support |
| **Primary phase** | Decide/Plan |
| **Activation** | conditional — Mandatory for inventory_present and hospitality; optional for pure digital-only |
| **Purpose** | Ensure what you plan to sell can be delivered profitably (inventory availability, staffing, turnover capacity). |
| **Stage anchor** | DO (`/lp-do-plan` inputs); S10 (weekly capacity review) |
| **Cadence** | Weekly; daily adjustments during peaks |
| **Owner role** | Ops Lead; finance partner for constraints |
| **Inputs** | Demand plan (GTM-1); bookings/orders forecast; current inventory or room/bed availability; maintenance constraints (OPS-4) |
| **Outputs / artifacts** | Capacity Plan; Inventory Plan (if applicable); constraint list; approved sell plan |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/capacity-plan.user.md` (operator-maintained) |
| **Entry criteria** | Latest inventory/availability and forecast available (DATA-1) |
| **Exit criteria** | Capacity signed off; exceptions logged and mitigations assigned; GTM-1 sell plan approved |
| **Exception linkage** | Stockout risk triggers DATA-2 alert; severe capacity constraint triggers Demand Shock exception |
| **Profile / branch** | Mandatory for `inventory_present` (product) and hospitality. Optional/deferred for pure `digital_only` businesses with no fulfilment constraints. |

### OPS-2 — Fulfilment or Stay Delivery Execution

| Field | Value |
|---|---|
| **Workstream** | OPS — Operations and Tooling |
| **Workflow phases** | Deliver/Support |
| **Primary phase** | Deliver/Support |
| **Activation** | conditional — Activates post-DO launch; mandatory for inventory_present / hospitality |
| **Purpose** | Execute the promised delivery reliably: ship orders or deliver stays (check-in/out, housekeeping, issue resolution). |
| **Stage anchor** | Post-DO launch activation; daily recurring thereafter |
| **Cadence** | Daily |
| **Owner role** | Fulfilment Lead (product) or Front Office/Property Ops Lead (hospitality) |
| **Inputs** | Orders or arrivals/departures list; SOPs (CX-4); staffing plan; maintenance status (OPS-4) |
| **Outputs / artifacts** | Daily Ops Report; exception log; completed checklists |
| **Artifact path** | Operator-maintained ops log; exceptions escalated to CX-1 |
| **Entry criteria** | Run plan and staffing confirmed; capacity approved (OPS-1) |
| **Exit criteria** | Completion confirmed; exceptions logged with owners and routed to CX-1 |
| **Exception linkage** | Exception log is a primary trigger source for Quality Incident exception and DATA-2 alerts |
| **Profile / branch** | Mandatory for `inventory_present` and hospitality. For pure `digital_only`: activates if digital delivery operations are required (service delivery, access fulfilment). |
| **Pre-PMF note** | This process activates post-launch. Pre-launch: capacity and delivery SOPs should be designed during DO (`/lp-do-plan` and `/lp-do-build`) but not yet executed. |

### OPS-3 — Returns, Refunds, Cancellations and Chargebacks

| Field | Value |
|---|---|
| **Workstream** | OPS — Operations and Tooling |
| **Workflow phases** | Deliver/Support → Measure/Learn |
| **Primary phase** | Deliver/Support |
| **Activation** | conditional — Activates after first transactions; mandatory for returns_enabled / hospitality |
| **Purpose** | Manage reverse flows and cancellations in a controlled way that protects cash, compliance, and reputation. |
| **Stage anchor** | Post-DO launch; activates after first transactions |
| **Cadence** | Daily processing; weekly review |
| **Owner role** | CX Lead + Finance Ops; approval thresholds by amount |
| **Inputs** | Return/refund requests; cancellation reasons; payment processor disputes; policy documents (OFF-3) |
| **Outputs / artifacts** | Refund log; return authorisations; cancellation/chargeback tracker; reason-code report |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/refund-log.user.md` (operator-maintained) |
| **Entry criteria** | Request recorded with required fields; policy document available (OFF-3) |
| **Exit criteria** | Financial entries match; reason code captured; customer/guest notified |
| **Exception linkage** | High refund/chargeback volume triggers Cash Constraint exception (FIN-1 runway impact); fraud signals escalate to Compliance/Safety Incident exception |
| **Profile / branch** | Mandatory for `returns_enabled` (product) and hospitality. Conditional for digital-only (depends on refund policy). |

### OPS-4 — Quality Assurance and Maintenance Management

| Field | Value |
|---|---|
| **Workstream** | OPS — Operations and Tooling |
| **Workflow phases** | Build/Prepare → Deliver/Support |
| **Primary phase** | Deliver/Support |
| **Activation** | conditional — Mandatory for inventory_present / hospitality; safety-critical issues trigger Compliance/Safety Incident exception |
| **Purpose** | Prevent quality incidents via scheduled maintenance, inspections, and corrective actions. |
| **Stage anchor** | S9B (pre-launch QA gate via `lp-launch-qa`); recurring operational QA thereafter |
| **Cadence** | Weekly schedule + daily urgent triage; monthly deep inspection |
| **Owner role** | Ops Lead; specialist: Maintenance Engineer (hospitality) or QA Lead (product) |
| **Inputs** | Maintenance requests; inspection checklists; incident reports (DATA-3); safety register |
| **Outputs / artifacts** | Maintenance log; inspection records; safety register updates; corrective action list |
| **Artifact path** | Operator-maintained maintenance log; safety-critical items escalated to FIN-3 risk register |
| **Entry criteria** | Issue logged with severity and impact |
| **Exit criteria** | Fix verified; preventive action documented; SOP updated (CX-4) |
| **Exception linkage** | Safety-critical OPS-4 issues trigger immediate Compliance/Safety Incident exception; rating spike triggers Quality Incident exception |
| **Profile / branch** | Mandatory for `inventory_present` and hospitality. Distinct from S9B pre-launch gate — OPS-4 is the ongoing operational QA cycle. |
| **Collision note** | S9B (lp-launch-qa/lp-design-qa) is the one-time pre-launch gate. OPS-4 is the recurring operational process. These are complementary. |

---

## Workstream: Customer Experience and Retention (CX)

### CX-1 — Support Triage and Service Recovery

| Field | Value |
|---|---|
| **Workstream** | CX — Customer Experience and Retention |
| **Workflow phases** | Deliver/Support → Measure/Learn |
| **Primary phase** | Deliver/Support |
| **Activation** | always |
| **Purpose** | Resolve issues quickly and consistently; prevent reputational damage through a defined service recovery pathway. |
| **Stage anchor** | Post-DO launch; activates from first customer contact |
| **Cadence** | Daily triage; weekly synthesis |
| **Owner role** | CX Lead; escalation: Ops Lead or Founder/GM |
| **Inputs** | Support tickets; escalation rules; SOPs (CX-4); refund/cancellation policy (OFF-3) |
| **Outputs / artifacts** | CX Triage Board; service recovery log; weekly top-issues report |
| **Artifact path** | Operator-maintained helpdesk / support log |
| **Entry criteria** | Ticket logged with required info (issue type, customer/guest, severity) |
| **Exit criteria** | Resolution confirmed; follow-up sent; reason code captured; root cause fed to CDI-1 and OPS-4 |
| **Exception linkage** | CX-1 is a mandatory required process for Quality Incident exception; high complaint rates feed DATA-2 alert |
| **Profile / branch** | All profiles; hospitality: response time is platform-critical (Airbnb ≥90% response rate standard) |

### CX-2 — Reviews and Reputation Management

| Field | Value |
|---|---|
| **Workstream** | CX — Customer Experience and Retention |
| **Workflow phases** | Deliver/Support → Measure/Learn |
| **Primary phase** | Measure/Learn |
| **Activation** | conditional — Mandatory for hospitality / OTA_mix_high; activates from first review received |
| **Purpose** | Protect and improve public reputation via systematic review responses and root-cause prevention. |
| **Stage anchor** | S10 recurring; activates from first review |
| **Cadence** | Daily monitoring (hospitality); weekly batches (product) |
| **Owner role** | CX Lead with Marketing; approvals for sensitive cases |
| **Inputs** | New reviews; review performance thresholds (DATA-2); top complaint themes (CX-1) |
| **Outputs / artifacts** | Review Response Log; themed review dashboard; corrective action list |
| **Artifact path** | Operator-maintained review log; themes fed to CDI-1 insight log |
| **Entry criteria** | New reviews captured and themed |
| **Exit criteria** | Responses posted (where applicable); corrective actions assigned |
| **Exception linkage** | Rating drop below platform threshold (e.g., Airbnb Superhost 4.8) triggers Quality Incident exception (DATA-2 alert) |
| **Profile / branch** | Mandatory for hospitality and `OTA_mix_high`. Important for product on marketplaces. |

### CX-3 — Retention and Loyalty Loops

| Field | Value |
|---|---|
| **Workstream** | CX — Customer Experience and Retention |
| **Workflow phases** | Sell/Acquire → Measure/Learn |
| **Primary phase** | Sell/Acquire |
| **Activation** | conditional — PMF+ only; activates at CAP-06 gate; OFF-4 channel conflict compliance required |
| **Purpose** | Increase repeat purchases/bookings and referrals through structured post-delivery journeys and loyalty benefits. |
| **Stage anchor** | S10 recurring; activated at first non-zero retention metric (CAP-06 gate) |
| **Cadence** | Weekly optimisation; monthly cohort review |
| **Owner role** | Growth Ops + CX Lead |
| **Inputs** | Customer list; stay/purchase history; segmentation rules; post-delivery survey results; data from GTM-4 automation |
| **Outputs / artifacts** | Retention journey map; automated flows; referral/loyalty offer sheet |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/retention.user.md` — schema defined in `retention-schema.md` |
| **Entry criteria** | Segment definitions and baseline retention known; first non-zero repeat signal exists |
| **Exit criteria** | Flows live and measured; next iteration planned; compliance with channel policy (OFF-4) confirmed |
| **Exception linkage** | Churn spike feeds DATA-2 alert; repeat-rate collapse feeds Demand Shock exception |
| **Profile / branch** | PMF+ only. Channel conflict risk for wholesale/OTA — retention offers must comply with OFF-4 policy. |
| **CAP reference** | CAP-06 (Lifecycle and retention) — CX-3 is the relational/loyalty arm; GTM-4 is the automation arm. Both governed by `retention-schema.md`. |

### CX-4 — SOP and Training Updates

| Field | Value |
|---|---|
| **Workstream** | CX — Customer Experience and Retention |
| **Workflow phases** | Build/Prepare |
| **Primary phase** | Build/Prepare |
| **Activation** | always |
| **Purpose** | Keep operational standards current and reduce variation/defects by updating SOPs and training as products/offers change. |
| **Stage anchor** | DO (`/lp-do-build`, initial SOP creation); recurring thereafter |
| **Cadence** | Weekly updates as needed; monthly SOP audit |
| **Owner role** | Ops Lead + CX Lead; at scaling: Process Owner per SOP |
| **Inputs** | Process change log (OFF-1/OFF-3); incident learnings (DATA-3); quality failures (OPS-4) |
| **Outputs / artifacts** | SOP library (current version); training log; audit sampling results |
| **Artifact path** | Operator-maintained SOP wiki/knowledge base |
| **Entry criteria** | Change request with rationale (offer change, incident finding, or quality gap) |
| **Exit criteria** | SOP published with version and effective date; training completed; adherence check scheduled |
| **Exception linkage** | CX-4 SOP updates are a required output of Quality Incident exception resolution; also required after Compliance/Safety Incident closure |
| **Profile / branch** | All profiles; scales with team size |

---

## Workstream: Finance and Sustainability (FIN)

### FIN-1 — Weekly Cash and Unit Economics Review

| Field | Value |
|---|---|
| **Workstream** | FIN — Finance and Sustainability |
| **Workflow phases** | Sense → Decide/Plan |
| **Primary phase** | Sense |
| **Activation** | always |
| **Purpose** | Protect runway and ensure growth actions are compatible with sustainable unit economics. |
| **Stage anchor** | S3 (initial unit economics via `lp-forecast`); S10 (recurring weekly review) |
| **Cadence** | Weekly |
| **Owner role** | Finance Owner (or Founder/GM); inputs from Ops and Growth |
| **Inputs** | Bank balances; receivables/payables; payout forecasts; margin by channel; returns/refunds (OPS-3); reconciliation pack (FIN-2) |
| **Outputs / artifacts** | Weekly Cash Sheet; Unit Economics Snapshot; spend guardrails |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/cash-sheet.user.md` (operator-maintained 8–13 week rolling forecast) |
| **Entry criteria** | Reconciled financials (FIN-2 output) available |
| **Exit criteria** | Guardrails published; at-risk items assigned owners; runway status logged in DATA-4 |
| **Exception linkage** | Runway below threshold triggers Cash Constraint exception. FIN-1 is the primary detection and response process for Cash Constraint. |
| **Profile / branch** | All profiles; hospitality must include RevPAR/net RevPAR (after commission) in unit economics |

### FIN-2 — Billing, Payouts and Reconciliation

| Field | Value |
|---|---|
| **Workstream** | FIN — Finance and Sustainability |
| **Workflow phases** | Measure/Learn |
| **Primary phase** | Measure/Learn |
| **Activation** | conditional — Activates after first transactions; mandatory for wholesale_heavy / hospitality / any payment processor |
| **Purpose** | Ensure revenue recognition inputs, payouts, and cash movements match source systems; detect anomalies early. |
| **Stage anchor** | Post-DO launch; activates after first transactions |
| **Cadence** | Weekly (daily in high volume) |
| **Owner role** | Finance Ops |
| **Inputs** | Bank statement; payment processor exports; OTA payouts; wholesale invoices; refunds list (OPS-3) |
| **Outputs / artifacts** | Weekly Reconciliation Pack; variance log; AR follow-up list |
| **Artifact path** | Operator-maintained reconciliation spreadsheet |
| **Entry criteria** | All exports accessible (bank, payment processor, OTA payout) |
| **Exit criteria** | Variances explained or escalated; pack shared with FIN-1 review; anomalies assigned to DATA-2 alerting |
| **Exception linkage** | Payout variance or unexplained anomaly above threshold feeds Cash Constraint exception trigger (FIN-1 → DATA-2) |
| **Profile / branch** | All profiles; mandatory for `wholesale_heavy`, hospitality with OTA mix, and any business with payment processor |

### FIN-3 — Risk Register, Compliance, and Incident Readiness

| Field | Value |
|---|---|
| **Workstream** | FIN — Finance and Sustainability |
| **Workflow phases** | Sense → Weekly Review |
| **Primary phase** | Sense |
| **Activation** | always |
| **Purpose** | Maintain a living risk register and baseline compliance controls (data protection, safety plans, incident response). |
| **Stage anchor** | ASSESSMENT (initial compliance readiness check); recurring throughout |
| **Cadence** | Weekly light review; monthly deep review |
| **Owner role** | Founder/GM or Risk/Compliance Owner; Data Protection liaison; Safety Responsible Person (hospitality) |
| **Inputs** | Risk register; incident logs (DATA-3); policy requirements; vendor contracts; staff training records |
| **Outputs / artifacts** | Updated risk register; compliance checklist; incident playbooks; training log |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/risk-register.user.md` (operator-maintained) |
| **Entry criteria** | Risk owners assigned; compliance baseline established |
| **Exit criteria** | Top risks have current mitigation status; compliance checks passed or remediation scheduled in DATA-4 |
| **Exception linkage** | FIN-3 is the anchor process for Compliance/Safety Incident exception state. See `exception-runbooks-v1.md` for full runbook. Weekly light audit and monthly deep audit checklists: see `audit-cadence-contract-v1.md`. |
| **Profile / branch** | All profiles; hospitality has heightened FIN-3 obligations (GDPR, safety planning, fire/emergency drills) |
| **Collision note** | `bottleneck-diagnosis-schema.md` defines `compliance` as a blocked-stage reason code. FIN-3 is the operational process that resolves such blocks; it does not modify the constraint key taxonomy. |

### FIN-4 — Vendor and Procurement Management

| Field | Value |
|---|---|
| **Workstream** | FIN — Finance and Sustainability |
| **Workflow phases** | Decide/Plan |
| **Primary phase** | Decide/Plan |
| **Activation** | conditional — Mandatory for hospitality / inventory_present; monthly review; weekly only on exception; activates post-S5B |
| **Purpose** | Stabilise supply and service quality via clear vendor selection, SLAs, and cost control. |
| **Stage anchor** | Post-S5B ongoing; activates when vendors are in use |
| **Cadence** | Monthly review; weekly exceptions |
| **Owner role** | Ops Lead + Finance Owner |
| **Inputs** | Vendor list; contracts; performance issues; cost trends; risk register (FIN-3) |
| **Outputs / artifacts** | Vendor scorecard; contract change log; dual-source plan for critical items |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/vendor-scorecard.user.md` (operator-maintained) |
| **Entry criteria** | Vendor performance data available; contracts on file |
| **Exit criteria** | Actions assigned; contracts updated; risk impacts documented in FIN-3 |
| **Exception linkage** | Critical vendor failure triggers Compliance/Safety Incident exception (if safety-critical service) or Demand Shock (if supply disruption) |
| **Profile / branch** | Mandatory for hospitality (cleaning, maintenance vendors); `inventory_present` (suppliers, 3PL); scaling stage for all. |

---

## Workstream: Data Capture and Continuous Improvement (DATA)

### DATA-1 — KPI Refresh and Data Integrity Checks

| Field | Value |
|---|---|
| **Workstream** | DATA — Data Capture and Continuous Improvement |
| **Workflow phases** | Sense |
| **Primary phase** | Sense |
| **Activation** | always |
| **Purpose** | Produce a trusted weekly KPI pack, with integrity checks so decisions are based on reliable data. |
| **Stage anchor** | MEASURE-01/MEASURE-02 (initial agent-capability setup); S3 (KPI modeling); S10 (weekly refresh) |
| **Cadence** | Weekly KPI pack + daily key metrics for ops |
| **Owner role** | Data Owner / Ops Analyst; in small teams: Founder/GM |
| **Inputs** | Source exports (shop/CRM/OTA/PMS/channel manager); financial reconciliation pack (FIN-2); metric dictionary |
| **Outputs / artifacts** | Weekly KPI Pack; anomaly log; data confidence note |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/kpi-pack.user.md` (operator-maintained) |
| **Entry criteria** | Source exports accessible |
| **Exit criteria** | Dashboard published; anomalies assigned owners; data confidence level stated |
| **Exception linkage** | Anomalies above threshold trigger DATA-2 alerting; data integrity failure blocks decision-grade decisions in S10 |
| **Profile / branch** | All profiles and stages |
| **CAP reference** | CAP-07 (Measurement and inference) — initial agent-capability setup is owned by MEASURE-01/MEASURE-02 prompt handoff. DATA-1 is the recurring weekly data quality process that sustains CAP-07. These are complementary; DATA-1 does not replace the CAP-07 setup gate. |

### DATA-2 — Leading Indicator Monitoring and Alerting

| Field | Value |
|---|---|
| **Workstream** | DATA — Data Capture and Continuous Improvement |
| **Workflow phases** | Sense |
| **Primary phase** | Sense |
| **Activation** | always |
| **Purpose** | Detect demand, cash, quality, or compliance problems early and trigger exception states. |
| **Stage anchor** | S10 recurring; always-on between stages |
| **Cadence** | Daily monitoring; weekly summary |
| **Owner role** | Data Owner + Ops Lead |
| **Inputs** | KPI dashboard (DATA-1); alert thresholds; exception definitions |
| **Outputs / artifacts** | Alert log; exception tickets; weekly alert summary |
| **Artifact path** | Alert log in operator's task/issue tracker; linked to DATA-4 decision log |
| **Entry criteria** | Thresholds defined and reviewed (monthly threshold calibration) |
| **Exit criteria** | Each alert has an owner, acknowledgement SLA, and resolution plan; outcomes reviewed in DATA-4 |
| **Exception linkage** | DATA-2 is the primary trigger mechanism for all four exception states: Demand Shock, Cash Constraint, Quality Incident, Compliance/Safety Incident. See `exception-runbooks-v1.md` for trigger thresholds and SLAs. |
| **Profile / branch** | All profiles |
| **Collision note** | `bottleneck-diagnosis-schema.md` defines blocked-stage constraint keys (e.g., `S4/stage_blocked/deps_blocked`). DATA-2 manages alert thresholds and exception tickets for operational signals. These are distinct: bottleneck diagnosis is metric-driven stage diagnosis; DATA-2 is operational exception management. |

### DATA-3 — Incident Post-Mortems and Corrective Actions

| Field | Value |
|---|---|
| **Workstream** | DATA — Data Capture and Continuous Improvement |
| **Workflow phases** | Measure/Learn |
| **Primary phase** | Measure/Learn |
| **Activation** | exception_only — Triggered by exception state resolution or DATA-2 alert at severity >= threshold; required for Quality Incident / Compliance/Safety Incident / material Cash Constraint |
| **Purpose** | Turn incidents into corrective and preventive actions (CAPA) that permanently improve processes and standards. |
| **Stage anchor** | Triggered by exception state resolution or critical DATA-2 alert |
| **Cadence** | As-needed (triggered); completed within exception SLA |
| **Owner role** | Ops Lead; facilitator: Data Owner; approver: Founder/GM |
| **Inputs** | Incident record; logs; customer/guest impact; timeline; root-cause analysis |
| **Outputs / artifacts** | Post-mortem doc; CAPA list; updated SOP/control changes |
| **Artifact path** | `docs/business-os/strategy/<BIZ>/post-mortems/YYYY-MM-DD-<incident-id>.md` |
| **Entry criteria** | Incident severity ≥ threshold (DATA-2 classification) |
| **Exit criteria** | CAPA assigned with deadlines; verification plan created; SOPs updated (CX-4); controls updated (FIN-3) |
| **Exception linkage** | DATA-3 is a required closure output for Quality Incident, Compliance/Safety Incident, and material Cash Constraint exceptions. See `exception-runbooks-v1.md`. |
| **Profile / branch** | All profiles (PMF+); triggered on severity ≥ threshold |

### DATA-4 — Weekly Review Facilitation and Decision Log

| Field | Value |
|---|---|
| **Workstream** | DATA — Data Capture and Continuous Improvement |
| **Workflow phases** | Weekly Review |
| **Primary phase** | Weekly Review |
| **Activation** | always |
| **Purpose** | Close the weekly operating cycle: inspect performance, decide adaptations, create traceable decisions and improvement items. |
| **Stage anchor** | S10 (primary process anchor for weekly readout) |
| **Cadence** | Weekly (60–90 minutes) |
| **Owner role** | Founder/GM (chair) + facilitator (Ops/Data) |
| **Inputs** | KPI Pack (DATA-1); delivery report (OPS-2); risk register highlights (FIN-3); experiment readouts (CDI-4); reconciliation pack (FIN-2) |
| **Outputs / artifacts** | Weekly Review Notes; Decision Log; updated plan for next week; improvement backlog updates |
| **Artifact path** | Governed by `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` — authoritative S10 contract |
| **Briefing contract** | Consolidated briefing outputs MUST satisfy `docs/business-os/startup-loop/briefing-contract-schema-v1.md`; lint enforcement responsibility is defined in `artifact-registry.md` |
| **Entry criteria** | Required inputs published ≥24 hours before meeting |
| **Exit criteria** | Decisions logged with owners; next-week plan drafted; backlog updated |
| **Exception linkage** | All exception outcomes are recorded in the DATA-4 decision log |
| **Profile / branch** | All profiles |
| **Authority note** | **DATA-4 is FULLY COVERED by the existing S10 weekly-kpcs-decision-prompt.md contract.** This entry is reference-only. Do not create a competing weekly-review contract. Any additions must extend S10 scope exclusively. |

---

## Orchestration Branching Summary

### Minimum Viable Weekly Loop (Solo Founder / 2–3 People)

Required: CDI-1, CDI-4, OFF-1, OFF-2, GTM-1, FIN-1, DATA-1, DATA-4
Optional/deferred: CDI-2 (monthly), CDI-3 (biweekly), OFF-3 (monthly), OPS-1 (if fulfilment), CX-1 (if live), FIN-3 (light monthly check)
Exception triggers: Demand Shock, Cash Constraint, Quality Incident (limit to top 3 pre-PMF)

### Scaled Weekly Loop (10–20 People, PMF+)

All processes active. Cadences as specified per process. Monthly deep audit mandatory. Weekly exceptions council for DATA-2 triggered exceptions.

### Exception State Process Requirements

| Exception State | Required Processes | Trigger (DATA-2 signal) |
|---|---|---|
| Demand Shock | OFF-2, CDI-3, GTM-1 | Leading indicators (traffic, enquiries, pickup) fall below threshold |
| Cash Constraint | FIN-1, FIN-2, OFF-4 | Runway below threshold OR payout variance spike |
| Quality Incident | CX-1, OPS-4, DATA-3, CX-4 | Rating/complaint spike OR OTIF below target |
| Compliance/Safety Incident | FIN-3, DATA-3 | Compliance trigger OR safety incident OR data breach signal |

*Full runbooks including trigger thresholds, owner SLAs, and closure criteria: `docs/business-os/startup-loop/exception-runbooks-v1.md`*

---

## VC-04 Validation Evidence

**VC-04-A — Structural consistency:** Every process entry in this registry includes `Workstream`, `Workflow phases`, `Primary phase`, and `Activation` rows. All values match the corresponding rows in `process-assignment-v2.yaml`. 28/28 process entries verified. ✓

**VC-04-B — Authority clarity:** Registry header states stage ordering authority remains `loop-spec.yaml` (see §1). S10 DATA-4 non-duplication rule is preserved — DATA-4 entry is reference-only and defers to `weekly-kpcs-decision-prompt.md`. Consolidated briefing integrity is delegated to `briefing-contract-schema-v1.md` and is not duplicated as a second S10 prompt contract. ✓

**VC-04-C — Migration safety:** `process-registry-v1.md` is tombstoned with an archived banner pointing to this file. No conflicting process definitions exist between v1 (archived) and v2 (authoritative). ✓

**Stage-operator-dictionary.yaml (Option B):** TASK-09 SPIKE confirmed label rename scope = ZERO. No `label_operator_short` or `label_operator_long` fields contain deprecated workstream terminology. No label field changes needed. TASK-09 stability tests pass GREEN (87/87 assertions). ✓
