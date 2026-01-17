---
Type: Plan
Status: Active
Domain: Repo
Last-reviewed: 2026-01-17
Relates-to charter: none
Created: 2026-01-17
Created-by: Codex
Last-updated: 2026-01-17
Last-updated-by: Codex (E2E-01 inventory, E2E-02 policy, E2E-03 consolidation, E2E-04 docs, owner naming)
---

# E2E Ownership Consolidation Plan

## Overview

Consolidate E2E ownership so it is clear which workflow runs which suites, which changes trigger them, and who owns failures. This plan focuses on workflow entry points and ownership boundaries, not rewriting tests.

## Problem Statement

E2E ownership is fragmented across root CI (`ci.yml`), the CMS Cypress workflow (`cypress.yml`), and app/workspace CI entry points. This makes it hard to understand coverage, creates duplicate runs, and blurs who is accountable for fixes.

## Goals

1. Single source of truth for E2E ownership, entry points, and triggers.
2. Clear boundary for root CI vs app/workspace workflows.
3. Predictable gating policy (what blocks merges vs what runs nightly/on-demand).
4. Minimal duplication of suites across workflows.

## Non-goals

- Rewrite existing E2E suites or change tooling (Cypress vs Playwright).
- Expand coverage beyond current suites as part of this plan.
- Change the broader CI path-filter strategy beyond E2E routing.

## Current State (audit snapshot)

- Root CI (`.github/workflows/ci.yml`) runs `pnpm e2e:shop` based on path filters.
- CMS E2E runs in `.github/workflows/cypress.yml` (smoke + dashboard).
- Workspace CI (`.github/workflows/test.yml`) runs `pnpm --filter <workspace> run e2e --if-present` per workspace.

## E2E Inventory (E2E-01)

| Suite / Command | Workflow | Triggers | Owner (current) | Notes |
| --- | --- | --- | --- | --- |
| `pnpm e2e:shop` | `.github/workflows/ci.yml` | `push` + `pull_request` (paths-ignore `apps/skylar/**`, `apps/cms/**`), gated by `dorny/paths-filter` `shop` changes in `apps/cover-me-pretty/**`, `apps/cms/**`, `packages/platform-core/**`, `packages/ui/**`, `packages/config/**`, `packages/i18n/**`, `packages/shared-utils/**` | Platform CI (CODEOWNERS: @petercowling) | Root workflow does not run on CMS-only changes; shop subset runs when root CI runs and filter matches. |
| Cypress E2E smoke (`pnpm exec cypress run ...` with `apps/cms/cypress.config.mjs`) | `.github/workflows/cypress.yml` | `push` (main) + `pull_request` when CMS + shared package paths change | CMS workflow (CODEOWNERS: @petercowling) | Matrix on browser + viewport; smoke-tagged suite. |
| Cypress E2E dashboard (`pnpm exec cypress run ... cms-a11y-dashboard.cy.ts`) | `.github/workflows/cypress.yml` | `push` (main) + `pull_request` when CMS + shared package paths change | CMS workflow (CODEOWNERS: @petercowling) | Chrome-only dashboard flow; moved from root CI in E2E-03. |
| `pnpm --filter ./${{ matrix.workspace }} run e2e --if-present` | `.github/workflows/test.yml` | `push` (main, paths-ignore `apps/skylar/**`, `apps/cms/**`), `schedule` nightly, `workflow_dispatch` | Workspace owners (workflow CODEOWNERS: @petercowling) | Runs per-workspace E2E only when a workspace defines `e2e`. |

## Ownership Policy (E2E-02)

**Rules**

1. **One suite, one owner, one workflow.** Every E2E suite has a single owning workflow; no duplicate execution in other workflows.
2. **Root CI = platform smoke only.** Root CI owns cross-app smoke journeys that validate platform integration and core shared flows. Root CI E2E gates merges/releases to `main`.
3. **App workflows = app depth.** App workflows own app-specific E2E/a11y suites and are the default for app-level regressions. App workflow failures do **not** block the base-shop release unless explicitly designated.
4. **Workspace matrix = broad, non-gating coverage.** Workspace E2E runs are scheduled or manually dispatched for broad coverage; avoid using this matrix for suites already owned by root CI or app workflows.

**Examples**

- `pnpm e2e:dashboard` and `pnpm e2e:shop` remain root CI smoke suites in `ci.yml` only.
- CMS Cypress smoke remains app-owned in `cypress.yml`; any overlapping flows in root CI or workspace matrix should be removed or retargeted in E2E-03.
- Workspaces with dedicated app workflows should not also run the same E2E suite in `test.yml` (keep matrix E2E for packages/apps without app workflows).

## Active Tasks

- [x] E2E-01: Inventory E2E suites, owners, and triggers
  - Scope: list each suite, its owner, workflow, trigger paths, and command entry point.
  - Dependencies: none.
  - Definition of done: a table added to this plan covering root CI, CMS Cypress, and workspace/app workflows.

- [x] E2E-02: Decide ownership boundaries and target topology
  - Scope: define which suites are root CI (cross-app smoke) vs app/workspace owned (app-specific depth).
  - Dependencies: E2E-01; align with `docs/plans/ci-deploy/ci-and-deploy-roadmap.md` P2.3.
  - Definition of done: written policy section in this plan with explicit rules and examples.

- [x] E2E-03: Consolidate workflow entry points
  - Scope: update workflows so each suite runs in one place; resolve CMS E2E placement; avoid duplicate E2E invocations across `ci.yml`, `cypress.yml`, and `test.yml`.
  - Dependencies: E2E-02.
  - Definition of done: workflow changes merged and any deprecated E2E paths removed or documented.
  - Implementation notes:
    - Root CI no longer runs the CMS dashboard E2E subset; CMS workflow now owns it.
    - Workspace matrix E2E is now `--if-present` to avoid duplicate or empty E2E runs.

- [x] E2E-04: Document ownership + runbook updates
  - Scope: update `docs/testing-policy.md` and `docs/cypress.md` with the finalized ownership and entry points.
  - Dependencies: E2E-03.
  - Definition of done: docs updated and linked from this plan.

## Related Docs

- `docs/repo-quality-audit-2026-01.md`
- `docs/plans/ci-deploy/ci-and-deploy-roadmap.md`
