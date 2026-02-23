---
Type: Decision-Record
Status: Approved
Created: 2026-02-23
Decision-Owner: petercowling
Related-Plan: docs/plans/unit-test-sufficiency-audit/plan.md
---

# Test Config Strategy (TASK-01)

## Decision
Adopt **Option C (hybrid)**:
- root-config by default
- package-local `jest.config.cjs` by exception when package-specific mapping/roots/coverage behavior is required

## Rationale
- The repo already contains many package-level Jest exceptions (custom `moduleNameMapper`, `roots`, and coverage behavior), so pure root-only is not durable.
- Pure local-only increases maintenance overhead and drift risk.
- Hybrid keeps most packages on a shared baseline while preserving necessary local special cases.

## Rule
1. Package `test` scripts may reference local `./jest.config.cjs` only when package-local behavior is required.
2. Otherwise, package `test` scripts should use the shared/root Jest config route defined in package policy.
3. All explicit `--config` targets must resolve to real files (enforced by TASK-02 guard).

## Current broken-path mapping for TASK-03
- `@apps/xa-b` (`apps/xa-b/package.json`): use package-local config (`./jest.config.cjs`) with governed runner invoked from package CWD.
- `@acme/telemetry` (`packages/telemetry/package.json`): use thin package-local wrapper config to preserve package-scoped tsconfig/root resolution.
- `@acme/theme` (`packages/theme/package.json`): use thin package-local wrapper config to preserve package-scoped tsconfig/root resolution.
- `@apps/xa-drop-worker` (`apps/xa-drop-worker/package.json`): use package-local config (`./jest.config.cjs`) and package-CWD governed invocation.

## Implementation note (2026-02-23)
Runtime probe showed `pnpm -w run test:governed` executes from repo root, so `--config ./jest.config.cjs` does not resolve package-local configs. TASK-03 therefore rewired these package scripts to invoke `../../scripts/tests/run-governed-test.sh` directly from package CWD.

## Consequence
TASK-03 should apply a mixed fix strategy instead of forcing all packages into one config pattern.
