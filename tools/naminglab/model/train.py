"""
train.py — Shadow probabilistic scoring model for the naming pipeline.

Trains a LogisticRegression model on proxy labels derived from existing
naming artifacts (markdown candidate tables + RDAP availability files).

Shadow mode: the model produces scores but does NOT gate any names.
"""

from __future__ import annotations

import argparse
import json
import os
import pickle
import re
import sys
from datetime import date
from typing import Optional

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# ---------------------------------------------------------------------------
# Feature configuration
# ---------------------------------------------------------------------------

FEATURE_NAMES = [
    "score_D",
    "score_W",
    "score_P",
    "score_E",
    "score_I",
    "score_total",
    "pattern_A",
    "pattern_B",
    "pattern_C",
    "pattern_D",
    "pattern_E",
    "name_length",
    "vowel_ratio",
    "has_italian_suffix",
]

ITALIAN_SUFFIXES = ("ova", "ella", "ina", "ora", "eva", "elo", "ari", "eno")
VOWELS = set("aeiouàèìòùáéíóú")
VALID_PATTERNS = {"A", "B", "C", "D", "E"}


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------


def _parse_rdap(rdap_path: str) -> dict[str, str]:
    """
    Parse an RDAP text file and return a dict mapping lowercased name -> status.

    Status values: 'available', 'taken', 'unknown'.
    """
    rdap: dict[str, str] = {}
    with open(rdap_path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if not line.strip():
                continue
            parts = line.split()
            if not parts:
                continue
            status_token = parts[0].upper()
            if status_token == "AVAILABLE":
                status = "available"
            elif status_token == "TAKEN":
                status = "taken"
            else:
                status = "unknown"
            # The name may be multi-token — join the rest and strip
            name = " ".join(parts[1:]).strip().lower()
            if name:
                rdap[name] = status
    return rdap


def _detect_columns(header_cells: list[str]) -> dict[str, int]:
    """
    Detect column indices by name (case-insensitive) from a parsed header row.

    Returns a dict of canonical_name -> 0-based column index.
    """
    col_map: dict[str, int] = {}
    canonical = {
        "name": "name",
        "pattern": "pattern",
        "d": "D",
        "w": "W",
        "p": "P",
        "e": "E",
        "i": "I",
        "score": "score",
    }
    for idx, cell in enumerate(header_cells):
        key = cell.strip().lower()
        if key in canonical:
            col_map[canonical[key]] = idx
    return col_map


def _split_md_row(line: str) -> list[str]:
    """Split a markdown table line on '|', discarding leading/trailing pipes."""
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return line.split("|")


def _extract_features(
    name: str, pattern_raw: str, scores: dict[str, int]
) -> list[float]:
    """
    Extract feature vector from a single candidate.

    Args:
        name: the candidate name (spoken name for Pattern D).
        pattern_raw: the raw pattern string (e.g. 'A', 'B', 'D', 'A ').
        scores: dict with keys D, W, P, E, I, score.

    Returns:
        list of float feature values in FEATURE_NAMES order.
    """
    # Normalise pattern — take first letter that is in VALID_PATTERNS
    pattern = "X"
    for ch in pattern_raw.upper():
        if ch in VALID_PATTERNS:
            pattern = ch
            break

    name_clean = name.strip()
    name_lower = name_clean.lower()
    n = len(name_clean) if name_clean else 1

    vowel_count = sum(1 for ch in name_lower if ch in VOWELS)
    vowel_ratio = vowel_count / n

    has_italian = int(any(name_lower.endswith(sfx) for sfx in ITALIAN_SUFFIXES))

    return [
        float(scores.get("D", 0)),
        float(scores.get("W", 0)),
        float(scores.get("P", 0)),
        float(scores.get("E", 0)),
        float(scores.get("I", 0)),
        float(scores.get("score", 0)),
        float(pattern == "A"),
        float(pattern == "B"),
        float(pattern == "C"),
        float(pattern == "D"),
        float(pattern == "E"),
        float(n),
        vowel_ratio,
        float(has_italian),
    ]


def _parse_candidates_md(md_path: str) -> list[dict]:
    """
    Parse a naming candidates markdown file.

    Returns a list of dicts with keys:
        name, pattern, score_D, score_W, score_P, score_E, score_I, score_total
    """
    rows = []
    col_map: dict[str, int] = {}
    in_table = False

    with open(md_path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if "|" not in line:
                # Non-table line — if we're in a table reset the in_table flag
                # but keep scanning (the r6 file has multiple tables)
                in_table = False
                col_map = {}
                continue
            cells = _split_md_row(line)
            cells_stripped = [c.strip() for c in cells]

            # Detect header row
            header_lower = [c.lower() for c in cells_stripped]
            if "name" in header_lower and "pattern" in header_lower and "score" in header_lower:
                col_map = _detect_columns(cells_stripped)
                in_table = True
                continue

            if not in_table:
                continue

            # Skip separator rows
            if all(re.match(r"^[-:|]+$", c) or c == "" for c in cells_stripped):
                continue

            if not col_map:
                continue

            # Need at minimum: name, pattern, D, W, P, E, I, score columns
            required = {"name", "pattern", "D", "W", "P", "E", "I", "score"}
            if not required.issubset(col_map.keys()):
                continue

            try:
                name_idx = col_map["name"]
                pattern_idx = col_map["pattern"]
                if name_idx >= len(cells_stripped) or pattern_idx >= len(cells_stripped):
                    continue

                name = cells_stripped[name_idx]
                pattern_raw = cells_stripped[pattern_idx]

                def _safe_int(val: str) -> int:
                    try:
                        return int(val.strip())
                    except (ValueError, AttributeError):
                        return 0

                score_d = _safe_int(cells_stripped[col_map["D"]])
                score_w = _safe_int(cells_stripped[col_map["W"]])
                score_p = _safe_int(cells_stripped[col_map["P"]])
                score_e = _safe_int(cells_stripped[col_map["E"]])
                score_i = _safe_int(cells_stripped[col_map["I"]])
                score_total = _safe_int(cells_stripped[col_map["score"]])

                if not name or not re.match(r"[A-Za-z]", name):
                    continue

                rows.append(
                    {
                        "name": name,
                        "pattern": pattern_raw,
                        "score_D": score_d,
                        "score_W": score_w,
                        "score_P": score_p,
                        "score_E": score_e,
                        "score_I": score_i,
                        "score_total": score_total,
                    }
                )
            except (IndexError, KeyError):
                continue

    return rows


def _assign_proxy_label(
    candidate: dict, rdap: dict[str, str]
) -> Optional[int]:
    """
    Assign a proxy viability label.

    viable = 1 if RDAP available AND score >= 18
    viable = 0 if RDAP taken
    viable = None (excluded) otherwise
    """
    name_lower = candidate["name"].strip().lower()
    status = rdap.get(name_lower, "unknown")

    if status == "taken":
        return 0
    if status == "available":
        if candidate["score_total"] >= 18:
            return 1
        return None  # available but below threshold — exclude
    return None  # unknown/error — exclude


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def load_proxy_dataset(
    candidate_rdap_pairs: list[tuple[str, str, str]],
) -> tuple[np.ndarray, np.ndarray, list[str], list[str]]:
    """
    Build a labeled dataset from naming artifact pairs.

    Args:
        candidate_rdap_pairs: list of (candidates_md_path, rdap_txt_path, round_label)

    Returns:
        (X, y, feature_names, round_labels)
        X: (n_samples, n_features) float array
        y: (n_samples,) int array (0 or 1)
        feature_names: list of feature name strings
        round_labels: list of round label strings (one per sample)
    """
    X_rows: list[list[float]] = []
    y_vals: list[int] = []
    round_labels_out: list[str] = []

    for md_path, rdap_path, round_label in candidate_rdap_pairs:
        if not os.path.exists(md_path):
            print(f"[load] WARNING: missing {md_path} — skipping", file=sys.stderr)
            continue
        candidates = _parse_candidates_md(md_path)
        rdap: dict[str, str] = {}
        if rdap_path and os.path.exists(rdap_path):
            rdap = _parse_rdap(rdap_path)

        for cand in candidates:
            label = _assign_proxy_label(cand, rdap)
            if label is None:
                continue

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
            y_vals.append(label)
            round_labels_out.append(round_label)

    if not X_rows:
        X = np.zeros((0, len(FEATURE_NAMES)), dtype=float)
        y = np.zeros(0, dtype=int)
        return X, y, FEATURE_NAMES, []

    X = np.array(X_rows, dtype=float)
    y = np.array(y_vals, dtype=int)
    return X, y, FEATURE_NAMES, round_labels_out


def train_model(
    candidate_rdap_pairs: list[tuple[str, str, str]],
    model_version: str = "v1",
    seed: int = 42,
    model_out: Optional[str] = None,
    meta_out: Optional[str] = None,
) -> tuple:
    """
    Train a logistic regression model on proxy-labeled naming data.

    Args:
        candidate_rdap_pairs: list of (candidates_md_path, rdap_txt_path, round_label)
        model_version: version tag stored in the pipeline and meta.
        seed: random seed for reproducibility.
        model_out: if provided, save the (pipeline, meta) tuple as a .pkl file here.
        meta_out: if provided, save metadata as a JSON file here.

    Returns:
        (pipeline, meta_dict)
    """
    X, y, feature_names, round_labels = load_proxy_dataset(candidate_rdap_pairs)

    n_samples = len(y)
    n_positive = int(np.sum(y == 1))
    n_negative = int(np.sum(y == 0))
    training_rounds = sorted(set(round_labels))

    print(
        f"[train] Dataset: {n_samples} samples  |  "
        f"positive={n_positive}  negative={n_negative}",
        file=sys.stderr,
    )

    if n_samples < 10:
        print(
            f"[train] WARNING: fewer than 10 labeled samples ({n_samples}). "
            "Model calibration will be limited — report threshold-based baseline.",
            file=sys.stderr,
        )

    pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=1000, random_state=seed)),
        ]
    )

    # Cross-validation (only if enough samples per class)
    cv_brier_mean: Optional[float] = None
    cv_brier_std: Optional[float] = None

    min_class = min(n_positive, n_negative) if n_samples > 0 else 0
    if min_class >= 6 and n_samples >= 6:
        n_folds = min(5, min_class)
        scores_cv = cross_val_score(
            pipeline, X, y, cv=n_folds, scoring="neg_brier_score"
        )
        cv_brier_mean = float(-scores_cv.mean())
        cv_brier_std = float(scores_cv.std())
        print(
            f"[train] CV ({n_folds}-fold) Brier: "
            f"{cv_brier_mean:.4f} +/- {cv_brier_std:.4f}",
            file=sys.stderr,
        )
    else:
        print(
            f"[train] Skipping CV — fewer than 6 samples per class "
            f"(min_class={min_class})",
            file=sys.stderr,
        )

    # Fit on full dataset (or dummy if empty)
    if n_samples > 0 and n_positive > 0 and n_negative > 0:
        pipeline.fit(X, y)
    else:
        # Fit on dummy data so pipeline is usable for scoring
        dummy_X = np.zeros((2, len(FEATURE_NAMES)), dtype=float)
        dummy_y = np.array([0, 1])
        pipeline.fit(dummy_X, dummy_y)

    # Attach version tag so score.py can read it from the pickle
    pipeline.model_version = model_version  # type: ignore[attr-defined]

    meta_dict = {
        "model_version": model_version,
        "training_date": date.today().isoformat(),
        "n_training_samples": n_samples,
        "n_positive": n_positive,
        "n_negative": n_negative,
        "feature_names": feature_names,
        "seed": seed,
        "cv_brier_mean": cv_brier_mean,
        "cv_brier_std": cv_brier_std,
        "training_rounds": training_rounds,
    }

    if model_out:
        os.makedirs(os.path.dirname(os.path.abspath(model_out)), exist_ok=True)
        with open(model_out, "wb") as fh:
            pickle.dump((pipeline, meta_dict), fh)
        print(f"[train] Saved model -> {model_out}", file=sys.stderr)

    if meta_out:
        os.makedirs(os.path.dirname(os.path.abspath(meta_out)), exist_ok=True)
        with open(meta_out, "w", encoding="utf-8") as fh:
            json.dump(meta_dict, fh, indent=2)
        print(f"[train] Saved meta  -> {meta_out}", file=sys.stderr)

    return pipeline, meta_dict


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------


def _default_pairs(repo_root: str) -> list[tuple[str, str, str]]:
    head = os.path.join(repo_root, "docs/business-os/strategy/HEAD")
    hbag = os.path.join(repo_root, "docs/business-os/strategy/HBAG")
    return [
        (
            os.path.join(head, "naming-candidates-2026-02-21.md"),
            os.path.join(head, "naming-rdap-2026-02-21.txt"),
            "HEAD-r1",
        ),
        (
            os.path.join(head, "naming-candidates-2026-02-21-r4.md"),
            os.path.join(head, "naming-rdap-2026-02-21-r4.txt"),
            "HEAD-r4",
        ),
        (
            os.path.join(head, "naming-candidates-2026-02-21-r5.md"),
            os.path.join(head, "naming-rdap-2026-02-21-r5.txt"),
            "HEAD-r5",
        ),
        (
            os.path.join(head, "naming-candidates-2026-02-22-r6.md"),
            os.path.join(head, "naming-rdap-2026-02-22-r6.txt"),
            "HEAD-r6",
        ),
        (
            os.path.join(hbag, "naming-candidates-2026-02-21.md"),
            os.path.join(hbag, "naming-rdap-2026-02-21.txt"),
            "HBAG-r1",
        ),
    ]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train naming pipeline shadow model.")
    parser.add_argument(
        "--repo-root",
        default=".",
        help="Path to repository root (default: current directory)",
    )
    parser.add_argument("--model-out", default=None, help="Path to save model .pkl")
    parser.add_argument("--meta-out", default=None, help="Path to save meta .json")
    parser.add_argument("--version", default="v1", help="Model version tag")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    pairs = _default_pairs(args.repo_root)
    _pipeline, _meta = train_model(
        pairs,
        model_version=args.version,
        seed=args.seed,
        model_out=args.model_out,
        meta_out=args.meta_out,
    )
    print(json.dumps(_meta, indent=2))
