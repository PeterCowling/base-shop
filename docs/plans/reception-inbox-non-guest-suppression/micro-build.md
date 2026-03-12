---
Type: Micro-Build
Status: Complete
Created: 2026-03-11
Last-updated: 2026-03-11
Feature-Slug: reception-inbox-non-guest-suppression
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260311182000-9601
Related-Plan: none
---

# Reception Inbox Non-Guest Suppression Micro-Build

## Scope
- Change:
  - Harden the Gmail organizer and Reception admission classifiers so obvious vendor/newsletter/promotional mail does not surface in the Reception inbox.
  - Add regression coverage for a concrete non-guest promotional case using the Italian subject `Il caldo arriva, gli infestanti anche. Proteggiti ora`.
- Non-goals:
  - Re-architect the entire inbox ingestion flow around Gmail labels in this build.
  - Add LLM-based classification or external sender reputation services.
  - Hide all unknown senders; legitimate guest/prospect mail must still reach Reception when it shows real hospitality intent.

## Execution Contract
- Affects:
  - `apps/reception/src/lib/inbox/admission.ts`
  - `apps/reception/src/lib/inbox/__tests__/admission.test.ts`
  - `packages/mcp-server/src/tools/gmail-classify.ts`
  - `packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts`
- Acceptance checks:
  - Obvious non-guest promotional/vendor subjects are classified as non-customer promotional mail in both Gmail organize and Reception admission.
  - The example subject `Il caldo arriva, gli infestanti anche. Proteggiti ora` does not route to the Reception inbox.
  - Existing guest booking-question behavior remains admitted.
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
  - `pnpm --filter @acme/mcp-server typecheck`
  - `pnpm --filter @acme/mcp-server lint`
- Rollback note:
  - Revert the added vendor/promotional heuristics and their tests if they suppress legitimate guest mail.

## Outcome Contract
- **Why:** Reception currently reclassifies raw Gmail threads itself, so some obvious non-guest promotional emails can still surface in the inbox instead of being suppressed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Obvious non-guest promotional/vendor emails are auto-archived consistently by both Gmail organize and Reception admission, so they do not surface in the Reception inbox.
- **Source:** operator

## Build Evidence
- Added explicit vendor/promotional subject heuristics to both classifier copies so obvious non-guest marketing subjects are treated as `promotional` rather than falling through to `review-later`.
- Pinned the Reception-side behavior with a regression test that uses the exact Italian subject `Il caldo arriva, gli infestanti anche. Proteggiti ora`.
- Pinned the Gmail-organize behavior with a dry-run classification test showing the same Italian promotional email is routed to `Brikette/Outcome/Promotional` instead of `Needs-Processing`.
- Kept the build intentionally bounded: this tranche hardens the current heuristics without yet re-architecting Reception to consume Gmail labels as the sole source of truth.

## Validation
- `pnpm --filter @apps/reception typecheck` — pass
- `pnpm --filter @apps/reception lint` — pass with 13 pre-existing warnings, no new errors
- `pnpm --filter @acme/mcp-server typecheck` — pass
- `pnpm --filter @acme/mcp-server lint` — pass

## Remaining Follow-up
- `lp-do-ideas` queue-state writeback to `docs/business-os/startup-loop/ideas/trial/queue-state.json` did not complete in this session because the shared writer lock timed out after 5 minutes behind another active holder.
- The larger architectural fix still stands: unify Gmail organize and Reception admission onto one shared classifier and consider quarantining ambiguous unknown mail outside the main Reception inbox.
