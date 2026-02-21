/* eslint-disable @typescript-eslint/no-require-imports */

const base = require("@acme/config/jest.preset.cjs")();

/** @type {import("jest").Config} */
module.exports = {
  ...base,
  testEnvironment: "node",
  roots: ["<rootDir>/src/__tests__"],
};
