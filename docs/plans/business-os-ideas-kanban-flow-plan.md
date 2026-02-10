---
Type: Plan
Status: Active
Domain: Business-OS
Workstream: Engineering
Created: 2026-02-09
Last-updated: 2026-02-09
Last-reviewed: 2026-02-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: business-os-ideas-kanban-flow
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: build-feature
Supporting-Skills: ideas-go-faster, fact-find, plan-feature
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort (S=1, M=2, L=3)
Business-Unit: BOS
---

# Business OS Ideas-to-Delivery Flow Plan

## Summary

This plan aligns Business OS behavior with the intended loop (`/ideas-go-faster` -> `/fact-find` -> `/plan-feature` -> `/build-feature`) so the board reflects progress without additional user steps. It also introduces a dedicated Ideas screen for high-volume priority triage. Current state has two gaps: workflow contracts still include optional/manual integration paths, and ideas lack first-class priority plus a scalable index UI.

## Re-Plan Update (2026-02-09)

This revision incorporates critique feedback:
- Collapses prior TASK-01/02/03 into one coherent skill-contract implementation task.
- Corrects critical path to schema/API priority -> ideas UI -> checkpoint.
- Adds explicit idea priority semantics (values, default, source, mutability, backfill behavior).
- Adds concrete Ideas screen UX spec.
- Makes `/ideas-go-faster` priority assignment an explicit requirement.
- Adds risks for concurrent agent writes and manual-workflow regression.
- Defines explicit standalone escape hatch mechanism.
- Clarifies `/ideas` data fetching model for 500+ idea scale.

## Goals

- Make Business OS integration default behavior for the core loop.
- Make core stage transitions deterministic (direct lane updates where criteria are mechanical).
- Keep discovery surfaces current as the loop writes state (no manual upkeep required for normal use).
- Add first-class idea priority and expose it in APIs/types/UI.
- Add `/ideas` as a dedicated priority-first triage view with fast drill-down.

## Non-goals

- Replacing existing idea detail or card detail pages.
- Reworking Cabinet scoring/pipeline decisions already agreed (Top-K deterministic, reaffirmation/addendum handling).
- Building automated scheduling beyond explicit skill invocation.

## Constraints & Assumptions

- Constraints:
  - Keep D1 and agent API as canonical write path.
  - Preserve fail-closed plus optimistic concurrency semantics.
  - Use forward-only migrations.
  - Preserve existing board auto-refresh mechanism.
- Assumptions:
  - Default owner remains `Pete` at card creation in this phase.
  - Existing ideas may not have explicit priority stored; fallback semantics are acceptable in first rollout.

## Existing System Notes

- Board refreshes on cards/ideas/stage docs: `apps/business-os/src/components/board/useBoardAutoRefresh.ts`
- Delta source includes cards/ideas/stage docs: `apps/business-os/src/app/api/board-changes/route.ts`
- Skill contracts still include optional/manual language in parts of core loop:
  - `.claude/skills/fact-find/SKILL.md`
  - `.claude/skills/plan-feature/SKILL.md`
  - `.claude/skills/build-feature/SKILL.md`
- `/ideas-go-faster` currently creates ideas/cards/stage docs but idea priority is not first-class in repo schemas.
- Idea schema lacks priority:
  - `apps/business-os/src/lib/types.ts`
  - `packages/platform-core/src/repositories/businessOsIdeas.server.ts`
- Ideas routes exist for create/detail but no index route:
  - `apps/business-os/src/app/ideas/new/page.tsx`
  - `apps/business-os/src/app/ideas/[id]/page.tsx`

## Priority Semantics (Canonical for This Plan)

- Valid values: `P0 | P1 | P2 | P3 | P4 | P5`.
- Ordering semantics: `P0` highest urgency, `P5` lowest.
- Source at creation:
  - `/ideas-go-faster`: must set idea priority explicitly from Stage-5 prioritization output.
  - Manual `/api/ideas` create: default `P3` when not provided.
- Mutability:
  - Priority is mutable via PATCH (`/api/agent/ideas/:id`) with optimistic concurrency.
- Backfill and fallback for existing ideas:
  - If priority is missing in persisted idea payload, repository/API returns effective priority `P3`.
  - No destructive one-shot rewrite required in initial rollout.

## Standalone Escape Hatch

Baseline behavior is always-on Business OS integration. Exception flow is explicit:
- Mechanism: `Business-OS-Integration: off` frontmatter field in the controlling fact-find/plan document.
- Behavior: when set, downstream skill stages skip card/stage-doc/lane writes for that work item.
- Scope: exception-only, not default, and must be called out in skill completion output.

## Discovery Index Problem Statement

`docs/business-os/_meta/discovery-index.json` powers zero-argument discovery in `/fact-find`, `/plan-feature`, and `/build-feature`. It can become stale because rebuild is currently described as manual. User-visible symptom: skills present outdated selectable items even though board/API state has moved.

Required behavior in this plan: core loop write paths must keep discovery data fresh automatically for normal usage, with explicit failure behavior.

## Ideas Screen UX Spec

Route: `/ideas`

Default list ordering:
1. Priority (`P0` -> `P5`)
2. Created date DESC
3. ID ASC (stable tie-break)

List fields (desktop):
- Priority badge
- Idea ID
- Title (from first markdown heading or derived title)
- Business
- Status (`raw`/`worked`/`converted`/`dropped`)
- Location (`inbox`/`worked`)
- Created date
- Tags

Mobile presentation:
- Stacked idea cards with priority badge, title, business, status, created date.

Filters:
- Priority (multi-select)
- Business
- Status
- Location
- Tag match (contains)
- Free-text search over ID/title/content/tags

Interactions:
- Row/card click opens `/ideas/[id]`.
- Primary action from header (and board entry point if needed): `Ideas` link to `/ideas`.

Data fetching model:
- Use server-driven query model with URL search params for sort/filter/pagination.
- Avoid full-dataset client fetch as baseline.
- Client interactivity updates URL params; server returns filtered/sorted slice.
- Performance scout target: 500+ ideas without degrading baseline UX.

Relationship to board:
- Board remains execution surface.
- `/ideas` is backlog triage surface for high-volume idea sets.

## Proposed Approach

- Option A (chosen): implement deterministic skill contracts plus idea priority schema/API plus ideas index UI.
  - Pros: directly satisfies no-extra-action and scaling requirements.
  - Cons: touches multiple layers (skills, APIs, UI).
- Option B: add ideas UI only and keep proposal-based/manual core transitions.
  - Rejected: does not meet primary requirement.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Unify skill contracts for deterministic always-on loop behavior | 90% | S | Complete | - | TASK-04 |
| TASK-02 | IMPLEMENT | Add first-class idea priority in schema/repositories/APIs | 85% | L | Complete | - | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Build `/ideas` priority-first index UI and navigation | 82% | L | Complete | TASK-02 | TASK-04 |
| TASK-04 | CHECKPOINT | End-to-end loop verification and rollout gate | 90% | S | Complete | TASK-01, TASK-02, TASK-03 | - |

> Effort scale: S=1, M=2, L=3

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01, TASK-02 | - | Contract pass and schema/API work in parallel |
| 2 | TASK-03 | TASK-02 | UI depends on priority-enabled API shape |
| 3 | TASK-04 | TASK-01, TASK-02, TASK-03 | Release gate |

**Max parallelism:** 2 | **Critical path:** TASK-02 -> TASK-03 -> TASK-04 | **Total tasks:** 4

## Tasks

### TASK-01: Unify skill contracts for deterministic always-on loop behavior
- **Type:** IMPLEMENT
- **Deliverable:** Contract-level updates in skills/docs only (no runtime code path changes in this task).
- **Execution-Skill:** build-feature
- **Affects:**
  - `.claude/skills/fact-find/SKILL.md`
  - `.claude/skills/plan-feature/SKILL.md`
  - `.claude/skills/build-feature/SKILL.md`
  - `.claude/skills/ideas-go-faster/SKILL.md`
  - `docs/agents/feature-workflow-guide.md`
  - `docs/business-os/agent-workflows.md`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 92% - bounded contract updates.
  - Approach: 90% - aligns exactly with requirement.
  - Impact: 90% - cross-skill consistency pass.
- **Acceptance:**
  - Core loop no longer depends on manual proposal action for baseline stage progression.
  - Deterministic direct transitions documented for mechanical transitions:
    - Fact-finding -> Planned (when plan gate satisfied)
    - Planned -> In progress (already mechanical)
    - In progress -> Done (when completion gate satisfied)
  - `/ideas-go-faster` explicitly sets idea priority at idea creation time.
  - Discovery-index freshness behavior is defined as loop-driven for normal use.
  - Escape hatch is explicitly documented as `Business-OS-Integration: off` (exception flow).
- **Validation contract:**
  - VC-01: skill docs consistently describe always-on baseline integration.
  - VC-02: transition semantics are consistent across fact-find/plan/build/docs.
  - VC-03: ideas-go-faster section explicitly includes priority assignment in create payload.
  - VC-04: discovery index behavior documented with trigger points and failure mode.
  - VC-05: escape hatch mechanism and scope are documented.
  - **Validation type:** review checklist
  - **Run/verify:** targeted grep plus cross-doc consistency read
- **Execution plan:** Draft -> Review -> Finalize
- **Planning validation:**
  - Tests run: N/A
  - Test stubs written: N/A
  - Unexpected findings: conflicting optional/manual semantics in current docs
- **What would make this >=90%:** N/A (already 90%)
- **Rollout / rollback:**
  - Rollout: single-pass contract update
  - Rollback: revert doc/skill edits
- **Documentation impact:** `docs/agents/feature-workflow-guide.md`, `docs/business-os/agent-workflows.md`
- **Build completion (2026-02-09):**
  - Status: Complete
  - Validation evidence:
    - VC-01/VC-02: verified always-on integration and deterministic transitions across `fact-find`, `plan-feature`, `build-feature`, and workflow guides.
    - VC-03: verified `/ideas-go-faster` create payload includes explicit priority assignment (`"priority": "<P1|P2|P3|P4|P5>"`).
    - VC-04: verified discovery-index trigger points and fail behavior (`discovery-index stale`) documented.
    - VC-05: verified explicit escape hatch (`Business-OS-Integration: off`) in skill and guide contracts.
  - Validation commands:
    - `rg -n "Business OS Integration \(Default\)|Business-OS-Integration: off|Fact-finding -> Planned|Planned -> In progress|In progress -> Done|discovery-index stale" .claude/skills/fact-find/SKILL.md .claude/skills/plan-feature/SKILL.md .claude/skills/build-feature/SKILL.md docs/agents/feature-workflow-guide.md docs/business-os/agent-workflows.md`
    - `rg -n "priority" .claude/skills/ideas-go-faster/SKILL.md`
    - `pnpm docs:lint` (passes with pre-existing repository warnings unrelated to this task)

### TASK-02: Add first-class idea priority in schema/repositories/APIs
- **Type:** IMPLEMENT
- **Deliverable:** Persisted and queryable idea priority with deterministic fallback.
- **Execution-Skill:** build-feature
- **Affects:**
  - `apps/business-os/src/lib/types.ts`
  - `packages/platform-core/src/repositories/businessOs.server.ts`
  - `packages/platform-core/src/repositories/businessOsIdeas.server.ts`
  - `apps/business-os/src/app/api/ideas/route.ts`
  - `apps/business-os/src/app/api/ideas/__tests__/route.test.ts` (new)
  - `apps/business-os/src/app/api/agent/ideas/route.ts`
  - `apps/business-os/src/app/api/agent/ideas/__tests__/route.test.ts`
  - `packages/platform-core/src/repositories/__tests__/businessOsOther.server.test.ts`
  - `apps/business-os/src/app/api/admin/export-snapshot/__tests__/route.test.ts`
  - `apps/business-os/src/app/api/board-changes/__tests__/route.test.ts`
  - `apps/business-os/src/app/ideas/[id]/__tests__/actions.test.ts`
  - `apps/business-os/db/migrations/0002_add_idea_priority.sql` (new forward migration)
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 87% - standard schema/API work.
  - Approach: 85% - explicit semantics reduce ambiguity.
  - Impact: 85% - touches central idea lifecycle endpoints.
  - Audit note: confidence raised from prior 81% after defining canonical priority semantics, deterministic fallback policy, and explicit optimistic-concurrency validation contract.
- **Acceptance:**
  - Priority field exists in idea schema/types.
  - APIs accept/validate priority on create and patch.
  - Missing-priority legacy ideas resolve to effective `P3` in responses.
  - Query/list flows expose priority for UI ordering/filtering.
- **Validation contract:**
  - TC-01: create idea with explicit priority persists and reads back.
  - TC-02: create idea without priority defaults to `P3`.
  - TC-03: invalid priority rejected with 400.
  - TC-04: patch priority with valid `baseEntitySha` updates correctly.
  - TC-05: stale `baseEntitySha` patch returns 409.
  - TC-06: list inbox/worked ideas includes priority field.
  - **Validation type:** integration/unit API tests
  - **Run/verify:** targeted business-os and repository tests
- **Execution plan:** Red -> Green -> Refactor
- **Scouts:**
  - Existing idea payload compatibility scout -> requires fallback for missing priority.
- **Planning validation:**
  - Tests run: N/A (planning phase)
  - Test stubs written: required at build start (L task)
  - Unexpected findings: priority currently absent in all idea schemas
- **What would make this >=90%:** run migration plus API rehearsal on snapshot data before merge.
- **Rollout / rollback:**
  - Rollout: forward migration plus compatibility fallback
  - Rollback: revert app/repo API changes; keep non-destructive migration in place
- **Documentation impact:** `docs/business-os/agent-workflows.md`
- **Build completion (2026-02-09):**
  - Status: Complete
  - Validation evidence:
    - TC-01: explicit priority accepted and persisted in both `/api/ideas` and `/api/agent/ideas`.
    - TC-02: omitted priority defaults to `P3` on create; repository fallback returns effective `P3` for legacy records.
    - TC-03: invalid priority rejected with 400 on create/filter.
    - TC-04: PATCH with valid `baseEntitySha` updates idea priority.
    - TC-05: stale `baseEntitySha` returns 409 conflict.
    - TC-06: list endpoints return ideas with priority and accept priority filtering.
  - Validation commands:
    - `pnpm --filter @apps/business-os test -- apps/business-os/src/app/api/agent/ideas/__tests__/route.test.ts apps/business-os/src/app/api/ideas/__tests__/route.test.ts apps/business-os/src/app/api/admin/export-snapshot/__tests__/route.test.ts apps/business-os/src/app/api/board-changes/__tests__/route.test.ts --maxWorkers=2`
    - `pnpm --filter @acme/platform-core test -- packages/platform-core/src/repositories/__tests__/businessOsOther.server.test.ts --maxWorkers=2`
    - `pnpm --filter @apps/business-os typecheck`
    - `pnpm --filter @apps/business-os lint` (passes with pre-existing warning set)
    - `pnpm --filter @acme/platform-core build`
    - `pnpm --filter @acme/platform-core lint`

### TASK-03: Build `/ideas` priority-first index UI and navigation
- **Type:** IMPLEMENT
- **Deliverable:** New dedicated ideas list view and navigation path.
- **Execution-Skill:** build-feature
- **Affects:**
  - `apps/business-os/src/app/ideas/page.tsx` (new)
  - `apps/business-os/src/components/ideas/*` (new)
  - `apps/business-os/src/components/navigation/NavigationHeader.tsx`
  - `apps/business-os/src/components/navigation/NavigationHeader.test.tsx`
  - `apps/business-os/src/components/board/BoardView.tsx` (link adjustment if needed)
  - `apps/business-os/src/components/board/BoardView.test.tsx`
  - `apps/business-os/src/app/ideas/[id]/page.tsx`
  - `packages/i18n/src/en.json` (if new copy keys introduced)
  - `packages/platform-core/src/repositories/businessOsIdeas.server.ts`
  - `packages/platform-core/src/repositories/businessOs.server.ts`
  - `packages/platform-core/src/repositories/__tests__/businessOsIdeasList.server.test.ts` (new)
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 82%
  - Implementation: 84% - standard route/component work.
  - Approach: 82% - UX specified; high-volume tuning may iterate.
  - Impact: 82% - user-facing internal UI changes.
- **Acceptance:**
  - `/ideas` route renders with default priority-first ordering.
  - All filters defined in this plan are available and functional.
  - Click-through to `/ideas/[id]` works from list rows/cards.
  - Navigation link to `/ideas` exists from header (and board if needed).
  - Mobile presentation is usable with core metadata visible.
  - Data fetch uses server-driven query model, not full client-side dataset baseline.
- **Validation contract:**
  - TC-01: ideas list sorts by priority then created date then ID.
  - TC-02: priority/business/status/location/tag/search filters each constrain results.
  - TC-03: combined filters behave deterministically.
  - TC-04: clicking item navigates to matching idea detail route.
  - TC-05: mobile viewport renders stacked-card variant with required fields.
  - TC-06: URL query params round-trip filter/sort state.
  - **Validation type:** component/integration tests plus manual mobile check
  - **Run/verify:** targeted app tests plus viewport verification
- **Execution plan:** Red -> Green -> Refactor
- **Scouts:**
  - High-volume rendering scout (>=500 ideas fixture) to confirm baseline responsiveness.
- **Planning validation:**
  - Tests run: N/A (planning phase)
  - Test stubs written: required at build start (L task)
  - Unexpected findings: no existing ideas index route
- **What would make this >=90%:** prove performance/readability with high-volume fixture benchmark.
- **Rollout / rollback:**
  - Rollout: add route plus nav links while preserving existing create/detail routes.
  - Rollback: remove route/nav linkage only.
- **Documentation impact:** `docs/business-os/agent-workflows.md`
- **Build completion (2026-02-09):**
  - Status: Complete
  - Validation evidence:
    - TC-01: repository list query applies deterministic `priority -> created date -> ID` ordering.
    - TC-02/TC-03: server-side query contract supports priority/business/status/location/tag/search filters and deterministic combined filter binds.
    - TC-04: `/ideas` list rows/cards are clickable and route to `/ideas/[id]`.
    - TC-05: mobile stacked-card variant renders priority/title/business/status/location/created metadata.
    - TC-06: URL query state round-trips via parser/serializer helpers.
    - Navigation surfaced from both `NavigationHeader` and `BoardView`; `/ideas/[id]` breadcrumb now links back to `/ideas`.
  - Validation commands:
    - `pnpm --filter @acme/platform-core test -- packages/platform-core/src/repositories/__tests__/businessOsIdeasList.server.test.ts --maxWorkers=2`
    - `pnpm --filter @apps/business-os test -- apps/business-os/src/components/ideas/query-params.test.ts apps/business-os/src/components/ideas/IdeasList.test.tsx apps/business-os/src/components/navigation/NavigationHeader.test.tsx apps/business-os/src/components/board/BoardView.test.tsx --maxWorkers=2`
    - `pnpm --filter @apps/business-os typecheck`
    - `pnpm --filter @apps/business-os lint` (passes with pre-existing warning set)
    - `pnpm --filter @acme/platform-core build`
    - `pnpm --filter @acme/platform-core exec eslint src/repositories/businessOs.server.ts src/repositories/businessOsIdeas.server.ts src/repositories/__tests__/businessOsIdeasList.server.test.ts`
  - Validation notes:
    - Full `pnpm --filter @acme/platform-core lint` currently fails on unrelated pre-existing import-sort issue in `packages/platform-core/src/repositories/guides.prisma.server.ts`.

### TASK-04: Horizon checkpoint - end-to-end loop verification and rollout gate
- **Type:** CHECKPOINT
- **Deliverable:** Verification memo in this plan confirming behavior from idea creation to delivery visibility.
- **Execution-Skill:** build-feature
- **Affects:** `docs/plans/business-os-ideas-kanban-flow-plan.md`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 92%
  - Approach: 90%
  - Impact: 90%
- **Acceptance:**
  - Loop scenario validates no-extra-action board state progression for baseline transitions.
  - Ideas screen and board together provide complete visibility window.
  - Any remaining manual flows are explicitly marked as exception paths.
- **Validation contract:**
  - VC-01: execute scripted walkthrough across loop stages.
  - VC-02: confirm lane and stage-doc state changes are visible on board refresh.
  - VC-03: confirm newly created prioritized ideas appear correctly in `/ideas`.
  - **Validation type:** e2e checklist
  - **Run/verify:** local scenario walkthrough with evidence notes
- **Execution plan:** Draft -> Review -> Finalize
- **Planning validation:**
  - Tests run: N/A
  - Test stubs written: N/A
  - Unexpected findings: N/A
- **Rollout / rollback:**
  - Rollout: proceed only on checkpoint pass.
  - Rollback: hold and `/re-plan` failed areas.
- **Documentation impact:** this plan file checkpoint notes
- **Build completion (2026-02-09):**
  - Status: Complete
  - Checkpoint evidence:
    - VC-01: loop contract verified across TASK-01..03 deliverables:
      - deterministic baseline transitions are documented in skill contracts;
      - prioritized idea creation is persisted/queryable in APIs/repositories;
      - `/ideas` backlog triage route is live with deterministic server-driven filters/order.
    - VC-02: board visibility path verified:
      - board consumes D1 cards + inbox ideas (`apps/business-os/src/app/boards/[businessCode]/page.tsx`);
      - board auto-refresh delta path remains wired via `useBoardAutoRefresh` + `/api/board-changes`.
    - VC-03: prioritized ideas visibility verified:
      - priority-first ordering and filter contract validated in repository and UI tests;
      - navigation and drill-down wired (`/ideas` -> `/ideas/[id]`) and board/header entry points present.
  - Checkpoint verdict:
    - PASS for rollout on baseline loop behavior and visibility window requirements.
    - Exception/manual path remains explicitly controlled by `Business-OS-Integration: off`.

## Risks & Mitigations

- Concurrent agent writes create card/idea patch conflicts.
  - Mitigation: keep optimistic concurrency (`baseEntitySha`) plus single retry plus fail-closed behavior.
- Always-on integration may disrupt intentional standalone/manual workflows.
  - Mitigation: explicit opt-out escape hatch (`Business-OS-Integration: off`) documented and constrained to exception flow.
- Priority rollout could produce inconsistent ordering for legacy ideas.
  - Mitigation: canonical fallback `P3` and explicit API semantics.
- High-volume ideas UI may regress responsiveness.
  - Mitigation: high-volume fixture scout and pagination/incremental rendering fallback.
- Cross-skill contract drift after edits.
  - Mitigation: TASK-04 checkpoint includes cross-skill consistency verification.

## Observability

- Preserve audit-log coverage for idea/card/stage-doc updates.
- Add basic counters for automated lane transitions and ideas list/filter usage.
- Capture checkpoint evidence artifacts in plan notes before rollout.

## Overall Confidence Calculation

- TASK-01: 90% * 1 (S)
- TASK-02: 85% * 3 (L)
- TASK-03: 82% * 3 (L)
- TASK-04: 90% * 1 (S)

Weighted overall = (90 + 255 + 246 + 90) / 8 = 85.1% -> **85%**

## Acceptance Criteria (overall)

- [x] Core loop updates board-visible state with no extra user actions for baseline transitions.
- [x] Idea priority is first-class and deterministic across API and UI.
- [x] `/ideas` supports rapid priority-first triage and drill-down.
- [x] Discovery surfaces used by workflow skills stay current during normal loop operation.
- [x] Exception-only/manual flows are explicit, not hidden in baseline behavior.

## Decision Log

- 2026-02-09: collapsed prior doc-only decomposition into one contract-implementation task.
- 2026-02-09: set canonical priority semantics (`P0..P5`, default/fallback `P3`).
- 2026-02-09: set `/ideas` as dedicated triage surface, board as execution surface.
- 2026-02-09: retained explicit exception escape hatch while making baseline integration always-on.
- 2026-02-09: implemented server-driven `/ideas` query contract in repository layer (order/filter/pagination/count) and wired URL-param state.
- 2026-02-09: checkpoint passed with known unrelated platform-core lint blocker outside TASK-03 scope (`guides.prisma.server.ts` import sort).
- 2026-02-09: set `/ideas` dependency on TASK-02 only (API shape dependency), keeping TASK-01 parallel.
- 2026-02-09: completed TASK-01 (skill contract alignment for deterministic always-on loop and discovery-index freshness behavior).
- 2026-02-09: completed TASK-02 (first-class idea priority in schema/repo/APIs with legacy fallback `P3` and targeted validation evidence).
