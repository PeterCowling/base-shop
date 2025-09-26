import { RuleTester } from "eslint";
const rule = require("../src/rules/no-physical-direction-classes-in-rtl.ts").default as typeof import("../src/rules/no-physical-direction-classes-in-rtl").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-physical-direction-classes-in-rtl", rule, {
  valid: [
    { code: "<div className=\"ms-2 me-3\" />" },
    { code: "<div className=\"text-start\" />" },
  ],
  invalid: [
    {
      code: "<div className=\"ml-2\" />",
      output: "<div className=\"ms-2\" />",
      errors: [{ messageId: "replaceLogical" }],
    },
    {
      code: "<div className=\"mr-2 md:ml-4\" />",
      output: "<div className=\"me-2 md:ms-4\" />",
      errors: [{ messageId: "replaceLogical" }, { messageId: "replaceLogical" }],
    },
    {
      code: "<div className=\"text-left\" />",
      output: "<div className=\"text-start\" />",
      errors: [{ messageId: "replaceLogical" }],
    },
    {
      code: "<div className=\"left-0\" />",
      errors: [{ messageId: "avoidPhysical" }],
    },
    {
      code: "<div className={clsx('ml-2')} />",
      errors: [{ messageId: "replaceLogical" }],
    },
  ],
});
