/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

// Skylar app needs custom @/ alias mapping and specific coverage config
const config = require("@acme/config/jest.preset.cjs")({
  moduleNameMapper: {
    "^@/(.*)$": [
      path.resolve(__dirname, "src/$1"),
      path.resolve(__dirname, "dist/$1"),
    ],
  },
});

// Override coverage collection for Skylar-specific paths
config.collectCoverageFrom = [
  "src/lib/**/*.{ts,tsx}",
  "src/app/[lang]/generateStaticParams.ts",
];

module.exports = config;
