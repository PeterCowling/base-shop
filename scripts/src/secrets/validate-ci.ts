#!/usr/bin/env node
/**
 * CI validation script for secrets.
 *
 * Exits with code 1 if required deploy secrets are missing or contain placeholders.
 * Reports variable names only - never logs secret values.
 *
 * Usage:
 *   npx ts-node scripts/src/secrets/validate-ci.ts <env-file>
 *   node scripts/src/secrets/validate-ci.js <env-file>
 *
 * Exit codes:
 *   0 - Validation passed
 *   1 - Validation failed (missing or placeholder secrets)
 *   2 - Usage error (file not found, etc.)
 *
 * Part of SEC-04 in the Integrated Secrets Workflow Plan.
 * @see docs/plans/integrated-secrets-workflow-plan.md
 */
/* eslint-disable security/detect-non-literal-fs-filename -- SEC-04: CLI script with path from CLI args */
/* eslint-disable ds/no-hardcoded-copy -- SEC-04: CLI-only script, not user-facing UI */

import { existsSync, readFileSync } from "node:fs";
import { validateDeployEnv, isPlaceholder } from "@config/env-schema";

const envFile = process.argv[2];

if (!envFile) {
  console.error("Usage: validate-ci.ts <env-file>");
  console.error("");
  console.error("Example:");
  console.error("  npx ts-node scripts/src/secrets/validate-ci.ts apps/shop-acme/.env");
  process.exit(2);
}

if (!existsSync(envFile)) {
  console.error(`ERROR: Environment file not found: ${envFile}`);
  console.error("");
  console.error("Ensure the file exists or run SOPS decryption first.");
  process.exit(2);
}

// Parse .env file
const content = readFileSync(envFile, "utf8");
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

// Validate against deploy schema
const failures = validateDeployEnv(env);

// Also check for placeholder patterns not caught by schema
const extraPlaceholders: string[] = [];
for (const [key, value] of Object.entries(env)) {
  if (
    isPlaceholder(value) &&
    !failures.some((f: { name: string; reason: string }) => f.name === key)
  ) {
    extraPlaceholders.push(key);
  }
}

const allFailures = [
  ...failures,
  ...extraPlaceholders.map((name) => ({ name, reason: "placeholder pattern" })),
];

if (allFailures.length > 0) {
  console.error("Deploy environment validation FAILED");
  console.error("");
  console.error("Missing or placeholder variables:");
  for (const { name, reason } of allFailures) {
    console.error(`  - ${name}: ${reason}`);
  }
  console.error("");
  console.error("Fix these issues before deployment:");
  console.error("  1. Update the encrypted .env.*.sops file with real values");
  console.error("  2. Re-run SOPS decryption: ./scripts/secrets.sh decrypt <app> <env>");
  console.error("  3. Or set values in GitHub Secrets / Cloudflare environment");
  process.exit(1);
}

console.log("Deploy environment validation PASSED");
console.log(`Validated ${Object.keys(env).length} environment variables`);
process.exit(0);
