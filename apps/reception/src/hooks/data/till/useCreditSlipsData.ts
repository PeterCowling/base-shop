import { useMemo } from "react";

import { type CreditSlip } from "../../../types/component/Till";
import useFirebaseSubscription from "../useFirebaseSubscription";

/**
 * Reads all credit slip entries from `/creditSlips` in real time.
 */
export function useCreditSlipsData() {
  const { data, loading, error } =
    useFirebaseSubscription<Record<string, CreditSlip>>("creditSlips");

  const creditSlips = useMemo(() => (data ? Object.values(data) : []), [data]);

  return useMemo(
    () => ({ creditSlips, loading, error }),
    [creditSlips, loading, error]
  );
}
