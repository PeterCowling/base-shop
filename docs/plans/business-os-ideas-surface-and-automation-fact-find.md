---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
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
Related-Plan: docs/plans/business-os-ideas-surface-and-automation-plan.md
Relates-to charter: docs/business-os/business-os-charter.md
Business-OS-Integration: off
Business-Unit: BOS
Card-ID:
---

# Business OS Ideas Surface and Automation Fact-Find Brief

## Scope
### Summary
Update the Business OS ideas-to-delivery workflow so ideas are never rendered inside Kanban lanes. Ideas should live on a dedicated Ideas surface with two explicit sections: P1-P3 (primary) and P4-P5 (secondary), both with click-through to detail. Preserve the workflow loop (`/ideas-go-faster -> /fact-find -> /plan-feature -> /build-feature`) while addressing known automation weak points.

### Goals
- Remove idea entities from board lane rendering.
- Make `/ideas` the canonical triage UI for all ideas, including P1-P3 and P4-P5.
- Preserve detail drill-down via `/ideas/[id]`.
- Convert known weak points and high-value improvements into concrete implementation tasks.

### Non-goals
- Replacing card-based execution lanes in Kanban.
- Changing card lane semantics (`Fact-finding`, `Planned`, `In progress`, `Done`) in this increment.
- Rebuilding Cabinet scoring logic from scratch.

### Constraints & Assumptions
- Constraints:
  - API-backed data model remains canonical (`/api/agent/*`, D1 repositories).
  - Existing deterministic transitions in `/plan-feature` and `/build-feature` remain in place.
  - Existing idea detail route (`/ideas/[id]`) remains the deep-link target.
- Assumptions:
  - "No ideas in Kanban lanes" applies to UI rendering of idea entities, not to card entities created from ideas.
  - P1-P3 ideas remain visible in Ideas UI even if corresponding cards exist.

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/ideas-go-faster/SKILL.md` — Stage 6/7 generation, card creation, fact-find seeding contract.
- `apps/business-os/src/app/boards/[businessCode]/page.tsx` — board loads cards plus inbox ideas.
- `apps/business-os/src/components/board/BoardView.tsx` — passes filtered ideas into lane rendering.
- `apps/business-os/src/components/board/BoardLane.tsx` — renders `CompactIdea` in Inbox lane.
- `apps/business-os/src/app/ideas/page.tsx` — current ideas index surface.

### Key Modules / Files
- `.claude/skills/ideas-go-faster/SKILL.md` — deterministic Top-K and reaffirmation/addendum rules.
- `apps/business-os/src/components/board/CompactIdea.tsx` — current idea-in-lane presentation.
- `apps/business-os/src/components/ideas/IdeasList.tsx` — current single-list ideas rendering.
- `packages/platform-core/src/repositories/businessOsIdeas.server.ts` — server-side ideas query and ordering contract.

### Patterns & Conventions Observed
- Board pipeline is card-first with optional inbox-ideas rendering path.
- Ideas surface uses server-driven URL query params for filtering/pagination.
- Skill contracts are documented first, then encoded in API/repository/UI.

### Data & Contracts
- Types/schemas:
  - `IdeaPriority`: `P0..P5` in `packages/platform-core/src/repositories/businessOsIdeas.server.ts`.
  - `Idea.Status`: `raw | worked | converted | dropped`.
- Persistence:
  - Ideas in `business_os_ideas` with `priority`, `status`, `location`, JSON payload.
- API/event contracts:
  - Creation/listing via `/api/agent/ideas` and `/api/ideas`.
  - Board delta visibility via `/api/board-changes`.

### Dependency & Impact Map
- Upstream dependencies:
  - `/ideas-go-faster` output rules for idea/card creation and Top-K seeding.
  - D1 repository query semantics for ideas.
- Downstream dependents:
  - Board UX (`BoardView`, `BoardLane`, filters, counts).
  - Ideas triage UX (`/ideas` list + detail navigation).
  - Plan/build loop discoverability and queue management.
- Likely blast radius:
  - Board rendering behavior, board filter behavior, ideas index layout, and associated tests.
  - Skill docs if policy decisions (e.g., Stage 7b) are activated.

### Delivery & Channel Landscape (for business-artifact or mixed)
- Audience/recipient:
  - Pete + operators using Business OS internal UI.
- Channel constraints:
  - Desktop + mobile internal web UI; route-based navigation.
- Existing templates/assets:
  - Existing `/ideas` list/table + mobile card pattern.
- Approvals/owners:
  - Pete as default owner/operator.
- Compliance constraints:
  - Internal tool; no external distribution constraints in this change.
- Measurement hooks:
  - Existing board changes endpoint; no dedicated ideas-surface telemetry counters yet.

### Test Landscape (required for `code` or `mixed`; optional otherwise)
#### Test Infrastructure
- **Frameworks:** Jest + Testing Library (app), Jest (platform-core).
- **Commands:** `pnpm --filter @apps/business-os test -- <paths> --maxWorkers=2`, `pnpm --filter @acme/platform-core test -- <paths> --maxWorkers=2`.
- **CI integration:** package lint/typecheck/test gates.
- **Coverage tools:** no strict per-file thresholds in this scope.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Ideas query parsing | unit | `apps/business-os/src/components/ideas/query-params.test.ts` | URL state parsing/round-trip |
| Ideas list interactions | component | `apps/business-os/src/components/ideas/IdeasList.test.tsx` | click-through + metadata rendering |
| Board shell/nav links | component | `apps/business-os/src/components/board/BoardView.test.tsx`, `apps/business-os/src/components/navigation/NavigationHeader.test.tsx` | link presence and baseline rendering |
| Ideas repository ordering/filtering | unit | `packages/platform-core/src/repositories/__tests__/businessOsIdeasList.server.test.ts` | deterministic ordering + filter binds |

#### Test Patterns & Conventions
- Unit tests: repository and query parser validation.
- Integration/component tests: route components and navigation interactions.
- Test data: inline fixtures with minimal domain surface.

#### Coverage Gaps (Planning Inputs)
- **Untested paths:**
  - Board behavior when ideas are fully removed from lane props.
  - `/ideas` dual-section rendering and pagination per section.
- **Extinct tests:**
  - Any tests expecting idea cards in Inbox lanes will become obsolete and need update.

#### Testability Assessment
- **Easy to test:** ideas list split/render logic; board lane content gating.
- **Hard to test:** cross-skill automation failure/retry behavior from real sweep execution.
- **Test seams needed:** synthetic sweep artifacts and persistence-failure fixtures.

#### Recommended Test Approach
- **Unit tests for:** priority-bucket split and ordering invariants.
- **Integration tests for:** board lane output excludes ideas; ideas page has two sections and stable links.
- **Contract tests for:** Stage 7 deterministic pool + optional Stage 7b guardrails (if activated).

### Recent Git History (Targeted)
- `docs/plans/business-os-ideas-kanban-flow-plan.md` — completed baseline ideas/kanban integration.
- `apps/business-os/src/app/ideas/page.tsx` and `apps/business-os/src/components/ideas/*` — recently introduced ideas index route/components.
- `packages/platform-core/src/repositories/businessOsIdeas.server.ts` — new server-driven list/count query contract.

## External Research (If needed)
- None required; this is internal workflow/UI policy and implementation follow-on.

## Questions
### Resolved
- Q: Should ideas be shown inside Kanban lanes?
  - A: No. Ideas should be listed on a dedicated ideas surface.
  - Evidence: User direction in this thread.
- Q: Should P1-P3 ideas still be visible in ideas UI?
  - A: Yes, in a primary section with click-through.
  - Evidence: User direction in this thread.
- Q: Should P4-P5 ideas be visible?
  - A: Yes, in a secondary section with click-through.
  - Evidence: User direction in this thread.

### Open (User Input Needed)
- Q: Should `/ideas-go-faster` continue auto-creating cards for P1-P3 while ideas remain visible in `/ideas`?
  - Why it matters: determines whether P1-P3 dual-presence (idea + card) is intentional or transitional.
  - Decision impacted: data model and UI status badges/linking strategy.
  - Default assumption + risk: keep auto-card creation; risk is duplicate cognitive load unless clearly labeled.
- Q: Should optional Stage 7b backfill be activated now or remain future work?
  - Why it matters: affects queue fairness for existing high-priority cards missing fact-find docs.
  - Decision impacted: ideas-go-faster Stage 7 selection contract.
  - Default assumption + risk: keep disabled in this phase; risk is continued starvation of older P1/P2 cards.

## Confidence Inputs (for /plan-feature)
- **Implementation:** 87%
  - Board/UI query contracts already exist; required changes are scoped and concrete.
- **Approach:** 83%
  - Direction is clear; primary ambiguity is Stage 7b and P1-P3 dual-presence policy.
- **Impact:** 84%
  - Directly affects triage and execution visibility; high operator impact but bounded technical blast radius.
- **Delivery-Readiness:** 88%
  - Owner, channels, and execution workflow are clear.
- **Testability:** 82%
  - UI/repository behavior testable; automation resilience needs additional harnessing.

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep server-driven filtering and deterministic ordering on ideas surface.
  - Keep fail-closed semantics for stage transitions and discovery index rebuild behavior.
- Rollout/rollback expectations:
  - Rollout by isolating board changes from ideas-surface changes behind explicit route/component updates.
  - Rollback by restoring board idea render path and preserving ideas route.
- Observability expectations:
  - Add explicit counters for sweep partial failures and ideas without fact-find coverage.

## Suggested Task Seeds (Non-binding)
- Remove idea rendering from Kanban lane components and board data path.
- Refactor `/ideas` into two sections: P1-P3 primary and P4-P5 secondary.
- Add status/relationship indicator when an idea already has an associated card.
- Define and implement automation hardening tasks for partial sweep reconciliation and stale index visibility.
- Evaluate Stage 7b activation with a bounded rollout policy.

## Execution Routing Packet
- Primary execution skill:
  - `build-feature`
- Supporting skills:
  - `ideas-go-faster`, `fact-find`, `plan-feature`
- Deliverable acceptance package:
  - Updated board behavior (no idea entities in lanes), updated ideas triage UX with two priority sections, updated tests, and updated workflow docs.
- Post-delivery measurement plan:
  - Track count of ideas surfaced by bucket, ideas with/without fact-find docs, sweep partial-failure counts.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None blocking plan creation; open policy questions can be modeled as DECISION tasks.
- Recommended next step:
  - Proceed to `/plan-feature`.
