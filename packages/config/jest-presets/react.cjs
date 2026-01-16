/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * React Jest preset for jsdom environment.
 *
 * Extends base preset and adds:
 * - jsdom test environment for DOM testing
 * - Complete moduleNameMapper with proper ordering
 * - React-specific setup files
 *
 * Module mapping order (critical for correct resolution):
 * 1. Mocks (test doubles for external dependencies)
 * 2. Workspace packages (@acme/*, @platform-core, etc.)
 * 3. ESM compatibility (.js → .ts mappings)
 * 4. React paths (ensure single React instance)
 * 5. Runtime (dynamic resolution like MSW interceptors)
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
 * Compose all module mappings in the correct order.
 *
 * Later mappings take precedence over earlier ones when converted to object.
 * We reverse the order during conversion so that priority matches the array order.
 */
function composeModuleNameMapper() {
  // Combine all mappings in priority order
  const allMappings = [
    ...mockMappings,
    ...workspaceMappings,
    ...esmCompatMappings,
    ...reactMappings,
    ...runtimeMappings,
  ];

  // Convert to object format
  // Note: If there are duplicate keys, later entries override earlier ones
  return arrayToObject(allMappings);
}

module.exports = {
  ...baseConfig,

  // Use jsdom for React component testing
  testEnvironment: "jsdom",

  // Compose module name mapper from all sources
  moduleNameMapper: composeModuleNameMapper(),

  // Setup files for React testing
  setupFilesAfterEnv: [
    path.join(__dirname, "../../..", "test/setupFetchPolyfill.ts"),
    path.join(__dirname, "../../..", "jest.setup.ts"),
  ],
};
