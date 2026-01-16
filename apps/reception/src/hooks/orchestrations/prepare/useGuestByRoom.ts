// File: src/hooks/data/useGuestByRoom.ts

import React from "react";
import type { GuestByRoom } from "../../../types/hooks/data/guestByRoomData";
import useFirebaseSubscription from "../../data/useFirebaseSubscription";

/**
 * Pure Data Hook:
 * Subscribes to "guestByRoom" and returns the occupant-to-room mapping.
 */
export function useGuestByRoom() {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<GuestByRoom>("guestByRoom");

  const [guestByRoom, setGuestByRoom] = React.useState<GuestByRoom | null>(
    null
  );
  const [error, setError] = React.useState<unknown>(subError);

  React.useEffect(() => {
    if (subError) {
      setError(subError);
      return;
    }
    if (!data) {
      setGuestByRoom(null);
    } else {
      setGuestByRoom(data);
    }
  }, [data, subError]);

  return {
    guestByRoom,
    loading,
    error,
  };
}
