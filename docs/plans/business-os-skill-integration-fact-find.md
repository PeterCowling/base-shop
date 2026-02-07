---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: Agents / Business OS
Created: 2026-02-01
Last-updated: 2026-02-01
Feature-Slug: business-os-skill-integration
Related-Plan: docs/plans/business-os-skill-integration-plan.md
---

# Business OS Skill Integration Fact-Find Brief

## Scope

### Summary

Integrate Business OS card lifecycle management into the fact-find, plan-feature, and build-feature skills so that completing work through these skills automatically creates and updates Business OS cards. Currently, running `/fact-find` -> `/plan-feature` -> `/build-feature` produces artifacts in `docs/plans/` but the Business OS kanboard remains stale with no corresponding card tracking the work.

### Goals

- When `/fact-find` completes for a new topic, automatically create a Business OS card (or link to existing one) and create a fact-finding stage document
- When `/plan-feature` completes, create a planned stage document and propose lane transition to "Planned"
- When `/build-feature` starts/completes tasks, update card status and progress
- The integration should be automatic (no manual card creation required)
- Must be idempotent (running a skill multiple times doesn't create duplicate cards)

### Non-goals

- Redesigning Business OS structure (cards/, ideas/, agent-workflows.md, charter)
- Changing existing card frontmatter schemas
- Making Business OS integration mandatory (should allow opt-out)
- Changing existing plan document templates/formats

### Constraints & Assumptions

- Constraints:
  - Must work with existing Business OS structure (`docs/business-os/cards/`, `docs/business-os/ideas/`)
  - Should reuse existing skills where possible (`/work-idea`, `/propose-lane-move`)
  - Must not break existing skill workflows (backward compatible)
  - Must follow dual-audience pattern (`.user.md` + `.agent.md` files)
  - Phase 0 constraints apply: Pete-supervised, agent identity for commits, no automated triggers
- Assumptions:
  - Plan documents in `docs/plans/` and Business OS cards serve complementary purposes (plans for detailed technical tasks, cards for kanban coordination)
  - Existing skills can be extended with optional Business OS integration hooks

## Repo Audit (Current State)

### Entry Points

#### Skill Files (to be modified)
- `.claude/skills/fact-find/SKILL.md` - produces `docs/plans/<feature>-fact-find.md`
- `.claude/skills/plan-feature/SKILL.md` - produces `docs/plans/<feature>-plan.md`
- `.claude/skills/build-feature/SKILL.md` - updates plan doc as tasks complete

#### Business OS Skills (potential reuse)
- `.claude/skills/work-idea/SKILL.md` - converts raw ideas to cards + creates fact-finding stage docs
- `.claude/skills/propose-lane-move/SKILL.md` - proposes lane transitions based on evidence

### Key Modules / Files

#### Skill Implementations
- `/Users/petercowling/base-shop/.claude/skills/fact-find/SKILL.md` - 436 lines, produces two outcomes (Planning Brief or Briefing Note)
- `/Users/petercowling/base-shop/.claude/skills/plan-feature/SKILL.md` - 446 lines, creates confidence-gated implementation plans
- `/Users/petercowling/base-shop/.claude/skills/build-feature/SKILL.md` - 308 lines, implements tasks with TDD
- `/Users/petercowling/base-shop/.claude/skills/work-idea/SKILL.md` - 414 lines, converts ideas to cards + stage docs
- `/Users/petercowling/base-shop/.claude/skills/propose-lane-move/SKILL.md` - 207 lines, proposes lane transitions

#### Business OS Infrastructure
- `/Users/petercowling/base-shop/docs/business-os/agent-workflows.md` - workflow guide for all Business OS skills
- `/Users/petercowling/base-shop/docs/business-os/business-os-charter.md` - canonical rules and constraints
- `/Users/petercowling/base-shop/apps/business-os/src/lib/types.ts` - TypeScript types for Card, Idea, StageDoc

#### Card Storage
- `docs/business-os/cards/<ID>.user.md` - human-readable card files
- `docs/business-os/cards/<ID>.agent.md` - agent-optimized card files
- `docs/business-os/cards/<ID>/` - stage document subdirectories

#### ID Management
- `/Users/petercowling/base-shop/docs/business-os/_meta/counters.json` - currently empty `{}`, ID assignment mechanism unclear

### Patterns & Conventions Observed

#### Card ID Format
- Pattern: `<BUSINESS>-<TYPE>-<SEQUENCE>` (e.g., `BRIK-ENG-0001`, `PLAT-ENG-0017`)
- Business codes: `BRIK`, `PLAT`, `PIPE`, `BOS`
- Type codes: `ENG` (engineering), `OPP` (opportunity)
- Sequence: 4-digit zero-padded number

#### Card Creation Pattern (from `/work-idea`)
1. Create worked idea in `docs/business-os/ideas/worked/`
2. Create card in `docs/business-os/cards/<ID>.user.md` + `<ID>.agent.md`
3. Create fact-finding stage doc in `docs/business-os/cards/<ID>/fact-finding.user.md`
4. Run `pnpm docs:lint` for validation
5. Commit with agent identity

#### Lane Lifecycle
Lanes: `Inbox -> Fact-finding -> Planned -> In progress -> Blocked -> Done -> Reflected`

Evidence-gated transitions (from `/propose-lane-move`):
- `Inbox -> Fact-finding`: Always allowed
- `Fact-finding -> Planned`: Fact-finding stage doc complete with evidence
- `Planned -> In progress`: Plan doc exists with acceptance criteria, dependencies resolved
- `In progress -> Done`: All acceptance criteria met, tests passing
- `Done -> Reflected`: Reflection doc with outcomes and learnings

#### Stage Document Pattern
- Located in `docs/business-os/cards/<ID>/<stage>.user.md`
- Frontmatter: `Type: Stage-Doc`, `Card-ID`, `Stage`, `Created`, `Owner`
- Content: questions to answer, findings, recommendations

#### Dual-Audience Pattern
- `.user.md` - human-readable with full prose
- `.agent.md` - LLM-optimized with structured key-value format

### Data & Contracts

#### Card Frontmatter Schema (from `apps/business-os/src/lib/types.ts`)
```typescript
interface CardFrontmatter {
  Type: "Card";
  Lane: Lane;  // Inbox | Fact-finding | Planned | In progress | Blocked | Done | Reflected
  Priority: Priority;  // P0 | P1 | P2 | P3 | P4 | P5
  Owner: string;
  ID: string;
  Title?: string;
  Business?: string;
  Tags?: string[];
  Dependencies?: string[];
  "Due-Date"?: string;
  Created?: string;
  Updated?: string;
  "Proposed-Lane"?: Lane;
  Blocked?: boolean;
  "Blocked-Reason"?: string;
}
```

#### Stage Doc Frontmatter Schema
```typescript
interface StageFrontmatter {
  Type: "Stage";
  Stage: StageType;  // fact-find | plan | build | reflect
  "Card-ID": string;
  Created?: string;
  Updated?: string;
}
```

#### Plan Document Relationship
- Plan docs live in `docs/plans/<feature-slug>-plan.md`
- Stage docs could reference plan docs via path (e.g., `Plan-Link: docs/plans/<feature>-plan.md`)
- Current fact-find briefs already have `Related-Plan` in frontmatter

### Dependency & Impact Map

#### Upstream Dependencies
- Business OS charter rules (`docs/business-os/business-os-charter.md`)
- Card/stage document schemas (`apps/business-os/src/lib/types.ts`)
- Existing skill implementations (fact-find, plan-feature, build-feature)
- Business catalog (`docs/business-os/strategy/businesses.json`)

#### Downstream Dependents
- Users running `/fact-find`, `/plan-feature`, `/build-feature`
- Existing cards and stage documents (must not break)
- Skills that consume card state (`/propose-lane-move`, `/scan-repo`, `/update-business-plan`)
- Business OS app (reads card files)

#### Likely Blast Radius
- **Direct:** 3 skill instruction files (fact-find, plan-feature, build-feature)
- **Optional:** New helper module for card operations (if reuse pattern is complex)
- **Documentation:** `docs/business-os/agent-workflows.md`, `docs/agents/feature-workflow-guide.md`
- **Validation:** May need to extend `pnpm docs:lint` rules

### Tests & Quality Gates

#### Existing Validation
- `pnpm docs:lint` - validates Business OS document headers
- No automated tests for skill behavior (skills are markdown instructions)
- Business OS app has type checking for card/stage schemas

#### Gaps Identified
- No idempotency mechanism for card creation from plan docs
- No mapping between `docs/plans/<feature>` and Business OS cards
- Counters.json is empty - unclear how card IDs are currently assigned

### Recent Git History (Targeted)

Recent skill and Business OS changes (last 30 commits):
- `82ffa55ba8` - feat(skills): add interactive workflow selection to improve-guide
- `55fb13b564` - feat(skills): split improve-guide into focused EN and translation skills
- `82825687a3` - Work up idea: BRIK-OPP-0003 -> Card: BRIK-ENG-0020 (example of /work-idea)
- `61bbbcbdd7` - feat(business-os): migrate plan files to Business OS cards
- `c98789deab` - docs(business-os): Update docs to reflect D1-canonical architecture
- `61524169b9` - feat(business-os): complete MVP-C2 (Collision-proof ID allocation)
- `98bed38617` - docs(agents): codify workflow + CI-as-motivation

Key insight: `61524169b9` mentions "MVP-C2 (Collision-proof ID allocation)" - this should be investigated for how card IDs are now assigned.

## Questions

### Resolved (from repo evidence)

#### Q1: How are cards currently created?
- **A:** Via `/work-idea` from inbox ideas, which creates card files, agent.md files, and initial fact-finding stage docs
- **Evidence:** `.claude/skills/work-idea/SKILL.md` lines 62-323

#### Q2: What's the minimal card structure?
- **A:** Card frontmatter requires: `Type: Card`, `Lane`, `Priority`, `Owner`, `ID`, `Title`. Optional: `Business`, `Tags`, `Dependencies`, `Due-Date`, `Created`, `Updated`, `Proposed-Lane`
- **Evidence:** `apps/business-os/src/lib/types.ts` lines 40-59

#### Q3: What stage document templates exist?
- **A:** Stage docs have: `Type: Stage-Doc`, `Card-ID`, `Stage` (fact-finding | plan | build | reflect), `Created`, `Owner`. Content has "Questions to Answer", "Findings", "Recommendations" sections.
- **Evidence:** `docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md`

#### Q4: How are lane transitions proposed?
- **A:** Via `/propose-lane-move` skill which reads card + stage docs, analyzes evidence against criteria, updates `Proposed-Lane` frontmatter field, adds comment with rationale
- **Evidence:** `.claude/skills/propose-lane-move/SKILL.md` lines 79-122

#### Q5: How are card IDs managed?
- **A:** The `counters.json` file exists but is empty. Recent commit `61524169b9` mentions "MVP-C2 (Collision-proof ID allocation)" suggesting a new mechanism exists, but the current counters.json is `{}`. Card IDs appear to be assigned based on existing card filenames (scan for highest number).
- **Evidence:** `docs/business-os/_meta/counters.json` (empty), git history, existing cards follow `<BIZ>-<TYPE>-<NNNN>` pattern

#### Q6: What's the relationship between docs/plans/ and Business OS cards?
- **A:** They are currently separate systems. Plan docs have detailed technical tasks; cards provide kanban coordination. The BRIK-ENG-0020 card shows a pattern where:
  - Card `Fact-finding` stage doc references plan artifacts
  - Card frontmatter includes `Plan-Confidence` and links to plan docs
  - Plan docs reference card ID in stage docs
- **Evidence:** `docs/business-os/cards/BRIK-ENG-0020.user.md` lines 17-18: `Plan-Confidence: 82%`, `Workflow-Design: docs/plans/email-autodraft-workflow-design.md`

### Open (User Input Needed)

#### Q1: Where should Business OS card context be stored during skill execution?
- **Why it matters:** Skills need to know which card they're operating on
- **Decision impacted:** How fact-find/plan/build track their associated card
- **Options:**
  - A) Add frontmatter to plan docs: `Card-ID: BRIK-ENG-0020`
  - B) Use skill arguments: `/fact-find --card BRIK-ENG-0020`
  - C) Auto-detect from topic/feature-slug matching
- **Default assumption (if no answer):** Option A (add Card-ID to plan doc frontmatter) + Option C (auto-detect if missing)

#### Q2: Should Business OS integration be opt-in or automatic?
- **Why it matters:** Backward compatibility and user control
- **Decision impacted:** Whether skills always create/update cards or only when requested
- **Options:**
  - A) Automatic: Always create/update cards (opt-out via flag)
  - B) Opt-in: Only create/update when `--card` flag or existing Card-ID present
  - C) Prompt: Ask user at skill completion if they want to create/update card
- **Default assumption (if no answer):** Option B (opt-in) - start with explicit linkage, expand to automatic later

#### Q3: Which business should cards default to when not specified?
- **Why it matters:** Card IDs require a business prefix
- **Decision impacted:** How to assign business when creating cards from plan docs
- **Options:**
  - A) Require explicit business specification
  - B) Default to `PLAT` (Platform) for infrastructure work
  - C) Infer from affected code paths (apps/brikette -> BRIK, packages/* -> PLAT)
- **Default assumption (if no answer):** Option A (require explicit) with Option C as fallback heuristic

## Confidence Inputs (for /plan-feature)

- **Implementation:** 75%
  - Strong foundation exists: `/work-idea` already creates cards + stage docs
  - Clear patterns for card creation, stage doc structure, lane transition
  - Gap: ID allocation mechanism unclear (counters.json empty), need to investigate MVP-C2
  - Gap: No existing card<->plan linking pattern to extend
  - What would raise to >=80%: Verify ID allocation mechanism; design explicit linking strategy

- **Approach:** 80%
  - Clear architectural fit: extend existing skills with optional Business OS hooks
  - Reuses existing patterns (work-idea, propose-lane-move)
  - Two viable approaches: (A) modify skills in-place vs (B) create wrapper/orchestrator skill
  - Chosen: (A) modify skills - simpler, less indirection, maintains progressive disclosure
  - What would raise to >=90%: User confirmation on opt-in vs automatic; business inference heuristic

- **Impact:** 85%
  - Blast radius well understood: 3 skill files + optional helper module
  - Downstream effects manageable: existing skills/cards unaffected if integration is opt-in
  - Risk: If automatic, could create unwanted cards from test runs
  - Mitigation: Start opt-in, add validation prompts
  - What would raise to >=90%: Integration tests for card<->plan linking; dry-run capability

## Planning Constraints & Notes

### Must-follow patterns
- Dual-audience files: `.user.md` + `.agent.md` for cards (not stage docs)
- Stage docs in card subdirectory: `docs/business-os/cards/<ID>/<stage>.user.md`
- Card frontmatter schema from `apps/business-os/src/lib/types.ts`
- Agent identity for all commits (from agent-workflows.md)
- Run `pnpm docs:lint` before committing Business OS changes

### Rollout/rollback expectations
- Rollout: Opt-in first (explicit `--card` or `Card-ID` in plan frontmatter)
- Rollback: Remove new sections from skill docs; cards created are valid and remain
- No migration needed for existing cards or plans

### Observability expectations
- Log card creation/update actions in skill output
- Show card ID when linked to plan operations
- Include card ID in commit messages when updating cards

## Suggested Task Seeds (Non-binding)

### Phase 1: Linking Infrastructure
1. **Investigate ID allocation** - Understand MVP-C2 collision-proof ID allocation (git show `61524169b9`)
2. **Design plan<->card linking** - Add `Card-ID` to plan doc frontmatter; add `Plan-Link` to card frontmatter
3. **Create helper module** - Optional shared logic for card lookup/creation (if pattern is complex)

### Phase 2: Skill Integration
4. **Extend /fact-find** - After creating fact-find brief, optionally create/link Business OS card + fact-finding stage doc
5. **Extend /plan-feature** - After creating plan, create planned stage doc; propose lane move to Planned
6. **Extend /build-feature** - On task completion, update card progress; on all tasks complete, propose lane move to Done

### Phase 3: Polish
7. **Add idempotency checks** - Prevent duplicate cards for same feature-slug
8. **Update documentation** - Modify `agent-workflows.md`, `feature-workflow-guide.md`
9. **Add dry-run option** - Show what cards/stage docs would be created without committing

## Planning Readiness

- **Status:** Ready-for-planning
- **Blocking items:** None - open questions have reasonable defaults
- **Recommended next step:** Proceed to `/plan-feature` with following notes:
  1. Investigate MVP-C2 commit for ID allocation details before TASK-01
  2. Start with opt-in approach (explicit Card-ID linking)
  3. Design for future expansion to automatic mode
  4. Include INVESTIGATE task for ID allocation mechanism

---

## Appendix: Evidence Files Read

| File | Purpose |
|------|---------|
| `.claude/skills/fact-find/SKILL.md` | Current fact-find implementation |
| `.claude/skills/plan-feature/SKILL.md` | Current plan-feature implementation |
| `.claude/skills/build-feature/SKILL.md` | Current build-feature implementation |
| `.claude/skills/work-idea/SKILL.md` | Card creation pattern |
| `.claude/skills/propose-lane-move/SKILL.md` | Lane transition pattern |
| `.claude/skills/scan-repo/SKILL.md` | Repo scanning pattern |
| `.claude/skills/re-plan/SKILL.md` | Re-planning workflow |
| `docs/business-os/agent-workflows.md` | Business OS workflow guide |
| `docs/business-os/business-os-charter.md` | Business OS rules and constraints |
| `docs/agents/feature-workflow-guide.md` | Feature workflow entrypoint |
| `apps/business-os/src/lib/types.ts` | Card/Idea/StageDoc TypeScript types |
| `docs/business-os/cards/BRIK-ENG-0020.user.md` | Example card with plan links |
| `docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md` | Example stage doc |
| `docs/business-os/_meta/counters.json` | ID counter storage (empty) |
| `docs/plans/commerce-core-readiness-fact-find.md` | Example fact-find without card link |
