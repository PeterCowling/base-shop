---
Type: Reference
Status: Active
Domain: Business OS
Last-reviewed: 2026-02-13
---

# Hypothesis Portfolio Storage Contract (v1)

## Scope

This contract defines how Hypothesis Portfolio artifacts are persisted using existing Business OS entities:

- hypotheses -> ideas,
- portfolio metadata -> stage-doc (`portfolio-state`).

No new database tables are introduced in v1.

## Entity Mapping

## Hypothesis -> Idea mapping

- Idea `tags`:
  - `hypothesis` (required),
  - `hyp:<hypothesis_type>` (required),
  - `unit:<value_unit>` (required).
- Idea `content`:
  - markdown with structured YAML-like frontmatter.
  - frontmatter must include `schema_version: 1`.
  - frontmatter keys match `docs/business-os/hypothesis-portfolio/schema.md`.

Canonical content shape:

```markdown
---
schema_version: 1
id: "BRIK-IDEA-0042"
hypothesis_key: "BRIK-HYP-042"
business: "BRIK"
title: "Terrace breakfast upsell improves booking margin"
hypothesis_type: "offer"
prior_confidence: 60
value_unit: "USD_GROSS_PROFIT"
value_horizon_days: 90
upside_estimate: 15000
downside_estimate: 2000
detection_window_days: 14
required_spend: 500
required_effort_days: 2
dependency_hypothesis_ids: []
dependency_card_ids: []
stopping_rule: "Stop if attach rate remains below 2% after 7 days"
status: "draft"
created_date: "2026-02-13T09:00:00.000Z"
owner: "pete"
---

Optional notes and rationale body.
```

Invalid content example:

```markdown
not-frontmatter-content
```

Expected behavior:
- parse does not crash,
- entry is returned in blocked set with reason `invalid_frontmatter`.

## Portfolio metadata -> Stage Doc mapping

- Stage doc key:
  - `stage = "portfolio-state"`.
- Stage doc `content`:
  - markdown with frontmatter and `schema_version: 1`.
  - frontmatter keys match portfolio metadata schema.

## CRUD Contract

Create:
- write new idea with required tags and hypothesis frontmatter.

Read:
- list ideas filtered by `business` and `hypothesis` tag.
- parse each idea frontmatter into `Hypothesis`.
- return two sets:
  - `hypotheses` (valid and in-domain),
  - `blocked` (invalid or ineligible with explicit reason).

Update:
- rewrite frontmatter fields on existing idea (`PATCH` semantics in repository/API layer).

Archive:
- set `status = archived` in frontmatter while preserving canonical `id`.

Portfolio metadata read/write:
- upsert stage-doc at `portfolio-state`.
- validate on write and on read.

## Query and Domain Contract

Default rank domain:

- `status in (draft, active)` unless caller expands scope.
- `value_unit` and `value_horizon_days` must match portfolio defaults.

Out-of-domain behavior:

- return in blocked set with reason `unit_horizon_mismatch`.
- do not hard-fail entire query when one record is out-of-domain.

EV ineligibility behavior:

- non-monetary or rate-like units return blocked reason:
  - `non_monetary_unit_requires_conversion`.

## Parse Failure Contract

- malformed frontmatter -> blocked reason `invalid_frontmatter`.
- parse errors are record-local:
  - one malformed hypothesis must not fail listing for other hypotheses.

## Override Audit Contract

Forced activation (`--force`) must persist:

- `activation_override = true`,
- `activation_override_reason`,
- `activation_override_at`,
- `activation_override_by`.

Missing override metadata when override is set is validation failure.

