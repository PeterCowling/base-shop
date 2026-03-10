import { join } from "path";

import { countSignalEvents } from "../utils/signal-events.js";
import { errorResult, formatError, jsonResult } from "../utils/validation.js";

const SIGNAL_EVENTS_PATH = join(
  process.cwd(),
  "packages",
  "mcp-server",
  "data",
  "draft-signal-events.jsonl",
);

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const draftSignalStatsTools = [
  {
    name: "draft_signal_stats",
    description:
      "Get aggregated statistics for draft selection and refinement signal events. " +
      "Returns counts for selections, refinements, joined pairs, events since last calibration, " +
      "and deterministic refinement pass/fallback telemetry. " +
      "Returns all-zero counts if no events have been recorded yet.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function handleDraftSignalStatsTool(name: string, _args: unknown) {
  if (name !== "draft_signal_stats") {
    return errorResult(`Unknown draft signal stats tool: ${name}`);
  }

  try {
    const counts = await countSignalEvents(SIGNAL_EVENTS_PATH);
    const deterministic = counts.deterministic_refinement;
    const fallbackRate = deterministic.total > 0
      ? deterministic.fallback / deterministic.total
      : null;

    const deterministic_health = deterministic.total < 10
      ? {
          status: "insufficient_data" as const,
          reason: "Need at least 10 deterministic refinement events for a stable health signal.",
        }
      : fallbackRate !== null && fallbackRate > 0.35
        ? {
            status: "watch" as const,
            reason: "Deterministic fallback rate is above threshold; review repair-chain and parity behavior.",
          }
      : deterministic.quality_pass_rate !== null && deterministic.quality_pass_rate >= 0.95
        ? {
            status: "healthy" as const,
            reason: "Deterministic refinement pass rate is within target range.",
          }
        : {
            status: "watch" as const,
            reason: "Deterministic refinement pass rate is below target; review fallback and quality trends.",
          };

    return jsonResult({
      ...counts,
      deterministic_health_inputs: {
        fallback_rate: fallbackRate,
      },
      deterministic_health,
    });
  } catch (error) {
    return errorResult(formatError(error));
  }
}
