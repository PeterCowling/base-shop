// src/hooks/mutations/useChangeBookingDatesMutator.ts

import { useCallback } from "react";
import { getDatabase, ref, update } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { useOnlineStatus } from "../../lib/offline/useOnlineStatus";
import type { MutationState } from "../../types/hooks/mutations/mutationState";
// Import our utilities:
import { getItalyIsoString } from "../../utils/dateUtils";
import { generateTransactionId } from "../../utils/generateTransactionId";
import useFinancialsRoomMutations from "../mutations/useFinancialsRoomMutations";

import useMutationState from "./useMutationState";

interface UpdateBookingDatesParams {
  bookingRef: string; // e.g. "4092716050"
  occupantId: string; // e.g. "occ_1740508445159"
  oldCheckIn: string; // existing checkInDate before update
  oldCheckOut: string; // existing checkOutDate before update
  newCheckIn: string; // updated checkInDate (YYYY-MM-DD)
  newCheckOut: string; // updated checkOutDate (YYYY-MM-DD)
  extendedPrice?: string; // extension charge if the booking is extended
}

interface UseBookingDatesMutatorReturn extends MutationState<void> {
  updateBookingDates: (params: UpdateBookingDatesParams) => Promise<void>;
}

/**
 * useBookingDatesMutator:
 * - Updates booking dates in the DB.
 * - Syncs checkins/checkouts.
 * - Logs activities.
 * - If extended, records both a "charge" and a "payment" transaction in financialsRoom.
 */
export function useBookingDatesMutator(): UseBookingDatesMutatorReturn {
  const { user } = useAuth();
  const { loading, error, run } = useMutationState();

  const online = useOnlineStatus();
  const db = getDatabase();
  const { saveFinancialsRoom } = useFinancialsRoomMutations();

  const updateBookingDates = useCallback(
    async (params: UpdateBookingDatesParams): Promise<void> => {
      const {
        bookingRef,
        occupantId,
        oldCheckIn,
        oldCheckOut,
        newCheckIn,
        newCheckOut,
        extendedPrice = "0",
      } = params;

      if (!online) {
        throw new Error(
          "Booking date changes require a network connection. Please reconnect and try again."
        );
      }

      await run(async () => {
        // Use Italy-based ISO for logging & transactions
        const nowIso = getItalyIsoString();
        const who = user?.user_name || "System";
        const priceVal = parseFloat(extendedPrice);

        const hasExtension =
          Boolean(newCheckOut) &&
          (!oldCheckOut || newCheckOut > oldCheckOut) &&
          priceVal > 0;

        const chargeTxnKey = hasExtension ? generateTransactionId() : null;
        const paymentTxnKey = hasExtension ? generateTransactionId() : null;
        const extensionTransactions =
          hasExtension && chargeTxnKey && paymentTxnKey
            ? {
                [chargeTxnKey]: {
                  occupantId,
                  bookingRef,
                  amount: priceVal,
                  nonRefundable: true,
                  timestamp: nowIso,
                  type: "charge" as const,
                },
                [paymentTxnKey]: {
                  occupantId,
                  bookingRef,
                  amount: priceVal,
                  nonRefundable: true,
                  timestamp: nowIso,
                  type: "payment" as const,
                },
              }
            : null;

        // Build one atomic multi-path update for booking + checkin/out + activity nodes.
        const updates: Record<string, unknown> = {
          [`bookings/${bookingRef}/${occupantId}/checkInDate`]: newCheckIn,
          [`bookings/${bookingRef}/${occupantId}/checkOutDate`]: newCheckOut,
        };

        // 1) If check-in date changed => update checkins + activity code 19
        if (oldCheckIn !== newCheckIn) {
          if (oldCheckIn) {
            updates[`checkins/${oldCheckIn}/${occupantId}`] = null;
          }
          if (newCheckIn) {
            updates[`checkins/${newCheckIn}/${occupantId}`] = {
              reservationCode: bookingRef,
              timestamp: nowIso,
            };
          }

          const activityId = `act_${crypto.randomUUID()}`;
          updates[`activities/${occupantId}/${activityId}`] = {
            code: 19,
            timestamp: nowIso,
            who,
          };
          updates[`activitiesByCode/19/${occupantId}/${activityId}`] = {
            timestamp: nowIso,
            who,
          };
        }

        // 2) If check-out date changed => update checkouts + activity code 24
        if (oldCheckOut !== newCheckOut) {
          if (oldCheckOut) {
            updates[`checkouts/${oldCheckOut}/${occupantId}`] = null;
          }
          if (newCheckOut) {
            updates[`checkouts/${newCheckOut}/${occupantId}`] = {
              reservationCode: bookingRef,
              timestamp: nowIso,
            };
          }

          const activityId = `act_${crypto.randomUUID()}`;
          updates[`activities/${occupantId}/${activityId}`] = {
            code: 24,
            timestamp: nowIso,
            who,
          };
          updates[`activitiesByCode/24/${occupantId}/${activityId}`] = {
            timestamp: nowIso,
            who,
          };
        }

        // Write extension financial intent before core booking mutation.
        // If the booking write fails, compensate by voiding these transactions.
        if (extensionTransactions) {
          await saveFinancialsRoom(bookingRef, {
            transactions: extensionTransactions,
          });
        }

        try {
          await update(ref(db), updates);
        } catch (coreMutationError) {
          if (extensionTransactions) {
            const compensatedAt = getItalyIsoString();
            const compensationWho = user?.user_name || "System";

            try {
              await saveFinancialsRoom(bookingRef, {
                transactions: Object.fromEntries(
                  Object.entries(extensionTransactions).map(([txnKey, txn]) => [
                    txnKey,
                    {
                      ...txn,
                      voidedAt: compensatedAt,
                      voidedBy: compensationWho,
                      voidReason: "booking-date-update-failed",
                    },
                  ])
                ),
              });
            } catch (compensationError) {
              const coreMessage =
                coreMutationError instanceof Error
                  ? coreMutationError.message
                  : "Unknown booking mutation error";
              const compensationMessage =
                compensationError instanceof Error
                  ? compensationError.message
                  : "Unknown compensation error";
              throw new Error(
                `Booking mutation failed after financial write. Compensation also failed. Core: ${coreMessage}. Compensation: ${compensationMessage}`
              );
            }
          }

          throw coreMutationError;
        }
      });
    },
    [online, db, user?.user_name, saveFinancialsRoom, run]
  );

  return { updateBookingDates, loading, error };
}

export { useBookingDatesMutator as useChangeBookingDatesMutator };
