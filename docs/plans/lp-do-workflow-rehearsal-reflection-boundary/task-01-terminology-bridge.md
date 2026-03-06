# Rehearsal Terminology Bridge — Compatibility Policy

**Produced by:** TASK-01 spike
**Consumed by:** TASK-02 (shared protocol + skill docs), TASK-03 (lp-do-plan new phase)
**Status:** Policy only — no existing files modified by this task

---

## 1. Canonical Human-Facing Term

**Canonical term for pre-build dry runs:** `rehearsal`

All human-facing descriptions, section titles, introductory sentences, and in-prose references to the pre-build trace concept should use "rehearsal". The machine-facing file path `../_shared/simulation-protocol.md` is unchanged in this cycle (see Section 4).

---

## 2. Section Heading Treatment

| Current heading | Replacement heading | Location |
|---|---|---|
| `# Simulation Protocol (Shared)` | `# Rehearsal Protocol (Shared)` | simulation-protocol.md line 1 |
| `## What Simulation Is` | `## What Rehearsal Is` | simulation-protocol.md |
| `### What Simulation Can Catch` | `### What Rehearsal Can Catch` | simulation-protocol.md |
| `### What Simulation Cannot Catch (Limits)` | `### What Rehearsal Cannot Catch (Limits)` | simulation-protocol.md |
| `## Simulation Trace Output Format` | `## Rehearsal Trace Output Format` | simulation-protocol.md |
| `## Scope Simulation Checklist (lp-do-fact-find Phase 5.5)` | `## Scope Rehearsal Checklist (lp-do-fact-find Phase 5.5)` | simulation-protocol.md |
| `## Forward Simulation Trace Instructions (lp-do-critique Step 5a)` | `## Forward Rehearsal Trace Instructions (lp-do-critique Step 5a)` | simulation-protocol.md |
| `## Phase 5.5: Scope Simulation` | `## Phase 5.5: Scope Rehearsal` | lp-do-fact-find/SKILL.md |
| `## Phase 7.5: Simulation Trace` | `## Phase 7.5: Rehearsal Trace` | lp-do-plan/SKILL.md |
| `### Step 5a: Forward Simulation Trace` | `### Step 5a: Forward Rehearsal Trace` | lp-do-critique/SKILL.md |

**Artifact section headings** written into plan/fact-find output:
- `## Simulation Trace` → `## Rehearsal Trace` (in plans and fact-finds)

**Inline labels** used by lp-do-critique:
- `[Simulation]` label → `[Rehearsal]` label

**Body text rule:** Replace "simulation" with "rehearsal" in all introductory and descriptive sentences. Exception: quoted example blocks that show historical/legacy output should retain the old term with a bridge note: _"(legacy output format; new artifacts use `## Rehearsal Trace`)"_.

---

## 3. Waiver Name Decision

**Decision: rename `Simulation-Critical-Waiver` to `Rehearsal-Critical-Waiver`.**

Rationale: The waiver name appears in 4 active plan files (below the 5-instance high-usage threshold). These are already-filed waivers that document past decisions; they do not need retroactive update. New waivers produced after TASK-02 completes must use `Rehearsal-Critical-Waiver`. Existing filed waivers using the old name remain valid — lp-do-critique should treat both names as equivalent during a one-cycle transition window.

TASK-02 must update:
- The waiver block heading in simulation-protocol.md: `## Simulation-Critical-Waiver` → `## Rehearsal-Critical-Waiver`
- All references to `Simulation-Critical-Waiver` in skill docs (fact-find, plan, critique) → `Rehearsal-Critical-Waiver`
- The waiver format template block name

TASK-02 must NOT update:
- Already-filed `Simulation-Critical-Waiver` blocks in existing plan files (retroactive rename is out of scope)

---

## 4. Path-Rename Deferral Rationale

The file `.claude/skills/_shared/simulation-protocol.md` is loaded by three skill docs via the exact relative path `../_shared/simulation-protocol.md`. A physical rename in the same cycle as content changes creates two risks:
1. Broken load paths if any skill doc reference is missed
2. Merge conflict risk if concurrent work references the old path

**Deferral decision:** Content-first bridge only in this cycle. File rename deferred.

**Criteria for triggering the path rename (follow-on plan, TASK-06 in Decision Log):**

The rename is appropriate when ALL of the following are true:
- At least 2 completed build cycles have used rehearsal terminology in trace artifacts without agent confusion (i.e., the `## Rehearsal Trace` section appears correctly in ≥2 plan/fact-find artifacts)
- No active plan files contain `Simulation-Critical-Waiver` in an unfiled (future-use) position
- A dedicated rename task has been planned and sequenced, updating all three skill doc load paths in a single atomic commit
- The rename commit message explicitly notes the old path for any external tooling that may reference it by name
