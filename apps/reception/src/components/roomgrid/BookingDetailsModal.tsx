/** /src/components/roomgrid/BookingDetailsModal.tsx
 * BookingDetailsModal:
 * Displays details about a booking in a modal.
 *
 * How to avoid breaking other code:
 * - This component is standalone; it only handles the UI for displaying booking details.
 * - Do not alter the data structure of the booking details passed as props.
 */

import type { FC } from "react";
import { memo, useCallback, useState } from "react";

import useRoomConfigs from "../../hooks/client/checkin/useRoomConfigs";
import useGuestByRoomData from "../../hooks/data/roomgrid/useGuestByRoomData";
import useBookings from "../../hooks/data/useBookingsData";
import useAllocateRoom from "../../hooks/mutations/useAllocateRoom";

interface BookingDetails {
  roomNumber: string;
  id: string;
  date: string;
  dayType: string;
  dayStatus: string;
  idSuffix?: string;
  titlePrefix?: string;
  info?: string;
  bookingRef?: string;
  occupantId?: string;
  firstName?: string;
  lastName?: string;
}

interface BookingDetailsModalProps {
  bookingDetails: BookingDetails;
  onClose: () => void;
}

const BookingDetailsModal: FC<BookingDetailsModalProps> = ({
  bookingDetails,
  onClose,
}) => {
  const { allocateRoomIfAllowed } = useAllocateRoom();
  const { bookings } = useBookings({
    startAt: bookingDetails.bookingRef,
    endAt: bookingDetails.bookingRef,
  });
  const { guestByRoomData } = useGuestByRoomData();
  const { knownRooms } = useRoomConfigs();
  const [targetRoom, setTargetRoom] = useState<string>("");

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleMoveBooking = useCallback(async () => {
    if (!bookingDetails.bookingRef || !targetRoom) return;
    const occMap = bookings?.[bookingDetails.bookingRef];
    if (!occMap) return;

    const confirmMove = window.confirm(
      `Move all ${Object.keys(occMap).length} guests to room "${targetRoom}"?`
    );
    if (!confirmMove) return;

    for (const occupantId of Object.keys(occMap)) {
      const oldRoomValue = guestByRoomData[occupantId]?.allocated || "";
      await allocateRoomIfAllowed({
        occupantId,
        newRoomValue: targetRoom,
        oldDate: bookingDetails.date,
        oldRoom: `index_${oldRoomValue}`,
        oldBookingRef: bookingDetails.bookingRef,
        oldGuestId: occupantId,
        newDate: bookingDetails.date,
        newRoom: `index_${targetRoom}`,
        newBookingRef: bookingDetails.bookingRef,
        newGuestId: occupantId,
      });
    }
    onClose();
  }, [
    allocateRoomIfAllowed,
    bookingDetails.bookingRef,
    bookingDetails.date,
    bookings,
    guestByRoomData,
    targetRoom,
    onClose,
  ]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="relative bg-white w-full max-w-sm p-6 rounded shadow-lg dark:bg-darkSurface">
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            aria-label="Close"
          >
            <span className="text-lg">&#x2715;</span>
          </button>
          <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
          <div className="mb-4">
            <p>
              <strong>Room Number:</strong> {bookingDetails.roomNumber}
            </p>
            <p>
              <strong>ID:</strong> {bookingDetails.id}
            </p>
            <p>
              <strong>Date:</strong> {bookingDetails.date}
            </p>
            <p>
              <strong>Day Type:</strong> {bookingDetails.dayType}
            </p>
            <p>
              <strong>Day Status:</strong> {bookingDetails.dayStatus}
            </p>
          </div>
          {bookingDetails.bookingRef ? (
            <div className="mb-4">
              <p>
                <strong>Booking Reference:</strong> {bookingDetails.bookingRef}
              </p>
              <p>
                <strong>Occupant ID:</strong> {bookingDetails.occupantId}
              </p>
              <p>
                <strong>First Name:</strong> {bookingDetails.firstName}
              </p>
              <p>
                <strong>Last Name:</strong> {bookingDetails.lastName}
              </p>
              <p>
                <strong>ID Suffix:</strong> {bookingDetails.idSuffix}
              </p>
              <p>
                <strong>Title Prefix:</strong> {bookingDetails.titlePrefix}
              </p>
              <p>
                <strong>Info:</strong> {bookingDetails.info}
              </p>
            </div>
          ) : (
            <p>No booking period details found for the selected date.</p>
          )}
          {bookingDetails.bookingRef && (
            <div className="mt-4 space-y-2">
              <label
                className="block text-sm font-semibold"
                htmlFor="target-room"
              >
                Move booking to room:
              </label>
              <select
                id="target-room"
                className="w-full border rounded p-2 text-gray-900"
                value={targetRoom}
                onChange={(e) => setTargetRoom(e.target.value)}
              >
                <option value="">Select room</option>
                {knownRooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                onClick={handleMoveBooking}
                className="w-full px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Move Booking
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(BookingDetailsModal);
