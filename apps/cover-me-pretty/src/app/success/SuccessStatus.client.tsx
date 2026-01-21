"use client";

import { useEffect, useState } from "react";

type Props = {
  orderId?: string;
  processingTitle: string;
  processingMessage: string;
  successTitle: string;
  successMessage: string;
};

const POLL_INTERVAL_MS = 1500;
const isTestEnv =
  typeof process !== "undefined" && process.env.NODE_ENV === "test";

function normalizeOrderId(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("pi_") || value.startsWith("cs_")) return undefined;
  return value;
}

export default function SuccessStatus({
  orderId,
  processingTitle,
  processingMessage,
  successTitle,
  successMessage,
}: Props) {
  const [resolvedOrderId, setResolvedOrderId] = useState<string | undefined>(() =>
    normalizeOrderId(orderId),
  );
  const [storageChecked, setStorageChecked] = useState(false);
  const [finalized, setFinalized] = useState(false);

  useEffect(() => {
    if (resolvedOrderId || storageChecked) return;
    try {
      const raw = window.sessionStorage.getItem("lastOrder");
      if (raw) {
        const parsed = JSON.parse(raw) as { orderId?: string };
        const storedOrderId = normalizeOrderId(parsed.orderId);
        if (storedOrderId) {
          setResolvedOrderId(storedOrderId);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setStorageChecked(true);
    }
  }, [resolvedOrderId, storageChecked]);

  useEffect(() => {
    if (resolvedOrderId) {
      let cancelled = false;
      let timeoutId: number | undefined;
      const poll = async () => {
        try {
          const res = await fetch(
            `/api/order-status?orderId=${encodeURIComponent(resolvedOrderId)}`,
            { cache: "no-store" },
          );
          if (res.ok) {
            const data = (await res.json().catch(() => ({}))) as {
              finalized?: boolean;
            };
            if (data.finalized) {
              setFinalized(true);
              return;
            }
          }
        } catch {
          /* ignore */
        }
        if (!cancelled && !isTestEnv) {
          timeoutId = window.setTimeout(poll, POLL_INTERVAL_MS);
        }
      };
      poll();
      return () => {
        cancelled = true;
        if (timeoutId) window.clearTimeout(timeoutId);
      };
    }

    if (storageChecked) {
      setFinalized(true);
    }
  }, [resolvedOrderId, storageChecked]);

  if (!finalized) {
    return (
      <>
        <h1 className="mb-4 text-3xl font-semibold">{processingTitle}</h1>
        <p>{processingMessage}</p>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-4 text-3xl font-semibold">{successTitle}</h1>
      <p>{successMessage}</p>
    </>
  );
}
