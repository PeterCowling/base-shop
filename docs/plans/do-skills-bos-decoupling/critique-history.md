# Critique History: do-skills-bos-decoupling

## Round 1 — 2026-02-24

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Hypothesis & Validation Landscape (H2 row) | H2 stated as "not yet confirmed" / Medium confidence despite evidence being available; doc marked Ready-for-planning with open unconfirmed load-bearing assumption |
| 1-02 | Major | Planning Constraints & Notes | TASK-05 and TASK-06 listed as independently parallelizable; applying TASK-06 without TASK-05 leaves `startup-loop/SKILL.md:172` global invariant un-scoped, blocking DO advance permanently |
| 1-03 | Moderate | Hypothesis & Validation Landscape | Falsifiability Assessment subsection absent from H&V Landscape; template requires named falsifiability assessment for business-artifact track |
| 1-04 | Moderate | Confidence Inputs | Testability dimension missing from Confidence Inputs; lp-do-fact-find template specifies 5 dimensions including Testability |
| 1-05 | Moderate | Suggested Task Seeds (TASK-08) | Lane Transitions table in `_shared/stage-doc-integration.md` not included in TASK-08 scope; table references DO-skill-originated stage docs and will be stale after decoupling |
| 1-06 | Moderate | Evidence Gap Review — Remaining Assumptions | Remaining Assumptions section states H2 as Medium confidence after Confidence Adjustments section records it as confirmed — internal inconsistency |
| 1-07 | Minor | Scope Summary | Six DO skills listed but `lp-do-factcheck` has no tasks and no changes needed; scope wording "remove all BOS integration from the six DO-workflow skills" could mislead readers |
| 1-08 | Minor | Suggested Task Seeds (TASK-09) | `direct-inject` / `direct-inject-rationale` fields not identified for removal from `fact-find-planning.md` template; these fields are vestigial after BOS decoupling |

### Issues Confirmed Resolved This Round

None (first critique round).

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-03 | Moderate | 1 | Falsifiability Assessment subsection absent from H&V Landscape — not autofixed (requires substantive content addition by author; critique does not add content sections) |

### Autofix Summary

Autofixes applied this round (7 point fixes, 0 section rewrites):

| Fix | Issue | Action |
|---|---|---|
| AF-1 | 1-01 | Updated H2 row in Existing Signal Coverage table from "Not yet confirmed / Medium" to "Confirmed / High" with date and source |
| AF-2 | 1-04 | Added Testability dimension to Confidence Inputs at 90% with justification |
| AF-3 | 1-02 | Rewrote Planning Constraints parallelism note to flag TASK-05/TASK-06 coupling and reference `startup-loop/SKILL.md:172` |
| AF-4 | 1-05 | Expanded TASK-08 seed to include Lane Transitions table row removal |
| AF-5 | 1-08 | Expanded TASK-09 seed to include `direct-inject`/`direct-inject-rationale` field removal |
| AF-6 | 1-01 | Updated Confidence Adjustments to record H2 as confirmed (Evidence Gap Review section) |
| AF-7 | 1-05 | Added Lane Transitions table staleness risk row to Risks table |
| AF-8 (consistency) | 1-06 | Updated Remaining Assumptions section to reflect H2 confirmed status, removing internal inconsistency with Confidence Adjustments |

## Round 2 — 2026-02-24

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | Hypothesis & Validation Landscape | Missing required `Falsifiability Assessment` subsection for business-artifact track fact-find (carried from 1-03) |
| 2-02 | Major | Dependency & Impact Map / Key Modules | Non-skill dependents omitted (`feature-workflow-guide`, `agent-workflows`, `loop-output-contracts`, `rebuild-discovery-index.sh`), which understated blast radius |
| 2-03 | Major | Evidence Gap Review — Remaining Assumptions | Statement "No tooling outside `.claude/skills/` reads `Business-OS-Integration`/`Card-ID` from plan frontmatter" is false; `rebuild-discovery-index.sh` reads those fields from `docs/plans/*` |
| 2-04 | Moderate | Questions / Planning Readiness | Open-questions section labeled as user-input-needed while readiness state listed `Blocking items: none`, creating ambiguous execution posture |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-03 | Moderate | Falsifiability Assessment subsection absent | Added `#### Falsifiability Assessment` with easy/hard tests and validation seams |
| 2-02 | Major | Non-skill dependency set omitted from impact map | Added dependency rows and blast-radius notes; added TASK-10/TASK-11 to task seeds and rollout constraints |
| 2-03 | Major | Invalid external-tooling assumption | Replaced assumption with script-specific reality + evidence and added explicit risk/validation hooks |
| 2-04 | Moderate | Input-needed wording contradicted no-blockers readiness | Renamed section to `Open (Non-blocking Operator Confirmation)` and added explicit non-blocking note |

### Issues Carried Open (not yet resolved)

None.

### Autofix Summary

Autofixes applied this round (6 point fixes, 0 section rewrites):

| Fix | Issue | Action |
|---|---|---|
| AF-1 | 1-03 / 2-01 | Added `#### Falsifiability Assessment` section under Hypothesis & Validation Landscape |
| AF-2 | 2-02 | Expanded Key Modules / Dependency map with doc-contract and script dependents |
| AF-3 | 2-02 | Expanded Risks, Planning Constraints, Task Seeds, and Execution Routing with TASK-10/TASK-11 coverage |
| AF-4 | 2-03 | Rewrote Remaining Assumptions entry to reflect `rebuild-discovery-index.sh` dependency and associated degradation risk |
| AF-5 | 2-04 | Reframed open question heading to non-blocking and clarified default decision posture |
| AF-6 | 2-02 | Added non-skill evidence note in Evidence Gap Review and adjusted Impact confidence rationale |
| AF-7 (consistency) | AF pass cleanup | Removed duplicated `Impact` bullet introduced during point edits; kept `Impact: 85%` as canonical |
