---
Type: Guide
Status: Active
Domain: Platform
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
---

# Hypothesis Portfolio -> /lp-prioritize Integration Guide

## Purpose

Define how hypothesis portfolio scoring is injected into `/lp-prioritize` while preserving backward compatibility for unlinked go-items.

## Linkage Contract

A prioritize candidate is considered linked to a hypothesis when either condition is true:

- `hypothesis_id` is present on the candidate record.
- candidate tags include `hypothesis:<id>`.

If neither exists, the candidate is unlinked and remains on baseline scoring.

## Baseline Scoring (Unlinked)

Unlinked candidates keep the existing `/lp-prioritize` score:

- `baseline_score = (Impact + Learning-Value) / Effort`

No portfolio score is applied.

## Portfolio Injection (Linked)

When portfolio metadata exists, linked candidates are evaluated against ranked hypotheses:

1. rank hypotheses with `rankHypotheses(...)`.
2. map hypothesis `composite_score` to `/lp-prioritize` scale `[1,5]`.
3. inject mapped score as `final_score` for linked candidates.

Mapping policy:

- `N < 10`: min-max map to `[1,5]`.
- `N >= 10`: nearest-rank p10/p90 anchor map, clamped to `[1,5]`.
- flat distributions: neutral fallback `3`.

## Blocked and Missing Cases

- `metadata missing`: do not fail, keep baseline score and mark status `metadata_missing`.
- `linked hypothesis blocked` (for example `negative_ev`, `unit_horizon_mismatch`, `non_monetary_unit_requires_conversion`): set `portfolio_status=blocked`, expose `blocked_reason`, inject `0`.
- `linked hypothesis not found`: set `portfolio_status=hypothesis_not_found`, inject `0`.

## Output Shape (Bridge)

Bridge output per candidate includes:

- `baseline_score`
- `portfolio_score_normalized` (`null` when not applied)
- `final_score`
- `portfolio_status`
- `blocked_reason` (when applicable)

This makes linkage behavior explicit and auditable.

## Operational Notes

- Portfolio injection is additive and explicit-linkage only.
- Unlinked items must not regress.
- Blocked linked hypotheses must surface reason text, not silently degrade.
- Keep bridge deterministic for repeatable ranking runs.
