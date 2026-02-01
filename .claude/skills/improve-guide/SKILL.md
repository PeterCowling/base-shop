---
name: improve-guide
description: End-to-end guide improvement - runs improve-en-guide for EN fixes, then improve-translate-guide for localization
---

# Guide SEO Audit + Fix + Localization (Orchestrator)

## Description

Wrapper skill that runs `improve-en-guide` followed by `improve-translate-guide` for end-to-end guide improvement.

This orchestrator handles the complete workflow:
1. **Phase 1 (EN):** Fix all SEO audit issues in English content
2. **Phase 2 (Translation):** Propagate fixed EN content to all 17 locales

## When to Use

Use this skill for **end-to-end guide improvement** when you need both:
- EN content fixes (SEO audit issues)
- Translation/propagation to all locales

## When NOT to Use

**Use `improve-en-guide` alone if:**
- You only need to fix EN content
- You want to review EN changes before translating
- You're iterating on EN content quality

**Use `improve-translate-guide` alone if:**
- EN content is already audit-clean
- You've already run improve-en-guide and just need translation
- You want to re-translate without re-auditing EN

---

## Operating Mode

**ORCHESTRATE: improve-en-guide + improve-translate-guide**

---

## Inputs

### Required

**Guide reference (one of):**
- Full URL (preferred), e.g. `http://localhost:3012/en/experiences/gavitella-beach-guide`
- Slug, e.g. `gavitella-beach-guide`
- guideKey, e.g. `gavitellaBeachGuide`
- List of URLs/slugs/guideKeys for batch processing

### Optional Flags

All flags are passed through to the appropriate sub-skill:

- `--skip-json-fix` - Skip baseline JSON validation/fixing (passed to improve-en-guide)
- `--skip-validation` - Skip EN audit validation in translation phase (NOT RECOMMENDED, passed to improve-translate-guide)

### Optional (but recommended)

- Readership/audience (passed to improve-en-guide)
- Tone constraints + must-include details

---

## Workflow

### Phase 1: EN Fixes (improve-en-guide)

Execute the `improve-en-guide` skill with:
- The guide reference(s) provided
- Any `--skip-json-fix` flag if specified
- Readership/tone inputs

**This phase:**
- Runs baseline JSON validation
- Runs SEO audit for EN
- Iteratively fixes all EN audit issues
- Validates EN content is audit-clean

**Gate:** Phase 1 must complete successfully before Phase 2 begins.

If Phase 1 fails:
- Report the failure details
- STOP - do not proceed to translation
- Provide guidance on how to resolve

### Phase 2: Translation (improve-translate-guide)

Execute the `improve-translate-guide` skill with:
- The same guide reference(s)
- Any `--skip-validation` flag if specified (not recommended)

**This phase:**
- Validates EN is audit-clean (should always pass after Phase 1)
- Spawns parallel subagents for translation
- Propagates EN content to all 17 locales
- Validates all locale files

---

## Completion Report

Report results from both phases:

### Phase 1 Summary (EN Fixes)
- Initial score, final score
- Audit iterations performed
- Key issue categories fixed
- Reader-first improvements made

### Phase 2 Summary (Translation)
- Locales updated (should be all 17)
- Any locale-specific issues encountered
- Parallel translation efficiency

### Overall
- Total guides processed
- Any guides/locales skipped (with reasons)
- Confirmation that:
  - Every write was validated immediately
  - Any corruption was handled only by replacement with known-good content
  - All 17 non-EN locales were successfully updated via parallel subagents
  - No translation work was deferred or suggested for external handling

---

## Core Commitments (Inherited from Sub-Skills)

**Every write is validated immediately.**
After each file write, validate JSON parseability and token integrity before doing anything else.

**Readership-first ordering is required.**
Reorder EN content so the reader can decide/act quickly, with explicit early-content gates.

**Localization must not assume sync.**
Non-EN locale content may have drifted. Check and reconcile entire locale content.

**Translation Policy (Non-Negotiable):**
- Always complete all translation work in-house
- Always use parallel subagents for localization
- Never defer or skip localization

---

## Error Handling

**Phase 1 failure:**
- Report specific EN audit issues
- STOP before translation
- User can fix manually and re-run, or use improve-en-guide directly

**Phase 2 failure:**
- Report which locales failed
- Translation for successful locales is preserved
- User can re-run improve-translate-guide for failed locales

---

## Quality Gates (Combined)

**EN (from Phase 1):**
1. Final audit score >= 9.0
2. Zero critical issues
3. Zero improvements remaining
4. EN JSON valid + tokens preserved

**Translation (from Phase 2):**
5. All 17 locale JSONs valid
6. Tokens preserved correctly in all locales
7. Structure parity vs EN in all locales
8. Drift addressed comprehensively

---

## Sub-Skill References

For detailed documentation on each phase:

- **Phase 1:** See `.claude/skills/improve-en-guide/SKILL.md`
- **Phase 2:** See `.claude/skills/improve-translate-guide/SKILL.md`
