# Critique History: reception-rbac-pin-user-roles

## Round 1 — 2026-02-27

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | TASK-01 Validation contract / Execution plan | TC-03 ("existing tests unaffected") is vacuously satisfied — test harness sets `VITE_USERS_JSON`, not `NEXT_PUBLIC_USERS_JSON`; all existing tests exercise an empty user object. New test must use schema direct-import; extending `loadUtil` is prohibited. |
| 1-02 | Major | TASK-01 Scouts / Execution plan | Scout "confirm it is exported or accessible" was unresolved. Confirmed by source read: `userRolesSchema` is a non-exported module-level const — in scope for schema extension (same file), but not importable in tests. Scout resolved; test approach confirmed as schema direct-import via `usersRecordSchema`. |
| 1-03 | Moderate | Risks & Mitigations | `OPERATIONS_ACCESS` in `roles.ts` excludes `admin` and `manager` — Cristiana (`["admin"]`) cannot access basic operations features that `["staff"]` users can. Not in risk table. |
| 1-04 | Moderate | Risks & Mitigations | Firebase profile role population is a prerequisite for RBAC to be effective at runtime (device PIN quick-unlock re-hydrates from Firebase, not `NEXT_PUBLIC_USERS_JSON`). Not acknowledged as a risk or prerequisite. |
| 1-05 | Moderate | TASK-02 Validation contract | TC-02 ("each parsed user has non-empty roles") is a manual verification step with no automated path and no stated owner or timing. Non-blocking given local-only config change, but VC is not self-evidently executable. |
| 1-06 | Minor | Fact-find (informational) | `ROOM_ALLOCATION` listed in fact-find as `owner, developer` only; `roles.ts` (confirmed) grants it to `["owner", "developer", "admin", "manager"]`. Error is in fact-find, not plan, and does not affect plan tasks. |
| 1-07 | Minor | Decision Log | Alessandro role confidence stated as "likely but operator should confirm" in fact-find; plan's decision log does not include Alessandro. Assignment is unambiguous but log is incomplete relative to fact-find uncertainty statement. |

### Issues Confirmed Resolved This Round

None (first critique round).

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-05 | Moderate | 1 | TASK-02 TC-02 is manual verification only — no automated path or stated owner |

### Autofix Summary

- Issues 1-01 and 1-02: Resolved by full TASK-01 section rewrite. TC-03 reclassified as vacuous/non-diagnostic. Mandatory schema direct-import test strategy with required code structure added to execution plan. Scout closed as resolved.
- Issue 1-03: Resolved by new "OPERATIONS_ACCESS anomaly" entry in Risks & Mitigations.
- Issue 1-04: Resolved by new "Firebase profile roles not populated" entry in Risks & Mitigations.
- Simulation trace TASK-01 row updated from "Minor" to "Major (mitigated)" with resolution note.
- Issues 1-05, 1-06, 1-07: Not fixed (1-05 is Moderate / low-risk for local config; 1-06 is in fact-find, not plan; 1-07 is Minor omission in decision log only).
