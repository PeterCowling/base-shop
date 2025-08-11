"use client";

// packages/ui/src/components/account/MfaChallenge.tsx
import { useState } from "react";

export interface MfaChallengeProps {
  onSuccess?: () => void;
}

export default function MfaChallenge({ onSuccess }: MfaChallengeProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const csrfToken =
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("csrf_token="))
            ?.split("=")[1]
        : undefined;
    const res = await fetch("/api/mfa/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken ?? "",
      },
      body: JSON.stringify({ token }),
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
        className="rounded bg-primary px-4 py-2 text-primary-fg"
      >
        Verify
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
