import { RuleTester } from "eslint";

const rule = require("../src/rules/no-raw-shadow.ts").default as typeof import("../src/rules/no-raw-shadow").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-raw-shadow", rule, {
  valid: [
    { code: "<div className=\"shadow-md\" />" },
    { code: "<div className=\"shadow-[var(--shadow-sm)]\" />" },
  ],
  invalid: [
    { code: "<div className=\"shadow-[0_0_10px_black]\" />", errors: [{ messageId: "noRawShadow" }] },
    { code: "<div className=\"shadow-[inset_0_0_5px_#000]\" />", errors: [{ messageId: "noRawShadow" }] },
  ],
});

