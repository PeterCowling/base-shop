# Contrast + Uniformity Report
## PWRB Partner Brochure — 2026-03-06

| Field | Value |
|---|---|
| Target | `docs/business-os/strategy/PWRB/marketing/2026-03-01-partner-brochure-mobile-first.user.html` |
| Standard | WCAG 2.x AA |
| Breakpoints tested | 390, 768, 1024, 1280, 1440px |
| Mode | Light only (no dark mode in this document) |
| Surfaces | All: hero, topbar, cards, commission grid, gallery, FAQ, CTA |
| Screenshots | `./screenshots/` |

---

## Summary

| Severity | Count |
|---|---|
| S1 Blocker | 2 (both decorative — see notes) |
| S2 Major | 10 |
| Pass | 23 |
| **Total checks** | **35** |

**Root cause**: one systemic failure accounts for 9 of 12 issues — `--muted: #7b87a4` (3.32–3.59:1 on white/pageBg) falls below the 4.5:1 AA threshold for normal text. A single token change fixes the majority.

---

## S1 — Blockers

### S1-01 · Hero tag border
| Field | Value |
|---|---|
| Zone | Hero |
| Element | `.hero-tag` border (`rgba(255,255,255,.15)` on `#0a0f1e`) |
| State | Default |
| Measured ratio | **1.52:1** |
| Required (non-text) | 3.0:1 |
| Breakpoints affected | All |

**Assessment**: This border is purely decorative — the tag's white text (`rgba(255,255,255,.60)`) provides 6.80:1 contrast and is the readable element. The border adds shape but carries no information. Under WCAG 1.4.11, decorative components are exempt. **Reclassify as decorative — no fix required**, but note it if a future auditor checks.

---

### S1-02 · Card icon background border
| Field | Value |
|---|---|
| Zone | Cards (all) |
| Element | `.card-icon` border (`rgba(37,70,212,.10)` on `#ffffff`) |
| State | Default |
| Measured ratio | **1.17:1** |
| Required (non-text) | 3.0:1 |
| Breakpoints affected | All |

**Assessment**: The 1px border is a subtle aesthetic separator around the icon container. The icon SVG itself (`color: var(--accent)` = `#2546d4` on `#fff`) achieves **7.23:1** — well above threshold. The border carries no functional information. **Reclassify as decorative — no fix required.**

---

## S2 — Major Failures

### S2-01 · Muted text — systemic (9 instances)

**Root cause**: `--muted: #7b87a4` on any light background.

| Element | Background | Measured | Required | Gap |
|---|---|---|---|---|
| Benefit `p` text | `#ffffff` | 3.59:1 | 4.5:1 | −0.91 |
| Step `p` text | `#ffffff` | 3.59:1 | 4.5:1 | −0.91 |
| Commission cell label | `#f4f6fb` | 3.32:1 | 4.5:1 | −1.18 |
| Commission cell note | `#f4f6fb` | 3.32:1 | 4.5:1 | −1.18 |
| Resp col heading (uppercase) | `#f4f6fb` | 3.32:1 | 4.5:1 | −1.18 |
| FAQ answer text | `#ffffff` | 3.59:1 | 4.5:1 | −0.91 |
| CTA label | `#ffffff` | 3.59:1 | 4.5:1 | −0.91 |
| Lang button (inactive) | `#f4f6fb` | 3.32:1 | 4.5:1 | −1.18 |
| Gallery figcaption ¹ | `#ffffff` | *(see below)* | 4.5:1 | — |

¹ Figcaption uses `color: var(--mid)` = `#4a5578` on `#ffffff` = **7.34:1** — this **passes**. Not an S2.

**Fix direction**: Replace `--muted: #7b87a4` with `--muted: #626b85`.
- On `#ffffff`: 5.30:1 ✓
- On `#f4f6fb`: 4.90:1 ✓
- Visual impact: secondary text darkens slightly — still clearly subordinate to ink headings (19:1). The blue-grey character of the colour is preserved.

**Screenshot**: `zone-card-muted.png`, `zone-commission.png`, `zone-topbar.png`

---

### S2-02 · Hero stat label opacity
| Field | Value |
|---|---|
| Zone | Hero stat row |
| Element | `.stat-label` (`rgba(255,255,255,.45)` on composited hero card bg) |
| Measured ratio | **4.43:1** |
| Required | 4.5:1 |
| Gap | −0.07 |

The closest miss in the audit (7ms gap). The stat card background is `rgba(255,255,255,.06)` composited on `#0a0f1e`. A small opacity increase resolves it.

**Fix direction**: `rgba(255,255,255,.45)` → `rgba(255,255,255,.52)` → 5.2:1 ✓

**Screenshot**: `zone-hero-stats.png`

---

### S2-03 · Commission highlight note opacity
| Field | Value |
|---|---|
| Zone | Commission grid — highlight cell |
| Element | `.commission-cell.highlight .commission-cell-note` (`rgba(255,255,255,.40)` on `#0a0f1e`) |
| Measured ratio | **3.80:1** |
| Required | 4.5:1 |
| Gap | −0.70 |

The highlight label (`.45`) just passes (4.51:1). The note (`.40`) falls short.

**Fix direction**: `rgba(255,255,255,.40)` → `rgba(255,255,255,.50)` → 4.84:1 ✓

---

## Uniformity Findings

### U-01 · Muted opacity inconsistency in dark contexts
The hero uses various opacity values for white text in dark contexts: `0.60` (body), `0.65` (captions), `0.45` (stat labels), `0.40`/`0.45` (commission notes/labels). There is no declared opacity scale — each value appears independently chosen. This increases drift risk in future edits.

**Recommendation**: Document an internal opacity scale for the dark hero surface (e.g. `primary: 1.0`, `secondary: 0.65`, `tertiary: 0.50`, `disabled: 0.35`) and apply consistently. Low priority pre-launch but worth noting for any v2 iteration.

### U-02 · Lang button inactive state contrast
The inactive lang button (`IT`/`EN` when not selected) uses `--muted` on `--bg`. Once S2-01 is fixed (muting darkened), this passes automatically. No separate fix needed.

### U-03 · Commission cell label font-size
`.commission-cell-label` is `10px / 700 / uppercase`. At 10px even bold text is below the large-text threshold — it must pass 4.5:1, not 3.0:1. Currently at 3.32:1. Fixed by S2-01.

---

## Passing checks (selected key ones)

| Element | Ratio | Note |
|---|---|---|
| Hero h1 (white on `#0a0f1e`) | 19.09:1 | AAA |
| Hero p body (`rgba(w,.60)`) | 7.21:1 | Passes |
| Hero stat accent `#7ba0ff` | 6.63:1 | Fix from previous session confirmed |
| Hero shot caption (`rgba(w,.65)`) | 7.82:1 | Passes |
| Btn primary (white on `#2546d4`) | 7.23:1 | Passes |
| Btn secondary (ink2 on pageBg) | 14.12:1 | Passes |
| Card headings | 19.09:1 | AAA |
| FAQ summary text on `#f4f6fb` | 17.66:1 | AAA |
| Status pill (`#007a4a`) | 4.70:1 | Passes |
| Econ badge worst-case (bright image) | 5.22:1 | Passes |
| Gallery figcaption (`#4a5578`) | 7.34:1 | Passes |

---

## Fix Plan (prioritised)

| Priority | Fix | Scope | Effort |
|---|---|---|---|
| 1 | `--muted: #7b87a4` → `#626b85` | Single CSS var | XS |
| 2 | Stat label `.45` → `.52` opacity | 1 line in `.stat-label` | XS |
| 3 | Commission note `.40` → `.50` opacity | 1 line in `.commission-cell.highlight .commission-cell-note` | XS |
| — | S1-01/02 borders | Decorative — no change needed | — |

All three fixes are single-line CSS changes. Combined they close 11 of 12 flagged issues; the remaining two are reclassified as decorative-exempt.

---

## Breakpoint-specific notes

No new failures appear at wider breakpoints. The contrast issues are palette-level and affect all viewports equally. No responsive root cause detected.

---

*Generated by `/tools-ui-contrast-sweep` — 2026-03-06*
