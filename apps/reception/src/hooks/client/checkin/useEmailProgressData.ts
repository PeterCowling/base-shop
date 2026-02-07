/* File: src/hooks/clients/useEmailProgressData.ts */

import { useMemo } from "react";

import { EMAIL_CODES } from "../../../constants/emailCodes";
import {
  type EmailProgressData,
  EmailProgressDataSchema,
} from "../../../schemas/emailProgressDataSchema";
import { type ActivityByCodeData } from "../../../types/hooks/data/activitiesByCodeData";
import { type Activity } from "../../../types/hooks/data/activitiesData";
import {
  computeHoursElapsed,
  findTimestampForCode,
} from "../../../utils/dateUtils";
import useActivitiesByCodeData from "../../data/useActivitiesByCodeData";
import useActivitiesData from "../../data/useActivitiesData";
import useBookings from "../../data/useBookingsData";
import useFinancialsRoom from "../../data/useFinancialsRoom";
import useGuestDetails from "../../data/useGuestDetails";

export type { EmailProgressData } from "../../../schemas/emailProgressDataSchema";

// Precompute codes 1 through 25 and ensure stable reference across renders.
const CODES_1_TO_25 = Array.from({ length: 25 }, (_, i) => i + 1);

export interface UseEmailProgressDataResult {
  emailData: EmailProgressData[];
  loading: boolean;
  error: unknown;
}

/**
 * Custom hook that returns email‑eligibility data for occupants whose
 * activity history and booking/transaction state meet the following rules:
 - Booking contains ≥1 non-refundable transaction.
 *   - Occupant is the lead guest.
 *   - Occupant's activity codes *up to 25* consist **only** of the
 *     allowed set {1, 2, 3, 11, 15, 17, 18, 19, 20, 24}.
 *   - Occupant has at least one activity code in that allowed set.
 */
export default function useEmailProgressData(): UseEmailProgressDataResult {
  /* ------------------------------------------------------------------ */
  /* 1) RAW OCCUPANT‑KEYED ACTIVITIES                                    */
  /* ------------------------------------------------------------------ */
  const {
    activities: rawActivities,
    loading: rawActLoading,
    error: rawActError,
  } = useActivitiesData();

  /* ------------------------------------------------------------------ */
  /* 2) CODE‑KEYED ACTIVITIES (1–25)                                     */
  /* ------------------------------------------------------------------ */

  const {
    activitiesByCodes,
    loading: codeBasedLoading,
    error: codeBasedError,
  } = useActivitiesByCodeData({ codes: CODES_1_TO_25 });

  /* ------------------------------------------------------------------ */
  /* 3) RELATED BOOKING / FINANCIAL / GUEST DATA                         */
  /* ------------------------------------------------------------------ */
  const { bookings, loading: bookLoading, error: bookError } = useBookings();

  const {
    guestsDetails,
    loading: guestDetailsLoading,
    error: guestDetailsError,
    validationError: _guestValErr,
  } = useGuestDetails();

  const {
    financialsRoom,
    loading: financialsLoading,
    error: financialsError,
  } = useFinancialsRoom();

  /* ------------------------------------------------------------------ */
  /* 4) LOADING & ERROR AGGREGATION                                      */
  /* ------------------------------------------------------------------ */
  const loading =
    codeBasedLoading ||
    rawActLoading ||
    bookLoading ||
    guestDetailsLoading ||
    financialsLoading;

  const error =
    codeBasedError ||
    rawActError ||
    bookError ||
    guestDetailsError ||
    financialsError;

  /* ------------------------------------------------------------------ */
  /* 5) BUILD occupantId -> Activity[] MAP (MERGE RAW + CODE-BASED)       */
  /* ------------------------------------------------------------------ */
  const codeActivitiesMap = useMemo<Record<string, Activity[]>>(() => {
    const output: Record<string, Activity[]> = {};

    if (!activitiesByCodes) return output;

    Object.entries(activitiesByCodes).forEach(([codeStr, occupantMap]) => {
      if (!occupantMap) return;

      const codeNum = parseInt(codeStr, 10);

      Object.entries(occupantMap).forEach(
        ([occupantId, occupantActivities]) => {
          if (!occupantActivities) return;

          if (!output[occupantId]) output[occupantId] = [];

          Object.values(occupantActivities).forEach(
            (item: ActivityByCodeData) => {
              output[occupantId].push({
                code: codeNum,
                who: item.who,
              });
            }
          );
        }
      );
    });

    return output;
  }, [activitiesByCodes]);

  const allActivitiesMap = useMemo<Record<string, Activity[]>>(() => {
    const merged: Record<string, Activity[]> = {};

    if (rawActivities) {
      Object.entries(rawActivities).forEach(([occupantId, actMap]) => {
        merged[occupantId] = Object.values(actMap);
      });
    }

    Object.entries(codeActivitiesMap).forEach(([occupantId, activities]) => {
      if (!merged[occupantId]) {
        merged[occupantId] = [...activities];
      } else {
        merged[occupantId].push(...activities);
      }
    });

    return merged;
  }, [rawActivities, codeActivitiesMap]);

  /* ------------------------------------------------------------------ */
  /* 6) FINAL EMAIL‑ELIGIBLE DATA                                        */
  /* ------------------------------------------------------------------ */
  // Allowed activity codes are centralized in `EMAIL_CODES`

  const emailData = useMemo<EmailProgressData[]>(() => {
    if (!bookings || !financialsRoom || !guestsDetails) return [];

    return Object.entries(bookings)
      .flatMap(([bookingRef, occupantsMap]) => {
        if (!occupantsMap) return null;

        /* ---- booking must have ≥1 non‑refundable transaction ---------- */
        const fin = financialsRoom[bookingRef];
        if (!fin || !fin.transactions) return null;

        const hasNonRefundable = Object.values(fin.transactions).some(
          (txn) => txn.nonRefundable
        );
        if (!hasNonRefundable) return null;

        /* ---- iterate occupants (lead guests only) --------------------- */
        return Object.entries(occupantsMap).map(
          ([occupantId, occupantData]) => {
            if (!occupantData?.leadGuest) return null;

            const activityList = allActivitiesMap[occupantId] || [];
            const codes = activityList.map((a) => a.code);

            /* -- eligibility tests based on activity codes 1–25 ---------- */
            const hasDisallowedCode = codes.some(
              (c) => c <= 25 && !EMAIL_CODES.has(c)
            );
            if (hasDisallowedCode) return null;

            const allowedCodesPresent = codes.filter((c) => EMAIL_CODES.has(c));

            if (allowedCodesPresent.length === 0) return null;

            /* ---- derive currentCode + hoursElapsed --------------------- */
            const currentCode = Math.max(...allowedCodesPresent);

            const earliestTimestamp = findTimestampForCode(
              activityList,
              currentCode
            );
            const hoursElapsed = computeHoursElapsed(earliestTimestamp);

            /* ---- guest name / email ------------------------------------ */
            const detailsObj = guestsDetails[bookingRef]?.[occupantId] ?? {};
            const occupantName = detailsObj.firstName
              ? `${detailsObj.firstName} ${detailsObj.lastName ?? ""}`.trim()
              : "Unknown Guest";
            const occupantEmail = detailsObj.email ?? "";

            const candidate = {
              occupantId,
              bookingRef,
              occupantName,
              occupantEmail,
              currentCode,
              hoursElapsed,
            };

            try {
              return EmailProgressDataSchema.parse(candidate);
            } catch (e) {
              console.error("Invalid email progress data", e);
              return null;
            }
          }
        );
      })
      .filter((x): x is EmailProgressData => x !== null);
  }, [bookings, financialsRoom, guestsDetails, allActivitiesMap]);

  return { emailData, loading, error };
}
