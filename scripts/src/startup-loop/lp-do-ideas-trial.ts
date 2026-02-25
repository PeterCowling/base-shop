/**
 * lp-do-ideas trial orchestrator.
 *
 * Ingests standing-artifact delta events and emits dispatch.v1 packets.
 * Operates in mode="trial" only — rejects mode="live" fail-closed.
 * Does not mutate startup-loop stage state.
 *
 * Contract: docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md
 * Schema:   docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json
 */

// ---------------------------------------------------------------------------
// T1-conservative semantic-delta keywords (case-insensitive substring match)
// ---------------------------------------------------------------------------

export const T1_SEMANTIC_KEYWORDS: readonly string[] = [
  // ICP definition
  "icp",
  "target customer",
  "segment",
  "persona",
  "job-to-be-done",
  "jtbd",
  // Positioning / value proposition
  "positioning",
  "value proposition",
  "unique",
  "differentiation",
  "key message",
  // Pricing / offer structure
  "pricing",
  "price point",
  "offer",
  "bundle",
  "promotional",
  // Channel strategy
  "channel strategy",
  "launch channel",
  "channel mix",
  "channel priorities",
  "channel selection",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DeliverableFamily =
  | "code-change"
  | "doc"
  | "multi"
  | "business-artifact"
  | "design"
  | "infra";

export type DispatchStatus =
  | "fact_find_ready"
  | "briefing_ready"
  | "auto_executed"
  | "logged_no_action";

export type RecommendedRoute = "lp-do-fact-find" | "lp-do-briefing";

export type QueueState = "enqueued" | "processed" | "skipped" | "error";

export type ArtifactDomain =
  | "MARKET"
  | "SELL"
  | "PRODUCTS"
  | "LOGISTICS"
  | "STRATEGY"
  | "BOS";

/** Incoming standing-artifact delta event. */
export interface ArtifactDeltaEvent {
  /** Registered artifact key from the standing registry. */
  artifact_id: string;
  /** Business identifier (e.g. HBAG, BRIK). */
  business: string;
  /** Content hash before the delta. Null = first registration → logged_no_action. */
  before_sha: string | null;
  /** Content hash after the delta. Empty string = invalid → noop. */
  after_sha: string;
  /** Relative path to the artifact from repo root. */
  path: string;
  /** Layer A domain this artifact belongs to. */
  domain?: ArtifactDomain;
  /**
   * Section headings that changed (case-sensitive; matched case-insensitively).
   * Undefined or empty array → conservative logged_no_action under T1 threshold.
   */
  changed_sections?: string[];
}

/** dispatch.v1 packet emitted for each actionable delta. */
export interface TrialDispatchPacket {
  schema_version: "dispatch.v1";
  dispatch_id: string;
  mode: "trial";
  business: string;
  trigger: "artifact_delta";
  artifact_id: string;
  before_sha: string | null;
  after_sha: string;
  area_anchor: string;
  location_anchors: [string, ...string[]];
  provisional_deliverable_family: DeliverableFamily;
  current_truth: string;
  next_scope_now: string;
  adjacent_later: string[];
  recommended_route: RecommendedRoute;
  status: DispatchStatus;
  priority: "P1" | "P2" | "P3";
  confidence: number;
  evidence_refs: [string, ...string[]];
  created_at: string;
  queue_state: QueueState;
}

export interface TrialOrchestratorOptions {
  /** Must be "trial". Any other value returns an error. */
  mode: string;
  /** Delta events to process. */
  events: ArtifactDeltaEvent[];
  /**
   * Idempotency set of already-processed deduplication keys.
   * Key format: "<artifact_id>:<before_sha>:<after_sha>".
   * Mutated in place — share the same Set across calls for session-level idempotency.
   */
  seenDedupeKeys?: Set<string>;
  /**
   * Injectable clock for deterministic dispatch_id generation in tests.
   * Defaults to () => new Date().
   */
  clock?: () => Date;
}

export interface TrialOrchestratorResult {
  ok: true;
  /** Dispatch packets emitted for actionable events. */
  dispatched: TrialDispatchPacket[];
  /** Number of duplicate events suppressed. */
  suppressed: number;
  /** Number of events classified as logged_no_action (no packet emitted). */
  noop: number;
}

export interface TrialOrchestratorError {
  ok: false;
  error: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const DOMAIN_TO_AREA: Readonly<Record<ArtifactDomain, string>> = {
  MARKET: "market-intelligence",
  SELL: "channel-strategy",
  PRODUCTS: "product-catalogue",
  LOGISTICS: "logistics-policy",
  STRATEGY: "business-strategy",
  BOS: "business-operating-system",
};

function deriveAreaAnchor(event: ArtifactDeltaEvent): string {
  if (event.domain) {
    return DOMAIN_TO_AREA[event.domain];
  }
  // Fallback: strip business prefix from artifact_id and normalise
  return event.artifact_id
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/^[a-z0-9]+-/, "");
}

/** Returns true if any changed section heading matches a T1 semantic keyword. */
function matchesT1(changedSections: string[]): boolean {
  const lowered = changedSections.map((s) => s.toLowerCase());
  return T1_SEMANTIC_KEYWORDS.some((keyword) =>
    lowered.some((section) => section.includes(keyword)),
  );
}

/**
 * Builds the deduplication key for an event.
 * Format: "<artifact_id>:<before_sha|null>:<after_sha>"
 */
export function buildDedupeKey(event: ArtifactDeltaEvent): string {
  return `${event.artifact_id}:${event.before_sha ?? "null"}:${event.after_sha}`;
}

/** Formats a dispatch_id from a Date and sequence number (1-based). Uses UTC. */
export function buildDispatchId(now: Date, seq: number): string {
  const p = (n: number, len: number) => String(n).padStart(len, "0");
  const ts =
    `${now.getUTCFullYear()}` +
    `${p(now.getUTCMonth() + 1, 2)}` +
    `${p(now.getUTCDate(), 2)}` +
    `${p(now.getUTCHours(), 2)}` +
    `${p(now.getUTCMinutes(), 2)}` +
    `${p(now.getUTCSeconds(), 2)}`;
  return `IDEA-DISPATCH-${ts}-${p(seq, 4)}`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Runs the lp-do-ideas trial orchestrator.
 *
 * Pure function — no file I/O. Queue/telemetry writes are handled by
 * lp-do-ideas-trial-queue.ts (TASK-05).
 */
export function runTrialOrchestrator(
  options: TrialOrchestratorOptions,
): TrialOrchestratorResult | TrialOrchestratorError {
  // Mode guard: only "trial" is permitted in this tranche
  if (options.mode !== "trial") {
    return {
      ok: false,
      error:
        `[lp-do-ideas-trial] mode "${options.mode}" is not permitted in this tranche. ` +
        `Only mode="trial" is supported. mode="live" is reserved for the go-live ` +
        `integration phase defined in lp-do-ideas-go-live-seam.md.`,
    };
  }

  const seenKeys = options.seenDedupeKeys ?? new Set<string>();
  const now = options.clock ? options.clock() : new Date();

  const dispatched: TrialDispatchPacket[] = [];
  let suppressed = 0;
  let noop = 0;

  // Sort events deterministically by (artifact_id, after_sha) for stable sequence
  const sorted = [...options.events].sort((a, b) => {
    const ka = `${a.artifact_id}:${a.after_sha}`;
    const kb = `${b.artifact_id}:${b.after_sha}`;
    return ka.localeCompare(kb);
  });

  let seq = 1;

  for (const event of sorted) {
    // Reject events with empty after_sha
    if (!event.after_sha) {
      noop++;
      continue;
    }

    // Idempotency: suppress duplicate (artifact_id, before_sha, after_sha) tuples
    const dedupeKey = buildDedupeKey(event);
    if (seenKeys.has(dedupeKey)) {
      suppressed++;
      continue;
    }
    seenKeys.add(dedupeKey);

    // First registration (null before_sha) — no meaningful delta to classify
    if (!event.before_sha) {
      noop++;
      continue;
    }

    // T1-conservative classification
    const hasSections = Array.isArray(event.changed_sections);
    const sections = event.changed_sections ?? [];

    if (!hasSections || sections.length === 0) {
      // No section info — conservative logged_no_action
      noop++;
      continue;
    }

    const t1Match = matchesT1(sections);
    const status: DispatchStatus = t1Match ? "fact_find_ready" : "briefing_ready";
    const recommended_route: RecommendedRoute = t1Match
      ? "lp-do-fact-find"
      : "lp-do-briefing";

    const area_anchor = deriveAreaAnchor(event);
    const dispatch_id = buildDispatchId(now, seq++);
    const beforeShort = event.before_sha.slice(0, 7);
    const afterShort = event.after_sha.slice(0, 7);

    dispatched.push({
      schema_version: "dispatch.v1",
      dispatch_id,
      mode: "trial",
      business: event.business,
      trigger: "artifact_delta",
      artifact_id: event.artifact_id,
      before_sha: event.before_sha,
      after_sha: event.after_sha,
      area_anchor,
      location_anchors: [event.path],
      provisional_deliverable_family: "business-artifact",
      current_truth: `${event.artifact_id} changed (${beforeShort} → ${afterShort})`,
      next_scope_now: `Investigate implications of ${area_anchor} delta for ${event.business}`,
      adjacent_later: [],
      recommended_route,
      status,
      priority: "P2",
      confidence: t1Match ? 0.75 : 0.5,
      evidence_refs: [event.path],
      created_at: now.toISOString(),
      queue_state: "enqueued",
    });
  }

  return { ok: true, dispatched, suppressed, noop };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

type CliOptions = {
  mode: string;
  business: string;
  artifactId: string;
  beforeSha: string | null;
  afterSha: string;
  path: string;
  domain: ArtifactDomain | undefined;
  changedSections: string[];
};

function parseCliArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    mode: "trial",
    business: "",
    artifactId: "",
    beforeSha: null,
    afterSha: "",
    path: "",
    domain: undefined,
    changedSections: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--mode") {
      opts.mode = String(argv[i + 1] ?? "").trim();
      i += 1;
    } else if (token === "--business") {
      opts.business = String(argv[i + 1] ?? "").trim();
      i += 1;
    } else if (token === "--artifact-id") {
      opts.artifactId = String(argv[i + 1] ?? "").trim();
      i += 1;
    } else if (token === "--before") {
      opts.beforeSha = String(argv[i + 1] ?? "").trim() || null;
      i += 1;
    } else if (token === "--after") {
      opts.afterSha = String(argv[i + 1] ?? "").trim();
      i += 1;
    } else if (token === "--path") {
      opts.path = String(argv[i + 1] ?? "").trim();
      i += 1;
    } else if (token === "--domain") {
      opts.domain = String(argv[i + 1] ?? "").trim() as ArtifactDomain;
      i += 1;
    } else if (token === "--section") {
      opts.changedSections.push(String(argv[i + 1] ?? "").trim());
      i += 1;
    }
  }

  return opts;
}

function runCli() {
  const args = parseCliArgs(process.argv.slice(2));

  if (!args.business || !args.artifactId || !args.afterSha || !args.path) {
    console.error(
      "[lp-do-ideas-trial] Usage: pnpm --filter scripts startup-loop:lp-do-ideas-trial --" +
        " --business <BIZ> --artifact-id <ID> --after <sha> --path <path>" +
        " [--before <sha>] [--domain <DOMAIN>] [--section <heading> ...]" +
        " [--mode trial]",
    );
    process.exitCode = 2;
    return;
  }

  const result = runTrialOrchestrator({
    mode: args.mode,
    events: [
      {
        artifact_id: args.artifactId,
        business: args.business,
        before_sha: args.beforeSha,
        after_sha: args.afterSha,
        path: args.path,
        domain: args.domain,
        changed_sections: args.changedSections.length > 0 ? args.changedSections : undefined,
      },
    ],
  });

  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.includes("lp-do-ideas-trial")) {
  runCli();
}
