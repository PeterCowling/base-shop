import { RuleTester } from "eslint";

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const rule = require("../src/rules/no-unsafe-viewport-units.ts").default as typeof import("../src/rules/no-unsafe-viewport-units").default;

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-unsafe-viewport-units", rule, {
  valid: [
    { code: "<div className=\"h-[100svh]\" />" },
    { code: "<div style={{ height: '100dvh' }} />" },
  ],
  invalid: [
    { code: "<div className=\"h-screen\" />", errors: [{ message: /Avoid vh\/vw/ }] },
    { code: "<div className=\"w-[100vw]\" />", errors: [{ message: /Avoid vh\/vw/ }] },
    { code: "<div style={{ height: '100vh' }} />", errors: [{ message: /Avoid vh\/vw/ }] },
  ],
});

