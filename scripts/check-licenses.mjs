#!/usr/bin/env node

/**
 * License compliance checker for proprietary commercial software.
 *
 * Verifies that all dependencies use licenses compatible with closed-source
 * commercial distribution. Uses pnpm's built-in license listing — no extra
 * dependencies required.
 *
 * Exit codes:
 *   0 — all dependencies compliant
 *   1 — one or more blocked licenses found in production dependencies
 *
 * Usage:
 *   node scripts/check-licenses.mjs          # check and report
 *   node scripts/check-licenses.mjs --json   # output JSON report
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const jsonMode = process.argv.includes("--json");

// Load policy
const policy = JSON.parse(
  readFileSync(join(__dirname, "license-policy.json"), "utf-8")
);

const allowedSet = new Set(policy.allowed);
const devOnlySet = new Set(policy.devOnly);
const exceptions = policy.exceptions || {};

/**
 * Normalize non-standard license identifiers to SPDX.
 */
const LICENSE_ALIASES = {
  "MIT License": "MIT",
  "BSD": "BSD-2-Clause",
  "Apache 2.0": "Apache-2.0",
  "Apache License 2.0": "Apache-2.0",
  "Apache License, Version 2.0": "Apache-2.0",
};

function normalizeLicense(license) {
  return LICENSE_ALIASES[license] || license;
}

/**
 * Parse an SPDX license expression and check if any option is permissive.
 * Handles simple OR expressions like "(MIT OR GPL-2.0)".
 */
function hasPermissiveOption(spdx) {
  const cleaned = spdx.replace(/[()]/g, "").trim();
  const parts = cleaned.split(/\s+OR\s+/i);
  return parts.some((p) => allowedSet.has(normalizeLicense(p.trim())));
}

/**
 * Check if all parts of an AND expression are permissive.
 * Handles expressions like "Apache-2.0 AND MIT".
 */
function allPartsPermissive(spdx) {
  const cleaned = spdx.replace(/[()]/g, "").trim();
  const parts = cleaned.split(/\s+AND\s+/i);
  return parts.every((p) => allowedSet.has(normalizeLicense(p.trim())));
}

/**
 * Check if a license is allowed for production use.
 */
function isAllowed(license, packageName) {
  // Exception
  if (exceptions[packageName]) return true;

  // Direct match
  if (allowedSet.has(license)) return true;

  // Normalized match
  if (allowedSet.has(normalizeLicense(license))) return true;

  // SPDX OR expression with a permissive option
  if (license.includes(" OR ") && hasPermissiveOption(license)) return true;

  // SPDX AND expression where all parts are permissive
  if (license.includes(" AND ") && allPartsPermissive(license)) return true;

  return false;
}

/**
 * Check if a license is allowed for dev-only use.
 */
function isDevAllowed(license, packageName) {
  if (isAllowed(license, packageName)) return true;
  if (devOnlySet.has(license)) return true;
  if (devOnlySet.has(normalizeLicense(license))) return true;
  // AND expressions where all parts are in allowed or devOnly
  if (license.includes(" AND ")) {
    const cleaned = license.replace(/[()]/g, "").trim();
    const parts = cleaned.split(/\s+AND\s+/i);
    if (parts.every((p) => {
      const n = normalizeLicense(p.trim());
      return allowedSet.has(n) || devOnlySet.has(n);
    })) return true;
  }
  return false;
}

/**
 * Run pnpm licenses list and parse JSON output.
 */
function getLicenses(prod = false) {
  const cmd = prod
    ? "pnpm licenses list --json --prod"
    : "pnpm licenses list --json";
  try {
    const output = execSync(cmd, {
      cwd: ROOT,
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(output);
  } catch (err) {
    // pnpm licenses list may exit non-zero but still produce valid JSON on stdout
    if (err.stdout) {
      try {
        return JSON.parse(err.stdout);
      } catch {
        // fall through
      }
    }
    console.error(`Failed to run: ${cmd}`);
    console.error(err.message);
    process.exit(1);
  }
}

// --- Main ---

const prodLicenses = getLicenses(true);
const allLicenses = getLicenses(false);

const violations = [];
const warnings = [];
const summary = { allowed: 0, devOnly: 0, exceptions: 0, blocked: 0, total: 0 };

// Check production dependencies
for (const [license, packages] of Object.entries(prodLicenses)) {
  for (const pkg of packages) {
    summary.total++;
    if (isAllowed(license, pkg.name)) {
      if (exceptions[pkg.name]) {
        summary.exceptions++;
      } else {
        summary.allowed++;
      }
    } else if (devOnlySet.has(license)) {
      // LGPL/MPL in production — this is a violation
      violations.push({
        name: pkg.name,
        version: pkg.versions?.[0] || "unknown",
        license,
        type: "production",
        reason: `${license} is only allowed for devDependencies, not production`,
      });
      summary.blocked++;
    } else {
      violations.push({
        name: pkg.name,
        version: pkg.versions?.[0] || "unknown",
        license,
        type: "production",
        reason: `${license} is not compatible with proprietary commercial use`,
      });
      summary.blocked++;
    }
  }
}

// Check dev dependencies (all minus prod) for warnings only
const prodPackageNames = new Set();
for (const packages of Object.values(prodLicenses)) {
  for (const pkg of packages) {
    prodPackageNames.add(pkg.name);
  }
}

for (const [license, packages] of Object.entries(allLicenses)) {
  for (const pkg of packages) {
    if (prodPackageNames.has(pkg.name)) continue; // already checked
    if (!isDevAllowed(license, pkg.name)) {
      warnings.push({
        name: pkg.name,
        version: pkg.versions?.[0] || "unknown",
        license,
        type: "devDependency",
        reason: `${license} is not in the allowed or devOnly lists`,
      });
    }
  }
}

// --- Output ---

if (jsonMode) {
  console.log(
    JSON.stringify({ summary, violations, warnings, policy: { allowed: policy.allowed, devOnly: policy.devOnly } }, null, 2)
  );
} else {
  console.log("License Compliance Report");
  console.log("=".repeat(60));
  console.log(`Project license: UNLICENSED (proprietary)`);
  console.log(`Policy: scripts/license-policy.json`);
  console.log();
  console.log(`Production packages checked: ${summary.total}`);
  console.log(`  Allowed:    ${summary.allowed}`);
  console.log(`  Exceptions: ${summary.exceptions}`);
  console.log(`  Blocked:    ${summary.blocked}`);
  console.log();

  if (violations.length > 0) {
    console.log("VIOLATIONS (production dependencies with incompatible licenses):");
    console.log("-".repeat(60));
    for (const v of violations) {
      console.log(`  ${v.name}@${v.version}`);
      console.log(`    License: ${v.license}`);
      console.log(`    Reason:  ${v.reason}`);
      console.log();
    }
  }

  if (warnings.length > 0) {
    console.log(`WARNINGS (${warnings.length} dev dependencies with non-standard licenses):`);
    console.log("-".repeat(60));
    for (const w of warnings) {
      console.log(`  ${w.name}@${w.version} — ${w.license}`);
    }
    console.log();
  }

  if (violations.length === 0) {
    console.log("Result: PASS — all production dependencies are compliant");
  } else {
    console.log(`Result: FAIL — ${violations.length} production license violation(s) found`);
    console.log();
    console.log("To fix:");
    console.log("  1. Replace the package with a permissively-licensed alternative");
    console.log("  2. Or add an exception to scripts/license-policy.json with justification");
  }
}

process.exit(violations.length > 0 ? 1 : 0);
