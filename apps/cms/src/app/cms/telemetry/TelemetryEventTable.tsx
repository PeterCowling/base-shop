import { useTranslations } from "@acme/i18n";
import { Tag } from "@acme/ui/components/atoms";

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
  const t = useTranslations();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 text-base font-semibold">
          {t("cms.telemetry.eventBreakdown")}
        </h3>
        <Tag className="shrink-0" variant="default">
          {t("cms.telemetry.trackedTypes", { count: summaryRows.length })}
        </Tag>
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="telemetry-announce" // i18n-exempt: test identifier, not user-facing
        data-cy="telemetry-announce" // i18n-exempt: test identifier, not user-facing
        className="sr-only"
      >
        {t("cms.telemetry.showingEvents", {
          filteredCount,
          totalCount,
        })}
      </div>
      <div className="overflow-x-auto">
        <table
          className="w-full min-w-80 border-separate border-spacing-0 text-start text-sm"
          aria-label={String(t("cms.telemetry.eventTypeBreakdown"))}
        >
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className="border-b border-border/10 px-3 py-2">{t("cms.telemetry.event")}</th>
              <th className="border-b border-border/10 px-3 py-2">{t("cms.telemetry.count")}</th>
              <th className="border-b border-border/10 px-3 py-2">{t("cms.telemetry.lastSeen")}</th>
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
                  <Tag variant="warning">{t("cms.telemetry.filtersActive")}</Tag>{" "}
                  {t("cms.telemetry.adjustCriteria")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
