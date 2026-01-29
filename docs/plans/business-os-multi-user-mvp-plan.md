---
Type: Plan
Status: Draft
Domain: Platform
Created: 2026-01-29
Last-updated: 2026-01-29
Feature-Slug: business-os-multi-user-mvp
Overall-confidence: TBD
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Related-Docs:
  - docs/plans/business-os-strategic-review.md
  - docs/plans/business-os-phase-2-plan.md
---

# Business OS Multi-User MVP Plan

## Summary

Transform Business OS from local single-user + agent system into a shared 5-user MVP with git-backed collaboration, enforced identity, collision-proof operations, and in-system agent coordination. No paid infrastructure ($0 constraint). Use free tunnel (TryCloudflare/ngrok) for remote access. Keep git as only source of truth. Polling-based updates (no SSE requirement).

This plan implements the expert review recommendations from 2026-01-29.

## Goals

- **5 real users** can log in, capture ideas, claim tasks, mark complete, request agent help
- **Enforced server-side auth** - no forged cookies, permission checks in all mutations
- **Collision-proof ID allocation** - concurrent operations never produce duplicate IDs
- **Serialized git writes** - no index/lock corruption under concurrent load
- **In-system agent coordination** - users request agent work via UI, see outputs in app
- **$0 infrastructure** - free tunnel only, no DB/queue/serverless yet
- **Polling-based updates** - works with TryCloudflare (no SSE dependency)

## Non-goals

- Database/queue infrastructure (next phase after value proven)
- Email-based auth/invites (adds external service dependency)
- Real-time SSE/WebSocket (not supported by free tunnel)
- GitHub API integration (keep local git for MVP)
- Mobile native apps (PWA sufficient for MVP)
- Multi-host/scaling (single writer acceptable for 5 users)

## Constraints & Assumptions

**Constraints:**
- **$0 infrastructure spend** - only AI API costs allowed
- **Single host** - one machine with repo checkout, all writes serialized
- **Free tunnel** - TryCloudflare or ngrok free tier (no SSE, accept polling)
- **Git-only storage** - no DB introduced in this phase
- **5-user target** - optimize for 5 concurrent users, not 500

**Assumptions:**
- Pete hosts on a reliable personal machine (or free-tier cloud VM)
- Users trust invite-only auth (no public signup)
- Agent runtime runs on same host as web server
- Polling every 5-10s acceptable for activity updates
- Network latency via tunnel acceptable for MVP validation

## Expert Review Context

On 2026-01-29, expert review confirmed:

**Strengths:**
- Git-backed artifacts provide auditability, diffability, low vendor risk
- RepoReader/RepoWriter boundary is clean separation
- UI already "multi-user shaped" (user concept, permissions, mobile/keyboard UX)
- Phase 0-2 foundation is structurally sound

**Identified breaks (when scaling to 5 users):**
1. **Identity:** Cookie-based user switching is forgeable; permission checks only in UI (not server actions)
2. **ID collisions:** "Scan directory, pick next number" allocator fails under concurrency
3. **Git serialization:** Simultaneous git add/commit produces index/lock contention
4. **Agent integration:** "Agent work happens in Pete's terminal" doesn't scale socially
5. **SSE assumption:** Cloudflare Quick Tunnels explicitly don't support SSE

**Recommended approach:**
Single-host, git-only, multi-user MVP with minimal rewrites. Add just enough auth + locking + agent tasking to feel like real shared system. Keep filesystem + git semantics (current core). Evolve to GitHub API/DB later once value demonstrated.

## Proposed Approach

### Architecture

**Storage:** Git-only, filesystem-backed (no DB yet)
**Auth:** Invite-only login (username + passcode, no email service)
**Writes:** All git operations serialized via repo lock (`docs/business-os/.locks/repo.lock`)
**Updates:** Polling for repo HEAD + per-entity activity (every 5-10s)
**Agent runtime:** Local daemon consuming git-backed queue (`docs/business-os/agent-queue/`)
**Hosting:** Single Next.js instance on one host, exposed via free tunnel
**User access:** TryCloudflare or ngrok free tier

### Key design: Git-backed agent queue

Add two new directories:

**`docs/business-os/agent-queue/`**
- Each file is a task request (YAML frontmatter + markdown body)
- Created by UI server actions when user clicks "Ask agent"
- Consumed by agent runner daemon (polls queue directory)

**`docs/business-os/agent-runs/`**
- Append-only run logs + outputs (links to affected entity IDs)
- Written by agent runner as it progresses
- UI polls for status updates and displays in entity pages

This gives:
- Coordination without Redis/SQS (git is queue)
- Full audit trail (every request + output is versioned)
- A place for agents to "speak" that UI can render

### Data model additions

**`docs/business-os/_meta/counters.json`** (NEW)
```json
{
  "BRIK": {
    "ideas": 23,
    "cards": 15
  },
  "PLAT": {
    "ideas": 8,
    "cards": 5
  }
}
```
Updated atomically under repo lock. Source of truth for next ID allocation.

**`docs/business-os/people/users.json`** (NEW) or extend existing people docs
```json
{
  "users": [
    {"id": "pete", "name": "Pete", "role": "admin", "passcode": "..."},
    {"id": "cristiana", "name": "Cristiana", "role": "user", "passcode": "..."},
    {"id": "avery", "name": "Avery", "role": "user", "passcode": "..."}
  ]
}
```
Invite-only. Passcode hashed (bcrypt). Stored in repo (private repo assumption).

**`docs/business-os/comments/{entityType}/{id}/{timestamp}-{author}.md`** (NEW)
```markdown
---
Type: Comment
Author: pete
Entity: BRIK-ENG-0001
Created: 2026-01-29T14:30:00Z
---

This looks good but we need to confirm GDPR compliance before moving to Planned.
```
Comments as first-class versioned artifacts. Threads rendered on entity pages.

**`docs/business-os/agent-queue/{timestamp}-{initiator}-{action}.md`** (NEW)
```markdown
---
Type: AgentTask
ID: QUEUE-20260129-143000-pete-work-idea
Action: work-idea
Target: BRIK-OPP-0003
Initiator: pete
Status: pending
Created: 2026-01-29T14:30:00Z
---

# Work Idea: BRIK-OPP-0003

User requested agent to work up this raw idea into a card.

## Optional instructions

Focus on technical feasibility and integration complexity.
```

**`docs/business-os/agent-runs/{queue-id}/run.log.md`** (NEW)
```markdown
---
Type: AgentRun
QueueID: QUEUE-20260129-143000-pete-work-idea
Status: in-progress
Started: 2026-01-29T14:30:05Z
LastUpdated: 2026-01-29T14:32:10Z
---

## Progress

[14:30:05] Started work-idea task for BRIK-OPP-0003
[14:30:12] Reading idea file...
[14:31:45] Generated card: BRIK-ENG-0016
[14:32:10] Committed card + stage doc
[14:32:10] Status: complete

## Outputs

- Card: BRIK-ENG-0016
- Stage doc: docs/business-os/cards/BRIK-ENG-0016/stage-docs/01-fact-finding.md
- Commit: abc123def456
```

### Operational changes

**Current (Phase 0-2):**
- User: Pete edits markdown directly or via local UI
- Agent: Pete runs Claude Code CLI in terminal with `/work-idea`, `/plan-feature`, etc.
- Identity: Dev cookie (forgeable)
- ID allocation: Manual or "scan dir + increment"
- Git writes: Uncoordinated (only one user, so no collision yet)
- Updates: Manual page refresh

**MVP (Phase 3):**
- User: 5 users log in via invite-only auth, use UI buttons ("Claim", "Complete", "Ask agent")
- Agent: Daemon polls `agent-queue/`, executes skills, writes outputs + commits to `agent-runs/`
- Identity: Session-based auth with server-side permission checks on all mutations
- ID allocation: Atomic counter updates under repo lock
- Git writes: Serialized via `docs/business-os/.locks/repo.lock` (single writer guarantee)
- Updates: Client polls `/api/activity` every 5-10s, shows "New activity" badge

## Epic Breakdown

### Epic A: Production Run Mode + Config

Make Business OS runnable as a long-lived service (not just dev mode).

**A1. Production run mode + repoRoot config** (S, IMPLEMENT)
- Replace `process.cwd().replace(...)` with env var config
- `BUSINESS_OS_REPO_ROOT=/abs/path/to/repo`
- `BUSINESS_OS_WORKTREE_ROOT=/abs/path/to/worktree` (optional)
- DoD: `pnpm build && pnpm start` works on clean machine; repo path not inferred from CWD

**A2. Health endpoint** (S, IMPLEMENT)
- Add `GET /api/healthz` returning: git HEAD, repo lock status, last agent-run timestamp
- DoD: Can be used by tunnel/uptime checker

**A3. Remote access runbook** (S, DOCUMENT)
- Document + script: `./ops/tunnel-trycloudflare.sh` (or ngrok)
- How to rotate URL, who to share with
- DoD: New user can access app in <5 minutes from README

### Epic B: Real Authentication + Enforced Identity

Replace dev cookie switching with real invite-only auth.

**B1. Invite-only auth system** (M, IMPLEMENT)
- Add login page with username + passcode
- Store user list in `docs/business-os/people/users.json` (bcrypt hashed passcodes)
- Session-based auth (signed cookies or JWT)
- DoD: UserSwitcher removed; all pages require auth; hard deny unauthenticated

**B2. Server-side authorization on all mutations** (M, IMPLEMENT)
- Every server action/API route validates: authenticated user + permission to mutate entity
- Use `canEditCard()` pattern for all mutation types (ideas, cards, comments, agent-queue)
- DoD: Can't call `updateIdea`/`writeCard` for someone else via curl if not permitted; failures user-friendly

**B3. Audit attribution standard** (S, IMPLEMENT)
- Standardize commit metadata: `Author = acting human (or "Business OS Agent")`
- Commit message includes `Actor:`, `Initiator:`, and entity ID
- DoD: From git history alone, can answer "who did what" and "which agent did it"

### Epic C: Concurrency + Correctness for 5 Users

Prevent ID collisions, git corruption, and silent overwrites.

**C1. Global repo write lock** (M, IMPLEMENT)
- Implement lock file: `docs/business-os/.locks/repo.lock`
- Acquire via atomic create (`wx` mode in Node.js fs)
- Include timestamp + pid + holder info in lock file
- TTL stale-lock recovery (if lock held >30s and pid dead, force release)
- DoD: Concurrent writes from 2 browsers + agent never corrupt git state; if lock held, UI shows "busy, retrying..." not stack trace

**C2. Collision-proof ID allocation** (M, IMPLEMENT)
- Add `docs/business-os/_meta/counters.json` with per-business + per-type counters
- Update counters atomically under repo lock
- DoD: 20 simultaneous "capture idea" requests produce 20 unique IDs (no duplicates)

**C3. Optimistic concurrency for long-form edits** (M, IMPLEMENT)
- Include `baseCommit` (or `fileSha`) in edit forms
- On save, reject if file changed since load; show diff/refresh option
- DoD: No silent overwrite of another user's edits

### Epic D: Light-Touch User Workflow

Add one-click actions so users don't need to edit markdown.

**D1. Claim/Accept task button** (S, IMPLEMENT)
- Quick action on card:
  - If `Owner` empty: "Claim" (sets Owner to current user)
  - If `Owner = me` but `Lane = Inbox`: "Accept" (moves to In progress)
- DoD: Users can take ownership without editing markdown

**D2. Mark complete button** (S, IMPLEMENT)
- Quick action: moves `Lane` to Done, adds `Completed-Date`
- DoD: User can complete in one click; board reflects change

**D3. "My Work" view** (M, IMPLEMENT)
- Route `/me` showing: assigned cards (not Done), due soon, tasks waiting acceptance
- DoD: Non-admin user can operate without understanding whole board

### Epic E: User ↔ Agent Collaboration Inside System

Make agent work visible and requestable from UI.

**E1. Comments as first-class git artifacts** (M, IMPLEMENT)
- Add `docs/business-os/comments/{entityType}/{id}/{timestamp}-{author}.md`
- Render thread on card/idea pages
- DoD: Any user can leave comment; comments visible to all permitted users

**E2. "Ask agent" button that creates queue item** (M, IMPLEMENT)
- On idea/card page: "Agent: work this idea", "Agent: break into tasks", "Agent: draft plan"
- Creates file in `agent-queue/` with: action type, target entity, initiator user, optional instructions
- DoD: User can request agent work without leaving browser

**E3. Agent runner daemon** (L, IMPLEMENT)
- Node script/service that:
  - Polls `agent-queue/` every 5s
  - Locks repo
  - Executes appropriate skill (Claude Code CLI or equivalent)
  - Writes outputs + commits
  - Writes run log to `agent-runs/`
- DoD: Queued task becomes visible output + git commit without admin touch

**E4. Agent run status UI (polling)** (M, IMPLEMENT)
- Show on entity pages: latest runs, current run status if any, last message from run log
- Client polls `/api/agent-runs/{id}/status` every 5-10s when run active
- DoD: User can see "agent is working / finished / failed" without refresh spam

### Epic F: Code Progress Updates via Agents

Show code commits linked to cards automatically.

**F1. Commit-to-card linking** (M, IMPLEMENT)
- Parse git log for commits referencing card ID (e.g., `BRIK-003`)
- Display "Recent activity" on card page
- DoD: When agent commits code mentioning card ID, card shows progress automatically (no manual updates)

**F2. Auto-progress notes (optional)** (S, IMPLEMENT)
- Agent runner appends short "Progress" comment file after each code commit batch
- DoD: Humans never write "I did X"; emitted by agent

## Task Summary

| Task ID | Epic | Description | Confidence | Effort | Status | Depends on |
|---------|------|-------------|------------|--------|--------|------------|
| MVP-A1 | A | Production run mode + repoRoot config | TBD | S | Pending | - |
| MVP-A2 | A | Health endpoint | TBD | S | Pending | MVP-A1 |
| MVP-A3 | A | Remote access runbook | TBD | S | Pending | MVP-A1 |
| MVP-B1 | B | Invite-only auth system | TBD | M | Pending | MVP-A1 |
| MVP-B2 | B | Server-side authorization on all mutations | TBD | M | Pending | MVP-B1 |
| MVP-B3 | B | Audit attribution standard | TBD | S | Pending | MVP-B1 |
| MVP-C1 | C | Global repo write lock | TBD | M | Pending | MVP-A1 |
| MVP-C2 | C | Collision-proof ID allocation | TBD | M | Pending | MVP-C1 |
| MVP-C3 | C | Optimistic concurrency for long-form edits | TBD | M | Pending | MVP-C1 |
| MVP-D1 | D | Claim/Accept task button | TBD | S | Pending | MVP-B2, MVP-C1 |
| MVP-D2 | D | Mark complete button | TBD | S | Pending | MVP-B2, MVP-C1 |
| MVP-D3 | D | "My Work" view | TBD | M | Pending | MVP-B1, MVP-D1 |
| MVP-E1 | E | Comments as first-class git artifacts | TBD | M | Pending | MVP-B2, MVP-C1 |
| MVP-E2 | E | "Ask agent" button creates queue item | TBD | M | Pending | MVP-B2, MVP-C1 |
| MVP-E3 | E | Agent runner daemon | TBD | L | Pending | MVP-C1, MVP-E2 |
| MVP-E4 | E | Agent run status UI (polling) | TBD | M | Pending | MVP-E3 |
| MVP-F1 | F | Commit-to-card linking | TBD | M | Pending | MVP-E3 |
| MVP-F2 | F | Auto-progress notes (optional) | TBD | S | Pending | MVP-E3 |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Tasks

### MVP-A1: Production run mode + repoRoot config

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/lib/repo/RepoReader.ts`
  - `apps/business-os/src/lib/repo/RepoWriter.ts`
  - `apps/business-os/src/lib/current-user.ts`
  - `.env.example` (NEW)
  - `README.md` (config documentation)
- **Depends on:** -
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] All `process.cwd()` usage replaced with `process.env.BUSINESS_OS_REPO_ROOT`
  - [ ] `.env.example` documents required env vars
  - [ ] `pnpm build && pnpm start` works on clean machine (no CWD assumptions)
  - [ ] Dev mode still works (defaults to `process.cwd()` if env var not set)
- **Test plan:**
  - Unit: Test RepoReader/RepoWriter with explicit repoRoot path
  - Integration: Build + run on separate machine, verify repo operations work
- **Rollout / rollback:**
  - Rollout: Deploy with env var set; backwards compatible (dev mode unaffected)
  - Rollback: Remove env var usage, revert to CWD-based paths
- **Documentation impact:**
  - Update README.md with "Production Deployment" section
  - Add `.env.example` with required vars
- **Notes / references:**
  - Current pattern: `const repoRoot = process.cwd().replace(/\/apps\/business-os$/, "")`
  - New pattern: `const repoRoot = process.env.BUSINESS_OS_REPO_ROOT || process.cwd()`
  - Expert review: "Replace process.cwd().replace(...) with single config source"

### MVP-A2: Health endpoint

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/app/api/healthz/route.ts` (NEW)
- **Depends on:** MVP-A1
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] `GET /api/healthz` returns 200 with JSON body
  - [ ] Response includes: `gitHead`, `repoLockStatus`, `lastAgentRunTimestamp`
  - [ ] Can be used by uptime checker (e.g., UptimeRobot free tier)
- **Test plan:**
  - Unit: Test healthz route handler directly
  - Integration: `curl http://localhost:3020/api/healthz` returns expected JSON
- **Rollout / rollback:**
  - Rollout: Add route, no side effects (read-only endpoint)
  - Rollback: Remove route file
- **Documentation impact:**
  - Add to runbook: "Monitoring" section with healthz endpoint usage
- **Notes / references:**
  - Similar pattern: `apps/brikette/src/app/api/health/route.ts` (if exists)
  - Expert review: "Add GET /api/healthz returning: git HEAD, repo lock status, last agent-run timestamp"

### MVP-A3: Remote access runbook

- **Type:** DOCUMENT
- **Affects:**
  - `docs/ops/tunnel-setup.md` (NEW)
  - `ops/tunnel-trycloudflare.sh` (NEW)
  - `README.md` (link to runbook)
- **Depends on:** MVP-A1
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] Document includes step-by-step: install cloudflared, run tunnel, share URL
  - [ ] Script automates tunnel creation (one command)
  - [ ] Runbook documents: URL rotation, access control, tunnel restart on failure
  - [ ] New user can access app in <5 minutes from README
- **Test plan:**
  - Manual: Follow runbook on fresh machine, verify tunnel + app access
- **Rollout / rollback:**
  - Rollout: Documentation only, no code changes
  - Rollback: N/A (docs can be reverted)
- **Documentation impact:**
  - README.md: Add "Remote Access (Free Tunnel)" section
  - New doc: `docs/ops/tunnel-setup.md`
- **Notes / references:**
  - Cloudflare Quick Tunnels: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/
  - ngrok free tier: https://ngrok.com/pricing
  - Expert review: "TryCloudflare for 'today-level speed', but no SSE support"

### MVP-B1: Invite-only auth system

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/app/login/page.tsx` (NEW)
  - `apps/business-os/src/app/api/auth/login/route.ts` (NEW)
  - `apps/business-os/src/app/api/auth/logout/route.ts` (NEW)
  - `apps/business-os/src/middleware.ts` (NEW or UPDATE)
  - `apps/business-os/src/lib/auth.ts` (NEW)
  - `docs/business-os/people/users.json` (NEW or extend existing)
  - `apps/business-os/src/components/user/UserSwitcher.tsx` (REMOVE or ADMIN-ONLY)
- **Depends on:** MVP-A1
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] Login page with username + passcode fields
  - [ ] User list stored in `docs/business-os/people/users.json` with bcrypt hashed passcodes
  - [ ] Session-based auth (signed cookies via `iron-session` or similar)
  - [ ] Middleware redirects unauthenticated requests to `/login`
  - [ ] UserSwitcher removed from UI (or admin-only impersonation behind env flag)
  - [ ] All pages require auth; hard deny unauthenticated
- **Test plan:**
  - Unit: Test auth helpers (`hashPassword`, `verifyPassword`, `createSession`)
  - Integration: Login with valid user → access granted; invalid user → rejected
  - E2E: Unauthenticated user redirected to login; authenticated user sees board
- **Rollout / rollback:**
  - Rollout: Feature flag `BUSINESS_OS_AUTH_ENABLED=true` (default false for dev mode)
  - Rollback: Set flag to false, revert middleware
- **Documentation impact:**
  - README.md: Add "Authentication" section (invite-only, how to add users)
  - `docs/business-os/people/users.json`: Document schema
- **Notes / references:**
  - Expert review: "simplest: username + passcode (no email)"
  - Library options: `iron-session` (signed cookies), `bcryptjs` (hashing)
  - Existing user data: `apps/business-os/src/lib/current-user.ts` (USERS object)

### MVP-B2: Server-side authorization on all mutations

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/app/api/ideas/create/route.ts`
  - `apps/business-os/src/app/api/ideas/update/route.ts`
  - `apps/business-os/src/app/api/cards/create/route.ts`
  - `apps/business-os/src/app/api/cards/update/route.ts`
  - `apps/business-os/src/lib/repo/RepoWriter.ts` (add permission checks)
  - `apps/business-os/src/lib/permissions.ts` (NEW - centralize auth logic)
- **Depends on:** MVP-B1
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] Every server action/API route validates authenticated user
  - [ ] Every mutation validates permission to edit target entity (use `canEditCard()` pattern)
  - [ ] Unauthorized requests return 403 with user-friendly error message
  - [ ] Can't call `updateIdea`/`writeCard` for someone else via curl/Postman if not permitted
- **Test plan:**
  - Unit: Test permission helpers (`canEditIdea`, `canEditCard`, `canCreateComment`)
  - Integration: Attempt to update another user's card → 403; update own card → 200
  - E2E: Non-owner tries to edit card via UI → disabled; via API → 403
- **Rollout / rollback:**
  - Rollout: Gradual - add checks to one route at a time, test before next
  - Rollback: Remove permission checks, revert to previous version
- **Documentation impact:**
  - `docs/architecture.md`: Document authorization layer
- **Notes / references:**
  - Existing pattern: `canEditCard()` in `apps/business-os/src/lib/current-user.ts`
  - Extend to: `canEditIdea()`, `canCreateComment()`, `canRequestAgent()`
  - Expert review: "Easy to forget to enforce permissions in server actions/routes"

### MVP-B3: Audit attribution standard

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/lib/repo/RepoWriter.ts` (commit message format)
  - All server actions that call RepoWriter (pass actor info)
- **Depends on:** MVP-B1
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] Commit messages include: `Actor: {username}`, `Initiator: {username}`, entity ID
  - [ ] Git author set to acting human (or "Business OS Agent" for agent commits)
  - [ ] From git log alone, can answer "who did what" and "which agent initiated it"
- **Test plan:**
  - Unit: Test commit message builder with actor/initiator info
  - Integration: Perform mutation, verify git log shows correct attribution
- **Rollout / rollback:**
  - Rollout: Update commit message format, backwards compatible (old commits still valid)
  - Rollback: Revert to previous format (no data loss)
- **Documentation impact:**
  - `docs/architecture.md`: Document commit message convention
- **Notes / references:**
  - Current pattern: `Co-authored-by: Claude Sonnet 4.5 <noreply@anthropic.com>`
  - New pattern: `Actor: pete\nInitiator: pete\nEntity: BRIK-ENG-0001\nCo-authored-by: ...`
  - Expert review: "Author = acting human (or 'Business OS Agent')"

### MVP-C1: Global repo write lock

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/lib/repo/RepoLock.ts` (NEW)
  - `apps/business-os/src/lib/repo/RepoWriter.ts` (integrate lock acquisition)
  - `docs/business-os/.locks/` (NEW directory for lock files)
- **Depends on:** MVP-A1
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] Lock file: `docs/business-os/.locks/repo.lock` acquired via atomic `wx` create
  - [ ] Lock includes: timestamp, pid, holder info (user + action)
  - [ ] TTL stale-lock recovery: if lock held >30s and pid dead, force release
  - [ ] Concurrent writes from 2 browsers + agent never corrupt git state
  - [ ] If lock held, UI shows "busy, retrying..." not stack trace
- **Test plan:**
  - Unit: Test lock acquisition, release, stale-lock recovery
  - Integration: Spawn 3 concurrent write requests, verify all succeed and produce clean git history
  - Load: Simulate 20 concurrent requests, verify no lock failures or corruption
- **Rollout / rollback:**
  - Rollout: Enable lock via feature flag `BUSINESS_OS_REPO_LOCK_ENABLED=true`
  - Rollback: Disable flag (gracefully degrade to unlocked mode for single user)
- **Documentation impact:**
  - `docs/architecture.md`: Document locking strategy
- **Notes / references:**
  - Node.js fs atomic create: `fs.open(path, 'wx', ...)` (fails if file exists)
  - Stale lock detection: check if pid in lock file is alive via `process.kill(pid, 0)`
  - Expert review: "Git operations need to be single-writer"

### MVP-C2: Collision-proof ID allocation

- **Type:** IMPLEMENT
- **Affects:**
  - `docs/business-os/_meta/counters.json` (NEW)
  - `apps/business-os/src/lib/repo/IDAllocator.ts` (NEW)
  - `apps/business-os/src/lib/repo/RepoWriter.ts` (use IDAllocator)
  - All server actions that create ideas/cards (integrate IDAllocator)
- **Depends on:** MVP-C1
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] `docs/business-os/_meta/counters.json` stores per-business + per-type counters
  - [ ] Counter updates atomic (under repo lock)
  - [ ] 20 simultaneous "capture idea" requests produce 20 unique IDs (no duplicates)
- **Test plan:**
  - Unit: Test IDAllocator increment logic
  - Integration: Sequential creates produce sequential IDs
  - Load: 20 concurrent creates → all unique IDs, no skips or duplicates
- **Rollout / rollback:**
  - Rollout: Initialize counters from existing max IDs, enable atomically
  - Rollback: Revert to "scan directory" allocator (accept collision risk for rollback period)
- **Documentation impact:**
  - `docs/architecture.md`: Document ID allocation strategy
- **Notes / references:**
  - Current pattern: "Scan directory, pick next number" (collision-prone)
  - New pattern: Atomic counter increment under repo lock
  - Expert review: "Any 'scan the directory, pick next number' allocator will collide"

### MVP-C3: Optimistic concurrency for long-form edits

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/app/cards/[id]/edit/page.tsx` (add baseCommit field)
  - `apps/business-os/src/app/ideas/[id]/edit/page.tsx` (add baseCommit field)
  - `apps/business-os/src/lib/repo/RepoWriter.ts` (add concurrency check)
  - `apps/business-os/src/components/ConflictDialog.tsx` (NEW - show diff + options)
- **Depends on:** MVP-C1
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] Edit forms include hidden `baseCommit` field (git SHA of file when loaded)
  - [ ] On save, check if current file SHA matches baseCommit
  - [ ] If mismatch: reject save, show ConflictDialog with diff + options (refresh, force save, merge)
  - [ ] No silent overwrite of another user's edits
- **Test plan:**
  - Unit: Test conflict detection logic (baseCommit vs currentCommit)
  - Integration: User A loads card, User B edits card, User A saves → conflict detected
  - E2E: Simulate concurrent edit, verify UI shows conflict dialog
- **Rollout / rollback:**
  - Rollout: Enable check on save (non-breaking, just adds validation)
  - Rollback: Remove check (revert to last-write-wins)
- **Documentation impact:**
  - User guide: "Handling edit conflicts"
- **Notes / references:**
  - Similar to git merge conflict resolution
  - Alternative: use file mtime instead of commit SHA (less reliable)
  - Expert review: "Include baseCommit (or fileSha) in edit forms"

### MVP-D1: Claim/Accept task button

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/components/card-detail/CardDetail.tsx` (add buttons)
  - `apps/business-os/src/app/api/cards/claim/route.ts` (NEW)
  - `apps/business-os/src/app/api/cards/accept/route.ts` (NEW)
- **Depends on:** MVP-B2, MVP-C1
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] If `Owner` empty (or unassigned): show "Claim" button → sets Owner to current user
  - [ ] If `Owner = me` and `Lane = Inbox`: show "Accept" button → moves Lane to "In progress"
  - [ ] Users can take ownership without editing markdown
- **Test plan:**
  - Unit: Test claim/accept mutations
  - Integration: Click "Claim" → Owner updated; click "Accept" → Lane updated
  - E2E: Full user flow (find unassigned card, claim, accept, verify board reflects changes)
- **Rollout / rollback:**
  - Rollout: Add buttons, non-breaking (edit form still works)
  - Rollback: Hide buttons
- **Documentation impact:**
  - User guide: "Claiming and accepting tasks"
- **Notes / references:**
  - Expert review: "users can take ownership without editing markdown"

### MVP-D2: Mark complete button

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/components/card-detail/CardDetail.tsx` (add button)
  - `apps/business-os/src/app/api/cards/complete/route.ts` (NEW)
- **Depends on:** MVP-B2, MVP-C1
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] Show "Mark Complete" button on card detail (if owner or admin)
  - [ ] Click → moves `Lane` to "Done", adds `Completed-Date` timestamp
  - [ ] User can complete in one click; board reflects change
- **Test plan:**
  - Unit: Test complete mutation
  - Integration: Click "Complete" → card moves to Done lane with timestamp
  - E2E: Complete card from In progress → verify appears in Done lane
- **Rollout / rollback:**
  - Rollout: Add button, non-breaking
  - Rollback: Hide button
- **Documentation impact:**
  - User guide: "Marking tasks complete"
- **Notes / references:**
  - Expert review: "user can complete in one click"

### MVP-D3: "My Work" view

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/app/me/page.tsx` (NEW)
  - `apps/business-os/src/components/my-work/MyWorkView.tsx` (NEW)
- **Depends on:** MVP-B1, MVP-D1
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] Route `/me` shows:
    - Assigned cards (not Done)
    - Due soon (next 7 days)
    - Tasks waiting acceptance (Owner = me, Lane = Inbox)
  - [ ] Non-admin user can operate without understanding whole board
- **Test plan:**
  - Unit: Test MyWorkView data filtering
  - Integration: Assign card to user → appears in /me; complete card → disappears
  - E2E: User navigates to /me, sees only their work
- **Rollout / rollback:**
  - Rollout: Add route, link from nav
  - Rollback: Remove route
- **Documentation impact:**
  - User guide: "My Work view"
- **Notes / references:**
  - Similar to GitHub "Assigned to me" filter
  - Expert review: "non-admin user can operate without understanding whole board"

### MVP-E1: Comments as first-class git artifacts

- **Type:** IMPLEMENT
- **Affects:**
  - `docs/business-os/comments/{entityType}/{id}/` (NEW directory structure)
  - `apps/business-os/src/lib/repo/CommentReader.ts` (NEW)
  - `apps/business-os/src/lib/repo/CommentWriter.ts` (NEW)
  - `apps/business-os/src/components/comments/CommentThread.tsx` (NEW)
  - `apps/business-os/src/app/cards/[id]/page.tsx` (render comments)
  - `apps/business-os/src/app/ideas/[id]/page.tsx` (render comments)
- **Depends on:** MVP-B2, MVP-C1
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] Comments stored in `docs/business-os/comments/{entityType}/{id}/{timestamp}-{author}.md`
  - [ ] Comment thread rendered on card/idea pages
  - [ ] Any user can leave comment (if they have read access to entity)
  - [ ] Comments visible to all permitted users
- **Test plan:**
  - Unit: Test CommentWriter/Reader
  - Integration: Post comment → file created; reload page → comment appears
  - E2E: User A posts comment, User B sees it (after poll/refresh)
- **Rollout / rollback:**
  - Rollout: Add comment functionality, non-breaking (entities without comments unaffected)
  - Rollback: Hide comment UI
- **Documentation impact:**
  - User guide: "Commenting on cards and ideas"
  - `docs/architecture.md`: Document comment storage
- **Notes / references:**
  - Expert review: "Comments as first-class git artifacts"

### MVP-E2: "Ask agent" button creates queue item

- **Type:** IMPLEMENT
- **Affects:**
  - `docs/business-os/agent-queue/` (NEW directory)
  - `apps/business-os/src/lib/repo/AgentQueueWriter.ts` (NEW)
  - `apps/business-os/src/components/card-detail/CardDetail.tsx` (add dropdown)
  - `apps/business-os/src/components/idea-detail/IdeaDetail.tsx` (add dropdown)
  - `apps/business-os/src/app/api/agent-queue/create/route.ts` (NEW)
- **Depends on:** MVP-B2, MVP-C1
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] Dropdown on card/idea detail: "Agent: work this idea", "Agent: break into tasks", "Agent: draft plan"
  - [ ] Click → creates file in `agent-queue/` with: action type, target entity, initiator user, optional instructions
  - [ ] User can request agent work without leaving browser
- **Test plan:**
  - Unit: Test AgentQueueWriter
  - Integration: Click "Ask agent" → queue file created; verify format
  - E2E: Request agent work → file appears in agent-queue/ directory
- **Rollout / rollback:**
  - Rollout: Add button, no impact until agent runner exists (MVP-E3)
  - Rollback: Hide button, delete unused queue files
- **Documentation impact:**
  - User guide: "Requesting agent help"
  - `docs/architecture.md`: Document agent queue
- **Notes / references:**
  - Expert review: "user can request agent work without leaving browser"

### MVP-E3: Agent runner daemon

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/agent-runner/index.ts` (NEW - main daemon script)
  - `apps/business-os/src/agent-runner/skills.ts` (NEW - skill execution wrappers)
  - `apps/business-os/src/agent-runner/run-logger.ts` (NEW)
  - `docs/business-os/agent-runs/` (NEW directory for run logs)
  - `ops/agent-runner.sh` (NEW - start/stop script)
- **Depends on:** MVP-C1, MVP-E2
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] Daemon polls `agent-queue/` every 5s
  - [ ] On new task: acquire repo lock, execute skill (Claude Code CLI or equivalent), write outputs + commit
  - [ ] Write run log to `agent-runs/{queue-id}/run.log.md` with progress updates
  - [ ] Queued task becomes visible output + git commit without admin touch
- **Test plan:**
  - Unit: Test run logger, skill execution wrappers
  - Integration: Create queue item → daemon picks up → skill executes → outputs committed
  - E2E: Request agent work via UI → daemon processes → see outputs in entity page
- **Planning validation:**
  - This is L-effort (new pattern, integration boundaries, concurrency, multiple files)
  - Write test stubs for core behaviors
- **Rollout / rollback:**
  - Rollout: Deploy daemon as systemd service (or PM2 process), monitor logs
  - Rollback: Stop daemon (queue accumulates but no processing)
- **Documentation impact:**
  - `docs/ops/agent-runner.md`: Setup, monitoring, troubleshooting
  - `docs/architecture.md`: Document agent runtime architecture
- **Notes / references:**
  - Expert review: "A local 'agent runner' process on the host that consumes a git-backed queue"
  - Skill execution: wrap existing Claude Code CLI commands (or reuse internal modules)

### MVP-E4: Agent run status UI (polling)

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/app/api/agent-runs/[id]/status/route.ts` (NEW)
  - `apps/business-os/src/components/agent-runs/RunStatus.tsx` (NEW)
  - `apps/business-os/src/app/cards/[id]/page.tsx` (render RunStatus)
  - `apps/business-os/src/app/ideas/[id]/page.tsx` (render RunStatus)
- **Depends on:** MVP-E3
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] Entity pages show: latest runs, current run status if any, last message from run log
  - [ ] Client polls `/api/agent-runs/{id}/status` every 5-10s when run active
  - [ ] User can see "agent is working / finished / failed" without refresh spam
- **Test plan:**
  - Unit: Test status API route
  - Integration: Start agent run → UI polls and shows "in progress" → run completes → UI shows "complete"
  - E2E: Full flow (request agent → see "pending" → see "working" → see outputs)
- **Rollout / rollback:**
  - Rollout: Add polling UI, backwards compatible (entities without runs unaffected)
  - Rollback: Remove polling (status not visible but runs still work)
- **Documentation impact:**
  - User guide: "Monitoring agent work"
- **Notes / references:**
  - Expert review: "polling for repo HEAD + per-entity activity"
  - Polling interval: 5s during active run, 30s when idle

### MVP-F1: Commit-to-card linking

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/lib/repo/CommitReader.ts` (NEW - parse git log)
  - `apps/business-os/src/components/card-detail/RecentActivity.tsx` (NEW)
  - `apps/business-os/src/app/cards/[id]/page.tsx` (render RecentActivity)
- **Depends on:** MVP-E3
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] Parse git log for commits mentioning card ID (regex: `BRIK-\d+`)
  - [ ] Display "Recent activity" section on card page with linked commits
  - [ ] When agent commits code mentioning card ID, card shows progress automatically (no manual updates)
- **Test plan:**
  - Unit: Test commit parsing (extract card IDs from messages)
  - Integration: Make commit with card ID → appears in card's recent activity
  - E2E: Agent commits code for card → activity shows up on card page
- **Rollout / rollback:**
  - Rollout: Add activity section, non-breaking
  - Rollback: Hide section
- **Documentation impact:**
  - User guide: "Tracking code progress"
  - Developer guide: "Include card IDs in commit messages for linking"
- **Notes / references:**
  - Expert review: "When agent commits code mentioning card ID, card shows progress automatically"
  - Git log parsing: `git log --grep="BRIK-003" --format=...`

### MVP-F2: Auto-progress notes (optional)

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/agent-runner/progress-notifier.ts` (NEW)
  - `apps/business-os/src/lib/repo/CommentWriter.ts` (extend for agent comments)
- **Depends on:** MVP-E3
- **Confidence:** TBD%
  - Implementation: TBD% — (requires investigation)
  - Approach: TBD% — (requires investigation)
  - Impact: TBD% — (requires investigation)
- **Acceptance:**
  - [ ] Agent runner appends short "Progress" comment after each code commit batch
  - [ ] Format: "Agent completed: {task description}. Files changed: {list}. Commit: {hash}"
  - [ ] Humans never write "I did X"; emitted by agent
- **Test plan:**
  - Unit: Test progress notifier
  - Integration: Agent commits code → progress comment created
  - E2E: Full flow → see both commit activity and progress comment
- **Rollout / rollback:**
  - Rollout: Enable in agent runner config
  - Rollback: Disable (commits still visible, just no auto-comment)
- **Documentation impact:**
  - None (internal agent behavior)
- **Notes / references:**
  - Expert review: "Humans never write 'I did X'; emitted by agent"

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Single host failure** | Complete outage | Medium | Nightly git push to GitHub (automated backup). Document restore procedure. |
| **Tunnel instability** | Intermittent access | Medium | Use ngrok free tier as fallback. Document tunnel restart procedure. Add healthz monitoring. |
| **Repo lock deadlock** | Writes hang | Low | TTL stale-lock recovery (30s). Monitor lock age. Add admin "force unlock" endpoint. |
| **Git merge conflicts on counters** | ID allocation fails | Low | Counters file updated atomically under lock (no parallel writes possible). |
| **Agent runner crash** | Queue tasks stall | Medium | Run daemon via systemd/PM2 with auto-restart. Monitor last run timestamp in healthz. |
| **Polling overhead** | Slow UI updates | Low | Adaptive polling (5s active, 30s idle). Cache recent activity per entity. |
| **Passcode leak** | Unauthorized access | Medium | Rotate passcodes quarterly. Monitor login attempts. Add account lockout after 5 failed logins. |
| **Queue poisoning** | Invalid agent tasks crash runner | Low | Validate queue file schema before processing. Log + skip malformed tasks. |

## Observability

**Logging:**
- All git writes: actor, action, entity ID, duration
- Repo lock: acquire/release, holder info, contention events
- Agent runs: start/complete/fail, duration, outputs created
- Auth: login/logout, permission denials
- Errors: stack traces, request context

**Metrics:**
- Repo lock contention: count, max wait time
- Agent queue: depth, age of oldest task
- Request duration: p50/p95/p99 for mutations
- Active users: count per hour

**Alerts:**
- Repo lock held >30s (potential deadlock)
- Agent runner last run >5 minutes ago (daemon down)
- Error rate >5% (system degradation)
- Disk usage >80% (repo growth)

**Dashboards (optional, Phase 4):**
- User activity heatmap
- Agent throughput (tasks/hour)
- System health (lock contention, error rate)

## Acceptance Criteria (Overall MVP)

- [ ] 5 real users can log in via invite-only auth
- [ ] Users can capture raw ideas without markdown knowledge
- [ ] Users can claim, accept, and complete tasks in one click
- [ ] Users can comment on cards and see others' comments
- [ ] Users can request agent work via UI ("Work this idea", "Draft plan")
- [ ] Agent runner processes queue tasks and commits outputs automatically
- [ ] Card pages show linked commits (code progress visible)
- [ ] "My Work" view shows user's assigned tasks only
- [ ] No ID collisions under concurrent load (20 simultaneous creates)
- [ ] No git corruption under concurrent load (2 browsers + agent)
- [ ] Unauthorized users cannot forge requests (server-side permission checks)
- [ ] System accessible via free tunnel (TryCloudflare or ngrok)
- [ ] Healthz endpoint monitors system status
- [ ] No regressions in existing functionality (board, search, filters, keyboard nav)

## Decision Log

- **2026-01-29:** Chose git-backed agent queue over Redis/SQS (aligns with git-only storage, no new dependencies)
- **2026-01-29:** Chose polling over SSE (TryCloudflare doesn't support SSE, simpler implementation)
- **2026-01-29:** Chose invite-only username+passcode auth over OAuth (no external service dependency, $0 constraint)
- **2026-01-29:** Chose atomic counters file over distributed counter service (git-only storage, no new dependencies)
- **2026-01-29:** Chose single repo lock over per-entity locks (simpler, sufficient for 5 users, can optimize later)

## Migration Path (Next Version)

When MVP proves value and scaling is required:

**Keep:**
- Data model (markdown + frontmatter + git history)
- Domain operations (RepoReader/RepoWriter interfaces)
- UI components (board, cards, filters, keyboard nav)

**Replace:**
- Storage adapter: `LocalGitWriter/Reader` → `GitHubAPIWriter/Reader` or `DBWriter/Reader + git sync`
- Queue: `agent-queue/` files → SQS/Redis
- Locking: file lock → distributed lock (Redis, DynamoDB)
- Auth: invite-only → OAuth + email invites
- Updates: polling → SSE/WebSocket

This is the clean migration boundary - swap storage layer, keep domain logic.

## References

- Expert review: 2026-01-29 feedback (above)
- Strategic review: `docs/plans/business-os-strategic-review.md`
- Phase 2 plan: `docs/plans/business-os-phase-2-plan.md`
- Architecture: `docs/architecture.md`
- Cloudflare Quick Tunnels: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/
- ngrok free tier: https://ngrok.com/pricing

## Next Steps

1. **Review this plan** with Pete - confirm epic priority and scope
2. **Run `/re-plan`** to assess confidence for each task (currently TBD)
3. **Start with Epic A** (production run mode) - lowest risk, enables all other work
4. **Iterate through epics** A → B → C → D → E → F
5. **Test with 5 real users** after Epic E complete (agent integration)
6. **Gather feedback** and iterate before considering "Next Version" migration

---

**Plan Status:** Draft (awaiting confidence assessment via `/re-plan`)
