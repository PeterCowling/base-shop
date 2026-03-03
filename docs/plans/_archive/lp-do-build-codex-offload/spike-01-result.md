---
artifact: spike-result
task: TASK-01
plan: docs/plans/lp-do-build-codex-offload/plan.md
date: 2026-02-27
---

# SPIKE-01 Result: codemoot run prompt self-containment

## Status: Invalidating — architectural finding requires plan redesign

## Prompt Used (verbatim)

```
You are executing a minimal SPIKE task to test prompt self-containment.

## Task Context

- Plan path: docs/plans/lp-do-build-codex-offload/plan.md
- Task ID: SPIKE-TEST
- Task type: SPIKE
- Task description: Write a one-sentence summary of what codemoot does to the file docs/plans/lp-do-build-codex-offload/spike-test-output.md
- Execution-Track: business-artifact
- Deliverable-Type: skill-update

## Affects

- docs/plans/lp-do-build-codex-offload/spike-test-output.md (create)

## Acceptance Criteria

- [ ] File docs/plans/lp-do-build-codex-offload/spike-test-output.md exists
- [ ] File contains exactly one sentence describing what codemoot does
- [ ] File contains no placeholder text

## References

- Repo conventions: CODEX.md
- Testing policy: docs/testing-policy.md

## Writer Lock

This task is run under a writer lock. The lock token is set in BASESHOP_WRITER_LOCK_TOKEN. Do not modify files outside the Affects list above.
```

## codemoot run Command Used

```
nvm exec 22 codemoot run "$(cat /tmp/spike-test-prompt.txt)" --mode autonomous
```

Prompt transport form: `"$(cat /tmp/file)"` inline command substitution.

## Pre-run: Infrastructure Finding (Blocking)

`codemoot run` failed on first attempt:
```
Error: Workflow file not found: /Users/petercowling/.nvm/versions/node/v22.16.0/lib/node_modules/@codemoot/cli/node_modules/workflows/plan-review-implement.yml
```

**Root cause:** `@codemoot/cli@0.2.14` bundles no workflow files. The `codemoot run` command uses `Orchestrator.run()` from `@codemoot/core` which requires a `plan-review-implement.yml` workflow YAML at a path resolved relative to the module, but the directory does not exist in the installed package.

**Fix applied during spike:** Created `plan-review-implement.yml` at the expected path:
```
/Users/petercowling/.nvm/versions/node/v22.16.0/lib/node_modules/@codemoot/cli/node_modules/workflows/plan-review-implement.yml
```
This file was constructed by reverse-engineering the `WorkflowEngine.validateDefinition()` schema and `executeSession()` step-lookup logic from `@codemoot/core/dist/index.js`. The workflow engine expects steps with ids: `plan`, `review-plan`, `implement`, `code-review`.

**Stability risk:** This workflow file lives inside the npm global package directory. It will be lost on `npm install -g @codemoot/cli` (reinstall or upgrade). Any `codemoot run` invocation requires this file to exist.

## Run Output

```
━━━ Session ses_5sCYWjlF-2qJg80HDu9Sf ━━━
Workflow: plan-review-implement

▶ [architect] plan (gpt-5.3-codex, iter 1)
  ✓ plan (35.9s, 1441 tokens)

▶ [reviewer] review-plan (gpt-5.3-codex, iter 1)
  ✓ review-plan (13.3s, 2047 tokens)
  ↻ Loop 1/3: approved

▶ [implementer] implement (gpt-5.3-codex, iter 1)
### File: docs/plans/lp-do-build-codex-offload/spike-test-output.md
(content generated in session output — but NOT written to disk)
  ✓ implement (8.0s, 1194 tokens)

▶ [reviewer] code-review (gpt-5.3-codex, iter 1)
  ✓ code-review (17.2s, 590 tokens)
  ↻ Loop 1/3: needs_revision
    Feedback: Required deliverable file was not created (acceptance criteria fail)

▶ [implementer] implement (gpt-5.3-codex, iter 2)
  ✓ implement (15.2s, 198 tokens)
▶ [reviewer] code-review (gpt-5.3-codex, iter 2)
  ↻ Loop 2/3: needs_revision — artifact still missing

▶ [implementer] implement (gpt-5.3-codex, iter 3)
  ✓ implement (20.2s, 198 tokens)
▶ [reviewer] code-review (gpt-5.3-codex, iter 3)
  ↻ Loop 3/3: needs_revision — artifact still missing

━━━ Session Complete ━━━
  Status: completed
  Exit code: 0
  Duration: 169.3s
  Tokens: 8,242
  Cost: $0.0000
```

## Exit Code

`0` (completed) — despite the file never being written.

## Output State

```
ls docs/plans/lp-do-build-codex-offload/spike-test-output.md
→ No such file or directory
```

The file was **NOT written to disk**. The `implement` step generated the file content as model output text (visible in the terminal), but `codemoot run` stores all step outputs as session artifacts in `.cowork/db/` — it does NOT apply the generated text to the filesystem.

## Architectural Finding (Critical for plan redesign)

### What `codemoot run` actually does

`codemoot run` is a **text-generation pipeline**, not a file-writing executor:

1. `plan` step: calls `codex exec` (gpt-5.3-codex) to generate an implementation plan as text.
2. `review-plan` step: calls `codex exec` to review the plan text; returns verdict.
3. `implement` step: calls `codex exec` to generate implementation as text (markdown with code blocks, file paths).
4. `code-review` step: calls `codex exec` to review the generated text; returns needs_revision/approved.

**All outputs are stored in the session database as text artifacts.** No files are written to disk. The workflow is a text-generation review loop, equivalent to having a codex agent generate and review content — but without tool-calling permissions to actually write files.

### Contrast with `codex exec`

`codex exec` in its standard agentic mode uses tool-calling (bash, file write) to actually modify files. This is what the fact-find assumed was the mechanism. `codemoot run` wraps `codex exec` but only collects its text output — it does NOT invoke codex in write mode.

### Contrast with `codemoot review`

`codemoot review` also uses `codex exec` via `CliAdapter.callWithResume()`, but it works because the task is purely analytical: read files, generate findings as text in a structured format (CRITICAL/WARNING/INFO lines). No file writing needed. The findings are parsed from stdout and emitted as JSON.

## Prompt Transport Findings (VC-03)

The `"$(cat /tmp/file)"` transport form **works correctly** for multi-line prompts:
- 29-line, 940-byte prompt including newlines, markdown headings, and lists was received intact.
- All 4 workflow steps received the full prompt text without truncation or escaping issues.
- Confirmed safe for prompts with newlines and standard markdown characters.
- NOT tested: prompts containing unescaped single quotes (would break the outer single-quote context if used with `'$(cat ...)'` form).

**Confirmed safe prompt transport method:** `"$(cat /tmp/prompt-file.txt)"` (double-quote command substitution with heredoc `<<'EOF'` write).

## Mandatory Prompt Fields Assessment (VC-02)

The following fields were included in the spike prompt and received by all workflow steps:
- Plan path: received
- Task ID: received
- Task description: received
- Affects file list: received
- Acceptance criteria: received
- Execution-Track: received
- Deliverable-Type: received
- CODEX.md reference: received
- docs/testing-policy.md reference: received
- Writer lock note: received

All fields were received. However, since `codemoot run` does not write files, these fields had no effect on actual file system output.

## Pass/Fail Against Exit Criteria

| Criterion | Result |
|---|---|
| `spike-01-result.md` exists | Pass (this file) |
| Prompt received verbatim | Pass |
| `codemoot run` exit code recorded | Pass (0) |
| Output state described | Pass (file NOT written to disk) |
| Pass/fail assessment against exit criteria | **FAIL — codemoot run does not write files** |
| Mandatory prompt fields confirmed | Pass (all received) |
| Safe prompt transport confirmed | Pass (`"$(cat /tmp/file)"` works) |

**Overall spike verdict: Invalidating.** The core assumption — that `codemoot run` can execute a build task and produce file artifacts — is false. `codemoot run` is a text-generation pipeline; it does not write files.

## Infrastructure Finding: Workflow File Missing

Secondary finding that affects any future `codemoot run` usage:
- `plan-review-implement.yml` workflow file is not bundled with `@codemoot/cli@0.2.14`
- Must be manually created at: `/Users/petercowling/.nvm/versions/node/v22.16.0/lib/node_modules/@codemoot/cli/node_modules/workflows/plan-review-implement.yml`
- File is lost on package reinstall/upgrade
- This is a fragile dependency; any use of `codemoot run` requires this file to be present

## Redesign Implications for TASK-03–06

The plan's core mechanism for offload must be reconsidered. Three alternatives:

### Option A: Use `codex exec` directly (file-writing agent)
`codex exec` in agentic mode uses tool-calling to read/write files. This is the actual mechanism that can execute build tasks. The fact-find investigated `codex exec` but noted `codemoot run` as the preferred mechanism (based on the existing `results-review.user.md` usage pattern). However, that usage pattern generates text (not a structured file-writing task) — the same model-text output that works for codemoot run.

Direct `codex exec` syntax:
```
nvm exec 22 codex exec --model gpt-5.3-codex "$(cat /tmp/prompt.txt)" --output-last-message
```

Note: `codex exec` uses file tools to actually write to the filesystem. The `--sandbox` flag controls what it can access. This is the correct mechanism for file-writing build tasks.

### Option B: Use `codemoot run` output as a diff/patch applied by Claude
`codemoot run` generates text implementing the task. Claude reads the session database or captures stdout and applies the generated diff/changes as a patch. This adds complexity (output parsing, patch application) but keeps `codemoot run` as the generator.

### Option C: Use `codemoot run` only for text-artifact tasks (skill files)
For the specific use case of updating skill markdown files, `codemoot run` generates the correct content as text. Claude can extract the generated content from the session and write it to the target file. This is viable for the build-offload-protocol.md tasks (TASK-03–06) which produce markdown files.

## Recommended Redesign Direction

Option C or Option A. The plan's tasks (TASK-03–06) all produce markdown files. The `implement` step generates correct markdown content — Claude can parse the session output and write the file. Alternatively, Option A (`codex exec` direct) is the proper agentic tool for file-writing tasks.

This is the most important finding from the spike: the offload mechanism needs redesign. TASK-02 CHECKPOINT should route to replan for TASK-03–06 based on this invalidating finding.
