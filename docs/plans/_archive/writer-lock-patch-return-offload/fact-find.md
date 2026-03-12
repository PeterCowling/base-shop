---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: writer-lock-patch-return-offload
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Related-Plan: docs/plans/writer-lock-patch-return-offload/plan.md
Trigger-Why: Writer-lock hardening closed the accidental-entrypoint problem, but the active build offload path still relies on shared-checkout mutable Codex sessions and an outdated CLI invocation contract, so minimum viable lock time is still not enforceable in practice.
Trigger-Intended-Outcome: type: operational | statement: Base-Shop pilots a patch-return Codex offload path for business-artifact build tasks, keeps the writer lock scoped to the serialized apply and commit window, and leaves shared-checkout workspace-write as an explicit fallback instead of the default. | source: operator
---

# Writer Lock Patch-Return Offload Fact-Find Brief

## Scope
### Summary
This is the implementation follow-on to `writer-lock-operational-hardening`, specifically the TASK-02 redesign note and the TASK-03 queue/window note. The recommended destination is a patch-return offload path where Codex works outside the shared checkout, returns a bounded patch artifact, and the orchestrator acquires the writer lock only for pre-apply verification, patch apply, validation, and commit. The first implementation slice should not attempt a repo-wide executor migration. It should pilot one low-risk executor lane, prove the contract, and keep the current shared-checkout route as an explicit fallback while the new path hardens.

### Goals
- Replace shared-checkout mutable offload as the default for at least one `lp-do-build` lane.
- Resolve the current Codex CLI contract instead of copying stale `-a never` guidance into new tooling.
- Prove a bounded patch artifact contract and a narrow serialized apply window.
- Reuse existing writer-lock primitives only where they are safe after mutation is externalized.

### Non-goals
- Migrating every executor module in one cycle.
- Replacing the writer lock implementation itself.
- Removing the legacy shared-checkout route before the patch-return lane is proven.
- Solving queue wake-up latency ahead of the offload redesign.

### Constraints & Assumptions
- Constraints:
  - The repo remains single-checkout and single-writer.
  - Local validation must still respect the CI-only test execution policy.
  - Any first implementation slice must stay narrow enough to validate and roll back safely.
- Assumptions:
  - Business-artifact IMPLEMENT tasks are the safest first pilot because they already rely on document validation and bounded file lists.
  - `writer-lock-window.sh` is only safe once the mutable work has already moved out of the shared checkout.

## Outcome Contract
- **Why:** Writer-lock hardening closed the accidental-entrypoint problem, but the active build offload path still relies on shared-checkout mutable Codex sessions and an outdated CLI invocation contract, so minimum viable lock time is still not enforceable in practice.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Base-Shop pilots a patch-return Codex offload path for business-artifact build tasks, keeps the writer lock scoped to the serialized apply and commit window, and leaves shared-checkout workspace-write as an explicit fallback instead of the default.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `docs/plans/writer-lock-operational-hardening/build-offload-redesign.md`
  - Recommends patch-return offload as the only design that materially shortens writer-lock duration.
- `docs/plans/writer-lock-operational-hardening/queue-and-window-investigation.md`
  - Confirms `writer-lock-window.sh` should be used only after mutation is externalized.
- `.claude/skills/_shared/build-offload-protocol.md`
  - Still documents shared-checkout `workspace-write` and full-session lock hold.
- `.claude/skills/lp-do-build/modules/build-biz.md`
  - Cleanest pilot candidate because its offload route is document-oriented and already has a bounded post-build validation path.
- `.claude/skills/lp-do-build/modules/build-investigate.md`
  - Still hardcodes the older shared-checkout mutable model and is therefore a worse first pilot.

### Current CLI Evidence
- Local `codex exec --help` under Node 22 shows:
  - `--sandbox read-only | workspace-write | danger-full-access`
  - `--full-auto`
  - `--dangerously-bypass-approvals-and-sandbox`
  - `--output-last-message`
- The same local help output does **not** expose `-a never`.
- Repo search still finds active docs using `-a never` in:
  - `.claude/skills/_shared/build-offload-protocol.md`
  - `.claude/skills/lp-do-build/modules/build-investigate.md`
  - `.claude/skills/ops-ci-fix/SKILL.md`

### Existing Lock Primitives
- `scripts/git-hooks/writer-lock-window.sh`
  - Already provides release/reacquire helpers plus repo and staged-tree fingerprints.
- `scripts/git/writer-lock.sh`
  - Queueing is still poll-based, but the queue problem is secondary until holder duration is shortened.

### Patterns & Conventions Observed
- The archived `lp-do-build-codex-offload` plan intentionally chose shared-checkout `workspace-write` after invalidating `codemoot run` for file-writing tasks.
- The later writer-lock investigations already superseded that architectural choice for minimum-lock-time use cases.
- Active build-offload docs have therefore drifted in two ways:
  - architecture: still centered on shared-checkout mutation
  - invocation: still centered on a stale `-a never` example

### Dependency & Impact Map
- Upstream dependencies:
  - `.claude/skills/_shared/build-offload-protocol.md`
  - `.claude/skills/lp-do-build/SKILL.md`
  - `.claude/skills/lp-do-build/modules/build-biz.md`
  - `scripts/git-hooks/writer-lock-window.sh`
- Likely implementation surfaces:
  - a new offload helper in `scripts/agents/`
  - a pilot update to business-artifact executor guidance
  - plan/docs updates that define the patch artifact contract and fallback rules
- Deferred dependents:
  - `build-investigate.md`
  - `ops-ci-fix/SKILL.md`
  - queue wake-up tightening in `writer-lock.sh`

## Questions
### Resolved
- Q: Is there a narrow first lane that can prove patch-return without touching every executor?
  - A: Yes. `build-biz.md` is the safest first pilot because its outputs are bounded artifacts and its validation contract is already document-centric.
  - Evidence: `.claude/skills/lp-do-build/modules/build-biz.md`
- Q: Can `writer-lock-window.sh` be the first fix by itself?
  - A: No. It is only safe after mutable work is externalized from the shared checkout.
  - Evidence: `docs/plans/writer-lock-operational-hardening/queue-and-window-investigation.md`, `scripts/git-hooks/writer-lock-window.sh`
- Q: Does the current active offload protocol still need a CLI revalidation step?
  - A: Yes. The repo still documents `-a never`, but the current local help output no longer exposes that flag.
  - Evidence: local `codex exec --help`, active skill docs listed above

### Open (Needs Build Spike, Not Operator Input)
- Q: What is the safest current non-interactive Codex invocation for a patch-return session that does not rely on shared-checkout mutation?
- Q: Which returned patch format is most reliable for this repo's apply path: `apply_patch` text or unified diff?
- Q: Does `writer-lock-window.sh` need helper extensions once exercised against a real patch-return apply path, or is the current primitive sufficient?

## Confidence Inputs
- Implementation: 81%
  - Evidence basis: the pilot lane, protocol file, and lock-window primitives are directly identified.
  - What would raise this to >=90: a spike proving the current CLI invocation and patch artifact format.
- Approach: 79%
  - Evidence basis: patch-return is already the recommended design, but the exact CLI and patch contract need empirical confirmation.
  - What would raise this to >=90: a successful end-to-end pilot through `build-biz`.
- Impact: 84%
  - Evidence basis: moving even one executor lane off shared-checkout mutation materially reduces long lock holds in normal plan execution.
  - What would raise this to >=90: migration of a second lane after the pilot.
- Delivery-Readiness: 83%
  - Evidence basis: no operator input is missing; the main unknown is technical validation, not scope definition.
  - What would raise this to >=90: spike evidence that current Codex CLI behavior matches the proposed contract.
- Testability: 76%
  - Evidence basis: shell helpers and docs are testable, but lock-window behavior still needs an execution spike.
  - What would raise this to >=90: an automated regression around patch apply and fingerprint mismatch handling.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| The current Codex CLI no longer supports the legacy non-interactive approval flag pattern | High | High | Make CLI verification the first spike and checkpoint before any protocol rewrite |
| The first patch artifact contract proves too fragile for real plan tasks | Medium | High | Pilot business-artifact tasks first and keep shared-checkout fallback explicit |
| `writer-lock-window.sh` lacks one or more helpers needed for the apply path | Medium | Medium | Exercise it in a controlled spike before wiring the pilot executor |

## Scope Signal
- **Signal:** sequenced follow-on
- **Rationale:** the redesign is implementation work, but the current CLI contract and patch artifact format still need one empirical spike before the executor lane should be rewired.

## Primary Evidence List
- `docs/plans/writer-lock-operational-hardening/plan.md`
- `docs/plans/writer-lock-operational-hardening/build-offload-redesign.md`
- `docs/plans/writer-lock-operational-hardening/queue-and-window-investigation.md`
- `.claude/skills/_shared/build-offload-protocol.md`
- `.claude/skills/lp-do-build/SKILL.md`
- `.claude/skills/lp-do-build/modules/build-biz.md`
- `.claude/skills/lp-do-build/modules/build-investigate.md`
- `scripts/git-hooks/writer-lock-window.sh`

## Status
- Status: Ready-for-planning
- Primary execution skill: lp-do-build
