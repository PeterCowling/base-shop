// File: /Users/petercowling/reception/src/components/loans/LoanableItemSelector.tsx
import React, { memo, type ReactElement, useCallback } from "react";

import { type LoanItem, type LoanMethod } from "../../types/hooks/data/loansData";

/**
 * Props for the component that:
 * 1) Lets the user pick which item they want to loan.
 * 2) Initiates the "loan" flow.
 */
interface LoanableItemSelectorProps {
  guest: {
    guestId: string;
    bookingRef: string;
    firstName: string;
    lastName: string;
  };
  /** Which item is currently selected for this guest. */
  guestSelectedItem: LoanItem;
  /** Disables the "loan" button if true. */
  buttonDisabled: boolean;
  /** Invoked whenever the user picks a new item from the selector. */
  onSelectItem: (item: LoanItem) => void;
  /** Opens the "loan" modal to confirm a new loan for the given item. */
  openModal: (
    mode: "loan" | "return",
    guest: {
      guestId: string;
      bookingRef: string;
      firstName: string;
      lastName: string;
    },
    item: LoanItem,
    maxCount?: number,
    method?: LoanMethod
  ) => void;
}

function LoanableItemSelectorComponent({
  guest,
  guestSelectedItem,
  buttonDisabled,
  onSelectItem,
  openModal,
}: LoanableItemSelectorProps): ReactElement {
  /**
   * Handle item selection from a dropdown.
   */
  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSelectItem(e.target.value as LoanItem);
    },
    [onSelectItem]
  );

  /**
   * Trigger the "loan" modal for the selected item.
   */
  const handleLoanClick = useCallback(() => {
    openModal("loan", guest, guestSelectedItem);
  }, [guest, guestSelectedItem, openModal]);

  return (
    <div className="flex items-center gap-2">
      <select
        value={guestSelectedItem}
        onChange={handleSelect}
        className="border px-2 py-1 rounded dark:bg-darkSurface dark:text-darkAccentGreen"
      >
        <option value="Umbrella">Umbrella</option>
        <option value="Hairdryer">Hairdryer</option>
        <option value="Steamer">Steamer</option>
        <option value="Padlock">Padlock</option>
        <option value="Keycard">Keycard</option>
      </select>

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded disabled:opacity-50 dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
        disabled={buttonDisabled}
        onClick={handleLoanClick}
      >
        Loan
      </button>
    </div>
  );
}

export const LoanableItemSelector = memo(LoanableItemSelectorComponent);
export default LoanableItemSelector;
