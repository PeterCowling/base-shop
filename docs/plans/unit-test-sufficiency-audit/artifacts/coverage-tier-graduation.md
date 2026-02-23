---
Type: Artifact
Status: Complete
Domain: Repo
Last-reviewed: 2026-02-23
Relates-to: docs/plans/unit-test-sufficiency-audit/plan.md
---

# Coverage Tier Graduation Matrix

## Evidence Inputs
- TASK-05 signal (`apps/product-pipeline`): targeted suite expanded from 1 to 4 test files; focused coverage run over newly-covered modules reported `Statements 90.4%`, `Branches 69.23%`, `Functions 94.11%`, `Lines 95.41%`.
- TASK-06 signal (`apps/xa-b`): targeted suite expanded from 4 to 8 test files; focused coverage run over newly-covered modules reported `Statements 78.98%`, `Branches 44.57%`, `Functions 60.34%`, `Lines 81.42%`.
- TASK-07 signal (`@acme/types`): schema composition suite expanded to include `tabs`, `tabs-accordion-container`, `page/history` contracts; coverage gate run (`sh scripts/check-coverage.sh @acme/types`) reported `Statements 73%`, `Branches 0%`, `Functions 51%`, `Lines 74%`.
- Policy baseline: current tier map in `packages/config/coverage-tiers.cjs`.

## Graduation Matrix
| Scope | Current Tier | Current Signal | Risk Envelope | Proposed Tier | Rationale |
|---|---|---|---|---|---|
| `@acme/types` | `MINIMAL` | Expanded schema-composition contracts; non-zero package-wide coverage across statements/functions/lines with stable targeted runtime | Branch metric is structurally low in this schema-heavy package (0% in measured runs), so `STANDARD` is not an evidence-fit tier this cycle | `SCHEMA_BASELINE` (`70/0/50/70`) | Promotes from zero enforcement to non-zero guardrails while matching observed package shape |
| `@apps/product-pipeline` | `MINIMAL` | Breadth improved materially and focused module coverage is high (`90.4/69.23/94.11/95.41`) | Full-package coverage baseline is not yet stable enough for a confident tier ratchet in this cycle | Keep `MINIMAL` (defer) | Avoid premature threshold churn; re-evaluate after package-wide coverage baseline hardening |
| `@apps/xa-b` | `STANDARD` (default) | Breadth improved; focused module coverage shows progress (`78.98/44.57/60.34/81.42`) | No explicit package-tier override currently; broad package baseline still not established in this cycle | No change | Out of this ratchet scope because it is already non-minimal by default |
| `@apps/prime`, `@apps/cochlearfit`, `@apps/xa-drop-worker` | `MINIMAL` | No new breadth work in this cycle | Insufficient new evidence | Keep `MINIMAL` | No promotion without fresh scope-specific evidence |

## Recommended Promotion Set
1. Promote `@acme/types` from `MINIMAL` to `SCHEMA_BASELINE`.

## Deferred Set
1. Keep `@apps/product-pipeline` on `MINIMAL` until package-wide coverage baseline and runtime cost are re-validated.
2. Keep other existing `MINIMAL` runtime scopes unchanged in this cycle.

## Rollback Envelope
- If the `@acme/types` promotion causes unacceptable local coverage friction, revert only that mapping to `MINIMAL` and retain the script/dynamic-threshold alignment work.
