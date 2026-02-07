---
Type: Plan
Status: Draft
Domain: Inventory
Last-reviewed: 2026-01-18
Relates-to charter: none
---

# Inventory Reservation Service (Reserve TTL)

Status: Design stub for platform + worker convergence

## Purpose
Provide a shared reservation/hold mechanism so checkout can guarantee availability across runtimes (platform and worker) before payment, and release/commit holds on webhook finalization.

## Requirements
- Modes: `validate_only` (baseline) and `reserve_ttl` (target).
- Holds keyed by `(shopId, holdId)` with per-item quantities.
- TTL-based expiration; explicit release on failure/cancel; commit on webhook success.
- Idempotent create/update by `holdId` to handle retries.
- Emits a `holdId` returned from checkout creation; pass through Stripe metadata and persist on orders.

## API (conceptual)
- `createHold({ shopId, cartId, items }) -> { holdId, expiresAt }`
- `commitHold({ shopId, holdId })`
- `releaseHold({ shopId, holdId, reason })`
- `getHold({ shopId, holdId })`

## Stripe/Order Plumbing
- Include `inventory_reservation_id=holdId` in Stripe metadata.
- Persist `holdId` on the order.
- On webhook: commit the hold if payment succeeded; release if payment failed/expired.

## Storage Options
- Redis/Do/DB with atomic operations or row locking.
- Retention: holds expire automatically via TTL; background cleanup optional.

## Phasing
- Phase 1: keep `validate_only` (current).
- Phase 2: add `reserve_ttl` implementation behind a flag; add conformance tests gated by `capabilities.inventoryMode`.
- Phase 3: adopt `reserve_ttl` across runtimes; decommission bespoke checks.

## Active tasks

- **RESERVE-01**: Design storage layer for holds (Redis/DO/DB evaluation)
- **RESERVE-02**: Implement reserve_ttl API behind feature flag
- **RESERVE-03**: Add Stripe metadata and order plumbing for holdId
- **RESERVE-04**: Add conformance tests gated by capabilities.inventoryMode
