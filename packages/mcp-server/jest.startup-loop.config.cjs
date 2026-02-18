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
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "mjs", "node"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@acme/lib$": "<rootDir>/../../packages/lib/src/index.ts",
    "^@acme/lib/(.*)$": "<rootDir>/../../packages/lib/src/$1",
    "^@acme/zod-utils/zodErrorMap$": "<rootDir>/../../packages/zod-utils/src/zodErrorMap.ts",
    "^@acme/zod-utils/(.*)$": "<rootDir>/../../packages/zod-utils/src/$1",
    "^@acme/zod-utils$": "<rootDir>/../../packages/zod-utils/src/index.ts",
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
  testMatch: [
    "<rootDir>/src/__tests__/startup-loop-*.test.ts",
    "<rootDir>/src/__tests__/startup-loop-tools.integration.test.ts",
  ],
  passWithNoTests: false,
};
