#!/usr/bin/env node
/**
 * LAUNCH-19: Synthetic Monitoring Setup
 *
 * Sets up and runs synthetic monitoring for deployed shops:
 * - Periodic health checks
 * - Uptime monitoring
 * - Response time tracking
 * - Alert configuration
 * - Integration with external monitoring services
 *
 * Usage:
 *   pnpm synthetic-monitor --shop <shopId> [options]
 *
 * Options:
 *   --shop <shopId>       Shop ID (required for single shop)
 *   --all                 Monitor all configured shops
 *   --interval <seconds>  Check interval (default: 60)
 *   --timeout <ms>        Request timeout (default: 10000)
 *   --alert-webhook <url> Webhook URL for alerts
 *   --once                Run once and exit (for cron)
 *   --daemon              Run as daemon (continuous)
 *   --config <file>       Config file for multi-shop monitoring
 *   --json                Output JSON format
 *   --verbose             Verbose output
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// ============================================================
// Types
// ============================================================

interface MonitorOptions {
  shopId?: string;
  all: boolean;
  interval: number;
  timeout: number;
  alertWebhook?: string;
  once: boolean;
  daemon: boolean;
  configFile?: string;
  json: boolean;
  verbose: boolean;
}

interface ShopConfig {
  shopId: string;
  baseUrl: string;
  enabled: boolean;
  checks: CheckConfig[];
  alertThresholds?: AlertThresholds;
}

interface CheckConfig {
  name: string;
  type: "health" | "api" | "page" | "checkout" | "custom";
  path: string;
  method?: "GET" | "POST";
  expectedStatus?: number;
  expectedContent?: string;
  timeout?: number;
}

interface AlertThresholds {
  responseTimeMs?: number;
  consecutiveFailures?: number;
  uptimePercent?: number;
}

interface CheckResult {
  shop: string;
  check: string;
  passed: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: string;
}

interface MonitorState {
  shopId: string;
  checks: Record<
    string,
    {
      lastCheck: string;
      lastStatus: "up" | "down" | "unknown";
      consecutiveFailures: number;
      responseTimesMs: number[];
      uptime24h: number;
    }
  >;
}

interface AlertPayload {
  type: "down" | "up" | "slow" | "error";
  shop: string;
  check: string;
  message: string;
  details: Record<string, unknown>;
  timestamp: string;
}

// ============================================================
// CLI Parsing
// ============================================================

function parseArgs(args: string[]): MonitorOptions {
  const options: MonitorOptions = {
    all: false,
    interval: 60,
    timeout: 10000,
    once: false,
    daemon: false,
    json: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--shop":
      case "-s":
        options.shopId = next;
        i++;
        break;
      case "--all":
      case "-a":
        options.all = true;
        break;
      case "--interval":
      case "-i":
        options.interval = parseInt(next, 10) || 60;
        i++;
        break;
      case "--timeout":
      case "-t":
        options.timeout = parseInt(next, 10) || 10000;
        i++;
        break;
      case "--alert-webhook":
        options.alertWebhook = next;
        i++;
        break;
      case "--once":
        options.once = true;
        break;
      case "--daemon":
      case "-d":
        options.daemon = true;
        break;
      case "--config":
      case "-c":
        options.configFile = next;
        i++;
        break;
      case "--json":
        options.json = true;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Synthetic Monitoring CLI (LAUNCH-19)

Usage: pnpm synthetic-monitor --shop <shopId> [options]

Options:
  -s, --shop <shopId>       Shop ID (required for single shop)
  -a, --all                 Monitor all configured shops
  -i, --interval <seconds>  Check interval (default: 60)
  -t, --timeout <ms>        Request timeout (default: 10000)
  --alert-webhook <url>     Webhook URL for alerts
  --once                    Run once and exit (for cron)
  -d, --daemon              Run as daemon (continuous)
  -c, --config <file>       Config file for multi-shop monitoring
  --json                    Output JSON format
  -v, --verbose             Verbose output
  -h, --help                Show this help

Monitoring Checks:
  health     - /api/health endpoint
  api        - Custom API endpoint
  page       - Page load check
  checkout   - Checkout flow availability
  custom     - Custom check with expected content

Examples:
  # Single check
  pnpm synthetic-monitor --shop acme-sale --once

  # Continuous monitoring
  pnpm synthetic-monitor --shop acme-sale --daemon --interval 30

  # Monitor all shops from config
  pnpm synthetic-monitor --config monitor.json --daemon

  # With alerting
  pnpm synthetic-monitor --shop acme-sale --alert-webhook https://hooks.slack.com/xxx
`);
}

// ============================================================
// Default Checks
// ============================================================

const DEFAULT_CHECKS: CheckConfig[] = [
  {
    name: "Health Check",
    type: "health",
    path: "/api/health",
    method: "GET",
    expectedStatus: 200,
  },
  {
    name: "Homepage",
    type: "page",
    path: "/",
    method: "GET",
    expectedStatus: 200,
  },
  {
    name: "Products API",
    type: "api",
    path: "/api/products",
    method: "GET",
    expectedStatus: 200,
  },
  {
    name: "Cart Page",
    type: "page",
    path: "/cart",
    method: "GET",
    expectedStatus: 200,
  },
];

// ============================================================
// Shop Configuration
// ============================================================

function loadShopConfigs(options: MonitorOptions): ShopConfig[] {
  const configs: ShopConfig[] = [];

  // Load from config file if specified
  if (options.configFile && existsSync(options.configFile)) {
    const content = readFileSync(options.configFile, "utf8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.shops)) {
      configs.push(...parsed.shops);
    }
    return configs;
  }

  // Single shop mode
  if (options.shopId) {
    configs.push({
      shopId: options.shopId,
      baseUrl: `https://shop-${options.shopId}.pages.dev`,
      enabled: true,
      checks: DEFAULT_CHECKS,
      alertThresholds: {
        responseTimeMs: 5000,
        consecutiveFailures: 3,
        uptimePercent: 99,
      },
    });
  }

  return configs;
}

// ============================================================
// Check Execution
// ============================================================

async function executeCheck(
  shop: ShopConfig,
  check: CheckConfig,
  options: MonitorOptions
): Promise<CheckResult> {
  const url = `${shop.baseUrl}${check.path}`;
  const timeout = check.timeout || options.timeout;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: check.method || "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "SyntheticMonitor/1.0 (LAUNCH-19)",
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Check status code
    const expectedStatus = check.expectedStatus || 200;
    const statusOk =
      response.status === expectedStatus ||
      (expectedStatus === 200 && response.ok);

    // Check content if specified
    let contentOk = true;
    if (check.expectedContent) {
      const body = await response.text();
      contentOk = body.includes(check.expectedContent);
    }

    const passed = statusOk && contentOk;

    return {
      shop: shop.shopId,
      check: check.name,
      passed,
      responseTime,
      statusCode: response.status,
      timestamp: new Date().toISOString(),
      error: passed ? undefined : `Status: ${response.status}`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Timeout"
          : error.message
        : String(error);

    return {
      shop: shop.shopId,
      check: check.name,
      passed: false,
      responseTime,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================
// State Management
// ============================================================

const STATE_DIR = join(process.cwd(), "data/monitor-state");

function loadState(shopId: string): MonitorState {
  const statePath = join(STATE_DIR, `${shopId}.json`);

  if (existsSync(statePath)) {
    const content = readFileSync(statePath, "utf8");
    return JSON.parse(content);
  }

  return {
    shopId,
    checks: {},
  };
}

function saveState(state: MonitorState): void {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }

  const statePath = join(STATE_DIR, `${state.shopId}.json`);
  writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");
}

function updateState(
  state: MonitorState,
  result: CheckResult
): { alert?: AlertPayload } {
  const checkState = state.checks[result.check] || {
    lastCheck: "",
    lastStatus: "unknown",
    consecutiveFailures: 0,
    responseTimesMs: [],
    uptime24h: 100,
  };

  const previousStatus = checkState.lastStatus;

  // Update check state
  checkState.lastCheck = result.timestamp;
  checkState.lastStatus = result.passed ? "up" : "down";

  // Track response times (keep last 100)
  checkState.responseTimesMs.push(result.responseTime);
  if (checkState.responseTimesMs.length > 100) {
    checkState.responseTimesMs.shift();
  }

  // Track consecutive failures
  if (result.passed) {
    checkState.consecutiveFailures = 0;
  } else {
    checkState.consecutiveFailures++;
  }

  // Calculate uptime (simplified - based on recent checks)
  const recentChecks = checkState.responseTimesMs.length;
  const recentPassed = result.passed
    ? checkState.consecutiveFailures === 0
      ? recentChecks
      : recentChecks - checkState.consecutiveFailures
    : recentChecks - checkState.consecutiveFailures;
  checkState.uptime24h = recentChecks > 0 ? (recentPassed / recentChecks) * 100 : 100;

  state.checks[result.check] = checkState;

  // Generate alerts
  let alert: AlertPayload | undefined;

  if (!result.passed && previousStatus === "up") {
    // Service went down
    alert = {
      type: "down",
      shop: result.shop,
      check: result.check,
      message: `${result.check} is DOWN for ${result.shop}`,
      details: {
        error: result.error,
        responseTime: result.responseTime,
        consecutiveFailures: checkState.consecutiveFailures,
      },
      timestamp: result.timestamp,
    };
  } else if (result.passed && previousStatus === "down") {
    // Service recovered
    alert = {
      type: "up",
      shop: result.shop,
      check: result.check,
      message: `${result.check} is UP for ${result.shop}`,
      details: {
        responseTime: result.responseTime,
        downtime: "recovered",
      },
      timestamp: result.timestamp,
    };
  }

  return { alert };
}

// ============================================================
// Alerting
// ============================================================

async function sendAlert(
  alert: AlertPayload,
  webhookUrl: string,
  options: MonitorOptions
): Promise<void> {
  if (options.verbose) {
    console.log(`Sending alert: ${alert.message}`);
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: alert.message,
        attachments: [
          {
            color: alert.type === "down" ? "danger" : "good",
            fields: [
              { title: "Shop", value: alert.shop, short: true },
              { title: "Check", value: alert.check, short: true },
              { title: "Type", value: alert.type, short: true },
              {
                title: "Details",
                value: JSON.stringify(alert.details),
                short: false,
              },
            ],
            ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
          },
        ],
      }),
    });
  } catch (error) {
    console.error(
      `Failed to send alert: ${error instanceof Error ? error.message : error}`
    );
  }
}

// ============================================================
// Monitor Runner
// ============================================================

async function runMonitorCycle(
  shops: ShopConfig[],
  options: MonitorOptions
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  for (const shop of shops) {
    if (!shop.enabled) continue;

    const state = loadState(shop.shopId);

    for (const check of shop.checks) {
      const result = await executeCheck(shop, check, options);
      results.push(result);

      const { alert } = updateState(state, result);

      // Log result
      if (!options.json) {
        const icon = result.passed ? "✓" : "✗";
        const status = result.passed ? "UP" : "DOWN";
        console.log(
          `${icon} [${shop.shopId}] ${check.name}: ${status} (${result.responseTime}ms)`
        );

        if (!result.passed && result.error) {
          console.log(`  Error: ${result.error}`);
        }
      }

      // Send alert if needed
      if (alert && options.alertWebhook) {
        await sendAlert(alert, options.alertWebhook, options);
      }
    }

    saveState(state);
  }

  return results;
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!options.shopId && !options.all && !options.configFile) {
    console.error("Error: --shop <shopId>, --all, or --config is required");
    printHelp();
    process.exit(1);
  }

  const shops = loadShopConfigs(options);

  if (shops.length === 0) {
    console.error("No shops configured for monitoring");
    process.exit(1);
  }

  if (!options.json) {
    console.log("=== Synthetic Monitor ===\n");
    console.log(`Monitoring ${shops.length} shop(s)`);
    console.log(`Interval: ${options.interval}s`);
    console.log(`Timeout: ${options.timeout}ms`);
    if (options.alertWebhook) {
      console.log(`Alerts: Enabled`);
    }
    console.log("");
  }

  if (options.once) {
    // Run once and exit
    const results = await runMonitorCycle(shops, options);

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            shops: shops.map((s) => s.shopId),
            results,
          },
          null,
          2
        )
      );
    }

    const failed = results.filter((r) => !r.passed);
    process.exit(failed.length > 0 ? 1 : 0);
  }

  if (options.daemon) {
    // Run continuously
    console.log("Starting daemon mode...\n");

    const runCycle = async () => {
      const timestamp = new Date().toISOString();
      if (!options.json) {
        console.log(`\n--- Check at ${timestamp} ---`);
      }

      const results = await runMonitorCycle(shops, options);

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              timestamp,
              results,
            },
            null,
            2
          )
        );
      }

      // Summary
      const passed = results.filter((r) => r.passed).length;
      const failed = results.filter((r) => !r.passed).length;

      if (!options.json) {
        console.log(`\nPassed: ${passed}, Failed: ${failed}`);
      }
    };

    // Initial run
    await runCycle();

    // Schedule recurring runs
    setInterval(runCycle, options.interval * 1000);

    // Keep process running
    process.on("SIGINT", () => {
      console.log("\nShutting down monitor...");
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log("\nShutting down monitor...");
      process.exit(0);
    });
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

export {
  parseArgs,
  loadShopConfigs,
  executeCheck,
  runMonitorCycle,
  DEFAULT_CHECKS,
};
