---
Type: Reference
Status: Active
Domain: Business-OS
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
---

# Growth Ledger Store Contract (v1)

## Path Contract

- Ledger path: `data/shops/{shopId}/growth-ledger.json`
- Current `shopId` convention: business code (for example `HEAD`, `PET`)

## APIs

- `readGrowthLedger(shopId, options)`:
  - Returns `GrowthLedger | null`
  - Returns `null` when ledger is missing
  - Throws on invalid JSON or schema mismatch
- `writeGrowthLedger(shopId, ledger, options)`:
  - Atomic write via temp file + rename
  - Never leaves partial JSON at target path
- `updateGrowthLedger({ shopId, expectedRevision?, computeNext, options })`:
  - CAS-safe update wrapper
  - Returns `{ changed, ledger }`

## Revision and Idempotency Rules

- `ledger_revision` increments only when persisted content changes.
- Same-input update is a no-op (`changed=false`) and preserves revision.
- CAS mismatch throws `GrowthLedgerConflictError(expectedRevision, actualRevision)`.

## Atomicity and Durability

- Temp file naming: `growth-ledger.json.tmp-{pid}-{timestamp}`
- Write flow:
  1. Ensure parent directory exists.
  2. Write canonical JSON bytes to temp file.
  3. Rename temp file to target path.
  4. Cleanup temp file on failure path.

## Canonical Serialization

- Serialization uses stable key ordering.
- Byte-identical payloads are treated as unchanged.
- This supports deterministic replay and idempotent retries.

## Operational Notes

- `BASESHOP_GOVERNED_CONTEXT` and test-governor policy are orthogonal to store behavior.
- Store APIs are safe to call from S10 integration and replay workflows.

