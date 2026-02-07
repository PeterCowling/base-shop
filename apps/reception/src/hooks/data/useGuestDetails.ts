/* src/hooks/data/useGuestDetails.ts */
import { useEffect, useState } from "react";
import {
  type DataSnapshot,
  endAt,
  limitToFirst,
  onValue,
  orderByKey,
  query,
  ref,
  startAt,
} from "firebase/database";

import { occupantRequiredSchema } from "../../components/checkins/docInsert/occupantCompleteHelpers";
import { occupantDetailsSchema } from "../../schemas/occupantDetailsSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import {
  type BookingOccupantDetails,
  type GuestsDetails,
} from "../../types/hooks/data/guestDetailsData";

interface RawDOB {
  yyyy?: unknown;
  mm?: unknown;
  dd?: unknown;
}
/**
 * Parse raw guestsDetails data from Firebase. Invalid occupant records are
 * skipped while valid ones are returned. The number of skipped records is
 * returned so the caller can surface a concise error message if desired.
 */
export interface ParsedGuestDetails {
  data: GuestsDetails;
  invalidCount: number;
  /**
   * A sample of validation issues for debugging. Each entry contains the
   * booking/occupant reference and the associated error messages.
   */
  errors: { ref: string; issues: string[] }[];
}

function parseGuestsDetails(
  raw: unknown,
  isCheckedIn?: (bookingRef: string, occupantId: string) => boolean
): ParsedGuestDetails {
  const parsed: GuestsDetails = {};
  let invalid = 0;
  const errors: { ref: string; issues: string[] }[] = [];
  const MAX_ERRORS = 3;

  if (raw && typeof raw === "object") {
    for (const [bookingRef, occMap] of Object.entries(
      raw as Record<string, unknown>
    )) {
      if (!occMap || typeof occMap !== "object") continue;
      const bookingParsed: Record<string, unknown> = {};
      for (const [occId, details] of Object.entries(
        occMap as Record<string, unknown>
      )) {
        const schema =
          isCheckedIn && isCheckedIn(bookingRef, occId)
            ? occupantRequiredSchema
            : occupantDetailsSchema;
        let candidate = details;
        if (candidate && typeof candidate === "object") {
          const obj = { ...(candidate as Record<string, unknown>) };
          const dob = (obj as { dateOfBirth?: RawDOB }).dateOfBirth;
          if (dob && typeof dob === "object") {
            const cleaned: Record<string, unknown> = {};
            if (
              dob.yyyy !== "" &&
              dob.yyyy !== undefined &&
              dob.yyyy !== null
            ) {
              cleaned.yyyy = dob.yyyy;
            }
            if (dob.mm !== "" && dob.mm !== undefined && dob.mm !== null) {
              cleaned.mm = dob.mm;
            }
            if (dob.dd !== "" && dob.dd !== undefined && dob.dd !== null) {
              cleaned.dd = dob.dd;
            }
            if (Object.keys(cleaned).length > 0) {
              obj.dateOfBirth = cleaned;
            } else {
              delete obj.dateOfBirth;
            }
          }
          candidate = obj;
        }

        const res = schema.safeParse(candidate);
        if (res.success) {
          bookingParsed[occId] = res.data;
        } else {
          invalid += 1;
          if (errors.length < MAX_ERRORS) {
            errors.push({
              ref: `${bookingRef}/${occId}`,
              issues: res.error.issues.map((i) => {
                const path = i.path.join(".") || "value";
                return `${path}: ${i.message}`;
              }),
            });
          }
        }
      }
      if (Object.keys(bookingParsed).length > 0) {
        parsed[bookingRef] = bookingParsed as BookingOccupantDetails;
      }
    }
  }

  return { data: parsed, invalidCount: invalid, errors };
}

/**
 * Data Hook:
 * Retrieves occupant details under /guestsDetails from Firebase
 * without performing any transformations or mutations.
 */
export interface UseGuestDetailsResult {
  guestsDetails: GuestsDetails;
  loading: boolean;
  error: unknown;
  /** Validation issues encountered while parsing occupants. */
  validationError: unknown;
}

export interface UseGuestDetailsParams {
  startAt?: string;
  endAt?: string;
  limitToFirst?: number;
  isCheckedIn?: (bookingRef: string, occupantId: string) => boolean;
}

export default function useGuestDetails(
  params: UseGuestDetailsParams = {}
): UseGuestDetailsResult {
  const {
    startAt: startKey,
    endAt: endKey,
    limitToFirst: limit,
    isCheckedIn,
  } = params;
  const database = useFirebaseDatabase();
  const [guestsDetails, setGuestsDetails] = useState<GuestsDetails>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);
  const [validationError, setValidationError] = useState<unknown>(null);

  useEffect(() => {
    const baseRef = ref(database, "guestsDetails");
    let q = query(baseRef, orderByKey());
    if (startKey) q = query(q, startAt(startKey));
    if (endKey) q = query(q, endAt(endKey));
    if (limit !== undefined) q = query(q, limitToFirst(limit));

    const handleSnap = (snap: DataSnapshot) => {
      if (snap.exists()) {
        const { data, invalidCount, errors } = parseGuestsDetails(
          snap.val(),
          isCheckedIn
        );
        setGuestsDetails(data);
        if (invalidCount > 0) {
          const samples = errors
            .map((e) => `${e.ref} - ${e.issues.join("; ")}`)
            .join("; ");
          const extra = invalidCount - errors.length;
          const msg =
            extra > 0
              ? `Validation failed for ${invalidCount} occupant(s): ${samples}; and ${extra} more`
              : `Validation failed for ${invalidCount} occupant(s): ${samples}`;
          setValidationError(new Error(msg));
          setError(null);
        } else {
          setValidationError(null);
          setError(null);
        }
      } else {
        setGuestsDetails({});
      }
      setLoading(false);
    };

    const handleError = (err: unknown) => {
      setError(err);
      setLoading(false);
    };

    const unsubscribe = onValue(q, handleSnap, handleError);
    return unsubscribe;
  }, [database, startKey, endKey, limit, isCheckedIn]);

  return {
    guestsDetails,
    loading,
    error,
    validationError,
  };
}

export { parseGuestsDetails };
