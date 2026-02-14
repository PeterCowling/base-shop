---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform / Business-OS
Workstream: Engineering
Created: 2026-02-14
Last-updated: 2026-02-14
Feature-Slug: startup-loop-contract-hardening
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-plan, /lp-sequence
Related-Plan: docs/plans/startup-loop-contract-hardening/plan.md
Business-OS-Integration: on
Business-Unit: BOS
Card-ID:
---

# Startup Loop Contract Hardening Fact-Find Brief

## Scope

### Summary
Harden the startup loop so skills, docs, scripts, MCP tooling, and the Business OS agent API all agree on the same contracts (stage keys, artifact paths, and stage semantics), and so drift is detected early by lint/tests.

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
  - `docs/business-os/startup-loop/loop-spec.yaml` is the single stage-graph authority and should drive codegen/drift tests.
  - The Business OS agent API’s `StageTypeSchema` (`fact-find|plan|build|reflect`) is the canonical stage-key set.

## Evidence Audit (Current State)

### Entry Points
- `docs/business-os/startup-loop/loop-spec.yaml` — canonical stage graph and stage references (including `/lp-bos-sync`).
- `apps/business-os/src/app/api/agent/stage-docs/route.ts` — stage-doc list/create; strict `StageTypeSchema` validation.
- `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts` — stage-doc get/patch; strict `StageTypeSchema` validation and canonical file path template.
- `packages/platform-core/src/repositories/businessOsStageDocs.server.ts` — `StageTypeSchema = ["fact-find","plan","build","reflect"]`.
- `.claude/skills/_shared/workspace-paths.md` — canonical stage key policy; explicitly rejects `lp-fact-find` for writes.
- `.claude/skills/_shared/stage-doc-operations.md` — stage-doc ops helper; currently mixes canonical API key with non-canonical filename convention (`fact-finding.user.md`).
- `scripts/check-startup-loop-contracts.sh` — contract lint (currently fails).

### Key Modules / Files
- Drift hot spots:
  - `.claude/skills/idea-generate/SKILL.md` — seeds stage docs using `stage: "lp-fact-find"` and routes GET/PATCH to `/lp-fact-find` stage paths.
  - `.claude/skills/idea-develop/SKILL.md` — creates stage docs using `stage: "lp-fact-find"`.
  - `.claude/skills/lp-experiment/SKILL.md` — stage mapping drift (lint SQ-12) and legacy companion skill references.
  - `.claude/skills/lp-seo/SKILL.md` — non-canonical path topology (lint SQ-10 warn).
- Runtime “sole mutation boundary” script exists:
  - `scripts/src/startup-loop/bos-sync.ts` — implementation exists, but `/lp-bos-sync` skill doc is missing (lint SQ-02 fail).
- Drift evidence in tests:
  - `apps/business-os/src/lib/lane-transitions.test.ts` expects `fact-find.user.md` naming.
  - `packages/mcp-server/src/__tests__/bos-tools.test.ts` expects `docs/business-os/cards/<id>/fact-find.user.md`.
  - `docs/business-os/cards/BRIK-ENG-0020.user.md` references `docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md` (filesystem convention drift).

### Patterns & Conventions Observed
- Canonical stage keys are enforced in the agent API with strict validation:
  - `apps/business-os/src/app/api/agent/stage-docs/route.ts` uses `stage: StageTypeSchema` in the request schema and filters.
  - `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts` validates the path param `stage` via `StageTypeSchema.safeParse(stage)` and returns `{ error: "Invalid stage" }` with 400 on failure.
- Canonical stage-doc filePath written by the agent API is derived from the stage enum value:
  - `docs/business-os/cards/${cardId}/${stage}.user.md` where stage is `fact-find|plan|build|reflect`.

### Data & Contracts
- Stage doc enum (contract surface):
  - `packages/platform-core/src/repositories/businessOsStageDocs.server.ts` exports `StageTypeSchema = z.enum(["fact-find","plan","build","reflect"])`.
- Stage doc filePath template (contract surface):
  - `apps/business-os/src/app/api/agent/stage-docs/route.ts` and `[cardId]/[stage]/route.ts` both set `filePath` using the enum stage value, not the human stage label.
- Stage doc operations helper doc is inconsistent with agent API template:
  - `.claude/skills/_shared/stage-doc-operations.md` says API key `fact-find` but file name `fact-finding.user.md`.

### Dependency & Impact Map
- Upstream dependencies:
  - Skill docs and shared helpers under `.claude/skills/**`.
  - Canonical loop contracts under `docs/business-os/startup-loop/**`.
- Downstream dependents:
  - Agent API routes (strict stage validation + canonical paths).
  - MCP tooling and tests that assume the canonical filePath.
  - Board lane transitions and repo-reader logic that assumes canonical stage file names.
- Likely blast radius:
  - Any workflow that creates/patches stage docs (idea generation, idea develop, lp-fact-find integration).
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

### FND-01 (P0): Stage Key Drift (`lp-fact-find` vs `fact-find`)
**Failure mode:** Skill/tooling uses `stage: "lp-fact-find"` or routes to `/api/agent/stage-docs/<cardId>/lp-fact-find`, but the agent API validates against `StageTypeSchema` and rejects unknown stage keys with 400 `Invalid stage` / 400 `Invalid request`.

**Failure signatures (concrete):**
- `GET /api/agent/stage-docs/[cardId]/[stage]` returns 400 `{ error: "Invalid stage" }` when `stage=lp-fact-find`. Evidence: `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts`.
- `POST /api/agent/stage-docs` returns 400 `{ error: "Invalid request", details: ... }` when the body includes `stage: "lp-fact-find"`. Evidence: `apps/business-os/src/app/api/agent/stage-docs/route.ts` (`CreateStageDocSchema` uses `stage: StageTypeSchema`).

**Evidence:**
- Canonical enum: `packages/platform-core/src/repositories/businessOsStageDocs.server.ts`.
- Drifted skill usage:
  - `.claude/skills/idea-develop/SKILL.md` uses `"stage": "lp-fact-find"`.
  - `.claude/skills/idea-generate/SKILL.md` uses `"stage": "lp-fact-find"` and calls `GET/PATCH` on `.../lp-fact-find`.

**Recommended solution (default posture): alias-and-migrate**
- Compatibility window:
  - Temporarily accept legacy aliases at the agent API boundary (for reads and writes), but normalize to canonical storage (`fact-find`) and emit an audit log / warning surface.
  - In parallel, update skill docs to stop emitting aliases.
  - Then remove alias acceptance after the repo is migrated and lint is green.

**Alternative (strict-break):**
- Do not accept aliases; update all skills/docs immediately; migrate/rename any legacy files. This is faster but increases operator disruption and increases the chance of “shadow workarounds”.

**Primary fix surfaces:**
- Agent API stage parsing: `apps/business-os/src/app/api/agent/stage-docs/route.ts`, `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts`.
- Skill docs: `.claude/skills/idea-generate/SKILL.md`, `.claude/skills/idea-develop/SKILL.md`.
- Shared policy docs: `.claude/skills/_shared/workspace-paths.md` (already correct), `.claude/skills/_shared/stage-doc-operations.md` (partially drifted).

**Verification plan:**
- Add/extend tests that prove:
  - Canonical keys still work and write canonical file paths.
  - Legacy aliases are accepted during the compatibility window (if chosen) and normalize correctly.
  - Contract lint fails on any reintroduction of `lp-fact-find` writes in skills.
- Run `bash scripts/check-startup-loop-contracts.sh` and ensure SQ-xx coverage includes skills that call stage-doc APIs.

---

### FND-02 (P0): Stage Doc Filename Drift (`fact-finding.user.md` vs `fact-find.user.md`)
**Failure mode:** Docs and filesystem examples refer to `fact-finding.user.md`, but the agent API always writes `fact-find.user.md`. This creates split-brain artifacts: humans read/write one name; automation reads/writes another.

**Evidence:**
- Non-canonical filename in docs: `.claude/skills/_shared/stage-doc-operations.md` uses `fact-finding.user.md` while claiming API key `fact-find`.
- Filesystem example referenced: `docs/business-os/cards/BRIK-ENG-0020.user.md` points to `docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md`.
- Canonical filename in tests and code: `apps/business-os/src/lib/lane-transitions.test.ts`, `packages/mcp-server/src/__tests__/bos-tools.test.ts`, and agent API routes all use `fact-find.user.md`.

**Recommended solution: make `fact-find.user.md` canonical**
- Treat the agent API file path template as canonical and update docs/examples accordingly.
- Provide a migration path for existing `fact-finding.user.md` docs (rename or dual-read with preference).

**Primary fix surfaces:**
- Docs: `.claude/skills/_shared/stage-doc-operations.md`, any `docs/business-os/cards/*.user.md` that link to `fact-finding.user.md`.
- Any filesystem readers (repo-reader/backfill) that assume a particular name.

**Verification plan:**
- Add contract lint check: reject `fact-finding.user.md` references in stage-doc policy docs unless explicitly listed as a legacy alias.
- Add a targeted migration test for the reader that ensures legacy filenames are discovered and normalized (if dual-read is chosen).

---

### FND-03 (P0): Canonical Contract Docs Reference Missing Plan Markdown
**Failure mode:** canonical startup-loop docs reference `docs/plans/lp-skill-system-sequencing-plan.md` which does not exist at that path, forcing archeology and reducing trust in “authority” docs.

**Evidence:**
- Multiple loop docs reference: `docs/business-os/startup-loop/loop-spec.yaml`, `docs/business-os/startup-loop/manifest-schema.md`, `docs/business-os/startup-loop/stage-result-schema.md`, `docs/business-os/startup-loop/event-state-schema.md`, `docs/business-os/startup-loop/autonomy-policy.md`.
- Existing files appear under:
  - `docs/plans/archive/lp-skill-system-sequencing-plan.md`
  - `docs/plans/lp-skill-system-sequencing-plan.html`

**Recommended solution: pick a canonical reference chain and enforce it**
- Decide whether markdown or html is the canonical reference target for contract docs.
- Make references consistent and add lint to prevent missing-reference drift.

**Primary fix surfaces:**
- The loop contract docs that reference the missing plan path.
- A doc-reference lint check (extend `scripts/check-startup-loop-contracts.sh` or add a sibling lint).

**Verification plan:**
- Lint passes: “all referenced plan paths exist”.
- Optional: “if html is canonical, references must use `.html` and include a policy doc explaining it”.

---

### FND-04 (P1): Sole Mutation Boundary Not Documented (`/lp-bos-sync` missing)
**Failure mode:** loop-spec and contract lint expect `/lp-bos-sync` to exist as an operator surface, but only the script `scripts/src/startup-loop/bos-sync.ts` exists. Mutation-control behavior is not documented at the skill level.

**Evidence:**
- Lint SQ-02: `bash scripts/check-startup-loop-contracts.sh` fails on missing `.claude/skills/lp-bos-sync/`.
- Script exists: `scripts/src/startup-loop/bos-sync.ts`.

**Recommended solution: make mutation boundary explicit**
- Add `/lp-bos-sync` skill doc that documents invocation patterns, safety policy, and artifact writes, and points at the script as the implementation.

**Verification plan:**
- Contract lint SQ-02 goes green.
- Add a minimal unit/contract test that asserts bos-sync behavior matches loop-spec expectations (inputs/outputs, stages mutated).

---

### FND-05 (P1): Stage Semantics Drift (`/lp-experiment`, `/lp-seo`, readiness persistence)
**Symptoms and evidence:**
- `/lp-experiment` stage mapping drift flagged by lint SQ-12.
- `/lp-seo` path topology warning flagged by lint SQ-10.
- Readiness stage mismatch: `loop-spec.yaml` expects readiness outputs/persistence, but `.claude/skills/lp-readiness/SKILL.md` is explicitly non-writing.

**Recommended solution: “contract-first alignment”**
- Align skill docs to loop-spec semantics (or update loop-spec if the behavior is intentionally different).
- Add lint coverage for:
  - Stage mapping correctness (beyond the current SQ-12).
  - Output path topology rules for baseline artifacts.
  - “Non-writing skills used in writing-required stages” mismatches.

## Migration Posture Recommendation
Default recommendation: **alias-and-migrate** (compatibility window, then removal).

Rationale:
- The system is explicitly multi-agent and doc-driven; strict-breaking contracts tend to produce shadow workarounds, which is worse than temporary alias acceptance paired with aggressive lint.

## Risks
- Risk: accepting aliases extends the time drift can persist.
  - Mitigation: hard deadline (in plan), lint escalation path (warn -> fail), and explicit telemetry/audit logging.
- Risk: renaming stage-doc filenames can break lane transition logic if not dual-read during migration.
  - Mitigation: migrate with tests and temporary dual-read; verify both on a fixture card dir.
- Risk: doc reference chain changes can cause long-term confusion if not standardized.
  - Mitigation: publish a single “contract doc referencing policy” and enforce with lint.

## Confidence Inputs (for /lp-plan)
- Implementation: 78%
  - What raises to >=80: confirm all consumers of stage-doc filenames and stage keys via repo search + add/update contract tests.
  - What raises to >=90: add codegen/drift enforcement for stage keys and paths; extend lints to cover skills + docs.
- Approach: 82%
  - What raises to >=90: explicit migration posture decision and a timeboxed compatibility window policy.
- Impact: 75%
  - What raises to >=80: produce a complete call-site map for stage-doc reads/writes and lane transitions.
  - What raises to >=90: run an end-to-end “seed stage doc -> lane transition -> export snapshot” test in a sandboxed fixture repo path.
- Delivery-Readiness: 85%
  - What raises to >=90: assign owners by surface (Docs/Skills/Scripts/API/MCP) and sequence changes to avoid cross-surface thrash.

## Planning Handoff (Task Seeds, Non-Binding)
- Decide migration posture (alias vs strict-break) and compatibility window.
- Fix P0 drift:
  - Stage key normalization (skills + API + MCP paths).
  - Stage doc filename normalization (docs + readers + migration).
  - Restore canonical doc references (plan path policy + lint).
- Fix governance/control point:
  - Add `/lp-bos-sync` skill doc, align with `bos-sync.ts`.
- Extend contract enforcement:
  - Expand `scripts/check-startup-loop-contracts.sh` to scan `idea-*` skills for stage key usage and scan docs for broken plan references.
- Reduce recurrence:
  - Generate TS stage constants from `loop-spec.yaml` (or add a drift test that asserts equivalence).

## Open Questions (Non-Blocking)
- Should the agent API accept legacy stage keys and legacy stage-doc filenames as part of a formal migration window, or should the system strict-break and rely on repo-wide updates only?
- Is the canonical sequencing decision doc intended to be markdown or html (and what is the policy for referencing one from contract docs)?

## Planning Readiness
Ready-for-planning.
