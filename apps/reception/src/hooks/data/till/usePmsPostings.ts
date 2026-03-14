import { useMemo } from "react";

import {
  type PmsPosting,
  pmsPostingsSchema,
} from "../../../types/hooks/data/pmsPostingData";
import useFirebaseSubscription from "../useFirebaseSubscription";

export type PmsPostingWithId = PmsPosting & { id: string };

export default function usePmsPostings() {
  const { data, loading, error } = useFirebaseSubscription<
    Record<string, PmsPosting>
  >("reconciliation/pmsPostings", pmsPostingsSchema);

  const postings = useMemo<PmsPostingWithId[]>(
    () =>
      data
        ? Object.entries(data).map(([id, posting]) => ({ id, ...posting }))
        : [],
    [data]
  );

  return { postings, loading, error };
}
