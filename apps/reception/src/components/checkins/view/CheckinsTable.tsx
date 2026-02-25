import React from "react";

import { Input } from "@acme/design-system";
import { Button, Table, TableBody, TableCell, TableRow } from "@acme/design-system/atoms";

import { type CheckInRow } from "../../../types/component/CheckinRow";
import BookingRow from "../BookingRow";
import DateSelector from "../DateSelector";
import ArchiveConfirmationModal from "../header/ArchiveConfirmationModal";
import BookingModal from "../header/BookingModal";
import CheckinsHeader from "../header/CheckinsHeader";
import DeleteConfirmationModal from "../header/DeleteConfirmationModal";
import TableHeader from "../TableHeader";

interface Props {
  selectedDate: string;
  onDateChange: (d: string) => void;
  username?: string;
  roomsReady: boolean;
  setRoomsReady: (v: boolean) => void;
  loading: boolean;
  error: unknown;
  finalSortedData: CheckInRow[];
  guestsByBooking: Record<string, CheckInRow[]>;
  eligibleCount: number;
  isEditMode: boolean;
  isDeleteMode: boolean;
  isAddGuestMode: boolean;
  onRowClick: (booking: CheckInRow) => void;
  onNewBookingClick: React.MouseEventHandler<HTMLButtonElement>;
  onEditClick: React.MouseEventHandler<HTMLButtonElement>;
  onDeleteClick: React.MouseEventHandler<HTMLButtonElement>;
  onArchiveClick: React.MouseEventHandler<HTMLButtonElement>;
  selectedBooking: CheckInRow | null;
  bookingToDelete: CheckInRow | null;
  showArchiveModal: boolean;
  closeSelectedBooking: () => void;
  closeBookingToDelete: () => void;
  closeArchiveModal: () => void;
  /** Callback after archiving completes */
  onArchiveComplete: () => void;
  /** Show/hide cancelled bookings toggle */
  showCancelled: boolean;
  onToggleCancelled: () => void;
  /** Booking statuses map (bookingRef -> status) */
  bookingStatuses: Record<string, string | undefined>;
}

const CheckinsTableView: React.FC<Props> = ({
  selectedDate,
  onDateChange,
  username,
  roomsReady,
  setRoomsReady,
  loading,
  error,
  finalSortedData,
  guestsByBooking,
  eligibleCount,
  isEditMode,
  isDeleteMode,
  isAddGuestMode,
  onRowClick,
  onNewBookingClick,
  onEditClick,
  onDeleteClick,
  onArchiveClick,
  selectedBooking,
  bookingToDelete,
  showArchiveModal,
  closeSelectedBooking,
  closeBookingToDelete,
  closeArchiveModal,
  onArchiveComplete,
  showCancelled,
  onToggleCancelled,
  bookingStatuses,
}) => (
  <div className="min-h-screen flex flex-col p-5">
    <CheckinsHeader
      onNewBookingClick={onNewBookingClick}
      onEditClick={onEditClick}
      onDeleteClick={onDeleteClick}
      onArchiveClick={onArchiveClick}
      eligibleCount={eligibleCount}
    />
    <div className="flex-grow bg-surface rounded-xl shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            username={username}
          />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Input compatibilityMode="no-wrapper"
              type="checkbox"
              checked={showCancelled}
              onChange={onToggleCancelled}
              className="w-4 h-4 cursor-pointer"
            />
            <span>Show cancelled</span>
          </label>
        </div>
        {roomsReady ? (
          <span className="ms-4 text-success-main font-semibold">
            Rooms are Set
          </span>
        ) : (
            <Button
            type="button"
            onClick={() => setRoomsReady(true)}
            className="px-3 py-2 bg-success-main text-primary-fg rounded"
          >
            Rooms Ready
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table className="w-full table-auto border border-border-2 text-sm">
          <TableHeader />
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="p-4 text-center italic text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && error != null && (
              <TableRow>
                <TableCell colSpan={12} className="p-4 text-center text-error-main">
                  Error: {String(error)}
                </TableCell>
              </TableRow>
            )}
            {!loading && error == null && finalSortedData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="p-4 text-center italic text-muted-foreground"
                >
                  No checkins found for this date.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              error == null &&
              finalSortedData.length > 0 &&
              finalSortedData.map((guestRow) => (
                <BookingRow
                  key={`${guestRow.bookingRef}_${guestRow.occupantId}`}
                  booking={guestRow}
                  selectedDate={selectedDate}
                  allGuests={guestsByBooking[guestRow.bookingRef] || []}
                  onRowClick={
                    isEditMode || isDeleteMode || isAddGuestMode
                      ? onRowClick
                      : undefined
                  }
                  isCancelled={bookingStatuses[guestRow.bookingRef] === "cancelled"}
                />
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
    {selectedBooking && (
      <BookingModal booking={selectedBooking} onClose={closeSelectedBooking} />
    )}
    {bookingToDelete && (
      <DeleteConfirmationModal
        booking={bookingToDelete}
        onClose={closeBookingToDelete}
      />
    )}
    {showArchiveModal && (
      <ArchiveConfirmationModal
        onClose={closeArchiveModal}
        onArchiveComplete={onArchiveComplete}
      />
    )}
  </div>
);

export default CheckinsTableView;
