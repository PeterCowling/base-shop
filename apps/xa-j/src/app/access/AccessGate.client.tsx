"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy gate UI pending design/i18n overhaul */

import * as React from "react";

type RequestState = "idle" | "loading" | "success" | "error";

type AccessGateProps = {
  monoClassName?: string;
};

function sanitizeInput(value: string, max: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export default function AccessGateClient({ monoClassName }: AccessGateProps) {
  const [handle, setHandle] = React.useState("");
  const [referredBy, setReferredBy] = React.useState("");
  const [note, setNote] = React.useState("");
  const [state, setState] = React.useState<RequestState>("idle");
  const [receipt, setReceipt] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const displayReferredBy = sanitizeInput(referredBy, 120);

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setState("loading");

    try {
      const payload = {
        handle: sanitizeInput(handle, 80),
        referredBy: displayReferredBy,
        note: sanitizeInput(note, 280),
      };
      const response = await fetch("/api/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let message = "Request failed";
        try {
          const data = (await response.json()) as { error?: string };
          if (data?.error === "rate_limited") {
            message = "Too many requests. Try again later.";
          }
        } catch {
          // ignore JSON errors
        }
        throw new Error(message);
      }
      const data = (await response.json()) as { id?: string };
      const rawId = data.id ?? crypto.randomUUID();
      const id = rawId.split("-")[0]?.toUpperCase() ?? "REQ";
      setReceipt(`RQ-${id}`);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setState("error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className={`text-xs uppercase tracking-[0.35em] ${monoClassName ?? ""}`}>
            Request invite
          </div>
          <div className="mt-2 text-sm text-[color:var(--gate-muted)]">
            No email. No outbound links. Just a quiet signal.
          </div>
        </div>
        <div className="hidden rounded-full border border-border-2 bg-muted px-3 py-1 text-[10px] uppercase tracking-[0.4em] text-[color:var(--gate-muted)] md:inline-flex">
          Offline review
        </div>
      </div>

      <form onSubmit={submitRequest} className="space-y-4">
        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          Alias
          <input
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            placeholder="Handle or collective name"
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-3 text-sm text-[color:var(--gate-ink)] placeholder:text-[color:var(--gate-muted)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
            autoComplete="off"
          />
        </label>
        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          Sent by
          <input
            value={referredBy}
            onChange={(event) => setReferredBy(event.target.value)}
            placeholder="Who sent you?"
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-3 text-sm text-[color:var(--gate-ink)] placeholder:text-[color:var(--gate-muted)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
            autoComplete="off"
          />
        </label>
        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          Why you
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What pulls you into the underground?"
            rows={4}
            className="mt-2 w-full resize-none rounded-md border border-border-2 bg-white px-3 py-3 text-sm text-[color:var(--gate-ink)] placeholder:text-[color:var(--gate-muted)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={state === "loading"}
            className="inline-flex items-center gap-2 rounded-md border border-[color:var(--gate-ink)] bg-[color:var(--gate-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "loading" ? "Transmitting..." : "Request access"}
          </button>
          <div className="text-xs text-[color:var(--gate-muted)]">
            We do not send email. Keys move hand to hand.
          </div>
        </div>

        {state === "success" ? (
          <div className="rounded-md border border-border-2 bg-muted p-3 text-sm">
            <div className="text-[color:var(--gate-ink)]">
              Request logged. Your receipt:{" "}
              <span className={monoClassName}>{receipt}</span>
            </div>
            {displayReferredBy ? (
              <div className="mt-1 text-[color:var(--gate-muted)]">
                Sent by: <span className={monoClassName}>{displayReferredBy}</span>
              </div>
            ) : null}
            <div className="mt-1 text-[color:var(--gate-muted)]">
              If approved, you will receive a key from the person who sent you here.
            </div>
          </div>
        ) : null}
        {state === "error" ? (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error ?? "Request failed. Try again."}
          </div>
        ) : null}
      </form>
    </div>
  );
}
