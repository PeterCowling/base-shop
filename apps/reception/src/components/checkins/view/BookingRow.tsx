import React, { type FC } from "react";
import type { LucideIcon } from "lucide-react";
import { Ban, CreditCard, FileText } from "lucide-react";

import { Input } from "@acme/design-system";
import { TableCell, TableRow } from "@acme/design-system/atoms";

import { type CheckInRow } from "../../../types/component/CheckinRow";
import type { Activity } from "../../../types/hooks/data/activitiesData";
import type { LoanMethod } from "../../../types/hooks/data/loansData";
import CityTaxPaymentButton from "../cityTaxButton/CityTaxPaymentButton";
import DocInsertButton from "../DocInsertButton";
import EmailBookingButton from "../EmailBookingButton";
import KeycardDepositButton from "../keycardButton/KeycardDepositButton";
import BookingNotesModal from "../notes/BookingNotesModal";
import RoomPaymentButton from "../roomButton/roomPaymentButton";
import StatusButton from "../StatusButton";
import TooltipComponent from "../tooltip/Tooltip";

function getKeycardIcon(
  depositType?: LoanMethod
): { Icon: LucideIcon; colorClass: string } {
  const normalized = depositType ? depositType.toUpperCase() : undefined;

  if (normalized === "NO_CARD") return { Icon: Ban, colorClass: "text-error-main" };
  if (normalized === "CASH") return { Icon: CreditCard, colorClass: "text-success-main" };
  if (
    normalized === "PASSPORT" ||
    normalized === "LICENSE" ||
    normalized === "ID"
  ) {
    return { Icon: FileText, colorClass: "text-warning-main" };
  }
  return { Icon: CreditCard, colorClass: "text-muted-foreground" };
}

interface BookingRowViewProps {
  booking: CheckInRow;
  selectedDate: string;
  draftValue: string;
  onDraftChange: (v: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRowClick?: () => void;
  onNameDoubleClick: (e: React.MouseEvent<HTMLSpanElement>) => void;
  hasKeycard: boolean;
  depositType?: LoanMethod;
  notesText?: string;
  notesOpen: boolean;
  closeNotes: () => void;
  isCancelled?: boolean;
}

const BookingRowView: FC<BookingRowViewProps> = ({
  booking,
  selectedDate,
  draftValue,
  onDraftChange,
  onBlur,
  onKeyDown,
  onRowClick,
  onNameDoubleClick,
  hasKeycard,
  depositType,
  notesText,
  notesOpen,
  closeNotes,
  isCancelled,
}) => (
  <>
    <TableRow
      className={`border-b border-border-2 hover:bg-surface-2 transition-colors text-sm text-foreground ${
        onRowClick ? "cursor-pointer" : ""
      }`}
      onClick={onRowClick}
    >
      <TableCell className="px-3 py-2">
        <div className="flex items-center gap-2 font-semibold">
          <TooltipComponent
            booking={{
              personalDetails: {
                firstName: booking.firstName,
                lastName: booking.lastName,
                reservationCode: booking.bookingRef,
                room: {
                  booked: booking.roomBooked,
                  allocated: booking.roomAllocated,
                },
              },
              notes: notesText,
            }}
            onDoubleClick={onNameDoubleClick}
          />
          {isCancelled && (
            <span className="px-2 py-0.5 text-xs font-bold text-primary-fg/100 bg-error-main/100 rounded-md">
              CANCELLED
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="px-3 py-2">
        <div className="flex items-center justify-center">
          <Input compatibilityMode="no-wrapper"
            type="text"
            className="w-10 px-0.5 py-0.5 border-0 border-b border-border-2 text-center bg-transparent text-foreground text-sm font-mono focus:outline-none focus:border-primary-main/100"
            value={draftValue}
            onChange={(e) => onDraftChange(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </TableCell>
      <TableCell className="px-3 py-2">
        <div className="text-center">
          {booking.isFirstForBooking ? (
            <RoomPaymentButton booking={booking} />
          ) : (
            <em className="text-muted-foreground text-xs">—</em>
          )}
        </div>
      </TableCell>
      <TableCell className="px-3 py-2">
        <div className="flex justify-center items-center">
          <CityTaxPaymentButton booking={booking} />
        </div>
      </TableCell>
      <TableCell className="px-3 py-2">
        <div className="flex justify-center items-center gap-1.5">
          <KeycardDepositButton booking={booking} />
          {(hasKeycard || depositType === "NO_CARD") && depositType && (() => {
            const { Icon: KeycardIcon, colorClass } = getKeycardIcon(depositType);
            const iconTitle =
              depositType === "NO_CARD"
                ? "No Card"
                : depositType === "CASH"
                ? "Keycard with cash"
                : "Keycard with document";
            return (
              <span title={iconTitle}>
                <KeycardIcon size={16} className={colorClass} aria-hidden="true" />
              </span>
            );
          })()}
        </div>
      </TableCell>
      <TableCell className="px-3 py-2">
        <div className="flex justify-center items-center">
          <StatusButton booking={booking} />
        </div>
      </TableCell>
      <TableCell className="px-3 py-2">
        <div className="flex justify-center items-center">
          <DocInsertButton booking={booking} selectedDate={selectedDate} />
        </div>
      </TableCell>
      <TableCell className="px-3 py-2">
        <div className="flex justify-center items-center">
          <EmailBookingButton
            bookingRef={booking.bookingRef}
            activities={(booking.activities ?? []) as Activity[]}
            isFirstForBooking={Boolean(booking.isFirstForBooking)}
          />
        </div>
      </TableCell>
    </TableRow>
    {notesOpen && booking.isFirstForBooking && (
      <TableRow>
        {/*
          Render the modal inside its own table row so that we keep valid
          table semantics (a <div> directly under <TableBody> triggers DOM nesting
          warnings during tests).
        */}
        <TableCell colSpan={8} className="p-0">
          <BookingNotesModal
            bookingRef={booking.bookingRef}
            onClose={closeNotes}
          />
        </TableCell>
      </TableRow>
    )}
  </>
);

export default BookingRowView;
