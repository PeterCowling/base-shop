import { RuleTester } from "eslint";

// ESLint@9 RuleTester uses structuredClone; polyfill for Node versions without it
(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

// Inline rule for testing the utils via RuleTester
const { extractFromJsxAttribute, parseFromExpression } = require("../../src/utils/classParser.ts");

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const rule = {
  meta: { messages: { found: "FOUND {{cls}}" } },
  create(context: any) {
    return {
      JSXAttribute(node: any) {
        const parsed = extractFromJsxAttribute(node);
        if (parsed && parsed.confident) {
          for (const c of parsed.classes) context.report({ node, messageId: "found", data: { cls: c } });
        }
      },
      // Also exercise parseFromExpression on top-level consts
      VariableDeclarator(node: any) {
        if (node.init) {
          const parsed = parseFromExpression(node.init);
          if (parsed.confident) {
            for (const c of parsed.classes) context.report({ node, messageId: "found", data: { cls: c } });
          }
        }
      },
    } as any;
  },
};

tester.run("utils/classParser", rule as any, {
  valid: [
    { code: "const x = 1;" },
    // Non-static template with expression -> not confident, do not report
    { code: "<div className={`p-2 ${'mt-2'}`} />" },
    // Unknown function
    { code: "<div className={foo('bar')} />" },
    // Spread in arrays drops confidence
    { code: "<div className={clsx(...['a','b'])} />" },
    // Dynamic identifier value (not confident)
    { code: "const Style = foo;" },
    // Array with spread and identifier (dynamic)
    { code: "<div className={clsx(['a', ...['b'], foo])} />" },
    // Binary with dynamic right side
    { code: "const S2 = 'a' + foo" },
    // Object with non-static boolean value
    { code: "<div className={clsx({ foo: cond })} />" },
    // JSX empty expression container
    { code: "<div className={/* comment */} />" },
    // Object with non-string key should be ignored (not confident)
    { code: "<div className={clsx({ 1: true })} />" },
  ],
  invalid: [
    {
      code: "<div className=\"p-2 mt-4\"/>",
      errors: [{ message: "FOUND p-2" }, { message: "FOUND mt-4" }],
    },
    {
      code: "<div className={true ? 'ok' : 'no'}/>",
      errors: [{ message: "FOUND ok" }],
    },
    {
      code: "<div className={`flex gap-2`}/>",
      errors: [{ message: "FOUND flex" }, { message: "FOUND gap-2" }],
    },
    {
      code: "<div className={false ? 'no' : 'ok'}/>",
      errors: [{ message: "FOUND ok" }],
    },
    {
      code: "const ST = 'a' + ' b'",
      errors: [{ message: "FOUND a" }, { message: "FOUND b" }],
    },
    {
      code: "const OBJ = ({ a: true, b: false })",
      errors: [{ message: "FOUND a" }],
    },
    {
      code: "<div className={clsx({ 'x-y': true })} />",
      errors: [{ message: "FOUND x-y" }],
    },
    {
      code: "<div className={clsx('block', ['hidden', ['sr-only']], { visible: true, hidden: false })}/>",
      errors: [
        { message: "FOUND block" },
        { message: "FOUND hidden" },
        { message: "FOUND sr-only" },
        { message: "FOUND visible" },
      ],
    },
    {
      code: "<div className={clsx({ foo: !false, bar: !true })} />",
      errors: [{ message: "FOUND foo" }],
    },
    {
      code: "<div className={cn('a', classnames('b', ['c']), {d: true})}/>",
      errors: [
        { message: "FOUND a" },
        { message: "FOUND b" },
        { message: "FOUND c" },
        { message: "FOUND d" },
      ],
    },
    {
      code: "<div className={cva('base')}/>",
      errors: [{ message: "FOUND base" }],
    },
    {
      code: "const CL = clsx(['x', { y: true }])",
      errors: [{ message: "FOUND x" }, { message: "FOUND y" }],
    },
  ],
});
