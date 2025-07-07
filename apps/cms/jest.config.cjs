// apps/cms/jest.config.cjs
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const base = require("../../jest.config.cjs");

/** @type {import('jest').Config} */
module.exports = {
  // inherit everything first
  ...base,

  /** -----------------------------------------------------------------
   *  Keep <rootDir> = repository root so all “../../test/…” paths work
   * ----------------------------------------------------------------- */
  rootDir: path.resolve(__dirname, "../.."),

  /** -----------------------------------------------------------------
   *  Only collect tests that live in the CMS workspace
   * ----------------------------------------------------------------- */
  roots: ["<rootDir>/apps/cms/src", "<rootDir>/apps/cms/__tests__"],

  // (optional) leave base.testMatch in place,
  // or keep this if you want to be explicit:
  // testMatch: ["**/?(*.)+(spec|test).[tj]s?(x)"],
};
