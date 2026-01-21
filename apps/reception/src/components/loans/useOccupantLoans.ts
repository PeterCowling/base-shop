/**
 * File: src/components/loans/useOccupantLoans.ts
 */

import { useMemo } from "react";

import { useLoanData } from "../../context/LoanDataContext";
import { OccupantLoanData } from "../../types/hooks/data/loansData";

interface UseOccupantLoansResult {
  occupantLoans: OccupantLoanData | null;
  loading: boolean;
  error: unknown;
}

/**
 * Fetches loan transactions for a single occupant at:
 *   loans/<bookingRef>/<occupantId>
 */
export default function useOccupantLoans(
  bookingRef: string,
  occupantId: string
): UseOccupantLoansResult {
  const { loans, loading, error } = useLoanData();

  const occupantLoans = useMemo(() => {
    if (!bookingRef || !occupantId) return null;
    return (loans?.[bookingRef]?.[occupantId] ||
      null) as OccupantLoanData | null;
  }, [loans, bookingRef, occupantId]);

  const memoizedReturn = useMemo(
    () => ({
      occupantLoans,

      loading: bookingRef && occupantId ? loading : false,
      error: bookingRef && occupantId ? error : null,
    }),
    [occupantLoans, bookingRef, occupantId, loading, error]
  );

  return memoizedReturn;
}
