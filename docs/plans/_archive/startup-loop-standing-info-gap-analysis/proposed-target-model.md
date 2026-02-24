---
Type: Architecture-Decision-Record
Status: Active
Feature-Slug: startup-loop-standing-info-gap-analysis
Created: 2026-02-22
Last-updated: 2026-02-22
Owner: startup-loop maintainers
Related-plan: docs/plans/startup-loop-standing-info-gap-analysis/plan.md
---

# Proposed Target Model — Startup Loop Standing Information Redesign

This document is the canonical architecture anchor for the `startup-loop-standing-info-gap-analysis` implementation plan. All three open architecture decisions are locked here. Implementation tasks (TASK-01 through TASK-10) **MUST** consult this document before mutating `loop-spec.yaml` or `stage-operator-dictionary.yaml`.

## Decision Record

### Decision 1 — LOGISTICS Gating Mode

**Confirmed: Option B — Conditional**

LOGISTICS domain stages are gated by business profile. Only businesses with `physical-product` or `logistics-heavy` profile flags proceed through LOGISTICS stages.

**Condition expression (for loop-spec.yaml):**
```
condition: "business_profile includes logistics-heavy OR physical-product"
```

**Rationale:** Requiring LOGISTICS for all businesses would block digital-only businesses at the SELL gate. The conditional flag ensures the stage family is present in the topology without creating a mandatory barrier for out-of-scope businesses.

---

### Decision 2 — IDEAS Embedding

**Confirmed: Option A — Stage-Gated**

IDEAS-01..03 are added as formal loop stages positioned after the ASSESSMENT container and before the MEASURE stage group. This provides enforced fact-find intake discipline for idea-to-feature promotion.

**Stage family:** IDEAS-01 (idea backlog capture), IDEAS-02 (idea card review), IDEAS-03 (promotion gate to fact-find)

**Rationale:** Long-term enforcement discipline favours formal loop stages over advisory schemas. Stage-gated approach prevents ideas from bypassing the intake process. External schema docs (idea-backlog.schema.md, idea-card.schema.md, idea-portfolio.schema.md) are produced alongside the stage additions to provide operator-facing templates.

---

### Decision 3 — MARKET/SELL Numbering Policy

**Confirmed: MARKET additive; SELL resequenced**

**MARKET:** No ID renumbering. Existing MARKET-01..06 are preserved. New stages appended as MARKET-07..11.
- MARKET-06 (offer design, `/lp-offer`) remains at MARKET-06.
- MARKET-07..11: post-offer synthesis, aggregate pack assembly, and ICP refinement stages (names TBD by TASK-03 executor; see Domain Specifications below for intent).

**SELL:** Targeted resequencing. SELL-02 (current "Activation readiness" gate, `condition: "paid_spend_requested"`) is renamed to SELL-08. New substantive SELL-02..07 stages are inserted before the activation gate.
- SELL-01: Channel strategy + GTM (unchanged)
- SELL-02..07: New substantive SELL stages (see Domain Specifications below)
- SELL-08: Activation readiness gate (renamed from SELL-02; all skill/prompt_template/condition assignments preserved verbatim)

**Rationale:** MARKET-01..06 is already logically ordered (intelligence stack builds toward offer); additive extension preserves existing semantics. SELL-02 is a gate stage that logically belongs at the end of the SELL sequence; resequencing is needed for logical ordering and is a targeted non-additive change.

---

## Target Topology

### Layer A — Standing Intelligence

Each domain has a standing artifact in `docs/business-os/strategy/<BIZ>/` updated on each completed build cycle.

| Domain | Container ID | Stage Family | Conditional | Status |
|---|---|---|---|---|
| Competitor / market intelligence | MARKET | MARKET-01..11 | false | Existing (01..06) + expand (07..11) |
| Channel + GTM standing | SELL | SELL-01..08 | false | Existing (01..02) + resequence + expand |
| Product portfolio standing | PRODUCTS | PRODUCTS-01..07 | false | New (TASK-02) |
| Logistics standing | LOGISTICS | LOGISTICS-01..07 | true (`logistics-heavy OR physical-product`) | New conditional (TASK-02) |
| Idea pipeline | IDEAS | IDEAS-01..03 | false | New stage-gated (TASK-04) |

### Layer B — Implementation Loop

The DO stage (`loop-spec.yaml:498`) remains the canonical implementation loop: fact-find → plan → build. Layer B reads from Layer A (standing intelligence informs each fact-find) and writes back to Layer A (completed build cycles update standing assumptions via results-review.user.md).

---

## Domain Specifications

### PRODUCTS Domain (new container, TASK-02)

PRODUCTS is a **standing intelligence layer** for the business's product portfolio decisions — distinct from the existing PRODUCT container (PRODUCT-01/02 handles one-time product definition artifacts). PRODUCTS stages focus on recurring product line management and intelligence gathering.

**Proposed stage family (PRODUCTS-01..07):**

| Stage | Name (proposed) | Purpose |
|---|---|---|
| PRODUCTS-01 | Product line mapping | Current SKU inventory, positioning map |
| PRODUCTS-02 | Competitor product scan | Adjacent SKUs, pricing benchmarks |
| PRODUCTS-03 | Product performance baseline | Sell-through rates, margin by SKU |
| PRODUCTS-04 | Bundle and packaging hypotheses | Standing bundle options |
| PRODUCTS-05 | Product-market fit signals | Reviews, return rates, demand signals |
| PRODUCTS-06 | Product roadmap snapshot | Next 90-day product decisions |
| PRODUCTS-07 | Aggregate product pack | Pack output; consumed optionally at S4 |

**Note:** Stage names are proposals. TASK-02 executor may refine names; this document is authority for count (7 stages) and purpose boundaries.

---

### LOGISTICS Domain (new conditional container, TASK-02)

LOGISTICS stages are conditional. Profile-unaware consumers must not fail when LOGISTICS stages are absent.

**Proposed stage family (LOGISTICS-01..07):**

| Stage | Name (proposed) | Purpose |
|---|---|---|
| LOGISTICS-01 | Supplier / manufacturer mapping | Supplier list, MOQ, lead times |
| LOGISTICS-02 | Lead time and MOQ baseline | Consolidated constraints per SKU |
| LOGISTICS-03 | Fulfillment channel options | 3PL, self-fulfillment, dropship comparison |
| LOGISTICS-04 | Cost and margin by route | Fulfillment cost stack per channel |
| LOGISTICS-05 | Returns and quality baseline | Return rates, quality failure modes |
| LOGISTICS-06 | Inventory policy snapshot | Reorder points, safety stock assumptions |
| LOGISTICS-07 | Aggregate logistics pack | Pack output; conditional at S4 optional |

**Condition expression:**
```yaml
conditional: true
condition: "business_profile includes logistics-heavy OR physical-product"
```

---

### IDEAS Domain (stage-gated, TASK-04)

IDEAS-01..03 are positioned after the ASSESSMENT container and before the MEASURE stage group.

**Stage definitions:**

| Stage | Name | Purpose |
|---|---|---|
| IDEAS-01 | Idea backlog capture | Operator reviews standing intelligence observations and captures candidates as idea-card.schema.md entries |
| IDEAS-02 | Idea card review | Operator scores ideas against ICP, offer hypothesis, and evidence quality; prioritises top 1–3 for fact-find promotion |
| IDEAS-03 | Promotion gate | Operator initiates `/lp-do-fact-find` for the top-ranked idea card; gate is satisfied when a fact-find.md is created from the idea card |

**Schema docs (produced alongside loop-spec additions by TASK-04):**
- `docs/business-os/startup-loop/ideas/idea-backlog.schema.md`
- `docs/business-os/startup-loop/ideas/idea-card.schema.md`
- `docs/business-os/startup-loop/ideas/idea-portfolio.schema.md`
- `docs/business-os/startup-loop/ideas/handoff-to-fact-find.md`

---

### MARKET Expansion (TASK-03)

MARKET-07..11 are appended after MARKET-06. Intended semantics:

| Stage | Name (TBD by executor) | Purpose |
|---|---|---|
| MARKET-07 | Post-offer synthesis | Integrate offer contract back into market intelligence; update assumptions |
| MARKET-08 | Demand evidence pack assembly | Compile DEP artifact from MARKET-01..07 signals |
| MARKET-09 | ICP refinement | Narrow ICP based on offer feedback and observed demand signals |
| MARKET-10 | Market aggregate pack (draft) | Assemble market-pack standing artifact |
| MARKET-11 | Market aggregate pack (validated) | Pack sign-off; consumes DEP + ICP refinement |

**MARKET-06 is preserved unchanged** (`/lp-offer`, offer contract output).

---

### SELL Expansion (TASK-03)

SELL-02..07 are inserted. SELL-08 is the renamed SELL-02 activation gate.

| Stage | Name (TBD by executor) | Purpose |
|---|---|---|
| SELL-01 | Channel strategy + GTM | Unchanged |
| SELL-02 | Channel performance baseline | Baseline CAC/CVR by channel; first data pass |
| SELL-03 | Outreach and content standing | Outreach sequence performance; content asset inventory |
| SELL-04 | SEO standing | Keyword rank tracking; content gap snapshot |
| SELL-05 | Paid channel standing | Paid CAC trends; ROAS baseline by channel |
| SELL-06 | Partnership and referral standing | Affiliate/referral pipeline snapshot |
| SELL-07 | Sell aggregate pack | Assemble sell-pack standing artifact |
| SELL-08 | Activation readiness gate | **Renamed from SELL-02**; all assignments preserved; `condition: "paid_spend_requested"` |

---

## Carry-Mode Defaults

Standing docs updated by Layer A stages use:
- `link` mode: fields pointing to source artifact paths (never overwritten by refresh cycle)
- `revision` mode: fields updated on each refresh cycle (ICP confidence, competitor prices, logistics costs)

Full field-level mapping to be defined in `carry-mode-schema.md` (TASK-05).

---

## Migration Sequence

1. TASK-02: Add PRODUCTS and LOGISTICS containers to loop-spec.yaml + dictionary
2. TASK-03: Append MARKET-07..11; insert SELL-02..07; rename SELL-02→SELL-08
3. TASK-04: Add IDEAS-01..03 stages (after TASK-03 — no concurrent loop-spec edits)
4. Stage-operator-dictionary updated after each container addition; VC-03 invariant maintained
5. Generated views regenerated after each wave

---

## Open Items

- **Stage names for MARKET-07..11**: Proposals above. Executor may refine in amendment to this document before TASK-03 execution.
- **Stage names for SELL-02..07**: Proposals above. Executor may refine before TASK-03.
- **Stage names for PRODUCTS-01..07 / LOGISTICS-01..07**: Proposals above. Executor may refine before TASK-02.
- **Operator skills for new PRODUCTS/LOGISTICS/MARKET-07..11/SELL-02..07 stages**: TBD — default to `prompt-handoff` with new prompt templates unless a new `/lp-*` skill is warranted.
- **IDEAS optional flag**: Confirm whether IDEAS-01..03 should be `conditional: false` (required for all) or `optional: true` (elective per business profile) — TASK-04 executor to confirm from loop-spec ordering semantics.