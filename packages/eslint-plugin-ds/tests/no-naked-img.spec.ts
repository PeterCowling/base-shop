import { RuleTester } from "eslint";

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const rule = require("../src/rules/no-naked-img.ts").default as typeof import("../src/rules/no-naked-img").default;

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-naked-img", rule, {
  valid: [
    { code: "<svg><foreignObject><img /></foreignObject></svg>" },
    { code: "<img />", filename: "content/page.mdx" },
  ],
  invalid: [
    { code: "<img />", errors: [{ message: /Use the DS image component/ }] },
  ],
});

