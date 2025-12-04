Type: Guide
Status: Active
Domain: i18n
Last-reviewed: 2025-12-02

# i18n Key Rename Map (old → new)

Purpose: track key renames as we standardize on domain‑first naming. This helps editors and engineers update references without guesswork.

Status: Initial seed — no changes required. Current keys already follow domain‑first patterns in `packages/i18n/src/en.json`.

Conventions
- Domain → feature → field → role, e.g. `forms.checkout.email.label`.
- Reusable actions: `actions.*` (e.g., `actions.addToCart`).
- Reusable errors: `errors.*`.

How to use this file
- When a key is renamed, add a row to the table and update usages in code and content fixtures.
- Keep the list sorted by old key for quick lookup.

| Old key | New key | Notes |
| --- | --- | --- |
| – | – | No renames in this phase |

Related
- ADR: `docs/adr/adr-00-i18n-foundation.md`
- Source of truth: `packages/i18n/src/en.json`
