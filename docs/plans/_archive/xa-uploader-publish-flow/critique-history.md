# Critique History: xa-uploader-publish-flow

## Round 1 — 2026-03-07 (Fact-Find critique)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Evidence Audit > Dependency & Impact Map | `applyCloudMediaExistenceValidation` absent from upstream dependency chain; omitting it in TASK-01 would publish dangling image references |
| 1-02 | Moderate | Questions > Open | "Take Offline" question deferred to operator despite agent having documented a default assumption and reasoning that resolves it |
| 1-03 | Moderate | Risks table | Save-before-publish partial failure window not identified; product could appear "live" in uploader but not published |
| 1-04 | Minor | Evidence Audit > Key Modules | `SyncPayload` coupling of `runCloudSyncPipeline` not acknowledged; extraction path harder than stated |
| 1-05 | Minor | Evidence Audit > Dependency Map | `finalizeCloudPublishStateAndDeploy` call chain (includes `writeCloudDraftSnapshot` + `reconcileDeployPendingState`) omitted |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| — | — | No prior critique | First round |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| — | — | — | No prior issues |

### Autofix Applied This Round
- 1-01: Added `applyCloudMediaExistenceValidation` and full pipeline sequence to Dependency & Impact Map; updated Key Modules preferred approach to direct-helpers path.
- 1-02: Moved "Take Offline" question from Open to Resolved section with agent-resolved answer.
- 1-03: Added save-before-publish risk row to Risks table; updated API/contracts to reflect combined-route approach.
- 1-04: Noted `SyncPayload` coupling in Key Modules; preferred approach set to direct-helpers.
- 1-05: Expanded Dependency Map to include `finalizeCloudPublishStateAndDeploy` with `writeCloudDraftSnapshot` + `reconcileDeployPendingState`.
- Consistency scan: 3 cleanup edits applied (`Data & Contracts` API contract description, `Blast Radius` StatusSelect note, `Testability Assessment` mock list).

### Final Verdict This Round
- Score: 4.0/5.0
- Verdict: credible
- Recommended action: proceed to `/lp-do-plan xa-uploader-publish-flow`

---

## Round 2 — 2026-03-07 (Plan critique)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | TASK-01 Affects | Phantom file `draftSyncLock.ts` listed as readonly dep; lock functions live in `catalogDraftContractClient.ts:314,372` |
| 2-02 | Major | TASK-01 Acceptance | Save-before-publish ordering: acceptance said "saves to R2 first" — contradicts combined-route rationale; reintroduces partial-failure window |
| 2-03 | Moderate | TASK-01 Scouts + Notes | Scout and "What would make this >=90%" still referenced `draftSyncLock.ts`; Notes lacked lock function line references |
| 2-04 | Minor | TASK-03 Acceptance | `onPublish()` call missing optional chain (`?.`) despite prop being marked optional |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Moderate | `applyCloudMediaExistenceValidation` absent from dependency chain | Included in TASK-01 pipeline and extraction scope in plan |
| 1-02 | Moderate | "Take Offline" deferred to operator | Moved to Resolved in fact-find; plan Non-goals cover it explicitly |
| 1-03 | Moderate | Save-before-publish risk not identified | Added to Risks & Mitigations; combined-route design eliminates the window |
| 1-04 | Minor | `SyncPayload` coupling not acknowledged | Noted in fact-find extraction scope; plan prefers direct-helpers path |
| 1-05 | Minor | `finalizeCloudPublishStateAndDeploy` call chain omitted | Included in TASK-01 pipeline and Notes/references |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| — | — | — | No prior plan issues |

### Autofix Applied This Round
- 2-01: Replaced `draftSyncLock.ts` with `catalogDraftContractClient.ts` in TASK-01 Affects.
- 2-02: Rewrote TASK-01 Acceptance save-ordering bullet to in-memory-first approach; updated TASK-01 Edge Cases to match (no pre-publish R2 write).
- 2-03: Updated TASK-01 Scouts (removed phantom file reference), "What would make this >=90%", and Notes/references (added `:314`/`:372` entries). Fixed Rehearsal Trace TASK-01 row.
- 2-04: Updated TASK-03 Acceptance `onPublish?.()` with optional-chain and clarification.
- Consistency scan: 1 additional cleanup edit (Edge Cases & Hardening TASK-01 pre-publish-R2-write contradiction reconciled).

### Final Verdict This Round
- Score: 4.0/5.0
- Verdict: credible
- Recommended action: proceed to `/lp-do-build xa-uploader-publish-flow`
