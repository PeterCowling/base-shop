import {
  fetchMonthlyRequestTotals,
  resolveZoneTag,
} from "./cloudflare-analytics-client";

export type MonthlyProxyExportParams = {
  token: string;
  zoneTag?: string;
  zoneName?: string;
  hostname?: string;
  months: number;
  includeCurrentMonth: boolean;
};

export type MonthlyProxyExportResult = {
  csv: string;
  notes: string;
  rowCount: number;
  resolvedZoneTag: string;
  firstMonth: string;
  lastMonth: string;
};

type MonthWindow = {
  month: string;
  startIso: string;
  endIso: string;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function monthStartUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0),
  );
}

function addUtcMonths(date: Date, months: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 0, 0, 0),
  );
}

function formatMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

function toIso(date: Date): string {
  return date.toISOString().replace(".000Z", "Z");
}

function buildMonthWindows(
  months: number,
  includeCurrentMonth: boolean,
): MonthWindow[] {
  const now = new Date();
  const currentMonthStart = monthStartUtc(now);
  const endExclusive = includeCurrentMonth
    ? addUtcMonths(currentMonthStart, 1)
    : currentMonthStart;
  const startInclusive = addUtcMonths(endExclusive, -months);

  const windows: MonthWindow[] = [];
  for (
    let cursor = startInclusive;
    cursor < endExclusive;
    cursor = addUtcMonths(cursor, 1)
  ) {
    const next = addUtcMonths(cursor, 1);
    windows.push({
      month: formatMonth(cursor),
      startIso: toIso(cursor),
      endIso: toIso(next),
    });
  }
  return windows;
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatNumeric(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "unavailable";
  return String(Math.round(value));
}

function monthEndInclusiveIso(monthWindow: MonthWindow): string {
  const endExclusive = new Date(monthWindow.endIso);
  const inclusive = new Date(endExclusive.getTime() - 24 * 60 * 60 * 1000);
  return inclusive.toISOString().slice(0, 10);
}

export async function buildCloudflareMonthlyProxyExport(
  params: MonthlyProxyExportParams,
): Promise<MonthlyProxyExportResult> {
  const resolvedZoneTag = await resolveZoneTag(
    params.token,
    params.zoneTag,
    params.zoneName,
  );
  const windows = buildMonthWindows(params.months, params.includeCurrentMonth);
  const lines = [
    "month,visits_or_requests,top_pages_summary,top_geo_summary,device_summary,notes",
  ];

  for (const window of windows) {
    const startDate = window.startIso.slice(0, 10);
    const endDate = monthEndInclusiveIso(window);
    const totals = await fetchMonthlyRequestTotals({
      token: params.token,
      zoneTag: resolvedZoneTag,
      monthStart: startDate,
      monthEndInclusive: endDate,
    });

    const topUnavailableReason =
      "unavailable (GraphQL access limits for historical per-dimension breakdown)";
    const notes = [
      totals.note,
      params.hostname
        ? `host-filter-not-applied(${params.hostname})`
        : "host-filter=none",
      "top-breakdowns=unavailable",
    ].join("; ");

    lines.push(
      [
        window.month,
        formatNumeric(totals.requests),
        csvEscape(topUnavailableReason),
        csvEscape(topUnavailableReason),
        csvEscape(topUnavailableReason),
        csvEscape(notes),
      ].join(","),
    );
  }

  const firstMonth = windows[0]?.month ?? "n/a";
  const lastMonth = windows[windows.length - 1]?.month ?? "n/a";
  const notes = [
    "# Cloudflare monthly proxies extraction",
    "",
    `- generated-at: ${new Date().toISOString()}`,
    `- zone-tag: ${resolvedZoneTag}`,
    `- zone-name: ${params.zoneName ?? "n/a"}`,
    `- host-filter-requested: ${params.hostname ?? "none"}`,
    `- months: ${params.months}`,
    `- include-current-month: ${params.includeCurrentMonth}`,
    `- first-month: ${firstMonth}`,
    `- last-month: ${lastMonth}`,
    "- endpoint: https://api.cloudflare.com/client/v4/graphql",
    "- monthly totals use httpRequests1dGroups(sum.requests).",
    "- top page/geo/device breakdowns are marked unavailable where plan/API access does not allow historical extraction.",
  ].join("\n");

  return {
    csv: `${lines.join("\n")}\n`,
    notes: `${notes}\n`,
    rowCount: lines.length - 1,
    resolvedZoneTag,
    firstMonth,
    lastMonth,
  };
}
