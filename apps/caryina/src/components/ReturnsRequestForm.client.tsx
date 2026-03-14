"use client";

import { useState } from "react";

type RequestType = "cancellation" | "return" | "exchange" | "faulty";

const REQUEST_TYPE_OPTIONS: Array<{ value: RequestType; label: string }> = [
  { value: "cancellation", label: "Cancellation" },
  { value: "return", label: "Return" },
  { value: "exchange", label: "Exchange" },
  { value: "faulty", label: "Faulty item" },
];

export function ReturnsRequestForm() {
  const [orderReference, setOrderReference] = useState("");
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState<RequestType>("return");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/returns-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderReference,
          email,
          requestType,
          message,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setStatus("error");
        setError("We could not submit your request. Please check the form or email support directly.");
        return;
      }

      setStatus("success");
      setOrderReference("");
      setEmail("");
      setRequestType("return");
      setMessage("");
    } catch {
      setStatus("error");
      setError("We could not submit your request. Please email support directly.");
    }
  }

  return (
    <section className="rounded-3xl border border-border/70 bg-accent-soft p-6">
      <div className="max-w-2xl space-y-3">
        <h2 className="text-2xl font-display">Start a return or cancellation request</h2>
        <p className="text-sm text-muted-foreground">
          Use this form for cancellations, returns, exchanges, or faulty-item reports. We will
          email you back with next steps.
        </p>
      </div>

      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">Order reference</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-4 py-3"
            value={orderReference}
            onChange={(event) => setOrderReference(event.target.value)}
            required
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">Email</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-4 py-3"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-foreground">Request type</span>
          <select
            className="w-full rounded-xl border border-border bg-background px-4 py-3"
            value={requestType}
            onChange={(event) => setRequestType(event.target.value as RequestType)}
          >
            {REQUEST_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-foreground">Details</span>
          <textarea
            className="min-h-36 w-full rounded-xl border border-border bg-background px-4 py-3"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
          />
        </label>

        <div className="md:col-span-2 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-fg disabled:opacity-60"
          >
            {status === "submitting" ? "Submitting..." : "Submit request"}
          </button>
          {status === "success" ? (
            <p className="text-sm text-foreground">Request submitted. Check your email for confirmation.</p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
