/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

const phaseTwoCoverageThreshold = {
  global: {
    lines: 10,
    branches: 5,
    functions: 10,
    statements: 10,
  },
};

const config = require("@acme/config/jest.preset.cjs")({
  coverageThreshold: phaseTwoCoverageThreshold,
  moduleNameMapper: {
    "^@/components/BrandMark/BrandMark$": [
      path.resolve(__dirname, "src/components/BrandMark/BrandMark.tsx"),
      path.resolve(__dirname, "dist/components/BrandMark/BrandMark.js"),
    ],
  },
});

const originalMapper = config.moduleNameMapper;
const reorderedMapper = {};

for (const [key, value] of Object.entries(originalMapper)) {
  if (key === "^@/components/(.*)$") continue;
  if (key === "^@/(.*)$") continue;
  reorderedMapper[key] = value;
}

reorderedMapper["^@/components/(.*)$"] = [
  path.resolve(__dirname, "src/components/$1"),
  path.resolve(__dirname, "dist/components/$1"),
];
reorderedMapper["^@/(.*)$"] = [
  path.resolve(__dirname, "src/$1"),
  path.resolve(__dirname, "dist/$1"),
];

config.moduleNameMapper = reorderedMapper;
config.rootDir = __dirname;
config.roots = ["<rootDir>/src"];

config.testPathIgnorePatterns = [
  ...(config.testPathIgnorePatterns || []),
  "/apps/caryina/e2e/",
];

module.exports = config;
