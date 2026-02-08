/**
 * useGuestProfiles.ts
 *
 * Hook to fetch all guest profiles for the current booking.
 * Used by directory views to show other guests.
 */

import { useEffect,useState } from 'react';

import { off,onValue, ref } from '@/services/firebase';
import logger from '@/utils/logger';

import { useFirebaseDatabase } from '../../services/useFirebase';
import type { GuestProfiles } from '../../types/guestProfile';

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
  const [profiles, setProfiles] = useState<GuestProfiles>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!database) {
      setIsLoading(false);
      return;
    }

    const profilesRef = ref(database, 'guestProfiles');

    const unsubscribe = onValue(
      profilesRef,
      (snapshot) => {
        try {
          const data = snapshot.val() as GuestProfiles | null;
          setProfiles(data || {});
          setIsLoading(false);
          setError(null);
        } catch (err) {
          logger.error('[useGuestProfiles] Error processing snapshot:', err);
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setIsLoading(false);
        }
      },
      (err) => {
        logger.error('[useGuestProfiles] Firebase error:', err);
        setError(err instanceof Error ? err : new Error('Firebase error'));
        setIsLoading(false);
      },
    );

    return () => {
      off(profilesRef, 'value', unsubscribe);
    };
  }, [database]);

  return { profiles, isLoading, error };
}
