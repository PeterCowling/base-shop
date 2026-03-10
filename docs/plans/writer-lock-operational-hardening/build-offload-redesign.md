---
Type: Investigation
Status: Complete
Task: TASK-02
Date: 2026-03-09
Feature-Slug: writer-lock-operational-hardening
---

# Build Offload Redesign

## Question
How should Base-Shop replace shared-checkout `codex exec --sandbox workspace-write` so build offload can satisfy the minimum-lock-time policy without weakening single-writer safety?

## Current State
- The active offload contract in `.claude/skills/_shared/build-offload-protocol.md` runs `nvm exec 22 codex exec -a never --sandbox workspace-write`.
- The same protocol explicitly requires the orchestrator to hold the writer lock for the full `codex exec` session because Codex may mutate the shared checkout at any time.
- The archived `lp-do-build-codex-offload` plan intentionally chose that tradeoff after confirming `codemoot run` does not write files to disk.

## Design Constraints
- One canonical checkout remains the source of truth.
- `lp-do-build` gates stay with the orchestrator: eligibility, scope, VC/TC verification, post-build validation, commit, and plan updates.
- Offload still needs to support code tasks, business-artifact tasks, SPIKEs, and INVESTIGATE deliverables.
- The replacement must shorten writer-lock duration materially, not just move wording around.

## Options

### Option A — Patch-return offload outside the shared checkout
1. Orchestrator assembles a self-contained task packet:
   - task metadata
   - readonly context files
   - writable file list
   - acceptance criteria
2. Codex runs outside the shared checkout and returns:
   - unified diff or `apply_patch` payload
   - optional summary/evidence sidecar
3. Orchestrator acquires the writer lock only for:
   - apply patch
   - run required serialized validations that need the mutated tree
   - commit/push

**Pros**
- Actually satisfies minimum-lock-time intent.
- Preserves single-checkout semantics.
- Makes the write boundary explicit and auditable.
- Prevents offloaded agents from mutating arbitrary files outside the declared patch.

**Cons**
- Requires a new patch/output contract and orchestrator apply step.
- Large or conflict-heavy changes may need patch chunking or reject handling.
- Some tasks may need more explicit context than the current interactive workspace-write route.

### Option B — Scratch clone / disposable mirror, then replay into the canonical checkout
1. Orchestrator prepares a disposable clone or snapshot.
2. Codex runs `workspace-write` in that disposable workspace.
3. Orchestrator computes a diff from the disposable workspace and replays it into the canonical checkout under lock.

**Pros**
- Keeps Codex in a familiar write-capable environment.
- Reduces accidental shared-checkout mutation during long sessions.

**Cons**
- Violates the repo’s “single checkout” operating model in practice.
- Adds sync drift, cleanup, and environment parity risks.
- More operationally complex than patch-return.

### Option C — Keep shared-checkout `workspace-write`, but segment tasks more aggressively
1. Keep current protocol.
2. Reduce task size and rely on wrapper policy plus operator discipline.

**Pros**
- Lowest implementation cost.

**Cons**
- Does not solve the core lock-duration problem.
- Still leaves sanctioned long-held locks by design.
- Contradicts the goal of this investigation.

## Recommendation
Choose **Option A: patch-return offload outside the shared checkout**.

This is the only option that materially shortens lock duration while preserving the repo’s canonical-checkout rule. Option B improves isolation but reintroduces multi-checkout operational complexity. Option C is not a real redesign.

## Proposed Target Contract

### Phase 1 — Read-only task packet
The orchestrator prepares a deterministic packet with:
- plan path
- task ID and description
- writable file allowlist
- readonly reference file list
- acceptance criteria
- validation commands the orchestrator will run after apply
- required output format: unified diff or `apply_patch`

### Phase 2 — Offloaded patch generation
Codex runs in a non-shared environment and returns:
- `patch.diff` or `apply_patch` text
- `summary.md` or final-message artifact
- explicit list of files touched

### Phase 3 — Serialized apply window
The orchestrator acquires the writer lock only for:
- verifying the working tree still matches the expected pre-apply state
- applying the returned patch
- running narrow required validations
- committing and pushing

### Phase 4 — Failure handling
- If patch apply fails cleanly: stop before validation, surface the reject, do not fall back silently.
- If post-apply validation fails: fix inline or generate a new patch cycle, but keep the failure scoped to the canonical checkout after explicit apply.
- If the tree changed between packet generation and apply: regenerate the packet instead of forcing apply.

## Why This Is Safer
- Shared-checkout mutation becomes a short, explicit phase instead of an unbounded session.
- The lock protects only the serialized mutation boundary it actually needs to protect.
- Patch review and touched-file review become concrete artifacts.
- The orchestrator can reject patches that exceed the declared writable allowlist.

## Implementation Slice Recommendation
The next implementation plan should do this in order:
1. Add a patch-output contract to `build-offload-protocol.md`.
2. Prototype one `lp-do-build` task type, preferably business-artifact or simple code IMPLEMENT, using patch-return.
3. Add an apply step under writer lock with pre-apply tree fingerprint checks.
4. Keep `workspace-write` as an explicit temporary fallback during migration, not the default route.

## Rejected Paths
- “Use `writer-lock-window.sh` around the existing shared-checkout offload.”
  - Rejected because Codex can still mutate the shared checkout outside the window; the boundary is not safe.
- “Just shorten the timeout or poll interval.”
  - Rejected because the main problem is holder duration, not queue mechanics.

## Acceptance Check
- One primary redesign is recommended: **Yes**
- Lock boundary is defined concretely: **Yes**
- Artifact boundary is defined concretely: **Yes**
- Failure recovery behavior is defined concretely: **Yes**

## References
- `.claude/skills/_shared/build-offload-protocol.md`
- `docs/plans/_archive/lp-do-build-codex-offload/plan.md`
- `docs/plans/_archive/lp-do-build-codex-offload/fact-find.md`
