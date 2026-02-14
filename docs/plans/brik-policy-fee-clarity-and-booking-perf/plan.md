---
Type: Plan
Status: Draft
Domain: BRIK / Web
Workstream: Engineering
Created: 2026-02-14
Last-updated: 2026-02-14
Last-reviewed: 2026-02-14
Feature-Slug: brik-policy-fee-clarity-and-booking-perf
Related-Fact-Find: docs/plans/brik-policy-fee-clarity-and-booking-perf/fact-find.md
Relates-to:
  - docs/business-os/site-upgrades/BRIK/2026-02-12-upgrade-brief.user.md
  - docs/business-os/strategy/BRIK/2026-02-13-prioritization-scorecard.user.md
  - docs/business-os/strategy/BRIK/2026-02-13-weekly-kpcs-decision.user.md
---

# Plan: BRIK Policy/Fee Clarity + Booking-Step Performance Hardening (P1)

## Objective
Ship a policy/fee clarity module on booking-critical routes and harden booking-step mobile performance.

## Non-Goals
- Member-rate experiment module (separate P1).
- Cancellation reason instrumentation (separate P1).

## Deliverables
1. Shared policy/fee clarity UI component integrated into hostel + apartment booking surfaces.
2. Structured data model + i18n keys for deterministic rendering.
3. Test coverage for:
   - rendering correctness
   - locale parity / missing keys
   - safety assertions (mandatory fees cannot be omitted)
4. Booking-route performance harness/guardrail suitable for tracking p75 <= 2.5s over time.

## Tasks

### TASK-01: Confirm Policy/Fee Source-of-Truth (Decision)
- Decide where policy/fee truth lives:
  - Option A: typed TS config + per-locale translation keys (preferred for determinism)
  - Option B: per-locale JSON-only
- Define required fields:
  - fees[] (name, whenApplies, amountModel, required)
  - cancellationSummary (headline, bullets, link)
  - trustStack (support channel, payment cue)

Acceptance:
- A single schema exists and is referenced by UI.

Confidence: 70% (blocked on confirming real-world fee/policy details).

### TASK-02: Implement `PolicyFeeClarityPanel` (Shared Component)
- Add shared component under `apps/brikette/src/components/`.
- Render:
  - Fee summary (including “mandatory fees” callout)
  - Cancellation/refund summary
  - Link to full policy page/section
  - Support/contact cue

Acceptance:
- Component can render from structured model + i18n keys.

Confidence: 85%.

### TASK-03: Integrate Panel Into Booking Flows
- Hostel: integrate into `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx`.
- Apartment: integrate into `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx`.

Acceptance:
- Panel is visible pre-handoff to the external booking engine in both flows.

Confidence: 85%.

### TASK-04: Translation + Locale Parity Tests
- Add required i18n keys.
- Add tests that fail when:
  - required keys are missing for any supported locale
  - required fee items are absent

Acceptance:
- CI catches missing translation/policy keys before deploy.

Confidence: 80%.

### TASK-05: Booking-Route Performance Hardening + Guardrail
- Identify “booking-critical routes” in-app and add a targeted perf harness.
- Add at least one measurable guardrail check that can be run in CI (fast) and one that can be run locally/headful (slower) to approximate p75 performance regressions.

Acceptance:
- A reproducible method exists to evaluate booking-step performance changes and detect regressions.

Confidence: 75% (depends on existing perf tooling fit in `apps/brikette`).

### TASK-06: Validation
- `pnpm --filter @apps/brikette typecheck`
- Targeted tests for files touched (limit workers as needed).

Acceptance:
- All validation passes.

Confidence: 90%.

## Open Questions
- Exact fee model and cancellation rules to display (hostel vs apartment).
- Supported locales list for the parity test.

## What Would Make This >=90%
- Confirm canonical policy + fee data inputs (names, amounts/models, applicability) for each product.
- Identify the existing i18n system + locale list used by `apps/brikette` and lock it into a parity test.
- Locate existing performance harness/scripts for Brikette booking routes and reuse rather than invent.

