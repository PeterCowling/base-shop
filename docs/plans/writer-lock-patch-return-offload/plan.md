---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09T12:55Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: writer-lock-patch-return-offload
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Writer Lock Patch-Return Offload Plan

## Summary
This plan implements the next slice identified by `writer-lock-operational-hardening`: replace shared-checkout mutable Codex offload with a patch-return pilot that keeps the writer lock around only the serialized apply and commit window. The first rollout is intentionally narrow. It validates the current Codex CLI contract, chooses a patch artifact format, updates the shared protocol, and pilots the new route on `build-biz` rather than attempting a repo-wide executor migration. Shared-checkout `workspace-write` remains as an explicit temporary fallback until the pilot proves the new contract.

## Active tasks
- [x] TASK-01: Spike the current Codex patch-return invocation and artifact contract
- [ ] TASK-02: Horizon checkpoint - confirm the pilot contract from spike evidence
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
  - A spike is still required because the active docs use a stale Codex invocation contract.

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
| TASK-02 | CHECKPOINT | Reassess downstream implementation from TASK-01 spike evidence | 95% | S | Pending | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Update the shared build-offload protocol and business-artifact executor docs for the patch-return pilot | 83% | M | Pending | TASK-02 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Add the patch-return offload helper that materializes task packets and captures returned patch artifacts | 81% | M | Pending | TASK-03 | TASK-05 |
| TASK-05 | SPIKE | Validate serialized apply-window behavior with fingerprints and a controlled patch artifact | 82% | S | Pending | TASK-04 | TASK-06 |
| TASK-06 | CHECKPOINT | Reassess pilot wiring from TASK-05 apply-window evidence | 95% | S | Pending | TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Wire `build-biz` to the patch-return pilot with explicit shared-checkout fallback | 74% (-> 84% conditional on TASK-06) | M | Pending | TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Required spike to confirm current Codex CLI behavior |
| 2 | TASK-02 | TASK-01 | Locks the invocation and patch contract before doc/code changes |
| 3 | TASK-03 | TASK-02 | Protocol and pilot doc contract |
| 4 | TASK-04 | TASK-03 | Helper implementation follows the protocol |
| 5 | TASK-05 | TASK-04 | Controlled apply-window spike uses the helper output |
| 6 | TASK-06 | TASK-05 | Confirms whether pilot wiring is safe |
| 7 | TASK-07 | TASK-06 | Executor pilot only after both contracts are proven |

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
- **Status:** Pending
- **Affects:** `docs/plans/writer-lock-patch-return-offload/plan.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
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
- **Documentation impact:** plan update only

### TASK-03: Update the shared build-offload protocol and business-artifact executor docs for the patch-return pilot
- **Type:** IMPLEMENT
- **Deliverable:** Shared protocol and pilot executor docs updated for patch-return mode, with legacy fallback kept explicit
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.claude/skills/_shared/build-offload-protocol.md`, `.claude/skills/lp-do-build/SKILL.md`, `.claude/skills/lp-do-build/modules/build-biz.md`, `[readonly] docs/plans/writer-lock-operational-hardening/build-offload-redesign.md`
- **Depends on:** TASK-02
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 83%
  - Implementation: 86% - the file targets are direct and bounded.
  - Approach: 83% - the spike will already have reduced the CLI and artifact uncertainty.
  - Impact: 81% - this makes the pilot contract the active one for the chosen lane.
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
  - Unexpected findings: `None expected beyond CLI wording drift`
- **Scouts:** None: contract already scoped by TASK-02
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
- **Confidence:** 81%
  - Implementation: 84% - helper scope is narrow if the protocol contract is already fixed.
  - Approach: 81% - a temp packet plus captured patch artifact is a direct translation of the redesign note.
  - Impact: 79% - helper value is realized only once the apply window and pilot lane are wired.
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
  - Unexpected findings: `None expected beyond temp-path handling`
- **Scouts:** None: helper behavior is downstream of the locked-in protocol
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
- **Confidence:** 82%
  - Implementation: 84% - the spike is bounded to a controlled patch apply path.
  - Approach: 82% - this is the first real proof that the narrow lock window works in practice.
  - Impact: 80% - invalidating evidence here prevents unsafe pilot wiring.
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
- [ ] Shared build-offload docs define a patch-return pilot and explicit legacy fallback.
- [ ] A helper exists that captures patch artifacts without mutating the shared checkout.
- [ ] A controlled apply-window spike proves or invalidates the serialized narrow lock window.
- [ ] `build-biz` is ready to use the patch-return pilot once TASK-06 actualizes confidence.

## Decision Log
- 2026-03-09: Chose `build-biz` as the first pilot lane instead of `build-investigate` because business-artifact tasks have cleaner validation and lower mutation risk.
- 2026-03-09: Treated the stale `-a never` guidance as spike-gated evidence, not as a blind find-and-replace.

## Overall-confidence Calculation
- S=1, M=2
- Overall-confidence = (85*1 + 95*1 + 83*2 + 81*2 + 82*1 + 95*1 + 74*2) / 10 = 81.3% -> 81%

## What Would Make This >=90%
- Complete TASK-01 and TASK-05 successfully, then actualize TASK-07 confidence above the IMPLEMENT threshold from checkpoint evidence.

## Section Omission Rule
- None: all sections are relevant for this pilot implementation plan.
