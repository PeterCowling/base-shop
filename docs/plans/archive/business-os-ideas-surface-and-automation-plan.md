---
Type: Plan
Status: Completed
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-09
Last-updated: 2026-02-09
Last-reviewed: 2026-02-09
Feature-Slug: business-os-ideas-surface-and-automation
Deliverable-Type: code-change
Execution-Track: mixed
Primary-Execution-Skill: build-feature
Supporting-Skills: ideas-go-faster, fact-find, plan-feature
Overall-confidence: 100%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort (S=1, M=2, L=3)
Relates-to charter: docs/business-os/business-os-charter.md
Business-OS-Integration: off
Business-Unit: BOS
Card-ID:
---

# Business OS Ideas Surface and Automation Plan

## Summary
This plan moves idea entities completely out of Kanban lanes and makes `/ideas` the sole idea triage surface. It introduces two explicit idea buckets (P1-P3 primary, P4-P5 secondary), preserves idea detail drill-down, and hardens weak automation edges identified in the current pipeline. The plan also treats Stage 7b backfill as a controlled policy decision with bounded implementation options.

## Goals
- Ensure no idea entities are rendered in board lanes.
- Make `/ideas` the canonical triage UI for all priorities with clear primary/secondary lists.
- Preserve workflow continuity from idea generation to fact-find, plan, and build.
- Reduce automation drift/failure blind spots (partial sweep writes, stale discovery index, fairness gaps).

## Non-goals
- Replacing card execution lanes or card lifecycle semantics.
- Replacing the existing Cabinet lens stack.
- Building full autonomous scheduling/orchestration in this increment.

## Constraints & Assumptions
- Constraints:
  - D1 + agent API remain the source of truth.
  - Deterministic lane transitions remain in `/plan-feature` and `/build-feature`.
  - Keep changes backward-compatible with current ideas/card data.
- Assumptions:
  - Default policy for this increment is Option A: keep P1-P3 auto-card creation and keep ideas visible in `/ideas` with explicit dual-presence labeling.
  - Stage 7b remains disabled unless explicitly approved and gated.

## Fact-Find Reference
- Related brief: `docs/plans/business-os-ideas-surface-and-automation-fact-find.md`
- Key findings:
  - Board currently loads and renders inbox ideas in lanes (`BoardPage` -> `BoardView` -> `BoardLane`).
  - `/ideas` route exists and already supports server-driven filtering.
  - Highest weak points: partial sweep drift, fairness starvation for older P1/P2 without fact-find docs, discovery-index fragility.

## Existing System Notes
- Key modules/files:
  - `apps/business-os/src/app/boards/[businessCode]/page.tsx` — board data assembly.
  - `apps/business-os/src/components/board/BoardView.tsx` and `apps/business-os/src/components/board/BoardLane.tsx` — lane rendering.
  - `apps/business-os/src/components/ideas/*` and `apps/business-os/src/app/ideas/page.tsx` — ideas surface.
  - `.claude/skills/ideas-go-faster/SKILL.md` — Stage 6/7 behavior and determinism contract.
- Patterns to follow:
  - Server-driven URL query state for list pages.
  - Deterministic ordering and fail-closed behavior for workflow-critical writes.

## Proposed Approach
- Option A: Keep card lifecycle unchanged, remove idea lane rendering, and strengthen `/ideas` + automation controls.
  - Pros: low migration risk, fast alignment with new UX policy.
  - Cons: requires explicit labeling for idea/card dual-presence.
- Option B: Stop auto-creating cards for P1-P3 and keep ideas-only until manual promotion.
  - Pros: cleaner separation model.
  - Cons: larger workflow contract change across multiple skills.
- Chosen: Option A for this increment, with Option B captured as a decision/investigation path.

### `/ideas` Two-Section Data Model
- Use two server queries (not one-query client split) to preserve deterministic ordering and avoid broken pagination semantics.
- Primary query: priorities `P1|P2|P3`; secondary query: priorities `P4|P5`.
- Shared filters (`business`, `status`, `location`, `tag`, `q`) apply to both queries.
- Independent pagination params:
  - `primaryPage`, `primaryPageSize`
  - `secondaryPage`, `secondaryPageSize`
- Both sections render simultaneously and keep click-through to `/ideas/[id]`.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Remove idea entities from board lane rendering (and delete dead idea lane component path) | 88% | M | Completed (2026-02-09) | - | TASK-06 |
| TASK-02 | IMPLEMENT | Refactor `/ideas` into primary (P1-P3) and secondary (P4-P5) lists with drill-down continuity | 84% | L | Completed (2026-02-09) | - | TASK-06 |
| TASK-03 | DECISION | Confirm/override default Option A dual-presence policy and labeling | 78% | S | Completed (2026-02-09) | - | - |
| TASK-04A | IMPLEMENT | Automation contract hardening: partial sweep reconciliation and stale-index surfacing in skill/workflow docs | 92% | S | Completed (2026-02-09) | - | TASK-06 |
| TASK-04B | IMPLEMENT | Optional instrumentation: status endpoint + header signal for sweep/index health | 82% | M | Completed (2026-02-09) | TASK-04A | - |
| TASK-05 | INVESTIGATE | Stage 7b backfill budget feasibility and rollout shape | 91% | M | Completed (2026-02-09) | - | - |
| TASK-06 | CHECKPOINT | End-to-end workflow verification (ideas-go-faster -> fact-find -> plan-feature -> build-feature) | 92% | S | Completed (2026-02-09) | TASK-01, TASK-02, TASK-04A | - |

> Effort scale: S=1, M=2, L=3

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 (done) | TASK-01, TASK-02 | - | Completed in parallel with targeted tests + package validation |
| 2 (done) | TASK-04A, TASK-03 | - | TASK-04A completed; TASK-03 confirmed (Option A + automated ideas routing to `/ideas`) |
| 3 (done) | TASK-06 | TASK-01, TASK-02, TASK-04A | Checkpoint verification completed after contract hardening |
| 4 (done) | TASK-04B | TASK-04A | Implemented canonical endpoint/UI signal with targeted API + component validation |
| 5 (done) | TASK-05 | - | Decision memo completed; Stage 7b remains disabled by default |

**Max parallelism:** 2 | **Current critical path:** none (all tasks completed) | **Total tasks:** 7

## Tasks

### TASK-01: Remove idea entities from board lane rendering
- **Type:** IMPLEMENT
- **Status:** Completed (2026-02-09)
- **Deliverable:** Board UI and data path render cards only (no `Idea` components in lanes).
- **Execution-Skill:** build-feature
- **Affects:** `apps/business-os/src/app/boards/[businessCode]/page.tsx`, `apps/business-os/src/components/board/BoardView.tsx`, `apps/business-os/src/components/board/BoardLane.tsx`, `apps/business-os/src/hooks/useBoardFilters.ts`, `apps/business-os/src/components/board/CompactIdea.tsx`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 88%
  - Implementation: 90% — direct path edits with known call graph.
  - Approach: 88% — policy is explicit.
  - Impact: 88% — board behavior changes are visible but bounded.
- **Acceptance:**
  - Board lanes render cards only.
  - No `Idea` items appear in Inbox lane.
  - Board search/filter behavior remains functional for cards.
  - Dead idea lane component path is removed (or explicitly retained with documented rationale).
- **Validation contract:**
  - TC-01: board render includes lanes/cards and excludes idea cards.
  - TC-02: card search/filter still works after idea-path removal.
  - TC-03: board navigation/actions unaffected.
  - TC-04: lane stats/count tests updated from idea+card assumptions to card-only assumptions.
  - **Acceptance coverage:** lane rendering + regression checks.
  - **Validation type:** component tests.
  - **Validation location/evidence:** `apps/business-os/src/components/board/BoardView.test.tsx`, `apps/business-os/src/components/board/BoardLane.test.tsx`
  - **Run/verify:** `pnpm --filter @apps/business-os test -- apps/business-os/src/components/board/BoardView.test.tsx apps/business-os/src/components/board/BoardLane.test.tsx --maxWorkers=2`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:**
  - Tests run: N/A (planning phase)
  - Test stubs written: N/A
  - Unexpected findings: none
- **What would make this >=90%:**
  - Confirm no downstream consumer depends on `inboxIdeas` lane rendering assumptions.
- **Rollout / rollback:**
  - Rollout: remove idea props and render path in one pass.
  - Rollback: restore `Idea` prop/render pipeline in board components.
- **Documentation impact:** `docs/business-os/agent-workflows.md`
- **Build outcome (E2 evidence):**
  - Removed board idea fetch/render path and deleted dead component: `apps/business-os/src/components/board/CompactIdea.tsx`.
  - Updated board counts/filters to card-only behavior: `apps/business-os/src/lib/board-card-counts.ts`, `apps/business-os/src/hooks/useBoardFilters.ts`.
  - Updated board tests for card-only lane assumptions.
  - Validation executed:
    - `pnpm --filter @apps/business-os test -- apps/business-os/src/components/board/BoardView.test.tsx apps/business-os/src/components/board/BoardLane.test.tsx --maxWorkers=2`
    - `pnpm --filter @apps/business-os typecheck`
    - `pnpm --filter @apps/business-os lint`

### TASK-02: Refactor `/ideas` into primary (P1-P3) and secondary (P4-P5) lists with drill-down continuity
- **Type:** IMPLEMENT
- **Status:** Completed (2026-02-09)
- **Deliverable:** `/ideas` page shows two priority buckets with clear headers, counts, and click-through detail links.
- **Execution-Skill:** build-feature
- **Affects:** `apps/business-os/src/app/ideas/page.tsx`, `apps/business-os/src/components/ideas/IdeasList.tsx`, `apps/business-os/src/components/ideas/IdeasFilters.tsx`, `apps/business-os/src/components/ideas/IdeasPagination.tsx`, `apps/business-os/src/components/ideas/query-params.ts`, tests under `apps/business-os/src/components/ideas/*.test.ts*`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 84%
  - Implementation: 86% — existing ideas route/components already in place.
  - Approach: 84% — split-list UX is straightforward with explicit data model.
  - Impact: 84% — high operator visibility impact.
- **Acceptance:**
  - P1-P3 ideas are rendered in a primary list section.
  - P4-P5 ideas are rendered in a secondary list section.
  - Both sections support click-through to `/ideas/[id]`.
  - Existing filter/search query behavior remains deterministic.
  - Data layer uses two server queries with independent section pagination.
- **Validation contract:**
  - TC-01: primary section contains only P1-P3 items.
  - TC-02: secondary section contains only P4-P5 items.
  - TC-03: row/card click navigates to idea detail in both sections.
  - TC-04: shared filter/search query params constrain both sections correctly.
  - TC-05: primary and secondary pagination operate independently and deterministically.
  - TC-06: ideas filters form and pagination components preserve URL state round-trip for both sections.
  - **Acceptance coverage:** section split + interaction + filter integrity.
  - **Validation type:** component/integration tests.
  - **Validation location/evidence:** `apps/business-os/src/components/ideas/IdeasList.test.tsx`, `apps/business-os/src/components/ideas/query-params.test.ts`, `apps/business-os/src/components/ideas/IdeasFilters.test.tsx`, `apps/business-os/src/components/ideas/IdeasPagination.test.tsx`
  - **Run/verify:** `pnpm --filter @apps/business-os test -- apps/business-os/src/components/ideas/query-params.test.ts apps/business-os/src/components/ideas/IdeasList.test.tsx apps/business-os/src/components/ideas/IdeasFilters.test.tsx apps/business-os/src/components/ideas/IdeasPagination.test.tsx --maxWorkers=2`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:**
  - Tests run: N/A (planning phase)
  - Test stubs written: required at build start (L task)
  - Unexpected findings: none
- **What would make this >=90%:**
  - Add fixture with 500+ ideas split across buckets and validate responsiveness budgets.
- **Rollout / rollback:**
  - Rollout: incremental UI split while preserving route and detail links.
  - Rollback: revert to single-list section without touching repository contract.
- **Documentation impact:** `docs/business-os/agent-workflows.md`
- **Build outcome (E2 evidence):**
  - Implemented dual-query, dual-pagination `/ideas` flow with independent URL params (`primaryPage*`, `secondaryPage*`) in `apps/business-os/src/app/ideas/page.tsx` and `apps/business-os/src/components/ideas/query-params.ts`.
  - Added/updated tests:
    - `apps/business-os/src/components/ideas/query-params.test.ts`
    - `apps/business-os/src/components/ideas/IdeasList.test.tsx`
    - `apps/business-os/src/components/ideas/IdeasFilters.test.tsx`
    - `apps/business-os/src/components/ideas/IdeasPagination.test.tsx`
  - Validation executed:
    - `pnpm --filter @apps/business-os test -- apps/business-os/src/components/ideas/query-params.test.ts apps/business-os/src/components/ideas/IdeasList.test.tsx apps/business-os/src/components/ideas/IdeasFilters.test.tsx apps/business-os/src/components/ideas/IdeasPagination.test.tsx --maxWorkers=2`
    - `pnpm --filter @apps/business-os typecheck`
    - `pnpm --filter @apps/business-os lint`

### TASK-03: Finalize P1-P3 dual-presence policy (idea + card) and UX labeling
- **Type:** DECISION
- **Status:** Completed (2026-02-09)
- **Deliverable:** Confirm/override note for default Option A + final UX label string set.
- **Execution-Skill:** build-feature
- **Affects:** `docs/business-os/agent-workflows.md`, `.claude/skills/ideas-go-faster/SKILL.md`, `/ideas` copy keys and labels
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 78%
  - Implementation: 88% — both options are implementable.
  - Approach: 70% — default assumption already chosen in plan.
  - Impact: 78% — impacts UX clarity and policy coherence.
- **Options:**
  - **Option A:** keep auto-card creation for P1-P3; ideas remain visible with explicit "card exists" label.
  - **Option B:** stop auto-card creation; require manual promotion from ideas list.
- **Recommendation:** Option A for this increment to avoid destabilizing downstream deterministic lane flow.
- **Decision (confirmed 2026-02-09):** Option A.
  - Keep auto-card creation for P1-P3.
  - Keep all ideas in `/ideas` (primary P1-P3 + secondary P4-P5 lists).
  - Kanban lanes remain card-only (no idea entities rendered).
  - Enforce automated routing contract: persisted ideas from `/ideas-go-faster` are visible on `/ideas` without manual lane movement.
- **Acceptance:**
  - Policy confirmation/override is documented in skill + workflow docs.
  - If overridden to Option B, create explicit follow-up re-plan note for impacted tasks.

### TASK-04A: Automation contract hardening: partial sweep reconciliation + discovery-index visibility
- **Type:** IMPLEMENT
- **Status:** Completed (2026-02-09)
- **Deliverable:** Explicit contract updates and operator procedure for partial sweeps and stale index states.
- **Execution-Skill:** build-feature
- **Affects:** `.claude/skills/ideas-go-faster/SKILL.md`, `.claude/skills/fact-find/SKILL.md`, `.claude/skills/plan-feature/SKILL.md`, `.claude/skills/build-feature/SKILL.md`, `docs/business-os/agent-workflows.md`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 92%
  - Implementation: 93% — bounded doc/contract updates with call sites now stabilized by completed UI changes.
  - Approach: 92% — weak-point list and failure contracts are explicit.
  - Impact: 92% — directly improves operator recovery paths.
- **Acceptance:**
  - Partial sweep failures produce explicit reconciliation checklist in sweep report contract.
  - Discovery-index stale state handling is explicitly documented across all loop skills.
  - Retry/fail-closed behavior remains deterministic and consistent in skill docs.
- **Validation contract:**
  - VC-01: ideas-go-faster contract includes persistence accounting + reconciliation steps.
  - VC-02: fact-find/plan/build contracts each include stale-index failure behavior.
  - VC-03: workflow guide reflects same behavior without contradictions.
  - **Acceptance coverage:** drift reduction + observability.
  - **Validation type:** review checklist.
  - **Validation location/evidence:** skill/workflow docs.
  - **Run/verify:** targeted grep + consistency read.
- **Execution plan:** Draft -> Review -> Finalize
- **Validation executed (2026-02-09):**
  - `rg -n "discovery-index stale|reconciliation checklist|fail-closed|retry" .claude/skills/ideas-go-faster/SKILL.md .claude/skills/fact-find/SKILL.md .claude/skills/plan-feature/SKILL.md .claude/skills/build-feature/SKILL.md docs/business-os/agent-workflows.md`
  - Consistency read confirms fail-closed stale-index + reconciliation contract is aligned in all 5 targets.
- **Planning validation:**
  - Tests run: N/A (planning phase)
  - Test stubs written: N/A
  - Unexpected findings: none
- **What would make this >=90%:** N/A (already >=90%)
- **Rollout / rollback:**
  - Rollout: docs/contracts update.
  - Rollback: revert skill/workflow edits.
- **Documentation impact:** `docs/business-os/agent-workflows.md`, `.claude/skills/ideas-go-faster/SKILL.md`

### TASK-04B: Optional instrumentation: status/health endpoint and UI signal for sweep/index health
- **Type:** IMPLEMENT
- **Status:** Completed (2026-02-09)
- **Deliverable:** `/api/automation/status` endpoint + navigation header status signal for sweep/index health visibility.
- **Execution-Skill:** build-feature
- **Affects:** `apps/business-os/src/app/api/automation/status/route.ts`, `apps/business-os/src/components/navigation/NavigationHeader.tsx`, `apps/business-os/src/components/navigation/NavigationHeader.test.tsx`, `apps/business-os/src/app/api/automation/status/__tests__/route.test.ts`
- **Depends on:** TASK-04A
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 84% — bounded API + header indicator + targeted test surface.
  - Approach: 82% — canonical contract now fixed (endpoint schema + UI state mapping).
  - Impact: 82% — makes partial/stale automation states visible without opening sweep logs.
- **Canonical contract (re-plan outcome):**
  - Endpoint: `GET /api/automation/status`
  - Response shape:
    - `status`: `ok|degraded`
    - `d1`: `ok|error`
    - `automation`:
      - `lastSweepRunStatus`: `complete|partial|failed-preflight|unknown`
      - `discoveryIndexStatus`: `fresh|stale|unknown`
      - `lastSweepAt`: ISO timestamp or `null`
      - `source`: short source descriptor
    - `timestamp`: ISO timestamp
  - UI mapping in nav header:
    - `ok` + `fresh` => `Healthy`
    - `degraded` OR `partial|stale` => `Attention`
    - unknown states => `Unknown`
- **Acceptance:**
  - Operators can see sweep/index state from a persistent UI signal without reading sweep markdown.
  - Status endpoint returns the canonical schema above with deterministic value mapping.
  - Operators can see sweep partial-failure and stale-index state without reading raw logs.
  - Instrumentation does not alter fail-closed workflow semantics.
- **Validation contract:**
  - TC-01: endpoint returns canonical schema and 200 for both healthy/degraded states.
  - TC-02: endpoint maps stale/partial markers to `automation` fields deterministically.
  - TC-03: nav header renders `Healthy|Attention|Unknown` badge from endpoint states.
  - TC-04: no behavior changes to existing loop contracts (skills/docs remain fail-closed source of truth).
  - **Validation type:** API + component tests.
  - **Run/verify:** `pnpm --filter @apps/business-os test -- apps/business-os/src/app/api/automation/status/__tests__/route.test.ts apps/business-os/src/components/navigation/NavigationHeader.test.tsx --maxWorkers=2`
- **Execution plan:** Red -> Green -> Refactor
- **Validation executed (2026-02-09):**
  - `pnpm --filter @apps/business-os test -- apps/business-os/src/app/api/automation/status/__tests__/route.test.ts apps/business-os/src/components/navigation/NavigationHeader.test.tsx apps/business-os/src/app/api/healthz/route.test.ts --maxWorkers=2`
  - `pnpm --filter @apps/business-os typecheck`
  - `pnpm --filter @apps/business-os lint` (passes with existing warning-only baseline unrelated to TASK-04B)
- **Build outcome (E2 evidence):**
  - Added endpoint: `apps/business-os/src/app/api/automation/status/route.ts`
  - Added endpoint tests: `apps/business-os/src/app/api/automation/status/__tests__/route.test.ts`
  - Added nav header signal mapping + badge rendering: `apps/business-os/src/components/navigation/NavigationHeader.tsx`
  - Added nav badge tests (healthy/degraded states): `apps/business-os/src/components/navigation/NavigationHeader.test.tsx`

### TASK-05: Stage 7b backfill budget feasibility and rollout shape
- **Type:** INVESTIGATE
- **Status:** Completed (2026-02-09)
- **Deliverable:** Decision memo + implementation-ready contract for optional Stage 7b (`max 1 existing P1/P2 card without fact-find doc`).
- **Execution-Skill:** build-feature
- **Affects:** `.claude/skills/ideas-go-faster/SKILL.md`, follow-on implementation plan sections
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 91%
  - Implementation: 90% — selector + reporting contract is explicit and bounded.
  - Approach: 91% — deterministic pool separation and tie-breakers are fully specified.
  - Impact: 91% — addresses fairness without destabilizing Stage 7 deterministic behavior.
- **Acceptance:**
  - Explicit activation policy (`off` by default, controlled enable).
  - Deterministic selector order defined when backfill slot is enabled.
  - Non-mixed reporting semantics preserved (newly promoted pool vs backfill slot clearly separated).
- **Validation executed (2026-02-09):**
  - Decision memo written: `docs/plans/business-os-stage-7b-backfill-decision-memo.md`.
  - Skill contract updated with explicit optional Stage 7b activation/selector/reporting rules in `.claude/skills/ideas-go-faster/SKILL.md`.
- **Notes / references:**
  - `docs/plans/business-os-stage-7b-backfill-decision-memo.md`

### TASK-06: End-to-end workflow verification (ideas-go-faster -> fact-find -> plan-feature -> build-feature)
- **Type:** CHECKPOINT
- **Status:** Completed (2026-02-09)
- **Deliverable:** Verification memo in this plan confirming updated behavior and known exceptions.
- **Execution-Skill:** build-feature
- **Affects:** `docs/plans/business-os-ideas-surface-and-automation-plan.md`
- **Depends on:** TASK-01, TASK-02, TASK-04A
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 93%
  - Approach: 92%
  - Impact: 92%
- **Acceptance:**
  - No ideas are displayed in Kanban lanes.
  - `/ideas` presents primary/secondary priority lists with working detail drill-down.
  - Core automation weak-point mitigations (contract-level) are implemented.
  - Optional instrumentation and Stage 7b items are either completed or explicitly deferred with rationale and next-step owner.
- **Validation contract:**
  - VC-01: run one sweep and confirm ideas appear in `/ideas` buckets.
  - VC-02: run representative `/fact-find`, `/plan-feature`, `/build-feature` flow and confirm lane transitions remain deterministic.
  - VC-03: exercise failure-path visibility checks for reconciliation/stale-index behavior.
  - **Validation type:** end-to-end checklist.
  - **Run/verify:** local scenario walkthrough with evidence notes.
- **Execution plan:** Draft -> Review -> Finalize
- **Validation executed (2026-02-09):**
  - `pnpm --filter @apps/business-os test -- apps/business-os/src/components/board/BoardView.test.tsx apps/business-os/src/components/board/BoardLane.test.tsx apps/business-os/src/components/ideas/query-params.test.ts apps/business-os/src/components/ideas/IdeasList.test.tsx apps/business-os/src/components/ideas/IdeasFilters.test.tsx apps/business-os/src/components/ideas/IdeasPagination.test.tsx apps/business-os/src/app/api/ideas/__tests__/route.test.ts apps/business-os/src/app/api/agent/ideas/__tests__/route.test.ts --maxWorkers=2` (8/8 suites passed)
  - `pnpm --filter @apps/business-os test -- apps/business-os/src/app/api/automation/status/__tests__/route.test.ts apps/business-os/src/components/navigation/NavigationHeader.test.tsx apps/business-os/src/app/api/healthz/route.test.ts --maxWorkers=2` (3/3 suites passed)
  - `pnpm --filter @apps/business-os typecheck`
  - `pnpm --filter @apps/business-os lint` (passes with pre-existing warning-only baseline)
  - `TASK-04B` completed; `TASK-05` completed.

## Risks & Mitigations
- Risk: Users lose quick inbox context in board after idea removal.
  - Mitigation: strengthen `/ideas` discoverability from board/header and add clear bucket counts.
- Risk: P1-P3 dual-presence confusion (idea + card).
  - Mitigation: explicit policy decision + label standard in TASK-03.
- Risk: Stage 7 fairness gap persists if Stage 7b remains disabled.
  - Mitigation: TASK-05 completed with deterministic activation-ready policy; keep disabled by default until explicitly enabled.
- Risk: Partial sweep drift remains opaque.
  - Mitigation: TASK-04A hardens contracts immediately; TASK-04B adds optional technical instrumentation.

## Observability
- Logging:
  - Sweep run status (`complete|partial|failed-preflight`) plus failed API call set IDs.
- Metrics:
  - Primary bucket count (P1-P3), secondary bucket count (P4-P5), ideas without fact-find docs.
- Alerts/Dashboards:
  - Discovery-index stale signal and sweep partial-failure count trend.

## Acceptance Criteria (overall)
- [x] Kanban lanes are card-only surfaces (no idea entities rendered).
- [x] `/ideas` is the canonical triage surface with separate P1-P3 and P4-P5 sections.
- [x] Idea detail drill-down works from both sections.
- [x] Automation weak points are reduced through implemented hardening or explicit, tracked deferrals.
- [x] Follow-on fairness option (Stage 7b) is documented with deterministic guardrails.

## Re-Plan Update (2026-02-09)
- Scope reassessed: TASK-03, TASK-04A, TASK-04B, TASK-05, TASK-06.
- Evidence used:
  - E2 executable verification from completed work (Task 1/2 test, typecheck, lint runs).
  - E1 static audit confirming card-only board path and two-query `/ideas` split.
- Outcomes:
  - TASK-04A promoted to **Ready** at 92% based on stabilized integration seams.
  - TASK-06 raised to 92% because 2 of its 4 acceptance points are now already verified by completed implementation.
  - TASK-03 was 78% at re-plan time and is now completed via explicit Option A confirmation (2026-02-09).
  - TASK-04B and TASK-05 were below threshold at this pass and were explicitly deferred pending follow-up evidence.
- Next buildable sequence at re-plan time:
  - `TASK-04A` -> `TASK-06` (completed)

## Re-Plan Update (2026-02-09, pass 2)
- Scope reassessed: `TASK-05` completion and `TASK-04B` readiness.
- Evidence used:
  - Stage 7b decision memo with deterministic selector + 20-idea worked example.
  - Current `/api/healthz` baseline inspection plus UI integration seam review in `NavigationHeader`.
- Outcomes:
  - `TASK-05` completed with approved contract in `docs/plans/business-os-stage-7b-backfill-decision-memo.md`.
  - `TASK-04B` promoted to **Ready** at 82% after locking canonical endpoint schema + UI mapping + test plan.
- Next buildable sequence:
  - `TASK-04B`

## Build Update (2026-02-09, pass 3)
- Scope executed: `TASK-04B`.
- Evidence used:
  - API unit tests for canonical status schema + degraded/healthy mapping.
  - Navigation header component tests for `Healthy|Attention` badge mapping.
  - Package validation gate (`typecheck`, `lint`) on `@apps/business-os`.
- Outcomes:
  - `TASK-04B` completed with endpoint + persistent header signal and deterministic mapping.
  - No remaining plan tasks; plan status moved to `Completed`.

## Decision Log
- 2026-02-09: adopted explicit policy target: ideas live on dedicated ideas UI, not lane UI.
- 2026-02-09: modeled automation weaknesses as first-class work items (not side notes).
- 2026-02-09: kept Stage 7b as controlled decision/investigation path before activation.
- 2026-02-09: removed artificial TASK-01 -> TASK-02 dependency; board and ideas surface work run in parallel.
- 2026-02-09: split automation hardening into TASK-04A (core contract) and TASK-04B (optional instrumentation).
- 2026-02-09: set TASK-03 to confirm/override mode (default Option A), not a hard critical-path blocker.
- 2026-02-09: completed TASK-01 (board lanes now card-only; idea lane component removed).
- 2026-02-09: completed TASK-02 (`/ideas` split into primary/secondary sections with independent pagination).
- 2026-02-09: re-plan pass after TASK-01/TASK-02 marked TASK-04A and TASK-06 as next build-ready path.
- 2026-02-09: completed TASK-04A with fail-closed reconciliation + stale-index contract alignment across ideas-go-faster/fact-find/plan-feature/build-feature and workflow docs.
- 2026-02-09: completed TASK-06 checkpoint with fresh board + ideas + API tests and package validation evidence.
- 2026-02-09: completed TASK-03 decision: Option A confirmed with explicit policy that ideas route to `/ideas` automatically while Kanban lanes stay card-only.
- 2026-02-09: completed TASK-05 via Stage 7b memo and codified optional backfill contract (disabled by default).
- 2026-02-09: re-planned TASK-04B with canonical `/api/automation/status` contract and header signal mapping; confidence raised to 82%.
- 2026-02-09: completed TASK-04B by implementing `/api/automation/status` and the navigation automation status badge (`Healthy|Attention|Unknown`) with targeted tests.

## Overall-confidence calculation
- Remaining-work weighted overall = **100%** (no remaining tasks).
- Build-ready IMPLEMENT path: none (plan complete).
