---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-02-18
Last-updated: 2026-02-18
Feature-Slug: loop-skill-efficiency-audit
Execution-Track: mixed
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/loop-skill-efficiency-audit/plan.md
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Loop Skill Efficiency Audit — Fact-Find Brief

## Scope

### Summary

The `startup-loop-token-efficiency` plan (archived 2026-02-18) delivered a one-time
modularization and parallel-dispatch wave across 7 skills. The improvements were
identified manually via a fact-find session. Without a recurring scan mechanism, the
next generation of monolithic skill files will accumulate undetected until another
ad-hoc audit.

This plan creates `/meta-loop-efficiency` — a standalone skill that scans
`.claude/skills/` weekly, applies deterministic efficiency heuristics, and emits a
ranked opportunity report. When significant new opportunities are found it emits a
planning anchor for `/lp-do-fact-find`. When no opportunities clear the threshold it
emits a clean `no-op` signal.

### Goals

- Detect monolithic skill regressions (new large files without modules) within 7 days
- Surface parallel-dispatch adoption gaps in skills that have sequential
  multi-phase/domain workflows
- Produce a timestamped, committed audit artifact per run
- Integrate into the weekly loop cadence without contaminating the S10 K/P/C/S
  business decision

### Non-goals

- Automatically running modularization or dispatch implementations
- Enforcing a hard "thou shalt not add lines" gate on skill authoring
- Auditing `.md` content quality (sentence-level prose) — only structural signals
- Replacing `meta-reflect` (which captures session-specific learnings)
- Auditing skills outside the startup loop — `idea-*`, `meta-*`, `ops-*`,
  `review-*`, `biz-*`, `guide-*` prefix skills are out of scope; they have
  different invocation patterns and their own improvement cadences

### Constraints & Assumptions

- Constraints:
  - Skill files are `.md` only — no linting/typecheck pipeline; all validation is
    observational (wc -l, grep, ls)
  - Must not modify any skill file during audit (read-only mode)
  - Output artifact must be committed so audit history is preserved in git
  - Must remain invocable standalone — not locked inside S10 stage gating
  - **Audit scope is startup-loop skills only**: all `lp-*` prefix skills +
    `startup-loop` + `draft-outreach` (explicitly used in S6B). Canonical list
    derived from the startup-loop Stage Model table in `startup-loop/SKILL.md`.
    Non-loop skill families (`idea-*`, `meta-*`, `ops-*`, `review-*`, `biz-*`,
    `guide-*`) are excluded from every scan.
- Assumptions:
  - The "thin orchestrator" threshold of ≤200 lines for SKILL.md (without modules)
    is stable — established by the completed token-efficiency plan
  - A SKILL.md >200 lines without a `modules/` subdirectory is always a candidate,
    not always an obligation (some skills may be intentionally large)
  - Invocation frequency of a skill is a proxy for dispatch impact — loop-critical
    skills (lp-offer, lp-seo, lp-channels, startup-loop, lp-do-build) have higher
    invocation frequency than meta/admin skills (meta-reflect, ops-git-recover)

---

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/` — root skill directory; 42 skill directories + `_shared/`
- `.claude/skills/*/SKILL.md` — primary audit target per skill
- `.claude/skills/*/modules/` — presence signals modularization compliance
- `.claude/skills/_shared/subagent-dispatch-contract.md` — reference contract;
  presence in SKILL.md signals dispatch adoption

### Key Modules / Files

- `.claude/skills/_shared/subagent-dispatch-contract.md` — canonical parallel
  dispatch protocol (created in TASK-04 of token-efficiency plan)
- `.claude/skills/_shared/wave-dispatch-protocol.md` — wave-based parallel build
  dispatch (created in TASK-07)
- `docs/business-os/startup-loop-workflow.user.md` §Standing Refresh — cadence table
  where this skill should be referenced
- `docs/plans/archive/startup-loop-token-efficiency-archived-2026-02-18/plan.md` —
  reference for heuristics used in the manual audit (line thresholds, opportunity
  categories)

### Patterns & Conventions Observed

- Thin-orchestrator threshold: ≤200 lines for skills with `modules/`, ≤120 lines for
  fully thin orchestrators — established by: startup-loop SKILL.md = 109L,
  lp-seo SKILL.md = 66L, lp-launch-qa SKILL.md = 128L
- Dispatch adoption pattern: grep for `subagent-dispatch-contract` in SKILL.md;
  confirmed in: lp-offer, lp-launch-qa, startup-loop/modules/cmd-advance.md,
  lp-seo/modules/phase-3.md (4 skills adopted as of 2026-02-18)
- Module pattern: `modules/` directory present in: lp-do-build, lp-do-fact-find,
  lp-launch-qa, lp-do-plan, lp-do-replan, lp-seo, startup-loop (7 skills as of 2026-02-18)

### Current Opportunity Inventory (as of 2026-02-18)

Evidence from `wc -l` scan — **loop skills only** (`lp-*` + `startup-loop`):

Already compliant (thin orchestrator + modules where warranted):
- `lp-do-build` (222L SKILL.md + modules/) ✓
- `lp-launch-qa` (128L SKILL.md + modules/) ✓
- `lp-seo` (66L SKILL.md + modules/) ✓
- `startup-loop` (109L SKILL.md + modules/) ✓
- `lp-do-plan`, `lp-do-replan`, `lp-do-fact-find` (thin orchestrators with modules/) ✓
- `lp-offer` (233L, dispatch adopted via subagent-dispatch-contract.md) ✓

Opportunities (loop skills >200L without modules, sorted by impact_score):

| Skill | Lines | Has modules/ | Dispatch refs | Phase matches | Tier | Impact score |
|---|---:|---|---:|---:|---|---:|
| `lp-design-qa` | 470 | no | 0 | 8 | medium | **4.7** |
| `lp-sequence` | 287 | no | 0 | 0 | high | **4.3** |
| `lp-channels` | 262 | no | 1 | 11 | high | **3.9** |
| `lp-design-spec` | 385 | no | 0 | 12 | medium | **3.9** |
| `lp-experiment` | 309 | no | 0 | 0 | medium | **3.1** |
| `lp-onboarding-audit` | 268 | no | 0 | 0 | low | **1.3** |

Top priority opportunities from this snapshot:
- **OPP-A**: `lp-design-qa` (470L, 8 domain matches) — strongest analogue to the
  lp-launch-qa domain split we just completed; 6+ domains (conversion UX, colour
  contrast, spacing, copy, accessibility, responsive) are independently auditable.
  Impact score 4.7 — highest in the loop-only scope.
- **OPP-B**: `lp-sequence` (287L, high tier) — invoked on every plan topology
  change; thinning it would reduce context at a high-frequency call site.
- **OPP-C**: `lp-channels` (262L, 11 phase matches, 1 dispatch ref already) — most
  loop-critical skills still without modules; phases (channel-fit analysis, GTM
  timeline, outreach setup) are independently executable.

### Dependency & Impact Map

- Upstream: no upstream dependencies (read-only audit)
- Downstream:
  - When audit finds HIGH opportunity: emits planning anchor → `/lp-do-fact-find` for
    a new `startup-loop-token-efficiency-v2` plan
  - When audit finds no opportunities: emits `no-op` signal; no downstream action
- Blast radius of creating the skill:
  - `.claude/skills/meta-loop-efficiency/SKILL.md` (new)
  - `docs/business-os/startup-loop-workflow.user.md` (add standing-refresh row)
  - `.claude/skills/lp-experiment/SKILL.md` (add one-line footnote to S10 Readout)

---

## Skill Design

### Invocation

```bash
/meta-loop-efficiency
/meta-loop-efficiency --threshold 200      # custom line threshold (default 200)
/meta-loop-efficiency --dry-run           # print findings, do not commit artifact
```

Default scan scope: all `lp-*` skills + `startup-loop` + `draft-outreach` as defined
in the startup-loop Stage Model. Non-loop skill families are never in scope.

### Operating Mode

**AUDIT ONLY** — read-only scan; writes and commits one artifact per run.
No skill file modifications permitted.

### Heuristics (Deterministic — All operate over full skill directory, not SKILL.md only)

**H0 — Duplicate candidate detection** (pre-scan step):
- Hash the content of each in-scope `SKILL.md` (SHA256, normalized whitespace).
- Group skills with identical hashes.
- Emit a "Possible duplicates" section for any group of ≥2 identical hashes.
- These are advisory only; do not affect H1–H3 scoring.

**H1 — Size / modularization** (primary signal):
- Threshold applies to `SKILL.md` orchestrator size, regardless of whether a
  `modules/` directory exists (modules reduce per-invocation load, but a bloated
  orchestrator is still a problem).
- `wc -l SKILL.md` > threshold AND no `modules/` → **monolith** (strong signal)
- `wc -l SKILL.md` > threshold AND has `modules/` → **bloated-orchestrator** (weaker
  signal; orchestrator still loads more than the thin-orchestrator target)
- `wc -l SKILL.md` ≤ threshold → **compliant**
- Additional module-level metrics (when `modules/` exists): `module_count`,
  `max_module_lines`, `total_module_lines`. If `max_module_lines > 400` →
  **module-monolith candidate** (advisory; logged in report but not ranked).

**H2 — Dispatch adoption gap** (secondary signal):
- Compute `dispatch_refs_any_md`: count of `subagent-dispatch-contract` matches
  across ALL `.md` files in the skill directory (SKILL.md + modules/ + others).
  (Rationale: confirmed adoption in modules/ would be missed by SKILL.md-only grep.)
- Compute `phase_matches_any_md`: matches of the anchored heading pattern
  `^#{1,6}\s+(Phase|Stage|Domain|Step)\s+[0-9]+` across all `.md` files in the
  skill directory. (Rationale: heading-anchored to avoid incidental paragraph
  mentions; multi-digit numbers supported.)
- `dispatch_refs_any_md == 0` AND `phase_matches_any_md ≥ 3` → **dispatch-candidate**

**H3 — Wave dispatch adoption** (for lp-do-build-targeting skills only):
- Does the skill explicitly reference `lp-do-build` as its execution skill AND does NOT
  reference `wave-dispatch-protocol.md` in any `.md` file in the directory?
  → **wave-candidate** (advisory)
- Not applicable to non-plan-executor skills.

### Ranking (Hierarchical — replaces single impact_score formula)

Produce **two separate ranked lists** (do not mix signals):

**List 1 — Modularization opportunities** (H1 signals):
Rank within each tier by `SKILL.md` line count descending:
1. `high` tier — monolith or bloated-orchestrator
2. `medium` tier — monolith or bloated-orchestrator
3. `low` tier — monolith or bloated-orchestrator

**List 2 — Dispatch opportunities** (H2 + H3 signals):
Rank within each tier by `phase_matches_any_md` descending:
1. `high` tier — dispatch-candidate or wave-candidate
2. `medium` tier
3. `low` tier

Invocation tier assignments (fixed, derived from startup-loop Stage Model):
- `high`: startup-loop, lp-do-build, lp-do-plan, lp-do-replan, lp-sequence, lp-offer,
  lp-channels, lp-seo, lp-forecast, lp-do-fact-find
- `medium`: lp-launch-qa, lp-design-qa, lp-experiment, lp-design-spec,
  lp-prioritize, lp-site-upgrade
- `low`: lp-onboarding-audit, lp-brand-bootstrap, lp-readiness, lp-bos-sync,
  lp-baseline-merge, lp-measure, draft-outreach

### Delta-Aware Planning Anchor

The audit always writes an artifact (even when no opportunities exist). Planning
anchors are emitted only when the signal is **new**, determined by comparing against
the previous audit artifact:

1. Locate previous artifact: most recent file in
   `docs/business-os/platform-capability/skill-efficiency-audit-*.md` by filename.
2. For each skill currently flagged as **monolith** or **dispatch-candidate** in
   List 1 / List 2:
   - If the skill was NOT in the previous artifact's opportunity lists → it is
     **new-to-HIGH** → emit a planning anchor.
   - If the skill was already flagged in the previous artifact → suppress the
     planning anchor for that skill (still listed in the table, status: `known`).
3. If any previously compliant skill has become an opportunity since the last audit
   → always emit a planning anchor (regression signal).
4. If no new-to-HIGH items and no regressions:
   > "No new HIGH opportunities since last audit (YYYY-MM-DD-HHMM). Known
   > opportunities remain open — see previous anchor."

This prevents the weekly run from re-emitting the same planning anchor on every run
while a known backlog sits unaddressed.

### Output Artifact

Path: `docs/business-os/platform-capability/skill-efficiency-audit-YYYY-MM-DD-HHMM.md`
(HHMM in local timezone; unique per run — no collision if run twice in a day)

Required header (first 6 lines of artifact):
```
scan_timestamp: YYYY-MM-DD HH:MM
threshold: <N> lines
scope: lp-*, startup-loop, draft-outreach
git_sha: <HEAD SHA (7 chars)>
previous_artifact: <filename or "none">
skills_scanned: <N>
```

Sections:
1. **Scan summary**: header + skills scanned, compliant count, opportunity count
2. **Possible duplicates** (H0): skill pairs with identical SKILL.md hash
3. **List 1 — Modularization opportunities** (H1): hierarchical, tier-ranked
4. **List 2 — Dispatch opportunities** (H2/H3): hierarchical, tier-ranked
5. **Planning anchor** (when new-to-HIGH items exist): `/lp-do-fact-find` invocation
   hint with proposed slug `startup-loop-token-efficiency-v2` (incrementing suffix)
6. **Delta status**: explicit new-vs-known breakdown, regression flags

**Commit guard** (before write/commit):
- Run `git status --porcelain`.
- If any files are dirty beyond the audit artifact path:
  - Abort the commit; fall back to `--dry-run` behavior; warn the operator.
  - Do not stage or commit anything else.
- If clean (or only audit artifact is dirty): stage ONLY the artifact file path;
  commit only that file. Never commit other staged/unstaged changes.

### Integration into Weekly Cadence

The skill is **not embedded inside S10** (which is business K/P/C/S focused). Instead:

1. Add to `docs/business-os/startup-loop-workflow.user.md` Standing Refresh table:
   `| /meta-loop-efficiency audit | Weekly | Skill file changed OR >7 days since last | /meta-loop-efficiency | docs/business-os/platform-capability/skill-efficiency-audit-YYYY-MM-DD-HHMM.md |`

2. Add one-line footnote to `lp-experiment` SKILL.md §S10 Readout section: "Run
   `/meta-loop-efficiency` if last audit artifact is >7 days old."

3. Operator invokes standalone before or after S10. Full scan takes <2 minutes
   (all wc-l + grep + ls operations; no web fetches or subagents).

---

## Hypothesis & Validation Landscape

| # | Hypothesis | Falsification cost | Falsification time |
|---|---|---|---|
| H1 | Deterministic heuristics (wc-l + grep over all .md files) identify all high-value loop-skill opportunities without reading prose content | LOW — run audit then manually verify top-3 ranked findings | 10 min |
| H2 | Hierarchical tier ranking surfaces the right action order without a numeric formula | LOW — compare ranked output to human intuition on first run; adjust tier assignments if wrong | 5 min |
| H3 | Delta-aware anchor (new-to-HIGH only) prevents weekly alarm fatigue | MEDIUM — validate over 4 weekly runs; if anchor fires on known items, tighten delta logic | 4 weeks |
| H2a | The H2 anchored heading regex (`^#{1,6}\s+(Phase\|Stage\|Domain\|Step)\s+[0-9]+`) has acceptable false-positive rate in practice (implementation detail of H2, not a separate heuristic) | LOW — spot-check the phase_matches_any_md count for 3 skills after first run | 10 min |

---

## Questions

### Resolved

- Q: Should this be inside the S10 skill or standalone?
  - A: Standalone. S10 is a business K/P/C/S decision skill; injecting platform
    health concerns contaminates the weekly business decision cadence.
  - Evidence: S10 = `/lp-experiment` which is design+measure+decide. Adding a
    platform scan there violates single-responsibility.

- Q: What line threshold signals an "opportunity"?
  - A: 200 lines — the same threshold used in the startup-loop-token-efficiency plan
    (every skill reduced to ≤200L for the SKILL.md orchestrator).
  - Evidence: `startup-loop-token-efficiency plan.md` acceptance criteria; confirmed
    outputs: startup-loop SKILL.md = 109L, lp-seo SKILL.md = 66L, etc.

- Q: Should the audit commit its own artifact or just print?
  - A: Commit. Artifact history in git allows trend analysis ("is the skill set
    getting more compliant over time?"). `--dry-run` flag available for quick checks.

### Open (User Input Needed)

None. Scope clarification received 2026-02-18: `idea-*` skills are outside the
startup loop and outside this audit's scope. No open questions remain.

---

## Confidence Inputs

- Implementation: 88% — skill is pure read-only `.md` authoring; heuristics are
  deterministic grep/wc-l operations; no novel tooling needed
- Approach: 85% — thin-orchestrator pattern confirmed by 7 examples; weekly cadence
  is user's stated preference; impact scoring uses proxy assumptions not validated
  data
- Impact: 82% — the token-efficiency plan saved meaningful context per invocation;
  recurring audit prevents regression; H3 (weekly cadence producing signal) is
  unvalidated but low-risk to test
- Delivery-Readiness: 90% — all required heuristics are observable; output template
  is clear; integration point in startup-loop-workflow.user.md is well-defined

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Heuristics produce false positives within loop skills (e.g., lp-design-spec is intentionally dense) | Low | Low | Report is advisory not blocking; operator reviews ranked list before triggering a plan |
| Weekly cadence produces constant no-op → ignored | Medium | Medium | No-op signal is explicit in output; cadence can be changed to bi-weekly after 4 weeks of data |
| Audit artifact directory not cleaned up → large history accumulates | Low | Low | Monthly cleanup of artifacts older than 90 days (add to Standing Refresh cleanup note) |
| New heuristics needed as dispatch patterns evolve (e.g., Model B worktrees) | Low | Medium | SKILL.md has an `## Heuristic Evolution` section with extension instructions |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Skill file ≤ 200 lines (ironic but intentional — the audit skill must itself be thin)
  - Read-only operating mode — no modifications to skills being audited
  - Output artifact committed via writer lock
  - Invocation via `/meta-loop-efficiency` chat command (consistent with other `/meta-*` skills)
- Rollout/rollback expectations:
  - Rollout: create `SKILL.md`; add standing-refresh row to startup-loop-workflow; run first audit
  - Rollback: delete `SKILL.md`; remove standing-refresh row
- Observability expectations:
  - Audit artifacts in `docs/business-os/platform-capability/` provide historical trend

---

## Suggested Task Seeds (Non-binding)

- TASK-01 (S): Author `.claude/skills/meta-loop-efficiency/SKILL.md` — heuristics,
  output format, invocation, integration instructions
- TASK-02 (S): Add standing-refresh row to `startup-loop-workflow.user.md`; add
  one-line footnote to `lp-experiment` SKILL.md §S10 Readout section
- TASK-03 (S): Run first audit invocation (`/meta-loop-efficiency --dry-run` to
  validate, then live run); commit artifact to
  `docs/business-os/platform-capability/skill-efficiency-audit-YYYY-MM-DD-HHMM.md`

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `meta-loop-efficiency/SKILL.md` exists; ≤200 lines; invocation format present;
    H0/H1/H2/H3 heuristics documented; delta-aware anchor logic present; commit
    guard specified; artifact naming uses YYYY-MM-DD-HHMM
  - `startup-loop-workflow.user.md` standing-refresh table includes
    `/meta-loop-efficiency` row with YYYY-MM-DD-HHMM artifact path pattern
  - `lp-experiment/SKILL.md` has one-line S10 Readout footnote
  - First audit artifact exists at `docs/business-os/platform-capability/`
    with required 6-line header (timestamp, threshold, scope, git_sha, previous, count)
- Post-delivery measurement plan:
  - Run 4 weekly audits and review whether any HIGH opportunities were surfaced and
    acted on → validates H3

---

## Evidence Gap Review

### Gaps Addressed

- Heuristic thresholds: resolved from completed `startup-loop-token-efficiency` plan
  evidence (7 skill outputs with known line counts)
- Dispatch adoption baseline: confirmed 4 skills adopted as of 2026-02-18 via grep
- Current opportunity inventory: scanned 16 largest skills; captured lines +
  phase_matches + dispatch_refs
- Integration point: confirmed S10 = `/lp-experiment` (business-focused); standing
  refresh table is the correct integration location

### Confidence Adjustments

- Implementation confidence raised to 88% (from initial ~80%) because all heuristics
  are deterministic grep/wc-l operations — no inference required
- Approach confidence 85% — impact scoring proxy is reasonable but H3 (cadence
  signal value) is still an assumption

### Remaining Assumptions

- Invocation frequency tier for each skill is a manual proxy — not derived from
  instrumentation. Could be wrong for some skills (e.g., lp-sequence may be invoked
  more than "high" tier implies if every plan change triggers it).
- Scope boundary (loop vs. non-loop) is resolved: only `lp-*` + `startup-loop` +
  `draft-outreach`. No remaining ambiguity.

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan` (plan file will be written to
  `docs/plans/loop-skill-efficiency-audit/plan.md` per frontmatter `Related-Plan`)
