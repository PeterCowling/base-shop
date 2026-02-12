/**
 * Coverage Tiers — Uniform coverage policy for base-shop monorepo.
 *
 * This module defines tiered coverage thresholds based on code criticality.
 * All packages MUST use one of these tiers — no ad-hoc thresholds.
 *
 * Usage in jest.config.cjs:
 *   const { getTier, TIERS } = require("@acme/config/coverage-tiers.cjs");
 *   module.exports = {
 *     ...baseConfig,
 *     coverageThreshold: getTier("@acme/stripe"), // Returns CRITICAL tier
 *   };
 *
 * Or directly:
 *   const { TIERS } = require("@acme/config/coverage-tiers.cjs");
 *   module.exports = {
 *     coverageThreshold: TIERS.STANDARD,
 *   };
 */

/**
 * Coverage tiers ordered by criticality.
 *
 * CRITICAL (90%): Revenue and security-critical code. Bugs here cause
 *   financial loss, security incidents, or data corruption.
 *
 * STANDARD (80%): Core domain logic and shared libraries. The baseline
 *   for world-class repositories. All packages default to this.
 *
 * MINIMAL (0%): Type definitions, config, templates, scripts. No runtime
 *   logic that could fail in production.
 */
const TIERS = {
  CRITICAL: {
    global: {
      lines: 90,
      branches: 90,
      functions: 90,
      statements: 90,
    },
  },
  STANDARD: {
    global: {
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
    },
  },
  MINIMAL: {
    global: {
      lines: 0,
      branches: 0,
      functions: 0,
      statements: 0,
    },
  },
};

/**
 * Package-to-tier assignments.
 *
 * Packages not listed here default to STANDARD (80%).
 * Add packages explicitly when they need CRITICAL or MINIMAL tiers.
 */
const PACKAGE_TIERS = {
  // CRITICAL: Revenue and security-critical
  "@acme/stripe": "CRITICAL",
  "@acme/auth": "CRITICAL",
  "@acme/platform-core": "CRITICAL",

  // MINIMAL: No runtime logic, config, or coverage not yet established
  "@acme/types": "MINIMAL",
  "@acme/templates": "MINIMAL",
  "@acme/template-app": "MINIMAL",
  "@acme/tailwind-config": "MINIMAL",
  "@acme/design-tokens": "MINIMAL",
  scripts: "MINIMAL",

  // Apps: coverage not yet at STANDARD — will graduate as tests are added
  "@apps/prime": "MINIMAL",
  "@apps/handbag-configurator": "MINIMAL",
  "@apps/handbag-configurator-api": "MINIMAL",
  "@apps/cochlearfit": "MINIMAL",
  "@apps/product-pipeline": "MINIMAL",
  "@apps/xa": "MINIMAL",
  "@apps/xa-drop-worker": "MINIMAL",

  // Packages: coverage not yet at STANDARD — will graduate as tests are added
  "@acme/guides-core": "MINIMAL",
  "@acme/i18n": "MINIMAL",
  "@acme/pipeline-engine": "MINIMAL",
  "@acme/design-system": "MINIMAL",
};

/**
 * Get the coverage threshold for a package.
 *
 * @param {string} packageName - Package name (e.g., "@acme/stripe") or path
 * @returns {object} Coverage threshold object for Jest
 *
 * @example
 *   getTier("@acme/stripe")     // Returns TIERS.CRITICAL
 *   getTier("@acme/ui")         // Returns TIERS.STANDARD (default)
 *   getTier("@acme/types")      // Returns TIERS.MINIMAL
 */
function getTier(packageName) {
  const tierName = PACKAGE_TIERS[packageName] || "STANDARD";
  return TIERS[tierName];
}

/**
 * Get the tier name for a package (for logging/debugging).
 *
 * @param {string} packageName - Package name
 * @returns {string} Tier name ("CRITICAL", "STANDARD", or "MINIMAL")
 */
function getTierName(packageName) {
  return PACKAGE_TIERS[packageName] || "STANDARD";
}

/**
 * List all packages assigned to a specific tier.
 *
 * @param {"CRITICAL" | "STANDARD" | "MINIMAL"} tierName
 * @returns {string[]} Package names in that tier
 */
function getPackagesInTier(tierName) {
  return Object.entries(PACKAGE_TIERS)
    .filter(([, tier]) => tier === tierName)
    .map(([pkg]) => pkg);
}

/**
 * Validate that a package meets its assigned tier.
 * Used by check-coverage.sh to enforce the policy.
 *
 * @param {string} packageName
 * @param {object} actualCoverage - { lines, branches, functions, statements }
 * @returns {{ passed: boolean, tier: string, threshold: object, failures: string[] }}
 */
function validateCoverage(packageName, actualCoverage) {
  const tierName = getTierName(packageName);
  const threshold = TIERS[tierName].global;
  const failures = [];

  for (const metric of ["lines", "branches", "functions", "statements"]) {
    const actual = actualCoverage[metric] ?? 0;
    const required = threshold[metric] ?? 0;
    if (actual < required) {
      failures.push(`${metric}: ${actual.toFixed(1)}% < ${required}% required`);
    }
  }

  return {
    passed: failures.length === 0,
    tier: tierName,
    threshold,
    failures,
  };
}

module.exports = {
  TIERS,
  PACKAGE_TIERS,
  getTier,
  getTierName,
  getPackagesInTier,
  validateCoverage,
};
