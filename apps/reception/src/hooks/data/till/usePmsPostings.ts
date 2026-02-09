import { useMemo } from "react";

import {
  type PmsPosting,
  pmsPostingsSchema,
} from "../../../types/hooks/data/pmsPostingData";
import useFirebaseSubscription from "../useFirebaseSubscription";

export default function usePmsPostings() {
  const { data, loading, error } = useFirebaseSubscription<
    Record<string, PmsPosting>
  >("reconciliation/pmsPostings", pmsPostingsSchema);

  const postings = useMemo<PmsPosting[]>(
    () => (data ? Object.values(data) : []),
    [data]
  );

  return { postings, loading, error };
}
