---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Repo / Agents
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: do-workflow-process-walkthrough-packets
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build
Related-Analysis: docs/plans/do-workflow-process-walkthrough-packets/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312163000-4A2F
artifact: fact-find
---

# DO Workflow Process Walkthrough Packets Fact-Find Brief

## Outcome Contract

- **Why:** The walkthrough gate fixed a planning-quality blind spot, but it made the markdown artifacts larger. If the handoff packets keep omitting those new process sections, downstream stages will reopen full upstream markdown and lose much of the deterministic token-efficiency gain.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** DO workflow packets carry compact walkthrough/process rows for fact-find, analysis, and plan, and analysis has a deterministic validator so packet-first progressive disclosure remains real after the walkthrough gate.
- **Source:** operator

## Access Declarations

None. All evidence is in the local repository.

## Current Process Map

- Trigger: A process-changing feature enters the DO chain and requires fact-find, analysis, plan, and build handoffs.
- End condition: Downstream stages can read compact process rows from the upstream packet first and only reopen full markdown when packet detail is insufficient or a quoted claim needs verification.

### Process Areas
| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| AREA-01: fact-find -> analysis walkthrough handoff | `lp-do-fact-find` writes `## Current Process Map` in markdown, validates fact-find, generates `fact-find.packet.json`, then `lp-do-analysis` loads the packet first and often still reopens `fact-find.md` for the process map because the packet omits it. | `lp-do-fact-find`, `lp-do-analysis`, `packages/skill-runner`, packet contract | `docs/business-os/startup-loop/contracts/do-stage-handoff-packet-contract.md`; `packages/skill-runner/src/generate-stage-handoff-packet.ts`; `.claude/skills/lp-do-analysis/SKILL.md` | Packet-first policy is partially hollow for process-changing work because the new section is markdown-only. |
| AREA-02: analysis -> plan operating-model handoff | `lp-do-analysis` writes `## End-State Operating Model` in markdown, runs engineering coverage, generates `analysis.packet.json`, then `lp-do-plan` loads the packet and still needs `analysis.md` when the operating-model rows matter. | `lp-do-analysis`, `lp-do-plan`, `packages/skill-runner` | `packages/skill-runner/src/generate-stage-handoff-packet.ts`; `.claude/skills/lp-do-plan/SKILL.md`; `docs/plans/_templates/analysis.md` | The new operating-model gate is not lifted into deterministic packet data. |
| AREA-03: plan -> build delivered-process handoff | `lp-do-plan` writes `## Delivered Processes` in markdown and generates `plan.packet.json`; `lp-do-build` loads the packet for task selection, but the delivered process walkthrough remains only in `plan.md`. | `lp-do-plan`, `lp-do-build`, `packages/skill-runner` | `packages/skill-runner/src/generate-stage-handoff-packet.ts`; `.claude/skills/lp-do-build/SKILL.md`; `docs/plans/_templates/plan.md` | Build can see task briefs but not the compact delivered process map that explains why the plan topology looks the way it does. |
| AREA-04: analysis validation gate | `lp-do-analysis` currently runs `validate-engineering-coverage.sh` for code/mixed work and then emits the packet. There is no `validate-analysis.sh` enforcing core analysis sections like `## End-State Operating Model` or `## Planning Handoff`. | `lp-do-analysis`, `packages/skill-runner`, shell wrappers | `.claude/skills/lp-do-analysis/SKILL.md`; `scripts/validate-fact-find.sh`; `scripts/validate-plan.sh`; `packages/skill-runner/src` | Analysis is the only DO planning-stage artifact without a standalone deterministic validator. |

## Evidence Audit (Current State)

### Entry Points
- `docs/business-os/startup-loop/contracts/do-stage-handoff-packet-contract.md` - canonical packet contract and load-order rules.
- `packages/skill-runner/src/generate-stage-handoff-packet.ts` - deterministic packet builder for fact-find, analysis, and plan.
- `packages/skill-runner/src/stage-handoff-packet-markdown.ts` - helper functions used to extract bounded fields from markdown.
- `.claude/skills/lp-do-analysis/SKILL.md` - analysis-stage validation and packet-generation instructions.
- `docs/agents/feature-workflow-guide.md` - short workflow entrypoint listing deterministic helpers.

### Key Modules / Files
| # | File | Role |
|---|---|---|
| 1 | `packages/skill-runner/src/generate-stage-handoff-packet.ts` | Builds current stage payloads; presently omits the new walkthrough/process sections. |
| 2 | `packages/skill-runner/src/stage-handoff-packet-markdown.ts` | Parses subsections, tables, named fields, and bounded bullet summaries. |
| 3 | `docs/business-os/startup-loop/contracts/do-stage-handoff-packet-contract.md` | Defines required stage payload fields and packet-first progressive disclosure policy. |
| 4 | `.claude/skills/lp-do-analysis/SKILL.md` | Uses packet-first loading but only requires engineering-coverage validation. |
| 5 | `docs/agents/feature-workflow-guide.md` | Lists deterministic workflow helpers; currently names fact-find, plan, engineering coverage, and packet generation only. |
| 6 | `packages/skill-runner/src/validate-fact-find.ts` | Deterministic fact-find validator already enforces `## Current Process Map`. |
| 7 | `packages/skill-runner/src/validate-plan.ts` | Deterministic plan validator already enforces `## Delivered Processes`. |

### Patterns & Conventions Observed
- Packet stage payloads are compact, deterministic extracts from canonical markdown artifacts rather than free-form summaries.
- The new process sections already use table-shaped templates, which is the right deterministic extraction seam.
- DO workflow skills already use packet-first load order and packet generation after validators pass.
- Section validators live in `packages/skill-runner/src/validate-*.ts` with thin CLI files and shell wrappers under `scripts/`.

### Data & Contracts
- Packet contract:
  - Current fact-find stage payload includes `scope_summary`, `analysis_readiness`, and `rehearsal_issues`, but no current-process rows.
  - Current analysis stage payload includes decision and planning-handoff fields, but no end-state operating-model rows.
  - Current plan stage payload includes `task_briefs` and `next_runnable_task_ids`, but no delivered-process rows.
- Validation contracts:
  - `scripts/validate-fact-find.sh` -> `packages/skill-runner/src/cli/validate-fact-find.ts`
  - `scripts/validate-plan.sh` -> `packages/skill-runner/src/cli/validate-plan.ts`
  - No `scripts/validate-analysis.sh` exists.

### Dependency & Impact Map
- Upstream dependencies:
  - Fact-find, analysis, and plan templates already shape the new process sections as tables.
  - `markdown.ts` / `stage-handoff-packet-markdown.ts` already provide enough parsing primitives.
- Downstream dependents:
  - `lp-do-analysis`, `lp-do-plan`, and `lp-do-build` all rely on packet-first progressive disclosure guidance.
  - `docs/agents/feature-workflow-guide.md` is the short-form workflow reference for deterministic helper commands.
- Likely blast radius:
  - `packages/skill-runner`
  - workflow contract doc
  - analysis skill + feature workflow guide
  - new plan slug packets/build record

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | Workflow/process change only | - | - |
| UX / states | Required | Packet-first loading exists, but process topology still falls back to full markdown for walkthrough sections | Progressive disclosure is less effective than claimed | Compare options that preserve packet-first as default |
| Security / privacy | Required | Packet content is repo-local and source-derived | New process-row fields must stay bounded and deterministic | Keep extraction table-driven |
| Logging / observability / audit | Required | Workflow telemetry can already record packet paths | No direct signal yet that process rows are packetized | Carry packet/regeneration proof into build |
| Testing / validation | Required | Fact-find and plan have deterministic validators; analysis does not | Missing analysis validator leaves new section as a soft gate | Add `validate-analysis` as explicit build scope |
| Data / contracts | Required | Packet contract owns stage payload semantics | Contract currently lags the new walkthrough sections | Extend contract and generator together |
| Performance / reliability | Required | Templates already offer compact table structures for process sections | If omitted from packets, downstream stages reopen full markdown | Use compact row extraction, not prose copy |
| Rollout / rollback | Required | Packet sidecars and validators are additive | Historical analyses will not auto-backfill validator status without rerun | Keep rollout additive and fail-closed only for new/edited analyses |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The change is bounded to one packet contract, one packet generator, one new validator family, and the corresponding workflow docs/skills. The process sections are already table-shaped, so this is a deterministic extraction lift rather than a fresh information architecture project.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Packet contract | Yes | None | No |
| Packet generator extraction seam | Yes | None - existing table parsers are sufficient for the new sections | No |
| Analysis validation seam | Yes | [Testing / validation] [Moderate]: analysis has no dedicated deterministic validator | Yes |
| Workflow guide / skill references | Yes | [UX / states] [Moderate]: short-form docs still list no analysis validator | Yes |
| Build proof artifact chain | Yes | None - new slug can emit packets and validation evidence like earlier DO workflow features | No |

## Confidence Inputs

| Dimension | Score | Evidence |
|---|---|---|
| Implementation | 88% | Packet generator and validator patterns already exist in the same package. |
| Approach | 90% | The process sections are already table-driven, making deterministic extraction the cleanest lift. |
| Impact | 85% | The change should materially reduce needless markdown reopens for process-changing features, though exact savings still depend on stage behavior. |
| Delivery-Readiness | 87% | All touched files and integration seams are identified. |
| Testability | 82% | Typecheck/lint plus artifact validators and packet generation commands provide deterministic proof without local Jest runs. |

- **What raises to >=80:** Already at 80%+ on all dimensions.
- **What raises to >=90:** A measured follow-up showing reduced upstream markdown loads or lower context bytes in workflow telemetry for process-changing features.

## Risks

1. **Packet bloat** (Low) - if process sections are copied as prose instead of rows. Mitigation: extract tables and named fields only.
2. **Validator drift** (Medium) - if `validate-analysis.sh` checks different sections than the skill/template expect. Mitigation: use the same section names already present in the analysis skill and template.
3. **False confidence from packet availability** (Low) - some stages will still need full markdown for path-specific evidence. Mitigation: preserve the existing packet-first, not packet-only, rule.

## Open Questions

None.

## Evidence Gap Review

### Gaps Addressed
- Verified the packet contract exists and already defines stage payload requirements.
- Verified the generator already parses summaries, tables, named fields, and task blocks.
- Verified fact-find and plan validators exist and analysis lacks one.
- Verified the new process sections are already present in templates/skills as table-structured sections.

### Confidence Adjustments
- None.

### Remaining Assumptions
- Historical artifacts without the new packet fields remain valid; only regenerated packets gain the new rows.
- Typecheck/lint plus deterministic validators are sufficient proof for this workflow/tooling change.

## Scope

### Summary

Add compact walkthrough/process-row extraction to DO stage handoff packets for fact-find, analysis, and plan. Add a deterministic analysis validator and wire the workflow docs/skill references to require it before packet emission. Persist a new feature slug with packet sidecars and validation evidence proving the path end-to-end.

### Goals
- Lift the new walkthrough/process sections into packet fields without copying full prose
- Add a standalone deterministic validator for analysis
- Prove the new path with regenerated sidecars and validation evidence

### Non-goals
- Telemetry redesign beyond existing workflow-step recording
- Replacing canonical markdown artifacts
- A separate runtime handoff system

- Constraints:
  - packet fields must stay compact and source-derived
  - markdown fallback must remain available when packet detail is insufficient
- Assumptions:
  - the current walkthrough tables are stable extraction seams
  - targeted validators plus typecheck/lint are enough proof for this increment

## Analysis Readiness

- **Status:** Ready for analysis
- **Rationale:** The generator, contract, validator, and workflow-doc seams are all identified, and the main decision is now whether to solve the packet omission and the analysis validation gap together or separately.
- **Blocking items:** None
- **Recommended analysis focus:** Choose the smallest coherent change set that keeps the walkthrough gate token-efficient: packetize the process sections and add the analysis validator in the same increment.
