Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2025-12-02

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

## Exceptions Policy

- Disables must be justified with a ticket ID following `--` in the comment.
  - Example: `// eslint-disable-next-line no-console -- ABC-123 explain why`
  - TTL metadata is optional and supported (e.g., `ttl=2099-12-31`).
- Rule: `ds/require-disable-justification`
  - Default regex: `[A-Z]{2,}-\d+` (configurable per scope).
  - Severity: error in CMS/UI and app shells; warn elsewhere.

### i18n exemptions

- Avoid `i18n-exempt`; prefer adding a translation key.
- If you must exempt truly non-user-facing strings, include a ticket; TTL optional.
  - Inline: `// i18n-exempt -- ABC-123 reason [ttl=YYYY-MM-DD]`
  - File-wide: `/* i18n-exempt file -- ABC-123 reason [ttl=YYYY-MM-DD] */` at the top of the file.
- The `ds/no-hardcoded-copy` rule ignores exemptions without a ticket (they will fail lint).

### Exceptions Registry and CI

- Registry file: `exceptions.json` at repo root.
  - Shape:
    - `tickets[<ID>].expires`: ISO date for expiry (optional).
    - `tickets[<ID>].allow`: optional path globs where the ticket is allowed.
    - `tickets[<ID>].notes`: free-form context.
- Generation + validation:
  - Generate report: `pnpm run lint:json` (writes `.eslint-report.json`).
  - Validate: `pnpm run lint:exceptions`.
  - CI runs both; build fails on missing/expired/unscoped exceptions.

## Rule Catalog (selected)

- Governance
  - `ds/require-disable-justification`: require ticketed disables; optional TTL metadata.
- Token/Design System
  - `ds/no-raw-color`, `ds/no-raw-font`, `ds/no-raw-spacing`, `ds/no-raw-typography`, `ds/no-raw-radius`, `ds/no-raw-shadow`, `ds/no-raw-zindex`.
  - `ds/no-arbitrary-tailwind`, `ds/no-important`.
- Layout & Media Safety
  - `ds/require-min-w-0-in-flex`, `ds/forbid-fixed-heights-on-text`, `ds/require-breakpoint-modifiers`.
  - `ds/require-aspect-ratio-on-media`, `ds/no-naked-img`, `ds/no-overflow-hazards`, `ds/absolute-parent-guard`.
  - `ds/no-nonlayered-zindex`, `ds/no-unsafe-viewport-units`.
- i18n/RTL & A11y
  - `ds/no-hardcoded-copy`, `ds/no-physical-direction-classes-in-rtl`.
  - `ds/enforce-focus-ring-token`, `ds/min-tap-size`, `ds/no-misused-sr-only`.
- UI Page Builder
  - `ds/icon-button-size`.

## Severities and Scopes

- CMS/UI and app shells: errors for token rules, arbitrary classes, media/layout safety, i18n/RTL, governance, and page-builder components.
- Engineering libs: warnings initially; flip to errors as migrations complete.

## Layout Contract

The layout contract keeps layout concerns in container/layout primitives and out of leaves/atoms. This makes components predictable, composable, and avoids overflow/RTL regressions.

- Atoms cannot carry margins
  - Rule: `ds/no-margins-on-atoms`
  - FAIL:
    ```tsx
    // packages/ui/src/components/atoms/Button.tsx
    export function Button(props) {
      return <button className="mt-2 px-4 py-2" {...props} />; // ✗ margin on atom
    }
    ```
  - OK:
    ```tsx
    <div className="mt-2"><Button /></div> // ✓ caller owns spacing
    ```

- Leaves can’t create layout
  - Rule: `ds/enforce-layout-primitives`
  - FAIL:
    ```tsx
    // Inside a leaf component
    <div className="grid grid-cols-2 gap-4">...</div> // ✗ layout
    ```
  - OK:
    ```tsx
    // Use Grid primitive or place layout at the parent/container
    <Grid cols={2} gap="md">...</Grid>
    ```

- Container widths constrained
  - Rule: `ds/container-widths-only-at`
  - FAIL:
    ```tsx
    <section className="max-w-[1240px] mx-auto">...</section> // ✗ arbitrary width
    ```
  - OK:
    ```tsx
    <section className="container mx-auto">...</section>
    ```

- Responsive intent is explicit
  - Rule: `ds/require-breakpoint-modifiers` (applies when the file is marked `/** @responsive */`)
  - FAIL:
    ```tsx
    /** @responsive */
    <div className="grid" /> // ✗ missing breakpoint modifier
    ```
  - OK:
    ```tsx
    /** @responsive */
    <div className="md:grid" /> // ✓ explicit breakpoint
    ```

- Overflow guard in flex rows
  - Rule: `ds/require-min-w-0-in-flex` (auto-fixable for literal class attributes)
  - FAIL:
    ```tsx
    <div className="flex flex-row grow truncate" /> // ✗ can overflow
    ```
  - Auto-fix →
    ```tsx
    <div className="flex flex-row grow truncate min-w-0" /> // ✓ guarded
    ```

- Negative margins banned
  - Rule: `ds/no-negative-margins`
  - FAIL: `<div className="-mx-4" />` → use tokens or structural layout.

- RTL-safe spacing
  - Rule: `ds/no-physical-direction-classes-in-rtl` (auto-fixes to logical props when possible)
  - FAIL: `ml-2` in RTL contexts → auto-fix to `ps-2`.

- Media safety and images
  - Rules: `ds/require-aspect-ratio-on-media`, `ds/no-naked-img`, `ds/absolute-parent-guard`, `ds/no-unsafe-viewport-units`
  - Examples:
    ```tsx
    <video className="aspect-[16/9]" /> // ✓ has aspect ratio
    <img /> // ✗ naked <img>; wrap with tokened styles/components
    ```

## Examples

- Valid disable with ticket and TTL:
  - `// eslint-disable-next-line no-console -- ABC-123 migrating logger; ttl=2025-12-31`
- Invalid (no `--`):
  - `/* eslint-disable eqeqeq */`
- Invalid (no matching ticket):
  - `// eslint-disable-line no-console -- needs follow-up`

### Exceptions registry examples

- Register a ticket with expiry and path scope in `exceptions.json`:
  ```json
  {
    "tickets": {
      "ABC-123": {
        "expires": "2025-12-31",
        "allow": ["packages/ui/**", "apps/**"],
        "notes": "Migrate logging to structured logger"
      }
    }
  }
  ```

- A matching disable in code:
  ```ts
  // eslint-disable-next-line no-console -- ABC-123 migrating logger; ttl=2025-12-31
  console.log("debug");
  ```

### Autofixes

- `ds/require-min-w-0-in-flex`: adds `min-w-0` when conditions are met (literal class attr).
- `ds/no-physical-direction-classes-in-rtl`: maps `ml-2`→`ps-2`, `mr-2`→`pe-2`, etc., where safe.
- Some token rules offer suggestions/fixes when a direct token mapping is clear.

## Stylelint (authored CSS)

To enforce token usage in CSS files (globals and feature CSS), the repo includes a Stylelint config:

- Config: `stylelint.config.cjs`
- Scope: `apps/**/src/**/*.css`, `packages/ui/src/**/*.css`
- Rule: `scale-unlimited/declaration-strict-value` for `margin|padding|gap|border-radius`
  - Allowed value forms: `var(--...)`, `clamp(...)`, `min(...)`, `max(...)`, or CSS keywords (`inherit`, `initial`, `unset`).
  - Blocks raw `px`/`rem` for spacing/radius to match ESLint’s `ds/no-raw-spacing` and `ds/no-raw-radius` in JSX.

## CMS Tap Target Override

CMS raises the minimum tap target size to align with Apple HIG:

- Override: `eslint.config.mjs` → `{ files: ['apps/cms/**'], 'ds/min-tap-size': ['error', { min: 44 }] }`
- Repo baseline remains 40px for other packages; the WCAG 2.2 minimum (24px) is encoded as a token and optional utility.

## UI Migration Notes

During the ongoing design‑system migration, some rules in `packages/ui` are intentionally downgraded to warnings to avoid blocking iteration. As components are updated, we will ratchet severities back to errors.

- Stories are treated as dev‑only: copy/layout DS rules are relaxed under `packages/ui/**/*.stories.{ts,tsx}`.
- Page‑builder icon buttons must use size="icon" (rule: `ds/icon-button-size`).
- Tailwind plugin note: the Tailwind ESLint plugin is optionalized to account for Tailwind v4 export changes; the no‑contradicting‑classname rule is enabled only when available.

### Logical Direction Utilities (RTL‑safe)

Prefer logical utilities everywhere:

- Position: `left-*` → `start-*`, `right-*` → `end-*`.
- Spacing: `ml-*` → `ms-*`, `mr-*` → `me-*`, `pl-*` → `ps-*`, `pr-*` → `pe-*`.
- Borders: `border-l`/`border-l-*` → `border-s`/`border-s-*`, `border-r`/`border-r-*` → `border-e`/`border-e-*`.
- Text: `text-left`/`text-right` → `text-start`/`text-end`.

### Common Fixes Cheat‑Sheet

- Tap targets: icon‑only buttons must be square and ≥40px. In shadcn Button, set `size="icon"`.
- Aspect ratios: use `aspect-video` or `aspect-square` instead of `aspect-[16/9]`/`aspect-[4/3]`.
- Arbitrary text sizes: `text-[10px]`/`text-[11px]` → `text-xs`.
- Tokenized spacing: avoid `px-[calc(...)]`; prefer `px-8`, `px-6`, etc.
- Arbitrary z‑index: `z-[70]`/`z-[100]` → `z-50` (or a design tokenized layer).
- Dynamic offsets: `start-[var(--space-4)]`/`end-[var(--space-4)]` → `start-4`/`end-4` or spacing tokens.
- Scrims/overlays: avoid `bg-[hsl(var(--overlay-scrim-* ))]`; prefer token classes such as `bg-surface-2/60`.
- Min widths: `min-w-[8rem]`/`[10rem]`/`[12rem]`/`[14rem]` → `min-w-32`/`40`/`48`/`56`.
- Min heights: `min-h-[300px]` → `min-h-80`.
- Scale on hover: `group-hover:scale-[1.02]` → `group-hover:scale-105`.
- Container widths: do not use `max-w-*` in leaf components; keep width constraints in container primitives (Page/Section/Container/Overlay).

### Running Lint (scoped)

- UI package: `pnpm --filter @acme/ui run lint`
- Specific files: `pnpm --filter @acme/ui exec eslint src/components/cms/MediaFilePreview.tsx --quiet`

### When to add exceptions

Exceptions must be temporary, justified, and ticketed. Prefer fixing the violation using the guidance above. If you must disable a rule, include `-- TICKET-ID` and (optionally) `ttl=YYYY-MM-DD`.
