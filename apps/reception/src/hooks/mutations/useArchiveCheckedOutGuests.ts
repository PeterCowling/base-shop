import { get, ref, update } from "firebase/database";
import { useCallback, useState } from "react";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { getLocalToday } from "../../utils/dateUtils";


interface CheckoutRecord {
  reservationCode?: string;
  timestamp?: string;
}

interface CheckoutsNode {
  [dateKey: string]: Record<string, CheckoutRecord>;
}

/**
 * Mutation hook that archives guest records that have checked out but are still present under /bookings.
 *
 * It moves data from active nodes (bookings, guestsDetails, activities, etc.) to corresponding
 * paths under /archive and then removes the active entries.
 */
export default function useArchiveCheckedOutGuests() {
  const database = useFirebaseDatabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const archiveCheckedOutGuests = useCallback(async (): Promise<void> => {
    if (!database) {
      setError("Database not initialized.");
      return;
    }

    setLoading(true);
    setError(null);

    const today = getLocalToday();

    try {
      const checkoutsSnap = await get(ref(database, "checkouts"));
      if (!checkoutsSnap.exists()) {
        setLoading(false);
        return;
      }

      const checkouts = checkoutsSnap.val() as CheckoutsNode;
      const occupantMap: Record<
        string,
        { bookingRef: string; dateKey: string }
      > = {};
      const bookingGroups: Record<
        string,
        { earliestDate: string; occupantIds: string[] }
      > = {};

      for (const [dateKey, occMap] of Object.entries(checkouts)) {
        if (dateKey >= today) continue;
        for (const [occId, rec] of Object.entries(occMap)) {
          const bookingRef = rec?.reservationCode;
          if (!bookingRef) {
            continue;
          }

          occupantMap[occId] = { bookingRef, dateKey };

          if (bookingGroups[bookingRef]) {
            const group = bookingGroups[bookingRef];
            if (dateKey < group.earliestDate) {
              group.earliestDate = dateKey;
            }
            group.occupantIds.push(occId);
          } else {
            bookingGroups[bookingRef] = {
              earliestDate: dateKey,
              occupantIds: [occId],
            };
          }
        }
      }

      const sortedBookings = Object.entries(bookingGroups)
        .filter(([, data]) => data.earliestDate < today)
        .sort((a, b) => a[1].earliestDate.localeCompare(b[1].earliestDate))
        .slice(0, 50);

      if (!sortedBookings.length) {
        setLoading(false);
        return;
      }

      const activitiesByCodeSnap = await get(ref(database, "activitiesByCode"));
      const activitiesByCode = activitiesByCodeSnap.exists()
        ? (activitiesByCodeSnap.val() as Record<
            string,
            Record<string, unknown>
          >)
        : {};

      const updates: Record<string, unknown> = {};

      for (const [bookingRef, { occupantIds }] of sortedBookings) {
        const bookingRefSnap = await get(
          ref(database, `bookings/${bookingRef}`)
        );
        const bookingRefData = bookingRefSnap.exists()
          ? (bookingRefSnap.val() as Record<string, unknown>)
          : null;
        const allOccIds = bookingRefData ? Object.keys(bookingRefData) : [];

        for (const occupantId of occupantIds) {
          const { dateKey } = occupantMap[occupantId];
          const bookingSnap = await get(
            ref(database, `bookings/${bookingRef}/${occupantId}`)
          );
          if (!bookingSnap.exists()) {
            continue;
          }

          const bookingData = bookingSnap.val();
          const checkInDate: string | undefined = bookingData?.checkInDate;
          const checkOutDate: string | undefined = bookingData?.checkOutDate;
          const roomNumbers: string[] = bookingData?.roomNumbers || [];

          // guestsDetails
          const guestDetailsSnap = await get(
            ref(database, `guestsDetails/${bookingRef}/${occupantId}`)
          );
          const guestDetailsData = guestDetailsSnap.exists()
            ? guestDetailsSnap.val()
            : null;

          // activities
          const activitiesSnap = await get(
            ref(database, `activities/${occupantId}`)
          );
          const activitiesData = activitiesSnap.exists()
            ? activitiesSnap.val()
            : null;

          // activitiesByCode for this occupant
          const actsByCodeForOcc: Record<string, unknown> = {};
          for (const [codeKey, occMap] of Object.entries(activitiesByCode)) {
            if (occMap && occMap[occupantId]) {
              actsByCodeForOcc[codeKey] = occMap[occupantId];
              updates[`activitiesByCode/${codeKey}/${occupantId}`] = null;
            }
          }

          // cityTax
          const cityTaxSnap = await get(
            ref(database, `cityTax/${bookingRef}/${occupantId}`)
          );
          const cityTaxData = cityTaxSnap.exists() ? cityTaxSnap.val() : null;

          // completedTasks
          const completedTasksSnap = await get(
            ref(database, `completedTasks/${occupantId}`)
          );
          const completedTasksData = completedTasksSnap.exists()
            ? completedTasksSnap.val()
            : null;

          // guestByRoom
          const guestByRoomSnap = await get(
            ref(database, `guestByRoom/${occupantId}`)
          );
          const guestByRoomData = guestByRoomSnap.exists()
            ? guestByRoomSnap.val()
            : null;

          // guestsByBooking
          const guestsByBookingSnap = await get(
            ref(database, `guestsByBooking/${occupantId}`)
          );
          const guestsByBookingData = guestsByBookingSnap.exists()
            ? guestsByBookingSnap.val()
            : null;

          // bagStorage
          const bagStorageSnap = await get(
            ref(database, `bagStorage/${occupantId}`)
          );
          const bagStorageData = bagStorageSnap.exists()
            ? bagStorageSnap.val()
            : null;

          // preorder
          const preorderSnap = await get(
            ref(database, `preorder/${occupantId}`)
          );
          const preorderData = preorderSnap.exists()
            ? preorderSnap.val()
            : null;

          // check-in record
          let checkinData: unknown = null;
          if (checkInDate) {
            const checkinSnap = await get(
              ref(database, `checkins/${checkInDate}/${occupantId}`)
            );
            if (checkinSnap.exists()) {
              checkinData = checkinSnap.val();
              updates[`checkins/${checkInDate}/${occupantId}`] = null;
            }
          }

          // check-out record
          const finalCheckoutDate = checkOutDate || dateKey;
          let checkoutData: unknown = null;
          const checkoutSnap = await get(
            ref(database, `checkouts/${finalCheckoutDate}/${occupantId}`)
          );
          if (checkoutSnap.exists()) {
            checkoutData = checkoutSnap.val();
            updates[`checkouts/${finalCheckoutDate}/${occupantId}`] = null;
          }
          if (checkOutDate && checkOutDate !== dateKey) {
            updates[`checkouts/${dateKey}/${occupantId}`] = null;
          }

          // roomByDate guestIds cleanup
          if (checkInDate && roomNumbers.length) {
            for (const roomNumber of roomNumbers) {
              const roomIndex = `index_${roomNumber}`;
              const rbdPath = `roomByDate/${checkInDate}/${roomIndex}/${roomNumber}`;
              const rbdSnap = await get(ref(database, rbdPath));
              if (rbdSnap.exists()) {
                const data = rbdSnap.val() as { guestIds?: string[] };
                if (
                  Array.isArray(data.guestIds) &&
                  data.guestIds.includes(occupantId)
                ) {
                  const filtered = data.guestIds.filter(
                    (id) => id !== occupantId
                  );
                  updates[`${rbdPath}/guestIds`] = filtered.length
                    ? filtered
                    : null;
                }
              }
            }
          }

          // --- archive paths ---
          updates[`archive/bookings/${bookingRef}/${occupantId}`] = bookingData;
          updates[`bookings/${bookingRef}/${occupantId}`] = null;

          if (guestDetailsData !== null) {
            updates[`archive/guestsDetails/${bookingRef}/${occupantId}`] =
              guestDetailsData;
          }
          updates[`guestsDetails/${bookingRef}/${occupantId}`] = null;

          if (activitiesData !== null) {
            updates[`archive/activities/${occupantId}`] = activitiesData;
          }
          updates[`activities/${occupantId}`] = null;

          for (const [codeKey, data] of Object.entries(actsByCodeForOcc)) {
            updates[`archive/activitiesByCode/${codeKey}/${occupantId}`] = data;
          }

          if (cityTaxData !== null) {
            updates[`archive/cityTax/${bookingRef}/${occupantId}`] =
              cityTaxData;
          }
          updates[`cityTax/${bookingRef}/${occupantId}`] = null;

          if (completedTasksData !== null) {
            updates[`archive/completedTasks/${occupantId}`] =
              completedTasksData;
          }
          updates[`completedTasks/${occupantId}`] = null;

          if (guestByRoomData !== null) {
            updates[`archive/guestByRoom/${occupantId}`] = guestByRoomData;
          }
          updates[`guestByRoom/${occupantId}`] = null;

          if (guestsByBookingData !== null) {
            updates[`archive/guestsByBooking/${occupantId}`] =
              guestsByBookingData;
          }
          updates[`guestsByBooking/${occupantId}`] = null;

          if (bagStorageData !== null) {
            updates[`archive/bagStorage/${occupantId}`] = bagStorageData;
          }
          updates[`bagStorage/${occupantId}`] = null;

          if (preorderData !== null) {
            updates[`archive/preorder/${occupantId}`] = preorderData;
          }
          updates[`preorder/${occupantId}`] = null;

          if (checkinData !== null && checkInDate) {
            updates[`archive/checkins/${checkInDate}/${occupantId}`] =
              checkinData;
          }

          if (checkoutData !== null) {
            updates[`archive/checkouts/${finalCheckoutDate}/${occupantId}`] =
              checkoutData;
          }
        }

        const remainingOccIds = allOccIds.filter(
          (id) => !occupantIds.includes(id)
        );
        if (remainingOccIds.length === 0) {
          const finSnap = await get(
            ref(database, `financialsRoom/${bookingRef}`)
          );
          if (finSnap.exists()) {
            updates[`archive/financialsRoom/${bookingRef}`] = finSnap.val();
          }
          updates[`financialsRoom/${bookingRef}`] = null;
        }
      }

      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
      }
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [database]);

  return { archiveCheckedOutGuests, loading, error };
}
