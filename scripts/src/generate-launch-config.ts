// scripts/src/generate-launch-config.ts
/**
 * LAUNCH-11: Interactive config generator wizard for launch-shop.
 *
 * Usage:
 *   pnpm generate-launch-config [--output <file>] [--non-interactive]
 *
 * Generates a launch config JSON file by:
 * 1. Discovering available themes, templates, providers
 * 2. Prompting for shop configuration
 * 3. Validating output against launchConfigSchema
 * 4. Writing to profiles/shops/<shopId>.json
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname,join } from "node:path";

import { type LaunchConfig,launchConfigSchema } from "@acme/platform-core/createShop";
import { listThemes } from "@acme/platform-core/createShop/fsUtils";
import { listProviders } from "@acme/platform-core/createShop/listProviders";
import { validateShopName } from "@acme/platform-core/shops";

import { ensureRuntime } from "./runtime";
import { prompt, promptEmail,promptUrl, selectOption, selectProviders } from "./utils/prompts";
import { listDirNames } from "./utils/templates";

// ============================================================
// CLI Argument Parsing
// ============================================================

interface GeneratorFlags {
  output?: string;
  nonInteractive: boolean;
  shopId?: string;
  defaults: boolean;
}

function parseArgs(argv: string[]): GeneratorFlags {
  const flags: GeneratorFlags = {
    nonInteractive: false,
    defaults: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--output" || arg === "-o") {
      flags.output = argv[++i];
    } else if (arg === "--non-interactive" || arg === "-n") {
      flags.nonInteractive = true;
    } else if (arg === "--defaults" || arg === "-d") {
      flags.defaults = true;
    } else if (arg === "--shop-id" || arg === "-s") {
      flags.shopId = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return flags;
}

function printHelp(): void {
  console.log(`
Usage: pnpm generate-launch-config [options]

Options:
  -o, --output <file>      Output file path (default: profiles/shops/<shopId>.json)
  -s, --shop-id <id>       Shop ID (skips prompt)
  -n, --non-interactive    Use defaults without prompting
  -d, --defaults           Pre-fill with sensible defaults
  -h, --help               Show this help message

Examples:
  pnpm generate-launch-config
  pnpm generate-launch-config --shop-id my-shop --defaults
  pnpm generate-launch-config -o config/my-shop.json
`);
}

// ============================================================
// Discovery Functions
// ============================================================

function discoverTemplates(): string[] {
  const templates = listDirNames(join(process.cwd(), "packages")).filter((n) =>
    n.startsWith("template-")
  );
  return templates.length > 0 ? templates : ["template-app"];
}

async function discoverProviders(): Promise<{
  payment: string[];
  shipping: string[];
}> {
  const [paymentProviders, shippingProviders] = await Promise.all([
    listProviders("payment"),
    listProviders("shipping"),
  ]);

  return {
    payment: paymentProviders.map((p) => p.id),
    shipping: shippingProviders.map((p) => p.id),
  };
}

// ============================================================
// Prompt Sections
// ============================================================

interface WizardState {
  shopId: string;
  name: string;
  theme: string;
  template: string;
  deployTarget: {
    type: "cloudflare-pages" | "vercel" | "local";
    projectName?: string;
  };
  payment: string[];
  shipping: string[];
  smokeChecks: Array<{ endpoint: string; expectedStatus: number }>;
  complianceSignOff?: {
    signedOffBy: string;
    signedOffAt: string;
  };
}

async function promptBasicInfo(flags: GeneratorFlags): Promise<{ shopId: string; name: string }> {
  let shopId = flags.shopId;

  if (!shopId) {
    console.log("\n=== Shop Identity ===\n");
    shopId = await prompt("Shop ID (lowercase, alphanumeric, dashes): ");
  }

  try {
    shopId = validateShopName(shopId);
  } catch (err) {
    console.error(`Invalid shop ID: ${(err as Error).message}`);
    process.exit(1);
  }

  let name = shopId;
  if (!flags.nonInteractive) {
    const providedName = await prompt(`Shop display name [${shopId}]: `, shopId);
    name = providedName || shopId;
  }

  return { shopId, name };
}

async function promptThemeSelection(
  themes: string[],
  flags: GeneratorFlags
): Promise<string> {
  if (flags.nonInteractive || flags.defaults) {
    return themes.includes("base") ? "base" : themes[0];
  }

  console.log("\n=== Theme Selection ===\n");
  return selectOption("theme", themes, Math.max(themes.indexOf("base"), 0));
}

async function promptTemplateSelection(
  templates: string[],
  flags: GeneratorFlags
): Promise<string> {
  if (flags.nonInteractive || flags.defaults) {
    return templates.includes("template-app") ? "template-app" : templates[0];
  }

  console.log("\n=== Template Selection ===\n");
  return selectOption(
    "template",
    templates,
    Math.max(templates.indexOf("template-app"), 0)
  );
}

async function promptDeployTarget(
  flags: GeneratorFlags
): Promise<WizardState["deployTarget"]> {
  if (flags.nonInteractive) {
    return { type: "local" };
  }

  console.log("\n=== Deploy Target ===\n");
  const deployTypes = ["cloudflare-pages", "vercel", "local"] as const;
  const type = (await selectOption("deploy target", [...deployTypes], 0)) as typeof deployTypes[number];

  if (type === "local") {
    return { type };
  }

  const projectName = await prompt(`${type} project name: `);
  if (!projectName) {
    console.error("Project name is required for non-local deployments.");
    process.exit(1);
  }

  return { type, projectName };
}

async function promptProviders(
  availableProviders: { payment: string[]; shipping: string[] },
  flags: GeneratorFlags
): Promise<{ payment: string[]; shipping: string[] }> {
  if (flags.nonInteractive) {
    return {
      payment: availableProviders.payment.includes("stripe") ? ["stripe"] : [],
      shipping: [],
    };
  }

  console.log("\n=== Provider Configuration ===\n");

  const payment = await selectProviders(
    "payment providers",
    availableProviders.payment
  );

  const shipping = await selectProviders(
    "shipping providers",
    availableProviders.shipping
  );

  return { payment, shipping };
}

async function promptSmokeChecks(
  flags: GeneratorFlags
): Promise<Array<{ endpoint: string; expectedStatus: number }>> {
  const defaultChecks = [
    { endpoint: "/", expectedStatus: 200 },
    { endpoint: "/api/health", expectedStatus: 200 },
  ];

  if (flags.nonInteractive || flags.defaults) {
    return defaultChecks;
  }

  console.log("\n=== Smoke Checks ===\n");
  console.log("Default smoke checks:");
  for (const check of defaultChecks) {
    console.log(`  - ${check.endpoint} (expected: ${check.expectedStatus})`);
  }

  const useDefaults = await prompt("Use default smoke checks? [Y/n]: ", "Y");
  if (useDefaults.toLowerCase() !== "n") {
    return defaultChecks;
  }

  const checks: Array<{ endpoint: string; expectedStatus: number }> = [];

  while (true) {
    const endpoint = await prompt("Endpoint to check (empty to finish): ");
    if (!endpoint) break;

    const statusStr = await prompt("Expected status [200]: ", "200");
    const expectedStatus = parseInt(statusStr, 10) || 200;

    checks.push({ endpoint, expectedStatus });
  }

  return checks.length > 0 ? checks : defaultChecks;
}

async function promptComplianceSignOff(
  flags: GeneratorFlags
): Promise<WizardState["complianceSignOff"] | undefined> {
  if (flags.nonInteractive) {
    return undefined;
  }

  console.log("\n=== Compliance Sign-Off (Optional) ===\n");
  console.log("For production launches, compliance sign-off is required.");

  const addSignOff = await prompt("Add compliance sign-off now? [y/N]: ", "N");
  if (addSignOff.toLowerCase() !== "y") {
    return undefined;
  }

  const signedOffBy = await promptEmail("Sign-off email: ");
  if (!signedOffBy) {
    console.log("Skipping sign-off (no email provided).");
    return undefined;
  }

  return {
    signedOffBy,
    signedOffAt: new Date().toISOString(),
  };
}

// ============================================================
// Config Assembly
// ============================================================

function assembleConfig(state: WizardState): LaunchConfig {
  const config: LaunchConfig = {
    schemaVersion: 1,
    shopId: state.shopId,
    name: state.name,
    theme: state.theme,
    template: state.template,
    deployTarget: state.deployTarget,
    payment: state.payment as ["stripe" | "paypal", ...("stripe" | "paypal")[]],
    shipping: state.shipping as ["dhl" | "ups" | "premier-shipping", ...("dhl" | "ups" | "premier-shipping")[]],
    tax: "taxjar",
    smokeChecks: state.smokeChecks,
    navItems: [],
    pages: [],
    checkoutPage: [],
    themeOverrides: {},
  };

  if (state.complianceSignOff) {
    config.complianceSignOff = state.complianceSignOff;
  }

  return config;
}

function validateConfig(config: LaunchConfig): { valid: boolean; errors: string[] } {
  const result = launchConfigSchema.safeParse(config);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.issues.map(
    (i) => `${i.path.join(".")}: ${i.message}`
  );
  return { valid: false, errors };
}

// ============================================================
// Output
// ============================================================

function getOutputPath(shopId: string, flags: GeneratorFlags): string {
  if (flags.output) {
    return flags.output;
  }
  return join("profiles", "shops", `${shopId}.json`);
}

function writeConfig(config: LaunchConfig, outputPath: string): void {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(outputPath, JSON.stringify(config, null, 2));
  console.log(`\nConfig written to: ${outputPath}`);
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  const flags = parseArgs(process.argv.slice(2));

  console.log("=== Launch Config Generator ===\n");

  // Discover available options
  console.log("Discovering available themes, templates, and providers...");
  const themes = listThemes().filter((t) => t !== "dummy");
  const templates = discoverTemplates();
  const providers = await discoverProviders();

  console.log(`Found ${themes.length} themes, ${templates.length} templates`);
  console.log(`Found ${providers.payment.length} payment providers, ${providers.shipping.length} shipping providers`);

  // Run wizard prompts
  const { shopId, name } = await promptBasicInfo(flags);
  const theme = await promptThemeSelection(themes, flags);
  const template = await promptTemplateSelection(templates, flags);
  const deployTarget = await promptDeployTarget(flags);
  const { payment, shipping } = await promptProviders(providers, flags);
  const smokeChecks = await promptSmokeChecks(flags);
  const complianceSignOff = await promptComplianceSignOff(flags);

  // Assemble config
  const state: WizardState = {
    shopId,
    name,
    theme,
    template,
    deployTarget,
    payment,
    shipping,
    smokeChecks,
    complianceSignOff,
  };

  const config = assembleConfig(state);

  // Validate
  const validation = validateConfig(config);
  if (!validation.valid) {
    console.error("\nConfig validation failed:");
    for (const error of validation.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  // Write output
  const outputPath = getOutputPath(shopId, flags);
  writeConfig(config, outputPath);

  // Summary
  console.log("\n=== Config Summary ===");
  console.log(`Shop ID:       ${config.shopId}`);
  console.log(`Name:          ${config.name}`);
  console.log(`Theme:         ${config.theme}`);
  console.log(`Template:      ${config.template}`);
  console.log(`Deploy:        ${config.deployTarget.type}${config.deployTarget.projectName ? ` (${config.deployTarget.projectName})` : ""}`);
  console.log(`Payment:       ${config.payment?.join(", ") || "none"}`);
  console.log(`Shipping:      ${config.shipping?.join(", ") || "none"}`);
  console.log(`Smoke checks:  ${config.smokeChecks?.length ?? 0}`);
  console.log(`Compliance:    ${config.complianceSignOff ? "Yes" : "Not configured"}`);

  console.log("\nNext steps:");
  console.log(`  1. Review and edit: ${outputPath}`);
  console.log(`  2. Run validation: pnpm launch-shop --config ${outputPath} --validate`);
  console.log(`  3. Preview deploy:  pnpm launch-shop --config ${outputPath} --mode preview`);
}

if (process.argv[1]?.includes("generate-launch-config")) {
  ensureRuntime();
  main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}

export { assembleConfig, parseArgs, validateConfig };
