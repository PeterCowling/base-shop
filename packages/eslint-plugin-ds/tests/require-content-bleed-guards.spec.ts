import { RuleTester } from "eslint";

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const rule = require("../src/rules/require-content-bleed-guards.ts")
  .default as typeof import("../src/rules/require-content-bleed-guards").default;

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("require-content-bleed-guards", rule, {
  valid: [
    {
      code: "<td className=\"px-4 break-words\">Value</td>",
    },
    {
      code: "<th className=\"font-semibold truncate\">Header</th>",
    },
    {
      code: "<button className=\"flex min-w-0 cursor-default select-none break-words text-sm\">Item</button>",
    },
  ],
  invalid: [
    {
      code: "<td className=\"px-4\">Value</td>",
      errors: [{ message: /Add a content-bleed guard class/ }],
    },
    {
      code: "<button className=\"flex cursor-default select-none break-words text-sm\">Item</button>",
      errors: [{ message: /must include 'min-w-0'/ }],
    },
    {
      code: "<button className=\"flex min-w-0 cursor-default select-none text-sm\">Item</button>",
      errors: [{ message: /Add a content-bleed guard class/ }],
    },
  ],
});
