# Critique History: caryina-button-strategy

## Round 1 — 2026-03-13

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Suggested Task Seeds, Planning Constraints | Shop filter toggles are `<Link>` elements not `<button>` — DS `<Button asChild>` needed for 2/12 sites |
| 1-02 | Moderate | Planning Constraints, Evidence Audit | `--color-focus-ring` token lives in global.css:111 (not tokens.css); provenance not documented |
| 1-03 | Moderate | Frontmatter | Execution-Track: mixed over-broad; deliverable is pure code-change; should be `code` |
| 1-04 | Minor | Suggested Task Seeds | Tailwind `@apply` caveats not mentioned; v4 cannot freely reference @layer components utilities |
| 1-05 | Minor | Constraints & Assumptions | `@acme/design-system` dep verified by dispatch reference, not package.json line |

### Issues Confirmed Resolved This Round
None (first critique round).

### Issues Carried Open (not yet resolved)
None — all issues addressed by autofix in this round.

### Autofix Summary
- Fix 1: `Execution-Track: mixed` → `code` in frontmatter
- Fix 2: Planning Constraints — added `<Button asChild>` guidance for 2 Link call sites
- Fix 3: Planning Constraints — added `--color-focus-ring` provenance note (global.css:111)
- Fix 4: Planning Constraints — banned `@apply` with explicit v4 rationale
- Fix 5: Suggested Task Seeds — added Link/asChild note to migration task seed
- Consistency cleanup (3 orphaned `@apply` references removed from Evidence Audit, Resolved Q&A, and Task Seeds)

### Post-Fix Score
4.0 / 5.0 — credible. Proceed to validators.

---

## Round 2 — 2026-03-13 (analysis.md)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Minor | Options Considered, Option A Downside | Downside stated as "slightly more verbose" — should state actual fidelity risk (inline string must exactly match token values; no automated catch) |
| 2-02 | Minor | Frontmatter | Status "Draft" vs Planning Readiness "Go" — will be corrected after validators pass; noted for completeness |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | `<Link>` elements need `<Button asChild>` for 2/12 sites | Carried into analysis Constraints and Planning Handoff correctly |
| 1-02 | Moderate | `--color-focus-ring` provenance | Carried into analysis Constraints correctly |
| 1-03 | Moderate | Execution-Track: mixed → code | Analysis frontmatter uses `code` correctly |
| 1-04 | Minor | @apply banned in v4 | Analysis Constraints explicitly bans `@apply` |

### Issues Carried Open (not yet resolved)
None — all fact-find issues resolved in analysis; 2-01 fixed by autofix this round; 2-02 resolved by validator flow.

### Autofix Summary
- Fix 1: Options Considered Option A Downside — replaced "slightly more verbose" with fidelity-risk statement

### Post-Fix Score
4.5 / 5.0 — credible. Proceed to validators.

---

## Round 3 — 2026-03-13 (plan.md)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Critical | TASK-01 Execution Plan Step 3, call site count | 4 additional non-button sites misclassified as `<button>`: `[lang]/page.tsx`, `cart/page.tsx`, `not-found.tsx` are Next.js `<Link>`; `admin/products/page.tsx` is `<a>`. Correct breakdown: 6 `<button>` + 5 `<Link>` + 1 `<a>`. Direct `<Button>` replacement would break navigation on 4 user-facing CTAs. |
| 3-02 | Major | TASK-01 Validation contract (TC-06) | TC-06 only covers shop filter toggles; 4 other asChild navigation sites not verified. Navigation regression would not be caught before commit. |
| 3-03 | Minor | TASK-01 Execution Plan Step 5, global.css deletion scope | "Delete lines 39–57" leaves orphaned empty `@layer components {}` wrapper (line 38 open, line 58 close). Should delete lines 38–58. |
| 3-04 | Minor | Constraints, Fact-Find Support | `--color-focus-ring` described as in "`:root` block" — actually inside `@media (prefers-color-scheme: dark) { :root:not(.theme-dark) { ... } }`. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Minor | Option A Downside understated | Resolved in analysis autofix (prior round) |
| 2-02 | Minor | Status "Draft" vs Planning Readiness "Go" | Resolved by validator flow |

### Issues Carried Open (not yet resolved)
None — all prior issues resolved; Round 3 issues resolved by autofix in this round.

### Autofix Summary
- Fix 1 (TASK-01 full section rewrite): Updated call site count from "10 `<button>` + 2 `<Link>`" to "6 `<button>` + 5 `<Link>` + 1 `<a>`"; added `<Button asChild>` guidance for all 6 non-button sites; added TC-07 for full navigation verification
- Fix 2 (point fix): Summary updated with verified element-type breakdown
- Fix 3 (point fix): Selected Approach Summary updated to reference 6 non-button sites
- Fix 4 (point fix): Fact-Find Support enumeration corrected
- Fix 5 (point fix): Constraints updated — deletion scope corrected to lines 38–58; `--color-focus-ring` provenance corrected to media-query block
- Fix 6 (point fix): Risks section updated — navigation breakage risk added; TC-07 referenced
- Fix 7 (point fix): Rehearsal Trace updated to reflect corrected site counts and TC-07
- Fix 8 (point fix): Decision Log updated to record Round 3 correction
- Consistency scan: 2 orphaned "lines 39–57" and "`:root` block" references cleaned up across Constraints, Fact-Find Support

### Post-Fix Score
4.5 / 5.0 — credible. Proceed to validators.
