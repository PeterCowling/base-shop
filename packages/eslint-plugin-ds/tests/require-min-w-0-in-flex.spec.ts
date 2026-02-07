import { RuleTester } from "eslint";

const rule = require("../src/rules/require-min-w-0-in-flex.ts").default as typeof import("../src/rules/require-min-w-0-in-flex").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("require-min-w-0-in-flex", rule, {
  valid: [
    { code: "<div className=\"flex flex-row flex-1 truncate min-w-0\" />" },
    { code: "<div className=\"flex flex-col flex-1 truncate\" />" }, // not flex-row
    { code: "<div className=\"flex flex-row grow\" />" }, // no risk
  ],
  invalid: [
    {
      code: "<div className=\"flex flex-row flex-1 truncate\" />",
      output: "<div className=\"flex flex-row flex-1 truncate min-w-0\" />",
      errors: [{ messageId: "requireMinW" }],
    },
    {
      code: "<div className=\"md:flex-row flex flex-1 whitespace-nowrap\" />",
      // cannot safely autofix non-literal or complex? This is still literal, so we append
      output: "<div className=\"md:flex-row flex flex-1 whitespace-nowrap min-w-0\" />",
      errors: [{ messageId: "requireMinW" }],
    },
  ],
});

