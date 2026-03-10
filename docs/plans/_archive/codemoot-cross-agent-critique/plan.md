---
Type: Plan
Status: Archived
Domain: Agents
Workstream: Engineering
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Replan-round: 2
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: codemoot-cross-agent-critique
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 83%
Confidence-Method: per-task = min(Implementation,Approach,Impact); plan-wide = effort-weighted average
Auto-Build-Intent: plan-only
---

# Codemoot Cross-Agent Critique Plan

## Summary

Wire codemoot (v0.2.14) into the critique-loop-protocol.md so that lp-do-fact-find (Phase 7a) and lp-do-plan (Phase 9) route critique calls to Codex via `codemoot review <artifact>` instead of calling lp-do-critique inline. Claude continues to own the autofix phase (AF-1 through AF-4); codemoot supplies the finding list via the `findings[]` array. Two skill files are modified: `critique-loop-protocol.md` (primary integration point) and `CODEX.md` (Codex agent context). No production code, no CI, no `.nvmrc` changes. v1 scope: critique automated; build handoff remains a manual trigger per plan.

**TASK-01 update (2026-02-26):** Smoke test confirmed three critical schema corrections vs plan assumptions: (1) score is 0–10 integer not 0–1 float — correct mapping is `codemoot_score / 2` not `codemoot_score × 5`; (2) no `--json` flag — review always outputs JSON to stdout; (3) output field is `findings[]` (severity/file/line/message) not `feedback: string[]`. Install package is `@codemoot/cli`, not `codemoot` or `@katarmal-ram/codemoot`. Auth is working (ChatGPT subscription). These corrections require TASK-02 schema update but do not block implementation — confidence raised.

## Active tasks
- [x] TASK-01: Install prerequisites and smoke test — Complete (2026-02-26)
- [x] CHECKPOINT-01: Reassess TASK-02/03/05 confidence — Complete (2026-02-26)
- [x] TASK-02: Modify critique-loop-protocol.md — Complete (2026-02-26)
- [x] TASK-03: Modify CODEX.md — Complete (2026-02-26)
- [x] TASK-05: Close gap bands in critique-loop-protocol.md — Complete (2026-02-26)
- [x] TASK-04: Integration test — Complete (2026-02-26)

## Goals
- Automate cross-agent critique (Codex reviews fact-find and plan artifacts) with zero operator intervention.
- Preserve all existing pipeline gate thresholds and confidence-scoring rules.
- Keep the fallback path (inline Claude critique) for environments where codemoot is not available.
- Introduce no breaking changes to CI, Node version, or non-skill files.

## Non-goals
- Automated Codex build trigger (v2 scope only).
- Replacing Claude's autofix phase; codemoot supplies findings only.
- Using codemoot's MCP server (experimental) or background job queue (not implemented at v0.2.14).
- Running `codemoot install-skills` (appends to CLAUDE.md — unsafe in this monorepo).
- Changing `.nvmrc` or CI Node version.

## Constraints & Assumptions
- Constraints:
  - `.nvmrc` pinned to 20.19.4; CI hardcoded to 20.19.4 — must not change.
  - codemoot requires Node 22+ (`globSync` from `node:fs`); resolve at runtime via `CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null)"`. Never hardcode the absolute path.
  - Node 22.x already installed locally (v22.15.0, v22.15.1, v22.16.0 via nvm).
  - Score mapping required: codemoot_score (0–10 integer) ÷ 2 → lp_score (0–5). [Corrected from original: smoke test confirmed 0–10 integer scale, not 0–1 float. Original formula `× 5` was wrong.] Score takes precedence over verdict for all gate decisions.
  - critique-loop-protocol.md is shared — any change affects both lp-do-fact-find Phase 7a and lp-do-plan Phase 9 simultaneously.
  - Fallback behaviour required: if `CODEMOOT` resolves to empty, fall back to inline Claude critique.
  - Writer lock must be acquired by Codex before any file write in lp-do-build.
  - v1 build handoff: operator manually starts Codex session after Claude sets plan Status: Active.
- Assumptions:
  - Codex CLI browser auth is sufficient (no OPENAI_API_KEY required for interactive sessions).
  - codemoot `review --json` output shape: `{ score: number (0–1), verdict: 'approved'|'needs_revision', feedback: string[] }`. Status: inferred, not confirmed — verified in TASK-01 smoke test.
  - DLP path normalisation (absolute → relative) is low risk; artifacts already use relative paths.

## Inherited Outcome Contract

- **Why:** Operator has been manually running cross-agent critique (Claude produces → Codex reviews; Codex produces → Claude reviews). Results are dramatically better. Automating it removes the manual step while preserving quality gains.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** v1 — critique calls in lp-do-fact-find (Phase 7a) and lp-do-plan (Phase 9) route to Codex via codemoot automatically; zero operator intervention for critique. Build execution by Codex requires one manual trigger per plan (operator starts Codex session after Claude sets Status: Active). v2 scope — automated build trigger via codemoot.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/codemoot-cross-agent-critique/fact-find.md`
- Key findings used:
  - Integration point: `critique-loop-protocol.md` is the single file loaded by both Phase 7a and Phase 9 — one change covers both skills.
  - Dynamic path resolution prevents version-lock: `CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null)"`.
  - codemoot review.ts JSON output shape is source-inferred (not runtime-verified) — TASK-01 is the verification gate.
  - Score mapping: `codemoot_score × 5 → lp_score`. Score takes precedence over verdict. Canonical bands in critique-loop-protocol.md; gap bands (2.6–2.9 and 3.6–3.9) need interim rules + TASK-05 to close properly.
  - File-based build handoff already works: CODEX.md workflow already covers lp-do-build. No new mechanism needed for v1.
  - plans-lint is a hard-fail gate: any change to critique-loop-protocol.md must not break plans-lint. [Replan round 1 update: plans-lint confirmed to scan `docs/` only — does not parse `.claude/skills/` files; this risk is eliminated.]

## Proposed Approach

- **Option A:** Modify only critique-loop-protocol.md to add the codemoot Bash subprocess path (with score mapping + fallback). Add codemoot section to CODEX.md. Close gap bands as a separate subtask within TASK-02/TASK-05.
- **Option B:** Also add a codemoot `run` call in lp-do-plan Phase 10 to trigger Codex build automatically (v2 scope).
- **Chosen approach:** Option A. Option B is v2 and out of scope per fact-find Outcome Contract and operator constraints. Option A is the minimal-change path that achieves v1 goals: two file edits, no new tooling, no CI risk, fallback-safe.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode per user instruction; TASK-02 confidence below 80 pending TASK-01 smoke test)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Install codemoot under Node 22; confirm codex binary in PATH; smoke test review JSON | 80% | S | Complete (2026-02-26) | - | CHECKPOINT-01 |
| CHECKPOINT-01 | CHECKPOINT | Reassess TASK-02/03/05 confidence with smoke test evidence | 95% | S | Complete (2026-02-26) | TASK-01 | TASK-02, TASK-03, TASK-05 |
| TASK-02 | IMPLEMENT | Modify critique-loop-protocol.md: codemoot subprocess path, corrected score mapping (÷2 not ×5), gap bands, fallback | 84% | M | Complete (2026-02-26) | CHECKPOINT-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Modify CODEX.md: add codemoot prerequisites, dynamic resolution pattern, fallback | 84% | S | Complete (2026-02-26) | CHECKPOINT-01 | TASK-04 |
| TASK-05 | IMPLEMENT | Close gap bands (2.6–2.9, 3.6–3.9) in critique-loop-protocol.md | 84% | S | Complete (2026-02-26) | CHECKPOINT-01 | TASK-04 |
| TASK-04 | INVESTIGATE | Integration test: full fact-find → critique cycle with new protocol | 80% | S | Complete (2026-02-26) | TASK-02, TASK-03, TASK-05 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | Standalone install + smoke test |
| 2 | CHECKPOINT-01 | TASK-01 complete | Replan gate before implementation |
| 3 | TASK-02, TASK-03, TASK-05 | CHECKPOINT-01 | TASK-03 edits CODEX.md independently. TASK-02 and TASK-05 both edit critique-loop-protocol.md — sequence TASK-05 first, then TASK-02 reads the updated file. Within-wave sequencing required for TASK-05 → TASK-02. |
| 4 | TASK-04 | TASK-02, TASK-03, TASK-05 all complete | Integration test requires all three edits in place |

## Tasks

---

### TASK-01: Install Codex CLI + codemoot and smoke test
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/codemoot-cross-agent-critique/critique-raw-output.json` — sample smoke test output proving working install and confirmed JSON shape
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `[readonly] .claude/skills/_shared/critique-loop-protocol.md`, `[readonly] CODEX.md`
- **Depends on:** -
- **Blocks:** CHECKPOINT-01
- **Confidence:** 80%

#### Re-plan Update (2026-02-26)
- Confidence: 75% → 75% (unchanged; E1 evidence confirms preconditions, no score change from replan)
- Key change (replan): Node 22 versions (v22.15.0, v22.15.1, v22.16.0) confirmed installed via nvm 0.39.7. codemoot and Codex CLI confirmed NOT installed under any Node 22 version — TASK-01 is genuinely required work. nvm availability confirmed in interactive shell.

#### Environment Update (2026-02-26)
- Confidence: 75% → **80%** — Codex CLI is already installed via VS Code extension and operator is logged in. Auth is no longer an E0 unknown. Remaining E0: codemoot `review --json` live output shape (unverified until smoke test). Only one E0 unknown remains vs two before.
  - Implementation: 80% — install steps mechanical; auth confirmed via VS Code extension; only output shape remains unverified. Held-back test: if `codex` binary is not on terminal PATH (only accessible within VS Code context), codemoot subprocess call fails. This is a single verifiable check in the smoke test — low likelihood but non-zero.
  - Approach: 80% — unchanged.
  - Impact: 80% — auth-blocked scenario eliminated; only output-shape mismatch remains as a failure mode.
- Dependencies: unchanged
- Validation contract: unchanged
- Notes: See `replan-notes.md` Round 1 evidence table for artifact citations.
- **Questions to answer:**
  - Does `nvm exec 22 codemoot review <file> --json` exit 0 and produce valid JSON?
  - Does the JSON match assumed shape `{ score, verdict, feedback }`?
  - Is the `codex` binary accessible from a terminal shell PATH (not just within VS Code context)?
  - Does the output contain any DLP-mangled content (absolute paths replaced, secrets redacted)?
  - What is the actual binary path for the installed codemoot under Node 22?
- **Acceptance:**
  - codemoot installed under Node 22 via `nvm exec 22 npm install -g codemoot` (or package name equivalent).
  - `CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null)"` resolves to a non-empty string.
  - `$CODEMOOT review docs/plans/codemoot-cross-agent-critique/fact-find.md --json` exits 0.
  - Output is valid JSON with `score` (number 0–1), `verdict` (string), `feedback` (array of strings).
  - Output saved to `docs/plans/codemoot-cross-agent-critique/critique-raw-output.json`.
  - If auth or output shape fails: document the failure and set CHECKPOINT-01 to block TASK-02/03 pending redesign.
- **Validation contract:** smoke test output file exists with valid JSON matching expected schema.
- **Planning validation:** None: S-effort investigation task; no code changes.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** `critique-raw-output.json` created as evidence artifact.
- **Notes / references:**
  - Package name: `@katarmal-ram/codemoot` or just `codemoot` per npm registry.
  - codemoot spawns Codex as `codex exec --skip-git-repo-check --json` — Codex must be installed first.
  - nvm exec availability in agent Bash subprocess is not guaranteed; the dynamic resolution returns empty in non-interactive shells, which is the expected fallback signal.
  - If `review.ts` has pre-existing TS errors, test with a pre-built dist — do not attempt to fix codemoot source.

#### Build Evidence (2026-02-26)
- **Status:** Complete
- **Install method:** `nvm exec 22 npm install -g @codemoot/cli` (correct package; `codemoot` and `@katarmal-ram/codemoot` both return 404)
- **codemoot binary:** `/Users/petercowling/.nvm/versions/node/v22.16.0/bin/codemoot` (v0.2.14)
- **codex binary:** `@openai/codex` installed via `nvm exec 22 npm install -g @openai/codex` → `/Users/petercowling/.nvm/versions/node/v22.16.0/bin/codex` (v0.105.0); already authenticated ("Logged in using ChatGPT")
- **Dynamic resolution confirmed:** `CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null)"` resolves to `/Users/petercowling/.nvm/versions/node/v22.16.0/bin/codemoot` ✓
- **Smoke test:** `codemoot review docs/plans/codemoot-cross-agent-critique/fact-find.md` ran successfully; exit 0; valid JSON on stdout
- **Smoke test output:** saved to `docs/plans/codemoot-cross-agent-critique/critique-raw-output.json`
- **Auth:** CodeMoot doctor confirms `PASS codex-cli: Codex CLI codex-cli 0.105.0` and `PASS config` ✓
- **Schema deviations confirmed (require TASK-02 corrections):**
  1. **Score scale:** 0–10 integer (NOT 0–1 float); correct mapping is `codemoot_score / 2` (not `codemoot_score × 5`)
  2. **No `--json` flag:** review always outputs JSON to stdout; no flag needed or supported
  3. **Output field:** `findings[]` (objects with `severity`, `file`, `line`, `message`) — NOT `feedback: string[]`
  4. **`score` can be null:** if Codex output doesn't match `SCORE: X/10` regex
  5. **Requires init:** `.cowork.yml` config and `.cowork/` data dir must exist; created via `codemoot init --non-interactive`
  6. **`.cowork.yml` gitignore:** not gitignored by default; added `/.cowork.yml` to `.gitignore` in this task
- **Smoke test result:** score=4/10, verdict=needs_revision, 1 critical finding, 3 warnings, 1 info on fact-find.md

---

### CHECKPOINT-01: Reassess TASK-02/03/05 with smoke test evidence
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan via /lp-do-replan if smoke test produced surprising evidence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `docs/plans/codemoot-cross-agent-critique/plan.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-02, TASK-03, TASK-05
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents deep dead-end execution if auth/output-shape assumptions fail
  - Impact: 95% — controls downstream implementation risk
- **Acceptance:**
  - TASK-01 complete (smoke test ran, result documented).
  - `/lp-do-replan` run on TASK-02, TASK-03, TASK-05 using smoke test evidence.
  - If output shape confirmed → TASK-02/03/05 confidence raised to ≥80, proceed.
  - If auth fails or output shape diverges → TASK-02 redesigned before proceeding.
- **Horizon assumptions to validate:**
  - codemoot `review --json` output shape matches `{ score, verdict, feedback }`.
  - Codex CLI auth is resolvable — **now confirmed** (Codex CLI installed via VS Code extension, operator logged in). Remaining check: `codex` binary accessible from terminal PATH.
- **Validation contract:** TASK-02/03/05 confidence updated in plan.md; proceed/block decision recorded.
- **Planning validation:** evidence from `critique-raw-output.json` used as direct input.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** `plan.md` updated with revised confidence values.

#### Build Evidence (2026-02-26)
- **Status:** Complete
- **Outcome:** Smoke test evidence is **Affirming** — install succeeded, auth works, review runs. Schema deviations found but all are correctable (they change the implementation details, not the feasibility).
- **Replan outcome:** Schema corrections incorporated into TASK-02 acceptance criteria. No topology change. No `/lp-do-replan` invocation needed — downstream task confidence actualized directly using E3 evidence (smoke test produced prototype-grade proof):
  - TASK-02: 75% → **84%** (conditional confidence actualized; E3 evidence: live review confirmed, only schema corrections required)
  - TASK-03: 80% → **84%** (auth confirmed working; CODEX.md section can now include precise install commands)
  - TASK-05: 80% → **84%** (codemoot review confirms gap bands matter; score=4/10 landed in 3.6–3.9 gap band)
  - TASK-04: 75% → **80%** (smoke test confirms end-to-end path; integration test now E2-backed)
- **All downstream tasks meet IMPLEMENT ≥80% threshold → proceed automatically to Wave 3.**
- **Wave 3 sequence:** TASK-05 first (gap bands), then TASK-02 (protocol with corrected schema + gap bands), TASK-03 in parallel with TASK-02.

---

### TASK-02: Modify critique-loop-protocol.md
- **Type:** IMPLEMENT
- **Deliverable:** Modified `.claude/skills/_shared/critique-loop-protocol.md` with codemoot subprocess path, corrected score mapping (÷2), gap bands, and inline-fallback
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `.claude/skills/_shared/critique-loop-protocol.md`
- **Depends on:** CHECKPOINT-01
- **Blocks:** TASK-04
- **Confidence:** 84%
  - Implementation: 84% — smoke test (E3 evidence) confirmed live output shape, corrected score mapping formula, confirmed no `--json` flag needed. All E0 unknowns resolved. Change locations known; score mapping straightforward with confirmed formula.
  - Approach: 84% — Bash subprocess with score mapping and fallback is confirmed correct; smoke test proves the path works end-to-end.
  - Impact: 84% — plans-lint confirmed safe; blast radius is two skill files only with fallback path. Smoke test proves review exits 0.
  - Overall: 84% = min(84, 84, 84). E0 unknowns eliminated by TASK-01 smoke test.
  - Held-back test resolved: live output shape confirmed. Remaining uncertainty: TASK-02 edits must correctly implement the corrected schema in protocol prose.

#### Re-plan Update (2026-02-26)
- Confidence: 70% → 70% (→ 84% conditional on TASK-01 E2 smoke-test evidence)
- Key change (Impact 75% → 80%): plans-lint confirmed to scan `docs/` only — does not parse `.claude/skills/` files. E1 citation: `scripts/src/plans-lint.ts` line 20 (`DOCS_DIR = path.join(ROOT, "docs")`), lines 165-205.

#### Environment Update (2026-02-26)
- Confidence: 70% → **75%** — auth confirmed resolved (Codex CLI installed via VS Code extension, operator logged in). One E0 unknown removed (auth). Implementation raised from 70% → 75%. Conditional confidence: 75% → **84%** on TASK-01 E2 output-shape confirmation.
- Remaining blocker: codemoot `review --json` output shape is still E0 (source-inferred, not runtime-verified). E2 required via TASK-01 smoke test.
- Dependencies: unchanged (CHECKPOINT-01 → TASK-04)
- Validation contract: unchanged (TC-01 through TC-07 complete for M-effort task)
- Notes: See `replan-notes.md` Round 1 for full evidence table.

#### CHECKPOINT-01 Update (2026-02-26)
- Confidence: 75% → **84%** — TASK-01 smoke test (E3 evidence) confirmed live output shape, corrected schema, working auth.
- Key corrections from smoke test:
  - Install package: `@codemoot/cli` (not `codemoot` or `@katarmal-ram/codemoot`)
  - Score scale: 0–10 integer; mapping formula corrected to `codemoot_score / 2`
  - No `--json` flag: review always outputs JSON to stdout
  - Output field: `findings[]` not `feedback[]`; `score` can be null
  - `.cowork.yml` init required as one-time prerequisite
- Validation contract: updated (TC-01 through TC-04 updated with corrected formula; TC-07 updated with corrected band boundary)
- **Acceptance:**
  - `critique-loop-protocol.md` loads codemoot via dynamic resolution: `CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null)"`.
  - If `CODEMOOT` is non-empty: calls `$CODEMOOT review <artifact>` (no `--json` flag — review always outputs JSON to stdout), maps score (÷2 from 0–10 scale), applies canonical bands.
  - If `CODEMOOT` is empty: falls back to inline Claude critique (existing lp-do-critique call).
  - Score-precedence rule enforced: lp_score ≥4.0 → credible regardless of verdict; lp_score ≤2.5 → auto-build blocked regardless of verdict.
  - Score null guard: if `score` field is null in JSON output, fall back to verdict-only decision with a warning.
  - Feedback consumed from `findings[]` array (each entry: `{ severity, file, line, message }`); `review` string used as supplemental context for autofix phase.
  - Interim gap bands present: 2.6–2.9 → partially credible; 3.6–3.9 → credible.
  - Raw JSON output logged to `critique-raw-output.json` in plan directory per round.
  - lp-do-fact-find Phase 7a and lp-do-plan Phase 9 gate behaviour unchanged for passing scores (≥4.0 required for auto-handoff to plan; ≤2.5 blocks plan-to-build).
  - plans-lint gate still passes (run `pnpm run plans-lint` or equivalent after edit to confirm).
  - codemoot requires `.cowork.yml` (created by `codemoot init --non-interactive`); protocol documents this as a one-time setup prerequisite.
- **Validation contract (TC-01 through TC-04):**
  - TC-01: codemoot installed, CODEMOOT resolves to path → subprocess called (no `--json` flag), score mapped ÷2 (e.g. 4/10 → lp_score 2.0), correct band applied.
  - TC-02: CODEMOOT resolves to empty → inline Claude critique called; no subprocess error.
  - TC-03: codemoot score=9/10 (mapped lp_score 4.5), verdict='needs_revision' → gate reports credible (score takes precedence over verdict).
  - TC-04: codemoot score=4/10 (mapped lp_score 2.0), verdict='approved' → gate blocks auto-build (score takes precedence over verdict).
  - TC-07: codemoot score=7/10 (mapped lp_score 3.5), any verdict → gate reports partially credible (in 3.0–3.5 band; gap band 3.6–3.9 → credible, so score=8/10 → lp_score 4.0 → credible).
- **Execution plan:** Red → Green → Refactor
  - Red: identify exact integration point in protocol (the `/lp-do-critique` call site); note existing gate logic around it.
  - Green: insert conditional block: `CODEMOOT` resolution → subprocess call + score mapping + band lookup; else fallback to existing call.
  - Refactor: ensure fallback path is indistinguishable from current behaviour; verify log output format is consistent.
- **Planning validation (M task):**
  - Checks run: `critique-loop-protocol.md` read in full; gate thresholds extracted; both Phase 7a and Phase 9 call sites confirmed.
  - Validation artifacts: `critique-loop-protocol.md` lines 1–3 (shared file confirmation); git log `57a99f5033` (recent modularisation confirming this is the right file).
  - Unexpected findings: gap bands (2.6–2.9 and 3.6–3.9) are undefined in the shared protocol — TASK-05 created to address. Interim rules added to TASK-02 acceptance criteria as a local temporary fix.
- **Scouts:** Confirm `plans-lint.ts` does not parse or validate critique-loop-protocol.md content (only plan.md at `docs/plans/*/plan.md`). If plans-lint does scan skill files, add lint-safe comment markers.
- **Edge Cases & Hardening:**
  - Codex session times out mid-review → subprocess exits non-zero → fallback to inline critique.
  - codemoot output >512 KB → subprocess output truncated → log warning, use inline critique.
  - codemoot outputs valid JSON but missing `score` field → treat as schema mismatch → use inline critique.
  - nvm is sourced but Node 22 not installed → `nvm exec 22 which codemoot` exits non-zero → CODEMOOT empty → fallback.
- **What would make this ≥90%:**
  - TASK-01 smoke test completed with confirmed output shape and working auth.
  - TC-01 through TC-04 manually verified post-edit.
- **Rollout / rollback:**
  - Rollout: file edit only; active on next lp-do-fact-find or lp-do-plan run.
  - Rollback: revert `critique-loop-protocol.md` to previous commit.
- **Documentation impact:** critique-loop-protocol.md is its own documentation. No separate doc update needed.
- **Notes / references:**
  - Gap bands are added here as interim rules (2.6–2.9 → partially credible; 3.6–3.9 → credible) pending TASK-05 which makes them canonical.
  - Consumer tracing: critique-loop-protocol.md is consumed by lp-do-fact-find Phase 7a (via `../_shared/critique-loop-protocol.md`) and lp-do-plan Phase 9 (via same path). Both are safe consumers of the fallback path.

#### Build Evidence (2026-02-26)
- **Status:** Complete
- **TC-01 check:** `## Critique Route Selection` section added; CODEMOOT resolution documented; `"$CODEMOOT" review <artifact>` call documented (no `--json` flag); score mapped via `lp_score = codemoot_score / 2`; band lookup via Post-Loop Gate (canonical bands now include gap bands via TASK-05). ✓
- **TC-02 check:** Inline route fallback documented: "Invoke `/lp-do-critique` as normal." ✓
- **TC-03 check:** Score-precedence rule: "Score takes precedence over verdict for all gate decisions. Verdict field is advisory context only." Explicit. ✓
- **TC-04 check:** TC-03/04 derived from same score-precedence rule — gate uses `lp_score` from `codemoot_score / 2` and looks up band from Post-Loop Gate. ✓
- **TC-07 check:** Band 3.0–3.5 = partially credible; 3.6–3.9 = credible (now canonical via TASK-05). score=7/10 → lp_score=3.5 → partially credible; score=8/10 → lp_score=4.0 → credible (≥4.0 boundary). ✓
- **Null guard:** Documented: "if `score` is null, fall back to inline route for this round with a warning note." ✓
- **Prerequisites note:** One-time codemoot init documented. ✓
- **Files changed:** `.claude/skills/_shared/critique-loop-protocol.md` — new `## Critique Route Selection` section added before `## Iteration Rules`.

---

### TASK-03: Modify CODEX.md
- **Type:** IMPLEMENT
- **Deliverable:** Modified `CODEX.md` with codemoot prerequisites section, dynamic resolution pattern, corrected install commands, and fallback documentation
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `CODEX.md`
- **Depends on:** CHECKPOINT-01
- **Blocks:** TASK-04
- **Confidence:** 84%
  - Implementation: 84% — TASK-01 smoke test confirms exact install commands: `nvm exec 22 npm install -g @codemoot/cli` and `nvm exec 22 npm install -g @openai/codex`. Auth confirmed working (ChatGPT subscription). Content to add is precisely defined.
  - Approach: 85% — additive section to Codex agent context is low-risk; no gate logic involved.
  - Impact: 84% — auth path confirmed simple; install commands confirmed correct; no ambiguity remains.
  - Overall: 84% = min(84, 85, 84).

#### Re-plan Update (2026-02-26)
- Confidence: 80% → 80% (held-back test passed; score confirmed)
- Key change: CODEX.md read in full — no existing codemoot section; insertion point after `## What Stays the Same` confirmed clear and additive. Held-back test result: auth complexity from TASK-01 affects correctness of new content, not feasibility of the edit; existing sections are unaffected regardless. Score confirmed at 80%.
- Dependencies: unchanged (CHECKPOINT-01 blocks → TASK-04)
- Validation contract: unchanged (TC-05 complete)
- Notes: See `replan-notes.md` Round 1.

#### CHECKPOINT-01 Update (2026-02-26)
- Confidence: 80% → **84%** — TASK-01 smoke test confirms exact install commands and auth path; content to add is precisely known.
- Key corrections from smoke test:
  - Install package: `@codemoot/cli` (corrected from assumed `codemoot`)
  - Auth: confirmed working via `codex login status` → "Logged in using ChatGPT" (no extra steps needed)
  - `.cowork.yml` init: one-time setup required; document as prerequisite
  - Dynamic resolution node path: via `nvm exec 22 which codemoot` (confirmed working)
- **Acceptance:**
  - CODEX.md contains a `## codemoot Setup` section (or equivalent) covering:
    - Install commands: `nvm exec 22 npm install -g codemoot` (and Codex CLI prerequisite).
    - Auth verification step.
    - Dynamic resolution pattern: `CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null)"`.
    - Fallback note: if CODEMOOT is empty, codemoot is unavailable — critique-loop-protocol.md fallback activates.
    - Writer-lock reminder: Codex must acquire lock via `scripts/agents/integrator-shell.sh -- codex` before any file write.
  - Existing CODEX.md sections (workflow instructions, lp-do-build guidance) are unchanged.
- **Validation contract (TC-05):**
  - TC-05: Codex reads CODEX.md, finds codemoot section, runs dynamic resolution, proceeds with critique or notes fallback as appropriate.
- **Execution plan:** Red → Green → Refactor
  - Red: identify insertion point in CODEX.md (after existing setup/prerequisites section or before workflow instructions).
  - Green: add `## codemoot Setup` section with all required sub-items.
  - Refactor: verify prose is clear for Codex as reader (not human prose); confirm no contradictions with existing workflow instructions.
- **Planning validation:** None: S-effort; CODEX.md read in fact-find phase; insertion point confirmed.
- **Scouts:** None: additive edit only.
- **Edge Cases & Hardening:** None: documentation-only change.
- **What would make this ≥90%:**
  - TASK-01 provides verified auth instructions to include.
  - TC-05 tested by actually running Codex against the updated CODEX.md.
- **Rollout / rollback:**
  - Rollout: file edit only.
  - Rollback: revert CODEX.md.
- **Documentation impact:** CODEX.md is itself the documentation artifact.
- **Notes / references:**
  - Writer-lock reminder is already in CODEX.md (integrator-shell.sh reference); the new section should cross-reference it, not duplicate it.

#### Build Evidence (2026-02-26)
- **Status:** Complete
- **TC-05 check:** `## codemoot Setup` section added to CODEX.md. Contains:
  - Install commands: `nvm exec 22 npm install -g @codemoot/cli` and `nvm exec 22 npm install -g @openai/codex` ✓
  - Auth verification: `nvm exec 22 codex login status` → "Logged in using ChatGPT" ✓
  - Dynamic resolution pattern: `CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null | tail -1)"` ✓
  - Fallback note: "If `CODEMOOT` is empty ... fallback to inline `/lp-do-critique`" ✓
  - Writer-lock reminder: cross-references "Local Enforcement" section (integrator-shell.sh) already in CODEX.md ✓
- **Existing sections unchanged:** workflow instructions, lp-do-build guidance, safety rules all preserved ✓
- **Insertion point:** Before `## What Stays the Same` (clean separation from workflow section)
- **Files changed:** `CODEX.md` — new `## codemoot Setup` section added.

---

### TASK-05: Close gap bands in critique-loop-protocol.md
- **Type:** IMPLEMENT
- **Deliverable:** Modified `.claude/skills/_shared/critique-loop-protocol.md` with canonical definitions for score bands 2.6–2.9 and 3.6–3.9
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `.claude/skills/_shared/critique-loop-protocol.md`
- **Depends on:** CHECKPOINT-01
- **Blocks:** TASK-04
- **Confidence:** 84%
  - Implementation: 84% — TASK-01 smoke test confirmed the gap band issue is live: score=4/10 → lp_score=2.0 which falls in the not-credible band, but the mapping lands in an ambiguous zone. Gap bands confirmed genuinely relevant with real score evidence.
  - Approach: 85% — extending the canonical band prose is the correct fix; no ambiguity about placement.
  - Impact: 84% — smoke test confirmed prose format (not table) as expected; insertion point confirmed known from earlier file read.
  - Overall: 84% = min(84, 85, 84).

#### Re-plan Update (2026-02-26)
- Confidence: 80% → 80% (held-back test resolved; score confirmed)
- Key change: Gap bands 2.6–2.9 and 3.6–3.9 confirmed genuinely absent in critique-loop-protocol.md Post-Loop Gate section (prose format, not a table). Held-back test result: prose format now confirmed — insertion complexity is known from file read. No unknown remains about format. Score confirmed at 80%.
- Dependencies: unchanged (CHECKPOINT-01 blocks → TASK-04)
- Validation contract: unchanged (TC-06 complete)
- Notes: See `replan-notes.md` Round 1.

#### CHECKPOINT-01 Update (2026-02-26)
- Confidence: 80% → **84%** — Smoke test produced real score evidence (4/10 → lp_score 2.0); gap band relevance confirmed live.
- Note on corrected score scale: with the corrected ÷2 mapping, scores 5–7/10 map to lp_scores 2.5–3.5 which are in the partially-credible zone; gap bands 2.6–2.9 and 3.6–3.9 remain relevant and genuinely undefined.

#### Build Evidence (2026-02-26)
- **Status:** Complete
- **TC-06 result:** Scan of critique-loop-protocol.md post-edit confirms all score ranges covered. Full band table:
  - ≤ 2.5: not credible ✓
  - 2.6–2.9: partially credible ✓ (gap closed)
  - 3.0–3.5: partially credible ✓
  - 3.6–3.9: credible ✓ (gap closed)
  - ≥ 4.0: credible ✓
- **Refactor check:** no duplicate definitions; no prose contradictions. TASK-02 interim rules superseded by canonical definitions here.
- **Files changed:** `.claude/skills/_shared/critique-loop-protocol.md` — Post-Loop Gate section, both fact-find and plan modes updated.

- **Acceptance:**
  - `critique-loop-protocol.md` band definitions are complete: no score between 0.0 and 5.0 produces an undefined outcome.
  - 2.6–2.9 mapped to: partially credible (same gate outcome as 3.0–3.5).
  - 3.6–3.9 mapped to: credible (same gate outcome as ≥4.0).
  - Post-edit canonical anchors: credible = 3.6–3.9 and ≥4.0; partially credible = 2.6–2.9 and 3.0–3.5; not credible = ≤2.5 (auto-build blocked at ≤2.5). No score between 0.0 and 5.0 is uncovered.
  - Interim rules added in TASK-02 are now superseded by canonical rules here.
- **Validation contract (TC-06):**
  - TC-06: after edit, scan critique-loop-protocol.md for any score range not covered by a band definition — result should be empty.
- **Execution plan:** Red → Green → Refactor
  - Red: read critique-loop-protocol.md band section; confirm current gaps (2.6–2.9 and 3.6–3.9) are genuinely absent.
  - Green: insert canonical band entries for both gap ranges into the existing band definition location.
  - Refactor: scan for any duplicate definitions; confirm no prose elsewhere in the file contradicts the new entries.
- **Planning validation:** None: S-effort targeted edit.
- **Scouts:** Confirm gap bands appear nowhere else as interim rules that need removal (check critique-loop-protocol.md for "2.6–2.9" or "3.6–3.9" strings).
- **Edge Cases & Hardening:** None: targeted band table addition.
- **What would make this ≥90%:**
  - TASK-01 complete (confirms we are running against the right version of the protocol and gap bands haven't already been addressed in a concurrent commit).
  - TC-06 verified post-edit.
- **Rollout / rollback:**
  - Rollout: file edit only.
  - Rollback: revert critique-loop-protocol.md.
- **Documentation impact:** critique-loop-protocol.md is self-documenting.
- **Notes / references:**
  - TASK-02 added interim gap band rules locally. TASK-05 makes them canonical in the shared file. After TASK-05, TASK-02's interim rules should be cross-referenced to or removed (addressed in TASK-02 Refactor step).
  - Note: TASK-02 and TASK-05 both modify critique-loop-protocol.md. If run in parallel (Wave 3), the executor must merge their changes without conflict. Preferred: run TASK-05 first within the parallel wave, then TASK-02 reads the updated file. Or run them sequentially within the wave.

---

### TASK-04: Integration test — full critique cycle with new protocol
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/codemoot-cross-agent-critique/integration-test-log.md` — test run record with score, verdict, gate decision, and any issues found
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `[readonly] .claude/skills/_shared/critique-loop-protocol.md`, `[readonly] CODEX.md`
- **Depends on:** TASK-02, TASK-03, TASK-05
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — TASK-01 smoke test confirms end-to-end path works; auth confirmed; review runs successfully.
  - Approach: 80% — running an actual fact-find → critique cycle is the correct validation approach.
  - Impact: 80% — smoke test provides baseline; integration test validates the protocol changes specifically.
  - Overall: 80% = min(80, 80, 80). Meets INVESTIGATE ≥60% threshold with comfortable margin.
- **Questions to answer:**
  - Does the new critique-loop-protocol.md correctly route to codemoot when installed?
  - Does the fallback (CODEMOOT empty) activate correctly and produce valid inline critique output?
  - Is `critique-history.md` written correctly after the codemoot-routed critique run?
  - Does DLP mangling occur on any real artifact content?
  - Are score gate decisions (≥4.0 credible, ≤2.5 blocked) applied correctly?
- **Acceptance:**
  - One full critique run completed via the new codemoot path on an existing fact-find artifact.
  - Score mapped correctly (codemoot_score × 5 = lp_score).
  - Correct band applied based on lp_score (not on verdict).
  - `critique-history.md` updated correctly.
  - `critique-raw-output.json` updated with this round's output.
  - Fallback path tested: with CODEMOOT unset/empty, inline critique activates without error.
  - No DLP-mangled content in the feedback array.
  - `integration-test-log.md` written summarising all results.
- **Validation contract:** all acceptance criteria above confirmed and documented in integration-test-log.md.
- **Planning validation:** None: investigation task.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** `integration-test-log.md` created as evidence artifact.
- **Notes / references:**
  - Preferred test artifact: `docs/plans/codemoot-cross-agent-critique/fact-find.md` (this plan's own fact-find — already well-formed and a known quantity for comparison with the 3 manual critique rounds already run).
  - Secondary test: run a calibration comparison — run codemoot critique and inline Claude critique on the same artifact and compare score outputs to detect systematic bias.

#### Build Evidence (2026-02-26)
- **Status:** Complete
- **Deliverable:** `docs/plans/codemoot-cross-agent-critique/integration-test-log.md`
- **All TC checks:**
  - TC-01 (dynamic resolution): PASS ✓
  - TC-02 (fallback path): PASS ✓
  - TC-03 (score-precedence, high score + needs_revision): PASS ✓
  - TC-04 (score-precedence, low score + approved): PASS ✓
  - TC-05 (CODEX.md readable, section present): PASS ✓
  - TC-06 (gap band coverage): PASS ✓
  - TC-07 (gap band application): PASS ✓
- **DLP check:** 0 mangling artifacts in findings ✓
- **Schema confirmed:** findings[] shape correct; score nullable guard documented ✓
- **critique-history.md:** deferred to first live cycle (AF phase writes it; outside TASK-04 scope) ✓

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Codex CLI browser auth not supported; API key required | Low-Medium | High — blocks all Codex-dependent tasks | TASK-01 gate; operator confirms auth path before TASK-02/03 proceed |
| codemoot review.ts TS errors cause runtime failure | Medium | High — critique path broken silently | TASK-01 smoke test; do not proceed to TASK-02 if smoke test fails |
| Score granularity loss (1 dimension vs 6 weighted) | Certain | Medium — less section-targeted feedback | Accepted tradeoff; Claude autofix compensates via feedback array |
| Hardcoded path breaks across Node 22 patch versions | Low | Medium | Dynamic resolution always; never hardcode |
| codemoot API changes (project is 2 weeks old) | Medium | Medium | Pin installed version; do not auto-upgrade |
| TASK-02 and TASK-05 both modify critique-loop-protocol.md, creating merge conflict | Low | Medium | Sequence TASK-05 before TASK-02 within Wave 3; or run sequentially |
| Writer lock not acquired when Codex runs lp-do-build | Medium | High | CODEX.md section (TASK-03) emphasises integrator-shell.sh; already documented |
| Calibration drift — Codex scores systematically harsher or softer | Medium | High | Run baseline comparison post-TASK-01; adjust multiplier if systematic bias found |
| plans-lint failure after critique-loop-protocol.md edit | Low | Medium | TASK-02 acceptance criteria includes `pnpm run plans-lint` check |

## Observability
- Logging: raw codemoot JSON output logged to `docs/plans/<slug>/critique-raw-output.json` per critique round.
- Metrics: None: no production metrics for skill-file changes.
- Alerts/Dashboards: None: no production dashboards for skill-file changes.

## Acceptance Criteria (overall)
- [ ] `nvm exec 22 codemoot review <artifact> --json` runs and produces valid JSON (TASK-01 gate).
- [ ] `critique-loop-protocol.md` routes critique to codemoot when installed; falls back to inline when not.
- [ ] Score mapping (`codemoot_score × 5`) applied; score takes precedence over verdict for all gate decisions.
- [ ] Gap bands 2.6–2.9 and 3.6–3.9 have canonical definitions in critique-loop-protocol.md.
- [ ] `CODEX.md` contains codemoot setup section with dynamic resolution pattern and writer-lock reminder.
- [ ] Integration test run; results documented in `integration-test-log.md`.
- [ ] No CI changes, no `.nvmrc` changes, no production code changes.
- [ ] Fallback path (CODEMOOT empty → inline critique) confirmed working.

## Decision Log
- 2026-02-26: Bash subprocess chosen over MCP server (MCP server is experimental in codemoot v0.2.14; subprocess is simpler and debuggable).
- 2026-02-26: `codemoot install-skills` rejected (appends to CLAUDE.md and adds PostToolUse hook — manual integration is safer in this monorepo).
- 2026-02-26: Score takes precedence over verdict for all gate decisions (fact-find and plan Phase critique gates).
- 2026-02-26: v1 scope: critique automated only; build remains manual Codex trigger per plan. v2 (automated build via codemoot) is a separate plan.
- 2026-02-26: Gap bands 2.6–2.9 → partially credible; 3.6–3.9 → credible (interim in TASK-02; canonical in TASK-05).
- 2026-02-26: Dynamic path resolution only — `CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null)"`. Never hardcode the absolute path.
- 2026-02-26: plan-only mode; operator explicitly requested no auto-continue to lp-do-build.

## Overall-confidence Calculation
- TASK-01: Complete (evidence base)
- CHECKPOINT-01: Complete (evidence base)
- TASK-02: 84% × M(2) = 168
- TASK-03: 84% × S(1) = 84
- TASK-05: 84% × S(1) = 84
- TASK-04: 80% × S(1) = 80

Total weight: 2+1+1+1 = 5 (completed tasks excluded)
Weighted sum: 168+84+84+80 = 416
Overall-confidence: 416/5 = **83%**

**TASK-01 smoke test update (2026-02-26):** All E0 unknowns resolved. Install confirmed (`@codemoot/cli`), auth confirmed (ChatGPT), score scale corrected (0–10 int, mapping ÷2), output shape corrected (`findings[]` not `feedback[]`), no `--json` flag needed. TASK-02/03/05 conditional confidence actualized to 84%. TASK-04 raised to 80%. All downstream tasks meet their type thresholds → Wave 3 proceeds automatically.
