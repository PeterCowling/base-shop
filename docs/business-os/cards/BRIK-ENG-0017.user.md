---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: BRIK-ENG-0017
Title: Prime Guest Portal - Gap Review and Bridge Plan
Business: BRIK
Tags:
  - plan-migration
  - prime
Created: '2026-01-17'
Updated: '2026-01-17'
---
# Prime Guest Portal - Gap Review and Bridge Plan

**Source:** Migrated from `prime-guest-portal-gap-plan.md`


# Prime Guest Portal - Gap Review and Bridge Plan

## Summary
Prime currently ships a minimal shell with staff lookup and placeholder pages, but it does not implement the UUID-based guest portal or the pre-arrival/arrival flow in the updated feature set. This plan records the current state (code truth), maps gaps against the new spec, and defines a staged bridge plan that preserves the no-payments, keycard-only, mobile web constraints.

## Constraints (from updated spec)
- Mobile-only web app (link-based, no account creation).
- One guest = one UUID-based session (tokenized deep link).
- No digital keys; keycards only.
- No in-app payments (city tax + deposit handled offline).
- Pre-arrival engagement depends on messaging (email/WhatsApp/SMS), not push.

## Current State (code truth)
- Landing page only links to find-my-stay and staff lookup: `apps/prime/src/app/page.tsx`.
- Find-my-stay collects surname + booking reference and redirects to the guest portal link: `apps/prime/src/app/find-my-stay/page.tsx`, `apps/prime/functions/api/find-booking.ts`.
- Tokenized guest entry exists via `/g/<token>` redirect and `/api/guest-session` verification gate: `apps/prime/functions/g/[token].ts`, `apps/prime/functions/api/guest-session.ts`, `apps/prime/src/app/g/page.tsx`.
- Guest portal placeholder exists after verification: `apps/prime/src/app/portal/page.tsx`.

[... see full plan in docs/plans/prime-guest-portal-gap-plan.md]
