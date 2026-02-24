import { RuleTester } from "eslint";

const rule = require("../src/rules/no-raw-tailwind-color.ts").default as typeof import("../src/rules/no-raw-tailwind-color").default;

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-raw-tailwind-color", rule, {
  valid: [
    { code: "<div className=\"bg-surface-2 text-foreground border-border-2\" />" },
    { code: "<div className=\"bg-success-soft text-success-foreground ring-primary\" />" },
    {
      code: "<div className={`bg-muted ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />",
    },
  ],
  invalid: [
    {
      code: "<div className=\"bg-zinc-900 text-white\" />",
      errors: [{ messageId: "noRawTw" }],
    },
    {
      code: "<div className=\"border-blue-500/50\" />",
      errors: [{ messageId: "noRawTw" }],
    },
    {
      code: "<div className=\"text-[#0f172a]\" />",
      errors: [{ messageId: "noRawTw" }],
    },
    {
      code: "<div className=\"bg-[hsl(220_20%_12%)]\" />",
      errors: [{ messageId: "noRawTw" }],
    },
  ],
});
