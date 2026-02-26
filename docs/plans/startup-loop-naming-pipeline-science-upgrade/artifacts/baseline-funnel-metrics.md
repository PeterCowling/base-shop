---
Type: Baseline-Funnel-Metrics
Task: TASK-01
Plan: startup-loop-naming-pipeline-science-upgrade
Created: 2026-02-26
Sources:
  - docs/business-os/strategy/HEAD/naming-shortlist-2026-02-21.user.md (R3)
  - docs/business-os/strategy/HEAD/naming-shortlist-2026-02-21-r4.user.md (R4)
  - docs/business-os/strategy/HEAD/naming-shortlist-2026-02-21-r5.user.md (R5)
  - docs/business-os/strategy/HEAD/naming-shortlist-2026-02-22-r6.user.md (R6)
  - docs/business-os/strategy/HEAD/naming-rdap-2026-02-22-r6.txt (R6 RDAP)
  - docs/business-os/strategy/HBAG/naming-shortlist-2026-02-21.user.md (R3)
  - docs/business-os/strategy/HBAG/naming-rdap-2026-02-21.txt (R3 RDAP)
  - .claude/skills/lp-do-assessment-04-candidate-names/SKILL.md
  - .claude/skills/lp-do-assessment-05-name-selection/SKILL.md
---

# Naming Pipeline Baseline Funnel Metrics

## 1. Funnel Definition

The current pipeline has these sequential stages:

```
N_generated
  → [I-gate: eliminate I ≤ 3]
N_post_I_gate
  → [RDAP check: 404 = available]
N_pass_rdap
  → [score sort + territory balance → top 20]
N_shortlisted (fixed: 20)
  → [operator selects]
N_finalists
```

**Note:** The I-gate was introduced in Round 4 (HEAD). Rounds prior to R4 had no explicit I-gate; all 250 candidates proceeded to RDAP.

## 2. Baseline Table — HEAD (hair accessories)

| Round | Date | N_generated | N_post_I_gate | I_gate_eliminated | N_pass_rdap | RDAP_yield_pct | N_shortlisted | Max_score | RDAP_unknown |
|-------|------|-------------|---------------|-------------------|-------------|----------------|---------------|-----------|--------------|
| R3 | 2026-02-21 | 250 | 250 (no I-gate) | 0 | 150 | 60.0% | 20 | 24 | unknown¹ |
| R4 | 2026-02-21 | 250 | not logged² | not logged | 122 | 48.8%³ | 20 | 25 | unknown¹ |
| R5 | 2026-02-21 | 250 | 180 | 70 (28.0%) | 38 | 21.1% | 20 | 25 | unknown¹ |
| R6 | 2026-02-22 | 250 | 244 | 6 (2.4%) | 81 | 33.2% | 20 | 23 | 1 |

**Notes:**
1. RDAP result files for R3, R4, R5 were not parsed in this investigation. The R3 and R4 RDAP txt files exist but no ERROR entries were observed in the R6 file scan (1 ERROR(000) for "Collocata").
2. R4 introduced the I-gate ("I ≤ 3 eliminated") but did not log `Total scored (post-I-gate)` in the shortlist header — this field was added in R5.
3. RDAP yield for R4 expressed as N_pass_rdap / N_generated (250), since N_post_I_gate is unlogged.

**Score distributions (available names only):**

| Round | ≥18 | 14–17 | ≤13 |
|-------|-----|-------|-----|
| R3 | 145 (96.7%) | 5 (3.3%) | 0 |
| R4 | 122 (100%) | 0 | 0 |
| R5 | 38 (100%) | 0 | 0 |
| R6 | 68 (84%) | — | — |

*R6 score distribution counted from shortlist header: Score 23:5, 22:2, 21:57, 20:1, 19:1, 18:2 = 68 names at ≥18. Remaining 13 of the 81 available are below 18.*

## 3. Baseline Table — HBAG (artisan handbags)

| Round | Date | N_generated | N_post_I_gate | I_gate_eliminated | N_pass_rdap | RDAP_yield_pct | N_shortlisted | Max_score | RDAP_unknown |
|-------|------|-------------|---------------|-------------------|-------------|----------------|---------------|-----------|--------------|
| R3 | 2026-02-21 | 250 | 250 (no I-gate recorded) | 0 | 188 | 75.2% | 20 | 25 | 0¹ |

**Notes:**
1. HBAG R3 RDAP file scanned fully: all entries are AVAILABLE or TAKEN. No ERROR/UNKNOWN entries observed.

**Score distribution (available names, HBAG R3):** All 188 available names scored ≥18. Score distribution:
- Pattern A: 80 available names, Pattern B: 37, Pattern C: 31, Pattern D: 36, Pattern E: 4.

## 4. Cross-Round Observations

### 4a. RDAP yield is highly variable

RDAP yield ranges from **21.1% (HEAD R5)** to **75.2% (HBAG R3)**. This is driven by name length and token complexity:
- HBAG R3 used 10–12 character multi-morpheme coinages → few domains taken, high availability
- HEAD R5 introduced longer patterns but after 1,000+ total names eliminated, the vocabulary was more exhausted
- HEAD R6 rebounded to 33.2% by switching to new semantic territory vocabulary

The fixed `N=250` generation budget does not account for expected RDAP yield — resulting rounds can produce very different usable shortlist pools.

### 4b. I-gate elimination is round-dependent

The I-gate (eliminate candidates with I ≤ 3) has inconsistent bite:
- HEAD R5: 70 eliminated (28%) — new territory vocabulary misaligned with ICP resonance scoring
- HEAD R6: only 6 eliminated (2.4%) — vocabulary re-anchored to emotional territories

This variability means post-I-gate candidate count is unpredictable from N_generated alone.

### 4c. N_finalists is currently unmeasured

No artifact in the current pipeline records how many names the operator selects from the shortlist for registrar confirmation and TM pre-screen. The shortlist presents "top 20" but operator selection is not logged. This is a structural data gap for model validation.

### 4d. Stage time is not tracked

No timing data is present in any naming artifact (generation, RDAP check, operator review). Per-stage elapsed time is currently unmeasurable from artifacts alone.

### 4e. One confirmed RDAP unknown state (HEAD R6)

HEAD R6 contains one `ERROR(000)` for the name "Collocata" — this is a failed curl request (HTTP status 0 = connection error or timeout). Current pipeline has no retry logic and no documented handling for this state.

### 4f. Score ceiling difference between businesses

- HBAG R3 achieved max score 25 (all top 12 names scored 25)
- HEAD best-round max score is 25 (R4, R5) but dropped to 23 in R6 as vocabulary became harder to coin cleanly from

This suggests HBAG's longer, more invented token vocabulary produces cleaner scores, while HEAD's shorter functional-vocabulary approach hits ceiling constraints earlier.

## 5. Computed Baseline Summary (for model calibration reference)

| Metric | HEAD mean (R3–R6) | HBAG R3 |
|--------|-------------------|---------|
| N_generated | 250 (fixed) | 250 (fixed) |
| I-gate elimination rate | ~10% (avg R4–R6; R3 no gate) | ~0% (not applied) |
| RDAP yield (of N_generated) | ~41% | 75.2% |
| N_pass_rdap (mean) | ~98 | 188 |
| RDAP unknown rate | <0.5% | 0% |
| N_shortlisted | 20 (fixed) | 20 (fixed) |
| Finalist-to-shortlist ratio | unmeasured | unmeasured |

**Interpretation:** The pipeline currently "works" at fixed `N=250` because even at the worst observed yield (21.1%), 38 domain-available candidates remain, which is enough to populate a top-20 shortlist. However, if yield dropped below ~10% (25 names), the shortlist would fail to meet the quality gate (≥10 available names with score ≥14).

## 6. Data Gaps and Completeness Signal

| Gap | Impact on downstream tasks | Priority |
|-----|---------------------------|----------|
| N_finalists not logged | Cannot compute finalist-to-shortlist conversion rate; blocks human-annotation-based model training | HIGH |
| Stage timing not recorded | Cannot measure per-stage cost or set adaptive planning benchmarks | MEDIUM |
| RDAP telemetry absent | Cannot classify unknown-state causes or measure retry effectiveness | HIGH |
| I-gate count missing in R4 | Incomplete I-gate baseline; must be reconstructed from RDAP file row count | LOW |
| RDAP files R3/R4/R5 unparsed for ERROR rate | May understate unknown rate in baseline | MEDIUM |

**Go/no-go signal for TASK-04 and TASK-05:** See `quant-runtime-contract.md` §4.
