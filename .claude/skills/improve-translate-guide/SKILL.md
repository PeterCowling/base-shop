---
name: improve-translate-guide
description: Propagate updated EN guide content to all locales using parallel translation. Requires EN audit to be clean first.
---

# Guide Translation/Propagation (Parallel, Drift-Aware, Locale-Safe)

## Scope

**This skill handles translation/propagation only.**

- First validates that EN content passes all SEO audits (FAIL if issues remain)
- Propagates updated EN content to all 17 non-EN locales using parallel translation
- Uses parallel subagents for concurrent translation (required)
- Validates translations after propagation

**Prerequisite:** Run `improve-en-guide` first to ensure EN content is audit-clean.

## Core Commitments (Non-Negotiable)

**EN must be clean before translating.**
The skill validates EN audit status before any translation work. If EN has unresolved issues, the skill FAILS immediately with guidance to run `improve-en-guide` first.

**Every write is validated immediately.**
After each locale file write, validate JSON parseability, token integrity, and structure parity before doing anything else.

If validation fails, the only allowed fix is replacement with known-good content.

**Localization must not assume sync.**
Non-EN locale content may have drifted. You must check and reconcile the entire locale content, not only the strings changed in EN.

**Translation Policy (Non-Negotiable):**
- **Always complete all translation work in-house.** Never ask about engaging professional translators or offloading translation work to external services.
- **Always use parallel subagents for localization.** Spawn multiple Task tool subagents to translate locales concurrently, maximizing speed.
- **Never defer or skip localization.** All 17 non-EN locales must be updated for every guide processed.

---

## Operating Mode

**VALIDATE EN + PARALLEL TRANSLATE (DRIFT-AWARE) + VALIDATE EACH LOCALE WRITE + REPORT**

---

## Allowed

- Run `apps/brikette/scripts/audit-guide-seo.ts` to validate EN is clean
- Read EN guide JSON to use as source for translation
- Read/modify non-EN locale guide JSON files:
  - `apps/brikette/src/locales/{locale}/guides/content/{guideKey}.json`
- **Spawn parallel Task tool subagents for concurrent locale translation** (required for all localization work)
- Translate content naturally while preserving tokens exactly

---

## Not Allowed

- **Modifying EN content** (use improve-en-guide for that)
- Third-party SEO tools/APIs
- Changing link targets in localization (only translate visible anchor text)
- Translating or altering any "preserve exactly" tokens
- Deferring validation/fixing "until later"
- Any remediation for corrupted JSON other than replacement with known-good content
- **Asking about professional translators or external translation services** (forbidden)
- **Suggesting to defer/skip localization or offload translation work** (forbidden)
- **Sequential locale processing when parallel is possible** (forbidden - always use Task tool for parallel translation)

---

## Inputs

### Required

**Guide reference (one of):**
- Full URL, e.g. `http://localhost:3012/en/experiences/gavitella-beach-guide`
- Slug, e.g. `gavitella-beach-guide`
- guideKey, e.g. `gavitellaBeachGuide`
- List of URLs/slugs/guideKeys for batch processing

### Optional Flags

- `--skip-validation` - Bypass EN audit check (NOT RECOMMENDED - may propagate broken content)

---

## Target Locales

All 17 non-EN locales must be updated:

`ar, da, de, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh`

---

## Workflow

### 1) Validate EN is audit-clean (mandatory unless --skip-validation)

Run:
```bash
pnpm --filter brikette tsx scripts/audit-guide-seo.ts {guideKey}
```

Read audit output. Check:
- score >= 9.0
- zero critical issues
- zero improvements

**If EN audit fails:**
- Report the specific issues found
- STOP with message: "EN content has unresolved audit issues. Run improve-en-guide first to fix EN content, then re-run improve-translate-guide."
- Do NOT proceed with translation

### 2) Spawn parallel translation subagents (required)

Use the Task tool to spawn multiple parallel subagents for concurrent locale translation. **Never translate sequentially.**

**Recommended parallelization strategy:**
- Spawn 4-6 subagents in a single Task tool call (one message with multiple tool uses)
- Each subagent handles 3-4 locales
- Example grouping:
  - Agent 1: ar, da, de, es
  - Agent 2: fr, hi, hu, it
  - Agent 3: ja, ko, no, pl
  - Agent 4: pt, ru, sv, vi, zh

### 3) Per-locale translation workflow (each subagent executes)

For each assigned locale:

**A. Parse existing locale file (baseline validate)**
- If parse fails: restore known-good content immediately; if not possible promptly, stop and ask user.

**B. Drift check (required)**
Compare locale's structure and coverage vs EN:
- missing/extra sections
- ordering differences
- FAQ mismatches
- stale content elsewhere

**C. Update locale comprehensively to match EN meaning and structure**
- Preserve tokens exactly
- Keep link targets unchanged (translate anchor only)
- Match section order and counts
- Match intro paragraph count
- Match FAQ count and ordering
- Match gallery structure

**D. Write locale file and validate immediately**
- JSON parse check
- Token preservation check
- Structure parity vs EN

**E. If validation fails**
- Restore snapshot immediately
- Redo localization safely
- If still not possible promptly, stop and ask user what they want to do

### 4) Completion report

After all parallel subagents complete, report:

**Validation status:**
- EN audit result (pass/fail with details)

**Translation progress:**
- Locales updated (count + list)
- Any locale-specific issues encountered
- Parallel translation efficiency (number of subagents spawned)

**Per guide:**
- Confirmation that:
  - EN was validated before translation
  - every write was validated immediately
  - any corruption was handled only by replacement with known-good content
  - all 17 non-EN locales were successfully updated via parallel subagents
  - no translation work was deferred or suggested for external handling

---

## Localization Rules (enforced by validation)

**Preserve Exactly (Never Translate):**
- `%LINK:target|anchor%` - translate anchor only; preserve target exactly
- `%IMAGE:path%` unchanged
- `%COMPONENT:name%` unchanged
- URLs, paths, IDs, technical tokens

**Translate Naturally:**
- Titles, body, FAQs
- Section headings
- Meta titles/descriptions
- Image alt text (if present)

**Match Structure:**
- Same section order + counts
- Same number of intro paragraphs
- Same FAQ count and ordering
- Same gallery structure

**Locale-appropriate phrasing:**
- Maintain existing formality level unless clearly inconsistent or incorrect

---

## Quality Gates (must pass before "complete")

**Per locale:**
1. Locale JSON valid
2. Tokens preserved correctly
3. Structure parity vs EN
4. Drift addressed (not just "changed EN strings")

**Overall:**
5. All 17 locales successfully updated
6. No unresolved corruption remains anywhere in the touched files
7. Any skipped locale is explicitly documented and user-approved

---

## Error Handling (Replacement-Only)

**JSON corruption detected**
- Restore file from known-good snapshot (or git restore) immediately.
- Re-apply intended change safely via structured JSON editing.
- If cannot restore promptly, stop and ask user what they want to do.

**EN audit validation fails**
- Report specific issues
- STOP immediately
- Direct user to run `improve-en-guide` first

---

## Practical Implementation Note

Edits should be applied by:
1. loading JSON,
2. modifying only string fields,
3. serializing with `JSON.stringify(obj, null, 2)` + newline.

Avoid manual text patching in non-EN locales. This reduces risk of invalid quotes, delimiter issues, and encoding damage.
