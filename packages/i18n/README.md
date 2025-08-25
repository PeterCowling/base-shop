# @acme/i18n

## Adding a locale

Run `pnpm add-locale <code>` from the repository root.

This command:

- appends the locale code to [`src/locales.ts`](src/locales.ts)
- creates a translation stub at [`src/<code>.json`](src)
- updates internal imports so the new locale is recognised

Fill in the generated JSON file with translations and commit the changes.
