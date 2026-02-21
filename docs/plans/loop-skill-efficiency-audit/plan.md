---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-02-18
Last-updated: 2026-02-18 (complete)
Feature-Slug: loop-skill-efficiency-audit
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Loop Skill Efficiency Audit Plan

## Summary

Creates `/meta-loop-efficiency` — a standalone, weekly-cadence skill that scans
`.claude/skills/` for startup-loop skill regressions (monolithic orchestrators,
missing dispatch adoption) using deterministic heuristics (wc -l, grep, ls). It
emits a timestamped, committed audit artifact ranked by tier and opportunity type.
A planning anchor fires only when new-to-HIGH items are found (delta-aware), preventing
weekly alarm fatigue. Three small tasks: author the skill, wire it into the weekly
cadence docs, and run the first live audit.

## Goals

- Detect monolithic skill regressions within 7 days of occurrence
- Surface parallel-dispatch adoption gaps via H2/H3 heuristics
- Produce a timestamped, committed audit artifact per run with trend history in git
- Integrate into weekly loop cadence without contaminating the S10 business decision

## Non-goals

- Automatically implementing modularization or dispatch improvements
- Enforcing a hard line-count gate on skill authoring
- Auditing `.md` prose quality — structural signals only
- Auditing non-loop skill families (`idea-*`, `meta-*`, `ops-*`, `review-*`, `biz-*`, `guide-*`)
- Replacing `meta-reflect` (session-specific learnings)

## Constraints & Assumptions

- Constraints:
  - The new skill must itself be ≤200 lines (the skill auditing for thin orchestrators
    must model that pattern)
  - Read-only during audit — no skill modifications permitted
  - Audit artifact committed via writer lock
  - Audit scope fixed to `lp-*` + `startup-loop` + `draft-outreach` only
  - All validation is observational (`wc -l`, `grep`, `ls`) — no linting pipeline
- Assumptions:
  - 200-line threshold for SKILL.md orchestrator is stable (established by
    `startup-loop-token-efficiency` plan)
  - Invocation-frequency tier assignments (high/medium/low) are a reasonable proxy
    for dispatch impact; tier table is manually curated and may need updating as new
    skills are added
  - The weekly cadence produces usable signal (H3) — unvalidated until 4 runs

## Fact-Find Reference

- Related brief: `docs/plans/loop-skill-efficiency-audit/fact-find.md`
- Key findings used:
  - Current loop-skill inventory (16 largest/priority skills sampled): 7 already compliant, 6 opportunities; live audit scans full scope (~28 skills)

  - Thin-orchestrator baseline confirmed at ≤200L via 7 completed examples
  - Dispatch adoption: 4 skills adopted `subagent-dispatch-contract.md` as of 2026-02-18
  - Integration point: `startup-loop-workflow.user.md` §Standing Refresh table; NOT inside S10
  - Delta-aware anchor needed to suppress known-backlog re-fires
  - Commit guard needed to prevent dirty working-tree contamination

## Proposed Approach

- Option A (chosen): Pure `.md` authoring — write `SKILL.md` from the fully-specified
  fact-find design. No executable code required. All checks are shell one-liners
  (wc -l, grep, ls) that the skill instructs the operator/agent to run at invocation time.
- Option B: Build a shell script (`scripts/meta-loop-efficiency.sh`) that automates
  the scan. More robust but adds a scripts/ artifact, requires CI attention, and is
  harder to read/maintain than a skill-format document.
- Chosen approach: Option A — matches existing skill architecture pattern; the operator
  or an agent runs the wc-l/grep commands naturally during a `/meta-loop-efficiency`
  invocation. No scripting overhead.

## Plan Gates

- Foundation Gate: Pass — fact-find has all required fields; Deliverable-Type, Execution-Track,
  Primary-Execution-Skill, Startup-Deliverable-Alias all present; delivery-readiness 90%
- Sequenced: Yes — simple 2→1 fan-in; TASK-01 + TASK-02 parallel, TASK-03 waits on both
- Edge-case review complete: Yes — dirty-tree commit guard, dry-run flag, delta suppression,
  and module-monolith advisory all specified in fact-find
- Auto-build eligible: Yes — all tasks ≥80%; no DECISION gates; no blocking dependencies

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Author `.claude/skills/meta-loop-efficiency/SKILL.md` | 82% | S | Complete (2026-02-18) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Wire into weekly cadence docs (workflow table + lp-experiment footnote) | 85% | S | Complete (2026-02-18) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Run first audit invocation; commit artifact | 80% | S | Complete (2026-02-18) | TASK-01, TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | — | No technical dependency between them; run in parallel |
| 2 | TASK-03 | TASK-01, TASK-02 complete | Skill must exist to invoke; cadence docs should be in place first |

## Tasks

---

### TASK-01: Author `.claude/skills/meta-loop-efficiency/SKILL.md`

- **Type:** IMPLEMENT
- **Deliverable:** New file `.claude/skills/meta-loop-efficiency/SKILL.md` — the
  complete skill definition for `/meta-loop-efficiency`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:** `.claude/skills/meta-loop-efficiency/SKILL.md` (new)
- **Depends on:** -
- **Blocks:** TASK-03
- **Build evidence:** SKILL.md written at 129L (71L under 200L limit). TC-01–TC-07 all pass. Commit `e6d7d2a9b0`. Key findings: H2 anchored heading regex works correctly in practice (confirmed with manual spot-check on lp-channels Stage headings); grep approach needed correction for single-file directories (use `grep -h`, not `grep -c` + awk).
- **Confidence:** 82%
  - Implementation: 88% — pure `.md` authoring; all heuristics are fully specified in
    fact-find (H0 SHA hash, H1 wc-l, H2 anchored heading grep, H3 wave-dispatch ref);
    output format is completely defined
  - Approach: 85% — thin-orchestrator pattern confirmed by 7 live examples; Option A
    (.md only, no shell script) matches all existing skill conventions
  - Impact: 82% — audit is only useful if it actually surfaces correct opportunities;
    heuristics are proven against the 2026-02-18 snapshot but unvalidated on new skills
- **Acceptance:**
  - SKILL.md exists at `.claude/skills/meta-loop-efficiency/SKILL.md`
  - File is ≤200 lines (the skill itself must be a thin orchestrator)
  - All four heuristics (H0, H1, H2, H3) are present and match fact-find spec
  - Delta-aware anchor logic is documented (new-to-HIGH only; suppress known)
  - Artifact naming uses `YYYY-MM-DD-HHMM` format
  - Commit guard is specified (git status --porcelain check before commit)
  - Audit scope constraint is explicit (`lp-*` + `startup-loop` + `draft-outreach` only)
- **Validation contract:**
  - TC-01: `ls .claude/skills/meta-loop-efficiency/SKILL.md` → file exists (exit 0)
  - TC-02: `wc -l .claude/skills/meta-loop-efficiency/SKILL.md` → count ≤200
  - TC-03: `grep -c "H0\|H1\|H2\|H3" .claude/skills/meta-loop-efficiency/SKILL.md` → ≥4 matches
  - TC-04: `grep -i "delta" .claude/skills/meta-loop-efficiency/SKILL.md` → ≥1 match
  - TC-05: `grep "YYYY-MM-DD-HHMM" .claude/skills/meta-loop-efficiency/SKILL.md` → ≥1 match
  - TC-06: `grep "git status --porcelain" .claude/skills/meta-loop-efficiency/SKILL.md` → ≥1 match
  - TC-07: `grep "lp-\*\|draft-outreach" .claude/skills/meta-loop-efficiency/SKILL.md` → scope constraint present
- **Execution plan:** Red → Green → Refactor
  - Red: file absent → all TC-01 through TC-07 fail
  - Green: author SKILL.md from fact-find spec; confirm all TCs pass
  - Refactor: review line count; trim prose if >180L; ensure invocation examples are concise
- **Planning validation (required for M/L):** None: S-effort task; `.md` authoring only
- **Scouts:**
  - Verify: `ls .claude/skills/meta-loop-efficiency/` does not already exist
  - Confirm: `wc -l .claude/skills/*/SKILL.md | sort -rn | head -5` shows lp-do-build
    (222L) as the largest bloated-orchestrator above threshold — confirms what the H1 flag looks like in practice (lp-do-build has modules/ so it is bloated-orchestrator, not monolith; the 200L threshold itself is the reference point)
- **Edge Cases & Hardening:**
  - If SKILL.md draft exceeds 200L: extract the heuristic detail tables to a
    `modules/heuristics.md` file (allowed by the thin-orchestrator pattern); SKILL.md
    stays thin; modules/ file is referenced
  - Invocation tier table (high/medium/low) may need updating when new `lp-*` skills
    are added — add an `## Heuristic Evolution` section with instructions for extending
    the tier list
- **What would make this >=90%:**
  - If SKILL.md can be kept under 150L (25% headroom) without losing heuristic clarity,
    implementation confidence would rise to 93%+
- **Rollout / rollback:**
  - Rollout: create file; commit; TASK-02 and TASK-03 follow
  - Rollback: `git rm .claude/skills/meta-loop-efficiency/SKILL.md`; TASK-02 edits
    reversed
- **Documentation impact:**
  - SKILL.md is itself the documentation artifact — no separate docs needed
- **Notes / references:**
  - Full heuristic spec: `docs/plans/loop-skill-efficiency-audit/fact-find.md` §Skill Design
  - Tier assignments (fixed): fact-find §Ranking section
  - Pattern reference: `.claude/skills/lp-launch-qa/SKILL.md` (128L, thin orchestrator
    with modules/ for domain checks)

---

### TASK-02: Wire into weekly cadence docs

- **Type:** IMPLEMENT
- **Deliverable:** One new table row in `docs/business-os/startup-loop-workflow.user.md`
  §Standing Refresh; one new footnote line in `.claude/skills/lp-experiment/SKILL.md`
  §S10 Readout section
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build evidence:** Row added to §Standing Refresh Prompts table (not §Business Operator Actions — the engineering reference table at line 565 was the correct target). One-line footnote added under §Weekly Loop (S10) in lp-experiment/SKILL.md. TC-01–TC-03 all pass. Commit `676c03d2ac`.
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`,
  `.claude/skills/lp-experiment/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 90% — adding one table row + one sentence; no logic required;
    both files are known and readable
  - Approach: 88% — Standing Refresh table is the confirmed integration point (not S10
    itself); lp-experiment §S10 Readout is the confirmed footnote location
  - Impact: 85% — without this, the skill exists but operators have no weekly prompt
    to invoke it; cadence wiring is what converts a skill into a practice
- **Acceptance:**
  - `startup-loop-workflow.user.md` contains a `/meta-loop-efficiency` row in the
    Standing Refresh table with frequency `Weekly`, trigger condition, and artifact
    path pattern using `YYYY-MM-DD-HHMM`
  - `lp-experiment/SKILL.md` contains a one-line footnote in or near the S10 Readout
    section: "Run `/meta-loop-efficiency` if last audit artifact is >7 days old."
- **Validation contract:**
  - TC-01: `grep "meta-loop-efficiency" docs/business-os/startup-loop-workflow.user.md` → ≥1 match
  - TC-02: `grep "meta-loop-efficiency" .claude/skills/lp-experiment/SKILL.md` → ≥1 match
  - TC-03: `grep "YYYY-MM-DD-HHMM" docs/business-os/startup-loop-workflow.user.md` → ≥1 match (artifact path pattern present)
- **Execution plan:** Red → Green → Refactor
  - Red: neither file references `/meta-loop-efficiency`
  - Green: add table row to workflow doc; add footnote to lp-experiment/SKILL.md
  - Refactor: read surrounding context to confirm row fits the table format; check
    footnote is not interrupting existing content flow
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:**
  - Read `docs/business-os/startup-loop-workflow.user.md` to find §Standing Refresh
    table structure (column names, row format) before editing
  - Read `.claude/skills/lp-experiment/SKILL.md` to find the S10 Readout section
    (confirm it exists and identify the right insertion point)
- **Edge Cases & Hardening:**
  - If §Standing Refresh table does not exist in startup-loop-workflow.user.md: create
    it using the same format as the existing cadence/refresh tables in the doc
  - If §S10 Readout section is absent in lp-experiment/SKILL.md: place footnote at the
    end of the file with a `## S10 Readout Note` header rather than omitting it
- **What would make this >=90%:**
  - Pre-confirmed Standing Refresh table format (done in Scouts step above)
- **Rollout / rollback:**
  - Rollout: commit both edits together in one commit
  - Rollback: revert the two edits
- **Documentation impact:**
  - These ARE the documentation updates — no additional docs needed
- **Notes / references:**
  - Fact-find §Integration into Weekly Cadence for exact table row format to add

---

### TASK-03: Run first audit invocation; commit artifact

- **Type:** IMPLEMENT
- **Deliverable:** First audit artifact at
  `docs/business-os/platform-capability/skill-efficiency-audit-YYYY-MM-DD-HHMM.md`
  with correct 6-line header, committed to git
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build evidence:** Artifact written at `skill-efficiency-audit-2026-02-18-1230.md` (166L). TC-01–TC-05 all pass. Commit `5d62e65aba`. Commit guard fired (dirty tree from pre-existing dev changes) — artifact staged by path only, no other files included. H4 regex validated: corrected grep approach (grep -h instead of -c + awk) needed for accurate single-file directory counts. 28 skills scanned: 15 H1 opportunities, 14 H2 dispatch-candidates, 0 H0 duplicates. Planning anchor emitted → top targets: lp-design-qa, lp-sequence, lp-channels.
- **Affects:** `docs/business-os/platform-capability/skill-efficiency-audit-YYYY-MM-DD-HHMM.md` (new)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — invoking a skill and committing its output is low-complexity;
    the dry-run path validates heuristic output before committing
  - Approach: 85% — dry-run first, then live commit; matches SKILL.md operating mode spec
  - Impact: 80% — first run validates all four heuristics (H0–H3) against real data;
    if the H2 anchored heading regex produces too many false positives, output will
    need iteration before this task is truly complete
- **Acceptance:**
  - Artifact file exists at `docs/business-os/platform-capability/skill-efficiency-audit-*.md`
  - File has the required 6-line header: `scan_timestamp`, `threshold`, `scope`,
    `git_sha`, `previous_artifact`, `skills_scanned`
  - Artifact contains at least: Scan summary section, List 1 (Modularization), List 2
    (Dispatch), Delta status section
  - `previous_artifact: none` in header (first run)
  - Artifact is committed via writer lock; git log shows new commit
- **Validation contract:**
  - TC-01: `ls docs/business-os/platform-capability/skill-efficiency-audit-*.md` → file exists
  - TC-02: `head -6 docs/business-os/platform-capability/skill-efficiency-audit-*.md` → shows all 6 required header keys (`scan_timestamp`, `threshold`, `scope`, `git_sha`, `previous_artifact`, `skills_scanned`)
  - TC-03: `grep "previous_artifact: none" docs/business-os/platform-capability/skill-efficiency-audit-*.md` → first run marked correctly
  - TC-04: `git log --oneline -1 docs/business-os/platform-capability/skill-efficiency-audit-*.md` → shows a commit for the artifact
  - TC-05: `grep "List 1\|List 2\|Delta status" docs/business-os/platform-capability/skill-efficiency-audit-*.md` → all three required sections present
- **Execution plan:** Red → Green → Refactor
  - Red: invoke `/meta-loop-efficiency --dry-run`; confirm output structure matches
    SKILL.md spec (no artifact committed yet)
  - Green: review dry-run output; if H2 anchored heading regex produces obvious false positives, adjust
    the heading pattern per SKILL.md §Heuristic Evolution; invoke live run; commit artifact
  - Refactor: verify git log; verify 6-line header; verify delta section says `previous_artifact: none`
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:**
  - Confirm `docs/business-os/platform-capability/` directory exists (or create it)
  - Confirm no existing `skill-efficiency-audit-*.md` files (so `previous_artifact: none` is correct)
- **Edge Cases & Hardening:**
  - Dirty working tree at invocation time: commit guard checks `git status --porcelain`; if dirty files exist beyond the artifact path, stage ONLY the artifact file explicitly (`git add <artifact-path>`); verify with `git diff --cached --name-only` that only the artifact is staged before committing; this prevents contamination without requiring a pristine tree
  - H2 anchored heading regex produces >20 false positives on a single skill: cap `phase_matches_any_md`
    report at 20 and add a `(capped)` flag in output; do not abort the run
  - `docs/business-os/platform-capability/` does not exist: create the directory before
    writing the artifact; add it to `Affects`
- **What would make this >=90%:**
  - If dry-run output exactly matches expected table format on first attempt
    (no H2 anchored heading regex tuning needed), implementation confidence rises to 93%
- **Rollout / rollback:**
  - Rollout: commit artifact; task complete
  - Rollback: `git rm docs/business-os/platform-capability/skill-efficiency-audit-<stamp>.md`
- **Documentation impact:**
  - Artifact is itself the output; no additional docs
- **Notes / references:**
  - 6-line required header spec: `docs/plans/loop-skill-efficiency-audit/fact-find.md` §Output Artifact
  - Writer lock invocation: `scripts/agents/with-writer-lock.sh --wait-forever -- git commit`

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| SKILL.md exceeds 200L on first draft | Low | Low | Extract heuristic tables to `modules/heuristics.md`; orchestrator stays thin |
| H2 anchored heading regex produces >10 false positives per skill | Medium | Low | Cap output at 20; add `(capped)` flag; tune regex per §Heuristic Evolution in SKILL.md |
| Weekly cadence produces constant no-op → skill is ignored | Medium | Medium | No-op signal is explicit in output; cadence can be changed to bi-weekly after 4 runs |
| Dirty working tree prevents artifact commit | Low | Low | Stage artifact by explicit path only; verify with `git diff --cached --name-only` before committing; unrelated dirty files are never included |
| New `lp-*` skills added not in invocation-tier table → incorrect tier assignment | Low | Low | §Heuristic Evolution section in SKILL.md instructs how to extend tier table |

## Observability

- Logging: None — skill is invoked manually; output is the artifact
- Metrics: Trend visible via artifact history in `docs/business-os/platform-capability/`
- Alerts/Dashboards: None: advisory audit; no automated alerting

## Acceptance Criteria (overall)

Accepted on 2026-02-18. Evidence: commits `e6d7d2a9b0` (TASK-01), `676c03d2ac` (TASK-02), `5d62e65aba` (TASK-03).

- [x] `.claude/skills/meta-loop-efficiency/SKILL.md` exists; ≤200 lines (129L); H0/H1/H2/H3 + delta anchor + commit guard all present
- [x] `startup-loop-workflow.user.md` §Standing Refresh table has `/meta-loop-efficiency` row with YYYY-MM-DD-HHMM path pattern
- [x] `.claude/skills/lp-experiment/SKILL.md` has one-line S10 Readout footnote for `/meta-loop-efficiency`
- [x] First audit artifact exists at `docs/business-os/platform-capability/skill-efficiency-audit-2026-02-18-1230.md`
- [x] Artifact has required 6-line header with `previous_artifact: none`
- [x] Artifact is committed in git via writer lock (`5d62e65aba`)

## Decision Log

- 2026-02-18: Chose standalone skill (not embedded in S10) — S10 is business K/P/C/S
  decision focused; injecting platform scans would violate single-responsibility
- 2026-02-18: Chose Option A (.md authoring, no shell script) — matches existing skill
  architecture; simpler to maintain; no CI overhead
- 2026-02-18: Scope fixed to `lp-*` + `startup-loop` + `draft-outreach` only —
  non-loop skill families have different invocation patterns and their own improvement
  cadences (user confirmed 2026-02-18)
- 2026-02-18: Hierarchical two-list ranking (modularization + dispatch separate) chosen
  over single impact_score formula — formula ranking contradicted tier priority ordering

## Overall-confidence Calculation

- S=1, M=2, L=3
- TASK-01: min(88,85,82)=82%; effort S=1 → 82
- TASK-02: min(90,88,85)=85%; effort S=1 → 85
- TASK-03: min(85,85,80)=80%; effort S=1 → 80
- Overall-confidence = (82+85+80) / (1+1+1) = 247/3 = **82%**
