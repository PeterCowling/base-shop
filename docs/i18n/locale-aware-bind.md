# Locale-aware Bind

Purpose: Resolve TranslatableText props at injection time so downstream components can stay simple and receive plain strings.

Location: `packages/ui/src/components/cms/blocks/containers/Bind.tsx`

Usage
- Basic: `<Bind path="title"><Heading /></Bind>` injects `title` as `text` prop.
- Custom prop: `<Bind prop="caption" path="product.caption"><Card /></Bind>`
- Route building: when `prop="href"` and no `path` is provided, Bind will expand `itemRoutePattern` from the dataset meta using current item fields.
- i18n resolution: Bind resolves `{ type:'key' }` and `{ type:'inline' }` values into a string using the current `t()` and supplied `locale`.
- Escape hatch: set `raw` to true to bypass resolution and pass the original value shape through.

Props
- `prop?: string` — destination prop name (default `text`).
- `path?: string` — dot path in the current dataset item, or a template with `{field}` placeholders.
- `fallback?: unknown` — value to use when the path is missing or empty.
- `raw?: boolean` — if true, skip i18n resolution.
- `locale?: 'en' | 'de' | 'it'` — locale used when resolving inline values.

Notes
- Resolution order for inline: locale → fallback chain (de→en, it→en, en).
- Logs a warning in dev when a bound path is missing.
- Keep `raw` for fields that must receive non-strings (e.g., complex objects).

