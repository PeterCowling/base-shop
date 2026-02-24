---
Type: Artifact
Status: Complete
Domain: Repo
Last-reviewed: 2026-02-23
Relates-to: docs/plans/unit-test-sufficiency-audit/plan.md
---

# Coverage Tier Decision

## Decision
- Selected option: **Option B (partial promotion)**.
- Approval scope: promote only the scope supported by current evidence (`@acme/types`).

## Option Review
- Option A (`no ratchet`) was rejected because this cycle produced enough evidence for at least one safe promotion.
- Option B (`partial promotion`) was accepted as the lowest-risk way to convert test-breadth work into enforceable policy progress.
- Option C (`broad promotion`) was rejected due missing full-package coverage baselines for other `MINIMAL` runtime scopes.

## Approved Changes
1. Add `SCHEMA_BASELINE` tier in `packages/config/coverage-tiers.cjs` with thresholds:
   - `lines: 70`
   - `branches: 0`
   - `functions: 50`
   - `statements: 70`
2. Move `@acme/types` from `MINIMAL` to `SCHEMA_BASELINE`.
3. Align `scripts/check-coverage.sh` to consume tier metadata directly from `packages/config/coverage-tiers.cjs` so local gate behavior cannot drift from policy source-of-truth.

## Deferred Changes
1. Keep `@apps/product-pipeline` on `MINIMAL` in this cycle; revisit after package-wide coverage baseline and runtime cost are revalidated.
2. No tier-map change for `@apps/xa-b` because it is already `STANDARD` by default and was not a `MINIMAL` promotion target.

## Rollout Order
1. Land tier-definition + mapping changes.
2. Land local coverage-gate alignment (`scripts/check-coverage.sh`).
3. Land policy documentation updates (`docs/testing-policy.md`) and plan evidence updates.

## Rollback Triggers
- Revert the `@acme/types` mapping if local coverage checks become operationally noisy without adding regression signal.
- Keep dynamic tier-resolution in `scripts/check-coverage.sh` even if the mapping is rolled back, because it removes duplicated policy logic.
