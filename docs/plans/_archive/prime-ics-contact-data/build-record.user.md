---
Type: Build-Record
Feature-Slug: prime-ics-contact-data
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-001
Business: BRIK
Completed: 2026-03-13
Execution-Track: code
artifact: build-record
---

# Prime ICS Contact Data — Build Record

## What Was Done

Fixed two incorrect hardcoded values in the prime guest app's calendar invite generator (`generateIcs.ts`):

- **Phone number**: replaced fake placeholder `+39 089 123 4567` with the real hostel number `+39 328 707 3695` (sourced from `WHATSAPP_URL` in `apps/brikette/src/config/hotel.ts`)
- **Street address**: replaced `Via Cristoforo Colombo 13` with the correct address `Via Guglielmo Marconi 358` (sourced from `hotel.ts` address block)
- Removed the `// TODO: Update with real phone` comment

Two lines changed in one file. Typecheck passed clean.

## Outcome Contract

- **Why:** When a guest adds their check-in to their phone calendar, the invite shows the wrong phone number and the wrong street address for the hostel. A guest relying on the calendar invite to navigate or call could end up at the wrong place or call a non-existent number.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** generateIcs.ts uses the real hostel phone (+39 328 707 3695) and real address (Via Guglielmo Marconi 358) consistent with the brikette hotel config.
- **Source:** operator

## Engineering Coverage Evidence

Change is two constant string values. No logic paths changed. Typecheck (`pnpm --filter @apps/prime typecheck`) passed. `validate-engineering-coverage.sh` returned `valid: true, skipped: true` (micro-build artifact type — no TC contract required).

## Workflow Telemetry Summary

- Stage: lp-do-build
- Context input bytes: 36329
- Artifact bytes: 1715
- Modules: build-code.md
- Deterministic checks: validate-engineering-coverage.sh (valid: true, skipped: true)
- Notes: Direct-dispatch micro-build — lp-do-ideas, fact-find, analysis, plan stages bypassed per micro-build lane.
