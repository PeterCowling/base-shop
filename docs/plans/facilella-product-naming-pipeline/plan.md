---
Type: Plan
Status: Active
Domain: Mixed
Workstream: Mixed
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: facilella-product-naming-pipeline
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-assessment-13-product-naming
Overall-confidence: 85%
Confidence-Method: Per-task confidence = min(Implementation,Approach,Impact); Plan Overall-confidence = effort-weighted average of per-task confidence (S=1, M=2, L=3)
Auto-Build-Intent: plan+auto
---

# Facilella Product Naming Pipeline Plan

## Summary

HEAD has completed company naming (Facilella, R7, 2026-02-26) and produced a Draft ASSESSMENT-13 product naming document with 5 provisional candidates and no systematic scoring. This plan builds a product naming pipeline analogous to the company naming pipeline — a spec document, a 75-candidate generation run with DWPEIC scoring, a TM pre-screen direction CLI, and an operator-facing shortlist. The pipeline also extends the shared sidecar event infrastructure with a new `tm_prescreened` stage and an optional `tm_prescreen` field. ASSESSMENT-13 SKILL.md is updated with a pointer to this pipeline for cases where more rigour than the 3–5 candidate write-first approach is needed. Output is a shortlist of 10–20 scored product line names for operator selection before logo brief work begins.

## Active tasks
- [ ] TASK-01: Write product naming spec (`2026-02-26-product-naming-spec.md`)
- [ ] TASK-02: Extend `event-log-writer.ts` and `candidate-sidecar-schema.json` for product naming stages
- [ ] TASK-03: Build `tm-prescreen-cli.ts` — structured TM direction URL generator
- [ ] TASK-04: Generate 75 product name candidates (SPIKE)
- [ ] TASK-05: Run `tm-prescreen-cli.ts` on the shortlist candidates; capture output
- [ ] TASK-06: Write shortlist artifact (`product-naming-shortlist-2026-02-26.user.md`)
- [ ] TASK-07: Update ASSESSMENT-13 SKILL.md with pipeline pointer

## Goals
- Produce a systematic product naming spec with DWPEIC scoring dimensions (6 dimensions, max 30)
- Generate 75 scored product name candidates across 5 semantic territories
- Produce TM pre-screen direction (EUIPO/WIPO/UIBM search URLs) for the top candidates
- Deliver a shortlist of 10–20 candidates ready for operator selection
- Extend sidecar event infrastructure with `tm_prescreened` stage (additive, no blast radius)
- Update ASSESSMENT-13 with a pointer to this pipeline as the rigorous alternative

## Non-goals
- Automated TM API lookup (no free unauthenticated batch API exists for EUIPO/TMVIEW/WIPO GBD — direction-only is v1)
- Modifying the company naming pipeline (`rdap-cli.ts`, `rdap-client.ts`, `rdap-types.ts`)
- Changing ASSESSMENT-13 output format or making the pipeline a mandatory ASSESSMENT step
- Generating a 250-candidate list (product naming has no RDAP attrition; 75 candidates is sufficient)
- Domain checking (facilella.com is already secured; no RDAP needed for product line names)
- Running or interpreting TM search results (operator task — pipeline produces search direction only)

## Constraints & Assumptions
- Constraints:
  - New CLI goes in `scripts/src/startup-loop/naming/` (no new directory)
  - Artifacts go in `docs/business-os/strategy/HEAD/` with established naming convention
  - `event-log-writer.ts` changes are additive only — no breaking changes to existing types or exports
  - `candidate-sidecar-schema.json` stage enum updated to include `tm_prescreened`
  - ASSESSMENT-13 SKILL.md is NOT given a new output format — only a pipeline pointer is added
  - EU MDR regulatory constraint: product name must not imply medical/therapeutic purpose
  - Compound phonetic constraint: line name should start with a consonant or open vowel for smooth flow after the `-la` ending of Facilella
  - The 5 provisional ASSESSMENT-13 candidates (Cerchietto, Sicura, Libera, Everyday, Sport) carry forward as seeds — not eliminated
- Assumptions:
  - `baseline-extractor.ts` uses a switch on `event.stage` with no default case — adding `tm_prescreened` events is safe (they will be silently unhandled by the extractor in v1, which is acceptable)
  - EUIPO URL deep-link format (`https://euipo.europa.eu/eSearch/#basic?criteria=WORD&searchTerm={name}`) works as a pre-filled link; fallback (plain search URL with manual entry) is documented in CLI output if deep-link does not pre-fill correctly
  - Nice Classification Classes 25 and 26 are the correct TM search classes (confirmed in existing ASSESSMENT-13 artifact)
  - The line name operates exclusively as `Facilella [Line Name]` compound — scoring is evaluated in compound context

## Inherited Outcome Contract

- **Why:** The ASSESSMENT-13 artifact has 5 provisional candidates generated without a systematic spec or scoring rubric. A pipeline analogous to the company naming pipeline would produce a defensible shortlist before committing to a product name that will appear on packaging, Etsy listings, and all product-facing copy.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A product naming pipeline producing a spec file, a generation run of 75 scored candidates, a TM pre-screen direction document, and a shortlist of 10–20 candidates ready for operator selection. Pipeline tooling persisted as reusable TypeScript and spec infrastructure.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/facilella-product-naming-pipeline/fact-find.md`
- Key findings used:
  - DWPEIC scoring dimensions confirmed (6 dimensions, max 30): D (Distinctiveness), W (Wordmark), P (Phonetic), E (Line Extension headroom — redefined from company naming), I (ICP resonance in compound context), C (Category signal)
  - Candidate count: 75 (no RDAP attrition; no exhausted namespace; compound structure reduces TM risk)
  - TM pre-screen: direction-only for v1 (no free unauthenticated batch API for EUIPO/WIPO GBD)
  - New sidecar directory `product-naming-sidecars/` under `docs/business-os/strategy/HEAD/`
  - `SidecarStage` needs `tm_prescreened` added; `SidecarEvent` gets optional `tm_prescreen?: TmPrescreenRecord | null`
  - CLI file: `tm-prescreen-cli.ts` — analogous to `rdap-cli.ts` but generates URLs not HTTP checks
  - ASSESSMENT-13 SKILL.md NOT modified for output format; pipeline pointer only
  - `baseline-extractor.ts` switch has no default case — `tm_prescreened` events silently unhandled (acceptable v1 limitation)

## Proposed Approach

- Option A: Extend ASSESSMENT-13 to support a 75-candidate pipeline mode (adds complexity to SKILL.md, couples pipeline to the assessment skill)
- Option B: Build standalone tooling (CLI + spec + artifacts) with ASSESSMENT-13 pointer only (cleaner separation, pipeline is optional/reusable)
- Chosen approach: Option B — standalone tooling with ASSESSMENT-13 pointer. This keeps ASSESSMENT-13 as the quick 3–5 candidate write-first skill for early assessment stages, while the pipeline is the rigorous deeper-dive for when the operator wants a proper shortlist. The CLI follows the existing `rdap-cli.ts` structural model precisely.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Write product naming spec (`2026-02-26-product-naming-spec.md`) | 90% | S | Pending | - | TASK-04 |
| TASK-02 | IMPLEMENT | Extend `event-log-writer.ts` + `candidate-sidecar-schema.json` for `tm_prescreened` stage | 90% | S | Pending | - | TASK-03 |
| TASK-03 | IMPLEMENT | Build `tm-prescreen-cli.ts` | 85% | S | Pending | TASK-02 | TASK-05 |
| TASK-04 | SPIKE | Generate 75 scored product name candidates | 80% | M | Pending | TASK-01 | TASK-05 |
| TASK-05 | IMPLEMENT | Run `tm-prescreen-cli.ts` on top 20 candidates; capture output | 85% | S | Pending | TASK-03, TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Write shortlist artifact (`product-naming-shortlist-2026-02-26.user.md`) | 90% | S | Pending | TASK-05 | - |
| TASK-07 | IMPLEMENT | Update ASSESSMENT-13 SKILL.md with pipeline pointer | 95% | S | Pending | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-07 | - | All three are independent; TASK-01 writes spec, TASK-02 extends infrastructure, TASK-07 updates SKILL.md |
| 2 | TASK-03, TASK-04 | TASK-02 complete (TASK-03); TASK-01 complete (TASK-04) | Run in parallel after Wave 1 |
| 3 | TASK-05 | TASK-03 and TASK-04 both complete | Run CLI against candidates; short serial step |
| 4 | TASK-06 | TASK-05 complete | Write shortlist from CLI output and scored candidates |

## Tasks

---

### TASK-01: Write product naming spec (`2026-02-26-product-naming-spec.md`)
- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/strategy/HEAD/2026-02-26-product-naming-spec.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/strategy/HEAD/2026-02-26-product-naming-spec.md`
- **Reviewer:** Pete (operator)
- **Approval-Evidence:** Operator selection from shortlist in TASK-06 confirms spec produced usable candidates
- **Measurement-Readiness:** Operator selection from shortlist (TASK-06) confirms spec quality; no formal metric cadence needed
- **Affects:** `docs/business-os/strategy/HEAD/2026-02-26-product-naming-spec.md` (new)
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 90% — the company naming spec (`2026-02-22-naming-generation-spec.md`) is a complete structural model; the new spec follows its section layout (brand context, scoring rubric, territories, pattern pools, hard blockers, output format) with product-naming adaptations. Writing the spec is a well-defined authoring task.
  - Approach: 90% — DWPEIC dimensions are fully reasoned in the fact-find (Decision 1); 5 territories are defined in the Phase 3 task spec; hard blockers carry over from brand dossier and naming spec. No unresolved approach questions.
  - Impact: 90% — spec quality directly gates candidate quality (TASK-04). If spec territories are weak, generation produces low-scoring candidates. However, spec quality is reviewable before generation runs.
- **Acceptance:**
  - Spec file exists at `docs/business-os/strategy/HEAD/2026-02-26-product-naming-spec.md`
  - All required sections present: brand/ICP context, DWPEIC scoring rubric with 6 defined dimensions, 5 named territories each with situation anchor and word bank, 4 pattern pools (A, B, C, E — D hard-blocked), hard blockers including EU MDR vocabulary bans and compound phonetic constraint, output table format
  - DWPEIC max score is 30 (D+W+P+E+I+C, each 1–5)
  - Territory definitions are distinct (swap-test would fail — no territory is reducible to another)
  - 5 provisional ASSESSMENT-13 candidates listed as seeds (Cerchietto, Sicura, Libera, Everyday, Sport)
- **Validation contract (VC-01 through VC-04):**
  - VC-01: File exists at the specified path → `ls docs/business-os/strategy/HEAD/2026-02-26-product-naming-spec.md` returns 0
  - VC-02: All 6 DWPEIC dimensions present with 1–5 rubrics → grep for D, W, P, E, I, C headers in scoring section
  - VC-03: Exactly 5 territories defined with non-identical situation anchors → manually verify no two territories share a situation anchor
  - VC-04: Hard blockers include EU MDR vocabulary list (no medical/therapeutic terms) and compound phonetic constraint (starts with consonant or open vowel) → grep for "MDR" or "EU MDR" and "consonant" in spec
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: TASK-04 cannot run without the spec; absence of spec file is the red state
  - Green evidence plan: Write spec following company naming spec structure with product-naming adaptations; all 4 VC checks pass
  - Refactor evidence plan: Review territory word banks for collapse risk (swap test); tighten any overlapping vocabulary before TASK-04 runs
- **Scouts:** Fact-find Decision 1 (DWPEIC scoring) is the primary assumption underlying the spec. Risk: DWPEIC dimensions may produce clustered scores (many candidates near 20/30) with insufficient discrimination. Mitigation: include I hard gate (I ≤ 3 → eliminate) analogous to company naming spec §3.1.
- **Edge Cases & Hardening:**
  - Territory collapse: include explicit territory swap-test check (same structure as company naming spec §4.0 pre-generation gate)
  - Compound phonetic rule: add explicit constraint that line name should begin with consonant or open vowel (not -l, -a, -e initial clusters that would clash with Facilella's -la ending)
  - MDR boundary: include an explicit ban list for medical/therapeutic vocabulary (hear, sound, cochlear, processor, implant, medical, clinical, therapeutic, restore, improve) — distinct from the company naming ban list which focuses on spa/wellness register
- **What would make this >=90%:** Already at 90%. To reach 95%: run a 5-candidate dry generation immediately after writing the spec to validate territory distinctiveness before TASK-04.
- **Rollout / rollback:**
  - Rollout: Save file; TASK-04 agent reads it
  - Rollback: None needed — new file, no existing content displaced
- **Documentation impact:**
  - Spec file is itself the documentation artifact; no additional docs needed
- **Notes / references:**
  - Structural model: `docs/business-os/strategy/HEAD/2026-02-22-naming-generation-spec.md`
  - DWPEIC decision: fact-find §Key Design Decisions Decision 1
  - Territory design: skill prompt Phase 3 (T1–T5 with 15 candidates each)
  - Italian constraints: fact-find Decision 7

---

### TASK-02: Extend `event-log-writer.ts` and `candidate-sidecar-schema.json` for product naming stages
- **Type:** IMPLEMENT
- **Deliverable:** Modified `scripts/src/startup-loop/naming/event-log-writer.ts` and `scripts/src/startup-loop/naming/candidate-sidecar-schema.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/naming/event-log-writer.ts`, `scripts/src/startup-loop/naming/candidate-sidecar-schema.json`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% — changes are additive only; `SidecarStage` is a type alias union (`'generated' | 'i_gate_eliminated' | 'rdap_checked' | 'shortlisted' | 'finalist'`); adding `| 'tm_prescreened'` is a one-line change. Adding optional `tm_prescreen?: TmPrescreenRecord | null` to `SidecarEvent` is additive. `TmPrescreenRecord` interface is new and self-contained.
  - Approach: 90% — the additive-only constraint is confirmed by evidence in fact-find: `baseline-extractor.ts` switch has no default case (fall-through for unknown stages is safe); no exhaustive switch on `SidecarStage` found in codebase. JSON Schema update adds `tm_prescreened` to the `stage.enum` array.
  - Impact: 90% — TASK-03 cannot be built without the updated `SidecarStage` type; without TASK-02, TASK-03 would produce TypeScript errors when writing `tm_prescreened` events.
- **Acceptance:**
  - `SidecarStage` union in `event-log-writer.ts` includes `'tm_prescreened'`
  - `VALID_STAGES` Set in `event-log-writer.ts` includes `'tm_prescreened'`
  - New `TmPrescreenRecord` interface exported from `event-log-writer.ts` with fields: `euipo_url: string`, `wipo_url: string`, `uibm_url: string`, `classes: number[]`, `operator_result: 'clear' | 'conflict' | 'pending' | null`
  - `SidecarEvent` interface has optional `tm_prescreen?: TmPrescreenRecord | null` field
  - `candidate-sidecar-schema.json` stage enum includes `"tm_prescreened"`
  - `candidate-sidecar-schema.json` has new optional `tm_prescreen` property in schema
  - Existing tests (if any) still pass; TypeScript compiles without errors for `rdap-cli.ts` (confirm by running typecheck on the naming package)
- **Validation contract (TC-01 through TC-04):**
  - TC-01: `SidecarStage` type includes `'tm_prescreened'` → TypeScript `const s: SidecarStage = 'tm_prescreened'` compiles without error
  - TC-02: `validateSidecarEvent()` accepts events with `stage: 'tm_prescreened'` → pass a mock event with this stage through `validateSidecarEvent()`; expect `valid: true`
  - TC-03: `candidate-sidecar-schema.json` stage enum contains `"tm_prescreened"` → `jq '.properties.stage.enum' candidate-sidecar-schema.json` output includes `"tm_prescreened"`
  - TC-04: `rdap-cli.ts` still compiles after changes → `npx tsc --noEmit` from scripts package root exits 0
- **Execution plan:** Red → Green → Refactor
  - Red: Before change, `const s: SidecarStage = 'tm_prescreened'` fails TypeScript compilation
  - Green: After changes, TC-01 through TC-04 all pass; `event-log-writer.ts` compiles clean
  - Refactor: Verify `VALID_STAGES` Set and the `validateSidecarEvent()` function are consistent (Set includes `tm_prescreened`; `if (!VALID_STAGES.has(...))` in validate function accepts it)
- **Scouts:**
  - Confirm `baseline-extractor.ts` switch statement does not have a default case that would be broken by new stage — already confirmed in code review (lines 78–106, no default).
  - Confirm no other files in `scripts/src/startup-loop/naming/` switch on `SidecarStage` — check `baseline-extractor.ts` and `rdap-cli.ts` (only two consumers found; both confirmed safe).
- **Edge Cases & Hardening:**
  - The `scores` object in `CandidateRecord` currently validates D, W, P, E, I (5 dimensions) with total capped at 5–25. Product naming adds C (Category signal) for a total max of 30. The existing schema validation does NOT need to be updated for C because TASK-03 writes events with `scores: null` at the `tm_prescreened` stage (scores are written at `generated` stage by the generation agent). The schema update for C-dimension scores is a TASK-04 concern, not TASK-02.
  - Do NOT update the `scores.total` max from 25 to 30 in TASK-02 — that would break validation of existing company naming sidecar events. TASK-04 can write scores into a `product_scores` field in `model_output`, or write product name sidecars with `scores: null` and track scores in the candidate markdown table only. Decision: product naming sidecar events use `scores: null` (score lives in the markdown table); no schema change to scores validation needed.
- **What would make this >=90%:** Already at 90%. To reach 95%: add a simple unit test for `validateSidecarEvent()` with stage `'tm_prescreened'`.
- **Rollout / rollback:**
  - Rollout: Changes to `event-log-writer.ts` take effect when the module is imported; no runtime deployment needed (tooling only)
  - Rollback: Revert the two additive lines if needed; no data loss (JSONL files are append-only)
- **Documentation impact:**
  - None beyond the code changes themselves — the interface changes are self-documenting via TypeScript types
- **Notes / references:**
  - `event-log-writer.ts` current `SidecarStage`: line 5 — `'generated' | 'i_gate_eliminated' | 'rdap_checked' | 'shortlisted' | 'finalist'`
  - `VALID_STAGES` Set: lines 49–55
  - `validateSidecarEvent()`: lines 62–137 (stage validation at lines 98–104)
  - `candidate-sidecar-schema.json` stage enum: line 14

---

### TASK-03: Build `tm-prescreen-cli.ts` — structured TM direction URL generator
- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/naming/tm-prescreen-cli.ts` (new file)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/naming/tm-prescreen-cli.ts` (new)
- **Depends on:** TASK-02
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% — the structural model (`rdap-cli.ts`) is well-understood and mirrors the desired pattern. The main new logic is URL generation: given a name, produce EUIPO, WIPO, and UIBM search URLs. EUIPO deep-link format (`https://euipo.europa.eu/eSearch/#basic?criteria=WORD&searchTerm={name}`) is inferred from the existing ASSESSMENT-13 artifact; UIBM deep-link is not confirmed (no query param documented). Implementation confidence is capped at 85% because the EUIPO/UIBM URL formats have not been manually tested.
  - Approach: 85% — direction-only TM pre-screen (no HTTP calls) is the correct v1 approach (fact-find Decision 3). The output format (one line per candidate: `[NAME] | Class 25: <URL> | Class 26: <URL>`) is analogous to `formatRdapLegacyText`. Approach is sound; URL format uncertainty is the cap.
  - Impact: 85% — CLI produces `product-naming-tm-2026-02-26.txt` which is the TM direction artifact for the operator. If URLs are not pre-filled correctly, the operator still gets the search entry point URLs and the instruction to search the candidate name — fallback is functional.
- **Acceptance:**
  - File exists at `scripts/src/startup-loop/naming/tm-prescreen-cli.ts`
  - CLI reads names from stdin (newline-separated, no `.com` suffix logic needed)
  - For each name, generates: EUIPO URL (Class 25 + 26 combined or separate), WIPO GBD URL, UIBM URL
  - Writes `generated` sidecar event per name to `product-naming-sidecars/` directory at round 1
  - Writes `tm_prescreened` sidecar event per name with `tm_prescreen` field populated (URLs, classes, `operator_result: null`)
  - Outputs structured text to stdout: one block per candidate with name and search URLs
  - Reads from stdin, writes sidecar events, outputs to stdout — same pattern as `rdap-cli.ts`
  - `npx tsx scripts/src/startup-loop/naming/tm-prescreen-cli.ts` with 3 names piped in produces valid output and sidecar file
- **Validation contract (TC-01 through TC-04):**
  - TC-01: Given name "Cerchietto" on stdin → stdout contains at least 3 URLs (EUIPO, WIPO, UIBM) with "Cerchietto" in the URL or in adjacent instruction text
  - TC-02: EUIPO URL has correct base domain `euipo.europa.eu` → grep output for this domain
  - TC-03: Sidecar JSONL file created in `product-naming-sidecars/` → file exists after CLI run
  - TC-04: Sidecar file contains events with `stage: "tm_prescreened"` → `jq '.stage' <sidecar-file>.jsonl` includes `tm_prescreened`
- **Execution plan:** Red → Green → Refactor
  - Red: File does not exist; piping names produces no output
  - Green: TC-01 through TC-04 pass after implementation; tested against 3 candidate names (Cerchietto, Sicura, Libera) using a **temporary test sidecar directory** (e.g., `/tmp/tm-prescreen-test-sidecars/`) — not the production `product-naming-sidecars/` path. This ensures the production sidecar is not pre-populated before TASK-05.
  - Refactor: Verify output format is easy to read — one clear block per candidate; verify EUIPO URL does pre-fill correctly by noting the output format includes a fallback instruction if the deep-link doesn't pre-fill
- **Planning validation:**
  - Checks run: `rdap-cli.ts` read in full; `event-log-writer.ts` exports confirmed; EUIPO URL format confirmed from ASSESSMENT-13 artifact
  - Validation artifacts: ASSESSMENT-13 TM pre-screen section references `euipo.europa.eu/eSearch` as the manual search entry point
  - Unexpected findings: UIBM URL pattern not confirmed — the ASSESSMENT-13 artifact lists `uibm.gov.it/bancadati/` with no deep-link query param. CLI should output base URL with "search for [name]" instruction for UIBM.
- **Scouts:**
  - Test EUIPO URL format manually before submitting TASK-03 complete: navigate to `https://euipo.europa.eu/eSearch/#basic?criteria=WORD&searchTerm=Cerchietto` and verify it pre-fills. If not, adjust URL format.
  - Confirm SIDECAR_DIR constant uses the `product-naming-sidecars/` path (not `naming-sidecars/`)
- **Edge Cases & Hardening:**
  - Names with spaces or accented characters: URL-encode the name in URL parameters (use `encodeURIComponent()`)
  - Empty stdin: exit with non-zero code and stderr message (same as `rdap-cli.ts`)
  - UIBM URL: if no query-param deep-link is available, output base URL + manual instruction
  - Output format: if stdout is piped to a file, no colour codes; plain text
- **What would make this >=90%:**
  - Manually confirm EUIPO URL deep-link pre-fills correctly before building
  - Add one unit test for the URL generation pure function
- **Rollout / rollback:**
  - Rollout: New file; no existing code affected; run `npx tsx` to test before commit
  - Rollback: Delete the file; no downstream side effects since TASK-05 hasn't run yet
- **Documentation impact:**
  - Usage documented in CLI comment header (same pattern as `rdap-cli.ts`)
- **Notes / references:**
  - Structural model: `scripts/src/startup-loop/naming/rdap-cli.ts`
  - SIDECAR_DIR: `docs/business-os/strategy/HEAD/product-naming-sidecars`
  - RUN_DATE: `'2026-02-26'`, ROUND: `1`, BUSINESS: `'HEAD'`
  - EUIPO URL base: `https://euipo.europa.eu/eSearch/#basic?criteria=WORD&searchTerm=`
  - WIPO URL base: `https://branddb.wipo.int/en/quicksearch/brand?query=`
  - UIBM URL base: `https://www.uibm.gov.it/bancadati/` (no deep-link confirmed)
  - Nice Classes: 25 and 26

---

### TASK-04: Generate 75 product name candidates (SPIKE)
- **Type:** SPIKE
- **Deliverable:** `docs/business-os/strategy/HEAD/product-naming-candidates-2026-02-26.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/strategy/HEAD/product-naming-candidates-2026-02-26.md`
- **Reviewer:** Pete (operator)
- **Approval-Evidence:** Shortlist selection (TASK-06) is the upstream approval; operator reviews full table if shortlist needs expansion
- **Measurement-Readiness:** Top-scored candidates produce a shortlist (TASK-06); operator selection confirms generation quality
- **Affects:** `docs/business-os/strategy/HEAD/product-naming-candidates-2026-02-26.md` (new)
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 80% — generating 75 scored candidates from a spec is a well-defined agent task. The spec (TASK-01) provides the territory framework, pattern pools, scoring rubric, and hard blockers. Main uncertainty: whether the agent will produce distinctively different candidates across all 5 territories, or whether territory collapse will reduce effective variation. Held-back test: If territory definitions are too similar (e.g., T1 and T5 produce overlapping words), candidates could cluster in 2–3 territories and top scorers may all look alike. The spec's swap-test requirement (§4.0 equivalent) mitigates this.
  - Approach: 80% — DWPEIC scoring with a 6th dimension (C) is untested on product names. The I hard gate (I ≤ 3 → eliminate) carried over from company naming is appropriate. Uncertainty: whether the 5 seed candidates from ASSESSMENT-13 produce meaningful territory anchors or whether they're too generic to guide generation. Mitigation: seeds are listed in spec but not mandatory sources.
  - Impact: 80% — generation quality gates shortlist quality. If SPIKE produces only low-scoring candidates (all below 20/30), a second round would be needed. This is by design (pipeline supports rounds), but TASK-05 and TASK-06 would need to wait.
- **Acceptance:**
  - File exists at `docs/business-os/strategy/HEAD/product-naming-candidates-2026-02-26.md`
  - Contains exactly 75 scored candidates in the spec table format (# | Name | Pattern | Territory | Provenance note | D | W | P | E | I | C | Score)
  - Territory distribution: T1 ~15, T2 ~15, T3 ~15, T4 ~15, T5 ~15 (±2 tolerance)
  - All candidates scored on D, W, P, E, I, C (each 1–5); Score = D+W+P+E+I+C; max 30
  - No candidate uses a word from the EU MDR ban list or compound phonetic constraint violations
  - No candidate uses a word from the EU MDR ban list or the Italian spa/wellness/clinical register bans from the brand dossier
  - All candidates have I ≥ 4 (I hard gate: I ≤ 3 → eliminate before including in table)
  - Table sorted by Score descending; ties broken by I descending, then alphabetically
  - After the table: one-paragraph territory distribution summary
- **Validation contract (VC-01 through VC-04):**
  - VC-01: File exists and contains a markdown table → `wc -l` > 80 lines (75 data rows + headers + summary)
  - VC-02: All 6 dimensions present in table header → check for `D | W | P | E | I | C | Score` in header row
  - VC-03: Territory distribution roughly even → count rows per territory; no territory has fewer than 10 or more than 20
  - VC-04: All I scores ≥ 4 in table (I hard gate enforced) → no row has a `| 1 |`, `| 2 |`, or `| 3 |` in the I column position
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: File does not exist; TASK-05 cannot run without candidates
  - Green evidence plan: Agent reads spec, generates 75 candidates with territory distribution and DWPEIC scoring; all 4 VC checks pass
  - Refactor evidence plan: Review top 20 candidates for compound phonetic smoothness ("Facilella [Name]" — does it flow?); flag any that start with awkward consonant clusters despite passing the constraint
- **Planning validation (required for M):**
  - Checks run: Company naming pipeline structure reviewed (`naming-generation-spec.md`, `naming-candidates-2026-02-26-r7.md`); product naming candidate table format adapted from company naming output format
  - Validation artifacts: `naming-candidates-2026-02-26-r7.md` confirms the table format and scoring convention; ASSESSMENT-13 confirms the 5 provisional candidates and their known risks
  - Unexpected findings: The C (Category signal) dimension is new and has no precedent in company naming — the spec must define C rubric clearly to avoid inconsistent scoring between territories (T1 Italian product-type names score high on C by design; T5 coined diminutives may score low). The spec should include example C scores to calibrate.
- **Scouts:**
  - Check whether the 5 ASSESSMENT-13 provisional candidates (Cerchietto 3/5+, Sicura 3/5, Libera 4/5, Everyday 3/5, Sport 2/5 estimated) would pass the I hard gate at I ≥ 4. Cerchietto may pass; Sport is likely I = 3 or lower in compound context ("Facilella Sport" is descriptive; ICP resonance is functional, not warm). These seeds are tracked but not required to appear in the output table.
  - Does the generation agent have enough context from the spec alone, or does it need the brand dossier and brand profile read directly? Plan: include the brand dossier and brand profile paths in the TASK-04 execution prompt for context.
- **Edge Cases & Hardening:**
  - If fewer than 10 candidates score ≥ 24/30 (shortlist threshold), TASK-06 falls back to top 15 by score rather than a fixed threshold — this is documented in TASK-06
  - If territory collapse is severe (< 8 candidates from any territory), TASK-04 agent should note this in the summary paragraph and the operator may request a targeted re-run for that territory
  - Duplicate prevention: agent must check candidate names against the 5 seeds before including them in the 75 (seeds are not counted toward the 75)
- **What would make this >=90%:**
  - Confirmed territory distinctiveness from TASK-01 spec (dry-run probe test run before the full 75-candidate generation)
  - Example scored rows in the spec to calibrate the C dimension before generation
- **Rollout / rollback:**
  - Rollout: File produced by agent; TASK-05 reads it for top 20 candidates
  - Rollback: None needed — new file; pipeline supports rounds
- **Documentation impact:**
  - Candidate file is itself a documentation artifact for the generation round
- **Notes / references:**
  - Spec to read: `docs/business-os/strategy/HEAD/2026-02-26-product-naming-spec.md`
  - Brand context: `docs/business-os/strategy/HEAD/2026-02-21-brand-profile.user.md`, `docs/business-os/strategy/HEAD/2026-02-21-brand-identity-dossier.user.md`
  - ASSESSMENT-13 seeds: `docs/business-os/strategy/HEAD/2026-02-26-product-naming.user.md` Section B
  - Company naming eliminated names (spec §5.2–5.6): NOT carried over as an exclusion list. These are company brand names, not product line names — different scope, different semantic territory, no carry-over prohibition. The spec will include its own hard-blocker list derived from brand dossier register bans and EU MDR vocabulary constraints.

---

### TASK-05: Run `tm-prescreen-cli.ts` on top 20 candidates; capture output
- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/strategy/HEAD/product-naming-tm-2026-02-26.txt`, sidecar events in `docs/business-os/strategy/HEAD/product-naming-sidecars/2026-02-26-round-1.jsonl`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/strategy/HEAD/product-naming-tm-2026-02-26.txt` (new), `docs/business-os/strategy/HEAD/product-naming-sidecars/2026-02-26-round-1.jsonl` (new)
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — running a CLI from stdin is well-defined; extracting the top 20 names from the candidate markdown table is a simple parsing step. The only uncertainty is whether the CLI produces valid output (depends on TASK-03 quality, which is at 85%).
  - Approach: 85% — top 20 candidates by Score descending is the correct selection criterion for TM pre-screen. Running CLI on 20 names (not all 75) is correct — the TM check is for the shortlist, not the full pool.
  - Impact: 85% — TM direction file is the input for TASK-06 shortlist curation; if URL format is wrong (UIBM fallback), the shortlist still proceeds with partial TM direction.
- **Acceptance:**
  - Top 20 candidates extracted from `product-naming-candidates-2026-02-26.md` by Score descending
  - Names piped into `npx tsx scripts/src/startup-loop/naming/tm-prescreen-cli.ts`
  - Output captured to `docs/business-os/strategy/HEAD/product-naming-tm-2026-02-26.txt`
  - Sidecar JSONL created at `docs/business-os/strategy/HEAD/product-naming-sidecars/2026-02-26-round-1.jsonl`
  - Sidecar file contains 20 `generated` events and 20 `tm_prescreened` events (40 total lines)
  - TM output file contains one block per candidate with EUIPO, WIPO, and UIBM search directions
- **Validation contract (TC-01 through TC-03):**
  - TC-01: `product-naming-tm-2026-02-26.txt` exists and has 20 name blocks → `wc -l` > 60 lines (3+ lines per candidate block)
  - TC-02: Sidecar JSONL has 40 lines → `wc -l` = 40
  - TC-03: Sidecar contains `"stage":"tm_prescreened"` entries → `grep tm_prescreened <sidecar>.jsonl | wc -l` = 20
- **Execution plan:** Red → Green → Refactor
  - Red: TM txt file does not exist
  - Green: Extract top 20 names, pipe to CLI, capture stdout to txt file; TC-01 through TC-03 pass
  - Refactor: Review txt file format for readability; confirm each block is clearly associated with the candidate name
- **Scouts:** Verify CLI binary is executable via `npx tsx` before piping all 20 names. Any preflight test of the CLI (1 name, smoke test) must use a temporary sidecar directory (e.g., `/tmp/tm-prescreen-test/`) — not the production `product-naming-sidecars/` path. This ensures the production sidecar file does not contain test events before the full TASK-05 run, and the TC-02 event count check (exactly 40 lines) remains deterministic.
- **Edge Cases & Hardening:**
  - If top 20 includes ties (same score, multiple candidates), include all tied candidates at the 20th position
  - Sidecar directory may not exist at run time; CLI must create it with `mkdirSync({ recursive: true })`
  - Confirm `product-naming-sidecars/2026-02-26-round-1.jsonl` does not already exist before running (if it does, a prior test contaminated it — delete and re-run)
- **What would make this >=90%:** CLI EUIPO URL format confirmed manually before this task runs (done as a scout in TASK-03).
- **Rollout / rollback:**
  - Rollout: New files only; no existing data modified
  - Rollback: Delete the two new files; no downstream side effects since TASK-06 has not run
- **Documentation impact:**
  - TM txt file is the operator-facing TM direction artifact; format mirrors `naming-rdap-2026-02-26-r7.txt` convention
- **Notes / references:**
  - CLI path: `scripts/src/startup-loop/naming/tm-prescreen-cli.ts`
  - Run command: `head -20 <extracted-names.txt> | npx tsx scripts/src/startup-loop/naming/tm-prescreen-cli.ts > docs/business-os/strategy/HEAD/product-naming-tm-2026-02-26.txt`

---

### TASK-06: Write shortlist artifact (`product-naming-shortlist-2026-02-26.user.md`)
- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/strategy/HEAD/product-naming-shortlist-2026-02-26.user.md`; update `docs/business-os/strategy/HEAD/2026-02-26-product-naming.user.md` Section B status
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/strategy/HEAD/product-naming-shortlist-2026-02-26.user.md`
- **Reviewer:** Pete (operator)
- **Approval-Evidence:** Operator selection field populated in shortlist artifact ("Operator selected: [Name]")
- **Measurement-Readiness:** Operator selection unblocks ASSESSMENT-14 logo brief; observable event
- **Affects:** `docs/business-os/strategy/HEAD/product-naming-shortlist-2026-02-26.user.md` (new), `docs/business-os/strategy/HEAD/2026-02-26-product-naming.user.md` (update Section B status and candidates from provisional to shortlisted)
- **Depends on:** TASK-05
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — shortlist format follows `naming-shortlist-2026-02-26-r7.user.md` as structural model. Filter to candidates with Score ≥ 24/30 (or top 15 if fewer than 10 qualify at that threshold); write scoring table; add operator selection section. Also update the ASSESSMENT-13 artifact Section B.
  - Approach: 90% — the ≥ 24/30 threshold (80% of max) is analogous to the company naming shortlist threshold. If the top 15 are all below 24, the threshold drops to include top 15 by score — this is documented.
  - Impact: 90% — shortlist is the terminal artifact for operator selection. ASSESSMENT-14 (logo brief) reads the confirmed product name from the ASSESSMENT-13 artifact Section B "Operator selected" field.
- **Acceptance:**
  - Shortlist file exists at `docs/business-os/strategy/HEAD/product-naming-shortlist-2026-02-26.user.md`
  - Contains scoring table: # | Name | Full Compound | Territory | D | W | P | E | I | C | Score | TM Direction Note
  - All candidates have Score ≥ 24/30 OR top 15 by Score (whichever produces a larger set, minimum 10)
  - Operator selection section present: `**Operator selected:** {TBD — to be confirmed by operator}`
  - ASSESSMENT-13 artifact Section B updated: top shortlisted candidates added to the candidate table with status `shortlisted`; `Operator selected` field remains `{TBD}`
  - TM Direction Note column contains EUIPO URL for each candidate (from `product-naming-tm-2026-02-26.txt`)
- **Validation contract (VC-01 through VC-03):**
  - VC-01: Shortlist file exists → `ls docs/business-os/strategy/HEAD/product-naming-shortlist-2026-02-26.user.md` returns 0
  - VC-02: Shortlist contains at least 10 candidates → `grep "^|" product-naming-shortlist-2026-02-26.user.md | wc -l` ≥ 12 (10 data rows + 2 header rows)
  - VC-03: ASSESSMENT-13 artifact updated with shortlist status → `grep "shortlisted" docs/business-os/strategy/HEAD/2026-02-26-product-naming.user.md` returns at least 1 match
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Shortlist file does not exist; ASSESSMENT-13 remains Draft with only 5 provisional candidates
  - Green evidence plan: Read candidates and TM txt files; filter and write shortlist; update ASSESSMENT-13 Section B; VC-01 through VC-03 pass
  - Refactor evidence plan: Review compound name column ("Facilella [Name]") for phonetic and visual appeal; flag any shortlisted candidates that feel awkward in compound context
- **Scouts:** Confirm company naming shortlist format (`naming-shortlist-2026-02-26-r7.user.md`) for exact column and section structure before writing
- **Edge Cases & Hardening:**
  - If fewer than 10 candidates score ≥ 24/30, include top 15 by score (no minimum threshold)
  - If more than 20 candidates score ≥ 24/30, cap at 20 for operator review manageability
  - ASSESSMENT-13 update: do not remove the 5 provisional candidates from Section B; add the shortlisted candidates as additional rows with status `shortlisted`; update `Updated:` frontmatter date
- **What would make this >=90%:** Already at 90%. To reach 95%: include a one-paragraph narrative for the operator explaining the territory distribution of the shortlist and any notable pattern trends.
- **Rollout / rollback:**
  - Rollout: New shortlist file; ASSESSMENT-13 update is additive (new rows in table)
  - Rollback: None needed — new file; ASSESSMENT-13 update adds rows (can be reverted if needed)
- **Documentation impact:**
  - Shortlist is the terminal operator-facing artifact; ASSESSMENT-13 update makes shortlisted candidates visible to ASSESSMENT-14 skill read
- **Notes / references:**
  - Company naming shortlist model: `docs/business-os/strategy/HEAD/naming-shortlist-2026-02-26-r7.user.md`
  - Source candidates: `docs/business-os/strategy/HEAD/product-naming-candidates-2026-02-26.md`
  - TM direction source: `docs/business-os/strategy/HEAD/product-naming-tm-2026-02-26.txt`
  - ASSESSMENT-13 artifact: `docs/business-os/strategy/HEAD/2026-02-26-product-naming.user.md`

---

### TASK-07: Update ASSESSMENT-13 SKILL.md with pipeline pointer
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md`
- **Reviewer:** none (internal skill update)
- **Approval-Evidence:** Skill invocation by future agent picks up the pipeline pointer in the completion message
- **Measurement-Readiness:** None: internal skill update
- **Affects:** `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — this is an additive update to the Completion Message section only. The SKILL.md output format, steps, and quality gate are NOT changed. One paragraph added to the completion message pointing to the product naming pipeline.
  - Approach: 95% — the fact-find explicitly decided ASSESSMENT-13 SKILL.md is not modified for output format; only the completion message gets a pipeline pointer.
  - Impact: 95% — future agents running ASSESSMENT-13 for new businesses will see the pipeline pointer and know to offer it when rigour is requested. Low-risk change with clear downstream benefit.
- **Acceptance:**
  - SKILL.md Completion Message section updated with a pipeline pointer paragraph
  - Pointer references `docs/plans/facilella-product-naming-pipeline/plan.md` as the process documentation
  - ASSESSMENT-13 remains the 3–5 candidate write-first approach; pointer describes the pipeline as a rigorous alternative
  - No other sections of SKILL.md modified
  - SKILL.md still passes its own quality gate definition (sections A–E, frontmatter, quality gate, red flags — all unchanged)
- **Validation contract (VC-01 through VC-02):**
  - VC-01: Completion Message section contains "product naming pipeline" text → `grep -i "product naming pipeline" .claude/skills/lp-do-assessment-13-product-naming/SKILL.md` returns match
  - VC-02: SKILL.md does not modify output format — Section headings (## Steps, ## Output Contract, ## Quality Gate) are unchanged → diff shows only Completion Message section changed
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Completion message ends at the ASSESSMENT-14 next-step pointer with no pipeline mention
  - Green evidence plan: Add pipeline pointer paragraph after the ASSESSMENT-14 next-step; VC-01 and VC-02 pass
  - Refactor evidence plan: Read the full updated Completion Message to verify it reads naturally as a single block of guidance without system-internal jargon (per plain language rule from MEMORY.md)
- **Scouts:** None needed — the change location and content are fully specified.
- **Edge Cases & Hardening:** None: single additive paragraph; no structural change risk.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: Updated SKILL.md is read by any future `/lp-do-assessment-13-product-naming` invocation
  - Rollback: Revert the paragraph addition; no data or artifact impact
- **Documentation impact:**
  - SKILL.md is itself the documentation artifact
- **Notes / references:**
  - Completion Message to add after the ASSESSMENT-14 next-step line:
    > "For more rigorous product naming — equivalent to the company naming pipeline with 75 scored candidates, systematic territory generation, and TM pre-screen direction — run the product naming pipeline documented at `docs/plans/facilella-product-naming-pipeline/plan.md`. ASSESSMENT-13 is the quick 3–5 candidate approach; the pipeline is the deeper-dive alternative when the operator wants a proper shortlist before committing to packaging and logo work."

---

## Risks & Mitigations
- EUIPO URL deep-link format not confirmed (medium likelihood, low impact): Test one URL manually during TASK-03 scout; fallback to base URL + instruction is documented.
- `baseline-extractor.ts` silently ignores `tm_prescreened` events (known limitation): Acceptable for v1; product naming funnel metrics would need a dedicated extractor or a `baseline-extractor.ts` update to count TM prescreened events. Defer to a future plan.
- Candidate score clustering (top 20 all near 20/30, not 24/30): Threshold drops to top 15 in TASK-06; no pipeline breakage.
- TASK-04 generation produces territory-collapsed candidates: Spec swap-test requirement mitigates; if severe, operator can request a targeted re-run for under-represented territory.
- ASSESSMENT-13 artifact (`2026-02-26-product-naming.user.md`) update in TASK-06 conflicts with any concurrent edit: Writer lock acquisition required before TASK-06 edits the ASSESSMENT-13 artifact.

## Observability
- Logging: CLI writes sidecar JSONL events (stage `generated`, `tm_prescreened`) to `product-naming-sidecars/2026-02-26-round-1.jsonl` — append-only audit log
- Metrics: `baseline-extractor.ts` will not count `tm_prescreened` events in v1 (acknowledged limitation); candidate count and territory distribution are visible in the candidate markdown table
- Alerts/Dashboards: None: tooling-only deliverable

## Acceptance Criteria (overall)
- [ ] `docs/business-os/strategy/HEAD/2026-02-26-product-naming-spec.md` exists with DWPEIC rubric and 5 territories
- [ ] `event-log-writer.ts` exports `TmPrescreenRecord` type and `'tm_prescreened'` in `SidecarStage`
- [ ] `scripts/src/startup-loop/naming/tm-prescreen-cli.ts` exists and produces structured TM direction output when names are piped in
- [ ] `docs/business-os/strategy/HEAD/product-naming-candidates-2026-02-26.md` exists with 75 scored candidates (all I ≥ 4)
- [ ] `docs/business-os/strategy/HEAD/product-naming-tm-2026-02-26.txt` exists with TM direction blocks for top 20 candidates
- [ ] `docs/business-os/strategy/HEAD/product-naming-sidecars/2026-02-26-round-1.jsonl` exists with 40 events (20 `generated` + 20 `tm_prescreened`)
- [ ] `docs/business-os/strategy/HEAD/product-naming-shortlist-2026-02-26.user.md` exists with at least 10 scored candidates and operator selection section
- [ ] `docs/business-os/strategy/HEAD/2026-02-26-product-naming.user.md` Section B updated with shortlisted candidates
- [ ] `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md` completion message includes pipeline pointer

## Decision Log
- 2026-02-26: DWPEIC scoring chosen (6 dimensions, max 30) — E redefined as Line Extension headroom; C (Category signal) added as sixth dimension. Source: fact-find Decision 1.
- 2026-02-26: Candidate count = 75 (not 250). No RDAP attrition; compound structure reduces TM risk. Source: fact-find Decision 2.
- 2026-02-26: TM pre-screen = direction-only (URL generator, no HTTP calls). No free unauthenticated batch API for EUIPO/WIPO GBD. Source: fact-find Decision 3.
- 2026-02-26: ASSESSMENT-13 SKILL.md not modified for output format — pipeline pointer only in completion message. Source: fact-find Decision 4.
- 2026-02-26: New sidecar directory `product-naming-sidecars/` created separately from `naming-sidecars/`. Source: fact-find Decision 5.
- 2026-02-26: CLI named `tm-prescreen-cli.ts` (not `product-naming-cli.ts`) — more precise name for what it does. Source: fact-find Evidence Audit §Code Track.
- 2026-02-26: `scores: null` used in product naming sidecar events — scores tracked in markdown table only. Avoids breaking `candidate-sidecar-schema.json` total max constraint (5–25 for company naming vs 6–30 for product naming). Source: plan edge case analysis TASK-02.
- 2026-02-26: ASSESSMENT-13 provisional candidates (Cerchietto, Sicura, Libera, Everyday, Sport) carry forward as seeds — not eliminated. Source: fact-find Open Questions default assumption.

## Overall-confidence Calculation

Per-task confidence = min(Implementation, Approach, Impact). Plan Overall-confidence = effort-weighted average of per-task confidence (S=1, M=2, L=3).

| Task | Per-task confidence (min of 3 dimensions) | Effort weight |
|---|---|---|
| TASK-01 | 90% | 1 |
| TASK-02 | 90% | 1 |
| TASK-03 | 85% | 1 |
| TASK-04 | 80% | 2 |
| TASK-05 | 85% | 1 |
| TASK-06 | 90% | 1 |
| TASK-07 | 95% | 1 |

Weighted sum: (90×1 + 90×1 + 85×1 + 80×2 + 85×1 + 90×1 + 95×1) / (1+1+1+2+1+1+1)
= (90 + 90 + 85 + 160 + 85 + 90 + 95) / 8
= 695 / 8
= 86.875%
→ **Overall-confidence: 85%** (rounded down to nearest 5 per scoring rules)

## Section Omission Rule
- Alerts/Dashboards: None — this is tooling-only with no production deployment
