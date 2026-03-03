"""
score.py — Shadow scoring: produces probabilistic viability scores for naming candidates.

Runs in shadow mode alongside the existing pipeline — scores are informational only
and do NOT gate any names.
"""

from __future__ import annotations

import os
import pickle
from typing import Optional

import numpy as np

try:
    from .train import (
        FEATURE_NAMES,
        _parse_rdap,
        _parse_candidates_md,
        _extract_features,
    )
except ImportError:
    import sys as _sys
    import os as _os
    _sys.path.insert(0, _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
    from naminglab.model.train import (  # type: ignore[no-redef]
        FEATURE_NAMES,
        _parse_rdap,
        _parse_candidates_md,
        _extract_features,
    )


def score_candidates(
    candidates_md: str,
    model_pkl: str,
    rdap_txt: Optional[str] = None,
) -> list[dict]:
    """
    Score naming candidates using the saved shadow model.

    Args:
        candidates_md: path to a naming-candidates markdown file.
        model_pkl: path to a saved (pipeline, meta) pickle file.
        rdap_txt: optional path to an RDAP txt file for status lookup.

    Returns:
        list of dicts with keys:
            name, pattern, score_total, rdap_status, p_viable,
            ci90_lower, ci90_upper, model_version
    """
    # Load model and meta
    with open(model_pkl, "rb") as fh:
        payload = pickle.load(fh)

    if isinstance(payload, tuple):
        pipeline, meta = payload
    else:
        # Legacy: just the pipeline
        pipeline = payload
        meta = {"n_training_samples": 1, "model_version": "unknown"}

    model_version = getattr(pipeline, "model_version", meta.get("model_version", "unknown"))
    n_training = meta.get("n_training_samples", 1) or 1

    # Parse candidates
    candidates = _parse_candidates_md(candidates_md)

    # Parse RDAP if provided
    rdap: dict[str, str] = {}
    if rdap_txt and os.path.exists(rdap_txt):
        rdap = _parse_rdap(rdap_txt)

    if not candidates:
        return []

    # Build feature matrix
    X_rows: list[list[float]] = []
    for cand in candidates:
        scores = {
            "D": cand["score_D"],
            "W": cand["score_W"],
            "P": cand["score_P"],
            "E": cand["score_E"],
            "I": cand["score_I"],
            "score": cand["score_total"],
        }
        feats = _extract_features(cand["name"], cand["pattern"], scores)
        X_rows.append(feats)

    X = np.array(X_rows, dtype=float)

    # Predict probabilities
    proba = pipeline.predict_proba(X)  # shape (n, 2)
    p_viable_arr = proba[:, 1]

    results: list[dict] = []
    z = 1.645  # 90% CI z-score

    for i, cand in enumerate(candidates):
        name_lower = cand["name"].strip().lower()
        rdap_status = rdap.get(name_lower, "unknown")

        p = float(p_viable_arr[i])
        n = n_training

        # Agresti-Coull approximation for CI
        margin = z * (p * (1.0 - p) / n) ** 0.5
        ci_lower = max(0.0, p - margin)
        ci_upper = min(1.0, p + margin)

        results.append(
            {
                "name": cand["name"],
                "pattern": cand["pattern"].strip(),
                "score_total": cand["score_total"],
                "rdap_status": rdap_status,
                "p_viable": round(p, 4),
                "ci90_lower": round(ci_lower, 4),
                "ci90_upper": round(ci_upper, 4),
                "model_version": model_version,
            }
        )

    return results
