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

### Domains

Layer A is partitioned into five domains. Each domain maps to a container ID in the stage graph (`loop-spec.yaml` `stages:` section) and owns a family of stages that build and maintain standing artifacts for that domain.

| Domain | Container ID | Stage Family | Conditional | Stage Count |
|---|---|---|---|---|
| Competitor and market intelligence | MARKET | MARKET-01..11 | false | 11 (01..06 existing; 07..11 new per TASK-03) |
| Channel and GTM standing | SELL | SELL-01..08 | false | 8 (01 existing; 02..07 new; 08 renamed gate per TASK-03) |
| Product portfolio standing | PRODUCTS | PRODUCTS-01..07 | false | 7 (new per TASK-02) |
| Logistics and supply chain standing | LOGISTICS | LOGISTICS-01..07 | true | 7 (new conditional per TASK-02) |
| Idea pipeline | IDEAS | IDEAS-01..03 | false | 3 (new stage-gated per TASK-04) |

**LOGISTICS conditionality.** LOGISTICS stages are gated by business profile. The condition expression is:

```yaml
conditional: true
condition: "business_profile includes logistics-heavy OR physical-product"
```

Businesses without `physical-product` or `logistics-heavy` profile flags skip the LOGISTICS container entirely. Consumers of LOGISTICS artifacts (e.g. S4 optional inputs) must treat LOGISTICS outputs as optional to remain profile-agnostic.

**IDEAS position.** IDEAS-01..03 are positioned after the ASSESSMENT container and before the MEASURE stage group. The IDEAS stage family enforces intake discipline: idea cards must pass through IDEAS-02 scoring and IDEAS-03 promotion gate before a fact-find (Layer B) is initiated. IDEAS-01..03 are unconditional (`conditional: false`) for all business profiles.

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

#### IDEAS (IDEAS-01..03)

IDEAS stages are the formal interface between standing intelligence observations and Layer B implementation cycles. IDEAS enforce that only scored, promoted idea candidates enter the fact-find process.

- IDEAS-01: Idea backlog capture. Operator reviews standing intelligence outputs and captures candidates as `idea-card.schema.md` entries.
- IDEAS-02: Idea card review. Operator scores idea cards against ICP, offer hypothesis, and evidence quality; prioritises top 1–3 for fact-find promotion.
- IDEAS-03: Promotion gate. Gate is satisfied when the operator initiates `/lp-do-fact-find` for the top-ranked idea card and a `fact-find.md` is created from that card. The idea card reference (ID and source domain) must appear in the fact-find frontmatter.

### Update Triggers

Each domain's standing artifacts are refreshed when one of the following triggers fires:

| Trigger | Applies to |
|---|---|
| Layer B build cycle completes (results-review.user.md optionally written) | All domains touched by the build's scope |
| Operator explicitly re-runs a domain stage (e.g. MARKET-07 post-offer synthesis) | That domain only |
| S10 weekly readout identifies a confidence-degraded field | Specific domain whose field confidence fell below threshold |
| External event (competitor launch, pricing change, logistics disruption) | Domain that owns the affected field |

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

Layer B is the implementation loop. It is instantiated per idea: when an idea card is promoted through IDEAS-03, Layer B opens a new implementation cycle that takes the idea from hypothesis to validated build output. Layer B is not a one-time linear path; it repeats for each promoted idea.

### Structure

Layer B maps directly to the DO stage in loop-spec.yaml (stage ID: `DO`, line 944). The DO stage is defined as three sequential processes:

1. **fact-find** (`/lp-do-fact-find`): produces `fact-find.md` under `docs/plans/<feature-slug>/`. The fact-find reads from Layer A standing artifacts as primary input context. The fact-find frontmatter must reference the source idea card ID.
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
| Promoted idea card (IDEAS-03 output) | Hypothesis, scope, success criteria seed |
| ASSESSMENT intake packet (ASSESSMENT-11 output) | Business profile, ICP, locked assumptions |

The fact-find brief explicitly lists which Layer A artifacts were consulted and their `last_updated` dates. If a required artifact is absent or stale, the fact-find must document the gap and its impact on confidence.

### How Layer B Writes Back to Layer A

On build completion, the `results-review.user.md` artifact documents observed outcomes and triggers standing updates:

| results-review field | Layer A update target |
|---|---|
| Observed demand signals | MARKET confidence fields; MARKET-09 ICP refinement trigger |
| Channel performance actuals | SELL-02 CAC/CVR baseline refresh |
| Product sell-through actuals | PRODUCTS-03 performance baseline refresh |
| Logistics actual costs/lead times | LOGISTICS-02 and LOGISTICS-04 revision-mode fields |
| New idea candidates surfaced during build | IDEAS-01 backlog (operator adds as new idea cards) |

The closed-loop update is advisory: when `results-review.user.md` is written, any high-confidence findings should be propagated to the relevant standing artifacts.

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
idea-card.user.md   ──────►
intake-packet.user.md ────►
                             plan.md
                             build-record.user.md
                             results-review.user.md ──► Layer A standing updates
                             new idea candidates ─────► IDEAS-01 backlog
```

### Specific Contract Rules

**R1 — Fact-find must cite Layer A source artifacts.** The fact-find frontmatter must list `layer_a_inputs` with artifact paths and `last_updated` dates. Missing inputs must be documented as evidence gaps with confidence impact.

**R2 — Idea card link is mandatory.** The fact-find frontmatter must include `idea_card_id` referencing the IDEAS-03 promoted card. A fact-find without an idea card reference is a direct-inject cycle (operator-override pattern) and must be flagged as such with a documented rationale.

**R3 — results-review is advisory.** The build process (`/lp-do-build`) archives the plan on build completion without waiting for `results-review.user.md`. Writing the results review is encouraged but does not block archival.

**R4 — Standing update scope is bounded.** results-review updates propagate to the specific standing fields that the build outcome touched. Global standing refreshes (full domain re-runs) are not triggered by a single build cycle unless the operator explicitly initiates a domain re-run.

**R5 — Aggregate pack consumed at S4 join.** The S4 baseline merge join barrier (`/lp-baseline-merge`) consumes standing aggregate packs as optional inputs alongside the existing required inputs (MARKET-06 offer, S3 forecast, SELL-01 channels). New optional inputs at S4 are: `market-pack` (MARKET-11), `sell-pack` (SELL-07), `product-pack` (PRODUCTS-07), `logistics-pack` (LOGISTICS-07, conditional). Required inputs at S4 are unchanged from current spec.

**R6 — LOGISTICS consumer safety.** Any stage, skill, or template that consumes LOGISTICS artifacts must implement a presence check. LOGISTICS absence must produce a no-op or a documented skip, not an error.

**R7 — IDEAS card ID is the traceability key.** The idea card ID flows from IDEAS-03 through the fact-find, plan, and build artifacts. It is the primary traceability key linking a Layer B implementation cycle back to its Layer A origin. The idea portfolio (`idea-portfolio.user.md`, TASK-04) records all promoted cards and their outcome references.

### Stage Transition Events That Cross Layer Boundary

| Event | Layer A effect | Layer B effect |
|---|---|---|
| IDEAS-03 promotion gate satisfied | Idea card status updated to `promoted` in idea portfolio | New Layer B cycle opens; `/lp-do-fact-find` invoked |
| Layer B build complete | Layer B cycle archived to `docs/plans/_archive/<feature-slug>/`. If results-review.user.md is written, standing fields updated per R4 and new idea candidates enter IDEAS-01 | |
| S10 confidence degradation detected | Operator triggers domain re-run (new Layer A stage cycle) | No Layer B effect unless operator promotes a new idea |
| External event observed | Operator updates relevant revision-mode fields in standing artifact | Standing artifact `last_updated` refreshed; confidence re-rated |

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

No material divergences. The domain table, LOGISTICS condition expression, IDEAS stage-gated approach, SELL resequencing policy, and MARKET additive numbering policy in this document all match `proposed-target-model.md` exactly. Stage names for MARKET-07..11, SELL-02..07, PRODUCTS-01..07, and LOGISTICS-01..07 are reproduced from the proposals in `proposed-target-model.md`; TASK-02, TASK-03, and TASK-04 executors may refine names within the boundaries defined in that document.
