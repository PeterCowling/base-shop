// apps/cms/jest.config.js
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

  /* ─────────────── tell ts-jest which tsconfig to use (✨ NEW) ────────────── */
  globals: {
    "ts-jest": {
      // Absolute path so Jest finds it no matter where it’s run from
      tsconfig: path.resolve(__dirname, "tsconfig.test.json"),
      // You can still force CJS output here if you need it:
      useESM: false,
    },
  },

  /* ──────────────────────── universal ts-jest transform ──────────────────── */
  transform: {
    /**
     * Run every .ts, .tsx, .js and .jsx file through ts-jest,
     * forcing CommonJS output so `import …` becomes `require(…)`.
     */
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        useESM: false, // emit CJS
        // ⬆️ ts-jest now merges THIS with tsconfig.test.json
      },
    ],
  },

  /* ─────────────── still skip node_modules but allow ESM-only deps ────────── */
  transformIgnorePatterns: ["/node_modules/(?!(?:@?jose)/)"],
};
