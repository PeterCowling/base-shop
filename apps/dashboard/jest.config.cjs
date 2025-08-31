/* eslint-disable @typescript-eslint/no-var-requires */
const base = require("@acme/config/jest.preset.cjs");
const { "^@/(.*)$": _unused, ...baseModuleNameMapper } = base.moduleNameMapper;

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  roots: ["<rootDir>/apps/dashboard/src", "<rootDir>/apps/dashboard/__tests__"],
  moduleNameMapper: {
    ...baseModuleNameMapper,
    "^@/(.*)$": "<rootDir>/apps/dashboard/src/$1",
    "^entities/decode$": "<rootDir>/node_modules/entities/lib/decode.js",
  },
};
