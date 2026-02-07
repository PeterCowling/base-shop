#!/usr/bin/env node
/**
 * LAUNCH-10: Automatic Secret Provisioning CLI
 *
 * Provisions secrets for a shop deployment:
 * - Auto-generates secrets that support generation (session secrets, etc.)
 * - Validates existing secrets
 * - Creates/updates SOPS-encrypted env files
 * - Reports missing secrets that require manual setup
 *
 * Usage:
 *   pnpm provision-secrets --shop <shopId> [options]
 *
 * Options:
 *   --shop <shopId>       Shop ID (required)
 *   --env <environment>   Environment: preview or production (default: preview)
 *   --generate            Auto-generate secrets that support generation
 *   --validate            Validate existing secrets only
 *   --list                List all required secrets and their status
 *   --output <file>       Output file for generated secrets (default: stdout)
 *   --format <format>     Output format: env, json, sops (default: env)
 *   --dry-run             Show what would be done without making changes
 *   --verbose             Verbose output
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync,readFileSync, writeFileSync } from "node:fs";
import { dirname,join } from "node:path";

import {
  generateSecretValue,
  generateSessionSecret,
  getRequiredSecretsForShop,
  getSecretDefinition,
  SECRET_REGISTRY,
  type SecretDefinition,
  validateSecret,
} from "@acme/platform-core/secrets";

// ============================================================
// Types
// ============================================================

interface ProvisionOptions {
  shopId: string;
  environment: "preview" | "production";
  generate: boolean;
  validate: boolean;
  list: boolean;
  outputFile?: string;
  format: "env" | "json" | "sops";
  dryRun: boolean;
  verbose: boolean;
}

interface SecretStatus {
  name: string;
  definition: SecretDefinition;
  status: "present" | "missing" | "invalid" | "placeholder" | "generated";
  value?: string;
  errors?: string[];
}

// ============================================================
// CLI Parsing
// ============================================================

function parseArgs(args: string[]): ProvisionOptions {
  const options: ProvisionOptions = {
    shopId: "",
    environment: "preview",
    generate: false,
    validate: false,
    list: false,
    format: "env",
    dryRun: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--shop":
      case "-s":
        options.shopId = next || "";
        i++;
        break;
      case "--env":
      case "-e":
        if (next === "preview" || next === "production") {
          options.environment = next;
        }
        i++;
        break;
      case "--generate":
      case "-g":
        options.generate = true;
        break;
      case "--validate":
        options.validate = true;
        break;
      case "--list":
      case "-l":
        options.list = true;
        break;
      case "--output":
      case "-o":
        options.outputFile = next;
        i++;
        break;
      case "--format":
      case "-f":
        if (next === "env" || next === "json" || next === "sops") {
          options.format = next;
        }
        i++;
        break;
      case "--dry-run":
        options.dryRun = true;
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
Secret Provisioning CLI (LAUNCH-10)

Usage: pnpm provision-secrets --shop <shopId> [options]

Options:
  -s, --shop <shopId>     Shop ID (required)
  -e, --env <environment> Environment: preview or production (default: preview)
  -g, --generate          Auto-generate secrets that support generation
  --validate              Validate existing secrets only
  -l, --list              List all required secrets and their status
  -o, --output <file>     Output file for generated secrets
  -f, --format <format>   Output format: env, json, sops (default: env)
  --dry-run               Show what would be done without changes
  -v, --verbose           Verbose output
  -h, --help              Show this help

Examples:
  # List required secrets for a shop
  pnpm provision-secrets --shop acme-sale --list

  # Validate existing secrets
  pnpm provision-secrets --shop acme-sale --validate

  # Generate auto-generatable secrets
  pnpm provision-secrets --shop acme-sale --generate --dry-run

  # Generate and save to env file
  pnpm provision-secrets --shop acme-sale --generate -o .env.local

  # Generate SOPS-encrypted secrets
  pnpm provision-secrets --shop acme-sale --generate --format sops
`);
}

// ============================================================
// Secret Loading
// ============================================================

function loadExistingSecrets(shopId: string, environment: string): Record<string, string> {
  const secrets: Record<string, string> = {};

  // Load from process.env
  for (const secret of SECRET_REGISTRY) {
    const value = process.env[secret.name];
    if (value) {
      secrets[secret.name] = value;
    }
  }

  // Try to load from shop's env file
  const envPaths = [
    join(process.cwd(), `apps/shop-${shopId}/.env.${environment}`),
    join(process.cwd(), `apps/shop-${shopId}/.env.local`),
    join(process.cwd(), `apps/shop-${shopId}/.env`),
    join(process.cwd(), `profiles/shops/${shopId}.env`),
  ];

  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf8");
      const parsed = parseEnvFile(content);
      Object.assign(secrets, parsed);
    }
  }

  return secrets;
}

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

// ============================================================
// Secret Status
// ============================================================

function getSecretStatuses(
  required: SecretDefinition[],
  existing: Record<string, string>,
  options: ProvisionOptions
): SecretStatus[] {
  const statuses: SecretStatus[] = [];

  for (const definition of required) {
    const value = existing[definition.name];
    const status: SecretStatus = {
      name: definition.name,
      definition,
      status: "missing",
    };

    if (value === undefined || value === "") {
      status.status = "missing";
    } else if (isPlaceholder(value)) {
      status.status = "placeholder";
    } else {
      const validation = validateSecret(definition.name, value);
      if (validation.valid) {
        status.status = "present";
      } else {
        status.status = "invalid";
        status.errors = validation.errors;
      }
    }

    statuses.push(status);
  }

  return statuses;
}

function isPlaceholder(value: string): boolean {
  const patterns = [
    /^TODO_/i,
    /^__REPLACE_ME__$/i,
    /^placeholder$/i,
    /^CHANGEME$/i,
    /^xxx+$/i,
  ];
  return patterns.some((p) => p.test(value));
}

// ============================================================
// Secret Generation
// ============================================================

function generateMissingSecrets(
  statuses: SecretStatus[],
  options: ProvisionOptions
): SecretStatus[] {
  const updated: SecretStatus[] = [];

  for (const status of statuses) {
    if (status.status === "missing" || status.status === "placeholder") {
      const definition = status.definition;

      if (definition.canAutoGenerate && definition.generate) {
        const generated = definition.generate();
        updated.push({
          ...status,
          status: "generated",
          value: generated,
        });

        if (options.verbose) {
          console.log(`  Generated: ${definition.name}`);
        }
      } else {
        updated.push(status);

        if (options.verbose) {
          console.log(`  Cannot auto-generate: ${definition.name}`);
          if (definition.providerDocs) {
            console.log(`    See: ${definition.providerDocs}`);
          }
        }
      }
    } else {
      updated.push(status);
    }
  }

  return updated;
}

// ============================================================
// Output Formatting
// ============================================================

function formatOutput(
  statuses: SecretStatus[],
  format: "env" | "json" | "sops"
): string {
  const generated = statuses.filter(
    (s) => s.status === "generated" && s.value
  );

  switch (format) {
    case "json":
      const jsonObj: Record<string, string> = {};
      for (const s of generated) {
        if (s.value) {
          jsonObj[s.name] = s.value;
        }
      }
      return JSON.stringify(jsonObj, null, 2);

    case "env":
    default:
      const lines: string[] = [
        "# Auto-generated secrets (LAUNCH-10)",
        `# Generated: ${new Date().toISOString()}`,
        "",
      ];

      for (const s of generated) {
        if (s.value) {
          lines.push(`# ${s.definition.description}`);
          lines.push(`${s.name}="${s.value}"`);
          lines.push("");
        }
      }

      return lines.join("\n");
  }
}

function writeOutput(
  content: string,
  outputFile: string | undefined,
  format: string,
  dryRun: boolean
): void {
  if (dryRun) {
    console.log("\n--- Generated output (dry run) ---");
    console.log(content);
    console.log("--- End output ---\n");
    return;
  }

  if (outputFile) {
    const dir = dirname(outputFile);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    if (format === "sops") {
      // Write to temp file, then encrypt with SOPS
      const tempFile = `${outputFile}.tmp`;
      writeFileSync(tempFile, content, "utf8");

      try {
        execSync(`sops -e -i ${tempFile}`, { stdio: "inherit" });
        // Rename to final location
        execSync(`mv ${tempFile} ${outputFile}`);
        console.log(`Encrypted secrets written to: ${outputFile}`);
      } catch (error) {
        console.error("Failed to encrypt with SOPS. Is SOPS installed?");
        // Clean up temp file
        try {
          execSync(`rm -f ${tempFile}`);
        } catch {}
        throw error;
      }
    } else {
      writeFileSync(outputFile, content, "utf8");
      console.log(`Secrets written to: ${outputFile}`);
    }
  } else {
    console.log(content);
  }
}

// ============================================================
// Commands
// ============================================================

function listSecrets(
  statuses: SecretStatus[],
  options: ProvisionOptions
): void {
  console.log(`\nRequired secrets for shop: ${options.shopId}`);
  console.log(`Environment: ${options.environment}\n`);

  const categories = new Map<string, SecretStatus[]>();
  for (const status of statuses) {
    const cat = status.definition.category;
    if (!categories.has(cat)) {
      categories.set(cat, []);
    }
    categories.get(cat)!.push(status);
  }

  for (const [category, secrets] of categories) {
    console.log(`[${category.toUpperCase()}]`);

    for (const status of secrets) {
      const statusIcon = getStatusIcon(status.status);
      const autoGen = status.definition.canAutoGenerate ? " [auto]" : "";
      console.log(`  ${statusIcon} ${status.name}${autoGen}`);

      if (options.verbose) {
        console.log(`     ${status.definition.description}`);
        if (status.definition.condition) {
          console.log(`     Condition: ${status.definition.condition}`);
        }
        if (status.errors) {
          for (const err of status.errors) {
            console.log(`     Error: ${err}`);
          }
        }
      }
    }

    console.log("");
  }

  // Summary
  const present = statuses.filter((s) => s.status === "present").length;
  const missing = statuses.filter((s) => s.status === "missing").length;
  const invalid = statuses.filter((s) => s.status === "invalid").length;
  const placeholder = statuses.filter((s) => s.status === "placeholder").length;
  const autoGenerable = statuses.filter(
    (s) =>
      (s.status === "missing" || s.status === "placeholder") &&
      s.definition.canAutoGenerate
  ).length;

  console.log("Summary:");
  console.log(`  Present:     ${present}`);
  console.log(`  Missing:     ${missing}`);
  console.log(`  Invalid:     ${invalid}`);
  console.log(`  Placeholder: ${placeholder}`);
  console.log(`  Auto-gen:    ${autoGenerable} can be auto-generated`);
}

function getStatusIcon(status: SecretStatus["status"]): string {
  switch (status) {
    case "present":
      return "✓";
    case "missing":
      return "✗";
    case "invalid":
      return "!";
    case "placeholder":
      return "?";
    case "generated":
      return "+";
  }
}

function validateSecrets(
  statuses: SecretStatus[],
  options: ProvisionOptions
): boolean {
  console.log(`\nValidating secrets for shop: ${options.shopId}`);
  console.log(`Environment: ${options.environment}\n`);

  let allValid = true;

  for (const status of statuses) {
    if (status.status === "present") {
      if (options.verbose) {
        console.log(`✓ ${status.name}`);
      }
    } else {
      allValid = false;
      console.log(`✗ ${status.name}: ${status.status}`);
      if (status.errors) {
        for (const err of status.errors) {
          console.log(`  - ${err}`);
        }
      }
    }
  }

  console.log("");

  if (allValid) {
    console.log("All secrets are valid.");
  } else {
    console.log("Some secrets are missing or invalid.");
  }

  return allValid;
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!options.shopId) {
    console.error("Error: --shop <shopId> is required");
    printHelp();
    process.exit(1);
  }

  // Default to list if no command specified
  if (!options.generate && !options.validate && !options.list) {
    options.list = true;
  }

  console.log("=== Secret Provisioning ===\n");

  // Get required secrets for this shop
  // For now, use default config - in a real implementation,
  // this would load the shop's configuration
  const shopConfig = {
    paymentsProvider: "stripe",
    emailProvider: "resend",
    cmsProvider: undefined,
    sessionStore: "memory",
  };

  const required = getRequiredSecretsForShop(shopConfig);

  if (options.verbose) {
    console.log(`Found ${required.length} required secrets for shop config\n`);
  }

  // Load existing secrets
  const existing = loadExistingSecrets(options.shopId, options.environment);

  if (options.verbose) {
    console.log(`Loaded ${Object.keys(existing).length} existing secrets\n`);
  }

  // Get statuses
  let statuses = getSecretStatuses(required, existing, options);

  // Handle commands
  if (options.list) {
    listSecrets(statuses, options);
    return;
  }

  if (options.validate) {
    const valid = validateSecrets(statuses, options);
    process.exit(valid ? 0 : 1);
  }

  if (options.generate) {
    console.log("Generating missing secrets...\n");

    statuses = generateMissingSecrets(statuses, options);

    const generated = statuses.filter((s) => s.status === "generated");
    const stillMissing = statuses.filter(
      (s) => s.status === "missing" || s.status === "placeholder"
    );

    if (generated.length > 0) {
      console.log(`\nGenerated ${generated.length} secret(s):`);
      for (const s of generated) {
        console.log(`  + ${s.name}`);
      }

      const output = formatOutput(statuses, options.format);
      writeOutput(output, options.outputFile, options.format, options.dryRun);
    } else {
      console.log("No secrets to generate (all auto-generatable secrets are present).");
    }

    if (stillMissing.length > 0) {
      console.log(`\n${stillMissing.length} secret(s) require manual setup:`);
      for (const s of stillMissing) {
        console.log(`  - ${s.name}`);
        if (s.definition.providerDocs) {
          console.log(`    See: ${s.definition.providerDocs}`);
        }
      }
    }
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

export { generateMissingSecrets,getSecretStatuses, loadExistingSecrets, parseArgs };
