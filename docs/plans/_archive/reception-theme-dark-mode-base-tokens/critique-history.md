---
Type: Critique-History
Status: Archived
Feature-Slug: reception-theme-dark-mode-base-tokens
---

# Critique History: reception-theme-dark-mode-base-tokens

## Round 1 — 2026-03-08

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | TASK-01 Confidence / Impact rationale | `pnpm tokens:contrast:check` does not check `fg-muted on surface-2`; only checks `fg-muted on bg` at 3.0:1. Plan implied the tool would catch all fg-muted WCAG issues. |
| 1-02 | Moderate | TASK-01 Edge Cases | Gitignore uncertainty for tokens.css is dead weight — file is tracked in git (git status: `M packages/themes/reception/tokens.css`). |
| 1-03 | Minor | TASK-01 Affects list | `[readonly] scripts/src/themes/contrast-verify.ts` was listed instead of the authoritative CI tool `scripts/src/tokens/validate-contrast.ts`. |
| 1-04 | Minor | TASK-01 Acceptance | Token count "17 dark token changes" is correct but worth confirming surface-1 and bg are counted separately (they share same OKLCH dark value currently but will diverge). |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Moderate | fg-muted on surface-2 not checked by tool | Added explicit documentation in Impact=80 rationale: tool only checks fg-muted on bg; manual estimate ~3.9:1 on surface-2 passes 3.0:1 large-text threshold by design |
| 1-02 | Moderate | Gitignore uncertainty | Edge case text replaced with definitive statement: tokens.css IS tracked in git |
| 1-03 | Minor | Wrong contrast script in Affects | Changed to `[readonly] scripts/src/tokens/validate-contrast.ts` |

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-04 | Minor | 1 | Token count "17" — surface-1 and bg diverge (currently same value); verify count is correct in TASK-01 execution |

### Verdict

Credible — score 4.0. No Critical or Major findings. 3 of 4 issues resolved by autofix in Round 1. One Minor carried open (token count verification during execution).

## Round 2 — 2026-03-08

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | Summary / Non-goals / Scope claim | Plan still treats the styling problem as "purely token values" and says archetype work is already done, but the broader reception cohesion fact-find identified shell drift across many routes as the primary remaining problem. |
| 2-02 | Major | CHECKPOINT-01 / Rollout | Plan instructed a direct production `wrangler deploy`, which conflicts with repo branch-flow policy (`dev` -> `staging` -> `main`). |
| 2-03 | Major | TASK-02 Execution | Plan assumed row styling could be added without changing existing row background logic, but `BookingRow` already has `hover:bg-surface-2` and `CheckoutTable` already hardcodes zebra rows via `rowBg`. |
| 2-04 | Moderate | Non-goals vs Decision Log | Light-mode handling was internally inconsistent: non-goals said update light values, decision log said preserve them. |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-02 | Major | Direct production deploy step violated repo policy | CHECKPOINT-01 now routes through normal branch flow instead of direct `wrangler deploy` |
| 2-03 | Major | TASK-02 ignored existing row background classes | TASK-02 now explicitly replaces conflicting `hover:bg-surface-2` / `rowBg` logic rather than pretending styling is additive |
| 2-04 | Moderate | Light-mode guidance contradicted itself | Non-goals and Decision Log now both say to preserve existing light values except for required paired additions |

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-04 | Minor | 2 | Token count "17" — surface-1 and bg diverge (currently same value); verify count is correct in TASK-01 execution |
| 2-01 | Major | 1 | Core scope thesis still says token-only fix, despite broader evidence that reception cohesion problems remain architectural across many routes |

### Verdict

Partially credible — score 3.3. Execution details improved, but the plan still carries a load-bearing scope error: it frames the remaining reception problem as token-only when the broader route-level evidence says shell cohesion is still unfinished.

## Rehearsal Pass — 2026-03-08

Post-critique forward rehearsal trace (reading actual source files, not inferring from plan).

### Issues Found and Fixed This Pass

| ID | Severity | Target | Summary | Fix Applied |
|---|---|---|---|---|
| R-01 | Minor | Risks table | "tokens.css is gitignored" risk entry survived both prior rounds despite being definitively resolved in Round 1 (1-02). Contradicted Constraints section which already states tokens.css IS tracked. | Removed stale risk row from table |
| R-02 | Minor | TASK-02 Edge Cases | ThreadList.tsx has 5 bg-surface-2 usages; plan said "replace selected/hover classes" but no edge case note guarded against accidental global replace of the 4 structural/decorative bg-surface-2 usages (section container, count badge, empty-state icon, channel label badge). Only the isSelected ternary on `<button>` is in scope. | Added explicit scope guard note to TASK-02 Edge Cases |

### Issues Confirmed Resolved This Pass

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Major | Core scope thesis still said token-only fix | Plan rewritten with explicit "follow-on" framing in Summary, Non-goals, Inherited Outcome Statement, and Fact-Find Reference. Scope overclaim gone. |
| 1-04 | Minor | Token count "17" — surface-1 and bg diverge (currently same value) | Both are in fact separate entries in the proposed token table; count confirmed at 17. Mark resolved. |

### Verdict

Credible — score 4.2. All Major issues resolved. Two Minor issues found and fixed in this rehearsal pass. Plan is ready for build execution.
