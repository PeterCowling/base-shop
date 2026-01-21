/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

// Cochlearfit app needs custom @/ alias mapping
// Override both @/components and @/ to use cochlearfit's own src, not cms
const config = require("@acme/config/jest.preset.cjs")({
  moduleNameMapper: {
    "^@/components/atoms/shadcn$": path.resolve(__dirname, "../../test/__mocks__/shadcnDialogStub.tsx"),
    "^@/components/(.*)$": path.resolve(__dirname, "src/components/$1"),
    "^@/(.*)$": [
      path.resolve(__dirname, "src/$1"),
      path.resolve(__dirname, "dist/$1"),
    ],
  },
});

// Override coverage collection for Cochlearfit-specific paths
config.collectCoverageFrom = [
  "src/**/*.{ts,tsx}",
  "!src/**/*.d.ts",
];

module.exports = config;
