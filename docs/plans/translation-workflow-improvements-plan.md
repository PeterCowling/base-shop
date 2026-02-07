---
Type: Plan
Status: Active
Domain: Platform
Created: 2026-02-07
Last-updated: 2026-02-07
Feature-Slug: translation-workflow-improvements
Overall-confidence: 91%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

# Translation Workflow Improvements Plan

## Summary

Overhaul the `improve-translate-guide` skill to implement a "structure-first, translate-second" workflow with mandatory validation gates and persistence verification. The current workflow conflates structural repair with translation, causing agents to produce condensed summaries instead of faithful translations (observed: 0% batch success for Batches 1-2, 100% success with structure-first approach in Batch 3). Changes are confined to skill markdown, one new validation script, and a MEMORY.md update.

## Goals

- Eliminate false-positive "complete" reports where agent work didn't persist or had wrong structure
- Reduce wasted agent time on structural work that Python can do in seconds
- Increase translation batch success rate to near 100% (baseline: Batch 1-2 = 0%, Batch 3 = 100%)
- Add validation checkpoints between phases that catch drift before it accumulates

## Non-goals

- Changing the fundamental parallel translation strategy (still use 3-4 agents)
- Rewriting existing translation content (focus is on workflow process)
- Adding new locales or changing locale coverage
- Making i18n-parity-quality-audit a CI blocker (future work after workflow is proven)

## Constraints & Assumptions

- Constraints:
  - Must maintain 17-locale coverage (ar, da, de, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh)
  - Must preserve existing translation quality and token integrity
  - Workflow changes should add <5 minutes overhead per guide batch
- Assumptions:
  - Python structural scripts are faster and more reliable than agents for structure restoration (proven: 94 files in <30s)
  - Validation between phases catches issues earlier than end-of-batch validation (proven in session)

## Fact-Find Reference

- Related brief: `docs/plans/translation-workflow-improvements-fact-find.md`
- Key findings:
  - Agent-only workflow: 0% success (Batches 1-2, 102 locale files all wrong)
  - Structure-first workflow: 100% success (Batch 3 travelHelp, 12 locales)
  - Time cost: 3 hours (agent-only + rework) vs 44 minutes (structure-first)
  - Root cause: agents create condensed 2-section summaries instead of translating full 6-9 section structures
  - Python deep-copy + ID-match merge preserves locale text while forcing EN structure
  - Validation contract defined: Phase 1 (structural) and Phase 2 (translation) gates
  - Persistence verification required: `git diff --stat` + existence checks + re-run of validation
  - Blast radius: 3 skills (improve-translate-guide primary, improve-en-guide + improve-guide reference it)

## Existing System Notes

- Key modules/files:
  - `.claude/skills/improve-translate-guide/SKILL.md` (276 lines) — primary target; current workflow at L95-211, validation at L167-189, quality gates at L239-251
  - `.claude/skills/improve-guide/SKILL.md` — orchestrator that invokes improve-translate-guide; no changes needed
  - `.claude/skills/improve-en-guide/SKILL.md` — references improve-translate-guide as next step; no changes needed
  - `apps/brikette/src/test/content-readiness/i18n/i18n-parity-quality-audit.test.ts` — existing validation test (strict mode via `CONTENT_READINESS_MODE=fail`)
  - `apps/brikette/scripts/fix-batch-1-2-structures.py` (103 lines) — proven structural repair pattern with ID-based section matching
  - `apps/brikette/scripts/validate-guide-content.ts` (230 lines) — Zod schema validation for guide JSON
  - `apps/brikette/scripts/validate-json.ts` (58 lines) — basic JSON parse validation
- Patterns to follow:
  - Structural repair: deep-copy EN, match sections by ID, preserve locale text (fix-batch-1-2-structures.py)
  - Validation: per-locale loop with section count + JSON parse checks (existing in SKILL.md L172-178)
  - Skill markdown structure: Core Commitments → Operating Mode → Allowed/Not Allowed → Workflow → Quality Gates → Error Handling

## Proposed Approach

Single approach (no alternatives needed — the structure-first pattern is empirically validated):

1. **Rewrite the skill workflow** to enforce a three-phase pattern: Phase 1 (structural repair via Python) → Gate 1 → Phase 2 (translation-only agents) → Gate 2 → Phase 3 (completion with persistence proof)
2. **Replace the weak post-translation validation** (L167-189, line count ±5) with precise Phase 1 + Phase 2 gates from the fact-find's validation contracts
3. **Add persistence verification** to the completion report requirements
4. **Extract validation into a reusable script** so both the skill and manual runs use the same checks
5. **Add merge policy documentation** to the skill so structural repair scripts have a defined contract
6. **Update MEMORY.md** with the proven pattern for cross-session continuity

Tasks are ordered to build incrementally: validation script first (foundational tooling), then skill workflow rewrite (references the script), then completion reporting (depends on workflow), then MEMORY.md (standalone).

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create reusable validation script | 92% | S | Pending | - |
| TASK-02 | IMPLEMENT | Rewrite skill workflow with structure-first pattern and Phase 1 gate | 90% | M | Pending | TASK-01 |
| TASK-03 | IMPLEMENT | Add Phase 2 translation gate and completion reporting | 90% | S | Pending | TASK-02 |
| TASK-04 | IMPLEMENT | Update MEMORY.md with translation workflow | 95% | S | Pending | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)
> Overall-confidence: (92×1 + 90×2 + 90×1 + 95×1) / (1+2+1+1) = 457/5 = 91%

## Tasks

### TASK-01: Create reusable validation script

- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/scripts/validate-guide-structure.sh` (new file)
- **Depends on:** -
- **Confidence:** 92%
  - Implementation: 95% — clear precedent in existing validation loop (SKILL.md L172-178) and validate-json.ts; shell script is straightforward
  - Approach: 90% — shell script is the right choice: no build step, runs anywhere Python/Node available, exit code for CI
  - Impact: 90% — new file, zero blast radius on existing code; used only by skill workflow
- **Effort:** S (1 new file, 0 integration boundaries, no new patterns)
- **Acceptance:**
  - Script accepts guideKey as positional argument
  - Checks all 17 locales for the given guide
  - Phase 1 structural checks: JSON parseable, sections.length matches EN, section IDs match EN (same order), required top-level keys present (seo, linkLabel, intro, sections), faqs/tips length matches EN (if present)
  - Phase 2 translation checks (when called with `--phase2` flag): body array length parity per section, token preservation (%LINK:, %HOWTO:, %URL:, %IMAGE:), no empty strings in translated fields
  - Outputs per-locale pass/fail with details
  - Exits 0 (all pass) or 1 (any fail)
  - Works from `apps/brikette/` directory
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Run against a guide with correct structure in all locales → exit 0, all locales pass
    - TC-02: Run against a guide with wrong section count in one locale → exit 1, that locale reported as failed
    - TC-03: Run against a guide with missing section ID → exit 1, specific ID mismatch reported
    - TC-04: Run with `--phase2` against locale with condensed body arrays → exit 1, body length mismatch reported
    - TC-05: Run with non-existent guideKey → exit 1, error message about missing EN file
  - **Acceptance coverage:** TC-01 covers happy path; TC-02/03 cover structural gate; TC-04 covers translation gate; TC-05 covers error handling
  - **Test type:** manual validation (shell script, run against real locale files)
  - **Test location:** manual — run script against existing guide files in repo
  - **Run:** `cd apps/brikette && bash scripts/validate-guide-structure.sh travelHelp`
- **Planning validation:**
  - Examined existing validation patterns: SKILL.md L172-178 (section count loop), validate-json.ts (JSON parse + exit code), validate-guide-content.ts (per-locale iteration with error accumulation)
  - Confirmed all required data is available: EN files exist, locale files exist, `node -e` one-liners can extract section counts/IDs
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Add new file, no other changes
  - Rollback: Delete file
- **Documentation impact:** None (script is self-documenting via `--help`)
- **Notes / references:**
  - Pattern: `apps/brikette/scripts/validate-json.ts` (exit code pattern)
  - Fact-find validation contract: Phase 1 and Phase 2 gates

---

### TASK-02: Rewrite skill workflow with structure-first pattern and Phase 1 gate

- **Type:** IMPLEMENT
- **Affects:**
  - `.claude/skills/improve-translate-guide/SKILL.md` (primary — rewrite workflow sections)
  - `[readonly] apps/brikette/scripts/fix-batch-1-2-structures.py` (pattern reference for structural repair template)
  - `[readonly] apps/brikette/scripts/validate-guide-structure.sh` (referenced in gate commands)
- **Depends on:** TASK-01
- **Confidence:** 90%
  - Implementation: 92% — modifying existing markdown with well-defined content from fact-find runbook; all workflow steps are documented
  - Approach: 90% — structure-first pattern validated in production (Batch 3: 100% success); workflow v2 runbook in fact-find is deterministic
  - Impact: 88% — affects all future translation work using this skill; improve-guide orchestrator doesn't need changes (it just invokes improve-translate-guide)
- **Effort:** M (1 file modified but significant rewrite of workflow section ~100 lines; crosses 1 integration boundary: references validation script from TASK-01)
- **Acceptance:**
  - Workflow section rewritten to three-phase pattern: Phase 0 (preparation) → Phase 1 (structural repair + Gate 1) → Phase 2 (translation-only agents + Gate 2) → Phase 3 (completion)
  - Phase 0 includes: confirm EN audit-clean, list expected locale file paths, confirm Python runtime
  - Phase 1 includes: Python structural repair template with merge policy documentation, Gate 1 validation command using `validate-guide-structure.sh`, explicit "do NOT proceed if Gate 1 fails" instruction
  - Merge policy documented: preserve locale text for (seo.title, seo.description, linkLabel, intro[], section title/body/images, FAQ answers, tips[]), force EN structure for (section ordering, IDs, required keys, array shapes), ID match strategy, fallback for missing sections, safety for locale-only keys
  - Phase 2 agent instructions explicitly state: "translation-only — do NOT make structural edits"
  - Existing "Core Commitments" section preserved (EN must be clean, every write validated, localization must not assume sync, translation policy)
  - Existing "Localization Rules" section preserved
  - Existing "Error Handling" section preserved
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-06: Read updated SKILL.md and verify Phase 0/1/2/3 sections exist with correct headings
    - TC-07: Verify Gate 1 command references `validate-guide-structure.sh` with correct invocation
    - TC-08: Verify merge policy section documents all required fields (preserve list, force list, ID strategy, fallback, safety)
    - TC-09: Verify Phase 2 agent instructions include "translation-only" constraint
    - TC-10: Verify existing Core Commitments, Localization Rules, and Error Handling sections are preserved
    - TC-11: Verify "do NOT proceed if Gate 1 fails" instruction is present
  - **Acceptance coverage:** TC-06 covers structure; TC-07/11 cover Gate 1; TC-08 covers merge policy; TC-09 covers agent constraints; TC-10 covers preservation
  - **Test type:** manual review (skill markdown)
  - **Test location:** `.claude/skills/improve-translate-guide/SKILL.md`
  - **Run:** Manual read-through + verify structure
- **Planning validation:**
  - Read current SKILL.md (276 lines): workflow at L95-211, post-validation at L167-189, quality gates at L239-251
  - Current weak point: L181 "Line count within ±5 of EN source" — this is the gate that fails to catch condensed summaries
  - Current workflow step 2 (L114-134) spawns agents immediately without structural repair — this is where Phase 1 inserts
  - Current workflow step 4 (L167-189) validation is too late and too weak — replaced by Gate 1 + Gate 2
  - Confirmed improve-guide orchestrator (L95-97) just calls "run improve-translate-guide" — no coupling to internal workflow steps
  - Unexpected findings: None
- **What would make this ≥95%:**
  - Run the updated skill end-to-end on a real guide batch and confirm 100% success
- **Rollout / rollback:**
  - Rollout: Update skill markdown in place
  - Rollback: `git restore .claude/skills/improve-translate-guide/SKILL.md`
- **Documentation impact:** None (the skill IS the documentation)
- **Notes / references:**
  - Fact-find Workflow v2 Runbook (deterministic checklist)
  - Fact-find merge policy section
  - Pattern: `apps/brikette/scripts/fix-batch-1-2-structures.py` (structural repair template)

---

### TASK-03: Add Phase 2 translation gate and completion reporting

- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/improve-translate-guide/SKILL.md` (add Phase 2 gate + rewrite completion report section)
- **Depends on:** TASK-02
- **Confidence:** 90%
  - Implementation: 92% — completion report template is defined in fact-find; Gate 2 references same validation script
  - Approach: 90% — persistence verification directly addresses the "reported complete but didn't persist" failure class
  - Impact: 88% — same blast radius as TASK-02 (skill markdown only)
- **Effort:** S (1 file, same file as TASK-02 but different sections; additive content)
- **Acceptance:**
  - Gate 2 section added after Phase 2 (translation): runs `validate-guide-structure.sh --phase2`, runs `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit`
  - "If Gate 2 fails" handling: identify failing locales, diagnose (wrong structure = re-run Phase 1; bad translation = re-translate), re-validate
  - Completion report template requires:
    - Validation command output (section counts per locale, pass/fail per gate)
    - `git diff --stat` showing changed locale files
    - Existence checks for all expected file paths
    - List of any failed locales with remediation steps (or "none")
  - "complete" status blocked until all gates pass AND persistence confirmed
  - Quality Gates section (L239-251) updated to reference Phase 1 + Phase 2 gates
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-12: Verify Gate 2 section exists with correct validation commands
    - TC-13: Verify "If Gate 2 fails" handling documents both failure modes (structural vs translation)
    - TC-14: Verify completion report template includes all 4 required evidence items
    - TC-15: Verify Quality Gates section references Phase 1 + Phase 2 gates (not old "line count ±5" criterion)
  - **Acceptance coverage:** TC-12 covers Gate 2; TC-13 covers failure handling; TC-14 covers completion report; TC-15 covers quality gates update
  - **Test type:** manual review (skill markdown)
  - **Test location:** `.claude/skills/improve-translate-guide/SKILL.md`
  - **Run:** Manual read-through
- **Planning validation:**
  - Current completion report section (L190-211) requires only: EN audit result, validation command output, locales updated count, per-guide confirmation checklist
  - Missing from current: `git diff --stat`, existence checks, explicit failure list
  - Current Quality Gates (L239-251) reference "Structure parity vs EN" but not Phase 1/Phase 2 gates
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Update skill markdown (same file as TASK-02, different sections)
  - Rollback: `git restore .claude/skills/improve-translate-guide/SKILL.md`
- **Documentation impact:** None
- **Notes / references:**
  - Fact-find: Persistence verification section, Acceptance Criteria section

---

### TASK-04: Update MEMORY.md with translation workflow

- **Type:** IMPLEMENT
- **Affects:** `/Users/petercowling/.claude/projects/-Users-petercowling-base-shop/memory/MEMORY.md`
- **Depends on:** -
- **Confidence:** 95%
  - Implementation: 98% — adding a new section to an existing markdown file; content is well-defined from fact-find
  - Approach: 95% — MEMORY.md is the right place for cross-session workflow patterns; 31 lines currently, well under 200-line limit
  - Impact: 90% — affects only personal agent sessions; no production code impact
- **Effort:** S (1 file, additive content, 0 integration boundaries)
- **Acceptance:**
  - New "## Translation Workflow (Brikette Guides)" section added
  - Documents: structure-first pattern (Phase 1 → Gate 1 → Phase 2 → Gate 2 → completion)
  - Includes: validation command reference, merge policy summary, success evidence
  - References skill: `.claude/skills/improve-translate-guide/SKILL.md`
  - Total MEMORY.md stays under 200 lines (currently 31 lines + ~15 lines for new section = ~46 lines)
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-16: Verify new section header "## Translation Workflow (Brikette Guides)" exists
    - TC-17: Verify section references the structure-first pattern with Phase 1/Phase 2/Gate terminology
    - TC-18: Verify total line count stays under 200
  - **Acceptance coverage:** TC-16 covers existence; TC-17 covers content; TC-18 covers constraint
  - **Test type:** manual review
  - **Test location:** `/Users/petercowling/.claude/projects/-Users-petercowling-base-shop/memory/MEMORY.md`
  - **Run:** Read file, check content
- **Planning validation:**
  - Read current MEMORY.md: 31 lines, 3 sections (CI/Deploy Pipeline, Test Skipping, Package Notes), no Translation Workflow section
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Add section to MEMORY.md
  - Rollback: Remove section
- **Documentation impact:** None (MEMORY.md IS the documentation)
- **Notes / references:**
  - Fact-find: Evidence Summary, Workflow v2 Runbook

## Risks & Mitigations

- **Risk: Structural repair script template in skill is too generic for edge-case guides** (guides with optional TOC, images, varying FAQ structure)
  - Mitigation: Merge policy defines explicit handling for optional fields (keep EN structure, preserve locale text where ID matches, use EN wholesale as fallback). Edge cases are self-healing — if merge misses content, Phase 2 agents translate the EN fallback text.
- **Risk: Validation script has false positives for legitimately different locale structures**
  - Mitigation: Validation contract is strict on structure (exact section count/ID match) but doesn't constrain natural language length. The i18n-parity-quality-audit test has locale-specific thresholds for length ratios (CJK at 8%, others at 18%).
- **Risk: Agents ignore Phase 2 "translation-only" constraint and make structural edits anyway**
  - Mitigation: Gate 2 catches structural regressions (section count, ID match, body array lengths). If Gate 2 fails, the skill requires re-running Phase 1 before proceeding.

## Observability

- Logging: Validation script output (per-locale pass/fail with details) — captured in completion report
- Metrics: Batch success rate (all locales pass both gates = success) — tracked informally via completion reports
- Alerts/Dashboards: N/A (process improvement, not production service)

## Acceptance Criteria (overall)

- [ ] `validate-guide-structure.sh` exists and correctly validates Phase 1 + Phase 2 criteria
- [ ] SKILL.md workflow rewritten to Phase 0/1/2/3 with Gate 1 and Gate 2
- [ ] SKILL.md completion report requires persistence evidence (git diff, existence checks, re-run of validation)
- [ ] SKILL.md merge policy documented for structural repair scripts
- [ ] MEMORY.md updated with translation workflow pattern
- [ ] No regressions: existing Core Commitments, Localization Rules, Error Handling preserved in skill
- [ ] All changes are markdown + 1 shell script; no production code changes

## Decision Log

- 2026-02-07: Chose shell script (not TypeScript) for validation script — no build step, runs anywhere, simple exit code for skill consumption
- 2026-02-07: Kept CI blocking out of scope — workflow gates compensate by requiring agents to run strict-mode audit locally; CI blocking is follow-up work after workflow is proven
- 2026-02-07: Separated TASK-02 (workflow rewrite) and TASK-03 (completion reporting) — allows incremental review of the larger workflow change before adding reporting requirements
