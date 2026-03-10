# `cmd-advance` — Sell Gates And Dispatch

## Sell Gate Family

Load this module when the current transition touches SELL-01 strategy design, SELL-08 activation readiness, or the SELL-01 secondary dispatch sequence.

### GATE-SELL-STRAT-01: Strategy design gate

**Gate ID**: GATE-SELL-STRAT-01 (Hard)
**Trigger**: Before SELL-01 (Channel Strategy + GTM) begins — evaluated at the MARKET-06→SELL-01 fan-out.

**Rationale**: Channel selection, GTM planning, and messaging strategy can validly precede measurement readiness — strategy design is not spend commitment.

**Rule — must pass**: A valid Demand Evidence Pack (DEP) artifact exists for this business and passes the schema pass floor: `docs/business-os/startup-baselines/<BIZ>/demand-evidence-pack.md`

**When blocked**:
- Blocking reason: `GATE-SELL-STRAT-01: No valid DEP artifact. Channel strategy requires demand evidence — run /lp-readiness or capture DEP records before starting SELL-01.`
- Next action: `Complete DEP capture, verify it passes the schema pass floor (demand-evidence-pack-schema.md §2), then re-run /startup-loop status --business <BIZ>.`

---

### GATE-SELL-ACT-01: Spend activation gate

**Gate ID**: GATE-SELL-ACT-01 (Hard)
**Trigger**: Before any paid channel spend is committed from SELL-01 channel selection.

**Rationale**: Channel spend before working measurement is structurally invalid. CAC, CVR, and channel performance cannot be evaluated if key conversion events are not firing in production.

**Rule — all three checks must pass**:
1. Measurement verification artifact exists with `Status: Active`:
   `docs/business-os/strategy/<BIZ>/*measurement-verification*.user.md`
2. No active measurement risks at `Severity: High` or `Severity: Critical` in `plan.user.md`.
3. Key conversion-intent events are verified firing in production (non-zero in the locked 7-day baseline or a subsequent verified period).

```bash
# Check 1: measurement verification doc exists and is Active
grep "Status: Active" docs/business-os/strategy/<BIZ>/*measurement-verification*.user.md 2>/dev/null

# Check 2: no High/Critical measurement signal risks
grep -i "measurement" docs/business-os/strategy/<BIZ>/plan.user.md | grep -iE "severity: (high|critical)"

# Check 3: conversion events non-zero (begin_checkout, add_to_cart, or equivalent)
grep -iE "begin_checkout|add_to_cart|conversion" docs/business-os/strategy/<BIZ>/plan.user.md | grep -v "| 0$\\|0.00%\\| 0 "
```

**When blocked**:
- Blocking reason: `GATE-SELL-ACT-01: Decision-grade measurement signal not verified. Channel spend before working measurement is waste.`
- Next action: `Resolve active measurement risks, verify conversion events firing in production, and update measurement-verification artifact to Status: Active. Then re-run /startup-loop status --business <BIZ>.`

Surface this gate when the business moves from channel strategy completion (plan done) to channel activation planning (budget allocation, first ad spend). Strategy design output may be completed and persisted without triggering this gate.

---

### SELL-01 Secondary Skill Dispatch (after lp-channels completes)

**Trigger**: After `/lp-channels` produces a completed channel strategy artifact and the SELL-01 stage doc is committed.

**Do NOT alter**: the `/lp-channels` invocation itself, GATE-SELL-STRAT-01, or GATE-SELL-ACT-01.

**Directive**: Dispatch `lp-seo` and `draft-outreach` in parallel simultaneously via the Task tool in a SINGLE message. Do not dispatch them sequentially — both must be launched in the same Task tool call batch.

Protocol reference: `.claude/skills/_shared/subagent-dispatch-contract.md` (Model A — analysis phase; orchestrator applies diffs after both complete).

**Required steps**:
1. Confirm `/lp-channels` artifact is committed and SELL-01 stage doc is updated.
2. If the channel strategy includes boutiques, retailers, distributors, wholesale accounts, hotel shops, or other physical-product distribution lanes, confirm `docs/business-os/strategy/<BIZ>/stockist-target-list.user.md` exists and reflects the current named targets or coverage slots before advancing SELL-01. If live placements already exist, confirm `docs/business-os/strategy/<BIZ>/channel-health-log.user.md` is the actuals source.
3. If the strategy defines partner-term governance or cross-channel conflict rules, confirm `docs/business-os/strategy/<BIZ>/channel-policy.user.md` exists or is explicitly deferred with reason.
4. If the first 7-day execution sprint is already concrete, confirm `docs/business-os/strategy/<BIZ>/weekly-demand-plan.user.md` exists or is explicitly deferred with reason.
5. In a single message, spawn two Task tool calls in parallel:
   - Task A: `/lp-seo` — SEO strategy for the business, scoped to SELL-01 outputs.
   - Task B: `draft-outreach` — outreach draft, scoped to SELL-01 channel and offer artifacts.
6. Await both completions before advancing SELL-01 stage doc to Done.
7. Synthesize both outputs into the SELL-01 stage doc before triggering the S4 join barrier.

**Blocked if**: either subagent returns `status: fail` — quarantine the failed result, flag in SELL-01 stage doc, and surface to operator before advancing.
