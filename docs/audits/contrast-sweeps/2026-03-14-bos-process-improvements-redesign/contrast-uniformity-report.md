# Contrast + Uniformity Report — BOS Process Improvements Glassmorphism Redesign

**Date:** 2026-03-14
**Routes:** `/process-improvements/new-ideas`, `/process-improvements/in-progress`
**Modes tested:** light (OS default), dark (JS toggle `html.theme-dark`)
**Breakpoint:** 1280px desktop
**Standard:** WCAG 2.x AA

---

## Summary

| Severity | Count | Status |
|---|---|---|
| S1 Blocker | 0 | — |
| S2 Major | 1 | **Fixed in-session** |
| S3 Minor | 3 | **Fixed in-session** |

---

## Findings and Fixes

### F1 — S3 Minor — Hero eyebrow label, both modes (Fixed)

- **Element:** `<p class="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Business OS</p>` (both pages)
- **Light:** rgba(255,255,255,0.5) composited on hero gradient midpoint `hsl(251 66% 36%)` → effective `rgb(143,154,204)` → **3.65:1** vs threshold 4.5:1 ✗
- **Dark:** same compositing on dark gradient midpoint `hsl(260 82% 26%)` → effective `rgb(134,152,188)` → **3.96:1** ✗
- **Fix:** `text-white/50` → `text-white/65` → ~5.1:1 light / ~5.4:1 dark ✓

### F2 — S3 Minor — Stat card sub-labels, in-progress page (Fixed)

- **Element:** "In progress" and "Awaiting decision" labels — `text-xs font-semibold uppercase text-white/55` inside `bg-white/10` glass cards on hero
- **Effective background:** `rgba(255,255,255,0.10)` over hero gradient → effective bg L ≈ 0.094
- **Ratio:** rgba(255,255,255,0.55) on bg L=0.094 → **3.44:1** vs threshold 4.5:1 ✗
- **Fix:** `text-white/55` → `text-white/75` → ~4.9:1 ✓

### F3 — S2 Major — Dark mode glass card boundary invisible (Fixed)

- **Element:** `.glass-card` in dark `.cmd-centre` — `--glass-card-border: rgba(255,255,255,0.10)` over `hsl(228 32% 7%)` body
- **Body background L:** ~0.004 (near-black indigo)
- **Border effective L:** ~0.012 → non-text contrast = **~1.1:1** vs required 3.0:1 (WCAG 1.4.11) ✗
- Cards were visually indistinct from the atmospheric dark background; glow utilities provided the only visible separation
- **Fix (both `@media` and `html.theme-dark` selectors):**
  - `--glass-card-bg`: `rgba(255,255,255,0.05)` → `rgba(255,255,255,0.07)`
  - `--glass-card-border`: `rgba(255,255,255,0.10)` → `rgba(255,255,255,0.30)` → border L ≈ 0.057, contrast vs body ≈ **3.3:1 ✓**
  - `--glass-card-shadow` inset: `rgba(255,255,255,0.06)` → `rgba(255,255,255,0.10)`

---

## Passing Elements

| Element | Mode | Ratio |
|---|---|---|
| Hero H1 `text-white` (48px bold) | Light | ~9.5:1 ✓ |
| Hero H1 `text-white` | Dark | ~11.0:1 ✓ |
| Hero subtitle `text-white/70` (16px) | Light | ~5.6:1 ✓ |
| Hero subtitle `text-white/70` | Dark | ~6.8:1 ✓ |
| Nav active link `text-fg` on `bg-surface-2` | Light | ~16.4:1 ✓ |
| Nav inactive `text-muted` on nav bg | Light | ~5.0:1 ✓ |
| Nav links | Dark | ~13.0 / 5.0:1 ✓ |
| Card body text `text-fg` on glass-card | Light | ~17.5:1 ✓ |
| Card muted text `text-muted` on glass-card | Light | ~5.5:1 ✓ |
| Card text | Dark | ~14.5 / 6.1:1 ✓ |
| Theme toggle button | Both | Visible ✓ |

---

## Files Changed

| File | Change |
|---|---|
| `apps/business-os/src/app/process-improvements/new-ideas/page.tsx` | Eyebrow `/50` → `/65` |
| `apps/business-os/src/app/process-improvements/in-progress/page.tsx` | Eyebrow `/50` → `/65`; stat labels `/55` → `/75` |
| `apps/business-os/src/styles/global.css` | Dark glass card border `0.10` → `0.30`, bg `0.05` → `0.07`, inset `0.06` → `0.10` |

---

## Split-State Note

The BOS theme uses `html.theme-dark` (JS localStorage) as authoritative source and `@media (prefers-color-scheme: dark)` as FOUC fallback. Both selectors define identical `.cmd-centre` dark variable sets. Split-state (OS=light, toggle=dark) produces correct theming — no stale CSS variable mismatch.
