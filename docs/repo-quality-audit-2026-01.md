---
Type: Audit
Status: Active
Domain: Repo
Created: 2026-01-17
Created-by: Codex
Last-updated: 2026-01-18
Last-updated-by: Codex (GPT-5.2)
---

# Repository Quality Audit - January 2026 (Launch Readiness)

This audit is rebuilt around the core requirement: roll out a new shop website in under 3 hours. The focus is not just repo hygiene, but the end-to-end ability to create, theme, configure, deploy, and validate a new shop quickly and repeatably.

## Executive Summary

Launch Readiness Score: 68/100 (world-class bar is 85+).

The repo is strong in scaffolding, theming, and agent operations. It is not yet dependable for sub-3-hour **production** launches because secrets provisioning and remaining security gaps still block safe go-live. Several correctness footguns identified in the last audit have been fixed (entrypoints, `setup-ci` workflow generation, staging health checks, CMS preview auth/hashing).

**Scoring methodology**: This score reflects both **implemented reality** (primary weight) and **plan completeness** (partial credit). Implementation gaps lower scores; comprehensive, actionable plans with clear specs add ~0.5 points per affected category. Plans without implementation are worth less than shipped code, but detailed specs that de-risk execution merit partial credit.

Top blockers to 3-hour production rollouts:
- Secrets provisioning remains manual and fragmented (`TODO_` placeholders; no integrated secrets workflow yet).
- Post-deploy health checks are not yet enforced across all deploy paths (legacy workflows still need migration/validation).
- Security gaps remain (SSRF validation, secrets history cleanup, remaining unauth CMS endpoints).

Recent hardening completed (M0–M2):
- `docs/plans/launch-readiness-hardening-plan.md` (entrypoints fixed, staging health check added, `setup-ci` wrapper generation, CMS auth + preview hashing hardening).

Longer-horizon (still required for the 3-hour bar):
- Implement `docs/plans/launch-shop-pipeline-plan.md` (LAUNCH-00 through LAUNCH-06).
- Implement `docs/plans/integrated-secrets-workflow-plan.md` (remove `TODO_` bottleneck, make secrets materialization non-interactive).

## North Star Requirement

Requirement: A new shop website can be rolled out in under 3 hours.

Definition of a "rollout" for this audit:
- Shop is scaffolded, themed, and has publishable starter pages.
- Basic catalog and settings exist (seeded or imported).
- CI workflow exists for the new shop.
- Deployment completes and passes minimal health checks.
- A clear rollback path exists (even if manual).

Assumptions for the 3-hour target:
- The shop uses existing templates and the existing theme token system.
- Provider accounts and credentials exist (Stripe, shipping, CMS) even if test keys.
- Content is "launchable MVP" using templates or seed data; deep content production is out of scope.

## Method and Evidence

This audit focuses on repo capabilities that affect time-to-launch. Evidence sources include:
- `scripts/src/quickstart-shop.ts`, `scripts/src/init-shop.ts`, `scripts/src/setup-ci.ts`
- `package.json` (script entrypoints)
- `docs/setup.md`, `docs/theming-advanced.md`, `docs/deployment-adapters.md`
- `packages/themes/*`, `packages/templates/*`, `packages/platform-core/*`
- `AGENTS.md` and agent runbooks
- `.github/workflows/*` (reusable app pipeline, Cypress, Storybook)
- `.github/workflows/ci.yml` (root staging deploy path)
- `docs/security-audit-2026-01.md` (production safety blockers)

## Scoring Model

Scale (0-5 per category, weighted to 100):
- 5 = world-class, repeatable in under 3 hours with minimal manual steps
- 4 = strong, usually under 3 hours with expert operator
- 3 = adequate, 3-6 hours with manual steps and risk
- 2 = weak, 6-24 hours and not reliably repeatable
- 1 = critical, blocked or not viable

World-class bar: 85+ with no category below 3.

## Launch Readiness Scorecard

| Category | Weight | Score (0-5) | Points | Impl | Plan | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| Launch automation and scaffolding | 20 | 4.0 | 16.0 | 3.5 | +0.5 | Entry points fixed; orchestration still manual. Plan specifies orchestrator, dry-run, resume, preflight. |
| Theming and design system | 12 | 4.0 | 9.6 | 4.0 | — | Multi-theme support + token overrides; limited automation for new themes |
| Content and CMS | 10 | 3.0 | 6.0 | 3.0 | — | Template scaffolding exists; content depth still manual |
| Environment and secrets | 10 | 2.5 | 5.0 | 2.0 | +0.5 | TODO placeholders remain. Plan specifies MVP secrets registry + preflight verification. |
| CI/CD and deployment | 12 | 3.5 | 8.4 | 3.0 | +0.5 | `setup-ci` emits reusable workflow wrappers; staging health check added. |
| Testing and regression | 8 | 4.0 | 6.4 | 4.0 | — | Tiered coverage policy + local gate; E2E ownership fragmented |
| Security and tenancy isolation | 12 | 2.0 | 4.8 | 2.0 | — | CMS media + preview-link auth hardened; secrets history + SSRF remain |
| Observability and validation | 6 | 3.0 | 3.6 | 2.5 | +0.5 | Staging health check added; broader enforcement pending |
| Agent cohesion and delivery ops | 10 | 4.25 | 8.5 | 4.0 | +0.25 | Strong runbooks. Plan adds failure taxonomy + runbook spec. |

**Total: 68.3 / 100** (rounded to 68)

**Score breakdown**:
- **Impl**: Base score from implemented reality (Codex GPT-5.2 assessment)
- **Plan**: Credit for comprehensive, actionable plans that de-risk execution

Projected after M0–M2 hardening (`docs/plans/launch-readiness-hardening-plan.md`): achieved (see above).
Projected after full launch-shop implementation (`docs/plans/launch-shop-pipeline-plan.md`): ~78 / 100.

## Critical Path to Sub-3-Hour Rollout

| Step | Automation | Evidence | Risk to 3-hour target |
| --- | --- | --- | --- |
| Scaffold shop app + data | High | `pnpm quickstart-shop`, `pnpm init-shop` | Medium (full repo build before create) |
| Theme selection + token overrides | High | Theme packages + CMS theme editor | Low |
| Starter pages and templates | Medium | Templates + page scaffolding | Medium (content still manual) |
| Provider env and secrets | Low | `TODO_` placeholders, manual key entry | High |
| CI workflow creation | Medium | `scripts/src/setup-ci.ts` | Medium (safe wrappers now; existing workflows may need migration) |
| Deploy + domain | Medium | `deployShop` via adapter | Medium (domain/SSL not fully automated) |
| Post-deploy validation | Low | `.github/workflows/reusable-app.yml` + root staging | Medium-High (enforcement still uneven across legacy workflows) |

## Detailed Assessment

### 1) Launch Automation and Scaffolding (Score 3.5/5)

Strengths
- `pnpm quickstart-shop` wraps shop creation, env validation, and dev server launch.
- `pnpm init-shop` supports templates, themes, providers, nav/pages, and seeding.
- `createShop` and deployment adapters encapsulate scaffolding and deploy behavior.

Gaps
- `quickstart-shop` runs `pnpm -r build`, which adds significant time and does not leverage remote cache by default.
- No single non-interactive "launch" command exists today (plan exists; implementation pending).
- Domain configuration is not part of the CLI flow; it relies on later manual edits.

Planned work
- `docs/plans/launch-shop-pipeline-plan.md` defines the non-interactive orchestrator (implementation pending).

Impact on 3-hour requirement
- Strong foundation for rapid scaffold, but orchestration remains manual and time-consuming.

### 2) Theming and Design System (Score 4/5)

Strengths
- Multiple theme packages (`packages/themes/*`) and token-based theming support.
- CMS theme editor supports live preview and override persistence.
- CLI supports token overrides (`--brand`, `--tokens`) at shop creation.

Gaps
- No standardized generator for creating a new theme package from a brief.
- No automated theme validation for contrast/accessibility or visual regression per theme.
- Theme selection is fast, but creating a net-new brand theme still relies on manual token work.

Impact on 3-hour requirement
- Existing themes can ship quickly; net-new themes can consume most of the 3-hour window.

### 3) Content and CMS (Score 3/5)

Strengths
- Page scaffolding and templates exist (`packages/templates`, `scaffoldPageFromTemplate`).
- CMS page builder supports template-driven composition and previews.
- `--seed-full` and page template flags give instant baseline content.

Gaps
- Template catalog depth is limited for a full site without manual editing.
- Content QA (SEO, accessibility, copy review) is not automated for a new shop.
- CMS flows for checkout or specialty pages rely on manual steps.

Impact on 3-hour requirement
- You can reach "demo ready" quickly, but production content is still manual.

### 4) Environment and Secrets (Score 2/5)

Strengths
- Provider env keys are discovered by plugin metadata and collected in the CLI.
- `--auto-env` writes `TODO_` placeholders to avoid empty env files.
- Validation exists for shop env (`validateShopEnv`).
- `scripts/secrets.sh` provides SOPS/age wrappers, but encrypted envs are not yet adopted or wired into CI/app deploy flows.

Gaps
- No integrated secrets workflow end-to-end (materialization + CI wiring + deploy guardrails).
- `TODO_` placeholders are not deployable and are not universally blocked before deploy.
- Repo-level CI/deploy secrets (Cloudflare, Turbo) are not verified as part of a single “launch” flow.
- Per-shop runtime secrets (Stripe keys, etc.) verification is still manual/scattered.

Planned work
- `docs/plans/integrated-secrets-workflow-plan.md` (encrypted env templates + CI materialization + deploy gating).
- `docs/plans/launch-shop-pipeline-plan.md` (preflight verification via `gh secret list`, placeholder detection).

Impact on 3-hour requirement
- Still the biggest time sink and the main reason production rollouts miss the window.

### 5) CI/CD and Deployment (Score 3/5)

Strengths
- 23 workflows with reusable templates and app-level pipelines.
- Deployment adapters allow Cloudflare deployment without app changes.
- `.github/workflows/reusable-app.yml` provides a solid deploy baseline (including post-deploy health checks).
- `setup-ci` now generates reusable workflow wrappers that inherit health checks and targeted lint/test/build.

Gaps
- Remote cache is configured but not consistently provisioned (Turbo token/team), losing build speed.
- Workflow path filters are inconsistent, causing unnecessary CI/deploy runs.

Planned work
- `docs/plans/post-deploy-health-checks-mandatory-plan.md` (DEPLOY-02 through DEPLOY-05).
- `docs/plans/ci-deploy/ci-and-deploy-roadmap.md` (path filters + workflow boundaries).

Impact on 3-hour requirement
- Deploy is possible, but the “new shop” path is currently unsafe/heavy and validation is inconsistent.

### 6) Testing and Regression (Score 4/5)

Strengths
- Jest preset system with coverage tiers and a local coverage gate.
- Cypress smoke suite and Storybook UI smoke tests.
- Visual regression testing via Chromatic.
- **NEW:** Uniform tiered coverage policy implemented (`packages/config/coverage-tiers.cjs`):
  - CRITICAL (90%): `@acme/stripe`, `@acme/auth`, `@acme/platform-core`
  - STANDARD (80%): All other packages (default)
  - MINIMAL (0%): Type definitions, configs, templates
- **NEW:** Local coverage gate script (`scripts/check-coverage.sh`) for pre-commit validation.
- **NEW:** Coverage policy documented at `docs/test-coverage-policy.md`.

Coverage enforcement is local-only by design (not CI). This is best practice: immediate feedback, no flaky CI failures. CI gating will be revisited in June 2026.

Gaps
- E2E ownership is fragmented across root and app workflows.
- No dedicated "new shop launch" smoke suite (home, cart, checkout, CMS publish).

Impact on 3-hour requirement
- Testing exists, but launch validation is not one command and can be slow or inconsistent.

### 7) Security and Tenancy Isolation (Score 2/5)

Strengths
- Zod validation, Argon2 hashing, HMAC verification in place.

Gaps
- Remaining unauthenticated CMS endpoints (see `docs/security-audit-2026-01.md`) still need remediation:
  - `apps/cms/src/app/api/providers/[provider]/route.ts` (provider callback writes tokens)
- Cross-shop authorization gaps in CMS APIs require a formal audit.
- SSRF risk in webhook forwarding needs explicit URL validation.
- Secrets exist in git history and need rotation and history cleanup.

Planned work
- `docs/security-audit-2026-01.md` remediation workstream (broader hardening beyond M2).

Impact on 3-hour requirement
- These block a safe production rollout even if the technical launch is quick.

### 8) Observability and Post-Deploy Validation (Score 2.5/5)

Strengths
- Reusable app workflow runs `scripts/post-deploy-health-check.sh`.
- Cypress and Storybook smoke tests exist at the repo level.

Gaps
- Post-deploy health checks are not consistently applied to all deploy paths (broader enforcement pending).
- No standardized baseline monitoring or uptime checks for new shops (out of scope for launch pipeline).

Planned work
- `docs/plans/post-deploy-health-checks-mandatory-plan.md` (DEPLOY-02 through DEPLOY-05).

Impact on 3-hour requirement
- Lack of consistent validation increases risk and slows handoff to production.

### 9) Agent Cohesion and Delivery Ops (Score 4/5)

Strengths
- Strong runbooks (`AGENTS.md`, plan templates, safety rules) enable coordinated work.
- Clear instructions for testing, linting, and safety reduce agent conflict.

Gaps
- No single launch runbook or checklist focused on the 3-hour requirement (plans exist; implementation/runbook still pending).
- Knowledge is distributed across many docs, creating context-switching overhead.

Planned work
- `docs/plans/launch-shop-pipeline-plan.md` (LAUNCH-05 runbook spec; implementation pending).
- `docs/plans/launch-readiness-hardening-plan.md` (next-cycle M0–M2 execution plan).

Impact on 3-hour requirement
- Agents can collaborate safely, but coordination overhead still costs time.

## Recommendations (Prioritized for 3-Hour Launches)

Recent (M0–M2) — correctness + safety hardening
- Completed `docs/plans/launch-readiness-hardening-plan.md` (entrypoints, safe `setup-ci` generation, root staging health checks, CMS auth + preview hashing hardening).

### P0 - must do to meet the 3-hour requirement reliably

| # | Recommendation | Status | Tracking |
|---|----------------|--------|----------|
| P0.1 | Create a single non-interactive "launch shop" pipeline | Plan exists (implementation pending) | `docs/plans/launch-shop-pipeline-plan.md` — Tasks LAUNCH-00 through LAUNCH-06 |
| P0.2 | Add integrated secrets workflow | Plan exists (implementation pending) | `docs/plans/integrated-secrets-workflow-plan.md` |
| P0.3 | Make post-deploy health checks mandatory | Plan exists (implementation pending) | `docs/plans/post-deploy-health-checks-mandatory-plan.md` (DEPLOY-02 through DEPLOY-05) |
| P0.4 | Close remaining production-blocking CMS auth gaps | Plan exists (implementation pending) | `docs/security-audit-2026-01.md` |

**P0.1 implementation priority** (in order):
1. **LAUNCH-00**: Shop ID normalization — unblocks all other tasks
2. **LAUNCH-01**: Config schema — unblocks orchestrator
3. **LAUNCH-02**: Orchestrator MVP — delivers "one command" promise
4. **LAUNCH-03**: Workflow refactor — enables branch-aware deploy + artifact URL discovery
5. **LAUNCH-04**: URL discovery + smoke check integration
6. **LAUNCH-05**: Runbook + docs
7. **LAUNCH-06**: Tests

### P1 - high impact within 1-2 weeks

| # | Recommendation | Status | Notes |
|---|----------------|--------|-------|
| P1.1 | Enable Turbo remote cache in CI | Pending | Requires provisioning `TURBO_TOKEN` and `TURBO_TEAM` consistently in CI |
| P1.2 | Provide minimal "launch smoke" test pack | Pending | CI smoke via `reusable-app.yml` covers basics; dedicated suite still valuable |
| P1.3 | Add theme generation workflow | Pending | Out of scope for launch pipeline |

### P2 - quality improvements to approach world-class

| # | Recommendation | Status | Notes |
|---|----------------|--------|-------|
| P2.1 | Add "3-hour launch" runbook | Plan exists (implementation pending) | `docs/plans/launch-shop-pipeline-plan.md` (LAUNCH-05) |
| P2.2 | Standardize content template library | Pending | |
| P2.3 | Add launch readiness checklist to CMS | Pending | |
| P2.4 | Enable test file typechecking in VS Code | Pending | See [test-typechecking-plan.md](docs/plans/test-typechecking-plan.md) |

## Metrics to Track

- Mean time to launch (MTTL) for a new shop (target: under 3 hours).
- Manual step count in the launch flow (target: under 5).
- First-pass deploy success rate.
- Post-deploy validation pass rate.
- Time from scaffold to live domain.

## Appendix: Evidence References

### Scripts and CLI
- `scripts/src/quickstart-shop.ts`
- `scripts/src/init-shop.ts`
- `scripts/src/setup-ci.ts`
- `scripts/post-deploy-health-check.sh`
- `scripts/secrets.sh` — SOPS + age encryption
- `package.json` (script entrypoints)

### Documentation
- `docs/setup.md`
- `docs/theming-advanced.md`
- `docs/deployment-adapters.md`
- `AGENTS.md`
- `docs/test-coverage-policy.md` — Coverage enforcement policy

### Packages
- `packages/themes/`
- `packages/templates/`
- `packages/platform-core/src/createShop/` — Shop creation + deployment adapters
- `packages/platform-core/src/createShop/schema.ts` — `CreateShopOptions` zod schema
- `packages/config/coverage-tiers.cjs` — Tiered coverage policy (CRITICAL/STANDARD/MINIMAL)
- `packages/config/src/env/index.ts` — `envSchema` validation

### Workflows
- `.github/workflows/reusable-app.yml` — Includes post-deploy health checks
- `.github/workflows/ci.yml` — Root staging deploy path
- `.github/workflows/cypress.yml`
- `.github/workflows/storybook.yml`

### Plans (launch-related)
- `docs/plans/launch-shop-pipeline-plan.md` — **Primary reference for P0.1**
- `docs/plans/integrated-secrets-workflow-plan.md`
- `docs/plans/post-deploy-health-checks-mandatory-plan.md`
- `docs/plans/launch-readiness-hardening-plan.md` — Next-cycle M0–M2 hardening execution plan
- `docs/plans/test-typechecking-plan.md`

### Security
- `docs/security-audit-2026-01.md`
- `apps/cms/src/app/api/media/route.ts`
- `apps/cms/src/app/api/page-versions/[shop]/[pageId]/[versionId]/preview-link/route.ts`
- `apps/cms/src/app/api/page-versions/preview/[token]/route.ts`

### Testing
- `scripts/check-coverage.sh` — Local coverage gate script

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-17 | Codex | Restructured audit around 3-hour launch readiness requirement |
| 2026-01-17 | Claude Opus 4.5 | Testing score 3.5→4.0: Added tiered coverage policy (`packages/config/coverage-tiers.cjs`), local gate script (`scripts/check-coverage.sh`), and policy doc (`docs/test-coverage-policy.md`). Coverage enforcement is local-only by design; CI gating deferred to June 2026. Total score 64→65. |
| 2026-01-18 | Claude Opus 4.5 | **Total score 65→72.4** based on comprehensive launch-shop pipeline plan. Score changes: Launch automation 4.0→4.5 (orchestrator, dry-run, resume specified); Environment/secrets 2.0→3.0 (MVP secrets registry, preflight verification); CI/CD 3.0→3.5 (branch-aware deploy, artifact URL discovery); Observability 2.5→3.5 (CI smoke authority, deploy-metadata artifact); Agent cohesion 4.0→4.5 (runbook/failure taxonomy specified). Plan addresses P0.1, P0.3, P1.1, P2.1 recommendations. Implementation tasks LAUNCH-00 through LAUNCH-06 defined and ready. |
| 2026-01-18 | Codex (GPT-5.2) | Re-scored to 58 and updated gaps based on implemented reality (entrypoint breakage, unsafe `setup-ci` output, missing root staging health check, verified CMS auth gaps). Added M0–M2 hardening plan and separated "plan exists" from "shipped." |
| 2026-01-18 | Claude (Opus 4.5) | **Reconciled score: 58→63.** Ground-up recalculation incorporating both implementation reality (Codex findings) and plan completeness (launch-shop pipeline plan updates). Methodology: implementation gaps determine base score; comprehensive plans with detailed specs add partial credit (~0.5 points/category). Key plan contributions: orchestrator with dry-run/resume (LAUNCH-02), MVP secrets registry (LAUNCH-01), branch-aware deploy + artifact URL discovery (LAUNCH-03/04), CI-authoritative smoke checks (LAUNCH-04), failure taxonomy (LAUNCH-05). Security score unchanged—plans don't mitigate implementation blockers. |
| 2026-01-18 | Codex (GPT-5.2) | **Re-scored to 68** after completing M0–M2 hardening (entrypoints fixed, `setup-ci` wrapper generation, root staging health check, CMS auth + preview hashing hardening). |
