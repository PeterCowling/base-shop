---
Type: Investigation-Evidence
Status: Complete
Task: TASK-01
Feature-Slug: lp-do-ideas-source-trigger-operating-model
Created: 2026-02-25
Last-updated: 2026-02-25
---

# Baseline Method Notes

## Objective
Document exactly how pre-bridge baseline metrics and registry inventory were computed, including fallback behavior when required telemetry artifacts are absent.

## Method
1. Read current trial queue snapshot (`queue-state.json`) and extract counters/dispatch rows.
2. Check existence of trial contract telemetry artifacts:
   - `dispatch-ledger.jsonl`
   - `telemetry.jsonl`
   - `standing-registry.json`
3. Read implicit monitor definitions from:
   - `idea-scan` pack scope
   - artifact registry canonical pack paths
   - process-registry v2 process-level artifact paths
4. Build inventory mapping to candidate v2 taxonomy fields (`artifact_class`, `trigger_policy`).

## Fallbacks applied
### Fallback A: missing candidate stream
- Problem: `candidate_count` is not available in current persisted trial artifacts.
- Fallback: compute and report only `fan_out_admitted` proxy from admitted dispatch count and root-event proxy.
- Reporting rule: mark `fan_out_raw` as `N/A` with explicit cause.

### Fallback B: missing loop-guard suppression dimensions
- Problem: no persisted `suppressed_by_loop_guards` counters yet.
- Fallback: report `loop_incidence` as `N/A`; carry requirement into TASK-10 instrumentation.

### Fallback C: missing live standing registry file
- Problem: `standing-registry.json` missing, so no concrete v1 entry list.
- Fallback: inventory implicit monitor scope from skill/contracts and classify those entries as candidate v2 defaults.

## Repro commands
```bash
cat docs/business-os/startup-loop/ideas/trial/queue-state.json

for f in \
  docs/business-os/startup-loop/ideas/trial/dispatch-ledger.jsonl \
  docs/business-os/startup-loop/ideas/trial/telemetry.jsonl \
  docs/business-os/startup-loop/ideas/trial/standing-registry.json; do
  if [ -f "$f" ]; then echo "present $f"; else echo "missing $f"; fi
done

rg -n "Read current Layer A aggregate packs|MARKET-11|SELL-07|PRODUCTS-07|LOGISTICS-07" \
  .claude/skills/idea-scan/SKILL.md

rg -n "market-pack\.user\.md|sell-pack\.user\.md|product-pack\.user\.md|logistics-pack\.user\.md" \
  docs/business-os/startup-loop/artifact-registry.md
```

## Limitations
- Snapshot reflects a single dispatch sample and is not trend-capable.
- Inventory is partially inferred because runtime registry source file is absent.
- No candidate-level telemetry means BR-07 thresholds cannot be calibrated yet.

## Carry-forward requirements for TASK-02/TASK-03
1. Re-establish a concrete registry data source for runtime (`standing-registry.json` or replacement contract).
2. Preserve fail-closed semantics for unknown entries during migration.
3. Produce an explicit migration report with classified/inferred/unknown counts.

## Carry-forward requirements for TASK-10
1. Persist `candidate_count` and `suppressed_by_loop_guards` counters.
2. Emit deterministic phase/provenance tags so shadow/enforced telemetry can be reconciled.
3. Add rollup checks that fail clearly when required counters are absent.
