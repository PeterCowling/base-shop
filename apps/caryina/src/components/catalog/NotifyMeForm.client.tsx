"use client";

import { useState } from "react";

import { logAnalyticsEvent } from "@acme/platform-core/analytics/client";

interface NotifyMeFormProps {
  productSlug: string;
}

const CONSENT_LABEL = "I agree to receive a one-time reminder email about this product"; // i18n-exempt -- CARYINA-notify-me [ttl=2026-12-31]
const GENERIC_ERROR_MESSAGE = "Something went wrong — please try again.";

export function NotifyMeForm({ productSlug }: NotifyMeFormProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || done) return;

    setError(null);
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !consent) {
      setError("Please enter your email and consent to receive the reminder.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/notify-me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          productSlug,
          consent,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (data.success) {
        setDone(true);
        void logAnalyticsEvent({ type: "notify_me_submit", productSlug }).catch(() => undefined);
        return;
      }

      setError(data.error ?? GENERIC_ERROR_MESSAGE);
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-foreground" data-cy="notify-me-success">
        Thank you. We&apos;ll email you when this product is available.
      </p>
    );
  }

  return (
    <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
      <div className="space-y-1">
        <label htmlFor="notify-me-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="notify-me-email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          autoComplete="email"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-start gap-2">
        <input
          id="notify-me-consent"
          name="consent"
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          disabled={loading}
          className="mt-1 min-h-11 min-w-11 shrink-0"
        />
        <label htmlFor="notify-me-consent" className="text-sm text-muted-foreground">
          {CONSENT_LABEL}
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !email.trim() || !consent}
        className="btn-primary min-h-11 min-w-11 rounded-full px-6 text-sm disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Notify me"}
      </button>
    </form>
  );
}
