---
Type: Micro-Build
Status: Complete
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: brikette-release-lane-separation
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309202500-9401
Related-Plan: none
---

# Brikette Release Lane Separation Micro-Build

## Scope

- Change:
  - Separate Brikette's fast staging deployment path from its `dev -> main` release validation path.
  - Make staging pushes use the passthrough Pages deploy workflow only, without the full reusable validate/test chain.
  - Reframe the `dev -> main` path so GitHub checks are release CI, not staging-labeled deploy checks.
  - Align production publishing with the new release path so `main` is the production branch.
- Non-goals:
  - Rework Prime, Reception, or other app workflows in this wave.
  - Change Brikette app code or booking logic.
  - Remove the ability to deploy Brikette to staging for user testing.

## Execution Contract

- Affects:
  - `.github/workflows/brikette.yml`
  - `.github/workflows/brikette-staging-fast.yml`
- Acceptance checks:
  - A push to `staging` only triggers the fast staging deploy path for Brikette.
  - The `dev -> main` PR path runs Brikette validation under release-oriented naming, not `Deploy (staging)`.
  - `main` is the branch that can publish Brikette production from GitHub Actions.
- Validation commands:
  - `pnpm exec prettier --check .github/workflows/brikette.yml .github/workflows/brikette-staging-fast.yml`
  - `bash scripts/validate-changes.sh`
- Rollback note:
  - Revert the Brikette workflow changes if staging must temporarily resume the previous full validation path.

## Outcome Contract

- **Why:** The repo branch model now treats `staging` as a user-testing lane and `dev -> main` as the release lane, but Brikette's workflow still mixes those concepts and reports release failures as staging deploy tests.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Brikette staging pushes act as a fast passthrough deploy for user testing, while `dev -> main` runs clearly named release CI and `main` remains the production publishing branch.
- **Source:** operator

## Build Evidence

- `.github/workflows/brikette.yml` no longer listens to `staging` pushes.
- Brikette release checks now run under the `Release CI` job instead of `Deploy (staging)`.
- Release validation is limited to `dev` pushes and `dev -> main` PRs; staging PRs are no longer on the Brikette release-validation path.
- The reusable app lane used for release CI is now non-deploying for Brikette (`deploy_cmd: ""`, `deploy_enabled: false`).
- Production publishing is now enabled on `main` pushes in addition to the existing manual dispatch path.
- `.github/workflows/brikette-staging-fast.yml` is explicitly documented as the staging user-testing lane.

## Validation

- `pnpm exec prettier --check .github/workflows/brikette.yml .github/workflows/brikette-staging-fast.yml docs/plans/brikette-release-lane-separation/micro-build.md` — pass
- `git diff --check -- .github/workflows/brikette.yml .github/workflows/brikette-staging-fast.yml docs/plans/brikette-release-lane-separation/micro-build.md docs/business-os/startup-loop/ideas/trial/queue-state.json` — pass
- `bash scripts/validate-changes.sh` — fail, unrelated pre-existing repo failure in `.claude/skills/lp-do-build/SKILL.md` budget enforcement (`lp-do-build` 358 lines > allowed 345)

## Remaining Follow-up

- Prime, Reception, and other app workflows still use their own staging/release naming and may need the same lane separation if you want the repo model to be consistent beyond Brikette.
