import { useMemo } from "react";

import { DISCREPANCY_LIMIT } from "../../constants/cash";
import {
  type VarianceThresholds,
  varianceThresholdsSchema,
} from "../../schemas/varianceThresholdsSchema";

import useFirebaseSubscription from "./useFirebaseSubscription";

export function useVarianceThresholds() {
  const { data, loading, error } = useFirebaseSubscription<VarianceThresholds>(
    "settings/varianceThresholds",
    varianceThresholdsSchema
  );

  const thresholds = useMemo(
    () => ({
      cash: data?.cash ?? DISCREPANCY_LIMIT,
      keycards: data?.keycards,
    }),
    [data]
  );

  return { thresholds, loading, error };
}
