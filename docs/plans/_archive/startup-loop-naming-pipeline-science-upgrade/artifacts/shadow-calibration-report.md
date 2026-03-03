# Shadow Model Calibration Report

**Model version:** v1
**Training date:** 2026-02-26
**Report generated:** 2026-02-26T14:20:37.191663+00:00

## Training Data Summary

| Metric | Value |
|--------|-------|
| Total labeled samples | 1523 |
| Viable (positive) | 631 |
| Not viable (negative) | 892 |

## Model Performance

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Brier score | 0.1589 | < 0.35 | PASS |
| Log-loss | 0.4721 | — | — |

**Brier score interpretation:** A score below 0.35 indicates the model's probability estimates are better than random guessing on this dataset (PASS). A score of 0.25 would indicate near-perfect calibration. A score at or above 0.35 means the model needs more data or retraining (NO-GO).

## Reliability Diagram (Binned)

Each row shows a probability bin, the model's average predicted probability
in that bin, and the actual fraction of viable names in that bin.
A well-calibrated model has mean_predicted close to fraction_positive.

| Bin centre | Mean predicted P(viable) | Actual fraction viable | Count |
|-----------|--------------------------|------------------------|-------|
| 0.100 | 0.0723 | 0.0717 | 460 |
| 0.300 | 0.2888 | 0.3298 | 285 |
| 0.500 | 0.5047 | 0.4559 | 329 |
| 0.700 | 0.6929 | 0.7030 | 266 |
| 0.900 | 0.9021 | 0.9126 | 183 |

## Plain-Language Interpretation

The shadow model passes the calibration gate. Its probability estimates are more informative than a coin flip on this dataset. Scores produced by the model can be shown alongside human expert scores as an additional signal — they do not replace the expert scoring process and do not gate any names from further consideration.

## Cross-Validation Note

Cross-validation Brier score: 0.2191 +/- 0.0770 (1523 samples). CV was run during training on the same dataset used for calibration.
