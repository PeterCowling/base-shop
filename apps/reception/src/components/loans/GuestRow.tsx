import { memo, ReactElement, useCallback, useMemo } from "react";

// Rename the default imports to avoid ESLint conflicts
import LoanableItemSelectorComp from "./LoanableItemSelector";
import LoanedItemsListComp from "./LoanedItemsList";
import useOccupantLoans from "./useOccupantLoans";
import { LoanItem, LoanMethod } from "../../types/hooks/data/loansData";

/**
 * Simplified occupant interface for a single row.
 */
interface Guest {
  guestId: string;
  bookingRef: string;
  firstName: string;
  lastName: string;
}

interface GuestRowProps {
  guest: Guest;
  guestSelectedItem: LoanItem;
  onSelectItem: (guestId: string, item: LoanItem) => void;
  buttonDisabled: boolean;
  openModal: (
    mode: "loan" | "return",
    guest: Guest,
    item: LoanItem,
    maxCount?: number,
    method?: LoanMethod
  ) => void;
  /** Open read-only modal showing any keycards currently loaned */
  openKeycardsModal: (guest: Guest) => void;
  rowBg: string;
}

/**
 * A single table row showing:
 *  - The booking reference
 *  - The guest name
 *  - A column to make a Loan (LoanableItemSelectorComp)
 *  - A column of Already Loaned items (LoanedItemsListComp)
 */
function GuestRowComponent({
  guest,
  guestSelectedItem,
  onSelectItem,
  buttonDisabled,
  openModal,
  openKeycardsModal,
  rowBg,
}: GuestRowProps): ReactElement {
  const { occupantLoans } = useOccupantLoans(guest.bookingRef, guest.guestId);

  const hasKeycards = useMemo(() => {
    if (!occupantLoans?.txns) return false;
    let total = 0;
    Object.values(occupantLoans.txns).forEach((txn) => {
      if (txn.item === "Keycard") {
        if (txn.type === "Loan") total += txn.count;
        else if (txn.type === "Refund") total -= txn.count;
      }
    });
    return total > 0;
  }, [occupantLoans]);

  /**
   * Called when user attempts to return an item from LoanedItemsListComp.
   */
  const handleReturnLoan = useCallback(
    (
      _bookingRef: string,
      _occupantId: string,
      itemName: LoanItem,
      countToRemove: number
    ) => {
      openModal("return", guest, itemName, countToRemove);
    },
    [guest, openModal]
  );

  const handleDoubleClick = useCallback(() => {
    if (hasKeycards) {
      openKeycardsModal(guest);
    }
  }, [hasKeycards, openKeycardsModal, guest]);

  return (
    <tr className={rowBg} onDoubleClick={handleDoubleClick}>
      <td className="p-3 border-b border-gray-300 dark:border-darkSurface">{guest.bookingRef}</td>
      <td className="p-3 border-b border-gray-300 dark:border-darkSurface">
        {guest.firstName} {guest.lastName}
      </td>

      {/* "New Loan" Column */}
      <td className="p-3 border-b border-gray-300 dark:border-darkSurface">
        <LoanableItemSelectorComp
          guest={guest}
          guestSelectedItem={guestSelectedItem}
          buttonDisabled={buttonDisabled}
          onSelectItem={(item: LoanItem) => onSelectItem(guest.guestId, item)}
          openModal={openModal}
        />
      </td>

      {/* "Change Existing Loan" Column */}
      <td className="p-3 border-b border-gray-300 dark:border-darkSurface">
        <LoanedItemsListComp
          occupantId={guest.guestId}
          guest={guest}
          buttonDisabled={buttonDisabled}
          onReturnLoan={handleReturnLoan}
        />
      </td>
    </tr>
  );
}

export const GuestRow = memo(GuestRowComponent);
export default GuestRow;
