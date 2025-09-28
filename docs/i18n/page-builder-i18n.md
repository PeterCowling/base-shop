# Page Builder i18n

Goal: Maximize user experience and SEO by ensuring all user‑visible copy in the Page Builder is translatable and rendered in the current locale.

## Requirements

- Do not hardcode user‑facing strings. Always translate.
- Built‑in Section Library entries (headers, footers, essentials) must provide translated `label` and `description` values.
- Runtime UI components (toolbars, inputs, tooltips, aria labels) must wrap copy with `t()` from `@acme/i18n`.

## Pattern used for Built‑In Sections

Files under `packages/ui/src/components/cms/page-builder/built-in-sections/` define palette entries. We support translation via two mechanisms:

- Key fields: `labelKey` and `descriptionKey` on `BuiltInSection`.
- Resolution helper: `getBuiltInSections(t)` returns the full list with `label`/`description` resolved using the current `t`.

Consumers must call `getBuiltInSections(t)` with the translator from `useTranslations()` and render `label`/`description` from the returned items.

Example usage:

```
import { useTranslations } from "@acme/i18n";
import { getBuiltInSections } from "./builtInSections.data";

const t = useTranslations();
const builtIns = getBuiltInSections(t);
// builtIns[i].label and .description are localized strings
```

## Adding or editing variants

- Prefer adding `labelKey`/`descriptionKey` values rather than literals in:
  - `built-in-sections/header.ts`
  - `built-in-sections/footer.ts`
  - `built-in-sections/other.ts` (factory `getOtherSections(t)` localizes top‑level fields)
- If a legacy entry has `label`/`description` literals, ensure the consumer resolves them via `getBuiltInSections(t)` so they can be replaced with keys later without breaking rendering.

## Notes

- Seed content within `build()` (e.g., placeholder captions) is minimal and can be localized at render time by the concrete components. Avoid adding marketing copy there.
- Lint: the `ds/no-hardcoded-copy` rule should not warn for these files when following the pattern above. If you must temporarily add a literal, replace it with a key promptly.

