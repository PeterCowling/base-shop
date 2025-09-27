import { RuleTester } from "eslint";
const rule = require("../src/rules/no-raw-zindex.ts").default as typeof import("../src/rules/no-raw-zindex").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-raw-zindex", rule, {
  valid: [
    { code: "<div className=\"z-10\" />" },
    { code: "<div className=\"z-0\" />" },
    { code: "<div className=\"z-[var(--layer)]\" />" },
  ],
  invalid: [
    { code: "<div className=\"z-[9999]\" />", errors: [{ messageId: "noRawZ" }] },
    { code: "<div className=\"z-[-1]\" />", errors: [{ messageId: "noRawZ" }] },
  ],
});
