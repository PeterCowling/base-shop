import { push, ref } from "firebase/database";
import { useCallback, useMemo, useState } from "react";

import { useFirebaseDatabase } from "../../../../../services/useFirebase";
import { getCurrentIsoTimestamp } from "../../../../../utils/dateUtils";

type UseLogSaleInFinProps = Record<string, unknown>;

interface UseLogSaleInFinReturn {
  error: unknown;
  logSaleInFin: (
    salesDetails: string,
    salesPrice: number,
    userName: string,
    transType: string,
    bleep?: string
  ) => Promise<void>;
}

/**
 * useLogSaleInFin:
 * Writes a record into /bar/finManLogs in Firebase.
 */
export function useLogSaleInFin(
  _props: UseLogSaleInFinProps
): UseLogSaleInFinReturn {
  const [error, setError] = useState<unknown>(null);
  const database = useFirebaseDatabase();

  /**
   * Writes the sale details to Firebase under /bar/finManLogs.
   */
  const logSaleInFin = useCallback(
    async (
      salesDetails: string,
      salesPrice: number,
      userName: string,
      transType: string,
      bleep = "N/A"
    ): Promise<void> => {
      try {
        const payload = {
          salesDetails,
          salesPrice,
          userName,
          transType,
          bleep,
          timestamp: getCurrentIsoTimestamp(),
        };
        const finRef = ref(database, "bar/finManLogs");
        await push(finRef, payload);
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [database]
  );

  return useMemo(
    () => ({
      error,
      logSaleInFin,
    }),
    [error, logSaleInFin]
  );
}
