---
Type: Micro-Build
Status: Active
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-room-numbers-in-draft
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260307153740-9205
Related-Plan: none
---

# Pass Guest Room Numbers to Draft Generation Micro-Build

## Scope
- Change: Add `guestRoomNumbers` to the draft generation context so the LLM template system can reference guest room numbers when composing replies. Thread it from `ThreadContext` through `DraftGenerationInput` to slot resolution, and pass it at all three call sites (sync, recovery, regenerate).
- Non-goals: Changing template content to use room numbers (that is a separate content task). Adding room numbers to the UI display.

## Execution Contract
- Affects: `draft-pipeline.server.ts`, `draft-core/generate.ts`, `sync.server.ts`, `recovery.server.ts`, `regenerate/route.ts`
- Acceptance checks: TypeScript compiles, lint passes, `guestRoomNumbers` flows from metadata to `generateDraftCandidate` at all call sites
- Validation commands: `pnpm typecheck && pnpm lint`
- Rollback note: Revert single commit; no DB migration, no runtime behaviour change for existing templates

## Outcome Contract
- **Why:** Draft responses cannot reference guest room numbers even though the data is already captured, limiting personalization quality
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Draft generation pipeline receives guest room numbers as context, enabling future templates to reference rooms in personalized responses
- **Source:** auto
