---
Type: Plan
Status: Active
Domain: Repo
Last-reviewed: 2026-01-17
Relates-to charter: docs/runtime/runtime-charter.md
Audit-recommendation: P0.1
Created: 2026-01-17
Created-by: Codex (GPT-5.2)
Last-updated: 2026-01-17
Last-updated-by: Codex (GPT-5.2)
---

# Plan: Non-Interactive “Launch Shop” Pipeline

Source: `docs/repo-quality-audit-2026-01.md` (Recommendation `P0.1`).

## Summary

Create a single, non-interactive pipeline that chains:

1) create shop → 2) seed → 3) CI setup → 4) deploy → 5) smoke checks

…so a production-ready shop rollout is repeatable and can be executed in under 3 hours by an agent/operator without reading a large number of docs.

## Problem Statement

We have strong scaffolding primitives (`init-shop`, templates/themes, deploy adapters) but the end-to-end production path is not “one command”: it spans multiple scripts, prompts, manual CI/deploy wiring, and inconsistent post-deploy validation. This increases time-to-launch and makes rollouts error-prone.

## Goals (Outcomes)

1. **One command, no prompts**: a fully non-interactive path for a new shop when a config + secrets source is provided.
2. **Composed primitives**: reuse existing tooling (`init-shop`, `setup-ci`, deploy helpers, health checks) instead of creating parallel systems.
3. **Fast fail**: the pipeline aborts early on missing prerequisites, placeholder secrets, or invalid configs (before pushing/deploying).
4. **Auditable output**: pipeline writes a small launch report (what ran, where deployed, what checks passed) to support handoff.

## Non-Goals

- Building a bespoke “CI system” outside GitHub Actions.
- Automating provider account creation (Stripe/Shippers/CMS projects).
- Cleaning leaked secrets from git history (tracked as security work).

## Proposed UX / Contract

Add a new CLI entrypoint:

- `pnpm launch-shop --config <file> [--env-file <file> | --vault-cmd <cmd>] [--mode preview|production] [--dry-run]`

Contract:

- **Non-interactive by default** (no prompts). If required inputs are missing, it fails with a clear error.
- **Config-first**: `--config` describes the shop (theme/template/providers/pages) and launch options (CI/deploy/smoke).
- **Secrets-first**: `--env-file` or `--vault-cmd` must provide deploy-required secrets in strict modes; pipeline fails on `TODO_`.
- **Dry-run**: validates inputs and prints intended actions without writing files, deploying, or starting dev servers.

Example (preview deploy on a work branch + smoke checks):

```bash
pnpm launch-shop \
  --config profiles/shops/acme-sale.json \
  --env-file profiles/shops/acme-sale.env \
  --mode preview
```

### Secrets Sourcing Contract

The non-interactive path requires one of:

- `--env-file <path>`: a dotenv-style file containing `KEY=VALUE` lines (comments allowed). The pipeline reads it and writes/merges into `apps/<app>/.env`. Missing required keys fail preflight in strict modes; keys are never printed.
- `--vault-cmd <cmd>`: a command prefix invoked once per required key as:
  - `<cmd> <ENV_KEY>`

Contract for `--vault-cmd`:

- **Input**: the pipeline appends exactly one argument: the env var key name (for example `STRIPE_SECRET_KEY`).
- **Output**: print the secret value to stdout (trailing newline allowed). The pipeline trims whitespace.
- **Exit codes**:
  - exit `0` with a non-empty stdout value = secret present
  - non-zero exit, or empty stdout = secret missing → preflight fails in strict modes
- **Error handling**: failures must name missing keys but must not echo secret values; stderr may be logged if it does not contain secrets.

Strictness:

- `--mode production`: always strict (fail on missing keys and any `TODO_*` values).
- `--mode preview`: strict by default for deploy-required keys; can be relaxed only if the pipeline explicitly supports a “non-deploy preview” mode.

## Execution Model (How the Pipeline Chains Steps)

1. **Preflight**
   - Ensure runtime (`ensureRuntime`) and required CLIs for chosen mode (`git`, optionally `gh`, `wrangler/next-on-pages` if needed).
   - Validate working tree state (clean or explicitly allowed via flag).

2. **Create + Seed (existing primitives)**
   - Invoke `pnpm init-shop --skip-prompts --config ...` (or call `initShop()` via a refactor) with:
     - `--seed-full` (or a dedicated “launch seed” if introduced later)
     - `--defaults` when using template defaults
     - `--pages-template` if configured

3. **Secrets materialisation (strict for deploy)**
   - Populate `apps/<shop>/.env` from `--env-file` or `--vault-cmd`.
   - Fail if any deploy-required key is missing or still `TODO_*`.
   - Output a `.env.template` (already produced by `init-shop`) for auditability.

4. **CI setup (generated workflow)**
   - Generate or update a workflow for the new shop:
     - Must not embed secret values in the repo.
     - Must include post-deploy health checks (and optionally smoke tests).
     - Must follow repo testing policy (no unfiltered root `pnpm test`).

5. **Deploy**
   - Preview mode: deploy on a work branch (or via `workflow_dispatch`) so checks can run before merging.
   - Production mode: deploy on `main` (via merge), including the same post-deploy checks.

6. **Smoke checks**
   - Minimum: `scripts/post-deploy-health-check.sh` against home + `/api/health`.
   - Optional: reuse `pnpm test:shop-smoke` (requires known seed fixtures).

7. **Report**
   - Write `data/shops/<shop>/launch.json` (or similar) with:
     - config path + hash, git ref, workflow run URL, deploy URL, check outcomes.

## Failure Handling and Rollback

Define what happens when deploy succeeds but validation fails.

- Preview mode:
  - Treat preview deploys as disposable. If smoke checks fail, the pipeline stops and reports; the primary “rollback” is “do not merge to `main`”.
- Production mode (initial implementation):
  - No automatic rollback. The pipeline prints a minimal rollback playbook and exits non-zero:
    - Roll back the Cloudflare Pages deployment to the previous known-good deployment (or redeploy the previous git SHA).
    - If the deploy was triggered by a merge, revert the merge commit and redeploy.
    - Re-run health checks (`scripts/post-deploy-health-check.sh`) to confirm recovery.
  - Optional follow-up: add `--auto-rollback` once the deploy mechanism is standardized enough to make it safe.

## Delivery Strategy (Avoiding Plan Stall)

This plan should deliver an MVP “one command” flow even if related hardening plans are still in progress:

- MVP: orchestrator + config schema + secrets validation + workflow generation that references GitHub secrets and uses existing reusable deployment patterns (where possible).
- Hardening: align with the standardized secrets backend and mandatory health-check enforcement once those plans land.

## Active tasks

- **LAUNCH-00: Standardize shop ID + app slug normalization**
  - Status: ☐
  - Scope:
    - Define canonical forms for:
      - shop ID (`<id>` vs `shop-<id>`)
      - app package name (`@apps/shop-<id>`)
      - data path (`data/shops/<id>/...` vs `data/shops/shop-<id>/...`)
    - Update CLI tooling to accept a raw shop ID and derive all prefixed forms consistently.
  - Dependencies: none.
  - Definition of done:
    - `init-shop`, `quickstart-shop`, `setup-ci`, deploy info readers, and any launch scripts agree on the same normalization rules and produce consistent paths.

- **LAUNCH-01: Define launch config schema + examples**
  - Status: ☐
  - Scope:
    - Define the minimal JSON schema for `--config` (shop options + launch options).
    - Add one or two example configs (and a corresponding `.env.template`/example env file) in a predictable location (e.g. `profiles/shops/`).
  - Dependencies: none.
  - Definition of done:
    - A documented config shape exists and can be validated by the CLI.

- **LAUNCH-02: Implement `pnpm launch-shop` orchestrator**
  - Status: ☐
  - Scope:
    - Add `scripts/src/launch-shop.ts` (or `launchShop.ts`) that composes `init-shop`, secrets materialisation, CI setup, deploy trigger, and smoke checks.
    - Support `--mode preview|production`, `--dry-run`, and clear errors for missing inputs.
  - Dependencies: LAUNCH-00, LAUNCH-01.
  - Definition of done:
    - Running the command with a complete config performs all steps without prompting.

- **LAUNCH-03: Make generated CI workflows safe + standard**
  - Status: ☐
  - Scope:
    - Update `scripts/src/setup-ci.ts` generation so it:
      - Avoids committing secrets.
      - Uses a reusable workflow (preferred) or includes required health checks explicitly.
      - Aligns tests with repo policy (no unfiltered root test runs).
  - Dependencies:
    - LAUNCH-00.
    - Coordination: `docs/plans/post-deploy-health-checks-mandatory-plan.md` (DEPLOY-04) and `docs/plans/integrated-secrets-workflow-plan.md` (SEC-04/SEC-05) for full enforcement; MVP should not block on them.
  - Definition of done:
    - `setup-ci` output is safe, deploys with required checks, and works for newly generated shops.

- **LAUNCH-04: Preview deploy + smoke check integration**
  - Status: ☐
  - Scope:
    - Ensure the pipeline can produce a deployed preview URL without requiring a merge to `main`.
    - Add a CI step (or local step) that runs `scripts/post-deploy-health-check.sh` against the deployed URL.
  - Dependencies: LAUNCH-03.
  - Definition of done:
    - A work-branch launch yields a URL and verifies it automatically.

- **LAUNCH-05: Production rollout handoff + docs**
  - Status: ☐
  - Scope:
    - Add a short runbook that describes prerequisites, command usage, and rollback/fallback steps.
    - Update `docs/repo-quality-audit-2026-01.md` and/or `IMPLEMENTATION_PLAN.md` to link to this plan and the runbook.
  - Dependencies: LAUNCH-02 (minimum), LAUNCH-04 (preferred).
  - Definition of done:
    - A new operator can follow one doc and one command to launch a shop.

- **LAUNCH-06: Add `launch-shop` tests (dry-run)**
  - Status: ☐
  - Scope:
    - Add integration-style tests that exercise the orchestration in `--dry-run` mode (no DB writes, no workflow writes, no deploy).
    - Cover: config validation, secrets sourcing contract errors, step ordering, and report output shape.
  - Dependencies: LAUNCH-02.
  - Definition of done:
    - Tests exist (likely under `scripts/__tests__/`) and run deterministically in CI/local without external services.

## Acceptance Criteria

- [ ] `pnpm launch-shop` can run non-interactively end-to-end for a new shop using a config + secrets source.
- [ ] Preview deploy produces a URL and runs automated smoke checks.
- [ ] Generated CI workflows do not commit secrets and include mandatory post-deploy validation.
- [ ] Launch output is auditable (report artifact) and suitable for handoff.
- [ ] `launch-shop` has dry-run test coverage for core orchestration and error cases.

## Risks / Open Questions

- **Shop ID normalization**: current scripts mix raw IDs and `shop-` prefixes; tracked explicitly in LAUNCH-00.
- **Where deploy happens**: decide whether preview deploy runs locally (wrangler/next-on-pages) or exclusively via CI.
- **Smoke test fixtures**: if we adopt `pnpm test:shop-smoke`, we must guarantee required seed fixtures exist in the launch seed path.

## Related Work

- Audit source: `docs/repo-quality-audit-2026-01.md`
- Secrets: `docs/plans/integrated-secrets-workflow-plan.md`
- Health checks: `docs/plans/post-deploy-health-checks-mandatory-plan.md`
- CI/deploy standardization: `docs/plans/ci-deploy/ci-and-deploy-roadmap.md`
