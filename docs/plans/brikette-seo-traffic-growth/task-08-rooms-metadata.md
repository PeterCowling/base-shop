---
Type: Task-Artifact
Task-ID: TASK-08
Plan: docs/plans/brikette-seo-traffic-growth/plan.md
Created: 2026-02-22
---

# TASK-08 — /en/rooms meta description optimization

## Baseline (Red)

- Source of truth confirmed in `apps/brikette/src/locales/en/roomsPage.json`.
- Pre-change EN metadata:
  - `meta.title`: `Rooms & Rates | Brikette Hostel Positano`
  - `meta.description`: descriptive, but without an explicit numeric price anchor.
- Task objective: increase booking-intent clarity for page-1 query impressions.

## Implemented (Green)

- Updated EN rooms metadata title:
  - `Positano Hostel Rooms & Rates | Book Direct at Brikette`
- Updated EN rooms metadata description:
  - includes price signal (`from EUR 55/night`)
  - includes direct booking CTA (`book direct`)
  - keeps room-type intent (`private rooms` + `dorm beds`)

## Hardening (Refactor)

- Added focused metadata copy test:
  - `apps/brikette/src/test/app/rooms-metadata-copy.test.ts`
- Spot-check guard in test ensures IT/DE/FR rooms metadata remains populated after EN copy change.

## Validation Evidence

- `pnpm --filter @apps/brikette test -- src/test/app/rooms-metadata-copy.test.ts` (pass)
- `pnpm --filter @apps/brikette test -- src/test/lib/metadata.test.ts` (pass)
- `pnpm --filter @apps/brikette typecheck` (pass)

## Acceptance Mapping

- Description includes booking-intent signal + price anchor: pass.
- Title includes Positano and room-intent terms: pass.
- Existing metadata tests pass: pass.
- Locale spot-check (IT/DE/FR): pass (test-backed).
