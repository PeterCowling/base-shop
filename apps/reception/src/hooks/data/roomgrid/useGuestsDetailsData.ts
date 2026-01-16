/** /src/hooks/data/bookings/useGuestsDetailsData.ts */

import { useMemo } from "react";

import useFirebaseSubscription from "../useFirebaseSubscription";

/**
 * Shape for the /guestsDetails node in Firebase.
 *
 * {
 *   "bookingRef123": {
 *     "occ_12345": {
 *       citizenship: "USA",
 *       dateOfBirth: { dd: "01", mm: "05", yyyy: "1980" },
 *       document: { number: "AB123", type: "Passport" },
 *       email: "some@email.com",
 *       firstName: "John",
 *       gender: "M",
 *       language: "en",
 *       lastName: "Doe",
 *       municipality: "",
 *       placeOfBirth: ""
 *     }
 *     ...
 *   }
 *   ...
 * }
 */
export interface IGuestsDetailsData {
  [bookingRef: string]: {
    [occupantId: string]: {
      citizenship: string;
      dateOfBirth: {
        dd: string;
        mm: string;
        yyyy: string;
      };
      document: {
        number: string;
        type: string;
      };
      email: string;
      firstName: string;
      gender: string;
      language: string;
      lastName: string;
      municipality: string;
      placeOfBirth: string;
    };
  };
}

/**
 * Pure Data Hook: Retrieves raw /guestsDetails data from Firebase.
 *
 * How to avoid breaking other code:
 * - This hook provides occupant name, email, ID details, etc.
 * - Consumers can combine it with the /bookings data to produce
 *   a full occupant + reservation object.
 */
export default function useGuestsDetailsData() {
  const { data, loading, error } =
    useFirebaseSubscription<IGuestsDetailsData>("guestsDetails");
  const guestsDetailsData = useMemo(() => data ?? {}, [data]);

  return { guestsDetailsData, loading, error };
}
