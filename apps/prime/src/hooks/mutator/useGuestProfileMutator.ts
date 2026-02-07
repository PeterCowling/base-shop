import { ref, set, update } from '@/services/firebase';
import logger from '@/utils/logger';
import { useCallback, useState } from 'react';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { GuestProfile } from '../../types/guestProfile';
import useUuid from '../useUuid';

/**
 * Partial representation of a guest profile for incremental updates.
 */
export type GuestProfilePayload = Partial<GuestProfile>;

export interface UseGuestProfileMutatorReturn {
  /** Update specific fields on the guest profile (merge) */
  updateProfile: (payload: GuestProfilePayload) => Promise<void>;
  /** Replace the entire guest profile */
  setProfile: (profile: GuestProfile) => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

/**
 * useGuestProfileMutator
 * A mutator hook for writing guest profile data to Firebase.
 *
 * Provides two methods:
 * - updateProfile: Merges partial updates into existing profile
 * - setProfile: Replaces the entire profile (used for initial creation)
 */
export function useGuestProfileMutator(): UseGuestProfileMutatorReturn {
  const uuid = useUuid();
  const database = useFirebaseDatabase();

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const updateProfile = useCallback(
    async (payload: GuestProfilePayload) => {
      if (!uuid) {
        logger.warn('[useGuestProfileMutator] Missing uuid');
        return;
      }

      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);

      try {
        const profileRef = ref(database, `guestProfiles/${uuid}`);
        await update(profileRef, {
          ...payload,
          updatedAt: Date.now(),
        });

        setIsSuccess(true);
      } catch (error) {
        logger.error('[useGuestProfileMutator] Error in updateProfile:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [uuid, database],
  );

  const setProfile = useCallback(
    async (profile: GuestProfile) => {
      if (!uuid) {
        logger.warn('[useGuestProfileMutator] Missing uuid');
        return;
      }

      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);

      try {
        const profileRef = ref(database, `guestProfiles/${uuid}`);
        const now = Date.now();
        await set(profileRef, {
          ...profile,
          createdAt: profile.createdAt || now,
          updatedAt: now,
        });

        setIsSuccess(true);
      } catch (error) {
        logger.error('[useGuestProfileMutator] Error in setProfile:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [uuid, database],
  );

  return { updateProfile, setProfile, isLoading, isError, isSuccess };
}
