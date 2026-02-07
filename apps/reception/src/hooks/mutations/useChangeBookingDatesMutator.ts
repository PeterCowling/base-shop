// src/hooks/mutations/useChangeBookingDatesMutator.ts

import { useCallback, useState } from "react";
import { getDatabase, ref, remove, set, update } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
// Import our utilities:
import { getItalyIsoString } from "../../utils/dateUtils";
import { generateTransactionId } from "../../utils/generateTransactionId";
import useFinancialsRoomMutations from "../mutations/useFinancialsRoomMutations";

interface UpdateBookingDatesParams {
  bookingRef: string; // e.g. "4092716050"
  occupantId: string; // e.g. "occ_1740508445159"
  oldCheckIn: string; // existing checkInDate before update
  oldCheckOut: string; // existing checkOutDate before update
  newCheckIn: string; // updated checkInDate (YYYY-MM-DD)
  newCheckOut: string; // updated checkOutDate (YYYY-MM-DD)
  extendedPrice?: string; // extension charge if the booking is extended
}

/**
 * useBookingDatesMutator:
 * - Updates booking dates in the DB.
 * - Syncs checkins/checkouts.
 * - Logs activities.
 * - If extended, records both a "charge" and a "payment" transaction in financialsRoom.
 */
export function useBookingDatesMutator() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const db = getDatabase();
  const { saveFinancialsRoom } = useFinancialsRoomMutations();

  const updateBookingDates = useCallback(
    async (params: UpdateBookingDatesParams) => {
      const {
        bookingRef,
        occupantId,
        oldCheckIn,
        oldCheckOut,
        newCheckIn,
        newCheckOut,
        extendedPrice = "0",
      } = params;

      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        // 1. Update the "bookings" node with new dates
        const bookingPath = ref(db, `bookings/${bookingRef}/${occupantId}`);
        await update(bookingPath, {
          checkInDate: newCheckIn,
          checkOutDate: newCheckOut,
        });

        // Use Italy-based ISO for logging & transactions
        const nowIso = getItalyIsoString();
        const who = user?.user_name || "System";

        // 2. If check-in date changed => update "checkins" node & activity logs
        if (oldCheckIn !== newCheckIn) {
          if (oldCheckIn) {
            const oldCheckinPath = ref(
              db,
              `checkins/${oldCheckIn}/${occupantId}`
            );
            await remove(oldCheckinPath);
          }
          if (newCheckIn) {
            const newCheckinPath = ref(
              db,
              `checkins/${newCheckIn}/${occupantId}`
            );
            await set(newCheckinPath, {
              reservationCode: bookingRef,
              timestamp: nowIso,
            });
          }

          // Log activity with code=19
          const activityId = `act_${Date.now()}`;
          const occupantActivitiesPath = ref(
            db,
            `activities/${occupantId}/${activityId}`
          );
          await set(occupantActivitiesPath, {
            code: 19,
            timestamp: nowIso,
            who,
          });
          const byCodePath = ref(
            db,
            `activitiesByCode/19/${occupantId}/${activityId}`
          );
          await set(byCodePath, {
            timestamp: nowIso,
            who,
          });
        }

        // 3. If check-out date changed => update "checkouts" node & activity logs
        if (oldCheckOut !== newCheckOut) {
          if (oldCheckOut) {
            const oldCheckoutPath = ref(
              db,
              `checkouts/${oldCheckOut}/${occupantId}`
            );
            await remove(oldCheckoutPath);
          }
          if (newCheckOut) {
            const newCheckoutPath = ref(
              db,
              `checkouts/${newCheckOut}/${occupantId}`
            );
            await set(newCheckoutPath, {
              reservationCode: bookingRef,
              timestamp: nowIso,
            });
          }

          // Log activity with code=24
          const activityId = `act_${Date.now()}`;
          const occupantActivitiesPath = ref(
            db,
            `activities/${occupantId}/${activityId}`
          );
          await set(occupantActivitiesPath, {
            code: 24,
            timestamp: nowIso,
            who,
          });
          const byCodePath = ref(
            db,
            `activitiesByCode/24/${occupantId}/${activityId}`
          );
          await set(byCodePath, {
            timestamp: nowIso,
            who,
          });
        }

        // 4. If extended and extendedPrice>0, add a "charge" + "payment" transaction
        const priceVal = parseFloat(extendedPrice);

        const hasExtension =
          Boolean(newCheckOut) &&
          (!oldCheckOut || newCheckOut > oldCheckOut) &&
          priceVal > 0;

        if (hasExtension) {
          const chargeTxnKey = generateTransactionId();
          const paymentTxnKey = generateTransactionId();

          // Both transactions are nonRefundable per requirement
          const newTxns = {
            [chargeTxnKey]: {
              occupantId,
              bookingRef,
              amount: priceVal,
              nonRefundable: true,
              timestamp: nowIso,
              type: "charge",
            },
            [paymentTxnKey]: {
              occupantId,
              bookingRef,
              amount: priceVal,
              nonRefundable: true,
              timestamp: nowIso,
              type: "payment",
            },
          };

          await saveFinancialsRoom(bookingRef, {
            transactions: newTxns,
          });
        }
      } catch (err: unknown) {
        setIsError(true);
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error("An unknown error occurred."));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [db, user?.user_name, saveFinancialsRoom]
  );

  return { updateBookingDates, isLoading, isError, error };
}
