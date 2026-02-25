---
Type: Seam-Contract
Schema: lp-do-ideas-go-live-seam
Version: 1.2.0
Mode: trial → live (activation deferred)
Status: Active
Created: 2026-02-24
Owner: startup-loop maintainers
Related-contract: docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md
Related-checklist: docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md
Related-rollback: docs/business-os/startup-loop/ideas/lp-do-ideas-rollback-playbook.md
Related-policy: docs/plans/lp-do-ideas-startup-loop-integration/artifacts/trial-policy-decision.md
Related-adapter: scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts
Related-orchestrator: scripts/src/startup-loop/lp-do-ideas-trial.ts
---

# lp-do-ideas Go-Live Seam Contract

This document defines the integration boundary, mode-switch procedure, and
post-activation behavior for moving `lp-do-ideas` from `mode: trial` to
`mode: live`.

**Activation is deferred.** This seam package is published to pre-define the
path — not to activate it now. Activation requires go-live checklist sign-off
(see `lp-do-ideas-go-live-checklist.md`).

---

## 1. What "Going Live" Means

In trial mode, `lp-do-ideas` is a standalone pipeline:

```
standing-artifact delta
    → runTrialOrchestrator()     ← pure function, no loop integration
    → dispatch.v1 packet emitted
    → trial queue (enqueued)
    → operator reviews + manually confirms
    → /lp-do-fact-find or /lp-do-briefing invoked by operator
```

In live mode, the pipeline fires immediately when a build task commits changes to a
registered standing artifact:

```
/lp-do-build task completes → commit touches registered standing artifact(s)
    → SHA delta computed for each affected registered artifact
    → runLiveHook() invoked with delta events
    → runLiveOrchestrator() processes events
    → dispatch.v1 packets emitted (mode: live)
    → live queue
    → Option B: operator confirmation still required for all routes (unless escalated to Option C)
    → /lp-do-fact-find or /lp-do-briefing invoked
```

The fundamental change in live mode is **event-driven trigger integration** — ideas
surface immediately when a standing artifact changes, rather than waiting for a weekly
review cycle or requiring manual skill invocation. This ensures that process improvement
and new direction ideas are visible at the point they become relevant, not days later.

The queue-with-confirmation (Option B) operator gate remains active in live mode until
explicitly escalated to Option C (see policy decision).

---

## 2. Integration Boundary Points

### 2.1 Build-Time Trigger Hook (/lp-do-build post-task)

**Boundary**: `/lp-do-build` skill — after each task commit, the build skill checks
whether any committed files are registered in `live/standing-registry.json`. If so,
it computes SHA deltas and invokes the hook with those events.

**Action required at activation**:
- After each task commit in `/lp-do-build`, compare the committed file set against
  `live/standing-registry.json`.
- For each file that is a registered artifact, construct an `ArtifactDeltaEvent` with
  `before_sha` (from the previous commit) and `after_sha` (from the new commit).
- Call `runLiveHook()` with those events. Surface any dispatch candidates to the
  operator before moving to the next task.
- Integration is advisory — it does not block the build cycle or require the operator
  to act before continuing.

**Location**: `scripts/src/startup-loop/lp-do-ideas-live-hook.ts`
(IMPLEMENTED — hook module is ready; wiring into `/lp-do-build` is the remaining activation step).

### 2.2 Mode Guard Updates (code changes required at activation)

Two functions previously hard-rejected `mode: live`. Both have been updated:

| Function | File | Previous guard | Live-mode update required |
|---|---|---|---|
| `runTrialOrchestrator()` | `scripts/src/startup-loop/lp-do-ideas-trial.ts` | Rejects if `mode !== "trial"` | COMPLETE |
| `routeDispatch()` | `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts` | Rejects if `mode !== "trial"` | COMPLETE |

**Status**: Both mode guards implemented as of 2026-02-25. `lp-do-ideas-live.ts` created
as a separate module. `routeDispatch()` guard updated to accept `"trial" | "live"`.

**Preferred pattern** (implemented): `lp-do-ideas-live.ts` is a separate module that:
- Imports the same routing adapter (the adapter guard has been updated to allow `"live"`)
- Uses production artifact paths (not trial paths)
- Integrates with the `/lp-do-build` post-task hook

### 2.3 Artifact Path Switch

In trial mode, the queue and telemetry write to designated trial paths:

| Artifact | Trial path |
|---|---|
| Telemetry log | `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl` |
| Queue state snapshot | `docs/business-os/startup-loop/ideas/trial/queue-state.json` |

In live mode, the paths change to production paths:

| Artifact | Live path |
|---|---|
| Telemetry log | `docs/business-os/startup-loop/ideas/live/telemetry.jsonl` |
| Queue state snapshot | `docs/business-os/startup-loop/ideas/live/queue-state.json` |
| Standing registry | `docs/business-os/startup-loop/ideas/live/standing-registry.json` |

The trial path data is preserved for retrospective analysis. No migration of trial
telemetry to live paths is required or expected.

### 2.4 Standing Registry Production Snapshot

Before activation, the operator must:
1. Review `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json`
   for artifact coverage.
2. Create an active production registry at the live path with `mode: live` set.
3. Capture initial SHAs for all registered artifacts using the SHA snapshot tooling
   (to be added in the live implementation).

### 2.5 Relationship to Other Cycle Points

`lp-do-ideas` live dispatch is **advisory and non-blocking** at all integration points.

| Cycle point | lp-do-ideas role | Blocking? |
|---|---|---|
| `/lp-do-build` post-task commit | Primary trigger — fires when registered artifact changes | No |
| `/startup-loop advance` | Not a trigger; `lp-do-ideas` does not hook into advance | N/A |
| `/lp-weekly` | Not a trigger in v1 live mode | N/A |

The advance gates `GATE-LOOP-GAP-01` and `GATE-LOOP-GAP-02` handle stage-blocked gap
events; `lp-do-ideas` complements these by detecting semantic-strategy deltas at build
time, not stage-transition time.

A future hard gate (e.g. `GATE-IDEAS-01`) may be added to `cmd-advance.md` to block
advance when a critical live dispatch is pending operator confirmation. This is out of
scope for v1 live mode — the checklist explicitly requires this gate to be absent at
go-live activation to preserve advisory posture.

---

## 3. Mode-Switch Procedure

The following sequence switches `lp-do-ideas` from trial to live mode. All steps
must be completed in order. **Do not skip steps.** Each step has an explicit
verification check.

**Implementation status (2026-02-25)**: Steps 1 (checklist — NO-GO), 3 (code), 5 (artifacts) and 6 (hook) are complete as of this build. Steps 2 (policy update), 4 (production registry), and 7 (rollback drill) remain for the operator to complete at activation time.

### Step 1 — Confirm checklist sign-off

**Action**: Verify `lp-do-ideas-go-live-checklist.md` has all items checked and
a sign-off entry in the `## Sign-Off` section.

```bash
grep -c "\- \[x\]" docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md
# Expected: count matches total checklist items (no unchecked items)
grep "Sign-Off" docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md
# Expected: date + approver present
```

**No-go**: Any unchecked item or missing sign-off. Do not proceed.

### Step 2 — Update policy decision artifact

**Action**: Update `docs/plans/lp-do-ideas-startup-loop-integration/artifacts/trial-policy-decision.md`:
- Change `mode` from `trial` to `live`
- Bump `Version` to `1.1.0` (or `2.0.0` if autonomy mode also changes)
- Record activation date and approver name in a new `## Go-Live Activation` section

### Step 3 — Create live orchestrator and update routing adapter

**Action**:
1. Create `scripts/src/startup-loop/lp-do-ideas-live.ts` — live-mode orchestrator
2. Update `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts`:
   - Change mode guard from `=== "trial"` to `=== "trial" || === "live"`
3. Add tests for live-mode path in both files

**Verification**: `pnpm -w test:governed -- jest -- --testPathPattern="lp-do-ideas"` passes.

### Step 4 — Create production standing registry

**Action**: Create `docs/business-os/startup-loop/ideas/live/standing-registry.json`
with all artifacts to be monitored, current SHAs captured, and `mode: live` set.

### Step 5 — Create live artifact paths

**Action**:
```bash
mkdir -p docs/business-os/startup-loop/ideas/live
touch docs/business-os/startup-loop/ideas/live/telemetry.jsonl
echo '{"entries":{},"dedupe_index":{}}' > docs/business-os/startup-loop/ideas/live/queue-state.json
```

### Step 6 — Wire build-time integration hook

**Action**: `scripts/src/startup-loop/lp-do-ideas-live-hook.ts` is already implemented.
Wire it into `/lp-do-build` so that after each task commit, the skill:
1. Checks the committed file set against `live/standing-registry.json`
2. Constructs `ArtifactDeltaEvent[]` for any registered files (using `git diff HEAD~1 HEAD -- <file>` to obtain before/after SHAs)
3. Calls `runLiveHook({ business, registryPath, queueStatePath, telemetryPath, events })`
4. Surfaces any `result.dispatched` packets to the operator as advisory output

**Scope note**: This step does not modify `cmd-advance.md`. The hook is advisory only
and does not block the build cycle.

### Step 7 — Rehearse rollback playbook

**Action**: Before committing the live integration, execute Step 1 of
`lp-do-ideas-rollback-playbook.md` (disable drill) in a non-production branch
to confirm the rollback path works within ≤30 minutes.

**Verification**: Record rollback drill completion time in the checklist sign-off.

### Step 8 — Commit and tag

**Action**: Commit all live-mode changes with tag `lp-do-ideas-live-v1.0.0`.

---

## 4. Post-Activation Behavior

Once live, the following behaviors are in effect:

| Behavior | Live mode (Option B) | Change vs Trial |
|---|---|---|
| Dispatch trigger | Event-driven — fires after `/lp-do-build` task commit touches a registered artifact | Was: manual skill invocation only |
| Operator confirmation | Required for all routes (Option B) | Unchanged |
| Artifact paths | Production paths (`live/`) | Was: trial paths (`trial/`) |
| Telemetry | Appended to `live/telemetry.jsonl` | New file; trial file preserved |
| Queue state | Written to `live/queue-state.json` | New file; trial file preserved |
| startup-loop advance | Not blocked by pending dispatches (advisory) | Unchanged |
| Mode guard | `"trial"` and `"live"` both accepted | Was: `"trial"` only |

---

## 5. Escalation from Option B to Option C

Option C (hybrid auto-invoke) is not activated as part of live mode v1. Escalation
requires a separate policy decision update after live-mode trial evidence is collected.

See `trial-policy-decision.md` Section 2 for escalation criteria:
- Trial review period ≥ 14 days (live mode)
- Sample size ≥ 40 dispatches
- Dispatch precision ≥ 80%

---

## 6. No-Go Conditions

If any of the following are true, do NOT activate live mode:

| Condition | Reason |
|---|---|
| Go-live checklist has unchecked items | Activation prerequisites not met |
| VC-01 dispatch precision < 80% | Routing quality below safe threshold |
| VC-02 duplicate suppression variance > ±10% | Idempotency unstable |
| VC-03 rollback drill not completed | Cannot guarantee safe rollback |
| Live orchestrator code does not pass tests | Code not ready |
| Production standing registry not created | Delta detection has no targets |
| Policy decision artifact not updated | Mode switch not authorised |

---

## 7. Version History

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-02-24 | Initial go-live seam definition (pre-activation) |
| 1.1.0 | 2026-02-25 | Updated to reflect implementation completion: live.ts, routing-adapter, live-hook.ts, live/ artifacts all created. Activation remains deferred pending KPI evidence. |
| 1.2.0 | 2026-02-25 | Changed integration point from `/lp-weekly` (weekly cadence) to `/lp-do-build` (event-driven, fires at task commit time). Updated sections 1, 2.1, 2.5, step 6, and post-activation behavior table. |
