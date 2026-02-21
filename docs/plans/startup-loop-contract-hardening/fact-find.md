---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform / Business-OS
Workstream: Engineering
Created: 2026-02-14
Last-updated: 2026-02-15
Feature-Slug: startup-loop-contract-hardening
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-do-build
Supporting-Skills: /lp-do-plan, /lp-sequence
Related-Plan: docs/plans/startup-loop-contract-hardening/plan.md
Business-OS-Integration: on
Business-Unit: BOS
Card-ID:
---

# Startup Loop Contract Hardening Fact-Find Brief

## Scope

### Summary
Harden the startup loop so skills, docs, scripts, MCP tooling, and the Business OS agent API all agree on the same contracts (stage-doc types, artifact paths, and stage semantics), and so drift is detected early by lint/tests.

This fact-find transforms the existing gap audit into an execution-ready remediation packet: root causes, concrete fix surfaces, a migration posture recommendation, and a verification plan.

Primary input note (Outcome B): `docs/briefs/startup-loop-gap-audit-briefing.md` (gap audit, stage walkthrough, evidence anchors).

### Goals
- Eliminate P0 contract drift that can block stage-doc persistence (or create split-brain histories).
- Restore canonical doc reference chains so “contract authority” is trustworthy.
- Make the “sole mutation boundary” (`/lp-bos-sync`) an explicit, documented operator surface.
- Reduce token/UX burn by consolidating sources of truth and strengthening drift lint.

### Non-goals
- Implementing new measurement connectors (`measure_*`) beyond contract-level scaffolding (can be a separate scope unless needed to unblock).
- Shipping product/venture-facing features; this is startup-loop infrastructure hardening.
- Changing the startup-loop stage graph in `docs/business-os/startup-loop/loop-spec.yaml` unless required to resolve an inconsistency.

### Constraints & Assumptions
- Constraints:
  - Must support a multi-agent environment; contract changes must be migration-safe and verifiable.
  - No destructive git/history rewrites; prefer additive migrations and explicit compatibility windows.
- Assumptions (to verify during planning):
  - `docs/business-os/startup-loop/loop-spec.yaml` is canonical for the startup-loop stage graph (nodes, ordering, transitions, skill references, required artifacts).
  - The agent API `StageTypeSchema` (`fact-find|plan|build|reflect`) is canonical for stage-doc API keys and on-disk stage-doc filenames.
  - Mutation boundary policy: `/lp-bos-sync` is the sole mutation boundary for board/state mutations (lane transitions, board status), not for stage-doc writes.

## Contract Snapshot (North Star)

### Canonical Contract (Must Hold)
- Stage-doc types (canonical, API + filenames): `fact-find`, `plan`, `build`, `reflect`.
- Canonical stage-doc path template: `docs/business-os/cards/${cardId}/${stage}.user.md`.
- Rule: when calling stage-doc endpoints, always use stage-doc type (never a skill slug like `lp-do-fact-find`).

### Legacy Compatibility (During Window Only)
- Stage key aliases accepted (recommended): `lp-do-fact-find` -> `fact-find`.
- Filename aliases accepted by repo readers/tools (recommended): `fact-finding.user.md` -> `fact-find.user.md`.

### Deprecation Mechanism (Recommended)
- API: accept aliases during the window, normalize reads/writes to canonical, and emit alias-usage telemetry.
- Repo policy: lint warns for week 1 after window start, then fails builds for any new alias usage.

## Contract Authority Matrix

| Contract Surface | Canonical Authority | Derived / Validated Against | Drift Detection |
| --- | --- | --- | --- |
| Stage graph (nodes, ordering, transitions, skill references, required artifacts per stage) | `docs/business-os/startup-loop/loop-spec.yaml` | None | Startup-loop contract lint + drift tests |
| Stage-doc types (API accepted keys + on-disk stage-doc filenames) | `StageTypeSchema` in `packages/platform-core/src/repositories/businessOsStageDocs.server.ts` | Must be consistent with `loop-spec.yaml` stage nodes that produce stage docs | Contract tests + lint |
| Stage-doc filePath template | Agent API routes in `apps/business-os/src/app/api/agent/stage-docs/**/route.ts` | Must match StageTypeSchema keys and repo-reader expectations | API tests + integration test |

Design intent: `loop-spec.yaml` is authoritative over workflow semantics; `StageTypeSchema` is authoritative over stage-doc API keys and stage-doc filenames.

Enforcement mechanism (recommended): loop-spec nodes that produce stage docs declare `stage_doc_type: <StageTypeSchema member>`, and drift tests assert all declared values are members of StageTypeSchema. If loop-spec cannot be extended, declare a code-owned stage-node->stage-doc-type mapping and validate it against both `loop-spec.yaml` and StageTypeSchema.

## Terminology (Contract Vocabulary)
- Stage-doc type: the `stage` value used by stage-doc API endpoints and the filename segment in `docs/business-os/cards/${cardId}/${stage}.user.md`. Canonical set: `fact-find|plan|build|reflect`.
- Skill slug: the `/lp-*` identifier used to route agent behaviors (for example `/lp-do-fact-find`). Never valid as a stage-doc API key.
- Stage graph node: a node in the startup-loop stage graph (currently referenced from `loop-spec.yaml`). A node may reference a skill slug.

## Normalization Rules (Deterministic)

### Stage Key Normalization
- Accepted canonical stage-doc keys: `fact-find|plan|build|reflect`.
- Accepted legacy aliases during the compatibility window:
  - `lp-do-fact-find` normalizes to `fact-find`.
- Normalization applies to:
  - `POST /api/agent/stage-docs` request body `stage`.
  - `GET/PATCH /api/agent/stage-docs/[cardId]/[stage]` path param `stage`.
  - Any list/filter stage query param (`GET /api/agent/stage-docs?stage=...`) if present.
- Writes always produce canonical `filePath` using the canonical stage-doc type.
- StageTypeSchema remains canonical and must not include aliases; alias handling occurs in a separate normalization layer before schema validation.

### Filename Normalization (Repo Readers / Tooling)
- Canonical filename: `fact-find.user.md`.
- Legacy filename during the compatibility window: `fact-finding.user.md`.
- Read precedence when both exist:
  - Canonical wins.
  - Legacy may be treated as a migration candidate and should trigger a warning surface (lint/telemetry) rather than being silently merged.
- Write behavior:
  - All new writes must use canonical filename.

## Migration Inventory (Measured As Of 2026-02-15)

These numbers are intended to bound migration scope and build a fixture set.

- Stage key alias used as a stage-doc type (`"stage": "lp-do-fact-find"`): 3 call sites.
  - `.claude/skills/idea-generate/SKILL.md` (2)
  - `.claude/skills/idea-develop/SKILL.md` (1)
- Stage-doc endpoint path includes legacy stage key (`.../stage-docs/.../lp-do-fact-find`): 3 call sites.
  - `.claude/skills/idea-generate/SKILL.md`
- Repo references to `fact-finding.user.md`: 27 call sites.
  - Under `docs/business-os/**`: 3 call sites.
- On-disk stage-doc files:
  - `docs/**/fact-finding.user.md`: 1 file (`docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md`).
  - `docs/**/fact-find.user.md`: 1 file (`docs/business-os/cards/PLAT-OPP-0001/fact-find.user.md`).

Planning requirement: extend inventory to include all consumers that read stage docs (repo-reader, lane transitions, MCP tools) and all doc references (registry, charter, workflows, archived plans) so migration doesn’t miss downstream dependents.

### Inventory Provenance (Reproducible Counts)

Measured on: `dev` working tree as of 2026-02-15 (commit SHA not captured).

Commands (run from repo root; `rg` respects `.gitignore` by default):
- `rg -n --fixed-strings "\"stage\": \"lp-do-fact-find\"" .claude/skills`
- `rg -n "stage-docs/.*/lp-do-fact-find" -S .claude/skills`
- `rg -n --fixed-strings "fact-finding.user.md" docs`
- `find docs -name fact-finding.user.md -print`
- `find docs -name fact-find.user.md -print`

Notes:
- `rg` respects `.gitignore` by default (so excludes `node_modules/` and common build outputs).
- `rg ... docs` includes archived docs under `docs/plans/archive/`.
- `find` does not respect `.gitignore`; the scope is explicitly limited to `docs/`.


## Evidence Audit (Current State)

### Entry Points
- `docs/business-os/startup-loop/loop-spec.yaml` — canonical stage graph and stage references (including `/lp-bos-sync`).
- `apps/business-os/src/app/api/agent/stage-docs/route.ts` — stage-doc list/create; strict `StageTypeSchema` validation.
- `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts` — stage-doc get/patch; strict `StageTypeSchema` validation and canonical file path template.
- `packages/platform-core/src/repositories/businessOsStageDocs.server.ts` — `StageTypeSchema = ["fact-find","plan","build","reflect"]`.
- `.claude/skills/_shared/workspace-paths.md` — canonical stage key policy; explicitly rejects `lp-do-fact-find` for stage-doc writes.
- `.claude/skills/_shared/stage-doc-operations.md` — stage-doc ops helper; mixes canonical API key with non-canonical filename convention (`fact-finding.user.md`).
- `scripts/check-startup-loop-contracts.sh` — contract lint (currently fails).

### Key Modules / Files
- Drift hot spots:
  - `.claude/skills/idea-generate/SKILL.md` — seeds stage docs using `stage: "lp-do-fact-find"` and routes GET/PATCH to `/lp-do-fact-find` stage paths.
  - `.claude/skills/idea-develop/SKILL.md` — creates stage docs using `stage: "lp-do-fact-find"`.
  - `.claude/skills/lp-experiment/SKILL.md` — stage mapping drift (lint SQ-12) and legacy companion skill references.
  - `.claude/skills/lp-seo/SKILL.md` — non-canonical path topology (lint SQ-10 warn).
- Runtime “sole mutation boundary” script exists:
  - `scripts/src/startup-loop/bos-sync.ts` — implementation exists, but `/lp-bos-sync` skill doc is missing (lint SQ-02 fail).
- Drift evidence in tests and docs:
  - `apps/business-os/src/lib/lane-transitions.test.ts` expects `fact-find.user.md` naming.
  - `packages/mcp-server/src/__tests__/bos-tools.test.ts` expects `docs/business-os/cards/<id>/fact-find.user.md`.
  - `docs/business-os/cards/BRIK-ENG-0020.user.md` references `docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md`.

### Patterns & Conventions Observed
- Canonical stage keys are enforced in the agent API with strict validation:
  - `apps/business-os/src/app/api/agent/stage-docs/route.ts` uses `stage: StageTypeSchema` in the request schema and filters.
  - `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts` validates the path param `stage` via `StageTypeSchema.safeParse(stage)` and returns `{ error: "Invalid stage" }` with 400 on failure.
- Canonical stage-doc filePath written by the agent API is derived from the stage enum value:
  - `docs/business-os/cards/${cardId}/${stage}.user.md` where stage is `fact-find|plan|build|reflect`.

### Dependency & Impact Map
- Upstream dependencies:
  - Skill docs and shared helpers under `.claude/skills/**`.
  - Canonical loop contracts under `docs/business-os/startup-loop/**`.
- Downstream dependents:
  - Agent API routes (strict stage validation + canonical paths).
  - MCP tooling and tests that assume the canonical filePath.
  - Board lane transitions and repo-reader logic that assumes canonical stage file names.
- Likely blast radius:
  - Any workflow that creates/patches stage docs (idea generation, idea develop, lp-do-fact-find integration).
  - Board state derived from stage-doc presence (lane transitions).
  - Operators following docs/templates that encode the wrong stage key or filename.

### Test Landscape (Existing)
- Contract lint:
  - `bash scripts/check-startup-loop-contracts.sh` currently FAILs:
    - SQ-02 missing `.claude/skills/lp-bos-sync/`
    - SQ-10 warn `.claude/skills/lp-seo/SKILL.md` path topology
    - SQ-12 fail stage mapping in `.claude/skills/lp-experiment/SKILL.md`
- Agent API tests exist for stage-doc endpoints:
  - `apps/business-os/src/app/api/agent/stage-docs/__tests__/route.test.ts`
- Business OS logic tests exist that assume `fact-find.user.md`:
  - `apps/business-os/src/lib/lane-transitions.test.ts`

## Findings And Recommended Fixes (Evidence-Backed)

### FND-01 (P0): Stage Key Drift (`lp-do-fact-find` vs `fact-find`)
**Failure mode:** Skill/tooling uses `stage: "lp-do-fact-find"` or routes to `/api/agent/stage-docs/<cardId>/lp-do-fact-find`, but the agent API validates against `StageTypeSchema` and rejects unknown stage keys with 400 `Invalid stage` / 400 `Invalid request`.

**Failure signatures (concrete):**
- `GET /api/agent/stage-docs/[cardId]/[stage]` returns 400 `{ error: "Invalid stage" }` when `stage=lp-do-fact-find`. Evidence: `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts`.
- `POST /api/agent/stage-docs` returns 400 `{ error: "Invalid request", details: ... }` when the body includes `stage: "lp-do-fact-find"`. Evidence: `apps/business-os/src/app/api/agent/stage-docs/route.ts` (`CreateStageDocSchema` uses `stage: StageTypeSchema`).

**Evidence:**
- Canonical enum: `packages/platform-core/src/repositories/businessOsStageDocs.server.ts`.
- Drifted skill usage:
  - `.claude/skills/idea-develop/SKILL.md` uses `"stage": "lp-do-fact-find"`.
  - `.claude/skills/idea-generate/SKILL.md` uses `"stage": "lp-do-fact-find"` and calls `GET/PATCH` on `.../lp-do-fact-find`.

**Recommended solution (default posture): alias-and-migrate**
- Implement stage key normalization per “Normalization Rules”.
- Compatibility window:
  - Temporarily accept legacy aliases at the agent API boundary (reads and writes), but normalize to canonical storage (`fact-find`) and emit alias-usage telemetry.
  - In parallel, update skill docs to stop emitting aliases.
  - Then remove alias acceptance after the repo is migrated and lint is green.

**Definition of Done (planner-ready):**
- Stage-doc endpoints accept canonical stage keys and (during window) the `lp-do-fact-find` alias.
- Any write via alias results in canonical `filePath` and canonical stage in stored data.
- Contract lint fails on any skill emitting alias stage keys for stage-doc writes.
- Tests cover canonical and alias behaviors for POST/GET/PATCH and list filters.

---

### FND-02 (P0): Stage Doc Filename Drift (`fact-finding.user.md` vs `fact-find.user.md`)
**Failure mode:** Docs and filesystem examples refer to `fact-finding.user.md`, but the agent API always writes `fact-find.user.md`. This creates split-brain artifacts: humans read/write one name; automation reads/writes another.

**Evidence:**
- Non-canonical filename in docs: `.claude/skills/_shared/stage-doc-operations.md` uses `fact-finding.user.md` while claiming API key `fact-find`.
- Filesystem example referenced: `docs/business-os/cards/BRIK-ENG-0020.user.md` points to `docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md`.
- Canonical filename in tests and code: `apps/business-os/src/lib/lane-transitions.test.ts`, `packages/mcp-server/src/__tests__/bos-tools.test.ts`, and agent API routes all use `fact-find.user.md`.

**Recommended solution: make `fact-find.user.md` canonical**
- Treat the agent API file path template as canonical and update docs/examples accordingly.
- Provide a migration path for existing `fact-finding.user.md` docs.
  - Preferred: dual-read during the window with canonical precedence, plus a deterministic migration/rename procedure.

**Definition of Done (planner-ready):**
- Docs no longer reference `fact-finding.user.md` except in a clearly marked migration note.
- Repo reader / tooling dual-reads legacy filename during the window with deterministic precedence.
- Migration script exists or a documented procedure is defined and validated on a fixture.

---

### FND-03 (P0): Canonical Contract Docs Reference Missing Plan Markdown
**Failure mode:** canonical startup-loop docs reference `docs/plans/lp-skill-system-sequencing-plan.md` which does not exist at that path, forcing archeology and reducing trust in “authority” docs.

**Evidence:**
- Multiple loop docs reference: `docs/business-os/startup-loop/loop-spec.yaml`, `docs/business-os/startup-loop/manifest-schema.md`, `docs/business-os/startup-loop/stage-result-schema.md`, `docs/business-os/startup-loop/event-state-schema.md`, `docs/business-os/startup-loop/autonomy-policy.md`.
- Existing artifacts appear under:
  - `docs/plans/archive/lp-skill-system-sequencing-plan.md`
  - `docs/plans/lp-skill-system-sequencing-plan.html`

**Recommended policy (default for hardening): markdown is canonical for contract references**
- Create a shim at `docs/plans/lp-skill-system-sequencing-plan.md` that either:
  - Contains the canonical decision text, or
  - Points to the canonical archived artifact with an explicit “archived” label and stable anchors.
- Update contract docs to reference the shim path (stable, non-archive).

**Definition of Done (planner-ready):**
- All contract doc references resolve to existing targets.
- Lint fails on broken references.
- Policy is explicit: contract docs reference `.md` under `docs/plans/` (stable path); `.html` is optional and not a canonical reference target.

---

### FND-04 (P1): Sole Mutation Boundary Not Documented (`/lp-bos-sync` missing)
**Failure mode:** loop-spec and contract lint expect `/lp-bos-sync` to exist as an operator surface, but only the script `scripts/src/startup-loop/bos-sync.ts` exists. Mutation-control behavior is not documented at the skill level.

**Evidence:**
- Lint SQ-02: `bash scripts/check-startup-loop-contracts.sh` fails on missing `.claude/skills/lp-bos-sync/`.
- Script exists: `scripts/src/startup-loop/bos-sync.ts`.

**Recommended scope clarification:** see “Constraints & Assumptions” (mutation boundary policy).

**Recommended solution:**
- Add `/lp-bos-sync` skill doc that documents invocation patterns, safety policy, and artifact writes, and points at the script as the implementation.

---

### FND-05 (P1): Stage Semantics Drift (`/lp-experiment`, `/lp-seo`, readiness persistence)
**Symptoms and evidence:**
- `/lp-experiment` stage mapping drift flagged by lint SQ-12.
- `/lp-seo` path topology warning flagged by lint SQ-10.
- Readiness stage mismatch: `loop-spec.yaml` expects readiness outputs/persistence, but `.claude/skills/lp-readiness/SKILL.md` is explicitly non-writing.

**Recommended solution: contract-first alignment**
- Align skill docs to loop-spec semantics (or update loop-spec if the behavior is intentionally different).
- Add lint coverage for:
  - Stage mapping correctness (beyond the current SQ-12).
  - Output path topology rules for baseline artifacts.
  - “Non-writing skills used in writing-required stages” mismatches.

## Migration Posture Recommendation
Default recommendation: **alias-and-migrate** (compatibility window, then removal).

Rationale:
- The system is explicitly multi-agent and doc-driven; strict-breaking contracts tend to produce shadow workarounds, which is worse than temporary alias acceptance paired with aggressive lint.

## Compatibility Window (Recommended Defaults)
- Window start: merge date of alias support (T0).
- Week 1 (T0 to T0+7d): API accepts aliases, lint warns, telemetry logs alias usage.
- Week 2 (T0+7d to T0+14d): API still accepts aliases, lint fails on any new alias usage (except in explicitly allowlisted migration fixtures).
- Window end (T0+14d): remove alias acceptance in API and remove allowlists.

Telemetry expectation: log alias usage with caller identification where available (skill name, user agent, or MCP tool name).

Implementation switch (recommended): `docs/business-os/startup-loop/contract-migration.yaml` with explicit cutoffs (for example `alias_accept_until`, `lint_warn_until`). API + lint read this config.
Telemetry surface (recommended): structured server log event `bos.stage_alias_used` including `{ cardId, rawStage, normalizedStage, endpoint }` (no doc content). Optionally also return response header `x-bos-stage-normalized: lp-do-fact-find->fact-find` when normalization occurs.
Lint allowlist (temporary, migration fixtures only): lives in `scripts/check-startup-loop-contracts.sh` as `MIGRATION_ALLOWLIST=(...)` and is removed at window end.

## Verification Strategy (Layered)

### Unit / Contract Tests
- Stage key normalization mapping.
- Filename precedence rules for legacy vs canonical stage-doc files.
- Doc reference resolver (contract docs must reference existing targets).

### API Tests
- POST/GET/PATCH stage-doc endpoints with canonical stage keys.
- POST/GET/PATCH stage-doc endpoints with legacy alias key(s) during the window.
- Stage filtering behavior for lists (if supported).

### Integration Test
- Fixture card directory:
  - Seed a stage doc using alias key and verify canonical file path is written.
  - Verify lane transition logic and MCP tools read canonical output.

### Lint
- `bash scripts/check-startup-loop-contracts.sh` green.
- Add checks to prevent reintroduction:
  - Stage key alias usage for stage-doc writes.
  - `fact-finding.user.md` references outside an explicit migration allowlist.
  - Broken contract-doc references.

## Risks
- Risk: accepting aliases extends the time drift can persist.
  - Mitigation: hard deadline, lint escalation path (warn then fail), and explicit telemetry.
- Risk: renaming stage-doc filenames can break lane transition logic if not dual-read during migration.
  - Mitigation: dual-read with deterministic precedence, fixture-based integration test, and migration procedure.
- Risk: doc reference chain changes can cause long-term confusion if not standardized.
  - Mitigation: publish one policy and enforce with lint.

## Confidence Inputs (for /lp-do-plan)
- Implementation: 82%
  - What raises to >=90: full consumer inventory for stage-doc reads/writes and a fixture-based integration test.
- Approach: 88%
  - What raises to >=90: explicit decision on compatibility window duration and telemetry surface.
- Impact: 80%
  - What raises to >=90: end-to-end “seed stage doc -> lane transition -> MCP read” verified on a fixture.
- Delivery-Readiness: 88%
  - What raises to >=90: owners assigned by surface (Docs/Skills/Scripts/API/MCP) and sequenced tasks to avoid cross-surface thrash.

## Planning Handoff (Task Seeds, Non-Binding)
- Confirm contract authority matrix and codify drift enforcement.
- Fix P0 drift:
  - Stage key normalization (skills + API + MCP paths).
  - Stage doc filename normalization (docs + readers + migration).
  - Restore canonical doc references (shim markdown + lint policy).
- Fix governance/control point:
  - Add `/lp-bos-sync` skill doc, align with `bos-sync.ts`.
- Extend contract enforcement:
  - Expand `scripts/check-startup-loop-contracts.sh` to scan `idea-*` skills for stage key usage and scan docs for broken plan references.
- Reduce recurrence:
  - Generate TS stage constants from `loop-spec.yaml` (or add a drift test that asserts equivalence).

## Open Questions (Non-Blocking)
- Do we ratify the default policy that contract docs must reference markdown under `docs/plans/` (stable shim), and treat `.html` as non-canonical?
- Do we ratify the scope clarification that `/lp-bos-sync` is the sole mutation boundary for board/state mutations but not for stage-doc writes?

## Planning Readiness
Ready-for-planning.
