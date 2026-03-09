---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09T13:16Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: writer-lock-patch-return-offload
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 77%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Writer Lock Patch-Return Offload Plan

## Summary
This plan implements the next slice identified by `writer-lock-operational-hardening`: replace shared-checkout mutable Codex offload with a patch-return pilot that keeps the writer lock around only the serialized apply and commit window. The original pilot sequence was invalidated by `TASK-01`, which showed that the current local Codex runtime does not reliably emit a patch artifact in a self-contained read-only probe and that the active `codex exec -a never` guidance is stale. `TASK-02` converted that uncertainty into a precursor chain. `TASK-08` then identified a viable isolated runner contract using a temporary dedicated `CODEX_HOME`. `TASK-09` proved that the isolation seam fixes startup contamination, but it also invalidated the next implementation step: the isolated runner still failed to emit a prompt unified diff artifact promptly. The plan remains buildable only by investigating and spiking the final-output/artifact-emission path before protocol and helper work resume.

## Active tasks
- [x] TASK-01: Spike the current Codex patch-return invocation and artifact contract
- [x] TASK-02: Horizon checkpoint - confirm the pilot contract from spike evidence
- [x] TASK-08: Investigate an isolated Codex runner contract for patch-return offload
- [x] TASK-09: Spike the isolated runner and require a prompt unified-diff artifact
- [ ] TASK-10: Investigate reliable final-output and artifact-extraction channels under the isolated runner
- [ ] TASK-11: Spike one bounded artifact-emission path under the isolated runner
- [ ] TASK-03: Implement the shared patch-return protocol and pilot-facing executor docs
- [ ] TASK-04: Implement the patch-return helper that assembles packets and captures returned patch artifacts
- [ ] TASK-05: Spike the serialized apply window with fingerprint checks
- [ ] TASK-06: Horizon checkpoint - confirm apply-window behavior and actualize pilot confidence
- [ ] TASK-07: Pilot `build-biz` on patch-return with explicit shared-checkout fallback

## Goals
- Make at least one `lp-do-build` lane use patch-return instead of shared-checkout mutation by default.
- Resolve the active Codex CLI contract before more offload docs or helpers are written.
- Use `writer-lock-window.sh` only where it is safe after mutation is externalized.
- Keep rollback simple by retaining the legacy shared-checkout route as a temporary fallback.

## Non-goals
- Migrating `build-investigate.md`, `ops-ci-fix`, or every executor module in this cycle.
- Tightening queue polling before holder duration is reduced.
- Removing the shared-checkout fallback before the pilot has passed.

## Constraints & Assumptions
- Constraints:
  - The shared checkout remains canonical.
  - The writer lock must not be released while uncommitted shared-checkout mutations are still possible.
  - Validation must stay scoped and respect the CI-only test execution policy.
- Assumptions:
  - `build-biz` is the safest first executor lane.
  - Runtime isolation must be evidenced before protocol/helper tasks are allowed to resume.

## Inherited Outcome Contract
- **Why:** Writer-lock hardening closed the accidental-entrypoint problem, but the active build offload path still relies on shared-checkout mutable Codex sessions and an outdated CLI invocation contract, so minimum viable lock time is still not enforceable in practice.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Base-Shop pilots a patch-return Codex offload path for business-artifact build tasks, keeps the writer lock scoped to the serialized apply and commit window, and leaves shared-checkout workspace-write as an explicit fallback instead of the default.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/writer-lock-patch-return-offload/fact-find.md`
- Key findings used:
  - patch-return is already the recommended architecture from `writer-lock-operational-hardening`
  - `writer-lock-window.sh` is viable only after mutation moves outside the shared checkout
  - active offload docs still rely on the stale `-a never` pattern
  - `build-biz` is the lowest-risk first pilot lane

## Proposed Approach
- Option A: rewrite the full offload system for every executor in one cycle
- Option B: pilot patch-return on `build-biz`, preserve fallback, then expand after proof
- Chosen approach: Option B. It fixes the architecture at the right seam without turning the first implementation into a repo-wide migration gamble.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | SPIKE | Validate the current Codex CLI invocation and patch artifact contract for patch-return offload | 85% | S | Complete (2026-03-09) | - | TASK-02 |
| TASK-02 | CHECKPOINT | Reassess downstream implementation from TASK-01 spike evidence | 95% | S | Complete (2026-03-09) | TASK-01 | TASK-08, TASK-09 |
| TASK-08 | INVESTIGATE | Determine an isolated Codex runner contract that avoids default MCP and state-runtime interference | 75% | M | Complete (2026-03-09) | TASK-02 | TASK-09 |
| TASK-09 | SPIKE | Validate the isolated runner in a temp repo and require prompt unified-diff emission | 80% | S | Complete (2026-03-09) | TASK-08 | TASK-10, TASK-11 |
| TASK-10 | INVESTIGATE | Determine which final-output and artifact-extraction channel is reliable under the isolated runner | 75% | M | Pending | TASK-09 | TASK-11 |
| TASK-11 | SPIKE | Validate one bounded artifact-emission path under the isolated runner and require prompt emitted output | 80% | S | Pending | TASK-10 | TASK-03 |
| TASK-03 | IMPLEMENT | Update the shared build-offload protocol and business-artifact executor docs for the patch-return pilot | 72% (-> 85% conditional on TASK-10, TASK-11) | M | Pending | TASK-11 | TASK-04 |
| TASK-04 | IMPLEMENT | Add the patch-return offload helper that materializes task packets and captures returned patch artifacts | 68% (-> 82% conditional on TASK-03, TASK-11) | M | Pending | TASK-03 | TASK-05 |
| TASK-05 | SPIKE | Validate serialized apply-window behavior with fingerprints and a controlled patch artifact | 72% (-> 82% conditional on TASK-04, TASK-11) | S | Pending | TASK-04 | TASK-06 |
| TASK-06 | CHECKPOINT | Reassess pilot wiring from TASK-05 apply-window evidence | 95% | S | Pending | TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Wire `build-biz` to the patch-return pilot with explicit shared-checkout fallback | 74% (-> 84% conditional on TASK-06) | M | Pending | TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Required spike to confirm current Codex CLI behavior |
| 2 | TASK-02 | TASK-01 | Checkpoint replan on invalidating runtime evidence |
| 3 | TASK-08 | TASK-02 | Investigate isolated runner contract before further implementation |
| 4 | TASK-09 | TASK-08 | Spike the isolated runner and require artifact proof |
| 5 | TASK-10 | TASK-09 | Investigate final-output/artifact-extraction options after isolated runner failure |
| 6 | TASK-11 | TASK-10 | Spike one bounded artifact-emission path before doc/code changes |
| 7 | TASK-03 | TASK-11 | Protocol and pilot doc contract only after emitted-artifact proof |
| 8 | TASK-04 | TASK-03 | Helper implementation follows the updated protocol |
| 9 | TASK-05 | TASK-04 | Controlled apply-window spike uses the helper output |
| 10 | TASK-06 | TASK-05 | Confirms whether pilot wiring is safe |
| 11 | TASK-07 | TASK-06 | Executor pilot only after both contracts are proven |

## Tasks

### TASK-01: Spike the current Codex patch-return invocation and artifact contract
- **Type:** SPIKE
- **Deliverable:** `docs/plans/writer-lock-patch-return-offload/spike-01-codex-patch-return.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `docs/plans/writer-lock-patch-return-offload/spike-01-codex-patch-return.md`, `[readonly] .claude/skills/_shared/build-offload-protocol.md`, `[readonly] .claude/skills/lp-do-build/modules/build-biz.md`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 88% - the spike is bounded to one evidence artifact and local CLI checks.
  - Approach: 85% - the unresolved area is empirical behavior, which is exactly what a spike should answer.
  - Impact: 82% - if this fails, it prevents deeper implementation from being built on stale assumptions.
- **Acceptance:**
  - Records the current local `codex exec --help` contract relevant to non-interactive runs.
  - Tests at least one patch-return artifact format suitable for later apply.
  - Concludes with one recommended invocation + artifact pair for the pilot.
- **Validation contract (TC-01):**
  - TC-01: spike artifact exists and includes the local help evidence
  - TC-02: spike artifact names a concrete recommended patch artifact format
  - TC-03: spike artifact explicitly states whether current active `-a never` guidance is valid or invalid
- **Execution plan:** Red -> Green -> Refactor
- **Scouts:** Probe both `apply_patch` text and unified diff as candidate return formats.
- **Edge Cases & Hardening:** If neither patch format is reliable, the spike must invalidate downstream implementation and push the plan to replan.
- **What would make this >=90%:**
  - A successful dry run that also proves the returned patch can be applied cleanly in a temp workflow.
- **Rollout / rollback:**
  - Rollout: add the spike note only.
  - Rollback: delete the spike note if it proves to be noise.
- **Documentation impact:**
  - Adds one canonical spike result for this plan.
- **Notes / references:**
  - local `codex exec --help`
  - `docs/plans/writer-lock-operational-hardening/build-offload-redesign.md`
  - Build evidence (2026-03-09):
    - Created `docs/plans/writer-lock-patch-return-offload/spike-01-codex-patch-return.md`.
    - Confirmed the current local `codex exec --help` output does not expose `-a never`.
    - Probed unified-diff patch return in two temp repos: plain `--sandbox read-only` and `--ephemeral -c 'mcp_servers={}' --sandbox read-only`.
    - Both probes failed to emit a patch artifact before manual termination; `last-message.txt` remained empty and stderr showed MCP startup plus state DB migration warnings.
    - Spike verdict: invalidating. TASK-02 must decide whether the next slice needs environment/runtime repair or a different runner shape before TASK-03/TASK-04 proceed.

### TASK-02: Horizon checkpoint - confirm the pilot contract from spike evidence
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan` if the spike invalidates the current downstream assumptions
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `docs/plans/writer-lock-patch-return-offload/plan.md`, `docs/plans/writer-lock-patch-return-offload/replan-notes.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-08, TASK-09
- **Confidence:** 95%
  - Implementation: 95% - process is defined.
  - Approach: 95% - prevents downstream implementation from assuming the wrong CLI or patch contract.
  - Impact: 95% - keeps the pilot buildable instead of speculative.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - plan updated with the validated invocation and patch contract, or replan invoked if invalidated
  - downstream confidences actualized from the spike evidence
- **Horizon assumptions to validate:**
  - A safe current non-interactive Codex invocation exists for the pilot
  - One patch artifact format is reliable enough to build the helper around
- **Validation contract:** TASK-01 spike artifact reviewed and routing decision recorded in the plan
- **Planning validation:** `docs/plans/writer-lock-patch-return-offload/spike-01-codex-patch-return.md`
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** updates `plan.md` and records the checkpoint rationale in `replan-notes.md`
- **Notes / references:**
  - `docs/plans/writer-lock-patch-return-offload/spike-01-codex-patch-return.md`
  - `docs/plans/writer-lock-patch-return-offload/replan-notes.md`
  - Build evidence (2026-03-09):
    - Confirmed `codex exec -a never --help` is rejected by the current local binary.
    - Confirmed `codex mcp list` and `codex mcp get {base-shop,ts-language}` still show both default MCP servers enabled.
    - Replanned downstream work by inserting the `TASK-08` -> `TASK-09` precursor chain ahead of protocol/helper implementation.
    - Lowered TASK-03/TASK-04/TASK-05 below their runnable thresholds until isolated-runner evidence exists.

### TASK-08: Investigate an isolated Codex runner contract for patch-return offload
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/writer-lock-patch-return-offload/runtime-isolation-investigation.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `docs/plans/writer-lock-patch-return-offload/runtime-isolation-investigation.md`, `[readonly] /Users/petercowling/.codex/config.toml`, `[readonly] docs/plans/writer-lock-patch-return-offload/spike-01-codex-patch-return.md`
- **Depends on:** TASK-02
- **Blocks:** TASK-09
- **Confidence:** 75%
  - Implementation: 80% - the evidence sources are direct and already partially audited.
  - Approach: 75% - the likely solution is a dedicated isolated Codex home/config shape, but it is not yet formalized.
  - Impact: 80% - this task determines whether the pilot has a viable runner path at all.
- **Questions to answer:**
  - How should patch-return offload avoid the default MCP server set and shared Codex state DB?
  - What exact invocation contract is supported by the current local Codex binary for non-interactive read-only runs?
  - What minimal Codex-home contents are required for the next spike to run without inheriting the noisy default runtime?
- **Acceptance:**
  - Names one primary isolated-runner strategy for the next spike.
  - Specifies the exact invocation candidate the next spike should use.
  - Explains which default runtime surfaces must be excluded or bypassed and why.
- **Validation contract:** investigation artifact exists and directly answers all three questions with file-backed evidence
- **Planning validation:** read-only evidence only: local help output, `codex mcp list/get`, `~/.codex` layout, and TASK-01 spike logs
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** adds `runtime-isolation-investigation.md` as the canonical precursor artifact
- **Notes / references:**
  - `docs/plans/writer-lock-patch-return-offload/replan-notes.md`
  - `docs/plans/writer-lock-patch-return-offload/runtime-isolation-investigation.md`
  - Build evidence (2026-03-09):
    - Confirmed the installed Codex binary exposes `CODEX_HOME` as a supported runtime path via binary string inspection.
    - Proved a temporary dedicated `CODEX_HOME` with copied `auth.json` plus a minimal `config.toml` yields `codex mcp list -> No MCP servers configured yet`.
    - Proved the same isolated home completes a tiny `codex exec --sandbox read-only` run promptly with `mcp startup: no servers` and no shared-home MCP/state warnings.
    - Confirmed `auth.json` is required (`401 Unauthorized` without it), and treated `config.toml` as part of the reliable runner contract because the auth-only home did not complete promptly.

### TASK-09: Spike the isolated runner and require a prompt unified-diff artifact
- **Type:** SPIKE
- **Deliverable:** `docs/plans/writer-lock-patch-return-offload/spike-09-isolated-runner.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `docs/plans/writer-lock-patch-return-offload/spike-09-isolated-runner.md`, `docs/plans/writer-lock-patch-return-offload/replan-notes-2.md`, `[readonly] docs/plans/writer-lock-patch-return-offload/runtime-isolation-investigation.md`
- **Depends on:** TASK-08
- **Blocks:** TASK-10, TASK-11
- **Confidence:** 80%
  - Implementation: 82% - the spike stays bounded to a temp repo and one patch artifact.
  - Approach: 80% - TASK-08 should have reduced the runner uncertainty to a single candidate path.
  - Impact: 80% - a clean pass is the prerequisite evidence for every remaining implementation task.
- **Acceptance:**
  - Uses the TASK-08 runner contract in a temp git repo.
  - Records exit code, runtime behavior, and whether a unified diff artifact was emitted.
  - Confirms the shared checkout remained unchanged.
- **Validation contract (TC-09):**
  - TC-01: spike artifact exists with exact command, exit code, and emitted-artifact status
  - TC-02: spike artifact states whether MCP/state-runtime interference was eliminated
  - TC-03: spike artifact states whether unified diff can proceed as the pilot contract
- **Execution plan:** Red -> Green -> Refactor
- **Scouts:** None: this task is itself the bounded runtime spike
- **Edge Cases & Hardening:** if the isolated runner still hangs or emits no artifact, this task invalidates TASK-03/TASK-04 and requires another replan round
- **What would make this >=90%:**
  - a clean pass with emitted unified diff and no shared-checkout mutation
- **Rollout / rollback:**
  - Rollout: evidence artifact only
  - Rollback: delete the spike note if superseded
- **Documentation impact:** adds the second runtime precursor artifact for this plan
- **Notes / references:**
  - `docs/plans/writer-lock-patch-return-offload/runtime-isolation-investigation.md`
  - `docs/plans/writer-lock-patch-return-offload/spike-09-isolated-runner.md`
  - `docs/plans/writer-lock-patch-return-offload/replan-notes-2.md`
  - Build evidence (2026-03-09):
    - Reused the TASK-08 isolated `CODEX_HOME` contract in `/tmp/writer-lock-task09`.
    - Confirmed isolated startup again: `mcp startup: no servers`, no shared-home MCP startup, no shared-home state migration warnings.
    - Captured exact shared-checkout before/after snapshots and confirmed they matched.
    - The runner still emitted no unified diff or final message through `output-last-message`; `last-message.txt` remained empty and the run was manually terminated after roughly thirty seconds.
    - Replanned downstream work by inserting the `TASK-10` -> `TASK-11` artifact-emission precursor chain ahead of protocol/helper implementation.

### TASK-10: Investigate reliable final-output and artifact-extraction channels under the isolated runner
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/writer-lock-patch-return-offload/artifact-emission-investigation.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/plans/writer-lock-patch-return-offload/artifact-emission-investigation.md`, `[readonly] docs/plans/writer-lock-patch-return-offload/spike-09-isolated-runner.md`, `[readonly] docs/plans/writer-lock-patch-return-offload/runtime-isolation-investigation.md`
- **Depends on:** TASK-09
- **Blocks:** TASK-11
- **Confidence:** 75%
  - Implementation: 78% - the CLI surface and failure logs are direct evidence sources.
  - Approach: 75% - the likely answer is one of the current exec output channels rather than more runtime isolation work.
  - Impact: 80% - this task determines whether patch-return can be extracted at all from the isolated runner.
- **Questions to answer:**
  - Which current `codex exec` output channel is the best candidate for a returned artifact under isolated runtime conditions?
  - Does prompt delivery style or output mode need to change for bounded artifact emission?
  - Which one candidate contract should the next spike validate?
- **Acceptance:**
  - Names one primary emitted-artifact strategy for the next spike.
  - Specifies the exact command shape the next spike should use.
  - Explains why TASK-09 failed and what variable changes in TASK-11.
- **Validation contract:** investigation artifact exists and directly answers all three questions with file-backed evidence
- **Planning validation:** read-only evidence only: CLI help, TASK-08/TASK-09 spike logs, and current non-interactive output options
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** adds `artifact-emission-investigation.md` as the next canonical precursor artifact
- **Notes / references:**
  - `docs/plans/writer-lock-patch-return-offload/replan-notes-2.md`

### TASK-11: Spike one bounded artifact-emission path under the isolated runner
- **Type:** SPIKE
- **Deliverable:** `docs/plans/writer-lock-patch-return-offload/spike-11-artifact-emission.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/writer-lock-patch-return-offload/spike-11-artifact-emission.md`, `[readonly] docs/plans/writer-lock-patch-return-offload/artifact-emission-investigation.md`
- **Depends on:** TASK-10
- **Blocks:** TASK-03
- **Confidence:** 80%
  - Implementation: 82% - the spike remains bounded to one temp repo and one candidate output path.
  - Approach: 80% - TASK-10 should reduce the choice to one artifact-emission contract.
  - Impact: 80% - a clean emitted-artifact pass is now the prerequisite evidence for every remaining implementation task.
- **Acceptance:**
  - Uses the TASK-10 artifact-emission contract in a temp repo.
  - Records exit code, runtime behavior, and emitted-artifact status.
  - Confirms the shared checkout remained unchanged.
- **Validation contract (TC-11):**
  - TC-01: spike artifact exists with exact command, exit code, and emitted-artifact status
  - TC-02: spike artifact states whether the chosen output channel solved the empty final-message problem
  - TC-03: spike artifact states whether protocol/helper work can resume
- **Execution plan:** Red -> Green -> Refactor
- **Scouts:** None: this task is itself the bounded output spike
- **Edge Cases & Hardening:** if the chosen output channel still emits nothing or fails to terminate promptly, this task invalidates TASK-03/TASK-04 and forces another redesign decision
- **What would make this >=90%:**
  - a clean pass with emitted artifact and no shared-checkout mutation
- **Rollout / rollback:**
  - Rollout: evidence artifact only
  - Rollback: delete the spike note if superseded
- **Documentation impact:** adds the next artifact-emission spike result for this plan
- **Notes / references:**
  - `docs/plans/writer-lock-patch-return-offload/artifact-emission-investigation.md`

### TASK-03: Update the shared build-offload protocol and business-artifact executor docs for the patch-return pilot
- **Type:** IMPLEMENT
- **Deliverable:** Shared protocol and pilot executor docs updated for patch-return mode, with legacy fallback kept explicit
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.claude/skills/_shared/build-offload-protocol.md`, `.claude/skills/lp-do-build/SKILL.md`, `.claude/skills/lp-do-build/modules/build-biz.md`, `[readonly] docs/plans/writer-lock-operational-hardening/build-offload-redesign.md`
- **Depends on:** TASK-11
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 72% (-> 85% conditional on TASK-10, TASK-11)
  - Implementation: 72% - the file targets are direct, but the final artifact-emission contract is still unresolved.
  - Approach: 72% - patch-return remains the right architecture, but the extraction path is still unresolved.
  - Impact: 80% - once the runner is proven, the protocol update remains high leverage.
- **Acceptance:**
  - Shared build-offload protocol describes the patch-return pilot contract and explicit legacy fallback.
  - `lp-do-build/SKILL.md` points business-artifact offload toward the pilot contract rather than assuming shared-checkout mutation by default.
  - `build-biz.md` no longer assumes a shared-checkout mutable session for the pilot lane.
- **Validation contract (TC-03):**
  - TC-01: protocol doc describes packet, patch artifact, apply window, and fallback sections
  - TC-02: business-artifact executor doc references the pilot contract without stale `-a never` guidance
  - TC-03: `git diff --check --` on task files passes
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: re-read TASK-01 spike result and current business-artifact executor docs
  - Validation artifacts: plan task text plus spike note
  - Unexpected findings: artifact emission is now a precursor, not an inline assumption
- **Scouts:** None: blocked pending precursor evidence
- **Edge Cases & Hardening:** Legacy shared-checkout fallback must remain explicit and non-default so the pilot can roll back cleanly.
- **What would make this >=90%:**
  - TASK-04 helper landing with no protocol gaps discovered.
- **Rollout / rollback:**
  - Rollout: docs become the active pilot contract.
  - Rollback: revert the protocol/doc change and retain the legacy route only.
- **Documentation impact:**
  - Active build-offload docs change.
- **Notes / references:**
  - `docs/plans/writer-lock-patch-return-offload/spike-01-codex-patch-return.md`
#### Re-plan Update (2026-03-09)
- Confidence: 83% -> 75% (-> 85% conditional on TASK-08, TASK-09) (Evidence: E2)
- Key change: protocol/docs are blocked until an isolated runner contract is investigated and spike-proven
- Dependencies: TASK-02 -> TASK-09
- Validation contract: unchanged
- Notes: `docs/plans/writer-lock-patch-return-offload/replan-notes.md`
#### Re-plan Update (2026-03-09, round 2)
- Confidence: 75% -> 72% (-> 85% conditional on TASK-10, TASK-11) (Evidence: E3)
- Key change: protocol/docs are now blocked on emitted-artifact proof, not just isolated-runner startup
- Dependencies: TASK-09 -> TASK-11
- Validation contract: unchanged
- Notes: `docs/plans/writer-lock-patch-return-offload/replan-notes-2.md`

### TASK-04: Add the patch-return offload helper that materializes task packets and captures returned patch artifacts
- **Type:** IMPLEMENT
- **Deliverable:** New helper script plus any bounded helper-side documentation needed by the pilot contract
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/agents/build-offload-patch-return.sh`, `[readonly] .claude/skills/_shared/build-offload-protocol.md`
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 68% (-> 82% conditional on TASK-03, TASK-11)
  - Implementation: 68% - helper scope is narrow, but the artifact transport path is still unproven.
  - Approach: 68% - the design is still correct, but the helper should not encode a speculative extraction contract.
  - Impact: 78% - helper value remains high once upstream runtime evidence exists.
- **Acceptance:**
  - Helper assembles a bounded task packet outside the shared checkout.
  - Helper runs Codex using the validated TASK-02 contract and captures a returned patch artifact plus final message output.
  - Helper does not mutate the shared checkout during the offload phase.
- **Validation contract (TC-04):**
  - TC-01: helper passes `bash -n`
  - TC-02: helper writes expected temp artifacts in a controlled dry run
  - TC-03: shared checkout remains unchanged during the offload phase
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: re-read TASK-03 protocol contract and `writer-lock-window.sh`
  - Validation artifacts: helper dry-run notes captured in task evidence
  - Unexpected findings: artifact emission is now an explicit prerequisite
- **Scouts:** None: blocked pending precursor evidence
- **Edge Cases & Hardening:** helper must fail closed if the returned artifact touches files outside the declared allowlist.
- **What would make this >=90%:**
  - TASK-05 proving the helper output can be applied safely through the window.
- **Rollout / rollback:**
  - Rollout: helper exists but is unused until the pilot wire-up lands.
  - Rollback: remove the helper and revert protocol references.
- **Documentation impact:**
  - minimal, limited to protocol references if needed
- **Notes / references:**
  - `scripts/git-hooks/writer-lock-window.sh`
#### Re-plan Update (2026-03-09)
- Confidence: 81% -> 70% (-> 82% conditional on TASK-03, TASK-09) (Evidence: E2)
- Key change: helper implementation is deferred until the runner contract and pilot protocol are validated
- Dependencies: unchanged task chain, but TASK-03 now depends on TASK-09
- Validation contract: unchanged
- Notes: `docs/plans/writer-lock-patch-return-offload/replan-notes.md`
#### Re-plan Update (2026-03-09, round 2)
- Confidence: 70% -> 68% (-> 82% conditional on TASK-03, TASK-11) (Evidence: E3)
- Key change: helper remains blocked because the isolated runner still returns no artifact
- Dependencies: unchanged task chain, but protocol now depends on TASK-11
- Validation contract: unchanged
- Notes: `docs/plans/writer-lock-patch-return-offload/replan-notes-2.md`

### TASK-05: Validate serialized apply-window behavior with fingerprints and a controlled patch artifact
- **Type:** SPIKE
- **Deliverable:** `docs/plans/writer-lock-patch-return-offload/spike-05-apply-window.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/writer-lock-patch-return-offload/spike-05-apply-window.md`, `[readonly] scripts/agents/build-offload-patch-return.sh`, `[readonly] scripts/git-hooks/writer-lock-window.sh`
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 72% (-> 82% conditional on TASK-04, TASK-11)
  - Implementation: 75% - the spike itself is bounded, but it cannot run until the helper exists.
  - Approach: 72% - the apply-window questions are valid only after patch artifact transport is real.
  - Impact: 80% - invalidating evidence here still remains the right gate for pilot wiring.
- **Acceptance:**
  - Exercises repo and staged-tree fingerprints around the apply window.
  - Records whether `writer-lock-window.sh` is sufficient as-is or needs an extension.
  - Concludes with a clear go/no-go for the business-artifact pilot.
- **Validation contract (TC-05):**
  - TC-01: spike artifact exists and records fingerprint behavior before and after apply
  - TC-02: spike artifact records whether lock release/reacquire behaved safely
  - TC-03: spike artifact names any helper or window gaps discovered
- **Execution plan:** Red -> Green -> Refactor
- **Scouts:** Use a controlled markdown-target patch rather than a broad code task.
- **Edge Cases & Hardening:** If fingerprint mismatch appears, the spike must stop and record it as an invalidating condition, not auto-resolve it.
- **What would make this >=90%:**
  - clean go verdict with no helper changes required.
- **Rollout / rollback:**
  - Rollout: evidence artifact only.
  - Rollback: delete the spike note if superseded.
- **Documentation impact:**
  - adds the second canonical spike result for this plan
- **Notes / references:**
  - `scripts/git-hooks/writer-lock-window.sh`
#### Re-plan Update (2026-03-09)
- Confidence: 82% -> 75% (-> 82% conditional on TASK-04) (Evidence: E2)
- Key change: apply-window spike is no longer the next technical unknown; runtime isolation moved ahead of it
- Dependencies: unchanged
- Validation contract: unchanged
- Notes: `docs/plans/writer-lock-patch-return-offload/replan-notes.md`
#### Re-plan Update (2026-03-09, round 2)
- Confidence: 75% -> 72% (-> 82% conditional on TASK-04, TASK-11) (Evidence: E3)
- Key change: apply-window spike remains downstream of helper and now also depends on emitted-artifact proof
- Dependencies: unchanged
- Validation contract: unchanged
- Notes: `docs/plans/writer-lock-patch-return-offload/replan-notes-2.md`

### TASK-06: Horizon checkpoint - confirm apply-window behavior and actualize pilot confidence
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan` if TASK-05 invalidates the current pilot assumptions
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/writer-lock-patch-return-offload/plan.md`
- **Depends on:** TASK-05
- **Blocks:** TASK-07
- **Confidence:** 95%
  - Implementation: 95% - process is defined.
  - Approach: 95% - avoids pilot wiring on an unproven apply path.
  - Impact: 95% - actualizes or invalidates the final implementation task.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - plan updated with apply-window evidence and TASK-07 confidence actualized or replan invoked
  - go/no-go decision for pilot wiring recorded
- **Horizon assumptions to validate:**
  - the helper output can be applied safely inside a narrow writer-lock window
  - `writer-lock-window.sh` is sufficient for the first pilot, or concrete gaps are known
- **Validation contract:** TASK-05 spike artifact reviewed and routing decision recorded
- **Planning validation:** `docs/plans/writer-lock-patch-return-offload/spike-05-apply-window.md`
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan update only

### TASK-07: Wire `build-biz` to the patch-return pilot with explicit shared-checkout fallback
- **Type:** IMPLEMENT
- **Deliverable:** Pilot executor lane using the patch-return helper and apply window, with legacy fallback retained explicitly
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.claude/skills/lp-do-build/modules/build-biz.md`, `.claude/skills/_shared/build-offload-protocol.md`, `scripts/agents/build-offload-patch-return.sh`, `[readonly] scripts/git-hooks/writer-lock-window.sh`
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 74% (-> 84% conditional on TASK-06)
  - Implementation: 72% - confidence is intentionally held below threshold until the apply-window spike succeeds.
  - Approach: 74% - the pilot shape is right, but safe activation depends on TASK-06.
  - Impact: 77% - moving one real executor lane off shared-checkout mutation is materially valuable.
- **Acceptance:**
  - `build-biz` uses patch-return as the pilot default path when the helper and validated Codex contract are available.
  - The shared checkout is only mutated inside the serialized apply/commit window for the pilot path.
  - Legacy shared-checkout offload remains available as an explicit fallback and is documented as such.
- **Validation contract (TC-07):**
  - TC-01: business-artifact offload path uses the helper rather than direct shared-checkout mutation
  - TC-02: fallback behavior is explicit and documented
  - TC-03: targeted validation for changed files passes, plus `git diff --check --`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: review TASK-06 checkpoint evidence before implementation
  - Validation artifacts: TASK-05 spike plus updated protocol/helper
  - Unexpected findings: None before TASK-06; any apply-window gaps discovered there must be incorporated before execution
- **Scouts:** None until TASK-06 actualizes confidence
- **Edge Cases & Hardening:** pilot must fail closed on patch allowlist violation, fingerprint mismatch, or helper artifact absence.
- **What would make this >=90%:**
  - one successful real build task recorded through the pilot path.
- **Rollout / rollback:**
  - Rollout: pilot only on business-artifact executor route.
  - Rollback: revert to explicit legacy shared-checkout route.
- **Documentation impact:**
  - active executor docs and protocol stay in sync with the helper behavior
- **Notes / references:**
  - `docs/plans/writer-lock-patch-return-offload/spike-05-apply-window.md`

## Risks & Mitigations
- The current Codex CLI may not have a safe non-interactive equivalent to the old `-a never` pattern.
  - Mitigation: keep TASK-01 as a true spike and block downstream work behind TASK-02.
- The first patch-return helper may under-specify the returned patch contract.
  - Mitigation: keep allowlist enforcement and fallback explicit; do not activate the pilot before TASK-05/TASK-06.
- Business-artifact pilot success may not generalize to code tasks.
  - Mitigation: treat this as a pilot only and scope the plan accordingly.

## Observability
- Logging: helper should record offload mode, artifact path, and apply-window outcome in task build evidence
- Metrics: `None yet; evidence-first pilot`
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] The current Codex CLI contract for patch-return offload is validated and recorded.
- [ ] An isolated Codex runner contract is investigated and documented for the pilot.
- [ ] A runtime isolation spike proves or invalidates prompt unified-diff emission before protocol/helper work resumes.
- [ ] A final-output/artifact-extraction contract is investigated and documented for the isolated runner.
- [ ] A bounded artifact-emission spike proves or invalidates returned output before protocol/helper work resumes.
- [ ] Shared build-offload docs define a patch-return pilot and explicit legacy fallback.
- [ ] A helper exists that captures patch artifacts without mutating the shared checkout.
- [ ] A controlled apply-window spike proves or invalidates the serialized narrow lock window.
- [ ] `build-biz` is ready to use the patch-return pilot once TASK-06 actualizes confidence.

## Decision Log
- 2026-03-09: Chose `build-biz` as the first pilot lane instead of `build-investigate` because business-artifact tasks have cleaner validation and lower mutation risk.
- 2026-03-09: Treated the stale `-a never` guidance as spike-gated evidence, not as a blind find-and-replace.
- 2026-03-09: TASK-02 checkpoint added the `TASK-08` -> `TASK-09` runtime-isolation precursor chain before protocol/helper work.
- 2026-03-09: TASK-08 selected a temporary dedicated `CODEX_HOME` as the primary isolation seam for patch-return offload, seeded only with `auth.json` and a minimal `config.toml`.
- 2026-03-09: TASK-09 confirmed the isolated home fixes startup contamination, but added a second precursor chain because final artifact emission still failed.

## Overall-confidence Calculation
- S=1, M=2
- Overall-confidence = (85*1 + 95*1 + 75*2 + 80*1 + 75*2 + 80*1 + 72*2 + 68*2 + 72*1 + 95*1 + 74*2) / 16 = 77.2% -> 77%

## What Would Make This >=90%
- Complete TASK-10 and TASK-11 successfully, then actualize TASK-03/TASK-04 above threshold from emitted-artifact evidence.

## Section Omission Rule
- None: all sections are relevant for this pilot implementation plan.
