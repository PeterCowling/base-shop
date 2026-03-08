---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: QA | E2E | Browser Compatibility
Workstream: Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: brikette-live-usability-smoke
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brikette-live-usability-smoke/plan.md
Trigger-Why: Brikette needs a reusable way to prove current-browser usability on the live site, especially broken links, buttons, and key guest flows.
Trigger-Intended-Outcome: type: measurable | statement: Brikette has a reusable Playwright smoke suite and CI workflow that can exercise the live production site across a current-browser matrix and fail when key links or buttons stop working. | source: operator
---

# Brikette Live Usability Smoke Fact-Find Brief

## Scope
### Summary
Brikette already has Playwright infrastructure, but it is narrow: the checked-in config only defines a `chromium` project, and the existing smoke coverage is focused on availability/booking. There is no reusable, current-browser usability sweep for the live site that proves the basic user-facing controls still work across main browser engines.

### Goals
- Reuse the existing Brikette Playwright seam instead of introducing a second browser test stack.
- Add a reusable smoke spec aimed at live-site usability, not just booking availability.
- Make the browser matrix configurable so existing targeted runs remain lightweight while production proof can run cross-browser.
- Add a GitHub Actions workflow that can run the smoke suite against `https://hostel-positano.com` on demand and on a schedule.

### Non-goals
- Broad crawling of every Brikette page.
- Supporting obsolete browsers.
- Local execution of Playwright by the agent.
- Replacing the existing availability smoke tests.

### Constraints & Assumptions
- Constraints:
  - Repo policy keeps e2e execution in CI only.
  - The smoke suite must use stable, user-facing controls rather than brittle implementation selectors.
  - The solution should not make current Brikette Playwright commands unexpectedly slower by default.
- Assumptions:
  - `chromium` is sufficient coverage for Chrome/Edge because both run the Chromium engine.
  - A small route matrix is enough to prove live-site usability at the smoke-test layer.

## Outcome Contract
- **Why:** Brikette needs a reusable way to prove current-browser usability on the live site, especially broken links, buttons, and key guest flows.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Brikette has a reusable Playwright smoke suite and CI workflow that can exercise the live production site across a current-browser matrix and fail when key links or buttons stop working.
- **Source:** operator

## Access Declarations
- External data source: `https://hostel-positano.com` (public website, read-only browser access). Access type: anonymous web access. Status: UNVERIFIED.
- External system: GitHub Actions workflow runner. Access type: repository CI execution. Status: UNVERIFIED.

## Evidence Audit (Current State)
### Entry Points
- `apps/brikette/playwright.config.ts` - Brikette Playwright config; currently only defines `chromium`.
- `apps/brikette/e2e/availability-smoke.spec.ts` - current Playwright smoke test for availability booking flow.
- `apps/brikette/e2e/availability-resilience.spec.ts` - resilience checks for the same booking path.
- `apps/brikette/package.json` - existing `e2e` and `e2e:smoke` commands.
- `.github/workflows/brikette-weekly-watchdog.yml` - existing scheduled Brikette production smoke workflow using the script-based smoke runner.

### Key Modules / Files
- `apps/brikette/playwright.config.ts`
  - Reads `PLAYWRIGHT_BASE_URL`.
  - Uses `testDir: "./e2e"`.
  - Defines only one project: `chromium`.
- `apps/brikette/scripts/e2e/brikette-smoke.mjs`
  - Script-based smoke runner already aimed at production-safe checks.
  - Uses `playwright` directly, but not the Playwright test runner.
- `apps/brikette/e2e/availability-smoke.spec.ts`
  - Demonstrates the current pattern for reusable browser assertions.
  - Confirms Brikette already supports live-base-url Playwright runs.
- `.github/workflows/brikette-weekly-watchdog.yml`
  - Already installs Playwright and runs a production smoke audit weekly.
  - Provides the right CI shape for a new reusable live usability suite.

### Live-Site Findings
- Home page (`https://hostel-positano.com/en`) exposes stable accessible controls:
  - nav links: `Help`, `How to Get Here`, `Deals`
  - primary CTA link: `Check availability`
  - content links: `Visit the help center`, room detail links
- Help hub (`https://hostel-positano.com/en/help`) now resolves cleanly and exposes stable global/header/footer links.
- Transport hub (`https://hostel-positano.com/en/how-to-get-here`) exposes several testable controls:
  - `Edit filters`
  - dialog controls such as `Done`
  - image lightbox triggers labelled `Open image: ...`
  - route/article links such as `Naples Airport to Positano by Bus ...`

### Patterns & Conventions Observed
- Brikette pages use accessible roles and labels consistently enough for role-based Playwright selectors.
- The production site can be tested safely by visiting same-origin pages and asserting navigation/state changes without mutating data.
- Existing Brikette workflows already tolerate a scheduled production smoke job, so a second targeted QA workflow is operationally consistent.

### Dependency & Impact Map
- Upstream dependencies:
  - Playwright projects in `apps/brikette/playwright.config.ts`
  - live accessible labels/roles on Brikette pages
  - GitHub Actions runner with Playwright browsers installed
- Downstream dependents:
  - manual CI runs for release confidence
  - scheduled production smoke monitoring
  - future browser-compatibility checks during SEO/launch work

### Test Landscape
#### Existing Coverage
| Area | Test Type | Files | Notes |
|---|---|---|---|
| booking availability | Playwright smoke | `apps/brikette/e2e/availability-smoke.spec.ts` | Only booking path; only `chromium` by config. |
| booking resilience | Playwright smoke | `apps/brikette/e2e/availability-resilience.spec.ts` | API failure behavior; not a general usability sweep. |
| production smoke | Script runner | `apps/brikette/scripts/e2e/brikette-smoke.mjs` | Not a reusable Playwright spec and not cross-browser. |

#### Coverage Gaps
- No reusable live-site usability smoke spec.
- No configurable current-browser matrix.
- No dedicated workflow proving cross-browser link/button usability on production.

#### Recommended Test Approach
- Add one small Playwright smoke spec covering:
  - homepage CTA / key navigation
  - help hub route availability
  - transport hub dialog/button interaction
  - transport guide link navigation
- Keep assertions role-based and outcome-based.
- Make Playwright project selection env-driven so existing targeted runs can remain `chromium`-only.

## Questions
### Resolved
- Q: Does Brikette already have a reusable Playwright seam?
  - A: Yes. The app already ships `playwright.config.ts`, `e2e/*.spec.ts`, and `PLAYWRIGHT_BASE_URL` support.
  - Evidence: `apps/brikette/playwright.config.ts`, `apps/brikette/e2e/availability-smoke.spec.ts`
- Q: Is there already a production-oriented Brikette CI smoke workflow?
  - A: Yes. The weekly watchdog installs Playwright and runs a production smoke command.
  - Evidence: `.github/workflows/brikette-weekly-watchdog.yml`
- Q: Are there stable live controls suitable for reusable smoke selectors?
  - A: Yes. Homepage, help hub, and transport hub expose stable role-based controls and links.
  - Evidence: live browser observations on 2026-03-08 for `/en`, `/en/help`, `/en/how-to-get-here`

### Open (Operator Input Required)
- None.

## Confidence Inputs
- Implementation: 92%
  - Evidence basis: bounded surface using existing Playwright and workflow seams.
- Approach: 90%
  - Evidence basis: live affordance scan confirms stable selectors and route targets.
- Impact: 89%
  - Evidence basis: catches high-signal live regressions on core guest paths.
- Delivery-Readiness: 94%
  - Evidence basis: no external credentials or architecture changes required.
- Testability: 87%
  - Evidence basis: local e2e execution is blocked by policy, so CI is the only proof path.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Live copy or labels change and break selectors | Medium | Medium | Use roles, partial regex names, and a small matrix of stable controls. |
| Full browser matrix is too slow for routine use | Medium | Medium | Make project selection env-driven; keep default lightweight. |
| Production-only third-party/transient failures cause flakes | Medium | Medium | Keep scope on same-origin route usability; upload traces/screenshots for triage. |

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Existing Playwright config and specs | Yes | None | No |
| Live-site stable controls for smoke selectors | Yes | None | No |
| CI workflow reuse path | Yes | None | No |
| Policy constraints around e2e execution | Yes | None | No |

## Scope Signal
- Signal: right-sized
- Rationale: The work is bounded to one new smoke spec, one config enhancement, and one workflow.

## Evidence Gap Review
### Gaps Addressed
- Verified the live site exposes stable labels/roles for smoke assertions.
- Confirmed existing CI and Playwright seams are already present.

### Confidence Adjustments
- Testability remains below the others because CI-only policy prevents local execution by the agent.

### Remaining Assumptions
- Production keeps the current accessible names for the targeted controls, or close equivalents that still match partial regex selectors.
