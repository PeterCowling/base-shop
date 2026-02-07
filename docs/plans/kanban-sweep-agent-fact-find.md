---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Created: 2026-02-06
Last-updated: 2026-02-06
Feature-Slug: kanban-sweep-agent
Related-Plan: docs/plans/kanban-sweep-agent-plan.md
Business-Unit: PLAT
---

# Kanban Sweep Agent Fact-Find Brief

## Scope

### Summary

Add a periodic "kanban sweep" capability to the Business OS that uses an AI agent to read a snapshot of the entire kanban system (businesses, cards, ideas, people), identify the current growth bottleneck, and generate ranked ideas, experiments, and backlog suggestions. The sweep operates read-only by default (with opt-in draft idea creation) and follows a constraint-first mentality: name the bottleneck, then propose the smallest change that tests a hypothesis. A complete generic draft pack exists at `~/Downloads/kanban-sweep-agent-draft/` (constitution, 10 skill specs, 5 playbooks, 9 JSON schemas, 5 templates, evaluation suite) — Phase 0 keeps the constitution, scoring rubric, bottleneck categories, evaluation rubric, and red flags; drops the multi-skill/multi-agent structure, JSON schemas, role prompts, and glossary.

### Goals

- Implement a `/kanban-sweep` skill (prompt-only SKILL.md, no app code beyond 2 new API endpoints)
- Ingest a snapshot via agent API: all businesses, all cards, all ideas, people profiles, stage docs for active-lane cards only
- Compute flow signals: WIP by lane/business, blocked ratio, aging distribution, ownership gaps
- Diagnose one primary constraint with evidence and a numeric confidence score (0-10)
- Generate 3-10 ranked interventions following Delete > Simplify > Accelerate > Automate preference order
- Score ideas using: Priority = (Impact × Confidence × Time-to-signal) / (Effort × (1 + Risk))
- Produce a single decision-ready sweep report (`docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`)
- Suggest concrete next-step skill invocations (e.g., `/work-idea X`, `/fact-find Y`, `/propose-lane-move Z`)
- Compare to previous sweep if one exists (reflection: did the bottleneck shift? were recommendations accepted?)
- Optionally create draft ideas in inbox when `--create-ideas` flag is passed

### Non-goals

- Auto-remediation: the sweep proposes, humans decide. No direct card mutations or lane moves.
- Metrics dashboard: this computes flow signals from the kanban snapshot only, not from analytics/billing/support systems.
- Multi-agent orchestration: start with a single-agent skill, not the operator+critic+scribe pattern from the draft pack.
- External integrations: no Linear/Jira/Trello connectors. Business OS is the sole data source.
- Automated scheduling: start manual (Pete invokes `/kanban-sweep`), automate later.
- Throughput / cycle time analysis: not feasible without historical lane transition data. Acknowledged as a limitation with lower confidence scores.
- Code-backed analysis modules: Phase 0 is prompt-only. Extract to TypeScript if patterns stabilize.

### Constraints & Assumptions

- Constraints:
  - Must follow the single-SKILL.md-per-directory convention (not 10 separate skills)
  - Must use the agent API (`/api/agent/*`) as the **sole** data source — requires 2 new read-only endpoints (`GET /api/agent/businesses`, `GET /api/agent/people`)
  - Operating mode: `**READ-ONLY ANALYSIS**` by default; `**+ DRAFT IDEAS**` when `--create-ideas` flag is passed
  - Must follow fail-closed rule: if API call fails, stop and surface error
  - Output format must use YAML frontmatter + markdown (Business OS convention), not bare JSON
  - Scoring rubric formula is a must-preserve invariant: `Priority = (Impact × Confidence × Time-to-signal) / (Effort × (1 + Risk))`
  - Stage docs fetched selectively: only for cards in active WIP lanes (Fact-finding, In progress, Blocked) — keeps API request budget under 100/60s rate limit
  - Active WIP lanes: Fact-finding, In progress, Blocked. Planned is a committed queue, not active WIP.
  - Blocked detection: lane === "Blocked" OR `Blocked === true` on the card
- Assumptions:
  - The agent API will be accessible when the sweep runs (requires `BOS_AGENT_API_BASE_URL` and `BOS_AGENT_API_KEY`)
  - Pete is the sole user in Phase 0 (people/capacity analysis is simplified)
  - Card count is manageable without pagination (~55 cards currently; API returns all in one call)
  - Request budget for full snapshot: ~20 requests (1 businesses + 1 people + 1 cards + 2 ideas + ~15 stage docs for active lanes) — well under 100/60s limit

## Repo Audit (Current State)

### Entry Points

- `apps/business-os/src/app/api/agent/cards/route.ts` — GET list cards (primary snapshot source for cards)
- `apps/business-os/src/app/api/agent/ideas/route.ts` — GET list ideas (primary snapshot source for ideas)
- `apps/business-os/src/app/api/agent/stage-docs/route.ts` — GET list stage docs per card (`stage` param is optional; returns all stages for a card)
- `apps/business-os/src/app/api/agent/ideas/route.ts` — POST create idea (output path for sweep-generated draft ideas, opt-in only)
- **NEW (prerequisite):** `apps/business-os/src/app/api/agent/businesses/route.ts` — GET list businesses (reads from `strategy/businesses.json` or D1)
- **NEW (prerequisite):** `apps/business-os/src/app/api/agent/people/route.ts` — GET list people profiles (reads from `users.json` + `people.user.md`)

### Key Modules / Files

- `apps/business-os/src/lib/types.ts` — Core type definitions: `Card`, `Idea`, `Lane`, `Priority`, `StageType`, `CardQuery`, `IdeaQuery`
- `apps/business-os/src/lib/board-logic.ts` — Card filtering (global/business boards) and ordering (priority > due date > updated > tiebreaker)
- `apps/business-os/src/lib/lane-transitions.ts` — Lane-to-stage mapping, stage doc validation for transitions
- `apps/business-os/src/lib/board-card-counts.ts` — Card count calculation by lane (client-side utility)
- `apps/business-os/src/lib/current-user.ts` — Hardcoded users: Pete (admin), Cristiana (admin), Avery (user)
- `apps/business-os/src/lib/business-catalog.ts` — Hardcoded business codes: PLAT, BRIK, BOS (TODO: BOS-D1-08 to move to D1)
- `apps/business-os/src/lib/entity-sha.ts` — Entity SHA computation for optimistic concurrency
- `packages/platform-core/src/repositories/businessOsCards.server.ts` — D1 card repository with CardSchema (Zod)
- `packages/platform-core/src/repositories/businessOsIdeas.server.ts` — D1 idea repository with IdeaSchema (Zod)
- `packages/platform-core/src/repositories/businessOsStageDocs.server.ts` — D1 stage doc repository
- `apps/business-os/src/lib/auth/agent-auth.ts` — Agent API authentication (shared secret + rate limiting: 100 req/60s, in-process Map, per-key)
- `.claude/skills/_shared/card-operations.md` — Shared helper: card CRUD patterns, fail-closed rule, idempotency
- `.claude/skills/_shared/stage-doc-operations.md` — Shared helper: stage doc lifecycle, evidence types
- `docs/business-os/strategy/businesses.json` — Business catalog (4 businesses: PLAT, BRIK, BOS, PIPE)
- `docs/business-os/strategy/business-maturity-model.md` — Business maturity framework (L1/L2/L3)

### Patterns & Conventions Observed

- **Single SKILL.md per directory** — every skill has exactly one file, frontmatter with `name` and `description`, standard sections (Operating Mode, Inputs, Workflow, Edge Cases, Integration, Example, Error Handling, Phase 0 Constraints, Quality Checks, Completion Messages). Evidence: all 29 skills in `.claude/skills/*/SKILL.md`
- **Operating Mode as safety boundary** — bold declaration (e.g., `**READ-ONLY ANALYSIS + PROPOSAL**`) followed by explicit Allowed/Not-allowed lists. Evidence: `scan-repo/SKILL.md`, `propose-lane-move/SKILL.md`, `fact-find/SKILL.md`
- **Fail-closed API pattern** — if any API call fails, stop and surface the error; do not write markdown directly. Evidence: `.claude/skills/_shared/card-operations.md`
- **Discovery/fast path pattern** — skills that can be invoked with or without arguments provide both paths (fast path <2s start). Evidence: `fact-find/SKILL.md`, `plan-feature/SKILL.md`
- **Structured JSON output for scan artifacts** — `scan-repo` outputs `active-docs.json` and `last-scan.json`. Evidence: `docs/business-os/scans/`
- **YAML frontmatter + markdown for all persistent docs** — cards, ideas, stage docs, plans, briefs all use this format. Evidence: `docs/business-os/cards/*.user.md`, `docs/plans/*.md`
- **Optimistic concurrency via entitySha** — PATCH operations require `baseEntitySha` to detect conflicts (409). Evidence: `apps/business-os/src/app/api/agent/cards/[id]/route.ts`
- **Business OS Integration section** — optional section in skills that creates/updates cards and stage docs via API when `Business-Unit` is in frontmatter. Evidence: `fact-find/SKILL.md`, `plan-feature/SKILL.md`

### Data & Contracts

#### Types/schemas (Business OS native):

| Entity | TypeScript | Zod Schema | D1 Table |
|--------|-----------|------------|----------|
| Card | `Card` in `types.ts` | `CardSchema` in `businessOsCards.server.ts` | `business_os_cards` |
| Idea | `Idea` in `types.ts` | `IdeaSchema` in `businessOsIdeas.server.ts` | `business_os_ideas` |
| StageDoc | `StageDoc` in `types.ts` | `StageDocSchema` in `businessOsStageDocs.server.ts` | `business_os_stage_docs` |
| Business | `Business` in `types.ts` | N/A (file-based) | N/A |
| User | `User` in `current-user.ts` | N/A | N/A |

#### Draft pack data contracts — keep vs drop for Phase 0:

| Draft Pack Component | Phase 0 Decision | Notes |
|---------------------|-----------------|-------|
| Constitution invariants | **Keep** — embed as rules in SKILL.md | Constraint-first, read-only default, delete>simplify>accelerate>automate, evidence-based, measurement-required, named ownership, sustainability |
| Scoring rubric (playbook) | **Keep** — embed formula + thresholds in SKILL.md | Priority = (I×C×T) / (E×(1+R)), all scales 0-10 |
| Bottleneck categories (7 types) | **Keep** — embed as diagnostic framework in SKILL.md | Execution throughput, decision latency, ownership/coordination, capability mismatch, quality/rework, business clarity, external dependency |
| Delete>Simplify>Accelerate>Automate ordering | **Keep** — embed as preference rule (tiebreaker, not hard gate) | An Automate-8.0 beats a Delete-2.0 |
| Evaluation rubric (0-30 scoring) | **Keep** — embed as quality checks in SKILL.md | 6 dimensions: constraint quality, actionability, deletion-first bias, measurement discipline, flow literacy, people/system framing |
| Red flags list | **Keep** — embed as guardrails in SKILL.md | 7 red flags from draft pack |
| Sweep report template | **Adapt** — single-file version with YAML frontmatter | Merge all sections into one `<date>-sweep.user.md` |
| Test cases (3 scenarios) | **Defer** — useful for manual validation, not needed in SKILL.md | Can use during prototype sweep |
| 10 sub-skill specs | **Drop** — consolidated into single SKILL.md workflow sections | Orchestrator steps become workflow steps |
| 9 JSON schemas | **Drop** — use Business OS TypeScript types + agent API contracts | No schema files created |
| Role prompts (operator/critic/scribe) | **Drop** — single-agent for Phase 0 | Revisit if quality issues emerge |
| System prompt template | **Drop** — SKILL.md is the prompt | N/A |
| Glossary | **Drop** — inline definitions where needed | N/A |

#### Persistence:

- **Cards, ideas, stage docs** → D1 database (canonical), markdown files are read-only mirrors exported by a job
- **Business catalog** → `docs/business-os/strategy/businesses.json` (file-based, 4 businesses) — exposed via new `GET /api/agent/businesses` endpoint
- **People** → `docs/business-os/people/users.json` (auth only) + `people.user.md` (profiles, may not exist yet) — exposed via new `GET /api/agent/people` endpoint with graceful degradation
- **Scan artifacts** → `docs/business-os/scans/` (JSON files, file-based)
- **Sweep outputs** → `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md` (single file per sweep)

#### API/event contracts:

- **Agent API auth**: `X-Agent-API-Key` header, validated against `BOS_AGENT_API_KEY` env var, rate limited to 100 req/60s (in-process Map, per-key)
- **GET /api/agent/cards**: returns `{ cards: Card[] }`, filters: `?business=X&lane=Y` (no pagination, no priority/owner filter)
- **GET /api/agent/ideas**: returns `{ ideas: Idea[] }`, filters: `?business=X&location=inbox|worked`
- **GET /api/agent/stage-docs**: returns `{ stageDocs: StageDoc[] }`, filter: `?cardId=X` (required) + `?stage=Y` (optional — omit to get all stages)
- **POST /api/agent/ideas**: creates idea, returns `{ success, ideaId }` (minimal response)
- **GET /api/agent/businesses** (NEW): returns `{ businesses: Business[] }` — reads from `strategy/businesses.json`
- **GET /api/agent/people** (NEW): returns `{ people: Person[] }` — reads from `users.json` + `people.user.md` with graceful degradation

#### Rate limit budget (full snapshot):

| Call | Count | Notes |
|------|-------|-------|
| GET /api/agent/businesses | 1 | New endpoint |
| GET /api/agent/people | 1 | New endpoint |
| GET /api/agent/cards | 1 | All cards, all businesses |
| GET /api/agent/ideas (inbox) | 1 | All inbox ideas |
| GET /api/agent/ideas (worked) | 1 | All worked ideas |
| GET /api/agent/stage-docs | ~15 | One per active-WIP card (Fact-finding + In progress + Blocked lanes only) |
| POST /api/agent/ideas | 0-10 | Only with `--create-ideas` flag |
| **Total** | **~20-30** | Well under 100/60s limit |

### Dependency & Impact Map

- **Upstream dependencies:**
  - Agent API endpoints (cards, ideas, stage-docs, **businesses** (new), **people** (new)) — must be available at runtime
  - Previous sweep outputs (optional, for reflection/comparison) — located by most-recent filename date in `docs/business-os/sweeps/`
- **Downstream dependents:**
  - Sweep ideas (if `--create-ideas`) → feed into `/work-idea` → `/fact-find` → `/plan-feature` pipeline
  - Sweep report → consumed by Pete for weekly prioritization decisions
  - Sweep next-action suggestions → concrete skill invocations Pete can copy-paste
  - Backlog suggestions → implemented via card PATCH API after human review
- **Likely blast radius:**
  - Low: the sweep is read-only by default. Opt-in writes are draft ideas only.
  - New API endpoints (businesses, people) are read-only, additive, low-risk
  - The SKILL.md file itself is self-contained
  - If the sweep proposes incorrect bottleneck diagnoses, impact is limited to Pete's time reviewing bad suggestions

### Test Landscape

#### Test Infrastructure

- **Frameworks:** Jest 29 (unit + integration), Cypress 13 (E2E), Testing Library (components)
- **Commands:** `pnpm test` (jest --ci --runInBand), `pnpm e2e` (cypress run)
- **CI integration:** Tests run in reusable workflow (`reusable-app.yml`), currently skipped on staging branch
- **Coverage tools:** Jest coverage built-in, thresholds in shared `jest.preset.cjs`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Agent API routes (cards) | integration | `cards/__tests__/route.test.ts` | CRUD, 409 conflict, 401 auth — well covered |
| Agent API routes (ideas) | integration | `ideas/__tests__/route.test.ts` | CRUD, 409 conflict, 401 auth — well covered |
| Agent API routes (stage-docs) | integration | `stage-docs/__tests__/route.test.ts` | CRUD, parent validation, conflict — well covered |
| Agent API auth | unit | `auth/agent-auth.test.ts` | Key validation, timing-safe compare, rate limiting |
| Board logic | unit | `board-logic.test.ts` | Filtering (global/business), ordering (priority, due, tiebreaker) |
| Lane transitions | unit | `lane-transitions.test.ts` | Lane-stage mapping, stage doc validation, full lifecycle |
| Optimistic concurrency | unit | `optimistic-concurrency.test.ts` | SHA-based conflict detection |
| Repo locking | integration | `RepoLock.test.ts`, `repo-lock-integration.test.ts` | Acquire/release, stale recovery, concurrent ops |
| Evidence types | unit | `evidence.test.ts` | Zod validation of 9 evidence source types |

#### Test Patterns & Conventions

- **Unit tests**: Import functions directly, construct mock data in-test, assert outputs. No mocking. Pattern: `board-logic.test.ts`, `lane-transitions.test.ts`
- **Integration tests**: Create real temp directories via `fs.mkdtemp`, real file I/O, cleanup in `afterEach`. Pattern: `repo-lock-integration.test.ts`
- **API route tests**: Mock repository layer via `jest.mock()`, construct `NextRequest`, call handler directly. Test case IDs (TC-01, etc.). Pattern: `cards/__tests__/route.test.ts`
- **Test data**: Inline mock objects, no shared fixture files or factories

#### Coverage Gaps (Planning Inputs)

- **Untested paths:**
  - `board-card-counts.ts` — no tests (relevant for sweep flow analysis)
  - `business-catalog.ts` — no tests (relevant for new businesses endpoint)
  - `entity-sha.ts` — no direct tests (tested transitively via API route tests)
  - No people/profiles module or API exists to test
- **Extinct tests:**
  - Mobile layout tests in `BoardView.test.tsx` (lines 209-233) — placeholder `expect(true).toBe(true)`

#### Testability Assessment

- **Easy to test:** New API endpoints (businesses, people) — follow established route test pattern
- **Hard to test:** SKILL.md prompt execution → agent behavior → API calls → output. No skill testing harness exists.
- **Phase 0 approach:** Prompt-only skill means no unit-testable code for flow analysis/scoring. Correctness depends on agent following SKILL.md instructions. Manual prototype sweep validates output quality.

#### Recommended Test Approach

- **Unit tests for:** New API endpoints (businesses, people) — follow existing `cards/__tests__/route.test.ts` pattern
- **Integration tests for:** Not applicable for Phase 0 prompt-only skill
- **E2E tests for:** Not applicable (sweep outputs are files, not UI)
- **Manual validation:** Run prototype sweep against current board state and evaluate output quality using the evaluation rubric (6 dimensions, 0-30 total score)

### Recent Git History (Targeted)

- `apps/business-os/src/app/api/agent/` — Agent API routes stable since initial implementation (2026-01-28). Recent changes were adding `board-changes` endpoint and fixing export snapshots.
- `docs/business-os/strategy/` — `business-maturity-model.md` added 2026-02-06 (today). `businesses.json` stable since 2026-01-31.
- `.claude/skills/` — Active development; `scan-repo`, `session-reflect`, `propose-lane-move` recently updated. Skill conventions are mature.

## External Research (If needed)

No external research required. All information sourced from repo audit and draft pack review.

## Questions

### Resolved (from repo audit)

- **Q: Snapshot source — agent APIs or markdown files or combination?**
  - A: **Agent API only.** Two new read-only endpoints (`GET /api/agent/businesses`, `GET /api/agent/people`) will be added so the sweep uses the agent API as the sole data source. No direct file reads.
  - Rationale: Clean data contract, portable (no repo access needed), consistent auth/rate-limiting, right long-term pattern.

- **Q: Skill structure — single orchestrator or 10 sub-skills?**
  - A: **Single `/kanban-sweep` skill** with internal sub-steps in the workflow section. The existing convention strongly favors one SKILL.md per skill with modes (like `fact-find` has Outcome A/B, `scan-repo` has full/incremental).
  - Evidence: All 29 existing skills are single SKILL.md files. No multi-skill orchestration pattern exists.

- **Q: Output location — new directory or existing APIs?**
  - A: **Single file per sweep** at `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`. Draft ideas (opt-in) created via `POST /api/agent/ideas`.
  - Evidence: `scan-repo` uses `docs/business-os/scans/` for structured output.

- **Q: Data contracts — JSON schemas or YAML frontmatter?**
  - A: **YAML frontmatter + markdown** for all persistent artifacts. Draft pack JSON schemas inform the data model but are not adopted. Internal computation uses Business OS TypeScript types.

- **Q: Multi-agent execution — single or operator+critic?**
  - A: **Single agent, end-to-end** for Phase 0. Revisit if quality issues emerge.

- **Q: How does this differ from `/scan-repo`?**
  - A: `scan-repo` detects **changes** (git diff since last scan). `kanban-sweep` audits **state consistency** and **flow health**. They are complementary.

### Resolved (from user input)

- **Q: Should the sweep create ideas via the API automatically, or only include them in the report for manual creation?**
  - A: **Opt-in draft idea creation.** Default is report-only (pure read-only). When `--create-ideas` flag is passed, sweep creates raw/draft ideas in the inbox, tagged `sweep-generated` + `sweep-<date>`, with minimal content and a back-reference to the sweep report.
  - Rationale: Respects constitution's read-only-by-default principle. Follows `/scan-repo` precedent when opted in.

- **Q: Should the people profile (`people.user.md`) be required to exist before the sweep runs?**
  - A: **Graceful degradation.** New `GET /api/agent/people` endpoint returns whatever people data exists. Sweep skips capacity/load analysis when only basic user data is available. Flags the gap in the sweep report's governance section.

### Resolved (from critique review)

- **Q: Stage docs retrieval — will it hit rate limits?**
  - A: **Selective fetching.** Only fetch stage docs for cards in active WIP lanes (Fact-finding, In progress, Blocked). `stage` param is optional on the API (confirmed in code: `businessOsStageDocs.server.ts:110`). Budget: ~15 calls, well under 100/60s.
  - Evidence: `apps/business-os/src/app/api/agent/stage-docs/route.ts` lines 46-53 show stage is optional.

- **Q: What counts as "primary data source = agent API"?**
  - A: **API-only.** Add `GET /api/agent/businesses` and `GET /api/agent/people` as new endpoints. No direct file reads from the sweep skill.

- **Q: Which lanes count as active WIP?**
  - A: **Fact-finding + In progress + Blocked.** Planned is a committed queue, not active work. Inbox is pre-triage. Done/Reflected are terminal.

- **Q: How is "blocked" detected?**
  - A: **Lane OR field.** Card is blocked if `Lane === "Blocked"` OR `Blocked === true`. Both indicators are checked.

- **Q: Should the sweep write by default?**
  - A: **No.** Default is report-only. `--create-ideas` flag opts in to idea creation. Explicit mode switch, not implicit.

- **Q: Single report or multiple artifacts?**
  - A: **Single file** for Phase 0. `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md` containing everything. Can split later if needed.

- **Q: Portfolio-wide or per-business?**
  - A: **Portfolio-wide with per-business sections.** One system-wide constraint diagnosis, then a breakdown per business. No `--business` scoping flag in Phase 0.

- **Q: How does "compare to previous sweep" work?**
  - A: **Most recent by filename date sort** in `docs/business-os/sweeps/`. Sweep report frontmatter includes `Previous-Sweep: <path>` for traceability. No sweep ID or snapshot SHA needed for Phase 0.

- **Q: Scoring rubric — hard ordering or preference weight for Delete>Simplify>Accelerate>Automate?**
  - A: **Preference ordering (tiebreaker).** An Automate idea scoring 8.0 beats a Delete idea scoring 2.0. When scores are close, prefer deletion/simplification.

- **Q: How should confidence be computed?**
  - A: **Numeric 0-10 with explicit thresholds.** <4 = discovery needed, 4-6 = weak evidence, 7-8 = solid, 9-10 = strong. Must list evidence gaps when confidence < 7.

- **Q: Should sweep suggest skill invocations as next actions?**
  - A: **Yes.** Each recommendation includes a concrete next step (e.g., `/work-idea PLAT-OPP-0005`, `/fact-find <topic>`, `/propose-lane-move <card-id>`). Closes the sweep → execution loop.

- **Q: Prompt-only or code-backed?**
  - A: **Prompt-only for Phase 0.** All logic in the SKILL.md. No app code changes except the 2 new API endpoints. Extract to TypeScript modules later if patterns stabilize and consistency matters.

- **Q: Dedicated snapshot API endpoint?**
  - A: **Not needed for Phase 0.** Request budget is ~20-30 calls, well under limit. Good future optimization if sweeps become automated or card count grows significantly.

- **Q: Timestamp limitations for constraint diagnosis?**
  - A: **Acknowledged.** Cards have `Created` and `Updated` (date strings) but no per-lane transition history. Stage doc `Created` is a proxy for stage entry. Throughput and cycle time cannot be computed. Constraint diagnosis uses proxy metrics (aging, WIP distribution, blocked ratio) and must assign lower confidence (max 6/10) to throughput-based diagnoses.

- **Q: Default capacity model for Phase 0?**
  - A: **Max active WIP = 3 per person** unless overridden by people profile data. Active WIP = cards in Fact-finding + In progress + Blocked lanes owned by that person. This prevents hand-wavy "capacity mismatch" diagnoses.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 85%
  - Strong: Skill convention is well-established (29 examples), API endpoints exist and are well-tested, draft pack provides comprehensive structure to adapt. All questions resolved. Rate limit budget verified. Prompt-only approach minimizes build risk.
  - Missing: 2 new API endpoints must be built (low effort, follows existing patterns). Sweep report template needs to be designed.
  - What would raise to ≥90%: Prototype sweep report reviewed by Pete and confirmed useful.

- **Approach:** 88%
  - Strong: Single-skill structure clearly right. API-only data source is clean. Constitution invariants well-defined. Scoring rubric preserved. Selective stage doc fetching solves rate limit risk. All spec-level questions resolved with explicit answers.
  - Missing: Scoring rubric formula untested with real data. May need calibration after first sweep.
  - What would raise to ≥90%: Run prototype sweep on current board state to validate that bottleneck diagnosis produces actionable insights.

- **Impact:** 82%
  - Strong: Sweep is read-only by default (low blast radius). New API endpoints are additive, read-only. Skill is self-contained. Opt-in idea creation follows established pattern.
  - Missing: No validation that sweep recommendations will be useful in practice. The meta-level loop (sweep → prioritize → execute → measure) is new and unproven.
  - What would raise to ≥90%: Pete reviews a prototype sweep report and confirms it surfaces insights he wouldn't have found manually.

- **Testability:** 70%
  - Strong: New API endpoints are unit-testable using established patterns.
  - Missing: Prompt-only skill means flow analysis and scoring are not unit-testable. Correctness depends on agent following SKILL.md instructions. Sweep quality is subjective.
  - What would improve testability: Extract flow analysis to TypeScript modules in a future phase. Use evaluation rubric (6 dimensions, 0-30 score) for manual quality assessment.

## Planning Constraints & Notes

- **Must-follow patterns:**
  - Single `SKILL.md` in `.claude/skills/kanban-sweep/` with standard sections
  - Operating Mode: `**READ-ONLY ANALYSIS**` (default) / `**+ DRAFT IDEAS**` (with `--create-ideas`)
  - Agent API as sole data source (requires 2 new endpoints as prerequisite)
  - Fail-closed on API errors
  - YAML frontmatter + markdown for all outputs
  - Phase 0 constraints: Pete-triggered only, no automated scheduling, agent identity for any writes
  - Scoring rubric invariant: `Priority = (Impact × Confidence × Time-to-signal) / (Effort × (1 + Risk))`
  - Confidence thresholds: <4 discovery, 4-6 weak, 7-8 solid, 9-10 strong; list gaps when <7
  - Max confidence 6/10 for throughput-based diagnoses (no historical transition data)
  - Default capacity: max 3 active WIP per person unless overridden by people profile

- **Rollout/rollback expectations:**
  - Rollout: 2 new API endpoints (additive, read-only) + 1 new skill directory. Can be tested by invoking `/kanban-sweep` manually.
  - Rollback: Delete `.claude/skills/kanban-sweep/` directory + `docs/business-os/sweeps/` output. Optionally revert API endpoints. No database changes.

- **Observability expectations:**
  - Sweep reports are self-documenting (markdown artifacts with timestamps, evidence, confidence scores, and `Previous-Sweep` reference)
  - No additional logging infrastructure needed in Phase 0

## Suggested Task Seeds (Non-binding)

1. **Create `GET /api/agent/businesses` endpoint** — Read-only endpoint returning business catalog. Follow existing agent API route pattern (auth, edge runtime, Zod validation). Test following `cards/__tests__/route.test.ts` pattern.

2. **Create `GET /api/agent/people` endpoint** — Read-only endpoint returning people profiles with graceful degradation. Returns hardcoded users from `current-user.ts` merged with `people.user.md` data if available. Test following existing pattern.

3. **Design sweep report template** — Single-file YAML frontmatter + markdown template for `<YYYY-MM-DD>-sweep.user.md`. Sections: executive summary, snapshot overview, flow signals, primary bottleneck brief (constraint statement + evidence + confidence + first actions + disproof signals), per-business breakdown, ranked interventions (scored), experiments, backlog suggestions, governance notes, next actions (with skill invocations), reflection (if previous sweep exists).

4. **Write the SKILL.md** — Assemble the `/kanban-sweep` skill definition with: Operating Mode (read-only default + opt-in ideas), Inputs (optional `--create-ideas` flag), Workflow (snapshot → flow analysis → bottleneck diagnosis → idea generation → scoring → report assembly → optional idea creation → reflection), Constitution invariants, Scoring rubric, Evaluation rubric (quality checks), Red flags, Edge Cases, Integration with Other Skills, Example Session, Phase 0 Constraints, Completion Messages.

5. **Create `docs/business-os/sweeps/` directory** — Add `.gitkeep` and ensure the directory exists for sweep output.

6. **Run prototype sweep** — Manually invoke `/kanban-sweep` against the current Business OS state. Evaluate output using the 6-dimension rubric (0-30). Validate bottleneck diagnosis and recommendations are actionable. Calibrate scoring rubric if needed.

## Planning Readiness

- **Status: Ready-for-planning**
- Blocking items: None. All questions resolved.
- Prerequisite tasks: 2 new API endpoints (businesses, people) must be built before the skill can run.
- Recommended next step: Proceed to `/plan-feature` to break these task seeds into atomic, confidence-gated implementation tasks.
