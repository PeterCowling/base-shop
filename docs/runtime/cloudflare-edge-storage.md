Type: Reference
Status: Canonical
Domain: Runtime
Last-reviewed: 2026-01-13

# Cloudflare Edge Storage

This document describes how cart, session, and rate-limiting data are stored when running on Cloudflare Workers/Pages.

## Overview

Cloudflare-native storage (Durable Objects and KV) is the preferred default for Workers deployments. This avoids cross-region hops to external Redis services and provides on-colo latency for cart and session operations.

Redis remains supported as an alternative backend for non-Worker runtimes or when Redis is preferred for operational reasons.

## Storage Primitives

| Surface | Storage | Binding | Why |
|---------|---------|---------|-----|
| Carts | Durable Object | `CART_DO` | Strong consistency, low-latency colocated state |
| Sessions | Durable Object | `SESSION_DO` | Read-after-write consistency, per-customer index |
| Login rate limiting | Cloudflare KV | `LOGIN_RATE_LIMIT_KV` | Cheap, eventual consistency acceptable for counters |

## Configuration

Provider selection is controlled via environment variables:

| Variable | Values | Default |
|----------|--------|---------|
| `CART_STORE_PROVIDER` | `cloudflare`, `redis`, `memory` | `cloudflare` on Workers |
| `SESSION_STORE_PROVIDER` | `cloudflare`, `redis`, `memory` | `cloudflare` on Workers |
| `RATE_LIMIT_STORE_PROVIDER` | `kv`, `redis` | `kv` on Workers |

When a Cloudflare provider is selected but the binding is missing, the store falls back to memory with a warning logged.

## Durable Object Classes

The following Durable Object classes must be declared in `wrangler.toml`:

```toml
[durable_objects]
bindings = [
  { name = "CART_DO", class_name = "CartDurableObject" },
  { name = "SESSION_DO", class_name = "SessionDurableObject" }
]

[[migrations]]
tag = "v1"
new_classes = ["CartDurableObject", "SessionDurableObject"]
```

## KV Namespaces

```toml
[[kv_namespaces]]
binding = "LOGIN_RATE_LIMIT_KV"
id = "<your-kv-namespace-id>"
```

## Implementation Files

- Cart DO: `packages/platform-core/src/cartStore/cloudflareDurableStore.ts`
- Session DO: `packages/auth/src/sessionDurableStore.ts`
- Rate limiter: `packages/auth/src/rateLimiter.ts`

## Performance

- Durable Objects should deliver single-digit ms latency when colocated with the Worker
- A warning is logged when DO operations exceed 200ms to flag placement issues
- Enable Smart Placement on Workers to automatically route to the optimal location

## Migration Between Providers

To switch between Redis and Cloudflare:

1. Ensure the target bindings exist (DO classes declared, KV namespace created)
2. Update the provider environment variable(s)
3. Deploy

No data migration is required because carts and sessions expire by TTL. New requests will use the new provider; existing sessions will naturally expire from the old store.

## Related Documentation

- [Persistence and DATA_ROOT](../persistence.md) - General persistence patterns
- [Runtime Charter](runtime-charter.md) - Runtime goals and contracts
- [Template Contract](template-contract.md) - Required runtime routes and env vars
