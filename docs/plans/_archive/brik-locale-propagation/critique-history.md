# Critique History: brik-locale-propagation

## Round 1 — 2026-02-28

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Test Landscape | i18n-parity-quality-audit coverage over `rooms.{id}.title` not verified — test file confirmed to exist but not read |
| 1-02 | Minor | Frontmatter | `Related-Plan` field absent (required forward pointer per fact-find lens) |
| 1-03 | Minor | Confidence Inputs | "What raises to ≥90%" sections trivially answered "Already at 97% — no further evidence needed" |
| 1-04 | Minor | Data & Contracts | 11/17 non-EN locales unsampled; inference from git commit not made explicit |

### Issues Confirmed Resolved This Round

None (Round 1).

### Issues Carried Open (not yet resolved)

None — all issues fixed via autofix.

### Autofix Summary

- 5 point fixes applied: Related-Plan added; test landscape note strengthened; confidence inputs revised to evidence-based rationale; Data & Contracts sampling basis made explicit; i18n false-pass risk added to Risks table.
- Consistency scan: no stale terminology or duplicate definitions found.

## Round 2 — 2026-02-28

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Moderate | TASK-01 TC-01 | Python brace expansion `{ar,da,de,es}` non-executable in Python string literal; `...` placeholder present |
| 2-02 | Moderate | TASK-05 TC-04 | Single-proxy check for room_3 only — 8 of 9 EN room titles uncovered; i18n-parity cannot catch short strings (<25 chars) for any locale |
| 2-03 | Moderate | TASK-05 TC-05 | Inverted grep logic produces output for all 17 locales that don't contain "Double Room" — effectively a no-op |
| 2-04 | Minor | TASK-05 Impact/Risks | Short-string coverage gap scoped to "Latin-script locales" only — actually applies to all 17 locales |
| 2-05 | Minor | TASK-05 Edge Cases | TC-05 note said "adjust the check" — stale after TC-05 was fixed |

### Issues Confirmed Resolved This Round

None (Round 2 — all issues opened and autofixed in same round).

### Issues Carried Open (not yet resolved)

None — all issues fixed via autofix.

### Autofix Summary

- 5 point fixes applied: TC-01 expanded to explicit file list; TC-04 expanded to all 9 EN titles × all 17 locales; TC-05 replaced with Python content check; Impact rationale updated to all-locale scope; Risks entry updated; Edge Cases TC-05 note updated; "What would make this ≥90%" updated.
- Consistency scan: 3 stale cross-references updated (Edge Cases TC-05 note, "What would make this ≥90%" Latin-scope reference, Risks entry).
- Plan verdict: credible, 4.5/5.0. Severity distribution: 0 Critical, 0 Major, 3 Moderate, 2 Minor.
