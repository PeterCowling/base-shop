import { RuleTester } from "eslint";
const rule = require("../src/rules/no-arbitrary-tailwind.ts").default as typeof import("../src/rules/no-arbitrary-tailwind").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-arbitrary-tailwind", rule, {
  valid: [
    { code: "<div className=\"mt-2 text-base\" />" },
    { code: "<div className=\"bg-primary\" />" },
    // allowlist: url() permitted
    {
      code: "<div className=\"bg-[url(https://a/b.png)]\" />",
      options: [{ allowedFunctions: ["url"] }],
    },
    // allowlist: var() permitted
    {
      code: "<div className=\"text-[var(--token)]\" />",
      options: [{ allowedFunctions: ["var"] }],
    },
    // broken token without closing bracket should not report
    { code: "<div className=\"bg-[oops\" />" },
    // empty bracket content (end==start) should not report
    { code: "<div className=\"bg-[]\" />" },
  ],
  invalid: [
    { code: "<div className=\"mt-[13px]\" />", errors: [{ messageId: "noArbitrary" }] },
    { code: "<div className=\"text-[#ff0000]\" />", errors: [{ messageId: "noArbitrary" }] },
    { code: "<div className=\"w-[10px]\" />", errors: [{ messageId: "noArbitrary" }] },
    { code: "<div className=\"hover:w-[10px]\" />", errors: [{ messageId: "noArbitrary" }] },
    { code: "<div className=\"content-['hi']\" />", errors: [{ messageId: "noArbitrary" }] },
    // calc() not in allowlist → report
    { code: "<div className=\"bg-[calc(100%-4px)]\" />", errors: [{ messageId: "noArbitrary" }] },
  ],
});
