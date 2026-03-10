---
Type: Plan
Status: Complete
Domain: QA | E2E | Browser Compatibility | Sales
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-live-sales-funnel-smoke
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 92%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Brikette Live Sales Funnel Smoke Plan

## Summary
Upgrade Brikette’s funnel proof from a generic usability smoke into a layered commercial contract. The implementation adds a reusable live-smoke harness with artifact capture, a dedicated production-safe cross-browser sales-funnel suite for the public booking path, and a wider deterministic booking-contract bundle in CI so homepage, room-detail sticky, and private-accommodation handoffs are all under contract.

## Active tasks
- [x] TASK-01: Build a reusable live-smoke harness and dedicated sales-funnel suite
- [x] TASK-02: Expand deterministic booking-funnel contracts to cover missing funnel surfaces
- [x] TASK-03: Add CI entry points, workflow wiring, and validation evidence

## Goals
- Prove the public sales funnel across current browser engines.
- Cover both live browser behavior and deterministic booking logic.
- Capture actionable artifacts when funnel regressions occur.

## Non-goals
- Replacing the broader live usability suite.
- Changing booking funnel product behavior.
- Supporting legacy browsers.

## Constraints & Assumptions
- Constraints:
  - Live smoke must stay read-only and production-safe.
  - CI remains the execution source of truth for browser runs.
  - Existing package and workflow entry points should stay lightweight by default.
- Assumptions:
  - A current-browser matrix of Chromium, Firefox, WebKit, mobile Chrome, and mobile Safari is sufficient proof.

## Inherited Outcome Contract
- **Why:** Brikette has user feedback that the live sales funnel may fail outside Chrome, and the conversion path needs reusable, high-confidence coverage.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Brikette has layered sales-funnel coverage: a reusable live cross-browser smoke suite for the public production funnel and an expanded deterministic booking-contract suite that covers homepage, dorm booking, room-detail sticky CTA, and private-accommodation handoffs.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brikette-live-sales-funnel-smoke/fact-find.md`
- Key findings used:
  - current live usability smoke is not sales-funnel complete
  - existing deterministic booking-funnel contracts omit homepage widget, sticky CTA, and apartment/private-accommodation matrices
  - current CI already has viable seams for both live smoke and targeted contract execution

## Proposed Approach
- Option A: keep extending the generic usability smoke.
  - Rejected: this would blur responsibilities and still leave deterministic booking-contract gaps.
- Option B: add a dedicated live funnel suite plus expand the targeted unit contract bundle.
  - Chosen: this gives both live browser proof and stable fast-fail regression coverage.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Build a reusable live-smoke harness and dedicated live sales-funnel suite | 92% | M | Complete (2026-03-08) | - | TASK-02,TASK-03 |
| TASK-02 | IMPLEMENT | Expand deterministic booking-funnel contracts to cover missing commercial surfaces | 90% | M | Complete (2026-03-08) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add CI wiring, artifact reporting, and validation evidence | 93% | S | Complete (2026-03-08) | TASK-01,TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Shared harness first so both smoke suites can consume the same runner. |
| 2 | TASK-02 | TASK-01 | Expand unit contracts once the full funnel contract is final. |
| 3 | TASK-03 | TASK-01,TASK-02 | Wire workflows/scripts and validate the final surface. |

## Tasks

### TASK-01: Build a reusable live-smoke harness and dedicated live sales-funnel suite
- **Type:** IMPLEMENT
- **Deliverable:** reusable harness + live sales-funnel smoke runner
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/brikette/scripts/e2e/live-smoke-harness.mjs`, `apps/brikette/scripts/e2e/brikette-live-sales-funnel.mjs`, `apps/brikette/scripts/e2e/brikette-live-usability.mjs`
- **Depends on:** -
- **Blocks:** TASK-02,TASK-03
- **Confidence:** 92%
  - Implementation: 93% - existing script-runner pattern made the extraction straightforward.
  - Approach: 91% - shared harness plus suite-specific cases is cleaner than copy-pasting runner code.
  - Impact: 92% - directly covers the funnel paths the user cares about.
- **Acceptance:**
  - a shared live-smoke harness exists for Brikette script-runner suites
  - a dedicated sales-funnel suite covers homepage, booking widget, dorm booking, room-detail sticky CTA, and private-accommodation booking handoffs
  - live failures emit screenshots, traces, and JSON summary artifacts
- **Validation contract (TC-01):**
  - TC-01: homepage CTA -> `/en/book-dorm-bed`
  - TC-02: homepage booking widget -> `/en/book-dorm-bed?checkin=...&checkout=...&pax=...`
  - TC-03: dorm booking non-refundable CTA -> `book.octorate.com/.../result.xhtml`
  - TC-04: dorm booking flexible CTA -> `book.octorate.com/.../result.xhtml`
  - TC-05: room-detail sticky CTA -> `book.octorate.com/.../result.xhtml`
  - TC-06: private-accommodations non-refundable CTA -> `book.octorate.com/.../result.xhtml`
  - TC-07: private-accommodations flexible CTA -> `book.octorate.com/.../result.xhtml`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: route and CTA mapping against public booking code paths
  - Validation artifacts: shared harness with artifact capture, dedicated sales-funnel smoke runner
  - Unexpected findings: none
- **Scouts:** None: funnel entry points were already identifiable from existing booking code.
- **Edge Cases & Hardening:** first-enabled CTA selection avoids hardcoding one inventory state; harness captures traces/screenshots on failures.
- **What would make this >=90%:**
  - CI execution evidence from the new live workflow
- **Rollout / rollback:**
  - Rollout: new package scripts and workflow run the suite without affecting existing broad usability smoke.
  - Rollback: remove the new script/workflow and keep the harness powering only the existing usability suite.
- **Documentation impact:**
  - plan/fact-find for the new live funnel suite
- **Notes / references:**
  - `apps/brikette/src/components/landing/BookingWidget.tsx`
  - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
  - `apps/brikette/src/components/rooms/RoomCard.tsx`
  - `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`

### TASK-02: Expand deterministic booking-funnel contracts to cover missing commercial surfaces
- **Type:** IMPLEMENT
- **Deliverable:** broader `test:booking-funnel-contracts` coverage
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/brikette/package.json`, `.github/workflows/brikette-booking-funnel-contracts.yml`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 89% - expanding the curated test pattern is straightforward.
  - Approach: 90% - targeted contract expansion is the right complement to live smoke.
  - Impact: 91% - closes missing homepage, sticky, and private-booking logic gaps.
- **Acceptance:**
  - deterministic booking contracts include homepage widget routing, sticky CTA, and apartment/private booking matrices
  - workflow runtime budget reflects the wider contract bundle
- **Build evidence:**
  - `test:booking-funnel-contracts` now includes:
    - `ga4-07-apartment-checkout`
    - `ga4-35-sticky-begin-checkout`
    - `ga4-sticky-book-now-search-availability`
    - `modal-integration-tc09`
    - `room-detail-sticky-url-matrix`
    - `apartment/apartment-booking-url-matrix`
    - existing dorm room-card and URL builder contracts
  - `.github/workflows/brikette-booking-funnel-contracts.yml` runtime threshold increased from `150s` to `300s` for the expanded suite

### TASK-03: Add CI entry points, artifact reporting, and validation evidence
- **Type:** IMPLEMENT
- **Deliverable:** package scripts, workflow, and validation evidence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/brikette/package.json`, `.github/workflows/brikette-live-sales-funnel-smoke.yml`, `docs/plans/brikette-live-sales-funnel-smoke/fact-find.md`, `docs/plans/brikette-live-sales-funnel-smoke/plan.md`
- **Depends on:** TASK-01,TASK-02
- **Blocks:** -
- **Confidence:** 93%
  - Implementation: 94% - wiring follows the established live usability workflow pattern.
  - Approach: 92% - dedicated workflow keeps funnel monitoring explicit and reusable.
  - Impact: 93% - operators can rerun the exact funnel suite on demand and inspect artifacts.
- **Acceptance:**
  - package scripts expose the live funnel suite cleanly
  - CI can run the sales-funnel smoke suite against production
  - scoped validation passes
- **Build evidence:**
  - `apps/brikette/package.json` now exposes:
    - `e2e:sales-funnel`
    - `e2e:sales-funnel:live`
  - Added `.github/workflows/brikette-live-sales-funnel-smoke.yml`
  - `apps/brikette/scripts/e2e/live-smoke-harness.mjs` now writes trace/screenshot/summary artifacts under `apps/brikette/test-results/<suite>/`
  - Validation:
    - `pnpm --filter @apps/brikette typecheck`
    - `pnpm --filter @apps/brikette lint`
  - Live smoke execution itself remains CI-only in this session

## Risks & Mitigations
- Live inventory state may make some exact CTA instances unavailable.
  - Mitigation: smoke selects the first enabled matching CTA for each rate family.
- CI runtime increases with broader unit coverage.
  - Mitigation: keep the suite targeted and set an explicit higher runtime ceiling.
- Browser-only failures may still need human repro on real devices.
  - Mitigation: captured traces/screenshots reduce guesswork before a manual pass.

## Acceptance Criteria (overall)
- [x] Brikette has a dedicated live cross-browser sales-funnel smoke suite.
- [x] The live smoke runner captures actionable failure artifacts.
- [x] Deterministic booking-funnel contracts cover homepage widget, room-detail sticky, and private-booking matrices.
- [x] CI entry points exist for both live funnel smoke and expanded contract coverage.
- [ ] CI run evidence from the new live funnel workflow is attached in GitHub.

## Decision Log
- 2026-03-08: Chose a layered proof model instead of folding all funnel checks into the generic usability smoke.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
