---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: QA | E2E | Browser Compatibility | Sales
Workstream: Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: brikette-live-sales-funnel-smoke
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brikette-live-sales-funnel-smoke/plan.md
Trigger-Why: Brikette has user feedback that the live sales funnel may fail outside Chrome, and the conversion path needs reusable, high-confidence coverage.
Trigger-Intended-Outcome: type: measurable | statement: Brikette has layered sales-funnel coverage: a reusable live cross-browser smoke suite for the public production funnel and an expanded deterministic booking-contract suite that covers homepage, dorm booking, room-detail sticky CTA, and private-accommodation handoffs. | source: operator
---

# Brikette Live Sales Funnel Smoke Fact-Find Brief

## Scope
### Summary
The existing live usability suite verifies general site interactions, but it does not prove the commercial conversion path end to end. Separately, the existing `test:booking-funnel-contracts` bundle covers only part of the funnel and misses several critical handoff surfaces, notably homepage widget routing, room-detail sticky checkout, and apartment/private-accommodation booking matrices. The right fix is layered: production-safe cross-browser smoke for the real public funnel, backed by a broader deterministic CI contract bundle for the core booking logic.

### Goals
- Add a dedicated live sales-funnel smoke runner for production-safe cross-browser checks.
- Reuse the current script-based live smoke model instead of inventing another browser harness.
- Expand the deterministic booking-funnel contract suite so critical handoff surfaces are covered in CI even when live smoke is not running.
- Capture failure artifacts automatically so browser-specific funnel reports are actionable.

### Non-goals
- Replacing the broader live usability suite.
- Full-site crawl coverage.
- Local Playwright execution.
- Rewriting booking funnel behavior in this task.

### Constraints & Assumptions
- Constraints:
  - Live smoke must remain read-only and production-safe.
  - Repo policy keeps e2e execution in CI; the suite must be runnable there with uploaded artifacts.
  - Sales funnel selectors need to be robust across current browser engines and mobile emulation.
- Assumptions:
  - The public commercial entry points that matter most are `/en`, `/en/book-dorm-bed`, `/en/dorms/[id]`, and `/en/book-private-accommodations`.
  - A layered proof model is stronger than relying on a single live smoke path.

## Outcome Contract
- **Why:** Brikette has user feedback that the live sales funnel may fail outside Chrome, and the conversion path needs reusable, high-confidence coverage.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Brikette has layered sales-funnel coverage: a reusable live cross-browser smoke suite for the public production funnel and an expanded deterministic booking-contract suite that covers homepage, dorm booking, room-detail sticky CTA, and private-accommodation handoffs.
- **Source:** operator

## Access Declarations
- External data source: `https://hostel-positano.com` (public website, read-only browser access). Access type: anonymous web access. Status: UNVERIFIED.
- External system: GitHub Actions workflow runner. Access type: repository CI execution. Status: UNVERIFIED.

## Evidence Audit (Current State)
### Entry Points
- `apps/brikette/scripts/e2e/brikette-live-usability.mjs` - current live smoke runner; checks general usability only.
- `apps/brikette/package.json` - current package entry points for live usability and booking-funnel unit contracts.
- `.github/workflows/brikette-live-usability-smoke.yml` - existing production smoke workflow shape.
- `.github/workflows/brikette-booking-funnel-contracts.yml` - deterministic booking-contract CI workflow.
- `apps/brikette/src/components/landing/BookingWidget.tsx` - homepage widget entry into commercial search.
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` - main dorm/private comparison booking surface.
- `apps/brikette/src/components/rooms/RoomCard.tsx` - room-card CTA handoff logic to Octorate.
- `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx` - room-detail sticky CTA handoff path.

### Key Modules / Files
- `apps/brikette/scripts/e2e/brikette-live-usability.mjs`
  - Uses the right script-runner model for production, but only covers homepage/help/transport interactions.
- `apps/brikette/src/components/landing/BookingWidget.tsx`
  - Pushes users to `getBookPath(lang)` with `checkin`, `checkout`, and `pax`.
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
  - Hydrates booking state from URL, drives room-card query state, and renders the main room comparison surface.
- `apps/brikette/src/components/rooms/RoomCard.tsx`
  - Converts valid search state into `result.xhtml` Octorate URLs for flexible and non-refundable CTAs.
- `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`
  - Wires sticky CTA checkout on room detail pages through `trackThenNavigate`.
- `apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx`
  - Public private-accommodations booking route; uses shared booking content with private inventory.

### Patterns & Conventions Observed
- The production-safe smoke path already uses direct `playwright` scripting rather than Playwright Test discovery.
- Booking funnels expose stable accessible roles for CTA buttons and links, plus deterministic hidden date inputs for date-state control.
- The current booking-contract suite is intentionally curated, so coverage expansion belongs in the same targeted script instead of a second disconnected unit command.

### Dependency & Impact Map
- Upstream dependencies:
  - `playwright` package and browser installs in CI
  - public commercial route labels and booking controls
  - existing booking-funnel unit test files
- Downstream dependents:
  - production issue triage for browser-specific conversion failures
  - CI regression gates for booking logic
  - future launch/SEO audits that need funnel proof

### Test Landscape
#### Existing Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| live usability | production script smoke | `apps/brikette/scripts/e2e/brikette-live-usability.mjs` | Good for generic UX, not funnel-complete. |
| homepage CTA analytics | unit | `apps/brikette/src/test/components/ga4-cta-click-header-hero-widget.test.tsx` | Covers click payloads, not live handoff. |
| dorm room-card handoff | unit | `apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx`, `apps/brikette/src/test/utils/buildOctorateUrl.test.ts` | Covers room-card logic, not full public route stack. |
| sticky CTA URL prop | unit | `apps/brikette/src/test/components/sticky-book-now-octorate-url-prop.test.tsx` | Narrow component contract only. |

#### Coverage Gaps
- No dedicated live cross-browser smoke for the public sales funnel.
- No current live proof for homepage widget -> booking page -> Octorate handoff.
- No live proof for room-detail sticky CTA handoff.
- Deterministic contract suite omits apartment/private booking matrix, sticky handoff matrix, and homepage widget routing contract.

#### Recommended Test Approach
- Extract a reusable live-smoke harness with artifact capture.
- Add a dedicated live sales-funnel smoke runner covering:
  - homepage CTA
  - homepage booking widget
  - dorm booking page non-refundable and flexible handoffs
  - room-detail sticky CTA handoff
  - private-accommodations booking page non-refundable and flexible handoffs
- Expand `test:booking-funnel-contracts` to include missing homepage, sticky, and apartment matrix suites.

## Questions
### Resolved
- Q: Is the existing live smoke runner the right base seam?
  - A: Yes. The repo already uses a production-safe script-runner pattern with direct Playwright usage.
  - Evidence: `apps/brikette/scripts/e2e/brikette-live-usability.mjs`
- Q: Does the current deterministic funnel suite already cover the whole conversion path?
  - A: No. It excludes key homepage, sticky, and apartment/private-booking tests.
  - Evidence: `apps/brikette/package.json`, `.github/workflows/brikette-booking-funnel-contracts.yml`
- Q: Are there stable public entry points to test the funnel live?
  - A: Yes. Homepage, booking page, room-detail pages, and private-accommodations booking routes are all first-class public routes.
  - Evidence: `apps/brikette/src/components/landing/BookingWidget.tsx`, `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`, `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`, `apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx`

### Open (Operator Input Required)
- None.

## Confidence Inputs
- Implementation: 92%
  - Evidence basis: bounded changes across one harness, one live suite, one workflow, and one package-level unit bundle expansion.
- Approach: 91%
  - Evidence basis: layered proof model closes both live-browser and deterministic-logic gaps.
- Impact: 92%
  - Evidence basis: directly targets the commercial breakpoints the user cannot reproduce locally in Chrome.
- Delivery-Readiness: 94%
  - Evidence basis: no external credentials or architecture changes required.
- Testability: 84%
  - Evidence basis: CI-only execution still limits local proof, but the new artifact capture improves diagnosis materially.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Live inventory availability disables some room CTAs for chosen dates | Medium | Medium | Pick valid future dates and select the first enabled matching CTA rather than hardcoding one room card. |
| Browser-specific failures are hard to reproduce from logs alone | Medium | High | Capture screenshots, traces, and a JSON summary for each failing case. |
| Expanded unit contract suite increases runtime | Medium | Low | Keep scope targeted and raise the CI runtime ceiling to reflect the wider contract bundle. |

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Existing live smoke runner reuse path | Yes | None | No |
| Public sales funnel route coverage | Yes | None | No |
| Deterministic booking-contract suite gap analysis | Yes | None | No |
| CI workflow and artifact path | Yes | None | No |

## Scope Signal
- Signal: right-sized
- Rationale: The work is bounded to existing booking surfaces and CI seams, but broad enough to cover the full critical funnel.

## Evidence Gap Review
### Gaps Addressed
- Mapped the real commercial route flow from homepage widget through Octorate handoff.
- Confirmed the current live smoke and unit funnel contracts leave material gaps.

### Confidence Adjustments
- Testability remains slightly lower because execution proof still comes from CI rather than local runs.

### Remaining Assumptions
- Public CTA labels remain recognisable enough for role-based selectors, even if exact copy shifts slightly.
