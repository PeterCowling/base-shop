# Build Executor: Business Artifact IMPLEMENT

## Objective

Execute business-artifact work with explicit VC validation and fail-first evidence.

## Required Sequence

1. **Red:** run falsification probe from task execution plan; record evidence.
2. **Green:** produce minimum artifact that satisfies scoped VC checks.
3. **Refactor:** improve quality/operability; rerun VC checks.

## Approval and Measurement

- Capture approval evidence exactly as task specifies.
- If approval is asynchronous/unavailable, mark task `Blocked` (`Awaiting approval evidence`) and stop.
- Confirm measurement readiness fields are complete and actionable.

## Failing Output Policy

- Do not commit final broken artifacts as complete outputs.
- Draft/Red evidence notes may be committed only while task remains non-complete.
