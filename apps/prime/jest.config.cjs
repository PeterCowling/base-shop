/* eslint-disable @typescript-eslint/no-require-imports */
const createJestPreset = require("@acme/config/jest.preset.cjs");

module.exports = {
  ...createJestPreset({ useCjs: true }),
  roots: ["<rootDir>/src", "<rootDir>/functions"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    ...createJestPreset({ useCjs: true }).moduleNameMapper,
    "^@acme/design-system$": "<rootDir>/../../packages/design-system/src/index.ts",
    "^@acme/design-system/(.*)$": "<rootDir>/../../packages/design-system/src/$1",
    "^next/link$": "<rootDir>/../../test/__mocks__/next-link.tsx",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
