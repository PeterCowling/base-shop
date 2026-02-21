---
Type: Runbook
Status: Active
Domain: Platform
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
---

# Hypothesis Portfolio Operator Runbook

## Purpose

Operate hypothesis lifecycle and portfolio scoring safely, with explicit guardrails and reproducible outputs.

## Prerequisites

- Repository dependencies installed (`pnpm install`)
- Portfolio metadata configured for the target portfolio card
- Operator has a reason-ready override policy before using `--force`
- Run commands through a host wrapper that injects `HypothesisStorageBackend` into `runHypothesisPortfolioCli(...)`

## Core Command Sequence

### 1) Set/Update portfolio metadata

```bash
hypothesis-portfolio portfolio-set \
  --portfolio-card-id BRIK-PORT-1 \
  --max-concurrent 1 \
  --monthly-budget 8000 \
  --default-value-unit USD_GROSS_PROFIT \
  --default-value-horizon-days 90
```

### 2) Create a hypothesis

```bash
hypothesis-portfolio create \
  --business BRIK \
  --title "Breakfast upsell bundle" \
  --type offer \
  --prior-confidence 60 \
  --value-unit USD_GROSS_PROFIT \
  --value-horizon-days 90 \
  --upside 22000 \
  --downside 1200 \
  --required-spend 350 \
  --required-effort-days 2 \
  --stopping-rule "Stop after 10 days if no uplift"
```

### 3) Rank hypotheses with blocked reasons

```bash
hypothesis-portfolio rank \
  --business BRIK \
  --portfolio-card-id BRIK-PORT-1 \
  --show-blocked
```

Expected behavior:

- Admissible hypotheses return ranked output.
- Inadmissible hypotheses include explicit reason (`negative_ev`, `unit_horizon_mismatch`, `non_monetary_unit_requires_conversion`, or validation failures).

### 4) Activate with guardrails

```bash
hypothesis-portfolio set-status \
  --id <IDEA_ID> \
  --status active \
  --portfolio-card-id BRIK-PORT-1
```

If constraints fail, command exits non-zero with `activation_blocked:<reason>`.

### 5) Forced activation (exception path)

```bash
hypothesis-portfolio set-status \
  --id <IDEA_ID> \
  --status active \
  --portfolio-card-id BRIK-PORT-1 \
  --force \
  --force-reason "operator-override: urgent learning slot"
```

Override policy:

- `--force` is allowed only with `--force-reason`
- override metadata must be present in stored hypothesis:
  - `activation_override=true`
  - `activation_override_reason`
  - `activation_override_at`
  - `activation_override_by`

## Prioritize Bridge Operation

Use explicit linkage only:

- `hypothesis_id=<id>` or
- tag `hypothesis:<id>`

Behavior:

- Linked + admissible hypothesis: inject portfolio-normalized score.
- Linked + blocked hypothesis: return blocked reason and zero injection.
- Linked + missing metadata: keep baseline score and mark `metadata_missing`.
- Unlinked: keep baseline `(Impact + Learning-Value) / Effort`.

Reference:

- `scripts/src/hypothesis-portfolio/prioritize-bridge.ts`
- `docs/business-os/hypothesis-portfolio/integration-guide.md`

## Rehearsal / Verification

Run deterministic rehearsal:

```bash
node --import tsx scripts/src/hypothesis-portfolio/rehearsal-fixtures.ts
```

Verify:

- ranking contains both admissible and blocked outputs,
- activation guard blocks a constrained candidate,
- forced activation metadata is present,
- prioritize bridge shows linked applied + linked blocked + unlinked baseline behavior.

Supplemental verification:

```bash
pnpm --filter scripts test -- src/hypothesis-portfolio/__tests__/cli.test.ts
pnpm --filter scripts test -- src/hypothesis-portfolio/__tests__/prioritize-bridge.test.ts
```

## Troubleshooting

- `invalid_hypothesis:*`: check required fields and lifecycle date invariants.
- `activation_blocked:*`: fix capacity/budget/dependency constraints or use exception path with explicit reason.
- `portfolio metadata not found`: run `portfolio-set` for target card first.
- `conflict detected while writing hypothesis data`: refresh state and retry with latest entity version.
