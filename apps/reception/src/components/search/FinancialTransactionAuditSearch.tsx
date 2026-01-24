import React, { useCallback, useMemo, useState } from "react";

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
    <div className="flex flex-col gap-1 text-xs text-gray-700 dark:text-darkAccentGreen">
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
      <h2 className="text-xl font-semibold mb-4 dark:text-darkAccentGreen">
        Search Audit Logs
      </h2>
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div className="flex flex-col">
          <label htmlFor="createdBy" className="font-semibold text-gray-700 dark:text-darkAccentGreen">
            Corrected By:
          </label>
          <input
            id="createdBy"
            type="text"
            value={filters.createdBy}
            onChange={(e) => handleChange("createdBy", e.target.value)}
            className="border border-gray-400 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="bookingRef" className="font-semibold text-gray-700 dark:text-darkAccentGreen">
            Booking Ref:
          </label>
          <input
            id="bookingRef"
            type="text"
            value={filters.bookingRef}
            onChange={(e) => handleChange("bookingRef", e.target.value)}
            className="border border-gray-400 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="shiftId" className="font-semibold text-gray-700 dark:text-darkAccentGreen">
            Shift ID:
          </label>
          <input
            id="shiftId"
            type="text"
            value={filters.shiftId}
            onChange={(e) => handleChange("shiftId", e.target.value)}
            className="border border-gray-400 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="sourceTxnId" className="font-semibold text-gray-700 dark:text-darkAccentGreen">
            Source Txn ID:
          </label>
          <input
            id="sourceTxnId"
            type="text"
            value={filters.sourceTxnId}
            onChange={(e) => handleChange("sourceTxnId", e.target.value)}
            className="border border-gray-400 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="reason" className="font-semibold text-gray-700 dark:text-darkAccentGreen">
            Reason:
          </label>
          <input
            id="reason"
            type="text"
            value={filters.reason}
            onChange={(e) => handleChange("reason", e.target.value)}
            className="border border-gray-400 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
          />
        </div>

        <button
          onClick={handleSearch}
          className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors dark:bg-darkSurface dark:text-darkAccentGreen"
        >
          Search
        </button>
      </div>

      {errorMessage && (
        <div className="text-red-600 font-medium">Error: {errorMessage}</div>
      )}
      {loading && <div className="text-gray-600 dark:text-darkAccentGreen">Loading data ...</div>}

      {searchTriggered && !loading && filteredAudits.length === 0 && (
        <div className="bg-white border border-gray-400 rounded p-4 text-center italic text-gray-600 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen">
          No matching results.
        </div>
      )}

      {filteredAudits.length > 0 && (
        <div className="overflow-x-auto w-full bg-white border border-gray-400 rounded shadow dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen">
          <table className="table-fixed w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0 dark:bg-darkSurface">
              <tr>
                <th className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Timestamp
                </th>
                <th className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Source Txn
                </th>
                <th className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Booking
                </th>
                <th className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Shift
                </th>
                <th className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Corrected By
                </th>
                <th className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Reason
                </th>
                <th className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAudits.map(([id, audit], index) => {
                const rowBg =
                  index % 2 === 0
                    ? "bg-white dark:bg-darkSurface"
                    : "bg-gray-50 dark:bg-darkSurface";
                const isExpanded = expandedRows.includes(id);
                return (
                  <React.Fragment key={id}>
                    <tr className={rowBg}>
                      <td className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                        {audit.createdAt}
                      </td>
                      <td className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                        {audit.sourceTxnId}
                      </td>
                      <td className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                        {audit.before.bookingRef}
                      </td>
                      <td className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                        {audit.shiftId ?? "-"}
                      </td>
                      <td className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                        {audit.createdBy}
                      </td>
                      <td className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                        {audit.reason}
                      </td>
                      <td className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(id)}
                          className="text-blue-600 hover:underline dark:text-darkAccentGreen"
                        >
                          {isExpanded ? "Hide" : "Show"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className={rowBg}>
                        <td
                          className="border-b border-gray-400 py-3 px-3 dark:border-darkSurface dark:text-darkAccentGreen"
                          colSpan={7}
                        >
                          <div className="grid gap-4 md:grid-cols-2">
                            <AuditRowDetails label="Before" txn={audit.before} />
                            <AuditRowDetails label="After" txn={audit.after} />
                          </div>
                          <div className="mt-3 text-xs text-gray-500 dark:text-darkAccentGreen">
                            Correction Txns: {audit.correctionTxnIds.join(", ") || "-"}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default React.memo(FinancialTransactionAuditSearch);
