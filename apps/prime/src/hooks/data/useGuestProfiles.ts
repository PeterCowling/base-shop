/**
 * useGuestProfiles.ts
 *
 * Hook to fetch all guest profiles for the current booking.
 * Used by directory views to show other guests.
 */

import { useEffect, useState } from 'react';

import { equalTo, off, onValue, orderByChild, query, ref } from '@/services/firebase';
import logger from '@/utils/logger';

import { readGuestSession } from '../../lib/auth/guestSessionGuard';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { GuestProfiles } from '../../types/guestProfile';

const EMPTY_PROFILES: GuestProfiles = {};

export interface UseGuestProfilesReturn {
  /** All guest profiles indexed by UUID */
  profiles: GuestProfiles;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

/**
 * Hook to subscribe to all guest profiles in Firebase.
 * Returns profiles indexed by UUID.
 *
 * @returns Guest profiles, loading state, and error
 */
export function useGuestProfiles(): UseGuestProfilesReturn {
  const database = useFirebaseDatabase();
  const [profiles, setProfiles] = useState<GuestProfiles>(EMPTY_PROFILES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { bookingId: currentBookingId } = readGuestSession();

  useEffect(() => {
    if (!database) {
      setIsLoading(false);
      return;
    }

    if (!currentBookingId) {
      // Fail closed: without a stay context we should not expose any guest directory data.
      setProfiles(EMPTY_PROFILES);
      setIsLoading(false);
      setError(null);
      return;
    }

    const bookingProfilesQuery = query(
      ref(database, 'guestProfiles'),
      orderByChild('bookingId'),
      equalTo(currentBookingId),
    );

    const unsubscribe = onValue(
      bookingProfilesQuery,
      (snapshot) => {
        try {
          const data = snapshot.val() as GuestProfiles | null;
          setProfiles(data || EMPTY_PROFILES);
          setIsLoading(false);
          setError(null);
        } catch (err) {
          logger.error('[useGuestProfiles] Error processing snapshot:', err); // i18n-exempt -- ENG-421 [ttl=2026-12-31] developer diagnostic
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setIsLoading(false);
        }
      },
      (err) => {
        logger.error('[useGuestProfiles] Firebase error:', err); // i18n-exempt -- ENG-421 [ttl=2026-12-31] developer diagnostic
        setError(err instanceof Error ? err : new Error('Firebase error'));
        setIsLoading(false);
      },
    );

    return () => {
      off(bookingProfilesQuery);
      unsubscribe();
    };
  }, [currentBookingId, database]);

  return { profiles, isLoading, error };
}
