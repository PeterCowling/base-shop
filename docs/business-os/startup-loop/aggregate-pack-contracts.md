---
Type: Architecture-Contract
Status: Active
Version: 1.0.0
Feature-Slug: startup-loop-standing-info-gap-analysis
Created: 2026-02-22
Last-updated: 2026-02-22
Owner: startup-loop maintainers
Related-plan: docs/plans/startup-loop-standing-info-gap-analysis/plan.md
Related-contract: docs/business-os/startup-loop/two-layer-model.md
Related-spec: docs/business-os/startup-loop/loop-spec.yaml
Related-registry: docs/business-os/startup-loop/artifact-registry.md
---

# Aggregate Pack Contracts

This document defines the path, producer, update trigger, freshness policy, consumer list, and required sections for each of the four standing aggregate packs maintained by Layer A of the startup loop. These packs are the primary input conduit between Layer A standing intelligence and Layer B implementation cycles.

All four packs share the same section schema and carry-mode rules. The LOGISTICS pack is additionally conditional on business profile.

Design authority: `two-layer-model.md` Rule R5.

---

## Pack 1 — `market-pack.user.md`

### Overview

The market pack is the consolidated standing artifact for competitor and market intelligence. It is produced at the end of the MARKET stage family, after the offer contract (MARKET-06) has been signed off and post-offer demand evidence has been integrated.

### Path Template

```
docs/business-os/strategy/<BIZ>/market-pack.user.md
```

Where `<BIZ>` is the business code (e.g. `HEAD`, `HBAG`, `PET`, `BRIK`). The file is a flat, single-file artifact that is overwritten on each validated refresh. Consumers must treat the file at this path as the current authoritative version; no dated variant is required.

### Producer Stage

`MARKET-11` — Market aggregate pack (validated). MARKET-11 consumes the Demand Evidence Pack (DEP) from MARKET-08 and the ICP refinement from MARKET-09. It signs off and writes the final pack to the canonical path above.

Intermediate draft assembly occurs at MARKET-10; MARKET-10 output is not the canonical consumer input. Consumers must always read from the MARKET-11–written file at the canonical path.

### Update Trigger

The market pack is refreshed when any of the following events fires:

1. A Layer B build cycle completes (`results-review.user.md` is written) and the build touched market intelligence, competitor assumptions, ICP definitions, or demand signals.
2. The operator explicitly re-runs the MARKET domain stage family (MARKET-07 onward) in response to an external event (competitor launch, pricing change, new demand signal).
3. S10 weekly readout detects that the `confidence` field in the current pack has fallen below `0.6`.

Update triggers are event-based, not calendar-based. A pack is not automatically refreshed on a fixed schedule.

### Freshness Policy

A market pack is considered **stale** when either of the following conditions is met:

- The `last_updated` date in the pack frontmatter is more than **90 days** prior to the current date.
- The `confidence` field in the pack frontmatter is below **0.6**.

Stale status is flagged at S10 weekly readout. The operator decides whether to trigger a MARKET domain re-run or accept staleness with documented rationale.

### Consumers

| Consumer | Consumption Mode | What is read |
|---|---|---|
| S4 join barrier (`/lp-baseline-merge`) | Optional — absent-safe | Full pack; enriches baseline snapshot with current market and ICP context |
| Layer B fact-find (`/lp-do-fact-find`) | Optional (Layer B briefing) — absent-safe | Market context section, ICP summary, Key Assumptions, confidence |
| S10 weekly readout | Standing freshness check | `confidence` field and `last_updated` date only |

### Conditionality

`conditional: false` — The market pack is applicable for all business profiles. It is only absent when MARKET-07..11 stages have not yet been run.

### Required Sections

Every `market-pack.user.md` file must contain the following sections, in order:

1. `## ICP Summary` — current Ideal Customer Profile definition: primary segment, secondary segment, key pain points, willingness-to-pay signal.
2. `## Key Assumptions` — up to 10 enumerated assumptions about the market, ranked by impact and confidence. Each assumption must have a confidence score (`0.0`–`1.0`) and a source reference.
3. `## Confidence` — single numeric field (`0.0`–`1.0`) representing overall pack confidence, plus a `confidence_reason` narrative explaining the rating.
4. `## Evidence Sources` — list of primary evidence artifacts consumed to build this pack (DEP reference, MARKET-08 output path, competitor scan dates).
5. `## Open Questions` — list of unresolved gaps, each with an owner and a target resolution stage or date.
6. `## Change-log` — append-only list of updates: date, change summary, trigger event.

Frontmatter must include: `artifact: market-pack`, `business: <BIZ>`, `producer_stage: MARKET-11`, `confidence: <float>`, `last_updated: <ISO date>`, `status: Active | Stale | Draft`.

---

## Pack 2 — `sell-pack.user.md`

### Overview

The sell pack is the consolidated standing artifact for channel strategy and go-to-market intelligence. It is produced at SELL-07 after the channel performance baseline, outreach and content standing, SEO standing, paid channel standing, and partnership/referral standing have been assembled.

### Path Template

```
docs/business-os/strategy/<BIZ>/sell-pack.user.md
```

Same `<BIZ>` substitution rule as the market pack. Single flat file; overwritten on each validated refresh.

### Producer Stage

`SELL-07` — Sell aggregate pack. SELL-07 assembles the `sell-pack.user.md` standing artifact from SELL-02 through SELL-06 outputs.

### Update Trigger

The sell pack is refreshed when any of the following events fires:

1. A Layer B build cycle completes (`results-review.user.md` is written) and the build touched channel assumptions, GTM strategy, outreach sequences, content assets, SEO positioning, paid channel performance, or partnership/referral pipeline.
2. The operator explicitly re-runs the SELL domain stage family (SELL-02 onward).
3. S10 weekly readout detects that the `confidence` field in the current pack has fallen below `0.6`.

Update triggers are event-based, not calendar-based.

### Freshness Policy

A sell pack is considered **stale** when either of the following conditions is met:

- The `last_updated` date in the pack frontmatter is more than **90 days** prior to the current date.
- The `confidence` field in the pack frontmatter is below **0.6**.

Stale status is flagged at S10 weekly readout.

### Consumers

| Consumer | Consumption Mode | What is read |
|---|---|---|
| S4 join barrier (`/lp-baseline-merge`) | Optional — absent-safe | Full pack; enriches baseline snapshot with current channel and GTM context |
| Layer B fact-find (`/lp-do-fact-find`) | Optional (Layer B briefing) — absent-safe | Key Assumptions, CAC/CVR baseline, channel performance context, confidence |
| S10 weekly readout | Standing freshness check | `confidence` field and `last_updated` date only |

### Conditionality

`conditional: false` — The sell pack is applicable for all business profiles. It is only absent when SELL-02..07 stages have not yet been run.

### Required Sections

Every `sell-pack.user.md` file must contain the following sections, in order:

1. `## ICP Summary` — channel-level ICP notes: which segments convert on which channels, acquisition behaviour by surface.
2. `## Key Assumptions` — up to 10 enumerated channel and GTM assumptions, ranked by impact and confidence, each with a confidence score (`0.0`–`1.0`) and source reference.
3. `## Confidence` — overall pack confidence score (`0.0`–`1.0`) plus `confidence_reason` narrative.
4. `## Evidence Sources` — list of primary evidence artifacts consumed (SELL-02..06 output paths, baseline data dates).
5. `## Open Questions` — unresolved channel gaps, each with owner and target resolution stage or date.
6. `## Change-log` — append-only update log: date, change summary, trigger event.

Frontmatter must include: `artifact: sell-pack`, `business: <BIZ>`, `producer_stage: SELL-07`, `confidence: <float>`, `last_updated: <ISO date>`, `status: Active | Stale | Draft`.

---

## Pack 3 — `product-pack.user.md`

### Overview

The product pack is the consolidated standing artifact for the product portfolio. It is produced at PRODUCTS-07 after the product line mapping, competitor product scan, performance baseline, bundle hypotheses, product-market fit signals, and roadmap snapshot have been assembled.

### Path Template

```
docs/business-os/strategy/<BIZ>/product-pack.user.md
```

Same `<BIZ>` substitution rule. Single flat file; overwritten on each validated refresh.

### Producer Stage

`PRODUCTS-07` — Aggregate product pack. PRODUCTS-07 assembles `product-pack.user.md` from PRODUCTS-01 through PRODUCTS-06 outputs.

Note: PRODUCTS is a standing intelligence domain distinct from the existing PRODUCT container (PRODUCT-01 product-from-photo; PRODUCT-02 adjacent product research). PRODUCT handles one-time product-definition artifacts; PRODUCTS handles recurring product line management and intelligence.

### Update Trigger

The product pack is refreshed when any of the following events fires:

1. A Layer B build cycle completes (`results-review.user.md` is written) and the build touched product decisions, SKU positioning, bundle configurations, product pricing, or product-market fit signals.
2. The operator explicitly re-runs the PRODUCTS domain stage family.
3. S10 weekly readout detects that the `confidence` field in the current pack has fallen below `0.6`.

Update triggers are event-based, not calendar-based.

### Freshness Policy

A product pack is considered **stale** when either of the following conditions is met:

- The `last_updated` date in the pack frontmatter is more than **90 days** prior to the current date.
- The `confidence` field in the pack frontmatter is below **0.6**.

Stale status is flagged at S10 weekly readout.

### Consumers

| Consumer | Consumption Mode | What is read |
|---|---|---|
| S4 join barrier (`/lp-baseline-merge`) | Optional — absent-safe | Full pack; enriches baseline snapshot with current product scope and roadmap constraints |
| Layer B fact-find (`/lp-do-fact-find`) | Optional (Layer B briefing) — absent-safe | Product scope, bundle options, roadmap constraints, confidence |
| S10 weekly readout | Standing freshness check | `confidence` field and `last_updated` date only |

### Conditionality

`conditional: false` — The product pack is applicable for all business profiles. It is only absent when PRODUCTS-01..07 stages have not yet been run.

### Required Sections

Every `product-pack.user.md` file must contain the following sections, in order:

1. `## ICP Summary` — product-level ICP notes: which segments buy which products, gift vs self-purchase patterns, price sensitivity by segment.
2. `## Key Assumptions` — up to 10 enumerated product and portfolio assumptions, each with a confidence score (`0.0`–`1.0`) and source reference.
3. `## Confidence` — overall pack confidence score (`0.0`–`1.0`) plus `confidence_reason` narrative.
4. `## Evidence Sources` — list of primary evidence artifacts consumed (PRODUCTS-01..06 output paths, data dates).
5. `## Open Questions` — unresolved product gaps, each with owner and target resolution stage or date.
6. `## Change-log` — append-only update log: date, change summary, trigger event.

Frontmatter must include: `artifact: product-pack`, `business: <BIZ>`, `producer_stage: PRODUCTS-07`, `confidence: <float>`, `last_updated: <ISO date>`, `status: Active | Stale | Draft`.

---

## Pack 4 — `logistics-pack.user.md`

### Overview

The logistics pack is the consolidated standing artifact for supply chain and fulfillment intelligence. It is produced at LOGISTICS-07 after the supplier mapping, lead-time baseline, fulfillment channel options, cost and margin by route, returns and quality baseline, and inventory policy snapshot have been assembled.

**LOGISTICS IS CONDITIONAL.** The LOGISTICS container is gated by business profile:

```yaml
conditional: true
condition: "business_profile includes logistics-heavy OR physical-product"
```

Businesses without `physical-product` or `logistics-heavy` profile flags skip the LOGISTICS container entirely. The `logistics-pack.user.md` file will be **absent** for these businesses. Every consumer of this pack must implement a presence check and handle the absent case as a no-op or documented skip — never as an error. This is Rule R6 of `two-layer-model.md`.

### Path Template

```
docs/business-os/strategy/<BIZ>/logistics-pack.user.md
```

Same `<BIZ>` substitution rule. Single flat file; overwritten on each validated refresh. The file is absent for non-logistics businesses — absence is a valid state, not a missing-file error.

### Producer Stage

`LOGISTICS-07` — Aggregate logistics pack. LOGISTICS-07 assembles `logistics-pack.user.md` from LOGISTICS-01 through LOGISTICS-06 outputs. LOGISTICS-07 only runs when the LOGISTICS container condition (`business_profile includes logistics-heavy OR physical-product`) is satisfied.

### Update Trigger

The logistics pack is refreshed when any of the following events fires:

1. A Layer B build cycle completes (`results-review.user.md` is written) and the build touched fulfillment, supply chain, supplier relationships, lead times, packaging costs, or returns policy.
2. The operator explicitly re-runs the LOGISTICS domain stage family.
3. S10 weekly readout detects that the `confidence` field in the current pack has fallen below `0.6`.

Update triggers are event-based, not calendar-based.

### Freshness Policy

A logistics pack is considered **stale** when either of the following conditions is met:

- The `last_updated` date in the pack frontmatter is more than **90 days** prior to the current date.
- The `confidence` field in the pack frontmatter is below **0.6**.

Stale status is flagged at S10 weekly readout (only for businesses where the LOGISTICS container applies).

### Consumers

| Consumer | Consumption Mode | What is read |
|---|---|---|
| S4 join barrier (`/lp-baseline-merge`) | Optional, conditional — absent-safe (must not fail if file missing) | Full pack; enriches baseline snapshot with fulfillment constraints and cost assumptions |
| Layer B fact-find (`/lp-do-fact-find`) | Optional consumer — absent-safe | Fulfillment and supply chain constraints, cost stack, lead times, confidence |
| S10 weekly readout | Standing freshness check (only when LOGISTICS applies) | `confidence` field and `last_updated` date only |

All consumers listed above must implement the R6 LOGISTICS consumer safety rule: absence of `logistics-pack.user.md` is not an error condition. Skills and templates that read this pack must check for file presence before reading and must document the skip when the file is absent.

### Conditionality

`conditional: true` — Applies only when `business_profile includes logistics-heavy OR physical-product`. The pack is absent for all other business profiles; consumer absence-safety is mandatory per Rule R6.

### Required Sections

When the file exists, every `logistics-pack.user.md` file must contain the following sections, in order:

1. `## ICP Summary` — logistics-context notes: which customer segments or order types drive the most fulfillment complexity; gift wrapping, personalisation, or packaging requirements by segment.
2. `## Key Assumptions` — up to 10 enumerated supply chain and fulfillment assumptions, each with a confidence score (`0.0`–`1.0`) and source reference.
3. `## Confidence` — overall pack confidence score (`0.0`–`1.0`) plus `confidence_reason` narrative.
4. `## Evidence Sources` — list of primary evidence artifacts consumed (LOGISTICS-01..06 output paths, supplier data dates).
5. `## Open Questions` — unresolved logistics gaps, each with owner and target resolution stage or date.
6. `## Change-log` — append-only update log: date, change summary, trigger event.

Frontmatter must include: `artifact: logistics-pack`, `business: <BIZ>`, `producer_stage: LOGISTICS-07`, `confidence: <float>`, `last_updated: <ISO date>`, `status: Active | Stale | Draft`, `conditional: true`, `condition: "business_profile includes logistics-heavy OR physical-product"`.

---

## Cross-Pack Rules

### Common Section Schema

All four packs share the six-section schema defined per-pack above (`## ICP Summary`, `## Key Assumptions`, `## Confidence`, `## Evidence Sources`, `## Open Questions`, `## Change-log`). This schema aligns with the carry-mode taxonomy in `carry-mode-schema.md`: `## Key Assumptions` and `## Confidence` fields are `revision`-mode (updated on each refresh cycle); `## Evidence Sources` pointers are `link`-mode (updated only when the underlying source artifact is re-run); `## Change-log` is append-only.

### Absent-Pack Safety

Consumers must treat any absent pack file as equivalent to a pack with confidence `0.0`. The downstream process must document the absence and its confidence impact, not silently proceed with missing assumptions. This applies to S4 join, fact-find briefings, and S10 readout equally.

### Staleness Threshold

The 90-day / confidence-0.6 threshold is uniform across all four packs. This threshold is defined in `two-layer-model.md` (Layer A Lifecycle and Staleness section) and reproduced here for reference. The threshold must not be overridden per pack without amending `two-layer-model.md`.

### S4 Consumption Pattern

At S4 join, `/lp-baseline-merge` reads any present pack files and merges their `## Key Assumptions` and `## Confidence` data into the baseline snapshot. Absent packs produce no input rows in the baseline snapshot — they do not produce empty placeholders. The operator is not required to resolve pack absences before S4 can proceed; all four packs are optional at S4.

---

## References

- Design authority: `docs/business-os/startup-loop/two-layer-model.md` (Rule R5, Rule R6)
- Carry-mode semantics: `docs/business-os/startup-loop/carry-mode-schema.md`
- Stage topology: `docs/business-os/startup-loop/loop-spec.yaml` (S4 required_inputs block)
- Artifact registry: `docs/business-os/startup-loop/artifact-registry.md`
- Related plan: `docs/plans/startup-loop-standing-info-gap-analysis/plan.md` (TASK-07)
