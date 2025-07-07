/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const base = require("../../jest.config.cjs");

/** @type {import('jest').Config} */
module.exports = {
  /* ───────────────────────── inherit repo-wide defaults ───────────────────── */
  ...base,

  /* ───────────────────────── keep rootDir at monorepo root ────────────────── */
  rootDir: path.resolve(__dirname, "../.."),

  /* ───────────────── collect only CMS sources & unit-tests ────────────────── */
  roots: ["<rootDir>/apps/cms/src", "<rootDir>/apps/cms/__tests__"],

  /* ──────────────────────── key addition: transform rule ──────────────────── */
  transform: {
    /**
     * Run *every* .ts, .tsx, .js and .jsx file in the workspace through
     * ts-jest, forcing CommonJS output so `import …` becomes `require(…)`.
     */
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        useESM: false, // emit CJS
        tsconfig: {
          module: "CommonJS",
          allowJs: true, // transpile .js sources too
        },
      },
    ],
  },

  /* ─────────────── still skip node_modules but allow ESM-only deps ────────── */
  transformIgnorePatterns: ["/node_modules/(?!(?:@?jose)/)"],
};
