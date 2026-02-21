---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infrastructure
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: mcp-startup-loop-data-plane
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-do-build
Supporting-Skills: /lp-do-replan, /lp-sequence
Related-Plan: docs/plans/mcp-startup-loop-data-plane/plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

> **Note:** S7/S8/S9 stage IDs referenced below were consolidated into stage DO in loop-spec v3.0.0 (2026-02-21).

# MCP Startup Loop Data Plane Fact-Find Brief

## Scope
### Summary
Reframe MCP from a "shop/CMS utility server" into a startup-loop data plane that gives loop skills direct, governed access to Business OS state, run artifacts, and measurement inputs. The legacy plan is used as baseline context, but not as current scope authority.

### Goals
- Map current MCP capabilities to startup-loop stage requirements (`S0..S10`).
- Identify data/tooling gaps blocking stronger loop execution.
- Define evidence-backed implementation seeds for `/lp-do-plan`.
- Preserve stage mutation boundaries and existing repository contracts.

### Non-goals
- Implementing new MCP tools in this fact-find.
- Changing startup-loop stage ordering or policy.
- Replacing existing Business OS APIs.
- Selecting final third-party analytics vendors.

### Constraints & Assumptions
- Constraints:
  - Respect loop mutation boundaries (`S5B` guarded mutations) in `docs/business-os/startup-loop/loop-spec.yaml`.
  - Reuse existing repositories/API contracts where available.
  - Keep write paths explicit, auditable, and least-privilege.
  - Follow targeted-test policy; no unfiltered monorepo test fan-out.
- Assumptions:
  - The current MCP package (`@acme/mcp-server`) remains the canonical extension point.
  - Business OS API routes under `apps/business-os/src/app/api/agent/*` are the intended control-plane write boundary.
  - This initiative is infrastructure-facing and intentionally standalone (`Business-OS-Integration: off`).

## Evidence Audit (Current State)
### Entry Points
- `docs/plans/archive/mcp-server-implementation-plan-archived-2026-02-14.md` - legacy MCP plan baseline (still draft; scaffolding-era assumptions).
- `packages/mcp-server/src/server.ts` - current MCP server registration and dispatch.
- `packages/mcp-server/src/tools/index.ts` - actual tool inventory and routing.
- `docs/business-os/startup-loop/loop-spec.yaml` - runtime-authoritative startup-loop stage contract.
- `docs/business-os/startup-loop-workflow.user.md` - current gaps and operational blockers.

### Key Modules / Files
- `docs/plans/archive/mcp-server-implementation-plan-archived-2026-02-14.md`
  - Still frames MCP as "create package + basic CRUD"; already outdated versus current code.
- `packages/mcp-server/src/tools/index.ts`
  - Large tool surface exists (shops/orders/inventory/CMS/settings/products/analytics/SEO/themes/Gmail/drafting).
- `packages/mcp-server/src/resources/brikette-knowledge.ts`
  - Contains hardcoded business data with explicit sync TODO comments.
- `apps/business-os/src/app/api/agent/cards/route.ts`
  - `GET/POST` card management API contract.
- `apps/business-os/src/app/api/agent/stage-docs/route.ts`
  - `GET/POST` stage-doc API contract.
- `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts`
  - `GET/PATCH` with optimistic concurrency (`entitySha`) for stage docs.
- `packages/platform-core/src/repositories/businessOsCards.server.ts`
  - D1-backed card repository contract and indexed query patterns.
- `scripts/src/startup-loop/manifest-update.ts`
  - Single-writer manifest generation contract for S4 barrier output.
- `scripts/src/startup-loop/learning-ledger.ts`
  - Append/query contract for `learning-ledger.jsonl`.
- `scripts/src/startup-loop/metrics-aggregate.ts`
  - Rolling metrics/warning aggregation for stabilization signals.

### Patterns & Conventions Observed
- MCP tool dispatch uses explicit tool registries + name-to-handler maps.
  - Evidence: `packages/mcp-server/src/tools/index.ts`.
- Tool handlers validate inputs with Zod and return structured JSON/error payloads.
  - Evidence: `packages/mcp-server/src/tools/settings.ts`, `packages/mcp-server/src/tools/orders.ts`.
- Startup-loop control plane enforces deterministic, single-writer manifest behavior.
  - Evidence: `scripts/src/startup-loop/manifest-update.ts`.
- Startup-loop stage policy separates pure ranking (`S5A`) from guarded mutation (`S5B`).
  - Evidence: `docs/business-os/startup-loop/loop-spec.yaml`.
- Business OS write APIs use optimistic concurrency for safe mutation.
  - Evidence: `apps/business-os/src/app/api/agent/cards/[id]/route.ts`, `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts`.

### Data & Contracts
- Types/schemas:
  - Startup loop run packet and stage graph: `docs/business-os/startup-loop/loop-spec.yaml`.
  - Manifest schema: `docs/business-os/startup-loop/manifest-schema.md`.
  - Learning ledger schema: `docs/business-os/startup-loop/learning-ledger-schema.md`.
- Persistence:
  - Business OS entities in D1 through platform-core repositories:
    - `packages/platform-core/src/repositories/businessOs.server.ts`.
  - Startup-loop run artifacts in filesystem under startup-baselines:
    - `docs/business-os/startup-baselines/<BIZ>/runs/...`.
- API/event contracts:
  - Agent APIs:
    - `/api/agent/cards` (`GET/POST`)
    - `/api/agent/cards/[id]` (`GET/PATCH`)
    - `/api/agent/stage-docs` (`GET/POST`)
    - `/api/agent/stage-docs/[cardId]/[stage]` (`GET/PATCH`)
  - Loop stage contract includes explicit BOS sync expectations at each stage.

### Dependency & Impact Map
- Upstream dependencies:
  - `@acme/platform-core` repositories and domain logic.
  - Business OS D1 APIs and auth middleware in `apps/business-os`.
  - Startup-loop file contracts in `scripts/src/startup-loop`.
- Downstream dependents:
  - Loop skills relying on data availability and freshness (`/lp-forecast`, `/lp-prioritize`, `/lp-experiment`, `/lp-do-fact-find`).
  - Operator workflows requiring weekly K/P/C/S decision throughput.
- Likely blast radius:
  - MCP server package (`packages/mcp-server`) and tests.
  - Business OS API interaction patterns if MCP becomes first-class consumer.
  - Startup-loop observability and stage progression reliability.

### Delivery & Channel Landscape (for business-artifact or mixed)
- Audience/recipient:
  - Internal agents and operators running startup-loop workflows.
- Channel constraints:
  - MCP transport and tool call semantics.
  - Agent API key and auth boundary for Business OS endpoints.
  - Guarded write boundaries required by loop spec.
- Existing templates/assets:
  - Legacy MCP plan and README usage docs.
  - Existing startup-loop schemas and scripts.
- Approvals/owners:
  - Platform/infrastructure owner for MCP changes.
  - Business OS owner for card/stage-doc API mutation semantics.
- Compliance constraints:
  - No secret leakage in tool outputs.
  - Strict separation of read-only vs mutation tools.
  - Auditability of write operations.
- Measurement hooks:
  - Startup-loop metrics aggregation (`metrics.jsonl` ingestion).
  - Artifact freshness and completeness checks for required stage outputs.

### Hypothesis & Validation Landscape (required for `business-artifact` or `mixed`; optional otherwise)

#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|-----------|-----------|-------------------|-------------------|
| H1 | Exposing Business OS cards/stage-doc APIs through MCP reduces manual handoff friction across S5B-S10. | Stable auth + optimistic concurrency behavior. | Medium (tool + integration test effort). | 3-5 days |
| H2 | MCP run-artifact tools (manifest/ledger/metrics status) reduce blocked loop runs caused by missing/stale artifacts. | Accurate filesystem contracts and validation logic. | Low-Medium. | 2-4 days |
| H3 | Measurement connector tools for S2A/S3/S10 materially improve forecast recalibration quality vs document-only refreshes. | GA4/Search Console/Cloudflare data access. | Medium-High (connector + mapping). | 1-2 weeks |
| H4 | Enforcing explicit read/write tool classes aligned to stage policy prevents accidental side effects. | Stage-policy mapping and permission checks. | Medium. | 3-5 days |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|-----------|-------------------|--------|---------------------|
| H1 | Loop spec expects API-based BOS sync and stage-doc upserts; APIs already implemented. | `docs/business-os/startup-loop/loop-spec.yaml`, `apps/business-os/src/app/api/agent/*` | Medium |
| H2 | Startup-loop scripts already validate manifest/ledger/metrics contracts; current workflow shows data freshness blockers. | `scripts/src/startup-loop/*`, `docs/business-os/startup-loop-workflow.user.md` | Medium |
| H3 | Workflow explicitly flags missing measurement readiness and no standing refresh outputs. | `docs/business-os/startup-loop-workflow.user.md` | Medium |
| H4 | Legacy MCP plan states read-only-by-default policy, but current tool surface mixes reads and writes without stage-aware policy gates. | `docs/plans/archive/mcp-server-implementation-plan-archived-2026-02-14.md`, `packages/mcp-server/src/tools/index.ts` | Medium |

#### Falsifiability Assessment
- Easy to test:
  - H1 and H2 via targeted MCP tool contracts + fixture-backed tests.
- Hard to test:
  - H3 requires real instrumentation access and post-launch data quality checks.
- Validation seams needed:
  - Tool-level permission class metadata (`read`, `guarded-write`) mapped to stage policies.
  - Deterministic synthetic fixtures for run-artifact and API conflict behavior.

#### Recommended Validation Approach
- Quick probes for:
  - BOS read tools (`cards_list`, `stage_doc_get`) and run health tools (`loop_manifest_status`).
- Structured tests for:
  - Guarded write tools (`card_patch`, `stage_doc_patch`) including `entitySha` conflict handling.
- Deferred validation for:
  - External measurement connectors that depend on real environment credentials.
- Note:
  - `/lp-do-plan` should map each hypothesis to VC gates (contract tests + integration checks + operator rehearsal).

### Test Landscape (required for `code` or `mixed`; optional otherwise)

#### Test Infrastructure
- Frameworks:
  - Jest-based suites in `packages/mcp-server/src/__tests__`.
  - Jest-based suites in `scripts/src/startup-loop/__tests__`.
  - API route tests in `apps/business-os/src/app/api/agent/**/__tests__/route.test.ts`.
- Commands:
  - `@acme/mcp-server` currently has `build`, `lint`, `typecheck` scripts but no package-local `test` script.
    - Evidence: `packages/mcp-server/package.json`.
  - Targeted tests should use filtered Jest invocation per repo testing policy.
- CI integration:
  - Not re-audited in this run; existing repo policy expects targeted checks by changed scope.
- Coverage tools:
  - Not explicitly surfaced in scoped files audited for this fact-find.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| MCP tools and pipeline behavior | unit/integration-style | `packages/mcp-server/src/__tests__/*.test.ts` | Strong coverage for email/Gmail/drafting flows and policy layers. |
| Startup-loop runtime contracts | unit/integration-style | `scripts/src/startup-loop/__tests__/*.test.ts` | Good coverage for manifest, ledger, recovery, bottleneck, and S10 accounting paths. |
| Business OS agent APIs | route tests | `apps/business-os/src/app/api/agent/**/__tests__/route.test.ts` | Existing coverage for cards, ideas, stage-docs, allocate-id, businesses, people. |

#### Test Patterns & Conventions
- Unit tests:
  - Pure function validation and deterministic fixtures.
- Integration tests:
  - Contract-style filesystem and multi-stage flow tests in startup-loop scripts.
- API tests:
  - Route behavior and validation checks for Business OS endpoints.
- Test data:
  - JSON fixtures and synthetic input payloads.

#### Coverage Gaps (Planning Inputs)
- Untested paths:
  - No MCP tool layer currently exposes Business OS cards/stage-doc APIs.
  - No MCP layer currently exposes startup-loop manifest/learning-ledger status.
- Extinct tests:
  - None identified in this scoped audit.
- Additional gap:
  - No assertion preventing MCP config drift between README claims and `.claude/settings.json` presence.

#### Testability Assessment
- Easy to test:
  - New read-only tools that wrap existing repository/API reads.
  - Run-artifact status aggregation tools.
- Hard to test:
  - External measurement connectors with live credentials.
  - End-to-end stage-aware mutation gating under concurrent agent activity.
- Test seams needed:
  - Dependency injection for external connectors.
  - Fake/stub Business OS API backend for MCP tool integration tests.
  - Explicit permission metadata tests for tool classes.

#### Recommended Test Approach
- Unit tests for:
  - Tool input validation, permission gating, and result shaping.
- Integration tests for:
  - MCP-to-Business OS API calls, conflict retries, and run-artifact discovery.
- Contract tests for:
  - Stage-policy mapping (`S5A` no side effects, `S5B` guarded mutations).
- Rehearsal tests for:
  - Weekly S10 pack assembly from mixed data sources.

### Recent Git History (Targeted)
- `packages/mcp-server/*` recent commits indicate active evolution around email workflows and policy hardening, not startup-loop data-plane coverage.
  - Evidence: `git log -- packages/mcp-server`.
- `scripts/src/startup-loop/*` recent commits show active work on learning compiler, bottleneck locator, and S10 integration.
  - Evidence: `git log -- scripts/src/startup-loop`.
- Implication:
  - Startup-loop control-plane data is advancing quickly, while MCP has not yet been aligned to that contract surface.

## External Research (If needed)
- No external web research required for this fact-find.
- All conclusions are derived from in-repo contracts and code paths.

## Questions
### Resolved
- Q: Is `mcp-server-implementation-plan.md` still useful?
  - A: Yes, as a historical baseline for security principles and package conventions, but not as current scope authority.
  - Evidence: `docs/plans/archive/mcp-server-implementation-plan-archived-2026-02-14.md`, `packages/mcp-server/src/tools/index.ts`.
- Q: Does startup-loop already define where controlled mutations should happen?
  - A: Yes. `S5A` is side-effect-free and `S5B` is guarded mutation boundary.
  - Evidence: `docs/business-os/startup-loop/loop-spec.yaml`.
- Q: Do BOS APIs already exist to support MCP bridge tooling?
  - A: Yes, including optimistic concurrency update paths.
  - Evidence: `apps/business-os/src/app/api/agent/cards/[id]/route.ts`, `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts`.
- Q: Are there known data freshness gaps in current startup-loop operations?
  - A: Yes, including standing refresh artifacts and measurement readiness gaps.
  - Evidence: `docs/business-os/startup-loop-workflow.user.md`.

### Open (User Input Needed)
- None for planning handoff.

## Confidence Inputs (for /lp-do-plan)
- Implementation: 84%
  - Why: Core contracts and APIs already exist; missing work is integration and tool design, not unknown architecture.
  - Raise to >=90:
    - Complete one vertical slice (BOS read + guarded write + tests) with rehearsal evidence.
- Approach: 82%
  - Why: Data-plane framing aligns with loop stage contracts and current blockers.
  - Raise to >=90:
    - Decide final boundary for API-wrapper vs direct repository access per tool class and document ADR.
- Impact: 79%
  - Why: Cross-cutting touch points across MCP, Business OS APIs, and loop scripts require careful sequencing.
  - Raise to >=80:
    - Add explicit dependency map in plan with phased rollout and fallback strategy.
  - Raise to >=90:
    - Execute canary rollout on one business unit and validate no stage-regression.
- Delivery-Readiness: 81%
  - Why: Owner/channel are clear; acceptance package can be defined now.
  - Raise to >=90:
    - Add runbook for operator onboarding and failure triage.
- Testability: 83%
  - Why: Existing test ecosystems are strong; required seams are identifiable.
  - Raise to >=90:
    - Add deterministic mocks for BOS API and measurement connectors plus end-to-end rehearsal suite.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| Tool sprawl without stage-aware policy causes accidental writes at wrong stages. | Medium | High | Introduce explicit tool permission classes and stage-policy gates in MCP registry. |
| API-wrapper and repository-direct access mixed inconsistently, causing auth/audit drift. | Medium | High | Choose one default access pattern per tool class and enforce in review checks. |
| Measurement connectors create credential and data-quality fragility early. | High | Medium | Phase connectors after core BOS/loop tools; start with read-only health/status endpoints. |
| Config drift leaves MCP tools unavailable despite docs claiming automatic startup. | Medium | Medium | Add config validation check and startup health assertion in CI or preflight script. |
| Hardcoded business resource data becomes stale and undermines operator trust. | Medium | Medium | Replace hardcoded resources with generated/sourced artifacts and freshness metadata. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve loop stage mutation boundaries from `docs/business-os/startup-loop/loop-spec.yaml`.
  - Reuse optimistic concurrency semantics (`entitySha`) for any write-capable BOS bridge tools.
  - Keep read-only default and explicit opt-in for guarded writes.
- Rollout/rollback expectations:
  - Rollout in phases: read-only BOS tools -> run-artifact tools -> guarded writes -> external connectors.
  - Rollback path: disable newly added tool groups while retaining baseline MCP operations.
- Observability expectations:
  - Per-tool invocation logging with redacted sensitive fields.
  - Error-class metrics for auth, conflict, contract mismatch, and missing artifact cases.

## Suggested Task Seeds (Non-binding)
- Define MCP startup-loop data-plane tool taxonomy and permission classes.
- Implement `bos_*` read tools (cards, stage docs, ideas, businesses) against existing agent APIs.
- Implement `loop_*` run-artifact status tools (manifest, stage results, learning ledger, metrics summary).
- Implement guarded `bos_*` write tools honoring `entitySha` conflict semantics.
- Add freshness and drift checks (standing refresh artifact presence, config presence, stale resource detection).
- Add integration test suite for MCP <-> BOS API interactions and stage-policy gating.
- Add operator runbook and rollout checklist.

## Execution Routing Packet
- Primary execution skill:
  - `/lp-do-build`
- Supporting skills:
  - `/lp-do-replan`, `/lp-sequence`
- Deliverable acceptance package (what must exist before task can be marked complete):
  - New MCP data-plane tool registry with documented permission classes.
  - Passing targeted tests for new MCP tools and BOS bridge behavior.
  - Stage-policy conformance checks for mutation boundaries.
  - Updated documentation replacing stale implementation assumptions.
- Post-delivery measurement plan:
  - Track MCP tool adoption by loop stage.
  - Track artifact freshness failures and conflict rates.
  - Track reduction in manual handoff steps for S5B-S10 operations.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items (if any):
  - None
- Recommended next step:
  - Proceed to `/lp-do-plan` using this brief and prioritize phased delivery (read-only first, guarded writes second, connectors third).

## Source Baseline
- Legacy source used as baseline input:
  - `docs/plans/archive/mcp-server-implementation-plan-archived-2026-02-14.md`

## External Review Resolution Addendum (2026-02-13)

This addendum resolves gaps identified in independent high-level review so `/lp-do-plan` can start from explicit contracts and decisions.

### 1) Stage x Capability Matrix (S0..S10)

| Stage | Required data inputs/outputs | Source system | Tool class | Current MCP coverage | Gap type | Validation method |
|---|---|---|---|---|---|---|
| S0 Intake | business/unit metadata, existing strategy context | BOS docs + BOS API | `bos_read` | none | missing tool | fixture + contract test |
| S1 Readiness | blockers/warnings, missing-context register, readiness docs | BOS docs + stage docs | `bos_read` | none | missing tool | fixture + contract test |
| S1B Measurement bootstrap | GA4/Search Console setup status + verification checklist | external connectors + BOS docs | `measure_read` | partial (`analytics_*` is internal shop analytics only) | missing connector + missing contract | connector stub + rehearsal |
| S2A Historical baseline | monthly bookings, traffic proxies, ops logs quality notes | external connectors + BOS strategy docs | `measure_read` + `loop_read` | none (no Cloudflare/GA4/SC connectors) | missing connector | connector contract test |
| S2 Market intelligence | `latest.user.md` freshness, stale/draft detection | filesystem docs | `loop_read` | none | missing freshness tool | fixture test |
| S2B Offer design | offer artifact existence/shape | BOS artifacts | `loop_read` | none | missing artifact status tool | fixture test |
| S3 Forecast | KPI priors, channel economics, forecast assumptions + confidence | BOS artifacts + measurement data | `measure_read` + `loop_read` | partial (`analytics_summary`) | missing connector + missing stage-shaped output | integration + rehearsal |
| S4 Baseline merge | stage-result presence/health, `baseline.manifest.json` status | startup-loop run artifacts | `loop_read` | none | missing run-artifact tool | fixture + contract test |
| S5A Prioritize | candidate items + portfolio scores (read-only) | BOS API + hypothesis modules | `bos_read` | none | missing BOS bridge read tools | contract + deterministic scoring test |
| S5B BOS sync | guarded writes to cards/stage-docs + manifest pointer commit workflow | BOS API + startup-loop scripts | `bos_guarded_write` | none (existing writes are shop/CMS/email domain) | missing guarded BOS tools + policy gate | conflict + policy gate test |
| S6 Site-upgrade synthesis | platform baseline pointer + business upgrade brief pointer + freshness | BOS docs | `loop_read` | none | missing pointer/freshness tools | fixture test |
| S7 Fact-find | stage-doc upsert/read for fact-find lane | BOS API | `bos_read`, `bos_guarded_write` | none | missing BOS stage-doc tools | contract + conflict test |
| S8 Plan | plan stage-doc upsert/read + lane transition safety | BOS API | `bos_read`, `bos_guarded_write` | none | missing BOS card/stage tools | contract + policy test |
| S9 Build / S9B QA | build/QA stage docs + evidence references | BOS API + artifacts | `bos_read`, `bos_guarded_write`, `loop_read` | none | missing tooling | contract + rehearsal |
| S10 Weekly readout | KPI scoreboard, experiment readouts, K/P/C/S decision writeback | measurement + BOS API + run artifacts | `measure_read`, `loop_read`, `bos_guarded_write` | partial analytics reads only | missing integrated KPI pack + guarded write path | rehearsal + operator dry run |

### 2) Operational Definition: Data Plane vs Control Plane

#### Data plane (this initiative)
- Provides governed read access to loop-relevant state.
- Provides shaped status/freshness outputs for skills and operators.
- Provides auditable mutation requests only through guarded interfaces.
- Never bypasses authoritative concurrency/audit requirements.

#### Control plane (existing authority)
- Owns stage progression semantics and mutation boundaries.
- Owns acceptance/rejection of writes to BOS entities.
- Owns single-writer startup-loop artifact mutation workflows.
- Owns policy truth for side effects at each stage.

#### Invariants
- MCP must not directly mutate stage state without BOS API concurrency + audit semantics.
- `loop_*` run-artifact tooling is read-only by default.
- `S5A` remains side-effect-free; `S5B` remains guarded mutation boundary.
- Any guarded write touching cards/stage docs requires `entitySha` conflict safety.

#### Runtime context required for policy decisions
- `business`
- `run_id` (when applicable)
- `current_stage`
- `caller_intent`
- `write_reason` (for guarded writes)

### 3) Stage-Aware Gating Design (Policy Enforcement Sketch)

#### Tool metadata schema (proposed)

| Field | Type | Notes |
|---|---|---|
| `permission` | `read \| guarded_write \| unsafe_write` | `unsafe_write` disallowed in default rollout |
| `sideEffects` | `none \| bos_write \| filesystem_write \| external_write` | required for all tools |
| `allowedStages` | `string[]` | explicit stage allowlist (`S0..S10`) |
| `requiresEntitySha` | `boolean` | true for BOS card/stage writes |
| `auditTag` | `string` | log partition + traceability key |
| `contextRequired` | `string[]` | e.g. `business`, `current_stage`, `caller_intent` |
| `sensitiveFields` | `string[]` | redaction hints for logs/errors |

#### Gating algorithm (proposed)
1. Resolve runtime context (`business`, `current_stage`, `run_id`) from explicit input; do not infer silently.
2. Validate tool metadata completeness (fail closed if missing).
3. Enforce stage allowlist (`current_stage in allowedStages`).
4. Enforce permission policy:
   - `read` always allowed if context valid.
   - `guarded_write` requires `write_reason`, BOS auth context, and `requiresEntitySha` path when applicable.
   - `unsafe_write` blocked unless explicit feature flag + operator override mode.
5. Execute call.
6. Emit structured audit event with redaction.

#### Enforcement location decision (defense in depth)
- MCP enforces preflight policy gates.
- BOS API remains authoritative for write acceptance and optimistic concurrency.
- Plan item: add BOS-side stage-policy checks for write endpoints used by loop tooling.

### 4) Access Pattern Decision (Provisional ADR-01)

#### Default policy
- Writes: use Business OS agent APIs only (`/api/agent/*`).
- Reads (BOS domain): default to Business OS agent APIs for auth/audit symmetry.

#### Allowed exception class
- `internal_read_repo` may use repository-direct reads only when all are true:
  - measurable performance/locality need,
  - no auth/audit bypass risk,
  - documented justification in tool metadata and ADR notes.

#### Rationale
- Avoid split-brain auth/audit behavior.
- Keep conflict semantics centralized where they already exist.
- Reduce per-tool architecture relitigation.

### 5) Current MCP Tool Inventory (Explicit Classification)

| Domain group | Tool identifiers | Permission class (target) | Side effects | Keep/Refactor guidance |
|---|---|---|---|---|
| shop | `shop_list`, `shop_get`, `shop_health` | `read` | none | keep |
| orders | `order_list`, `order_get` | `read` | none | keep |
| inventory | `inventory_list`, `inventory_check` | `read` | none | keep |
| CMS pages | `page_list`, `page_get`, `page_create`, `page_update` | mixed | `bos_write`-like domain writes | refactor metadata + stage scoping |
| CMS sections | `section_list`, `section_get`, `section_create`, `section_update` | mixed | writes | refactor metadata + stage scoping |
| settings | `settings_get`, `settings_update` | mixed | writes | refactor metadata + stage scoping |
| products | `product_list`, `product_get`, `product_search`, `product_stats` | `read` | none | keep |
| analytics/seo/theme/discount/health | `analytics_*`, `seo_*`, `theme_*`, `discount_*`, `health_*` | mostly `read` | none | keep + classify |
| gmail + booking workflows | `gmail_*`, `mcp_send_booking_email`, `prime_process_outbound_drafts` | mostly write-capable | `external_write` | isolate from startup-loop tool groups |
| drafting/policy helpers | `draft_interpret`, `draft_generate`, `draft_quality_check` | `read`/compute | none | keep |

#### Startup-loop taxonomy prefixes (proposed)
- `bos_*` - Business OS cards/stage-doc/ideas access.
- `loop_*` - startup-loop run artifact status/freshness.
- `measure_*` - measurement connectors and KPI packs.
- `legacy_*` - existing non-loop tools retained but out-of-scope for this rollout.

### 6) Clarification: `Business-OS-Integration: off`

In this fact-find, `Business-OS-Integration: off` means:
- do not create/update BOS cards for the fact-find artifact itself,
- but MCP implementation may still integrate tightly with BOS APIs as a client.

This is a workflow-tracking toggle, not an architectural prohibition on BOS API usage.

### 7) Run-Artifact Policy vs Single-Writer Constraints

- Phase 1 policy: `loop_*` tools are read-only health/status/freshness tools.
- Manifest and learning ledger writes remain owned by existing single-writer startup-loop scripts.
- MCP must not introduce an alternate writer path for `baseline.manifest.json` or `learning-ledger.jsonl` in initial rollout.
- Any future write-trigger tooling must preserve lock discipline and idempotency contracts.

### 8) Authn/Authz and Deployment Context (Known Unknowns)

| Topic | Current state | Planning action |
|---|---|---|
| MCP caller identity to BOS APIs | not specified in this brief | define service identity model and token source per environment |
| per-business-unit scope | not specified | define scope claims/headers and enforcement points |
| secret handling in logs | principle stated, implementation unspecified | enforce redaction policy via tool metadata + tests |
| local vs hosted runtime differences | partially implied | document environment matrix and fallback behavior |

### 9) Error Taxonomy and Retry Policy (Proposed)

| Error code | Retry? | Notes |
|---|---|---|
| `AUTH_FAILED` | no | credentials/scope issue |
| `FORBIDDEN_STAGE` | no | stage policy violation |
| `NOT_FOUND` | no | missing entity/artifact |
| `CONFLICT_ENTITY_SHA` | yes (bounded, 1 retry) | refetch latest entity then retry patch |
| `CONTRACT_MISMATCH` | no | schema/version mismatch |
| `MISSING_ARTIFACT` | no | prerequisite not present |
| `UPSTREAM_UNAVAILABLE` | yes (exponential backoff) | transient external/API outage |
| `RATE_LIMITED` | yes (respect retry-after) | connector/provider throttling |
| `INTERNAL_ERROR` | bounded retry by caller policy | unknown internal failure |

### 10) Measurement Connector Minimal Data Contract (Connector-Agnostic)

#### Canonical metric record (proposed)
```json
{
  "business": "BRIK",
  "source": "ga4|search_console|cloudflare|ads",
  "period_start": "YYYY-MM-DD",
  "period_end": "YYYY-MM-DD",
  "metric_name": "sessions|orders|cvr|cac|aov|revenue|impressions|clicks",
  "value": 0,
  "dimensions": { "channel": "meta", "device": "mobile", "region": "IT" },
  "currency": "EUR",
  "freshness_ts": "2026-02-13T00:00:00Z",
  "quality_status": "ok|partial|blocked",
  "quality_note": "optional"
}
```

#### Stage-level minimal requirements
| Stage | Minimal metrics needed | Granularity | Output target |
|---|---|---|---|
| S2A | booking value, traffic totals, basic source split | monthly | historical baseline pack inputs |
| S3 | sessions, conversion, CAC/CPC, AOV, channel mix | daily/weekly | forecast recalibration inputs |
| S10 | KPI scoreboard, experiment result deltas, operational reliability signals | weekly | K/P/C/S decision memo inputs |

### 11) Executable Mitigation Checklist (from Risk Register)

- Tool metadata enforcement:
  - CI check: fail if any MCP tool lacks permission/sideEffects metadata.
  - CI check: fail if any `guarded_write` tool lacks `allowedStages` and `requiresEntitySha` where applicable.
- Access policy enforcement:
  - Reviewer checklist: direct repository reads require explicit `internal_read_repo` justification.
- Config drift prevention:
  - Preflight check: expected MCP server registration present for runtime profile.
  - Health check: tool group enablement + version surfaced in health output.
- Resource freshness:
  - Freshness fields required for business resource responses.
  - Warning threshold (default 30 days) with explicit stale warnings.

### 12) ADR Shortlist for `/lp-do-plan`

- ADR-01: BOS API-first access policy (writes always API; reads API default).
- ADR-02: Stage-policy enforcement split (MCP preflight + BOS authoritative write checks).
- ADR-03: Run-artifact write authority (single-writer scripts remain sole writers in phase 1).
- ADR-04: Tool taxonomy and naming/versioning (`bos_*`, `loop_*`, `measure_*`, `legacy_*`).
- ADR-05: Error taxonomy and retry semantics standardization.

### 13) Minimal Vertical Slice (MVS-01)

#### Candidate tool set
- `bos_cards_list` (`read`)
- `bos_stage_doc_get` (`read`)
- `bos_stage_doc_patch_guarded` (`guarded_write`, `requiresEntitySha=true`)
- `loop_manifest_status` (`read`)

#### Acceptance package
- Tool metadata schema enforced for these tools.
- Contract tests for BOS API integration and conflict retry path.
- Policy tests proving stage gate behavior (`S5A` reject write, `S5B` allow guarded write).
- Rehearsal output showing one controlled stage-doc update and manifest status check.

#### Confidence impact target
- If MVS-01 passes with evidence, expected uplift:
  - Implementation: +4 to +6
  - Approach: +4 to +5
  - Impact: +3 to +5

### 14) Addendum Readiness

- Status: incorporated
- Planning effect: removes major architectural ambiguities before `/lp-do-plan`
- Recommended next step: proceed to `/lp-do-plan` and sequence MVS-01 as first implementation wave.

### 15) External Reviewability (No Repo Access)

This brief is reviewable without repository access if shared with the following companion packet:

- A frozen export of this fact-find (`fact-find.md` rendered to PDF/HTML).
- The stage matrix and gating schema tables (included above).
- A redacted API contract snapshot for BOS agent endpoints used by `bos_*` tools.
- A redacted startup-loop artifact contract snapshot (`baseline.manifest.json`, learning-ledger, metrics summary fields).
- A sample tool metadata manifest showing `permission`, `allowedStages`, `sideEffects`, and `requiresEntitySha`.
- A sample error payload set for taxonomy codes in Section 9.

External reviewer checklist:
- Confirm stage-to-capability mapping completeness for S0..S10.
- Confirm control-plane vs data-plane boundary is explicit and enforceable.
- Confirm guarded-write policy is testable and fail-closed.
- Confirm access pattern decision is stable enough for ADR codification.
- Confirm MVS-01 is sufficient to de-risk the first implementation wave.

If this packet is provided, reviewers can evaluate architecture quality, policy soundness, and planning readiness without direct code access.
