---
Type: Investigation-Finding
Feature-Slug: brikette-it-book-route-static-export
Task: TASK-01
Created: 2026-02-26
Status: Complete
---

# TASK-01 Finding: Static Export Artifact Verification

## Verdict

**PASS — `apps/brikette/out/it/book.html` is present in the static export.**

However: the planned CI assertion path (`test -f apps/brikette/out/it/book/index.html`) is **incorrect**. The static export uses the flat HTML format (no `trailingSlash: true`), so the correct file is `apps/brikette/out/it/book.html`, not `apps/brikette/out/it/book/index.html`.

**TASK-05 is superseded.** No source code fix is needed. The IT locale book page is correctly generated.

---

## Evidence

### Local build artifact state

The local `out/` directory at `apps/brikette/out/` is a valid pre-prune static export build (all 18 locale directories present, `_next/static` present, `en.html` present). It was produced with `OUTPUT_EXPORT=1`.

File existence checks:

| Path | Result |
|---|---|
| `apps/brikette/out/it/book.html` | **PRESENT** (exit 0) |
| `apps/brikette/out/it/book/index.html` | ABSENT — does not exist |
| `apps/brikette/out/en/book.html` | PRESENT |
| `apps/brikette/out/en/book/index.html` | ABSENT — does not exist |
| `apps/brikette/out/en.html` | PRESENT (locale index file) |
| `apps/brikette/out/_next/static` | PRESENT |

### Static export output format (root cause of path mismatch)

Next.js `output: 'export'` with **no `trailingSlash: true`** generates flat `.html` files:
- Route `[lang]/book` → `{lang}/book.html` (flat)
- Route `[lang]` (index) → `{lang}.html` (flat locale index)

The shared Next.js config (`packages/next-config/index.mjs`) sets `output: "export"` when `OUTPUT_EXPORT=1` but does **not** set `trailingSlash: true`. Therefore the output is always the flat format.

The existing CI validate step (`test -f apps/brikette/out/en.html`) correctly uses the flat format for the locale index file. The plan's proposed new assertion (`test -f apps/brikette/out/it/book/index.html`) was based on an incorrect assumption about the output format.

### Correct assertion path

```sh
test -f apps/brikette/out/it/book.html
```

This is the correct assertion for TASK-02.

### Source code verification

All upstream sources confirmed correct:

| Source | Finding |
|---|---|
| `apps/brikette/src/i18n.config.ts` | `supportedLngs: [...SUPPORTED_LANGUAGES]` — includes `"it"` unconditionally. No conditional filtering. |
| `apps/brikette/src/app/_lib/static-params.ts` | `generateLangParams()` maps all `i18nConfig.supportedLngs` to `{ lang }`. IT is included. |
| `apps/brikette/src/app/[lang]/book/page.tsx` | `generateStaticParams()` delegates to `generateLangParams()`. No exclusion of IT locale. |
| `apps/brikette/public/_redirects` lines 225–227 | `/it/prenota → /it/book 200`, `/it/prenota/ → /it/book/ 200`, `/it/prenota/* → /it/book/:splat 200` — all three variant rules present and correct. |
| `.github/workflows/brikette.yml` prune list | `rm -rf out/{ar,da,fr,hi,hu,ja,ko,no,pl,pt,ru,sv,vi,zh}` — `it` is NOT in the prune list. |

### Local `out/it/book/` directory contents

The `out/it/book/` directory exists but contains only Next.js 16 metadata txt files (not HTML). This is expected behavior per MEMORY.md: "Next.js 16 exports `__next.*` txt metadata files (33k+) per route". The HTML file is at `out/it/book.html` (sibling to the directory), not inside it.

```
out/it/book/
  __next.$d$lang.book.__PAGE__.txt
  __next.$d$lang.book.txt
  (etc.)
out/it/book.html    ← THE HTML FILE IS HERE
```

---

## CHECKPOINT-01 Activation

Based on this finding:

- **TASK-05**: Superseded (artifact is present; no source fix needed)
- **TASK-02**: Proceeds — but with corrected path: `test -f apps/brikette/out/it/book.html`
- **TASK-03**: Proceeds unchanged
- **TASK-04**: Proceeds unchanged

The plan TASK-02 field must be updated to use `apps/brikette/out/it/book.html` before TASK-02 is executed.

---

## Downstream confidence update

TASK-01 outcome is **Affirming** for TASK-02 and TASK-03:

- TASK-02 Implementation confidence: raises from 90% to 95% (artifact confirmed present; only remaining task is correct path used in assertion — corrected here)
- TASK-03 Implementation confidence: raises from 90% to 95% (`buildLocalizedStaticRedirectRules()` produces the IT book rules as confirmed by `_redirects` lines 225–227)
- TASK-04: unchanged (TASK-01 finding does not affect health check implementation)
- TASK-05: Superseded (not applicable)
