import { RuleTester } from "eslint";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - use CJS require to avoid ESM transform edge cases
const rule = require("../../src/rules/no-hsl-var-in-tests.ts").default as typeof import("../../src/rules/no-hsl-var-in-tests").default;

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-hsl-var-in-tests", rule, {
  valid: [
    { code: "const ok = 'hsl(210 10% 50%)';" },
    { code: "const ok = `hsl(210 10% 50% / .5)`;" },
    { code: "<div data-x='hsl(210 10% 50%)' />", languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
    // non-string literal path
    { code: "const n = 1;" },
    // JSXAttribute with no value path
    { code: "<div data-x />", languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
  ],
  invalid: [
    {
      code: "const bad = 'hsl(var(--color-primary))';",
      errors: [{ messageId: "noHslVarInTests" }],
    },
    {
      code: "const bad = `hsl(var(--token) / .5)`;",
      errors: [{ messageId: "noHslVarInTests" }],
    },
    {
      code: "<div data-x='hsl(var(--x))' />",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      errors: [{ messageId: "noHslVarInTests" }, { messageId: "noHslVarInTests" }],
    },
    {
      code: "<div data-x=\"hsl(var(--y))\" />",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      errors: [{ messageId: "noHslVarInTests" }, { messageId: "noHslVarInTests" }],
    },
    {
      code: "<div data-x={\"hsl(var(--z))\"} />",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      errors: [{ messageId: "noHslVarInTests" }, { messageId: "noHslVarInTests" }],
    },
  ],
});
