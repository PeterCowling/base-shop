// /Users/petercowling/reception/src/components/bookingSearch/EditableBalanceCell.tsx
import React, {
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import useFinancialsRoomMutations from "../../hooks/mutations/useFinancialsRoomMutations";
import { getCurrentIsoTimestamp } from "../../utils/dateUtils";

/**
 * EditableBalanceCellProps
 * @property bookingRef - The booking reference key within "financialsRoom".
 * @property initialValue - The currently displayed "balance" (to pay) amount.
 *
 * This cell supports direct editing of the displayed balance. Upon commit,
 * we create a transaction of type "adjust" for the difference. The cell background
 * flashes green for 3 seconds if successfully updated.
 */
interface EditableBalanceCellProps {
  bookingRef: string;
  initialValue: number;
}

/**
 * A single-purpose component for editing the "To Pay" (balance) amount.
 * Once edited, it updates Firebase via an "adjust" transaction that captures
 * the difference between the current balance and the new user-entered amount.
 *
 * Changes for improved accessibility:
 * - Removed `autoFocus` in favor of programmatic focus via ref/useEffect.
 * - Replaced non-interactive <span> + onClick with <button> to ensure proper keyboard
 *   accessibility and native focus handling.
 *
 * By removing `autoFocus`, we improve accessibility; the user can control focus with the keyboard
 * or screen reader effectively. By using a <button>, we gain native keyboard and screen reader support
 * without needing extra role or tabIndex attributes.
 *
 * Note: The onBlur and onKeyDown logic remain the same, only the `autoFocus` is replaced with a ref-based approach.
 * This helps avoid breaking any other code that may rely on these interactions.
 */
const EditableBalanceCell: React.FC<EditableBalanceCellProps> = ({
  bookingRef,
  initialValue,
}) => {
  const { saveFinancialsRoom } = useFinancialsRoomMutations();

  const [editValue, setEditValue] = useState<string>(initialValue.toFixed(2));
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [justUpdated, setJustUpdated] = useState<boolean>(false);

  // Ref used to programmatically focus the input when editing begins
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus the input when isEditing becomes true
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  // Revert cell background color after 3 seconds
  useEffect(() => {
    if (justUpdated) {
      const timerId = window.setTimeout(() => setJustUpdated(false), 3000);
      return () => {
        window.clearTimeout(timerId);
      };
    }
  }, [justUpdated]);

  /**
   * Called when the user confirms or blurs out of the input (Enter or onBlur).
   */
  const commitEdit = useCallback(async () => {
    const parsedValue = parseFloat(editValue);
    // If input is invalid, treat it as zero
    const newBalance = Number.isNaN(parsedValue) ? 0 : parsedValue;

    // Calculate difference from the old balance
    const diff = newBalance - initialValue;

    // If there's no difference, bail out
    if (diff === 0) {
      setIsEditing(false);
      return;
    }

    // We now create a new transaction of type "adjust"
    // that increases or decreases the net outcome
    const transactionId = `txn_adj_${Date.now()}`;

    const partialData = {
      transactions: {
        [transactionId]: {
          amount: Math.abs(diff),
          nonRefundable: false,
          timestamp: getCurrentIsoTimestamp(),
          type: "adjust",
        },
      },
    };

    // Push the new transaction to Firebase
    await saveFinancialsRoom(bookingRef, partialData);

    // Flash success
    setJustUpdated(true);
    setIsEditing(false);
  }, [bookingRef, editValue, initialValue, saveFinancialsRoom]);

  /**
   * Handle keyboard interaction:
   * - Enter commits edit
   * - Escape reverts to original value
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        commitEdit();
      } else if (e.key === "Escape") {
        setEditValue(initialValue.toFixed(2));
        setIsEditing(false);
      }
    },
    [commitEdit, initialValue]
  );

  // If user clicks away (onBlur), commit the edit.
  // Renamed parameter to _e to satisfy lint for an unused argument.
  const handleBlur = useCallback(
    (_e: FocusEvent<HTMLInputElement>) => {
      commitEdit();
    },
    [commitEdit]
  );

  // Keep setEditValue typed properly to avoid 'any'
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  }, []);

  return (
    <td
      className={`border-b border-gray-400 py-2 px-3 ${
        justUpdated ? "bg-green-100" : ""
      } dark:border-darkSurface dark:text-darkAccentGreen`}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          className="w-full focus:outline-none bg-white border p-1 rounded dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
          value={editValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      ) : (
        <button
          type="button"
          className="cursor-pointer p-0 m-0 bg-transparent border-none underline dark:text-darkAccentGreen"
          title="Click to edit"
          onClick={() => setIsEditing(true)}
        >
          {initialValue.toFixed(2)}
        </button>
      )}
    </td>
  );
};

export default React.memo(EditableBalanceCell);
