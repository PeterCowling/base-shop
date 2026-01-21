import { RuleTester } from "eslint";

const rule = require("../src/rules/no-margins-on-atoms.ts").default as typeof import("../src/rules/no-margins-on-atoms").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-margins-on-atoms", rule as any, {
  valid: [
    // Non-atom file: allowed
    { code: "<div className=\"mt-2\" />", filename: "/src/components/molecules/Card.tsx" },
    // Atom path but allowed token
    { code: "<div className=\"mt-1\" />", filename: "/packages/ui/src/components/atoms/Button.tsx", options: [{ allowed: ["mt-1"] }] },
    // Allow style prop by config
    { code: "<div style={{ marginTop: 0 }} />", filename: "/packages/ui/src/components/atoms/Badge.tsx", options: [{ allowedProps: ["marginTop"] }] },
    // Allowed by tag on non-atom path
    { code: "/* @layer atom */\nexport const A = () => <div className=\"p-2\" />;", filename: "/src/components/Random.tsx" },
  ],
  invalid: [
    {
      code: "<div className=\"mt-2\" />",
      filename: "/packages/ui/src/components/atoms/Badge.tsx",
      errors: [{ messageId: "noMarginClass" }],
    },
    {
      code: "<div className=\"sm:-mx-4\" />",
      filename: "/packages/ui/src/components/atoms/Item.tsx",
      errors: [{ messageId: "noMarginClass" }],
    },
    {
      code: "<div style={{ marginInlineStart: '1rem' }} />",
      filename: "/packages/ui/src/components/atoms/Item.tsx",
      errors: [{ messageId: "noMarginStyle" }],
    },
    {
      code: "/* @layer atom */\nexport const A = () => <div className=\"mx-auto\" />;",
      filename: "/src/components/Random.tsx",
      errors: [{ messageId: "noMarginClass" }],
    },
  ],
});

