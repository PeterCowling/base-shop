// packages/template-app/src/app/success/SuccessFinalization.client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type StatusResponse =
  | { ok: true; state: "processing" }
  | { ok: true; state: "finalized"; order: { id: string; sessionId: string; status: string | null } }
  | { ok: false; error: string };

export default function SuccessFinalization({
  processingLabel,
  thanksLabel,
  paymentReceivedLabel,
}: {
  processingLabel: string;
  thanksLabel: string;
  paymentReceivedLabel: string;
}) {
  const searchParams = useSearchParams();

  const identifier = useMemo(() => {
    const sessionId =
      searchParams?.get("session_id") ??
      searchParams?.get("sessionId") ??
      null;
    const orderId = searchParams?.get("orderId") ?? null;
    const raw = (sessionId || orderId || "").trim();
    return raw || null;
  }, [searchParams]);

  const [polling, setPolling] = useState(Boolean(identifier));

  useEffect(() => {
    if (!identifier) {
      setPolling(false);
      return;
    }

    let cancelled = false;
    let attempt = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const schedule = (ms: number) => {
      if (cancelled) return;
      timeout = setTimeout(tick, ms);
    };

    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(
          `/success/status?orderId=${encodeURIComponent(identifier)}`,
          { cache: "no-store" },
        );
        const data = (await res.json().catch(() => null)) as StatusResponse | null;
        if (!cancelled && data?.ok && data.state === "finalized") {
          setPolling(false);
          return;
        }
      } catch {
        // ignore; we'll retry with backoff
      }

      attempt += 1;
      const baseMs = Math.min(500 * Math.pow(1.25, attempt), 5000);
      const jitterMs = baseMs * (0.5 + Math.random());
      schedule(Math.round(jitterMs));
    };

    setPolling(true);
    tick();

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [identifier]);

  if (polling) {
    return (
      <>
        <h1 className="mb-4 text-3xl font-semibold">{processingLabel}</h1>
        <p>{paymentReceivedLabel}</p>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-4 text-3xl font-semibold">{thanksLabel}</h1>
      <p>{paymentReceivedLabel}</p>
    </>
  );
}
