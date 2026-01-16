// /jest.config.cjs   ← keep this exact filename
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Monorepo-wide Jest configuration.
 *
 * This configuration serves as the default for packages that don't have their
 * own jest.config.cjs. It uses the hybrid preset from @acme/config with default
 * options.
 *
 * For packages with special requirements, create a local jest.config.cjs that
 * calls the preset with appropriate options:
 *
 *   // packages/lib/jest.config.cjs
 *   module.exports = require("@acme/config/jest.preset.cjs")({
 *     useCjs: true,  // Force CommonJS preset
 *   });
 *
 * Available options:
 *   - useCjs: Force CommonJS preset (no ESM)
 *   - relaxCoverage: Set coverage thresholds to 0%
 *   - skipEnvMocks: Don't mock @acme/config/env modules
 *   - useRealEnvLoaders: Use real env loaders instead of test mocks
 *   - moduleNameMapper: Additional module name mappings
 *   - coveragePathIgnorePatterns: Additional patterns to ignore
 *   - coverageThreshold: Override coverage thresholds
 */

const createJestPreset = require("./packages/config/jest.preset.cjs");

module.exports = createJestPreset();
