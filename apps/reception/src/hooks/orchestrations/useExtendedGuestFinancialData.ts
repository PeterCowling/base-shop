// File: /src/hooks/dataOrchestrations/useExtendedGuestFinancialData.ts
import { useMemo } from "react";

import { type Guest } from "../../types/component/bookingSearch";
import { type RoomTransaction } from "../../types/hooks/data/financialsRoomData";
import useFinancialsRoom from "../data/useFinancialsRoom";

/**
 * Extended guest interface to include financial data:
 * - balance
 * - totalPaid
 * - totalAdjust
 */
interface ExtendedGuest extends Guest {
  balance: number;
  totalPaid: number;
  totalAdjust: number;
  transactions: RoomTransaction[];
}

/**
 * Data Orchestrator Hook
 * Retrieves guests' financial info from `financialsRoom` by matching the bookingRef.
 * Returns each guest augmented with balance, paid, and adjust amounts.
 */
export default function useExtendedGuestFinancialData(
  guests: Guest[] | undefined
) {
  const { financialsRoom, loading, error } = useFinancialsRoom();

  // Use memo to avoid recomputing merged data every render
  const extendedGuests: ExtendedGuest[] = useMemo(() => {
    if (!guests) return [];

    return guests.map((guest) => {
      const bookingRef = guest.bookingRef;
      const fin = financialsRoom?.[bookingRef];

      const txns: RoomTransaction[] = fin?.transactions
        ? Object.values(fin.transactions)
        : [];

      return {
        ...guest,
        balance: fin?.balance ?? 0,
        totalPaid: fin?.totalPaid ?? 0,
        totalAdjust: fin?.totalAdjust ?? 0,
        transactions: txns,
      };
    });
  }, [guests, financialsRoom]);

  return { extendedGuests, loading, error };
}
