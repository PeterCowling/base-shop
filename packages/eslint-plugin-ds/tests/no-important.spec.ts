import { RuleTester } from "eslint";
const rule = require("../src/rules/no-important.ts").default as typeof import("../src/rules/no-important").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-important", rule, {
  valid: [
    { code: "<div className=\"mt-2 px-3\" />" },
    { code: "<div className=\"content-['!']\" />" },
    { code: "<div className=\"bg-[url('/a!b.png')]\" />" },
    { code: "<div style={{ margin: 'var(--space-2)' }} />" },
  ],
  invalid: [
    { code: "<div className=\"!mt-2\" />", errors: [{ messageId: "noImportantClass" }] },
    { code: "<div className=\"hover:!px-2\" />", errors: [{ messageId: "noImportantClass" }] },
    { code: "<div className={clsx('!mt-2', cond && 'px-2')} />", errors: [{ messageId: "noImportantClass" }] },
    { code: "<div style={{ margin: '10px !important' }} />", errors: [{ messageId: "noImportantStyle" }] },
    { code: "<div style=\"margin: 0 !important\" />", errors: [{ messageId: "noImportantStyle" }] },
  ],
});

