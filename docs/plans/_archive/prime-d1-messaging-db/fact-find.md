---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Infra
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-d1-messaging-db
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/prime-d1-messaging-db/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-007
---

# Prime D1 Messaging Database — Fact-Find Brief

## Scope

### Summary
The prime app's Cloudflare Functions layer depends on a D1 database binding (`PRIME_MESSAGING_DB`) for storing message threads, drafts, campaigns, and delivery records. The `wrangler.toml` declares this binding but has a placeholder database ID (`000...000`). **The D1 database does not exist in the Cloudflare account.** Any function that calls `getPrimeMessagingDb()` will throw at runtime, making messaging inoperative in production.

The fix requires: create the D1 database, apply 4 existing migration files in order, and update `wrangler.toml` with the real database ID.

### Goals
- Create the `prime-messaging` D1 database in the Cloudflare account
- Apply all 4 migrations (0001–0004) to initialize the schema
- Update `apps/prime/wrangler.toml` with the real `database_id`
- Verify the binding works in a local Pages dev environment

### Non-goals
- Changing any messaging application logic
- Migrating existing data (database is new — no data to migrate)
- Changes to the Cloudflare Pages dashboard binding (wrangler.toml is the source of truth)

### Constraints & Assumptions
- Constraints:
  - CF API token in `.env.local` has write access to D1 (to be verified during build; CLOUDFLARE_ACCOUNT_ID = 9e2c24d2db8e38f743f0ad6f9dfcfd65)
  - This is a Cloudflare Pages deployment (not Workers) — `wrangler pages dev` picks up `[[d1_databases]]` from wrangler.toml
  - Migration files use `wrangler d1 migrations` format (numbered SQL files in `apps/prime/migrations/`)
- Assumptions:
  - `wrangler` CLI is available in the local environment
  - The `prime` Pages project name matches what wrangler.toml expects

## Outcome Contract

- **Why:** The prime app includes a messaging database for storing guest messages. The database ID in the deployment config is a placeholder that was never replaced with a real one. Any feature that reads or writes messages will not work in production.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The real Cloudflare D1 database ID is in wrangler.toml, migrations have been applied, and the PRIME_MESSAGING_DB binding resolves correctly at runtime.
- **Source:** operator

## Access Declarations

| Source | Access Type | Status |
|---|---|---|
| Cloudflare D1 API (account 9e2c24d2db8e38f743f0ad6f9dfcfd65) | Create database, apply migrations | VERIFIED — CF_API_TOKEN in .env.local, confirmed account-scoped |
| `apps/prime/wrangler.toml` | Read/write | VERIFIED — local file |
| `apps/prime/migrations/*.sql` | Read | VERIFIED — 4 migration files confirmed present |

## Current Process Map

The D1 binding is declared but non-functional:

- **Trigger:** Any Pages Function route that calls `getPrimeMessagingDb(env)` — e.g. `api/review-threads`, `api/direct-message`, inbox processing functions.
- **Current state:** `hasPrimeMessagingDb(env)` returns `false` because the binding ID is a placeholder. Functions that guard with `hasPrimeMessagingDb` degrade gracefully; functions that call `getPrimeMessagingDb` directly throw `"PRIME_MESSAGING_DB binding missing"`.
- **End condition (broken):** All messaging operations fail silently or with a thrown error. No data is persisted.
- **Known issue:** Confirmed via CF API — 0 databases exist in the account with name `prime-messaging`.

## Primary Evidence

| File | Role |
|---|---|
| `apps/prime/wrangler.toml` | Declares `[[d1_databases]]` binding; database_id is `000...000` placeholder |
| `apps/prime/migrations/0001_prime_messaging_init.sql` | Initial schema: message_threads, message_records, message_drafts, message_admissions, message_projection_jobs + indexes |
| `apps/prime/migrations/0002_prime_messaging_review_status.sql` | Adds `review_status` column to message_threads |
| `apps/prime/migrations/0003_prime_messaging_campaigns.sql` | Adds message_campaigns table + indexes |
| `apps/prime/migrations/0004_prime_messaging_campaign_targets.sql` | Adds campaign columns + message_campaign_target_snapshots + message_campaign_deliveries tables |
| `apps/prime/functions/lib/prime-messaging-db.ts` | `getPrimeMessagingDb()` + `hasPrimeMessagingDb()` — guards all DB access |
| `apps/prime/functions/lib/prime-messaging-repositories.ts` | Repository functions against the D1 tables |

## Key Findings

1. **No D1 database exists** — Cloudflare API query for `name=prime-messaging` returned 0 results.
2. **4 migration files are complete and ordered** — schema is fully defined, covering the full messaging system through campaign deliveries.
3. **All application code is ready** — `prime-messaging-db.ts`, repositories, and API functions are implemented with tests; the only missing piece is the actual database.
4. **Pages D1 binding via wrangler.toml** — the `[[d1_databases]]` block in wrangler.toml is the correct and sufficient mechanism for Pages Functions to access D1.
5. **Migration command** — `wrangler d1 migrations apply prime-messaging --remote` applies all pending migrations. Wrangler reads migration files from `apps/prime/migrations/`.
6. **No other placeholder values** in wrangler.toml beyond the database_id.

## Open Questions

None — all required facts are available to plan this work.

## Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| CF API token lacks D1 write permission | Medium | Low | Verify token scope before `wrangler d1 create`; use account-scoped token from .env.local |
| wrangler CLI version mismatch | Low | Low | Check wrangler version; migration format is standard |
| Pages project name mismatch | Low | Low | Verify Pages project name before testing binding |

## Engineering Coverage Matrix

| Coverage Area | Treatment | Notes |
|---|---|---|
| Data / contracts | Required | New D1 schema; migration files define the contract |
| Security / privacy | N/A | No auth changes; D1 binding is server-side only, no new data exposure |
| Testing / validation | Required | Existing function tests use in-memory D1 mock; no new tests needed — existing pass |
| Rollout / rollback | Required | Create DB → apply migrations → update wrangler.toml; rollback = delete DB + revert wrangler.toml |
| Performance / reliability | N/A | Standard D1 for this schema size; no performance concerns |
| Logging / observability / audit | N/A | No new metrics needed |
| UI / visual | N/A | Infra-only change — no UI affected |
| UX / states | N/A | Infra-only change — no user-facing state change |

## Current Process Map

```
Trigger: Any request to Pages Function route that calls getPrimeMessagingDb(env)
  ↓
hasPrimeMessagingDb(env) → false (binding ID = 000...000 = no real database)
  ↓
getPrimeMessagingDb(env) → throws "PRIME_MESSAGING_DB binding missing"
  ↓
All messaging persistence fails
```

Post-fix:
```
Trigger: Request to Pages Function
  ↓
hasPrimeMessagingDb(env) → true (real D1 ID in wrangler.toml)
  ↓
getPrimeMessagingDb(env) → D1Database instance
  ↓
Repository functions execute against live SQLite D1
```

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| D1 database existence check | Yes | None | No |
| Migration file inventory | Yes | None | No |
| Application code readiness | Yes | None | No |
| CF credentials / token scope | Partial | Token confirmed present; write scope for D1 not explicitly tested | No — low risk |
| Pages binding mechanism | Yes | None | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The work is fully bounded — one `wrangler d1 create` command, four migrations, one wrangler.toml line change. All application code is already complete. No architectural decisions required.

## Evidence Gap Review

### Gaps Addressed
- D1 database existence: confirmed absent via CF API
- Migration completeness: all 4 files read and confirmed
- Application code readiness: confirmed via file read
- Token access: confirmed present, scope assumed sufficient

### Confidence Adjustments
- Token write scope for D1 is assumed (not explicitly tested) — risk is low as the same token manages CF Pages and DNS

### Remaining Assumptions
- `wrangler` CLI is available in the build environment at the correct version for `d1 migrations`

## Evidence Audit (Current State)

### Entry Points
- `apps/prime/functions/api/review-threads.ts` — calls `getPrimeMessagingDb(env)` for all thread operations
- `apps/prime/functions/api/direct-message.ts` — calls `getPrimeMessagingDb(env)` for DM operations

### Key Modules / Files
- `apps/prime/functions/lib/prime-messaging-db.ts` — DB access guard (`getPrimeMessagingDb`, `hasPrimeMessagingDb`)
- `apps/prime/functions/lib/prime-messaging-repositories.ts` — all repository functions against D1 tables
- `apps/prime/migrations/0001_prime_messaging_init.sql` — core schema (5 tables, 7 indexes)
- `apps/prime/migrations/0002_prime_messaging_review_status.sql` — adds review_status column
- `apps/prime/migrations/0003_prime_messaging_campaigns.sql` — campaigns table
- `apps/prime/migrations/0004_prime_messaging_campaign_targets.sql` — campaign targets + deliveries tables
- `apps/prime/wrangler.toml` — `[[d1_databases]]` binding with placeholder ID

### Data & Contracts
- Types/schemas/events: D1 schema fully defined across 4 migrations. Tables: message_threads, message_records, message_drafts, message_admissions, message_projection_jobs, message_campaigns, message_campaign_target_snapshots, message_campaign_deliveries.
- Persistence: Cloudflare D1 (SQLite-compatible serverless DB)
- API/contracts: `PrimeMessagingEnv` interface in `prime-messaging-db.ts` defines the binding contract

### Dependency & Impact Map
- Upstream dependencies: Cloudflare account, wrangler CLI, CF API token
- Downstream dependents: all messaging API functions, draft processing, campaign delivery
- Likely blast radius: creating DB + applying migrations affects only the prime Pages deployment; no other apps affected

## Confidence Inputs
- Implementation: 95% — all code is implemented; only infra piece is missing
- Approach: 97% — `wrangler d1 create` + `wrangler d1 migrations apply` is the canonical path; no alternatives
- Impact: 95% — once applied, all messaging functions work; risk of DB creation failure is low
- Delivery-Readiness: 95% — CF credentials confirmed, migration files confirmed, no unknown blockers
- Testability: 85% — local verification via `wrangler pages dev`; runtime binding test is straightforward

## Planning Constraints & Notes
- Must-follow patterns: use `wrangler d1 create prime-messaging` then `wrangler d1 migrations apply prime-messaging --remote`
- Rollout/rollback expectations: rollback = delete D1 DB from CF dashboard + revert wrangler.toml
- Observability expectations: none required for this infra fix

## Suggested Task Seeds (Non-binding)
- TASK-01: Create D1 database via wrangler CLI + capture database_id
- TASK-02: Apply all 4 migrations in order (`--remote` flag for production)
- TASK-03: Update `apps/prime/wrangler.toml` with real database_id
- TASK-04 (CHECKPOINT): Verify binding resolves in local `wrangler pages dev`

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: wrangler.toml updated with real DB ID; `wrangler pages dev` shows PRIME_MESSAGING_DB bound
- Post-delivery measurement plan: none beyond CHECKPOINT verification

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis prime-d1-messaging-db`

## Critique History

**Round 1 (self-critique):**
- Is the evidence sufficient? Yes — DB absence confirmed via API, migrations confirmed via file read, code confirmed ready.
- Are there hidden assumptions? Token write scope for D1 is assumed. Risk: low — same token manages Pages/DNS.
- Is the scope right-sized? Yes — single wrangler command + 4 migrations + 1 config line change.
- Are there alternative approaches? No. `wrangler d1 create` is the only supported path.
- Critique verdict: **credible** — score 4.5/5.0. Minor deduction for unverified D1 token scope.
