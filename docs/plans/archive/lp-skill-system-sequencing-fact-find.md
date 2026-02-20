---
Type: Fact-Find
Outcome: System-Briefing
Status: Active
Domain: Venture-Studio
Workstream: Process
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-skill-system-sequencing
Business-Unit: BOS
---

# LP Skills System Sequencing + Parallelization Fact-Find

## 1) Scope

Audit how the `lp-*` skill system currently composes end-to-end through Startup Loop, with emphasis on:

1. Stage-to-stage sequencing integrity.
2. Skill-to-skill contract integrity (inputs, outputs, names, paths).
3. Parallelization opportunities that are safe and high-leverage.

## 2) Executive Summary

The LP skill library is materially stronger in coverage and includes clear specialist roles (`lp-offer`, `lp-forecast`, `lp-channels`, `lp-site-upgrade`, `lp-do-fact-find`, `lp-do-plan`, `lp-do-build`, `lp-do-replan`, `lp-sequence`, QA/measurement skills).  
The main current risk is not missing capability; it is contract drift between:

1. The Startup Loop workflow guide.
2. The `/startup-loop` wrapper skill.
3. Individual `lp-*` skill file contracts.

Highest-impact sequencing breaks are:

1. Stage model drift (`S2B/S6B/S9B` exists in skill but not workflow/prompt contract).
2. Artifact path drift (`lp-offer`/`lp-channels` flat files vs `lp-forecast` nested directories).
3. Handoff filename drift (`-fact-find.md` vs `-lp-do-fact-find.md`).
4. BOS lane/persistence drift (`S5` requires API card writes, but `lp-prioritize` explicitly does not persist).
5. Launch path drift (`lp-launch-qa` expects `/lp-launch` and `loop-state.json`, neither currently wired in loop contract/artifacts).

## 3) Current Composition Map

### 3.1 Skills inventory (LP family)

Current LP-prefixed skills discovered:
`lp-brand-bootstrap`, `lp-do-build`, `lp-channels`, `lp-design-qa`, `lp-design-spec`, `lp-design-system`, `lp-experiment`, `lp-do-fact-find`, `lp-forecast`, `lp-guide-audit`, `lp-guide-improve`, `lp-launch-qa`, `lp-measure`, `lp-offer`, `lp-onboarding-audit`, `lp-do-plan`, `lp-prioritize`, `lp-readiness`, `lp-refactor`, `lp-do-replan`, `lp-seo`, `lp-sequence`, `lp-site-upgrade`.

Evidence: `.claude/skills` listing.

### 3.2 Intended stage routes in `/startup-loop`

`/startup-loop` currently defines:

1. `S1 -> /lp-readiness`
2. `S2B -> /lp-offer`
3. `S3 -> /lp-forecast`
4. `S5 -> /lp-prioritize`
5. `S6 -> /lp-site-upgrade`
6. `S6B -> /lp-channels, /lp-seo, /draft-outreach`
7. `S7 -> /lp-do-fact-find`
8. `S8 -> /lp-do-plan`
9. `S9 -> /lp-do-build`
10. `S9B -> /lp-launch-qa, /lp-design-qa, /lp-measure`
11. `S10 -> /lp-experiment`

Evidence: `.claude/skills/startup-loop/SKILL.md:62`, `.claude/skills/startup-loop/SKILL.md:67`, `.claude/skills/startup-loop/SKILL.md:68`, `.claude/skills/startup-loop/SKILL.md:70`, `.claude/skills/startup-loop/SKILL.md:71`, `.claude/skills/startup-loop/SKILL.md:72`, `.claude/skills/startup-loop/SKILL.md:73`, `.claude/skills/startup-loop/SKILL.md:74`, `.claude/skills/startup-loop/SKILL.md:75`, `.claude/skills/startup-loop/SKILL.md:76`, `.claude/skills/startup-loop/SKILL.md:77`.

## 4) Sequencing Findings (Stage-to-Stage, Skill-to-Skill)

### 4.1 High-severity findings

| ID | Finding | Why it breaks flow | Evidence |
|---|---|---|---|
| SQ-01 | Workflow guide and wrapper skill use different stage graphs | Operators cannot follow one canonical stage progression; automation and human execution will diverge | Workflow table only defines `S0,S1,S1B,S2A,S2,S3,S4,S5,S6,S7,S8,S9,S10` in `docs/business-os/startup-loop-workflow.user.md:69`; wrapper adds `S2B,S6B,S9B` in `.claude/skills/startup-loop/SKILL.md:67`, `.claude/skills/startup-loop/SKILL.md:72`, `.claude/skills/startup-loop/SKILL.md:76` |
| SQ-02 | S1 route mismatch (`idea-readiness` vs `lp-readiness`) | First gate behavior differs depending on which doc the operator follows | Mermaid high-level flow uses `idea-readiness` in `docs/business-os/startup-loop-workflow.user.md:21`; wrapper routes to `/lp-readiness` in `.claude/skills/startup-loop/SKILL.md:63` |
| SQ-03 | Artifact contract mismatch between `lp-offer/lp-channels` and `lp-forecast` | `lp-forecast` cannot reliably consume upstream outputs from nominal prior stages | `lp-offer` writes `docs/business-os/startup-baselines/<BIZ>-offer.md` in `.claude/skills/lp-offer/SKILL.md:26`; `lp-channels` reads/writes same flat convention in `.claude/skills/lp-channels/SKILL.md:36`, `.claude/skills/lp-channels/SKILL.md:156`; `lp-forecast` expects nested paths `.../<BIZ>/S2-offer-hypothesis/` and `.../<BIZ>/S2-channel-selection/` in `.claude/skills/lp-forecast/SKILL.md:47`, `.claude/skills/lp-forecast/SKILL.md:48` |
| SQ-04 | Actual repo shape does not match nested startup-baseline path assumptions | Skills expecting nested baseline directories or `loop-state.json` will fail or require manual workaround | Only flat startup-baseline files currently present (`matching_files=0` for offer/channels/lp-forecast/loop-state pattern; and no subdirs under startup-baselines) from `find docs/business-os/startup-baselines` output; existing files shown in `docs/business-os/startup-baselines` root only |
| SQ-05 | Fact-find handoff filename mismatch into plan/build fast paths | `lp-do-plan` and `lp-do-build` may miss `lp-do-fact-find` output unless user manually points to path | `lp-do-fact-find` output: `docs/plans/<feature-slug>-fact-find.md` in `.claude/skills/lp-do-fact-find/SKILL.md:223`; `lp-do-plan` fast path expects `docs/plans/<slug>-lp-do-fact-find.md` in `.claude/skills/lp-do-plan/SKILL.md:127`; `lp-do-build` optional brief path also uses `-lp-do-fact-find.md` in `.claude/skills/lp-do-build/SKILL.md:66` |
| SQ-06 | BOS persistence contract mismatch at S5 | Workflow requires promoting prioritized items to cards via API, but prioritization skill says no persistence | Workflow sync matrix requires API writes at `S5` in `docs/business-os/startup-loop-workflow.user.md:423`; `lp-prioritize` says "No card creation, no idea persistence" in `.claude/skills/lp-prioritize/SKILL.md:36`, `.claude/skills/lp-prioritize/SKILL.md:160` |
| SQ-07 | Stage-doc naming mismatch for fact-find stage | Stage docs may be written/read under different stage keys (`fact-find` vs `lp-do-fact-find`) causing hidden drift | Workflow BOS matrix uses `stage-docs/:cardId/fact-find` in `docs/business-os/startup-loop-workflow.user.md:424`; `lp-do-fact-find` reads stage `lp-do-fact-find` in `.claude/skills/lp-do-fact-find/SKILL.md:109` |
| SQ-08 | Launch gate depends on non-wired contracts | S9B→S10 may block indefinitely in real use | `lp-launch-qa` expects `docs/business-os/startup-baselines/<BIZ>/loop-state.json` in `.claude/skills/lp-launch-qa/SKILL.md:80`, `.claude/skills/lp-launch-qa/SKILL.md:97`; startup-baselines currently has no such file; skill also routes to `/lp-launch` in `.claude/skills/lp-launch-qa/SKILL.md:41`, `.claude/skills/lp-launch-qa/SKILL.md:596` while wrapper routes S10 to `/lp-experiment` in `.claude/skills/startup-loop/SKILL.md:77` |

### 4.2 Medium-severity findings

| ID | Finding | Why it matters | Evidence |
|---|---|---|---|
| SQ-09 | Prompt-pack does not cover all wrapper stages | Wrapper introduces stages without explicit prompt handoff templates in stage index (`S2B/S4/S6B/S9B`) | Prompt index includes only `S0,S1,S1B,S2A,S3,S5,S10` in `docs/business-os/workflow-prompts/README.user.md:21` |
| SQ-10 | `lp-seo` path contracts don’t match BOS folder topology | SEO artifacts risk landing outside canonical business-os structure | `lp-seo` expects inputs in `docs/business-os/<BIZ>/strategy/...` and outputs to `docs/business-os/<BIZ>/seo/` in `.claude/skills/lp-seo/SKILL.md:47`, `.claude/skills/lp-seo/SKILL.md:48`, `.claude/skills/lp-seo/SKILL.md:37`; actual topology is `docs/business-os/strategy/<BIZ>/...` and no `docs/business-os/<BIZ>/` directory exists (`find docs/business-os -maxdepth 2 -type d`) |
| SQ-11 | Some integration references are stale (`lp-channel`, `lp-content`) | Misnamed dependencies degrade maintainability and can misroute users | `lp-measure` integration references `lp-channel` and `lp-content` in `.claude/skills/lp-measure/SKILL.md:227`, `.claude/skills/lp-measure/SKILL.md:228`; `lp-experiment` does same in `.claude/skills/lp-experiment/SKILL.md:293`, `.claude/skills/lp-experiment/SKILL.md:294` |
| SQ-12 | Stage semantics drift in experiment integration | Feedback loop references inconsistent stage numbers, making loop-level dashboards harder to trust | `lp-experiment` says downstream `lp-prioritize (S3)` in `.claude/skills/lp-experiment/SKILL.md:292`, while workflow table defines prioritization at `S5` in `docs/business-os/startup-loop-workflow.user.md:78` |

## 5) Parallelization Opportunities

### 5.1 Already-available opportunities (not fully exploited)

| ID | Opportunity | Safe parallel shape | Evidence |
|---|---|---|---|
| PX-01 | Forecast + channels split after offer | Run `lp-forecast` and `lp-channels` in parallel immediately after `lp-offer`, then join before `S5` | Explicitly allowed in `.claude/skills/lp-channels/SKILL.md:234` |
| PX-02 | S2 and S6 deep-research packs for existing businesses | After `S2A` becomes `Active`, run market-intelligence and site-upgrade deep-research requests in parallel | Existing-business route currently sequences S2 then S6 (`docs/business-os/startup-loop-workflow.user.md:46`, `docs/business-os/startup-loop-workflow.user.md:47`), but both consume same S2A gate and are independent outputs |
| PX-03 | S6B trio fan-out | After channel strategy is set, run `lp-seo` and `draft-outreach` in parallel while channel owner finalizes GTM calendar | Wrapper groups these at S6B in `.claude/skills/startup-loop/SKILL.md:72` |
| PX-04 | Build execution waves | Keep using `lp-sequence` + `lp-do-plan` + `lp-do-build` wave model to parallelize implementation safely by dependency graph | `lp-do-plan` requires a generated parallelism guide in `.claude/skills/lp-do-plan/SKILL.md:620`; `lp-do-build` enforces sequence freshness in `.claude/skills/lp-do-build/SKILL.md:190`; `lp-do-replan` re-sequences after decomposition in `.claude/skills/lp-do-replan/SKILL.md:593` |
| PX-05 | Multi-item throughput after prioritization | For top 2-3 go items, run separate `lp-do-fact-find` passes in parallel (one card/feature slug each) before converging at planning/build | `lp-prioritize` selects top 2-3 in `.claude/skills/lp-prioritize/SKILL.md:93`; downstream handoff is per-item into `lp-do-fact-find` in `.claude/skills/lp-prioritize/SKILL.md:153` |

### 5.2 Parallelization blockers to fix first

| Blocker | Why it blocks parallel scale |
|---|---|
| Artifact path drift (`offer/channels/forecast`) | Parallel workers won’t find each other’s outputs deterministically. |
| Stage graph drift (`S2B/S6B/S9B` missing in workflow contract) | Operators cannot coordinate branches consistently. |
| Missing `loop-state.json` contract | No shared checkpoint state for QA branches to converge safely. |
| BOS persistence drift at S5 | Parallel fact-finds cannot fan out cleanly without stable card creation/update contract. |

## 6) Proposed Canonical Sequencing Baseline (Tightened)

Recommended canonical loop (single source of truth):

1. `S0` Intake.
2. `S1` Readiness (`lp-readiness` for startup loop, with explicit documented distinction from idea-readiness).
3. `S1B` Measurement bootstrap (mandatory for pre-website).
4. `S2A` Historical baseline (mandatory for website-live).
5. `S2` Deep research market intelligence.
6. `S2B` Offer design (`lp-offer`).
7. Parallel branch:
   - `S3` Forecast (`lp-forecast`)
   - `S6B` Channels/SEO/Outreach (`lp-channels` first, then fan-out)
8. `S4` Baseline merge (consolidate branch outputs to one canonical baseline artifact).
9. `S5` Prioritize + BOS card persistence.
10. `S6` Site-upgrade synthesis (if website scope active; can be precomputed earlier once baseline exists).
11. `S7 -> S8 -> S9` (`lp-do-fact-find -> lp-do-plan -> lp-do-build`).
12. `S9B` QA gates.
13. `S10` Weekly readout/experiments.

## 7) Recommended Fix Order (Minimal-Risk)

1. **Unify stage contract** across wrapper + workflow + prompt pack (`S2B/S6B/S9B` included consistently).
2. **Unify artifact paths** for startup-baselines (`flat` vs `nested`) and update all LP skills to one convention.
3. **Unify fact-find filename convention** (`-fact-find.md` vs `-lp-do-fact-find.md`) in `lp-do-plan` and `lp-do-build`.
4. **Unify BOS stage keys** (`fact-find` vs `lp-do-fact-find`) and persistence responsibilities at S5.
5. **Decide S10 launch primitive** (`/lp-launch` vs `/lp-experiment`) and update `lp-launch-qa` + wrapper accordingly.
6. **Normalize stale integration names** (`lp-channel`, `lp-content`) to existing skills.

## 8) Readiness Verdict

Current LP system status for end-to-end reliable operation:

- **Coverage:** Strong (skills exist for most startup-loop activities).
- **Sequencing integrity:** **At Risk** (high-severity contract drift).
- **Parallelization potential:** High after contract normalization.

Go/No-go for broad operational use:

> **NO-GO for fully automated end-to-end loop** until SQ-01..SQ-08 are resolved.  
> **GO for supervised/manual use** if operators explicitly bridge the known contract gaps.

## 9) External Review Adjudication (Point-by-Point)

This section adjudicates the external expert review against current repo state.

| Point | Verdict | Evidence in repo | Incorporate |
|---|---|---|---|
| 1. Single canonical Loop Spec | **Correct** | Stage contract is duplicated/drifted between workflow guide, wrapper, and skill contracts (SQ-01, SQ-09). | **Yes** |
| 2. Artifact resolver + manifest | **Correct** | Upstream/downstream skills currently disagree on baseline artifact paths (`lp-offer`/`lp-channels` flat vs `lp-forecast` nested). | **Yes** |
| 3. Feature workspace folder (`docs/plans/<slug>/...`) | **Correct** | `lp-do-fact-find`/`lp-do-plan`/`lp-do-build` naming drift exists (`-fact-find.md` vs `-lp-do-fact-find.md`) and causes fast-path ambiguity (SQ-05). | **Yes** |
| 4. Split prioritize vs persist (`lp-bos-sync`) | **Correct** | Workflow requires S5 BOS persistence; `lp-prioritize` explicitly says no persistence (SQ-06). | **Yes** |
| 5. Canonical stage-doc keys + aliases | **Correct** | `fact-find` vs `lp-do-fact-find` naming drift exists in contracts (SQ-07). | **Yes** |
| 6. `loop-state.json` as convergence primitive | **Correct** | `lp-launch-qa` depends on loop-state, but artifact contract is not wired in baseline flow (SQ-08). | **Yes** |
| 7. Decide S10 primitive (`/lp-experiment` vs `/lp-launch`) | **Correct** | Wrapper uses `/lp-experiment`; `lp-launch-qa` still references `/lp-launch` (not implemented) (SQ-08). | **Yes** |
| 8. Automated drift detection (CI linters) | **Correct** | Current drift was detected manually via audit; no contract lint guardrails are present. | **Yes** |
| 9. Explicit fan-out/join barrier (`lp-baseline-merge`) | **Correct** | Parallel opportunities are identified but join semantics are not codified as a skill/contract. | **Yes** |
| 10. Fix `/draft-outreach` gap | **Outdated** | `/draft-outreach` skill now exists and is referenced by wrapper. | **No** (already resolved) |
| 11. Fix order with acceptance criteria | **Correct** | Existing fix order is directionally right but not yet testable as a strict DoD checklist. | **Yes** |

## 10) Incorporated Architecture Amendments

The following amendments are now adopted as the target remediation shape:

1. Add a canonical machine-readable loop contract at `docs/business-os/startup-loop/loop-spec.yaml`.
2. Introduce per-business baseline manifest at `docs/business-os/startup-baselines/<BIZ>/baseline.manifest.json` as a control-plane artifact (single-writer updates only).
3. Move plan-chain canonical outputs to workspace folders:
   - `docs/plans/<slug>/fact-find.md`
   - `docs/plans/<slug>/plan.md`
   - `docs/plans/<slug>/sequence.json`
   - `docs/plans/<slug>/build-log.md`
4. Split S5 responsibilities:
   - `S5A`: `/lp-prioritize` (pure ranking, no side effects).
   - `S5B`: `/lp-bos-sync` (ideas/cards/stage-doc persistence).
5. Standardize stage-doc canonical keys:
   - `S7.fact-find`, `S8.plan`, `S9.build`, `S9B.qa`, `S10.experiment`.
   - Support legacy aliases during migration.
6. Treat run state as an append-only event stream plus derived state view:
   - `runs/<run_id>/events.jsonl` (source of truth)
   - `runs/<run_id>/state.json` (derived)
   - Business-level pointers updated only by single-writer control plane.
7. Make S10 primitive explicit: keep `/lp-experiment` as canonical loop continuation; treat launch as a state transition, not a separate unresolved route.
8. Add contract lint checks to prevent graph/path/reference drift from reappearing.
9. Add an explicit merge barrier skill (`/lp-baseline-merge`) for fan-out/fan-in sequencing.

## 11) Revised Fix Order with Acceptance Criteria

1. **Loop Spec Canonicalization**
   - Done when `docs/business-os/startup-loop/loop-spec.yaml` exists and is authoritative.
   - Done when wrapper stage model and workflow stage table match spec exactly.
   - Done when prompt-pack stage index covers all stages declared in spec.

2. **Artifact Path Normalization + Manifest**
   - Done when stage workers emit stage-owned outputs plus stage result files (data plane).
   - Done when single-writer control plane updates `baseline.manifest.json` and derived state from stage results.
   - Done when baseline-consuming skills resolve inputs from manifest first, with legacy fallback.
   - Done when flat/nested path drift no longer exists in active contracts.

3. **Plan Workspace Canonicalization**
   - Done when `lp-do-fact-find` writes `docs/plans/<slug>/fact-find.md` as canonical output.
   - Done when `lp-do-plan` and `lp-do-build` read canonical workspace paths by default.
   - Done when legacy `-fact-find`/`-lp-do-fact-find` names are supported only as compatibility reads.

4. **S5 Split: Prioritize vs Persist**
   - Done when `/lp-prioritize` remains side-effect free.
   - Done when `/lp-bos-sync` exists and performs BOS API writes for selected items.
   - Done when loop contracts route S5 through both steps explicitly.

5. **Stage-Doc Key Unification**
   - Done when canonical stage-doc keys are declared once (spec).
   - Done when all stage-doc writes use canonical keys.
   - Done when alias reads support existing legacy keys during transition.

6. **Run-State Convergence (run events + derived state)**
   - Done when run event schema is defined and versioned.
   - Done when derived state schema is defined and versioned.
   - Done when branch stages publish result files and control-plane derives deterministic transitions (`Active/Done/Blocked`).
   - Done when launch QA and S10 progression gate on derived run-state rather than ad-hoc file checks.

7. **S10 Primitive Unification**
   - Done when `lp-launch-qa` handoff aligns to canonical S10 route (`/lp-experiment`) or an explicitly implemented launch wrapper.
   - Done when unresolved `/lp-launch` references are removed or replaced with a real skill.

8. **Contract Lint Guardrails**
   - Done when CI checks fail on stage graph mismatch, missing skill references, and non-canonical artifact roots.
   - Done when stale names (for example `lp-channel`, `lp-content`) are blocked by lint.

9. **Parallel Join Barrier (`lp-baseline-merge`)**
   - Done when `/lp-baseline-merge` consumes S2B/S3/S6B branch outputs and writes a single canonical baseline snapshot.
   - Done when S4 cannot complete unless required upstream branch artifacts are present and valid.

## 12) Third-Pass Hardening (Autonomy + Parallel Scale)

Latest external review validates direction and tightens implementation semantics. The core requirement is now explicit:

1. **Data plane:** parallel workers write only stage-owned outputs.
2. **Control plane:** a single writer updates shared pointers and stage transitions.

If this split is violated, contract drift will be replaced by shared-state contention and nondeterministic run behavior.

### 12.1 Additional non-negotiables

1. Runtime-authoritative loop spec (not documentation-only).
2. Single-writer control plane for `manifest`/derived state transitions.
3. Append-only run events as source of truth; state as derived view.
4. Deterministic mechanical join stage (`S4`) with explicit block reasons.
5. Idempotent side-effect boundary (`/lp-bos-sync`).

### 12.2 Recovery and replay semantics (added)

1. Resume by default from last `Done` stage in derived state.
2. Restart only when event-stream integrity is compromised.
3. Partial outputs are not complete unless stage result file is `status: Done`.
4. Recovery actions (`resume`, `restart`, `abort`) must be explicit run events.
5. No hidden cleanup of partial artifacts.

### 12.3 Concurrency policy (added)

Initial policy:

1. One active run per business.

Relaxation gate (all required over rolling window):

1. Median manual interventions <= 1 per run.
2. Shared-state contention incidents = 0.
3. Join-stage race failures = 0.
4. Resume success rate >= 95%.
5. Contract-lint failure rate < 10%.

### 12.4 Controlled-velocity thresholds (added)

Initial stabilization triggers (calibrate after first 20 production-like runs):

1. Manual interventions > 2 per run (rolling median over last 10 runs).
2. Same join-blocking root cause in >= 3 of last 10 runs.
3. Contract-lint failures > 10% over last 20 merges.
4. Replan-loop median > 2 per run over last 10 runs.

When trigger fires: pause expansion work and prioritize control-system hardening.

## 13) Final Position

Architecture verdict after three review passes:

1. Direction is correct and now structurally robust for autonomous scale.
2. Remaining risk is implementation discipline, not design gaps.
3. Highest-leverage implementation rule: preserve data-plane/control-plane separation.

Go/No-go update:

> **NO-GO for unsupervised scale** until single-writer control semantics + event/derived-state model + idempotent `bos-sync` are implemented and validated.  
> **GO for supervised rollout** with controlled-velocity thresholds and explicit recovery semantics.
