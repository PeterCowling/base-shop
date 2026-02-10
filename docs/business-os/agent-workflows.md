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

## Agent API (Phase 1)

Agent writes must go through the Business OS agent API. Markdown writes are **not** allowed once an endpoint exists.

**Auth header:** `X-Agent-API-Key: <value>` (env: `BOS_AGENT_API_KEY`)

**Base URL:** `BOS_AGENT_API_BASE_URL` (local: `http://localhost:3000`, prod: `https://business-os.acme.dev`)

**Endpoints:**
- Cards: `GET /api/agent/cards`, `POST /api/agent/cards`, `GET /api/agent/cards/:id`, `PATCH /api/agent/cards/:id`
- Ideas: `GET /api/agent/ideas`, `POST /api/agent/ideas`, `GET /api/agent/ideas/:id`, `PATCH /api/agent/ideas/:id`
- Stage docs: `GET /api/agent/stage-docs`, `POST /api/agent/stage-docs`, `GET /api/agent/stage-docs/:cardId/:stage`, `PATCH /api/agent/stage-docs/:cardId/:stage`
- ID allocation: `POST /api/agent/allocate-id`

**PATCH contract:** JSON Merge Patch (RFC 7396) with optimistic concurrency. Use `GET` to obtain `entitySha`, then send:
```json
{
  "baseEntitySha": "<sha from GET>",
  "patch": { "Lane": "In progress", "Last-Progress": "2026-02-02" }
}
```

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

### 2. `/propose-lane-move` — Exception Lane Transition Proposals

**When to use:**
- You need a non-mechanical lane transition outside the default loop contracts
- You want explicit owner review before transition
- You are handling post-delivery/manual transitions (for example `Done -> Reflected`)

**What it does:**
- Reads card and stage documents
- Evaluates evidence against lane criteria
- Proposes `Proposed-Lane` with rationale and evidence

**Important:** baseline core-loop transitions are deterministic in skill execution:
- `/plan-feature`: `Fact-finding -> Planned`
- `/build-feature`: `Planned -> In progress` and `In progress -> Done`

Use `/propose-lane-move` only when you intentionally need an exception path.

**Full instructions:** `.claude/skills/propose-lane-move/SKILL.md`
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

### Feature Workflow Skills with Business OS Integration (Default)

The core loop (`/ideas-go-faster` -> `/fact-find` -> `/plan-feature` -> `/build-feature`) integrates with Business OS by default.

**Baseline mode:** `Business-OS-Integration` omitted or `on`.

**Escape hatch:** set `Business-OS-Integration: off` in controlling fact-find/plan frontmatter for intentionally standalone work.

**Automated behavior:**

| Skill | Baseline integration behavior |
|-------|-------------------------------|
| `/ideas-go-faster` | Creates prioritized ideas/cards and seeds top-K fact-find stage docs |
| `/fact-find` | Creates/updates card + `fact-find` stage doc |
| `/plan-feature` | Creates `plan` stage doc, updates `Plan-Link`, applies deterministic `Fact-finding -> Planned` when gate passes |
| `/build-feature` | Creates/updates `build` stage doc, updates `Last-Progress`, applies deterministic `Planned -> In progress` and `In progress -> Done` when gates pass |

**Ideas triage UI:** `/ideas` is the backlog triage surface. It lists ideas in deterministic order (`P0 -> P5`, then created date DESC, then ID ASC) with server-driven filters/search via URL params and click-through to `/ideas/[id]`.

**Automated idea routing:** idea writes from `/ideas-go-faster` (`POST /api/agent/ideas`) are persisted to D1 in `inbox`/`worked` and become visible on `/ideas` immediately (page is `force-dynamic`). Kanban lanes remain card-only and do not render idea entities.

**Discovery index freshness (fail-closed):**
- Loop write paths rebuild `docs/business-os/_meta/discovery-index.json`.
- Rebuild retries once after short backoff.
- If second attempt fails, run surfaces `discovery-index stale` with:
  - failing command,
  - retry count,
  - stderr summary,
  - exact rerun command for operator reconciliation.
- Success completion messages must not claim fresh discovery while stale persists.

**Partial sweep reconciliation (ideas-go-faster):**
- When persistence is partial (or index is stale), sweep report must include a reconciliation checklist:
  - success/failure counts by entity type,
  - failed endpoint/status summary,
  - exact retry commands,
  - owner handoff.

**Compatibility:** existing documents without `Business-OS-Integration` field default to `on`; set `off` only for exception paths.

### Typical Card Lifecycle (Agent-Assisted)

```
1. /ideas-go-faster -> prioritized ideas + cards + top-K fact-find stage docs
   ↓
2. /fact-find -> evidence brief + fact-find stage doc refresh
   ↓
3. /plan-feature -> plan doc + planned stage doc
   ↓
4. /plan-feature applies deterministic lane move: Fact-finding -> Planned (when plan gate passes)
   ↓
5. /build-feature starts execution and applies deterministic lane move: Planned -> In progress
   ↓
6. /build-feature completes eligible implementation tasks with validation evidence
   ↓
7. /build-feature applies deterministic lane move: In progress -> Done (when completion gate passes)
   ↓
8. /update-business-plan and /update-people capture reflections and capability updates
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

### Deterministic lane transition failed
- Check completion/transition gates in `/plan-feature` and `/build-feature` skill docs
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
2. For card progression → Run core loop stages; deterministic lane updates occur inside `/plan-feature` and `/build-feature`
3. For weekly reviews → Use `/scan-repo` to detect changes
4. For plan updates → Use `/update-business-plan` after reflections
5. For team tracking → Use `/update-people` after capabilities/gaps change

## References

- **Charter:** `docs/business-os/business-os-charter.md`
- **Plan:** `docs/plans/business-os-kanban-plan.md`
- **Card schema:** `apps/business-os/src/lib/types.ts`
- **Evidence types:** `apps/business-os/src/types/evidence.ts`
- **Commit identity:** `apps/business-os/src/lib/commit-identity.ts`
