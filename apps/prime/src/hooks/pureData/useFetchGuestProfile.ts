/* File: /src/hooks/pureData/useFetchGuestProfile.ts
   Explanation:
   - Uses React Query for caching guest profile data
   - Cache key: ['guestProfile', uuid]
   - Includes staleness check against current bookingId
   - Stale time: 5 minutes (profile may change during onboarding)
   - Cache time: 30 minutes
*/

import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/services/firebase';
import { get, ref } from '@/services/firebase';
import logger from '@/utils/logger';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { GuestProfile } from '../../types/guestProfile';
import { DEFAULT_GUEST_PROFILE } from '../../types/guestProfile';
import useUuid from '../useUuid';

/**
 * Helper function to fetch guest profile from "guestProfiles/{uuid}".
 * Returns the profile or null if not found.
 */
async function fetchGuestProfile(
  uuid: string,
  database: Database,
): Promise<GuestProfile | null> {
  if (!uuid) {
    return null;
  }
  try {
    const snapshot = await get(ref(database, `guestProfiles/${uuid}`));
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.val() as GuestProfile;
  } catch (error) {
    logger.error('Error fetching guest profile:', error);
    throw error;
  }
}

/**
 * Options for useFetchGuestProfile hook.
 */
export interface UseFetchGuestProfileOptions {
  /** Whether to enable the query (default: true). Useful for lazy loading. */
  enabled?: boolean;
  /** Current booking ID for staleness check. If provided and doesn't match profile's bookingId, returns stale data. */
  currentBookingId?: string;
}

/**
 * Result from useFetchGuestProfile including staleness detection.
 */
export interface UseFetchGuestProfileResult {
  data: GuestProfile | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  /** True if the profile exists but belongs to a different booking */
  isStale: boolean;
  /** Returns default profile values when data is null or stale */
  effectiveProfile: Omit<GuestProfile, 'bookingId' | 'createdAt' | 'updatedAt'>;
  refetch: () => Promise<void>;
}

/**
 * useFetchGuestProfile
 * A "Pure Data" hook to retrieve a guest's profile from Firebase with caching and staleness detection.
 *
 * @param options - Optional configuration including enabled flag and currentBookingId for staleness check
 * @returns { data, error, isLoading, isError, isStale, effectiveProfile, refetch }
 */
export function useFetchGuestProfile(
  options: UseFetchGuestProfileOptions = {},
): UseFetchGuestProfileResult {
  const { enabled: externalEnabled = true, currentBookingId } = options;
  const uuid: string = useUuid();
  const database: Database = useFirebaseDatabase();

  const {
    data,
    error,
    isLoading,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ['guestProfile', uuid],
    queryFn: () => fetchGuestProfile(uuid, database),
    enabled: !!uuid && externalEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const refetch = async (): Promise<void> => {
    await refetchQuery();
  };

  // Staleness check: profile belongs to a different booking
  const isStale =
    !!data && !!currentBookingId && data.bookingId !== currentBookingId;

  // Return default values when no data or stale
  const effectiveProfile =
    data && !isStale
      ? {
          profileStatus: data.profileStatus,
          intent: data.intent,
          interests: data.interests,
          stayGoals: data.stayGoals,
          pace: data.pace,
          socialOptIn: data.socialOptIn,
          chatOptIn: data.chatOptIn,
        }
      : DEFAULT_GUEST_PROFILE;

  return {
    data: data ?? null,
    error: error ?? null,
    isLoading,
    isError: error !== null,
    isStale,
    effectiveProfile,
    refetch,
  };
}
