---
Type: Charter
Status: Canonical
Domain: Business OS
Last-reviewed: 2026-01-28
Primary code entrypoints:
  - apps/business-os/ — Next.js Kanban app
  - docs/business-os/ — Canonical document storage
  - .claude/skills/work-idea/ — Agent skill: convert idea to card
  - .claude/skills/propose-lane-move/ — Agent skill: propose lane transitions
  - .claude/skills/scan-repo/ — Agent skill: create business-relevant ideas
  - .claude/skills/update-business-plan/ — Agent skill: update business plans
  - .claude/skills/update-people/ — Agent skill: update people docs
---

# Business OS Charter

## Goals

Business OS is a **repo-native coordination system** for human and agent work across all business functions—engineering, ops, marketing, finance, supply chain, property, partnerships, hiring, legal. It provides:

1. **Single coordinated system** for opportunity management across all businesses (existing + new)
2. **Evidence-gated, risk-managed workflow** for non-coding work matching engineering rigor
3. **Progressive elaboration:** raw ideas → worked ideas → cards → staged execution → reflection → plan updates
4. **Visible and queryable execution state** via in-repo business plans, people responsibilities, and card status
5. **Human-agent collaboration:** both can generate, fact-find, plan, execute, and reflect on opportunities

**Design Principles:**

- **Repo-native:** All state lives in `docs/business-os/` as markdown + JSON
- **Evidence-based:** Every stage transition requires evidence documentation
- **Dual-audience:** `.user.md` optimized for humans, `.agent.md` optimized for LLMs
- **Lightweight:** Intentionally simple—not ERP complexity, just enough structure
- **Git-backed:** Full audit trail, rollback capability, PR workflow for all changes

## Core Flows

### 1. Idea Submission (Human or Agent)
- Submit raw idea via UI form or agent `/scan-repo` skill
- Idea saved to `docs/business-os/ideas/inbox/<slug>.md`
- Visible in Inbox lane on business boards

### 2. Idea → Card Workflow (Agent-assisted)
- Agent uses `/work-idea` skill to convert idea to card
- Creates card in `docs/business-os/cards/<ID>.user.md` + `.agent.md`
- Creates initial Fact-finding stage doc
- Idea moves to `ideas/worked/` with Card-ID reference

### 3. Card Lifecycle (Lane Progression)
- **Lanes:** Inbox → Fact-finding → Planned → In progress → Blocked → Done → Reflected
- Lane transitions require stage documentation (evidence-gated)
- Agent can propose moves via `/propose-lane-move` skill (Pete approves)
- Pete can move cards directly via UI editor

### 4. Board Views
- **Business boards:** Show all cards for a specific business (BRIK, SKYL, PLAT)
- **Global board:** Show P0/P1 priority cards across all businesses
- Computed ordering: Priority → Due date → Updated → Created → ID

### 5. Plan Updates (Evidence-driven)
- Business plans live at `docs/business-os/strategy/<BIZ>/plan.user.md`
- Agent uses `/update-business-plan` skill after scans
- Change requests via `/propose-change` create ideas with metadata

### 6. People Management
- People doc at `docs/business-os/people/people.user.md`
- Agent uses `/update-people` based on code attribution
- Tracks responsibilities, skills, availability

## Key Contracts

- **Plan:** `docs/plans/business-os-kanban-plan.md` — Phase 0 implementation plan
- **Agent workflows:** `docs/business-os/agent-workflows.md` — Agent skill usage guide
- **Card schema:** See `apps/business-os/src/lib/types.ts` → `Card` type
- **Idea schema:** See `apps/business-os/src/lib/types.ts` → `Idea` type
- **Lane definitions:** `Inbox | Fact-finding | Planned | In progress | Blocked | Done | Reflected`
- **Priority levels:** `P0 | P1 | P2 | P3 | P4 | P5` (P0 highest)
- **Stage doc requirements:** See plan BOS-19 for lane transition rules
- **Evidence source types:** See plan BOS-26 for evidence taxonomy

## Out of Scope

### Phase 0 Explicitly Excluded
- Agent APIs (no programmatic agent invocation)
- Multi-agent runners (Pete runs agents manually)
- Manual PR review/approval workflow (auto-merge after CI)
- Public access (local-only, Pete-only)
- Manual card ordering (always computed)

### Not in Business OS Domain
- CMS workboard (`apps/dashboard/src/pages/workboard.tsx`) — different scope
- Engineering-specific task tracking (use GitHub issues/projects)
- Real-time collaboration (Phase 0 is file-based, eventual consistency)
- ERP-style complexity (inventory, accounting, CRM integrations)

## Document Structure

```
docs/business-os/
├── cards/
│   ├── <ID>.user.md              # Human-readable card
│   ├── <ID>.agent.md             # Agent-readable card
│   └── <ID>/
│       ├── fact-finding.user.md  # Stage documentation
│       ├── planned.user.md
│       └── ...
├── ideas/
│   ├── inbox/*.md                # Raw ideas
│   └── worked/*.md               # Ideas with Card-ID
├── strategy/
│   ├── businesses.json           # Business catalog
│   └── <BIZ>/
│       ├── plan.user.md          # Business plan
│       └── plan.agent.md
├── people/
│   ├── people.user.md            # People doc
│   └── people.agent.md
└── scans/
    ├── last-scan.json            # Most recent scan results
    └── history/*.json            # Historical scans
```

## Governance

### Phase 0 Constraints
- **Identity:** Pete-only (hardcoded identity, no auth)
- **Runtime:** Local development only (`pnpm --filter @apps/business-os dev`)
- **Write model:** App commits to `work/business-os-store` → auto-PR → auto-merge after CI
- **Path authorization:** Server-side allowlist (writes restricted to `docs/business-os/**`)

### Quality Gates
- `pnpm docs:lint` validates all Business OS document headers
- TypeScript type checking enforced (`pnpm typecheck`)
- Targeted tests required before commits (`pnpm test -- <specific-test>`)
- No direct commits to main (PR workflow via `work/**` branches)

## Migration Notes

### Phase 1+ Requirements (Future)
- Hosted deployment (Cloudflare Pages)
- Multi-user access with authentication
- Real-time updates (WebSocket or SSE)
- Agent APIs for programmatic invocation
- Manual PR review workflow option

### Historical Context
- Derived from comprehensive requirements doc `repo-native-business-os-kanban-system-prompt.md`
- Plan created: 2026-01-28
- Status: Phase 0 MVP in progress (BOS-01 through BOS-14 complete as of 2026-01-28)
