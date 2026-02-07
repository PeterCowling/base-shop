// File: /src/hooks/data/useSingleGuestDetails.ts

import { useCallback, useMemo, useState } from "react";
import { ref, update } from "firebase/database";

import { occupantDetailsSchema } from "../../schemas/occupantDetailsSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { type OccupantDetails } from "../../types/hooks/data/guestDetailsData";

import useFirebaseSubscription from "./useFirebaseSubscription";

/**
 * Represents occupant details keyed by bookingRef => occupantId => occupant data
 */
export interface UseSingleGuestDetailsResult {
  occupantDetails: OccupantDetails | null;
  loading: boolean;
  error: unknown;
  saveField: (fieldName: string, value: unknown) => Promise<void>;
}

/**
 * Custom hook to fetch and update details for a single occupant.
 * Also reads occupant's allocated room from "guestByRoom/occupantId".
 */
export default function useSingleGuestDetails(
  bookingRef?: string,
  occupantId?: string
): UseSingleGuestDetailsResult {
  const database = useFirebaseDatabase();

  const {
    data: occupantData,
    loading: detailsLoading,
    error: detailsError,
  } = useFirebaseSubscription<OccupantDetails>(
    bookingRef && occupantId ? `guestsDetails/${bookingRef}/${occupantId}` : ""
  );
  const {
    data: allocatedRoom,
    loading: allocLoading,
    error: allocError,
  } = useFirebaseSubscription<string>(
    occupantId ? `guestByRoom/${occupantId}/allocated` : ""
  );

  const [mutationError, setMutationError] = useState<Error | null>(null);

  const parsed = useMemo(() => {
    if (!occupantData) return null;
    return occupantDetailsSchema.safeParse(occupantData);
  }, [occupantData]);

  const occupantDetails = useMemo(() => {
    if (!parsed || !parsed.success) return null;
    return { ...parsed.data, allocated: allocatedRoom ?? "" };
  }, [parsed, allocatedRoom]);

  const parseError = parsed && !parsed.success ? parsed.error : null;

  const loading = detailsLoading || allocLoading;
  const error = mutationError || parseError || detailsError || allocError;
  /**
   * Build an update object that uses slash notation, e.g.:
   * buildNestedUpdate("document/type", "Passport") =>
   *   { "document/type": "Passport" }
   */
  const buildNestedUpdate = useCallback((path: string, val: unknown) => {
    return { [path]: val };
  }, []);

  /**
   * Save a single field using slash-notation merges so sibling data remains intact.
   */
  const saveField = useCallback(
    async (fieldName: string, value: unknown): Promise<void> => {
      if (!bookingRef || !occupantId) return;
      try {
        const occupantRef = ref(
          database,
          `guestsDetails/${bookingRef}/${occupantId}`
        );
        const updates = buildNestedUpdate(fieldName, value);
        await update(occupantRef, updates);
        console.log(
          `[useSingleGuestDetails] Updated "${fieldName}" for occupantId=${occupantId}:`,
          value
        );
      } catch (err: unknown) {
        console.error("[useSingleGuestDetails] Error updating occupant:", err);
        if (err instanceof Error) {
          setMutationError(err);
        }
      }
    },
    [bookingRef, occupantId, database, buildNestedUpdate]
  );

  return { occupantDetails, loading, error, saveField };
}
