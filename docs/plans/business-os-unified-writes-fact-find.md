---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: Platform / Business OS
Created: 2026-02-02
Last-updated: 2026-02-02
Feature-Slug: business-os-unified-writes
Related-Plan: docs/plans/business-os-unified-writes-plan.md
Business-Unit: BOS
---

# Business OS Unified Writes + Git Mirror — Fact-Find Brief

## Definitions

| Term | Definition |
|------|------------|
| **Source of Truth (SoT)** | D1 database — the single authoritative store for all Business OS entities |
| **Mirror** | `docs/business-os/` markdown files — periodic deterministic snapshots of D1 for traceability and backup |
| **Client** | Any consumer of Business OS data: UI users, agents, CI jobs, API callers |
| **Write Path** | How data enters the SoT: UI API (`/api/cards`) or Agent API (`/api/agent/cards`) |
| **Observability SLO** | Phase 1: P95 ≤ 30s (polling interval); Phase 2: P95 < 5s (SSE) |
| **Mirror lag** | Time between D1 write and git export commit; target ≤60 minutes |

## Scope

### Premise (Locked)

**D1 is canonical.** This is not a bidirectional sync project. It is:
1. **API unification** — all actors (UI users + agents) write through D1 APIs
2. **Git mirror** — scheduled export from D1 → `docs/business-os/` for audit trail

This premise is locked per `docs/plans/database-backed-business-os-plan.md` (Key Decision #1).

### Problem Statement

Currently, two representations exist that drift:
- **D1** — written by UI (create + edit), read by UI
- **Markdown** — written by agents (create + edit), read by agents

**Drift scenarios:**
1. Agent creates/edits a card via skill → markdown updated → D1 unchanged → **invisible to UI users**
2. UI user creates/edits a card → D1 updated → markdown unchanged → **invisible to agents** (until export, which isn't implemented)

Both create and edit operations are affected. The UI has functional create (`/cards/new`) and edit (`/cards/{id}/edit`) pages that write to D1.

### Goals

1. **Single write path to SoT** — all actors write to D1 via API
2. **Timely observability** — all clients see changes within polling interval (Phase 1: ≤30s; Phase 2: <5s)
3. **Git mirror for snapshots** — `docs/business-os/` provides periodic deterministic snapshots for traceability and backup; D1 `audit_log` remains the authoritative write-level audit
4. **Multi-writer support** — UI users and agents write without conflicts (optimistic locking)

### Non-goals

- Bidirectional sync (markdown is never a write path post-migration)
- Real-time collaborative editing (Google Docs style)
- Offline-first agents
- Sub-second latency

### Constraints

- D1 is the persistence layer (Cloudflare Pages)
- Agent skills run locally; D1 access requires authenticated API
- **Transition policy:** Old skills may still run, but their markdown output is non-authoritative; migration to API writes is required for functional visibility in UI

## Entity Coverage & Data Mapping

### Entities in Scope

| D1 Table | Count Estimate | Update Frequency | Mirror Target |
|----------|----------------|------------------|---------------|
| `business_os_cards` | ~50 now, ~500 eventual | ~100 edits/day | `cards/{id}.user.md` + `cards/{id}.agent.md` |
| `business_os_ideas` | ~30 now, ~200 eventual | ~20/day | `ideas/{location}/{id}.user.md` |
| `business_os_stage_docs` | ~100 now, ~1000 eventual | ~50/day | `cards/{card_id}/{stage}.user.md` |
| `business_os_comments` | ~200 now, unbounded | ~100/day | **Not mirrored** (D1 audit log suffices) |
| `business_os_audit_log` | unbounded | ~300/day (every write) | **Not mirrored** (D1 is audit truth) |
| `business_os_metadata` | ~20 keys | rare | **Not mirrored** |

**Sizing note:** With ~300 writes/day and 60-minute mirror lag, each export batch may contain ~20 changed entities. Full-table export remains viable at this scale; incremental export not required for Phase 1.

### D1 → Markdown Mapping

| D1 Field | Markdown Location | Notes |
|----------|-------------------|-------|
| `cards.payload_json` | YAML frontmatter + body in `.user.md` | Deterministic serialization required |
| `cards.payload_json` (LLM fields) | `.agent.md` body | Subset: context, transition criteria |
| `ideas.payload_json` | `ideas/{inbox|worked}/{id}.user.md` | Location derived from `status` |
| `stage_docs.payload_json` | `cards/{card_id}/{stage}.user.md` | Stage = `fact-finding`, `planned`, etc. |

### ID Allocation Reconciliation

| Source | Current Method | Post-Migration |
|--------|----------------|----------------|
| UI (D1) | Counter in `business_os_metadata` | Unchanged |
| Agents (markdown) | Scan-based (`ls cards/*.user.md`) | Call `/api/agent/allocate-id` |

**Risk:** Collision if agent uses scan-based allocation while D1 counter is ahead.
**Mitigation:** Agents MUST call ID allocation API; scan-based deprecated.

### Dual-File Convention Clarification

| Entity | `.user.md` | `.agent.md` | Rationale |
|--------|------------|-------------|-----------|
| Cards | ✅ Full card content | ✅ LLM context subset | Cards are worked on by both humans and agents |
| Ideas | ✅ Full idea content | ❌ Not created | Ideas are human-authored; agents read but don't need optimized format |
| Stage docs | ✅ Full stage content | ❌ Not created | Stage docs are structured evidence; the `.user.md` format is already agent-readable |

**Decision:** Stage docs do NOT get `.agent.md` files — they are already structured for both audiences.

### Deterministic Export Rules

Export must produce byte-identical output for identical D1 state. Rules:

1. **YAML frontmatter:**
   - Keys sorted alphabetically
   - Dates formatted as `YYYY-MM-DD` (no time component unless needed)
   - Arrays on single line for ≤3 items, multiline otherwise
   - Null/undefined fields omitted (not serialized as `null`)

2. **Markdown body:**
   - Single trailing newline
   - No trailing whitespace on lines
   - `\n` line endings (Unix)

3. **`.agent.md` derivation:**
   - Extract: `Title`, `ID`, `Lane`, `Business`, `Priority`
   - Add: `Context for LLM` (summary), `Transition Criteria`
   - Omit: full description, tags, dates (keep lightweight)

4. **Round-trip validation:**
   - `D1 → markdown → parse → D1` must produce identical `payload_json`
   - CI test required before export job goes live

## Repo Audit (Current State)

### Write Paths (Current)

| Actor | Operation | Endpoint/Mechanism | Writes To | SoT? |
|-------|-----------|-------------------|-----------|------|
| UI user | Create | `POST /api/cards` via `/cards/new` page | D1 | ✅ Yes |
| UI user | Edit | `PATCH /api/cards/[id]` via `/cards/{id}/edit` page | D1 | ✅ Yes |
| Agent | Create | `Write` tool → `docs/business-os/cards/*.md` | Filesystem | ❌ No |
| Agent | Edit | `Write` tool → `docs/business-os/cards/*.md` | Filesystem | ❌ No |

### Key Modules

**D1 Write Path:**
- `packages/platform-core/src/repositories/businessOsCards.server.ts` — `upsertCard()` function
- `packages/platform-core/src/repositories/businessOsIds.server.ts` — `allocateNextCardId()` function
- `apps/business-os/src/lib/entity-sha.ts` — `computeEntitySha()` for optimistic locking

**Markdown Write Path (to be deprecated):**
- `.claude/skills/_shared/card-operations.md` — scan-based ID allocation instructions
- `.claude/skills/work-idea/SKILL.md` — creates `.user.md` + `.agent.md` via `Write` tool

**Board Version Polling (existing):**
- `apps/business-os/src/app/api/board-version/route.ts` — returns `MAX(updated_at)` per business
- Polling interval: 30 seconds (client-side)
- Scope: cards + ideas for specified business
- No incremental fetch support (full refresh on version change)

### Optimistic Concurrency

**D1 path:** `computeEntitySha()` produces SHA-256 of deterministic JSON. API returns 409 if `baseFileSha` doesn't match current.

**Markdown path:** Git merge (incompatible with D1 approach).

**Post-migration:** Only D1 concurrency model applies. Git export is append-only (no conflict possible).

### Tests

- `apps/business-os/src/lib/optimistic-concurrency.test.ts` — D1 conflict detection
- `apps/business-os/src/lib/id-generator.test.ts` — counter-based allocation
- **Gap:** No tests for agent → API write path

## Blocking Architectural Decisions

### Decision 1: Agent Identity & Authorization (REQUIRED)

**Question:** What identity does an agent represent, and what can it do?

| Option | Identity | Authorization | Audit Actor | Complexity |
|--------|----------|---------------|-------------|------------|
| **A) API Key per session** | "agent" (generic) | All businesses, all entities | `actor: "agent"` | Low |
| **B) API Key per user** | User who invoked agent | User's permissions | `actor: "pete"` | Medium |
| **C) OAuth device flow** | User via OAuth | User's permissions | `actor: "pete"` | High |

**Recommendation:** Option A for Phase 1 (simplest), upgrade to B later if needed.

**Full identity contract (Option A):**

| Field | Value | Notes |
|-------|-------|-------|
| `audit_log.actor` | `"agent"` | Generic; no user attribution |
| `card.Owner` | User-provided in payload | Agent can set any owner (e.g., `"Pete"`) |
| Git export commit author | `Agent <agent@business-os.local>` | Or configurable via env |
| Git export commit message | `chore(bos): export D1 snapshot [changed: BRIK-ENG-0021, PLAT-ENG-0003]` | Include changed IDs |
| Impersonation allowed? | Yes — agent can set `Owner` to any value | Audit actor remains `"agent"` |

**Key distribution:** Environment variable `BOS_AGENT_API_KEY` in `.env.local`, not checked into git.

### Decision 2: Agent Write Interface

**Question:** How do agents call the D1 API?

| Option | Mechanism | Skill Changes | Compatibility |
|--------|-----------|---------------|---------------|
| **A) Direct HTTP** | Skill calls `WebFetch` to `/api/agent/cards` | Yes — replace `Write` with `WebFetch` | Breaking |
| **B) Local adapter** | Skill writes markdown; adapter intercepts and calls API | Minimal — adapter handles translation | Shim (temporary) |
| **C) MCP tool** | New MCP tool `business_os_create_card` | Yes — use tool instead of `Write` | New pattern |

**Recommendation:** Option A (direct HTTP) — cleanest long-term; Option B only if migration must be gradual.

### Decision 3: Real-Time Notification

**Question:** How do clients learn about changes?

| Option | Mechanism | Latency | Complexity |
|--------|-----------|---------|------------|
| **A) Enhanced polling** | `GET /api/board-changes?cursor=<id>` returns changed entities | ~30s (polling interval) | Low |
| **B) SSE** | `GET /api/board-events` streams changes | <1s | Medium |
| **C) Durable Objects** | WebSocket via Cloudflare DO | <1s | High |

**Recommendation:** Option A for Phase 1 (existing infrastructure); Option B for Phase 2 if latency matters.

**Current state:** `board-version` endpoint returns `MAX(updated_at)` but has no delta support.

**Cursor contract (Phase 1):**

Use `audit_log.id` as monotonic cursor (avoids timestamp precision issues):

```
GET /api/board-changes?cursor=12345&business=BRIK

Response:
{
  "cursor": 12389,  // Latest audit_log.id included
  "changes": {
    "cards": [
      { "id": "BRIK-ENG-0021", "action": "update", "entity": {...} },
      { "id": "BRIK-ENG-0022", "action": "create", "entity": {...} }
    ],
    "ideas": [],
    "stage_docs": [
      { "id": "BRIK-ENG-0021/fact-finding", "action": "update", "entity": {...} }
    ]
  }
}
```

**Client workflow:**
1. Initial load: `cursor=0` (or omit) → get all entities + latest cursor
2. Poll every 30s: `cursor=<last>` → get only changes since cursor
3. On 409 conflict: full refresh with `cursor=0`

## Acceptance Criteria

| Criterion | Metric | Phase 1 Target | Phase 2 Target |
|-----------|--------|----------------|----------------|
| Agent-created card visible in UI | Time from API call to UI render | ≤30s (polling) | <5s (SSE) |
| Agent-edited card visible in UI | Time from API call to UI render | ≤30s (polling) | <5s (SSE) |
| UI-created card visible in agent read | Time from UI save to agent API call | Immediate (API) | Immediate (API) |
| UI-edited card visible in agent read | Time from UI save to agent API call | Immediate (API) | Immediate (API) |
| Mirror export | Lag from D1 write to git commit | ≤60 minutes | ≤60 minutes |
| Conflicts detected | Optimistic locking returns 409 | 100% | 100% |
| No ID collisions | Cards with duplicate IDs | 0 | 0 |

## Rollout & Compatibility

### Phase 1: Agent API (Breaking Change for Skills)

1. Implement `/api/agent/cards` endpoint with API key auth
2. Implement `/api/agent/allocate-id` endpoint
3. Update `card-operations.md` to use API instead of `Write` tool
4. Update `/work-idea` skill to use API
5. **Skills using old pattern will create orphan markdown files** (not visible in UI)

### Phase 2: Skill Migration

1. Update all remaining skills (`/fact-find`, `/build-feature`, etc.)
2. Add deprecation warning to `Write` tool usage for `docs/business-os/`
3. Document migration guide for custom skills

### Phase 3: Git Mirror

1. Implement export job (CI scheduled, hourly)
2. Validate deterministic serialization (D1 → markdown → D1 round-trip)
3. Mark `docs/business-os/` as generated (add `.generated` marker or README)

### Phase 4: Deprecation

1. Remove scan-based ID allocation from skill docs
2. Remove `repo-writer.ts` (or gate behind local-only flag)
3. Update Business OS charter to reflect D1-canonical reality

### Backward Compatibility Contract

- **During Phase 1-2:** Old skills may still run but their markdown output is non-authoritative
- **Post Phase 4:** Direct markdown writes are unsupported; skills must use API
- **No shim provided** — clean break preferred over maintenance burden

### Orphan Write Prevention

To avoid silent drift from old skills creating orphan markdown:

1. **CI guard (Phase 1):** Add workflow that fails if a PR/commit modifies `docs/business-os/**` outside of the export job
2. **Skill-side warning (Phase 2):** Update shared helpers to emit warning when `Write` tool targets `docs/business-os/`
3. **Hard block (Phase 4):** Skill helpers refuse to write to `docs/business-os/`; only export job has write access

### Phase Reordering Consideration

**Risk:** If we complete skill migration before implementing export, there's a window where D1 is canonical but has no durable backup.

**Recommendation:** Ship git export (Phase 3) in parallel with or before completing skill migration (Phase 2). This provides:
- Backup/traceability from day one of D1-canonical
- Validation of deterministic serialization before full cutover
- Git history showing gradual migration progress

## Confidence Inputs (for /plan-feature)

### Implementation: 78%
- ✅ D1 schema and repositories exist
- ✅ Optimistic concurrency implemented
- ✅ Board version polling exists
- ✅ Cursor contract defined (audit_log.id based)
- ✅ Deterministic export rules specified
- ⚠️ Agent API endpoint not implemented
- ⚠️ Export job not implemented

**To reach 80%:** Implement `/api/agent/cards` endpoint (spike)

### Approach: 85%
- ✅ D1-canonical is locked
- ✅ Agent identity contract fully specified (actor, impersonation, git attribution)
- ✅ Agent write interface decision clear (direct HTTP recommended)
- ✅ Cursor-based delta API specified
- ✅ Rollout phases defined with parallel export
- ✅ Orphan write prevention strategy defined

**To reach 90%:** Validate API key distribution mechanism in local dev

### Impact: 85%
- ✅ Blast radius understood (skills + charter)
- ✅ Entity mapping defined with dual-file clarification
- ✅ Acceptance criteria testable with phase-specific targets
- ✅ CI guard prevents accidental drift
- ⚠️ Skill author communication needed

**To reach 90%:** Test migration with `/work-idea` skill end-to-end

## Planning Readiness

- **Status:** Ready-for-planning
- **Decisions specified (confirm or override):**
  1. Agent identity model: **Option A — generic API key** (full contract in Decision 1)
  2. Agent write interface: **Option A — direct HTTP** (clean break)
  3. Real-time notification: **Option A — cursor-based polling** (contract in Decision 3)
- **No blocking unknowns remain**
- **Recommended next step:** Proceed to `/plan-feature` with specified options

## Suggested Task Seeds

**Phase 1a: Agent API**
1. **BOS-UW-01:** Create `/api/agent/cards` endpoint with API key auth (POST create, PATCH edit)
2. **BOS-UW-02:** Create `/api/agent/allocate-id` endpoint
3. **BOS-UW-03:** Create `/api/board-changes` endpoint with cursor-based delta support

**Phase 1b: Git Export (parallel with skill migration)**
4. **BOS-UW-04:** Implement deterministic serialization (D1 → markdown) with round-trip test
5. **BOS-UW-05:** Implement git export CI job (hourly, commit to `main`)
6. **BOS-UW-06:** Add CI guard to reject PRs that modify `docs/business-os/**` manually

**Phase 2: Skill Migration**
7. **BOS-UW-07:** Update `card-operations.md` shared helper to use API for create + edit
8. **BOS-UW-08:** Migrate `/work-idea` skill to API writes (create)
9. **BOS-UW-09:** Migrate `/build-feature` skill to API writes (edit — task status updates)
10. **BOS-UW-10:** Migrate remaining skills (`/fact-find`, `/propose-lane-move`, etc.)

**Phase 3: Documentation & Cleanup**
11. **BOS-UW-11:** Update Business OS charter for D1-canonical reality
12. **BOS-UW-12:** Migration guide for skill authors
13. **BOS-UW-13:** Remove deprecated `repo-writer.ts` and scan-based ID allocation
