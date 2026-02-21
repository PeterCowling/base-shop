---
Type: Plan
Status: Complete
Domain: Skills / Platform
Workstream: Engineering
Created: 2026-02-18
Last-updated: 2026-02-18 (Complete)
Feature-Slug: startup-loop-token-efficiency-v2
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: meta-loop-efficiency
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Startup Loop Token Efficiency v2 — Plan

## Summary

Modularize the three highest-signal startup-loop skills flagged in the 2026-02-18 meta-loop-efficiency audit: **lp-design-qa** (470L monolith, H1+H2), **lp-sequence** (287L monolith, H1), **lp-channels** (262L monolith, H1). Each currently has a single `SKILL.md` with no `modules/` directory. Tasks extract domain/workflow content into dedicated module files and thin each orchestrator to ≤200L. For lp-design-qa, dispatch adoption (Model A, matching lp-launch-qa) is also included — clearing both H1 and H2 flags simultaneously. Total orchestrator reduction: ~719L. Combined token saving compounds on lp-sequence (highest-frequency skill in the loop) and lp-design-qa (largest single skill). A second meta-loop-efficiency audit (TASK-04) confirms H1 compliance after build.

## Goals

- lp-design-qa: extract 4 domain modules + report-template; rewrite orchestrator with Model A dispatch; ≤200L SKILL.md
- lp-sequence: extract 2 modules (seq-algorithm + seq-plan-update); thin orchestrator; ≤200L SKILL.md
- lp-channels: extract 3 modules (channel-research + channel-strategy + channel-gtm-output); thin orchestrator; ≤200L SKILL.md
- All three pass H1-compliant check on second meta-loop-efficiency audit artifact

## Non-goals

- lp-sequence or lp-channels dispatch adoption (H2 flags are false positives — stages are sequential, not parallel domains)
- Changes to invocation contracts, frontmatter name/description, argument signatures
- Changes to skill behaviour or output format
- Other skills in the audit backlog (lp-forecast, lp-offer, etc.) — deferred

## Constraints & Assumptions

- Constraints:
  - SKILL.md orchestrators must stay ≤200L (H1 threshold)
  - No module may exceed 400L (advisory threshold)
  - All three SKILL.md files have uncommitted working-tree changes — tasks operate on current file state
  - Writer lock required for all commits: `scripts/agents/with-writer-lock.sh`
- Assumptions:
  - lp-launch-qa (128L orchestrator + 7 modules) is the correct architectural target for lp-design-qa
  - Module extraction does not require downstream skill changes (consumers invoke orchestrators only)
  - Pre-commit hooks do not fail on `.md` file changes

## Fact-Find Reference

- Related brief: `docs/business-os/platform-capability/skill-efficiency-audit-2026-02-18-1230.md` (audit source)
- Related brief: `docs/plans/startup-loop-token-efficiency-v2/fact-find.md`
- Key findings used:
  - lp-design-qa 470L: Steps 3–6 (domain checks, ~230L) + Step 7 (report format, ~90L) → 5 module files; dispatch Model A directly applicable
  - lp-sequence 287L: Steps 2–3 + 6 (algorithm, ~105L) + Steps 7–9 + edge cases (~120L) → 2 module files; dispatch N/A (sequential algorithm)
  - lp-channels 262L: Stages 1–2 (~65L) + Stages 3–4 (~85L) + Stages 5–6 + QC + Red Flags (~90L) → 3 module files; dispatch N/A (sequential research)
  - Reference model: `.claude/skills/lp-launch-qa/` — 128L orchestrator + domain-*.md (33–57L) + report-template.md (273L)

## Proposed Approach

- Option A (chosen): Domain/stage module split per skill + lp-design-qa dispatch adoption. Mirrors lp-launch-qa pattern exactly. Fast, low-risk, verifiable.
- Option B: Single "content" module per skill. Simpler but misses dispatch adoption opportunity for lp-design-qa and produces fewer reusable boundary points.
- Chosen approach: Option A — domain split with lp-design-qa dispatch adoption.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (TASK-01 87%, TASK-02 85%, TASK-03 83% — all ≥80)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| TASK-01 | IMPLEMENT | lp-design-qa: 5 modules + dispatch adoption | 87% | M | Complete (2026-02-18) | - | TASK-04 |
| TASK-02 | IMPLEMENT | lp-sequence: 2 modules + thin orchestrator | 85% | S | Complete (2026-02-18) | - | TASK-04 |
| TASK-03 | IMPLEMENT | lp-channels: 3 modules + thin orchestrator | 83% | S | Complete (2026-02-18) | - | TASK-04 |
| TASK-04 | IMPLEMENT | Second meta-loop-efficiency audit (verification) | 85% | S | Complete (2026-02-18) | TASK-01, TASK-02, TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | No file overlap — fully independent; all ≥80 |
| 2 | TASK-04 | Wave 1: TASK-01, TASK-02, TASK-03 | Audit verifies H1 compliance for all three |

**Max parallelism:** 3 (Wave 1)
**Critical path:** TASK-01 → TASK-04 (2 waves; TASK-01 is M-effort bottleneck)
**Total tasks:** 4

---

## Tasks

### TASK-01: lp-design-qa — extract 5 modules + dispatch adoption

- **Type:** IMPLEMENT
- **Deliverable:** Rewritten `.claude/skills/lp-design-qa/SKILL.md` (≤200L orchestrator) + 5 new module files in `.claude/skills/lp-design-qa/modules/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Build evidence:**
  - TC-01: `wc -l SKILL.md` → 161L (≤200 ✓)
  - TC-02: `ls modules/` → 5 files: domain-visual, domain-responsive, domain-a11y, domain-tokens, report-template ✓
  - TC-03: `wc -l modules/*.md` → max 87L (all ≤400 ✓)
  - TC-04: `grep "subagent-dispatch-contract" SKILL.md` → 1 match ✓
  - TC-05: all modules/*.md refs exist on disk ✓
  - TC-06: `name: lp-design-qa` in head -5 ✓
- **Affects:**
  - `.claude/skills/lp-design-qa/SKILL.md`
  - `.claude/skills/lp-design-qa/modules/domain-visual.md` (create)
  - `.claude/skills/lp-design-qa/modules/domain-responsive.md` (create)
  - `.claude/skills/lp-design-qa/modules/domain-a11y.md` (create)
  - `.claude/skills/lp-design-qa/modules/domain-tokens.md` (create)
  - `.claude/skills/lp-design-qa/modules/report-template.md` (create)
  - `[readonly] .claude/skills/lp-launch-qa/SKILL.md`
  - `[readonly] .claude/skills/lp-launch-qa/modules/domain-*.md`
  - `[readonly] .claude/skills/_shared/subagent-dispatch-contract.md`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 87%
  - Implementation: 87% — lp-launch-qa is a complete reference for identical domain-split + dispatch pattern; dispatch schema well-defined in subagent-dispatch-contract.md. Uncommitted working-tree state reduces from 92%.
  - Approach: 92% — lp-launch-qa orchestrator is the direct target; 4 domain boundaries (VR/RS/A11Y/TC) are line-range verified; dispatch Model A is confirmed applicable.
  - Impact: 88% — ~360L orchestrator reduction (470→~110L); H1+H2 flags both cleared; 4 parallel domain subagent contexts benefit from thin modules.
- **Acceptance:**
  - [ ] `wc -l .claude/skills/lp-design-qa/SKILL.md` ≤ 200
  - [ ] `ls .claude/skills/lp-design-qa/modules/` shows exactly: domain-visual.md, domain-responsive.md, domain-a11y.md, domain-tokens.md, report-template.md
  - [ ] No module >400L
  - [ ] `grep "subagent-dispatch-contract" .claude/skills/lp-design-qa/SKILL.md` returns a match
  - [ ] All `modules/` refs in SKILL.md exist as files on disk
  - [ ] SKILL.md frontmatter `name: lp-design-qa` and `description:` preserved verbatim
- **Validation contract (TC):**
  - TC-01: `wc -l .claude/skills/lp-design-qa/SKILL.md` → output ≤ 200
  - TC-02: `ls .claude/skills/lp-design-qa/modules/` → 5 files listed (domain-visual, domain-responsive, domain-a11y, domain-tokens, report-template)
  - TC-03: `wc -l .claude/skills/lp-design-qa/modules/*.md` → all values ≤ 400
  - TC-04: `grep "subagent-dispatch-contract" .claude/skills/lp-design-qa/SKILL.md` → returns ≥1 match
  - TC-05: for each `modules/<name>.md` reference in SKILL.md, file exists at that path → 0 missing refs
  - TC-06: `head -5 .claude/skills/lp-design-qa/SKILL.md` → `name: lp-design-qa` present
- **Execution plan:** Red (verify source line ranges + confirm modules/ absent) → Green (create modules/ dir, extract 5 module files, rewrite SKILL.md orchestrator with dispatch language) → Refactor (verify all TC checks pass, adjust line count if SKILL.md exceeds 200L by moving Integration/Red Flags to orchestrator footer or report-template)
- **Planning validation (required for M):**
  - Checks run: `wc -l` on lp-design-qa SKILL.md (confirmed 470L); `ls` on lp-launch-qa/modules/ (confirmed 7 files); line-range inspection of lp-design-qa Steps 3–7 confirmed source line ranges.
  - Validation artifacts: fact-find natural split table with source line ranges.
  - Unexpected findings: lp-design-qa has an `operating_mode: AUDIT` field in frontmatter (lp-launch-qa does not); must preserve this.
- **Scouts:**
  - Pre-check: `grep -rn "Step [3-7]\|domain-visual\|domain-responsive\|domain-a11y\|domain-tokens" .claude/skills/ --include="*.md" | grep -v "lp-design-qa/"` — confirms no other skill hard-references internal steps (expected: 0 matches)
  - `ls .claude/skills/lp-design-qa/` — confirms no pre-existing `modules/` dir
- **Edge Cases & Hardening:**
  - Step 2 (Component Inventory, ~30L) stays in orchestrator — it's an intake/coordination step, not a domain audit
  - `operating_mode: AUDIT` frontmatter field must be preserved (unique to lp-design-qa)
  - If SKILL.md ≥ 200L after first draft: move Red Flags and/or Integration section into `modules/report-template.md`
  - Dispatch return schema must define `{domain, status, checks: [{id, status, evidence}]}` — use lp-launch-qa domain subagent contract as exact template
- **What would make this ≥90%:**
  - Confirm no cross-skill section references via pre-check grep (scout removes remaining ~3% uncertainty)
- **Rollout / rollback:**
  - Rollout: skill takes effect immediately on next `/lp-design-qa` invocation; no deploy step
  - Rollback: `git revert <commit>` restores monolith in one step
- **Documentation impact:**
  - `docs/plans/startup-loop-token-efficiency-v2/plan.md` — update task status + build evidence after completion
- **Notes / references:**
  - Reference: `.claude/skills/lp-launch-qa/SKILL.md` lines 64–86 for dispatch language pattern
  - Reference: `.claude/skills/_shared/subagent-dispatch-contract.md` Model A definition

---

### TASK-02: lp-sequence — extract 2 modules + thin orchestrator

- **Type:** IMPLEMENT
- **Deliverable:** Rewritten `.claude/skills/lp-sequence/SKILL.md` (≤200L orchestrator) + 2 new module files in `.claude/skills/lp-sequence/modules/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build evidence:**
  - TC-01: `wc -l SKILL.md` → 124L (≤200 ✓)
  - TC-02: `ls modules/` → seq-algorithm.md, seq-plan-update.md ✓
  - TC-03: `wc -l modules/*.md` → max 93L (all ≤400 ✓)
  - TC-04: all modules/*.md refs exist on disk ✓
  - TC-05: `name: lp-sequence` in head -5 ✓
- **Affects:**
  - `.claude/skills/lp-sequence/SKILL.md`
  - `.claude/skills/lp-sequence/modules/seq-algorithm.md` (create)
  - `.claude/skills/lp-sequence/modules/seq-plan-update.md` (create)
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 88% — 2 split points are clearly delineated (Steps 2–3+6 = algorithm; Steps 7–9+edge cases = plan-update); content move with no logic change
  - Approach: 92% — split follows natural section boundaries; no dispatch adoption needed (sequential algorithm)
  - Impact: 85% — ~172L orchestrator reduction (287→~115L); highest-frequency skill (invoked after every plan edit); saving compounds across all loop runs
- **Acceptance:**
  - [ ] `wc -l .claude/skills/lp-sequence/SKILL.md` ≤ 200
  - [ ] `ls .claude/skills/lp-sequence/modules/` shows exactly: seq-algorithm.md, seq-plan-update.md
  - [ ] No module >400L
  - [ ] All `modules/` refs in SKILL.md exist as files on disk
  - [ ] SKILL.md frontmatter `name: lp-sequence` preserved verbatim
- **Validation contract (TC):**
  - TC-01: `wc -l .claude/skills/lp-sequence/SKILL.md` → output ≤ 200
  - TC-02: `ls .claude/skills/lp-sequence/modules/` → seq-algorithm.md and seq-plan-update.md present
  - TC-03: `wc -l .claude/skills/lp-sequence/modules/*.md` → all values ≤ 400
  - TC-04: for each `modules/<name>.md` ref in SKILL.md, file exists → 0 missing
  - TC-05: `head -5 .claude/skills/lp-sequence/SKILL.md` → `name: lp-sequence` present
- **Execution plan:** Red (verify source line ranges, confirm no modules/ dir) → Green (create modules/, extract seq-algorithm.md and seq-plan-update.md, rewrite SKILL.md with routing references) → Refactor (run TC checks, adjust if orchestrator exceeds 200L)
- **Planning validation:** None required for S effort. Source line ranges confirmed during fact-find inspection (Steps 2–3+6 ~L94–173; Steps 7–9+edge cases ~L175–287).
- **Scouts:**
  - `grep -rn "Step [2-9]\|Handling Edge Cases\|topological" .claude/skills/ --include="*.md" | grep -v "lp-sequence/"` — confirms no other skill references internal steps (expected: 0 matches)
- **Edge Cases & Hardening:**
  - Steps 1 (Parse Tasks, ~15L) stays in orchestrator — it's the intake step that feeds the algorithm
  - Completion messages stay in `seq-plan-update.md` (they are the output of the plan-update phase)
  - Quality Checks section (~10L) can stay in orchestrator or move to seq-plan-update.md — prefer orchestrator for discoverability
- **What would make this ≥90%:**
  - Scout grep returns 0 cross-skill references (removes remaining uncertainty)
- **Rollout / rollback:**
  - Rollout: immediate on next invocation; no deploy
  - Rollback: `git revert <commit>`
- **Documentation impact:**
  - Update task status in this plan after completion

---

### TASK-03: lp-channels — extract 3 modules + thin orchestrator

- **Type:** IMPLEMENT
- **Deliverable:** Rewritten `.claude/skills/lp-channels/SKILL.md` (≤200L orchestrator) + 3 new module files in `.claude/skills/lp-channels/modules/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build evidence:**
  - TC-01: `wc -l SKILL.md` → 92L (≤200 ✓)
  - TC-02: `ls modules/` → channel-research.md, channel-strategy.md, channel-gtm-output.md ✓
  - TC-03: `wc -l modules/*.md` → max 76L (all ≤400 ✓)
  - TC-04: all modules/*.md refs exist on disk ✓
  - TC-05: `name: lp-channels` in head -5 ✓
  - TC-06: `grep GATE-S6B-ACT-01` → 2 matches in SKILL.md, 2 matches in channel-strategy.md ✓
- **Affects:**
  - `.claude/skills/lp-channels/SKILL.md`
  - `.claude/skills/lp-channels/modules/channel-research.md` (create)
  - `.claude/skills/lp-channels/modules/channel-strategy.md` (create)
  - `.claude/skills/lp-channels/modules/channel-gtm-output.md` (create)
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 83%
  - Implementation: 88% — 3 split points clear (Stages 1–2 / Stages 3–4 / Stages 5–6+QC+Red Flags); uncommitted working-tree state reduces from 92%
  - Approach: 90% — stage boundaries well-defined; no dispatch adoption needed
  - Impact: 83% — ~172L orchestrator reduction (262→~90L); medium frequency (per-business, not per-plan)
- **Acceptance:**
  - [ ] `wc -l .claude/skills/lp-channels/SKILL.md` ≤ 200
  - [ ] `ls .claude/skills/lp-channels/modules/` shows exactly: channel-research.md, channel-strategy.md, channel-gtm-output.md
  - [ ] No module >400L
  - [ ] All `modules/` refs in SKILL.md exist as files on disk
  - [ ] SKILL.md frontmatter `name: lp-channels` preserved verbatim
  - [ ] DEP gate (GATE-S6B-ACT-01) language preserved in orchestrator or channel-strategy.md
- **Validation contract (TC):**
  - TC-01: `wc -l .claude/skills/lp-channels/SKILL.md` → output ≤ 200
  - TC-02: `ls .claude/skills/lp-channels/modules/` → channel-research.md, channel-strategy.md, channel-gtm-output.md present
  - TC-03: `wc -l .claude/skills/lp-channels/modules/*.md` → all values ≤ 400
  - TC-04: for each `modules/<name>.md` ref in SKILL.md, file exists → 0 missing
  - TC-05: `head -5 .claude/skills/lp-channels/SKILL.md` → `name: lp-channels` present
  - TC-06: `grep "GATE-S6B-ACT-01" .claude/skills/lp-channels/SKILL.md .claude/skills/lp-channels/modules/channel-strategy.md` → ≥1 match (gate language preserved)
- **Execution plan:** Red (verify source line ranges, confirm no modules/ dir) → Green (create modules/, extract 3 module files, rewrite SKILL.md) → Refactor (run TC checks)
- **Planning validation:** None required for S effort. Source line ranges confirmed during fact-find (Stages 1–2 ~L63–95; Stages 3–4 ~L96–155; Stages 5–6+QC+Red Flags ~L156–262).
- **Scouts:**
  - `grep -rn "Stage [1-6]\|GATE-S6B" .claude/skills/ --include="*.md" | grep -v "lp-channels/"` — confirms no cross-skill section refs (expected: startup-loop may reference GATE-S6B-ACT-01 by name but not by section — acceptable)
- **Edge Cases & Hardening:**
  - GATE-S6B-ACT-01 (DEP gate) is a critical correctness requirement — must be preserved in channel-strategy.md (it gates spend authorization); add TC-06 to verify
  - Output Contract section (~15L) can stay in orchestrator (downstream compatibility metadata belongs at the entry point)
  - Integration section (~20L) stays in orchestrator
- **What would make this ≥90%:**
  - Scout grep confirms no section-level cross-references to internal Stages (removes uncertainty)
- **Rollout / rollback:**
  - Rollout: immediate on next invocation; no deploy
  - Rollback: `git revert <commit>`
- **Documentation impact:**
  - Update task status in this plan after completion

---

### TASK-04: Second meta-loop-efficiency audit (verification)

- **Type:** IMPLEMENT
- **Deliverable:** Committed audit artifact `docs/business-os/platform-capability/skill-efficiency-audit-<YYYY-MM-DD-HHMM>.md` confirming lp-design-qa, lp-sequence, lp-channels as H1-compliant
- **Execution-Skill:** meta-loop-efficiency
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build evidence:**
  - TC-01: artifact exists at `docs/business-os/platform-capability/skill-efficiency-audit-2026-02-18-1357.md` ✓
  - TC-02: `skills_scanned: 28` ✓
  - TC-03: lp-design-qa in compliant/delta sections only, NOT in List 1 or List 2 ✓
  - TC-04: lp-sequence NOT in List 1 (H1-compliant, 124L) ✓ — appears in List 2 advisory (false positive)
  - TC-05: lp-channels NOT in List 1 (H1-compliant, 92L) ✓ — appears in List 2 advisory (known false positive)
  - Artifact committed on dev branch (`066b4d0e4b`) ✓
  - lp-do-fact-find regression (198→201L) flagged for editorial trim — minor, no planning task needed
- **Affects:**
  - `docs/business-os/platform-capability/skill-efficiency-audit-<stamp>.md` (create)
  - `[readonly] .claude/skills/meta-loop-efficiency/SKILL.md`
  - `[readonly] .claude/skills/lp-design-qa/SKILL.md`
  - `[readonly] .claude/skills/lp-sequence/SKILL.md`
  - `[readonly] .claude/skills/lp-channels/SKILL.md`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 92% — runs a well-defined, deterministic skill; commit guard and delta-aware anchor already tested in first run
  - Approach: 95% — no ambiguity; same process as first audit run
  - Impact: 85% — produces committed evidence artifact; closes the verification loop; delta status shows three `known` backlog items resolved
- **Acceptance:**
  - [ ] Artifact file exists at `docs/business-os/platform-capability/skill-efficiency-audit-YYYY-MM-DD-HHMM.md`
  - [ ] Artifact header shows `skills_scanned: ≥28`
  - [ ] lp-design-qa, lp-sequence, lp-channels NOT listed in List 1 (H1 opportunities)
  - [ ] lp-design-qa NOT listed in List 2 (H2 dispatch opportunities)
  - [ ] Artifact committed (git log shows commit for artifact file)
- **Validation contract (TC):**
  - TC-01: artifact file exists at correct path with correct HHMM-format name
  - TC-02: `grep "skills_scanned" <artifact>` → value ≥ 28
  - TC-03: `grep "lp-design-qa" <artifact>` → skill appears in compliant section or delta status only, NOT in List 1 or List 2 opportunity tables
  - TC-04: `grep "lp-sequence" <artifact>` → same (H1-compliant, not in List 1)
  - TC-05: `grep "lp-channels" <artifact>` → same (H1-compliant, not in List 1)
- **Execution plan:** None: procedural task — invoke `/meta-loop-efficiency`, verify output, confirm commit.
- **Planning validation:** None required for S effort.
- **Scouts:** None: `meta-loop-efficiency` is deterministic; no pre-check needed beyond confirming TASK-01–03 are Complete.
- **Edge Cases & Hardening:**
  - If any of TASK-01–03 left a skill still >200L, the audit will re-flag it — treat as a build regression, not a TASK-04 failure; stop and fix the relevant task first
  - Delta-aware anchor: three previously flagged skills now compliant → delta status shows them as resolved; no new planning anchor emitted (unless a different skill regressed)
- **What would make this ≥90%:**
  - TASK-01–03 all pass their TC checks before TASK-04 is invoked (raises Implementation to 95%)
- **Rollout / rollback:**
  - Rollout: committed artifact is permanent; no rollback needed (audit artifacts are append-only)
  - Rollback: None: `git revert` removes the artifact commit if needed
- **Documentation impact:**
  - Sets Status: Complete on this plan after TASK-04 commit
- **Notes / references:**
  - Previous artifact: `docs/business-os/platform-capability/skill-efficiency-audit-2026-02-18-1230.md`
  - Commit guard: follow Policy B (stage artifact by explicit path; dirty tree does not block)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Uncommitted working-tree changes to target skills cause read confusion | Medium | Medium | Each task reads current file state before editing; no rebase needed (all on dev branch) |
| Cross-reference breakage: another skill hard-codes a section heading | Low | Medium | Scout grep in TASK-01/02/03 pre-checks before commit |
| lp-design-qa dispatch return schema mismatch with Model A | Low | High | TASK-01 defines schema explicitly; validates against `subagent-dispatch-contract.md` |
| TASK-01 orchestrator still >200L after thin-out | Low | Low | 90L buffer to threshold; fallback: move Integration + Red Flags to report-template.md |
| GATE-S6B-ACT-01 language lost during lp-channels extraction | Low | High | TC-06 in TASK-03 explicitly greps for gate language; fails task if missing |
| Second audit re-flags a skill not yet fixed (regression) | Low | Low | Treated as task regression, not TASK-04 failure; stop → fix the relevant task → re-run TASK-04 |

## Observability

- Primary gate: meta-loop-efficiency second audit artifact (TASK-04)
- Line count checks: `wc -l SKILL.md` per task (deterministic)
- Cross-reference check: `grep "modules/"` per task
- No logging, metrics, or dashboards needed (no deployed service)

## Acceptance Criteria (overall)

- [ ] All three SKILL.md orchestrators: `wc -l ≤ 200`
- [ ] All modules created and referenced correctly (no dangling refs)
- [ ] lp-design-qa dispatch adoption confirmed: `grep "subagent-dispatch-contract"` returns match
- [ ] GATE-S6B-ACT-01 preserved in lp-channels
- [ ] Second meta-loop-efficiency audit artifact committed, showing all three skills H1-compliant
- [ ] Plan Status: Complete

## Decision Log

- 2026-02-18: Dispatch adoption scoped to lp-design-qa only; lp-sequence and lp-channels H2 flags deemed false positives (sequential stages, not parallel domains). Evidence: stage-by-stage dependency analysis in fact-find.

## Overall-confidence Calculation

- S=1, M=2, L=3
- TASK-01: M(2) × 87% = 174
- TASK-02: S(1) × 85% = 85
- TASK-03: S(1) × 83% = 83
- TASK-04: S(1) × 85% = 85
- Total: 427 / 5 = **85%**
