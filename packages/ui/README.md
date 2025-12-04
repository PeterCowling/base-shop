# @acme/ui

Shared design system and CMS UI components for the Acme platform.

It provides:

- Atoms/molecules/organisms/layout components used by storefront apps and CMS.
- CMS and Page Builder UI (blocks, navigational editors, media manager, shop chooser).
- Layout primitives and helpers for tenant apps.
- Size/tone guidance for atoms (Buttons/IconButtons/Tags/ProductBadges/Chips): `docs/size-tone-guide.md`.

For layering rules, public import surfaces, and platform vs tenant responsibilities, see:

- `docs/architecture.md` – package layering and public surfaces.
- `docs/platform-vs-apps.md` – platform vs apps responsibilities and public API.

New app code should import UI from `@acme/ui` (or the `@ui` alias) using the public entrypoints documented in those docs, rather than deep `src/` or `components/` paths.
