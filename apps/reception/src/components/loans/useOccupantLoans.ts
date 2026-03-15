/**
 * File: src/components/loans/useOccupantLoans.ts
 */

import { useMemo } from "react";

import { useLoanData } from "../../context/LoanDataContext";
import { type OccupantLoanData } from "../../types/hooks/data/loansData";

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

  const hasArgs = !!(bookingRef && occupantId);

  return {
    occupantLoans,
    loading: hasArgs ? loading : false,
    error: hasArgs ? error : null,
  };
}
