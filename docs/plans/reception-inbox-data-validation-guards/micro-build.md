# Micro-Build Record: Reception Inbox Data Validation Guards

**Date:** 2026-03-12
**Status:** Complete
**Dispatch:** dispatch.v2.json

## Issues Addressed

### Issue #25 -- Metadata schema validation on write

Thread `metadata_json` was written to the database without any shape validation, allowing malformed or unexpected fields to persist silently.

**Fix:**
- Added a Zod schema (`threadMetadataSchema`) in `repositories.server.ts` that defines every known metadata field with correct types
- Added `validateMetadata()` which validates metadata before every write path:
  - `createThread` -- validates before inserting both the JSON blob and promoted columns
  - `updateThreadStatus` -- validates before updating both the JSON blob and promoted columns
- Validation behaviour: unknown keys are silently stripped; if known fields have wrong types, a warning is logged and only the valid fields are kept (write is never rejected)
- The schema is exported for use in tests

### Issue #27 -- Duplicate admission outcomes accumulate

Every sync run inserted a new `admission_outcomes` row even when one already existed for the same thread and classifier version, causing unbounded row accumulation.

**Fix:**
- Changed `recordAdmission()` from a plain INSERT to an INSERT ... ON CONFLICT ... DO UPDATE (upsert) keyed on `(thread_id, classifier_version)`
- Added migration `0007_admission_outcomes_upsert_key.sql` which:
  1. Deduplicates existing rows (keeps latest per thread+classifier pair)
  2. Creates a unique index on `(thread_id, classifier_version)`
- Result: each thread retains at most one admission outcome per classifier version

## Files Changed

| File | Change |
|------|--------|
| `apps/reception/src/lib/inbox/repositories.server.ts` | Added Zod schema, validation function, metadata validation in write paths, upsert pattern for admission outcomes |
| `apps/reception/migrations/0007_admission_outcomes_upsert_key.sql` | Dedup + unique index for admission upsert |
| `apps/reception/src/lib/inbox/__tests__/metadata-validation.test.ts` | Unit tests for the metadata schema |

## Validation

- `pnpm --filter @apps/reception typecheck` -- passes
- Tests added for schema validation (runs in CI)
