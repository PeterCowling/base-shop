import { RuleTester } from "eslint";

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const rule = require("../src/rules/no-nonlayered-zindex.ts").default as typeof import("../src/rules/no-nonlayered-zindex").default;

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-nonlayered-zindex", rule, {
  valid: [
    { code: "<Modal className=\"z-50\" />" },
    { code: "<Toast style={{ zIndex: 1000 }} />" },
    // non-confident class value → do not report
    { code: "const Z='z-10'; <div className={Z} />" },
    // style object without zIndex should not report
    { code: "<div style={{ top: 0 }} />" },
  ],
  invalid: [
    { code: "<div className=\"z-10\" />", errors: [{ message: /Only approved layered components/ }] },
    { code: "<span style={{ zIndex: 10 }} />", errors: [{ message: /Only approved layered components/ }] },
  ],
});
