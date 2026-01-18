---
Type: Plan
Status: Completed
Domain: Repo
Last-reviewed: 2026-01-18
Relates-to charter: docs/runtime/runtime-charter.md
Created: 2026-01-18
Created-by: Codex (GPT-5.2)
Last-updated: 2026-01-18
Last-updated-by: Codex (GPT-5.2)
---

# Plan: Launch Readiness Hardening (M0–M2)

Source: `docs/repo-quality-audit-2026-01.md` (Launch Readiness) + `docs/security-audit-2026-01.md` (production blockers).

This plan translates “good ideas” into a small-PR execution sequence that is shippable in stages and measurably improves reliability and safety for new shop launches.

## Inputs / Related Work

- Audit: `docs/repo-quality-audit-2026-01.md`
- Launch pipeline plan (P0.1): `docs/plans/launch-shop-pipeline-plan.md`
- Secrets plan (P0.2): `docs/plans/integrated-secrets-workflow-plan.md`
- Health checks plan (P0.3): `docs/plans/post-deploy-health-checks-mandatory-plan.md`
- CI/deploy roadmap: `docs/plans/ci-deploy/ci-and-deploy-roadmap.md`
- Security audit findings: `docs/security-audit-2026-01.md`

## Non-Goals (This Cycle)

- Build the full `pnpm launch-shop` orchestrator (tracked in `docs/plans/launch-shop-pipeline-plan.md`).
- Fully solve secrets materialization in CI (tracked in `docs/plans/integrated-secrets-workflow-plan.md`).
- Turbo cache / quickstart speed work (requires measurement + cache provisioning).
- Large workflow lint frameworks (only add enforcement once counts justify it).

## Scoreboard (Merged Themes)

Scoring rubric (0–1000): Impact (0–400) + Feasibility (0–250) + Cost/complexity (0–200) + Scope fit (0–100) + Risk profile (0–50).

`A_score` = planner score (this plan). `B_score` = external score from prior model evaluations. `ConsensusScore = min(A_score, B_score)`.

| Theme | A_score | B_score | ConsensusScore | Effort | Phase 1 scope (shippable) | Success metrics | Touchpoints | Dependencies | Risks + mitigations |
| --- | ---:| ---:| ---:| --- | --- | --- | --- | --- | --- |
| Shop bootstrap + CI generation hardening | 850 | 785 | 785 | M | Fix broken script entrypoints; stop `setup-ci` env inlining by generating wrappers calling `reusable-app.yml` | `pnpm create-shop <id>` and `pnpm setup-ci <id>` run; grep shows no workflow-embedded env values | `package.json`, `scripts/src/quickstart-shop.ts`, `scripts/src/setup-ci.ts`, `.github/workflows/reusable-app.yml` | `docs/plans/post-deploy-health-checks-mandatory-plan.md` (DEPLOY-04) | Wrapper coupling → validate inputs in CI; phased rollout (new shops first) |
| Mandatory deploy guardrails (health checks) | 830 | 820 | 820 | S | Add post-deploy health check to root staging deploy in `.github/workflows/ci.yml` | Staging deploy job fails if health check fails; deploys have a URL checked | `.github/workflows/ci.yml`, `scripts/post-deploy-health-check.sh` | `docs/plans/post-deploy-health-checks-mandatory-plan.md` (DEPLOY-03) | Flaky checks → keep retries + make URL explicit where needed |
| CMS API auth hardening (media + preview-link creation) | 745 | 710 | 710 | M | Require auth/permissions for CMS media CRUD + preview-link creation; add targeted tests | Unauthed requests return `401/403`; auth-required endpoints covered by tests | `apps/cms/src/app/api/media/route.ts`, `apps/cms/src/app/api/page-versions/[shop]/[pageId]/[versionId]/preview-link/route.ts`, `apps/cms/src/actions/common/auth.ts` (auth patterns) | `docs/security-audit-2026-01.md` (High Finding #13, NEW-1) | Local dev friction → document bypass for dev only; add clear error responses |
| Shop identity normalization (scripts-level) | 725 | 660 | 660 | S | Inventory shop IDs + centralize current naming in a helper; remove inline `bcd` hardcode | No remaining inline alias logic; tests assert stable mapping | `scripts/src/setup-ci.ts`, `scripts/src/init-shop.ts`, `scripts/src/utils/*` (ASSUMPTION) | None | Alias map ossifies → document deprecation path; preserve behavior in Phase 1 |
| Deploy-env validation wiring | 600 | 715 | 600 | M | (Defer until secrets materialization is consistent) add `validate-deploy-env` gate to deploy workflows | Deploys fail fast on placeholders/missing keys | `.github/workflows/reusable-app.yml`, `scripts/validate-deploy-env.sh`, `packages/config/env-schema.ts` | `docs/plans/integrated-secrets-workflow-plan.md` (SEC-04/05) | False positives / missing runtime env in CI → only enable where env is known to exist |
| Quickstart performance optimization | 550 | 620 | 550 | M | Measure baseline + document Turbo cache provisioning before changing quickstart behavior | `pnpm quickstart-shop` wall-clock improves with warm cache | `scripts/src/quickstart-shop.ts`, `.github/actions/setup-repo` | Turbo provisioning (`TURBO_TOKEN`, `TURBO_TEAM`) | Filtered builds can miss deps → keep safe fallback to full build |
| Launch config schema validation | 520 | 585 | 520 | M | Defer until `launch-shop` has a real config consumer; keep schema changes minimal | Invalid configs fail early with actionable errors | `packages/platform-core/src/createShop/schema.ts`, `scripts/src/init-shop.ts` (ASSUMPTION) | `docs/plans/launch-shop-pipeline-plan.md` | Schema churn → version fields + backward-compatible optional additions |

## Next Cycle Theme Selection (Ranked)

Selection criteria: highest consensus score, low dependency risk, and early shipped value.

1) Mandatory deploy guardrails (health checks) — direct reliability win with minimal surface area.
2) Shop bootstrap + CI generation hardening — fixes broken docs/CLI and eliminates unsafe workflow generation.
3) CMS API auth hardening — closes verified high-severity issues blocking safe go-live.
4) Shop identity normalization — small follow-up that de-risks future automation.

## PR-by-PR Execution Plan

Milestones: **M0** (same day), **M1** (next week), **M2** (security hardening with tests).

### M0

#### PR1 — Fix broken script entrypoints + quickstart presets

- Goal: Make documented commands runnable and remove the most obvious “paper cut” failures in the launch path.
- Status: Completed (2026-01-18).
- Exact changes:
  - Fix `package.json` scripts to point at `scripts/src/*.ts` for `create-shop`, `setup-ci`, `release-deposits`.
  - Fix `scripts/src/quickstart-shop.ts` to call the correct setup-ci entrypoint when `--presets` is used.
- Touchpoints:
  - `package.json`
  - `scripts/src/quickstart-shop.ts`
- Tests/verification:
  - `pnpm create-shop --help` (or run with a dummy id if supported)
  - `pnpm setup-ci --help` (or `pnpm setup-ci <id>` if a fixture shop exists)
  - `pnpm release-deposits --help` (or smoke-run in a non-destructive mode if available)
- Acceptance criteria:
  - Docs commands (`pnpm create-shop`, `pnpm setup-ci`, `pnpm release-deposits`) no longer fail due to missing files.
  - `quickstart-shop --presets` no longer references a nonexistent `scripts/setup-ci.ts`.
- Rollout notes:
  - No behavior change beyond making intended entrypoints reachable.
- Effort: S

#### PR2 — Add post-deploy health check to root staging deploy

- Goal: Prevent “green deploy, dead site” for the repo’s main staging release path.
- Status: Completed (2026-01-18).
- Exact changes:
  - Add a `Post-Deploy Health Check` step after `.github/workflows/ci.yml` staging deploy.
  - Use `scripts/post-deploy-health-check.sh` with explicit retries (match `reusable-app.yml` defaults where possible).
- Touchpoints:
  - `.github/workflows/ci.yml`
  - `scripts/post-deploy-health-check.sh`
- Tests/verification:
  - Validate workflow YAML syntax (CI on branch).
  - Confirm the health check step runs on `main` staging releases and fails on simulated bad URL (if safely testable).
- Acceptance criteria:
  - Staging deploy job fails if health check fails.
  - Health check step runs only after successful deploy.
- Rollout notes:
  - If staging URL differs from the default pattern, pass overrides via env (`BASE_URL`, `EXTRA_ROUTES`) rather than editing the script.
- Effort: S

### M1

#### PR3 — Shop identity helper + inventory (scripts-level)

- Goal: Remove hardcoded shop exceptions and centralize “what is a shop id vs app slug”.
- Status: Completed (2026-01-18).
- Exact changes:
  - Add a small inventory script to enumerate existing shops + expected dirs/workflows.
  - Add a `shopIdentity` helper that encodes current behavior (including legacy aliases) and use it in `setup-ci`.
  - Add tests to lock current mappings.
- Touchpoints:
  - `scripts/src/setup-ci.ts`
  - `scripts/src/init-shop.ts` (ASSUMPTION: contains parallel slug logic; verify with search)
  - New: `scripts/src/inventory-shops.ts`, `scripts/src/utils/shopIdentity.ts`
- Tests/verification:
  - Targeted unit tests for the helper (new test file under `scripts/__tests__` or existing pattern; verify location first).
- Acceptance criteria:
  - No remaining inline `shopId === "bcd"` logic outside the helper.
  - Helper has tests and preserves current behavior.
- Rollout notes:
  - Phase 1 is “centralize only”; do not rename existing shops.
- Effort: S

#### PR4 — Refactor `setup-ci` to generate reusable workflow wrappers

- Goal: Generated shop workflows should be safe (no inlined secrets), fast (targeted steps), and inherit mandatory health checks.
- Status: Completed (2026-01-18).
- Exact changes:
  - Update `scripts/src/setup-ci.ts` to emit a wrapper workflow that calls `.github/workflows/reusable-app.yml` with shop-specific inputs (filter/build/deploy/project-name).
  - Remove embedding of `.env` values into YAML.
  - Ensure generated workflows do not run unscoped `pnpm test` / `pnpm lint` commands.
  - Add an auto-generated header to the workflow and path filters so changes outside the shop don’t trigger deploy unnecessarily.
- Touchpoints:
  - `scripts/src/setup-ci.ts`
  - `.github/workflows/reusable-app.yml` (verify required inputs)
  - `docs/plans/post-deploy-health-checks-mandatory-plan.md` (DEPLOY-04 alignment)
- Tests/verification:
  - Regenerate one shop workflow and confirm YAML is valid.
  - CI run on a branch to confirm the wrapper executes the reusable workflow end-to-end.
- Acceptance criteria:
  - Generated workflows contain no `env:` blocks derived from `.env` contents.
  - Generated workflows run health checks (inherited from `reusable-app.yml`).
- Rollout notes:
  - Phase 1: only change generation output; do not auto-migrate existing workflows unless explicitly requested.
- Effort: M

### M2

#### PR5 — CMS API authorization hardening + tests

- Goal: Close verified high-severity unauthenticated CMS endpoints; add regression tests.
- Status: Completed (2026-01-18).
- Exact changes:
  - Require `getServerSession` (or existing CMS auth helper) for `apps/cms/src/app/api/media/route.ts`.
  - Require appropriate permissions for `apps/cms/src/app/api/page-versions/[shop]/[pageId]/[versionId]/preview-link/route.ts`.
  - Replace unsalted SHA-256 preview password hashing with argon2; add timing-safe legacy fallback for existing links.
  - Add targeted Jest tests that assert `401/403` on unauth requests and success on authed requests.
- Touchpoints:
  - `apps/cms/src/app/api/media/route.ts`
  - `apps/cms/src/app/api/page-versions/[shop]/[pageId]/[versionId]/preview-link/route.ts`
  - `apps/cms/src/app/api/page-versions/preview/[token]/route.ts` (password hashing; Phase 2)
  - Existing patterns: `apps/cms/src/app/api/pages/[shop]/route.ts`, `apps/cms/src/actions/common/auth.ts`
- Tests/verification:
  - Targeted CMS test run (filter to the new/changed test files) using repo’s Jest policy.
  - Confirm no unauth access remains for media CRUD and preview-link creation.
- Acceptance criteria:
  - Unauthenticated callers cannot list/upload/delete/update media.
  - Unauthenticated callers cannot mint preview links.
  - Tests cover both positive and negative paths.
- Rollout notes:
  - If preview-link GET is intentionally shareable, keep it shareable but harden hashing/comparison; only restrict link creation.
- Effort: M
