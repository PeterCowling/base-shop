"use client";

import { useEffect, useMemo, useState } from "react";

import { useTranslations } from "@acme/i18n";
import type { TelemetryEvent } from "@acme/telemetry";
import { Toast } from "@acme/ui/components/atoms";

import { TelemetryFiltersPanel } from "./TelemetryFiltersPanel";
import { TelemetryHeader } from "./TelemetryHeader";
import type { TelemetrySummaryMetric } from "./TelemetrySummaryCards";
import { TelemetrySummaryCards } from "./TelemetrySummaryCards";
import {
  buildChartData,
  buildSummary,
  filterTelemetryEvents,
  getPresets,
  type TelemetryFilters,
} from "./telemetryUtils";

interface TelemetryAnalyticsViewProps {
  events: TelemetryEvent[];
  isLoading: boolean;
  error?: string | null;
  onReload?: () => void | Promise<void>;
}

export function TelemetryAnalyticsView({
  events,
  isLoading,
  error,
  onReload,
}: TelemetryAnalyticsViewProps) {
  const t = useTranslations();
  const [filters, setFilters] = useState<TelemetryFilters>({
    name: "",
    start: "",
    end: "",
  });
  const [activePreset, setActivePreset] = useState<string>("all");
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  useEffect(() => {
    if (error) {
      setToast({ open: true, message: error });
    }
  }, [error]);

  const filteredEvents = useMemo(
    () => filterTelemetryEvents(events, filters),
    [events, filters],
  );

  const summaryRows = useMemo(
    () => buildSummary(filteredEvents),
    [filteredEvents],
  );

  const chartData = useMemo(
    () => buildChartData(filteredEvents, t),
    [filteredEvents, t],
  );

  const timerDurations = useMemo(() => {
    const durations = filteredEvents
      .filter((event) => event.name === "build_flow_timer_done")
      .map((event) => {
        const duration = (event as { payload?: { durationMs?: unknown } }).payload
          ?.durationMs;
        return typeof duration === "number" ? duration : null;
      })
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);
    const percentile = (p: number) => {
      if (!durations.length) return null;
      const idx = Math.min(
        durations.length - 1,
        Math.floor((p / 100) * durations.length),
      );
      return durations[idx];
    };
    const median =
      durations.length > 0
        ? durations[Math.floor(durations.length / 2)]
        : null;
    const p90 = percentile(90);
    return { median, p90 };
  }, [filteredEvents]);

  const firstSeen = filteredEvents.reduce<number | null>((acc, event) => {
    if (!acc) return event.ts;
    return Math.min(acc, event.ts);
  }, null);

  const lastSeen = filteredEvents.reduce<number | null>((acc, event) => {
    if (!acc) return event.ts;
    return Math.max(acc, event.ts);
  }, null);

  const heroMetrics: TelemetrySummaryMetric[] = [
    {
      label: String(t("cms.telemetry.events")),
      value: filteredEvents.length,
      description: String(t("cms.telemetry.matchingFilters")),
    },
    {
      label: String(t("cms.telemetry.uniqueSignals")),
      value: summaryRows.length,
      description: String(t("cms.telemetry.distinctEventNames")),
    },
    {
      label: String(t("cms.telemetry.firstSeen")),
      // i18n-exempt — decorative em dash for unavailable value
      value: firstSeen ? new Date(firstSeen).toLocaleString() : "—",
      description: String(t("cms.telemetry.earliestInRange")),
    },
    {
      label: String(t("cms.telemetry.lastSeen")),
      // i18n-exempt — decorative em dash for unavailable value
      value: lastSeen ? new Date(lastSeen).toLocaleString() : "—",
      description: String(t("cms.telemetry.latestInRange")),
    },
    ...(timerDurations.median
      ? [
          {
            label: String(t("cms.telemetry.timer.median")),
            value: `${Math.round(timerDurations.median / 60000)}m`,
            description: String(t("cms.telemetry.timer.medianDesc")),
          },
        ]
      : []),
    ...(timerDurations.p90
      ? [
          {
            label: String(t("cms.telemetry.timer.p90")),
            value: `${Math.round(timerDurations.p90 / 60000)}m`,
            description: String(t("cms.telemetry.timer.p90Desc")),
          },
        ]
      : []),
  ];

  function handlePresetSelect(presetId: string) {
    const preset = getPresets(t).find((p) => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    setFilters((prev) => ({ ...prev, ...preset.apply() }));
    setToast({
      open: true,
      message: String(
        t("cms.telemetry.presetApplied", { preset: preset.label }) as string,
      ),
    });
  }

  function handleFiltersChange(partial: Partial<TelemetryFilters>) {
    setActivePreset("custom");
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  return (
    <div className="space-y-6">
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        role="status"
        aria-live="assertive"
      />
      <TelemetryHeader onReload={onReload} />
      <TelemetrySummaryCards metrics={heroMetrics} />
      <TelemetryFiltersPanel
        presets={getPresets(t)}
        activePreset={activePreset}
        onPresetSelect={handlePresetSelect}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        filteredEvents={filteredEvents}
        chartData={chartData}
        isLoading={isLoading}
        summaryRows={summaryRows}
        totalEvents={events.length}
      />
    </div>
  );
}

export default function TelemetryPage() {
  const t = useTranslations();
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useMemo(() => {
    return async () => {
      setLoading(true);
      try {
        const endpoint =
          process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT ?? "/api/telemetry";
        const res = await fetch(endpoint);
        if (!res.ok) {
          throw new Error(
            String(
              t("cms.telemetry.loadFailedWithStatus", { status: res.status }),
            ),
          );
        }
        const data = (await res.json()) as TelemetryEvent[];
        setEvents(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(
          (err as Error).message ?? String(t("cms.telemetry.unableToLoad")),
        );
      } finally {
        setLoading(false);
      }
    };
  }, [t]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  return (
    <TelemetryAnalyticsView
      events={events}
      isLoading={isLoading}
      error={error}
      onReload={loadEvents}
    />
  );
}
