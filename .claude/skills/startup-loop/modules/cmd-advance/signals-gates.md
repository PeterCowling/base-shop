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

**Subsumes note**: This dispatch orchestrates GATE-BD-08, feedback-audit, KPCS decision, and experiment lane. When `/lp-weekly` is invoked, the standalone dispatches below are the Phase 0 fallback path.

**Fallback**: If `/lp-weekly` is unavailable, proceed with GATE-BD-08 as the Phase 0 fallback sequence.

---

### GATE-BD-08: Brand Dossier staleness warning at SIGNALS (legacy: S10)

**Gate ID**: GATE-BD-08 (Soft — warning, not block)
**Trigger**: SIGNALS weekly readout review.

**Rule**: Check Brand Dossier `Last-reviewed` date in `docs/business-os/strategy/<BIZ>/index.user.md`. If Last-reviewed > 90 days ago: emit warning (do not block).
- Warning: `GATE-BD-08: Brand Dossier not reviewed in >90 days. Consider re-running BRAND-DR-01/02 and updating <YYYY-MM-DD>-brand-identity-dossier.user.md.`

