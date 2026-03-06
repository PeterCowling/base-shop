# Critique History: xa-uploader-sync-status-communication

## Round 1 — 2026-03-06

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | TASK-01/02/03 TC contracts | TC-01/02/03 listed only typecheck+lint; no test execution gate despite explicit Red→Green test steps in each execution plan |
| 1-02 | Major | TASK-01 Acceptance Criteria | `publishState: "live"` → display label mapping unspecified; mid-build design decision risk |
| 1-03 | Major | "What Would Make >=90%" | Three deferred items were unresolved before-build prerequisites, not post-build refinements: sidebar hint decision, `workflowLive` copy audit, status strip layout |
| 1-04 | Moderate | TASK-01 Acceptance Criteria / catalogWorkflow.ts | `missingRoles: string[]` not currently exported from `CatalogDraftWorkflowReadiness`; plan claimed "exposes exact blockers" without specifying the new field |
| 1-05 | Moderate | TASK-03 Acceptance Criteria | Autosync coalescing mechanism underspecified — no statement of whether debounce, lock check, or ref guard is used |
| 1-06 | Moderate | TASK-01 Affects | `route.ts` not listed even as `[readonly]`; file sets `publishState: "live"` and is an intentional scope-out |
| 1-07 | Minor | TASK-02 Affects | `route.branches.test.ts` (backend test) included in a UI-only task without explanation |

### Issues Confirmed Resolved This Round

None (first round).

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-07 | Minor | 1 | `route.branches.test.ts` in TASK-02 Affects unexplained — left in place pending TASK-02 execution; may be needed if response-shape gap discovered |
