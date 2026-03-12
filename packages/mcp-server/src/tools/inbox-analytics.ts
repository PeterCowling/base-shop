import { z } from "zod";

import { errorResult, formatError, jsonResult } from "../utils/validation.js";

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const inboxAnalyticsTools = [
  {
    name: "inbox_analytics",
    description:
      "Get comprehensive analytics for the reception inbox. " +
      "Returns metrics across four groups: volume (thread counts by status), " +
      "quality (draft quality pass/fail rates and top failure reasons), " +
      "resolution (average time from admission to send/resolution), and " +
      "admission (admit/auto-archive/review-later rates). " +
      "Accepts optional 'metrics' to select specific groups and 'days' to filter by time window.",
    inputSchema: {
      type: "object",
      properties: {
        metrics: {
          type: "string",
          description:
            "Comma-separated list of metric groups to include: volume, quality, resolution, admission. " +
            "Omit for all groups.",
        },
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
  metrics: z.string().optional(),
  days: z.number().int().positive().optional(),
});

type VolumeMetrics = {
  totalThreads: number;
  admitted: number;
  drafted: number;
  sent: number;
  resolved: number;
};

type QualityMetrics = {
  totalDrafted: number;
  qualityPassed: number;
  qualityFailed: number;
  passRate: number | null;
  topFailureReasons: { reason: string; count: number }[];
};

type ResolutionMetrics = {
  resolvedCount: number;
  avgAdmittedToSentHours: number | null;
  avgAdmittedToResolvedHours: number | null;
};

type AdmissionMetrics = {
  totalProcessed: number;
  admitted: number;
  admittedRate: number | null;
  autoArchived: number;
  autoArchivedRate: number | null;
  reviewLater: number;
  reviewLaterRate: number | null;
};

type AnalyticsData = {
  volume?: VolumeMetrics;
  quality?: QualityMetrics;
  resolution?: ResolutionMetrics;
  admission?: AdmissionMetrics;
  period: { days: number | null };
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

function formatMetricLine(label: string, value: number | null, suffix = ""): string {
  if (value === null) {
    return `${label}: -`;
  }
  return `${label}: ${value}${suffix}`;
}

export async function handleInboxAnalyticsTool(name: string, args: unknown) {
  if (name !== "inbox_analytics") {
    return errorResult(`Unknown inbox analytics tool: ${name}`);
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

    const url = new URL(`${config.baseUrl}/api/mcp/inbox/analytics`);
    if (parsed.metrics) {
      url.searchParams.set("metrics", parsed.metrics);
    }
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

    const payload = (await response.json()) as { success: boolean; data?: AnalyticsData; error?: string };
    if (!payload.success || !payload.data) {
      return errorResult(payload.error ?? "Reception API returned unsuccessful response");
    }

    const d = payload.data;
    const period = d.period.days ? `last ${d.period.days} days` : "all time";
    const lines: string[] = [
      `Inbox Analytics (${period})`,
      "=".repeat(40),
    ];

    if (d.volume) {
      lines.push(
        "",
        "Volume",
        "─".repeat(20),
        `Total threads: ${d.volume.totalThreads}`,
        `Admitted: ${d.volume.admitted}`,
        `Drafted: ${d.volume.drafted}`,
        `Sent: ${d.volume.sent}`,
        `Resolved: ${d.volume.resolved}`,
      );
    }

    if (d.quality) {
      lines.push(
        "",
        "Draft Quality",
        "─".repeat(20),
        `Total drafted: ${d.quality.totalDrafted}`,
        `Passed: ${d.quality.qualityPassed}`,
        `Failed: ${d.quality.qualityFailed}`,
        formatMetricLine("Pass rate", d.quality.passRate, "%"),
      );
      if (d.quality.topFailureReasons.length > 0) {
        lines.push("Top failure reasons:");
        for (const reason of d.quality.topFailureReasons) {
          lines.push(`  - ${reason.reason} (${reason.count})`);
        }
      }
    }

    if (d.resolution) {
      lines.push(
        "",
        "Resolution Speed",
        "─".repeat(20),
        `Resolved threads: ${d.resolution.resolvedCount}`,
        formatMetricLine("Avg time to send", d.resolution.avgAdmittedToSentHours, "h"),
        formatMetricLine("Avg time to resolve", d.resolution.avgAdmittedToResolvedHours, "h"),
      );
    }

    if (d.admission) {
      lines.push(
        "",
        "Admission",
        "─".repeat(20),
        `Total processed: ${d.admission.totalProcessed}`,
        formatMetricLine("Admitted", d.admission.admittedRate, "%"),
        formatMetricLine("Auto-archived", d.admission.autoArchivedRate, "%"),
        formatMetricLine("Review later", d.admission.reviewLaterRate, "%"),
      );
    }

    return jsonResult({
      summary: lines.join("\n"),
      metrics: d,
    });
  } catch (error) {
    return errorResult(formatError(error));
  }
}
