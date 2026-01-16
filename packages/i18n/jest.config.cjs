/* eslint-disable @typescript-eslint/no-require-imports */
// Force CommonJS preset for i18n package
module.exports = require("@acme/config/jest.preset.cjs")({
  useCjs: true,
});
