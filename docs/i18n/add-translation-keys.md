Type: Guide
Status: Active
Domain: i18n
Last-reviewed: 2025-12-02

# Add Translation Keys (no-hardcoded-copy)

Purpose: Replace user-visible literals with keys resolved via `t()`.

Where translations live

**Shared package (storefront, CMS, etc.):**
- JSON files: `packages/i18n/src/en.json`, `packages/i18n/src/it.json` (+ other locales).
- English is the canonical source; other locales may temporarily mirror EN.

**Prime app (guest portal):**
- Namespace JSON files: `apps/prime/public/locales/{lng}/{ns}.json` (e.g., `en/Homepage.json`, `it/PreArrival.json`).
- Namespaces are defined in `apps/prime/src/i18n.optimized.ts` → `NAMESPACE_GROUPS`.
- Supported locales: `en`, `it` (matches `UI_LOCALES` in `packages/types/src/constants.ts`).
- Generate/validate locale files: `node apps/prime/scripts/generate-locale-files.cjs` (or `--check` to validate).

Steps

**Shared package:**
- Pick a descriptive key: `domain.area.component.label` (e.g., `pdp.addToCart`, `cms.media.delete`).
- Edit `packages/i18n/src/en.json`:
  - Add the key with the English string. Support template vars with `{name}`.
- For placeholders, add to other locales:
  - Copy the EN value into locale files for a placeholder, or leave absent to fall back to EN. Adding placeholders avoids dev "Missing translation" warnings in the client.
- Use in code (client components):
  - `import { useTranslations } from "@acme/i18n";`
  - `const t = useTranslations();`
  - Replace the literal with `{t("your.key")}` or `t("your.key")`.
- Use on the server (load-time or actions):
  - `import { useTranslations } from "@acme/i18n";`
  - `const t = await useTranslations(locale);`
  - Call `t("your.key", { name: value })` when needed.

**Prime app:**
- Pick a descriptive key within the relevant namespace: `area.label` (e.g., `welcome.greeting`, `social.discoverTitle`).
- Edit the namespace JSON for each locale: `apps/prime/public/locales/en/{Namespace}.json` and `apps/prime/public/locales/it/{Namespace}.json`.
- Use in code (client components):
  - `import { useTranslation } from "react-i18next";`
  - `const { t } = useTranslation('Namespace');`
  - Replace the literal with `{t("your.key")}` or `t("your.key")`.
- Run `node apps/prime/scripts/generate-locale-files.cjs --check` to validate key parity.

Examples

**Shared package:**
- Before: `<button>Delete</button>`
- After:
  ```tsx
  import { useTranslations } from "@acme/i18n";
  const t = useTranslations();
  return <button>{t("cms.delete")}</button>;
  ```

**Prime app:**
- Before: `<h1>Welcome to your stay</h1>`
- After:
  ```tsx
  import { useTranslation } from "react-i18next";
  const { t } = useTranslation('Homepage');
  return <h1>{t("welcome.greeting")}</h1>;
  ```

- With variables:
  ```tsx
  // en/PreArrival.json → "welcome.title": "Welcome, {{firstName}}!"
  <p>{t("welcome.title", { firstName })}</p>
  ```

Exemptions (last resort)
- Treat exemptions as tech debt. Prefer adding a key.
- Allowed only for truly non-user-facing strings (e.g., developer diagnostics, CSS class tokens).
- Must include a ticket; TTL optional:
  - Inline: `// i18n-exempt -- ABC-123 internal log label [ttl=YYYY-MM-DD]`
  - File-wide: `/* i18n-exempt file -- ABC-123 reason [ttl=YYYY-MM-DD] */` at the top.
- Notes: missing ticket means the exemption is ignored and lint will fail.

Notes
- Missing keys in the client log a dev warning and render the key; server API falls back to EN.
- Keep keys stable; if renaming, update all locales and references. See `docs/i18n/key-rename-map.md` for bulk operations.
- PR reviewers should push back on exemptions unless justified per above.
- When in doubt, prefer shorter keys under existing domains (e.g., `cms.*`, `checkout.*`, `product.*`).
