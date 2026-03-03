# Controller Allocation Report

Generated: 2026-02-26
Status: Advisory only — pending checkpoint sign-off before any production use.

---

## Historical Yield Summary

RDAP availability rates observed across naming rounds:

| Round  | Business | Candidates checked | Available | Yield  |
|--------|----------|--------------------|-----------|--------|
| R3     | HEAD     | 250                | 150       | 60.0%  |
| R4     | HEAD     | 250                | 122       | 48.8%  |
| R5     | HEAD     | 250                | 38        | 15.2%  |
| R6     | HEAD     | 250                | 81        | 32.4%  |
| R3     | HBAG     | 250                | 188       | 75.2%  |

Summary across all 5 rounds:

- Mean yield: **46.3%**
- Min yield: 15.2% (HEAD R5 — anomalously low, likely due to pattern concentration)
- Max yield: 75.2% (HBAG R3)
- Rounds observed: 5

Note: HEAD-only mean (R3–R6) is 39.1%, reflecting a declining trend through R5. Including HBAG R3 raises the cross-business mean to 46.3%.

---

## Yield Planner Output

Using mean yield of 46.3% across all 5 observed rounds.

### Target: at least 5 shortlisted names with 95% confidence

| Parameter              | Value  |
|------------------------|--------|
| Recommended N          | **17** |
| Achieved confidence    | 95.2%  |
| Pessimistic bound (N)  | 23     |
| Optimistic bound (N)   | 14     |
| Feasible               | Yes    |

The pessimistic bound (N=23) applies if yield drops by 10 percentage points from the mean. The optimistic bound (N=14) applies if yield is 10 points higher than mean.

### Target: at least 10 shortlisted names with 95% confidence

| Parameter              | Value  |
|------------------------|--------|
| Recommended N          | **31** |
| Achieved confidence    | 96.2%  |
| Pessimistic bound (N)  | 40     |
| Optimistic bound (N)   | 24     |
| Feasible               | Yes    |

---

## Pattern Bandit Initial State

No pattern-level RDAP breakdown is available from existing shortlists. The bandit starts from a uniform prior — all five pattern families (A, B, C, D, E) begin with equal weight.

| Pattern | Alpha (prior) | Beta (prior) | E[availability rate] |
|---------|---------------|--------------|----------------------|
| A       | 2.0           | 2.0          | 50.0%                |
| B       | 2.0           | 2.0          | 50.0%                |
| C       | 2.0           | 2.0          | 50.0%                |
| D       | 2.0           | 2.0          | 50.0%                |
| E       | 2.0           | 2.0          | 50.0%                |

Prior: Beta(2, 2) — weakly informative. This allows all patterns to be tried in early rounds while avoiding the extreme initial allocations of a flat Beta(1,1) prior.

With an exploration floor of 10%, each pattern receives at least 2 candidates per 20 generated (or 17 using the K=5 recommended N rounded up to a convenient batch size of 20 for practical generation).

---

## Plain-Language Recommendation

**For a round targeting at least 5 shortlisted names with 95% confidence, generate 17 candidates.**

If yield conditions are similar to the worst observed round (HEAD R5 at 15.2%), the planner would recommend generating 54 candidates for the same target — a strong signal that something unusual happened in R5 and that round warrants review before being used as a planning baseline.

A practical round size of 20 candidates provides a small buffer above the recommendation while keeping generation effort reasonable.

**For a round targeting at least 10 shortlisted names with 95% confidence, generate 31 candidates** (or 35 in practice as a round number).

---

## Advisory Note

These outputs are advisory only — pending checkpoint sign-off before any production use. The planner and bandit modules are implemented in `tools/naminglab/controller/` and have passed all automated tests, but they have not yet been connected to the live naming pipeline. The recommended N figures here are inputs for human planning, not automated allocation decisions.
