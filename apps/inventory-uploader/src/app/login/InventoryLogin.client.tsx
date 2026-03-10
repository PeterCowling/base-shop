"use client";

import type { FormEvent } from "react";
import { useId, useRef, useState } from "react";

type Feedback = { kind: "error" | "success"; message: string };

export function InventoryLoginClient() {
  const tokenInputId = useId();
  const tokenInputRef = useRef<HTMLInputElement | null>(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/inventory/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        throw new Error("Invalid credentials");
      }
      window.location.assign("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setFeedback({ kind: "error", message });
      tokenInputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gate-muted">
        Enter your admin token to access the inventory console.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label
          htmlFor={tokenInputId}
          className="block text-xs uppercase tracking-label text-gate-muted"
        >
          Admin Token
          <div className="mt-2 flex items-center gap-2">
            <input
              id={tokenInputId}
              ref={tokenInputRef}
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className="w-full rounded-md border border-gate-border bg-gate-input px-3 py-3 text-sm text-gate-ink placeholder:text-gate-muted transition-colors focus:border-gate-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-gate-accent focus-visible:ring-offset-1"
              type={tokenVisible ? "text" : "password"}
              autoComplete="off"
              autoFocus
              aria-invalid={feedback?.kind === "error"}
              data-testid="inventory-login-token"
            />
            <button
              type="button"
              onClick={() => setTokenVisible((prev) => !prev)}
              // eslint-disable-next-line ds/min-tap-size -- INV-0001 operator-desktop-tool compact layout
              className="shrink-0 rounded-md border border-gate-border px-3 py-3 text-2xs text-gate-muted transition hover:text-gate-ink"
              aria-label={tokenVisible ? "Hide token" : "Show token"}
            >
              {tokenVisible ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <button
          type="submit"
          disabled={busy}
          // eslint-disable-next-line ds/enforce-layout-primitives, ds/min-tap-size -- INV-0001 operator-desktop-tool
          className="inline-flex items-center gap-2 rounded-md bg-gate-accent px-4 py-2.5 text-sm font-semibold text-gate-on-accent transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gate-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="inventory-login-submit"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        {feedback ? (
          <div
            role={feedback.kind === "error" ? "alert" : "status"}
            aria-live={feedback.kind === "error" ? "assertive" : "polite"}
            className={feedback.kind === "error" ? "text-sm text-danger-fg" : "text-sm text-success-fg"}
            data-testid="inventory-login-feedback"
          >
            {feedback.message}
          </div>
        ) : null}
      </form>
    </div>
  );
}
