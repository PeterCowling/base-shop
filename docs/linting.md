# Linting

ESLint keeps the monorepo consistent and enforces architectural rules.

## Classic `.eslintrc.cjs` vs flat `eslint.config.mjs`

The legacy `.eslintrc.cjs` uses the classic configuration shape. Global exclusions live in `ignorePatterns` and scoped tweaks are expressed with `overrides`.

```js
// .eslintrc.cjs
module.exports = {
  plugins: ["@typescript-eslint"],
  ignorePatterns: ["**/dist/**", "**/.next/**", "**/*.test.*"],
  overrides: [
    { files: ["**/*.js"], rules: { "@typescript-eslint/no-var-requires": "off" } },
  ],
};
```

The repo now uses the flat `eslint.config.mjs` as the source of truth. Configuration is an array of objects. The first object holds `ignores`; additional objects describe `files`, `languageOptions`, and `rules` for specific scopes. Next.js presets are applied through `FlatCompat`.

```js
export default [
  { ignores: ["**/dist/**", "**/.next/**", "**/*.test.*"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { files: ["**/*.{ts,tsx}"], /* repo‑wide TS rules */ },
];
```

Keep `.eslintrc.cjs` in sync for editors that still rely on it, but new rules belong in the flat config.

## TypeScript support

`@typescript-eslint/parser` and plugin power TypeScript linting across the repo. The main block sets project references for apps and packages and enforces rules such as `no-explicit-any` and `no-unused-vars` (underscored args are ignored).

Packages that ship generated code—like `design-tokens`, `i18n`, `tailwind-config`, and `platform-core`—override `parserOptions.project` to `null` so they lint without a TypeScript project. The `scripts` folder points to its own `tsconfig.eslint.json`.

## Design system rules

The custom `@acme/eslint-plugin-ds` plugin prevents raw design tokens. Rules `ds/no-raw-color` and `ds/no-raw-font` ensure components use the design system helpers instead of hard‑coded values.

## Boundaries and layering

`eslint-plugin-boundaries` defines UI layers (atoms, molecules, organisms, templates) and disallows imports from higher layers. Inside `packages/ui`, `import/no-restricted-paths` adds explicit zone checks to block cross‑layer imports.

## Adding rules or overrides

1. **Global rules** – Update the appropriate block in `eslint.config.mjs` (for example, the repo‑wide TypeScript rules).
2. **Package-specific overrides** – Append a new object with a `files` glob and custom `languageOptions` or `rules`. Import any required plugins at the top of the file and reference them via the `plugins` key.
3. **Global ignores** – Extend the first config object's `ignores` array and, if necessary, mirror the entry in `.eslintrc.cjs`.
4. Run `pnpm lint` to verify the changes.

Following these steps keeps linting consistent across the monorepo.
