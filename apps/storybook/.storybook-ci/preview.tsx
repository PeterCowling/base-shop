// Reuse the primary Storybook preview configuration for CI.
// This ensures CI stories share the same globals, decorators (including RTL),
// and theming behaviour as local Storybook.

export * from "../.storybook/preview.tsx";
export { default } from "../.storybook/preview.tsx";

