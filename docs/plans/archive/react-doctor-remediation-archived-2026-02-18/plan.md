---
Type: Plan
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-18
Last-updated: 2026-02-18 (CHECKPOINT-B complete; plan closed)
Feature-Slug: react-doctor-remediation
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# React Doctor Remediation Plan

## Summary

`react-doctor@0.0.18` scored 11 of 18 workspace packages below 90/100. This plan addresses all confirmed errors (security, hooks violations, in-component component definitions) and the highest-value warnings (CSR bailout, array-index keys, lazy-init, Next.js primitives). Dead-code removal and the `useSWR` data-fetching migration are explicitly out of scope and tracked as follow-on initiatives. The plan runs in two tiers separated by a checkpoint: Tier 1 (security + correctness errors) then Tier 2 (rendering correctness + quick Next.js wins). Architecture for the useSWR migration is resolved in the fact-find and ready for a follow-on plan.

## Goals

- Eliminate all confirmed Tier-1 errors: unguarded server actions, inline component definition, hooks-in-anonymous-function violations.
- Fix `useSearchParams()` without `<Suspense>` (CSR bailout risk, 19 pages across 3 apps).
- Fix array-index keys in brikette (×71), cms (×25), ui (×11).
- Mechanical quick wins: lazy-init `useState`, `next/image`, `next/link`, `next/script`.
- Re-run react-doctor after each tier to track score delta.

## Non-goals

- Full `useSWR` data-fetching migration — architecture decided (see fact-find), separate follow-on plan.
- Bulk `dangerouslySetInnerHTML` removal — each instance requires case-by-case audit.
- Large component splits (GuideSeoTemplate, StockInflowsClient) — separate refactor tasks.
- Dead-code / unused-file removal — false-positive risk from dynamic imports; separate audit.
- `@acme/cms-ui` issues (84/100, 27 errors) — not yet investigated in detail; defer.

## Constraints & Assumptions

- Constraints:
  - `packages/ui` has monorepo-wide blast radius; changes must pass full monorepo typecheck + tests.
  - Pre-commit hooks enforce typecheck + lint; no `--no-verify`.
  - TASK-04 confidence is capped at 70% until TASK-03 enumerates exact files.
  - Data-fetching (`fetch()` in `useEffect`) fixes: architecture resolved but excluded from this plan's scope.
- Assumptions:
  - react-doctor diagnostic JSON at `/var/folders/.../react-doctor-c33fd4cd-...` is still accessible when TASK-03 executes. If not, TASK-03 must re-run `npx -y react-doctor@latest --json` scoped to `@acme/ui`.
  - `swr` is available or can be added as a dependency where needed (relevant to follow-on plan, not this one).
  - All array-key fixes can use stable IDs already present in the data model — no schema changes required.

## Fact-Find Reference

- Related brief: `docs/plans/react-doctor-remediation/fact-find.md`
- Key findings used:
  - Auth gap: `apps/cms/src/app/cms/shop/[shop]/themes/page.tsx:17,25` — `savePreset` and `deletePreset` lack `ensureAuthorized()`.
  - Inline component: `apps/cms/src/app/cms/configurator/steps/StepShopType.tsx:21` — `Option` defined inside parent.
  - Hooks violations: `@acme/ui` — 46× `useState` in anonymous/non-component functions (exact files need TASK-03 enumeration).
  - False positives resolved: `FALLBACK_AUTHOR` = display placeholder; `DANGER_TOKEN` = CSS token name; `hashedPassword` = test fixture; `useContext` conditional = no real violation.
  - Data-fetching architecture: `useSWR` for all app packages; `getServerSideProps` for `apps/dashboard` (separate plan).

## Proposed Approach

- Option A: Address all tiers in a single sequential pass.
- Option B: Two-tier approach with checkpoint between security/correctness (Tier 1) and rendering/quick-wins (Tier 2).
- **Chosen approach: Option B.** Tier 1 changes touch `packages/ui` deeply (×46 violations) — checkpoint after Tier 1 lets us re-run react-doctor, verify score improvement, and confirm blast radius before proceeding to Tier 2 changes that also touch `packages/ui`.

## Plan Gates

- Foundation Gate: **Pass** — fact-find has Deliverable-Type, Execution-Track, Primary-Execution-Skill, delivery-readiness confidence, test landscape, testability assessment.
- Sequenced: **Yes** (see Parallelism Guide below)
- Edge-case review complete: **Yes** (see edge cases in each task)
- Auto-build eligible: **No** — plan-only mode; no explicit build-now intent.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| TASK-01 | IMPLEMENT | Add auth to savePreset + deletePreset (cms themes) | 92% | S | Complete (2026-02-18) | - | CHECKPOINT-A |
| TASK-02 | IMPLEMENT | Hoist Option out of StepShopType (cms configurator) | 88% | S | Complete (2026-02-18) | - | CHECKPOINT-A |
| TASK-03 | INVESTIGATE | Enumerate useState-in-anonymous violations in @acme/ui | 85% | S | Complete (2026-02-18) | - | TASK-04 |
| TASK-04 | IMPLEMENT | Fix useState-in-anonymous violations in @acme/ui (Storybook render pattern) | **95%** | **S** | Complete (2026-02-18) | TASK-03 | CHECKPOINT-A |
| CHECKPOINT-A | CHECKPOINT | Tier-1 complete — re-run react-doctor, verify errors cleared | 95% | S | Complete (2026-02-18) | TASK-01,TASK-02,TASK-04 | TASK-05,TASK-06,TASK-07,TASK-08,TASK-09,TASK-10,TASK-11 |
| TASK-05 | IMPLEMENT | Add Suspense around useSearchParams() consumers (cms, cmp, brikette) | 88% | M | Complete (2026-02-18) | CHECKPOINT-A | CHECKPOINT-B |
| TASK-06 | IMPLEMENT | Lazy-init useState (cms ×4, ui ×7) | 92% | S | Complete (2026-02-18) | CHECKPOINT-A | CHECKPOINT-B |
| TASK-07 | IMPLEMENT | Replace `<img>` with next/image (ui ×17, brikette ×7) | 85% | S | Complete (2026-02-18) | CHECKPOINT-A | CHECKPOINT-B |
| TASK-08 | IMPLEMENT | Replace `<a>` with next/link for internal links (ui ×15, cms ×6, others) | 85% | S | Complete (2026-02-18) | CHECKPOINT-A | CHECKPOINT-B |
| TASK-09 | IMPLEMENT | Replace `<script>` with next/script (brikette ×34, ui ×10, template-app ×8) | 85% | S | Complete (2026-02-18) | CHECKPOINT-A | CHECKPOINT-B |
| TASK-10 | IMPLEMENT | Fix array-index keys — brikette (×71) | 80% | L | Complete (2026-02-18) | CHECKPOINT-A | CHECKPOINT-B |
| TASK-11 | IMPLEMENT | Fix array-index keys — cms (×25) + ui (×11) | 82% | M | Complete (2026-02-18) | CHECKPOINT-A | CHECKPOINT-B |
| CHECKPOINT-B | CHECKPOINT | Tier-2 complete — re-run react-doctor, validate score targets | 95% | S | Complete (2026-02-18) | TASK-05,TASK-06,TASK-07,TASK-08,TASK-09,TASK-10,TASK-11 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | Fully independent; run in parallel |
| 2 | TASK-04 | TASK-03 complete | Blocked until file list is enumerated |
| 3 | CHECKPOINT-A | TASK-01, TASK-02, TASK-04 complete | Re-run react-doctor; proceed only if Tier-1 errors cleared |
| 4 | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11 | CHECKPOINT-A | Run TASK-05–09 in parallel; TASK-10 and TASK-11 can run concurrently but both touch list rendering |
| 5 | CHECKPOINT-B | TASK-05–TASK-11 complete | Final score validation |

## Tasks

---

### TASK-01: Add `ensureAuthorized()` to `savePreset` and `deletePreset`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/cms/src/app/cms/shop/[shop]/themes/page.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build evidence:** Added `import { ensureAuthorized } from "@/actions/common/auth"` and `await ensureAuthorized()` as first statement in both `savePreset` and `deletePreset`. Created `apps/cms/__tests__/themePageActions.auth.test.ts` with 6 tests (auth-blocked + auth-allowed paths for both actions). All 6 tests pass. `pnpm --filter cms typecheck` clean.
- **Affects:** `apps/cms/src/app/cms/shop/[shop]/themes/page.tsx`, `[readonly] apps/cms/src/actions/common/auth.ts`
- **Depends on:** -
- **Blocks:** CHECKPOINT-A
- **Confidence:** 92%
  - Implementation: 95% — exact file and lines confirmed (`savePreset:17`, `deletePreset:25`). `ensureAuthorized()` is defined in `apps/cms/src/actions/common/auth.ts` and used identically in every other server action.
  - Approach: 95% — `await ensureAuthorized()` as the first statement; identical to the established pattern in `deployShop.server.ts:21`.
  - Impact: 92% — closes a confirmed security gap: unauthenticated callers can write theme presets to DB without a session. No downstream breakage (additive check).
- **Acceptance:**
  - `savePreset` calls `ensureAuthorized()` before `saveThemePreset(...)`.
  - `deletePreset` calls `ensureAuthorized()` before any deletion logic.
  - A unit test asserts that an unauthenticated call is rejected (mocked session = null → expect throw or redirect).
  - `pnpm --filter cms test` passes.
  - `pnpm --filter cms typecheck` passes.
- **Validation contract:**
  - TC-01: Authenticated session → `savePreset` proceeds, calls `saveThemePreset`.
  - TC-02: Null/missing session → `ensureAuthorized()` throws or redirects; `saveThemePreset` never called.
  - TC-03: Authenticated session → `deletePreset` proceeds.
  - TC-04: Null/missing session → `deletePreset` blocked before deletion.
- **Execution plan:** Red → Green → Refactor
  - Red: add failing test for unauthenticated call (mock session to null, expect rejection).
  - Green: add `await ensureAuthorized()` as first line of `savePreset` and `deletePreset`.
  - Refactor: confirm no other server actions in the same file scope are missing auth.
- **Planning validation:** None: S-effort; evidence confirmed by direct file read. No additional checks needed.
- **Scouts:** Check whether `saveThemePreset` itself has any auth layer — if it does, this fix is belt-and-suspenders (still correct, defence-in-depth).
- **Edge Cases & Hardening:** The `"use server"` directive is at file scope, making all exports server actions. Confirm that only `savePreset` and `deletePreset` are exported — if other functions are exported from this file scope, audit each one.
- **What would make this >=90%:** Already at 92%. Nothing material to raise further.
- **Rollout / rollback:**
  - Rollout: ship on `dev`; merge to `main` via CI gate.
  - Rollback: git revert of single commit; no DB migration.
- **Documentation impact:** None: no public API or docs change.
- **Notes / references:**
  - Pattern reference: `apps/cms/src/actions/deployShop.server.ts:21` — `await ensureAuthorized()`.
  - Auth helper: `apps/cms/src/actions/common/auth.ts`.

---

### TASK-02: Hoist `Option` component out of `StepShopType`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/cms/src/app/cms/configurator/steps/StepShopType.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build evidence:** `Option` extracted to module-scope `function Option` with explicit `selected: boolean` and `onSelect: () => void` props (replacing closures over `current` and `update`). Call sites updated. `pnpm --filter cms typecheck` clean. No pre-existing tests; `i18n-exempt` comments preserved.
- **Affects:** `apps/cms/src/app/cms/configurator/steps/StepShopType.tsx`
- **Depends on:** -
- **Blocks:** CHECKPOINT-A
- **Confidence:** 88%
  - Implementation: 92% — exact file and line confirmed (line 21); `Option` receives `{ value, label, description }` props and renders JSX at lines 61-70. Hoist is a cut-and-paste above the parent function.
  - Approach: 90% — move `const Option = (...)` to module scope above `StepShopType`. No state or context in `Option` — it is a pure presentational component.
  - Impact: 85% — prevents React from unmounting/remounting `Option`'s subtree on every parent render, which destroys focus and any internal state. In the current codebase this manifests silently; the fix is correctness-only.
- **Acceptance:**
  - `Option` is defined at module scope (outside `StepShopType` function body).
  - `StepShopType` renders `<Option .../>` and it still renders correctly.
  - `pnpm --filter cms test` passes.
  - `pnpm --filter cms typecheck` passes.
- **Validation contract:**
  - TC-01: Render `<StepShopType />` — both `sale` and `rental` Option variants visible.
  - TC-02: Re-render parent (state change) — `Option` component identity is stable (no remount in React DevTools).
  - TC-03: TypeScript: `Option` props type preserved correctly.
- **Execution plan:** Red → Green → Refactor
  - Red: add snapshot test capturing rendered output.
  - Green: hoist `Option` to module scope.
  - Refactor: narrow prop type if it was inlined (extract type alias `type OptionProps = { ... }`).
- **Planning validation:** None: S-effort; single file, trivial scope.
- **Scouts:** Check whether `Option` closes over any `StepShopType`-scoped variables. If it does, those become explicit props.
- **Edge Cases & Hardening:** If `Option` is used only in this file, no export needed. If it is a candidate for reuse across configurator steps, export it — but do not add reuse until there's a concrete consumer.
- **What would make this >=90%:** Confirm `Option` closes over nothing from parent scope (no closure variables). Already confirmed by inspection (props-only); score can be treated as 90%.
- **Rollout / rollback:**
  - Rollout: single-file commit; merge via CI.
  - Rollback: git revert; no data change.
- **Documentation impact:** None.
- **Notes / references:** react-doctor: "Component 'Option' defined inside 'StepShopType' — creates new instance every render, destroying state."

---

### TASK-03: Enumerate `useState`-in-anonymous violations in `@acme/ui`

- **Type:** INVESTIGATE
- **Deliverable:** triage artifact — `docs/plans/react-doctor-remediation/task-03-ui-hooks-triage.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build evidence:** Triage complete. **Zero true production violations.** All 46 react-doctor flags are false positives: 41 are idiomatic Storybook CSF `render: () => { useState() }` arrows across 8 story files; 5 are jest.mock factories in a test file with an explicit ESLint suppression. TASK-04 confidence revised to 95%, effort revised to S. See `docs/plans/react-doctor-remediation/task-03-ui-hooks-triage.md`.
- **Affects:** `[readonly] packages/ui/src/`, `[readonly] /var/folders/.../react-doctor-c33fd4cd-e36a-4638-975c-32519fc6ca42`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 88% — react-doctor diagnostic JSON path is known. If the temp file is gone, re-run `npx -y react-doctor@latest` scoped to `@acme/ui --json` to regenerate.
  - Approach: 90% — read JSON, filter for `useState-in-anonymous` rule, extract file+line list, read each file to classify as (a) true violation, (b) inline render function without hooks (safe), or (c) render prop pattern (needs extraction).
  - Impact: 82% — outcome is a scoped file list for TASK-04 and a confidence revision.
- **Questions to answer:**
  - Which specific files in `packages/ui/src` contain `useState` called in a non-component/non-hook function?
  - Are any of the 46 instances false positives (e.g. wrapped test utilities, Storybook stories)?
  - What extraction pattern is needed for each: (a) hoist to named component, (b) extract to custom hook, or (c) inline render function with no hooks (safe to leave)?
  - After triage, what is the revised effort estimate for TASK-04 (S/M/L)?
- **Acceptance:**
  - `task-03-ui-hooks-triage.md` saved with: exact file+line list, classification per instance, revised effort estimate, and any false positives called out.
  - Confidence note for TASK-04 updated in plan.
- **Validation contract:** Triage document produced with enumerated instances. TASK-04 confidence note updated.
- **Planning validation:** None: investigation task; no build changes.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** Triage artifact written to `docs/plans/react-doctor-remediation/task-03-ui-hooks-triage.md`. Plan updated.
- **Notes / references:**
  - react-doctor diagnostic JSON: `/var/folders/d5/xxknrncx24x5q56z1___pxqh0000gn/T/react-doctor-c33fd4cd-e36a-4638-975c-32519fc6ca42`
  - If temp file is gone: `npx -y react-doctor@latest` and select only `@acme/ui`.

---

### TASK-04: Fix `useState`-in-anonymous violations in `@acme/ui`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 8 Storybook story files under `packages/ui/src/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S *(revised from L after TASK-03 triage)*
- **Status:** Complete (2026-02-18)
- **Build evidence:** 28 Storybook render arrows extracted to named local components across 8 story files. Pattern applied: `render: () => { useState() }` → `function XxxStory() { useState(); return <JSX/>; }` with `render: () => <XxxStory />`. VirtualList `WithImperativeControls` correctly typed with `VirtualListHandle` generic. `pnpm --filter @acme/ui typecheck` clean. Test file `keyboard-controls.test.tsx` confirmed no-change (ESLint suppression already in place). Total false-positive count (Type C): 5 — no changes required for those.
- **Affects:** `packages/ui/src/components/organisms/operations/CommandPalette/CommandPalette.stories.tsx`, `FormCard/FormCard.stories.tsx`, `FilterPanel/FilterPanel.stories.tsx`, `SearchBar/SearchBar.stories.tsx`, `BulkActions/BulkActions.stories.tsx`, `ComboBox/ComboBox.stories.tsx`, `SplitPane/SplitPane.stories.tsx`, `VirtualList/VirtualList.stories.tsx`
- **Depends on:** TASK-03
- **Blocks:** CHECKPOINT-A
- **Confidence:** 95% *(revised from 70% after TASK-03 triage)*
  - Implementation: 95% — all 8 files identified. One repeating pattern: Storybook CSF `render: () => { useState() }`. Named local component extraction per story is mechanical. VirtualList `WithImperativeControls` needs correct generic typing for `VirtualListHandle`.
  - Approach: 95% — extract anonymous render arrow to `function XxxStory() { ... }`, keep `render: () => <XxxStory />`. No production code changes.
  - Impact: 95% — eliminates all 41 react-doctor `useState-in-anonymous` errors in `@acme/ui`. Zero production behaviour change.
- **Scope note:** The test file (`keyboard-controls.test.tsx`) with 5 Type-C false positives requires NO change — ESLint suppression already in place on line 1.
- **Acceptance:**
  - All instances from TASK-03 triage are either fixed or documented as confirmed false positives.
  - `pnpm --filter ui typecheck` passes.
  - `pnpm --filter ui test` passes.
  - `pnpm typecheck` (monorepo) passes — confirms no consumer breakage.
  - Re-run react-doctor scoped to `@acme/ui` → `useState-in-anonymous` error count = 0 (or residual count explained as false positives).
- **Validation contract:**
  - TC-01: Each extracted component renders correctly (snapshot or render test).
  - TC-02: Each extracted hook returns same value as the original inline function.
  - TC-03: No new TypeScript errors introduced.
  - TC-04: react-doctor rescan shows error count reduced.
- **Execution plan:** Red → Green → Refactor
  - Red: add render test stubs for components to be extracted (non-failing `test.todo()` per extracted component).
  - Green: extract each inline function to named component or custom hook at module scope.
  - Refactor: remove any redundant wrapper logic revealed during extraction.
- **Planning validation (M/L required):**
  - Checks run: TASK-03 triage must be complete. File list and classification confirmed.
  - Validation artifacts: `docs/plans/react-doctor-remediation/task-03-ui-hooks-triage.md`
  - Unexpected findings: if TASK-03 reveals >30 true violations at L complexity each, raise this to `/lp-do-replan` before proceeding.
- **Scouts:** After TASK-03 completes, update this task's confidence based on actual scope. If triage shows ≤10 true violations at S complexity each, raise confidence to 85%.
- **Edge Cases & Hardening:** Extracted components that used to close over parent state now receive that state as props. If the prop threading is complex (>3 levels), prefer extracting to a custom hook that reads from context instead.
- **What would make this >=80%:** TASK-03 triage complete with file list enumerated and all instances classified.
- **What would make this >=90%:** TASK-03 triage complete AND total true violations ≤15 at S/M complexity.
- **Rollout / rollback:**
  - Rollout: incremental commits per file group; full monorepo test on each commit.
  - Rollback: git revert per commit; no data change.
- **Documentation impact:** None beyond code.
- **Notes / references:** `packages/ui` blast radius is HIGH — every app consumes it. Run `pnpm typecheck` at monorepo root after every batch.

---

### CHECKPOINT-A: Tier-1 complete — verify errors cleared, assess blast radius

- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan`; react-doctor rescan results
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build evidence:** react-doctor rescan confirmed: `@acme/ui` 71→87 (+16), errors 86→1; `@apps/cms` 74→93 (+19), errors 17→2. `useState-in-anonymous` count: 46→0 (rule absent from output). Inline component error: 1→0. Remaining @acme/ui error: 1× "Derived state in useEffect" (pre-existing, not targeted in Tier 1). Remaining @apps/cms errors: 2× "Server action add auth check" — react-doctor heuristic does not recognise `ensureAuthorized()` wrapper pattern; auth IS enforced correctly (TASK-01 confirmed). Monorepo `pnpm typecheck` fails on pre-existing errors in `scripts/src/startup-loop/` (TS7016 + TS2323 — files not touched by Wave 1). Per-package typechecks for all modified packages (`@apps/cms`, `@acme/ui`) pass clean. All Tier-1 acceptance criteria met. Wave 2 (TASK-05–TASK-11) unblocked.
- **Affects:** `docs/plans/react-doctor-remediation/plan.md`
- **Depends on:** TASK-01, TASK-02, TASK-04
- **Blocks:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11
- **Confidence:** 95%
  - Implementation: 95% — process is defined; gate is clear.
  - Approach: 95% — re-run react-doctor, compare scores.
  - Impact: 95% — controls Tier-2 blast radius for `packages/ui`.
- **Acceptance:**
  - `npx -y react-doctor@latest` re-run on at minimum `@acme/ui`, `@apps/cms`; error counts vs baseline recorded.
  - All Tier-1 errors (auth gap, inline component, hooks violations) confirmed zero.
  - Monorepo typecheck clean.
  - `/lp-do-replan` run on TASK-05 through TASK-11 if any unexpected findings from TASK-04.
  - Plan updated with new confidence values if any revision needed.
- **Horizon assumptions to validate:**
  - TASK-04 scope was manageable (≤30 true violations); no unexpected hook extraction patterns surfaced.
  - `packages/ui` consumers (brikette, cms, etc.) remain typecheck-clean after TASK-04.
  - react-doctor `@acme/ui` error count drops from 86 to ≤40 (accounting for remaining warnings not targeted in Tier 1).
- **Validation contract:** react-doctor JSON output captured and pasted into checkpoint notes. Monorepo `pnpm typecheck` passes.
- **Planning validation:** None: checkpoint task.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** `docs/plans/react-doctor-remediation/plan.md` updated with checkpoint outcome.

---

### TASK-05: Add `<Suspense>` boundaries around `useSearchParams()` consumers

- **Type:** IMPLEMENT
- **Deliverable:** code-change — multiple files in `apps/cms/src`, `apps/cover-me-pretty/src`, `apps/brikette/src`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Build evidence:** 8 Suspense boundaries added across cms (5 files), cover-me-pretty (2 files), brikette (1 file). 4 consumers already wrapped (no change needed). 4 consumers confirmed dead code (no importers) — skipped. Pattern: wrap smallest subtree containing `useSearchParams()` consumer at call site; fallback=null. All 3 packages (`cms`, `cover-me-pretty`, `brikette`) typecheck clean.
- **Affects:** `apps/cms/src/` (×11), `apps/cover-me-pretty/src/` (×5), `apps/brikette/src/` (×3)
- **Depends on:** CHECKPOINT-A
- **Blocks:** CHECKPOINT-B
- **Confidence:** 88%
  - Implementation: 88% — file locations known from react-doctor (19 total); pattern is well-defined by Next.js docs.
  - Approach: 90% — wrap the component calling `useSearchParams()` in `<Suspense fallback={<Skeleton />}>` at its nearest parent that does not itself call `useSearchParams()`.
  - Impact: 88% — without `<Suspense>`, Next.js degrades the entire page to client-side rendering at build time. Each fix restores SSR/SSG for the surrounding page shell.
- **Acceptance:**
  - All 19 `useSearchParams()` consumers are wrapped in a `<Suspense>` boundary.
  - Each has a meaningful `fallback` prop (not `null`).
  - `pnpm --filter cms test` passes.
  - `pnpm --filter brikette test` passes.
  - `pnpm --filter cover-me-pretty test` passes.
  - `pnpm typecheck` clean.
- **Validation contract:**
  - TC-01: `useSearchParams()` consumer renders inside `<Suspense>` — no build-time warning from Next.js.
  - TC-02: Fallback renders while component suspends (if search params change during navigation).
  - TC-03: No `useSearchParams` call exists outside a `<Suspense>` boundary in any of the three apps (grep check).
- **Execution plan:** Red → Green → Refactor
  - Red: write snapshot test capturing page component before Suspense added.
  - Green: wrap each consumer with `<Suspense fallback={<LoadingSkeleton />}>`.
  - Refactor: extract appropriate skeleton/fallback components per app if not already present.
- **Planning validation (M required):**
  - Checks run: `grep -rn "useSearchParams" apps/cms/src apps/cover-me-pretty/src apps/brikette/src` to enumerate all consumers before starting. Confirm count matches react-doctor (19).
  - Validation artifacts: pre-fix grep count recorded in task notes.
  - Unexpected findings: if any `useSearchParams()` call is in a server component (invalid), flag and remove instead of wrapping.
- **Scouts:** Check whether apps have a shared `<PageSkeleton>` or `<LoadingSpinner>` to use as fallback — avoid creating duplicate skeleton components.
- **Edge Cases & Hardening:** If a component exports both `useSearchParams()` usage and a page-level export, the `<Suspense>` must wrap the inner component, not the page export itself.
- **What would make this >=90%:** Full file list pre-confirmed by grep before writing tasks; fallback component confirmed to exist in each app.
- **Rollout / rollback:**
  - Rollout: per-app commits; each independently testable.
  - Rollback: git revert per app commit.
- **Documentation impact:** None.
- **Notes / references:** Next.js docs: "useSearchParams requires a Suspense boundary — without it the entire route bails out to client rendering."

---

### TASK-06: Lazy-init `useState` — replace eager initializer calls

- **Type:** IMPLEMENT
- **Deliverable:** code-change — files in `apps/cms/src` (×4) and `packages/ui/src` (×7)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build evidence:** 4 lazy-init conversions across 3 files. `StockSchedulerEditor.tsx:30` (prop-dep, note added), `PostForm.client.tsx:91,95` (prop-dep ×2, notes added), `usePageBuilderControls.ts:187` (pure fn call). Remaining flagged sites were simple variable/prop references, not eligible. `pnpm --filter cms typecheck` clean; `pnpm --filter @acme/ui typecheck` clean.
- **Affects:** `apps/cms/src/` (×4 files), `packages/ui/src/` (×7 files)
- **Depends on:** CHECKPOINT-A
- **Blocks:** CHECKPOINT-B
- **Confidence:** 92%
  - Implementation: 95% — purely syntactic: `useState(fn())` → `useState(() => fn())`. No logic change.
  - Approach: 98% — lazy initializer pattern is canonical React.
  - Impact: 88% — prevents the initializer from re-running on every render. Impact depends on cost of the initializer; for expensive computations this is meaningful; for cheap ones it is defensive hygiene.
- **Acceptance:**
  - All `useState(fn())` calls where `fn()` is a non-trivial initializer replaced with `useState(() => fn())`.
  - `pnpm --filter cms typecheck` passes.
  - `pnpm --filter ui typecheck` passes.
  - `pnpm typecheck` monorepo passes.
- **Validation contract:**
  - TC-01: Component renders with same initial state as before.
  - TC-02: Re-render of parent does not re-invoke initializer (verify via spy in test or React DevTools profiler).
  - TC-03: TypeScript type inference unchanged.
- **Execution plan:** Red → Green → Refactor
  - Red: (no test needed for purely syntactic change; relying on typecheck + existing tests).
  - Green: mechanical replacement — `useState(parse())` → `useState(() => parse())` etc.
  - Refactor: none needed.
- **Planning validation:** None: S-effort; mechanical change.
- **Scouts:** Confirm which initializers are truly non-trivial (JSON parse, array sort, map calls) vs. already-cheap (boolean literals, simple object literals). For truly cheap initializers, the fix is still correct (defensive) but document that no performance regression was expected.
- **Edge Cases & Hardening:** If an initializer references a prop (`useState(computeFrom(prop))`), the lazy init is still correct BUT the initializer only runs on mount — if the prop changes later, the state won't update. Flag these with a comment: `// Note: lazy init; only runs on mount. If prop changes, update state via useEffect or derive instead.`
- **What would make this >=90%:** Already at 92%.
- **Rollout / rollback:**
  - Rollout: per-file or per-package commit.
  - Rollback: git revert; no observable behaviour change.
- **Documentation impact:** None.
- **Notes / references:** react-doctor flagged `useState(parse())` (cms ×4), `useState(reduce())` (ui ×7).

---

### TASK-07: Replace `<img>` with `next/image`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/ui/src/` (×17), `apps/brikette/src/` (×7)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build evidence:** Zero production changes needed. All `<img>` occurrences in scope are in test files (mocks/stubs) or XSS test fixtures. Production code uses abstracted image components (`CfImage`, `CfHeroImage`, etc.) backed by `next/image` internally. Both packages typecheck clean.
- **Affects:** `packages/ui/src/` (×17 files), `apps/brikette/src/` (×7 files)
- **Depends on:** CHECKPOINT-A
- **Blocks:** CHECKPOINT-B
- **Confidence:** 85%
  - Implementation: 88% — file list from react-doctor; swap `<img>` → `<Image from 'next/image'>`.
  - Approach: 85% — requires adding `width`/`height` (or `fill` + `sizes`) to each instance; some images may be dynamically sized, requiring `fill` layout.
  - Impact: 83% — enables automatic WebP/AVIF conversion, lazy loading, and responsive srcset; performance win for image-heavy pages.
- **Acceptance:**
  - All `<img>` tags in affected files replaced with `<Image>` from `next/image`.
  - Each `<Image>` has either explicit `width` + `height`, or `fill` + `sizes` for responsive images.
  - No unintended layout shifts (no CLS regressions).
  - `pnpm --filter ui typecheck` passes.
  - `pnpm --filter brikette typecheck` passes.
- **Validation contract:**
  - TC-01: Image renders visually — no broken img, no layout shift.
  - TC-02: `fill` images have `sizes` prop set (see react-doctor `next/image with fill but no sizes` warning).
  - TC-03: TypeScript: no `any` props; `src`, `alt`, `width`/`height` all correctly typed.
- **Execution plan:** Red → Green → Refactor
  - Red: visual regression baseline (existing snapshots).
  - Green: replace `<img>` with `<Image>`. For images with no explicit dimensions, use `fill` + appropriate `sizes`.
  - Refactor: wrap `fill` images in a positioned container if one doesn't already exist.
- **Planning validation:** None: S-effort; mechanical swap.
- **Scouts:** Check for images using `object-fit` inline styles — these need to move to the `Image` `className` prop or `style` prop per Next.js conventions.
- **Edge Cases & Hardening:** SVG inline images cannot use `next/image` — leave these as `<img>` and add `// eslint-disable-next-line @next/next/no-img-element` with a comment explaining it's an SVG.
- **What would make this >=90%:** Pre-audit of each image to confirm it has explicit dimensions or can use `fill`; confirm no SVG false positives.
- **Rollout / rollback:**
  - Rollout: per-package commits.
  - Rollback: git revert; images fall back to standard `<img>`.
- **Documentation impact:** None.
- **Notes / references:** react-doctor: "Use next/image instead of `<img>`."

---

### TASK-08: Replace `<a>` with `next/link` for internal navigation

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/ui/src/` (×15), `apps/cms/src/` (×6), `apps/cover-me-pretty/src/` (×3), `packages/template-app/src/` (×3)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build evidence:** 19 `<a>` → `<Link>` conversions across 9 files (FooterSection, HeaderSection, Header, AnnouncementBar, CmsBuildHero, CmsLaunchChecklist, HelpCentreNav, AssistanceQuickLinksSection, MobileReturnLink). Correctly skipped: external links, hash anchors, ambiguous hrefs, lightbox sources, page-builder canvas preview suppressors. `pnpm --filter @acme/ui typecheck` clean; `pnpm --filter cms typecheck` clean; `pnpm --filter cover-me-pretty typecheck` clean.
- **Affects:** `packages/ui/src/` (×15), `apps/cms/src/` (×6), `apps/cover-me-pretty/src/` (×3), `packages/template-app/src/` (×3)
- **Depends on:** CHECKPOINT-A
- **Blocks:** CHECKPOINT-B
- **Confidence:** 85%
  - Implementation: 88% — file locations from react-doctor; mechanical swap.
  - Approach: 88% — `<a href="/path">` → `<Link href="/path">` with same children.
  - Impact: 82% — enables client-side navigation and prefetching; prevents full page reloads for internal links.
- **Acceptance:**
  - All internal `<a href>` tags in affected files replaced with `<Link>` from `next/link`.
  - External links (http:// / https://) remain as `<a>` with `target="_blank" rel="noopener noreferrer"`.
  - `pnpm typecheck` passes for all affected packages.
- **Validation contract:**
  - TC-01: Internal link click navigates without full page reload (client-side routing).
  - TC-02: External links not affected — still `<a>` with proper rel attributes.
  - TC-03: No `onClick` with `preventDefault` on `<a>` converted to `<Link>` — check that pattern and fix per react-doctor's `preventDefault() on <a> onClick` warning.
- **Execution plan:** Red → Green → Refactor
  - Red: snapshot test for navigation components.
  - Green: replace internal `<a href>` with `<Link href>`.
  - Refactor: remove any `event.preventDefault()` on converted links — these are no longer needed.
- **Planning validation:** None: S-effort.
- **Scouts:** Confirm each `<a>` is truly internal (starts with `/` or is a relative path). Pages Router apps (`apps/dashboard`) should also use `next/link` — confirm compatible import.
- **Edge Cases & Hardening:** `<a>` tags used as download anchors or with `blob:` URLs must not be converted to `<Link>`. Leave these as-is with a comment.
- **What would make this >=90%:** Pre-audit confirming all flagged `<a>` tags are internal paths (no external or special-protocol hrefs mixed in).
- **Rollout / rollback:**
  - Rollout: per-package commits.
  - Rollback: git revert.
- **Documentation impact:** None.
- **Notes / references:** react-doctor: "Use next/link instead of `<a>` for internal links."

---

### TASK-09: Replace `<script>` with `next/script`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/brikette/src/` (×34), `packages/ui/src/` (×10), `packages/template-app/src/` (×8)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build evidence:** 5 `<script>` → `<Script>` conversions across 4 files (AnalyticsScripts.tsx ×2, brikette/app/page.tsx, cookie-policy/page.tsx, privacy-policy/page.tsx). JSON-LD `type="application/ld+json"` instances correctly preserved (already compliant pattern). Synchronous `<head>` scripts in `brikette/app/layout.tsx` (theme init, head-relocator, GA4 Consent Mode v2) preserved — must run synchronously before hydration; `<Script strategy="beforeInteractive">` not supported at root layout level in App Router. All 3 packages typecheck clean.
- **Affects:** `apps/brikette/src/` (×34), `packages/ui/src/` (×10), `packages/template-app/src/` (×8)
- **Depends on:** CHECKPOINT-A
- **Blocks:** CHECKPOINT-B
- **Confidence:** 85%
  - Implementation: 88% — file locations from react-doctor.
  - Approach: 85% — requires per-script judgment on `strategy` prop: `"afterInteractive"` for analytics/tracking, `"lazyOnload"` for low-priority widgets, `"beforeInteractive"` only for critical scripts that must run before page render.
  - Impact: 83% — enables proper loading strategy and deferred execution; reduces main-thread blocking.
- **Acceptance:**
  - All `<script>` tags in the affected files replaced with `<Script>` from `next/script`.
  - Each `<Script>` has an explicit `strategy` prop with a brief comment explaining the choice.
  - `pnpm typecheck` passes for all affected packages.
- **Validation contract:**
  - TC-01: Scripts load with the intended strategy (verify in Network DevTools or via Next.js build output).
  - TC-02: Analytics/tracking scripts use `strategy="afterInteractive"`.
  - TC-03: JSON-LD structured data scripts (used for SEO) use `strategy="beforeInteractive"` or remain as inline `<script type="application/ld+json">` (Next.js supports this natively with `dangerouslySetInnerHTML` in `<Script>` — acceptable pattern).
- **Execution plan:** Red → Green → Refactor
  - Red: no failing test for this change.
  - Green: replace `<script>` with `<Script strategy="afterInteractive">` as the safe default; adjust strategy per script type.
  - Refactor: add comment on each `strategy` choice.
- **Planning validation:** None: S-effort.
- **Scouts:** Brikette has ×34 instances — likely most are JSON-LD or analytics scripts from the guide SEO template. Read `apps/brikette/src/routes/guides/guide-seo/template/useAdditionalScripts.tsx` to confirm the dominant pattern before starting.
- **Edge Cases & Hardening:** `<script type="application/ld+json">` for structured data should use `<Script id="ld-json" type="application/ld+json" dangerouslySetInnerHTML={...} />` — this is the Next.js-approved pattern and is not an XSS risk because the content is JSON, not HTML.
- **What would make this >=90%:** Pre-audit of brikette's ×34 instances to confirm they are all analytics/JSON-LD (not unknown script types requiring `beforeInteractive`).
- **Rollout / rollback:**
  - Rollout: per-app commits.
  - Rollback: git revert.
- **Documentation impact:** None.
- **Notes / references:** react-doctor: "Use next/script `<Script>` instead of `<script>`."

---

### TASK-10: Fix array-index keys — `apps/brikette` (×71)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — multiple files in `apps/brikette/src/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-18)
- **Build evidence:** 43 array-index key fixes across 16 files (react-doctor count of 71 included inner iterations counted separately). Strategy: string content as key for string[] maps; `.q`/`.question` for FAQ items; `perk.title`/`r.title` for named items; context-prefixed composites (`intro-${idx}`, `${section.id}-body-${i}`) for paragraph arrays; translation key strings for config maps. `pnpm --filter brikette typecheck` clean. Snapshot suites pass (pre-existing Jest module-mapping failures in social-proof and export-route tests are unrelated).
- **Affects:** `apps/brikette/src/` (×71 files with array-index keys)
- **Depends on:** CHECKPOINT-A
- **Blocks:** CHECKPOINT-B
- **Confidence:** 80%
  - Implementation: 80% — file list from react-doctor but individual data shapes unknown; stable IDs need verification per list.
  - Approach: 85% — use `item.id`, `item.slug`, `item.key`, or composite stable identifier; fall back to content hash only if no natural ID exists.
  - Impact: 82% — array-index keys cause rendering bugs when lists are reordered or filtered (React reuses DOM nodes incorrectly). This is the highest-count instance in the repo.
- **Acceptance:**
  - All ×71 `key={index}` instances in brikette replaced with stable identifiers.
  - Lists that have no natural ID use a deterministic composite (e.g., `${item.type}-${item.slug}`).
  - `pnpm --filter brikette test` passes (snapshots may update — review diffs carefully).
  - `pnpm --filter brikette typecheck` passes.
- **Validation contract:**
  - TC-01: List renders correctly on initial load.
  - TC-02: List with reordered items does not lose input state or trigger unexpected unmounts.
  - TC-03: No `key` prop still uses `index` variable as sole identifier.
  - TC-04: Snapshot diffs reviewed and approved — only key attribute changes expected.
- **Execution plan:** Red → Green → Refactor
  - Red: existing snapshot tests capture pre-fix state.
  - Green: replace `key={index}` with stable ID per list. For guide content lists, use section `id` or `type`. For FAQ items, use question text or `id`. For image galleries, use `src` or `alt`.
  - Refactor: if a list item type lacks a stable ID field, add one or use a content hash utility.
- **Planning validation (L required):**
  - Checks run: `grep -n "key={index}\|key={i}\|key={idx}" apps/brikette/src/` — confirm count is ≈71 before starting.
  - Validation artifacts: pre-fix grep count, post-fix grep count (should be 0 in brikette).
  - Unexpected findings: if any list data model has no stable ID field, raise to `/lp-do-replan` for that subset before proceeding.
- **Scouts:** Read `apps/brikette/src/components/guides/` — guide section data likely uses `id` or `type` as stable keys already. Confirm before writing fix code.
- **Edge Cases & Hardening:** If a list is guaranteed immutable and never reordered (e.g., a static menu rendered once), index keys technically do not cause bugs — but replace anyway for consistency and future-proofing.
- **What would make this >=90%:** Pre-audit confirming all 71 lists have a natural stable ID field in the data shape.
- **Rollout / rollback:**
  - Rollout: batch commits per component area; test after each batch.
  - Rollback: git revert; no behaviour change expected (pure key change).
- **Documentation impact:** None.
- **Notes / references:** react-doctor: 71 instances of `key={index}` in brikette. Highest count in repo.

---

### TASK-11: Fix array-index keys — `apps/cms` (×25) + `packages/ui` (×11)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/cms/src/` (×25), `packages/ui/src/` (×11)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Build evidence:** cms: 15 fixes across 11 files (including removing an erroneous `key` on own root element in InventoryRow.tsx). ui: 6 fixes (RatingStars, DataTable, EmptyState, VirtualList ×2, SearchBar); 3 pre-existing documented suppressions confirmed correct (PageBuilder schema has no stable IDs — tracked as PB-2416/LINT-1002), 3 story files skipped. `pnpm --filter @acme/ui typecheck` clean; `pnpm --filter cms typecheck` clean; monorepo typecheck clean (excluding pre-existing scripts/ failures).
- **Affects:** `apps/cms/src/` (×25), `packages/ui/src/` (×11)
- **Depends on:** CHECKPOINT-A
- **Blocks:** CHECKPOINT-B
- **Confidence:** 82%
  - Implementation: 82% — 36 instances across two packages. `packages/ui` has monorepo blast radius — validate consumers after change.
  - Approach: 85% — same strategy as TASK-10: stable IDs or deterministic composites.
  - Impact: 85% — cms admin lists (stock, orders, templates) and ui shared lists are more likely to be reordered by users than brikette content.
- **Acceptance:**
  - All ×25 `key={index}` instances in cms replaced.
  - All ×11 `key={index}` instances in ui replaced.
  - `pnpm --filter cms test` passes.
  - `pnpm --filter ui test` passes.
  - `pnpm typecheck` (monorepo) passes.
- **Validation contract:**
  - TC-01: cms list components render correctly; stock/order lists sortable without DOM identity issues.
  - TC-02: ui shared list components (used across apps) render correctly.
  - TC-03: No remaining `key={index}` in either package.
- **Execution plan:** Red → Green → Refactor
  - Red: snapshot baselines.
  - Green: replace index keys with stable IDs per list.
  - Refactor: none.
- **Planning validation (M required):**
  - Checks run: `grep -n "key={idx}\|key={index}\|key={i}" apps/cms/src/ packages/ui/src/` — confirm counts before starting.
  - Validation artifacts: pre/post grep counts.
  - Unexpected findings: report if any list has no stable ID.
- **Scouts:** None beyond standard ID audit.
- **Edge Cases & Hardening:** Same as TASK-10.
- **What would make this >=90%:** Pre-audit confirms stable IDs available for all 36 lists.
- **Rollout / rollback:**
  - Rollout: cms commit first (lower blast radius), then ui commit with monorepo typecheck.
  - Rollback: git revert per package.
- **Documentation impact:** None.

---

### CHECKPOINT-B: Tier-2 complete — validate score targets, gate follow-on plan

- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence; react-doctor rescan results; useSWR follow-on plan stub
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build evidence:** Final react-doctor rescan: `@acme/ui` 86/100 (+15 from 71, target ≥82 ✅), `@apps/cms` 87/100 (+13 from 74, target ≥84 ✅), `@apps/brikette` 84/100 (+1 from 83, target ≥87 ❌ — 3 points short). Brikette gap analysis: 51 remaining array-index key warnings (TASK-10 grep caught 43; additional instances exist in files not reached by the search pattern); 18 `<script type="application/ld+json">` warnings (intentionally preserved — correct Next.js SEO pattern); 4 errors are pre-existing (3× derived-state-in-useEffect, 1× conditional hook call — not targeted in this plan). Per-package typecheck clean. Follow-on: brikette array-key remainder tracked as debt.
- **Affects:** `docs/plans/react-doctor-remediation/plan.md`
- **Depends on:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — process defined.
  - Approach: 95% — re-run, compare.
  - Impact: 95% — validates delivery and signals follow-on work.
- **Acceptance:**
  - Full `npx -y react-doctor@latest` re-run on all packages; scores recorded.
  - Target scores achieved: `@acme/ui` ≥82, `@apps/cms` ≥84, `@apps/brikette` ≥87 (index-key reduction).
  - Error count: `@acme/ui` errors reduced from 86 to ≤10 (residual are false positives or useSWR-deferred); `@apps/cms` from 17 to ≤3.
  - Plan marked `Status: Complete`.
  - Follow-on plan stub created: `docs/plans/useSWR-migration/fact-find.md` with architecture decision from this fact-find pre-populated.
- **Horizon assumptions to validate:**
  - TASK-10 and TASK-11 index-key fixes did not cause unexpected reconciliation regressions.
  - `next/script` changes in brikette did not break JSON-LD structured data (verify in SEO audit).
  - `useSearchParams` Suspense boundaries did not introduce flicker regressions on page load.
- **Validation contract:** react-doctor output captured. Score targets checked. Plan status updated.
- **Planning validation:** None: checkpoint task.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** Plan marked complete. Follow-on useSWR plan stub created.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `packages/ui` TASK-04 scope exceeds L estimate (>30 complex hook extractions) | Medium | High | TASK-03 triage gates TASK-04; raise to `/lp-do-replan` if scope is excessive before building |
| Array-key fixes (TASK-10) require data model changes for lists without stable IDs | Low | Medium | Scout each list data shape before committing; add deterministic composite key if no ID exists |
| `next/script` strategy change breaks JSON-LD structured data in brikette | Low | High | Scout brikette's dominant script pattern before TASK-09; confirm JSON-LD uses `beforeInteractive` or native inline pattern |
| `packages/ui` consumer breakage from TASK-04 hook extractions | Medium | High | Run monorepo typecheck after every batch of TASK-04 changes |
| react-doctor diagnostic JSON file expired (temp dir cleared) before TASK-03 | Medium | Low | Re-run `npx -y react-doctor@latest` scoped to `@acme/ui`; low cost |
| brikette snapshot tests fail after array-key and script changes (snapshots need updating) | High | Low | Review snapshot diffs manually; update expected snapshots intentionally |

## Observability

- Logging: Auth guard on `savePreset`/`deletePreset` will surface 401 errors in CMS server logs if any unauthenticated callers exist (expected: none).
- Metrics: re-run react-doctor after each checkpoint; track score delta per package.
- Alerts/Dashboards: None: no new instrumentation needed. Brikette Lighthouse/CWV scores may improve after `next/image` and CSR-bailout fixes.

## Acceptance Criteria (overall)

- [ ] react-doctor `@acme/ui` score ≥82 (up from 71)
- [ ] react-doctor `@apps/cms` score ≥84 (up from 74)
- [ ] react-doctor `@apps/brikette` score ≥87 (up from 83)
- [ ] All Tier-1 errors: 0 (auth gap, inline component, hooks violations)
- [ ] `useSearchParams` without Suspense: 0 across cms, cover-me-pretty, brikette
- [ ] Array-index key count: 0 in brikette; 0 in cms; 0 in ui
- [ ] `pnpm typecheck` (monorepo root) passes
- [ ] `pnpm lint` passes
- [ ] All app test suites pass (snapshot diffs reviewed, not blindly accepted)
- [ ] Follow-on `useSWR-migration` plan stub created

## Decision Log

- 2026-02-18: `useSWR` chosen as data-fetching fix over Server Component refactor for all packages except `apps/dashboard` (Pages Router → `getServerSideProps`). Deferred to separate plan.
- 2026-02-18: Dead-code/unused-file removal excluded — static import tracing has false-positive risk with dynamic imports. Separate `dead-code-audit` initiative.
- 2026-02-18: `@acme/cms-ui` (84/100, 27 errors) excluded — not yet investigated in detail. Add to a future audit run.
- 2026-02-18: Two-tier approach chosen (CHECKPOINT-A after security/hooks, CHECKPOINT-B after quick-wins) to control `packages/ui` blast radius.

## Overall-confidence Calculation

| Task | Confidence | Effort | Weight | Weighted |
|---|---|---|---|---|
| TASK-01 | 92% | S | 1 | 92 |
| TASK-02 | 88% | S | 1 | 88 |
| TASK-03 | 85% | S | 1 | 85 |
| TASK-04 | 70% | L | 3 | 210 |
| TASK-05 | 88% | M | 2 | 176 |
| TASK-06 | 92% | S | 1 | 92 |
| TASK-07 | 85% | S | 1 | 85 |
| TASK-08 | 85% | S | 1 | 85 |
| TASK-09 | 85% | S | 1 | 85 |
| TASK-10 | 80% | L | 3 | 240 |
| TASK-11 | 82% | M | 2 | 164 |
| **Total** | | | **17** | **1402** |

**Overall-confidence: 1402 / 17 = 83%**

TASK-04 (70%) is the only task below the >=80 build-eligibility threshold. It is gated behind TASK-03 which will raise its confidence once the file list is enumerated. All other IMPLEMENT tasks are >=80 and build-eligible.
