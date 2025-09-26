import { RuleTester } from "eslint";
const rule = require("../src/rules/no-raw-radius.ts").default as typeof import("../src/rules/no-raw-radius").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-raw-radius", rule, {
  valid: [
    { code: "<div className=\"rounded-md\" />" },
    { code: "<div className=\"rounded-tl-lg\" />" },
    { code: "<div className={clsx('rounded-sm', cond && 'rounded-md')} />" },
    { code: "<div className=\"rounded-[var(--radius-sm)]\" />" },
  ],
  invalid: [
    { code: "<div className=\"rounded-[6px]\" />", errors: [{ messageId: "noRawRadius" }] },
    { code: "<div className=\"rounded-tl-[3px]\" />", errors: [{ messageId: "noRawRadius" }] },
    { code: "<div className=\"rounded-br-[12px]\" />", errors: [{ messageId: "noRawRadius" }] },
  ],
});

