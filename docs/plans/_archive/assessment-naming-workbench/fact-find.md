---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: assessment-naming-workbench
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/assessment-naming-workbench/plan.md
Trigger-Why: HEAD assessment/ has 60 files. Most are intermediate naming artifacts (7 rounds of candidates, RDAP, shortlists, TM pre-screens) burying actual assessment outputs.
Trigger-Intended-Outcome: "type: operational | statement: Intermediate naming artifacts moved to assessment/naming-workbench/ for all businesses. Only final deliverables remain at assessment/ root. Naming CLI sidecar paths updated. | source: operator"
---

# Assessment Naming Workbench Fact-Find Brief

## Scope

### Summary

Assessment directories under `docs/business-os/strategy/<BIZ>/assessment/` contain a mix of final assessment deliverables and intermediate naming artifacts (candidate lists, RDAP lookups, TM pre-screens, shortlists, superseded files). HEAD has 58 files — 26 are naming intermediates. This buries the actual assessment outputs that drive decisions. The change moves intermediate naming artifacts into a `naming-workbench/` subdirectory per business while updating CLI sidecar paths and skill references.

### Goals

- Move intermediate naming artifacts to `assessment/naming-workbench/` for all businesses
- Keep only final deliverables at assessment/ root
- Update naming CLI sidecar paths (rdap-cli.ts, tm-prescreen-cli.ts) to use dynamic per-business resolution
- Fix skill path references that currently point to BIZ root instead of assessment/ subdirectory

### Non-goals

- Changing assessment skill logic or outputs
- Renaming or restructuring final assessment deliverables
- Modifying the assessment skill pipeline (01→15 sequence)

### Constraints & Assumptions

- Constraints:
  - Tests run in CI only — local verification limited to typecheck + lint
  - Writer lock required for all commits
  - Files are documentation/data — no runtime code depends on assessment file locations except naming CLIs and skill path constants
- Assumptions:
  - `naming-workbench/` is an acceptable subdirectory name (matches the dispatch intent)
  - All naming intermediate files can be identified by filename pattern: `*naming*` (covers naming-candidates-*, naming-shortlist-*, naming-rdap-*, naming-generation-spec-*, product-naming-*), `*candidate-names*` (covers candidate-names-prompt*, latest-candidate-names*, YYYY-MM-DD-candidate-names*), `*rdap*`, `*tm-prescreen*`, `*shortlist*`, `*generation-spec*`, plus sidecar dirs (`naming-sidecars/`, `product-naming-sidecars/`)

## Outcome Contract

- **Why:** HEAD assessment/ has 60 files. Most are intermediate naming artifacts (7 rounds of candidates, RDAP, shortlists, TM pre-screens) burying actual assessment outputs.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Intermediate naming artifacts moved to assessment/naming-workbench/ for all businesses. Only final deliverables remain at assessment/ root. Naming CLI sidecar paths updated.
- **Source:** operator

## Access Declarations

None — all data is local filesystem (docs/ and scripts/).

## Evidence Audit (Current State)

### Entry Points

- `docs/business-os/strategy/HEAD/assessment/` — largest assessment directory (58 files), primary target
- `scripts/src/startup-loop/naming/rdap-cli.ts` — CLI with hardcoded HEAD path for sidecar output
- `scripts/src/startup-loop/naming/tm-prescreen-cli.ts` — CLI with hardcoded HEAD path for sidecar output

### Key Modules / Files

- `docs/business-os/strategy/HEAD/assessment/` — 58 files, 33 naming intermediates + 2 sidecar dirs (`naming-sidecars/` with 1 file, `product-naming-sidecars/` with 1 file)
- `docs/business-os/strategy/HBAG/assessment/` — 33 files, 15 naming intermediates + 1 sidecar dir (`product-naming-sidecars/` with 1 file)
- `docs/business-os/strategy/PET/assessment/` — 10 files, 2 naming intermediates
- `docs/business-os/strategy/PWRB/assessment/` — 9 files, 5 naming intermediates
- `docs/business-os/strategy/BRIK/assessment/` — 6 files, 0 naming intermediates
- `scripts/src/startup-loop/naming/rdap-cli.ts:22-23` — hardcoded absolute path: `const SIDECAR_DIR = '/Users/petercowling/base-shop/docs/business-os/strategy/HEAD/assessment/naming-sidecars'` — writes to `naming-sidecars/` (brand naming RDAP pipeline)
- `scripts/src/startup-loop/naming/tm-prescreen-cli.ts:44-46` — hardcoded with env override: `const SIDECAR_DIR = process.env['TM_SIDECAR_DIR'] ?? '/Users/petercowling/base-shop/docs/business-os/strategy/HEAD/assessment/product-naming-sidecars'` — writes to `product-naming-sidecars/` (product naming TM pipeline, distinct from `naming-sidecars/`)
- `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md` — references `docs/business-os/strategy/<BIZ>/naming-candidates-*.md` (BIZ root, not assessment/)
- `.claude/skills/lp-do-assessment-05-name-selection/SKILL.md` — references `docs/business-os/strategy/<BIZ>/` for naming outputs
- `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md` — references `docs/business-os/strategy/<BIZ>/` for naming outputs

### Patterns & Conventions Observed

- Naming intermediates follow consistent filename patterns: `*-naming-candidates-*.md`, `*-rdap-*.md`, `*-tm-prescreen-*.md`, `*-naming-shortlist-*.md`, `*-naming-generation-spec-*.md` — evidence: `docs/business-os/strategy/HEAD/assessment/`
- Two distinct sidecar directory families exist:
  - `naming-sidecars/` — used by rdap-cli.ts (brand naming RDAP pipeline)
  - `product-naming-sidecars/` — used by tm-prescreen-cli.ts (product naming TM pipeline)
  - Both exist at BIZ root (empty) AND assessment/ (populated) for HEAD; HBAG has product-naming-sidecars at both levels
  - Evidence: `find strategy -type d -name "*sidecar*"`
- Assessment skills reference BIZ root paths (`docs/business-os/strategy/<BIZ>/`) for naming outputs, but actual files live inside assessment/ — evidence: skill SKILL.md files vs actual file locations
- CLI defaults hardcode HEAD-specific absolute paths — no per-business dynamic resolution — evidence: `rdap-cli.ts:22-23`, `tm-prescreen-cli.ts:44-46`

### Data & Contracts

- Types/schemas/events: No formal schema for assessment file naming. Convention-based only.
- Persistence: All files are markdown or JSON on local filesystem under `docs/business-os/strategy/`.
- API/contracts: Not applicable — no API layer involved.

### Dependency & Impact Map

- Upstream dependencies:
  - Assessment skills (04, 05, 13) write naming artifacts to assessment/ directories
  - rdap-cli.ts writes sidecar data to `assessment/naming-sidecars/` (brand naming RDAP pipeline)
  - tm-prescreen-cli.ts writes sidecar data to `assessment/product-naming-sidecars/` (product naming TM pipeline)
- Downstream dependents:
  - Assessment skill pipeline reads prior naming outputs when continuing from a previous round
  - No runtime code reads from assessment/ directories
  - No tests reference assessment/ paths
- Likely blast radius:
  - File moves: 55 naming intermediates across 4 businesses (HEAD: 33, HBAG: 15, PWRB: 5, PET: 2) + 3 sidecar dirs with data (HEAD: naming-sidecars/ + product-naming-sidecars/, HBAG: product-naming-sidecars/)
  - Code changes: 2 CLI files (rdap-cli.ts, tm-prescreen-cli.ts) — path constant updates
  - Skill updates: 3 SKILL.md files — path reference corrections
  - Empty sidecar directories at BIZ root to remove: HEAD/naming-sidecars/, HEAD/product-naming-sidecars/, HBAG/product-naming-sidecars/
  - Tests referencing assessment/ paths: `contract-lint.test.ts` (BRIK measurement path), `lp-do-ideas-trial.test.ts` (HBAG brand-identity + distribution plan paths) — these reference final deliverables, not naming intermediates, so no test updates needed

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (CI-only per testing policy)
- Commands: `pnpm test` (CI), `pnpm typecheck && pnpm lint` (local)
- CI integration: GitHub Actions reusable workflow

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| naming CLIs | None | No test files found | rdap-cli.ts and tm-prescreen-cli.ts have no test coverage |
| assessment skills | None | Skill execution is integration-tested through manual invocation only | No unit tests for skill path resolution |

#### Coverage Gaps
- Untested paths: naming CLI sidecar path resolution has no tests
- Extinct tests: none found

#### Testability Assessment
- Easy to test: CLI path resolution (pure function extractable)
- Hard to test: Skill SKILL.md path references (documentation, not code)

#### Recommended Test Approach
- No new tests needed — this is a file reorganisation + path constant update. Verification via typecheck + lint + grep for stale paths.

### Recent Git History (Targeted)
- Assessment directories have been stable — no recent structural changes
- Naming CLIs last modified for HEAD-specific naming rounds (no recent path changes)

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| File inventory per business | Yes | None | No |
| Naming intermediate classification | Yes | None | No |
| CLI path constants | Yes | None | No |
| Skill path references | Yes | [Scope gap] [Minor]: Skills 04/05/13 reference BIZ root; actual files in assessment/ — pre-existing mismatch, not introduced by this change | No |
| Sidecar directory inventory (naming-sidecars + product-naming-sidecars) | Yes | None — both sidecar families mapped with file counts at root (empty) and assessment/ (populated) levels | No |
| Test coverage for path changes | Yes | None — 2 test files reference assessment/ paths but only for final deliverables (not naming intermediates); no test updates needed | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The change scope (move 55 naming intermediates + 3 populated sidecar dirs, update 2 CLI constants, fix 3 skill references, remove 3 empty root-level sidecar dirs) is well-bounded. All affected files are identified, all consumers are mapped, and no runtime code or tests depend on naming intermediate paths. The skill path mismatch is a pre-existing issue that this change can fix opportunistically.

## Questions

### Resolved

- Q: Which files are "naming intermediates" vs "final deliverables"?
  - A: Naming intermediates match these find patterns: `-name "*naming*"` OR `-name "*candidate-names*"` OR `-name "*rdap*"` OR `-name "*tm-prescreen*"` OR `-name "*shortlist*"` OR `-name "*generation-spec*"` OR `-name "*product-naming*"`. This covers: naming-candidates-*, naming-shortlist-*, naming-rdap-*, naming-generation-spec-*, product-naming-*, candidate-names-prompt*, latest-candidate-names*, YYYY-MM-DD-candidate-names*, plus sidecar dirs (naming-sidecars/, product-naming-sidecars/). Validated counts: HEAD=33, HBAG=15, PET=2, PWRB=5. Final deliverables are everything else (brand dossiers, distribution plans, measurement plans, solution profiles, etc.)
  - Evidence: `find docs/business-os/strategy/HEAD/assessment -maxdepth 1 -type f \( -name "*naming*" -o -name "*candidate-names*" -o ... \)` — 33 matches

- Q: Do any tests reference assessment/ paths?
  - A: Yes, two test files reference assessment/ paths: `contract-lint.test.ts` (BRIK measurement path) and `lp-do-ideas-trial.test.ts` (HBAG brand-identity + distribution plan paths). However, these reference **final deliverables** (brand-identity-dossier, launch-distribution-plan, measurement-verification), not naming intermediates. No test updates are needed for this change.
  - Evidence: `grep "assessment/" scripts/src/startup-loop/__tests__/*.test.ts`

- Q: Are the empty sidecar directories at BIZ root (outside assessment/) safe to remove?
  - A: Yes. Three empty root-level sidecar directories exist: HEAD/naming-sidecars/ (0 files), HEAD/product-naming-sidecars/ (0 files), HBAG/product-naming-sidecars/ (0 files). The populated versions exist inside assessment/ (HEAD/assessment/naming-sidecars/ has 1 file, HEAD/assessment/product-naming-sidecars/ has 1 file, HBAG/assessment/product-naming-sidecars/ has 1 file). The CLIs write to assessment-level directories.
  - Evidence: `find strategy -type d -name "*sidecar*"` + file count per directory

- Q: Should the skill path references be fixed to point inside assessment/?
  - A: Yes. This is a pre-existing mismatch (skills say `<BIZ>/naming-candidates-*.md` but files are at `<BIZ>/assessment/naming-candidates-*.md`). Since we're reorganising, they should point to the new `<BIZ>/assessment/naming-workbench/` location.
  - Evidence: Diff between skill SKILL.md path references and actual file locations.

### Open (Operator Input Required)

No open questions. All decisions are agent-resolvable based on the dispatch intent and codebase evidence.

## Confidence Inputs

- Implementation: 90% — straightforward file moves + path constant updates; all files identified, all consumers mapped
  - To >=90: already there
- Approach: 90% — naming-workbench/ subdirectory is clear, pattern-based file classification is unambiguous
  - To >=90: already there
- Impact: 85% — reduces clutter in assessment/ roots; makes naming CLIs business-agnostic; fixes pre-existing skill path mismatch
  - To >=90: confirm no external tools or workflows reference assessment/ paths outside the repo
- Delivery-Readiness: 90% — no blocking dependencies; all code paths identified
  - To >=90: already there
- Testability: 80% — typecheck + lint + grep verification sufficient; no runtime code affected
  - To >=90: would need unit tests for CLI path resolution (low value for this change)

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Naming skill invocation writes to old path after move | Low | Medium | Update skill SKILL.md references in same PR |
| Undiscovered script references assessment/ paths | Low | Low | Comprehensive grep before committing |
| Git history harder to follow after file moves | Low | Low | Use `git mv` to preserve history; single commit per wave |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `git mv` for all file moves (preserve history)
  - Writer lock for commits
  - Update all path references in same commit as file moves
- Rollout/rollback expectations:
  - Single-branch change, no feature flags needed
  - Rollback: `git revert` on the commit
- Observability expectations:
  - None required — documentation reorganisation only

## Suggested Task Seeds (Non-binding)

1. Create naming-workbench/ subdirectories and move intermediate files + sidecar dirs (per business)
2. Update naming CLI path constants — rdap-cli.ts (naming-sidecars) and tm-prescreen-cli.ts (product-naming-sidecars) — to use dynamic per-business resolution instead of hardcoded HEAD absolute paths
3. Update assessment skill SKILL.md path references (04, 05, 13) to point inside assessment/naming-workbench/
4. Remove empty sidecar directories at BIZ root (HEAD/naming-sidecars/, HEAD/product-naming-sidecars/, HBAG/product-naming-sidecars/)
5. Verification: grep for stale paths, typecheck, lint

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: all naming intermediates in naming-workbench/; CLI paths dynamic; skill references correct; no stale path references; typecheck + lint pass
- Post-delivery measurement plan: none — documentation reorganisation only

## Evidence Gap Review

### Gaps Addressed
- Citation integrity: all file counts verified by `find` commands; CLI line numbers cited; skill references verified; two sidecar directory families (naming-sidecars + product-naming-sidecars) fully inventoried
- Boundary coverage: no API/auth/external boundaries involved
- Testing coverage: two test files reference assessment/ paths but only for final deliverables (brand-identity-dossier, launch-distribution-plan, measurement-verification) — not naming intermediates. No test updates needed.

### Confidence Adjustments
- No adjustments needed — initial scores reflect evidence quality

### Remaining Assumptions
- No external tools outside this repo reference assessment/ file paths (low risk — these are internal docs)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan assessment-naming-workbench --auto`
