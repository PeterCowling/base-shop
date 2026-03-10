"""
test_replay.py — Pytest tests for the replay harness (TASK-06).

All tests use synthetic data only — no real repo files are read.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from replay.harness import (
    ReplaySummary,
    compare_summaries,
    replay_directory,
    replay_sidecar_file,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_event(i: int = 0, **overrides) -> dict:
    """Return a minimal valid sidecar event."""
    base = {
        "schema_version": "v1",
        "event_id": f"evt-{i}",
        "business": "TEST",
        "round": 1,
        "run_date": "2026-02-26",
        "stage": "generated",
        "candidate": {"name": f"Testname{i}", "pattern": "A"},
        "rdap": None,
        "model_output": None,
        "timestamp": "2026-02-26T10:00:00Z",
    }
    base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# TC-01: Replay run produces deterministic summary for fixed input set
# ---------------------------------------------------------------------------


def test_tc01_replay_deterministic(tmp_path):
    """Replaying the same fixed JSONL file twice produces the same event count."""
    events = [_make_event(i) for i in range(5)]
    sidecar_file = tmp_path / "2026-02-26-round-1.jsonl"
    sidecar_file.write_text("\n".join(json.dumps(e) for e in events) + "\n")

    summary1 = replay_sidecar_file(sidecar_file)
    summary2 = replay_sidecar_file(sidecar_file)

    assert summary1.n_events_read == 5
    assert summary1.n_events_valid == 5
    assert summary1.n_events_invalid == 0
    assert summary1.is_deterministic is True
    assert summary1.n_events_read == summary2.n_events_read


# ---------------------------------------------------------------------------
# TC-04: Legacy markdown output parity check passes in shadow mode
# ---------------------------------------------------------------------------


def test_tc04_replay_does_not_modify_md_files(tmp_path):
    """replay_sidecar_file is read-only: a co-located .md file is unchanged."""
    md_file = tmp_path / "naming-shortlist.user.md"
    original_content = "# Test shortlist\n\nSome content"
    md_file.write_text(original_content)

    sidecar_file = tmp_path / "2026-02-26-round-1.jsonl"
    sidecar_file.write_text(
        json.dumps(
            {
                "schema_version": "v1",
                "event_id": "x",
                "business": "T",
                "round": 1,
                "run_date": "2026-02-26",
                "stage": "generated",
                "candidate": {"name": "Test", "pattern": "A"},
                "rdap": None,
                "model_output": None,
                "timestamp": "2026-02-26T10:00:00Z",
            }
        )
        + "\n"
    )

    replay_sidecar_file(sidecar_file)
    assert md_file.read_text() == original_content


# ---------------------------------------------------------------------------
# Additional replay harness tests
# ---------------------------------------------------------------------------


def test_replay_summary_schema_version_from_first_valid_event(tmp_path):
    """schema_version in the summary comes from the first valid event."""
    event = _make_event(0, schema_version="v2")
    sidecar_file = tmp_path / "test.jsonl"
    sidecar_file.write_text(json.dumps(event) + "\n")

    summary = replay_sidecar_file(sidecar_file)
    assert summary.schema_version == "v2"


def test_replay_collects_unique_stages_and_businesses(tmp_path):
    """stages_seen and businesses_seen contain de-duplicated values."""
    events = [
        _make_event(0, stage="generated", business="BIZ_A"),
        _make_event(1, stage="generated", business="BIZ_B"),
        _make_event(2, stage="scored", business="BIZ_A"),
    ]
    sidecar_file = tmp_path / "test.jsonl"
    sidecar_file.write_text("\n".join(json.dumps(e) for e in events) + "\n")

    summary = replay_sidecar_file(sidecar_file)
    assert set(summary.stages_seen) == {"generated", "scored"}
    assert set(summary.businesses_seen) == {"BIZ_A", "BIZ_B"}


def test_replay_directory_processes_all_jsonl_files(tmp_path):
    """replay_directory returns one summary per *.jsonl file."""
    for idx in range(3):
        f = tmp_path / f"file-{idx}.jsonl"
        f.write_text(json.dumps(_make_event(idx)) + "\n")
    # Non-jsonl file should be ignored
    (tmp_path / "notes.txt").write_text("not a sidecar\n")

    summaries = replay_directory(tmp_path)
    assert len(summaries) == 3
    for s in summaries:
        assert s.n_events_read == 1


def test_compare_summaries_detects_new_invalid_events(tmp_path):
    """compare_summaries reports new_invalid > 0 when second run has more failures."""
    good_event = _make_event(0)
    bad_event = {k: v for k, v in _make_event(1).items() if k != "stage"}

    file_a = tmp_path / "a.jsonl"
    file_a.write_text(json.dumps(good_event) + "\n")
    file_b = tmp_path / "b.jsonl"
    file_b.write_text(json.dumps(good_event) + "\n" + json.dumps(bad_event) + "\n")

    summary_a = replay_sidecar_file(file_a)
    summary_b = replay_sidecar_file(file_b)

    diff = compare_summaries(summary_a, summary_b)
    assert diff["new_invalid"] == 1
    assert diff["n_events_delta"] == 1


def test_compare_summaries_schema_changed(tmp_path):
    """compare_summaries detects schema_version change between runs."""
    file_a = tmp_path / "a.jsonl"
    file_a.write_text(json.dumps(_make_event(0, schema_version="v1")) + "\n")
    file_b = tmp_path / "b.jsonl"
    file_b.write_text(json.dumps(_make_event(0, schema_version="v2")) + "\n")

    summary_a = replay_sidecar_file(file_a)
    summary_b = replay_sidecar_file(file_b)

    diff = compare_summaries(summary_a, summary_b)
    assert diff["schema_changed"] is True


def test_replay_empty_file(tmp_path):
    """Replaying an empty JSONL file produces a zero-count summary."""
    sidecar_file = tmp_path / "empty.jsonl"
    sidecar_file.write_text("")

    summary = replay_sidecar_file(sidecar_file)
    assert summary.n_events_read == 0
    assert summary.n_events_valid == 0
    assert summary.n_events_invalid == 0
    assert summary.is_deterministic is True
    assert summary.stages_seen == []
    assert summary.businesses_seen == []


def test_replay_malformed_json_line(tmp_path):
    """A line that is not valid JSON is counted as invalid with an error message."""
    sidecar_file = tmp_path / "bad.jsonl"
    sidecar_file.write_text(
        json.dumps(_make_event(0)) + "\n"
        + "not-valid-json\n"
    )

    summary = replay_sidecar_file(sidecar_file)
    assert summary.n_events_read == 2
    assert summary.n_events_valid == 1
    assert summary.n_events_invalid == 1
    assert len(summary.parse_errors) == 1
    assert "JSON parse error" in summary.parse_errors[0]
