// File: /Users/petercowling/reception/src/components/loans/LoanableItemSelector.tsx
import React, { memo, type ReactElement, useCallback } from "react";

import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system";

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
    (value: string) => {
      onSelectItem(value as LoanItem);
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
      <Select value={guestSelectedItem} onValueChange={handleSelect}>
        <SelectTrigger className="border px-2 py-1 rounded">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Umbrella">Umbrella</SelectItem>
          <SelectItem value="Hairdryer">Hairdryer</SelectItem>
          <SelectItem value="Steamer">Steamer</SelectItem>
          <SelectItem value="Padlock">Padlock</SelectItem>
          <SelectItem value="Keycard">Keycard</SelectItem>
        </SelectContent>
      </Select>

      <Button
        className="bg-info text-primary-fg px-3 py-1 rounded disabled:opacity-50"
        disabled={buttonDisabled}
        onClick={handleLoanClick}
      >
        Loan
      </Button>
    </div>
  );
}

export const LoanableItemSelector = memo(LoanableItemSelectorComponent);
export default LoanableItemSelector;
