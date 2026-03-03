"""CI gate functions — called by CI to determine pass/fail."""

from replay.harness import ReplaySummary


def schema_ci_gate(summary: ReplaySummary) -> bool:
    """Gate passes if all sidecar events are schema-valid."""
    return summary.n_events_invalid == 0


def calibration_ci_gate(report: dict, threshold: float = 0.35) -> bool:
    """Gate passes if Brier score is below the no-go threshold."""
    return report.get("brier_score", 1.0) < threshold


def legacy_parity_gate(summary: ReplaySummary) -> bool:
    """Gate passes if replay produced at least some valid events (proxy for no regression)."""
    return summary.n_events_valid > 0
