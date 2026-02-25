---
Type: Schema-Contract
Status: Active
Version: 1.2.0
Domain: Venture-Studio
Workstream: Feature-Development
Created: 2026-02-22
Last-updated: 2026-02-25
Owner: startup-loop maintainers
Related-plan: docs/plans/startup-loop-standing-info-gap-analysis/plan.md
---

# Loop Output Contracts

## Purpose

Formal artifact contracts for the four core documents produced by the feature development loop (`/lp-do-fact-find` → `/lp-do-plan` → `/lp-do-build` → operator review), plus the soft-gate reflection debt artifact. Each contract defines the canonical path, producer skill, required sections, frontmatter fields, lifecycle, and consumer list.

These contracts close two feedback paths:
- **Layer B → Layer A feedback**: the `results-review.user.md` artifact carries observed outcomes back into standing-information layer (Layer A), completing the loop as specified in `docs/business-os/startup-loop/two-layer-model.md`.
- **Skill handoff integrity**: each artifact is the single authoritative input to its downstream consumer. Consumers MUST read from the canonical path defined here.

Skills MUST NOT store outputs at ad-hoc paths. All loop output artifacts in this contract use the path namespace `docs/plans/<feature-slug>/`.

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
Feature-Slug: <slug>
artifact: fact-find
# Optional — present when opened via a queued dispatch packet:
Dispatch-ID: <IDEA-DISPATCH-YYYYMMDDHHmmss-NNNN | omit if direct inject>
# Required when Dispatch-ID is absent:
Trigger-Source: <path to standing artifact that motivated this cycle, or "direct-operator-decision: <rationale>">
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
**Consumers:** operator, `/lp-do-replan` (if re-engagement), standing-information Layer A refresh, `lp-do-build-event-emitter.ts` (reads canonical outcome fields)

### Required Sections

| Section | Purpose |
|---|---|
| `## What Was Built` | Concise narrative of every task completed: what changed, where, and why. One paragraph per task group is sufficient. |
| `## Tests Run` | List of test commands executed, pass/fail outcomes, and any skips with justification. |
| `## Validation Evidence` | Per-task VC/TC pass evidence. Copy from plan or summarise. Must show each contract was met. |
| `## Scope Deviations` | Any controlled scope expansions made during build, with rationale. `None` if no deviations. |
| `## Outcome Contract` | Canonical outcome fields carried from plan `## Inherited Outcome Contract`. Required for `build-event.json` emitter to produce operator-attributed `why_source`. See sub-fields below. |

#### `## Outcome Contract` Sub-fields (required in build-record)

The `## Outcome Contract` section in `build-record.user.md` carries the outcome context forward from the plan into the emitted `build-event.json`:

```markdown
## Outcome Contract

- **Why:** <carry from plan Inherited Outcome Contract; use TBD if absent>
- **Intended Outcome Type:** <measurable | operational | TBD>
- **Intended Outcome Statement:** <carry from plan; use TBD if absent>
- **Source:** <operator | auto>
```

Field notes:
- `Why`: operator-authored explanation of why this build happened. Populated from `plan.md` § Inherited Outcome Contract → `## Outcome Contract` → Why. Use `TBD` if no canonical value; emitter marks `why_source: "heuristic"` when TBD.
- `Intended Outcome Type`: `measurable` or `operational`. No KPI required for `operational` type.
- `Intended Outcome Statement`: non-empty statement. Must not be a template placeholder.
- `Source`: `operator` if the operator confirmed values at Option B; `auto` if auto-generated. `auto` values pass schema but are excluded from quality metrics. The emitter copies this as `why_source` in `build-event.json` (with `"heuristic"` as fallback for missing/TBD).

### Required Frontmatter Fields

```yaml
Status: Complete
Feature-Slug: <slug>
Completed-date: <YYYY-MM-DD>
artifact: build-record
# Optional — set when a strategy artifact references this build:
Build-Event-Ref: docs/plans/<feature-slug>/build-event.json
```

### Lifecycle

- Created by `/lp-do-build` when all executable tasks reach `Complete` status.
- Written once; treated as an immutable record after creation (do not overwrite; append addendum if corrections are needed).
- Archived alongside `plan.md`; see `_shared/plan-archiving.md`.
- Consumed by operator before writing `results-review.user.md`.
- `build-event.json` emitter reads the `## Outcome Contract` section immediately after `build-record.user.md` is written; this is an instruction in the build skill SKILL.md, not a code-enforced hook.

---

## Artifact 4: `results-review.user.md`

**Artifact ID:** `results-review`
**Produced by:** Operator (human) after build is complete
**Stored at:** `docs/plans/<feature-slug>/results-review.user.md`
**Consumers:** startup-loop Layer A (standing-information refresh), future plan sessions for the same business unit

### Required Sections

| Section | Purpose |
|---|---|
| `## Observed Outcomes` | What actually happened after the build was deployed or activated. Metrics, user feedback, anomalies, or qualitative notes. Minimum: one concrete observation. |
| `## Standing Updates` | List of Layer A (standing-information) files that should be updated as a result of these outcomes, with a one-line description of the update needed. If no updates are needed, write: `No standing updates: <reason>`. This explicit entry is required — the section must not be left blank. Anti-loop rule applies: do not update the domain that triggered this cycle (see R8 in `two-layer-model.md`). |
| `## New Idea Candidates` | Any new opportunities, problems, or hypotheses surfaced by observing the outcomes. Each entry should include: idea summary, trigger observation, and suggested next action (e.g., create card, spike, defer). `None` if nothing surfaced. |
| `## Standing Expansion` | Required decision entry. Record either: (a) a decision to add/revise a standing artifact and register the new trigger, or (b) `No standing expansion: <reason>`. See R9 in `two-layer-model.md`. |

### Required Frontmatter Fields

```yaml
Status: <Draft | Complete>
Feature-Slug: <slug>
Review-date: <YYYY-MM-DD>
artifact: results-review
```

### Lifecycle

- Created by operator after build is deployed/activated and outcomes are observable (optional for archival, required to clear reflection debt).
- `Status: Complete` when all four required sections are filled (`Observed Outcomes`, `Standing Updates`, `New Idea Candidates`, `Standing Expansion` decision).
- Archived alongside `plan.md` if present; see `_shared/plan-archiving.md`.
- **Layer A refresh**: after `Status: Complete`, the `## Standing Updates` section is read by the operator (or a dedicated refresh agent) to apply updates to standing-information files. This is the formal Layer B → Layer A feedback handoff.

---

## Soft Gate Artifact: `reflection-debt.user.md`

**Artifact ID:** `reflection-debt`  
**Produced by:** `/lp-do-build` deterministic emitter (`scripts/src/startup-loop/lp-do-build-reflection-debt.ts`)  
**Stored at:** `docs/plans/<feature-slug>/reflection-debt.user.md`  
**Consumers:** lane scheduler (`IMPROVE`), operations governance, admission controls

### Purpose

Soft-gate closure mechanism for reflection quality. Build completion and plan archival remain non-blocking, but if `results-review.user.md` is missing minimum payload the emitter must upsert an open debt item.

### Deterministic Debt Rules

- Debt key: `reflection-debt:{build_id}`.
- Idempotency: one debt item per build ID; retries/replays must not create duplicates.
- Default lane: `IMPROVE`.
- SLA: 7 days.
- Breach behavior: `block_new_admissions_same_owner_business_scope_until_resolved_or_override`.
- Minimum payload checked against `results-review.user.md`:
  - `Observed Outcomes`
  - `Standing Updates` (or explicit `No standing updates: <reason>`)
  - `New Idea Candidates`
  - `Standing Expansion` decision (or explicit `No standing expansion: <reason>`)

### Lifecycle

- Emitted or updated when `/lp-do-build` closes a plan (`build-record.user.md` produced).
- Open debt resolves when `results-review.user.md` satisfies minimum payload checks.
- Debt entries remain in ledger for traceability after resolution.

---

## Path Namespace Summary

All artifacts in this contract share the `docs/plans/<feature-slug>/` namespace:

| Artifact | Canonical path | Produced by |
|---|---|---|
| `fact-find.md` | `docs/plans/<feature-slug>/fact-find.md` | `/lp-do-fact-find` |
| `plan.md` | `docs/plans/<feature-slug>/plan.md` | `/lp-do-plan` |
| `build-record.user.md` | `docs/plans/<feature-slug>/build-record.user.md` | `/lp-do-build` |
| `build-event.json` | `docs/plans/<feature-slug>/build-event.json` | `/lp-do-build` emitter (`lp-do-build-event-emitter.ts`) |
| `results-review.user.md` | `docs/plans/<feature-slug>/results-review.user.md` | Operator |
| `reflection-debt.user.md` | `docs/plans/<feature-slug>/reflection-debt.user.md` | `/lp-do-build` emitter |

The `.user.md` suffix marks operator-facing loop artifacts. Only `results-review.user.md` requires human-authored observation content; `build-record.user.md` and `reflection-debt.user.md` are system-generated by `/lp-do-build`.

---

## Handoff Chain

```
/lp-do-fact-find
    └── produces: fact-find.md (Status: Ready-for-planning)
            └── /lp-do-plan reads fact-find.md
                    └── produces: plan.md (Status: Active)
                            └── /lp-do-build reads plan.md
                                    ├── produces: build-record.user.md (Status: Complete)
                                    ├── emits: build-event.json (canonical outcome event, from Outcome Contract in build-record)
                                    ├── evaluates results-review minimum payload
                                    │     └── if missing: upserts reflection-debt.user.md (soft gate)
                                    └── plan archived (Status: Archived)
                                            └── Operator completes results-review.user.md
                                                    └── debt resolves + Layer A standing-information refresh (§ Standing Updates)
```

---

## References

- Two-layer architecture contract: `docs/business-os/startup-loop/two-layer-model.md`
- Artifact registry: `docs/business-os/startup-loop/artifact-registry.md`
- Plan archiving procedure: `.claude/skills/_shared/plan-archiving.md`
- Loop spec: `docs/business-os/startup-loop/loop-spec.yaml`
- Reflection debt emitter: `scripts/src/startup-loop/lp-do-build-reflection-debt.ts`
- Producer skills: `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-plan/SKILL.md`, `.claude/skills/lp-do-build/SKILL.md`
