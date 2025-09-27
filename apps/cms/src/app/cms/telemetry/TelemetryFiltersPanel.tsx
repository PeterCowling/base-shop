import type { TelemetryEvent } from "@acme/telemetry";
import { LineChart } from "@ui/components/atoms";
import { Loader, Tag } from "@ui/components/atoms";
import { Card, CardContent, Input } from "@/components/atoms/shadcn";
import { cn } from "@ui/utils/style";
import { Grid, Sidebar, Stack } from "@ui/components/atoms/primitives";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  return (
    <section>
      <Sidebar sideWidth="w-80" gap={6} className="lg:flex-row flex-col">
        <Card className="border border-border-1 bg-surface-2 text-foreground">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{t("cms.telemetry.savedFilters")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("cms.telemetry.savedFiltersHelp")}
              </p>
            </div>
            <Stack gap={2}>
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onPresetSelect(preset.id)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm transition", // i18n-exempt: CSS utility classes only
                  activePreset === preset.id
                    ? "border-info bg-info-soft text-foreground" // i18n-exempt: CSS utility classes only
                    : "border-border-2 bg-surface-2 text-muted-foreground hover:border-info hover:bg-info-soft", // i18n-exempt: CSS utility classes only
                )}
                  aria-pressed={activePreset === preset.id}
                >
                  <span className="block font-semibold">{preset.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {preset.description}
                  </span>
                </button>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card className="border border-border-1 bg-surface-2 text-foreground">
          <CardContent className="space-y-5 p-6">
            <Grid cols={1} gap={3} className="md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("cms.telemetry.eventName")}
                <Input
                  value={filters.name}
                  onChange={(event) =>
                    onFiltersChange({ name: event.target.value })
                  }
                  placeholder={String(t("cms.telemetry.searchEvents"))}
                  className="border-border-2 bg-surface-2 text-foreground placeholder:text-muted-foreground"
                />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("cms.telemetry.start")}
                <Input
                  type="datetime-local" // i18n-exempt: HTML input type, not user-facing copy
                  value={filters.start}
                  onChange={(event) =>
                    onFiltersChange({ start: event.target.value })
                  }
                  className="border-border-2 bg-surface-2 text-foreground"
                />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("cms.telemetry.end")}
                <Input
                  type="datetime-local" // i18n-exempt: HTML input type, not user-facing copy
                  value={filters.end}
                  onChange={(event) =>
                    onFiltersChange({ end: event.target.value })
                  }
                  className="border-border-2 bg-surface-2 text-foreground"
                />
              </label>
            </Grid>

            <div className="relative rounded-2xl border border-border-1 bg-surface-2 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold">{t("cms.telemetry.eventTrend")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("cms.telemetry.eventTrendHelp")}
                  </p>
                </div>
                {isLoading && (
                  <Loader
                    aria-label={String(t("cms.telemetry.loadingTelemetry"))}
                    size={20}
                    className="shrink-0 text-info"
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
                <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Tag variant="warning">
                    {t("cms.telemetry.noEventsForFilters")}
                  </Tag>
                  {t("cms.telemetry.tryBroadenWindow")}
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
      </Sidebar>
    </section>
  );
}
