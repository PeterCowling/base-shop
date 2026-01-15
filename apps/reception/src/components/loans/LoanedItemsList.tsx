// File: /src/components/loans/LoanedItemsList.tsx

import { memo, ReactElement, useCallback, useMemo } from "react";

import useOccupantLoans from "./useOccupantLoans";
import {
  LoanItem,
  LoanMethod,
  LoanTransaction,
} from "../../types/hooks/data/loansData";

interface LoanedItemsListProps {
  occupantId: string; // occupantId alone is not enough if we need bookingRef. We'll see the hook below.
  guest: {
    guestId: string;
    bookingRef: string;
    firstName: string;
    lastName: string;
  };
  buttonDisabled: boolean;
  onReturnLoan: (
    bookingRef: string,
    occupantId: string,
    itemName: LoanItem,
    countToRemove: number
  ) => void;
}

/**
 * Displays the occupant's currently "Loan"ed items by querying "loans/<bookingRef>/<occupantId>".
 */
function LoanedItemsListComponent({
  occupantId,
  guest,
  buttonDisabled,
  onReturnLoan,
}: LoanedItemsListProps): ReactElement {
  // Custom hook to fetch occupant-specific loans
  const { occupantLoans, loading, error } = useOccupantLoans(
    guest.bookingRef,
    occupantId
  );

  const getDepositLabel = useCallback((type: LoanMethod): string => {
    switch (type) {
      case "CASH":
        return "Cash";
      case "PASSPORT":
        return "Passport";
      case "LICENSE":
        return "Driver License";
      case "ID":
        return "National ID";
      case "NO_CARD":
        return "No Card";
      default:
        return type;
    }
  }, []);

  /**
   * Build a list of loaned items. Keycards are listed individually so each
   * retains its own deposit type.
   */
  const loanItems = useMemo(() => {
    if (!occupantLoans?.txns)
      return [] as {
        key: string;
        itemName: string;
        count: number;
        depositType: LoanMethod;
        txns: { id: string; count: number; depositType: LoanMethod }[];
      }[];
    const aggregated: Record<
      string,
      {
        key: string;
        itemName: string;
        count: number;
        depositType: LoanMethod;
        txns: { id: string; count: number; depositType: LoanMethod }[];
      }
    > = {};

    const keycardEntries: {
      key: string;
      itemName: string;
      count: number;
      depositType: LoanMethod;
      txns: { id: string; count: number; depositType: LoanMethod }[];
    }[] = [];

    Object.entries(occupantLoans.txns).forEach(([txnId, raw]) => {
      const txn = raw as LoanTransaction;
      const { item, type, count, depositType } = txn;
      if (!item || !count || type !== "Loan") return;

      if (item === "Keycard") {
        for (let i = 0; i < count; i++) {
          keycardEntries.push({
            key: `${txnId}-${i}`,
            itemName: "Keycard",
            count: 1,
            depositType,
            txns: [{ id: txnId, count: 1, depositType }],
          });
        }
        return;
      }

      if (!aggregated[item]) {
        aggregated[item] = {
          key: item,
          itemName: item,
          count: 0,
          depositType,
          txns: [],
        };
      }
      aggregated[item].count += count;
      aggregated[item].txns.push({ id: txnId, count, depositType });
    });

    const result = [
      ...Object.values(aggregated).filter((d) => d.count > 0),
      ...keycardEntries,
    ];

    return result;
  }, [occupantLoans]);

  if (loading) {
    return <span className="text-gray-600 italic dark:text-darkAccentGreen">Loading...</span>;
  }
  if (error) {
    return (
      <span className="text-red-500 italic dark:text-darkAccentOrange">Error loading occupant loans.</span>
    );
  }
  if (!loanItems.length) {
    return <span className="text-gray-600 italic dark:text-darkAccentGreen">None</span>;
  }

  return (
    <>
      {loanItems.map(({ key, itemName, count, depositType }) => {
        const showReturnButton = itemName !== "No_card";

        return (
          <div key={key} className="flex items-center justify-between my-1 dark:text-darkAccentGreen">
            <div>
              {itemName} (x{count}) - {getDepositLabel(depositType)}
            </div>
            <div className="flex gap-2">
              {showReturnButton && (
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded disabled:bg-gray-300 dark:bg-darkAccentOrange dark:text-darkSurface dark:hover:bg-darkAccentOrange/80 dark:disabled:bg-darkSurface/50"
                  disabled={buttonDisabled}
                  onClick={() =>
                    onReturnLoan(
                      guest.bookingRef,
                      guest.guestId,
                      itemName as LoanItem,
                      count
                    )
                  }
                >
                  Return
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

export const LoanedItemsList = memo(LoanedItemsListComponent);
export default LoanedItemsList;
