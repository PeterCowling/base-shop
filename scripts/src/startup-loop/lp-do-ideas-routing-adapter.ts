/**
 * lp-do-ideas dispatch routing adapter.
 *
 * Pure function: routeDispatch(packet) → RouteResult
 *
 * Validates a dispatch.v1 packet for completeness and produces a typed
 * invocation payload for either lp-do-fact-find or lp-do-briefing.
 *
 * Policy:
 *   - Option B (queue-with-confirmation): adapter produces payloads only.
 *     It does NOT invoke skills. Downstream callers are responsible for
 *     operator confirmation and actual invocation.
 *   - auto_executed status is reserved and MUST be rejected in trial mode.
 *   - Invalid or incomplete packets fail closed with actionable error messages.
 *
 * Contract: docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md
 * Matrix:   docs/business-os/startup-loop/ideas/lp-do-ideas-routing-matrix.md
 */

import type {
  DispatchStatus,
  RecommendedRoute,
  DeliverableFamily,
  TrialDispatchPacket,
} from "./lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Invocation payloads
// ---------------------------------------------------------------------------

/**
 * Payload describing what should be passed to lp-do-fact-find when invoked.
 * Contains all required intake fields from the fact-find skill contract.
 *
 * Per lp-do-fact-find SKILL.md Required Inputs:
 *   - area_anchor (concrete area anchor — feature/component/system)
 *   - location_anchors (≥1 location anchor — path guess, route, endpoint, etc.)
 *   - provisional_deliverable_family
 */
export interface FactFindInvocationPayload {
  skill: "lp-do-fact-find";
  dispatch_id: string;
  business: string;
  area_anchor: string;
  location_anchors: [string, ...string[]];
  provisional_deliverable_family: DeliverableFamily;
  evidence_refs: [string, ...string[]];
  /** ISO-8601 string: when the dispatch packet was created */
  dispatch_created_at: string;
  /** The originating dispatch packet, preserved for traceability */
  source_packet: TrialDispatchPacket;
}

/**
 * Payload describing what should be passed to lp-do-briefing when invoked.
 * Contains required intake fields from the briefing skill contract.
 *
 * Per lp-do-briefing SKILL.md Required Inputs:
 *   - topic / area_anchor
 *   - at least one location anchor
 */
export interface BriefingInvocationPayload {
  skill: "lp-do-briefing";
  dispatch_id: string;
  business: string;
  area_anchor: string;
  /** Carried from location_anchors for operator convenience. May be empty
   *  array for briefing-path since the contract requires only area_anchor. */
  location_anchors: string[];
  evidence_refs: [string, ...string[]];
  /** ISO-8601 string: when the dispatch packet was created */
  dispatch_created_at: string;
  /** The originating dispatch packet, preserved for traceability */
  source_packet: TrialDispatchPacket;
}

export type InvocationPayload = FactFindInvocationPayload | BriefingInvocationPayload;

// ---------------------------------------------------------------------------
// RouteResult
// ---------------------------------------------------------------------------

export interface RouteSuccess {
  ok: true;
  route: RecommendedRoute;
  payload: InvocationPayload;
}

export interface RouteError {
  ok: false;
  /** Machine-readable error code for programmatic handling. */
  code: RoutingErrorCode;
  /** Human-readable, actionable error message. */
  error: string;
  /** The dispatch_id from the packet (if extractable), for correlation. */
  dispatch_id: string | null;
}

export type RouteResult = RouteSuccess | RouteError;

export type RoutingErrorCode =
  | "INVALID_MODE"
  | "RESERVED_STATUS"
  | "UNKNOWN_STATUS"
  | "ROUTE_STATUS_MISMATCH"
  | "MISSING_AREA_ANCHOR"
  | "MISSING_LOCATION_ANCHORS"
  | "MISSING_DELIVERABLE_FAMILY"
  | "MISSING_EVIDENCE_REFS"
  | "INVALID_SCHEMA_VERSION"
  | "UNKNOWN_ROUTE";

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Normalises a string to lower-snake_case for case-insensitive comparisons.
 * Handles mixed-case inputs like "Fact_Find_Ready" → "fact_find_ready".
 */
function normalise(value: string): string {
  return value.trim().toLowerCase();
}

const VALID_STATUSES: ReadonlySet<string> = new Set<DispatchStatus>([
  "fact_find_ready",
  "briefing_ready",
  "auto_executed",
  "logged_no_action",
]);

const VALID_ROUTES: ReadonlySet<string> = new Set<RecommendedRoute>([
  "lp-do-fact-find",
  "lp-do-briefing",
]);

/** Canonical status→route mapping per the trial contract. */
const STATUS_TO_ROUTE: Readonly<Record<string, RecommendedRoute>> = {
  fact_find_ready: "lp-do-fact-find",
  briefing_ready: "lp-do-briefing",
};

function extractDispatchId(packet: unknown): string | null {
  if (
    packet !== null &&
    typeof packet === "object" &&
    "dispatch_id" in packet &&
    typeof (packet as Record<string, unknown>).dispatch_id === "string"
  ) {
    return (packet as Record<string, unknown>).dispatch_id as string;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main export: routeDispatch
// ---------------------------------------------------------------------------

/**
 * Routes a validated dispatch.v1 packet to the appropriate downstream skill.
 *
 * Returns a RouteSuccess with an invocation payload, or a RouteError with an
 * actionable error message and machine-readable error code.
 *
 * This function is PURE — it performs no file I/O and does not invoke any
 * skills. The returned payload is a data structure describing what to invoke;
 * actual invocation is the caller's responsibility (Option B policy).
 */
export function routeDispatch(packet: TrialDispatchPacket): RouteResult {
  const dispatchId = extractDispatchId(packet);

  // --- Schema version guard ---
  if (packet.schema_version !== "dispatch.v1") {
    return {
      ok: false,
      code: "INVALID_SCHEMA_VERSION",
      error:
        `[lp-do-ideas-routing-adapter] Invalid schema_version "${String(packet.schema_version)}". ` +
        `Only "dispatch.v1" packets are accepted. ` +
        `Ensure the packet was produced by lp-do-ideas-trial (TASK-03) and has not been mutated.`,
      dispatch_id: dispatchId,
    };
  }

  // --- Mode guard ---
  if (packet.mode !== "trial") {
    return {
      ok: false,
      code: "INVALID_MODE",
      error:
        `[lp-do-ideas-routing-adapter] Packet mode "${packet.mode}" is not permitted. ` +
        `Only mode="trial" packets are accepted in this tranche. ` +
        `mode="live" routing is reserved for the go-live integration phase ` +
        `defined in lp-do-ideas-go-live-seam.md.`,
      dispatch_id: dispatchId,
    };
  }

  // --- Normalise status and route for case-insensitive comparison ---
  const normStatus = normalise(packet.status);
  const normRoute = normalise(packet.recommended_route);

  // --- Reserved status guard (auto_executed must never reach routing) ---
  if (normStatus === "auto_executed") {
    return {
      ok: false,
      code: "RESERVED_STATUS",
      error:
        `[lp-do-ideas-routing-adapter] Dispatch ${dispatchId ?? "(unknown)"} has ` +
        `status="auto_executed", which is reserved and must not be set in trial mode ` +
        `under Option B (queue-with-confirmation). ` +
        `Only "fact_find_ready" and "briefing_ready" statuses are routable. ` +
        `See trial-policy-decision.md for the escalation path to Option C.`,
      dispatch_id: dispatchId,
    };
  }

  // --- logged_no_action is a terminal non-routable status ---
  if (normStatus === "logged_no_action") {
    return {
      ok: false,
      code: "UNKNOWN_STATUS",
      error:
        `[lp-do-ideas-routing-adapter] Dispatch ${dispatchId ?? "(unknown)"} has ` +
        `status="logged_no_action", which is not a routable state. ` +
        `logged_no_action packets represent conservative no-ops and must not be forwarded ` +
        `to any downstream skill. Check upstream classification in lp-do-ideas-trial.`,
      dispatch_id: dispatchId,
    };
  }

  // --- Unknown status ---
  if (!VALID_STATUSES.has(normStatus)) {
    return {
      ok: false,
      code: "UNKNOWN_STATUS",
      error:
        `[lp-do-ideas-routing-adapter] Dispatch ${dispatchId ?? "(unknown)"} has ` +
        `unrecognised status="${packet.status}". ` +
        `Valid routable statuses are: "fact_find_ready", "briefing_ready". ` +
        `Normalised value received: "${normStatus}".`,
      dispatch_id: dispatchId,
    };
  }

  // --- Unknown route ---
  if (!VALID_ROUTES.has(normRoute)) {
    return {
      ok: false,
      code: "UNKNOWN_ROUTE",
      error:
        `[lp-do-ideas-routing-adapter] Dispatch ${dispatchId ?? "(unknown)"} has ` +
        `unrecognised recommended_route="${packet.recommended_route}". ` +
        `Valid routes are: "lp-do-fact-find", "lp-do-briefing". ` +
        `Normalised value received: "${normRoute}".`,
      dispatch_id: dispatchId,
    };
  }

  // --- Status / route consistency check ---
  const canonicalRouteForStatus = STATUS_TO_ROUTE[normStatus];
  if (canonicalRouteForStatus !== normRoute) {
    return {
      ok: false,
      code: "ROUTE_STATUS_MISMATCH",
      error:
        `[lp-do-ideas-routing-adapter] Dispatch ${dispatchId ?? "(unknown)"} has ` +
        `mismatched status/route pair: status="${packet.status}" requires ` +
        `recommended_route="${canonicalRouteForStatus}", but packet carries ` +
        `recommended_route="${packet.recommended_route}". ` +
        `Correct the upstream classification in lp-do-ideas-trial before routing.`,
      dispatch_id: dispatchId,
    };
  }

  // --- Common field validation ---

  // evidence_refs must be non-empty (enforced for all routes)
  if (!Array.isArray(packet.evidence_refs) || packet.evidence_refs.length === 0) {
    return {
      ok: false,
      code: "MISSING_EVIDENCE_REFS",
      error:
        `[lp-do-ideas-routing-adapter] Dispatch ${dispatchId ?? "(unknown)"} is missing ` +
        `evidence_refs (must have ≥1 item). ` +
        `evidence_refs traces the origin artifact back to the dispatch. ` +
        `Ensure lp-do-ideas-trial populates this field before emitting the packet.`,
      dispatch_id: dispatchId,
    };
  }

  // area_anchor must be non-empty (enforced for all routes)
  if (typeof packet.area_anchor !== "string" || packet.area_anchor.trim() === "") {
    return {
      ok: false,
      code: "MISSING_AREA_ANCHOR",
      error:
        `[lp-do-ideas-routing-adapter] Dispatch ${dispatchId ?? "(unknown)"} has an empty ` +
        `or missing area_anchor. ` +
        `area_anchor is required by both lp-do-fact-find and lp-do-briefing as the ` +
        `concrete area/feature/component/system anchor. ` +
        `Ensure deriveAreaAnchor() in lp-do-ideas-trial returns a non-empty string.`,
      dispatch_id: dispatchId,
    };
  }

  // ---------------------------------------------------------------------------
  // Route: lp-do-fact-find
  // ---------------------------------------------------------------------------

  if (normRoute === "lp-do-fact-find") {
    // location_anchors required: must have ≥1 item
    if (!Array.isArray(packet.location_anchors) || packet.location_anchors.length === 0) {
      return {
        ok: false,
        code: "MISSING_LOCATION_ANCHORS",
        error:
          `[lp-do-ideas-routing-adapter] Dispatch ${dispatchId ?? "(unknown)"} is missing ` +
          `location_anchors (must have ≥1 item) for the lp-do-fact-find path. ` +
          `location_anchors must be a non-empty array (path, route, endpoint, error/log, ` +
          `or user flow) per the lp-do-fact-find intake contract. ` +
          `Check lp-do-ideas-trial: location_anchors is set from [event.path] — verify ` +
          `the source event had a non-empty path field.`,
        dispatch_id: dispatchId,
      };
    }

    // provisional_deliverable_family required for fact-find path
    if (
      typeof packet.provisional_deliverable_family !== "string" ||
      packet.provisional_deliverable_family.trim() === ""
    ) {
      return {
        ok: false,
        code: "MISSING_DELIVERABLE_FAMILY",
        error:
          `[lp-do-ideas-routing-adapter] Dispatch ${dispatchId ?? "(unknown)"} is missing ` +
          `provisional_deliverable_family for the lp-do-fact-find path. ` +
          `This field is required by the lp-do-fact-find intake contract and determines ` +
          `execution track and deliverable routing in the fact-find skill. ` +
          `Valid families: "code-change", "doc", "multi", "business-artifact", "design", "infra".`,
        dispatch_id: dispatchId,
      };
    }

    const payload: FactFindInvocationPayload = {
      skill: "lp-do-fact-find",
      dispatch_id: packet.dispatch_id,
      business: packet.business,
      area_anchor: packet.area_anchor,
      location_anchors: packet.location_anchors,
      provisional_deliverable_family: packet.provisional_deliverable_family,
      evidence_refs: packet.evidence_refs,
      dispatch_created_at: packet.created_at,
      source_packet: packet,
    };

    return {
      ok: true,
      route: "lp-do-fact-find",
      payload,
    };
  }

  // ---------------------------------------------------------------------------
  // Route: lp-do-briefing
  // ---------------------------------------------------------------------------

  if (normRoute === "lp-do-briefing") {
    // briefing path requires only area_anchor (already validated above).
    // location_anchors are passed through if present but not enforced as required.
    const locationAnchors: string[] = Array.isArray(packet.location_anchors)
      ? packet.location_anchors
      : [];

    const payload: BriefingInvocationPayload = {
      skill: "lp-do-briefing",
      dispatch_id: packet.dispatch_id,
      business: packet.business,
      area_anchor: packet.area_anchor,
      location_anchors: locationAnchors,
      evidence_refs: packet.evidence_refs,
      dispatch_created_at: packet.created_at,
      source_packet: packet,
    };

    return {
      ok: true,
      route: "lp-do-briefing",
      payload,
    };
  }

  // Exhaustive guard — TypeScript narrows to never here in practice.
  // Kept as a runtime safety net against future schema additions.
  return {
    ok: false,
    code: "UNKNOWN_ROUTE",
    error:
      `[lp-do-ideas-routing-adapter] Dispatch ${dispatchId ?? "(unknown)"} has ` +
      `an unhandled recommended_route="${packet.recommended_route}" after status validation. ` +
      `This is a routing adapter bug — please report to startup-loop maintainers.`,
    dispatch_id: dispatchId,
  };
}
