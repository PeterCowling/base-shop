import { RuleTester } from "eslint";
const rule = require("../src/rules/no-hardcoded-copy.ts").default as typeof import("../src/rules/no-hardcoded-copy").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-hardcoded-copy", rule, {
  valid: [
    { code: "export const s = t('A fairly long string that is translated');" },
    { code: '<button aria-label="Delete item" />' },
    { code: "const Comp=()=> <p>Save</p>" },
    { code: "const Comp=()=> <p>{t('Hello world')}</p>" },
    { code: "// i18n-exempt -- TEST-0001 ttl=2099-12-31\nconst s = 'Ad-hoc fixture text used only in tests';" },
    { code: "const s = 'Another long exempt line'; // i18n-exempt -- TEST-0002" },
    { code: '<img alt="Long accessible description here for image" />' },
    { code: '<div title="Tooltip content that can be long" />' },
    { code: "const _ = translator.t('This string is routed via member t method');" },
    { code: '<button aria-description="Long description of control" />' },
    { code: "export const short='Short text';" },
    { code: "const Comp=()=> <span>{'Short text'}</span>" },
  ],
  invalid: [
    {
      code: "const Comp=()=> <p>Hello world this copy should be localized</p>",
      errors: [{ messageId: "hardcodedCopy" }],
    },
    {
      code: "export const s = 'A long string literal that should be translated';",
      errors: [{ messageId: "hardcodedCopy" }],
    },
    {
      code: '<div data-testid="This long attribute should trigger" />',
      errors: [{ messageId: "hardcodedCopy" }],
    },
  ],
});
