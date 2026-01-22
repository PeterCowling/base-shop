/* File: /src/hooks/data/useAlloggiatiLogs.ts */

import { useEffect, useMemo, useState } from "react";

import {
  type AlloggiatiDateLogs,
  alloggiatiDateLogsSchema,
} from "../../schemas/alloggiatiLogSchema";

import useFirebaseSubscription from "./useFirebaseSubscription";

export type {
  AlloggiatiDateLogs,
  AlloggiatiLogEntry,
} from "../../schemas/alloggiatiLogSchema";
/**
 * Hook: Reads all occupant logs for a given dateKey (YYYY-MM-DD).
 */
export default function useAlloggiatiLogs(dateKey: string) {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<Record<string, unknown>>(`allogharti/${dateKey}`);

  const [logs, setLogs] = useState<AlloggiatiDateLogs | null>(null);
  const [error, setError] = useState<unknown>(subError);

  useEffect(() => {
    if (!data) {
      setLogs(null);
      return;
    }
    const result = alloggiatiDateLogsSchema.safeParse(data);
    if (result.success) {
      setLogs(result.data);
      setError(null);
    } else {
      setLogs(null);
      setError(result.error);
    }
  }, [data]);

  return useMemo(() => ({ logs, loading, error }), [logs, loading, error]);
}
