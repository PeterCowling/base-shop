---
Type: Plan
Status: Archived
Domain: Data
Workstream: Operations
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-03
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-root-containers
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Root Containers Plan

## Summary

Reorganise the flat `docs/business-os/startup-loop/` root (36 files, no structure) into 4 typed containers: `contracts/` (6), `schemas/` (14), `specifications/` (6), `operations/` (6) — 32 files total. Move 2 superseded/duplicate files to `_deprecated/` with a README (34 files moved overall). Keep the two registries at root as navigation hubs. Update all hardcoded path strings across TypeScript scripts (7 files), the CI check script (10 path occurrences), the BOS app contract-migration generator, skill docs (8 skills), and `@see` comments (6 files). Verify with typecheck and lint locally; tests gate via CI.

## Active tasks
- [ ] TASK-01: Create container directories and move files
- [ ] TASK-02: Update TypeScript hardcoded paths
- [ ] TASK-03: Update CI script paths
- [ ] TASK-04: Update BOS app contract-migration generator paths and re-generate
- [ ] TASK-05: Update skill references, @see comments, and registry files
- [ ] TASK-06: Verification — typecheck and lint

## Goals
- Startup-loop root reorganised into `contracts/`, `schemas/`, `specifications/`, `operations/` subdirectories
- All code and doc references updated — no stale paths remain
- Superseded files moved to `_deprecated/` with provenance README
- Existing subdirectories (`ideas/`, `self-evolving/`, `_generated/`, `evidence/`) untouched

## Non-goals
- Renaming or versioning any files (names stay identical)
- Restructuring existing subdirectories (`ideas/`, `self-evolving/`, etc.) — those are separate dispatches
- Changing file content beyond path references

## Constraints & Assumptions
- Constraints:
  - `contract-migration.yaml` is read at runtime by a generator script — must update path and re-run generation
  - Tests run in CI only — local verification limited to typecheck and lint
  - Writer lock required for commits
- Assumptions:
  - File classification in fact-find is complete (all 36 root files accounted for)
  - All hardcoded path strings identified with line numbers in fact-find
  - Same migration pattern as the domain container split just completed (known safe)

## Inherited Outcome Contract

- **Why:** startup-loop/ root has 36 files mixing schemas, contracts, guides, and registries. No structure makes navigation grep-dependent. As more contracts and schemas are added the directory becomes unnavigable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** startup-loop/ root reorganised into contracts/, schemas/, operations/, specifications/ subdirectories. All code and doc references updated. No stale paths remain.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-root-containers/fact-find.md`
- Key findings used:
  - 36 files classified into 6 categories with code/skill reference counts
  - 40+ path strings across scripts, tests, CI scripts, and skills enumerated with line numbers
  - `contract-migration.yaml` runtime integration fully traced (generator → generated TS → API routes → tests)
  - Proposed 4-container structure validated by simulation trace

## Proposed Approach
- Option A: Move all files in one batch, update all references, verify — single linear sequence
- Option B: Move files, then update references in parallel waves, verify — faster with parallelism
- Chosen approach: Option B — file moves first (TASK-01), then 4 parallel reference-update tasks (TASK-02 through TASK-05), then verification (TASK-06). This is the same pattern used for the domain container split.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create container directories and move files | 90% | M | Complete (2026-03-03) | - | TASK-02, TASK-03, TASK-04, TASK-05 |
| TASK-02 | IMPLEMENT | Update TypeScript hardcoded paths | 90% | S | Complete (2026-03-03) | TASK-01 | TASK-06 |
| TASK-03 | IMPLEMENT | Update CI script paths | 90% | S | Complete (2026-03-03) | TASK-01 | TASK-06 |
| TASK-04 | IMPLEMENT | Update BOS app contract-migration generator paths and re-generate | 85% | S | Complete (2026-03-03) | TASK-01 | TASK-06 |
| TASK-05 | IMPLEMENT | Update skill references, @see comments, and registry files | 90% | S | Complete (2026-03-03) | TASK-01 | TASK-06 |
| TASK-06 | IMPLEMENT | Verification — typecheck and lint | 90% | S | Complete (2026-03-03) | TASK-02, TASK-03, TASK-04, TASK-05 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | File moves must complete first — all subsequent waves reference new paths |
| 2 | TASK-02, TASK-03, TASK-04, TASK-05 | TASK-01 | Independent reference updates — safe to parallelize |
| 3 | TASK-06 | TASK-02, TASK-03, TASK-04, TASK-05 | Typecheck + lint gate — must run after all references updated; tests gate via CI push |

## Tasks

### TASK-01: Create container directories and move files
- **Type:** IMPLEMENT
- **Deliverable:** code-change — 4 new directories, 32 files moved to containers + 2 to `_deprecated/` (34 total), README created
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-03)
- **Affects:** `docs/business-os/startup-loop/` (all 36 root files)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05
- **Confidence:** 90%
  - Implementation: 90% - all 36 files classified with target directories; git mv is atomic and reversible
  - Approach: 90% - same git mv pattern used successfully in domain container split
  - Impact: 90% - no behavioral change, purely organizational; existing subdirectories untouched
- **Acceptance:**
  - `contracts/` contains 6 files: aggregate-pack-contracts.md, audit-cadence-contract-v1.md, loop-output-contracts.md, marketing-sales-capability-contract.md, s10-weekly-orchestration-contract-v1.md, website-iteration-throughput-report-contract.md
  - `schemas/` contains 14 files: baseline-prior-schema.md, bottleneck-diagnosis-schema.md, briefing-contract-schema-v1.md, carry-mode-schema.md, demand-evidence-pack-schema.md, event-state-schema.md, hygiene-schema.md, learning-ledger-schema.md, manifest-schema.md, retention-schema.md, s10-weekly-packet-schema-v1.md, sales-ops-schema.md, stage-operator-dictionary.schema.json, stage-result-schema.md
  - `specifications/` contains 6 files: autonomy-policy.md, loop-spec.yaml, process-assignment-v2.yaml, stage-operator-dictionary.yaml, two-layer-model.md, workstream-workflow-taxonomy-v2.yaml
  - `operations/` contains 6 files: 2026-02-26-reflection-prioritization-expert-brief.user.md, OCTORATE-DATA-STATUS.md, contract-migration.yaml, exception-runbooks-v1.md, naming-pipeline-v2-operator-guide.user.md, octorate-data-collection-protocol.md
  - `_deprecated/` contains 3 files: README.md, process-registry-v1.md, workstream-workflow-taxonomy-v2.md
  - `artifact-registry.md` and `process-registry-v2.md` remain at root
  - No files left orphaned at root (except registries and existing subdirectories)
- **Validation contract (TC-01):**
  - TC-01: `ls docs/business-os/startup-loop/contracts/` lists exactly 6 files
  - TC-02: `ls docs/business-os/startup-loop/schemas/` lists exactly 14 files
  - TC-03: `ls docs/business-os/startup-loop/specifications/` lists exactly 6 files
  - TC-04: `ls docs/business-os/startup-loop/operations/` lists exactly 6 files
  - TC-05: `ls docs/business-os/startup-loop/_deprecated/` lists exactly 3 files (README.md + 2 deprecated)
  - TC-06: Only `artifact-registry.md`, `process-registry-v2.md`, and subdirectories remain at root
- **Execution plan:**
  1. Create 5 directories: `contracts/`, `schemas/`, `specifications/`, `operations/`, `_deprecated/`
  2. `git mv` 6 contract files to `contracts/`
  3. `git mv` 14 schema files to `schemas/`
  4. `git mv` 6 specification files to `specifications/`
  5. `git mv` 5 operation files + misplaced expert brief to `operations/`
  6. `git mv` process-registry-v1.md and workstream-workflow-taxonomy-v2.md to `_deprecated/`
  7. Write `_deprecated/README.md` documenting supersession dates
  8. Verify file counts match acceptance criteria
- **Planning validation (required for M/L):**
  - Checks run: verified all 36 files exist at root via fact-find investigation
  - Validation artifacts: fact-find.md File Classification tables
  - Unexpected findings: none
- **Consumer tracing (required for M/L):**
  - No new outputs introduced — only path changes
  - All consumers of moved files enumerated in fact-find (7 TS files, 1 CI script, 8 skills, 6 @see comments, BOS app generator)
  - Each consumer group addressed in TASK-02 through TASK-05
- **Scouts:** None: all files verified to exist in fact-find; git mv is safe and reversible
- **Edge Cases & Hardening:**
  - If any file was renamed/deleted since fact-find: `git mv` will fail visibly — fix by checking `git status` first
  - Existing subdirectories (ideas/, self-evolving/, _generated/, evidence/) must not be touched
- **What would make this >=90%:**
  - Already at 90% — file list is exhaustive and git mv is deterministic
- **Rollout / rollback:**
  - Rollout: single commit with all moves
  - Rollback: `git revert <commit>` restores flat structure
- **Documentation impact:** _deprecated/README.md created
- **Notes / references:**
  - Same migration pattern as bos-standing-data-domain-container-split

### TASK-02: Update TypeScript hardcoded paths
- **Type:** IMPLEMENT
- **Deliverable:** code-change — 7 TypeScript files updated with new paths
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Affects:** `scripts/src/startup-loop/validate-process-assignment.ts`, `scripts/src/startup-loop/generate-stage-operator-views.ts`, `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`, `scripts/src/startup-loop/__tests__/validate-process-assignment.test.ts`, `scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts`, `scripts/src/startup-loop/__tests__/website-contract-parity.test.ts`, `scripts/src/startup-loop/__tests__/s10-packet-linkage.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 90%
  - Implementation: 90% - all 7 files and line numbers enumerated in fact-find; mechanical find-and-replace
  - Approach: 90% - string substitution in hardcoded path constants
  - Impact: 90% - paths are the only change; no logic modification
- **Acceptance:**
  - All paths in the 7 files point to new container subdirectories
  - No references to old flat-root paths remain in these files
- **Validation contract (TC-02):**
  - TC-01: `grep -r "startup-loop/process-assignment-v2.yaml" scripts/src/` returns 0 matches (old path gone)
  - TC-02: `grep -r "startup-loop/specifications/process-assignment-v2.yaml" scripts/src/` returns matches (new path present)
  - TC-03: `grep -r "startup-loop/stage-operator-dictionary.yaml" scripts/src/` returns 0 matches for old root path
  - TC-04: `grep -r "startup-loop/loop-spec.yaml" scripts/src/` returns 0 matches for old root path
  - TC-05: `grep -r "startup-loop/s10-weekly-packet-schema-v1.md" scripts/src/` returns 0 matches for old root path
- **Execution plan:**
  1. In `validate-process-assignment.ts`: update paths at lines ~316, ~320 to `specifications/process-assignment-v2.yaml` and `specifications/workstream-workflow-taxonomy-v2.yaml`
  2. In `generate-stage-operator-views.ts`: update path at line ~627 to `specifications/stage-operator-dictionary.yaml`
  3. In test files: update all hardcoded path strings to include container subdirectory
  4. Grep to confirm no old paths remain
- **Planning validation:** None: S-effort task with exhaustive path enumeration
- **Scouts:** None: paths enumerated with line numbers
- **Edge Cases & Hardening:** If line numbers have shifted since fact-find, use grep to locate current positions
- **What would make this >=90%:** Already at 90%
- **Rollout / rollback:**
  - Rollout: committed with other reference updates
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:** Fact-find § Code Reference Summary → Hardcoded path strings in TypeScript

### TASK-03: Update CI script paths
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/check-startup-loop-contracts.sh` updated
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Affects:** `scripts/check-startup-loop-contracts.sh`
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 90%
  - Implementation: 90% - 10 path occurrences across 7 unique files at known lines; single script; mechanical substitution
  - Approach: 90% - find-and-replace within shell script path strings
  - Impact: 90% - CI script validates contracts exist at expected paths; updating paths keeps validation working
- **Acceptance:**
  - All 10 path occurrences (7 unique files) in `check-startup-loop-contracts.sh` point to new container paths
  - No old root-level paths remain in the script
- **Validation contract (TC-03):**
  - TC-01: `grep "startup-loop/loop-spec.yaml" scripts/check-startup-loop-contracts.sh` returns 0 matches (old path)
  - TC-02: `grep "startup-loop/specifications/loop-spec.yaml" scripts/check-startup-loop-contracts.sh` returns matches (new path)
  - TC-03: `grep "startup-loop/contract-migration.yaml" scripts/check-startup-loop-contracts.sh` returns 0 matches (old path)
- **Execution plan:**
  1. Read `scripts/check-startup-loop-contracts.sh`
  2. Update 10 path occurrences at lines ~102, ~106, ~109, ~414, ~506, ~524, ~525, ~526, ~527, ~552:
     - `loop-spec.yaml` → `specifications/loop-spec.yaml`
     - `autonomy-policy.md` → `specifications/autonomy-policy.md`
     - `stage-operator-dictionary.yaml` → `specifications/stage-operator-dictionary.yaml`
     - `event-state-schema.md` → `schemas/event-state-schema.md`
     - `manifest-schema.md` → `schemas/manifest-schema.md`
     - `stage-result-schema.md` → `schemas/stage-result-schema.md`
     - `contract-migration.yaml` → `operations/contract-migration.yaml`
  3. Grep to confirm no old paths remain
- **Planning validation:** None: S-effort task
- **Scouts:** None: line numbers from fact-find
- **Edge Cases & Hardening:** Shell script may use path fragments rather than full paths — check surrounding context to avoid partial matches
- **What would make this >=90%:** Already at 90%
- **Rollout / rollback:**
  - Rollout: committed with other reference updates
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:** Fact-find § CI script references

### TASK-04: Update BOS app contract-migration generator paths and re-generate
- **Type:** IMPLEMENT
- **Deliverable:** code-change — generator script path updated, generated TypeScript refreshed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Affects:** `apps/business-os/scripts/generate-contract-migration.mjs`, `apps/business-os/src/lib/contract-migration.generated.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - generator script path is known; re-generation is deterministic; but generated output diff must be reviewed
  - Approach: 90% - update path → re-run generator → verify output unchanged except path
  - Impact: 85% - contract-migration is used at runtime in BOS app API routes; must verify no behavioral change
- **Acceptance:**
  - Generator script reads from `docs/business-os/startup-loop/operations/contract-migration.yaml`
  - Re-generated `contract-migration.generated.ts` is functionally identical (only source-path comment may differ)
  - BOS app still compiles
- **Validation contract (TC-04):**
  - TC-01: `grep "contract-migration.yaml" apps/business-os/scripts/generate-contract-migration.mjs` shows new path
  - TC-02: `node apps/business-os/scripts/generate-contract-migration.mjs` exits 0
  - TC-03: `git diff apps/business-os/src/lib/contract-migration.generated.ts` shows only path comment changes (if any)
- **Execution plan:**
  1. Read `apps/business-os/scripts/generate-contract-migration.mjs` — locate path string
  2. Update path from `startup-loop/contract-migration.yaml` to `startup-loop/operations/contract-migration.yaml`
  3. Run generator: `node apps/business-os/scripts/generate-contract-migration.mjs`
  4. Diff generated output to confirm only path-related changes
  5. Check for any other consumers: `apps/business-os/src/lib/contract-migration.ts`, `stage-doc-paths.ts`, API routes — these consume the generated TS, not the YAML directly, so should be unaffected
- **Planning validation:** None: S-effort task
- **Scouts:** Generator may embed source path in a comment — if so, generated output will have a small diff. This is expected and acceptable.
- **Edge Cases & Hardening:**
  - If generator embeds absolute path: verify the path resolves correctly from the repo root
  - Consumer chain: generated.ts → contract-migration.ts → stage-doc-paths.ts → API routes. Only the generator reads the YAML; downstream consumers read the generated TS module. No downstream changes needed.
- **What would make this >=90%:**
  - Confirming generated output is byte-identical except for any source-path comment
- **Rollout / rollback:**
  - Rollout: committed with other reference updates
  - Rollback: `git revert` + re-run generator
- **Documentation impact:** None
- **Notes / references:** Fact-find § BOS app references (contract-migration.yaml)

### TASK-05: Update skill references, @see comments, and registry files
- **Type:** IMPLEMENT
- **Deliverable:** code-change — 8 skill docs, 6 TypeScript files (@see), and registry files updated
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Affects:** `.claude/skills/lp-weekly/SKILL.md`, `.claude/skills/lp-weekly/modules/orchestrate.md`, `.claude/skills/lp-channels/SKILL.md`, `.claude/skills/lp-baseline-merge/SKILL.md`, `.claude/skills/lp-do-build/SKILL.md`, `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-fact-find/modules/outcome-a-loop-gap.md`, `.claude/skills/startup-loop/SKILL.md`, `.claude/skills/startup-loop/modules/assessment-intake-sync.md`, `.claude/skills/lp-readiness/SKILL.md`, `.claude/skills/_shared/workspace-paths.md`, `scripts/src/startup-loop/baseline-merge.ts`, `scripts/src/startup-loop/event-validation.ts`, `scripts/src/startup-loop/derive-state.ts`, `scripts/src/startup-loop/manifest-update.ts`, `scripts/src/startup-loop/run-concurrency.ts`, `scripts/src/startup-loop/recovery.ts`, `docs/registry.json`, `docs/business-os/startup-loop/ideas/standing-registry.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 90%
  - Implementation: 90% - all references enumerated in fact-find; text-only changes; no runtime impact
  - Approach: 90% - find-and-replace in markdown/comment strings
  - Impact: 90% - skill docs and @see comments are advisory only; registry files are low-risk
- **Acceptance:**
  - All 11 skill path references point to new container subdirectories
  - All 6 @see comment paths updated
  - Registry files updated if they contain startup-loop root paths
  - No old root-level paths remain in affected files
- **Validation contract (TC-05):**
  - TC-01: `grep -r "startup-loop/loop-spec.yaml" .claude/skills/` returns 0 matches
  - TC-02: `grep -r "startup-loop/specifications/loop-spec.yaml" .claude/skills/` returns expected matches
  - TC-03: `grep -r "startup-loop/event-state-schema.md" scripts/src/startup-loop/` returns 0 matches for old root path
  - TC-04: `grep -r "startup-loop/schemas/event-state-schema.md" scripts/src/startup-loop/` returns expected matches
- **Execution plan:**
  1. Update 11 skill references across 8 skills:
     - `loop-spec.yaml` → `specifications/loop-spec.yaml` (5 skill refs)
     - `s10-weekly-orchestration-contract-v1.md` → `contracts/s10-weekly-orchestration-contract-v1.md`
     - `audit-cadence-contract-v1.md` → `contracts/audit-cadence-contract-v1.md`
     - `demand-evidence-pack-schema.md` → `schemas/demand-evidence-pack-schema.md`
     - `stage-result-schema.md` → `schemas/stage-result-schema.md`
     - `manifest-schema.md` → `schemas/manifest-schema.md`
     - `event-state-schema.md` → `schemas/event-state-schema.md`
     - `bottleneck-diagnosis-schema.md` → `schemas/bottleneck-diagnosis-schema.md`
     - `carry-mode-schema.md` → `schemas/carry-mode-schema.md`
     - `loop-output-contracts.md` → `contracts/loop-output-contracts.md`
  2. Update 6 @see comments in TypeScript files
  3. Check and update `docs/registry.json` and `standing-registry.json` if they contain affected paths
  4. Grep to confirm no old paths remain
- **Planning validation:** None: S-effort task
- **Scouts:** None: all references enumerated
- **Edge Cases & Hardening:**
  - Skill docs may reference paths in multiple contexts (prose, code blocks, file lists) — use grep to find all occurrences, not just the ones listed
  - Run comprehensive `grep -r "startup-loop/[filename]" .claude/skills/` for each moved file to catch references not enumerated in fact-find
  - `.claude/skills/_shared/queue-check-gate.md` references `startup-loop/ideas/trial/queue-state.json` — this is in the `ideas/` subdirectory (untouched), not a root file; no update needed
- **What would make this >=90%:** Already at 90%
- **Rollout / rollback:**
  - Rollout: committed with other reference updates
  - Rollback: `git revert`
- **Documentation impact:** Skill documentation paths updated for navigation accuracy
- **Notes / references:** Fact-find § Skill references + Comment-only references

### TASK-06: Verification — typecheck and lint
- **Type:** IMPLEMENT
- **Deliverable:** code-change — fix any stale references found; verify compilation
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Affects:** `scripts/src/startup-loop/`, `apps/business-os/`, `.claude/skills/`
- **Depends on:** TASK-02, TASK-03, TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - typecheck and lint are standard operations
  - Approach: 90% - scoped validation via changed-package filtering
  - Impact: 90% - verification catches any missed references
- **Acceptance:**
  - Typecheck passes for affected packages (or pre-existing failures only)
  - Lint passes for affected packages (or pre-existing failures only)
  - No grep matches for old startup-loop root paths in moved-file filenames across the entire repo
  - Tests pass via CI after push (tests run in CI only per repo policy)
- **Validation contract (TC-06):**
  - TC-01: `pnpm --filter scripts typecheck` exits 0
  - TC-02: `pnpm --filter business-os typecheck` exits 0
  - TC-03: Comprehensive grep for old root-level paths returns 0 matches (excluding `_deprecated/` references and plan docs)
- **Execution plan:**
  1. Run comprehensive grep across entire repo for each moved filename at its old root path — fix any stale references found
  2. Run scoped typecheck for affected packages: `pnpm --filter scripts typecheck` and `pnpm --filter business-os typecheck`
  3. Run scoped lint for affected packages: `pnpm --filter scripts lint` and `pnpm --filter business-os lint`
  4. Tests gate via CI push — verify pass via `gh run watch` after commit
- **Planning validation:** None: S-effort verification task
- **Scouts:** None: verification task
- **Edge Cases & Hardening:**
  - Pre-existing typecheck/lint failures: compare against known baseline, only investigate new failures
  - Grep may find references in plan docs or fact-find — exclude `docs/plans/startup-loop-root-containers/` from search
  - If comprehensive grep finds references not covered by TASK-02 through TASK-05, fix them in this task (controlled scope expansion)
- **What would make this >=90%:** Already at 90%
- **Rollout / rollback:**
  - Rollout: n/a (verification + fixup)
  - Rollback: n/a
- **Documentation impact:** None
- **Notes / references:** Tests run in CI only per testing policy; local verification covers typecheck + lint

## Risks & Mitigations
1. **contract-migration.yaml runtime path** — generator script reads by path. Mitigation: TASK-04 updates path and re-runs generation; TASK-06 verifies compilation.
2. **loop-spec.yaml is the most-referenced file** — 5+ skill refs, 2 test refs, 1 CI ref. Mitigation: comprehensive grep in TASK-06 catches any misses.
3. **Line numbers may have shifted** — fact-find recorded specific lines. Mitigation: use grep to locate current positions rather than relying on fixed line numbers.

## Observability
- Logging: None: file reorganisation with no runtime behavior change
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] All 32 root files moved to 4 containers (contracts/6, schemas/14, specifications/6, operations/6) + 2 to `_deprecated/` (34 total)
- [ ] `_deprecated/` contains README + 2 superseded files
- [ ] Registries remain at root
- [ ] All code references updated (TS paths, CI script, BOS generator, skills, @see comments)
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] No stale root-level paths found by comprehensive grep

## Decision Log
- 2026-03-03: Chose 4-container structure (contracts, schemas, specifications, operations) based on file classification in fact-find. Registries stay at root as navigation hubs.
- 2026-03-03: Chose parallel reference-update approach (Wave 2) for throughput — reference updates are independent.

## Overall-confidence Calculation
- TASK-01: 90% * M(2) = 180
- TASK-02: 90% * S(1) = 90
- TASK-03: 90% * S(1) = 90
- TASK-04: 85% * S(1) = 85
- TASK-05: 90% * S(1) = 90
- TASK-06: 90% * S(1) = 90
- Sum weights: 2+1+1+1+1+1 = 7
- Overall = 625/7 = 89.3% → 89% (rounding rule: nearest 5% → 90%, but 89% is closer to 90% — however anti-bias downward rule applies → 85%)

Corrected: 625/7 = 89.3%. Nearest multiples of 5 are 85% and 90%. Downward bias → **88%** (plan-level weighted average is not subject to the multiple-of-5 rule; that applies to individual dimension scores only).

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create containers + move files | Yes | None — all files exist at root, directories don't yet exist | No |
| TASK-02: Update TS paths | Yes (TASK-01) | None — all 7 files and path strings enumerated | No |
| TASK-03: Update CI script | Yes (TASK-01) | None — single file, 10 path occurrences at known lines | No |
| TASK-04: Update BOS generator | Yes (TASK-01) | None — generator path is straightforward; re-generation is deterministic | No |
| TASK-05: Update skills + comments + registries | Yes (TASK-01) | None — all references enumerated; text-only changes | No |
| TASK-06: Verification | Yes (TASK-02-05) | None — scoped typecheck + lint locally; tests gate via CI push | No |
