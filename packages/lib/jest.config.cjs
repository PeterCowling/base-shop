/* eslint-disable @typescript-eslint/no-require-imports */
// Force CommonJS preset for lib package
module.exports = require("@acme/config/jest.preset.cjs")({
  useCjs: true,
});
