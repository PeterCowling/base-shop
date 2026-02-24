import React, { useCallback, useMemo, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

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
      <h2 className="text-xl font-semibold mb-4">Search Transactions</h2>
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div className="flex flex-col">
          <label htmlFor="amount" className="font-semibold text-foreground">
            Amount:
          </label>
          <input
            id="amount"
            type="number"
            value={filters.amount}
            onChange={(e) => handleChange("amount", e.target.value)}
            className="border border-border-2 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="itemCategory" className="font-semibold text-foreground">
            Item Category:
          </label>
          <input
            id="itemCategory"
            type="text"
            value={filters.itemCategory}
            onChange={(e) => handleChange("itemCategory", e.target.value)}
            className="border border-border-2 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="userName" className="font-semibold text-foreground">
            User Name:
          </label>
          <input
            id="userName"
            type="text"
            value={filters.userName}
            onChange={(e) => handleChange("userName", e.target.value)}
            className="border border-border-2 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500"
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
            className="border border-border-2 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500"
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
            className="border border-border-2 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500"
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
            className="border border-border-2 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500"
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
            className="border border-border-2 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500"
          />
        </div>

        <Button
          onClick={handleSearch}
          className="px-4 py-1 bg-info-main text-primary-fg rounded hover:bg-blue-700 transition-colors"
        >
          Search
        </Button>
      </div>

      {errorMessage && (
        <div className="text-error-main font-medium">Error: {errorMessage}</div>
      )}
      {loading && <div className="text-muted-foreground">Loading data ...</div>}

      {searchTriggered && !loading && filteredTransactions.length === 0 && (
        <div className="bg-surface border border-border-2 rounded p-4 text-center italic text-muted-foreground">
          No matching results.
        </div>
      )}

      {filteredTransactions.length > 0 && (
        <div className="overflow-x-auto w-full bg-surface border border-border-2 rounded shadow">
          <Table className="table-fixed w-full border-collapse">
            <TableHeader className="bg-surface-2 sticky top-0">
              <TableRow>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Amount
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Category
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  User
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Booking
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Shift
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Source Txn
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Status
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Reason
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Description
                </TableHead>
                <TableHead className="border-b border-border-2 py-2 px-3 text-start">
                  Timestamp
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map(([id, txn], index) => {
                const rowBg =
                  index % 2 === 0
                    ? "bg-surface"
                    : "bg-surface-2";
                return (
                  <TableRow key={id} className={rowBg}>
                    <TableCell className="border-b border-border-2 py-2 px-3">
                      {txn.amount}
                    </TableCell>
                    <TableCell className="border-b border-border-2 py-2 px-3">
                      {txn.itemCategory}
                    </TableCell>
                    <TableCell className="border-b border-border-2 py-2 px-3">
                      {txn.user_name}
                    </TableCell>
                    <TableCell className="border-b border-border-2 py-2 px-3">
                      {txn.bookingRef ?? "-"}
                    </TableCell>
                    <TableCell className="border-b border-border-2 py-2 px-3">
                      {txn.shiftId ?? "-"}
                    </TableCell>
                    <TableCell className="border-b border-border-2 py-2 px-3">
                      {txn.sourceTxnId ?? "-"}
                    </TableCell>
                    <TableCell className="border-b border-border-2 py-2 px-3">
                      {txn.voidedAt
                        ? "Void"
                        : txn.correctionKind
                        ? `Correction (${txn.correctionKind})`
                        : "-"}
                    </TableCell>
                    <TableCell className="border-b border-border-2 py-2 px-3">
                      {txn.voidReason ?? txn.correctionReason ?? "-"}
                    </TableCell>
                    <TableCell className="border-b border-border-2 py-2 px-3">
                      {txn.description}
                    </TableCell>
                    <TableCell className="border-b border-border-2 py-2 px-3">
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
