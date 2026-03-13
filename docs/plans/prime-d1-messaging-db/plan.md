---
Type: Plan
Status: Active
Domain: Infra
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-d1-messaging-db
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-007
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 92%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/prime-d1-messaging-db/analysis.md
---

# Prime D1 Messaging Database — Plan

## Summary

The prime guest app's messaging system is fully implemented in code but inoperative in production because the backing Cloudflare D1 database was never created. The `wrangler.toml` binding `PRIME_MESSAGING_DB` has a placeholder `database_id`. This plan creates the real D1 database, applies all 4 migration files in order, and updates `wrangler.toml` with the real ID. A CHECKPOINT task verifies the binding resolves correctly before the plan is marked complete. No application code changes are required.

## Active tasks

- [x] TASK-01: Create `prime-messaging` D1 database via wrangler CLI
- [x] TASK-02: Apply all 4 migrations to the remote D1 database
- [x] TASK-03: Update `apps/prime/wrangler.toml` with real `database_id`
- [ ] TASK-04: CHECKPOINT — verify PRIME_MESSAGING_DB binding resolves

## Goals

- PRIME_MESSAGING_DB D1 database created in CF account `9e2c24d2db8e38f743f0ad6f9dfcfd65`
- All 4 migrations (0001–0004) applied; full schema present
- `apps/prime/wrangler.toml` `database_id` updated from placeholder to real UUID
- Binding resolves correctly in local `wrangler pages dev` environment

## Non-goals

- Any changes to messaging application code or API function logic
- Migrating existing data (database is new; no existing data)
- Cloudflare Pages dashboard binding changes (wrangler.toml is source of truth)

## Constraints & Assumptions

- Constraints:
  - CF account `9e2c24d2db8e38f743f0ad6f9dfcfd65`; account-scoped API token in `.env.local`
  - Cloudflare Pages deployment — `wrangler pages dev` picks up `[[d1_databases]]` from wrangler.toml
  - Migration files follow `wrangler d1 migrations` format (numbered SQL in `apps/prime/migrations/`)
  - `database_name = "prime-messaging"` already set in wrangler.toml line 13
- Assumptions:
  - `wrangler` CLI is available locally
  - Account-scoped CF token has D1 create/migrate write scope (same token manages Pages + DNS)
  - `wrangler d1 migrations apply <name> --remote` applies all pending migrations in filename order

## Inherited Outcome Contract

- **Why:** The prime app includes a messaging database for storing guest messages. The database ID in the deployment config is a placeholder that was never replaced with a real one. Any feature that reads or writes messages will not work in production.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The real Cloudflare D1 database ID is in wrangler.toml, migrations have been applied, and the PRIME_MESSAGING_DB binding resolves correctly at runtime.
- **Source:** operator

## Analysis Reference

- Related analysis: `docs/plans/prime-d1-messaging-db/analysis.md`
- Selected approach inherited:
  - Option A: Create D1 database + apply migrations + update wrangler.toml
- Key reasoning used:
  - All application code is complete and tested; only the infrastructure is missing
  - Option B (remove binding) destroys working code — rejected
  - Option C (feature flag) hides the problem without fixing it — rejected

## Selected Approach Summary

- What was chosen:
  - Run `wrangler d1 create prime-messaging` → capture real database_id → apply 4 migrations via `wrangler d1 migrations apply prime-messaging --remote` → write database_id to wrangler.toml → verify binding in Pages dev
- Why planning is not reopening option selection:
  - Analysis eliminated all alternatives with explicit rationale; no operator-only forks remain open

## Fact-Find Support

- Supporting brief: `docs/plans/prime-d1-messaging-db/fact-find.md`
- Evidence carried forward:
  - CF API confirmed: 0 databases named `prime-messaging` exist in account
  - 4 migration files confirmed complete and ordered: `apps/prime/migrations/0001–0004_*.sql`
  - All application code confirmed implemented with tests (in-memory D1 mock)
  - `hasPrimeMessagingDb()` guard prevents hard crashes; direct callers throw at runtime

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `prime-messaging` D1 database via wrangler CLI | 92% | S | Complete (2026-03-13) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Apply all 4 migrations to remote D1 database | 92% | S | Complete (2026-03-13) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Update `apps/prime/wrangler.toml` with real `database_id` | 95% | S | Complete (2026-03-13) | TASK-01 | TASK-04 |
| TASK-04 | CHECKPOINT | Verify PRIME_MESSAGING_DB binding resolves | 95% | S | Pending | TASK-02, TASK-03 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A | - | Infra-only change; no UI affected |
| UX / states | N/A | - | No user-facing state change |
| Security / privacy | N/A | - | D1 binding is server-side only; no new data exposure |
| Logging / observability / audit | N/A | - | No new metrics needed |
| Testing / validation | Existing in-memory D1 mock tests pass unchanged | TASK-04 | No new tests required; CHECKPOINT is primary signal |
| Data / contracts | 4 migrations define full schema; applied in order | TASK-02 | Tables: message_threads, message_records, message_drafts, message_admissions, message_projection_jobs, message_campaigns, message_campaign_target_snapshots, message_campaign_deliveries |
| Performance / reliability | N/A | - | Standard D1 for this schema size |
| Rollout / rollback | Rollout: create DB → apply migrations → update wrangler.toml. Rollback: delete DB from CF dashboard + revert wrangler.toml to placeholder | TASK-01, TASK-03 | Clean rollback path |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Create DB; output is database_id |
| 2 | TASK-02, TASK-03 | TASK-01 complete | Can run in parallel: migrations use DB name; wrangler.toml update uses DB ID from TASK-01 |
| 3 | TASK-04 | TASK-02, TASK-03 complete | CHECKPOINT verification requires both migrations applied and wrangler.toml updated |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| PRIME_MESSAGING_DB binding | Any CF Pages deploy or `wrangler pages dev` | 1. DB created via `wrangler d1 create prime-messaging` → real UUID captured. 2. `wrangler.toml` database_id updated. 3. Pages picks up real binding. 4. `hasPrimeMessagingDb(env)` returns true. 5. Repository functions execute against live D1. | TASK-01, TASK-03 | Rollback: delete DB + revert wrangler.toml |
| Migration state | After TASK-01 completes | 1. `wrangler d1 migrations apply prime-messaging --remote` runs. 2. Migrations 0001–0004 applied in filename order. 3. All 8 tables + indexes present. | TASK-02 | Migration ordering enforced by wrangler; `--remote` applies all pending in sequence |
| Messaging API functions | Guest/staff request to messaging endpoint | 1. `getPrimeMessagingDb(env)` called. 2. Binding resolves to live D1Database instance. 3. Repository functions execute. 4. Data persisted. | TASK-01, TASK-02, TASK-03 | Application code unchanged; no seams |

## Tasks

### TASK-01: Create `prime-messaging` D1 database via wrangler CLI

- **Type:** IMPLEMENT
- **Deliverable:** New D1 database named `prime-messaging` in CF account; `database_id` UUID captured for use in TASK-03
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** `wrangler d1 create prime-messaging` exited 0. Database UUID: `23db01e1-8e9a-4e0d-9ce4-2f46bb32df70`. Region: WEUR. TC-01 passed.
- **Affects:** None (output is CF remote state; used in TASK-03 to update wrangler.toml)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 92%
  - Implementation: 92% — `wrangler d1 create <name>` is the standard command; output format is predictable
  - Approach: 97% — canonical path; no alternatives
  - Impact: 95% — creates the database required by all downstream tasks
- **Acceptance:**
  - `wrangler d1 create prime-messaging` completes with exit 0
  - Output JSON contains a non-placeholder `uuid` field
  - `wrangler d1 list` (or `wrangler d1 info prime-messaging`) confirms the database exists
- **Engineering Coverage:**
  - UI / visual: N/A — no UI affected
  - UX / states: N/A — no user-facing change
  - Security / privacy: N/A — server-side binding; no new exposure
  - Logging / observability / audit: N/A — no new metrics
  - Testing / validation: N/A — CLI operation; no test coverage needed
  - Data / contracts: Required — DB creation is the prerequisite for schema initialization
  - Performance / reliability: N/A — standard D1 provisioning
  - Rollout / rollback: Required — rollback = `wrangler d1 delete prime-messaging` (or CF dashboard deletion)
- **Validation contract (TC-01):**
  - TC-01: `wrangler d1 create prime-messaging` → exits 0, output JSON contains `uuid` (32-char hex, not all-zeros)
  - TC-02: Token scope insufficient → exits non-zero with auth error → mitigation: elevate token scope via CF dashboard or supply D1-scoped token
- **Execution plan:** Run `wrangler d1 create prime-messaging` → parse `uuid` from JSON output → confirm it matches expected UUID format → record ID for TASK-03
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** CF token scope — confirmed by attempt; if auth error, use CF dashboard to create DB manually and retrieve ID
- **Edge Cases & Hardening:** If DB already exists with same name (unlikely — CF API confirmed absent), `wrangler d1 create` will error; resolve by running `wrangler d1 list` to retrieve the existing ID
- **What would make this >=90%:**
  - Explicitly confirmed token has D1 scope (90% → 97%)
- **Rollout / rollback:**
  - Rollout: `wrangler d1 create prime-messaging`
  - Rollback: Delete `prime-messaging` DB from CF dashboard or via `wrangler d1 delete prime-messaging`
- **Documentation impact:** None: infra operation; no docs needed
- **Notes / references:**
  - wrangler.toml line 13: `database_name = "prime-messaging"` — must match
  - CF account: `9e2c24d2db8e38f743f0ad6f9dfcfd65`

---

### TASK-02: Apply all 4 migrations to remote D1 database

- **Type:** IMPLEMENT
- **Deliverable:** All 4 migration SQL files applied to `prime-messaging` D1 database; full schema present
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** `wrangler d1 migrations apply prime-messaging --remote` exited 0. All 4 migrations applied (0001–0004 all ✅). Schema verified: 8 expected tables present. TC-03 passed. Note: TASK-03 (wrangler.toml update) had to execute before this task — wrangler resolves migrations by database_id from wrangler.toml, not by name alone.
- **Affects:** None (remote D1 state only; no local file changes)
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 92%
  - Implementation: 92% — `wrangler d1 migrations apply <name> --remote` is the canonical command; migration files are confirmed complete
  - Approach: 95% — no alternatives exist for applying wrangler-format migrations
  - Impact: 95% — initializes the full schema required by all messaging functions
- **Acceptance:**
  - `wrangler d1 migrations apply prime-messaging --remote` exits 0
  - All 4 migrations shown as applied in wrangler output
  - `wrangler d1 execute prime-messaging --remote --command "SELECT name FROM sqlite_master WHERE type='table'"` returns all 8 expected tables: `message_threads`, `message_records`, `message_drafts`, `message_admissions`, `message_projection_jobs`, `message_campaigns`, `message_campaign_target_snapshots`, `message_campaign_deliveries`
- **Engineering Coverage:**
  - UI / visual: N/A — no UI affected
  - UX / states: N/A — no user-facing change
  - Security / privacy: N/A — server-side DB; no new exposure
  - Logging / observability / audit: N/A — no new metrics
  - Testing / validation: Required — table verification query confirms schema is correct
  - Data / contracts: Required — 4 migrations define the full messaging schema; must all be applied in order
  - Performance / reliability: N/A — standard D1; no performance impact at this schema size
  - Rollout / rollback: Required — rollback by deleting the database (new DB; no data to preserve)
- **Validation contract (TC-03):**
  - TC-03: `wrangler d1 migrations apply prime-messaging --remote` → all 4 migrations shown applied; 8 tables present on schema query
  - TC-04: Migration file ordering error → wrangler respects numeric filename order; if one fails, wrangler stops and reports; fix migration file and re-apply
- **Execution plan:** Run `wrangler d1 migrations apply prime-messaging --remote` from `apps/prime/` directory (wrangler reads migration dir from `migrations/` by convention) → confirm all 4 applied → run schema verification query
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** Migration directory path — wrangler reads migrations from CWD-relative `migrations/`; run command from `apps/prime/` to ensure correct path
- **Edge Cases & Hardening:** If migrations fail partway, wrangler reports which migration failed; fix and re-run (already-applied migrations are skipped)
- **What would make this >=90%:**
  - Confirmed migration directory path resolution (90% → 97%)
- **Rollout / rollback:**
  - Rollout: `wrangler d1 migrations apply prime-messaging --remote`
  - Rollback: DB deletion (new DB; no production data at risk)
- **Documentation impact:** None: infra operation
- **Notes / references:**
  - Migration files: `apps/prime/migrations/0001_prime_messaging_init.sql` through `0004_prime_messaging_campaign_targets.sql`
  - Run from `apps/prime/` directory to ensure wrangler finds `migrations/` correctly

---

### TASK-03: Update `apps/prime/wrangler.toml` with real `database_id`

- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/wrangler.toml` line 14 updated from `"00000000000000000000000000000000"` to the real UUID captured in TASK-01
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** `apps/prime/wrangler.toml` updated: `database_id = "23db01e1-8e9a-4e0d-9ce4-2f46bb32df70"`. TODO comment removed. TC-03 passed: grep confirms real UUID present. Executed before TASK-02 because wrangler resolves migrations by database_id from wrangler.toml.
- **Affects:** `apps/prime/wrangler.toml`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 95%
  - Implementation: 97% — single-line file edit; exact target line is known
  - Approach: 97% — no alternatives; wrangler.toml is the source of truth for Pages D1 binding
  - Impact: 95% — enables Pages to resolve PRIME_MESSAGING_DB at runtime
- **Acceptance:**
  - `apps/prime/wrangler.toml` line 14: `database_id = "<real-uuid>"` (not all-zeros, not placeholder)
  - `grep database_id apps/prime/wrangler.toml` returns the real UUID
  - TODO comment removed from that line
- **Engineering Coverage:**
  - UI / visual: N/A — no UI affected
  - UX / states: N/A — no user-facing change
  - Security / privacy: N/A — database_id is not a secret; it is a public identifier
  - Logging / observability / audit: N/A — no new metrics
  - Testing / validation: Required — verify by grepping wrangler.toml after edit
  - Data / contracts: Required — wrangler.toml is the source of truth for the D1 binding
  - Performance / reliability: N/A — config change only
  - Rollout / rollback: Required — rollback = revert wrangler.toml to placeholder (or git revert)
- **Validation contract (TC-03):**
  - TC-03: `grep database_id apps/prime/wrangler.toml` → returns `database_id = "<32-char-hex-UUID>"` (not all-zeros)
  - TC-04: wrangler.toml parse error → `wrangler pages dev` reports toml error; fix format and retry
- **Execution plan:** Replace line 14 in `apps/prime/wrangler.toml`: change `"00000000000000000000000000000000"` to the UUID from TASK-01 output; remove `# replace with real D1 id` comment
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** UUID format — confirm `wrangler d1 create` output is in UUID format (hex with or without dashes); wrangler accepts both formats in toml
- **Edge Cases & Hardening:** If UUID captured from TASK-01 is in wrong format, wrangler will error on next Pages dev run; verify format before committing
- **What would make this >=90%:**
  - Already at 95% — minimal risk
- **Rollout / rollback:**
  - Rollout: Edit wrangler.toml with real UUID
  - Rollback: `git revert` the wrangler.toml change or manually restore placeholder
- **Documentation impact:** None: config file edit; no docs needed
- **Notes / references:**
  - `apps/prime/wrangler.toml` line 14: `database_id = "00000000000000000000000000000000" # replace with real D1 id`
  - database_id is a public identifier; it is safe to commit to the repository

---

### TASK-04: CHECKPOINT — Verify PRIME_MESSAGING_DB binding resolves

- **Type:** CHECKPOINT
- **Deliverable:** Confirmation that PRIME_MESSAGING_DB binding resolves correctly in Pages dev
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/prime-d1-messaging-db/plan.md`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — verification procedure is defined
  - Approach: 95% — prevents silent binding failure from going undetected
  - Impact: 95% — controls delivery risk
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - `/lp-do-replan` run on downstream tasks if confidence has changed
  - Binding verification: run `wrangler pages dev` from `apps/prime/`; confirm no "PRIME_MESSAGING_DB binding missing" errors in startup output
  - Functional probe: `curl -s http://localhost:8788/api/review-threads` returns a response that is not `{"error":"PRIME_MESSAGING_DB binding missing"}` (auth error or empty-result response both confirm binding resolved)
  - Alternatively: add a quick `console.log('[D1]', hasPrimeMessagingDb(env))` probe to any function and confirm `true` in wrangler dev output
- **Horizon assumptions to validate:**
  - Pages project name `prime` matches CF Pages dashboard project (wrangler.toml `name = "prime"`)
  - Token scope was sufficient (TASK-01 success already validates this)
  - All 4 migrations applied correctly (TASK-02 schema verification query already validates this)
- **Validation contract:** `wrangler pages dev` starts without binding errors; functional probe confirms binding resolves
- **Planning validation:** If binding fails: check `wrangler.toml` UUID matches CF dashboard; re-run `wrangler d1 info prime-messaging` to confirm DB ID
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Plan status updated to reflect completion

---

## Risks & Mitigations

- **CF token lacks D1 write scope** (Low/Medium): If `wrangler d1 create` fails with auth error, use CF dashboard to create DB manually and retrieve UUID. Same account-scoped token manages Pages and DNS — low probability.
- **wrangler CLI unavailable** (Low/High): Pre-check `wrangler --version` before TASK-01. Install via `npm i -g wrangler` if missing.
- **Migration directory path incorrect** (Low/Low): Run `wrangler d1 migrations apply` from `apps/prime/` directory to ensure `migrations/` is found.

## Observability

- Logging: `hasPrimeMessagingDb()` logs binding status at function entry (existing guard)
- Metrics: None: no new metrics needed
- Alerts/Dashboards: None: no new dashboards needed

## Acceptance Criteria (overall)

- [ ] `wrangler d1 list` confirms `prime-messaging` database exists in CF account
- [ ] `wrangler d1 execute prime-messaging --remote --command "SELECT count(*) FROM sqlite_master WHERE type='table'"` returns 8
- [ ] `apps/prime/wrangler.toml` `database_id` is a valid non-placeholder UUID
- [ ] `wrangler pages dev` starts without PRIME_MESSAGING_DB binding errors
- [ ] Functional probe confirms binding resolves (non-binding-error response from messaging endpoint)

## Decision Log

- 2026-03-13: Option A selected (create DB + apply migrations). Options B (remove binding) and C (feature flag) explicitly rejected in analysis.
- 2026-03-13: TASK-02 and TASK-03 parallelized in Wave 2 — migrations use DB name; wrangler.toml update uses DB ID; both unblock independently after TASK-01.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create D1 database | No prior dependencies | None | No |
| TASK-02: Apply migrations | TASK-01 DB exists | None — migrations use DB name, not wrangler.toml ID; CWD constraint noted in Scouts | No |
| TASK-03: Update wrangler.toml | TASK-01 UUID captured | None | No |
| TASK-04: Verify binding | TASK-02 migrations applied, TASK-03 ID in wrangler.toml | None — both preconditions enforced by dependency graph | No |

## Overall-confidence Calculation

- All tasks S effort (weight 1 each)
- TASK-01: 92%, TASK-02: 92%, TASK-03: 95%, TASK-04: 95%
- Overall = (92 + 92 + 95 + 95) / 4 = 374 / 4 = **93.5% → rounded to 92%** (conservative rounding applied for token scope assumption — the single unverified external dependency)
