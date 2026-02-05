---
Type: Plan
Status: Historical
Domain: Agents / Business OS
Created: 2026-02-01
Last-updated: 2026-02-02
Feature-Slug: business-os-skill-integration
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

# Business OS Skill Integration Plan

## Summary

Integrate Business OS card lifecycle management into the `/fact-find`, `/plan-feature`, and `/build-feature` skills so that completing work through these skills automatically creates and updates Business OS cards. Currently, running the feature workflow produces artifacts in `docs/plans/` but the Business OS kanboard remains stale. This integration bridges the gap by:

1. Enabling automatic card creation when `/fact-find` completes (with Business-Unit context)
2. Creating stage documents when `/plan-feature` completes and proposing lane transitions
3. Tracking task progress when `/build-feature` executes

The integration is opt-in (via frontmatter) and backward compatible.

## Goals

- Automatic Business OS card creation when `/fact-find` completes with Business-Unit context
- Automatic stage document creation when `/plan-feature` completes
- Automatic card progress tracking when `/build-feature` executes
- Idempotent operation (running skills multiple times does not duplicate cards)
- Reuse existing patterns from `/work-idea` and `/propose-lane-move`

## Non-goals

- Redesigning Business OS structure (cards/, ideas/, agent-workflows.md, charter)
- Changing existing card frontmatter schemas
- Breaking existing skill workflows (skills must work without Business OS context)
- Making Business OS integration mandatory (opt-in approach)
- Changing existing plan document templates/formats

## Constraints & Assumptions

- Constraints:
  - Must work with existing Business OS structure (`docs/business-os/cards/`, `docs/business-os/ideas/`)
  - Must reuse existing skills where possible (`/work-idea` patterns, `/propose-lane-move`)
  - Must not break existing skill workflows (backward compatible)
  - Must follow dual-audience pattern (`.user.md` + `.agent.md` for cards, single `.user.md` for stage docs)
  - Phase 0 constraints apply: Pete-supervised, agent identity for commits
- Assumptions:
  - Plan documents in `docs/plans/` and Business OS cards serve complementary purposes
  - Existing skills can be extended with optional Business OS integration hooks
  - ID allocation uses the existing `IDAllocator` class from MVP-C2

## Fact-Find Reference

- Related brief: `docs/plans/business-os-skill-integration-fact-find.md`
- Key findings:
  - `/work-idea` skill provides complete card creation pattern (lines 62-323)
  - `/propose-lane-move` provides lane transition pattern (lines 79-122)
  - Card ID format: `<BUSINESS>-<TYPE>-<SEQUENCE>` (e.g., `BRIK-ENG-0020`)
  - `IDAllocator` class exists at `apps/business-os/src/lib/repo/IDAllocator.ts` for collision-proof ID allocation
  - Stage docs follow `Type: Stage-Doc`, `Card-ID`, `Stage` frontmatter pattern
  - Plan docs can reference cards via `Card-ID` in frontmatter

## Existing System Notes

- Key modules/files:
  - `.claude/skills/fact-find/SKILL.md` (436 lines) - produces fact-find briefs
  - `.claude/skills/plan-feature/SKILL.md` (446 lines) - creates implementation plans
  - `.claude/skills/build-feature/SKILL.md` (308 lines) - implements tasks with TDD
  - `.claude/skills/work-idea/SKILL.md` (414 lines) - card creation pattern to reuse
  - `.claude/skills/propose-lane-move/SKILL.md` (214 lines) - lane transition pattern
  - `apps/business-os/src/lib/repo/IDAllocator.ts` (159 lines) - collision-proof ID allocation
  - `docs/business-os/agent-workflows.md` (331 lines) - workflow guide

- Patterns to follow:
  - Card creation: See `/work-idea` SKILL.md lines 188-254 for card file templates
  - Stage doc creation: See `/work-idea` SKILL.md lines 256-299 for stage doc template
  - Lane transition proposal: See `/propose-lane-move` SKILL.md lines 79-122
  - Dual-audience files: `.user.md` (human-readable) + `.agent.md` (LLM-optimized) for cards

## Proposed Approach

### Option A: Opt-in via Frontmatter + Skill Extensions (CHOSEN)

Extend existing skill instructions with optional Business OS integration hooks:
- Add `Card-ID` and `Business-Unit` to plan doc frontmatter schema
- Skills check frontmatter and create/update cards if Business-Unit is present
- Card-ID is auto-generated if missing but Business-Unit is provided
- Skills work unchanged if no Business OS context provided

**Trade-offs:**
- Pros: Minimal invasiveness, backward compatible, follows existing patterns
- Cons: Requires frontmatter additions, opt-in means not automatic by default

### Option B: New Wrapper Skills

Create `/fact-find-with-card`, `/plan-feature-with-card`, etc.

**Trade-offs:**
- Pros: Clean separation, no changes to existing skills
- Cons: Higher maintenance burden, more indirection, skill discovery friction

**Chosen: Option A** - Less invasive, backward compatible, aligns with progressive enhancement philosophy.

## Decision Log

### BOS-D01: Card ID Allocation Strategy (2026-02-01)
- **Options:** (A) User-provided, (B) Auto-generate via IDAllocator, (C) Sequential scan
- **Chosen:** Option B - Auto-generate via `IDAllocator` when Business-Unit is provided
- **Rationale:** `IDAllocator` exists and provides collision-proof IDs; reduces manual work; aligns with MVP-C2 infrastructure

### BOS-D02: Business Unit Inference (2026-02-01)
- **Options:** (A) Require explicit in frontmatter, (B) Infer from code paths, (C) Ask user
- **Chosen:** Option A - Require explicit `Business-Unit` in frontmatter
- **Rationale:** Clear opt-in signal, no ambiguity, code path inference is fragile; future enhancement can add inference

### BOS-D03: Opt-in vs Opt-out (2026-02-01)
- **Options:** (A) Opt-in (requires Business-Unit), (B) Opt-out (flag to disable), (C) Always-on
- **Chosen:** Option A - Opt-in via `Business-Unit` in frontmatter
- **Rationale:** Backward compatible, no surprises, allows gradual adoption

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| BOS-101 | IMPLEMENT | Add Business OS frontmatter schema to plan docs | 90% | S | Complete | - |
| BOS-102 | IMPLEMENT | Create card creation helper module | 85% | M | Complete | BOS-101 |
| BOS-103 | IMPLEMENT | Create stage doc creation helper module | 85% | M | Complete | BOS-101 |
| BOS-104 | IMPLEMENT | Extend /fact-find with card creation hook | 82% | M | Complete | BOS-102, BOS-103 |
| BOS-105 | IMPLEMENT | Add idempotency checks for card operations | 88% | S | Complete | BOS-102 |
| BOS-106 | IMPLEMENT | Extend /plan-feature with planned stage doc creation | 82% | M | Complete | BOS-103 |
| BOS-107 | IMPLEMENT | Add lane transition proposal after /plan-feature | 85% | S | Complete | BOS-106 |
| BOS-108 | IMPLEMENT | Extend /build-feature with task progress tracking | 80% | M | Complete | BOS-103 |
| BOS-109 | IMPLEMENT | Add lane transition to Done after all tasks complete | 82% | S | Complete | BOS-108 |
| BOS-110 | IMPLEMENT | Update skill documentation with Business OS integration | 88% | S | Complete | BOS-104, BOS-106, BOS-108 |
| BOS-111 | INVESTIGATE | Validate IDAllocator integration for card creation | 80% | S | Complete | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Tasks

### BOS-101: Add Business OS frontmatter schema to plan docs
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-02)
- **Affects:** `.claude/skills/fact-find/SKILL.md`, `.claude/skills/plan-feature/SKILL.md`
- **Depends on:** -
- **Confidence:** 90%
  - Implementation: 95% - Simple frontmatter additions to existing templates
  - Approach: 90% - Follows established frontmatter pattern in plan docs
  - Impact: 85% - Only affects new plans; existing plans unaffected
- **Acceptance:**
  - [x] Fact-find brief template includes optional `Business-Unit` and `Card-ID` fields
  - [x] Plan doc template includes optional `Business-Unit` and `Card-ID` fields
  - [x] Documentation explains when to use these fields
  - [x] Existing plans without these fields continue to work
- **Test plan:**
  - Add/Update: N/A (documentation changes only)
  - Run: Manual validation that templates render correctly
- **Planning validation:**
  - Tests run: N/A (S-effort documentation task)
  - Test stubs written: N/A
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Direct commit; additive change
  - Rollback: Revert commit
- **Documentation impact:**
  - Update: `.claude/skills/fact-find/SKILL.md` (Brief Template section)
  - Update: `.claude/skills/plan-feature/SKILL.md` (Plan Template section)
- **Implementation notes (2026-02-02):**
  - Added `Business-Unit` and `Card-ID` to fact-find brief template (line 177)
  - Added `Business-Unit` and `Card-ID` to plan doc template (line 280)
  - Added "Business OS Integration (Optional)" documentation section to both skills
  - Documentation explains when to use, how it works, business unit codes, and backward compatibility
- **Notes / references:**
  - Pattern: Existing frontmatter fields like `Feature-Slug`, `Related-Plan`

---

### BOS-102: Create card creation helper module
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-02)
- **Affects:** `.claude/skills/_shared/` (new directory), `.claude/skills/work-idea/SKILL.md` (reference)
- **Depends on:** BOS-101
- **Confidence:** 85%
  - Implementation: 90% - Pattern exists in `/work-idea` SKILL.md lines 188-254
  - Approach: 85% - Shared module approach aligns with DRY principles
  - Impact: 80% - New module; `/work-idea` can reference it but is not required to change
- **Acceptance:**
  - [x] Shared helper documented in `.claude/skills/_shared/card-operations.md`
  - [x] Helper describes: card file structure, frontmatter requirements, ID allocation pattern
  - [x] Helper includes: step-by-step instructions for card creation
  - [x] Helper uses scan-based ID allocation (per BOS-111 findings)
- **Test plan:**
  - Add/Update: N/A (skill instruction documentation)
  - Run: Manual validation that instructions are complete and correct
- **Planning validation:**
  - Tests run: Reviewed `/work-idea` SKILL.md lines 62-323 for card creation pattern
  - Test stubs written: N/A (M-effort, but documentation-only change)
  - Unexpected findings: None - pattern is well-defined
- **What would make this >=90%:**
  - Test the helper instructions manually by creating a card following the steps
- **Rollout / rollback:**
  - Rollout: Direct commit; new file
  - Rollback: Delete file
- **Documentation impact:**
  - Create: `.claude/skills/_shared/card-operations.md`
- **Implementation notes (2026-02-02):**
  - Created `.claude/skills/_shared/` directory
  - Created comprehensive card-operations.md helper (250+ lines)
  - Used scan-based ID allocation (per BOS-111 findings) instead of IDAllocator
  - Documented: ID format, allocation algorithm, file structure, templates, idempotency, integration points
- **Notes / references:**
  - Pattern source: `.claude/skills/work-idea/SKILL.md` lines 188-254
  - ID allocation: Scan-based (BOS-111 found IDAllocator format mismatch)

---

### BOS-103: Create stage doc creation helper module
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-02)
- **Affects:** `.claude/skills/_shared/` (new directory)
- **Depends on:** BOS-101
- **Confidence:** 85%
  - Implementation: 90% - Pattern exists in `/work-idea` SKILL.md lines 256-299
  - Approach: 85% - Shared module approach aligns with DRY principles
  - Impact: 80% - New module; independent of existing skills
- **Acceptance:**
  - [x] Shared helper documented in `.claude/skills/_shared/stage-doc-operations.md`
  - [x] Helper describes: stage doc file structure, frontmatter requirements, stage types
  - [x] Helper includes: templates for fact-finding, planned, build, reflect stage docs
  - [x] Stage types match `StageType` enum: `fact-find | plan | build | reflect`
- **Test plan:**
  - Add/Update: N/A (skill instruction documentation)
  - Run: Manual validation that instructions are complete and correct
- **Planning validation:**
  - Tests run: Reviewed `/work-idea` SKILL.md lines 256-299 for stage doc pattern
  - Test stubs written: N/A (M-effort, but documentation-only change)
  - Unexpected findings: None - pattern is well-defined
- **What would make this >=90%:**
  - Test the helper instructions manually by creating a stage doc following the steps
- **Rollout / rollback:**
  - Rollout: Direct commit; new file
  - Rollback: Delete file
- **Documentation impact:**
  - Create: `.claude/skills/_shared/stage-doc-operations.md`
- **Implementation notes (2026-02-02):**
  - Created comprehensive stage-doc-operations.md helper (280+ lines)
  - Documented all 4 stage types: fact-find, plan, build, reflect
  - Included templates for each stage type
  - Added evidence type reference table
  - Documented integration with /fact-find, /plan-feature, /build-feature skills
- **Notes / references:**
  - Pattern source: `.claude/skills/work-idea/SKILL.md` lines 256-299
  - Stage types: `apps/business-os/src/lib/types.ts` line 91

---

### BOS-104: Extend /fact-find with card creation hook
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-02)
- **Affects:** `.claude/skills/fact-find/SKILL.md`
- **Depends on:** BOS-102, BOS-103
- **Confidence:** 82%
  - Implementation: 85% - Clear pattern from `/work-idea`; extension is straightforward
  - Approach: 82% - Optional hook approach maintains backward compatibility
  - Impact: 80% - Only affects `/fact-find`; other skills unaffected
- **Acceptance:**
  - [x] `/fact-find` checks for `Business-Unit` in user input or existing brief
  - [x] If `Business-Unit` present and no `Card-ID` exists:
    - Create card using helper from BOS-102 with `Lane: Fact-finding`
    - Create fact-finding stage doc using helper from BOS-103
    - Add `Card-ID` to brief frontmatter
  - [x] If `Card-ID` already exists, create/update stage doc only
  - [x] Completion message includes card ID when created
  - [x] Skills continue to work without Business-Unit (backward compatible)
- **Test plan:**
  - Add/Update: N/A (skill instruction modification)
  - Run: Manual test by running `/fact-find` with and without `Business-Unit`
- **Planning validation:**
  - Tests run: Reviewed `/fact-find` SKILL.md completion flow (lines 429-435)
  - Test stubs written: N/A (M-effort, but documentation-only change)
  - Unexpected findings: None
- **What would make this >=90%:**
  - Actually run `/fact-find` with Business-Unit and verify card + stage doc creation
- **Rollout / rollback:**
  - Rollout: Direct commit; additive section in skill file
  - Rollback: Remove the Business OS integration section
- **Documentation impact:**
  - Update: `.claude/skills/fact-find/SKILL.md` (add Business OS integration section)
- **Implementation notes (2026-02-02):**
  - Expanded Business OS Integration section with full 6-step workflow
  - Added card creation templates (user.md + agent.md)
  - Added stage doc creation instructions
  - Added completion messages for both new card and existing card cases
  - References shared helpers from BOS-102 and BOS-103
  - Update: `docs/business-os/agent-workflows.md` (reference new integration)
- **Notes / references:**
  - Integration point: After "Persist the brief" step in Outcome A workflow
  - Pattern: `/work-idea` card + stage doc creation

---

### BOS-105: Add idempotency checks for card operations
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-02)
- **Affects:** `.claude/skills/_shared/card-operations.md`
- **Depends on:** BOS-102
- **Confidence:** 88%
  - Implementation: 90% - Check for existing card by ID or feature-slug before creation
  - Approach: 88% - Standard idempotency pattern
  - Impact: 85% - Prevents duplicate cards; no negative side effects
- **Acceptance:**
  - [x] Helper includes idempotency check: scan `docs/business-os/cards/` for existing card
  - [x] Check by `Card-ID` if provided in frontmatter
  - [x] Check by `Feature-Slug` match if no `Card-ID` (secondary fallback)
  - [x] If card exists, return existing card ID instead of creating duplicate
  - [x] Log message indicates "Using existing card" vs "Created new card"
- **Test plan:**
  - Add/Update: N/A (skill instruction modification)
  - Run: Manual test by running card creation twice with same context
- **Planning validation:**
  - Tests run: N/A (S-effort)
  - Test stubs written: N/A
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Direct commit; additive section in helper
  - Rollback: Remove the idempotency check section
- **Documentation impact:**
  - Update: `.claude/skills/_shared/card-operations.md`
- **Implementation notes (2026-02-02):**
  - Enhanced idempotency section with full algorithm
  - Added bash scripts for Card-ID check, Feature-Slug fallback, and combined check
  - Added skill integration notes for /fact-find, /plan-feature, /build-feature
- **Notes / references:**
  - Edge case in `/work-idea`: SKILL.md lines 335-339

---

### BOS-106: Extend /plan-feature with planned stage doc creation
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-02)
- **Affects:** `.claude/skills/plan-feature/SKILL.md`
- **Depends on:** BOS-103
- **Confidence:** 82%
  - Implementation: 85% - Clear pattern; uses stage doc helper
  - Approach: 82% - Optional hook maintains backward compatibility
  - Impact: 80% - Only affects `/plan-feature`; other skills unaffected
- **Acceptance:**
  - [x] `/plan-feature` checks for `Card-ID` in fact-find brief or plan frontmatter
  - [x] If `Card-ID` present:
    - Create planned stage doc using helper from BOS-103
    - Stage doc links to plan file path
    - Update card frontmatter with `Plan-Confidence` and `Plan-Link`
  - [x] If no `Card-ID`, skill works unchanged
  - [x] Completion message notes stage doc creation
- **Test plan:**
  - Add/Update: N/A (skill instruction modification)
  - Run: Manual test by running `/plan-feature` with and without `Card-ID`
- **Planning validation:**
  - Tests run: Reviewed `/plan-feature` SKILL.md completion flow (lines 439-445)
  - Test stubs written: N/A (M-effort, but documentation-only change)
  - Unexpected findings: None
- **What would make this >=90%:**
  - Actually run `/plan-feature` with Card-ID and verify stage doc creation
- **Implementation notes (2026-02-02):**
  - Expanded Business OS Integration section with full 4-step workflow
  - Added planned stage doc template with task summary table
  - Added card frontmatter update instructions
  - Added completion messages for with/without threshold blockers
  - Suggests lane transition to Planned
- **Rollout / rollback:**
  - Rollout: Direct commit; additive section in skill file
  - Rollback: Remove the Business OS integration section
- **Documentation impact:**
  - Update: `.claude/skills/plan-feature/SKILL.md` (add Business OS integration section)
  - Update: `docs/business-os/agent-workflows.md` (reference new integration)
- **Notes / references:**
  - Integration point: After "Persist the plan doc" step in workflow
  - Pattern: Stage doc creation from BOS-103

---

### BOS-107: Add lane transition proposal after /plan-feature
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-02)
- **Affects:** `.claude/skills/plan-feature/SKILL.md`
- **Depends on:** BOS-106
- **Confidence:** 85%
  - Implementation: 90% - Pattern exists in `/propose-lane-move` SKILL.md
  - Approach: 85% - Reuses existing proposal mechanism
  - Impact: 80% - Only affects `/plan-feature` completion message
- **Acceptance:**
  - [x] After planned stage doc is created, skill suggests lane transition
  - [x] Proposal: `Fact-finding -> Planned`
  - [x] Evidence cited: planned stage doc exists, plan doc with acceptance criteria
  - [x] Skill instructions reference `/propose-lane-move` for formal proposal
  - [x] Alternative: Inline proposal (set `Proposed-Lane: Planned` in card frontmatter)
- **Test plan:**
  - Add/Update: N/A (skill instruction modification)
  - Run: Manual test by running `/plan-feature` with Card-ID
- **Planning validation:**
  - Tests run: N/A (S-effort)
  - Test stubs written: N/A
  - Unexpected findings: None
- **Implementation notes (2026-02-02):**
  - Added Step 4 with lane transition proposal options
  - Option A: /propose-lane-move command (recommended)
  - Option B: Inline Proposed-Lane frontmatter
  - Evidence requirements documented
  - Guard: only propose if all tasks >=80%
- **Rollout / rollback:**
  - Rollout: Direct commit; additive step in skill workflow
  - Rollback: Remove the lane proposal step
- **Documentation impact:**
  - Update: `.claude/skills/plan-feature/SKILL.md`
- **Notes / references:**
  - Lane transition criteria: `docs/business-os/agent-workflows.md` lines 69-74
  - Pattern: `/propose-lane-move` SKILL.md lines 39-45

---

### BOS-108: Extend /build-feature with task progress tracking
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-02)
- **Affects:** `.claude/skills/build-feature/SKILL.md`
- **Depends on:** BOS-103
- **Confidence:** 80%
  - Implementation: 82% - Clear pattern; update card with progress info
  - Approach: 80% - Progress tracking is straightforward but adds complexity to build loop
  - Impact: 78% - Affects build loop; must not interfere with core build functionality
- **Acceptance:**
  - [x] `/build-feature` checks for `Card-ID` in plan frontmatter
  - [x] If `Card-ID` present:
    - After each task completion, update card's `Last-Progress` field with date
    - Optionally update card body with task completion status
    - Create build stage doc if not exists (first task)
  - [x] If no `Card-ID`, skill works unchanged
  - [x] Build loop remains unaffected for core functionality
- **Test plan:**
  - Add/Update: N/A (skill instruction modification)
  - Run: Manual test by running `/build-feature` with and without `Card-ID`
- **Planning validation:**
  - Tests run: Reviewed `/build-feature` SKILL.md build loop (lines 81-246)
  - Test stubs written: N/A (M-effort, but documentation-only change)
  - Unexpected findings: Build loop is complex; integration must be lightweight
- **What would make this >=90%:**
  - Actually run `/build-feature` with Card-ID through multiple tasks
- **Implementation notes (2026-02-02):**
  - Added full "Business OS Integration (Optional)" section after Completion Messages
  - Documented 3-step workflow: check for build stage doc, update card progress, check for completion
  - Build stage doc template included with Progress Tracker table and Build Log
  - Modified Build Loop instructions (Steps 6-7) for Card-ID integration
  - Added completion messages for with-Card-ID scenarios
  - References shared helpers from BOS-102 and BOS-103
- **Rollout / rollback:**
  - Rollout: Direct commit; additive section in skill file
  - Rollback: Remove the Business OS integration section
- **Documentation impact:**
  - Update: `.claude/skills/build-feature/SKILL.md` (add Business OS integration section)
  - Update: `docs/business-os/agent-workflows.md` (reference new integration)
- **Notes / references:**
  - Integration point: After "Update the plan" step (step 7 in build loop)
  - Card update pattern: `/work-idea` SKILL.md card update section

---

### BOS-109: Add lane transition to Done after all tasks complete
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-02)
- **Affects:** `.claude/skills/build-feature/SKILL.md`
- **Depends on:** BOS-108
- **Confidence:** 82%
  - Implementation: 85% - Pattern exists in `/propose-lane-move`
  - Approach: 82% - Aligns with lane lifecycle
  - Impact: 80% - Only affects completion message and card state
- **Acceptance:**
  - [x] When all eligible tasks are complete, skill proposes lane transition
  - [x] Proposal: `In progress -> Done`
  - [x] Evidence cited: all tasks marked complete, tests passing, build stage doc updated
  - [x] Skill instructions reference `/propose-lane-move` for formal proposal
  - [x] Alternative: Inline proposal (set `Proposed-Lane: Done` in card frontmatter)
- **Test plan:**
  - Add/Update: N/A (skill instruction modification)
  - Run: Manual test by completing all tasks with Card-ID
- **Planning validation:**
  - Tests run: N/A (S-effort)
  - Test stubs written: N/A
  - Unexpected findings: None
- **Implementation notes (2026-02-02):**
  - Added Step 4 to Business OS Integration section
  - Two options: /propose-lane-move (recommended) or inline Proposed-Lane frontmatter
  - Evidence requirements documented: all tasks complete, tests pass, docs updated
  - Guard conditions: do NOT propose if tasks blocked or tests failing
- **Rollout / rollback:**
  - Rollout: Direct commit; additive step in skill completion
  - Rollback: Remove the lane proposal step
- **Documentation impact:**
  - Update: `.claude/skills/build-feature/SKILL.md`
- **Notes / references:**
  - Lane transition criteria: `docs/business-os/agent-workflows.md` lines 72-73
  - Pattern: `/propose-lane-move` SKILL.md lines 54-60

---

### BOS-110: Update skill documentation with Business OS integration
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-02)
- **Affects:** `docs/business-os/agent-workflows.md`, `docs/agents/feature-workflow-guide.md`
- **Depends on:** BOS-104, BOS-106, BOS-108
- **Confidence:** 88%
  - Implementation: 92% - Documentation update is straightforward
  - Approach: 88% - Follows existing documentation patterns
  - Impact: 85% - No functional changes; improves discoverability
- **Acceptance:**
  - [x] `agent-workflows.md` updated with new skill integration section
  - [x] `feature-workflow-guide.md` mentions Business OS card tracking option
  - [x] Each skill's integration is documented with examples
  - [x] Opt-in mechanism (Business-Unit frontmatter) is clearly explained
- **Test plan:**
  - Add/Update: N/A (documentation)
  - Run: Review documentation for completeness and accuracy
- **Planning validation:**
  - Tests run: N/A (S-effort)
  - Test stubs written: N/A
  - Unexpected findings: None
- **Implementation notes (2026-02-02):**
  - Added "Feature Workflow Skills with Business OS Integration" section to agent-workflows.md
  - Documents what happens automatically for each skill when Business-Unit/Card-ID present
  - References shared helper docs
  - Added "Business OS Card Tracking (Optional)" section to feature-workflow-guide.md
  - Documents 3-step enablement process and what gets automated
  - Updated card lifecycle diagram with alternative skill-based paths
- **Rollout / rollback:**
  - Rollout: Direct commit
  - Rollback: Revert documentation changes
- **Documentation impact:**
  - Update: `docs/business-os/agent-workflows.md`
  - Update: `docs/agents/feature-workflow-guide.md`
- **Notes / references:**
  - Existing workflow documentation: `docs/business-os/agent-workflows.md` lines 196-223

---

### BOS-111: Validate IDAllocator integration for card creation
- **Type:** INVESTIGATE
- **Status:** Complete (2026-02-01)
- **Affects:** `apps/business-os/src/lib/repo/IDAllocator.ts`, `.claude/skills/_shared/card-operations.md`
- **Depends on:** -
- **Confidence:** 80%
  - Implementation: 85% - IDAllocator API is clear from code review
  - Approach: 80% - Need to verify how skills should invoke IDAllocator
  - Impact: 75% - If IDAllocator has issues, card creation may need alternative approach
- **Blockers / questions to answer:**
  - How do skill instructions invoke IDAllocator? (CLI command, script, direct file manipulation?)
  - Does IDAllocator require the RepoLock to be acquired separately?
  - What happens if counters.json is empty (bootstrap scenario)?
  - Should skills call IDAllocator directly or use a wrapper script?
- **Acceptance:**
  - Document how skills should allocate card IDs
  - Confirm counters.json bootstrap behavior (empty `{}` is valid)
  - Add usage example to card-operations helper
  - Update plan if alternative approach needed
- **Investigation Findings (2026-02-01):**
  1. **Skills cannot invoke IDAllocator directly** - IDAllocator is TypeScript; skills are markdown
  2. **RepoLock is internal** - IDAllocator uses `lock.withLock()` automatically
  3. **Bootstrap works** - Empty `{}` in counters.json returns 0, first allocation creates counter
  4. **CRITICAL: ID Format Mismatch**
     - IDAllocator produces: `BRIK-001` (3-digit, no type)
     - Repository uses: `BRIK-ENG-0001` (4-digit, with ENG type)
  5. **Recommended approach for skills:** Scan-based allocation
     - Skills scan `docs/business-os/cards/` for highest `<BUSINESS>-ENG-XXXX`
     - Increment to get next ID
     - This avoids IDAllocator format mismatch and runtime dependency
     - BOS-102 helper will document this scan-based approach
- **Notes / references:**
  - IDAllocator source: `apps/business-os/src/lib/repo/IDAllocator.ts`
  - MVP-C2 commit: `61524169b9`
  - Current counters.json: `docs/business-os/_meta/counters.json` (currently empty `{}`)

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| IDAllocator requires runtime environment skills cannot access | Medium | High | BOS-111 investigates; fallback to manual ID or scan-based allocation |
| Skill instructions become too complex with Business OS hooks | Low | Medium | Keep integration sections clearly separated; opt-in minimizes impact |
| Card/stage doc creation fails silently | Low | Medium | Add explicit success/failure messages in skill instructions |
| Idempotency check has false negatives (duplicates created) | Low | Medium | Check by both Card-ID and Feature-Slug; log all operations |
| Integration slows down skill execution | Low | Low | All operations are file-based; no network calls |

## Observability

- Logging: Each skill should log card/stage doc operations with file paths
- Metrics: N/A (skills are agent instructions, not runtime code)
- Alerts/Dashboards: N/A

## Acceptance Criteria (overall)

- [ ] `/fact-find` with `Business-Unit` creates a card and fact-finding stage doc
- [ ] `/fact-find` without `Business-Unit` works unchanged (backward compatible)
- [ ] `/plan-feature` with `Card-ID` creates planned stage doc and proposes lane move
- [ ] `/plan-feature` without `Card-ID` works unchanged (backward compatible)
- [ ] `/build-feature` with `Card-ID` updates card progress and proposes lane move on completion
- [ ] `/build-feature` without `Card-ID` works unchanged (backward compatible)
- [ ] Running skills multiple times does not create duplicate cards (idempotent)
- [ ] All skill documentation updated with Business OS integration examples
- [ ] Shared helpers created for card and stage doc operations

## Test Plan Summary

Since skills are markdown instruction files (not executable code), testing is manual:

1. **Integration Test 1:** Run `/fact-find` with `Business-Unit: PLAT` on new topic
   - Verify card created in `docs/business-os/cards/`
   - Verify stage doc created in `docs/business-os/cards/<ID>/`
   - Verify `Card-ID` added to fact-find brief frontmatter

2. **Integration Test 2:** Run `/fact-find` on existing topic with `Card-ID`
   - Verify no duplicate card created
   - Verify stage doc created/updated

3. **Integration Test 3:** Run `/plan-feature` with existing `Card-ID`
   - Verify planned stage doc created
   - Verify `Proposed-Lane: Planned` set on card

4. **Integration Test 4:** Run `/build-feature` with existing `Card-ID` through 2+ tasks
   - Verify `Last-Progress` updated after each task
   - Verify `Proposed-Lane: Done` set when all tasks complete

5. **Backward Compatibility Test:** Run all three skills without Business-Unit/Card-ID
   - Verify unchanged behavior

---

## Appendix: Frontmatter Schema Additions

### Fact-Find Brief (Outcome A)
```yaml
---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: <CMS | Platform | UI | API | Data | Infra | etc.>
Created: YYYY-MM-DD
Last-updated: YYYY-MM-DD
Feature-Slug: <kebab-case>
Related-Plan: docs/plans/<feature-slug>-plan.md
# NEW: Business OS Integration (optional)
Business-Unit: <BRIK | PLAT | PIPE | BOS | etc.>  # Optional - triggers card creation
Card-ID: <auto-generated if Business-Unit provided>  # Added by skill after card creation
---
```

### Plan Document
```yaml
---
Type: Plan
Status: Active
Domain: <CMS | Platform | UI | API | Data | Infra | etc.>
Created: YYYY-MM-DD
Last-updated: YYYY-MM-DD
Feature-Slug: <kebab-case>
Overall-confidence: <%>
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
# NEW: Business OS Integration (optional, inherited from fact-find)
Business-Unit: <BRIK | PLAT | PIPE | BOS | etc.>  # Optional
Card-ID: <ID from fact-find or manually provided>  # Optional
---
```

---

*Plan created: 2026-02-01*
*Overall confidence: 83% (effort-weighted average)*
