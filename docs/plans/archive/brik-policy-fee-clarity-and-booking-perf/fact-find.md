---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: BRIK / Web
Workstream: Engineering
Created: 2026-02-14
Last-updated: 2026-02-15
Last-reviewed: 2026-02-15
Feature-Slug: brik-policy-fee-clarity-and-booking-perf
Deliverable-Type: multi-deliverable
Execution-Track: mixed
Primary-Execution-Skill: /lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/archive/brik-policy-fee-clarity-and-booking-perf/plan.md
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID:
Relates-to:
  - docs/business-os/site-upgrades/BRIK/2026-02-12-upgrade-brief.user.md
  - docs/business-os/strategy/BRIK/2026-02-13-prioritization-scorecard.user.md
  - docs/business-os/strategy/BRIK/2026-02-13-weekly-kpcs-decision.user.md
---

# BRIK Policy/Fee Clarity + Booking-Step Performance Hardening (P1) - Fact-Find

## Why This Exists
This is the next P1 execution item for BRIK after GA4 baseline lock. The upgrade brief calls out (a) policy/fee transparency as a direct trust and late-stage drop-off lever, and (b) mobile booking performance as a near-term conversion lever.

Source acceptance criteria (decision-grade):
- Policy/fee block shipped on booking-critical routes.
- Booking-step p75 <= 2.5s sustained for 7 days.

## Scope
In-scope (P1-02):
- A deterministic, i18n-backed policy/fee clarity module surfaced before handing off to the third-party booking engine.
- Mobile booking-step performance hardening on the same booking-critical routes.
- Tests that prevent regressions (rendering, i18n parity, safety assertions like “never hide mandatory fees”).

Out-of-scope (explicitly separate P1s):
- Member-rate experiment module (separate P1 in S6 brief).
- Cancellation reason instrumentation (separate P1).
- GA4 report-layer non-zero confirmation (still required for loop health, but not a blocker for this UI work).

## Repo Evidence / Entry Points
Booking-critical UI entry points (agent-found):
- Apartment booking page content: `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx`
- Hostel room booking CTA -> modal: `apps/brikette/src/components/rooms/RoomCard.tsx` (opens modal key `booking2`)
- Booking modal: `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx`

Source “must” requirements (upgrade brief):
- Cancellation/refund policy summary colocated with primary booking CTA.
- Multilingual parity checks on booking-critical routes.
- Structured policy/fee data model for deterministic rendering.

## Gaps / Decisions Needed
These must be resolved (or explicitly encoded as assumptions) in the plan so we don’t ship ambiguous/incorrect policy copy.

- Canonical fee components and when they apply (examples: city tax, service fee, cleaning fee, deposit).
- Canonical cancellation/refund rules by product (hostel vs apartment) and by rate/season if applicable.
- Where the “source of truth” should live in repo (translations vs structured JSON config vs CMS source).

## Proposed Implementation Shape (Planning-Ready)
- Introduce a single shared component, e.g. `PolicyFeeClarityPanel`, used in both booking surfaces.
- Back it with a typed, structured data model (not hardcoded strings) and translations.
- Add parity tests to enforce that required policy/fee keys exist for supported locales.
- Add a perf guardrail harness scoped to booking routes (targeted, not full-site).

## Success Criteria
- Policy/fee clarity panel is visible pre-handoff on:
  - Hostel booking modal flow.
  - Apartment booking page flow.
- Panel renders in all supported locales; missing keys fail tests.
- No mandatory-fee states can be omitted without failing tests.
- Performance instrumentation exists for booking routes, with a clear method to evaluate p75 over time.

