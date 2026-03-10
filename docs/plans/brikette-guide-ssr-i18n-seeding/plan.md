---
Type: Plan
Status: Complete
Domain: SEO | I18n | Routing
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-guide-ssr-i18n-seeding
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 89%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Brikette Guide SSR I18n Seeding Plan

## Summary
Guide article pages currently receive the right per-guide translation bundle on the server, but the shared guide wrapper only merges that bundle into the runtime i18n store in a `useEffect`. That means the first server render falls back to raw keys such as `cheapEats`, `components.planChoice.title`, and `transportNotice.title`, then hydration fixes the page later. The fix is to move guide bundle priming into the render path before the first translation hook executes, then replace the old hydration-only tests with SSR-facing coverage that probes representative experiences, help, and how-to-get-here guides.

## Active tasks
- [x] TASK-01: Prime guide bundles synchronously before guide translation hooks run
- [x] TASK-02: Replace hydration-only assertions with SSR regression coverage
- [x] TASK-03: Validate the shared route-family fix and record results

## Goals
- Ensure initial server-rendered guide HTML contains human-readable copy rather than raw i18n keys.
- Cover all article route families that share the guide template.
- Add regression checks for representative guide samples across experiences, help, and how-to-get-here.

## Non-goals
- Rewriting guide content.
- Broad i18n architecture changes outside the guide/article path.
- Deploying or performing post-deploy live verification in this run.

## Constraints & Assumptions
- Constraints:
  - The shared guide wrapper is a client component, so the fix must preserve client hydration behavior.
  - Existing tests currently encode the broken hydration timing.
  - Local Jest is CI-only.
- Assumptions:
  - Render-time bundle priming is acceptable in this codebase because assistance index already uses that pattern.
  - Representative sample coverage is sufficient to guard the shared route families.

## Inherited Outcome Contract
- **Why:** Live guide pages leak raw i18n keys into server-rendered HTML, weakening first-pass crawl quality and creating an SSR/client mismatch.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Server-rendered guide HTML resolves human-readable guide titles and footer widget copy on first response for representative `/en/experiences/*`, `/en/help/*`, and `/en/how-to-get-here/*` pages.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brikette-guide-ssr-i18n-seeding/fact-find.md`
- Key findings used:
  - All three article route families flow through `GuideContent`.
  - `loadGuideI18nBundle()` already prepares the correct server-side bundle.
  - `GuideContent` currently seeds bundles in `useEffect`, too late for SSR.
  - Existing hydration tests assert the old timing and must be updated.

## Proposed Approach
- Option A: Patch individual leaf components (`ArticleHeader`, `PlanChoice`, `TransportNotice`) with ad hoc defaults.
  - Rejected: hides the real timing defect and leaves other tokenized content vulnerable.
- Option B: Prime the `guides` bundle synchronously in `GuideContent` before the first translation hook, then add SSR probe coverage for representative route-family samples.
  - Chosen: fixes the shared cause and gives reusable regression coverage.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Move guide bundle priming into render before translation hooks and preserve deterministic updates | 89% | M | Pending | - | TASK-02,TASK-03 |
| TASK-02 | IMPLEMENT | Add SSR regression coverage for representative guide samples and update old hydration assertions | 86% | M | Pending | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Run scoped validation and record representative sample coverage/evidence | 92% | S | Pending | TASK-01,TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Shared guide wrapper must be fixed first. |
| 2 | TASK-02 | TASK-01 | Tests should encode the new SSR behavior, not the old hydration lag. |
| 3 | TASK-03 | TASK-01,TASK-02 | Validation and evidence collection after code/test contracts settle. |

## Tasks

### TASK-01: Prime guide bundles synchronously before guide translation hooks run
- **Type:** IMPLEMENT
- **Deliverable:** shared guide SSR/i18n render-path fix
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx`, `[readonly] apps/brikette/src/app/_lib/guide-i18n-bundle.ts`, `[readonly] apps/brikette/src/app/[lang]/assistance/AssistanceIndexContent.tsx`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 89%
  - Implementation: 91% - one shared wrapper controls the broken timing.
  - Approach: 89% - follows an existing in-repo pattern.
  - Impact: 90% - covers all article route families using the guide template.
- **Acceptance:**
  - `GuideContent` merges `serverGuides` and `serverGuidesEn` before its first translation hook executes.
  - Render-time priming remains deterministic across navigation/update cases.
  - The fix applies equally to experiences, help, and how-to-get-here article routes.
- **Validation contract (TC-01):**
  - TC-01: render-phase guide seeding occurs before the first guide translation hook.
  - TC-02: render-phase seeding remains bounded to the current guide/lang bundle.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: inspect assistance index render-time seeding pattern and guide route entrypoints.
  - Validation artifacts: updated SSR/hydration tests in TASK-02.
  - Unexpected findings: None expected.
- **Scouts:** None: bounded shared wrapper fix.
- **Edge Cases & Hardening:** Handle rerender/navigation without assuming a single guide per component lifetime.
- **What would make this >=90%:**
  - Prove representative SSR probes no longer emit raw keys.
- **Rollout / rollback:**
  - Rollout: ship with SSR regression coverage.
  - Rollback: revert `GuideContent` timing if unexpected client regressions appear.
- **Documentation impact:**
  - Plan evidence only.
- **Notes / references:**
  - `docs/plans/brikette-guide-ssr-i18n-seeding/fact-find.md`
- **Build evidence:**
  - `GuideContent` now seeds `serverGuides` and `serverGuidesEn` during render, before the first `useTranslation("guides")` call.
  - Seeding is tracked by `lang` + `guideKey` + bundle presence signature to avoid duplicate churn on identical rerenders.

### TASK-02: Replace hydration-only assertions with SSR regression coverage
- **Type:** IMPLEMENT
- **Deliverable:** test coverage for SSR guide HTML/token leakage
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/brikette/src/test/routes/guides/__tests__/hydration/guide-i18n-hydration.test.tsx`, new SSR-focused guide render tests under `apps/brikette/src/test/**`, `[readonly] apps/brikette/src/test/utils/detectRenderedI18nPlaceholders.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 86%
  - Implementation: 88% - the required helpers already exist.
  - Approach: 86% - needs careful reshaping of a test that currently codifies the old bug.
  - Impact: 89% - catches the exact SEO-facing regression.
- **Acceptance:**
  - Existing hydration tests no longer assert the broken “no render-phase seeding” behavior.
  - SSR regression coverage checks representative guides across:
    - five `/en/experiences/*`
    - five `/en/help/*`
    - five `/en/how-to-get-here/*`
  - The SSR coverage fails on raw keys such as `cheapEats`, `components.planChoice.title`, and `transportNotice.title`.
- **Validation contract (TC-02):**
  - TC-03: SSR probe reports no raw-key leakage for representative samples.
  - TC-04: hydration test reflects render-phase seeding without duplicate churn.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reuse placeholder detection or direct token assertions over rendered output.
  - Validation artifacts: new/updated CI tests.
  - Unexpected findings: None expected.
- **Scouts:** None: test-only work once TASK-01 lands.
- **Edge Cases & Hardening:** Keep coverage representative without introducing brittle dependency on unrelated layout markup.
- **What would make this >=90%:**
  - CI confirmation that the SSR sample suite passes.
- **Rollout / rollback:**
  - Rollout: land coverage in the same change set as the render fix.
  - Rollback: revert coverage only alongside a code rollback.
- **Documentation impact:**
  - Plan evidence only.
- **Notes / references:**
  - Live sample evidence in the fact-find.
- **Build evidence:**
  - Updated `apps/brikette/src/test/routes/guides/__tests__/hydration/guide-i18n-hydration.test.tsx` to assert render-phase seeding instead of the previous hydration-lag behavior.
  - Added `apps/brikette/src/test/app/guides/guide-content-ssr-audit.test.tsx`, which strips the global `guides` bundle before render and audits five representative English guides each for `experiences`, `assistance` (`/en/help/*`), and `howToGetHere`.
  - The SSR audit checks for translated H1/widget output and rejects raw-key leakage including `components.planChoice.*` and `transportNotice.*`.

### TASK-03: Validate the shared route-family fix and record results
- **Type:** IMPLEMENT
- **Deliverable:** scoped validation evidence for the guide SSR fix
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Affects:** `docs/plans/brikette-guide-ssr-i18n-seeding/plan.md`
- **Depends on:** TASK-01,TASK-02
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 93% - standard scoped validation.
  - Approach: 92% - direct evidence path is known.
  - Impact: 92% - closes the workflow with reproducible validation notes.
- **Acceptance:**
  - `pnpm --filter @apps/brikette typecheck` passes.
  - `pnpm --filter @apps/brikette lint` passes with existing package warnings only.
  - Plan records the representative sample coverage and validation results.
- **Validation contract (TC-03):**
  - TC-05: typecheck passes.
  - TC-06: lint passes.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: scoped typecheck/lint.
  - Validation artifacts: command outputs and updated plan evidence.
  - Unexpected findings: None expected.
- **Scouts:** None: standard validation task.
- **Edge Cases & Hardening:** Note that live post-deploy curl verification remains a follow-up after deployment.
- **What would make this >=90%:**
  - Already met once scoped validation is clean.
- **Rollout / rollback:**
  - Rollout: merge with updated tests.
  - Rollback: revert together with code/test changes if validation fails later in CI.
- **Documentation impact:**
  - Update this plan with build evidence.
- **Build evidence:**
  - `pnpm --filter @apps/brikette typecheck` passed.
  - `pnpm --filter @apps/brikette lint` passed with the package's existing warnings only; no new lint errors remained after import sorting the new SSR audit file.
  - Jest was not run locally because repo policy keeps test execution in CI.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Prime guide bundles synchronously before guide translation hooks run | Yes | None | No |
| TASK-02: Replace hydration-only assertions with SSR regression coverage | Yes | None | No |
| TASK-03: Validate the shared route-family fix and record results | Yes | None | No |

## Risks & Mitigations
- Render-phase i18n mutation introduces unexpected rerender behavior.
  - Mitigation: keep seeding idempotent per guide/lang and cover rerender behavior in tests.
- Sample coverage is too synthetic to catch real token leakage.
  - Mitigation: use representative real guide keys and actual extracted guide bundles, not hand-written fixtures only.
- Client-only follow-up namespace loads mask a remaining SSR gap.
  - Mitigation: ensure SSR coverage asserts rendered text before client effects run.

## Observability
- Logging: None required for runtime.
- Metrics: None in-app; regression coverage is the primary signal.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [x] Shared guide render path primes guide bundles before first translation lookup.
- [x] Representative SSR coverage spans five guides each for experiences, help, and how-to-get-here.
- [x] No representative SSR sample leaks raw guide keys or footer widget translation keys.
- [x] Scoped validation passes.

## Decision Log
- 2026-03-08: Chose render-phase guide bundle priming in the shared wrapper instead of patching individual leaf components.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)

## What would make this ≥90%
- Complete TASK-01 through TASK-03 with representative SSR sample coverage and clean scoped validation.
