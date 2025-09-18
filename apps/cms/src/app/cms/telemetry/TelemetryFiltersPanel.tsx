import type { TelemetryEvent } from "@acme/telemetry";
import { LineChart, Loader, Tag } from "@acme/ui";
import { Card, CardContent, Input } from "@/components/atoms/shadcn";
import { cn } from "@ui/utils/style";

import { TelemetryEventTable } from "./TelemetryEventTable";
import type {
  SavedPreset,
  TelemetryChartData,
  TelemetryFilters,
  TelemetrySummaryRow,
} from "./telemetryUtils";

interface TelemetryFiltersPanelProps {
  presets: SavedPreset[];
  activePreset: string;
  onPresetSelect: (presetId: string) => void;
  filters: TelemetryFilters;
  onFiltersChange: (partial: Partial<TelemetryFilters>) => void;
  filteredEvents: TelemetryEvent[];
  chartData: TelemetryChartData;
  isLoading: boolean;
  summaryRows: TelemetrySummaryRow[];
  totalEvents: number;
}

export function TelemetryFiltersPanel({
  presets,
  activePreset,
  onPresetSelect,
  filters,
  onFiltersChange,
  filteredEvents,
  chartData,
  isLoading,
  summaryRows,
  totalEvents,
}: TelemetryFiltersPanelProps) {
  return (
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
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onPresetSelect(preset.id)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm transition",
                  activePreset === preset.id
                    ? "border-sky-400 bg-sky-500/20 text-white"
                    : "border-white/20 bg-white/5 text-white/80 hover:border-sky-300 hover:bg-sky-500/10",
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
                onChange={(event) =>
                  onFiltersChange({ name: event.target.value })
                }
                placeholder="Search events"
                className="border-white/20 bg-white/5 text-white placeholder:text-white/50"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-white/60">
              Start
              <Input
                type="datetime-local"
                value={filters.start}
                onChange={(event) =>
                  onFiltersChange({ start: event.target.value })
                }
                className="border-white/20 bg-white/5 text-white"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-white/60">
              End
              <Input
                type="datetime-local"
                value={filters.end}
                onChange={(event) =>
                  onFiltersChange({ end: event.target.value })
                }
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

          <TelemetryEventTable
            summaryRows={summaryRows}
            filteredCount={filteredEvents.length}
            totalCount={totalEvents}
          />
        </CardContent>
      </Card>
    </section>
  );
}
