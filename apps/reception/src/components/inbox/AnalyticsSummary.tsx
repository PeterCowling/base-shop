"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@acme/design-system/atoms";

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
// Cache (5-minute TTL)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  data: AnalyticsData;
  fetchedAt: number;
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
      <p className="truncate text-xs font-semibold uppercase tracking-wide text-foreground/60">
        {label}
      </p>
      <p className="text-sm font-bold text-foreground">
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
  const cacheRef = useRef<CacheEntry | null>(null);

  const load = useCallback(async (signal?: AbortSignal, bypassCache?: boolean) => {
    // Serve from cache if fresh enough and not forced
    if (!bypassCache && cacheRef.current) {
      const age = Date.now() - cacheRef.current.fetchedAt;
      if (age < CACHE_TTL_MS) {
        setData(cacheRef.current.data);
        setError(false);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(false);
    const result = await fetchAnalytics(signal);
    if (signal?.aborted) return;
    if (!mountedRef.current) return;
    if (result) {
      cacheRef.current = { data: result, fetchedAt: Date.now() };
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

  function handleRetry() {
    const controller = new AbortController();
    void load(controller.signal, true);
  }

  // Show error banner instead of hiding entirely
  if (error && !data) {
    return (
      <div className="mt-3 flex items-center justify-between rounded-lg border border-warning-main/30 bg-warning-soft px-4 py-2.5">
        <p className="text-xs text-warning-main">
          Analytics unavailable
        </p>
        <Button
          type="button"
          color="default"
          tone="ghost"
          onClick={handleRetry}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-warning-main hover:bg-warning-main/10"
        >
          Tap to retry
        </Button>
      </div>
    );
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
    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-border-1 bg-surface-1 px-4 py-2.5">
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
