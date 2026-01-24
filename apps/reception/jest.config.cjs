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

module.exports = config;
