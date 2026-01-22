// scripts/src/validate-launch-config.ts
/**
 * Standalone validation script for launch-shop config files.
 * Validates against business rules and structure.
 *
 * Usage:
 *   pnpm validate-launch-config <config-file>
 *   pnpm validate-launch-config profiles/shops/acme-sale.json
 */
import { existsSync, readFileSync } from "node:fs";
import { relative,resolve } from "node:path";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const VALID_DEPLOY_TARGETS = ["cloudflare-pages", "vercel", "local"] as const;
const VALID_SHOP_TYPES = ["sale", "rental"] as const;
const VALID_PAYMENT_PROVIDERS = ["stripe", "paypal", "checkout", "adyen", "braintree", "square"] as const;
const VALID_SHIPPING_PROVIDERS = ["ups", "fedex", "dhl", "usps", "shippo", "easypost", "premier-shipping"] as const;
const VALID_TAX_PROVIDERS = ["taxjar", "avalara", "stripe-tax"] as const;

function validateStructure(config: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (typeof config.schemaVersion !== "number") {
    errors.push("schemaVersion is required and must be a number");
  } else if (config.schemaVersion < 1) {
    errors.push("schemaVersion must be at least 1");
  } else if (config.schemaVersion !== 1) {
    warnings.push(`schemaVersion ${config.schemaVersion} is not the current version (1)`);
  }

  if (typeof config.shopId !== "string" || !config.shopId) {
    errors.push("shopId is required and must be a non-empty string");
  } else if (!/^[a-zA-Z0-9_-]+$/.test(config.shopId)) {
    errors.push(`shopId contains invalid characters (only alphanumeric, underscores, hyphens allowed): ${config.shopId}`);
  } else if (config.shopId.startsWith("shop-")) {
    warnings.push(`shopId should not include 'shop-' prefix (it will be added automatically): ${config.shopId}`);
  }

  if (!config.deployTarget || typeof config.deployTarget !== "object") {
    errors.push("deployTarget is required and must be an object");
  } else {
    const dt = config.deployTarget as Record<string, unknown>;
    if (!VALID_DEPLOY_TARGETS.includes(dt.type as typeof VALID_DEPLOY_TARGETS[number])) {
      errors.push(`deployTarget.type must be one of: ${VALID_DEPLOY_TARGETS.join(", ")}`);
    }
    if (dt.type !== "local" && !dt.projectName) {
      errors.push("deployTarget.projectName is required for non-local deploy targets");
    }
    if (dt.projectName) {
      if (typeof dt.projectName !== "string") {
        errors.push("deployTarget.projectName must be a string");
      } else {
        if (dt.projectName.length > 63) {
          errors.push(`deployTarget.projectName too long (max 63 chars): ${dt.projectName.length}`);
        }
        if (dt.type === "cloudflare-pages" && !/^[a-z0-9-]+$/.test(dt.projectName)) {
          errors.push(`deployTarget.projectName must be lowercase alphanumeric with hyphens for Cloudflare: ${dt.projectName}`);
        }
      }
    }
  }

  // Optional fields with type validation
  if (config.name !== undefined && typeof config.name !== "string") {
    errors.push("name must be a string");
  }

  if (config.type !== undefined) {
    if (!VALID_SHOP_TYPES.includes(config.type as typeof VALID_SHOP_TYPES[number])) {
      errors.push(`type must be one of: ${VALID_SHOP_TYPES.join(", ")}`);
    }
  }

  if (config.theme !== undefined && typeof config.theme !== "string") {
    errors.push("theme must be a string");
  }

  if (config.template !== undefined && typeof config.template !== "string") {
    errors.push("template must be a string");
  }

  // Payment providers
  if (config.payment !== undefined) {
    if (!Array.isArray(config.payment)) {
      errors.push("payment must be an array");
    } else {
      for (const p of config.payment) {
        if (!VALID_PAYMENT_PROVIDERS.includes(p as typeof VALID_PAYMENT_PROVIDERS[number])) {
          errors.push(`Invalid payment provider: ${p}. Valid: ${VALID_PAYMENT_PROVIDERS.join(", ")}`);
        }
      }
    }
  }

  // Shipping providers
  if (config.shipping !== undefined) {
    if (!Array.isArray(config.shipping)) {
      errors.push("shipping must be an array");
    } else {
      for (const s of config.shipping) {
        if (!VALID_SHIPPING_PROVIDERS.includes(s as typeof VALID_SHIPPING_PROVIDERS[number])) {
          errors.push(`Invalid shipping provider: ${s}. Valid: ${VALID_SHIPPING_PROVIDERS.join(", ")}`);
        }
      }
    }
  }

  // Tax provider
  if (config.tax !== undefined) {
    if (!VALID_TAX_PROVIDERS.includes(config.tax as typeof VALID_TAX_PROVIDERS[number])) {
      errors.push(`Invalid tax provider: ${config.tax}. Valid: ${VALID_TAX_PROVIDERS.join(", ")}`);
    }
  }

  // CI config
  if (config.ci !== undefined) {
    if (typeof config.ci !== "object" || config.ci === null) {
      errors.push("ci must be an object");
    } else {
      const ci = config.ci as Record<string, unknown>;
      if (ci.workflowName !== undefined && typeof ci.workflowName !== "string") {
        errors.push("ci.workflowName must be a string");
      }
      if (ci.useReusableWorkflow !== undefined && typeof ci.useReusableWorkflow !== "boolean") {
        errors.push("ci.useReusableWorkflow must be a boolean");
      }
    }
  }

  // Smoke checks
  if (config.smokeChecks !== undefined) {
    if (!Array.isArray(config.smokeChecks)) {
      errors.push("smokeChecks must be an array");
    } else {
      for (let i = 0; i < config.smokeChecks.length; i++) {
        const check = config.smokeChecks[i] as Record<string, unknown>;
        if (!check.endpoint || typeof check.endpoint !== "string") {
          errors.push(`smokeChecks[${i}].endpoint is required and must be a string`);
        }
        if (check.expectedStatus !== undefined) {
          if (typeof check.expectedStatus !== "number" || check.expectedStatus < 100 || check.expectedStatus > 599) {
            errors.push(`smokeChecks[${i}].expectedStatus must be a number between 100-599`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function main(): void {
  const configPath = process.argv[2];

  if (!configPath || configPath === "--help" || configPath === "-h") {
    console.log("Usage: pnpm validate-launch-config <config-file>");
    console.log("");
    console.log("Validates a launch-shop configuration file against:");
    console.log("  - Required fields (schemaVersion, shopId, deployTarget)");
    console.log("  - Field types and constraints");
    console.log("  - Business rules (naming conventions, provider values)");
    console.log("");
    console.log("Examples:");
    console.log("  pnpm validate-launch-config profiles/shops/acme-sale.json");
    console.log("  pnpm validate-launch-config ./my-shop-config.json");
    process.exit(0);
  }

  const resolvedPath = resolve(configPath);

  if (!existsSync(resolvedPath)) {
    console.error(`Error: Config file not found: ${configPath}`);
    process.exit(1);
  }

  console.log(`Validating: ${relative(process.cwd(), resolvedPath)}`);
  console.log("");

  // Load config
  let config: unknown;
  try {
    const content = readFileSync(resolvedPath, "utf8");
    config = JSON.parse(content);
  } catch (e) {
    console.error(`Error: Invalid JSON: ${(e as Error).message}`);
    process.exit(1);
  }

  if (typeof config !== "object" || config === null) {
    console.error("Error: Config must be a JSON object");
    process.exit(1);
  }

  // Validate
  const result = validateStructure(config as Record<string, unknown>);

  // Print results
  if (result.warnings.length > 0) {
    console.log("Warnings:");
    for (const w of result.warnings) {
      console.log(`  - ${w}`);
    }
    console.log("");
  }

  if (result.errors.length > 0) {
    console.log("Errors:");
    for (const e of result.errors) {
      console.log(`  - ${e}`);
    }
    console.log("");
    console.log("Validation FAILED");
    process.exit(1);
  }

  console.log("Validation PASSED");
  process.exit(0);
}

main();
