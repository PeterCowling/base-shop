import { RuleTester } from "eslint";

const rule = require("../src/rules/no-raw-typography.ts").default as typeof import("../src/rules/no-raw-typography").default;

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

tester.run("no-raw-typography", rule, {
  valid: [
    { code: "<p className=\"text-base leading-normal tracking-wide\" />" },
    { code: "<p className=\"text-xl\" />" },
    { code: "<p className={clsx(foo && 'text-sm')} />" },
    { code: "<p className={cn('tracking-tight', cond && 'leading-normal')} />" },
  ],
  invalid: [
    // Fixable: text size px and rem
    {
      code: "<p className=\"text-[16px]\" />",
      output: "<p className=\"text-base\" />",
      errors: [{ messageId: "noRawTypography" }],
    },
    {
      code: "<p className=\"text-[1.25rem]\" />",
      output: "<p className=\"text-xl\" />",
      errors: [{ messageId: "noRawTypography" }],
    },
    // Fixable leading and tracking
    {
      code: "<p className=\"leading-[1.5]\" />",
      output: "<p className=\"leading-normal\" />",
      errors: [{ messageId: "noRawTypography" }],
    },
    {
      code: "<p className=\"tracking-[0.025em]\" />",
      output: "<p className=\"tracking-wide\" />",
      errors: [{ messageId: "noRawTypography" }],
    },
    // Not fixable: slightly off values still flagged
    {
      code: "<p className=\"tracking-[0.02em]\" />",
      errors: [{ messageId: "noRawTypography" }],
    },
    {
      code: "<p className=\"text-[15px]\" />",
      errors: [{ messageId: "noRawTypography" }],
    },
  ],
});

