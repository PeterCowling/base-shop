---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: lp-do-build-codex-offload
Execution-Track: business-artifact
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: skill-update
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/lp-do-build-codex-offload/plan.md  # forward pointer — plan not yet created
Dispatch-ID: IDEA-DISPATCH-20260227-0036
artifact: fact-find
---

# lp-do-build Codex Offload Fact-Find Brief

## Scope

### Summary

`lp-do-build` currently executes all plan task implementation inline — Claude reads the task from `plan.md`, performs the code or business-artifact work, runs validations, and commits. The critique loop has been offloaded to Codex via `codemoot review <artifact>`, with Claude receiving structured JSON findings and applying autofixes. This fact-find investigates whether the same offload pattern can be applied to build execution: Codex runs the implementation work, Claude acts as orchestrator and gates on the result.

### Goals

- Map the exact critique offload pattern (reference) to identify the analogous build offload contract
- Determine whether `codemoot run` or `codex exec` can accept build task input and produce implementation output consumable by Claude
- Identify which gates Claude must still own regardless of who executes the implementation
- Identify which task types are viable for Codex offload vs inline-only
- Define the input/output contract for a `build-offload-protocol.md` (the build analogue of `critique-loop-protocol.md`)
- Determine the fallback policy when Codex is unavailable

### Non-goals

- Actually modifying any SKILL.md or protocol files (planning only)
- Implementing the offload protocol
- Offloading orchestrator-only responsibilities (writer lock, plan updates, commit gate)

### Constraints and Assumptions

- Constraints:
  - codemoot 0.2.14 is already installed and authenticated (`Logged in using ChatGPT`)
  - codex CLI 0.105.0 is available under Node 22
  - The critique offload pattern (codemoot review) is the established reference; any build offload design must be consistent with it or explicitly justify divergence
  - Writer lock must remain owned by Claude — Codex cannot be granted write access without the lock
  - CODEX.md safety rules apply: destructive git commands are forbidden for Codex agents
- Assumptions:
  - `codemoot run --mode autonomous` is the mechanism for task execution offload (as used in `lp-do-build` SKILL.md plan completion step for `results-review.user.md`)
  - Codex can read plan tasks from file paths passed in the prompt
  - Claude must retain ownership of: writer lock acquisition, VC/TC contract verification, post-build validation (build-validate.md), plan status updates, and commit gate

## Outcome Contract

- **Why:** lp-do-build runs implementation inline (Claude does the coding), while critique has already been offloaded to Codex for better separation of concerns and throughput. The operator wants the same offload pattern applied to build execution so Claude orchestrates and gates, and Codex executes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A new `_shared/build-offload-protocol.md` and targeted updates to `lp-do-build/SKILL.md` and its executor modules (`build-code.md`, `build-biz.md`, `build-spike.md`, `build-investigate.md`) that embed a Codex offload route for task execution, with Claude retaining all gate ownership and a `CODEMOOT_OK=0` fallback to inline execution.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/lp-do-build/SKILL.md` — main build orchestrator; contains Executor Dispatch section routing tasks to modules, plus plan completion steps that already use `codemoot run --mode autonomous`
- `.claude/skills/_shared/critique-loop-protocol.md` — reference pattern: `codemoot review <artifact>` → JSON findings → Claude applies autofixes; defines CODEMOOT_OK check, score mapping, fallback to inline `/lp-do-critique`

### Key Modules / Files

1. `.claude/skills/lp-do-build/SKILL.md` — orchestrator; Executor Dispatch section (lines 97–110) routes by type/track to modules; Plan Completion section (lines 150–179) already uses `nvm exec 22 codemoot run "..." --mode autonomous`
2. `.claude/skills/_shared/critique-loop-protocol.md` — the reference offload pattern; defines CODEMOOT check, score/2 mapping, findings translation, inline fallback
3. `.claude/skills/lp-do-build/modules/build-code.md` — code/mixed IMPLEMENT executor; 6-step workflow (read → extinct test policy → TDD cycle → validations → post-build validation → plan update)
4. `.claude/skills/lp-do-build/modules/build-biz.md` — business-artifact IMPLEMENT executor; Red→Green→Refactor + post-build validation + approval
5. `.claude/skills/lp-do-build/modules/build-spike.md` — SPIKE executor; 4-step minimal prototype workflow
6. `.claude/skills/lp-do-build/modules/build-investigate.md` — INVESTIGATE executor; subagent dispatch or sequential evidence gathering
7. `.claude/skills/lp-do-build/modules/build-validate.md` — post-build validation module (Mode 1/2/3); called from build-code.md and build-biz.md after implementation; IMPLEMENT-only
8. `.claude/skills/lp-do-build/modules/build-checkpoint.md` — CHECKPOINT executor; replan trigger, no shippable deliverable
9. `.claude/skills/_shared/wave-dispatch-protocol.md` — parallel wave execution (Model A: analysis subagents read-only, orchestrator applies serially under writer lock)
10. `CODEX.md` — codemoot/codex setup, CODEX safety rules, writer lock contract, `codemoot run` usage pattern

### Patterns and Conventions Observed

- **Critique offload pattern** (established reference): `nvm exec 22 codemoot --version >/dev/null 2>&1 && CODEMOOT_OK=1 || CODEMOOT_OK=0` → if OK, `nvm exec 22 codemoot review <artifact>` (stdout JSON) → parse `score`, `verdict`, `findings[]` → Claude applies autofixes; fallback: inline `/lp-do-critique`. Evidence: `.claude/skills/_shared/critique-loop-protocol.md`.
- **Build offload precedent already exists**: Plan completion step 2 in `lp-do-build/SKILL.md` already uses `nvm exec 22 codemoot run "Complete docs/plans/<slug>/results-review.user.md..." --mode autonomous`. Claude waits for exit, verifies file exists, falls back to inline on non-zero exit. This is evidence that `codemoot run` is already trusted for build-adjacent work.
- **CODEMOOT_OK dynamic check** is already the canonical guard for all codemoot usage in this repo — per `critique-loop-protocol.md` and `CODEX.md §258–267`.
- **Writer lock is always Claude's responsibility**: `scripts/agents/with-writer-lock.sh` acquires the single-writer lock. `CODEX.md §292–294` states: "Before any file write in lp-do-build, acquire the writer lock." Codex running via `codemoot run` does not acquire the lock — Claude must hold it when Codex writes.
- **`codex exec` is an alternative direct invocation**: `codex exec [--full-auto | --dangerously-bypass-approvals-and-sandbox] <prompt>` with `--output-last-message <FILE>` and `--sandbox workspace-write` flags. This is the direct Codex CLI path vs codemoot's managed workflow.

### Data and Contracts

- **Critique offload I/O contract**:
  - Input: artifact file path (e.g. `docs/plans/<slug>/fact-find.md`)
  - Command: `nvm exec 22 codemoot review <artifact>`
  - Output (JSON stdout):
    ```json
    { "mode": "file", "findings": [{"severity": "critical|warning|info", "file": "...", "line": "...", "message": "..."}], "verdict": "approved|needs_revision|unknown", "score": 4, "review": "<text>" }
    ```
  - Score mapping: `lp_score = score / 2`; score takes precedence over verdict

- **Build offload candidate I/O contract** (designed from evidence):
  - Input: natural-language task prompt containing: plan.md path, task ID, task description, Affects file list, acceptance criteria, track, Deliverable-Type
  - Command: `nvm exec 22 codemoot run "<task prompt>" --mode autonomous`
  - Output: exit code (0 = success), files written to disk (under writer lock held by Claude), Claude verifies written artifacts against VC/TC contracts
  - Verification: Claude re-reads Affects files to confirm implementation; runs post-build validation (build-validate.md) independently

- **`codex exec` direct invocation** (alternative):
  - Input: prompt via argument or stdin; `--output-last-message <file>` captures final agent message
  - Sandbox: `--sandbox workspace-write` allows file writes to the repo
  - Exit code: 0 on success; non-zero on failure or timeout
  - Key difference from codemoot: no managed review loop; single-pass execution; Claude must specify all task context in the prompt

- **Task types and offload viability** (see Questions → Resolved for full analysis):
  - IMPLEMENT (code/mixed): viable — Codex can read plan, understand TDD pattern, write code, run governed test invocations via the governing contract in CODEX.md
  - IMPLEMENT (business-artifact / skill-update): viable — Codex can draft markdown artifacts per Red→Green→Refactor; used for results-review.user.md already
  - SPIKE: viable with caveats — bounded scope, reversible; Codex reads constraints from task; spike prototype is an artefact Codex can produce
  - INVESTIGATE: viable with open design choice — Codex can gather evidence and produce an artifact; MCP tools available in `~/.codex/config.toml`; one open question on invocation form (`codemoot run` vs `codex exec --sandbox read-only`) — default `codemoot run` specified in plan but operator input preferred (see Open Questions)
  - CHECKPOINT: not viable for offload — CHECKPOINT triggers `/lp-do-replan` which is a separate skill invocation; Claude must own this entirely

### Dependency and Impact Map

- Upstream dependencies:
  - `plan.md` (task definitions, Affects list, acceptance criteria, track, Deliverable-Type)
  - `docs/testing-policy.md` (governed Jest invocation contract — Codex must follow this)
  - `CODEX.md` (safety rules that Codex reads at session start)
  - `scripts/agents/with-writer-lock.sh` (writer lock — Claude acquires before Codex writes)
- Downstream dependents:
  - All executor modules (`build-code.md`, `build-biz.md`, `build-spike.md`, `build-investigate.md`) will gain an offload route
  - `build-validate.md` remains Claude's responsibility (post-build validation runs after Codex returns)
  - Plan status updates remain Claude's responsibility
  - Commit gate remains Claude's responsibility
- Likely blast radius:
  - New `_shared/build-offload-protocol.md` (new file, no downstream breakage)
  - Updates to SKILL.md Executor Dispatch section and each executor module (add offload route before existing inline route)
  - No changes to gate structure; gates stay where they are, only implementation execution moves to Codex when available

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (governed via `pnpm -w run test:governed`), Playwright, Cypress
- Commands: `pnpm -w run test:governed -- jest -- <args>`
- CI integration: yes; tests run on CI; coding correctness verified by tests when Codex executes code tasks

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Skill file correctness | None — skill files are markdown | `.claude/skills/**/*.md` | No automated tests; Mode 3 document review is the validation |
| codemoot integration | None | — | codemoot route tested manually (CODEMOOT_OK check is live environment check) |
| lp-do-build task execution | No unit tests of the skill orchestrator | — | Skill behaviour is validated through build outcomes |

#### Coverage Gaps

- No automated tests for skill files (expected — they are markdown)
- New `build-offload-protocol.md` will be validated via Mode 3 document review at build time

#### Testability Assessment

- Easy to test: Mode 3 document review of `build-offload-protocol.md` (same as how `build-validate.md` was validated)
- Hard to test: actual Codex execution correctness — depends on model quality and prompt engineering
- Test seams needed: none beyond existing Mode 3 review

### Recent Git History (Targeted)

- `.claude/skills/_shared/critique-loop-protocol.md` — commit `27ae67ad02` (2026-02-26): "Wave 3 complete — critique-loop-protocol.md + CODEX.md integration" — added codemoot route, CODEMOOT_OK check, score/2 mapping, inline fallback. This is the direct reference for the build offload pattern.
- `.claude/skills/lp-do-build/SKILL.md` — commit `6f5c9c8518` (recent): "fix(lp-do-build): explode plan-completion into numbered steps + add Plan Completion Checklist" — plan completion step 2 already uses `nvm exec 22 codemoot run "..." --mode autonomous`; this precedent is directly relevant.
- `.claude/skills/lp-do-build/modules/build-validate.md` — commit within `lp-do-build-post-build-validation` plan (2026-02-25): added post-build validation module. Establishes validation gates that remain Claude's responsibility post-offload.

## Questions

### Resolved

- Q: Does a `codemoot run` precedent exist in this repo already for production use (not just critique)?
  - A: Yes. `lp-do-build/SKILL.md` Plan Completion step 2 already uses `nvm exec 22 codemoot run "Complete docs/plans/<slug>/results-review.user.md..." --mode autonomous`. Claude waits for exit (0 = success), verifies the output file exists and is non-empty, and falls back inline on non-zero exit. This is a direct template for the build offload pattern.
  - Evidence: `.claude/skills/lp-do-build/SKILL.md` lines 157–165

- Q: Which command invokes Codex for task execution — `codemoot run` or `codex exec`?
  - A: `codemoot run "<task>" --mode autonomous` is the correct route. It uses codemoot's managed workflow (plan→implement→review loop up to `--max-iterations`), runs under Node 22, and is already proven for build-adjacent work in this repo. `codex exec` is a lower-level alternative that could work but requires more prompt engineering and lacks codemoot's managed review loop. The `codemoot run` form is consistent with the repo's established pattern and is preferred.
  - Evidence: `CODEX.md §237–295`; `lp-do-build/SKILL.md` Plan Completion; `codemoot run --help` (mode: autonomous|interactive, max-iterations: 3)

- Q: What does Claude own regardless of who executes the implementation?
  - A: Claude retains exclusive ownership of:
    1. **Writer lock acquisition** — `scripts/agents/with-writer-lock.sh` must be held by Claude before Codex writes files (`CODEX.md §292–294`)
    2. **Eligibility gate** — task type, status, confidence threshold check
    3. **Scope gate** — reading Affects files, enforcing [readonly] constraints
    4. **VC/TC contract verification** — Claude re-reads Affects files and verifies contracts after Codex returns
    5. **Post-build validation** — `modules/build-validate.md` (Mode 1/2/3) runs under Claude after Codex returns
    6. **Commit gate** — `git commit` via writer lock is Claude's action
    7. **Post-task plan updates** — status, evidence, confidence re-scoring
    8. **CHECKPOINT handling** — triggers `/lp-do-replan`, must remain inline
    9. **DECISION task resolution** — always Claude (no shippable deliverable, requires structured operator interaction)
  - Evidence: `lp-do-build/SKILL.md` Canonical Gates section; `CODEX.md §292–294`

- Q: What does the input prompt to Codex need to contain for a build task?
  - A: The prompt must be self-contained because Codex starts a fresh session. It must include:
    - Plan path (`docs/plans/<slug>/plan.md`)
    - Task ID and description
    - Affects file list (primary + [readonly] markers)
    - Acceptance criteria verbatim
    - Track (code/mixed or business-artifact)
    - Deliverable-Type
    - Instruction to follow `CODEX.md` safety rules
    - Instruction to follow `docs/testing-policy.md` for any test invocations
    - Instruction that writer lock is held by the orchestrator — Codex writes directly, does not acquire the lock
    - A statement of exactly which files it may write (the Affects list)
  - Evidence: `codex exec --help` (`--output-last-message`, `--sandbox workspace-write`); `CODEX.md` structure; `lp-do-build/SKILL.md` task input fields

- Q: What output does Claude need from Codex to proceed with gate verification?
  - A: Claude needs:
    - Exit code (0 = task completed; non-zero = failed)
    - Files written to disk (verified by Claude re-reading Affects files)
    - Optionally: final message captured via `--output-last-message <file>` for build evidence block
  - There is no structured JSON output for build execution (unlike critique's JSON findings array). The contract is: exit code + disk state. Claude re-reads and verifies.
  - Evidence: `codex exec --help`; `codemoot run --help`; Plan Completion fallback pattern in SKILL.md

- Q: Which task types are viable for Codex offload?
  - A:
    - **IMPLEMENT (code/mixed)**: Viable. Codex can read task, apply TDD cycle, run governed test invocation (CODEX.md specifies this). Claude verifies post-execution via VC/TC + build-validate.md.
    - **IMPLEMENT (business-artifact/skill-update)**: Viable. `codemoot run` already used for `results-review.user.md`. Red→Green→Refactor workflow translatable to natural-language prompt.
    - **SPIKE**: Viable. Bounded scope, reversible output. Spike exit criteria can be passed in prompt. Claude verifies artifact.
    - **INVESTIGATE**: Viable (with open design choice on invocation form). Read-only evidence gathering + artifact production. Codex's MCP tools (base-shop MCP server is configured in `~/.codex/config.toml`) allow it to access the same evidence sources. The invocation form (`codemoot run` vs `codex exec --sandbox read-only`) is the open question addressed in Open Questions.
    - **CHECKPOINT**: Not viable. CHECKPOINT triggers `/lp-do-replan` — a separate skill that is a Claude-side orchestration action. No implementation work happens in CHECKPOINT; Codex would have nothing to execute.
    - **DECISION**: Not viable. DECISION tasks require operator interaction and structured escalation.
  - Evidence: `lp-do-build/SKILL.md` Runner Model section; `build-checkpoint.md`; `~/.codex/config.toml` (MCP servers configured)

- Q: What is the fallback policy when Codex is unavailable?
  - A: Same pattern as critique fallback. CODEMOOT_OK check: `nvm exec 22 codemoot --version >/dev/null 2>&1 && CODEMOOT_OK=1 || CODEMOOT_OK=0`. If `CODEMOOT_OK=0`, Claude executes the task inline using the existing executor module (same flow as today). This is a pure additive change — the inline path is unchanged.
  - Evidence: `critique-loop-protocol.md` §Critique Route Selection; `lp-do-build/SKILL.md` Plan Completion fallback

- Q: Does `codemoot run` in autonomous mode conflict with the writer lock?
  - A: No — provided Claude holds the writer lock before invoking `codemoot run`. The writer lock is a bash file lock (`.lock` file) managed by `scripts/git/writer-lock.sh`. `codemoot run` runs Codex as a child process in the same working directory; it does not run a separate lock acquisition. If Claude holds the lock before calling `codemoot run`, Codex runs under that lock. On exit, Claude still owns the lock and can commit.
  - Evidence: `scripts/agents/with-writer-lock.sh` (exports `BASESHOP_WRITER_LOCK_TOKEN` to child processes); `CODEX.md §292–294`

- Q: Should the new protocol file be named `build-offload-protocol.md` and live in `_shared/`?
  - A: Yes. The critique offload protocol lives in `_shared/critique-loop-protocol.md`. Following the same convention, the build offload protocol should be `_shared/build-offload-protocol.md`. It is a shared protocol because it is referenced by all executor modules, not just SKILL.md. Consistent with `critique-loop-protocol.md` placement and naming.
  - Evidence: `.claude/skills/_shared/` directory structure; `critique-loop-protocol.md` location

- Q: Should the SKILL.md reference the offload protocol, or should each executor module load it independently?
  - A: SKILL.md references it at the Executor Dispatch level, and each module loads it independently for its execution step. The CODEMOOT_OK check can be done once in SKILL.md at the start of Executor Dispatch (before routing to modules). Each module then has an "Offload Route" section that describes how to construct the task prompt and what Claude must verify on return. This mirrors how `build-validate.md` is loaded from both `build-code.md` and `build-biz.md`.
  - Evidence: `lp-do-build/SKILL.md` Executor Dispatch; pattern in `build-code.md` and `build-biz.md` referencing `modules/build-validate.md`

### Open (Operator Input Required)

None: all questions resolved — see Resolved section above.

<!-- Previously open: INVESTIGATE invocation form (codemoot run vs codex exec --sandbox read-only). Resolved at lp-do-plan DECISION self-resolve gate: INVESTIGATE tasks produce deliverable artifacts (build-investigate.md § "Produce the deliverable artifact from synthesized findings") requiring write access — codemoot run is correct; codex exec --sandbox read-only cannot write the artifact. Operator can override this choice at TASK-06 execution time if preferred. -->

## Confidence Inputs

- **Implementation: 88%**
  - The SKILL.md edits are precisely specified: add CODEMOOT_OK check before Executor Dispatch, add offload route section to each executor module, add new `_shared/build-offload-protocol.md`.
  - Integration points are verified: SKILL.md Executor Dispatch (lines 97–110), `build-code.md` 6-step workflow, `build-biz.md` Red→Green→Refactor, `build-spike.md` 4-step workflow, `build-investigate.md` subagent dispatch section.
  - The only open question (INVESTIGATE invocation style) does not block implementation; default is specified.
  - What raises to >=90: Operator confirms INVESTIGATE invocation style. Raises to 90%.
  - What raises to >=95: A dry-run spike confirming `codemoot run` output quality for a code IMPLEMENT task.

- **Approach: 85%**
  - The approach directly mirrors the critique offload pattern, which is proven in this repo. The `codemoot run` plan-completion precedent confirms the invocation form.
  - Risk: Codex session context scope. A task prompt must be self-contained. If the prompt is too short, Codex will lack context. If too long, it may exceed token limits. The optimal prompt structure needs to be defined in `build-offload-protocol.md` and tuned via the first build cycle.
  - What raises to >=90: Defining a tested prompt template in the spike (TASK-01 in plan) that confirms context is sufficient for a representative code task.
  - What raises to >=95: Empirical data from the first real task offloaded to Codex.

- **Impact: 80%**
  - The outcome is operational: Claude's role in each build cycle shifts from implementation executor to orchestrator + gate enforcer. This separation improves throughput (Codex can run longer tasks without consuming Claude context) and mirrors the critique architecture.
  - Unproven: whether Codex quality matches Claude inline for complex code tasks. The fallback (inline) handles degraded quality transparently.
  - What raises to >=90: First successful build cycle with Codex offload.

- **Delivery-Readiness: 92%**
  - All changes are markdown skill files. No compiled artifacts. No CI gate required. Writer lock available.
  - codemoot/codex prerequisites verified during fact-find: `nvm exec 22 codemoot --version` returned `0.2.14` (exit 0); `nvm exec 22 codex login status` returned "Logged in using ChatGPT". Both checks run from the repo's Bash tool — same environment used by `lp-do-build`. The CODEMOOT_OK guard remains necessary at each invocation since shell environment may differ across sessions.
  - What raises to >=95: Operator sign-off on prompt template for build-offload-protocol.md.

- **Testability: 85%**
  - `build-offload-protocol.md` validated via Mode 3 document review.
  - Each updated executor module validated via Mode 3 document review.
  - What raises to >=90: A SPIKE task in the plan that does a dry-run invocation of `codemoot run` with a minimal task prompt and verifies the exit code + output.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Codex prompt under-specification — insufficient context for Codex to complete a task correctly | Medium | High | Define prompt template in build-offload-protocol.md with mandatory fields; include plan path + task verbatim. Spike task in plan tests a representative prompt. |
| Writer lock contention — Claude holds lock while Codex runs synchronously; lock timeout if Codex task is long | Low | Medium | `with-writer-lock.sh` default timeout is 300s; codemoot run default max-iterations=3. Long-running tasks may need `--timeout` override. Document in build-offload-protocol.md. |
| INVESTIGATE offload mode ambiguity — write vs read-only Codex session | Low | Low | Open question resolved by operator default (codemoot run); tunable post-build. |
| Codex writes outside Affects scope — unintended file modifications | Low | Medium | Scope to Affects list in prompt; CODEX.md safety rules constrain Codex. Claude re-reads Affects files for verification. |
| codemoot run exits 0 but produces low-quality output | Low | Medium | Claude's VC/TC verification and post-build validation (build-validate.md) are independent of Codex output quality. Fix+retry loop (max 3) handles quality failures. |
| CHECKPOINT task mistakenly included in offload route | Very Low | High | CHECKPOINT explicitly excluded from offload-viable task types in this fact-find. Document in build-offload-protocol.md. |

## Planning Constraints and Notes

- Must-follow patterns:
  - CODEMOOT_OK check must mirror critique-loop-protocol.md exactly (same command: `nvm exec 22 codemoot --version >/dev/null 2>&1 && CODEMOOT_OK=1 || CODEMOOT_OK=0`)
  - When CODEMOOT_OK=0, fall through to existing inline executor — no new logic needed for fallback
  - Writer lock must be acquired by Claude before `codemoot run` is invoked; released by Claude after commit
  - All canonical gates (Eligibility, Scope, Validation, Commit, Post-task) remain Claude's responsibility
- Rollout/rollback expectations:
  - Changes take effect from next task cycle after skill files are committed; in-flight tasks not retroactively affected
  - Rollback: git revert of the skill-file commit; markdown only, no compiled artifacts
- Observability expectations:
  - `codemoot run` exit code logged in build evidence block
  - Offload route used (codemoot or inline fallback) recorded in build notes per task
  - Quality difference (if any) between offloaded and inline tasks observable from VC/TC verification outcomes in plan

## Suggested Task Seeds (Non-binding)

- TASK-01 (SPIKE): Dry-run `codemoot run` with a minimal representative task prompt against a trivial IMPLEMENT task; confirm exit code + output quality. This de-risks the prompt specification.
- TASK-02 (IMPLEMENT): Author `_shared/build-offload-protocol.md` — CODEMOOT_OK check, offload invocation form, input prompt schema, output contract, fallback, writer lock contract.
- TASK-03 (IMPLEMENT): Update `lp-do-build/SKILL.md` — add CODEMOOT_OK check before Executor Dispatch; reference `build-offload-protocol.md`.
- TASK-04 (IMPLEMENT): Update `modules/build-code.md` — add Offload Route section (codemoot run form, prompt template reference, Claude verification steps).
- TASK-05 (IMPLEMENT): Update `modules/build-biz.md` — add Offload Route section.
- TASK-06 (IMPLEMENT): Update `modules/build-spike.md` and `modules/build-investigate.md` — add Offload Route sections.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: All skill files pass Mode 3 document review; build-offload-protocol.md self-referential review passes; cross-file consistency check passes
- Post-delivery measurement plan: Track whether `CODEMOOT_OK=1` offload path is used on first 5 build cycles post-implementation; record exit codes and VC verification outcomes in plan evidence blocks

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Critique offload reference pattern (critique-loop-protocol.md) | Yes | None | No |
| codemoot run invocation and output contract | Yes | None — `codemoot run --help` read; exit code + disk state contract confirmed | No |
| codex exec as alternative (lower-level path) | Yes | None — confirmed `--output-last-message` and `--sandbox workspace-write` available | No |
| Writer lock compatibility with codemoot run child process | Yes | None — `with-writer-lock.sh` exports `BASESHOP_WRITER_LOCK_TOKEN` to child processes; Codex runs under lock | No |
| Executor module integration points | Yes | None — all 5 executor modules read; insertion points identified in each | No |
| CODEMOOT_OK check placement in SKILL.md | Yes | [Advisory Minor]: CODEMOOT_OK check can be computed once at Executor Dispatch entry rather than per-module — more efficient. Not a blocker. | No |
| Viable task type classification | Yes | None — all 6 task types assessed; CHECKPOINT and DECISION correctly excluded | No |
| Codex prompt self-containment requirement | Partial | [Advisory Moderate]: Prompt template not yet drafted; self-containment requirements identified but not validated against a real task. TASK-01 SPIKE addresses this. | No |
| INVESTIGATE offload mode (write vs read-only) | Partial | [Advisory Minor]: Open question on `codemoot run` vs `codex exec --sandbox read-only`; default specified; not a planning blocker | No |
| Fallback path (CODEMOOT_OK=0) | Yes | None — inline executor path unchanged; fallback is pass-through to existing modules | No |

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity**: All claims about command syntax, output shapes, and integration points verified from direct file reads and command execution (`codemoot --help`, `codex exec --help`, `codemoot review --help`, CODEX.md, SKILL.md, critique-loop-protocol.md).
2. **Boundary coverage**: Writer lock boundary inspected; codemoot child process inheritance confirmed from script source. All executor module integration points confirmed by direct read. Fallback path confirmed as pass-through (no new logic).
3. **Testing/validation coverage**: No automated tests exist for skill files (expected). Mode 3 document review is the appropriate validation path. SPIKE task in plan seeds empirical validation.
4. **Business validation coverage**: The single hypothesis (offload improves throughput without degrading build quality) is explicit; signal coverage is "untested" until first real build cycle with offload.
5. **Confidence calibration**: Scores reflect actual evidence gaps (prompt template not tested = approach 85% not 95%); what-raises actions are concrete (spike task).

### Confidence Adjustments

- Implementation reduced from hypothetical 95% to 88% because the prompt template for build-offload-protocol.md is not yet drafted or tested. This is the primary unknown.
- Approach at 85% (not higher) because prompt engineering quality is unproven at planning time, even though the invocation mechanism is confirmed.

### Remaining Assumptions

- `codemoot run` output quality for code IMPLEMENT tasks is comparable to Claude inline. Unverified until SPIKE.
- Codex reads CODEX.md at session start and follows safety rules including the governed test invocation contract. This is stated in CODEX.md but untested in an offload context.
- `BASESHOP_WRITER_LOCK_TOKEN` is inherited by `codemoot run` child process, preventing concurrent writes. Confirmed by script source but not tested under actual concurrent conditions.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan lp-do-build-codex-offload --auto`
