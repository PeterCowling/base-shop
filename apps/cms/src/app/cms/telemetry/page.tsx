"use client";

import { useEffect, useMemo, useState } from "react";
import type { TelemetryEvent } from "@acme/telemetry";
import { LineChart, Loader, Tag, Toast } from "@acme/ui";
import {
  Button,
  Card,
  CardContent,
  Input,
} from "@/components/atoms/shadcn";
import { cn } from "@ui/utils/style";

interface TelemetryFilters {
  name: string;
  start: string;
  end: string;
}

interface TelemetrySummaryRow {
  name: string;
  count: number;
  lastSeen: number;
}

interface TelemetryAnalyticsViewProps {
  events: TelemetryEvent[];
  isLoading: boolean;
  error?: string | null;
  onReload?: () => void | Promise<void>;
}

interface SavedPreset {
  id: string;
  label: string;
  description: string;
  apply: () => Partial<TelemetryFilters>;
}

const PRESETS: SavedPreset[] = [
  {
    id: "all",
    label: "All events",
    description: "Show every recorded signal",
    apply: () => ({ name: "", start: "", end: "" }),
  },
  {
    id: "last-hour",
    label: "Last hour",
    description: "Focus on the freshest spikes",
    apply: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 60 * 60 * 1000);
      return { start: toDateInput(start), end: toDateInput(end) };
    },
  },
  {
    id: "day",
    label: "24 hours",
    description: "Track day-long health",
    apply: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      return { start: toDateInput(start), end: toDateInput(end) };
    },
  },
  {
    id: "checkout",
    label: "Checkout",
    description: "Only checkout related events",
    apply: () => ({ name: "checkout" }),
  },
];

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function filterTelemetryEvents(
  events: TelemetryEvent[],
  { name, start, end }: TelemetryFilters,
): TelemetryEvent[] {
  const startTs = start ? new Date(start).getTime() : 0;
  const endTs = end ? new Date(end).getTime() : Number.MAX_SAFE_INTEGER;
  const normalizedName = name.trim().toLowerCase();
  return events.filter((event) => {
    const matchesName = normalizedName
      ? event.name.toLowerCase().includes(normalizedName)
      : true;
    return matchesName && event.ts >= startTs && event.ts <= endTs;
  });
}

function buildSummary(events: TelemetryEvent[]): TelemetrySummaryRow[] {
  const map = new Map<string, TelemetrySummaryRow>();
  for (const event of events) {
    const existing = map.get(event.name);
    if (existing) {
      existing.count += 1;
      existing.lastSeen = Math.max(existing.lastSeen, event.ts);
    } else {
      map.set(event.name, { name: event.name, count: 1, lastSeen: event.ts });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function buildChartData(events: TelemetryEvent[]) {
  const buckets = new Map<string, number>();
  for (const event of events) {
    const date = new Date(event.ts);
    const key = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date
      .getDate()
      .toString()
      .padStart(2, "0")}`} ${`${date.getHours()}`.padStart(2, "0")}:00`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const labels = Array.from(buckets.keys()).sort();
  return {
    labels,
    datasets: [
      {
        label: "Events",
        data: labels.map((label) => buckets.get(label) ?? 0),
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.2)",
        tension: 0.35,
        fill: true,
      },
    ],
  };
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
  const [toast, setToast] = useState<{ open: boolean; message: string }>(
    { open: false, message: "" },
  );

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
  const chartData = useMemo(() => buildChartData(filteredEvents), [filteredEvents]);

  const firstSeen = filteredEvents.reduce<number | null>((acc, event) => {
    if (!acc) return event.ts;
    return Math.min(acc, event.ts);
  }, null);
  const lastSeen = filteredEvents.reduce<number | null>((acc, event) => {
    if (!acc) return event.ts;
    return Math.max(acc, event.ts);
  }, null);

  const heroMetrics = [
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

  function applyPreset(presetId: string) {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    setFilters((prev) => ({ ...prev, ...preset.apply() }));
    setToast({ open: true, message: `${preset.label} preset applied.` });
  }

  function updateFilters(partial: Partial<TelemetryFilters>) {
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
      <header className="space-y-3">
        <Tag variant="default" className="bg-sky-500/10 text-sky-300">
          Telemetry analytics
        </Tag>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-white">Live product signals</h2>
            <p className="text-sm text-white/70">
              Track your key interactions in real time, compare spikes, and
              lock filters you love as presets.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
            onClick={() => onReload?.()}
          >
            Refresh data
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {heroMetrics.map((metric) => (
          <Card
            key={metric.label}
            className="border border-white/10 bg-slate-900/70 text-white"
          >
            <CardContent className="space-y-1 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-white/60">
                {metric.label}
              </p>
              <p className="text-2xl font-semibold">{metric.value}</p>
              <p className="text-xs text-white/60">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <Card className="border border-white/10 bg-slate-900/60 text-white">
          <CardContent className="space-y-5 px-5 py-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Saved filters</h3>
              <p className="text-sm text-white/70">
                Quickly pivot between moments that matter to your team.
              </p>
            </div>
            <div className="grid gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-sm transition",
                    activePreset === preset.id
                      ? "border-sky-400 bg-sky-500/20 text-white"
                      : "border-white/20 bg-white/5 text-white/80 hover:border-sky-300 hover:bg-sky-500/10"
                  )}
                  aria-pressed={activePreset === preset.id}
                >
                  <span className="block font-semibold">{preset.label}</span>
                  <span className="block text-xs text-white/60">
                    {preset.description}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-slate-900/60 text-white">
          <CardContent className="space-y-5 px-5 py-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-white/60">
                Event name
                <Input
                  value={filters.name}
                  onChange={(event) => updateFilters({ name: event.target.value })}
                  placeholder="Search events"
                  className="border-white/20 bg-white/5 text-white placeholder:text-white/50"
                />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-white/60">
                Start
                <Input
                  type="datetime-local"
                  value={filters.start}
                  onChange={(event) => updateFilters({ start: event.target.value })}
                  className="border-white/20 bg-white/5 text-white"
                />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-white/60">
                End
                <Input
                  type="datetime-local"
                  value={filters.end}
                  onChange={(event) => updateFilters({ end: event.target.value })}
                  className="border-white/20 bg-white/5 text-white"
                />
              </label>
            </div>

            <div className="relative rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Event trend</h3>
                  <p className="text-xs text-white/60">
                    Visualise when filtered events are landing.
                  </p>
                </div>
                {isLoading && (
                  <Loader
                    aria-label="Loading telemetry"
                    size={20}
                    className="text-sky-300"
                  />
                )}
              </div>
              {filteredEvents.length > 0 ? (
                <div className="h-64">
                  <LineChart
                    data={chartData}
                    className="h-full w-full"
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 } },
                      },
                      plugins: { legend: { display: false } },
                    }}
                  />
                </div>
              ) : (
                <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-white/60">
                  <Tag variant="warning" className="bg-amber-500/20 text-amber-100">
                    No events match the current filters
                  </Tag>
                  Try broadening your search window.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Event breakdown</h3>
                <Tag variant="default" className="bg-white/10 text-white/70">
                  {summaryRows.length} tracked types
                </Tag>
              </div>
              <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                data-testid="telemetry-announce"
                data-cy="telemetry-announce"
                className="sr-only"
              >
                Showing {filteredEvents.length} of {events.length} events
              </div>
              <div className="overflow-x-auto">
                <table
                  className="w-full min-w-[320px] border-separate border-spacing-0 text-left text-sm"
                  aria-label="Event type breakdown"
                >
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-white/50">
                      <th className="border-b border-white/10 px-3 py-2">Event</th>
                      <th className="border-b border-white/10 px-3 py-2">Count</th>
                      <th className="border-b border-white/10 px-3 py-2">Last seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((row) => (
                      <tr key={row.name} className="odd:bg-white/5 even:bg-white/0">
                        <td className="px-3 py-2 font-medium text-white">{row.name}</td>
                        <td className="px-3 py-2 text-white/80">{row.count}</td>
                        <td className="px-3 py-2 text-white/60">
                          {new Date(row.lastSeen).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {summaryRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-3 py-6 text-center text-sm text-white/60"
                        >
                          <Tag variant="warning" className="bg-amber-500/20 text-amber-100">
                            Filters active
                          </Tag>{" "}
                          Adjust the criteria to see event types.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
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

