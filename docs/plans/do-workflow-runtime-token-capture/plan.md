---
Type: Plan
Status: Complete
Domain: Repo / Agents
Workstream: Engineering
Created: "2026-03-11"
Last-reviewed: "2026-03-11"
Last-updated: "2026-03-11"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: do-workflow-runtime-token-capture
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build, lp-do-critique
Overall-confidence: 89%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/do-workflow-runtime-token-capture/analysis.md
artifact: plan
---

# DO Workflow Runtime Token Capture Plan

## Summary
Extend workflow-step telemetry so Codex-backed DO runs auto-capture real token usage from runtime session metadata, store feature-scoped runtime snapshot provenance, support Claude when an explicit Claude session id is supplied, and prove the flow through a full persisted DO artifact chain.

## Active tasks
- [x] TASK-01: Add provider-aware runtime token helper and integrate automatic Codex capture into the workflow-step recorder
- [x] TASK-02: Update schema, workflow docs, and stage skill guidance for Codex auto-capture, `lp-do-ideas` baselines, and Claude explicit-session semantics
- [x] TASK-03: Persist workflow artifacts, record real telemetry for this slug, and validate the end-to-end token summary

## Goals
- move token coverage from inferred/empty to real on Codex-backed runs,
- keep token capture out of the prompt path,
- make provider boundaries explicit rather than ambiguous.

## Non-goals
- automatic Claude token capture,
- changing ideas queue semantics,
- collecting more telemetry than is required for stage-level deltas.

## Inherited Outcome Contract
- **Why:** The workflow telemetry layer now records context and module cost, but the token fields still sit at 0% coverage because they are not populated from runtime metadata.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Auto-capture real workflow token usage for Codex-backed DO stages, keep the prompt path untouched, and support Claude when a concrete session-usage source is supplied while preserving manual fallback otherwise.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/do-workflow-runtime-token-capture/analysis.md`
- Selected approach inherited:
  - Codex auto-capture via current-session log discovery,
  - feature baseline at `lp-do-ideas`,
  - explicit-session Claude support with manual/unknown fallback when that seam is absent.

## Selected Approach Summary
- What was chosen:
  - add a bounded local helper that resolves Codex session logs from `CODEX_THREAD_ID`,
  - compute later-stage token counts from cumulative-total deltas,
  - store runtime snapshot provenance additively in the workflow-step record.
- Why planning did not reopen alternatives:
  - analysis already rejected unsafe implicit Claude discovery and manual-only capture.

## Engineering Coverage
| Coverage Area | Planned handling | Task ownership |
|---|---|---|
| UI / visual | N/A: process-only change | TASK-02 |
| UX / states | stage summaries should show real token coverage and explicit provider gaps | TASK-01, TASK-03 |
| Security / privacy | store provider/session IDs and numeric totals only | TASK-01 |
| Logging / observability / audit | extend workflow-step records with runtime snapshot provenance | TASK-01, TASK-03 |
| Testing / validation | add temp-log fixtures plus targeted TS/lint/artifact validation | TASK-01, TASK-03 |
| Data / contracts | schema/doc updates are additive and discriminated | TASK-02 |
| Performance / reliability | bounded tail scan and feature-delta logic, fail-open fallback | TASK-01 |
| Rollout / rollback | Codex path auto-on, Claude explicit-session support optional, commands unchanged apart from the opt-in flag | TASK-02, TASK-03 |

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Tasks

### TASK-01: Runtime token helper and recorder integration
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `scripts/src/startup-loop/ideas/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `scripts/src/startup-loop/ideas/workflow-runtime-token-usage.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 91% - current Codex session logs expose both cumulative and latest-response usage.
  - Approach: 91% - provider-aware auto-capture plus fail-open fallback fits the current recorder seam cleanly.
  - Impact: 89% - Codex-backed runs gain real token coverage immediately.
- **Acceptance:**
  - recorder can resolve current Codex session usage via `CODEX_THREAD_ID`,
  - first feature-stage record uses latest-response fallback when no prior baseline exists,
  - later feature-stage records use cumulative-total deltas from the prior feature record.
- **Engineering Coverage:**
  - UI / visual: N/A - no user-facing UI
  - UX / states: Required - stage summaries must show real token coverage
  - Security / privacy: Required - no home-dir paths persisted
  - Logging / observability / audit: Required - snapshot provenance fields recorded
  - Testing / validation: Required - temp-log fixture coverage plus TS/lint
  - Data / contracts: Required - additive runtime snapshot metadata
  - Performance / reliability: Required - bounded tail scan, fail-open fallback
  - Rollout / rollback: Required - additive helper only
- **Validation contract (TC-01):**
  - TC-01: first stage records `last_response_fallback`
  - TC-02: later stage records `delta_from_previous_feature_record`
  - TC-03: existing recorder/reporter path still compiles cleanly
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `pnpm exec tsc -p scripts/tsconfig.json --noEmit`, targeted ESLint
  - Validation artifacts: runtime token helper + updated telemetry test
  - Unexpected findings: none
- **Edge Cases & Hardening:** no stable session seam must fail open to `unknown`, not fail closed
- **What would make this >=90%:**
  - a second independent Codex-backed feature run with the same delta behavior

### TASK-02: Contract and workflow guidance update
- **Type:** IMPLEMENT
- **Deliverable:** docs/skill updates
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md`, `docs/agents/feature-workflow-guide.md`, `.claude/skills/lp-do-ideas/SKILL.md`, `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-analysis/SKILL.md`, `.claude/skills/lp-do-plan/SKILL.md`, `.claude/skills/lp-do-build/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 88%
  - Implementation: 89% - schema and stage instructions are already centralized.
  - Approach: 90% - provider-boundary wording is clearer than implicit partial support.
  - Impact: 88% - future runs will know exactly when token auto-capture should appear.
- **Acceptance:**
  - schema documents runtime snapshot provenance and delta/fallback semantics,
  - workflow guide includes `lp-do-ideas` baseline recording,
  - stage skills explain Codex auto-capture and Claude explicit-session support/fallback.
- **Engineering Coverage:**
  - UI / visual: N/A - no user-facing UI
  - UX / states: Required - operators understand why Codex and Claude differ
  - Security / privacy: Required - docs reinforce minimal persisted metadata
  - Logging / observability / audit: Required - runtime snapshot provenance described
  - Testing / validation: Required - commands and expectations stay deterministic
  - Data / contracts: Required - schema version bump and additive fields
  - Performance / reliability: Required - bounded scan and fail-open behavior documented
  - Rollout / rollback: Required - stage-local adoption path clear
- **Validation contract (TC-02):**
  - TC-01: schema doc includes runtime token fields and invariants
  - TC-02: workflow guide and skill docs mention Codex auto-capture and Claude explicit-session support/fallback
  - TC-03: `lp-do-ideas` stage is listed as a valid telemetry stage
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: diff review and artifact validation
  - Validation artifacts: updated docs/skill files
  - Unexpected findings: none
- **Edge Cases & Hardening:** do not overclaim Claude support

### TASK-03: End-to-end proof for the new token path
- **Type:** IMPLEMENT
- **Deliverable:** persisted workflow artifact set plus recorded telemetry lines and summary
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-11)
- **Affects:** `docs/plans/do-workflow-runtime-token-capture/fact-find.md`, `docs/plans/do-workflow-runtime-token-capture/analysis.md`, `docs/plans/do-workflow-runtime-token-capture/plan.md`, `docs/plans/do-workflow-runtime-token-capture/build-record.user.md`, `docs/plans/do-workflow-runtime-token-capture/critique-history.md`, `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 89%
  - Implementation: 90% - the recorder/reporter are deterministic once the helper exists.
  - Approach: 89% - `lp-do-ideas` baseline plus later deltas fits the intended stage sequence.
  - Impact: 89% - this run should show non-zero token coverage with explicit provider gaps.
- **Acceptance:**
  - the slug has a full fact-find -> analysis -> plan -> build-record chain,
  - real workflow-step telemetry is recorded for the current session,
  - the build-record summary shows non-zero token measurement coverage.
- **Engineering Coverage:**
  - UI / visual: N/A - no user-facing UI
  - UX / states: Required - report shows stage coverage and provider gaps
  - Security / privacy: Required - summary contains numeric usage only
  - Logging / observability / audit: Required - real snapshot-backed workflow-step lines recorded
  - Testing / validation: Required - validators and recorder/reporter commands pass
  - Data / contracts: Required - build record aligns with schema and summary output
  - Performance / reliability: Required - missing context paths remain zero and recorder stays append-only
  - Rollout / rollback: Required - current run proves the additive path
- **Validation contract (TC-03):**
  - TC-01: fact-find/plan/engineering coverage validators pass for this slug
  - TC-02: recorder commands append the expected stage records
  - TC-03: reporter returns a slug-level summary with token coverage above 0%
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: validators, TS/lint, recorder/report commands
  - Validation artifacts: build-record telemetry summary + telemetry JSONL lines
  - Unexpected findings: none
- **Edge Cases & Hardening:** first stage may still use fallback mode even when later stages use exact deltas

## Parallelism Guide
- Wave 1: TASK-01
- Wave 2: TASK-02
- Wave 3: TASK-03

## Validation Contracts
- TC-01: runtime token helper and recorder compile and lint cleanly
- TC-02: workflow docs and skills document the correct provider boundary
- TC-03: the persisted workflow artifact set validates and reports non-zero token coverage

## Open Decisions
None for this change. Claude automatic capture is limited to explicit session-id mode; implicit current-session discovery remains out of scope.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01 | Yes | None | No |
| TASK-02 | Yes | None | No |
| TASK-03 | Yes | None | No |

## Decision Log
- 2026-03-11: chose Codex automatic capture now and Claude support only behind an explicit session-id seam instead of guessing Claude's active session from ambient history.
- 2026-03-11: added `lp-do-ideas` as the feature baseline stage for token-delta measurement.
