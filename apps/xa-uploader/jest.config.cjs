/* eslint-disable @typescript-eslint/no-var-requires */
const base = require("@acme/config/jest.preset.cjs")();

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
};
