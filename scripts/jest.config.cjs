/* eslint-disable @typescript-eslint/no-require-imports */
// Scripts workspace exercises compiled Node entrypoints under dist-scripts
// rather than TypeScript sources, so coverage would report 0%.
// Relax thresholds so test runs can succeed.
module.exports = require("@acme/config/jest.preset.cjs")({
  relaxCoverage: true,
});
