# No-JS Hostel Assisted-Booking Policy Copy

- Task: `TASK-06B`
- Verification date: `2026-03-01`
- Boundary source: `artifacts/octobook-enforcement-matrix.md` (TASK-01)

## Policy Basis

TASK-01 confirms Brikette must retain ownership of:
- adults-only hostel semantics,
- 2-8 night pre-handoff limits,
- max-8-adult pre-handoff limits.

Because these limits are not safely claimable as universally enforced post-handoff in Octobook, no-JS hostel paths use assisted booking copy instead of direct unconstrained engine links.

## Approved Copy

### `/[lang]/book` no-JS fallback

`Hostel bookings are handled with assisted support when JavaScript is disabled. Email us for assisted booking.`

CTA:
- `mailto:hostelpositano@gmail.com?subject=Hostel%20booking%20assistance`

### `/[lang]/dorms/[id]` no-JS fallback

`This hostel route uses assisted booking when JavaScript is disabled. Contact us for assisted booking.`

CTA:
- `mailto:hostelpositano@gmail.com?subject=Hostel%20room%20assistance`

## Context Fields Included in Assisted Path

- Channel: email
- Route context: `/book` or room-detail route
- Operator follow-up requirement: include requested dates, guest count, and room intent in reply thread.
