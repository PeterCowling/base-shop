import { RuleTester } from "eslint";
const rule = require("../src/rules/no-raw-spacing.ts").default as typeof import("../src/rules/no-raw-spacing").default;

// Polyfills and parser setup
(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-raw-spacing", rule, {
  valid: [
    { code: "<div className=\"mt-2 px-3\" />" },
    { code: "<div className=\"ms-1 me-2\" />" },
    { code: "<div className=\"-mt-2\" />" },
    { code: "<div style={{ margin: 'var(--space-2)' }} />" },
    { code: "<div style={{ paddingInlineStart: 'var(--space-1)' }} />" },
    // Dynamic className we can't confidently parse
    { code: "<div className={clsx(foo && 'mt-2')} />" },
  ],
  invalid: [
    {
      code: "<div className=\"mt-[13px]\" />",
      errors: [{ messageId: "noRawArbitrary" }],
    },
    {
      code: "<div className=\"px-[2.5rem]\" />",
      errors: [{ messageId: "noRawArbitrary" }],
    },
    {
      code: "<div className=\"-mt-[4px]\" />",
      errors: [{ messageId: "noRawArbitrary" }],
    },
    {
      code: "<div style={{ margin: '13px' }} />",
      errors: [{ messageId: "noRawStyle" }],
    },
    {
      code: "<div style={{ marginTop: '2.5rem' }} />",
      errors: [{ messageId: "noRawStyle" }],
    },
    {
      code: "<div style={{ paddingInlineEnd: 10 }} />",
      errors: [{ messageId: "noRawStyle" }],
    },
  ],
});

