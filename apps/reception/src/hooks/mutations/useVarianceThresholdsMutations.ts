import { useCallback, useMemo } from "react";
import { ref, set } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import type { VarianceThresholds } from "../../schemas/varianceThresholdsSchema";
import { logSettingChange } from "../../services/logSettingChange";
import { useFirebaseDatabase } from "../../services/useFirebase";

export function useVarianceThresholdsMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const updateThresholds = useCallback(
    async (
      newThresholds: VarianceThresholds,
      previousThresholds: VarianceThresholds | null
    ) => {
      await logSettingChange(database, {
        user: user?.user_name ?? "unknown",
        setting: "varianceThresholds",
        oldValue: previousThresholds ?? null,
        newValue: newThresholds,
      });
      await set(ref(database, "settings/varianceThresholds"), newThresholds);
    },
    [database, user]
  );

  return useMemo(() => ({ updateThresholds }), [updateThresholds]);
}
