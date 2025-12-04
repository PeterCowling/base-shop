Type: Charter
Status: Canonical
Domain: i18n
Last-reviewed: 2025-12-02

Primary code entrypoints:
- packages/i18n/src
- apps/*/src/app/** (locale layouts and helpers)
- docs/i18n/*.md

If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow‑up.

# i18n Charter

## Goals

- Provide a consistent, domain-first key system and fallback policy for UI text across apps.
- Keep the runtime message shape stable (single JSON per locale) while adding languages and improving contracts.
- Clearly separate static UI strings from CMS/prop content and ensure both can be localised safely.
- Support locale-aware behaviour in CMS (Page Builder, previews) without breaking existing app contracts.

## Core Flows

- **Message loading**
  - Apps load exactly one JSON bundle per locale (for example `en.json`, `de.json`, `it.json`) from `packages/i18n`.
  - `t(key, params?)` resolves static UI strings using domain-first keys.

- **Fallbacks**
  - Locale resolution follows a simple chain:
    - `de` → `en`
    - `it` → `en`
  - Future regional variants (for example `de-CH`) use `variant → base → en` in design, but are out of scope for the initial foundation.

- **Props vs static UI**
  - Static UI strings use `t(key, params?)` directly in components.
  - CMS/prop content (authorable text passed via props) uses a `resolveText()` helper that accepts keys or inline localised values and applies the same fallback policy.

## Key Contracts

- **ADR foundation**
  - `docs/adr/adr-00-i18n-foundation.md` defines:
    - Domain-first key naming (for example `forms.checkout.email.label`).
    - Single JSON per locale and runtime compatibility requirements.
    - Fallback policy and prop usage rules.

- **Implementation docs**
  - `docs/i18n/add-translation-keys.md` – how to add new keys.
  - `docs/i18n/key-rename-map.md` – mapping between old and new keys during migration.
  - `docs/i18n/locale-aware-bind.md`, `docs/i18n/page-builder-i18n.md`, `docs/i18n/resolveText.md` – CMS and Page Builder i18n helpers.

## Out of Scope

- Full ICU/FormatJS integration (deferred to a later phase once the foundation is stable).
- Per-namespace bundle splitting and advanced runtime loading strategies.
- Regional locale policy beyond the basic fallback chain described in the ADR.
