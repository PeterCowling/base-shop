import { memo } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";

import { useTillShiftsData } from "../../hooks/data/till/useTillShiftsData";
import { formatEnGbDateTimeFromIso } from "../../utils/dateUtils";
import ReceptionSkeleton from "../common/ReceptionSkeleton";

const formatMoney = (value?: number) =>
  typeof value === "number" ? `€${value.toFixed(2)}` : "-";

const formatValue = (value?: string) => value ?? "-";

function StatusBadge({ status }: { status?: string }) {
  const isOpen = status?.toLowerCase() === "open";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
        isOpen
          ? "bg-primary-soft text-primary-main"
          : "bg-surface-3 text-muted-foreground"
      }`}
    >
      {status ?? "-"}
    </span>
  );
}

function VarianceCell({ value }: { value?: number }) {
  if (typeof value !== "number") return <span className="text-muted-foreground">-</span>;
  const isPositive = value >= 0;
  const formatted = `${isPositive ? "+" : ""}${formatMoney(value)}`;
  return (
    <span className={`font-mono text-sm font-semibold ${isPositive ? "text-primary-main" : "text-danger-fg"}`}>
      {formatted}
    </span>
  );
}

const TillShiftHistory = memo(function TillShiftHistory() {
  const { shifts, loading, error } = useTillShiftsData({ limitToLast: 10 });

  return (
    <div className="border-t border-border-strong pt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-5 w-0.5 rounded-full bg-primary-main" aria-hidden="true" />
        <h2 className="text-base font-heading font-semibold text-foreground">Recent Shifts</h2>
      </div>

      {loading && <ReceptionSkeleton rows={5} />}

      {!loading && error && (
        <p className="px-2 py-3 text-sm text-danger-fg">
          Error loading shifts: {String(error)}
        </p>
      )}

      {!loading && !error && shifts.length === 0 && (
        <p className="px-2 py-3 text-sm text-muted-foreground">No shift history yet.</p>
      )}

      {!loading && !error && shifts.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border-strong">
          <Table className="w-full border-collapse text-sm">
            <TableHeader>
              <TableRow className="bg-surface-2">
                <TableHead className="px-3 py-2 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border-strong">Shift ID</TableHead>
                <TableHead className="px-3 py-2 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border-strong">Status</TableHead>
                <TableHead className="px-3 py-2 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border-strong">Opened</TableHead>
                <TableHead className="px-3 py-2 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border-strong">By</TableHead>
                <TableHead className="px-3 py-2 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border-strong">Open Cash</TableHead>
                <TableHead className="px-3 py-2 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border-strong">Closed</TableHead>
                <TableHead className="px-3 py-2 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border-strong">By</TableHead>
                <TableHead className="px-3 py-2 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border-strong">Close Cash</TableHead>
                <TableHead className="px-3 py-2 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border-strong">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift, idx) => (
                <TableRow
                  key={shift.id ?? shift.shiftId}
                  className={idx % 2 === 0 ? "bg-surface" : "bg-surface-2"}
                >
                  <TableCell className="px-3 py-2 border-b border-border-muted font-mono text-xs text-muted-foreground">
                    {shift.shiftId}
                  </TableCell>
                  <TableCell className="px-3 py-2 border-b border-border-muted">
                    <StatusBadge status={shift.status} />
                  </TableCell>
                  <TableCell className="px-3 py-2 border-b border-border-muted text-xs">
                    {formatEnGbDateTimeFromIso(shift.openedAt)}
                  </TableCell>
                  <TableCell className="px-3 py-2 border-b border-border-muted text-xs">
                    {shift.openedBy}
                  </TableCell>
                  <TableCell className="px-3 py-2 border-b border-border-muted font-mono text-xs">
                    {formatMoney(shift.openingCash)}
                  </TableCell>
                  <TableCell className="px-3 py-2 border-b border-border-muted text-xs">
                    {shift.closedAt ? formatEnGbDateTimeFromIso(shift.closedAt) : "-"}
                  </TableCell>
                  <TableCell className="px-3 py-2 border-b border-border-muted text-xs">
                    {formatValue(shift.closedBy)}
                  </TableCell>
                  <TableCell className="px-3 py-2 border-b border-border-muted font-mono text-xs">
                    {formatMoney(shift.closingCash)}
                  </TableCell>
                  <TableCell className="px-3 py-2 border-b border-border-muted">
                    <VarianceCell value={shift.closeDifference} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
});

export default TillShiftHistory;
