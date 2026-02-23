// File: /src/components/loans/LoansTable.tsx
import { memo, type ReactElement, useCallback, useMemo, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";

import { type LoanItem, type LoanMethod } from "../../types/hooks/data/loansData";

import { GuestRow } from "./GuestRow";
import { KeycardsModal } from "./KeycardsModal";
import { LoanModal } from "./LoanModal";

interface TableGuest {
  occupantId: string;
  bookingRef: string;
  firstName: string;
  lastName: string;
}

/**
 * We extend the props to include loading & error so we can render
 * the table as soon as possible, showing a "Loading..." row or "Error" row
 * within the same table structure.
 */
export interface LoansTableProps {
  guests?: TableGuest[]; // The occupant data; if none yet, show "No guests available"
  loading?: boolean; // If true, display a loading row
  error?: unknown; // If non-null, display an error row
  onAddLoan: (
    bookingRef: string,
    occupantId: string,
    itemName: LoanItem,
    count: number,
    depositType?: LoanMethod
  ) => void;
  onReturnLoan: (
    bookingRef: string,
    occupantId: string,
    itemName: LoanItem,
    countToRemove: number
  ) => void;
  buttonDisabled: boolean;
}

/**
 * Encapsulates occupant info used to open the modal.
 */
interface Occupant {
  guestId: string;
  bookingRef: string;
  firstName: string;
  lastName: string;
}

/**
 * State for controlling the LoanModal.
 */
interface ModalState {
  isOpen: boolean;
  mode: "loan" | "return";
  occupant?: Occupant;
  item?: LoanItem;
  maxCount?: number;
  method?: LoanMethod;
}

/** State for viewing keycards currently loaned. */
interface KeycardsState {
  isOpen: boolean;
  occupant?: Occupant;
}

/**
 * Renders a table of guests, each row allowing:
 * - Item selection for a new loan
 * - Already loaned items (which can be returned)
 * We show the table immediately (with placeholders) while data is loading.
 */
function LoansTableComponent({
  guests = [],
  loading = false,
  error = null,
  onAddLoan,
  onReturnLoan,
  buttonDisabled,
}: LoansTableProps): ReactElement {
  const [selectedItems, setSelectedItems] = useState<Record<string, LoanItem>>(
    {}
  );

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: "loan",
  });

  const [keycardsState, setKeycardsState] = useState<KeycardsState>({
    isOpen: false,
  });

  /**
   * Opens the modal with the full context for a "loan" or "return".
   */
  const openModal = useCallback(
    (
      mode: "loan" | "return",
      occupant: Occupant,
      item: LoanItem,
      maxCount?: number,
      method?: LoanMethod
    ) => {
      setModalState({
        isOpen: true,
        mode,
        occupant,
        item,
        maxCount,
        method,
      });
    },
    []
  );

  /**
   * Closes the modal (loan or return).
   */
  const closeModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const openKeycardsModal = useCallback((occupant: Occupant) => {
    setKeycardsState({ isOpen: true, occupant });
  }, []);

  const closeKeycardsModal = useCallback(() => {
    setKeycardsState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * When user confirms in the modal, call the appropriate handler.
   */
  const handleModalConfirm = useCallback(
    (count: number, depositType?: LoanMethod) => {
      const { mode, occupant, item } = modalState;
      if (!occupant || !item) return;

      if (mode === "loan") {
        onAddLoan(
          occupant.bookingRef,
          occupant.guestId,
          item,
          count,
          depositType
        );
      } else {
        onReturnLoan(occupant.bookingRef, occupant.guestId, item, count);
      }
    },
    [modalState, onAddLoan, onReturnLoan]
  );

  /**
   * Store the item the guest selected from the dropdown.
   */
  const onSelectItem = useCallback((guestId: string, item: LoanItem) => {
    setSelectedItems((prev) => ({ ...prev, [guestId]: item }));
  }, []);

  const hasGuests = useMemo(() => guests.length > 0, [guests]);

  return (
    <>
      <div className="overflow-auto">
        <Table className="min-w-full border-collapse text-sm">
          <TableHeader>
            <TableRow className="bg-gray-200 dark:bg-darkSurface">
              <TableHead className="p-2 text-start border-b">Booking Ref</TableHead>
              <TableHead className="p-2 text-start border-b">Guest Name</TableHead>
              <TableHead className="p-2 text-start border-b">New Loan</TableHead>
              <TableHead className="p-2 text-start border-b">Change Existing Loan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Render "Loading..." row if loading is true */}
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="p-2 text-center border-b italic text-gray-600"
                >
                  Loading...
                </TableCell>
              </TableRow>
            )}

            {/* Render error row if error is non-null (and not loading) */}
            {!loading && error != null && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="p-2 text-center border-b text-error-main"
                >
                  Error: {String(error)}
                </TableCell>
              </TableRow>
            )}

            {/* If not loading, no error, but no guests => show "No guests" */}
            {!loading && error == null && !hasGuests && (
              <TableRow>
                <TableCell colSpan={4} className="p-2 text-center border-b">
                  No guests available.
                </TableCell>
              </TableRow>
            )}

            {/* If not loading, no error, and we do have guests => map over them */}
            {!loading &&
              error == null &&
              hasGuests &&
              guests.map((g) => {
                const occupant: Occupant = {
                  guestId: g.occupantId,
                  bookingRef: g.bookingRef,
                  firstName: g.firstName,
                  lastName: g.lastName,
                };
                // If the user hasn't selected an item yet, default to "Keycard" (arbitrary).
                const guestSelectedItem =
                  selectedItems[g.occupantId] || "Keycard";

                return (
                  <GuestRow
                    key={g.occupantId}
                    guest={occupant}
                    guestSelectedItem={guestSelectedItem}
                    onSelectItem={onSelectItem}
                    buttonDisabled={buttonDisabled}
                    openModal={openModal}
                    openKeycardsModal={openKeycardsModal}
                    rowBg="hover:bg-gray-50 dark:hover:bg-darkSurface cursor-pointer"
                  />
                );
              })}
          </TableBody>
        </Table>
      </div>

      {/* Centralized Loan/Return modal */}
      <LoanModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        occupant={modalState.occupant}
        item={modalState.item}
        maxCount={modalState.maxCount}
        method={modalState.method}
        onClose={closeModal}
        onConfirm={handleModalConfirm}
      />

      <KeycardsModal
        isOpen={keycardsState.isOpen}
        occupant={keycardsState.occupant}
        onClose={closeKeycardsModal}
      />
    </>
  );
}

export const LoansTable = memo(LoansTableComponent);
export default LoansTable;
