---
Type: Results-Review
Status: Draft
Feature-Slug: reception-rbac-pin-user-roles
Review-date: 2026-02-27
artifact: results-review
---

# Results Review

## Observed Outcomes

- `usersRecordSchema.parse()` now passes `roles` through correctly; 5/5 tests pass confirming the schema round-trip.
- All five PIN users in `.env.local` have populated `UserRole[]` roles (Pete/Serena=owner, Alessandro/Dom=staff, Cristiana=admin).
- `getUserByPin.ts` is clearly marked `@deprecated`, reducing future confusion about whether it feeds the auth flow.
- `NEXT_PUBLIC_USERS_JSON` is now documented in `.env.example` with format, valid roles, and example entry.
- Pre-existing broken test harness (`import.meta.env.VITE_USERS_JSON`) replaced with a working `jest.isolateModules` pattern — the test suite was non-executable before this build.

## Standing Updates

- `apps/reception/.env.example`: updated with `NEXT_PUBLIC_USERS_JSON` section — change is committed and reflects current required dev setup.
- No standing-layer (Layer A) artifact requires update — this was a local config + schema fix, not a strategy or product decision.

## New Idea Candidates

- Fix `OPERATIONS_ACCESS` to include admin/manager roles | Trigger observation: `roles.ts` gives staff `OPERATIONS_ACCESS` but not admin/manager — Cristiana can reach management features but not basic operations features Alessandro can reach. Likely an omission in the original permissions design. | Suggested next action: create card
- Wire `getUserByPin` into auth flow for shift-PIN staff | Trigger observation: `getUserByPin` is fully functional but unwired; marked `@deprecated` for now. A shift-PIN login path (staff who share a single Firebase account) would use this. | Suggested next action: defer
- AI-to-mechanistic: add schema validation for `NEXT_PUBLIC_USERS_JSON` at startup | Trigger observation: schema parse errors are swallowed silently (`users = {}`); a startup-time validation log line would surface misconfiguration immediately | Suggested next action: spike

## Standing Expansion

No standing expansion: no new standing data sources, no new Layer A artifacts, and no new agent processes were introduced by this build.

## Intended Outcome Check

- **Intended:** `usersRecordSchema` passes `roles` through; `.env.local` has roles populated for all five PIN users; schema confirmed by test.
- **Observed:** Schema fix verified by 2 new round-trip tests (pass). `.env.local` updated and verified by node parse script (5/5 users, all roles valid). `getUserByPin.ts` deprecated and documented. `.env.example` updated.
- **Verdict:** Met
- **Notes:** The schema fix is forward-looking (getUserByPin is not wired into runtime auth yet). The env.local update is local-only (gitignored). Firebase profile roles remain a prerequisite for the broader RBAC migration to be fully effective at runtime — this is documented as a risk in the plan and is out of scope here.
