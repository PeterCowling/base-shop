"""
test_schema_ci.py — CI gate tests for schema validation and calibration regression (TASK-06).

TC-02: Intentional schema break causes expected CI failure.
TC-03: Intentional calibration breach causes expected CI failure.
"""
from __future__ import annotations

import json

import pytest

from replay.harness import replay_sidecar_file
from replay.ci_gates import schema_ci_gate, calibration_ci_gate, legacy_parity_gate


# ---------------------------------------------------------------------------
# TC-02: Intentional schema break causes expected CI failure
# ---------------------------------------------------------------------------


def test_tc02_schema_break_detected(tmp_path):
    """A sidecar event missing required fields should be flagged as invalid."""
    # Good event — all required fields present
    good_event = {
        "schema_version": "v1",
        "event_id": "good-1",
        "business": "TEST",
        "round": 1,
        "run_date": "2026-02-26",
        "stage": "generated",
        "candidate": {"name": "Goodname", "pattern": "A"},
        "rdap": None,
        "model_output": None,
        "timestamp": "2026-02-26T10:00:00Z",
    }
    # Bad event — 'stage' field is missing
    bad_event = {
        "schema_version": "v1",
        "event_id": "bad-1",
        "business": "TEST",
        "round": 1,
        "run_date": "2026-02-26",
        # 'stage' is intentionally absent
        "candidate": {"name": "Badname", "pattern": "A"},
        "rdap": None,
        "model_output": None,
        "timestamp": "2026-02-26T10:00:00Z",
    }
    sidecar_file = tmp_path / "test.jsonl"
    sidecar_file.write_text(
        json.dumps(good_event) + "\n" + json.dumps(bad_event) + "\n"
    )

    summary = replay_sidecar_file(sidecar_file)
    assert summary.n_events_invalid == 1     # schema break detected
    assert summary.n_events_valid == 1
    assert len(summary.parse_errors) == 1    # error message captured

    # CI gate must FAIL when there are any invalid events
    assert schema_ci_gate(summary) is False


# ---------------------------------------------------------------------------
# TC-03: Intentional calibration breach causes expected CI failure
# ---------------------------------------------------------------------------


def test_tc03_calibration_breach_detected():
    """Calibration gate fails when Brier score exceeds threshold."""
    passing_report = {"brier_score": 0.15, "pass_gate": True}
    failing_report = {"brier_score": 0.40, "pass_gate": False}

    assert calibration_ci_gate(passing_report) is True   # gate PASSES
    assert calibration_ci_gate(failing_report) is False  # gate FAILS


# ---------------------------------------------------------------------------
# Additional gate tests
# ---------------------------------------------------------------------------


def test_schema_ci_gate_passes_when_all_events_valid(tmp_path):
    """schema_ci_gate returns True when n_events_invalid == 0."""
    good_event = {
        "schema_version": "v1",
        "event_id": "ok-1",
        "business": "BIZ",
        "round": 1,
        "run_date": "2026-02-26",
        "stage": "scored",
        "candidate": {"name": "Goodname", "pattern": "A"},
        "rdap": None,
        "model_output": None,
        "timestamp": "2026-02-26T10:00:00Z",
    }
    sidecar_file = tmp_path / "ok.jsonl"
    sidecar_file.write_text(json.dumps(good_event) + "\n")

    summary = replay_sidecar_file(sidecar_file)
    assert schema_ci_gate(summary) is True


def test_calibration_ci_gate_boundary():
    """calibration_ci_gate uses strict less-than comparison at the threshold."""
    at_threshold = {"brier_score": 0.35}
    below_threshold = {"brier_score": 0.3499}

    # Exactly at threshold: fails (not strictly less than)
    assert calibration_ci_gate(at_threshold) is False
    # Just below threshold: passes
    assert calibration_ci_gate(below_threshold) is True


def test_calibration_ci_gate_missing_brier_score():
    """calibration_ci_gate defaults to brier_score=1.0 when key is absent (always fails)."""
    assert calibration_ci_gate({}) is False


def test_calibration_ci_gate_custom_threshold():
    """calibration_ci_gate respects a custom threshold argument."""
    report = {"brier_score": 0.20}
    assert calibration_ci_gate(report, threshold=0.25) is True
    assert calibration_ci_gate(report, threshold=0.15) is False


def test_legacy_parity_gate_passes_with_valid_events(tmp_path):
    """legacy_parity_gate passes when at least one valid event was replayed."""
    event = {
        "schema_version": "v1",
        "event_id": "e1",
        "business": "BIZ",
        "round": 1,
        "run_date": "2026-02-26",
        "stage": "generated",
        "candidate": {"name": "Name", "pattern": "A"},
        "rdap": None,
        "model_output": None,
        "timestamp": "2026-02-26T10:00:00Z",
    }
    sidecar_file = tmp_path / "ok.jsonl"
    sidecar_file.write_text(json.dumps(event) + "\n")

    summary = replay_sidecar_file(sidecar_file)
    assert legacy_parity_gate(summary) is True


def test_legacy_parity_gate_fails_with_empty_file(tmp_path):
    """legacy_parity_gate fails when the replayed file has no valid events."""
    sidecar_file = tmp_path / "empty.jsonl"
    sidecar_file.write_text("")

    summary = replay_sidecar_file(sidecar_file)
    assert legacy_parity_gate(summary) is False


def test_schema_ci_gate_multiple_missing_fields(tmp_path):
    """schema_ci_gate detects events with multiple missing required fields."""
    bad_event = {
        "schema_version": "v1",
        "event_id": "bad-multi",
        # 'business', 'round', 'run_date', 'stage', 'candidate' all missing
    }
    sidecar_file = tmp_path / "multi-missing.jsonl"
    sidecar_file.write_text(json.dumps(bad_event) + "\n")

    summary = replay_sidecar_file(sidecar_file)
    assert summary.n_events_invalid == 1
    assert schema_ci_gate(summary) is False
