---
Type: Plan
Status: Active
Domain: Repo
Last-reviewed: 2026-01-17
Relates-to charter: docs/runtime/runtime-charter.md
Audit-recommendation: P0.1
Created: 2026-01-17
Created-by: Codex (GPT-5.2)
Last-updated: 2026-01-18
Last-updated-by: Codex (GPT-5)
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

- `pnpm launch-shop --config <file> [--env-file <file> | --vault-cmd <cmd>] [--mode preview|production] [--validate | --dry-run]`

Contract:

- **Non-interactive by default** (no prompts). If required inputs are missing, it fails with a clear error.
- **Config-first**: `--config` describes the shop (theme/template/providers/pages) and launch options (CI/deploy/smoke).
- **Secrets-first**: `--env-file` or `--vault-cmd` must provide deploy-required secrets in strict modes; pipeline fails on `TODO_`.

**Validation Modes** (mutually exclusive):

- **`--validate`**: Pure validation with zero side effects. Validates config schema, checks secret availability (without reading values where possible), verifies prerequisites exist, and prints the intended execution plan. No files written, no network calls to deploy targets. Use for "what would happen" checks.
- **`--dry-run`**: Performs all local operations (file generation, workflow creation) but skips external side effects (no git push, no deploy trigger, no CI dispatch). Use for testing the full generation pipeline deterministically.
- **Neither**: Full execution—generates, deploys, and validates.

### Dry-Run Workspace Isolation

**Problem**: Existing primitives (`init-shop`, `setup-ci`) write directly to repo paths (`apps/<shop>/`, `.github/workflows/`, `data/shops/`). They don't support an `--output-root` parameter.

**MVP solution (git worktree isolation)**:

`launch-shop --dry-run` creates a temporary git worktree:
1. Create worktree at `.launch-worktrees/<shopId>-<timestamp>/`
2. Run all primitives (`init-shop`, `setup-ci`, report generation) inside the worktree
3. Never push, never dispatch CI, never modify the main working tree
4. On completion, output a summary to stdout and optionally copy artifacts to `.launch-dry-run/<shopId>/` for inspection
5. Clean up worktree on success (retain on failure for debugging, with `--dry-run-cleanup` to force removal)

**Rationale**: This avoids modifying `init-shop`/`setup-ci` for MVP. Worktrees provide true isolation without complex parameter threading.

**Future enhancement**: Add `--root <dir>` to primitives for cleaner non-worktree dry-run (post-MVP).

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

**Multiline / Structured Secrets:**

For secrets containing newlines (JSON credentials, PEM certificates, etc.):

- `--vault-cmd` output may be base64-encoded if the key name ends with `_B64` (e.g., `GCP_SERVICE_ACCOUNT_JSON_B64`). The pipeline decodes before writing to `.env`.
- Alternatively, use `--vault-cmd-file` mode where the command writes to a temp file path provided as a second argument: `<cmd> <ENV_KEY> <output-path>`. This avoids stdout encoding issues entirely.
- For `--env-file`, multiline values must use the standard dotenv multiline syntax (quoted strings with literal newlines or escaped `\n`).

Strictness:

- `--mode production`: always strict (fail on missing keys and any `TODO_*` values).
- `--mode preview`: strict by default for deploy-required keys; can be relaxed only if the pipeline explicitly supports a "non-deploy preview" mode.

### Secrets Destination Contract (MVP)

The pipeline must publish secrets to their runtime destinations. For MVP, we adopt **Option 1 (CI-first, no automatic secret publication)**:

- **Local `.env`**: Written for local development/testing only. Never committed.
- **GitHub Actions secrets**: The pipeline **verifies** that required secrets exist but does **not** create them automatically. Missing secrets fail preflight with a clear error listing required secret names.
- **Cloudflare Pages environment variables**: Similarly verified but not auto-provisioned.

**Rationale**: Automatic secret publication requires careful permission handling and naming conventions. MVP prioritizes safety over convenience—operators provision secrets once via `gh secret set` or provider dashboards before running `launch-shop`.

### MVP Secret Naming + Scope Contract

**Scope decision for MVP**: Repository-level secrets only (not environment secrets).

| Secret Category | Scope | Secret Name | Required For |
|-----------------|-------|-------------|--------------|
| Cloudflare API token | Repo | `CLOUDFLARE_API_TOKEN` | All deploys |
| Cloudflare account ID | Repo | `CLOUDFLARE_ACCOUNT_ID` | All deploys |
| Turbo remote cache | Repo | `TURBO_TOKEN` | CI build caching |

**What MVP does NOT verify** (deferred to post-MVP):
- Per-shop runtime secrets (Stripe keys, etc.)—assumed already in Cloudflare Pages environment
- Environment-level GitHub secrets (e.g., `production` environment)

**Preflight verification steps**:
1. `gh auth status` — verify GitHub CLI is authenticated (fail with clear error if not)
2. `gh secret list` — verify required repo secrets exist (names only, not values)
3. Compare against `deployTarget.type` requirements (cloudflare-pages needs `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)

**Future enhancement** (post-MVP): Add `--provision-secrets` flag that uses `gh secret set` and provider APIs to publish secrets directly. This requires:
- Explicit naming convention: `SHOP_<ID>_<KEY>` for per-shop secrets, or shared secrets with per-shop overrides.
- Redaction discipline in all logs.
- Permission checks (`gh auth status`, provider API token validation).
- Environment-level secret support for production gating.

### Required Secrets Registry (MVP)

**This is MVP-required, not optional.** Preflight depends on knowing which secrets to verify.

**MVP implementation** (minimal, hardcoded):
```typescript
// scripts/src/launch-shop/required-secrets.ts
export const REQUIRED_SECRETS = {
  'cloudflare-pages': {
    github: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'TURBO_TOKEN'],
    provider: [], // MVP doesn't verify provider-side secrets
  },
  'vercel': {
    github: ['VERCEL_TOKEN', 'TURBO_TOKEN'],
    provider: [],
  },
  'local': {
    github: [],
    provider: [],
  },
} as const;
```

**Post-MVP expansion** (LAUNCH-09): Move to `packages/platform-core/src/deploy/required-secrets.ts` with richer typing, per-shop overrides, and runtime secret validation.

## Execution Model (How the Pipeline Chains Steps)

### Control Plane Decision

**MVP adopts a "local control plane" model**: `launch-shop` runs on the operator's machine (or agent environment), orchestrates all steps, triggers CI remotely, and polls for completion.

| Responsibility | Where it runs |
|----------------|---------------|
| Config validation, preflight | Local |
| Scaffold generation (`init-shop`) | Local |
| Secrets materialization (`.env`) | Local |
| CI workflow generation | Local (writes file, commits) |
| Deploy trigger | Local triggers CI via `gh workflow run` or git push |
| Deploy execution | CI (GitHub Actions) |
| Smoke checks | CI (via `reusable-app.yml` health check step) |
| URL discovery | Local downloads `deploy-metadata.json` artifact from CI |
| Report generation | Local (records CI outcomes) |

**Why local control plane for MVP**:
- Simpler to implement and debug—single process orchestrates everything.
- Secrets remain on the operator machine; only references go to CI.
- Works with existing `gh` CLI patterns.

**Alternative (CI control plane)**: For future consideration, a "CI control plane" model where `launch-shop` only generates config and a workflow, then CI handles everything including smoke checks. This is more reproducible but requires:
- Structured artifact handoff (config → CI → results)
- CI-native secret discovery
- More complex "observe and wait" UX

1. **Preflight**
   - Ensure runtime (`ensureRuntime`) and required CLIs for chosen mode (`git`, optionally `gh`, `wrangler/next-on-pages` if needed).
   - Validate working tree state (clean or explicitly allowed via flag).
   - **Policy checks** (fast-fail multipliers):
     - `.env` files are gitignored in relevant locations (prevent accidental secret commits).
     - Shop ID doesn't collide with existing `apps/`, `packages/`, or route paths.
     - Config schema is valid (via JSON Schema).
     - Provider project name meets provider constraints (length, charset).
     - Required secrets are available (see Secrets Destination Contract).
     - **TODO_ placeholder detection** *(new, not yet implemented)*: Scan `.env` values for `TODO_*` patterns and fail in strict modes. Current `setup-ci.ts` skips empty values but doesn't detect TODO placeholders.
     - **GitHub secret verification** *(new, not yet implemented)*: Run `gh secret list` to verify required secrets exist in repository/environment. Fail with clear error listing missing secret names.

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
   - **Current state** (gap to address): Generated workflows deploy on any push (not branch-aware). CMS workflow deploys only on main. Need consistent branch filtering logic in LAUNCH-03.

6. **Smoke checks**
   - **Authority decision for MVP**: Smoke checks run **in CI** via `reusable-app.yml` (which already includes `post-deploy-health-check.sh`). The local orchestrator **observes and records** CI results rather than running duplicate checks.
   - **Rationale**: `reusable-app.yml` already has health checks integrated. Running the same checks locally is redundant and adds failure modes (network differences, timing). CI is the authoritative check.
   - **Orchestrator responsibilities**:
     - Wait for CI workflow to complete
     - Extract health check results from workflow logs or `deploy-metadata.json` artifact (add `healthCheckPassed: boolean` field)
     - Record outcome in launch report
   - **Optional local verification** (`--smoke-local`): If operator wants independent verification, explicitly run `scripts/post-deploy-health-check.sh` locally after CI passes. This is opt-in, not default.
   - **Retry behavior**: Deferred to `post-deploy-health-check.sh` defaults (`MAX_RETRIES=10`, `RETRY_DELAY=6`). Orchestrator does NOT add its own retry layer—that would duplicate logic.
   - **CLI flags removed** (to avoid duplication): `--smoke-retries` and `--smoke-timeout` are removed from orchestrator. Use `EXTRA_ROUTES` env var if custom endpoints needed.

7. **Report**
   - Write launch report with:
     - config path + hash, git ref, workflow run URL, deploy URL, check outcomes, timestamps, step durations, launchId.
   - **Report storage (per-run history)**:
     - **Per-run reports**: `data/shops/<shopId>/launches/<launchId>.json` where `launchId` = `<timestamp>-<shortHash>` (e.g., `20260118-143052-a1b2c3d`)
     - **Latest pointer**: `data/shops/<shopId>/launch.json` is a copy of the most recent successful launch report (for quick access)
     - **Committed to repo**: Yes—both per-run and latest. Creates auditable launch history.
     - **CI artifact** (optional): If CI control plane is adopted later, also upload as a workflow artifact.
   - **Redaction policy**: Report contains NO secrets. Sensitive values are replaced with `"[REDACTED]"` or omitted entirely. Fields that are safe to include:
     - Config hash (not contents)
     - Secret key names (not values)
     - URLs, git refs, timestamps
     - Check pass/fail status and error messages (reviewed to exclude secrets)
   - **Relationship to `deploy.json`**:
     - `deploy.json`: Current deployed state from provider (status, URLs, test outcomes)—written by deploy adapter
     - `launches/<launchId>.json`: Orchestration trace (which steps ran, durations, workflow metadata)—written by launch-shop

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

## Idempotency & Re-runs

Operators will re-run `launch-shop` after partial failures. The pipeline must handle existing artifacts gracefully.

**Default behavior (safe)**: Fail if target paths already exist:
- `apps/<shop>/` directory exists → fail with "shop already scaffolded"
- `.github/workflows/deploy-<shop>.yml` exists → fail with "workflow already exists"
- `data/shops/<shop>/launch.json` exists → fail with "launch report exists"

**Override flags**:
- `--force`: Overwrite all existing artifacts. Use when intentionally re-running after fixes.
- `--resume [<launch-id>]`: Continue from the last successful step of a previous run.
  - Without argument: resumes from `data/shops/<shopId>/launch.json` (latest)
  - With argument: resumes from `data/shops/<shopId>/launches/<launch-id>.json` (specific run)
  - Skips completed steps, retries failed/pending steps.
  - Fails if config hash differs from stored hash (use `--force` to override).

**Idempotency rules by step**:

| Step | Idempotent? | `--force` behavior |
|------|-------------|-------------------|
| Scaffold (`init-shop`) | No | Deletes and recreates `apps/<shop>/` |
| Secrets materialization | Yes | Overwrites `.env`, merges new keys |
| CI workflow generation | No | Overwrites workflow file |
| Deploy trigger | Yes | Triggers new deployment (provider handles) |
| Smoke checks | Yes | Re-runs checks against current URL |
| Report | Yes | Overwrites `launch.json` |

**Config hash validation**: The pipeline computes a hash of the config file. On re-run with `--resume`, if the config hash differs from the stored hash, the pipeline warns and requires `--force` to proceed (prevents accidental config drift).

## Delivery Strategy (Avoiding Plan Stall)

This plan should deliver an MVP “one command” flow even if related hardening plans are still in progress:

- MVP: orchestrator + config schema + secrets validation + workflow generation that references GitHub secrets and uses existing reusable deployment patterns (where possible).
- Hardening: align with the standardized secrets backend and mandatory health-check enforcement once those plans land.

## Active tasks

- **LAUNCH-00: Standardize shop ID + app slug normalization**
  - Status: ✅
  - Scope:
    - Define canonical forms for:
      - shop ID (`<id>` vs `shop-<id>`)
      - app package name (`@apps/shop-<id>`)
      - data path (`data/shops/<id>/...` vs `data/shops/shop-<id>/...`)
      - **Provider project names** (where collisions actually happen):
        - Cloudflare Pages: `<id>` or `shop-<id>` (63 char limit, lowercase alphanumeric + hyphens)
        - Vercel: similar constraints
        - GitHub workflow filename: `deploy-<id>.yml`
    - Update CLI tooling to accept a raw shop ID and derive all prefixed forms consistently.
    - Add a `normalizeShopId(rawId, target)` utility that returns the correct form for each target (package, path, provider, workflow).
    - **Known edge case**: `setup-ci.ts:21` has hardcoded mapping `"bcd"` → `"cover-me-pretty"`. Either:
      - Generalize via a `data/shops/<id>/aliases.json` config, or
      - Document as legacy exception and exclude from automated normalization.
  - Dependencies: none.
  - Existing code: Shop ID validation exists at `packages/platform-core/src/shops/index.ts` (`validateShopName()` accepts `/^[a-z0-9_-]+$/i`). Prefixing is consistent (`shop-<id>`) across `initShop.ts`, `quickstart-shop.ts`, `setup-ci.ts`.
  - Definition of done:
    - `init-shop`, `quickstart-shop`, `setup-ci`, deploy info readers, and any launch scripts agree on the same normalization rules and produce consistent paths.
    - Provider project names are validated against provider-specific constraints (length, charset) during preflight.
    - Edge case handling for legacy shop IDs is documented or generalized.
  - Completed:
    - Added `normalizeShopId` + helpers in `packages/platform-core/src/shops/index.ts`.
    - Updated scripts to use shared helpers and removed local `shop-identity` utility.

- **LAUNCH-01: Define launch config schema + examples**
  - Status: Partial
  - Scope:
    - Define the minimal JSON schema for `--config` (shop options + launch options).
    - **Foundation**: Extend existing `createShopOptionsSchema` from `packages/platform-core/src/createShop/schema.ts` (full zod schema with `.strict()` enforcement for shop creation fields).
    - Required schema fields:
      - `schemaVersion` (integer): Schema version for forward compatibility. Start at `1`.
      - `shopId` (string): Raw shop identifier (e.g., `acme-sale`). Pipeline derives slugs/paths.
      - `deployTarget` (object): Deploy adapter configuration:
        - `type`: `"cloudflare-pages"` | `"vercel"` | `"local"` (determines required secrets and deploy commands)
        - `projectName`: Provider-specific project name (may differ from shopId due to provider naming rules)
      - `ci` (object): CI configuration:
        - `workflowName`: Generated workflow filename
        - `useReusableWorkflow`: boolean (prefer `true`)
      - `smokeChecks` (array): List of `{ endpoint: string, expectedStatus: number }` for post-deploy validation
    - Optional schema fields (inherit from existing `CreateShopOptions`):
      - `theme`, `template`, `pagesTemplate`, `providers` (existing init-shop options)
      - `environments` (object): Per-environment overrides for preview vs production
    - Add one or two example configs (and a corresponding `.env.template`/example env file) in a predictable location (e.g. `profiles/shops/`).
  - Dependencies: none.
  - Existing code: `createShopOptionsSchema` already validates: name, logo, contactInfo, type, theme, template, payment, shipping, tax, analytics, navItems, pages, etc.
  - Definition of done:
    - A documented config shape exists with all required fields.
    - JSON Schema file at `scripts/schemas/launch-config.schema.json` for validation.
    - CLI validates config against schema before execution.
    - Launch config composes with (not duplicates) existing `CreateShopOptions`.
  - Completed (partial):
    - Added `launchConfigSchema` in `packages/platform-core/src/createShop/schema.ts`.
    - Added JSON schema at `scripts/schemas/launch-config.schema.json`.
    - Added example config and env template in `profiles/shops/`.

- **LAUNCH-02: Implement `pnpm launch-shop` orchestrator**
  - Status: ☐
  - Scope:
    - Add `scripts/src/launch-shop.ts` (or `launchShop.ts`) that composes `init-shop`, secrets materialisation, CI setup, deploy trigger, and smoke checks.
    - Support `--mode preview|production`, `--validate`, `--dry-run`, and clear errors for missing inputs.
    - **Leverage existing `init-shop` flags** (already implemented):
      - `--skip-prompts`: Non-interactive mode ✅
      - `--config <file>`: JSON config file ✅
      - `--env-file <path>`: Load env vars from file ✅
      - `--vault-cmd <cmd>`: Load secrets from vault command ✅
      - `--seed` / `--seed-full`: Seed data after creation ✅
      - `--pages-template`: Apply page template ✅
    - **New orchestrator responsibilities** (not yet in init-shop):
      - Preflight validation (TODO_ detection, `gh secret list`, provider secret verification)
      - CI workflow generation trigger (call `setup-ci` after scaffold)
      - Deploy trigger via `gh workflow run` or git push
      - URL discovery and smoke check execution
      - Launch report generation
  - Dependencies: LAUNCH-00, LAUNCH-01.
  - Definition of done:
    - Running the command with a complete config performs all steps without prompting.
    - Orchestrator calls existing primitives rather than reimplementing them.

- **LAUNCH-03: Make generated CI workflows safe + standard**
  - Status: Partial
  - Scope:
    - Update `scripts/src/setup-ci.ts` generation so it:
      - Avoids committing secrets.
      - Uses existing `reusable-app.yml` (not a new reusable workflow).
      - Aligns tests with repo policy (no unfiltered root test runs).
    - **Current state** (gap to address):
      - `setup-ci.ts` generates simple inline workflows with lint/test/build/deploy steps.
      - Does NOT use `reusable-app.yml` pattern (which already exists and includes health checks).
      - Workflows deploy on any push (not branch-aware for preview vs production).
      - No auto-generated header comment.
    - **Required changes**:
      - Refactor `setup-ci.ts` to generate thin wrappers calling existing `.github/workflows/reusable-app.yml`.
      - Add branch filtering (see "Branch-aware deploy pattern" below).
      - Add `# AUTO-GENERATED by launch-shop` header.
      - Add `deploy-metadata.json` artifact upload step for URL discovery.
    - **Reusable workflow decision (MVP)**: Use existing `reusable-app.yml`. Do NOT create `_reusable-shop-deploy.yml`—that's unnecessary indirection for MVP. If shop-specific reusable logic is needed later, add it post-MVP.
    - **Branch-aware deploy pattern (MVP: single workflow, conditional jobs)**:
      ```yaml
      # .github/workflows/deploy-shop-<id>.yml
      name: Deploy shop-<id>
      on:
        push:
          branches: [main, 'work/**']
          paths: ['apps/shop-<id>/**', 'packages/**']
        workflow_dispatch:

      jobs:
        build-and-test:
          uses: ./.github/workflows/reusable-app.yml
          with:
            app-filter: '@apps/shop-<id>'
            # ... other inputs

        deploy-preview:
          if: github.ref != 'refs/heads/main'
          needs: build-and-test
          # Deploy to preview, upload deploy-metadata.json artifact

        deploy-production:
          if: github.ref == 'refs/heads/main'
          needs: build-and-test
          # Deploy to production, upload deploy-metadata.json artifact
      ```
    - **Rationale for single workflow**: Fewer files per shop, clearer conditional logic, easier to understand than separate preview/prod workflows.
  - Completed (partial):
    - Refactored `scripts/src/setup-ci.ts` to generate wrappers that call `.github/workflows/reusable-app.yml`.
    - Removed inline env materialization in generated workflows.
    - Added auto-generated header comment for setup-ci output.
    - Ensured generated workflows align with repo test policy by delegating to reusable workflow.
    - Switched shop ID derivation to shared helpers (`packages/platform-core/src/shops/index.ts`).
    - **Workflow ownership and update strategy**:
      - Generated workflows live at `.github/workflows/deploy-shop-<id>.yml`.
      - Each generated file includes a header comment: `# AUTO-GENERATED by launch-shop. Manual edits will be overwritten.`
      - **Update behavior**: `--force` overwrites the entire file. No merge/patch of manual edits.
      - **Escape hatch**: Rename workflow (remove `deploy-shop-` prefix) and remove header to opt out of auto-generation.
  - Dependencies:
    - LAUNCH-00.
    - Coordination: `docs/plans/post-deploy-health-checks-mandatory-plan.md` (DEPLOY-04) and `docs/plans/integrated-secrets-workflow-plan.md` (SEC-04/SEC-05) for full enforcement; MVP should not block on them.
  - Existing code: `reusable-app.yml` exists with inputs for `app-filter`, `build-cmd`, `deploy-cmd`, `project-name`, `artifact-path` and includes post-deploy health check step.
  - Definition of done:
    - `setup-ci` output is safe, deploys with required checks, and works for newly generated shops.
    - Generated workflows call existing `reusable-app.yml` (not inline steps, not new reusable workflow).
    - Header comment identifies auto-generated files.
    - Branch-aware deploy logic (preview on work branches, production on main).
    - `deploy-metadata.json` artifact uploaded for URL discovery.

- **LAUNCH-04: Preview deploy + smoke check integration**
  - Status: ☐
  - Scope:
    - Ensure the pipeline can produce a deployed preview URL without requiring a merge to `main`.
    - **URL discovery contract (artifact-based)**:
      - CI workflow writes a `deploy-metadata.json` artifact containing:
        ```json
        {
          "deployUrl": "https://<hash>.<project>.pages.dev",
          "productionUrl": "https://<project>.pages.dev",
          "gitSha": "<commit-sha>",
          "environment": "preview|production",
          "timestamp": "<ISO-8601>"
        }
        ```
      - Orchestrator workflow:
        1. Trigger workflow via `gh workflow run` or push
        2. Poll for run completion: `gh run list --workflow=<name> --branch=<branch> --json status,databaseId`
        3. Download artifact: `gh run download <run-id> -n deploy-metadata`
        4. Parse `deploy-metadata.json` to extract `deployUrl`
      - **Fallback** (if artifact missing): Query Cloudflare Pages API (`/deployments`) filtered by git SHA
      - **Local deploy** (wrangler): Parse stdout for URL pattern (no artifact needed)
    - **Run correlation**: Match runs by workflow file + head SHA. If multiple runs match, use newest with matching SHA.
    - **Polling timeouts**: Max 10 minutes for CI completion, check every 15 seconds. Fail with clear error if timeout exceeded.
    - The discovered URL is:
      - Stored in `launches/<launchId>.json` report under `deployUrl`.
      - Passed to smoke checks as `BASE_URL` environment variable.
  - Dependencies: LAUNCH-03.
  - Definition of done:
    - A work-branch launch yields a URL via artifact download.
    - Generated workflows include `deploy-metadata.json` artifact upload step.
    - URL is stored in the launch report.
    - Smoke checks receive and validate against the correct URL.

- **LAUNCH-05: Production rollout handoff + docs**
  - Status: ☐
  - Scope:
    - Add a short runbook that describes prerequisites, command usage, and rollback/fallback steps.
    - **Failure taxonomy section**: Document what errors mean and recommended next steps:
      - Preflight failures (missing CLI, dirty git state, invalid config)
      - Secrets failures (missing keys, invalid format, vault-cmd errors)
      - Scaffold failures (shop already exists, template not found)
      - CI failures (workflow generation errors, GitHub API errors)
      - Deploy failures (provider errors, timeout, quota exceeded)
      - Smoke check failures (transient vs hard, which endpoints failed)
    - Update `docs/repo-quality-audit-2026-01.md` and/or `IMPLEMENTATION_PLAN.md` to link to this plan and the runbook.
  - Dependencies: LAUNCH-02 (minimum), LAUNCH-04 (preferred).
  - Definition of done:
    - A new operator can follow one doc and one command to launch a shop.
    - Runbook includes failure taxonomy with actionable guidance.

- **LAUNCH-06: Add `launch-shop` tests**
  - Status: ☐
  - Scope:
    - Add integration-style tests that exercise the orchestration in `--validate` and `--dry-run` modes.
    - **Test coverage requirements**:
      - Config validation: valid configs pass, invalid configs fail with clear errors.
      - Secrets sourcing contract: missing keys fail, `TODO_*` values fail in strict mode, multiline/base64 secrets decode correctly.
      - `--validate` vs `--dry-run` semantics: validate writes nothing, dry-run writes to temp directory.
      - Idempotency: re-run fails without `--force`, `--force` overwrites, `--resume` continues from last step.
      - Redaction: no secrets appear in logs or report output (test with known secret patterns).
      - Step ordering: steps execute in correct order, failures stop the pipeline.
      - Report output shape: all required fields present, timestamps valid, URLs well-formed.
  - Dependencies: LAUNCH-02.
  - Definition of done:
    - Tests exist under `scripts/__tests__/launch-shop/`.
    - Tests run deterministically in CI/local without external services.
    - Redaction tests use fixture secrets and grep output for leaks.

## Acceptance Criteria

- [ ] `pnpm launch-shop` can run non-interactively end-to-end for a new shop using a config + secrets source.
- [ ] Preview deploy produces a URL and runs automated smoke checks.
- [ ] Generated CI workflows do not commit secrets and include mandatory post-deploy validation.
- [ ] Launch output is auditable (report artifact) and suitable for handoff.
- [ ] `launch-shop` has dry-run test coverage for core orchestration and error cases.

## Risks / Open Questions

- **Shop ID normalization**: current scripts mix raw IDs and `shop-` prefixes; tracked explicitly in LAUNCH-00. ✓ Plan now includes provider project name normalization.
- **Where deploy happens**: Resolved—MVP uses local control plane with CI-triggered deploys. See "Control Plane Decision" section.
- **Smoke test fixtures**: if we adopt `pnpm test:shop-smoke`, we must guarantee required seed fixtures exist in the launch seed path.
- **Secrets publication**: MVP verifies secrets exist but doesn't provision them automatically. Operators must pre-provision via `gh secret set` / provider dashboards. See "Secrets Destination Contract" section.

## Future Enhancements (Post-MVP)

These tasks are high-leverage but not required for MVP:

- **LAUNCH-07: Idempotency + resume hardening**
  - Implement `--resume <launch-id>` to continue from last successful step.
  - Add config hash validation on resume to detect drift.
  - Status: ☐ (optional)

- **LAUNCH-08: Redaction + logging discipline**
  - Centralized logger that redacts known keys and patterns.
  - Tests ensure no secret leaks in any output path.
  - Status: ☐ (optional, but recommended before production use)

- **LAUNCH-09: Extended secrets registry**
  - Expand MVP's hardcoded `REQUIRED_SECRETS` into a typed, extensible registry.
  - Add per-shop overrides, runtime secret validation, environment-level secrets.
  - Move from `scripts/src/launch-shop/required-secrets.ts` to `packages/platform-core/src/deploy/required-secrets.ts`.
  - Status: ☐ (optional—MVP has minimal hardcoded version)

- **LAUNCH-10: Automatic secret provisioning (`--provision-secrets`)**
  - Use `gh secret set` and provider APIs to publish secrets directly.
  - Requires naming convention agreement and permission validation.
  - Status: ☐ (optional, after SEC-04/SEC-05 land)

## Codebase Validation (2026-01-18)

This section documents what actually exists in the codebase vs. what the plan proposes. Code is the source of truth.

### Existing Primitives (Ready to Reuse)

| Primitive | Location | Status | Notes |
|-----------|----------|--------|-------|
| `init-shop` | [scripts/src/init-shop.ts](scripts/src/init-shop.ts) | ✅ Complete | Supports `--skip-prompts`, `--config`, `--env-file`, `--vault-cmd`, `--seed-full`, `--pages-template` |
| `setup-ci` | [scripts/src/setup-ci.ts](scripts/src/setup-ci.ts) | ⚠️ Needs update | Generates simple workflows, not reusable pattern. Has hardcoded edge case. |
| Health checks | [scripts/post-deploy-health-check.sh](scripts/post-deploy-health-check.sh) | ✅ Complete | Supports retries, `BASE_URL`, `EXTRA_ROUTES`, `MAX_RETRIES`. Already integrated in CMS workflow. |
| Deploy adapter | [packages/platform-core/src/createShop/deploymentAdapter.ts](packages/platform-core/src/createShop/deploymentAdapter.ts) | ✅ Complete | `ShopDeploymentAdapter` interface with Cloudflare default. Extensible. |
| Shop schema | [packages/platform-core/src/createShop/schema.ts](packages/platform-core/src/createShop/schema.ts) | ✅ Complete | Full zod schema for `CreateShopOptions`. Use as foundation for LAUNCH-01. |
| Env schema | [packages/config/src/env/index.ts](packages/config/src/env/index.ts) | ✅ Complete | `envSchema` with zod validation. Used by `setup-ci`. |
| Secrets management | [scripts/secrets.sh](scripts/secrets.sh) | ✅ Complete | SOPS + age encryption. Commands: `edit`, `decrypt`, `encrypt`, `list`, `status`, `bootstrap`. **Note**: MVP `--env-file` reads plaintext; SOPS integration is a future enhancement (accept `.env.sops` files directly). |
| Reusable workflow | [.github/workflows/reusable-app.yml](.github/workflows/reusable-app.yml) | ✅ Exists | Has post-deploy health check. `setup-ci` should use this instead of generating inline workflows. |

### Known Gaps (Must Address)

1. **`setup-ci` hardcoded edge case**: Shop ID "bcd" maps to app name "cover-me-pretty" at [setup-ci.ts:21](scripts/src/setup-ci.ts#L21). Either generalize this mapping or document it as a legacy exception.

2. **TODO_ placeholder detection**: Not implemented. `setup-ci` parses env files but doesn't fail on `TODO_*` values. Add to preflight.

3. **GitHub secret verification**: `gh secret list` validation doesn't exist. Add to preflight for MVP.

4. **Multi-environment deploy**: Generated workflows deploy on any push (not branch-aware). CMS workflow deploys only on main. Need consistent preview vs. production logic.

5. **Generated workflows are simple**: `setup-ci` generates inline lint/test/build/deploy steps. Should call `reusable-app.yml` instead.

### Existing Data Locations

| Data | Location | Format |
|------|----------|--------|
| Shop config | `data/shops/<shopId>/shop.json` | JSON (theme, nav, providers, features) |
| Shop settings | `data/shops/<shopId>/settings.json` | JSON (currency, languages, analytics, flags) |
| Deploy info | `data/shops/<shopId>/deploy.json` | JSON (`DeployShopResult`: status, URLs, test outcomes) |
| Launch history | `data/shops/<shopId>/launches/<launchId>.json` | **Proposed** (per-run orchestration trace) |
| Latest launch | `data/shops/<shopId>/launch.json` | **Proposed** (copy of most recent successful launch) |

### Shop ID Normalization (Current State)

Consistent `shop-<id>` prefix across scripts:
- `initShop.ts:52`: `const prefixedId = 'shop-${shopId}'`
- `quickstart-shop.ts:112`: `const prefixedId = 'shop-${shopId}'`
- `setup-ci.ts:21`: Special case `"bcd"` → `"cover-me-pretty"`, else `"shop-${shopId}"`
- Validation: `validateShopName()` accepts `/^[a-z0-9_-]+$/i`

## Related Work

- Audit source: `docs/repo-quality-audit-2026-01.md`
- Secrets: `docs/plans/integrated-secrets-workflow-plan.md`
- Health checks: `docs/plans/post-deploy-health-checks-mandatory-plan.md`
- CI/deploy standardization: `docs/plans/ci-deploy/ci-and-deploy-roadmap.md`
