"""
Thompson-sampling bandit for pattern allocation across naming rounds.
Each pattern (A, B, C, D, E) is an arm.
Prior: Beta(2, 2) (weakly informative, allows all patterns initially).
"""
from __future__ import annotations
import numpy as np

PATTERNS = ['A', 'B', 'C', 'D', 'E']


class PatternBandit:
    def __init__(self, seed: int = 42, exploration_floor: float = 0.10):
        """
        seed: for reproducible sampling
        exploration_floor: minimum fraction of N allocated to each arm (prevents starvation)
        """
        self.seed = seed
        self.exploration_floor = exploration_floor
        self.alphas = {p: 2.0 for p in PATTERNS}  # Beta prior alpha (successes + 1)
        self.betas = {p: 2.0 for p in PATTERNS}   # Beta prior beta (failures + 1)
        self._rng = np.random.default_rng(seed)

    def update(self, pattern: str, n_available: int, n_checked: int) -> None:
        """Update posterior for a pattern arm given RDAP outcomes.

        n_available: how many names of this pattern were RDAP-available this round
        n_checked: how many names of this pattern were checked (= generated for this pattern)
        """
        self.alphas[pattern] += n_available
        self.betas[pattern] += (n_checked - n_available)

    def allocate(self, total_n: int) -> dict[str, int]:
        """Sample from posteriors and allocate total_n across patterns.

        Returns dict mapping pattern -> count, summing to total_n.
        Respects exploration_floor (each arm gets at least floor * total_n names).
        """
        # Thompson sampling: draw theta_k ~ Beta(alpha_k, beta_k)
        thetas = {
            p: self._rng.beta(self.alphas[p], self.betas[p])
            for p in PATTERNS
        }

        # Normalize to proportions
        total_theta = sum(thetas.values())
        if total_theta == 0:
            proportions = {p: 1.0 / len(PATTERNS) for p in PATTERNS}
        else:
            proportions = {p: thetas[p] / total_theta for p in PATTERNS}

        # Apply exploration floor
        floor_count = int(self.exploration_floor * total_n)
        floor_total = floor_count * len(PATTERNS)
        remaining_n = total_n - floor_total

        if remaining_n < 0:
            # Floor exceeds total — distribute evenly
            base = total_n // len(PATTERNS)
            allocation = {p: base for p in PATTERNS}
            remainder = total_n - base * len(PATTERNS)
            # Give remainder to the highest-sampled arm
            sorted_patterns = sorted(PATTERNS, key=lambda p: thetas[p], reverse=True)
            for i in range(remainder):
                allocation[sorted_patterns[i]] += 1
            return allocation

        # Allocate remaining_n proportionally based on Thompson samples
        raw_alloc = {p: proportions[p] * remaining_n for p in PATTERNS}
        # Floor via integer truncation
        alloc = {p: int(raw_alloc[p]) + floor_count for p in PATTERNS}

        # Compute remainder to distribute
        current_sum = sum(alloc.values())
        remainder = total_n - current_sum

        if remainder != 0:
            # Sort by fractional part descending, give extras to highest fractions
            # (or take from lowest if remainder is negative)
            fractional_parts = {p: raw_alloc[p] - int(raw_alloc[p]) for p in PATTERNS}
            sorted_by_fraction = sorted(PATTERNS, key=lambda p: fractional_parts[p], reverse=(remainder > 0))
            for i in range(abs(remainder)):
                p = sorted_by_fraction[i % len(PATTERNS)]
                alloc[p] += (1 if remainder > 0 else -1)

        # Final safety: ensure no arm goes below floor_count
        for p in PATTERNS:
            if alloc[p] < floor_count:
                alloc[p] = floor_count

        # Re-normalize sum if safety adjustment caused drift
        current_sum = sum(alloc.values())
        if current_sum != total_n:
            diff = total_n - current_sum
            # Add/subtract from the arm with highest theta
            best_arm = max(PATTERNS, key=lambda p: thetas[p])
            alloc[best_arm] += diff

        return alloc

    def state(self) -> dict:
        """Return current alpha/beta state for serialization."""
        return {'alphas': dict(self.alphas), 'betas': dict(self.betas), 'seed': self.seed}

    @classmethod
    def from_state(cls, state: dict) -> 'PatternBandit':
        """Reconstruct from serialized state."""
        bandit = cls(seed=state['seed'])
        bandit.alphas = dict(state['alphas'])
        bandit.betas = dict(state['betas'])
        # Recreate RNG from seed (state doesn't capture mid-stream RNG state,
        # but for serialization/reconstruction this is the documented contract)
        bandit._rng = np.random.default_rng(state['seed'])
        return bandit

    def update_from_historical_rounds(self, round_data: list[dict]) -> None:
        """Update from historical round data.

        round_data: list of {pattern: str, n_available: int, n_checked: int}
        """
        for row in round_data:
            self.update(row['pattern'], row['n_available'], row['n_checked'])
