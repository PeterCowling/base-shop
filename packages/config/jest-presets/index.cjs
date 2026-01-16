/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Jest presets entry point.
 *
 * Re-exports all preset configurations for easy consumption:
 * - base: Core transform and coverage settings
 * - react: jsdom environment with full module mapping
 * - node: Node environment with simpler module mapping
 * - coverageTiers: Standard coverage threshold definitions
 */

module.exports = {
  base: require("./base.cjs"),
  react: require("./react.cjs"),
  node: require("./node.cjs"),
  coverageTiers: require("./coverage-tiers.cjs"),
};
