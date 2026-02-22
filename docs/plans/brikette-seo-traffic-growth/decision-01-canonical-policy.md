# DECISION-01 — Canonical URL Policy Approval

Date: 2026-02-22
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`
Decision ID: `DECISION-01`

## Decision

Approved: **slashless canonical policy (Option A)**.

## Approver

- Peter Cowling (operator)
- Approval source: chat instruction — "go with option a"

## Scope of Approval

- Canonical tags should use slashless URLs.
- hreflang alternate URLs should use slashless URLs.
- Sitemap `<loc>` URLs should use slashless URLs.
- Runtime slash redirects remain as-is (slash form redirects to slashless final URL).

## Evidence References

- Pre-change canonical baseline: `docs/plans/brikette-seo-traffic-growth/task-03a-gsc-canonical-baseline.md`
  - Baseline mismatch on measurable subset: `2/4` (`50%`) where both declared and Google-selected canonicals were returned.

## Rationale

Slashless aligns with current runtime behavior and removes canonical-to-redirect mismatch without adding new redirect-surface complexity across locales.

## Downstream Impact

- Unblocks policy gate for `TASK-02`.
- `TASK-02` confidence was uplifted to execution threshold and implemented on 2026-02-22.
