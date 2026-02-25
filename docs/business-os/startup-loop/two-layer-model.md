---
Type: Architecture-Contract
Status: Active
Feature-Slug: startup-loop-standing-info-gap-analysis
Created: 2026-02-22
Last-updated: 2026-02-22
Owner: startup-loop maintainers
Related-plan: docs/plans/startup-loop-standing-info-gap-analysis/plan.md
Related-spec: docs/business-os/startup-loop/loop-spec.yaml
Decision-anchor: docs/plans/startup-loop-standing-info-gap-analysis/proposed-target-model.md
---

# Startup Loop — Two-Layer Architecture Contract

This document is the canonical contract for the two-layer startup loop operating model. All skill files, prompt templates, loop-spec.yaml additions, and artifact schemas produced by the `startup-loop-standing-info-gap-analysis` implementation plan MUST align to the semantics defined here. Where this document conflicts with prior loop-spec.yaml preamble comments, this document is authoritative for semantic intent; loop-spec.yaml remains authoritative for runtime stage topology.

---

## Layer A — Standing Intelligence

### Purpose

Layer A is the standing information system for a business. It accumulates, refreshes, and exposes domain-specific intelligence that persists across individual implementation cycles. Standing intelligence is not produced once and forgotten; it is a living set of artifacts that degrade in confidence over time and are refreshed on a defined schedule tied to the stage lifecycle.

The four named domain containers (MARKET, SELL, PRODUCTS, LOGISTICS) are the canonical backbone of Layer A, but they do not define its ceiling. Any artifact that functions as standing intelligence — competitor snapshots, pricing assumptions, ops runbooks, regulatory constraints, SEO inventories, metrics baselines, and more — is equally part of Layer A and is subject to the same monitoring, change-detection, and trigger logic as the named aggregate packs. See **Monitoring Scope** below.

### Domains

Layer A is partitioned into four domains. Each domain maps to a container ID in the stage graph (`loop-spec.yaml` `stages:` section) and owns a family of stages that build and maintain standing artifacts for that domain.

| Domain | Container ID | Stage Family | Conditional | Stage Count |
|---|---|---|---|---|
| Competitor and market intelligence | MARKET | MARKET-01..11 | false | 11 (01..06 existing; 07..11 new per TASK-03) |
| Channel and GTM standing | SELL | SELL-01..08 | false | 8 (01 existing; 02..07 new; 08 renamed gate per TASK-03) |
| Product portfolio standing | PRODUCTS | PRODUCTS-01..07 | false | 7 (new per TASK-02) |
| Logistics and supply chain standing | LOGISTICS | LOGISTICS-01..07 | true | 7 (new conditional per TASK-02) |

**LOGISTICS conditionality.** LOGISTICS stages are gated by business profile. The condition expression is:

```yaml
conditional: true
condition: "business_profile includes logistics-heavy OR physical-product"
```

Businesses without `physical-product` or `logistics-heavy` profile flags skip the LOGISTICS container entirely. Consumers of LOGISTICS artifacts (e.g. S4 optional inputs) must treat LOGISTICS outputs as optional to remain profile-agnostic.

### Stage Families

#### MARKET (MARKET-01..11)

MARKET stages build and maintain competitive and market intelligence culminating in the offer contract.

- MARKET-01..05: intelligence stack (competitor mapping, demand evidence, pricing benchmarks, channel landscape, assumptions/risk register). Existing stages; semantics and IDs preserved.
- MARKET-06: Offer design (`/lp-offer`). Existing stage; semantics and ID preserved.
- MARKET-07: Post-offer synthesis. Integrates offer contract back into market intelligence; updates assumptions.
- MARKET-08: Demand evidence pack assembly. Compiles Demand Evidence Pack (DEP) artifact from MARKET-01..07 signals.
- MARKET-09: ICP refinement. Narrows Ideal Customer Profile (ICP) based on offer feedback and observed demand signals.
- MARKET-10: Market aggregate pack (draft). Assembles `market-pack.user.md` standing artifact.
- MARKET-11: Market aggregate pack (validated). Pack sign-off; consumes DEP and ICP refinement outputs.

MARKET-01..06 IDs and assignments are frozen. MARKET-07..11 are appended; no existing ID renumbering occurs.

#### SELL (SELL-01..08)

SELL stages build and maintain channel strategy and go-to-market standing.

- SELL-01: Channel strategy + GTM. Existing stage; semantics and ID preserved.
- SELL-02: Channel performance baseline. Baseline CAC and CVR by channel; first data pass.
- SELL-03: Outreach and content standing. Outreach sequence performance; content asset inventory.
- SELL-04: SEO standing. Keyword rank tracking; content gap snapshot.
- SELL-05: Paid channel standing. Paid CAC trends; ROAS baseline by channel.
- SELL-06: Partnership and referral standing. Affiliate and referral pipeline snapshot.
- SELL-07: Sell aggregate pack. Assembles `sell-pack.user.md` standing artifact.
- SELL-08: Activation readiness gate. Renamed from current SELL-02. All skill, prompt_template, and condition assignments (`condition: "paid_spend_requested"`) from the current SELL-02 are preserved verbatim under the SELL-08 ID.

Current SELL-02 becomes SELL-08. SELL-02..07 are new substantive stages inserted before the activation gate.

#### PRODUCTS (PRODUCTS-01..07)

PRODUCTS is a standing intelligence domain for the product portfolio. It is distinct from the existing PRODUCT container (PRODUCT-01 product-from-photo; PRODUCT-02 adjacent product research). PRODUCT handles one-time product-definition artifacts; PRODUCTS handles recurring product line management and intelligence.

- PRODUCTS-01: Product line mapping. Current SKU inventory and positioning map.
- PRODUCTS-02: Competitor product scan. Adjacent SKUs and pricing benchmarks.
- PRODUCTS-03: Product performance baseline. Sell-through rates and margin by SKU.
- PRODUCTS-04: Bundle and packaging hypotheses. Standing bundle options.
- PRODUCTS-05: Product-market fit signals. Reviews, return rates, and demand signals.
- PRODUCTS-06: Product roadmap snapshot. Next 90-day product decisions.
- PRODUCTS-07: Aggregate product pack. Assembles `product-pack.user.md`; consumed optionally at S4.

#### LOGISTICS (LOGISTICS-01..07, conditional)

LOGISTICS stages are conditional on business profile as specified above. All consumers of LOGISTICS outputs must handle the absent case without failing.

- LOGISTICS-01: Supplier and manufacturer mapping. Supplier list, MOQ, lead times.
- LOGISTICS-02: Lead time and MOQ baseline. Consolidated constraints per SKU.
- LOGISTICS-03: Fulfillment channel options. 3PL, self-fulfillment, dropship comparison.
- LOGISTICS-04: Cost and margin by route. Fulfillment cost stack per channel.
- LOGISTICS-05: Returns and quality baseline. Return rates and quality failure modes.
- LOGISTICS-06: Inventory policy snapshot. Reorder points and safety stock assumptions.
- LOGISTICS-07: Aggregate logistics pack. Assembles `logistics-pack.user.md`; conditional at S4 optional.

### Monitoring Scope

**The monitoring scope for standing intelligence is open-ended and inclusive by default.** Aggregate packs are the canonical summary artifacts, but monitoring must reach the underlying artifacts they summarise — and any artifact not captured by a named domain pack that still meets the qualification criteria.

#### Qualification criteria

An artifact qualifies as standing intelligence and must be registered for change monitoring if it meets all three:

1. **Persistent** — survives across multiple implementation cycles; not discarded after a single build.
2. **Influential** — holds assumptions, baselines, or observations that would meaningfully affect a future fact-find, plan, or build decision if changed.
3. **Signal-bearing** — a meaningful update to it is a plausible trigger for a new Layer B cycle or a standing-domain refresh.

#### Example artifact categories (non-exhaustive)

| Category | Example artifacts |
|---|---|
| Competitive intelligence | Competitor snapshots, feature comparison matrices, pricing benchmark sheets |
| Product standing | Product specifications, SKU catalogue, bundle hypotheses, roadmap snapshots |
| Pricing assumptions | Pricing policy docs, margin stack models, price-corridor artifacts |
| Positioning and messaging | Brand strategy docs, offer artifacts, positioning notes, messaging frameworks |
| Regulatory and legal | Compliance notes, regulatory constraint docs, jurisdictional requirements |
| Operations | Ops runbooks, fulfillment SLAs, supplier lead-time tables, returns policy |
| Key metrics baselines | Conversion baselines, CAC/AOV actuals, retention cohorts, engagement benchmarks |
| SEO and content inventory | Keyword inventories, content gap snapshots, rank tracking baselines, content calendars |
| Audience intelligence | ICP profiles, persona docs, customer interview summaries, NPS/review signals |

The categories above are illustrative. Any artifact that meets the qualification criteria is in scope regardless of category. Operators and agents should apply the three criteria, not match against this list.

#### Change detection → fact-find trigger

When any registered standing artifact changes meaningfully, that change surfaces to the operator as a candidate for a new Layer B cycle. The operator reviews it and decides whether to open a fact-find directly. There is no formal scoring or staging gate between detection and fact-find initiation.

This applies equally to named-domain aggregate packs and to any qualifying artifact registered outside the named domains. The mechanism is the same; the scope is unrestricted.

#### Registration requirement

Every artifact meeting the qualification criteria must be registered as a monitored source:

- Added to the **Update Triggers** table with its applicable refresh trigger.

Omission from the triggers table is an oversight to be corrected, not a deliberate exclusion. Use R9 when a build or observation surfaces a new qualifying artifact.

### Update Triggers

Each domain's standing artifacts are refreshed when one of the following triggers fires:

| Trigger | Applies to | Anti-loop condition |
|---|---|---|
| Layer B build cycle completes (results-review.user.md optionally written) | All domains and registered standing artifacts touched by the build's scope | Do NOT update a source if the Layer B cycle was itself triggered by a change in that same source (see R8) |
| Any registered standing artifact updated meaningfully (inside or outside named domain packs) | The specific artifact and any domain packs that aggregate it | Surfaces to operator as a fact-find candidate; operator decides whether to open a Layer B cycle directly |
| Operator explicitly re-runs a domain stage (e.g. MARKET-07 post-offer synthesis) | That domain only | — |
| S10 weekly readout identifies a confidence-degraded field | Specific domain or registered artifact whose field confidence fell below threshold | — |
| External event (competitor launch, pricing change, logistics disruption, regulatory change) | Domain or registered artifact that owns the affected field | — |

### Lifecycle and Staleness

Standing information does not expire on a fixed calendar schedule. Staleness is determined by confidence degradation:

- Each standing artifact carries a `confidence` field and a `confidence_reason` narrative (defined in the document hygiene schema, TASK-06).
- A standing artifact is considered stale when its `confidence` field drops below `0.6` OR when its most recent `last_updated` date is more than 90 days prior to the current date, whichever occurs first.
- Stale artifacts must be flagged at S10 weekly readout. The operator decides whether to trigger a refresh cycle (new Layer B implementation) or accept the staleness with a documented rationale.

Carry-mode semantics govern how standing fields are updated without full rewrites:

- `link` mode: the field points to a source artifact path and is never overwritten by a refresh cycle.
- `revision` mode: the field is updated on each applicable refresh cycle (e.g. ICP confidence, competitor prices, logistics costs).

Full field-level carry-mode mapping is defined in `carry-mode-schema.md` (TASK-05).

---

## Layer B — Implementation Loop

### Purpose

Layer B is the implementation loop. It is instantiated per idea: when the operator decides to act on a standing-artifact signal or any other trigger, Layer B opens a new implementation cycle that takes the idea from hypothesis to validated build output. Layer B is not a one-time linear path; it repeats for each idea acted upon.

### Structure

Layer B maps directly to the DO stage in loop-spec.yaml (stage ID: `DO`, line 944). The DO stage is defined as three sequential processes:

1. **fact-find** (`/lp-do-fact-find`): produces `fact-find.md` under `docs/plans/<feature-slug>/`. The fact-find reads from Layer A standing artifacts as primary input context.
2. **plan** (`/lp-do-plan`): produces `plan.md` under `docs/plans/<feature-slug>/`. The plan converts fact-find findings into a sequenced, acceptance-criteria-bearing task list.
3. **build** (`/lp-do-build`): executes plan tasks and produces a `build-record.user.md` under `docs/plans/<feature-slug>/`. Plan is archived on build completion. Operator may optionally write `results-review.user.md` to propagate learnings to Layer A.

### How Layer B Reads from Layer A

At fact-find initiation, the operator or agent sources the following Layer A inputs as context for the brief:

| Layer A artifact | Consumed by fact-find process |
|---|---|
| Current `market-pack.user.md` (MARKET-11 output) | Market context, ICP, competitor assumptions |
| Current `sell-pack.user.md` (SELL-07 output) | Channel assumptions, CAC/CVR baselines |
| Current `product-pack.user.md` (PRODUCTS-07 output) | Product scope, bundle options, roadmap constraints |
| Current `logistics-pack.user.md` (LOGISTICS-07 output, if applicable) | Fulfillment and supply chain constraints |
| Any relevant registered standing artifact (see Monitoring Scope) | Domain-specific assumptions or signals that motivated the cycle |
| ASSESSMENT intake packet (ASSESSMENT-11 output) | Business profile, ICP, locked assumptions |

The fact-find brief explicitly lists which Layer A artifacts were consulted and their `last_updated` dates. If a required artifact is absent or stale, the fact-find must document the gap and its impact on confidence.

### How Layer B Writes Back to Layer A

On build completion, the operator may optionally write `results-review.user.md` to document observed outcomes. When written, it informs standing updates:

| results-review field | Layer A update target | Anti-loop condition |
|---|---|---|
| Observed demand signals | MARKET confidence fields; MARKET-09 ICP refinement trigger | Skip if this cycle was triggered by a MARKET standing-info change |
| Channel performance actuals | SELL-02 CAC/CVR baseline refresh | Skip if this cycle was triggered by a SELL standing-info change |
| Product sell-through actuals | PRODUCTS-03 performance baseline refresh | Skip if this cycle was triggered by a PRODUCTS standing-info change |
| Logistics actual costs/lead times | LOGISTICS-02 and LOGISTICS-04 revision-mode fields | Skip if this cycle was triggered by a LOGISTICS standing-info change |
| New idea candidates surfaced during build | Operator note for future fact-find consideration | Always propagate |

The closed-loop update is advisory: when `results-review.user.md` is written, any high-confidence findings should be propagated to the relevant standing artifacts, subject to the anti-loop condition above.

**Standing information expansion.** After each build, the operator should explicitly consider two questions:

1. Does this build produce outcomes that are not naturally captured by any existing Layer A domain? If yes, the operator should decide whether to add a new standing artifact or domain, and register it as a monitored trigger in the Update Triggers table above.
2. Does this build create a new source of standing information that the loop does not currently monitor? If yes, the operator should adjust the workflow so that source can trigger future Layer B cycles when relevant.

These expansion decisions should be recorded in `results-review.user.md` (if written) under a `## Standing Expansion` section, or as a replan note if no results-review is written.

---

## Inter-Layer Contract

### Data Flow Summary

```
Layer A (standing)           Layer B (implementation)
─────────────────            ─────────────────────────
market-pack.user.md ──────► fact-find.md (reads assumptions)
sell-pack.user.md   ──────►
product-pack.user.md ─────►
logistics-pack.user.md ───►
any registered artifact ──►
intake-packet.user.md ────►
                             plan.md
                             build-record.user.md
                             results-review.user.md ──► Layer A standing updates
                             new idea candidates ─────► operator (future fact-find)
```

### Specific Contract Rules

**R1 — Fact-find must cite Layer A source artifacts.** The fact-find frontmatter must list `layer_a_inputs` with artifact paths and `last_updated` dates. Missing inputs must be documented as evidence gaps with confidence impact.

**R2 — Trigger source must be cited.** The fact-find frontmatter must identify what triggered the cycle — either a specific standing artifact path and change description, or a direct operator decision with rationale. Untriggered fact-finds (no source cited) must document why no standing artifact preceded the decision.

**R3 — results-review is advisory.** The build process (`/lp-do-build`) archives the plan on build completion without waiting for `results-review.user.md`. Writing the results review is encouraged but does not block archival.

**R4 — Standing update scope is bounded.** results-review updates propagate to the specific standing fields that the build outcome touched. Global standing refreshes (full domain re-runs) are not triggered by a single build cycle unless the operator explicitly initiates a domain re-run.

**R5 — Aggregate pack consumed at S4 join.** The S4 baseline merge join barrier (`/lp-baseline-merge`) consumes standing aggregate packs as optional inputs alongside the existing required inputs (MARKET-06 offer, S3 forecast, SELL-01 channels). New optional inputs at S4 are: `market-pack` (MARKET-11), `sell-pack` (SELL-07), `product-pack` (PRODUCTS-07), `logistics-pack` (LOGISTICS-07, conditional). Required inputs at S4 are unchanged from current spec.

**R6 — LOGISTICS consumer safety.** Any stage, skill, or template that consumes LOGISTICS artifacts must implement a presence check. LOGISTICS absence must produce a no-op or a documented skip, not an error.

**R7 — Trigger artifact is the traceability key.** The standing artifact path (or operator decision note) cited in the fact-find frontmatter per R2 is the primary traceability key linking a Layer B cycle back to its Layer A origin.

**R8 — No self-referential trigger loops.** When a Layer B cycle was initiated by a standing-information update trigger (S10 confidence degradation or external event observed in a specific domain), the completed build's outcomes must NOT be automatically propagated back to that same originating domain as a standing update. The operator must confirm that the observed outcome genuinely differs from or adds to the trigger source before applying any update to the originating domain. This rule prevents a standing-info change from triggering a build cycle that then continuously re-updates the same standing info.

**R9 — Standing information expansion and registration.** When a build produces outcomes not captured by any existing Layer A artifact, or surfaces a new artifact that meets the Monitoring Scope qualification criteria, the operator must explicitly decide: (a) whether to add or revise a standing artifact, and (b) whether to register the new source in the Update Triggers table as a monitored artifact. The monitoring scope is inclusive by default — any qualifying artifact not yet registered is an omission, not a deliberate exclusion. This decision must be recorded in `results-review.user.md` under `## Standing Expansion`, or as a replan note if no results-review is written. Silence is not acceptable.

### Stage Transition Events That Cross Layer Boundary

| Event | Layer A effect | Layer B effect |
|---|---|---|
| Operator decides to act on a standing-artifact signal or direct trigger | — | New Layer B cycle opens; `/lp-do-fact-find` invoked with trigger source cited per R2 |
| Layer B build complete | Plan archived to `docs/plans/_archive/<feature-slug>/`. If results-review.user.md is written: standing fields updated per R4 (anti-loop R8 applies); standing expansion decision recorded per R9 | |
| S10 confidence degradation detected | Operator triggers domain re-run (new Layer A stage cycle) | No Layer B effect unless operator promotes a new idea. Anti-loop R8 applies if a Layer B cycle is subsequently promoted from this trigger |
| External event observed | Operator updates relevant revision-mode fields in standing artifact | Standing artifact `last_updated` refreshed; confidence re-rated. Anti-loop R8 applies to any resulting Layer B cycle |

---

## Deprecation Note — Kanban/BOS Lane Interface

The BOS (Business OS) kanban lane interface (`bos_sync` fields in loop-spec.yaml stage definitions) is **out of scope for the two-layer model semantics**. The two-layer model is defined entirely in terms of standing artifacts, stage contracts, and skill/process handoffs. BOS sync fields remain in loop-spec.yaml for operational convenience but are not part of the Layer A / Layer B contract.

Specifically:

- The layer boundary is defined by artifact reads and writes, not by BOS card lane transitions.
- A Layer B cycle's completion is governed by `build-record.user.md` production and plan archival, not by a BOS lane reaching "Done".
- BOS lane transitions may fire alongside Layer B completions but are not causally required for the closed-loop contract to be satisfied.
- Future BOS integration changes must not alter the Layer A / Layer B artifact contracts without amending this document.

The kanban interface was de-scoped from model semantics per the `startup-loop-standing-info-gap-analysis` plan (fact-find.md non-goals, 2026-02-22). BOS sync is retained as an operational convenience layer, not a semantic requirement.

---

## Consistency Notes

### Alignment with loop-spec.yaml

This document was drafted against `loop-spec.yaml` spec_version `3.9.0`. The following topology facts are referenced:

- MARKET container: `loop-spec.yaml` stage IDs MARKET-01..06 (lines 303–373). MARKET-07..11 added in spec_version 3.9.0 (TASK-03).
- SELL container: `loop-spec.yaml` stage IDs SELL-01..02 (lines 404–443). SELL-02..08 resequencing applied in spec_version 3.9.0 (TASK-03).
- DO stage: `loop-spec.yaml` line 944, processes fact-find / plan / build. Layer B maps to this stage.
- PRODUCT container (PRODUCT-01, PRODUCT-02): distinct from PRODUCTS standing domain. PRODUCT remains a one-time product-definition container; PRODUCTS is a new standing intelligence container (TASK-02).
- S4 join barrier required inputs: MARKET-06 offer, S3 forecast, SELL-01 channels (unchanged). PRODUCTS, LOGISTICS, and expanded MARKET/SELL aggregate packs are optional S4 inputs to be added in TASK-07.

### Divergence from Proposed-Target-Model

No material divergences for the remaining domains. The domain table, LOGISTICS condition expression, SELL resequencing policy, and MARKET additive numbering policy in this document match `proposed-target-model.md`. Stage names for MARKET-07..11, SELL-02..07, PRODUCTS-01..07, and LOGISTICS-01..07 are reproduced from the proposals in `proposed-target-model.md`. Note: IDEAS-01..03 stages from the proposed-target-model have been removed from this contract and archived.
