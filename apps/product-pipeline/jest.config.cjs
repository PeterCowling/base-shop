/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

const config = require("@acme/config/jest.preset.cjs")({
  moduleNameMapper: {
    "^@/(.*)$": [
      path.resolve(__dirname, "src/$1"),
      path.resolve(__dirname, "dist/$1"),
    ],
  },
});

config.collectCoverageFrom = [
  "src/lib/**/*.{ts,tsx}",
  "src/routes/**/*.{ts,tsx}",
  "src/app/api/**/*.{ts,tsx}",
  "!src/**/*.d.ts",
  "!src/**/?(*.)+(spec|test).{ts,tsx}",
  "!src/**/__tests__/**",
];

module.exports = config;
