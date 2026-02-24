---
Type: Policy
Status: Canonical
Domain: Business-OS
Last-reviewed: 2026-02-13
---

# Startup Loop Autonomy Policy

Execution policy for the startup loop stage graph. Classifies every stage action
into one of three tiers so autonomy can be high without uncontrolled side effects.

**Authority:** `docs/business-os/startup-loop/loop-spec.yaml` v3.1.0
**Decision reference:** `docs/plans/lp-skill-system-sequencing-plan.md` (LPSP-07)

## 1) Tier Definitions

| Tier | Description | Gate |
|------|-------------|------|
| **Autonomous** | Safe by default. Action produces only local artifacts within the run directory or updates local documentation files. No external API calls, no shared state mutation, no manifest promotion. | None — executes without additional approval. |
| **Guarded** | External side effect. Action calls a remote API (`/api/agent/*`), mutates shared D1 state (cards, stage docs, lanes), or commits the manifest pointer. | Must emit a `stage_started` event to `events.jsonl` **before** execution begins, providing a traceable record. Failure must emit `stage_blocked` with reason. |
| **Prohibited** | Destructive or irreversible. Action deletes history, bypasses gates, or performs bulk mutations that cannot be recovered from event replay. | Never performed by automated agents. Requires explicit human operator override with documented justification. |

## 2) Stage Action Classification

Every stage has two action categories:
1. **Execution** — running the skill to produce artifacts in `stages/<stage>/`.
2. **BOS sync** — the `bos_sync` action declared in loop-spec.yaml.

### Autonomous Stages

These stages have **both** execution and BOS sync classified as autonomous.
BOS sync actions write only to local files (docs, strategy plans, startup baselines).

| Stage | Name | BOS Sync Action | Tier |
|-------|------|-----------------|------|
| ASSESSMENT-09 | Intake | Validate required ASSESSMENT precursors; write/refresh `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md` | Autonomous |
| MEASURE-01 | Agent-Setup | Record agent setup stage status under `docs/business-os/strategy/<BIZ>/` | Autonomous |
| MEASURE-02 | Results | Persist results baseline under `docs/business-os/strategy/<BIZ>/` | Autonomous |
| S2 | Market intelligence | Update `latest.user.md` pointer + strategy assumptions | Autonomous |
| S2B | Offer design | Persist offer artifact under `docs/business-os/startup-baselines/<BIZ>/` | Autonomous |
| S3 | Forecast | Update latest pointer + strategy assumptions/targets | Autonomous |
| S6B | Channel strategy + GTM | Persist channel artifact under `docs/business-os/startup-baselines/<BIZ>/` | Autonomous |
| S4 | Baseline merge | Write candidate baseline snapshot (local only, no manifest commit) | Autonomous |
| S5A | Prioritize | None (`side_effects: none` in loop-spec) | Autonomous |
| WEBSITE-01 | L1 first build framework | Persist/refresh `site-v1-builder-prompt.user.md` and strategy index status | Autonomous |
| WEBSITE-02 | Site-upgrade synthesis | Update `latest.user.md` pointer | Autonomous |

### Guarded Stages

These stages have autonomous execution but **guarded BOS sync** because the
sync action calls external APIs (`/api/agent/*`), mutates D1 shared state,
or performs lane transitions.

| Stage | Name | BOS Sync Action | Side-Effect Type |
|-------|------|-----------------|------------------|
| S5B | BOS sync | Persist cards/stage-docs to D1 via `/api/agent/*`; commit manifest pointer (candidate → current) | D1 write + manifest commit |
| DO | Do | Upsert fact-find, plan, and build stage docs + lane transitions | D1 write + lane transition |
| S9B | QA gates | Record QA results in build stage doc | D1 write |
| S10 | Weekly readout | Record K/P/C/S decision + update card/plan state | D1 write + state change |

**S5B is the highest-risk guarded stage** because it both writes to D1 and commits
the manifest pointer (promoting `candidate` → `current`). All other guarded stages
write to D1 but do not affect the manifest lifecycle.

### Prohibited Actions

These actions are never performed by automated agents regardless of stage.

| Action | Why Prohibited | Recovery if Performed |
|--------|---------------|----------------------|
| Delete run history (`events.jsonl`, `state.json`) | Destroys audit trail; derived state cannot be reconstructed | None — data loss is permanent |
| Delete or overwrite completed stage artifacts | Violates append-only contract; downstream stages may reference them | Re-run affected stages from scratch |
| Force-promote manifest (skip S5B gate) | Bypasses the guarded BOS sync + prioritization review (S5A) | Revert manifest to prior `current`; re-run S5A → S5B |
| Destructive bulk mutation on D1 (delete cards, wipe stage docs) | Shared state across all runs and businesses | Restore from D1 backup (if available) |
| Rollback manifest to prior version without new run | Manifest tracks run progression; direct rollback creates inconsistency | Start new run from the desired prior state |
| Modify `events.jsonl` (edit or delete existing lines) | Violates append-only ledger contract | Replay from backup; all derived state suspect |

## 3) Guarded Action Protocol

When a guarded-tier BOS sync action executes, the following protocol applies:

### Before execution

1. **Emit `stage_started` event** to `events.jsonl` with the stage ID and timestamp.
   This creates an auditable record that the guarded action was initiated.

2. **Verify preconditions** — the stage's required inputs (from loop-spec `required_inputs`)
   are present and their upstream stage-results show `status: Done`.

### During execution

3. **API calls use idempotent operations** — all D1 writes use `upsert` semantics
   (entity SHA-based conflict detection). A retry of the same input produces the
   same outcome without duplicate records.

4. **Lane transitions are deterministic** — transitions follow the fixed lane graph
   (e.g., Fact-finding → Planned, Planned → In progress, In progress → Done).
   The agent reads current lane + entity SHA before PATCH, and retries once on 409 conflict.

### After execution

5. **Emit `stage_completed` or `stage_blocked` event** to `events.jsonl`.
   - On success: `stage_completed` with artifacts map.
   - On failure: `stage_blocked` with blocking reason (API error, precondition failure).

6. **Write `stage-result.json`** to `stages/<stage>/` with the outcome.
   This is the data-plane handoff signal to the control plane.

### Failure handling

7. If a guarded action fails mid-execution (e.g., card upsert succeeds but stage-doc
   upsert fails), the stage-result is written as `Failed` with the error.
   On retry, idempotent upserts ensure no duplicate state.

## 4) Decision Criteria for Tier Assignment

Use these criteria when adding new stages or actions to the loop:

| Question | If Yes → | If No → |
|----------|----------|---------|
| Does the action call an external API? | Guarded | Continue |
| Does the action mutate shared state (D1, manifest, cards)? | Guarded | Continue |
| Does the action perform a lane transition? | Guarded | Continue |
| Does the action delete or overwrite existing data? | Prohibited | Continue |
| Does the action bypass a required gate (S5A, S5B)? | Prohibited | Continue |
| None of the above? | Autonomous | — |

## 5) Tier Coverage Verification

All 26 stages from loop-spec.yaml are classified:

- **Autonomous:** 11 stages — ASSESSMENT-09, MEASURE-01, MEASURE-02, S2, S2B, S3, S6B, S4, S5A, WEBSITE-01, WEBSITE-02
- **Guarded (BOS sync):** 4 stages — S5B, DO, S9B, S10
- **Prohibited:** 0 stages (prohibited applies to actions, not stages)

Total classified: 14 startup execution stages plus ASSESSMENT family container/sub-stages (26 stage IDs total). No stage is unclassified.

Stages with `side_effects` field in loop-spec.yaml:
- S5A: `side_effects: none` → classified Autonomous ✓
- S5B: `side_effects: guarded` → classified Guarded ✓
