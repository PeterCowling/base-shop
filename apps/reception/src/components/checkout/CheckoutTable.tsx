// File: /src/components/checkout/CheckoutTable.tsx

import React from "react";
import type { LucideIcon } from "lucide-react";
import { Ban, CircleHelp, Cloud, CreditCard, FileText, Lock, Luggage, Umbrella, Wind } from "lucide-react";

import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";

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
 * Returns the Lucide icon component and color class for a given loan item type.
 */
export function getLoanIcon(
  item: string,
  depositType?: LoanMethod | string
): { Icon: LucideIcon; colorClass: string } {
  const normalized = depositType ? depositType.toUpperCase() : undefined;

  switch (item) {
    case "Umbrella":
      return { Icon: Umbrella, colorClass: "text-primary-main" };
    case "Hairdryer":
      return { Icon: Wind, colorClass: "text-accent" };
    case "Steamer":
      return { Icon: Cloud, colorClass: "text-muted-foreground" };
    case "Padlock":
      return { Icon: Lock, colorClass: "text-warning-main" };
    case "Keycard":
      if (normalized === "CASH") {
        return { Icon: CreditCard, colorClass: "text-success-main" };
      }
      if (
        normalized === "PASSPORT" ||
        normalized === "LICENSE" ||
        normalized === "ID"
      ) {
        return { Icon: FileText, colorClass: "text-warning-main" };
      }
      console.warn(
        "[getLoanIcon] Unrecognized deposit type for Keycard:",
        depositType
      );
      return { Icon: CreditCard, colorClass: "text-foreground" };
    case "No_card":
      return { Icon: Ban, colorClass: "text-error-main" };
    default:
      return { Icon: CircleHelp, colorClass: "text-foreground" };
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
        <div className="bg-surface border border-border-2 rounded-xl shadow-md p-8 text-center italic text-muted-foreground">
          No checkouts found for this date.
        </div>
      );
    }

    // Use the new utility to get a properly sorted list of guests
    const sortedGuests = sortCheckoutsData(guests);

    // Optional debug
    console.log("Final sorted guests for CheckoutTable:", sortedGuests);

    return (
      <div className="bg-surface border border-border-2 rounded-xl shadow-md overflow-x-auto">
        <Table className="w-full border-collapse" aria-label="checkout table">
          <TableHeader className="bg-surface-2">
            <TableRow>
              <TableHead className="sticky top-0 z-10 text-center p-3 border-b border-border-2 text-muted-foreground">
                DATE
              </TableHead>
              <TableHead className="sticky top-0 z-10 text-center p-3 border-b border-border-2 text-muted-foreground">
                REF
              </TableHead>
              <TableHead className="sticky top-0 z-10 text-center p-3 border-b border-border-2 text-muted-foreground">
                NAME
              </TableHead>
              <TableHead className="sticky top-0 z-10 text-center p-3 border-b border-border-2 text-muted-foreground">
                ROOM
              </TableHead>
              <TableHead className="sticky top-0 z-10 text-center p-3 border-b border-border-2 text-muted-foreground w-48">
                LOANS
              </TableHead>
              <TableHead className="sticky top-0 z-10 text-center p-3 border-b border-border-2 text-muted-foreground">
                BAG STORAGE
              </TableHead>
              <TableHead className="sticky top-0 z-10 text-center p-3 border-b border-border-2 text-muted-foreground">
                FRIDGE
              </TableHead>
              <TableHead className="sticky top-0 z-10 text-center p-3 border-b border-border-2 text-muted-foreground w-32">
                COMPLETE
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGuests.map((guest, index) => {
              const loanEntries = guest.loans
                ? Object.entries(guest.loans)
                : [];
              const rowBg =
                index % 2 === 0
                  ? "bg-surface"
                  : "bg-surface-2";

              return (
                <TableRow key={guest._key || guest.guestId} className={rowBg}>
                  <TableCell className="p-3 border-b border-border-2">
                    {formatDdMm(guest.checkoutDate)}
                  </TableCell>
                  <TableCell className="p-3 border-b border-border-2">
                    {guest.bookingRef}
                  </TableCell>
                  <TableCell className="p-3 border-b border-border-2">
                    {guest.firstName} {guest.lastName}
                  </TableCell>
                  <TableCell className="p-3 border-b text-center  border-border-2">
                    {guest.roomAllocated}
                  </TableCell>
                  <TableCell className="p-3 border-b border-border-2 w-48">
                    {loanEntries.map(([txnKey, loan]) => {
                      console.debug(
                        `[CheckoutTable] Loan entry ${txnKey}:`,
                        loan
                      );
                      const { Icon: LoanIcon, colorClass } = getLoanIcon(
                        loan.item,
                        loan.depositType
                      );
                      const loanTitle = getLoanTitle(
                        loan.item,
                        loan.depositType
                      );
                      return (
                        <Button
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
                          className="inline-flex items-center px-1 me-1 text-foreground hover:text-foreground transition-colors duration-200"
                          title={loanTitle}
                        >
                          <LoanIcon size={18} className={colorClass} aria-hidden="true" />
                        </Button>
                      );
                    })}
                  </TableCell>
                  {/* Show an icon if the occupant opted into bag storage */}
                  <TableCell className="p-3 border-b border-border-2 text-center">
                    {guest.bagStorageOptedIn && (
                      <span title="Bag Storage">
                        <Luggage size={18} className="text-primary-main inline-block" aria-hidden="true" />
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="p-3 border-b border-border-2">
                    {guest.fridge || ""}
                  </TableCell>
                  <TableCell className="p-3 border-b border-border-2 text-center">
                    <Button
                      onClick={() =>
                        onComplete(
                          guest.bookingRef,
                          guest.guestId,
                          guest.isCompleted,
                          guest.checkoutDate
                        )
                      }
                      className={`px-4 py-2 rounded-lg text-primary-fg transition-colors duration-200 ${
                        guest.isCompleted
                          ? "bg-success-main hover:bg-error-main"
                          : "bg-primary-main hover:bg-primary-dark"
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
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
);

CheckoutTable.displayName = "CheckoutTable";

export default CheckoutTable;
