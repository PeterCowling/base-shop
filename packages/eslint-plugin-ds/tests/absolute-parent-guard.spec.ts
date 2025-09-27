import { RuleTester } from "eslint";

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const rule = require("../src/rules/absolute-parent-guard.ts").default as typeof import("../src/rules/absolute-parent-guard").default;

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("absolute-parent-guard", rule, {
  valid: [
    { code: "<div className=\"relative\"><div className=\"absolute\" /></div>" },
    { code: "<div className=\"sticky\"><div className=\"absolute\" /></div>" },
    { code: "<div class=\"relative\"><div className=\"fixed\" /></div>" },
  ],
  invalid: [
    { code: "<div className=\"absolute\" />", errors: [{ message: /positioned ancestor/ }] },
  ],
});
