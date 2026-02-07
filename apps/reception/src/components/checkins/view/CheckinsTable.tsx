import React from "react";

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
}) => (
  <div className="min-h-screen flex flex-col p-5 dark:bg-darkBg dark:text-darkAccentGreen">
    <CheckinsHeader
      onNewBookingClick={onNewBookingClick}
      onEditClick={onEditClick}
      onDeleteClick={onDeleteClick}
      onArchiveClick={onArchiveClick}
      eligibleCount={eligibleCount}
    />
    <div className="flex-grow bg-white rounded-lg shadow p-6 space-y-4 dark:bg-darkSurface">
      <div className="flex items-center justify-between">
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          username={username}
        />
        {roomsReady ? (
          <span className="ms-4 text-green-600 font-semibold dark:text-darkAccentGreen">
            Rooms are Set
          </span>
        ) : (
            <button
            type="button"
            onClick={() => setRoomsReady(true)}
            className="px-3 py-2 bg-green-600 text-white rounded dark:bg-darkAccentGreen dark:text-darkBg"
          >
            Rooms Ready
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-400 text-sm">
          <TableHeader />
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={12}
                  className="p-4 text-center italic text-gray-600 dark:text-darkAccentGreen"
                >
                  Loading...
                </td>
              </tr>
            )}
            {!loading && error != null && (
              <tr>
                <td colSpan={12} className="p-4 text-center text-error-main dark:text-darkAccentOrange">
                  Error: {String(error)}
                </td>
              </tr>
            )}
            {!loading && error == null && finalSortedData.length === 0 && (
              <tr>
                <td
                  colSpan={12}
                  className="p-4 text-center italic text-gray-600 dark:text-darkAccentGreen"
                >
                  No checkins found for this date.
                </td>
              </tr>
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
                />
              ))}
          </tbody>
        </table>
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
