---
Type: Plan
Status: Active
Domain: Repo
Last-reviewed: 2026-02-23
Relates-to charter: none
---

# Critique History: turbopack-full-migration

## Active tasks
No active tasks; this document records critique rounds only.

## Round 3 — 2026-02-23

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Major | Questions / Planning Readiness | Script inventory was stale (`26/13`) while repo state was `28/14`, which weakens planning inputs and migration wave sizing |
| 3-02 | Moderate | Fact-Find sections | Missing explicit `## Risks` section reduced decision-grade risk visibility |
| 3-03 | Moderate | Confidence Inputs | Implementation confidence rationale overstated inventory completeness despite observable drift |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Major | TASK-07 confidence premature | Plan now marks TASK-07 as `75%*` provisional and expands parity evidence expectations |
| 2-02 | Moderate | TASK-04 TC-01 targeted wrong package | Validation command is now `pnpm -w test -- --testPathPattern=next-webpack-flag-policy` |
| 2-03 | Moderate | TASK-07 effort underestimated | TASK-07 effort is now `M` and includes callback complexity detail |
| 2-04 | Moderate | Confidence uniformity in task summary | High-risk callback task confidence is now differentiated (`75%*`) from lower-risk tasks |
| 2-05 | Moderate | Missing callback-equivalent risk | Plan `Risks & Mitigations` now includes explicit "No Turbopack equivalent" risk |
| 2-06 | Minor | Fact-find contained corrupted evidence output | Fact-find now contains clean sections only; no embedded gate-output artifact remains |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-01 | Moderate | 3 | Storybook in-scope/out-of-scope decision needed (tracked as decision gate) |

### Autofix Applied This Round
- Fact-find script inventory refreshed to current repo evidence (`28` package-script commands across `14` apps, including `caryina`)
- Questions section updated with concrete command evidence for current inventory snapshot
- Planning Readiness key input updated to match refreshed script inventory
- Added explicit `## Risks` section with likelihood/impact/mitigations for migration-critical risks
- Confidence Inputs (`Implementation`) recalibrated from `85%` to `80%` with drift-aware rationale

---

## Round 2 — 2026-02-23

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | TASK-07 Confidence | Confidence 85% premature — callback migration scope unknown until TASK-02 completes; CMS callback ~174 lines with unverified Turbopack parity |
| 2-02 | Moderate | TASK-04 TC-01 | Validation command `pnpm --filter @apps/brikette test` targets wrong package for root-level test file |
| 2-03 | Moderate | TASK-07 Effort | S-effort underestimate — 9 config files with heterogeneous callbacks (CMS alone ~174 lines) |
| 2-04 | Moderate | Task Summary | Confidence uniformity — all IMPLEMENT tasks at 85% despite different risk profiles |
| 2-05 | Moderate | Risks & Mitigations | Missing risk: "No Turbopack callback equivalent" — primary technical risk for TASK-07 |
| 2-06 | Minor | Fact-Find Reference | Fact-find document contains embedded validation-gate output (corrupted evidence) |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| (none from Round 1 resolved) | | | |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-01 | Moderate | 2 | Storybook in-scope/out-of-scope decision needed (TASK-01 is the resolution gate) |

### Autofix Applied This Round
- TASK-07: Full section rewrite — confidence lowered to 75%*, effort changed to M, callback complexity enumerated, acceptance criteria expanded, planning validation added, "What would make this >=90%" strengthened
- TASK-04 TC-01: Corrected from `pnpm --filter @apps/brikette test` to `pnpm -w test -- --testPathPattern=next-webpack-flag-policy`
- Task Summary: TASK-07 row updated to 75%*/M
- Risks & Mitigations: Added "No Turbopack callback equivalent" risk with mitigation
- Overall-confidence: Recalculated from 87.2% to 85.0% (effort-weighted with TASK-07 at 75%×2)
- Frontmatter: Overall-confidence updated to 85.0%

---

## Round 1 — 2026-02-23

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Questions / Open | Storybook scope remains unresolved; keep as first planning gate before execution waves. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| none | none | none | none |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-01 | Moderate | 1 | Storybook in-scope/out-of-scope decision needed for full-migration definition. |
