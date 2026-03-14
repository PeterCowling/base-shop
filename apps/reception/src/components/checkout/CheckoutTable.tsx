// File: /src/components/checkout/CheckoutTable.tsx

import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Ban, Check, CircleHelp, Cloud, Lock, Luggage, Refrigerator, Umbrella, Wind, X } from "lucide-react";

import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";

import { type LoanMethod } from "../../types/hooks/data/loansData";
import { formatDdMm } from "../../utils/dateUtils";
import { getKeycardIcon } from "../../utils/keycardIcon";
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
  fridgeUsed?: boolean;
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
  onToggleFridge?: (
    guestId: string,
    bookingRef: string,
    currentValue: boolean
  ) => void;
  pendingFridgeOccupantIds?: Set<string>;
  onToggleBagStorage?: (
    guestId: string,
    bookingRef: string,
    currentValue: boolean
  ) => void;
  pendingBagStorageOccupantIds?: Set<string>;
}

/**
 * Returns the Lucide icon component and color class for a given loan item type.
 */
export function getLoanIcon(
  item: string,
  depositType?: LoanMethod | string
): { Icon: LucideIcon; colorClass: string } {
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
      return getKeycardIcon(depositType);
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
  ({
    guests,
    removeLoanItem,
    onComplete,
    onToggleFridge,
    pendingFridgeOccupantIds = new Set(),
    onToggleBagStorage,
    pendingBagStorageOccupantIds = new Set(),
  }) => {
    // Tracks which loan txnKey is awaiting removal confirmation (null = none pending)
    const [pendingRemovalKey, setPendingRemovalKey] = useState<string | null>(null);

    if (!guests || guests.length === 0) {
      return (
        <div className="bg-surface border border-border-2 rounded-lg shadow-md p-8 text-center italic text-muted-foreground">
          No checkouts found for this date.
        </div>
      );
    }

    // Use the new utility to get a properly sorted list of guests
    const sortedGuests = sortCheckoutsData(guests);

    return (
      <div className="bg-surface border border-border-2 rounded-lg shadow-md overflow-x-auto">
        <Table className="w-full border-collapse" aria-label="checkout table">
          <TableHeader className="sticky top-0 z-10 backdrop-blur-sm bg-surface-2/80">
            <TableRow>
              <TableHead className="text-center p-3 border-b border-border-2 text-muted-foreground">
                DATE
              </TableHead>
              <TableHead className="text-center p-3 border-b border-border-2 text-muted-foreground">
                REF
              </TableHead>
              <TableHead className="text-center p-3 border-b border-border-2 text-muted-foreground">
                NAME
              </TableHead>
              <TableHead className="text-center p-3 border-b border-border-2 text-muted-foreground">
                ROOM
              </TableHead>
              <TableHead className="text-center p-3 border-b border-border-2 text-muted-foreground w-48">
                LOANS
              </TableHead>
              <TableHead className="text-center p-3 border-b border-border-2 text-muted-foreground">
                BAG STORAGE
              </TableHead>
              <TableHead className="text-center p-3 border-b border-border-2 text-muted-foreground">
                FRIDGE
              </TableHead>
              <TableHead className="text-center p-3 border-b border-border-2 text-muted-foreground w-32">
                COMPLETE
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGuests.map((guest) => {
              const loanEntries = guest.loans
                ? Object.entries(guest.loans)
                : [];
              return (
                <TableRow key={guest._key || guest.guestId} className="hover:bg-table-row-hover odd:bg-table-row-alt transition-colors">
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
                  {/* LOANS: first click enters confirm mode; second click (confirm) removes */}
                  <TableCell className="p-3 border-b border-border-2 w-48">
                    {loanEntries.map(([txnKey, loan]) => {
                      const { Icon: LoanIcon, colorClass } = getLoanIcon(
                        loan.item,
                        loan.depositType
                      );
                      const loanTitle = getLoanTitle(
                        loan.item,
                        loan.depositType
                      );
                      const isPending = pendingRemovalKey === txnKey;
                      return (
                        <span key={txnKey} className="inline-flex items-center">
                          {isPending ? (
                            <>
                              <Button
                                onClick={() => {
                                  removeLoanItem(
                                    guest.bookingRef,
                                    guest.guestId,
                                    txnKey,
                                    loan.item,
                                    loan.depositType
                                  );
                                  setPendingRemovalKey(null);
                                }}
                                aria-label={`Confirm remove ${loanTitle}`}
                                className="inline-flex items-center px-1 text-error-main hover:text-error-dark transition-colors duration-200"
                                title={`Confirm remove ${loanTitle}`}
                              >
                                <Check size={16} aria-hidden="true" />
                              </Button>
                              <Button
                                onClick={() => setPendingRemovalKey(null)}
                                aria-label={`Cancel remove ${loanTitle}`}
                                className="inline-flex items-center px-1 text-muted-foreground hover:text-foreground transition-colors duration-200"
                                title="Cancel"
                              >
                                <X size={14} aria-hidden="true" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => setPendingRemovalKey(txnKey)}
                              aria-label={`Remove ${loanTitle}`}
                              className="inline-flex items-center px-1 me-1 text-foreground hover:text-foreground transition-colors duration-200"
                              title={loanTitle}
                            >
                              <LoanIcon size={18} className={colorClass} aria-hidden="true" />
                            </Button>
                          )}
                        </span>
                      );
                    })}
                  </TableCell>
                  {/* BAG STORAGE: single toggle button, highlighted when opted in */}
                  <TableCell className="p-3 border-b border-border-2 text-center">
                    <Button
                      onClick={() =>
                        onToggleBagStorage?.(
                          guest.guestId,
                          guest.bookingRef,
                          guest.bagStorageOptedIn ?? false
                        )
                      }
                      disabled={pendingBagStorageOccupantIds.has(guest.guestId)}
                      aria-label={`Toggle bag storage for ${guest.guestId}`}
                      className={`inline-flex items-center px-1 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                        guest.bagStorageOptedIn
                          ? "text-primary-main"
                          : "text-muted-foreground"
                      }`}
                      title={guest.bagStorageOptedIn ? "Remove bag storage opt-in" : "Mark bag storage opt-in"}
                    >
                      <Luggage size={18} aria-hidden="true" />
                    </Button>
                  </TableCell>
                  {/* FRIDGE: single toggle button, highlighted when used */}
                  <TableCell className="p-3 border-b border-border-2 text-center">
                    <Button
                      onClick={() =>
                        onToggleFridge?.(
                          guest.guestId,
                          guest.bookingRef,
                          guest.fridgeUsed ?? false
                        )
                      }
                      disabled={pendingFridgeOccupantIds.has(guest.guestId)}
                      aria-label={`Toggle fridge storage for ${guest.guestId}`}
                      className={`inline-flex items-center px-1 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                        guest.fridgeUsed
                          ? "text-primary-main"
                          : "text-muted-foreground"
                      }`}
                      title={guest.fridgeUsed ? "Unmark fridge used" : "Mark fridge used"}
                    >
                      <Refrigerator size={18} aria-hidden="true" />
                    </Button>
                  </TableCell>
                  {/* COMPLETE: green + "Undo" when done, blue + "Complete" when pending */}
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
                          ? "bg-success-main hover:bg-success-dark"
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
                      {guest.isCompleted ? "Undo" : "Complete"}
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
