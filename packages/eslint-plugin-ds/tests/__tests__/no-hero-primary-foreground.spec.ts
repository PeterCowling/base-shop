import { RuleTester } from "eslint";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - use CJS require to avoid ESM transform edge cases
const rule = require("../../src/rules/no-hero-primary-foreground.ts").default as typeof import("../../src/rules/no-hero-primary-foreground").default;

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

tester.run("no-hero-primary-foreground", rule, {
  valid: [
    {
      code: "<div className=\"bg-hero-contrast text-hero-foreground\" />",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    },
    {
      code: "<div className=\"bg-hero text-primary\" />",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    },
    {
      code: "<div className={`bg-hero-contrast text-hero-foreground`} />",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    },
    // Non-className attribute should not report
    {
      code: "<div id=\"bg-hero text-primary-foreground\" />",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    },
  ],
  invalid: [
    {
      code: "<div className=\"bg-hero text-primary-foreground\" />",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      errors: [{ messageId: "noHeroPrimaryForeground" }],
    },
    {
      code: "<div className={`bg-hero text-primary-foreground`} />",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      errors: [{ messageId: "noHeroPrimaryForeground" }],
    },
    {
      code: "<div className={\"bg-hero text-primary-foreground\"} />",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      errors: [{ messageId: "noHeroPrimaryForeground" }],
    },
  ],
});
