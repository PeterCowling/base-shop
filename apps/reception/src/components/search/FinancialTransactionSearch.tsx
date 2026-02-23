import React, { useCallback, useMemo, useState } from "react";

import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";

import useAllFinancialTransactionsData from "../../hooks/data/useAllFinancialTransactionsData";

function FinancialTransactionSearch(): JSX.Element {
  const [filters, setFilters] = useState({
    amount: "",
    itemCategory: "",
    userName: "",
    bookingRef: "",
    shiftId: "",
    reason: "",
    sourceTxnId: "",
  });

  const [searchTriggered, setSearchTriggered] = useState(false);

  const { filteredTransactions, loading, error } =
    useAllFinancialTransactionsData(
      searchTriggered
        ? {
            amount: filters.amount,
            itemCategory: filters.itemCategory,
            userName: filters.userName,
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

  const errorMessage = useMemo(() => {
    if (!error) return null;
    return error instanceof Error ? error.message : String(error);
  }, [error]);

  return (
    <>
      <h2 className="text-xl font-semibold mb-4 dark:text-darkAccentGreen">Search Transactions</h2>
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div className="flex flex-col">
          <label htmlFor="amount" className="font-semibold text-gray-700 dark:text-darkAccentGreen">
            Amount:
          </label>
          <input
            id="amount"
            type="number"
            value={filters.amount}
            onChange={(e) => handleChange("amount", e.target.value)}
            className="border border-gray-400 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="itemCategory" className="font-semibold text-gray-700 dark:text-darkAccentGreen">
            Item Category:
          </label>
          <input
            id="itemCategory"
            type="text"
            value={filters.itemCategory}
            onChange={(e) => handleChange("itemCategory", e.target.value)}
            className="border border-gray-400 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="userName" className="font-semibold text-gray-700 dark:text-darkAccentGreen">
            User Name:
          </label>
          <input
            id="userName"
            type="text"
            value={filters.userName}
            onChange={(e) => handleChange("userName", e.target.value)}
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

        <Button
          onClick={handleSearch}
          className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors dark:bg-darkSurface dark:text-darkAccentGreen"
        >
          Search
        </Button>
      </div>

      {errorMessage && (
        <div className="text-red-600 font-medium">Error: {errorMessage}</div>
      )}
      {loading && <div className="text-gray-600 dark:text-darkAccentGreen">Loading data ...</div>}

      {searchTriggered && !loading && filteredTransactions.length === 0 && (
        <div className="bg-white border border-gray-400 rounded p-4 text-center italic text-gray-600 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen">
          No matching results.
        </div>
      )}

      {filteredTransactions.length > 0 && (
        <div className="overflow-x-auto w-full bg-white border border-gray-400 rounded shadow dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen">
          <Table className="table-fixed w-full border-collapse">
            <TableHeader className="bg-gray-100 sticky top-0 dark:bg-darkSurface">
              <TableRow>
                <TableHead className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Amount
                </TableHead>
                <TableHead className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Category
                </TableHead>
                <TableHead className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  User
                </TableHead>
                <TableHead className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Booking
                </TableHead>
                <TableHead className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Shift
                </TableHead>
                <TableHead className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Source Txn
                </TableHead>
                <TableHead className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Status
                </TableHead>
                <TableHead className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Reason
                </TableHead>
                <TableHead className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Description
                </TableHead>
                <TableHead className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Timestamp
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map(([id, txn], index) => {
                const rowBg =
                  index % 2 === 0
                    ? "bg-white dark:bg-darkSurface"
                    : "bg-gray-50 dark:bg-darkSurface";
                return (
                  <TableRow key={id} className={rowBg}>
                    <TableCell className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.amount}
                    </TableCell>
                    <TableCell className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.itemCategory}
                    </TableCell>
                    <TableCell className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.user_name}
                    </TableCell>
                    <TableCell className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.bookingRef ?? "-"}
                    </TableCell>
                    <TableCell className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.shiftId ?? "-"}
                    </TableCell>
                    <TableCell className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.sourceTxnId ?? "-"}
                    </TableCell>
                    <TableCell className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.voidedAt
                        ? "Void"
                        : txn.correctionKind
                        ? `Correction (${txn.correctionKind})`
                        : "-"}
                    </TableCell>
                    <TableCell className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.voidReason ?? txn.correctionReason ?? "-"}
                    </TableCell>
                    <TableCell className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.description}
                    </TableCell>
                    <TableCell className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.timestamp}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

export default React.memo(FinancialTransactionSearch);
