import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckInRow } from "../../types/component/CheckinRow";
import { Activity } from "../../types/hooks/data/activitiesData";
import { FirebaseBookings } from "../../types/hooks/data/bookingsData";
import {
  addDays,
  formatDate,
  subDays,
  parseLocalDate,
} from "../../utils/dateUtils";
import { buildCheckinRows } from "../orchestrations/checkin/buildCheckinRows";
import useActivitiesByCodeData from "./useActivitiesByCodeData";
import useActivitiesData from "./useActivitiesData";
import useBookings from "./useBookingsData";
import { useCheckins } from "./useCheckins";
import useCityTax from "./useCityTax";
import useFinancialsRoom from "./useFinancialsRoom";
import useGuestByRoom from "./useGuestByRoom";
import useGuestDetails from "./useGuestDetails";
import useLoans from "./useLoans";

interface Params {
  selectedDate: string;
  daysBefore?: number;
  daysAfter?: number;
}

interface Result {
  rows: CheckInRow[];
  loading: boolean;
  error: unknown;
  validationError: unknown;
}

export default function useCheckinsTableData({
  selectedDate,
  daysBefore = 1,
  daysAfter = 5,
}: Params): Result {
  const { start, end } = useMemo(() => {
    const base = parseLocalDate(selectedDate) || new Date(selectedDate);
    const s = subDays(base, daysBefore);
    const e = addDays(base, daysAfter);
    return { start: s, end: e };
  }, [selectedDate, daysBefore, daysAfter]);

  const dateQuery = useMemo(
    () =>
      ({
        startAt: formatDate(start),
        endAt: formatDate(end),
      } as const),
    [start, end]
  );

  const {
    activities,
    loading: actLoading,
    error: actError,
  } = useActivitiesData();

  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useBookings<FirebaseBookings>();
  const {
    checkins,
    loading: checkinsLoading,
    error: checkinsError,
  } = useCheckins(dateQuery);
  const isCheckedIn = useCallback(
    (_bookingRef: string, occupantId: string) => {
      const acts = activities?.[occupantId];
      if (!acts) return false;
      return Object.values(acts).some((a) => a.code === 12);
    },
    [activities]
  );

  const {
    guestsDetails,
    loading: guestsLoading,
    error: guestsError,
    validationError: guestValidationError,
  } = useGuestDetails({ isCheckedIn });
  const {
    financialsRoom,
    loading: finLoading,
    error: finError,
  } = useFinancialsRoom();
  const {
    cityTax,
    loading: cityTaxLoading,
    error: cityTaxError,
  } = useCityTax();
  const { loans, loading: loansLoading, error: loansError } = useLoans();

  const {
    guestByRoom,
    loading: gbrLoading,
    error: gbrError,
  } = useGuestByRoom();
  const {
    activitiesByCodes,
    loading: codesLoading,
    error: codesError,
  } = useActivitiesByCodeData({ codes: [21, 5, 6, 7] });

  const loading =
    bookingsLoading ||
    guestsLoading ||
    finLoading ||
    cityTaxLoading ||
    loansLoading ||
    actLoading ||
    checkinsLoading ||
    gbrLoading ||
    codesLoading;

  const [validationError, setValidationError] = useState<unknown>(null);

  const error =
    bookingsError ||
    guestsError ||
    finError ||
    cityTaxError ||
    loansError ||
    actError ||
    checkinsError ||
    gbrError ||
    codesError;

  const codeActivitiesMap = useMemo<Record<string, Activity[]>>(() => {
    const combined: Record<string, Activity[]> = {};
    if (!activitiesByCodes) return combined;

    Object.entries(activitiesByCodes).forEach(([codeStr, occupantMap]) => {
      const codeNum = parseInt(codeStr, 10);
      Object.entries(occupantMap).forEach(([occupantId, activityObj]) => {
        if (!combined[occupantId]) {
          combined[occupantId] = [];
        }
        const recs = Object.values(activityObj).map((item) => ({
          code: codeNum,
          who: item.who,
          timestamp: item.timestamp,
        }));
        combined[occupantId].push(...recs);
      });
    });

    return combined;
  }, [activitiesByCodes]);

  const [rows, setRows] = useState<CheckInRow[]>([]);

  useEffect(() => {
    if (!bookings || error) {
      setRows([]);
      return;
    }

    let valErr: unknown = guestValidationError || null;

    const { rows: built, error: validationErr } = buildCheckinRows({
      bookings,
      guestsDetails,
      financialsRoom,
      cityTax,
      loans: loans ?? undefined,
      activities: activities ?? undefined,
      codeActivitiesMap,
      guestByRoom: guestByRoom ?? undefined,
      checkins: checkins ?? undefined,
      startDate: formatDate(start),
      endDate: formatDate(end),
    });
    if (!valErr && validationErr) {
      valErr = validationErr;
    }
    setValidationError(valErr);
    setRows(built);
  }, [
    bookings,
    checkins,
    guestsDetails,
    financialsRoom,
    cityTax,
    loans,
    activities,
    codeActivitiesMap,
    guestByRoom,
    start,
    end,
    error,
    guestValidationError,
  ]);

  return { rows, loading, error, validationError };
}
