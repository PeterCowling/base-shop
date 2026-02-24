---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Skills / Platform
Workstream: Engineering
Created: 2026-02-18
Last-updated: 2026-02-18
Feature-Slug: startup-loop-token-efficiency-v2
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/startup-loop-token-efficiency-v2/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Startup Loop Token Efficiency v2 — Fact-Find Brief

## Scope

### Summary

Modularize the three highest-signal startup-loop skills identified in the 2026-02-18 meta-loop-efficiency audit: **lp-design-qa** (470L, monolith, H1+H2), **lp-sequence** (287L, monolith, H1), and **lp-channels** (262L, monolith, H1). Each has a single `SKILL.md` with no `modules/` directory. The goal is to thin each orchestrator to ≤200L (target ~80–120L), extract domain/phase content into `modules/`, and for lp-design-qa specifically adopt subagent dispatch (Model A) matching the lp-launch-qa reference pattern.

**Combined saving:** ~719L of orchestrator reduction across the three skills. lp-sequence is high-frequency (called after every plan topology edit), compounding the token saving.

### Goals

- lp-design-qa: thin orchestrator + extract 4 domain modules + 1 report-template module + adopt Model A dispatch (mirrors lp-launch-qa exactly)
- lp-sequence: thin orchestrator + extract 2 modules (dependency-graph algorithm; plan-update procedure)
- lp-channels: thin orchestrator + extract 3 modules (channel-research; channel-strategy; channel-gtm-output)
- All three: pass H1-compliant check (`wc -l SKILL.md ≤ 200`) on second meta-loop-efficiency run

### Non-goals

- lp-sequence dispatch adoption — the 5 workflow steps are sequential algorithm stages (graph build → sort → update), not parallel domains; H2 flag is a false positive here
- lp-channels dispatch adoption — the 6 stages are sequential research steps (each feeds the next); H2 flag is also a false positive; lp-channels being dispatched BY startup-loop is already possible without changes
- Any changes to skill behaviour, invocation contract, or output format
- Changes to other skills in scope (lp-forecast, lp-offer, lp-do-plan, etc. — deferred to future audit cycle)

### Constraints & Assumptions

- Constraints:
  - SKILL.md orchestrators must stay ≤200L (self-imposed per meta-loop-efficiency H1 threshold)
  - No module may exceed 400L (H1 module-monolith advisory threshold)
  - Invocation contracts (frontmatter name/description, argument signatures) must remain identical
  - All three SKILL.md files have uncommitted working-tree changes on dev branch — tasks must work from current file state
- Assumptions:
  - lp-launch-qa domain-split model (128L orchestrator + modules/) is the correct architectural target for lp-design-qa
  - Module extraction does not require any downstream skill changes (consumers invoke the orchestrator, not individual modules)
  - No automated test framework applies to skill `.md` files; validation is structural (wc -l, cross-reference check) + manual invocation quality

---

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/lp-design-qa/SKILL.md` — 470L monolith; loaded on every `/lp-design-qa` invocation
- `.claude/skills/lp-sequence/SKILL.md` — 287L monolith; loaded on every `/lp-sequence` invocation (post-plan, post-replan, post-reorder — highest frequency in loop)
- `.claude/skills/lp-channels/SKILL.md` — 262L monolith; loaded on every `/lp-channels --business <BIZ>` invocation

### Key Modules / Files

- `.claude/skills/lp-launch-qa/SKILL.md` — 128L orchestrator; **reference model** for domain-split + dispatch pattern
- `.claude/skills/lp-launch-qa/modules/domain-*.md` — 6 domain modules (33–57L each); direct structural target for lp-design-qa
- `.claude/skills/lp-launch-qa/modules/report-template.md` — 273L; reference for lp-design-qa report-template module
- `.claude/skills/_shared/subagent-dispatch-contract.md` — dispatch protocol; lp-design-qa will adopt Model A
- `.claude/skills/_shared/wave-dispatch-protocol.md` — wave dispatch (not applicable to these three skills)
- `docs/business-os/platform-capability/skill-efficiency-audit-2026-02-18-1230.md` — first audit artifact; source of all findings

### Data & Contracts

- Skill invocation contracts (must survive unchanged):
  - lp-design-qa: `name: lp-design-qa`, `description: Audit a built UI...`, invocation `--business <BIZ>` / `--scope <X>` / fast path `<slug>`
  - lp-sequence: `name: lp-sequence`, `description: Topologically sort plan tasks...`, argument: slug or no-argument discovery
  - lp-channels: `name: lp-channels`, `description: Startup channel strategy + GTM skill...`, invocation `--business <BIZ>`
- Module load contract: orchestrators reference modules by relative path (`modules/domain-<name>.md`, `modules/report-template.md`)
- lp-design-qa dispatch return schema (new, to define during build): `{domain: str, status: "pass|fail|warn", checks: [{id, status, evidence}]}` — matching lp-launch-qa domain subagent contract
- No external API contracts; no persistence contracts

### Dependency & Impact Map

**lp-design-qa:**
- Upstream: `/lp-design-spec` (design spec input); `/lp-do-build` (produces the UI under audit)
- Downstream: `/lp-do-build` (receives issue report to fix regressions); `/lp-launch-qa` (assumes design QA passed); human PR reviewers
- Blast radius: SKILL.md split only; no consumer changes needed (all invoke orchestrator)

**lp-sequence:**
- Upstream: `/lp-do-plan`, `/lp-do-replan` (call lp-sequence after structural edits — highest frequency)
- Downstream: `/lp-do-build` (uses sequenced plan for wave dispatch)
- Blast radius: SKILL.md split only; invocation contract unchanged

**lp-channels:**
- Upstream: `/lp-offer`, `/lp-readiness`
- Downstream: `/draft-marketing`, `/lp-seo`, `/lp-do-fact-find` (scopes go-items from GTM timeline); `startup-loop` S6B gate
- Blast radius: SKILL.md split only

### Patterns & Conventions Observed

- lp-launch-qa domain-split pattern: thin orchestrator (~128L) + `modules/domain-<name>.md` per independent domain + `modules/report-template.md`. Dispatch is Model A (read-only audit subagents, aggregated by orchestrator). Evidence: `.claude/skills/lp-launch-qa/SKILL.md:64–86`
- All modules live in `modules/` under the skill directory — no other nesting levels observed
- Module line budget: largest existing module is report-template at 273L (acceptable — under 400L advisory threshold)
- SKILL.md frontmatter: `name`, `description`, `operating_mode` (on lp-design-qa); optional `operating_mode` field

### Natural Split Points (Evidence-Backed)

**lp-design-qa** (470L → target ~110L orchestrator + 5 modules):

| Module | Source lines | Approx output |
|---|---:|---:|
| `modules/domain-visual.md` | Steps 3 (VR-01–VR-05), L143–187 | ~50L |
| `modules/domain-responsive.md` | Step 4 (RS-01–RS-04), L189–223 | ~35L |
| `modules/domain-a11y.md` | Step 5 (A11Y-01–A11Y-05), L225–270 | ~45L |
| `modules/domain-tokens.md` | Step 6 (TC-01–TC-04), L272–305 | ~35L |
| `modules/report-template.md` | Step 7 (issue report format, severity, sign-off), L307–388 | ~85L |
| Orchestrator (thin) | Steps 1–2 intake, dispatch, synthesis, Step 8, QC, Integration, Red Flags | ~110L |

**lp-sequence** (287L → target ~115L orchestrator + 2 modules):

| Module | Source lines | Approx output |
|---|---:|---:|
| `modules/seq-algorithm.md` | Steps 2–3 (dependency graph + topological sort) + Step 6 (parallel groups), L94–173 | ~100L |
| `modules/seq-plan-update.md` | Steps 7–9 (update plan, validate, completion summary) + Edge Cases, L175–287 | ~110L |
| Orchestrator (thin) | Metadata, intro, mode, when to use, fast/discovery, inputs/outputs, ID policy, Step 1 (parse tasks), routing | ~115L |

**lp-channels** (262L → target ~90L orchestrator + 3 modules):

| Module | Source lines | Approx output |
|---|---:|---:|
| `modules/channel-research.md` | Stage 1 (Load Context) + Stage 2 (Fit Analysis, scoring rubric, taxonomy), L63–95 | ~55L |
| `modules/channel-strategy.md` | Stage 3 (selection rationale, constraints, GATE-S6B-ACT-01) + Stage 4 (budget/resource/risk), L96–155 | ~80L |
| `modules/channel-gtm-output.md` | Stage 5 (GTM timeline) + Stage 6 (document artifact) + QC-01–QC-10 + Red Flags, L156–262 | ~90L |
| Orchestrator (thin) | Metadata, invocation, operating mode, inputs, DEP gate summary, routing to modules, output contract, integration | ~90L |

### Test Landscape

**Test Infrastructure:**
- No automated test framework applies to skill `.md` files
- Structural validation: `wc -l SKILL.md` (H1 compliance check, threshold 200L)
- Module size check: `wc -l modules/*.md` (advisory: no module >400L)
- Cross-reference validation: `grep -r "modules/" .claude/skills/lp-design-qa/` to confirm all `modules/` refs exist on disk
- End-to-end: re-run `/meta-loop-efficiency` after all three tasks complete — confirms H1 flags cleared, H2 flag cleared for lp-design-qa

**Existing coverage:** meta-loop-efficiency audit is the repeatable structural gate.

**Coverage gaps:** No automated quality check for module content completeness (that all moved content is present and correct in the new location). Manual review required.

**Testability assessment:**
- Easy: wc -l, grep, diff checks — straightforward
- Hard: behavioural correctness (does the dispatching orchestrator produce the same output as the monolith?) — manual invocation required
- Test seams: none needed (no code changes)

### Recent Git History (Targeted)

- `5d7cc5b4e8` `feat(startup-loop-branding-design-module)` — lp-channels last substantively modified: added brand-identity/messaging-hierarchy as optional inputs. Current 262L SKILL.md reflects this.
- `5d7cc5b4e8` — lp-sequence modified in same session (workspace canonicalization). Current 287L SKILL.md reflects this.
- `4ed0be7201` `feat(ds-skill-alignment)` — lp-design-qa last committed: Wave 4 build (distribution spine, launch QA, extensions). All three skills have uncommitted working-tree changes on dev branch (from git status at session start); tasks must operate on the current working tree state.

---

## Confidence Inputs

- **Implementation: 88%**
  Evidence: lp-launch-qa is a complete, working reference for the domain-split + dispatch pattern (128L orchestrator, 7 module files). lp-design-qa is a direct structural analogue (same domain-check pattern, same report format). lp-sequence and lp-channels have clear line-level split points. What lowers from 95%: uncommitted working-tree changes add merge risk; cross-reference completeness requires careful manual verification.
  Raises to ≥90%: confirm no other skills import specific section text from these three SKILL.md files.

- **Approach: 92%**
  Evidence: lp-launch-qa model is battle-tested and the domain-split approach is literally identical for lp-design-qa (VR/RS/A11Y/TC domains → 4 module files + report template). For lp-sequence and lp-channels, the split follows obvious structural boundaries (sequential stage groupings). Dispatch assessment (N/A for lp-sequence and lp-channels) is based on direct analysis of stage sequencing dependencies — each stage feeds the next.
  Raises to ≥95%: no additional validation needed; approach is well-evidenced.

- **Impact: 85%**
  Evidence: Combined orchestrator reduction of ~719L (lp-design-qa ~360L, lp-sequence ~172L, lp-channels ~172L). lp-sequence is the highest-frequency skill (called after every plan edit), making its saving compound across every loop run. lp-design-qa dispatch adoption additionally removes 470L from 4 parallel subagent contexts.
  Raises to ≥90%: measure actual token reduction on a representative invocation after build.

- **Delivery-Readiness: 83%**
  Evidence: All three skills are `.md`-only with no external dependencies. Skills directory structure is simple and stable. No CI gate applies to skill file changes.
  Raises to ≥90%: confirm no pre-commit hook fails on `.md` changes (hooks target `.ts/.tsx/.js/.jsx` files — unlikely to affect `.md`).

- **Testability: 78%**
  Evidence: Structural gates (wc -l, grep cross-refs) are fully deterministic. Behavioural correctness (same audit output from thin orchestrator as from monolith) requires manual invocation; no automated framework exists.
  Raises to ≥80%: define explicit TC contracts per task (each task: TC-1 wc-l orchestrator, TC-2 wc-l modules, TC-3 cross-ref grep, TC-4 meta-loop-efficiency re-run).

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Working-tree modifications to lp-channels/lp-sequence create merge conflict with tasks | Medium | Medium | Each task reads current file state before editing; no rebase needed (all on dev) |
| Cross-reference breakage: another skill hard-codes a section heading from these SKILL.md files | Low | Medium | Grep `.claude/skills/` for `lp-design-qa`, `lp-sequence`, `lp-channels` name-only refs before each task commit; section headings are not publicly referenced |
| lp-design-qa dispatch return schema mismatch with lp-launch-qa Model A contract | Low | High | Define return schema explicitly in TASK-01 (lp-design-qa); validate against `_shared/subagent-dispatch-contract.md` |
| Module content completeness: text accidentally omitted during extraction | Medium | Medium | Each task's TC-3 = diff the extracted content against source lines to confirm all content moved |
| lp-design-qa orchestrator still exceeds 200L after thin-out | Low | Low | Target ~110L; 90L of buffer before H1 threshold; if exceeded, move Quality Checks section to a `modules/qa-checklist.md` |
| meta-loop-efficiency second run picks up new issues in other skills (noise) | Low | Low | Delta-aware artifact suppresses known backlog; only new-to-HIGH items emit anchor |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - SKILL.md frontmatter (`name`, `description`) must be preserved verbatim (skill registry depends on it)
  - Module files must use relative paths from orchestrator: `modules/<filename>.md`
  - `_shared/subagent-dispatch-contract.md` reference in lp-design-qa must use the exact same language as lp-launch-qa: `Protocol: _shared/subagent-dispatch-contract.md (Model A — ...)`
  - All tasks must use writer lock for commits: `scripts/agents/with-writer-lock.sh`
- Rollout/rollback:
  - No deploy step; skills take effect immediately on next invocation
  - Rollback = `git revert` the task commit — trivial
- Observability:
  - meta-loop-efficiency second audit confirms H1 compliance for all three skills
  - Re-run is the primary success gate

---

## Suggested Task Seeds (Non-binding)

- **TASK-01**: lp-design-qa modularize + dispatch — extract 4 domain modules + report-template; rewrite orchestrator with Model A dispatch; target ≤120L orchestrator (HIGH effort estimate: most complex, requires dispatch schema definition)
- **TASK-02**: lp-sequence modularize — extract seq-algorithm + seq-plan-update modules; rewrite thin orchestrator; target ≤120L orchestrator (MEDIUM effort)
- **TASK-03**: lp-channels modularize — extract channel-research + channel-strategy + channel-gtm-output modules; rewrite thin orchestrator; target ≤100L orchestrator (MEDIUM effort)
- **TASK-04**: Second meta-loop-efficiency audit — run `/meta-loop-efficiency` after TASK-01–03 complete; confirm all three moved from monolith to H1-compliant; artifact committed (SMALL effort, CHECKPOINT character)

Wave structure: TASK-01, TASK-02, TASK-03 are independent (no file overlap) — can run in parallel. TASK-04 depends on all three.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - Each task: `wc -l .claude/skills/<skill>/SKILL.md ≤ 200`; `wc -l .claude/skills/<skill>/modules/*.md` (none >400L); `grep -r "modules/" .claude/skills/<skill>/` cross-refs all exist
  - TASK-01 additional: `grep "subagent-dispatch-contract" .claude/skills/lp-design-qa/SKILL.md` returns a match
  - TASK-04: `skill-efficiency-audit-2026-02-18-*.md` shows lp-design-qa, lp-sequence, lp-channels as H1-compliant
- Post-delivery measurement plan:
  - meta-loop-efficiency second audit (TASK-04) is the primary measurement gate

---

## Evidence Gap Review

### Gaps Addressed

- **Split point evidence**: verified by line-range inspection of all three SKILL.md files; split tables above cite source lines
- **Dispatch applicability**: confirmed via stage-dependency analysis for lp-sequence (Steps 2→3→7 sequential chain) and lp-channels (Stage 1→2→3→4→5→6 sequential chain); dispatch N/A for both
- **Reference model fitness**: lp-launch-qa line count (128L orchestrator) and module count (7 files) confirmed as achievable target
- **Uncommitted working tree**: confirmed via git status that lp-channels, lp-sequence, lp-design-qa all have working-tree changes; tasks must read current file state

### Confidence Adjustments

- Testability reduced to 78% (from initial 85%) because no automated behavioral tests exist for skill files — manual invocation required for full quality validation
- Delivery-Readiness at 83% (not 90%) to account for uncommitted working-tree state creating edge-case merge scenarios

### Remaining Assumptions

- No other skill file contains a hard-coded import or section reference to the content being moved (e.g., `See Step 5 in lp-design-qa`); this has not been grep-verified — low risk, noted as TASK-01 pre-check
- lp-design-qa's dispatch adoption will not require changes to any downstream consumer (all consumers invoke the orchestrator, not individual domain checks)

---

## Planning Readiness

- **Status: Ready-for-planning**
- Blocking items: none
- Recommended next step: `/lp-do-plan startup-loop-token-efficiency-v2`
