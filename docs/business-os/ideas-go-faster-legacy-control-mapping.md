---
Type: Reference
Status: Active
Domain: Business-OS
Last-reviewed: 2026-02-10
Relates-to: .claude/skills/idea-generate/SKILL.md
Legacy-Checklist-Count: 24
Legacy-Red-Flag-Count: 20
---

# Ideas-Go-Faster Legacy Control Mapping

This matrix preserves legacy quality controls from the pre-RS revision and maps them to the revised monolith + 3A/3B flow.

## Legacy Evaluation Checklist Mapping (24)

| Legacy ID | Legacy control | Revised enforcement location | Validator coverage |
|---|---|---|---|
| LC-01 | Stance recorded | Sweep report frontmatter (`Stance`) + stance propagation note | `check-idea-generate-output.sh` frontmatter checks |
| LC-02 | Persistence mode recorded | Sweep report frontmatter (`Persistence-Mode`, `Dry-Run-Writes-Blocked`) | `check-idea-generate-output.sh` frontmatter checks |
| LC-03 | Assumptions source recorded | Sweep report frontmatter (`Assumptions-Source`) + assumptions precedence contract | `check-idea-generate-output.sh` frontmatter checks |
| LC-04 | Verbosity mode recorded | Sweep report frontmatter (`Verbosity-Mode`) + word-limit contract | `check-idea-generate-output.sh` frontmatter checks |
| LC-05 | Sub-experts run recorded | Sweep report frontmatter (`Sub-Experts-Run`, `Sub-Expert-Coverage`) | Contracted in SKILL.md; reviewed in run output |
| LC-06 | Who Said What section present | Report section `Who Said What (F1)` | `check-idea-generate-output.sh` section + attribution token checks |
| LC-07 | Generation cadence executed | Stage 1 divergence/deepening contract + report Generation Phase section | `check-idea-generate-contracts.sh` cadence checks (F8) |
| LC-08 | Depth gate executed | Stage 2 depth gate required fields (`Evidence-Pointers`, `Falsification-Test`, `First-Signal`) | `check-idea-generate-contracts.sh` depth checks (F9) |
| LC-09 | Confidence gate executed | Stage 2 presentable/decision-gap/hunch classification + report section | Contracted in SKILL.md; reviewed in run output |
| LC-10 | Assumption challenge executed when assumptions provided | Stage 2 assumption challenge verdict contract + report section `Assumption Challenge (F3)` | `check-idea-generate-output.sh` verdict-token check when source != none |
| LC-11 | Clustering executed | Stage 3 clustering contract + report section | Contracted in SKILL.md; reviewed in run output |
| LC-12 | Tool-Gap Register present | Report section `Tool-Gap Register (F2)` | `check-idea-generate-output.sh` section + gap/evidence checks |
| LC-13 | Contrarian Gate executed | Stage 3.5 contrarian gate + report section | Contracted in SKILL.md; red flags enforce pass-through |
| LC-14 | Contrarian status constrains verdicts | Stage 4 Munger/Buffett contract ties promote/hold/kill to contrarian status | Contracted in SKILL.md; red flags enforce violations |
| LC-15 | Munger/Buffett filter executed | Stage 4 verdicting + report section | Contracted in SKILL.md; reviewed in run output |
| LC-16 | Kill/Hold rationale present | Report section `Kill/Hold Rationale (F4)` | `check-idea-generate-output.sh` rationale token checks |
| LC-17 | Economics gate executed | Stage 5 economics blocker + report section `Economics Gate (F5)` | `check-idea-generate-output.sh` required economics token checks |
| LC-18 | 3A manifest emitted | Stage 5.5 `commit-manifest.json` contract | `check-idea-generate-output.sh` artifact + schema checks |
| LC-19 | Cards created or previewed | Stage 6 live/dry-run persistence contract | `check-idea-generate-output.sh` ledger mode checks |
| LC-20 | Drucker/Porter priority assigned | Stage 5 priority contract before Stage 6 writes | Contracted in SKILL.md; red flags enforce no out-of-order writes |
| LC-21 | 3B write ledger emitted | Stage 6 `write-ledger.jsonl` contract | `check-idea-generate-output.sh` artifact + schema checks |
| LC-22 | Card ID resolution honored | Stage 7 `{{CARD_ID}}` injection via card-id-map contract | `check-idea-generate-output.sh` manifest factfind dependency/placeholder checks |
| LC-23 | Fact-find seeding or previewed | Stage 7 lp-do-fact-find seeding (live) / preview (dry-run) contract | Contracted in SKILL.md; run output section required in review |
| LC-24 | Top-K pool deterministic | Stage 7 deterministic ordering and newly-promoted-only rule | Contracted in SKILL.md; red flags enforce violations |

## Legacy Red Flag Mapping (20)

| Legacy ID | Legacy red flag | Revised guardrail |
|---|---|---|
| LR-01 | Skipped divergence/deepening cadence | Stage 1 cadence contract + red flag #1 in SKILL.md |
| LR-02 | >1 divergence candidate per sub-expert | Stage 1 divergence cap + red flag #2 |
| LR-03 | Stage 2 candidates missing depth fields | Stage 2 depth gate required fields + red flag #3 |
| LR-04 | Skipped confidence gate | Stage 2 classification contract + red flag #4 |
| LR-05 | Skipped clustering | Stage 3 clustering requirement + red flag #5 |
| LR-06 | Skipped Munger/Buffett filter | Stage 4 verdict requirement + red flag #6 |
| LR-07 | Created cards without Drucker/Porter priority | Stage 5 before Stage 6 ordering + red flag #7 |
| LR-08 | Created lp-do-fact-find docs for low-priority cards | Stage 7 top-K constraint + red flag #8 |
| LR-09 | Persisted hunches | Confidence gate eligibility constraints + red flag #9 |
| LR-10 | Ignored stance | Stance-sensitive generation/prioritization contract + red flag #10 |
| LR-11 | Invented unsupported metrics | Evidence-pointer and observable-data requirement + red flag #11 |
| LR-12 | Deepened >10 candidates per business | Stage 1 deepening hard cap + red flag #12 |
| LR-13 | Musk lens violated 5-step ordering | Lens policy contract + red flag #13 |
| LR-14 | Mixed Top-K pool with existing cards | Stage 7 newly promoted-only pool rule + red flag #14 |
| LR-15 | Skipped Contrarian Gate | Stage 3.5 mandatory contrarian gate + red flag #15 |
| LR-16 | Promoted with UNRESOLVED contrarian status | Stage 4 verdict constraints + red flag #16 |
| LR-17 | Missing gate artifacts in decision log | Dossier decision-log contract + red flag #17 |
| LR-18 | Coverage <80% without rerun contract | Context-discipline rerun policy + red flag #18 |
| LR-19 | Missing signal-quality section/metrics | Signal-quality section + frontmatter metrics + red flag #19 |
| LR-20 | Dry-run performed persistence writes | Stage 6/7 dry-run write block + red flag #20 |

## Notes

- The revised flow preserves the legacy controls and adds incremental controls for F1-F6 transparency and 3A/3B write safety.
- Controls beyond legacy scope (for example `applies_to`, assumptions precedence, verbosity limits, 3A/3B duplicate-write guards) are tracked as additional red flags in current SKILL.md.
