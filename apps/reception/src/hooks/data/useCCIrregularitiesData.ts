import { useMemo } from "react";
import { ccReceiptIrregularitiesSchema } from "../../schemas/ccReceiptIrregularitySchema";
import { CCReceiptIrregularity } from "../../types/hooks/data/ccIrregularityData";
import useFirebaseSubscription from "./useFirebaseSubscription";

export function useCCIrregularitiesData() {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<Record<string, unknown>>("ccIrregularities");

  const { entries: ccIrregularities, error } = useMemo(() => {
    if (!data) {
      return { entries: [] as CCReceiptIrregularity[], error: subError };
    }
    const result = ccReceiptIrregularitiesSchema.safeParse(data);
    if (result.success) {
      return { entries: Object.values(result.data), error: subError };
    }
    return { entries: [] as CCReceiptIrregularity[], error: result.error };
  }, [data, subError]);

  return useMemo(
    () => ({ ccIrregularities, loading, error }),
    [ccIrregularities, loading, error]
  );
}
