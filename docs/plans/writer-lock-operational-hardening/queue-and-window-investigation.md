---
Type: Investigation
Status: Complete
Task: TASK-03
Date: 2026-03-09
Feature-Slug: writer-lock-operational-hardening
---

# Queue And Window Investigation

## Question
What should Base-Shop do about the current 30-second polling queue and the unused `writer-lock-window.sh` helper so writer lock handoff is faster and narrower in real use?

## Current State
- `scripts/git/writer-lock.sh` uses FIFO ticket ordering.
- In non-interactive runs, waiters poll every 30 seconds and time out after 5 minutes.
- `scripts/git-hooks/writer-lock-window.sh` exists as a release/reacquire helper with token persistence and tree fingerprint helpers.
- Repo search found no active caller for `writer-lock-window.sh`.

## Findings

### 1. Poll-based wake-up creates avoidable idle time
The current queue model is safe but coarse. After a release, the next waiter may sleep up to 30 seconds before attempting acquisition again. In a high-frequency agent environment, that is visible dead time.

### 2. `writer-lock-window.sh` is a primitive, not a usable workflow
The helper can:
- release the current lock using the stored token
- reacquire with configurable active timeout/poll
- compute repo fingerprints

But it does not, by itself, define a safe end-to-end workflow for shared-checkout agent sessions. If the checkout may still be mutated while the lock is released, using it would be unsafe.

### 3. `writer-lock-window.sh` is useful only after mutation is externalized
The helper becomes relevant if and only if:
- the mutable work happens outside the shared checkout, or
- the tree is restored to a known stable state before release

That means it is downstream of the offload redesign, not a substitute for it.

## Options

### Option A — Adopt `writer-lock-window.sh` immediately for current shared-checkout offload
**Rejected.**
This is unsafe because `codex exec --sandbox workspace-write` can mutate the canonical checkout at arbitrary times. Releasing the lock in the middle of that session would violate the single-writer model.

### Option B — Keep 30-second polling and defer all queue work
**Rejected.**
This leaves obvious idle time in place even after the offload redesign lands.

### Option C — Sequence the work: offload redesign first, then adopt a real active-window workflow
**Recommended.**
1. Complete the build-offload redesign so mutable work is no longer happening inside the shared checkout for long sessions.
2. Then turn `writer-lock-window.sh` into a real wrapper around:
   - pre-apply fingerprint check
   - short apply/validate/commit window
   - lock release
3. Reduce waiter wake latency for non-interactive sessions once the holder duration is also shorter.

## Recommendation
Choose **Option C**.

### Queue recommendation
After the offload redesign lands, reduce non-interactive polling from 30 seconds to a much shorter interval, or replace it with a lightweight event/wake mechanism. The current 30-second interval is acceptable only while long-held sessions still dominate. Once lock windows become short, 30 seconds becomes disproportionate overhead.

### Window recommendation
Keep `writer-lock-window.sh`, but do **not** advertise or adopt it for current shared-checkout `workspace-write` flows. Treat it as the future apply-window primitive for patch-return offload and other workflows where the tree is stable before release.

## Concrete Next Implementation Slice
1. Wire `writer-lock-window.sh` into the future patch-return build-offload path only.
2. Add a pre-apply fingerprint check using:
   - `writer_lock_repo_state_fingerprint`
   - `writer_lock_staged_tree`
3. After that lands, reduce queue polling for non-interactive waiters.

## Removal Decision
Do **not** remove `writer-lock-window.sh` yet.

Reason:
- it is not dead code conceptually
- it is the right primitive for a future short apply window
- removing it now would just recreate the same helper later

## Risk Notes
- Reducing polling before shortening holder duration will not address the main contention source.
- Adopting a release/reacquire helper before the offload redesign would create false safety and real race risk.

## Acceptance Check
- Why 30-second polling causes dead time is explained: **Yes**
- Whether `writer-lock-window.sh` should be adopted, replaced, or removed is answered: **Yes**
- A concrete next slice is recommended: **Yes**

## References
- `scripts/git/writer-lock.sh`
- `scripts/git-hooks/writer-lock-window.sh`
- `.claude/skills/_shared/build-offload-protocol.md`
- `docs/plans/writer-lock-operational-hardening/build-offload-redesign.md`
