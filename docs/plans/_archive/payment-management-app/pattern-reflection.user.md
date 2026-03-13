---
schema_version: pattern-reflection.v1
feature_slug: payment-management-app
generated_at: 2026-03-13T21:07:52.239Z
entries: []
---

# Pattern Reflection

## Patterns

- **Async provider resolution with fallback**: Making a synchronous env-var read async (PM fetch + revalidate + fallback) required updating all callers. The pattern of wrapping the fetch in a try/catch that silently falls through to the env var worked cleanly. Applicable to any config that needs to be hot-switchable at runtime.
- **Service-to-service auth via x-internal-token**: The `/api/internal/*` middleware exemption + `x-internal-token` header pattern (first used in `/api/internal/orders`) scales cleanly to new PM endpoints. Token checked with `timingSafeEqual`; fails closed when env var is unset.
- **Proxy route as admin interface**: Creating an `/admin/api/refunds` route that proxies to PM avoids duplicating auth logic and keeps the PM as the single source of truth. The proxy forwards status codes verbatim — PM error messages reach the caller without wrapping.

## Access Declarations

- apps/caryina: extended — new admin proxy route + async provider resolution
- apps/payment-manager: extended — new internal shop-config endpoint
- packages/platform-core: extended — new idempotent seed migration
