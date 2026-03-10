# `cmd-advance` — Signals Gates And Dispatch

## Signals Gate Family

Load this module when the current transition touches SIGNALS weekly advance (legacy S10).

### SIGNALS Phase 1 Weekly Advance Dispatch (legacy: S10)

**Trigger**: SIGNALS weekly advance (legacy stage label: S10) — Phase 1 default route.

**Invocation**:

```
/lp-weekly --biz <BIZ> --week <YYYY-Www>
```

Where:
- `<BIZ>` is the business ID from the `--business` flag on the advance command
- `<YYYY-Www>` is the ISO week of the weekly cycle being advanced (e.g. `2026-W08`)

**Subsumes note**: This dispatch orchestrates GATE-BD-08, signal-review, feedback-audit, KPCS decision, and experiment lane. When `/lp-weekly` is invoked, the standalone dispatches below are the Phase 0 fallback path.

**Fallback**: If `/lp-weekly` is unavailable, proceed with GATE-BD-08 -> Signal Review Dispatch as the Phase 0 fallback sequence.

---

### GATE-BD-08: Brand Dossier staleness warning at SIGNALS (legacy: S10)

**Gate ID**: GATE-BD-08 (Soft — warning, not block)
**Trigger**: SIGNALS weekly readout review.

**Rule**: Check Brand Dossier `Last-reviewed` date in `docs/business-os/strategy/<BIZ>/index.user.md`. If Last-reviewed > 90 days ago: emit warning (do not block).
- Warning: `GATE-BD-08: Brand Dossier not reviewed in >90 days. Consider re-running BRAND-DR-01/02 and updating <YYYY-MM-DD>-brand-identity-dossier.user.md.`

---

### SIGNALS Signal Review Dispatch (weekly signal strengthening)

**Trigger**: During SIGNALS weekly readout, after GATE-BD-08 check completes (whether warning or clear).

**Do NOT alter**: GATE-BD-08, the weekly-kpcs prompt handoff reference in `startup-loop/SKILL.md`, or any other SIGNALS/S10 gate.

**Directive**: Invoke `/lp-signal-review` for the current business to audit the run and emit a Signal Review artifact. This is advisory in v1 — it does not block SIGNALS advance.

**Invocation**:

```
/lp-signal-review --biz <BIZ> --run-root docs/business-os/strategy/<BIZ>/ --as-of-date <YYYY-MM-DD>
```

Where:
- `<BIZ>` is the business ID from the `--business` flag on the advance command
- `<YYYY-MM-DD>` is today's date
- `run_root` is always deterministically `docs/business-os/strategy/<BIZ>/` — no operator input needed

**Output**: `docs/business-os/strategy/<BIZ>/signal-review-<YYYYMMDD>-<HHMM>-W<ISOweek>.md`

**v1 posture (advisory)**: Signal Review is emitted for operator review. Findings are presented as Finding Briefs which the operator promotes to `/lp-do-fact-find` manually. This dispatch does NOT block SIGNALS advance regardless of finding count or severity.

**GATE-S10-SIGNAL-01**: Reserved for v1.1 (artifact existence soft warning). Not active in v1.
