import { RuleTester } from "eslint";
import rule from "../../src/rules/icon-button-size";

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

tester.run("icon-button-size", rule, {
  valid: [
    {
      code: "<Button size=\"icon\"><svg /></Button>",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    },
    {
      code: "<Button size={\"icon\"}><svg /></Button>",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    },
    {
      code: "<Button>Click</Button>",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    },
    {
      code: "<Button><span>OK</span></Button>",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    },
    {
      code: "<div><svg /></div>",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    },
  ],
  invalid: [
    {
      code: "<Button><svg /></Button>",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      errors: [{ messageId: "require-icon-size" }],
    },
    {
      code: "<Button>{<svg />}</Button>",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      errors: [{ messageId: "require-icon-size" }],
    },
    {
      code: "<Button size><svg /></Button>",
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      errors: [{ messageId: "require-icon-size" }],
    },
  ],
});
