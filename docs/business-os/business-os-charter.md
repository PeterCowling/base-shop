---
Type: Charter
Status: Canonical
Domain: Business OS
Last-reviewed: 2026-01-31
Primary code entrypoints:
  - apps/business-os/ — Next.js Kanban app
  - docs/business-os/ — Read-only markdown mirror (exported from D1)
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

- **D1-canonical:** Cards, ideas, and stage docs live in D1 as the source of truth
- **Exported mirror:** `docs/business-os/` is a read-only markdown snapshot exported from D1
- **Evidence-based:** Every stage transition requires evidence documentation
- **Dual-audience:** `.user.md` optimized for humans, `.agent.md` optimized for LLMs
- **Lightweight:** Intentionally simple—not ERP complexity, just enough structure
- **PR-audited:** Export job opens PRs for markdown snapshots; Git provides audit/rollback

## Source of Truth and Access

- **Canonical data:** D1 for cards, ideas, and stage docs.
- **Read-only mirror:** Markdown under `docs/business-os/` is exported from D1; do not edit these files directly.
- **How to interact:** Use the Business OS UI or the agent API (`/api/agent/*`) for creates/updates.
- **Fail-closed agents:** If the API is unavailable, skills stop with a clear error instead of writing markdown.

## Core Flows

### 1. Idea Submission (Human or Agent)
- Submit raw idea via UI form or agent `/scan-repo` skill
- Idea stored in D1 via API or UI
- Export job mirrors ideas to `docs/business-os/ideas/` for review
- Visible in Inbox lane on business boards

### 2. Idea → Card Workflow (Agent-assisted)
- Agent uses `/work-idea` skill to convert idea to card
- Creates card + initial fact-finding stage doc in D1 via agent API
- Export job mirrors card + stage doc into `docs/business-os/cards/`
- Idea moves to `ideas/worked/` in the exported mirror

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
│   ├── <ID>.user.md              # Human-readable card (exported from D1)
│   ├── <ID>.agent.md             # Agent-readable card (exported from D1)
│   └── <ID>/
│       ├── fact-finding.user.md  # Stage documentation (exported from D1)
│       ├── planned.user.md
│       └── ...
├── ideas/
│   ├── inbox/*.md                # Raw ideas (exported from D1)
│   └── worked/*.md               # Ideas with Card-ID (exported from D1)
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

**Note:** `strategy/`, `people/`, and `scans/` remain repo-native documents. Cards/ideas/stage docs are exported mirrors of D1 data.

## Governance

### Phase 0 Constraints
- **Identity:** Pete-only (hardcoded identity, no auth)
- **Runtime:** Local development only (`pnpm --filter @apps/business-os dev`)
- **Write model:** UI/API writes to D1 → export job opens PRs for markdown mirror → auto-merge after CI
- **Path authorization:** Agent API auth required for card/idea/stage-doc writes; direct markdown edits are blocked by CI guard

### Quality Gates
- `pnpm docs:lint` validates exported Business OS document headers
- TypeScript type checking enforced (`pnpm typecheck`)
- Targeted tests required before commits (`pnpm test -- <specific-test>`)
- No direct commits to `staging` or `main` (ship via pipeline PRs)
- CI guard rejects non-export changes to `docs/business-os/cards/` and `docs/business-os/ideas/`

## Migration Notes

### Phase 1+ Requirements (Future)
- Hosted deployment (Cloudflare Pages)
- Multi-user access with authentication
- Real-time updates (WebSocket or SSE)
- Manual PR review workflow option

### Historical Context
- Derived from comprehensive requirements doc `repo-native-business-os-kanban-system-prompt.md`
- Plan created: 2026-01-28
- Status: Phase 0 MVP in progress (BOS-01 through BOS-14 complete as of 2026-01-28)
