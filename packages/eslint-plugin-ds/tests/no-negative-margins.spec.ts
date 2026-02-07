import { RuleTester } from "eslint";

const rule = require("../src/rules/no-negative-margins.ts").default as typeof import("../src/rules/no-negative-margins").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-negative-margins", rule, {
  valid: [
    { code: "<div className=\"m-0 mt-2 mx-4\" />" },
    { code: "<div className=\"sm:mt-2 md:mx-6\" />" },
    // allowed class
    { code: "<div className=\"-mt-1\" />", options: [{ allowed: ["-mt-1"] }] },
    // allowed by path (builder infra)
    { code: "<div className=\"-mx-2\" />", filename: "/builder/infra/Component.tsx", options: [{ allowedPaths: ["/builder/infra/"] }] },
  ],
  invalid: [
    { code: "<div className=\"-m-2\" />", errors: [{ messageId: "noNegative" }] },
    { code: "<div className=\"md:-mx-4\" />", errors: [{ messageId: "noNegative" }] },
    { code: "<div className=\"-mt-[10px]\" />", errors: [{ messageId: "noNegative" }] },
  ],
});

