---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: CI-Deploy
Created: 2026-02-01
Last-updated: 2026-02-01
Feature-Slug: brikette-staging-launch
Related-Plan: docs/plans/brikette-staging-launch-plan.md
---

# Brikette Staging Launch — Fact-Find Brief

## Scope

### Summary

You want to **finalise a “launch to staging”** for the `apps/brikette` app: i.e. make sure the repo’s CI + deploy pipeline can deploy Brikette to its **Cloudflare Pages staging URL** reliably, and that the post-deploy checks are aligned with what Brikette actually serves.

### Goals

- Identify the **exact pipeline** that deploys Brikette to staging (triggers, steps, secrets).
- Identify **quality gates** that must pass before/after deploy.
- Identify the current **blockers** that would prevent a successful staging deployment.
- Produce an actionable list of **missing setup** (GitHub/Cloudflare) vs **missing code** (routes/endpoints/config).

### Non-goals

- Publishing Brikette to production / custom domain promotion (Brikette has a manual `workflow_dispatch` “publish_to_production” path, but this brief focuses on staging).
- Making code changes (this is a fact-find only deliverable).

### Constraints & Assumptions

- Constraint: Brikette deploy target is **Cloudflare Pages** using `next-on-pages` (see workflow and deploy command).
- Assumption (needs confirmation): “Launch to staging” means **staging deployment is green in GitHub Actions**, and the deployed site passes the repo’s health-check gate.

## Repo Audit (Current State)

### Entry Points

- `.github/workflows/brikette.yml` — Brikette pipeline orchestration.
  - Staging deploy job is defined as `jobs.staging` and calls the reusable workflow with:
    - `deploy-cmd`: `pnpm exec next-on-pages deploy ... --branch staging`
    - `environment-name`: `staging`
    - `environment-url`: `https://staging.<project>.pages.dev`
    - `healthcheck-args`: `--staging`
- `.github/workflows/reusable-app.yml` — shared app CI + deploy logic used by Brikette.
  - `jobs.validate-and-build` always runs for the caller workflow (lint/typecheck/test/build).
  - `jobs.deploy` runs **only when** `github.ref == 'refs/heads/main'` and `inputs.deploy-cmd != ''`.
    - Implication: **PRs do not deploy**; **only merges/pushes to `main` deploy**.
- `scripts/validate-deploy-env.sh` — deploy-time environment gate (fails on missing/placeholder vars).
- `scripts/post-deploy-health-check.sh` — post-deploy availability checks (homepage + extra routes).
- `packages/config/src/env-schema.ts` — schema marking which env vars are required for “deploy”.

### Key Modules / Files

- `apps/brikette/package.json` — Brikette build/test/typecheck scripts executed by the reusable pipeline.
- `docs/secrets.md` — repo-level SOPS/age secrets workflow guidance (note: Brikette currently has no `.env.*.sops` file under `apps/brikette/`).
- `.github/actions/decrypt-secrets/action.yml` — SOPS decryption action used by `reusable-app.yml`.

### Patterns & Conventions Observed

- App deploy workflows generally:
  1) Lint/typecheck/test/build in an app-scoped job
  2) Deploy on `main`
  3) Run `scripts/post-deploy-health-check.sh` with `EXTRA_ROUTES` defaulting to `/api/health` (in `reusable-app.yml`).

### Tests & Quality Gates

For Brikette PRs (and for pushes to `main`):

- Brikette app pipeline (`reusable-app.yml` via `brikette.yml`):
  - `pnpm --filter @apps/brikette lint`
  - `pnpm --filter @apps/brikette typecheck`
  - `pnpm --filter @apps/brikette test`
  - `pnpm --filter @apps/brikette... build`
  - Non-blocking (warn-only):
    - `pnpm --filter @apps/brikette validate-manifest --warn-only`
    - `pnpm --filter @apps/brikette report-coverage`

Separately, for PR merges the repo has a “merge gate” which blocks merging until the relevant workflows have succeeded:

- `.github/workflows/merge-gate.yml` — detects impacted workflows based on file paths and waits for them to succeed.

## Findings (What’s Required to Successfully “Launch to Staging”)

### A) You must merge to `main` to deploy

Because the reusable deploy job is guarded by `github.ref == 'refs/heads/main'`, Brikette staging deploy will only happen **after the PR is merged** (or a direct push) to `main`. A PR build can go green without ever deploying.

### B) Cloudflare deploy secrets must exist in GitHub Actions

Brikette’s deployment uses Cloudflare Pages (`next-on-pages deploy`) and the reusable workflow declares these as required secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

If either is missing, the reusable workflow cannot run its deploy step.

### C) The deploy environment gate must pass (`scripts/validate-deploy-env.sh`)

The reusable deploy job runs `scripts/validate-deploy-env.sh` before deploying.

Key risk to resolve: the script validates **process environment variables** (unless you pass an env file), but the workflows do not currently pass an `ENV_FILE` argument.

This means the staging deploy will only pass the gate if the required variables are present in the runner environment at deploy time (or the workflow is updated later to validate a decrypted file).

Baseline required-by-script (always required):
- `NEXTAUTH_SECRET`
- `SESSION_SECRET`
- `CART_COOKIE_SECRET`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Conditional requirements are enabled based on env values (e.g. `PAYMENTS_PROVIDER=stripe`, `SESSION_STORE_PROVIDER=redis`, `EMAIL_PROVIDER=...`).

### D) The post-deploy health check must match Brikette’s actual routes

After deploying, the reusable workflow runs:

- `scripts/post-deploy-health-check.sh <project-name> --staging`
- with `EXTRA_ROUTES` defaulting to `"/api/health"` in `reusable-app.yml`

Repo evidence indicates Brikette does **not** currently define an `/api/health` route under `apps/brikette/src/app/api/**`.

If Brikette is deployed via `reusable-app.yml` without overriding `EXTRA_ROUTES`, a staging deploy will likely fail at the post-deploy health check due to a 404 on `/api/health`.

## Questions

### Resolved

- Q: What triggers a Brikette “deploy to staging”?
  - A: A push/merge to `main` that touches Brikette or its dependency paths triggers `.github/workflows/brikette.yml`, which calls `reusable-app.yml` to deploy to Cloudflare Pages `--branch staging`.
  - Evidence: `.github/workflows/brikette.yml`, `.github/workflows/reusable-app.yml`

### Open (User Input Needed)

- Q1: What does “launch to staging” mean operationally for you?
  - Why it matters: This sets the acceptance criteria (green pipeline only vs. also “URL verified by human”, vs. also “content smoke checks”, etc.).
  - Decision impacted: What we consider “done” and what checks to add/adjust.

- Q2: Where are Brikette’s deploy-time environment variables intended to live today?
  - Options observed in-repo:
    - GitHub Secrets / GitHub Environment secrets (and then exported into steps)
    - SOPS-encrypted `apps/brikette/.env.<env>.sops` decrypted in CI
    - Cloudflare Pages environment variables (configured in Cloudflare UI)
  - Why it matters: `scripts/validate-deploy-env.sh` runs in CI *before deploy* and can only validate what it can see.
  - Decision impacted: Whether we add SOPS files for Brikette, or wire the workflow to validate a decrypted file, or export env vars explicitly.

- Q3: Should Brikette expose a stable health endpoint (recommended), or should the health check be homepage-only?
  - Why it matters: The reusable workflow currently checks `/api/health` for all apps.
  - Decision impacted: Implement `apps/brikette/src/app/api/health/route.ts` vs. override `EXTRA_ROUTES` for Brikette.

- Q4: Is the Cloudflare Pages project name actually `brikette`, or is `vars.BRIKETTE_PAGES_PROJECT` set to something else?
  - Why it matters: It controls the deploy target and the computed staging URL `https://staging.<project>.pages.dev`.
  - Decision impacted: Where you should look for the deployed site and which Pages project needs setup.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 60%
  - Blockers: unclear current env source for `validate-deploy-env` and missing evidence of `/api/health` route in Brikette.
- **Approach:** 85%
  - Reusable workflow approach is sound; likely change is “align health check contract + env sourcing”.
- **Impact:** 80%
  - Primary blast radius is CI/deploy workflows + Brikette’s public runtime routes; limited effect on other app code unless the reusable workflow contract changes.

## Planning Constraints & Notes

- Must preserve the “non-leaky” secret validation behavior (no logging values).
- Prefer a single shared health-check contract across apps; if diverging, keep it explicit at the workflow callsite (avoid hidden behavior).
- Deploy should remain gated to `main` unless there is a deliberate decision to deploy previews from PRs.

## Suggested Task Seeds (Non-binding)

- Add a lightweight Brikette health endpoint (`/api/health`) suitable for Cloudflare Pages + Next.js App Router.
- Decide and document how Brikette secrets are sourced:
  - Add `apps/brikette/.env.preview.sops` and/or `apps/brikette/.env.production.sops`, or
  - Export required vars from GitHub Secrets into the deploy job environment, or
  - Update validation to point at a decrypted env file (if that’s the intended design).
- Confirm Cloudflare Pages project exists, and staging URL resolves to the expected deployment.
- Add a short “Brikette staging deploy” runbook section to the most appropriate doc (likely `docs/deploy-health-checks.md` or a Brikette-specific doc under `apps/brikette/docs/`).

## Planning Readiness

- Status: Needs-input
- Blocking items:
  - Clarify desired staging acceptance criteria (Q1).
  - Confirm env-variable source of truth for deploy gate (Q2).
  - Decide health check contract (`/api/health` vs homepage-only) (Q3).
  - Confirm project name / staging URL (Q4).
