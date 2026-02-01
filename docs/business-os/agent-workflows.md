---
Type: Guide
Status: Active
Domain: Business OS / Agents
Last-reviewed: 2026-01-28
---

# Business OS Agent Workflow Guide

This guide covers agent operations for the **Business OS** coordination system. Use these workflows to manage ideas, cards, lane transitions, scans, and plan updates.

## Prerequisites

1. Read `AGENTS.md` (universal rules, safety, commands)
2. Read your agent overlay (`CODEX.md` or `CLAUDE.md`)
3. Read `docs/business-os/business-os-charter.md` (Business OS fundamentals)
4. Understand card lifecycle: Inbox → Fact-finding → Planned → In progress → Done → Reflected

## Available Skills

Business OS provides 5 specialized agent skills for coordination work. Read only the skill you need for the current task:

### 1. `/work-idea` — Convert Raw Idea to Card

**When to use:**
- A raw idea exists in `docs/business-os/ideas/inbox/`
- The idea has enough detail to scope initial fact-finding
- You need to create a card and initial stage doc

**What it does:**
- Analyzes raw idea for completeness
- Creates worked idea in `docs/business-os/ideas/worked/`
- Creates card with frontmatter in `docs/business-os/cards/`
- Creates initial Fact-finding stage doc
- Links idea to card via Card-ID

**Full instructions:** `.claude/skills/work-idea/SKILL.md`

**Example:**
```
Pete: /work-idea BRIK-OPP-0001

Agent:
1. Reads raw idea BRIK-OPP-0001 from inbox
2. Clarifies scope (asks questions if needed)
3. Creates worked idea with success criteria
4. Creates card BRIK-ENG-0001 in Inbox lane
5. Creates fact-finding.user.md with questions to answer
```

---

### 2. `/propose-lane-move` — Propose Card Lane Transitions

**When to use:**
- A card has completed work in current lane
- Evidence exists to support lane transition
- You need to recommend next lane based on stage docs

**What it does:**
- Reads card and all stage documents
- Analyzes evidence against lane transition criteria
- Updates card's `Proposed-Lane` frontmatter field
- Adds comment explaining rationale and evidence

**Full instructions:** `.claude/skills/propose-lane-move/SKILL.md`

**Lane transition criteria:**
- **Inbox → Fact-finding:** Always allowed (no evidence required)
- **Fact-finding → Planned:** Fact-finding doc complete with evidence
- **Planned → In progress:** Plan doc exists with acceptance criteria, dependencies resolved
- **In progress → Done:** All acceptance criteria met, tests passing
- **Done → Reflected:** Reflection doc with outcomes and learnings

**Example:**
```
Pete: /propose-lane-move BRIK-ENG-0001

Agent:
1. Reads card (currently in Fact-finding lane)
2. Checks fact-finding.user.md for completeness
3. Verifies evidence sources documented (repo-diff, measurement)
4. Proposes: Fact-finding → Planned
5. Updates Proposed-Lane field and commits
```

---

### 3. `/scan-repo` — Scan for Changes and Create Ideas

**When to use:**
- Weekly or daily scan to detect Business OS document changes
- Before planning sessions to review card status
- After major milestones to identify follow-up work

**What it does:**
- Runs git diff on `docs/business-os/` since last scan
- Categorizes changes (cards, ideas, plans, stage docs)
- Analyzes business relevance (high/medium/low)
- Optionally creates ideas for significant findings (e.g., blocked cards)
- Saves scan artifacts to `docs/business-os/scans/`

**Full instructions:** `.claude/skills/scan-repo/SKILL.md`

**Scan modes:**
- **Incremental (default):** Changes since last scan
- **Full:** Scan all files (use monthly for comprehensive audit)

**Example:**
```
Pete: /scan-repo

Agent:
1. Loads last scan timestamp from last-scan.json
2. Runs git diff to find changed files
3. Detects: BRIK-ENG-0001 moved to Blocked lane
4. Creates idea: SCAN-BRIK-001 (Review blocked card)
5. Saves scan results and history
```

---

### 4. `/update-business-plan` — Update Business Plans from Evidence

**When to use:**
- After completing a card (reflection stage)
- After repo scan reveals strategic insights
- When new risks, opportunities, or learnings emerge

**What it does:**
- Reads card reflection or scan results
- Extracts structured information (decisions, risks, opportunities, learnings, metrics)
- Merges updates into business plan at `docs/business-os/strategy/<BIZ>/plan.user.md`
- Maintains dual-audience format (.user.md + .agent.md)

**Full instructions:** `.claude/skills/update-business-plan/SKILL.md`

**Business plan sections:**
- **Strategy:** Current focus areas and priorities
- **Risks:** Active and emerging risks with severity
- **Opportunities:** Validated ideas ready for cards
- **Learnings:** Append-only log of what worked/didn't work
- **Metrics:** KPIs and business outcomes

**Example:**
```
Pete: /update-business-plan BRIK --card BRIK-ENG-0001

Agent:
1. Reads reflection from BRIK-ENG-0001
2. Extracts learnings (what worked, what didn't)
3. Identifies new risks (GDPR compliance blocker)
4. Updates BRIK business plan Strategy, Risks, Learnings sections
5. Commits with agent identity
```

---

### 5. `/update-people` — Update People Doc from Evidence

**When to use:**
- After completing a card (reflection captures skill changes)
- After repo scan (code attribution analysis)
- Monthly reviews to update responsibilities and availability

**What it does:**
- Reads card reflection or analyzes git history
- Extracts people-related changes (capabilities, gaps, availability)
- Updates people doc at `docs/business-os/people/people.user.md`
- Maintains dual-audience format (.user.md + .agent.md)

**Full instructions:** `.claude/skills/update-people/SKILL.md`

**People doc sections:**
- **Roles:** Who does what (primary responsibilities)
- **Responsibilities:** Current projects and ownership
- **Capabilities:** Technical skills and domain knowledge
- **Gaps:** Knowledge gaps and skill needs
- **Availability:** Current workload and capacity

**Example:**
```
Pete: /update-people --card BRIK-ENG-0001

Agent:
1. Reads reflection from BRIK-ENG-0001
2. Extracts capabilities learned (Next.js App Router, Zod validation)
3. Identifies gaps discovered (GDPR compliance, performance profiling)
4. Updates Pete's Capabilities and Gaps sections
5. Commits with agent identity
```

---

## Workflow Integration

### Feature Workflow Skills with Business OS Integration

The feature workflow skills (`/fact-find`, `/plan-feature`, `/build-feature`) now integrate with Business OS card lifecycle. This is **opt-in** via frontmatter fields.

**How to enable:**
1. Add `Business-Unit: <BRIK|PLAT|PIPE|BOS>` to fact-find brief frontmatter
2. The skill automatically creates a card and stage doc
3. Card-ID flows through to plan and build phases

**What happens automatically:**

| Skill | When Business-Unit/Card-ID Present |
|-------|-----------------------------------|
| `/fact-find` | Creates card, fact-finding stage doc, adds Card-ID to brief |
| `/plan-feature` | Creates planned stage doc, updates card with Plan-Link, proposes lane move |
| `/build-feature` | Creates build stage doc (first task), updates Last-Progress, proposes Done lane move |

**Shared helper docs:**
- Card creation: `.claude/skills/_shared/card-operations.md`
- Stage doc creation: `.claude/skills/_shared/stage-doc-operations.md`

**Backward compatibility:** Skills work unchanged if Business-Unit/Card-ID not provided.

### Typical Card Lifecycle (Agent-Assisted)

```
1. Raw idea submitted → inbox/
   ↓
2. /work-idea → Card created + Fact-finding stage doc
   ↓
3. Pete performs fact-finding (code analysis, user research)
   OR /fact-find with Business-Unit → Card + stage doc created automatically
   ↓
4. /propose-lane-move → Fact-finding → Planned
   ↓
5. Pete creates plan doc with acceptance criteria
   OR /plan-feature with Card-ID → Planned stage doc + lane proposal
   ↓
6. /propose-lane-move → Planned → In progress
   ↓
7. Pete implements (or delegates to agent)
   OR /build-feature with Card-ID → Progress tracking + lane proposal on completion
   ↓
8. /propose-lane-move → In progress → Done
   ↓
9. Pete writes reflection doc (learnings, outcomes)
   ↓
10. /propose-lane-move → Done → Reflected
    ↓
11. /update-business-plan → Plan updated with learnings
    ↓
12. /update-people → People doc updated with capabilities/gaps
```

### Recommended Scan Schedule

- **Daily scans (active development):** `/scan-repo` to catch blocked cards quickly
- **Weekly scans (maintenance):** `/scan-repo` to review progress and update plans
- **Monthly scans (audit):** `/scan-repo --full` to verify consistency

### Agent Identity and Commits

All agent skills commit with **agent identity** (not user identity):

```typescript
CommitIdentities.agent = {
  name: "Claude Agent",
  email: "agent@business-os.internal"
}
```

This distinguishes agent-generated changes from Pete's manual edits in git history.

## Evidence Requirements

Every Business OS operation requires **evidence**. Use evidence source types from BOS-26:

| Evidence Type | When to Use | Example |
|---------------|-------------|---------|
| `measurement` | Metrics, analytics, performance data | "Page load improved 200ms" |
| `customer-input` | User research, surveys, feedback | "82% of users requested feature" |
| `repo-diff` | Code changes, technical analysis | "8 files modified in auth/" |
| `experiment` | A/B tests, prototypes | "Variant B increased conversion 15%" |
| `financial-model` | Cost/revenue projections | "ROI break-even in 6 months" |
| `vendor-quote` | Third-party pricing | "AWS estimate: $500/month" |
| `legal` | Compliance, contracts | "GDPR review approved" |
| `assumption` | Unverified hypothesis | "Assumes platform auth compatible" |
| `other` | Anything else | "Industry best practice" |

**Evidence quality checks:**
- Evidence is **specific** (links to files, commits, metrics)
- Evidence is **recent** (prefer data from last 30 days)
- Evidence is **typed** (use evidence type enum)
- Assumptions are **explicit** (mark unknowns clearly)

## Troubleshooting

### Skill fails with "Card not found"
- Check card ID spelling (case-sensitive)
- Verify card exists in `docs/business-os/cards/<ID>.user.md`
- Run `pnpm docs:lint` to check for validation errors

### Skill fails with "Insufficient evidence"
- Read the skill's evidence requirements section
- Add missing evidence to stage doc
- Document assumptions explicitly if evidence unavailable

### Lane transition proposal rejected
- Review lane transition criteria in `/propose-lane-move` skill doc
- Check for unresolved dependencies
- Verify stage doc completeness (all questions answered)

### Scan creates duplicate ideas
- Check `docs/business-os/scans/last-scan.json` timestamp
- Verify git history is clean (no rebases since last scan)
- Run full scan to reset: `/scan-repo --full`

### Business plan update conflicts
- Pete resolves conflicts manually (no automatic merges)
- Review git diff before committing
- Use `/update-business-plan` only after card reflection complete

### People doc update missing capabilities
- Check reflection doc for Learnings section
- Verify capabilities are explicitly documented (not implied)
- Use code analysis for ownership patterns: `git log --author="Pete" --since="30 days ago"`

## Quality Gates

Before any agent skill commits:

1. **Validation:** `pnpm docs:lint` passes (no errors)
2. **Evidence:** All claims reference specific evidence sources
3. **Dual-audience:** Both `.user.md` and `.agent.md` updated (where applicable)
4. **Identity:** Agent commits use `CommitIdentities.agent`
5. **Review:** Pete reviews all agent outputs in Phase 0

## Phase 0 Constraints

- **Pete-only:** All agent skills are Pete-triggered (no automated runs)
- **Local-only:** Business OS app runs on Pete's machine (not deployed)
- **Single writer:** No concurrent agent execution
- **Manual approval:** Pete approves all lane moves and plan updates
- **No agent APIs:** Skills invoked via CLI, not programmatically

## Next Steps

1. For new ideas → Use `/work-idea` to create cards
2. For card progression → Use `/propose-lane-move` after stage work complete
3. For weekly reviews → Use `/scan-repo` to detect changes
4. For plan updates → Use `/update-business-plan` after reflections
5. For team tracking → Use `/update-people` after capabilities/gaps change

## References

- **Charter:** `docs/business-os/business-os-charter.md`
- **Plan:** `docs/plans/business-os-kanban-plan.md`
- **Card schema:** `apps/business-os/src/lib/types.ts`
- **Evidence types:** `apps/business-os/src/types/evidence.ts`
- **Commit identity:** `apps/business-os/src/lib/commit-identity.ts`
