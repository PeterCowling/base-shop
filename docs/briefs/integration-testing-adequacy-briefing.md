---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: Repo / Testing
Created: 2026-02-23
Last-updated: 2026-02-23
Topic-Slug: integration-testing-adequacy
---

# Integration Testing Adequacy Briefing

## Executive Summary
Integration testing is partially adequate, not robustly adequate.

Current state strengths:
- The repo has broad integration-labeled coverage footprint (48 `*integration*` Jest suites across apps/packages/scripts) and a large CMS/browser flow surface (`apps/cms/cypress/e2e` + `test/e2e` currently totals 121 spec files).
- Local and CI defaults enforce change-scoped testing (`test:affected`, related-test selection, governed runner constraints), which keeps execution practical.

Current state weaknesses:
- High-risk real-provider integration suites (Stripe, Redis, Prisma DB) are explicitly skip-gated by environment variables and are likely skipped in standard CI runs.
- Multiple declared integration suites are currently non-executing (`describe.skip` or `it.todo` only).
- Some critical integration surfaces (notably MCP server integration suites) are not wired into standard PR CI test gates.
- CMS Cypress component testing is dispatch-only (not PR/push-gated), and routine CI runs smoke subsets rather than full browser integration surfaces.

Bottom line:
- Adequacy for routine regression detection: **medium**.
- Adequacy for high-risk cross-system/runtime integration failures: **medium-low**.

## Questions Answered
- Q1: What integration test surfaces exist in the repo today (Jest + Cypress)?
- Q2: Which integration tests are actually part of standard CI gating vs nightly/manual lanes?
- Q3: Are high-risk external/provider integration paths exercised in CI or only conditionally?
- Q4: Are there integration suites currently skipped or placeholder-only?
- Q5: Does the current changed-files test strategy protect against cross-boundary regressions?
- Q6: What are the highest-risk adequacy gaps to address first?

## High-Level Architecture
- Local/pre-push gate:
  - `scripts/validate-changes.sh` (targeted related-test execution, package-aware runner behavior, mcp-server special handling).
- Core CI gate:
  - `.github/workflows/ci.yml` runs affected lint/typecheck and `pnpm test:affected`.
- App CI gate:
  - `.github/workflows/reusable-app.yml` classifies changes and often runs Jest with `--findRelatedTests`.
- Browser/E2E gate:
  - `.github/workflows/cypress.yml` runs CMS smoke/dashboard E2E; CT is dispatch-only.
- Nightly quality lane:
  - `.github/workflows/test.yml` is scheduled/manual and performs broader workspace checks.

## End-to-End Flow
### Primary CI integration-test flow
1. Root test policy blocks broad local test fan-out and pushes teams toward targeted runs (`package.json` `test`, `test:governed`, `test:affected`).
2. Core CI executes affected tests (`.github/workflows/ci.yml` -> `pnpm test:affected`).
3. App workflows use `reusable-app.yml`, where test selection is often `--findRelatedTests` on changed runtime paths.
4. CMS browser checks run in `cypress.yml` smoke/dashboard jobs.
5. Broader quality coverage runs in nightly/manual `test.yml`.

- Evidence:
  - `package.json:40`
  - `package.json:42`
  - `package.json:43`
  - `.github/workflows/ci.yml:346`
  - `.github/workflows/reusable-app.yml:453`
  - `.github/workflows/cypress.yml:147`
  - `.github/workflows/cypress.yml:186`
  - `.github/workflows/test.yml:1`

### Alternate/edge paths
- Deploy-only classifier can set test scope to `skip` in reusable app pipelines.
- Brikette workflows can shard tests (`test-shard-count: 3`) but still use related-file selection logic from reusable pipeline.

- Evidence:
  - `.github/workflows/reusable-app.yml:391`
  - `.github/workflows/reusable-app.yml:423`
  - `.github/workflows/brikette.yml:158`

## Data & Contracts
- Integration suite discovery convention in this review:
  - `rg --files -g *integration*.test.ts -g *integration*.test.tsx -g *integration*.spec.ts -g *integration*.spec.tsx`
- This review found 48 integration-labeled Jest suites.
- CMS/browser suite footprint:
  - `apps/cms/cypress/e2e` + `test/e2e` currently has 121 spec files.

Contract-level caveat:
- `@acme/mcp-server` contains integration suites but has no `test` script, only `test:startup-loop`; this weakens default CI coupling when pipelines rely on package-level `test` discovery.

- Evidence:
  - `packages/mcp-server/package.json:31`
  - `packages/mcp-server/package.json:36`

## Configuration, Flags, and Operational Controls
- High-risk real integration suites are env-gated:
  - Stripe suite skips without `STRIPE_TEST_KEY`.
  - Auth Redis suite skips without Upstash credentials.
  - Platform-core DB suite skips without `DATABASE_URL` and non-`test` NODE_ENV.
- Root CI test step does not set these provider-specific vars.

- Evidence:
  - `packages/stripe/src/__tests__/stripe-integration.test.ts:25`
  - `packages/auth/src/__tests__/redisStore.integration.test.ts:32`
  - `packages/platform-core/src/__tests__/db.integration.test.ts:37`
  - `.github/workflows/ci.yml:346`

## Error Handling and Failure Modes
- FM-1: False confidence from conditional skips on external integrations.
  - Risk: green CI while Stripe/Redis/DB integration contracts are unverified.
  - Evidence: `packages/stripe/src/__tests__/stripe-integration.test.ts:12`, `packages/auth/src/__tests__/redisStore.integration.test.ts:12`, `packages/platform-core/src/__tests__/db.integration.test.ts:14`

- FM-2: Important suites declared but non-executing.
  - Risk: critical flows appear covered but are currently skipped/todo.
  - Evidence: `apps/brikette/src/test/routes/guides/__tests__/GuideSeoTemplate.integration.test.tsx:4`, `apps/cms/__tests__/pb/pageBuilder.real.integration.test.tsx:84`, `apps/cms/__tests__/PageBuilder.integration.test.tsx:120`

- FM-3: CI integration signal focuses on smoke subsets.
  - Risk: regressions outside smoke/dashboard paths can escape PR gates.
  - Evidence: `.github/workflows/cypress.yml:147`, `.github/workflows/cypress.yml:186`

- FM-4: Cypress CT not continuously enforced.
  - Risk: component-level integration regressions in CMS are not blocked in normal PR/push.
  - Evidence: `.github/workflows/cypress.yml:80`

- FM-5: MCP integration suites not in standard CI test lane.
  - Risk: tool-chain integration breakage reaches merge path unless manually/locally covered.
  - Evidence: `packages/mcp-server/package.json:36`, `.github/workflows/ci.yml:229`

## Tests and Coverage
- Existing integration strengths:
  - CMS has the deepest integration footprint (11 integration-labeled Jest suites plus broad Cypress coverage).
  - Startup-loop/MCP integration suites exist and are substantial in code volume.
  - Core policy enforces targeted test execution to reduce flaky/broad overload incidents.

- Evidence:
  - `apps/cms/__tests__/launchShop.integration.test.ts:30`
  - `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts:467`
  - `docs/testing-policy.md:21`
  - `docs/testing-policy.md:83`

- Adequacy gaps:
  - Real-provider integration is present but usually optional/skip-gated.
  - Some high-value suites are placeholders/skipped.
  - Standard CI does not guarantee broad browser integration coverage per PR.
  - Changed-file related-test strategy is efficient, but can miss non-local integration regressions.

- Evidence:
  - `packages/stripe/src/__tests__/stripe-integration.test.ts:25`
  - `apps/brikette/src/test/routes/guides/__tests__/GuideSeoTemplate.integration.test.tsx:4`
  - `.github/workflows/reusable-app.yml:453`
  - `.github/workflows/reusable-app.yml:457`

## Unknowns / Follow-ups
- Unknown: Are provider credentials (Stripe/Upstash/DB) configured in CI contexts where these suites run?
  - How to verify: inspect workflow run logs + repository/org secret mappings for test jobs; confirm execution counts for `stripe-integration`, `redisStore.integration`, and `db.integration` suites.

- Unknown: Is there an explicit policy that mcp-server integration suites are intentionally excluded from PR gates?
  - How to verify: check merge-gate required workflow mapping and confirm whether any workflow invokes `pnpm --filter @acme/mcp-server test:startup-loop`.

- Unknown: What percentage of the 121 Cypress specs are expected to be blocking vs informational?
  - How to verify: classify specs by tag and map to required workflow jobs in `.github/workflows/cypress.yml` and merge-gate requirements.

## If You Later Want to Change This (Non-plan)
- Likely change points:
  - `.github/workflows/ci.yml` (promote selected integration suites to required lanes).
  - `.github/workflows/cypress.yml` (move CT from dispatch-only to gated when Vite/ESM issue is resolved).
  - `packages/mcp-server/package.json` (add canonical `test` script or explicit CI invocation for integration suites).
  - `apps/cms/__tests__/pb/pageBuilder.real.integration.test.tsx` and `apps/brikette/src/test/routes/guides/__tests__/GuideSeoTemplate.integration.test.tsx` (convert skipped/todo coverage into executable suites).

- Key risks if unchanged:
  - CI green runs can mask integration breakage at external/provider and cross-module boundaries.
  - Manual/nightly discovery latency increases mean-time-to-detect regressions.
