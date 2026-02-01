/**
 * useBoardAutoRefresh Hook
 * BOS-D1-07: Auto-refresh board when cards/ideas change
 *
 * Polls /api/board-version every 30s and triggers router.refresh()
 * when version changes.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface BoardVersionResponse {
  version: string;
  business: string;
}

interface UseBoardAutoRefreshOptions {
  businessCode: string;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useBoardAutoRefresh({
  businessCode,
  enabled = true,
  pollingInterval = 30000, // 30 seconds default
}: UseBoardAutoRefreshOptions) {
  const router = useRouter();
  const [lastVersion, setLastVersion] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

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

    let intervalId: NodeJS.Timeout | null = null;

    const checkVersion = async () => {
      if (!isMounted.current) return;

      try {
        setIsPolling(true);
        const response = await fetch(
          `/api/board-version?business=${encodeURIComponent(businessCode)}`
        );

        if (!response.ok) {
          // i18n-exempt -- BOS-D1-07 internal error message [ttl=2026-03-31]
          throw new Error("Failed to fetch board version");
        }

        const data = (await response.json()) as BoardVersionResponse;

        if (!isMounted.current) return;

        // On first check, just store the version
        if (lastVersion === null) {
          setLastVersion(data.version);
          setError(null);
          return;
        }

        // If version changed, refresh the board
        if (data.version !== lastVersion) {
          setLastVersion(data.version);
          router.refresh();
        }

        setError(null);
      } catch (err) {
        if (isMounted.current) {
          // i18n-exempt -- BOS-D1-07 internal error message [ttl=2026-03-31]
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (isMounted.current) {
          setIsPolling(false);
        }
      }
    };

    // Initial check
    void checkVersion();

    // Set up polling interval
    intervalId = setInterval(() => {
      void checkVersion();
    }, pollingInterval);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [businessCode, enabled, pollingInterval, lastVersion, router]);

  return {
    isPolling,
    error,
    lastVersion,
  };
}
