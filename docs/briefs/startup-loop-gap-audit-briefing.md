---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: Venture-Studio / Startup-Loop
Created: 2026-02-14
Last-updated: 2026-02-14
Topic-Slug: startup-loop-gap-audit
---

# Startup Loop Gap Audit Briefing

## Executive Summary
The startup loop has a strong canonical stage graph and data-plane contracts, but there are several high-friction and/or correctness-impacting gaps caused by drift across skills, docs, MCP tooling, and the Business OS agent API.

Highest load-bearing gaps observed:
- Stage skill coverage drift: `/lp-bos-sync` is referenced as a canonical stage but has no skill doc; several other stage skills reference wrong stage numbers, missing skills, or non-canonical paths.
- Stage-doc key/name drift: multiple skills/docs still use `lp-do-fact-find` (and the repo filesystem uses `fact-finding`) while the agent API schema only accepts `fact-find`.
- Broken decision references: multiple canonical startup-loop docs point at `docs/plans/lp-skill-system-sequencing-plan.md`, which does not exist (only `docs/plans/archive/...` plus `docs/plans/*.html`).
- Supporting skills (design-spec, design-qa, measure, seo) often assume legacy plan workspace paths and/or nonexistent companion skills, increasing operator overhead and token burn.
- MCP data-plane coverage is intentionally partial (no `measure_*` connectors yet), and there are additional practical gaps (for example no BOS stage-doc upsert tool) that slow loop execution.

This briefing is gap-focused (diagnosis + opportunities). It does not implement fixes. Where this document mentions "candidate fix surfaces" or "verification ideas", treat them as pointers for a follow-on plan and build, not as decisions.

## Questions Answered
1. What is the canonical startup-loop stage graph and its contract authority?
2. Which skills/docs/scripts/MCP tools are intended to implement each stage?
3. Where are the key integration boundaries (Business OS agent API, run artifacts, MCP tool policies)?
4. What gaps are present that harm efficiency (UX, token) or effectiveness (signals, speed, risk control)?

## Scope And Definitions
- Efficiency: user experience friction and/or token burn (extra turns, re-reading context, manual reconciliation).
- Effectiveness: weak/slow signals, inability to control real risks, silent wrong outputs, or slowed execution.
- "Startup loop": the end-to-end S0..S10 stage graph defined in `docs/business-os/startup-loop/loop-spec.yaml`.

## Severity Rubric
- P0 Execution blocker: a stage cannot complete (or persistence fails) without manual out-of-band patching.
- P1 Correctness risk: silent wrong outputs, wrong BOS state, or broken join barriers.
- P2 Throughput tax: token burn, operator thrash, slow loop, degraded observability.
- P3 Hygiene: consistency/cleanup with low immediate operational impact.

## Terminology And Mapping Types
Three concepts are interleaved in the system today; this doc labels them explicitly:
- Stage (loop-spec): node in `loop-spec.yaml` (S0..S10, plus conditional/parallel stages).
- Skill stage (chat-driven): `/lp-*` workflows that must emit a contract artifact and/or stage doc.
- Worker stage (scripted): `scripts/src/startup-loop/*` kernels that write/pack artifacts and enforce schemas.

Stage execution styles (used in the walkthrough below):
- Type A: Worker stage (scripted, artifacted, machine-checkable).
- Type B: Skill stage (chat-driven, but must emit a contract artifact; usually update BOS via agent API).
- Type C: Prompt-handoff stage (human/LLM work; still must emit artifact + freshness metadata).

Stage identifiers drift in multiple places; this doc uses:
- Stage key (agent API enum): `fact-find|plan|build|reflect` (see `StageTypeSchema`).
- Stage doc filename (filesystem): expected by the agent API: `docs/business-os/cards/<CARD-ID>/<stage>.user.md`.

## Canonical Sources (Authority)
- `docs/business-os/startup-loop/loop-spec.yaml` (stage graph authority)
- `docs/business-os/startup-loop-workflow.user.md` (operator workflow contract)
- `.claude/skills/startup-loop/SKILL.md` (orchestration wrapper)
- `docs/business-os/startup-loop/stage-result-schema.md`
- `docs/business-os/startup-loop/manifest-schema.md`
- `docs/business-os/startup-loop/event-state-schema.md`
- `docs/business-os/startup-loop/autonomy-policy.md`
- `scripts/src/startup-loop/*` (data-plane stage workers and control-plane kernels)
- `packages/mcp-server/src/tools/bos.ts` (BOS bridge tools + strict policy metadata)
- `packages/mcp-server/src/tools/loop.ts` (loop artifact tools + refresh/pack tooling)
- `packages/mcp-server/src/tools/policy.ts` (policy gating + error envelopes)
- `apps/business-os/src/app/api/agent/*` (Business OS agent API)

## Current Contract-Lint Status (Evidence)
The repo has an explicit contract lint script, and it currently fails:

```
bash scripts/check-startup-loop-contracts.sh
FAIL: Skill 'lp-bos-sync' referenced in loop-spec has no SKILL.md at .claude/skills/lp-bos-sync/ (SQ-02)
WARN: lp-seo uses 'docs/business-os/<BIZ>/' — should include subdirectory (strategy/startup-baselines) (SQ-10)
FAIL: lp-experiment maps lp-prioritize to S3 — should be S5A (SQ-12)
RESULT: FAIL — contract violations detected
```

## Gap Register (Deduped)
This is the single deduped register of gaps found. Items are phrased as failure modes and anchored to evidence.

| Gap ID | Severity | Failure Mode | Blast Radius | Primary Surfaces |
|---|---:|---|---|---|
| GAP-01 | P0 | Stage-doc key drift: `lp-do-fact-find` (skills) vs `fact-find` (agent API enum); filesystem has `fact-finding.user.md` but API writes `fact-find.user.md`. | BOS stage doc create/filter can fail (400) or create parallel, inconsistent stage-doc histories across cards. | Skills, Agent API, Repo stage-doc repository, Filesystem naming |
| GAP-02 | P0 | Canonical docs reference missing decision plan: `docs/plans/lp-skill-system-sequencing-plan.md` not present at referenced path. | Undermines trust in loop contracts; forces ad hoc archeology; increases token burn and wrong implementation choices. | Docs (loop contracts), Plan doc topology |
| GAP-03 | P1 | Sole mutation boundary not documented as a skill: `/lp-bos-sync` missing SKILL.md while `bos-sync.ts` exists. | Governance/control-plane weakness; mutation behavior becomes ad hoc; higher incident risk. | Skills, Scripts, Loop-spec references |
| GAP-04 | P1 | Stage semantics drift: `/lp-experiment` stage mapping mismatch (SQ-12), and legacy/nonexistent companion skill references. | Wrong stage ordering; fragile downstream consumption; operator confusion. | Skills, Contract lint |
| GAP-05 | P1 | Readiness stage contract inconsistency: loop-spec expects persisted readiness outputs, but `/lp-readiness` is non-writing. | Join barrier and BOS state can be incomplete; later stages proceed with missing artifacts. | Loop-spec, Skills, BOS sync expectations |
| GAP-06 | P1/P2 | Baseline artifact naming/path drift: offer/channels/forecast skills emit non-`.user.md` and/or legacy directory layouts vs baseline schemas expecting `.user.md` artifacts. | Silent schema noncompliance; merge/join stages become brittle; higher token burn from reconciliation. | Skills, Baseline schemas, Baseline merge |
| GAP-07 | P2 | MCP tooling gaps: no BOS stage-doc create/upsert tool; no run index/list tool; measurement connectors deferred. | Increased manual API calls; poorer observability; slower iteration; higher chance of noncompliant writes. | MCP tools, Skills, Operator workflow |
| GAP-08 | P2 | Duplicated stage lists (loop-spec vs TS arrays) with no codegen/drift enforcement. | Recurring drift; fixes in one place regress elsewhere. | Scripts, MCP tools, Docs |
| GAP-09 | P2 | `BOS_AGENT_API_BASE_URL` inconsistently documented (3000 vs 3020; domain variants). | Setup friction; wasted cycles; sporadic tool failures. | Docs, Skills, Tests |
| GAP-10 | P2 | Contract lint exists but misses several high-impact drift sites (for example `idea-*` skills stage key usage; legacy plan workspace paths). | Drift persists undetected; repeated regressions. | Lint script, Skills |

### GAP-01 Detail: Stage-Doc Key/Filename Drift
Failure signature (observed/likely):
- `POST /api/agent/stage-docs` returns 400 `{ error: "Invalid request", details: ... }` when a skill submits `stage: "lp-do-fact-find"` because the API schema is strict (`StageTypeSchema`). See `apps/business-os/src/app/api/agent/stage-docs/route.ts`.
- Stage-doc file paths written by API always follow `docs/business-os/cards/<cardId>/<stage>.user.md` where `<stage>` is the enum value (for example `fact-find`), so any filesystem convention like `fact-finding.user.md` cannot be produced by the API and creates split-brain stage-doc histories.

Evidence anchors:
- Agent API enum: `packages/platform-core/src/repositories/businessOsStageDocs.server.ts` (`StageTypeSchema = ["fact-find","plan","build","reflect"]`).
- Create path pattern: `apps/business-os/src/app/api/agent/stage-docs/route.ts` (`filePath: .../${stage}.user.md`).
- Non-canonical usage in skills: `.claude/skills/idea-generate/SKILL.md`, `.claude/skills/idea-develop/SKILL.md` (uses `lp-do-fact-find`).
- Filesystem example: `docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md`.

Candidate fix surfaces (no decision here):
- Agent API: consider temporary alias acceptance vs strict-only behavior (compatibility posture needed).
- Skills/docs: normalize stage key usage to the enum set.
- Filesystem: reconcile `fact-finding.user.md` vs `fact-find.user.md` convention.

Verification ideas:
- Add a deterministic "stage alias" contract test in `apps/business-os/src/app/api/agent/stage-docs/__tests__/route.test.ts`.
- Extend `scripts/check-startup-loop-contracts.sh` to grep/parse for non-canonical stage keys in `.claude/skills/**/SKILL.md`.

## End-to-End Loop Walkthrough (S0 -> S10)

### S0 - Intake
Stage type: Type B (Skill stage) with Type C handoff to intake normalizer template.

Intended:
- Orchestrated via `.claude/skills/startup-loop/SKILL.md` using `docs/business-os/workflow-prompts/_templates/intake-normalizer-prompt.md`.

Gaps observed:
- `/startup-loop` is specified as a chat wrapper, but there is no repo-local executable entrypoint for that command itself (scripts exist; MCP has run-packet tooling; the wrapper contract is still primarily "follow the doc").
- Core schema/policy docs reference a missing decision doc path (`docs/plans/lp-skill-system-sequencing-plan.md`).

Evidence:
- `.claude/skills/startup-loop/SKILL.md`
- `docs/business-os/workflow-prompts/_templates/intake-normalizer-prompt.md`
- `docs/business-os/startup-loop/loop-spec.yaml`

### S1 - Readiness
Stage type: Type B (Skill stage).

Intended:
- `/lp-readiness` runs as S1 and gates progress.

Gaps observed:
- `docs/business-os/startup-loop/loop-spec.yaml` sets `prompt_required: true` for S1 and expects BOS sync writes to readiness/strategy docs.
- `.claude/skills/lp-readiness/SKILL.md` is explicitly non-writing (no persisted readiness artifact described).

Evidence:
- `docs/business-os/startup-loop/loop-spec.yaml`
- `.claude/skills/lp-readiness/SKILL.md`

### S1B - Measure (conditional)
Stage type: Type C (Prompt-handoff), with an adjacent Type B skill (`/lp-measure`) that does not map cleanly.

Intended:
- Prompt-handoff stage for pre-website.

Gaps observed:
- `.claude/skills/lp-measure/SKILL.md` exists and is referenced by other skills, but S1B in the loop spec is prompt-handoff, not `/lp-measure`.
- `lp-measure` references legacy/nonexistent companion skills (`lp-channel`, `lp-content`) and does not specify a canonical output path.

Evidence:
- `docs/business-os/startup-loop/loop-spec.yaml`
- `.claude/skills/lp-measure/SKILL.md`

### S2A - Results (conditional)
Stage type: Type C (Prompt-handoff).

Intended:
- Prompt-handoff stage for website-live businesses.

Gaps observed:
- Wave-2 planning explicitly calls out missing measurement connectors; baseline quality remains partially manual.

Evidence:
- `docs/business-os/workflow-prompts/_templates/existing-business-historical-baseline-prompt.md`
- `docs/plans/mcp-startup-loop-data-plane-wave-2/fact-find.md`

### S2 - Market Intelligence
Stage type: Type C (Prompt-handoff).

Intended:
- Prompt-handoff (Deep Research) with freshness gating.

Gaps observed:
- Freshness enforcement is largely doc/process driven; MCP has refresh/content tooling but stage skills and operator wrapper do not consistently route to those tools.

Evidence:
- `docs/business-os/startup-loop-workflow.user.md`
- `packages/mcp-server/src/tools/loop.ts` (refresh + content source tools)

### S2B - Offer Design
Stage type: Type B (Skill stage).

Intended:
- `/lp-offer` produces an offer artifact used by forecast/channels.

Gaps observed:
- `.claude/skills/lp-offer/SKILL.md` outputs `docs/business-os/startup-baselines/<BIZ>-offer.md` (no `.user.md`). Canonical baseline schemas reference `.user.md` baseline artifacts (for example `HEAD-offer.user.md`).

Evidence:
- `.claude/skills/lp-offer/SKILL.md`
- `docs/business-os/startup-loop/baseline-prior-schema.md`

### S3 - Forecast
Stage type: Type B (Skill stage).

Intended:
- `/lp-forecast` produces forecast artifact; runs parallel with S6B.

Gaps observed:
- `.claude/skills/lp-forecast/SKILL.md` appears on an older stage model and path topology (for example references S2-offer-hypothesis/S2-channel-selection and writes under `startup-baselines/<BIZ>/S3-forecast/...`).
- The skill's own integration notes reference prioritize as S4, conflicting with canonical S5A.

Evidence:
- `.claude/skills/lp-forecast/SKILL.md`
- `docs/business-os/startup-loop/loop-spec.yaml`

### S6B - Channel Strategy + GTM (parallel with S3)
Stage type: Type B (Skill stage).

Intended:
- `/lp-channels` plus `/lp-seo` and `/draft-outreach`.

Gaps observed:
- `.claude/skills/lp-channels/SKILL.md` outputs `docs/business-os/startup-baselines/<BIZ>-channels.md` (no `.user.md`).
- `.claude/skills/lp-seo/SKILL.md` uses non-canonical BOS path topology (`docs/business-os/<BIZ>/seo/`) and is flagged by startup-loop contract lint (SQ-10 warning).

Evidence:
- `.claude/skills/lp-channels/SKILL.md`
- `.claude/skills/lp-seo/SKILL.md`
- `scripts/check-startup-loop-contracts.sh`

### S4 - Baseline Merge (join barrier)
Stage type: Type B (Skill stage) but acts like Type A (Worker stage) in terms of contract expectations.

Intended:
- `/lp-baseline-merge` composes baseline snapshot and emits stage-result.

Gaps observed:
- This stage is aligned to the run-artifact contract; it highlights that upstream stages are not consistently described as run-artifact stage workers (mix of chat-doc skills and stage-worker specs).

Evidence:
- `.claude/skills/lp-baseline-merge/SKILL.md`
- `docs/business-os/startup-loop/stage-result-schema.md`

### S5A - Prioritize
Stage type: Type B (Skill stage).

Intended:
- `/lp-prioritize` as side-effect-free ranking.

Gaps observed:
- `/lp-prioritize` reads upstream outputs (for example `/lp-forecast`) which currently appears drifted, creating indirect fragility.

Evidence:
- `.claude/skills/lp-prioritize/SKILL.md`

### S5B - BOS Sync (sole mutation boundary)
Stage type: Type A (Worker stage) in implementation, but missing the Type B skill wrapper.

Intended:
- `/lp-bos-sync` performs guarded BOS persistence.

Gaps observed:
- `/lp-bos-sync` is referenced in the loop spec and wrapper skill but is missing as a skill doc.
- There is a stage worker implementation as a script (`scripts/src/startup-loop/bos-sync.ts`), creating doc vs script mismatch.

Evidence:
- `docs/business-os/startup-loop/loop-spec.yaml`
- `.claude/skills/startup-loop/SKILL.md`
- `scripts/src/startup-loop/bos-sync.ts`

### S6 - Site Upgrade Synthesis
Stage type: Type B (Skill stage).

Intended:
- `/lp-site-upgrade`.

Gaps observed:
- This is comparatively aligned (uses `.user.md` artifacts plus explicit html render contract), but creates contrast with offer/channels/forecast skills that do not.

Evidence:
- `.claude/skills/lp-site-upgrade/SKILL.md`

### DO - Fact-Find (`/lp-do-fact-find`)
Stage type: Type B (Skill stage).

Intended:
- `/lp-do-fact-find` creates `docs/plans/<slug>/fact-find.md` and (when integrated) upserts stage doc key `fact-find` via agent API.

Gaps observed (high impact):
- Multiple Business OS skills/docs still use stage key `lp-do-fact-find` for stage doc operations.
- The Business OS agent API stage enum is strict: `fact-find`, `plan`, `build`, `reflect`.
- This is an execution blocker for stage-doc creation in those skills, and it also creates token/UX churn (operators have to reconcile which naming is real).

Evidence:
- `.claude/skills/lp-do-fact-find/SKILL.md` (uses `fact-find`)
- `.claude/skills/idea-develop/SKILL.md` (uses `lp-do-fact-find`)
- `.claude/skills/idea-generate/SKILL.md` (uses `lp-do-fact-find`)
- `apps/business-os/src/app/api/agent/stage-docs/route.ts` (StageTypeSchema validation)
- `packages/platform-core/src/repositories/businessOsStageDocs.server.ts` (StageTypeSchema definition)

### DO - Plan (`/lp-do-plan`)
Stage type: Type B (Skill stage).

Intended:
- `/lp-do-plan` writes `docs/plans/<slug>/plan.md` and upserts stage doc key `plan`.

Gaps observed:
- Supporting skills in the loop still assume legacy flat plan workspace paths (for example `.claude/skills/lp-design-spec/SKILL.md`, `.claude/skills/lp-design-qa/SKILL.md`).

Evidence:
- `.claude/skills/lp-do-plan/SKILL.md`
- `.claude/skills/lp-design-spec/SKILL.md`
- `.claude/skills/lp-design-qa/SKILL.md`

### DO - Build (`/lp-do-build`)
Stage type: Type B (Skill stage), with Type A validation scripts/tooling.

Intended:
- `/lp-do-build` executes plan tasks, validates, commits, and updates BOS via agent API.

Gaps observed:
- Build path is comparatively well-defined; loop-level risk is that upstream planning inputs/signals are missing or wrong due to earlier drift (especially fact-find stage doc key drift and baseline artifact path drift).

Evidence:
- `.claude/skills/lp-do-build/SKILL.md`

### S9B - QA Gates
Stage type: Type B (Skill stage).

Intended:
- `/lp-launch-qa` plus `/lp-design-qa`.

Gaps observed:
- `/lp-launch-qa` references `docs/business-os/startup-baselines/<BIZ>/loop-state.json` and `/lp-launch` (missing skill). `docs/business-os/startup-loop/event-state-schema.md` documents a migration to `state.json`, but the skill doc appears not updated.

Evidence:
- `.claude/skills/lp-launch-qa/SKILL.md`
- `docs/business-os/startup-loop/event-state-schema.md`

### S10 - Weekly Readout + Experiments
Stage type: Type B (Skill stage), with substantial Type A runtime machinery in scripts.

Intended:
- `/lp-experiment` produces weekly readout and experiment loop.

Gaps observed:
- `/lp-experiment` has stage mapping drift (startup-loop contract lint SQ-12 failure).
- `/lp-experiment` references legacy/nonexistent companion skills (for example `lp-channel`, `lp-content`).
- There is substantial actual S10 runtime machinery in scripts (growth accounting, learning ledger/compiler), but the skill doc does not reference these artifacts/contracts.

Evidence:
- `.claude/skills/lp-experiment/SKILL.md`
- `scripts/src/startup-loop/s10-growth-accounting.ts`
- `scripts/src/startup-loop/s10-learning-hook.ts`
- `docs/business-os/startup-loop/learning-ledger-schema.md`

## Root Cause Hypotheses (Systemic)
These are hypotheses suggested by repeated symptoms; they need confirmation:
- Multiple sources of truth without codegen: `loop-spec.yaml` is authoritative, but stage lists and path templates are duplicated in TS and skills.
- Incomplete migrations: legacy workspace path and naming conventions persist in skills/docs while the API and schemas have moved on.
- Strict schemas without a migration posture: enums and file path templates are strict, but the rest of the ecosystem still emits legacy identifiers.
- Contract lint coverage gap: the linter exists but does not scan several high-drift surfaces (`idea-*` skills, plan path topology assumptions).

## Compatibility Posture (Decision Needed, Not Chosen Here)
Several gaps (especially GAP-01) require deciding how the system handles legacy identifiers:
- Strict-break posture: reject legacy identifiers immediately (fast cleanup, high short-term disruption).
- Alias-and-migrate posture: accept legacy identifiers temporarily with warnings, then migrate, then remove alias support (lower disruption, needs explicit timeline and enforcement).

This doc does not choose; it flags that a posture must be chosen to prevent operators from creating ad hoc workarounds.

## Cross-Cutting Gap Notes (More Evidence)

### A) Startup-loop decision references point to missing plan markdown
Multiple canonical startup-loop docs reference `docs/plans/lp-skill-system-sequencing-plan.md`, but the repo contains `docs/plans/archive/lp-skill-system-sequencing-plan.md` and `docs/plans/lp-skill-system-sequencing-plan.html`.

Evidence:
- `docs/business-os/startup-loop/loop-spec.yaml`
- `docs/business-os/startup-loop/manifest-schema.md`
- `docs/business-os/startup-loop/stage-result-schema.md`
- `docs/business-os/startup-loop/event-state-schema.md`
- `docs/business-os/startup-loop/autonomy-policy.md`

### B) Stage-doc filename and schema drift across filesystem, docs, and API
Observed mismatch set:
- Filesystem stage docs under cards: `docs/business-os/cards/<CARD-ID>/fact-finding.user.md` (example: `docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md`).
- API stage docs schema uses stage key `fact-find` and (in tests) filePath `.../fact-find.user.md`.

Evidence:
- `docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md`
- `apps/business-os/src/app/api/agent/stage-docs/__tests__/route.test.ts`
- `packages/platform-core/src/repositories/businessOsStageDocs.server.ts`
- `.claude/skills/_shared/workspace-paths.md`
- `.claude/skills/_shared/stage-doc-operations.md`

### C) `BOS_AGENT_API_BASE_URL` values disagree across docs and skills
This can break loop tracking and wastes time in setup/debug.

Evidence:
- `.claude/skills/_shared/card-operations.md` (local 3020, prod workers.dev)
- `.claude/skills/idea-develop/SKILL.md` (local 3020, prod workers.dev)
- `docs/business-os/agent-workflows.md` (local 3000, prod acme.dev)
- `packages/mcp-server/src/__tests__/bos-tools-write.test.ts` (local 3020)

### D) Contract lint exists but misses high-impact drift sites
`scripts/check-startup-loop-contracts.sh` catches:
- Missing `/lp-bos-sync` skill doc
- `/lp-seo` path drift warning
- `/lp-experiment` stage semantics drift

It does not catch:
- `idea-*` skills still using `lp-do-fact-find` stage key for stage-doc creates
- Legacy plan workspace path assumptions in multiple loop-adjacent skills

Evidence:
- `scripts/check-startup-loop-contracts.sh`
- `.claude/skills/idea-generate/SKILL.md`
- `.claude/skills/idea-develop/SKILL.md`
- `.claude/skills/lp-design-spec/SKILL.md`

### E) MCP data-plane coverage is partial and has practical tool gaps
Intentional gaps:
- No production `measure_*` connector tools yet (signals remain partially manual).

Practical gaps:
- `bos_*` tools include `list` and `get` and guarded `patch`, but do not include stage-doc create/upsert.
- `loop_*` tools provide status/summary reads but no run index/list tool.

Evidence:
- `docs/plans/mcp-startup-loop-data-plane/plan.md` (coverage map and gaps)
- `packages/mcp-server/src/lib/bos-agent-client.ts` (bridge coverage)
- `packages/mcp-server/src/tools/bos.ts`
- `packages/mcp-server/src/tools/loop.ts`

### F) Token/UX inefficiency from duplicated stage lists
Stage IDs are duplicated across multiple code locations (for example `scripts/src/startup-loop/derive-state.ts`, `packages/mcp-server/src/tools/bos.ts`, `packages/mcp-server/src/tools/loop.ts`) in addition to the canonical loop spec.

Evidence:
- `docs/business-os/startup-loop/loop-spec.yaml`
- `scripts/src/startup-loop/derive-state.ts`
- `packages/mcp-server/src/tools/bos.ts`
- `packages/mcp-server/src/tools/loop.ts`

## Candidate Sequencing / Ownership (Hypothesis Only)
This is an "execution-ready" framing of where fixes would likely land, without designing the fixes:
1. P0s first: normalize stage keys and canonical references (Docs + Skills + Agent API posture decision) so stage-doc persistence cannot fail.
2. Governance/control point: document `/lp-bos-sync` (or reconcile how operators invoke `bos-sync.ts`) so mutation boundary is explicit.
3. Stage semantics: align `/lp-experiment` mapping and any stage numbering drift so loop ordering is coherent.
4. Contract enforcement: expand `scripts/check-startup-loop-contracts.sh` to cover the high-drift surfaces that were missed.
5. Tooling/signal improvements: MCP tool surface gaps and run-index observability (throughput and speed).

## Unknowns / Follow-ups (Needs Verification)
- Whether `lp-do-fact-find` stage-doc aliasing is supported in deployed environments (repo API schema is strict).
- Whether startup-loop run artifacts under `docs/business-os/startup-baselines/<BIZ>/runs/*` are intentionally uncommitted (and if so, where operators should find exemplars).
- Whether `/startup-loop` is implemented in an external agent runtime not represented in this repo (repo has contracts and kernels; wrapper is still doc-driven).
