"""
test_model.py — Pytest tests for the naming pipeline shadow model (TASK-04).

All tests use synthetic data only — no real repo files are read.
"""

from __future__ import annotations

import json
import os
import pickle
import tempfile
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Synthetic test fixtures
# ---------------------------------------------------------------------------

FAKE_CANDIDATES_MD = """\
| # | Name | Pattern | Provenance | D | W | P | E | I | Score |
|---|------|---------|-----------|---|---|---|---|---|-------|
| 1 | Testova | A | test | 4 | 4 | 4 | 4 | 4 | 20 |
| 2 | Badname | B | test | 2 | 2 | 2 | 2 | 2 | 10 |
| 3 | Takenova | A | test | 4 | 4 | 4 | 4 | 4 | 20 |
| 4 | Goodella | A | test | 5 | 5 | 5 | 5 | 5 | 25 |
| 5 | Lowscore | B | test | 2 | 2 | 2 | 2 | 2 | 10 |
"""

FAKE_RDAP_TXT = """\
AVAILABLE  Testova
AVAILABLE  Badname
TAKEN      Takenova
AVAILABLE  Goodella
TAKEN      Lowscore
"""

# Expected labels:
#   Testova  -> AVAILABLE + score 20 >= 18 -> viable=1
#   Badname  -> AVAILABLE + score 10 < 18  -> excluded (None)
#   Takenova -> TAKEN                       -> viable=0
#   Goodella -> AVAILABLE + score 25 >= 18 -> viable=1
#   Lowscore -> TAKEN                       -> viable=0


def _write_fake_data(tmp_path: Path) -> tuple[str, str]:
    """Write fake candidates + RDAP to tmp_path. Returns (md_path, rdap_path)."""
    md_path = str(tmp_path / "fake-candidates.md")
    rdap_path = str(tmp_path / "fake-rdap.txt")
    with open(md_path, "w", encoding="utf-8") as fh:
        fh.write(FAKE_CANDIDATES_MD)
    with open(rdap_path, "w", encoding="utf-8") as fh:
        fh.write(FAKE_RDAP_TXT)
    return md_path, rdap_path


# ---------------------------------------------------------------------------
# TC-01: Training creates versioned model artifact from baseline dataset
# ---------------------------------------------------------------------------


def test_tc01_training_creates_versioned_artifact(tmp_path):
    """Training produces .pkl and -meta.json files containing expected keys."""
    from naminglab.model.train import train_model

    md_path, rdap_path = _write_fake_data(tmp_path)
    model_out = str(tmp_path / "model-v1.pkl")
    meta_out = str(tmp_path / "model-v1-meta.json")

    pairs = [(md_path, rdap_path, "test-round")]
    pipeline, meta = train_model(
        pairs,
        model_version="v1",
        seed=42,
        model_out=model_out,
        meta_out=meta_out,
    )

    # pkl must exist
    assert os.path.exists(model_out), "model .pkl file was not created"

    # meta json must exist and contain required keys
    assert os.path.exists(meta_out), "meta .json file was not created"
    with open(meta_out, "r", encoding="utf-8") as fh:
        saved_meta = json.load(fh)

    assert "model_version" in saved_meta, "meta missing model_version"
    assert saved_meta["model_version"] == "v1"
    assert "n_training_samples" in saved_meta, "meta missing n_training_samples"
    assert "feature_names" in saved_meta, "meta missing feature_names"
    assert isinstance(saved_meta["feature_names"], list)
    assert len(saved_meta["feature_names"]) > 0


# ---------------------------------------------------------------------------
# TC-02: Scoring output includes all uncertainty fields
# ---------------------------------------------------------------------------


def test_tc02_scoring_includes_uncertainty_fields(tmp_path):
    """score_candidates returns all required fields with valid probability values."""
    from naminglab.model.train import train_model
    from naminglab.model.score import score_candidates

    md_path, rdap_path = _write_fake_data(tmp_path)
    model_out = str(tmp_path / "model-v1.pkl")
    meta_out = str(tmp_path / "model-v1-meta.json")

    pairs = [(md_path, rdap_path, "test-round")]
    train_model(pairs, model_version="v1", seed=42, model_out=model_out, meta_out=meta_out)

    results = score_candidates(md_path, model_out, rdap_txt=rdap_path)
    assert len(results) > 0, "score_candidates returned empty results"

    required_keys = {
        "name", "pattern", "score_total", "rdap_status",
        "p_viable", "ci90_lower", "ci90_upper", "model_version",
    }
    for row in results:
        for key in required_keys:
            assert key in row, f"Missing key '{key}' in scoring result"
        p = row["p_viable"]
        assert 0.0 <= p <= 1.0, f"p_viable={p} out of [0,1] for {row['name']}"
        assert row["ci90_lower"] <= p, (
            f"ci90_lower={row['ci90_lower']} > p_viable={p} for {row['name']}"
        )
        assert p <= row["ci90_upper"], (
            f"p_viable={p} > ci90_upper={row['ci90_upper']} for {row['name']}"
        )


# ---------------------------------------------------------------------------
# TC-03: Calibration report generated and stored as artifact
# ---------------------------------------------------------------------------


def test_tc03_calibration_report_generated(tmp_path):
    """compute_calibration produces a report dict and markdown output."""
    from naminglab.model.train import train_model
    from naminglab.model.calibration import compute_calibration, format_calibration_report_md

    md_path, rdap_path = _write_fake_data(tmp_path)
    model_out = str(tmp_path / "model-v1.pkl")
    meta_out = str(tmp_path / "model-v1-meta.json")

    pairs = [(md_path, rdap_path, "test-round")]
    train_model(pairs, model_version="v1", seed=42, model_out=model_out, meta_out=meta_out)

    report = compute_calibration(pairs, model_out, n_bins=5)

    # Required fields
    assert "brier_score" in report, "report missing brier_score"
    assert "log_loss" in report, "report missing log_loss"
    assert "pass_gate" in report, "report missing pass_gate"

    # Brier score must be a valid float (or None if no data)
    brier = report["brier_score"]
    if brier is not None:
        assert isinstance(brier, float), f"brier_score is not float: {type(brier)}"
        assert 0.0 <= brier <= 1.0, f"brier_score={brier} out of [0,1]"

    # Markdown output must be non-empty
    md = format_calibration_report_md(report)
    assert isinstance(md, str) and len(md) > 0, "format_calibration_report_md returned empty string"


# ---------------------------------------------------------------------------
# TC-04: Legacy shortlist markdown parity — scoring does NOT modify md files
# ---------------------------------------------------------------------------


def test_tc04_scoring_does_not_modify_md_files(tmp_path):
    """score_candidates is read-only: the candidates .md file is unchanged after scoring."""
    from naminglab.model.train import train_model
    from naminglab.model.score import score_candidates

    md_path, rdap_path = _write_fake_data(tmp_path)
    model_out = str(tmp_path / "model-v1.pkl")
    meta_out = str(tmp_path / "model-v1-meta.json")

    pairs = [(md_path, rdap_path, "test-round")]
    train_model(pairs, model_version="v1", seed=42, model_out=model_out, meta_out=meta_out)

    # Record content before scoring
    with open(md_path, "r", encoding="utf-8") as fh:
        content_before = fh.read()

    # Score (no rdap_txt provided to test the optional path)
    score_candidates(md_path, model_out)

    # Content must be unchanged
    with open(md_path, "r", encoding="utf-8") as fh:
        content_after = fh.read()

    assert content_before == content_after, (
        "score_candidates modified the candidates .md file — it must be read-only"
    )
