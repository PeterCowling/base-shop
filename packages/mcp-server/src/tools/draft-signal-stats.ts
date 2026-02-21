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
      "Returns counts for selections, refinements, joined pairs, and events since last calibration. " +
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
    return jsonResult(counts);
  } catch (error) {
    return errorResult(formatError(error));
  }
}
