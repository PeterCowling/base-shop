---
Type: Plan
Status: Active
Domain: Platform
Created: 2026-02-06
Last-updated: 2026-02-07
Last-reviewed: 2026-02-06
Feature-Slug: kanban-sweep-agent
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-Unit: PLAT
Relates-to charter: none
---

# Kanban Sweep Agent Plan

## Summary

Add a periodic `/kanban-sweep` skill that reads a snapshot of the entire Business OS kanban system via agent APIs, identifies the current growth bottleneck using constraint-first methodology, and produces a single decision-ready sweep report with ranked interventions, experiments, and concrete next-step skill invocations. Phase 0 is prompt-only (SKILL.md + 2 new read-only API endpoints). The sweep operates read-only by default with opt-in draft idea creation via `--create-ideas` flag.

## Goals

- Two new read-only API endpoints: `GET /api/agent/businesses` and `GET /api/agent/people`
- One new skill: `/kanban-sweep` with SKILL.md defining the full sweep workflow
- Single-file sweep report output at `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`
- Constraint-first bottleneck diagnosis with numeric 0-10 confidence scoring
- Ranked interventions using Priority = (Impact × Confidence × Time-to-signal) / (Effort × (1 + Risk))
- Concrete next-step skill invocations (e.g., `/work-idea X`, `/fact-find Y`) in every recommendation
- Reflection against previous sweep when one exists

## Non-goals

- Auto-remediation (read-only by default; no card mutations or lane moves)
- Multi-agent orchestration (single agent, end-to-end)
- Throughput/cycle time analysis (no historical lane transition data)
- Code-backed analysis modules (prompt-only for Phase 0)
- Automated scheduling (Pete-triggered only)
- External integrations (Business OS is the sole data source)

## Constraints & Assumptions

- Constraints:
  - Single SKILL.md convention (`.claude/skills/kanban-sweep/SKILL.md`)
  - Agent API as sole data source (no direct file reads from skill)
  - Fail-closed on API errors
  - YAML frontmatter + markdown for all outputs
  - Scoring rubric formula is invariant: `Priority = (Impact × Confidence × Time-to-signal) / (Effort × (1 + Risk))`
  - Max confidence 6/10 for throughput-based diagnoses (no historical transition data)
  - Default capacity: max 3 active WIP per person unless overridden by people profile
  - Stage docs fetched selectively: active WIP lanes only (Fact-finding, In progress, Blocked)
- Assumptions:
  - Agent API accessible when sweep runs (requires `BOS_AGENT_API_BASE_URL` + `BOS_AGENT_API_KEY`)
  - Pete is sole user in Phase 0
  - Card count manageable without pagination (~55 cards currently)
  - Request budget ~20-30 calls, well under 100/60s rate limit

## Fact-Find Reference

- Related brief: `docs/plans/kanban-sweep-agent-fact-find.md`
- Key findings:
  - 29 existing skills all follow single-SKILL.md-per-directory convention
  - Agent API routes are well-tested (cards, ideas, stage-docs all have TC-XX test suites)
  - `BUSINESSES` array in `business-catalog.ts` has 3 entries; `businesses.json` has 4 (PIPE missing from code)
  - No people directory or profiles exist yet — graceful degradation required
  - `stage` param on stage-docs API is optional (confirmed at `stage-docs/route.ts:46-53`)
  - Rate limit: 100 req/60s, in-process Map per-key (verified at `agent-auth.ts`)
  - Draft pack components: keep constitution/rubric/categories/eval/red-flags; drop multi-skill/JSON-schemas/role-prompts

## Existing System Notes

- Key modules/files:
  - `apps/business-os/src/app/api/agent/cards/route.ts` — GET/POST cards (pattern to follow)
  - `apps/business-os/src/app/api/agent/ideas/route.ts` — GET/POST ideas (pattern to follow)
  - `apps/business-os/src/lib/business-catalog.ts` — hardcoded `BUSINESSES` array (data source for businesses endpoint)
  - `apps/business-os/src/lib/current-user.ts` — hardcoded `USERS` record (data source for people endpoint)
  - `apps/business-os/src/lib/types.ts` — `Business`, `Card`, `Idea`, `Lane`, `StageDoc` types
  - `apps/business-os/src/lib/auth/agent-auth.ts` — auth middleware + `__resetAgentRateLimitForTests()`
  - `apps/business-os/src/lib/d1.server.ts` — D1 accessor (mocked in tests)
  - `.claude/skills/scan-repo/SKILL.md` — closest analogue skill (reads BoS state, generates ideas)
  - `.claude/skills/propose-lane-move/SKILL.md` — read-only analysis skill pattern
- Patterns to follow:
  - Edge runtime: `export const runtime = "edge";`
  - Auth: `const auth = await requireAgentAuth(request); if (auth instanceof NextResponse) return auth;`
  - Response: `NextResponse.json({ resources: [...] })`
  - Test mock: `jest.mock("@/lib/d1.server")` + `jest.mock("@acme/platform-core/repositories/businessOs.server")` with `jest.requireActual`
  - Skill YAML frontmatter: `name` + `description` only

## Proposed Approach

The feature is built in 5 ordered tasks: two prerequisite API endpoints, the sweep report template design (embedded in the SKILL.md), the SKILL.md itself, and a directory scaffold + prototype validation.

**Architecture:**
1. **Businesses endpoint** — Reads from the existing `BUSINESSES` array in `business-catalog.ts`. GET-only, no D1 queries needed (file-based data). Returns `{ businesses: Business[] }`.
2. **People endpoint** — Reads from the existing `USERS` record in `current-user.ts`. GET-only, no D1 queries needed. Returns `{ people: Person[] }` where `Person` extends `User` with optional capacity/skills fields. Graceful degradation: returns hardcoded users with default capacity when no rich profiles exist.
3. **SKILL.md** — Single file containing: operating mode, inputs, full workflow (8 steps from ingest to reflection), constitution invariants, scoring rubric, bottleneck categories, evaluation rubric, red flags, edge cases, integration with other skills, Phase 0 constraints, completion messages. Embeds the sweep report template as a section.
4. **Directory + prototype** — Create `docs/business-os/sweeps/` with `.gitkeep`, then manually invoke the skill to validate output quality.

No alternatives considered — the approach was fully resolved during the fact-find critique walkthrough.

## Active tasks

- TASK-05: Run prototype sweep and validate output (Pending, depends on TASK-03, TASK-04)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Create `GET /api/agent/businesses` endpoint | 92% | S | Complete (2026-02-06) | - |
| TASK-02 | IMPLEMENT | Create `GET /api/agent/people` endpoint | 88% | S | Complete (2026-02-06) | - |
| TASK-03 | IMPLEMENT | Write `/kanban-sweep` SKILL.md | 85% | M | Complete (2026-02-06) | TASK-01, TASK-02 |
| TASK-04 | IMPLEMENT | Create `docs/business-os/sweeps/` directory | 98% | S | Complete (2026-02-06) | - |
| TASK-05 | IMPLEMENT | Run prototype sweep and validate output | 80% | M | Pending | TASK-03, TASK-04 |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Tasks

### TASK-01: Create `GET /api/agent/businesses` endpoint

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/app/api/agent/businesses/route.ts` (new)
  - `apps/business-os/src/app/api/agent/businesses/__tests__/route.test.ts` (new)
  - `[readonly] apps/business-os/src/lib/business-catalog.ts`
  - `[readonly] apps/business-os/src/lib/types.ts`
  - `[readonly] apps/business-os/src/lib/auth/agent-auth.ts`
- **Depends on:** -
- **Effort:** S (1 new route file + 1 new test file, 0 integration boundaries, follows existing pattern exactly)
- **Confidence:** 92%
  - Implementation: 95% — Identical pattern to `cards/route.ts` GET handler. Data source (`BUSINESSES` array) already exists and is imported. No D1 queries needed.
  - Approach: 92% — Simple read-only endpoint returning existing in-memory data. Only question is whether to also read from `businesses.json` (decided: no, use `BUSINESSES` array for consistency with existing routes that already validate against it).
  - Impact: 90% — Purely additive endpoint. No existing code changes. Only consumer will be the sweep skill.
- **Acceptance:**
  - `GET /api/agent/businesses` returns `{ businesses: Business[] }` with all businesses from `BUSINESSES` array
  - `GET /api/agent/businesses?status=active` filters by status
  - Returns 401 when `X-Agent-API-Key` header is missing
  - Returns 400 for invalid status filter
  - Edge runtime is declared
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: GET returns all businesses with correct shape `{ businesses: Business[] }`
    - TC-02: GET with `?status=active` filters to active businesses only
    - TC-03: GET with invalid status returns 400
    - TC-04: Missing auth header returns 401
  - **Acceptance coverage:** TC-01 covers "returns all businesses"; TC-02 covers "filters by status"; TC-03 covers "invalid filter"; TC-04 covers "auth required"
  - **Test type:** integration (route handler direct call)
  - **Test location:** `apps/business-os/src/app/api/agent/businesses/__tests__/route.test.ts` (new)
  - **Run:** `pnpm --filter business-os test -- --testPathPattern="agent/businesses"`
- **Planning validation:**
  - Tests run: existing `cards/__tests__/route.test.ts` pattern reviewed (7 TCs, all structurally identical to what we need)
  - Test stubs written: N/A (S effort)
  - Unexpected findings: `BUSINESSES` array in `business-catalog.ts` has 3 entries (PLAT, BRIK, BOS) but `businesses.json` has 4 (adds PIPE). The endpoint should use `BUSINESSES` for consistency with existing card/idea routes that validate against it. The PIPE discrepancy is a pre-existing issue tracked as `BOS-D1-08`.
- **Rollout / rollback:**
  - Rollout: New route file, no migration. Available immediately on deploy.
  - Rollback: Delete route file. No dependencies broken (only consumer is sweep skill).
- **Documentation impact:** None (API is internal agent-only)
- **Notes / references:**
  - Pattern: `apps/business-os/src/app/api/agent/cards/route.ts` (GET handler, lines 53-77)
  - Auth: `requireAgentAuth` from `@/lib/auth/middleware`
  - Data: `BUSINESSES` from `@/lib/business-catalog`
  - Types: `Business` from `@/lib/types` (lines 8-16)
  - Note: No D1 access needed — this endpoint reads from an in-memory array, not the database. No `getDb()` call required. Test does NOT need to mock `@/lib/d1.server` or `@acme/platform-core/repositories/businessOs.server`.

#### Build Completion (2026-02-06)
- **Status:** Complete
- **Commits:** efaf3bb20e (bundled with concurrent session)
- **TDD cycle:**
  - Test cases executed: TC-01, TC-02, TC-03, TC-04
  - Red-green cycles: 1 (ideal)
  - Initial test run: FAIL (expected — route not implemented)
  - Post-implementation: PASS
- **Confidence reassessment:**
  - Original: 92%
  - Post-test: 92%
  - Delta reason: Tests validated assumptions — no surprises
- **Validation:**
  - Ran: `npx jest --testPathPattern="agent/businesses"` — PASS (4 tests, 4 passed)
- **Documentation updated:** None required
- **Implementation notes:** Route reads from `BUSINESSES` array (3 entries: PLAT, BRIK, BOS). Status filter validates against `["active", "inactive", "archived"]`. No D1 mocking needed in tests — simpler setup than cards/ideas.

---

### TASK-02: Create `GET /api/agent/people` endpoint

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/app/api/agent/people/route.ts` (new)
  - `apps/business-os/src/app/api/agent/people/__tests__/route.test.ts` (new)
  - `[readonly] apps/business-os/src/lib/current-user.ts`
  - `[readonly] apps/business-os/src/lib/types.ts`
  - `[readonly] apps/business-os/src/lib/auth/agent-auth.ts`
- **Depends on:** -
- **Effort:** S (1 new route file + 1 new test file, 0 integration boundaries. Slightly more novel than TASK-01 because it defines a new `Person` response type, but still follows the same pattern.)
- **Confidence:** 88%
  - Implementation: 90% — Same auth/response pattern. Data source (`USERS` record) exists. Need to define a `Person` response type that extends `User` with optional capacity fields.
  - Approach: 88% — Graceful degradation design: returns hardcoded users with default `maxActiveWip: 3` when no rich profile data exists. The `Person` type adds `capacity` and `skills` optional fields that can be populated later.
  - Impact: 88% — Purely additive. The `Person` type is new but doesn't affect any existing code.
- **Acceptance:**
  - `GET /api/agent/people` returns `{ people: Person[] }` with all users from `USERS` record
  - Each person includes `id`, `name`, `role`, and `capacity: { maxActiveWip: 3 }` (default)
  - Returns 401 when `X-Agent-API-Key` header is missing
  - Edge runtime is declared
  - Graceful degradation: endpoint works even without rich profile files
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: GET returns all people with correct shape `{ people: Person[] }` including default capacity
    - TC-02: Each person has `id`, `name`, `role`, and `capacity.maxActiveWip` fields
    - TC-03: Missing auth header returns 401
  - **Acceptance coverage:** TC-01 covers "returns all people with defaults"; TC-02 covers "shape includes capacity"; TC-03 covers "auth required"
  - **Test type:** integration (route handler direct call)
  - **Test location:** `apps/business-os/src/app/api/agent/people/__tests__/route.test.ts` (new)
  - **Run:** `pnpm --filter business-os test -- --testPathPattern="agent/people"`
- **Planning validation:**
  - Tests run: reviewed `current-user.ts` (3 users: pete, cristiana, avery with id/name/email/role)
  - Test stubs written: N/A (S effort)
  - Unexpected findings: No `docs/business-os/people/` directory exists. No `users.json` file either. Phase 0 people endpoint will read solely from `USERS` in `current-user.ts`. Rich profiles deferred.
- **Rollout / rollback:**
  - Rollout: New route file. Available immediately on deploy.
  - Rollback: Delete route file. No dependencies broken.
- **Documentation impact:** None
- **Notes / references:**
  - Data source: `USERS` from `apps/business-os/src/lib/current-user.ts` (lines 23-42)
  - Pattern: same as TASK-01 but reads from `USERS` record instead of `BUSINESSES` array
  - `Person` type: define inline in route file (or in `types.ts` if cleaner). Fields: `id`, `name`, `role`, `capacity: { maxActiveWip: number }`, `skills?: string[]`, `focusAreas?: string[]`
  - No D1 access needed — reads from in-memory data only

#### Build Completion (2026-02-06)
- **Status:** Complete
- **Commits:** efaf3bb20e (bundled with concurrent session)
- **TDD cycle:**
  - Test cases executed: TC-01, TC-02, TC-03
  - Red-green cycles: 1 (ideal)
  - Initial test run: FAIL (expected — route not implemented)
  - Post-implementation: PASS
- **Confidence reassessment:**
  - Original: 88%
  - Post-test: 88%
  - Delta reason: Tests validated assumptions — `Person` type with default capacity worked cleanly
- **Validation:**
  - Ran: `npx jest --testPathPattern="agent/people"` — PASS (3 tests, 3 passed)
- **Documentation updated:** None required
- **Implementation notes:** `Person` type defined inline in route file. Maps `USERS` record to `Person[]` with `capacity.maxActiveWip: 3` default. Optional `skills` and `focusAreas` fields available for future enrichment.

---

### TASK-03: Write `/kanban-sweep` SKILL.md

- **Type:** IMPLEMENT
- **Affects:**
  - `.claude/skills/kanban-sweep/SKILL.md` (new)
  - `[readonly] ~/Downloads/kanban-sweep-agent-draft/constitution.md`
  - `[readonly] ~/Downloads/kanban-sweep-agent-draft/playbooks/scoring_rubric.md`
  - `[readonly] ~/Downloads/kanban-sweep-agent-draft/playbooks/bottleneck_selection.md`
  - `[readonly] ~/Downloads/kanban-sweep-agent-draft/playbooks/deletion_first.md`
  - `[readonly] ~/Downloads/kanban-sweep-agent-draft/evaluation/rubric.md`
  - `[readonly] ~/Downloads/kanban-sweep-agent-draft/evaluation/red_flags.md`
  - `[readonly] ~/Downloads/kanban-sweep-agent-draft/templates/sweep_report_template.md`
  - `[readonly] ~/Downloads/kanban-sweep-agent-draft/templates/bottleneck_brief_template.md`
  - `[readonly] ~/Downloads/kanban-sweep-agent-draft/templates/idea_card_template.md`
  - `[readonly] .claude/skills/scan-repo/SKILL.md`
  - `[readonly] .claude/skills/propose-lane-move/SKILL.md`
- **Depends on:** TASK-01, TASK-02 (SKILL.md references both endpoints in its workflow)
- **Effort:** M (1 file, but substantial content: ~400-600 lines. Crosses 0 integration boundaries. Introduces a new pattern (sweep/bottleneck diagnosis) but adapts existing skill conventions. No external dependencies. No data model changes. Unit test layer only needed for validation — but prompt-only skill means no unit-testable code.)
- **Confidence:** 85%
  - Implementation: 88% — Skill convention is well-established (29 examples). Draft pack provides comprehensive structure to adapt. All spec-level questions resolved. The main implementation risk is getting the prompt instructions precise enough that the agent consistently follows the workflow and produces high-quality output.
  - Approach: 88% — Single-skill approach clearly right. Constitution invariants, scoring rubric, and bottleneck categories are well-defined. Delete > Simplify > Accelerate > Automate preference ordering decided. Confidence thresholds decided (0-10 numeric with evidence gaps when <7).
  - Impact: 80% — Skill is self-contained (no existing code changes beyond the 2 new endpoints). Risk is that bottleneck diagnosis may be weak with limited data (no throughput metrics, only 1 user in Phase 0). Mitigated by: evaluation rubric for quality assessment, reflection section for iterative improvement.
- **Acceptance:**
  - SKILL.md exists at `.claude/skills/kanban-sweep/SKILL.md` with standard frontmatter (`name: kanban-sweep`, `description: ...`)
  - Operating Mode section declares `**READ-ONLY ANALYSIS**` (default) and `**+ DRAFT IDEAS**` (with `--create-ideas`)
  - Inputs section documents optional `--create-ideas` flag
  - Workflow section contains all 8 steps: (1) Ingest snapshot via API, (2) Compute flow signals, (3) Diagnose bottleneck, (4) Generate ideas, (5) Score and rank, (6) Design experiments, (7) Assemble report, (8) Reflect on previous sweep
  - Constitution invariants embedded (8 invariants from draft pack)
  - Scoring rubric embedded with formula: `Priority = (Impact × Confidence × Time-to-signal) / (Effort × (1 + Risk))`
  - 7 bottleneck categories listed with diagnostic signals
  - Evaluation rubric embedded (6 dimensions, 0-5 each, total /30)
  - 7 red flags listed as guardrails
  - Sweep report template embedded with YAML frontmatter
  - Edge cases section (4+ cases)
  - Integration with other skills section (references `/work-idea`, `/fact-find`, `/propose-lane-move`, `/scan-repo`)
  - Phase 0 constraints section
  - Completion messages section
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: SKILL.md parses as valid markdown with YAML frontmatter containing `name` and `description`
    - TC-02: SKILL.md contains Operating Mode section with "READ-ONLY ANALYSIS" and "DRAFT IDEAS" modes
    - TC-03: SKILL.md workflow section references all 6 agent API endpoints (businesses, people, cards, ideas ×2, stage-docs)
    - TC-04: SKILL.md contains scoring formula `Priority = (Impact × Confidence × Time-to-signal) / (Effort × (1 + Risk))`
    - TC-05: SKILL.md contains all 7 bottleneck categories
    - TC-06: SKILL.md contains sweep report template with YAML frontmatter
    - TC-07: SKILL.md contains all 8 constitution invariants
    - TC-08: SKILL.md contains evaluation rubric (6 dimensions)
  - **Acceptance coverage:** TC-01→frontmatter; TC-02→operating mode; TC-03→workflow API calls; TC-04→scoring rubric; TC-05→bottleneck categories; TC-06→report template; TC-07→constitution; TC-08→evaluation
  - **Test type:** manual validation (prompt-only skill, no executable code to unit test)
  - **Test location:** Manual review checklist — verify against acceptance criteria after writing
  - **Run:** Manual: read the file and verify each acceptance criterion
- **Planning validation:**
  - Tests run: Read 4 existing SKILL.md files (`scan-repo`, `propose-lane-move`, `session-reflect`, `work-idea`) to confirm conventions. Read 9 draft pack files (constitution, 3 playbooks, 2 evaluation files, 3 templates) to confirm source material.
  - Test stubs written: N/A (no executable code — prompt-only skill)
  - Unexpected findings: None. All conventions are consistent across existing skills.
- **What would make this ≥90%:**
  - Run the prototype sweep (TASK-05) and confirm the agent follows the SKILL.md instructions consistently
  - Verify bottleneck diagnosis produces actionable insights on the current board state
  - Get Pete's feedback on the first sweep report
- **Rollout / rollback:**
  - Rollout: New skill directory. Available immediately for `/kanban-sweep` invocation.
  - Rollback: Delete `.claude/skills/kanban-sweep/` directory.
- **Documentation impact:** None (SKILL.md is self-documenting)
- **Notes / references:**
  - Convention source: `.claude/skills/scan-repo/SKILL.md` (closest analogue — reads BoS, generates ideas)
  - Draft pack sources: `~/Downloads/kanban-sweep-agent-draft/` (constitution, playbooks, evaluation, templates)
  - Fact-find "keep vs drop" table: `docs/plans/kanban-sweep-agent-fact-find.md` lines 114-131
  - Key design decisions (all resolved in fact-find):
    - Portfolio-wide scope with per-business sections
    - Single-file output at `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`
    - Opt-in idea creation via `--create-ideas` flag
    - Confidence thresholds: <4 discovery, 4-6 weak, 7-8 solid, 9-10 strong
    - Max confidence 6/10 for throughput-based diagnoses
    - Default capacity: 3 active WIP per person
    - Previous sweep located by most-recent filename date sort
    - Skill invocations suggested in every recommendation

#### Build Completion (2026-02-06)
- **Status:** Complete
- **Commits:** efaf3bb20e (bundled with concurrent session)
- **TDD cycle:**
  - Test cases executed: TC-01 through TC-08 (manual validation)
  - Red-green cycles: 1
  - Manual review: all 8 acceptance criteria verified present
- **Confidence reassessment:**
  - Original: 85%
  - Post-test: 87%
  - Delta reason: All draft pack content adapted successfully; 625-line SKILL.md covers all required sections
- **Validation:**
  - Manual checklist: TC-01 PASS (frontmatter), TC-02 PASS (operating mode), TC-03 PASS (6 API endpoints), TC-04 PASS (scoring formula), TC-05 PASS (7 bottleneck categories), TC-06 PASS (report template with frontmatter), TC-07 PASS (8 constitution invariants), TC-08 PASS (6 evaluation dimensions)
- **Documentation updated:** None required (SKILL.md is self-documenting)
- **Implementation notes:** 625-line SKILL.md adapts constitution (8 invariants), scoring rubric (formula + thresholds), 7 bottleneck categories, evaluation rubric (6 dimensions), 7 red flags, sweep report template with YAML frontmatter, 8-step workflow, edge cases, integration table, Phase 0 constraints. Drops: multi-skill structure, JSON schemas, role prompts, glossary.

---

### TASK-04: Create `docs/business-os/sweeps/` directory

- **Type:** IMPLEMENT
- **Affects:**
  - `docs/business-os/sweeps/.gitkeep` (new)
- **Depends on:** -
- **Effort:** S (1 file, trivial)
- **Confidence:** 98%
  - Implementation: 99% — Create directory + `.gitkeep`. Trivial.
  - Approach: 98% — Follows existing pattern (`docs/business-os/scans/` exists for scan output).
  - Impact: 98% — No existing code affected.
- **Acceptance:**
  - `docs/business-os/sweeps/` directory exists
  - `.gitkeep` file present so git tracks the empty directory
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Directory `docs/business-os/sweeps/` exists after task completion
    - TC-02: `.gitkeep` file exists in the directory
  - **Acceptance coverage:** TC-01→directory exists; TC-02→gitkeep present
  - **Test type:** manual (filesystem check)
  - **Test location:** N/A
  - **Run:** `ls -la docs/business-os/sweeps/`
- **Planning validation:**
  - Tests run: confirmed `docs/business-os/scans/` exists as precedent
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Committed with the skill. No deploy needed.
  - Rollback: `rm -rf docs/business-os/sweeps/`
- **Documentation impact:** None
- **Notes / references:**
  - Precedent: `docs/business-os/scans/` directory for scan output

#### Build Completion (2026-02-06)
- **Status:** Complete
- **Commits:** efaf3bb20e (bundled with concurrent session)
- **Validation:**
  - Ran: `ls -la docs/business-os/sweeps/` — `.gitkeep` present
- **Implementation notes:** Directory created with `.gitkeep`. Trivial.

---

### TASK-05: Run prototype sweep and validate output

- **Type:** IMPLEMENT
- **Affects:**
  - `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md` (new, generated by sweep)
  - `[readonly] .claude/skills/kanban-sweep/SKILL.md`
  - `[readonly] apps/business-os/src/app/api/agent/businesses/route.ts`
  - `[readonly] apps/business-os/src/app/api/agent/people/route.ts`
- **Depends on:** TASK-03, TASK-04
- **Effort:** M (no code changes, but requires running the Business OS API locally, invoking the sweep skill, and evaluating output against the 6-dimension rubric. Crosses 1 integration boundary: skill ↔ live API.)
- **Confidence:** 80%
  - Implementation: 82% — Invoking `/kanban-sweep` is straightforward. The main risk is whether the Business OS API will be running locally when this task is attempted (it wasn't during the fact-find session).
  - Approach: 82% — Evaluate using the embedded 6-dimension rubric (constraint quality, actionability, deletion-first bias, measurement discipline, flow literacy, people/system framing). Score 0-5 per dimension, total /30. Threshold: ≥18/30 for Phase 0 acceptance.
  - Impact: 78% — If the prototype reveals the SKILL.md instructions are inadequate, TASK-03 needs revision. This is expected and healthy — the prototype is a validation step.
- **Acceptance:**
  - Sweep report generated at `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`
  - Report contains YAML frontmatter with required fields (Type, Date, Previous-Sweep, Bottleneck-Category, Bottleneck-Confidence)
  - Report contains all required sections (executive summary, snapshot overview, flow signals, primary bottleneck, per-business breakdown, ranked interventions with scores, experiments, governance, next actions with skill invocations)
  - Evaluation rubric score ≥18/30
  - Bottleneck diagnosis cites specific evidence from the snapshot (not vague claims)
  - At least one recommendation follows Delete > Simplify preference ordering
  - At least one next-action suggests a concrete skill invocation
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Sweep report file exists at expected path with valid YAML frontmatter
    - TC-02: Report contains all required sections (exec summary, snapshot, flow signals, bottleneck, interventions, experiments, governance, next actions)
    - TC-03: Bottleneck diagnosis includes evidence bullets and numeric confidence (0-10)
    - TC-04: Interventions are scored using the rubric formula and ranked by priority
    - TC-05: At least one recommendation suggests a concrete skill invocation
    - TC-06: Evaluation rubric total ≥18/30 across 6 dimensions
    - TC-07: No red flags triggered (no hallucinated metrics, no "work harder" recommendations, no unprioritized >10 ideas)
  - **Acceptance coverage:** TC-01→file+frontmatter; TC-02→sections; TC-03→bottleneck quality; TC-04→scoring; TC-05→skill invocations; TC-06→overall quality; TC-07→guardrails
  - **Test type:** manual validation (human review of generated output)
  - **Test location:** N/A
  - **Run:** Invoke `/kanban-sweep` then manually review output
- **Planning validation:**
  - Tests run: N/A (requires live API — cannot validate during planning)
  - Test stubs written: N/A (M effort, manual validation)
  - Unexpected findings: Business OS API was not running locally during fact-find. Must ensure it's running before attempting this task.
- **What would make this ≥90%:**
  - Successful prototype with score ≥22/30
  - Pete confirms the bottleneck diagnosis matches his intuition
  - At least 2 of the top-3 recommendations are actionable without modification
- **Rollout / rollback:**
  - Rollout: Prototype output is a documentation artifact. No deploy implications.
  - Rollback: Delete the generated sweep report file.
- **Documentation impact:** None (the sweep report IS the documentation artifact)
- **Notes / references:**
  - Requires Business OS API running locally: `pnpm --filter business-os dev`
  - Evaluation rubric dimensions: constraint quality (0-5), actionability (0-5), deletion-first bias (0-5), measurement discipline (0-5), flow literacy (0-5), people/system framing (0-5)
  - Red flags to check: >10 unprioritized ideas, recommends without naming constraint, invents metrics not in snapshot, suggests "work harder", proposes risky changes without rollback
  - If score <18/30: iterate on SKILL.md (TASK-03) and re-run

## Risks & Mitigations

- **Bottleneck diagnosis may be weak with limited data (no throughput metrics, 1 user):** Mitigated by capping throughput-based confidence at 6/10, using proxy metrics (aging, WIP, blocked ratio), and requiring evidence citations. The evaluation rubric catches vague diagnoses (constraint quality dimension).
- **Agent may not consistently follow SKILL.md instructions:** Mitigated by TASK-05 prototype validation. If the agent deviates, the SKILL.md gets refined iteratively. This is expected for prompt-only skills.
- **Business OS API may not be running locally for TASK-05:** Mitigated by documenting the prerequisite (`pnpm --filter business-os dev`). If API is unavailable, TASK-05 is blocked but TASK-01-04 can still proceed.
- **`BUSINESSES` array drift (3 entries) vs `businesses.json` (4 entries):** Pre-existing issue (BOS-D1-08). Endpoint uses `BUSINESSES` array for consistency with existing routes. PIPE business will appear when BOS-D1-08 is resolved.
- **Scoring rubric may need calibration after first real sweep:** Expected. The rubric formula is preserved as an invariant, but score distributions may reveal that certain dimensions need re-weighting. Addressed via the reflection step in the sweep workflow.

## Observability

- Logging: Sweep reports are self-documenting markdown artifacts with timestamps, evidence citations, and confidence scores
- Metrics: Evaluation rubric score (0-30) per sweep. Tracked via `Previous-Sweep` frontmatter reference for trend comparison.
- Alerts/Dashboards: Not applicable for Phase 0 (manual invocation)

## Acceptance Criteria (overall)

- [ ] `GET /api/agent/businesses` returns business catalog with auth + status filter
- [ ] `GET /api/agent/people` returns people profiles with default capacity
- [ ] `/kanban-sweep` skill exists and follows repo conventions
- [ ] Sweep report template includes all required sections
- [ ] Prototype sweep produces a report scoring ≥18/30 on evaluation rubric
- [ ] No regressions in existing agent API tests

## Decision Log

- 2026-02-06: Businesses endpoint reads from `BUSINESSES` array (not `businesses.json`) — consistent with existing route validation pattern. PIPE business missing is pre-existing BOS-D1-08 issue.
- 2026-02-06: People endpoint defines `Person` response type inline rather than adding to shared `types.ts` — keeps the type close to its only consumer and avoids touching shared types for a Phase 0 feature.
- 2026-02-06: TASK-01 and TASK-02 do NOT mock D1 in tests — these endpoints read from in-memory data, not the database. Simpler test setup than cards/ideas.
- 2026-02-06: TASK-03 effort classified as M (not L) — single file creation, but substantial content. No integration boundaries crossed. No executable code to unit test. Manual validation via checklist.
- 2026-02-06: TASK-05 confidence at 80% (threshold) — depends on live API availability and agent behavior consistency. Both are external factors outside the plan's control.
