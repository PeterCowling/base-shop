---
Type: Build-Record
Status: Complete
Domain: Infra
Last-reviewed: 2026-03-11
Feature-Slug: brikette-ci-release-lane-simplification
Execution-Track: code
Completed-date: 2026-03-11
artifact: build-record
Build-Event-Ref: docs/plans/brikette-ci-release-lane-simplification/build-event.json
---

# Build Record: Brikette CI Release Lane Simplification

## Outcome Contract

- **Why:** The current Brikette CI and deploy flow is harder to reason about than it should be. The operator wants one straightforward release model: changed-only validation on dev, staging as the preview lane reached by merge, and main as the live lane reached by merge.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Brikette has an analysis-ready fact-find for a simplified GitHub Actions setup where dev performs changed-only lint, typecheck, and tests in CI, staging is a merge-only preview lane, and main is a merge-only production lane.
- **Source:** operator

## What Was Built

Brikette now uses a single active workflow in [brikette.yml](/Users/petercowling/base-shop/.github/workflows/brikette.yml). That workflow runs changed-scope validation on `dev` pushes and Brikette-relevant pull requests, then publishes only from merge-driven `staging` and `main` pushes. Manual publish entrypoints were removed. Workflow-only edits still trigger GitHub workflow checks, but they do not publish staging or production.

The duplicated export logic was collapsed into [build-static-export.sh](/Users/petercowling/base-shop/scripts/brikette/build-static-export.sh). Both staging and production now use that helper for the route-hide, export, route-normalization, redirect generation, and rendered-output verification flow. Production keeps the post-deploy health checks and cache-header check directly in `brikette.yml`.

Core CI in [ci.yml](/Users/petercowling/base-shop/.github/workflows/ci.yml) now ignores pure `apps/brikette/**` and Brikette-specific workflow/helper-script changes, so Brikette app-only work no longer triggers broad core-CI governance. Shared package changes still remain eligible for core CI. Current documentation was updated in [github-setup.md](/Users/petercowling/base-shop/docs/github-setup.md), [testing-policy.md](/Users/petercowling/base-shop/docs/testing-policy.md), [brikette-deploy-decisions.md](/Users/petercowling/base-shop/docs/brikette-deploy-decisions.md), and [safe-github-update-strategy-briefing.md](/Users/petercowling/base-shop/docs/briefs/safe-github-update-strategy-briefing.md).

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `actionlint .github/workflows/brikette.yml .github/workflows/ci.yml` | Pass | Verified workflow syntax after the refactor. |
| `bash -n scripts/brikette/build-static-export.sh scripts/post-deploy-health-check.sh scripts/post-deploy-brikette-cache-check.sh` | Pass | Shell syntax validation for the new export helper and reused deploy checks. |
| `node -e "require('./scripts/ci/path-classifier.cjs'); console.log('PATH_CLASSIFIER_OK')"` | Pass | Confirmed the updated standalone path-classifier loads cleanly. |
| `git diff --check -- .github/workflows/brikette.yml .github/workflows/ci.yml scripts/brikette/build-static-export.sh scripts/src/ci/filter-config.ts scripts/ci/path-classifier.cjs docs/github-setup.md docs/testing-policy.md docs/brikette-deploy-decisions.md docs/briefs/safe-github-update-strategy-briefing.md` | Pass | No whitespace or patch-format issues in the touched files. |
| `scripts/validate-plan.sh docs/plans/brikette-ci-release-lane-simplification/plan.md` | Pass | Final plan schema validation. |
| `scripts/validate-engineering-coverage.sh docs/plans/brikette-ci-release-lane-simplification/plan.md` | Pass | Final engineering-coverage validation. |

## Workflow Telemetry Summary

Recorded workflow telemetry for analysis, plan, and build for this slug. Token measurement coverage reached 100%. The final build-stage record captured `1` loaded module (`modules/build-code.md`), `95,434` context bytes, `1` deterministic check, and a present `build-record.user.md` artifact. Combined across the recorded stages, the slug captured `3` workflow-step records and `4` deterministic checks.

## Validation Evidence

### TASK-01
- TC-01-A: `actionlint .github/workflows/brikette.yml .github/workflows/ci.yml` passed.
- TC-01-B: `.github/workflows/brikette.yml` no longer contains `workflow_dispatch`.
- TC-01-C: `deploy-staging` and `deploy-production` in `.github/workflows/brikette.yml` are gated by branch push plus `deploy_surface_changed == 'true'`.

### TASK-02
- TC-02-A: `actionlint .github/workflows/brikette.yml .github/workflows/ci.yml` passed after the `ci.yml` carve-out.
- TC-02-B: `.github/workflows/ci.yml` path ignores now exclude only `apps/brikette/**`, `.github/workflows/brikette.yml`, and `scripts/brikette/build-static-export.sh`; shared packages remain outside the carve-out.
- TC-02-C: Current docs now describe merge-driven staging/main publication with no manual Brikette publish path.

### TASK-03
- TC-03-A: `scripts/validate-plan.sh docs/plans/brikette-ci-release-lane-simplification/plan.md` passed.
- TC-03-B: `scripts/validate-engineering-coverage.sh docs/plans/brikette-ci-release-lane-simplification/plan.md` passed.
- TC-03-C: `actionlint .github/workflows/brikette.yml .github/workflows/ci.yml` passed.
- TC-03-D: `git diff --check -- ...` passed for the touched files.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | No product UI changed. |
| UX / states | Pass | Branch and trigger behavior is now explicit: `dev`/PR validate, `staging` previews, `main` publishes live. |
| Security / privacy | Pass | Manual publish entrypoints were removed from Brikette's active release path. |
| Logging / observability / audit | Pass | One active Brikette workflow now owns validation and publish visibility; production health checks remain in place. |
| Testing / validation | Pass | Changed-scope CI validation is explicit in `brikette.yml`; local verification covered YAML, shell, diff hygiene, and plan validators. |
| Data / contracts | Pass | Workflow triggers, path-ignore behavior, and path-classifier scope were updated together. |
| Performance / reliability | Pass | Duplicate staging-fast workflow removed; workflow-only changes no longer publish staging or production. |
| Rollout / rollback | Pass | Roll forward uses normal `dev -> staging -> main` merges; rollback is a straight workflow/doc reversion. |

## Scope Deviations

One adjacent fix was applied inside `.github/workflows/ci.yml`: an existing shellcheck issue (`SC2155`) in the docs-lint step had to be corrected before `actionlint` would pass on the touched workflow set. This did not expand product scope; it was necessary to validate the modified workflow file cleanly.
