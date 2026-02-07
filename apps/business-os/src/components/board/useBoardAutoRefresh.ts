/**
 * useBoardAutoRefresh Hook
 * BOS-D1-07: Auto-refresh board when cards/ideas change
 *
 * Polls /api/board-changes every 30s and triggers router.refresh()
 * when changes are detected. Stores cursor in localStorage per business.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface BoardChangesResponse {
  cursor: number;
  changes: {
    cards: unknown[];
    ideas: unknown[];
    stage_docs: unknown[];
  };
}

interface StaleCursorResponse {
  cursor?: number;
}

interface UseBoardAutoRefreshOptions {
  businessCode: string;
  enabled?: boolean;
  pollingInterval?: number;
}

const CURSOR_STORAGE_PREFIX = "bos-board-changes-cursor:";

function parseStoredCursor(raw: string | null): number {
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
}

function hasChanges(payload: BoardChangesResponse): boolean {
  return (
    payload.changes.cards.length > 0 ||
    payload.changes.ideas.length > 0 ||
    payload.changes.stage_docs.length > 0
  );
}

export function useBoardAutoRefresh({
  businessCode,
  enabled = true,
  pollingInterval = 30000, // 30 seconds default
}: UseBoardAutoRefreshOptions) {
  const router = useRouter();
  const [cursor, setCursor] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const cursorRef = useRef<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const storageKey = useMemo(
    () => `${CURSOR_STORAGE_PREFIX}${businessCode}`,
    [businessCode]
  );

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    setIsReady(false);
    const storedCursor = window.localStorage.getItem(storageKey);
    setCursor(parseStoredCursor(storedCursor));
    setIsReady(true);
  }, [enabled, storageKey]);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (cursor === null) {
      return;
    }

    window.localStorage.setItem(storageKey, String(cursor));
  }, [cursor, storageKey]);

  useEffect(() => {
    if (!enabled || !isReady) {
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;

    const checkChanges = async () => {
      if (!isMounted.current) return;

      try {
        setIsPolling(true);
        const currentCursor = cursorRef.current ?? 0;
        const query = new URLSearchParams({
          cursor: String(currentCursor),
        });
        if (businessCode !== "global") {
          query.set("business", businessCode);
        }

        const response = await fetch(`/api/board-changes?${query.toString()}`);

        if (response.status === 410) {
          const data = (await response.json()) as StaleCursorResponse;
          if (!isMounted.current) return;
          const nextCursor =
            typeof data.cursor === "number" ? data.cursor : 0;
          setCursor(nextCursor);
          router.refresh();
          setError(null);
          return;
        }

        if (!response.ok) {
          // i18n-exempt -- BOS-D1-07 internal error message [ttl=2026-03-31]
          throw new Error("Failed to fetch board changes");
        }

        const data = (await response.json()) as BoardChangesResponse;

        if (!isMounted.current) return;

        setCursor(data.cursor);

        if (hasChanges(data)) {
          router.refresh();
        }

        setError(null);
      } catch (err) {
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (isMounted.current) {
          setIsPolling(false);
        }
      }
    };

    // Initial check
    void checkChanges();

    // Set up polling interval
    intervalId = setInterval(() => {
      void checkChanges();
    }, pollingInterval);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [businessCode, enabled, isReady, pollingInterval, router]);

  return {
    isPolling,
    error,
    cursor,
    isReady,
  };
}
