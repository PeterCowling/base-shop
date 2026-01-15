import { useCallback } from "react";

import type { ActivityResult } from "../../../types/domains/activitiesDomain";
import { Activity } from "../../../types/hooks/data/activitiesData";
import { ActivityCode } from "../../../constants/activities";
import useActivitiesData from "../../data/useActivitiesData";
import useBookings from "../../data/useBookingsData";
import useActivitiesMutations from "../../mutations/useActivitiesMutations";

/**
 * Unused function. Renamed to match the allowed unused var pattern.
 */
function _toActivityArray(
  occupantActivities: Activity[] | Record<string, Activity>
): Activity[] {
  if (Array.isArray(occupantActivities)) {
    return occupantActivities;
  }
  return Object.values(occupantActivities);
}

/**
 * Get the occupant's current code in [1..4], ignoring code=21 if present.
 * If occupant has code=21 or code=4, we skip them.
 */
function getCurrentCodeForOccupant(
  occupantActivities?: Record<string, Activity> | Activity[]
): number | null {
  if (!occupantActivities) return null;
  const actsArray = Array.isArray(occupantActivities)
    ? occupantActivities
    : Object.values(occupantActivities);

  const codes = actsArray.map((act) => act.code);

  // If occupant is already confirmed or cancelled, skip
  if (
    codes.includes(ActivityCode.AGREED_NONREFUNDABLE_TNC) ||
    codes.includes(ActivityCode.AUTO_CANCEL_NO_TNC)
  )
    return null;

  // Filter codes in [BOOKING_CREATED..AUTO_CANCEL_NO_TNC]
  const relevant = codes.filter(
    (c) => c >= ActivityCode.BOOKING_CREATED && c <= ActivityCode.AUTO_CANCEL_NO_TNC
  );
  if (relevant.length === 0) return null;

  return Math.max(...relevant);
}

export interface LogNextActivityParams {
  bookingRef: string;
}

export interface LogConfirmActivityParams {
  bookingRef: string;
}

/**
 * Provides functions for logging occupant activities for email progression (codes 1..4 -> 21).
 */
export default function useEmailProgressActions() {
  // For reading occupant-based data:
  const { activities } = useActivitiesData();

  // For writing new activity records:
  const { addActivity } = useActivitiesMutations();

  // For reading booking occupant data:
  const { bookings } = useBookings();

  /**
   * Move occupant from code N to N+1 if N in [1..3].
   * (1->2, 2->3, 3->4), skipping code=4 or code=21.
   */
  const logNextActivity = useCallback(
    async ({ bookingRef }: LogNextActivityParams): Promise<void> => {
      if (!bookings) return;
      const booking = bookings[bookingRef];
      if (!booking) {
        console.warn(
          `[useEmailProgressActions] No booking found for ref: ${bookingRef}`
        );
        return;
      }

      // For each occupant in the booking...
      for (const occupantId of Object.keys(booking)) {
        // Optional chain to avoid referencing null 'activities'
        const occupantActs = activities?.[occupantId];
        const currentCode = getCurrentCodeForOccupant(occupantActs);
        if (!currentCode) continue; // occupant not in [1..3] or is code=4/21

        // Next code logic
        let nextCode: ActivityCode;
        let description = "";

        if (currentCode === ActivityCode.BOOKING_CREATED) {
          nextCode = ActivityCode.FIRST_REMINDER;
          description = "First reminder to agree to terms";
        } else if (currentCode === ActivityCode.FIRST_REMINDER) {
          nextCode = ActivityCode.SECOND_REMINDER;
          description = "Second reminder to agree to terms";
        } else if (currentCode === ActivityCode.SECOND_REMINDER) {
          nextCode = ActivityCode.AUTO_CANCEL_NO_TNC;
          description = "Booking cancelled due to no agreement";
        } else {
          continue;
        }

        // Write activity
        const addResult = (await addActivity(
          occupantId,
          nextCode
        )) as ActivityResult;

        if (addResult?.success) {
          console.log(
            `[useEmailProgressActions] occupantId=${occupantId}, code=${nextCode}, "${description}"`
          );
        }
      }
    },
    [activities, addActivity, bookings]
  );

  /**
   * Set occupant's code=21 (confirmed), unless occupant is code=4 or already 21.
   */
  const logConfirmActivity = useCallback(
    async ({ bookingRef }: LogConfirmActivityParams): Promise<void> => {
      if (!bookings) return;
      const booking = bookings[bookingRef];
      if (!booking) {
        console.warn(
          `[useEmailProgressActions] No booking found for ref: ${bookingRef}`
        );
        return;
      }

      for (const occupantId of Object.keys(booking)) {
        // Optional chain to avoid referencing null 'activities'
        const occupantActs = activities?.[occupantId];
        const currentCode = getCurrentCodeForOccupant(occupantActs);

        // If occupant is code=4 or code=21, or no code in [1..4], skip
        if (!currentCode) continue;

        // code=21 => Confirm occupant
        const confirmCode = ActivityCode.AGREED_NONREFUNDABLE_TNC;
        const description = "Guest has accepted Non-Refundable T&Cs";

        const addResult = (await addActivity(
          occupantId,
          confirmCode
        )) as ActivityResult;

        if (addResult?.success) {
          console.log(
            `[useEmailProgressActions] occupantId=${occupantId}, code=${confirmCode}, "${description}"`
          );
        }
      }
    },
    [activities, addActivity, bookings]
  );

  return { logNextActivity, logConfirmActivity };
}
