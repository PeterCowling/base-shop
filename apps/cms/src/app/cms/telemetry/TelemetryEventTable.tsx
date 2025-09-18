import { Tag } from "@acme/ui";

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
        Showing {filteredCount} of {totalCount} events
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
  );
}
