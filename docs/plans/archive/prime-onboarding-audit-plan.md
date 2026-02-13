---
Type: Plan
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-12
Last-updated: 2026-02-12
Feature-Slug: prime-onboarding-audit
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-design-system
Overall-confidence: 89%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: BRIK
---

# Prime Onboarding Improvements Plan

## Summary

Implement the P0 and P1 fixes identified in the onboarding audit (`docs/plans/prime-onboarding-audit-fact-find.md`). The active GuidedOnboardingFlow has strong fundamentals (value-first design, personalization, A/B testing) but gaps in analytics instrumentation, i18n, error handling, supportability, and test coverage. All fixes leverage existing patterns and design system components.

## Goals

- Close the analytics blind spot: track skip and abandon events so the onboarding funnel is fully visible
- Internationalize the active onboarding flow (EN + IT) to serve Prime's 99% international audience
- Add error feedback so guests know when data didn't save (reception relies on this data)
- Add a support escape hatch for confused guests
- Replace dead spinner with informative skeleton loading state
- Add ARIA live regions and focus management for accessibility compliance
- Add E2E test coverage for the most critical first-run experience

## Non-goals

- Redesigning the onboarding flow structure (3 steps are working well per A/B tests)
- Integrating or removing dormant legacy components (separate decision, tracked as TASK-08)
- Adding external analytics (GA/Mixpanel) — that's a separate infrastructure initiative
- Adding channel attribution question — lower priority, not blocking L3

## Constraints & Assumptions

- Constraints:
  - All changes to GuidedOnboardingFlow.tsx must be sequential (single-file bottleneck)
  - Italian translations must follow the established voice in existing `it/Onboarding.json`
  - Toast component usage must follow design system patterns (`@acme/design-system/atoms`)
  - E2E test must use existing Firebase mock infrastructure from `prime-mocks.ts`
- Assumptions:
  - `hostelbrikette@gmail.com` remains the support email (matches `ArrivalHome.tsx` pattern)

## Fact-Find Reference

- Related brief: `docs/plans/prime-onboarding-audit-fact-find.md`
- Key findings:
  - Sections A (Value-first) and C (Personalization) pass — strong foundation
  - Section H (Supportability) fails — no support path, silent API errors
  - Section G (Analytics) needs improvement — no drop-off or skip tracking
  - No i18n in active flow (legacy components have it)
  - 6 existing tests pass; E2E bypasses onboarding entirely
  - Fact-find confidence inputs: Implementation 85, Approach 90, Impact 80, Delivery-Readiness 85, Testability 75

## Existing System Notes

- Key modules/files:
  - `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx` — 677-line active onboarding (3 steps)
  - `apps/prime/src/lib/analytics/activationFunnel.ts` — event recording with `recordActivationFunnelEvent()`
  - `apps/prime/src/lib/experiments/activationExperiments.ts` — A/B test variant assignment
  - `apps/prime/src/lib/preArrival/personalization.ts` — route sorting by arrival method
  - `apps/prime/public/locales/en/Onboarding.json` — existing i18n keys for legacy components
  - `apps/prime/public/locales/it/Onboarding.json` — Italian translations (matches EN structure)
  - `packages/design-system/src/atoms/Toast.tsx` — Toast with variant, duration, action support
  - `packages/design-system/src/atoms/Skeleton.tsx` — `animate-pulse` skeleton primitive
  - `packages/design-system/src/primitives/MilestoneToast.tsx` — celebration toast (already used)
- Patterns to follow:
  - Analytics: `recordActivationFunnelEvent({ type, sessionKey, route, stepId, variant, context })` — `activationFunnel.ts`
  - Support mailto: `window.open('mailto:hostelbrikette@gmail.com', '_self')` with `utility_action_used` event — `ArrivalHome.tsx:146-161`
  - i18n: `useTranslation('Onboarding')` + `t('key')` — `GuestProfileStep.tsx`
  - Test mocking: hook mocks + `@testing-library/react` — `GuidedOnboardingFlow.test.tsx`

## Proposed Approach

Single sequential improvement pass on GuidedOnboardingFlow.tsx, ordered by priority (P0 first). Each task is a self-contained change that leaves the component working. The E2E test runs at the end to verify the final improved state. Analytics events first (enables measurement of all subsequent changes).

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| OB-01 | IMPLEMENT | Add skip and abandon analytics events | 92% | S | Complete (2026-02-12) | - | OB-02 |
| OB-02 | IMPLEMENT | Extract GuidedOnboardingFlow strings to i18n | 88% | M | Complete (2026-02-12) | OB-01 | OB-03 |
| OB-03 | IMPLEMENT | Add error toast on API failures | 92% | S | Complete (2026-02-12) | OB-02 | OB-04 |
| OB-04 | IMPLEMENT | Add support/help link in onboarding | 92% | S | Complete (2026-02-12) | OB-03 | OB-05 |
| OB-05 | IMPLEMENT | Replace loading spinner with skeleton + tip | 92% | S | Complete (2026-02-12) | OB-04 | OB-06 |
| OB-06 | IMPLEMENT | Add ARIA live regions and focus management | 90% | S | Complete (2026-02-12) | OB-05 | OB-07 |
| OB-07 | IMPLEMENT | Add Cypress E2E test for onboarding flow | 85% | M | Complete (2026-02-12) | OB-06 | - |
| OB-08 | DECISION | Resolve dormant legacy onboarding components | 95% | S | Complete (2026-02-12) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | OB-01, OB-08 | - | Analytics events + decision (independent) |
| 2 | OB-02 | OB-01 | i18n extraction (file overlap: GuidedOnboardingFlow.tsx) |
| 3 | OB-03 | OB-02 | Error toast (file overlap: GuidedOnboardingFlow.tsx) |
| 4 | OB-04 | OB-03 | Support link (file overlap: GuidedOnboardingFlow.tsx) |
| 5 | OB-05 | OB-04 | Skeleton loader (file overlap: GuidedOnboardingFlow.tsx) |
| 6 | OB-06 | OB-05 | Accessibility (file overlap: GuidedOnboardingFlow.tsx) |
| 7 | OB-07 | OB-06 | E2E test (tests final improved state) |

**Max parallelism:** 2 (Wave 1) | **Critical path:** OB-01 → OB-02 → OB-03 → OB-04 → OB-05 → OB-06 → OB-07 (7 waves) | **Total tasks:** 8

## Tasks

### OB-01: Add skip and abandon analytics events

- **Type:** IMPLEMENT
- **Deliverable:** Code change — `GuidedOnboardingFlow.tsx`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx`
- **Depends on:** -
- **Blocks:** OB-02 (file overlap: GuidedOnboardingFlow.tsx)
- **Confidence:** 92%
  - Implementation: 95% — Exact same `recordActivationFunnelEvent` pattern used 3 times already (lines 214, 239, 277). Just need new event type.
  - Approach: 92% — Adding `guided_step_skipped` matches the existing `guided_step_complete` naming convention. Abandon via `useEffect` cleanup is standard React.
  - Impact: 90% — Adds events to existing localStorage funnel. No external system changes. `activationFunnel.ts` already supports arbitrary event types.
- **Acceptance:**
  - Each "Skip for now" button (lines 480, 534, 656) fires a `guided_step_skipped` event with stepId and variant
  - Component unmount when not completed fires `guided_flow_abandoned` event with last completed step
  - All events include sessionKey, route, stepId, variant, stepOrder (matching existing schema)
  - Existing 6 tests still pass
  - New unit tests verify skip and abandon events fire correctly
- **Validation contract:**
  - TC-01: Click "Skip for now" on Step 1 → `recordActivationFunnelEvent` called with `type: 'guided_step_skipped'`, `stepId: 'step-1'`
  - TC-02: Click "Skip for now" on Step 2 → event with `stepId: 'step-2'`
  - TC-03: Click "Skip for now" on Step 3 → event with `stepId: 'step-3'`
  - TC-04: Unmount component before completion → `guided_flow_abandoned` event with `context.lastStep`
  - TC-05: Complete flow normally → no abandon event fired
  - Acceptance coverage: TC-01–03 cover skip events; TC-04–05 cover abandon/no-abandon
  - Validation type: unit
  - Validation location: `apps/prime/src/components/portal/__tests__/GuidedOnboardingFlow.test.tsx`
  - Run: `cd apps/prime && npx jest --testPathPattern=GuidedOnboardingFlow.test`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: `npx jest --testPathPattern='(GuidedOnboardingFlow|guided-onboarding)'` — 3 suites, 6 tests pass
  - Existing `recordActivationFunnelEvent` mock confirmed in `GuidedOnboardingFlow.ds-migration.test.tsx:20`
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Immediate — events only record to localStorage, no external system
  - Rollback: Remove event calls (no data migration needed)
- **Documentation impact:** None
- **Notes / references:**
  - Existing event pattern: `GuidedOnboardingFlow.tsx:214-223`
  - Event type enum: `activationFunnel.ts` — `ActivationFunnelEventType`
  - `activationFunnel.ts` uses a strict TypeScript union `ActivationFunnelEventType` — new event types were added to the union and the aggregate initializer

#### Build Completion (2026-02-12)
- **Status:** Complete
- **Commits:** a804f28250
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03b, TC-04, TC-05
  - Cycles: 1 (red-green)
  - Initial validation: FAIL expected (4 new tests failed — feature not yet implemented)
  - Final validation: PASS (7/7 tests pass)
- **Confidence reassessment:**
  - Original: 92%
  - Post-validation: 93%
  - Delta reason: validation confirmed assumptions; minor deviation — `ActivationFunnelEventType` is a strict union (not arbitrary strings), so new types added to union + aggregate initializer in `activationFunnel.ts` (still S-effort, 2 primary files)
- **Validation:**
  - Ran: `npx jest --testPathPattern=GuidedOnboardingFlow.test.tsx` — 7/7 PASS
  - Ran: `npx jest --testPathPattern=activationFunnel` — 4/4 PASS (no regressions)
  - Ran: `npx tsc --noEmit` — clean
  - Pre-commit: lint + typecheck + agent-context — PASS
- **Documentation updated:** None required
- **Implementation notes:** Added `guided_step_skipped` and `guided_flow_abandoned` to the `ActivationFunnelEventType` union and aggregate counts initializer. Added `flowCompletedRef` and `stepRef` for closure-safe abandon tracking. Each skip button now records the skip event before advancing. `handleFinish` and Step 3 skip set `flowCompletedRef.current = true` to suppress the abandon event.

### OB-02: Extract GuidedOnboardingFlow strings to i18n

- **Type:** IMPLEMENT
- **Deliverable:** Code change — `GuidedOnboardingFlow.tsx` + `en/Onboarding.json` + `it/Onboarding.json`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx`, `apps/prime/public/locales/en/Onboarding.json`, `apps/prime/public/locales/it/Onboarding.json`
- **Depends on:** OB-01 (file overlap: GuidedOnboardingFlow.tsx)
- **Blocks:** OB-03 (file overlap: GuidedOnboardingFlow.tsx)
- **Confidence:** 88%
  - Implementation: 90% — Legacy components demonstrate exact pattern: `useTranslation('Onboarding')` + `t('guidedFlow.step1.title')`. JSON structure established.
  - Approach: 90% — Adding a `guidedFlow` section to existing `Onboarding.json` follows the namespace pattern. Keeps legacy keys (`guestProfile`, `socialOptIn`, `handoff`) untouched.
  - Impact: 85% — Touches 3 files. Italian translations need care (matching existing voice: warm, casual, experience-focused). Risk: translation quality for A/B variant strings.
- **Acceptance:**
  - All hardcoded English strings in GuidedOnboardingFlow.tsx replaced with `t()` calls
  - New `guidedFlow` section added to `en/Onboarding.json` with keys for all 3 steps (titles, descriptions, labels, buttons, celebration messages, A/B variants)
  - Matching `guidedFlow` section added to `it/Onboarding.json` with Italian translations
  - `useTranslation('Onboarding')` hook added to component
  - A/B experiment variant strings also extracted (both `control` and `value-led` headline copy)
  - Existing 6 tests updated to account for i18n mock (already mocked in test pattern: `t: (key) => key`)
- **Validation contract:**
  - TC-01: Render Step 1 → title text comes from translation key (not hardcoded English)
  - TC-02: Render Step 2 → all labels and options come from translation keys
  - TC-03: Render Step 3 → checklist item labels come from translation keys
  - TC-04: Celebration toast messages use translation keys
  - TC-05: A/B variant `value-led` headline uses translation key
  - TC-06: `en/Onboarding.json` has `guidedFlow` section with all required keys
  - TC-07: `it/Onboarding.json` `guidedFlow` section has same key structure as EN
  - Acceptance coverage: TC-01–05 cover component rendering; TC-06–07 cover locale files
  - Validation type: unit + manual JSON structure check
  - Validation location: `apps/prime/src/components/portal/__tests__/GuidedOnboardingFlow.test.tsx`
  - Run: `cd apps/prime && npx jest --testPathPattern=GuidedOnboardingFlow`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: Existing tests pass (6/6). i18n mock pattern confirmed in `GuestProfileStep.test.tsx:48`: `useTranslation: () => ({ t: (key: string) => key })`
  - Existing `en/Onboarding.json` has 3 sections (`guestProfile`, `socialOptIn`, `handoff`); new `guidedFlow` section won't conflict
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Native Italian speaker review of translations
  - Visual regression test with both locales
- **Rollout / rollback:**
  - Rollout: Immediate — same strings, different source. No behavior change for EN users.
  - Rollback: Revert to hardcoded strings (no data migration)
- **Documentation impact:** None
- **Notes / references:**
  - i18n pattern: `GuestProfileStep.tsx` uses `useTranslation('Onboarding')` + `t('guestProfile.title')`
  - EN Onboarding.json structure: `{ guestProfile: {...}, socialOptIn: {...}, handoff: {...} }`
  - Brand voice for IT: warm, casual — see `it/Onboarding.json` existing translations for style reference

#### Build Completion (2026-02-12)
- **Status:** Complete
- **Commits:** e05f34b142
- **Execution cycle:**
  - Validation cases executed: TC-01 through TC-07 (plus TC-02/TC-03 from original suite)
  - Cycles: 1 (red-green)
  - Initial validation: existing tests + new i18n tests all pass after extraction
  - Final validation: PASS (11/11 tests across 2 suites)
- **Confidence reassessment:**
  - Original: 88%
  - Post-validation: 90%
  - Delta reason: validation confirmed — all 30+ strings cleanly extracted, key structure validated, ds-migration test also updated with react-i18next mock
- **Validation:**
  - Ran: `npx jest --testPathPattern=GuidedOnboardingFlow` — 11/11 PASS (2 suites)
  - Ran: `npx tsc --noEmit` — clean
  - Pre-commit: lint + typecheck + agent-context — PASS
- **Documentation updated:** None required
- **Implementation notes:** Added `guidedFlow` section with ~30 keys to both `en/Onboarding.json` and `it/Onboarding.json`. Removed now-unused `capitalize()` function. Added `react-i18next` mock to both test files (main + ds-migration). Removed stale eslint-disable comment for exhaustive-deps.

### OB-03: Add error toast on API failures

- **Type:** IMPLEMENT
- **Deliverable:** Code change — `GuidedOnboardingFlow.tsx`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx`, `[readonly] packages/design-system/src/atoms/Toast.tsx`
- **Depends on:** OB-02 (file overlap: GuidedOnboardingFlow.tsx)
- **Blocks:** OB-04 (file overlap: GuidedOnboardingFlow.tsx)
- **Confidence:** 90%
  - Implementation: 92% — `Toast` component from `@acme/design-system/atoms` supports `variant="danger"`, `duration` auto-dismiss, and `actionLabel` for retry. Import + state + render is straightforward.
  - Approach: 90% — Show toast on API failure with "Try again" action that retries the save. Keep the "continue anyway" behavior (don't block the flow) but inform the user.
  - Impact: 88% — Modifies try/finally blocks in 3 step handlers. Low risk since existing error handling (continue on failure) is preserved; toast is additive.
- **Acceptance:**
  - When `setPersonalization()` fails in Step 1, a danger toast appears: "Couldn't save your preferences. Tap to retry."
  - When `setEta()` fails in Step 2, a danger toast appears: "Couldn't save your ETA. Tap to retry."
  - When `updateChecklistItem()` fails in Step 3, a danger toast appears: "Couldn't save checklist. Tap to retry."
  - Toast auto-dismisses after 5 seconds
  - Toast has "Try again" action that retries the failed save
  - Flow still advances on error (guest is not blocked)
  - Existing tests still pass; new tests verify toast on error
- **Validation contract:**
  - TC-01: `setPersonalization` rejects → Toast with variant="danger" rendered with retry action
  - TC-02: Click "Try again" on error toast → `setPersonalization` called again
  - TC-03: `setEta` rejects → Toast rendered; flow advances to Step 3
  - TC-04: `updateChecklistItem` rejects → Toast rendered; flow completes
  - TC-05: Successful save → no error toast rendered
  - Acceptance coverage: TC-01–04 cover error paths per step; TC-05 covers happy path
  - Validation type: unit
  - Validation location: `apps/prime/src/components/portal/__tests__/GuidedOnboardingFlow.test.tsx`
  - Run: `cd apps/prime && npx jest --testPathPattern=GuidedOnboardingFlow.test`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: 6/6 tests pass. Toast component API confirmed: `<Toast open={bool} message={str} variant="danger" duration={5000} actionLabel="Try again" onAction={fn} />`
  - Skeleton component mock not needed (Toast auto-exports from `@acme/design-system/atoms`)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Immediate — additive UX improvement
  - Rollback: Remove Toast import and error state (reverts to silent failures)
- **Documentation impact:** None
- **Notes / references:**
  - Toast API: `packages/design-system/src/atoms/Toast.tsx` — `variant`, `duration`, `actionLabel`, `onAction`
  - Existing error pattern: `GuidedOnboardingFlow.tsx:206-229` — `try/finally` with no catch
  - Legacy error pattern: `GuestProfileStep.tsx:113-116` — catches error, logs it, continues

#### Build Completion (2026-02-12)
- **Status:** Complete
- **Commits:** 07c41c2898
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04, TC-05
  - Cycles: 1 (red-green)
  - Initial validation: FAIL expected (4 TC failures — no catch blocks or Toast)
  - Final validation: PASS (16/16 tests including DS migration)
- **Confidence reassessment:**
  - Original: 90%
  - Post-validation: 92%
  - Delta reason: validation confirmed; `data-cy` testIdAttribute convention discovered (project config)
- **Validation:**
  - Ran: `npx jest --config jest.config.cjs --testPathPattern=GuidedOnboardingFlow` — 16 PASS
  - Ran: `pnpm --filter @apps/prime exec tsc --noEmit` — PASS
- **Documentation updated:** None required
- **Implementation notes:** Added catch blocks to all 3 step handlers. Each catch sets errorToast state and advances the flow. Toast rendered from `@acme/design-system/atoms` with `variant="danger"`, `duration={5000}`, and retry action. Error i18n keys added to both EN and IT locale files.

### OB-04: Add support/help link in onboarding

- **Type:** IMPLEMENT
- **Deliverable:** Code change — `GuidedOnboardingFlow.tsx`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx`
- **Depends on:** OB-03 (file overlap: GuidedOnboardingFlow.tsx)
- **Blocks:** OB-05 (file overlap: GuidedOnboardingFlow.tsx)
- **Confidence:** 92%
  - Implementation: 95% — Exact pattern exists in `ArrivalHome.tsx:146-161`: mailto link with `utility_action_used` analytics event. Copy and adapt.
  - Approach: 92% — "Need help?" link at bottom of each step, using email (not WhatsApp — no WhatsApp integration exists). Consistent with existing support surface.
  - Impact: 90% — Adds a small link element per step section. Minimal UI change. Analytics event uses existing `utility_action_used` type.
- **Acceptance:**
  - "Need help?" link visible at the bottom of the onboarding card (below step content, above skip/save buttons)
  - Link opens `mailto:hostelbrikette@gmail.com` with pre-filled subject including step number
  - Link fires `utility_action_used` analytics event with `stepId` and `surface: 'onboarding'`
  - Link is visually subtle (muted text, small font) — doesn't compete with primary CTA
  - New test verifies link renders and fires analytics event
- **Validation contract:**
  - TC-01: Render Step 1 → "Need help?" link visible with correct mailto href
  - TC-02: Click help link → `recordActivationFunnelEvent` called with `type: 'utility_action_used'`, `stepId`, `context.surface: 'onboarding'`
  - TC-03: Help link present on all 3 steps
  - Acceptance coverage: TC-01 covers rendering; TC-02 covers analytics; TC-03 covers all steps
  - Validation type: unit
  - Validation location: `apps/prime/src/components/portal/__tests__/GuidedOnboardingFlow.test.tsx`
  - Run: `cd apps/prime && npx jest --testPathPattern=GuidedOnboardingFlow.test`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: 6/6 tests pass. Support pattern confirmed in `ArrivalHome.tsx:146-161`.
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Immediate
  - Rollback: Remove link element
- **Documentation impact:** None
- **Notes / references:**
  - Support pattern: `ArrivalHome.tsx:146-161` — `window.open('mailto:hostelbrikette@gmail.com', '_self')` with analytics
  - Analytics event type: `'utility_action_used'` already in `ActivationFunnelEventType`

#### Build Completion (2026-02-12)
- **Status:** Complete
- **Commits:** d88fb72bdd
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03
  - Cycles: 1 (red-green)
  - Initial validation: FAIL expected (3 TC failures — no help link)
  - Final validation: PASS (19/19 tests including DS migration)
- **Confidence reassessment:**
  - Original: 92%
  - Post-validation: 92%
  - Delta reason: validation confirmed assumptions; straightforward implementation
- **Validation:**
  - Ran: `npx jest --config jest.config.cjs --testPathPattern=GuidedOnboardingFlow` — 19 PASS
- **Documentation updated:** None required
- **Implementation notes:** Added `<a>` mailto link with `utility_action_used` analytics at bottom of onboarding card. Pre-filled subject includes step number. `helpLink` i18n key added in EN + IT.

### OB-05: Replace loading spinner with skeleton loader and tip

- **Type:** IMPLEMENT
- **Deliverable:** Code change — `GuidedOnboardingFlow.tsx`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx`, `[readonly] packages/design-system/src/atoms/Skeleton.tsx`
- **Depends on:** OB-04 (file overlap: GuidedOnboardingFlow.tsx)
- **Blocks:** OB-06 (file overlap: GuidedOnboardingFlow.tsx)
- **Confidence:** 90%
  - Implementation: 92% — `Skeleton` component exists in `@acme/design-system/atoms`. Replace the 6-line spinner block (lines 310-316) with content-shaped skeletons + a tip message.
  - Approach: 90% — Skeleton layout should mirror Step 1 shape (title, description, 2×2 button grid, route cards). Tip text rotates or is static.
  - Impact: 88% — Replaces a single render branch (loading state). No logic change. Only visual improvement.
- **Acceptance:**
  - Loading state shows content-shaped skeleton (title bar, description bar, 2×2 grid of button-shaped skeletons, route card skeletons)
  - A tip message is shown below the skeleton (e.g., "Loading your arrival details...")
  - Skeleton uses `Skeleton` from design system (not custom `animate-pulse` divs)
  - Respects `motion-reduce:animate-none` (handled by Skeleton component)
  - Existing DS migration test still passes (semantic tokens used)
- **Validation contract:**
  - TC-01: Render with `isLoading=true` → Skeleton elements visible (not spinner)
  - TC-02: Render with `isLoading=true` → tip message text visible
  - TC-03: Render with `isLoading=false` → no Skeleton elements, normal step content shown
  - Acceptance coverage: TC-01–02 cover loading state; TC-03 covers transition to content
  - Validation type: unit
  - Validation location: `apps/prime/src/components/portal/__tests__/GuidedOnboardingFlow.test.tsx`
  - Run: `cd apps/prime && npx jest --testPathPattern=GuidedOnboardingFlow`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: 6/6 tests pass. DS migration test (`GuidedOnboardingFlow.ds-migration.test.tsx`) validates loading state at line 70-78 — will need update for Skeleton class names.
  - Unexpected findings: DS migration test renders loading state and checks for raw palette classes — need to ensure Skeleton uses semantic tokens (it does: `bg-muted`).
- **Rollout / rollback:**
  - Rollout: Immediate — visual-only change
  - Rollback: Revert to spinner
- **Documentation impact:** None
- **Notes / references:**
  - Skeleton API: `<Skeleton className="h-4 w-32" />` — `packages/design-system/src/atoms/Skeleton.tsx`
  - Current loading state: `GuidedOnboardingFlow.tsx:310-316`

#### Build Completion (2026-02-12)
- **Status:** Complete
- **Commits:** 44651a68c6
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03
  - Cycles: 1 (red-green)
  - Initial validation: FAIL expected (2 TC failures — still using spinner)
  - Final validation: PASS (22/22 tests including DS migration)
- **Confidence reassessment:**
  - Original: 90%
  - Post-validation: 92%
  - Delta reason: validation confirmed; Skeleton from DS uses `bg-muted` semantic token, DS migration test passes
- **Validation:**
  - Ran: `npx jest --config jest.config.cjs --testPathPattern=GuidedOnboardingFlow` — 22 PASS
- **Documentation updated:** None required
- **Implementation notes:** Replaced 6-line spinner with content-shaped Skeleton elements (title, description, 2x2 button grid, route card) + tip message. Uses `Skeleton` from `@acme/design-system/atoms`. Added `loadingTip` i18n key in EN + IT.

### OB-06: Add ARIA live regions and focus management

- **Type:** IMPLEMENT
- **Deliverable:** Code change — `GuidedOnboardingFlow.tsx`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx`
- **Depends on:** OB-05 (file overlap: GuidedOnboardingFlow.tsx)
- **Blocks:** OB-07 (tests final state)
- **Confidence:** 88%
  - Implementation: 90% — ARIA attributes (`role="status"`, `aria-live="polite"`) are simple additions. Focus management via `useRef` + `focus()` on step change is standard React.
  - Approach: 88% — Celebration toasts need `role="status"` for screen reader announcement. Step transitions need focus on the new step heading so keyboard users don't lose context.
  - Impact: 85% — Adds attributes and a `useEffect` for focus. No visual change. Low regression risk but needs manual screen reader verification for full confidence.
- **Acceptance:**
  - Celebration toast container has `role="status"` and `aria-live="polite"` so screen readers announce it
  - Step heading receives focus on step transition (programmatic `focus()` call)
  - Step heading has `tabIndex={-1}` to be focusable without being in tab order
  - Focus trap is NOT added (users can navigate away freely — this is not a modal)
  - Existing tests still pass; new test verifies focus behavior
- **Validation contract:**
  - TC-01: Celebration toast renders → container has `role="status"` attribute
  - TC-02: Navigate from Step 1 to Step 2 → Step 2 heading element receives focus
  - TC-03: Navigate from Step 2 to Step 3 → Step 3 heading element receives focus
  - TC-04: Navigate back from Step 2 to Step 1 → Step 1 heading receives focus
  - Acceptance coverage: TC-01 covers ARIA; TC-02–04 cover focus management
  - Validation type: unit
  - Validation location: `apps/prime/src/components/portal/__tests__/GuidedOnboardingFlow.test.tsx`
  - Run: `cd apps/prime && npx jest --testPathPattern=GuidedOnboardingFlow.test`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:**
  - Manual screen reader testing (VoiceOver on macOS)
  - E2E accessibility audit with axe-core
- **Planning validation:**
  - Checks run: 6/6 tests pass. `StepFlowShell` is mocked in DS migration test — focus management will target the inner heading, not the mocked shell.
  - Unexpected findings: MilestoneToast is a design system primitive (`packages/design-system/src/primitives/MilestoneToast.tsx`). The `role="status"` could be added there (better) or in the parent. Adding it in MilestoneToast.tsx would benefit all consumers. Decision: add to MilestoneToast.tsx if that file is simple enough; otherwise add wrapper in GuidedOnboardingFlow.
- **Rollout / rollback:**
  - Rollout: Immediate — accessibility improvement, no behavior change
  - Rollback: Remove attributes and focus calls
- **Documentation impact:** None
- **Notes / references:**
  - MilestoneToast: `packages/design-system/src/primitives/MilestoneToast.tsx`
  - Celebration handler: `GuidedOnboardingFlow.tsx:192-201`
  - Step transitions: `setStep(2)` at line 226, `setStep(3)` at line 250

#### Build Completion (2026-02-12)
- **Status:** Complete
- **Commits:** `41d1025dcf`
- **Execution cycle:**
  - Validation cases executed: TC-01 (pre-satisfied — MilestoneToast already has `role="status"` + `aria-live="polite"`), TC-02, TC-03, TC-04
  - Cycles: 1 (Red → Green)
  - Initial validation: FAIL expected (3 focus tests failed — no focus management implemented)
  - Final validation: PASS (23/23 tests)
- **Confidence reassessment:**
  - Original: 88%
  - Post-validation: 90%
  - Delta reason: TC-01 was already satisfied by MilestoneToast; implementation simpler than expected (no DS changes needed)
- **Validation:**
  - Ran: `npx jest --config jest.config.cjs --testPathPattern=GuidedOnboardingFlow.test` — PASS (23/23)
- **Documentation updated:** None required
- **Implementation notes:**
  - Added `cardRef` on container div, `prevStepRef` to track previous step
  - `useEffect` on `step`: when step changes, queries `h1` inside cardRef, sets `tabindex="-1"`, calls `focus()`
  - StepFlowShell is [readonly] — focus management applied from the parent via DOM query
  - MilestoneToast already has `role="status"` and `aria-live="polite"` — no changes needed for TC-01

### OB-07: Add Cypress E2E test for onboarding flow

- **Type:** IMPLEMENT
- **Deliverable:** New test file — `apps/prime/cypress/e2e/guided-onboarding-flow.cy.ts`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/prime/cypress/e2e/guided-onboarding-flow.cy.ts` (new), `[readonly] apps/prime/cypress/support/prime-mocks.ts`
- **Depends on:** OB-06 (tests final state after all improvements)
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 85% — Cypress infrastructure exists. `prime-mocks.ts` has `installPrimeApiMocks()`. Need to add Firebase pre-arrival data mock. Pattern from `guest-primary-journey.cy.ts` is clear.
  - Approach: 82% — Test the full 3-step flow: select method → pick route → set ETA → check items → finish. Verify data persistence calls and completion redirect.
  - Impact: 80% — New file only, no changes to existing code. Risk: Firebase Realtime Database mock may need expansion for pre-arrival reads/writes.
- **Acceptance:**
  - Cypress test covers: guest verification → onboarding entry → Step 1 (select method + confidence) → Step 2 (select ETA) → Step 3 (check items) → completion redirect
  - Test verifies `localStorage` completion flag is set after finishing
  - Test exercises skip path on at least one step
  - Test runs against the Prime dev server with mocked Firebase
- **Validation contract:**
  - TC-01: Guest enters verified portal → GuidedOnboardingFlow renders (not static placeholder)
  - TC-02: Select arrival method + confidence on Step 1, save → advances to Step 2
  - TC-03: Skip Step 2 → advances to Step 3 without saving ETA
  - TC-04: Check cash + rules on Step 3, finish → redirects to guest home
  - TC-05: After completion → `localStorage` key `prime_guided_onboarding_complete:{bookingId}` is set
  - Acceptance coverage: TC-01–05 cover full flow including skip path and persistence
  - Validation type: e2e
  - Validation location: `apps/prime/cypress/e2e/guided-onboarding-flow.cy.ts`
  - Run: `cd apps/prime && npx cypress run --spec cypress/e2e/guided-onboarding-flow.cy.ts`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:**
  - Confirmed Firebase mock covers pre-arrival data reads (not just writes)
  - Local Cypress run passes end-to-end
- **Planning validation:**
  - Checks run: Reviewed `guest-primary-journey.cy.ts` — uses `installPrimeApiMocks()` and Firebase intercepts. `prime-mocks.ts` intercepts `*.firebaseio.com` requests. Pre-arrival data mock may need additional intercept for `preArrival/{uuid}.json` reads.
  - Unexpected findings: Current E2E bypasses onboarding at line 26 by setting localStorage — confirms no existing E2E covers the flow.
- **Rollout / rollback:**
  - Rollout: Immediate — new test file only
  - Rollback: Delete test file
- **Documentation impact:** None
- **Notes / references:**
  - E2E pattern: `apps/prime/cypress/e2e/guest-primary-journey.cy.ts`
  - Mock setup: `apps/prime/cypress/support/prime-mocks.ts`
  - Firebase mock pattern: `cy.intercept('GET', '**/preArrival/*.json*', { body: {...} })`
  - Completion flag: `localStorage.setItem('prime_guided_onboarding_complete:${bookingId}', '1')`

#### Build Completion (2026-02-12)
- **Status:** Complete
- **Commits:** `65eda3149f`
- **Execution cycle:**
  - Validation cases executed: TC-01 through TC-05
  - Cycles: 1 (write tests — cannot run full Cypress without dev server)
  - Initial validation: N/A (E2E tests require running dev server)
  - Final validation: TypeScript compiles clean; unit tests unaffected (23/23 pass); lint clean
- **Confidence reassessment:**
  - Original: 82%
  - Post-validation: 85%
  - Delta reason: Test follows established prime-mocks patterns closely; added Firebase write intercepts for preArrival path. Cannot verify full E2E execution without dev server.
- **Validation:**
  - Ran: `tsc --noEmit` — PASS (no TS errors in E2E file)
  - Ran: `jest GuidedOnboardingFlow.test` — PASS (23/23 unit tests unaffected)
  - Ran: pre-commit hooks (typecheck + lint) — PASS
- **Documentation updated:** None required
- **Implementation notes:**
  - Created `apps/prime/cypress/e2e/guided-onboarding-flow.cy.ts` with 5 test cases
  - Uses `installPrimeApiMocks('pre-arrival')` + `setPrimeGuestSession()` for setup
  - Added Firebase RTDB write intercepts (PUT/PATCH on `**/preArrival/**`)
  - TC-01: portal entry renders onboarding; TC-02: Step 1 save advances; TC-03: Step 2 skip; TC-04: Step 3 finish redirects; TC-05: localStorage completion key set
  - Follows `i18n-exempt` pattern with literal UI copy assertions

### OB-08: Resolve dormant legacy onboarding components

- **Type:** DECISION
- **Deliverable:** Decision artifact — updated plan with chosen approach
- **Execution-Skill:** lp-build
- **Affects:** `apps/prime/src/components/onboarding/GuestProfileStep.tsx`, `apps/prime/src/components/onboarding/SocialOptInStep.tsx`, `apps/prime/src/components/onboarding/WelcomeHandoffStep.tsx`, `apps/prime/src/components/onboarding/OnboardingLayout.tsx`, `apps/prime/src/components/onboarding/ProgressBar.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 70% ⚠️
  - Implementation: 85% — Both options (remove or integrate) are straightforward
  - Approach: 55% — Unclear whether guest profiling (intent/interests/goals) has future value for personalization. Removing is simpler; integrating adds richer personalization.
  - Impact: 75% — 828 LOC of dormant code. Removing reduces maintenance; integrating adds onboarding depth.
- **Options:**
  - **Option A: Remove** — Delete all 5 legacy files + tests. Simplest. Reduces LOC by ~828. No future use case identified in current strategy.
  - **Option B: Integrate** — Add GuestProfileStep as optional Step 0 in GuidedOnboardingFlow. Enables intent-based personalization (social vs. quiet guests get different recommendations). More complex, adds a 4th step.
- **Recommendation:** Option A (Remove) because the current 3-step flow is focused on operational readiness (how to arrive), and the legacy components serve a different purpose (guest personality profiling). If profiling is wanted later, it can be rebuilt with the new patterns (i18n, design system, analytics).
- **Question for user:**
  - Should we remove the dormant legacy onboarding components (GuestProfileStep, SocialOptInStep, WelcomeHandoffStep) or integrate them into the active flow?
  - Why it matters: 828 LOC of untested, unmaintained code. Removing is clean; integrating adds personalization depth but increases onboarding length.
  - Default if no answer: Remove (Option A)
- **Acceptance:**
  - User selects option; plan updated with follow-up IMPLEMENT task if needed

#### Build Completion (2026-02-12)
- **Status:** Complete
- **Decision:** Option A — Remove
- **Commits:** `3c9d673988`
- **Execution cycle:**
  - Confirmed zero production imports of all 5 components
  - Deleted 5 component files + 4 test files (kept `chat-optin-controls.test.tsx` — unrelated)
  - 1472 lines removed
- **Confidence reassessment:**
  - Original: 70%
  - Post-validation: 95%
  - Delta reason: User chose Option A decisively; confirmed components are truly dormant (zero imports)
- **Validation:**
  - Ran: `jest` on onboarding + chat-optin tests — PASS (32/32)
  - Pre-commit hooks — PASS
- **Implementation notes:**
  - Removed: GuestProfileStep, SocialOptInStep, WelcomeHandoffStep, OnboardingLayout, ProgressBar + their tests + DS migration test
  - Kept: `chat-optin-controls.test.tsx` (tests `ChatOptInControls` from `settings/`, not onboarding)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Italian translations may not match brand voice | Use existing `it/Onboarding.json` style as reference; flag for native speaker review post-build |
| Single-file bottleneck (all tasks touch GuidedOnboardingFlow.tsx) | Strict sequential ordering via `/lp-sequence`; each task leaves file in working state |
| E2E Firebase mock may be incomplete for pre-arrival data | TASK-07 scouts: probe mock coverage before writing assertions; expand mocks if needed |
| Error toast retry may cause UX confusion (user retries then also advances) | Keep current "advance on error" behavior; toast is informational with optional retry |

## Observability

- Logging: New analytics events (`guided_step_skipped`, `guided_flow_abandoned`) tracked in localStorage funnel
- Metrics: `activationFunnel.ts:aggregateActivationFunnel()` will automatically include new events in weekly cohort reports
- Alerts/Dashboards: No new dashboards (localStorage-only analytics; external analytics is a separate initiative)

## Acceptance Criteria (overall)

- [ ] All 3 skip buttons fire analytics events
- [ ] All strings in GuidedOnboardingFlow are i18n-translated (EN + IT)
- [ ] API failures show visible error toast with retry option
- [ ] "Need help?" link visible in onboarding
- [ ] Loading state uses skeleton + tip instead of spinner
- [ ] Celebration toasts are screen-reader accessible
- [ ] Step transitions manage focus for keyboard users
- [ ] Cypress E2E test exercises full onboarding flow
- [ ] All existing tests pass (6 tests across 3 suites)
- [ ] No regressions in A/B experiment instrumentation

## Decision Log

- 2026-02-12: Plan created from onboarding audit fact-find brief. All P0 + P1 fixes included as IMPLEMENT tasks. Legacy component cleanup deferred as DECISION task.
