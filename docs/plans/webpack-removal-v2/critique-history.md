# Critique History: webpack-removal-v2

## Round 1 — 2026-02-21

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Confidence Inputs: Implementation | Confidence inflated at 85% with unverified primary gate Q1; reduced to 72% |
| 1-02 | Moderate | Scope: Summary | Missing explicit benefit/motivation statement for the migration |
| 1-03 | Moderate | Questions: Open Q1 | No contingency plan if Q1 answer is NO |
| 1-04 | Moderate | Evidence Audit: Patterns & Conventions | `resolve.fallback` evidence missing source-code comment citation (line 148) |
| 1-05 | Moderate | Evidence Audit: Key Modules | `postbuild` script (`generate-public-seo.ts`) not assessed for Turbopack compatibility |
| 1-06 | Minor | CI reference | CI build step label says "Turbopack" but command uses webpack (not a doc defect; noted for implementation awareness) |

### Issues Confirmed Resolved This Round
(none — first round)

### Issues Carried Open (not yet resolved)
(none — first round)

### Autofix Applied
- 1-01: Implementation reduced 85% → 72%, Approach reduced 80% → 75%; Evidence Gap Review updated to match
- 1-02: Benefit statement added to Scope > Summary
- 1-03: Contingency clause added to Q1 open question
- 1-04: Source-code comment cited and nuance explained in Patterns & Conventions
- 1-05: `postbuild` script added to Key Modules list; new risk row added to Risks table; Delivery-Readiness "To reach >=80" updated
- 1-06: Not autofixed (CI file is out of scope for fact-find edits)

## Round 2 — 2026-02-21

**Target:** `docs/plans/webpack-removal-v2/plan.md`

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Moderate | TASK-03: Edge Cases | Inherited `sharedConfig.webpack` after callback removal sets `@` → `template-app/src` under manual `next build` without `--turbopack`; risk unacknowledged |
| 2-02 | Moderate | Option B Rationale | Rollback rationale misleading — webpack callback is ignored under `--turbopack`, so "revert TASK-03 only" provides validation granularity, not rollback flexibility |
| 2-03 | Moderate | TASK-01: Acceptance | TASK-01 validates locally but CI environment may differ (env vars, caching); no CI validation step |
| 2-04 | Minor | TASK-05: Confidence | TASK-05 confidence 85% exceeds fact-find baseline (75%) by 10 points without new evidence beyond plan decomposition |
| 2-05 | Minor | Frontmatter | Missing `Last-reviewed` field (repo metadata policy) |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | Confidence inflated at 85% | Plan uses corrected fact-find baselines; task confidence scored independently with evidence |
| 1-02 | Moderate | Missing benefit/motivation statement | Plan Summary inherits corrected fact-find benefit statement |
| 1-03 | Moderate | No Q1 contingency | Plan TASK-01 has explicit go/no-go gate with scope-death contingency |
| 1-04 | Moderate | resolve.fallback citation missing | Plan TASK-03 references correct evidence from corrected fact-find |
| 1-05 | Moderate | postbuild script unassessed | Plan TASK-05 includes postbuild verification in acceptance criteria |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-06 | Minor | 2 | CI build step label says "Turbopack" but command uses webpack (implementation awareness, out of scope for docs) |

### Autofix Applied
- 2-01: Added `sharedConfig.webpack` inheritance edge case to TASK-03 Edge Cases section and new risk row to Risks table
- 2-02: Reframed Option B rationale from "rollback flexibility" to "validation granularity"
- 2-03: Added CI validation note to TASK-01 Notes/References
- 2-04: Added guardrail exception justification to TASK-05 confidence note
- 2-05: Not autofixed (frontmatter metadata is a style/standards item; user can add at commit time)

## Round 3 — 2026-02-21

**Target:** `docs/plans/webpack-removal-v2/plan.md` (re-critique after Round 2 autofix)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Minor | Fact-find line 45 (cross-doc) | "26 lines" should be "27 lines" — range 136–162 is 27 lines inclusive; plan correctly says 27 |
| 3-02 | Minor | Frontmatter | Missing `Relates-to charter` field (AGENTS.docs.md requires it; plan template omits it) |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Moderate | Inherited `sharedConfig.webpack` unacknowledged | TASK-03 Edge Cases section now documents the inheritance, impact, and mitigation |
| 2-02 | Moderate | Option B rationale misleading | Reframed from "rollback flexibility" to "validation granularity" |
| 2-03 | Moderate | TASK-01 CI validation gap | Notes now include "push draft PR promptly to validate in CI" |
| 2-04 | Minor | TASK-05 confidence exceeds fact-find baseline | Guardrail exception documented with domain-independence justification |
| 1-06 | Minor | CI build step label misleading | TASK-02 Green step 5 explicitly fixes the label during execution |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 2-05 | Minor | 3 | Missing `Last-reviewed` frontmatter |

### Autofix Applied
- 3-01: Fact-find line 45 changed "26 lines" → "27 lines"
- 3-02: Added `Relates-to charter: none` to plan frontmatter
- 2-05: Added `Last-reviewed: 2026-02-21` to plan frontmatter (resolves carried issue)
