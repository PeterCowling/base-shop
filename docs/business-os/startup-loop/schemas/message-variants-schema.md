---
Type: Schema-Contract
Status: Active
Version: 1.0.0
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-03-09
Last-updated: 2026-03-09
Owner: startup-loop maintainers
Related-capability: CAP-02 (docs/business-os/startup-loop/contracts/marketing-sales-capability-contract.md)
Related-plan: docs/plans/startup-loop-cap02-message-variants/micro-build.md
---

# Message Variants Schema

## Purpose

Defines the canonical ledger for message testing across startup-loop businesses. This schema exists
so copy, framing, and verbal pitch learning can be recorded once and reused across channel strategy,
marketing drafting, boutique outreach, and weekly review.

This ledger is broader than ad testing. It applies to:
- social captions and hooks
- homepage / PDP hero lines
- Etsy listing titles and framing
- boutique or retailer verbal pitch wording
- packaging inserts and product cards

## Canonical Artifact Path

Store the business-specific ledger at:

`docs/business-os/strategy/<BIZ>/message-variants.user.md`

## When to Use

| Moment | Action |
|---|---|
| ASSESSMENT / MEASURE-01 | Initialize the ledger with the first active message hypotheses and planned variants |
| SELL-01 strategy work | Refresh active frames and note which channels or surfaces each frame belongs to |
| Drafting marketing or outreach assets | Reuse or branch from existing variants instead of inventing new copy in isolation |
| Weekly review (S10 / `/lp-weekly`) | Mark which variants are still active, stale, promoted, or retired |
| Pre-SELL-08 paid activation | Enforce the denominator-bearing pass floor for active hypotheses |

## Required Sections

Every `message-variants.user.md` artifact must include:

1. `## Current Status`
2. `## Active Hypotheses`
3. `## Variant Ledger`
4. `## Gate Status`

## Variant Row Schema

Each ledger row must include the following fields.

| Field | Required | Validation rule |
|---|---|---|
| `variant_id` | yes | Stable ID, unique within the business ledger |
| `hypothesis_id` | yes | Must map to a row in `## Active Hypotheses` |
| `channel` | yes | Named lane, for example `instagram-organic`, `etsy-listing`, `boutique-staff`, `homepage`, `product-card` |
| `surface` | yes | Concrete placement, for example `hero-line`, `caption-hook`, `verbal-pitch`, `swing-tag` |
| `audience_slice` | optional | Use when the variant is aimed at a specific buyer or partner segment |
| `primary_frame` | yes | Short label such as `fashion-accessory-first`, `gift-discovery`, `supportive-utility`, `dog-subline` |
| `variant_text` | yes | Actual line, pitch, or copy summary being tested |
| `source_tag` | yes | Non-empty origin tag for attribution, even if approximate for offline activity |
| `first_used_at` | yes | ISO date or timestamp |
| `last_observed_at` | yes | ISO date or timestamp |
| `denominator_type` | yes | One of `impressions`, `views`, `visits`, `conversations`, `pitches`, `product-card-explanations`, `unknown` |
| `denominator` | yes | Integer `>= 0`; use `0` only when `denominator_type: unknown` or the row is still planned |
| `outcome_type` | yes | One of `sales`, `purchase-intent`, `dm`, `reply`, `save`, `click`, `positive-reaction`, `unknown` |
| `outcome_count` | yes | Integer `>= 0` |
| `evidence_grade` | yes | `planned`, `qualitative-only`, or `denominator-bearing` |
| `status` | yes | `planned`, `active`, `observed`, `retired`, or `deferred` |
| `decision` | yes | `keep-testing`, `promote`, `retire`, `defer`, or `do-not-scale-yet` |
| `qualitative_signals` | optional | Short note that separates observed language from inference |

## Source Tag Rules

- Digital channels should use the closest real attribution key available (`utm_*`, post ID, listing slug, campaign key).
- Offline channels must still use a stable non-empty tag, for example `offline_luisa_positano_2026-03-08`.
- Empty `source_tag` values are invalid even for boutique or verbal-pitch rows.

## CAP-02 Gate Rules

### Initialization threshold

CAP-02 is initialized when:
- the ledger exists at the canonical path, and
- at least one hypothesis row and one variant row are present.

### Paid-activation pass floor

CAP-02 passes the hard pre-paid gate only when all of the following are true for each active
hypothesis:

1. At least 2 variants have `evidence_grade: denominator-bearing`.
2. Each denominator-bearing variant has non-zero `denominator`, non-empty `source_tag`, and valid timestamps.
3. Each denominator-bearing variant has an explicit `decision`.

### Early offline / qualitative policy

Rows with `evidence_grade: qualitative-only` are valid and should be logged. They are useful for:
- boutique pitch learning
- product-card or packaging feedback
- first sales where denominator is unknown
- customer language capture before tracking is mature

These rows do **not** satisfy the paid-activation pass floor on their own.

## Recommended Hypothesis Table

The `## Active Hypotheses` section should use this minimum structure:

| Hypothesis ID | Frame | Status | Success signal | Notes |
|---|---|---|---|---|
| `HBAG-MSG-H1` | `fashion-accessory-first` | active | buyers describe it as an on-bag accessory first | ... |

## Example Variant Ledger

```markdown
| Variant ID | Hypothesis ID | Channel | Surface | Primary frame | Variant text | Source tag | First used | Last observed | Denominator type | Denominator | Outcome type | Outcome count | Evidence grade | Status | Decision | Qualitative signals |
|---|---|---|---|---|---|---|---|---|---|---:|---|---:|---|---|---|---|
| HBAG-V001 | HBAG-MSG-H1 | boutique-staff | verbal-pitch | fashion-accessory-first | Tiny Amalfi-Coast accessory designed to live on your main handbag. | offline_luisa_positano_2026-03-08 | 2026-03-02 | 2026-03-08 | unknown | 0 | sales | 1 | qualitative-only | observed | keep-testing | First off-season sale recorded; denominator still unknown. |
| HBAG-V002 | HBAG-MSG-H1 | instagram-organic | caption-hook | fashion-accessory-first | Made to be shown on the bag, not hidden in it. | ig_org_onbag_v1 | 2026-03-10 | 2026-03-17 | impressions | 640 | dm | 6 | denominator-bearing | observed | promote | Saved more often than the utility-first caption. |
```

## References

- Capability contract: `docs/business-os/startup-loop/contracts/marketing-sales-capability-contract.md`
- Demand Evidence Pack schema: `docs/business-os/startup-loop/schemas/demand-evidence-pack-schema.md`
- Consumers:
  - `.claude/skills/lp-channels/SKILL.md`
  - `.claude/skills/draft-marketing/SKILL.md`
  - `.claude/skills/draft-outreach/SKILL.md`
  - `.claude/skills/lp-weekly/modules/orchestrate.md`
