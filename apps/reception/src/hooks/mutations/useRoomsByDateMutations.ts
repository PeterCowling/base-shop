// src/mutations/useRoomsByDateMutations.ts
import { useCallback, useState } from "react";
import { get, ref, update } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import type { SaveRoomsByDateParams } from "../../types/hooks/mutations/saveRoomsByDateParams";

/**
 * Mutation Hook: Provides methods to update occupant assignments
 * in /roomsByDate.
 *
 * - addOccupantToRoom
 * - removeOccupantFromRoom
 * - saveRoomsByDate (combines remove + add in one step)
 */
export default function useRoomsByDateMutations() {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);

  /**
   * Safely adds an occupantId to a given room on a specific date.
   * Creates an array if none exists.
   */
  const addOccupantToRoom = useCallback(
    async (
      date: string,
      room: string,
      bookingRef: string,
      occupantId: string
    ) => {
      try {
        const path = `roomsByDate/${date}/${room}/${bookingRef}/guestIds`;
        const snapshot = await get(ref(database, path));
        let newArr: string[] = [];

        if (snapshot.exists()) {
          const existingArr = snapshot.val() as string[];
          newArr = existingArr.includes(occupantId)
            ? existingArr
            : [...existingArr, occupantId];
        } else {
          newArr = [occupantId];
        }

        await update(
          ref(database, `roomsByDate/${date}/${room}/${bookingRef}`),
          {
            guestIds: newArr,
          }
        );
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [database]
  );

  /**
   * Safely removes an occupantId from a specific room on a given date.
   */
  const removeOccupantFromRoom = useCallback(
    async (
      date: string,
      room: string,
      bookingRef: string,
      occupantId: string
    ) => {
      try {
        const path = `roomsByDate/${date}/${room}/${bookingRef}/guestIds`;
        const snapshot = await get(ref(database, path));
        if (snapshot.exists()) {
          const existingArr = snapshot.val() as string[];
          const newArr = existingArr.filter((id) => id !== occupantId);

          await update(
            ref(database, `roomsByDate/${date}/${room}/${bookingRef}`),
            {
              guestIds: newArr,
            }
          );
        }
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [database]
  );

  /**
   * Combines remove + add occupant across old/new date or room.
   */
  const saveRoomsByDate = useCallback(
    async (params: SaveRoomsByDateParams): Promise<void> => {
      const {
        oldDate,
        oldRoom,
        oldBookingRef,
        oldGuestId,
        newDate,
        newRoom,
        newBookingRef,
        newGuestId,
      } = params;

      try {
        // Remove occupant from old location if specified
        if (oldDate && oldRoom && oldBookingRef && oldGuestId) {
          await removeOccupantFromRoom(
            oldDate,
            oldRoom,
            oldBookingRef,
            oldGuestId
          );
        }
        // Add occupant to new location if specified
        if (newDate && newRoom && newBookingRef && newGuestId) {
          await addOccupantToRoom(newDate, newRoom, newBookingRef, newGuestId);
        }
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [removeOccupantFromRoom, addOccupantToRoom]
  );

  return {
    addOccupantToRoom,
    removeOccupantFromRoom,
    saveRoomsByDate,
    error,
  };
}

// Re-export the type so that other modules can import it as a named export.
export type { SaveRoomsByDateParams };
