# Critique History: codex-project-doc-and-skills-alignment

## Round 1 — 2026-02-28

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | All IMPLEMENT tasks | No validation contracts (VC-/TC-) on any of 7 IMPLEMENT tasks — score cap triggered |
| 1-02 | Major | All IMPLEMENT tasks | No Red/Green/Refactor execution plan on any task |
| 1-03 | Major | All IMPLEMENT tasks | Missing Deliverable, Execution-Skill, Affects, Rollout/rollback fields on all tasks |
| 1-04 | Moderate | TASK-03 Scope | Option B (AGENTS.override.md) escape hatch contradicts Decision Log rejection of Option B |
| 1-05 | Moderate | TASK-04 Scope | Implementation method unspecified — "populate entries" ambiguous between symlinks and copies |
| 1-06 | Moderate | TASK-07 Acceptance | AGENTS size check thresholds absent (no warn/fail byte values) |
| 1-07 | Moderate | Constraints & Assumptions / Why Original Wouldn't Work §1 | Keystone claim (fallback not additive) cited to external source file not verifiable in repo |
| 1-08 | Moderate | Risks & Mitigations | Pointer-following assumption unaddressed — TASK-01 trimming assumes Codex follows content pointers |
| 1-09 | Moderate | Constraints & Assumptions | .codex/config.toml trust model assumption not stated |
| 1-10 | Minor | Task Summary / Parallelism Guide | TASK-08 missing TASK-06 from explicit dependency list in both tables |
| 1-11 | Minor | All IMPLEMENT tasks | Confidence scores have no evidence citations |

### Issues Confirmed Resolved This Round
None (first critique round).

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-07 | Moderate | 1 | Keystone claim (fallback not additive) still unverifiable from repo — needs live Codex session test |
| 1-11 | Minor | 1 | Confidence scores lack evidence citations — addressed with "What would make this >=90%" notes but no direct citations |

### Autofix Summary
- Applied 11 fixes: 7 full section rewrites (all IMPLEMENT tasks), 1 section rewrite (Risks & Mitigations), 3 point fixes (Constraints/Assumptions trust model note, Task Summary TASK-08 dependency, Parallelism Guide TASK-08 dependency).
- Consistency scan: 1 cleanup edit (Parallelism Guide wave 4 dependency list aligned to Task Summary).
- Issues 1-01, 1-02, 1-03 resolved by task rewrites.
- Issues 1-04, 1-05, 1-06 resolved by targeted scope/acceptance fixes within rewrites.
- Issues 1-08, 1-09 resolved by Risks & Mitigations additions and Assumptions note.
- Issue 1-10 resolved by Task Summary and Parallelism Guide fixes.
- Issues 1-07 and 1-11 carried open (require external verification or operator input).

---

## Round 2 — 2026-02-28 (External Reviewer Findings)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Medium | TASK-01 Scope + Red state | Byte math stale: Skills section ~7 KiB was incorrect; actual is ~16,354 bytes — secondary cut of `## User-Facing Step-by-Step Standard` not required |
| 2-02 | Low | TASK-04 Deliverable/Affects/VC-04/Green; TASK-06 VC-06/Green | Hardcoded skill count "76" conflicts with plan's own "no brittle static counts" goal |
| 2-03 | Low | TASK-07 Scope + VC-07 | CI gate thresholds too loose — hard fail at 32,768 allows 8 KiB drift above TASK-01's 24,576 durable target |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-07 | Moderate | Keystone claim (fallback not additive) unverifiable from repo | Empirically verified via Codex CLI 0.105.0 live test; Assumptions §1, Why Original §1, and Decision Log all updated to note verification |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-11 | Minor | 2 | Confidence scores lack evidence citations — "What would make this >=90%" notes present but no direct citations |

### Autofix Summary
- Applied 9 fixes: 2 scope/Red state rewrites (TASK-01 byte math), 5 VC/Green/Deliverable/Affects point fixes removing hardcoded "76" (TASK-04 × 4, TASK-06 × 1), 2 threshold point fixes in TASK-07 Scope + VC-07.
- Consistency scan: Decision Log third entry added; Overall-confidence frontmatter and calculation note corrected (86% → 85%, "conservative ceiling" qualifier removed).
- Issue 1-07 confirmed resolved.
- Issues 2-01, 2-02, 2-03 resolved by these fixes.
- Issue 1-11 carried open (Minor; operator input needed to cite evidence for confidence scores).
