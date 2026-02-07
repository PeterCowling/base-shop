import { RuleTester } from "eslint";

const rule = require("../src/rules/forbid-fixed-heights-on-text.ts").default as typeof import("../src/rules/forbid-fixed-heights-on-text").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("forbid-fixed-heights-on-text", rule, {
  valid: [
    { code: "<h1 className=\"text-2xl\" />" },
    { code: "<p className=\"line-clamp-2 h-12\" />" }, // allowed when clamped
    { code: "<h2 style={{ width: '2rem' }} />" },
    { code: "<div className=\"h-10\" />" }, // non-text element is ignored
  ],
  invalid: [
    {
      code: "<h1 className=\"h-12\" />",
      errors: [{ messageId: "noFixedHeightClass" }],
    },
    {
      code: "<p className=\"text-sm\" style={{ height: '2rem' }} />",
      errors: [{ messageId: "noFixedHeightStyle" }],
    },
    {
      code: "<h3 className={clsx('font-bold', ['h-[48px]'])} />",
      errors: [{ messageId: "noFixedHeightClass" }],
    },
  ],
});

