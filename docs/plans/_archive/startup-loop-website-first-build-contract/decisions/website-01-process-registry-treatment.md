---
Type: Decision
Status: Approved
Domain: Venture-Studio
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: startup-loop-website-first-build-contract
Task-ID: TASK-02
---

# WEBSITE-01 Process-Registry Treatment

## Decision
Use **explicit coverage** for `WEBSITE-01` in process-layer docs, mapped through existing process `OFF-3` as bootstrap ownership, with `WEBSITE-02` retained as recurring ownership under the same process.

## Rationale
- Avoids implicit/exempt semantics that can be misread as missing process ownership.
- Keeps process taxonomy stable (no new process ID required).
- Aligns with existing OFF-3 scope (content/listing/merchandising) while distinguishing one-time bootstrap versus recurring cadence.

## Applied Contract Shape
- Quick Reference Index anchor:
  - `OFF-3` -> `WEBSITE-01 (bootstrap), WEBSITE-02 (recurring)`
- Stage Coverage Map rows:
  - explicit row for `WEBSITE-01`
  - explicit row for `WEBSITE-02`
- OFF-3 details:
  - stage anchors include both WEBSITE-01 and WEBSITE-02
  - artifact paths include first-build output and recurring upgrade path

## Consequences
- Positive:
  - Removes ambiguity for operators and maintainers.
  - Preserves runtime authority in `loop-spec.yaml`.
- Tradeoff:
  - OFF-3 now carries dual temporal semantics (one-time bootstrap + recurring maintenance), which must remain explicit in prose.

## Evidence
- `docs/business-os/startup-loop/process-registry-v2.md:60`
- `docs/business-os/startup-loop/process-registry-v2.md:102`
- `docs/business-os/startup-loop/process-registry-v2.md:248`
- `docs/business-os/startup-loop/process-registry-v2.md:253`
