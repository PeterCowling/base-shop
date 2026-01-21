// File: /src/hooks/mutations/useActivitiesMutations.ts

import { get, ref, update } from "firebase/database";
import { useCallback, useMemo, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import useEmailGuest from "../../services/useEmailGuest";
import { useFirebaseDatabase } from "../../services/useFirebase";
import {
  ActivityDataInput,
  ActivityResult,
} from "../../types/domains/activitiesDomain";
import { Activity } from "../../types/hooks/data/activitiesData";
import { getItalyIsoString } from "../../utils/dateUtils";

/**
 * Generates a unique ID for an activity.
 */
function generateActivityId(): string {
  return `act_${Date.now()}`;
}

export default function useActivitiesMutations() {
  const database = useFirebaseDatabase();
  const { sendEmailGuest } = useEmailGuest();
  const { user } = useAuth(); // Access the authenticated user

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * List of codes that should trigger an email to the occupant.
   */
  const relevantCodes = useMemo<number[]>(() => [2, 3, 4, 21, 5, 6, 7, 8], []);

  /**
   * If code is relevant, fetch occupant's reservationCode and send an email.
   */
  const maybeSendEmailGuest = useCallback(
    async (occupantId: string, code: number): Promise<void> => {
      if (!database) return;
      if (!relevantCodes.includes(code)) return;

      try {
        const guestRef = ref(database, `guestsByBooking/${occupantId}`);
        const snapshot = await get(guestRef);
        if (snapshot.exists()) {
          const guestData = snapshot.val();
          const reservationCode: string | undefined =
            guestData?.reservationCode;
          if (reservationCode) {
            await sendEmailGuest(reservationCode);
          } else {
            console.warn(
              `[useActivitiesMutations] No reservationCode found for occupant ${occupantId}`
            );
          }
        } else {
          console.warn(
            `[useActivitiesMutations] No guest data found for occupant ${occupantId}`
          );
        }
      } catch (err) {
        console.error(
          `[useActivitiesMutations] Error fetching guest booking reference for occupant ${occupantId}:`,
          err
        );
      }
    },
    [database, relevantCodes, sendEmailGuest]
  );

  /**
   * Adds an activity to the database and returns an ActivityResult.
   */
  const addActivity = useCallback(
    async (occupantId: string, code: number): Promise<ActivityResult> => {
      setLoading(true);
      setError(null);

      if (!database) {
        setLoading(false);
        return { success: false, error: "Database not initialized" };
      }

      if (!user) {
        const noUserError = "No user is logged in; cannot add activity.";
        setError(noUserError);
        setLoading(false);
        return { success: false, error: noUserError };
      }

      try {
        const activityId = generateActivityId();
        const timestamp = getItalyIsoString();
        const finalWho = user.user_name || "System";

        const newActivity: Activity = {
          code,
          who: finalWho,
          timestamp,
        };

        // Single atomic update
        const updates: Record<string, unknown> = {};
        updates[`activities/${occupantId}/${activityId}`] = newActivity;
        updates[`activitiesByCode/${code}/${occupantId}/${activityId}`] = {
          who: finalWho,
          timestamp,
        };

        await update(ref(database), updates);
        await maybeSendEmailGuest(occupantId, code);

        setLoading(false);
        return {
          success: true,
          data: newActivity,
          message: "Activity added successfully",
        };
      } catch (err) {
        const msg = (err as Error).message;
        setError(msg);
        setLoading(false);
        console.error("[useActivitiesMutations] addActivity error:", err);
        return { success: false, error: msg };
      }
    },
    [database, maybeSendEmailGuest, user]
  );

  /**
   * Helper to remove the last activity for a given occupant & code.
   * We look up occupant's activities, find the newest activity with matching code,
   * remove it from both /activities and /activitiesByCode.
   */
  const removeLastActivity = useCallback(
    async (occupantId: string, code: number): Promise<ActivityResult> => {
      setLoading(true);
      setError(null);

      if (!database) {
        setLoading(false);
        return { success: false, error: "Database not initialized" };
      }

      if (!user) {
        const noUserError = "No user is logged in; cannot remove activity.";
        setError(noUserError);
        setLoading(false);
        return { success: false, error: noUserError };
      }

      try {
        // Load all occupant's activities
        const occupantActivitiesRef = ref(database, `activities/${occupantId}`);
        const snapshot = await get(occupantActivitiesRef);
        if (!snapshot.exists()) {
          setLoading(false);
          return {
            success: false,
            error: "No activities found to remove",
          };
        }

        const activitiesObj = snapshot.val() as Record<
          string,
          { code: number; who: string; timestamp: string }
        >;
        // Convert to array of [activityId, activity], then filter by code
        const matching = Object.entries(activitiesObj)
          .filter(([, act]) => act.code === code)
          .map(([activityId, act]) => ({
            activityId,
            code: act.code,
            timestamp: act.timestamp,
          }));

        if (matching.length === 0) {
          // no logs found for this code
          setLoading(false);
          return {
            success: false,
            error: "No matching activities found to remove",
          };
        }

        // Find the newest activity by timestamp
        matching.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        const lastActivity = matching[matching.length - 1];

        // Remove from both /activities and /activitiesByCode
        const updates: Record<string, null> = {};
        updates[`activities/${occupantId}/${lastActivity.activityId}`] = null;
        updates[
          `activitiesByCode/${code}/${occupantId}/${lastActivity.activityId}`
        ] = null;

        await update(ref(database), updates);

        setLoading(false);
        return {
          success: true,
          data: undefined, // we removed, so there's no "new" activity object
          message: "Last activity removed successfully",
        };
      } catch (err) {
        const msg = (err as Error).message;
        setError(msg);
        setLoading(false);
        console.error(
          "[useActivitiesMutations] removeLastActivity error:",
          err
        );
        return { success: false, error: msg };
      }
    },
    [database, user]
  );

  /**
   * Wrapper that logs an activity without returning a result.
   * Safe to pass to components that expect no return value.
   */
  const logActivity = useCallback(
    async (occupantId: string, code: number): Promise<void> => {
      if (!user) {
        console.error(
          "[useActivitiesMutations] logActivity error: No user is logged in"
        );
        return;
      }
      await addActivity(occupantId, code);
    },
    [addActivity, user]
  );

  /**
   * Saves an arbitrary activity defined by ActivityDataInput.
   */
  const saveActivity = useCallback(
    async (
      occupantId: string,
      activityData: ActivityDataInput
    ): Promise<ActivityResult> => {
      setLoading(true);
      setError(null);

      if (!database) {
        setLoading(false);
        return { success: false, error: "Database not initialized" };
      }

      if (!user) {
        const noUserError = "No user is logged in; cannot save activity.";
        setError(noUserError);
        setLoading(false);
        return { success: false, error: noUserError };
      }

      try {
        const activityId = generateActivityId();
        const timestamp = getItalyIsoString();
        const finalWho = user.user_name || "System";
        const code = activityData.code;

        const newActivity: Activity = {
          code,
          who: finalWho,
          timestamp,
        };

        const updates: Record<string, unknown> = {};
        updates[`activities/${occupantId}/${activityId}`] = newActivity;
        updates[`activitiesByCode/${code}/${occupantId}/${activityId}`] = {
          who: finalWho,
          timestamp,
        };

        await update(ref(database), updates);
        await maybeSendEmailGuest(occupantId, code);

        setLoading(false);
        return {
          success: true,
          data: newActivity,
          message: "Activity saved successfully",
        };
      } catch (err) {
        const msg = (err as Error).message;
        setError(msg);
        setLoading(false);
        console.error("[useActivitiesMutations] saveActivity error:", err);
        return { success: false, error: msg };
      }
    },
    [database, maybeSendEmailGuest, user]
  );

  /**
   * Return all mutators for external usage.
   */
  return {
    addActivity,
    removeLastActivity,
    saveActivity,
    logActivity,
    loading,
    error,
  };
}
