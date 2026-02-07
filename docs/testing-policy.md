Type: Policy
Status: Active
Domain: Repo
Last-reviewed: 2026-01-17
Created: 2026-01-17
Created-by: Claude Opus 4.5 (extracted from AGENTS.md)

# Testing Policy

This document defines mandatory testing rules for all agents and developers working in Base-Shop.

---

> **INCIDENT REFERENCE: On Jan 16, 2026, orphaned Jest processes consumed 2.5GB+ RAM and caused system slowdown.**
> Multiple test runs were started but never terminated, accumulating over 2+ hours.
> The machine had only 93MB free RAM and load average of 7.73.
> **THESE RULES EXIST TO PREVENT THIS FROM HAPPENING AGAIN.**

---

## Rule 1: NEVER Run Broad Test Suites

**PROHIBITED test commands (never run these without explicit user request):**

```bash
# NEVER run these - they spawn many workers and consume excessive resources
pnpm test                           # Runs ALL tests in monorepo
pnpm --filter @acme/ui test         # Runs ALL tests in a large package
pnpm --filter @apps/cms test        # Runs ALL tests in an app
jest                                # Runs all tests in current directory
```

**Why:** Broad test runs spawn multiple Jest workers (4-8 per run), each consuming 200-500MB RAM. Multiple concurrent runs can easily consume 2-5GB and bring the system to a crawl.

**Exception (allowed only when explicitly requested by user):**
- You may run **all tests sequentially, one test file at a time**.
- Requirements:
  - Enumerate test files with `rg --files -g "*.{test,spec}.{ts,tsx,js,jsx,mjs,cjs}"` and run each file path explicitly.
  - Run each file individually (no parallel runs).
  - Stop on first failure, fix, then resume.
  - Use `--maxWorkers=1` (or `--runInBand`) for each file.
  - Still **never** run `pnpm test` unfiltered.
  - Check for orphaned Jest processes before starting (Rule 4).
  - Use the correct runner by location: Jest for unit/integration tests; Cypress for `test/e2e/**` and `apps/**/cypress/e2e/**` (see `docs/cypress.md`).
  - If Jest reports ESM parsing errors, retry the file with `JEST_FORCE_CJS=1` (some packages/scripts require CJS mode).
  - Once started, continue through the list without pausing for confirmations; only interrupt for a failure or a special setup requirement.

**API test notes (apps/api):**
- The `@apps/api` test script runs with `rootDir` set to `apps/api`, which breaks `setupFilesAfterEnv` paths in `apps/api/jest.config.cjs`.
- Run API tests from the repo root with an explicit rootDir and config:
  ```bash
  pnpm exec jest --ci --runInBand --detectOpenHandles \
    --config apps/api/jest.config.cjs \
    --rootDir . \
    --runTestsByPath apps/api/src/.../__tests__/file.test.ts \
    --coverage=false
  ```
- Use `--coverage=false` for single-file runs to avoid tripping the global coverage thresholds.

---

## Rule 2: Always Use Targeted Test Commands

**REQUIRED approach - always scope tests to the minimum necessary:**

```bash
# CORRECT: Run a single test file
pnpm --filter @acme/ui test -- src/atoms/Button.test.tsx

# CORRECT: Run tests matching a pattern
pnpm --filter @acme/ui test -- --testPathPattern="Button"

# CORRECT: Run a specific describe block or test
pnpm --filter @acme/ui test -- --testNamePattern="renders correctly"

# CORRECT: Combine file and test name patterns
pnpm --filter @acme/ui test -- src/atoms/Button.test.tsx -t "handles click"
```

---

## Rule 3: Limit Jest Workers

**When you must run broader tests, always limit workers:**

```bash
# Limit to 2 workers maximum
pnpm --filter @acme/ui test -- --maxWorkers=2

# Run sequentially (safest, slowest)
pnpm --filter @acme/ui test -- --runInBand
```

---

## Rule 4: Never Start Multiple Test Runs

**Before starting ANY test run:**

1. Check for existing Jest processes:
   ```bash
   ps aux | grep -E "(jest|vitest)" | grep -v grep
   ```

2. If processes exist, either:
   - Wait for them to complete, OR
   - Kill them first: `pkill -f jest`

3. Only then start your test run

**NEVER start a new test run in a different terminal while one is already running.**

**Editor note:** The repo includes `.vscode/settings.json` to disable VS Code Jest auto-run/watch. Keep it enabled to avoid unintended background runners.

---

## Rule 5: Clean Up Stuck Tests

**If tests seem stuck (running > 5 minutes for unit tests):**

```bash
# Check what's running
ps aux | grep jest | head -10

# Kill all Jest processes
pkill -f "jest-worker"
pkill -f "jest.js"

# Then re-run with --detectOpenHandles to find the issue
pnpm --filter <package> test -- <specific-file> --detectOpenHandles
```

---

## CI E2E Ownership (Reference)

- Root CI (`.github/workflows/ci.yml`) runs only the cross-app **shop** subset (`pnpm e2e:shop`) when shop paths change.
- CMS E2E suites (smoke + dashboard) run in `.github/workflows/cypress.yml`.
- Workspace CI (`.github/workflows/test.yml`) runs `e2e` only when a workspace defines it (`--if-present`) and is scheduled/manual, not a merge gate.

See `docs/plans/e2e-ownership-consolidation-plan.md` for the full ownership policy.

---

## Test Scope Decision Tree

| Scenario | Command |
|----------|---------|
| Changed one file `Button.tsx` | `pnpm --filter @acme/ui test -- Button.test.tsx` |
| Changed one function | `pnpm --filter <pkg> test -- -t "function name"` |
| Changed a component + its tests | `pnpm --filter <pkg> test -- ComponentName` |
| Changed multiple files in one package | `pnpm --filter <pkg> test -- --maxWorkers=2` |
| Need to verify CI will pass | Ask user first; use `--maxWorkers=2` |
| User explicitly asks for full test run | Run **sequential single-file tests** only; no suite runs |

---

## Reference Commands

```bash
# Check for orphaned test processes
ps aux | grep -E "(jest|vitest)" | grep -v grep

# Kill all Jest processes
pkill -f "jest-worker" && pkill -f "jest.js"

# Check system resources
top -l 1 | head -10

# Run single test file (preferred)
pnpm --filter <package> test -- path/to/file.test.ts

# Run tests matching pattern
pnpm --filter <package> test -- --testPathPattern="pattern"

# Run with limited workers
pnpm --filter <package> test -- --maxWorkers=2
```

---

## Why This Matters

**Reference incident (2026-01-16):**
- 10+ Jest worker processes were running simultaneously
- Combined RAM usage: 2.5GB+
- System had only 93MB free RAM (out of 16GB)
- Load average: 7.73 (should be <4)
- Some processes had been running since 9:05AM (2+ hours)

**Lesson:** Always run the minimum necessary tests. One targeted test file runs in seconds and uses <100MB. A full package test suite spawns 4-8 workers at 200-500MB each.

---

## Automated Validation

Use `scripts/validate-changes.sh` to automatically:
1. Check for orphaned Jest processes
2. Run typecheck and lint
3. Find and run only tests related to changed files
4. Warn (or fail with `STRICT=1`) on missing test coverage

```bash
# Normal mode (warn on missing tests)
./scripts/validate-changes.sh

# Strict mode (fail on missing tests)
STRICT=1 ./scripts/validate-changes.sh
```

See the script for full details and options.

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
