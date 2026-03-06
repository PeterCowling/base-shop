# Critique History: xa-uploader-image-autosave-reliability

## Round 1 — 2026-03-04

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | TASK-01 through TASK-04 | All IMPLEMENT tasks missing required structural fields (Deliverable, Execution-Skill, Execution-Track, Effort, Status, Depends on, Blocks, Confidence breakdown, Validation contract, Execution plan, Planning validation, Scouts, Edge Cases, Rollout/rollback, Documentation impact) |
| 1-02 | Major | TASK-05 | Mistyped as IMPLEMENT — task is a validation/rollout checkpoint with no code output; should be CHECKPOINT |
| 1-03 | Major | Evidence section | Evidence line reference 461-464 off by one (actual range 461-463) |
| 1-04 | Moderate | TASK-01, TASK-02 | No consumer tracing for new queue state outputs (`pendingDraftRef`, `isAutosaveDirty`) — missing documentation of what reads these values |
| 1-05 | Moderate | TASK-02 | Merge strategy underspecified — "reload/merge/retry once for image path fields" but no detail on how pipe-delimited fields are merged or what happens to non-image fields |
| 1-06 | Moderate | Frontmatter + Plan Gates | Auto-Build-Intent: plan-only contradicts Plan Gates: Auto-build eligible: Yes |
| 1-07 | Minor | Plan body | Missing `## Inherited Outcome Contract` section required by plan template |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| (none — first round) | | | |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| (none — all issues from Round 1 addressed in autofix) | | | |

### Autofix Summary
- 1 section rewrite (Tasks section: TASK-01 through TASK-05 rewritten with full structural fields)
- 4 point fixes (TASK-05 type in summary table, Auto-Build-Intent frontmatter, evidence line range, Inherited Outcome Contract section added)
- 1 consistency cleanup (Overall-confidence Calculation updated to exclude CHECKPOINT from weighted average)
- All 7 issues addressed in this round

## Round 2 — 2026-03-04

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | TASK-02 Merge strategy | Planned 409 merge used independent field unions for `imageFiles`, `imageRoles`, `imageAltTexts`, which can break tuple alignment and corrupt role/alt pairing |
| 2-02 | Major | TASK-03 Execution plan | Status derivation depended on refs-only signals (`busyLockRef` / `pendingDraftRef`), which are non-reactive and can fail to render `unsaved` transitions |
| 2-03 | Moderate | Task Summary + TASK-02 block map | Dependency map was inconsistent (`TASK-02` blocked `TASK-03` while `TASK-03` did not depend on `TASK-02`) |
| 2-04 | Moderate | TASK-02 Affects + consumer tracing | Signal wiring path to `CatalogSyncPanel` omitted `CatalogConsole.client.tsx`, leaving an incomplete implementation path |
| 2-05 | Moderate | TASK-05 deliverable/planning validation | Checkpoint task referenced `/lp-do-replan` in deliverable text, conflicting with `/lp-do-build` checkpoint execution |
| 2-06 | Moderate | Inherited Outcome Contract | Outcome contract fields remained `TBD`, weakening decision traceability |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Major | Tuple alignment risk in conflict merge | Replaced field-wise union with tuple-preserving merge keyed by normalized image path and deterministic rehydration of all three fields |
| 2-02 | Major | Refs-only status derivation | Rewrote TASK-03 plan to derive `autosaveStatus` from React state signals |
| 2-03 | Moderate | Dependency inconsistency | Aligned sequencing by making `TASK-03` depend on `TASK-02` and restoring `TASK-02` block coverage for `TASK-03`/`TASK-04` |
| 2-04 | Moderate | Missing wiring path | Added `CatalogConsole.client.tsx` to TASK-02/TASK-03 affected files and consumer tracing |
| 2-05 | Moderate | `/lp-do-replan` wording drift | Updated TASK-05 deliverable/planning validation to `/lp-do-build` checkpoint wording |
| 2-06 | Moderate | `TBD` outcome contract | Filled `Why`, `Intended Outcome Type`, `Intended Outcome Statement`, and source |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| (none) | | | |

### Autofix Summary
- 0 section rewrites
- 9 point fixes across Task Summary, TASK-02, TASK-03, TASK-04, TASK-05, Risks, and Inherited Outcome Contract
- 1 consistency cleanup (updated stale TC text to tuple-preserving wording + `isAutosaveDirty` signal in TASK-02 validation contract)
- All 6 issues addressed in this round
