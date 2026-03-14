# Pattern Reflection: caryina-runtime-state-workers-compat

**Date:** 2026-03-14

## Patterns

- **Optimistic-create + P2002 catch for idempotency gates** — Using `prisma.model.create` as the atomic gate and catching P2002 (unique constraint violation) to detect concurrent duplicates is a clean Workers-compatible replacement for file-lock-based mutual exclusion. Observed in this build; could recur whenever another checkout or reservation flow needs idempotency without a Redis lock. Category: reusable implementation pattern. Observed: 1 time.

## Access Declarations

None
