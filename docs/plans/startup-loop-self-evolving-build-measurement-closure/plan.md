---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-self-evolving-build-measurement-closure
Dispatch-ID: IDEA-DISPATCH-20260314202652-0001
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/startup-loop-self-evolving-build-measurement-closure/analysis.md
artifact: plan
---

# Startup Loop Self-Evolving Build Measurement Closure Plan

## Summary
The self-evolving runtime already has a verified-measurement closure path, but the canonical build workflow still cannot supply it. This plan closes that seam first by adding a structured self-evolving measurement block to `build-record.user.md`, teaching `startup-loop:queue-state-complete` to auto-extract it from the adjacent build record, and documenting the workflow so proof-bearing builds can become observed outcomes instead of stalling as pending or censored. A second tranche remains for live proof adoption and proof-debt reporting once the bridge is in place.

## Active tasks
- [ ] TASK-02: Surface proof-debt follow-through in self-evolving reporting and first live proof-bearing build usage

## Goals
- Give `lp-do-build` a canonical place to store verified self-evolving measurement proof.
- Make queue completion auto-ingest that proof without manual CLI field assembly.
- Preserve current behavior for builds with no verified proof.

## Non-goals
- Container experiment-hook redesign.
- Broad promotion-gate or scoring changes.
- Historical proof backfill.

## Constraints & Assumptions
- Constraints:
  - The build record remains the canonical operator-facing completion artifact.
  - Queue completion must not require new manual flags in the default path.
  - Local Jest remains out of scope.
- Assumptions:
  - The first bounded slice should close the build-output proof seam before adding new reporting or policy layers.
  - Later proof-debt reporting can build on the contract introduced here rather than inventing a new source.

## Inherited Outcome Contract
- **Why:** Finished self-improving work can already close with verified measurement in queue completion, but lp-do-build still has no canonical place to put that proof, so most completed self-evolving work matures without observed evidence and promotion keeps stalling.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Finished self-evolving builds can carry a canonical verified-measurement block in build-record.user.md, and queue-state completion automatically converts that block into verified self-evolving outcome closure.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/startup-loop-self-evolving-build-measurement-closure/analysis.md`
- Selected approach inherited:
  - Add a canonical `## Self-Evolving Measurement` section to `build-record.user.md`.
  - Auto-extract that section during queue completion using the existing `--plan-path`.
- Key reasoning used:
  - The runtime already supports verified proof closure once the measurement payload exists.
  - Build-output contract alignment is lower-risk and more accretive than adding manual flags or a parallel proving runtime.

## Selected Approach Summary
- What was chosen:
  - Contract-first build proof closure via build-record section plus queue completion auto-extraction.
- Why planning is not reopening option selection:
  - The analysis already eliminated manual-flag and new-runtime alternatives on workflow-friction and duplication grounds.

## Fact-Find Support
- Supporting brief: `docs/plans/startup-loop-self-evolving-build-measurement-closure/fact-find.md`
- Evidence carried forward:
  - Queue completion already writes verified self-evolving observations and lifecycle events.
  - Build-record and build workflow docs are the missing proof carrier.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add the canonical build-record self-evolving measurement contract and auto-extract it during queue completion | 89% | M | Complete (2026-03-14) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Surface proof-debt follow-through in self-evolving reporting and land the first live proof-bearing build usage pattern | 84% | M | Pending | TASK-01 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A | None | No UI surface |
| UX / states | Preserve current pending path; fail closed only for malformed declared proof | TASK-01 | Optional section remains safe when absent |
| Security / privacy | N/A | None | No secret or PII contract change |
| Logging / observability / audit | Use build-record as canonical proof source and keep lifecycle writes additive | TASK-01, TASK-02 | TASK-02 extends reporting visibility |
| Testing / validation | Add focused queue completion regression coverage and targeted static validation | TASK-01 | No local Jest execution |
| Data / contracts | Extend build-record contract/template to match runtime proof payload | TASK-01 | Contract and parser land together |
| Performance / reliability | Keep extraction local to adjacent build-record file and fail-open on absence | TASK-01 | Small bounded read path |
| Rollout / rollback | Additive docs/template/parser; revertable if needed | TASK-01 | No data migration |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Contract and parser must land together |
| 2 | TASK-02 | TASK-01 | Reporting/adoption should build on the canonical bridge |

## Delivered Processes
| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Proof-bearing self-evolving build closure | A completed self-evolving build reaches `startup-loop:queue-state-complete` | 1. Build writes `build-record.user.md`. 2. When verified proof exists, build-record includes `## Self-Evolving Measurement`. 3. Queue completion resolves the adjacent build-record from `--plan-path`. 4. Valid `Status: verified` proof is converted into verified observation plus lifecycle outcome closure. 5. Missing section or `Status: none` preserves existing pending/missing path. | TASK-01 | TASK-02 still needs stronger reporting and first live adoption evidence |

## Tasks

### TASK-01: Add the canonical build-record self-evolving measurement contract and auto-extract it during queue completion
- **Type:** IMPLEMENT
- **Deliverable:** additive build-record contract/template plus queue completion auto-extraction and focused regression coverage
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Affects:** `docs/plans/_templates/build-record.user.md`, `docs/business-os/startup-loop/contracts/loop-output-contracts.md`, `.claude/skills/lp-do-build/SKILL.md`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-state-completion.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 89%
  - Implementation: 89% - the parser and contract seams are narrow and already grounded in the runtime payload type.
  - Approach: 90% - artifact-first extraction is the lowest-friction path.
  - Impact: 92% - this is the first point where finished work can become observed proof instead of pending closure debt.
- **Acceptance:**
  - `build-record.user.md` has a canonical `## Self-Evolving Measurement` section.
  - `startup-loop:queue-state-complete` auto-reads that section from the adjacent build-record when present.
  - Missing section preserves current behavior; malformed declared proof returns a parse error.
  - Focused queue completion tests cover valid and malformed proof extraction.
- **Engineering Coverage:**
  - UI / visual: N/A - no UI surface changes.
  - UX / states: Required - missing proof stays fail-open, but malformed declared proof fails closed.
  - Security / privacy: N/A - no new secret or privacy handling.
  - Logging / observability / audit: Required - build-record becomes the canonical proof source and queue completion keeps lifecycle writes additive.
  - Testing / validation: Required - focused queue completion regression coverage plus targeted typecheck/eslint.
  - Data / contracts: Required - build-record contract/template and queue completion parser must stay aligned with `SelfEvolvingMeasurementInput`.
  - Performance / reliability: Required - parser only reads the adjacent build-record and does nothing when the section is absent.
  - Rollout / rollback: Required - additive contract/parser change with straightforward revert path.
- **Validation contract (TC-01):**
  - TC-01: a self-evolving completion with a valid build-record proof block closes as `measurement_status: verified`.
  - TC-02: a malformed declared proof block returns `parse_error` and does not mutate queue state.
  - TC-03: touched scripts files pass targeted TypeScript and eslint validation.
- **Build Evidence (2026-03-14):**
  - Added a canonical `## Self-Evolving Measurement` section to the build-record template and formalized it in loop output contracts and `lp-do-build` workflow guidance.
  - `lp-do-ideas-queue-state-completion.ts` now resolves the adjacent `build-record.user.md` from `--plan-path`, parses the optional self-evolving measurement block, and passes verified proof into the existing closure writer automatically.
  - Focused regression coverage now proves both successful auto-extracted verification and fail-closed behavior for malformed declared proof.

### TASK-02: Surface proof-debt follow-through in self-evolving reporting and land the first live proof-bearing build usage pattern
- **Type:** IMPLEMENT
- **Deliverable:** reporting and adoption follow-through showing which proof-bearing builds still stall and a first documented live usage pattern for the new bridge
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`, `docs/business-os/startup-loop/self-evolving/BRIK/*`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 82% - report surfaces and live adoption evidence need careful scoping.
  - Approach: 85% - once the bridge exists, the next leverage is making proof debt visible and using it on a real build.
  - Impact: 86% - turns the contract from capability to operating behavior.
- **Acceptance:**
  - Reporting distinguishes containers blocked by missing experiment hook from builds blocked by missing proof-bearing build records.
  - At least one live self-evolving build path is documented using the new build-record proof section.
- **Engineering Coverage:**
  - UI / visual: N/A - no UI scope.
  - UX / states: Required - reporting must separate missing experiment-hook blockers from missing proof-bearing build blockers clearly.
  - Security / privacy: N/A - no credential or personal-data expansion expected.
  - Logging / observability / audit: Required - report and dashboard outputs must make proof debt visible.
  - Testing / validation: Required - follow-on report/dataset checks will need focused coverage.
  - Data / contracts: Required - reporting must consume the new proof-bearing closure state without inventing parallel labels.
  - Performance / reliability: Required - report additions must stay additive to current self-evolving pipelines.
  - Rollout / rollback: Required - reporting changes should be reversible without changing stored proof data.

## Validation Contracts
- `TC-01` (TASK-01): valid build-record proof block yields verified self-evolving closure.
- `TC-02` (TASK-01): malformed declared proof block fails queue completion with `parse_error`.
- `TC-03` (TASK-01): `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit` and targeted `eslint` pass on touched scripts files.

## Risks & Mitigations
- A build could include a partially filled proof block and accidentally block completion.
  - Mitigation: only the declared block (`Status: verified`) is fail-closed; absent or `Status: none` remains safe.
- The bridge could remain unused even after landing.
  - Mitigation: TASK-02 explicitly targets reporting plus first live adoption.

## Observability
- Logging:
  - Queue completion parse errors now surface malformed declared proof instead of silently degrading.
- Metrics:
  - Existing `measurement_status` and evaluation status fields remain the canonical downstream metrics.
- Alerts/Dashboards:
  - TASK-02 will expose proof-debt follow-through in self-evolving reports.

## Acceptance Criteria (overall)
- [x] Build outputs have a canonical self-evolving verified-measurement section.
- [x] Queue completion can auto-ingest that section from the adjacent build-record.
- [x] Missing proof remains backwards compatible; malformed declared proof fails closed.
- [ ] Reporting and first live adoption follow-through are landed.

## Decision Log
- 2026-03-14: Chose build-record auto-extraction over manual queue-completion flags or a new proving runtime.

## Open Decisions
- None.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: contract + parser bridge | Yes | None | No |
| TASK-02: reporting + live adoption follow-through | Partial | No live proof-bearing build usage documented yet | Yes |

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
