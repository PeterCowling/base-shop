#!/usr/bin/env node
// scripts/src/launch-shop/cli/smoke.ts
/**
 * CLI for running launch smoke tests against a deployed shop.
 *
 * Usage:
 *   pnpm launch-smoke --url https://shop-acme.pages.dev
 *   pnpm launch-smoke --shop acme --env production
 *   pnpm launch-smoke --config profiles/shops/acme-live.json
 *
 * Options:
 *   --url <url>        Direct URL to test
 *   --shop <id>        Shop ID (uses standard URL pattern)
 *   --env <env>        Environment: dev|stage|prod (default: prod)
 *   --config <path>    Path to launch config JSON
 *   --extended         Run extended smoke tests (more checks)
 *   --wait             Wait for URL to be reachable before testing
 *   --json             Output results as JSON
 *   --help             Show this help
 */

import { existsSync, readFileSync } from "node:fs";
import { getShopBaseUrl } from "@acme/platform-core/shops/url";
import type { Environment } from "@acme/types";
import {
  runSmokeTests,
  runExtendedSmokeTests,
  waitForUrlReachable,
  parseConfigSmokeChecks,
  type SmokeTestResult,
} from "../steps/smoke";

interface CliArgs {
  url?: string;
  shop?: string;
  env: Environment;
  configPath?: string;
  extended: boolean;
  wait: boolean;
  json: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    env: "prod",
    extended: false,
    wait: false,
    json: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case "--url":
        args.url = next;
        i++;
        break;
      case "--shop":
        args.shop = next;
        i++;
        break;
      case "--env":
        args.env = next as Environment;
        i++;
        break;
      case "--config":
        args.configPath = next;
        i++;
        break;
      case "--extended":
        args.extended = true;
        break;
      case "--wait":
        args.wait = true;
        break;
      case "--json":
        args.json = true;
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
    }
  }

  return args;
}

function showHelp(): void {
  console.log(`
Launch Smoke Test CLI

Usage:
  pnpm launch-smoke --url <url>
  pnpm launch-smoke --shop <id> [--env <env>]
  pnpm launch-smoke --config <path>

Options:
  --url <url>        Direct URL to test (e.g., https://shop-acme.pages.dev)
  --shop <id>        Shop ID (constructs URL from standard pattern)
  --env <env>        Environment: dev|stage|prod (default: prod)
  --config <path>    Path to launch config JSON (uses smokeChecks if defined)
  --extended         Run extended smoke tests (more thorough)
  --wait             Wait for URL to be reachable before testing (retries up to 60s)
  --json             Output results as JSON (for CI integration)
  --help, -h         Show this help

Examples:
  # Test a specific URL
  pnpm launch-smoke --url https://my-shop.pages.dev

  # Test a shop by ID (uses platform URL conventions)
  pnpm launch-smoke --shop acme --env prod

  # Test with custom checks from launch config
  pnpm launch-smoke --config profiles/shops/acme-live.json

  # Wait for deploy to be ready, then test
  pnpm launch-smoke --url https://preview.my-shop.pages.dev --wait

  # CI mode: JSON output for parsing
  pnpm launch-smoke --shop acme --json
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Determine base URL
  let baseUrl: string | undefined;
  let smokeChecks: Array<{ endpoint: string; expectedStatus?: number }> | undefined;

  if (args.url) {
    baseUrl = args.url;
  } else if (args.shop) {
    const urlResult = getShopBaseUrl({ shopId: args.shop, env: args.env });
    if (urlResult) {
      baseUrl = urlResult.origin;
    } else {
      console.error(`Error: Could not determine URL for shop ${args.shop}`);
      process.exit(1);
    }
  } else if (args.configPath) {
    if (!existsSync(args.configPath)) {
      console.error(`Error: Config file not found: ${args.configPath}`);
      process.exit(1);
    }
    const config = JSON.parse(readFileSync(args.configPath, "utf8")) as {
      shopId?: string;
      deployTarget?: { projectName?: string };
      smokeChecks?: Array<{ endpoint: string; expectedStatus?: number }>;
    };

    if (config.deployTarget?.projectName) {
      baseUrl = `https://${config.deployTarget.projectName}.pages.dev`;
    } else if (config.shopId) {
      const urlResult = getShopBaseUrl({ shopId: config.shopId, env: args.env });
      if (urlResult) {
        baseUrl = urlResult.origin;
      }
    }

    smokeChecks = config.smokeChecks;
  }

  if (!baseUrl) {
    console.error("Error: Must provide --url, --shop, or --config");
    showHelp();
    process.exit(1);
  }

  // Wait for URL to be reachable if requested
  if (args.wait) {
    const reachable = await waitForUrlReachable(baseUrl);
    if (!reachable) {
      if (args.json) {
        console.log(
          JSON.stringify({
            passed: false,
            error: "URL not reachable after retries",
            baseUrl,
          })
        );
      } else {
        console.error(`\nError: ${baseUrl} not reachable after retries`);
      }
      process.exit(1);
    }
  }

  // Run smoke tests
  let result: SmokeTestResult;

  if (args.extended) {
    result = await runExtendedSmokeTests(baseUrl);
  } else if (smokeChecks && smokeChecks.length > 0) {
    const checks = parseConfigSmokeChecks(smokeChecks);
    result = await runSmokeTests({ baseUrl, checks, verbose: !args.json });
  } else {
    result = await runSmokeTests({ baseUrl, verbose: !args.json });
  }

  // Output results
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.passed) {
      console.log("=== All smoke tests passed ===\n");
    } else {
      console.log("=== Smoke tests FAILED ===\n");
    }
  }

  process.exit(result.passed ? 0 : 1);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
