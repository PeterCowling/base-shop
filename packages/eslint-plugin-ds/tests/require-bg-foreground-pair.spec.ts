import { RuleTester } from "eslint";

(globalThis as any).structuredClone =
  (globalThis as any).structuredClone ||
  ((value: unknown) => JSON.parse(JSON.stringify(value)));

const rule = require("../src/rules/require-bg-foreground-pair.ts")
  .default as typeof import("../src/rules/require-bg-foreground-pair").default;

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("require-bg-foreground-pair", rule, {
  valid: [
    {
      code: "<button className=\"bg-primary text-primary-foreground text-sm\" />",
    },
    {
      code: "<div className=\"bg-panel text-foreground\" />",
    },
    {
      code: "<div className=\"bg-primary text-primary-fg text-sm\" />",
    },
    {
      code: "<span className=\"bg-success-soft text-fg text-sm\" />",
    },
    {
      code: "<div className=\"hover:bg-accent text-fg text-sm\" />",
    },
    {
      code: "<div className=\"data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground text-sm\" />",
    },
    {
      code: "import { cn } from '@acme/design-system/utils/style'; <div className={cn('bg-primary text-primary-foreground')} />;",
    },
    {
      code: "import { cn } from '@acme/design-system/utils/style'; <div className={cn('h-2', active ? 'bg-primary text-primary-foreground' : 'bg-muted')} />;",
    },
    {
      code: "import { cn } from '@acme/design-system/utils/style'; <div className={cn({ 'bg-primary text-primary-foreground': active })} />;",
    },
    {
      code: "<div data-ds-contrast-exempt className=\"bg-primary\" />",
    },
    {
      code: "<div data-ds-contrast-exempt={true} className=\"bg-primary\" />",
    },
  ],
  invalid: [
    {
      code: "<button className=\"bg-primary text-sm\" />",
      errors: [{ message: /bg-primary/ }],
    },
    {
      code: "<div className=\"bg-primary\" />",
      errors: [{ message: /bg-primary/ }],
    },
    {
      code: "<div className=\"bg-danger text-fg text-sm\" />",
      errors: [{ message: /bg-danger/ }],
    },
    {
      code: "<div className=\"bg-accent text-fg text-sm\" />",
      errors: [{ message: /bg-accent/ }],
    },
    {
      code: "import { cn } from '@acme/design-system/utils/style'; <div className={cn('bg-danger')} />;",
      errors: [{ message: /bg-danger/ }],
    },
    {
      code: "import { cn } from '@acme/design-system/utils/style'; <div className={cn('h-2', active ? 'bg-primary' : 'bg-muted')} />;",
      errors: [{ message: /bg-primary/ }],
    },
    {
      code: "import { cn } from '@acme/design-system/utils/style'; <div className={cn({ 'bg-primary': active })} />;",
      errors: [{ message: /bg-primary/ }],
    },
    {
      code: "<div data-ds-contrast-exempt={false} className=\"bg-primary\" />",
      errors: [{ message: /bg-primary/ }],
    },
  ],
});
