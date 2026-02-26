"""
Confidence-based N planner.
Computes minimum N such that P(Y >= K) >= target_confidence,
where Y ~ Binomial(N, p_yield).
"""
from __future__ import annotations
import math
from scipy.stats import binom


def p_at_least_k(n: int, p_yield: float, k: int) -> float:
    """P(Y >= k) where Y ~ Binomial(N, p_yield)."""
    return 1.0 - binom.cdf(k - 1, n, p_yield)


def min_n_for_confidence(
    p_yield: float,
    k: int = 5,
    target_confidence: float = 0.95,
    max_n: int = 1000,
) -> dict:
    """Find minimum N such that P(Y >= k) >= target_confidence.

    Returns dict:
    {
        recommended_n: int,
        p_yield: float,
        k: int,
        target_confidence: float,
        achieved_confidence: float,
        ci90_lower_n: int,  # N needed if p_yield is at 5th pctile of uncertainty
        ci90_upper_n: int,  # N needed if p_yield is at 95th pctile of uncertainty
        feasible: bool,     # False if max_n reached without achieving target
    }
    """
    # Clamp p_yield to a valid range
    p_yield = max(0.001, min(0.999, p_yield))

    def _find_min_n(py: float) -> tuple[int, float, bool]:
        """Find min N for a given p_yield. Returns (n, achieved_conf, feasible)."""
        for n in range(k, max_n + 1):
            conf = p_at_least_k(n, py, k)
            if conf >= target_confidence:
                return n, conf, True
        # max_n reached
        return max_n, p_at_least_k(max_n, py, k), False

    recommended_n, achieved_confidence, feasible = _find_min_n(p_yield)

    # CI bounds: treat ±10% of p_yield as the 90% credible interval
    # ci90_lower_n: N needed if yield is pessimistic (lower p_yield → more N needed)
    # ci90_upper_n: N needed if yield is optimistic (higher p_yield → less N needed)
    credible_interval_pct = 0.10
    p_yield_pessimistic = max(0.001, p_yield - credible_interval_pct)
    p_yield_optimistic = min(0.999, p_yield + credible_interval_pct)

    ci90_lower_n, _, _ = _find_min_n(p_yield_pessimistic)  # more N needed
    ci90_upper_n, _, _ = _find_min_n(p_yield_optimistic)   # less N needed

    return {
        'recommended_n': recommended_n,
        'p_yield': p_yield,
        'k': k,
        'target_confidence': target_confidence,
        'achieved_confidence': achieved_confidence,
        'ci90_lower_n': ci90_lower_n,
        'ci90_upper_n': ci90_upper_n,
        'feasible': feasible,
    }


def yield_plan_from_history(
    historical_yields: list[float],  # observed RDAP yield fractions per round
    k: int = 5,
    target_confidence: float = 0.95,
    credible_interval_pct: float = 0.10,  # treat ±10% of mean as 90% CI
) -> dict:
    """Compute yield plan using historical yields to estimate p_yield.

    p_yield = mean(historical_yields)
    p_yield_lower = max(0.01, p_yield - credible_interval_pct)
    p_yield_upper = min(0.99, p_yield + credible_interval_pct)

    Returns min_n_for_confidence result plus:
    {historical_mean_yield, historical_min_yield, historical_max_yield, n_rounds_observed}
    """
    if not historical_yields:
        raise ValueError("historical_yields must be non-empty")

    historical_mean_yield = sum(historical_yields) / len(historical_yields)
    historical_min_yield = min(historical_yields)
    historical_max_yield = max(historical_yields)
    n_rounds_observed = len(historical_yields)

    p_yield = historical_mean_yield
    p_yield_lower = max(0.01, p_yield - credible_interval_pct)
    p_yield_upper = min(0.99, p_yield + credible_interval_pct)

    result = min_n_for_confidence(
        p_yield=p_yield,
        k=k,
        target_confidence=target_confidence,
    )

    # Override CI bounds using history-derived credible interval
    def _find_min_n_local(py: float) -> tuple[int, float, bool]:
        py = max(0.001, min(0.999, py))
        for n in range(k, 1001):
            conf = p_at_least_k(n, py, k)
            if conf >= target_confidence:
                return n, conf, True
        return 1000, p_at_least_k(1000, py, k), False

    ci90_lower_n, _, _ = _find_min_n_local(p_yield_lower)
    ci90_upper_n, _, _ = _find_min_n_local(p_yield_upper)

    result['ci90_lower_n'] = ci90_lower_n
    result['ci90_upper_n'] = ci90_upper_n
    result['historical_mean_yield'] = historical_mean_yield
    result['historical_min_yield'] = historical_min_yield
    result['historical_max_yield'] = historical_max_yield
    result['n_rounds_observed'] = n_rounds_observed

    return result
