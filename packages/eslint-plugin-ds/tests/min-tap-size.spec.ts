import { RuleTester } from "eslint";

const rule = require("../src/rules/min-tap-size.ts").default as typeof import("../src/rules/min-tap-size").default;

(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: unknown) => JSON.parse(JSON.stringify(v)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("min-tap-size", rule, {
  valid: [
    { code: '<button className="size-10" />' },
    { code: '<a className="min-h-10 min-w-10" />' },
    { code: '<input type="button" className="size-11" />' },
    { code: '<button className={clsx("size-10", cond && "size-8")} />' },
  ],
  invalid: [
    { code: '<button className="size-8" />', errors: [{ messageId: "tooSmall" }] },
    { code: '<a className="min-h-10" />', errors: [{ messageId: "tooSmall" }] },
    { code: '<button className="size-10" />', options: [{ min: 44 }], errors: [{ messageId: "tooSmall" }] },
  ],
});
