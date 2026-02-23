# Critique History: brik-color-token-consolidation

## Round 1 — 2026-02-23

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Critical Failures Summary | Contrast failures not cross-referenced with actual rendered usage — some are preventive guardrails not live bugs |
| 1-02 | Moderate | Planning Readiness | Status `Ready-for-planning` despite acknowledged blocking open question on dark mode hue direction |
| 1-03 | Moderate | Remaining Assumptions | Base theme bleed-through listed as untested assumption but already evidenced in own document |
| 1-04 | Moderate | Redundant Code / `.text-brand-bg/90` | Bug severity overstated — all 4 consumers have dark: overrides masking the issue |
| 1-05 | Moderate | Color Identity Hue Shift | Proposed replacement hex values lack verified contrast ratios against all relevant backgrounds |
| 1-06 | Minor | Data & Contracts / JS mismatch | Impact not traced to rendered output (`<meta name="theme-color">` in layout.tsx) |

### Issues Confirmed Resolved This Round
(none — first round)

### Issues Carried Open (not yet resolved)
(none — first round)

## Round 2 — 2026-02-22

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | Critical Failures Summary | Dark-mode link failure was misclassified as universally live despite `.dark a` override to secondary |
| 2-02 | Major | Suggested Task Seeds | Overlay replacement step contradicted risk section and would invert scrim behavior in dark mode |
| 2-03 | Moderate | Frontmatter metadata | `Created` and `Last-updated` were future-dated relative to run date |
| 2-04 | Moderate | Data & Contracts | JS/CSS token mismatch analysis omitted dark-mode tuple divergence |
| 2-05 | Moderate | Patterns/Impact counts | Numeric adoption/blast-radius counts were stale or weakly evidenced |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Moderate | Contrast failures mixed guardrails and live bugs | Critical failures rewritten to distinguish preventive guardrails vs live rendered failures |
| 1-02 | Moderate | Ready-for-planning conflicted with blocking open question | Planning readiness updated to explicit conditional unblock (`default assumption` path) |
| 1-03 | Moderate | Remaining assumption duplicated already-known evidence | Remaining assumptions now cite concrete confirmed base-token usage paths |
| 1-04 | Moderate | `.text-brand-bg/90` impact overstated | Existing dark override masking retained explicitly in bug note |
| 1-05 | Moderate | Hue-fix proposals lacked explicit contrast evidence | Proposed dark replacements now include quantified sample contrast ratios |
| 1-06 | Minor | JS/CSS mismatch impact path was missing | Impact now explicitly tied to `viewport.themeColor` usage in `apps/brikette/src/app/layout.tsx` |

### Issues Carried Open (not yet resolved)
(none)
