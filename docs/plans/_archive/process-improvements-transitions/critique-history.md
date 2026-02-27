---
Feature-Slug: process-improvements-transitions
---

# Critique History — process-improvements-transitions

## Round 1 — Plan Critique
Date: 2026-02-27
Tool: codemoot (Node 22)
Raw output: `docs/plans/process-improvements-transitions/critique-raw-output.json`
Score: 8/10 → lp_score 4.0
Verdict: needs_revision (2 Major / 2 Minor)

Findings addressed before Round 2:
- WARNING (line 31): Active tasks listed `.item.is-gone` inconsistently with TASK-01/TASK-03 which use `.is-gone-section` / `.is-gone-card`. Fixed: renamed all ghost classes to `.pi-gone-section` / `.pi-gone-card` with `pi-` prefix; updated Active Tasks summary to list correct class names.
- WARNING (line 242): Ghost card HTML injection did not require `esc()` on localStorage-sourced title/tier values. Fixed: added explicit `esc()` requirement to TASK-03 acceptance criteria and ghost card template.
- INFO (line 200): TC-04 localStorage blocking test was brittle. Fixed: replaced with DevTools "set invalid JSON" approach.
- INFO (line 340): TASK-04 generator command said "Likely ...". Fixed: confirmed exact script names (`startup-loop:generate-process-improvements`, `check-process-improvements`) from `scripts/package.json`.

---

## Round 2 — Plan Critique
Date: 2026-02-27
Tool: codemoot (Node 22)
Score: 8/10 → lp_score 4.0
Verdict: needs_revision (2 Major / 1 Minor) — triggered Round 3 (2+ Major)

Findings addressed before Round 3:
- WARNING (line 59): localStorage guard evidence claim overstated — theme-init read is guarded but nav theme-toggle write is not. Fixed: clarified that the new `pi-seen-keys` implementation guards both read and write, being stricter than the existing nav code.
- WARNING (line 149): Reduced-motion guidance suppressed `.pi-gone-section` fade, undermining its functional visibility for reduced-motion users. Fixed: clarified that `prefers-reduced-motion` suppresses only `.item.is-new` entry animation; `.pi-gone-section` for reduced-motion users uses `animation: none` and relies on JS `setTimeout` for removal after 6s.
- INFO (line 358): Risk mitigation mentioned `pi-` prefix but class names at the time lacked it. Fixed by renaming `.is-gone-section` → `.pi-gone-section` and `.is-gone-card` → `.pi-gone-card` globally.

---

## Round 3 — Plan Critique (Final)
Date: 2026-02-27
Tool: codemoot (Node 22)
Score: 8/10 → lp_score 4.0
Verdict: credible (≥4.0 — plan+auto proceeds)

Remaining findings (Round 3 is final — not looped further):
- WARNING (line 149): Reduced-motion prose remains internally ambiguous — "NOT suppressed" followed by description of suppressing the fade. Advisory: lp-do-build should resolve the ambiguity at implementation time using the explicit decision: `.pi-gone-section` CSS fade is suppressed for reduced-motion users via `animation: none`; section visibility and JS setTimeout removal are unaffected.
- WARNING (line 372): Global acceptance criterion says "fades after 6 seconds" without scoping to non-reduced-motion mode. Advisory: lp-do-build should scope this to "fades after 6s (non-reduced-motion) or disappears after 6s via JS removal (reduced-motion)".
- INFO (line 83): localStorage guard wording still implies both operations are pre-established. Advisory only — the constraint section now correctly describes the requirement.

Post-loop gate result: lp_score 4.0 ≥ 4.0 → credible. No Critical findings. plan+auto eligible. Auto-continuing to `/lp-do-build process-improvements-transitions`.
