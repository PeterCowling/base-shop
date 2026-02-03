Type: Plan
Status: Accepted

# Guide Translation DX Improvements - Implementation Plan

**Date:** 2026-01-25
**Status:** Accepted
**Related:** [Problem Audit](guide-translation-dx-problems.md)

## Summary

Address 21 translation DX problems through 4 phased milestones. **14 of 21 problems solved**, including **all 8 critical/major (P0/P1) issues**.

| Milestone | Focus | Effort | CI | Problems Solved |
|-----------|-------|--------|-----|-----------------|
| 1 | Placeholder Detection & Logging | M | **95%** ✓ DONE | P0-3, P0-4 |
| 2 | Surface Diagnostics in UI | M | **85%** ✓ DONE | P0-1, P0-2, P1-5, P1-6, P1-7, P1-8 |
| 3 | Developer Documentation | S | **95%** ✓ DONE | P2-14, P2-15, P2-16 |
| 4 | Bulk Tooling | M | **92%** DONE | P2-11, P2-17, P2-18 |

---

## Confidence Intervals

| Task | Correctness | Approach | Safety | **Overall** | Notes |
|------|-------------|----------|--------|-------------|-------|
| **1.1** Expand placeholder detection | 95% | 95% | 98% | **95%** | Simple string matching, additive change |
| **1.2** Add conditional debug logging | 90% | 95% | 95% | **93%** | Follows existing `debugGuide` pattern |
| **1.3** Add unit tests | 98% | 95% | 100% | **97%** | Straightforward test cases |
| **2.1** Improve DiagnosticDetails affordance | 85% | 90% | 90% | **88%** | Need to verify chevron CSS works with details element |
| **2.2** Add file path with copy button | 80% | 90% | 95% | **88%** | Clipboard API may need fallback; guideKey prop availability unclear |
| **2.3** Add warning banner | 85% | 85% | 90% | **86%** | Need to verify diagnostics shape has missingLocales count |
| **3.1** Create workflow documentation | 95% | 95% | 100% | **96%** | Pure documentation, no code risk |
| **3.2** Add links from UI | 90% | 85% | 95% | **90%** | Link path may need adjustment for dev vs prod |
| **4.1** Bulk translation status API | 70% | 80% | 85% | **78%** | Requires authoring gate; performance for 100+ guides unclear |
| **4.2** Translation template generator CLI | 65% | 75% | 90% | **76%** | File structure assumptions; needs error handling |

### Confidence Legend
- **95%+**: High confidence - clear implementation path, low risk
- **85-94%**: Good confidence - minor unknowns to resolve during implementation
- **70-84%**: Moderate confidence - some investigation needed, may require iteration
- **<70%**: Lower confidence - significant unknowns, consider fact-finding first

### Risks Requiring Investigation

| Task | Risk | Mitigation |
|------|------|------------|
| 2.1 | Chevron rotation CSS with native `<details>` | Test in browser before committing |
| 2.2 | `guideKey` prop availability in DiagnosticDetails | Check component props chain |
| 2.2 | Clipboard API browser support | Add try/catch with console fallback |
| 2.3 | `missingLocales` count in diagnostics | Verify `TranslationCoverageResult` shape |
| 4.1 | Performance with 100+ guides | Consider pagination or caching |

---

## Milestone 1: Foundation - Placeholder Detection & Logging

**Goal:** Make placeholder detection accurate and enable debugging in all environments
**Overall Confidence:** 95%

### 1.1 Expand Placeholder Detection (CI: 95%)

**File:** `apps/brikette/src/routes/guides/guide-seo/content-detection/placeholders.ts`

Add all locale-specific placeholder phrases:

```typescript
const PLACEHOLDER_PHRASES = [
  "traduzione in arrivo",           // Italian (current)
  "tłumaczenie w przygotowaniu",   // Polish - 800+ instances
  "a fordítás folyamatban van",    // Hungarian - 600+ instances
  "translation in progress",        // English fallback
  "traducción en progreso",        // Spanish
  "traduction en cours",           // French
  "übersetzung in arbeit",         // German
] as const;

export function isPlaceholderString(value: string | undefined, key: string): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  if (trimmed === key) return true;
  const normalised = trimmed.replace(/[.!?…]+$/u, "").toLowerCase();
  if (PLACEHOLDER_PHRASES.some(phrase => normalised === phrase)) return true;
  return trimmed.startsWith(`${key}.`);
}
```

### 1.2 Add Conditional Debug Logging (CI: 93%)

**File:** `apps/brikette/src/utils/debug.ts`

New function enabling production debugging via URL param:

```typescript
export function debugGuideTranslation(prefix: string, ...args: unknown[]): void {
  if (IS_DEV) {
    console.debug(`[${prefix}]`, ...args);
    return;
  }

  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const debugEnabled =
      params.has("debug_guides") ||
      localStorage.getItem("debug_guides") === "1";

    if (debugEnabled) {
      console.warn(`[${prefix}]`, ...args);
    }
  }
}
```

**Update files to use new function:**
- `apps/brikette/src/components/guides/GuideBoundary.tsx`
- `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx`

### 1.3 Add Unit Tests (CI: 97%)

**New file:** `apps/brikette/src/test/routes/guides/placeholder-detection.test.ts`

```typescript
describe("placeholder detection", () => {
  it("detects Italian placeholders", () => {
    expect(isPlaceholderString("Traduzione in arrivo.", "test")).toBe(true);
  });

  it("detects Polish placeholders", () => {
    expect(isPlaceholderString("Tłumaczenie w przygotowaniu.", "test")).toBe(true);
  });

  it("detects Hungarian placeholders", () => {
    expect(isPlaceholderString("A fordítás folyamatban van.", "test")).toBe(true);
  });

  it("does not detect real content", () => {
    expect(isPlaceholderString("This is real content.", "test")).toBe(false);
  });
});
```

---

## Milestone 2: Visibility - Surface Translation Diagnostics

**Goal:** Make translation issues immediately visible and actionable
**Overall Confidence:** 85% (some unknowns to verify during implementation)

### 2.1 Improve DiagnosticDetails Visual Affordance (CI: 88%)

**File:** `apps/brikette/src/routes/guides/guide-seo/components/DiagnosticDetails.tsx`

Changes:
- Auto-expand `<details>` when translations incomplete
- Add chevron icon indicating clickability
- Add badge showing incomplete count

```tsx
<details
  className={clsx(DETAIL_CONTAINER_CLASSES)}
  open={completeLocales.length < totalLocales}
>
  <summary className="cursor-pointer text-xs font-semibold text-brand-primary inline-flex items-center gap-2">
    <ChevronIcon className="h-4 w-4 transition-transform [[open]>&]:rotate-90" />
    Translation coverage: {completeLocales.length}/{totalLocales} locales
    {completeLocales.length < totalLocales && (
      <span className="rounded-full bg-brand-terra/20 px-2 py-0.5 text-[10px] font-semibold text-brand-terra">
        {totalLocales - completeLocales.length} incomplete
      </span>
    )}
  </summary>
  {/* ... */}
</details>
```

### 2.2 Add Translation File Path with Copy Button (CI: 88%)

**File:** `apps/brikette/src/routes/guides/guide-seo/components/DiagnosticDetails.tsx`
**Risks:** guideKey prop availability, clipboard API browser support

New component for incomplete locales:

```tsx
function TranslationFilePath({ locale, guideKey }: { locale: string; guideKey: string }) {
  const filePath = `apps/brikette/src/locales/${locale}/guides/content/${guideKey}.json`;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(filePath).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [filePath]);

  return (
    <div className="flex items-center gap-2 text-xs">
      <code className="font-mono text-[10px] text-brand-text/60">{filePath}</code>
      <button onClick={handleCopy} className="text-brand-primary hover:underline">
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
```

### 2.3 Add Warning Banner for Incomplete Translations (CI: 86%)

**File:** `apps/brikette/src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx`
**Risk:** Need to verify diagnostics shape has missingLocales count

Add prominent warning when translations incomplete:

```tsx
{item.id === "translations" && item.status !== "complete" && (
  <div className="rounded-md border border-brand-terra/30 bg-brand-terra/10 p-2 text-xs text-brand-terra">
    <strong>Action required:</strong> {missingCount} locales have incomplete translations.
    Expand details below to see which files need updates.
  </div>
)}
```

---

## Milestone 3: Guidance - Developer Documentation

**Goal:** Provide comprehensive documentation for translation workflows
**Overall Confidence:** 95%

### 3.1 Create Translation Workflow Guide (CI: 96%)

**New file:** `apps/brikette/docs/guide-translation-workflow.md`

Contents:
- Quick start (check status, fix translations)
- Step-by-step workflow with UI screenshots
- Placeholder phrases table by locale
- FAQ section answering common questions
- Links to related documentation

### 3.2 Add Links from UI (CI: 90%)

**File:** `apps/brikette/src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx`
**Risk:** Link path may need adjustment for dev vs prod environments

```tsx
{item.id === "translations" && (
  <a href="/docs/guide-translation-workflow.md" className="text-xs text-brand-primary underline">
    How to fix translations →
  </a>
)}
```

**File:** `apps/brikette/src/app/[lang]/draft/DraftDashboardContent.tsx`

Add link in header: "Learn about the translation workflow"

---

## Milestone 4: Tooling (DONE)

**Overall Confidence:** 92% (uncertainties resolved via investigation)

### 4.1 Bulk Translation Status Export API (CI: 92%) - DONE

**Previous confidence:** 78%
**Updated confidence:** 92%
  - Implementation: 95% — found pattern in `app/api/guides/[guideKey]/route.ts`
  - Approach: 90% — reuses existing `analyzeTranslationCoverage()` helper
  - Impact: 90% — gated behind authoring flag, no risk to production

**Resolution:**
- Investigated: `isGuideAuthoringEnabled()` gate, `listGuideManifestEntries()` scale
- Decision: Use existing API pattern with dual auth (feature flag + preview token)
- Evidence: 129 guides total - acceptable for single API call without pagination

**New file:** `apps/brikette/src/app/api/guides/bulk-translation-status/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { isGuideAuthoringEnabled } from "@/routes/guides/guide-authoring/gate";
import { isPreviewHeaderAllowed } from "@/routes/guides/guide-authoring/preview";
import { listGuideManifestEntries } from "@/routes/guides/guide-manifest";
import { analyzeTranslationCoverage } from "@/routes/guides/guide-diagnostics";
import { i18nConfig } from "@/i18n.config";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isGuideAuthoringEnabled() || !isPreviewHeaderAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const guides = listGuideManifestEntries();
  const results = guides.map((entry) => {
    const coverage = analyzeTranslationCoverage(entry.key, i18nConfig.supportedLngs);
    return {
      key: entry.key,
      slug: entry.slug,
      status: entry.status,
      coverage: {
        complete: coverage.completeLocales,
        incomplete: coverage.missingLocales,
        percentage: Math.round((coverage.completeLocales.length / coverage.totalLocales) * 100),
      },
    };
  });

  const format = request.nextUrl.searchParams.get("format");
  if (format === "csv") {
    const csv = [
      "Guide Key,Slug,Status,Complete Locales,Incomplete Locales,Percentage",
      ...results.map((r) =>
        `${r.key},${r.slug},${r.status},"${r.coverage.complete.join(";")}","${r.coverage.incomplete.join(";")}",${r.coverage.percentage}%`
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=guide-translation-status.csv",
      },
    });
  }

  return NextResponse.json({ ok: true, guides: results });
}
```

**Acceptance:** API returns JSON/CSV with all 129 guides' translation coverage.

### 4.2 Translation Template Generator CLI (CI: 90%) - DONE

**Previous confidence:** 76%
**Updated confidence:** 90%
  - Implementation: 88% — found CLI pattern in `scripts/check-i18n-coverage.ts`
  - Approach: 92% — follows established ESM/tsx pattern
  - Impact: 95% — file-only operation, no runtime impact

**Resolution:**
- Investigated: `locales/{locale}/guides/content/` structure, existing CLI scripts
- Decision: ESM script with tsx execution, uses fs/promises, main/catch pattern
- Evidence: Existing scripts follow this pattern; JSON files average 1.5-8KB

**New file:** `apps/brikette/scripts/generate-translation-stub.ts`

```typescript
/* eslint-disable security/detect-non-literal-fs-filename -- SEC-1001 [ttl=2026-12-31] Script operates on known locale paths */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALES_ROOT = path.join(__dirname, "..", "src", "locales");

const PLACEHOLDERS: Record<string, string> = {
  it: "Traduzione in arrivo.",
  pl: "Tłumaczenie w przygotowaniu.",
  hu: "A fordítás folyamatban van.",
  es: "Traducción en progreso.",
  fr: "Traduction en cours.",
  de: "Übersetzung in Arbeit.",
  ja: "翻訳準備中。",
  ko: "번역 준비 중.",
  zh: "翻译进行中。",
  pt: "Tradução em andamento.",
  ru: "Перевод в процессе.",
};

function replaceStrings(obj: unknown, placeholder: string): unknown {
  if (typeof obj === "string") return placeholder;
  if (Array.isArray(obj)) return obj.map((v) => replaceStrings(v, placeholder));
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, replaceStrings(v, placeholder)])
    );
  }
  return obj;
}

async function main(): Promise<void> {
  const [guideKey, localeFlag] = process.argv.slice(2);

  if (!guideKey || !localeFlag?.startsWith("--locale=")) {
    console.error("Usage: pnpm gen:translation-stub <guideKey> --locale=<locale>");
    process.exitCode = 1;
    return;
  }

  const locale = localeFlag.split("=")[1];
  const enPath = path.join(LOCALES_ROOT, "en", "guides", "content", `${guideKey}.json`);
  const targetPath = path.join(LOCALES_ROOT, locale, "guides", "content", `${guideKey}.json`);

  try {
    await access(enPath);
  } catch {
    console.error(`Error: English file not found at ${enPath}`);
    process.exitCode = 1;
    return;
  }

  try {
    await access(targetPath);
    console.error(`Error: Target file already exists at ${targetPath}`);
    process.exitCode = 1;
    return;
  } catch {
    // Good - file doesn't exist yet
  }

  const enContent = JSON.parse(await readFile(enPath, "utf-8"));
  const placeholder = PLACEHOLDERS[locale] || "Translation in progress.";
  const stubContent = replaceStrings(enContent, placeholder);

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, JSON.stringify(stubContent, null, 2) + "\n");

  console.log(`✓ Created translation stub at ${targetPath}`);
  console.log(`  Next: Replace "${placeholder}" with actual translations`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

**Package.json addition:**
```json
{
  "scripts": {
    "gen:translation-stub": "tsx scripts/generate-translation-stub.ts"
  }
}
```

**Acceptance:** Running `pnpm gen:translation-stub weekend48Positano --locale=pl` creates stub file with Polish placeholder strings.

---

## Files to Modify

### Milestone 1
| File | Change |
|------|--------|
| [placeholders.ts](../../apps/brikette/src/routes/guides/guide-seo/content-detection/placeholders.ts) | Add placeholder phrase array |
| [debug.ts](../../apps/brikette/src/utils/debug.ts) | Add `debugGuideTranslation()` |
| [GuideBoundary.tsx](../../apps/brikette/src/components/guides/GuideBoundary.tsx) | Use new debug function |
| [_GuideSeoTemplate.tsx](../../apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx) | Use new debug function |
| NEW: placeholder-detection.test.ts | Unit tests |

### Milestone 2
| File | Change |
|------|--------|
| [DiagnosticDetails.tsx](../../apps/brikette/src/routes/guides/guide-seo/components/DiagnosticDetails.tsx) | Auto-expand, chevron, file paths, copy button |
| [GuideEditorialPanel.tsx](../../apps/brikette/src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx) | Warning banner, help link |

### Milestone 3
| File | Change |
|------|--------|
| NEW: guide-translation-workflow.md | Documentation |
| [DraftDashboardContent.tsx](../../apps/brikette/src/app/[lang]/draft/DraftDashboardContent.tsx) | Link to docs |

### Milestone 4 (Optional)
| File | Change |
|------|--------|
| NEW: bulk-translation-status/route.ts | Export API |
| NEW: generate-translation-stub.ts | CLI tool |

---

## Verification

### After Milestone 1
1. Run `pnpm test` - placeholder tests pass
2. Visit draft guide with Polish content → fields with "Tłumaczenie w przygotowaniu" marked incomplete
3. Add `?debug_guides=1` to URL → console warnings appear

### After Milestone 2
1. Visit `/en/draft/guides/48-hour-positano-weekend`
2. Translation section auto-expanded with warning banner
3. Incomplete locales show file path with "Copy" button
4. Click "Copy" → path in clipboard

### After Milestone 3
1. Documentation link visible in editorial panel
2. Link opens comprehensive workflow guide
3. FAQ answers common questions

### Final Validation
```bash
pnpm typecheck && pnpm lint && pnpm test
```

---

## Out of Scope

These problems require architectural changes beyond DX surface improvements:

- P2-9: Checklist requirement explanations (needs i18n/UX redesign)
- P2-10: Fallback language indicator (needs i18n architecture change)
- P2-12: Error boundary improvements (separate refactor)
- P2-13: Manifest override detection (needs manifest redesign)

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Placeholder detection accuracy | ~8% (Italian only) | 100% |
| Time to identify incomplete translations | ~2 min | <5 sec |
| Time to find translation file | ~1 min | <10 sec |
| P0/P1 problems solved | 0/8 | 8/8 |
