import React, { FC } from "react";
import { CheckInRow } from "../../../types/component/CheckinRow";
import type { LoanMethod } from "../../../types/hooks/data/loansData";
import CityTaxPaymentButton from "../cityTaxButton/CityTaxPaymentButton";
import DocInsertButton from "../DocInsertButton";
import EmailBookingButton from "../EmailBookingButton";
import KeycardDepositButton from "../keycardButton/KeycardDepositButton";
import BookingNotesModal from "../notes/BookingNotesModal";
import RoomPaymentButton from "../roomButton/roomPaymentButton";
import StatusButton from "../StatusButton";
import TooltipComponent from "../tooltip/Tooltip";

function getKeycardIconClass(depositType?: LoanMethod): string {
  const normalized = depositType ? depositType.toUpperCase() : undefined;

  if (normalized === "NO_CARD") return "fas fa-ban fa-lg text-red-500";
  if (normalized === "CASH") return "fas fa-id-card fa-lg text-green-600";
  if (
    normalized === "PASSPORT" ||
    normalized === "LICENSE" ||
    normalized === "ID"
  ) {
    return "fas fa-id-card fa-lg text-yellow-600";
  }
  return "fas fa-id-card fa-lg text-gray-700";
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
}) => (
  <>
    <tr
      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors text-sm text-gray-700 ${
        onRowClick ? "cursor-pointer" : ""
      } dark:border-darkSurface dark:hover:bg-darkSurface/70 dark:text-darkAccentGreen`}
      onClick={onRowClick}
    >
      <td className="p-4">
        <div className="flex font-semibold">
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
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center justify-center">
          <input
            type="text"
            className="w-16 px-1 py-0.5 border border-gray-300 rounded text-center dark:bg-darkSurface dark:text-darkAccentGreen"
            value={draftValue}
            onChange={(e) => onDraftChange(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </td>
      <td className="p-4">
        <div className="flex justify-center items-center">
          {booking.isFirstForBooking ? (
            <RoomPaymentButton booking={booking} />
          ) : (
            <em className="text-gray-600">—</em>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="flex justify-center items-center">
          <CityTaxPaymentButton booking={booking} />
        </div>
      </td>
      <td className="p-4">
        <div className="flex justify-center items-center gap-2">
          <KeycardDepositButton booking={booking} />
          {(hasKeycard || depositType === "NO_CARD") && depositType && (
            <i
              className={getKeycardIconClass(depositType)}
              title={
                depositType === "NO_CARD"
                  ? "No Card"
                  : depositType === "CASH"
                  ? "Keycard with cash"
                  : "Keycard with document"
              }
            />
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="flex justify-center items-center">
          <StatusButton booking={booking} />
        </div>
      </td>
      <td className="p-4">
        <div className="flex justify-center items-center">
          <DocInsertButton booking={booking} selectedDate={selectedDate} />
        </div>
      </td>
      <td className="p-4">
        <div className="flex justify-center items-center">
          <EmailBookingButton
            bookingRef={booking.bookingRef}
            activities={booking.activities}
            isFirstForBooking={Boolean(booking.isFirstForBooking)}
          />
        </div>
      </td>
    </tr>
    {notesOpen && booking.isFirstForBooking && (
      <tr>
        {/*
          Render the modal inside its own table row so that we keep valid
          table semantics (a <div> directly under <tbody> triggers DOM nesting
          warnings during tests).
        */}
        <td colSpan={8} className="p-0">
          <BookingNotesModal
            bookingRef={booking.bookingRef}
            onClose={closeNotes}
          />
        </td>
      </tr>
    )}
  </>
);

export default BookingRowView;
