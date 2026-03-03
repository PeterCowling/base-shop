"""
Replay harness — replays historical sidecar files and emits deterministic
comparison summaries. Used to verify that schema changes don't break
historical data compatibility.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
import json

# Required fields every sidecar event must contain.
_REQUIRED_FIELDS = {
    "schema_version",
    "event_id",
    "business",
    "round",
    "run_date",
    "stage",
    "candidate",
}


@dataclass
class ReplaySummary:
    source_file: str
    n_events_read: int
    n_events_valid: int
    n_events_invalid: int
    stages_seen: list[str]          # unique stage values found
    businesses_seen: list[str]      # unique business values
    schema_version: str             # value from first valid event
    parse_errors: list[str]         # list of error messages for invalid events
    is_deterministic: bool          # True if re-reading produces same result


def _read_file(filepath: Path) -> tuple[int, int, int, list[str], list[str], list[str], str]:
    """Single-pass read of a sidecar JSONL file.

    Returns:
        (n_read, n_valid, n_invalid, stages, businesses, errors, schema_version)
    """
    n_read = 0
    n_valid = 0
    n_invalid = 0
    stages: list[str] = []
    businesses: list[str] = []
    errors: list[str] = []
    schema_version = ""

    with open(filepath, "r", encoding="utf-8") as fh:
        for lineno, raw_line in enumerate(fh, start=1):
            line = raw_line.strip()
            if not line:
                continue
            n_read += 1
            try:
                event = json.loads(line)
            except json.JSONDecodeError as exc:
                n_invalid += 1
                errors.append(f"line {lineno}: JSON parse error — {exc}")
                continue

            # Validate required fields
            missing = _REQUIRED_FIELDS - set(event.keys())
            if missing:
                n_invalid += 1
                errors.append(
                    f"line {lineno}: missing required fields: {sorted(missing)}"
                )
                continue

            # Valid event — collect unique values
            n_valid += 1
            stage = event["stage"]
            if stage not in stages:
                stages.append(stage)

            biz = event["business"]
            if biz not in businesses:
                businesses.append(biz)

            if not schema_version:
                schema_version = str(event["schema_version"])

    return n_read, n_valid, n_invalid, stages, businesses, errors, schema_version


def replay_sidecar_file(filepath: str | Path) -> ReplaySummary:
    """Read a sidecar JSONL file and produce a deterministic summary.

    Reads every line, validates against the sidecar schema requirements
    (required fields: schema_version, event_id, business, round, run_date,
    stage, candidate), counts valid/invalid, collects unique values.

    Determinism check: read the file twice, compare n_events_read — if equal,
    mark is_deterministic=True.
    """
    filepath = Path(filepath)

    # First pass
    n_read, n_valid, n_invalid, stages, businesses, errors, schema_version = (
        _read_file(filepath)
    )

    # Second pass — determinism check (compare event count only)
    n_read_2, *_ = _read_file(filepath)
    is_deterministic = n_read == n_read_2

    return ReplaySummary(
        source_file=str(filepath),
        n_events_read=n_read,
        n_events_valid=n_valid,
        n_events_invalid=n_invalid,
        stages_seen=stages,
        businesses_seen=businesses,
        schema_version=schema_version,
        parse_errors=errors,
        is_deterministic=is_deterministic,
    )


def replay_directory(sidecar_dir: str | Path) -> list[ReplaySummary]:
    """Replay all *.jsonl files in a directory. Returns list of summaries."""
    sidecar_dir = Path(sidecar_dir)
    summaries: list[ReplaySummary] = []
    for jsonl_file in sorted(sidecar_dir.glob("*.jsonl")):
        summaries.append(replay_sidecar_file(jsonl_file))
    return summaries


def compare_summaries(a: ReplaySummary, b: ReplaySummary) -> dict:
    """Compare two summaries for regression detection.

    Returns dict: {
        files_match: bool,
        n_events_delta: int,    # b.n_events_read - a.n_events_read
        new_invalid: int,       # b.n_events_invalid - a.n_events_invalid
        schema_changed: bool,   # b.schema_version != a.schema_version
        stages_added: list[str],  # stages in b not in a
        stages_removed: list[str]
    }
    """
    set_a = set(a.stages_seen)
    set_b = set(b.stages_seen)

    return {
        "files_match": a.source_file == b.source_file,
        "n_events_delta": b.n_events_read - a.n_events_read,
        "new_invalid": b.n_events_invalid - a.n_events_invalid,
        "schema_changed": b.schema_version != a.schema_version,
        "stages_added": sorted(set_b - set_a),
        "stages_removed": sorted(set_a - set_b),
    }
