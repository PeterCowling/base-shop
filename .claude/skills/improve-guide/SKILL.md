---
name: improve-guide
description: Run audit-guide-seo.ts for a guide URL, iteratively fix all audit issues in EN, then propagate updated copy to all locales
---

# Guide SEO Audit + Fix + Localization

Given a guide reference (usually a local URL), this skill:

1. Resolves the URL → guide **slug** → internal **guideKey**
2. Runs `apps/brikette/scripts/audit-guide-seo.ts` (EN locale only) to generate SEO audit results
3. Fixes **every** issue/improvement reported by the audit by updating the guide content (and any required manifest overrides)
4. Re-runs the audit and repeats until **no issues/improvements remain**
5. Propagates the final updated English copy to **all other locales** (string updates only; preserve non-translatable tokens exactly)
6. Reports completion to the user

The audit output is saved to `apps/brikette/src/data/guides/guide-manifest-overrides.json` under the guide key.

---

## Operating Mode

**READ + RUN (SCRIPT) + EDIT (EN CONTENT) + RE-RUN (UNTIL CLEAN) + LOCALIZE + WRITE**

---

## Allowed

- Read and parse the provided guide reference (URL/slug)
- Read guide manifest data to map **slug → guideKey**
- Run the repository audit script: `apps/brikette/scripts/audit-guide-seo.ts`
- Read and modify the **EN** guide content JSON:
  - `apps/brikette/src/locales/en/guides/content/{guideKey}.json`
- Add/replace **authoritative** supporting content (facts + images) to address audit findings
  - Research via web browsing is allowed for factual verification and sourcing of usable images
  - Write original prose (do **not** copy-paste copyrighted text)
- Update audit results in:
  - `apps/brikette/src/data/guides/guide-manifest-overrides.json`
- Update non-EN locale guide content JSON files so they match the updated EN meaning (see Localization Rules)

---

## Not Allowed

- Running third-party SEO tools/APIs (Semrush, Ahrefs, Screaming Frog, etc.)
- Making changes outside the target guide except where strictly required to satisfy the audit (e.g., related internal link targets should already exist)
- Changing link targets when localizing (only translate visible anchor text)
- Translating or altering any "preserve exactly" tokens (see Localization Rules)
- Stopping after the first audit: you must iterate until the audit is clean (no critical issues, no improvements)

---

## Inputs

### Required
- **Guide reference** (preferred: full URL), e.g.
  - `http://localhost:3012/en/experiences/gavitella-beach-guide`

### Optional
- **Readership / audience** (if not provided, you must ask)
  - Examples: "hostel guests", "day-trippers without a car", "families with kids", "budget travelers", etc.

> **Note:** All auditing + fixing is performed in **EN** (`apps/brikette/src/locales/en/...`) regardless of the locale in the URL.

---

## Pre-step: Ask About Readership (Required)

Before applying fixes (i.e., after the first audit results are known), ask:

- Who is the intended readership?
- Any constraints on tone (practical, friendly, premium, minimal, etc.)?
- Any must-include details (accessibility, costs, transport, safety, crowds, seasonality)?

If the user does not respond, assume: **general travelers + practical "how to go / what to expect" orientation**.

---

## Script of Record

The audit logic is **exactly** what is implemented in:

- `apps/brikette/scripts/audit-guide-seo.ts`

This skill must use that script as the source of truth for scoring, issues, and improvements.

---

## Audit Output Schema

Written to `apps/brikette/src/data/guides/guide-manifest-overrides.json`:

```json
{
  "{guideKey}": {
    "auditResults": {
      "timestamp": "2026-01-30T10:00:00.000Z",
      "score": 9.7,
      "analysis": {
        "strengths": ["..."],
        "criticalIssues": ["..."],
        "improvements": ["..."]
      },
      "metrics": {
        "metaTitleLength": 52,
        "metaDescriptionLength": 154,
        "contentWordCount": 2310,
        "headingCount": 7,
        "internalLinkCount": 6,
        "faqCount": 9,
        "imageCount": 6
      },
      "version": "1.0.0"
    }
  }
}
```

---

## Workflow

### 1. Resolve Guide Reference → guideKey

Parse the provided URL or slug:
- Extract the slug from the URL path (e.g., `gavitella-beach-guide`)
- Read guide manifest to find the matching `guideKey`
- Validate the guide exists in EN locale

### 2. Run Initial Audit

Execute the audit script:
```bash
pnpm --filter brikette tsx scripts/audit-guide-seo.ts {guideKey}
```

Read the audit results from `guide-manifest-overrides.json`.

### 3. Fix All Issues (Iterative)

For each issue or improvement in the audit results:

**Critical Issues** (score < 7.0):
- Missing meta tags → Add to `seo` object
- Content too short → Add authoritative content sections
- Missing FAQs → Add relevant Q&A
- No internal links → Add contextual links to related guides

**Improvements** (score 7.0-8.9):
- Meta description length → Adjust to 140-160 chars
- Image count → Add relevant images (research if needed)
- Heading structure → Add/reorganize sections
- Content depth → Expand with practical details

**Content Research Guidelines:**
- Use web search to verify facts (opening hours, costs, distances, transport)
- Find authoritative image sources (official tourism, Creative Commons)
- Write original prose - never copy protected text
- Cite specific facts: "€3.50 entry", "15-minute walk", "open 9am-6pm"

After each fix:
1. Save the updated EN content
2. Re-run the audit script
3. Read the new results
4. Continue until `score >= 9.0` and both `criticalIssues` and `improvements` arrays are empty

### 4. Propagate to All Locales

Once the EN content is clean, update all other locale files:

**Localization Rules:**

1. **Preserve Exactly (Never Translate):**
   - `%LINK:target|anchor%` → Only translate `anchor`, keep `target` identical
   - `%IMAGE:path%` → Keep unchanged
   - `%COMPONENT:name%` → Keep unchanged
   - URLs, paths, IDs, technical tokens

2. **Translate Naturally:**
   - All user-facing strings (titles, body text, FAQs)
   - Section headings
   - Meta titles and descriptions
   - Image alt text (if present)

3. **Match Structure:**
   - Same number of intro paragraphs
   - Same number of sections (same order)
   - Same number of FAQs
   - Same gallery structure

4. **Locale-Specific Adaptation:**
   - Maintain cultural appropriateness
   - Preserve original meaning while adapting phrasing
   - Keep the same level of formality as existing locale content

**Process:**
```typescript
for each locale in [ar, da, de, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh]:
  - Read existing locale content
  - Update strings to match EN semantics
  - Preserve all tokens exactly
  - Write updated locale content
```

### 5. Report Completion

Summarize:
- Initial score vs final score
- Number of audit iterations required
- Issues fixed (categorized)
- Number of locales updated
- Link to view the guide

---

## Example Workflow

### Input
```
Guide URL: http://localhost:3012/en/experiences/gavitella-beach-guide
Readership: Day-trippers from Positano, families with kids
```

### Step 1: Resolve
- Slug: `gavitella-beach-guide`
- Guide key: `gavitellaBeachGuide`

### Step 2: Initial Audit
```bash
pnpm --filter brikette tsx scripts/audit-guide-seo.ts gavitellaBeachGuide
```

**Results:**
- Score: 7.2/10
- Critical issues: 0
- Improvements: 5

### Step 3: Fix Issues (Iteration 1)

**Issue 1:** Meta description too short (128 chars, target 140-160)
- Current: "Everything you need to know about Gavitella Beach in Positano"
- Fixed: "Complete guide to Gavitella Beach in Positano: how to get there, what to expect, facilities, best time to visit, and family-friendly tips"

**Issue 2:** Add 2 more FAQs (currently 6, target 8+)
- Added: "Is Gavitella Beach suitable for children?"
- Added: "Are there restaurants near Gavitella Beach?"

**Issue 3:** Add 1 more internal link (currently 4, target 5+)
- Added link to "positanoBeaches" in intro

**Issue 4:** Content below optimal (1650 words, target 2000+)
- Added "Facilities" section (150 words)
- Expanded "Best Time to Visit" section (200 words)

**Issue 5:** No year references for freshness
- Added "Updated for 2026 season" to intro
- Added seasonal pricing details

Re-run audit...

### Step 3: Fix Issues (Iteration 2)

**Results:**
- Score: 9.1/10
- Critical issues: 0
- Improvements: 0

✅ Audit clean!

### Step 4: Localization

Updated 15 locale files:
- `ar/guides/content/gavitellaBeachGuide.json`
- `da/guides/content/gavitellaBeachGuide.json`
- ... (13 more)

### Step 5: Report

```
✅ SEO Audit Complete: gavitellaBeachGuide

Initial Score: 7.2/10
Final Score: 9.1/10

Iterations: 2
Issues Fixed: 5
- Meta description extended to 154 chars
- Added 2 FAQs (now 8 total)
- Added 1 internal link (now 5 total)
- Expanded content by 350 words (now 2000 total)
- Added 2026 season references

Locales Updated: 15
- All non-EN locales now reflect updated content

View guide: http://localhost:3012/en/experiences/gavitella-beach-guide
```

---

## Quality Gates

Before marking complete:
1. Final audit score ≥ 9.0
2. Zero critical issues
3. Zero improvements
4. All 15 non-EN locales updated
5. All tokens preserved correctly in locales
6. Guide renders without errors in dev server

---

## Error Handling

**Guide not found:**
```
Error: Guide not found
- Check guide manifest for valid guideKey
- Verify slug matches manifest entry
```

**Audit script fails:**
```
Error: Audit script execution failed
- Check script exists at apps/brikette/scripts/audit-guide-seo.ts
- Verify pnpm workspace dependencies installed
- Check content JSON is valid
```

**Localization conflicts:**
```
Error: Locale file update failed
- Verify locale file exists and is valid JSON
- Check for syntax errors after update
- Restore from backup if needed
```

---

## Notes

- This skill combines **audit + fix + localize** in a single invocation
- The audit script is the source of truth for scoring logic
- Fixing must be iterative until the audit is completely clean
- Localization preserves all technical tokens while translating meaning
- Web research is encouraged for authoritative content additions
