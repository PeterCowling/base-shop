import { useCallback, useEffect, useState } from "react";

import type { CheckInRow } from "../../types/component/CheckinRow";
import { confirmAndAllocateRoom } from "../../utils/confirmAndAllocateRoom";
import useAllocateRoom from "../mutations/useAllocateRoom";

interface Params {
  booking: CheckInRow;
  selectedDate: string;
  allGuests: CheckInRow[];
}

export default function useRoomAllocation({
  booking,
  selectedDate,
  allGuests,
}: Params) {
  const [roomValue, setRoomValue] = useState(booking.roomAllocated || "");
  const [draftValue, setDraftValue] = useState(roomValue);

  useEffect(() => {
    if (!booking.isFirstForBooking) {
      const newVal = booking.roomAllocated || "";
      setRoomValue(newVal);
      setDraftValue(newVal);
    }
  }, [booking.roomAllocated, booking.isFirstForBooking]);

  const { allocateRoomIfAllowed } = useAllocateRoom();

  const attemptRoomAllocation = useCallback(() => {
    const allocateSingle = () =>
      allocateRoomIfAllowed({
        occupantId: booking.occupantId,
        newRoomValue: draftValue,
        oldDate: selectedDate,
        oldRoom: `index_${roomValue}`,
        oldBookingRef: booking.bookingRef,
        oldGuestId: booking.occupantId,
        newDate: selectedDate,
        newRoom: `index_${draftValue}`,
        newBookingRef: booking.bookingRef,
        newGuestId: booking.occupantId,
      });

    const allocateAll = async () => {
      for (const guest of allGuests) {
        if (guest.occupantId === booking.occupantId) {
          await allocateSingle();
        } else {
          await allocateRoomIfAllowed({
            occupantId: guest.occupantId,
            newRoomValue: draftValue,
            oldDate: selectedDate,
            oldRoom: `index_${guest.roomAllocated}`,
            oldBookingRef: guest.bookingRef,
            oldGuestId: guest.occupantId,
            newDate: selectedDate,
            newRoom: `index_${draftValue}`,
            newBookingRef: guest.bookingRef,
            newGuestId: guest.occupantId,
          });
        }
      }
    };

    confirmAndAllocateRoom({
      occupantId: booking.occupantId,
      oldRoomValue: roomValue,
      newRoomValue: draftValue,
      onConfirm: allocateSingle,
      onConfirmAll: allGuests.length > 1 ? allocateAll : undefined,
      occupantCount: allGuests.length,
      onSuccess: (dbAllocatedValue) => {
        setRoomValue(dbAllocatedValue);
        setDraftValue(dbAllocatedValue);
      },
      onCancel: () => setDraftValue(roomValue),
      onDismiss: () => setDraftValue(roomValue),
    });
  }, [
    booking.occupantId,
    booking.bookingRef,
    draftValue,
    roomValue,
    selectedDate,
    allocateRoomIfAllowed,
    allGuests,
  ]);

  const handleBlur = useCallback(() => {
    attemptRoomAllocation();
  }, [attemptRoomAllocation]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        attemptRoomAllocation();
      }
    },
    [attemptRoomAllocation]
  );

  return {
    draftValue,
    setDraftValue,
    handleBlur,
    handleKeyDown,
  };
}
