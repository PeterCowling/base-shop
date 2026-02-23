---
Type: Schema-Contract
Status: Active
Version: 1.0.0
Domain: Venture-Studio
Workstream: Feature-Development
Created: 2026-02-22
Last-updated: 2026-02-22
Owner: startup-loop maintainers
Related-plan: docs/plans/startup-loop-standing-info-gap-analysis/plan.md
---

# Loop Output Contracts

## Purpose

Formal artifact contracts for the four documents produced by the feature development loop (`/lp-do-fact-find` → `/lp-do-plan` → `/lp-do-build` → operator review). Each contract defines the canonical path, producer skill, required sections, frontmatter fields, lifecycle, and consumer list.

These contracts close two feedback paths:
- **Layer B → Layer A feedback**: the `results-review.user.md` artifact carries observed outcomes back into standing-information layer (Layer A), completing the loop as specified in `docs/business-os/startup-loop/two-layer-model.md`.
- **Skill handoff integrity**: each artifact is the single authoritative input to its downstream consumer. Consumers MUST read from the canonical path defined here.

Skills MUST NOT store outputs at ad-hoc paths. All four artifacts use the path namespace `docs/plans/<feature-slug>/`.

---

## Artifact 1: `fact-find.md`

**Artifact ID:** `fact-find`
**Produced by:** `/lp-do-fact-find`
**Stored at:** `docs/plans/<feature-slug>/fact-find.md`
**Consumers:** `/lp-do-plan`

### Required Sections

| Section | Purpose |
|---|---|
| `## Scope` | Precise statement of what was investigated: feature area, location anchors, and what is explicitly out of scope. |
| `## Evidence Audit` | Key files, modules, routes, or data artefacts examined. Max 10 primary entries. Stale evidence flagged with `[stale]`. |
| `## Confidence Inputs` | Scored confidence dimensions feeding the planning phase (complexity, risk, unknowns). Each entry includes rationale and a verification path for unknowns. |
| `## Planning Readiness` | Go / No-go call. If `No-go`: list unresolved blockers with minimal verification paths. If `Go`: summarise the recommended deliverable type and execution skill. |

Additional sections produced by the fact-find template (`## Evidence Gap Review`, `## Open Questions`, `## Risk Inventory`) are permitted but the four above are mandatory minimums.

### Required Frontmatter Fields

```yaml
Status: <Ready-for-planning | Needs-input>
Outcome: <planning | briefing>
Execution-Track: <code | business-artifact | mixed>
Deliverable-Type: <canonical type>
Business-Unit: <BIZ code>        # present when card path is used
Card-ID: <BOS card ID>           # present when card path is used
Feature-Slug: <slug>
artifact: fact-find
```

### Lifecycle

- Created fresh by `/lp-do-fact-find` on first run.
- May be updated in-place if scope restart is approved by operator.
- Archived alongside `plan.md` when plan completes; see `_shared/plan-archiving.md`.
- Stale status (`Status: Needs-input`) blocks `/lp-do-plan` from starting.

---

## Artifact 2: `plan.md`

**Artifact ID:** `plan`
**Produced by:** `/lp-do-plan`
**Stored at:** `docs/plans/<feature-slug>/plan.md`
**Consumers:** `/lp-do-build`

### Required Sections

| Section | Purpose |
|---|---|
| `## Summary` | One-paragraph restatement of the goal and approach. |
| `## Tasks` | Ordered task list. Each task entry must carry: `ID`, `Type`, `Status`, `Confidence`, `Execution-Skill`, `Affects`, and `Depends-on`. |
| `## Parallelism Guide` | Wave-groupings for parallel dispatch (may be `Single wave: all tasks` if sequential). Required even when there is only one wave. |
| `## Validation Contracts` | Named VC-## or TC-## entries with pass criteria. Must include at least one entry per `IMPLEMENT` task. |
| `## Open Decisions` | Any `DECISION` tasks not yet resolved, or `None` if fully resolved. |

### Required Frontmatter Fields

```yaml
Status: <Draft | Active | Archived>
Feature-Slug: <slug>
Business-Unit: <BIZ code>        # present when card path is used
Card-ID: <BOS card ID>           # present when card path is used
Execution-Track: <code | business-artifact | mixed>
Last-updated: <YYYY-MM-DD>
artifact: plan
```

### Lifecycle

- Drafted by `/lp-do-plan` after `fact-find.md` reaches `Status: Ready-for-planning`.
- Updated in-place by `/lp-do-build` after each task completion (status, evidence, `Last-updated`).
- Set to `Status: Archived` when all executable tasks are complete.
- Archived to `docs/plans/_archive/<feature-slug>/plan.md`; see `_shared/plan-archiving.md`.

---

## Artifact 3: `build-record.user.md`

**Artifact ID:** `build-record`
**Produced by:** `/lp-do-build` on plan completion
**Stored at:** `docs/plans/<feature-slug>/build-record.user.md`
**Consumers:** operator, `/lp-do-replan` (if re-engagement), standing-information Layer A refresh

### Required Sections

| Section | Purpose |
|---|---|
| `## What Was Built` | Concise narrative of every task completed: what changed, where, and why. One paragraph per task group is sufficient. |
| `## Tests Run` | List of test commands executed, pass/fail outcomes, and any skips with justification. |
| `## Validation Evidence` | Per-task VC/TC pass evidence. Copy from plan or summarise. Must show each contract was met. |
| `## Scope Deviations` | Any controlled scope expansions made during build, with rationale. `None` if no deviations. |

### Required Frontmatter Fields

```yaml
Status: Complete
Feature-Slug: <slug>
Business-Unit: <BIZ code>
Card-ID: <BOS card ID>           # present when card path is used
Completed-date: <YYYY-MM-DD>
artifact: build-record
```

### Lifecycle

- Created by `/lp-do-build` when all executable tasks reach `Complete` status.
- Written once; treated as an immutable record after creation (do not overwrite; append addendum if corrections are needed).
- Archived alongside `plan.md`; see `_shared/plan-archiving.md`.
- Consumed by operator before writing `results-review.user.md`.

---

## Artifact 4: `results-review.user.md`

**Artifact ID:** `results-review`
**Produced by:** Operator (human) after build is complete
**Stored at:** `docs/plans/<feature-slug>/results-review.user.md`
**Consumers:** startup-loop Layer A (standing-information refresh), future plan sessions for the same business unit

### Hard Gate

**The build cycle is not complete without this artifact.** `/lp-do-build` MUST NOT set plan `Status: Archived` or trigger plan archival until `results-review.user.md` exists in the plan directory. See Plan Completion and Archiving section in `lp-do-build/SKILL.md`.

### Required Sections

| Section | Purpose |
|---|---|
| `## Observed Outcomes` | What actually happened after the build was deployed or activated. Metrics, user feedback, anomalies, or qualitative notes. Minimum: one concrete observation. |
| `## Standing Updates` | List of Layer A (standing-information) files that should be updated as a result of these outcomes, with a one-line description of the update needed. If no updates are needed, write: `No standing updates: <reason>`. This explicit entry is required — the section must not be left blank. |
| `## New Idea Candidates` | Any new opportunities, problems, or hypotheses surfaced by observing the outcomes. Each entry should include: idea summary, trigger observation, and suggested next action (e.g., create card, spike, defer). `None` if nothing surfaced. |

### Required Frontmatter Fields

```yaml
Status: <Draft | Complete>
Feature-Slug: <slug>
Business-Unit: <BIZ code>
Card-ID: <BOS card ID>           # present when card path is used
Review-date: <YYYY-MM-DD>
artifact: results-review
```

### Lifecycle

- Created by operator after build is deployed/activated and outcomes are observable.
- Minimum viable version: a `Draft` with at least the `## Observed Outcomes` section populated (allows plan archival to proceed if operator confirms in writing).
- `Status: Complete` when all three required sections are filled.
- Archived alongside `plan.md`; see `_shared/plan-archiving.md`.
- **Layer A refresh**: after `Status: Complete`, the `## Standing Updates` section is read by the operator (or a dedicated refresh agent) to apply updates to standing-information files. This is the formal Layer B → Layer A feedback handoff.

---

## Path Namespace Summary

All four artifacts share the `docs/plans/<feature-slug>/` namespace:

| Artifact | Canonical path | Produced by |
|---|---|---|
| `fact-find.md` | `docs/plans/<feature-slug>/fact-find.md` | `/lp-do-fact-find` |
| `plan.md` | `docs/plans/<feature-slug>/plan.md` | `/lp-do-plan` |
| `build-record.user.md` | `docs/plans/<feature-slug>/build-record.user.md` | `/lp-do-build` |
| `results-review.user.md` | `docs/plans/<feature-slug>/results-review.user.md` | Operator |

The `.user.md` suffix on the last two artifacts signals that human input is required (either review confirmation or observation authoring) before the artifact reaches `Status: Complete`.

---

## Handoff Chain

```
/lp-do-fact-find
    └── produces: fact-find.md (Status: Ready-for-planning)
            └── /lp-do-plan reads fact-find.md
                    └── produces: plan.md (Status: Active)
                            └── /lp-do-build reads plan.md
                                    ├── produces: build-record.user.md (Status: Complete)
                                    └── HARD GATE: waits for results-review.user.md
                                            └── Operator produces: results-review.user.md
                                                    └── Layer A standing-information refresh (§ Standing Updates)
                                                            └── plan archived (Status: Archived)
```

---

## References

- Two-layer architecture contract: `docs/business-os/startup-loop/two-layer-model.md`
- Artifact registry: `docs/business-os/startup-loop/artifact-registry.md`
- Plan archiving procedure: `.claude/skills/_shared/plan-archiving.md`
- Loop spec: `docs/business-os/startup-loop/loop-spec.yaml`
- Producer skills: `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-plan/SKILL.md`, `.claude/skills/lp-do-build/SKILL.md`
