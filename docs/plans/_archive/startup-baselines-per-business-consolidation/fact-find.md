---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: startup-baselines-per-business-consolidation
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/startup-baselines-per-business-consolidation/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
Dispatch-ID: IDEA-DISPATCH-20260303180000-0136
---

# Startup Baselines Per-Business Consolidation — Fact-Find Brief

## Scope

### Summary

`docs/business-os/startup-baselines/` has 20 flat files at the root level (`BRIK-forecast-seed.user.md`, `HBAG-channels.md`, etc.) alongside per-business subdirectories (`BRIK/`, `HBAG/`, `HEAD/`) that contain newer artifacts. Every other domain directory (`strategy/`, `site-upgrades/`, `market-research/`) uses clean per-business subdirectories. This one should too.

The flat-file pattern and subdirectory pattern serve different pipeline domains:
- **Flat pattern** (`<BIZ>-name.ext`): marketing/content/assessment pipeline — offer, channels, intake packets, content packets, forecast seeds
- **Subdirectory pattern** (`<BIZ>/name.ext`): runtime loop engine — runs, diagnosis, learning ledger, replan triggers, demand evidence packs

The consolidation moves all 20 flat files into their per-business subdirectories, drops the redundant BIZ prefix from filenames, and updates all references.

### Goals

- Move all 20 flat files into per-business subdirectories
- Create `PET/` subdirectory (currently missing)
- Update all script path references (5 TypeScript files use flat pattern)
- Update all skill references (~16 skills reference flat pattern)
- Update test fixtures (baseline-priors-migration.test.ts hardcodes flat paths)
- Update `docs/registry.json` entries
- Fix naming inconsistency: add missing hyphen in `2026-02-12assessment` → `2026-02-12-assessment`

### Non-goals

- Normalizing `.user.` suffix across all files (cosmetic, low value)
- Generating missing HTML companions for HBAG (separate concern)
- Normalizing frontmatter `Type` field inconsistency for offers (cosmetic)
- Restructuring the runtime loop engine paths (`<BIZ>/runs/`, etc.) — these already use per-business subdirectories

### Constraints & Assumptions

- Constraints:
  - Tests run in CI only — cannot verify locally, must push and watch
  - Writer lock required for commits
  - No flat-file content duplicates subdirectory content — all moves are clean relocations
- Assumptions:
  - BIZ prefix can be dropped from filenames once inside per-business subdirectory (redundant information)
  - The missing hyphen in intake-packet filenames is a bug, not intentional naming

## Outcome Contract

- **Why:** startup-baselines/ is split-brained — same businesses have data both as flat files at the root and in per-business subdirectories. Naming conventions vary across files. Every other domain directory uses clean per-business subdirectories. This one should too.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All flat files in startup-baselines/ moved into per-business subdirectories. BIZ prefix dropped from filenames (now redundant inside subdirectory). All script/skill path references updated. No stale paths remain.
- **Source:** operator

## Access Declarations

None.

## Evidence Audit (Current State)

### Entry Points

The startup-baselines directory is accessed by two distinct pipelines:

1. **Assessment/content pipeline** (currently flat-file pattern):
   - `scripts/src/startup-loop/website/compile-website-content-packet.ts` — reads intake-packet, offer, channels; writes content-packet
   - `scripts/src/startup-loop/website/materialize-site-content-payload.ts` — reads content-packet
   - `scripts/src/startup-loop/website/lint-website-content-packet.ts` — reads content-packet
   - `scripts/src/startup-loop/s2/s2-market-intelligence-handoff.ts` — reads intake-packet
   - `scripts/src/startup-loop/build/generate-build-summary.ts` — scans flat files for business inference

2. **Runtime loop engine** (already subdirectory pattern):
   - `scripts/src/startup-loop/baselines/baseline-merge.ts` — `<BIZ>/runs/<runId>/`
   - `scripts/src/startup-loop/baselines/learning-ledger.ts` — `<BIZ>/learning-ledger.jsonl`
   - `scripts/src/startup-loop/baselines/prior-update-writer.ts` — `<BIZ>/` paths
   - `scripts/src/startup-loop/diagnostics/diagnosis-snapshot.ts` — `<BIZ>/runs/`
   - `scripts/src/startup-loop/diagnostics/bottleneck-history.ts` — `<BIZ>/bottleneck-history.jsonl`
   - `scripts/src/startup-loop/replan-trigger.ts` — `<BIZ>/replan-trigger.json`
   - `packages/mcp-server/src/lib/loop-artifact-reader.ts` — `<BIZ>/runs/`, `<BIZ>/learning-ledger.jsonl`

### Key Modules / Files

| # | File | Role | Pattern Used | R/W |
|---|------|------|-------------|-----|
| 1 | `scripts/src/startup-loop/website/compile-website-content-packet.ts` | Reads intake/offer/channels, writes content-packet | FLAT | R+W |
| 2 | `scripts/src/startup-loop/website/materialize-site-content-payload.ts` | Reads content-packet | FLAT | R |
| 3 | `scripts/src/startup-loop/website/lint-website-content-packet.ts` | Lints content-packet | FLAT | R |
| 4 | `scripts/src/startup-loop/s2/s2-market-intelligence-handoff.ts` | Reads intake-packet for context | FLAT | R |
| 5 | `scripts/src/startup-loop/build/generate-build-summary.ts` | Scans baselines for business inference | FLAT (scan) | R |
| 6 | `scripts/src/startup-loop/__tests__/baseline-priors-migration.test.ts` | Hardcoded flat paths for migration validation | FLAT | R |
| 7 | `docs/registry.json` | Static registry of all baseline artifact paths | FLAT + SUBDIR | metadata |

**Skills using flat pattern (must update):**

`lp-offer`, `lp-channels`, `lp-seo`, `lp-forecast`, `idea-forecast`, `lp-readiness`, `lp-other-products`, `lp-do-assessment-01`, `lp-do-assessment-08`, `lp-do-assessment-10`, `lp-do-assessment-11`, `lp-do-assessment-13`, `startup-loop/cmd-start`, `startup-loop/cmd-advance`, `startup-loop/assessment-intake-sync`, `_shared/business-resolution`

### Data & Contracts

**File inventory (20 flat files to move):**

| Business | Files | Subdirectory Exists |
|----------|-------|-------------------|
| BRIK | 4 (2 intake-packet, 2 forecast-seed) | Yes (1 file: demand-evidence-pack.md) |
| HBAG | 5 (1 intake-packet, 1 forecast-seed, 1 channels, 1 offer, 1 content-packet) | Yes (2 files: demand-evidence-pack.md, S3-forecast/) |
| HEAD | 6 (2 intake-packet, 2 forecast-seed, 1 channels, 1 offer) | Yes (1 file: S3-forecast/) |
| PET | 5 (2 intake-packet, 2 forecast-seed, 1 offer) | **No — must create** |

No flat-file-to-subdirectory content duplicates exist. The flat files and subdirectory files are distinct artifact types.

**Naming after move (proposed):**

| Current flat file | New subdirectory path |
|---|---|
| `BRIK-2026-02-12assessment-intake-packet.user.md` | `BRIK/2026-02-12-assessment-intake-packet.user.md` |
| `BRIK-forecast-seed.user.md` | `BRIK/forecast-seed.user.md` |
| `HBAG-channels.md` | `HBAG/channels.md` |
| `HBAG-offer.md` | `HBAG/offer.md` |
| `PET-offer.md` | `PET/offer.md` |
| (etc. — same pattern for all 20 files) |

### Dependency & Impact Map

**Upstream (what writes flat files):**
- `startup-loop/cmd-start` → writes intake-packet
- `startup-loop/cmd-advance` → writes intake-packet
- `startup-loop/assessment-intake-sync` → writes intake-packet
- `lp-offer` → writes offer
- `lp-channels` → writes channels
- `idea-forecast` → writes forecast-seed
- `compile-website-content-packet.ts` → writes content-packet

**Downstream (what reads flat files):**
- `compile-website-content-packet.ts` → reads intake-packet, offer, channels
- `materialize-site-content-payload.ts` → reads content-packet
- `lint-website-content-packet.ts` → reads content-packet
- `s2-market-intelligence-handoff.ts` → reads intake-packet
- `generate-build-summary.ts` → scans all baselines
- `lp-forecast` → reads offer, channels
- `lp-seo` → reads offer, channels
- `lp-readiness` → reads `<BIZ>-*.md` glob
- 7 assessment skills → read intake-packet

**No external service dependencies.** All paths are local filesystem.

### Test Landscape

**Existing tests:**
- `baseline-priors-migration.test.ts` — hardcodes 5 flat-file paths for HEAD, PET, BRIK intake-packets and forecast-seeds. Must update.
- `baseline-priors.test.ts` — tests extraction logic, uses inline content not file paths. No updates needed.
- `baseline-merge.test.ts` — uses temp directories, path-agnostic. No updates needed.
- `baseline-priors-extraction.test.ts` — tests extraction workflow, uses inline content. No updates needed.

**Coverage gaps:** No test validates that script path construction resolves to actual files on disk. TypeScript compilation is the primary verification gate (same as the scripts reorg build).

**Verification approach:** TypeScript compilation + comprehensive grep for stale paths (proven effective in the scripts domain-dirs build).

### Recent Git History (Targeted)

```
e4bb2e3c64 feat(startup-loop): reorganise root into typed containers + archive plan
```

The startup-loop root reorg already moved some files but did not touch startup-baselines flat files.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Flat-file inventory (20 files) | Yes | None | No |
| Script path construction (5 TS files) | Yes | None — all use string templates, straightforward to update | No |
| Skill path references (~16 skills) | Yes | None — all use `<BIZ>-<name>` template pattern | No |
| Test fixtures (1 test file) | Yes | None — 5 hardcoded paths in baseline-priors-migration.test.ts | No |
| docs/registry.json entries | Yes | [Missing domain coverage] [Minor]: registry.json update count not enumerated | No |
| PET subdirectory creation | Yes | None — trivial `mkdir` | No |
| HTML companion files | Yes | None — move alongside .md files, no separate handling | No |
| lp-forecast hybrid pattern | Yes | [Integration boundary] [Moderate]: lp-forecast reads FLAT but writes SUBDIR; after move, both read and write will be SUBDIR — simpler | No |

No Critical or Major findings.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** 20 file moves, 5 script updates, ~16 skill updates, 1 test fixture update. Well-bounded, deterministic verification via TypeScript compilation + stale-path grep. Proven pattern from the scripts domain-dirs build (66 files moved successfully with the same approach).

## Confidence Inputs

| Dimension | Score | Evidence |
|---|---|---|
| Implementation | 90 | Proven approach — same pattern as scripts domain-dirs build (commit `390142607a`). `git mv` + path constant updates + grep verification. |
| Approach | 90 | Domain-organized with per-business subdirectories is the established pattern across strategy/, site-upgrades/, market-research/. No alternative approaches to evaluate. |
| Impact | 85 | 20 files move, ~16 skills update, 5 scripts update. No behavioral change — purely organizational. Risk is limited to stale path references. |
| Delivery-Readiness | 90 | All paths mapped, all consumers identified. No external dependencies. No ambiguity. |
| Testability | 85 | TypeScript compilation catches import errors. Stale-path grep catches string references. baseline-priors-migration.test.ts validates file existence. |

**What raises to >=90:** All scores already at or near 90. The testability gap (no test validates script path construction against actual files) is mitigated by the TypeScript compiler catching all import-level errors and the grep-based stale-path scan.

## Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | Stale path in a skill file not caught by TypeScript | Medium | Comprehensive grep scan for old flat-file pattern after all moves complete |
| 2 | docs/registry.json entries point to old paths | Low | Update registry entries as part of the build; verify with grep |
| 3 | lp-readiness glob pattern `<BIZ>-*.md` breaks | Medium | Update glob to scan subdirectory instead: `<BIZ>/*.md` |
| 4 | External tools or CI reference flat paths | Low | No CI workflow references startup-baselines directly (confirmed) |

## Open Questions

All resolved — no operator-only knowledge required.

1. **Should BIZ prefix be dropped from filenames inside subdirectories?** Resolved: Yes — it's redundant information once inside the per-business subdirectory. Consistent with how `strategy/<BIZ>/` and `site-upgrades/<BIZ>/` work.
2. **Should the missing hyphen in intake-packet filenames be fixed during the move?** Resolved: Yes — `2026-02-12assessment` → `2026-02-12-assessment`. All 4 files have the same missing hyphen; fixing during the move avoids a separate rename pass.
3. **Should `.user.` suffix be normalized?** Resolved: No — out of scope. The inconsistency is cosmetic and doesn't affect any code path. Tackle if/when a naming policy is established.

## Evidence Gap Review

### Gaps Addressed

- All 5 TypeScript files using flat pattern identified with exact line numbers and path construction code
- All ~16 skills using flat pattern identified with read/write classification
- Test fixture (baseline-priors-migration.test.ts) identified with 5 hardcoded paths
- PET subdirectory absence confirmed
- No flat-to-subdirectory content duplicates confirmed
- lp-forecast hybrid pattern (reads flat, writes subdir) identified and assessed

### Confidence Adjustments

- No adjustments needed. All evidence areas covered with concrete file paths and line numbers.

### Remaining Assumptions

- BIZ prefix drop is safe (no consumer parses the BIZ code from the filename — all use path construction with the business variable)
- Fixing the missing hyphen in intake-packet filenames won't break any consumer (consumers use glob patterns or template strings with the business code, not the date portion)
