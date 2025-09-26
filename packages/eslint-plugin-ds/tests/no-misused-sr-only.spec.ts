import { RuleTester } from "eslint";
const rule = require("../src/rules/no-misused-sr-only.ts").default as typeof import("../src/rules/no-misused-sr-only").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-misused-sr-only", rule, {
  valid: [
    { code: '<span className="sr-only" aria-live="polite">Screen only</span>' },
    { code: '<button className="sr-only" aria-label="Open" />' },
    { code: '<div className={clsx("sr-only", maybe && "w-4")} />' },
  ],
  invalid: [
    { code: '<div className="sr-only flex" />', errors: [{ messageId: "misused" }] },
    { code: '<p className="sr-only w-4" />', errors: [{ messageId: "misused" }] },
  ],
});
