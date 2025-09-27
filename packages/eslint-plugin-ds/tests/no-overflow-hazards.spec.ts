import { RuleTester } from "eslint";

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const rule = require("../src/rules/no-overflow-hazards.ts").default as typeof import("../src/rules/no-overflow-hazards").default;

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-overflow-hazards", rule, {
  valid: [
    { code: "<div className=\"w-screen\" />", filename: "apps/app/src/app/layout.tsx" },
    // style with non-100vw is allowed by this heuristic
    { code: "<div style={{ width: '50vw' }} />" },
    // non-confident class parsing (spread) should not report
    { code: "const A=['w-screen']; <div className={clsx(...A)} />" },
  ],
  invalid: [
    {
      code: "<div className=\"w-screen overflow-visible\" />",
      errors: [{ message: /Avoid 'w-screen'/ }, { message: /Avoid 'overflow-visible'/ }],
    },
    {
      code: "<div style={{ width: '100vw' }} />",
      errors: [{ message: /Avoid style 'width: 100vw'/ }],
    },
    {
      code: "<div className=\"w-[100vw]\" />",
      errors: [{ message: /Avoid 'w-\[100vw\]'/ }],
    },
  ],
});
