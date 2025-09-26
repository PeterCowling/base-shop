# @acme/cms-marketing — Agent Notes

Purpose: CMS marketing UIs and logic (campaigns, discounts, email scheduling, segments, shared UI).

Guidelines
- Keep domain logic here; avoid leaking into `@acme/ui`.
- Prefer integration tests; end-to-end flows can live in `apps/cms`.

Migration
- Move from `packages/ui/src/components/cms/marketing/**`.

