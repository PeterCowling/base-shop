import { RuleTester } from "eslint";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - use CJS require to avoid ESM transform edge cases
const rule = require("../../src/rules/no-raw-tailwind-color.ts").default as typeof import("../../src/rules/no-raw-tailwind-color").default;

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

tester.run("no-raw-tailwind-color", rule, {
  valid: [
    { code: "const ok = 'text-primary';" },
    { code: "const ok = 'bg-hero-contrast';" },
    { code: "const ok = 'ring-token-brand';" },
  ],
  invalid: [
    {
      code: "const bad = 'text-gray-500';",
      errors: [{ messageId: "noRawTw" }],
    },
    { code: "const bad = 'ring-red-400';", errors: [{ messageId: "noRawTw" }] },
    { code: "const bad = 'border-blue-500/50';", errors: [{ messageId: "noRawTw" }] },
    { code: "const bad = 'stroke-amber-400';", errors: [{ messageId: "noRawTw" }] },
  ],
});
