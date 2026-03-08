---
Type: Plan
Status: Complete
Domain: QA | E2E | Browser Compatibility
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-live-usability-smoke
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Brikette Live Usability Smoke Plan

## Summary
Build a reusable Playwright smoke suite for the live Brikette site. The implementation should add a bounded current-browser matrix, a role-driven usability smoke spec for key guest interactions, and a GitHub Actions workflow that runs the spec against production on demand and on a schedule.

## Active tasks
- [x] TASK-01: Add a configurable Brikette Playwright browser matrix and reusable live usability smoke spec
- [x] TASK-02: Add a GitHub Actions workflow and package entry points for production usability smoke runs
- [x] TASK-03: Validate the implementation and record usage evidence

## Goals
- Reuse the existing Brikette Playwright seam.
- Prove live-site link/button usability on key routes across current browser engines.
- Make the suite easy to rerun via package scripts and GitHub Actions.

## Non-goals
- Full-site crawling.
- Legacy-browser support.
- Replacing current availability smoke coverage.

## Constraints & Assumptions
- Constraints:
  - Local Playwright execution remains out of bounds for the agent.
  - The solution must preserve a lightweight default project set for existing Brikette e2e consumers.
- Assumptions:
  - A cross-browser matrix of `chromium`, `firefox`, `webkit`, mobile Chrome, and mobile Safari is sufficient proof for current-browser support.

## Inherited Outcome Contract
- **Why:** Brikette needs a reusable way to prove current-browser usability on the live site, especially broken links, buttons, and key guest flows.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Brikette has a reusable Playwright smoke suite and CI workflow that can exercise the live production site across a current-browser matrix and fail when key links or buttons stop working.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brikette-live-usability-smoke/fact-find.md`
- Key findings used:
  - Brikette Playwright config already supports `PLAYWRIGHT_BASE_URL`
  - current config only defines `chromium`
  - live homepage, help hub, and transport hub expose stable accessible controls
  - Brikette already has a scheduled production smoke workflow pattern

## Proposed Approach
- Option A: extend the script-based production smoke runner.
  - Rejected: it is useful for scripted route checks, but not as reusable as a dedicated Playwright test spec with traces/screenshots and per-browser projects.
- Option B: add a dedicated Playwright smoke spec, configurable project matrix, and a dedicated workflow.
  - Chosen: this keeps the test reusable, CI-native, and easy to target at production or another base URL.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add env-driven browser projects and a role-based live usability smoke spec | 91% | M | Complete (2026-03-08) | - | TASK-02,TASK-03 |
| TASK-02 | IMPLEMENT | Add reusable scripts and a dedicated production workflow for the smoke suite | 89% | M | Complete (2026-03-08) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Run scoped validation and record CI-only execution guidance/evidence | 90% | S | Complete (2026-03-08) | TASK-01,TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Build the reusable spec and config first. |
| 2 | TASK-02 | TASK-01 | Workflow/scripts depend on the final spec/config names. |
| 3 | TASK-03 | TASK-01,TASK-02 | Validate and close with evidence. |

## Tasks

### TASK-01: Add a configurable Brikette Playwright browser matrix and reusable live usability smoke spec
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/brikette/playwright.config.ts`, `apps/brikette/e2e/site-usability.smoke.spec.ts`, `apps/brikette/e2e/site-usability.helpers.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Acceptance:**
  - Playwright project selection is env-driven and defaults to a lightweight set
  - a reusable smoke spec exists for live site usability
  - the spec uses stable role/label-based selectors and covers key homepage/help/transport interactions
- **Build evidence:**
  - `apps/brikette/playwright.config.ts` now supports `BRIKETTE_PLAYWRIGHT_PROJECT_SET` with:
    - `chromium` default for lightweight existing usage
    - `cross-browser` for `chromium`, `firefox`, `webkit`, `mobile-chrome`, and `mobile-safari`
  - Added `apps/brikette/e2e/site-usability.helpers.ts` for reusable navigation and runtime-error assertions.
  - Added `apps/brikette/e2e/site-usability.smoke.spec.ts` with bounded live-site smoke coverage for:
    - homepage CTA navigation
    - desktop primary nav routing
    - help hub legal/footer navigation
    - transport filters dialog open/update/close flow
    - transport image lightbox open/close flow
    - transport guide card navigation

### TASK-02: Add reusable scripts and a dedicated production workflow for the smoke suite
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/brikette/package.json`, `.github/workflows/brikette-live-usability-smoke.yml`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Acceptance:**
  - package scripts expose the suite cleanly
  - a workflow can run the suite against production on demand
  - the workflow uploads Playwright artifacts on failure
- **Build evidence:**
  - `apps/brikette/package.json` now exposes:
    - `e2e:site-usability`
    - `e2e:site-usability:live`
  - Added `.github/workflows/brikette-live-usability-smoke.yml`:
    - `workflow_dispatch` with `base_url` and `project_set`
    - weekly schedule
    - Playwright browser install for `chromium firefox webkit`
    - artifact upload for `apps/brikette/test-results` and `apps/brikette/playwright-report`

### TASK-03: Run scoped validation and record CI-only execution guidance/evidence
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Affects:** `docs/plans/brikette-live-usability-smoke/plan.md`
- **Depends on:** TASK-01,TASK-02
- **Blocks:** -
- **Acceptance:**
  - scoped `typecheck` and `lint` pass
  - plan records the new run entry points and CI-only execution status
  - local Playwright execution remains explicitly unperformed per policy
- **Build evidence:**
  - Validation:
    - `pnpm --filter @apps/brikette typecheck` passed
    - `pnpm --filter @apps/brikette lint` passed with existing package warnings only (`129` warnings, `0` errors)
  - Execution entry points:
    - package-level: `pnpm --filter @apps/brikette e2e:site-usability`
    - production convenience: `pnpm --filter @apps/brikette e2e:site-usability:live`
    - CI workflow: `Brikette Live Usability Smoke`
  - Local Playwright execution was not run in this session because repo policy keeps e2e in CI only.

## Risks & Mitigations
- Browser matrix runtime too high.
  - Mitigation: default to lightweight projects; reserve full matrix for dedicated smoke workflow.
- Live-site selector drift.
  - Mitigation: use user-facing roles and partial regex matches.
- Workflow artifacts insufficient for diagnosis.
  - Mitigation: upload Playwright failure outputs.

## Acceptance Criteria (overall)
- [x] Brikette has a reusable live-site usability smoke spec.
- [x] The Playwright browser matrix is configurable and supports a current-browser cross-browser set.
- [x] GitHub Actions can run the smoke suite against production.
- [x] Scoped validation passes.
