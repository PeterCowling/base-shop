# ADR-00: i18n Foundation — Keys, Fallbacks, and Guardrails

- Status: Proposed
- Date: 2025-09-27
- Owners: FE lead, CMS lead
- Reviewers: Platform, Design Systems, Content Ops

## Context

We need to introduce German (de) and Italian (it) while keeping the current runtime contract stable. Today, apps expect a single JSON file of messages per locale and use `t(key, params?)` for static UI strings. CMS-driven props sometimes pass raw strings directly to UI components, which creates ambiguity during migration.

To avoid churn mid‑migration, we are locking conventions now. This ADR defines key naming, message shape, fallback behavior, and how runtime code should retrieve text. The implementation will land in phased steps to avoid breaking SSR or client behavior.

## Decision

1) Domain‑first keys (canonical)

- Keys reflect the product/UI domain rather than ad‑hoc phrasing.
- Examples:
  - `announcementBar.close`
  - `actions.addToCart`
  - `forms.checkout.email.label`
  - `forms.checkout.email.placeholder`
  - `product.price.from`
  - `errors.required`

2) Single JSON per locale (no runtime contract break)

- Maintain one flat JSON per locale: `en.json`, `de.json`, `it.json`.
- Continue to ship the same runtime message shape the app consumes today.
- Keys are renamed to domain‑first without changing how messages are loaded or resolved at runtime in Step 2.

3) Fallback policy (initial)

- de → en, it → en.
- Regional variants are out‑of‑scope initially, but we document intended behavior for later: e.g., `de-CH → de → en`.

4) Prop policy (data vs. static UI)

- Static UI: use `t(key, params?)` directly in components for purely static strings.
- CMS/prop content (authorable, dynamic, or shared across contexts): use a centralized resolver `resolveText()` that accepts either a key reference or localized inline values.
- Until the resolver lands (Step 4), authors can continue passing strings, but new code should be written with this policy in mind.

5) Deferred items (explicitly not in scope for Step 1–2)

- FormatJS/ICU message formatting integration.
- Namespace code‑split of message bundles.
- Regional variants (e.g., `de-CH`) in runtime selection.
- `formatjs-eslint` rules and linting automation.

## Guardrails

- No runtime contract break in Steps 1–2: keep the single‑file message contract intact while renaming keys and seeding locales.
- Server and client must agree on the active locale’s messages (fixed in Step 3 by loading the requested locale on SSR and serializing selected messages).
- Keep files focused and small; split helpers where needed. See AGENTS runbook for ≤350 lines/file guideline.
- Maintain TypeScript path mapping for workspace packages pre/post build; see `docs/tsconfig-paths.md`.
- Tests are scoped and targeted; avoid running all monorepo tests unless requested.

## Conventions

Key naming

- Domain comes first, then feature, then field/subpart, then role (label, placeholder, helper, error).
- Prefer nouns and consistent segments: `forms.checkout.email.label`, `forms.checkout.email.placeholder`.
- Reusable actions under `actions.*` (e.g., `actions.addToCart`, `actions.checkout`).
- Reusable errors under `errors.*`.

File layout and shape

- `packages/i18n/src/en.json` (canonical), `de.json`, `it.json` mirror the same set of keys.
- We will maintain `de.json` and `it.json` via a helper (fill locales) to keep them in sync with `en.json` during migration.

Fallbacks

- When resolving a text for `locale`, attempt `locale` first; if missing, fall back to `en`.
- Future: for regional locales like `de-CH`, attempt `de-CH → de → en`.

Prop usage

- Static UI strings: `t('domain.key', params)`.
- CMS/prop text: `resolveText(value)` where `value` can be a key reference or inline localized values.
- Legacy raw strings will be handled as inline `{ en: value }` by the resolver for backward compatibility.

## Migration Plan (Phased)

- Step 1 (this ADR): agree on keys, files, fallbacks, and prop policy.
- Step 2: seed `de.json` and `it.json`, rename EN keys to domain‑first, add a key‑rename map doc, and update usages.
- Step 3: server helper loads requested locale and serializes matching messages to the client to eliminate hydration mismatches.
- Step 4: introduce explicit types and a centralized `resolveText()` with fallback chain and dev warnings.
- Steps 5–8: component pilots, CMS editor support, migration script for legacy strings, and Bind enhancements to resolve props lazily.

## Alternatives Considered

- Full ICU/FormatJS in Step 1: rejected to reduce complexity and risk during the initial migration.
- Per‑namespace bundles immediately: deferred to avoid churn in build and loading strategies until the foundation is stable.

## Consequences

- Pros
  - Reduced mid‑migration churn via locked naming and runtime contract.
  - Clear separation of static UI (`t`) vs CMS/prop content (`resolveText`).
  - Predictable fallback behavior and a documented plan for regional locales.

- Cons
  - Temporary duplication of EN phrases in `de`/`it` until translation is complete.
  - Extra discipline required to follow domain‑first naming consistently.

## Acceptance

- ADR is reviewed and approved by FE lead and CMS lead.
- Comments resolved; owners assigned.
- Step 2 can proceed only after this ADR is accepted.

## Examples

- Announcement bar
  - `announcementBar.close`
  - `announcementBar.cta`

- Actions
  - `actions.addToCart`
  - `actions.checkout`

- Checkout form (labels/placeholders/errors)
  - `forms.checkout.email.label`
  - `forms.checkout.email.placeholder`
  - `forms.checkout.email.error`

- Product
  - `product.price.from`
  - `product.shipping.free`

## Notes for Implementers

- Keep `en.json` as the source of truth during migration and use a fill‑locales helper to ensure `de.json` and `it.json` stay key‑synchronized.
- When renaming keys in Step 2, produce `docs/i18n/key-rename-map.md` mapping old → new keys to aid code reviewers and authors.
- After Step 3, verify SSR pages like `/de/...` and `/it/...` render localized content without hydration warnings.

