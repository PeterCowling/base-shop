Type: Policy
Status: Active
Domain: Repo
Last-reviewed: 2026-02-27
Created: 2026-01-17
Created-by: Claude Opus 4.5 (extracted from AGENTS.md)

# Testing Policy

This document defines mandatory testing rules for all agents and developers working in Base-Shop.

---

> **CI-ONLY TEST POLICY (effective 2026-02-27)**
> All Jest and e2e tests run in GitHub Actions CI only. Do not run test commands locally.
> Push your changes and monitor CI results via `gh run watch`.
> Linting and typechecking remain local as before.

---

> **INCIDENT REFERENCE: On Jan 16, 2026, orphaned Jest processes consumed 2.5GB+ RAM and caused system slowdown.**
> Multiple test runs were started but never terminated, accumulating over 2+ hours.
> The machine had only 93MB free RAM and load average of 7.73.
> This policy (CI-only test execution) directly addresses that class of failure.

---

## Rule 1: All Tests Run in CI Only

**Tests run in GitHub Actions CI. Do not invoke Jest or e2e test runners locally.**

```bash
# DO NOT run these locally
jest
pnpm test
pnpm --filter <pkg> test
npx jest
pnpm exec jest
```

**Instead: push your changes and monitor CI:**

```bash
gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId')
```

**Why:** Running tests locally consumes 2–4 GB RAM per run and destabilises the machine during bursty multi-agent workflows. CI provides isolation, sharding, and consistent pass/fail gating.

**Technical enforcement (agent-mediated paths):**
- `run-governed-test.sh` (the governed runner) exits 1 with a redirect message when `BASESHOP_CI_ONLY_TESTS=1` is set and `CI` is not `true`.
- `integrator-shell.sh` exports `BASESHOP_CI_ONLY_TESTS=1` into all agent shells automatically.
- `scripts/agent-bin/npx` and `scripts/agent-bin/pnpm` continue to block raw Jest entry points.
- Direct-shell invocations (e.g., `pnpm test:affected`) are covered by policy only.

**CI test environments:**
- `CI=true` is set by GitHub Actions on all runners. The governed runner's compatibility mode respects this and will not block CI execution.

---

## Rule 2: Linting and Typechecking Remain Local

Linting and typechecking are **not** subject to the CI-only policy. Run them locally as always:

```bash
pnpm --filter <pkg> typecheck
pnpm --filter <pkg> lint
# Or combined via validate-changes.sh (no tests):
bash scripts/validate-changes.sh
```

`scripts/validate-changes.sh` defaults to skipping tests. The test opt-in flag is blocked at runtime under CI-only policy.

---

## Rule 3: Stable Mock References for React Components

When mocking hooks that return objects (for example `useRouter`, `useTranslation`, `useSearchParams`, or custom hooks), define the return object outside the mock factory.

**Problem:** Returning a fresh object on every call can trigger infinite re-render loops when a component uses the hook result in dependency arrays (for example `useEffect([router])`). In tests this often appears as a timeout instead of a clear assertion failure.

```typescript
// BAD: new object each call (unstable reference)
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

// GOOD: stable reference across calls
const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));
```

Apply this pattern to any mocked object that may be used in React dependency arrays.

---

## CI E2E Ownership (Reference)

- Root CI (`.github/workflows/ci.yml`) runs only the cross-app **shop** subset (`pnpm e2e:shop`) when shop paths change.
- CMS E2E suites (smoke + dashboard) run in `.github/workflows/cypress.yml`.
- Workspace CI (`.github/workflows/test.yml`) runs `e2e` only when a workspace defines it (`--if-present`) and is scheduled/manual, not a merge gate.

See `docs/plans/e2e-ownership-consolidation-plan.md` for the full ownership policy.

---

## Brikette Deploy Preflight

When a change affects Brikette deploy/static-export surfaces, run this local preflight before pushing:

```bash
pnpm preflight:brikette-deploy
```

This checks:
- required static-export routes include `generateStaticParams()`
- `robots.txt` route exports `GET()`
- required `apps/brikette/wrangler.toml` fields are present

Use `pnpm preflight:brikette-deploy -- --json` for machine-readable output.

## Brikette CI Test Sharding (Staging)

Brikette staging CI now supports sharded Jest execution in the reusable deploy pipeline.

- Shard mode: `3` shards (`1/3`, `2/3`, `3/3`)
- Trigger: Brikette validation path when `run_validation=true`
- Test selection modes:
  - `test_scope=related`: run related tests only
    - `pnpm --filter @apps/brikette exec jest --ci --runInBand --passWithNoTests --shard=<n>/3 --findRelatedTests <changed-source-files...>`
  - `test_scope=full`: run full suite shard
    - `pnpm --filter @apps/brikette exec jest --ci --runInBand --passWithNoTests --shard=<n>/3`
  - `run_validation=false`: skip lint/typecheck/test entirely (deploy-only, confident)
- Safety fallback:
  - Any uncertain/unknown classification falls back to `test_scope=full`
  - Any related-test mode with no eligible files falls back to full-suite shard execution
- Cache restore is enabled for shard jobs:
  - `.ts-jest`
  - `node_modules/.cache/jest`
  - `apps/brikette/node_modules/.cache/jest`

When diagnosing CI duration regressions, compare shard runtimes and overall `Validate & build` time using:

```bash
pnpm --filter scripts run collect-workflow-metrics -- \
  --workflow "Deploy Brikette" \
  --branch staging \
  --event push \
  --include-jobs
```

---

## Prime Firebase Cost-Safety Gate

When changing Prime guest data-loading, listener, or Firebase wrapper code, run the cost-safety suite before pushing:

```bash
pnpm --filter @apps/prime test:firebase-cost-gate
```

This suite enforces:
- query-budget contracts for guest-critical flows
- listener lifecycle leak checks
- regression-gate behavior against checked-in baseline budgets

---

## Coverage Tier Source Of Truth

- Coverage tier assignments and per-metric thresholds are defined in `packages/config/coverage-tiers.cjs`.
- `@acme/types` now uses `SCHEMA_BASELINE` (`lines:70`, `branches:0`, `functions:50`, `statements:70`) instead of `MINIMAL`.
- `scripts/check-coverage.sh` resolves tier metadata directly from `coverage-tiers.cjs`; do not maintain duplicated threshold tables elsewhere.

---

## Hydration Testing

**Purpose:** Detect React server/client hydration mismatches that `suppressHydrationWarning` masks.

**When to use:** When working on SSR components, especially guides, structured data, or any component that might render differently on server vs client.

### Hydration Test Utilities

Location: `apps/brikette/src/test/helpers/hydrationTestUtils.ts`

**Available functions:**
- `renderWithHydration({ server, client })` — Simulates SSR → client hydration cycle
- `expectNoHydrationErrors(result)` — Asserts no hydration mismatches occurred

### Usage Pattern

```tsx
import { renderWithHydration, expectNoHydrationErrors } from "@/test/helpers/hydrationTestUtils";

it("renders consistently on server and client", () => {
  const result = renderWithHydration({
    server: <MyComponent prop="value" />,
    client: <MyComponent prop="value" />,
  });

  // Assert no hydration errors
  expectNoHydrationErrors(result);

  // Optionally inspect rendered output
  expect(result.serverHTML).toContain("expected content");
  expect(result.container.querySelector(".my-class")).toBeTruthy();
});
```

### Testing for Mismatches

To verify your test harness catches real mismatches:

```tsx
it("detects when components diverge", () => {
  const result = renderWithHydration({
    server: <div>Server</div>,
    client: <div>Client</div>,
  });

  // Should capture the mismatch
  expect(result.hydrationErrors.length).toBeGreaterThan(0);
});
```

### Important Notes

- **SSR simulation:** The utility temporarily clears `window`/`document` during server render to simulate real SSR.
- **Error capture:** Hydration errors are captured both via `onRecoverableError` and thrown exceptions (React 19 behavior).
- **Jest limitations:** In Jest/JSDOM, some `typeof window` checks may not behave exactly like production SSR. The utility does its best to simulate the environment.
- **Use for regression prevention:** Add hydration tests for components that have had hydration issues in the past.

---

## CI Feedback Loop

After pushing to `dev`, monitor CI with:

```bash
# Watch the most recent run
gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId')

# List recent runs
gh run list --limit 5

# View a specific run
gh run view <run-id>
```

CI pipelines that run on `dev` branch push:
- **Core Platform CI** (`.github/workflows/ci.yml`): lint, typecheck, test, storybook-visual, build, e2e — triggers on all dev pushes (except `apps/cms/**` and `apps/skylar/**` paths).

App-specific pipelines (`prime.yml`, `brikette.yml`, `caryina.yml`) trigger via `pull_request` events. The `ship-to-staging.sh` script always opens a PR, ensuring these pipelines run before staging merges.

---

## Historical Context: Test Execution Resource Governor

The Test Execution Resource Governor plan (`docs/plans/test-execution-resource-governor-plan.md`) was designed to throttle local Jest execution via scheduling and resource admission. That plan's Phases 2-3 (scheduler, resource admission) are **Superseded** by this CI-only policy — when no tests run locally via agent-mediated paths, there is nothing to schedule or admit.

Phases 0-1 of the governor (command guard wrappers: `agent-bin/npx`, `agent-bin/pnpm`, `guarded-shell-hooks.sh`) remain in place as the enforcement layer for the CI-only block.

---

## Why This Matters

**Reference incident (2026-01-16):**
- 10+ Jest worker processes were running simultaneously
- Combined RAM usage: 2.5GB+
- System had only 93MB free RAM (out of 16GB)
- Load average: 7.73 (should be <4)
- Some processes had been running since 9:05AM (2+ hours)

**Lesson:** Tests belong in CI — isolated, parallel, resource-controlled, and with automatic cleanup on timeout. Local testing is a RAM liability under multi-agent workflows.
