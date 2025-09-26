import { RuleTester } from "eslint";
const rule = require("../src/rules/enforce-layout-primitives.ts").default as typeof import("../src/rules/enforce-layout-primitives").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("enforce-layout-primitives", rule, {
  valid: [
    // Non-leaf with flex is allowed
    { code: "<div className=\"flex\"><span/></div>" },
    // Narrow inline-flex without gap/wrap allowed
    { code: "<button className=\"inline-flex items-center\" />" },
    // Allowed component name
    { code: "<Stack className=\"flex\" />" },
    // Allowed by path
    { code: "<div className=\"grid\" />", filename: "/infra/layout/Thing.tsx", options: [{ allowedPaths: ["/infra/"] }] },
  ],
  invalid: [
    { code: "<div className=\"flex\" />", errors: [{ messageId: "noLeafLayout" }] },
    { code: "<div className=\"grid\" />", errors: [{ messageId: "noLeafLayout" }] },
    // inline-flex with gap disallowed on leaf
    { code: "<div className=\"inline-flex gap-1\" />", errors: [{ messageId: "noLeafLayout" }] },
  ],
});

