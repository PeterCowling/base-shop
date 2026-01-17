---
Type: Audit
Status: Active
Domain: Repo
Created: 2026-01-17
Created-by: Codex
Last-updated: 2026-01-17
Last-updated-by: Codex
---

# Repository Quality Audit - January 2026 (Launch Readiness)

This audit is rebuilt around the core requirement: roll out a new shop website in under 3 hours. The focus is not just repo hygiene, but the end-to-end ability to create, theme, configure, deploy, and validate a new shop quickly and repeatably.

## Executive Summary

Launch Readiness Score: 64/100 (world-class bar is 85+).

The repo is strong in scaffolding, theming, and agent operations. It is not yet world-class for the 3-hour launch requirement because the production-critical path still includes manual steps for secrets, deployment validation, and security gaps that block a safe rollout. The fastest path exists for local or internal demo shops; production-ready launch within 3 hours is not yet dependable.

Top blockers to 3-hour production rollouts:
- Environment and secrets provisioning is still manual and scattered (TODO_ placeholders, no integrated secrets workflow).
- Post-deploy validation is inconsistent outside the reusable app flow; no universal smoke checks for new shops.
- Security gaps (cross-shop auth audit, SSRF validation, secrets history) block safe go-live.

Fast wins:
- A single, non-interactive launch pipeline that composes `init-shop`, `setup-ci`, deploy, and smoke checks.
- Remote cache enablement (`TURBO_TOKEN`/`TURBO_TEAM`) and narrower build/test scopes for new shops.
- A minimal launch checklist and runbook that agents can execute without cross-referencing 10+ docs.

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
- `scripts/src/quickstart-shop.ts`, `scripts/src/initShop.ts`, `scripts/src/setup-ci.ts`
- `docs/setup.md`, `docs/theming-advanced.md`, `docs/deployment-adapters.md`
- `packages/themes/*`, `packages/templates/*`, `packages/platform-core/*`
- `AGENTS.md` and agent runbooks
- `.github/workflows/*` (reusable app pipeline, Cypress, Storybook)

## Scoring Model

Scale (0-5 per category, weighted to 100):
- 5 = world-class, repeatable in under 3 hours with minimal manual steps
- 4 = strong, usually under 3 hours with expert operator
- 3 = adequate, 3-6 hours with manual steps and risk
- 2 = weak, 6-24 hours and not reliably repeatable
- 1 = critical, blocked or not viable

World-class bar: 85+ with no category below 3.

## Launch Readiness Scorecard

| Category | Weight | Score (0-5) | Points | Summary |
| --- | --- | --- | --- | --- |
| Launch automation and scaffolding | 20 | 4.0 | 16.0 | Strong CLI scaffolding; full build and prompts add time |
| Theming and design system | 12 | 4.0 | 9.6 | Multi-theme support + token overrides; limited automation for new themes |
| Content and CMS | 10 | 3.0 | 6.0 | Template scaffolding exists; content depth still manual |
| Environment and secrets | 10 | 2.0 | 4.0 | Placeholders and manual secrets slow real launches |
| CI/CD and deployment | 12 | 3.0 | 7.2 | Solid pipelines; inconsistent post-deploy checks and cache gaps |
| Testing and regression | 8 | 3.5 | 5.6 | Good infra; E2E ownership fragmented |
| Security and tenancy isolation | 12 | 2.0 | 4.8 | Cross-shop auth and SSRF issues block safe launch |
| Observability and validation | 6 | 2.5 | 3.0 | Some checks exist, not universal |
| Agent cohesion and delivery ops | 10 | 4.0 | 8.0 | Strong runbooks and governance; no single launch runbook |

Total: 64.2 / 100

## Critical Path to Sub-3-Hour Rollout

| Step | Automation | Evidence | Risk to 3-hour target |
| --- | --- | --- | --- |
| Scaffold shop app + data | High | `pnpm quickstart-shop`, `pnpm init-shop` | Medium (full repo build before create) |
| Theme selection + token overrides | High | Theme packages + CMS theme editor | Low |
| Starter pages and templates | Medium | Templates + page scaffolding | Medium (content still manual) |
| Provider env and secrets | Low | `TODO_` placeholders, manual key entry | High |
| CI workflow creation | Medium | `scripts/src/setup-ci.ts` | Medium (workflow is generic, heavy) |
| Deploy + domain | Medium | `deployShop` via adapter | Medium (domain/SSL not fully automated) |
| Post-deploy validation | Low | Reusable app checks only | High |

## Detailed Assessment

### 1) Launch Automation and Scaffolding (Score 4/5)

Strengths
- `pnpm quickstart-shop` wraps shop creation, env validation, and dev server launch.
- `pnpm init-shop` supports templates, themes, providers, nav/pages, and seeding.
- `createShop` and deployment adapters encapsulate scaffolding and deploy behavior.

Gaps
- `quickstart-shop` runs `pnpm -r build`, which adds significant time and does not leverage remote cache by default.
- The flow is still prompt-heavy; no single non-interactive "launch" command exists to chain create, CI, deploy, and checks.
- Domain configuration is not part of the CLI flow; it relies on later manual edits.

Impact on 3-hour requirement
- Strong foundation for rapid scaffold, but time is lost in full builds and manual prompts.

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

Gaps
- No integrated secrets manager workflow (Vault, 1Password, etc.).
- TODO placeholders are not deployable; production rollout requires manual secrets injection.
- Domain and analytics IDs are not fully integrated into the launch flow.

Impact on 3-hour requirement
- This is the biggest time sink and the main reason production rollouts miss the window.

### 5) CI/CD and Deployment (Score 3/5)

Strengths
- 23 workflows with reusable templates and app-level pipelines.
- Deployment adapters allow Cloudflare deployment without app changes.
- `setup-ci` can generate a shop workflow from a shop's `.env`.

Gaps
- Remote cache is configured but secrets are not set, losing build speed.
- `setup-ci` generates a workflow that runs `pnpm test` unfiltered, which violates the testing policy and is slow for new shops.
- Post-deploy checks exist in reusable app workflow only; other apps do not inherit it by default.

Impact on 3-hour requirement
- Deploy is possible, but validation and speed are inconsistent across apps.

### 6) Testing and Regression (Score 3.5/5)

Strengths
- Jest preset system with coverage tiers and a local coverage gate.
- Cypress smoke suite and Storybook UI smoke tests.
- Visual regression testing via Chromatic.

Gaps
- E2E ownership is fragmented across root and app workflows.
- No dedicated "new shop launch" smoke suite (home, cart, checkout, CMS publish).

Impact on 3-hour requirement
- Testing exists, but launch validation is not one command and can be slow or inconsistent.

### 7) Security and Tenancy Isolation (Score 2/5)

Strengths
- Zod validation, Argon2 hashing, HMAC verification in place.

Gaps
- Cross-shop authorization gaps in CMS APIs require a formal audit.
- SSRF risk in webhook forwarding needs explicit URL validation.
- Secrets exist in git history and need rotation and history cleanup.

Impact on 3-hour requirement
- These block a safe production rollout even if the technical launch is quick.

### 8) Observability and Post-Deploy Validation (Score 2.5/5)

Strengths
- Reusable app workflow runs `scripts/post-deploy-health-check.sh`.
- Cypress and Storybook smoke tests exist at the repo level.

Gaps
- Post-deploy health checks are not consistently applied to all app workflows.
- No standardized baseline monitoring or uptime checks for new shops.

Impact on 3-hour requirement
- Lack of consistent validation increases risk and slows handoff to production.

### 9) Agent Cohesion and Delivery Ops (Score 4/5)

Strengths
- Strong runbooks (`AGENTS.md`, plan templates, safety rules) enable coordinated work.
- Clear instructions for testing, linting, and safety reduce agent conflict.

Gaps
- No single launch runbook or checklist focused on the 3-hour requirement.
- Knowledge is distributed across many docs, creating context-switching overhead.

Impact on 3-hour requirement
- Agents can collaborate safely, but coordination overhead still costs time.

## Recommendations (Prioritized for 3-Hour Launches)

P0 - must do to meet the 3-hour requirement reliably
1. Create a single non-interactive "launch shop" pipeline that chains create, seed, CI setup, deploy, and smoke checks. (tracked in `docs/plans/launch-shop-pipeline-plan.md`)
2. Add an integrated secrets workflow (Vault or encrypted env templates) so `TODO_` placeholders are not the launch bottleneck. (tracked in `docs/plans/integrated-secrets-workflow-plan.md`)
3. Make post-deploy health checks mandatory for all shop workflows (root, reusable, and per-app). (tracked in `docs/plans/post-deploy-health-checks-mandatory-plan.md`)

P1 - high impact within 1-2 weeks
1. Enable Turbo remote cache in CI to shrink the full build path for new shops.
2. Provide a minimal "launch smoke" test pack (home, cart, checkout, CMS publish) that can run with `--maxWorkers=2`.
3. Add a theme generation workflow (from a base theme + token overrides) with automated contrast checks.

P2 - quality improvements to approach world-class
1. Add a "3-hour launch" runbook with time budgets, owners, and fallback options.
2. Standardize a content template library for common verticals (hero, product, about, FAQ, contact).
3. Add a launch readiness checklist to the CMS (preflight lint/health/SEO summary).

## Metrics to Track

- Mean time to launch (MTTL) for a new shop (target: under 3 hours).
- Manual step count in the launch flow (target: under 5).
- First-pass deploy success rate.
- Post-deploy validation pass rate.
- Time from scaffold to live domain.

## Appendix: Evidence References

- `scripts/src/quickstart-shop.ts`
- `scripts/src/initShop.ts`
- `scripts/src/setup-ci.ts`
- `docs/setup.md`
- `docs/theming-advanced.md`
- `docs/deployment-adapters.md`
- `packages/themes/`
- `packages/templates/`
- `.github/workflows/reusable-app.yml`
- `.github/workflows/cypress.yml`
- `.github/workflows/storybook.yml`
- `AGENTS.md`
