---
Type: Reference
Status: Active
---

# Local Contrast Scan — 2026-02-11

## Scope
- Target: `http://localhost:3012`
- Routes:
  - `/en`
  - `/en/experiences`
  - `/en/rooms`
  - `/en/how-to-get-here`
  - `/en/deals`
- Modes: light + dark
- Rule: axe-core `color-contrast`

## Command Pattern
- Started app: `pnpm --filter @apps/brikette dev`
- Scanner: Playwright + axe-core (JS-on)

## Result
- Total color-contrast violations: **0** across all sampled routes in both light and dark mode.
- Machine-readable artifact: `docs/audits/user-testing/2026-02-11-local-contrast-scan.json`

## Notes
- This scan validates local source state after contrast/theme fixes.
- Preview environment may still show old violations until a new deployment is built from this code.
