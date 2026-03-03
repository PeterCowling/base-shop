---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra / Data
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: bos-standing-data-domain-container-split
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: startup-loop-gap-fill
Loop-Gap-Trigger: bottleneck
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/bos-standing-data-domain-container-split/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
---

# BOS Standing Data Domain Container Split Fact-Find Brief

## Scope

### Summary

`docs/business-os/strategy/` is an undifferentiated catch-all holding 229+ files across 9 businesses. Brand dossiers, solution decisions, signal reviews, forecasts, product specs, and KPCs decisions all share one flat per-business directory with no domain separation. This makes CASS retrieval less precise, makes it difficult to scope signals to a domain, and will become unnavigable as more businesses and processes are added. The fix is to split each business directory into 5 domain containers: `assessment/` (pre-launch, one-time), `legal/`, `product/`, `marketing/`, `sales/` (all ongoing post-assessment). Each container follows the `.user.md` + `.user.html` endpoint convention. This is a full migration — ~210 files move now.

### Goals
- Create `assessment/`, `product/`, `marketing/`, `sales/`, `legal/` containers inside each business directory under `docs/business-os/strategy/<BIZ>/`
- Move all existing strategy files into the correct container
- Update all code references (scripts, registry files, test fixtures, business-os app auth)
- Update `DEFAULT_SOURCE_ROOTS` in `cass-retrieve.ts` to list per-container roots after migration
- Update `docs/registry.json` (145 entries) and `standing-registry.json` (50+ entries) to new paths
- Regenerate `.user.html` for all moved `.user.md` files

### Non-goals
- Changing the container naming convention for files (filenames stay as-is, only parent directory changes)
- Creating new process artifacts (migration only — no new content)
- Introducing a new `legal/` artifact yet (0 legal files currently; container is created but empty)
- Changing how `render-user-doc-html.ts` works (existing generator stays unchanged)

### Constraints & Assumptions
- Constraints:
  - All tests run in CI only — local test run not possible (`docs/testing-policy.md`)
  - Pre-commit hooks must not be bypassed (`--no-verify` forbidden)
  - Writer lock required for multi-file commits (`scripts/agents/with-writer-lock.sh`)
  - `BRIK/apps/` and `BRIK/data/` subdirs are pre-existing nested structures — need explicit mapping decisions
  - `HEAD/decisions/` and similar pre-existing subdirs need to stay coherent
- Assumptions:
  - `BRIK/apps/reception/` → `BRIK/product/apps/reception/` (reception-app design docs are product artifacts)
  - `BRIK/data/` (CSV + meta.md files) → stays at `BRIK/data/` (operational data, not a standing strategy artifact — out of container scope)
  - Root-level files (`plan.user.md`, `plan.agent.md`, `index.user.md`, `businesses.json`, `business-maturity-model.md`, `startup-loop-holistic-strategy.md`, `_templates/`) stay at their current locations
  - Plain `.md` files (no `.user.` prefix) do not have HTML counterparts; no re-render needed for them
  - `process-improvements.json` and `build-summary.json` are generated files — regenerate after migration rather than hand-edit
- `BRIK/data/*.meta.md` files have no entries in `docs/registry.json` or `standing-registry.json`; verify during TASK-01 classification

## Outcome Contract

- **Why:** `docs/business-os/strategy/` mixes assessment artifacts, product specs, marketing signals, and sales forecasts in one undifferentiated bucket. As more businesses and processes are added this structure will become unnavigable. Domain containers give each process a clear home, make CASS retrieval more precise, and enforce the `.user.md` + `.user.html` endpoint convention already proven with `plan.user.md`.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `docs/business-os/strategy/<BIZ>/` reorganized into 5 domain containers (assessment, legal, product, marketing, sales) for all 5 active businesses; all existing strategy content fully migrated to the correct container; CASS `DEFAULT_SOURCE_ROOTS`, `docs/registry.json`, and `standing-registry.json` updated to new paths; all CI tests pass on dev.
- **Source:** operator

## Access Declarations

- `docs/business-os/strategy/**` — read-write (file moves)
- `scripts/src/**` — read-write (path updates)
- `docs/registry.json` — read-write (path updates)
- `docs/business-os/startup-loop/ideas/standing-registry.json` — read-write (path updates)
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` — read-write (path updates to evidence_refs)
- `apps/business-os/**` — read-write (auth rules update)
- CI GitHub Actions — read-only (verify tests pass)

## Evidence Audit (Current State)

### Entry Points

- `docs/business-os/strategy/` — top-level directory; 9 business subdirs + 3 root files + `_templates/`
- `scripts/src/startup-loop/cass-retrieve.ts:DEFAULT_SOURCE_ROOTS` — single `"docs/business-os/strategy"` entry; needs to become per-container entries after split
- `docs/registry.json` — 145 entries at `docs/business-os/strategy/` paths
- `docs/business-os/startup-loop/ideas/standing-registry.json` — 50+ entries; artifact `path` fields all at strategy/ locations

### File Classification by Business

Full per-business counts from investigation. Each count is files; `.user.md` files have a corresponding `.user.html` that also moves.

| Business | Assessment | Product | Marketing | Sales | Legal | Keep-at-root | Total |
|---|---|---|---|---|---|---|---|
| BRIK | 13 | 8 | 2 | 13 | 0 | 3 (+apps/ +data/) | ~39 |
| HBAG | 30 | 14 | 6 | 0 | 0 | 5 | ~55 |
| HEAD | 50 | 5 | 0 | 13 | 0 | 6 (+decisions/) | ~74 |
| PET | 6 | 0 | 0 | 10 | 0 | 5 | ~21 |
| PWRB | 8 | 0 | 1 | 0 | 0 | 2 (+assets/) | ~11 |
| BOS | 0 | 0 | 0 | 2 | 0 | 2 | 4 |
| XA | 0 | 0 | 0 | 0 | 0 | 2 | 2 |
| PIPE | 0 | 0 | 0 | 0 | 0 | 2 | 2 |
| PLAT | 0 | 0 | 0 | 0 | 0 | 2 | 2 |
| **Total** | **~107** | **~27** | **~9** | **~38** | **0** | **~27** | **~210** |

Notes:
- XA, PIPE, PLAT have only root-level files (plan.user.md, plan.agent.md) — no container creation needed
- BOS has 2 sales-adjacent files (CASS scorecard) + 2 root agent/plan docs
- `HEAD/decisions/` subdir: contents are assessment artifacts; `decisions/` becomes `assessment/` (or moves into it)
- `BRIK/apps/reception/` → `BRIK/product/apps/reception/`
- `BRIK/data/` (CSV + operational data): stays at `BRIK/data/` — not a domain container artifact

**Assessment examples:** brand-identity-dossier, solution-decision, candidate-names, brand-profile, problem-statement, naming-generation-spec, measurement-profile, launch-distribution-plan, prioritization-scorecard, weekly-kpcs-decision, brand-strategy
**Product examples:** product-spec, worldclass-benchmark, worldclass-goal, worldclass-research-prompt, worldclass-scan, room-pricing-analysis, product-spec-sources, prime-app-design-branding
**Marketing examples:** signal-review-*, website-iteration-*, competitor-scan-*
**Sales examples:** revenue-architecture, 90-day-forecast, ga4-search-console-setup-note, historical-performance-baseline, octorate-operational-data-baseline, sales-funnel-brief, octorate-process-reduction-feasibility

### Key Modules / Files

**Source scripts requiring path updates:**
- `scripts/src/startup-loop/cass-retrieve.ts` — `DEFAULT_SOURCE_ROOTS` (1 reference)
- `scripts/src/startup-loop/compile-website-content-packet.ts` — 6+ hardcoded strategy/ paths
- `scripts/src/startup-loop/generate-build-summary.ts` — 5 references
- `scripts/src/startup-loop/contract-lint.ts` — hardcoded artifact paths
- `scripts/src/startup-loop/s6b-gates.ts` — hardcoded paths
- `scripts/src/startup-loop/lp-do-ideas-registry-migrate-v1-v2.ts` — strategy paths in migration logic
- `scripts/src/startup-loop/map-logistics-policy-blocks.ts` — strategy path references
- `scripts/src/startup-loop/naming/rdap-cli.ts` — HEAD naming-sidecar paths
- `scripts/src/startup-loop/naming/tm-prescreen-cli.ts` — HEAD naming-sidecar absolute paths
- `scripts/src/render-user-doc-html.ts` — strategy references (render invocation paths)
- `scripts/src/brikette/export-cloudflare-monthly-proxies.ts` — references BRIK/data/ (likely safe — data/ stays)
- `scripts/src/ci/filter-config.ts` — CI filter paths

**Test files (23) requiring fixture path updates:**
All under `scripts/src/startup-loop/__tests__/`:
`lp-do-ideas-trial.test.ts`, `lp-do-ideas-dispatch-v2.test.ts`, `lp-do-ideas-live.test.ts`, `lp-do-ideas-live-integration.test.ts`, `lp-do-ideas-live-hook.test.ts`, `lp-do-ideas-routing-adapter.test.ts`, `lp-do-ideas-persistence.test.ts`, `lp-do-ideas-trial-queue.test.ts`, `lp-do-ideas-propagation.test.ts`, `lp-do-ideas-fingerprint.test.ts`, `lp-do-ideas-metrics-runner.test.ts`, `lp-do-ideas-registry-migrate-v1-v2.test.ts`, `generate-build-summary.test.ts`, `compile-website-content-packet.test.ts`, `contract-lint.test.ts`, `website-contract-parity.test.ts`, `website-iteration-throughput-report.test.ts`, `materialize-site-content-payload.test.ts`, `map-artifact-delta-to-website-backlog.test.ts`, `s2-market-intelligence-handoff.test.ts`, `learning-ledger.test.ts`, `map-logistics-policy-blocks.test.ts`, `cass-retrieve.test.ts`

**Business-OS app:**
- `apps/business-os/src/` — `authorize.ts` has path-based auth rules for `strategy/*.json` and `strategy/*/*.md` patterns; `repo-reader.ts`, `PlanDocumentPage.tsx` reference strategy/ paths

**Data / registry files:**
- `docs/registry.json` — 145 entries at strategy/ paths; needs systematic path substitution
- `docs/business-os/startup-loop/ideas/standing-registry.json` — **15 entries** (261 lines total); `path` and `location_anchors` fields
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` — `location_anchors` and `evidence_refs` reference strategy/ paths (advisory; lower priority)
- `docs/business-os/_data/process-improvements.json` — generated; regenerate post-migration
- `docs/business-os/_data/build-summary.json` — generated; regenerate post-migration

**Skills referencing strategy paths:**
- `.claude/skills/lp-seo/SKILL.md` — references strategy/ path convention

**GitHub workflow:**
- `.github/workflows/brik-weekly-kpi-reminder.yml` — references strategy paths

### Patterns & Conventions Observed

- `.user.md` + `.user.html` endpoint convention: `plan.user.md` (hand-authored) + `plan.user.html` (generated by `render-user-doc-html.ts`) — this is the target model for container endpoints
- `render-user-doc-html.ts`: deterministic; invoked as `pnpm docs:render-user-html -- <path>`; generates HTML for any `.user.md` file regardless of location
- `git mv` must be used for file moves to preserve history
- No skills write to `strategy/` — all skills are read-only consumers; migration risk is confined to path references

### Test Landscape

#### Test Infrastructure
- Framework: Jest (governed runner)
- Command: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=<pattern> --no-coverage`
- CI integration: tests run on push to CI only (`docs/testing-policy.md` — NEVER run locally)

#### Existing Test Coverage
| Area | Test Type | Key files | Notes |
|---|---|---|---|
| lp-do-ideas pipeline | Unit/integration | `lp-do-ideas-*.test.ts` (11 files) | Heavy use of strategy/ fixtures |
| compile-website-content-packet | Unit | `compile-website-content-packet.test.ts` | 6+ strategy/ paths in fixtures |
| contract-lint | Unit | `contract-lint.test.ts` | Hardcoded strategy artifact paths |
| cass-retrieve | Unit | `cass-retrieve.test.ts` | `DEFAULT_SOURCE_ROOTS` (just added) |
| generate-build-summary | Unit | `generate-build-summary.test.ts` | 5 strategy/ fixture paths |

#### Coverage Gaps
- No test covers the `render-user-doc-html.ts` regeneration step after a file move
- No migration test to verify all 145 registry.json entries remain valid post-move

#### Testability Assessment
- Easy to test: path substitution correctness (grep verification scripts)
- Hard to test: HTML re-render correctness (render is deterministic but output verification requires CI)
- Test seams needed: TASK-02 (migration script) should produce a verification log for CI

### Dependency & Impact Map

- Upstream dependencies: none (migration is self-contained)
- Downstream dependents:
  - CASS retrieval — will use new container paths for more precise scoping
  - lp-do-ideas pipeline — standing registry entries must be valid post-move
  - Business-OS app — strategy doc serving must use updated auth patterns
  - CI — all 23 test files must pass with updated fixtures
- Likely blast radius:
  - **High** if any of the 145 registry.json entries or 50 standing-registry entries is missed → broken artifact lookup at runtime
  - **High** if test fixtures are not updated → 23 test files fail in CI
  - **Medium** if business-os app auth is not updated → strategy document serving breaks for moved paths
  - **Low** if CASS DEFAULT_SOURCE_ROOTS not updated → CASS retrieval continues to work but at lower precision (single root catch-all)

### Recent Git History (Targeted)
- `scripts/src/startup-loop/cass-retrieve.ts` — last modified in this session (TASK-01 of `cass-assessment-retrieval`): added `docs/business-os/strategy` as 4th entry in `DEFAULT_SOURCE_ROOTS` — this entry will need to be replaced with per-container entries after migration
- `docs/registry.json` — frequently updated by startup-loop tools as new artifacts are registered

## Questions

### Resolved

- Q: Are `BRIK/apps/` and `BRIK/data/` in scope for the container migration?
  - A: `BRIK/apps/reception/` → moves to `BRIK/product/apps/reception/` (reception design docs are product artifacts). `BRIK/data/` stays at `BRIK/data/` — it holds raw operational CSV data, not domain strategy artifacts.
  - Evidence: `ls BRIK/` shows `apps/reception/` (design docs) and `data/` (CSV + meta.md files)

- Q: Do XA, PIPE, PLAT need containers created?
  - A: No. These businesses have only root-level files (`plan.user.md`, `plan.agent.md`) with no domain artifacts. Container creation not warranted; files stay at root.
  - Evidence: `ls XA/ PIPE/ PLAT/` — each has 2 files only

- Q: What is the container endpoint convention?
  - A: Each container directory contains a synthesis document `<container>.user.md` (agent-readable) + `<container>.user.html` (generated by render-user-doc-html.ts). These are produced as post-migration step for containers that have content. Empty containers do not require endpoints.
  - Evidence: Operator-stated; `render-user-doc-html.ts` handles any `.user.md` path

- Q: How should `HEAD/decisions/` be handled?
  - A: `HEAD/decisions/` contains assessment artifacts. Move contents to `HEAD/assessment/` as part of migration. The `decisions/` subdir name is an early naming convention that predates this container model.
  - Evidence: File classification: all HEAD/decisions/ files are assessment-class (solution, naming, brand)

- Q: What is the target design for `DEFAULT_SOURCE_ROOTS` after migration — per-container or per-business-per-container?
  - A: **Option C — keep the single `"docs/business-os/strategy"` root unchanged.** `rg` already traverses recursively; the container split itself improves retrieval precision without needing any code change to `DEFAULT_SOURCE_ROOTS`. Per-business-per-container entries would scale poorly as businesses grow. The single root covers all containers automatically. No `DEFAULT_SOURCE_ROOTS` change beyond what was done in the prior session (cass-assessment-retrieval build).
  - Evidence: `cass-retrieve.ts` uses `rg` with recursive traversal; adding subdirs adds no new access, only organisational precision. `--source-roots` CLI override remains available for ad-hoc scoping.

- Q: Does `queue-state.json` need updating?
  - A: Advisory. The `location_anchors` and `evidence_refs` in historical dispatch packets use old strategy/ paths. These are historical records, not active runtime paths. Update is safe to defer; it won't break any runtime behavior. Priority: low.
  - Evidence: queue-state is written by the ideas layer for tracking; old dispatch packets are never re-read for path resolution

- Q: Are `docs/business-os/_data/process-improvements.json` and `build-summary.json` hand-maintained or generated?
  - A: Generated. Both are produced by `generate-process-improvements.ts` and `generate-build-summary.ts` respectively. Run generators post-migration to update all paths.
  - Evidence: `scripts/src/startup-loop/generate-build-summary.ts` writes `build-summary.json`; `generate-process-improvements.ts` writes `process-improvements.json`

- Q: What happens to the recently added `cass-retrieve.ts` test (TC-02-03: exactly 4 entries)?
  - A: The test will need updating. After migration `DEFAULT_SOURCE_ROOTS` will have more entries (one per active container per business, or per container type). The test count guard will be updated to match the new entry count. Plan must include updating this test.
  - Evidence: `__tests__/cass-retrieve.test.ts:16` — `expect(DEFAULT_SOURCE_ROOTS).toHaveLength(4)`

### Open (Operator Input Required)

None at this time.

## Confidence Inputs

- Implementation: 88% — file moves and path substitutions are mechanical; the 23 test files + 145 registry entries create execution risk but are all deterministic
- Approach: 90% — container structure is clear; the one open question (CASS roots) has a clear default that doesn't block migration
- Impact: 92% — full migration now removes technical debt definitively; the directory will be navigable; CASS retrieval benefits immediately
- Delivery-Readiness: 85% — all evidence gathered; single open question (CASS roots) has a safe default that keeps the migration unblocked
- Testability: 80% — test fixtures are updatable; CI validates correctness; main risk is completeness (any missed path)

What would raise to >=90: Resolving the CASS roots question (removes last uncertainty); adding a verification script that counts expected paths pre/post migration.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Incomplete path update in test fixtures (23 files, 150+ paths) | Medium | High — CI fails | Write migration script that generates a path-substitution map; verify with `rg` before committing |
| registry.json partial update (145 entries) | Medium | High — artifact lookup breaks at runtime | Scripted substitution (sed/jq); count entries before/after to verify completeness |
| standing-registry.json partial update (50+ entries) | Medium | High — lp-do-ideas pipeline breaks | Same as above; test suite catches regressions |
| business-os app auth not updated | Low | Medium — strategy doc serving breaks for moved paths | `authorize.ts` uses pattern-based rules; one-time update; easy to verify |
| Cross-document relative links broken | Low | Low — documents link to each other; relative paths may break | Audit for `../` links in moved files post-migration; likely minimal |
| HTML files stale (old .user.html not removed after move) | Medium | Low — stale HTML served from old location | `git mv` or `git rm` old `.user.html`, then regenerate at new path via `render-user-doc-html.ts` |
| BRIK/data/ accidentally containerized | Low | Low | Explicit exclusion in migration script |
| HEAD/decisions/ contents misclassified | Low | Medium | All verified as assessment artifacts |
| GitHub Actions workflow path filter stale | Medium | Medium — `brik-weekly-kpi-reminder.yml` references strategy/ paths; after migration the watch trigger may miss changes in container subdirs | Review + update `.github/workflows/brik-weekly-kpi-reminder.yml` in TASK-03 scope |

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| File classification (~210 files) | Yes | None | No |
| CASS DEFAULT_SOURCE_ROOTS update | Partial | Open question on final structure; safe default available | No (default resolves it) |
| docs/registry.json (145 entries) | Yes | None — scripted update | No |
| standing-registry.json (50+ entries) | Yes | None — scripted update | No |
| Scripts source files (12 files) | Yes | cass-retrieve.ts test count guard needs update | No (captured in task seeds) |
| Test fixtures (23 files, 150+ paths) | Yes | High execution risk — any missed path → CI failure | No (scripted update + rg verification) |
| Business-OS app auth | Yes | None — pattern-based auth needs 2 rule updates | No |
| HTML regeneration (`.user.md` files) | Yes | None — render-user-doc-html.ts handles any path | No |
| BRIK/apps/ and BRIK/data/ edge cases | Yes | BRIK/data/ excluded from containerization | No |
| cass-retrieve.ts `toHaveLength(4)` test | Yes | TC-02-03 will fail if DEFAULT_SOURCE_ROOTS changes length | No (flag in plan task) |

No Critical simulation findings. Plan can proceed.

## Scope Signal

**Signal: right-sized**
**Rationale:** The migration scope is fully bounded — 210 files to move, 35 scripts to update, 195+ registry entries. Every change is deterministic (path substitution, file moves). The operator constraint is "full migration now" which defines the scope ceiling. No speculative work is included. Risk is execution completeness, not architectural ambiguity.

## Evidence Gap Review

### Gaps Addressed
- File classification: all 210 files classified into target containers via parallel investigation
- Code references: all 35 scripts and 5 JSON data files identified via `rg docs/business-os/strategy` across scripts/src/
- Container endpoint convention: confirmed via `render-user-doc-html.ts` investigation + operator-stated spec
- Business-OS app auth: `authorize.ts` pattern-based rules identified
- HTML pair model: confirmed — every `.user.md` file has a generated `.user.html` counterpart

### Confidence Adjustments
- Test fixture risk (23 files, 150+ paths) adjusted confidence from 95% → 85% delivery-readiness. CI is the safety net; but test failures post-merge need immediate fix bandwidth.
- CASS `DEFAULT_SOURCE_ROOTS` open question holds at advisory — safe default means no planning blocker.

### Remaining Assumptions
- `docs/business-os/_data/process-improvements.json` and `build-summary.json` will be regenerated correctly by existing generators after path updates to source scripts
- `BRIK/data/` contents (CSV files) are not referenced in any registry or standing-registry entries — confirmed by grep (no `.csv` entries found in registry.json)

## Planning Constraints & Notes
- Must-follow patterns:
  - Use `git mv` for all file moves to preserve history
  - Migration script approach: generate sed/substitution map → apply to all reference files → verify with rg counts
  - Commit via writer lock: `scripts/agents/with-writer-lock.sh`
  - Test must not run locally — push to CI for validation
- Rollout/rollback expectations:
  - Rollback is a single `git revert` of the migration commit(s). History preserved via `git mv`.
  - No database or runtime state changes — pure file system and path update.
- Observability expectations:
  - Post-migration: `rg "docs/business-os/strategy" scripts/src/ docs/registry.json docs/business-os/startup-loop/ideas/standing-registry.json` should return only `cass-retrieve.ts` (if kept as single root) or zero results (if roots changed). This is the verification gate.

## Suggested Task Seeds (Non-binding)

1. **TASK-01: Produce final file classification map** — enumerate every file with its target container path; produce `docs/plans/bos-standing-data-domain-container-split/artifacts/migration-map.json`; flag any edge cases
2. **TASK-02: Migrate files to containers** — create container directories; run `git mv` for all classified files; keep root-level files in place; verify with `ls` checks post-move
3. **TASK-03: Update scripts/src/ path references** — update 12 source files; verify with rg; include `cass-retrieve.ts` DEFAULT_SOURCE_ROOTS decision (recommend: keep single root, no change)
4. **TASK-04: Update test fixtures** — update all 23 test files with new container paths; use scripted substitution + manual review for correctness
5. **TASK-05: Update registry files** — update `docs/registry.json` (145 entries) + `standing-registry.json` (50+ entries) via scripted jq/sed substitution
6. **TASK-06: Update business-os app auth** — update `authorize.ts` path-based rules for `strategy/*/*.md` patterns to include container subdirectory
7. **TASK-07: Regenerate HTML files** — `git mv` or `git rm` old `.user.html` files from original paths; run `render-user-doc-html.ts` for all moved `.user.md` files at new container paths; verify `.user.html` files exist at new paths and not at old paths
8. **TASK-08: Regenerate computed JSON** — run `generate-build-summary.ts` and `generate-process-improvements.ts` to update `_data/` files
9. **TASK-09: Verification gate** — rg sweep confirms zero stale strategy/ paths; CI green on push

## Execution Routing Packet
- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: CI passes (all 23 test files green); rg shows no stale paths in scripts/src/; registry entry counts preserved; all `.user.md` files have `.user.html` counterparts at new locations
- Post-delivery measurement plan: `DEFAULT_SOURCE_ROOTS` covers correct paths; CASS retrieval returns accurate context for domain-specific queries

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan bos-standing-data-domain-container-split --auto`
