import React, { useCallback, useMemo, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import useFinancialTransactionAuditsData from "../../hooks/data/useFinancialTransactionAuditsData";

function formatAmount(value: number) {
  const prefix = value < 0 ? "-" : "";
  const amount = Math.abs(value).toFixed(2);
  return `${prefix}€${amount}`;
}

function AuditRowDetails({
  label,
  txn,
}: {
  label: string;
  txn: {
    amount: number;
    method: string;
    itemCategory: string;
    description: string;
    type: string;
    bookingRef: string;
    shiftId?: string;
  };
}) {
  return (
    <div className="flex flex-col gap-1 text-xs text-foreground">
      <div className="font-semibold">{label}</div>
      <div>Amount: {formatAmount(txn.amount)}</div>
      <div>Method: {txn.method}</div>
      <div>Category: {txn.itemCategory}</div>
      <div>Type: {txn.type}</div>
      <div>Booking: {txn.bookingRef}</div>
      <div>Shift: {txn.shiftId ?? "-"}</div>
      <div>Description: {txn.description}</div>
    </div>
  );
}

function FinancialTransactionAuditSearch(): JSX.Element {
  const [filters, setFilters] = useState({
    createdBy: "",
    bookingRef: "",
    shiftId: "",
    reason: "",
    sourceTxnId: "",
  });

  const [searchTriggered, setSearchTriggered] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const { filteredAudits, loading, error } = useFinancialTransactionAuditsData(
    searchTriggered
      ? {
          createdBy: filters.createdBy,
          bookingRef: filters.bookingRef,
          shiftId: filters.shiftId,
          reason: filters.reason,
          sourceTxnId: filters.sourceTxnId,
        }
      : { skip: true }
  );

  const handleChange = useCallback((field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSearch = useCallback(() => {
    setSearchTriggered(true);
  }, []);

  const toggleExpanded = useCallback((rowId: string) => {
    setExpandedRows((prev) =>
      prev.includes(rowId)
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId]
    );
  }, []);

  const errorMessage = useMemo(() => {
    if (!error) return null;
    return error instanceof Error ? error.message : String(error);
  }, [error]);

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">
        Search Audit Logs
      </h2>
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div className="flex flex-col">
          <label htmlFor="createdBy" className="font-semibold text-foreground">
            Corrected By:
          </label>
          <input
            id="createdBy"
            type="text"
            value={filters.createdBy}
            onChange={(e) => handleChange("createdBy", e.target.value)}
            className="border border-border-2 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-ring"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="bookingRef" className="font-semibold text-foreground">
            Booking Ref:
          </label>
          <input
            id="bookingRef"
            type="text"
            value={filters.bookingRef}
            onChange={(e) => handleChange("bookingRef", e.target.value)}
            className="border border-border-2 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-ring"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="shiftId" className="font-semibold text-foreground">
            Shift ID:
          </label>
          <input
            id="shiftId"
            type="text"
            value={filters.shiftId}
            onChange={(e) => handleChange("shiftId", e.target.value)}
            className="border border-border-2 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-ring"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="sourceTxnId" className="font-semibold text-foreground">
            Source Txn ID:
          </label>
          <input
            id="sourceTxnId"
            type="text"
            value={filters.sourceTxnId}
            onChange={(e) => handleChange("sourceTxnId", e.target.value)}
            className="border border-border-2 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-ring"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="reason" className="font-semibold text-foreground">
            Reason:
          </label>
          <input
            id="reason"
            type="text"
            value={filters.reason}
            onChange={(e) => handleChange("reason", e.target.value)}
            className="border border-border-2 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-ring"
          />
        </div>

        <Button
          onClick={handleSearch}
          className="px-4 py-1 bg-primary-main text-primary-fg rounded hover:bg-primary-dark transition-colors"
        >
          Search
        </Button>
      </div>

      {errorMessage && (
        <div className="text-error-main font-medium">Error: {errorMessage}</div>
      )}
      {loading && <div className="text-muted-foreground">Loading data ...</div>}

      {searchTriggered && !loading && filteredAudits.length === 0 && (
        <div className="bg-surface border border-border-2 rounded p-4 text-center italic text-muted-foreground">
          No matching results.
        </div>
      )}

      {filteredAudits.length > 0 && (
        <div className="overflow-x-auto w-full bg-surface border border-border-2 rounded shadow">
          <Table className="table-fixed w-full border-collapse">
            <TableHeader className="bg-surface-2 sticky top-0">
              <TableRow>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Timestamp
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Source Txn
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Booking
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Shift
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Corrected By
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Reason
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Details
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAudits.map(([id, audit], index) => {
                const rowBg =
                  index % 2 === 0
                    ? "bg-surface"
                    : "bg-surface-2";
                const isExpanded = expandedRows.includes(id);
                return (
                  <React.Fragment key={id}>
                    <TableRow className={rowBg}>
                      <TableCell className="border-b border-border-2 py-2 px-3">
                        {audit.createdAt}
                      </TableCell>
                      <TableCell className="border-b border-border-2 py-2 px-3">
                        {audit.sourceTxnId}
                      </TableCell>
                      <TableCell className="border-b border-border-2 py-2 px-3">
                        {audit.before.bookingRef}
                      </TableCell>
                      <TableCell className="border-b border-border-2 py-2 px-3">
                        {audit.shiftId ?? "-"}
                      </TableCell>
                      <TableCell className="border-b border-border-2 py-2 px-3">
                        {audit.createdBy}
                      </TableCell>
                      <TableCell className="border-b border-border-2 py-2 px-3">
                        {audit.reason}
                      </TableCell>
                      <TableCell className="border-b border-border-2 py-2 px-3">
                        <Button
                          type="button"
                          onClick={() => toggleExpanded(id)}
                          className="text-info-main hover:underline"
                        >
                          {isExpanded ? "Hide" : "Show"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className={rowBg}>
                        <TableCell
                          className="border-b border-border-2 py-3 px-3"
                          colSpan={7}
                        >
                          <div className="grid gap-4 md:grid-cols-2">
                            <AuditRowDetails label="Before" txn={audit.before} />
                            <AuditRowDetails label="After" txn={audit.after} />
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">
                            Correction Txns: {audit.correctionTxnIds.join(", ") || "-"}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

export default React.memo(FinancialTransactionAuditSearch);
