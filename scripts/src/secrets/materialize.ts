/**
 * SOPS-based secrets materialisation for init-shop and CI.
 *
 * Decrypts .env.*.sops files to produce .env files for deployment.
 * Part of SEC-04 in the Integrated Secrets Workflow Plan.
 *
 * Key behaviors:
 * - Uses `sops -d --input-type dotenv --output-type dotenv`
 * - Reports variable names only (never logs values)
 * - Integrates with validateDeployEnv from @acme/config/env-schema
 *
 * @see docs/plans/integrated-secrets-workflow-plan.md
 */
 
 
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname,join } from "node:path";

import { isPlaceholder,validateDeployEnv } from "@acme/config/env-schema";

export interface MaterializeOptions {
  /** App directory, e.g., "apps/shop-acme" */
  appDir: string;
  /** Environment: preview or production */
  environment: "preview" | "production";
  /** Output path, defaults to <appDir>/.env */
  outputPath?: string;
  /** Run schema validation after decrypt (default: true) */
  validateSchema?: boolean;
}

export interface MaterializeResult {
  success: boolean;
  outputPath: string;
  /** Variable names that were decrypted (no values) */
  decryptedVars: string[];
  /** Required vars that are missing or placeholder */
  missingVars: string[];
  warnings: string[];
  error?: string;
}

export interface SopsCheckResult {
  available: boolean;
  sopsPath?: string;
  ageKeyExists: boolean;
  error?: string;
}

/**
 * Check if SOPS and age are available and configured.
 */
export function checkSopsAvailable(): SopsCheckResult {
  // Check for sops binary
  const sopsResult = spawnSync("which", ["sops"], { encoding: "utf8" });
  if (sopsResult.status !== 0) {
    return {
      available: false,
      ageKeyExists: false,
      error:
        "SOPS not found. Install with: brew install sops (macOS) or see https://github.com/getsops/sops",
    };
  }

  const sopsPath = sopsResult.stdout.trim();

  // Check for age key
  const ageKeyPath = join(
    process.env.HOME || "~",
    ".config",
    "sops",
    "age",
    "keys.txt"
  );
  const ageKeyExists = existsSync(ageKeyPath);

  if (!ageKeyExists) {
    return {
      available: true,
      sopsPath,
      ageKeyExists: false,
      error: `Age key not found at ${ageKeyPath}. Run: ./scripts/secrets.sh bootstrap`,
    };
  }

  return {
    available: true,
    sopsPath,
    ageKeyExists: true,
  };
}

/**
 * Get the path to the SOPS file for an app/environment.
 * Returns null if the file doesn't exist.
 */
export function getSopsFilePath(
  appDir: string,
  environment: "preview" | "production"
): string | null {
  const sopsPath = join(appDir, `.env.${environment}.sops`);
  return existsSync(sopsPath) ? sopsPath : null;
}

/**
 * Parse dotenv content into key-value pairs.
 * Does NOT log values.
 */
function parseEnvContent(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    env[key] = value;
  }
  return env;
}

/**
 * Decrypt SOPS file and write to .env.
 * Never logs secret values - only reports variable names.
 */
export function materializeSecrets(
  options: MaterializeOptions
): MaterializeResult {
  const { appDir, environment, validateSchema = true } = options;
  const outputPath = options.outputPath ?? join(appDir, ".env");

  const result: MaterializeResult = {
    success: false,
    outputPath,
    decryptedVars: [],
    missingVars: [],
    warnings: [],
  };

  // Check SOPS availability
  const sopsCheck = checkSopsAvailable();
  if (!sopsCheck.available) {
    result.error = sopsCheck.error;
    return result;
  }

  if (!sopsCheck.ageKeyExists) {
    result.error = sopsCheck.error;
    return result;
  }

  // Find SOPS file
  const sopsFile = getSopsFilePath(appDir, environment);
  if (!sopsFile) {
    result.error = `SOPS file not found: ${appDir}/.env.${environment}.sops`;
    return result;
  }

  // Decrypt
  try {
    const decrypted = execSync(
      `sops -d --input-type dotenv --output-type dotenv "${sopsFile}"`,
      {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    // Parse to extract variable names (no values logged)
    const env = parseEnvContent(decrypted);
    result.decryptedVars = Object.keys(env);

    // Ensure output directory exists
    const outDir = dirname(outputPath);
    if (!existsSync(outDir)) {
      throw new Error(`Output directory does not exist: ${outDir}`);
    }

    // Write decrypted content
    writeFileSync(outputPath, decrypted);

    // Validate if requested
    if (validateSchema) {
      const validation = validateMaterializedEnv(outputPath);
      result.missingVars = [...validation.missing, ...validation.placeholders];

      if (validation.placeholders.length > 0) {
        result.warnings.push(
          `Found ${validation.placeholders.length} placeholder value(s) that will fail deploy validation`
        );
      }
    }

    result.success = true;
  } catch (err) {
    const error = err as Error & { stderr?: string };
    result.error = error.stderr || error.message;

    // Add helpful context for common errors
    if (result.error.includes("could not decrypt")) {
      result.error +=
        "\n\nThis usually means the age key doesn't match. Check ~/.config/sops/age/keys.txt";
    }
  }

  return result;
}

/**
 * Validate decrypted env against deploy schema.
 * Returns missing/placeholder variable names only (no values).
 */
export function validateMaterializedEnv(
  envPath: string,
  options?: { sentinel?: string }
): { valid: boolean; missing: string[]; placeholders: string[] } {
  const sentinel = options?.sentinel ?? "TODO_";

  if (!existsSync(envPath)) {
    return { valid: false, missing: ["(file not found)"], placeholders: [] };
  }

  const content = readFileSync(envPath, "utf8");
  const env = parseEnvContent(content);

  // Use schema-based validation
  const failures = validateDeployEnv(env, sentinel);

  const missing: string[] = [];
  const placeholders: string[] = [];

  for (const { name, reason } of failures) {
    if (reason === "missing") {
      missing.push(name);
    } else if (reason.includes("placeholder")) {
      placeholders.push(name);
    }
  }

  // Also check for other placeholder patterns
  for (const [key, value] of Object.entries(env)) {
    if (isPlaceholder(value) && !placeholders.includes(key)) {
      placeholders.push(key);
    }
  }

  return {
    valid: missing.length === 0 && placeholders.length === 0,
    missing,
    placeholders,
  };
}

/**
 * Parse an existing .env file into key-value pairs.
 * Exported for use in initShop integration.
 */
export function parseEnvFile(envPath: string): Record<string, string> {
  if (!existsSync(envPath)) {
    return {};
  }
  const content = readFileSync(envPath, "utf8");
  return parseEnvContent(content);
}
