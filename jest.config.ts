// jest.config.ts
import type { Config } from "jest";
import { pathsToModuleNameMapper } from "ts-jest";
import { compilerOptions } from "./tsconfig.base.json" assert { type: "json" };

const config: Config = {
  // ─────────────────────────── presets & env
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "jsdom",

  // ─────────────────────────── setup
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // ─────────────────────────── path alias ↔ Jest mapper
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/",
  }),

  // ─────────────────────────── globs
  testMatch: ["**/__tests__/**/*.(test|spec).[jt]s?(x)"],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules",
    "<rootDir>/.next",
    "<rootDir>/dist",
  ],
};

export default config;
