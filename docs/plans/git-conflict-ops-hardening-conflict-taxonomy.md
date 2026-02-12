---
Type: Briefing
Status: Active
Domain: Repo/Git
Created: 2026-02-09
Last-updated: 2026-02-09
Relates-to: docs/plans/git-conflict-ops-hardening-plan.md
Task-ID: GIT-COH-01
---

# Git Conflict Taxonomy (Wave 1)

## Purpose
Document conflict classes, current manual handling, failure modes, and safe automation boundaries for `git-conflict-ops-hardening`.

## Evidence Sources
- `docs/git-safety.md`
- `AGENTS.md`
- `CODEX.md`
- `scripts/git/writer-lock.sh`
- `scripts/agents/integrator-shell.sh`

## Conflict Classes
| Class | Typical Signal | Manual Baseline | Common Failure Modes | Safe Automation Candidate | Human Required |
|---|---|---|---|---|---|
| Content vs content | `UU <file>` | Resolve hunks in editor, stage resolved file | Wrong hunk chosen, partial resolution, missed semantic regression | Pre-merge snapshot, unresolved-file inventory, staged-file audit | Final semantic decision on conflicting hunks |
| Add vs add | `AA <file>` | Compare both versions, merge final file manually | One version silently dropped, provenance unclear | Detect `AA`, require explicit resolution note before continue | Decide combined content and ownership |
| Rename vs delete | `UD`/`DU` + rename metadata | Decide keep renamed file or deletion, stage intent | Accidental resurrection/deletion, path confusion | Detect class and block auto-resolution; print decision checklist | Decision to keep/delete and target path |
| Lockfile conflict | lockfile marked conflict | Regenerate from manifests, verify, stage regenerated lockfile | Manual edit of lockfile, dependency drift, non-reproducible state | Enforce regenerate-only path (`pnpm install --lockfile-only`) + diff check | Validate dependency intent when regeneration introduces changes |
| Binary/generated artifact conflict | binary file conflict or generated file conflict | Rebuild/regenerate artifact, stage deterministic output | Attempted manual merge, stale generated output, hidden binary overwrite | Detect file type and force regenerate/rebuild path | Validate output correctness where no deterministic generator exists |
| Tree/directory rename conflict | tree conflict after directory moves | Reconcile target structure, move files, stage final tree | Orphaned/misplaced files, path loss in large renames | Pre/post tree inventory and missing-path detection | Final directory layout decisions |

## Manual Process Baseline
Current canonical flow:
1. Create safety anchor (`git rev-parse HEAD`, backup branch).
2. Fetch and additive merge (`git merge --no-ff origin/dev`).
3. Resolve conflicts file-by-file from `git diff --name-only --diff-filter=U`.
4. Regenerate lockfile from declarative sources if lockfile conflicts.
5. Run validation and push.

## Automation Boundaries
Safe to automate:
- Snapshot/anchor creation and metadata capture.
- Conflict class detection and explicit conflict inventory.
- Policy checks for forbidden command classes.
- Lockfile regenerate-and-verify workflow orchestration.
- No-loss assertions on pre/post state.

Must remain human decisions:
- Semantic hunk selection.
- Rename/delete intent and path strategy.
- Acceptance of regenerated dependency changes.
- Ambiguous binary artifact reconciliation.

## Fixture Matrix Seeds
| Fixture ID | Conflict Class | Minimal Setup | Expected Outcome |
|---|---|---|---|
| F-COH-001 | Content/content | Divergent edits on same lines | Script inventories class; human resolves; no-loss checks pass |
| F-COH-002 | Add/add | Same new path created differently on both branches | Script blocks auto-merge, requires explicit human resolution |
| F-COH-003 | Rename/delete | Branch A renames file, branch B deletes original | Script surfaces decision checklist; human confirms keep/delete path |
| F-COH-004 | Lockfile | Divergent dependency manifest updates | Script regenerates lockfile; manual lockfile edits are rejected |
| F-COH-005 | Binary/generated | Binary or generated artifact changed on both branches | Script enforces regenerate/rebuild path where possible |
| F-COH-006 | Tree conflict | Directory rename with concurrent nested edits | Script reports missing/orphan path diff pre/post resolution |

## Gaps Requiring Next Task
- Define exact snapshot mechanism contract (anchor branch vs ref marker) in GIT-COH-02.
- Define explicit no-loss check commands and thresholds in GIT-COH-02.
- Build reproducible fixture branches/scripts in GIT-COH-02.

