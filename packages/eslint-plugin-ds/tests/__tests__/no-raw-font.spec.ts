import { RuleTester } from "eslint";

import rule from "../../src/rules/no-raw-font";

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: "module" },
});

tester.run("no-raw-font", rule, {
  valid: [
    { code: "const font = 'var(--font-body)';" },
    { code: "const font = tokens.typography.body;" },
  ],
  invalid: [
    {
      code: "const bad = 'Arial';",
      errors: [{ messageId: "noRawFont" }],
    },
    {
      code: "const tmpl = `font-family: Helvetica, sans-serif;`;",
      errors: [{ messageId: "noRawFont" }],
    },
  ],
});
