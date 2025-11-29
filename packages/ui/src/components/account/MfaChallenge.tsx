"use client";

// packages/ui/src/components/account/MfaChallenge.tsx
import { useState } from "react";
import { getCsrfToken } from "@acme/shared-utils";
import { useTranslations } from "@acme/i18n";
import enMessages from "@acme/i18n/en.json";

const FALLBACK_MESSAGES = enMessages as Record<string, string>;

export interface MfaChallengeProps {
  onSuccess?: () => void;
  customerId?: string;
}

export default function MfaChallenge({ onSuccess, customerId }: MfaChallengeProps) {
  const t = useTranslations();
  const translate = (key: string) => {
    const val = t(key) as string;
    return val === key ? FALLBACK_MESSAGES[key] ?? key : val;
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
      setError(translate("account.mfa.error.invalid"));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="rounded border p-2"
        placeholder={translate("account.mfa.input.placeholder")}
      />
      <button
        type="submit"
        className="rounded bg-primary px-4 py-2 min-h-11 min-w-11"
        data-token="--color-primary" // i18n-exempt -- DS-1234 [ttl=2025-11-30] — DS token attribute
      >
        <span className="text-primary-fg" data-token="--color-primary-fg"> {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] — DS token attribute */}
          {translate("actions.verify")}
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
