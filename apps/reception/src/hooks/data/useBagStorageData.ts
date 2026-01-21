// File: /src/hooks/data/useBagStorageData.ts

import { useEffect, useState } from "react";
import { bagStorageSchema } from "../../schemas/bagStorageSchema";
import { BagStorage } from "../../types/hooks/data/bagStorageData";
import useFirebaseSubscription from "./useFirebaseSubscription";

/**
 * A data hook for reading the "bagStorage" node from Firebase,
 * providing the current bagStorage data, as well as loading
 * and error states.
 *
 * We also "sanitize" the data from Firebase so that it
 * strictly adheres to the BagStorage shape, ignoring any
 * extra properties like `isEligible`.
 */
function useBagStorageData() {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<BagStorage>("bagStorage");

  const [bagStorage, setBagStorage] = useState<BagStorage>({});
  const [error, setError] = useState<unknown>(subError);

  useEffect(() => {
    if (subError) {
      setError(subError);
      return;
    }
    if (!data) {
      setBagStorage({});
      setError(null);
      return;
    }
    const res = bagStorageSchema.safeParse(data);
    if (res.success) {
      setBagStorage(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [data, subError]);

  return { bagStorage, loading, error };
}

export default useBagStorageData;
