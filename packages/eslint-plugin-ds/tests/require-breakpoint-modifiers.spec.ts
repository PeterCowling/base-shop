import { RuleTester } from "eslint";
const rule = require("../src/rules/require-breakpoint-modifiers.ts").default as typeof import("../src/rules/require-breakpoint-modifiers").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("require-breakpoint-modifiers", rule, {
  valid: [
    // No @responsive tag -> no requirement
    { code: "export default function X(){ return <div className=\"flex gap-4\"/> }" },
    // @responsive with breakpoint on layout
    {
      code: "/** @responsive */\nexport default function X(){ return <div className=\"sm:flex gap-4\"/> }",
    },
    // Using clsx with breakpoint
    {
      code: "/** @responsive */\nconst X=()=> <div className={clsx('md:grid', { 'gap-4': true })} />;",
    },
    // Non-layout breakpoint alone is not sufficient (checked in invalid cases)
  ],
  invalid: [
    {
      code: "/** @responsive */\nexport default function X(){ return <div className=\"flex gap-4\"/> }",
      errors: [{ messageId: "addBreakpoint" }],
    },
    // Only non-layout classes → still requires a layout class with breakpoint
    {
      code: "/** @responsive */\nconst X=()=> <div className=\"text-sm text-fg\" />;",
      errors: [{ messageId: "addBreakpoint" }],
    },
    // Dynamic non-confident parsing: do not satisfy requirement
    {
      code: "/** @responsive */\nconst cls = ['flex']; const X=()=> <div className={clsx(...cls)} />;",
      errors: [{ messageId: "addBreakpoint" }],
    },
  ],
});
