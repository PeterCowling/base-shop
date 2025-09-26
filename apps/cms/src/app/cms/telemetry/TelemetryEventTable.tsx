import { Tag } from "@ui/components/atoms";

import type { TelemetrySummaryRow } from "./telemetryUtils";

interface TelemetryEventTableProps {
  summaryRows: TelemetrySummaryRow[];
  filteredCount: number;
  totalCount: number;
}

export function TelemetryEventTable({
  summaryRows,
  filteredCount,
  totalCount,
}: TelemetryEventTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 text-base font-semibold">Event breakdown</h3>
        <Tag className="shrink-0" variant="default">
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
        Showing {filteredCount} of {totalCount} events
      </div>
      <div className="overflow-x-auto">
        <table
          className="w-full min-w-[320px] border-separate border-spacing-0 text-start text-sm"
          aria-label="Event type breakdown"
        >
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className="border-b border-border/10 px-3 py-2">Event</th>
              <th className="border-b border-border/10 px-3 py-2">Count</th>
              <th className="border-b border-border/10 px-3 py-2">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows.map((row) => (
              <tr key={row.name} className="odd:bg-surface-2 even:bg-surface-1">
                <td className="px-3 py-2 font-medium text-foreground">{row.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{row.count}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {new Date(row.lastSeen).toLocaleString()}
                </td>
              </tr>
            ))}
            {summaryRows.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  <Tag variant="warning">
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
  );
}
