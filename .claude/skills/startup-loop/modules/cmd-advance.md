# cmd-advance — `/startup-loop advance`

## Inputs

- `--business <BIZ>` required

## Steps

Advance only when both are true:
1. Required stage artifact exists and is valid.
2. Required `bos_sync_actions` are confirmed complete.

If either fails: return `status: blocked` with exact reason and retry action.

---

## Stable Entrypoint Policy

Keep this file as the stable `/startup-loop advance` entrypoint. Detailed gate and dispatch instructions now live in focused submodules under `modules/cmd-advance/`.

## Module Loading Order

1. Always load `modules/cmd-advance/advance-contract.md`.
2. Load `modules/cmd-advance/assessment-gates.md` when the current transition touches ASSESSMENT-08, ASSESSMENT-09, or the ASSESSMENT container.
3. Load `modules/cmd-advance/market-product-website-gates.md` when the current transition touches MARKET-06 completion, PRODUCT-02 advisory checks, or WEBSITE->DO handoff.
4. Load `modules/cmd-advance/signals-gates.md` when the current transition touches SIGNALS weekly advance (legacy S10).
5. Load `modules/cmd-advance/sell-gates.md` when the current transition touches SELL-01 strategy design, SELL-08 activation readiness, or SELL-01 secondary dispatch.
6. Always evaluate `modules/cmd-advance/gap-fill-gates.md` on any `advance` call.

## Gate And Dispatch Map

### Assessment Family

Load `modules/cmd-advance/assessment-gates.md` for:
- `GATE-A08-00`
- `GATE-ASSESSMENT-00`
- `GATE-ASSESSMENT-01`
- the `modules/assessment-intake-sync.md` handoff after ASSESSMENT-09 passes

### Market / Product / Website Family

Load `modules/cmd-advance/market-product-website-gates.md` for:
- `GATE-BD-03`
- `GATE-PRODUCT-02-01`
- `GATE-WEBSITE-DO-01`
- `/lp-do-fact-find --website-first-build-backlog --biz <BIZ>`
- `/lp-do-plan docs/plans/<biz>-website-v1-first-build/fact-find.md`
- `docs/plans/<biz>-website-v1-first-build/plan.md`
- `docs/plans/<biz>-website-v1-first-build/fact-find.md`

### Signals Family

Load `modules/cmd-advance/signals-gates.md` for:
- `/lp-weekly --biz <BIZ> --week <YYYY-Www>`
- `Phase 0 fallback`
- `GATE-BD-08`
- `weekly-kpcs`
- `/lp-signal-review --biz <BIZ> --run-root docs/business-os/strategy/<BIZ>/ --as-of-date <YYYY-MM-DD>`

### Sell Family

Load `modules/cmd-advance/sell-gates.md` for:
- `GATE-SELL-STRAT-01`
- `GATE-SELL-ACT-01`
- the SELL-01 secondary dispatch after `/lp-channels` completes
- the supporting artifacts `stockist-target-list.user.md`, `channel-health-log.user.md`, `channel-policy.user.md`, and `weekly-demand-plan.user.md`

### Gap-Fill Family

Load `modules/cmd-advance/gap-fill-gates.md` for:
- `GATE-LOOP-GAP-01`
- `GATE-LOOP-GAP-02`
- `GATE-LOOP-GAP-03`
- `/lp-do-fact-find --startup-loop-gap-fill --trigger <block|bottleneck|feedback>`

## Notes For Direct Readers

- This entrypoint intentionally preserves the key gate IDs, command examples, and route anchors that other startup-loop readers currently inspect.
- Detailed gate logic, decision tables, and blocked/pass contracts have been relocated into the stage-family submodules listed above.
