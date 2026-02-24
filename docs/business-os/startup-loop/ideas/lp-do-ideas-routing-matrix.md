---
Type: Routing-Matrix
Version: 1.0.0
Status: Active
Created: 2026-02-24
Owner: startup-loop maintainers
Related-contract: docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md
Related-policy: docs/plans/lp-do-ideas-startup-loop-integration/artifacts/trial-policy-decision.md
Related-schema: docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json
Related-adapter: scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts
Related-skills: .claude/skills/lp-do-fact-find/SKILL.md, .claude/skills/lp-do-briefing/SKILL.md
---

# lp-do-ideas Routing Matrix

This document is the operator reference for dispatch routing in trial mode. It maps every
`(status, recommended_route)` combination to the expected adapter behaviour, the required intake
fields, and the downstream invocation payload shape.

The routing adapter (`lp-do-ideas-routing-adapter.ts`) implements this matrix as a pure function.
It produces invocation payloads only — it does not invoke skills. Actual invocation requires
explicit operator confirmation per Option B (queue-with-confirmation) policy.

---

## 1. Policy Context

| Field | Value |
|---|---|
| Mode | `trial` |
| Invocation policy | Option B — queue with confirmation |
| Trigger threshold | T1-conservative |
| Adapter behaviour | Produce invocation payload; do NOT invoke skill |
| Auto-execute | Prohibited in trial mode |

---

## 2. Routing Matrix

### 2.1 Routable Status / Route Pairs

| Status | Recommended Route | Adapter Outcome | Required Intake Fields |
|---|---|---|---|
| `fact_find_ready` | `lp-do-fact-find` | `RouteSuccess` with `FactFindInvocationPayload` | `area_anchor` (non-empty), `location_anchors` (≥1 item), `provisional_deliverable_family` (non-empty), `evidence_refs` (≥1 item) |
| `briefing_ready` | `lp-do-briefing` | `RouteSuccess` with `BriefingInvocationPayload` | `area_anchor` (non-empty), `evidence_refs` (≥1 item) |

### 2.2 Non-Routable Status Values

| Status | Adapter Outcome | Error Code | Explanation |
|---|---|---|---|
| `auto_executed` | `RouteError` | `RESERVED_STATUS` | Reserved status — must not be set in trial mode under Option B. See trial-policy-decision.md escalation path. |
| `logged_no_action` | `RouteError` | `UNKNOWN_STATUS` | Terminal no-op — packet represents a conservative non-event. Must not be forwarded to any downstream skill. |

### 2.3 Structural / Format Error Cases

| Condition | Adapter Outcome | Error Code | Actionable Guidance |
|---|---|---|---|
| `schema_version` is not `"dispatch.v1"` | `RouteError` | `INVALID_SCHEMA_VERSION` | Packet was not produced by lp-do-ideas-trial or was mutated post-emission. Re-emit from the orchestrator. |
| `mode` is not `"trial"` | `RouteError` | `INVALID_MODE` | Only trial packets are accepted in this tranche. Live mode routing is reserved for the go-live seam (TASK-07). |
| `status` and `recommended_route` are inconsistent | `RouteError` | `ROUTE_STATUS_MISMATCH` | The upstream orchestrator set status/route to an invalid combination. Correct classification in lp-do-ideas-trial. |
| Unrecognised `status` value | `RouteError` | `UNKNOWN_STATUS` | Status is not in `{fact_find_ready, briefing_ready, auto_executed, logged_no_action}`. Check schema version. |
| Unrecognised `recommended_route` value | `RouteError` | `UNKNOWN_ROUTE` | Route is not `lp-do-fact-find` or `lp-do-briefing`. Check schema version. |
| `area_anchor` is empty or whitespace | `RouteError` | `MISSING_AREA_ANCHOR` | area_anchor is required for all routes. Verify deriveAreaAnchor() in lp-do-ideas-trial returns a non-empty value. |
| `evidence_refs` is empty | `RouteError` | `MISSING_EVIDENCE_REFS` | evidence_refs must contain ≥1 artifact path or anchor for all routes. |
| `location_anchors` is empty on `lp-do-fact-find` path | `RouteError` | `MISSING_LOCATION_ANCHORS` | Required by lp-do-fact-find intake contract. Verify lp-do-ideas-trial sets location_anchors from event.path. |
| `provisional_deliverable_family` is empty on `lp-do-fact-find` path | `RouteError` | `MISSING_DELIVERABLE_FAMILY` | Required by lp-do-fact-find intake contract for execution-track routing. |

---

## 3. Invocation Payload Shapes

### 3.1 FactFindInvocationPayload (skill: lp-do-fact-find)

Produced when `status=fact_find_ready` and all intake fields are present.

| Field | Source | Notes |
|---|---|---|
| `skill` | Constant | `"lp-do-fact-find"` |
| `dispatch_id` | `packet.dispatch_id` | Unique dispatch identifier for correlation |
| `business` | `packet.business` | Business code (e.g. HBAG, BRIK) |
| `area_anchor` | `packet.area_anchor` | Concrete feature/component/system anchor for fact-find Phase 1 |
| `location_anchors` | `packet.location_anchors` | ≥1 path, route, endpoint, error/log, or user flow |
| `provisional_deliverable_family` | `packet.provisional_deliverable_family` | Determines execution track and routing in fact-find Phase 4 |
| `evidence_refs` | `packet.evidence_refs` | ≥1 source artifact path for traceability |
| `dispatch_created_at` | `packet.created_at` | ISO-8601 timestamp of original dispatch emission |
| `source_packet` | Full `packet` | Preserved for downstream traceability and audit |

Operator invocation pattern:
```
/lp-do-fact-find <area_anchor>
# with intake fields pre-populated from payload
```

### 3.2 BriefingInvocationPayload (skill: lp-do-briefing)

Produced when `status=briefing_ready` and `area_anchor` is present.

| Field | Source | Notes |
|---|---|---|
| `skill` | Constant | `"lp-do-briefing"` |
| `dispatch_id` | `packet.dispatch_id` | Unique dispatch identifier for correlation |
| `business` | `packet.business` | Business code (e.g. HBAG, BRIK) |
| `area_anchor` | `packet.area_anchor` | Topic/system area for the briefing |
| `location_anchors` | `packet.location_anchors` | Passed through if present; not enforced as required for briefing path |
| `evidence_refs` | `packet.evidence_refs` | ≥1 source artifact path for traceability |
| `dispatch_created_at` | `packet.created_at` | ISO-8601 timestamp of original dispatch emission |
| `source_packet` | Full `packet` | Preserved for downstream traceability and audit |

Operator invocation pattern:
```
/lp-do-briefing <area_anchor>
# with intake fields pre-populated from payload
```

---

## 4. Required Intake Fields by Route

### lp-do-fact-find (status: fact_find_ready)

Per `lp-do-fact-find` SKILL.md Required Inputs:

| Field | Required | Enforcement |
|---|---|---|
| `area_anchor` | Yes | Non-empty string; adapter rejects packet if missing |
| `location_anchors` | Yes | ≥1 item; adapter rejects packet if empty |
| `provisional_deliverable_family` | Yes | Non-empty; adapter rejects packet if missing; determines execution track |
| `evidence_refs` | Yes | ≥1 item; enforced for all routes |

### lp-do-briefing (status: briefing_ready)

Per `lp-do-briefing` SKILL.md Required Inputs:

| Field | Required | Enforcement |
|---|---|---|
| `area_anchor` | Yes | Non-empty string; adapter rejects packet if missing |
| `location_anchors` | No (passed through) | Not enforced; briefing path requires topic + area only |
| `evidence_refs` | Yes | ≥1 item; enforced for all routes |

---

## 5. Casing Normalisation

Before any validation comparison, the adapter normalises `status` and `recommended_route` values
by trimming whitespace and lowercasing. This prevents silent mismatches when packets arrive from
boundary systems (e.g., JSON deserialisers, CLI flags) with inconsistent casing.

Normalisation does not modify the input packet — the adapter is a pure function.

---

## 6. Error Code Reference

| Code | Condition | Recovery Action |
|---|---|---|
| `INVALID_SCHEMA_VERSION` | `schema_version` is not `"dispatch.v1"` | Re-emit packet from lp-do-ideas-trial orchestrator |
| `INVALID_MODE` | `mode` is not `"trial"` | Confirm packet source; live mode is reserved for go-live seam |
| `RESERVED_STATUS` | `status` is `"auto_executed"` | Remove `auto_executed` from packet; review trial-policy-decision.md Option B |
| `UNKNOWN_STATUS` | Unrecognised or non-routable status | Check upstream classification; `logged_no_action` packets must not be routed |
| `ROUTE_STATUS_MISMATCH` | `status` and `recommended_route` are inconsistent | Fix classification in lp-do-ideas-trial — run T1 keyword matching again |
| `UNKNOWN_ROUTE` | Unrecognised `recommended_route` | Verify packet conforms to `lp-do-ideas-dispatch.schema.json` |
| `MISSING_AREA_ANCHOR` | `area_anchor` is empty/whitespace | Fix `deriveAreaAnchor()` in lp-do-ideas-trial; check event.domain and artifact_id |
| `MISSING_EVIDENCE_REFS` | `evidence_refs` is empty | Fix lp-do-ideas-trial: evidence_refs is set from `[event.path]` — check event.path |
| `MISSING_LOCATION_ANCHORS` | `location_anchors` empty on fact-find path | Fix lp-do-ideas-trial: location_anchors is set from `[event.path]` — check event.path |
| `MISSING_DELIVERABLE_FAMILY` | `provisional_deliverable_family` empty on fact-find path | Fix lp-do-ideas-trial: default is `"business-artifact"` — check packet generation |

---

## 7. Status-Route Canonical Mapping

This table is the single source of truth for valid status/route pairs. Any combination not listed
here is rejected by the adapter with `ROUTE_STATUS_MISMATCH` or `UNKNOWN_STATUS`.

| Status | Canonical Route | Notes |
|---|---|---|
| `fact_find_ready` | `lp-do-fact-find` | T1 semantic match confirmed; planning intent present |
| `briefing_ready` | `lp-do-briefing` | Non-T1 structural change; understanding intent only |
| `auto_executed` | (none — reserved) | Must not appear in trial mode; rejected fail-closed |
| `logged_no_action` | (none — terminal) | Conservative no-op; must not be forwarded |

---

## 8. Option B Policy Boundary

The routing adapter enforces the Option B boundary:

- It produces invocation payloads (data structures).
- It does NOT call, spawn, or invoke any downstream skill.
- Actual skill invocation requires explicit operator confirmation.
- The `auto_executed` status is the marker that would indicate auto-invocation occurred;
  its presence in a trial-mode packet is a contract violation and is rejected fail-closed.

Option B escalation to Option C (hybrid auto/queue) requires:
- Trial review period ≥ 14 days
- Sample size ≥ 40 dispatches
- Dispatch precision ≥ 80%

Until those conditions are confirmed and the policy decision artifact is updated, the adapter
will continue to produce payloads only. See `trial-policy-decision.md` for full escalation criteria.

---

## 9. Schema Cross-Reference

| Concept | Defined in |
|---|---|
| Dispatch packet format | `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json` |
| Trial mode contract | `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` |
| Autonomy/threshold policy | `docs/plans/lp-do-ideas-startup-loop-integration/artifacts/trial-policy-decision.md` |
| Routing adapter implementation | `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts` |
| Fact-find intake contract | `.claude/skills/lp-do-fact-find/SKILL.md` |
| Briefing intake contract | `.claude/skills/lp-do-briefing/SKILL.md` |
| Orchestrator (upstream) | `scripts/src/startup-loop/lp-do-ideas-trial.ts` |
| Queue/telemetry (downstream) | `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts` (TASK-05) |
