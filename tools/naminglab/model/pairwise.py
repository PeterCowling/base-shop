"""
pairwise.py — Bradley-Terry pairwise comparison model stub.

Provides a minimal implementation of Bradley-Terry iterative MLE for
estimating relative strength scores from pairwise comparisons.

No external dependencies beyond numpy.
"""

from __future__ import annotations

import numpy as np


def estimate_bradley_terry_scores(
    comparisons: list[dict],
    names: list[str],
    n_iterations: int = 100,
    seed: int = 42,
) -> dict[str, float]:
    """
    Bradley-Terry iterative MLE. Returns uniform scores if < 3 comparisons.

    Args:
        comparisons: list of dicts with keys:
            name_a (str), name_b (str), winner ('a' | 'b' | 'tie'), round_label (str)
        names: list of candidate name strings.
        n_iterations: number of MM (minorisation-maximisation) iterations.
        seed: random seed (unused in deterministic MLE, kept for API compatibility).

    Returns:
        dict mapping name -> Bradley-Terry strength score (positive float).
        Scores are normalised so the geometric mean equals 1.0.
    """
    if len(comparisons) < 3 or not names:
        return {name: 1.0 for name in names}

    name_to_idx: dict[str, int] = {n: i for i, n in enumerate(names)}
    n = len(names)

    # Initialise strengths uniformly
    strengths = np.ones(n, dtype=float)

    # Count wins and games per player
    # wins[i] = number of times player i won (ties count as 0.5)
    # games[i][j] = number of games between i and j
    wins = np.zeros(n, dtype=float)
    games = np.zeros((n, n), dtype=float)

    for comp in comparisons:
        a = name_to_idx.get(comp.get("name_a", ""))
        b = name_to_idx.get(comp.get("name_b", ""))
        if a is None or b is None:
            continue
        winner = comp.get("winner", "tie")
        games[a, b] += 1.0
        games[b, a] += 1.0
        if winner == "a":
            wins[a] += 1.0
        elif winner == "b":
            wins[b] += 1.0
        else:  # tie
            wins[a] += 0.5
            wins[b] += 0.5

    # Bradley-Terry MM update
    for _ in range(n_iterations):
        new_strengths = np.zeros(n, dtype=float)
        for i in range(n):
            denom = 0.0
            for j in range(n):
                if i == j or games[i, j] == 0:
                    continue
                denom += games[i, j] / (strengths[i] + strengths[j])
            if denom > 0:
                new_strengths[i] = wins[i] / denom
            else:
                new_strengths[i] = strengths[i]

        # Normalise to geometric mean = 1
        log_mean = np.mean(np.log(new_strengths + 1e-12))
        new_strengths = new_strengths / np.exp(log_mean)
        strengths = new_strengths

    return {name: float(strengths[name_to_idx[name]]) for name in names}
