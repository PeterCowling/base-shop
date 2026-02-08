---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Created: 2026-02-06
Last-updated: 2026-02-07
Feature-Slug: translation-workflow-improvements
Related-Plan: docs/plans/translation-workflow-improvements-plan.md
---

# Translation Workflow Improvements Fact-Find Brief

## Scope

### Summary

Improve the `improve-translate-guide` skill workflow to prevent false-positive completion reports and reduce rework cycles by implementing a "structure-first, translate-second" pattern with mandatory validation gates.

### Goals

- Eliminate false-positive "complete" reports where agent work didn't persist or had wrong structure
- Reduce wasted agent time on structural work that Python can do in seconds
- Increase translation batch success rate to near 100% (observed: Batch 1-2 = 0%, Batch 3 = 100%)
- Add validation checkpoints that catch drift before it accumulates

**Success definition:** A translation batch "succeeds" when all target locales pass `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit` (structural parity + quality checks) AND all required tokens (%LINK:, %HOWTO:, %URL:, %IMAGE:) are preserved. The baseline measurement is per-batch: Batches 1-2 (agent-only) = 0% success; Batch 3 travelHelp (structure-first) = 100% success.

### Non-goals

- Changing the fundamental parallel translation strategy (still use 3-4 agents)
- Rewriting existing translation content (focus is on workflow process)
- Adding new locales or changing locale coverage

### Constraints & Assumptions

- Constraints:
  - Must maintain 17-locale coverage (ar, da, de, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh)
  - Must preserve existing translation quality and token integrity
  - Workflow changes should add <5 minutes overhead per guide batch
- Assumptions:
  - Python structural scripts are faster and more reliable than agents for structure restoration
  - Validation between phases catches issues earlier than end-of-batch validation

## Repo Audit (Current State)

### Entry Points

- `.claude/skills/improve-translate-guide/SKILL.md` — Primary skill defining translation workflow
- `apps/brikette/scripts/fix-batch-1-2-structures.py` — Example structural repair script created in session
- `apps/brikette/scripts/fix-travelhelp-translations.py` — Example structural repair script
- `apps/brikette/scripts/fix-laurito-translations.py` — Example structural repair script

### Key Modules / Files

- `.claude/skills/improve-translate-guide/SKILL.md` (L180-250) — Current workflow section
- `.claude/skills/improve-translate-guide/SKILL.md` (L318-340) — Post-translation validation (weak gate)
- `/Users/petercowling/.claude/projects/-Users-petercowling-base-shop/memory/MEMORY.md` — Personal agent memory for workflow patterns

### Patterns & Conventions Observed

- **Current pattern (observed: 0% batch success for Batches 1-2):**
  1. Spawn parallel agents
  2. Agents attempt structure restoration + translation simultaneously
  3. Agents report success
  4. End-of-batch validation reveals failures
  5. Manual rework required

- **Proven pattern (100% success in session):**
  1. Python script restores EN structure, preserves existing translations
  2. Validate all locales have correct section count
  3. Spawn parallel agents for translation-only work
  4. Final validation confirms completion

Evidence: Session work on 102 locale files (6 guides × 17 locales)

### Data & Contracts

**Guide JSON Structure:**
```typescript
{
  seo: { title: string, description: string },
  linkLabel: string,
  intro: string[],
  sections: Array<{
    id: string,
    title: string,
    body: string[],
    images?: Array<{ src: string, alt: string, caption: string }>
  }>,
  faqs?: Array<{ q: string, a: string[] }>,
  tips?: string[],
  // ... other optional fields
}
```

**Validation Contract (Phase 1 — structural gate):**
- File must parse as valid JSON
- `sections.length` must exactly match EN
- All section IDs must match EN (same IDs, same order)
- Required top-level keys present and correct types (seo, linkLabel, intro, sections)
- `faqs.length`, `tips.length` must match EN (if present in EN)

**Validation Contract (Phase 2 — translation gate):**
- Passes `CONTENT_READINESS_MODE=fail` i18n-parity-quality-audit (covers arrayLengthMismatch, missingKey, extraKey, typeMismatch, scriptMismatch)
- Per-section `body` array length must equal EN body array length (prevents condensed summaries)
- All %LINK:, %HOWTO:, %URL:, %IMAGE: tokens preserved exactly (token integrity)
- No empty strings in translated fields (seo.title, seo.description, linkLabel, section titles, body elements)

**Note:** %COMPONENT: token listed previously but not confirmed in current guide content. Exclude from mandatory checks until a guide using it is identified.

### Dependency & Impact Map

**Upstream dependencies:**
- Task tool (spawns parallel translation agents)
- Python runtime (for structural repair scripts)
- Node runtime (for validation scripts)

**Downstream dependents:**
- Brikette guide system (depends on correct locale file structure)
- i18n-parity-quality-audit.test.ts (validates structural integrity)

**Likely blast radius:**
- Skill changes affect all future translation work using improve-translate-guide
- MEMORY.md changes affect only personal agent sessions
- No impact on existing translated content (process improvements only)

### Test Landscape

#### Test Infrastructure

- **Frameworks:** Jest
- **Commands:** `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit`
- **CI integration:** i18n audit runs in CI but doesn't block (warning only, `STRICT_MODE=false` by default). Locally, `CONTENT_READINESS_MODE=fail` or `I18N_PARITY_MODE=fail` enables strict mode where issues cause test failure.
- **CI blocking decision:** Out of scope for this fact-find. The workflow gates compensate by requiring agents to run the strict-mode test locally and paste output in the completion report. CI blocking can be considered as follow-up work once the workflow is proven.
- **Coverage tools:** None specific to translations; structural validation via custom test

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| i18n structural parity | integration | `src/test/content-readiness/i18n/i18n-parity-quality-audit.test.ts` | Checks section counts, array lengths, missing keys, script mismatches |
| Translation helpers | unit | `src/test/content-readiness/i18n/helpers/collectIssues.ts` | Issue collection for audit |

#### Test Patterns & Conventions

- **Structural validation:** Node scripts that parse JSON, count sections, verify structure
- **Issue types tracked:** emptyString, tooShort, scriptMismatch, missingKey, extraKey, typeMismatch, arrayLengthMismatch
- **Validation runs:** After each batch completion (should run between phases too)

#### Coverage Gaps (Planning Inputs)

- **No validation between structural repair and translation phases** — current workflow validates only at end
- **No automated detection of "condensed format" creation** — agents create 2-section summaries instead of 6-section translations. Detection strategy: enforce per-section `body` array length equality with EN (the condensed failure mode collapses paragraphs, reducing body array counts). Combined with exact section count matching, this catches both "too few sections" and "right sections but collapsed content."
- **No persistent validation history** — can't easily track which batches were validated vs. reported complete

#### Testability Assessment

- **Easy to test:** Structural validation (JSON parsing, section counting) - can be scripted in <10 LOC
- **Hard to test:** Agent translation quality and completion (requires manual review)
- **Test seams needed:** Validation checkpoint hooks between workflow phases

#### Recommended Test Approach

- **Unit tests for:** Python structural repair scripts (verify section preservation, translation preservation)
- **Integration tests for:** End-to-end validation (EN → structural fix → validation → translation → final validation)
- **Validation gates:** Run structural validation after Phase 1, before spawning Phase 2 agents

### Recent Git History (Targeted)

Session commits relevant to this fact-find:

- `78f153fc99` (2026-02-06) — "fix(brikette): complete travelHelp translations for 12 locales"
  - Successfully used Python structural fix + translation agents pattern
  - 12 of 17 locales targeted (5 locales already had correct translations from earlier work)
  - All 12 target locales validated with correct 6-section structure

- `70d86772ff` (2026-02-06) — "fix(brikette): restore correct structure for 6 Batch 1-2 guides"
  - Fixed 102 locale files using Python structural repair
  - Created `fix-batch-1-2-structures.py` script
  - Validated all files post-fix

- Earlier session work (not committed):
  - Batches 1-2 reported "complete" but validation showed 0% success rate
  - All guides had wrong section counts (e.g., fornilloBeachGuide: 7 sections instead of 9)

## Questions

### Resolved

- **Q: Why do agents fail at simultaneous structure + translation?**
  - A: Agents create "condensed" summaries (2 sections) instead of translating full structure (6-9 sections)
  - Evidence: Batch 1-2 results - all 17 locales × 6 guides had wrong section counts
  - Session data: `fornilloBeachGuide: 17/17 locales wrong`, `parking: 17/17 locales wrong`, etc.

- **Q: Why is Python structural repair more reliable?**
  - A: Deep-copy of EN structure guarantees correct sections; agents make editorial decisions
  - Evidence: `fix-batch-1-2-structures.py` fixed 94 files in <30 seconds with 100% success rate
  - Performance: Python script ~2 min vs. agent attempts 40+ min with failures

- **Q: What validation detects structural failures?**
  - A: Section count comparison (locale vs. EN) and line count delta
  - Evidence: i18n-parity-quality-audit.test.ts shows arrayLengthMismatch, missingKey, extraKey issues
  - Session validation command used throughout work

- **Q: When should validation run?**
  - A: After structural repair (before translation) AND after translation (before reporting complete)
  - Evidence: Session discovered Batch 1-2 failures only after 2+ hours because validation ran too late

### Open (User Input Needed)

None - sufficient evidence gathered from session to proceed with improvements.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 95%
  - Strong evidence from session: proven Python scripts + validation commands already exist
  - Changes are additive (strengthening gates, adding workflow steps)
  - Missing 5%: Edge cases in merge policy (locale-only keys, missing section IDs)

- **Approach:** 90%
  - Two-phase pattern validated in production use (Batch 3: 100% success)
  - Adds minimal overhead (~3 minutes per guide batch)
  - Alternative approaches considered and rejected based on evidence:
    - Agent-only: 100% failure rate observed (Batches 1-2, 0/102 files correct)
    - Serial translation: too slow for 17 locales
  - Missing 10%: Edge cases for guides with variable structure (TOC, images optional)

- **Impact:** 85%
  - Blast radius limited to improve-translate-guide skill workflow
  - No changes to existing translated content
  - Personal MEMORY.md changes affect only future agent sessions
  - Missing 15%: Need to verify no other skills depend on current weak validation

- **Testability:** 80%
  - Validation scripts already exist and work
  - Can test structural repair scripts with fixture data
  - Missing 20%: No automated test for "agent produces condensed format" failure mode

## Evidence Summary (Quantified Impact)

### Time Lost to Current Workflow Failures

- **Batch 1-2 work (agent-only approach):**
  - Agent time: ~80 minutes for 6 guides × 17 locales
  - Success rate: 0% (all needed rework)
  - Rework time: ~2 hours (diagnosis + Python fix + re-translation)
  - **Total cost: ~3 hours for work that should take 45 minutes**

- **Batch 3 work (structure-first approach):**
  - Structural repair: ~3 minutes (Python scripts)
  - Validation: ~1 minute (section count checks)
  - Translation: ~40 minutes (parallel agents)
  - Success rate: 100%
  - **Total cost: 44 minutes, zero rework**

### Files Affected (Session Evidence)

- **Incorrectly reported complete:** 102 locale files (6 guides × 17 locales from Batches 1-2)
- **Successfully fixed with new approach:** 12 locale files (travelHelp from Batch 3)
- **Scripts created as session evidence:** 3 Python structural repair scripts (`fix-batch-1-2-structures.py`, `fix-travelhelp-translations.py`, `fix-laurito-translations.py`). Note: 6 pre-existing TypeScript fix scripts also exist in `apps/brikette/scripts/` but were not created in this session.

### Issue Types Prevented by Validation

From i18n-parity-quality-audit results:
- arrayLengthMismatch: ~1,600 issues (section count mismatches)
- structureMismatch: ~900 issues (wrong data types, missing fields)
- Total preventable issues: ~2,500 / 4,204 total (60% of all i18n issues)

## Planning Constraints & Notes

### Must-follow patterns

- **Validation command format:**
  ```bash
  for locale in ar da de es fr hi hu it ja ko no pl pt ru sv vi zh; do
    file="src/locales/$locale/guides/content/{guideKey}.json"
    sections=$(node -e "const c=JSON.parse(require('fs').readFileSync('$file','utf8')); console.log(c.sections?.length || 0);")
    echo "$locale: $sections sections"
  done
  ```

- **Python structural repair pattern:**
  ```python
  en_data = json.load(open(en_path))
  locale_data = json.load(open(locale_path))
  fixed = json.loads(json.dumps(en_data))  # deep copy
  # Preserve translations by section ID
  if "sections" in locale_data:
      locale_sections_by_id = {s.get("id"): s for s in locale_data["sections"]}
      for i, section in enumerate(fixed["sections"]):
          if section["id"] in locale_sections_by_id:
              # copy title, body, images from locale
  json.dump(fixed, open(locale_path, "w"), ensure_ascii=False, indent=2)
  ```

- **Merge policy (structural repair):**
  - **Preserve locale text for:** seo.title, seo.description, linkLabel, intro[], each section's title, body[], images[].alt, images[].caption, FAQ answers, tips[]
  - **Force EN structure for:** section ordering, section IDs, required keys, array shapes (number of sections, number of FAQs)
  - **ID matching strategy:** Match sections by `id` field. If a locale section has an ID not in EN, discard it. If an EN section has no locale match, keep EN text (marks locale as needing translation in Phase 2).
  - **Fallback:** If locale has no `sections` array at all, use EN content wholesale — locale will be fully translated in Phase 2.
  - **Safety:** Never silently delete locale-only top-level keys. Log a warning if locale has keys not in EN (for manual review).

### Rollout/rollback expectations

- **Rollout:** Skill markdown changes + one new shell script (`validate-guide-structure.sh`)
- **Rollback:** Revert skill markdown; delete validation script. Script is workflow-only tooling — no production code or CI pipeline changes.
- **Risk:** Low — changes are process improvements and a standalone script. No functional code changes, no CI blocking changes.

### Observability expectations

- Validation output must be included in completion reports
- Must show: section counts per locale, pass/fail status, issue counts
- Session evidence shows this format works well

### Persistence verification (anti-false-positive)

Completion report must include evidence that edits actually persisted:
- `git diff --stat` output showing changed locale files (non-zero diff for each target locale)
- Existence checks for all expected locale file paths
- Re-run of validation command in same environment (not cached/stale output)
- List of any failed locales with remediation steps taken

This directly addresses the "reported complete but work didn't persist" failure class, which structural validation alone cannot catch.

## Acceptance Criteria (Planning-Ready)

### Phase 1 (structural repair) gate — all 17 locales must pass:
- [ ] Parseable JSON
- [ ] `sections.length` exactly matches EN
- [ ] All section IDs match EN (same IDs, same order)
- [ ] Required top-level keys present with correct types (seo, linkLabel, intro, sections)
- [ ] `faqs.length`, `tips.length` match EN (if present in EN)

### Phase 2 (translation) gate — all target locales must pass:
- [ ] `CONTENT_READINESS_MODE=fail` i18n-parity-quality-audit passes
- [ ] Per-section `body` array length equals EN body array length (anti-condensation)
- [ ] All %LINK:, %HOWTO:, %URL:, %IMAGE: tokens preserved exactly
- [ ] No empty strings in translated fields (seo.title, seo.description, linkLabel, section titles, body elements)

### Completion report must include:
- [ ] Validation command output (section counts per locale, pass/fail per gate)
- [ ] `git diff --stat` showing changed locale files
- [ ] Existence checks confirming all expected file paths
- [ ] List of any failed locales with remediation steps taken (or "none")

## Workflow v2 Runbook (Deterministic Checklist)

### Phase 0: Preparation
1. Identify target guideKey(s) and confirm EN content is audit-clean
2. List all expected locale file paths: `src/locales/{locale}/guides/content/{guideKey}.json` for 17 locales
3. Confirm Python runtime available

### Phase 1: Structural Repair
1. Run structural repair script (Python) for each target guideKey
2. Script deep-copies EN structure, preserves locale translations by section ID (see merge policy above)
3. **Gate 1:** Run validation — all 17 locales must pass Phase 1 structural gate
4. **If Gate 1 fails:** Fix failing locales (re-run script with corrections) before proceeding. Do NOT proceed to Phase 2.

### Phase 2: Translation
1. Spawn parallel agents (3-4) with translation-only instructions
2. Agents MUST NOT make structural edits — only translate text within the existing structure
3. **Gate 2:** Run `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit` + token check + body array length parity
4. **If Gate 2 fails:** Identify failing locales, diagnose (wrong structure = re-run Phase 1; bad translation = re-translate locale), re-validate

### Phase 3: Completion
1. Run `git diff --stat` to confirm all target locale files changed
2. Run existence checks for all expected paths
3. Compile completion report using template (validation output + persistence evidence + failure list)
4. Only report "complete" when all gates pass AND persistence is confirmed

## Suggested Task Seeds (Non-binding)

### TASK-01: Add mandatory structural validation gate to improve-translate-guide
- Update `.claude/skills/improve-translate-guide/SKILL.md` workflow section
- Add Phase 1 structural gate: exact section count + ID match, required keys/types, JSON parseable
- Add Phase 2 translation gate: body array length parity, token preservation, no empty strings, passes strict-mode audit
- Add "If validation fails" handling (do not proceed to translation; if Phase 2 fails, identify failed locales and remediate)

### TASK-02: Strengthen completion reporting requirements
- Update post-translation validation section (L318-340)
- Require validation output AND persistence evidence in completion report
- Persistence evidence: `git diff --stat` showing changed files, existence checks for expected paths, re-run of strict-mode audit
- Add failure handling: identify failed locales, re-run structural fix, re-validate
- Make "all target locales validated + persistence confirmed" mandatory before "complete" status

### TASK-03: Document structure-first workflow pattern in skill
- Add new section "Proven Workflow Pattern: Structure First, Translate Second"
- Include Python script template for structural repair
- Include validation checkpoint commands
- Document evidence and success rates

### TASK-04: Update MEMORY.md with translation workflow
- Add "Translation Workflow (Brikette Guides)" section
- Document structure-first pattern with script template
- Include validation checkpoints and evidence
- Reference from improve-translate-guide skill

### TASK-05: Create reusable validation script
- Extract validation logic into `apps/brikette/scripts/validate-guide-structure.sh`
- Accept guideKey as parameter
- Return exit code 0 (pass) or 1 (fail) for CI use
- Output: section counts per locale, pass/fail summary

## Planning Readiness

- **Status:** Ready-for-planning
- **Blocking items:** None
- **Recommended next step:** Proceed to `/plan-feature translation-workflow-improvements`

### Evidence Quality

This fact-find is based on:
- ✅ Quantified time costs (3 hours wasted, 2+ hour reduction with new approach)
- ✅ Concrete session artifacts (3 Python scripts created, 102 files fixed, git commits)
- ✅ Measurable success rates (0% vs. 100% between approaches)
- ✅ Reproducible validation commands
- ✅ Clear blast radius (skill changes only, no functional changes)

All proposed improvements have evidence from actual session work, not theoretical benefits.
