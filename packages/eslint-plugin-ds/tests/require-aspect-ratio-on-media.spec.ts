import { RuleTester } from "eslint";

// ESLint@9 RuleTester uses structuredClone; polyfill for Node versions without it
(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const rule = require("../src/rules/require-aspect-ratio-on-media.ts").default as typeof import("../src/rules/require-aspect-ratio-on-media").default;

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("require-aspect-ratio-on-media", rule, {
  valid: [
    { code: "<img className=\"aspect-square\" />" },
    { code: "<video className={clsx('aspect-[16/9]')} />" },
    { code: "<iframe data-aspect=\"16/9\" />" },
    // Non-confident class value → do not report
    { code: "const C = 'aspect-square'; <img className={C} />" },
    // Non-media element should be ignored
    { code: "<div className=\"w-full h-auto\" />" },
  ],
  invalid: [
    {
      code: "<img className=\"w-full h-auto\" />",
      errors: [{ message: /Media element <img> should include an aspect/ }],
    },
    { code: "<video />", errors: [{ message: /Media element <video>/ }] },
    {
      code: "<iframe className={clsx('w-full')} />",
      errors: [{ message: /Media element <iframe>/ }],
    },
  ],
});

