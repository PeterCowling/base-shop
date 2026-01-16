// /src/types/guestProfile.ts

/**
 * Guest profile data stored per occupant in Firebase.
 * Path: guestProfiles/{uuid}
 *
 * This tracks guest preferences and onboarding status for the current stay.
 * The bookingId field enables per-stay scoping - if the bookingId doesn't
 * match the current booking, the profile is considered stale.
 */
import type { IndexedById } from './indexedById';

/**
 * Guest intent for their stay - affects home screen personalization.
 */
export type GuestIntent = 'social' | 'quiet' | 'mixed';

/**
 * Preferred pace of activities during the stay.
 */
export type GuestPace = 'relaxed' | 'active';

/**
 * Profile completion status - distinguishes between completed, skipped,
 * and partially filled profiles for metrics and banner display.
 */
export type ProfileStatus = 'complete' | 'skipped' | 'partial';

/**
 * Guest profile for a single occupant.
 *
 * @property bookingId - Links profile to specific stay for staleness detection
 * @property profileStatus - Tracks completion state for metrics
 * @property intent - Social vs quiet preference for home personalization
 * @property interests - Selected interests (hiking, food, nightlife, etc.)
 * @property stayGoals - What the guest wants from their stay
 * @property pace - Relaxed vs active preference
 * @property socialOptIn - Opted into hostel activities/chat
 * @property chatOptIn - Opted into group chat specifically
 * @property createdAt - Timestamp when profile was created
 * @property updatedAt - Timestamp of last update
 */
export interface GuestProfile {
  bookingId: string;
  profileStatus: ProfileStatus;
  intent: GuestIntent;
  interests: string[];
  stayGoals: string[];
  pace: GuestPace;
  socialOptIn: boolean;
  chatOptIn: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Default values for guest profile fields.
 * Applied when profile is skipped or missing.
 */
export const DEFAULT_GUEST_PROFILE: Omit<GuestProfile, 'bookingId' | 'createdAt' | 'updatedAt'> = {
  profileStatus: 'partial',
  intent: 'mixed',
  interests: [],
  stayGoals: [],
  pace: 'relaxed',
  socialOptIn: false,
  chatOptIn: false,
};

/**
 * Top-level guestProfiles node in Firebase.
 * guestProfiles => { uuid => GuestProfile }
 */
export type GuestProfiles = IndexedById<GuestProfile>;
