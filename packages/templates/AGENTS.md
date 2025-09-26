# @acme/templates — Agent Notes

Purpose: App/domain templates and block implementations (ProductDetail, Checkout, Order*, StoreLocator, etc.).

Guidelines
- Keep domain behavior here; UI primitives remain in `@acme/ui`.
- Prefer integration tests; app‑level flows validated in `apps/cms`.

Migration
- Move from `packages/ui/src/components/templates/**` and domain blocks under `.../cms/blocks/**`.

