"use client";

// packages/ui/src/components/account/MfaChallenge.tsx
import { useState } from "react";
import { getCsrfToken } from "@acme/shared-utils";
import { useTranslations } from "@acme/i18n";

export interface MfaChallengeProps {
  onSuccess?: () => void;
  customerId?: string;
}

export default function MfaChallenge({ onSuccess, customerId }: MfaChallengeProps) {
  const t = useTranslations();
  // Provide readable fallbacks when translations are not loaded (e.g. plain Jest renders)
  const tf = (key: string, fallback: string) => {
    const val = t(key) as string;
    return val === key ? fallback : val;
  };
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const csrfToken = getCsrfToken();
    // i18n-exempt
    const res = await fetch("/api/mfa/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken ?? "",
      },
      body: JSON.stringify(customerId ? { token, customerId } : { token }),
    });
    const data = await res.json();
    if (data.verified) {
      setError(null);
      onSuccess?.();
    } else {
      setError(tf("account.mfa.error.invalid", "Invalid code"));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="rounded border p-2"
        placeholder={tf("account.mfa.input.placeholder", "Enter MFA code")}
      />
      <button
        type="submit"
        className="rounded bg-primary px-4 py-2 min-h-10 min-w-10"
        data-token="--color-primary" // i18n-exempt -- DS-1234 [ttl=2025-11-30] — DS token attribute
      >
        <span className="text-primary-fg" data-token="--color-primary-fg"> {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] — DS token attribute */}
          {tf("actions.verify", "Verify")}
        </span>
      </button>
      {error && (
        <p className="text-danger" data-token="--color-danger"> {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] — DS token attribute */}
          {error}
        </p>
      )}
    </form>
  );
}
