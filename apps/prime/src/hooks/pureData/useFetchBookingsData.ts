'use client';

// File: /src/hooks/pureData/useFetchBookingsData.ts

/*
  OPT-01: Uses a reverse index (occupantIndex/{uuid} → reservationCode) for O(1)
  lookup instead of downloading the entire bookings table.

  OPT-02: Uses React Query for caching, deduplication, and background refresh.

  Flow:
  1. Read occupantIndex/{uuid} — returns reservation code if previously indexed.
  2. If found, read bookings/{code}/{uuid} directly — single occupant payload.
  3. If not found, fall back to full scan (backwards compat), then write the index
     so subsequent loads are fast (self-healing).
*/

import { useQuery } from '@tanstack/react-query';
import { get, ref, set } from '@/services/firebase';
import logger from '@/utils/logger';
import { useFirebaseDatabase } from '../../services/useFirebase';
import { bookingOccupantDataSchema, type BookingOccupantData } from '../../utils/bookingsSchemas';
import { zodErrorToString } from '../../utils/zodErrorToString';
import useUuid from '../useUuid';

export interface BookingDetails extends BookingOccupantData {
  reservationCode: string;
}

interface UseFetchBookingsDataReturn {
  bookingsData: BookingDetails | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<void>;
}

/**
 * Try to read the occupant's booking via the reverse index.
 * Returns the parsed BookingDetails if found, or null if the index doesn't exist.
 */
async function fetchViaIndex(
  database: ReturnType<typeof import('firebase/database').getDatabase>,
  uuid: string,
): Promise<BookingDetails | null> {
  const indexRef = ref(database, `occupantIndex/${uuid}`);
  const indexSnapshot = await get(indexRef);

  if (!indexSnapshot.exists()) return null;

  const reservationCode = indexSnapshot.val() as string;
  if (!reservationCode) return null;

  // Read the specific occupant record directly
  const occupantRef = ref(database, `bookings/${reservationCode}/${uuid}`);
  const occupantSnapshot = await get(occupantRef);

  if (!occupantSnapshot.exists()) {
    // Index is stale — the booking may have been removed
    logger.warn(`[bookings] Stale occupantIndex for ${uuid}, code=${reservationCode}`);
    return null;
  }

  const occupantParse = bookingOccupantDataSchema.safeParse(occupantSnapshot.val());
  if (!occupantParse.success) {
    const errMsg = zodErrorToString(occupantParse.error);
    logger.error(`[bookings] Invalid occupant data via index for ${uuid}: ${errMsg}`);
    return null;
  }

  return { reservationCode, ...occupantParse.data };
}

/**
 * Full scan fallback: downloads all bookings and searches for the UUID.
 * When found, writes the reverse index so future lookups are O(1).
 */
async function fetchViaFullScan(
  database: ReturnType<typeof import('firebase/database').getDatabase>,
  uuid: string,
): Promise<BookingDetails | null> {
  const bookingsRef = ref(database, 'bookings');
  const snapshot = await get(bookingsRef);

  if (!snapshot.exists()) {
    return null;
  }

  const rawData = snapshot.val();

  for (const [reservationCode, record] of Object.entries(rawData)) {
    const occupant = (record as Record<string, unknown>)[uuid];
    if (!occupant) continue;

    const occupantParse = bookingOccupantDataSchema.safeParse(occupant);
    if (!occupantParse.success) {
      const errMsg = zodErrorToString(occupantParse.error);
      logger.error(`[bookings] Invalid bookings data for ${uuid}: ${errMsg}`);
      throw new Error(`Invalid bookings data: ${errMsg}`);
    }

    const found: BookingDetails = { reservationCode, ...occupantParse.data };

    // Self-healing: write the reverse index for future O(1) lookups
    try {
      const indexRef = ref(database, `occupantIndex/${uuid}`);
      await set(indexRef, reservationCode);
      logger.debug(`[bookings] Wrote occupantIndex for ${uuid} → ${reservationCode}`);
    } catch (indexErr) {
      // Non-critical — the lookup still succeeded
      logger.warn('[bookings] Failed to write occupantIndex:', indexErr);
    }

    return found;
  }

  return null;
}

/**
 * Combined fetch: try index first, fall back to full scan.
 */
async function fetchBookingsData(
  database: ReturnType<typeof import('firebase/database').getDatabase>,
  uuid: string,
): Promise<BookingDetails | null> {
  // 1. Try the fast path via reverse index (2 small reads)
  const indexed = await fetchViaIndex(database, uuid);
  if (indexed) return indexed;

  // 2. Fall back to full scan (backwards compat for un-indexed occupants)
  logger.debug(`[bookings] No occupantIndex for ${uuid}, falling back to full scan`);
  return fetchViaFullScan(database, uuid);
}

export function useFetchBookingsData(): UseFetchBookingsDataReturn {
  const uuid = useUuid();
  const database = useFirebaseDatabase();

  const { data, isLoading, error, refetch: rqRefetch } = useQuery({
    queryKey: ['bookings', uuid],
    queryFn: () => fetchBookingsData(database, uuid!),
    enabled: !!uuid,
  });

  return {
    bookingsData: data ?? null,
    isLoading,
    error: error ?? null,
    refetch: async () => { await rqRefetch(); },
  };
}
