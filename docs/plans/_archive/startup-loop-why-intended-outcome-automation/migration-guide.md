# dispatch.v1 → dispatch.v2 Migration Guide

**Feature**: startup-loop-why-intended-outcome-automation
**Schema change**: `dispatch.v1` → `dispatch.v2`
**Migration window**: 30 days from dispatch.v2 schema merge (2026-02-25)
**Cutover date**: 2026-03-27 (after which v1 packets fail closed)

---

## Background

`dispatch.v1` packets do not carry structured `why` or `intended_outcome` fields.
The routing adapter provides a backward-compatible reader during the migration window
that maps v1 fields (`current_truth`, `next_scope_now`) to payload approximations
marked with `why_source: "compat-v1"`. These compat values are excluded from
operator-quality metrics (they are lossy approximations, not operator intent).

`dispatch.v2` adds two required fields:

| Field | Type | Description |
|---|---|---|
| `why` | `string` (minLength 1) | Operator-authored explanation of why this work is happening now |
| `intended_outcome` | `IntendedOutcomeV2` | Typed outcome object: `{ type, statement, source }` |

---

## How compat-v1 reading works

During the migration window, `routeDispatch()` in `lp-do-ideas-routing-adapter.ts`
automatically handles v1 packets:

```
v1 packet.current_truth → payload.why (lossy approximation)
why_source = "compat-v1"
intended_outcome = undefined (not populated — no fabrication)
```

If `current_truth` is absent or empty, `why` is also absent (no fabrication policy).

The `why_source: "compat-v1"` flag is used by:
- `generate-build-summary.ts` — marks compat values distinctly; excludes from operator-quality fill rate
- `lp-do-build-event-emitter.ts` — emits `why_source` in `build-event.json` for downstream tracing

---

## How to migrate a v1 producer to v2

### Step 1: Update the packet constructor

Change `schema_version: "dispatch.v1"` → `schema_version: "dispatch.v2"` and add
the two required fields:

```typescript
// Before (v1):
const packet: TrialDispatchPacket = {
  schema_version: "dispatch.v1",
  current_truth: "ARTIFACT changed (sha1 → sha2)",
  next_scope_now: "Investigate implications of delta",
  // ... other fields
};

// After (v2):
const packet: TrialDispatchPacketV2 = {
  schema_version: "dispatch.v2",
  current_truth: "ARTIFACT changed (sha1 → sha2)",  // keep for reference
  next_scope_now: "Investigate implications of delta",  // keep for reference
  why: "Operator-authored: explain why this work matters now and what changed",
  intended_outcome: {
    type: "measurable",  // or "operational" if no measurable KPI applies
    statement: "Specific, bounded statement of the desired outcome",
    source: "operator",  // "auto" only if not confirmed at Option B
  },
  // ... other fields
};
```

### Step 2: Author `why` and `intended_outcome` at Option B confirmation

At the point where the operator confirms Option B (queue-with-confirmation):

- **`why`**: Write 1–3 sentences explaining why this specific work is happening now,
  not just what changed. Avoid template-like strings (e.g., "ARTIFACT changed" is
  a v1 fallback, not an operator-authored `why`).

- **`intended_outcome.type`**:
  - Use `"measurable"` when a concrete, time-bound KPI applies (e.g., "≥10% uplift in X within 30 days").
  - Use `"operational"` when the outcome is process or quality improvement without a specific KPI.

- **`intended_outcome.statement`**: Write a specific, bounded statement. Avoid
  template placeholders like `"Investigate implications..."`.

- **`intended_outcome.source`**: Set to `"operator"` when authored by the operator
  at Option B confirmation. Set to `"auto"` only for auto-generated fallbacks (these
  are excluded from quality metrics).

### Step 3: Validate with `validateDispatchV2()`

```typescript
import { validateDispatchV2 } from "./lp-do-ideas-trial.js";

const result = validateDispatchV2(packet);
if (!result.valid) {
  console.error("v2 validation failed:", result.errors);
}
if (result.quality_warnings?.length) {
  console.warn("Quality warnings:", result.quality_warnings);
}
```

---

## Cutover policy

After **2026-03-27** (30 days from schema merge):

1. `routeDispatch()` will fail closed for any packet with `schema_version: "dispatch.v1"`.
2. The error code will be `INVALID_SCHEMA_VERSION` with a reference to this migration guide.
3. All active v1 producers must be migrated before the cutover date.

**To check whether any v1 packets remain in the trial queue**:

```bash
# Check queue-state.json for v1 packets
grep -c '"schema_version": "dispatch.v1"' \
  docs/business-os/startup-loop/ideas/trial/queue-state.json
```

If this returns 0, all queued dispatches are v2-compatible.

---

## Reading `why_source` in metrics

The `why_source` field in `build-event.json` and Build Summary rows indicates the
provenance of the `why` value:

| `why_source` | Meaning | Counted in quality metrics? |
|---|---|---|
| `"operator"` | Operator-authored at Option B confirmation | Yes |
| `"auto"` | Auto-generated fallback (v2 packet) | No |
| `"compat-v1"` | Derived from v1 `current_truth` (lossy) | No |
| `"heuristic"` | Extracted by `generate-build-summary.ts` heuristics | No |

Only `"operator"` values count toward the payload-quality prerequisite thresholds
in the go-live checklist Section I.

---

## Related files

- `scripts/src/startup-loop/lp-do-ideas-trial.ts` — `TrialDispatchPacketV2`, `IntendedOutcomeV2`, `validateDispatchV2()`
- `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts` — `routeDispatch()` compat reader, `routeDispatchV2()`
- `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.v2.schema.json` — JSON schema
- `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md` — Section I payload quality gate
- `docs/plans/startup-loop-why-intended-outcome-automation/plan.md` — this plan
