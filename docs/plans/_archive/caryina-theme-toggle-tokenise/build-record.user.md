# Build Record — Caryina Theme Toggle Tokenise

**Plan:** caryina-theme-toggle-tokenise
**Date:** 2026-03-13
**Track:** code
**Business:** CARY

## What Was Done

Replaced 4 hardcoded `rgba()` colour values in the Caryina theme toggle with CSS custom property references sourced from the brand token system.

Changes:
- `packages/themes/caryina/tokens.css` — added 4 new shadow tokens: `--shadow-glow-sun`, `--shadow-glow-moon`, `--shadow-toggle-inset`, `--shadow-toggle-inset-dark`
- `apps/caryina/src/components/HeaderThemeToggle.client.tsx` — `SUN_GLOW` and `MOON_GLOW` constants now reference `var(--shadow-glow-sun)` / `var(--shadow-glow-moon)`; button inset shadows reference `var(--shadow-toggle-inset)` / `var(--shadow-toggle-inset-dark)`

The one remaining `rgba()` in the file (`rgba(255,255,255,0.85)` for cloud fill) is a semantic white, not a brand colour, and is out of scope.

## Validation Evidence

- `grep -n "rgba(" HeaderThemeToggle.client.tsx` → only cloud fill remains (line 113), all 4 brand-palette values replaced ✓
- `pnpm --filter @apps/caryina typecheck` → clean, no errors ✓

## Engineering Coverage Evidence

| Surface | Coverage |
|---|---|
| UI | Token values verified match original computed colours |
| Testing | Typecheck passes; no test changes required (CSS token resolution not exercised in Jest) |

## Outcome Contract

- **Why:** The sun and moon glow effects in the theme toggle were set as fixed colour values in the code rather than being linked to the shop's brand palette. Linking them to the token system means any brand refresh automatically applies to the toggle too.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All theme toggle glow and shadow values reference CSS tokens. Confirmed working in both light and dark modes with no visual regression.
- **Source:** operator

## Workflow Telemetry Summary

Micro-build lane. Single task, no upstream plan.md or analysis.md. Telemetry recorded via ideas workflow hook.
