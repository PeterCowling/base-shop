import { useEffect, useState } from "react";

import {
  TerminalBatch,
  terminalBatchesSchema,
} from "../../../types/hooks/data/terminalBatchData";

export default function useTerminalBatches() {
  const [batches, setBatches] = useState<TerminalBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchBatches() {
      try {
        const resp = await fetch("/api/terminal-batches", {
          signal: controller.signal,
        });
        if (!resp.ok) throw new Error("Failed to fetch terminal batches");
        const json = await resp.json();
        const result = terminalBatchesSchema.safeParse(json);
        if (!result.success) {
          setError(result.error);
          return;
        }
        setBatches(result.data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    fetchBatches();
    return () => controller.abort();
  }, []);

  return { batches, loading, error };
}
