import { RuleTester } from "eslint";

const rule = require("../src/rules/no-transition-all.ts").default as typeof import("../src/rules/no-transition-all").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-transition-all", rule, {
  valid: [
    { code: "<div className=\"transition-colors\" />" },
    { code: "<div className=\"transition-opacity\" />" },
    { code: "<div className=\"transition-transform\" />" },
    { code: "<div className={clsx('transition-colors', active && 'transition-shadow')} />" },
  ],
  invalid: [
    { code: "<div className=\"transition-all\" />", errors: [{ messageId: "noTransitionAll" }] },
    { code: "<div className=\"hover:transition-all\" />", errors: [{ messageId: "noTransitionAll" }] },
    { code: "<div className={clsx('transition-all', cond && 'opacity-50')} />", errors: [{ messageId: "noTransitionAll" }] },
  ],
});
