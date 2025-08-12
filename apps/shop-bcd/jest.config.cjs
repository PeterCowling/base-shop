/* eslint-disable @typescript-eslint/no-var-requires */
const base = require("@acme/config/jest.preset.cjs");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  roots: [
    "<rootDir>/apps/shop-bcd/src",
    "<rootDir>/apps/shop-bcd/__tests__"
  ],
};
