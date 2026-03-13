# Critique History: reception-bar-bleeper-bugs

## Round 2 — 2026-03-13 (analysis.md)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Moderate | Options Considered (Option C); Planning Handoff | Bug 3+6 coupling claim incorrect — Go/Bleep toggle is in `PayModal.tsx` (independent of bleep # field); Go mode works after Bug 3 alone. Option C rejection rationale rewritten. |
| 2-02 | Moderate | End-State Operating Model | "Leave empty for Go" claim wrong — empty bleep # field in bleep mode auto-assigns a bleeper; Go is selected via PayModal toggle. Row corrected. |
| 2-03 | Minor | Planning Handoff | "Functionally dependent" sequencing note corrected to "UX completeness" coupling. |

### Issues Confirmed Resolved This Round (via autofix)
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Moderate | Bug 3+6 coupling claim | Options Considered row, Constraints, and Planning Handoff corrected to reflect PayModal independence |
| 2-02 | Moderate | End-State bleep # "leave empty for Go" | Row rewritten to describe field as bleep-mode control; Go mode via modal toggle noted |
| 2-03 | Minor | Sequencing note "functionally dependent" | Corrected to "UX completeness" coupling |

### Issues Carried Open (not yet resolved)
None.

### Post-Autofix Score
Pre-autofix score: 4.0 / 5.0
Post-autofix score: 4.5 / 5.0
Critical remaining: 0
Verdict: credible
Severity distribution remaining: 0 Critical / 0 Major / 0 Moderate / 0 Minor open

---

## Round 3 — 2026-03-13 (plan.md)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Minor | TASK-02 Acceptance + Execution plan | `firstAvailableBleeper` cleanup not mentioned in TASK-02 — TypeScript unused-variable error if not removed from `useBleepersData` destructuring after useEffect deletion |
| 3-02 | Minor | TASK-07 TC-07 test mechanism | "querySelectorAll li" approach insufficient for React key stability verification; replaced with `crypto.randomUUID` spy approach |

### Issues Confirmed Resolved This Round (via autofix)
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Minor | `firstAvailableBleeper` cleanup | Added to TASK-02 Acceptance and Execution plan |
| 3-02 | Minor | TC-07 test mechanism | Test approach updated to spy on `crypto.randomUUID` |

### Issues Carried Open (not yet resolved)
None.

### Post-Autofix Score
Pre-autofix score: 4.0 / 5.0
Post-autofix score: 4.5 / 5.0
Critical remaining: 0
Verdict: credible
Severity distribution remaining: 0 Critical / 0 Major / 0 Moderate / 0 Minor open

---

## Round 1 — 2026-03-13

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Critical | Bug 4 evidence + fix approach | Preorder night keys are ordinal strings (`night1/night2`), NOT date strings. Proposed `occPre[todayKey]` lookup would silently fail for all occupants. |
| 1-02 | Major | Bug 3 evidence description | Two factual errors: `finalBleep` described as initialised to `bleepNumber` value (actual: hardcoded `"go"`); `chooseNext()` described as called "unconditionally" (actual: called inside `if (usage === "go")`). Fix direction was correct. |
| 1-03 | Major | Open Questions | Preorder date format flagged as operator-input-required but was agent-resolvable from `preorderData.ts`. |
| 1-04 | Moderate | Risks table | Bug 4 fix complexity (signature change + useMemo restructuring) and `checkInDate` optionality not mentioned. |
| 1-05 | Minor | Bug 4 adjacency | `buildRow` plan display (lines 220-224) has same first-night-only bug. |

### Issues Confirmed Resolved This Round (via autofix)
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Critical | Wrong preorder key format assumption | Fact-find Bug 4 evidence + fix approach rewritten: keys are `night1/night2`, fix uses `getNightIndex`/`addDays` with `checkInDate` param |
| 1-02 | Major | Bug 3 description errors | Corrected: `finalBleep` starts as `"go"` (hardcoded); `chooseNext()` called inside `if (usage === "go")` block |
| 1-03 | Major | Agent-resolvable deferral | Resolved Q moved to Resolved section with `preorderData.ts` evidence |
| 1-04 | Moderate | Missing Bug 4 risk | Risk table updated with `isEligibleForPreorder` signature change + `checkInDate` optionality |
| 1-05 | Minor | buildRow plan display bug | Noted in TASK-04 seed |

### Issues Carried Open (not yet resolved)
None.

### Post-Autofix Score
Pre-autofix score: 3.5 / 5.0
Post-autofix score: 4.5 / 5.0
Critical remaining: 0
Verdict: credible
Severity distribution remaining: 0 Critical / 0 Major / 0 Moderate / 0 Minor open
