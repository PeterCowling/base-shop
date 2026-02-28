---
Status: Complete
Feature-Slug: lp-do-build-codex-offload
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record — lp-do-build Codex Offload

## What Was Built

**TASK-01 — SPIKE: codemoot run prompt self-containment validation**

Ran `codemoot run` with a self-contained SPIKE task prompt to validate the originally planned offload mechanism. Critical finding: `codemoot run` is a text-generation pipeline only — the `implement` step generates text output stored in the session database but does NOT write files to the filesystem. Secondary infrastructure finding: `@codemoot/cli@0.2.14` does not bundle `plan-review-implement.yml`; the workflow file had to be created manually at `/Users/petercowling/.nvm/versions/node/v22.16.0/lib/node_modules/@codemoot/cli/node_modules/workflows/plan-review-implement.yml`. Prompt transport `"$(cat /tmp/file)"` confirmed safe. Result: Invalidating — full redesign required. Artifact: `docs/plans/lp-do-build-codex-offload/spike-01-result.md`.

**TASK-02 — CHECKPOINT: spike result review and redesign routing**

Classified TASK-01 spike as Invalidating. Identified the correct offload mechanism: `codex exec -a never --sandbox workspace-write -o /tmp/codex-build-output.txt "$(cat /tmp/task-prompt.txt)"`. This uses tool-calling in agentic mode to actually write files to the filesystem, which is the requirement for build task offload. Invoked `/lp-do-replan` for TASK-03–06, produced `docs/plans/lp-do-build-codex-offload/replan-notes.md` with full mechanism redesign. Confidence for TASK-03 actualized from 75% to 85%.

**TASK-03 — IMPLEMENT: Author `_shared/build-offload-protocol.md`**

Created the new shared protocol file at `.claude/skills/_shared/build-offload-protocol.md`. Eight sections: When to Use This Protocol (CODEX_OK check), Offload Invocation (canonical `codex exec` command with all flags), Task Prompt Schema (9 required fields including writer lock note), Output Contract (exit code + disk state + final message capture), Fallback Policy (CODEX_OK=0 → inline execution unchanged), Writer Lock Contract (acquire before invocation; release after commit), Excluded Task Types (CHECKPOINT and DECISION), Post-Execution Verification (re-read Affects, run build-validate.md, commit gate, plan update). Explicitly documents that `codemoot run` is NOT suitable for file-writing tasks. All 5 VCs passed.

**TASK-04 — IMPLEMENT: Update `lp-do-build/SKILL.md` — CODEX_OK check**

Added the `### Codex Offload Check (CODEX_OK)` subsection to the `## Executor Dispatch` section, immediately before the `### Module Routing` routing logic. The subsection contains the CODEX_OK check command (`nvm exec 22 codex --version >/dev/null 2>&1 && CODEX_OK=1 || CODEX_OK=0`), branching instructions (CODEX_OK=1 → offload per `build-offload-protocol.md`; CODEX_OK=0 → inline), and a disambiguating note separating CODEMOOT_OK (critique loop) from CODEX_OK (build offload). All existing Module Routing logic preserved unchanged. All 3 VCs passed.

**TASK-05 — IMPLEMENT: Add Offload Route sections to `build-code.md` and `build-biz.md`**

Added `## Offload Route` section at top of each file (before `## Objective`). `build-code.md` Offload Route includes: protocol reference, TDD cycle expectation, governed-test invocation contract verbatim (`pnpm -w run test:governed`), and four post-execution steps (re-read Affects, run build-validate.md Mode 1/2, commit gate, plan update). `build-biz.md` Offload Route includes: protocol reference, Red→Green→Refactor requirement, approval-gate-stays-with-Claude note, and four post-execution steps (re-read Affects, run build-validate.md Mode 3, commit gate, plan update). All 3 VCs passed.

**TASK-06 — IMPLEMENT: Add Offload Route sections to `build-spike.md` and `build-investigate.md`**

Added `## Offload Route` section at top of each file (before `## Objective`). `build-spike.md` Offload Route includes: protocol reference, bounded-scope note (state scope in prompt; no boundary expansion), exit-criteria-verbatim note, minimal/reversible constraint, and invalidating-finding stop instruction. `build-investigate.md` Offload Route includes: protocol reference, `codex exec -a never --sandbox workspace-write` invocation note (write access required; `--sandbox read-only` must not be used), MCP tools availability note (`~/.codex/config.toml`), Codex-internal-parallelism replaces subagent dispatch note, and four post-execution steps. All 3 VCs passed.

## Tests Run

No Jest/test suite invocations — all deliverables are markdown skill files (business-artifact track). No compiled artifacts. Pre-commit hooks ran on all commits: typecheck-staged (no workspace packages affected), lint-staged-packages (no workspace packages affected), generate-process-improvements (no relevant files staged), validate-agent-context (OK). All hooks passed.

## Validation Evidence

| Task | VC | Pass Criterion | Result |
|---|---|---|---|
| TASK-01 | VC-01: spike-01-result.md exists | File written by Claude (not by codemoot) | Pass |
| TASK-01 | VC-02: codemoot run exit code recorded | Exit code 0 (but file not written — Invalidating) | Pass |
| TASK-01 | VC-03: prompt transport confirmed | `"$(cat /tmp/file)"` form works for multi-line prompts | Pass |
| TASK-03 | VC-01: 8 sections present | All 8 sections verified in build-offload-protocol.md | Pass |
| TASK-03 | VC-02: CODEX_OK check form | Character-identical to CODEMOOT_OK check in critique-loop-protocol.md | Pass |
| TASK-03 | VC-03: writer lock contract | Scripts/agents/with-writer-lock.sh integration documented correctly | Pass |
| TASK-03 | VC-04: excluded types | CHECKPOINT and DECISION both listed with rationale | Pass |
| TASK-03 | VC-05: mode 3 doc review | No broken references, no missing sections, no dead calls-to-action | Pass |
| TASK-04 | VC-01: CODEX_OK check presence | Check block in Executor Dispatch before Module Routing | Pass |
| TASK-04 | VC-02: routing logic unchanged | Diff shows additive only; routing block character-identical | Pass |
| TASK-04 | VC-03: cross-file CODEX_OK fidelity | grep confirms identical command string in SKILL.md and build-offload-protocol.md | Pass |
| TASK-05 | VC-01: build-code.md Offload Route | Section at top; protocol ref; governed-test note; TDD note; 4 post-execution steps | Pass |
| TASK-05 | VC-02: build-biz.md Offload Route | Section at top; protocol ref; R→G→R note; approval-gate note; 4 post-execution steps | Pass |
| TASK-05 | VC-03: no existing steps modified | Diff shows additions only; all original steps intact | Pass |
| TASK-06 | VC-01: build-spike.md Offload Route | Section at top; protocol ref; bounded-scope note; exit-criteria note | Pass |
| TASK-06 | VC-02: build-investigate.md Offload Route | Section at top; protocol ref; codex exec write-access note; MCP tools note; parallelism note | Pass |
| TASK-06 | VC-03: no existing steps modified | Diff shows additions only; all original sections intact | Pass |

## Scope Deviations

None. All work was strictly within the `Affects` lists as defined in the plan. Three commits were used (Wave 1–2 artifacts, TASK-03, Wave 4); no controlled scope expansions were required.

## Outcome Contract

- **Why:** lp-do-build runs implementation inline (Claude does the coding), while critique has already been offloaded to Codex for better separation of concerns and throughput. The operator wants the same offload pattern applied to build execution so Claude orchestrates and gates, and Codex executes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A new `_shared/build-offload-protocol.md` and targeted updates to `lp-do-build/SKILL.md` and its executor modules (`build-code.md`, `build-biz.md`, `build-spike.md`, `build-investigate.md`) that embed a Codex offload route for task execution, with Claude retaining all gate ownership and a `CODEX_OK=0` fallback to inline execution.
- **Source:** operator
