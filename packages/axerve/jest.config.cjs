/* eslint-disable @typescript-eslint/no-require-imports */
const createJestPreset = require("@acme/config/jest.preset.cjs");

const config = createJestPreset();
config.rootDir = __dirname;
config.roots = ["<rootDir>/src"];

module.exports = config;
