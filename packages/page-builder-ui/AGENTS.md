# @acme/page-builder-ui — Agent Notes

Purpose: React UI for page‑builder (canvas, panels, DnD, rulers, comments, versions, collab). Integration‑level tests preferred.

Guidelines
- Keep React concerns here; defer pure logic to `@acme/page-builder-core`.
- Avoid direct data fetching. Consume app/domain services from the CMS app or dedicated packages.

Migration
- Move React components from `packages/ui/src/components/cms/page-builder/**` here.
- Test flows (DnD, canvas transforms, presence) in this package or `apps/cms`.

