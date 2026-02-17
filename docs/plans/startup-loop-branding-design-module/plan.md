---
Type: Plan
Status: Active
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-17
Last-updated: 2026-02-17 (TASK-01..04 complete)
Feature-Slug: startup-loop-branding-design-module
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-brand-bootstrap, /lp-design-spec
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: PLAT-002
---

# Startup Loop — Branding & Design Module Plan

## Summary

Retrofit the Startup Loop with a first-class Branding & Design module. Currently "Design Policy" is
a prose appendix (§11) with no stage key, no artifact contract, and no enforcement gates. This plan
wires brand artifacts into the loop as gated deliverables, consolidates the BRIK brand doc, adds brand
compliance to the QA gate, and creates a reusable Deep Research prompt pack. The module covers five
branded touch-points: BD-1 (Brand Dossier bootstrap at S1), BD-2 (Competitive Positioning at S2),
BD-3 (Messaging Hierarchy as S2B sub-deliverable), BD-4 (Creative Voice Brief after S6B), and BD-6
(Brand Compliance QA at S9B). BD-5 (lp-design-spec gate) hardens the design pipeline.

## Goals

1. Every brand artifact type has a defined front matter schema, Draft/Active DoD, and machine-readable gate.
2. The startup-loop advance rules enforce brand-dossier existence at S1 and messaging-hierarchy at S2B Done.
3. The BRIK brand-language.user.md is renamed, deduplicated (no hand-copied token values), and all downstream skill references are updated.
4. lp-launch-qa gains a Domain 5 Brand Copy Compliance section (BC-04/05/07).
5. lp-design-spec is gated on Active brand-dossier (hard pre-flight, not soft quality check).
6. 5 Deep Research prompt templates (BRAND-DR-01..05) are created in workflow-prompts/_templates/.
7. Evidence Pack directory convention (`docs/business-os/evidence/<BIZ>/<YYYY-MM>/`) with compliance guardrails.

## Non-goals

- Changing BRIK's existing brand decisions (palette, typeface, persona).
- Implementing visual designs or selecting logo variants.
- Running actual brand research (this plan builds the process; research runs inside the loop).
- Creating brand-dossiers for HEAD/PET/HBAG before their loops start — those are bootstrapped at S1
  entry (lp-brand-bootstrap skill + GATE-BD-01).
- Modifying lp-offer's core 6-section output contract.

## Constraints & Assumptions

- Constraints:
  - All `.user.md` artifacts require a `.user.html` companion via `pnpm docs:render-user-html`.
  - Single owner (Pete). No multi-person approval chain.
  - loop-spec.yaml is the authoritative stage graph; spec_version must be bumped on any spec change.
  - SKILL.md files are read-only for agents except when the plan task explicitly names them as primary.
- Assumptions:
  - `docs/registry.json` is the canonical file registry; brand-language.user.md entry must be updated on rename.
  - lp-design-spec currently **creates** brand-language.user.md if missing (confirmed from grep). GATE-BD-07 changes this to a hard pre-flight check.
  - HEAD/PET/HBAG will run lp-brand-bootstrap at their respective S1 entries; plan creates the process, not the artifacts.

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-branding-design-module/fact-find.md`
- Key findings:
  - E-01: §11 has no stage key, artifact contract, or gate (prose appendix only)
  - E-03: S2B→S3+S6B fan-out is a hard invariant; BD-3 must be S2B sub-deliverable (Option A chosen)
  - E-04: brand-language not in startup-loop advance rules (Gate OG-01 confirmed)
  - E-05 (extended): lp-offer has no brand-dossier in optional inputs (G-03 confirmed from full read)
  - E-10: token value mismatch: brand-language.user.md says `6 78% 57%`; tokens.ts says `6 78% 47%`
  - E-12 (confirmed): lp-channels has no brand inputs — brand-dossier and messaging-hierarchy absent
  - E-13 (confirmed + revised): lp-launch-qa has no brand compliance domain; lp-design-qa VR-05 + TC-01/02 already handle token/signature compliance; lp-design-qa requires brand-language.user.md as REQUIRED input
  - lp-design-spec: 6 references to brand-language.user.md (lines 54, 65, 175, 205, 295, 345, 371); currently CREATES brand-language if missing — must change to gate

## Existing System Notes

- Key modules/files:
  - `docs/business-os/startup-loop/loop-spec.yaml` — stage graph, fan-out invariant (S2B→S3+S6B), S4 join barrier
  - `docs/business-os/startup-loop/stage-result-schema.md` — produced_keys contract; no static registry; stage workers write dynamically
  - `.claude/skills/startup-loop/SKILL.md` — advance rules; hard gates: A (S1B), B (S2A), C (deep research); brand absent
  - `.claude/skills/lp-brand-bootstrap/SKILL.md` — creates brand-language.user.md; trigger is "when to use" comment, not enforced gate
  - `.claude/skills/lp-design-spec/SKILL.md` — creates brand-language.user.md if missing (line 175); references it 6×
  - `.claude/skills/lp-design-qa/SKILL.md` — requires brand-language.user.md (line 80); VR-05 checks brand patterns; TC-01/02 check tokens
  - `.claude/skills/lp-launch-qa/SKILL.md` — 4 domains: Conversion/SEO/Performance/Legal; brand fully absent
  - `.claude/skills/lp-offer/SKILL.md` — no brand-dossier in inputs; produces BRIK-offer.md with 6 sections
  - `.claude/skills/lp-channels/SKILL.md` — no brand inputs; consumes lp-offer output only
  - `docs/business-os/strategy/BRIK/brand-language.user.md` — Active; hand-copied token values (drift confirmed E-10)
  - `packages/themes/prime/src/tokens.ts` — source of truth; `--color-primary: { light: '6 78% 47%' }`
  - `.claude/skills/_shared/brand-language-template.md` — template for lp-brand-bootstrap output
  - `docs/registry.json` — canonical file registry (entry for BRIK brand-language at path)
- Patterns to follow:
  - Existing skill SKILL.md structure (frontmatter + numbered sections + quality checks)
  - Existing `.user.md` + `.user.html` artifact pattern
  - Existing advance-rule gate format in startup-loop SKILL.md (Gate A/B/C structure)

## Proposed Approach

BD-3 as S2B sub-deliverable (Option A): S2B is not Done until both `offer` and `messaging_hierarchy`
(Draft minimum) exist. This preserves the S2B→S3+S6B parallel fan-out invariant (E-03). The messaging
hierarchy synthesis is a prompt-handoff step at end of S2B, not a new standalone stage.

Brand Dossier consolidation: Each business gets `brand-dossier.user.md` (replaces `brand-language.user.md`
for BRIK via rename; new artifact for HEAD/PET/HBAG via lp-brand-bootstrap). Competitive positioning and
messaging hierarchy remain separate files (different lifecycle: monthly refresh vs. per-offer-version).
`index.user.md` per business is the gate reference point — gates read status from the index.

BC-01/02/03 (token/typography/palette compliance) are already covered by lp-design-qa TC-01/02/VR-05.
lp-launch-qa Domain 5 adds only BC-04 (voice/words-to-avoid), BC-05 (claims vs proof ledger), and BC-07
(CTA language). BC-06 (imagery) is a soft warning in lp-design-qa VR-05 (brand patterns).

Chosen: Single-rename approach (brand-language → brand-dossier everywhere). No backward-compat shim.
All 7 affected files updated in one task. docs/registry.json entry updated.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | lp-offer: confirm brand-dossier absent; verify optional input add is safe | 95% | S | Complete (2026-02-17) | - | TASK-05 |
| TASK-02 | INVESTIGATE | lp-channels: confirm brand voice absent; verify optional inputs safe | 95% | S | Complete (2026-02-17) | - | TASK-05 |
| TASK-03 | INVESTIGATE | lp-launch-qa: confirm no brand compliance domain; verify Domain 5 insertion point | 95% | S | Complete (2026-02-17) | - | TASK-05 |
| TASK-04 | INVESTIGATE | lp-design-qa: confirm VR-05/TC-01/02 coverage; confirm brand-language required path | 95% | S | Complete (2026-02-17) | - | TASK-05 |
| TASK-05 | CHECKPOINT | Reassess after investigations; confirm findings match plan | 95% | S | Complete (2026-02-17) | TASK-01,02,03,04 | TASK-06..19 |
| TASK-06 | IMPLEMENT | Create evidence dir convention + README template | 88% | S | Complete (2026-02-17) | TASK-05 | - |
| TASK-07 | IMPLEMENT | Create 5 Deep Research prompt templates (BRAND-DR-01..05) | 85% | M | Pending | TASK-05 | - |
| TASK-08 | IMPLEMENT | Create index.user.md template for strategy dir | 92% | S | Pending | TASK-05 | TASK-17,18,19 |
| TASK-09 | IMPLEMENT | Rename BRIK brand-language → brand-dossier; update all 7 skill/doc refs; fix token mirroring | 84% | L | Pending | TASK-05 | TASK-10,12,13,14,15,16,17,18,19 |
| TASK-10 | IMPLEMENT | Create prime-app-design-branding.user.md for BRIK (extract from §11.1, fix path) | 88% | S | Pending | TASK-09 | TASK-13 |
| TASK-11 | IMPLEMENT | Update loop-spec.yaml: BD-3 sub-deliverable comment; version note | 88% | S | Pending | TASK-05 | TASK-12 |
| TASK-12 | IMPLEMENT | Update startup-loop SKILL.md: add GATE-BD-01 + GATE-BD-03 + GATE-BD-08 advance rules | 85% | S | Pending | TASK-09,11 | TASK-13 |
| TASK-13 | IMPLEMENT | Surgery on startup-loop-workflow.user.md: §4 BD-1..6 table, §11 retirement, §12 refresh | 82% | M | Pending | TASK-10,12 | - |
| TASK-14 | IMPLEMENT | Add brand-dossier + messaging-hierarchy as optional inputs to lp-offer + lp-channels | 85% | S | Pending | TASK-09 | - |
| TASK-15 | IMPLEMENT | Add Domain 5 Brand Copy Compliance (BC-04/05/07) to lp-launch-qa | 82% | M | Pending | TASK-09 | - |
| TASK-16 | IMPLEMENT | Change lp-design-spec: replace "create if missing" with GATE-BD-07 hard pre-flight check | 82% | M | Pending | TASK-09 | - |
| TASK-17 | IMPLEMENT | Run lp-brand-bootstrap for HEAD (creates HEAD brand-dossier.user.md at Draft) | 85% | S | Pending | TASK-08,09 | - |
| TASK-18 | IMPLEMENT | Run lp-brand-bootstrap for PET (creates PET brand-dossier.user.md at Draft) | 85% | S | Pending | TASK-08,09 | - |
| TASK-19 | IMPLEMENT | Run lp-brand-bootstrap for HBAG (creates HBAG brand-dossier.user.md at Draft) | 85% | S | Pending | TASK-08,09 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

_Generated by `/lp-sequence` (step 10a). Tasks topologically sorted by dependency._

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | - | Full parallel — 4 independent skill reads |
| 2 | TASK-05 | TASK-01..04 complete | CHECKPOINT — all investigations must complete before proceeding |
| 3 | TASK-06, TASK-07, TASK-08, TASK-11 | TASK-05 | Full parallel — 4 independent editorial tasks |
| 4 | TASK-09 | TASK-05 | Serialized (L-effort, single-writer on 7 files) |
| 5 | TASK-10, TASK-12, TASK-14, TASK-15, TASK-16 | TASK-09 | Parallel — all touch different files |
| 6 | TASK-13 | TASK-10, TASK-12 | Serialized (workflow doc consolidates wave 5 outputs) |
| 7 | TASK-17, TASK-18, TASK-19 | TASK-08, TASK-09 | Parallel — independent business bootstrap runs |

**Max parallelism:** 4 | **Critical path:** 7 waves | **Total tasks:** 19

---

## Tasks

### TASK-01: Investigate lp-offer full contract

- **Type:** INVESTIGATE
- **Deliverable:** Investigation findings documented in plan update + confidence confirmation
- **Execution-Skill:** /lp-build
- **Affects:** `[readonly] .claude/skills/lp-offer/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 95%
  - Implementation: 95% — pure read task; deterministic outcome
  - Approach: 95% — reading official file is the correct way to verify
  - Impact: 95% — no writes; findings only update plan notes
- **Blockers / questions to answer:**
  - Q1: Is brand-dossier absent from optional inputs? (Planning evidence: confirmed absent — E-05 via first 80 lines)
  - Q2: Does full file reveal any brand-consumption behavior beyond line 80?
  - Q3: Is adding brand-dossier to optional inputs safe (no validation that rejects unknown optional fields)?
- **Acceptance:**
  - Read all 228 lines of lp-offer SKILL.md
  - Confirm: brand-dossier/brand-language absent from inputs (required AND optional)
  - Confirm: optional inputs are a freeform list (not schema-validated) — safe to add
  - Confirm: Positioning One-Pager (Section 4) would benefit from brand-dossier context
  - If findings differ from plan evidence, update TASK-14 confidence and approach before proceeding
- **Notes / references:**
  - File at `.claude/skills/lp-offer/SKILL.md` (228 lines; first 80 read during fact-find)

#### Build Completion (2026-02-17)
- **Status:** Complete
- **Commits:** see commit `feat(startup-loop-branding-design-module): TASK-01..04 investigations complete`
- **Execution cycle:**
  - Investigation artifact: findings inline below
  - Validation: all acceptance criteria verified
  - Final: PASS
- **Confidence reassessment:**
  - Original: 95%
  - Post-validation: 95% (confirmed)
  - Delta reason: validation confirmed all planning assumptions
- **Implementation notes:**
  - Q1 CONFIRMED: brand-dossier/brand-language completely absent from all inputs (required + optional)
  - Q2 CONFIRMED: optional inputs are freeform prose bullet list — safe to extend with brand-dossier
  - Q3 NEW FINDING: lp-offer Section 4 (Positioning One-Pager) produces "key message" and "competitive frame" **without** brand-voice guidance; Section 6 (Objection Map) produces "logical/emotional counter" responses also without brand context — this strongly validates G-03 and the TASK-14 insertion
  - TASK-14 impact: no confidence change needed; findings match plan. Insertion point confirmed as both Section 4 (positioning) and Section 6 (objections) in the optional inputs block.

---

### TASK-02: Investigate lp-channels contract

- **Type:** INVESTIGATE
- **Deliverable:** Investigation findings documented in plan update + confidence confirmation
- **Execution-Skill:** /lp-build
- **Affects:** `[readonly] .claude/skills/lp-channels/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 95%
  - Implementation: 95% — pure read; deterministic
  - Approach: 95% — reading file is the authoritative source
  - Impact: 95% — no writes
- **Blockers / questions to answer:**
  - Q1: Is brand-language/brand-dossier absent from all inputs? (Planning: confirmed absent — E-12)
  - Q2: Does lp-channels already reference positioning/voice from brand documents?
  - Q3: Is channel selection rationale (Section 3 "Why this channel fits the positioning") the right insertion point for brand-dossier context?
- **Acceptance:**
  - Read complete lp-channels SKILL.md
  - Confirm: no brand document in required or optional inputs
  - Confirm: insertion point for brand-dossier + messaging-hierarchy as optional inputs
  - If already present (positive risk), update TASK-14 scope to remove lp-channels change
- **Notes / references:**
  - File at `.claude/skills/lp-channels/SKILL.md`

#### Build Completion (2026-02-17)
- **Status:** Complete
- **Commits:** see commit `feat(startup-loop-branding-design-module): TASK-01..04 investigations complete`
- **Execution cycle:**
  - Investigation artifact: findings inline below
  - Validation: all acceptance criteria verified
  - Final: PASS
- **Confidence reassessment:**
  - Original: 95%
  - Post-validation: 95% (confirmed)
  - Delta reason: validation confirmed all planning assumptions
- **Implementation notes:**
  - Q1 CONFIRMED: brand-dossier, brand-language, brand voice, "messaging" — none found in required or optional inputs
  - Q2 CONFIRMED: zero brand references anywhere in file
  - Q3 CONFIRMED: optional inputs are freeform descriptive prose (safe to extend)
  - INSERTION POINT: Stage 3 "Selection Rationale" → "Why this channel fits the positioning" section (approx line 88-89). This is the natural location for brand-dossier + messaging-hierarchy as optional inputs.
  - TASK-14 scope unchanged (lp-channels does need the brand inputs added)

---

### TASK-03: Investigate lp-launch-qa contract

- **Type:** INVESTIGATE
- **Deliverable:** Investigation findings documented in plan update + confidence confirmation
- **Execution-Skill:** /lp-build
- **Affects:** `[readonly] .claude/skills/lp-launch-qa/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 95%
  - Implementation: 95% — pure read; deterministic
  - Approach: 95% — reading file is authoritative
  - Impact: 95% — no writes
- **Blockers / questions to answer:**
  - Q1: Does lp-launch-qa have any brand compliance checks? (Planning: none confirmed — E-13)
  - Q2: What is the structure of a domain section in lp-launch-qa? (needed to author Domain 5)
  - Q3: Is BC-01 (token compliance) truly absent? (Planning: absent — BC-01/02/03 are in lp-design-qa)
  - Q4: Where in the file is the best insertion point for Domain 5?
- **Acceptance:**
  - Read complete lp-launch-qa SKILL.md
  - Confirm: domains 1–4 exist (Conversion, SEO, Performance, Legal); no Domain 5 or brand domain
  - Document: exact domain section structure (check naming, severity model, report format)
  - Confirm: BC-01/02/03 absent from all 4 domains
  - Identify: exact insertion point (after Domain 4, before quality checks section) for Domain 5
  - If Domain 5 or brand checks already exist, update TASK-15 scope accordingly
- **Notes / references:**
  - File at `.claude/skills/lp-launch-qa/SKILL.md`

#### Build Completion (2026-02-17)
- **Status:** Complete
- **Commits:** see commit `feat(startup-loop-branding-design-module): TASK-01..04 investigations complete`
- **Execution cycle:**
  - Investigation artifact: findings inline below
  - Validation: all acceptance criteria verified
  - Final: PASS
- **Confidence reassessment:**
  - Original: 95%
  - Post-validation: 95% (confirmed)
  - Delta reason: validation confirmed all planning assumptions; domain structure now fully documented
- **Implementation notes:**
  - Q1 CONFIRMED: 4 domains — Domain 1: Conversion QA (lines 116-154), Domain 2: SEO Technical Readiness (lines 156-200), Domain 3: Performance Budget (lines 202-238), Domain 4: Legal Compliance (lines 240-284)
  - Q2 CONFIRMED: no brand compliance domain; no BC-xx checks of any kind
  - Q3 DOMAIN STRUCTURE documented (needed for TASK-15 authoring):
    - Header: `#### Domain X: [Name]` + `**Goal:** ...` + `**Checks:**`
    - Check format: `**XX: Title** / What / Pass condition / Evidence / Fail condition / Note`
    - Check ID prefix: C=Conversion, S=SEO, P=Performance, L=Legal → Domain 5 uses BC prefix
    - Severity: Conversion+Legal=Blocker; SEO=Warning; Performance P1-P3=Blocker, P4-P5=Warning
  - Q4 INSERTION POINT: line 286, after Domain 4 ends, before `### 3) Aggregate results` section
  - Q5 CONFIRMED: no token/typography/palette checks in any existing domain (BC-01/02/03 territory untouched)
  - TASK-15 scope unchanged (BC-04/05/07 needed; BC-01/02/03 covered by lp-design-qa)

---

### TASK-04: Investigate lp-design-qa contract

- **Type:** INVESTIGATE
- **Deliverable:** Investigation findings documented in plan update + confidence confirmation
- **Execution-Skill:** /lp-build
- **Affects:** `[readonly] .claude/skills/lp-design-qa/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 95%
  - Implementation: 95% — pure read; deterministic
  - Approach: 95% — reading file is authoritative
  - Impact: 95% — no writes
- **Blockers / questions to answer:**
  - Q1: Does VR-05 check brand signature patterns using brand-language.user.md? (Planning: confirmed yes, line 80)
  - Q2: Does TC-01/TC-02 already cover arbitrary value + palette class audit? (Planning: confirmed yes)
  - Q3: Is brand-language.user.md a REQUIRED input or optional? (Planning: REQUIRED at line 80)
  - Q4: What exact path string is in the input table so TASK-09 can update it correctly?
- **Acceptance:**
  - Read complete lp-design-qa SKILL.md
  - Confirm: brand-language.user.md required at line 80 (or near); document exact path string
  - Confirm: VR-05 checks brand patterns; TC-01/02 check arbitrary values and palette
  - Confirm: GATE-BD-07 addition to lp-design-spec is not needed in lp-design-qa (already covered)
  - Document: exact line numbers of all brand-language.user.md references (needed by TASK-09)
- **Notes / references:**
  - File at `.claude/skills/lp-design-qa/SKILL.md`

#### Build Completion (2026-02-17)
- **Status:** Complete
- **Commits:** see commit `feat(startup-loop-branding-design-module): TASK-01..04 investigations complete`
- **Execution cycle:**
  - Investigation artifact: findings inline below
  - Validation: all acceptance criteria verified
  - Final: PASS
- **Confidence reassessment:**
  - Original: 95%
  - Post-validation: 95% (confirmed) + 1 CRITICAL NEW FINDING
  - Delta reason: all planning assumptions confirmed; one critical finding for TASK-16
- **Implementation notes:**
  - Q1 CONFIRMED: brand-language.user.md is REQUIRED (not optional) at line 80 in inputs table. Exact path: `docs/business-os/strategy/<BIZ>/brand-language.user.md`
  - Q2 CONFIRMED: VR-05 "Brand Signature Patterns" explicitly reads brand-language "Signature Patterns" section and verifies application across components
  - Q3 CONFIRMED: TC-01 (arbitrary value audit — greps for `#`, `rgb(`, `hsl(`, `[`, `px` in className strings) + TC-02 (Tailwind palette audit — no non-semantic color classes) together cover token compliance (BC-01/02/03)
  - Q4 PATH: `docs/business-os/strategy/<BIZ>/brand-language.user.md` — TASK-09 updates this to `brand-dossier.user.md`
  - CRITICAL NEW FINDING (TASK-16 impact): lp-design-qa has **no documented fallback** when brand-language.user.md is missing. The skill marks it REQUIRED and the "Red Flags" section doesn't cover missing brand-language as an early exit. lp-design-spec's current "create if missing" behavior is papering over a hard dependency in lp-design-qa. GATE-BD-07 in TASK-16 is therefore more critical than originally assessed — confidence for TASK-16 holds at 82% (no change needed; criticality was already understood).
  - TASK-09 scope: needs to update lp-design-qa line 80 path (`brand-language.user.md` → `brand-dossier.user.md`) in addition to the 7 files already listed — this is within scope since lp-design-qa is in the 7-file list.

---

### TASK-05: Checkpoint — validate investigation findings and update plan

- **Type:** CHECKPOINT
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11, TASK-12, TASK-13, TASK-14, TASK-15, TASK-16, TASK-17, TASK-18, TASK-19
- **Confidence:** 95%
- **Acceptance:**
  - Run `/lp-replan startup-loop-branding-design-module` using evidence from TASK-01..04
  - Confirm or revise: lp-offer optional input approach (TASK-14)
  - Confirm or revise: lp-channels optional input approach (TASK-14)
  - Confirm or revise: lp-launch-qa Domain 5 insertion point and BC check list (TASK-15)
  - Confirm or revise: lp-design-spec gate change scope (TASK-16)
  - Confirm or revise: exact file paths and line numbers for brand-language rename (TASK-09)
  - Update confidence scores if investigation reveals unexpected findings
  - Plan status remains Active if all TASK-06..19 remain ≥80% after reassessment
- **Horizon assumptions to validate:**
  - lp-offer optional inputs are a freeform list safe to extend
  - lp-launch-qa Domain 5 can be inserted without breaking existing domain numbering
  - lp-design-spec's "create if missing" behavior is the sole brand check (no other brand gate present)

#### Build Completion (2026-02-17)
- **Status:** Complete (2026-02-17)
- **Commits:** see commit `feat(startup-loop-branding-design-module): TASK-05 checkpoint — all findings confirmed`
- **Checkpoint outcome:** All horizon assumptions validated. All remaining tasks TASK-06..19 remain ≥82%. No lp-replan needed. Build continues.
- **Assumptions validated:**
  - ✅ lp-offer optional inputs are freeform (TASK-01)
  - ✅ lp-channels optional inputs are freeform (TASK-02)
  - ✅ lp-launch-qa Domain 5 insertion point at line 286; BC prefix follows C/S/P/L pattern (TASK-03)
  - ✅ lp-design-spec "create if missing" is the only place that auto-creates brand-language (TASK-04 confirms lp-design-qa requires it as REQUIRED input — no auto-creation there)
- **New finding incorporated:** lp-design-qa has no fallback if brand-language missing → GATE-BD-07 in TASK-16 is more critical; confidence unchanged (82%) since approach already accounts for this.

---

### TASK-06: Create evidence directory convention and README template

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — directory README template file
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `docs/business-os/evidence/_templates/README-template.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete confirms template via git commit on plan PR
- **Measurement-Readiness:** Not applicable (one-time convention creation)
- **Affects:**
  - `docs/business-os/evidence/_templates/README-template.md` (new)
  - `docs/business-os/evidence/_templates/.gitkeep` (optional, to commit empty dir structure)
- **Depends on:** TASK-05
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 92% — create new directory + markdown file; clear schema from fact-find
  - Approach: 88% — evidence pack concept well-defined in fact-find; no conflicting patterns
  - Impact: 88% — additive new directory; no existing files touched
- **Acceptance:**
  - `docs/business-os/evidence/_templates/README-template.md` exists
  - Template has: Evidence-Pack frontmatter (BIZ, YYYY-MM, Created, Index sections)
  - Template includes compliance guardrail checklist (5 items from fact-find)
  - Template explains file naming convention: `<source>-<type>-<YYYY-MM-DD>.<ext>`
  - `.user.html` companion not required (template file, not user doc)
- **Validation contract:**
  - VC-01: Template file exists at correct path → `ls docs/business-os/evidence/_templates/README-template.md` returns file
  - VC-02: Template has all 5 compliance guardrail items → grep for "ToS-violating" in file returns match
  - VC-03: File naming convention documented → grep for "YYYY-MM-DD" in file returns match
- **Execution plan:**
  - Red: Confirm `docs/business-os/evidence/` does not exist yet → ls confirms absence
  - Green: Create dir + template file passing VC-01..03
  - Refactor: Review template against fact-find §Evidence Pack Structure; ensure compliance guardrails are clear
- **Rollout / rollback:**
  - Rollout: Additive new directory; no existing code path references it
  - Rollback: `git rm -r docs/business-os/evidence/`
- **Documentation impact:**
  - Referenced from startup-loop-workflow.user.md §4 (added in TASK-13)
- **Notes / references:**
  - Schema defined in `docs/plans/startup-loop-branding-design-module/fact-find.md` §Evidence Pack Structure

#### Build Completion (2026-02-17)
- **Status:** Complete
- **Commits:** see commit `feat(startup-loop-branding-design-module): TASK-06 evidence dir + README template`
- **Execution cycle:** Red → Green → Refactor (1 cycle)
  - Red evidence: `ls docs/business-os/evidence/` → "NOT EXISTS" confirmed
  - Green: Created `docs/business-os/evidence/_templates/README-template.md` with Evidence-Pack frontmatter, naming convention, compliance guardrails (5 items), and Evidence Index table
  - Refactor: Template reviewed against fact-find §Evidence Pack — compliance guardrail items match; stage-gate column added to Evidence Index
- **Validation:** VC-01 PASS · VC-02 PASS ("ToS-violating" present) · VC-03 PASS ("YYYY-MM-DD" present)
- **Confidence reassessment:** 88% → 88% (validation confirmed; no surprises)
- **Documentation impact:** Referenced from TASK-13 (startup-loop-workflow.user.md §4); no immediate doc update needed here

---

### TASK-07: Create 5 Deep Research prompt templates (BRAND-DR-01..05)

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — 5 prompt template files
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `docs/business-os/workflow-prompts/_templates/brand-<name>-prompt.md` (5 files)
- **Reviewer:** Pete
- **Approval-Evidence:** Pete confirms templates are useful via git review
- **Measurement-Readiness:** Measured at first actual use of each template (DR run produces evidence pack entry)
- **Affects:**
  - `docs/business-os/workflow-prompts/_templates/brand-competitor-positioning-prompt.md` (BRAND-DR-01)
  - `docs/business-os/workflow-prompts/_templates/brand-icp-profiling-prompt.md` (BRAND-DR-02)
  - `docs/business-os/workflow-prompts/_templates/brand-claim-proof-validation-prompt.md` (BRAND-DR-03)
  - `docs/business-os/workflow-prompts/_templates/brand-messaging-creative-angles-prompt.md` (BRAND-DR-04)
  - `docs/business-os/workflow-prompts/_templates/brand-ux-design-benchmark-prime-prompt.md` (BRAND-DR-05)
- **Depends on:** TASK-05
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% — all 5 templates fully specified in fact-find with objectives/sources/output format/stop conditions
  - Approach: 85% — prompt templates are a new pattern in workflow-prompts/_templates/; verified directory exists
  - Impact: 85% — new files only; no existing templates modified
- **Acceptance:**
  - All 5 files exist at the correct paths
  - Each template has: Prompt-ID frontmatter, Stage reference, Business/As-of/Evidence-pack-target fields
  - Each template has: Objective, Sources to consult (ordered), Compliance note, Output format, Stop conditions
  - Template BRAND-DR-01 references the compliance guardrails (≤3 sentence quotes, no bulk scraping)
- **Validation contract:**
  - VC-01: All 5 files exist → `ls docs/business-os/workflow-prompts/_templates/brand-*-prompt.md` returns 5 results
  - VC-02: Each file has Prompt-ID header → `grep -l "Prompt-ID" docs/business-os/workflow-prompts/_templates/brand-*-prompt.md` returns 5 results
  - VC-03: Each template has Stop conditions section → `grep -l "Stop conditions" ... brand-*` returns 5
  - VC-04: BRAND-DR-01 compliance section present → `grep "ToS" .../brand-competitor-positioning-prompt.md` returns match
- **Execution plan:**
  - Red: Check `docs/business-os/workflow-prompts/_templates/` directory — confirm brand prompt files are absent
  - Green: Create 5 files using specifications from fact-find §Deliverable D prompt pack
  - Refactor: Cross-check each template against Business VC Quality Checklist principles (isolated, pre-committed, time-boxed stop conditions)
- **Planning validation:**
  - Checks run: `ls docs/business-os/workflow-prompts/` — directory exists, no brand-*-prompt.md files present
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: New files only; additive
  - Rollback: `git rm docs/business-os/workflow-prompts/_templates/brand-*-prompt.md`
- **Documentation impact:**
  - Referenced from startup-loop-workflow.user.md §10 Prompt Hand-Off Map (added in TASK-13)
- **Notes / references:**
  - Full template content specified in fact-find `docs/plans/startup-loop-branding-design-module/fact-find.md` §Deliverable D

---

### TASK-08: Create index.user.md template for strategy directory

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — index.user.md template file
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `docs/business-os/strategy/_templates/index-template.user.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete confirms template by reviewing git diff
- **Measurement-Readiness:** Template used in TASK-17/18/19 (HEAD/PET/HBAG bootstrap)
- **Affects:**
  - `docs/business-os/strategy/_templates/index-template.user.md` (new)
- **Depends on:** TASK-05
- **Blocks:** TASK-17, TASK-18, TASK-19
- **Confidence:** 92%
  - Implementation: 95% — single new file; schema fully specified in fact-find
  - Approach: 92% — index pattern (one file per BIZ as gate reference point) is clearly superior to parsing N individual frontmatters
  - Impact: 92% — new template file only; BRIK does not yet have an index.user.md (creates it in TASK-09)
- **Acceptance:**
  - Template exists at correct path
  - Template has: Strategy-Index frontmatter (Type, Business-Unit, Last-updated)
  - Template has: artifact table with columns: Artifact, Path, Status, Last-reviewed
  - Template includes BRIK example rows and placeholder rows for HEAD/PET/HBAG
  - Note: BRIK's actual index.user.md populated in TASK-09 (alongside brand-dossier rename)
- **Validation contract:**
  - VC-01: Template exists → `ls docs/business-os/strategy/_templates/index-template.user.md` returns file
  - VC-02: Frontmatter has correct Type field → `grep "Type: Strategy-Index" ...` returns match
  - VC-03: Table has 4 expected artifact rows → count rows in template table
- **Execution plan:**
  - Red: Confirm `docs/business-os/strategy/_templates/` does not have index-template.user.md yet
  - Green: Create template with schema from fact-find §Brand Dossier Consolidation
  - Refactor: Verify gate checks can parse the table format (consistent pipe-delimited markdown)
- **Rollout / rollback:** Additive; rollback is git rm
- **Documentation impact:** Referenced from startup-loop SKILL.md gate description (TASK-12)
- **Notes / references:** Schema specified in fact-find §Proposed Module Design → Brand Dossier Consolidation

---

### TASK-09: Rename BRIK brand-language → brand-dossier; fix token mirroring; update all 7 skill/doc refs

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — renamed artifact + updated skill files
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `docs/business-os/strategy/BRIK/brand-dossier.user.md` (renamed from brand-language.user.md)
- **Reviewer:** Pete
- **Approval-Evidence:** `grep -r "brand-language.user.md" .claude/ docs/ apps/ packages/` returns 0 matches in skill/source files after completion
- **Measurement-Readiness:** Next lp-design-spec run uses brand-dossier.user.md (testable immediately)
- **Affects:**
  - `docs/business-os/strategy/BRIK/brand-language.user.md` → `docs/business-os/strategy/BRIK/brand-dossier.user.md` (rename + content fix)
  - `docs/business-os/strategy/BRIK/index.user.md` (new — create using template from TASK-08)
  - `.claude/skills/lp-brand-bootstrap/SKILL.md` (3 refs: description, trigger, output path)
  - `.claude/skills/lp-design-qa/SKILL.md` (2 refs: operating mode, inputs table)
  - `.claude/skills/lp-design-spec/SKILL.md` (6 refs: input table, workflow, quality check, completion)
  - `.claude/skills/_shared/brand-language-template.md` (1 ref: save path in file header)
  - `docs/registry.json` (1 ref: path entry for BRIK brand-language)
- **Depends on:** TASK-05
- **Blocks:** TASK-10, TASK-12, TASK-13, TASK-14, TASK-15, TASK-16, TASK-17, TASK-18, TASK-19
- **Confidence:** 84%
  - Implementation: 88% — all reference locations confirmed by grep (13 refs across 7 files); rename + content edit is straightforward; token values removal clearly specified
  - Approach: 85% — single-rename approach with no backward-compat shim; aligns with "avoid backward-compatibility hacks" in CLAUDE.md
  - Impact: 85% — all 7 affected files identified; grep probe confirmed no others in .claude/, docs/ (lp-onboarding-audit is optional/enhancing only, not a gate)
- **Acceptance:**
  - `docs/business-os/strategy/BRIK/brand-dossier.user.md` exists with:
    - Frontmatter: Type: Brand-Dossier, Token-Source: packages/themes/prime/src/tokens.ts
    - No hand-copied token values (HSL values removed from Color Palette section)
    - Token Rationale section added (token-name → rationale, not value)
    - Status remains Active
  - `docs/business-os/strategy/BRIK/index.user.md` created with BRIK artifact status table
  - All 7 files updated: old `brand-language.user.md` path → `brand-dossier.user.md`
  - lp-design-spec: "Create brand-language.user.md if missing" replaced with GATE-BD-07 pre-flight text (see TASK-16 for full gate; here just update the path reference, not the gate logic)
  - `.user.html` companion for brand-dossier.user.md regenerated via `pnpm docs:render-user-html`
- **Validation contract:**
  - VC-01: brand-dossier.user.md exists, brand-language.user.md does not → `ls docs/business-os/strategy/BRIK/brand-dossier.user.md` pass; `ls docs/business-os/strategy/BRIK/brand-language.user.md` fail
  - VC-02: No remaining references to brand-language.user.md in skill files → `grep -r "brand-language.user.md" .claude/skills/` returns 0 matches
  - VC-03: Token values absent from brand-dossier.user.md → `grep "78% 57\|78% 47" docs/business-os/strategy/BRIK/brand-dossier.user.md` returns 0 matches
  - VC-04: Token-Source field present → `grep "Token-Source" docs/business-os/strategy/BRIK/brand-dossier.user.md` returns match
  - VC-05: BRIK index.user.md exists with brand-dossier row → `grep "brand-dossier.user.md" docs/business-os/strategy/BRIK/index.user.md` returns match
  - VC-06: docs/registry.json updated → `grep "brand-dossier.user.md" docs/registry.json` returns match; `grep "brand-language.user.md" docs/registry.json` returns 0 matches
- **Execution plan:**
  - Red evidence (already gathered during planning): grep probe surfaced all 13 references across 7 files. lp-design-spec creates brand-language.user.md if missing (line 175) — this confirms TASK-16 must change that behavior, not just rename the path.
  - Green: Rename BRIK file, fix token values, create BRIK index.user.md, update all 7 files to reference brand-dossier.user.md
  - Refactor: Run VC-01..06 checks; regenerate .user.html; confirm no stale references remain
- **Scouts:**
  - "docs/registry.json entry format" → checked via grep during planning → `"path": "docs/business-os/strategy/BRIK/brand-language.user.md"` confirmed at line 1599; format is simple path field update
  - "lp-onboarding-audit references brand-language" → confirmed optional/enhancing (not a gate); path update optional (not blocking)
  - "docs/plans/brik-activities-program/fact-find.md references brand-language" → read-only plan doc; update is documentation hygiene, not functional
- **Edge Cases & Hardening:**
  - lp-design-spec "create if missing" code: path update in TASK-09 only updates the path string; the create behavior is changed in TASK-16. If TASK-09 runs before TASK-16, lp-design-spec will attempt to create brand-dossier.user.md if missing — this is acceptable transitional state (creates the right file at the right path)
  - docs/plans/brik-activities-program/fact-find.md is a read-only plan doc citing the old path: update for accuracy but not functional gate
- **Planning validation:**
  - Checks run: `grep -r "brand-language.user.md" .claude/ docs/` — found 13 matches across 7 files (confirmed above)
  - Unexpected findings: lp-design-spec has 6 references (more than anticipated); also CREATES the file (not just reads it) — increases scope to M-effort; reclassified to L due to 7 files affected
- **What would make this ≥90%:**
  - Run the full grep probe after each file update to confirm zero remaining references
  - Add a `.user.html` regeneration step and confirm the HTML companion builds without error
- **Rollout / rollback:**
  - Rollout: Update all files in a single commit; no partial state
  - Rollback: `git revert <commit>` — all 7 files revert atomically
- **Documentation impact:**
  - docs/registry.json (path entry updated)
  - docs/plans/brik-activities-program/fact-find.md (documentation hygiene — update old path citation)

---

### TASK-10: Create prime-app-design-branding.user.md for BRIK

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — new BRIK-specific design doc
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `docs/business-os/strategy/BRIK/prime-app-design-branding.user.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews via git diff; confirms §11.1 content is correctly migrated
- **Measurement-Readiness:** Referenced in §11 retirement (TASK-13); used by lp-design-spec for Prime-specific context
- **Affects:**
  - `docs/business-os/strategy/BRIK/prime-app-design-branding.user.md` (new)
  - `docs/business-os/strategy/BRIK/prime-app-design-branding.user.html` (companion, generated)
- **Depends on:** TASK-09
- **Blocks:** TASK-13
- **Confidence:** 88%
  - Implementation: 90% — extract §11.1 content from workflow doc; clear target structure from fact-find
  - Approach: 88% — Prime-specific doc projection from brand-dossier is the right pattern for app-level specificity
  - Impact: 88% — new file only; §11.1 source is read-only (not deleted here; retired in TASK-13)
- **Acceptance:**
  - File exists at correct path
  - Contains: Scope declaration (governed surfaces), 7 design principles (migrated from §11.1)
  - Path corrected: references `packages/themes/prime/src/tokens.ts` (not `tokens.css` from §11)
  - Token Rationale section (no hand-copied values; rationale for coral, Plus Jakarta Sans, radius)
  - Link to brand-dossier.user.md for non-Prime-specific decisions
  - Signature Patterns section (initially empty/placeholder; populated via lp-design-spec feature work)
  - Status: Active, Last-reviewed: today
  - `.user.html` companion generated
- **Validation contract:**
  - VC-01: File exists → `ls docs/business-os/strategy/BRIK/prime-app-design-branding.user.md` pass
  - VC-02: tokens.ts path (not tokens.css) → `grep "tokens.ts" ...prime-app-design-branding.user.md` match; `grep "tokens.css" ...` returns 0
  - VC-03: 7 design principles present → count principles in file (Mobile-First, Warmth, Clarity, etc.)
  - VC-04: Token-Source reference present → `grep "Token-Source\|tokens.ts" ...` match
- **Execution plan:**
  - Red: Confirm §11.1 content is in workflow doc with the path inconsistency (tokens.css) — confirms extraction task
  - Green: Create file with migrated §11.1 content + corrected path + token rationale section
  - Refactor: Verify all prime-specific elements reference brand-dossier for cross-cutting brand context
- **Rollout / rollback:** New file; rollback is git rm
- **Documentation impact:**
  - startup-loop-workflow.user.md §11 (retired and pointer added to this file in TASK-13)

---

### TASK-11: Update loop-spec.yaml — BD-3 sub-deliverable comment; version note

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — updated YAML spec file
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `docs/business-os/startup-loop/loop-spec.yaml`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews git diff; confirms comment accuracy
- **Measurement-Readiness:** Next S2B stage-result will include messaging_hierarchy in produced_keys (operational; confirmed by loop-spec version check in startup-loop SKILL.md)
- **Affects:**
  - `docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** TASK-05
- **Blocks:** TASK-12
- **Confidence:** 88%
  - Implementation: 90% — YAML comment addition is low-risk; spec_version bump is additive
  - Approach: 90% — loop-spec.yaml is the authoritative stage graph; BD-3 comment makes the sub-deliverable relationship explicit
  - Impact: 85% — spec_version bump requires all consumers checking `loop_spec_version` to see a version change; confirmed stage-result schema validates stage ID not version compatibility, so bump is safe
- **Acceptance:**
  - S2B entry has comment explaining BD-3 messaging-hierarchy as sub-deliverable
  - S2B bos_sync note updated to reference messaging_hierarchy artifact
  - spec_version bumped from "1.0.0" to "1.1.0" (minor version; additive annotation change)
  - `decision_reference` note added pointing to this plan
- **Validation contract:**
  - VC-01: BD-3 comment present → `grep -A3 "id: S2B" loop-spec.yaml` shows BD-3 sub-deliverable comment
  - VC-02: spec_version bumped → `grep "spec_version" loop-spec.yaml` shows 1.1.0
- **Execution plan:**
  - Red: Read loop-spec.yaml S2B entry — confirms no BD-3 mention, produced_keys not specified in stage def (only in stage-result examples)
  - Green: Add BD-3 comment to S2B entry; update bos_sync note; bump spec_version
  - Refactor: Verify all stage IDs are still valid; check format consistency against rest of YAML
- **Rollout / rollback:**
  - Rollout: Comment-only change + spec_version bump; no runtime behavior change
  - Rollback: `git revert`
- **Documentation impact:** None beyond the spec file itself

---

### TASK-12: Update startup-loop SKILL.md — add GATE-BD-01, GATE-BD-03, GATE-BD-08 advance rules

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — updated startup-loop SKILL.md with 3 new gate rules
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/startup-loop/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews git diff; confirms gate rules match Gate Policy table from fact-find
- **Measurement-Readiness:** Next S1 advance call for any business triggers GATE-BD-01 check (testable immediately)
- **Affects:**
  - `.claude/skills/startup-loop/SKILL.md`
- **Depends on:** TASK-09, TASK-11
- **Blocks:** TASK-13
- **Confidence:** 85%
  - Implementation: 88% — existing advance rule structure confirmed (Gate A/B/C); adding 3 new gates to same pattern
  - Approach: 85% — gate IDs defined in fact-find Gate Policy table; S1 and S2B are correct insertion points
  - Impact: 83% — modifying the startup-loop SKILL.md advance rules affects every loop run; gate text must be precise to avoid false-blocking
- **Acceptance:**
  - GATE-BD-01 added to S1 advance rules: blocks if brand-dossier.user.md missing or Status != Draft/Active
  - GATE-BD-03 added to S2B Done rules: blocks if messaging-hierarchy.user.md missing or Status not Draft/Active
  - GATE-BD-08 added to S10 standing refresh: warning if brand-dossier.user.md Last-reviewed > 90 days
  - Gate blocking messages match Gate Policy table (fact-find §Gate Policy)
  - Gate IDs referenced (GATE-BD-01, GATE-BD-03, GATE-BD-08) for cross-reference to Gate Policy table
  - Index.user.md used as the gate-check lookup point (not individual file frontmatter)
- **Validation contract:**
  - VC-01: GATE-BD-01 present → `grep "GATE-BD-01" .claude/skills/startup-loop/SKILL.md` returns match
  - VC-02: GATE-BD-03 present → `grep "GATE-BD-03" .claude/skills/startup-loop/SKILL.md` returns match
  - VC-03: GATE-BD-08 present → `grep "GATE-BD-08" .claude/skills/startup-loop/SKILL.md` returns match
  - VC-04: Gates reference brand-dossier.user.md (not brand-language.user.md) → `grep "brand-language" .../startup-loop/SKILL.md` returns 0
- **Execution plan:**
  - Red: Read current advance rules section — confirms Gate A/B/C structure; brand-language absent
  - Green: Add GATE-BD-01/03/08 using Gate A/B/C formatting pattern as template
  - Refactor: Verify blocking messages are actionable ("Run /lp-brand-bootstrap <BIZ>")
- **Edge Cases & Hardening:**
  - GATE-BD-01 must handle businesses that are at S1 for the first time: block with clear instruction to run /lp-brand-bootstrap
  - GATE-BD-03 must handle the case where messaging-hierarchy exists but Status is not parseable: default to blocked (fail-closed)
- **Rollout / rollback:**
  - Rollout: Effective immediately for any future loop run; existing BRIK loop state unaffected (already past S1)
  - Rollback: `git revert` — restores old advance rules without new gates
- **Documentation impact:** startup-loop-workflow.user.md §13 Advance Rules (updated in TASK-13)

---

### TASK-13: Surgery on startup-loop-workflow.user.md (§4 embedding, §11 retirement, §12 refresh)

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — revised workflow documentation
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `docs/business-os/startup-loop-workflow.user.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews git diff; confirms §11 retired without content loss (migrated to prime-app-design-branding.user.md)
- **Measurement-Readiness:** Verified by reading §4 stage table to confirm BD-1..BD-6 entries are present
- **Affects:**
  - `docs/business-os/startup-loop-workflow.user.md`
  - `docs/business-os/startup-loop-workflow.user.html` (regenerated companion)
- **Depends on:** TASK-10, TASK-12
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 83% — large markdown file surgery; §4 stage table and §11 sections confirmed from E-01 evidence; §12 structure confirmed from fact-find
  - Approach: 83% — embedding BD-1..6 in §4 (not as a separate appendix) is the correct pattern for first-class stages
  - Impact: 80% — this is the primary human-readable workflow reference; changes must be accurate and complete
- **Acceptance:**
  - §4 stage table includes BD-1 (S1 gate), BD-2 (after S2), BD-3 (S2B sub-deliverable), BD-4 (after S6B), BD-5 (S7/S8 design spec gate), BD-6 (S9B QA)
  - §11 "Design Policy" content is retired: header retained with "→ See: [prime-app-design-branding.user.md] and [brand-dossier.user.md]" redirect; body content removed (migrated in TASK-10)
  - §11.1 `tokens.css` path inconsistency eliminated (no longer present after retirement)
  - §12 Standing Refresh table gains: brand-dossier quarterly review entry (GATE-BD-08)
  - §13 Advance Rules section updated to reference new GATE-BD-01/03 (consistent with TASK-12)
  - `.user.html` companion regenerated (`pnpm docs:render-user-html`)
- **Validation contract:**
  - VC-01: BD-1..BD-6 in §4 → `grep "BD-1\|BD-2\|BD-3\|BD-4\|BD-5\|BD-6" docs/business-os/startup-loop-workflow.user.md | wc -l` ≥ 6
  - VC-02: §11 body content removed (tokens.css gone) → `grep "tokens.css" docs/business-os/startup-loop-workflow.user.md` returns 0
  - VC-03: §11 has redirect pointers → `grep "prime-app-design-branding" docs/business-os/startup-loop-workflow.user.md` returns match
  - VC-04: §12 has brand-dossier refresh entry → `grep "brand-dossier" docs/business-os/startup-loop-workflow.user.md | grep -i "quarterly\|refresh"` returns match
- **Execution plan:**
  - Red: Read §4, §11, §12, §13 sections — confirm current state; identify exact insertion points for BD-1..6 in §4 table format
  - Green: Add BD-1..6 rows to §4; retire §11 with redirects; add §12 brand-dossier entry; update §13 gate refs
  - Refactor: Re-read full doc for consistency; regenerate .user.html
- **Edge Cases & Hardening:**
  - §11 retirement must not lose content permanently — TASK-10 must be complete first (content already migrated to prime-app-design-branding.user.md before §11 is retired)
  - §4 BD entries must use consistent format with existing stage entries (same column structure)
- **Rollout / rollback:**
  - Rollout: Documentation-only change; no code affected
  - Rollback: `git revert`
- **Documentation impact:**
  - primary output IS this doc; companion .user.html also updated

---

### TASK-14: Add brand-dossier + messaging-hierarchy as optional inputs to lp-offer and lp-channels

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — updated SKILL.md optional input sections
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/lp-offer/SKILL.md`, `.claude/skills/lp-channels/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews git diff; confirms optional inputs do not require any structural change to skill workflow
- **Measurement-Readiness:** Next lp-offer/lp-channels run will reference brand-dossier if present (passable with or without)
- **Affects:**
  - `.claude/skills/lp-offer/SKILL.md`
  - `.claude/skills/lp-channels/SKILL.md`
- **Depends on:** TASK-09
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% — add 1-2 items to existing optional inputs list; confirmed safe from TASK-01/02 investigation
  - Approach: 87% — optional (not required) is the correct stance: brand-dossier enhances quality but must not block businesses without it
  - Impact: 85% — 2 skill files; minimal change; no impact on existing lp-offer/channels outputs or QC checks
- **Acceptance:**
  - lp-offer optional inputs section includes: `brand-dossier.user.md` with note "enhances Positioning One-Pager (Section 4) voice and personality"
  - lp-channels optional inputs section includes: `brand-dossier.user.md` (for channel voice) and `messaging-hierarchy.user.md` (for channel-specific messaging alignment)
  - Neither skill has brand inputs added to required inputs (must not block businesses without brand artifacts)
  - No QC-XX or red flag checks modified (optional inputs do not gate skill completion)
- **Validation contract:**
  - VC-01: brand-dossier in lp-offer optional → `grep "brand-dossier" .claude/skills/lp-offer/SKILL.md` returns match
  - VC-02: brand-dossier in lp-channels optional → `grep "brand-dossier" .claude/skills/lp-channels/SKILL.md` returns match
  - VC-03: messaging-hierarchy in lp-channels optional → `grep "messaging-hierarchy" .claude/skills/lp-channels/SKILL.md` returns match
  - VC-04: brand inputs NOT in required section → `grep -A5 "Required:" .claude/skills/lp-offer/SKILL.md` does not contain "brand"
- **Execution plan:**
  - Red: Read current optional inputs sections — confirm absence of brand references
  - Green: Add brand-dossier (lp-offer), brand-dossier + messaging-hierarchy (lp-channels) to optional inputs
  - Refactor: Verify added items follow existing optional input format (markdown list with path + description)
- **Rollout / rollback:** 2-line additions; rollback is git revert
- **Documentation impact:** None

---

### TASK-15: Add Domain 5 Brand Copy Compliance to lp-launch-qa

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — updated lp-launch-qa SKILL.md with new Domain 5
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/lp-launch-qa/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews git diff; confirms BC checks use correct severity
- **Measurement-Readiness:** Next lp-launch-qa run for any business emits Domain 5 pass/fail in report
- **Affects:**
  - `.claude/skills/lp-launch-qa/SKILL.md`
- **Depends on:** TASK-09
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 84% — domain section structure confirmed from TASK-03 investigation; BC-04/05/07 clearly defined in Gate Policy table
  - Approach: 83% — Domain 5 scope is correct (copy compliance only; token/signature compliance already in lp-design-qa)
  - Impact: 80% — modifies lp-launch-qa; every future S9B run includes new domain; blocking only BC-04 claims with zero proof (soft behavior by default)
- **Acceptance:**
  - Domain 5: Brand Copy Compliance added after Domain 4 (Legal), before Quality Checks section
  - BC-04 [GATE-BD-06b Warn]: Copy reviewed against Words to Avoid list from brand-dossier
  - BC-05 [GATE-BD-06b Warn]: All substantive copy claims present in messaging-hierarchy Claims + Proof Ledger
  - BC-07 [GATE-BD-06b Warn]: Primary CTA language matches brand-dossier Key Phrases
  - Optional pre-flight: if brand-dossier.user.md missing, Domain 5 is skipped with note "Brand Dossier absent — skipping brand copy compliance checks"
  - Domain 5 pass criteria: all applicable checks pass; failures are warnings (not blockers) per GATE-BD-06b
  - QA report template updated to include Domain 5 section
  - Pass/fail table in completion message updated to include Domain 5 row
- **Validation contract:**
  - VC-01: Domain 5 heading present → `grep "Domain 5\|Brand Copy" .claude/skills/lp-launch-qa/SKILL.md` returns match
  - VC-02: BC-04/05/07 present → `grep "BC-04\|BC-05\|BC-07" .../lp-launch-qa/SKILL.md` returns 3 matches
  - VC-03: Domain 5 severity is warning (not blocker) → `grep -A5 "Domain 5" ...` contains "warning"
  - VC-04: Skip rule when brand-dossier absent → `grep "absent\|missing" .../lp-launch-qa/SKILL.md | grep -i "brand"` returns match
- **Execution plan:**
  - Red: Read lp-launch-qa in full (or confirmed from TASK-03 findings) — confirm no Domain 5 exists; note exact insertion point (after L6 check)
  - Green: Add Domain 5 section following Domain 4 structure; update report template and completion message
  - Refactor: Verify Domain 5 does not duplicate lp-design-qa TC-01/02 checks; confirm "skip if brand-dossier absent" path is clear
- **Edge Cases & Hardening:**
  - Businesses without messaging-hierarchy (not yet at S2B completion): BC-05 must be skipped gracefully (not block launch)
  - Ambiguous "Words to Avoid" absence (brand-dossier missing that section): skip BC-04 with note
- **Rollout / rollback:** Single skill file edit; rollback is git revert
- **Documentation impact:** startup-loop-workflow.user.md §4 BD-6 entry (covered in TASK-13)

---

### TASK-16: Change lp-design-spec — replace "create if missing" with GATE-BD-07 hard pre-flight check

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — updated lp-design-spec SKILL.md with hard gate and new path
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Artifact-Destination:** `.claude/skills/lp-design-spec/SKILL.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews git diff; confirms gate error message is actionable
- **Measurement-Readiness:** Next lp-design-spec run without brand-dossier emits GATE-BD-07 error (testable immediately)
- **Affects:**
  - `.claude/skills/lp-design-spec/SKILL.md` (6 refs updated; "create if missing" behavior changed)
- **Depends on:** TASK-09
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 85% — all 6 reference locations confirmed (grep during planning); "create if missing" is at line 175; quality check at line 295 — both must be updated
  - Approach: 83% — changing from "create if missing" to "require Active" is a breaking change to lp-design-spec behavior; correct approach is to run /lp-brand-bootstrap first, then lp-design-spec
  - Impact: 80% — any future lp-design-spec run without brand-dossier Active will now fail-closed; this is intentional but must have clear error message and remediation path
- **Acceptance:**
  - All 6 `brand-language.user.md` references updated to `brand-dossier.user.md`
  - Line 175 "Create brand-language.user.md" removed and replaced with GATE-BD-07 pre-flight check:
    - Error: "Brand Dossier must be Active before running design spec. Run /lp-brand-bootstrap <BIZ>."
    - Checks: `docs/business-os/strategy/<BIZ>/brand-dossier.user.md` exists AND Status == Active
  - Quality check at line 295 updated from "Brand language doc exists" to "Brand Dossier Active (GATE-BD-07)"
  - Completion message (line 371) updated to reference brand-dossier.user.md
  - No other behavioral changes to lp-design-spec workflow
- **Validation contract:**
  - VC-01: No brand-language.user.md refs → `grep "brand-language.user.md" .claude/skills/lp-design-spec/SKILL.md` returns 0
  - VC-02: GATE-BD-07 pre-flight present → `grep "GATE-BD-07\|brand-dossier.user.md" .../lp-design-spec/SKILL.md | wc -l` ≥ 6
  - VC-03: Error message with remediation → `grep "lp-brand-bootstrap" .../lp-design-spec/SKILL.md` returns match
  - VC-04: "create" behavior removed → `grep -n "Create.*brand" .../lp-design-spec/SKILL.md` returns 0
- **Execution plan:**
  - Red: Read lp-design-spec in full — confirm "create if missing" at line 175, 6 references total; confirms gate currently absent
  - Green: Update all 6 references; replace "create if missing" with GATE-BD-07 pre-flight
  - Refactor: Read updated skill from top to confirm consistent behavior narrative; verify gate message is actionable
- **Edge Cases & Hardening:**
  - lp-design-spec is run as part of S7 stage — if brand-dossier is Active by S7 (per GATE-BD-01 at S1), GATE-BD-07 should rarely fire; however it's a safety net for manual runs
  - HEAD/PET/HBAG businesses: lp-brand-bootstrap runs at S1 create Draft brand-dossier; must be elevated to Active before S7 (this is a process gap, documented as a risk, not resolved in this task)
- **Rollout / rollback:** Single skill file update; rollback is git revert
- **Documentation impact:** startup-loop-workflow.user.md §4 BD-5 entry (covered in TASK-13)

---

### TASK-17: Run lp-brand-bootstrap for HEAD

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — HEAD brand-dossier.user.md at Draft status
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-brand-bootstrap
- **Artifact-Destination:** `docs/business-os/strategy/HEAD/brand-dossier.user.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews brand-dossier Draft; confirms demographic hypothesis is reasonable
- **Measurement-Readiness:** GATE-BD-01 will pass at HEAD's next S1 entry
- **Affects:**
  - `docs/business-os/strategy/HEAD/brand-dossier.user.md` (new)
  - `docs/business-os/strategy/HEAD/index.user.md` (new — create alongside)
  - `docs/business-os/strategy/HEAD/brand-dossier.user.html` (companion, generated)
- **Depends on:** TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% — lp-brand-bootstrap skill exists; runs for any business given strategy plan
  - Approach: 85% — HEAD brand-dossier is best created now to unblock future S1 entry; Draft status is sufficient
  - Impact: 82% — creates 2 new files for HEAD; no existing HEAD files modified
- **Acceptance:**
  - `docs/business-os/strategy/HEAD/brand-dossier.user.md` exists with Type: Brand-Dossier, Status: Draft
  - Frontmatter has Token-Source field (pointing to HEAD theme tokens if exists, or TBD)
  - All TBD entries have rationale: `TBD — {specific thing needed}`
  - HEAD index.user.md created with brand-dossier row (Status: Draft)
  - .user.html companion generated
- **Validation contract:**
  - VC-01: brand-dossier.user.md exists → `ls docs/business-os/strategy/HEAD/brand-dossier.user.md` pass
  - VC-02: Status is Draft → `grep "Status: Draft" docs/business-os/strategy/HEAD/brand-dossier.user.md` match
  - VC-03: Token-Source present → `grep "Token-Source" docs/business-os/strategy/HEAD/brand-dossier.user.md` match
- **Execution plan:**
  - Red: Confirm HEAD strategy dir has plan.user.md but no brand-dossier (confirmed E-07)
  - Green: Run `/lp-brand-bootstrap HEAD`; update output to use brand-dossier.user.md path (not brand-language.user.md); create index.user.md
  - Refactor: Confirm all TBD fields have rationale; add Token-Source field if lp-brand-bootstrap doesn't add it
- **Rollout / rollback:** New files; rollback is git rm
- **Documentation impact:** index.user.md registers artifact

---

### TASK-18: Run lp-brand-bootstrap for PET

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — PET brand-dossier.user.md at Draft status
- **Execution-Skill:** /lp-brand-bootstrap
- **Artifact-Destination:** `docs/business-os/strategy/PET/brand-dossier.user.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews brand-dossier Draft
- **Measurement-Readiness:** GATE-BD-01 will pass at PET's next S1 entry
- **Affects:**
  - `docs/business-os/strategy/PET/brand-dossier.user.md` (new)
  - `docs/business-os/strategy/PET/index.user.md` (new)
- **Depends on:** TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% — same pattern as TASK-17
  - Approach: 85% — same rationale as TASK-17
  - Impact: 82% — new files only
- **Acceptance:** Same pattern as TASK-17 with PET paths
- **Validation contract:**
  - VC-01..03: Same as TASK-17 with PET paths
- **Execution plan:** Same as TASK-17 with PET
- **Rollout / rollback:** New files; rollback is git rm
- **Documentation impact:** index.user.md registers artifact

---

### TASK-19: Run lp-brand-bootstrap for HBAG

- **Type:** IMPLEMENT
- **Deliverable:** business-artifact — HBAG brand-dossier.user.md at Draft status
- **Execution-Skill:** /lp-brand-bootstrap
- **Artifact-Destination:** `docs/business-os/strategy/HBAG/brand-dossier.user.md`
- **Reviewer:** Pete
- **Approval-Evidence:** Pete reviews brand-dossier Draft
- **Measurement-Readiness:** GATE-BD-01 will pass at HBAG's next S1 entry
- **Affects:**
  - `docs/business-os/strategy/HBAG/brand-dossier.user.md` (new)
  - `docs/business-os/strategy/HBAG/index.user.md` (new)
- **Depends on:** TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% — same pattern as TASK-17
  - Approach: 85% — same rationale
  - Impact: 82% — new files only; HBAG has no apps yet so brand-dossier is forward-looking Draft
- **Acceptance:** Same pattern as TASK-17 with HBAG paths
- **Validation contract:**
  - VC-01..03: Same as TASK-17 with HBAG paths
- **Execution plan:** Same as TASK-17 with HBAG
- **Rollout / rollback:** New files; rollback is git rm
- **Documentation impact:** index.user.md registers artifact

---

## Risks & Mitigations

- **lp-design-spec gate (GATE-BD-07) breaks existing workflows for businesses without brand-dossier at Active:** Must run lp-brand-bootstrap before lp-design-spec. HEAD/PET/HBAG brand-dossiers will be Draft after TASK-17/18/19 — must be elevated to Active before S7. Mitigation: document in startup-loop-workflow.user.md that Draft → Active transition is a pre-S7 requirement.
- **BRIK brand-language rename breaks docs/plans/brik-activities-program/fact-find.md reference:** Low-risk (read-only doc); update as hygiene step in TASK-09.
- **loop-spec.yaml version bump (1.0.0 → 1.1.0) may affect loop-state.json files with pinned version:** Stage-result schema validates `stage` ID (not version compatibility); no existing run-state.json files pin the spec version. Risk is low.
- **lp-launch-qa Domain 5 fires for businesses without messaging-hierarchy Active:** Skip rule explicitly handles this (BC-05 skipped if messaging-hierarchy absent). Mitigation: "skip if absent" logic in TASK-15 acceptance.
- **index.user.md parsing: gates assume consistent markdown table format:** All indexes use the template from TASK-08; consistent format ensured by template constraint.

## Observability

- Logging: Gate failures surface in startup-loop advance rules with explicit blocking messages
- Metrics: Gate GATE-BD-01..08 pass/fail rates observable in S1/S2B/S9B advance logs
- Alerts/Dashboards: GATE-BD-08 quarterly staleness warning appears in S10 weekly readout

## Acceptance Criteria (overall)

- [ ] GATE-BD-01 in startup-loop SKILL.md: S1 advance blocked without brand-dossier Draft
- [ ] GATE-BD-03 in startup-loop SKILL.md: S2B Done blocked without messaging-hierarchy Draft
- [ ] brand-dossier.user.md exists for BRIK (renamed, no hand-copied token values, Status: Active)
- [ ] brand-dossier.user.md exists for HEAD, PET, HBAG (Status: Draft minimum)
- [ ] prime-app-design-branding.user.md exists for BRIK (Status: Active, correct path to tokens.ts)
- [ ] index.user.md exists for BRIK, HEAD, PET, HBAG
- [ ] 5 prompt templates at docs/business-os/workflow-prompts/_templates/brand-DR-0{1..5}-*.md
- [ ] Evidence directory convention at docs/business-os/evidence/_templates/README-template.md
- [ ] lp-design-spec GATE-BD-07: blocks if brand-dossier not Active (not "create if missing")
- [ ] lp-launch-qa Domain 5: BC-04/05/07 present as warnings
- [ ] startup-loop-workflow.user.md §4 has BD-1..6; §11 retired; §12 has brand-dossier refresh entry
- [ ] All references to brand-language.user.md updated in skills (grep returns 0 in .claude/skills/)
- [ ] loop-spec.yaml spec_version bumped to 1.1.0 with BD-3 comment

## Decision Log

- 2026-02-17: BD-3 placement — Option A chosen (sub-deliverable of S2B, not S6B gate). Preserves fan-out invariant (E-03). S4 join barrier unaffected (only requires offer + forecast + channels).
- 2026-02-17: Single-rename strategy (brand-language → brand-dossier everywhere). No backward-compat shim. All 7 files updated in TASK-09.
- 2026-02-17: BC-01/02/03 not added to lp-launch-qa. Already covered by lp-design-qa TC-01/TC-02/VR-05. lp-launch-qa Domain 5 covers only copy compliance (BC-04/05/07).
- 2026-02-17: lp-design-spec "create if missing" behavior changed to hard GATE-BD-07. Brand bootstrap is now a prerequisite for design spec, not an implicit fallback.
- 2026-02-17: HEAD/PET/HBAG brand-dossiers created at Draft in this plan. XA excluded (no apps or loop entry imminent per fact-find).
