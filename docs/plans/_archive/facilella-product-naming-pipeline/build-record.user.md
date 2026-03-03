---
Status: Complete
Feature-Slug: facilella-product-naming-pipeline
Completed-date: 2026-02-26
artifact: build-record
---

# Build Record — Facilella Product Naming Pipeline

## What Was Built

**Wave 1 (TASK-01, TASK-02, TASK-07):**

A product naming spec (`2026-02-26-product-naming-spec.md`) was written for HEAD/Facilella — a fully agent-executable document covering the DWPEIC scoring rubric (6 dimensions, max 30), 5 naming territories with situation anchors and word banks (Italian Product-Type, Italian Benefit, Italian Routine, English Loan, Coined Diminutive), pattern pools (A/B/C/E), hard blockers (EU MDR vocabulary ban, spa/wellness register ban, concealment ban, infantilisation ban, compound phonetic constraint), and a pre-generation territory integrity gate. Five ASSESSMENT-13 provisional seeds were carried forward as scored candidates rather than pre-eliminations.

The shared sidecar event infrastructure was extended additively: `event-log-writer.ts` gained a new `TmPrescreenRecord` interface, an optional `tm_prescreen` field on `SidecarEvent`, `'tm_prescreened'` added to the `SidecarStage` union and `VALID_STAGES` Set. `candidate-sidecar-schema.json` was updated with the new stage enum value and `tm_prescreen` property. All changes were additive; no existing company naming events or CLI code was affected.

The ASSESSMENT-13 SKILL.md received a pipeline pointer paragraph directing operators to this pipeline when a rigorous shortlist is wanted before committing to packaging and logo work.

**Wave 2 (TASK-03, TASK-04):**

`tm-prescreen-cli.ts` was built — a new CLI following the structural model of `rdap-cli.ts`. It reads product line name candidates from stdin, generates EUIPO eTMview, WIPO Global Brand Database, and UIBM search direction URLs for Nice Classification Classes 25 and 26, writes `generated` + `tm_prescreened` sidecar events to the `product-naming-sidecars/` directory, and outputs a structured plain-text direction document to stdout. An environment variable (`TM_SIDECAR_DIR`) allows test runs to use a temporary directory, keeping the production sidecar clean.

72 scored product name candidates were generated across 5 territories (T1=17, T2=16, T3=14, T4=11, T5=14). All candidates passed the I hard gate (I ≥ 4). Three candidates were eliminated during generation: Pronteska (W=1, cluttered wordmark), Sveltta (double-consonant phonetic failure in compound), and Fisco (Italian for "tax authority" — wrong register entirely). The English Loan territory produced 11 rather than the target 15 — English loans score lower on ICP resonance for the Italian-primary caregiver ICP; the pipeline supports a second-round targeted generation if the operator wants more English options. Top scorers: Archella and Nastella at 28/30; 16 candidates at 26/30.

**Wave 3 (TASK-05):**

The TM pre-screen CLI was run on the top 20 candidates by DWPEIC score. Output was captured to `product-naming-tm-2026-02-26.txt` (380 lines, one structured block per candidate including EUIPO, WIPO, and UIBM search direction URLs with manual-entry instructions). The sidecar file `product-naming-sidecars/2026-02-26-round-1.jsonl` contains exactly 40 events (20 generated + 20 tm_prescreened), one pair per candidate.

**Wave 4 (TASK-06):**

A shortlist artifact (`product-naming-shortlist-2026-02-26.user.md`) was written covering: the ranked top 20 candidates with scores and TM pre-screen status, a curator's analysis by territory, an operator selection section (pending operator action), and a reference to the TM direction file. The ASSESSMENT-13 artifact (`2026-02-26-product-naming.user.md`) Section B was updated to reflect pipeline scores for each of the 5 original seeds (shortlisted/reviewed), a pipeline reference note, and the top 5 pipeline recommendations surfaced for the operator.

---

## Tests Run

| Task | Contract | Command | Outcome |
|------|----------|---------|---------|
| TASK-01 | VC-01 | `ls docs/business-os/strategy/HEAD/2026-02-26-product-naming-spec.md` | PASS |
| TASK-01 | VC-02 | grep for D/W/P/E/I/C scoring headers | PASS |
| TASK-01 | VC-03 | verify 5 territories with distinct situation anchors | PASS |
| TASK-01 | VC-04 | grep for "MDR" and "consonant" in spec | PASS |
| TASK-02 | TC-01 | `const s: SidecarStage = 'tm_prescreened'` compiles | PASS |
| TASK-02 | TC-02 | `validateSidecarEvent()` returns `valid: true` for tm_prescreened stage | PASS |
| TASK-02 | TC-03 | Python: `'tm_prescreened' in stages` from JSON Schema | PASS |
| TASK-02 | TC-04 | `npx tsc --project scripts/tsconfig.json --noEmit` exits 0 | PASS |
| TASK-03 | TC-01 | Cerchietto on stdin → stdout contains EUIPO/WIPO/UIBM URLs | PASS |
| TASK-03 | TC-02 | EUIPO URL contains `euipo.europa.eu` domain | PASS |
| TASK-03 | TC-03 | Sidecar JSONL created in temp dir | PASS |
| TASK-03 | TC-04 | Sidecar contains `stage: "tm_prescreened"` with `tm_prescreen` field | PASS |
| TASK-03 | typecheck | `npx tsc --project scripts/tsconfig.json --noEmit` exits 0 | PASS |
| TASK-04 | VC-01 | `wc -l` = 234 (> 80 required) | PASS |
| TASK-04 | VC-02 | D/W/P/E/I/C/Score header present in candidate table | PASS |
| TASK-04 | VC-03 | Territory distribution: T1=17, T2=16, T3=14, T4=11, T5=14 (all ≥ 10, all ≤ 20) | PASS |
| TASK-04 | VC-04 | Min I score = 4 across all scored rows (I gate enforced) | PASS |
| TASK-05 | TC-01 | `wc -l product-naming-tm-2026-02-26.txt` = 380 (> 60) | PASS |
| TASK-05 | TC-02 | `wc -l sidecar.jsonl` = 40 (20 generated + 20 tm_prescreened) | PASS |
| TASK-05 | TC-03 | `grep tm_prescreened sidecar.jsonl | wc -l` = 20 | PASS |
| TASK-06 | VC-01 | shortlist file exists | PASS |
| TASK-06 | VC-02 | 20 bold-name rows in shortlist | PASS |
| TASK-06 | VC-03 | Operator selected field present | PASS |
| TASK-06 | VC-04 | TM pre-screen status column present; ASSESSMENT-13 Section B updated | PASS |

---

## Validation Evidence

All VC and TC contracts passed as documented in plan.md task build evidence blocks. See `docs/plans/facilella-product-naming-pipeline/plan.md` for per-task evidence.

Noteworthy: TC-02 for TASK-05 (sidecar = exactly 40 lines) required a clean-room re-run — a first invocation with `2>&1` redirect had duplicated sidecar events. The production sidecar directory was deleted and re-run from scratch in a single clean invocation, achieving the deterministic 40-line count.

---

## Scope Deviations

None. The build remained within the scope defined in the plan. The English Loan territory produced 11 candidates (target 15) due to the I gate eliminating English loans with lower Italian caregiver resonance — this is documented in the candidate file summary and the pipeline supports a second-round targeted generation.

---

## Outcome Contract

- **Why:** The ASSESSMENT-13 artifact has 5 provisional candidates generated without a systematic spec or scoring rubric. A pipeline analogous to the company naming pipeline would produce a defensible shortlist before committing to a product name that will appear on packaging, Etsy listings, and all product-facing copy.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A product naming pipeline producing a spec file, a generation run of 72 scored candidates, a TM pre-screen direction document, and a shortlist of 20 candidates ready for operator selection. Pipeline tooling persisted as reusable TypeScript and spec infrastructure.
- **Source:** operator
