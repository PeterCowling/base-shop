---
Type: Rollback-Playbook
Schema: lp-do-ideas-rollback-playbook
Version: 1.0.0
Status: Active
Created: 2026-02-24
Owner: startup-loop maintainers
Related-seam: docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md
Related-checklist: docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md
Target-rollback-time: ≤ 30 minutes
---

# lp-do-ideas Rollback Playbook

This playbook defines the concrete procedure for disabling `lp-do-ideas` live mode
and restoring trial-only (or fully disabled) operation. It covers two scenarios:

1. **Pre-activation drill** — rehearsing rollback before go-live to satisfy VC-03.
2. **Post-activation rollback** — emergency or planned rollback after live mode is active.

**Read this entire document before executing any steps.**

---

## Rollback Decision Criteria

Initiate a rollback when any of the following are true:

| Trigger | Description |
|---|---|
| Dispatch precision drop | Live-mode `route_accuracy` falls below 70% in any 7-day window |
| Suppression instability | Duplicate suppression rate varies by > ±20% within one week |
| Unexpected stage mutation | Any evidence that `lp-do-ideas` wrote to startup-loop stage state |
| Queue data loss | `live/queue-state.json` corrupted or missing entries without corresponding telemetry |
| Operator decision | Operator elects to return to trial mode for any reason |

---

## Part 1: Pre-Activation Rollback Drill

**Purpose**: Verify the rollback path works before activating live mode. Required by VC-03.

**Target**: Complete within 30 minutes. Record actual time in the go-live checklist.

**Note**: This drill is performed on a non-production branch where live mode has been
temporarily activated for testing purposes. It does not affect the real trial-mode operation.

### Drill — Step D1: Enable live mode on test branch

```bash
git checkout -b rollback-drill-$(date +%Y%m%d)
# Apply the live mode changes to this branch (orchestrator + adapter + hook)
# Do NOT commit to main/dev
```

### Drill — Step D2: Verify live mode is active

```bash
# Confirm routing adapter accepts mode: live
node -e "
const { routeDispatch } = require('./scripts/src/startup-loop/lp-do-ideas-routing-adapter.js');
const pkt = { schema_version: 'dispatch.v1', mode: 'live', status: 'fact_find_ready',
  recommended_route: 'lp-do-fact-find', area_anchor: 'test', location_anchors: ['test'],
  provisional_deliverable_family: 'business-artifact', evidence_refs: ['test'], dispatch_id: 'TEST-001' };
console.log(routeDispatch(pkt).ok); // must print: true
"
```

### Drill — Step D3: Execute rollback (Steps 1–6 below)

Follow the post-activation rollback procedure (Steps 1–6 in Part 2) on the test branch.

### Drill — Step D4: Verify trial-only mode restored

```bash
# Confirm routing adapter again rejects mode: live
node -e "
const { routeDispatch } = require('./scripts/src/startup-loop/lp-do-ideas-routing-adapter.js');
const pkt = { schema_version: 'dispatch.v1', mode: 'live', status: 'fact_find_ready',
  recommended_route: 'lp-do-fact-find', area_anchor: 'test', location_anchors: ['test'],
  provisional_deliverable_family: 'business-artifact', evidence_refs: ['test'], dispatch_id: 'TEST-001' };
const result = routeDispatch(pkt);
console.log(result.ok === false && result.code === 'INVALID_MODE'); // must print: true
"
```

### Drill — Step D5: Record and clean up

```bash
# Record completion time
echo "Drill completed at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Delete the test branch
git checkout dev
git branch -d rollback-drill-$(date +%Y%m%d)
```

**Record actual drill time** in `lp-do-ideas-go-live-checklist.md` Section C.

---

## Part 2: Post-Activation Rollback Procedure

Execute these steps in order. Do not skip steps. Each step has a verification check.

**Time target**: Complete all steps within 30 minutes.

---

### Step 1 — Halt live dispatch hook

**Action**: Disable the SIGNALS integration hook immediately to prevent new live dispatches
from firing while rollback is in progress.

```bash
# Option A: Comment out the live hook call in the SIGNALS integration point
# Option B: Set an environment variable or config flag that disables the hook
# Option C: Rename the hook file to prevent import

# Quickest safe option:
mv scripts/src/startup-loop/lp-do-ideas-live-hook.ts \
   scripts/src/startup-loop/lp-do-ideas-live-hook.ts.disabled
```

**Verification**: Confirm hook is not loaded by SIGNALS cycle:
```bash
# Run SIGNALS cycle in dry mode and confirm no lp-do-ideas dispatch fires
# (specific command depends on SIGNALS integration implementation)
echo "Hook disabled at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

---

### Step 2 — Revert routing adapter mode guard

**Action**: Restore the routing adapter's mode guard to `"trial"` only.

**Change to make** in `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts`:

```typescript
// BEFORE (live mode active):
if (packet.mode !== "trial" && packet.mode !== "live") {

// AFTER (rollback — trial only):
if (packet.mode !== "trial") {
```

Or restore via git:
```bash
git show HEAD~N:scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts > \
  scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts
# Where HEAD~N is the commit before live mode was activated
```

**Verification**:
```bash
pnpm -w run test:governed -- jest -- \
  --config=scripts/jest.config.cjs \
  --testPathPattern="lp-do-ideas-routing-adapter" \
  --no-coverage
# Expected: all tests pass (live-mode test for INVALID_MODE code)
```

---

### Step 3 — Disable live orchestrator

**Action**: Prevent the live orchestrator from being invoked. Fastest approach:

```bash
# Rename to prevent import resolution
mv scripts/src/startup-loop/lp-do-ideas-live.ts \
   scripts/src/startup-loop/lp-do-ideas-live.ts.disabled
```

If the live orchestrator was part of the same file as the trial orchestrator, revert
the file to the pre-live commit:
```bash
git show <pre-live-commit>:scripts/src/startup-loop/lp-do-ideas-trial.ts > \
  scripts/src/startup-loop/lp-do-ideas-trial.ts
```

**Verification**:
```bash
pnpm -w run test:governed -- jest -- \
  --config=scripts/jest.config.cjs \
  --testPathPattern="lp-do-ideas-trial" \
  --no-coverage
# Expected: all 27 tests pass
```

---

### Step 4 — Archive live queue state

**Action**: Preserve the live queue state for post-incident review. Do not delete.

```bash
# Create timestamped archive
ARCHIVE_TS=$(date -u +%Y%m%dT%H%M%SZ)
cp docs/business-os/startup-loop/ideas/live/queue-state.json \
   docs/business-os/startup-loop/ideas/live/queue-state.${ARCHIVE_TS}.rollback.json
cp docs/business-os/startup-loop/ideas/live/telemetry.jsonl \
   docs/business-os/startup-loop/ideas/live/telemetry.${ARCHIVE_TS}.rollback.jsonl
echo "Live state archived at: ${ARCHIVE_TS}"
```

---

### Step 5 — Update policy decision artifact

**Action**: Update `docs/plans/lp-do-ideas-startup-loop-integration/artifacts/trial-policy-decision.md`:
- Change `mode` back to `trial`
- Bump version (e.g. `1.1.0` → `1.2.0`)
- Add a `## Rollback Record` section with:
  - Rollback date
  - Rollback reason (from the decision criteria table above)
  - Steps completed

---

### Step 6 — Verify startup-loop stage state is clean

**Action**: Confirm no startup-loop stage state was mutated during the live mode period.

```bash
# Check that no stage status files were modified by lp-do-ideas
git log --oneline --all -- docs/business-os/startup-baselines/*/runs/*/stage-status*.json | \
  grep -v "expected_committer" || echo "No unexpected stage mutations found"

# Check trial path is still intact
ls docs/business-os/startup-loop/ideas/trial/
# Expected: telemetry.jsonl and queue-state.json present and not modified during live period
```

---

### Step 7 — Run full test suite confirmation

**Action**: Confirm the codebase is clean after rollback.

```bash
pnpm -w run test:governed -- jest -- \
  --config=scripts/jest.config.cjs \
  --testPathPattern="lp-do-ideas" \
  --no-coverage
# Expected: all tests pass
```

---

### Step 8 — Commit rollback

**Action**: Commit the rollback changes with a clear message.

```bash
git add scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts
git add docs/plans/lp-do-ideas-startup-loop-integration/artifacts/trial-policy-decision.md
# Add any other modified files
git commit -m "rollback(lp-do-ideas): disable live mode, restore trial-only operation"
```

---

## Post-Rollback Actions

After completing the rollback procedure:

1. **Review live-mode telemetry** from the archived files to understand what dispatches
   fired and whether any incorrect routes occurred.

2. **Document the failure mode** in `trial-policy-decision.md` Rollback Record to
   inform the next go-live attempt.

3. **Re-run trial mode** with updated registry or adapter as needed to address the
   root cause identified in the rollback review.

4. **Update the go-live checklist** if the rollback revealed a gap in the VC criteria
   (e.g. the precision threshold needs raising, or the drill time target is too optimistic).

5. **Do not re-attempt go-live** until the identified root cause is resolved and the
   checklist is fully re-signed off.

---

## Rollback Log

| Date | Reason | Duration | Completed by |
|---|---|---|---|
| _(none yet)_ | _(pre-activation)_ | — | — |

_Update this table after each rollback event._

---

## Revision History

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-02-24 | Initial rollback playbook (pre-activation) |
