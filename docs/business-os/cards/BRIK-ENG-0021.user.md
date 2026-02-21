---
Type: Card
Status: Active
Lane: Planned
Priority: P1
Owner: Pete
ID: BRIK-ENG-0021
Title: Brikette Octorate Funnel Reduction
Business: BRIK
Tags: [booking, funnel, ga4, seo, octorate]
Created: 2026-02-17
Updated: 2026-02-17
Plan-Created: 2026-02-17
Plan-Confidence: 79%
Plan-Link: docs/plans/brikette-octorate-funnel-reduction/plan.md
Fact-Find-Link: docs/plans/brikette-octorate-funnel-reduction/fact-find.md
Last-Progress: 2026-02-17
Last-updated: 2026-02-17
---

# Brikette Octorate Funnel Reduction

## Description
Deliver Phase 1 foundation for Brikette booking-funnel reduction (redirect/canonical health, handoff measurement contract, no-API reconciliation baseline, SSR/no-JS guardrails) while keeping Octorate as last-mile transactional checkout.

## Work Completed (2026-02-17)
- Fact-find completed with explicit decisions, constraints, and acceptance criteria:
  - `docs/plans/brikette-octorate-funnel-reduction/fact-find.md`
- Plan updated and sequenced with phased scope boundaries and checkpoint gates:
  - `docs/plans/brikette-octorate-funnel-reduction/plan.md`
- Scope adjusted to no-API mode:
  - Octorate read-side APIs/webhooks are not available for this phase.
  - Reconciliation path downgraded to aggregate/probabilistic using exports.
  - Join-key constraint documented: export booking reference field is not referrer/query-bearing.
- Planning quality updates applied:
  - TASK-04 marked complete with evidence and residual parity checks moved to TASK-05A/TASK-06.
  - TASK-05 split into `TASK-05A` (native canonical emit) and `TASK-05B` (legacy compatibility cleanup).
  - TASK-10A/TASK-10B gating switched to staged mode (`report-only -> blocking`).

## Current Operating Decisions
- Handoff model: Brikette-first discovery, Octorate-last-mile checkout.
- Endpoint policy: `result.xhtml` default, constrained `confirm.xhtml`.
- Handoff instrumentation sequencing: emit canonical `handoff_to_engine` first, then normalize to same-tab.
- Availability policy: no hard gate pre-handoff; always allow checkout handoff.
- SSR/i18n quality gate policy: report-only detection before remediation, CI-blocking after remediation passes.

## Next Actions
1. Execute redirect/canonical hardening (`/book` + malformed locale routes).
2. Ship `TASK-05A` native `handoff_to_engine` emission across current flows; verify DebugView/Realtime/Events/Explore/Data API parity.
3. Normalize handoff behavior to same-tab (`TASK-03`), then finalize legacy compatibility policy (`TASK-05B`).
4. Complete GA4 governance runbook and run overlap-window calibration + weekly reconciliation memo.
