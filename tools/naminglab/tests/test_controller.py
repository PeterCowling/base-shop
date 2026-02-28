"""
test_controller.py — Pytest tests for controller modules (TASK-05).

All tests are self-contained (no real file I/O).
"""
from __future__ import annotations

import math
import pytest

from controller.bandit import PatternBandit, PATTERNS
from controller.yield_planner import min_n_for_confidence, yield_plan_from_history


# ---------------------------------------------------------------------------
# TC-02: Posterior updates reproducible on synthetic round outcomes
# ---------------------------------------------------------------------------


def test_posterior_update_reproducible():
    """Same seed + same updates -> same allocation."""
    b1 = PatternBandit(seed=42)
    b2 = PatternBandit(seed=42)
    b1.update('A', n_available=30, n_checked=80)
    b2.update('A', n_available=30, n_checked=80)
    alloc1 = b1.allocate(250)
    alloc2 = b2.allocate(250)
    assert alloc1 == alloc2  # same seed -> same allocation


def test_state_roundtrip():
    """State serialization and reconstruction preserves alphas and betas."""
    b = PatternBandit(seed=42)
    b.update('A', 30, 80)
    b.update('B', 15, 50)
    state = b.state()
    b2 = PatternBandit.from_state(state)
    assert b2.alphas == b.alphas
    assert b2.betas == b.betas


# ---------------------------------------------------------------------------
# TC-03: Allocation output sums to planned N and respects exploration floor
# ---------------------------------------------------------------------------


def test_allocation_sums_to_n():
    """allocate(250) must sum to 250 and cover all patterns."""
    b = PatternBandit(seed=42)
    alloc = b.allocate(250)
    assert sum(alloc.values()) == 250
    assert set(alloc.keys()) == set(['A', 'B', 'C', 'D', 'E'])


def test_exploration_floor_respected():
    """Even if one arm dominates, all arms get at least 10% of N."""
    b = PatternBandit(seed=42, exploration_floor=0.10)
    # A arm looks great — dominates posteriors
    b.update('A', 100, 100)
    alloc = b.allocate(250)
    for pattern, count in alloc.items():
        assert count >= math.floor(0.10 * 250), f"Pattern {pattern} got {count} < floor"


def test_allocation_all_patterns_present():
    """All 5 pattern arms appear in the allocation dict."""
    b = PatternBandit(seed=7)
    alloc = b.allocate(100)
    assert set(alloc.keys()) == set(PATTERNS)


def test_update_from_historical_rounds():
    """update_from_historical_rounds applies all rows."""
    b = PatternBandit(seed=42)
    initial_alpha_a = b.alphas['A']
    rounds = [
        {'pattern': 'A', 'n_available': 30, 'n_checked': 80},
        {'pattern': 'A', 'n_available': 20, 'n_checked': 60},
    ]
    b.update_from_historical_rounds(rounds)
    assert b.alphas['A'] == initial_alpha_a + 30 + 20


def test_state_contains_required_keys():
    """state() must return alphas, betas, seed."""
    b = PatternBandit(seed=42)
    s = b.state()
    assert 'alphas' in s
    assert 'betas' in s
    assert 'seed' in s


# ---------------------------------------------------------------------------
# TC-04: Yield planner reproduces expected threshold behavior
# ---------------------------------------------------------------------------


def test_yield_planner_known_case():
    """With p_yield=0.5, k=5: P(Binomial(N,0.5) >= 5) >= 0.95 needs N <= 20."""
    result = min_n_for_confidence(p_yield=0.5, k=5, target_confidence=0.95)
    assert result['recommended_n'] <= 20
    assert result['achieved_confidence'] >= 0.95
    assert result['feasible'] == True


def test_yield_plan_from_history():
    """yield_plan_from_history computes plan from observed yields."""
    yields = [0.33, 0.22, 0.49, 0.75, 0.60]  # from baseline data
    result = yield_plan_from_history(yields, k=5, target_confidence=0.95)
    assert result['recommended_n'] >= 1
    assert result['n_rounds_observed'] == 5
    assert 0.0 < result['historical_mean_yield'] < 1.0


def test_yield_planner_returns_all_keys():
    """min_n_for_confidence must return all required keys."""
    result = min_n_for_confidence(p_yield=0.4, k=5, target_confidence=0.95)
    required = {
        'recommended_n', 'p_yield', 'k', 'target_confidence',
        'achieved_confidence', 'ci90_lower_n', 'ci90_upper_n', 'feasible',
    }
    for key in required:
        assert key in result, f"Missing key: {key}"


def test_yield_plan_history_returns_extra_keys():
    """yield_plan_from_history must return historical stats keys."""
    yields = [0.40, 0.50, 0.60]
    result = yield_plan_from_history(yields, k=5)
    assert 'historical_mean_yield' in result
    assert 'historical_min_yield' in result
    assert 'historical_max_yield' in result
    assert result['n_rounds_observed'] == 3


def test_yield_planner_feasibility_flag():
    """With very low yield and small max_n, feasible should be False."""
    result = min_n_for_confidence(p_yield=0.01, k=10, target_confidence=0.95, max_n=50)
    assert result['feasible'] == False


def test_yield_planner_ci_lower_ge_recommended():
    """ci90_lower_n (pessimistic) should be >= recommended_n."""
    result = min_n_for_confidence(p_yield=0.5, k=5, target_confidence=0.95)
    assert result['ci90_lower_n'] >= result['recommended_n']


def test_yield_planner_ci_upper_le_recommended():
    """ci90_upper_n (optimistic) should be <= recommended_n."""
    result = min_n_for_confidence(p_yield=0.5, k=5, target_confidence=0.95)
    assert result['ci90_upper_n'] <= result['recommended_n']
