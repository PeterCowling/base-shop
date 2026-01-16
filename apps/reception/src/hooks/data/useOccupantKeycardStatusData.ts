// File: /src/hooks/data/useOccupantKeycardStatusData.ts

import { useMemo } from "react";

import useFirebaseSubscription from "./useFirebaseSubscription";

/** Represents a single occupant transaction. */
export interface OccupantTransaction {
  item: string; // "Keycard" or "No_card" ...
  type: string; // "Loan" or "Refund" or "No_Card"
  count: number;
}

/** A record of occupant transactions keyed by transaction ID. */
export type OccupantTransactions = Record<string, OccupantTransaction>;

/**
 * Fetch occupant transactions from:
 *   loans/<bookingRef>/<occupantId>/txns
 *
 * This hook only returns the raw data; it does not interpret whether occupant
 * has a keycard or not. The calling code can analyze the item/type fields.
 */
export function useOccupantKeycardStatusData(
  bookingRef?: string,
  occupantId?: string
): OccupantTransactions | null {
  const path =
    bookingRef && occupantId ? `loans/${bookingRef}/${occupantId}/txns` : "";
  const { data } = useFirebaseSubscription<OccupantTransactions>(path);

  return useMemo(() => data ?? null, [data]);
}
