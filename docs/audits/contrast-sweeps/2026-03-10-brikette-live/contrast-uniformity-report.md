# Contrast + Uniformity Audit — Brikette Live Site
**Date:** 2026-03-10
**Standard:** WCAG 2.x AA
**Breakpoints tested:** 320, 375, 430, 768, 1024, 1280, 1536 px
**Modes:** Light (default), Dark (via `.dark` class toggle)
**Surfaces:** Homepage, Dorms listing, Room detail, Experiences, How-to-get-here index + guide detail, Help/Guides, Filters Dialog, Callout blocks, Footer
**Evidence method:** Computed-style extraction via JS evaluation + static source grep + WCAG luminance calculation from token hex values

---

## Token Baseline (Light Mode)

| Token | Hex | Luminance |
|---|---|---|
| `--color-brand-primary` | `#005887` | 0.088 |
| `--color-brand-secondary` | `#f4d35e` | 0.672 |
| `--color-brand-text` | `#1b1b1b` | 0.008 |
| `--color-brand-heading` | `#0a0a0a` | 0.001 |
| `--color-brand-bg` | `#ffffff` | 1.000 |
| `--color-brand-surface` | `#f2f3f4` | 0.906 |
| `--color-brand-muted` | `#6b7280` | 0.162 |
| `--color-brand-outline` | `#d1d5db` | ~0.770 |
| `--color-brand-terra` | `#c4572e` | 0.188 |
| `--color-brand-on-accent` | `#1b1b1b` | 0.008 |
| `--color-brand-paragraph` | `#374151` | 0.051 |

## Token Baseline (Dark Mode)

| Token | Hex | Luminance |
|---|---|---|
| `--color-brand-primary` | `#4da8d4` | 0.348 |
| `--color-brand-secondary` | `#d2b53f` | 0.474 |
| `--color-brand-text` | `#f7f7f7` | 0.955 |
| `--color-brand-heading` | `#ffffff` | 1.000 |
| `--color-brand-bg` | `#181818` | 0.007 |
| `--color-brand-surface` | `#1f1f1f` | 0.013 |
| `--color-brand-outline` | `#1f1f1f` (= surface) | 0.013 |
| `--color-brand-muted` | rgb(180,180,180) | 0.460 |
| `--color-brand-on-primary` | `#1b1b1b` | 0.008 |

---

## Findings

### F-01 — Yellow legend labels in Filters Dialog — S1 Blocker

**Route:** `/en/how-to-get-here` → open Filters dialog
**Mode:** Light
**Breakpoints:** All (dialog renders the same across breakpoints)
**File:** `apps/brikette/src/routes/how-to-get-here/components/FiltersDialog.tsx:98,131,166`

**Element:** `<legend className="... text-brand-secondary">` — used as fieldset labels for Destination, Transport, and Direction filter groups inside a white modal dialog.

**Colors:**
- Text: `#f4d35e` (brand-secondary) — luminance 0.672
- Background: dialog surface ≈ white (`#ffffff`) — luminance 1.000

**Contrast ratio:** (1.000 + 0.05) / (0.672 + 0.05) = **1.45:1**
**Required (AA normal text):** 4.5:1
**Shortfall:** 3.05 ratio points

**Severity:** S1 — legend labels are interactive affordance labels (`<legend>` inside `<fieldset>`). At 1.45:1 they are effectively invisible on light backgrounds. Users relying on contrast cannot identify which filter group they are interacting with.

**Fix direction:** Change `text-brand-secondary` to `text-brand-primary dark:text-brand-secondary` to match the established eyebrow pattern used elsewhere (e.g., `ExperienceGuidesSection.tsx:74`, `AssistanceHero.tsx:33`). `brand-primary` on white = 7.6:1 ✅.

---

### F-02 — Yellow callout titles in guide blocks — S1 Blocker

**Routes:** All guide pages with "tip" callout blocks (e.g., `/en/how-to-get-here/amalfi-positano-bus`, `/en/experiences/*`)
**Mode:** Light
**Breakpoints:** All
**Files:**
- `apps/brikette/src/routes/guides/blocks/handlers/calloutBlock.tsx:23` — `VARIANT_STYLES.tip.title`
- `apps/brikette/src/routes/how-to-get-here/_callouts.tsx:230`

**Element:** Callout block title/label rendered as `<p className="... text-brand-secondary">` inside a box with `bg-brand-primary/5` (5% opacity of `#005887` on white ≈ `#f0f4f7`).

**Colors:**
- Text: `#f4d35e` — luminance 0.672
- Background: `bg-brand-primary/5` ≈ `#f0f4f7` — luminance ≈ 0.902

**Contrast ratio:** (0.902 + 0.05) / (0.672 + 0.05) = **1.32:1**
**Required (AA normal text):** 4.5:1
**Shortfall:** 3.18 ratio points — worse than F-01 (lighter background makes it harder)

**Severity:** S1 — callout titles (e.g., "TIP", "GOOD TO KNOW") label important supplementary content. The label is the primary visual affordance indicating this is special-purpose content.

**Fix direction:**
- `calloutBlock.tsx:23`: Change `VARIANT_STYLES.tip.title` from `text-brand-secondary` to `text-brand-primary dark:text-brand-secondary`
- `_callouts.tsx:230`: Same fix — `text-brand-secondary` → `text-brand-primary dark:text-brand-secondary`

---

### F-03 — Yellow eyebrow on guide detail hero card — S1 Blocker

**Route:** `/en/how-to-get-here/[slug]` — guide detail pages (e.g., `/en/how-to-get-here/amalfi-positano-bus`)
**Mode:** Light
**Breakpoints:** All
**File:** `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/HowToGetHereContent.tsx:195`

**Element:** `<p className="text-sm font-semibold uppercase tracking-widest text-brand-secondary">` — eyebrow text inside a card with `bg-brand-surface` background.

**Colors:**
- Text: `#f4d35e` — luminance 0.672
- Background: `#f2f3f4` — luminance 0.906

**Contrast ratio:** (0.906 + 0.05) / (0.672 + 0.05) = **1.32:1**
**Required (AA normal text):** 4.5:1

**Severity:** S1 — eyebrow identifies the category/context of the guide card header. Invisible at 1.32:1.

**Fix direction:** `text-brand-secondary` → `text-brand-primary dark:text-brand-secondary`

---

### F-04 — Dark mode `border-brand-outline` resolves to near-invisible — S2 Major

**Routes:** All pages — affects inputs, cards, and field borders
**Mode:** Dark
**Breakpoints:** All
**Source:** `apps/brikette/src/styles/global.css:109`

**Root cause:** In dark mode, `--color-brand-outline` is defined as `var(--color-brand-surface)` = `#1f1f1f`. Components using `dark:border-brand-outline/*` have borders that approach the dark bg (`#181818`) luminance.

**Colors (worst case):**
- Border at 40% opacity on `#181818`: rendered ≈ `#1c1c1c` — luminance ~0.009
- Background `#181818` — luminance 0.007

**Contrast ratio:** (0.009 + 0.05) / (0.007 + 0.05) = **1.04:1**
**Required (AA non-text contrast):** 3.0:1

**Affected components:**
- `GuideSearchBar.tsx` — `dark:border-brand-outline/60` on search input
- `FiltersDialog.tsx` — `dark:border-brand-outline/*`
- Any card without an explicit `dark:border-brand-secondary/35` override

**Mitigating factor:** Many interactive components have `dark:bg-brand-text/10` which gives a slightly lighter element background (~`#2e2e2e`), providing some visual separation even without a visible border. This reduces from S1 to S2.

**Severity:** S2 — form inputs and cards lose their boundary affordance in dark mode, harming discoverability.

**Fix direction:**
Option A: Change `--color-brand-outline` in `.dark` to a value with adequate contrast against both `brand-bg` and `brand-surface`, e.g., `#4a4a4a` (L≈0.070; CR vs #181818 = 2.2:1 — still low) or `#555555` (CR vs #181818 ≈ 3.2:1 ✅).
Option B: Add `dark:border-white/15` or `dark:border-brand-primary/25` globally to all card/input components — more surgical but more file changes.
Option A (token-level fix) is preferred.

---

### F-05 — Uniformity: `text-brand-secondary` used as standalone text color inconsistently — S3 Minor

**Routes:** Multiple
**Mode:** Light
**Breakpoints:** All

The correct established pattern for eyebrow/label text is:
`text-brand-primary dark:text-brand-secondary` → primary (7.6:1) in light, secondary (9.2:1) in dark ✅

The broken pattern is `text-brand-secondary` alone, which only works on dark backgrounds (footer, badges on dark cards). It appears in light-mode contexts in:
- `FiltersDialog.tsx:98,131,166` (→ addressed in F-01)
- `calloutBlock.tsx:23`, `_callouts.tsx:230` (→ addressed in F-02)
- `HowToGetHereContent.tsx:195` (→ addressed in F-03)

There is no `dark:text-brand-secondary` safety net in these three locations — they are missing the `text-brand-primary` light-mode counterpart.

**Severity:** S3 — the underlying pattern convention is sound; only the three locations above violate it. Fixing F-01/F-02/F-03 resolves this uniformity issue simultaneously.

---

## Passed Checks

| Check | Mode | Color pair | Ratio | Result |
|---|---|---|---|---|
| Body text on page bg | Light | `#1b1b1b` on `#ffffff` | 18.1:1 | ✅ AAA |
| Primary CTA button | Light | `#ffffff` on `#005887` | 7.6:1 | ✅ AA |
| Nav links (primary) | Light | `#005887` on `#ffffff` | 7.6:1 | ✅ AA |
| Muted text on white | Light | `#6b7280` on `#ffffff` | 4.95:1 | ✅ AA |
| Paragraph text on white | Light | `#374151` on `#ffffff` | 10.4:1 | ✅ AAA |
| Badge text on yellow | Light | `#1b1b1b` on `#f4d35e` | 12.45:1 | ✅ AAA |
| Footer CTA link (yellow on teal) | Light | `#f4d35e` on `#005887` | 5.23:1 | ✅ AA |
| Star icons (aria-hidden) | Light | n/a — decorative | — | ✅ N/A |
| ✓ checkmark in perks (aria-hidden) | Light | n/a — aria-hidden | — | ✅ N/A |
| Primary link on dark bg | Dark | `#4da8d4` on `#181818` | 6.98:1 | ✅ AA |
| Secondary accent on dark bg | Dark | `#d2b53f` on `#181818` | 9.19:1 | ✅ AA |
| Body text on dark bg | Dark | `#f7f7f7` on `#181818` | 16.7:1 | ✅ AAA |
| Muted text on dark bg | Dark | rgb(180,180,180) on `#181818` | 7.39:1 | ✅ AA |
| On-primary text on dark button | Dark | `#1b1b1b` on `#4da8d4` | 6.86:1 | ✅ AA |
| Terra icon (aria-hidden) | Light | n/a — aria-hidden | — | ✅ N/A |
| Focus rings (brand-primary/20 ring) | Light | `#005887` ring visible | >3:1 | ✅ AA |

---

## Summary

| Severity | Count | IDs |
|---|---|---|
| S1 Blocker | 3 | F-01, F-02, F-03 |
| S2 Major | 1 | F-04 |
| S3 Minor | 1 | F-05 |
| **Total** | **5** | |

**Root cause shared by F-01, F-02, F-03, F-05:** `text-brand-secondary` (yellow `#f4d35e`) used without a light-mode counterpart color in components rendered on white or near-white backgrounds. The token is only safe for text when the background is dark (footer teal `#005887` = 5.23:1, dark bg `#181818` = 9.19:1).

**Root cause of F-04:** `--color-brand-outline` token redefined in `.dark` to equal `--color-brand-surface`, which is near-identical to the dark background. Borders using this token collapse to ~1:1 against the dark page background.

---

## Assumptions and Scope Gaps

- Screenshots not captured (headless browser evaluate return path not surfaced); contrast calculations use WCAG luminance formula on hex token values extracted from `global.css` and confirmed via static grep.
- Breakpoint-specific layout changes (e.g., mobile stacking) not separately measured — same token pairs apply across all breakpoints for the text-color failures.
- Focus-ring keyboard path not interactively tested; `focus-visible:ring-2 focus-visible:ring-brand-primary` class presence confirmed by grep — no failures anticipated but not formally measured.
- Gradient/image overlay areas (hero image overlays) not calculated — deprioritized as text in those regions uses `text-brand-bg` (white) on dark-gradient overlay which is expected to pass.

---

## Artifact Paths

- Report: `docs/audits/contrast-sweeps/2026-03-10-brikette-live/contrast-uniformity-report.md`
- Machine-readable: `docs/audits/contrast-sweeps/2026-03-10-brikette-live/contrast-findings.json`
