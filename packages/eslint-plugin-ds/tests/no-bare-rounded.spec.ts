import { RuleTester } from "eslint";

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const rule = require("../src/rules/no-bare-rounded.ts")
  .default as typeof import("../src/rules/no-bare-rounded").default;

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-bare-rounded", rule, {
  valid: [
    // TC-01-01: rounded-lg is permitted
    { code: '<div className="rounded-lg" />' },
    // TC-01-02: rounded-full is permitted
    { code: '<div className="rounded-full" />' },
    // Other rounded-* variants are not flagged by this rule
    { code: '<div className="rounded-md" />' },
    { code: '<div className="rounded-sm" />' },
    { code: '<div className="rounded-xl" />' },
    // Non-className attributes are ignored
    { code: '<div id="rounded" />' },
    // Dynamic expressions that cannot be confidently parsed are skipped
    { code: "<div className={someVar} />" },
  ],
  invalid: [
    // TC-01-03: bare rounded is flagged
    {
      code: '<div className="rounded" />',
      errors: [{ messageId: "noBareRounded" }],
      output: '<div className="rounded-lg" />',
    },
    // TC-01-04: variant-prefixed bare rounded is flagged
    {
      code: '<div className="hover:rounded" />',
      errors: [{ messageId: "noBareRounded" }],
      output: '<div className="hover:rounded-lg" />',
    },
    // Important modifier
    {
      code: '<div className="!rounded" />',
      errors: [{ messageId: "noBareRounded" }],
      output: '<div className="!rounded-lg" />',
    },
    // bare rounded mixed with other classes — only rounded is replaced
    {
      code: '<div className="border rounded px-2" />',
      errors: [{ messageId: "noBareRounded" }],
      output: '<div className="border rounded-lg px-2" />',
    },
  ],
});
