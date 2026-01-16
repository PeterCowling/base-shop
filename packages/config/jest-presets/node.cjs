/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Node Jest preset for Node.js environment.
 *
 * Extends base preset and adds:
 * - Node test environment (no DOM APIs)
 * - Simpler moduleNameMapper (no React paths needed)
 *
 * Module mapping order:
 * 1. Mocks (test doubles for external dependencies)
 * 2. Workspace packages (@acme/*, @platform-core, etc.)
 * 3. ESM compatibility (.js → .ts mappings)
 * 4. Runtime (dynamic resolution like MSW interceptors)
 */

const baseConfig = require("./base.cjs");
const path = require("path");

// Import module mappings
const mockMappings = require("./modules/mocks.cjs");
const workspaceMappings = require("./modules/workspace.cjs");
const esmCompatMappings = require("./modules/esm-compat.cjs");
const reactMappings = require("./modules/react.cjs");
const runtimeMappings = require("./modules/runtime.cjs");

/**
 * Convert array-based mappings to object format for Jest.
 *
 * Input: [[pattern, replacement], ...]
 * Output: { pattern: replacement, ... }
 */
function arrayToObject(mappings) {
  return Object.fromEntries(mappings);
}

/**
 * Compose module mappings for Node environment.
 *
 * NOTE: Includes React paths even though this is a Node environment because
 * jest.setup.ts (shared by all environments) imports React-related modules.
 * This matches the behavior of the root jest.config.cjs which includes React
 * paths for all test environments.
 */
function composeModuleNameMapper() {
  const allMappings = [
    ...mockMappings,
    ...workspaceMappings,
    ...esmCompatMappings,
    ...reactMappings,
    ...runtimeMappings,
  ];

  return arrayToObject(allMappings);
}

module.exports = {
  ...baseConfig,

  // Use Node environment (no DOM)
  testEnvironment: "node",

  // Compose module name mapper (no React paths)
  moduleNameMapper: composeModuleNameMapper(),

  // Setup files for Node testing
  setupFilesAfterEnv: [
    path.join(__dirname, "../../..", "test/setupFetchPolyfill.ts"),
    path.join(__dirname, "../../..", "jest.setup.ts"),
  ],
};
