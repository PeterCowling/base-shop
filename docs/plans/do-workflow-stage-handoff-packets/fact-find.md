---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Repo / Agents
Workstream: Engineering
Created: "2026-03-11"
Last-updated: "2026-03-11"
Feature-Slug: do-workflow-stage-handoff-packets
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build, lp-do-critique
Related-Analysis: docs/plans/do-workflow-stage-handoff-packets/analysis.md
Trigger-Source: "direct-operator-decision: implement bounded stage handoff packets to reduce DO workflow token overhead"
Trigger-Why: The workflow now measures real token usage and shows that repeated stage-shell and thread carryover dominate cost, especially between analysis and plan.
Trigger-Intended-Outcome: "type: operational | statement: Add deterministic stage handoff packets so downstream DO stages can load bounded structured sidecars first, escalate to full upstream markdown only when needed, and preserve engineering coverage expectations across the whole workflow. | source: operator"
artifact: fact-find
---

# DO Workflow Stage Handoff Packets Fact-Find Brief

## Scope
### Summary
Add canonical bounded packet sidecars for `fact-find`, `analysis`, and `plan`, then update the DO skills and contracts so downstream stages load those packets first instead of dragging full upstream artifacts and thread carryover by default.

### Goals
- cut cross-stage context weight without losing determinism,
- move this reduction into code plus one canonical contract instead of repeated skill prose,
- preserve full-spectrum engineering coverage obligations while tightening progressive disclosure.

### Non-goals
- changing the ideas queue routing model,
- replacing the markdown artifacts as the source of truth,
- solving all remaining token overhead in one pass.

### Constraints & Assumptions
- Constraints:
  - the packet must be derived from the markdown artifact, not from fresh model summarization,
  - packets must stay bounded and stable across repeated generation,
  - downstream stages still need an explicit escape hatch to load the full upstream artifact.
- Assumptions:
  - `packages/skill-runner` is the right home for deterministic packet extraction,
  - `fact-find.md`, `analysis.md`, and `plan.md` already carry enough structured headings to extract compact handoff data,
  - workflow telemetry can treat packet files as ordinary `--input-path` artifacts when they are genuinely loaded.

## Outcome Contract

- **Why:** The workflow now measures real token usage and shows that repeated stage-shell and thread carryover dominate cost, especially between analysis and plan.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add deterministic stage handoff packets so downstream DO stages can load bounded structured sidecars first, escalate to full upstream markdown only when needed, and preserve engineering coverage expectations across the whole workflow.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `docs/plans/do-workflow-runtime-token-capture/build-record.user.md` - latest measured workflow summary shows very high input-token cost relative to explicit context bytes.
- `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl` - stage-by-stage workflow-step records show analysis and plan carry disproportionate input-token cost.
- `docs/business-os/startup-loop/contracts/loop-output-contracts.md` - canonical markdown artifact contract but no bounded handoff sidecar yet.
- `.claude/skills/lp-do-analysis/SKILL.md` - analysis currently reads `fact-find.md` directly and records that markdown path in telemetry.
- `.claude/skills/lp-do-plan/SKILL.md` - plan currently reads `analysis.md` and `fact-find.md` directly with no compact sidecar.
- `.claude/skills/lp-do-build/SKILL.md` - build assumes the full `plan.md`/`analysis.md` context path.
- `packages/skill-runner/src/markdown.ts` - deterministic parser helpers already exist for sections, task blocks, and frontmatter.
- `scripts/validate-fact-find.sh` - validator seam where packet generation can be inserted without adding new stage-specific shell logic.

### Key Findings
- The worst measured token sink is hidden carryover, not explicit loaded file bytes.
- The current workflow has no canonical sidecar artifact that lets a stage read compact upstream state first.
- The existing markdown structure is regular enough to support deterministic packet extraction.
- Engineering coverage is already a cross-stage contract, so the packet should carry that obligation forward rather than treating performance work as a special case.

## Engineering Coverage Matrix
| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | workflow/process change only | no user-facing UI | N/A: process-only |
| UX / states | Required | current workflow guide and skill docs are stage-oriented but still assume full upstream markdown | packet-first loading could become vague or inconsistent unless one contract owns it | compare docs-only guidance vs canonical packet contract + generator |
| Security / privacy | Required | packet content will be derived from repo docs only | sidecars must not invent or leak new data | keep packet content strictly source-derived |
| Logging / observability / audit | Required | workflow telemetry already records `--input-path` artifacts | packet loads must be recorded explicitly when used | include packet paths in telemetry guidance |
| Testing / validation | Required | `skill-runner` typecheck/lint and artifact validators already exist | new generator needs targeted validation and real packet outputs | add deterministic generator + validate via real feature slug |
| Data / contracts | Required | loop-output contract defines markdown artifacts only | no contract yet for `*.packet.json` sidecars | add one canonical stage-handoff packet contract |
| Performance / reliability | Required | measured DO token usage already exists | without bounded packets, each stage keeps rereading more than it needs | choose compact packet fields and on-demand markdown escalation |
| Rollout / rollback | Required | sidecars can be additive next to markdown artifacts | packet-first loading could drift unless skills are updated together | ship generator, contract, and skill changes in one feature |

## Confidence Inputs
- Implementation: 90% - the extraction seam is deterministic and already has the required parser primitives.
- Approach: 91% - packet sidecars directly attack the measured cost source better than more markdown trimming alone.
- Impact: 87% - packets will reduce explicit context load and make fresh-stage resets realistic, though they do not erase all system/thread overhead by themselves.

## Analysis Readiness
- Ready: Yes
- Recommended next step: `lp-do-analysis`
- Rationale:
  - the decision is about the right bounded handoff mechanism, not whether the telemetry evidence is real,
  - operator-only input is not required,
  - the implementation surface is limited to `skill-runner`, workflow docs, and persisted workflow artifacts.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Packet extraction seam | Yes | None | No |
| Canonical contract ownership | Partial | [Moderate] packet semantics could drift if the contract is repeated in multiple skill files | Yes |
| Build-stage packet use | Partial | [Moderate] build still needs the full task block on demand, so packet-first cannot mean packet-only | Yes |

