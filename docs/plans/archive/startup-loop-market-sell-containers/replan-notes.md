---
Type: Replan-Notes
Status: Active
Date: 2026-02-21
Plan: docs/plans/startup-loop-market-sell-containers/plan.md
Task: TASK-03
---

# TASK-03 Replan Evidence

## Scope inventory (E1)

Command:

```bash
rg -n "\bS2B\b|\bS6B\b|\bS3B\b|\bS2\b|\bS1B\b|\bS2A\b|\bS1\b|\bS6\b|GATE-S6B|GATE-S3B" scripts/src/startup-loop --glob '!**/__tests__/**'
```

Findings:
- True stage-ID runtime consumers in TASK-03 scope:
  - `scripts/src/startup-loop/s6b-gates.ts`
  - `scripts/src/startup-loop/baseline-merge.ts`
  - `scripts/src/startup-loop/bottleneck-detector.ts`
  - `scripts/src/startup-loop/replan-trigger.ts`
  - `scripts/src/startup-loop/stage-addressing.ts`
  - `scripts/src/startup-loop/manifest-update.ts`
  - `scripts/src/startup-loop/funnel-metrics-extractor.ts`
- Non-stage tokens requiring explicit allowlist/exclusion:
  - `scripts/src/startup-loop/hospitality-scenarios.ts` (`S1/S2` seasonal scenario labels)
  - `scripts/src/startup-loop/s2-market-intelligence-handoff.ts` (artifact naming/content text)
  - `scripts/src/startup-loop/s2-operator-capture.ts` (workflow naming)

## Read-only runtime verification (E2)

Command set:

```bash
JEST_FORCE_CJS=1 pnpm --filter scripts test -- scripts/src/startup-loop/__tests__/stage-addressing.test.ts --maxWorkers=2
JEST_FORCE_CJS=1 pnpm --filter scripts test -- scripts/src/startup-loop/__tests__/baseline-merge.test.ts --maxWorkers=2
JEST_FORCE_CJS=1 pnpm --filter scripts test -- scripts/src/startup-loop/__tests__/manifest-update.test.ts --maxWorkers=2
JEST_FORCE_CJS=1 pnpm --filter scripts test -- scripts/src/startup-loop/__tests__/s6b-gate-simulation.test.ts --maxWorkers=2
JEST_FORCE_CJS=1 pnpm --filter scripts test -- scripts/src/startup-loop/__tests__/replan-trigger.test.ts --maxWorkers=2
```

Observed:
- `stage-addressing.test.ts`: **FAIL** (expected `S2B` / `S6B` IDs, resolver now returns `MARKET-02` / `SELL-01` from generated map).
- `baseline-merge.test.ts`: **PASS** (legacy-S2B/S6B suite still green).
- `manifest-update.test.ts`: **PASS** (legacy required-stage contract still green).
- `s6b-gate-simulation.test.ts`: **PASS** (legacy gate IDs still green).
- `replan-trigger.test.ts`: **PASS** (legacy constraint-key mapping still green).

## Replan decision

- Promotion to `>=80` for TASK-03 is blocked by mixed-state runtime/test landscape.
- Added precursor `TASK-09 (INVESTIGATE)` to produce:
  - deterministic runtime migration matrix,
  - explicit constraint-key compatibility strategy,
  - executable promotion criteria for TASK-03.

## Runtime migration matrix

| Module | Legacy anchors found | Canonical target | Required migration action | Test impact |
|---|---|---|---|---|
| `scripts/src/startup-loop/s6b-gates.ts` | `GATE-S6B-STRAT-01`, `GATE-S6B-ACT-01`, `evaluateS6bGates` | `GATE-SELL-STRAT-01`, `GATE-SELL-ACT-01`, `evaluateSellGates` | Rename gate IDs/messages/types and function exports; keep STRAT->ACT evaluation order unchanged | Update `scripts/src/startup-loop/__tests__/s6b-gate-simulation.test.ts` to SELL gate IDs and any renamed exports/file |
| `scripts/src/startup-loop/baseline-merge.ts` | Required stages `S2B`,`S6B`; headings and optional keys tied to S6B | Required stages `MARKET-02`,`SELL-01`; optional `MARKET-03` | Re-anchor required/optional stage contracts and snapshot section labels; preserve deterministic section ordering | Update `scripts/src/startup-loop/__tests__/baseline-merge.test.ts` fixtures/assertions to MARKET/SELL stages and optional MARKET-03 slot |
| `scripts/src/startup-loop/manifest-update.ts` | `REQUIRED_STAGES = [\"S2B\",\"S3\",\"S6B\"]` | `REQUIRED_STAGES = [\"MARKET-02\",\"S3\",\"SELL-01\"]` | Update required stage barrier and error strings while preserving reject semantics | Update `scripts/src/startup-loop/__tests__/manifest-update.test.ts` stage IDs + manifest key assertions |
| `scripts/src/startup-loop/bottleneck-detector.ts` | `StageId` union + upstream priority includes `S2`,`S2B`,`S3B`,`S6B`; constraint keys derive from stage strings | Stage union/priority with `MARKET-01/02/03`,`SELL-01/02` | Replace stage enum + priority list and keep deterministic ranking rules | Update `scripts/src/startup-loop/__tests__/bottleneck-detector.test.ts` expected keys/stages |
| `scripts/src/startup-loop/replan-trigger.ts` | Focus mapping for `S6B/traffic`,`S6B/cac`,`S2B/aov` | `SELL-01/traffic`,`SELL-01/cac`,`MARKET-02/aov` | Re-anchor recommendation map and ensure persisted trigger constraint keys normalize to canonical | Update `scripts/src/startup-loop/__tests__/replan-trigger.test.ts` fixture keys/expectations |
| `scripts/src/startup-loop/funnel-metrics-extractor.ts` | Metric catalog stage tags `S6B`,`S2B` | `SELL-01`,`MARKET-02` | Update stage assignments and keep miss/delta computation unchanged | Update `scripts/src/startup-loop/__tests__/funnel-metrics-extractor.test.ts` stage assertions |
| `scripts/src/startup-loop/stage-addressing.ts` | Canonical ID help text and fail strings still advertise `S2–S10` and `S2B/S6B` IDs | Canonical IDs from generated stage map (`MARKET-*`, `SELL-*`) | Replace hard-coded help text/examples; keep fail-closed behavior and exact-match semantics | Update `scripts/src/startup-loop/__tests__/stage-addressing.test.ts` + `scripts/src/startup-loop/__tests__/stage-label-rename.test.ts` |

## Compatibility decision (constraint keys + history)

- Decision: **normalize historical legacy keys on read, emit canonical keys on write**.
- Scope: `bottleneck-history`, `replan-trigger`, and any comparator logic consuming prior `constraint_key`.
- Allowed legacy read-normalization map:
  - `S6B/traffic` -> `SELL-01/traffic`
  - `S6B/cac` -> `SELL-01/cac`
  - `S2B/aov` -> `MARKET-02/aov`
  - stage-prefix equivalents for `S2`,`S3B` where found -> `MARKET-01`,`MARKET-03`
- Hard-cut contract preserved: external stage addressing and new run artifacts remain canonical-only; normalization is internal historical-compatibility handling, not public alias support.

## Test migration order for TASK-03

1. `stage-addressing.test.ts` + `stage-label-rename.test.ts` (currently red boundary after TASK-01/TASK-02).
2. `s6b-gate-simulation.test.ts` after `s6b-gates.ts` gate-ID/export cutover.
3. `baseline-merge.test.ts` and `manifest-update.test.ts` with new stage IDs.
4. `funnel-metrics-extractor.test.ts`, `bottleneck-detector.test.ts`, `replan-trigger.test.ts` with canonical stage/constraint keys.
5. Run targeted startup-loop suite set used in TASK-03 TC contract.

## Promotion criteria for TASK-03

TASK-03 can be promoted to build-ready (`>=80`) after TASK-09 documents:
- module-by-module old->new stage/gate/key mapping,
- compatibility handling for historical keys (`S6B/*`, `S2B/*`) with downstream impact callouts,
- exact test migration order preventing partial-state regressions.
