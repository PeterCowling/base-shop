import { Fragment, memo, useCallback, useMemo, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";

import { useTillData } from "../../context/TillDataContext";
import { useTillShiftsRange } from "../../hooks/data/till/useTillShiftsRange";
import { DENOMINATIONS } from "../../types/component/Till";
import type { CashCount } from "../../types/hooks/data/cashCountData";
import { endOfDayIso, formatEnGbDateTimeFromIso, startOfDayIso } from "../../utils/dateUtils";
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

function DenomBreakdownRow({ denomBreakdown }: { denomBreakdown: Record<string, number> | undefined }) {
  if (!denomBreakdown) {
    return <p className="text-sm text-muted-foreground italic">No denomination data recorded.</p>;
  }

  const entries = DENOMINATIONS.map((denom) => ({
    label: denom.label,
    value: denom.value,
    count: denomBreakdown[denom.value.toString()] ?? 0,
  })).filter((e) => e.count > 0);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No denomination data recorded.</p>;
  }

  return (
    <div className="text-xs">
      <p className="font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Denomination Breakdown</p>
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 max-w-md">
        <span className="font-semibold text-muted-foreground">Denomination</span>
        <span className="font-semibold text-muted-foreground text-right">Count</span>
        <span className="font-semibold text-muted-foreground text-right">Total</span>
        {entries.map((e) => (
          <Fragment key={e.label}>
            <span>{e.label}</span>
            <span className="text-right font-mono">{e.count}</span>
            <span className="text-right font-mono">€{(e.count * e.value).toFixed(2)}</span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

const TillShiftHistory = memo(function TillShiftHistory() {
  const [staffFilter, setStaffFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Always-bounded date range: empty inputs default to last 30 days, never undefined
  const startIso = startDate
    ? `${startDate}T00:00:00.000+00:00`
    : startOfDayIso(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const endIso = endDate
    ? `${endDate}T23:59:59.999+00:00`
    : endOfDayIso(new Date());

  const { shifts, loading, error } = useTillShiftsRange({
    orderByChild: "closedAt",
    startAt: startIso,
    endAt: endIso,
  });

  const { cashCounts } = useTillData();

  const filteredShifts = useMemo(
    () =>
      shifts.filter(
        (s) =>
          !staffFilter ||
          [s.openedBy, s.closedBy].some((n) =>
            n?.toLowerCase().includes(staffFilter.toLowerCase())
          )
      ),
    [shifts, staffFilter]
  );

  const toggleExpanded = useCallback((rowId: string) => {
    setExpandedRows((prev) =>
      prev.includes(rowId)
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId]
    );
  }, []);

  const getMostRecentDenomCashCount = useCallback(
    (shiftId: string | undefined): CashCount | undefined => {
      if (!shiftId) return undefined;
      const candidates = cashCounts.filter(
        (cc) =>
          cc.shiftId === shiftId &&
          (cc.type === "close" || cc.type === "reconcile") &&
          cc.denomBreakdown
      );
      return candidates.at(-1);
    },
    [cashCounts]
  );

  return (
    <div className="border-t border-border-strong pt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-5 w-0.5 rounded-full bg-primary-main" aria-hidden="true" />
        <h2 className="text-base font-heading font-semibold text-foreground">Recent Shifts</h2>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div className="flex flex-col">
          <label htmlFor="tillShiftStaffFilter" className="text-xs font-semibold text-muted-foreground mb-1">
            Staff
          </label>
          <input
            id="tillShiftStaffFilter"
            type="text"
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            placeholder="Filter by name…"
            className="border border-border-strong rounded-md px-2 py-1 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="tillShiftStartDate" className="text-xs font-semibold text-muted-foreground mb-1">
            From
          </label>
          <input
            id="tillShiftStartDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-border-strong rounded-md px-2 py-1 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="tillShiftEndDate" className="text-xs font-semibold text-muted-foreground mb-1">
            To
          </label>
          <input
            id="tillShiftEndDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-border-strong rounded-md px-2 py-1 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      {loading && <ReceptionSkeleton rows={5} />}

      {!loading && error && (
        <p className="px-2 py-3 text-sm text-danger-fg">
          Error loading shifts: {String(error)}
        </p>
      )}

      {!loading && !error && filteredShifts.length === 0 && (
        <p className="px-2 py-3 text-sm text-muted-foreground">
          {shifts.length > 0
            ? "No shifts match the current filter."
            : "No shift history in this date range."}
        </p>
      )}

      {!loading && !error && filteredShifts.length > 0 && (
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
              {filteredShifts.map((shift, idx) => {
                const rowKey = shift.id ?? shift.shiftId ?? String(idx);
                const isExpandable =
                  typeof shift.closeDifference === "number" &&
                  shift.closeDifference !== 0;
                const isExpanded = expandedRows.includes(rowKey);
                const denomCashCount = isExpandable
                  ? getMostRecentDenomCashCount(shift.shiftId)
                  : undefined;
                const rowBg = idx % 2 === 0 ? "bg-surface" : "bg-surface-2";
                return (
                  <Fragment key={rowKey}>
                    <TableRow className={rowBg}>
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
                        {isExpandable ? (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(rowKey)}
                            aria-expanded={isExpanded}
                            aria-label={`${isExpanded ? "Collapse" : "Expand"} denomination breakdown for shift ${shift.shiftId}`}
                            className="flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-lg"
                          >
                            <VarianceCell value={shift.closeDifference} />
                            <span className="text-xs text-muted-foreground ml-1" aria-hidden="true">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </button>
                        ) : (
                          <VarianceCell value={shift.closeDifference} />
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className={rowBg}>
                        <TableCell
                          colSpan={9}
                          className="px-4 py-3 border-b border-border-muted bg-surface-2"
                        >
                          <DenomBreakdownRow denomBreakdown={denomCashCount?.denomBreakdown} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
});

export default TillShiftHistory;
