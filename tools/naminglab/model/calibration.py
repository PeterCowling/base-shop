"""
calibration.py — Calibration report for the shadow naming model.

Computes Brier score, log-loss, and reliability bins on the training data.
Produces a markdown artifact suitable for operator review.
"""

from __future__ import annotations

import argparse
import math
import os
import pickle
import sys
from datetime import datetime, timezone
from typing import Optional

import numpy as np

try:
    from .train import (
        FEATURE_NAMES,
        _extract_features,
        _parse_candidates_md,
        _parse_rdap,
        _assign_proxy_label,
        _default_pairs,
        load_proxy_dataset,
    )
except ImportError:
    # Allow running as a standalone script: python model/calibration.py
    import sys as _sys
    import os as _os
    _sys.path.insert(0, _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
    from naminglab.model.train import (  # type: ignore[no-redef]
        FEATURE_NAMES,
        _extract_features,
        _parse_candidates_md,
        _parse_rdap,
        _assign_proxy_label,
        _default_pairs,
        load_proxy_dataset,
    )


def compute_calibration(
    candidate_rdap_pairs: list[tuple[str, str, str]],
    model_pkl: str,
    n_bins: int = 5,
) -> dict:
    """
    Compute a calibration report for the shadow model.

    Args:
        candidate_rdap_pairs: list of (candidates_md_path, rdap_txt_path, round_label)
        model_pkl: path to saved (pipeline, meta) pickle.
        n_bins: number of reliability bins.

    Returns:
        dict with keys: model_version, n_calibration_samples, brier_score, log_loss,
        reliability_bins, pass_gate, generated_at.
    """
    # Load model
    with open(model_pkl, "rb") as fh:
        payload = pickle.load(fh)
    if isinstance(payload, tuple):
        pipeline, meta = payload
    else:
        pipeline = payload
        meta = {"model_version": "unknown", "n_training_samples": 0}

    model_version = getattr(pipeline, "model_version", meta.get("model_version", "unknown"))

    # Load labeled dataset
    X, y, feature_names, round_labels = load_proxy_dataset(candidate_rdap_pairs)
    n = len(y)

    if n == 0:
        return {
            "model_version": model_version,
            "n_calibration_samples": 0,
            "brier_score": None,
            "log_loss": None,
            "reliability_bins": [],
            "pass_gate": False,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "note": "No labeled samples found — cannot compute calibration metrics.",
        }

    # Predict
    proba = pipeline.predict_proba(X)[:, 1]

    # Brier score: mean((p - y)^2)
    brier = float(np.mean((proba - y.astype(float)) ** 2))

    # Log-loss (clip proba to avoid log(0))
    eps = 1e-12
    p_clip = np.clip(proba, eps, 1.0 - eps)
    ll = float(-np.mean(y * np.log(p_clip) + (1 - y) * np.log(1 - p_clip)))

    # Reliability bins
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    reliability_bins: list[dict] = []
    for b_lo, b_hi in zip(bins[:-1], bins[1:]):
        mask = (proba >= b_lo) & (proba < b_hi)
        # Include upper edge in last bin
        if b_hi == 1.0:
            mask = (proba >= b_lo) & (proba <= b_hi)
        count = int(mask.sum())
        if count < 1:
            continue
        mean_pred = float(proba[mask].mean())
        frac_pos = float(y[mask].mean())
        reliability_bins.append(
            {
                "bin_center": round((b_lo + b_hi) / 2, 3),
                "mean_predicted": round(mean_pred, 4),
                "fraction_positive": round(frac_pos, 4),
                "count": count,
            }
        )

    pass_gate = brier < 0.35

    return {
        "model_version": model_version,
        "n_calibration_samples": n,
        "brier_score": round(brier, 4),
        "log_loss": round(ll, 4),
        "reliability_bins": reliability_bins,
        "pass_gate": pass_gate,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def format_calibration_report_md(report: dict) -> str:
    """
    Format a calibration report dict as a markdown string.

    Returns:
        Markdown-formatted calibration report.
    """
    lines: list[str] = []

    lines.append("# Shadow Model Calibration Report")
    lines.append("")
    lines.append(f"**Model version:** {report.get('model_version', 'unknown')}")
    lines.append(f"**Training date:** 2026-02-26")
    lines.append(f"**Report generated:** {report.get('generated_at', '')}")
    lines.append("")

    n = report.get("n_calibration_samples", 0)
    lines.append("## Training Data Summary")
    lines.append("")
    lines.append(f"| Metric | Value |")
    lines.append(f"|--------|-------|")
    lines.append(f"| Total labeled samples | {n} |")

    if n == 0:
        lines.append("")
        note = report.get("note", "No data.")
        lines.append(f"> **Warning:** {note}")
        lines.append("")
        lines.append("## Baseline (threshold only)")
        lines.append("")
        lines.append(
            "With no labeled data, the pipeline falls back to: "
            "a name is considered viable if RDAP status is AVAILABLE and total score >= 18. "
            "No probabilistic calibration is available."
        )
        return "\n".join(lines)

    # We need n_positive/n_negative from the report if stored, else derive from bins
    brier = report.get("brier_score")
    ll = report.get("log_loss")
    pass_gate = report.get("pass_gate", False)
    bins = report.get("reliability_bins", [])

    # Derive rough positive/negative counts from bins
    total_in_bins = sum(b["count"] for b in bins)
    pos_in_bins = sum(
        round(b["fraction_positive"] * b["count"]) for b in bins
    )
    neg_in_bins = total_in_bins - pos_in_bins

    lines.append(f"| Viable (positive) | {pos_in_bins} |")
    lines.append(f"| Not viable (negative) | {neg_in_bins} |")
    lines.append("")

    lines.append("## Model Performance")
    lines.append("")
    lines.append("| Metric | Value | Threshold | Status |")
    lines.append("|--------|-------|-----------|--------|")

    if brier is not None:
        status = "PASS" if pass_gate else "NO-GO"
        interp = "well-calibrated" if pass_gate else "needs improvement"
        lines.append(f"| Brier score | {brier:.4f} | < 0.35 | {status} |")
        lines.append(f"| Log-loss | {ll:.4f} | — | — |")
    else:
        lines.append("| Brier score | N/A | < 0.35 | — |")
        lines.append("| Log-loss | N/A | — | — |")

    lines.append("")
    lines.append(
        "**Brier score interpretation:** A score below 0.35 indicates the model's "
        "probability estimates are better than random guessing on this dataset "
        "(PASS). A score of 0.25 would indicate near-perfect calibration. "
        "A score at or above 0.35 means the model needs more data or retraining (NO-GO)."
    )
    lines.append("")

    if bins:
        lines.append("## Reliability Diagram (Binned)")
        lines.append("")
        lines.append("Each row shows a probability bin, the model's average predicted probability")
        lines.append("in that bin, and the actual fraction of viable names in that bin.")
        lines.append("A well-calibrated model has mean_predicted close to fraction_positive.")
        lines.append("")
        lines.append("| Bin centre | Mean predicted P(viable) | Actual fraction viable | Count |")
        lines.append("|-----------|--------------------------|------------------------|-------|")
        for b in bins:
            lines.append(
                f"| {b['bin_center']:.3f} | {b['mean_predicted']:.4f} | "
                f"{b['fraction_positive']:.4f} | {b['count']} |"
            )
        lines.append("")

    lines.append("## Plain-Language Interpretation")
    lines.append("")
    if brier is not None and pass_gate:
        lines.append(
            "The shadow model passes the calibration gate. Its probability estimates "
            "are more informative than a coin flip on this dataset. "
            "Scores produced by the model can be shown alongside human expert scores "
            "as an additional signal — they do not replace the expert scoring process "
            "and do not gate any names from further consideration."
        )
    elif brier is not None:
        lines.append(
            "The shadow model does not yet pass the calibration gate. "
            "This is expected at this stage — the training dataset is small and "
            "the model has limited signal to work with. "
            "As more naming rounds are completed and more RDAP outcomes accumulate, "
            "the model will be retrained and calibration should improve. "
            "Scores are still produced in shadow mode for observability but should "
            "not be used as a signal until calibration passes."
        )
    else:
        lines.append(
            "No calibration data was available. The pipeline falls back to the "
            "threshold rule: AVAILABLE + score >= 18 = viable."
        )
    lines.append("")

    # CV section (if available from meta — we surface what we have)
    cv_note = report.get("cv_note")
    if cv_note:
        lines.append("## Cross-Validation Note")
        lines.append("")
        lines.append(cv_note)
        lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Compute calibration report for the shadow naming model."
    )
    parser.add_argument("--repo-root", default=".", help="Path to repository root")
    parser.add_argument("--model-pkl", required=True, help="Path to saved model .pkl")
    parser.add_argument("--out", default=None, help="Output path for markdown report")
    parser.add_argument("--n-bins", type=int, default=5, help="Number of reliability bins")
    args = parser.parse_args()

    pairs = _default_pairs(args.repo_root)
    report = compute_calibration(pairs, args.model_pkl, n_bins=args.n_bins)

    # Load meta for CV info
    with open(args.model_pkl, "rb") as fh:
        payload = pickle.load(fh)
    if isinstance(payload, tuple):
        _, meta = payload
    else:
        meta = {}

    cv_mean = meta.get("cv_brier_mean")
    cv_std = meta.get("cv_brier_std")
    if cv_mean is not None:
        report["cv_note"] = (
            f"Cross-validation Brier score: {cv_mean:.4f} +/- {cv_std:.4f} "
            f"({meta.get('n_training_samples', '?')} samples). "
            "CV was run during training on the same dataset used for calibration."
        )

    md = format_calibration_report_md(report)
    print(md)

    if args.out:
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(md)
        print(f"\n[calibration] Report written to {args.out}", file=sys.stderr)
