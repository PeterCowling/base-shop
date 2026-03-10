import { z } from "zod";

import { errorResult, formatError, jsonResult } from "../utils/validation.js";

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const draftAcceptanceRateTools = [
  {
    name: "draft_acceptance_rate",
    description:
      "Get draft acceptance rate metrics from the reception inbox. " +
      "Shows how often AI-generated email drafts are sent as-is, edited before sending, " +
      "regenerated, or dismissed. Accepts an optional 'days' parameter to filter by time window. " +
      "Returns counts and percentage rates for each outcome category.",
    inputSchema: {
      type: "object",
      properties: {
        days: {
          type: "number",
          description:
            "Number of days to look back (e.g. 7 for last week, 30 for last month). " +
            "Omit for all-time metrics.",
        },
      },
      required: [],
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const argsSchema = z.object({
  days: z.number().int().positive().optional(),
});

type DraftStatsData = {
  totalDrafted: number;
  sentAsGenerated: number;
  sentAfterEdit: number;
  regenerated: number;
  dismissed: number;
  rates: {
    sentAsGeneratedRate: number;
    sentAfterEditRate: number;
    regeneratedRate: number;
    dismissedRate: number;
  };
  days: number | null;
  insufficient: boolean;
};

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

function resolveReceptionConfig(): { baseUrl: string; authToken: string } | null {
  const baseUrl = (
    process.env.RECEPTION_BASE_URL?.trim() ||
    "https://reception.hostel-positano.com"
  ).replace(/\/+$/, "");

  const authToken = process.env.RECEPTION_AUTH_TOKEN?.trim();
  if (!authToken) {
    return null;
  }

  return { baseUrl, authToken };
}

export async function handleDraftAcceptanceRateTool(name: string, args: unknown) {
  if (name !== "draft_acceptance_rate") {
    return errorResult(`Unknown draft acceptance rate tool: ${name}`);
  }

  try {
    const parsed = argsSchema.parse(args);
    const config = resolveReceptionConfig();

    if (!config) {
      return errorResult(
        "RECEPTION_AUTH_TOKEN environment variable is not set. " +
        "This tool requires a valid Firebase ID token to authenticate with the reception app. " +
        "Set RECEPTION_AUTH_TOKEN in the MCP server environment.",
      );
    }

    const url = new URL(`${config.baseUrl}/api/mcp/inbox/draft-stats`);
    if (parsed.days) {
      url.searchParams.set("days", String(parsed.days));
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${config.authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return errorResult(
        `Reception API returned ${response.status}: ${body || response.statusText}`,
      );
    }

    const payload = (await response.json()) as { success: boolean; data?: DraftStatsData; error?: string };
    if (!payload.success || !payload.data) {
      return errorResult(payload.error ?? "Reception API returned unsuccessful response");
    }

    const d = payload.data;
    const period = d.days ? `last ${d.days} days` : "all time";

    const lines = [
      `Draft Acceptance Rate (${period})`,
      `${"─".repeat(40)}`,
      `Total drafts created: ${d.totalDrafted}`,
      "",
      `Sent as generated:  ${d.sentAsGenerated} (${d.rates.sentAsGeneratedRate}%)`,
      `Sent after editing: ${d.sentAfterEdit} (${d.rates.sentAfterEditRate}%)`,
      `Regenerated:        ${d.regenerated} (${d.rates.regeneratedRate}%)`,
      `Dismissed:          ${d.dismissed} (${d.rates.dismissedRate}%)`,
    ];

    if (d.insufficient) {
      lines.push("", "⚠ No draft events recorded yet. Metrics will populate as drafts are created and acted upon.");
    }

    return jsonResult({
      summary: lines.join("\n"),
      metrics: d,
    });
  } catch (error) {
    return errorResult(formatError(error));
  }
}
