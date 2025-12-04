Type: Guide
Status: Active
Domain: i18n
Last-reviewed: 2025-12-02

# `resolveText` and `useTextResolver`

Purpose: Provide a single, typed way to render translatable props while remaining backwards compatible with legacy strings.

Types (from `@acme/types`)
- `Locale = 'en' | 'de' | 'it'`
- `LocalizedString = Partial<Record<Locale, string>>`
- `KeyRef = { type: 'key'; key: string; params?: Record<string, unknown> }`
- `Inline = { type: 'inline'; value: LocalizedString }`
- `TranslatableText = KeyRef | Inline | string // legacy`

Fallbacks
- Chain: `de → en`, `it → en`, `en → en`.
- Regional variants are deferred (documented in ADR for later).

Resolver
- `resolveText(value, locale, t)`:
  - Legacy string → returns the string (treated as inline.en);
  - Key → `t(key, params)`;
  - Inline → try `value[locale]`, else fall back along chain, else empty string.
  - In dev, logs warnings on fallback/missing.

Hook
- `useTextResolver(locale)` returns a memoized `(value: TranslatableText) => string` bound to the current `t()` and supplied `locale`.

Usage
```
import { useTextResolver } from '@acme/i18n/useTextResolver';

function MyComponent({ label }: { label: TranslatableText }) {
  const locale = 'de';
  const resolve = useTextResolver(locale);
  return <button>{resolve(label)}</button>;
}
```

Promote/detach helpers (server)
- Use `@acme/i18n/editTranslations` from the CMS backend to seed keys or read values:
  - `addOrUpdateKey(key, enValue)` adds key to `en.json` and mirrors to `de/it` (with EN value).
  - `readLocalizedValues(key)` returns `{ en?, de?, it? }` for detaching a key into inline values.
  - These helpers operate on `packages/i18n/src/*.json`; call from scripts or API routes, not the browser.
