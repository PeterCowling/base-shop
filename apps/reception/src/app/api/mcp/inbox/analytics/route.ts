import { NextResponse } from "next/server";

import {
  ALL_METRIC_GROUPS,
  type AnalyticsSource,
  computeAnalytics,
  type MetricGroup,
} from "@/lib/inbox/analytics.server";
import { inboxApiErrorResponse } from "@/lib/inbox/api-route-helpers";

import { requireStaffAuth } from "../../_shared/staff-auth";

export async function GET(request: Request) {
  const auth = await requireStaffAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const url = new URL(request.url);

    // Parse days param
    const daysParam = url.searchParams.get("days");
    let days: number | undefined;
    if (daysParam !== null) {
      const parsed = Number.parseInt(daysParam, 10);
      if (
        !Number.isInteger(parsed) ||
        parsed < 1 ||
        parsed > 365
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "days must be an integer between 1 and 365",
          },
          { status: 400 },
        );
      }
      days = parsed;
    }

    // Parse metrics param (comma-separated list of metric group names)
    const metricsParam = url.searchParams.get("metrics");
    let metrics: MetricGroup[] | undefined;
    if (metricsParam) {
      const validNames: ReadonlySet<string> = new Set<string>(ALL_METRIC_GROUPS);
      const requested = metricsParam
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is MetricGroup => validNames.has(s));
      if (requested.length > 0) {
        metrics = requested;
      }
    }

    // Parse source param: "email" | "prime" | "all" (default: "email")
    const sourceParam = url.searchParams.get("source");
    let source: AnalyticsSource | undefined;
    if (sourceParam !== null) {
      if (sourceParam === "email" || sourceParam === "prime" || sourceParam === "all") {
        source = sourceParam;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "source must be one of: email, prime, all",
          },
          { status: 400 },
        );
      }
    }

    const data = await computeAnalytics({ days, metrics, source });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return inboxApiErrorResponse(error);
  }
}
