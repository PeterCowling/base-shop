Type: Audit
Status: Reference

# Guide Translation Developer Experience: Problem Audit

**Date:** 2026-01-25
**Context:** Visiting `/en/draft/guides/48-hour-positano-weekend` reveals significant productivity barriers
**Status:** Reference - see [Implementation Plan](guide-translation-dx-improvements-plan.md)

---

## Summary

When developers are told "translations are missing," they face 21 identified barriers preventing them from understanding **which** translations are missing and **how** to fix them.

| Category | Count |
|----------|-------|
| Critical (P0) | 4 |
| Major (P1) | 4 |
| Moderate (P2) | 10 |
| Documentation | 3 |
| **Total** | **21** |

---

## Critical Problems (P0)

### 1. Zero User-Facing Error Messages for Missing Translations

**Location:** Guide rendering across `apps/brikette/src/routes/guides/`

When a developer visits a draft guide with incomplete translations:
- The page renders silently using placeholder strings like "Tłumaczenie w przygotowaniu" (Polish) or "A fordítás folyamatban van" (Hungarian)
- No UI element indicates which fields are untranslated
- Developers must manually inspect rendered HTML to find placeholder text

**Evidence:**
- `locales/hu/guides/content/weekend48Positano.json` contains 23 instances of Hungarian placeholder
- `locales/pl/guides/content/weekend48Positano.json` contains 20 instances of Polish placeholder
- System-wide: 1,327 placeholder strings across all guide translations
- No UI warns developers these are placeholders

---

### 2. Translation Diagnostics Hidden Behind Non-Obvious Interaction

**Location:** [GuideEditorialPanel.tsx](apps/brikette/src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx)

The editorial panel shows "Translations: X/18 locales" but:
- Diagnostic details are in a `<details>` element with **no visual affordance**
- No arrow, icon, or "Click to expand" text
- Just shows clickable blue text with no indication it's interactive
- The **exact information developers need** (per-locale breakdown) is hidden here

```tsx
// DiagnosticDetails.tsx
<details className={clsx(DETAIL_CONTAINER_CLASSES)}>
  <summary className="cursor-pointer text-xs font-semibold text-brand-primary">
    Translation coverage: {completeLocales.length}/{totalLocales} locales
  </summary>
  // Hidden: per-locale breakdown showing which fields are missing
```

---

### 3. No Console Logging in Production Mode

**Location:** Multiple files in `apps/brikette/src/routes/guides/`

All translation diagnostic logging is gated behind `IS_DEV` checks:

```typescript
// _GuideSeoTemplate.tsx:256
if (IS_DEV) console.debug("[GuideSeoTemplate] debug title", err);

// GuideBoundary.tsx:25
if (IS_DEV) console.debug("[GuideBoundary]", this.props.guideKey ?? "unknown", error);

// guide-seo/toc.ts:123, 181, 206
if (IS_DEV) console.debug("[toc] translateGuides toc", err);
```

**Impact:** Developers running production builds (including staging/preview) get zero diagnostic output.

---

### 4. Placeholder Detection Has Incomplete Coverage

**Location:** [content-detection/placeholders.ts](apps/brikette/src/routes/guides/guide-seo/content-detection/placeholders.ts)

`isPlaceholderString()` only checks for:
- Empty/undefined values
- Exact key match
- "Traduzione in arrivo" (Italian only)
- Keys starting with `{key}.`

**Missing patterns:**
- "Tłumaczenie w przygotowaniu" (Polish) - 20 instances in weekend48Positano alone
- "A fordítás folyamatban van" (Hungarian) - 23 instances
- "Translation in progress" (English fallback)
- Any other locale-specific placeholder phrases

**Result:** Guide diagnostics report 15/18 locales as "complete" when they're actually full of placeholders.

---

## Major Problems (P1)

### 5. No Link Between Dashboard and Specific Translation Issues

**Location:** Draft dashboard at `/en/draft` and individual guide pages

The flow is broken:
- Dashboard shows "Translations: 3/18 locales"
- Clicking "Open draft" shows same stat in editorial panel
- **No guidance** on how to fix the 15 incomplete locales
- No "Fix translations" link or workflow

---

### 6. Translation File Locations Not Shown in UI

When developers see "missing translations," they must search the codebase to find files at:
```
/locales/{locale}/guides/content/{guideKey}.json
```

No UI shows file paths or provides direct edit links.

---

### 7. Translation Diagnostic API Exists But Isn't Surfaced

**Location:** [app/api/guides/[guideKey]/route.ts](apps/brikette/src/app/api/guides/[guideKey]/route.ts)

An API endpoint exists that provides translation data:
```
GET /api/guides/[guideKey]?locale=pl
```

But:
- Requires `ENABLE_GUIDE_AUTHORING=1` + preview token
- No developer-facing UI calls this endpoint
- Must manually construct API URLs

---

### 8. No Visual Distinction Between Draft and Production Readiness

**Location:** Editorial panel across draft and production routes

- Draft routes (`/draft/guides/...`) and production routes (`/experiences/...`) show identical content
- Status badge shows "Draft/Review/Live" but doesn't explain what each means
- No "This guide cannot be published until translations are complete" warning

---

## Moderate Problems (P2)

### 9. Checklist System Doesn't Explain Requirements

Editorial panel shows checklist items: "Translations", "Content", "FAQs", "Media" with status but **no explanation** of what "complete" means or how to achieve it.

---

### 10. Fallback Language Behavior Not Explained

**Location:** [getGuideResource.ts](apps/brikette/src/routes/guides/)

When Polish locale is missing content, system silently falls back to English. No UI indicator shows fallback occurred.

```typescript
const includeFallback = options?.includeFallback !== false;
// ... silently returns English if locale missing
```

---

### 11. No Bulk Translation Status Report

To check translation status for all guides, developers must:
1. Visit `/en/draft` dashboard
2. Click each guide's "Open draft" link individually
3. Expand translation diagnostics manually
4. Record results somewhere
5. Repeat for all 100+ guides

No bulk export, filter, or sort options exist.

---

### 12. Error Boundary Provides No Actionable Information

**Location:** [GuideBoundary.tsx](apps/brikette/src/routes/guides/)

```tsx
<div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
  <p className="text-sm">This content could not be loaded. Please try refreshing the page.</p>
</div>
```

Generic message with no error details, type distinction, or troubleshooting links.

---

### 13. Guide Manifest Checklist Overrides Don't Surface Diagnostics

**Location:** [guide-manifest.ts](apps/brikette/src/routes/guides/guide-manifest.ts)

Manifest can define manual checklist items that silently override automatic diagnostics:
```typescript
checklist: [
  { id: "translations", status: "missing" },
  { id: "content", status: "complete" }
]
```

No indication that manual override is active vs. computed status.

---

### 14. No Guide Authoring Documentation

- Zero docs in `/apps/brikette/docs/` about guide translation workflow
- No README in `/locales/guides.stub/` explaining stub content
- AGENTS.md files don't mention translation debugging

---

### 15. Translation Pipeline Plan Not Linked from Codebase

Excellent docs exist but aren't discoverable:
- `/docs/plans/content-translation-pipeline-plan.md`
- `/docs/brikette-translation-coverage.md`

Neither linked from app code or AGENTS.md files.

---

### 16. No Developer FAQ for Common Translation Issues

Missing quick answers to:
- "Why does my guide show English text in Polish?"
- "How do I know which locales are incomplete?"
- "What does 'Translation coverage: 3/18 locales' mean?"
- "Why does the checklist say 'complete' but I see placeholder text?"

---

### 17. No Direct Edit Link from Draft Page to Translation Files

Current workflow requires 7 steps to edit a translation file. Missing:
- "Edit translation (pl)" button
- VS Code deep link: `vscode://file/path/to/file.json`
- Copy file path button

---

### 18. No Translation Template Generator

To add a missing locale, developers must manually:
1. Copy English translation file
2. Create new locale file with exact same structure
3. Replace all strings

Missing:
- CLI command: `pnpm generate-translation-stub weekend48Positano --locale=pl`
- UI button: "Create template for Polish"

---

## Root Cause Analysis

| Problem Category | Root Cause |
|-----------------|------------|
| **Discoverability** | Translation diagnostics hidden in collapsed `<details>` with no visual affordance |
| **Feedback** | Zero console warnings in production; no UI errors for placeholder detection |
| **Accuracy** | Placeholder detection only supports Italian; marks incomplete translations as complete |
| **Guidance** | No links to files, no "how to fix" instructions, no workflow documentation |
| **Tooling** | Diagnostic API exists but no UI; no bulk reports; no edit shortcuts |
| **Documentation** | Zero guide authoring docs; translation plans not linked; no developer FAQ |

---

## Files Involved

Key files that would need changes to address these problems:

- `apps/brikette/src/routes/guides/guide-seo/content-detection/placeholders.ts`
- `apps/brikette/src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx`
- `apps/brikette/src/routes/guides/guide-seo/components/DiagnosticDetails.tsx`
- `apps/brikette/src/routes/guides/GuideBoundary.tsx`
- `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx`
- `apps/brikette/src/routes/guides/guide-manifest.ts`
- `apps/brikette/src/app/[lang]/draft/DraftDashboardContent.tsx`

---

## Next Steps

This document identifies problems only. Before proposing solutions:

1. **Prioritize:** Which problems cause the most friction?
2. **Group:** Which problems can be solved together?
3. **Scope:** What's the minimum viable improvement?
4. **Dependencies:** Are there existing patterns we should follow?

Ready to proceed with solution planning when requested.
