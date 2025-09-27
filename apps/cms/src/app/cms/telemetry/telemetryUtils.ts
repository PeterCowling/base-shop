import type { TelemetryEvent } from "@acme/telemetry";

export interface TelemetryFilters {
  name: string;
  start: string;
  end: string;
}

export interface TelemetrySummaryRow {
  name: string;
  count: number;
  lastSeen: number;
}

export interface SavedPreset {
  id: string;
  label: string;
  description: string;
  apply: () => Partial<TelemetryFilters>;
}

export interface TelemetryChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
  }>;
}

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Build presets with translated labels/descriptions using provided translator.
export function getPresets(t: (key: string) => unknown): SavedPreset[] {
  return [
    {
      id: "all",
      label: String(t("cms.telemetry.presets.all.label")),
      description: String(t("cms.telemetry.presets.all.description")),
      apply: () => ({ name: "", start: "", end: "" }),
    },
    {
      id: "last-hour",
      label: String(t("cms.telemetry.presets.lastHour.label")),
      description: String(t("cms.telemetry.presets.lastHour.description")),
      apply: () => {
        const end = new Date();
        const start = new Date(end.getTime() - 60 * 60 * 1000);
        return { start: toDateInput(start), end: toDateInput(end) };
      },
    },
    {
      id: "day",
      label: String(t("cms.telemetry.presets.day.label")),
      description: String(t("cms.telemetry.presets.day.description")),
      apply: () => {
        const end = new Date();
        const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        return { start: toDateInput(start), end: toDateInput(end) };
      },
    },
    {
      id: "checkout",
      label: String(t("cms.telemetry.presets.checkout.label")),
      description: String(t("cms.telemetry.presets.checkout.description")),
      apply: () => ({ name: "checkout" }),
    },
  ];
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

export function buildSummary(events: TelemetryEvent[]): TelemetrySummaryRow[] {
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

export function buildChartData(
  events: TelemetryEvent[],
  t: (key: string) => unknown,
): TelemetryChartData {
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
        label: String(t("cms.telemetry.events")),
        data: labels.map((label) => buckets.get(label) ?? 0),
        borderColor: "hsl(var(--color-info))",
        backgroundColor: "hsl(var(--color-info) / 0.2)",
        tension: 0.35,
        fill: true,
      },
    ],
  };
}
