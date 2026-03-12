"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { buildMcpAuthHeaders } from "@/services/mcpAuthHeaders";

// ---------------------------------------------------------------------------
// Types (client-side redeclaration of server analytics types)
// ---------------------------------------------------------------------------

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
// Fetch helper
// ---------------------------------------------------------------------------

async function fetchAnalytics(signal?: AbortSignal): Promise<AnalyticsData | null> {
  try {
    const headers = await buildMcpAuthHeaders();
    const response = await fetch("/api/mcp/inbox/analytics?days=30", {
      headers,
      signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { success: boolean; data?: AnalyticsData };
    if (!payload.success || !payload.data) {
      return null;
    }

    return payload.data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Skeleton placeholder
// ---------------------------------------------------------------------------

function MetricSkeleton() {
  return (
    <div className="animate-pulse space-y-1">
      <div className="h-3 w-12 rounded-lg bg-surface-3" />
      <div className="h-5 w-8 rounded-lg bg-surface-3" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number | string | null;
  suffix?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground">
        {value !== null && value !== undefined ? `${value}${suffix}` : "-"}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type AnalyticsSummaryProps = {
  /** External trigger to re-fetch analytics (increment to refetch). */
  refreshKey?: number;
};

export default function AnalyticsSummary({ refreshKey }: AnalyticsSummaryProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    const result = await fetchAnalytics(signal);
    if (signal?.aborted) return;
    if (!mountedRef.current) return;
    if (result) {
      setData(result);
    } else {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    void load(controller.signal);
    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [load, refreshKey]);

  // Hide entirely on error (graceful degradation)
  if (error && !data) {
    return null;
  }

  // Loading skeleton
  if (loading && !data) {
    return (
      <div className="mt-3 flex gap-6 rounded-lg border border-border/50 bg-surface-1 px-4 py-2.5">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const isEmpty =
    !data.volume?.totalThreads
    && !data.quality?.totalDrafted
    && !data.resolution?.resolvedCount
    && !data.admission?.totalProcessed;

  if (isEmpty) {
    return (
      <div className="mt-3 rounded-lg border border-border/50 bg-surface-1 px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          No analytics data yet. Metrics will appear as emails are processed.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-border/50 bg-surface-1 px-4 py-2.5">
      <MetricCard
        label="Quality pass"
        value={data.quality?.passRate ?? null}
        suffix="%"
      />
      <MetricCard
        label="Avg to send"
        value={data.resolution?.avgAdmittedToSentHours ?? null}
        suffix="h"
      />
      <MetricCard
        label="Volume (30d)"
        value={data.volume?.totalThreads ?? null}
      />
      <MetricCard
        label="Admit rate"
        value={data.admission?.admittedRate ?? null}
        suffix="%"
      />
    </div>
  );
}
