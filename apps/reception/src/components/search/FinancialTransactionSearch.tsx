import React, { useCallback, useMemo, useState } from "react";

import useAllFinancialTransactionsData from "../../hooks/data/useAllFinancialTransactionsData";

function FinancialTransactionSearch(): JSX.Element {
  const [filters, setFilters] = useState({
    amount: "",
    itemCategory: "",
    userName: "",
  });

  const [searchTriggered, setSearchTriggered] = useState(false);

  const { filteredTransactions, loading, error } =
    useAllFinancialTransactionsData(
      searchTriggered
        ? {
            amount: filters.amount,
            itemCategory: filters.itemCategory,
            userName: filters.userName,
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

      {searchTriggered && !loading && filteredTransactions.length === 0 && (
        <div className="bg-white border border-gray-400 rounded p-4 text-center italic text-gray-600 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen">
          No matching results.
        </div>
      )}

      {filteredTransactions.length > 0 && (
        <div className="overflow-x-auto w-full bg-white border border-gray-400 rounded shadow dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen">
          <table className="table-fixed w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0 dark:bg-darkSurface">
              <tr>
                <th className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Amount
                </th>
                <th className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Category
                </th>
                <th className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  User
                </th>
                <th className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Description
                </th>
                <th className="border-b border-gray-400 py-2 px-3 text-start dark:border-darkSurface dark:text-darkAccentGreen">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(([id, txn], index) => {
                const rowBg =
                  index % 2 === 0
                    ? "bg-white dark:bg-darkSurface"
                    : "bg-gray-50 dark:bg-darkSurface";
                return (
                  <tr key={id} className={rowBg}>
                    <td className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.amount}
                    </td>
                    <td className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.itemCategory}
                    </td>
                    <td className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.user_name}
                    </td>
                    <td className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.description}
                    </td>
                    <td className="border-b border-gray-400 py-2 px-3 dark:border-darkSurface dark:text-darkAccentGreen">
                      {txn.timestamp}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default React.memo(FinancialTransactionSearch);
