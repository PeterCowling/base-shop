import { RuleTester } from "eslint";

const rule = require("../src/rules/enforce-focus-ring-token.ts").default as typeof import("../src/rules/enforce-focus-ring-token").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("enforce-focus-ring-token", rule, {
  valid: [
    { code: '<button className="outline-none" />' },
    { code: '<button className="focus-visible:ring-2" />' },
    { code: '<a className="md:focus-visible:outline-2" />' },
    { code: '<button className={somethingDynamic} />' },
  ],
  invalid: [
    {
      code: '<button className="ring-2" />',
      output: '<button className="focus-visible:ring-2" />',
      errors: [{ messageId: "requireFocusVisible" }],
    },
    {
      code: '<button className="outline-2 ring-[#ff0000]" />',
      output: '<button className="focus-visible:outline-2 ring-[#ff0000]" />',
      errors: [{ messageId: "requireFocusVisible" }, { messageId: "noRawFocusColor" }],
    },
    {
      code: '<button className={clsx("outline-1")} />',
      errors: [{ messageId: "requireFocusVisible" }],
    },
    {
      code: '<button className="outline-[#fff]" />',
      errors: [{ messageId: "noRawFocusColor" }],
    },
  ],
});
