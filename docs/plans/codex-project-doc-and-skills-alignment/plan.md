---
Type: Plan
Status: Active
Domain: Repo
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Relates-to charter: none
Feature-Slug: codex-project-doc-and-skills-alignment
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-factcheck
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# Codex Project Docs + Skills Alignment Plan

## Summary

This plan makes Codex startup instructions and skill discovery reliable without adding maintenance debt. It has two outcomes: (1) eliminate AGENTS.md truncation risk and keep critical instructions in always-loaded docs; (2) provide native Codex skill discovery via `.agents/skills/` with robust validation. The plan explicitly avoids mechanisms that are ineffective with Codex loader semantics (`project_doc_fallback_filenames` as an additive loader at directories where `AGENTS.md` already exists).

## Active tasks
- [ ] TASK-01: Refactor AGENTS.md to a durable size budget and preserve canonical rules
- [x] TASK-02: Add `.codex/config.toml` with only effective project-doc controls - **Complete (2026-02-28)**
- [ ] TASK-03: Move Codex-critical guidance into always-loaded instruction surface
- [ ] TASK-04: Create `.agents/skills/` native discovery mirror
- [ ] TASK-05: Add strong skills integrity validation
- [x] TASK-06: Repair and gate skill registry drift - **Complete (2026-02-28)**
- [ ] TASK-07: Wire validation into local and CI gates
- [ ] TASK-08: Checkpoint verification (docs loading + skills discovery)

## Goals
- Ensure root project instructions are never silently truncated in normal growth scenarios.
- Ensure Codex can discover all repo skills natively without scanning AGENTS.md lists.
- Remove brittle hardcoded skill counts and replace with filesystem-derived validation.
- Keep a single-source-of-truth instruction strategy with low maintenance overhead.

## Non-goals
- Renaming skill directories.
- Reworking Claude Code skill behavior.
- Introducing generated skill copies.
- Changing startup-loop or `lp-*` skill semantics.

## Constraints & Assumptions
- Constraints:
  - Root runbook remains `AGENTS.md` and must preserve core policy sections.
  - Plan must avoid dual-authoritative instruction files that can drift.
  - Skill discovery should stay compatible with Codex native loader semantics.
  - Validation must be fast and deterministic (filesystem checks only).
- Assumptions:
  - Codex loader semantics from `codex-rs/core/src/project_doc.rs` and `skills/loader.rs` are authoritative for current behavior. **Empirically verified** (Codex CLI 0.105.0 live execution test): `project_doc_fallback_filenames = ["CODEX.md"]` had no effect when `AGENTS.md` existed at the same directory level; `CODEX.md` instructions did not apply.
  - `.claude/skills/` remains canonical skill content location.
  - `.codex/config.toml` at repo root is auto-trusted by Codex without explicit user opt-in. **Verify before TASK-02 ship.**

## Inherited Outcome Contract
- **Why:** Codex instruction loading currently risks silent truncation, and native skill discovery is absent (`.agents/skills/` missing).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Codex always receives complete critical runbook content and discovers skills natively through `.agents/skills/`, with CI/local checks preventing regressions.
- **Source:** operator

## Fact-Find Reference
- Evidence source: in-session repo audit on 2026-02-28.
- Verified key facts:
  - `AGENTS.md` = 34,557 bytes.
  - Truncation starts around line 399 at 32,833 bytes under 32 KiB default.
  - `.agents/skills/` is missing.
  - `.codex/config.toml` is missing.
  - `.claude/skills/` has 76 skill directories with `SKILL.md`.
  - `.agents/registry/skills.json` is out of date (`generate-skill-registry --check` fails).

## Proposed Approach
- Option A: Keep `AGENTS.md` large and rely on `project_doc_fallback_filenames = ["CODEX.md"]`.
- Option B: Use `AGENTS.override.md` as Codex-only delta file.
- Option C (chosen): Keep a single canonical always-loaded instruction path (`AGENTS.md` + size budget + effective max-byte config), and use native `.agents/skills/` discovery with strong validation.

Chosen approach rationale:
- Option A fails at root directories where `AGENTS.md` exists (fallback is not additive).
- Option B risks shadowing base runbook if override is delta-only and creates long-term duplication risk if full-copy.
- Option C is lowest maintenance and aligns with actual loader behavior.

## Why the Original Suggestion Would Not Work
1. `project_doc_fallback_filenames` is not additive per directory. **Verified empirically (Codex CLI 0.105.0).**
At each directory level Codex chooses the first matching file among `AGENTS.override.md`, `AGENTS.md`, then fallback names. If `AGENTS.md` exists, `CODEX.md` is skipped for that level. Live execution tests confirmed: `project_doc_fallback_filenames = ["CODEX.md"]` only applied when `AGENTS.md` was absent; when `AGENTS.md` existed, `CODEX.md` instructions did not apply.

2. A delta-only `AGENTS.override.md` would hide base root instructions.
`AGENTS.override.md` has higher precedence than `AGENTS.md`. If it contains only deltas, Codex misses base runbook content at that level.

3. The proposed size gate conflicted with the proposed max-byte increase.
Raising `project_doc_max_bytes` to 65,536 while hard-failing `AGENTS.md` at 32,768 creates inconsistent policy.

4. Static skill counts and hand-maintained skill lists are brittle.
Repo state already drifted (`.agents/registry/skills.json` stale; renamed skill frontmatter names diverge from directory names). Validation must derive expected inventory from filesystem + `SKILL.md` frontmatter.

5. The draft skills validation script was insufficient.
It did not validate completeness against `.claude/skills/*/SKILL.md`, symlink correctness, or frontmatter-name uniqueness/mapping.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Refactor AGENTS.md to durable size budget and move verbose policy to linked docs | 88% | M | Pending | - | TASK-03, TASK-08 |
| TASK-02 | IMPLEMENT | Add `.codex/config.toml` with effective settings only (`project_doc_max_bytes`) | 95% | S | Complete (2026-02-28) | - | TASK-08 |
| TASK-03 | IMPLEMENT | Ensure Codex-critical guidance is in always-loaded runbook surface | 82% | M | Pending | TASK-01 | TASK-08 |
| TASK-04 | IMPLEMENT | Create `.agents/skills/` native mirror from `.claude/skills/*/SKILL.md` | 90% | M | Pending | - | TASK-05, TASK-08 |
| TASK-05 | IMPLEMENT | Add strong `scripts/validate-codex-skills.sh` integrity checks | 84% | M | Pending | TASK-04 | TASK-07, TASK-08 |
| TASK-06 | IMPLEMENT | Regenerate and gate `.agents/registry/skills.json` consistency | 90% | S | Complete (2026-02-28) | - | TASK-07, TASK-08 |
| TASK-07 | IMPLEMENT | Wire size + skills + registry checks into local/CI validation | 80% | M | Pending | TASK-05, TASK-06 | TASK-08 |
| TASK-08 | CHECKPOINT | Verify instruction loading and skill discovery behavior end-to-end | 78% | M | Pending | TASK-01, TASK-02, TASK-03, TASK-04, TASK-06, TASK-07 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-04, TASK-06 | - | Can proceed independently |
| 2 | TASK-03, TASK-05 | TASK-01 / TASK-04 | Depends on wave 1 outputs |
| 3 | TASK-07 | TASK-05, TASK-06 | Integrates all checks |
| 4 | TASK-08 | TASK-01,02,03,04,06,07 | Final verification checkpoint |

## Tasks

### TASK-01: Refactor AGENTS.md to durable size budget
- **Type:** IMPLEMENT
- **Deliverable:** `AGENTS.md` at repo root, trimmed to ≤ 24,576 bytes with all removed bulk content pointer-backed by existing docs.
- **Execution-Skill:** lp-do-build
- **Affects:** `AGENTS.md`. Pointer targets must already exist — no new docs created in this task.
- **Status:** Pending
- **Confidence:** 88% (Implementation 90 / Approach 90 / Impact 88)
- **Scope:** Reduce `AGENTS.md` to ≤ 24 KiB by replacing bulky enumerations with pointers to canonical indexes/docs while preserving policy-critical sections inline. The skills catalog (lines 121–215, ~16 KiB) is the primary cut; replace with: `”Discover skills: scripts/agents/list-skills (Claude Code: auto-discovered; Codex: native via .agents/skills/)”`. Removing the skills catalog alone is sufficient to reach the 24 KiB target (34,557 − 16,354 = ~18,203 bytes) — `## User-Facing Step-by-Step Standard` and other verbose sections should NOT be moved unless future growth requires it. Confirm with operator which sections to retain vs move before execution.
- **VC-01:**
  - `wc -c AGENTS.md` ≤ 24,576.
  - Core sections retained inline: No shortcuts, commands, validation gate, git rules, testing rules, task workflow, confidence policy, multi-agent environment rules.
  - Every removed section has a pointer to a concrete file path that exists in the repo.
  - No Codex-critical safety rule (git destructive commands, writer lock) is removed; these stay inline.
- **Red → Green → Refactor:**
  - **Red:** `AGENTS.md` = 34,557 bytes; skills catalog inline (~16 KiB, lines 121–215); this single section accounts for the full overage above 24 KiB.
  - **Green:** `wc -c AGENTS.md` ≤ 24,576; skills catalog replaced with one-liner; verbose sections replaced with pointers to existing files; all core policy sections intact and substantive.
  - **Refactor:** Scan full AGENTS.md for orphaned references to moved content; confirm pointer targets exist; run `wc -c` final check.
- **Rollout/rollback:** Single-commit change to one file. Immediate for all agent sessions. Rollback: `git revert <commit>`.
- **Documentation impact:** None — pointer targets are existing docs; no new docs created.
- **What would make this >=90%:** operator confirms exact sections to move vs retain before execution begins.

### TASK-02: Add effective `.codex/config.toml`
- **Type:** IMPLEMENT
- **Deliverable:** New file `.codex/config.toml` at repo root.
- **Execution-Skill:** lp-do-build
- **Affects:** `.codex/config.toml` (new file; `.codex/` directory does not yet exist).
- **Status:** Complete (2026-02-28)
- **Confidence:** 95% (Implementation 98 / Approach 95 / Impact 95)
- **Scope:** Create `.codex/config.toml` with `project_doc_max_bytes = 65536`. No `project_doc_fallback_filenames` key — that mechanism is not additive at directories where `AGENTS.md` already exists (Decision Log 2026-02-28).
- **VC-02:**
  - `.codex/config.toml` exists.
  - `grep “project_doc_max_bytes = 65536” .codex/config.toml` exits 0.
  - File does not contain `project_doc_fallback_filenames`.
- **Red → Green → Refactor:**
  - **Red:** `.codex/config.toml` absent; Codex uses 32,768 byte default cap; combined instruction file budget insufficient.
  - **Green:** `.codex/config.toml` exists with `project_doc_max_bytes = 65536`; Codex runtime cap is 64 KiB.
  - **Refactor:** Add inline TOML comment explaining cap rationale and why `project_doc_fallback_filenames` is intentionally absent.
- **Rollout/rollback:** Immediate for all Codex sessions in this repo. Rollback: `git revert <commit>` or `rm .codex/config.toml`.
- **Documentation impact:** None — decision captured in this plan's Decision Log.
- **Assumption to verify before ship:** `.codex/config.toml` at repo root is auto-trusted by Codex in default config without explicit user opt-in. If opt-in required, document the setup step.
- **Build evidence (2026-02-28):**
  - Created `.codex/config.toml` with `project_doc_max_bytes = 65536` and no fallback filename key.
  - VC-02 PASS: file exists; `grep "project_doc_max_bytes = 65536" .codex/config.toml` passes; `grep "project_doc_fallback_filenames" .codex/config.toml` returns non-zero.
  - Refactor PASS: inline comments explain cap rationale and why fallback filename config is intentionally omitted.

### TASK-03: Move Codex-critical guidance into always-loaded surface
- **Type:** IMPLEMENT
- **Deliverable:** Modified `AGENTS.md` and `CODEX.md` ensuring all Codex-required-every-run rules are inline in `AGENTS.md` within the 24 KiB budget.
- **Execution-Skill:** lp-do-build
- **Affects:** `AGENTS.md`, `CODEX.md`.
- **Depends on:** TASK-01
- **Status:** Pending
- **Confidence:** 82% (Implementation 85 / Approach 82 / Impact 82)
- **Scope:** Audit `CODEX.md` for rules Codex requires on every session (git destructive command prohibitions, writer lock rules, attribution format). Ensure each is present inline in `AGENTS.md`. The `AGENTS.override.md` strategy was rejected (Decision Log 2026-02-28) — all required-every-run content goes into `AGENTS.md` directly; do not create an `AGENTS.override.md`.
- **VC-03:**
  - Every Codex safety rule currently in `CODEX.md` is either already present in `AGENTS.md` or duplicated inline there.
  - `AGENTS.md` still passes VC-01 (`wc -c` ≤ 24,576) after this task — critical rules must fit within the budget from TASK-01.
  - No critical rule exists only in `CODEX.md`.
- **Red → Green → Refactor:**
  - **Red:** Some Codex-critical safety rules exist only in `CODEX.md`, which is not auto-loaded by Codex.
  - **Green:** All required-every-run Codex rules present inline in `AGENTS.md` within 24 KiB budget; `CODEX.md` confirmed supplemental.
  - **Refactor:** Remove exact duplicates from `CODEX.md` that are now canonical in `AGENTS.md`; add preamble to `CODEX.md` noting it is supplemental to `AGENTS.md`.
- **Rollout/rollback:** Immediate. Rollback: `git revert <commit>`.
- **Documentation impact:** `CODEX.md` preamble updated to note supplemental status.
- **What would make this >=90%:** operator confirms which rules from `CODEX.md` must be inline (vs which can remain supplemental) before execution begins.

### TASK-04: Create `.agents/skills/` native mirror
- **Type:** IMPLEMENT
- **Deliverable:** `.agents/skills/` real directory containing one per-skill relative symlink for every `.claude/skills/*/SKILL.md` entry, committed to git.
- **Execution-Skill:** lp-do-build
- **Affects:** `.agents/skills/` (new directory and per-skill symlinks; `.agents/` directory already exists).
- **Status:** Pending
- **Confidence:** 90% (Implementation 92 / Approach 90 / Impact 90)
- **Scope:** Create `.agents/skills/` as a real directory (not a symlink — the specific Codex CLI failure mode is `.agents/skills` itself being a symlink). For each skill directory in `.claude/skills/` that contains a `SKILL.md` (excluding non-skill entries: `_shared/`, `temp_fix_filenames.py`, `tools-index.md`, `tools-standard.md`), create a per-skill relative symlink:
  ```
  ln -s ../../.claude/skills/<skill-name> .agents/skills/<skill-name>
  ```
  Relative path formula: from `.agents/skills/<name>`, two levels up (`../../`) reaches repo root, then `.claude/skills/<name>`. All 76 symlinks committed to git; portable across Unix/macOS developer machines and CI.
- **VC-04:**
  - `[ -d .agents/skills ] && ! [ -L .agents/skills ]` passes.
  - `ls .agents/skills/ | wc -l` matches `ls .claude/skills/ | grep -v “^_” | grep -v “\.” | wc -l` — bidirectional count match, no static target.
  - For each entry `e` in `.agents/skills/`: `[ -f “.agents/skills/$e/SKILL.md” ]` passes — symlink resolves to a directory containing `SKILL.md`.
- **Red → Green → Refactor:**
  - **Red:** `.agents/skills/` does not exist; Codex discovers 0 repo skills natively.
  - **Green:** `.agents/skills/` is a committed real directory with per-skill relative symlinks (one per `.claude/skills/<name>/SKILL.md`); `scripts/validate-codex-skills.sh` (TASK-05) exits 0.
  - **Refactor:** Run `scripts/validate-codex-skills.sh` against the staged state before committing; confirm all 76 resolve correctly.
- **Rollout/rollback:** Immediate on commit; fresh clones have symlinks automatically. Rollback: `git revert <commit>`.
- **Documentation impact:** AGENTS.md skills one-liner (from TASK-01) updated to note `.agents/skills/` is the Codex-native mirror.

### TASK-05: Add strong skills validation
- **Type:** IMPLEMENT
- **Deliverable:** Executable script `scripts/validate-codex-skills.sh`.
- **Execution-Skill:** lp-do-build
- **Affects:** `scripts/validate-codex-skills.sh` (new file).
- **Depends on:** TASK-04
- **Status:** Pending
- **Confidence:** 84% (Implementation 88 / Approach 84 / Impact 84)
- **Scope:** Write `scripts/validate-codex-skills.sh` checking: (1) `.agents/skills` is a real directory not a symlink; (2) every entry in `.agents/skills/*` resolves to an existing `.claude/skills/<name>/SKILL.md`; (3) every skill directory in `.claude/skills/` (with a `SKILL.md`) has a corresponding entry in `.agents/skills/` — bidirectional completeness; (4) directory-name uniqueness in `.agents/skills/`. Note: frontmatter `name:` field vs directory-name divergence (e.g. `frontend-design` dir vs `tools-ui-frontend-design` frontmatter) is a known pre-existing issue tracked separately and is out of scope for this script.
- **VC-05:**
  - `bash scripts/validate-codex-skills.sh` exits 0 in clean repo state.
  - Exits non-zero with diagnostic message for each of: `.agents/skills` is a symlink; a `.claude/skills/<name>/SKILL.md` exists without a matching `.agents/skills/<name>`; a `.agents/skills/<name>` entry whose target lacks `SKILL.md`; duplicate directory names in `.agents/skills/`.
- **Red → Green → Refactor:**
  - **Red:** Script does not exist; no skill integrity gate.
  - **Green:** Script created, executable, exits 0 against current repo; exits non-zero for each failure condition in VC-05 when tested with deliberately broken states.
  - **Refactor:** Remove temporary breakage-test states; confirm clean exit on final repo state.
- **Rollout/rollback:** Immediate; gated by TASK-07 wiring. Rollback: `git revert <commit>`.
- **Documentation impact:** None.

### TASK-06: Regenerate and gate skill registry consistency
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.agents/registry/skills.json` matching current `.claude/skills/` state.
- **Execution-Skill:** lp-do-build
- **Affects:** `.agents/registry/skills.json`.
- **Status:** Complete (2026-02-28)
- **Confidence:** 90% (Implementation 94 / Approach 90 / Impact 90)
- **Scope:** Run `scripts/agents/generate-skill-registry --write` to regenerate `.agents/registry/skills.json`. The `--check` flag is implemented at `scripts/src/agents/generate-skill-registry.ts:18,39–67` — it JSON-compares current registry against a freshly-built one and exits non-zero on any diff. Confirm `--check` exits 0 after regeneration.
- **VC-06:**
  - `scripts/agents/generate-skill-registry --check` exits 0.
  - Registry entry count matches `ls .claude/skills/ | grep -v “^_” | grep -v “\.” | wc -l` — filesystem-derived, no static target.
- **Red → Green → Refactor:**
  - **Red:** `generate-skill-registry --check` exits non-zero (registry stale).
  - **Green:** Registry regenerated; `--check` exits 0; entry count matches filesystem-derived count from `.claude/skills/`.
  - **Refactor:** Review diff of regenerated registry to confirm no unexpected additions or removals.
- **Rollout/rollback:** Immediate for all callers of `list-skills`. Rollback not ideal (restores stale registry); re-run `--write` to recover.
- **Documentation impact:** None.
- **Build evidence (2026-02-28):**
  - Red state captured: `scripts/agents/generate-skill-registry --check` exited 1 with stale-registry message for `.agents/registry/skills.json`.
  - Green state achieved: ran `scripts/agents/generate-skill-registry --write`; command reported `Wrote .agents/registry/skills.json (76 skills)`.
  - VC-06 PASS: `scripts/agents/generate-skill-registry --check` exits 0; registry `skills` count is 76 and matches filesystem-derived `.claude/skills/*/SKILL.md` count (76).
  - Refactor PASS: reviewed registry diff scope; only `.agents/registry/skills.json` changed for this task.

### TASK-07: Wire checks into local and CI gates
- **Type:** IMPLEMENT
- **Deliverable:** Modified `scripts/validate-changes.sh` with three new unconditional checks: AGENTS size, skill mirror integrity, registry drift.
- **Execution-Skill:** lp-do-build
- **Affects:** `scripts/validate-changes.sh`.
- **Depends on:** TASK-05, TASK-06
- **Status:** Pending
- **Confidence:** 80% (Implementation 82 / Approach 80 / Impact 80)
- **Scope:** Add three checks to `scripts/validate-changes.sh`, run unconditionally (not change-scoped — skill/AGENTS state must always be validated regardless of which files changed):
  1. **AGENTS size check:** warn (exit 0 with message) when `AGENTS.md` > 22,528 bytes (22 KiB); hard fail (exit 1) at > 24,576 bytes (24 KiB — matching TASK-01 durable budget). Byte thresholds are named constants defined at the top of the added block.
  2. **Skill mirror check:** invoke `scripts/validate-codex-skills.sh`; propagate exit code.
  3. **Registry drift check:** invoke `scripts/agents/generate-skill-registry --check`; propagate exit code.
- **VC-07:**
  - `validate-changes.sh` exits 1 when `AGENTS.md` > 24,576 bytes.
  - `validate-changes.sh` exits 0 with warning text when `AGENTS.md` > 22,528 bytes and ≤ 24,576 bytes.
  - `validate-changes.sh` exits 1 when any skill mirror is missing from `.agents/skills/`.
  - `validate-changes.sh` exits 1 when `.agents/registry/skills.json` is stale.
  - CI already calls `validate-changes.sh` on each PR — verify no workflow file changes are needed.
- **Red → Green → Refactor:**
  - **Red:** None of these checks exist in `validate-changes.sh`.
  - **Green:** All three checks present; each failure case confirmed by deliberate breakage before removing breakage.
  - **Refactor:** Confirm no duplicate AGENTS size check elsewhere; confirm thresholds do not conflict with other scripts; confirm CI workflow calls validate-changes.sh without change.
- **Rollout/rollback:** Immediate for local; CI picks up on next PR. Rollback: `git revert <commit>`.
- **Documentation impact:** None — checks are self-documenting via failure messages.
- **What would make this >=90%:** confirm exact CI workflow files call `validate-changes.sh` without requiring a workflow edit.

### TASK-08: Checkpoint verification
- **Type:** CHECKPOINT
- **Status:** Pending
- **Confidence:** 78% (Implementation 80 / Approach 78 / Impact 78)
- **Scope:** Verify project-doc discovery and skill discovery outcomes end-to-end.
- **Acceptance:**
  - Doc loading: root instruction file no longer truncates critical sections under configured cap.
  - Skill loading: Codex `/skills` (or equivalent loader output) shows mirrored skills discoverable from `.agents/skills/`.
  - All validation scripts pass: `validate-codex-skills.sh`, `generate-skill-registry --check`, `validate-changes.sh`.
- **What would make this >=90%:** run proof in a real Codex session and capture output artifact.

## Risks & Mitigations
- Risk: instruction drift between AGENTS and CODEX.
  - Mitigation: keep CODEX supplemental; keep mandatory behavior in AGENTS.
- Risk: symlink/path behavior differences on developer machines (Unix/macOS only; Windows/WSL untested).
  - Mitigation: validate resolved targets and fail fast in CI.
- Risk: future skill renames break mirrors.
  - Mitigation: derive expected set dynamically from filesystem every run (bidirectional check in `validate-codex-skills.sh`).
- Risk: AGENTS.md content removal (TASK-01) reduces Claude Code instruction surface; agents reading AGENTS.md may not follow pointers to moved content.
  - Mitigation: only pointer-back non-critical content. Keep git destructive-command rules, writer lock, and safety rules inline in AGENTS.md. Verify no core policy section becomes a stub before closing TASK-01.
- Risk: `.codex/config.toml` trust model — repo-scoped config may require explicit user opt-in to be respected by Codex.
  - Mitigation: verify against Codex docs or live session before shipping TASK-02. If opt-in required, document the setup step in CODEX.md.

## Acceptance Criteria (overall)
- [ ] `AGENTS.md` within agreed durable size budget.
- [ ] `.codex/config.toml` present with effective settings only.
- [ ] Critical Codex rules available via always-loaded project docs.
- [ ] `.agents/skills/` exists and mirrors current `.claude/skills/*/SKILL.md` inventory.
- [ ] `scripts/validate-codex-skills.sh` and registry check pass and are CI-enforced.
- [ ] End-to-end checkpoint evidence captured.

## Decision Log
- 2026-02-28: Rejected fallback-only `CODEX.md` loading strategy at root (not additive when `AGENTS.md` exists).
- 2026-02-28: Selected single-source instruction strategy + native skills mirror + deterministic validation.
- 2026-02-28: Empirically verified (Codex CLI 0.105.0 live test) that `project_doc_fallback_filenames = ["CODEX.md"]` has no effect when `AGENTS.md` exists at the same directory level — confirms plan choice to keep critical rules inline in `AGENTS.md` rather than relying on fallback loading.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted confidence:
  - TASK-01 88*2=176
  - TASK-02 95*1=95
  - TASK-03 82*2=164
  - TASK-04 90*2=180
  - TASK-05 84*2=168
  - TASK-06 90*1=90
  - TASK-07 80*2=160
  - TASK-08 78*2=156
- Total weighted = 1189
- Total weight = 14
- Overall-confidence = 1189 / 14 = 84.9% -> **85% (rounded)**

## Section Omission Rule
None: all sections are relevant for this plan.
