---
Type: Plan
Status: Active
Domain: BOS
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27T12:30Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-do-build-codex-offload
Deliverable-Type: skill-update
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
artifact: plan
---

# lp-do-build Codex Offload — Plan

## Summary

`lp-do-build` currently executes all plan task implementation inline — Claude performs the work and owns every step. The critique loop has already been offloaded to Codex via `codemoot review`, where Claude receives structured JSON findings and applies autofixes. This plan adds an equivalent offload route to build execution: a new `_shared/build-offload-protocol.md` (the build analogue of `critique-loop-protocol.md`) plus targeted updates to the Executor Dispatch section of `lp-do-build/SKILL.md` and all four executor modules (`build-code.md`, `build-biz.md`, `build-spike.md`, `build-investigate.md`). When `CODEMOOT_OK=1`, Codex runs the implementation; Claude retains all gate ownership (writer lock, VC/TC verification, post-build validation, commit, plan updates). When `CODEMOOT_OK=0`, Claude executes inline — the existing path unchanged.

A SPIKE task (TASK-01) validates the prompt self-containment assumption before protocol design begins. A CHECKPOINT (TASK-02) gates protocol authoring on the spike result. Protocol authoring (TASK-03) and the four module updates (TASK-04/05/06) follow, with the module updates running in parallel.

## Active tasks

- [ ] TASK-01: SPIKE — validate codemoot run prompt self-containment
- [ ] TASK-02: CHECKPOINT — reassess protocol design from spike findings
- [ ] TASK-03: Author `_shared/build-offload-protocol.md`
- [ ] TASK-04: Update `lp-do-build/SKILL.md` — add CODEMOOT_OK check + offload reference
- [ ] TASK-05: Update `modules/build-code.md` + `modules/build-biz.md` — add Offload Route sections
- [ ] TASK-06: Update `modules/build-spike.md` + `modules/build-investigate.md` — add Offload Route sections

## Goals

- Author `_shared/build-offload-protocol.md` with the canonical CODEMOOT_OK check, `codemoot run` invocation form, self-contained task prompt schema, output contract (exit code + disk state), fallback policy, and writer lock contract.
- Update `lp-do-build/SKILL.md` Executor Dispatch to perform CODEMOOT_OK check once before routing to executor modules.
- Update all four executor modules (`build-code.md`, `build-biz.md`, `build-spike.md`, `build-investigate.md`) with an Offload Route section that references the protocol and specifies Claude's post-execution verification steps.
- Confirm `codemoot run` prompt self-containment via SPIKE before committing to protocol design.

## Non-goals

- Changing any canonical gate (Eligibility, Scope, Validation, Commit, Post-task) — all gates remain Claude's responsibility.
- Offloading CHECKPOINT or DECISION task execution.
- Implementing any business or code feature.
- Automated testing of Codex output quality.

## Constraints and Assumptions

- Constraints:
  - codemoot 0.2.14 and codex CLI 0.105.0 confirmed available (verified during fact-find).
  - CODEMOOT_OK check must mirror `critique-loop-protocol.md` exactly: `nvm exec 22 codemoot --version >/dev/null 2>&1 && CODEMOOT_OK=1 || CODEMOOT_OK=0`
  - Writer lock must be acquired by Claude before `codemoot run` is invoked; released after commit.
  - All changes are markdown skill files — no compiled artifacts, no CI gate.
  - Changes take effect from the next task cycle after commit; in-flight tasks not retroactively affected.
- Assumptions:
  - TASK-01 SPIKE (completed): `codemoot run` does NOT write files — mechanism redesigned to `codex exec`. Prompt transport form `"$(cat /tmp/file)"` confirmed safe. Prompt fields confirmed received.
  - INVESTIGATE tasks use `codex exec -a never --sandbox workspace-write` (post-CHECKPOINT replan, Round 1). They produce a deliverable artifact requiring write access. `codex exec --sandbox read-only` cannot write; `codemoot run` does not write. `codex exec` with workspace-write is the correct mechanism. Operator can override at TASK-06 execution if preferred.

## Inherited Outcome Contract

- **Why:** lp-do-build runs implementation inline (Claude does the coding), while critique has already been offloaded to Codex for better separation of concerns and throughput. The operator wants the same offload pattern applied to build execution so Claude orchestrates and gates, and Codex executes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A new `_shared/build-offload-protocol.md` and targeted updates to `lp-do-build/SKILL.md` and its executor modules (`build-code.md`, `build-biz.md`, `build-spike.md`, `build-investigate.md`) that embed a Codex offload route for task execution, with Claude retaining all gate ownership and a `CODEMOOT_OK=0` fallback to inline execution.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/lp-do-build-codex-offload/fact-find.md`
- Key findings used:
  - `codemoot run --mode autonomous` is the correct invocation; used for `results-review.user.md` in Plan Completion already — direct precedent.
  - Writer lock compatibility confirmed: `with-writer-lock.sh` exports `BASESHOP_WRITER_LOCK_TOKEN` to child processes.
  - INVESTIGATE tasks use `codemoot run` (write access required — they produce a deliverable artifact).
  - CHECKPOINT and DECISION tasks excluded from offload — both require orchestrator-side logic.
  - All executor module integration points precisely identified from direct reads.
  - One fact-find open question (INVESTIGATE invocation) resolved by agent reasoning: `codemoot run` is correct because INVESTIGATE tasks have shippable deliverables.

## Proposed Approach

- Option A: SPIKE → CHECKPOINT → protocol → all module updates (sequenced with parallel Wave 4).
- Option B: No SPIKE; author protocol directly based on fact-find evidence; all updates sequentially.
- Chosen approach: **Option A**. The primary remaining risk is prompt self-containment — whether Codex can complete a build task given only a natural-language prompt with the task fields. This is an empirical question that a SPIKE can answer cheaply before committing to protocol design. A CHECKPOINT formalises the replan gate so that if the spike reveals the prompt schema needs redesign, downstream tasks are updated before protocol authoring. Module updates can be parallelised in Wave 4 since they write to different files with no overlap.

## Plan Gates

- Foundation Gate: Pass
  - `Deliverable-Type: skill-update`, `Execution-Track: business-artifact`, `Primary-Execution-Skill: lp-do-build` — all present.
  - `Startup-Deliverable-Alias: none` — confirmed.
  - Delivery-Readiness confidence: 92%.
  - Business track: Hypothesis & Validation Landscape present in fact-find; Delivery & Channel Landscape present.
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes — with CHECKPOINT gate. TASK-01 SPIKE (85%) is immediately eligible. TASK-04/05/06 IMPLEMENT (80%) are eligible after TASK-03 completes. TASK-03 IMPLEMENT is at 75% pre-CHECKPOINT (below threshold); it becomes eligible after TASK-02 CHECKPOINT actualizes it to 85% on spike affirm. `lp-do-build` correctly blocks TASK-03 until TASK-02 runs — this is the standard conditional confidence pattern, not a planning defect.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | SPIKE | Validate codemoot run prompt self-containment | 85% | S | Complete (2026-02-27) | - | TASK-02 |
| TASK-02 | CHECKPOINT | Reassess protocol design from spike findings | 95% | S | Complete (2026-02-27) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Author `_shared/build-offload-protocol.md` | 85% (actualized post-CHECKPOINT; mechanism redesigned to `codex exec`) | S | Complete (2026-02-27) | TASK-02 | TASK-04, TASK-05, TASK-06 |
| TASK-04 | IMPLEMENT | Update `lp-do-build/SKILL.md` — CODEMOOT_OK check + offload reference | 80% | S | Pending | TASK-03 | - |
| TASK-05 | IMPLEMENT | Update `modules/build-code.md` + `modules/build-biz.md` — Offload Route sections | 80% | S | Pending | TASK-03 | - |
| TASK-06 | IMPLEMENT | Update `modules/build-spike.md` + `modules/build-investigate.md` — Offload Route sections | 80% | S | Pending | TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | SPIKE — standalone; must complete before CHECKPOINT |
| 2 | TASK-02 | TASK-01 Complete | CHECKPOINT — gates protocol design on spike result |
| 3 | TASK-03 | TASK-02 Complete | Single protocol file; must be complete before modules update |
| 4 | TASK-04, TASK-05, TASK-06 | TASK-03 Complete | Parallel — no file overlap; three different file sets |

## Tasks

---

### TASK-01: Validate codemoot run prompt self-containment

- **Type:** SPIKE
- **Deliverable:** Spike result note — `docs/plans/lp-do-build-codex-offload/spike-01-result.md` — documenting: prompt used, `codemoot run` command, exit code, output state, quality assessment, and confirmed prompt schema fields.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build-Evidence:**
  - `docs/plans/lp-do-build-codex-offload/spike-01-result.md` created. VC-01/02/03 pass.
  - Spike verdict: **Invalidating** — `codemoot run` does NOT write files to disk. It is a text-generation pipeline (plan→review→implement→code-review via codex exec in text mode). All step outputs are stored in `.cowork/db/` as session artifacts. The `implement` step generated the correct file content as text but did NOT apply it to the filesystem.
  - Infrastructure finding: `plan-review-implement.yml` not bundled in `@codemoot/cli@0.2.14`. Must be manually created at expected path; fragile on upgrade.
  - Prompt transport form `"$(cat /tmp/file)"` confirmed safe for multi-line prompts.
  - Redesign required: offload mechanism must use `codex exec` (direct agentic mode) or Claude must apply `codemoot run` text output as a patch. See spike-01-result.md § Redesign Implications.
- **Artifact-Destination:** `docs/plans/lp-do-build-codex-offload/spike-01-result.md` (internal planning artifact)
- **Reviewer:** operator (Peter Cowling) — spike result reviewed at CHECKPOINT before proceeding
- **Approval-Evidence:** CHECKPOINT (TASK-02) gate reviews spike-01-result.md and routes: affirmed → continue; invalidated → replan TASK-03–06.
- **Measurement-Readiness:** Exit code and prompt quality observations captured in spike-01-result.md. Measured immediately at CHECKPOINT. No ongoing measurement required.
- **Affects:** `docs/plans/lp-do-build-codex-offload/spike-01-result.md` (create)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% — spike procedure is mechanical: construct a minimal prompt, run `nvm exec 22 codemoot run "<prompt>" --mode autonomous`, record exit code and output. Command syntax confirmed from `codemoot run --help`.
  - Approach: 85% — the prompt design for the spike is straightforward (minimal task fields: plan path, task ID, description, one Affects file, one acceptance criterion). The question being tested is whether Codex can proceed without additional context beyond the structured fields.
  - Impact: 85% — affirming result promotes TASK-03 confidence from 75% to 85% and confirms the protocol design assumption. Invalidating result triggers replan to adjust prompt schema before protocol authoring — prevents wasted effort on a broken design.
- **Acceptance:**
  - [ ] `spike-01-result.md` exists at canonical path.
  - [ ] Prompt used is recorded verbatim.
  - [ ] `codemoot run` exit code recorded (0 = completed; non-zero = failed/timeout).
  - [ ] Output state described: what files were written (or not), quality of content.
  - [ ] Pass/fail assessment against spike exit criteria: did Codex complete a minimal task with only structured fields as context?
  - [ ] Confirmed list of mandatory prompt fields based on spike findings.
  - [ ] Confirmed safe prompt transport method: records whether `"$(cat /tmp/file)"` form or pipe form is reliable for multi-line prompts containing quotes/special chars; documents the confirmed form for use in build-offload-protocol.md.
- **Validation contract:**
  - VC-01: Spike procedure executed → pass when `spike-01-result.md` exists, contains verbatim prompt and exit code, and documents whether Codex produced the expected output. Deadline: same build cycle. Sample: full file read.
  - VC-02: Prompt completeness assessment → pass when the result includes a list of confirmed mandatory prompt fields (plan path, task ID, description, Affects list, acceptance criteria, track, Deliverable-Type, CODEX.md reference, testing-policy reference, writer-lock note). Deadline: same build cycle. Sample: mandatory-fields section in result.
  - VC-03: Safe prompt transport confirmed → pass when the result documents which prompt transport form works for multi-line prompts (file-read form, pipe form, or other); the confirmed form must be safe for prompts containing newlines and single/double quotes. Deadline: same build cycle. Sample: prompt-transport section in result.
- **Execution plan:** Red → Green → Refactor
  - Red evidence plan:
    - Probe VC-01: `spike-01-result.md` does not exist → confirms Red.
  - Green evidence plan:
    - Construct minimal task prompt containing: plan path, task ID ("SPIKE-TEST"), short description ("Write a one-sentence summary to a temp file"), one Affects file (a new temp path), one acceptance criterion, track (business-artifact), Deliverable-Type (skill-update), reference to CODEX.md and docs/testing-policy.md, writer-lock note.
    - Write prompt to temp file: `cat > /tmp/spike-test-prompt.txt <<'EOF' ... EOF`
    - Run: `nvm exec 22 codemoot run "$(cat /tmp/spike-test-prompt.txt)" --mode autonomous` (validate this escaping form works; also test pipe form as alternative)
    - Record: exit code, wall time, any output to disk.
    - Assess output quality: was the deliverable written? Is it coherent?
    - Write `spike-01-result.md` with all observed evidence.
  - Refactor evidence plan:
    - Re-read `spike-01-result.md` for completeness and clarity.
    - Confirm mandatory fields list is derived from evidence, not assumed.
    - No file changes needed beyond the result note.
- **Scouts:** Key assumption: `codemoot run` will read CODEX.md at session start, giving Codex repo context. This is stated in CODEX.md but untested. The spike will empirically confirm or deny this.
- **Edge Cases & Hardening:**
  - If `codemoot run` times out (>120s for a trivial task): record as invalidating finding; route to replan for timeout mitigation strategy.
  - If Codex writes to unexpected paths: record; note that scope enforcement via Affects list in prompt is the mitigation.
  - If exit code is 0 but output is empty/nonsensical: record as quality failure; replan may need to add system context to prompt.
- **What would make this >=90%:**
  - Prior empirical evidence that `codemoot run` succeeds with minimal prompts in this repo (currently unavailable — that's what the spike generates).
- **Rollout / rollback:**
  - Rollout: spike is read-only except for creating `spike-01-result.md`. Trivial rollback — delete the file.
  - Rollback: `rm docs/plans/lp-do-build-codex-offload/spike-01-result.md`. No side effects.
- **Documentation impact:** Creates `spike-01-result.md` as internal planning evidence. Referenced by TASK-02 CHECKPOINT.
- **Notes / references:**
  - `codemoot run --help`: `codemoot run [options] <task>` — `--mode autonomous|interactive` (default: autonomous), `--max-iterations <n>` (default: 3).
  - Reference: `lp-do-build/SKILL.md` Plan Completion step 2 (established `codemoot run` usage pattern in this repo).

---

### TASK-02: CHECKPOINT — Reassess protocol design from spike findings

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan` (if needed); spike-affirmed or spike-invalidated routing decision.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build-Evidence:**
  - `spike-01-result.md` reviewed. Spike outcome: **Invalidated**.
  - Critical finding: `codemoot run` does NOT write files to disk. It is a text-generation pipeline (plan→implement→code-review loop via codex exec in text mode). The `implement` step generates the correct content as text in terminal output, but all outputs are stored in the session database as artifacts only — no file system writes occur.
  - Secondary finding: `plan-review-implement.yml` workflow file missing from `@codemoot/cli@0.2.14` install — must be manually created at package path; fragile on upgrade.
  - Horizon assumptions violated: (1) `codemoot run` does NOT write files (contrary to assumption); (2) exit code 0 does NOT correlate with file artifacts on disk.
  - Routing decision: `/lp-do-replan` invoked for TASK-03–06. See replan notes for redesigned approach.
  - Redesign direction: Switch offload mechanism from `codemoot run` to `codex exec` (direct agentic mode with tool-calling that writes files). `codex exec` in its standard mode uses tool-calling to actually modify files — this is the correct mechanism. `codemoot run` is appropriate only for text-generation tasks (like `results-review.user.md` which generates a markdown summary — no structured acceptance criteria requiring file presence verification).
- **Affects:** `docs/plans/lp-do-build-codex-offload/plan.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 95%
  - Implementation: 95% — checkpoint procedure is defined; reads spike-01-result.md, routes based on outcome.
  - Approach: 95% — prevents deep execution on a broken prompt schema.
  - Impact: 95% — controls downstream risk; ensures TASK-03–06 use a validated prompt schema.
- **Acceptance:**
  - [x] `/lp-do-build` checkpoint executor run.
  - [x] `spike-01-result.md` reviewed; spike outcome classified: **Invalidated**.
  - [x] Invalidated → `/lp-do-replan` run on TASK-03–06; prompt schema + offload mechanism redesigned in plan notes.
  - [x] Plan updated with checkpoint result.
- **Horizon assumptions to validate:**
  - `codemoot run` completes a minimal task with only structured prompt fields → **VIOLATED**: `codemoot run` does not write files.
  - Exit code 0 correlates with a usable deliverable → **VIOLATED**: exit code 0 with no file written.
  - Mandatory prompt fields list is sufficient → **Partial**: prompt fields received correctly; transport works; but mechanism is wrong.
- **Validation contract:** TASK-01 spike-01-result.md reviewed; routing decision documented in plan.
- **Planning validation:** Spike-01-result.md is the planning validation artifact.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Plan updated with checkpoint routing decision + redesign trigger.

---

### TASK-03: Author `_shared/build-offload-protocol.md`

- **Type:** IMPLEMENT
- **Deliverable:** New file `.claude/skills/_shared/build-offload-protocol.md` — the canonical build offload protocol, analogous to `critique-loop-protocol.md`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build-Evidence:**
  - `.claude/skills/_shared/build-offload-protocol.md` created. All 8 required sections present.
  - VC-01 (structural completeness): Pass — all 8 sections present (When to Use, Offload Invocation, Task Prompt Schema, Output Contract, Fallback Policy, Writer Lock Contract, Excluded Task Types, Post-Execution Verification).
  - VC-02 (CODEX_OK check): Pass — `nvm exec 22 codex --version >/dev/null 2>&1 && CODEX_OK=1 || CODEX_OK=0` present; CODEMOOT_OK vs CODEX_OK distinction documented.
  - VC-03 (`codex exec` invocation): Pass — `nvm exec 22 codex exec -a never --sandbox workspace-write` specified; `codemoot run` limitation explicitly noted.
  - VC-04 (post-execution steps): Pass — all 4 steps enumerated (VC/TC recheck, build-validate.md, commit gate, plan update).
  - VC-05 (Mode 3 document review): Pass — no broken references, no placeholders, internal consistency confirmed.
  - Offload route: inline (business-artifact IMPLEMENT is Claude-executed; offload protocol authoring is itself a business-artifact task for which Claude is the executor).
- **Artifact-Destination:** `.claude/skills/_shared/build-offload-protocol.md` (internal skill protocol; referenced by all lp-do-build executor modules)
- **Reviewer:** operator (Peter Cowling) — acknowledged before task is marked complete.
- **Approval-Evidence:** Operator acknowledgement recorded in plan build evidence block.
- **Measurement-Readiness:** Offload route usage tracked from build evidence blocks (CODEX_OK=1 vs fallback) in subsequent build cycles. Measurement window: 5 build cycles post-implementation. Owner: operator.
- **Affects:** `.claude/skills/_shared/build-offload-protocol.md` (create)
- **Depends on:** TASK-02
- **Blocks:** TASK-04, TASK-05, TASK-06
- **Confidence:** 85% (actualized post-CHECKPOINT replan — mechanism redesigned from `codemoot run` to `codex exec`)
  - **Replan note (Round 1, 2026-02-27):** TASK-01 spike found `codemoot run` does not write files. Mechanism redesigned to `codex exec -a never --sandbox workspace-write`. All protocol content sections remain valid; invocation form and output contract updated. Prompt transport confirmed working (`"$(cat /tmp/file)"` form). CODEX_OK check added as a separate guard for the build offload path.
  - Implementation: 88% — all required content sections confirmed from replan evidence: CODEX_OK check, `codex exec` invocation form (flags verified from `codex exec --help`), prompt schema (fields confirmed from spike), output contract (exit code + disk state + `-o` flag), fallback, writer lock contract, CHECKPOINT/DECISION exclusions. Note on `codemoot run` limitation added.
  - Approach: 85% — `codex exec` is the correct file-writing tool; agentic mode with tool-calling confirmed from `codex exec --help` (`--sandbox workspace-write`, `-a never`). Prompt transport confirmed from spike. Remaining 15%: Codex execution quality for real tasks (empirical only).
  - Impact: 85% — this is the single source of truth for the offload pattern; all executor module updates in TASK-04/05/06 reference it. High leverage.
- **Acceptance:**
  - [ ] File exists at `.claude/skills/_shared/build-offload-protocol.md`.
  - [ ] Section: "When to Use This Protocol" — CODEX_OK check: `nvm exec 22 codex --version >/dev/null 2>&1 && CODEX_OK=1 || CODEX_OK=0`; if OK use offload route; if not use inline fallback. Note: CODEMOOT_OK check (for critique loop) is separate; CODEX_OK is the build-offload guard.
  - [ ] Section: "Offload Invocation" — canonical form: `nvm exec 22 codex exec -a never --sandbox workspace-write -o /tmp/codex-build-output.txt "$(cat /tmp/task-prompt.txt)"`. Prompt written to temp file via `cat > /tmp/task-prompt.txt <<'EOF' ... EOF`. Transport form `"$(cat /tmp/file)"` confirmed safe (TASK-01 spike). Flags explained: `-a never` (non-interactive), `--sandbox workspace-write` (allows file writes in repo), `-o` (captures final message for build evidence). Note: `codemoot run` is NOT used — it does not write files (text-generation pipeline only).
  - [ ] Section: "Task Prompt Schema" — lists mandatory fields with one-line description each: plan path, task ID, description, Affects list, acceptance criteria verbatim, track, Deliverable-Type, CODEX.md safety rule reference, testing-policy reference (governed Jest contract), writer-lock note (lock held by orchestrator).
  - [ ] Section: "Output Contract" — exit code 0 = task completed; non-zero = failed; Claude re-reads Affects files to verify; optionally reads `/tmp/codex-build-output.txt` for build evidence; no structured JSON (unlike critique).
  - [ ] Section: "Fallback Policy" — when CODEX_OK=0, fall through to existing inline executor; no new logic in fallback path.
  - [ ] Section: "Writer Lock Contract" — Claude acquires lock before invoking `codex exec`; Codex inherits `BASESHOP_WRITER_LOCK_TOKEN` as child process (confirmed from `with-writer-lock.sh`); Claude releases lock after commit.
  - [ ] Section: "Excluded Task Types" — CHECKPOINT and DECISION are explicitly excluded; reason stated for each.
  - [ ] Section: "Post-Execution Verification (Claude's responsibility)" — lists the four post-return steps: (1) re-read Affects files, check VC/TC contracts; (2) run `modules/build-validate.md`; (3) commit gate; (4) post-task plan update.
  - [ ] Cross-reference: file references `critique-loop-protocol.md` as the established reference pattern. Notes divergence: critique uses `codemoot review` (text output parsed to JSON); build offload uses `codex exec` (files written to disk directly).
  - [ ] Mode 3 document review passes on the new file (self-referential, same as `build-validate.md` precedent).
- **Validation contract:**
  - VC-01: Structural completeness → pass when all 8 required sections are present (When to Use, Offload Invocation, Task Prompt Schema, Output Contract, Fallback Policy, Writer Lock Contract, Excluded Task Types, Post-Execution Verification). Deadline: same build cycle. Sample: full file read top-to-bottom.
  - VC-02: CODEX_OK check presence → pass when the "When to Use" section contains `nvm exec 22 codex --version >/dev/null 2>&1 && CODEX_OK=1 || CODEX_OK=0` (separate from CODEMOOT_OK used in critique loop). Deadline: same build cycle. Sample: When to Use section read.
  - VC-03: `codex exec` invocation correctness → pass when the "Offload Invocation" section specifies `nvm exec 22 codex exec -a never --sandbox workspace-write` with the temp-file prompt transport form; explicitly states `codemoot run` is NOT used for file-writing tasks. Deadline: same build cycle. Sample: Offload Invocation section read.
  - VC-04: Post-execution steps completeness → pass when all four post-return verification steps (VC/TC recheck, build-validate.md, commit gate, plan update) are enumerated. Deadline: same build cycle. Sample: Post-Execution Verification section read.
  - VC-05: Mode 3 document review → pass when a linear read finds no broken references, placeholders, or internal inconsistencies. Deadline: same build cycle. Sample: full file linear read.
- **Execution plan:** Red → Green → Refactor
  - Red evidence plan:
    - Probe VC-01: `.claude/skills/_shared/build-offload-protocol.md` does not exist → confirms Red.
  - Green evidence plan:
    - Create `.claude/skills/_shared/build-offload-protocol.md` with all 8 required sections per acceptance criteria.
    - Write "Used by: `lp-do-build/SKILL.md`, `modules/build-code.md`, `modules/build-biz.md`, `modules/build-spike.md`, `modules/build-investigate.md`" at top.
    - Include canonical `codex exec` invocation form and prompt schema example in fenced blocks for clarity.
    - Re-read file to confirm VC-01 through VC-04 pass.
  - Refactor evidence plan:
    - Re-read `critique-loop-protocol.md` to confirm CODEMOOT_OK vs CODEX_OK distinction is documented clearly (VC-02).
    - Linear read of new file (VC-05 Mode 3 document review).
    - Confirm `codemoot run` limitation note is present.
- **Planning validation:** S-effort task; no M/L consumer tracing required.
- **Scouts:** Prompt schema fields confirmed by TASK-01 spike (all 10 fields received correctly). `codex exec` flag set confirmed from `codex exec --help`. No remaining unknown assumptions.
- **Edge Cases & Hardening:**
  - Long-running tasks: `with-writer-lock.sh` default timeout is 300s. `codex exec` has no max-iterations limit (unlike `codemoot run`). Document in "Offload Invocation" section: for L-effort tasks, consider running with a timeout wrapper if needed.
  - Non-zero exit from `codex exec`: treat as invocation failure; fall back to inline for this task cycle; record in build notes.
  - `codex exec` writes outside Affects scope: CODEX.md safety rules + Affects list in prompt constrain scope; Claude re-reads Affects files for verification.
- **What would make this >=90%:**
  - First real build task successfully offloaded to `codex exec` (empirical quality confirmation).
- **Rollout / rollback:**
  - Rollout: new file; no existing logic changed. Takes effect when TASK-04/05/06 reference it.
  - Rollback: `git revert` of the TASK-03 commit. No downstream side effects until TASK-04/05/06 are also committed.
- **Documentation impact:** New file created. No existing docs updated.
- **Notes / references:**
  - Reference pattern: `.claude/skills/_shared/critique-loop-protocol.md` (CODEMOOT_OK check, route selection, fallback).
  - Key divergence from critique: critique uses `codemoot review` (text output parsed to JSON); build offload uses `codex exec` (files written to disk directly via tool-calling).
  - `build-validate.md` as precedent for self-referential Mode 3 validation.
  - Confirmed from `codex exec --help`: `-a never` (non-interactive), `--sandbox workspace-write` (file writes allowed), `-o <FILE>` (last message capture).

---

### TASK-04: Update `lp-do-build/SKILL.md` — CODEMOOT_OK check + offload reference

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-do-build/SKILL.md` — Executor Dispatch section gains a CODEMOOT_OK check before module routing, with reference to `build-offload-protocol.md`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `.claude/skills/lp-do-build/SKILL.md` (internal skill file)
- **Reviewer:** operator (Peter Cowling) — acknowledged before task is marked complete.
- **Approval-Evidence:** Operator acknowledgement recorded in plan build evidence block.
- **Measurement-Readiness:** None: S-effort skill-file update. Operational metrics (offload route usage) tracked via build evidence blocks post-implementation. No separate measurement infrastructure.
- **Affects:** `.claude/skills/lp-do-build/SKILL.md`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — integration point precisely identified (Executor Dispatch section, before module routing block); additive change; no existing logic deleted.
  - Approach: 80% — CODEMOOT_OK check form is confirmed from critique-loop-protocol.md; reference to `build-offload-protocol.md` is straightforward. Held-back test: if build-offload-protocol.md defines a different CODEMOOT check form than expected, would approach drop below 80? No — TASK-04 only inserts the CODEMOOT_OK check and a reference; the specific protocol content lives in TASK-03's file. No single unknown drops it below 80.
  - Impact: 80% — SKILL.md is the first file an agent reads when executing lp-do-build; adding the check here ensures the offload route is available to every executor module. Held-back test: if Codex quality is poor for some task types, does impact drop below 80? Fallback covers degraded quality. No single unknown drops it below 80.
- **Acceptance:**
  - [ ] Executor Dispatch section in SKILL.md contains a CODEX_OK check block immediately before the `Executor Dispatch` routing logic (before "Read `Execution-Skill` from task").
  - [ ] CODEX_OK check is: `nvm exec 22 codex --version >/dev/null 2>&1 && CODEX_OK=1 || CODEX_OK=0`
  - [ ] Text states: "If CODEX_OK=1: use offload route per `../_shared/build-offload-protocol.md`. If CODEX_OK=0: execute inline using the relevant executor module below."
  - [ ] Note present clarifying that CODEMOOT_OK (used by critique loop) and CODEX_OK (used by build offload) are separate checks.
  - [ ] No existing Executor Dispatch routing logic is changed or removed.
  - [ ] Internal consistency: CODEX_OK check form in SKILL.md matches `build-offload-protocol.md`.
  - [ ] Mode 3 document review of the updated Executor Dispatch section passes.
- **Validation contract:**
  - VC-01: CODEX_OK check presence → pass when SKILL.md contains the CODEX_OK check block in Executor Dispatch section before routing logic. Deadline: same build cycle. Sample: Executor Dispatch section read.
  - VC-02: Routing logic unchanged → pass when post-update file routing block is identical to pre-update routing block (additive only). Deadline: same build cycle. Sample: diff of routing section.
  - VC-03: Cross-file CODEX_OK fidelity → pass when the CODEX_OK check command in SKILL.md is character-for-character identical to `build-offload-protocol.md`. Deadline: same build cycle. Sample: two-file comparison.
- **Execution plan:** Red → Green → Refactor
  - Red evidence plan:
    - Probe VC-01: read SKILL.md Executor Dispatch section — no CODEX_OK check present → confirms Red.
  - Green evidence plan:
    - Insert CODEX_OK check block immediately before "Read `Execution-Skill` from task" line in Executor Dispatch section.
    - Re-read section to confirm VC-01 passes.
  - Refactor evidence plan:
    - Compare CODEX_OK check against `build-offload-protocol.md` (VC-03).
    - Confirm routing logic block is unchanged (VC-02).
    - Mode 3 review of updated Executor Dispatch section.
- **Planning validation:** None: S-effort. Integration point confirmed from direct read during fact-find (Executor Dispatch lines 97–110).
- **Scouts:** None: integration point is a direct text insertion; no side effects.
- **Edge Cases & Hardening:** None: additive-only change. Existing routing logic not modified.
- **What would make this >=90%:** First build cycle confirming the offload route is invoked correctly.
- **Rollout / rollback:**
  - Rollout: takes effect from next task cycle after commit.
  - Rollback: `git revert` of the commit. One-line revert; no downstream side effects until modules reference the protocol.
- **Documentation impact:** SKILL.md updated in place. No separate documentation file required.
- **Notes / references:**
  - Integration point: `.claude/skills/lp-do-build/SKILL.md` § Executor Dispatch (lines 97–110 in current version).
  - Reference pattern: same position/structure as `critique-loop-protocol.md` §Critique Route Selection.
  - CODEMOOT_OK vs CODEX_OK: critique loop uses CODEMOOT_OK; build offload uses CODEX_OK. Both checks use the same `nvm exec 22` pattern. They are independent guards for separate features.

---

### TASK-05: Update `modules/build-code.md` + `modules/build-biz.md` — Offload Route sections

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-do-build/modules/build-code.md` and `.claude/skills/lp-do-build/modules/build-biz.md` — each gains an "## Offload Route" section at the top specifying how to construct the task prompt and what Claude verifies on return.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `.claude/skills/lp-do-build/modules/build-code.md`, `.claude/skills/lp-do-build/modules/build-biz.md`
- **Reviewer:** operator (Peter Cowling)
- **Approval-Evidence:** Operator acknowledgement recorded in plan build evidence block.
- **Measurement-Readiness:** None: S-effort skill-file update. See TASK-04 for shared measurement plan.
- **Affects:** `.claude/skills/lp-do-build/modules/build-code.md`, `.claude/skills/lp-do-build/modules/build-biz.md`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — insertion point for both modules is clear: "## Offload Route" section added at top of each file before existing "## Objective" section. Content is fully specified by `build-offload-protocol.md` (TASK-03 output) and fact-find. Additive only; no existing workflow steps changed.
  - Approach: 80% — Offload Route section references the protocol; prompt construction specifics for code vs biz tracks are slightly different (TDD context for code; Red→Green→Refactor for biz). Both derivable from fact-find evidence. Held-back test: if build-offload-protocol.md defines a different section structure than expected, would approach drop below 80? No — the module Offload Route sections only need to: (1) state "Load and follow: `../_shared/build-offload-protocol.md`", (2) provide track-specific prompt additions (e.g., for code track: mention TDD expectation and governed test invocation), (3) list Claude's post-execution verification steps. This is a stable structure regardless of protocol content details.
  - Impact: 80% — these two modules cover IMPLEMENT tasks (the primary task type), making them the highest-value targets for offload. Held-back test: if Codex quality is poor for complex code tasks, does impact drop below 80? Fallback covers degradation. No single unknown drops below 80.
- **Acceptance:**
  - [ ] `build-code.md` contains "## Offload Route" section at top, before "## Objective".
  - [ ] `build-biz.md` contains "## Offload Route" section at top, before "## Objective".
  - [ ] Each Offload Route section: (a) loads `build-offload-protocol.md`, (b) states track-specific prompt additions, (c) lists Claude's post-execution steps (VC/TC check, build-validate.md, commit, plan update).
  - [ ] `build-code.md` Offload Route includes: note that Codex must follow governed test invocation contract (`pnpm -w run test:governed`); note on TDD cycle expectation.
  - [ ] `build-biz.md` Offload Route includes: note on Red→Green→Refactor requirement; note that approval gate remains Claude's (not Codex's) responsibility after artifact is produced.
  - [ ] Existing workflow sections in both files are unchanged.
  - [ ] Mode 3 document review passes for both updated files.
- **Validation contract:**
  - VC-01: `build-code.md` Offload Route section presence and content → pass when section exists at top, references protocol, includes governed-test note and TDD note, and lists four post-execution steps. Deadline: same build cycle. Sample: full file read.
  - VC-02: `build-biz.md` Offload Route section presence and content → pass when section exists at top, references protocol, includes Red→Green→Refactor note and approval-gate note, and lists four post-execution steps. Deadline: same build cycle. Sample: full file read.
  - VC-03: No existing workflow steps modified in either file → pass when diff shows only additions (no removals from existing numbered steps). Deadline: same build cycle. Sample: diff of both files.
- **Execution plan:** Red → Green → Refactor
  - Red evidence plan:
    - Probe VC-01: read `build-code.md` — no Offload Route section → confirms Red.
    - Probe VC-02: read `build-biz.md` — no Offload Route section → confirms Red.
  - Green evidence plan:
    - Insert "## Offload Route" section at top of `build-code.md` with protocol reference and code-track-specific additions.
    - Insert "## Offload Route" section at top of `build-biz.md` with protocol reference and biz-track-specific additions.
    - Re-read both files to confirm VC-01, VC-02 pass.
  - Refactor evidence plan:
    - Confirm no existing numbered steps were modified (VC-03).
    - Mode 3 document review of both files.
- **Planning validation:** None: S-effort. Insertion points confirmed from direct reads during fact-find.
- **Scouts:** None.
- **Edge Cases & Hardening:** Two files edited; they share no lines. Risk of drift between them (inconsistent post-execution steps list). Mitigation: copy the four post-execution steps verbatim from `build-offload-protocol.md` for both files.
- **What would make this >=90%:** First build cycle confirming code IMPLEMENT tasks offload correctly.
- **Rollout / rollback:**
  - Rollout: takes effect from next task cycle after commit.
  - Rollback: `git revert` of the commit.
- **Documentation impact:** Both modules updated in place.
- **Notes / references:**
  - build-code.md current workflow: 6 steps (read constraints → extinct test policy → TDD → validations → post-build validation → plan update). Offload Route section at top; "Offload Route (when CODEX_OK=1)" precedes the inline "## Workflow".
  - build-biz.md current workflow: Red→Green→Refactor→post-build validation→approval. Same placement.
  - Offload Route sections reference `build-offload-protocol.md` which specifies `codex exec` (not `codemoot run`).

---

### TASK-06: Update `modules/build-spike.md` + `modules/build-investigate.md` — Offload Route sections

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-do-build/modules/build-spike.md` and `.claude/skills/lp-do-build/modules/build-investigate.md` — each gains an "## Offload Route" section specifying how to construct the task prompt and what Claude verifies on return.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `.claude/skills/lp-do-build/modules/build-spike.md`, `.claude/skills/lp-do-build/modules/build-investigate.md`
- **Reviewer:** operator (Peter Cowling)
- **Approval-Evidence:** Operator acknowledgement recorded in plan build evidence block.
- **Measurement-Readiness:** None: S-effort skill-file update. See TASK-04 for shared measurement plan.
- **Affects:** `.claude/skills/lp-do-build/modules/build-spike.md`, `.claude/skills/lp-do-build/modules/build-investigate.md`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — simpler modules; fewer steps; insertion points clear. `build-spike.md` is 4 steps; `build-investigate.md` has subagent dispatch variant + sequential variant. Offload Route section structure mirrors TASK-05.
  - Approach: 80% — same protocol-reference approach as TASK-05; INVESTIGATE-specific note: `codemoot run` is the correct invocation (not `codex exec --sandbox read-only`) because INVESTIGATE tasks produce a deliverable artifact. Held-back test: if the operator later prefers `codex exec --sandbox read-only` for INVESTIGATE, would approach drop below 80? It would require a minor revision to `build-investigate.md`'s Offload Route section — a low-effort fix, not a planning failure. No single unknown drops approach below 80 for the module update itself.
  - Impact: 80% — SPIKE and INVESTIGATE are lower-volume task types than IMPLEMENT, but offloading them completes the pattern across all eligible task types. Held-back test: if Codex handles INVESTIGATE tasks poorly (complex evidence synthesis), does impact drop below 80? Fallback covers degradation; offline impact is bounded. No single unknown drops below 80.
- **Acceptance:**
  - [ ] `build-spike.md` contains "## Offload Route" section at top, before "## Objective".
  - [ ] `build-investigate.md` contains "## Offload Route" section at top, before "## Objective".
  - [ ] `build-spike.md` Offload Route includes: note that spike scope must be bounded and reversible; note that exit criteria must be verbatim in the prompt.
  - [ ] `build-investigate.md` Offload Route includes: note that `codex exec -a never --sandbox workspace-write` is the correct invocation (artifact write access required; `codex exec --sandbox read-only` cannot write the deliverable); note that MCP tools are available to Codex via `~/.codex/config.toml`; note that subagent dispatch within the module is replaced by Codex's own parallelism.
  - [ ] Existing workflow sections in both files unchanged.
  - [ ] Mode 3 document review passes for both updated files.
- **Validation contract:**
  - VC-01: `build-spike.md` Offload Route section → pass when section exists at top, references protocol, includes bounded-scope note and exit-criteria-in-prompt note. Deadline: same build cycle. Sample: full file read.
  - VC-02: `build-investigate.md` Offload Route section → pass when section exists at top, references protocol, includes `codex exec` invocation note (write access required), MCP tools note, and subagent-parallelism note. Deadline: same build cycle. Sample: full file read.
  - VC-03: No existing workflow steps modified → pass when diff shows only additions. Deadline: same build cycle. Sample: diff of both files.
- **Execution plan:** Red → Green → Refactor
  - Red evidence plan:
    - Probe VC-01: read `build-spike.md` — no Offload Route section → confirms Red.
    - Probe VC-02: read `build-investigate.md` — no Offload Route section → confirms Red.
  - Green evidence plan:
    - Insert "## Offload Route" section at top of `build-spike.md`.
    - Insert "## Offload Route" section at top of `build-investigate.md`.
    - Re-read both files to confirm VC-01, VC-02 pass.
  - Refactor evidence plan:
    - Confirm no existing steps modified (VC-03).
    - Mode 3 document review of both files.
- **Planning validation:** None: S-effort. Integration points confirmed from direct reads during fact-find.
- **Scouts:** None.
- **Edge Cases & Hardening:** INVESTIGATE Offload Route must be clear that Codex's internal parallelism replaces the `build-investigate.md` subagent dispatch pattern — this is a change in execution mechanism (not scope) and must be stated explicitly to avoid confusion.
- **What would make this >=90%:** First successful SPIKE or INVESTIGATE task offloaded to Codex.
- **Rollout / rollback:**
  - Rollout: takes effect from next task cycle after commit.
  - Rollback: `git revert` of the commit.
- **Documentation impact:** Both modules updated in place.
- **Notes / references:**
  - Resolved INVESTIGATE invocation: `codex exec -a never --sandbox workspace-write` (post-CHECKPOINT replan — INVESTIGATE tasks produce deliverable artifacts requiring write access; `codemoot run` does not write files).
  - MCP tools in Codex: base-shop MCP server registered in `~/.codex/config.toml` — Codex has access to the same evidence sources as Claude for INVESTIGATE tasks.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: SPIKE — codemoot run dry run | Yes — `codemoot run` available (CODEMOOT_OK=1 confirmed); command syntax known | [Critical Finding]: `codemoot run` does not write files; redesign required | Resolved via CHECKPOINT → replan |
| TASK-02: CHECKPOINT — spike result review | Yes — depends on TASK-01 output; spike-01-result.md existence checked by checkpoint executor | None — CHECKPOINT correctly routed to replan | No |
| TASK-03: Author build-offload-protocol.md | Yes — TASK-02 CHECKPOINT complete; mechanism redesigned to `codex exec`; all flags confirmed from `codex exec --help`; confidence actualized to 85% | None post-replan | No |
| TASK-04: Update SKILL.md | Yes — TASK-03 output (build-offload-protocol.md) is the only precondition; integration point confirmed from fact-find | None | No |
| TASK-05: Update build-code.md + build-biz.md | Yes — TASK-03 output required; no file overlap with TASK-04 or TASK-06 confirmed | None | No |
| TASK-06: Update build-spike.md + build-investigate.md | Yes — TASK-03 output required; no file overlap with TASK-04 or TASK-05 confirmed | [Advisory Minor]: INVESTIGATE offload invocation choice resolved by agent reasoning; if operator later disagrees, TASK-06 requires a minor revision — low risk | No |

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TASK-01 spike invalidated `codemoot run` mechanism | Occurred | Resolved | TASK-02 CHECKPOINT correctly routed to replan; mechanism redesigned to `codex exec`; TASK-03–06 updated. |
| `codex exec` wall-clock timeout for long IMPLEMENT tasks | Low | Medium | Document timeout wrapper guidance in build-offload-protocol.md for L-effort tasks; no built-in max-iterations limit (unlike `codemoot run`). |
| Codex writes outside Affects scope | Low | Medium | Scope enforcement via Affects list in prompt; CODEX.md safety rules constrain Codex; Claude re-reads Affects files post-execution. |
| Internal inconsistency across TASK-04/05/06 | Low | Low | All three tasks reference `build-offload-protocol.md` as canonical source; four post-execution steps copied verbatim from protocol. VC-03 cross-file consistency checks in TASK-04 catch drift. |
| INVESTIGATE invocation choice later overridden by operator | Very Low | Very Low | Minor revision to `build-investigate.md` Offload Route section only; no architectural impact. |

## Observability

- Logging: `codemoot run` exit code logged in build evidence block per task.
- Metrics: Offload route used (CODEMOOT_OK=1 vs fallback) recorded in build notes. Measurement window: 5 build cycles post-implementation.
- Alerts/Dashboards: None: passive observation from plan evidence blocks.

## Acceptance Criteria (overall)

- [ ] `_shared/build-offload-protocol.md` exists with all 8 required sections; Mode 3 review passes.
- [ ] `lp-do-build/SKILL.md` Executor Dispatch contains CODEMOOT_OK check; existing routing unchanged.
- [ ] `modules/build-code.md` Offload Route section present; existing workflow unchanged.
- [ ] `modules/build-biz.md` Offload Route section present; existing workflow unchanged.
- [ ] `modules/build-spike.md` Offload Route section present; existing workflow unchanged.
- [ ] `modules/build-investigate.md` Offload Route section present; existing workflow unchanged.
- [ ] CODEMOOT_OK check form identical across all updated files and `critique-loop-protocol.md`.
- [ ] Mode 3 document review passes for all five updated/created files.
- [ ] Operator acknowledgement captured in plan.

## Decision Log

- 2026-02-27: DECISION self-resolve gate applied to INVESTIGATE invocation choice at plan time. Agent reasoning: INVESTIGATE tasks produce deliverable artifacts requiring write access → `codemoot run` was specified as default. Updated by replan Round 1.
- 2026-02-27 (replan Round 1): TASK-02 CHECKPOINT invalidated `codemoot run` mechanism. Redesigned to `codex exec -a never --sandbox workspace-write`. Rationale: `codemoot run` is a text-generation pipeline (no file writes); `codex exec` in agentic mode uses tool-calling to write files. INVESTIGATE invocation updated accordingly.
- 2026-02-27: Chosen approach Option A (SPIKE → CHECKPOINT → protocol → parallel module updates). Rationale: SPIKE de-risks prompt self-containment assumption cheaply; CHECKPOINT prevents committing to a broken prompt schema in TASK-03–06. Validated — CHECKPOINT correctly routed to replan and redesign completed.
- 2026-02-27: Wave 4 parallelism confirmed — TASK-04 (SKILL.md), TASK-05 (build-code.md + build-biz.md), TASK-06 (build-spike.md + build-investigate.md) have no file overlap.

## Overall-confidence Calculation

- TASK-01 SPIKE S=1: 85% → Complete
- TASK-02 CHECKPOINT S=1: 95% → Complete
- TASK-03 IMPLEMENT S=1: 85% (actualized post-CHECKPOINT replan)
- TASK-04 IMPLEMENT S=1: 80%
- TASK-05 IMPLEMENT S=1: 80%
- TASK-06 IMPLEMENT S=1: 80%
- Weighted (remaining tasks): (85+80+80+80)/4 = 81.25% → **80%** (rounded per 5-multiple rule)

## Section Omission Rule

- Consumer tracing: `None: all tasks are S-effort business-artifact (skill files). No new code outputs, function signatures, or compiled artifacts. Phase 5.5 consumer tracing applies only to code/mixed M/L tasks.`
