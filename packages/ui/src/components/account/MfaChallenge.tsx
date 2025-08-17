"use client";

// packages/ui/src/components/account/MfaChallenge.tsx
import { useState } from "react";
import { getCsrfToken } from "@acme/shared-utils";

export interface MfaChallengeProps {
  onSuccess?: () => void;
  customerId?: string;
}

export default function MfaChallenge({ onSuccess, customerId }: MfaChallengeProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const csrfToken = getCsrfToken();
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
      setError("Invalid code");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="rounded border p-2"
        placeholder="Enter MFA code"
      />
      <button
        type="submit"
        className="rounded bg-primary px-4 py-2"
        data-token="--color-primary"
      >
        <span className="text-primary-fg" data-token="--color-primary-fg">
          Verify
        </span>
      </button>
      {error && (
        <p className="text-danger" data-token="--color-danger">
          {error}
        </p>
      )}
    </form>
  );
}
