import { useMemo } from "react";

import { primeRequestsByIdSchema } from "../../schemas/primeRequestsSchema";
import {
  type PrimeRequestRecord,
  type PrimeRequestsById,
} from "../../types/hooks/data/primeRequestsData";

import useFirebaseSubscription from "./useFirebaseSubscription";

interface PrimeRequestsByStatus {
  pending: PrimeRequestRecord[];
  approved: PrimeRequestRecord[];
  declined: PrimeRequestRecord[];
  completed: PrimeRequestRecord[];
}

export default function usePrimeRequestsData() {
  const { data, loading, error } =
    useFirebaseSubscription<PrimeRequestsById>(
      "primeRequests/byId",
      primeRequestsByIdSchema,
    );

  const requests = useMemo(() => {
    return Object.values(data ?? {}).sort((a, b) => {
      if (b.submittedAt === a.submittedAt) {
        return a.requestId.localeCompare(b.requestId);
      }
      return b.submittedAt - a.submittedAt;
    });
  }, [data]);

  const byStatus = useMemo<PrimeRequestsByStatus>(() => {
    const grouped: PrimeRequestsByStatus = {
      pending: [],
      approved: [],
      declined: [],
      completed: [],
    };

    requests.forEach((request) => {
      grouped[request.status].push(request);
    });

    return grouped;
  }, [requests]);

  return {
    requests,
    byStatus,
    loading,
    error,
  };
}
