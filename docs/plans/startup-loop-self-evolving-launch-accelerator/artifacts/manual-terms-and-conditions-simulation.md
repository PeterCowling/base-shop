---
Type: Simulation-Record
Status: Complete
Domain: Startup-Loop / Self-Evolving
Date: 2026-03-02
---

# Manual Terms-and-Conditions Simulation (fact-find -> build loop)

## Scenario
An operator repeatedly creates website terms-and-conditions content manually during the startup website loop.

## Manual loop events simulated
1. `dispatch-terms-01`: first manual legal terms creation routed into fact-find.
2. `dispatch-terms-02`: second manual legal terms update during another website iteration.
3. `dispatch-terms-03`: third repeat of manual legal terms work.

Input fixture:
- `dispatches.terms-and-conditions.json`
- `startup-state.BRIK.json`

## Self-evolving runtime behavior
1. Dispatch packets are converted into canonical `meta-observation.v1` records.
2. Repeat-work detector groups all three events under the same deterministic `hard_signature`.
3. Improvement candidate is generated as `candidate_type: container_update`.
4. Candidate route resolves to `lp-do-build` with reason `container_update_ready_for_build`.
5. Candidate is written to candidate ledger and queued into backbone queue.

## Output evidence
- End-to-end simulation output: `simulation.terms-and-conditions.json`
- Dashboard snapshot: `dashboard-snapshot.json`
- Pilot-0 calibration sample: `pilot-0.json`
- Pilot-1 checkpoint sample: `pilot-1.json`
- Rollback drill decision sample: `rollback-drill.json`
- Maturity checkpoint: `container-maturity-checkpoint.json`

## Expected operator impact
Manual legal terms prompt-work is recognized as repeat-work and converted into a build-route candidate (`lp-do-build`) so future runs can execute container-backed workflow instead of ad-hoc prompting.
