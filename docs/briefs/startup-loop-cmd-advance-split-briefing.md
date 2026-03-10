---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: Platform
Created: 2026-03-09
Last-updated: 2026-03-09
Topic-Slug: startup-loop-cmd-advance-split
---

# Startup-Loop `cmd-advance` Split Briefing

## Executive Summary
`/startup-loop advance` is routed through a single markdown module, [`cmd-advance.md`](/Users/petercowling/base-shop/.claude/skills/startup-loop/modules/cmd-advance.md), and that file now carries 535 lines of mixed gate definitions, dispatch instructions, sync rules, and failure-packet conventions. The P1 concern is real: the file is the only startup-loop module above the advisory threshold, and it concentrates 15 independently editable rule blocks in one place.

The safest split is not a rename or relocation. Current routing, tests, and contract guards all read the stable path `modules/cmd-advance.md` directly, so the low-risk path is to keep that file as the entrypoint and move stage-family detail into subordinate modules.

The deeper maintenance risk is not line count alone. SELL gate logic is already duplicated in executable TypeScript, which means a markdown-only split could shrink the file without reducing true drift risk.

## Questions Answered
- Q1: What does `cmd-advance.md` currently own?
- Q2: Are there natural split seams inside the file?
- Q3: What other files couple to the current path and content?
- Q4: Is any of this logic already extracted elsewhere?
- Q5: What change shape looks safe if this is split later?

## High-Level Architecture
- Components:
  - `.claude/skills/startup-loop/SKILL.md:36-51` routes `/startup-loop advance` to `modules/cmd-advance.md` and lists only one internal helper today: `assessment-intake-sync.md`.
  - `.claude/skills/startup-loop/modules/cmd-advance.md:1-535` is the advance-time rules surface.
  - `.claude/skills/startup-loop/modules/assessment-intake-sync.md:1-5` is the only existing internal submodule called from `cmd-advance`.
  - `scripts/src/startup-loop/s6b-gates.ts:1-193` contains executable SELL gate logic that overlaps with markdown gate definitions.
- Data stores / external services:
  - Filesystem artifacts under `docs/business-os/strategy/<BIZ>/...` and `docs/business-os/startup-baselines/<BIZ>/...` are the dominant gate inputs.
  - No external service call path was found inside `cmd-advance.md`; it is filesystem-first guidance plus orchestration text.

## End-to-End Flow
### Primary flow
1. `startup-loop/SKILL.md` resolves the command and tells the operator wrapper to load `modules/cmd-advance.md` for `/startup-loop advance`.
   - Evidence: `.claude/skills/startup-loop/SKILL.md:36-45`
2. `cmd-advance.md` applies stage-specific gate families:
   - ASSESSMENT gates at lines 19-174
   - MARKET/PRODUCT/WEBSITE gates at lines 175-253
   - SIGNALS dispatch/gates at lines 254-310
   - SELL gates + secondary dispatch at lines 311-388
   - gap-fill gates at lines 389-494
   - sync/failure/operator contract at lines 495-535
   - Evidence: `.claude/skills/startup-loop/modules/cmd-advance.md:19-535`
3. When ASSESSMENT-09 passes, `cmd-advance.md` delegates to the internal intake sync module rather than inlining that write logic.
   - Evidence: `.claude/skills/startup-loop/modules/cmd-advance.md:120-123`
   - Evidence: `.claude/skills/startup-loop/modules/assessment-intake-sync.md:1-5`
4. The command is expected to return the standard run packet defined in `startup-loop/SKILL.md`, so `cmd-advance.md` is a behavior surface inside a larger output contract rather than a standalone doc.
   - Evidence: `.claude/skills/startup-loop/SKILL.md:53-72`

### Alternate / edge flows
- SIGNALS has explicit “Phase 1 default / Phase 0 fallback” wording and a “Do NOT alter” boundary around existing weekly authority text.
  - Evidence: `.claude/skills/startup-loop/modules/cmd-advance.md:254-307`
- SELL includes both hard gates and a secondary multi-skill dispatch contract after `/lp-channels` completes.
  - Evidence: `.claude/skills/startup-loop/modules/cmd-advance.md:311-379`
- Gap-fill gates are live-loop adjuncts that can stay advisory or become blocking when replan state is open.
  - Evidence: `.claude/skills/startup-loop/modules/cmd-advance.md:383-491`

## Data & Contracts
- Source of truth for command routing:
  - `.claude/skills/startup-loop/SKILL.md:36-45`
- Source of truth for module-monolith finding:
  - `docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md:67-73`
- Active idea/queue anchor:
  - `docs/business-os/startup-loop/ideas/trial/queue-state.json` entry `IDEA-DISPATCH-20260304122500-0003` is `fact_find_ready`, not `briefing_ready`.
- Stable output contract:
  - `.claude/skills/startup-loop/SKILL.md:53-72`
- Stage-family block sizes inside `cmd-advance.md`:
  - ASSESSMENT cluster: 156 lines
  - MARKET/PRODUCT/WEBSITE cluster: 79 lines
  - SIGNALS cluster: 57 lines
  - SELL cluster: 78 lines
  - gap-fill cluster: 106 lines
  - closing contracts and operator guidance: 41 lines

## Configuration, Flags, and Operational Controls
- Required input:
  - `--business <BIZ>` only.
  - Evidence: `.claude/skills/startup-loop/modules/cmd-advance.md:3-5`
- Operational controls:
  - hard vs soft gate labels throughout the file
  - “Do NOT alter” protection around SIGNALS and SELL subsections
  - Business OS sync contract at the end of the file
  - Evidence: `.claude/skills/startup-loop/modules/cmd-advance.md:288`
  - Evidence: `.claude/skills/startup-loop/modules/cmd-advance.md:362`
  - Evidence: `.claude/skills/startup-loop/modules/cmd-advance.md:495-504`

## Error Handling and Failure Modes
- `cmd-advance.md` requires blocked responses to include exact failing gate, prompt file, output path, and one next step.
  - Evidence: `.claude/skills/startup-loop/modules/cmd-advance.md:508-517`
- Split-risk failure mode:
  - moving or renaming `modules/cmd-advance.md` would break current direct-path readers even if the content were preserved elsewhere.
  - Evidence: `scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts:83-112`
  - Evidence: `scripts/src/startup-loop/__tests__/website-contract-parity.test.ts:57-91`
  - Evidence: `scripts/check-startup-loop-contracts.sh:494-507`
- Drift failure mode:
  - SELL gate behavior is already duplicated between markdown and TypeScript. The TS implementation has path-compatibility logic for `assessment/` that the markdown description does not capture.
  - Evidence: `.claude/skills/startup-loop/modules/cmd-advance.md:333-347`
  - Evidence: `scripts/src/startup-loop/s6b-gates.ts:90-125`

## Tests and Coverage
- Existing tests:
  - `scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts:83-132` asserts the file is readable at the current path and contains specific SIGNALS strings.
  - `scripts/src/startup-loop/__tests__/website-contract-parity.test.ts:57-91` asserts WEBSITE handoff strings remain present in `cmd-advance.md`.
  - `scripts/src/startup-loop/__tests__/s6b-gate-simulation.test.ts` exercises SELL gates via the extracted TypeScript implementation.
- Non-test contract guard:
  - `scripts/check-startup-loop-contracts.sh:494-507` includes `cmd-advance.md` in active-contract checks.
- Coverage gap:
  - I did not find any test or contract that validates a future multi-file include pattern for `/startup-loop advance`; today the safe assumption is that `cmd-advance.md` must remain the readable top-level entrypoint.

## Unknowns / Follow-ups
- Unknown: whether the operator wrapper would reliably follow a new “load submodules” instruction inside `cmd-advance.md` without additional wording conventions.
  - How to verify: compare against existing split skills such as `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md` and `.claude/skills/lp-seo/SKILL.md`, then run a targeted wording review of `startup-loop/SKILL.md`.
- Unknown: how much of the remaining gate text should be extracted into executable/data artifacts instead of only split into more markdown files.
  - How to verify: trace each gate block against existing TS/data consumers starting with `scripts/src/startup-loop/s6b-gates.ts` and `docs/business-os/startup-loop/specifications/loop-spec.yaml`.

## If You Later Want to Change This (Non-plan)
- Likely change points:
  - keep `.claude/skills/startup-loop/modules/cmd-advance.md` as a short entrypoint
  - add a subordinate folder such as `.claude/skills/startup-loop/modules/cmd-advance/`
  - split by stage family, not by individual gate:
    - `assessment-gates.md`
    - `market-product-website-gates.md`
    - `signals-dispatch.md`
    - `sell-gates-and-dispatch.md`
    - `gap-fill-gates.md`
    - `advance-contract.md`
- Key risks:
  - path breakage if the stable entry file moves
  - content drift if SELL remains half in markdown and half in TS
  - “line-count win” without deterministic extraction, which would satisfy the audit mechanically but not reduce the real maintenance burden
