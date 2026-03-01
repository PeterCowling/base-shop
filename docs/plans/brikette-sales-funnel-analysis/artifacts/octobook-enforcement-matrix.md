# Octobook Enforcement Matrix (GV-01)

- Task: `TASK-01`
- Plan: `docs/plans/brikette-sales-funnel-analysis/plan.md`
- Verification date: `2026-03-01`
- Investigator: `Codex`

## Evidence Log

### E1 — Direct handoff with valid hostel-like query
- URL:
  `https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&checkin=2026-06-10&checkout=2026-06-13&pax=2&adulti=2`
- Observation ID: `obs_d1420a3b-1469-46c5-bb49-cc3381ea191b`
- Result summary: Result page loaded with room offers (`primaryHeading: Dorm`).

### E2 — Direct handoff with over-limit pax (`pax=9`)
- URL:
  `https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&checkin=2026-06-10&checkout=2026-06-11&pax=9&adulti=9`
- Observation ID: `obs_ff925511-865b-44db-b57e-99f9329132a6`
- Result summary: Engine accepted the URL and rendered `No results found!` (not a hard pre-submit block contract owned by Brikette).

### E3 — Post-handoff calendar flow remains available
- Action: Clicked `Availability` from no-results page.
- Observation ID: `obs_96aa67fb-97fc-4807-b4fb-8903069c47c3`
- Result summary: User can continue in Octobook calendar flow and pick rooms directly.

### E4 — Calendar details show engine-owned minimum-stay rules by date
- Action: Opened room calendar entry from availability page.
- Observation ID: `obs_e7da237d-8c01-4550-967d-66f648c8d924`
- Result summary: Calendar cells include text like `Minimum length of stay 1` and `Minimum length of stay 2`, demonstrating that post-handoff availability constraints are engine-managed and date/rate dependent.

## Contract Ownership Matrix

| Contract | Brikette pre-handoff | Octobook post-handoff | Owner classification | Notes |
|---|---|---|---|---|
| Stay length `2..8` nights | Yes (implemented in `bookingDateRules` + URL builder guards) | Partially (calendar shows dynamic minimum stays; no evidence of hard max-8 policy) | `Both` | Brikette must continue hard pre-handoff enforcement; Octobook behavior is not equivalent to Brikette policy contract. |
| Max `8` adults | Yes (Brikette validation + URL guard) | Not proven as hard rule (engine accepts URL with `pax=9` and returns no-results) | `Brikette` | Treat as Brikette-owned contract. Octobook no-results outcome is not deterministic policy enforcement wording. |
| Adults-only hostel semantics | Yes (Brikette surface/copy/flow contract) | Not verified as hard engine-level invariant in this run | `Brikette` | Keep adults-only messaging and assisted guidance in Brikette; avoid claiming guaranteed post-handoff enforcement. |

## Mitigation Wording (for non-enforceable post-handoff contracts)

- Use this boundary-safe copy in no-JS/assisted and fallback surfaces:
  - `Hostel bookings are configured for adults and short stays. If your request is outside direct-booking limits, contact us and we will prepare the right option for your group.`
- Avoid this over-claim:
  - `Octobook enforces all Brikette booking limits automatically.`

## Decision

- Brikette must keep all three contracts as first-class pre-handoff guards.
- Post-handoff engine behavior can support availability handling, but does not replace Brikette policy ownership for `2..8` nights, max `8` adults, and adults-only messaging.
