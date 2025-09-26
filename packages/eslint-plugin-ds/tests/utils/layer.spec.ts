import { RuleTester } from "eslint";

const { getLayer } = require("../../src/utils/layer.ts");

// Polyfill structuredClone for ESLint RuleTester under Node environment
(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
  },
});

const rule = {
  meta: { messages: { layer: "LAYER {{layer}}" } },
  create(context: any) {
    return {
      Program(node: any) {
        const layer = getLayer(context, context.getFilename?.());
        if (layer) context.report({ node, messageId: "layer", data: { layer } });
      },
    } as any;
  },
};

tester.run("utils/layer", rule as any, {
  valid: [
    { code: "const x=1;", filename: "packages/ui/src/components/utils/helper.ts" },
  ],
  invalid: [
    {
      code: "/* @layer molecule */\nexport const x=1;",
      filename: "apps/app/src/file.tsx",
      errors: [{ message: "LAYER molecule" }],
    },
    {
      code: "/** @layer organism */\nconst x=1;",
      filename: "apps/app/src/any.ts",
      errors: [{ message: "LAYER organism" }],
    },
    {
      code: "const x=1;",
      filename: "packages/ui/src/components/atoms/Button.tsx",
      errors: [{ message: "LAYER atom" }],
    },
    {
      code: "const x=1;",
      filename: "packages/ui/src/components/molecules/Field.tsx",
      errors: [{ message: "LAYER molecule" }],
    },
    {
      code: "/* @layer atom */\nconst x=1;",
      filename: "packages/ui/src/components/molecules/Thing.tsx",
      errors: [{ message: "LAYER atom" }], // tag wins over path
    },
    {
      code: "const x=1;",
      filename: "packages/ui/src/components/sections/Hero.tsx",
      errors: [{ message: "LAYER section" }],
    },
    {
      code: "const x=1;",
      filename: "packages/ui/src/components/primitives/Stack.tsx",
      errors: [{ message: "LAYER primitive" }],
    },
  ],
});
