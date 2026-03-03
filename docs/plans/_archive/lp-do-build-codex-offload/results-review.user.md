---
Type: Results-Review
Status: Draft
Feature-Slug: lp-do-build-codex-offload
Review-date: 2026-02-27
artifact: results-review
---

# Results Review

## Observed Outcomes

- `.claude/skills/_shared/build-offload-protocol.md` now exists with 8 canonical sections. Any lp-do-build executor that sets CODEX_OK=1 can follow the protocol to offload task execution to Codex, with Claude retaining all gate ownership.
- `lp-do-build/SKILL.md` Executor Dispatch now checks CODEX_OK before routing; the check command is character-identical to `build-offload-protocol.md`. CODEMOOT_OK (critique) and CODEX_OK (build offload) are clearly separated in documentation.
- All four executor modules (`build-code.md`, `build-biz.md`, `build-spike.md`, `build-investigate.md`) now have an `## Offload Route` section as the first section. Each section is self-contained: protocol reference, track-specific prompt additions, and four post-execution verification steps.
- TASK-01 SPIKE produced an invalidating finding that drove a mechanism redesign from `codemoot run` to `codex exec -a never --sandbox workspace-write`. This finding is permanently documented in `spike-01-result.md` and `replan-notes.md` and has been incorporated into the protocol itself (explicit note that `codemoot run` does NOT write files).

## Standing Updates

- `docs/business-os/startup-loop/loop-output-contracts.md`: No update required — this plan's artifacts were produced at canonical paths and the contract already covers skill-update deliverables.
- `.claude/skills/_shared/build-offload-protocol.md`: New file — already registered as part of the delivered feature; no standing artifact update needed beyond the file itself.

## New Idea Candidates

- Governed test invocation validation script: the build-code.md Offload Route documents that `npx jest`, `pnpm exec jest`, and direct binary invocations are blocked — Codex may attempt blocked invocation forms if the prompt is unclear. A lightweight CI-time or pre-commit check that detects blocked test invocation patterns in agent output could make this enforcement automatic. | Trigger observation: `build-code.md` Offload Route documents blocked invocation forms; Codex prompt must restate them — mechanistic check could replace this instruction | Suggested next action: spike
- New skill — `lp-do-build` Codex offload integration test: after the first real task is offloaded, a spike to verify the complete flow (CODEX_OK=1 → `codex exec` → Affects files written → post-execution steps pass) would actualize the 80% → 90%+ confidence gap on the four module tasks | Trigger observation: TASK-04/05/06 all have "What would make this >=90%: First build cycle confirming offload route invoked correctly" | Suggested next action: spike (low priority; activate after first offload use)
- New loop process — codemoot run output-to-disk bridge: this build discovered that `codemoot run` text output is never written to disk. A bridging mechanism (parse session DB → apply text diff to target file) could enable `codemoot run` for text-artifact tasks without requiring the manual inline fallback used here. | Trigger observation: codemoot run iterated 3 times in the results-review session and never wrote the file; Claude had to write inline | Suggested next action: spike

## Standing Expansion

No standing expansion: no evidence-backed standing artifact addition/revision was identified from this build beyond the delivered feature files. The build-offload-protocol.md is a new skill file, not a Layer A standing intelligence artifact.

## Intended Outcome Check

- **Intended:** A new `_shared/build-offload-protocol.md` and targeted updates to `lp-do-build/SKILL.md` and its executor modules (`build-code.md`, `build-biz.md`, `build-spike.md`, `build-investigate.md`) that embed a Codex offload route for task execution, with Claude retaining all gate ownership and a `CODEX_OK=0` fallback to inline execution.
- **Observed:** `_shared/build-offload-protocol.md` created with all 8 required sections; `lp-do-build/SKILL.md` updated with CODEX_OK check block in Executor Dispatch; all four executor modules updated with `## Offload Route` sections specifying protocol reference, track-specific prompt additions, and Claude's four post-execution verification steps. All VCs passed. Mechanism changed from `codemoot run` to `codex exec` during CHECKPOINT/replan without breaking the stated intent. Fallback (CODEX_OK=0) is explicitly documented as the unchanged inline execution path.
- **Verdict:** Met
- **Notes:** Intended structural and operational outcomes were implemented. The mechanism changed from the initial assumption (`codemoot run`) to the validated implementation (`codex exec -a never --sandbox workspace-write`) during the CHECKPOINT replan round, without breaking the stated intended outcome. The SPIKE finding that drove this change is permanently documented and incorporated into the protocol.
