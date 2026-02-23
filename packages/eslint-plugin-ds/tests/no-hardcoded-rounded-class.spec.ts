import { RuleTester } from "eslint";

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const rule = require("../src/rules/no-hardcoded-rounded-class.ts")
  .default as typeof import("../src/rules/no-hardcoded-rounded-class").default;

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-hardcoded-rounded-class", rule, {
  valid: [
    {
      code: "<div className={shapeRadiusClass} />",
    },
    {
      code: "<div className=\"rounded-[inherit]\" />",
    },
    {
      code: "<input className=\"file:rounded-md\" />",
    },
    {
      code: "<div className=\"rounded-[var(--radius-md)]\" />",
    },
  ],
  invalid: [
    {
      code: "<div className=\"rounded-md\" />",
      errors: [{ message: /Avoid hardcoded radius class 'rounded-md'/ }],
    },
    {
      code: "<div className=\"hover:rounded-lg\" />",
      errors: [{ message: /Avoid hardcoded radius class 'hover:rounded-lg'/ }],
    },
    {
      code: "<div className=\"!rounded-full\" />",
      errors: [{ message: /Avoid hardcoded radius class '!rounded-full'/ }],
    },
  ],
});
