/* eslint-disable @typescript-eslint/no-require-imports -- PLAT-0001 CJS Jest config requires require() */

const path = require("path");

module.exports = {
  rootDir: path.resolve(__dirname),
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          module: "CommonJS",
          moduleResolution: "node",
          target: "ES2022",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          resolveJsonModule: true,
        },
        useESM: false,
        diagnostics: false,
        babelConfig: false,
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  modulePathIgnorePatterns: [
    "<rootDir>/dist/",
    "<rootDir>/.turbo/",
    "<rootDir>/.ts-jest/",
    "/\\.open-next/",
    "/\\.wrangler/",
    "/\\.worktrees/",
  ],
  setupFiles: ["dotenv/config"],
  testMatch: ["<rootDir>/src/__tests__/startup-loop-tools.integration.test.ts"],
  passWithNoTests: false,
};
