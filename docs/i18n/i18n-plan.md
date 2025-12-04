Type: Plan
Status: Active
Domain: i18n
Last-reviewed: 2025-12-02
Relates-to charter: docs/i18n/i18n-charter.md

# i18n Plan — Keys, Locales, and Resolvers

This plan tracks implementation work derived from ADR-00 and the i18n charter.

## Active tasks

- **I18N-01 — Enforce domain-first key naming**
  - Status: ☐
  - Scope:
    - Audit `packages/i18n/src/en.json` for any non-domain-first keys.
    - Update `docs/i18n/key-rename-map.md` with old → new mappings where renames are required.
  - Dependencies:
    - `docs/adr/adr-00-i18n-foundation.md` accepted.
  - Definition of done:
    - All keys in `en.json` follow the `domain.area.component.role` convention, and the rename map documents any changes.

- **I18N-02 — Ensure locale parity via fillLocales**
  - Status: ☐
  - Scope:
    - Use `fillLocales` to verify `de.json`, `it.json`, and any other locales match the key set from `en.json`.
    - Decide on how to handle temporary EN fallbacks (copying strings vs relying on resolver).
  - Dependencies:
    - I18N-01 (stable key set).
  - Definition of done:
    - Non-EN locales have a complete key set; missing translations either use EN placeholders or are clearly surfaced to authors.

- **I18N-03 — Align prop content with resolveText**
  - Status: ☐
  - Scope:
    - Review CMS and Page Builder components that accept authorable text props and ensure they use `resolveText` / `useTextResolver` consistently.
    - Update `docs/i18n/resolveText.md` and `docs/i18n/locale-aware-bind.md` with any edge cases discovered.
  - Dependencies:
    - I18N-02 (fallback behaviour well-understood).
  - Definition of done:
    - All major CMS/blocks that accept `TranslatableText` props document and use the resolver pattern; any remaining legacy string usage is intentional and documented.

## Completed / historical

- None yet.
