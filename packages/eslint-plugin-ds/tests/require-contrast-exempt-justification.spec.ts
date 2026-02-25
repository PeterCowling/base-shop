import { RuleTester } from "eslint";

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const rule = require("../src/rules/require-contrast-exempt-justification.ts")
  .default as typeof import("../src/rules/require-contrast-exempt-justification").default;

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("require-contrast-exempt-justification", rule, {
  valid: [
    {
      code: "<div data-ds-contrast-exempt aria-hidden className=\"bg-primary\" />",
    },
    {
      code: "<div data-ds-contrast-exempt={true} aria-hidden={true} className=\"bg-primary\" />",
    },
    {
      code: "<div data-ds-contrast-exempt={false} className=\"bg-primary\" />",
    },
    {
      code: "<div className=\"bg-primary\" />",
    },
    {
      code: "<div data-ds-contrast-exempt aria-hidden><span aria-hidden=\"true\" className=\"bg-primary\" /></div>",
    },
  ],
  invalid: [
    {
      code: "<div data-ds-contrast-exempt className=\"bg-primary\" />",
      errors: [{ message: /aria-hidden=\{true\}/ }],
    },
    {
      code: "<div data-ds-contrast-exempt aria-hidden={false} className=\"bg-primary\" />",
      errors: [{ message: /aria-hidden=\{true\}/ }],
    },
    {
      code: "<div data-ds-contrast-exempt aria-hidden>Visible label</div>",
      errors: [{ message: /must not render visible text/i }],
    },
    {
      code: "<div data-ds-contrast-exempt={true} aria-hidden={\"false\"} className=\"bg-primary\" />",
      errors: [{ message: /aria-hidden=\{true\}/ }],
    },
  ],
});
