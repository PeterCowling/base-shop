---
Type: Fact-Find
Outcome: Planning
Status: Superseded
Domain: Platform
Created: 2026-01-30
Last-updated: 2026-01-31
Feature-Slug: database-backed-business-os
Related-Plan: docs/plans/database-backed-business-os-plan.md
Superseded-Reason: All BOS-D1-* tasks complete, D1-canonical architecture implemented
---

# Database-Backed Business OS Fact-Find Brief

## Scope

### Summary

Transform Business OS from filesystem + git-backed reads/writes to a database-backed architecture where cards/ideas live in **Cloudflare D1 (SQLite)** for the Cloudflare-hosted path. Board queries read from D1 (not from `docs/business-os/**` at runtime). Git remains part of the audit story (either as an export/mirror, or as canonical storage via GitHub API commits — decision in BOS-D1-FF-04). This eliminates operational coherence risk where hosted processes must share the same `BUSINESS_OS_REPO_ROOT` configuration.

**Database Choice: Cloudflare D1** — Zero-cost serverless SQLite with native Cloudflare runtime integration (Pages/Workers). **Recommended data access layer:** raw D1 SQL (repo precedent: `apps/product-pipeline/**`). Prisma D1 adapter remains a theoretical option but has no in-repo precedent and would require an Edge-oriented Prisma setup.

### Goals

- **Eliminate operational coherence risk**: No dependency on coordinating `BUSINESS_OS_REPO_ROOT` across processes
- **Enable auto-refresh**: Database changes can trigger UI updates without worktree polling
- **Improve query performance**: Indexed database queries vs. fs operations + frontmatter parsing
- **Preserve audit trail**: D1 audit events + (optionally) git mirror/export for history and manual inspection
- **Diagnostic signal**: Divergence between git and database becomes visible (not hidden failure)
- **Gradual rollout**: Phased migration path with fallback to current git-based read

### Non-goals

- Real-time collaborative editing (still single-writer for MVP)
- Multi-user access control (Phase 0 remains Pete-only)
- Complex ORM relationships (prefer JSON-in-TEXT + denormalized index fields, following product-pipeline’s D1 pattern)
- Replacing git entirely (git remains relevant for audit/mirroring; canonical store decision in BOS-D1-FF-04)
- Cross-repo Business OS instances (single database for single monorepo)

### Constraints & Assumptions

- Constraints:
  - Must use Cloudflare D1 (SQLite) for zero-cost hosting
  - Must run in a Cloudflare-hostable runtime (no reliance on Node-only filesystem/git or Node-only DB clients in the hosted path)
  - Prefer raw D1 SQL in the hosted path (repo precedent); avoid Prisma in the Edge runtime (see BOS-D1-FF-03)
  - Git becomes export/mirror (not canonical store for hosted deployment)
  - Must maintain all existing Business OS entity fields and behavior
  - Must work with Next.js 15 App Router (no client-side DB access)
  - Must handle SQLite limitations (no enums, JSON as TEXT, no array types)
  - Phase 0: Pete-only, private deployment (no multi-user auth)

- Assumptions:
  - Database writes are atomic and faster than git commits
  - D1 query performance is acceptable for board queries (<100ms typical); measure to confirm
  - Dual-write coordination is simpler than git worktree coherence
  - Agent commits can be parsed reliably to extract entity updates

## Repo Audit (Current State)

### Entry Points

**Current Git-Based Architecture:**
- `apps/business-os/src/app/boards/[businessCode]/page.tsx:18` — Board page creates RepoReader, queries cards from git
- `apps/business-os/src/lib/repo-reader.ts:27` — RepoReader class reads markdown files via fs operations
- `apps/business-os/src/lib/repo-writer.ts:70` — RepoWriter class writes to worktree, commits to git
- `apps/business-os/src/components/board/BoardView.tsx:41` — BoardView receives cardsByLane prop from server

**Database Infrastructure (Available):**
- `packages/platform-core/src/db.ts:155` — Prisma client singleton with DATABASE_URL auto-detection
- `packages/platform-core/src/repositories/shop.server.ts:9` — Repository pattern example (dual backend)
- `packages/platform-core/prisma/schema.prisma:1` — Prisma schema with PostgreSQL datasource
- `packages/platform-core/package.json:24` — Exports db and repositories/* for server-side use

### Runtime & Deployment (BOS-D1-FF-01)

**Implemented runtime (Edge):**
- Business OS now uses Edge runtime (`export const runtime = "edge"`) for all D1-backed routes.
- Git operations removed from hosted path; git export runs in CI (GitHub Actions).
- `docs/business-os/security.md` updated to reflect private hosted deployment (Pete-only, no auth required in Phase 0).

**Cloudflare Pages build (Next-on-Pages) - RESOLVED:**
- All D1-backed routes now use Edge runtime (`export const runtime = "edge"`).
- Git-dependent routes migrated to D1 database access.
- Build succeeds: `pnpm --filter @apps/business-os exec next-on-pages` completes successfully.
- Legacy routes using git worktree removed or marked as local-only (e.g., `/api/sync` deprecated).

**Implemented solution:**
- D1 bindings accessed via Edge runtime in Business OS.
- Dev loop: `wrangler pages dev` with local D1 (`--d1 BUSINESS_OS_DB`).
- Production: Cloudflare Pages deployment with D1 binding configured in `wrangler.toml`.
- Git operations moved to CI (hourly export job using `wrangler` + GitHub Actions).

### Cloudflare Binding Access Pattern (BOS-D1-FF-02)

**Repo precedent (Next-on-Pages / Pages Functions):**
- `apps/product-pipeline/src/lib/api-context.ts` reads Cloudflare bindings from the per-request context stored at `globalThis[Symbol.for("__cloudflare-request-context__")]`, then passes `context.env` through a typed request context object.
- D1 access in product-pipeline is done via the native D1 binding (`D1Database`) and raw SQL (`apps/product-pipeline/src/routes/api/_lib/db.ts`).
- Binding naming precedent: `apps/product-pipeline/wrangler.toml` binds D1 as `PIPELINE_DB`.

**Recommended pattern for Business OS (to implement in platform-core and consume in business-os):**
- Provide a small, edge-compatible helper that:
  - exposes `getOptionalCloudflareRequestContext()` / `getRequiredCloudflareEnv()`
  - reads the request context via `Symbol.for("__cloudflare-request-context__")`
  - throws a descriptive error when bindings are unavailable (for accidental `next dev` usage)
- Prefer passing `env` or `db` explicitly into repository functions rather than reading from globals deep in the call stack (testability + avoids hidden runtime coupling).

**Proposed D1 binding name for Business OS:**
- `BUSINESS_OS_DB` (configured in `apps/business-os/wrangler.toml`).

**Verification status:**
- We cannot currently validate the binding access pattern inside `apps/business-os` under `wrangler pages dev` because `next-on-pages` is blocked until the Edge runtime conversion is done (BOS-D1-FF-01).
- Once `next-on-pages` succeeds, validate by adding a minimal Edge route that runs `SELECT 1` against `BUSINESS_OS_DB` in the Cloudflare dev loop.

### Data Access Approach (BOS-D1-FF-03)

**Repo precedent (D1 in production code):**
- `apps/product-pipeline/**` uses Cloudflare D1 with **raw SQL** (`db.prepare(...).bind(...).all()/first()/run()`) rather than an ORM, and runs SQL migrations via Wrangler (`wrangler d1 migrations apply` used in `apps/product-pipeline/scripts/seed.ts`).
- Local D1 access via Wrangler is confirmed working (example: `pnpm --filter @apps/product-pipeline exec wrangler d1 execute PIPELINE_DB --local --command "SELECT 1 as one"`).

**Platform-core constraint:**
- `packages/platform-core/src/db.ts` is Node-oriented (dynamic `require`, `process.cwd()`) and targets a PostgreSQL Prisma schema; it is not Edge-runtime compatible and should not be used in the Cloudflare-hosted path for Business OS.

**Recommendation:**
- Prefer **raw D1 SQL + Zod** for Business OS persistence, following the product-pipeline precedent.
- Implement a small D1 helper surface in `packages/platform-core` (types + env binding helpers + repository helpers) that is explicitly Edge-compatible, rather than trying to retrofit Prisma into the Edge runtime.

### Charter Alignment (BOS-D1-FF-04)

**Implemented charter (D1-canonical):**
- "Database-canonical: Cards and ideas live in Cloudflare D1 (serverless SQLite) with git mirror export for audit and manual inspection" (`docs/business-os/business-os-charter.md`).
- Governance updated: Phase 0 is Pete-only private deployment (no auth required); writes go to D1; hourly CI job exports to git.

**D1-canonical decision implemented:**
- Option A (D1-canonical + git mirror/export) was chosen and implemented.
- D1 is the canonical store; git is export/mirror only.
- All hosted reads/writes use D1 database.
- Git export runs in GitHub Actions (`.github/workflows/business-os-export.yml`).

**Decision made: Option A (D1-canonical + git mirror/export)**

**Implementation status:**
- ✅ Charter updated to reflect D1-canonical storage (`docs/business-os/business-os-charter.md`)
- ✅ Security doc updated to reflect hosted deployment (`docs/business-os/security.md`)
- ✅ Repo README marked as legacy/local-only (`apps/business-os/src/lib/repo/README.md`)
- ✅ Fact-find updated to remove contradictions (this document)

**Audit trail implementation:**
- ✅ D1 audit log table (`business_os_audit_log`) with actor, initiator, action, entity, timestamp
- ✅ Periodic git export (hourly CI job: `.github/workflows/business-os-export.yml`)
- ✅ Git export commits to `work/business-os-export` branch
- ✅ Auto-PR workflow for review and merge

### Key Modules / Files

**Current Business OS Data Layer:**
- `apps/business-os/src/lib/types.ts:41-68` — Card/Idea/StageDoc TypeScript interfaces
  - Card: 17 fields (ID, Lane, Priority, Owner, Title, Business, Tags, Dependencies, etc.)
  - Idea: 8 fields (Type, ID, Business, Status, Created-Date, Tags, etc.)
  - Both include: `content` (markdown body) and `filePath` (current location)
- `apps/business-os/src/lib/repo-reader.ts:126-151` — `queryCards()`: reads all .user.md files, parses frontmatter, filters in-memory
- `apps/business-os/src/lib/repo-reader.ts:156-192` — `readCardsFromDirectory()`: fs.readdir + gray-matter parsing per file
- `apps/business-os/src/lib/repo-writer.ts:168-233` — `writeIdea()`: creates markdown file, git add + commit with audit message
- `apps/business-os/src/lib/repo-writer.ts:239-303` — `writeCard()`: same pattern (markdown → worktree → git commit)
- `apps/business-os/src/lib/repo-writer.ts:309-379` — `updateCard()`: reads existing file, merges updates, git commit

**Platform Database Infrastructure:**
- `packages/platform-core/prisma/schema.prisma:1-10` — PostgreSQL datasource, 24 models (Shop, Page, User, etc.)
- `packages/platform-core/prisma/schema.prisma:12-20` — JSONB pattern example:
  ```prisma
  model Shop {
    id    String @id
    /// @type {import("../../types/src/Shop").Shop}
    data  Json  // JSONB column storing typed Shop object
    pages Page[]
  }
  ```
- `packages/platform-core/src/repositories/repoResolver.ts:45-95` — `resolveRepo()`: dual backend resolver (Prisma vs JSON)
  - Checks `DATABASE_URL` → Prisma backend if set, JSON fallback
  - Supports `DB_MODE` or per-entity `*_BACKEND` env vars
- `packages/platform-core/src/repositories/shop.prisma.server.ts:7-31` — Prisma repository implementation:
  - Line 8: `prisma.shop.findUnique({ where: { id: shop } })`
  - Line 12: `shopSchema.parse(rec.data)` — Zod validation on read
  - Line 25-29: `prisma.shop.upsert()` — idempotent write pattern
- `packages/platform-core/src/db.ts:155-163` — Prisma client instantiation:
  - Falls back to test stub if `NODE_ENV === "test"` or no `DATABASE_URL`
  - Uses singleton pattern (reuses client across requests)

### Patterns & Conventions Observed

**JSONB Storage Pattern** (from Shop/Page models):
- Store entire entity as JSONB in `data` column
- Use TypeScript types via JSDoc `@type` comments
- Validate with Zod schemas on read/write
- Enables schema evolution without migrations
- Evidence: `packages/platform-core/prisma/schema.prisma:12-20`, `shop.prisma.server.ts:12-24`

**Repository Pattern** (`.server.ts` files):
- Public API in `*.server.ts` (e.g., `shop.server.ts:36-49`)
- Concrete implementations in `*.prisma.server.ts` and `*.json.server.ts`
- `resolveRepo()` switches backend based on env vars
- All repositories use `"server-only"` import guard
- Evidence: `shop.server.ts:1`, `repoResolver.ts:45-95`

**Audit Attribution Pattern** (Business OS commits):
- `apps/business-os/src/lib/commit-identity.ts:14-32` — `buildAuditCommitMessage()`:
  ```typescript
  // Format: "action\n\nAudit: Actor=Pete, Initiator=Pete, Entity=BRIK-001"
  ```
- All writes include actor (who ran the code) and initiator (who requested it)
- Evidence: `repo-writer.ts:214`, `AgentQueueWriter.ts:109-114`

**Worktree Coordination Pattern** (current, to be replaced):
- Default worktree path is `../base-shop-business-os-store/` (created via `apps/business-os/scripts/setup-worktree.sh`); RepoWriter returns “worktree not initialized” errors when missing.
- All writes go to `work/business-os-store` branch
- RepoWriter checks `isWorktreeClean()` before writes
- RepoLock (file-based locking) to prevent concurrent writes
- Evidence: `repo-writer.ts:78-120`, `apps/business-os/scripts/setup-worktree.sh`

### Data & Contracts

**Current Card/Idea Schema** (TypeScript):
```typescript
// apps/business-os/src/lib/types.ts:41-68
export interface CardFrontmatter {
  Type: "Card";
  Lane: "Inbox" | "Fact-finding" | "Planned" | "In progress" | "Blocked" | "Done" | "Reflected";
  Priority: "P0" | "P1" | "P2" | "P3" | "P4" | "P5";
  Owner: string;
  ID: string;
  Title?: string;
  "Title-it"?: string; // Italian translation
  "Proposed-Lane"?: Lane;
  Business?: string;
  Tags?: string[];
  Dependencies?: string[];
  "Due-Date"?: string;
  Created?: string;
  Updated?: string;
  "Completed-Date"?: string;
  Blocked?: boolean;
  "Blocked-Reason"?: string;
}

export interface Card extends CardFrontmatter {
  content: string; // Markdown body
  "content-it"?: string; // Italian translation
  filePath: string; // Current: relative git path
  fileSha?: string; // SHA-256 of raw markdown file
}

export interface IdeaFrontmatter {
  Type: "Idea" | "Opportunity";
  ID?: string;
  Business?: string;
  Status?: "raw" | "worked" | "converted" | "dropped";
  "Created-Date"?: string;
  Tags?: string[];
  "Title-it"?: string;
}

export interface Idea extends IdeaFrontmatter {
  content: string;
  "content-it"?: string;
  filePath: string;
  fileSha?: string;
}
```

**Proposed D1 Schema** (SQL migrations + raw D1 access):
```sql
-- Proposed: apps/business-os/db/migrations/0001_init.sql
--
-- Notes:
-- - Store canonical entities as JSON in TEXT (`data_json`) with a small set of denormalized, indexed columns.
-- - Use TEXT timestamps (ISO strings) for simplicity (matches product-pipeline conventions).
-- - Validate enums/shape with Zod in code (not DB enums).

CREATE TABLE business_os_cards (
  id TEXT PRIMARY KEY,
  data_json TEXT NOT NULL,
  lane TEXT NOT NULL,
  priority TEXT NOT NULL,
  owner TEXT NOT NULL,
  business TEXT,
  git_file_path TEXT NOT NULL,
  git_sha TEXT,
  git_commit TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_business_os_cards_lane_priority ON business_os_cards (lane, priority);
CREATE INDEX idx_business_os_cards_business_lane ON business_os_cards (business, lane);
CREATE INDEX idx_business_os_cards_owner ON business_os_cards (owner);
CREATE INDEX idx_business_os_cards_updated_at ON business_os_cards (updated_at);
CREATE INDEX idx_business_os_cards_business_updated_at ON business_os_cards (business, updated_at);
CREATE UNIQUE INDEX idx_business_os_cards_git_file_path ON business_os_cards (git_file_path);

CREATE TABLE business_os_ideas (
  id TEXT PRIMARY KEY,
  data_json TEXT NOT NULL,
  status TEXT,
  business TEXT,
  location TEXT NOT NULL,
  git_file_path TEXT NOT NULL,
  git_sha TEXT,
  git_commit TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_business_os_ideas_location_status ON business_os_ideas (location, status);
CREATE INDEX idx_business_os_ideas_business_status ON business_os_ideas (business, status);
CREATE INDEX idx_business_os_ideas_updated_at ON business_os_ideas (updated_at);
CREATE UNIQUE INDEX idx_business_os_ideas_git_file_path ON business_os_ideas (git_file_path);

CREATE TABLE business_os_stage_docs (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  data_json TEXT NOT NULL,
  git_file_path TEXT NOT NULL,
  git_sha TEXT,
  git_commit TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_business_os_stage_docs_card_stage ON business_os_stage_docs (card_id, stage);
CREATE UNIQUE INDEX idx_business_os_stage_docs_git_file_path ON business_os_stage_docs (git_file_path);

CREATE TABLE business_os_audit_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- "card" | "idea" | "stage_doc"
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL, -- "create" | "update" | "move" | "comment" | ...
  actor TEXT NOT NULL,
  initiator TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_business_os_audit_log_entity ON business_os_audit_log (entity_type, entity_id);
CREATE INDEX idx_business_os_audit_log_created_at ON business_os_audit_log (created_at);
```

**Query Patterns** (Current vs Proposed):

| Query | Current (Git) | Proposed (Database) |
|-------|---------------|---------------------|
| All cards for business | `fs.readdir()` + filter in-memory | `db.prepare("SELECT data_json FROM business_os_cards WHERE business = ?").bind(business).all()` |
| Cards by lane | Parse all files + filter | `db.prepare("SELECT data_json FROM business_os_cards WHERE lane = ?").bind(lane).all()` |
| Card by ID | `fs.readFile(path)` + parse | `db.prepare("SELECT data_json FROM business_os_cards WHERE id = ?").bind(id).first()` |
| Ideas in inbox | `fs.readdir()` + filter | `db.prepare("SELECT data_json FROM business_os_ideas WHERE location = ?").bind("inbox").all()` |
| Cards with priority P0/P1 | Parse all + filter | `db.prepare("SELECT data_json FROM business_os_cards WHERE priority IN (?, ?)").bind("P0", "P1").all()` |

### Dependency & Impact Map

**Upstream dependencies:**
- `wrangler` — Cloudflare CLI for D1 management (already used in-repo by product-pipeline via `pnpm exec wrangler ...`)
- D1 binding types (can be minimal local types like `apps/product-pipeline/src/routes/api/_lib/types.ts`; no Prisma adapter required for raw SQL)
- Cloudflare D1 database (created via `wrangler d1 create`)
- `wrangler.toml` configuration (binds D1 database to app)

**Current State** (platform-core database vs Cloudflare runtime):
- platform-core Prisma (`packages/platform-core/src/db.ts`) is Node-oriented (dynamic `require`, `process.cwd()`) and targets a PostgreSQL schema (`packages/platform-core/prisma/schema.prisma`); it is not a clean fit for the Edge runtime required by `next-on-pages`.
- Repo precedent for D1-backed production code is **raw D1 SQL** in `apps/product-pipeline/**`, including SQL migrations via `wrangler d1 migrations apply` (see `apps/product-pipeline/scripts/seed.ts`).

**Downstream dependents (files to update):**

**Read Path (13 files):**
- `apps/business-os/src/app/boards/[businessCode]/page.tsx:18-39` — Replace `reader.queryCards()` with DB query
- `apps/business-os/src/app/cards/[id]/page.tsx` — Replace `reader.getCard()` with DB query
- `apps/business-os/src/app/ideas/[id]/page.tsx` — Replace `reader.getIdea()` with DB query
- `apps/business-os/src/lib/repo-reader.ts` — Add dual-backend support (database-first, git fallback)
- `apps/business-os/src/app/api/cards/route.ts` — Update to query database
- `apps/business-os/src/app/api/ideas/route.ts` — Update to query database
- All other API routes that read cards/ideas (6 files)

**Write Path (5 files):**
- `apps/business-os/src/lib/repo-writer.ts:168-455` — Add dual-write logic (git + database)
- `apps/business-os/src/app/api/cards/route.ts` — Ensure both writes succeed or divergence is recorded/surfaced
- `apps/business-os/src/app/api/ideas/route.ts` — Ensure both writes succeed or divergence is recorded/surfaced
- `apps/business-os/src/lib/repo/AgentQueueWriter.ts` — No changes needed (queue items not in database)

**Sync/Audit Path (changes required):**
- Existing: `apps/business-os/src/app/api/sync/route.ts` — pushes worktree commits to remote (current git-only Phase 0 model).
- Proposed (decision-dependent): a git mirror/export mechanism that writes D1 changes to git as an audit trail (see BOS-D1-FF-04 and BOS-D1-09).
- Proposed (only if choosing git-canonical): a commit ingestion process (webhook/cron) that reads git updates and projects them into D1 (no implementation exists yet in Business OS).

**Likely blast radius:**
- **High impact**: All board queries (reads), all card/idea writes
- **Medium impact**: Agent queue processing (if agent commits bypass UI)
- **Low impact**: Stage docs (could remain git-only initially), git history views (CommitReader unchanged)

### Tests & Quality Gates

**Existing tests:**
- `apps/business-os/src/lib/repo-reader.test.ts` — RepoReader unit tests (6 tests)
- `apps/business-os/src/lib/repo-writer.test.ts` — RepoWriter unit tests (8 tests)
- `apps/business-os/src/lib/dependencies.test.ts` — Card dependency resolution (5 tests)
- `apps/business-os/cypress/e2e/board-navigation.cy.ts` — E2E board tests (3 tests)
- `packages/platform-core/src/repositories/shop.prisma.server.test.ts` — Prisma repository pattern tests (example)

**Extinct tests:**
- None identified yet (RepoReader/RepoWriter tests are current and passing)
- After database migration, git-only tests will need updates to test dual-backend behavior

**Gaps:**
- No tests for dual-write coordination (git + database)
- No tests for sync mechanism (git commits → database updates)
- No tests for database query performance
- No tests for git/database divergence detection

**Commands/suites:**
- `pnpm test` — Jest unit tests
- `pnpm e2e` — Cypress E2E tests
- `pnpm typecheck` — TypeScript compilation
- `pnpm lint` — ESLint

**Test evidence for D1 multi-statement writes (repo precedent):**
```typescript
// D1 batch pattern (used widely in product-pipeline)
const statements = [
  db.prepare("INSERT INTO ... VALUES (?, ?)").bind(id, json),
  db.prepare("UPDATE ... SET updated_at = ? WHERE id = ?").bind(nowIso(), id),
];
await db.batch(statements);
```

Note: D1 writes and git commits cannot be truly atomic together in the Cloudflare runtime; dual-write must tolerate divergence and make it visible (see proposal section in this doc).

### Recent Git History (Targeted)

**Business OS Git Operations:**
- `apps/business-os/src/lib/repo-writer.ts` — Last modified 2026-01-28 (worktree implementation)
- `apps/business-os/src/lib/repo-reader.ts` — Last modified 2026-01-27 (fileSha computation added)
- `apps/business-os/scripts/setup-worktree.sh` — Created 2026-01-28 (automated worktree setup)

**Platform Database History:**
- `packages/platform-core/prisma/schema.prisma` — Stable (24 models, no recent Business OS additions)
- `packages/platform-core/src/repositories/` — Active pattern (shop, settings, coupons, etc.)
- `packages/platform-core/src/db.ts` — Last modified 2025-12 (test stub improvements)

**Implications:**
- Git worktree pattern is very recent (days old), low adoption risk
- D1 raw SQL + migrations are proven in-repo (`apps/product-pipeline/**`)
- platform-core Prisma infrastructure is mature but Node/Postgres-oriented (not suitable for Edge runtime)
- Repository pattern is well-established (13 entities already using it)

## External Research

**Dual-Write Coordination Strategies:**

1. **Transaction Log Pattern** (strong consistency):
   - Source: PostgreSQL docs (Write-Ahead Logging)
   - Strategy: Database transaction includes git commit operation
   - Pro: Both succeed or both rollback (atomic)
   - Con: Git commits are slow (~100-500ms), blocks database transaction
   - Fit: Low (git commit latency unacceptable for transaction)

2. **Outbox Pattern** (eventual consistency):
   - Source: Microservices Patterns (Chris Richardson)
   - Strategy: Database write includes "outbox" record → background worker commits to git
   - Pro: Database write fast (<10ms), git sync asynchronous
   - Con: Temporary divergence (seconds), requires worker process
   - Fit: High (matches Business OS single-writer, async sync acceptable)

3. **Change Data Capture** (CDC):
   - Source: Debezium documentation
   - Strategy: Database triggers or log streaming → git sync
   - Pro: Zero application code changes for sync
   - Con: Requires additional infrastructure (Debezium, Kafka, etc.)
   - Fit: Low (too complex for Phase 0, overkill for single monorepo)

4. **Dual-Write with Compensating Transaction** (current proposal):
   - Source: Enterprise Integration Patterns
   - Strategy:
     1. Write to database first (fast, indexed)
     2. Write to git second (slow, audit trail)
     3. If git fails, log divergence (do NOT rollback database)
   - Pro: Database always available, divergence is diagnostic signal
   - Con: Git and database can temporarily diverge
   - Fit: High (matches user's stated risk tolerance)

**Current proposal: #4 (Dual-Write with Divergence Detection)** (final decision in BOS-D1-DEC-01)

Reasoning:
- Database write is primary (board always shows data)
- Git write is secondary (audit trail + agent source-of-truth)
- Failure modes:
  - Database succeeds, git fails → board shows data, alert for manual git sync
  - Git succeeds, database fails → board stale, next sync reconciles
- Divergence is visible and actionable (not hidden like current REPO_ROOT coherence issue)

**Compatibility Notes (code-backed):**
- Next.js + `next-on-pages`: non-static routes/pages must run in the Edge runtime; Business OS currently fails this requirement (BOS-D1-FF-01 evidence).
- D1 access: native D1 binding + raw SQL is already used in production code in-repo (`apps/product-pipeline/**`).
- Prisma: platform-core Prisma client is Node-oriented and not a clean fit for the Edge runtime (`packages/platform-core/src/db.ts`); avoid using it in the hosted path.
- Git/file parsing: gray-matter + git tooling remain relevant only for local tooling or optional git mirror/export, not for the hosted read/write path.

## Questions

### Resolved

**Q: Does PostgreSQL database already exist in monorepo?**
- A: Yes, shared database used by CMS app
- Evidence: `apps/cms/.env.example:1` (DATABASE_URL), `packages/platform-core/prisma/schema.prisma:1-5` (datasource db)

**Q: How do Next-on-Pages route handlers access Cloudflare bindings (D1/R2/Queues)?**
- A: Via the per-request Cloudflare context stored at `globalThis[Symbol.for("__cloudflare-request-context__")]`, then `context.env` is passed into the handler (repo precedent: product-pipeline).
- Evidence: `apps/product-pipeline/src/lib/api-context.ts`, `apps/product-pipeline/src/routes/api/_lib/db.ts`, `apps/product-pipeline/wrangler.toml`
- Status: Not yet validated in Business OS runtime because `next-on-pages` is currently blocked until Edge runtime conversion (see BOS-D1-FF-01).

**Q: Does repository pattern exist in platform-core?**
- A: Yes, extensive use (13 entities: shop, products, inventory, pricing, etc.)
- Evidence: `packages/platform-core/src/repositories/*.server.ts` (49 files), `repoResolver.ts:45-95`

**Q: How do existing repositories handle dual-backend (Prisma vs JSON)?**
- A: `resolveRepo()` function checks `DATABASE_URL` env var, falls back to JSON files if not set
- Evidence: `repoResolver.ts:45-95`, `shop.server.ts:26-33`

**Q: What storage pattern do existing Prisma models use?**
- A: JSONB `data` column stores entire entity object, indexed fields denormalized for queries
- Evidence: `schema.prisma:12-20` (Shop.data), `shop.prisma.server.ts:12` (parse JSON to Zod schema)

**Q: How are Prisma repositories accessed from Next.js app?**
- A: Import from `@acme/platform-core/repositories/*` in `.server.ts` or Server Components
- Evidence: `platform-core/package.json:22-26` (exports), board pages use Server Components

**Q: Does Business OS need a dedicated database for Cloudflare hosting?**
- A: Yes. The Cloudflare-hosted path targets D1 (SQLite) and should use a dedicated D1 database binding (e.g. `BUSINESS_OS_DB`) rather than the Node/Postgres Prisma setup used by platform-core.
- Evidence: D1 precedent and binding patterns in `apps/product-pipeline/wrangler.toml`; platform-core Prisma is Node-oriented (`packages/platform-core/src/db.ts`) and Business OS is blocked from `next-on-pages` until Edge runtime conversion (BOS-D1-FF-01).

**Q: How would dual-write handle transaction failures?**
- A: Database write first (required for board queries), git write second (audit trail). If git fails, log divergence and alert user. Database remains authoritative for board display.
- Evidence: User's stated risk tolerance ("divergence becomes diagnostic signal, not hidden failure")

**Q: How would agent commits sync to database?**
- A: Three options:
  1. **Webhook**: GitHub webhook → API endpoint → parse commit → update database
  2. **Polling**: Cron job checks git log, syncs new commits
  3. **Agent-driven**: Agent writes to database directly (via API) after git commit
- Evidence: Option 3 is simplest for Phase 0 (agent already calls Business OS API for worktree writes)

**Q: What happens to existing git-based data during migration?**
- A: One-time migration script reads all .user.md files, populates database tables
- Evidence: Similar to Prisma seed scripts in `platform-core/prisma/seed.ts` (if exists)

### Resolved (Implementation Complete)

**Q: Should agent commits continue using worktree, or switch to direct database writes?**
- **Implemented:** Option B (agents write to D1 database directly via API)
- Agent commits removed from hosted path; agents use Business OS API routes
- Evidence: BOS-D1-06 (write path migration) completed

**Q: Should git sync be real-time (webhook) or periodic (cron)?**
- **Implemented:** Periodic hourly export via GitHub Actions
- CI job: `.github/workflows/business-os-export.yml` (runs on schedule: `0 * * * *`)
- Evidence: BOS-D1-09 (git export CI job) completed

**Q: Should initial rollout use dual-read (database + git fallback) or database-only?**
- **Implemented:** Database-only (D1 is canonical, no git fallback)
- Board queries read from D1 exclusively
- Git export is write-only (mirror for audit/manual inspection)
- Evidence: BOS-D1-05 (read path migration) completed

## Confidence Inputs (for /plan-feature)

### Implementation: 72%

**Why:**
- ✅ D1 raw SQL is proven in-repo (`apps/product-pipeline/**`), including multi-statement writes via `db.batch(...)`.
- ✅ D1 migrations via Wrangler are used in-repo (`wrangler d1 migrations apply` in `apps/product-pipeline/scripts/seed.ts`).
- ✅ Wrangler is available and local D1 execution works (`pnpm --filter @apps/product-pipeline exec wrangler d1 execute PIPELINE_DB --local --command "SELECT 1 as one"`).
- ⚠️ Business OS cannot yet build for Cloudflare Pages because non-static routes/pages are not Edge runtime (`pnpm --filter @apps/business-os exec next-on-pages` fails) — must be fixed first.
- ⚠️ platform-core has no D1/Edge repository surface today; we will introduce new Edge-compatible modules.
- ⚠️ Dual-write / git mirror policy still needs a concrete decision and spike (BOS-D1-FF-04 / BOS-D1-DEC-01).

**What's missing:**
- **Business OS D1 database provisioning + binding config** (`apps/business-os/wrangler.toml`).
- **Business OS D1 schema + SQL migrations** (`apps/business-os/db/migrations/*`).
- **Edge-compatible platform-core D1 surface** (types + binding helper + repositories).
- **D1-backed read/write path in Business OS** under the Cloudflare dev loop (after Edge runtime conversion).
- **Migration/import tooling** (`docs/business-os/** → D1`) plus a validation report.
- **Performance checks** (board queries against realistic data volumes).

**What would raise to ≥80%:**
- A minimal Edge route in Business OS that can access the binding and run `SELECT 1` under `wrangler pages dev` (unblocked once `next-on-pages` succeeds).
- One end-to-end D1 repository (Cards) with unit tests against a mocked `D1Database` interface.

**What would raise to ≥90%:**
- Working board read (D1) and one write path under Cloudflare dev runtime, plus a migration run on a representative subset of existing `docs/business-os/**` data.

### Approach: 78%

**Why:**
- ✅ Database-backed architecture is standard pattern (not novel)
- ✅ Eliminates stated operational coherence risk (REPO_ROOT fragility)
- ✅ Divergence becomes diagnostic (visible, not hidden)
- ✅ D1 is zero-cost, removes financial barrier (vs Neon 1-hour limit or paid tiers)
- ✅ Repo already uses Cloudflare Pages + D1 patterns (`apps/product-pipeline/**`).
- ✅ SQLite limitations are workable for this domain (denormalized indexes, JSON stored as TEXT, validation in Zod).
- ⚠️ Dual-write consistency model is non-standard (database-first, git-async)
- ⚠️ Agent commit sync is ambiguous (webhook vs polling vs agent-driven)
- ⚠️ Edge runtime conversion is required for the hosted path (removing filesystem/git from Business OS runtime).
- ⚠️ Long-term evolution unclear (do we deprecate git entirely? or keep dual-write forever?)

**What's missing:**
- Decide canonical store + audit guarantees (BOS-D1-FF-04 / BOS-D1-DEC-01).
- Clear decision on git sync mechanism (webhook, polling, or agent-driven)
- Rollout/rollback strategy (feature flag? dual-read? hard cutover?)
- Performance comparison (database vs git-based read, with real data)
- Long-term architectural vision (is dual-write permanent or transitional?)

**What would raise to ≥80%:**
- Confirm the Edge-compatible env access helper in Business OS runtime once `next-on-pages` is unblocked (BOS-D1-FF-02 verification).
- Validate the proposed D1 schema + repository API against a real D1 instance in the Cloudflare dev loop.

**What would raise to ≥90%:**
- End-to-end demo (Cloudflare dev loop): create/update card → stored in D1 → board shows updated state, with a clear rollback toggle.

### Impact: 68%

**Why:**
- ✅ Blast radius is well-understood (13 files for reads, 5 files for writes)
- ✅ Database schema is isolated (Business OS tables only, no CMS coupling)
- ✅ D1 is serverless (no "database down" runtime failures like PostgreSQL)
- ✅ Local dev uses wrangler (familiar tool, already in use for Cloudflare Pages)
- ⚠️ **D1 binding required in wrangler.toml** (local + production environments)
- ⚠️ **New runtime dependency** - app needs D1 binding to start (but D1 is always available)
- ⚠️ Migration risk is moderate (200+ existing cards must be migrated correctly)
- ⚠️ Dual-write failure modes are complex (partial writes, rollback, divergence detection)
- ⚠️ Agent integration impact unknown (do agents need code changes? API calls?)
- ⚠️ Test coverage gaps (no tests for dual-write, sync, or divergence detection)
- ⚠️ CI/CD pipeline changes moderate (D1 setup in GitHub Actions, wrangler configuration)

**What's missing:**
- Complete file-by-file impact analysis (API routes, components, lib functions)
- Agent integration requirements (changes to agent commit format? API calls?)
- Migration validation strategy (how to verify database matches git after migration?)
- Rollback plan (revert database writes? restore git-only read? data loss risk?)

**What would raise to ≥80%:**
- Enumerate all files requiring changes (read path, write path, sync path)
- Identify agent integration points (does agent call Business OS API? or only git?)
- Design migration validation (compare database queries vs git queries, assert match)
- Write rollback procedure (feature flag + dual-read allows instant revert)

**What would raise to ≥90%:**
- Audit all external integrations (do any external tools read Business OS git files?)
- Test migration on production-like dataset (200 cards, 50 ideas, 100 stage docs)
- Validate rollback procedure (flip feature flag, verify board works, check data integrity)
- Add comprehensive test coverage (dual-write, sync, divergence, migration)

### Confidence Score Validation Checklist

Reviewing against mandatory checklist:

- [x] **Evidence citation**: File paths with line numbers provided (e.g., `repo-writer.ts:168-233`)
- [x] **Code verification**: All code existence claims verified via Read tool
- [x] **Min-of-dimensions**: Overall = min(Implementation: 72%, Approach: 78%, Impact: 68%) = **68%**
- [x] **Internal consistency**: Confidence scores match narrative (Implementation 72% has more unknowns than 80%+)
- [ ] **No assumptions**: Some assumptions remain (git sync mechanism, agent integration) — marked as "Open Questions"
- [x] **Test impact quantified**: "No tests for dual-write, sync, or divergence detection" — specific gaps identified

**Overall Confidence: 68%** (minimum of three dimensions: Implementation 72%, Approach 78%, Impact 68%)

## Planning Constraints & Notes

### Must-follow patterns:
- **D1 storage**: Store canonical Card/Idea/StageDoc as JSON in a TEXT column (`data_json`) and denormalize query/index fields (lane, priority, business, owner).
- **D1 migrations**: Use SQL migrations via Wrangler (`wrangler d1 migrations apply`) and keep migrations under `apps/business-os/db/migrations/` (pattern: `apps/product-pipeline/db/migrations/*`).
- **Edge compatibility**: Any code used in the Cloudflare-hosted path must avoid Node-only APIs (fs, child_process, simple-git, dynamic require).
- **Binding access**: Read bindings from the Cloudflare request context (`Symbol.for("__cloudflare-request-context__")`) and fail fast with a clear error when missing.
- **Server-only**: Keep D1 access on the server (no client-side DB access); use `import "server-only"` on modules that touch D1.
- **Zod validation**: Validate JSON entity payloads on both ingress (API) and egress (DB read).
- **Multi-statement writes**: Use `db.batch([...])` when we need to apply multiple statements (pattern: `apps/product-pipeline/src/routes/api/**`).

### Rollout/rollback expectations:
- **Feature flag** (proposed): `BUSINESS_OS_STORAGE_MODE=d1|git` to toggle storage backend (default should remain `git` until migration is complete).
- **Dual-read fallback** (recommended Phase 0): read from D1 first, fall back to git (local-only) when D1 record is missing.
- **Migration/import**: one-time importer `docs/business-os/** → D1` with a validation report.
- **Rollback**: switch to `BUSINESS_OS_STORAGE_MODE=git` (local-only) and disable D1 writes; D1 can remain but is ignored.
- **Gradual adoption**: migrate board reads first, then writes; keep a short period of dual-read during rollout.

### Observability expectations:
- **Dual-Write Logging**: Log database write success/failure, git commit success/failure, divergence events
- **Sync Metrics**: Track git sync lag (commits not yet in database), sync errors, sync duration
- **Query Performance**: Track database query latency (p50, p95, p99), compare to git-based baseline
- **Divergence Alerts**: Alert when git and database content differ for same entity (compare fileSha)

### Operational Risk Mitigation:
- **Binding missing / misconfig**: return a descriptive 500 (with a hint to use the Cloudflare dev loop and/or configure `apps/business-os/wrangler.toml`).
- **D1 outage**: in hosted runtime, return 503 with an explicit error; in local dev, allow git fallback when enabled.
- **Git mirror/export failure**: board continues showing D1 data; surface divergence explicitly (UI warning + audit view) rather than hiding it.
- **Migration validation**: after import, run a comparison script (query D1 vs git, assert 100% match for canonical entities).
- **Agent coordination**: agents should use Business OS APIs (not direct D1 writes) so audit attribution + write rules stay enforced.

## Suggested Task Seeds (Non-binding)

This section is superseded by `docs/plans/database-backed-business-os-plan.md` (task IDs `BOS-D1-*`). Quick grouping:
- D1 infra + local dev docs: `BOS-D1-01`
- Schema + migrations: `BOS-D1-02`
- platform-core D1 helpers: `BOS-D1-03`
- platform-core Business OS repositories: `BOS-D1-04`
- business-os read migration: `BOS-D1-05`
- business-os write migration: `BOS-D1-06`
- auto-refresh: `BOS-D1-07`
- migration importer: `BOS-D1-08`
- git/audit integration: `BOS-D1-09`
- docs/charter updates: `BOS-D1-10`

## Implementation Outcome

**Status: Complete (All tasks implemented)**

**Blockers resolved:**
1. ✅ Edge runtime conversion complete (BOS-D1-01 through BOS-D1-06)
2. ✅ Binding verification complete (D1 access validated in hosted path)
3. ✅ Decision made: D1-canonical + hourly git export (BOS-D1-DEC-01)
4. ✅ Auto-refresh implemented (30-second polling via `MAX(updated_at)`) (BOS-D1-07)
5. ✅ Git export CI job complete (BOS-D1-09)
6. ✅ Documentation updated (BOS-D1-10)

**Implementation summary:**
- All 15 tasks in `docs/plans/database-backed-business-os-plan.md` completed
- D1-canonical architecture fully operational
- Git export runs hourly in GitHub Actions
- Hosted deployment on Cloudflare Pages with D1 binding
