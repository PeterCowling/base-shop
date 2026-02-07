import { RuleTester } from "eslint";

const rule = require("../src/rules/container-widths-only-at.ts").default as typeof import("../src/rules/container-widths-only-at").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("container-widths-only-at", rule, {
  valid: [
    { code: "<Section className=\"max-w-4xl\" />" },
    { code: "<Container className=\"max-w-screen-xl\" />" },
    { code: "<Overlay className=\"md:max-w-prose\" />" },
    { code: "<div className=\"p-4\" />" },
    { code: "<div className=\"max-w-3xl\" />", filename: "/infra/layout/Thing.tsx", options: [{ allowedPaths: ["/infra/"] }] },
    { code: "<Cover className=\"max-w-5xl\" />", options: [{ allowedComponents: ["Cover"] }] },
  ],
  invalid: [
    { code: "<div className=\"max-w-2xl\" />", errors: [{ messageId: "onlyInContainers" }] },
    { code: "<span className=\"md:max-w-[70ch]\" />", errors: [{ messageId: "onlyInContainers" }] },
  ],
});

