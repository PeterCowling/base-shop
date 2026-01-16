/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Coverage tier definitions for Jest configurations.
 *
 * Provides standardized coverage thresholds that packages can opt into
 * based on their maturity, criticality, and test investment.
 *
 * Usage:
 *   const { coverageTiers } = require("@acme/config/jest-presets");
 *   module.exports = {
 *     coverageThreshold: coverageTiers.strict,
 *   };
 */

module.exports = {
  /**
   * Strict tier (90/85/90) - For critical business logic and well-tested packages
   *
   * Use for:
   * - Payment processing logic
   * - Authentication/authorization
   * - Core domain models
   * - Data validation and sanitization
   */
  strict: {
    global: {
      lines: 90,
      branches: 85,
      functions: 90,
    },
  },

  /**
   * Standard tier (80/80/80) - Default for most packages
   *
   * Use for:
   * - UI components with logic
   * - API clients
   * - Utility libraries
   * - Service layer code
   */
  standard: {
    global: {
      lines: 80,
      branches: 80,
      functions: 80,
    },
  },

  /**
   * Moderate tier (60/60/60) - For packages with partial coverage
   *
   * Use for:
   * - Legacy code being brought under test
   * - Experimental features
   * - Presentation-heavy components
   */
  moderate: {
    global: {
      lines: 60,
      branches: 60,
      functions: 60,
    },
  },

  /**
   * Relaxed tier (40/30/30) - For low-risk or presentation-only code
   *
   * Use for:
   * - Pure presentation components
   * - Configuration files
   * - Simple adapters
   */
  relaxed: {
    global: {
      lines: 40,
      branches: 30,
      functions: 30,
    },
  },

  /**
   * Minimal tier (0/0/0) - No coverage enforcement
   *
   * Use for:
   * - Build scripts and tooling
   * - Packages that test compiled output instead of sources
   * - Temporary exemptions during migration
   */
  minimal: {
    global: {
      lines: 0,
      branches: 0,
      functions: 0,
    },
  },
};
