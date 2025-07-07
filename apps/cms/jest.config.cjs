// apps/cms/jest.config.js
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const base = require("../../jest.config.cjs");

/** @type {import('jest').Config} */
module.exports = {
  /* ─────────────── inherit repo‑wide defaults ─────────────── */
  ...base,

  /* ─────────── keep rootDir at monorepo root ─────────── */
  rootDir: path.resolve(__dirname, "../.."),

  /* ─────────── collect only CMS sources & tests ─────────── */
  roots: ["<rootDir>/apps/cms/src", "<rootDir>/apps/cms/__tests__"],

  /* ─────────── run polyfills **before** any test code ─────────── */
  setupFilesAfterEnv: ["<rootDir>/apps/cms/jest.setup.tsx"],

  /* ─────────── ts‑jest configuration ─────────── */
  globals: {
    "ts-jest": {
      tsconfig: path.resolve(__dirname, "tsconfig.test.json"),
      useESM: false,
    },
  },

  /* ─────────── transform every TS/JS file with ts‑jest ─────────── */
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      { useESM: false }, // emit CommonJS
    ],
  },

  /* ─────────── still skip node_modules but allow ESM‑only deps ─────────── */
  transformIgnorePatterns: ["/node_modules/(?!(?:@?jose)/)"],
};
