"use client";

import { useEffect, useMemo, useState } from "react";
import type { TelemetryEvent } from "@acme/telemetry";
import { Toast } from "@ui/components/atoms";

import { TelemetryFiltersPanel } from "./TelemetryFiltersPanel";
import { TelemetryHeader } from "./TelemetryHeader";
import { TelemetrySummaryCards } from "./TelemetrySummaryCards";
import type { TelemetrySummaryMetric } from "./TelemetrySummaryCards";
import {
  PRESETS,
  buildChartData,
  buildSummary,
  filterTelemetryEvents,
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
    () => buildChartData(filteredEvents),
    [filteredEvents],
  );

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
      label: "Events",
      value: filteredEvents.length,
      description: "Matching current filters",
    },
    {
      label: "Unique signals",
      value: summaryRows.length,
      description: "Distinct event names",
    },
    {
      label: "First seen",
      value: firstSeen ? new Date(firstSeen).toLocaleString() : "—",
      description: "Earliest event in range",
    },
    {
      label: "Last seen",
      value: lastSeen ? new Date(lastSeen).toLocaleString() : "—",
      description: "Latest event in range",
    },
  ];

  function handlePresetSelect(presetId: string) {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    setFilters((prev) => ({ ...prev, ...preset.apply() }));
    setToast({ open: true, message: `${preset.label} preset applied.` });
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
        presets={PRESETS}
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
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const endpoint =
        process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT ?? "/api/telemetry";
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`Failed to load telemetry (${res.status})`);
      }
      const data = (await res.json()) as TelemetryEvent[];
      setEvents(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError((err as Error).message ?? "Unable to load telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  return (
    <TelemetryAnalyticsView
      events={events}
      isLoading={isLoading}
      error={error}
      onReload={loadEvents}
    />
  );
}
