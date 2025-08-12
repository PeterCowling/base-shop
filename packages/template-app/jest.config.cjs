/* eslint-disable @typescript-eslint/no-var-requires */
const base = require("@acme/config/jest.preset.cjs");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  roots: [
    "<rootDir>/packages/template-app/src",
    "<rootDir>/packages/template-app/__tests__"
  ],
};
