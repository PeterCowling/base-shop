import { useEffect, useState } from "react";

import {
  type PmsPosting,
  pmsPostingsSchema,
} from "../../../types/hooks/data/pmsPostingData";

export default function usePmsPostings() {
  const [postings, setPostings] = useState<PmsPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchPostings() {
      try {
        const resp = await fetch("/api/pms-postings", {
          signal: controller.signal,
        });
        if (!resp.ok) throw new Error("Failed to fetch PMS postings");
        const json = await resp.json();
        const result = pmsPostingsSchema.safeParse(json);
        if (!result.success) {
          setError(result.error);
          return;
        }
        setPostings(result.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPostings();

    return () => {
      controller.abort();
    };
  }, []);

  return { postings, loading, error };
}
