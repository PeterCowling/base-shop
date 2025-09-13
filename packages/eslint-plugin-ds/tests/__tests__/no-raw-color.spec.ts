import { RuleTester } from "eslint";
import rule from "../../src/rules/no-raw-color";

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: "module" },
});

tester.run("no-raw-color", rule, {
  valid: [
    { code: "const color = 'var(--color-primary)';" },
    { code: "const color = tokens.colors.primary;" },
  ],
  invalid: [
    {
      code: "const bad = '#fff';",
      errors: [{ messageId: "noRawColor" }],
    },
    {
      code: "const tmpl = `color: #000000;`;",
      errors: [{ messageId: "noRawColor" }],
    },
  ],
});
