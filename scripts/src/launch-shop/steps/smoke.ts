// scripts/src/launch-shop/steps/smoke.ts
/**
 * Launch smoke test runner.
 *
 * Validates a deployed shop is functioning by running HTTP checks against
 * critical endpoints. Designed for use both as part of the launch-shop
 * orchestrator and as a standalone CLI.
 */

export interface SmokeCheckConfig {
  endpoint: string;
  expectedStatus?: number;
  /** Optional: timeout in ms (default 30000) */
  timeout?: number;
  /** Optional: number of retries (default 3) */
  retries?: number;
}

export interface SmokeTestOptions {
  /** Base URL of the deployed shop (e.g., https://shop-acme.pages.dev) */
  baseUrl: string;
  /** Custom checks from launch config, or uses defaults if empty */
  checks?: SmokeCheckConfig[];
  /** Retry delay in ms between attempts (default 5000) */
  retryDelayMs?: number;
  /** Whether to log progress (default true) */
  verbose?: boolean;
}

export interface SmokeCheckResult {
  endpoint: string;
  passed: boolean;
  status?: number;
  error?: string;
  durationMs: number;
  attempts: number;
}

export interface SmokeTestResult {
  passed: boolean;
  checks: SmokeCheckResult[];
  totalDurationMs: number;
  baseUrl: string;
}

/**
 * Default smoke checks run against any shop.
 * These verify critical e-commerce functionality.
 */
const DEFAULT_SMOKE_CHECKS: SmokeCheckConfig[] = [
  // Homepage must load
  { endpoint: "/", expectedStatus: 200 },
  // Cart API endpoint must respond
  { endpoint: "/api/cart", expectedStatus: 200 },
  // At least one product listing route should work
  // (we check common patterns, pass if any succeeds)
  { endpoint: "/products", expectedStatus: 200 },
];

/**
 * Additional checks for comprehensive validation.
 * These are less critical but good to verify.
 */
const EXTENDED_SMOKE_CHECKS: SmokeCheckConfig[] = [
  ...DEFAULT_SMOKE_CHECKS,
  // Checkout session endpoint
  { endpoint: "/api/checkout-session", expectedStatus: 405 }, // POST-only, GET returns 405
  // Common locale-prefixed routes
  { endpoint: "/en/shop", expectedStatus: 200 },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Perform a single HTTP check with retries.
 */
async function runCheck(
  baseUrl: string,
  check: SmokeCheckConfig,
  retryDelayMs: number,
  verbose: boolean
): Promise<SmokeCheckResult> {
  const url = `${baseUrl.replace(/\/+$/, "")}${check.endpoint}`;
  const maxRetries = check.retries ?? 3;
  const timeout = check.timeout ?? 30000;
  const expectedStatus = check.expectedStatus ?? 200;

  const startTime = Date.now();
  let lastError: string | undefined;
  let lastStatus: number | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeoutId);
      lastStatus = response.status;

      // Success criteria:
      // 1. Exact match to expectedStatus, OR
      // 2. Any 2xx/3xx if expectedStatus is 200 (flexible success)
      const isSuccess =
        response.status === expectedStatus ||
        (expectedStatus === 200 && response.status >= 200 && response.status < 400);

      if (isSuccess) {
        if (verbose) {
          console.log(`  ✓ ${check.endpoint} → ${response.status}`);
        }
        return {
          endpoint: check.endpoint,
          passed: true,
          status: response.status,
          durationMs: Date.now() - startTime,
          attempts: attempt,
        };
      }

      lastError = `Expected ${expectedStatus}, got ${response.status}`;
    } catch (e) {
      const error = e as Error;
      if (error.name === "AbortError") {
        lastError = `Timeout after ${timeout}ms`;
      } else {
        lastError = error.message;
      }
    }

    // Retry if not last attempt
    if (attempt < maxRetries) {
      if (verbose) {
        console.log(
          `  ⟳ ${check.endpoint} failed (attempt ${attempt}/${maxRetries}), retrying...`
        );
      }
      await sleep(retryDelayMs);
    }
  }

  // All retries exhausted
  if (verbose) {
    console.log(`  ✗ ${check.endpoint} → ${lastError}`);
  }

  return {
    endpoint: check.endpoint,
    passed: false,
    status: lastStatus,
    error: lastError,
    durationMs: Date.now() - startTime,
    attempts: maxRetries,
  };
}

/**
 * Run smoke tests against a deployed shop.
 */
export async function runSmokeTests(
  options: SmokeTestOptions
): Promise<SmokeTestResult> {
  const {
    baseUrl,
    checks = DEFAULT_SMOKE_CHECKS,
    retryDelayMs = 5000,
    verbose = true,
  } = options;

  const checksToRun = checks.length > 0 ? checks : DEFAULT_SMOKE_CHECKS;
  const startTime = Date.now();

  if (verbose) {
    console.log(`\n=== Launch Smoke Tests ===`);
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Checks: ${checksToRun.length}\n`);
  }

  const results: SmokeCheckResult[] = [];

  for (const check of checksToRun) {
    const result = await runCheck(baseUrl, check, retryDelayMs, verbose);
    results.push(result);
  }

  const passed = results.every((r) => r.passed);
  const totalDurationMs = Date.now() - startTime;

  if (verbose) {
    console.log("");
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.length - passedCount;
    console.log(
      `Results: ${passedCount} passed, ${failedCount} failed (${totalDurationMs}ms)`
    );

    if (!passed) {
      console.log("\nFailed checks:");
      for (const r of results.filter((r) => !r.passed)) {
        console.log(`  - ${r.endpoint}: ${r.error}`);
      }
    }
    console.log("");
  }

  return {
    passed,
    checks: results,
    totalDurationMs,
    baseUrl,
  };
}

/**
 * Run the default smoke test suite.
 */
export async function runDefaultSmokeTests(
  baseUrl: string
): Promise<SmokeTestResult> {
  return runSmokeTests({ baseUrl, checks: DEFAULT_SMOKE_CHECKS });
}

/**
 * Run extended smoke tests (more thorough validation).
 */
export async function runExtendedSmokeTests(
  baseUrl: string
): Promise<SmokeTestResult> {
  return runSmokeTests({ baseUrl, checks: EXTENDED_SMOKE_CHECKS });
}

/**
 * Validate that a URL is reachable before running full tests.
 * Useful as a quick pre-check with aggressive retries.
 */
export async function waitForUrlReachable(
  url: string,
  maxRetries: number = 10,
  retryDelayMs: number = 6000
): Promise<boolean> {
  console.log(`Waiting for ${url} to be reachable...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (response.status >= 200 && response.status < 500) {
        console.log(`✓ URL reachable (status ${response.status})`);
        return true;
      }
    } catch {
      // Ignore errors during reachability check
    }

    if (attempt < maxRetries) {
      console.log(`  Attempt ${attempt}/${maxRetries} - retrying in ${retryDelayMs / 1000}s...`);
      await sleep(retryDelayMs);
    }
  }

  console.log(`✗ URL not reachable after ${maxRetries} attempts`);
  return false;
}

/**
 * Parse smokeChecks from launch config format.
 */
export function parseConfigSmokeChecks(
  configChecks: Array<{ endpoint: string; expectedStatus?: number }> | undefined
): SmokeCheckConfig[] {
  if (!configChecks || configChecks.length === 0) {
    return DEFAULT_SMOKE_CHECKS;
  }

  return configChecks.map((c) => ({
    endpoint: c.endpoint,
    expectedStatus: c.expectedStatus ?? 200,
  }));
}
