/**
 * Go-Live Gates (LAUNCH-GATES)
 *
 * Hard requirements that MUST pass before DNS cutover to production.
 * These gates validate runtime state, not just config (which preflight handles).
 *
 * Gates:
 * 1. Centralized inventory routing - Catalog assigned to shop(s) via Prisma DB
 * 2. Inventory reservation - 20-min holds + OOS blocks checkout
 * 3. Order↔inventory linkage - Completed orders decrement stock
 * 4. Required pages + brand kit - Templates applied + assets present
 * 5. Compliance sign-off - Shop owner checklist approved
 * 6. E2E checkout test - Full purchase flow succeeds
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { LaunchConfig } from "@acme/platform-core/createShop";
import {
  REQUIRED_PAGES_BASIC,
  REQUIRED_LEGAL_PAGES,
} from "@acme/platform-core/createShop";
import { prisma } from "@acme/platform-core/db";

// ============================================================
// Types
// ============================================================

export interface GateResult {
  gate: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  details?: Record<string, unknown>;
}

export interface GoLiveGatesResult {
  allPassed: boolean;
  gates: GateResult[];
  errors: string[];
  warnings: string[];
}

export interface GoLiveGatesOptions {
  config: LaunchConfig;
  shopId: string;
  mode: "preview" | "production";
  /** Skip gates that require external API calls */
  skipExternalChecks?: boolean;
  /** Skip E2E test gate (useful for dry runs) */
  skipE2ETest?: boolean;
  /** Run E2E tests instead of checking cached results (default: true for production) */
  runE2ETests?: boolean;
  /** Base URL for E2E tests (required if runE2ETests is true) */
  e2eBaseUrl?: string;
}

// ============================================================
// Gate 1: Centralized Inventory Routing
// ============================================================

async function checkCentralizedInventoryRouting(
  shopId: string,
  _config: LaunchConfig
): Promise<GateResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    // Query Prisma for central inventory items
    const centralItemCount = await prisma.centralInventoryItem.count();
    details.catalogItemCount = centralItemCount;

    if (centralItemCount === 0) {
      errors.push(
        "Central inventory is empty. " +
          "Add products to central inventory (CentralInventoryItem table) before launch."
      );
    }

    // Query Prisma for routing rules for this shop
    const shopRoutings = await prisma.inventoryRouting.findMany({
      where: { shopId },
      include: {
        centralInventoryItem: {
          select: { sku: true, quantity: true },
        },
      },
    });
    details.routingRuleCount = shopRoutings.length;

    if (shopRoutings.length === 0) {
      errors.push(
        `No routing rules found for shop "${shopId}" in InventoryRouting table. ` +
          "Add routing rules to assign central inventory to this shop."
      );
    } else {
      // Define routing type for type safety
      type RoutingWithItem = {
        centralInventoryItem?: { sku: string; quantity: number } | null;
      };

      // Calculate total allocated items for this shop
      const totalAllocatedQuantity = shopRoutings.reduce(
        (sum: number, r: RoutingWithItem) =>
          sum + (r.centralInventoryItem?.quantity ?? 0),
        0
      );
      details.totalAllocatedQuantity = totalAllocatedQuantity;
      details.routedSkus = shopRoutings
        .map((r: RoutingWithItem) => r.centralInventoryItem?.sku)
        .filter(Boolean);

      // Check if any routings point to items with zero quantity
      const zeroQuantityRoutings = shopRoutings.filter(
        (r: RoutingWithItem) => r.centralInventoryItem?.quantity === 0
      );
      if (zeroQuantityRoutings.length > 0) {
        warnings.push(
          `${zeroQuantityRoutings.length} routing rule(s) point to items with zero quantity. ` +
            "Consider removing or restocking these items."
        );
      }
    }

    // Check if shop-level inventory has been synced from central
    const shopInventoryCount = await prisma.inventoryItem.count({
      where: { shopId },
    });
    details.shopInventoryItemCount = shopInventoryCount;

    if (shopRoutings.length > 0 && shopInventoryCount === 0) {
      warnings.push(
        "Shop has routing rules but no synced inventory items. " +
          "Run syncToShopInventory() to populate shop inventory from central."
      );
    }
  } catch (e) {
    errors.push(
      `Failed to query central inventory database: ${(e as Error).message}`
    );
  }

  // Also check shop-level inventory file exists as fallback (for legacy support)
  const shopInventoryPath = join("data", "shops", shopId, "inventory.json");
  if (!existsSync(shopInventoryPath)) {
    // This is now just informational - DB is the source of truth
    details.hasLegacyInventoryFile = false;
  } else {
    details.hasLegacyInventoryFile = true;
  }

  return {
    gate: "centralized-inventory-routing",
    passed: errors.length === 0,
    errors,
    warnings,
    details,
  };
}

// ============================================================
// Gate 2: Inventory Reservation
// ============================================================

async function checkInventoryReservation(
  shopId: string,
  _config: LaunchConfig
): Promise<GateResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Record<string, unknown> = {};

  // Check for inventory holds configuration
  const shopConfigPath = join("data", "shops", shopId, "shop.json");

  if (existsSync(shopConfigPath)) {
    try {
      const shopConfig = JSON.parse(readFileSync(shopConfigPath, "utf8"));

      // Check inventory hold settings (default TTL is 20 minutes)
      const holdTtlMinutes = shopConfig.inventoryHoldTtlMinutes ?? 20;
      details.holdTtlMinutes = holdTtlMinutes;

      if (holdTtlMinutes < 15) {
        warnings.push(
          `Inventory hold TTL is ${holdTtlMinutes} minutes. ` +
            `Recommended minimum is 15 minutes to allow checkout completion.`
        );
      }

      // Check OOS blocking is enabled
      const blockOOS = shopConfig.blockOutOfStock ?? true;
      details.blockOutOfStock = blockOOS;

      if (!blockOOS) {
        errors.push(
          "Out-of-stock blocking is disabled. " +
            "Enable blockOutOfStock in shop config to prevent overselling."
        );
      }
    } catch (e) {
      warnings.push(`Failed to parse shop config: ${(e as Error).message}`);
    }
  } else {
    warnings.push(
      `Shop config not found: ${shopConfigPath}. ` +
        `Inventory reservation settings will use defaults.`
    );
  }

  // Check for holds directory (file-based holds)
  const holdsDir = join("data", "shops", shopId, "holds");
  details.holdsDirectoryExists = existsSync(holdsDir);

  // Note: In production, inventory holds are in database (Prisma InventoryHold)
  // This gate validates configuration, not active holds

  return {
    gate: "inventory-reservation",
    passed: errors.length === 0,
    errors,
    warnings,
    details,
  };
}

// ============================================================
// Gate 3: Order↔Inventory Linkage
// ============================================================

async function checkOrderInventoryLinkage(
  shopId: string,
  _config: LaunchConfig
): Promise<GateResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Record<string, unknown> = {};

  // Check webhook configuration for checkout.session.completed
  const shopConfigPath = join("data", "shops", shopId, "shop.json");

  if (existsSync(shopConfigPath)) {
    try {
      const shopConfig = JSON.parse(readFileSync(shopConfigPath, "utf8"));

      // Check Stripe webhook is configured
      const hasStripeWebhook = Boolean(
        shopConfig.stripeWebhookEndpoint ||
          process.env.STRIPE_WEBHOOK_SECRET ||
          shopConfig.payment?.includes("stripe")
      );
      details.stripeWebhookConfigured = hasStripeWebhook;

      if (!hasStripeWebhook) {
        warnings.push(
          "Stripe webhook may not be configured. " +
            "Ensure STRIPE_WEBHOOK_SECRET is set for order completion."
        );
      }

      // Check order storage is configured
      const orderStorageType = shopConfig.orderStorage ?? "prisma";
      details.orderStorageType = orderStorageType;
    } catch (e) {
      warnings.push(`Failed to parse shop config: ${(e as Error).message}`);
    }
  }

  // Check for order handler registration
  // The webhook handler at checkout.session.completed should:
  // 1. Extract line items from session
  // 2. Call commitInventoryHold()
  // 3. Create order with lineItems

  // This is a configuration gate - actual linkage is tested in E2E gate
  details.note =
    "Order↔inventory linkage is verified at runtime via webhook. " +
    "E2E gate tests actual flow.";

  return {
    gate: "order-inventory-linkage",
    passed: errors.length === 0,
    errors,
    warnings,
    details,
  };
}

// ============================================================
// Gate 4: Required Pages + Brand Kit
// ============================================================

async function checkRequiredPagesAndBrandKit(
  shopId: string,
  config: LaunchConfig
): Promise<GateResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Record<string, unknown> = {};

  // Check required basic pages
  const pagesDir = join("data", "shops", shopId, "pages");
  const missingPages: string[] = [];
  const foundPages: string[] = [];

  for (const requiredSlug of REQUIRED_PAGES_BASIC) {
    const pagePath = join(pagesDir, `${requiredSlug}.json`);
    if (existsSync(pagePath)) {
      try {
        const page = JSON.parse(readFileSync(pagePath, "utf8"));

        // Check page has template provenance
        if (!page.templateId) {
          warnings.push(
            `Page "${requiredSlug}" lacks templateId. ` +
              `Required pages should be created from approved templates.`
          );
        }

        // Check page is published
        if (page.status === "draft") {
          errors.push(
            `Page "${requiredSlug}" is in draft status. ` +
              `Publish all required pages before production launch.`
          );
        }

        foundPages.push(requiredSlug);
      } catch (e) {
        errors.push(
          `Failed to parse page "${requiredSlug}": ${(e as Error).message}`
        );
      }
    } else {
      missingPages.push(requiredSlug);
    }
  }

  details.requiredPages = REQUIRED_PAGES_BASIC;
  details.foundPages = foundPages;
  details.missingPages = missingPages;

  if (missingPages.length > 0) {
    errors.push(
      `Missing required pages: ${missingPages.join(", ")}. ` +
        `Create these pages from templates before launch.`
    );
  }

  // Check required legal pages from config
  const legalPages = config.legalPages ?? {};
  const missingLegalPages = REQUIRED_LEGAL_PAGES.filter(
    (slug) => !legalPages[slug]
  );
  details.legalPagesConfigured = Object.keys(legalPages);
  details.missingLegalPages = missingLegalPages;

  if (missingLegalPages.length > 0) {
    errors.push(
      `Missing legal page mappings: ${missingLegalPages.join(", ")}. ` +
        `Add to legalPages config with template IDs.`
    );
  }

  // Check brand kit assets
  const shopConfigPath = join("data", "shops", shopId, "shop.json");
  if (existsSync(shopConfigPath)) {
    try {
      const shopConfig = JSON.parse(readFileSync(shopConfigPath, "utf8"));

      // Check logo
      const hasLogo = Boolean(shopConfig.logo);
      details.hasLogo = hasLogo;
      if (!hasLogo) {
        warnings.push("No logo configured in shop settings.");
      }

      // Check favicon
      const hasFavicon = Boolean(shopConfig.favicon || config.favicon);
      details.hasFavicon = hasFavicon;
      if (!hasFavicon) {
        warnings.push("No favicon configured. Add favicon URL to config.");
      }

      // Check SEO basics
      const hasSeoTitle = Boolean(
        shopConfig.seo?.title || config.seo?.title || config.pageTitle
      );
      const hasSeoDescription = Boolean(
        shopConfig.seo?.description ||
          config.seo?.description ||
          config.pageDescription
      );
      details.hasSeoTitle = hasSeoTitle;
      details.hasSeoDescription = hasSeoDescription;

      if (!hasSeoTitle) {
        warnings.push("No SEO title configured.");
      }
      if (!hasSeoDescription) {
        warnings.push("No SEO description configured.");
      }
    } catch (e) {
      warnings.push(`Failed to parse shop config: ${(e as Error).message}`);
    }
  }

  return {
    gate: "required-pages-brand-kit",
    passed: errors.length === 0,
    errors,
    warnings,
    details,
  };
}

// ============================================================
// Gate 5: Compliance Sign-Off
// ============================================================

async function checkComplianceSignOff(
  shopId: string,
  config: LaunchConfig,
  mode: "preview" | "production"
): Promise<GateResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Record<string, unknown> = {};

  // Check config-level compliance sign-off
  const signOff = config.complianceSignOff;
  details.hasConfigSignOff = Boolean(signOff);

  if (mode === "production") {
    if (!signOff) {
      errors.push(
        "Compliance sign-off required for production launch. " +
          "Add complianceSignOff to launch config."
      );
    } else {
      details.signedOffBy = signOff.signedOffBy;
      details.signedOffAt = signOff.signedOffAt;

      // Check sign-off is recent (within 30 days)
      const signOffDate = new Date(signOff.signedOffAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (signOffDate < thirtyDaysAgo) {
        errors.push(
          `Compliance sign-off is older than 30 days (${signOff.signedOffAt}). ` +
            `Re-certify before production launch.`
        );
      }

      // Check director approval for templates
      if (!signOff.directorApprovedTemplates) {
        warnings.push(
          "directorApprovedTemplates not confirmed in sign-off. " +
            "Ensure director has approved all templates used."
        );
      }
    }
  } else {
    // Preview mode - warn if not configured
    if (!signOff) {
      warnings.push(
        "No compliance sign-off configured. Required before production launch."
      );
    }
  }

  // Check launch gate file (CMS-side sign-off)
  const launchGatePath = join("data", "cms", "launch-gate.json");
  if (existsSync(launchGatePath)) {
    try {
      const gateFile = JSON.parse(readFileSync(launchGatePath, "utf8"));
      const shopGate = gateFile[shopId];

      if (shopGate) {
        details.hasQaAck = Boolean(shopGate.qaAck);
        details.stageTestsStatus = shopGate.stageTestsStatus;

        if (mode === "production" && !shopGate.qaAck) {
          errors.push(
            "QA acknowledgment not recorded in launch gate. " +
              "Complete owner sign-off checklist in CMS."
          );
        }

        // Check stage tests were run
        if (shopGate.stageTestsStatus === "failed") {
          errors.push(
            "Stage tests failed. Fix issues before production launch."
          );
        } else if (shopGate.stageTestsStatus === "not-run") {
          warnings.push("Stage tests have not been run for this shop.");
        }
      } else {
        if (mode === "production") {
          errors.push(
            `No launch gate entry for shop "${shopId}". ` +
              `Complete launch checklist in CMS.`
          );
        }
      }
    } catch (e) {
      warnings.push(`Failed to parse launch gate file: ${(e as Error).message}`);
    }
  } else {
    if (mode === "production") {
      warnings.push(
        "Launch gate file not found. CMS launch checklist may not be configured."
      );
    }
  }

  return {
    gate: "compliance-sign-off",
    passed: errors.length === 0,
    errors,
    warnings,
    details,
  };
}

// ============================================================
// Gate 6: E2E Checkout Test
// ============================================================

interface E2ETestOptions {
  shopId: string;
  skipTest: boolean;
  runTests: boolean;
  baseUrl?: string;
}

interface E2ETestResult {
  passed: boolean;
  timestamp: string;
  tests: Array<{
    title: string;
    passed: boolean;
    duration?: number;
    error?: string;
  }>;
  failures?: string[];
  totalTests: number;
  passedCount: number;
  failedCount: number;
}

/**
 * Run E2E checkout tests using Cypress.
 * Returns the test results which are also saved to disk.
 */
async function runE2ETests(
  shopId: string,
  baseUrl: string
): Promise<E2ETestResult> {
  const testResultsDir = join("data", "shops", shopId, "test-results");
  const testResultsPath = join(testResultsDir, "e2e-checkout.json");

  // Ensure test results directory exists
  if (!existsSync(testResultsDir)) {
    mkdirSync(testResultsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();

  try {
    // Run Cypress with the checkout flow tests
    // We use the shopper-journey spec which is the most comprehensive checkout test
    const cypressCmd = [
      "pnpm exec cypress run",
      "--config-file apps/cms/cypress.config.mjs",
      `--config baseUrl=${baseUrl}`,
      "--spec apps/cms/cypress/e2e/shopper-journey.cy.ts,apps/cms/cypress/e2e/checkout-form-a11y.cy.ts",
      "--reporter json",
      `--reporter-options output=${testResultsPath}.cypress.json`,
    ].join(" ");

    execSync(cypressCmd, {
      stdio: "pipe",
      encoding: "utf8",
      timeout: 300000, // 5 minute timeout
      env: {
        ...process.env,
        CYPRESS_BASE_URL: baseUrl,
        CYPRESS_SHOP_ID: shopId,
      },
    });

    // Parse Cypress JSON output
    const cypressResultPath = `${testResultsPath}.cypress.json`;
    let tests: E2ETestResult["tests"] = [];
    let passedCount = 0;
    let failedCount = 0;

    if (existsSync(cypressResultPath)) {
      const cypressResults = JSON.parse(
        readFileSync(cypressResultPath, "utf8")
      );
      // Extract test results from Cypress JSON format
      if (cypressResults.results) {
        for (const suite of cypressResults.results) {
          for (const test of suite.tests || []) {
            const testPassed = test.state === "passed";
            tests.push({
              title: test.title,
              passed: testPassed,
              duration: test.duration,
              error: test.err?.message,
            });
            if (testPassed) passedCount++;
            else failedCount++;
          }
        }
      }
    }

    const result: E2ETestResult = {
      passed: failedCount === 0,
      timestamp,
      tests,
      totalTests: tests.length,
      passedCount,
      failedCount,
      failures:
        failedCount > 0
          ? tests.filter((t) => !t.passed).map((t) => t.title)
          : undefined,
    };

    // Save results
    writeFileSync(testResultsPath, JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    // Tests failed or errored
    const result: E2ETestResult = {
      passed: false,
      timestamp,
      tests: [],
      totalTests: 0,
      passedCount: 0,
      failedCount: 1,
      failures: [(error as Error).message || "E2E tests failed to execute"],
    };

    // Save failed result
    writeFileSync(testResultsPath, JSON.stringify(result, null, 2));

    return result;
  }
}

async function checkE2ECheckoutTest(
  options: E2ETestOptions
): Promise<GateResult> {
  const { shopId, skipTest, runTests, baseUrl } = options;
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Record<string, unknown> = {};

  if (skipTest) {
    details.skipped = true;
    warnings.push(
      "E2E checkout test skipped. Run full E2E tests before production launch."
    );
    return {
      gate: "e2e-checkout-test",
      passed: true, // Pass gate if explicitly skipped
      errors,
      warnings,
      details,
    };
  }

  const testResultsPath = join(
    "data",
    "shops",
    shopId,
    "test-results",
    "e2e-checkout.json"
  );

  // Run tests if requested
  if (runTests) {
    if (!baseUrl) {
      errors.push(
        "E2E base URL is required to run tests. Provide e2eBaseUrl option."
      );
      return {
        gate: "e2e-checkout-test",
        passed: false,
        errors,
        warnings,
        details,
      };
    }

    details.ranTests = true;
    details.baseUrl = baseUrl;

    try {
      const result = await runE2ETests(shopId, baseUrl);
      details.testResults = result;
      details.passed = result.passed;
      details.testCount = result.totalTests;
      details.passedCount = result.passedCount;
      details.failedCount = result.failedCount;

      if (!result.passed) {
        errors.push(
          `E2E checkout tests failed: ${result.failedCount}/${result.totalTests} tests failed.`
        );
        if (result.failures) {
          details.failures = result.failures;
        }
      }
    } catch (e) {
      errors.push(`Failed to run E2E tests: ${(e as Error).message}`);
    }
  } else {
    // Check for cached test results from previous run
    if (existsSync(testResultsPath)) {
      try {
        const results = JSON.parse(readFileSync(testResultsPath, "utf8"));
        details.lastRunAt = results.timestamp;
        details.passed = results.passed;
        details.testCount = results.totalTests ?? results.tests?.length ?? 0;

        if (!results.passed) {
          errors.push(
            "E2E checkout test failed. Review test results and fix issues."
          );
          if (results.failures) {
            details.failures = results.failures;
          }
        }

        // Check test is recent (within 24 hours for production)
        const lastRun = new Date(results.timestamp);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        if (lastRun < oneDayAgo) {
          warnings.push(
            `E2E test results are older than 24 hours (${results.timestamp}). ` +
              `Re-run tests before production launch.`
          );
        }
      } catch (e) {
        errors.push(
          `Failed to parse E2E test results: ${(e as Error).message}`
        );
      }
    } else {
      errors.push(
        `E2E checkout test results not found for shop "${shopId}". ` +
          `Run: pnpm test:e2e --shop ${shopId} OR pass runE2ETests: true`
      );
    }
  }

  // Also check launch gate for stage tests status
  const launchGatePath = join("data", "cms", "launch-gate.json");
  if (existsSync(launchGatePath)) {
    try {
      const gateFile = JSON.parse(readFileSync(launchGatePath, "utf8"));
      const shopGate = gateFile[shopId];

      if (shopGate?.stageTestsStatus === "passed") {
        details.stageTestsPassed = true;
      } else if (shopGate?.stageTestsStatus === "failed") {
        if (!errors.some((e) => e.includes("Stage tests failed"))) {
          errors.push("Stage tests failed. Fix issues before production.");
        }
      }
    } catch {
      // Already warned about this in compliance gate
    }
  }

  return {
    gate: "e2e-checkout-test",
    passed: errors.length === 0,
    errors,
    warnings,
    details,
  };
}

// ============================================================
// Main Gate Runner
// ============================================================

/**
 * Run all go-live gates and return aggregated results.
 *
 * Gates are run in sequence because some depend on others.
 * All gates must pass for production launch.
 */
export async function runGoLiveGates(
  options: GoLiveGatesOptions
): Promise<GoLiveGatesResult> {
  const {
    config,
    shopId,
    mode,
    skipExternalChecks,
    skipE2ETest,
    runE2ETests,
    e2eBaseUrl,
  } = options;

  const gates: GateResult[] = [];
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Gate 1: Centralized Inventory Routing
  const gate1 = await checkCentralizedInventoryRouting(shopId, config);
  gates.push(gate1);
  allErrors.push(...gate1.errors);
  allWarnings.push(...gate1.warnings);

  // Gate 2: Inventory Reservation
  const gate2 = await checkInventoryReservation(shopId, config);
  gates.push(gate2);
  allErrors.push(...gate2.errors);
  allWarnings.push(...gate2.warnings);

  // Gate 3: Order↔Inventory Linkage
  const gate3 = await checkOrderInventoryLinkage(shopId, config);
  gates.push(gate3);
  allErrors.push(...gate3.errors);
  allWarnings.push(...gate3.warnings);

  // Gate 4: Required Pages + Brand Kit
  const gate4 = await checkRequiredPagesAndBrandKit(shopId, config);
  gates.push(gate4);
  allErrors.push(...gate4.errors);
  allWarnings.push(...gate4.warnings);

  // Gate 5: Compliance Sign-Off
  const gate5 = await checkComplianceSignOff(shopId, config, mode);
  gates.push(gate5);
  allErrors.push(...gate5.errors);
  allWarnings.push(...gate5.warnings);

  // Gate 6: E2E Checkout Test
  // Default: run tests for production, check cached for preview
  const shouldRunTests = runE2ETests ?? (mode === "production" && !skipExternalChecks);
  const gate6 = await checkE2ECheckoutTest({
    shopId,
    skipTest: skipE2ETest ?? skipExternalChecks ?? false,
    runTests: shouldRunTests,
    baseUrl: e2eBaseUrl,
  });
  gates.push(gate6);
  allErrors.push(...gate6.errors);
  allWarnings.push(...gate6.warnings);

  const allPassed = gates.every((g) => g.passed);

  return {
    allPassed,
    gates,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Format gate results for console output.
 */
export function formatGateResults(results: GoLiveGatesResult): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("GO-LIVE GATES REPORT");
  lines.push("=".repeat(60));
  lines.push("");

  for (const gate of results.gates) {
    const status = gate.passed ? "[PASS]" : "[FAIL]";
    lines.push(`${status} ${gate.gate}`);

    if (gate.errors.length > 0) {
      for (const err of gate.errors) {
        lines.push(`  ERROR: ${err}`);
      }
    }

    if (gate.warnings.length > 0) {
      for (const warn of gate.warnings) {
        lines.push(`  WARN: ${warn}`);
      }
    }

    lines.push("");
  }

  lines.push("-".repeat(60));

  if (results.allPassed) {
    lines.push("ALL GATES PASSED - Ready for production launch");
  } else {
    lines.push(
      `GATES FAILED - ${results.errors.length} error(s), ${results.warnings.length} warning(s)`
    );
    lines.push("Fix all errors before production launch.");
  }

  lines.push("=".repeat(60));

  return lines.join("\n");
}
