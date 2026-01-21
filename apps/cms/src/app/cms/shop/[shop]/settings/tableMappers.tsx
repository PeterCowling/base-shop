import type { ReactNode } from "react";

import type { Column } from "@acme/ui/components/cms/DataTable";

import type { ThemeTokenRow } from "./lib/pageSections";

export type { ThemeTokenRow } from "./lib/pageSections";

function isHexColor(value: string): boolean {
  if (!value || value[0] !== '#') return false;
  const hex = value.slice(1);
  if (!(hex.length === 3 || hex.length === 6)) return false;
  for (let i = 0; i < hex.length; i += 1) {
    const c = hex[i]!;
    const ok =
      (c >= '0' && c <= '9') ||
      (c >= 'a' && c <= 'f') ||
      (c >= 'A' && c <= 'F');
    if (!ok) return false;
  }
  return true;
}

function isHslValue(value: string): boolean {
  const parts = value.trim().split(/\s+/);
  if (parts.length !== 3) return false;
  const [h, s, l] = parts;
  const isNum = (v: string) => v.length > 0 && Number.isFinite(Number(v));
  const isPct = (v: string) => v.endsWith("%") && isNum(v.slice(0, -1));
  return isNum(h) && isPct(s) && isPct(l);
}

function isColor(value?: string): value is string {
  if (!value) return false;
  return isHexColor(value) || isHslValue(value);
}

function swatchColor(value: string) {
  return isHslValue(value) ? `hsl(${value})` : value;
}

export function createThemeTokenColumns({
  onReset,
}: {
  onReset?: (row: ThemeTokenRow) => ReactNode;
} = {}): Column<ThemeTokenRow>[] {
  const baseColumns: Column<ThemeTokenRow>[] = [
    {
      header: "Token",
      width: "25%",
      render: (row) => <span className="font-mono">{row.token}</span>,
    },
    {
      header: "Values",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="font-mono">{row.defaultValue ?? "—"}</span>
            {isColor(row.defaultValue) && (
              <span
                aria-hidden
                className="ms-1 inline-block h-4 w-4 rounded border align-middle"
                style={{ backgroundColor: swatchColor(row.defaultValue) }}
              />
            )}
            <span className="text-xs text-muted-foreground">default</span>
          </div>
          {row.hasOverride && (
            <div className="flex items-center gap-1">
              <span className="font-mono">{row.overrideValue ?? "—"}</span>
              {isColor(row.overrideValue) && (
                <span
                  aria-hidden
                  className="ms-1 inline-block h-4 w-4 rounded border align-middle"
                  style={{ backgroundColor: swatchColor(row.overrideValue) }}
                />
              )}
              <span className="text-xs text-muted-foreground">override</span>
            </div>
          )}
        </div>
      ),
    },
  ];

  if (!onReset) return baseColumns;

  return [
    ...baseColumns,
    {
      header: "Actions",
      width: "120px",
      render: (row) => (row.hasOverride ? onReset(row) : null),
    },
  ];
}

export function themeTokenRowClassName(row: ThemeTokenRow) {
  return row.changed ? "bg-warning-soft" : undefined;
}

export interface SchedulerHistoryRow {
  timestamp: number;
  alerts: number;
  runAt: string;
}

export function mapSchedulerHistoryRows(
  history: { timestamp: number; alerts: number }[],
): SchedulerHistoryRow[] {
  return history
    .slice()
    .reverse()
    .map((entry) => ({
      timestamp: entry.timestamp,
      alerts: entry.alerts,
      runAt: new Date(entry.timestamp).toLocaleString(),
    }));
}

export const schedulerHistoryColumns: Column<SchedulerHistoryRow>[] = [
  {
    header: "Time",
    render: (row) => row.runAt,
  },
  {
    header: "Alerts",
    width: "96px",
    render: (row) => row.alerts,
  },
];

export interface LateFeeRow {
  orderId: string;
  amount: number;
  formattedAmount: string;
}

export function mapLateFeeRows(
  charges: { sessionId: string; lateFeeCharged?: number | null }[],
): LateFeeRow[] {
  return charges.map((order) => {
    const amount = order.lateFeeCharged ?? 0;
    return {
      orderId: order.sessionId,
      amount,
      formattedAmount: `$${amount.toFixed(2)}`,
    } satisfies LateFeeRow;
  });
}

export const lateFeeColumns: Column<LateFeeRow>[] = [
  {
    header: "Order",
    render: (row) => row.orderId,
  },
  {
    header: "Amount",
    width: "120px",
    render: (row) => <span className="tabular-nums">{row.formattedAmount}</span>,
  },
];
