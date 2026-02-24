# Real Device Validation

## Execution Status
Waived for this cycle: physical-device runs were not captured in this environment.

Agent environment probe (2026-02-23):
- `adb devices` -> `command not found`
- `xcrun xctrace list devices` -> `xctrace not available`

Operator waiver (2026-02-23):
- Instruction: `ok no prolems move on`
- Cycle decision: proceed without physical-device captures for this cycle.
- Risk posture: accepted risk; template retained for follow-up capture.

## Inputs
- Plan: `docs/plans/_archive/hbag-brandmark-particle-animation/plan.md`
- Decision log: `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/decision-log.md`
- Visual baseline screenshot: `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/screenshots/brandmark-final-playwright.png`
- Benchmark baseline: `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/benchmark-summary.md`

## Scope
This artifact records TASK-05 physical-device performance and pacing validation.
Emulation-only evidence does not satisfy this gate.

## Performance Contract (Pass Criteria)
- p95 frame time <= 24ms
- Long frames (>50ms) <= 8 per mount sequence
- Mount duration in [3.2s, 4.2s]
- 3 consecutive runs after 30s warm-up
- No run with p95 > 28ms

## Execution Procedure

### Step 1 — Capture iPhone Safari Matrix
DO:
1. Open the target brandmark page on physical iPhone Safari (same environment intended for release).
2. Remote-inspect Safari timeline and capture three mount-animation runs after a 30s warm-up.
3. Capture one screen recording that clearly shows a full mount sequence.

SAVE:
- Trace/screenshot export -> `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/device-captures/iphone-safari/`
- Recording file -> `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/device-captures/iphone-safari/`

DONE WHEN:
- Three run metrics are available: p95 frame ms, long-frame count, and total duration.

IF BLOCKED:
- If remote inspector is unavailable, collect a screen recording and use fallback manual counting notes in the run table; mark `Measurement method/tool` as `manual-fallback`.

### Step 2 — Capture Android Chrome Matrix
DO:
1. Open the same target page on physical Android Chrome.
2. Remote-inspect Chrome Performance and capture three mount-animation runs after a 30s warm-up.
3. Capture one screen recording that clearly shows a full mount sequence.

SAVE:
- Trace/screenshot export -> `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/device-captures/android-chrome/`
- Recording file -> `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/device-captures/android-chrome/`

DONE WHEN:
- Three run metrics are available: p95 frame ms, long-frame count, and total duration.

IF BLOCKED:
- If remote inspector is unavailable, collect a screen recording and use fallback manual counting notes in the run table; mark `Measurement method/tool` as `manual-fallback`.

### Step 3 — Record Operator Pacing Verdict
DO:
1. Review both recordings and compare against brand-motion intent from TASK-01 (Option C).
2. Decide `approved` or `adjustments required`.

SAVE:
- Final verdict and rationale in `## Operator Pacing Verdict`.

DONE WHEN:
- Verdict is explicit and includes any required tuning actions.

IF BLOCKED:
- If verdict is uncertain, set status to `adjustments required` and add at least one concrete tuning task proposal.

## Device Matrix

### Device A — iPhone + Safari
- Device model:
- iOS version:
- Safari version:
- Measurement method/tool:
- Target URL:
- Recording path:

| Run | p95 frame ms | Long frames >50ms | Duration (s) | Pass/Fail |
|---|---:|---:|---:|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

Device verdict:

### Device B — Android + Chrome
- Device model:
- Android version:
- Chrome version:
- Measurement method/tool:
- Target URL:
- Recording path:

| Run | p95 frame ms | Long frames >50ms | Duration (s) | Pass/Fail |
|---|---:|---:|---:|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

Device verdict:

## Operator Pacing Verdict
- Status: `pending` (`approved` | `adjustments required`)
- Reviewer:
- Notes:

## Gate Result
Waived for this cycle: TASK-05 closed by operator override with accepted risk.
Follow-up still recommended: populate both device matrices and operator pacing verdict before broad rollout.
