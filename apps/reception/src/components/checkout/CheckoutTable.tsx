// File: /src/components/checkout/CheckoutTable.tsx

import React from "react";

import { type LoanMethod } from "../../types/hooks/data/loansData";
import { formatDdMm } from "../../utils/dateUtils";
import { sortCheckoutsData } from "../../utils/sortCheckouts";

/**
 * Minimal shape needed for each loan to be displayed in the checkout table.
 */
export interface Loan {
  item: string;
  depositType?: LoanMethod;
}

/**
 * Represents a guest who is checking out.
 */
export interface Guest {
  _key?: string;
  bookingRef: string;
  guestId: string;
  checkoutDate: string;
  firstName: string;
  lastName: string;
  roomAllocated: string;
  loans?: Record<string, Loan>;
  fridge?: string;
  isCompleted: boolean;
  /**
   * Indicates if bag storage is opted in for this occupant.
   */
  bagStorageOptedIn?: boolean;
}

interface CheckoutTableProps {
  guests: Guest[];
  removeLoanItem: (
    bookingRef: string,
    guestId: string,
    txnKey: string,
    item: string,
    depositType?: LoanMethod | string
  ) => void;
  onComplete: (
    bookingRef: string,
    guestId: string,
    isCompleted: boolean,
    checkoutDate: string
  ) => void;
}

/**
 * Returns a combination of Font Awesome icon class(es) based on the loan item type.
 */
export function getLoanIconClass(
  item: string,
  depositType?: LoanMethod | string
): string {
  const normalized = depositType ? depositType.toUpperCase() : undefined;

  switch (item) {
    case "Umbrella":
      return "fas fa-umbrella fa-lg text-blue-600";
    case "Hairdryer":
      return "fas fa-hairdryer fa-lg text-pink-600";
    case "Steamer":
      return "fas fa-cloud fa-lg text-gray-600";
    case "Padlock":
      return "fas fa-lock fa-lg text-yellow-600";
    case "Keycard":
      if (normalized === "CASH") {
        return "fas fa-id-card fa-lg text-green-600";
      }
      if (
        normalized === "PASSPORT" ||
        normalized === "LICENSE" ||
        normalized === "ID"
      ) {
        return "fas fa-id-card fa-lg text-yellow-600";
      }
      // Debug unknown deposit types
      console.warn(
        "[getLoanIconClass] Unrecognized deposit type for Keycard:",
        depositType
      );
      return "fas fa-id-card fa-lg text-gray-700";
    case "No_card":
      return "fas fa-ban fa-lg text-red-500";
    default:
      return "fas fa-question fa-lg text-gray-700";
  }
}

/**
 * Returns a tooltip string describing the loan item and how it was deposited.
 */
export function getLoanTitle(
  item: string,
  depositType?: LoanMethod | string
): string {
  if (item !== "Keycard") return item;

  const normalized = depositType ? depositType.toUpperCase() : undefined;

  if (normalized === "CASH") {
    return "Keycard with cash";
  }

  if (
    normalized === "PASSPORT" ||
    normalized === "LICENSE" ||
    normalized === "ID"
  ) {
    return "Keycard with document";
  }

  console.warn(
    "[getLoanTitle] Unrecognized deposit type for Keycard:",
    depositType
  );

  return "Keycard";
}

/**
 * The checkout table for displaying guests, their loans, etc.
 * Sorts guests with the same approach used in check-ins:
 *   - Group by bookingRef
 *   - Sort occupant rows by numeric roomAllocated
 *   - Incomplete before complete
 *   - Among equally complete, use booking's min allocated room
 */
const CheckoutTable: React.FC<CheckoutTableProps> = React.memo(
  ({ guests, removeLoanItem, onComplete }) => {
    if (!guests || guests.length === 0) {
      return (
        <div className="bg-white border border-gray-400 rounded shadow p-8 text-center italic text-gray-600 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen">
          No checkouts found for this date.
        </div>
      );
    }

    // Use the new utility to get a properly sorted list of guests
    const sortedGuests = sortCheckoutsData(guests);

    // Optional debug
    console.log("Final sorted guests for CheckoutTable:", sortedGuests);

    return (
      <div className="bg-white border border-gray-400 rounded shadow overflow-x-auto dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen">
        <table className="w-full border-collapse" aria-label="checkout table">
          <thead className="bg-gray-100 dark:bg-darkSurface">
            <tr>
              <th className="sticky top-0 z-10 text-center p-3 border-b border-gray-400 dark:border-darkSurface">
                DATE
              </th>
              <th className="sticky top-0 z-10 text-center p-3 border-b border-gray-400 dark:border-darkSurface">
                REF
              </th>
              <th className="sticky top-0 z-10 text-center p-3 border-b border-gray-400 dark:border-darkSurface">
                NAME
              </th>
              <th className="sticky top-0 z-10 text-center p-3 border-b border-gray-400 dark:border-darkSurface">
                ROOM
              </th>
              <th className="sticky top-0 z-10 text-center p-3 border-b border-gray-400 dark:border-darkSurface w-48">
                LOANS
              </th>
              <th className="sticky top-0 z-10 text-center p-3 border-b border-gray-400 dark:border-darkSurface">
                BAG STORAGE
              </th>
              <th className="sticky top-0 z-10 text-center p-3 border-b border-gray-400 dark:border-darkSurface">
                FRIDGE
              </th>
              <th className="sticky top-0 z-10 text-center p-3 border-b border-gray-400 dark:border-darkSurface w-32">
                COMPLETE
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedGuests.map((guest, index) => {
              const loanEntries = guest.loans
                ? Object.entries(guest.loans)
                : [];
              const rowBg =
                index % 2 === 0
                  ? "bg-white dark:bg-darkSurface"
                  : "bg-gray-50 dark:bg-darkSurface";

              return (
                <tr key={guest._key || guest.guestId} className={rowBg}>
                  <td className="p-3 border-b border-gray-400 dark:border-darkSurface">
                    {formatDdMm(guest.checkoutDate)}
                  </td>
                  <td className="p-3 border-b border-gray-400 dark:border-darkSurface">
                    {guest.bookingRef}
                  </td>
                  <td className="p-3 border-b border-gray-400 dark:border-darkSurface">
                    {guest.firstName} {guest.lastName}
                  </td>
                  <td className="p-3 border-b text-center  border-gray-400 dark:border-darkSurface">
                    {guest.roomAllocated}
                  </td>
                  <td className="p-3 border-b border-gray-400 dark:border-darkSurface w-48">
                    {loanEntries.map(([txnKey, loan]) => {
                      console.debug(
                        `[CheckoutTable] Loan entry ${txnKey}:`,
                        loan
                      );
                      const iconClass = getLoanIconClass(
                        loan.item,
                        loan.depositType
                      );
                      console.debug(
                        `[CheckoutTable] iconClass for ${txnKey}:`,
                        iconClass
                      );
                      const loanTitle = getLoanTitle(
                        loan.item,
                        loan.depositType
                      );
                      console.debug(
                        `[CheckoutTable] loanTitle for ${txnKey}:`,
                        loanTitle
                      );
                      return (
                        <button
                          key={txnKey}
                          onClick={() =>
                            removeLoanItem(
                              guest.bookingRef,
                              guest.guestId,
                              txnKey,
                              loan.item,
                              loan.depositType
                            )
                          }
                          aria-label={`Remove ${loanTitle}`}
                          className="inline-flex items-center px-1 me-1 text-gray-700 hover:text-black transition-colors duration-200 dark:text-darkAccentGreen dark:hover:text-darkAccentGreen"
                          title={loanTitle}
                        >
                          <i className={iconClass} aria-hidden="true" />
                        </button>
                      );
                    })}
                  </td>
                  {/* Show an icon if the occupant opted into bag storage */}
                  <td className="p-3 border-b border-gray-400 dark:border-darkSurface text-center">
                    {guest.bagStorageOptedIn && (
                      <i
                        className="fas fa-suitcase fa-lg text-blue-600"
                        title="Bag Storage"
                        aria-hidden="true"
                      />
                    )}
                  </td>
                  <td className="p-3 border-b border-gray-400 dark:border-darkSurface">
                    {guest.fridge || ""}
                  </td>
                  <td className="p-3 border-b border-gray-400 dark:border-darkSurface text-center">
                    <button
                      onClick={() =>
                        onComplete(
                          guest.bookingRef,
                          guest.guestId,
                          guest.isCompleted,
                          guest.checkoutDate
                        )
                      }
                      className={`px-4 py-2 rounded text-white transition-colors duration-200 ${
                        guest.isCompleted
                          ? "bg-green-500 hover:bg-red-500"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                      title={
                        guest.isCompleted
                          ? "Undo checkout completion"
                          : "Complete checkout"
                      }
                      aria-label={
                        guest.isCompleted
                          ? "Undo checkout completion"
                          : "Complete checkout"
                      }
                    >
                      {guest.isCompleted ? "Completed" : "Complete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
);

CheckoutTable.displayName = "CheckoutTable";

export default CheckoutTable;
