"use client";

// File: /src/hooks/pureData/useFetchBookingsData.client.ts

/*
  Explanation:
  - The hook's data fetching is centralized in `loadData`, which reads the "bookings" node
    and searches for a matching occupant record.
  - A `refetch` function is provided so that consuming components can trigger a manual refresh.
*/

import { get, ref } from "@/services/firebase";
import logger from "@/utils/logger";
import { useCallback, useEffect, useState } from "react";
import { useFirebaseDatabase } from "../../services/useFirebase";
import {
  bookingOccupantDataSchema,
  type BookingOccupantData,
} from "../../utils/bookingsSchemas";
import { zodErrorToString } from "../../utils/zodErrorToString";
import useUuid from "../useUuid";

export interface BookingDetails extends BookingOccupantData {
  reservationCode: string;
}

interface UseFetchBookingsDataReturn {
  bookingsData: BookingDetails | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<void>;
}

export function useFetchBookingsData(): UseFetchBookingsDataReturn {
  const uuid = useUuid();
  const database = useFirebaseDatabase();
  const [bookingsData, setBookingsData] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  const loadData = useCallback(
    async (cancelled?: { current: boolean }): Promise<void> => {
      if (!uuid) {
        if (!cancelled?.current) {
          setBookingsData(null);
          setError(null);
          setIsLoading(false);
        }
        return;
      }

      const bookingsRef = ref(database, "bookings");
      if (!cancelled?.current) setIsLoading(true);

      try {
        const snapshot = await get(bookingsRef);

        if (!snapshot.exists()) {
          if (!cancelled?.current) {
            setBookingsData(null);
            setError(null);
          }
          return;
        }

        const rawData = snapshot.val();

        let found: BookingDetails | null = null;
        let occupantError: string | null = null;

        for (const [reservationCode, record] of Object.entries(rawData)) {
          const occupant = (record as Record<string, unknown>)[uuid];
          if (!occupant) continue;

          const occupantParse = bookingOccupantDataSchema.safeParse(occupant);
          if (!occupantParse.success) {
            occupantError = zodErrorToString(occupantParse.error);
            logger.error(`Invalid bookings data for ${uuid}: ${occupantError}`);
            break;
          }

          found = { reservationCode, ...occupantParse.data };
          break;
        }

        if (!cancelled?.current) {
          setBookingsData(found);
          setError(occupantError);
        }
      } catch (err) {
        logger.error("Error fetching bookings data:", err);
        if (!cancelled?.current) setError(err);
      } finally {
        if (!cancelled?.current) setIsLoading(false);
      }
    },
    [uuid, database],
  );

  useEffect(() => {
    const state = { current: false };
    loadData(state).catch(() => {
      /* Error is handled in loadData */
    });
    return () => {
      state.current = true;
    };
  }, [loadData]);

  const refetch = useCallback(async (): Promise<void> => {
    await loadData();
  }, [loadData]);

  return { bookingsData, isLoading, error, refetch };
}
