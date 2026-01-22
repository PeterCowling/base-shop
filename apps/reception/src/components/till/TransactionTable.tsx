import { memo } from "react";

import type { Transaction } from "../../types/component/Till";
import { formatItalyDateTimeFromIso } from "../../utils/dateUtils";

import CopyBookingRefPill from "./CopyBookingRefPill";
import CopyOccupantIdPill from "./CopyOccupantIdPill";
import { formatItemCategory, summariseDescription } from "./helpers";

export interface TransactionTableProps {
  transactions: Transaction[];
  shiftOwner?: string | null;
  isEditMode: boolean;
  isDeleteMode: boolean;
  onRowEdit(txn: Transaction): void;
  onRowDelete(txn: Transaction): void;
}

const TransactionTable = memo(function TransactionTable({
  transactions,
  shiftOwner,
  isEditMode,
  isDeleteMode,
  onRowEdit,
  onRowDelete,
}: TransactionTableProps) {
  return (
    <table className="min-w-full border-collapse text-xs sm:text-sm md:text-base dark:text-darkAccentGreen">
      <thead>
        <tr>
          <th className="sticky top-0 z-10 text-start p-3 border-b border-gray-400 dark:border-darkSurface dark:bg-darkSurface">
            TIMESTAMP
          </th>
          <th className="sticky top-0 z-10 text-start p-3 border-b border-gray-400 dark:border-darkSurface dark:bg-darkSurface">
            AMOUNT
          </th>
          <th className="sticky top-0 z-10 text-start p-3 border-b border-gray-400 dark:border-darkSurface dark:bg-darkSurface">
            METHOD
          </th>
          <th className="sticky top-0 z-10 text-start p-3 border-b border-gray-400 dark:border-darkSurface dark:bg-darkSurface">
            TYPE
          </th>
          <th className="sticky top-0 z-10 text-start p-3 border-b border-gray-400 dark:border-darkSurface dark:bg-darkSurface">
            STAFF
          </th>
          <th className="sticky top-0 z-10 text-start p-3 border-b border-gray-400 dark:border-darkSurface dark:bg-darkSurface">
            ITEM CATEGORY
          </th>
          <th className="sticky top-0 z-10 text-start p-3 border-b border-gray-400 dark:border-darkSurface dark:bg-darkSurface">
            OCCUPANT
          </th>
          <th className="sticky top-0 z-10 text-start p-3 border-b border-gray-400 dark:border-darkSurface dark:bg-darkSurface">
            BOOKING
          </th>
          <th className="sticky top-0 z-10 text-start p-3 border-b border-gray-400 dark:border-darkSurface dark:bg-darkSurface">
            DESCRIPTION
          </th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((t, index) => {
          const displayDate = t.timestamp
            ? formatItalyDateTimeFromIso(t.timestamp)
            : "No timestamp";
          const rowBg =
            index % 2 === 0
              ? "bg-white dark:bg-darkBg"
              : "bg-gray-50 dark:bg-darkSurface";
          const category = t.type === "barSale" ? "Bar Sale" : t.itemCategory;
          const summary = summariseDescription(t.description);
          if (summary === null) return null;
          return (
            <tr
              key={t.txnId}
              onClick={
                isDeleteMode
                  ? () => onRowDelete(t)
                  : isEditMode
                  ? () => onRowEdit(t)
                  : undefined
              }
              className={`${rowBg} border-b border-gray-400 dark:border-darkSurface hover:bg-gray-100$${
                isDeleteMode || isEditMode ? " cursor-pointer" : ""
              }`}
            >
              <td className="p-3">{displayDate}</td>
              <td className="p-3">
                {t.amount < 0 ? (
                  <span className="text-error-main">
                    €{t.amount.toFixed(2)}
                  </span>
                ) : (
                  <span className="dark:text-darkAccentGreen">
                    €{t.amount.toFixed(2)}
                  </span>
                )}
              </td>
              <td className="p-3">{t.type || "-"}</td>
              <td className="p-3">{t.user_name || shiftOwner || "-"}</td>
              <td className="p-3 whitespace-pre-line">
                {formatItemCategory(category || "-")}
              </td>
              <td className="p-3">
                {t.occupantId ? (
                  t.occupantId.startsWith("occ_") ? (
                    <CopyOccupantIdPill occupantId={t.occupantId} />
                  ) : (
                    t.occupantId
                  )
                ) : (
                  "-"
                )}
              </td>
              <td className="p-3">
                {t.bookingRef ? (
                  <CopyBookingRefPill bookingRef={t.bookingRef} />
                ) : (
                  "-"
                )}
              </td>
              <td className="p-3 whitespace-pre-line">
                {summary ? summary.split(/\s+/).join("\n") : "-"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
});

export default TransactionTable;
