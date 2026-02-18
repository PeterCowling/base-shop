# Phase Base Contract

Shared runtime standards for all lp-seo phase modules. Every phase must conform to these conventions.

## Artifact Location

All outputs: `docs/business-os/strategy/<BIZ>/seo/<YYYY-MM-DD>-<phase-name>-<BIZ>.user.md`

Canonical path defined in `docs/business-os/startup-loop/artifact-registry.md` (artifact ID: `seo`).

## Required Inputs

- **lp-offer artifact**: `docs/business-os/startup-baselines/<BIZ>-offer.md` — ICP, value proposition, target customer language, differentiation, objection map
- **lp-channels artifact**: `docs/business-os/startup-baselines/<BIZ>-channels.md` — confirms organic search is a prioritized channel

## Phase Dependency Chain

| Phase | Phase Name | Requires |
|---|---|---|
| 1 | keyword-universe | None (loads offer + channels) |
| 2 | content-clusters | Phase 1 keyword-universe output |
| 3 | serp-briefs | Phase 2 content-clusters output |
| 4 | tech-audit | Independent; benefits from Phases 1–2 |
| 5 | snippet-optimization | Phase 3 serp-briefs + Phase 4 tech-audit |

**Inter-phase handoff format**: Each phase saves output as a timestamped `.user.md` file. The next phase reads the latest file matching `seo/*-<phase-name>-<BIZ>.user.md`.

## Model

Always use `model: "sonnet"` for all Task tool calls within phases.

## Cross-Phase Quality Requirements

Every phase output must:

1. Tie recommendations to business positioning from lp-offer
2. Include actionable next steps
3. Define success metrics appropriate to the phase
4. Prioritize quick wins alongside strategic long-term targets
