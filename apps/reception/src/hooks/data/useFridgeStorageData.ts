// File: /src/hooks/data/useFridgeStorageData.ts

import { useEffect, useState } from "react";

import { fridgeStorageSchema } from "../../schemas/fridgeStorageSchema";
import { type FridgeStorage } from "../../types/hooks/data/fridgeStorageData";

import useFirebaseSubscription from "./useFirebaseSubscription";

/**
 * A data hook for reading the "fridgeStorage" node from Firebase,
 * providing the current fridgeStorage data, as well as loading
 * and error states.
 *
 * We also "sanitize" the data from Firebase so that it
 * strictly adheres to the FridgeStorage shape, ignoring any
 * extra properties.
 */
function useFridgeStorageData() {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<FridgeStorage>("fridgeStorage");

  const [fridgeStorage, setFridgeStorage] = useState<FridgeStorage>({});
  const [error, setError] = useState<unknown>(subError);

  useEffect(() => {
    if (subError) {
      setError(subError);
      return;
    }
    if (!data) {
      setFridgeStorage({});
      setError(null);
      return;
    }
    const res = fridgeStorageSchema.safeParse(data);
    if (res.success) {
      setFridgeStorage(res.data as FridgeStorage);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [data, subError]);

  return { fridgeStorage, loading, error };
}

export default useFridgeStorageData;
