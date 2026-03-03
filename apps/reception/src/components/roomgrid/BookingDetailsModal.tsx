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

import { Button, ConfirmDialog, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system";
import { SimpleModal } from "@acme/ui/molecules";

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
  const [confirmMoveOpen, setConfirmMoveOpen] = useState(false);
  const [pendingGuestCount, setPendingGuestCount] = useState(0);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleMoveBooking = useCallback(() => {
    if (!bookingDetails.bookingRef || !targetRoom) return;
    const occMap = bookings?.[bookingDetails.bookingRef];
    if (!occMap) return;
    setPendingGuestCount(Object.keys(occMap).length);
    setConfirmMoveOpen(true);
  }, [bookingDetails.bookingRef, bookings, targetRoom]);

  const handleConfirmMoveBooking = useCallback(async () => {
    if (!bookingDetails.bookingRef || !targetRoom) return;
    const occMap = bookings?.[bookingDetails.bookingRef];
    if (!occMap) {
      setConfirmMoveOpen(false);
      return;
    }

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
    setConfirmMoveOpen(false);
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
      <SimpleModal
        isOpen={true}
        onClose={handleClose}
        title="Booking Details"
        maxWidth="max-w-sm"
      >
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
            <Select value={targetRoom} onValueChange={setTargetRoom}>
              <SelectTrigger id="target-room" className="w-full border rounded-lg p-2 text-foreground">
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {knownRooms.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={handleMoveBooking}
              className="w-full px-4 py-2 rounded-lg bg-primary text-primary-fg hover:bg-primary"
            >
              Move Booking
            </Button>
          </div>
        )}
      </SimpleModal>
      <ConfirmDialog
        open={confirmMoveOpen}
        onOpenChange={setConfirmMoveOpen}
        title="Move guests"
        description={`Move all ${pendingGuestCount} guests to room "${targetRoom}"?`}
        confirmLabel="Move"
        onConfirm={() => {
          void handleConfirmMoveBooking();
        }}
      />
    </>
  );
};

export default memo(BookingDetailsModal);
